// Employee loans: policy, consent, the hr -> payroll chain, disbursement, payroll instalments, early settlement, EOS: node tests/loans.js
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
person('5001', 'مشرف', 'employee');
person('5002', 'سائق', 'employee');
person('5003', 'مندوب', 'employee');
person('5004', 'موظف جديد', 'employee');
['4001', '4002'].forEach(no => call('1000', 'hrRolesSave', { id: ids[no], extraRoles: 'payroll' }));
Object.keys(toks).forEach(k => delete toks[k]);
['5002', '5003'].forEach(no => call('3001', 'hrEmpSave', { emp: { id: ids[no], nationality: 'SA', hireDate: '2024-01-01' } }));
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], nationality: 'SA', hireDate: '2026-09-01' } });
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy' } });
direct(() => ['5002', '5003', '5004'].forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + no, ref: 'SAL-T' + i, empId: ids[no], effectiveFrom: '2024-01-01', basic: 6000, housing: 1500, transport: 0,
  otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['4001'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' })));
let r;

console.log('Policy and quote');
r = call('5002', 'myLoans');
ok(r.ok && r.policy.maxSalaries === 3 && r.policy.maxMonths === 24 && r.policy.minServiceMonths === 6 && r.policy.oneActive === true && r.rows.length === 0, 'default policy: 3 wages, 24 months, 6 months of service, one at a time', r.policy);
ok(call('5002', 'loanPolicySave', { policy: { maxSalaries: 10 } }).error === 'forbidden', 'an employee cannot change the policy');
ok(call('4001', 'loanPolicySave', { policy: { maxMonths: 500 } }).error === 'bad_value', 'policy values are bounded');
r = call('5002', 'loanQuote', { loan: { principal: 30000, months: 30 } });
ok(r.ok && r.quote.errors.indexOf('loan_over_limit') >= 0 && r.quote.errors.indexOf('months_over_limit') >= 0, '30,000 over 30 months: over 3 wages (22,500) and over 24 months', r.quote.errors);
r = call('5004', 'loanQuote', { loan: { principal: 5000, months: 5 } });
ok(r.quote.errors.indexOf('service_too_short') >= 0, 'two months of service is not enough', r.quote.errors);
r = call('5002', 'loanQuote', { loan: { principal: 15000, months: 10 } });
ok(r.quote.errors.length === 0 && r.quote.installment === 1500 && r.quote.schedule.length === 10 && r.quote.startMonth === '2026-11' && r.quote.warnings.indexOf('deduction_over_10') >= 0,
  '15,000 over 10 months: 1,500 a month from November, over 10% of the wage (Art. 92)', r.quote);
ok(call('5003', 'loanQuote', { empId: ids['5002'], loan: { principal: 1000, months: 2 } }).error === 'forbidden', 'a colleague cannot quote for someone else');
r = call('5002', 'loanQuote', { loan: { principal: 1000, months: 3 } });
ok(r.quote.schedule.map(s => s.amount).join() === '333.34,333.34,333.32', 'the last instalment takes the rounding', r.quote.schedule);

console.log('Request and the chain');
ok(call('5002', 'loanCreate', { loan: { kind: 'car', principal: 15000, months: 10, purpose: 'سيارة' } }).error === 'consent_required', 'over 10% of the wage needs the written consent');
ok(call('5002', 'loanCreate', { loan: { kind: 'yacht', principal: 15000, months: 10, purpose: 'x', consent: true } }).error === 'bad_value', 'an unknown kind is refused');
ok(call('5002', 'loanCreate', { loan: { kind: 'car', principal: 15000, months: 10, consent: true } }).error === 'missing_fields', 'the purpose is required');
r = call('5002', 'loanCreate', { loan: { kind: 'car', principal: 15000, months: 10, purpose: 'دفعة أولى لسيارة', consent: true } });
const L1 = r.loan;
ok(r.ok && L1.ref === 'LN-2026-00001' && L1.step === 'hr' && L1.status === 'pending' && L1.installment === 1500 && L1.consent, 'LN-2026-00001 waits for HR', L1);
ok(call('5002', 'loanCreate', { loan: { kind: 'personal', principal: 1000, months: 2, purpose: 'x' } }).error === 'loan_active_exists', 'one loan at a time');
ok(call('5002', 'loanDecide', { id: L1.id, decision: 'approve' }).error === 'cannot_decide_own', 'nobody decides their own loan');
ok(call('4001', 'loanDecide', { id: L1.id, decision: 'approve' }).error === 'forbidden', 'payroll cannot take the HR step');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'loan_approve' && t.count === 1 && t.target.sec === 'loans'), 'the HR bell shows the loan');
ok(call('3001', 'loanDecide', { id: L1.id, decision: 'reject' }).error === 'note_required', 'rejecting needs a note');
r = call('3001', 'loanDecide', { id: L1.id, decision: 'approve' });
ok(r.ok && r.loan.step === 'payroll', 'HR approves; payroll is next');
ok(call('3001', 'loanDecide', { id: L1.id, decision: 'approve' }).error === 'forbidden', 'HR cannot also take the payroll step');
r = call('4001', 'loanDecide', { id: L1.id, decision: 'approve' });
ok(r.ok && r.loan.status === 'approved' && r.loan.canDisburse === false, 'payroll approves; the approver is not offered the payout', r.loan);
ok(call('4001', 'loanDisburse', { id: L1.id, disbursedRef: 'TRF-1' }).error === 'second_approver_required', 'the payroll approver cannot also pay it out');
ok(call('4002', 'myTasks').tasks.some(t => t.kind === 'loan_disburse' && t.count === 1), 'the other payroll holder is asked to pay it out');

console.log('Entered by HR for an employee: a second person decides');
r = call('3001', 'loanCreate', { loan: { empId: ids['5003'], kind: 'medical', principal: 3000, months: 6, purpose: 'علاج', consent: false } });
ok(r.ok && r.loan.installment === 500, 'HR enters a 3,000 loan for 5003 (500 a month, under 10%)', r);
ok(call('3001', 'loanDecide', { id: r.loan.id, decision: 'approve' }).error === 'second_approver_required', 'HR cannot approve a loan it entered');
ok(call('5003', 'loanCancel', { id: r.loan.id }).ok, 'the employee withdraws it while pending');

console.log('Disbursement and payroll');
ok(call('5002', 'loanDisburse', { id: L1.id, disbursedRef: 'x' }).error === 'forbidden', 'only payroll pays out');
ok(call('4002', 'loanDisburse', { id: L1.id }).error === 'missing_fields', 'the transfer reference is required');
r = call('4002', 'loanDisburse', { id: L1.id, disbursedRef: 'TRF-9001', disbursedOn: '2026-11-03' });
ok(r.ok && r.loan.status === 'active' && r.loan.startMonth === '2026-11' && r.loan.outstanding === 15000, 'paid out on 3 Nov; instalments from November', r.loan);
r = call('4002', 'payrollCreate', { month: '2026-11' });
const runId = r.run.id;
r = call('4001', 'payrollGet', { id: runId });
let slip = r.slips.find(s => s.empId === ids['5002']);
const ln = slip.lines.find(l => l.code === 'loan');
ok(ln && ln.amount === 1500 && ln.ref === 'LN-2026-00001', 'the November slip deducts 1,500 for LN-2026-00001', slip.lines);
ok(call('4001', 'payrollApprove', { id: runId }).ok, 'November is approved and locked');
r = call('5002', 'myLoans');
let mine = r.rows[0];
ok(mine.repaid === 1500 && mine.outstanding === 13500 && mine.schedule[0].paid === 1500, 'repaid 1,500, owed 13,500; the schedule marks November paid', mine);
r = call('4001', 'eosQuote', { empId: ids['5002'], lastDay: '2026-11-30' });
ok(r.ok && r.eos.loans === 13500 && Math.abs(r.eos.net - (r.eos.gross - r.eos.advances - 13500)) < 0.01, 'the final settlement deducts the 13,500 still owed', r.eos);

console.log('Art. 93 cap: the loan waits first');
ok(call('4001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-12', code: 'other_deduction', amount: 4000, reason: 'تسوية' } }).ok, 'a 4,000 other deduction in December');
B.setNow(Date.parse('2026-12-02T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
r = call('4002', 'payrollCreate', { month: '2026-12' });
slip = call('4001', 'payrollGet', { id: r.run.id }).slips.find(s => s.empId === ids['5002']);
ok(!slip.lines.some(l => l.code === 'loan') && slip.warnings.indexOf('advance_deferred') >= 0, 'over half the wage: the December instalment is deferred', { lines: slip.lines, w: slip.warnings });
call('4001', 'payrollDelete', { id: r.run.id }); // discard the December draft
call('4001', 'payrollAdjDelete', { id: direct(() => B.ctx.readAll_('adjustments')).find(a => a.month === '2026-12').id });

console.log('Early settlement');
ok(call('4001', 'loanSettle', { id: L1.id, amount: 20000, reference: 'R' }).error === 'bad_amount', 'cannot settle more than is owed');
r = call('4001', 'loanSettle', { id: L1.id, amount: 5000, reference: 'DEP-77' });
const st = r.loan.settlements[0];
ok(r.ok && st.status === 'pending' && r.loan.outstanding === 13500, 'a 5,000 payment is recorded, not counted yet', r.loan);
ok(call('4001', 'loanSettleVerify', { id: L1.id, settlementId: st.id }).error === 'second_approver_required', 'the one who recorded it cannot verify it');
ok(call('4002', 'myTasks').tasks.some(t => t.kind === 'loan_settle_verify' && t.count === 1), 'the other payroll holder is asked to verify');
r = call('4002', 'loanSettleVerify', { id: L1.id, settlementId: st.id });
ok(r.ok && r.loan.outstanding === 8500, 'verified: 8,500 still owed', r.loan.outstanding);
r = call('4001', 'loanSettle', { id: L1.id, amount: 8500, reference: 'DEP-78' });
r = call('4002', 'loanSettleVerify', { id: L1.id, settlementId: r.loan.settlements[1].id });
ok(r.ok && r.loan.status === 'settled' && r.loan.outstanding === 0 && r.loan.closedOn, 'paid in full: the loan is settled', r.loan);
ok(call('5002', 'loanQuote', { loan: { principal: 1000, months: 2 } }).quote.errors.indexOf('loan_active_exists') < 0, 'a settled loan no longer blocks a new one');

console.log('Lists and access');
ok(call('5001', 'loanList', { scope: 'all' }).error === 'forbidden', 'a plain employee cannot list loans');
r = call('3001', 'loanList', { scope: 'all' });
ok(r.ok && r.rows.length === 2 && r.rows[0].principal !== undefined && r.totals, 'HR lists every loan with amounts and totals', r.rows.length);
r = call('1000', 'loanList', { scope: 'all' });
ok(r.ok && r.rows.every(x => x.principal === undefined) && r.totals === null, 'the administrator alone (adminSeesPay off) sees no amounts');
r = call('4001', 'loanPolicySave', { policy: { maxSalaries: 5, oneActive: false } });
ok(r.ok && r.policy.maxSalaries === 5 && r.policy.oneActive === false, 'payroll widens the policy');
ok(call('5002', 'myLoans').policy.maxSalaries === 5, 'and the employee sees it');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
