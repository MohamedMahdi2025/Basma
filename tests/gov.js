// Government services: exit/re-entry, final exit, iqama register, tickets, fee ledger: node tests/gov.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // strict mode: an administrator alone sees and enters no amounts
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
function at(iso) { B.setNow(Date.parse(iso)); Object.keys(toks).forEach(k => delete toks[k]); }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3003', 'أخصائي الخدمات الحكومية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('4002', 'مدير مالي', 'employee');
person('2002', 'الرئيس التنفيذي', 'employee');
person('5001', 'مشرف المستودع', 'employee');
person('5002', 'سائق مقيم', 'employee');
person('5003', 'موظف سعودي', 'employee');
person('5004', 'فني مقيم', 'employee');
['4001', '4002'].forEach(no => call('1000', 'hrRolesSave', { id: ids[no], extraRoles: 'payroll' }));
call('1000', 'hrRolesSave', { id: ids['2002'], extraRoles: 'executive' });
Object.keys(toks).forEach(k => delete toks[k]);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], nationality: 'IN', hireDate: '2022-01-10' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], nationality: 'SA', hireDate: '2023-03-01' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], nationality: 'EG', hireDate: '2025-01-01', contractType: 'fixed', contractEnd: '2027-12-31' } });
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { nationalId: '2123456789', idExpiry: '2026-11-15' } });
call('3001', 'hrPrivateSave', { empId: ids['5004'], priv: { nationalId: '2987654321', idExpiry: '2027-06-30' } });
let r;

console.log('Exit/re-entry: the request (Leave.gs engine, manager then HR)');
const erv = { type: 'exit_reentry', fromDate: '2026-11-01', toDate: '2026-11-30', payload: { visaType: 'single', durationDays: 60, dependants: 2 } };
r = call('5003', 'requestQuote', { request: erv });
ok(r.quote.error === 'saudi_not_applicable', 'a Saudi employee cannot ask for one', r.quote);
r = call('5002', 'requestQuote', { request: Object.assign({}, erv, { payload: { durationDays: 60 } }) });
ok(r.quote.error === 'missing_fields', 'single or multiple is required', r.quote);
r = call('5002', 'requestQuote', { request: Object.assign({}, erv, { payload: Object.assign({}, erv.payload, { leaveRef: 'LV-2026-09999' }) }) });
ok(r.quote.error === 'leave_not_found', 'a linked leave must be one of my live leave requests', r.quote);
r = call('5002', 'requestQuote', { request: Object.assign({}, erv, { payload: Object.assign({}, erv.payload, { durationDays: 20 }) }) });
ok(r.quote.days === 30 && r.quote.warnings.indexOf('visa_shorter_than_trip') >= 0 && r.quote.warnings.indexOf('iqama_expires_before_return') >= 0,
  'the quote warns: visa shorter than the 30-day trip, iqama ends before the return', r.quote);
r = call('5002', 'requestCreate', { request: erv, reason: 'إجازة سنوية في الهند' });
const q1 = r.request;
ok(r.ok && q1.ref === 'ERV-2026-00001' && q1.step === 'manager' && q1.visa.visaType === 'single' && q1.visa.durationDays === 60, 'created ERV-2026-00001, waiting for the manager', q1);
r = call('5002', 'requestCreate', { request: Object.assign({}, erv, { fromDate: '2026-11-20', toDate: '2026-12-05' }) });
ok(!r.ok && r.error === 'overlaps', 'a second visa for overlapping dates is refused', r);
ok(!call('5003', 'reqDecide', { id: q1.id, decision: 'approve' }).ok, 'a colleague cannot approve it');
ok(call('5001', 'reqDecide', { id: q1.id, decision: 'approve' }).ok, 'the manager approves');
r = call('3001', 'reqDecide', { id: q1.id, decision: 'approve' });
ok(r.ok && r.request.status === 'approved' && r.request.visa.visaStatus === 'approved', 'HR gives the final approval: the visa now waits to be issued in Muqeem', r.request);
r = call('3003', 'myTasks');
ok(r.tasks.some(t => t.kind === 'gov_visa_issue' && t.count === 1 && t.target.sec === 'gov'), 'the bell asks HR to record the issued visa', r.tasks);
r = call('3003', 'govOverview');
const v1 = r.visas.find(v => v.ref === 'ERV-2026-00001');
ok(r.ok && r.counts.toIssue === 1 && v1 && v1.canIssue && v1.dependants === 2, 'it is in the government services list as "to issue"', r.counts);

console.log('Issuing, the fee, the return');
r = call('1000', 'govVisaIssue', { id: v1.id, visa: { visaNo: '4402119876', expiry: '2027-01-04', fee: 200 } });
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot enter a fee amount (strict mode)', r);
r = call('3003', 'govVisaIssue', { id: v1.id, visa: { visaNo: '4402119876' } });
ok(!r.ok && r.error === 'missing_fields', 'the expiry is required', r);
r = call('3003', 'govVisaIssue', { id: v1.id, visa: { visaNo: '4402119876', issuedOn: '2026-10-05', expiry: '2027-01-04', fee: 200, paidBy: 'company' } });
ok(r.ok && r.visa.status === 'issued' && r.visa.visaNo === '4402119876' && r.visa.fee === 200, 'HR records visa 4402119876, expiry 4 Jan 2027, fee 200 SAR', r.visa);
r = call('5002', 'myRequests');
ok(r.rows[0].visa.visaNo === '4402119876' && r.rows[0].visa.expiry === '2027-01-04', 'the employee sees the visa number on the request');
r = call('3001', 'govOverview');
const f1 = r.fees.find(f => f.sourceRef === 'ERV-2026-00001');
ok(f1 && f1.ref === 'GF-2026-00001' && f1.amount === 200 && f1.type === 'exit_reentry' && f1.status === 'recorded', 'the fee is in the ledger, waiting for verification', f1);
r = call('1000', 'govOverview');
ok(r.ok && r.money === false && r.fees.find(f => f.id === f1.id).amount === null && r.visas.find(v => v.id === v1.id).fee === null, 'an administrator alone sees no amounts');
r = call('5002', 'govOverview');
ok(!r.ok && r.error === 'forbidden', 'an employee cannot open the government services list', r);
ok(call('4001', 'myTasks').tasks.some(t => t.kind === 'gov_fee_verify' && t.count === 1), 'payroll is asked to verify the fee');
r = call('3003', 'govFeeVerify', { ids: [f1.id] });
ok(!r.ok && r.error === 'second_approver_required', 'the one who entered it cannot verify it', r);
r = call('4001', 'govFeeVerify', { ids: [f1.id] });
ok(r.ok && r.verified === 1, 'a payroll holder verifies it');
r = call('5002', 'govVisaReturn', { id: v1.id, date: '2026-10-05' });
ok(!r.ok && r.error === 'forbidden', 'the traveller cannot confirm their own return', r);
r = call('5003', 'govVisaReturn', { id: v1.id, date: '2026-10-05' });
ok(!r.ok && r.error === 'forbidden', 'nor a colleague', r);

console.log('A visa not returned');
r = call('5004', 'requestCreate', { request: { type: 'exit_reentry', fromDate: '2026-10-06', toDate: '2026-10-15', payload: { visaType: 'multiple', durationDays: 15 } } });
const q2 = r.request;
ok(r.ok && q2.step === 'hr', 'no manager: the chain starts at HR', q2);
call('3001', 'reqDecide', { id: q2.id, decision: 'approve' });
const v2 = call('3003', 'govOverview').visas.find(v => v.ref === q2.ref);
ok(call('3003', 'govVisaIssue', { id: v2.id, visa: { visaNo: '4402110001', expiry: '2026-10-20' } }).ok, 'issued with no fee recorded');
at('2026-10-28T06:00:00Z');
r = call('3001', 'govOverview');
ok(r.counts.overdue === 1 && r.counts.away === 1 && r.visas.find(v => v.id === v2.id).overdue, '8 days past the expiry (grace 7): not returned', r.counts);
r = call('3001', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'visa_not_returned' && x.ref === q2.ref && x.level === 'error'), 'it is in the compliance calendar as overdue');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'gov_visa_return' && t.count === 1), 'and HR has a follow-up task (nothing automatic follows)');
r = call('5001', 'govVisaReturn', { id: v1.id, date: '2026-10-27' });
ok(r.ok && r.visa.status === 'returned' && r.visa.returnedOn === '2026-10-27', 'the manager confirms 5002 is back', r.visa);
ok(call('3001', 'govVisaReturn', { id: v2.id, date: '2026-10-28' }).ok, 'HR confirms the other return');

console.log('Final exit');
r = call('3001', 'govFinalExit', { exit: { empId: ids['5003'], lastDay: '2026-11-30' } });
ok(!r.ok && r.error === 'saudi_not_applicable', 'not for a Saudi', r);
r = call('3001', 'govFinalExit', { exit: { empId: ids['5004'], lastDay: '2026-11-30', travelDate: '2026-12-02' } });
const fx = r.visa;
ok(r.ok && fx.ref === 'FEX-2026-00001' && fx.status === 'planned' && fx.travelFrom === '2026-12-02', 'planned: FEX-2026-00001', fx);
ok(call('3001', 'govFinalExit', { exit: { empId: ids['5004'], lastDay: '2026-11-30' } }).error === 'already_exists', 'one final exit per person');
r = call('3003', 'govVisaIssue', { id: fx.id, visa: { visaNo: '9900112233', expiry: '2026-12-27', fee: 70, paidBy: 'employee' } });
ok(!r.ok && r.error === 'note_required', 'a fee paid by the employee needs a note (Art. 40: it is the employer\'s)', r);
r = call('3003', 'govVisaIssue', { id: fx.id, visa: { visaNo: '9900112233', expiry: '2026-12-27', fee: 70, paidBy: 'employee', note: 'دفعه الموظف وسيعاد له مع المخالصة' } });
ok(r.ok && r.visa.status === 'issued' && r.visa.art40, 'issued; flagged so HR refunds the employee', r.visa);
ok(call('5001', 'govVisaReturn', { id: fx.id }).error === 'forbidden', 'only HR records a final-exit departure');

console.log('Iqama register and renewal');
r = call('3001', 'govOverview');
const iq2 = r.iqama.find(x => x.emp.empNo === '5002');
ok(r.iqama.length === 2 && !r.iqama.some(x => x.emp.empNo === '5003') && iq2.expiry === '2026-11-15' && iq2.daysLeft === 18 && iq2.level === 'due', 'non-Saudis only; 5002 expires in 18 days', iq2);
r = call('3001', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'iqama' && x.emp.empNo === '5002' && x.renewal === true) && !r.items.some(x => x.kind === 'iqama_renewal' && x.emp.empNo === '5002'), 'the calendar marks the iqama for renewal (no duplicate item)');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'iqama_renewal' && t.count === 1), 'the bell lists the iqama due within 30 days');
const ren = { empId: ids['5002'], newExpiry: '2027-11-14', renewedOn: '2026-10-28', years: 1, muqeemRef: 'MQ-778812', fees: { iqama: 650, work_permit: 9600, muqeem_print: 15 } };
r = call('1000', 'iqamaRenew', { renewal: ren });
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot record the fees', r);
r = call('3001', 'iqamaRenew', { renewal: Object.assign({}, ren, { newExpiry: '2026-11-01' }) });
ok(!r.ok && r.error === 'bad_date', 'the new expiry must be later than the current one', r);
r = call('3001', 'iqamaRenew', { renewal: ren });
ok(r.ok && r.ref === 'IQR-2026-00001', 'renewal IQR-2026-00001 recorded', r);
const pv = direct(() => B.ctx.findBy_('empPrivate', 'empId', ids['5002']));
ok(String(pv.idExpiry).slice(0, 10) === '2027-11-14', 'the private file now holds the new expiry');
r = call('3001', 'govOverview');
const iq2b = r.iqama.find(x => x.emp.empNo === '5002');
ok(iq2b.level === 'ok' && iq2b.last.total === 10265 && iq2b.last.muqeemRef === 'MQ-778812', 'the register shows the renewal and 650 + 9600 + 15 = 10,265 SAR', iq2b);
const rf = r.fees.filter(f => f.sourceRef === 'IQR-2026-00001');
ok(rf.length === 3 && rf.every(f => f.status === 'recorded' && f.reference === 'MQ-778812'), 'three fee lines, one per fee type, with the Muqeem reference', rf.map(f => f.type));
ok(call('1000', 'govOverview').iqama.find(x => x.emp.empNo === '5002').last.total === null, 'the administrator alone sees the renewal, not its cost');
r = call('4001', 'govFeeVerify', { ids: rf.map(f => f.id) });
ok(r.ok && r.verified === 3, 'payroll verifies the three in one step');
r = call('4001', 'govFeeSave', { fee: { type: 'muqeem_print', amount: 15, date: '2026-10-28', reference: 'SADAD-1', empId: ids['5004'] } });
const f9 = r.fee;
ok(r.ok && f9.ref === 'GF-2026-00006' && f9.canVerify === false, 'payroll records a printing fee; they cannot verify their own entry', f9);
ok(call('1000', 'govFeeSave', { fee: { type: 'other', amount: 10, reference: 'x' } }).error === 'forbidden', 'an administrator alone cannot record fees');
ok(call('4002', 'govFeeVoid', { id: f9.id }).error === 'note_required', 'voiding needs a note');
ok(call('4002', 'govFeeVoid', { id: f9.id, note: 'قيد مكرر' }).ok, 'voided with a note');

console.log('Dashboard money rule');
r = call('4001', 'dashboard', { from: '2026-10-01', to: '2026-10-28' });
ok(r.ok && r.govFees && r.govFees.thisMonth === 200 + 70 + 10265 && r.govFees.byType.work_permit === 9600, 'payroll sees October fees 10,535 SAR (void excluded)', r.govFees);
r = call('2002', 'dashboard', { from: '2026-10-01', to: '2026-10-28' });
ok(r.ok && r.govFees && r.govFees.thisMonth === 10535, 'the executive sees the totals');
r = call('1000', 'dashboard', { from: '2026-10-01', to: '2026-10-28' });
ok(r.ok && r.govFees === undefined, 'an administrator alone gets no fee block');

console.log('Annual tickets');
ok(call('5001', 'ticketSave', { ticket: { empId: ids['5002'] } }).error === 'forbidden', 'only HR sets the entitlement');
r = call('3001', 'ticketSave', { ticket: { empId: ids['5002'], travelClass: 'economy', everyYears: 2, dependants: 2, route: 'RUH-COK', fromDate: '2022-01-10' } });
const tk = r.ticket;
ok(r.ok && tk.entitled === 3 && tk.cycleDue === '2026-01-10' && tk.nextDue === '2028-01-10' && tk.remaining === 3, 'every 2 years from 10 Jan 2022: the cycle that began 10 Jan 2026 gives 3 tickets', tk);
ok(call('3001', 'complianceCalendar').items.some(x => x.kind === 'ticket_due' && x.emp.empNo === '5002' && x.persons === 3), 'the calendar shows the ticket due');
r = call('3001', 'ticketUse', { use: { empId: ids['5002'], persons: 4, kind: 'ticket' } });
ok(!r.ok && r.error === 'ticket_exhausted', 'not more persons than the entitlement', r);
r = call('3001', 'ticketUse', { use: { empId: ids['5002'], persons: 2, kind: 'ticket', amount: 3000, usedOn: '2026-10-20', reference: 'PNR-QX81' } });
const u1 = r.use;
ok(r.ok && u1.ref === 'TKT-2026-00001' && u1.status === 'pending', 'two tickets issued (3,000 SAR): waiting for payroll', u1);
ok(call('4001', 'myTasks').tasks.some(t => t.kind === 'ticket_approve' && t.count === 1), 'payroll is asked to approve the ticket cost');
ok(call('3001', 'ticketUseApprove', { id: u1.id }).error === 'second_approver_required', 'the one who recorded it cannot approve it');
ok(call('4001', 'ticketUseApprove', { id: u1.id }).ok, 'a payroll holder approves it');
r = call('3001', 'ticketUse', { use: { empId: ids['5002'], persons: 1, kind: 'cash', amount: 1500 } });
ok(r.ok && r.use.status === 'pending', 'the third ticket is paid as cash (1,500 SAR)', r.use);
const u2 = r.use;
r = call('4002', 'ticketUseApprove', { id: u2.id });
ok(r.ok && /^ADJ-2026-/.test(r.use.adjRef), 'approved: a payroll line is made', r.use);
const adj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.ref === r.use.adjRef);
ok(adj && adj.code === 'other_earning' && Number(adj.amount) === 1500 && adj.month === '2026-10' && String(adj.reason).indexOf(u2.ref) === 0, 'other_earning 1,500 SAR in the next open payroll (October)', adj);
r = call('3001', 'ticketUse', { use: { empId: ids['5002'], persons: 1, kind: 'ticket' } });
ok(!r.ok && r.error === 'ticket_exhausted', 'the cycle is used up', r);
call('3001', 'ticketSave', { ticket: { empId: ids['5004'], travelClass: 'business', everyYears: 1, dependants: 0, fromDate: '2026-01-01' } });
ok(call('3001', 'ticketUse', { use: { empId: ids['5004'], persons: 1 } }).error === 'ticket_not_due', 'before the first year is complete there is no ticket yet');

console.log('My government file');
r = call('5002', 'myGov');
ok(r.ok && !r.saudi && r.visas.length === 1 && r.visas[0].visaNo === '4402119876' && r.iqama.expiry === '2027-11-14' && r.ticket.remaining === 0 && r.ticket.history.length === 2,
  'the employee sees their visa, iqama expiry and ticket history', r);
r = call('5003', 'myGov');
ok(r.ok && r.saudi && r.iqama === null, 'a Saudi has no iqama card');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
