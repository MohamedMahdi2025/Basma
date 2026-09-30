/**
 * Best Gas Attendance (نظام الحضور) — backend core.
 * Google Apps Script web app; a Google Sheet is the database.
 * Files: Code.gs (this: config, sheet db, tokens, router), WebAuthn.gs
 * (passkey verification, P-256 ECDSA), Attendance.gs (geofence, punches,
 * risk, summaries), Admin.gs (employees, zones, settings, reports).
 * No secrets live in this file: the token key is generated into script
 * properties on first use, and the setup key hash comes from Secrets.js,
 * which exists only in the private clasp folder.
 */

var CONFIG = {
  RP_NAME: 'Best Gas Attendance',
  RP_ID: 'besgasksa.github.io',
  ORIGINS: ['https://besgasksa.github.io'],
  TZ_OFFSET_MIN: 180, // Asia/Riyadh, no DST
  EMP_TOKEN_HOURS: 12,
  ADMIN_TOKEN_HOURS: 8,
  CHALLENGE_SECONDS: 180,
  ACTIVATION_HOURS: 72,
  ACTIVATION_MAX_TRIES: 5
};

var SHEETS = { EMP: 'employees', CRED: 'credentials', ZONES: 'zones', PUNCH: 'punches', AUDIT: 'audit', SET: 'settings' };

var HEADERS = {
  employees: ['id', 'empNo', 'name', 'nameEn', 'email', 'phone', 'department', 'title', 'role', 'status',
    'zoneIds', 'shiftStart', 'shiftEnd', 'workdays', 'tokenVer', 'actHash', 'actExp', 'actTries', 'createdAt', 'updatedAt',
    'pwHash', 'pwSalt', 'pwTries', 'pwLockUntil', 'actIssuedBy'],
  credentials: ['credId', 'empId', 'x', 'y', 'signCount', 'label', 'status', 'createdAt', 'lastUsedAt', 'aaguid', 'kind',
    'platform', 'pinHash', 'pinSalt', 'pinTries'],
  zones: ['id', 'name', 'nameEn', 'lat', 'lng', 'radius', 'status', 'createdAt', 'updatedAt'],
  punches: ['id', 'empId', 'type', 'ts', 'date', 'lat', 'lng', 'acc', 'zoneId', 'distance', 'status', 'risk', 'flags',
    'source', 'note', 'reviewBy', 'reviewAt', 'credId', 'ua', 'createdAt'],
  audit: ['ts', 'actorId', 'action', 'targetId', 'detail'],
  settings: ['key', 'value']
};

var ROLES = { employee: 1, hr: 2, admin: 3 };

function cfg_() {
  var p = PropertiesService.getScriptProperties();
  var rp = p.getProperty('RP_ID');
  var or = p.getProperty('ORIGINS');
  return {
    rpId: rp || CONFIG.RP_ID,
    origins: or ? or.split(',').map(function (s) { return s.trim(); }) : CONFIG.ORIGINS
  };
}

// ---------------- sheet database ----------------

var SHEET_CACHE_ = {};

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  if (SHEET_CACHE_[name]) return SHEET_CACHE_[name];
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sh.setFrozenRows(1);
  }
  else if (sh.getLastColumn() < HEADERS[name].length) sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  SHEET_CACHE_[name] = sh;
  return sh;
}

// Each sheet is read once per request. Apps Script sheet reads cost 100-600 ms each,
// and one request used to read the same tab three or four times.
var READ_MEMO_ = {};
function forget_(name) { delete READ_MEMO_[name]; }

function readAll_(name) {
  if (READ_MEMO_[name]) return READ_MEMO_[name];
  var sh = sheet_(name);
  var last = sh.getLastRow();
  var cols = HEADERS[name];
  if (last < 2) return (READ_MEMO_[name] = []);
  var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var o = { _row: i + 2 };
    for (var c = 0; c < cols.length; c++) {
      var v = vals[i][c];
      o[cols[c]] = (v instanceof Date) ? v.toISOString() : v;
    }
    out.push(o);
  }
  READ_MEMO_[name] = out;
  return out;
}

function toRow_(name, obj) {
  return HEADERS[name].map(function (k) {
    var v = obj[k];
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  });
}

function append_(name, obj) {
  forget_(name);
  var sh = sheet_(name);
  sh.appendRow(toRow_(name, obj));
}

function update_(name, obj) {
  if (!obj._row) throw new Error('update_ without _row');
  forget_(name);
  sheet_(name).getRange(obj._row, 1, 1, HEADERS[name].length).setValues([toRow_(name, obj)]);
}

function findBy_(name, key, value) {
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) if (String(rows[i][key]) === String(value)) return rows[i];
  return null;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function audit_(actorId, action, targetId, detail) {
  try {
    append_(SHEETS.AUDIT, { ts: new Date().toISOString(), actorId: actorId || '', action: action,
      targetId: targetId || '', detail: detail ? JSON.stringify(detail).slice(0, 2000) : '' });
  } catch (e) { /* audit must never break the request */ }
}

// ---------------- settings ----------------

var DEFAULT_SETTINGS = {
  shiftStart: '08:00',
  shiftEnd: '17:00',
  graceMin: 15,
  workdays: '0,1,2,3,4',          // Sun..Thu
  maxAccuracy: 100,               // metres; worse fixes are refused
  minPunchGapMin: 1,
  reviewRiskThreshold: 40,
  allowCheckoutOutside: false,
  allowDeviceKey: true,          // older phones without Face ID / fingerprint: tap with a device-bound key
  allowDesktop: true,            // laptops: device key + 6-digit PIN
  allowPasswordPunch: true,      // check-in from a password session (any device), flagged for HR
  maxAccuracyDesktop: 150        // laptops locate by Wi-Fi, so they get a wider allowance
};

var SETTINGS_CACHE_KEY = 'settings:v1';

function settings_() {
  try { var hit = CacheService.getScriptCache().get(SETTINGS_CACHE_KEY); if (hit) return JSON.parse(hit); } catch (e) {}
  var s = {};
  for (var k in DEFAULT_SETTINGS) s[k] = DEFAULT_SETTINGS[k];
  readAll_(SHEETS.SET).forEach(function (r) {
    if (!(r.key in DEFAULT_SETTINGS)) return;
    var d = DEFAULT_SETTINGS[r.key];
    var v = r.value;
    if (typeof d === 'number') v = Number(v);
    else if (typeof d === 'boolean') v = (v === true || v === 'true' || v === 'TRUE');
    else v = String(v);
    s[r.key] = v;
  });
  try { CacheService.getScriptCache().put(SETTINGS_CACHE_KEY, JSON.stringify(s), 600); } catch (e) {}
  return s;
}

// ---------------- time (Asia/Riyadh, fixed +03:00) ----------------

function localParts_(date) {
  var d = new Date(date.getTime() + CONFIG.TZ_OFFSET_MIN * 60000);
  var iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), dow: d.getUTCDay() };
}

function hmToMin_(hm) {
  var p = String(hm || '').split(':');
  return Number(p[0]) * 60 + Number(p[1] || 0);
}

function addDays_(dateStr, n) {
  var d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------- random, hashing ----------------

function randomBytes_(n) {
  var out = [];
  while (out.length < n) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    for (var i = 0; i < hex.length && out.length < n; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  }
  // UUID v4 has fixed version/variant nibbles; mix with a digest so every byte is uniform.
  var mixed = sha256_(out.concat(utf8Bytes_(String(Date.now()) + Math.random())));
  return out.map(function (b, i) { return b ^ mixed[i % 32]; });
}

function newId_(prefix) {
  return (prefix || '') + bytesToB64u_(randomBytes_(9));
}

function sha256Hex_(str) {
  return sha256_(utf8Bytes_(str)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}

// ---------------- signed session tokens ----------------

function tokenSecret_() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('TOKEN_SECRET');
  if (!s) {
    s = bytesToB64u_(randomBytes_(32));
    p.setProperty('TOKEN_SECRET', s);
  }
  return s;
}

function hmac_(msg) {
  var sig = Utilities.computeHmacSha256Signature(msg, tokenSecret_());
  return bytesToB64u_(sig.map(function (b) { return b & 255; }));
}

/** method: 'dev' (a registered device: PIN or passkey) or 'pw' (password, any device). */
function issueToken_(emp, method) {
  var hours = ROLES[emp.role] >= ROLES.hr ? CONFIG.ADMIN_TOKEN_HOURS : CONFIG.EMP_TOKEN_HOURS;
  var body = bytesToB64u_(utf8Bytes_(JSON.stringify({ e: emp.id, v: Number(emp.tokenVer || 0), x: Date.now() + hours * 3600000, m: method === 'pw' ? 'pw' : 'dev' })));
  return body + '.' + hmac_(body);
}

function readToken_(token) {
  if (!token || typeof token !== 'string') return null;
  var parts = token.split('.');
  if (parts.length !== 2) return null;
  if (!safeEqual_(hmac_(parts[0]), parts[1])) return null;
  var p;
  try { p = JSON.parse(bytesToUtf8_(b64uToBytes_(parts[0]))); } catch (e) { return null; }
  if (!p || Date.now() > p.x) return null;
  var emp = findBy_(SHEETS.EMP, 'id', p.e);
  if (!emp || emp.status !== 'active' || Number(emp.tokenVer || 0) !== p.v) return null;
  emp._auth = p.m || 'dev';
  return emp;
}

function safeEqual_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------------- rate limiting ----------------

function rateLimit_(key, max, seconds) {
  var c = CacheService.getScriptCache();
  var k = 'rl:' + key;
  var n = Number(c.get(k) || 0);
  if (n >= max) return false;
  c.put(k, String(n + 1), seconds);
  return true;
}

// ---------------- HTTP ----------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return json_({ ok: true, service: 'bestgas-attendance', time: new Date().toISOString(), bigint: typeof BigInt === 'function' });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  return json_(handle_(req));
}

var PUBLIC_ACTIONS = {
  ping: 1, bootstrapStatus: 1, bootstrap: 1, enrollBegin: 1, enrollFinish: 1,
  authBegin: 1, authFinish: 1, punchBegin: 1, punchFinish: 1, adminRecover: 1, pwLogin: 1
};
var EMP_ACTIONS = { me: 1, myHistory: 1, passwordSet: 1, punchPw: 1 };
var HR_ACTIONS = { board: 1, empList: 1, zoneList: 1, report: 1, reviewList: 1, reviewDecide: 1, manualPunch: 1, auditList: 1, settingsGet: 1, empSave: 1, empActivation: 1 };
var ADMIN_ACTIONS = { empResetDevice: 1, zoneSave: 1, zoneDelete: 1, settingsSave: 1 };

function handle_(req) {
  READ_MEMO_ = {};
  var action = req && req.action;
  try {
    var fn = /^[a-zA-Z]+$/.test(String(action)) ? globalThis['api_' + action] : null;
    if (typeof fn !== 'function') return { ok: false, error: 'unknown_action' };
    if (PUBLIC_ACTIONS[action]) return fn(req, null);
    var me = readToken_(req.token);
    if (!me) return { ok: false, error: 'session_expired' };
    var level = ROLES[me.role] || 0;
    if (EMP_ACTIONS[action] && level >= 1) return fn(req, me);
    if (HR_ACTIONS[action] && level >= ROLES.hr) return fn(req, me);
    if (ADMIN_ACTIONS[action] && level >= ROLES.admin) return fn(req, me);
    return { ok: false, error: 'forbidden' };
  } catch (err) {
    var msg = String(err && err.message || err);
    if (msg.indexOf('E:') === 0) return { ok: false, error: msg.slice(2) };
    console.error(action + ': ' + msg + '\n' + (err && err.stack));
    return { ok: false, error: 'server_error' };
  }
}

function fail_(code) { throw new Error('E:' + code); }

/** Run once from the Apps Script editor so Google asks the owner to approve the sheet access. */
function authorize() { ss_(); sheet_(SHEETS.EMP); return 'ok'; }

function api_ping() { return { ok: true, time: new Date().toISOString() }; }

function publicEmp_(e) {
  return {
    id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, email: e.email, phone: String(e.phone || ''),
    department: e.department, title: e.title, role: e.role, status: e.status,
    zoneIds: String(e.zoneIds || ''), shiftStart: e.shiftStart, shiftEnd: e.shiftEnd, workdays: String(e.workdays || '')
  };
}
