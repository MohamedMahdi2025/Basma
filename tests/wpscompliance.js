// Wage protection compliance (2026-11-06): what Mudad scores, per month. node tests/wpscompliance.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-14T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false;
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
function iban(acct) { const bb = '80' + acct; let r = 0; for (const ch of bb + '281000') r = (r * 10 + Number(ch)) % 97; return 'SA' + String(98 - r).padStart(2, '0') + bb; }

person('1000', 'مدير النظام', 'admin'); person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee'); person('3004', 'المدير المالي', 'employee');
['5002', '5003', '5004', '5005'].forEach(no => person(no, 'موظف ' + no, 'employee'));
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3004'], extraRoles: 'payroll' }); tok('3004', true);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], hireDate: '2019-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], hireDate: '2026-10-16', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], hireDate: '2023-01-01', nationality: 'EG' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5005'], hireDate: '2022-01-01', nationality: 'SA' } });
const good = iban('000000608010167519');
direct(() => {
  [['5002', 9000, 2250], ['5003', 6000, 1500], ['5004', 8000, 2000]].forEach((p, i) => B.ctx.append_('compensation', { id: 'C' + i, ref: 'SAL-T' + i, empId: ids[p[0]], effectiveFrom: '2026-01-01', basic: p[1], housing: p[2], transport: 500, otherJson: '{}', currency: 'SAR', status: 'approved' }));
  B.ctx.append_('empPrivate', { empId: ids['5002'], nationalId: '1000000002', iban: good, gosiNumber: 'G2', gosiWage: 11250 });
  B.ctx.append_('empPrivate', { empId: ids['5003'], nationalId: '1000000003', iban: good });
  B.ctx.append_('empPrivate', { empId: ids['5004'], nationalId: '2000000004', iban: good, gosiNumber: 'G4', gosiWage: 12000 });
  B.ctx.append_('empPrivate', { empId: ids['5005'], nationalId: '1000000005', iban: good, gosiNumber: 'G5', gosiWage: 7000 }); // insured, but no package: nothing is paid
});
let r;

console.log('Access');
ok(call('5002', 'wpsCompliance').error === 'forbidden', 'an employee cannot see wage protection compliance');
ok(call('1000', 'wpsCompliance').error === 'forbidden', 'nor an administrator alone (it carries wages)');
r = call('3002', 'wpsCompliance');
ok(r.ok && r.months.length === 6 && r.months.every(m => m.before), 'before any payroll ran in BASMA, no month counts as a breach', r.months);

console.log('October: approved, file prepared but not uploaded after the 10 November deadline');
ok(call('3002', 'payrollCreate', { month: '2026-10' }).ok, 'October payroll drafted');
const run = direct(() => B.ctx.readAll_('payrollRuns'))[0];
ok(call('3004', 'payrollApprove', { id: run.id }).ok, 'approved by a second payroll holder');
ok(call('3002', 'wpsStep', { id: run.id, step: 'generated' }).ok, 'WPS file prepared');
r = call('3002', 'wpsCompliance', { month: '2026-10' });
const D = r.detail, st = no => (D.people.find(p => p.emp.id === ids[no]) || { status: 'ok' }).status;
ok(r.ok && r.month === '2026-10' && D.due === '2026-11-10', 'October is due on 10 November', D && D.due);
ok(st('5002') === 'not_uploaded' && st('5003') === 'not_uploaded', 'paid in the run, but the file never reached the bank or Mudad', D.people);
ok(st('5005') === 'not_paid', 'insured in GOSI with no payment at all: not paid', st('5005'));
ok(!D.people.some(p => ['1000', '3001', '3002', '3004'].includes(p.emp.empNo)), 'system and staff accounts with no package and no GOSI record are not on the payroll');
ok(D.files.length === 1 && D.files[0].status === 'generated' && D.files[0].late, 'the file is shown as late');

console.log('After the upload (on the 14th)');
ok(call('3002', 'wpsStep', { id: run.id, step: 'uploaded', bankRef: 'MUD-1' }).ok, 'uploaded with the Mudad reference');
r = call('3002', 'wpsCompliance', { month: '2026-10' });
const D2 = r.detail, st2 = no => (D2.people.find(p => p.emp.id === ids[no]) || { status: 'ok' }).status;
ok(st2('5002') === 'ok', 'paid basic + housing 11,250 = the GOSI wage: compliant', D2.people.find(p => p.emp.id === ids['5002']));
const p3 = D2.people.find(p => p.emp.id === ids['5003']);
ok(p3 && p3.status === 'partial' && p3.source === 'package' && p3.paidDays < 30, 'a joiner on 16 October: a part month, compliant, compared with the package (not yet in GOSI)', p3);
const p4 = D2.people.find(p => p.emp.id === ids['5004']);
ok(p4 && p4.status === 'below' && p4.paid === 10000 && p4.registered === 12000 && p4.source === 'gosi', 'paid 10,000 against 12,000 registered in GOSI: below the registered wage', p4);
ok(D2.counts.ok === 1 && D2.counts.partial === 1 && D2.counts.below === 1 && D2.counts.not_paid === 1 && D2.counted === 4 && D2.compliant === 2 && D2.pct === 50, 'rate: 2 of 4 = 50%', D2);
ok(D2.late && D2.files[0].uploadedAt === '2026-11-14', 'uploaded after the 10th: still flagged late');
ok(D2.people[0].status === 'not_paid' && D2.people[1].status === 'below', 'the worst cases come first');

console.log('The months around it');
const nov = r.months.find(m => m.month === '2026-11'), sep = r.months.find(m => m.month === '2026-09');
ok(sep.before && sep.pct === null, 'September, before the first run here: no data');
ok(nov.counted === 0 && nov.counts.pending === 4 && nov.pct === null, 'November is not due yet: everyone pending, no rate', nov);
ok(r.months.find(m => m.month === '2026-10').pct === 50, 'the trend carries October at 50%');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
