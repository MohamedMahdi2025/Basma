// Leave financial clearance (2026-11-25): node tests/leave-clearance.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const r2 = n => Math.round(n * 100) / 100;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-11-10T06:00:00Z');
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
const setS = (k, v) => direct(() => { const row = B.ctx.readAll_('settings').find(x => x.key === k); if (row) { row.value = v; B.ctx.update_('settings', row); } else B.ctx.append_('settings', { key: k, value: v }); });

// ---- leave financial clearance (2026-11-25) ----
['5002', '5003'].forEach((no, i) => person(no, 'موظف ' + no, 'employee'));
['3002', '3004'].forEach(no => { B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids[no], extraRoles: 'payroll' }); tok(no, true); });
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], hireDate: '2019-01-01', nationality: 'SA', isSaudi: true } });
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], hireDate: '2024-01-01', nationality: 'EG' } });
call('3001', 'hrPrivateSave', { empId: ids['5002'], priv: { iban: 'SA0380000000608010167519', nationalId: '1012345678', gosiCohort: 'legacy' } });
setS('deductAbsence', 'false');
direct(() => {
  ['5002', '5003', '3001', '3002', '3004', '1000'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-01-01T00:00:00.000Z'; B.ctx.update_('employees', e); });
  B.ctx.append_('compensation', { id: 'C1', ref: 'SAL-1', empId: ids['5002'], effectiveFrom: '2026-01-01', basic: 9000, housing: 2250, transport: 900, otherJson: JSON.stringify({ 'بدل هاتف': 200 }), currency: 'SAR', reason: 'x',
    enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' });
  B.ctx.append_('compensation', { id: 'C2', ref: 'SAL-2', empId: ids['5003'], effectiveFrom: '2026-01-01', basic: 5000, housing: 1250, transport: 500, otherJson: '{}', currency: 'SAR', reason: 'x',
    enteredBy: ids['3001'], approvedBy: ids['3002'], approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' });
  // 30 days of approved annual leave, 16 November to 15 December; an opening balance of 40 days
  const e = B.ctx.findBy_('employees', 'empNo', '5002'); e.leaveOpeningDays = 40; e.leaveOpeningDate = '2026-01-01'; B.ctx.update_('employees', e);
  B.ctx.append_('requests', { id: 'RL', ref: 'LV-2026-00077', empId: ids['5002'], type: 'leave', subtype: 'annual', fromDate: '2026-11-16', toDate: '2026-12-15', days: 30, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', createdAt: '2026-11-01T00:00:00Z' });
  B.ctx.append_('requests', { id: 'RP', ref: 'LV-2026-00078', empId: ids['5002'], type: 'leave', subtype: 'unpaid', fromDate: '2026-12-20', toDate: '2026-12-21', days: 2, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'pending', createdAt: '2026-11-01T00:00:00Z' });
});
ok(call('3002', 'payrollAdjSave', { adj: { empId: ids['5002'], month: '2026-11', code: 'bonus', amount: 500, reason: 'مكافأة', docRef: 'MEMO-1' } }).ok, 'a November bonus is entered before the leave');

console.log('The quote');
let q = call('3001', 'leaveClearanceQuote', { leaveId: 'RL' });
ok(q.ok, 'HR asks for the clearance of an approved annual leave', q.error);
q = q.quote || {};
const L = code => (q.lines || []).filter(l => l.code === code).reduce((t, l) => t + l.amount, 0);
ok(q.workedDays === 15 && near(L('basic'), 4500) && near(L('housing'), 1125), 'the days worked this month: 1 to 15 November (15 days of basic and housing)', { days: q.workedDays, basic: L('basic') });
ok(q.leavePayDays === 30 && near(L('leave_pay'), 12350), 'the 30 leave days are paid in advance at the full wage (12,350)', { d: q.leavePayDays, pay: L('leave_pay') });
ok(near(L('bonus'), 500), 'the bonus entered for this month is in the clearance');
ok(near(L('gosi'), r2(11250 * 0.0975 * 15 / 30) + r2(11250 * 0.0975), 0.05), 'GOSI on the worked days and on the leave days', L('gosi'));
ok(q.eos === 'untouched' && !(q.lines || []).some(l => /eos|end_of_service/.test(l.code)), 'end of service is not touched');
ok(q.balanceBefore >= 30 && near(q.balanceAfter, q.balanceBefore - 30), 'the balance before and after the leave', [q.balanceBefore, q.balanceAfter]);
ok(near(q.gross, L('basic') + L('housing') + L('transport') + L('allowance') + L('leave_pay') + L('bonus')) && near(q.net, q.gross - q.deductions), 'gross and net add up', q);
ok(call('5003', 'leaveClearanceQuote', { leaveId: 'RL' }).error === 'forbidden', 'an employee cannot see it');
ok(call('3001', 'leaveClearanceQuote', { leaveId: 'RP' }).error === 'not_found', 'only annual leave has a clearance');

console.log('Two people, never one\'s own');
let c = call('3001', 'leaveClearanceSave', { leaveId: 'RL' });
ok(c.ok && c.clearance.status === 'draft' && /^VCL-2026-\d{5}$/.test(c.clearance.ref), 'HR prepares it as a draft', c.error || c.clearance);
const cid = c.clearance.id;
ok(call('3001', 'leaveClearanceStep', { id: cid, op: 'approve' }).error === 'forbidden', 'HR alone cannot approve');
direct(() => B.ctx.append_('requests', { id: 'RS', ref: 'LV-2026-00079', empId: ids['3002'], type: 'leave', subtype: 'annual', fromDate: '2026-11-20', toDate: '2026-11-25', days: 4, amount: '', months: '', payloadJson: '{}', reason: '', docNo: '', status: 'approved', createdAt: '2026-11-01T00:00:00Z' }));
ok(call('3002', 'leaveClearanceSave', { leaveId: 'RS' }).error === 'cannot_change_own_salary', 'nobody prepares their own clearance');
ok(call('3002', 'leaveClearanceStep', { id: cid, op: 'paid', paidRef: 'x' }).error === 'not_found', 'it cannot be paid before approval');
c = call('3002', 'leaveClearanceStep', { id: cid, op: 'approve' });
ok(c.ok && c.clearance.status === 'approved' && c.clearance.approvedBy === 'محاسب الرواتب', 'another payroll holder approves it', c.error);
direct(() => {});
ok(B.ctx.readAll_('adjustments').filter(a => a.empId === ids['5002'] && a.month === '2026-11').every(a => a.clearanceRef === c.clearance.ref), 'the bonus it paid is marked with its ref');
ok(call('3002', 'leaveClearanceSave', { leaveId: 'RL' }).error === 'already_exists', 'one clearance per leave');
ok(call('3004', 'leaveClearanceStep', { id: cid, op: 'paid' }).error === 'missing_fields', 'paying needs the bank reference');
ok(call('3004', 'leaveClearanceStep', { id: cid, op: 'paid', paidRef: 'TRF-889', paidOn: '2026-11-12' }).clearance.status === 'paid', 'payment is recorded with its reference');
const list = call('3002', 'leaveClearanceList', {});
ok(list.ok && list.leaves.some(l => l.id === 'RL' && l.clearance && l.clearance.status === 'paid') && list.rows.length === 1, 'the list shows the leave with its clearance', list.error);

console.log('The regular runs never pay those days again');
B.setNow(Date.parse('2026-12-05T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
let run = call('3001', 'payrollCreate', { month: '2026-11' });
let g = call('3002', 'payrollGet', { id: run.run.id });
ok(run.ok && !g.slips.some(s => s.empId === ids['5002']) && g.slips.some(s => s.empId === ids['5003']), 'November: the person on leave is not paid again; others are', g.slips && g.slips.map(s => s.emp && s.emp.empNo));
ok(!g.slips.some(s => (s.lines || []).some(l => l.code === 'bonus')), 'the bonus is not paid twice');
const pp = call('3001', 'payrollPrep', { id: run.run.id });
ok(!pp.ok || !pp.steps.find(x => x.key === 'leavers').rows.some(r => r.empId === ids['5002'] && r.why === 'not_in_run'), 'the wizard does not call them a leaver');
call('3001', 'payrollDelete', { id: run.run.id });
B.setNow(Date.parse('2027-01-05T06:00:00Z')); Object.keys(toks).forEach(k => delete toks[k]);
run = call('3001', 'payrollCreate', { month: '2026-12' });
g = call('3002', 'payrollGet', { id: run.run.id });
const dec = (g.slips || []).find(s => s.empId === ids['5002']);
ok(dec && dec.info.from === '2026-12-16' && dec.paidDays === 16, 'December: paid from the day after the leave (16 to 31 December)', dec && { from: dec.info.from, days: dec.paidDays });
call('3001', 'payrollDelete', { id: run.run.id });

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
