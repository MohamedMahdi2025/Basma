// Reports centre checks: node tests/reports.js
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
const run = (no, reportId, params) => call(no, 'reportRun', { reportId, params: params || {} });

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('3004', 'المدير المالي', 'employee');
person('3005', 'الرئيس التنفيذي', 'employee');
person('5001', 'مشرف المبيعات', 'employee');
['5002', '5003', '5004'].forEach(no => person(no, 'موظف ' + no, 'employee'));
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3004'], extraRoles: 'payroll' }); tok('3004', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3005'], extraRoles: 'executive' }); tok('3005', true);
const dept = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات' } }).dept.id;
const sub = call('3001', 'hrDeptSave', { dept: { nameAr: 'مبيعات الرياض', parentId: dept } }).dept.id;
const other = call('3001', 'hrDeptSave', { dept: { nameAr: 'المالية' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], departmentId: dept, hireDate: '2018-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: dept, managerId: ids['5001'], hireDate: '2019-01-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], departmentId: sub, managerId: ids['5001'], hireDate: '2024-09-01', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], departmentId: other, hireDate: '2023-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-06-30' } });
direct(() => {
  ['5002', '5003', '5004'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; e.leaveOpeningDays = 10; e.leaveOpeningDate = '2026-09-30'; B.ctx.update_('employees', e); });
  ['1000', '3001', '3002', '3004', '3005', '5001'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-11-01T00:00:00.000Z'; B.ctx.update_('employees', e); });
  [['5002', 9000, 2250, 900], ['5003', 5000, 1250, 500], ['5004', 8000, 2000, 800]].forEach((p, i) => B.ctx.append_('compensation', { id: 'C' + i, ref: 'SAL-T' + i, empId: ids[p[0]], effectiveFrom: '2026-01-01', basic: p[1], housing: p[2], transport: p[3], otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
  B.ctx.append_('empPrivate', { empId: ids['5002'], nationalId: '1000000001', iban: 'SA0380000000608010167519', gosiCohort: 'legacy', updatedAt: '' });
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
  rows.push({ id: 'PREV', empId: ids['5004'], type: 'in', ts: at(W[3], '07:50'), date: W[3], lat: '', lng: '', acc: 90, zoneId: '', distance: 40, status: 'review', risk: 3, flags: 'edge', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(W[3], '07:50') });
  B.ctx.appendMany_('punches', rows);
  B.ctx.append_('requests', { id: 'RU', ref: 'LV-2026-00001', empId: ids['5003'], type: 'leave', subtype: 'unpaid', fromDate: leave5003[0], toDate: leave5003[1], days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '', decidedAt: '2026-10-01T10:00:00.000Z' });
  B.ctx.append_('requests', { id: 'RA', ref: 'AD-2026-00001', empId: ids['5002'], type: 'advance', subtype: '', fromDate: '', toDate: '', days: '', amount: 2000, months: 2, payloadJson: '{}', reason: '', docNo: '', status: 'pending', step: 'hr', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '', decidedAt: '' });
});
let r;

console.log('Catalogue and access');
r = call('5004', 'reportCatalog');
ok(r.ok && r.reports.length === 0, 'an employee with no team sees no reports', r.reports && r.reports.map(x => x.id));
r = run('5004', 'att_summary');
ok(!r.ok && r.error === 'forbidden', 'an employee cannot run a report', r);
r = call('5001', 'reportCatalog');
const mgrIds = r.reports.map(x => x.id);
ok(r.ok && r.teamOnly && mgrIds.includes('att_summary') && !mgrIds.includes('pay_register') && !mgrIds.includes('pay_cost') && !mgrIds.includes('audit_log'), 'a manager gets people reports only, marked team-only', mgrIds);
ok(r.emps.length === 2 && r.emps.every(e => [ids['5002'], ids['5003']].includes(e.id)), 'the manager filter list holds only their people', r.emps);
r = call('1000', 'reportCatalog');
ok(r.ok && r.reports.some(x => x.id === 'audit_log') && !r.reports.some(x => x.access === 'money' || x.access === 'cost'), 'admin: audit yes, no salary reports', r.reports.map(x => x.id));
r = call('3005', 'reportCatalog');
ok(r.ok && r.reports.some(x => x.id === 'pay_cost') && !r.reports.some(x => x.id === 'pay_register'), 'executive: department cost, never the per-person register');
r = call('3002', 'reportCatalog');
ok(r.ok && r.reports.some(x => x.id === 'pay_register') && r.reports.length === Object.keys(B.ctx.REPORTS).length - 3, 'payroll: every report except the audit log and the two candidate reports (HR only)', r.reports.length);
r = run('1000', 'pay_register');
ok(!r.ok && r.error === 'forbidden', 'admin cannot run the payroll register', r);

console.log('Attendance summary (October)');
r = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31' });
const row = no => r.rows.find(x => x.empNo === no);
ok(r.ok && r.rows.length === 3, 'people who joined after the period are left out', r.rows && r.rows.map(x => x.empNo));
ok(row('5002').lateDays === 3 && row('5002').lateMin === 120 && row('5002').present === W.length, '5002: late three times (40 minutes each, shift 08:00)', row('5002'));
ok(row('5003').absent === 2 && row('5003').leave === 2 && row('5003').expected === W.length - 2, '5003: two absences, two leave days outside expected', row('5003'));
ok(near(row('5003').attendance, (W.length - 4) / (W.length - 2) * 100), 'attendance % is present / expected', row('5003').attendance);
ok(r.columns.find(c => c.key === 'lateMin').sum === true && r.columns.find(c => c.key === 'department').group === true, 'columns say which totals and groupings are allowed');
r = run('5001', 'att_summary', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.teamOnly && r.rows.length === 2 && !r.rows.some(x => x.empNo === '5004'), 'a manager\'s report holds only their people (row-level security)', r.rows && r.rows.map(x => x.empNo));
r = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31', depts: [dept] });
ok(r.rows.map(x => x.empNo).sort().join() === '5002,5003', 'a department filter includes its sub-departments', r.rows.map(x => x.empNo));
r = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31', depts: [dept], subDepts: false });
ok(r.rows.map(x => x.empNo).sort().join() === '5002', 'sub-departments can be left out', r.rows.map(x => x.empNo));
r = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31', nationality: 'non_saudi' });
ok(r.rows.length === 1 && r.rows[0].empNo === '5004', 'nationality filter');
r = run('3001', 'att_summary', { from: '2026-01-01', to: '2026-10-31' });
ok(!r.ok && r.error === 'range_too_long', 'ranges are capped (three months for summaries)', r);
r = run('3001', 'att_daily', { from: '2026-10-01', to: '2026-11-15' });
ok(!r.ok && r.error === 'range_too_long', 'the daily report is capped at 31 days', r);

console.log('Daily, monthly, exceptions');
r = run('3001', 'att_daily', { from: W[0], to: W[0], emps: [ids['5002']] });
ok(r.ok && r.rows.length === 1 && r.rows[0].checkIn === '08:40' && r.rows[0].checkOut === '17:05' && r.rows[0].late === 40, 'one day: times in Riyadh time, minutes late', r.rows);
r = run('3001', 'att_monthly', { month: '2026-10', emps: [ids['5003']] });
const m = r.rows[0];
ok(r.ok && m['d' + Number(absent5003[0].slice(8))] === 'A' && m['d' + Number(leave5003[0].slice(8))] === 'V' && m.d2 === 'O', 'month grid codes: A absent, V leave, O off', { a: m['d' + Number(absent5003[0].slice(8))], v: m['d' + Number(leave5003[0].slice(8))], fri: m.d2 });
ok(r.columns.filter(c => /^d\d+$/.test(c.key)).length === 31 && r.wide, '31 day columns, wide layout');
r = run('3001', 'att_exceptions', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.rows.length === 1 && r.rows[0].status === 'review' && r.rows[0].flags === 'edge', 'exceptions list punches held for review', r.rows);

console.log('Leave and requests');
r = run('3001', 'leave_balances', { asOf: '2026-10-31' });
const lb = r.rows.find(x => x.empNo === '5002');
ok(r.ok && lb.opening === 10 && near(lb.accrued, 30 * 31 / 365.25 * (21 / 21) * (30 / 30), 3) && 'liability' in lb, 'balances: opening + accrual; HR sees the money liability', lb);
ok(r.checks.some(c => c.code === 'opening_missing' && c.count === 1), 'a check flags the one person with no opening balance', r.checks);
r = run('5001', 'leave_balances', { asOf: '2026-10-31' });
ok(r.ok && r.rows.length === 2 && !r.columns.some(c => c.key === 'liability') && !('liability' in r.rows[0]), 'a manager never sees the leave liability column', r.columns.map(c => c.key));
r = run('3001', 'requests_log', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.rows.some(x => x.type === 'advance'), 'HR sees advance requests in the log');
r = run('5001', 'requests_log', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.rows.length === 1 && !r.rows.some(x => x.type === 'advance'), 'a manager never sees an advance (salary related)', r.rows);
r = run('3001', 'leave_taken', { from: '2026-10-01', to: '2026-10-31' });
ok(r.ok && r.rows.length === 1 && r.rows[0].days === 2, 'leave taken in the period');

console.log('People');
r = run('3001', 'hr_headcount');
ok(r.ok && r.rows.length === 9 && r.checks.some(c => c.code === 'no_iban' && c.count === 8), 'headcount with a missing-IBAN check', r.checks);
ok(r.rows.find(x => x.empNo === '5002').manager === 'مشرف المبيعات', 'headcount shows the line manager');
r = run('3001', 'hr_expiry', { days: 3650 });
ok(r.ok && r.rows.some(x => x.empNo === '5004' && x.kind === 'contract_end'), 'expiry lists the fixed-term contract end');
r = run('3005', 'hr_saudization');
ok(r.ok && r.rows.every(x => x.headcount >= 5), 'Saudization by department for the executive: departments of fewer than 5 people are folded together', r.rows);
const sd = run('3001', 'hr_saudization').rows.find(x => x.department === 'المبيعات');
ok(sd && sd.headcount === 2 && sd.saudis === 2, 'Saudization by department for HR: every department, as before', sd);

console.log('Payroll reports');
ok(call('3002', 'payrollCreate', { month: '2026-10' }).ok, 'October payroll drafted');
r = run('3002', 'pay_register');
const pr = r.rows.find(x => x.empNo === '5002');
ok(r.ok && r.rows.length === 4 && pr.basic === 9000 && pr.gross === 12150, 'register itemises the package', pr);
ok(pr.iban === 'SA03••••7519', 'the IBAN is masked in the register', pr.iban);
ok(r.checks.some(c => c.code === 'no_iban' && c.level === 'error' && c.count === 3), 'blocking check: three payslips with no IBAN', r.checks);
const ct = r.checks.find(c => c.code === 'control_total');
ok(ct && near(ct.value, r.rows.reduce((t, x) => t + x.net, 0), 0.01), 'control total equals the sum of net pay', ct);
r = run('3002', 'pay_gosi');
ok(r.ok && r.rows.find(x => x.empNo === '5002').cohort === 'legacy' && r.checks.some(c => c.code === 'gosi_cohort_missing'), 'GOSI report with cohort check', r.checks);
r = run('3005', 'pay_cost');
ok(r.ok && r.rows.every(x => x.headcount >= 5) && !JSON.stringify(r.rows).includes('SA03'), 'executive: department cost in groups of 5 or more people, no individual lines', r.rows.map(x => [x.department, x.headcount]));
ok(run('3002', 'pay_cost').rows.length === 3, 'payroll (who sees individuals anyway): every department row');
r = run('3002', 'pay_eos', { asOf: '2026-10-31' });
const eo = r.rows.find(x => x.empNo === '5002');
const yrs = (Date.parse('2026-10-31') - Date.parse('2019-01-01')) / 864e5 + 1;
ok(r.ok && near(eo.years, yrs / 365, 0.01) && near(eo.awardFull, 5 * 12150 / 2 + (yrs / 365 - 5) * 12150, 1), 'EOS liability: half a month for five years, a month after', eo);
ok(near(eo.awardResignation, eo.awardFull * 2 / 3, 1), 'resignation after 5-10 years: two thirds (Art. 85)');

r = run('3002', 'pay_equity');
ok(r.ok && r.rows.length >= 1 && r.columns.some(c => c.key === 'genderGap') && r.checks.some(c => c.code === 'no_gender'), 'pay equity by position with gender and nationality gaps', r.checks);
ok(run('5001', 'pay_equity').error === 'forbidden' && run('3005', 'pay_equity').error === 'forbidden', 'pay equity is per-person pay: HR and payroll only');
console.log('Exports: numbered, fingerprinted, reviewed, verified');
r = call('3001', 'reportExport', { reportId: 'att_summary', format: 'xlsx', params: { from: '2026-10-01', to: '2026-10-31' } });
ok(r.ok && /^RPT-2026-00001$/.test(r.export.ref) && /^[0-9a-f]{64}$/.test(r.export.hash), 'the export gets an RPT number and a SHA-256', r.export);
const ref1 = r.export.ref, hash1 = r.export.hash;
const again = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31' });
ok(again.rows.length === r.rows.length, 'the export carries the same rows as a run');
r = call('3001', 'reportExport', { reportId: 'att_summary', format: 'pdf', params: { from: '2026-10-01', to: '2026-10-31' } });
ok(r.export.ref === 'RPT-2026-00002' && r.export.hash === hash1, 'same data, next number, same fingerprint');
r = call('5001', 'reportExport', { reportId: 'att_summary', format: 'csv', params: { from: '2026-10-01', to: '2026-10-31' } });
ok(r.ok && r.export.hash !== hash1 && r.rows.length === 2, 'a manager\'s export is their own rows with their own fingerprint');
r = call('3001', 'reportReview', { ref: ref1 });
ok(!r.ok && r.error === 'second_approver_required', 'the maker cannot review their own export', r);
r = call('3002', 'reportReview', { ref: ref1, note: 'checked against the sheet' });
ok(r.ok, 'a second person marks it reviewed');
r = call('3004', 'reportReview', { ref: ref1 });
ok(!r.ok && r.error === 'already_submitted', 'reviewed once only', r);
r = call('3001', 'reportLog');
const lg = r.rows.find(x => x.ref === ref1);
ok(r.ok && lg.reviewedBy === 'محاسب الرواتب' && lg.reviewNote === 'checked against the sheet' && lg.by === 'الموارد البشرية', 'the log shows maker, reviewer and note', lg);
r = call('3005', 'reportVerify', { ref: ref1.toLowerCase(), hash: hash1.slice(0, 16) });
ok(r.ok && r.found && r.match === true && r.unchanged === true, 'verify: genuine and unchanged (short hash accepted)', r);
r = call('3005', 'reportVerify', { ref: ref1, hash: 'deadbeefdeadbeef' });
ok(r.ok && r.found && r.match === false, 'verify: a wrong fingerprint does not match', r.match);
r = call('3005', 'reportVerify', { ref: 'RPT-2026-09999' });
ok(r.ok && r.found === false, 'verify: an unknown number is reported as not found');
direct(() => B.ctx.append_('punches', { id: 'PLATE', empId: ids['5003'], type: 'in', ts: at(absent5003[0], '09:00'), date: absent5003[0], lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'manual', risk: 0, flags: '', source: 'hr:x', note: 'forgot', reviewBy: ids['3001'], reviewAt: '', credId: '', ua: '', createdAt: at(absent5003[0], '09:00') }));
r = call('3005', 'reportVerify', { ref: ref1, hash: hash1 });
ok(r.ok && r.match === true && r.unchanged === false, 'verify: data changed since the export is detected', r);
r = call('5004', 'reportVerify', { ref: ref1 });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot use the verifier', r);
r = call('3001', 'reportExport', { reportId: 'att_summary', format: 'xlsx', params: { from: '2026-10-01', to: '2026-10-31' }, columns: ['empNo', 'name', 'absent', 'nope'] });
ok(r.ok && r.columns.map(c => c.key).join() === 'empNo,name,absent' && r.export.hash !== hash1, 'an export of chosen columns carries only those, with its own fingerprint', r.columns && r.columns.map(c => c.key));
const refC = r.export.ref, hashC = r.export.hash;
r = call('3005', 'reportVerify', { ref: refC, hash: hashC });
ok(r.ok && r.match === true && r.unchanged === true, 'verifying a column-chosen export re-runs with the same columns', r);
const aud = direct(() => B.ctx.readAll_('audit')).filter(a => a.action === 'report_export');
ok(aud.length === 4, 'every export is in the audit trail', aud.length);
const sv = direct(() => B.ctx.readAll_('audit')).filter(a => a.action === 'salary_view');
ok(sv.length >= 3, 'running a money report writes a salary-view audit line', sv.length);

// =====================================================================================================
// Analytical reports (2026-10-04): fixture, then shape, a hand-computed figure, and access for every new report.
// =====================================================================================================
console.log('Analytical reports: fixture');
const NEW = ['att_dept_trend', 'att_punctuality', 'att_late_top', 'att_bradford', 'att_weekday', 'att_checkin_bands', 'att_missing_out', 'att_flags', 'att_overtime',
  'leave_util_dept', 'leave_type_month', 'leave_upcoming', 'leave_sick_bradford', 'leave_yearend_risk', 'leave_liability_trend',
  'pay_company_cost', 'pay_gosi_wage', 'pay_var_lines', 'pay_ytd', 'pay_bands', 'pay_gosi_cohort', 'pay_deductions', 'pay_ot_trend', 'pay_cost_per_head',
  'wf_snapshot', 'wf_joiners', 'wf_leavers', 'wf_turnover_dept', 'wf_tenure', 'wf_span', 'wf_org', 'wf_vacancies', 'wf_probation',
  'perf_curve', 'perf_kpi', 'perf_360', 'perf_plans', 'req_sla', 'req_bottlenecks', 'req_volume',
  'cmp_disciplinary', 'cmp_injuries', 'cmp_custody', 'cmp_clearance', 'cmp_wps'];
const REQ0 = { ref: '', subtype: '', fromDate: '', toDate: '', days: '', amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', updatedAt: '', decidedAt: '' };
const rq = o => Object.assign({}, REQ0, o);
const pz = (id, no, ds, hm, extra) => Object.assign({ id, empId: ids[no], type: 'in', ts: at(ds, hm), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app',
  note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, hm) }, extra);
direct(() => {
  const X = B.ctx, E = no => X.findBy_('employees', 'empNo', no);
  [['5001', 'male'], ['5002', 'male'], ['5003', 'female'], ['5004', 'male']].forEach(([no, g]) => { const e = E(no); e.gender = g; X.update_('employees', e); });
  X.appendMany_('positions', [
    { id: 'POS1', code: 'SR', titleAr: 'مندوب مبيعات', departmentId: dept, grade: 'G3', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'POS2', code: 'AC', titleAr: 'محاسب', departmentId: other, grade: 'G4', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'POS3', code: 'WS', titleAr: 'مشرف مستودع', departmentId: dept, grade: 'G5', status: 'active', createdAt: '2026-09-01T00:00:00Z' }]);
  [['5002', 'POS1'], ['5003', 'POS1'], ['5004', 'POS2']].forEach(([no, pid]) => { const e = E(no); e.positionId = pid; X.update_('employees', e); });
  const e4 = E('5004'); e4.leaveOpeningDays = 30; X.update_('employees', e4);
  // a leaver (resigned, left 15 Aug) and a new hire still in probation
  X.append_('employees', { id: 'E5005', empNo: '5005', name: 'موظف 5005', role: 'employee', status: 'disabled', departmentId: dept, positionId: 'POS3', hireDate: '2025-03-01',
    lastWorkingDay: '2026-08-15', resignedOn: '2026-07-15', nationality: 'SA', isSaudi: true, gender: 'male', createdAt: '2026-09-01T00:00:00.000Z', tokenVer: 1 });
  X.append_('employees', { id: 'E5006', empNo: '5006', name: 'موظف 5006', role: 'employee', status: 'active', departmentId: sub, managerId: ids['5001'], hireDate: '2026-11-01',
    probationEnd: '2026-11-25', nationality: 'IN', isSaudi: false, gender: 'male', createdAt: '2026-11-04T05:00:00.000Z', tokenVer: 1 });
  X.append_('empPrivate', { empId: ids['5004'], nationalId: '2000000001', gosiWage: 9000, updatedAt: '' });
  X.appendMany_('requests', [
    rq({ id: 'L1', ref: 'LV-2026-00011', empId: ids['5002'], type: 'leave', subtype: 'annual', fromDate: '2026-11-10', toDate: '2026-11-11', days: 2, createdAt: '2026-10-25T06:00:00.000Z', decidedAt: '2026-10-26T06:00:00.000Z' }),
    rq({ id: 'L2', ref: 'LV-2026-00012', empId: ids['5001'], type: 'leave', subtype: 'annual', fromDate: '2026-11-10', toDate: '2026-11-11', days: 2, status: 'pending', step: 'hr', createdAt: '2026-11-02T06:00:00.000Z' }),
    rq({ id: 'L3', ref: 'LV-2026-00013', empId: ids['5003'], type: 'leave', subtype: 'annual', fromDate: '2026-11-10', toDate: '2026-11-10', days: 1, status: 'pending', step: 'manager', createdAt: '2026-11-01T06:00:00.000Z' }),
    rq({ id: 'S1', ref: 'LV-2026-00021', empId: ids['5004'], type: 'leave', subtype: 'sick', fromDate: '2026-10-05', toDate: '2026-10-05', days: 1, createdAt: '2026-10-05T06:00:00.000Z', decidedAt: '2026-10-05T08:00:00.000Z' }),
    rq({ id: 'S2', ref: 'LV-2026-00022', empId: ids['5004'], type: 'leave', subtype: 'sick', fromDate: '2026-10-11', toDate: '2026-10-12', days: 2, createdAt: '2026-10-11T06:00:00.000Z', decidedAt: '2026-10-11T08:00:00.000Z' }),
    rq({ id: 'S3', ref: 'LV-2026-00023', empId: ids['5003'], type: 'leave', subtype: 'sick', fromDate: '2026-10-01', toDate: '2026-10-01', days: 1, createdAt: '2026-10-01T06:00:00.000Z', decidedAt: '2026-10-01T08:00:00.000Z' }),
    rq({ id: 'S4', ref: 'LV-2026-00024', empId: ids['5003'], type: 'leave', subtype: 'sick', fromDate: '2026-10-04', toDate: '2026-10-04', days: 1, createdAt: '2026-10-04T06:00:00.000Z', decidedAt: '2026-10-04T08:00:00.000Z' }),
    // two corrections with their approval history: manager 4 h and 30 h, HR 48 h and 72 h
    rq({ id: 'RS1', ref: 'AC-2026-00001', empId: ids['5002'], type: 'correction', createdAt: '2026-10-05T06:00:00.000Z', decidedAt: '2026-10-07T10:00:00.000Z',
      stepsJson: JSON.stringify([{ step: 'manager', by: ids['5001'], role: 'manager', decision: 'approve', at: '2026-10-05T10:00:00.000Z' }, { step: 'hr', by: ids['3001'], role: 'hr', decision: 'approve', at: '2026-10-07T10:00:00.000Z' }]) }),
    rq({ id: 'RS2', ref: 'AC-2026-00002', empId: ids['5003'], type: 'correction', createdAt: '2026-10-12T06:00:00.000Z', decidedAt: '2026-10-16T12:00:00.000Z',
      stepsJson: JSON.stringify([{ step: 'manager', by: ids['5001'], role: 'manager', decision: 'approve', at: '2026-10-13T12:00:00.000Z' }, { step: 'hr', by: ids['3001'], role: 'hr', decision: 'approve', at: '2026-10-16T12:00:00.000Z' }]) })]);
  X.appendMany_('punches', [pz('PFX1', '5002', '2026-10-20', '07:58', { status: 'rejected', flags: 'static_samples,few_samples', risk: 45 }),
    pz('PFX2', '5003', '2026-10-21', '07:56', { status: 'approved', flags: 'new_device', risk: 10 })]);
  X.appendMany_('adjustments', [{ id: 'AJ1', ref: 'ADJ-T1', empId: ids['5002'], month: '2026-09', kind: 'earning', code: 'bonus', amount: 1500, reason: 'مكافأة', enteredBy: ids['3001'], status: 'active', createdAt: '2026-09-28T00:00:00Z' },
    { id: 'AJ2', ref: 'ADJ-T2', empId: ids['5004'], month: '2026-09', kind: 'hours', code: 'overtime_hours', amount: 4, reason: 'جرد', enteredBy: ids['3001'], status: 'active', createdAt: '2026-09-28T00:00:00Z' }]);
  X.append_('salaryRecon', { id: 'Q1', ref: 'REC-2026-00001', month: '2026-10', source: 'gosi', total: 3, matched: 2, mismatchesJson: JSON.stringify([{ empId: ids['5002'], empNo: '5002', name: 'موظف 5002', ours: 11250, theirs: 10000, diff: -1250 }]),
    missingJson: '[]', unknownJson: '[]', status: 'open', by: ids['3002'], at: '2026-11-03T08:00:00.000Z', resolvedBy: '', resolvedAt: '', note: '' });
  X.append_('perfCycles', { id: 'CY1', ref: 'PC-2026-00001', year: 2026, nameAr: 'تقييم 2026', nameEn: 'Review 2026', type: 'annual', status: 'review', kpiWeight: 70, compWeight: 30, createdBy: ids['3001'], createdAt: '2026-09-15T00:00:00Z' });
  X.appendMany_('kpis', [[40, 'on_track'], [30, 'at_risk'], [30, '']].map(([w, m], i) => ({ id: 'K' + i, ref: 'KPI-' + i, cycleId: 'CY1', empId: ids['5002'], titleAr: 'هدف ' + i, weight: w, status: 'agreed', midStatus: m, createdAt: '2026-09-20T00:00:0' + i + 'Z' })));
  X.appendMany_('reviews', [['5002', 3.42, '2026-10-20T00:00:00Z'], ['5003', 4.6, ''], ['5004', 2.2, '']].map(([no, ov, self], i) => ({ id: 'V' + i, ref: 'RV-' + i, cycleId: 'CY1', empId: ids[no], stage: 'manager',
    selfAt: self, overall: ov, kpiScore: ov, compScore: ov, finalRating: '', createdAt: '2026-10-01T00:00:00Z' })));
  X.appendMany_('feedback360', [['5002', 'self', 'submitted'], ['5001', 'manager', 'submitted'], ['5003', 'peer', 'submitted'], ['5004', 'peer', 'invited']].map(([no, rel, st], i) => ({ id: 'F' + i, ref: 'FB-' + i,
    cycleId: 'CY1', subjectId: ids['5002'], raterId: ids[no], relation: rel, status: st, answersJson: '', comment: '', createdAt: '2026-10-01T00:00:00Z', submittedAt: st === 'submitted' ? '2026-10-10T00:00:00Z' : '' })));
  X.appendMany_('devPlans', [
    { id: 'D1', ref: 'PIP-2026-00001', empId: ids['5003'], type: 'pip', titleAr: 'تحسين', reason: 'x', goalsJson: JSON.stringify([{ title: 'أ', status: 'met' }, { title: 'ب', status: 'at_risk' }]), support: 'y',
      startDate: '2026-09-01', endDate: '2026-10-31', status: 'active', checkInsJson: JSON.stringify([{ date: '2026-10-01', note: 'n', by: 'x' }]), ackAt: '', createdBy: ids['5001'], createdAt: '2026-09-01T00:00:00Z' },
    { id: 'D2', ref: 'IDP-2026-00001', empId: ids['5002'], type: 'idp', titleAr: 'تطوير', reason: '', goalsJson: JSON.stringify([{ title: 'ج', status: 'open' }]), support: '',
      startDate: '2026-10-01', endDate: '2027-09-30', status: 'active', checkInsJson: JSON.stringify([{ date: '2026-11-01', note: 'n', by: 'x' }]), ackAt: '2026-10-02T00:00:00Z', createdBy: ids['5001'], createdAt: '2026-10-01T00:00:00Z' }]);
  X.appendMany_('discCases', [
    { id: 'J1', ref: 'DSC-2026-00001', empId: ids['5002'], code: 'LATE15', violation: 'التأخر حتى 15 دقيقة', occurrence: 1, incidentDate: '2026-10-06', discoveredDate: '2026-10-06', reportedBy: ids['5001'],
      chargedAt: '2026-10-07T08:00:00.000Z', decision: 'warning', decidedBy: ids['3001'], decidedAt: '2026-10-10T08:00:00.000Z', amount: '', status: 'decided', createdAt: '2026-10-07T08:00:00.000Z' },
    { id: 'J2', ref: 'DSC-2026-00002', empId: ids['5002'], code: 'LATE15', violation: 'التأخر حتى 15 دقيقة', occurrence: 2, incidentDate: '2026-10-20', discoveredDate: '2026-10-20', reportedBy: ids['5001'],
      chargedAt: '2026-10-21T08:00:00.000Z', decision: 'fine_pct:5', decidedBy: ids['3001'], decidedAt: '2026-10-25T08:00:00.000Z', amount: 20.25, status: 'decided', createdAt: '2026-10-21T08:00:00.000Z' },
    { id: 'J3', ref: 'DSC-2026-00003', empId: ids['5003'], code: 'ABS1', violation: 'الغياب يوما', occurrence: 1, incidentDate: '2026-09-18', discoveredDate: '2026-09-18', reportedBy: ids['5001'],
      chargedAt: '2026-09-20T08:00:00.000Z', decision: '', amount: '', status: 'charged', createdAt: '2026-09-20T08:00:00.000Z' }]);
  X.appendMany_('injuries', [
    { id: 'I1', ref: 'INJ-2026-00001', empId: ids['5004'], occurredAt: '2026-10-10T09:00', place: 'المستودع', description: 'جرح في اليد', reportedBy: ids['5004'], reportedAt: '2026-10-10T10:00:00Z',
      gosiDue: '2026-10-13', gosiRef: 'G-1', gosiReportedAt: '2026-10-15T08:00:00.000Z', offFrom: '2026-10-11', offTo: '2026-10-13', status: 'gosi_notified', createdAt: '2026-10-10T10:00:00Z' },
    { id: 'I2', ref: 'INJ-2026-00002', empId: ids['5002'], occurredAt: '2026-10-28T10:00', place: 'الساحة', description: 'التواء في القدم', reportedBy: ids['5001'], reportedAt: '2026-10-28T11:00:00Z',
      gosiDue: '2026-10-31', gosiRef: '', gosiReportedAt: '', offFrom: '', offTo: '', status: 'reported', createdAt: '2026-10-28T11:00:00Z' }]);
  X.appendMany_('assets', [['T1', 'vehicle', 85000], ['T2', 'pos', 1200], ['T3', 'phone', 2500]].map(([id, ty, v]) => ({ id, ref: 'AST-' + id, type: ty, nameAr: ty, serial: id, value: v, status: 'assigned', createdAt: '2025-01-01T00:00:00Z' })));
  X.appendMany_('custody', [['C1', 'T1', '5002', '2026-09-15T08:00:00Z', '2026-09-15T09:00:00Z'], ['C2', 'T2', '5002', '2026-10-01T08:00:00Z', ''], ['C3', 'T3', null, '2025-05-01T08:00:00Z', '2025-05-01T09:00:00Z']]
    .map(([id, a, no, h, ack]) => ({ id, assetId: a, empId: no ? ids[no] : 'E5005', handedAt: h, handedBy: ids['3001'], conditionOut: 'سليم', ackAt: ack, status: 'held' })));
  X.append_('clearance', { id: 'K1', ref: 'CLR-2026-00001', empId: 'E5005', lastDay: '2026-08-15', reason: 'resignation', status: 'open', createdBy: ids['3001'], createdAt: '2026-07-20T00:00:00Z',
    tasksJson: JSON.stringify(X.CLR_TASKS.map(t => ({ key: t.key, owner: t.owner, status: t.key === 'handover' ? 'done' : 'open', by: '', at: '' }))) });
  X.appendMany_('onboarding', [['contract', 'done'], ['gosi', 'open'], ['probation', 'open']].map(([k, st], i) => ({ id: 'O' + i, ref: 'ONB-' + i, empId: 'E5006', taskKey: k, owner: 'hr', dueDate: k === 'probation' ? '2026-11-20' : '2026-11-01',
    status: st, createdBy: ids['3001'], createdAt: '2026-11-01T00:00:00Z' })));
});
r = call('3002', 'payrollCreate', { month: '2026-09' });
const sepRun = r.run;
ok(r.ok && call('3004', 'payrollApprove', { id: sepRun.id }).ok, 'September run prepared by one payroll holder and locked by the other');
const octRun = call('3002', 'reportCatalog').runs.find(x => x.month === '2026-10');
const team = new Set(['5002', '5003', '5006']);
const OCT = { from: '2026-10-01', to: '2026-10-31' };
const prmOf = id => {
  const ps = B.ctx.REPORTS[id].params, o = {};
  if (ps.some(x => /^range/.test(x))) Object.assign(o, id === 'wf_joiners' || id === 'wf_leavers' ? { from: '2026-01-01', to: '2026-12-31' } : OCT);
  if (ps.includes('month')) o.month = '2026-10';
  if (ps.includes('asOf')) o.asOf = '2026-10-31';
  if (ps.includes('days')) o.days = 90;
  if (ps.includes('cycle')) o.cycle = 'CY1';
  return o;
};
const rowOf = (res, f) => (res.rows || []).find(f) || {};
const emp = no => x => x.empNo === no;

console.log('Analytical reports: shape, strings, access, one read per tab');
ok(NEW.length === 45 && NEW.every(id => B.ctx.REPORTS[id] && B.ctx.REPORT_FNS[id]) && Object.keys(B.ctx.REPORTS).length === 19 + NEW.length + 4, '45 new reports (plus the 4 talent reports, tested in sim50), each in the catalogue with its function', Object.keys(B.ctx.REPORTS).length);
// Every report id, column key, check code and code value has its Arabic and English text in js/reports.js.
const JS = fs.readFileSync(path.join(__dirname, '..', 'js', 'reports.js'), 'utf8');
const block = name => { const i = JS.indexOf('var ' + name + ' = {'); const j = JS.indexOf('\n};', i); return i < 0 ? '' : JS.slice(i, j); };
const keysOf = txt => new Set((txt.match(/(?:^|[{,\s])'?([A-Za-z0-9_<+\-]+)'?\s*:\s*\[/gm) || []).map(m => m.replace(/^[{,\s]*'?/, '').replace(/'?\s*:\s*\[$/, '')));
const K = { RPT: keysOf(block('RPT')), COLS: keysOf(block('COLS')), CODES: keysOf(block('CODES')), CHECKS: keysOf(block('CHECKS')) };
const GROUPS = new Set((block('GROUPS') || JS.slice(JS.indexOf('var GROUPS'), JS.indexOf('var COLS'))).match(/\['([a-z]+)'/g).map(x => x.slice(2, -1)));
const RES = {}, bad = [], miss = new Set();
const known = (key, v) => K.CODES.has(String(v)) || ['type'].includes(key) || ['leaveType'].includes(key) || (key === 'status' && ['approved', 'pending', 'rejected', 'cancelled'].includes(v)) ||
  ['manager', 'hr', 'payroll'].includes(v) || (key === 'approver' && !/^[a-z_]+$/.test(String(v)));
const reads = {};
Object.keys(B.sheets).forEach(n => { const sh = B.sheets[n], orig = sh.getDataRange.bind(sh); sh.getDataRange = () => { reads[n] = (reads[n] || 0) + 1; return orig(); }; });
const twice = [];
NEW.forEach(id => {
  Object.keys(reads).forEach(k => delete reads[k]);
  const res = RES[id] = run('3001', id, prmOf(id));
  Object.keys(reads).forEach(k => { if (reads[k] > 1) twice.push(id + ':' + k + 'x' + reads[k]); });
  if (!res.ok) { bad.push(id + ' ' + res.error); return; }
  const keys = new Set(res.columns.map(c => c.key));
  if (!res.columns.length || !res.columns.every(c => typeof c.key === 'string' && typeof c.type === 'string')) bad.push(id + ' columns');
  if (!Array.isArray(res.rows) || !res.rows.length) bad.push(id + ' no rows');
  if (!res.checks.every(c => ['error', 'warn', 'info'].includes(c.level) && typeof c.code === 'string' && typeof c.count === 'number')) bad.push(id + ' checks');
  const ch = res.chart;
  if (ch && !(['bars', 'hbar'].includes(ch.type) && (ch.type === 'bars' ? keys.has(ch.by) : keys.has(ch.label)) && (ch.value === 'count' || keys.has(ch.value)))) bad.push(id + ' chart');
  if (!K.RPT.has(id)) miss.add('RPT:' + id);
  if (!GROUPS.has(B.ctx.REPORTS[id].group)) miss.add('GROUP:' + B.ctx.REPORTS[id].group);
  res.columns.forEach(c => { if (!K.COLS.has(c.key)) miss.add('COLS:' + c.key); });
  res.checks.forEach(c => { if (!K.CHECKS.has(c.code)) miss.add('CHECKS:' + c.code); });
  res.columns.filter(c => c.type === 'code' || c.type === 'status').forEach(c => res.rows.forEach(x => { const v = x[c.key]; if (v != null && v !== '' && !known(c.key, v)) miss.add('CODES:' + c.key + '=' + v); }));
});
ok(bad.length === 0, 'each new report returns columns {key, type}, rows, checks {level, code, count} and a chart hint on its own columns', bad);
ok(miss.size === 0, 'every report name, column, check and code has its Arabic and English text in js/reports.js', [...miss]);
ok(twice.length === 0, 'no report reads a Sheet tab twice in one request', twice);

const acc = { manager: [], admin: [], exec: [], employee: [], payroll: [] };
NEW.forEach(id => {
  const a = B.ctx.REPORTS[id].access, p = prmOf(id);
  const m = run('5001', id, p), ad = run('1000', id, p), ex = run('3005', id, p), em = run('5004', id, p), pa = run('3002', id, p);
  if (a === 'people' ? !(m.ok && m.teamOnly && m.rows.every(x => !x.empNo || team.has(String(x.empNo)))) : m.error !== 'forbidden') acc.manager.push(id);
  if (a === 'people' ? !(ad.ok && !ad.teamOnly) : ad.error !== 'forbidden') acc.admin.push(id);
  if (a === 'money' ? ex.error !== 'forbidden' : !ex.ok) acc.exec.push(id);
  if (em.error !== 'forbidden') acc.employee.push(id);
  if (!pa.ok) acc.payroll.push(id);
});
ok(acc.manager.length === 0, 'a manager runs the people reports for their own team only (row-level security), and no money or cost report', acc.manager);
ok(acc.admin.length === 0, 'strict mode: the administrator alone is refused every money and cost report', acc.admin);
ok(acc.exec.length === 0, 'the executive gets cost totals and people reports, never per-person pay', acc.exec);
ok(acc.employee.length === 0 && acc.payroll.length === 0, 'an employee with no team runs none; payroll runs all of them', acc);

console.log('Analytical reports: hand-computed figures');
r = RES.att_dept_trend;
let x = rowOf(r, y => y.department === 'مبيعات الرياض');
ok(x.expected === 19 && x.present === 18 && x.absent === 1 && x.attendance === 94.7 && x.prevRate === 0 && x.changePts === 94.7, 'attendance trend: 5003 in October 18 / 19 expected (two leave days out) = 94.7%, September 0%', x);
x = rowOf(RES.att_punctuality, y => y.month === '2026-10');
ok(x.lateDays === 4 && x.lateMin === 180 && x.avgLate === 45 && x.medianLate === 40 && x.p90Late === 54 && x.punctuality === 93.3, 'punctuality: 4 late of 60 (93.3%); minutes 40,40,40,60: mean 45, median 40, p90 54', x);
r = RES.att_late_top;
ok(r.rows[0].empNo === '5002' && r.rows[0].rank === 1 && r.rows[0].lateMin === 120 && r.rows[0].lateRate === 14.3 && r.rows[1].empNo === '5003' && r.checks.find(c => c.code === 'late_top_share').value === 100,
  'lateness ranking: 5002 first, 3 of 21 days (14.3%), 120 minutes; the top ten hold 100%', r.rows.slice(0, 2));
x = rowOf(RES.att_bradford, emp('5003'));
ok(x.spells === 1 && x.absent === 1 && x.bradford === 1 && x.prev === 22 && x.change === -21, 'Bradford: one day absent in October = 1; September absent all 22 working days is ONE spell over the weekends = 1 x 1 x 22', x);
x = rowOf(RES.att_weekday, y => y.weekday === 'sun');
ok(x.expected === 11 && x.absent === 1 && x.absentRate === 9.1 && x.prevAbsentRate === 100 && rowOf(RES.att_weekday, y => y.weekday === 'thu').lateRate === 14.3, 'weekdays: Sundays 1 absent of 11 (9.1%) against 100% in September; Thursdays 2 late of 14', x);
x = rowOf(RES.att_checkin_bands, y => y.department === 'المبيعات' && y.band === 'late_60');
ok(x.arrivals === 3 && x.share === 14.3 && RES.att_checkin_bands.checks.find(c => c.code === 'late_arrivals').count === 4, 'check-in bands: 3 of 5002\'s 21 arrivals were 31-60 minutes late; 4 late arrivals in all', x);
x = rowOf(RES.att_missing_out, emp('5003'));
ok(x.missingOut === 1 && x.lastDate === absent5003[0] && x.missingRate === 5.6, 'missing check-out: the hand-entered 09:00 check-in on 8 October left open (1 of 18 days)', x);
r = RES.att_flags;
ok(rowOf(r, y => y.flag === 'edge').pendingReview === 1 && rowOf(r, y => y.flag === 'static_samples').rejectedN === 1 && rowOf(r, y => y.flag === 'new_device').approvedN === 1 && rowOf(r, y => y.flag === 'edge').share === 0.8,
  'risk flags: edge held for review (1 of 121 app punches = 0.8%), frozen samples rejected, new device approved', r.rows);
x = rowOf(RES.att_overtime, emp('5002'));
ok(x.overtime === 3 && x.otDays === 18 && x.estCost === 208.13, 'overtime: 18 days x 10 minutes = 3 h; Art. 107 cost 3 x (12150/240 + 50% x 9000/240) = 208.13', x);
r = run('5001', 'att_overtime', OCT);
ok(r.ok && !r.columns.some(c => c.key === 'estCost') && !r.rows.some(y => 'estCost' in y), 'a manager sees overtime hours but never the cost estimate');
ok(direct(() => B.ctx.readAll_('audit')).some(a => a.action === 'salary_view' && String(a.detail).includes('att_overtime')), 'the cost column writes a salary-view audit line for the hr role');

r = run('3001', 'leave_util_dept', { from: '2026-10-01', to: '2026-11-30' });
x = rowOf(r, y => y.department === 'المبيعات');
ok(x.headcount === 2 && x.earned === 7.48 && x.taken === 2 && x.utilisation === 26.7, 'leave utilisation: earned 61 x 30/365 + 30 x 30/365 = 7.48 days, taken 2 = 26.7%', x);
ok(rowOf(r, y => y.department === 'مبيعات الرياض').sickDays === 2 && rowOf(r, y => y.department === 'مبيعات الرياض').otherDays === 4 && rowOf(r, y => y.department === 'المالية').sickDays === 3, 'sick and other leave days beside it (unpaid counts calendar days)');
r = run('3001', 'leave_type_month', { from: '2026-10-01', to: '2026-11-30' });
x = rowOf(r, y => y.leaveType === 'sick' && y.month === '2026-10');
ok(x.days === 5 && x.requests === 4 && x.people === 2 && rowOf(r, y => y.leaveType === 'annual' && y.month === '2026-11').days === 2, 'leave by type and month: October sick 5 days, 4 requests, 2 people', x);
r = RES.leave_upcoming;
x = rowOf(r, y => y.ref === 'LV-2026-00011');
ok(r.rows.length === 3 && x.peakAway === 2 && x.peakShare === 100 && x.startsIn === 6 && r.checks.find(c => c.code === 'leave_overlap').count === 2 && r.checks.find(c => c.code === 'leave_pending').count === 2,
  'upcoming leave: both people of Sales away on 10-11 November (100%), starting in 6 days; two still pending', r.rows);
r = RES.leave_sick_bradford;
ok(rowOf(r, emp('5004')).bradford === 12 && rowOf(r, emp('5004')).spells === 2 && rowOf(r, emp('5004')).fullPayLeft === 27 && rowOf(r, emp('5003')).spells === 1 && rowOf(r, emp('5003')).sickDays === 2 && rowOf(r, emp('5003')).bradford === 2,
  'sick Bradford: 5004 2 spells x 3 days = 12; 5003 Thursday + Sunday is one spell over the weekend: 1 x 2 = 2', r.rows);
x = rowOf(RES.leave_yearend_risk, emp('5004'));
ok(x.projected === 35.29 && x.excess === 14.29 && x.perMonth === 7.02 && x.risk === 'high' && x.liability === 5144.4, 'year end: 30 + 92 x 21/365 = 35.29 days, 14.29 over one year, 7.02 a month to plan, worth 5,144.40', x);
r = run('5001', 'leave_yearend_risk', { asOf: '2026-10-31' });
ok(r.ok && !r.columns.some(c => c.key === 'liability') && !r.rows.some(y => y.empNo === '5004'), 'a manager: own team, no money column');
x = rowOf(RES.leave_liability_trend, y => y.month === '2026-10');
ok(x.headcount === 3 && x.liability === 19174.05 && x.prev === 17100 && x.change === 2074.05 && x.changePct === 12.1, 'leave liability: 12.55 x 405 + 11.78 x 225 + 31.78 x 360 = 19,174.05 against 17,100 at September end (unpaid leave up to 20 days still accrues, Art. 116)', x);

x = rowOf(RES.pay_company_cost, emp('5002'));
ok(x.gross === 12150 && x.gosiEmployer === 1321.88 && x.eosAccrual === 1012.5 && x.companyCost === 14484.38 && x.prev === 15984.38 && x.change === -1500 && x.changePct === -9.4 && x.share === 43,
  'company cost: 12,150 + 11.75% GOSI on 11,250 + 12,150/12 (over 5 years) = 14,484.38; September had the 1,500 bonus', x);
ok(near(RES.pay_company_cost.rows.reduce((t, y) => t + y.companyCost, 0), 33700.01, 0.001) && rowOf(RES.pay_company_cost, emp('5003')).eosAccrual === 281.25, 'company total 33,700.01; under 5 years the provision is wage / 24 (6,750 / 24 = 281.25)');
x = rowOf(RES.pay_gosi_wage, emp('5002'));
ok(x.contributory === 11250 && x.excluded === 900 && x.excludedPct === 7.4 && x.reconStatus === 'mismatch' && x.reconWage === 10000 && x.reconDiff === -1250 && RES.pay_gosi_wage.checks.find(c => c.code === 'recon_mismatch').level === 'error',
  'GOSI wage vs gross: 11,250 of 12,150 (900 outside); the GOSI upload says 10,000: a 1,250 mismatch, open = error', x);
r = run('3001', 'pay_gosi_wage', { run: sepRun.id });
x = rowOf(r, emp('5004'));
ok(x.registered === 9000 && x.contributory === 9000 && x.reason === 'registered_differs' && x.excluded === 2046.67 && r.checks.some(c => c.code === 'no_recon'), 'the wage HR registered with GOSI (9,000) differs from the package (10,000) and is the one used', x);
r = RES.pay_var_lines;
ok(r.rows.length === 2 && r.rows[0].empNo === '5002' && r.rows[0].line === 'bonus' && r.rows[0].effect === -1500 && r.rows[0].driver === 'yes' && r.rows[0].share === 100 &&
  r.rows[1].line === 'unpaid_leave' && r.rows[1].effect === -900 && r.checks[0].count === 2, 'variance by line: 5002 down 1,500 because of the September bonus; 5003 down 900 for 4 unpaid days', r.rows);
x = rowOf(RES.pay_ytd, emp('5002'));
ok(x.months === 2 && x.gross === 25800 && x.otherEarnings === 1500 && x.basic === 18000 && RES.pay_ytd.checks.some(c => c.code === 'ytd_includes_draft'), 'year to date: September (locked) + October (draft) = 25,800', x);
x = rowOf(RES.pay_bands, y => y.position === 'مندوب مبيعات');
ok(x.headcount === 2 && x.min === 6750 && x.median === 9450 && x.max === 12150 && x.spread === 80 && x.vsGrade === 0 && RES.pay_bands.checks.find(c => c.code === 'band_spread').count === 1, 'pay bands: 6,750 to 12,150, median 9,450, spread 80%', x);
r = RES.pay_gosi_cohort;
ok(rowOf(r, y => y.cohort === 'legacy').total === 3762.52 && rowOf(r, y => y.cohort === 'legacy').share === 95 && rowOf(r, y => y.cohort === 'non_saudi').prev === 180 && rowOf(r, y => y.cohort === 'non_saudi').change === 20,
  'GOSI by cohort: legacy 1,706.26 + 2,056.26 = 3,762.52 (95%); non-Saudi employer 2% of 10,000 against 2% of the registered 9,000', r.rows);
r = run('3005', 'pay_gosi_cohort', {});
ok(r.ok && r.rows.every(y => y.total === null) && r.checks.some(c => c.code === 'small_group_hidden' && c.count === 2), 'the executive sees no amount for a cohort of fewer than 3 people', r.rows);
r = RES.pay_deductions;
ok(rowOf(r, y => y.line === 'unpaid_leave').amount === 900 && rowOf(r, y => y.line === 'unpaid_leave').share === 34.5 && rowOf(r, y => y.line === 'gosi').ofGross === 5.7 && rowOf(r, y => y.line === 'gosi').change === 0,
  'deductions: unpaid leave 900 = 34.5% of all, GOSI 1,706.26 = 5.7% of gross, unchanged from September', r.rows);
r = run('3001', 'pay_ot_trend', { from: '2026-09-01', to: '2026-10-31' });
ok(rowOf(r, y => y.month === '2026-09').otAmount === 246.67 && rowOf(r, y => y.month === '2026-09').otHours === 4 && rowOf(r, y => y.month === '2026-10').changePct === -100, 'overtime trend: 4 h in September = 4 x (45 + 50% x 33.33) = 246.67, none in October', r.rows);
ok(rowOf(run('3005', 'pay_ot_trend', { from: '2026-09-01', to: '2026-10-31' }), y => y.month === '2026-09').otAmount === null, 'one person\'s overtime pay is hidden from the executive');
r = run('3005', 'pay_cost_per_head', { from: '2026-09-01', to: '2026-10-31' });
x = rowOf(r, y => y.month === '2026-10');
ok(x.headcount === 3 && x.companyCost === 33700.01 && x.perHead === 11233.34 && x.prev === 11808.89 && x.changePct === -4.9 && x.eosAccrual === 1743.75, 'cost per head: 33,700.01 / 3 = 11,233.34 against 35,426.68 / 3 in September (-4.9%), shown to the executive', x);
x = rowOf(run('3002', 'pay_cost', {}), y => y.department === 'المبيعات');
ok(x.companyCost === 14484.38 && x.eosAccrual === 1012.5 && x.prev === 15984.38 && x.change === -1500, 'cost by department now adds the end-of-service provision, company cost and the change from the last locked run (as payroll sees it)', x);

x = rowOf(RES.wf_snapshot, y => y.department === 'المبيعات');
ok(x.headcount === 2 && x.men === 2 && x.saudiShare === 100 && x.prev === 2 && rowOf(RES.wf_snapshot, y => y.department === 'مبيعات الرياض').women === 1, 'headcount snapshot: Sales 2 men, both Saudi, at 31 October', x);
x = rowOf(run('3001', 'wf_snapshot', { month: '2026-08' }), y => y.department === 'المبيعات');
ok(x.headcount === 2 && x.prev === 3 && x.leavers === 1 && x.change === -1 && x.changePct === -33.3, 'August: one leaver, 3 at July end to 2 (-33.3%)', x);
r = run('3001', 'wf_joiners', { from: '2025-01-01', to: '2025-12-31' });
ok(r.rows.length === 1 && r.rows[0].empNo === '5005' && r.rows[0].employed === 'no' && r.rows[0].tenureDays === 532 && r.checks.find(c => c.code === 'prev_count').count === 1, 'joiners 2025: 5005, gone after 532 days; one joiner the year before', r.rows);
ok(rowOf(run('3001', 'wf_joiners', { from: '2026-01-01', to: '2026-12-31' }), emp('5006')).onboarding === 33.3, 'joiners 2026: 5006, onboarding 1 of 3 tasks');
r = run('3001', 'wf_leavers', { from: '2026-01-01', to: '2026-12-31' });
x = r.rows[0] || {};
ok(r.rows.length === 1 && x.empNo === '5005' && x.years === 1.46 && x.tenureBand === '1-3' && x.reason === 'resignation' && x.voluntary === 'yes' && x.clearanceDone === 12.5, 'leavers: 5005 resigned after 532 / 365.25 = 1.46 years; clearance 1 of 8 tasks', x);
r = run('3001', 'wf_turnover_dept', { from: '2025-11-01', to: '2026-10-31' });
x = rowOf(r, y => y.department === 'المبيعات');
ok(x.avgHeadcount === 2.79 && x.leavers === 1 && x.voluntary === 1 && x.turnover === 35.8 && x.prevRate === 0 && r.checks.some(c => c.code === 'turnover_high'), 'turnover: 1 leaver / average 33.5 / 12 = 2.79 people = 35.8%', x);
x = rowOf(RES.wf_tenure, y => y.department === 'المبيعات');
ok(x.avgYears === 8.34 && x.medianYears === 8.34 && x.tenure5 === 2 && rowOf(RES.wf_tenure, y => y.department === 'مبيعات الرياض').newShare === 50, 'tenure: Sales (3229 + 2864) / 2 / 365.25 = 8.34 years; Riyadh half in their first year', x);
x = rowOf(RES.wf_span, emp('5001'));
ok(x.directs === 3 && x.totalReports === 3 && x.layers === 1 && x.spanBand === 'span_2_4', 'span of control: 5001 has 3 direct reports in one layer', x);
x = rowOf(RES.wf_org, emp('5002'));
ok(x.level === 2 && x.manager === 'مشرف المبيعات' && x.managerNo === '5001' && x.chain === 'مشرف المبيعات' && rowOf(RES.wf_org, emp('5001')).directs === 3, 'reporting lines: 5002 at level 2 under 5001', x);
r = RES.wf_vacancies;
ok(r.rows.length === 1 && r.rows[0].code === 'WS' && r.rows[0].vacantSince === '2026-08-15' && r.rows[0].daysVacant === 81 && r.rows[0].lastHolder === 'موظف 5005' && r.checks.find(c => c.code === 'positions_filled').count === 2,
  'vacancies: the warehouse supervisor post empty since 5005 left (81 days)', r.rows);
x = rowOf(RES.wf_probation, emp('5006'));
ok(x.daysLeft === 21 && x.window === 'd30' && x.probationDays === 24 && x.reviewTask === 'open' && RES.wf_probation.checks.some(c => c.code === 'probation_review_open'), 'probation: 5006 ends in 21 days with the review task still open', x);

r = RES.perf_curve;
x = rowOf(r, y => y.rating === 3);
ok(x.people === 1 && x.share === 33.3 && x.gap === -26.7 && r.checks.some(c => c.code === 'curve_few' && c.count === 3), 'rating curve: 3.42 / 4.6 / 2.2 round to 3, 5, 2; 33.3% at 3 is 26.7 points under the 60-75% range', r.rows);
x = rowOf(RES.perf_kpi, emp('5002'));
ok(x.kpis === 3 && x.weightTotal === 100 && x.midDone === 2 && x.onTrack === 1 && x.atRisk === 1 && x.completion === 50 && x.stage === 'pk_self', 'KPI progress: goals set and self review done, mid-year on 2 of 3 KPIs = 50%', x);
x = rowOf(RES.perf_360, emp('5002'));
ok(x.invited === 4 && x.submitted === 3 && x.responseRate === 75 && x.peers === 1 && x.peersShown === 'no', '360: 3 of 4 answered (75%); one peer is too few to show', x);
r = RES.perf_plans;
x = rowOf(r, y => y.ref === 'PIP-2026-00001');
ok(x.daysLeft === -4 && x.goalsMet === 1 && x.goalsAtRisk === 1 && x.sinceCheckIn === 34 && ['plan_overdue', 'plan_no_checkin', 'plan_not_acked'].every(k => r.checks.some(c => c.code === k && c.count === 1)), 'PIP past its end, 34 days since the last check-in, not acknowledged', x);

r = RES.req_sla;
x = rowOf(r, y => y.approvalStep === 'hr');
ok(x.decisions === 2 && x.avgHours === 60 && x.medianHours === 60 && x.p90Hours === 69.6 && x.withinSla === 50 && rowOf(r, y => y.approvalStep === 'manager').p90Hours === 27.4 && r.checks.find(c => c.code === 'sla_breach').count === 1,
  'approval SLA: HR took 48 and 72 hours (mean 60, p90 69.6, half within 48); the manager 4 and 30 (p90 27.4)', r.rows);
r = RES.req_bottlenecks;
x = rowOf(r, y => y.ref === 'AD-2026-00001');
ok(x.approver === 'hr' && x.rank === 1 && x.daysWaiting === 15.3 && rowOf(r, y => y.ref === 'LV-2026-00013').approver === 'مشرف المبيعات' && r.checks.some(c => c.code === 'waiting_over_7' && c.count === 1), 'bottlenecks: the advance has waited 15.3 days with HR; 5003\'s leave waits for 5001', r.rows);
r = run('5001', 'req_bottlenecks', {});
ok(r.rows.length === 1 && r.rows[0].ref === 'LV-2026-00013', 'the manager sees their team\'s waiting leave, never the salary advance', r.rows);
r = run('3001', 'req_volume', { from: '2026-09-01', to: '2026-11-30' });
ok(rowOf(r, y => y.type === 'correction' && y.month === '2026-10').avgHours === 77 && rowOf(r, y => y.type === 'leave' && y.month === '2026-11').openReq === 2 && rowOf(r, y => y.type === 'leave' && y.month === '2026-11').change === -4,
  'request volume: corrections took (52 + 102) / 2 = 77 hours; November leave 2 pending, 4 fewer than October', r.rows.filter(y => y.type !== 'advance'));
ok(!run('5001', 'req_volume', { from: '2026-09-01', to: '2026-11-30' }).rows.some(y => y.type === 'advance'), 'no advances in a manager\'s request volume');

r = run('3001', 'cmp_disciplinary', { from: '2026-01-01', to: '2026-12-31' });
x = rowOf(r, y => y.code === 'LATE15');
ok(x.cases === 2 && x.decided === 2 && x.repeat === 1 && x.warnings === 1 && x.fines === 1 && x.avgDays === 3.5 && x.amount === 20.25 && rowOf(r, y => y.code === 'ABS1').openCases === 1 && r.checks.some(c => c.code === 'case_open_long'),
  'disciplinary: two late cases (a warning, then a 5% fine of 20.25), decided in 3 and 4 days; an absence case open 45 days', r.rows);
ok(!run('5001', 'cmp_disciplinary', { from: '2026-01-01', to: '2026-12-31' }).columns.some(c => c.key === 'amount'), 'a manager sees the cases of their team without the fines');
r = run('3001', 'cmp_injuries', { from: '2026-01-01', to: '2026-12-31' });
ok(rowOf(r, y => y.ref === 'INJ-2026-00001').timeliness === 'late' && rowOf(r, y => y.ref === 'INJ-2026-00001').delayDays === 2 && rowOf(r, y => y.ref === 'INJ-2026-00001').daysOff === 3 &&
  rowOf(r, y => y.ref === 'INJ-2026-00002').timeliness === 'overdue' && rowOf(r, y => y.ref === 'INJ-2026-00002').delayDays === 4 && r.checks.some(c => c.code === 'gosi_overdue' && c.level === 'error'),
  'injuries: GOSI told 2 days late; the second not told, 4 days past the 3-day limit', r.rows);
r = RES.cmp_custody;
ok(rowOf(r, y => y.assetType === 'vehicle').value === 85000 && rowOf(r, y => y.assetType === 'pos').unacked === 1 && rowOf(r, emp('5005')).leaving === 'yes' && r.checks.some(c => c.code === 'leaver_holds_assets' && c.count === 1),
  'custody: vehicle 85,000 and a POS device not yet confirmed; a leaver still holds a phone', r.rows);
x = rowOf(RES.cmp_clearance, emp('5005'));
ok(x.tasksDone === 1 && x.tasksTotal === 8 && x.progress === 12.5 && x.openHr === 4 && x.openPayroll === 2 && x.assetsHeld === 1 && x.overdue === 'yes', 'clearance: 1 of 8 done, 4 with HR and 2 with payroll, a phone still out, past the last day', x);
r = run('3001', 'cmp_wps', { from: '2026-09-01', to: '2026-10-31' });
ok(rowOf(r, y => y.month === '2026-09').wpsStatus === 'none' && rowOf(r, y => y.month === '2026-09').daysLate === 25 && rowOf(r, y => y.month === '2026-10').gosiRecon === 'open' &&
  rowOf(r, y => y.month === '2026-10').gosiMismatches === 1 && r.checks.some(c => c.code === 'wps_overdue'), 'WPS: September locked but not uploaded, 25 days after the 10 October due date; October GOSI upload open', r.rows);

B.ctx.DEFAULT_SETTINGS.saudizationTarget = '80'; delete B.cache[B.ctx.SETTINGS_CACHE_KEY];
r = run('3001', 'hr_saudization', {});
x = rowOf(r, y => y.department === 'المبيعات');
ok(x.pct === 50 && x.saudiTarget === 80 && x.needed === 1 && x.prevPct === 50 && x.changePts === 0 && r.checks.some(c => c.code === 'saudi_vs_target' && c.count === 6 && c.value === 20),
  'Saudization against an 80% target: Sales 1 of 2 weighted (50%), one full-weight Saudi short; company 20%, 6 short (as HR sees it)', { x, checks: r.checks });
B.ctx.DEFAULT_SETTINGS.saudizationTarget = ''; delete B.cache[B.ctx.SETTINGS_CACHE_KEY];
r = call('3001', 'reportExport', { reportId: 'pay_company_cost', format: 'xlsx', params: {} });
ok(r.ok && /^RPT-/.test(r.export.ref) && call('3005', 'reportVerify', { ref: r.export.ref, hash: r.export.hash }).ok, 'a new report exports numbered and fingerprinted like the others');

console.log('Scheduled reports by e-mail (2026-10-21)');
{
  B.setNow(Date.parse('2026-11-04T06:00:00Z')); // Wednesday 09:00 Riyadh
  Object.keys(toks).forEach(k => delete toks[k]);
  direct(() => ['1000', '3001', '5001', '5002'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.email = no + '@co.sa'; B.ctx.update_('employees', e); }));
  const props = B.ctx.PropertiesService.getScriptProperties(), M365 = ['M365_TENANT', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'M365_SENDER'];
  M365.forEach(k => props.setProperty(k, ''));
  const mails = [];
  B.ctx.UrlFetchApp = { fetch: (url, o) => {
    if (/oauth2/.test(url)) return { getContentText: () => JSON.stringify({ access_token: 'tok' }), getResponseCode: () => 200 };
    mails.push(JSON.parse(o.payload).message); return { getContentText: () => '{}', getResponseCode: () => 202 };
  } };
  const csvOf = m => Buffer.from(m.attachments[0].contentBytes, 'base64').toString('utf8').replace(/^\uFEFF/, '');
  const to = m => m.toRecipients[0].emailAddress.address;
  const base = { period: 'last7', cadence: 'weekly', weekday: 0, monthDay: 1, hour: 7 };
  let s = call('3001', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {}, labels: { name: 'ملخص الحضور', cols: { name: 'الاسم' } } }, base));
  ok(s.ok && /^RSB-/.test(s.sub.code) && s.sub.nextRunAt === '2026-11-08T04:00:00.000Z', 'HR schedules a weekly report: next Sunday 07:00 Riyadh', s.sub || s);
  const hrSub = s.sub.id;
  ok(call('3001', 'reportSubSave', Object.assign({ reportId: 'pay_register', params: {} }, base)).error === 'not_emailable', 'a pay report cannot be scheduled by e-mail');
  ok(call('5002', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {} }, base)).error === 'forbidden', 'someone without access to the report cannot schedule it');
  ok(call('5001', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {}, recipients: [ids['5001'], ids['1000']] }, base)).error === 'forbidden', 'a manager cannot send to other people');
  s = call('5001', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {} }, base, { cadence: 'daily', period: 'yesterday', hour: 8 }));
  ok(s.ok && s.sub.recipients.length === 1 && s.sub.recipients[0].id === ids['5001'], 'a manager schedules it for themselves', s.sub || s);
  const mgrSub = s.sub.id;
  ok(call('3001', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {}, recipients: [ids['3001'], ids['5002']] }, base)).error === 'recipient_no_access', 'HR cannot add a recipient who has no access to the report');
  ok(call('3001', 'reportSubSave', Object.assign({ reportId: 'att_summary', params: {}, recipients: [ids['3001'], ids['3005']] }, base)).error === 'no_email', 'nor one with no e-mail address on file');
  ok(call('5001', 'reportSubSend', { id: mgrSub }).error === 'email_not_configured', 'with Microsoft 365 not connected, "send now" says so');
  let l = call('5001', 'reportSubList', {});
  ok(l.ok && !l.mailReady && l.myEmail && l.rows.length === 1, 'the list shows e-mail is not connected yet; a manager sees only their own', l);
  M365.forEach(k => props.setProperty(k, 'x'));
  let r = call('5001', 'reportSubSend', { id: mgrSub });
  const m1 = mails[mails.length - 1], csv1 = m1 && csvOf(m1);
  ok(r.ok && to(m1) === '5001@co.sa' && /^RPT-/.test(r.ref) && /2026-11-03/.test(m1.subject), 'send now: the manager gets yesterday\'s report with an export number', { r, subject: m1 && m1.subject });
  ok(/موظف 5002/.test(csv1) && /موظف 5003/.test(csv1) && !/موظف 5004/.test(csv1), 'the attached CSV holds the manager\'s team only (run with their own access)', csv1);
  const lg = call('3001', 'reportLog', {}).rows.find(x => x.ref === r.ref);
  ok(lg && lg.format === 'email' && call('3001', 'reportVerify', { ref: r.ref, hash: lg.hash }).ok, 'every e-mailed report is in the export log and verifies like a printed one', lg);
  s = call('3001', 'reportSubSave', Object.assign({ reportId: 'att_overtime', params: {} }, base, { weekday: 3, hour: 10 }));
  const otMoney = run('3001', 'att_overtime', {}).columns.filter(c => c.type === 'money').map(c => c.key);
  r = call('3001', 'reportSubSend', { id: s.sub.id });
  const head = csvOf(mails[mails.length - 1]).split('\r\n')[0].split(',');
  ok(r.ok && otMoney.length && !otMoney.some(k => head.includes(k)) && head.includes('empNo'), 'amount columns are dropped from the e-mailed copy', { otMoney, head });
  call('3001', 'reportSubSave', { id: s.sub.id, remove: true });
  // the schedule itself: Sunday 07:01 Riyadh, the first writing request sends what is due
  const before = mails.length;
  B.setNow(Date.parse('2026-11-08T04:01:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  call('5002', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'x' } } });
  B.setNow(Date.parse('2026-11-08T04:02:00Z'));
  call('5003', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'y' } } });
  const sentNow = mails.slice(before);
  ok(sentNow.some(m => to(m) === '3001@co.sa' && /ملخص الحضور/.test(m.subject) && /2026-11-01/.test(m.subject) && /2026-11-07/.test(m.subject)), 'on Sunday HR gets last week\'s report (1 to 7 November)', sentNow.map(m => to(m) + ' ' + m.subject));
  ok(sentNow.some(m => to(m) === '5001@co.sa'), 'and the manager\'s daily one went too', sentNow.map(to));
  l = call('3001', 'reportSubList', { all: 1 });
  let h = l.rows.find(x => x.id === hrSub);
  ok(h.lastStatus === 'sent' && h.nextRunAt === '2026-11-15T04:00:00.000Z' && l.rows.length === 2, 'it moves to the next Sunday; HR sees every company schedule', h);
  ok(sentNow.every(m => /الاسم/.test(csvOf(m)) || to(m) !== '3001@co.sa') && !/9000|2250/.test(sentNow.map(m => m.body.content).join('')), 'column names come from the screen; no pay figure in any e-mail');
  const n2 = mails.length;
  B.setNow(Date.parse('2026-11-08T04:50:00Z'));
  call('5002', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'z' } } });
  ok(mails.length === n2, 'nothing is sent twice');
  // the manager loses their team: the next send is refused for them and recorded
  const team = direct(() => B.ctx.readAll_('employees').filter(e => e.managerId === ids['5001']).map(e => e.id));
  direct(() => team.forEach(id => { const e = B.ctx.findBy_('employees', 'id', id); e.managerId = ''; B.ctx.update_('employees', e); }));
  B.setNow(Date.parse('2026-11-09T05:01:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  call('5002', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'w' } } });
  h = call('3001', 'reportSubList', { all: 1 }).rows.find(x => x.id === mgrSub);
  ok(mails.length === n2 && /^failed:recipient_no_access/.test(h.lastStatus), 'someone who lost access stops receiving at once, and the reason is shown', h);
  ok(call('5002', 'reportSubSave', { id: hrSub, pause: true }).error === 'forbidden', 'only the owner or HR changes a schedule');
  ok(call('3001', 'reportSubSave', { id: hrSub, pause: true }).ok, 'the owner pauses it');
  B.setNow(Date.parse('2026-11-15T04:05:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  call('5002', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'v' } } });
  ok(!mails.slice(n2).some(m => to(m) === '3001@co.sa'), 'a paused schedule sends nothing');
  direct(() => team.forEach(id => { const e = B.ctx.findBy_('employees', 'id', id); e.managerId = ids['5001']; B.ctx.update_('employees', e); }));
  M365.forEach(k => props.setProperty(k, ''));
}
console.log('History snapshots (2026-10-21)');
{
  direct(() => B.ctx.readAll_('snapshots').forEach(x => { x.status = 'replaced'; B.ctx.update_('snapshots', x); }));
  Object.keys(B.cache).filter(k => /snap/.test(k)).forEach(k => delete B.cache[k]);
  const cache = B.ctx.CacheService.getScriptCache(); ['snap:done:2026-10', 'rl:snap:run'].forEach(k => cache.remove(k));
  B.setNow(Date.parse('2026-11-01T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  call('5002', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'snap' } } });
  let l = call('3005', 'snapshotList', {});
  const oct = l.months.find(m => m.month === '2026-10');
  ok(l.ok && oct && oct.kind === 'final' && oct.intact, 'the first writing request in November freezes October (final, fingerprint intact)', l.months);
  const v = call('3001', 'snapshotView', { month: '2026-10', dim: 'dept' });
  const att = run('3001', 'att_summary', { from: '2026-10-01', to: '2026-10-31' });
  const people = direct(() => B.ctx.readAll_('snapshots').filter(x => x.month === '2026-10' && x.status === 'current'));
  const recs = JSON.parse(people.sort((a, b) => a.part - b.part).map(x => x.data).join('')).rec;
  const presentRep = att.rows.filter(r => recs.some(x => x.n === r.empNo)).reduce((a, r) => a + (r.present || 0), 0);
  ok(v.ok && v.summary.headcount === recs.length && v.summary.present === presentRep, 'October present days match the attendance report for the same people', { snap: v.summary.present, report: presentRep, head: v.summary.headcount });
  const sales = v.groups.find(g => g.label === 'المبيعات');
  ok(sales && sales.headcount >= 1, 'the breakdown by department names October\'s departments', v.groups.map(g => g.label + ':' + g.headcount));
  // later edits never change October
  call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: other } });
  call('3001', 'hrDeptSave', { dept: { id: dept, nameAr: 'المبيعات والتسويق' } });
  const v2 = call('3001', 'snapshotView', { month: '2026-10', dim: 'dept' });
  ok(v2.groups.some(g => g.label === 'المبيعات' && g.headcount === sales.headcount) && !v2.groups.some(g => g.label === 'المبيعات والتسويق'), 'a transfer and a renamed department today leave October exactly as it was', v2.groups.map(g => g.label + ':' + g.headcount));
  ok(call('3005', 'snapshotTake', {}).error === 'forbidden', 'only HR takes or rebuilds a snapshot');
  let tk = call('3001', 'snapshotTake', {});
  ok(tk.ok && tk.month === '2026-11' && tk.kind === 'provisional', 'HR takes this month now: provisional', tk);
  const cmp = call('3001', 'snapshotView', { month: '2026-11', compare: '2026-10', dim: 'dept' });
  ok(cmp.ok && cmp.compare.movement.transferred >= 1, 'November against October: the move between departments is counted', cmp.compare && cmp.compare.movement);
  const mv = call('3001', 'snapshotPeople', { month: '2026-11', compare: '2026-10', change: 'transferred' });
  ok(mv.ok && mv.rows.some(r => r.empNo === '5002' && r.from === 'المبيعات'), 'HR opens the names behind it, with the department they came from', mv.rows);
  ok(call('3005', 'snapshotPeople', { month: '2026-11' }).error === 'forbidden', 'the executive sees numbers, never the names');
  const ex = call('3005', 'snapshotView', { month: '2026-10', dim: 'dept' });
  ok(ex.groups.filter(g => g.headcount < 5).every(g => g.small && g.attendancePct === undefined), 'groups under 5 show a count only to anyone but HR', ex.groups);
  ok(ex.summary.payroll && !('payroll' in call('1000', 'snapshotView', { month: '2026-10' }).summary), 'cost is shown to the executive, never to the administrator alone');
  ok(call('5001', 'snapshotList', {}).error === 'forbidden', 'a line manager has no access to the company history');
  tk = call('3001', 'snapshotTake', { month: '2026-09' });
  ok(tk.ok && tk.kind === 'rebuilt' && call('3001', 'snapshotTake', { month: '2026-09' }).error === 'already_submitted', 'a missed past month can be rebuilt once, marked rebuilt', tk);
  ok(call('3001', 'snapshotTake', { month: '2027-01' }).error === 'bad_range', 'a future month cannot be taken');
  // big companies: the record is split in parts and re-assembled
  B.ctx.SNAP_PART_ = 300;
  B.setNow(Date.parse('2026-11-02T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  tk = call('3001', 'snapshotTake', {});
  const parts = direct(() => B.ctx.readAll_('snapshots').filter(x => x.month === '2026-11' && x.status === 'current'));
  ok(parts.length > 3 && call('3001', 'snapshotView', { month: '2026-11' }).ok, 'a large snapshot is stored in parts and reads back whole', parts.length);
  B.ctx.SNAP_PART_ = 40000;
  // tampering in the sheet is detected
  direct(() => { const x = B.ctx.readAll_('snapshots').find(y => y.month === '2026-09' && y.status === 'current'); x.data = String(x.data).replace(/"pr":\d+/, '"pr":99'); B.ctx.update_('snapshots', x); });
  ok(call('3001', 'snapshotView', { month: '2026-09' }).error === 'snapshot_damaged' && call('3001', 'snapshotList', {}).months.find(m => m.month === '2026-09').intact === false, 'a hand edit in the sheet is caught by the fingerprint');
  // month end: November becomes final, replacing the provisional one
  B.setNow(Date.parse('2026-12-01T07:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
  call('5003', 'requestCreate', { request: { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'dec' } } });
  l = call('3001', 'snapshotList', {});
  ok(l.months.filter(m => m.month === '2026-11').length === 1 && l.months.find(m => m.month === '2026-11').kind === 'final', 'at month end the provisional November is replaced by the final one', l.months);
  call('3001', 'hrDeptSave', { dept: { id: dept, nameAr: 'المبيعات' } });
  call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: dept } });
}
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
