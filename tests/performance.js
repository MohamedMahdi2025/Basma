// HR Phase 4 checks (performance): node tests/performance.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-04T06:00:00Z') });

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
const COMPS = ['safety', 'customer', 'teamwork', 'ownership', 'communication', 'problem_solving'];
const all = (n, extra) => { const o = {}; COMPS.concat(extra || []).forEach(c => { o[c] = n; }); return o; };

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
['5000', '5001', '5002', '5003', '5004', '5005', '5006', '5007'].forEach(no => person(no, 'موظف ' + no, 'employee'));
const dept = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات', headEmpId: '' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5000'], departmentId: dept } });
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], departmentId: dept, managerId: ids['5000'] } });
['5002', '5003', '5004', '5005'].forEach(no => call('3001', 'hrEmpSave', { emp: { id: ids[no], departmentId: dept, managerId: ids['5001'] } }));
['5006', '5007'].forEach(no => call('3001', 'hrEmpSave', { emp: { id: ids[no], departmentId: dept, managerId: ids['5000'] } }));
let r;

console.log('Cycle');
r = call('5002', 'perfCycleSave', { cycle: { year: 2026 } });
ok(!r.ok && r.error === 'forbidden', 'only HR opens a cycle', r);
r = call('3001', 'perfCycleSave', { cycle: { year: 2026, goalsDue: '2026-10-31' } });
ok(r.ok && /^PC-2026-\d{5}$/.test(r.cycle.ref) && r.cycle.kpiWeight === 70 && r.cycle.compWeight === 30 && r.cycle.status === 'setup', 'HR opens the 2026 cycle (70% KPIs, 30% competencies)', r.cycle);
const cy = r.cycle.id;
call('3001', 'perfCycleStage', { id: cy, status: 'goals' });

console.log('KPIs');
const k3 = [{ titleAr: 'تحقيق هدف المبيعات', target: '1,200,000', unit: 'ر.س', weight: 40 }, { titleAr: 'رضا العملاء', target: '90', unit: '%', weight: 30 }, { titleAr: 'تحصيل الذمم', target: '95', unit: '%', weight: 30 }];
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: k3.slice(0, 2) });
ok(!r.ok && r.error === 'kpi_count', 'fewer than 3 KPIs is refused', r);
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: k3.map((k, i) => Object.assign({}, k, { weight: i ? 25 : 40 })) });
ok(!r.ok && r.error === 'kpi_total', 'weights must total 100', r);
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: [{ titleAr: 'a', weight: 60 }, { titleAr: 'b', weight: 20 }, { titleAr: 'c', weight: 20 }] });
ok(!r.ok && r.error === 'kpi_weight', 'no single KPI over 50%', r);
r = call('5003', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: k3 });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot set them', r);
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5001'], kpis: k3 });
ok(!r.ok && r.error === 'cannot_edit_own', 'nobody sets their own KPIs', r);
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: k3 });
ok(r.ok && r.kpis.length === 3 && r.kpis.every(k => /^KPI-2026-\d{5}$/.test(k.ref)), 'the manager sets three weighted KPIs', r.kpis && r.kpis.map(k => k.ref));
const kp = r.kpis;
['5003', '5004', '5005'].forEach(no => call('5001', 'kpiSave', { cycleId: cy, empId: ids[no], kpis: k3 }));
call('5000', 'kpiSave', { cycleId: cy, empId: ids['5001'], kpis: k3 });
r = call('5002', 'myPerformance');
ok(r.ok && r.kpis.length === 3 && r.kpis[0].weight === 40 && !('mgrScore' in r.kpis[0]) && r.competencies.length === 6, 'the employee sees their KPIs and the six competencies', r.kpis && r.kpis[0]);
ok(call('5001', 'myPerformance').competencies.includes('leadership'), 'a manager is also rated on leadership');

console.log('Mid-year');
r = call('5001', 'kpiMid', { kpiId: kp[0].id, midStatus: 'at_risk', midNote: 'السوق بطيء' });
ok(!r.ok && r.error === 'stage_closed', 'mid-year notes wait for the mid-year stage', r);
call('3001', 'perfCycleStage', { id: cy, status: 'midyear' });
r = call('5001', 'kpiMid', { kpiId: kp[0].id, midStatus: 'at_risk', midNote: 'السوق بطيء' });
ok(r.ok && call('5002', 'myPerformance').kpis[0].midStatus === 'at_risk', 'the manager marks a KPI at risk; the employee sees it', r);
r = call('5001', 'kpiSave', { cycleId: cy, empId: ids['5002'], kpis: k3 });
ok(!r.ok && r.error === 'stage_closed', 'KPIs are fixed once goal setting ends', r);

console.log('Review');
call('3001', 'perfCycleStage', { id: cy, status: 'review' });
r = call('5002', 'reviewSelf', { cycleId: cy, kpis: kp.map(k => ({ id: k.id, selfScore: 4 })), comps: {}, submit: true });
ok(!r.ok && r.error === 'incomplete', 'a self-assessment needs every KPI and competency scored', r);
r = call('5002', 'reviewSelf', { cycleId: cy, kpis: kp.map((k, i) => ({ id: k.id, selfScore: 4, actual: ['1,150,000', '92', '97'][i] })), comps: all(4), comment: 'سنة جيدة', submit: true });
ok(r.ok && r.review.stage === 'manager' && /^PE-2026-\d{5}$/.test(r.review.ref), 'the employee submits the self-assessment', r.review);
r = call('5002', 'reviewSelf', { cycleId: cy, kpis: [], comps: all(5), submit: true });
ok(!r.ok && r.error === 'already_submitted', 'and cannot change it afterwards', r);
r = call('5001', 'perfEmp', { empId: ids['5002'] });
ok(r.ok && r.review.selfComps.safety === 4 && r.kpis[0].selfScore === 4 && r.kpis[0].actual === '1,150,000', 'the manager sees the self-assessment', r.review);
r = call('5001', 'reviewManager', { cycleId: cy, empId: ids['5002'], kpis: kp.map((k, i) => ({ id: k.id, mgrScore: [4, 3, 5][i] })), comps: all(3), submit: true });
ok(!r.ok && r.error === 'incomplete', 'the manager must write a comment', r);
r = call('5001', 'reviewManager', { cycleId: cy, empId: ids['5002'], kpis: kp.map((k, i) => ({ id: k.id, mgrScore: [4, 3, 5][i] })), comps: all(3), comment: 'أداء قوي في التحصيل', submit: true });
ok(r.ok && near(r.review.kpiScore, 4) && near(r.review.compScore, 3) && near(r.review.overall, 3.7), 'overall = 70% x KPIs 4.0 + 30% x competencies 3.0 = 3.7', r.review);
r = call('5002', 'myPerformance');
ok(r.review && r.review.overall === undefined && r.review.mgrComment === undefined && r.kpis[0].mgrScore === undefined, 'the employee does not see the manager\'s scores before the cycle closes', r.review);
r = call('5003', 'perfEmp', { empId: ids['5002'] });
ok(!r.ok && r.error === 'forbidden', 'colleagues see nothing', r);

console.log('360');
r = call('3001', 'feedbackLaunch', { cycleId: cy });
ok(r.ok && r.subjects === 2, 'HR launches 360 for everyone who manages people (two here)', r);
const tasks = no => call(no, 'myPerformance').tasks.filter(t => t.subject && t.subject.name === 'موظف 5001');
ok(tasks('5002').length === 1 && tasks('5002')[0].relation === 'report' && tasks('5006')[0].relation === 'peer' && tasks('5000')[0].relation === 'manager' && tasks('5001')[0].relation === 'self',
  'raters: self, the manager, the direct reports and department peers', ['5002', '5006', '5000', '5001'].map(no => tasks(no)[0] && tasks(no)[0].relation));
const give = (no, n, c) => call(no, 'feedbackSubmit', { id: tasks(no)[0].id, answers: all(n, ['leadership']), comment: c });
r = call('5002', 'feedbackSubmit', { id: tasks('5002')[0].id, answers: { safety: 5 } });
ok(!r.ok && r.error === 'incomplete', 'every competency must be rated', r);
ok(give('5002', 4, 'يستمع للفريق').ok, 'a report answers');
give('5003', 4, 'قرارات واضحة'); give('5004', 2, 'يحتاج تفويضا أكثر');
give('5006', 5, 'تعليق زميل أول'); give('5007', 1, 'تعليق زميل ثان');
give('5000', 3, 'ملاحظة المدير'); give('5001', 4, '');
r = call('5001', 'feedbackResults', { cycleId: cy });
ok(!r.ok && r.error === 'stage_closed', 'the subject sees results only when the cycle closes', r);
r = call('3001', 'feedbackResults', { cycleId: cy, subjectId: ids['5001'] });
const txt = JSON.stringify(r);
ok(r.ok && r.groups.report.shown && r.groups.report.n === 3 && near(r.groups.report.avg.safety, 10 / 3), 'three reports answered: shown as a group average', r.groups.report);
ok(!r.groups.peer.shown && r.groups.peer.avg === null && r.groups.peer.n === 2, 'only two peers: hidden, only the count shows', r.groups.peer);
ok(!r.comments.some(c => c.includes('زميل')) && r.comments.length === 4, 'hidden groups\' comments are not shown either', r.comments);
ok(!txt.includes(ids['5002']) && !txt.includes(ids['5006']) && !txt.includes('raterId'), 'no rater is ever named in the results');
r = call('5006', 'feedbackResults', { cycleId: cy, subjectId: ids['5001'] });
ok(!r.ok && r.error === 'forbidden', 'a peer cannot read someone else\'s results', r);

console.log('Calibration and results');
call('3001', 'perfCycleStage', { id: cy, status: 'calibration' });
const rev = call('3001', 'perfOverview', { cycleId: cy }).rows.find(x => x.emp.empNo === '5002').reviewId;
r = call('3001', 'perfCalibrate', { reviewId: rev, finalRating: 5 });
ok(!r.ok && r.error === 'note_required', 'changing the rating needs a reason', r);
r = call('3001', 'perfCalibrate', { reviewId: rev, finalRating: 5, note: 'أفضل نتيجة تحصيل في الإدارة' });
ok(r.ok, 'HR calibrates to 5 with a reason', r);
r = call('3001', 'perfOverview', { cycleId: cy });
ok(r.ok && r.distribution[5] === 1 && r.progress.selfDone === 1 && r.progress.mgrDone === 1 && r.fb360.submitted === 7, 'the overview shows the distribution and progress', { d: r.distribution, p: r.progress, f: r.fb360 });
r = call('5002', 'reviewAck', { reviewId: rev });
ok(!r.ok && r.error === 'stage_closed', 'results are acknowledged only after closing', r);
call('3001', 'perfCycleStage', { id: cy, status: 'closed' });
r = call('5002', 'myPerformance');
ok(r.last && r.last.review.finalRating === 5 && r.last.review.adjusted && r.last.review.mgrComment === 'أداء قوي في التحصيل' && r.last.kpis[0].mgrScore === 4 && r.last.review.calibrationNote === '',
  'closed: the employee sees the final 5 (marked adjusted, the HR note stays internal), the manager comment and KPI scores', r.last && r.last.review);
r = call('5002', 'reviewAck', { reviewId: rev, comment: 'شكرا' });
ok(r.ok && !call('5002', 'reviewAck', { reviewId: rev }).ok, 'the employee acknowledges, once');
r = call('5001', 'feedbackResults', { cycleId: cy });
ok(r.ok && r.groups.self.shown && r.groups.manager.shown && r.groups.report.shown && !r.groups.peer.shown, 'after closing, the subject sees their own 360', r.groups);
r = call('5001', 'myPerformance');
ok(r.my360.length === 1, 'and "ملفي" lists it');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
