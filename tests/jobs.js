// Background job queue: retries, backoff, dead letters, leases, access (2026-11-09). node tests/jobs.js
const crypto = require('crypto');
const { load, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse("2026-11-09T10:00:00Z") });
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const PHONE_A = 'a:' + 'A'.repeat(32), PHONE_B = 'a:' + 'B'.repeat(32), PC = 'w:' + 'P'.repeat(24), TAB = 'w:' + 'T'.repeat(24), OLD = 'w:' + 'O'.repeat(24);
const enrol = (empNo, code, devId, pin) => {
  const d = new DeviceKey(); d.pin = pin || '583920';
  const b = B.call({ action: 'enrollBegin', empNo, code, devId });
  const f = B.call({ action: 'enrollFinish', deviceKey: d.create(b.options), pin: d.pin, label: 'x', devId });
  return { d, f };
};
const admin = enrol('1000', home.activationCode, PHONE_A);
ok(admin.f.ok, 'the administrator activates his phone', admin.f);
let T = admin.f.token;
const code = B.call({ action: 'empSave', token: T, emp: { empNo: '2001', name: 'موظف', role: 'employee' } }).activationCode;
const emp = enrol('2001', code, PHONE_B);
const E = emp.f.token;
const signIn = (empNo, d, devId) => { const b = B.call({ action: 'authBegin', empNo, devId }); return B.call({ action: 'authFinish', credential: d.get(b.options), pin: d.pin, devId }); };
const direct = fn => { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; };
const jobs = () => direct(() => B.ctx.readAll_('jobs'));
const NOW = Date.parse('2026-11-09T10:00:00Z');
let runs = 0, failTimes = 0;
B.ctx.jobHandler_ = kind => kind === 'test' ? (p) => { runs++; if (failTimes > 0) { failTimes--; throw new Error('E:boom'); } } : null;

console.log('Access');
ok(B.call({ action: 'jobRun', token: E }).error === 'forbidden', 'an ordinary employee cannot run the queue');
const r0 = B.call({ action: 'jobRun', token: T });
ok(r0.ok && r0.left === 0 && Object.keys(r0).sort().join() === 'dead,done,failed,left,ok', 'an administrator can; the answer is counts only (no payload, no recipient)', r0);

console.log('Success path');
direct(() => B.ctx.enqueue_('test', { secret: 'x' }, 'u1'));
let r = B.call({ action: 'jobRun', token: T });
ok(r.done === 1 && r.left === 0 && runs === 1, 'a queued job runs once and finishes', r);
ok(jobs()[0].status === 'done', 'and is marked done');

console.log('Retry with backoff, then dead letter');
runs = 0; failTimes = 99;
direct(() => B.ctx.enqueue_('test', {}, 'u1'));
r = B.call({ action: 'jobRun', token: T });
let j = jobs().filter(x => x.status !== 'done')[0];
ok(r.failed === 1 && r.left === 1 && j.status === 'queued' && j.tries === 1 && j.lastError === 'boom', 'a failing job goes back to the queue with its error', j);
ok(Date.parse(j.nextAt) - NOW >= 55000, 'and waits at least a minute before the next try', j.nextAt);
r = B.call({ action: 'jobRun', token: T });
ok(r.done === 0 && runs === 1, 'it is not tried again before it is due');
const waits = [5, 30, 120, 360];
waits.forEach((m, i) => {
  B.setNow(Date.parse(jobs().filter(x => x.status === 'queued')[0].nextAt) + 1000);
  B.call({ action: 'jobRun', token: T });
  const jj = jobs().filter(x => x.status !== 'done')[0];
  if (i < waits.length - 1) ok(jj.status === 'queued' && jj.tries === i + 2, 'try ' + (i + 2) + ' fails and is rescheduled', jj);
  else ok(jj.status === 'dead' && jj.tries === 5, 'after five tries the job is dead and is not tried again', jj);
});
const dead = (B.call({ action: 'auditList', token: T }).rows || []).filter(a => a.action === 'job_dead');
ok(dead.length === 1, 'a dead job is written to the audit trail', dead.length);
const before = runs; B.call({ action: 'jobRun', token: T });
ok(runs === before, 'a dead job never runs again');

console.log('A cut-off job is taken again');
B.setNow(Date.parse('2026-11-09T20:00:00Z'));
direct(() => { B.ctx.enqueue_('test', {}, 'u1'); const row = B.ctx.readAll_('jobs').filter(x => x.status === 'queued')[0]; row.status = 'running'; row.updatedAt = new B.ctx.Date(B.ctx.Date.now() - 11 * 60000).toISOString(); B.ctx.update_('jobs', row); });
failTimes = 0; runs = 0;
T = signIn('1000', admin.d, PHONE_A).token;
r = B.call({ action: 'jobRun', token: T });
ok(r.done === 1 && runs === 1, 'a job left running for more than 10 minutes is picked up and finished', r);

console.log('Unknown kinds do not loop');
direct(() => B.ctx.enqueue_('nope', {}, 'u1'));
r = B.call({ action: 'jobRun', token: T });
ok(r.dead === 2 || jobs().some(x => x.kind === 'nope' && x.status === 'dead'), 'a job nobody can handle is dead at once');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
