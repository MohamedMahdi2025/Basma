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

// ---------------- clean start: keep one employee, remove everyone else and the payroll books ----------------
console.log('Reset (keep one)');
{
  const C = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
  const bt = C.call({ action: 'bootstrap', setupKey: 'k', name: 'المالك', empNo: '1' });
  const dv = new Authenticator();
  const e1 = C.call({ action: 'enrollBegin', empNo: '1', code: bt.activationCode });
  const tk = C.call({ action: 'enrollFinish', credential: dv.create(e1.options) }).token;
  const owner = C.ctx.readAll_('employees')[0];
  C.call({ action: 'empSave', token: tk, emp: { empNo: '2', name: 'موظف أ', managerId: owner.id } });
  C.call({ action: 'empSave', token: tk, emp: { empNo: '3', name: 'موظف ب' } });
  C.ctx.READ_MEMO_ = {};
  const others = C.ctx.readAll_('employees').filter(e => e.id !== owner.id);
  // the owner reports to a removed person, a department is headed by one, and rows about each person
  C.ctx.update_('employees', Object.assign({}, C.ctx.readAll_('employees').filter(e => e.id === owner.id)[0], { managerId: others[0].id }));
  C.ctx.appendMany_('departments', [{ id: 'D1', code: 'D1', nameAr: 'قسم', headEmpId: others[0].id, status: 'active' }]);
  C.ctx.appendMany_('empPrivate', [{ empId: others[0].id, iban: 'SA0380000000608010167519' }, { empId: owner.id, iban: 'SA0380000000608010167519' }]);
  C.ctx.appendMany_('punches', [{ id: 'PX1', empId: others[1].id, date: '2026-10-01', type: 'in', status: 'ok' }, { id: 'PX2', empId: owner.id, date: '2026-10-01', type: 'in', status: 'ok' }]);
  C.ctx.appendMany_('payrollRuns', [{ id: 'RX', month: '2026-09', status: 'locked' }]);
  C.ctx.appendMany_('payslips', [{ id: 'SX1', runId: 'RX', month: '2026-09', empId: owner.id }, { id: 'SX2', runId: 'RX', month: '2026-09', empId: others[0].id }]);
  C.ctx.appendMany_('snapshots', [{ id: 'NX', snapId: '2026-09' }]);
  const R = extra => C.call(Object.assign({ action: 'demoData', setupKey: 'k' }, extra));
  let x = R({ mode: 'people' });
  ok(x.ok && x.people.length === 3 && x.people.every(p => !('iban' in p) && !('phone' in p)), 'people lists everyone, nothing private', x);
  x = C.call({ action: 'demoData', setupKey: 'wrong', mode: 'people' });
  ok(!x.ok && x.error === 'bad_setup_key', 'people needs the setup key', x);
  x = R({ mode: 'reset', keepEmpNo: '1' });
  ok(!x.ok && x.error === 'bad_request', 'reset needs confirm RESET', x);
  x = R({ mode: 'reset', keepEmpNo: '99', confirm: 'RESET' });
  ok(!x.ok && x.error === 'not_found', 'reset refuses an unknown number (nothing deleted)', x);
  C.ctx.READ_MEMO_ = {};
  ok(C.ctx.readAll_('employees').length === 3, 'a refused reset changes nothing');
  const auditBefore = C.ctx.readAll_('audit').length;
  x = R({ mode: 'reset', keepEmpNo: '1', confirm: 'RESET' });
  ok(x.ok && x.kept.id === owner.id && x.removed.employees === 2, 'reset keeps the one employee', x);
  C.ctx.READ_MEMO_ = {};
  const emps = C.ctx.readAll_('employees');
  ok(emps.length === 1 && emps[0].id === owner.id && emps[0].managerId === '', 'only the owner stays, the link to a removed manager is blanked', emps);
  ok(C.ctx.readAll_('departments')[0].headEmpId === '', 'a department headed by a removed person loses the head, not the department');
  ok(C.ctx.readAll_('empPrivate').map(p => p.empId).join() === owner.id, 'private rows of removed people are gone, the owner keeps theirs');
  ok(C.ctx.readAll_('punches').map(p => p.id).join() === 'PX2', 'punches of removed people are gone, the owner keeps theirs');
  ok(C.ctx.readAll_('credentials').every(c => c.empId === owner.id) && C.ctx.readAll_('credentials').length >= 1, 'the owner keeps their device');
  ok(!C.ctx.readAll_('payrollRuns').length && !C.ctx.readAll_('payslips').length && !C.ctx.readAll_('snapshots').length, 'the payroll books are empty');
  ok(C.ctx.readAll_('audit').length >= auditBefore, 'the audit trail stays');
  x = C.call({ action: 'me', token: tk });
  ok(x.ok, 'the owner is still signed in after the reset', x);
}

// ---------------- approved payroll sheets into a clean organisation ----------------
console.log('Sheet import');
{
  const C = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-05T06:00:00Z') });
  const bt = C.call({ action: 'bootstrap', setupKey: 'k', name: 'المالك', empNo: '1000' });
  const dv = new Authenticator();
  const e1 = C.call({ action: 'enrollBegin', empNo: '1000', code: bt.activationCode });
  const tk = C.call({ action: 'enrollFinish', credential: dv.create(e1.options) }).token;
  const fresh2 = () => { C.ctx.READ_MEMO_ = {}; C.ctx.USE_TAB_CACHE_ = false; C.ctx.TAB_PREFETCH_ = null; };
  const P = (o) => Object.assign({ nationality: 'باكستاني', department: 'Operations', position: 'Driver', sponsor: 'شركة أ', costCenter: 'HQ', reliability: 'Sponsored',
    joined: '2024-01-01', lastDay: '', status: 'Active', months: ['2026-08', '2026-09'], isSaudi: false, iban: '', ibanOk: false, payToOther: false, bank: '' }, o);
  const people = [
    P({ nid: '3630000001', empNo: '1000', name: 'المالك من الكشف', department: 'Finance', position: 'Finance lead', payToOther: true, iban: 'SA0380000000608010167519', ibanOk: true }),
    P({ nid: '1000000001', empNo: '1001', name: 'سعود', nationality: 'سعودي', isSaudi: true, reliability: 'Saudi', iban: 'SA0380000000608010167519', ibanOk: true, bank: 'Al Rajhi', sponsor: 'شركة ب' }),
    P({ nid: '2000000002', empNo: '1002', name: 'Imran Khan', sponsor: 'Outsource' }),
    P({ nid: '2000000003', empNo: '1003', name: 'Left Early', months: ['2026-08'] }),
    P({ nid: '2000000004', empNo: '1004', name: 'Not Paid', months: ['2026-08', '2026-09'] }),
  ];
  const L = (nid, o) => Object.assign({ nid, row: 2, payMethod: 'WPS', basic: 0, housing: 0, transport: 0, otherAllow: 0, bonus: 0, gross: 0, gosi: 0, penalties: 0, loan: 0, leave: 0, newJoiner: 0, otherDed: 0, totalDed: 0, net: 0 }, o);
  const months = {
    '2026-08': [L('3630000001', { basic: 8250, housing: 3300, transport: 4950, gross: 16500, otherDed: 11000, totalDed: 11000, net: 5500 }),
      L('1000000001', { basic: 4000, gross: 4000, gosi: 390, totalDed: 390, net: 3610 }), L('2000000002', { basic: 2000, housing: 500, transport: 500, gross: 3000, net: 3000 }),
      L('2000000003', { basic: 2000, gross: 2000, net: 2000 }), L('2000000004', {})],
    '2026-09': [L('3630000001', { basic: 8250, housing: 3300, transport: 4950, gross: 16500, net: 16500 }),
      L('1000000001', { basic: 4500, gross: 4800, bonus: 300, gosi: 438.75, loan: 100, totalDed: 538.75, net: 4261.25 }),
      L('2000000002', { basic: 2000, housing: 500, transport: 500, otherAllow: 200, gross: 3200, penalties: 50, leave: 100, newJoiner: 10, totalDed: 160, net: 3040 }), L('2000000004', {})],
  };
  const I = extra => C.call(Object.assign({ action: 'demoData', setupKey: 'k', mode: 'sheetImport', ownerNo: '1000', depts: { Operations: 'العمليات', Finance: 'المالية' }, people, months }, extra));
  let x = C.call({ action: 'demoData', setupKey: 'wrong', mode: 'sheetImport', ownerNo: '1000', people, months });
  ok(!x.ok && x.error === 'bad_setup_key', 'the sheet import needs the setup key', x);
  const before = { emps: C.ctx.readAll_('employees').length, runs: C.ctx.readAll_('payrollRuns').length };
  x = I({});
  ok(x.ok && x.dryRun === true && x.employees === 4 && x.runs === 6 && x.payslips === 7, 'a dry run is the default and reports what it would do', x);
  ok(x.months && x.months['2026-08'].net === 14110 && x.months['2026-09'].net === 23801.25, 'month totals are the sheet\'s nets', x.months);
  fresh2();
  ok(C.ctx.readAll_('employees').length === before.emps && C.ctx.readAll_('payrollRuns').length === before.runs && !C.ctx.readAll_('departments').length, 'a dry run writes nothing');
  x = I({ months: Object.assign({}, months, { '2026-09': months['2026-09'].map(l => l.nid === '2000000002' ? Object.assign({}, l, { net: 3041 }) : l) }) });
  ok(!x.ok && x.error === 'net_mismatch' && x.mismatch[0].empNo === '1002', 'a line whose parts do not give its net is refused', x);
  x = I({ dryRun: false });
  ok(x.ok && x.dryRun === false && x.employees === 4 && x.payGroups.length === 3, 'the import writes: people, three pay groups (one per sponsor)', x);
  fresh2();
  const emps = C.ctx.readAll_('employees'), byNo = Object.fromEntries(emps.map(e => [String(e.empNo), e]));
  ok(emps.length === 5 && byNo['1000'].role === 'admin' && byNo['1000'].title === 'Finance lead' && byNo['1000'].department === 'المالية', 'the owner is updated in place and keeps the admin role', byNo['1000']);
  ok(byNo['1003'].status === 'disabled' && byNo['1003'].lastWorkingDay === '2026-08-31' && byNo['1001'].status === 'active', 'someone missing from the latest sheet is disabled with a last working day');
  ok(byNo['1002'].employmentType === 'outsourced' && byNo['1002'].nameEn === 'Imran Khan' && byNo['1001'].isSaudi === true, 'outsourced, English name and Saudi flags are kept');
  const priv = Object.fromEntries(C.ctx.readAll_('empPrivate').map(p => [p.empId, p]));
  ok(String(priv[byNo['1000'].id].borderNo) === '3630000001' && !priv[byNo['1000'].id].nationalId, 'an ID that does not start with 1 or 2 is kept as the border number');
  ok(!priv[byNo['1000'].id].iban && priv[byNo['1001'].id].iban === 'SA0380000000608010167519', 'an IBAN paid to someone else is not stored; the person\'s own is');
  const comps = C.ctx.readAll_('compensation');
  ok(comps.filter(c => c.empId === byNo['1001'].id).length === 2 && comps.every(c => c.status === 'approved'), 'packages are approved and a new one starts when the amounts change');
  ok(!comps.some(c => c.empId === byNo['1004'].id), 'nobody gets a package from a zero line');
  const runs = C.ctx.readAll_('payrollRuns'), slips = C.ctx.readAll_('payslips');
  ok(runs.length === 6 && runs.every(r => r.status === 'locked' && r.scope === 'import' && /^PR-/.test(r.ref)), 'one locked imported run per month and pay group, numbered', runs.map(r => r.ref));
  ok(slips.length === 7 && !slips.some(s => s.empId === byNo['1004'].id), 'no payslip for a line with nothing paid');
  const s9 = slips.filter(s => s.empId === byNo['1002'].id && s.month === '2026-09')[0], l9 = JSON.parse(s9.linesJson);
  ok(Number(s9.net) === 3040 && l9.some(l => l.code === 'unpaid_leave' && l.amount === 100) && l9.some(l => l.label === 'انضمام جديد'), 'payslip lines follow the sheet columns', l9);
  ok(C.ctx.readAll_('wpsLog').length === 6 && C.ctx.readAll_('wpsLog').every(w => w.status === 'confirmed'), 'each imported run carries a confirmed WPS line');
  const cal = C.call({ action: 'complianceCalendar', token: tk });
  ok(cal.ok && !cal.items.some(i => (i.kind === 'wps_upload' || i.kind === 'payroll_not_locked') && (i.month === '2026-08' || i.month === '2026-09')), 'imported months raise no WPS or payroll duty', cal.items && cal.items.map(i => i.kind + ':' + i.month));
  x = I({ dryRun: false });
  ok(!x.ok && x.error === 'not_empty', 'a second import is refused (rollback is the reset)', x);
  // owner package decision: the package is what is paid, GOSI keeps the registered wage
  const S = extra => C.call(Object.assign({ action: 'demoData', setupKey: 'k', mode: 'packageSet' }, extra));
  const rows = [{ empNo: '1001', effectiveFrom: '2026-10-01', basic: 1390, gosiWage: 4000 }];
  x = S({ rows });
  ok(x.ok && x.dryRun && x.packages === 1 && x.rows[0].package === 1390, 'package change: dry run by default', x);
  fresh2(); ok(C.ctx.readAll_('compensation').length === comps.length, 'a dry run adds no package');
  ok(!S({ rows: [{ empNo: '9999', effectiveFrom: '2026-10-01', basic: 1 }], dryRun: false }).ok, 'an unknown employee number is refused');
  x = S({ rows, dryRun: false });
  fresh2();
  const nc = C.ctx.readAll_('compensation').filter(c => c.empId === byNo['1001'].id && c.effectiveFrom === '2026-10-01')[0];
  const np = C.ctx.readAll_('empPrivate').filter(p => p.empId === byNo['1001'].id)[0];
  ok(x.ok && nc && nc.status === 'approved' && Number(nc.basic) === 1390 && Number(np.gosiWage) === 4000, 'the new package is approved from its month and the registered GOSI wage is kept', { nc, np });
  ok(C.ctx.readAll_('compensation').filter(c => c.empId === byNo['1001'].id).length === 3, 'earlier packages stay (append-only history)');
  x = C.call({ action: 'me', token: tk });
  ok(x.ok, 'the owner is still signed in after the import', x);
  // full-period reload over the import (sheetYear)
  const Y = extra => C.call(Object.assign({ action: 'demoData', setupKey: 'k', mode: 'sheetYear', ownerNo: '1000', depts: {} }, extra));
  const yPeople = people.map(p => Object.assign({}, p, { months: p.nid === '2000000003' ? ['2026-07', '2026-08'] : ['2026-07', '2026-08', '2026-09'] }))
    .concat([P({ nid: '2000000009', empNo: '1009', name: 'Early Leaver', months: ['2026-07'] }), P({ nid: 'NOID-2026-07-R5', noId: true, empNo: '1010', name: 'بلا هوية', months: ['2026-07'] })]);
  const yMonths = { '2026-07': [L('NOID-2026-07-R5', { basic: 500, gross: 500, net: 500 }), L('2000000009', { basic: 1000, gross: 1000, net: 1000 }), L('1000000001', { basic: 4000, gross: 4000, net: 4000 })],
    '2026-08': months['2026-08'], '2026-09': months['2026-09'], '2026-10': [L('1000000001', { net: 3900, transferred: 4000, advanceSelf: 100 })] };
  x = Y({ people: yPeople, months: yMonths, netOnly: ['2026-10'] });
  ok(x.ok && x.dryRun && x.removed.runs === 6 && x.newEmployees === 2 && x.newDisabled === 2, 'reload dry run: removes the old import, adds the early leaver', x);
  fresh2(); ok(C.ctx.readAll_('payrollRuns').length === 6, 'a reload dry run changes nothing');
  ok(!Y({ people: yPeople.map(p => p.nid === '2000000009' ? Object.assign({}, p, { empNo: '1001' }) : p), months: yMonths, netOnly: ['2026-10'], dryRun: false }).ok, 'a taken employee number is refused');
  x = Y({ people: yPeople, months: yMonths, netOnly: ['2026-10'], notes: { '2026-07': 'NOTE-JUL' }, dryRun: false });
  fresh2();
  const e2 = Object.fromEntries(C.ctx.readAll_('employees').map(e => [String(e.empNo), e]));
  ok(x.ok && e2['1009'] && e2['1009'].status === 'disabled' && e2['1009'].lastWorkingDay === '2026-07-31' && e2['1000'].role === 'admin', 'new early leaver numbered and disabled; owner kept', x);
  const runs2 = C.ctx.readAll_('payrollRuns');
  ok(e2['1010'] && e2['1010'].status === 'disabled' && !C.ctx.readAll_('empPrivate').some(p => p.empId === e2['1010'].id && (p.nationalId || p.borderNo)), 'a sheet row with no ID gets its own record and no ID');
  ok(runs2.filter(r => r.month === '2026-07').every(r => r.note.indexOf('NOTE-JUL') >= 0) && runs2.filter(r => r.month === '2026-08').every(r => r.note.indexOf('NOTE-JUL') < 0), 'the month note is on that month runs only');
  ok(runs2.every(r => r.status === 'locked' && r.scope === 'import') && runs2.some(r => r.month === '2026-10'), 'every month is a locked imported run, October included', runs2.map(r => r.month));
  const oct = C.ctx.readAll_('payslips').find(s => s.month === '2026-10');
  ok(oct && Number(oct.net) === 3900 && JSON.parse(oct.infoJson).info.advanceSelf === 100, 'net-only month: one approved-net line, transfer details kept', oct && oct.infoJson);
  ok(C.ctx.readAll_('compensation').some(c => c.enteredBy === 'owner' && c.effectiveFrom === '2026-10-01'), 'the owner package decision is kept');
  ok(!C.ctx.readAll_('compensation').some(c => c.enteredBy === 'import' && c.empId === e2['1001'].id && c.effectiveFrom >= '2026-10-01'), 'no imported package overrides an owner package');
  const aug = C.ctx.readAll_('payslips').filter(s => s.month === '2026-08'), runIds = new Set(runs2.map(r => r.id));
  ok(aug.length === 4 && C.ctx.readAll_('wpsLog').length === runs2.length && C.ctx.readAll_('payslips').every(s => runIds.has(s.runId)) && C.ctx.readAll_('wpsLog').every(w => w.status === 'confirmed' && runIds.has(w.runId)), 'old payslips replaced, not doubled', { aug: aug.length, wps: C.ctx.readAll_('wpsLog').length });
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
