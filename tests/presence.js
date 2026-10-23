// Live office map (after Roam's floor map): node tests/presence.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const T0 = Date.parse('2026-10-04T07:00:00Z'); // Sunday 2026-10-04, 10:00 in Riyadh
const B = load({ setupKeyHash: sha('k'), now: T0 });

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
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));
let pn = 0;
const punch = (no, type, hm, zoneId) => direct(() => B.ctx.append_('punches', { id: 'P' + (++pn), empId: ids[no], type, ts: '2026-10-04T' + hm + ':00+03:00', date: '2026-10-04', zoneId: zoneId || '', status: 'ok', flags: '' }));
const req = (no, type, subtype) => direct(() => B.ctx.append_('requests', { id: 'R' + (++pn), empId: ids[no], type, subtype: subtype || '', status: 'approved', fromDate: '2026-10-03', toDate: '2026-10-06' }));

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
[['5001', 'مدير المبيعات'], ['5002', 'سعد في المقر'], ['5003', 'نورة عن بعد'], ['5004', 'خالد في إجازة'], ['5005', 'فهد في رحلة'],
  ['5006', 'سارة انصرفت'], ['5007', 'ماجد لم يحضر'], ['5008', 'ريم في الفرع']].forEach(p => person(p[0], p[1], 'employee'));
call('3001', 'hrEmpSave', { emp: { id: ids['5002'], managerId: ids['5001'] } });
const hq = call('1000', 'zoneSave', { zone: { name: 'المقر الرئيسي', lat: 24.7, lng: 46.7, radius: 150 } }).zone;
const br = call('1000', 'zoneSave', { zone: { name: 'فرع جدة', lat: 21.5, lng: 39.2, radius: 150 } }).zone;
ok(hq && br, 'two offices (zones) exist', [hq, br]);
punch('5002', 'in', '08:40', hq.id);
punch('5006', 'in', '07:55', hq.id); punch('5006', 'out', '09:30', hq.id);
punch('5008', 'in', '07:58', br.id);
req('5003', 'remote'); req('5004', 'leave', 'annual'); req('5005', 'travel');

console.log('What a colleague sees');
let m = call('5007', 'officeMap');
const P = (r, no) => r.people.filter(p => p.id === ids[no])[0];
ok(m.ok && m.date === '2026-10-04', 'every employee can open the office map', m.error);
ok(P(m, '5002').presence === 'office' && P(m, '5002').zone === hq.id && P(m, '5002').since, 'someone checked in shows in the room of the office they checked in at, with the time');
ok(P(m, '5008').presence === 'office' && P(m, '5008').zone === br.id, 'the branch has its own room (office tags, as Roam shows for hybrid companies)');
ok(P(m, '5003').presence === 'remote', 'an approved remote day shows as remote before any check-in');
ok(P(m, '5005').presence === 'trip', 'an approved business trip shows as a work trip');
ok(P(m, '5006').presence === 'done', 'someone who checked out shows as left for the day');
ok(P(m, '5004').presence === 'away' && P(m, '5007').presence === 'away', 'leave and absence both show only as "away"');
ok(!P(m, '5004').day && !P(m, '5002').day && !JSON.stringify(m.people.filter(p => !p.me)).match(/annual|absent|lateMin/), 'a colleague never learns the leave type, lateness or absence of others');
ok(P(m, '5007').day && P(m, '5007').day.status === 'absent' && P(m, '5007').me, 'but you see your own day in full');
ok(m.counts.office === 2 && m.counts.remote === 1 && m.counts.trip === 1 && m.counts.done === 1, 'the counts add up', m.counts);
ok(m.zones.filter(z => z.id === hq.id)[0].count === 1 && m.zones.filter(z => z.id === br.id)[0].count === 1, 'each office counts who is in it now');
ok(!m.full, 'an employee does not get the full view');

console.log('Managers and HR');
m = call('5001', 'officeMap');
ok(P(m, '5002').day && P(m, '5002').day.lateMin > 0, 'a manager sees the day status (lateness) of their own people', P(m, '5002'));
ok(!P(m, '5007').day, 'but not of anyone outside their team');
m = call('3001', 'officeMap');
ok(m.full && P(m, '5004').day.status === 'leave' && P(m, '5007').day.status === 'absent', 'HR sees everyone in full', m.full);

console.log('My status ("will return")');
let r = call('5002', 'presenceSet', { text: 'في اجتماع حتى الثانية', until: new Date(T0 + 3600e3).toISOString() });
ok(r.ok && r.note.text === 'في اجتماع حتى الثانية', 'anyone sets a short status', r);
m = call('5007', 'officeMap');
ok(P(m, '5002').note && P(m, '5002').note.text === 'في اجتماع حتى الثانية', 'colleagues see it on the map');
ok(call('5002', 'presenceSet', { text: 'x', until: new Date(T0 - 60e3).toISOString() }).error === 'bad_date', 'an end time in the past is refused');
ok(call('5002', 'presenceSet', { text: 'x'.repeat(200) }).note.text.length === 60, 'a status is at most 60 characters');
call('5002', 'presenceSet', { text: 'استراحة', until: new Date(T0 + 1800e3).toISOString() });
B.setNow(T0 + 2400e3);
ok(!P(call('5007', 'officeMap'), '5002').note, 'a status disappears at its end time');
call('5003', 'presenceSet', { text: 'تركيز' }); call('5003', 'presenceSet', { text: '' });
ok(!P(call('5007', 'officeMap'), '5003').note, 'an empty status clears it');
ok(direct(() => B.ctx.readAll_('presenceNotes').filter(n => n.empId === ids['5003']).length) === 1, 'one row per person, updated in place');
ok(!B.raw({ action: 'officeMap', orgId: '1001' }).ok, 'the map needs a signed-in session');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
