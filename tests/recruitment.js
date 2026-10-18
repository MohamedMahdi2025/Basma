// Recruitment: requisition -> candidates -> interviews -> offer -> hire into the employee file: node tests/recruitment.js
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
const fresh = () => Object.keys(toks).forEach(k => delete toks[k]);
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('5001', 'مدير العمليات', 'employee');
person('5002', 'سائق حالي', 'employee');
person('5003', 'مشرف المحطة', 'employee');
person('6001', 'الرئيس التنفيذي', 'employee');
call('1000', 'hrRolesSave', { id: ids['4001'], extraRoles: 'payroll' });
call('1000', 'hrRolesSave', { id: ids['6001'], extraRoles: 'executive' });
fresh();
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'] } });
let r;

console.log('Requisitions');
const RQ = { titleAr: 'سائق شاحنة غاز', titleEn: 'LPG truck driver', headcount: 2, contractType: 'fixed', budgetMin: 4000, budgetMax: 6000, reason: 'growth', justification: 'توسع التوزيع' };
ok(call('5003', 'recruitReqSave', { requisition: RQ }).error === 'forbidden', 'someone who manages nobody cannot ask for headcount');
ok(call('5001', 'recruitReqSave', { requisition: Object.assign({}, RQ, { titleAr: '' }) }).error === 'missing_fields', 'the title is required');
ok(call('5001', 'recruitReqSave', { requisition: Object.assign({}, RQ, { budgetMin: 7000 }) }).error === 'bad_amount', 'budget min above max is refused');
r = call('5001', 'recruitReqSave', { requisition: RQ });
const Q1 = r.requisition;
ok(r.ok && Q1.ref === 'RQ-2026-00001' && Q1.status === 'pending' && Q1.hiringManager.empNo === '5001' && Q1.budgetMax === undefined, 'RQ-2026-00001 by the manager, pending; the manager does not see budgets back', Q1);
ok(call('5001', 'recruitReqDecide', { id: Q1.id, decision: 'approve' }).error === 'second_approver_required', 'the requester cannot approve it');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'recruit_req_approve' && t.count === 1 && t.target.sec === 'recruitment'), 'HR is asked to decide');
ok(call('3001', 'recruitReqDecide', { id: Q1.id, decision: 'reject' }).error === 'note_required', 'rejecting needs a note');
r = call('3001', 'recruitReqDecide', { id: Q1.id, decision: 'approve' });
ok(r.ok && r.requisition.status === 'approved' && r.requisition.budgetMax === 6000, 'HR approves (and sees the budget)');
r = call('3001', 'recruitReqSave', { requisition: { titleAr: 'محاسب', headcount: 1, saudiOnly: true, contractType: 'indefinite' } });
const Q2 = r.requisition;
ok(call('3001', 'recruitCandSave', { candidate: { reqId: Q2.id, name: 'x', phone: '0500000000', consent: true } }).error === 'bad_request', 'no candidates before the requisition is approved');
ok(call('6001', 'recruitReqDecide', { id: Q2.id, decision: 'approve' }).ok, 'an executive approves an HR requisition (localised job, Saudi only)');
ok(call('5003', 'recruitReqList').rows.length === 0, 'a plain employee sees no requisitions');
ok(call('5001', 'recruitReqList').rows.length === 1, 'the hiring manager sees only their own');

console.log('Candidates (PDPL)');
const C = { reqId: Q1.id, name: 'أحمد علي', nameEn: 'Ahmed Ali', phone: '0551234567', email: 'Ahmed@Mail.com', nationality: 'EG', gender: 'male', source: 'jadarat', expectedSalary: 6500, yearsExperience: 6 };
ok(call('3001', 'recruitCandSave', { candidate: C }).error === 'consent_required', 'no data kept without the candidate\'s consent');
r = call('3001', 'recruitCandSave', { candidate: Object.assign({ consent: true }, C) });
const K1 = r.candidate;
ok(r.ok && K1.ref === 'CND-2026-00001' && K1.stage === 'applied' && K1.email === 'ahmed@mail.com' && K1.isSaudi === false && K1.consentAt, 'CND-2026-00001 applied, consent recorded', K1);
ok(call('3001', 'recruitCandSave', { candidate: Object.assign({ consent: true }, C, { email: '' }) }).error === 'already_exists', 'the same phone twice on one requisition is refused');
r = call('3001', 'recruitCandSave', { candidate: { reqId: Q1.id, name: 'خالد', phone: '0559999999', nationality: 'SA', source: 'referral', referredBy: ids['5002'], consent: true } });
const K2 = r.candidate;
ok(r.ok && K2.isSaudi === true && K2.referredBy.empNo === '5002', 'a Saudi referral from 5002');
r = call('5001', 'recruitCandList', { reqId: Q1.id });
ok(r.ok && r.rows.length === 2 && r.rows[0].phone === undefined && r.rows[0].expectedSalary === undefined, 'the hiring manager sees the candidates without contact data or salary', r.rows[0]);
ok(call('5003', 'recruitCandList', {}).rows.length === 0, 'someone not involved sees none');
ok(call('5003', 'recruitCandGet', { id: K1.id }).error === 'not_found', 'nor one by id');
ok(call('3001', 'recruitCandStage', { id: K1.id, stage: 'hired' }).error === 'bad_value', 'hired only through the hire step');
ok(call('3001', 'recruitCandStage', { id: K1.id, stage: 'screening' }).ok, 'HR screens the candidate');

console.log('Interviews and scorecards');
r = call('3001', 'recruitInterviewSave', { interview: { candidateId: K1.id, at: '2026-11-05T09:00:00+03:00', mode: 'onsite', location: 'المكتب الرئيسي', panel: [ids['5001'], ids['5003']] } });
const I1 = r.interview;
ok(r.ok && I1.ref === 'INT-2026-00001' && I1.panel.length === 2, 'INT-2026-00001 with a panel of two');
ok(call('3001', 'recruitCandGet', { id: K1.id }).candidate.stage === 'interview', 'the candidate moves to interview');
ok(call('5003', 'recruitCandGet', { id: K1.id }).ok, 'a panel member may open the candidate');
ok(call('5003', 'recruitInterviewFeedback', { id: I1.id, score: 4, recommendation: 'hire' }).error === 'bad_date', 'no score before the interview');
B.setNow(Date.parse('2026-11-05T09:00:00Z')); fresh();
ok(call('5002', 'recruitInterviewFeedback', { id: I1.id, score: 4, recommendation: 'hire' }).error === 'forbidden', 'only the panel scores');
ok(call('5003', 'recruitInterviewFeedback', { id: I1.id, score: 7, recommendation: 'hire' }).error === 'bad_value', 'scores are 1-5');
ok(call('5003', 'myTasks').tasks.some(t => t.kind === 'recruit_feedback' && t.count === 1), 'the panel member is asked for a scorecard');
ok(call('5001', 'recruitInterviewFeedback', { id: I1.id, score: 5, recommendation: 'strong_hire', criteria: { safety: 5, driving: 4 }, comment: 'خبرة ممتازة' }).ok, 'the manager scores 5');
r = call('5003', 'recruitCandGet', { id: K1.id });
ok(r.interviews[0].feedback.length === 0 && r.interviews[0].feedbackCount === 1, 'before scoring, the other panel member cannot see the manager\'s score', r.interviews[0]);
r = call('5003', 'recruitInterviewFeedback', { id: I1.id, score: 4, recommendation: 'hire' });
ok(r.ok && r.interview.status === 'done' && r.interview.feedback.length === 2, 'after scoring they see both; the interview is done');
ok(call('3001', 'recruitCandGet', { id: K1.id }).candidate.rating === 4.5, 'the candidate\'s rating is 4.5');

console.log('Offer and approval');
const OF = { candidateId: K1.id, startDate: '2026-12-01', contractType: 'fixed', contractMonths: 24, probationDays: 90, basic: 5000, housing: 1250, transport: 500, annualLeaveDays: 21, workLocation: 'الرياض' };
r = call('3001', 'recruitCandSave', { candidate: { reqId: Q2.id, name: 'سمير', phone: '0561111111', nationality: 'JO', consent: true } });
call('3001', 'recruitCandStage', { id: r.candidate.id, stage: 'screening' });
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF, { candidateId: r.candidate.id, contractType: 'indefinite' }) }).error === 'saudi_only', 'a localised job cannot be offered to a non-Saudi');
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF, { contractType: 'indefinite' }) }).error === 'expat_contract_fixed', 'Art. 37: an expat contract is fixed-term');
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF, { probationDays: 200 }) }).error === 'probation_too_long', 'Art. 53: probation at most 180 days');
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF, { annualLeaveDays: 15 }) }).error === 'leave_below_minimum', 'Art. 109: at least 21 days of leave');
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF, { startDate: '2026-10-01' }) }).error === 'bad_date', 'the start date is not in the past');
r = call('3001', 'recruitOfferSave', { offer: OF });
const O1 = r.offer;
ok(r.ok && O1.ref === 'OFR-2026-00001' && O1.status === 'pending' && O1.total === 6750 && O1.warnings.indexOf('over_budget') >= 0 && O1.warnings.indexOf('below_expectation') < 0,
  'OFR-2026-00001: 6,750 a month, over the 6,000 budget (and above the 6,500 asked, so no expectation flag)', O1);
ok(call('3001', 'recruitCandGet', { id: K1.id }).candidate.stage === 'offer', 'the candidate moves to offer');
ok(call('3001', 'recruitOfferSave', { offer: Object.assign({}, OF) }).error === 'already_exists', 'one live offer per candidate');
ok(call('3001', 'recruitOfferDecide', { id: O1.id, decision: 'approve' }).error === 'second_approver_required', 'the preparer cannot approve it');
ok(call('5001', 'recruitOfferDecide', { id: O1.id, decision: 'approve' }).error === 'forbidden', 'the hiring manager cannot approve pay');
ok(call('4001', 'myTasks').tasks.some(t => t.kind === 'recruit_offer_approve' && t.count === 1), 'payroll is asked to approve the offer');
ok(call('4001', 'recruitOfferDecide', { id: O1.id, decision: 'approve' }).error === 'note_required', 'over budget: the reason is required');
r = call('4001', 'recruitOfferDecide', { id: O1.id, decision: 'approve', note: 'خبرة 6 سنوات في نقل الغاز' });
ok(r.ok && r.offer.status === 'approved', 'payroll approves with the reason');
r = call('5001', 'recruitCandGet', { id: K1.id });
ok(r.offers.length === 1 && r.offers[0].basic === undefined && r.offers[0].status === 'approved', 'the hiring manager sees the offer status, not the pay', r.offers[0]);
ok(call('3001', 'recruitOfferSend', { id: O1.id }).ok, 'HR sends it');
r = call('3001', 'recruitOfferLetter', { id: O1.id });
ok(r.ok && r.letter.ref === 'OFR-2026-00001' && r.letter.pay.total === 6750 && r.letter.terms.contractMonths === 24 && r.letter.company && r.letter.candidate.name === 'أحمد علي', 'the offer letter data', r.letter);

console.log('Hire');
ok(call('3001', 'recruitHire', { offerId: O1.id, empNo: '7001' }).error === 'not_found', 'not before the candidate accepts');
ok(call('3001', 'recruitOfferRespond', { id: O1.id, response: 'accepted', note: 'وقع على العرض' }).ok, 'the candidate accepts');
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'recruit_hire' && t.count === 1), 'HR is asked to hire');
ok(call('3001', 'recruitHire', { offerId: O1.id }).error === 'missing_fields', 'the employee number is required');
ok(call('3001', 'recruitHire', { offerId: O1.id, empNo: '5002' }).error === 'duplicate_emp_no', 'an employee number in use is refused');
r = call('3001', 'recruitHire', { offerId: O1.id, empNo: '7001' });
ok(r.ok && r.activationCode && r.packagePending && /^SAL-2026-/.test(r.compRef) && r.steps.join() === 'employee,job,package_pending,onboarding', 'hired: employee 7001, job, package pending approval, onboarding plan', r);
const emp = direct(() => B.ctx.readAll_('employees')).find(e => e.id === r.empId);
ok(emp && emp.name === 'أحمد علي' && String(emp.hireDate) === '2026-12-01' && emp.contractType === 'fixed' && String(emp.contractEnd) === '2028-11-30' && String(emp.probationEnd) === '2027-02-28' && emp.managerId === ids['5001'] && String(emp.isSaudi) === 'false',
  'the file: hire 1 Dec, fixed term to 30 Nov 2028, probation to 28 Feb, reports to 5001', emp && { h: emp.hireDate, e: emp.contractEnd, p: emp.probationEnd });
const comp = direct(() => B.ctx.readAll_('compensation')).find(c => c.empId === r.empId);
ok(comp && comp.status === 'pending' && Number(comp.basic) === 5000 && comp.enteredBy === ids['3001'], 'the package waits for payroll (two people)');
ok(call('4001', 'hrCompDecide', { ids: [comp.id], decision: 'approve' }).ok, 'payroll approves the package');
ok(direct(() => B.ctx.readAll_('onboarding')).filter(x => x.empId === r.empId).length === 18, 'the 18-task onboarding plan started');
r = call('3001', 'recruitCandGet', { id: K1.id });
ok(r.candidate.stage === 'hired' && r.candidate.empId && r.requisition.filled === 1 && r.requisition.status === 'approved', 'candidate hired; the requisition has 1 of 2 seats filled');

console.log('Rejection, erasure, board');
ok(call('3001', 'recruitCandStage', { id: K2.id, stage: 'rejected' }).error === 'note_required', 'rejecting needs a reason');
r = call('3001', 'recruitCandStage', { id: K2.id, stage: 'rejected', note: 'لا تنطبق رخصة القيادة' });
ok(r.ok && r.candidate.purgeAfter === '2027-11-05', 'rejected: personal data to be purged after a year', r.candidate.purgeAfter);
r = call('3001', 'recruitCandStage', { id: K2.id, stage: 'erased' });
ok(r.ok && r.candidate.name === '—' && r.candidate.phone === '' && r.candidate.stage === 'erased', 'HR erases the personal data (PDPL)');
ok(call('3001', 'recruitCandStage', { id: K1.id, stage: 'erased' }).error === 'not_found', 'a hired candidate is not erased');
r = call('3001', 'recruitBoard');
ok(r.ok && r.reached.applied === 3 && r.reached.hired === 1 && r.offers.acceptanceRate === 100 && r.requisitions.open === 2 && r.requisitions.openSeats === 2 && r.sources.some(s => s.source === 'jadarat' && s.hired === 1),
  'board: 3 applied, 1 hired, offers 100% accepted, 2 open seats, Jadarat produced the hire', r);
ok(call('5003', 'recruitBoard').error === 'forbidden', 'the board is not for everyone');
ok(call('3001', 'recruitReqClose', { id: Q2.id }).error === 'note_required', 'closing a requisition needs a note');
ok(call('3001', 'recruitReqClose', { id: Q2.id, note: 'تجميد التوظيف' }).requisition.status === 'closed', 'HR closes the Saudi-only requisition');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
