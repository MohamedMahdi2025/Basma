// Opening leave balances in bulk (2026-11-04): HR uploads empNo, hire date, remaining days, as-of date. node tests/leaveopening.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-04T06:00:00Z') });
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
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const E = no => direct(() => B.ctx.findBy_('employees', 'empNo', no));
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
person('1000', 'مدير', 'admin');
person('3001', 'موارد بشرية', 'hr');
person('5001', 'صبحي', 'employee');
person('5002', 'سارة', 'employee');
person('5003', 'خالد', 'employee');
let r = call('5001', 'myRequests');
ok(r.ok && r.leave.annual.balance < 1, 'before: no opening balance, so almost nothing accrued since go-live', r.leave && r.leave.annual);

console.log('Validation: all or nothing');
r = call('3001', 'leaveOpeningImport', { rows: [] });
ok(r.error === 'no_rows', 'an empty sheet is refused', r);
r = call('3001', 'leaveOpeningImport', { rows: [
  { empNo: '5001', hireDate: '2019-03-01', days: 18.5, asOf: '2026-10-31' },
  { empNo: '9999', days: 5, asOf: '2026-10-31' },
  { empNo: '5002', days: 'abc', asOf: '2026-10-31' },
  { empNo: '5003', hireDate: '2027-01-01', days: 4, asOf: '2026-10-31' },
  { empNo: '5001', days: 3, asOf: '2026-10-31' },
  { empNo: '3001', days: 30, asOf: '2026-10-31' },
  { empNo: '1000', days: 2, asOf: '2027-01-01' }] });
const errs = (r.errors || []).map(e => e.row + ':' + e.field + ':' + e.error);
ok(r.error === 'invalid_rows' && ['1:empNo:not_found', '2:days:bad_value', '3:hireDate:future_date', '4:empNo:duplicate', '5:empNo:cannot_change_own_balance', '6:asOf:future_date'].every(x => errs.includes(x)), 'every bad row is named with its field', errs);
ok(E('5001').leaveOpeningDays === '' || E('5001').leaveOpeningDays == null, 'nothing was saved, not even the good row', E('5001').leaveOpeningDays);
r = call('3001', 'leaveOpeningImport', { rows: [{ empNo: '5001', hireDate: '2026-11-01', days: 3, asOf: '2026-10-31' }] });
ok(r.errors && r.errors[0].error === 'after_as_of', 'a hire date after the as-of date is refused', r);

console.log('Saving');
r = call('3001', 'leaveOpeningImport', { rows: [
  { empNo: '5001', hireDate: '2019-03-01', days: '18,5', asOf: '2026-10-31' },
  { empNo: 5002, hireDate: '', days: 7, asOf: '2026-10-31' },
  { empNo: '5003', days: -2, asOf: '2026-10-31' }] });
ok(r.ok && r.saved === 3 && r.hireDates === 1, 'three balances saved, one hire date set', r);
ok(Number(E('5001').leaveOpeningDays) === 18.5 && String(E('5001').leaveOpeningDate).slice(0, 10) === '2026-10-31' && String(E('5001').hireDate).slice(0, 10) === '2019-03-01', 'Sobhy: 18.5 days as at 31 October, hired March 2019');
r = call('5001', 'myRequests');
ok(r.leave.annual.perYear === 30 && !r.leave.annual.openingMissing && near(r.leave.annual.balance, 18.5 + 4 * 30 / 365), 'his balance is now 18.5 plus 4 days at 30 a year (over 5 years of service)', r.leave.annual);
ok(near(call('5003', 'myRequests').leave.annual.balance, -2 + 4 * 21 / 365), 'a negative carried-over balance (leave taken in advance) is kept');
const log = direct(() => B.ctx.readAll_('audit')).filter(a => a.action === 'leave_opening');
ok(log.length === 3 && log.every(a => JSON.parse(a.detail).source === 'import' && a.actorId === ids['3001']), 'each change is in the audit log, by HR, marked as an import');

console.log('Access');
ok(call('5002', 'leaveOpeningImport', { rows: [{ empNo: '5002', days: 99, asOf: '2026-10-31' }] }).ok !== true, 'an employee cannot upload balances');
r = call('3001', 'leaveOpeningImport', { rows: [{ empNo: '1000', days: 12, asOf: '2026-10-31' }] });
ok(r.ok && Number(E('1000').leaveOpeningDays) === 12, 'HR loads the administrator\'s balance', r);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
