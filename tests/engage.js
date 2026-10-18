// Onboarding, pulse survey, policies, development plans: node tests/engage.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
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
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3005', 'الرئيس التنفيذي', 'employee');
person('5001', 'مشرف المبيعات', 'employee');
const staff = ['5002', '5003', '5004', '5005', '5006', '5007'];
staff.forEach(no => person(no, 'موظف ' + no, 'employee'));
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3005'], extraRoles: 'executive' }); tok('3005', true);
const dept = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات' } }).dept.id;
const other = call('3001', 'hrDeptSave', { dept: { nameAr: 'المالية' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], departmentId: dept, hireDate: '2018-01-01', nationality: 'SA' } });
staff.forEach((no, i) => call('3001', 'hrEmpSave', { emp: { id: ids[no], departmentId: i < 5 ? dept : other, managerId: i < 5 ? ids['5001'] : '', hireDate: i === 0 ? '2026-11-02' : '2022-03-01', nationality: 'SA' } }));
let r;

console.log('Onboarding (30-60-90)');
r = call('3001', 'onboardList');
ok(r.ok && r.withoutPlan.some(x => x.emp.empNo === '5002'), 'HR sees a recent hire with no plan yet', r.withoutPlan && r.withoutPlan.map(x => x.emp.empNo));
r = call('5001', 'onboardStart', { empId: ids['5002'] });
ok(!r.ok && r.error === 'forbidden', 'only HR starts a plan', r);
r = call('3001', 'onboardStart', { empId: ids['5002'] });
ok(r.ok && r.count === 18, 'HR starts the plan: 18 tasks from the template', r);
r = call('3001', 'onboardStart', { empId: ids['5002'] });
ok(!r.ok && r.error === 'already_exists', 'one plan per person', r);
r = call('5002', 'onboardList');
const plan = r.plans[0], byKey = k => plan.tasks.find(x => x.key === k);
ok(r.ok && r.plans.length === 1 && plan.day === 2 && plan.total === 18, 'the new hire sees their own plan, day 2', { n: r.plans.length, day: plan && plan.day });
ok(byKey('workspace').dueDate === '2026-10-28' && byKey('d30').dueDate === '2026-12-02' && byKey('probation').dueDate === '2027-01-21', 'due dates follow the hire date; probation review before day 90', [byKey('workspace').dueDate, byKey('d30').dueDate, byKey('probation').dueDate]);
ok(plan.late === 9, 'overdue open tasks are counted (pre-arrival, day one and day two)', plan.late);
ok(byKey('policies').canTick && !byKey('tour').canTick && !byKey('contract').canTick, 'the employee ticks only their own tasks', [byKey('policies').canTick, byKey('tour').canTick]);
r = call('5002', 'onboardTask', { id: byKey('tour').id, status: 'done' });
ok(!r.ok && r.error === 'forbidden', 'the employee cannot tick the manager\'s task', r);
r = call('5002', 'onboardTask', { id: byKey('policies').id, status: 'done' });
ok(r.ok && r.task.status === 'done', 'the employee ticks their own task');
r = call('5001', 'onboardTask', { id: byKey('tour').id, status: 'done', note: 'تمت الجولة' });
ok(r.ok, 'the manager ticks a manager task');
r = call('5001', 'onboardTask', { id: byKey('contract').id, status: 'done' });
ok(!r.ok && r.error === 'forbidden', 'the manager cannot tick an HR task', r);
r = call('5001', 'onboardTask', { id: byKey('buddy').id, status: 'skipped' });
ok(!r.ok && r.error === 'forbidden', 'only HR may skip a task', r);
r = call('3001', 'onboardTask', { id: byKey('workspace').id, status: 'done' });
ok(r.ok, 'HR ticks an IT task on their behalf');
r = call('5001', 'onboardList');
ok(r.ok && r.plans.length === 1 && r.plans[0].done === 3 && !('withoutPlan' in r), 'the manager sees the team plan and its progress, not the HR list', r.plans && r.plans[0].done);
r = call('5006', 'onboardList');
ok(r.ok && r.plans.length === 0, 'someone else sees no plan');

console.log('Pulse survey (anonymous)');
r = call('5002', 'surveySave', {});
ok(!r.ok && r.error === 'forbidden', 'only HR opens a survey', r);
r = call('3001', 'surveySave', { closesAt: '2026-11-18' });
const sid = r.survey && r.survey.id;
ok(r.ok && r.survey.ref === 'SRV-2026-00001' && r.survey.items.length === 6 && r.survey.eligible === 10, 'HR opens a pulse: eNPS and five statements; eligible = active staff', r.survey && { ref: r.survey.ref, e: r.survey.eligible });
r = call('3001', 'surveySave', {});
ok(!r.ok && r.error === 'survey_open', 'one open survey at a time', r);
r = call('5003', 'mySurveys');
ok(r.ok && r.rows.length === 1, 'an employee sees the open survey');
const good = (n, s) => ({ enps: n, engaged: s, belong: s, manager: s, growth: s, tools: s });
r = call('5003', 'surveyAnswer', { id: sid, answers: Object.assign(good(10, 5), { tools: 7 }) });
ok(!r.ok && r.error === 'bad_value', 'answers outside 1-5 (0-10 for eNPS) are refused', r);
const votes = [['5002', 10, 5], ['5003', 9, 4], ['5004', 8, 4], ['5005', 3, 2]];
votes.forEach(([no, n, s]) => call(no, 'surveyAnswer', { id: sid, answers: good(n, s), comment: no === '5005' ? 'نحتاج وضوحا في المسار الوظيفي' : '' }));
r = call('5003', 'surveyAnswer', { id: sid, answers: good(9, 4) });
ok(!r.ok && r.error === 'already_submitted', 'one answer per person', r);
r = call('5003', 'mySurveys');
ok(r.ok && r.rows.length === 0, 'an answered survey leaves my list');
r = call('3001', 'surveyResults');
ok(r.ok && r.responses === 4 && r.overall.hidden === true && !('enps' in r.overall) && r.comments.length === 0, 'four answers: results and comments stay hidden (fewer than 5)', r.overall);
call('5001', 'surveyAnswer', { id: sid, answers: good(6, 3) });
call('5007', 'surveyAnswer', { id: sid, answers: good(10, 5) });
r = call('3005', 'surveyResults');
ok(r.ok && r.responses === 6 && r.rate === 60, 'the executive sees results: 6 of 10 answered', { n: r.responses, rate: r.rate });
ok(r.overall.enps === Math.round((3 - 2) / 6 * 100) && r.overall.promoters === 50, 'eNPS = % promoters (9-10) minus % detractors (0-6)', r.overall);
ok(r.overall.engaged.avg === 3.83 && r.overall.engaged.favorable === 66.7, 'each statement: average and % favourable (4-5)', r.overall.engaged);
const sales = r.departments.find(d => d.department === 'المبيعات'), fin = r.departments.find(d => d.department === 'المالية');
ok(sales && !sales.hidden && sales.n === 5 && fin && fin.hidden && !('enps' in fin), 'a department of 1 answer is hidden; 5 answers are shown', { sales: sales && sales.n, fin });
ok(r.comments.length === 1 && typeof r.comments[0] === 'string', 'comments come as plain text with no name or department');
const stored = direct(() => B.ctx.readAll_('surveyAnswers'));
ok(stored.length === 6 && stored.every(x => !('empId' in x) && !Object.values(x).includes(ids['5005'])), 'stored answers carry no employee id');
const srow = direct(() => B.ctx.findBy_('surveys', 'id', sid)), vl = JSON.parse(srow.votersJson);
ok(vl.length === 6 && vl.join() === vl.slice().sort().join() && !vl.includes(ids['5002']), 'the voter list is sorted keyed hashes (order cannot be matched to answers)');
r = call('5002', 'surveyResults');
ok(!r.ok && r.error === 'forbidden', 'an employee cannot see results', r);
ok(call('3001', 'surveyClose', { id: sid }).ok && call('5006', 'surveyAnswer', { id: sid, answers: good(9, 4) }).error === 'survey_closed', 'a closed survey takes no answers');

console.log('Policies and acknowledgement');
r = call('5001', 'policySave', { policy: { titleAr: 'x', bodyAr: 'y' } });
ok(!r.ok && r.error === 'forbidden', 'only HR writes policies', r);
r = call('3001', 'policySave', { policy: { titleAr: 'سياسة الحضور والانصراف', bodyAr: 'يبدأ الدوام 8:00 ...' } });
const pol = r.policy;
ok(r.ok && pol.ref === 'POL-2026-00001' && pol.version === 1, 'a policy starts at version 1', pol);
r = call('5002', 'policyList');
ok(r.ok && r.pending === 1 && !r.coverage, 'an employee sees one policy to acknowledge (no coverage figures)', r.pending);
r = call('5002', 'policyAck', { id: pol.id, version: 1 });
ok(r.ok, 'the employee acknowledges');
r = call('5002', 'policyAck', { id: pol.id, version: 1 });
ok(r.ok && r.already, 'acknowledging twice is harmless');
r = call('3001', 'policyList');
const cov = r.coverage[0];
ok(cov.acked === 1 && cov.people === 10 && cov.missing.length === 9, 'HR sees coverage and who is missing', { a: cov.acked, p: cov.people });
r = call('3001', 'policySave', { policy: { id: pol.id, titleAr: 'سياسة الحضور والانصراف', bodyAr: 'يبدأ الدوام 7:30 ...' } });
ok(r.ok && r.policy.version === 2, 'changing the text makes version 2', r.policy);
r = call('5002', 'policyList');
ok(r.pending === 1, 'version 2 asks the employee again');
r = call('5002', 'policyAck', { id: pol.id, version: 1 });
ok(!r.ok && r.error === 'policy_changed', 'acknowledging an old version is refused', r);
r = call('3001', 'policySave', { policy: { id: pol.id, titleAr: 'سياسة الحضور والانصراف', bodyAr: 'يبدأ الدوام 7:30 ...' } });
ok(r.policy.version === 2, 'saving without a change keeps the version');

console.log('Development plans and PIP');
const pipBase = { empId: ids['5003'], type: 'pip', startDate: '2026-11-04', endDate: '2026-12-31', reason: 'تأخر متكرر في تسليم تقارير المبيعات الأسبوعية', support: 'متابعة أسبوعية مع المشرف ودورة في إدارة الوقت', goals: [{ title: 'تسليم التقرير الأسبوعي كل أحد', measure: '8 من 8 أسابيع في الموعد' }] };
r = call('5003', 'planSave', { plan: Object.assign({}, pipBase) });
ok(!r.ok && r.error === 'forbidden', 'nobody writes their own plan', r);
r = call('5006', 'planSave', { plan: Object.assign({}, pipBase) });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot write a plan', r);
r = call('5001', 'planSave', { plan: Object.assign({}, pipBase, { endDate: '2026-11-20' }) });
ok(!r.ok && r.error === 'pip_length', 'a PIP runs 30 to 90 days', r);
r = call('5001', 'planSave', { plan: Object.assign({}, pipBase, { goals: [{ title: 'تحسين الأداء' }] }) });
ok(!r.ok && r.error === 'pip_incomplete', 'every PIP goal needs a measure', r);
r = call('5001', 'planSave', { plan: Object.assign({}, pipBase, { support: '' }) });
ok(!r.ok && r.error === 'pip_incomplete', 'a PIP must state the support given', r);
r = call('5001', 'planSave', { plan: Object.assign({}, pipBase) });
const pip = r.plan;
ok(r.ok && pip.ref === 'PIP-2026-00001' && pip.status === 'active' && pip.canManage && !pip.canClose, 'the manager opens a PIP; HR records the outcome', pip && pip.ref);
r = call('5001', 'planSave', { plan: Object.assign({}, pipBase) });
ok(!r.ok && r.error === 'plan_open', 'one open PIP per person', r);
r = call('5003', 'planList');
ok(r.ok && r.rows.length === 1 && r.rows[0].mine && r.rows[0].reason && !r.rows[0].canManage, 'the employee sees their plan and its reason', r.rows[0]);
r = call('5006', 'planList');
ok(r.ok && r.rows.length === 0, 'a colleague sees nothing');
r = call('5003', 'planCheckIn', { id: pip.id, note: 'x' });
ok(!r.ok && r.error === 'forbidden', 'the employee does not record check-ins', r);
r = call('5001', 'planCheckIn', { id: pip.id, note: 'سلم أسبوعين في الموعد', goalStatus: { 0: 'on_track' } });
ok(r.ok && r.plan.checkIns.length === 1 && r.plan.goals[0].status === 'on_track', 'the manager records a check-in with goal status');
r = call('5003', 'planAck', { id: pip.id, comment: 'اطلعت وسألتزم' });
ok(r.ok && r.plan.acknowledgedAt, 'the employee acknowledges the plan');
r = call('5003', 'planAck', { id: pip.id });
ok(!r.ok && r.error === 'already_submitted', 'acknowledged once', r);
r = call('5001', 'planClose', { id: pip.id, outcome: 'met', note: 'x' });
ok(!r.ok && r.error === 'forbidden', 'the manager cannot close it', r);
r = call('3001', 'planClose', { id: pip.id, outcome: 'extended', endDate: '2027-02-15', note: 'تمديد' });
ok(!r.ok && r.error === 'pip_length', 'an extension keeps a PIP within 90 days in total', r);
r = call('3001', 'planClose', { id: pip.id, outcome: 'extended', endDate: '2027-01-31', note: 'تمديد لاستكمال الهدف' });
ok(r.ok && r.plan.status === 'extended' && r.plan.endDate === '2027-01-31', 'HR extends within 90 days');
r = call('3001', 'planClose', { id: pip.id, outcome: 'met', note: 'حقق الهدف 8 من 8' });
ok(r.ok && r.plan.status === 'closed_met', 'HR records the outcome: met');
r = call('5001', 'planCheckIn', { id: pip.id, note: 'late' });
ok(!r.ok && r.error === 'plan_closed', 'a closed plan takes no check-ins', r);
r = call('5001', 'planSave', { plan: { empId: ids['5004'], type: 'idp', endDate: '2027-10-31', goals: [{ title: 'شهادة في إدارة المبيعات' }] } });
ok(r.ok && r.plan.ref === 'IDP-2026-00001', 'a development plan (IDP) needs only goals and an end date');
const aud = direct(() => B.ctx.readAll_('audit')).map(a => a.action);
ok(['onboard_start', 'survey_open', 'policy_save', 'policy_ack', 'pip_start', 'plan_close', 'idp_start'].every(a => aud.includes(a)), 'every step is in the audit trail');


console.log('Exit interview and recognition (Wave 3, 2026-10-18)');
{
  const people = Object.keys(ids);
  const emp = '5001'; // an ordinary employee (3005 is the CEO with the executive role, who may read results)
  const row = direct(() => B.ctx.exitSurveyOpen_(B.ctx.findBy_('employees', 'empNo', emp)));
  ok(row && /^EXS-/.test(row.ref), 'an exit interview opens (EXS number)', row);
  ok(direct(() => B.ctx.exitSurveyOpen_(B.ctx.findBy_('employees', 'empNo', emp))) === null, 'it opens only once per person');
  let x = B.call({ action: 'myExitSurvey', token: tok(emp) });
  ok(x.ok && x.survey && x.survey.areas.length === 5, 'the leaver sees the open survey', x);
  x = B.call({ action: 'exitSurveySubmit', token: tok(emp), answers: { ratings: { manager: 4, pay: 2 }, reason: 'pay', recommend: 6 } });
  ok(!x.ok && x.error === 'missing_fields', 'every area must be rated', x);
  x = B.call({ action: 'exitSurveySubmit', token: tok(emp), answers: { ratings: { manager: 4, pay: 2, growth: 3, workload: 3, culture: 4 }, reason: 'pay', recommend: 6, wouldReturn: true, comment: 'راتب أقل من السوق' } });
  ok(x.ok, 'the leaver submits', x);
  x = B.call({ action: 'exitSurveyResults', token: tok('3001') });
  ok(x.ok && x.hidden === true && x.count === 1 && !x.comments, 'under 5 answers HR sees only the count, nothing else', x);
  x = B.call({ action: 'exitSurveyResults', token: tok(emp) });
  ok(!x.ok && x.error === 'forbidden', 'an employee cannot read the results', x);
  const other = '3005';
  x = B.call({ action: 'kudosSend', token: tok(emp), kudos: { toId: B.ctx.findBy_('employees', 'empNo', emp).id, value: 'teamwork', message: 'x' } });
  ok(!x.ok && x.error === 'cannot_decide_own', 'nobody thanks themselves', x);
  for (let i = 0; i < 5; i++) x = B.call({ action: 'kudosSend', token: tok(emp), kudos: { toId: B.ctx.findBy_('employees', 'empNo', other).id, value: 'safety', message: 'شكرا ' + i } });
  ok(x.ok && x.kudos.value === 'safety', 'thanks are sent with a company value', x);
  x = B.call({ action: 'kudosSend', token: tok(emp), kudos: { toId: B.ctx.findBy_('employees', 'empNo', other).id, value: 'safety', message: 'six' } });
  ok(!x.ok && x.error === 'kudos_daily_limit', 'at most 5 thanks a day', x);
  x = B.call({ action: 'kudosFeed', token: tok(other) });
  ok(x.ok && x.received === 5 && x.feed.length === 5 && !x.people.some(pp => pp.empNo === other), 'the receiver sees 5 thanks; the people list leaves themselves out', { received: x.received });
  x = B.call({ action: 'kudosStats', token: tok('3001') });
  ok(x.ok && x.byValue.safety === 5, 'HR sees thanks by value', x.byValue);
}

console.log('Company feed (design choice: social-feed patterns), 2026-10-18');
{
  const E = no => direct(() => B.ctx.findBy_('employees', 'empNo', no));
  // an announcement for everyone, and one addressed only to the CEO (3005)
  let a = B.call({ action: 'annSave', token: tok('3001'), announcement: { kind: 'general', titleAr: 'إعلان للجميع', bodyAr: 'نص', audience: { all: true } } });
  B.call({ action: 'annPublish', token: tok('3001'), id: a.announcement.id });
  let b = B.call({ action: 'annSave', token: tok('3001'), announcement: { kind: 'general', titleAr: 'إعلان خاص', bodyAr: 'نص', audience: { empIds: [E('3005').id] } } });
  B.call({ action: 'annPublish', token: tok('3001'), id: b.announcement.id });
  // 5001 joined 10 days ago; 3005 started on this day years ago; 3005 is on sick leave today
  direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5001'); e.hireDate = '2026-10-25'; B.ctx.update_('employees', e);
    const c = B.ctx.findBy_('employees', 'empNo', '3005'); c.hireDate = '2019-11-04'; B.ctx.update_('employees', c);
    B.ctx.append_('requests', { id: 'RSICK', ref: 'LV-2026-09901', empId: c.id, type: 'leave', subtype: 'sick', fromDate: '2026-11-03', toDate: '2026-11-05', days: 3, status: 'approved', step: 'done', stepsJson: '[]', payloadJson: '{}', createdAt: '2026-11-03T05:00:00Z', updatedAt: '2026-11-03T05:00:00Z' }); });
  const f1 = B.call({ action: 'feed', token: tok('5001') });
  const titles = f1.ok ? f1.items.filter(x => x.kind === 'announcement').map(x => x.title) : [];
  ok(f1.ok && titles.indexOf('إعلان للجميع') >= 0 && titles.indexOf('إعلان خاص') < 0, 'an employee sees the company announcement, not one addressed to someone else', titles);
  const f3 = B.call({ action: 'feed', token: tok('3005') });
  ok(f3.ok && f3.items.some(x => x.kind === 'announcement' && x.title === 'إعلان خاص'), 'the addressee sees their own announcement');
  ok(f1.items.some(x => x.kind === 'kudos') && f1.items.some(x => x.kind === 'joiner' && x.who && x.who.empNo === '5001') && f1.items.some(x => x.kind === 'anniversary' && x.who && x.who.empNo === '3005' && x.years === 7),
    'thanks, a new joiner and a 7-year anniversary appear as cards', f1.items.map(x => x.kind));
  const away = f1.today.away.map(x => x.empNo);
  ok(away.indexOf('3005') >= 0 && JSON.stringify(f1.today).indexOf('sick') < 0 && JSON.stringify(f1.items).indexOf('sick') < 0, 'away today lists the person but never the kind of leave', f1.today);
  const key = f1.items.find(x => x.kind === 'joiner').key;
  let r = B.call({ action: 'feedReact', token: tok('3001'), key, kind: 'celebrate' });
  ok(r.ok && r.mine === 'celebrate', 'a reaction is recorded', r);
  r = B.call({ action: 'feedReact', token: tok('3001'), key, kind: 'like' });
  let c = B.call({ action: 'feed', token: tok('5001') }).items.find(x => x.key === key);
  ok(r.ok && r.mine === 'like' && c.reactions.like === 1 && !c.reactions.celebrate, 'one reaction per person: a new one replaces the old', c.reactions);
  r = B.call({ action: 'feedReact', token: tok('3001'), key, kind: 'like' });
  c = B.call({ action: 'feed', token: tok('5001') }).items.find(x => x.key === key);
  ok(r.ok && r.mine === '' && !c.reactions.like, 'the same reaction again removes it', c.reactions);
  const secret = f3.items.find(x => x.title === 'إعلان خاص').key;
  r = B.call({ action: 'feedReact', token: tok('5001'), key: secret, kind: 'like' });
  ok(!r.ok && r.error === 'not_found', 'nobody can react to a card they cannot see', r);
  r = B.call({ action: 'feedReact', token: tok('5001'), key: 'x:<script>', kind: 'like' });
  ok(!r.ok && r.error === 'bad_value', 'a malformed key is refused', r);
}
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
