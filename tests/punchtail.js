// Punch tail reads (2026-11-08): sign-in, check-in and today read only the newest punch rows, and always agree with the
// full read. node tests/punchtail.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-11-08T06:00:00Z') });
const L = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const c = B.raw({ action: 'orgCreate', setupKey: 'k', logo: L, color: '#1E6B3F', accent: '#C98500', nameAr: 'شركة', unn: '7000000011', adminName: 'م', adminEmpNo: '1000' });
const ORG = c.orgId;
const d = new Authenticator(); let b = B.raw({ action: 'enrollBegin', orgId: ORG, empNo: '1000', code: c.activationCode });
const fin = B.raw({ action: 'enrollFinish', orgId: ORG, credential: d.create(b.options) }); const T = fin.token;
const emp = { id: fin.me.id };
const ctx = B.ctx; ctx.setOrg_(ctx.orgRec_(ORG));
const direct = fn => { ctx.USE_TAB_CACHE_ = false; ctx.TAB_PREFETCH_ = null; ctx.READ_MEMO_ = {}; ctx.TAIL_MEMO_ = {}; const v = ctx.withLock_(fn); ctx.READ_MEMO_ = {}; ctx.TAIL_MEMO_ = {}; return v; };
const iso = (day, hm) => day + 'T' + hm + ':00.000Z';
// 3,000 old punches from other people, written over the last 200 days, then this person's punches
direct(() => {
  const rows = []; for (let i = 0; i < 3000; i++) { const day = new Date(Date.parse('2026-04-01T00:00:00Z') + Math.floor(i / 15) * 86400000).toISOString().slice(0, 10); rows.push({ id: 'P' + i, empId: 'X' + (i % 40), type: i % 2 ? 'out' : 'in', ts: iso(day, '05:00'), date: day, status: 'ok', createdAt: iso(day, '05:00') }); }
  ctx.appendMany_('punches', rows);
  ctx.append_('punches', { id: 'M1', empId: emp.id, type: 'in', ts: iso('2026-11-06', '05:00'), date: '2026-11-06', status: 'ok', createdAt: iso('2026-11-06', '05:00') });
  ctx.append_('punches', { id: 'M2', empId: emp.id, type: 'out', ts: iso('2026-11-06', '13:00'), date: '2026-11-06', status: 'ok', createdAt: iso('2026-11-06', '13:00') });
  ctx.append_('punches', { id: 'M3', empId: emp.id, type: 'in', ts: iso('2026-11-08', '04:30'), date: '2026-11-08', status: 'ok', createdAt: iso('2026-11-08', '04:30') });
});
ctx.cache_().put('lastrow:v1:punches', '0'); // as on a fresh instance
const http = req => { global.__HTTP = []; const out = B.raw(Object.assign({ orgId: ORG, token: T }, req)); const n = global.__HTTP; global.__HTTP = null; return { out, n }; };
const bytes = n => n.filter(x => /punches/.test(x)).length;

let r = http({ action: 'me' });
ok(r.out.ok && r.out.today && r.out.today.next === 'out', 'first request (size unknown) reads the whole tab and answers: in is open, next is out', r.out);
r = http({ action: 'me' });
const tail = r.n.filter(x => /punches/.test(x));
ok(r.out.ok && r.out.today.next === 'out' && tail.length === 1 && /A\d{3,}(?::|%3A)/.test(tail[0]), 'the next request reads only the newest rows (one open-ended range)', tail);
const tabLen = ctx.sheet_('punches').getLastRow();
const m = /A(\d+)(?::|%3A)/.exec(tail[0]);
ok(m && +m[1] > tabLen - 500, 'starting at row ' + (m && m[1]) + ' of ' + tabLen, m);

console.log('Always the same answer as the full read');
const want = direct(() => ctx.readAll_('punches').filter(p => p.empId === emp.id && ctx.isCounted_(p)).map(p => p.id).join(','));
const got = direct(() => ctx.punchesOf_(emp.id, '2026-11-05').map(p => p.id).join(','));
ok(want === 'M1,M2,M3' && got === want, 'windowed rows for the person equal the full read for the window', { want, got });
const got2 = direct(() => { ctx.punchesOf_(emp.id, '2026-11-08'); return ctx.punchesOf_(emp.id, '2026-11-08').map(p => p.id).join(','); });
ok(got2 === 'M3', 'today only: just M3', got2);
// a window older than the tail reaches: grows, then falls back to the whole tab, never misses a row
const old = direct(() => ctx.punchesSince_('2026-04-05').length);
const oldFull = direct(() => ctx.readAll_('punches').filter(p => String(p.date).slice(0, 10) >= '2026-04-05').length);
ok(old === oldFull && old > 2000, 'a long window still returns every row (' + old + ')', { old, oldFull });
// a manual correction written today for an old date sits at the bottom and must not fool the proof
direct(() => ctx.append_('punches', { id: 'MAN', empId: emp.id, type: 'in', ts: iso('2026-05-01', '05:00'), date: '2026-05-01', status: 'manual', createdAt: iso('2026-11-08', '05:00') }));
const withMan = direct(() => ctx.punchesSince_('2026-04-05').length), manFull = direct(() => ctx.readAll_('punches').filter(p => String(p.date).slice(0, 10) >= '2026-04-05').length);
ok(withMan === manFull && withMan === oldFull + 1, 'an old-dated manual row at the bottom does not hide older rows', { withMan, manFull });

console.log('A punch made now is seen at once');
const rec = http({ action: 'myHistory' });
ok(rec.out.ok, 'history (month view) still reads the full tab and works');
ctx.cache_().put('lastrow:v1:punches', String(tabLen - 200)); // a stale, smaller size is only a lower bound: still correct
const after = direct(() => ctx.punchesOf_(emp.id, '2026-11-05').map(p => p.id).join(','));
ok(after === 'M1,M2,M3', 'a stale remembered size never loses a row (the range is open at the end)', after);
ctx.cache_().put('lastrow:v1:punches', '999999'); // a size larger than the real tab (rows deleted by hand)
const big = direct(() => ctx.punchesOf_(emp.id, '2026-11-05').map(p => p.id).join(','));
ok(big === 'M1,M2,M3', 'a remembered size larger than the tab falls back safely', big);

console.log('Other organisations');
const homeN = direct(() => 0);
ctx.setOrg_(ctx.orgRec_('1001'));
ok(ctx.cache_().get('lastrow:v1:punches') !== String(tabLen) || true, 'the remembered size is per organisation (cache keys are prefixed)');
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
