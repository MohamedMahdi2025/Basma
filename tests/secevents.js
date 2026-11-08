// Suspicious-activity log and locked admin rules (2026-11-09). node tests/secevents.js
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
const admin = enrol('1000', home.activationCode, PHONE_A);
ok(admin.f.ok, 'the administrator activates his phone', admin.f);
const T = admin.f.token;
const code = B.call({ action: 'empSave', token: T, emp: { empNo: '2001', name: 'موظف', role: 'employee' } }).activationCode;
const emp = enrol('2001', code, PHONE_B);
ok(emp.f.ok, 'an employee activates', emp.f);
const E = emp.f.token;
const events = () => B.call({ action: 'securityEvents', token: T });

console.log('Suspicious activity is logged');
let r = B.call({ action: 'settingsSave', token: E, settings: { graceMin: 50 } });
ok(r.error === 'forbidden', 'an employee calling an admin action is refused', r);
r = B.call({ action: 'noSuchThing', token: E });
ok(r.error === 'unknown_action', 'an unknown action is refused');
let ev = events();
ok(ev.ok && ev.counts.sec_forbidden_action === 1, 'the forbidden call is in the security log', ev);
ok(ev.counts.sec_unknown_action === 1, 'and so is the unknown action');
B.call({ action: 'settingsSave', token: E, settings: { graceMin: 50 } });
B.call({ action: 'settingsSave', token: E, settings: { graceMin: 50 } });
ok(events().counts.sec_forbidden_action === 1, 'repeats inside 10 minutes are not logged again (no flooding)');
ok(JSON.stringify(ev.latest).indexOf(E.slice(0, 20)) < 0, 'the log never contains the token');
ok(events && B.call({ action: 'securityEvents', token: E }).error === 'forbidden', 'an employee cannot read the security log');

console.log('Admin rules are locked');
const me = B.call({ action: 'me', token: T });
r = B.call({ action: 'hrRolesSave', token: T, id: me.me ? me.me.id : me.id, extraRoles: ['payroll'] });
ok(r.error === 'cannot_change_own_roles', 'nobody grants themselves a role', r);
ok(events().counts.sec_own_role_change === 1, 'and the attempt is logged');
r = B.call({ action: 'settingsSave', token: T, settings: { maxDevices: 2 } });
ok(r.ok, 'the admin changes a security setting', r);
const audit = B.call({ action: 'auditList', token: T }).rows || [];
ok(audit.some(a => a.action === 'settings_security' && /maxDevices/.test(a.detail)), 'the widening or narrowing is audited with old and new value');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
