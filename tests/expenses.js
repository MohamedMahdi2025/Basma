// Expense claims: lines, limits, duplicates, the chain, payout through payroll or outside it: node tests/expenses.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // strict mode
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('4002', 'مدير مالي', 'employee');
person('5001', 'مشرف النقل', 'employee');
person('5002', 'سائق', 'employee');
person('5003', 'مندوب', 'employee');
['4001', '4002'].forEach(no => call('1000', 'hrRolesSave', { id: ids[no], extraRoles: 'payroll' }));
Object.keys(toks).forEach(k => delete toks[k]);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], nationality: 'SA', hireDate: '2024-01-01' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], nationality: 'SA', hireDate: '2024-01-01' } });
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy' } });
direct(() => ['5002', '5003'].forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + no, ref: 'SAL-T' + i, empId: ids[no], effectiveFrom: '2026-01-01', basic: 6000, housing: 1500, transport: 0,
  otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['4001'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' })));
let r;

console.log('Settings: limits per category per month');
ok(call('5001', 'expenseLimitsSave', { limits: { fuel: 500 } }).error === 'forbidden', 'a manager cannot set limits');
ok(call('4001', 'expenseLimitsSave', { limits: { fuel: 'x' } }).error === 'bad_amount', 'a limit is a positive amount');
r = call('4001', 'expenseLimitsSave', { limits: { fuel: 500, meals: 300 }, receiptOver: 100 });
ok(r.ok && r.limits.fuel === 500 && r.receiptOver === 100, 'payroll sets fuel 500 and meals 300 a month, receipts above 100 SAR');
r = call('5002', 'myExpenses');
ok(r.ok && r.limits.fuel === 500 && r.receiptOver === 100 && r.steps.join() === 'manager,payroll', 'the employee sees the limits and the chain (manager, then payroll)', r.steps);

console.log('Checking the lines');
const L = (category, date, amount, vat, receiptRef, description) => ({ category, date, amount, vat, receiptRef, description: description || 'بيان', merchant: 'محطة' });
const chk = lines => call('5002', 'expenseCheck', { claim: { lines } }).check;
ok(chk([L('flowers', '2026-10-20', 50)]).error === 'bad_value', 'an unknown category is refused');
ok(chk([L('fuel', '2026-11-10', 50)]).error === 'bad_date', 'a future date is refused');
ok(chk([L('fuel', '2026-07-01', 50)]).error === 'bad_date', 'older than 90 days is refused');
ok(chk([L('fuel', '2026-10-20', 115, 16)]).error === 'bad_vat', 'VAT above 15/115 of the amount is refused (115 SAR holds at most 15)');
ok(chk([L('fuel', '2026-10-20', 150, 0, '')]).error === 'receipt_required', 'above 100 SAR a receipt reference is required');
ok(chk([L('fuel', '2026-10-20', 80), L('fuel', '2026-10-20', 80)]).error === 'duplicate_expense', 'the same category, date and amount twice in one claim is refused');

console.log('A claim through the chain');
const linesA = [L('fuel', '2026-10-20', 230, 30, 'R-1001', 'تعبئة الشاحنة 4'), L('fuel', '2026-10-27', 345, 45, 'R-1002', 'تعبئة الشاحنة 4'), L('tolls', '2026-10-27', 40, 0, '', 'رسوم طريق')];
r = call('5002', 'expenseCreate', { claim: { title: 'مصروفات توصيل أكتوبر', lines: linesA } });
const A = r.claim;
ok(r.ok && A.ref === 'EXP-2026-00001' && A.total === 615 && A.vat === 75 && A.step === 'manager' && A.status === 'pending', 'EXP-2026-00001: 230 + 345 + 40 = 615 SAR, VAT 75', A);
ok(A.flags.length === 1 && A.flags[0].code === 'over_limit' && A.flags[0].category === 'fuel' && A.flags[0].total === 575, 'fuel 575 in October is over the 500 limit: flagged, not refused', A.flags);
r = call('5002', 'expenseCreate', { claim: { lines: [L('fuel', '2026-10-20', 230, 30, 'R-1001')] } });
ok(!r.ok && r.error === 'duplicate_expense', 'claiming the same fuel line again is refused', r);
ok(call('5001', 'myTasks').tasks.some(t => t.kind === 'expense_approve' && t.count === 1 && t.target.sec === 'expenses'), 'the manager\'s bell shows the claim');
ok(call('5003', 'expenseDecide', { id: A.id, decision: 'approve' }).error === 'forbidden', 'a colleague cannot approve it');
ok(call('5002', 'expenseDecide', { id: A.id, decision: 'approve' }).error === 'cannot_decide_own', 'nor the claimant');
ok(call('5001', 'expenseDecide', { id: A.id, decision: 'reject' }).error === 'note_required', 'rejecting needs a note');
r = call('5001', 'expenseDecide', { id: A.id, decision: 'approve' });
ok(r.ok && r.claim.step === 'payroll', 'the manager approves; payroll is next');
ok(call('5001', 'expenseDecide', { id: A.id, decision: 'approve' }).error === 'forbidden', 'the manager cannot also take the payroll step');
r = call('4001', 'expenseDecide', { id: A.id, decision: 'approve' });
ok(!r.ok && r.error === 'note_required', 'over the limit: payroll must give the reason to approve', r);
r = call('4001', 'expenseDecide', { id: A.id, decision: 'approve', note: 'رحلتان إضافيتان بتكليف من الإدارة', payout: 'payroll' });
ok(r.ok && r.claim.status === 'approved' && r.claim.payout === 'payroll' && r.claim.payMonth === '2026-11' && /^ADJ-2026-/.test(r.claim.adjRef), 'approved: paid with the November salary', r.claim);
const adjA = direct(() => B.ctx.readAll_('adjustments')).find(a => a.ref === r.claim.adjRef);
ok(adjA && adjA.code === 'reimbursement' && adjA.kind === 'earning' && Number(adjA.amount) === 615, 'a reimbursement line of 615 SAR waits for payroll', adjA);

console.log('Payroll: paid with the salary, not wage');
ok(call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-11', code: 'reimbursement', amount: 10, reason: 'x' } }).error === 'bad_value', 'a reimbursement cannot be typed in payroll by hand');
ok(call('4001', 'payrollAdjDelete', { id: adjA.id }).error === 'forbidden', 'nor deleted there (cancel the claim instead)');
ok(call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-11', code: 'other_deduction', amount: 5000, reason: 'تسوية عهدة' } }).ok, 'a large other deduction for the same month');
r = call('4002', 'payrollCreate', { month: '2026-11' });
const runId = r.run.id;
r = call('4001', 'payrollGet', { id: runId });
const slip = r.slips.find(s => s.empId === ids['5002']), line = c => slip.lines.filter(l => l.code === c).reduce((t, l) => t + l.amount, 0);
ok(line('reimbursement') === 615 && slip.lines.find(l => l.code === 'reimbursement').nonWage === true, 'the slip pays 615 SAR as a reimbursement line', slip.lines);
ok(line('gosi') === 731.25, 'GOSI stays 9.75% of basic + housing (7,500): 731.25, the reimbursement adds nothing', line('gosi'));
ok(line('other_deduction') === 3018.75, 'the 50% cap is on the wage (7,500 / 2 = 3,750 less GOSI = 3,018.75), not on wage + reimbursement', line('other_deduction'));
ok(slip.gross === 6000 + 1500 + 615 && slip.net === 8115 - 731.25 - 3018.75, 'gross 8,115, net 4,365', { gross: slip.gross, net: slip.net });

console.log('Paid outside payroll');
r = call('5003', 'expenseCreate', { claim: { lines: [L('meals', '2026-10-15', 90, 11.74, '', 'غداء عمل مع عميل')] } });
const Bc = r.claim;
ok(r.ok && Bc.step === 'payroll' && Bc.flags.length === 0, 'no manager: the claim goes straight to payroll', Bc);
r = call('4001', 'expenseDecide', { id: Bc.id, decision: 'approve', payout: 'outside' });
ok(r.ok && r.claim.status === 'approved' && r.claim.payout === 'outside' && !r.claim.adjRef, 'approved to be paid outside payroll (no payroll line)', r.claim);
ok(call('4002', 'myTasks').tasks.some(t => t.kind === 'expense_pay' && t.count === 1), 'payroll is asked to record the payment');
ok(call('4002', 'expensePaid', { id: Bc.id }).error === 'missing_fields', 'the payment reference is required');
r = call('4002', 'expensePaid', { id: Bc.id, paidRef: 'TRF-55201', paidOn: '2026-11-04' });
ok(r.ok && r.claim.status === 'paid' && r.claim.paidRef === 'TRF-55201', 'recorded as paid by transfer TRF-55201', r.claim);

console.log('Cancelling');
r = call('5002', 'expenseCreate', { claim: { lines: [L('parking', '2026-11-02', 20, 0, '', 'موقف المطار')] } });
ok(call('5002', 'expenseCancel', { id: r.claim.id }).ok, 'the claimant withdraws a pending claim');
r = call('5002', 'expenseCreate', { claim: { lines: [L('phone', '2026-11-01', 60, 7.83, '', 'شحن رصيد للعمل')] } });
const D = r.claim;
call('5001', 'expenseDecide', { id: D.id, decision: 'approve' });
r = call('4002', 'expenseDecide', { id: D.id, decision: 'approve' });
const adjD = r.claim.adjRef;
ok(call('5002', 'expenseCancel', { id: D.id }).error === 'forbidden', 'the claimant cannot withdraw an approved claim');
ok(call('4001', 'expenseCancel', { id: D.id }).error === 'note_required', 'payroll withdraws it only with a note');
r = call('4001', 'expenseCancel', { id: D.id, note: 'صرفت نقدا من العهدة' });
ok(r.ok && r.claim.status === 'cancelled', 'payroll withdraws it');
ok(direct(() => B.ctx.readAll_('adjustments')).find(a => a.ref === adjD).status === 'deleted', 'and its payroll line is removed');

console.log('Lists and the report');
ok(call('5001', 'expenseInbox', { scope: 'all' }).error === 'forbidden', 'a manager cannot list everyone\'s claims');
r = call('5001', 'expenseInbox', { scope: 'team' });
ok(r.ok && r.rows.length === 3 && r.rows.every(x => x.emp.empNo === '5002'), 'the manager sees the team\'s claims', r.rows.length);
r = call('4001', 'expenseInbox', { scope: 'all' });
ok(r.ok && r.rows.length === 4, 'payroll lists every claim, cancelled ones included (none is its own)', r.rows.length);
ok(call('1000', 'expenseReport', {}).error === 'forbidden', 'an administrator alone gets no expense report');
r = call('4001', 'expenseReport', { from: '2026-10', to: '2026-11' });
const fuel = r.rows.find(x => x.month === '2026-10' && x.category === 'fuel'), meals = r.rows.find(x => x.category === 'meals');
ok(r.ok && fuel && fuel.amount === 575 && fuel.vat === 75 && fuel.net === 500 && fuel.claims === 1 && fuel.lines === 2 && fuel.state === 'approved', 'October fuel: 575 SAR, VAT 75, net 500, 2 lines in 1 claim', fuel);
ok(meals && meals.amount === 90 && !r.rows.some(x => x.category === 'parking' || x.category === 'phone'), 'cancelled claims are left out');
ok(r.overLimitClaims === 1, 'one claim went over a limit');

console.log('After the payroll is locked');
ok(call('4001', 'payrollApprove', { id: runId }).ok, 'the second payroll holder approves November');
r = call('5002', 'myExpenses');
ok(r.rows.find(x => x.id === A.id).status === 'paid', 'the claim shows as paid once its payroll month is locked');
ok(call('4001', 'expenseCancel', { id: A.id, note: 'x' }).error === 'month_locked', 'a claim paid in a locked payroll cannot be withdrawn');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
