// Wave 7 (2026-11-08): payroll budget vs actual with a forecast, Nitaqat simulator, e-signature, automation rules.
// node tests/wave7.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-08T06:30:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no) { if (toks[no]) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
person('1000', 'المدير', 'admin'); person('3001', 'الموارد البشرية', 'hr'); person('3002', 'الرواتب', 'employee'); person('3003', 'التنفيذي', 'employee');
person('5001', 'أحمد علي', 'employee'); person('5002', 'سارة', 'employee'); person('5003', 'خالد', 'employee'); person('5004', 'John Smith', 'employee');
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3002'], extraRoles: 'payroll' }); toks['3002'] = null;
B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['3003'], extraRoles: 'executive' }); toks['3003'] = null;
let r;

console.log('1. Budget vs actual, with a forecast');
direct(() => {
  ['2026-08', '2026-09', '2026-10'].forEach((m, i) => {
    B.ctx.append_('payrollRuns', { id: 'R' + i, ref: 'PR-' + i, month: m, status: 'locked' });
    ['5001', '5002', '5003', '5004'].forEach(no => B.ctx.append_('payslips', { id: 'S' + i + no, runId: 'R' + i, month: m, empId: ids[no], gross: 5000, gosiEmployer: 500, eosAccrual: 0, companyCost: 5500 }));
  });
});
ok(call('5001', 'budgetSave', { year: 2026, months: Array(12).fill(20000) }).error === 'forbidden', 'an employee cannot set budgets');
ok(call('3003', 'budgetSave', { year: 2026, months: Array(12).fill(20000) }).error === 'forbidden', 'an executive reads budgets but cannot set them');
ok(call('3002', 'budgetSave', { year: 2026, months: [1, 2] }).error === 'bad_months', 'twelve months or nothing');
ok(call('3002', 'budgetSave', { year: 2026, months: Array(12).fill(20000) }).ok, 'payroll sets a monthly budget of 20,000');
r = call('3003', 'budgetView', { year: 2026 });
const oct = r.months.find(m => m.month === '2026-10'), dec = r.months.find(m => m.month === '2026-12');
ok(r.ok && oct.actual === 22000 && oct.variance === 2000 && oct.variancePct === 10, 'October: 22,000 paid against 20,000, 10% over', oct);
ok(dec.actual === null && dec.forecast > 0 && r.basis === 'per_head', 'December is a forecast from cost per head', { dec, basis: r.basis });
const active = r.activeHeadcount;
ok(Math.abs(r.runRate - 5500 * active) < 0.01, 'run rate = 5,500 a head x today\'s active headcount', { rate: r.runRate, active });
ok(r.totals.actual === 66000 && r.totals.budgetToDate === 60000 && r.totals.ytdVariance === 6000, 'year to date: 66,000 paid against 60,000', r.totals);
ok(Math.abs(r.totals.landing - (66000 + 2 * r.runRate)) < 0.01 && r.status === (r.totals.landing > 240000 * 1.02 ? 'over' : 'under'), 'the year lands at actual + forecast, compared with the 240,000 budget', { landing: r.totals.landing, status: r.status });
ok(call('5001', 'budgetView', { year: 2026 }).error === 'forbidden', 'an employee does not see payroll cost');

console.log('2. Nitaqat simulator');
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], isSaudi: true } });
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], isSaudi: true } });
direct(() => {
  B.ctx.append_('compensation', { id: 'C1', empId: ids['5001'], effectiveFrom: '2026-01-01', basic: 4000, housing: 1000, transport: 0, status: 'approved' });
  B.ctx.append_('compensation', { id: 'C2', empId: ids['5002'], effectiveFrom: '2026-01-01', basic: 2500, housing: 700, transport: 0, status: 'approved' });
});
direct(() => { const s = B.ctx.readAll_('settings'); });
call('1000', 'settingsSave', { settings: { saudizationTarget: 40 } });
r = call('3001', 'nitaqatSim', {});
const H = r.base.headcount;
ok(r.ok && r.base.weighted === 1.5 && r.base.saudis === 2, 'Ahmed counts 1 (5,000), Sara 0.5 (3,200)', r.base);
ok(r.quickWins.count === 1 && r.quickWins.monthlyCost === 800 && r.quickWins.rows[0].emp.id === ids['5002'], 'quick win: lift Sara by 800 to count fully', r.quickWins);
const need = Math.ceil((0.4 * H - 1.5) / 0.6 - 1e-9);
ok(r.target === 40 && r.base.need === need, 'full-weight Saudis needed for 40%', { need: r.base.need, expect: need, H });
r = call('3001', 'nitaqatSim', { hires: [{ saudi: true, count: need, wage: 4500 }] });
ok(r.scenario.pct >= 40 && r.scenario.need === 0, 'hiring that many reaches the target', r.scenario);
r = call('3001', 'nitaqatSim', { raises: [{ empId: ids['5002'], wage: 4000 }], leavers: [ids['5001']] });
ok(r.scenario.weighted === 1 && r.scenario.headcount === H - 1 && r.scenario.monthlyCost === 800, 'Ahmed leaves, Sara\'s raise: weight 1, cost 800', r.scenario);
r = call('3003', 'nitaqatSim', {});
ok(r.ok && r.quickWins.rows.length === 0 && r.quickWins.count === 1 && r.scenario.monthlyCost === null, 'an executive sees totals, no names or wages', r.quickWins);
ok(call('5001', 'nitaqatSim', {}).error === 'forbidden', 'an employee cannot run it');

console.log('3. E-signature');
const text = 'أقر أنا الموقع أدناه باستلامي نسخة من لائحة تنظيم العمل والتزامي بها.';
ok(call('5001', 'signRequest', { doc: { title: 'إقرار', body: text }, empIds: [ids['5002']] }).error === 'forbidden', 'only HR sends documents to sign');
ok(call('3001', 'signRequest', { doc: { title: 'إقرار', body: text }, empIds: [ids['3001']] }).error === 'cannot_sign_own_request', 'HR cannot send one to themselves');
r = call('3001', 'signRequest', { doc: { title: 'إقرار اللائحة', body: text, kind: 'policy' }, empIds: [ids['5001'], ids['5004']] });
ok(r.ok && r.count === 2 && /^ESG-2026-/.test(r.refs[0]), 'HR sends it to two people', r);
let mine = call('5001', 'signList').mine;
ok(mine.length === 1 && mine[0].body === text && mine[0].status === 'pending', 'Ahmed sees the text waiting', mine);
r = call('5001', 'myTasks');
ok(r.tasks.some(t => t.kind === 'sign_pending' && t.count === 1), 'the bell shows one document to sign');
const doc = mine[0];
ok(call('5001', 'signDoc', { id: doc.id, agree: true, docHash: doc.docHash, name: 'شخص آخر' }).error === 'name_mismatch', 'a different name is refused');
ok(call('5001', 'signDoc', { id: doc.id, agree: true, docHash: 'x', name: 'أحمد علي' }).error === 'doc_changed', 'signing a different text is refused');
ok(call('5002', 'signDoc', { id: doc.id, agree: true, docHash: doc.docHash, name: 'سارة' }).error === 'not_found', 'nobody signs another person\'s document');
r = call('5001', 'signDoc', { id: doc.id, agree: true, docHash: doc.docHash, name: '  احمد   علي ' });
ok(r.ok && r.seal, 'Ahmed signs with his name (spacing and hamza forgiven)', r);
ok(call('5001', 'signDoc', { id: doc.id, agree: true, docHash: doc.docHash, name: 'أحمد علي' }).error === 'already_done', 'a signature is final');
let v = call('3001', 'signVerify', { ref: doc.ref, seal: r.seal });
ok(v.ok && v.valid && v.textIntact && v.sealValid && v.sealMatches, 'verification: text intact, seal valid', v);
direct(() => { const row = B.ctx.findBy_('signRequests', 'id', doc.id); row.body = row.body + ' (معدل)'; B.ctx.update_('signRequests', row); });
v = call('3001', 'signVerify', { ref: doc.ref });
ok(v.ok && !v.valid && !v.textIntact, 'an edited text after signing is caught', v);
const john = call('5004', 'signList').mine[0];
ok(call('5004', 'signDecline', { id: john.id }).error === 'note_required', 'declining needs a reason');
ok(call('5004', 'signDecline', { id: john.id, note: 'I need to read it with HR first' }).ok, 'John declines with a reason');
ok(call('3001', 'signList').sent.some(s => s.id === john.id && s.status === 'declined' && !('body' in s)), 'HR sees the status, the list carries no text');

console.log('4. Automation rules');
call('3001', 'hrEmpSave', { emp: { id: ids['5003'], hireDate: '2026-11-05', managerId: ids['5002'] } });
call('3001', 'hrEmpSave', { emp: { id: ids['5004'], contractEnd: '2026-12-01' } });
ok(call('5001', 'autoRuleSave', { rule: { name: 'x', trigger: 'after_hire', days: 1, audience: 'hr', message: 'x' } }).error === 'forbidden', 'only HR writes rules');
ok(call('3001', 'autoRuleSave', { rule: { name: 'x', trigger: 'nope', days: 1, audience: 'hr', message: 'x' } }).error === 'bad_trigger', 'unknown triggers are refused');
ok(call('3001', 'autoRuleSave', { rule: { name: 'متابعة المدير بعد التعيين', trigger: 'after_hire', days: 3, audience: 'manager', message: 'اجلس مع {name} لمراجعة أسبوعه الأول' } }).ok, 'rule: 3 days after hire, the manager meets the new hire');
ok(call('3001', 'autoRuleSave', { rule: { name: 'تجديد العقد', trigger: 'contract_end', days: 30, audience: 'hr', message: 'عقد {name} ينتهي في {date}: قرر التجديد' } }).ok, 'rule: 30 days before a contract ends, HR decides');
r = call('3001', 'autoRunNow');
ok(r.ok && r.created === 2, 'running the rules creates two to-dos', r);
ok(call('3001', 'autoRunNow').created === 0, 'running again creates nothing new (once per person per event)');
let hub = call('5002', 'autoHub');
ok(hub.mine.length === 1 && hub.mine[0].title.indexOf('خالد') >= 0 && hub.mine[0].emp.id === ids['5003'], 'Sara (the manager) gets the first-week to-do with the name filled in', hub.mine);
ok(call('5002', 'myTasks').tasks.some(t => t.kind === 'auto_task' && t.count === 1), 'it is in her bell');
hub = call('3001', 'autoHub');
ok(hub.mine.some(x => x.title.indexOf('2026-12-01') >= 0) && hub.rules.length === 2, 'HR gets the contract to-do; sees both rules', hub);
ok(call('5001', 'autoTaskStep', { id: hub.mine[0].id }).error === 'forbidden', 'someone else cannot close it');
ok(call('5002', 'autoTaskStep', { id: call('5002', 'autoHub').mine[0].id, step: 'dismiss' }).error === 'forbidden', 'only HR dismisses');
ok(call('5002', 'autoTaskStep', { id: call('5002', 'autoHub').mine[0].id }).ok, 'Sara marks hers done');
ok(call('5002', 'autoHub').mine.length === 0, 'and it leaves her list');
B.setNow(Date.parse('2027-03-01T06:30:00Z')); Object.keys(toks).forEach(k => { toks[k] = null; });
call('3001', 'autoRuleSave', { rule: { name: 'old', trigger: 'after_hire', days: 1, audience: 'hr', message: 'old {name}' } });
r = call('3001', 'autoRunNow'); ok(r.created === 0, 'a new rule never floods the list with old events (14-day window)', call('3001', 'autoHub').mine.map(x => x.title + ' ' + x.eventDate));
call('3001', 'hrEmpSave', { emp: { id: ids['5001'], contractEnd: '2027-03-20' } });
r = call('3001', 'autoRunNow');
ok(r.created === 1, 'a 30-day contract rule still catches a contract ending in 19 days, until the event passes', r);
ok(call('3001', 'autoRunNow').created === 0, 'and only once');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
