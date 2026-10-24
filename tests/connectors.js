// Owner-key connectors: AI assistant, WhatsApp digest, Google/Microsoft sign-in, device punches. node tests/connectors.js
// Outbound calls are answered by a fake here; nothing leaves the machine.
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-04T07:00:00Z');
const B = load({ setupKeyHash: sha('k'), now: T0 });

// ---- fake outbound world
const sent = [], res = (code, obj) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(obj || {}) });
const real = B.ctx.UrlFetchApp.fetch;
let aiReply = { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'رصيدك 21 يوما. راجع السياسة [POL-2026-00001].' }], usage: { input_tokens: 9000, output_tokens: 40, cache_read_input_tokens: 8000 } };
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
B.ctx.UrlFetchApp.fetch = (url, o) => {
  o = o || {};
  if (url.startsWith('https://api.anthropic.com/')) { sent.push({ kind: 'ai', url, o, body: JSON.parse(o.payload) }); return res(200, aiReply); }
  if (url.startsWith('https://graph.facebook.com/')) { sent.push({ kind: 'wa', url, o, body: JSON.parse(o.payload) }); return res(200, { messages: [{ id: 'wamid' }] }); }
  if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
    const tok = decodeURIComponent(url.split('id_token=')[1]);
    if (tok === 'good-google') return res(200, { aud: 'gcid.apps.googleusercontent.com', iss: 'https://accounts.google.com', email: 'Sara@Example.SA', email_verified: 'true', exp: String(Math.floor(T0 / 1000) + 3600), hd: 'example.sa' });
    if (tok === 'other-app') return res(200, { aud: 'someone-else', iss: 'accounts.google.com', email: 'sara@example.sa', email_verified: 'true', exp: String(Math.floor(T0 / 1000) + 3600) });
    return res(400, { error: 'invalid_token' });
  }
  if (url.startsWith('https://graph.microsoft.com/v1.0/me')) {
    const tok = o.headers.Authorization.slice(7), c = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString());
    return c.valid ? res(200, { mail: c.mail, userPrincipalName: c.mail }) : res(401, {});
  }
  return real(url, o);
};
const msTok = c => 'h.' + b64u(c) + '.sig';

const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role, extra) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: Object.assign({ empNo: no, name, role }, extra || {}) });
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const direct = fn => { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; };

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr', { phone: '0559876543' });
person('5001', 'سارة', 'employee', { email: 'sara@example.sa', phone: '0501234567' });
person('5002', 'خالد', 'employee', { email: 'khaled@example.sa' });
call('3001', 'policySave', { policy: { titleAr: 'سياسة الإجازات', bodyAr: 'الإجازة السنوية 21 يوما وتصبح 30 بعد خمس سنوات.' } });

console.log('AI HR assistant');
ok(call('5001', 'aiStatus').enabled === false, 'off by default');
ok(call('5001', 'aiAsk', { question: 'كم رصيدي؟' }).error === 'ai_not_configured', 'asking while off is refused, nothing is sent');
B.props.ANTHROPIC_API_KEY = 'test-key';
ok(call('5001', 'aiAsk', { question: 'x' }).error === 'ai_not_configured', 'a key alone is not enough: the administrator must switch it on');
ok(call('1000', 'settingsSave', { settings: { aiAssistant: true } }).ok, 'the administrator switches it on');
let r = call('5001', 'aiAsk', { question: 'كم رصيد إجازتي السنوية؟', history: [{ role: 'assistant', text: 'skip me' }, { role: 'user', text: 'مرحبا' }, { role: 'assistant', text: 'أهلا' }] });
const req = sent.filter(x => x.kind === 'ai').pop();
ok(r.ok && /21/.test(r.answer) && r.cites.join() === 'POL-2026-00001', 'the answer comes back with the policy it cited', r);
ok(req && req.body.model === 'claude-opus-5-5' && req.o.headers['x-api-key'] === 'test-key' && req.o.headers['anthropic-version'], 'it calls the Claude API with the key from Script properties');
ok(req.body.fallbacks === 'default' && /server-side-fallback/.test(req.o.headers['anthropic-beta']) && req.body.output_config.effort === 'low', 'with refusal fallbacks and low effort for chat');
ok(req.body.system[0].cache_control && /سياسة الإجازات/.test(req.body.system[0].text) && /POL-2026-00001/.test(req.body.system[0].text), 'the company policies go first, marked for caching');
ok(/سارة/.test(req.body.system[1].text) && !/خالد/.test(JSON.stringify(req.body)), 'only the asker\'s own record is sent, never a colleague');
ok(req.body.messages.map(m => m.role).join() === 'user,assistant,user' && req.body.messages[0].content === 'مرحبا', 'history is cleaned to alternate turns starting with the user');
aiReply = { stop_reason: 'refusal', content: [], usage: {} };
ok(call('5001', 'aiAsk', { question: 'x' }).refused === true, 'a refusal is reported as such');
aiReply = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }], usage: {} };
for (let i = 0; i < 20; i++) call('5002', 'aiAsk', { question: 'q' + i });
ok(call('5002', 'aiAsk', { question: 'one more' }).error === 'ai_daily_limit', '20 questions a day per person');
ok(!JSON.stringify(B.sheets.audit._rows).includes('كم رصيد'), 'questions are not stored, only counts in the audit');

console.log('WhatsApp digest');
ok(B.ctx.waPhone_('0501234567') === '966501234567' && B.ctx.waPhone_('+966 50 123 4567') === '966501234567' && B.ctx.waPhone_('0112345678') === '', 'Saudi mobiles are put in international form; landlines are skipped');
ok(call('1000', 'waTest').error === 'whatsapp_not_configured', 'off until the Meta details are in Script properties');
Object.assign(B.props, { WA_PHONE_ID: '1234567890', WA_TOKEN: 'meta-token', WA_TEMPLATE: 'hr_digest' });
call('5002', 'requestCreate', { request: { type: 'letter', payload: { letterType: 'salary', addressee: 'بنك' } } }); // gives HR something waiting
call('1000', 'settingsSave', { settings: { whatsappDigest: true, notifyHour: 7 } });
B.setNow(Date.parse('2026-10-04T08:00:00Z'));
const before = sent.filter(x => x.kind === 'wa').length;
call('1000', 'settingsSave', { settings: { notifyHour: 7 } }); // any write request runs the sweep lazily
const wa = sent.filter(x => x.kind === 'wa');
ok(wa.some(x => x.body.to === '966559876543'), 'a write request after the hour sends HR their digest by WhatsApp', wa.map(x => x.body.to));
ok(wa.filter(x => x.body.to === '966559876543').length === 1 && wa.length === before, 'and only once a day, however many requests follow', [before, wa.length]);
const anyWa = wa[0];
ok(!anyWa || (anyWa.o.headers.Authorization === 'Bearer meta-token' && anyWa.body.template.name === 'hr_digest' && /^\d+$/.test(anyWa.body.template.components[0].parameters[0].text)), 'a digest is the approved template with only the count', anyWa && anyWa.body);
ok(!JSON.stringify(wa).match(/خالد|بنك|salary/), 'no names or request details go to WhatsApp');

console.log('Single sign-on');
let o = B.raw({ action: 'orgCheck', orgId: '1001' });
ok(o.ok && o.sso && o.sso.google === '' && o.sso.microsoft === null, 'no sign-in buttons until a client ID is set');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'google', credential: 'good-google' }).error === 'sso_not_configured', 'and the action is refused');
Object.assign(B.props, { SSO_GOOGLE_CLIENT_ID: 'gcid.apps.googleusercontent.com', SSO_GOOGLE_DOMAIN: 'example.sa', SSO_MS_CLIENT_ID: 'ms-app', SSO_MS_TENANT: 'tenant-1' });
o = B.raw({ action: 'orgCheck', orgId: '1001' });
ok(o.sso.google === 'gcid.apps.googleusercontent.com' && o.sso.microsoft.tenant === 'tenant-1', 'the sign-in screen learns which buttons to show');
r = B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'google', credential: 'good-google' });
ok(r.ok && r.me.id === ids['5001'] && r.token, 'Google sign-in finds the employee by verified e-mail (any letter case)', r.error);
ok(B.call({ action: 'me', token: r.token }).ok, 'and the session works');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'google', credential: 'other-app' }).error === 'sso_failed', 'a Google token issued to another app is refused');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'google', credential: 'forged' }).error === 'sso_failed', 'a token Google does not vouch for is refused');
ok(B.raw({ action: 'ssoLogin', provider: 'google', credential: 'good-google' }).error === 'org_required', 'sign-in still needs the Org ID');
r = B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'microsoft', credential: msTok({ valid: true, appid: 'ms-app', tid: 'tenant-1', mail: 'khaled@example.sa' }) });
ok(r.ok && r.me.id === ids['5002'], 'Microsoft sign-in works for our app and tenant', r.error);
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'microsoft', credential: msTok({ valid: true, appid: 'other', tid: 'tenant-1', mail: 'khaled@example.sa' }) }).error === 'sso_failed', 'a Microsoft token from another app is refused');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'microsoft', credential: msTok({ valid: true, appid: 'ms-app', tid: 'other-tenant', mail: 'khaled@example.sa' }) }).error === 'sso_failed', 'and from another tenant');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'microsoft', credential: msTok({ valid: false, appid: 'ms-app', tid: 'tenant-1', mail: 'khaled@example.sa' }) }).error === 'sso_failed', 'a token Microsoft rejects is refused');
ok(B.raw({ action: 'ssoLogin', orgId: '1001', provider: 'microsoft', credential: msTok({ valid: true, appid: 'ms-app', tid: 'tenant-1', mail: 'nobody@example.sa' }) }).error === 'sso_no_account', 'an e-mail with no employee gets no session');

console.log('Punches from devices');
B.setNow(Date.parse('2026-10-04T14:00:00Z'));
let k = call('1000', 'apiKeySave', { label: 'ZKTeco lobby', scopes: ['device'] });
ok(k.ok && k.key, 'the administrator issues a device key');
const rk = call('1000', 'apiKeySave', { label: 'BI', scopes: ['attendance'] }).key;
ok(B.raw({ action: 'devicePunch', orgId: '1001', apiKey: rk, events: [{ empNo: '5001', ts: '2026-10-04 07:58' }] }).error === 'scope_missing', 'a read key cannot push punches');
r = B.raw({ action: 'devicePunch', orgId: '1001', apiKey: k.key, events: [{ empNo: '5001', ts: '2026-10-04 07:58:10', deviceId: 'ZK-1' }, { empNo: '5001', ts: '2026-10-04 16:31:00' }, { empNo: '9999', ts: '2026-10-04 08:00' }, { empNo: '5002', ts: 'not a time' }] });
ok(r.ok && r.added === 2 && r.unknown.join() === '9999' && r.bad === 1, 'known employees are recorded, unknown numbers and bad times are reported', r);
const ps = direct(() => B.ctx.readAll_('punches').filter(p => p.empId === ids['5001'] && p.source === 'device'));
ok(ps.length === 2 && ps[0].type === 'in' && ps[1].type === 'out' && ps[0].ts === '2026-10-04T04:58:10.000Z' && ps[0].status === 'ok' && ps[0].flags === 'device', 'device local time is Riyadh; in then out by order', ps.map(p => [p.type, p.ts, p.status]));
r = B.raw({ action: 'devicePunch', orgId: '1001', apiKey: k.key, events: [{ empNo: '5001', ts: '2026-10-04 07:58:40' }] });
ok(r.ok && r.added === 0 && r.duplicate === 1, 'sending the same punch again is harmless');
ok(B.raw({ action: 'devicePunch', orgId: '1001', apiKey: k.key, events: [{ empNo: '5001', ts: '2026-12-01 08:00' }] }).bad === 1, 'a time in the future is refused');
ok(B.raw({ action: 'devicePunch', orgId: '1001', apiKey: 'hrk_nope_' + 'x'.repeat(30), events: [{ empNo: '5001', ts: '2026-10-04 08:00' }] }).error === 'bad_api_key', 'a wrong key is refused');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
