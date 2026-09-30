// Runs the real backend/*.gs under Node's vm with in-memory stand-ins for the
// Apps Script services, plus a software authenticator that behaves like a
// phone's Face ID passkey (P-256, user verification flag set).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function makeSheet(name) {
  const rows = [];
  return {
    _rows: rows,
    getLastRow: () => rows.length,
    getLastColumn: () => rows.reduce((m, r) => Math.max(m, r ? r.length : 0), 0),
    getDataRange() {
      const nr = Math.max(1, rows.length), nc = Math.max(1, rows.reduce((m, r) => Math.max(m, r ? r.length : 0), 0));
      return this.getRange(1, 1, nr, nc);
    },
    getRange(r, c, nr, nc) {
      return {
        setValues(vals) { for (let i = 0; i < nr; i++) { rows[r - 1 + i] = rows[r - 1 + i] || []; for (let j = 0; j < nc; j++) rows[r - 1 + i][c - 1 + j] = vals[i][j]; } },
        getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) { const v = (rows[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } o.push(row); } return o; },
        clearContent() { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (rows[r - 1 + i]) rows[r - 1 + i][c - 1 + j] = ''; }
      };
    },
    appendRow(v) { rows.push(v.slice()); },
    setFrozenRows() {}
  };
}

function load(opts = {}) {
  const sheets = {};
  const props = Object.assign({}, opts.props || {});
  const cache = {};
  let clock = opts.now || null;
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0 && clock !== null) super(clock); else super(...a); }
    static now() { return clock !== null ? clock : RealDate.now(); }
  }
  const signed = b => Array.from(b, x => (x > 127 ? x - 256 : x));
  const ctx = {
    console, Math, JSON, BigInt, Array, Object, String, Number, isFinite, parseInt, Error,
    Date: FakeDate,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({
      get: k => (cache[k] && cache[k].exp > FakeDate.now() ? cache[k].v : null),
      put: (k, v, s) => { cache[k] = { v, exp: FakeDate.now() + s * 1000 }; },
      remove: k => { delete cache[k]; }
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { createTextOutput: t => ({ setMimeType() { return t; } }), MimeType: { JSON: 'json' } },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      base64Decode: s => signed(Buffer.from(s, 'base64')),
      base64EncodeWebSafe: b => Buffer.from(Uint8Array.from(b, x => x & 255)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      computeDigest: (alg, b) => signed(crypto.createHash('sha256').update(Buffer.from(Uint8Array.from(b, x => x & 255))).digest()),
      computeHmacSha256Signature: (m, k) => signed(crypto.createHmac('sha256', k).update(m).digest()),
      DigestAlgorithm: { SHA_256: 'sha256' },
      newBlob: x => ({
        getBytes: () => signed(Buffer.from(String(x), 'utf8')),
        getDataAsString: () => Buffer.from(Uint8Array.from(x, v => v & 255)).toString('utf8')
      })
    }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const dir = path.join(__dirname, '..', 'backend');
  for (const f of ['Code.gs', 'WebAuthn.gs', 'Attendance.gs', 'Admin.gs', 'Hr.gs']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  if (opts.setupKeyHash) vm.runInContext(`var SETUP_KEY_HASH = ${JSON.stringify(opts.setupKeyHash)};`, ctx);
  return {
    ctx, sheets, props, cache,
    call: req => JSON.parse(JSON.stringify(ctx.handle_(req))),
    setNow: ms => { clock = ms; }
  };
}

// ---------------- software authenticator ----------------

const b64u = b => Buffer.from(b).toString('base64url');

function cbor(v) {
  const head = (mt, n) => {
    if (n < 24) return Buffer.from([(mt << 5) | n]);
    if (n < 256) return Buffer.from([(mt << 5) | 24, n]);
    if (n < 65536) return Buffer.from([(mt << 5) | 25, n >> 8, n & 255]);
    const b = Buffer.alloc(5); b[0] = (mt << 5) | 26; b.writeUInt32BE(n, 1); return b;
  };
  if (Buffer.isBuffer(v)) return Buffer.concat([head(2, v.length), v]);
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v);
  if (typeof v === 'string') { const s = Buffer.from(v); return Buffer.concat([head(3, s.length), s]); }
  if (v instanceof Map) { const parts = [head(5, v.size)]; for (const [k, x] of v) parts.push(cbor(k), cbor(x)); return Buffer.concat(parts); }
  throw new Error('cbor type');
}

class Authenticator {
  constructor({ rpId = 'besgasksa.github.io', origin = 'https://besgasksa.github.io', uv = true } = {}) {
    this.rpId = rpId; this.origin = origin; this.uv = uv; this.count = 0;
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    this.priv = privateKey;
    const jwk = publicKey.export({ format: 'jwk' });
    this.x = Buffer.from(jwk.x, 'base64url'); this.y = Buffer.from(jwk.y, 'base64url');
    this.credId = crypto.randomBytes(16);
  }
  authData(withCred) {
    const rpHash = crypto.createHash('sha256').update(this.rpId).digest();
    const flags = 0x01 | (this.uv ? 0x04 : 0) | (withCred ? 0x40 : 0);
    const cnt = Buffer.alloc(4); cnt.writeUInt32BE(this.count);
    const parts = [rpHash, Buffer.from([flags]), cnt];
    if (withCred) {
      const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, this.x], [-3, this.y]]));
      const len = Buffer.from([this.credId.length >> 8, this.credId.length & 255]);
      parts.push(Buffer.alloc(16), len, this.credId, cose);
    }
    return Buffer.concat(parts);
  }
  create(options) {
    const cd = Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin: this.origin }));
    const att = cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', this.authData(true)]]));
    return { id: b64u(this.credId), rawId: b64u(this.credId), type: 'public-key', response: { clientDataJSON: b64u(cd), attestationObject: b64u(att) } };
  }
  get(options, { tamper = false, count } = {}) {
    if (count !== undefined) this.count = count;
    const cd = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin: this.origin }));
    const ad = this.authData(false);
    const sig = crypto.sign('sha256', Buffer.concat([ad, crypto.createHash('sha256').update(cd).digest()]), { key: this.priv, dsaEncoding: 'der' });
    if (tamper) sig[sig.length - 1] ^= 1;
    return { id: b64u(this.credId), rawId: b64u(this.credId), type: 'public-key', response: { clientDataJSON: b64u(cd), authenticatorData: b64u(ad), signature: b64u(sig) } };
  }
}

// An older phone without Face ID: WebCrypto key, raw r||s signatures, no UV flag.
class DeviceKey {
  constructor({ rpId = 'besgasksa.github.io', origin = 'https://besgasksa.github.io' } = {}) {
    this.rpId = rpId; this.origin = origin;
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    this.priv = privateKey; const jwk = publicKey.export({ format: 'jwk' }); this.jwk = jwk;
    this.rawId = crypto.randomBytes(16).toString('base64url');
  }
  sign(type, challenge) {
    const cd = Buffer.from(JSON.stringify({ type, challenge, origin: this.origin }));
    const ad = Buffer.concat([crypto.createHash('sha256').update(this.rpId).digest(), Buffer.from([0x01]), Buffer.alloc(4)]);
    const sig = crypto.sign('sha256', Buffer.concat([ad, crypto.createHash('sha256').update(cd).digest()]), { key: this.priv, dsaEncoding: 'ieee-p1363' });
    return { clientDataJSON: b64u(cd), authenticatorData: b64u(ad), signature: b64u(sig) };
  }
  create(options) { return { id: this.rawId, x: this.jwk.x, y: this.jwk.y, response: this.sign('devicekey.create', options.challenge) }; }
  get(options) { return { id: 'dk_' + this.rawId, response: this.sign('devicekey.get', options.challenge) }; }
}

module.exports = { load, Authenticator, DeviceKey, cbor };
