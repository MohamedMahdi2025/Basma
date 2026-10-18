// Training and certificates: catalogue, sessions, requests, enrolment, results, certificates and expiry: node tests/training.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false;
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
const fresh = () => Object.keys(toks).forEach(k => delete toks[k]);

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('5001', 'مشرف المحطة', 'employee');
person('5002', 'سائق 1', 'employee');
person('5003', 'سائق 2', 'employee');
person('5004', 'محاسب', 'employee');
call('1000', 'hrRolesSave', { id: ids['4001'], extraRoles: 'payroll' });
fresh();
['5002', '5003'].forEach(no => call('3001', 'hrEmpSave', { emp: { id: ids[no], managerId: ids['5001'], hireDate: '2025-01-01' } }));
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], hireDate: '2026-10-01' } });
let r;

console.log('Catalogue');
const CR = { titleAr: 'نقل المواد الخطرة والسلامة', titleEn: 'Dangerous goods and safety', provider: 'الدفاع المدني', category: 'safety', hours: 16, validityMonths: 24, costPerPerson: 800, mandatory: { all: true } };
ok(call('5001', 'courseSave', { course: CR }).error === 'forbidden', 'only HR keeps the catalogue');
ok(call('3001', 'courseSave', { course: Object.assign({}, CR, { titleAr: '' }) }).error === 'missing_fields', 'a title is required');
ok(call('3001', 'courseSave', { course: Object.assign({}, CR, { category: 'fun' }) }).error === 'bad_value', 'an unknown category is refused');
ok(call('3001', 'courseSave', { course: Object.assign({}, CR, { validityMonths: 200 }) }).error === 'bad_value', 'validity at most 120 months');
r = call('3001', 'courseSave', { course: CR });
const C1 = r.course;
ok(r.ok && C1.code === 'CRS-001' && C1.validityMonths === 24 && C1.mandatory.all === true && C1.costPerPerson === 800, 'CRS-001, mandatory for everyone, certificate valid 24 months', C1);
r = call('3001', 'courseSave', { course: { titleAr: 'تشغيل الرافعة الشوكية', category: 'technical', hours: 8, validityMonths: 36 } });
ok(r.ok && r.course.code === 'CRS-002', 'CRS-002 forklift, not mandatory');
r = call('5002', 'courseList');
ok(r.ok && r.rows.length === 2 && r.rows[0].costPerPerson === undefined, 'employees read the catalogue without costs');

console.log('Sessions');
ok(call('3001', 'trainSessionSave', { session: { courseId: C1.id, fromDate: '2026-11-11', toDate: '2026-11-10', capacity: 2 } }).error === 'bad_date', 'the end is not before the start');
ok(call('3001', 'trainSessionSave', { session: { courseId: C1.id, fromDate: '2026-11-10', toDate: '2026-11-11', capacity: 0 } }).error === 'bad_value', 'capacity 1-500');
r = call('3001', 'trainSessionSave', { session: { courseId: C1.id, fromDate: '2026-11-10', toDate: '2026-11-11', capacity: 2, location: 'قاعة التدريب', trainer: 'مدرب معتمد', cost: 1600 } });
const S1 = r.session;
ok(r.ok && S1.ref === 'TRS-2026-00001' && S1.left === 2 && S1.status === 'open' && S1.cost === 1600, 'TRS-2026-00001, 2 seats', S1);
r = call('5002', 'trainSessionList');
ok(r.ok && r.rows.length === 1 && r.rows[0].cost === undefined && r.rows[0].mine === '', 'the employee sees the open session, no cost');

console.log('Request and decision');
r = call('5002', 'trainRequest', { sessionId: S1.id, note: 'تجديد الشهادة' });
const E1 = r.id;
ok(r.ok && r.status === 'requested', '5002 asks to join');
ok(call('5002', 'trainRequest', { sessionId: S1.id }).error === 'already_exists', 'not twice');
ok(call('5001', 'myTasks').tasks.some(t => t.kind === 'training_request' && t.count === 1 && t.target.sec === 'training'), 'the manager is asked');
ok(call('5002', 'trainDecide', { id: E1, decision: 'approve' }).error === 'cannot_decide_own', 'nobody approves their own request');
ok(call('5004', 'trainDecide', { id: E1, decision: 'approve' }).error === 'forbidden', 'a colleague cannot decide');
ok(call('5001', 'trainDecide', { id: E1, decision: 'reject' }).error === 'note_required', 'rejecting needs a note');
ok(call('5001', 'trainDecide', { id: E1, decision: 'approve' }).status === 'enrolled', 'the manager approves');
ok(call('5002', 'trainSessionList').rows[0].mine === 'enrolled', 'the employee sees they are enrolled');

console.log('Enrolment by a manager and by HR');
ok(call('5001', 'trainEnrol', { sessionId: S1.id, empIds: [ids['5004']] }).error === 'forbidden', 'a manager enrols only their own people');
ok(call('5004', 'trainEnrol', { sessionId: S1.id, empIds: [ids['5003']] }).error === 'forbidden', 'a non-manager cannot enrol anyone');
ok(call('5001', 'trainEnrol', { sessionId: S1.id, empIds: [ids['5003']] }).enrolled === 1, 'the manager enrols 5003');
ok(call('5001', 'trainEnrol', { sessionId: S1.id, empIds: [ids['5003']] }).error === 'already_exists', 'not twice');
ok(call('3001', 'trainEnrol', { sessionId: S1.id, empIds: [ids['5004']] }).error === 'session_full', 'the session is full');

console.log('Results and certificates');
r = call('3001', 'trainSessionList', { sessionId: S1.id });
const enr = r.enrolments, e2 = enr.find(x => x.emp.empNo === '5002'), e3 = enr.find(x => x.emp.empNo === '5003');
ok(enr.length === 2 && e2.cost === 800, 'HR sees the two enrolments with the cost per person');
ok(call('3001', 'trainMark', { id: e2.id, status: 'passed' }).error === 'bad_date', 'no result before the session starts');
B.setNow(Date.parse('2026-11-12T06:00:00Z')); fresh();
ok(call('3001', 'myTasks').tasks.some(t => t.kind === 'training_mark' && t.count === 1), 'HR is asked to record the results');
ok(call('3001', 'trainMark', { id: e2.id, status: 'passed', score: 120 }).error === 'bad_value', 'scores 0-100');
r = call('3001', 'trainMark', { id: e2.id, status: 'passed', score: 88 });
ok(r.ok && r.enrolment.certNo === 'CRT-2026-00001' && r.enrolment.issuedOn === '2026-11-11' && r.enrolment.expiresOn === '2028-11-11' && r.enrolment.certState === 'valid', 'passed: certificate CRT-2026-00001 valid to 11 Nov 2028', r.enrolment);
r = call('3001', 'trainMark', { id: e3.id, status: 'no_show' });
ok(r.ok && !r.enrolment.certNo, 'a no-show gets no certificate');
r = call('5002', 'myTraining');
ok(r.ok && r.certificates.length === 1 && r.missing.length === 0 && r.hoursThisYear === 16, 'the employee sees the certificate, nothing missing, 16 hours this year', r);
r = call('5003', 'myTraining');
ok(r.missing.length === 1 && r.missing[0].code === 'CRS-001', '5003 still lacks the mandatory course');

console.log('External certificates');
ok(call('3001', 'certRecord', { cert: { empId: ids['3001'], courseId: C1.id, issuedOn: '2025-01-01' } }).error === 'cannot_decide_own', 'HR does not record their own certificate');
ok(call('3001', 'certRecord', { cert: { empId: ids['5003'], issuedOn: '2025-01-01' } }).error === 'missing_fields', 'a course or a title is required');
ok(call('3001', 'certRecord', { cert: { empId: ids['5003'], courseId: C1.id, issuedOn: '2027-01-01' } }).error === 'bad_date', 'not issued in the future');
r = call('3001', 'certRecord', { cert: { empId: ids['5003'], courseId: C1.id, issuedOn: '2024-12-01', certNo: 'CD-55120', provider: 'الدفاع المدني' } });
ok(r.ok && r.enrolment.expiresOn === '2026-12-01' && r.enrolment.certState === 'expiring', 'an earlier certificate for 5003 expires on 1 Dec: expiring', r.enrolment);

console.log('Matrix and calendar');
ok(call('5002', 'trainMatrix').error === 'forbidden', 'the matrix is for HR and managers');
r = call('3001', 'trainMatrix');
const row = no => r.rows.find(x => x.emp.empNo === no), st = no => row(no).courses.find(c => c.code === 'CRS-001').state;
ok(r.ok && st('5002') === 'valid' && st('5003') === 'expiring' && st('5004') === 'missing' && row('5002').cost === 800, 'HR: 5002 valid, 5003 expiring, 5004 missing; cost per person', r.rows.map(x => [x.emp.empNo, x.courses.map(c => c.state).join()]));
const tot = r.totals.find(x => x.code === 'CRS-001');
ok(tot && tot.valid === 1 && tot.expiring === 1 && tot.missing === r.rows.length - 2, 'totals per course', tot);
r = call('5001', 'trainMatrix');
ok(r.ok && r.rows.length === 2 && r.rows.every(x => x.cost === undefined), 'the manager sees their two people, no costs');
r = call('3001', 'complianceCalendar');
const items = r.items;
ok(items.some(x => x.kind === 'cert_expiry' && x.emp.empNo === '5003' && x.due === '2026-12-01' && x.number === 'CD-55120'), 'the calendar shows 5003\'s certificate expiring on 1 Dec');
ok(items.some(x => x.kind === 'training_missing' && x.emp.empNo === '5004' && x.due === '2026-10-31') && !items.some(x => x.kind === 'training_missing' && x.emp.empNo === '5002'), 'and 5004 missing the mandatory course (due 30 days after hire)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
