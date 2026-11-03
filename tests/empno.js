// Employee numbers generated per organisation (2026-11-03): prefix + running number, blank number = the next one,
// sign-in with the number alone, a new organisation's administrator numbered too. node tests/empno.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-03T06:00:00Z') });
const enroll = (org, no, code) => { const d = new Authenticator(); const b = B.raw({ action: 'enrollBegin', orgId: org, empNo: no, code }); const f = B.raw({ action: 'enrollFinish', orgId: org, credential: d.create(b.options) }); return { dev: d, token: f.token, me: f.me, f }; };

console.log('First administrator');
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير' });
ok(home.ok && home.empNo === '1001', 'no number given: the first administrator is 1001 (the default first number)', home);
const A = enroll('1001', '1001', home.activationCode);
ok(A.token, 'and signs in with it');

console.log('Blank number on a new employee');
let r = B.raw({ action: 'empNoNext', orgId: '1001', token: A.token });
ok(r.ok && r.empNo === '1002', 'the form shows the next number (1002)', r);
r = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { name: 'سارة' } });
ok(r.ok && r.emp.empNo === '1002', 'saving with no number gives 1002', r);
r = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { name: 'خالد', empNo: '1500' } });
ok(r.ok && r.emp.empNo === '1500', 'a number typed by hand is kept', r);
r = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { name: 'منى' } });
ok(r.ok && r.emp.empNo === '1501', 'the next one follows the highest number in use (1501), so nothing is handed out twice', r);
const edited = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { id: r.emp.id, name: 'منى أحمد' } });
ok(edited.ok && edited.emp.empNo === '1501', 'editing without a number keeps the existing one', edited);

console.log('Prefix and digits');
r = B.raw({ action: 'settingsSave', orgId: '1001', token: A.token, settings: { empNoPrefix: 'WNS-', empNoDigits: 4, empNoStart: 1 } });
ok(r.ok, 'the organisation sets prefix WNS-, 4 digits, first number 1', r);
ok(B.raw({ action: 'settingsSave', orgId: '1001', token: A.token, settings: { empNoPrefix: 'و س' } }).key === 'empNoPrefix', 'a prefix with spaces or Arabic letters is refused (it must type on any keyboard)');
ok(B.raw({ action: 'settingsSave', orgId: '1001', token: A.token, settings: { empNoDigits: 12 } }).key === 'empNoDigits', 'digits are 1 to 8');
r = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { name: 'ريم' } });
ok(r.ok && r.emp.empNo === 'WNS-0001', 'the next employee is WNS-0001 (numbers without the prefix do not count)', r);
const reem = r;
r = B.raw({ action: 'empSave', orgId: '1001', token: A.token, emp: { name: 'هند' } });
ok(r.ok && r.emp.empNo === 'WNS-0002', 'then WNS-0002', r);
const R = enroll('1001', '1', reem.activationCode);
ok(R.token && R.me.empNo === 'WNS-0001', 'the employee signs up with the number alone ("1"): the phone keeps its number pad', R.f);
const R2 = B.raw({ action: 'authBegin', orgId: '1001', empNo: 'WNS-0001' });
ok(R2.ok, 'the full number works too');

console.log('Each organisation numbers its own people');
const c = B.raw({ action: 'orgCreate', setupKey: 'k', logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', color: '#1E6B3F', accent: '#C98500', nameAr: 'منشأة', unn: '7001112223', adminName: 'مدير' });
ok(c.ok && c.adminEmpNo === '1001', 'a new organisation without a number for its administrator: 1001 in its own books', c);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
