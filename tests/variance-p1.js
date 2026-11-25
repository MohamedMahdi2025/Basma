// Variance study P1 (2026-11-25): run-scoped variance, headcount bridge, pay-line trend, reconciliation, executive summary. node tests/variance-p1.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const C = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
const bt = C.call({ action: 'bootstrap', setupKey: 'k', name: 'المالك', empNo: '1000' });
const dv = new Authenticator();
const e1 = C.call({ action: 'enrollBegin', empNo: '1000', code: bt.activationCode });
const tk = C.call({ action: 'enrollFinish', credential: dv.create(e1.options) }).token;
const P = o => Object.assign({ nationality: 'باكستاني', department: 'Operations', position: 'Driver', sponsor: 'شركة أ', costCenter: 'Al-Nassem النسيم', reliability: 'Sponsored',
  joined: '2024-01-01', lastDay: '', status: 'Active', months: ['2026-07', '2026-08', '2026-09'], isSaudi: false, iban: '', ibanOk: false, payToOther: false, bank: '' }, o);
const people = [
  P({ nid: '3630000001', empNo: '1000', name: 'المالك', department: 'Finance', costCenter: 'HQ الاداره', sponsor: 'شركة ب' }),
  P({ nid: '2000000001', empNo: '1001', name: 'Ali Riyadh' }),
  P({ nid: '2000000002', empNo: '1002', name: 'Omar Arar', costCenter: '(Al-Musadiyah-Arar)المساعدية عرعر', sponsor: 'شركة ب' }),
  P({ nid: '2000000003', empNo: '1003', name: 'Leaver Jed', costCenter: 'Jeddah جدة', months: ['2026-07', '2026-08'] }),
  P({ nid: '1000000004', empNo: '1004', name: 'سعود', nationality: 'سعودي', isSaudi: true, reliability: 'Saudi', months: ['2026-09'] }),
];
const L = (nid, o) => Object.assign({ nid, row: 2, payMethod: 'WPS', basic: 0, housing: 0, transport: 0, otherAllow: 0, bonus: 0, gross: 0, gosi: 0, penalties: 0, loan: 0, leave: 0, newJoiner: 0, otherDed: 0, totalDed: 0, net: 0 }, o);
const pay = (nid, basic, extra) => { const o = Object.assign({ basic, housing: 0, bonus: 0, loan: 0 }, extra || {}); const g = o.basic + o.housing + o.bonus; return L(nid, Object.assign(o, { gross: g, totalDed: o.loan, net: g - o.loan })); };
const months = {
  '2026-07': [pay('3630000001', 8000), pay('2000000001', 2000), pay('2000000002', 2000), pay('2000000003', 2000)],
  '2026-08': [pay('3630000001', 8000), pay('2000000001', 2000), pay('2000000002', 2000), pay('2000000003', 2000)],
  '2026-09': [pay('3630000001', 8000), pay('2000000001', 2500, { bonus: 500 }), pay('2000000002', 2000, { loan: 300 }), pay('1000000004', 4000)],
};
const imp = C.call({ action: 'demoData', setupKey: 'k', mode: 'sheetImport', ownerNo: '1000', depts: { Operations: 'العمليات', Finance: 'المالية' }, people, months, dryRun: false });
ok(imp.ok && imp.runs === 6, 'fixture: two pay groups over three months', imp);
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
const owner = C.ctx.readAll_('employees').find(e => e.empNo === '1000');
C.ctx.update_('employees', Object.assign({}, owner, { extraRoles: 'payroll' }));
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
const V = extra => C.call(Object.assign({ action: 'payrollVarianceMonth', token: tk }, extra));
let v = V({});
const by = n => v.people.find(p => p.name === n);
C.ctx.setOrg_(C.ctx.orgRec_(C.ctx.homeOrgId_()));
const tokFor = no => { C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null; return C.ctx.issueToken_(C.ctx.readAll_('employees').find(e => e.empNo === no), 'pw'); };
const setEmp = (no, o) => { C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null; const e = C.ctx.readAll_('employees').find(x => x.empNo === no); C.ctx.update_('employees', Object.assign({}, e, o)); C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null; };
const call = (t, action, extra) => C.call(Object.assign({ action, token: t }, extra || {}));
const near = (a, b) => Math.abs(a - b) < 0.01;
const bridgeOk = hb => !!hb && hb.opening + hb.joiners.length + hb.returners.length + hb.transferIn.length - hb.leavers.length - hb.transferOut.length === hb.closing;

console.log('Run-scoped variance (P1-1): one run against its own pay group');
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
const runs = C.ctx.readAll_('payrollRuns').filter(r => r.status !== 'cancelled');
const groups = C.ctx.readAll_('payGroups'), gid = n => (groups.find(g => g.nameAr === n) || {}).id;
const sepB = runs.find(r => r.month === '2026-09' && r.payGroupId === gid('شركة ب'));
const sepA = runs.find(r => r.month === '2026-09' && r.payGroupId === gid('شركة أ'));
v = call(tk, 'payrollVarianceMonth', { runId: sepB.id });
ok(v.ok && v.run && v.run.id === sepB.id && v.month === '2026-09', 'the run page asks for its own run', v.error || v.run);
ok(v.ok && !v.people.some(p => p.name === 'Ali Riyadh'), 'only that pay group: nobody from the other group shows up', v.people && v.people.map(p => p.name + ':' + p.dims.payGroup));
ok(v.ok && v.people.every(p => (p.slips.cur || []).every(s => s.runId === sepB.id)), 'payslip links of this month point at this run only');
ok(bridgeOk(v.headBridge), 'headcount bridge: opening + in - out = closing', v.headBridge);
const old = call(tk, 'payrollVariance', { id: sepB.id });
ok(old.ok && !/Ali Riyadh/.test(JSON.stringify(old)), 'the old run endpoint no longer mixes in other pay groups', old.error);
v = call(tk, 'payrollVarianceMonth', {});
ok(bridgeOk(v.headBridge), 'whole-company headcount bridge adds up', v.headBridge);
ok(v.people.every(p => Array.isArray(p.slips.cur) && Array.isArray(p.slips.base)), 'every person carries links to their payslips');
// a closed group: invisible to a payroll user outside it, also on the run page
setEmp('1001', { extraRoles: 'payroll', role: 'employee' });
const tkAli = tokFor('1001');
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
const g = C.ctx.readAll_('payGroups').find(x => x.nameAr === 'شركة ب');
C.ctx.update_('payGroups', Object.assign({}, g, { managersJson: JSON.stringify([C.ctx.readAll_('employees').find(e => e.empNo === '1000').id, 'someone-else']) }));
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
ok(call(tkAli, 'payrollVarianceMonth', { runId: sepB.id }).error === 'forbidden', "a closed group's run is refused to payroll staff outside it");
v = call(tkAli, 'payrollVarianceMonth', {});
ok(v.ok && !v.people.some(p => p.dims.payGroup === 'شركة ب'), 'and its people never appear in the whole-company view', v.error || v.people.map(p => p.dims.payGroup));
ok(!/Omar Arar/.test(JSON.stringify(call(tkAli, 'payrollVariance', { id: sepA.id }))), 'nor on the old run endpoint of another group');

console.log('Pay-line trend (P1-3)');
const L2 = call(tk, 'varianceLines', { to: '2026-09', n: 3 });
const basicLine = L2.lines && L2.lines.find(l => l.code === 'e:basic');
ok(L2.ok && L2.months.join() === '2026-07,2026-08,2026-09' && basicLine, 'each pay line month by month', L2.error || L2.months);
C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null;
const sepSlips = C.ctx.readAll_('payslips').filter(s => runs.some(r => r.id === s.runId && r.month === '2026-09') && s.status !== 'void');
const sepBasic = sepSlips.reduce((t, s) => t + JSON.parse(s.linesJson).filter(l => l.code === 'basic').reduce((a, l) => a + l.amount, 0), 0);
ok(basicLine && near(basicLine.m['2026-09'].amt, sepBasic), "a line's month total equals the payslips", basicLine && [basicLine.m['2026-09'].amt, sepBasic]);
const bonus = (L2.lines || []).find(l => l.code === 'e:bonus');
ok(bonus && bonus.flags.some(f => f.month === '2026-09' && f.kind === 'new'), 'a line that appears is flagged in its month', bonus && bonus.flags);
const dr = call(tk, 'varianceLines', { to: '2026-09', n: 3, line: 'e:basic', month: '2026-09' });
ok(dr.people && basicLine && near(dr.people.reduce((t, p) => t + p.amount, 0), basicLine.m['2026-09'].amt), 'the drill list adds up to the cell', dr.error || dr.people.length);
ok((call(tkAli, 'varianceLines', { to: '2026-09', n: 3, line: 'e:basic', month: '2026-09' }).people || []).every(p => p.name !== 'Omar Arar'), 'the drill respects closed groups');

console.log('Reconciliation (P1-4)');
const rc = call(tk, 'payReconcile', { month: '2026-09' });
ok(rc.ok && rc.runs.length === 2 && rc.runs.every(r => r.checks.map(c => c.key).join() === 'bank_file,wps_generated,wps_confirmed,gosi,journal'), 'one table per run: bank file, WPS generated and confirmed, GOSI, journal', rc.error || rc.runs.map(r => r.checks.map(c => c.key)));
const bank = rc.ok ? rc.runs[0].checks[0] : {};
ok(bank.status === 'mismatch' && bank.people.length && bank.people.every(p => ['no_iban', 'bad_iban', 'net_not_positive'].indexOf(p.why) >= 0), 'people the bank cannot pay are named with the reason', bank);
ok(rc.ok && rc.runs.every(r => r.checks[1].status === 'ok' && r.checks[1].theirs === r.totals.net && r.checks[2].status === 'ok'), 'the imported months carry their WPS files, generated and confirmed, and they match each run', rc.runs && rc.runs.map(r => [r.checks[1].status, r.checks[2].status]));
ok((call(tkAli, 'payReconcile', { month: '2026-09' }).runs || []).length === 1, 'a closed group is left out for payroll staff outside it');

console.log('Executive summary (P1-5): no names, groups under 5 folded');
setEmp('1002', { extraRoles: 'executive', role: 'employee' });
const tkEx = tokFor('1002');
ok(call(tkEx, 'payrollVarianceMonth', {}).error === 'forbidden', 'an executive still cannot open the full variance screen');
const sx = call(tkEx, 'varianceSummary', { month: '2026-09' });
ok(sx.error === 'group_too_small', 'a company of fewer than 5 people shows the executive no amounts at all', sx.error || sx.totals);
const sp = call(tk, 'varianceSummary', { month: '2026-09' });
ok(sp.ok && !sp.masked && !/Ali Riyadh|Omar Arar|"empId"/.test(JSON.stringify(sp)) && sp.headBridge.opening + sp.headBridge.joiners - sp.headBridge.leavers === sp.headBridge.closing, 'payroll staff get the summary too, still without names', sp.error);
ok(call(tokFor('1004'), 'varianceSummary', {}).error === 'forbidden', 'an employee is refused');


console.log('Variance explanations (P1-2)');
{
  const oct = call(tk, 'payrollCreate', { month: '2026-10', payGroupId: gid('شركة أ') });
  ok(oct.ok, 'an October draft for one pay group', oct.error);
  let n = call(tk, 'varianceNotes', { runId: oct.run.id });
  ok(n.ok && n.rows.length > 0 && n.summary.open === n.rows.length && n.rows.every(r => Array.isArray(r.why)), 'every mover against September is listed, each with what moved, none explained yet', n.error || n.summary);
  const ownerId = C.ctx.readAll_('employees').find(e => e.empNo === '1000').id, ali = n.rows.find(r => r.name === 'Ali Riyadh');
  ok(call(tk, 'varianceNote', { runId: oct.run.id, empId: ownerId, reason: 'other', note: 'x' }).error === 'cannot_change_own_salary', 'nobody explains their own pay');
  ok(call(tk, 'varianceNote', { runId: oct.run.id, empId: ali.empId, reason: 'nonsense', note: 'x' }).error === 'bad_value', 'the reason comes from the list');
  ok(call(tk, 'varianceNote', { runId: oct.run.id, empId: ali.empId, reason: 'absence', note: '' }).error === 'note_required', 'a written note is required');
  ok(call(tk, 'varianceNote', { runId: oct.run.id, empId: ali.empId, reason: 'absence', note: 'no package for October yet' }).ok, 'a payroll holder explains a mover');
  ok(call(tk, 'varianceNote', { runId: oct.run.id, empId: ali.empId, accept: true }).error === 'second_approver_required', 'the author cannot accept their own explanation');
  ok(call(tkAli, 'varianceNote', { runId: oct.run.id, empId: ali.empId, accept: true }).error === 'cannot_change_own_salary', 'nor can the person it is about');
  setEmp('1004', { extraRoles: 'payroll', role: 'employee' });
  ok(call(tokFor('1004'), 'varianceNote', { runId: oct.run.id, empId: ali.empId, accept: true }).status === 'accepted', 'another payroll holder accepts it');
  n = call(tk, 'varianceNotes', { runId: oct.run.id });
  const a2 = n.rows.find(r => r.empId === ali.empId);
  ok(a2.note && a2.note.status === 'accepted' && !a2.note.stale && a2.note.byName === 'المالك' && n.summary.accepted === 1, 'the list shows who explained and who accepted', a2.note);
  ok(call(tk, 'payrollAdjSave', { adj: { empId: ali.empId, month: '2026-10', code: 'fine', amount: 50, reason: 'late' } }).ok && call(tk, 'payrollRecalc', { id: oct.run.id }).ok, 'a fine is added and the run recalculated');
  n = call(tk, 'varianceNotes', { runId: oct.run.id });
  ok(n.rows.find(r => r.empId === ali.empId).note.stale, 'a payslip that changed reopens its explanation');
  ok(call(tk, 'varianceNotes', { runId: oct.run.id }).ok && call(tokFor('1004'), 'varianceNotes', { runId: oct.run.id }).ok && call(tkEx, 'varianceNotes', { runId: oct.run.id }).error === 'forbidden', 'executives cannot read explanations');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
