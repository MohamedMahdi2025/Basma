// BASMA's move to mohamedmahdi2025.github.io (2026-11-04): passkeys on both domains, and a one-tap move with a self-issued code.
// node tests/move.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-04T06:00:00Z') });
const OLD = { rpId: 'besgasksa.github.io', origin: 'https://besgasksa.github.io' }, NEW = { rpId: 'mohamedmahdi2025.github.io', origin: 'https://mohamedmahdi2025.github.io' };
const enroll = (no, code, dom) => { const d = new Authenticator(dom); const b = B.raw({ action: 'enrollBegin', orgId: '1001', empNo: no, code, host: dom.rpId }); const f = B.raw({ action: 'enrollFinish', orgId: '1001', credential: d.create(b.options), host: dom.rpId }); return { d, b, f }; };
const login = (no, dev, dom) => { const b = B.raw({ action: 'authBegin', orgId: '1001', empNo: no, host: dom.rpId }); if (!b.ok) return b; return B.raw({ action: 'authFinish', orgId: '1001', credential: dev.get(b.options), host: dom.rpId }); };

const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const a = enroll('1000', home.activationCode, OLD);
ok(a.f.token && a.b.options.rp.id === 'besgasksa.github.io', 'on the old link the passkey is made for besgasksa.github.io', a.b.options.rp);
ok(login('1000', a.d, OLD).token, 'and signs in there as before');

console.log('The move');
const mv = B.raw({ action: 'moveCode', orgId: '1001', token: a.f.token, host: OLD.rpId });
ok(mv.ok && mv.code && mv.empNo === '1000' && /mohamedmahdi2025\.github\.io\/basma\/$/.test(mv.to), 'a signed-in person gets a one-time code for the new link', mv);
ok(B.raw({ action: 'moveCode', orgId: '1001', host: OLD.rpId }).error === 'session_expired', 'only when signed in');
const n = enroll('1000', mv.code, NEW);
ok(n.f.token && n.b.options.rp.id === 'mohamedmahdi2025.github.io', 'on the new link the new passkey is made for mohamedmahdi2025.github.io', n.b.options.rp);
ok(login('1000', n.d, NEW).token, 'and signs in there');
ok(!login('1000', a.d, OLD).token, 'the old device is retired by the move (enrolment replaces earlier keys)');
const evil = new Authenticator({ rpId: 'evil.example', origin: 'https://evil.example' });
const eb = B.raw({ action: 'authBegin', orgId: '1001', empNo: '1000', host: 'evil.example' });
ok(eb.ok && eb.options.rpId === 'besgasksa.github.io', 'an unknown host is ignored: options stay on our domain', eb.options && eb.options.rpId);
ok(!B.raw({ action: 'authFinish', orgId: '1001', credential: evil.get(eb.options), host: 'evil.example' }).token, 'a key from another site is refused');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
