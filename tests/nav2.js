// The new navigation (redesign 2026-11-18): every page of the old 14 areas has a place in the six spaces + Inbox, so no address
// is lost; each space's primary tabs stay few; the strings exist in both languages. node tests/nav2.js
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let passed = 0, failed = 0;
const ok = (c, n, x) => { if (c) { passed++; console.log('  ok  ' + n); } else { failed++; console.log('  FAIL ' + n + (x !== undefined ? '  -> ' + JSON.stringify(x) : '')); } };
const a = src.indexOf('var AREAS = ['), b = src.indexOf('\n];', a);
const areasTxt = src.slice(a, b);
const old = []; let area = null;
areasTxt.split('\n').forEach(l => { const m = l.match(/\{ id: '([a-z]+)', i: '/); if (m) area = m[1]; const re = /\{ id: '([a-z]+)', n: '/g; let x; while ((x = re.exec(l))) old.push(area + ':' + x[1]); });
const d0 = src.indexOf('var SPACES_DEF = ['), d1 = src.indexOf('\n];', d0), def = src.slice(d0, d1);
const used = new Set((def.match(/\['([a-z]+:[a-z]+)'/g) || []).map(s => s.slice(2, -1)));
const missing = old.filter(k => !used.has(k));
ok(old.length > 90, 'the old menu has ' + old.length + ' pages');
ok(missing.length === 0, 'every old page has a place in the new navigation', missing);
const bad = [...used].filter(k => !old.includes(k));
ok(bad.length === 0, 'every page the new navigation names exists', bad);
const spaces = def.split('\n  { id: ').slice(1).map(s => ({ id: s.match(/^'([a-z]+)'/)[1], primary: (s.match(/\['[a-z@]+:?[a-z]*', '[a-z]+'(, 0, '[A-Za-z]+')?\]/g) || []).length }));
ok(spaces.map(s => s.id).join() === 'today,me,team,people,pay,insights,settings,inbox', 'six spaces, Today and Inbox', spaces.map(s => s.id));
ok(spaces.every(s => s.primary <= 10), 'no space shows more than 10 primary tabs (the rest sit behind More)', spaces);
['arToday', 'arMe', 'arTeam', 'arInbox', 'navMore', 'vwDecide', 'tdMyDay', 'tdWaiting', 'tdOpenInbox'].forEach(k => {
  const n = src.split(' ' + k + ":'").length - 1; ok(n === 2, k + ' exists in Arabic and English', n);
});
ok(/function goArea[\s\S]{0,700}nav2Key\(area, sub\)/.test(src), 'goArea sends every old address through the new map');
ok(/isPunchPage\(a\.id, s\.id\)/.test(src) && !/a\.id === 'time' && s\.id === 'punch'/.test(src), 'the check-in screen is recognised in both navigations');
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
