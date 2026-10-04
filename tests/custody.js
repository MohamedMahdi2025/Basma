// Assets in custody and offboarding clearance: node tests/custody.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-04T06:00:00Z') });
B.ctx.DEFAULT_SETTINGS.adminSeesPay = false; // these checks prove the strict mode: pay kept apart from administration (the default lets the admin hold payroll)
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('3002', 'محاسب الرواتب', 'employee');
person('3004', 'المدير المالي', 'employee');
person('5001', 'مشرف التوزيع', 'employee');
person('5002', 'سائق التوزيع', 'employee');
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); tok('3002', true);
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3004'], extraRoles: 'payroll' }); tok('3004', true);
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'], hireDate: '2022-01-01', noticeDays: 30 } });
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5002'); e.leaveOpeningDays = 5; e.leaveOpeningDate = '2026-10-31'; B.ctx.update_('employees', e); });
let r;

console.log('Assets and custody');
r = call('5001', 'assetSave', { asset: { type: 'pos', nameAr: 'x' } });
ok(!r.ok && r.error === 'forbidden', 'only HR registers assets', r);
r = call('3001', 'assetSave', { asset: { type: 'vehicle', nameAr: 'شاحنة توزيع أسطوانات', serial: 'ح ك ط 4821', value: 95000 } });
const truck = r.asset;
ok(r.ok && truck.ref === 'AST-001' && truck.status === 'available', 'a delivery truck registered as AST-001', r.asset || r);
r = call('3001', 'assetSave', { asset: { type: 'pos', nameAr: 'جهاز نقاط بيع', serial: 'ح ك ط 4821' } });
ok(!r.ok && r.error === 'duplicate_serial', 'serial numbers are unique', r);
const pos = call('3001', 'assetSave', { asset: { type: 'pos', nameAr: 'جهاز نقاط بيع', serial: 'POS-7731', value: 1800 } }).asset;
ok(call('3001', 'assetAssign', { assetId: truck.id, empId: ids['5002'], condition: 'سليمة، العداد 48,200 كم' }).ok && call('3001', 'assetAssign', { assetId: pos.id, empId: ids['5002'] }).ok, 'truck and POS handed to the driver');
r = call('3001', 'assetAssign', { assetId: pos.id, empId: ids['5001'] });
ok(!r.ok && r.error === 'asset_not_available', 'an asset in custody cannot be handed to a second person', r);
r = call('5002', 'myTasks');
ok(r.tasks.some(t => t.kind === 'asset_ack' && t.count === 2), 'the driver is asked to confirm receipt of 2 items');
r = call('5002', 'assetList');
ok(r.ok && r.mine.length === 2 && !r.rows, 'the driver sees only what they hold', r);
ok(call('5002', 'assetAck', { id: r.mine[0].id }).ok, 'receipt confirmed in the app');
r = call('3001', 'assetList');
ok(r.rows.find(a => a.id === truck.id).holder.emp.empNo === '5002', 'HR sees who holds each asset');

console.log('Resignation opens the clearance');
r = call('5002', 'requestCreate', { request: { type: 'resignation', payload: { lastDay: '2026-12-04' } } });
ok(r.ok, 'the driver resigns with 30 days notice', r.error);
const rq = r.request;
call('5001', 'reqDecide', { id: rq.id, decision: 'approve' });
r = call('3001', 'reqDecide', { id: rq.id, decision: 'approve' });
ok(r.ok && r.request.status === 'approved', 'manager then HR approve', r.error);
r = call('3001', 'clearanceList');
const cl = r.rows[0];
ok(r.ok && r.rows.length === 1 && cl.ref === 'CLR-2026-00001' && cl.lastDay === '2026-12-04' && cl.total === 8, 'a clearance with 8 tasks opened automatically', cl);
ok(cl.tasks.find(t => t.key === 'assets').status === 'open' && cl.tasks.find(t => t.key === 'assets').held === 2, 'assets are open: 2 items still held');
r = call('3001', 'clearanceStart', { empId: ids['5002'], lastDay: '2026-12-04', reason: 'resignation' });
ok(!r.ok && r.error === 'already_exists', 'one clearance per person', r);

console.log('Clearance tasks');
r = call('5002', 'clearanceTask', { id: cl.id, key: 'handover' });
ok(!r.ok && r.error === 'forbidden', 'the leaver cannot tick their own clearance', r);
ok(call('5001', 'clearanceTask', { id: cl.id, key: 'handover', note: 'سلم خط التوزيع لفهد' }).ok, 'the manager confirms the handover');
r = call('5001', 'clearanceTask', { id: cl.id, key: 'gosi' });
ok(!r.ok && r.error === 'forbidden', 'the manager cannot tick HR tasks', r);
r = call('3002', 'clearanceTask', { id: cl.id, key: 'paid' });
ok(!r.ok && r.error === 'clearance_incomplete', 'the settlement cannot be paid before everything else is done', r);
ok(call('3002', 'clearanceTask', { id: cl.id, key: 'settlement' }).ok, 'payroll prepares the settlement');
['access', 'gosi', 'qiwa', 'certificate'].forEach(k => call('3001', 'clearanceTask', { id: cl.id, key: k }));

console.log('Returns and charges');
r = call('3001', 'assetList');
const tc = r.rows.find(a => a.id === truck.id).holder.custodyId, pc = r.rows.find(a => a.id === pos.id).holder.custodyId;
ok(call('3001', 'assetReturn', { id: tc, condition: 'good' }).ok, 'the truck comes back in good condition');
r = call('3001', 'assetReturn', { id: pc, condition: 'lost', charge: 5000 });
ok(!r.ok && r.error === 'charge_over_value', 'a charge cannot exceed the asset value', r);
ok(call('3001', 'assetReturn', { id: pc, condition: 'lost', charge: 1800, note: 'فقد الجهاز' }).ok, 'the POS is lost; HR proposes 1,800 SAR');
r = call('3004', 'assetList');
const td = (r.toDecide || [])[0];
ok(r.ok && !r.rows && r.toDecide.length === 1 && td.id === pc && td.charge === 1800 && td.asset.ref === pos.ref && td.conditionIn === 'فقد الجهاز' && r.canApproveCharge,
  'a payroll holder lists the charges waiting for them', r);
ok(Object.keys(td.emp).sort().join() === 'empNo,id,name' && !('title' in td.emp) && !('department' in td.emp), 'with only the employee name and number', td.emp);
r = call('3001', 'assetList');
ok(r.charges.length === 1 && r.toDecide.length === 0, 'HR sees every proposed charge, but has none to decide (HR is not payroll here)', { c: r.charges.length, t: r.toDecide.length });
r = call('1000', 'assetList');
ok(r.ok && r.rows.length && r.charges.length === 0 && r.toDecide.length === 0, 'an administrator alone sees the assets but no charge amounts', { c: r.charges, t: r.toDecide });
const phone = call('3001', 'assetSave', { asset: { type: 'phone', nameAr: 'جوال عمل', serial: 'PH-1', value: 900 } }).asset;
call('3001', 'assetAssign', { assetId: phone.id, empId: ids['5001'] });
const phc = call('3001', 'assetList').rows.find(a => a.id === phone.id).holder.custodyId;
r = call('1000', 'assetReturn', { id: phc, condition: 'damaged', charge: 300 });
ok(!r.ok && r.error === 'forbidden', 'an administrator alone cannot propose a charge (it becomes a pay deduction)', r);
ok(call('1000', 'assetReturn', { id: phc, condition: 'good' }).ok, 'but can record a return without one');
r = call('3001', 'assetCharge', { id: pc, approve: true });
ok(!r.ok && r.error === 'forbidden', 'HR alone cannot approve the charge', r);
r = call('3004', 'myTasks');
ok(r.tasks.some(t => t.kind === 'asset_charge'), 'the payroll approver sees it in their tasks');
ok(call('3004', 'assetCharge', { id: pc, approve: true }).ok, 'payroll approves: it becomes a deduction');
const adj = direct(() => B.ctx.readAll_('adjustments')).find(a => a.empId === ids['5002'] && a.code === 'other_deduction');
ok(adj && Number(adj.amount) === 1800, 'the deduction is in payroll', adj);
r = call('3001', 'clearanceList');
ok(r.rows[0].tasks.find(t => t.key === 'assets').status === 'done', 'nothing held: assets clear by themselves');

console.log('Settlement paid');
r = call('3002', 'clearanceTask', { id: cl.id, key: 'paid' });
ok(!r.ok && r.error === 'second_approver_required', 'the one who prepared the settlement does not pay it', r);
r = call('3004', 'clearanceTask', { id: cl.id, key: 'paid' });
ok(r.ok && r.clearance.status === 'cleared' && r.clearance.done === 8, 'another payroll person pays: cleared');

console.log('Settlement prepared by HR (a company with one payroll holder)');
r = call('3001', 'clearanceStart', { empId: ids['5001'], lastDay: '2026-12-31', reason: 'contract_end' });
const cl2 = r.clearance;
ok(r.ok && cl2.total === 8, 'HR opens a clearance for the supervisor whose contract ends');
['handover', 'access', 'gosi', 'qiwa', 'certificate'].forEach(k => call('3001', 'clearanceTask', { id: cl2.id, key: k }));
r = call('1000', 'clearanceTask', { id: cl2.id, key: 'settlement' });
ok(!r.ok && r.error === 'forbidden', 'the administrator alone does not prepare a settlement (it is pay)', r);
r = call('3001', 'clearanceTask', { id: cl2.id, key: 'settlement' });
ok(r.ok, 'HR prepares the settlement, like a payroll draft', r);
r = call('3001', 'clearanceTask', { id: cl2.id, key: 'paid' });
ok(!r.ok && r.error === 'forbidden', 'HR cannot pay it');
r = call('3002', 'clearanceTask', { id: cl2.id, key: 'paid' });
ok(r.ok && r.clearance.status === 'cleared', 'a payroll holder, who did not prepare it, pays it: cleared', r.clearance || r);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
