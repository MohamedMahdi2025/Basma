// Geofence decisions (2026-10-26): every recent sample is judged; edge tolerance; duplicates; fake-GPS signals. node tests/geo.js
const crypto = require('crypto');
const { load } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-10-26T05:30:00Z') });
const HQ = { lat: 24.7136, lng: 46.6753 }, BR = { lat: 21.5433, lng: 39.1728 };
const m = (north, east) => ({ lat: HQ.lat + north / 111320, lng: HQ.lng + east / (111320 * Math.cos(HQ.lat * Math.PI / 180)) });
B.ctx.withLock_(() => {
  B.ctx.append_('zones', { id: 'ZHQ', name: 'HQ', lat: HQ.lat, lng: HQ.lng, radius: 150, status: 'active' });
  B.ctx.append_('zones', { id: 'ZBR', name: 'Jeddah', lat: BR.lat, lng: BR.lng, radius: 100, status: 'active' });
});
B.ctx.READ_MEMO_ = {};
const s = B.ctx.settings_(), emp = { id: 'E1', zoneIds: '' };
const T = Date.now();
const smp = (north, acc, i) => Object.assign(m(north, 0), { acc, t: T - (i || 0) * 1000 });
const geo = (list, type, desktop) => B.ctx.evaluateGeo_(emp, { samples: list }, s, type || 'in', !!desktop);

console.log('Which sample decides');
let r = geo([smp(170, 8, 0), smp(60, 25, 1), smp(80, 30, 2)]);
ok(!r.reject && r.zone.id === 'ZHQ' && r.fix.acc === 25, 'the sharpest reading drifted 170 m out, but good readings inside count: the best inside one is the fix', r);
r = geo([smp(40, 12, 0)]);
ok(!r.reject && r.flags.indexOf('edge') < 0, 'a sharp reading well inside counts with no flag');
r = geo([smp(145, 20, 0)]);
ok(!r.reject && r.flags.indexOf('edge') >= 0, 'inside but its accuracy circle crosses the fence: counts, flagged edge');

console.log('Edge tolerance');
r = geo([smp(175, 30, 0)]);
ok(!r.reject && r.flags.indexOf('edge_outside') >= 0 && B.ctx.RISK_WEIGHTS.edge_outside >= s.reviewRiskThreshold, '25 m past the fence with a 30 m reading: counts, but goes to HR review (edge_outside)', r);
r = geo([smp(230, 30, 0)]);
ok(r.reject === 'outside_zone', '80 m past the fence is outside, however good the reading', r.reject);
r = geo([smp(210, 90, 0)]);
ok(r.reject === 'outside_zone', 'the tolerance is capped at 50 m even for a coarse reading (60 m out, +-90 m)', r.reject);
r = geo([smp(5000, 10, 0)]);
ok(r.reject === 'outside_zone' && r.distance > 4000, '5 km away is refused');

console.log('Coarse readings');
r = geo([smp(50, 180, 0)]);
ok(!r.reject && r.flags.indexOf('weak_fix') >= 0, 'a coarse (+-180 m) reading centred inside still counts and goes to review (weak_fix)', r);
r = geo([smp(50, 400, 0)]);
ok(r.reject === 'accuracy_too_low', 'worse than 300 m on a phone is refused');
r = geo([smp(50, 400, 0)], 'in', true);
ok(!r.reject && r.flags.indexOf('weak_fix') >= 0, 'a laptop on Wi-Fi (+-400 m) centred inside goes to review');

console.log('Several offices');
r = geo([Object.assign({ lat: BR.lat + 30 / 111320, lng: BR.lng }, { acc: 15, t: T })]);
ok(!r.reject && r.zone.id === 'ZBR', 'a reading at the Jeddah branch is judged against the Jeddah zone', r.zone && r.zone.id);
const empHQ = { id: 'E2', zoneIds: 'ZHQ' };
r = B.ctx.evaluateGeo_(empHQ, { samples: [Object.assign({ lat: BR.lat, lng: BR.lng }, { acc: 15, t: T })] }, s, 'in', false);
ok(r.reject === 'outside_zone', 'someone assigned to HQ only cannot check in at the branch');

console.log('Samples');
const d = B.ctx.cleanSamples_({ samples: [smp(10, 12, 0), smp(10, 12, 0), smp(10, 12, 1)] });
ok(d.length === 2, 'the same reading sent twice counts once', d.length);
ok(B.ctx.cleanSamples_({ samples: [{ lat: 'x', lng: 1, acc: 5 }, { lat: 95, lng: 1, acc: 5 }, { lat: 1, lng: 1, acc: -1 }] }).length === 0, 'junk readings are dropped');

console.log('Fake-GPS signals');
const cred = { kind: 'passkey', platform: 'mobile', createdAt: '2026-01-01T00:00:00Z' };
const now = new Date(T);
const frozen = [0, 1, 2].map(i => Object.assign(m(10, 0), { acc: 5, t: T - i * 1000 }));
let k = B.ctx.riskScore_({ id: 'E1' }, cred, { deviceTime: T }, { samples: frozen, fix: frozen[0], flags: [] }, null, now);
ok(k.flags.indexOf('static_samples') >= 0 && k.flags.indexOf('static_precise') >= 0 && k.score >= s.reviewRiskThreshold, 'a precise point that never moves (fake-location app) reaches HR review', k);
const wifi = [0, 1, 2].map(i => Object.assign(m(10, 0), { acc: 65, t: T - i * 1000 }));
k = B.ctx.riskScore_({ id: 'E1' }, cred, { deviceTime: T }, { samples: wifi, fix: wifi[0], flags: [] }, null, now);
ok(k.flags.indexOf('static_samples') >= 0 && k.flags.indexOf('static_precise') < 0 && k.score < s.reviewRiskThreshold, 'a Wi-Fi fix repeating exactly (+-65 m) is noted but does not send an honest punch to review', k);
const real = [0, 1, 2].map(i => Object.assign(m(10 + i * 0.6, i * 0.4), { acc: 6 + i, t: T - i * 1000 }));
k = B.ctx.riskScore_({ id: 'E1' }, cred, { deviceTime: T }, { samples: real, fix: real[0], flags: [] }, null, now);
ok(k.score === 0, 'real GPS with normal jitter scores nothing', k);

console.log('Phone app integrity (Android 1.2.0)');
const ig = integ => B.ctx.riskScore_({ id: 'E1' }, cred, { deviceTime: T, integ }, { samples: real, fix: real[0], flags: [] }, null, now);
const clean = { v: 1, checked: true, rooted: false, emulator: false, hooked: false, signature: true, mockAt: 0, at: T };
ok(ig(clean).score === 0 && ig(undefined).score === 0, 'a clean phone and a browser (nothing sent) score nothing');
k = ig(Object.assign({}, clean, { mockAt: T - 60000 }));
ok(k.flags.indexOf('mock_location') >= 0 && k.score >= s.reviewRiskThreshold, 'Android marked a reading as fake a minute ago: HR review', k);
k = ig(Object.assign({}, clean, { mockAt: T - 3600000 }));
ok(k.flags.indexOf('mock_location') < 0, 'a fake reading an hour ago (app since switched off) does not flag today', k);
k = ig(Object.assign({}, clean, { hooked: true }));
ok(k.flags.indexOf('device_hooked') >= 0 && k.score >= s.reviewRiskThreshold, 'Frida / Xposed on the phone: HR review', k);
k = ig(Object.assign({}, clean, { signature: false }));
ok(k.flags.indexOf('app_tampered') >= 0 && k.score >= s.reviewRiskThreshold, 'a re-signed copy of the app: HR review', k);
k = ig(Object.assign({}, clean, { emulator: true }));
ok(k.flags.indexOf('device_emulator') >= 0 && k.score >= s.reviewRiskThreshold, 'an emulator: HR review', k);
k = ig(Object.assign({}, clean, { rooted: true }));
ok(k.flags.indexOf('device_rooted') >= 0 && k.score < s.reviewRiskThreshold, 'a rooted phone alone is noted but an honest punch is not sent to review', k);
k = ig({ rooted: 'yes', hooked: 1, signature: 0, mockAt: 'x' });
ok(k.score === 0, 'junk values (not true / false) are ignored', k);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
