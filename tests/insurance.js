// Medical insurance (CCHI): policies, members and dependants, additions/deletions with two people, cost, calendar: node tests/insurance.js
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

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية 1', 'hr');
person('3002', 'الموارد البشرية 2', 'hr');
person('4001', 'محاسب الرواتب', 'employee');
person('5002', 'سائق', 'employee');
person('5003', 'محاسب', 'employee');
person('5004', 'فني جديد', 'employee');
person('6001', 'الرئيس التنفيذي', 'employee');
call('1000', 'hrRolesSave', { id: ids['4001'], extraRoles: 'payroll' });
call('1000', 'hrRolesSave', { id: ids['6001'], extraRoles: 'executive' });
Object.keys(toks).forEach(k => delete toks[k]);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], nationality: 'EG', hireDate: '2025-01-01', gender: 'male' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], nationality: 'SA', hireDate: '2025-01-01' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], nationality: 'IN', hireDate: '2026-08-01' } });
let r;

console.log('Policy');
const PO = { insurer: 'شركة تأمين', policyNo: 'POL-778', fromDate: '2026-01-01', toDate: '2026-12-31', classes: [{ code: 'a', nameAr: 'الفئة أ', premiumEmployee: 7300, premiumDependant: 3650 }, { code: 'B', premiumEmployee: 3650, premiumDependant: 1825 }] };
ok(call('5002', 'insPolicySave', { policy: PO }).error === 'forbidden', 'only HR keeps policies');
ok(call('3001', 'insPolicySave', { policy: Object.assign({}, PO, { insurer: '' }) }).error === 'missing_fields', 'insurer and policy number are required');
ok(call('3001', 'insPolicySave', { policy: Object.assign({}, PO, { toDate: '2025-12-31' }) }).error === 'bad_date', 'the end is after the start');
ok(call('3001', 'insPolicySave', { policy: Object.assign({}, PO, { classes: [{ code: 'A', premiumEmployee: 1 }, { code: 'a', premiumEmployee: 2 }] }) }).error === 'bad_value', 'class codes are unique');
r = call('3001', 'insPolicySave', { policy: PO });
const P1 = r.policy;
ok(r.ok && P1.ref === 'INP-001' && P1.classes.map(c => c.code).join() === 'A,B' && P1.classes[0].premiumEmployee === 7300, 'INP-001 with classes A and B', P1);

console.log('Members and dependants');
ok(call('3001', 'insMemberAdd', { member: { policyId: P1.id, empId: ids['5002'], relation: 'spouse', name: 'زوجة', insClass: 'B' } }).error === 'employee_not_covered', 'no dependant before the employee is covered');
ok(call('3001', 'insMemberAdd', { member: { policyId: P1.id, empId: ids['5002'], relation: 'self', insClass: 'Z' } }).error === 'bad_value', 'the class must exist on the policy');
r = call('3001', 'insMemberAdd', { member: { policyId: P1.id, empId: ids['5002'], relation: 'self', insClass: 'b', idNo: '2412345678' } });
const selfMove = r.move;
ok(r.ok && r.member.status === 'pending_add' && r.member.name === 'سائق' && selfMove.ref === 'INS-2026-00001' && selfMove.premiumDelta === 580, 'the employee is added: 3,650 x 58/365 days = 580 SAR', { m: r.member, mv: selfMove });
ok(call('3001', 'insMemberAdd', { member: { policyId: P1.id, empId: ids['5002'], relation: 'self', insClass: 'B' } }).error === 'already_exists', 'not twice');
ok(call('5002', 'insDependantRequest', { member: { policyId: P1.id, relation: 'self', insClass: 'B' } }).error === 'bad_value', 'the employee adds dependants only');
ok(call('5002', 'insDependantRequest', { member: { policyId: P1.id, relation: 'child', name: 'ابن', birthDate: '2000-01-01', gender: 'male', insClass: 'B' } }).error === 'dependant_over_age', 'a son aged 25 or more is refused');
r = call('5002', 'insDependantRequest', { member: { policyId: P1.id, relation: 'spouse', name: 'زوجة', gender: 'female', birthDate: '1995-03-01', idNo: '2499999999', insClass: 'B' } });
const spMove = r.move;
ok(r.ok && spMove.premiumDelta === 290 && spMove.requestedBy.empNo === '5002', 'the employee asks to add his wife: 1,825 x 58/365 = 290', spMove);
r = call('3001', 'myTasks');
ok(r.tasks.some(t => t.kind === 'insurance_request' && t.count === 1 && t.target.sec === 'insurance') && r.tasks.some(t => t.kind === 'insurance_move' && t.count === 1), 'HR sees the employee request and the addition to send');

console.log('Movements: two people');
ok(call('5002', 'insMoveStep', { id: selfMove.id, step: 'submit' }).error === 'forbidden', 'employees do not move the steps');
ok(call('3001', 'insMoveStep', { id: selfMove.id, step: 'confirm', memberNo: 'X' }).error === 'bad_request', 'not confirmed before it is sent');
ok(call('3001', 'insMoveStep', { id: selfMove.id, step: 'submit', insurerRef: 'BATCH-11' }).move.status === 'submitted', 'HR sends the addition to the insurer');
ok(call('3001', 'insMoveStep', { id: selfMove.id, step: 'confirm', memberNo: 'M-1' }).error === 'second_approver_required', 'the one who requested and sent it cannot confirm it');
ok(call('3002', 'insMoveStep', { id: selfMove.id, step: 'confirm', insurerRef: 'BATCH-11' }).error === 'missing_fields', 'an addition is confirmed only with the insurer\'s member number');
r = call('3002', 'insMoveStep', { id: selfMove.id, step: 'confirm', memberNo: 'M-1001' });
ok(r.ok && r.move.status === 'confirmed', 'the second HR person confirms with member no. M-1001');
ok(call('3002', 'insMoveStep', { id: spMove.id, step: 'reject' }).error === 'note_required', 'rejecting needs a note');
ok(call('3002', 'insMoveStep', { id: spMove.id, step: 'submit' }).ok, 'HR 2 sends the wife\'s addition');
ok(call('3001', 'insMoveStep', { id: spMove.id, step: 'confirm', memberNo: 'M-1002' }).ok, 'HR 1 confirms it (neither requested nor sent it)');
r = call('5002', 'myInsurance');
ok(r.ok && r.members.length === 2 && r.members.every(m => m.status === 'active') && r.members.find(m => m.relation === 'self').premium === 580 && r.members.find(m => m.relation === 'self').memberNo === 'M-1001', 'the employee sees himself and his wife, active, with member numbers', r.members);
ok(call('5003', 'myInsurance').members.length === 0, 'nobody sees other people\'s cover');

console.log('Register and calendar');
ok(call('5003', 'insList').error === 'forbidden', 'the register is for HR and payroll');
r = call('4001', 'insList');
const cov = no => r.coverage.find(c => c.emp.empNo === no);
ok(r.ok && cov('5002').covered && cov('5002').dependants === 1 && !cov('5004').covered && r.rows.find(m => m.relation === 'self').idNo === '2412345678', 'payroll sees 5002 covered with one dependant, 5004 not', r.coverage.length);
r = call('1000', 'insList');
ok(r.ok && r.rows[0].idNo.indexOf('•') >= 0 && r.rows[0].premium === undefined, 'the administrator alone sees masked IDs and no premiums');
r = call('3001', 'complianceCalendar');
ok(r.items.some(x => x.kind === 'insurance_missing' && x.emp.empNo === '5004' && x.due === '2026-08-31') && !r.items.some(x => x.kind === 'insurance_missing' && x.emp.empNo === '5002') && !r.items.some(x => x.kind === 'insurance_missing' && x.emp.empNo === '5003'),
  'the calendar flags 5004 (non-Saudi, uncovered 30 days after hire), not 5002 or the Saudi 5003');
ok(r.items.some(x => x.kind === 'policy_renewal' && x.due === '2026-12-31'), 'and the policy ending on 31 Dec');

console.log('Deletion and cost');
const mem = call('3001', 'insList').rows, self = mem.find(m => m.relation === 'self'), wife = mem.find(m => m.relation === 'spouse');
ok(call('3001', 'insMemberDelete', { memberId: self.id, effective: '2026-11-30', note: 'x' }).error === 'dependants_first', 'the employee is removed only after the dependants');
ok(call('3001', 'insMemberDelete', { memberId: wife.id, effective: '2026-11-30' }).error === 'note_required', 'a deletion needs a reason');
r = call('3001', 'insMemberDelete', { memberId: wife.id, effective: '2026-11-30', note: 'سفر نهائي للزوجة' });
const del = r.move;
ok(r.ok && del.kind === 'delete' && del.premiumDelta === -155, 'deleting the wife from 30 Nov refunds 1,825 x 31/365 = 155', del);
call('3001', 'insMoveStep', { id: del.id, step: 'submit' });
ok(call('3002', 'insMoveStep', { id: del.id, step: 'confirm', insurerRef: 'DEL-9' }).ok, 'confirmed by the other HR person');
ok(call('5003', 'insCost', {}).error === 'forbidden', 'cost is not for everyone');
r = call('6001', 'insCost', { month: '2026-11' });
ok(r.ok && r.totals.members === 1 && r.totals.annual === 3650 && r.totals.month === 405 && r.movements.find(m => m.month === '2026-11').premiumDelta === 715,
  'November cost: 270 for the employee + 135 for the wife to 30 Nov = 405; movements 580 + 290 - 155 = 715', r);
r = call('3001', 'insPolicyList');
ok(r.ok && r.rows[0].members === 1 && r.rows[0].annualPremium === 580 && r.rows[0].byClass.B === 1, 'the policy shows one member in class B', r.rows[0]);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
