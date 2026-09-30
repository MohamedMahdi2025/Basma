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

var SHEETS = { EMP: 'employees', CRED: 'credentials', ZONES: 'zones', PUNCH: 'punches', AUDIT: 'audit', SET: 'settings',
  DEPT: 'departments', POS: 'positions', PRIV: 'empPrivate', COMP: 'compensation', JOBH: 'jobHistory', DOCS: 'documents' };

var HEADERS = {
  employees: ['id', 'empNo', 'name', 'nameEn', 'email', 'phone', 'department', 'title', 'role', 'status',
    'zoneIds', 'shiftStart', 'shiftEnd', 'workdays', 'tokenVer', 'actHash', 'actExp', 'actTries', 'createdAt', 'updatedAt',
    'pwHash', 'pwSalt', 'pwTries', 'pwLockUntil', 'actIssuedBy', 'pwMustChange',
    // HR (Phase 1): job placement and the Qiwa unified-contract terms
    'extraRoles', 'departmentId', 'positionId', 'managerId', 'hireDate', 'contractType', 'contractEnd', 'probationEnd',
    'nationality', 'isSaudi', 'gender', 'workLocation', 'contractNo', 'occupationCode', 'employmentType',
    'workDaysPerWeek', 'dailyHours', 'annualLeaveDays', 'noticeDays'],
  credentials: ['credId', 'empId', 'x', 'y', 'signCount', 'label', 'status', 'createdAt', 'lastUsedAt', 'aaguid', 'kind',
    'platform', 'pinHash', 'pinSalt', 'pinTries'],
  zones: ['id', 'name', 'nameEn', 'lat', 'lng', 'radius', 'status', 'createdAt', 'updatedAt'],
  punches: ['id', 'empId', 'type', 'ts', 'date', 'lat', 'lng', 'acc', 'zoneId', 'distance', 'status', 'risk', 'flags',
    'source', 'note', 'reviewBy', 'reviewAt', 'credId', 'ua', 'createdAt'],
  audit: ['ts', 'actorId', 'action', 'targetId', 'detail'],
  settings: ['key', 'value'],
  departments: ['id', 'code', 'nameAr', 'nameEn', 'parentId', 'headEmpId', 'costCenter', 'status', 'createdAt', 'updatedAt'],
  positions: ['id', 'code', 'titleAr', 'titleEn', 'departmentId', 'grade', 'purposeAr', 'purposeEn', 'dutiesAr', 'dutiesEn',
    'requirementsAr', 'requirementsEn', 'status', 'createdAt', 'updatedAt'],
  empPrivate: ['empId', 'nationalId', 'idExpiry', 'birthDate', 'maritalStatus', 'iban', 'bankName', 'gosiNumber', 'gosiCohort',
    'address', 'emergencyName', 'emergencyPhone', 'updatedAt', 'borderNo', 'passportNo', 'passportExpiry', 'nationalAddress',
    'personalEmail', 'nameEnOfficial'],
  compensation: ['id', 'empId', 'effectiveFrom', 'basic', 'housing', 'transport', 'otherJson', 'currency', 'reason',
    'enteredBy', 'approvedBy', 'approvedAt', 'status', 'createdAt', 'batchId'],
  jobHistory: ['id', 'empId', 'effectiveFrom', 'departmentId', 'positionId', 'managerId', 'grade', 'reason', 'enteredBy', 'createdAt'],
  documents: ['id', 'empId', 'type', 'number', 'issueDate', 'expiryDate', 'note', 'status', 'createdAt', 'updatedAt']
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

// Every call into SpreadsheetApp costs 70-200 ms on Google's side whatever the size of the tab,
// so the number of calls, not the data, decides how fast a request is.
var HEADER_OK_ = {};

function sheet_(name) {
  if (SHEET_CACHE_[name]) return SHEET_CACHE_[name];
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sh.setFrozenRows(1);
    HEADER_OK_[name] = true;
  }
  SHEET_CACHE_[name] = sh;
  return sh;
}

/** New columns added in code get their header written once, the first time the tab is touched. */
function ensureHeader_(name, sh, width) {
  if (HEADER_OK_[name]) return;
  if ((width === undefined ? sh.getLastColumn() : width) < HEADERS[name].length) sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  HEADER_OK_[name] = true;
}

// Each sheet is read once per request. Apps Script sheet reads cost 100-600 ms each,
// and one request used to read the same tab three or four times.
var READ_MEMO_ = {};
function forget_(name) { delete READ_MEMO_[name]; }

/*
 * Sign-in reads the employees and zones tabs but never writes them, and each tab read costs
 * 250-900 ms. Those two paths may use a copy in CacheService (about 50 ms) that is trusted only
 * while its version tag matches the tab's current version. Every write through the app and every
 * hand edit in the Sheet (onEdit) sets a new version, so a changed tab is read fresh at once;
 * the copy also lapses after 60 s whatever happens. Rows from the copy are marked and can never
 * be written back (update_ refuses), so the copy cannot overwrite the Sheet.
 */
var CACHED_TABS_ = { employees: 1, zones: 1 };
var USE_TAB_CACHE_ = false;
var TAB_CACHE_SECONDS_ = 60;
function tabKeys_(name) { return { snap: 'tab:v1:' + name, ver: 'tabver:v1:' + name }; }
function bumpTab_(name) {
  if (!CACHED_TABS_[name]) return;
  try { CacheService.getScriptCache().put(tabKeys_(name).ver, bytesToB64u_(randomBytes_(9)), 21600); } catch (e) {}
}
function cachedRows_(name) {
  var k = tabKeys_(name), got;
  try { got = CacheService.getScriptCache().getAll([k.snap, k.ver]); } catch (e) { return null; }
  var ver = got[k.ver] || '';
  if (got[k.snap]) {
    try {
      var snap = JSON.parse(got[k.snap]);
      if (snap.ver === ver) { snap.rows.forEach(function (r) { r._cached = true; }); return { rows: snap.rows }; }
    } catch (e) {}
  }
  return { ver: ver };
}

/** Simple trigger: a hand edit in the Sheet makes the app read that tab fresh on the next request. */
function onEdit(e) {
  try {
    var name = e && e.range ? e.range.getSheet().getName() : '';
    if (name) bumpTab_(name);
    if (name === SHEETS.SET) CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY);
  } catch (err) {}
}

function readAll_(name) {
  if (READ_MEMO_[name]) return READ_MEMO_[name];
  var tag = null;
  if (USE_TAB_CACHE_ && CACHED_TABS_[name]) {
    var c = cachedRows_(name);
    if (c && c.rows) return (READ_MEMO_[name] = c.rows);
    if (c) tag = c.ver;
  }
  var sh = sheet_(name);
  var cols = HEADERS[name];
  // One call for header and rows together (was three: last column, last row, values).
  var vals = sh.getDataRange().getValues();
  ensureHeader_(name, sh, vals.length ? vals[0].length : 0);
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = { _row: i + 1 }, blank = true;
    for (var c = 0; c < cols.length; c++) {
      var v = vals[i][c];
      if (v === undefined) v = '';
      if (v !== '') blank = false;
      o[cols[c]] = (v instanceof Date) ? v.toISOString() : v;
    }
    if (!blank) out.push(o);
  }
  if (tag !== null) {
    try {
      var json = JSON.stringify({ ver: tag, rows: out });
      if (json.length < 90000) CacheService.getScriptCache().put(tabKeys_(name).snap, json, TAB_CACHE_SECONDS_);
    } catch (e) {}
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
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.appendRow(toRow_(name, obj));
}

/** One write for many rows: appendRow per row is far too slow for an import. */
function appendMany_(name, objs) {
  if (!objs.length) return;
  forget_(name);
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(sh.getLastRow() + 1, 1, objs.length, HEADERS[name].length).setValues(objs.map(function (o) { return toRow_(name, o); }));
}

function update_(name, obj) {
  if (!obj._row) throw new Error('update_ without _row');
  if (obj._cached) throw new Error('update_ from a cached copy of ' + name);
  bumpTab_(name);
  // The row object read this request is the one written, so the memo stays true; only a foreign copy forces a re-read.
  var memo = READ_MEMO_[name];
  if (!memo || memo.indexOf(obj) < 0) forget_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(obj._row, 1, 1, HEADERS[name].length).setValues([toRow_(name, obj)]);
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
  try { CacheService.getScriptCache().put(SETTINGS_CACHE_KEY, JSON.stringify(s), 120); } catch (e) {}
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

var TOKEN_SECRET_ = null; // one properties read per request, not one per token
function tokenSecret_() {
  if (TOKEN_SECRET_) return TOKEN_SECRET_;
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('TOKEN_SECRET');
  if (!s) {
    s = bytesToB64u_(randomBytes_(32));
    p.setProperty('TOKEN_SECRET', s);
  }
  return (TOKEN_SECRET_ = s);
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
  authBegin: 1, authFinish: 1, punchBegin: 1, punchFinish: 1, adminRecover: 1, pwLogin: 1, pinChange: 1, diag: 1
};
var EMP_ACTIONS = { me: 1, myHistory: 1, passwordSet: 1, punchPw: 1,
  myFile: 1, hrEmpFile: 1, hrTeam: 1, hrCompList: 1, hrCompPropose: 1, hrCompDecide: 1 };
var HR_ACTIONS = { hrDirectory: 1, hrDeptList: 1, hrDeptSave: 1, hrPositionList: 1, hrPositionSave: 1, hrEmpSave: 1,
  hrPrivateSave: 1, hrImportValidate: 1, hrImportCommit: 1, hrDocList: 1, hrDocSave: 1, hrExpiring: 1, empPasswordReset: 1, board: 1, empList: 1, zoneList: 1, report: 1, reviewList: 1, reviewDecide: 1, manualPunch: 1, auditList: 1, settingsGet: 1, empSave: 1, empActivation: 1 };
var ADMIN_ACTIONS = { hrRolesSave: 1, empResetDevice: 1, zoneSave: 1, zoneDelete: 1, settingsSave: 1 };

function handle_(req) {
  READ_MEMO_ = {};
  USE_TAB_CACHE_ = false;
  var action = req && req.action;
  try {
    var fn = /^[a-zA-Z]+$/.test(String(action)) ? globalThis['api_' + action] : null;
    if (typeof fn !== 'function') return { ok: false, error: 'unknown_action' };
    if (PUBLIC_ACTIONS[action]) return fn(req, null);
    var me = readToken_(req.token);
    if (!me) return { ok: false, error: 'session_expired' };
    if (me._auth === 'pw' && (me.pwMustChange === true || me.pwMustChange === 'true' || me.pwMustChange === 'TRUE') && action !== 'passwordSet' && action !== 'me') {
      return { ok: false, error: 'password_change_required' };
    }
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
