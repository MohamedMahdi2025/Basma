// Management dashboard checks: node tests/dashboard.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.1) => Math.abs(a - b) <= tol;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });

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

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('3004', 'المدير المالي', 'employee');
person('3005', 'الرئيس التنفيذي', 'employee');
['5002', '5003', '5004'].forEach(no => person(no, 'موظف ' + no, 'employee'));
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3004'], extraRoles: 'payroll' }); tok('3004', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3005'], extraRoles: 'executive' }); tok('3005', true);
const dept = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: dept, hireDate: '2019-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], departmentId: dept, hireDate: '2024-09-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], departmentId: dept, hireDate: '2023-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-12-31' } });
// the three staff are in the system for October; the office roles joined on 1 November
direct(() => {
  ['5002', '5003', '5004'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; e.leaveOpeningDays = 10; e.leaveOpeningDate = '2026-09-30'; B.ctx.update_('employees', e); });
  ['1000', '3001', '3002', '3004', '3005'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-11-01T00:00:00.000Z'; B.ctx.update_('employees', e); });
  [['5002', 9000, 2250, 900], ['5003', 5000, 1250, 500], ['5004', 8000, 2000, 800]].forEach((p, i) => B.ctx.append_('compensation', { id: 'C' + i, ref: 'SAL-T' + i, empId: ids[p[0]], effectiveFrom: '2026-01-01', basic: p[1], housing: p[2], transport: p[3], otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
});
const W = []; for (let d = 1; d <= 31; d++) { const ds = '2026-10-' + String(d).padStart(2, '0'); if (new Date(ds + 'T00:00:00Z').getUTCDay() <= 4) W.push(ds); }
const at = (ds, hm) => new Date(ds + 'T' + hm + ':00+03:00').toISOString();
const late5002 = [W[0], W[1], W[2]], absent5003 = [W[5], W[6]], leave5003 = [W[10], W[11]];
direct(() => {
  const rows = [];
  ['5002', '5003', '5004'].forEach(no => W.forEach(ds => {
    if (no === '5003' && (absent5003.includes(ds) || leave5003.includes(ds))) return;
    const inAt = no === '5002' && late5002.includes(ds) ? '08:40' : '07:55';
    [['in', inAt], ['out', '17:05']].forEach(([ty, hm]) => rows.push({ id: 'P' + no + ds + ty, empId: ids[no], type: ty, ts: at(ds, hm), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, hm) }));
  }));
  B.ctx.appendMany_('punches', rows);
  B.ctx.append_('requests', { id: 'RU', ref: 'LV-2026-00001', empId: ids['5003'], type: 'leave', subtype: 'unpaid', fromDate: leave5003[0], toDate: leave5003[1], days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '', decidedAt: '2026-10-01T10:00:00.000Z' });
  B.ctx.append_('requests', { id: 'RP', ref: 'LV-2026-00002', empId: ids['5004'], type: 'leave', subtype: 'annual', fromDate: '2026-12-01', toDate: '2026-12-02', days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'pending', step: 'hr', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-28T00:00:00.000Z', updatedAt: '', decidedAt: '' });
});
let r;

console.log('Access');
r = call('5002', 'dashboard');
ok(!r.ok && r.error === 'forbidden', 'an employee has no dashboard', r);
r = call('1000', 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.money === false && !('cost' in r), 'admin without payroll or executive sees no money', { money: r.money, keys: Object.keys(r) });
r = call('3005', 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.money === true && r.cost, 'the executive role sees cost and liabilities (no individual salary)', r.error);
ok(!JSON.stringify(r).includes('"basic"') && !JSON.stringify(r).includes('iban'), 'no salary line or IBAN leaves the server in the dashboard');
r = call('3001', 'dashboard', { from: '2026-01-01', to: '2026-10-31' });
ok(!r.ok && r.error === 'range_too_long', 'at most three months at a time', r);

console.log('Attendance (October)');
r = call('3001', 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
const T = r.attendance.totals, exp = 3 * W.length - 2, pres = exp - 2;
ok(T.expected === exp && T.present === pres && T.absent === 2 && T.leave === 2, 'expected days leave out approved leave; 2 absences, 2 leave days', T);
ok(T.late === 3 && T.lateMin === 120 && T.avgLate === 40, 'three late arrivals, 40 minutes each', { late: T.late, min: T.lateMin });
ok(near(T.attendanceRate, pres / exp * 100) && near(T.punctuality, (pres - 3) / pres * 100), 'attendance and punctuality rates', { a: T.attendanceRate, p: T.punctuality });
ok(r.attendance.daily.length === W.length && r.attendance.daily[0].late === 1, 'a point per working day for the trend');
ok(r.attendance.checkin.some(b => b.minute === 7 * 60 + 45) && r.attendance.checkin.some(b => b.minute === 8 * 60 + 30), 'check-in times in 15-minute buckets', r.attendance.checkin);
ok(r.attendance.topLate[0].emp.empNo === '5002' && r.attendance.topAbsent[0].emp.empNo === '5003', 'who is late most, and absent most');
ok(r.attendance.departments[0].department === 'المبيعات' && r.attendance.departments[0].headcount === 3, 'figures by department');
ok(r.attendancePrev && r.attendancePrev.expected > 0 && r.attendancePrev.present === 0, 'the previous period is computed for comparison (September: in the system, no check-ins)', r.attendancePrev);

console.log('Workforce, leave, requests');
ok(r.workforce.headcount === 8 && r.workforce.saudis >= 2 && r.workforce.departments.some(d => d.department === 'المبيعات' && d.saudi === 2 && d.nonSaudi === 1), 'headcount and the Saudi mix by department', r.workforce.departments);
ok(r.workforce.tenure['5-10'] === 1 && r.workforce.tenure['3-5'] === 1 && r.workforce.tenure['1-3'] === 1, 'years of service in bands (7.8, 3.8 and 2.2 years)', r.workforce.tenure);
const unpaidCal = (Date.parse(leave5003[1]) - Date.parse(leave5003[0])) / 86400000 + 1;
ok(r.leave.byType.find(x => x.type === 'unpaid').days === unpaidCal, 'leave days by type (unpaid counts calendar days, as payroll does)', r.leave.byType);
ok(r.requests.pending.hr === 1 && r.requests.speed.some(x => x.type === 'leave' && near(x.avgHours, 10)), 'requests waiting per step, and hours to decide', r.requests);

console.log('Cost and liabilities');
r = call('3002', 'payrollCreate', { month: '2026-10' });
call('3004', 'payrollApprove', { id: r.run.id });
r = call('3005', 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
const c = r.cost;
ok(c.trend.length === 1 && c.trend[0].month === '2026-10' && near(c.trend[0].cost, c.trend[0].gross + c.trend[0].gosiEmployer, 0.01), 'monthly payroll cost from locked runs (gross + employer GOSI)', c.trend);
ok(c.byDepartment[0].department === 'المبيعات', 'cost by department', c.byDepartment);
ok(near(c.monthlyPackage, 12150 + 6750 + 10800, 0.01), 'the monthly wage bill in force', c.monthlyPackage);
const eos5002 = (y => Math.min(y, 5) * 12150 / 2 + Math.max(0, y - 5) * 12150)((Date.parse('2026-11-04') - Date.parse('2019-01-01')) / 86400000 / 365 + 1 / 365);
ok(c.eosLiability > eos5002 && c.leaveLiability > 0, 'end-of-service and unused-leave liabilities', { eos: c.eosLiability, leave: c.leaveLiability });
ok(r.performance.cycle === null, 'no review cycle yet: the performance block says so');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
