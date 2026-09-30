/**
 * Enrollment, sign-in, and the punch itself.
 *
 * A punch is accepted only when all of these hold:
 *   1. a fresh passkey assertion (Face ID / fingerprint, user verification
 *      required) from the one device enrolled for that employee, over a
 *      single-use server challenge issued for that punch;
 *   2. a GPS fix good enough to trust (accuracy <= maxAccuracy) that lies
 *      inside one of the employee's zones;
 *   3. the punch is the expected next one (in after out, out after in) and
 *      not a double tap.
 * Signals a browser cannot prove (mock-location apps, frozen coordinates,
 * a wrong clock, impossible travel) add risk points. Above the threshold the
 * punch still counts but lands in the HR review queue.
 */

// ---------------- first administrator ----------------

function hasAdmin_() {
  return readAll_(SHEETS.EMP).some(function (e) { return e.role === 'admin' && e.status === 'active'; });
}

function api_bootstrapStatus() { return { ok: true, needsSetup: !hasAdmin_() }; }

/**
 * Admin recovery: a fresh activation code for an administrator, for a new laptop
 * or phone, authorised by the private setup key (never in the repo). Audited.
 */
function api_adminRecover(req) {
  var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
  if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) {
    // Only wrong keys are counted, so junk requests cannot lock the owner out of recovery.
    if (!rateLimit_('recoverFail:' + String(req.empNo || ''), 10, 3600)) fail_('too_many_attempts');
    fail_('bad_setup_key');
  }
  return withLock_(function () {
    var emp = empByNo_(req.empNo);
    if (!emp || emp.role !== 'admin' || emp.status !== 'active') fail_('not_found');
    var code = setActivation_(emp);
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(emp.id, 'admin_recovery_code', emp.id, null);
    return { ok: true, empNo: String(emp.empNo), activationCode: code, expires: emp.actExp };
  });
}

function api_bootstrap(req) {
  if (!rateLimit_('bootstrap', 10, 900)) fail_('too_many_attempts');
  return withLock_(function () {
    if (hasAdmin_()) fail_('already_setup');
    var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
    if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) fail_('bad_setup_key');
    var name = String(req.name || '').trim(), empNo = String(req.empNo || '').trim();
    if (!name || !empNo) fail_('missing_fields');
    var now = new Date().toISOString();
    var emp = { id: newId_('E'), empNo: empNo, name: name, nameEn: String(req.nameEn || ''), email: String(req.email || ''),
      phone: '', department: 'Management', title: '', role: 'admin', status: 'active', zoneIds: '', shiftStart: '', shiftEnd: '',
      workdays: '', tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now, updatedAt: now };
    var code = setActivation_(emp);
    append_(SHEETS.EMP, emp);
    audit_(emp.id, 'bootstrap_admin', emp.id, { empNo: empNo });
    return { ok: true, empNo: empNo, activationCode: code };
  });
}

// ---------------- activation codes ----------------

var ACT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function setActivation_(emp, issuedBy) {
  emp.actIssuedBy = issuedBy || '';
  var b = randomBytes_(8), code = '';
  for (var i = 0; i < 8; i++) { code += ACT_ALPHABET[b[i] % ACT_ALPHABET.length]; if (i === 3) code += '-'; }
  emp.actHash = sha256Hex_(emp.id + ':' + code);
  emp.actExp = new Date(Date.now() + CONFIG.ACTIVATION_HOURS * 3600000).toISOString();
  emp.actTries = 0;
  return code;
}

function normCode_(c) {
  c = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : c;
}

function empByNo_(empNo) {
  var n = String(empNo || '').trim();
  if (!n) return null;
  var rows = readAll_(SHEETS.EMP);
  for (var i = 0; i < rows.length; i++) if (String(rows[i].empNo).trim() === n) return rows[i];
  return null;
}

// ---------------- enrollment: activation code -> passkey ----------------

function api_enrollBegin(req) {
  var empNo = String(req.empNo || '').trim();
  if (!rateLimit_('enroll:' + empNo, 8, 900)) fail_('too_many_attempts');
  return withLock_(function () {
    var emp = empByNo_(empNo);
    if (!emp || emp.status !== 'active' || !emp.actHash) fail_('bad_activation');
    if (new Date(emp.actExp).getTime() < Date.now()) fail_('activation_expired');
    if (Number(emp.actTries || 0) >= CONFIG.ACTIVATION_MAX_TRIES) fail_('activation_locked');
    if (!safeEqual_(sha256Hex_(emp.id + ':' + normCode_(req.code)), emp.actHash)) {
      emp.actTries = Number(emp.actTries || 0) + 1;
      update_(SHEETS.EMP, emp);
      audit_(emp.id, 'activation_failed', emp.id, { tries: emp.actTries });
      fail_(emp.actTries >= CONFIG.ACTIVATION_MAX_TRIES ? 'activation_locked' : 'bad_activation');
    }
    var c = cfg_();
    var challenge = newChallenge_({ purpose: 'reg', empId: emp.id });
    return {
      ok: true,
      options: {
        challenge: challenge,
        rp: { id: c.rpId, name: CONFIG.RP_NAME },
        user: { id: bytesToB64u_(utf8Bytes_(emp.id)), name: String(emp.empNo), displayName: emp.name },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        attestation: 'none',
        timeout: 120000
      }
    };
  });
}

function api_enrollFinish(req) {
  var isDk = !!req.deviceKey;
  var platform = req.platform === 'desktop' ? 'desktop' : 'mobile';
  var st = settings_();
  if (platform === 'desktop' && !st.allowDesktop) fail_('desktop_disabled');
  if (platform === 'desktop' && !isDk) fail_('bad_credential');
  if (isDk && platform === 'mobile' && !st.allowDeviceKey) fail_('device_key_disabled');
  // Every device key (phone or laptop) is opened with a 6-digit PIN; passkeys use Face ID instead.
  var pin = isDk ? String(req.pin || '') : '';
  if (isDk && !/^\d{6}$/.test(pin)) fail_('bad_pin_format');
  if (pin && weakPin_(pin)) fail_('weak_pin');
  var reg = isDk ? verifyDeviceKeyRegistration_(req.deviceKey) : verifyRegistration_(req.credential);
  return withLock_(function () {
    var ch = takeChallenge_(reg.challenge);
    if (!ch || ch.purpose !== 'reg') fail_('challenge_expired');
    var emp = findBy_(SHEETS.EMP, 'id', ch.empId);
    if (!emp || emp.status !== 'active' || !emp.actHash) fail_('bad_activation');
    if (findBy_(SHEETS.CRED, 'credId', reg.credId)) fail_('bad_credential');
    // One phone and one laptop per employee: a new enrollment retires only the earlier device of the same kind.
    var retired = 0;
    readAll_(SHEETS.CRED).forEach(function (c) {
      if (c.empId === emp.id && c.status === 'active' && (c.platform || 'mobile') === platform) { c.status = 'retired'; update_(SHEETS.CRED, c); retired++; }
    });
    var salt = pin ? bytesToB64u_(randomBytes_(16)) : '';
    var now = new Date().toISOString();
    append_(SHEETS.CRED, { credId: reg.credId, empId: emp.id, x: reg.x, y: reg.y, signCount: reg.signCount,
      label: String(req.label || '').slice(0, 80), status: 'active', createdAt: now, lastUsedAt: now, aaguid: reg.aaguid,
      kind: isDk ? 'devicekey' : 'passkey', platform: platform, pinHash: pin ? pinHash_(pin, salt) : '', pinSalt: salt, pinTries: 0 });
    var issuedBy = emp.actIssuedBy || '';
    emp.actHash = ''; emp.actExp = ''; emp.actTries = 0; emp.actIssuedBy = '';
    // Replacing a device ends the old device's sessions; adding a second kind (a laptop next to the phone) does not.
    if (retired) emp.tokenVer = Number(emp.tokenVer || 0) + 1;
    emp.updatedAt = now;
    update_(SHEETS.EMP, emp);
    audit_(emp.id, 'device_enrolled', emp.id, { credId: reg.credId.slice(0, 12), label: req.label, kind: isDk ? 'devicekey' : 'passkey', platform: platform, replaced: retired, codeIssuedBy: issuedBy });
    return { ok: true, token: issueToken_(emp), me: publicEmp_(emp), credId: reg.credId, kind: isDk ? 'devicekey' : 'passkey', platform: platform, home: homePayload_(emp) };
  });
}

// ---------------- password sign-in (any device) ----------------

var PW_ROUNDS = 1200, PW_MAX_TRIES = 5, PW_LOCK_MINUTES = 15;

function pwHash_(pw, salt) {
  var h = utf8Bytes_(salt + '|' + pw), s = utf8Bytes_(salt);
  for (var i = 0; i < PW_ROUNDS; i++) h = sha256_(h.concat(s));
  return bytesToB64u_(h);
}

/** At least 8 characters, letters and digits, at least 5 different characters, and not containing the employee number. */
function pwPolicy_(pw, emp) {
  pw = String(pw || '');
  if (pw.length < 8 || pw.length > 128) fail_('weak_password');
  if (!/[A-Za-z\u0600-\u06FF]/.test(pw) || !/\d/.test(pw)) fail_('weak_password');
  var distinct = {};
  for (var i = 0; i < pw.length; i++) distinct[pw[i]] = 1;
  if (Object.keys(distinct).length < 5) fail_('weak_password');
  if (emp && String(emp.empNo) && pw.indexOf(String(emp.empNo)) >= 0) fail_('weak_password');
}

function api_passwordSet(req, me) {
  pwPolicy_(req.password, me);
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', me.id);
    if (emp.pwHash && !safeEqual_(pwHash_(String(req.current || ''), emp.pwSalt), emp.pwHash)) fail_('bad_current_password');
    emp.pwSalt = bytesToB64u_(randomBytes_(16));
    emp.pwHash = pwHash_(String(req.password), emp.pwSalt);
    if (req.current && String(req.current) === String(req.password)) fail_('password_reused');
    emp.pwTries = 0; emp.pwLockUntil = ''; emp.pwMustChange = false;
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'password_set', me.id, null);
    return { ok: true };
  });
}

function api_pwLogin(req) {
  var empNo = String(req.empNo || '').trim();
  if (!rateLimit_('pw:' + empNo, 12, 900)) fail_('too_many_attempts');
  return withLock_(function () {
    var emp = empByNo_(empNo);
    // One message for unknown employee, no password yet, and wrong password: nothing to learn from the reply.
    if (!emp || emp.status !== 'active' || !emp.pwHash) {
      // Unknown numbers lock too, so password_locked does not reveal which accounts exist.
      var c = CacheService.getScriptCache(), k = 'pwghost:' + empNo, n = Number(c.get(k) || 0) + 1;
      c.put(k, String(n), PW_LOCK_MINUTES * 60);
      fail_(n >= PW_MAX_TRIES ? 'password_locked' : 'bad_login');
    }
    if (emp.pwLockUntil && new Date(emp.pwLockUntil).getTime() > Date.now()) fail_('password_locked');
    if (!safeEqual_(pwHash_(String(req.password || ''), emp.pwSalt), emp.pwHash)) {
      emp.pwTries = Number(emp.pwTries || 0) + 1;
      var locked = emp.pwTries >= PW_MAX_TRIES;
      if (locked) { emp.pwLockUntil = new Date(Date.now() + PW_LOCK_MINUTES * 60000).toISOString(); emp.pwTries = 0; }
      update_(SHEETS.EMP, emp);
      audit_(emp.id, 'password_failed', emp.id, { locked: locked });
      fail_(locked ? 'password_locked' : 'bad_login');
    }
    if (Number(emp.pwTries || 0) || emp.pwLockUntil) { emp.pwTries = 0; emp.pwLockUntil = ''; update_(SHEETS.EMP, emp); }
    audit_(emp.id, 'login_password', emp.id, null);
    var home = homePayload_(emp, true); // a password session checks in through punchPw, not a device challenge
    var must = emp.pwMustChange === true || emp.pwMustChange === 'true' || emp.pwMustChange === 'TRUE';
    return { ok: true, token: issueToken_(emp, 'pw'), me: publicEmp_(emp), home: home, mustChange: must };
  });
}

// ---------------- passkey sign-in and punch ----------------

function activeCreds_(empId) {
  return readAll_(SHEETS.CRED).filter(function (c) { return c.empId === empId && c.status === 'active'; });
}

function activeCred_(empId) { return activeCreds_(empId)[0] || null; }

// ---------------- laptop PIN ----------------

var PIN_ROUNDS = 400, PIN_MAX_TRIES = 5;

/** Salted, iterated SHA-256. A 6-digit PIN is weak on its own; the lockout and the device key carry the weight. */
function pinHash_(pin, salt) {
  var h = utf8Bytes_(salt + ':' + pin), sb = utf8Bytes_(salt);
  for (var i = 0; i < PIN_ROUNDS; i++) h = sha256Js_(h.concat(sb));
  return bytesToB64u_(h);
}

function weakPin_(pin) {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  var up = '0123456789', down = '9876543210';
  return up.indexOf(pin) >= 0 || down.indexOf(pin) >= 0;
}

/** Checks the PIN of a laptop credential after its signature has verified. Locks the laptop after 5 misses. */
function checkPin_(cred, pin) {
  if (!cred.pinHash) return;
  if (safeEqual_(pinHash_(String(pin || ''), cred.pinSalt), cred.pinHash)) {
    if (Number(cred.pinTries || 0)) { cred.pinTries = 0; update_(SHEETS.CRED, cred); }
    return;
  }
  cred.pinTries = Number(cred.pinTries || 0) + 1;
  if (cred.pinTries >= PIN_MAX_TRIES) cred.status = 'locked';
  update_(SHEETS.CRED, cred);
  audit_(cred.empId, 'pin_failed', cred.empId, { tries: cred.pinTries, locked: cred.status === 'locked' });
  fail_(cred.status === 'locked' ? 'device_locked' : 'bad_pin');
}

function assertionOptions_(emp, purpose, extra) {
  var creds = activeCreds_(emp.id);
  if (!creds.length) fail_(readAll_(SHEETS.CRED).some(function (c) { return c.empId === emp.id && c.status === 'locked'; }) ? 'device_locked' : 'no_device');
  var st = settings_();
  var usable = creds.filter(function (c) {
    if (c.platform === 'desktop') return st.allowDesktop;
    return c.kind !== 'devicekey' || st.allowDeviceKey;
  });
  if (!usable.length) fail_(creds[0].platform === 'desktop' ? 'desktop_disabled' : 'device_key_disabled');
  creds = usable;
  var cred = creds[0];
  var data = { purpose: purpose, empId: emp.id };
  for (var k in (extra || {})) data[k] = extra[k];
  return {
    kind: cred.kind || 'passkey',
    challenge: newChallenge_(data), // one challenge per call; callers pass the punch type in extra instead of replacing it
    rpId: cfg_().rpId,
    allowCredentials: creds.filter(function (c) { return c.kind !== 'devicekey'; }).map(function (c) { return { type: 'public-key', id: c.credId, transports: ['internal', 'hybrid'] }; }),
    userVerification: 'required',
    timeout: 60000
  };
}

function beginFor_(req, purpose, extra) {
  var emp = empByNo_(req.empNo);
  if (!rateLimit_('auth:' + String(req.empNo || ''), 30, 600)) fail_('too_many_attempts');
  if (!emp || emp.status !== 'active') fail_('unknown_employee');
  return { emp: emp, options: assertionOptions_(emp, purpose, extra) };
}

/** Verifies an assertion and returns {emp, cred, ch}. Must run inside the lock. */
function finishFor_(req, purpose) {
  var a = req.credential;
  if (!a || !a.response || !a.id) fail_('bad_credential');
  var cred = findBy_(SHEETS.CRED, 'credId', a.id);
  if (cred && cred.status === 'locked') fail_('device_locked');
  if (!cred || cred.status !== 'active') fail_('device_not_recognised');
  var st = settings_();
  if (cred.platform === 'desktop' && !st.allowDesktop) fail_('desktop_disabled');
  if (cred.kind === 'devicekey' && cred.platform !== 'desktop' && !st.allowDeviceKey) fail_('device_key_disabled');
  var res;
  try { res = verifyAssertion_(a, cred); }
  catch (e) { audit_(cred.empId, 'assertion_failed', cred.empId, { purpose: purpose, error: String(e.message) }); throw e; }
  var ch = takeChallenge_(res.challenge);
  if (!ch || ch.purpose !== purpose || ch.empId !== cred.empId) fail_('challenge_expired');
  checkPin_(cred, req.pin);
  var emp = findBy_(SHEETS.EMP, 'id', cred.empId);
  if (!emp || emp.status !== 'active') fail_('unknown_employee');
  cred.signCount = res.signCount;
  cred.lastUsedAt = new Date().toISOString();
  update_(SHEETS.CRED, cred);
  return { emp: emp, cred: cred, ch: ch };
}

/** Change the PIN of this device. The current PIN and a fresh device signature are both required. */
function api_pinChange(req) {
  var newPin = String(req.newPin || '');
  if (!/^\d{6}$/.test(newPin)) fail_('bad_pin_format');
  if (weakPin_(newPin)) fail_('weak_pin');
  if (newPin === String(req.pin || '')) fail_('pin_reused');
  return withLock_(function () {
    var r = finishFor_(req, 'login');
    if (!r.cred.pinHash) fail_('bad_request');
    r.cred.pinSalt = bytesToB64u_(randomBytes_(16));
    r.cred.pinHash = pinHash_(newPin, r.cred.pinSalt);
    r.cred.pinTries = 0;
    update_(SHEETS.CRED, r.cred);
    audit_(r.emp.id, 'pin_changed', r.emp.id, { credId: r.cred.credId.slice(0, 12) });
    return { ok: true, token: issueToken_(r.emp) };
  });
}

function api_authBegin(req) {
  return { ok: true, options: beginFor_(req, 'login').options };
}

function api_authFinish(req) {
  var r = withLock_(function () { return finishFor_(req, 'login'); });
  // Reading the home screen and writing the audit line do not need the lock: others sign in meanwhile.
  var out = { ok: true, token: issueToken_(r.emp), me: publicEmp_(r.emp), home: homePayload_(r.emp) };
  audit_(r.emp.id, 'login', r.emp.id, null);
  return out;
}

/**
 * Live timing of each server step (owner only: needs the setup key). Writes nothing but one audit line.
 * Used to find where sign-in time goes on Google's servers, which the local tests cannot show.
 */
function api_diag(req) {
  var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
  if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) {
    if (!rateLimit_('diagFail', 10, 3600)) fail_('too_many_attempts');
    fail_('bad_setup_key');
  }
  var out = {}, rows = {};
  function time(name, fn) { var t = Date.now(); var v = fn(); out[name] = Date.now() - t; return v; }
  time('lock', function () { return withLock_(function () { return 0; }); });
  [SHEETS.EMP, SHEETS.CRED, SHEETS.PUNCH, SHEETS.ZONES, SHEETS.SET, SHEETS.AUDIT].forEach(function (n) {
    rows[n] = time('read_' + n, function () { forget_(n); return readAll_(n).length; });
  });
  time('settings', function () { return settings_(); });
  time('pin_js', function () { return pinHash_('482915', 'c2FsdHNhbHRzYWx0c2FsdA'); });
  time('pin_old_service', function () {
    var h = utf8Bytes_('s:482915');
    for (var i = 0; i < PIN_ROUNDS; i++) h = sha256_(h.concat(utf8Bytes_('s')));
    return h;
  });
  var hx = function (s) { var b = []; for (var i = 0; i < s.length; i += 2) b.push(parseInt(s.substr(i, 2), 16)); return b; };
  out.ecdsa_ok = time('ecdsa', function () { return ecdsaVerifyP256_(hx('6318e6764ee2e5c38008886a7adc30b0ea77ee448721c89eefad520d6dab931f'), hx('1638944fddefbe8bfbb63b1a0463226689a0c2f57ca8838cb80a170e37c72746bdaedc5ef7e97272d2022c8448b4b5b76dadcb76ff4668097e712aefcfdfc24b'), hx('16444adae39d0e29fb8bb449de7e0cde8bf18906cccc221617dc283b34416be1'), hx('097a9783017ea068de342a2fead02d394a7dacc960b60f081e614ef538ecac78'), true); });
  time('cache', function () { var ch = newChallenge_({ purpose: 'diag' }); return takeChallenge_(ch); });
  time('token', function () { return readToken_(issueToken_({ id: 'diag', role: 'employee', tokenVer: 0 })); });
  var emp = req.empNo ? empByNo_(req.empNo) : null;
  if (emp) time('home', function () { return homePayload_(emp); });
  time('audit_append', function () { audit_('', 'diag', '', out); });
  return { ok: true, ms: out, rows: rows };
}

function api_punchBegin(req) {
  var emp = empByNo_(req.empNo);
  if (!rateLimit_('auth:' + String(req.empNo || ''), 30, 600)) fail_('too_many_attempts');
  if (!emp || emp.status !== 'active') fail_('unknown_employee');
  var expected = nextPunchType_(emp.id);
  if (req.type && req.type !== expected) fail_('state_changed');
  return { ok: true, type: expected, options: assertionOptions_(emp, 'punch', { type: expected }) };
}

function api_punchFinish(req) {
  return withLock_(function () {
    var r = finishFor_(req, 'punch');
    var type = nextPunchType_(r.emp.id);
    if (r.ch.type !== type) fail_('state_changed');
    return recordPunch_(r.emp, r.cred, req, type, 'dev');
  });
}

/** Check-in from a password session: same zone, accuracy and risk rules, flagged so HR can see it. */
function api_punchPw(req, me) {
  if (me._auth !== 'pw') fail_('forbidden');
  if (!settings_().allowPasswordPunch) fail_('password_punch_disabled');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', me.id);
    var type = nextPunchType_(emp.id);
    if (req.type && req.type !== type) fail_('state_changed');
    return recordPunch_(emp, { credId: 'password', kind: 'password', platform: '', createdAt: '' }, req, type, 'pw');
  });
}

function recordPunch_(emp, cred, req, type, method) {
  {
    var s = settings_();
    var r = { cred: cred };
    var last = lastPunch_(emp.id);
    var now = new Date();
    if (last && now.getTime() - new Date(last.ts).getTime() < s.minPunchGapMin * 60000) fail_('too_soon');

    var geo = evaluateGeo_(emp, req.geo, s, type, r.cred.platform === 'desktop');
    var risk = riskScore_(emp, r.cred, req, geo, last, now);
    var lp = localParts_(now);
    var punch = {
      id: newId_('P'), empId: emp.id, type: type, ts: now.toISOString(), date: lp.date,
      lat: geo.fix ? geo.fix.lat : '', lng: geo.fix ? geo.fix.lng : '', acc: geo.fix ? Math.round(geo.fix.acc) : '',
      zoneId: geo.zone ? geo.zone.id : '', distance: geo.distance == null ? '' : Math.round(geo.distance),
      status: '', risk: risk.score, flags: risk.flags.concat(geo.flags).join(','), source: 'app', note: '',
      reviewBy: '', reviewAt: '', credId: r.cred.credId.slice(0, 16), ua: String(req.ua || '').slice(0, 160), createdAt: now.toISOString()
    };
    if (geo.reject) {
      punch.status = 'rejected';
      punch.note = geo.reject;
      append_(SHEETS.PUNCH, punch);
      audit_(emp.id, 'punch_rejected', punch.id, { reason: geo.reject, distance: punch.distance, acc: punch.acc });
      return { ok: false, error: geo.reject, distance: punch.distance, accuracy: punch.acc, token: issueToken_(emp, method) };
    }
    punch.status = risk.score >= s.reviewRiskThreshold ? 'review' : 'ok';
    append_(SHEETS.PUNCH, punch);
    audit_(emp.id, 'punch_' + type, punch.id, { status: punch.status, risk: risk.score, flags: punch.flags });
    var today = todayFor_(emp, s), next = null;
    if (method !== 'pw') { try { next = { type: today.next, options: punchOptions_(emp, today.next) }; } catch (e) {} }
    return { ok: true, punch: publicPunch_(punch), today: today, next: next, token: issueToken_(emp, method) };
  }
}

// ---------------- geofence ----------------

function haversine_(lat1, lng1, lat2, lng2) {
  var R = 6371008.8, rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function zonesFor_(emp) {
  var ids = String(emp.zoneIds || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  return readAll_(SHEETS.ZONES).filter(function (z) {
    return z.status === 'active' && (!ids.length || ids.indexOf(z.id) >= 0);
  });
}

function cleanSamples_(geo) {
  var raw = (geo && geo.samples) || [];
  var out = [];
  for (var i = 0; i < raw.length && out.length < 12; i++) {
    var s = raw[i], lat = Number(s.lat), lng = Number(s.lng), acc = Number(s.acc);
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(acc) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || acc < 0) continue;
    out.push({ lat: lat, lng: lng, acc: acc, t: Number(s.t) || 0 });
  }
  return out;
}

function evaluateGeo_(emp, geo, s, type, desktop) {
  var samples = cleanSamples_(geo), flags = [];
  if (!samples.length) return { reject: 'no_location', flags: flags, samples: samples };
  var fix = samples.reduce(function (b, x) { return x.acc < b.acc ? x : b; }, samples[0]);
  var zones = zonesFor_(emp);
  if (!zones.length) return { reject: 'no_zone', fix: fix, flags: flags, samples: samples };
  var best = null, bestD = Infinity;
  zones.forEach(function (z) {
    var d = haversine_(fix.lat, fix.lng, Number(z.lat), Number(z.lng)) - Number(z.radius);
    if (d < bestD) { bestD = d; best = z; }
  });
  var distance = haversine_(fix.lat, fix.lng, Number(best.lat), Number(best.lng));
  var radius = Number(best.radius);
  var res = { fix: fix, zone: best, distance: distance, radius: radius, flags: flags, samples: samples };
  var outsideOk = type === 'out' && s.allowCheckoutOutside;
  var maxAcc = desktop ? Number(s.maxAccuracyDesktop) : Number(s.maxAccuracy);
  if (fix.acc > maxAcc && !outsideOk) { res.reject = 'accuracy_too_low'; return res; }
  if (distance > radius) {
    if (outsideOk) { flags.push('outside_checkout'); return res; }
    res.reject = 'outside_zone';
    return res;
  }
  if (distance + fix.acc > radius) flags.push('edge');
  return res;
}

// ---------------- risk ----------------

var RISK_WEIGHTS = {
  static_samples: 35, zero_accuracy: 30, stale_fix: 20, clock_drift: 25, impossible_travel: 40,
  new_device: 10, few_samples: 10, off_hours: 10, edge: 10, outside_checkout: 30, no_biometric: 10, laptop: 5, password_login: 20
};

function riskScore_(emp, cred, req, geo, last, now) {
  var flags = [], samples = geo.samples || [];
  if (cred.kind === 'password') flags.push('password_login');
  else if (cred.platform === 'desktop') flags.push('laptop');
  else if (cred.kind === 'devicekey' && !cred.pinHash) flags.push('no_biometric');
  if (samples.length < 2) flags.push('few_samples');
  if (samples.length >= 3) {
    var f = samples[0];
    var frozen = samples.every(function (x) { return x.lat === f.lat && x.lng === f.lng && x.acc === f.acc; });
    if (frozen) flags.push('static_samples');
  }
  if (geo.fix && geo.fix.acc <= 1) flags.push('zero_accuracy');
  var deviceTime = Number(req.deviceTime) || 0;
  if (deviceTime && Math.abs(deviceTime - now.getTime()) > 5 * 60000) flags.push('clock_drift');
  if (geo.fix && geo.fix.t && deviceTime && Math.abs(deviceTime - geo.fix.t) > 60000) flags.push('stale_fix');
  if (cred.createdAt && now.getTime() - new Date(cred.createdAt).getTime() < 24 * 3600000) flags.push('new_device');
  var lp = localParts_(now);
  if (lp.minutes < 5 * 60) flags.push('off_hours');
  if (last && geo.fix && last.lat !== '' && last.lng !== '') {
    var km = haversine_(Number(last.lat), Number(last.lng), geo.fix.lat, geo.fix.lng) / 1000;
    var hrs = Math.max((now.getTime() - new Date(last.ts).getTime()) / 3600000, 1 / 60);
    if (km > 5 && km / hrs > 200) flags.push('impossible_travel');
  }
  var all = flags.concat(geo.flags || []);
  var score = all.reduce(function (t, k) { return t + (RISK_WEIGHTS[k] || 0); }, 0);
  return { score: Math.min(score, 100), flags: flags };
}

// ---------------- punch state and summaries ----------------

function isCounted_(p) { return p.status === 'ok' || p.status === 'review' || p.status === 'manual' || p.status === 'approved'; }

function punchesOf_(empId) {
  return readAll_(SHEETS.PUNCH).filter(function (p) { return p.empId === empId && isCounted_(p); })
    .sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
}

function lastPunch_(empId) { var p = punchesOf_(empId); return p.length ? p[p.length - 1] : null; }

/** In after out. An "in" left open from an earlier day does not demand an "out" today. */
function nextPunchType_(empId) {
  var last = lastPunch_(empId);
  if (!last || last.type === 'out') return 'in';
  return last.date === localParts_(new Date()).date ? 'out' : 'in';
}

function publicPunch_(p) {
  return { id: p.id, empId: p.empId, type: p.type, ts: p.ts, date: p.date, status: p.status, risk: Number(p.risk || 0),
    flags: String(p.flags || ''), distance: p.distance === '' ? null : Number(p.distance), acc: p.acc === '' ? null : Number(p.acc),
    zoneId: p.zoneId, source: p.source, note: p.note, lat: p.lat === '' ? null : Number(p.lat), lng: p.lng === '' ? null : Number(p.lng) };
}

function shiftOf_(emp, s) {
  return {
    start: emp.shiftStart ? String(emp.shiftStart) : s.shiftStart,
    end: emp.shiftEnd ? String(emp.shiftEnd) : s.shiftEnd,
    workdays: String(emp.workdays || s.workdays).split(',').map(Number),
    grace: Number(s.graceMin)
  };
}

/**
 * One employee-day. punches: that day's counted punches, time-sorted.
 * status: present | in | absent | off | upcoming | missing_out
 */
function summarizeDay_(emp, date, punches, s, now) {
  var sh = shiftOf_(emp, s);
  var lpNow = localParts_(now);
  var dow = new Date(date + 'T00:00:00Z').getUTCDay();
  var workday = sh.workdays.indexOf(dow) >= 0;
  var startM = hmToMin_(sh.start), endM = hmToMin_(sh.end);
  var out = { date: date, workday: workday, shiftStart: sh.start, shiftEnd: sh.end, firstIn: null, lastOut: null,
    workedMin: 0, lateMin: 0, earlyMin: 0, overtimeMin: 0, status: '', punches: punches.length, review: 0 };
  punches.forEach(function (p) { if (p.status === 'review') out.review++; });
  var openIn = null;
  punches.forEach(function (p) {
    var t = new Date(p.ts).getTime();
    if (p.type === 'in') { if (!openIn) openIn = t; if (!out.firstIn) out.firstIn = p.ts; }
    else if (openIn) { out.workedMin += Math.round((t - openIn) / 60000); openIn = null; out.lastOut = p.ts; }
  });
  var isToday = date === lpNow.date;
  if (openIn) {
    if (isToday) { out.workedMin += Math.round((now.getTime() - openIn) / 60000); out.status = 'in'; }
    else out.status = 'missing_out';
  }
  if (out.firstIn) {
    var inM = localParts_(new Date(out.firstIn)).minutes;
    if (workday && inM > startM + sh.grace) out.lateMin = inM - startM;
    if (!out.status) out.status = 'present';
    if (workday && out.lastOut && !openIn) {
      var outM = localParts_(new Date(out.lastOut)).minutes;
      if (outM < endM) out.earlyMin = endM - outM;
    }
    var planned = Math.max(endM - startM, 0);
    if (!workday) out.overtimeMin = out.workedMin;
    else if (out.workedMin > planned) out.overtimeMin = out.workedMin - planned;
  } else if (!workday) out.status = 'off';
  else if (date > lpNow.date || (isToday && lpNow.minutes <= startM + sh.grace)) out.status = 'upcoming';
  else out.status = 'absent';
  return out;
}

function todayFor_(emp, s) {
  var now = new Date(), date = localParts_(now).date;
  var ps = punchesOf_(emp.id).filter(function (p) { return p.date === date; });
  var sum = summarizeDay_(emp, date, ps, s, now);
  sum.list = ps.map(publicPunch_);
  sum.next = nextPunchType_(emp.id);
  return sum;
}

// ---------------- employee screens ----------------

/** Everything the home screen needs, so sign-in is one round trip instead of three. */
function homePayload_(me, noPunch) {
  var s = settings_();
  var today = todayFor_(me, s);
  var home = { me: publicEmp_(me), hasPassword: !!me.pwHash, zones: zonesFor_(me).map(publicZone_), today: today, shift: shiftOf_(me, s),
    devices: activeCreds_(me.id).map(publicDevice_),
    rules: { maxAccuracy: s.maxAccuracy, maxAccuracyDesktop: s.maxAccuracyDesktop, allowCheckoutOutside: s.allowCheckoutOutside },
    serverTime: new Date().toISOString() };
  home.punch = null;
  if (!noPunch) { try { home.punch = { type: today.next, options: punchOptions_(me, today.next) }; } catch (e) { home.punch = null; } }
  return home;
}

function punchOptions_(emp, type) { return assertionOptions_(emp, 'punch', { type: type }); }

function api_me(req, me) {
  var h = homePayload_(me);
  h.ok = true;
  return h;
}

function api_myHistory(req, me) {
  var s = settings_(), now = new Date();
  var month = /^\d{4}-\d{2}$/.test(req.month || '') ? req.month : localParts_(now).date.slice(0, 7);
  var all = punchesOf_(me.id).filter(function (p) { return String(p.date).slice(0, 7) === month; });
  var byDate = {};
  all.forEach(function (p) { (byDate[p.date] = byDate[p.date] || []).push(p); });
  var days = [], d = month + '-01', today = localParts_(now).date;
  var joined = joinedDate_(me);
  if (joined > d) d = joined;
  while (d.slice(0, 7) === month && d <= today) {
    var sum = summarizeDay_(me, d, byDate[d] || [], s, now);
    sum.list = (byDate[d] || []).map(publicPunch_);
    days.push(sum);
    d = addDays_(d, 1);
  }
  days.reverse();
  var tot = days.reduce(function (t, x) {
    t.workedMin += x.workedMin; t.lateMin += x.lateMin; t.overtimeMin += x.overtimeMin;
    if (x.status === 'absent') t.absent++;
    if (x.firstIn) t.present++;
    if (x.lateMin) t.lateDays++;
    return t;
  }, { workedMin: 0, lateMin: 0, overtimeMin: 0, absent: 0, present: 0, lateDays: 0 });
  return { ok: true, month: month, days: days, totals: tot };
}

/** First local date an employee counts for; nobody is absent before they were added. */
function joinedDate_(emp) {
  return emp.createdAt ? localParts_(new Date(emp.createdAt)).date : '0000-00-00';
}

function publicDevice_(c) {
  return { credId: c.credId, label: c.label, since: c.createdAt, lastUsedAt: c.lastUsedAt, kind: c.kind || 'passkey', platform: c.platform || 'mobile', status: c.status };
}

function publicZone_(z) {
  return { id: z.id, name: z.name, nameEn: z.nameEn, lat: Number(z.lat), lng: Number(z.lng), radius: Number(z.radius), status: z.status };
}
