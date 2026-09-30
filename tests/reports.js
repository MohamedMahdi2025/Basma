// Reports centre checks: node tests/reports.js
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
ok(r.ok && r.reports.some(x => x.id === 'pay_register') && r.reports.length === 18 - 1, 'payroll: every report except the audit log', r.reports.length);
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
const sd = r.rows.find(x => x.department === 'المبيعات');
ok(r.ok && sd.headcount === 2 && sd.saudis === 2, 'Saudization by department for the executive', r.rows);

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
ok(r.ok && r.rows.length === 3 && !JSON.stringify(r.rows).includes('SA03'), 'executive: department cost, no individual lines', r.rows.map(x => x.department));
r = run('3002', 'pay_eos', { asOf: '2026-10-31' });
const eo = r.rows.find(x => x.empNo === '5002');
const yrs = (Date.parse('2026-10-31') - Date.parse('2019-01-01')) / 864e5 + 1;
ok(r.ok && near(eo.years, yrs / 365, 0.01) && near(eo.awardFull, 5 * 12150 / 2 + (yrs / 365 - 5) * 12150, 1), 'EOS liability: half a month for five years, a month after', eo);
ok(near(eo.awardResignation, eo.awardFull * 2 / 3, 1), 'resignation after 5-10 years: two thirds (Art. 85)');

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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
