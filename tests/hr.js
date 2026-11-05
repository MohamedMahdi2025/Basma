// HR Phase 1 checks: node tests/hr.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-04T04:55:00Z'); // Riyadh 2026-10-04 07:55
const B = load({ setupKeyHash: sha('k'), now: T0 });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // these checks prove the strict mode: pay kept apart from administration (the default lets the admin hold payroll)

/** A valid Saudi IBAN for a 20-character BBAN: computes the ISO 13616 check digits. */
function iban(bban) {
  const s = (bban + 'SA00').replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let rem = 0; for (const ch of s) rem = (rem * 10 + Number(ch)) % 97;
  return 'SA' + String(98 - rem).padStart(2, '0') + bban;
}

// People: admin 1000, hr 3001, payroll 3002 (employee + payroll), head 5000, manager 5001, staff 5002 and 5003
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
/** Direct backend access in a test: never through a sign-in's cached copy. */
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const E = no => direct(() => B.ctx.findBy_('employees', 'empNo', no));

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'الرواتب', 'employee');
person('5000', 'رئيس قسم المالية', 'employee');
person('5001', 'مدير الحسابات', 'employee');
person('5002', 'محاسب أول', 'employee');
person('5003', 'محاسب', 'employee');
let r;

console.log('Roles and access helpers');
r = B.call({ action: 'hrRolesSave', token: tok('3001'), id: ids['3002'], extraRoles: 'payroll' });
ok(!r.ok && r.error === 'forbidden', 'HR cannot hand out the payroll role', r);
r = B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll, superuser' });
ok(r.ok, 'admin grants payroll', r);
ok(E('3002').extraRoles === 'payroll', 'only known extra roles are stored', E('3002').extraRoles);
r = B.call({ action: 'me', token: tok('3002') });
ok(!r.ok && r.error === 'session_expired', 'a role change ends the old sessions', r);
tok('3002', true);
ok(B.ctx.hasRole_(E('3002'), 'payroll'), 'extra role payroll is recognised');
ok(!B.ctx.hasRole_(E('5001'), 'payroll'), 'a plain employee has no payroll role');
ok(B.ctx.canSeeSalary_(E('3001'), E('5002')), 'HR can see salaries');
ok(!B.ctx.canSeeSalary_(E('1000'), E('5002')), 'admin without payroll cannot see salaries');
ok(B.ctx.canSeeSalary_(E('5002'), E('5002')), 'an employee sees their own salary');
ok(!B.ctx.canSeeSalary_(E('5001'), E('5002')), 'a manager cannot see a report salary');
r = B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['1000'], extraRoles: 'payroll' });
ok(!r.ok && r.error === 'cannot_change_own_roles' && !B.ctx.hasRole_(E('1000'), 'payroll'), 'nobody grants themselves an extra role, not even the administrator', r);
direct(() => { const a = B.ctx.findBy_('employees', 'empNo', '1000'); a.extraRoles = 'executive'; B.ctx.update_('employees', a); });
r = B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['1000'], extraRoles: '' });
ok(!r.ok && r.error === 'cannot_change_own_roles' && E('1000').extraRoles === 'executive', 'nor removes their own', r);
direct(() => { const a = B.ctx.findBy_('employees', 'empNo', '1000'); a.extraRoles = ''; B.ctx.update_('employees', a); });
ok(B.call({ action: 'auditList', token: tok('1000') }).rows.some(a => a.action === 'roles_update' && a.target === 'الرواتب'), 'granting someone else is still audited');

console.log('Departments and positions');
const hrT = tok('3001');
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الإدارة المالية', nameEn: 'Finance', code: 'FIN', headEmpId: ids['5000'] } });
ok(r.ok && r.dept.id, 'HR creates a department with a head', r);
const finId = r.dept.id;
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الحسابات', parentId: finId } });
ok(r.ok, 'HR creates a sub-department', r);
const accId = r.dept.id;
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { id: finId, nameAr: 'الإدارة المالية', parentId: accId } });
ok(!r.ok && r.error === 'dept_cycle', 'a department cannot sit under its own sub-department', r);
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { id: finId, nameAr: 'الإدارة المالية', parentId: finId } });
ok(!r.ok && r.error === 'dept_cycle', 'nor under itself', r);
r = B.call({ action: 'hrDeptSave', token: hrT, dept: { nameAr: 'الادارة الماليه ' } });
ok(!r.ok && r.error === 'duplicate_name', 'the same name with other alef or taa marbuta forms is a duplicate', r);
r = B.call({ action: 'hrPositionSave', token: hrT, position: { titleAr: 'محاسب', titleEn: 'Accountant', departmentId: accId, grade: 'G5',
  purposeAr: 'تسجيل القيود اليومية ومطابقة الحسابات', dutiesAr: 'إعداد القيود\nمطابقة البنوك', requirementsAr: 'بكالوريوس محاسبة' } });
ok(r.ok && r.position.id, 'HR creates a position with its job description', r);
const accountantPos = r.position.id;
r = B.call({ action: 'hrDeptList', token: tok('5002') });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot list or edit the organisation', r);

console.log('Employee file and access');
const [E5000, E5001, E5002, E5003] = ['5000', '5001', '5002', '5003'].map(n => ids[n]);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5001, departmentId: accId, managerId: E5000, hireDate: '2019-03-01' } });
ok(r.ok, 'HR sets department, manager and hire date', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5002, departmentId: accId, positionId: accountantPos, managerId: E5001, hireDate: '2021-06-15', nationality: 'SA' } });
ok(r.ok, 'HR places an accountant under the accounts manager', r);
ok(E('5002').isSaudi === true && E('5002').title === 'محاسب' && E('5002').department === 'الحسابات', 'nationality SA marks Saudi; attendance title and department follow', E('5002'));
B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, departmentId: accId, positionId: accountantPos, managerId: E5001, hireDate: '2024-01-07', nationality: 'IN' } });
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5001, managerId: E5002 } });
ok(!r.ok && r.error === 'manager_cycle', 'a report cannot become their own manager\'s manager', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5002, managerId: E5002 } });
ok(!r.ok && r.error === 'manager_cycle', 'nobody manages themselves', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, contractType: 'indefinite' } });
ok(!r.ok && r.error === 'expat_contract_fixed', 'a non-Saudi contract cannot be indefinite (Art. 37)', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, contractType: 'محدد المدة', contractEnd: '2026-11-15' } });
ok(r.ok && E('5003').contractType === 'fixed', 'a fixed-term contract is accepted, Arabic label included', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, probationEnd: '2024-08-01' } });
ok(!r.ok && r.error === 'probation_too_long', 'probation longer than 180 days is refused (Art. 53)', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, annualLeaveDays: 15 } });
ok(!r.ok && r.error === 'leave_below_minimum', 'annual leave below 21 days is refused (Art. 109)', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, annualLeaveDays: 30, workDaysPerWeek: 5, dailyHours: 8, occupationCode: '331301', contractNo: 'Q-7788' } });
ok(r.ok, 'Qiwa contract terms are stored', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: E5003, dailyHours: 20 } });
ok(!r.ok && r.error === 'bad_value', 'impossible working hours are refused', r);
const goodIban = iban('80000000608010167519');
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { nationalId: '1012345678', iban: goodIban, nameEnOfficial: 'SENIOR ACCOUNTANT' } });
ok(r.ok, 'HR saves ID, a valid Saudi IBAN and the official English name', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { iban: goodIban.slice(0, -1) + (goodIban.slice(-1) === '9' ? '8' : '9') } });
ok(!r.ok && r.error === 'bad_iban', 'an IBAN with a wrong check digit is refused', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { nationalId: '3012345678' } });
ok(!r.ok && r.error === 'bad_national_id', 'a national ID must start with 1 (Saudi) or 2 (iqama) and have 10 digits', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5003, priv: { nationalId: '1012345678' } });
ok(!r.ok && r.error === 'duplicate_national_id', 'the same national ID cannot belong to two people', r);
B.call({ action: 'hrPrivateSave', token: hrT, empId: E5003, priv: { nationalId: '2123456780', idExpiry: '2026-10-20', passportNo: 'P1234567', passportExpiry: '2027-12-01' } });

const mgrT = tok('5001');
r = B.call({ action: 'hrEmpFile', token: mgrT, id: E5002 });
ok(r.ok && r.file.job.manager.id === E5001 && !('comp' in r.file) && !('priv' in r.file) && !('compHistory' in r.file) && !('documents' in r.file),
  'a manager opens a report file with no salary, private or document keys at all', r.file && Object.keys(r.file));
r = B.call({ action: 'hrEmpFile', token: mgrT, id: E5000 });
ok(!r.ok && r.error === 'forbidden', 'a manager cannot open their own manager file', r);
r = B.call({ action: 'hrEmpFile', token: tok('5003'), id: E5002 });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot open another colleague file', r);
r = B.call({ action: 'hrEmpFile', token: tok('5000'), id: E5003 });
ok(r.ok && r.file.job.head.id === E5000, 'the department head reaches staff two levels down', r.file && r.file.job);
r = B.call({ action: 'hrTeam', token: mgrT });
ok(r.ok && r.rows.length === 2 && r.rows.every(x => x.direct), 'the manager team view lists exactly their two direct reports', r.rows && r.rows.map(x => x.empNo));
r = B.call({ action: 'hrTeam', token: tok('5000') });
ok(r.ok && r.rows.length === 3, 'the department head sees the whole department', r.rows && r.rows.map(x => x.empNo));
r = B.call({ action: 'hrEmpFile', token: hrT, id: E5002 });
ok(r.ok && r.file.priv.iban === goodIban && r.file.jobHistory.length >= 1, 'HR sees private data and job history', r.file && Object.keys(r.file));

console.log('Compensation');
r = B.call({ action: 'hrCompPropose', token: hrT, empId: E5002, effectiveFrom: '2026-10-01', basic: 9000, housing: 2250, transport: 900, other: { 'بدل هاتف': 200 }, reason: 'initial' });
ok(r.ok && r.comp.status === 'pending', 'HR proposes a salary package', r);
const c1 = r.comp.id;
r = B.call({ action: 'hrCompDecide', token: hrT, ids: [c1], decision: 'approve' });
ok(!r.ok && r.error === 'second_approver_required', 'the proposer cannot approve their own proposal', r);
r = B.call({ action: 'hrCompDecide', token: mgrT, ids: [c1], decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'a manager cannot approve salaries', r);
r = B.call({ action: 'hrCompPropose', token: tok('5002'), empId: E5003, effectiveFrom: '2026-10-01', basic: 1 });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot propose salaries', r);
r = B.call({ action: 'hrCompPropose', token: tok('3002'), empId: ids['3002'], effectiveFrom: '2026-10-01', basic: 99999 });
ok(!r.ok && r.error === 'cannot_change_own_salary', 'payroll cannot set their own salary', r);
const payT = tok('3002');
r = B.call({ action: 'hrCompDecide', token: payT, ids: [c1], decision: 'approve' });
ok(r.ok && r.decided === 1, 'payroll approves it', r);
r = B.call({ action: 'hrEmpFile', token: tok('5002'), id: E5002 });
ok(r.ok && r.file.comp.total === 12350 && r.file.comp.other['بدل هاتف'] === 200 && !('compHistory' in r.file), 'the employee sees their own package and total', r.file && r.file.comp);
B.call({ action: 'hrCompPropose', token: payT, empId: E5002, effectiveFrom: '2026-11-01', basic: 9500, housing: 2375, transport: 900, reason: 'raise' });
const c2 = B.call({ action: 'hrCompList', token: hrT, status: 'pending' }).rows[0].id;
B.call({ action: 'hrCompDecide', token: hrT, ids: [c2], decision: 'approve' });
r = B.call({ action: 'hrEmpFile', token: tok('5002'), id: E5002 });
ok(r.file.comp.basic === 9000, 'a raise effective next month does not show as current today', r.file.comp);
r = B.call({ action: 'hrCompPropose', token: hrT, empId: E5002, effectiveFrom: '2026-12-01', basic: -5 });
ok(!r.ok && r.error === 'bad_amount', 'negative or missing basic salary is refused', r);
r = B.call({ action: 'hrCompPropose', token: hrT, empId: E5003, effectiveFrom: '2026-10-01', basic: '٧٬٠٠٠', housing: '1,750' });
ok(r.ok && r.comp.basic === 7000 && r.comp.housing === 1750, 'Arabic digits and thousands separators are read as numbers', r.comp);
const c3 = r.comp.id;
r = B.call({ action: 'hrCompList', token: tok('1000'), status: 'approved' });
ok(!r.ok && r.error === 'forbidden', 'an administrator without payroll cannot list salary packages', r);
r = B.call({ action: 'hrCompDecide', token: tok('1000'), ids: [c3], decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'nor approve one', r);
r = B.call({ action: 'hrCompPropose', token: tok('1000'), empId: E5003, effectiveFrom: '2026-10-01', basic: 8000 });
ok(!r.ok && r.error === 'forbidden', 'nor propose one', r);
ok(!B.call({ action: 'myTasks', token: tok('1000') }).tasks.some(x => x.kind === 'salaries'), 'and the bell offers the administrator no salaries to approve');
// company setting compSelfApprove: HR approves a change they entered themselves (never their own salary)
B.ctx.DEFAULT_SETTINGS.compSelfApprove = true; B.ctx.settingsForget_();
r = B.call({ action: 'hrCompPropose', token: hrT, empId: ids['3002'], effectiveFrom: '2026-12-01', basic: 9100 });
r = B.call({ action: 'hrCompDecide', token: hrT, ids: [r.comp.id], decision: 'approve' });
ok(r.ok && r.decided === 1, 'with HR approves alone on, HR approves the change they entered', r);
r = B.call({ action: 'hrCompPropose', token: hrT, empId: B.call({ action: 'me', token: hrT }).me.id, effectiveFrom: '2026-12-01', basic: 99999 });
ok(!r.ok && r.error === 'cannot_change_own_salary', 'and still never their own salary', r);
B.ctx.DEFAULT_SETTINGS.compSelfApprove = false; B.ctx.settingsForget_();
ok(B.call({ action: 'myTasks', token: payT }).tasks.some(x => x.kind === 'salaries'), 'while payroll sees the waiting package');
r = B.call({ action: 'hrEmpFile', token: tok('1000'), id: E5002 });
ok(r.ok && !('comp' in r.file), 'admin without payroll does not see the salary', r.file && Object.keys(r.file));
r = B.call({ action: 'auditList', token: tok('1000') });
ok(r.rows.some(a => a.action === 'salary_view'), 'salary views by others are audited');

console.log('Documents and expiries');
r = B.call({ action: 'hrDocSave', token: hrT, doc: { empId: E5003, type: 'work_permit', number: 'WP-1', issueDate: '2025-11-01', expiryDate: '2026-11-01' } });
ok(r.ok && r.doc.id, 'HR records a work permit', r);
r = B.call({ action: 'hrDocSave', token: hrT, doc: { empId: E5003, type: 'visa-ish', expiryDate: '2026-11-01' } });
ok(!r.ok && r.error === 'bad_value', 'unknown document types are refused', r);
r = B.call({ action: 'hrDocSave', token: hrT, doc: { empId: E5003, type: 'passport', issueDate: '2026-01-01', expiryDate: '2025-01-01' } });
ok(!r.ok && r.error === 'bad_date', 'an expiry before the issue date is refused', r);
r = B.call({ action: 'hrExpiring', token: hrT, days: 60 });
const kinds = r.rows ? r.rows.map(x => x.kind + ':' + x.empNo) : [];
ok(r.ok && kinds.includes('iqama:5003') && kinds.includes('work_permit:5003') && kinds.includes('contract_end:5003') && !kinds.includes('passport:5003'),
  'the 60-day list has the iqama, work permit and contract end but not a passport due in 14 months', kinds);
ok(r.rows[0].daysLeft === 16 && r.rows[0].kind === 'iqama', 'soonest first, with days left', r.rows[0]);
r = B.call({ action: 'hrDocList', token: tok('5003') });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot list documents', r);
r = B.call({ action: 'myFile', token: tok('5003') });
ok(r.ok && r.file.documents.length === 1 && r.file.priv.passportNo === 'P1234567', 'the employee sees their own documents and passport data');

console.log('Excel import');
const base = { department: 'المبيعات', position: 'مندوب مبيعات', hireDate: 45566, nationality: 'SA', basic: 6000, housing: 1500, transport: 600 };
const rows = [
  Object.assign({}, base, { empNo: '7001', nameAr: 'سلمان العنزي', nationalId: '1098765432', iban: iban('20000001234567891234'), managerEmpNo: '' }),
  Object.assign({}, base, { empNo: '7002', nameAr: 'تركي المطيري', nationalId: 1098765433, managerEmpNo: 7001, hireDate: '15/02/2025' }),
  Object.assign({}, base, { empNo: '7003', nameAr: 'Ahmed Khan', nationality: 'PK', nationalId: '2123456789', managerEmpNo: '7001', hireDate: '2023-09-10',
    contractType: 'محدد', contractEnd: '2027-09-09', passportNo: 'AB998877', passportExpiry: '2028-01-31', occupationCode: '524401' })
];
r = B.call({ action: 'hrImportValidate', token: hrT, rows });
ok(r.ok && r.errors.length === 0 && r.summary.create === 3 && r.summary.departments === 1 && r.summary.positions === 1,
  'a clean file validates, with the new department and position counted', r);
const bad = [
  Object.assign({}, rows[0]),
  Object.assign({}, rows[1], { empNo: '7001' }),
  Object.assign({}, rows[2], { iban: 'SA0000000000000000000000', hireDate: '31/02/2025', managerEmpNo: '9999', basic: 'abc' }),
  Object.assign({}, base, { empNo: '7004', nameAr: '', nationalId: '1098765432' }),
  Object.assign({}, base, { empNo: '7005', nameAr: 'دائري أ', nationalId: '1000000001', managerEmpNo: '7006' }),
  Object.assign({}, base, { empNo: '7006', nameAr: 'دائري ب', nationalId: '1000000002', managerEmpNo: '7005' }),
  Object.assign({}, base, { empNo: '7007', nameAr: 'Expat', nationality: 'EG', nationalId: '2000000003', contractType: 'غير محدد' }),
  Object.assign({}, base, { empNo: '7008', nameAr: 'تجربة', nationalId: '1000000004', hireDate: '2026-01-01', probationEnd: '2026-08-01', annualLeaveDays: 30 }),
  Object.assign({}, base, { empNo: '7009', nameAr: 'إجازة', nationalId: '1000000005', annualLeaveDays: 14 }),
  Object.assign({}, base, { empNo: '7010', nameAr: 'مكرر', nationalId: '1012345678' })
];
r = B.call({ action: 'hrImportValidate', token: hrT, rows: bad });
const has = (row, code) => r.errors.some(e => e.row === row && e.code === code);
ok(has(3, 'duplicate_emp_no'), 'a repeated employee number is reported on its row', r.errors);
ok(has(4, 'bad_iban') && has(4, 'bad_date') && has(4, 'unknown_manager') && has(4, 'bad_amount'), 'bad IBAN, impossible date, unknown manager and bad amount all reported', r.errors.filter(e => e.row === 4));
ok(has(5, 'required') && has(5, 'duplicate_national_id'), 'a missing name and a national ID repeated in the file are reported', r.errors.filter(e => e.row === 5));
ok(has(6, 'manager_cycle') || has(7, 'manager_cycle'), 'two people managing each other is refused', r.errors);
ok(has(8, 'expat_contract_fixed'), 'an indefinite contract for a non-Saudi is refused in the import', r.errors.filter(e => e.row === 8));
ok(has(9, 'probation_too_long') && has(10, 'leave_below_minimum'), 'probation and leave rules apply to the import too', r.errors.filter(e => e.row >= 9));
ok(has(11, 'duplicate_national_id'), 'a national ID that already belongs to another employee is refused', r.errors.filter(e => e.row === 11));
r = B.call({ action: 'hrImportCommit', token: hrT, rows: bad });
ok(!r.ok && r.error === 'import_invalid', 'a file with errors commits nothing', r.error);
ok(!B.call({ action: 'hrDirectory', token: hrT }).rows.some(e => e.empNo === '7001'), 'and nothing was written');
r = B.call({ action: 'hrImportCommit', token: tok('5002'), rows });
ok(!r.ok && r.error === 'forbidden', 'only HR can import', r);
r = B.call({ action: 'hrImportCommit', token: tok('1000'), rows });
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot import salary lines (packages)', r);
ok(!B.call({ action: 'hrDirectory', token: hrT }).rows.some(e => e.empNo === '7001'), 'and nothing was written (the department codes below show no gap either)');
r = B.call({ action: 'hrImportCommit', token: hrT, rows });
ok(r.ok && r.created === 3 && r.pendingSalaries === 3, 'a clean file commits all rows in one go', r);
r = B.call({ action: 'hrDirectory', token: hrT });
const s2 = r.rows.find(e => e.empNo === '7002');
ok(s2 && s2.managerName === 'سلمان العنزي' && s2.hireDate === '2025-02-15' && s2.departmentName === 'المبيعات', 'manager, Arabic names and dd/mm/yyyy dates survive the import', s2);
ok(r.rows.find(e => e.empNo === '7001').hireDate === '2024-10-01', 'Excel serial dates become YYYY-MM-DD');
const k3 = r.rows.find(e => e.empNo === '7003');
ok(k3.contractType === 'fixed' && !k3.isSaudi, 'contract type and nationality come through', k3);
r = B.call({ action: 'hrEmpFile', token: hrT, id: k3.id });
ok(r.file.priv.passportNo === 'AB998877' && r.file.job.occupationCode === '524401', 'passport and occupation code are filed', r.file.priv);
r = B.call({ action: 'hrCompList', token: payT, status: 'pending' });
const imported = r.rows.filter(c => c.reason === 'import');
ok(imported.length === 3, 'imported salaries wait for payroll approval', r.rows.length);
r = B.call({ action: 'hrCompDecide', token: payT, ids: imported.map(c => c.id), decision: 'approve' });
ok(r.ok && r.decided === 3, 'payroll approves the whole import batch at once', r);

console.log('Saudization (Nitaqat weight)');
r = B.call({ action: 'hrDirectory', token: hrT });
ok(r.saudization.headcount === 10 && r.saudization.saudis === 3 && r.saudization.saudiWeighted === 3 && r.saudization.saudiPct === 30,
  'three Saudis at full weight out of ten', r.saudization);
direct(() => { const c = B.ctx.readAll_('compensation').find(x => x.empId === ids['5002'] && x.reason === 'initial'); c.basic = 2500; c.housing = 600; B.ctx.update_('compensation', c); });
r = B.call({ action: 'hrDirectory', token: hrT });
ok(r.saudization.saudiWeighted === 2.5, 'a Saudi on 3,000 to 3,999 counts half', r.saudization);

console.log('Re-import updates in place');
const again = rows.map(x => Object.assign({}, x)).concat([Object.assign({}, base, { empNo: '5002', nameAr: 'محاسب أول', department: 'الحسابات', position: 'محاسب',
  nationalId: '1012345678', hireDate: '2021-06-15', managerEmpNo: '5001', basic: 2500, housing: 600, transport: 900 })]);
again[0].nameEn = 'Salman Alanazi';
const before5000 = JSON.stringify(E('5000'));
r = B.call({ action: 'hrImportCommit', token: hrT, rows: again });
ok(r.ok && r.updated === 4 && r.created === 0 && r.pendingSalaries === 0, 'importing again updates by employee number, with no duplicate salary lines', r);
ok(E('7001').nameEn === 'Salman Alanazi' && E('5002').managerId === ids['5001'] && E('5002').positionId === accountantPos, 'the updates landed on the right rows');
ok(JSON.stringify(E('5000')) === before5000, 'rows in between are written back unchanged');
ok(direct(() => B.ctx.readAll_('departments').length) === 3, 'no department was created twice');

console.log('Guards against self-dealing');
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: ids['3001'], priv: { iban: iban('10000000000000000001') } });
ok(!r.ok && r.error === 'cannot_change_own_bank', 'HR cannot put their own bank account on file', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: ids['3001'], priv: { emergencyPhone: '0500000000' } });
ok(r.ok, 'but can update their other details', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: ids['1000'], priv: { iban: iban('10000000000000000002') } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot change an administrator bank account', r);
r = B.call({ action: 'hrEmpSave', token: hrT, emp: { id: ids['1000'], managerId: E5000 } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot edit an administrator record', r);
r = B.call({ action: 'hrPrivateSave', token: hrT, empId: E5002, priv: { iban: iban('55000000000000000555') } });
r = B.call({ action: 'auditList', token: tok('1000') });
ok(r.rows.some(a => a.action === 'emp_private_update' && /0555/.test(a.detail || '')), 'an IBAN change is audited with old and new last digits', r.rows.filter(a => a.action === 'emp_private_update').map(a => a.detail));
const selfRow = Object.assign({}, base, { empNo: '3001', nameAr: 'الموارد البشرية', nationalId: '1000000009', basic: 50000 });
r = B.call({ action: 'hrImportValidate', token: hrT, rows: [selfRow] });
ok(r.errors.some(e => e.code === 'cannot_import_self'), 'HR cannot import a row for themselves (own salary or bank)', r.errors);
r = B.call({ action: 'hrImportValidate', token: hrT, rows: [Object.assign({}, selfRow, { empNo: '1000', nameAr: 'تغيير' })] });
ok(r.errors.some(e => e.code === 'forbidden_row'), 'nor overwrite an administrator record through the import', r.errors);

console.log('Reference numbers');
{
  const dl = B.call({ action: 'hrDeptList', token: hrT }).rows;
  ok(dl.find(d => d.nameAr === 'الحسابات').code === 'DEP-001', 'a department saved without a code gets DEP-001', dl.map(d => d.code));
  ok(dl.find(d => d.nameAr === 'الإدارة المالية').code === 'FIN', 'a code typed by HR is kept');
  ok(dl.find(d => d.nameAr === 'المبيعات').code === 'DEP-002', 'the import numbers new departments on from there', dl.map(d => d.code));
  const pl = B.call({ action: 'hrPositionList', token: hrT }).rows;
  ok(pl.every(p => /^POS-\d{3}$/.test(p.code)), 'positions get POS-001, POS-002', pl.map(p => p.code));
  const sal = B.call({ action: 'hrCompList', token: hrT, status: 'approved' }).rows.map(c => c.ref);
  ok(sal.length >= 5 && sal.every(x => /^SAL-2026-\d{5}$/.test(x)) && new Set(sal).size === sal.length, 'every salary line has its own SAL-2026-00001 number', sal);
  ok(sal.includes('SAL-2026-00001'), 'numbering starts at 00001 each year');
  const docs = B.call({ action: 'hrDocList', token: hrT }).rows.map(d => d.ref);
  ok(docs.length && docs.every(x => /^DOC-2026-\d{5}$/.test(x)), 'documents are numbered DOC-2026-00001', docs);
  const imp = direct(() => B.ctx.readAll_('compensation').filter(c => c.reason === 'import').map(c => c.batchId));
  ok(imp.length && imp.every(x => /^IMP-2026-\d{5}$/.test(x)), 'an import batch carries one IMP number', imp);
  direct(() => B.ctx.append_('settings', { key: 'refPrefixes', value: '{"document":"HRD"}' }));
  B.ctx.CacheService.getScriptCache().remove('settings:v1');
  r = B.call({ action: 'hrDocSave', token: hrT, doc: { empId: E5003, type: 'other', number: 'X1', expiryDate: '2027-01-01' } });
  ok(r.ok && /^HRD-2026-\d{5}$/.test(r.doc.ref), 'a prefix can be renamed in the settings', r.doc && r.doc.ref);
  // Permanent codes have three digits and grow past 999; they never wrap to 000 and never loop.
  const P = B.ctx.PropertiesService.getScriptProperties();
  P.setProperty('seq:asset', '998');
  let refs = direct(() => B.ctx.nextRefs_('asset', 3, {}));
  ok(refs.join() === 'AST-999,AST-1000,AST-1001', 'after 999 a permanent code grows to four digits: AST-999, AST-1000, AST-1001', refs);
  refs = direct(() => B.ctx.nextRefs_('asset', 2, { 'AST-1002': 1, 'AST-1004': 1 }));
  ok(refs.join() === 'AST-1003,AST-1005' && P.getProperty('seq:asset') === '1005', 'numbers already in the sheet are skipped, a gap stays a gap', refs);
  const all3 = {};
  for (let i = 0; i <= 999; i++) all3['SH-' + String(i).padStart(3, '0')] = 1;
  refs = direct(() => B.ctx.nextRefs_('shift', 1, all3));
  ok(refs.join() === 'SH-1000', 'with every three-digit code taken the next is SH-1000: no 000, no endless loop', refs);
  P.setProperty('seq:payslip:2026', '99999');
  refs = direct(() => B.ctx.nextRefs_('payslip', 2, {}));
  ok(refs.join() === 'PS-2026-100000,PS-2026-100001', 'yearly numbers grow past 99999 the same way', refs);
}

console.log('My file');
r = B.call({ action: 'myFile', token: tok('5002') });
ok(r.ok && r.file.emp.empNo === '5002' && r.file.job.manager.empNo === '5001' && r.file.job.head.empNo === '5000' &&
  r.file.jd.purposeAr.indexOf('القيود') >= 0 && r.file.comp && r.file.isManager === false,
  'the employee sees ID, both managers, JD and salary package', r.file && { job: r.file.job, comp: r.file.comp });
r = B.call({ action: 'myFile', token: mgrT });
ok(r.ok && r.file.isManager === true && r.file.teamCount === 2, 'a manager sees they manage two people', r.file && r.file.teamCount);
r = B.call({ action: 'myFile', token: payT });
ok(r.ok && r.file.roles.payroll === true && r.file.roles.hr === false, 'the file tells the app which consoles to offer', r.file && r.file.roles);


console.log('Custom fields (2026-10-18)');
{
  const c = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
  let x = c('5001', 'customFieldSave', { field: { labelAr: 'x', type: 'text', visibleTo: 'hr' } });
  ok(!x.ok && x.error === 'forbidden', 'only HR defines custom fields', x);
  x = c('3001', 'customFieldSave', { field: { labelAr: 'فصيلة الدم', type: 'select', options: 'A+, O+, B+', visibleTo: 'employee' } });
  const blood = x.field;
  ok(x.ok && blood.options.length === 3 && blood.key === 'cf1', 'a select field with its options (visible to the employee)', x.field || x);
  const lic = c('3001', 'customFieldSave', { field: { labelAr: 'رخصة القيادة', type: 'text', visibleTo: 'manager' } }).field;
  const band = c('3001', 'customFieldSave', { field: { labelAr: 'الدرجة', type: 'text', visibleTo: 'hr' } }).field;
  x = c('3001', 'customValuesSave', { empId: ids['5002'], values: { [blood.id]: 'Z+' } });
  ok(!x.ok && x.error === 'bad_value', 'a select value outside its options is refused', x);
  x = c('3001', 'customValuesSave', { empId: ids['5002'], values: { [blood.id]: 'O+', [lic.id]: 'DL-4471', [band.id]: 'B3' } });
  ok(x.ok && x.changed === 3, 'HR fills three values', x);
  x = c('3001', 'customValuesSave', { empId: ids['3001'], values: { [blood.id]: 'A+' } });
  ok(!x.ok && x.error === 'cannot_decide_own', 'HR never edits their own file', x);
  x = c('5002', 'customValuesGet');
  ok(x.ok && x.fields.length === 1 && x.fields[0].value === 'O+' && !x.canEdit, 'the employee sees only the employee-visible field, read-only', x);
  x = c('5001', 'customValuesGet', { empId: ids['5002'] });
  ok(x.ok && x.fields.length === 2 && !x.fields.some(f => f.id === band.id), 'the manager sees the employee and manager fields, never the HR-only one', x.fields);
  x = c('5003', 'customValuesGet', { empId: ids['5002'] });
  ok(!x.ok && x.error === 'forbidden', 'a colleague cannot read another file', x);
  x = c('5001', 'customValuesAll');
  ok(!x.ok && x.error === 'forbidden', 'only HR reads all values', x);
  x = c('3001', 'customValuesAll');
  ok(x.ok && x.values[ids['5002']] && Object.keys(x.values[ids['5002']]).length === 3 && x.fields.length === 3, 'HR reads every value for the report builder', x.fields && x.fields.length);
}

console.log('Document attachments (2026-10-20; off until the owner approves Google Drive)');
{
  const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no, true) }, extra || {}));
  const files = {}; let n = 0, deleted = [];
  B.ctx.ScriptApp = { getOAuthToken: () => 'tok' };
  B.ctx.Utilities.base64Encode = b => Buffer.from(Uint8Array.from(b, x => x & 255)).toString('base64');
  B.ctx.UrlFetchApp = { fetch: (url, o) => {
    const ok = (body, code) => ({ getResponseCode: () => code || 200, getContentText: () => JSON.stringify(body), getBlob: () => ({ getBytes: () => body.bytes }) });
    if (/uploadType=multipart/.test(url)) { const id = 'D' + (++n); const raw = Buffer.from(Uint8Array.from(o.payload, x => x & 255)); files[id] = raw; return ok({ id }); }
    if (/\/drive\/v3\/files\?fields=id/.test(url)) return ok({ id: 'FOLDER' });
    const m = url.match(/files\/([^?]+)(\?alt=media)?/);
    if (m && o.method === 'delete') { deleted.push(m[1]); return ok({}, 204); }
    if (m && m[2]) return ok({ bytes: Array.from(Buffer.from('%PDF-1.4 scan of the iqama')) });
    return ok({}, 404);
  } };
  const setS = (k, v) => direct(() => { const row = B.ctx.readAll_('settings').find(x => x.key === k); if (row) { row.value = v; B.ctx.update_('settings', row); } else B.ctx.append_('settings', { key: k, value: v }); });
  const doc = call('3001', 'hrDocSave', { doc: { empId: ids['5002'], type: 'iqama', number: '2123456789', expiryDate: '2028-01-01' } }).doc;
  const pdf = Buffer.from('%PDF-1.4 scan of the iqama').toString('base64');
  ok(call('3001', 'docUpload', { docId: doc.id, mime: 'application/pdf', data: pdf }).error === 'attachments_off', 'off by default: nothing is uploaded');
  setS('attachmentsEnabled', 'true'); B.ctx.CacheService.getScriptCache().remove('settings:v1');
  ok(call('5002', 'docUpload', { docId: doc.id, mime: 'application/pdf', data: pdf }).error === 'forbidden', 'only HR attaches scans');
  ok(call('3001', 'docUpload', { docId: doc.id, mime: 'text/html', data: pdf }).error === 'bad_file_type', 'only PDF and images');
  ok(call('3001', 'docUpload', { docId: doc.id, mime: 'image/png', data: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') }).error === 'file_too_big', 'at most 5 MB');
  let r = call('3001', 'docUpload', { docId: doc.id, mime: 'application/pdf', data: pdf });
  ok(r.ok && r.doc.hasFile && /iqama/.test(r.doc.fileName) && files.D1 && files.D1.includes('%PDF-1.4'), 'HR attaches the iqama scan; it lands in the app folder in Drive', r.doc || r);
  ok(call('5002', 'docFile', { docId: doc.id }).ok, 'the employee opens their own scan');
  ok(call('5003', 'docFile', { docId: doc.id }).error === 'not_found', 'a colleague cannot');
  r = call('3001', 'docFile', { docId: doc.id });
  ok(r.ok && Buffer.from(r.data, 'base64').toString().startsWith('%PDF') && r.mime === 'application/pdf', 'HR gets the file content back');
  const views = direct(() => B.ctx.readAll_('audit')).filter(a => a.action === 'doc_view').length;
  ok(views === 2, 'every view is in the audit trail', views);
  r = call('3001', 'docUpload', { docId: doc.id, mime: 'image/jpeg', data: Buffer.from('jpeg').toString('base64') });
  ok(r.ok && deleted.indexOf('D1') >= 0, 'replacing a scan removes the old file from Drive', deleted);
  setS('attachmentsEnabled', 'false'); B.ctx.CacheService.getScriptCache().remove('settings:v1');
}
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
