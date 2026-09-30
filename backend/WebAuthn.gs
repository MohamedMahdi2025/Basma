/**
 * Passkey (WebAuthn) verification for Face ID / fingerprint.
 * Apps Script has no ECDSA verifier, so P-256 is implemented here with
 * BigInt (Jacobian coordinates, Shamir's trick). tests/run.js checks it
 * against Node's crypto on keys and signatures it generates itself.
 */

// ---------------- bytes ----------------

function u8_(arr) { var o = new Array(arr.length); for (var i = 0; i < arr.length; i++) o[i] = arr[i] & 255; return o; }
function s8_(arr) { var o = new Array(arr.length); for (var i = 0; i < arr.length; i++) o[i] = arr[i] > 127 ? arr[i] - 256 : arr[i]; return o; }

function b64uToBytes_(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return u8_(Utilities.base64Decode(s));
}
function bytesToB64u_(b) { return Utilities.base64EncodeWebSafe(s8_(b)).replace(/=+$/, ''); }
function sha256_(bytes) { return u8_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s8_(bytes))); }
function utf8Bytes_(str) { return u8_(Utilities.newBlob(String(str)).getBytes()); }
function bytesToUtf8_(b) { return Utilities.newBlob(s8_(b)).getDataAsString('UTF-8'); }
function bytesEq_(a, b) { if (a.length !== b.length) return false; var r = 0; for (var i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0; }
function bytesToBig_(b) { var h = '0x0'; for (var i = 0; i < b.length; i++) h += ('0' + b[i].toString(16)).slice(-2); return BigInt(h); }

// ---------------- minimal CBOR (attestationObject, COSE key) ----------------

function cborDecode_(b) { return cborItem_(b, 0).v; }

function cborItem_(b, o) {
  var ib = b[o++], mt = ib >> 5, ai = ib & 31, len;
  if (ai < 24) len = ai;
  else if (ai === 24) len = b[o++];
  else if (ai === 25) { len = b[o] * 256 + b[o + 1]; o += 2; }
  else if (ai === 26) { len = ((b[o] * 256 + b[o + 1]) * 256 + b[o + 2]) * 256 + b[o + 3]; o += 4; }
  else throw new Error('E:cbor_unsupported');
  var i, r, v;
  switch (mt) {
    case 0: return { v: len, o: o };
    case 1: return { v: -1 - len, o: o };
    case 2: return { v: b.slice(o, o + len), o: o + len };
    case 3: return { v: bytesToUtf8_(b.slice(o, o + len)), o: o + len };
    case 4: v = []; for (i = 0; i < len; i++) { r = cborItem_(b, o); v.push(r.v); o = r.o; } return { v: v, o: o };
    case 5: v = {}; for (i = 0; i < len; i++) { var k = cborItem_(b, o); r = cborItem_(b, k.o); v[k.v] = r.v; o = r.o; } return { v: v, o: o };
    case 7: return { v: ai === 20 ? false : ai === 21 ? true : null, o: o };
    default: throw new Error('E:cbor_unsupported');
  }
}

// ---------------- P-256 ----------------

var P256_ = null;
function p256_() {
  if (P256_) return P256_;
  var B = BigInt;
  P256_ = {
    p: B('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
    n: B('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
    b: B('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
    gx: B('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),
    gy: B('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'),
    Z: B(0), I: B(1), T2: B(2), T3: B(3), T4: B(4), T8: B(8)
  };
  return P256_;
}

function mod_(a, m) { var r = a % m; return r < P256_.Z ? r + m : r; }
function modPow_(b, e, m) {
  var C = p256_(), r = C.I; b = mod_(b, m);
  while (e > C.Z) { if (e & C.I) r = r * b % m; b = b * b % m; e >>= C.I; }
  return r;
}
function modInv_(a, m) { return modPow_(a, m - p256_().T2, m); }

function jDouble_(P) {
  var C = P256_, p = C.p;
  if (P[2] === C.Z || P[1] === C.Z) return [C.I, C.I, C.Z];
  var delta = P[2] * P[2] % p, gamma = P[1] * P[1] % p, beta = P[0] * gamma % p;
  var alpha = C.T3 * mod_(P[0] - delta, p) % p * ((P[0] + delta) % p) % p;
  var X3 = mod_(alpha * alpha - C.T8 * beta, p);
  var Z3 = mod_((P[1] + P[2]) * (P[1] + P[2]) - gamma - delta, p);
  var Y3 = mod_(alpha * mod_(C.T4 * beta - X3, p) - C.T8 * gamma % p * gamma, p);
  return [X3, Y3, Z3];
}

function jAdd_(P, Q) {
  var C = P256_, p = C.p;
  if (P[2] === C.Z) return Q;
  if (Q[2] === C.Z) return P;
  var Z1Z1 = P[2] * P[2] % p, Z2Z2 = Q[2] * Q[2] % p;
  var U1 = P[0] * Z2Z2 % p, U2 = Q[0] * Z1Z1 % p;
  var S1 = P[1] * Q[2] % p * Z2Z2 % p, S2 = Q[1] * P[2] % p * Z1Z1 % p;
  if (U1 === U2) return S1 === S2 ? jDouble_(P) : [C.I, C.I, C.Z];
  var H = mod_(U2 - U1, p), R = mod_(S2 - S1, p);
  var H2 = H * H % p, H3 = H * H2 % p, U1H2 = U1 * H2 % p;
  var X3 = mod_(R * R - H3 - C.T2 * U1H2, p);
  var Y3 = mod_(R * mod_(U1H2 - X3, p) - S1 * H3, p);
  var Z3 = H * P[2] % p * Q[2] % p;
  return [X3, Y3, Z3];
}

function onCurve_(x, y) {
  var C = p256_(), p = C.p;
  if (x < C.Z || x >= p || y < C.Z || y >= p) return false;
  return mod_(y * y - (x * x % p * x - C.T3 * x + C.b), p) === C.Z;
}

/** ECDSA P-256 verify. hash, x, y: byte arrays; sigDer: DER byte array. */
function ecdsaVerifyP256_(hash, sigDer, x, y) {
  var C = p256_();
  var rs = parseDerSig_(sigDer);
  if (!rs) return false;
  var r = rs[0], s = rs[1];
  if (r <= C.Z || r >= C.n || s <= C.Z || s >= C.n) return false;
  var Qx = bytesToBig_(x), Qy = bytesToBig_(y);
  if (!onCurve_(Qx, Qy)) return false;
  var e = bytesToBig_(hash);
  var w = modInv_(s, C.n);
  var u1 = e * w % C.n, u2 = r * w % C.n;
  var G = [C.gx, C.gy, C.I], Q = [Qx, Qy, C.I], GQ = jAdd_(G, Q);
  var R = [C.I, C.I, C.Z];
  for (var i = 255; i >= 0; i--) {
    R = jDouble_(R);
    var bi = BigInt(i);
    var b1 = (u1 >> bi) & C.I, b2 = (u2 >> bi) & C.I;
    if (b1 === C.I && b2 === C.I) R = jAdd_(R, GQ);
    else if (b1 === C.I) R = jAdd_(R, G);
    else if (b2 === C.I) R = jAdd_(R, Q);
  }
  if (R[2] === C.Z) return false;
  var zi = modInv_(R[2], C.p);
  var ax = R[0] * zi % C.p * zi % C.p;
  return ax % C.n === r;
}

function parseDerSig_(d) {
  // WebCrypto signs in raw r||s form; passkeys in DER.
  if (d.length === 64 && d[0] !== 0x30) return [bytesToBig_(d.slice(0, 32)), bytesToBig_(d.slice(32))];
  try {
    var o = 0;
    if (d[o++] !== 0x30) return null;
    var tl = d[o++]; if (tl & 0x80) o += (tl & 0x7f);
    if (d[o++] !== 0x02) return null;
    var rl = d[o++], r = d.slice(o, o + rl); o += rl;
    if (d[o++] !== 0x02) return null;
    var sl = d[o++], s = d.slice(o, o + sl);
    return [bytesToBig_(r), bytesToBig_(s)];
  } catch (e) { return null; }
}

// ---------------- challenges (single use, short lived) ----------------

function newChallenge_(data) {
  var ch = bytesToB64u_(randomBytes_(32));
  data.exp = Date.now() + CONFIG.CHALLENGE_SECONDS * 1000;
  CacheService.getScriptCache().put('ch:' + ch, JSON.stringify(data), CONFIG.CHALLENGE_SECONDS);
  return ch;
}

function takeChallenge_(ch) {
  var c = CacheService.getScriptCache();
  var raw = c.get('ch:' + ch);
  if (!raw) return null;
  c.remove('ch:' + ch);
  var d = JSON.parse(raw);
  return Date.now() > d.exp ? null : d;
}

// ---------------- ceremonies ----------------

function readClientData_(b64, type) {
  var cd;
  try { cd = JSON.parse(bytesToUtf8_(b64uToBytes_(b64))); } catch (e) { fail_('bad_client_data'); }
  if (cd.type !== type) fail_('bad_client_data');
  if (cfg_().origins.indexOf(cd.origin) < 0) fail_('bad_origin');
  return cd;
}

function checkAuthData_(ad, requireUv) {
  if (requireUv === undefined) requireUv = true;
  if (ad.length < 37) fail_('bad_auth_data');
  if (!bytesEq_(ad.slice(0, 32), sha256_(utf8Bytes_(cfg_().rpId)))) fail_('bad_rp');
  var flags = ad[32];
  if (!(flags & 0x01)) fail_('no_user_presence');
  if (requireUv && !(flags & 0x04)) fail_('no_user_verification');
  return { flags: flags, signCount: ((ad[33] * 256 + ad[34]) * 256 + ad[35]) * 256 + ad[36] };
}

/** Verifies navigator.credentials.create() output; returns the key to store. */
function verifyRegistration_(cred) {
  if (!cred || !cred.response) fail_('bad_credential');
  var cd = readClientData_(cred.response.clientDataJSON, 'webauthn.create');
  var att = cborDecode_(b64uToBytes_(cred.response.attestationObject));
  var ad = att.authData;
  if (!ad) fail_('bad_attestation');
  var info = checkAuthData_(ad);
  if (!(info.flags & 0x40)) fail_('bad_attestation');
  var aaguid = ad.slice(37, 53);
  var idLen = ad[53] * 256 + ad[54];
  var credId = ad.slice(55, 55 + idLen);
  var cose = cborItem_(ad, 55 + idLen).v;
  if (cose[1] !== 2 || cose[3] !== -7 || cose[-1] !== 1) fail_('unsupported_key');
  var x = cose[-2], y = cose[-3];
  if (!x || !y || x.length !== 32 || y.length !== 32 || !onCurve_(bytesToBig_(x), bytesToBig_(y))) fail_('unsupported_key');
  var idB64 = bytesToB64u_(credId);
  if (cred.id && cred.id !== idB64) fail_('bad_credential');
  return {
    challenge: cd.challenge, credId: idB64, x: bytesToB64u_(x), y: bytesToB64u_(y), signCount: info.signCount,
    aaguid: aaguid.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('')
  };
}

/**
 * Device key for older phones: a WebCrypto P-256 key made at activation and
 * kept in the browser (non-extractable where the browser allows). Same
 * message layout as a passkey, typed devicekey.*, with no biometric flag.
 * The key proves it is the same device; it cannot prove who is holding it.
 */
function verifyDeviceKeyRegistration_(d) {
  if (!d || !d.response || !d.x || !d.y || !d.id) fail_('bad_credential');
  var cd = readClientData_(d.response.clientDataJSON, 'devicekey.create');
  var ad = b64uToBytes_(d.response.authenticatorData);
  var info = checkAuthData_(ad, false);
  var x = b64uToBytes_(d.x), y = b64uToBytes_(d.y);
  if (x.length !== 32 || y.length !== 32 || !onCurve_(bytesToBig_(x), bytesToBig_(y))) fail_('unsupported_key');
  var hash = sha256_(ad.concat(sha256_(b64uToBytes_(d.response.clientDataJSON))));
  if (!ecdsaVerifyP256_(hash, b64uToBytes_(d.response.signature), x, y)) fail_('bad_signature');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(String(d.id))) fail_('bad_credential');
  return { challenge: cd.challenge, credId: 'dk_' + d.id, x: d.x, y: d.y, signCount: info.signCount, aaguid: 'devicekey' };
}

/** Verifies navigator.credentials.get() output (or a device-key signature) against a stored credential row. */
function verifyAssertion_(cred, stored) {
  var dk = stored.kind === 'devicekey';
  var cd = readClientData_(cred.response.clientDataJSON, dk ? 'devicekey.get' : 'webauthn.get');
  var ad = b64uToBytes_(cred.response.authenticatorData);
  var info = checkAuthData_(ad, !dk);
  var cdHash = sha256_(b64uToBytes_(cred.response.clientDataJSON));
  var hash = sha256_(ad.concat(cdHash));
  if (!ecdsaVerifyP256_(hash, b64uToBytes_(cred.response.signature), b64uToBytes_(stored.x), b64uToBytes_(stored.y))) fail_('bad_signature');
  var prev = Number(stored.signCount || 0);
  if ((prev > 0 || info.signCount > 0) && info.signCount <= prev) fail_('cloned_authenticator');
  return { challenge: cd.challenge, signCount: info.signCount };
}
