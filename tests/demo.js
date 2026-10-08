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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
