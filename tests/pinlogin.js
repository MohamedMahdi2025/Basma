// Sign in with the 6-digit PIN from any device (2026-11-04): number + PIN, lockout after 5 wrong tries. node tests/pinlogin.js
const crypto = require('crypto');
const { load, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: Date.parse('2026-11-04T06:00:00Z') });
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const dev = new DeviceKey(); dev.pin = '739251';
let r = B.call({ action: 'enrollBegin', empNo: '1000', code: home.activationCode });
r = B.call({ action: 'enrollFinish', deviceKey: dev.create(r.options), pin: dev.pin, label: 'Phone' });
ok(r.ok && r.kind === 'devicekey', 'the administrator has a phone with a 6-digit PIN', r);

console.log('PIN sign-in on another device');
r = B.call({ action: 'pinLogin', empNo: '1000', pin: '739251' });
ok(r.ok && r.token && r.me.empNo === '1000' && r.home, 'number + PIN signs in from a phone that has no key', r);
ok(B.call({ action: 'pinLogin', empNo: '1000', pin: '12345' }).error === 'bad_pin_format', 'the PIN is 6 digits');
ok(B.call({ action: 'pinLogin', empNo: '9999', pin: '739251' }).error === 'bad_pin_login', 'an unknown number gets the same answer as a wrong PIN');
for (let i = 0; i < 4; i++) r = B.call({ action: 'pinLogin', empNo: '1000', pin: '111111' });
ok(r.error === 'bad_pin_login', 'wrong PIN', r);
r = B.call({ action: 'pinLogin', empNo: '1000', pin: '111111' });
ok(r.error === 'pin_locked', 'the fifth wrong PIN locks PIN sign-in', r);
ok(B.call({ action: 'pinLogin', empNo: '1000', pin: '739251' }).error === 'pin_locked', 'even the right PIN waits out the lock');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
