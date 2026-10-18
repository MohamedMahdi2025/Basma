// Demo company load and purge (backend/Demo.gs): node tests/demo.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
const fresh = () => { B.ctx.READ_MEMO_ = {}; B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; };

// a real company first: the owner and one employee, with a punch-free audit trail
const boot = B.call({ action: 'bootstrap', setupKey: 'k', name: 'المالك', empNo: '1' });
const dev = new Authenticator();
const eb = B.call({ action: 'enrollBegin', empNo: '1', code: boot.activationCode });
const token = B.call({ action: 'enrollFinish', credential: dev.create(eb.options) }).token;
const real = B.call({ action: 'empSave', token, emp: { empNo: '2', name: 'موظف حقيقي' } });
ok(real.ok, 'a real employee exists before the load');
fresh();
const realEmps = B.ctx.readAll_('employees').length, realAudit = B.ctx.readAll_('audit').length;

const D = extra => B.call(Object.assign({ action: 'demoData', setupKey: 'k' }, extra));
let r = B.call({ action: 'demoData', setupKey: 'wrong', mode: 'status' });
ok(!r.ok && r.error === 'bad_setup_key', 'the setup key is required', r);
r = D({ mode: 'import', tab: 'credentials', rows: [{ empId: 'x' }] });
ok(!r.ok && r.error === 'bad_tab', 'sign-in secrets are never imported', r);
r = D({ mode: 'import', tab: 'settings', rows: [{ key: 'x', value: 'y' }] });
ok(!r.ok && r.error === 'bad_tab', 'live settings are never imported', r);

const demoEmp = { id: 'EDEMO1', empNo: 'T1001', name: 'موظف تجريبي', role: 'employee', status: 'active', hireDate: '2026-08-27', phone: '0501234567', createdAt: '2026-08-20T06:00:00.000Z', bogus: 'dropped' };
r = D({ mode: 'import', tab: 'employees', rows: [demoEmp, Object.assign({}, demoEmp, { id: 'EDEMO2', empNo: 'T1002' })], batch: 't' });
ok(r.ok && r.added === 2 && r.skipped === 0, 'rows are appended', r);
r = D({ mode: 'import', tab: 'employees', rows: [demoEmp] });
ok(r.ok && r.added === 0 && r.skipped === 1, 'a row already on the Sheet is skipped, not doubled', r);
r = D({ mode: 'import', tab: 'empPrivate', rows: [{ empId: 'EDEMO1', iban: 'SA0380000000608010167519' }] });
ok(r.ok && r.added === 1, 'the one-row-per-person private tab is keyed by employee', r);
const line = { ts: '2026-09-01T06:00:00.000Z', actorId: 'EDEMO1', action: 'demo_line', targetId: '', detail: '{"a":1}' };
r = D({ mode: 'import', tab: 'audit', rows: [line] });
ok(r.ok && r.added === 1, 'audit lines import by their content', r);
fresh();
const e1 = B.ctx.readAll_('employees').filter(e => e.id === 'EDEMO1')[0];
ok(e1 && e1.hireDate === '2026-08-27' && String(e1.phone) === '0501234567' && !('bogus' in e1), 'text stays text (dates, phone numbers) and unknown columns are dropped', e1);

r = D({ mode: 'status' });
ok(r.ok && r.demo.employees === 2 && r.demo.empPrivate === 1 && r.demo.audit === 1 && r.tabs.employees === realEmps + 2, 'status counts the demo rows per tab', r.demo);

// a real user keeps working after the load
B.call({ action: 'empSave', token, emp: { empNo: '3', name: 'موظف بعد التحميل' } });
r = D({ mode: 'purge' });
ok(r.ok && r.removed.employees === 2 && r.removed.empPrivate === 1 && r.removed.audit === 1, 'purge removes exactly the loaded rows', r.removed);
fresh();
const left = B.ctx.readAll_('employees');
ok(left.length === realEmps + 1 && left.every(e => !/^T/.test(e.empNo)), 'real employees, including one added after the load, stay', left.map(e => e.empNo));
ok(B.ctx.readAll_('audit').length >= realAudit && !B.ctx.readAll_('audit').some(a => a.action === 'demo_line'), 'the real audit trail stays');
ok(B.ctx.readAll_('demoLedger').length === 0, 'the ledger is empty after the purge');
const kept = left.filter(e => e.empNo === '2')[0];
ok(kept && kept.name === 'موظف حقيقي' && typeof kept.createdAt === 'string', 'rewritten rows keep their text', kept);
r = B.call({ action: 'me', token });
ok(r.ok, 'the owner is still signed in after the purge', r);

// ---------------- demo payroll: runs only for the ledgered people, never in the way of the real payroll ----------------
console.log('Demo payroll');
const direct = fn => { fresh(); const v = B.ctx.withLock_(fn); fresh(); return v; };
const rp = B.call({ action: 'empSave', token, emp: { empNo: '5', name: 'محاسب رواتب حقيقي', role: 'hr' } });
const dev5 = new Authenticator();
const eb5 = B.call({ action: 'enrollBegin', empNo: '5', code: rp.activationCode });
const ef5 = B.call({ action: 'enrollFinish', credential: dev5.create(eb5.options) });
B.call({ action: 'hrRolesSave', token, id: ef5.me.id, extraRoles: 'payroll' });
const tok5 = () => { const b = B.call({ action: 'authBegin', empNo: '5' }); return B.call({ action: 'authFinish', credential: dev5.get(b.options) }).token; };
const t5 = tok5();
fresh();
const realEmp2 = B.ctx.readAll_('employees').filter(e => e.empNo === '2')[0];
const comp = (id, empId, basic) => ({ id, ref: 'SAL-' + id, empId, effectiveFrom: '2026-01-01', basic, housing: basic / 4, transport: 500, otherJson: '{}', currency: 'SAR', reason: 'initial',
  enteredBy: 'x', approvedBy: 'y', approvedAt: '2026-01-01T00:00:00Z', status: 'approved', createdAt: '2026-01-01T00:00:00Z', batchId: '' });
direct(() => B.ctx.append_('compensation', comp('CREAL2', realEmp2.id, 7000)));
direct(() => B.ctx.readAll_('employees').forEach(e => { e.hireDate = '2026-01-01'; B.ctx.update_('employees', e); })); // real staff employed all year

const dEmp = (id, no, extra) => Object.assign({ id, empNo: no, name: 'تجريبي ' + no, role: 'employee', status: 'active', hireDate: '2026-01-01', createdAt: '2026-06-01T00:00:00.000Z', isSaudi: 'false' }, extra);
r = D({ mode: 'import', tab: 'employees', rows: [dEmp('EDH', 'T2001', { role: 'hr' }), dEmp('EDP', 'T2002', { extraRoles: 'payroll' }), dEmp('EDE', 'T2003')], batch: 'pay' });
ok(r.ok && r.added === 3, 'three demo people loaded (HR, payroll, employee)', r);
D({ mode: 'import', tab: 'compensation', rows: [comp('CDH', 'EDH', 9000), comp('CDP', 'EDP', 8000), comp('CDE', 'EDE', 4000)] });
// the demo's own August run as the loader imports it (no scope column then), and an open demo wage mismatch for September
D({ mode: 'import', tab: 'payrollRuns', rows: [{ id: 'PDAUG', ref: 'PR-2026-90001', month: '2026-08', status: 'locked', preparedBy: 'EDH', preparedAt: '2026-09-01T00:00:00Z', approvedBy: 'EDP', approvedAt: '2026-09-02T00:00:00Z', totalsJson: '{"headcount":1,"net":4000}', note: '', emailedAt: '', createdAt: '2026-09-01T00:00:00Z', updatedAt: '' }] });
D({ mode: 'import', tab: 'payslips', rows: [{ id: 'SDAUG', ref: 'PS-2026-90001', runId: 'PDAUG', month: '2026-08', empId: 'EDE', status: 'locked', linesJson: '[]', gross: 4000, deductions: 0, net: 4000, gosiEmployee: 0, gosiEmployer: 80 }] });
D({ mode: 'import', tab: 'salaryRecon', rows: [{ id: 'QDEMO', ref: 'REC-2026-90001', month: '2026-09', source: 'gosi', total: 1, matched: 0, mismatchesJson: '[{"empId":"EDE"}]', missingJson: '[]', unknownJson: '[]', status: 'open', by: 'EDH', at: '2026-10-01T00:00:00Z' }] });

// the real September draft, made while the demo people are on the Sheet
r = B.call({ action: 'payrollCreate', token, month: '2026-09' });
ok(r.ok && r.run.status === 'draft', 'the real September draft is created', r);
const realSep = r.run.id;
fresh();
const realSlips = () => B.ctx.readAll_('payslips').filter(s => s.runId === realSep && s.status !== 'void');
ok(realSlips().length > 0 && !realSlips().some(s => /^ED[HPE]$/.test(s.empId)), 'the real run has no demo people in it', realSlips().map(s => s.empId));

r = D({ mode: 'payroll', month: '2026-13' });
ok(!r.ok && r.error === 'bad_date', 'the month is checked', r);
r = D({ mode: 'payroll', month: '2026-09' });
ok(r.ok && r.created && r.headcount === 3, 'demo September is run for the three demo people', r);
fresh();
const runs = () => B.ctx.readAll_('payrollRuns');
const dSep = runs().filter(x => x.month === '2026-09' && x.scope === 'demo')[0];
ok(dSep && dSep.status === 'locked' && dSep.preparedBy === 'EDH' && dSep.approvedBy === 'EDP', 'it is locked, prepared by demo HR and approved by the demo payroll holder', dSep);
const dSlips = B.ctx.readAll_('payslips').filter(s => s.runId === dSep.id);
ok(dSlips.length === 3 && dSlips.every(s => s.status === 'locked' && /^ED[HPE]$/.test(s.empId)), 'its payslips are the demo people, locked', dSlips.map(s => s.empId + ':' + s.status));
ok(Number(dSlips.filter(s => s.empId === 'EDE')[0].gross) > 0, 'payslips are computed with the real calculation', dSlips.map(s => s.gross));
ok(runs().filter(x => x.id === realSep)[0].scope === '', 'the real run keeps an empty scope');
ok(runs().filter(x => x.id === 'PDAUG')[0].scope === 'demo', 'the imported demo August run is marked demo too');
r = D({ mode: 'payroll', month: '2026-09' });
ok(r.ok && r.skipped, 'running demo September again does nothing', r);
r = D({ mode: 'payroll', month: '2026-08' });
ok(r.ok && r.skipped, 'demo August already exists, so it is skipped', r);
r = D({ mode: 'payroll', month: '2026-07' });
ok(r.ok && r.created && r.headcount === 3, 'demo July is run', r);
r = D({ mode: 'status' });
ok(r.ok && r.demo.payrollRuns === 3 && r.demo.payslips === 7, 'every demo run and payslip is in the ledger', r.demo);

// the real payroll goes on as if the demo were not there
r = B.call({ action: 'payrollCreate', token, month: '2026-09' });
ok(!r.ok && r.error === 'run_exists', 'a second real September run is still refused');
r = B.call({ action: 'payrollCreate', token, month: '2026-07' });
ok(r.ok, 'a real July run is not blocked by the demo July run', r);
B.call({ action: 'payrollDelete', token, id: r.run && r.run.id });
r = B.call({ action: 'payrollAdjSave', token, adj: { empId: realEmp2.id, month: '2026-09', code: 'bonus', amount: 100, reason: 'حقيقي' } });
ok(r.ok, 'real staff can still get September adjustments while demo September is locked', r);
r = B.call({ action: 'payrollAdjSave', token, adj: { empId: 'EDE', month: '2026-09', code: 'bonus', amount: 100, reason: 'تجريبي' } });
ok(!r.ok && r.error === 'month_locked', 'demo people are locked by their own locked run', r);
r = B.call({ action: 'payrollRecalc', token: t5, id: realSep });
ok(r.ok && !realSlips().some(s => /^ED[HPE]$/.test(s.empId)), 'recalculating the real draft keeps the demo people out', r);
r = B.call({ action: 'payrollRecalc', token, id: realSep }); // the owner prepares, the payroll holder approves
r = B.call({ action: 'payrollApprove', token: tok5(), id: realSep });
ok(r.ok && r.run.status === 'locked', 'the real September run is approved despite the demo run and the open demo wage mismatch', r);
fresh();
r = B.call({ action: 'payrollList', token });
const sep = (r.rows || []).filter(x => x.month === '2026-09');
ok(sep.length === 2 && sep.some(x => x.scope === 'demo') && sep.some(x => x.scope === ''), 'the list shows both September runs, each with its scope', sep);
r = B.call({ action: 'payrollGet', token, id: realSep });
ok(r.ok && r.slips.every(s => !/^ED[HPE]$/.test(s.empId)), 'the real run shows only real payslips', r.slips && r.slips.map(s => s.empId));
r = B.call({ action: 'mySlips', token });
ok(r.ok && r.rows.every(s => s.runId === realSep), 'a real person sees only their real payslip', r.rows);
fresh();
ok(B.ctx.currentRun_().id === realSep, 'reports default to the real run of the month, not the demo one');
r = B.call({ action: 'dashboard', token, from: '2026-09-01', to: '2026-09-30' });
const trend = (r.cost && r.cost.trend) || [];
const sepT = trend.filter(x => x.month === '2026-09');
ok(sepT.length === 1 && sepT[0].headcount === realSlips().length, 'the dashboard September cost is the real run alone', trend);
ok(trend.some(x => x.month === '2026-07' && x.headcount === 3), 'months with only a demo run still show the demo', trend);
// demo payroll never reaches the bank or the ledger, and a loaded run counts as demo even before its scope is written
r = B.call({ action: 'wpsFile', token, id: dSep.id });
ok(!r.ok && r.error === 'demo_run', 'no WPS bank file for a demo run', r);
r = B.call({ action: 'journalBuild', token, id: dSep.id });
ok(!r.ok && r.error === 'demo_run', 'no payroll journal for a demo run', r);
r = B.call({ action: 'journalList', token });
ok(r.ok && !(r.rows || r.runs || []).some(x => x.id === dSep.id), 'the journal list holds real runs only', r);
fresh();
ok(B.ctx.isDemoRun_({ id: 'PDAUG', scope: '' }), 'a loaded run is demo by the ledger even with an empty scope');
ok(!B.ctx.isDemoRun_({ id: realSep, scope: '' }), 'a real run is not demo');

r = D({ mode: 'purge' });
ok(r.ok && r.removed.payrollRuns === 3 && r.removed.payslips === 7, 'purge removes the demo runs and payslips', r.removed);
fresh();
ok(runs().filter(x => x.status !== 'cancelled').length === 1 && runs().some(x => x.id === realSep && x.status === 'locked'), 'the real September run stays', runs().map(x => x.month + ':' + x.status + ':' + x.scope));
ok(realSlips().length > 0 && realSlips().every(s => s.status === 'locked'), 'its payslips stay');
ok(B.ctx.readAll_('demoLedger').length === 0, 'the ledger is empty again');
const { payrollMonths } = require('../tools/demo-load');
ok(JSON.stringify(payrollMonths(['2026-07', '2026-09'])) === '["2026-07","2026-08","2026-09"]' && JSON.stringify(payrollMonths(['2026-12', '2027-01'])) === '["2026-12","2027-01"]',
  'the loader runs every month of the range, across a year end', payrollMonths(['2026-07', '2026-09']));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
