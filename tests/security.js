// Security fixes from the Claude Security scan (2026-11-07). node tests/security.js
const crypto = require('crypto');
const { load, Authenticator, DeviceKey } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const T0 = Date.parse('2026-11-07T06:00:00Z');
const B = load({ setupKeyHash: crypto.createHash('sha256').update('k').digest('hex'), now: T0 });
const home = B.raw({ action: 'bootstrap', orgId: '1001', setupKey: 'k', name: 'مدير', empNo: '1000' });
const dev = new DeviceKey(); dev.pin = '739251';
let r = B.call({ action: 'enrollBegin', empNo: '1000', code: home.activationCode });
r = B.call({ action: 'enrollFinish', deviceKey: dev.create(r.options), pin: dev.pin, label: 'Phone' });
const adminTok = r.token;
const devs = {}, ids = {}, toks = { 1000: adminTok };
function tok(no) { if (toks[no]) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const a = B.call({ action: 'empSave', token: adminTok, emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: a.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
const call = (no, action, extra) => B.call(Object.assign({ action, token: tok(no) }, extra || {}));

console.log('Setup-key recovery cannot be guessed by changing the employee number');
let last;
for (let i = 0; i < 31; i++) last = B.call({ action: 'adminRecover', empNo: String(5000 + i), setupKey: 'guess' + i });
ok(last.error === 'too_many_attempts', 'after 30 wrong keys across 31 different numbers the whole organisation is limited', last);

console.log('PIN sign-in: each lockout in a row doubles, and the count clears only on success');
const wrong = () => B.call({ action: 'pinLogin', empNo: '1000', pin: '111111' });
for (let i = 0; i < 5; i++) r = wrong();
ok(r.error === 'pin_locked', 'five wrong PINs lock', r);
B.setNow(T0 + 16 * 60000);
for (let i = 0; i < 5; i++) r = wrong();
ok(r.error === 'pin_locked', 'five more after the first lock lock again', r);
B.setNow(T0 + 16 * 60000 + 20 * 60000);
ok(wrong().error === 'pin_locked', 'the second lock lasts 30 minutes, not 15 (still locked after 20)');
const cred = B.ctx.readAll_('credentials').find(c => c.pinHash);
ok(Number(cred.pinTries || 0) === 0, 'guessing at sign-in does not feed the device-key PIN counter (which locks the phone for good)', cred.pinTries);
B.setNow(T0 + 16 * 60000 + 31 * 60000);
r = B.call({ action: 'pinLogin', empNo: '1000', pin: '739251' });
ok(r.ok, 'after the 30 minutes the right PIN signs in', r.error);
B.setNow(T0 + 16 * 60000 + 32 * 60000);
for (let i = 0; i < 5; i++) r = wrong();
const c2 = B.ctx.readAll_('credentials').find(c => c.pinHash);
ok(r.error === 'pin_locked' && Date.parse(c2.pinLockUntil) - B.now() <= 15 * 60000 + 1000, 'a success starts the doubling again from 15 minutes', c2.pinLockUntil);
B.setNow(T0 + 3 * 3600000);

console.log('Passkey data from unauthenticated requests is bounded');
let t = Date.now(), err = '';
try { B.ctx.cborDecode_([0x9a, 0xff, 0xff, 0xff, 0xff]); } catch (e) { err = String(e.message); }
ok(err === 'E:cbor_bad' && Date.now() - t < 1000, 'an array claiming 4 billion items is refused at once', err);
err = ''; try { B.ctx.cborDecode_([0x5a, 0x00, 0x10, 0x00, 0x00, 1, 2]); } catch (e) { err = String(e.message); }
ok(err === 'E:cbor_bad', 'a byte string longer than the data is refused');
let deep = []; for (let i = 0; i < 20; i++) deep.push(0x81); deep.push(0x01);
err = ''; try { B.ctx.cborDecode_(deep); } catch (e) { err = String(e.message); }
ok(err === 'E:cbor_bad', 'nesting deeper than any authenticator uses is refused');
ok(JSON.stringify(B.ctx.cborDecode_([0xa2, 0x01, 0x02, 0x03, 0x82, 0x04, 0x05])) === '{"1":2,"3":[4,5]}', 'normal data still decodes');

console.log('People');
person('3001', 'الموارد البشرية', 'hr'); person('3002', 'محاسب الرواتب', 'employee'); person('5001', 'موظف', 'employee');
B.call({ action: 'hrRolesSave', token: adminTok, id: ids['3002'], extraRoles: 'payroll' });

console.log('HR cannot take over a payroll holder\'s sign-in');
ok(call('3001', 'empPasswordReset', { id: ids['3002'] }).error === 'forbidden', 'no temporary password for a payroll holder from HR');
ok(call('3001', 'empActivation', { id: ids['3002'] }).error === 'forbidden', 'no activation code for a payroll holder from HR');
ok(call('3001', 'empPasswordReset', { id: ids['5001'] }).ok, 'HR still resets a plain employee');
ok(call('1000', 'empPasswordReset', { id: ids['3002'] }).ok, 'an administrator can reset the payroll holder');

console.log('HR edits their own record only through a request');
r = call('3001', 'hrEmpSave', { emp: { id: ids['3001'], annualLeaveDays: 45 } });
ok(r.error === 'cannot_edit_self', 'HR cannot raise their own annual leave days', r);
ok(call('3001', 'hrEmpSave', { emp: { id: ids['5001'], annualLeaveDays: 30 } }).ok, 'HR still edits others');

console.log('Server-only keys in a request are dropped');
delete toks['5001']; // the password reset above ended 5001's sessions (by design): sign in again with the passkey
r = call('5001', 'requestCreate', { request: { type: 'resignation', fromDate: '2026-12-31', reason: 'x', payload: { deferUntil: '2020-01-01', extensionOf: 'LV-1', note: 'kept' } } });
const row = B.ctx.readAll_('requests').find(x => x.empId === ids['5001'] && x.type === 'resignation');
const pl = row ? JSON.parse(row.payloadJson || '{}') : {};
ok(row && !pl.deferUntil && !pl.extensionOf, 'a back-dated deferUntil and extensionOf never reach the request', r.error || pl);
ok(row && !B.ctx.resignationDeemed_(row), 'so the resignation is not deemed accepted', row && row.status);

console.log('CSV export escapes formulas');
const csv = B.ctx.apiCsv_([{ a: '-1+2' }, { a: '-25.5' }, { a: '=SUM(A1)' }, { a: '\tx' }]);
const cells = csv.replace('﻿', '').split('\r\n').slice(1);
ok(cells[0] === "'-1+2" && cells[1] === '-25.5' && cells[2] === "'=SUM(A1)" && cells[3] === "'\tx", 'a minus-led formula is escaped, a plain negative number is not', cells);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
