// Management dashboard checks: node tests/dashboard.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.1) => Math.abs(a - b) <= tol;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // these checks prove the strict mode: pay kept apart from administration (the default lets the admin hold payroll)

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

// ---------------- workforce analytics ----------------
console.log('Workforce analytics: the maths on known fixtures');
const X = B.ctx, TD = '2026-11-04';
const ctxOf = list => ({ emps: Object.fromEntries(list.map(e => [e.id, Object.assign({ status: 'active', name: 'n' + e.id, empNo: e.id, createdAt: '' }, e)])), depts: {} });
ok(X.waAddMonths_('2024-01-31', 1) === '2024-02-29' && X.waAddMonths_('2025-01-31', 1) === '2025-02-28' && X.waAddMonths_(TD, -18) === '2025-05-04' && X.waAddMonths_('2026-11-01', -11) === '2025-12-01',
  'calendar months clamp to the month end (31 Jan + 1 month = 28/29 Feb)');
ok(X.waMonthsBetween_('2026-02-01', TD) === 9 && X.waMonthsBetween_('2026-02-05', '2026-03-04') === 0 && X.waMedian_([4, 1, 13]) === 4 && X.waMedian_([1, 6]) === 3.5, 'whole months between dates, median');

// turnover: 10 people all year, a resignation in March, a resignation (request only) in April, a termination in June
const core10 = Array.from({ length: 10 }, (_, i) => ({ id: 'c' + i, hireDate: '2020-01-01' }));
const tPeople = X.waPeople_(ctxOf(core10.concat([
  { id: 'V1', hireDate: '2018-05-01', resignedOn: '2026-02-15', lastWorkingDay: '2026-03-15', status: 'disabled' },
  { id: 'V2', hireDate: '2026-01-05', lastWorkingDay: '2026-04-30', status: 'disabled' },
  { id: 'O1', hireDate: '2025-10-01', lastWorkingDay: '2026-06-30', status: 'disabled' },
  { id: 'N1', hireDate: '2026-02-01' },
  { id: 'OLD', hireDate: '2015-01-01', lastWorkingDay: '2025-11-20', status: 'disabled' },
  { id: 'X1', hireDate: '2019-01-01', status: 'disabled' }
])), [{ type: 'resignation', status: 'approved', empId: 'V2' }], [{ empId: 'O1', reason: 'termination', status: 'cleared' }]);
const TO = X.waTurnover_(tPeople, TD), Mo = TO.months;
ok(TO.from === '2025-12-01' && TO.to === TD && Mo.length === 12 && Mo[0].month === '2025-12' && Mo[11].month === '2026-11', 'twelve calendar months ending this month', { from: TO.from, n: Mo.length });
ok(Mo[0].startHc === 12 && Mo[0].endHc === 12 && Mo[1].endHc === 13 && Mo[2].startHc === 14 && Mo[3].endHc === 13 && Mo[4].endHc === 13 && Mo[5].startHc === 12 && Mo[7].avgHc === 11,
  'headcount on the first and last day of each month (a last working day still counts; the one before go-live does not)', Mo.map(m => [m.startHc, m.endHc]));
ok(Mo[3].leavers === 1 && Mo[3].rate === 7.4 && Mo[4].rate === 7.7 && Mo[6].rate === 8.3 && Mo[6].other === 1 && Mo[3].voluntary === 1, 'monthly rate = leavers / average of start and end (1 / 13.5 = 7.4%)', Mo.map(m => m.rate));
ok(TO.leavers === 3 && TO.voluntary === 2 && TO.other === 1, 'voluntary = resignedOn or an approved resignation request; a termination clearance is other', { l: TO.leavers, v: TO.voluntary, o: TO.other });
ok(TO.avgHeadcount === 12 && TO.rate === 25 && TO.voluntaryRate === 16.7 && TO.otherRate === 8.3, 'rolling 12 months: 3 leavers / average headcount 12 = 25% (16.7% voluntary, 8.3% other)', TO);
ok(TO.firstYear.leavers === 2 && TO.firstYear.share === 66.7 && TO.otherReasons.termination === 1 && TO.headcountNow === 11, 'first-year attrition: 2 of the 3 leavers had under 12 months of service', TO.firstYear);
const x1 = tPeople.find(p => p.id === 'X1');
ok(x1.unknownEnd && X.waChecks_(tPeople, TD).some(c => c.code === 'wa_no_last_day' && c.count === 1), 'switched off without a last working day: left out of the maths and reported as a check');

// cohorts: 2024 hires leave before 3, before 6 and before 12 months, one stays; a 2026 hire is only 3 months along
const cPeople = X.waPeople_(ctxOf([
  { id: 'k1', hireDate: '2024-01-15', lastWorkingDay: '2024-03-01', status: 'disabled' },
  { id: 'k2', hireDate: '2024-02-01', lastWorkingDay: '2024-06-15', status: 'disabled' },
  { id: 'k3', hireDate: '2024-03-01', lastWorkingDay: '2024-12-31', status: 'disabled' },
  { id: 'k4', hireDate: '2024-04-01' },
  { id: 'k5', hireDate: '2026-06-10' }
]), [], []);
const CO = X.waCohorts_(cPeople, TD, true), c24 = CO.find(c => c.year === '2024'), c26 = CO.find(c => c.year === '2026');
ok(c24.hires === 4 && c24.m3.pct === 75 && c24.m6.pct === 50 && c24.m12.pct === 25 && c24.m3.retained === 3 && c24.m12.eligible === 4, 'cohort 2024 still employed at 3 / 6 / 12 months: 75% / 50% / 25%', c24);
ok(c26.m3.pct === 100 && c26.m6.eligible === 0 && c26.m6.pct === null && c26.m12.pct === null && CO[0].year === '2026', 'a cohort not yet 6 or 12 months along shows no rate for those (newest first)', c26);
const COs = X.waCohorts_(cPeople, TD, false).find(c => c.year === '2024');
ok(COs.suppressed === true && COs.hires === 4 && !('m3' in COs), 'for other roles a cohort under 5 hires shows its size only', COs);

// span of control: 13, 1 and 4 direct reports, plus one person whose manager has left
const sp = [{ id: 'M1', hireDate: '2020-01-01' }, { id: 'M2', hireDate: '2020-01-01' }, { id: 'M3', hireDate: '2020-01-01' }, { id: 'MX', hireDate: '2020-01-01', lastWorkingDay: '2026-10-01', status: 'disabled' }];
for (let i = 0; i < 13; i++) sp.push({ id: 'r' + i, hireDate: '2021-01-01', managerId: 'M1' });
sp.push({ id: 's0', hireDate: '2021-01-01', managerId: 'M2' });
for (let i = 0; i < 4; i++) sp.push({ id: 'q' + i, hireDate: '2021-01-01', managerId: 'M3' });
sp.push({ id: 'o0', hireDate: '2021-01-01', managerId: 'MX' });
const spPeople = X.waPeople_(ctxOf(sp), [], []), SO = X.waSpan_(spPeople, TD, true), SN = X.waSpan_(spPeople, TD, false);
ok(SO.managers === 3 && SO.avg === 6 && SO.median === 4 && SO.min === 1 && SO.max === 13 && SO.reports === 18, 'direct reports per manager: average 6, median 4, min 1, max 13', SO);
const dist = Object.fromEntries(SO.distribution.map(d => [d.label, d.managers]));
ok(dist['1'] === 1 && dist['2-4'] === 1 && dist['5-8'] === 0 && dist['9-12'] === 0 && dist['13+'] === 1, 'team sizes in buckets', dist);
ok(SO.wide === 1 && SO.narrow === 1 && SO.orphans === 1 && SO.flags.length === 2 && SO.flags[0].emp.id === 'M1' && SO.flags[0].flag === 'wide' && SO.flags[1].flag === 'narrow',
  'more than 12 and fewer than 2 reports are flagged (information), the report whose manager left is counted', SO.flags);
ok(!('flags' in SN) && SN.wide === 1 && SN.narrow === 1, 'other roles get the flag counts, not the managers\' names');

// tenure
const yrs = d => (Date.parse(TD) - Date.parse(d)) / 86400000 / 365.25;
const tenRows = [['T1', '2016-01-01', 'A'], ['T2', '2026-05-01', 'A'], ['T3', '2023-01-01', 'A'], ['T6', '2022-01-01', 'A'], ['T7', '2020-01-01', 'A'], ['T4', '2021-01-01', 'B'], ['T5', '2024-06-01', 'B'], ['T8', '', 'B']];
const tenPeople = X.waPeople_(ctxOf(tenRows.map(x => ({ id: x[0], hireDate: x[1], department: x[2] }))), [], []);
const TE = X.waTenure_(tenPeople, TD, true), TEo = X.waTenure_(tenPeople, TD, false);
const known = tenRows.filter(x => x[1]).map(x => yrs(x[1])), sorted = known.slice().sort((a, b) => a - b);
ok(TE.headcount === 8 && TE.known === 7 && near(TE.avgYears, known.reduce((a, b) => a + b) / 7, 0.006) && near(TE.medianYears, sorted[3], 0.006), 'average and median years of service (people without a hire date are counted, not averaged)', TE);
ok(JSON.stringify(TE.bands) === JSON.stringify({ '<1': 1, '1-3': 1, '3-5': 2, '5-10': 2, '10+': 1 }), 'tenure distribution in bands', TE.bands);
const teA = TE.departments.find(d => d.department === 'A'), teB = TE.departments.find(d => d.department === 'B');
const aYrs = tenRows.filter(x => x[2] === 'A').map(x => yrs(x[1]));
ok(near(teA.avgYears, aYrs.reduce((a, b) => a + b) / 5, 0.006) && teB.known === 2 && teB.bands['5-10'] === 1, 'tenure per department', { teA, teB });
const tbo = TEo.departments.find(d => d.department === 'B'), tao = TEo.departments.find(d => d.department === 'A');
ok(tbo.suppressed === true && tbo.headcount === 3 && !('avgYears' in tbo) && !('bands' in tbo) && tao.avgYears === teA.avgYears, 'for other roles a department under 5 people shows its headcount only', tbo);

console.log('Workforce analytics: access, privacy and retention indicators');
const ops = call('3001', 'hrDeptSave', { dept: { nameAr: 'العمليات' } }).dept.id;
const WID = no => 'EW' + no;
const wEmp = (no, o) => Object.assign({ id: WID(no), empNo: no, name: 'موظف ' + no, role: 'employee', status: 'active', tokenVer: 0, createdAt: '2026-11-01T00:00:00.000Z',
  departmentId: ops, department: 'العمليات', managerId: WID('6000'), gender: 'female', nationality: 'SA', isSaudi: true }, o);
const compRow = (id, no, eff, basic) => ({ id, ref: 'SAL-W' + id, empId: WID(no), effectiveFrom: eff, basic, housing: 0, transport: 0, otherJson: '{}', currency: 'SAR', reason: 'test',
  enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: eff + 'T00:00:00.000Z', status: 'approved', createdAt: eff + 'T00:00:00.000Z', batchId: '' });
const jobRow = (id, no, eff, mgr) => ({ id, empId: WID(no), effectiveFrom: eff, departmentId: ops, positionId: '', managerId: mgr, grade: '', reason: 'test', enteredBy: ids['3001'], createdAt: eff + 'T00:00:00.000Z' });
const wDays = []; for (let d = Date.parse('2026-05-09'); d <= Date.parse(TD); d += 86400000) { const ds = new Date(d).toISOString().slice(0, 10); if (new Date(ds + 'T00:00:00Z').getUTCDay() <= 4) wDays.push(ds); }
const late6004 = wDays.filter(ds => ds >= '2026-08-07').slice(-12, -8);
direct(() => {
  B.ctx.appendMany_('employees', [
    wEmp('6000', { name: 'مدير العمليات', hireDate: '2018-01-01', managerId: '' }),
    wEmp('6001', { hireDate: '2020-03-01' }),                        // pay unchanged since 2024
    wEmp('6002', { hireDate: '2021-06-15' }),                        // new manager in August
    wEmp('6003', { hireDate: '2022-02-01' }),                        // pay unchanged (same package re-entered) and last rating 2
    wEmp('6004', { hireDate: '2025-01-10', createdAt: '2026-01-01T00:00:00.000Z' }), // late more often in the last 90 days
    wEmp('6005', { hireDate: '2026-02-01' }),                        // under a year
    wEmp('6006', { hireDate: '2019-09-01', resignedOn: '2026-11-01', lastWorkingDay: '2026-12-15' }), // serving notice
    wEmp('6101', { hireDate: '2025-12-01', lastWorkingDay: '2026-05-31', status: 'disabled' }),       // terminated in the first year
    wEmp('6102', { hireDate: '2017-01-01', resignedOn: '2026-06-15', lastWorkingDay: '2026-07-15', status: 'disabled' }), // resigned
    wEmp('6103', { hireDate: '2019-01-01', status: 'disabled' })     // switched off, no last working day
  ]);
  const e5003 = B.ctx.findBy_('employees', 'empNo', '5003'); e5003.managerId = ids['5002']; B.ctx.update_('employees', e5003); // a team of one
  B.ctx.appendMany_('compensation', [compRow('W1', '6001', '2024-01-01', 5000), compRow('W2', '6002', '2024-01-01', 5000), compRow('W3', '6002', '2026-01-01', 6000),
    compRow('W4', '6003', '2024-01-01', 5000), compRow('W5', '6003', '2026-01-01', 5000), compRow('W6', '6004', '2025-09-01', 5000), compRow('W7', '6005', '2026-02-01', 5000), compRow('W8', '6000', '2026-03-01', 9000)]);
  B.ctx.appendMany_('jobHistory', [jobRow('HW1', '6002', '2024-01-01', ids['5002']), jobRow('HW2', '6002', '2026-08-01', WID('6000')), jobRow('HW3', '6001', '2020-03-01', WID('6000')),
    jobRow('HW4', '6003', '2023-01-01', ids['5002']), jobRow('HW5', '6003', '2025-01-01', WID('6000'))]);
  B.ctx.append_('perfCycles', { id: 'CYW', ref: 'PRF-W-1', year: 2025, nameAr: 'تقييم 2025', nameEn: '2025 review', type: 'annual', status: 'closed', kpiWeight: 70, compWeight: 30,
    goalsDue: '', midDue: '', reviewDue: '', createdBy: ids['3001'], createdAt: '2025-12-01T00:00:00.000Z', updatedAt: '' });
  B.ctx.appendMany_('reviews', [['RW1', '6003', 2], ['RW2', '6004', 4], ['RW3', '6001', 3]].map(x => ({ id: x[0], ref: x[0], cycleId: 'CYW', empId: WID(x[1]), stage: 'closed', overall: x[2], finalRating: x[2], createdAt: '2025-12-20T00:00:00.000Z' })));
  B.ctx.append_('clearance', { id: 'KW1', ref: 'CLR-W-1', empId: WID('6101'), lastDay: '2026-05-31', reason: 'termination', tasksJson: '[]', status: 'cleared', createdBy: ids['3001'], createdAt: '2026-05-01T00:00:00.000Z', clearedAt: '2026-05-31T00:00:00.000Z' });
  const rows = [];
  wDays.forEach(ds => [['in', late6004.includes(ds) ? '08:40' : '07:55'], ['out', '17:05']].forEach(([ty, hm]) => {
    if (ds === TD && ty === 'out') return;
    rows.push({ id: 'PW' + ds + ty, empId: WID('6004'), type: ty, ts: at(ds, hm), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, hm) });
  }));
  B.ctx.appendMany_('punches', rows);
});
const OCT = { from: '2026-10-01', to: '2026-10-31' }, WA = Object.assign({ analytics: 1 }, OCT);
r = call('3001', 'dashboard', OCT);
ok(r.ok && !('analytics' in r), 'no analytics unless asked (the home screen calls the same action and stays fast)');
const H = call('3001', 'dashboard', WA).analytics, Ex = call('3005', 'dashboard', WA).analytics, Py = call('3002', 'dashboard', WA).analytics, Ad = call('1000', 'dashboard', WA).analytics;
ok(H && !H.error && H.names === true && Ex.names === false && Py.names === false && Ad.names === false, 'every dashboard role gets the analytics block; names only for the HR role', { h: H && H.names, e: Ex && Ex.names });
const HT = H.turnover;
ok(HT.leavers === 2 && HT.voluntary === 1 && HT.other === 1 && HT.firstYear.leavers === 1 && HT.otherReasons.termination === 1 && HT.months.find(m => m.month === '2026-05').leavers === 1,
  'live data: one resignation, one first-year termination (from the clearance reason)', { l: HT.leavers, v: HT.voluntary, fy: HT.firstYear });
ok(H.checks.some(c => c.code === 'wa_no_last_day' && c.count === 1) && H.checks.some(c => c.code === 'wa_no_hire_date' && c.level === 'info'), 'data checks: switched off without a last day, people without a hire date', H.checks);
ok(H.span.managers === 2 && H.span.max === 6 && H.span.narrow === 1 && H.span.flags.length === 1 && H.span.flags[0].emp.empNo === '5002' && !('flags' in Ex.span) && Ex.span.narrow === 1,
  'span of control from managerId: the one-person team is flagged for HR by name, counted for others', H.span);
const HF = H.flightRisk, person6 = no => (HF.people || []).find(p => p.emp.empNo === no), codes = no => (person6(no) || { signals: [] }).signals.map(s => s.code).sort().join(',');
ok(codes('6001') === 'pay_static' && person6('6001').signals[0].since === '2024-01-01' && person6('6001').signals[0].months === 34, 'signal: no pay change in 18+ months (dated, never an amount)', person6('6001'));
ok(codes('6003') === 'low_rating,pay_static' && person6('6003').score === 2 && HF.people[0].emp.empNo === '6003', 'a package re-entered at the same amount is not a change; last final rating 2 is the bottom band; two signals rank first', person6('6003'));
ok(codes('6002') === 'manager_change' && person6('6002').signals[0].on === '2026-08-01', 'signal: a manager change in the last 6 months (an older one does not count)', person6('6002'));
const s6004 = person6('6004') && person6('6004').signals[0];
ok(codes('6004') === 'attendance_up' && s6004.late === true && s6004.absent === false && s6004.last.late === 4 && s6004.prior.late === 0 && s6004.prior.expected >= 20, 'signal: lateness rising in the last 90 days against the 90 before', s6004);
ok(codes('6005') === 'new_hire' && person6('6005').signals[0].months === 9, 'signal: under 12 months of service', person6('6005'));
ok(!person6('6006') && HF.leaving === 1 && !person6('6000') && !person6('5002'), 'someone already serving notice is left out; people with no signal are not listed', { leaving: HF.leaving });
ok(HF.scored === 14 && HF.withSignals === 5 && HF.twoPlus === 1 && HF.bySignal.pay_static === 2 && HF.bySignal.new_hire === 1 && HF.coverage.attendance_up === 1,
  'totals and coverage (the attendance trend needs six months of history, so it could be checked for one person)', { s: HF.scored, w: HF.withSignals, c: HF.coverage });
ok(person6('6001').unknown.includes('attendance_up') && !person6('6001').unknown.includes('pay_static') && person6('6005').unknown.includes('low_rating'), 'each row says which signals the data could not check');

console.log('Workforce analytics: names for HR only, small groups');
const namesIn = a => ['موظف 60', 'مدير العمليات', 'موظف 5002', 'موظف 5003'].filter(n => JSON.stringify(a).includes(n));
ok(namesIn(H).length > 0 && [Ex, Py, Ad].every(a => !('people' in a.flightRisk) && namesIn(a).length === 0 && !JSON.stringify(a).includes('"empNo"')),
  'no name or employee number reaches executive, payroll or admin (admin alone is not HR)', [Ex, Py, Ad].map(namesIn));
ok([H, Ex, Ad].every(a => !JSON.stringify(a).includes('"basic"') && !JSON.stringify(a).includes('"total"') && !JSON.stringify(a).includes('5000')), 'no pay amount appears anywhere in analytics');
const EF = Ex.flightRisk, exOps = EF.groups.find(g => g.department === 'العمليات'), exPool = EF.groups.find(g => g.pooled);
ok(!EF.groups.some(g => g.department === 'المبيعات') && exPool && exPool.groups === 3 && exPool.headcount === 8 && exPool.department === '' && EF.groups[EF.groups.length - 1] === exPool,
  'departments under 5 people are never shown by name to other roles; together (Sales 3 + office 5) they make one combined row of 8', EF.groups.map(g => [g.department, g.headcount, g.groups]));
ok(exOps && exOps.headcount === 6 && exOps.withSignals === 5 && exOps.twoPlus === 1 && exOps.signals.low_rating === 1 && !('people' in exOps), 'a department of 5 or more shows counts only', exOps);
ok(EF.scored === EF.groups.reduce((s, g) => s + g.headcount, 0) && EF.withSignals === EF.groups.reduce((s, g) => s + g.withSignals, 0) && EF.scored === 14 && EF.hidden.people === 0,
  'totals for other roles are the sum of the rows shown', { scored: EF.scored, hidden: EF.hidden });
// a combined row still under 5 is hidden, and the totals leave it out so it cannot be worked out by subtraction
const fp = (id, dept, hire) => ({ id, hireDate: hire || '2026-03-01', department: dept });
const grpPeople = X.waPeople_(ctxOf([fp('a1', 'A'), fp('a2', 'A'), fp('a3', 'A'), fp('a4', 'A'), fp('a5', 'A'), fp('a6', 'A', '2015-01-01'), fp('b1', 'B'), fp('b2', 'B'), fp('b3', 'B'), fp('c1', 'C')]), [], []);
const GF = direct(() => X.waFlight_(grpPeople, [], X.settings_(), TD, false)), GH = direct(() => X.waFlight_(grpPeople, [], X.settings_(), TD, true));
ok(GF.groups.length === 1 && GF.groups[0].department === 'A' && GF.hidden.groups === 2 && GF.hidden.people === 4 && GF.scored === 6 && GF.withSignals === 5 && GF.bySignal.new_hire === 5 && !('people' in GF),
  'a combined group of 4 is hidden from other roles and left out of their totals (no subtraction back)', { groups: GF.groups.length, hidden: GF.hidden, scored: GF.scored, w: GF.withSignals });
ok(GH.groups.length === 3 && GH.scored === 10 && GH.withSignals === 9 && GH.people.length === 9 && GH.hidden.people === 0, 'HR sees all three departments and the 9 people with a signal', { g: GH.groups.length, s: GH.scored });
ok(H.flightRisk.groups.some(g => g.department === 'المبيعات' && g.headcount === 3), 'HR sees every department');
const exSales = Ex.tenure.departments.find(d => d.department === 'المبيعات'), hSales = H.tenure.departments.find(d => d.department === 'المبيعات');
ok(exSales.suppressed === true && exSales.headcount === 3 && !('avgYears' in exSales) && hSales.avgYears > 0 && Ex.tenure.departments.find(d => d.department === 'العمليات').avgYears > 0,
  'tenure: Sales (3) shows its headcount only to other roles, in full to HR', { exSales, hSales });
const hc25 = H.cohorts.find(c => c.year === '2025'), ec25 = Ex.cohorts.find(c => c.year === '2025');
ok(hc25.hires === 2 && hc25.m3.pct === 100 && hc25.m6.pct === 50 && hc25.m12.pct === 100 && hc25.m12.eligible === 1 && ec25.suppressed === true && !('m6' in ec25), 'cohort 2025 (2 hires): full for HR, size only for others', { hc25, ec25 });
const auditRows = direct(() => B.ctx.readAll_('audit')).filter(a => a.action === 'dashboard_view');
ok(auditRows.some(a => a.actorId === ids['3001'] && String(a.detail).includes('"people":true')) && auditRows.filter(a => a.actorId === ids['3005']).every(a => !String(a.detail).includes('people')), 'viewing named indicators is written to the audit log');

console.log('Workforce analytics: protected attributes never move a score');
const src = fs.readFileSync(path.join(__dirname, '..', 'backend', 'Dashboard.gs'), 'utf8'), waSrc = src.slice(src.indexOf('// ---------------- workforce analytics')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
ok(waSrc.length > 2000 && !/gender|nationality|isSaudi|birth|\bage\b|marital|religion|empPrivate|SHEETS\.PRIV|privOf|nitaqat/i.test(waSrc), 'the analytics code never names a protected attribute or the private file');
ok(X.WA_JOB_FIELDS.every(k => !/gender|nationality|saudi|birth|marital/i.test(k)) && !('gender' in X.waJob_({ gender: 'male', nationality: 'EG', id: 'z' })), 'the job view copies job fields only');
const before = JSON.stringify(call('3001', 'dashboard', WA).analytics);
const flip = (no, g, n) => call('3001', 'hrEmpSave', { emp: { id: WID(no), gender: g, nationality: n } });
ok(flip('6003', 'male', 'EG').ok && flip('6005', 'male', 'IN').ok && flip('6004', 'male', 'PK').ok, 'HR changes gender and nationality (and so Saudi status) of three scored people');
direct(() => ['6003', '6004', '6005'].forEach(no => B.ctx.append_('empPrivate', { empId: WID(no), birthDate: '1960-01-01', maritalStatus: 'married', updatedAt: new Date().toISOString() })));
const e6003 = direct(() => B.ctx.findBy_('employees', 'id', WID('6003')));
ok(e6003.gender === 'male' && e6003.nationality === 'EG' && e6003.isSaudi === false, 'the change landed in the employee record', { g: e6003.gender, s: e6003.isSaudi });
const afterR = call('3001', 'dashboard', WA);
ok(JSON.stringify(afterR.analytics) === before && afterR.analytics.flightRisk.people.find(p => p.emp.empNo === '6003').score === 2, 'scores, signals and every analytics figure are identical after the change');
ok(afterR.workforce.gender.male >= 3, 'while the workforce block (which does show the mix) did see it', afterR.workforce.gender);

console.log('Workforce analytics: one failing part does not blank the rest');
const realSpan = X.waSpan_;
X.waSpan_ = () => { throw new Error('boom'); };
const brokenR = call('3001', 'dashboard', WA);
X.waSpan_ = realSpan;
ok(brokenR.ok && brokenR.analytics.span.error === 'part_failed' && brokenR.analytics.turnover.leavers === 2 && brokenR.attendance.totals, 'span fails alone; turnover and the dashboard still answer');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
