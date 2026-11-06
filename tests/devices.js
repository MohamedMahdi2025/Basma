// One device, one employee; up to 3 devices each (2026-11-06). node tests/devices.js
const crypto = require('crypto');
const { load, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-06T06:30:00Z') });
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const PHONE_A = 'a:' + 'A'.repeat(32), PHONE_B = 'a:' + 'B'.repeat(32), PC = 'w:' + 'P'.repeat(24), TAB = 'w:' + 'T'.repeat(24), OLD = 'w:' + 'O'.repeat(24);
const enrol = (empNo, code, devId, pin) => {
  const d = new DeviceKey(); d.pin = pin || '583920';
  const b = B.call({ action: 'enrollBegin', empNo, code, devId });
  const f = B.call({ action: 'enrollFinish', deviceKey: d.create(b.options), pin: d.pin, label: 'x', devId });
  return { d, f };
};
const signIn = (empNo, d, devId) => { const b = B.call({ action: 'authBegin', empNo, devId }); return B.call({ action: 'authFinish', credential: d.get(b.options), pin: d.pin, devId }); };
const admin = enrol('1000', home.activationCode, PHONE_A);
ok(admin.f.ok, 'the administrator activates his phone', admin.f);
const T = admin.f.token;
const code = no => B.call({ action: 'empSave', token: T, emp: { empNo: no, name: 'موظف ' + no, role: 'employee' } }).activationCode
  || B.call({ action: 'empActivation', token: T, empNo: no }).activationCode;
const c2 = code('2001');

console.log('One device, one employee');
let r = enrol('2001', c2, PHONE_A);
ok(!r.f.ok && r.f.error === 'device_taken', 'a colleague cannot be activated on a phone that is already someone else\'s', r.f);
const ahmed = enrol('2001', c2, PHONE_B);
ok(ahmed.f.ok, 'on his own phone he can', ahmed.f);
ok(signIn('2001', ahmed.d, PHONE_B).ok, 'and signs in from it');
const moved = signIn('2001', ahmed.d, PHONE_A);
ok(!moved.ok && moved.error === 'device_mismatch', 'his key copied to another phone is refused', moved);

console.log('Up to three devices each');
const cred = () => B.ctx.readAll_('credentials').filter(c => c.empId === ahmed.f.me.id && c.status === 'active');
const more = devId => { B.ctx.READ_MEMO_ = {}; const k = B.call({ action: 'empActivation', token: T, id: ahmed.f.me.id }).activationCode; return enrol('2001', k, devId); };
ok(more(PC).f.ok && more(TAB).f.ok, 'a laptop and a tablet next to the phone');
B.ctx.READ_MEMO_ = {};
ok(cred().length === 3, 'three active devices', cred().map(c => c.devId));
ok(more(OLD).f.ok, 'a fourth device is allowed');
B.ctx.READ_MEMO_ = {};
ok(cred().length === 3 && !cred().some(c => c.devId === PHONE_B), 'and the least recently used one is retired, so three remain', cred().map(c => c.devId));
ok(more(TAB).f.ok, 'activating the same tablet again replaces its own key');
B.ctx.READ_MEMO_ = {};
ok(cred().filter(c => c.devId === TAB).length === 1 && cred().length === 3, 'one key per device', cred().map(c => c.devId));

console.log('Older copies of the app and shared tablets');
const c3 = code('2002');
r = enrol('2002', c3, undefined);
ok(r.f.ok, 'a request without a device id still works (an old app version): one device per kind as before', r.f);
B.ctx.DEFAULT_SETTINGS.sharedDevices = true; B.ctx.settingsForget_();
const c4 = code('2003');
ok(enrol('2003', c4, PC).f.ok, 'with shared devices switched on, an office tablet may hold several people');
B.ctx.DEFAULT_SETTINGS.sharedDevices = false; B.ctx.settingsForget_();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
