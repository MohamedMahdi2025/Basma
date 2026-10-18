// Shifts, rosters, Ramadan hours, summer midday ban: node tests/shifts.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2027-03-01T12:00:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const at = (ds, hm) => new Date(ds + 'T' + hm + ':00+03:00').toISOString();
function punch(no, ds, ins, outs) { direct(() => B.ctx.appendMany_('punches', [['in', ins], ['out', outs]].map(([ty, hm]) => ({ id: 'P' + no + ds + ty, empId: ids[no], type: ty, ts: at(ds, hm), date: ds, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: at(ds, hm) })))); }
function day(no, ds) { return direct(() => { const e = B.ctx.findBy_('employees', 'id', ids[no]); const ps = B.ctx.readAll_('punches').filter(p => p.empId === ids[no] && p.date === ds).sort((a, b) => a.ts < b.ts ? -1 : 1); return B.ctx.summarizeDay_(e, ds, ps, B.ctx.settings_(), new Date(Date.parse('2027-03-01T12:00:00Z')), null); }); }
function setting(k, v) { direct(() => { const row = B.ctx.findBy_('settings', 'key', k); if (row) { row.value = v; B.ctx.update_('settings', row); } else B.ctx.append_('settings', { key: k, value: v }); }); try { B.ctx.CacheService.getScriptCache().remove(B.ctx.SETTINGS_CACHE_KEY); } catch (e) {} }

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
person('5001', 'مشرف التوزيع', 'employee');
['5002', '5003'].forEach(no => person(no, 'سائق ' + no, 'employee'));
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'] } });
direct(() => ['5002', '5003'].forEach(no => { const e = B.ctx.findBy_('employees', 'empNo', no); e.createdAt = '2026-01-01T00:00:00.000Z'; B.ctx.update_('employees', e); }));
let r;

console.log('Shifts');
r = call('5002', 'shiftSave', { shift: { nameAr: 'x', start: '06:00', end: '14:00' } });
ok(!r.ok && r.error === 'forbidden', 'only HR defines shifts', r);
r = call('3001', 'shiftSave', { shift: { nameAr: 'ليلي طويل', start: '20:00', end: '10:00' } });
ok(!r.ok && r.error === 'shift_too_long', 'an overnight shift is also at most 12 hours (20:00-10:00 is 14)', r);
r = call('3001', 'shiftSave', { shift: { nameAr: 'طويل', start: '06:00', end: '20:00' } });
ok(!r.ok && r.error === 'shift_too_long', 'at most 12 hours', r);
r = call('3001', 'shiftSave', { shift: { nameAr: 'صباحي توزيع', start: '06:00', end: '14:00', workdays: '0,1,2,3,4,6', outdoor: true } });
const early = r.shift;
ok(r.ok && early.code === 'SH-001' && early.hours === 8 && early.outdoor, 'a morning outdoor shift, numbered SH-001', r.shift || r);
r = call('3001', 'shiftSave', { shift: { nameAr: 'مسائي', start: '11:00', end: '19:00', outdoor: true } });
const mid = r.shift;

console.log('Rosters');
r = call('3001', 'rosterSave', { empIds: [ids['5002'], ids['5003']], shiftId: early.id, fromDate: '2027-02-01', toDate: '2027-03-31' });
ok(r.ok && r.count === 2, 'two drivers put on the morning shift for Feb-Mar');
r = call('3001', 'rosterSave', { empIds: [ids['5003']], shiftId: mid.id, fromDate: '2027-03-15', toDate: '2027-06-30' });
ok(r.ok && r.replaced === 1, 'a later assignment cuts back the earlier one', r);
const ro = direct(() => B.ctx.readAll_('roster')).filter(x => x.empId === ids['5003']);
ok(ro.some(x => x.status === 'active' && String(x.toDate).slice(0, 10) === '2027-03-14') && ro.some(x => x.shiftId === mid.id), 'the first one now ends on 14 March', ro.map(x => [x.shiftId === mid.id ? 'mid' : 'early', x.fromDate, x.toDate, x.status]));
r = call('5001', 'rosterList', { from: '2027-02-01', to: '2027-03-31' });
ok(r.ok && r.rows.length === 1 && r.rows[0].emp.id === ids['5002'], 'a manager sees their own people only', r.rows && r.rows.map(x => x.emp.empNo));
r = call('5003', 'rosterList', {});
ok(!r.ok && r.error === 'forbidden', 'an employee with no team has no roster view', r);

console.log('Attendance follows the roster only when enabled');
punch('5002', '2027-02-10', '06:20', '14:05');
ok(day('5002', '2027-02-10').shiftStart === '08:00', 'rostersEnabled off: the default 08:00 shift still applies');
setting('rostersEnabled', 'true');
let d = day('5002', '2027-02-10');
ok(d.shiftStart === '06:00' && d.lateMin === 20 && d.earlyMin === 0, 'enabled: the 06:00 shift, 20 minutes late', d);
ok(day('5002', '2027-02-12').workday === false && day('5002', '2027-02-13').workday === true, 'the roster workdays apply (Friday off, Saturday on)');

console.log('Ramadan (Art. 98)');
setting('ramadanFrom', '2027-02-08'); setting('ramadanTo', '2027-03-09');
d = day('5002', '2027-02-10');
ok(d.shiftEnd === '12:00' && d.overtimeMin > 0, 'in Ramadan the 8-hour shift ends after 6 hours; work beyond it is overtime', { end: d.shiftEnd, ot: d.overtimeMin });
direct(() => { const e = B.ctx.findBy_('employees', 'id', ids['5002']); e.ramadanReduced = 'no'; B.ctx.update_('employees', e); });
ok(day('5002', '2027-02-10').shiftEnd === '14:00', 'someone marked "no" keeps the full shift');
ok(day('5003', '2027-03-20').shiftEnd === '19:00', 'outside the Ramadan dates nothing changes');

console.log('Summer midday ban');
r = call('3001', 'rosterList', { from: '2027-06-01', to: '2027-06-30' });
ok(r.ok && r.warnings.length === 1 && r.warnings[0].emp.id === ids['5003'] && r.warnings[0].from === '2027-06-15', 'an outdoor 11:00-19:00 shift in the ban season is reported from 15 June', r.warnings);
r = call('3001', 'rosterList', { from: '2027-03-01', to: '2027-03-31' });
ok(r.ok && r.warnings.length === 0, 'no warning outside the season');


console.log('Overnight shifts (2026-10-18)');
r = call('3001', 'shiftSave', { shift: { nameAr: 'ليلي', start: '22:00', end: '06:00' } });
ok(r.ok && r.shift.overnight && r.shift.hours === 8, 'a 22:00-06:00 shift is accepted as an 8-hour overnight shift', r.shift || r);
person('5009', 'حارس ليلي', 'employee');
direct(() => { const e = B.ctx.findBy_('employees', 'empNo', '5009'); e.shiftStart = '22:00'; e.shiftEnd = '06:00'; e.createdAt = '2026-01-01T00:00:00.000Z'; B.ctx.update_('employees', e); });
const D = '2027-02-22';
direct(() => B.ctx.appendMany_('punches', [['in', at(D, '22:07')], ['out', at('2027-02-23', '06:03')]].map(([ty, ts]) => ({ id: 'PN' + ty, empId: ids['5009'], type: ty, ts, date: D, lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: ts }))));
const nd = day('5009', D);
ok(nd.overnight && nd.workedMin === 476 && nd.earlyMin === 0 && nd.status === 'present', 'in 22:07, out 06:03 next morning: 476 minutes worked, not early, present', nd);
direct(() => B.ctx.appendMany_('punches', [['in', at('2027-02-23', '22:40')], ['out', at('2027-02-24', '05:00')]].map(([ty, ts]) => ({ id: 'PM' + ty, empId: ids['5009'], type: ty, ts, date: '2027-02-23', lat: '', lng: '', acc: 10, zoneId: '', distance: 5, status: 'ok', risk: 0, flags: '', source: 'app', note: '', reviewBy: '', reviewAt: '', credId: '', ua: '', createdAt: ts }))));
const n2 = day('5009', '2027-02-23');
ok(n2.shiftEnd === '04:00' && n2.lateMin === 40 && n2.earlyMin === 0 && n2.overtimeMin === 20, 'in Ramadan (6 h) the 22:00 shift ends 04:00: in 22:40 is 40 min late, out 05:00 is not early', n2);
const wd = (iso) => direct(() => B.ctx.workDate_(B.ctx.findBy_('employees', 'empNo', '5009'), new Date(iso), B.ctx.settings_()));
ok(wd('2027-02-23T03:00:00+03:00') === '2027-02-22', 'a punch at 03:00 files under the shift that began the evening before', wd('2027-02-23T03:00:00+03:00'));
ok(wd('2027-02-23T13:00:00+03:00') === '2027-02-23', 'after midday it is the new day again', wd('2027-02-23T13:00:00+03:00'));
const dayEmp = direct(() => B.ctx.findBy_('employees', 'empNo', '5002'));
ok(direct(() => B.ctx.workDate_(dayEmp, new Date('2027-02-23T03:00:00+03:00'), B.ctx.settings_())) === '2027-02-23', 'a day-shift employee is never moved to the previous day');
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
