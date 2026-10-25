// Wave 5 modules (backend/Wave5.gs): node tests/wave5.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-11-04T07:00:00Z'); // Wednesday 2026-11-04, 10:00 in Riyadh
const B = load({ setupKeyHash: sha('k'), now: T0 });

const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const tasks = no => (call(no, 'myTasks').tasks || []).reduce((o, x) => (o[x.kind] = x.count, o), {});

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('5001', 'مدير التشغيل', 'employee');
person('5002', 'سائق الصهريج', 'employee');
person('5003', 'مسؤول السلامة', 'employee');
person('5004', 'فني الصيانة', 'employee');
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], hireDate: '2024-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], managerId: ids['5001'], hireDate: '2024-01-01', nationality: 'SA' } });
let r = call('1000', 'hrRolesSave', { id: ids['5003'], extraRoles: 'hse' });
ok(r.ok, 'the administrator grants the safety officer role', r);
tok('5003', true);

// ===================================================================== 1. HSE
console.log('HSE: reports');
r = call('5002', 'hseReport', { report: { kind: 'near_miss', severity: 'high', occurredAt: '2026-11-03T09:15', place: 'محطة التعبئة 2', description: 'انزلق الخرطوم أثناء التفريغ وكاد يصيب الزميل', immediateAction: 'أوقفنا التفريغ' } });
ok(r.ok && /^HSE-2026-/.test(r.report.ref) && r.report.status === 'open', 'any employee reports a near miss and gets a number', r);
const rep1 = r.report;
r = call('5004', 'hseReport', { report: { kind: 'hazard', severity: 'medium', occurredAt: '2026-11-04T08:00', place: 'المستودع', description: 'رف مائل قد يسقط على الممرات', anonymous: true } });
ok(r.ok && r.report.anonymous && !r.report.reporter, 'an anonymous report carries no reporter', r);
const rep2 = r.report;
const raw = direct(() => B.ctx.findBy_('hseReports', 'id', rep2.id));
ok(raw.reportedBy === '' && raw.injuryId === '', 'and stores no link to the reporter at all (not even for HR)', raw);
ok(!call('5002', 'hseReport', { report: { kind: 'fire', severity: 'high', occurredAt: '2026-11-03T09:15', place: 'x', description: 'وصف طويل بما يكفي' } }).ok, 'an unknown type is refused');
ok(call('5002', 'hseReport', { report: { kind: 'hazard', severity: 'low', occurredAt: '2026-11-09T09:15', place: 'x', description: 'وصف طويل بما يكفي' } }).error === 'bad_date', 'a future date is refused');

r = call('5002', 'hseList');
ok(r.ok && r.rows.length === 1 && r.rows[0].id === rep1.id && !r.officer, 'the reporter sees only their own report');
r = call('5004', 'hseList');
ok(r.ok && r.rows.length === 0, 'the anonymous reporter cannot see it later (by design)');
r = call('5001', 'hseList');
ok(r.ok && r.rows.length === 1 && r.rows[0].id === rep1.id, 'the manager sees reports by their people, never the anonymous one');
r = call('5003', 'hseList');
ok(r.ok && r.rows.length === 2 && r.officer, 'the safety officer sees every report');
ok(tasks('5003').hse_new === 2, 'the officer\'s bell counts new reports without an investigator', tasks('5003'));

console.log('HSE: investigation and corrective actions');
ok(call('5002', 'hseUpdate', { id: rep1.id, investigatorId: ids['5003'] }).error === 'forbidden', 'an employee cannot run the investigation');
r = call('5003', 'hseUpdate', { id: rep1.id, investigatorId: ids['5003'] });
ok(r.ok && r.report.status === 'investigating', 'the officer assigns the investigator', r);
r = call('5003', 'hseUpdate', { id: rep1.id, rootCategory: 'equipment', rootCause: 'وصلة الخرطوم بالية ولم تُفحص منذ ستة أشهر' });
ok(r.ok && r.report.rootCause && r.report.status === 'actions', 'the root cause is recorded');
ok(call('5002', 'hseList').rows[0].rootCause === '', 'the reporter sees the root cause only once the report is closed');
r = call('5003', 'hseActionSave', { capa: { reportId: rep1.id, title: 'استبدال وصلات الخراطيم في المحطة 2', ownerId: ids['5004'], dueDate: '2026-11-10' } });
ok(r.ok && /^CAPA-/.test(r.action.ref) && r.action.status === 'open', 'a corrective action gets an owner and a due date', r);
const act = r.action;
ok(call('5003', 'hseActionSave', { capa: { reportId: rep1.id, title: 'إجراء متأخر', ownerId: ids['5004'], dueDate: '2026-11-01' } }).error === 'bad_date', 'a due date in the past is refused');
ok(tasks('5004').hse_action === 1, 'the owner\'s bell shows the action', tasks('5004'));
ok(call('5003', 'hseUpdate', { id: rep1.id, close: true, note: 'تم' }).error === 'actions_open', 'the report cannot close while an action is open');
ok(call('5003', 'hseActionStep', { id: act.id, step: 'done', note: 'x' }).error === 'forbidden', 'only the owner marks it done');
ok(call('5004', 'hseActionStep', { id: act.id, step: 'done' }).error === 'note_required', 'done needs a note of what was done');
r = call('5004', 'hseActionStep', { id: act.id, step: 'done', note: 'استبدلت أربع وصلات' });
ok(r.ok && r.action.status === 'done', 'the owner marks it done');
ok(call('5004', 'hseActionStep', { id: act.id, step: 'verify' }).error === 'forbidden', 'the owner cannot verify their own action');
ok(tasks('5003').hse_verify === 1, 'the officer\'s bell shows the action to verify');
r = call('5003', 'hseActionStep', { id: act.id, step: 'verify' });
ok(r.ok && r.action.status === 'verified', 'the officer verifies it');
r = call('5003', 'hseUpdate', { id: rep1.id, close: true, note: 'أغلق بعد استبدال الوصلات' });
ok(r.ok && r.report.status === 'closed', 'with every action verified the report closes');
ok(call('5002', 'hseList').rows[0].rootCause, 'and now the reporter sees the root cause');
ok(call('5003', 'hseUpdate', { id: rep1.id, severity: 'low' }).error === 'already_closed', 'a closed report is final');
r = call('5003', 'hseActionSave', { capa: { reportId: rep2.id, title: 'تثبيت الرف بالجدار', ownerId: ids['5003'], dueDate: '2026-11-06' } });
call('5003', 'hseActionStep', { id: r.action.id, step: 'done', note: 'ثبت' });
ok(call('5003', 'hseActionStep', { id: r.action.id, step: 'verify' }).error === 'cannot_verify_own', 'the officer cannot verify an action they own either');
ok(call('3001', 'hseActionStep', { id: r.action.id, step: 'verify' }).ok, 'HR verifies it instead');
ok(call('3001', 'hseUpdate', { id: rep2.id, close: true, note: 'تم تثبيت الرف' }).ok, 'a hazard may close without a root cause');

console.log('HSE: protective equipment');
ok(call('5002', 'ppeIssue', { ppe: { empId: ids['5002'], item: 'helmet' } }).error === 'forbidden', 'an employee cannot issue equipment');
r = call('5003', 'ppeIssue', { ppe: { empId: ids['5002'], item: 'safety_shoes', size: '43', qty: 1, issuedOn: '2026-11-04', replaceBy: '2026-11-20' } });
ok(r.ok && r.ppe.due && r.ppe.status === 'issued', 'the officer issues shoes; a replacement within 30 days is flagged', r);
const pp = r.ppe;
ok(call('5003', 'ppeIssue', { ppe: { empId: ids['5002'], item: 'helmet', issuedOn: '2026-11-04', replaceBy: '2026-11-01' } }).error === 'bad_range', 'a replacement date before the issue date is refused');
ok(tasks('5002').ppe_ack === 1, 'the employee is asked to confirm receipt');
ok(call('5004', 'ppeStep', { id: pp.id, step: 'ack' }).error === 'forbidden', 'nobody else confirms for them');
ok(call('5002', 'ppeStep', { id: pp.id, step: 'ack' }).ok && !tasks('5002').ppe_ack, 'the employee confirms');
ok(call('5002', 'ppeList').rows.length === 1 && call('5004', 'ppeList').rows.length === 0, 'each employee sees only their own equipment');
ok(call('5003', 'ppeStep', { id: pp.id, step: 'replaced' }).ok, 'the officer records the replacement');

console.log('HSE: safety figures');
let pn = 0;
const punch = (no, date, hin, hout) => direct(() => { B.ctx.append_('punches', { id: 'P' + (++pn), empId: ids[no], type: 'in', ts: date + 'T' + hin + ':00+03:00', date, zoneId: '', status: 'ok', flags: '' }); B.ctx.append_('punches', { id: 'P' + (++pn), empId: ids[no], type: 'out', ts: date + 'T' + hout + ':00+03:00', date, zoneId: '', status: 'ok', flags: '' }); });
punch('5002', '2026-11-02', '07:00', '17:00'); punch('5004', '2026-11-02', '08:00', '16:00');
call('5001', 'injuryReport', { injury: { empId: ids['5002'], occurredAt: '2026-11-02T10:00', place: 'المحطة', description: 'جرح في اليد أثناء العمل' } });
const inj = call('3001', 'injuryList').rows[0];
call('3001', 'injuryUpdate', { id: inj.id, offFrom: '2026-11-03', offTo: '2026-11-04' });
ok(call('5002', 'hseStats').error === 'forbidden', 'an employee does not see the safety figures');
r = call('5003', 'hseStats');
ok(r.ok && r.hours === 18 && r.lti === 1 && r.recordable === 1, 'hours come from the punches; the injury with days off is a lost-time injury', r);
ok(r.ltifr === Math.round(1e6 / 18 * 100) / 100 && r.trir === Math.round(2e5 / 18 * 100) / 100, 'LTIFR per million hours and TRIR per 200,000 hours', [r.ltifr, r.trir]);
ok(r.daysSinceLti === 2 && r.byKind.near_miss === 1 && r.byRoot.equipment === 1, 'days since the last lost-time injury and the breakdowns', r);

// ===================================================================== 2. push notifications
console.log('Push notifications');
{
  const pushes = [], realFetch = B.ctx.UrlFetchApp.fetch;
  let pushReply = 201;
  B.ctx.UrlFetchApp.fetch = (url, o) => {
    if (/^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]*notify\.windows\.com|[a-z0-9.-]*push\.apple\.com)\//.test(url)) { pushes.push({ url, o }); return { getResponseCode: () => pushReply, getContentText: () => '' }; }
    return realFetch(url, o);
  };
  r = call('5002', 'pushKey');
  const pub = Buffer.from(r.key, 'base64url');
  ok(r.ok && pub.length === 65 && pub[0] === 4 && r.devices === 0, 'everyone gets the public VAPID key (65-byte uncompressed P-256)', r);
  ok(call('5004', 'pushKey').key === r.key, 'one key pair for the whole system, made once');
  ok(call('5002', 'pushSubscribe', { endpoint: 'https://evil.example.com/push/1' }).error === 'bad_url', 'an endpoint that is not a browser push service is refused (no requests to arbitrary addresses)');
  ok(call('5002', 'pushSubscribe', { endpoint: 'http://fcm.googleapis.com/fcm/send/x' }).error === 'bad_url', 'plain http is refused');
  ok(call('5002', 'pushTest').error === 'no_push_device', 'a test needs a device first');
  const EP = 'https://fcm.googleapis.com/fcm/send/abc123', EP2 = 'https://web.push.apple.com/QXYZ';
  r = call('5002', 'pushSubscribe', { endpoint: EP, ua: 'test' });
  ok(r.ok && call('5002', 'pushKey').devices === 1, 'the employee turns notifications on for a device', r);
  ok(call('5002', 'pushSubscribe', { endpoint: EP }).ok && call('5002', 'pushKey').devices === 1, 'subscribing the same device again does not duplicate it');
  r = call('5002', 'pushTest');
  ok(r.ok && r.result.sent === 1 && pushes.length === 1, 'a test push goes to the device', r);
  const p = pushes[0];
  ok(p.o.payload === '' && p.o.headers.TTL && p.o.headers.Urgency === 'normal', 'the push carries no payload at all (nothing about the person leaves the system)', p.o.headers);
  const auth = p.o.headers.Authorization, m = auth.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/);
  ok(m && m[4] === Buffer.from(pub).toString('base64url'), 'the VAPID header carries the JWT and the public key', auth);
  const claims = JSON.parse(Buffer.from(m[2], 'base64url').toString());
  ok(claims.aud === 'https://fcm.googleapis.com' && claims.exp > T0 / 1000 && claims.exp <= T0 / 1000 + 24 * 3600 && /^https:|^mailto:/.test(claims.sub), 'the JWT names the push service, expires within 24 h and carries a contact', claims);
  const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.slice(1, 33).toString('base64url'), y: pub.slice(33).toString('base64url') }, format: 'jwk' });
  ok(crypto.verify('sha256', Buffer.from(m[1] + '.' + m[2]), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url')), 'the ES256 signature verifies with Node crypto (what the push services check)');
  ok(call('5002', 'pushTest').error === 'too_many_attempts', 'tests are limited to one a minute');

  // the sweep: a push only when the bell count goes up
  pushes.length = 0;
  B.ctx.cache_().remove('push:sweep'); B.ctx.READ_MEMO_ = {}; B.ctx.pushSweep_();
  ok(pushes.length === 0, 'nothing new for the person: no push');
  call('5003', 'ppeIssue', { ppe: { empId: ids['5002'], item: 'gloves', qty: 2 } }); // a new bell item for 5002
  B.ctx.cache_().remove('push:sweep'); B.ctx.READ_MEMO_ = {}; B.ctx.pushSweep_();
  ok(pushes.length === 1 && pushes[0].url === EP, 'a new item for the person: one push to their device', pushes.length);
  B.ctx.cache_().remove('push:sweep'); B.ctx.READ_MEMO_ = {}; B.ctx.pushSweep_();
  ok(pushes.length === 1, 'the same count again: no second push');
  B.ctx.READ_MEMO_ = {}; B.ctx.pushSweep_();
  ok(pushes.length === 1, 'the sweep runs at most every two minutes');
  // a dropped subscription is retired
  call('5004', 'pushSubscribe', { endpoint: EP2 });
  pushReply = 410;
  ok(call('5004', 'pushTest').result.gone === 1 && call('5004', 'pushKey').devices === 0, 'a subscription the browser dropped (410) is retired');
  pushReply = 201;
  ok(call('5002', 'pushUnsubscribe', { endpoint: EP }).removed === 1 && call('5002', 'pushKey').devices === 0, 'turning it off removes the device');
  B.ctx.UrlFetchApp.fetch = realFetch;
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
