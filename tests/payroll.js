// HR Phase 3 checks (payroll): node tests/payroll.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const r2 = n => Math.round(n * 100) / 100;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-11-04T06:00:00Z'); // October is complete
const B = load({ setupKeyHash: sha('k'), now: T0 });

const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role, email: no + '@bestgas.sa' } });
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
person('3004', 'مدير مالي', 'employee');
['5002', '5003', '5004', '5005', '5006'].forEach((no, i) => person(no, 'موظف ' + no, 'employee'));
['3002', '3004'].forEach(no => { B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids[no], extraRoles: 'payroll' }); tok(no, true); });
const job = { '5002': { hireDate: '2019-01-01', nationality: 'SA' }, '5003': { hireDate: '2024-09-01', nationality: 'SA' }, '5004': { hireDate: '2023-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-12-31' },
  '5005': { hireDate: '2026-10-15', nationality: 'SA' }, '5006': { hireDate: '2025-01-01', nationality: 'SA' } };
Object.keys(job).forEach(no => call('3001', 'hrEmpSave', { emp: Object.assign({ id: ids[no] }, job[no]) }));
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy', bankName: 'الراجحي' } });
call('3001', 'hrPrivateSave', { empId: ids['5003'], priv: { iban: 'SA4420000001234567891234'.replace(/^SA44/, 'SA44'), gosiCohort: 'new' } });
call('3001', 'hrPrivateSave', { empId: ids['5004'], priv: { iban: 'SA0380000000608010167519', nationalId: '2123456789' } });
// they have been in the system since September; 5005 joined on 15 October
direct(() => ['5002', '5003', '5004', '5006', '3001', '3002', '3004', '1000'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; B.ctx.update_('employees', e); }));
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5005'); e.createdAt = '2026-10-15T00:00:00.000Z'; B.ctx.update_('employees', e); });
const pkg = { '5002': [9000, 2250, 900, { 'بدل هاتف': 200 }], '5003': [5000, 1250, 500, {}], '5004': [8000, 2000, 800, {}], '5005': [6000, 1500, 600, {}] };
direct(() => Object.keys(pkg).forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + no, ref: 'SAL-T' + i, empId: ids[no], effectiveFrom: '2026-01-01', basic: pkg[no][0], housing: pkg[no][1], transport: pkg[no][2],
  otherJson: JSON.stringify(pkg[no][3]), currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' })));
// October attendance: everyone on every working day (Sun-Thu), except 5003 on 8 October and the leave days
const workdays = []; for (let d = 1; d <= 31; d++) { const ds = '2026-10-' + String(d).padStart(2, '0'); const w = new Date(ds + 'T00:00:00Z').getUTCDay(); if (w <= 4) workdays.push(ds); }
const at = (ds, hm) => new Date(ds + 'T' + hm + ':00+03:00').toISOString();
direct(() => {
  const rows = [];
  ['5002', '5003', '5004', '5005', '5006', '3001', '3002', '3004', '1000'].forEach(no => workdays.forEach(ds => {
    if (no === '5003' && (ds === '2026-10-08' || ds === '2026-10-20' || ds === '2026-10-21')) return;
    if (no === '5005' && ds < '2026-10-15') return;
    ['in', 'out'].forEach(t => rows.push({ id: 'P' + no + ds + t, empId: ids[no], type: t, ts: at(ds, t === 'in' ? '07:55' : '17:05'), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, '07:55') }));
  }));
  B.ctx.appendMany_('punches', rows);
  // approved unpaid leave on 20 and 21 October for 5003, and an approved advance of 3,000 over 3 months from October
  B.ctx.append_('requests', { id: 'RU', ref: 'LV-2026-00001', empId: ids['5003'], type: 'leave', subtype: 'unpaid', fromDate: '2026-10-20', toDate: '2026-10-21', days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-01T00:00:00Z', updatedAt: '', decidedAt: '2026-10-02T00:00:00Z' });
  B.ctx.append_('requests', { id: 'RA', ref: 'AD-2026-00001', empId: ids['5003'], type: 'advance', subtype: '', fromDate: '', toDate: '', days: '', amount: 3000, months: 3, payloadJson: JSON.stringify({ startMonth: '2026-10', installment: 1000 }), reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-09-20T00:00:00Z', updatedAt: '', decidedAt: '2026-09-21T00:00:00Z' });
});
direct(() => B.ctx.append_('settings', { key: 'deductAbsence', value: 'true' }));
B.ctx.CacheService.getScriptCache().remove('settings:v1');
let r;

console.log('Adjustments');
r = call('3002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'overtime_hours', amount: 10, reason: 'جرد نهاية الشهر' } });
ok(r.ok && /^ADJ-2026-\d{5}$/.test(r.adj.ref), 'payroll records approved overtime hours, numbered ADJ-2026-00001', r);
call('3002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'fine', amount: 3000, reason: 'مخالفة' } });
call('3002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'bonus', amount: 500, reason: 'تميز' } });
r = call('3002', 'payrollAdjSave', { adj: { empId: ids['3002'], month: '2026-10', code: 'bonus', amount: 500, reason: 'x' } });
ok(!r.ok && r.error === 'cannot_change_own_salary', 'nobody adds a line to their own pay', r);
r = call('3002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'bonus', amount: 500 } });
ok(!r.ok && r.error === 'note_required', 'every adjustment needs a reason', r);
r = call('5002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'bonus', amount: 1, reason: 'x' } });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot touch payroll', r);

console.log('The October run');
r = call('3002', 'payrollCreate', { month: '2026-12' });
ok(!r.ok && r.error === 'future_month', 'a future month cannot be run', r);
r = call('3002', 'payrollCreate', { month: '2026-10' });
ok(r.ok && r.run.status === 'draft' && /^PR-2026-\d{5}$/.test(r.run.ref), 'payroll prepares the October draft, numbered PR-2026-00001', r.run);
const runId = r.run.id;
r = call('3002', 'payrollCreate', { month: '2026-10' });
ok(!r.ok && r.error === 'run_exists', 'one run per month', r);
r = call('3002', 'payrollGet', { id: runId });
const slip = no => r.slips.find(s => s.empId === ids[no]);
const line = (s, code) => s.lines.filter(l => l.code === code).reduce((t, l) => t + l.amount, 0);
ok(r.ok && r.slips.length === 9 && r.slips.every(s => /^PS-2026-\d{5}$/.test(s.ref)), 'nine payslips, each numbered PS-2026-00001...', r.slips && r.slips.length);

const s2 = slip('5002');
ok(near(s2.gross, 12350) && near(line(s2, 'gosi'), 11250 * 0.0975) && near(s2.net, 12350 - 11250 * 0.0975) && s2.lines.every(l => l.code !== 'absence'),
  'a full month: 12,350 gross, GOSI 9.75% of basic plus housing (legacy), no absence', { gross: s2.gross, net: s2.net, lines: s2.lines });
ok(near(s2.gosiEmployer, 11250 * 0.1175), 'employer GOSI 11.75% shown, not deducted', s2.gosiEmployer);

const s3 = slip('5003'), d3 = 6750 / 30;
ok(near(line(s3, 'unpaid_leave'), 2 * d3) && near(line(s3, 'absence'), 1 * d3), 'unpaid leave (2 days) and the unexcused absence (1 day) are not paid', s3.lines.filter(l => l.kind === 'deduction'));
ok(near(line(s3, 'gosi'), 6250 * 0.1075), 'new-law GOSI in October 2026 is 10.75%', line(s3, 'gosi'));
ok(near(line(s3, 'advance'), 1000) && s3.lines.find(l => l.code === 'advance').ref === 'AD-2026-00001', 'the advance instalment (1,000) with its request number', s3.lines.find(l => l.code === 'advance'));
ok(near(s3.net, 6750 - 3 * d3 - 6250 * 0.1075 - 1000), 'net pay adds up', s3.net);

const s4 = slip('5004'), d4 = 10800 / 30, ot = 10 * (10800 / 30 / 8 + 8000 / 30 / 8 * 0.5);
ok(near(line(s4, 'overtime'), ot), 'Art. 107 overtime: 10 hours at the hourly wage plus half the basic hourly', { got: line(s4, 'overtime'), want: ot });
ok(near(line(s4, 'fine'), 5 * d4) && s4.warnings.includes('fine_capped'), 'a 3,000 fine is cut to five days\' wage (Art. 70)', { fine: line(s4, 'fine'), w: s4.warnings });
ok(line(s4, 'gosi') === 0 && near(s4.gosiEmployer, 10000 * 0.02), 'non-Saudi: no employee GOSI, employer 2% hazards', { emp: line(s4, 'gosi'), er: s4.gosiEmployer });
ok(near(line(s4, 'bonus'), 500), 'the bonus is paid');

const s5 = slip('5005');
ok(s5.paidDays === 17 && near(s5.gross, 8100 * 17 / 30) && s5.lines.every(l => l.code !== 'absence'), 'joined on the 15th: 17 days paid, no absence before joining', { days: s5.paidDays, gross: s5.gross });
const s6 = slip('5006');
ok(s6.warnings.includes('no_package') && s6.net === 0, 'no approved package: shown with a warning, nothing paid', s6.warnings);
ok(s3.warnings.includes('no_iban') === false && slip('5006').warnings.includes('no_iban'), 'a missing IBAN is flagged');

console.log('Company cost: employer GOSI and the end-of-service provision');
// 5002 joined 2019-01-01: more than five years, so a full month a year (Art. 84) on the total wage 12,350
ok(near(s2.eosAccrual, 12350 / 12), 'over five years of service: the month sets aside a twelfth of the total wage', s2.eosAccrual);
ok(near(s2.companyCost, 12350 + 11250 * 0.1175 + 12350 / 12), 'company cost = gross + employer GOSI + end-of-service provision', s2.companyCost);
// 5003 joined 2024-09-01: under five years, half a month a year; package 6,750
ok(near(s3.eosAccrual, 6750 / 24), 'under five years: half a month a year, so a 24th of the wage each month', s3.eosAccrual);
ok(near(slip('5005').eosAccrual, 8100 / 24 * 17 / 30), 'a part month sets aside its share only (17 of 30 days)', slip('5005').eosAccrual);
ok(near(r.run.totals.companyCost, r.slips.reduce((t, s) => t + s.companyCost, 0)) && r.run.totals.eosAccrual > 0, 'the run totals carry the company cost and the provision', r.run.totals);
// a GOSI-registered wage that is not basic + housing drives the contributions, and the slip says so
const x = { first: '2026-10-01', last: '2026-10-31', month: '2026-10', today: '2026-10-01', now: new Date('2026-10-01T06:00:00Z'), reqs: [], adjs: [], byEmpDay: {}, advDone: {}, off: () => null,
  comps: [{ id: 'CX', empId: 'EX', effectiveFrom: '2026-01-01', basic: 10000, housing: 2500, transport: 1000, otherJson: '{}', status: 'approved', currency: 'SAR' }],
  priv: { EX: { gosiCohort: 'legacy', gosiWage: 11000, iban: 'SA0380000000608010167519' } }, s: direct(() => B.ctx.settings_()) };
const cx = direct(() => B.ctx.calcSlip_({ id: 'EX', isSaudi: true, hireDate: '2020-01-01', dailyHours: 8, createdAt: '2020-01-01T00:00:00Z' }, x));
ok(cx && cx.warnings.includes('gosi_wage_differs') && near(cx.info.gosi.base, 11000) && near(cx.gosiEmployer, 11000 * 0.1175) && near(cx.gosiEmployee, 11000 * 0.0975),
  'GOSI wage registered as 11,000 (package basic + housing 12,500): contributions follow 11,000 and the slip warns', cx && { w: cx.warnings, g: cx.info.gosi, er: cx.gosiEmployer });
ok(cx && near(cx.companyCost, 13500 + 11000 * 0.1175 + 13500 / 12), 'and the company cost uses those contributions', cx && cx.companyCost);
r = call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { gosiWage: 50 } });
ok(!r.ok && r.error === 'bad_value', 'a registered GOSI wage must be a real wage', r);
r = call('3001', 'payrollGet', { id: runId });

console.log('Approval, lock, payslips');
r = call('5003', 'mySlips');
ok(r.ok && r.rows.length === 0, 'employees see nothing while it is a draft', r.rows);
r = call('3002', 'payrollApprove', { id: runId });
ok(!r.ok && r.error === 'second_approver_required', 'the preparer cannot approve', r);
r = call('3001', 'payrollApprove', { id: runId });
ok(!r.ok && r.error === 'forbidden', 'HR cannot approve payroll (finance does)', r);
r = call('3004', 'payrollApprove', { id: runId });
ok(r.ok && r.run.status === 'locked', 'a second payroll person approves; the run is locked', r.run);
r = call('5003', 'mySlips');
ok(r.ok && r.rows.length === 1 && near(r.rows[0].net, s3.net) && r.rows[0].info.leaveBalance !== undefined, 'the employee now sees the October payslip with the leave balance', r.rows[0] && r.rows[0].net);
r = call('3002', 'payrollRecalc', { id: runId });
ok(!r.ok && r.error === 'not_found', 'a locked run cannot be recalculated', r);
r = call('3002', 'payrollAdjSave', { adj: { empId: ids['5004'], month: '2026-10', code: 'bonus', amount: 1, reason: 'late' } });
ok(!r.ok && r.error === 'month_locked', 'no adjustments on a locked month', r);

console.log('November: the advance continues, recalculation');
B.ctx.Date.now(); // same clock; November cannot be complete, but a draft may be prepared
r = call('3001', 'payrollCreate', { month: '2026-11' });
ok(r.ok, 'HR can prepare a draft too', r.error);
const nov = r.run.id;
r = call('3002', 'payrollGet', { id: nov });
ok(near(line(r.slips.find(s => s.empId === ids['5003']), 'advance'), 1000), 'November deducts the second instalment');
call('3002', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-11', code: 'commission', amount: 750, reason: 'مبيعات' } });
r = call('3002', 'payrollRecalc', { id: nov });
ok(r.ok, 'payroll recalculates after the new line');
r = call('3002', 'payrollGet', { id: nov });
ok(near(line(r.slips.find(s => s.empId === ids['5002']), 'commission'), 750) && r.slips.length === 9, 'the commission is in, no payslip duplicated', r.slips.length);
r = call('3002', 'payrollApprove', { id: nov });
ok(!r.ok && r.error === 'second_approver_required', 'whoever recalculated last becomes the preparer', r);
r = call('3002', 'payrollDelete', { id: nov });
ok(r.ok && !call('3002', 'payrollList').rows.some(x => x.id === nov), 'a draft can be discarded', r);

console.log('Deduction cap (Art. 92-93)');
direct(() => B.ctx.append_('requests', { id: 'RB', ref: 'AD-2026-00002', empId: ids['5002'], type: 'advance', subtype: '', fromDate: '', toDate: '', days: '', amount: 20000, months: 2, payloadJson: JSON.stringify({ startMonth: '2026-11', installment: 10000 }), reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-20T00:00:00Z', updatedAt: '', decidedAt: '2026-10-21T00:00:00Z' }));
r = call('3002', 'payrollCreate', { month: '2026-11' });
r = call('3002', 'payrollGet', { id: r.run.id });
const b2 = r.slips.find(s => s.empId === ids['5002']);
const capped = b2.lines.filter(l => ['gosi', 'advance', 'fine', 'other_deduction'].includes(l.code)).reduce((t, l) => t + l.amount, 0);
ok(capped <= b2.gross * 0.5 + 0.01 && b2.warnings.includes('advance_deferred'), 'an instalment that would take more than half the wage is deferred', { capped, gross: b2.gross, w: b2.warnings });

console.log('WPS rows, end of service, email');
r = call('3002', 'payrollExport', { id: runId });
const w2 = r.rows.find(x => x.empNo === '5002');
ok(r.ok && w2.iban === 'SA0380000000608010167519' && w2.nationalId === '1012345678' && near(w2.net, s2.net) && near(w2.basic + w2.housing + w2.other, s2.gross), 'the WPS rows carry ID, IBAN, basic, housing, other and net', w2);
ok(r.departments.length >= 1 && near(r.departments.reduce((t, d) => t + d.net, 0), r.rows.reduce((t, x) => t + x.net, 0)), 'the accounting summary adds up by department');
r = call('5002', 'payrollExport', { id: runId });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot export payroll', r);
r = call('3002', 'eosQuote', { empId: ids['5002'], lastDay: '2026-12-31', reason: 'resignation' });
const yrs = (Date.parse('2026-12-31') - Date.parse('2019-01-01')) / 86400000 / 365 + 1 / 365, full = 5 * 12350 / 2 + (yrs - 5) * 12350;
ok(r.ok && near(r.eos.fullAward, full, 1) && near(r.eos.factor, 2 / 3) && near(r.eos.award, full * 2 / 3, 1), 'resigning after 8 years: two thirds of half a month a year for 5 years plus a month a year after (Art. 84, 85)', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5003'], lastDay: '2026-06-30', reason: 'resignation' });
ok(r.ok && r.eos.factor === 0 && r.eos.award === 0, 'resigning under 2 years: no award', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5003'], lastDay: '2026-12-31', reason: 'resignation' });
ok(r.ok && near(r.eos.factor, 1 / 3), 'resigning after 2 to 5 years: a third', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5003'], lastDay: '2026-12-31', reason: 'termination' });
ok(r.ok && r.eos.factor === 1 && r.eos.award > 0, 'ended by the employer: the full award', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5003'], lastDay: '2026-06-30', reason: 'art87_marriage' });
ok(r.ok && r.eos.factor === 1, 'Art. 87: a woman leaving within 6 months of marriage gets the full award even when resigning', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5002'], lastDay: '2026-12-31', reason: 'art80' });
ok(r.ok && r.eos.award === 0 && r.eos.leavePay > 0, 'Art. 80 dismissal: no award, but unused leave is still paid', r.eos);
direct(() => B.ctx.append_('requests', { id: 'RUL', ref: 'LV-2026-09999', empId: ids['5004'], type: 'leave', subtype: 'unpaid', fromDate: '2025-02-01', toDate: '2025-03-12', days: 40, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2025-01-20T00:00:00Z', updatedAt: '', decidedAt: '2025-01-21T00:00:00Z' }));
r = call('3002', 'eosQuote', { empId: ids['5004'], lastDay: '2026-12-31', reason: 'termination' });
const svc5004 = (Date.parse('2026-12-31') - Date.parse('2023-01-01')) / 86400000 + 1 - 20;
ok(r.ok && r.eos.unpaidExcluded === 20 && r.eos.serviceDays === svc5004, '40 days unpaid leave: the 20 beyond the first 20 are not service (Art. 116)', r.eos);
ok(near(r.eos.gross, r.eos.award + r.eos.leavePay + r.eos.lastMonthPay) && near(r.eos.net, r.eos.gross - r.eos.advances) && r.eos.dueBy === '2027-01-07',
  'final settlement: award + leave + final month days - advances, due within a week (Art. 88)', r.eos);
r = call('3002', 'eosQuote', { empId: ids['5003'], lastDay: '2026-12-31', reason: 'resignation' });
ok(r.ok && r.eos.advances === 2000 && r.eos.dueBy === '2027-01-14', 'the 2,000 of the advance still owed (one instalment locked) comes off the settlement; resignation is paid within two weeks', r.eos);
r = call('3002', 'payrollEmail', { id: runId });
ok(!r.ok && r.error === 'email_not_configured', 'email says it is not configured yet, and sends nothing', r);
const sent = [];
B.ctx.UrlFetchApp = { fetch: (url, o) => { sent.push({ url, o }); return url.includes('/token') ? { getContentText: () => '{"access_token":"t"}', getResponseCode: () => 200 } : { getContentText: () => '', getResponseCode: () => 202 }; } };
['M365_TENANT', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'M365_SENDER'].forEach(k => B.ctx.PropertiesService.getScriptProperties().setProperty(k, k === 'M365_SENDER' ? 'm.mahdi@bestgas.sa' : 'x'));
r = call('3002', 'payrollEmail', { id: runId });
const mails = sent.filter(x => x.url.includes('/sendMail'));
ok(r.ok && r.sent === 8 && r.skipped.length === 1 && r.skipped[0] === '1000' && mails.length === 8 && mails[0].url.includes('m.mahdi%40bestgas.sa') && JSON.parse(mails[0].o.payload).message.body.content.includes('صافي الراتب'),
  'once configured: one Graph sendMail per employee from m.mahdi@bestgas.sa; the one without an email is listed, not guessed', { sent: r.sent, n: mails.length });


console.log('Annual pay review (CR), 2026-10-18');
{
  call('3001', 'hrEmpSave', { emp: { id: ids['5003'], managerId: ids['5006'] } });
  let c = call('5006', 'compCycleSave', { cycle: { name: 'x', effectiveFrom: '2027-01-01', budgetPct: 5 } });
  ok(!c.ok && c.error === 'forbidden', 'a manager cannot open a pay review', c);
  c = call('3001', 'compCycleSave', { cycle: { name: 'مراجعة 2027', effectiveFrom: '2027-01-01', budgetPct: 5 } });
  ok(c.ok && /^CR-/.test(c.cycle.ref) && c.cycle.status === 'open', 'HR opens the 2027 pay review (5% budget)', c.cycle || c);
  const cyc = c.cycle;
  let l = call('5006', 'compCycleList');
  const mrows = l.ok && l.rows[0] ? l.rows[0].rows : [];
  ok(l.ok && mrows.length === 1 && mrows[0].emp.empNo === '5003' && mrows[0].base === undefined && l.rows[0].budgetPct === undefined, 'the manager sees only their own person, and no pay at all', l.rows && l.rows[0]);
  const r5003 = mrows[0] && mrows[0].id;
  ok(call('5006', 'compPropose', { id: r5003, pct: 5, note: 'أداء ممتاز' }).ok, 'the manager proposes +5% for their person');
  const all = call('3001', 'compCycleList').rows[0].rows;
  const r5002 = all.find(x => x.emp && x.emp.empNo === '5002');
  c = call('5006', 'compPropose', { id: r5002.id, pct: 10 });
  ok(!c.ok && c.error === 'forbidden', 'a manager cannot propose for someone outside their team', c);
  ok(call('3001', 'compPropose', { id: r5002.id, pct: 3 }).ok, 'HR proposes +3% for another person');
  l = call('3001', 'compCycleList').rows[0];
  const v = l.rows.find(x => x.emp.empNo === '5003');
  ok(v.base === 6250 && v.increase === 312.5 && l.increase > 0 && l.usedPct > 0, 'HR sees the money: 5003 base 6,250 (basic + housing), +312.50, and the budget used', { v, used: l.usedPct });
  c = call('3002', 'compCycleClose', { id: cyc.id });
  const pend = direct(() => B.ctx.readAll_('compensation')).filter(x => x.status === 'pending' && x.effectiveFrom === '2027-01-01');
  const p3 = pend.find(x => x.empId === ids['5003']);
  ok(c.ok && c.proposals === 2 && p3 && Number(p3.basic) === 5250 && Number(p3.housing) === 1312.5 && p3.enteredBy === ids['3002'], 'closing files the increases as pending salary proposals (5003: 5,250 + 1,312.50 from 2027-01-01)', { c, p3 });
  c = call('3002', 'hrCompDecide', { ids: [p3.id], decision: 'approve' });
  ok(!c.ok && c.error === 'second_approver_required', 'the person who closed the review cannot also approve the new salary', c);
}
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
