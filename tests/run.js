// End-to-end trial of the backend: node tests/run.js
const crypto = require('crypto');
const { load, Authenticator, DeviceKey } = require('./harness');

let passed = 0, failed = 0;
function ok(cond, name, extra) {
  if (cond) { passed++; console.log('  ok  ' + name); }
  else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); }
}
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

// Riyadh 2026-10-04 (a Sunday) 07:55 local = 04:55Z
const T0 = Date.parse('2026-10-04T04:55:00Z');
const HQ = { lat: 24.7136, lng: 46.6753 };
const near = (dm, acc = 12, t) => ({ lat: HQ.lat + dm / 111320, lng: HQ.lng, acc, t });
const samples = (dm, acc = 12, t) => (t = t || nowMs(), [near(dm, acc, t - 2000), near(dm + 1.3, acc + 2, t - 1000), near(dm - 0.7, acc, t)]);
let nowMs = () => T0;

const B0 = load();
console.log('P-256 ECDSA against Node crypto');
{
  const B = B0;
  const bytes = b => Array.from(b);
  let good = 0, bad = 0;
  for (let i = 0; i < 25; i++) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = publicKey.export({ format: 'jwk' });
    const msg = crypto.randomBytes(40 + i);
    const sig = crypto.sign('sha256', msg, { key: privateKey, dsaEncoding: 'der' });
    const h = crypto.createHash('sha256').update(msg).digest();
    const x = Buffer.from(jwk.x, 'base64url'), y = Buffer.from(jwk.y, 'base64url');
    if (B.ctx.ecdsaVerifyP256_(bytes(h), bytes(sig), bytes(x), bytes(y))) good++;
    const h2 = Buffer.from(h); h2[0] ^= 1;
    if (!B.ctx.ecdsaVerifyP256_(bytes(h2), bytes(sig), bytes(x), bytes(y))) bad++;
  }
  ok(good === 25, 'accepts 25 genuine signatures', good);
  ok(bad === 25, 'rejects 25 signatures over altered messages', bad);
  const t = Date.now();
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from('x'), { key: privateKey, dsaEncoding: 'der' });
  for (let i = 0; i < 10; i++) B.ctx.ecdsaVerifyP256_(bytes(crypto.createHash('sha256').update('x').digest()), bytes(sig), bytes(Buffer.from(jwk.x, 'base64url')), bytes(Buffer.from(jwk.y, 'base64url')));
  console.log('      (' + ((Date.now() - t) / 10).toFixed(1) + ' ms per verify)');
}

{
  // Raw r||s signatures (device keys) whose first byte is 0x30 must still verify.
  let tried = 0, hit = 0, okCount = 0;
  while (hit < 5 && tried < 20000) {
    tried++;
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const msg = crypto.randomBytes(32);
    const sig = crypto.sign('sha256', msg, { key: privateKey, dsaEncoding: 'ieee-p1363' });
    if (sig[0] !== 0x30) continue;
    hit++;
    const jwk = publicKey.export({ format: 'jwk' });
    const h = crypto.createHash('sha256').update(msg).digest();
    if (B0.ctx.ecdsaVerifyP256_(Array.from(h), Array.from(sig), Array.from(Buffer.from(jwk.x, 'base64url')), Array.from(Buffer.from(jwk.y, 'base64url')), true)) okCount++;
  }
  ok(hit === 5 && okCount === 5, 'raw signatures that start with 0x30 verify (1 in 256 used to fail)', { hit, okCount });
}

{
  // The PIN rounds use a plain-JS SHA-256; it must match the service one byte for byte or every stored PIN breaks.
  let bad = 0;
  for (let n = 0; n < 200; n++) { const b = Array.from(crypto.randomBytes(n)); if (JSON.stringify(B0.ctx.sha256Js_(b)) !== JSON.stringify(B0.ctx.sha256_(b).map(x => x & 255))) bad++; }
  ok(bad === 0, 'plain-JS SHA-256 matches the service SHA-256 for 200 lengths', bad);
}

console.log('Backend files share one namespace');
{
  // Apps Script loads every .gs into one global scope: a second function with the same name silently
  // replaces the first (a helper called json_ once took down every reply). Names must be unique.
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'backend'), seen = {}, dup = [];
  fs.readdirSync(dir).filter(f => f.endsWith('.gs')).forEach(f => {
    // Apps Script has one global namespace: a top-level var counts too (a var and a function of one name clash as well)
    (fs.readFileSync(path.join(dir, f), 'utf8').match(/^(?:function|var)\s+([A-Za-z0-9_$]+)/gm) || []).forEach(m => {
      const n = m.replace(/^(?:function|var)\s+/, '');
      if (seen[n]) dup.push(n + ' (' + seen[n] + ', ' + f + ')'); else seen[n] = f;
    });
  });
  ok(dup.length === 0, 'no function name is defined twice across backend files', dup);
  // String.replace turns "$$" into "$" in inserted code: $('[x]').forEach then throws and a whole screen goes blank.
  const client = ['index.html'].concat(fs.readdirSync(path.join(__dirname, '..', 'js')).map(f => 'js/' + f)), single = [];
  client.forEach(f => (fs.readFileSync(path.join(__dirname, '..', f), 'utf8').split('\n')).forEach((l, i) => { if (/(^|[^$\w])\$\([^()]*\)\.(forEach|map|filter)\(/.test(l)) single.push(f + ':' + (i + 1)); }));
  ok(single.length === 0, 'no $(...) is used as a list ($$ lost in an edit)', single);
  const get = B0.ctx.doGet({});
  ok(typeof get === 'string' && JSON.parse(get).ok === true, 'the web entry point (doGet) answers JSON', get);
  const post = B0.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'ping' }) } });
  ok(typeof post === 'string' && JSON.parse(post).ok !== undefined, 'doPost answers JSON through the real entry point', post);
}

console.log('Bootstrap, enrollment, sign-in');
const SETUP = 'test-setup-key-1234';
const B = load({ setupKeyHash: sha(SETUP), now: T0 });
nowMs = () => B.ctx.Date.now();
function login(dev, empNo) { const b = B.call({ action: 'authBegin', empNo }); return B.call({ action: 'authFinish', credential: dev.get(b.options) }).token; }
let r = B.call({ action: 'bootstrapStatus' });
ok(r.ok && r.needsSetup, 'needs setup on an empty sheet');
r = B.call({ action: 'bootstrap', setupKey: 'wrong', name: 'Admin', empNo: '1000' });
ok(!r.ok && r.error === 'bad_setup_key', 'wrong setup key refused', r);
r = B.call({ action: 'bootstrap', setupKey: SETUP, name: 'مدير النظام', empNo: '1000' });
ok(r.ok && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(r.activationCode), 'bootstrap issues an activation code', r);
const adminCode = r.activationCode;
r = B.call({ action: 'bootstrap', setupKey: SETUP, name: 'Again', empNo: '1001' });
ok(!r.ok && r.error === 'already_setup', 'bootstrap only once', r);

const adminDev = new Authenticator();
r = B.call({ action: 'enrollBegin', empNo: '1000', code: 'AAAA-AAAA' });
ok(!r.ok && r.error === 'bad_activation', 'wrong activation code refused', r);
r = B.call({ action: 'enrollBegin', empNo: '1000', code: adminCode.toLowerCase().replace('-', ' ') });
ok(r.ok && r.options.authenticatorSelection.userVerification === 'required', 'activation code accepted, loosely typed', r);
r = B.call({ action: 'enrollFinish', credential: adminDev.create(r.options), label: 'iPhone' });
ok(r.ok && r.token && r.me.role === 'admin', 'passkey enrolled, session issued', r);
let adminToken = r.token;
r = B.call({ action: 'enrollBegin', empNo: '1000', code: adminCode });
ok(!r.ok, 'activation code is single use', r);

// Replay: an enrollment response against a fresh challenge from someone else fails.
r = B.call({ action: 'authBegin', empNo: '1000' });
ok(r.ok && r.options.allowCredentials.length === 1, 'sign-in challenge names the enrolled device');
let assertion = adminDev.get(r.options);
r = B.call({ action: 'authFinish', credential: assertion });
ok(r.ok && r.token, 'Face ID sign-in verifies', r);
r = B.call({ action: 'authFinish', credential: assertion });
ok(!r.ok && (r.error === 'challenge_expired' || r.error === 'cloned_authenticator'), 'the same assertion cannot be replayed', r);
r = B.call({ action: 'authBegin', empNo: '1000' });
r = B.call({ action: 'authFinish', credential: adminDev.get(r.options, { tamper: true }) });
ok(!r.ok && r.error === 'bad_signature', 'a tampered signature is refused', r);
{
  const noUv = new Authenticator({ uv: false }); noUv.priv = adminDev.priv; noUv.x = adminDev.x; noUv.y = adminDev.y; noUv.credId = adminDev.credId;
  r = B.call({ action: 'authBegin', empNo: '1000' });
  r = B.call({ action: 'authFinish', credential: noUv.get(r.options) });
  ok(!r.ok && r.error === 'no_user_verification', 'a passkey without Face ID / fingerprint is refused', r);
  const phish = new Authenticator({ origin: 'https://evil.example' }); phish.priv = adminDev.priv; phish.x = adminDev.x; phish.y = adminDev.y; phish.credId = adminDev.credId;
  r = B.call({ action: 'authBegin', empNo: '1000' });
  r = B.call({ action: 'authFinish', credential: phish.get(r.options) });
  ok(!r.ok && r.error === 'bad_origin', 'an assertion from another website is refused', r);
}

console.log('Zones, employees, roles');
r = B.call({ action: 'zoneSave', token: adminToken, zone: { name: 'المقر الرئيسي', nameEn: 'HQ', lat: HQ.lat, lng: HQ.lng, radius: 150 } });
ok(r.ok, 'admin creates the HQ zone', r);
const zoneId = r.zone.id;
r = B.call({ action: 'empSave', token: adminToken, emp: { empNo: '2001', name: 'موظف تجريبي', department: 'Finance' } });
ok(r.ok && r.activationCode, 'admin adds an employee and gets a code', r);
const empId = r.emp.id, empCode = r.activationCode;
r = B.call({ action: 'empSave', token: adminToken, emp: { empNo: '2001', name: 'Dup' } });
ok(!r.ok && r.error === 'duplicate_emp_no', 'duplicate employee number refused', r);
r = B.call({ action: 'empSave', token: adminToken, emp: { empNo: '3001', name: 'موظفة الموارد', role: 'hr' } });
const hrCode = r.activationCode, hrId = r.emp.id;

const empDev = new Authenticator();
r = B.call({ action: 'enrollBegin', empNo: '2001', code: empCode });
r = B.call({ action: 'enrollFinish', credential: empDev.create(r.options), label: 'Android' });
ok(r.ok && r.me.role === 'employee', 'employee enrolls a device', r);
const empToken = r.token;
r = B.call({ action: 'board', token: empToken });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot open the HR board', r);
r = B.call({ action: 'zoneSave', token: empToken, zone: { name: 'x', lat: 1, lng: 1, radius: 5000 } });
ok(!r.ok && r.error === 'forbidden', 'an employee cannot move the zone', r);
const hrDev = new Authenticator();
r = B.call({ action: 'enrollBegin', empNo: '3001', code: hrCode });
r = B.call({ action: 'enrollFinish', credential: hrDev.create(r.options) });
const hrToken = r.token;
r = B.call({ action: 'empSave', token: hrToken, emp: { id: empId, empNo: '2001', name: 'موظف تجريبي', role: 'admin' } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot promote anyone to admin', r);
r = B.call({ action: 'zoneSave', token: hrToken, zone: { name: 'x', lat: 1, lng: 1, radius: 100 } });
ok(!r.ok && r.error === 'forbidden', 'HR cannot move zones', r);

console.log('Punching');
function punch(dev, empNo, geo, extra = {}) {
  let b = B.call({ action: 'punchBegin', empNo, type: extra.type });
  if (!b.ok) return b;
  return B.call({ action: 'punchFinish', credential: dev.get(b.options), pin: dev.pin, geo, deviceTime: extra.deviceTime || B.ctx.Date.now(), ua: 'test' });
}
r = B.call({ action: 'me', token: empToken });
ok(r.ok && r.today.next === 'in' && r.zones.length === 1, 'employee sees HQ zone and a pending check-in', r.today);
r = punch(empDev, '2001', { samples: samples(1200) });
ok(!r.ok && r.error === 'outside_zone' && r.distance > 1000, 'check-in 1.2 km away is refused', r);
r = punch(empDev, '2001', { samples: samples(20, 350) });
ok(!r.ok && r.error === 'accuracy_too_low', 'a phone fix worse than 300 m is refused (up to 300 m inside the zone goes to review)', r);
r = punch(empDev, '2001', { samples: samples(35) });
ok(r.ok && r.punch.type === 'in' && r.punch.status === 'ok', 'check-in 35 m from HQ accepted', r);
r = punch(empDev, '2001', { samples: samples(35) });
ok(!r.ok && r.error === 'too_soon', 'double tap refused', r);
B.setNow(T0 + 9 * 3600000);
r = punch(empDev, '2001', { samples: samples(40) }, { type: 'in' });
ok(!r.ok && r.error === 'state_changed', 'a stale screen asking for the wrong punch is refused', r);
r = punch(empDev, '2001', { samples: samples(40) });
ok(r.ok && r.punch.type === 'out', 'check-out at 16:55 accepted', r);
r = B.call({ action: 'me', token: empToken });
ok(r.today.workedMin === 540 && r.today.lateMin === 0 && r.today.earlyMin === 5, 'day totals: 9h worked, on time, 5 min early', r.today);

console.log('Spoofing signals');
B.setNow(T0 + 24 * 3600000 + 45 * 60000); // next day 08:40, late
const frozen = [near(10, 5, 1), near(10, 5, 1), near(10, 5, 1)];
let hrT = login(hrDev, '3001'); adminToken = login(adminDev, '1000');
r = punch(empDev, '2001', { samples: frozen });
ok(r.ok && r.punch.status === 'review' && /static_samples/.test(r.punch.flags), 'frozen mock-GPS coordinates go to HR review', r.punch);
r = B.call({ action: 'reviewList', token: hrT });
ok(r.ok && r.rows.length === 1, 'HR sees one punch to review');
r = B.call({ action: 'reviewDecide', token: hrT, id: r.rows[0].id, decision: 'approve' });
ok(r.ok, 'HR approves it');
r = B.call({ action: 'board', token: adminToken });
const row = r.rows.find(x => x.emp.id === empId);
ok(r.ok && row.day.status === 'in' && row.day.lateMin === 40, 'board: employee in, 40 min late', row && row.day);
ok(r.kpi.in === 1 && r.kpi.absent >= 1, 'board KPIs count who is in and who is absent', r.kpi);

console.log('Corrections, reports, device reset');
r = B.call({ action: 'manualPunch', token: hrT, empId: hrId, type: 'in', date: '2026-10-05', time: '08:00', reason: 'x' });
ok(!r.ok && r.error === 'cannot_correct_self', 'HR cannot correct their own attendance', r);
r = B.call({ action: 'manualPunch', token: hrT, empId, type: 'out', date: '2026-10-05', time: '17:10', reason: 'نسي تسجيل الانصراف' });
ok(!r.ok && r.error === 'future_time', 'no corrections in the future', r);
B.setNow(T0 + 24 * 3600000 + 14 * 3600000);
hrT = login(hrDev, '3001'); adminToken = login(adminDev, '1000');
r = B.call({ action: 'manualPunch', token: hrT, empId, type: 'out', date: '2026-10-05', time: '17:10', reason: 'نسي تسجيل الانصراف' });
ok(r.ok && r.punch.status === 'manual', 'HR adds a forgotten check-out with a reason', r);
r = B.call({ action: 'report', token: hrT, from: '2026-10-04', to: '2026-10-05', empId });
const t = r.totals && r.totals[0];
ok(r.ok && t.present === 2 && t.lateDays === 1 && t.lateMin === 40, 'report totals over two days', t);
r = B.call({ action: 'empResetDevice', token: adminToken, id: empId });
ok(r.ok && r.activationCode, 'admin resets the device and gets a fresh code', r);
r = B.call({ action: 'me', token: empToken });
ok(!r.ok && r.error === 'session_expired', 'old sessions die with the device reset', r);
r = B.call({ action: 'authBegin', empNo: '2001' });
ok(!r.ok && r.error === 'no_device', 'the old phone can no longer sign in', r);
r = B.call({ action: 'auditList', token: adminToken });
ok(r.ok && r.rows.some(a => a.action === 'device_reset') && r.rows.some(a => a.action === 'punch_rejected'), 'audit trail records resets and rejected punches');

r = B.call({ action: 'report', token: hrT, from: '2026-09-20', to: '2026-10-05', empId });
ok(r.ok && r.totals[0].absent === 0 && r.rows[0].date === '2026-10-04', 'no absences counted before the employee was added', r.totals && r.totals[0]);

console.log('Older phones (device key, tap only)');
B.setNow(T0 + 2 * 24 * 3600000); // Tue 07:55
adminToken = login(adminDev, '1000'); hrT = login(hrDev, '3001');
r = B.call({ action: 'empSave', token: hrT, emp: { empNo: '4001', name: 'جهاز قديم' } });
const oldCode = r.activationCode;
const oldDev = new DeviceKey();
r = B.call({ action: 'enrollBegin', empNo: '4001', code: oldCode });
r = B.call({ action: 'enrollFinish', deviceKey: oldDev.create(r.options), label: 'Old Android' });
ok(!r.ok && r.error === 'bad_pin_format', 'a phone device key needs a 6-digit PIN', r);
oldDev.pin = '739251';
r = B.call({ action: 'enrollBegin', empNo: '4001', code: oldCode });
r = B.call({ action: 'enrollFinish', deviceKey: oldDev.create(r.options), pin: oldDev.pin, label: 'Old Android' });
ok(r.ok && r.kind === 'devicekey', 'an older phone activates with a device key', r);
const fakeDev = new DeviceKey(); fakeDev.rawId = oldDev.rawId;
r = B.call({ action: 'punchBegin', empNo: '4001' });
r = B.call({ action: 'punchFinish', credential: fakeDev.get(r.options), pin: '739251', geo: { samples: samples(20) }, deviceTime: B.ctx.Date.now() });
ok(!r.ok && r.error === 'bad_signature', 'another phone cannot pretend to be it', r);
r = punch(oldDev, '4001', { samples: samples(1500) });
ok(!r.ok && r.error === 'outside_zone', 'tap check-in outside HQ is still refused', r);
r = punch(oldDev, '4001', { samples: samples(25) });
ok(r.ok && r.punch.type === 'in' && !/no_biometric/.test(r.punch.flags), 'PIN phone check-in inside HQ accepted without a no-biometric flag', r.punch || r);
r = (() => { const b = B.call({ action: 'authBegin', empNo: '4001' }); return B.call({ action: 'authFinish', credential: oldDev.get(b.options), pin: '000000' }); })();
ok(!r.ok && r.error === 'bad_pin', 'a phone with the wrong PIN cannot sign in', r);
r = (() => { const b = B.call({ action: 'authBegin', empNo: '4001' }); return B.call({ action: 'authFinish', credential: oldDev.get(b.options), pin: oldDev.pin }); })();
ok(r.ok && r.home && r.home.today && r.home.punch && r.home.punch.options.challenge, 'sign-in returns the home screen and a ready check-in challenge in one reply', r.home && Object.keys(r.home));
r = B.call({ action: 'settingsSave', token: adminToken, settings: { allowDeviceKey: false } });
B.setNow(T0 + 2 * 24 * 3600000 + 3 * 3600000);
r = B.call({ action: 'punchBegin', empNo: '4001' });
ok(!r.ok && r.error === 'device_key_disabled', 'admin can switch tap-only mode off', r);
B.call({ action: 'settingsSave', token: adminToken, settings: { allowDeviceKey: true } });

console.log('Laptops (device key + 6-digit PIN)');
B.setNow(T0 + 3 * 24 * 3600000); // Wed 07:55
adminToken = login(adminDev, '1000'); hrT = login(hrDev, '3001');
r = B.call({ action: 'empActivation', token: hrT, id: B.call({ action: 'empList', token: hrT }).rows.find(e => e.empNo === '4001').id });
const lapCode = r.activationCode;
const lap = new DeviceKey();
const enrollLap = (dev, pin, code) => { const b = B.call({ action: 'enrollBegin', empNo: '4001', code }); return B.call({ action: 'enrollFinish', deviceKey: dev.create(b.options), platform: 'desktop', pin, label: 'Windows' }); };
r = enrollLap(lap, '12345', lapCode);
ok(!r.ok && r.error === 'bad_pin_format', 'a laptop PIN must be 6 digits', r);
r = enrollLap(lap, '123456', lapCode);
ok(!r.ok && r.error === 'weak_pin', 'an obvious PIN like 123456 is refused', r);
r = enrollLap(lap, '482915', lapCode);
ok(r.ok && r.platform === 'desktop', 'laptop activates with a 6-digit PIN', r);
r = B.call({ action: 'me', token: r.token });
ok(r.ok && r.devices.length === 2, 'the phone stays active next to the laptop', r.devices);
const lapLogin = (dev, pin) => { const b = B.call({ action: 'authBegin', empNo: '4001' }); return B.call({ action: 'authFinish', credential: dev.get(b.options), pin }); };
r = lapLogin(lap, '482915');
ok(r.ok && r.token, 'right PIN on the enrolled laptop signs in', r);
const otherLap = new DeviceKey(); otherLap.rawId = lap.rawId;
r = lapLogin(otherLap, '482915');
ok(!r.ok && r.error === 'bad_signature', 'the right PIN on a different laptop is refused', r);
const lpunch = (dev, pin, geo) => { const b = B.call({ action: 'punchBegin', empNo: '4001' }); return B.call({ action: 'punchFinish', credential: dev.get(b.options), pin, geo, deviceTime: B.ctx.Date.now() }); };
r = lpunch(lap, '482915', { samples: samples(1500, 60) });
ok(!r.ok && r.error === 'outside_zone', 'laptop check-in outside HQ is refused', r);
r = lpunch(lap, '482915', { samples: samples(40, 130) });
ok(r.ok && /laptop/.test(r.punch.flags), 'laptop check-in inside HQ with Wi-Fi accuracy 130 m is accepted and flagged', r.punch || r);
B.setNow(B.ctx.Date.now() + 2 * 60000);
r = punch(oldDev, '4001', { samples: samples(40, 130) });
ok(r.ok && /weak_fix/.test(r.punch.flags) && r.punch.status === 'review', 'a phone inside HQ at 130 m (indoors GPS) counts and goes to HR review', r.punch || r);
B.setNow(B.ctx.Date.now() + 20 * 60000);
r = lpunch(lap, '482915', { samples: samples(1500, 400) });
ok(!r.ok && (r.error === 'outside_zone' || r.error === 'accuracy_too_low'), 'a coarse laptop fix centred outside HQ is still refused', r);
r = lpunch(lap, '482915', { samples: samples(67, 190) });
ok(r.ok && /weak_fix/.test(r.punch.flags) && r.punch.status === 'review', 'laptop inside HQ at +-190 m (Wi-Fi) counts and goes to HR review (weak_fix)', r.punch || r);
for (let i = 0; i < 4; i++) r = lapLogin(lap, '000001');
ok(!r.ok && r.error === 'bad_pin', 'four wrong PINs are refused', r);
r = lapLogin(lap, '000001');
ok(!r.ok && r.error === 'device_locked', 'the fifth wrong PIN locks the laptop', r);
r = lapLogin(lap, '482915');
ok(!r.ok && r.error === 'device_locked', 'a locked laptop stays locked even with the right PIN', r);
r = B.call({ action: 'empList', token: adminToken });
const e4 = r.rows.find(e => e.empNo === '4001');
const locked = e4.devices.find(d => d.status === 'locked');
ok(!!locked && e4.devices.some(d => d.status === 'active' && d.platform === 'mobile'), 'HR sees the locked laptop and the working phone', e4.devices);
r = B.call({ action: 'empResetDevice', token: adminToken, id: e4.id, credId: locked.credId });
r = B.call({ action: 'empList', token: adminToken });
ok(r.rows.find(e => e.empNo === '4001').devices.filter(d => d.status === 'active').length === 1, 'admin unlinks only the laptop', r.rows.find(e => e.empNo === '4001').devices);
r = B.call({ action: 'settingsSave', token: adminToken, settings: { allowDesktop: false } });
r = B.call({ action: 'enrollBegin', empNo: '4001', code: B.call({ action: 'empActivation', token: adminToken, id: e4.id }).activationCode });
r = B.call({ action: 'enrollFinish', deviceKey: new DeviceKey().create(r.options), platform: 'desktop', pin: '482915' });
ok(!r.ok && r.error === 'desktop_disabled', 'admin can switch laptop check-in off', r);
B.call({ action: 'settingsSave', token: adminToken, settings: { allowDesktop: true } });

console.log('Admin recovery');
r = B.call({ action: 'adminRecover', setupKey: 'nope', empNo: '1000' });
ok(!r.ok && r.error === 'bad_setup_key', 'recovery without the setup key is refused', r);
r = B.call({ action: 'adminRecover', setupKey: SETUP, empNo: '2001' });
ok(!r.ok && r.error === 'not_found', 'recovery only works for administrators', r);
r = B.call({ action: 'adminRecover', setupKey: SETUP, empNo: '1000' });
ok(r.ok && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(r.activationCode), 'the setup key issues a fresh admin activation code', r);

console.log('Password sign-in');
B.setNow(T0 + 4 * 24 * 3600000); // Thu 07:55
adminToken = login(adminDev, '1000');
r = B.call({ action: 'pwLogin', empNo: '1000', password: 'Anything123' });
ok(!r.ok && r.error === 'bad_login', 'no password set yet: the same generic refusal', r);
for (const weak of ['short1', 'abcdefghij', '1234567890', 'aaaaaaaa1', 'x1000x1000']) {
  r = B.call({ action: 'passwordSet', token: adminToken, password: weak });
  ok(!r.ok && r.error === 'weak_password', 'weak password refused: ' + weak, r);
}
r = B.call({ action: 'passwordSet', token: adminToken, password: 'BestGas2026x' });
ok(r.ok, 'a strong password is accepted', r);
r = B.call({ action: 'passwordSet', token: adminToken, password: 'Another2026x', current: 'wrong' });
ok(!r.ok && r.error === 'bad_current_password', 'changing it needs the current password', r);
r = B.call({ action: 'pwLogin', empNo: '1000', password: 'BestGas2026x' });
ok(r.ok && r.token && r.home && r.home.me.empNo === '1000' && r.home.punch === null, 'password sign-in works on any device and returns the home screen', r.error);
let pwTok = r.token;
r = B.call({ action: 'board', token: pwTok });
ok(r.ok, 'an admin password session opens the admin board');
r = B.call({ action: 'punchPw', token: pwTok, geo: { samples: samples(1500) } });
ok(!r.ok && r.error === 'outside_zone', 'password check-in outside HQ is refused', r);
r = B.call({ action: 'punchPw', token: pwTok, geo: { samples: samples(30) }, deviceTime: B.ctx.Date.now() });
ok(r.ok && /password_login/.test(r.punch.flags), 'password check-in inside HQ is recorded and flagged', r.punch || r);
r = B.call({ action: 'punchPw', token: adminToken, geo: { samples: samples(30) } });
ok(!r.ok && r.error === 'forbidden', 'a device session cannot use the password check-in path', r);
for (let i = 0; i < 4; i++) r = B.call({ action: 'pwLogin', empNo: '1000', password: 'nope1234' });
ok(!r.ok && r.error === 'bad_login', 'four wrong passwords refused', r);
r = B.call({ action: 'pwLogin', empNo: '1000', password: 'nope1234' });
ok(!r.ok && r.error === 'password_locked', 'the fifth locks password sign-in', r);
r = B.call({ action: 'pwLogin', empNo: '1000', password: 'BestGas2026x' });
ok(!r.ok && r.error === 'password_locked', 'even the right password waits out the lock', r);
B.setNow(B.ctx.Date.now() + 16 * 60000);
r = B.call({ action: 'pwLogin', empNo: '1000', password: 'BestGas2026x' });
ok(r.ok, 'after 15 minutes the right password works again', r);

console.log('Review fixes');
r = B.call({ action: 'adminRecover', setupKey: 'junk', empNo: '1000' });
for (let i = 0; i < 12; i++) B.call({ action: 'adminRecover', setupKey: 'junk' + i, empNo: '1000' });
r = B.call({ action: 'adminRecover', setupKey: SETUP, empNo: '1000' });
ok(r.ok, 'junk recovery attempts cannot block the real setup key', r);
for (let i = 0; i < 4; i++) r = B.call({ action: 'pwLogin', empNo: '99999', password: 'Wrong2026x' });
ok(!r.ok && r.error === 'bad_login', 'unknown employee number: bad_login', r);
r = B.call({ action: 'pwLogin', empNo: '99999', password: 'Wrong2026x' });
ok(!r.ok && r.error === 'password_locked', 'unknown numbers lock like real ones, so the reply reveals nothing', r);
{
  const phoneTok = login(adminDev, '1000');
  const code = B.call({ action: 'empActivation', token: phoneTok, id: B.call({ action: 'me', token: phoneTok }).me.id }).activationCode;
  const lapA = new DeviceKey();
  let b = B.call({ action: 'enrollBegin', empNo: '1000', code });
  r = B.call({ action: 'enrollFinish', deviceKey: lapA.create(b.options), platform: 'desktop', pin: '582914' });
  ok(r.ok, 'admin activates a laptop', r);
  r = B.call({ action: 'me', token: phoneTok });
  ok(r.ok, 'adding a laptop keeps the phone signed in', r.error);
  const code2 = B.call({ action: 'empActivation', token: r.ok ? phoneTok : '', id: r.me.id }).activationCode;
  const lapB = new DeviceKey();
  b = B.call({ action: 'enrollBegin', empNo: '1000', code: code2 });
  B.call({ action: 'enrollFinish', deviceKey: lapB.create(b.options), platform: 'desktop', pin: '582914' });
  r = B.call({ action: 'me', token: phoneTok });
  ok(!r.ok && r.error === 'session_expired', 'replacing a laptop ends earlier sessions', r);
  r = B.call({ action: 'auditList', token: login(adminDev, '1000') });
  ok(r.rows.some(a => a.action === 'device_enrolled' && /codeIssuedBy/.test(a.detail)), 'the audit shows who issued the code used for each activation');
}

console.log('Reset tools');
{
  const admT = login(adminDev, '1000');
  const hrTk = login(hrDev, '3001');
  const e4 = B.call({ action: 'empList', token: admT }).rows.find(e => e.empNo === '4001');
  const signIn = (pin) => { const b = B.call({ action: 'authBegin', empNo: '4001' }); return B.call({ action: 'authFinish', credential: oldDev.get(b.options), pin }); };
  // the employee has a password session before the reset
  const own = signIn(oldDev.pin);
  B.call({ action: 'passwordSet', token: own.token, password: 'Mine2026pass' });
  const oldPw = B.call({ action: 'pwLogin', empNo: '4001', password: 'Mine2026pass' });
  ok(oldPw.ok, 'the employee has a working password');
  r = B.call({ action: 'empPasswordReset', token: hrTk, id: B.call({ action: 'me', token: hrTk }).me.id });
  ok(!r.ok && r.error === 'cannot_reset_own_password', 'HR cannot reset their own password', r);
  r = B.call({ action: 'empPasswordReset', token: hrTk, id: B.call({ action: 'me', token: admT }).me.id });
  ok(!r.ok && r.error === 'forbidden', 'HR cannot reset an administrator password', r);
  r = B.call({ action: 'empPasswordReset', token: hrTk, id: e4.id });
  ok(r.ok && /^[A-Za-z2-9]{10}$/.test(r.tempPassword) && /\d/.test(r.tempPassword), 'HR issues a 10-character temporary password', r);
  const temp = r.tempPassword;
  r = B.call({ action: 'me', token: oldPw.token });
  ok(!r.ok && r.error === 'session_expired', 'the reset ends sessions opened with the old password', r);
  r = B.call({ action: 'pwLogin', empNo: '4001', password: 'Mine2026pass' });
  ok(!r.ok && r.error === 'bad_login', 'the old password no longer works', r);
  r = B.call({ action: 'pwLogin', empNo: '4001', password: temp });
  ok(r.ok && r.mustChange === true, 'the temporary password signs in and demands a new one', r);
  const tmpTok = r.token;
  r = B.call({ action: 'myHistory', token: tmpTok });
  ok(!r.ok && r.error === 'password_change_required', 'nothing else works until the password is changed', r);
  r = B.call({ action: 'punchPw', token: tmpTok, geo: { samples: samples(30) } });
  ok(!r.ok && r.error === 'password_change_required', 'not even check-in', r);
  r = B.call({ action: 'passwordSet', token: tmpTok, current: temp, password: temp });
  ok(!r.ok && r.error === 'password_reused', 'the temporary password cannot be kept', r);
  r = B.call({ action: 'passwordSet', token: tmpTok, current: temp, password: 'Fresh2026pass' });
  ok(r.ok, 'the employee chooses a new password', r);
  r = B.call({ action: 'myHistory', token: tmpTok });
  ok(r.ok, 'and the session works normally', r.error);
  r = B.call({ action: 'empList', token: admT });
  ok(r.rows.find(e => e.empNo === '4001').mustChangePassword === false && r.rows.find(e => e.empNo === '4001').hasPassword, 'HR sees the password status in the employee list');

  // PIN change on the device
  let b = B.call({ action: 'authBegin', empNo: '4001' });
  r = B.call({ action: 'pinChange', credential: oldDev.get(b.options), pin: '111112', newPin: '905172' });
  ok(!r.ok && r.error === 'bad_pin', 'changing the PIN needs the current PIN', r);
  b = B.call({ action: 'authBegin', empNo: '4001' });
  r = B.call({ action: 'pinChange', credential: oldDev.get(b.options), pin: oldDev.pin, newPin: '123456' });
  ok(!r.ok && r.error === 'weak_pin', 'the new PIN cannot be an obvious one', r);
  b = B.call({ action: 'authBegin', empNo: '4001' });
  r = B.call({ action: 'pinChange', credential: oldDev.get(b.options), pin: oldDev.pin, newPin: '905172' });
  ok(r.ok, 'the PIN is changed with the current PIN and the device signature', r);
  r = signIn(oldDev.pin);
  ok(!r.ok && r.error === 'bad_pin', 'the old PIN stops working', r);
  oldDev.pin = '905172';
  r = signIn(oldDev.pin);
  ok(r.ok, 'the new PIN works', r.error);
}

console.log('Sign-in copy of the employees tab stays live');
{
  const sh = () => B.ctx.sheet_('employees');
  const col = B.ctx.HEADERS.employees.indexOf('status');
  const rowOf = () => sh()._rows.findIndex(x => x && String(x[B.ctx.HEADERS.employees.indexOf('empNo')]) === '4001');
  const edit = () => B.ctx.onEdit({ range: { getSheet: () => ({ getName: () => 'employees' }) } });
  r = B.call({ action: 'authBegin', empNo: '4001' });
  ok(r.ok, 'sign-in challenge (warms the copy)', r);
  const i = rowOf();
  sh()._rows[i][col] = 'disabled'; edit();
  r = B.call({ action: 'authBegin', empNo: '4001' });
  ok(!r.ok && r.error === 'unknown_employee', 'a hand edit in the Sheet (disable) takes effect on the very next sign-in', r);
  sh()._rows[i][col] = 'active'; edit();
  r = B.call({ action: 'authBegin', empNo: '4001' });
  ok(r.ok, 'and re-enabling by hand works at once too', r);
  B.ctx.USE_TAB_CACHE_ = false;
  B.ctx.withLock_(() => { B.ctx.forget_('employees'); const e = B.ctx.findBy_('employees', 'empNo', '4001'); e.status = 'disabled'; B.ctx.update_('employees', e); });
  B.ctx.READ_MEMO_ = {};
  r = B.call({ action: 'authBegin', empNo: '4001' });
  ok(!r.ok && r.error === 'unknown_employee', 'a change saved by the app takes effect on the very next sign-in', r);
  B.ctx.USE_TAB_CACHE_ = false;
  B.ctx.withLock_(() => { B.ctx.forget_('employees'); const e = B.ctx.findBy_('employees', 'empNo', '4001'); e.status = 'active'; B.ctx.update_('employees', e); });
  let threw = false;
  B.ctx.USE_TAB_CACHE_ = true; B.ctx.READ_MEMO_ = {}; B.ctx.TAB_PREFETCH_ = null;
  B.ctx.readAll_('employees'); B.ctx.READ_MEMO_ = {}; B.ctx.TAB_PREFETCH_ = null;
  const cachedRow = B.ctx.readAll_('employees')[0];
  try { B.ctx.update_('employees', cachedRow); } catch (e) { threw = /cached copy/.test(e.message); }
  B.ctx.USE_TAB_CACHE_ = false; B.ctx.READ_MEMO_ = {};
  ok(threw, 'a row from the copy can never be written back to the Sheet');
}

console.log('Google Sheets value conversion');
{
  const e = B.ctx.findBy_('employees', 'empNo', '2001');
  const sh = B.ctx.sheet_('employees'), H = B.ctx.HEADERS.employees;
  const row = sh._rows[e._row - 1];
  ok(typeof row[H.indexOf('createdAt')] === 'string', 'text written by the app is stored as text, not converted to a date');
  const ps = B.ctx.sheet_('punches')._rows.slice(1);
  ok(ps.length && ps.every(p => typeof p[B.ctx.HEADERS.punches.indexOf('date')] === 'string'), 'a punch day like 2026-10-04 stays text in the sheet');
  // a cell that Sheets did convert (rows written by the old code) reads back in the app's format
  B.ctx.READ_MEMO_ = {};
  const di = B.ctx.HEADERS.punches.indexOf('date');
  const old = ps[0][di]; ps[0][di] = new Date(Date.UTC(+old.slice(0, 4), +old.slice(5, 7) - 1, +old.slice(8, 10)));
  B.ctx.READ_MEMO_ = {};
  ok(B.ctx.readAll_('punches')[0].date === old, 'a converted date cell reads back as YYYY-MM-DD', B.ctx.readAll_('punches')[0].date);
  ps[0][di] = old;
  const si = H.indexOf('shiftStart'); const was = row[si]; row[si] = new Date(Date.UTC(1899, 11, 30, 8, 30));
  B.ctx.READ_MEMO_ = {};
  ok(B.ctx.findBy_('employees', 'empNo', '2001').shiftStart === '08:30', 'a converted time cell reads back as HH:MM', B.ctx.findBy_('employees', 'empNo', '2001').shiftStart);
  row[si] = was; B.ctx.READ_MEMO_ = {};
  const pi = H.indexOf('phone'); const wp = row[pi];
  B.ctx.withLock_(() => { const x = B.ctx.findBy_('employees', 'empNo', '2001'); x.phone = '0501234567'; B.ctx.update_('employees', x); });
  B.ctx.READ_MEMO_ = {};
  ok(B.ctx.findBy_('employees', 'empNo', '2001').phone === '0501234567', 'a mobile number keeps its leading zero');
  const ni = H.indexOf('name');
  B.ctx.withLock_(() => { const x = B.ctx.findBy_('employees', 'empNo', '2001'); x.name = '=HYPERLINK("http://x")'; B.ctx.update_('employees', x); });
  B.ctx.READ_MEMO_ = {};
  ok(row[ni] === '=HYPERLINK("http://x")' && typeof row[ni] === 'string', 'a name starting with = is stored as text, never run as a formula');
  B.ctx.withLock_(() => { const x = B.ctx.findBy_('employees', 'empNo', '2001'); x.name = 'موظف تجريبي'; x.phone = wp; B.ctx.update_('employees', x); });
  B.ctx.READ_MEMO_ = {};
}

console.log('A new hire added before the first day');
{
  // HR adds someone on 4 October who starts on 11 October: no day before the 11th may count as absent.
  const N = load({ setupKeyHash: sha('k9'), now: Date.parse('2026-10-04T06:00:00Z') });
  const dev = {}, tk = {};
  const add = (no, code) => { dev[no] = new Authenticator(); const b = N.call({ action: 'enrollBegin', empNo: no, code }); tk[no] = N.call({ action: 'enrollFinish', credential: dev[no].create(b.options) }).token; };
  add('9000', N.call({ action: 'bootstrap', setupKey: 'k9', name: 'مسؤول', empNo: '9000' }).activationCode);
  const made = N.call({ action: 'empSave', token: tk['9000'], emp: { empNo: '9001', name: 'موظف جديد', role: 'employee' } });
  add('9001', made.activationCode);
  ok(N.call({ action: 'hrEmpSave', token: tk['9000'], emp: { id: made.emp.id, hireDate: '2026-10-11' } }).ok, 'the record is created on 4 October with a hire date of 11 October');
  const relog = () => ['9000', '9001'].forEach(no => { const b = N.call({ action: 'authBegin', empNo: no }); tk[no] = N.call({ action: 'authFinish', credential: dev[no].get(b.options) }).token; });
  N.setNow(Date.parse('2026-10-08T07:00:00Z')); relog();
  let h = N.call({ action: 'myHistory', token: tk['9001'], month: '2026-10' });
  ok(h.ok && h.days.length === 0 && h.totals.absent === 0, 'before the first day the history lists no day and no absence', h.days && h.days.map(d => d.date + ':' + d.status));
  let rp = N.call({ action: 'report', token: tk['9000'], from: '2026-10-04', to: '2026-10-08' });
  ok(rp.ok && rp.totals.find(t => t.emp.empNo === '9001').absent === 0 && !rp.rows.some(x => x.empId === made.emp.id), 'the attendance report counts no absence before the hire date');
  let bd = N.call({ action: 'board', token: tk['9000'] });
  ok(bd.ok && !bd.rows.some(x => x.emp.empNo === '9001') && bd.kpi.total === 1, 'the live board leaves out someone who has not started yet (only the administrator is counted)', bd.kpi);
  N.setNow(Date.parse('2026-10-12T07:00:00Z')); relog();
  h = N.call({ action: 'myHistory', token: tk['9001'], month: '2026-10' });
  ok(h.days.map(d => d.date + ':' + d.status).join() === '2026-10-12:absent,2026-10-11:absent', 'from the hire date on, days count as usual', h.days.map(d => d.date + ':' + d.status));
  bd = N.call({ action: 'board', token: tk['9000'] });
  ok(bd.rows.some(x => x.emp.empNo === '9001' && x.day.status === 'absent'), 'and he is on the board');
}

console.log('Tokens');
r = B.call({ action: 'me', token: adminToken.slice(0, -2) + 'xx' });
ok(!r.ok && r.error === 'session_expired', 'a forged token is refused', r);
B.setNow(T0 + 30 * 24 * 3600000);
r = B.call({ action: 'me', token: hrToken });
ok(!r.ok && r.error === 'session_expired', 'tokens expire', r);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
