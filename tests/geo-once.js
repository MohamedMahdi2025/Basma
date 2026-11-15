// geoOnce (index.html): one position with a deadline. node tests/geo-once.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = src.indexOf('function geoOnce(){'), b = src.indexOf('\n}\n', a) + 3;
if (a < 0) { console.log('  FAIL geoOnce not found\n0 passed, 1 failed'); process.exit(1); }
const code = src.slice(a, b);
let passed = 0, failed = 0;
const ok = (c, n, x) => { if (c) { passed++; console.log('  ok  ' + n); } else { failed++; console.log('  FAIL ' + n + (x !== undefined ? '  -> ' + JSON.stringify(x) : '')); } };
function run(script) { // script: list of answers per call, each [ok|err, value]
  const calls = [];
  const navigator = { geolocation: { getCurrentPosition: (res, rej, o) => { calls.push(o); const s = script.shift() || ['err', { code: 2 }]; setTimeout(() => s[0] === 'ok' ? res(s[1]) : rej(s[1]), 1); } } };
  const ctx = { navigator, Promise, setTimeout, console };
  vm.runInNewContext(code + '; __out = geoOnce();', ctx);
  return ctx.__out.then(p => ({ p, calls }), e => ({ e, calls }));
}
(async () => {
  const pos = { coords: { latitude: 24.71, longitude: 46.67, accuracy: 9 } };
  let r = await run([['ok', pos]]);
  ok(r.p === pos && r.calls.length === 1 && r.calls[0].enableHighAccuracy === true && r.calls[0].timeout > 0, 'GPS first, with a deadline', r.calls[0]);
  r = await run([['err', { code: 3 }], ['ok', pos]]);
  ok(r.p === pos && r.calls.length === 2 && r.calls[1].enableHighAccuracy === false && r.calls[1].maximumAge >= 30000, 'when GPS times out it asks for a quick network position', r.calls);
  r = await run([['err', { code: 1 }], ['ok', pos]]);
  ok(r.e && r.e.code === 1 && r.calls.length === 1, 'a refusal stops at once (no second ask that would prompt again)', r);
  r = await run([['err', { code: 3 }], ['err', { code: 2 }]]);
  ok(r.e && r.e.code === 2 && r.calls.length === 2, 'both failing reports the last reason', r);
  const noGeo = await (async () => { const ctx = { navigator: {}, Promise, setTimeout }; vm.runInNewContext(code + '; __out = geoOnce();', ctx); return ctx.__out.then(() => null, e => e); })();
  ok(noGeo && noGeo.code === 2, 'a browser without geolocation fails cleanly as unavailable', noGeo);
  ok(/leaflet-tile/.test(src.slice(src.indexOf('function fix(img)'), src.indexOf('function fix(img)') + 200)), 'map tiles are never lazy-loaded');
  ok(/locTimeout:'/.test(src) && /locWait:'/.test(src) && /locUsedRecent:'/.test(src), 'the reasons have strings');
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
