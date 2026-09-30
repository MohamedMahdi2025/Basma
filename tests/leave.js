// HR Phase 2 checks (leave and requests): node tests/leave.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-04T05:30:00Z'); // Sunday 2026-10-04, 08:30 in Riyadh
const B = load({ setupKeyHash: sha('k'), now: T0 });

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
const E = no => direct(() => B.ctx.findBy_('employees', 'empNo', no));
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const ask = (no, request) => call(no, 'requestCreate', { request });
const quote = (no, request) => call(no, 'requestQuote', { request }).quote;
const decide = (no, id, decision, note) => call(no, 'reqDecide', { id, decision, note });

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3003', 'موارد بشرية ثانية', 'hr');
person('3002', 'الرواتب', 'employee');
person('5001', 'مدير الحسابات', 'employee');
person('5002', 'محاسب أول', 'employee');
person('5003', 'محاسبة', 'employee');
person('5004', 'موظف بلا مدير', 'employee');
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], hireDate: '2021-06-15', nationality: 'SA', gender: 'male' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], managerId: ids['5001'], hireDate: '2025-10-01', nationality: 'SA', gender: 'female' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], hireDate: '2024-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-12-31' } });
// they started before the system: history and reports count from September
direct(() => ['5002', '5003', '5004'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; B.ctx.update_('employees', e); }));
direct(() => B.ctx.append_('compensation', { id: 'C1', ref: 'SAL-X', empId: ids['5002'], effectiveFrom: '2026-01-01', basic: 9000, housing: 2250, transport: 900, otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
let r, q;

console.log('Annual balance (Art. 109)');
r = call('5002', 'myRequests');
const exp5002 = 34 * 30 / 365; // 30 a year (over 5 years' service), from the go-live on 1 September
ok(r.ok && near(r.leave.annual.balance, exp5002) && r.leave.annual.perYear === 30 && r.leave.annual.openingMissing, 'no carried-over balance yet: counts from the go-live at 30 a year, and says so', { got: r.leave.annual, want: exp5002 });
ok(near(B.ctx.accrueBetween_(E('5002'), '2021-06-15', '2026-10-04'), 1826 * 21 / 365 + 112 * 30 / 365), 'accrual: 21 a year until the 5th anniversary, then 30 (Art. 109)');
r = call('3001', 'leaveOpeningSave', { empId: ids['5003'], days: 10, asOf: '2026-09-30' });
ok(r.ok, 'HR records a balance carried over from the old system', r);
r = call('3001', 'leaveOpeningSave', { empId: ids['3001'], days: 99, asOf: '2026-09-30' });
ok(!r.ok && r.error === 'cannot_change_own_balance', 'HR cannot set their own balance', r);
r = call('5003', 'myRequests');
ok(near(r.leave.annual.balance, 10 + 4 * 21 / 365, 0.01), 'opening balance plus what accrued since (4 days at 21 a year)', r.leave.annual);

call('3001', 'leaveOpeningSave', { empId: ids['5002'], days: 20, asOf: '2026-09-30' });
const open5002 = 20 + 4 * 30 / 365;
ok(near(call('5002', 'myRequests').leave.annual.balance, open5002, 0.01), 'with 20 days carried over at go-live, the balance is 20 plus what accrued since');

console.log('Annual leave request and approval chain');
r = call('3001', 'holidaySave', { holiday: { date: '2026-10-13', nameAr: 'عطلة تجريبية' } });
ok(r.ok, 'HR adds a public holiday', r);
r = call('5002', 'holidaySave', { holiday: { date: '2026-10-14', nameAr: 'x' } });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot add holidays', r);
q = quote('5002', { type: 'leave', subtype: 'annual', fromDate: '2026-10-11', toDate: '2026-10-17' });
ok(q.days === 4 && q.calendarDays === 7 && q.holidays[0] === '2026-10-13', 'Sun to Sat counts 4 days: Friday, Saturday and the holiday are not taken from the balance', q);
r = ask('5002', { type: 'leave', subtype: 'annual', fromDate: '2026-10-11', toDate: '2026-10-17', reason: 'سفر' });
ok(r.ok && r.request.status === 'pending' && r.request.step === 'manager' && r.request.ref === 'LV-2026-00001', 'the request is numbered LV-2026-00001 and goes to the manager first', r.request);
const lv1 = r.request.id;
r = ask('5002', { type: 'leave', subtype: 'annual', fromDate: '2026-10-15', toDate: '2026-10-19' });
ok(!r.ok && r.error === 'overlaps', 'a second leave on the same days is refused', r);
r = call('5002', 'myRequests');
ok(near(r.leave.annual.pending, 4) && near(r.leave.annual.available, open5002 - 4), 'pending days are reserved', r.leave.annual);
r = decide('5002', lv1, 'approve');
ok(!r.ok && r.error === 'cannot_decide_own', 'nobody approves their own request', r);
r = decide('5003', lv1, 'approve');
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot approve it', r);
r = call('5001', 'reqInbox');
ok(r.ok && r.rows.length === 1 && r.rows[0].canAct && r.rows[0].balance, 'the manager sees it waiting, with the balance', r.rows && r.rows.length);
r = decide('5001', lv1, 'approve');
ok(r.ok && r.request.step === 'hr' && r.request.status === 'pending', 'the manager approves; it moves to HR', r.request);
r = decide('5001', lv1, 'approve');
ok(!r.ok && r.error === 'forbidden', 'the manager cannot also approve the HR step', r);
r = decide('3001', lv1, 'approve');
ok(r.ok && r.request.status === 'approved' && r.request.history.length === 2, 'HR approves; the leave is approved with both decisions recorded', r.request);
r = call('5002', 'myRequests');
ok(near(r.leave.annual.used, 4) && near(r.leave.annual.pending, 0), 'the balance shows 4 days used', r.leave.annual);
r = ask('5003', { type: 'leave', subtype: 'annual', fromDate: '2026-10-18', toDate: '2026-11-05' });
ok(!r.ok && r.error === 'insufficient_balance', 'more days than the balance is refused', r);

console.log('Rejection, cancellation, no manager');
r = ask('5003', { type: 'leave', subtype: 'annual', fromDate: '2026-10-25', toDate: '2026-10-26' });
const lv2 = r.request.id;
r = decide('5001', lv2, 'reject');
ok(!r.ok && r.error === 'note_required', 'a rejection needs a reason', r);
r = decide('5001', lv2, 'reject', 'ضغط عمل نهاية الشهر');
ok(r.ok && r.request.status === 'rejected', 'the manager rejects with a reason; it stops there', r.request);
r = ask('5003', { type: 'leave', subtype: 'annual', fromDate: '2026-10-27', toDate: '2026-10-27' });
r = call('5003', 'requestCancel', { id: r.request.id });
ok(r.ok, 'the employee withdraws a pending request', r);
r = call('3001', 'requestCancel', { id: lv1, note: 'تغيير الخطة' });
ok(r.ok && near(call('5002', 'myRequests').leave.annual.used, 0), 'HR cancels an approved leave not yet taken; the days come back', r);
r = ask('5004', { type: 'leave', subtype: 'annual', fromDate: '2026-10-04', toDate: '2026-10-04' });
ok(r.ok && r.request.step === 'hr', 'with no manager the request goes straight to HR', r.request);
decide('3001', r.request.id, 'approve');
r = call('3001', 'board');
const b5004 = r.rows.find(x => x.emp.empNo === '5004');
ok(b5004.day.status === 'leave' && r.kpi.leave === 1 && r.kpi.absent === r.rows.filter(x => x.day.status === 'absent').length, 'the live board shows the person on leave, not absent', { st: b5004.day.status, kpi: r.kpi });
r = ask('3001', { type: 'leave', subtype: 'annual', fromDate: '2026-11-01', toDate: '2026-11-01' });
const hrOwn = r.request.id;
ok(!decide('3001', hrOwn, 'approve').ok && decide('3003', hrOwn, 'approve').ok, 'HR asking for leave is approved by another HR person');

console.log('Statutory leave types');
r = ask('5003', { type: 'leave', subtype: 'sick', fromDate: '2026-10-01', toDate: '2026-10-01' });
ok(!r.ok && r.error === 'document_required', 'sick leave needs the medical report number', r);
r = ask('5003', { type: 'leave', subtype: 'sick', fromDate: '2026-10-01', toDate: '2026-10-01', docNo: 'SEHA-8841' });
ok(r.ok && r.request.sick.full === 1, 'a day of sick leave on full pay', r.request && r.request.sick);
decide('5001', r.request.id, 'approve'); decide('3001', r.request.id, 'approve');
r = call('5003', 'myHistory', { month: '2026-10' });
const d1 = r.days.find(x => x.date === '2026-10-01');
ok(d1.status === 'leave' && d1.leaveType === 'sick' && r.days.filter(x => x.status === 'absent').every(x => x.date === '2026-10-04') && r.totals.leave === 1, 'the attendance record shows the sick day as leave, not absent', { d1, totals: r.totals });
q = quote('5003', { type: 'leave', subtype: 'sick', fromDate: '2026-10-10', toDate: '2026-11-13', docNo: 'SEHA-9' });
ok(q.sick.usedBefore === 1 && q.sick.full === 29 && q.sick.p75 === 6 && q.warnings.includes('sick_reduced_pay'), 'the same sick year: 29 more days on full pay, then 75% (Art. 117)', q.sick);
q = quote('5003', { type: 'leave', subtype: 'maternity', fromDate: '2026-11-01', toDate: '2027-01-23', docNo: 'B-1' });
ok(!q.error && q.days === 84, 'maternity: 12 weeks (84 days)', q);
q = quote('5003', { type: 'leave', subtype: 'maternity', fromDate: '2026-11-01', toDate: '2027-01-24', docNo: 'B-1' });
ok(q.error === 'too_many_days', 'not a day more', q);
q = quote('5002', { type: 'leave', subtype: 'maternity', fromDate: '2026-11-01', toDate: '2026-11-02', docNo: 'B-1' });
ok(q.error === 'leave_not_eligible', 'maternity is not offered to a man', q);
q = quote('5003', { type: 'leave', subtype: 'hajj', fromDate: '2027-05-10', toDate: '2027-05-21' });
ok(q.error === 'leave_not_eligible', 'hajj needs two years of service (Art. 114)', q);
q = quote('5002', { type: 'leave', subtype: 'hajj', fromDate: '2027-05-10', toDate: '2027-05-18' });
ok(q.error === 'too_few_days', 'hajj is 10 to 15 days', q);
q = quote('5002', { type: 'leave', subtype: 'paternity', fromDate: '2026-10-13', toDate: '2026-10-15', payload: { eventDate: '2026-10-05' } });
ok(q.error === 'outside_window', 'paternity leave is taken within 7 days of the birth', q);
q = quote('5002', { type: 'leave', subtype: 'paternity', fromDate: '2026-10-06', toDate: '2026-10-08', payload: { eventDate: '2026-10-05' } });
ok(!q.error && q.days === 3, 'three days right after the birth', q);
ask('5002', { type: 'leave', subtype: 'marriage', fromDate: '2026-12-01', toDate: '2026-12-05' });
r = ask('5002', { type: 'leave', subtype: 'marriage', fromDate: '2027-02-01', toDate: '2027-02-05' });
ok(!r.ok && r.error === 'leave_once', 'marriage leave once in service', r);
q = quote('5003', { type: 'leave', subtype: 'iddah', fromDate: '2026-11-01', toDate: '2027-03-10', docNo: 'D-1', payload: { variant: 'full' } });
ok(!q.error && q.days === 130, 'iddah: 130 days, chosen by the employee, no religion stored', q);
q = quote('5004', { type: 'leave', subtype: 'unpaid', fromDate: '2026-11-01', toDate: '2026-11-25' });
ok(!q.error && q.warnings.includes('contract_suspended'), 'unpaid leave over 20 days warns that the contract is suspended (Art. 116)', q);

console.log('Letters, advances, corrections, data changes, resignation');
r = ask('5002', { type: 'letter', subtype: 'salary_certificate', payload: { addressee: 'بنك الراجحي' } });
ok(r.ok && r.request.ref === 'LT-2026-00001' && r.request.step === 'hr' && r.request.letter.addressee === 'بنك الراجحي', 'a salary letter goes to HR, numbered LT-2026-00001', r.request);
ok(decide('3001', r.request.id, 'approve').ok, 'HR approves the letter');
r = ask('5002', { type: 'advance', amount: 13000, months: 2 });
ok(!r.ok && r.error === 'advance_too_large', 'an advance is at most one month of wage (12,150)', r);
r = ask('5002', { type: 'advance', amount: 7000, months: 1 });
ok(!r.ok && r.error === 'deduction_over_half', 'an instalment over half the wage is refused (Art. 93)', r);
r = ask('5002', { type: 'advance', amount: 6000, months: 3, reason: 'ظرف طارئ' });
ok(r.ok && r.request.ref === 'AD-2026-00001' && r.request.step === 'hr' && r.request.installment === 2000 && r.request.warnings.includes('deduction_over_10'), 'a salary advance: HR first, 2,000 a month, flagged over 10% (Art. 92)', r.request);
const ad = r.request.id;
ok(!ask('5002', { type: 'advance', amount: 100, months: 1 }).ok, 'one pending advance at a time');
ok(!call('5001', 'reqInbox').rows.some(x => x.type === 'advance'), 'the line manager never sees the advance');
decide('3001', ad, 'approve');
r = decide('3003', ad, 'approve');
ok(!r.ok && r.error === 'forbidden', 'HR cannot take the payroll step', r);
r = decide('3002', ad, 'approve');
ok(r.ok && r.request.status === 'approved' && r.request.startMonth === '2026-11', 'payroll approves; repayment starts next month', r.request);
r = ask('5002', { type: 'correction', payload: { date: '2026-10-01', time: '08:05', punchType: 'in' }, reason: 'نسيت التسجيل' });
ok(r.ok && r.request.ref === 'AC-2026-00001', 'an attendance correction, numbered AC-2026-00001', r.request);
decide('5001', r.request.id, 'approve'); decide('3001', r.request.id, 'approve');
r = call('5002', 'myHistory', { month: '2026-10' });
ok(r.days.find(x => x.date === '2026-10-01').firstIn, 'once approved, the missing check-in is on the record');
const newIban = 'SA0380000000608010167519';
r = ask('5002', { type: 'data_change', payload: { fields: { iban: newIban, phone: '0551234567' } } });
ok(r.ok && r.request.ref === 'DC-2026-00001' && r.request.step === 'hr', 'a bank account change is a request to HR', r.request);
ok(!call('5001', 'reqInbox').rows.some(x => x.type === 'data_change'), 'the manager does not see it');
decide('3001', r.request.id, 'approve');
r = call('5002', 'myFile');
ok(r.file.priv.iban === newIban && r.file.emp.phone === '0551234567', 'approved: the new IBAN and mobile are on file (leading zero kept)', { iban: r.file.priv.iban, phone: r.file.emp.phone });
r = ask('3001', { type: 'data_change', payload: { fields: { iban: newIban } } });
ok(!decide('3001', r.request.id, 'approve').ok && decide('3003', r.request.id, 'approve').ok, 'an HR person changing their own bank account needs another HR person');
r = ask('5002', { type: 'data_change', payload: { fields: { iban: 'SA0000000000000000000000' } } });
ok(!r.ok && r.error === 'bad_iban', 'a wrong IBAN is refused before it reaches HR', r);
r = ask('5002', { type: 'resignation', payload: { lastDay: '2026-10-20' }, reason: 'فرصة أخرى' });
ok(r.ok && r.request.ref === 'RS-2026-00001' && r.request.warnings.includes('short_notice') && r.request.resignation.minLastDay === '2026-11-03', 'resignation with less than 30 days notice is flagged (Art. 75)', r.request);
decide('5001', r.request.id, 'approve'); decide('3001', r.request.id, 'approve');
ok(E('5002').lastWorkingDay === '2026-10-20' && E('5002').resignedOn === '2026-10-04', 'approved: the last working day is on the file');
ok(!ask('5002', { type: 'resignation' }).ok, 'and a second resignation is refused');

direct(() => B.ctx.append_('requests', { id: 'RX', ref: 'LV-2026-00005', empId: ids['5004'], type: 'leave', subtype: 'unpaid', fromDate: '2027-03-01', toDate: '2027-03-01', days: 1, status: 'rejected', step: 'hr', stepsJson: '[]', payloadJson: '{}', effectJson: '{}', createdAt: '2026-10-04T00:00:00Z' }));
r = ask('5004', { type: 'leave', subtype: 'unpaid', fromDate: '2027-04-01', toDate: '2027-04-01' });
ok(r.ok && r.request.ref !== 'LV-2026-00005' && /^LV-2026-[0-9]{5}$/.test(r.request.ref), 'a number already in the sheet is never handed out again', r.request && r.request.ref);

console.log('Team calendar and balances');
r = call('5001', 'leaveTeam', { month: '2026-10' });
ok(r.ok && r.rows.every(x => ['5002', '5003', '5001'].includes(x.emp.empNo)) && r.holidays.length === 1, 'the manager sees their team leave and the holidays', r.rows && r.rows.map(x => x.emp.empNo));
r = call('5004', 'leaveTeam', { month: '2026-10' });
ok(!r.ok && r.error === 'forbidden', 'someone who manages nobody has no team calendar', r);
r = call('3001', 'leaveBalances');
const b3 = r.rows.find(x => x.emp.empNo === '5003');
ok(r.ok && b3.openingDays === 10 && b3.openingDate === '2026-09-30' && b3.sick.used === 1, 'HR sees every balance with the carried-over days', b3);
r = call('5003', 'leaveBalances');
ok(!r.ok && r.error === 'forbidden', 'an employee cannot see everyone else\'s balances', r);
r = call('5003', 'myRequests');
ok(r.ok && r.holidays.some(h => h.date === '2026-10-13'), 'the employee sees coming public holidays');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
