// Wave 6 (2026-11-06): celebrations, rehire, survey actions, mentoring, skills, calendar feed, mass changes, letter templates,
// quizzes. node tests/wave6.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-06T06:30:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no) { if (toks[no]) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
person('1000', 'المدير', 'admin'); person('3001', 'الموارد البشرية', 'hr'); person('3002', 'الرواتب', 'employee');
person('5001', 'أحمد', 'employee'); person('5002', 'سارة', 'employee'); person('5003', 'خالد', 'employee');
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); toks['3002'] = null;
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], hireDate: '2021-11-20', managerId: ids['5002'] } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], hireDate: '2025-11-10' } });
direct(() => { B.ctx.append_('empPrivate', { empId: ids['5002'], birthDate: '1990-11-15' }); });
let r;

console.log('1. Celebrations');
r = call('5003', 'celebrations');
ok(r.ok && r.rows.some(x => x.kind === 'anniversary' && x.emp.id === ids['5001'] && x.years === 5 && x.milestone), 'Ahmed\'s 5th work anniversary shows, marked as a milestone', r.rows);
ok(!r.rows.some(x => x.kind === 'birthday'), 'no birthday until the person opts in');
call('5002', 'celebOptSave', { showBirthday: true });
r = call('5003', 'celebrations');
const bd = r.rows.find(x => x.kind === 'birthday');
ok(bd && bd.emp.id === ids['5002'] && bd.date === '2026-11-15' && !('birthDate' in bd) && !('age' in bd), 'after opting in: the day only, never the year or age', bd);

console.log('2. Rehire and alumni');
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5003'); e.status = 'terminated'; e.lastWorkingDay = '2026-10-31'; B.ctx.update_('employees', e); });
ok(call('5001', 'alumniList').error === 'forbidden', 'only HR sees the alumni');
r = call('3001', 'alumniSave', { empId: ids['5003'], rehire: 'no' });
ok(r.error === 'reason_required', 'not rehirable needs a reason', r);
ok(call('3001', 'alumniSave', { empId: ids['5003'], rehire: 'no', reason: 'left during probation without notice' }).ok, 'HR records the decision');
r = call('3001', 'rehireCheck', { q: 'خالد' });
ok(r.ok && r.rows.length === 1 && r.rows[0].rehire === 'no', 'a recruiter\'s rehire check finds him and the flag', r.rows);
ok(call('3001', 'alumniSave', { empId: ids['3001'], rehire: 'yes' }).error === 'cannot_decide_own', 'nobody flags themselves');

console.log('3. Survey action plans');
direct(() => B.ctx.append_('surveys', { id: 'SV1', ref: 'SRV-2026-00001', title: 'نبض نوفمبر', status: 'closed' }));
ok(call('5001', 'svActSave', { item: { surveyId: 'SV1', title: 'x', ownerId: ids['5001'], dueDate: '2026-12-01' } }).error === 'forbidden', 'an employee cannot raise survey actions');
r = call('3001', 'svActSave', { item: { surveyId: 'SV1', area: 'workload', title: 'Reduce overtime in operations', ownerId: ids['5002'], dueDate: '2026-12-01' } });
ok(r.ok && r.action.ref === 'SVA-2026-00001', 'HR raises an owned action with a number', r);
const sa = r.action.id;
ok(call('5001', 'svActStep', { id: sa, step: 'done', note: 'x' }).error === 'forbidden', 'only the owner (or HR) marks it done');
ok(call('5002', 'svActStep', { id: sa, step: 'done' }).error === 'note_required', 'done needs what was done');
ok(call('5002', 'svActStep', { id: sa, step: 'done', note: 'Two hires approved' }).ok && call('5001', 'svActList').rows[0].status === 'done', 'the owner closes it and everyone sees the plan');

console.log('4. Mentoring');
call('5002', 'mentorProfileSave', { offer: true, topics: 'Excel, finance, reporting', capacity: 1 });
r = call('5001', 'mentorHub', { q: 'excel' });
ok(r.ok && r.mentors.length === 1 && r.mentors[0].emp.id === ids['5002'], 'a mentee finds a mentor by topic', r.mentors);
r = call('5001', 'mentorRequest', { mentorId: ids['5002'], goal: 'Build monthly reports' });
ok(r.ok && r.status === 'requested', 'and asks for mentoring', r);
ok(call('3001', 'mentorRequest', { mentorId: ids['5002'], goal: 'x' }).error === 'mentor_full', 'a mentor at capacity takes nobody else');
const ms = call('5002', 'mentorHub').mine[0];
ok(call('5001', 'mentorStep', { id: ms.id, step: 'accept' }).error === 'forbidden', 'only the mentor accepts');
ok(call('5002', 'mentorStep', { id: ms.id, step: 'accept' }).ok, 'the mentor accepts');
ok(call('5001', 'mentorStep', { id: ms.id, step: 'session', date: '2026-11-05', notes: 'Pivot tables' }).ok, 'a session is logged');
r = call('3001', 'mentorHub');
const hrView = r.mine.find(x => x.id === ms.id);
ok(hrView && hrView.sessionCount === 1 && hrView.sessions.length === 0 && hrView.goal, 'HR sees that a session happened, not its notes', hrView);

console.log('5. Skills inventory');
ok(call('5001', 'skillSave', { skill: { nameAr: 'إكسل' } }).error === 'forbidden', 'only HR edits the skills library');
const sk = call('3001', 'skillSave', { skill: { nameAr: 'إكسل', nameEn: 'Excel', category: 'tools' } }).id;
const pos = direct(() => { B.ctx.append_('positions', { id: 'JACC', code: 'ACC-1', titleAr: 'محاسب', status: 'active' }); const e = B.ctx.findBy_('employees', 'empNo', '5001'); e.positionId = 'JACC'; B.ctx.update_('employees', e); return 'JACC'; });
ok(call('3001', 'posSkillSave', { positionId: pos, skillId: sk, level: 3 }).ok, 'the accountant position needs Excel at level 3');
ok(call('5001', 'mySkillSave', { skillId: sk, level: 2, evidence: 'Course 2024' }).ok, 'Ahmed records his level');
r = call('3001', 'skillGap');
ok(r.ok && r.rows[0].gaps[0].need === 3 && r.rows[0].gaps[0].has === 2, 'the gap: needs 3, has 2', r.rows);
const es = call('5001', 'skillHub').mine[0].id;
ok(call('5001', 'skillVerify', { id: es }).error === 'cannot_verify_own', 'nobody verifies their own skill');
ok(call('5002', 'skillVerify', { id: es }).ok, 'his manager verifies it');
ok(call('5003', 'skillVerify', { id: es }).ok !== true, 'someone else cannot');

console.log('6. Calendar feed');
r = call('5002', 'calFeedLink');
ok(r.ok && r.token && r.token.length >= 30, 'a private calendar link', r);
direct(() => B.ctx.append_('requests', { id: 'RQ1', ref: 'LV-2026-00009', empId: ids['5001'], type: 'leave', subtype: 'annual', status: 'approved', fromDate: '2026-11-20', toDate: '2026-11-22' }));
const ics = direct(() => B.ctx.calFeedIcs_(r.token));
ok(ics && /BEGIN:VCALENDAR/.test(ics) && /DTSTART;VALUE=DATE:20261120/.test(ics) && /DTEND;VALUE=DATE:20261123/.test(ics), 'the manager\'s calendar shows her person\'s leave (end date exclusive, as iCal wants)', ics);
ok(!/annual/.test(ics), 'without the leave type');
ok(direct(() => B.ctx.calFeedIcs_('wrong-token')) === null, 'a wrong link shows nothing');
const again = call('5002', 'calFeedLink');
ok(direct(() => B.ctx.calFeedIcs_(r.token)) === null && direct(() => B.ctx.calFeedIcs_(again.token)), 'a new link ends the old one');

console.log('7. Mass changes');
direct(() => { ['5001', '5002'].forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + i, empId: ids[no], effectiveFrom: '2026-01-01', basic: 5000, housing: 1250, transport: 500, otherJson: '{}', status: 'approved', currency: 'SAR' })); });
r = call('3001', 'massChange', { kind: 'salary_pct', pct: 10, ids: [ids['5001'], ids['5002'], ids['3001']], effectiveFrom: '2027-01-01', dryRun: true });
ok(r.ok && r.preview.length === 2 && r.preview[0].after === 5500 && r.skipped.some(s => s.why === 'cannot_change_own_salary'), 'a 10% raise previewed: two people, HR\'s own salary skipped', r);
r = call('3001', 'massChange', { kind: 'salary_pct', pct: 10, ids: [ids['5001'], ids['5002']], effectiveFrom: '2027-01-01' });
const pend = direct(() => B.ctx.readAll_('compensation').filter(c => c.status === 'pending'));
ok(r.ok && r.changed === 2 && pend.length === 2 && pend.every(c => c.enteredBy === ids['3001']), 'applied: two pending packages, each still needs the payroll approver', pend.map(c => c.basic));
r = call('3001', 'massChange', { kind: 'manager', value: ids['5002'], ids: [ids['5001'], ids['5002']] });
ok(r.ok && r.changed === 1 && r.skipped.some(s => s.why === 'own_manager'), 'a new manager for many; nobody becomes their own manager', r);

console.log('8. Letter templates');
r = call('3001', 'letterTplSave', { kind: 'salary_certificate', lang: 'ar', body: 'نشهد بأن {name} يعمل لدينا بوظيفة {position} براتب {total} {bonus}' });
ok(r.error === 'unknown_placeholder' && r.detail === 'bonus', 'an unknown placeholder is refused', r);
ok(call('3001', 'letterTplSave', { kind: 'salary_certificate', lang: 'ar', title: 'شهادة راتب', body: 'نشهد بأن {name} يعمل لدينا بوظيفة {position} منذ {hireDate} براتب {total}.' }).version === 1, 'HR saves version 1');
r = call('5001', 'letterTplList');
ok(r.ok && r.templates.length === 1 && r.templates[0].body.indexOf('{name}') > 0 && r.history.length === 0, 'everyone gets the current wording (for printing), only HR the history', r);

console.log('9. Learning quizzes');
const quiz = { title: 'Safety basics', passMark: 50, questions: [{ text: 'Exit?', choices: ['A', 'B'], correct: 1 }, { text: 'Helmet?', choices: ['Yes', 'No'], correct: 0 }] };
ok(call('5001', 'quizSave', { quiz }).error === 'forbidden', 'only HR writes quizzes');
const qz = call('3001', 'quizSave', { quiz }).id;
r = call('5001', 'quizTake', { id: qz });
ok(r.ok && r.quiz.questions.length === 2 && JSON.stringify(r).indexOf('correct') < 0, 'the page never receives the correct answers', r.quiz);
r = call('5001', 'quizSubmit', { id: qz, answers: [0, 1] });
ok(r.ok && r.score === 0 && !r.passed && r.wrong.length === 2, 'a wrong attempt fails', r);
r = call('5001', 'quizSubmit', { id: qz, answers: [1, 0] });
ok(r.ok && r.passed && /^QCRT-2026-\d{5}$/.test(r.certNo), 'a pass gets a certificate number', r);
call('5001', 'quizSubmit', { id: qz, answers: [1, 0] });
ok(call('5001', 'quizSubmit', { id: qz, answers: [1, 0] }).error === 'too_many_attempts', 'three attempts a day at most');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
