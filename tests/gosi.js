// GOSI work queue (2026-11-06): register joiners, update insured wages, terminate leavers, data readiness. node tests/gosi.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-06T06:30:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no) { if (toks[no]) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
person('1000', 'المدير', 'admin'); person('3001', 'الموارد البشرية', 'hr');
person('5001', 'سعودي جديد', 'employee'); person('5002', 'مقيم قديم', 'employee'); person('5003', 'مغادر', 'employee'); person('5004', 'بلا هوية', 'employee');
const set = (no, emp, priv, basic) => direct(() => {
  const e = B.ctx.findBy_('employees', 'empNo', no); Object.assign(e, emp); B.ctx.update_('employees', e);
  B.ctx.append_('empPrivate', Object.assign({ empId: e.id }, priv));
  if (basic) B.ctx.append_('compensation', { id: 'C' + no, empId: e.id, effectiveFrom: '2026-01-01', basic, housing: basic / 4, transport: 500, otherJson: '{}', status: 'approved', currency: 'SAR' });
});
set('5001', { isSaudi: true, hireDate: '2026-10-01' }, { nationalId: '1012345678', birthDate: '1995-02-01', gosiCohort: 'new' }, 8000);
set('5002', { isSaudi: false, hireDate: '2020-01-01' }, { nationalId: '2012345678', birthDate: '1988-05-05', gosiNumber: 'G-77', gosiWage: 6000 }, 6000);
set('5003', { isSaudi: false, hireDate: '2021-01-01', status: 'terminated', lastWorkingDay: '2026-10-31' }, { nationalId: '2099999999', birthDate: '1990-01-01', gosiNumber: 'G-88', gosiWage: 4000 }, 4000);
set('5004', { isSaudi: true, hireDate: '2026-11-01' }, {}, 5000);

let r = call('5001', 'gosiQueue');
ok(r.error === 'forbidden', 'an employee cannot see the GOSI queue');
r = call('3001', 'gosiQueue');
const of = (no, kind) => r.items.find(x => x.emp.id === ids[no] && x.kind === kind);
ok(r.ok && of('5001', 'register') && of('5001', 'register').due === '2026-10-16' && of('5001', 'register').overdue, 'a joiner hired 1 October must be registered by the 16th: overdue', of('5001', 'register'));
ok(of('5001', 'register').wage === 10000, 'insured wage = basic + housing', of('5001', 'register').wage);
ok(of('5002', 'update_wage') && of('5002', 'update_wage').from === 6000 && of('5002', 'update_wage').wage === 7500, 'a registered resident whose basic + housing (7500) differs from the registered 6000 needs a wage update', of('5002', 'update_wage'));
ok(of('5003', 'terminate') && of('5003', 'terminate').due === '2026-11-15', 'a leaver on 31 October must be terminated by 15 November', of('5003', 'terminate'));
ok(of('5004', 'register').issues.indexOf('gosi_no_id') >= 0 && of('5004', 'register').issues.indexOf('gosi_no_birth') >= 0 && of('5004', 'register').issues.indexOf('gosi_no_cohort') >= 0, 'readiness: no ID, no birth date, no cohort', of('5004', 'register').issues);
ok(r.connector.configured === false, 'no direct GOSI connection without the organisation\'s own credentials');

console.log('Recording what was done in GOSI');
ok(call('3001', 'gosiMark', { empId: ids['5004'], kind: 'register', ref: 'T-1' }).error === 'gosi_data_incomplete', 'registration is refused while data GOSI needs is missing');
ok(call('3001', 'gosiMark', { empId: ids['5001'], kind: 'register' }).error === 'ref_required', 'GOSI\'s reference is required');
r = call('3001', 'gosiMark', { empId: ids['5001'], kind: 'register', ref: 'GOSI-REG-123', gosiNumber: 'G-99' });
ok(r.ok, 'registered with GOSI\'s reference', r);
r = call('3001', 'gosiQueue');
ok(!of('5001', 'register') && !of('5001', 'update_wage'), 'and the item leaves the queue, with no wage update right after');
ok(direct(() => B.ctx.findBy_('empPrivate', 'empId', ids['5001'])).gosiNumber === 'G-99', 'the GOSI number is saved in the private file');
ok(call('3001', 'gosiMark', { empId: ids['5002'], kind: 'update_wage', ref: 'W-5' }).ok, 'the wage update is recorded');
r = call('3001', 'gosiQueue');
ok(!of('5002', 'update_wage') && Number(direct(() => B.ctx.findBy_('empPrivate', 'empId', ids['5002'])).gosiWage) === 7500, 'the new insured wage (7500) is now the registered one');
ok(call('3001', 'gosiMark', { empId: ids['5002'], kind: 'terminate', ref: 'X' }).error === 'nothing_to_do', 'nothing that is not due can be recorded');
ok(call('3001', 'gosiMark', { empId: ids['3001'], kind: 'register', ref: 'X' }).error === 'cannot_change_self', 'nobody records their own GOSI changes');
ok(call('3001', 'gosiQueue').log.length === 2, 'every action is in the log');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
