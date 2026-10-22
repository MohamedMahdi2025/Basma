// Public API and webhooks (2026-10-22): node tests/api.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-22T09:00:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no) { if (toks[no]) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode }); const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
person('1000', 'مدير النظام', 'admin'); person('3001', 'الموارد البشرية', 'hr'); person('5001', 'موظف', 'employee');
// webhook endpoints answer from this list; Sheets REST calls still reach the harness
const sheetsFetch = B.ctx.UrlFetchApp.fetch, posts = []; let answer = 200;
B.ctx.UrlFetchApp = { fetch: (url, o) => { if (/sheets\.googleapis/.test(url)) return sheetsFetch(url, o); posts.push({ url, o }); return { getResponseCode: () => answer, getContentText: () => '' }; } };

console.log('API keys');
ok(call('3001', 'apiKeySave', { label: 'x', scopes: ['employees'] }).error === 'forbidden', 'only the administrator issues API keys');
let k = call('1000', 'apiKeySave', { label: 'Power BI', scopes: ['employees', 'org'] });
ok(k.ok && /^hrk_/.test(k.key) && k.orgId === '1001', 'the administrator gets a key, shown once', k);
ok(!JSON.stringify(B.sheets.apiKeys._rows).includes(k.key.split('_').pop()), 'the key itself is never stored, only its fingerprint');
let q = B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key, resource: 'employees' });
ok(q.ok && q.total === 3 && q.rows[0].empNo && !q.hasMore, 'an integration reads the employees with the key', q);
ok(!q.rows.some(r => 'basic' in r || 'iban' in r || 'nationalId' in r || 'pwHash' in r || 'actHash' in r || 'tokenVer' in r), 'no pay, bank, ID or secret field is ever in an answer', Object.keys(q.rows[0]));
ok(B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key.slice(0, -2) + 'zz', resource: 'employees' }).error === 'bad_api_key', 'a wrong key is refused');
ok(B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key, resource: 'attendance' }).error === 'scope_missing', 'a key reads only its scopes');
ok(B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key, resource: 'salaries' }).error === 'unknown_resource', 'unknown resources are refused');
ok(B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key, resource: 'departments' }).ok, 'the organisation structure with the org scope');
const csv = B.ctx.doGet({ parameter: { org: '1001', key: k.key, resource: 'employees', format: 'csv' } });
ok(typeof csv === 'string' && csv.charCodeAt(0) === 0xFEFF && /^﻿id,empNo,name/.test(csv) && csv.includes('مدير النظام'), 'Power BI / Excel read it with a GET link, as CSV', String(csv).slice(0, 80));
const org2 = B.raw({ action: 'orgCreate', setupKey: 'k', nameAr: 'منشأة أخرى', adminName: 'م', adminEmpNo: '1' });
ok(B.raw({ action: 'apiQuery', orgId: org2.orgId, apiKey: k.key, resource: 'employees' }).error === 'bad_api_key', 'a key of one organisation means nothing to another');
const kid = call('1000', 'apiKeyList', {}).rows[0];
ok(kid.uses === 3 && kid.lastUsedAt, 'the administrator sees when and how often each key was used', kid);
call('1000', 'apiKeySave', { id: kid.id });
ok(B.raw({ action: 'apiQuery', orgId: '1001', apiKey: k.key, resource: 'employees' }).error === 'bad_api_key', 'a revoked key stops at once');

console.log('Webhooks');
ok(call('1000', 'webhookSave', { url: 'http://hooks.example.com/x', events: ['employee.created'] }).error === 'bad_url', 'only https');
ok(call('1000', 'webhookSave', { url: 'https://10.1.2.3/x', events: ['employee.created'] }).error === 'bad_url' && call('1000', 'webhookSave', { url: 'https://localhost/x', events: ['employee.created'] }).error === 'bad_url', 'never an address inside a network');
const w = call('1000', 'webhookSave', { url: 'https://hooks.example.com/hris', events: ['employee.created', 'employee.updated', 'employee.left'] });
ok(w.ok && /^whsec_/.test(w.secret), 'a webhook gets its signing secret, shown once', w);
B.setNow(B.now() + 15000);
const added = call('3001', 'empSave', { emp: { empNo: '5002', name: 'موظفة جديدة' } });
let p = posts.find(x => JSON.parse(x.o.payload).event === 'employee.created');
ok(p && p.url === 'https://hooks.example.com/hris', 'adding an employee sends employee.created', posts.length);
const body = p && p.o.payload, h = p && p.o.headers, expect = h && crypto.createHmac('sha256', w.secret).update(h['X-HRIS-Timestamp'] + '.' + body).digest('hex');
ok(h && h['X-HRIS-Signature'] === 'sha256=' + expect && h['X-HRIS-Org'] === '1001', 'it is signed: HMAC-SHA256 of timestamp.body with the secret', h);
ok(JSON.parse(body).data.empNo === '5002' && !/basic|iban|actHash|pwHash/.test(body), 'the event carries the job data, never pay or secrets', JSON.parse(body).data);
const n = posts.length;
const b2 = B.call({ action: 'authBegin', empNo: '5001' }); B.call({ action: 'authFinish', credential: devs['5001'].get(b2.options) });
call('3001', 'empSave', { emp: { id: added.emp.id, empNo: '5002', name: 'موظفة جديدة' } });
B.setNow(B.now() + 60000); call('1000', 'zoneSave', { zone: { name: 'HQ', lat: 24.7, lng: 46.6, radius: 150 } });
ok(!posts.slice(n).some(x => JSON.parse(x.o.payload).event === 'employee.updated'), 'saving an employee with nothing changed sends nothing');
answer = 500; B.setNow(B.now() + 15000);
call('3001', 'empSave', { emp: { id: added.emp.id, empNo: '5002', name: 'موظفة جديدة', title: 'محاسبة' } });
let d = call('1000', 'webhookDeliveries', {}).rows.find(x => x.event === 'employee.updated');
ok(d && d.status === 'pending' && d.attempts === 1 && d.lastCode === 500, 'a failed delivery waits and retries', d);
answer = 200; B.setNow(B.now() + 120000);
call('1000', 'zoneSave', { zone: { name: 'Branch', lat: 24.8, lng: 46.7, radius: 150 } });
d = call('1000', 'webhookDeliveries', {}).rows.find(x => x.event === 'employee.updated');
ok(d && d.status === 'sent' && d.attempts === 2, 'and is delivered on the next try', d);
call('1000', 'webhookSave', { id: w.hook.id, test: true }); B.setNow(B.now() + 60000); call('1000', 'zoneSave', { zone: { name: 'Third', lat: 24.9, lng: 46.8, radius: 150 } });
ok(posts.some(x => JSON.parse(x.o.payload).event === 'ping'), 'the administrator can send a test event');
const w2 = call('1000', 'webhookSave', { id: w.hook.id, events: ['employee.created'], rotate: true });
ok(w2.ok && w2.secret !== w.secret, 'the secret can be rotated (the old one stops at once)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
