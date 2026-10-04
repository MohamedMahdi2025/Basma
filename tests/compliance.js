// WPS file and tracker, salary reconciliation, compliance calendar, my tasks, delegation: node tests/compliance.js
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
// a valid Saudi IBAN for bank code 80 from 18 account digits
function iban(acct) { const bb = '80' + acct; const n = (bb + '281000').replace(/./g, c => c); let r = 0; for (const ch of n) r = (r * 10 + Number(ch)) % 97; return 'SA' + String(98 - r).padStart(2, '0') + bb; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('3004', 'المدير المالي', 'employee');
person('5001', 'مشرف المبيعات', 'employee');
['5002', '5003', '5004'].forEach(no => person(no, 'موظف ' + no, 'employee'));
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3004'], extraRoles: 'payroll' }); tok('3004', true);
const dept = call('3001', 'hrDeptSave', { dept: { nameAr: 'المبيعات' } }).dept.id;
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], departmentId: dept, hireDate: '2018-01-01', nationality: 'SA', contractNo: 'Q-1' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], departmentId: dept, managerId: ids['5001'], hireDate: '2019-01-01', nationality: 'SA', contractNo: 'Q-2' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], departmentId: dept, hireDate: '2026-10-25', nationality: 'SA' } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], departmentId: dept, hireDate: '2023-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-01-15', contractNo: 'Q-4' } });
const good = iban('000000608010167519'), bad = good.slice(0, -1) + (good.slice(-1) === '9' ? '8' : '9');
direct(() => {
  [['5002', 9000, 2250], ['5003', 5000, 1250], ['5004', 8000, 2000]].forEach((p, i) => B.ctx.append_('compensation', { id: 'C' + i, ref: 'SAL-T' + i, empId: ids[p[0]], effectiveFrom: '2026-01-01', basic: p[1], housing: p[2], transport: 500, otherJson: '{}', currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' }));
  ['5002', '5003'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.leaveOpeningDays = 10; e.leaveOpeningDate = '2026-10-31'; B.ctx.update_('employees', e); });
  B.ctx.append_('empPrivate', { empId: ids['5002'], nationalId: '1000000002', iban: good, gosiNumber: 'G2', updatedAt: '' });
  B.ctx.append_('empPrivate', { empId: ids['5003'], nationalId: '1000000003', iban: bad, updatedAt: '' });
  B.ctx.append_('empPrivate', { empId: ids['5004'], nationalId: '2000000004', iban: good, gosiNumber: 'G4', updatedAt: '' });
});
let r;

console.log('IBAN and ID checks');
ok(B.ctx.ibanOk_(good) && !B.ctx.ibanOk_(bad) && !B.ctx.ibanOk_('SA12') && B.ctx.ibanOk_('SA0380000000608010167519'), 'IBAN mod-97 check (a known valid Saudi IBAN passes, one changed digit fails)');
ok(B.ctx.saIdOk_('1000000002', true) && !B.ctx.saIdOk_('2000000002', true) && B.ctx.saIdOk_('2000000002', false) && !B.ctx.saIdOk_('12345', true), 'national ID starts with 1, iqama with 2, 10 digits');

console.log('Delegation of approvals');
r = call('5002', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-11-15', toDate: '2026-11-16' } });
const lv = r.request;
ok(r.ok && lv.step === 'manager', '5002 asks for leave; it waits for the manager', r.error);
r = call('5003', 'reqDecide', { id: lv.id, decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'a colleague cannot approve', r);
r = call('5003', 'delegationSave', { delegation: { toEmpId: ids['5002'], toDate: '2026-11-20' } });
ok(!r.ok && r.error === 'forbidden', 'someone who manages nobody cannot delegate', r);
r = call('5001', 'delegationSave', { delegation: { toEmpId: ids['5003'], fromDate: '2026-11-04', toDate: '2027-02-01' } });
ok(!r.ok && r.error === 'delegation_too_long', 'a delegation lasts at most 60 days', r);
r = call('5001', 'delegationSave', { delegation: { toEmpId: ids['5003'], fromDate: '2026-11-04', toDate: '2026-11-30', reason: 'حج' } });
const dg = r.delegation;
ok(r.ok && dg.ref === 'DLG-2026-00001' && dg.active, 'the manager delegates approvals to 5003 until 30 Nov', r.error);
r = call('5001', 'delegationSave', { delegation: { toEmpId: ids['5004'], fromDate: '2026-11-10', toDate: '2026-11-12' } });
ok(!r.ok && r.error === 'delegation_overlap', 'no two delegations over the same days', r);
r = call('5003', 'myTasks');
ok(r.ok && r.tasks.some(t => t.kind === 'requests' && t.count === 1) && r.tasks.some(t => t.kind === 'delegated' && t.names[0] === 'مشرف المبيعات'), 'the delegate sees the waiting request and on whose behalf', r.tasks);
r = call('5003', 'reqDecide', { id: lv.id, decision: 'approve' });
ok(r.ok && r.request.step === 'hr', 'the delegate approves the manager step', r.error);
const hist = JSON.parse(direct(() => B.ctx.findBy_('requests', 'id', lv.id)).stepsJson);
ok(hist[0].role === 'delegate' && hist[0].onBehalfOf === ids['5001'], 'the history says "on behalf of" the manager', hist[0]);
r = call('5003', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-11-22', toDate: '2026-11-22' } });
const own = r.request;
r = call('5003', 'reqDecide', { id: own.id, decision: 'approve' });
ok(!r.ok, 'the delegate can never approve their own request', r);
ok(call('5001', 'delegationRevoke', { id: dg.id }).ok, 'the manager revokes the delegation');
r = call('5002', 'requestCreate', { request: { type: 'leave', subtype: 'annual', fromDate: '2026-11-24', toDate: '2026-11-24' } });
r = call('5003', 'reqDecide', { id: r.request.id, decision: 'approve' });
ok(!r.ok && r.error === 'forbidden', 'after revoking, the delegate can no longer approve', r);

console.log('Salary reconciliation (GOSI export)');
ok(call('3002', 'payrollCreate', { month: '2026-10' }).ok, 'October payroll drafted by 3002');
const run = direct(() => B.ctx.readAll_('payrollRuns'))[0];
r = call('3001', 'reconUpload', { source: 'gosi', month: '2026-10', rows: [{ id: '1000000002', wage: 11250 }, { id: '2000000004', wage: 9500 }, { id: '1999999999', wage: 4000 }] });
const rc = r.recon;
ok(r.ok && rc.matched === 1 && rc.mismatches.length === 1 && rc.mismatches[0].diff === -500 && rc.unknown.length === 1 && rc.missing.some(m => m.empNo === '5003'), 'GOSI wage = basic + housing: one match, one 500 SAR short, one unknown ID, one not registered', rc);
r = call('3004', 'payrollApprove', { id: run.id });
ok(!r.ok && r.error === 'recon_open', 'payroll cannot be approved while a mismatch is open', r);
r = call('1000', 'reconList');
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot see wage reconciliations (they carry wages)', r);
r = call('1000', 'reconUpload', { source: 'gosi', month: '2026-10', rows: [{ id: '1000000002', wage: 1 }] });
ok(!r.ok && r.error === 'forbidden', 'nor upload one', r);
r = call('1000', 'reconResolve', { id: rc.id, note: 'x' });
ok(!r.ok && r.error === 'forbidden', 'nor close one', r);
ok(!call('1000', 'myTasks').tasks.some(t => t.kind === 'recon'), 'and the bell does not offer it to the administrator');
r = call('3001', 'reconResolve', { id: rc.id, note: 'x' });
ok(!r.ok && r.error === 'second_approver_required', 'the uploader cannot close their own mismatches', r);
r = call('3002', 'reconResolve', { id: rc.id });
ok(!r.ok && r.error === 'note_required', 'closing needs a note', r);
r = call('3002', 'reconResolve', { id: rc.id, note: 'عدلنا الأجر في التأمينات' });
ok(r.ok && r.recon.status === 'resolved', 'someone else closes it with a note');
r = call('3004', 'payrollApprove', { id: run.id });
ok(r.ok, 'now the payroll is approved');

console.log('WPS (Mudad) file and tracker');
r = call('5002', 'wpsFile', { id: run.id });
ok(!r.ok && r.error === 'forbidden', 'only HR and payroll get the WPS file', r);
r = call('3002', 'wpsFile', { id: run.id });
const w5003 = r.rows.find(x => x.empNo === '5003'), w5002 = r.rows.find(x => x.empNo === '5002');
ok(r.ok && r.rows.length === 3 && r.skipped.length === 1 && r.skipped[0].empNo === '5001' && r.errors === 1 && w5003.problems.includes('bad_iban') && w5002.problems.length === 0, 'the file flags the one bad IBAN; a zero payslip (no package) is left out and listed', r.rows.map(x => [x.empNo, x.problems]));
ok(w5002.bank === 'Al Rajhi Bank' && w5002.basic === 9000 && w5002.housing === 2250 && w5002.idNumber === '1000000002', 'rows carry bank, ID, basic, housing, other, deductions, net');
ok(r.due === '2026-11-10', 'the upload is due on the 10th of the next month (wpsDueDay)', r.due);
r = call('3002', 'wpsStep', { id: run.id, step: 'generated' });
ok(!r.ok && r.error === 'wps_errors', 'a file with errors cannot be marked generated', r);
direct(() => { const p = B.ctx.findBy_('empPrivate', 'empId', ids['5003']); p.iban = good; B.ctx.update_('empPrivate', p); });
r = call('3002', 'wpsStep', { id: run.id, step: 'generated' });
ok(r.ok && r.log.status === 'generated' && r.log.ref === 'WPS-2026-00001', 'fixed: generated and numbered', r.error);
r = call('3002', 'wpsStep', { id: run.id, step: 'uploaded' });
ok(!r.ok && r.error === 'missing_fields', 'uploaded needs the bank or Mudad reference', r);
ok(call('3002', 'wpsStep', { id: run.id, step: 'uploaded', bankRef: 'MUD-778812' }).ok, 'uploaded with a reference');
r = call('3004', 'myTasks');
ok(r.tasks.some(t => t.kind === 'wps' && t.count === 1), 'the other payroll person sees "confirm the WPS upload" in my tasks', r.tasks);
r = call('3002', 'wpsStep', { id: run.id, step: 'confirmed' });
ok(!r.ok && r.error === 'second_approver_required', 'the uploader cannot confirm', r);
r = call('3004', 'wpsStep', { id: run.id, step: 'confirmed' });
ok(r.ok && r.log.status === 'confirmed' && r.log.confirmedBy === 'المدير المالي', 'a second person confirms');

console.log('Compliance calendar');
r = call('5002', 'complianceCalendar');
ok(!r.ok && r.error === 'forbidden', 'an employee has no compliance calendar', r);
r = call('3001', 'complianceCalendar');
const k = kind => r.items.filter(x => x.kind === kind);
ok(r.ok && k('gosi_register').length === 1 && k('gosi_register')[0].emp.empNo === '5003' && k('gosi_register')[0].due === '2026-11-09', 'GOSI registration due 15 days after hire for the one with no GOSI number', k('gosi_register'));
ok(k('qiwa_contract').some(x => x.emp.empNo === '5003') && !k('qiwa_contract').some(x => x.emp.empNo === '5002'), 'a contract not documented in Qiwa is listed');
ok(k('payroll_not_locked').some(x => x.month === '2026-09') && !k('wps_upload').some(x => x.month === '2026-10'), 'months without a locked payroll are listed; October is done', r.items.map(x => x.kind + ':' + (x.month || '')));
ok(k('contract_end').length === 1 && r.items[0].level === 'error', 'expiring dates come in; overdue first');

console.log('My tasks');
r = call('3001', 'myTasks');
ok(r.ok && r.tasks.some(t => t.kind === 'requests'), 'HR sees the leave waiting at the HR step', r.tasks);
r = call('5004', 'myTasks');
ok(r.ok && r.total === 0, 'someone with nothing waiting sees zero');
call('3001', 'policySave', { policy: { titleAr: 'قواعد السلوك', bodyAr: 'نص' } });
r = call('5004', 'myTasks');
ok(r.tasks.some(t => t.kind === 'policies' && t.count === 1 && t.target.tab === 'file'), 'a new policy to acknowledge appears, pointing to my file');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
