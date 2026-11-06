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
    var name = String(req.name || '').trim(), empNo = String(req.empNo || '').trim() || nextEmpNos_(1)[0];
    if (!name) fail_('missing_fields');
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
  // the number alone ("42" or "1042") finds "WNS-0042" / "WNS-1042" when the organisation numbers with a prefix:
  // phones keep the number pad at sign-in
  var st = settings_(), px = String(st.empNoPrefix || '').trim();
  if (px && /^\d+$/.test(n)) {
    var want = px + n.padStart(Math.min(8, Math.max(1, Math.round(Number(st.empNoDigits) || 4))), '0');
    for (i = 0; i < rows.length; i++) { var v = String(rows[i].empNo).trim(); if (v === want || v === px + n) return rows[i]; }
  }
  return null;
}

// ---------------- enrollment: activation code -> passkey ----------------

/** Moving to the new BASMA link: a signed-in person gets a one-time activation code for themselves. Enrolling with it on
 *  the new link replaces this device (enrolment retires earlier keys), so the move needs no HR step. */
function api_moveCode(req, me) {
  if (!rateLimit_('move:' + me.id, 5, 3600)) fail_('too_many_attempts');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', me.id); if (!emp || emp.status !== 'active') fail_('not_found');
    var code = setActivation_(emp); emp.updatedAt = new Date().toISOString(); update_(SHEETS.EMP, emp);
    audit_(me.id, 'move_code', me.id, { to: CONFIG.NEW_HOME });
    return { ok: true, code: code, empNo: String(emp.empNo), orgId: orgId_(), to: CONFIG.NEW_HOME };
  });
}
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

/**
 * One device, one employee (2026-11-06). Run inside the lock, before the new key is stored. Returns how many keys were retired.
 * - the device is already someone else's: refused (device_taken) until HR unlinks that person's device
 * - this person's own earlier key on the same device: replaced
 * - more than maxDevices (setting, default 3): the least recently used ones are retired
 * - a request without a device id (an old copy of the app): the earlier rule, one device per kind
 */
function bindDevice_(emp, platform) {
  var all = readAll_(SHEETS.CRED), retired = [], st = settings_(), max = Math.max(1, Math.min(5, Math.round(Number(st.maxDevices) || 3)));
  var mine = all.filter(function (c) { return c.empId === emp.id && c.status === 'active'; });
  if (REQ_DEV_) {
    var other = all.filter(function (c) { return c.devId === REQ_DEV_ && c.status === 'active' && c.empId !== emp.id; })[0];
    if (other && !st.sharedDevices) { audit_(emp.id, 'device_taken', other.empId, { platform: platform }); fail_('device_taken'); }
    mine.forEach(function (c) { if (c.devId === REQ_DEV_) retired.push(c); });
    var left = mine.filter(function (c) { return retired.indexOf(c) < 0; })
      .sort(function (a, b) { return String(a.lastUsedAt || a.createdAt) < String(b.lastUsedAt || b.createdAt) ? -1 : 1; });
    while (left.length >= max) retired.push(left.shift());
  } else {
    mine.forEach(function (c) { if ((c.platform || 'mobile') === platform) retired.push(c); });
  }
  retired.forEach(function (c) { c.status = 'retired'; update_(SHEETS.CRED, c); });
  return retired.length;
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
    var retired = bindDevice_(emp, platform);
    var salt = pin ? bytesToB64u_(randomBytes_(16)) : '';
    var now = new Date().toISOString();
    append_(SHEETS.CRED, { credId: reg.credId, empId: emp.id, x: reg.x, y: reg.y, signCount: reg.signCount,
      label: String(req.label || '').slice(0, 80), status: 'active', createdAt: now, lastUsedAt: now, aaguid: reg.aaguid,
      kind: isDk ? 'devicekey' : 'passkey', platform: platform, pinHash: pin ? pinHash_(pin, salt) : '', pinSalt: salt, pinTries: 0, devId: REQ_DEV_ });
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

/** Sign in with the 6-digit PIN on a phone that has no key yet (a new phone, BASMA's new link): the PIN of the person's
 *  newest device is checked; 5 wrong tries lock PIN sign-in for 15 minutes (counted on that device record, unknown numbers
 *  lock too). The session is a device session: the app then gives this phone its own key with the same PIN, and every
 *  check-in still needs that key. */
function api_pinLogin(req) {
  var empNo = String(req.empNo || '').trim(), pin = String(req.pin || '');
  if (!rateLimit_('pinl:' + empNo, 12, 900)) fail_('too_many_attempts');
  if (!/^\d{6}$/.test(pin)) fail_('bad_pin_format');
  return withLock_(function () {
    var emp = empByNo_(empNo), cred = null;
    if (emp && emp.status === 'active') readAll_(SHEETS.CRED).forEach(function (c) { if (c.empId === emp.id && c.status === 'active' && c.pinHash && (!cred || String(c.createdAt) > String(cred.createdAt))) cred = c; });
    if (!cred) { // one answer for unknown number, no PIN yet and wrong PIN
      var ch = cache_(), k = 'pinghost:' + empNo, n = Number(ch.get(k) || 0) + 1; ch.put(k, String(n), PW_LOCK_MINUTES * 60);
      fail_(n >= PW_MAX_TRIES ? 'pin_locked' : 'bad_pin_login');
    }
    if (cred.pinLockUntil && new Date(cred.pinLockUntil).getTime() > Date.now()) fail_('pin_locked');
    if (!safeEqual_(pinHash_(pin, cred.pinSalt), cred.pinHash)) {
      cred.pinTries = Number(cred.pinTries || 0) + 1;
      var locked = cred.pinTries >= PW_MAX_TRIES;
      if (locked) { cred.pinLockUntil = new Date(Date.now() + PW_LOCK_MINUTES * 60000).toISOString(); cred.pinTries = 0; }
      update_(SHEETS.CRED, cred);
      audit_(emp.id, 'pin_login_failed', emp.id, { locked: locked });
      fail_(locked ? 'pin_locked' : 'bad_pin_login');
    }
    if (Number(cred.pinTries || 0) || cred.pinLockUntil) { cred.pinTries = 0; cred.pinLockUntil = ''; update_(SHEETS.CRED, cred); }
    audit_(emp.id, 'login_pin_any_device', emp.id, null);
    return { ok: true, token: issueToken_(emp), me: publicEmp_(emp), home: homePayload_(emp, false), pinLogin: true };
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
      var c = cache_(), k = 'pwghost:' + empNo, n = Number(c.get(k) || 0) + 1;
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
  // a PIN device key lives in this browser or app only; a passkey is already held by the phone's secure hardware
  if (cred.kind === 'devicekey' && cred.devId && REQ_DEV_ && cred.devId !== REQ_DEV_) fail_('device_mismatch');
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
  USE_TAB_CACHE_ = { employees: 1, zones: 1 }; // read-only here: employees and zones may come from the versioned copy
  return { ok: true, options: beginFor_(req, 'login').options };
}

function api_authFinish(req) {
  USE_TAB_CACHE_ = { employees: 1, zones: 1 }; // writes only credentials and audit, which stay fresh
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
  USE_TAB_CACHE_ = true;
  forget_(SHEETS.EMP); time('emp_copy_fill', function () { return readAll_(SHEETS.EMP).length; });
  forget_(SHEETS.EMP); time('emp_copy_hit', function () { return readAll_(SHEETS.EMP).length; });
  USE_TAB_CACHE_ = false; forget_(SHEETS.EMP);
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
  // How the Sheet hands back what we wrote: a date-looking text may come back as a Date.
  var raw = {};
  [[SHEETS.PUNCH, ['date', 'ts']], [SHEETS.EMP, ['createdAt', 'hireDate', 'tokenVer', 'status']]].forEach(function (x) {
    var sh = sheet_(x[0]), vals = sh.getDataRange().getValues(), hdr = HEADERS[x[0]];
    if (vals.length < 2) return;
    x[1].forEach(function (k) { var v = vals[vals.length - 1][hdr.indexOf(k)]; raw[x[0] + '.' + k] = (v instanceof Date ? 'Date:' + v.toISOString() : typeof v + ':' + String(v).slice(0, 24)); });
  });
  raw.tz = ss_().getSpreadsheetTimeZone();
  forget_(SHEETS.PUNCH); var lp = readAll_(SHEETS.PUNCH).slice(-1)[0];
  raw.appReads = lp ? lp.date : '';
  raw.today = localParts_(new Date()).date;
  return { ok: true, ms: out, rows: rows, raw: raw };
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

    // office kiosk QR (2026-10-20): a fresh, valid code from a kiosk in the employee's zone stands in for the GPS fix
    var geo = req.qr ? qrGeo_(emp, req.geo, verifyKioskQr_(emp, req.qr)) : remoteDay_(emp, workDate_(emp, now, s)) ? remoteGeo_(req.geo) : evaluateGeo_(emp, req.geo, s, type, r.cred.platform === 'desktop');
    var risk = riskScore_(emp, r.cred, req, geo, last, now);
    var lp = localParts_(now);
    var punch = {
      id: newId_('P'), empId: emp.id, type: type, ts: now.toISOString(), date: workDate_(emp, now, s), // overnight shifts file under the day the shift began
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
    var t = Number(s.t) || 0;
    if (out.some(function (o) { return o.lat === lat && o.lng === lng && o.acc === acc && o.t === t; })) continue; // the same reading sent twice is one sample (not 'static')
    out.push({ lat: lat, lng: lng, acc: acc, t: t });
  }
  return out;
}

/**
 * Geofence (2026-10-26). Every recent sample is judged, not only the most accurate one: GPS indoors jumps, and the best-accuracy
 * reading can land outside while the others are inside. A sample counts when its accuracy is within the limit and it is inside
 * a zone; the most accurate such sample is the fix. A good reading just past the fence (its accuracy circle reaches into the
 * zone by up to 50 m, never more than half the radius) also counts, flagged 'edge_outside', which sends it to HR review. Otherwise the old rules:
 * a coarse fix centred inside goes to review (weak_fix), everything else is refused.
 */
function geoNearest_(x, zones) {
  var best = null, bestD = Infinity;
  zones.forEach(function (z) { var d = haversine_(x.lat, x.lng, Number(z.lat), Number(z.lng)) - Number(z.radius); if (d < bestD) { bestD = d; best = z; } });
  return { zone: best, distance: haversine_(x.lat, x.lng, Number(best.lat), Number(best.lng)), radius: Number(best.radius) };
}
function evaluateGeo_(emp, geo, s, type, desktop) {
  var samples = cleanSamples_(geo), flags = [];
  if (!samples.length) return { reject: 'no_location', flags: flags, samples: samples };
  var fix = samples.reduce(function (b, x) { return x.acc < b.acc ? x : b; }, samples[0]);
  var zones = zonesFor_(emp);
  if (!zones.length) return { reject: 'no_zone', fix: fix, flags: flags, samples: samples };
  var maxAcc = desktop ? Number(s.maxAccuracyDesktop) : Number(s.maxAccuracy);
  var judged = samples.map(function (x) { var n = geoNearest_(x, zones); n.fix = x; return n; });
  var good = judged.filter(function (j) { return j.fix.acc <= maxAcc; }).sort(function (a, b) { return a.fix.acc - b.fix.acc; });
  var hit = good.filter(function (j) { return j.distance <= j.radius; })[0];
  var near = hit ? null : good.filter(function (j) { return j.distance - Math.min(j.fix.acc, 50, j.radius / 2) <= j.radius; })[0];
  var pick = hit || near || judged.filter(function (j) { return j.fix === fix; })[0];
  var res = { fix: pick.fix, zone: pick.zone, distance: pick.distance, radius: pick.radius, flags: flags, samples: samples };
  if (hit) { if (hit.distance + hit.fix.acc > hit.radius) flags.push('edge'); return res; }
  if (near) { flags.push('edge_outside'); return res; } // counted, but HR reviews it: the centre is past the fence
  var outsideOk = type === 'out' && s.allowCheckoutOutside;
  if (pick.fix.acc > maxAcc && !outsideOk) {
    // a coarse fix (indoors GPS, a laptop on Wi-Fi) centred inside the zone counts and goes to HR review; phones up to 300 m, laptops 1000 m
    if (pick.fix.acc <= (desktop ? 1000 : 300) && pick.distance <= pick.radius) flags.push('weak_fix');
    else { res.reject = 'accuracy_too_low'; return res; }
  }
  if (pick.distance > pick.radius) {
    if (outsideOk) { flags.push('outside_checkout'); return res; }
    res.reject = 'outside_zone';
    return res;
  }
  if (pick.distance + pick.fix.acc > pick.radius) flags.push('edge');
  return res;
}

/** Location for a kiosk-QR punch: the kiosk's zone; a usable phone fix clearly away from it refuses (a forwarded code). */
function qrGeo_(emp, geo, q) {
  var samples = cleanSamples_(geo), flags = ['qr_kiosk'], z = q.zone;
  var fix = samples.length ? samples.reduce(function (b, x) { return x.acc < b.acc ? x : b; }, samples[0]) : null;
  var res = { fix: fix, zone: z, distance: 0, radius: Number(z.radius), flags: flags, samples: samples };
  if (!fix) { flags.push('qr_no_gps'); return res; }
  res.distance = haversine_(fix.lat, fix.lng, Number(z.lat), Number(z.lng));
  if (fix.acc <= 200 && res.distance > Number(z.radius) + Math.max(500, fix.acc * 2)) res.reject = 'qr_far';
  return res;
}

// ---------------- risk ----------------

var RISK_WEIGHTS = {
  static_samples: 35, static_precise: 10, edge_outside: 40, zero_accuracy: 30, stale_fix: 20, clock_drift: 25, impossible_travel: 40,
  qr_kiosk: 0, qr_no_gps: 25, remote: 0,
  new_device: 10, few_samples: 10, off_hours: 10, edge: 10, weak_fix: 30, outside_checkout: 30, no_biometric: 10, laptop: 5, password_login: 20,
  device_rooted: 25, device_emulator: 40, device_hooked: 60, app_tampered: 60, mock_location: 60
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
    if (frozen && f.acc < 20) flags.push('static_precise'); // real GPS jitters even standing still; a fake-location app repeats one precise point (Wi-Fi fixes, 20 m and more, may repeat exactly)
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
  integrityFlags_(req.integ, deviceTime, flags);
  var all = flags.concat(geo.flags || []);
  var score = all.reduce(function (t, k) { return t + (RISK_WEIGHTS[k] || 0); }, 0);
  return { score: Math.min(score, 100), flags: flags };
}

/** Signals the Android app (1.2.0+) reports about the phone. A browser sends none, and a page can always omit them, so they only
 *  add to the risk score; Android marks fake-location readings itself (Location.isMock), which a web page cannot see. */
function integrityFlags_(g, deviceTime, flags) {
  if (!g || typeof g !== 'object') return;
  if (g.rooted === true) flags.push('device_rooted');
  if (g.emulator === true) flags.push('device_emulator');
  if (g.hooked === true) flags.push('device_hooked');
  if (g.signature === false) flags.push('app_tampered');
  var mockAt = Number(g.mockAt) || 0, ref = deviceTime || Number(g.at) || 0;
  if (mockAt > 0 && ref && Math.abs(ref - mockAt) < 10 * 60000) flags.push('mock_location');
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
  var emp = findBy_(SHEETS.EMP, 'id', empId);
  return last.date === (emp ? workDate_(emp, new Date(), settings_()) : localParts_(new Date()).date) ? 'out' : 'in';
}

/** An overnight shift (end at or before start, e.g. 22:00-06:00) belongs to the day it began. */
function shiftOvernight_(sh) { return hmToMin_(sh.end) <= hmToMin_(sh.start); }
/** The work date a moment belongs to: until 6 hours after an overnight shift ends, it is still the previous day's shift. */
function workDate_(emp, now, s) {
  var lp = localParts_(now), prev = addDays_(lp.date, -1), sh = adjustShift_(emp, shiftOf_(emp, s), s, prev);
  return shiftOvernight_(sh) && sh.workdays.indexOf(new Date(prev + 'T00:00:00Z').getUTCDay()) >= 0 && lp.minutes < hmToMin_(sh.end) + 360 ? prev : lp.date;
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
/** off: from offIndex_ (Leave.gs), or null where the caller does not read leave (the home screen, to keep sign-in fast). */
function summarizeDay_(emp, date, punches, s, now, off) {
  var sh = adjustShift_(emp, shiftOf_(emp, s), s, date); // roster and Ramadan hours (Shifts.gs)
  var lpNow = localParts_(now);
  var dow = new Date(date + 'T00:00:00Z').getUTCDay();
  var workday = sh.workdays.indexOf(dow) >= 0;
  if (off && off.holiday) workday = false; // work on a public holiday is overtime (Art. 107)
  var startM = hmToMin_(sh.start), endM = hmToMin_(sh.end), overnight = endM <= startM;
  if (overnight) endM += 1440;
  // minutes from the start of `date` (a punch after midnight on an overnight shift counts as 24:00 + its time)
  var rel = function (d) { var l = localParts_(d); return l.minutes + (l.date > date ? 1440 : 0); };
  var out = { date: date, overnight: overnight, workday: workday, shiftStart: sh.start, shiftEnd: sh.end, firstIn: null, lastOut: null,
    workedMin: 0, lateMin: 0, earlyMin: 0, overtimeMin: 0, status: '', punches: punches.length, review: 0 };
  punches.forEach(function (p) { if (p.status === 'review') out.review++; });
  var openIn = null;
  punches.forEach(function (p) {
    var t = new Date(p.ts).getTime();
    if (p.type === 'in') { if (!openIn) openIn = t; if (!out.firstIn) out.firstIn = p.ts; }
    else if (openIn) { out.workedMin += Math.round((t - openIn) / 60000); openIn = null; out.lastOut = p.ts; }
  });
  var isToday = date === lpNow.date || (overnight && date === addDays_(lpNow.date, -1) && lpNow.minutes < endM - 1440 + 360);
  if (openIn) {
    if (isToday) { out.workedMin += Math.round((now.getTime() - openIn) / 60000); out.status = 'in'; }
    else out.status = 'missing_out';
  }
  if (out.firstIn) {
    var inM = rel(new Date(out.firstIn));
    if (workday && inM > startM + sh.grace) out.lateMin = inM - startM;
    if (!out.status) out.status = 'present';
    if (workday && out.lastOut && !openIn) {
      var outM = rel(new Date(out.lastOut));
      if (outM < endM) out.earlyMin = endM - outM;
    }
    var planned = Math.max(endM - startM, 0);
    if (!workday) out.overtimeMin = out.workedMin;
    else if (out.workedMin > planned) out.overtimeMin = out.workedMin - planned;
  } else if (!workday) out.status = 'off';
  else if (date > lpNow.date || (isToday && rel(now) <= startM + sh.grace)) out.status = 'upcoming';
  else out.status = 'absent';
  if (off && off.remote && !off.leave && !off.holiday) { out.remote = true; if (!out.firstIn && workday && out.status === 'absent') out.status = 'remote'; return out; } // an approved remote day is never absent
  if (off) {
    if (off.holiday) out.holiday = off.holiday;
    if (off.leave) out.leaveType = off.leave;
    if (!out.firstIn) out.status = off.leave ? 'leave' : 'holiday'; // never 'absent' on an approved leave day or a public holiday
  }
  return out;
}

/** Is this an approved remote-work day for the person? (one read of their requests) */
function remoteDay_(emp, date) {
  return readQuick_(SHEETS.REQ).some(function (r) { return r.empId === emp.id && r.type === 'remote' && r.status === 'approved' && String(r.fromDate).slice(0, 10) <= date && String(r.toDate).slice(0, 10) >= date; });
}
/** Location for a punch on an approved remote day: recorded as given, never a zone check, flagged. */
function remoteGeo_(geo) {
  var samples = cleanSamples_(geo), fix = samples.length ? samples.reduce(function (b, x) { return x.acc < b.acc ? x : b; }, samples[0]) : null;
  return { fix: fix, zone: null, distance: null, radius: null, flags: ['remote'], samples: samples };
}
function todayFor_(emp, s) {
  var now = new Date(), date = workDate_(emp, now, s);
  var ps = punchesOf_(emp.id).filter(function (p) { return p.date === date; });
  var sum = summarizeDay_(emp, date, ps, s, now);
  sum.list = ps.map(publicPunch_);
  sum.next = nextPunchType_(emp.id);
  sum.remoteDay = remoteDay_(emp, date);
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
    company: companyOf_(s), ai: typeof aiOn_ === 'function' ? aiOn_() : false, serverTime: new Date().toISOString() };
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
  var off = offIndex_(month + '-01', today);
  while (d.slice(0, 7) === month && d <= today) {
    var sum = summarizeDay_(me, d, byDate[d] || [], s, now, off(me.id, d));
    sum.list = (byDate[d] || []).map(publicPunch_);
    days.push(sum);
    d = addDays_(d, 1);
  }
  days.reverse();
  var tot = days.reduce(function (t, x) {
    t.workedMin += x.workedMin; t.lateMin += x.lateMin; t.overtimeMin += x.overtimeMin;
    if (x.status === 'absent') t.absent++;
    if (x.status === 'leave') t.leave++;
    if (x.firstIn) t.present++;
    if (x.lateMin) t.lateDays++;
    return t;
  }, { workedMin: 0, lateMin: 0, overtimeMin: 0, absent: 0, present: 0, lateDays: 0, leave: 0 });
  return { ok: true, month: month, days: days, totals: tot };
}

/**
 * First local date an employee counts for: the later of the day they were added and their hire date. Nobody is
 * absent before either (HR often adds a new hire days before the first working day).
 */
function joinedDate_(emp) {
  var added = emp.createdAt ? localParts_(new Date(emp.createdAt)).date : '0000-00-00';
  var hired = /^\d{4}-\d{2}-\d{2}/.test(String(emp.hireDate || '')) ? String(emp.hireDate).slice(0, 10) : '';
  return hired > added ? hired : added;
}

function publicDevice_(c) {
  return { credId: c.credId, label: c.label, since: c.createdAt, lastUsedAt: c.lastUsedAt, kind: c.kind || 'passkey', platform: c.platform || 'mobile', status: c.status };
}

function publicZone_(z) {
  return { id: z.id, name: z.name, nameEn: z.nameEn, lat: Number(z.lat), lng: Number(z.lng), radius: Number(z.radius), status: z.status };
}


// ======================================================================= timesheets (Wave 3, 2026-10-18)
// A month of attendance per person (from summarizeDay_, the same figures as reports and payroll) approved by the manager or HR.
// With the setting timesheetRequired, payrollApprove refuses a month while a paid person's timesheet is not approved.
function tsMonthTotals_(e, month, by, off, s, now) {
  var from = month + '-01', to = monthLast_(month), today = localParts_(now).date, joined = joinedDate_(e);
  if (to > today) to = today;
  var t = { workedMin: 0, lateMin: 0, earlyMin: 0, overtimeMin: 0, present: 0, absent: 0, leave: 0, missingOut: 0, review: 0 };
  for (var d = from; d <= to; d = addDays_(d, 1)) {
    if (d < joined) continue;
    var ps = (by[e.id + '|' + d] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; }), sum = summarizeDay_(e, d, ps, s, now, off(e.id, d));
    t.workedMin += sum.workedMin; t.lateMin += sum.lateMin; t.earlyMin += sum.earlyMin; t.overtimeMin += sum.overtimeMin; t.review += sum.review || 0;
    if (sum.firstIn) t.present++; if (sum.status === 'absent') t.absent++; if (sum.status === 'leave') t.leave++; if (sum.status === 'missing_out') t.missingOut++;
  }
  return t;
}
function tsCanApprove_(me, e, ctx) { return !!e && e.id !== me.id && (isHr_(me) || manages_(me, e, ctx)); }
function api_timesheetList(req, me) {
  var ctx = orgCtx_(), month = /^\d{4}-\d{2}$/.test(String(req.month || '')) ? String(req.month) : govAddMonths_(today_().slice(0, 7) + '-01', -1).slice(0, 7);
  if (!isHr_(me) && !managesAnyone_(me, ctx)) fail_('forbidden');
  var s = settings_(), now = new Date(), from = month + '-01', to = monthLast_(month), by = {}, off = offIndex_(from, to);
  readAll_(SHEETS.PUNCH).forEach(function (p) { if (!isCounted_(p) || p.date < from || p.date > to) return; (by[p.empId + '|' + p.date] = by[p.empId + '|' + p.date] || []).push(p); });
  var done = {}; readAll_(SHEETS.TSH).forEach(function (x) { if (x.month === month && x.status === 'approved') done[x.empId] = x; });
  var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && (isHr_(me) || manages_(me, e, ctx)) && e.id !== me.id; })
    .map(function (e) { var a = done[e.id]; return { emp: empCard_(e), totals: tsMonthTotals_(e, month, by, off, s, now), approved: !!a, approvedBy: a && ctx.emps[a.approvedBy] ? ctx.emps[a.approvedBy].name : '', approvedAt: a ? a.approvedAt : '' }; });
  return { ok: true, month: month, rows: rows, required: s.timesheetRequired === true || String(s.timesheetRequired) === 'true' };
}
function api_timesheetApprove(req, me) {
  if (!isHr_(me) && !managesAnyone_(me, orgCtx_())) fail_('forbidden'); // the role gate before any validation
  var month = String(req.month || ''), ids = (Array.isArray(req.empIds) ? req.empIds : []).map(String);
  if (!/^\d{4}-\d{2}$/.test(month) || !ids.length || ids.length > 500) fail_('bad_request');
  if (month > today_().slice(0, 7)) fail_('future_month');
  return withLock_(function () {
    var ctx = orgCtx_(), s = settings_(), now = new Date(), iso = now.toISOString(), from = month + '-01', to = monthLast_(month), by = {}, off = offIndex_(from, to), out = 0;
    ids.forEach(function (id) { if (!tsCanApprove_(me, ctx.emps[id], ctx)) fail_(id === me.id ? 'cannot_decide_own' : 'forbidden'); });
    readAll_(SHEETS.PUNCH).forEach(function (p) { if (!isCounted_(p) || p.date < from || p.date > to) return; (by[p.empId + '|' + p.date] = by[p.empId + '|' + p.date] || []).push(p); });
    var have = {}; readAll_(SHEETS.TSH).forEach(function (x) { if (x.month === month && x.status === 'approved') have[x.empId] = 1; });
    ids.forEach(function (id) {
      if (have[id]) return;
      append_(SHEETS.TSH, { id: newId_('T'), empId: id, month: month, status: 'approved', totalsJson: JSON.stringify(tsMonthTotals_(ctx.emps[id], month, by, off, s, now)), approvedBy: me.id, approvedAt: iso, note: str_(req.note, 200) });
      out++;
    });
    audit_(me.id, 'timesheet_approve', '', { month: month, count: out });
    return { ok: true, approved: out };
  });
}
/** Payroll.gs api_payrollApprove: with timesheetRequired, every paid person needs an approved timesheet for the month. */
function tsMissing_(month, empIds) {
  var s = settings_();
  if (!(s.timesheetRequired === true || String(s.timesheetRequired) === 'true')) return 0;
  var have = {}; readAll_(SHEETS.TSH).forEach(function (x) { if (x.month === month && x.status === 'approved') have[x.empId] = 1; });
  return empIds.filter(function (id) { return !have[id]; }).length;
}
hrisHook_('tasks', function (me, ctx, add) {
  var s = settings_();
  if (!(s.timesheetRequired === true || String(s.timesheetRequired) === 'true')) return;
  var prev = govAddMonths_(today_().slice(0, 7) + '-01', -1).slice(0, 7), have = {};
  readAll_(SHEETS.TSH).forEach(function (x) { if (x.month === prev && x.status === 'approved') have[x.empId] = 1; });
  add('timesheet', Object.keys(ctx.emps).filter(function (k) { var e = ctx.emps[k]; return e.status === 'active' && !have[k] && e.id !== me.id && !isHr_(me) && manages_(me, e, ctx); }).length, { tab: 'hr', sec: 'timesheets' });
});

/**
 * PIN as the default sign-in (2026-10-19, owner's request). A person signed in with a password, or on an older Face ID
 * (passkey) device, can switch this device to the 6-digit PIN without a new HR activation code: a fresh device key is
 * bound to their account under a one-time challenge, with the PIN. A password session must type the password again.
 * Like a new enrolment, it retires the earlier credential of the same platform (phone or laptop) and ends its sessions.
 */
function api_pinEnrollBegin(req, me) {
  return { ok: true, challenge: newChallenge_({ purpose: 'reg_self', empId: me.id }) };
}
function api_pinEnrollFinish(req, me) {
  var platform = req.platform === 'desktop' ? 'desktop' : 'mobile', st = settings_();
  if (platform === 'desktop' && !st.allowDesktop) fail_('desktop_disabled');
  if (platform === 'mobile' && !st.allowDeviceKey) fail_('device_key_disabled');
  var pin = String(req.pin || '');
  if (!/^\d{6}$/.test(pin)) fail_('bad_pin_format');
  if (weakPin_(pin)) fail_('weak_pin');
  var reg = verifyDeviceKeyRegistration_(req.deviceKey);
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', me.id);
    if (!emp || emp.status !== 'active') fail_('forbidden');
    if (me._auth === 'pw' && !(emp.pwHash && safeEqual_(pwHash_(String(req.password || ''), emp.pwSalt), emp.pwHash))) fail_('bad_current_password');
    var ch = takeChallenge_(reg.challenge);
    if (!ch || ch.purpose !== 'reg_self' || ch.empId !== emp.id) fail_('challenge_expired');
    if (findBy_(SHEETS.CRED, 'credId', reg.credId)) fail_('bad_credential');
    var now = new Date().toISOString(), salt = bytesToB64u_(randomBytes_(16)), retired = bindDevice_(emp, platform);
    append_(SHEETS.CRED, { credId: reg.credId, empId: emp.id, x: reg.x, y: reg.y, signCount: reg.signCount, label: String(req.label || '').slice(0, 80), status: 'active',
      createdAt: now, lastUsedAt: now, aaguid: reg.aaguid, kind: 'devicekey', platform: platform, pinHash: pinHash_(pin, salt), pinSalt: salt, pinTries: 0, devId: REQ_DEV_ });
    if (retired) emp.tokenVer = Number(emp.tokenVer || 0) + 1;
    emp.updatedAt = now; update_(SHEETS.EMP, emp);
    audit_(emp.id, 'pin_device_set', emp.id, { credId: reg.credId.slice(0, 12), platform: platform, replaced: retired, from: me._auth || 'dev' });
    return { ok: true, token: issueToken_(emp), credId: reg.credId, platform: platform };
  });
}

// ---------------- office kiosk QR check-in (2026-10-20) ----------------
/**
 * A tablet at the office entrance shows a QR that changes every 20 seconds (docs/research/2026-10-20-kiosk-qr-design.md).
 * Scanning it in the app proves the phone is at that office even when indoor GPS is weak. Layered, as the research
 * recommends (a rotating code alone can be photographed and forwarded):
 *  1. identity: the punch still needs the employee's own bound device and its PIN / Face ID (punchFinish as always);
 *  2. freshness: the code is valid for its 20-second window and the one before it (up to 40 s);
 *  3. place: the kiosk belongs to a zone the employee is assigned to;
 *  4. sanity: when the phone does report a usable location (accuracy <= 200 m) clearly away from that zone, the punch is
 *     refused (qr_far): a forwarded screenshot scanned from home fails. No location at all counts, flagged for review.
 * Each kiosk's secret is derived from the server's signing secret (kioskSecret_), so the sheet never holds it; a new setup
 * code (version + 1) retires the old tablet at once.
 */
var QR_WINDOW_MS_ = 20000;
function kioskSecret_(k) { return hmac_('kiosk|' + k.id + '|' + (Number(k.ver) || 1)); }
function kioskCode_(secret, kid, w) {
  var sig = Utilities.computeHmacSha256Signature(kid + '|' + w, secret);
  return bytesToB64u_(sig.map(function (b) { return b & 255; })).slice(0, 10);
}
function publicKiosk_(k, zones) { return { id: k.id, code: k.code, label: k.label, zoneId: k.zoneId, zone: zones[k.zoneId] ? zones[k.zoneId].name : '', status: k.status, ver: Number(k.ver) || 1, lastSeenAt: k.lastSeenAt || '' }; }
function api_kioskList(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var zones = {}; readAll_(SHEETS.ZONES).forEach(function (z) { zones[z.id] = z; });
  return { ok: true, rows: readAll_(SHEETS.KIOSK).filter(function (k) { return k.status !== 'deleted'; }).map(function (k) { return publicKiosk_(k, zones); }),
    zones: Object.keys(zones).filter(function (k) { return zones[k].status === 'active'; }).map(function (k) { return { id: k, name: zones[k].name }; }) };
}
/** Administrator: create a kiosk or issue a new setup code (the old tablet stops at once); disable. */
function api_kioskSave(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  return withLock_(function () {
    var now = new Date().toISOString(), k = req.id ? findBy_(SHEETS.KIOSK, 'id', req.id) : null;
    if (req.id && !k) fail_('not_found');
    if (!k) {
      var z = findBy_(SHEETS.ZONES, 'id', req.zoneId);
      if (!z || z.status !== 'active') fail_('no_zone');
      if (!str_(req.label, 60)) fail_('missing_fields');
      k = { id: newId_('Q'), code: nextRef_('kiosk', refsOf_(SHEETS.KIOSK)), label: str_(req.label, 60), zoneId: z.id, ver: 1, status: 'active', createdBy: me.id, createdAt: now, lastSeenAt: '' };
      append_(SHEETS.KIOSK, k);
    } else if (req.disable) { k.status = 'disabled'; update_(SHEETS.KIOSK, k); audit_(me.id, 'kiosk_disable', '', { code: k.code }); return { ok: true }; }
    else { k.ver = (Number(k.ver) || 1) + 1; k.status = 'active'; update_(SHEETS.KIOSK, k); }
    audit_(me.id, 'kiosk_setup', '', { code: k.code, ver: k.ver });
    var z2 = findBy_(SHEETS.ZONES, 'id', k.zoneId) || {};
    return { ok: true, kiosk: publicKiosk_(k, { [k.zoneId]: z2 }), setup: k.id + '.' + k.ver + '.' + kioskSecret_(k) };
  });
}
/** The tablet checks in once a minute (public): says whether its setup is still valid, for its label and zone name. */
function api_kioskPing(req) {
  var p = String(req.setup || '').split('.'), k = findBy_(SHEETS.KIOSK, 'id', p[0]);
  if (!k || k.status !== 'active' || String(k.ver) !== String(p[1]) || p.slice(2).join('.') !== kioskSecret_(k)) return { ok: false, error: 'kiosk_revoked' };
  var c = cache_(); if (!c.get('kioskseen:' + k.id)) { c.put('kioskseen:' + k.id, '1', 600); try { withLock_(function () { var r = findBy_(SHEETS.KIOSK, 'id', k.id); r.lastSeenAt = new Date().toISOString(); update_(SHEETS.KIOSK, r); }); } catch (e) {} }
  var z = findBy_(SHEETS.ZONES, 'id', k.zoneId) || {};
  return { ok: true, label: k.label, zone: z.name || '', company: companyOf_(settings_()), serverTime: Date.now(), windowMs: QR_WINDOW_MS_ };
}
/** Checks a scanned kiosk QR ({k, w, c}) for this employee; returns the kiosk's zone or fails. */
function verifyKioskQr_(emp, qr) {
  var k = findBy_(SHEETS.KIOSK, 'id', qr && qr.k);
  if (!k || k.status !== 'active') fail_('qr_invalid');
  var now = Math.floor(Date.now() / QR_WINDOW_MS_), w = Math.floor(Number(qr.w));
  if (!(w === now || w === now - 1)) fail_('qr_expired');
  if (String(qr.c || '') !== kioskCode_(kioskSecret_(k), k.id, w)) fail_('qr_invalid');
  var zone = zonesFor_(emp).filter(function (z) { return z.id === k.zoneId; })[0];
  if (!zone) fail_('qr_wrong_zone');
  return { kiosk: k, zone: zone };
}


// ======================================================================= live office map (2026-10-23)
// Everyone sees where colleagues are today: in an office (by the zone of the open check-in), remote, on a work trip, gone for
// the day or away. "Away" deliberately covers leave, absence, days off and not-yet-in, so colleagues never learn why.
// Full day status (late minutes, absent, leave type) only for HR, admin and executive, and for a manager about their own people.
var PRESENCE_NOTE_MAX_ = 60;
function api_officeMap(req, me) {
  var s = settings_(), now = new Date(), date = localParts_(now).date, nowIso = now.toISOString();
  var emps = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active' && joinedDate_(e) <= date; });
  var zones = {}, zoneList = [];
  readAll_(SHEETS.ZONES).forEach(function (z) { zones[z.id] = z.name; zoneList.push({ id: z.id, name: z.name }); });
  var today = {};
  readAll_(SHEETS.PUNCH).forEach(function (p) { if (p.date === date && isCounted_(p)) (today[p.empId] = today[p.empId] || []).push(p); });
  var trips = {};
  readAll_(SHEETS.REQ).forEach(function (r) { if (r.type === 'travel' && r.status === 'approved' && String(r.fromDate).slice(0, 10) <= date && String(r.toDate).slice(0, 10) >= date) trips[r.empId] = 1; });
  var notes = {};
  readAll_(SHEETS.PNOTE).forEach(function (n) { if (n.text && (!n.until || String(n.until) > nowIso)) notes[n.empId] = { text: n.text, until: n.until || '' }; });
  var off = offIndex_(date, date), all = isHr_(me) || hasRole_(me, 'executive'), ctx = all ? null : orgCtx_();
  var counts = { office: 0, remote: 0, trip: 0, done: 0, away: 0 }, perZone = {};
  var people = emps.map(function (e) {
    var ps = (today[e.id] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
    var day = summarizeDay_(e, date, ps, s, now, off(e.id, date)), last = ps[ps.length - 1], pr, zone = '';
    if (day.status === 'in') { zone = last && last.zoneId ? last.zoneId : ''; pr = zone ? 'office' : 'remote'; }
    else if (trips[e.id]) pr = 'trip';
    else if (day.remote && (day.status === 'remote' || day.status === 'upcoming')) pr = 'remote';
    else if (day.status === 'present') pr = 'done';
    else pr = 'away';
    counts[pr]++; if (zone) perZone[zone] = (perZone[zone] || 0) + 1;
    var o = { id: e.id, name: e.name, nameEn: e.nameEn || '', department: e.department || '', title: e.title || '', presence: pr, zone: zone,
      since: pr === 'office' || pr === 'remote' ? day.firstIn : null, me: e.id === me.id };
    if (notes[e.id]) o.note = notes[e.id];
    if (all || e.id === me.id || manages_(me, e, ctx)) o.day = { status: day.status, lateMin: day.lateMin || 0, leaveType: day.leaveType || '', workedMin: day.workedMin || 0 };
    return o;
  });
  zoneList.forEach(function (z) { z.count = perZone[z.id] || 0; });
  return { ok: true, date: date, serverTime: nowIso, zones: zoneList, counts: counts, people: people, full: all };
}
/** Your own short status for the map ("in a meeting until 2"), like Roam's "will return". Empty text clears it. */
function api_presenceSet(req, me) {
  var text = str_(req.text, PRESENCE_NOTE_MAX_), until = '';
  if (req.until) { var u = new Date(req.until); if (isNaN(u.getTime())) fail_('bad_date'); if (u.getTime() < Date.now() || u.getTime() > Date.now() + 7 * 864e5) fail_('bad_date'); until = u.toISOString(); }
  return withLock_(function () {
    var cur = findBy_(SHEETS.PNOTE, 'empId', me.id);
    if (cur) { cur.text = text; cur.until = text ? until : ''; cur.updatedAt = new Date().toISOString(); update_(SHEETS.PNOTE, cur); }
    else if (text) append_(SHEETS.PNOTE, { id: newId_('PN'), empId: me.id, text: text, until: until, updatedAt: new Date().toISOString() });
    return { ok: true, note: text ? { text: text, until: until } : null };
  });
}
