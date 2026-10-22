// Pay groups (2026-10-21): node tests/paygroups.js — fixture copied from tests/payroll.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const r2 = n => Math.round(n * 100) / 100;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-11-04T06:00:00Z'); // October is complete
const B = load({ setupKeyHash: sha('k'), now: T0 });

const devs = {}, ids = {}, toks = {};
function tok(no, fresh) {
  if (toks[no] && !fresh) return toks[no];
  const b = B.call({ action: 'authBegin', empNo: no });
  return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token);
}
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no })
    : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role, email: no + '@bestgas.sa' } });
  devs[no] = new Authenticator();
  const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) });
  ids[no] = f.me.id; toks[no] = f.token;
}
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('3004', 'مدير مالي', 'employee');
['5002', '5003', '5004', '5005', '5006'].forEach((no, i) => person(no, 'موظف ' + no, 'employee'));
['3002', '3004'].forEach(no => { B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids[no], extraRoles: 'payroll' }); tok(no, true); });
const job = { '5002': { hireDate: '2019-01-01', nationality: 'SA' }, '5003': { hireDate: '2024-09-01', nationality: 'SA' }, '5004': { hireDate: '2023-01-01', nationality: 'EG', contractType: 'fixed', contractEnd: '2027-12-31' },
  '5005': { hireDate: '2026-10-15', nationality: 'SA' }, '5006': { hireDate: '2025-01-01', nationality: 'SA' } };
Object.keys(job).forEach(no => call('3001', 'hrEmpSave', { emp: Object.assign({ id: ids[no] }, job[no]) }));
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy', bankName: 'الراجحي' } });
call('3001', 'hrPrivateSave', { empId: ids['5003'], priv: { iban: 'SA4420000001234567891234'.replace(/^SA44/, 'SA44'), gosiCohort: 'new' } });
call('3001', 'hrPrivateSave', { empId: ids['5004'], priv: { iban: 'SA0380000000608010167519', nationalId: '2123456789' } });
// they have been in the system since September; 5005 joined on 15 October
direct(() => ['5002', '5003', '5004', '5006', '3001', '3002', '3004', '1000'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-09-01T00:00:00.000Z'; B.ctx.update_('employees', e); }));
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5005'); e.createdAt = '2026-10-15T00:00:00.000Z'; B.ctx.update_('employees', e); });
const pkg = { '5002': [9000, 2250, 900, { 'بدل هاتف': 200 }], '5003': [5000, 1250, 500, {}], '5004': [8000, 2000, 800, {}], '5005': [6000, 1500, 600, {}] };
direct(() => Object.keys(pkg).forEach((no, i) => B.ctx.append_('compensation', { id: 'C' + no, ref: 'SAL-T' + i, empId: ids[no], effectiveFrom: '2026-01-01', basic: pkg[no][0], housing: pkg[no][1], transport: pkg[no][2],
  otherJson: JSON.stringify(pkg[no][3]), currency: 'SAR', reason: 'initial', enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' })));
// October attendance: everyone on every working day (Sun-Thu), except 5003 on 8 October and the leave days
const workdays = []; for (let d = 1; d <= 31; d++) { const ds = '2026-10-' + String(d).padStart(2, '0'); const w = new Date(ds + 'T00:00:00Z').getUTCDay(); if (w <= 4) workdays.push(ds); }
const at = (ds, hm) => new Date(ds + 'T' + hm + ':00+03:00').toISOString();
direct(() => {
  const rows = [];
  ['5002', '5003', '5004', '5005', '5006', '3001', '3002', '3004', '1000'].forEach(no => workdays.forEach(ds => {
    if (no === '5003' && (ds === '2026-10-08' || ds === '2026-10-20' || ds === '2026-10-21')) return;
    if (no === '5005' && ds < '2026-10-15') return;
    ['in', 'out'].forEach(t => rows.push({ id: 'P' + no + ds + t, empId: ids[no], type: t, ts: at(ds, t === 'in' ? '07:55' : '17:05'), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, '07:55') }));
  }));
  B.ctx.appendMany_('punches', rows);
  // approved unpaid leave on 20 and 21 October for 5003, and an approved advance of 3,000 over 3 months from October
  B.ctx.append_('requests', { id: 'RU', ref: 'LV-2026-00001', empId: ids['5003'], type: 'leave', subtype: 'unpaid', fromDate: '2026-10-20', toDate: '2026-10-21', days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-10-01T00:00:00Z', updatedAt: '', decidedAt: '2026-10-02T00:00:00Z' });
  B.ctx.append_('requests', { id: 'RA', ref: 'AD-2026-00001', empId: ids['5003'], type: 'advance', subtype: '', fromDate: '', toDate: '', days: '', amount: 3000, months: 3, payloadJson: JSON.stringify({ startMonth: '2026-10', installment: 1000 }), reason: '', docNo: '', status: 'approved', step: 'done', stepsJson: '[]', effectJson: '{}', createdAt: '2026-09-20T00:00:00Z', updatedAt: '', decidedAt: '2026-09-21T00:00:00Z' });
});
direct(() => B.ctx.append_('settings', { key: 'deductAbsence', value: 'true' }));
B.ctx.CacheService.getScriptCache().remove('settings:v1');
let r;
const slipOf = (runId, no) => (call('3002', 'payrollGet', { id: runId }).slips || []).find(s => s.empId === ids[no]);

console.log('Groups and who may run them');
r = call('3002', 'payGroupSave', { group: { nameAr: 'الإدارة العليا', managers: [ids['3004']] } });
ok(r.error === 'needs_two_managers', 'a closed group needs two payroll people (four eyes), the editor among them', r);
r = call('3002', 'payGroupSave', { group: { nameAr: 'الإدارة العليا', nameEn: 'Executives', payDay: 25, managers: [ids['3002'], ids['3004']] } });
ok(r.ok && /^PGR-/.test(r.group.code), 'payroll creates a closed group for executive pay', r);
const exec = r.group.id;
r = call('3001', 'payGroupSave', { group: { nameAr: 'العمالة', nameEn: 'Labour', payDay: 27, cutoffDay: 25 } });
ok(r.ok && r.group.cutoffDay === 25, 'HR creates an open group whose attendance closes on the 25th', r);
const lab = r.group.id;
ok(call('3001', 'payGroupSave', { id: exec, group: { nameAr: 'x', managers: [] } }).error === 'forbidden', 'only a closed group\'s own managers may change it');
ok(call('3001', 'payGroupAssign', { groupId: exec, empIds: [ids['5002']] }).error === 'forbidden', 'and only they move people into it');
ok(call('3002', 'payGroupAssign', { groupId: exec, empIds: [ids['5002']] }).moved === 1 && call('3001', 'payGroupAssign', { groupId: lab, empIds: [ids['5003']] }).moved === 1, 'people are placed in their groups');
let gl = call('3001', 'payGroupList', {});
ok(gl.emps.find(e => e.id === ids['5002']).name === '' && gl.emps.find(e => e.id === ids['5002']).locked && gl.groups.find(g => g.id === exec).access === false, 'HR sees that someone is in the closed group, never who', gl.emps.find(e => e.id === ids['5002']));
ok(call('3002', 'payGroupSave', { id: exec, stop: true }).error === 'group_not_empty', 'a group with people in it cannot be stopped');

console.log('One run per group, one payslip per person');
const gen = call('3001', 'payrollCreate', { month: '2026-10' });
ok(gen.ok && gen.run.payGroupId === '', 'the general group\'s October run', gen);
ok(call('3001', 'payrollCreate', { month: '2026-10' }).error === 'run_exists', 'one run per group per month');
ok(call('3001', 'payrollCreate', { month: '2026-10', payGroupId: exec }).error === 'forbidden', 'HR cannot run the closed group');
const ex = call('3002', 'payrollCreate', { month: '2026-10', payGroupId: exec });
const lb = call('3001', 'payrollCreate', { month: '2026-10', payGroupId: lab });
ok(ex.ok && lb.ok && ex.run.totals.headcount === 1 && lb.run.totals.headcount === 1, 'the executive and labour runs hold just their own people', [ex.run && ex.run.totals.headcount, lb.run && lb.run.totals.headcount]);
const gsl = call('3001', 'payrollGet', { id: gen.run.id }).slips;
ok(!gsl.some(s => s.empId === ids['5002'] || s.empId === ids['5003']), 'and the general run leaves them out');
ok(call('3001', 'payrollGet', { id: ex.run.id }).error === 'forbidden' && !call('3001', 'payrollList', {}).rows.some(x => x.id === ex.run.id), 'HR can neither open nor even list the executive run');
ok(call('3001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-10', code: 'bonus', amount: 100, reason: 'x' } }).error === 'forbidden', 'nor add a bonus to an executive');
ok(call('3004', 'payrollList', {}).rows.some(x => x.id === ex.run.id && x.payGroupName === 'الإدارة العليا'), 'its managers see it, named by group');

console.log('Attendance cut-off');
const s5003 = slipOf(lb.run.id, '5003'), s5004 = slipOf(gen.run.id, '5004');
ok(s5003.info.attFrom === '2026-09-26' && s5003.info.attTo === '2026-10-25', 'labour attendance runs 26 September to 25 October', s5003.info);
ok(s5004.info.attFrom === '2026-10-01' && s5004.info.attTo === '2026-10-31', 'the general group keeps the calendar month', s5004.info);
ok(s5003.absentDays === 5, 'absences are those of the window: 27-30 September (no record, Sun-Wed) and 8 October; 20-21 October are leave', s5003.absentDays);
ok(call('3004', 'payrollApprove', { id: ex.run.id }).ok && call('3004', 'payrollApprove', { id: lb.run.id }).ok && call('3004', 'payrollApprove', { id: gen.run.id }).ok, 'each run is approved by a second payroll person');

console.log('Moves between groups never pay or count twice');
call('3002', 'payGroupAssign', { groupId: '', empIds: [ids['5002']] });
call('3001', 'payGroupAssign', { groupId: lab, empIds: [ids['5004']] });
B.setNow(Date.parse('2026-12-02T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
const lbN = call('3001', 'payrollCreate', { month: '2026-11', payGroupId: lab });
const n4 = slipOf(lbN.run.id, '5004'), n3 = slipOf(lbN.run.id, '5003');
ok(n3.info.attFrom === '2026-10-26' && n3.info.attTo === '2026-11-25', 'November labour: 26 October to 25 November', n3.info);
ok(n4.info.attFrom === '2026-11-01', 'someone moved in from the general group starts after their last counted day (31 October), never twice', n4.info);
const ok2 = call('3001', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-10', code: 'bonus', amount: 100, reason: 'y' } });
ok(ok2.error === 'month_locked', 'October stays closed for someone who moved after their run was locked', ok2);

console.log('Company-wide views add up every group');
const d = call('3001', 'dashboard', { from: '2026-10-01', to: '2026-10-31' });
const oct = (d.cost && d.cost.trend || []).find(x => x.month === '2026-10');
const want = [gen, ex, lb].reduce((a, x) => a + x.run.totals.headcount, 0);
ok(oct && oct.headcount === want, 'the dashboard\'s October payroll counts all three groups', { oct, want });

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
