/**
 * HR and administrator actions. HR can run the board, reports, the review
 * queue, manual corrections and employees (never granting hr/admin);
 * zones, settings and device resets are administrator-only (Code.gs).
 */

function str_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 120); }
function isHm_(v) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v)); }

// ---------------- live board ----------------

function api_board(req, me) {
  var s = settings_(), now = new Date(), date = localParts_(now).date;
  // Someone whose first day is still ahead is not on today's board (never "absent" before they start).
  var emps = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active' && joinedDate_(e) <= date; });
  var punches = readAll_(SHEETS.PUNCH);
  var zones = {};
  readAll_(SHEETS.ZONES).forEach(function (z) { zones[z.id] = z.name; });
  var creds = {};
  readAll_(SHEETS.CRED).forEach(function (c) { if (c.status === 'active') creds[c.empId] = true; });
  var today = {}, rejected = {}, reviewCount = 0;
  punches.forEach(function (p) {
    if (p.status === 'review') reviewCount++;
    if (p.date !== date) return;
    if (p.status === 'rejected') { rejected[p.empId] = (rejected[p.empId] || 0) + 1; return; }
    if (isCounted_(p)) (today[p.empId] = today[p.empId] || []).push(p);
  });
  var off = offIndex_(date, date);
  var rows = emps.map(function (e) {
    var ps = (today[e.id] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
    var sum = summarizeDay_(e, date, ps, s, now, off(e.id, date));
    var last = ps[ps.length - 1];
    return { emp: publicEmp_(e), day: sum, lastZone: last ? zones[last.zoneId] || '' : '', lastTs: last ? last.ts : null,
      rejected: rejected[e.id] || 0, enrolled: !!creds[e.id] };
  });
  var k = { total: rows.length, in: 0, out: 0, late: 0, absent: 0, upcoming: 0, off: 0, leave: 0, review: reviewCount };
  rows.forEach(function (r) {
    var st = r.day.status;
    if (st === 'in') k.in++;
    else if (st === 'present') k.out++;
    else if (st === 'absent') k.absent++;
    else if (st === 'upcoming') k.upcoming++;
    else if (st === 'off' || st === 'holiday') k.off++;
    else if (st === 'leave') k.leave++;
    if (r.day.lateMin) k.late++;
  });
  return { ok: true, date: date, kpi: k, rows: rows, serverTime: now.toISOString() };
}

// ---------------- employees ----------------

function api_empList(req, me) {
  var creds = {};
  readAll_(SHEETS.CRED).forEach(function (c) {
    if (c.status !== 'active' && c.status !== 'locked') return;
    (creds[c.empId] = creds[c.empId] || []).push(publicDevice_(c));
  });
  var rows = readAll_(SHEETS.EMP).map(function (e) {
    var o = publicEmp_(e);
    o.devices = creds[e.id] || [];
    o.device = o.devices.filter(function (d) { return d.status === 'active'; })[0] || null;
    o.activationPending = !!e.actHash && new Date(e.actExp).getTime() > Date.now();
    o.hasPassword = !!e.pwHash;
    o.passwordLocked = !!e.pwLockUntil && new Date(e.pwLockUntil).getTime() > Date.now();
    o.mustChangePassword = e.pwMustChange === true || e.pwMustChange === 'true' || e.pwMustChange === 'TRUE';
    o.activationExp = e.actExp || '';
    return o;
  });
  return { ok: true, rows: rows };
}

function api_empSave(req, me) {
  var d = req.emp || {};
  return withLock_(function () {
    var all = readAll_(SHEETS.EMP);
    var emp = d.id ? all.filter(function (e) { return e.id === d.id; })[0] : null;
    if (d.id && !emp) fail_('not_found');
    var empNo = str_(d.empNo, 30);
    var name = str_(d.name, 80);
    if (!empNo || !name) fail_('missing_fields');
    if (all.some(function (e) { return String(e.empNo).trim() === empNo && (!emp || e.id !== emp.id); })) fail_('duplicate_emp_no');
    var role = ROLES[d.role] ? d.role : 'employee';
    var isAdmin = me.role === 'admin';
    if (!isAdmin && (role !== 'employee' || (emp && emp.role !== 'employee'))) fail_('forbidden');
    if (emp && emp.id === me.id && role !== me.role) fail_('cannot_change_own_role');
    ['shiftStart', 'shiftEnd'].forEach(function (k) { if (d[k] && !isHm_(d[k])) fail_('bad_time'); });
    var zoneIds = String(d.zoneIds || '').split(',').map(function (s) { return s.trim(); }).filter(String);
    var known = readAll_(SHEETS.ZONES).map(function (z) { return z.id; });
    zoneIds.forEach(function (z) { if (known.indexOf(z) < 0) fail_('bad_zone'); });
    var status = d.status === 'disabled' ? 'disabled' : 'active';
    if (emp && emp.id === me.id && status !== 'active') fail_('cannot_disable_self');
    var now = new Date().toISOString(), created = !emp, code = null;
    if (!emp) emp = { id: newId_('E'), tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now };
    var wasActive = emp.status === 'active';
    emp.empNo = empNo; emp.name = name; emp.nameEn = str_(d.nameEn, 80); emp.email = str_(d.email, 120);
    emp.phone = str_(d.phone, 30); emp.department = str_(d.department, 60); emp.title = str_(d.title, 60);
    emp.role = role; emp.status = status; emp.zoneIds = zoneIds.join(',');
    emp.shiftStart = d.shiftStart || ''; emp.shiftEnd = d.shiftEnd || '';
    emp.workdays = /^[0-6](,[0-6])*$/.test(String(d.workdays || '')) ? String(d.workdays) : '';
    emp.updatedAt = now;
    if (wasActive && status === 'disabled') emp.tokenVer = Number(emp.tokenVer || 0) + 1;
    if (created) { code = setActivation_(emp); append_(SHEETS.EMP, emp); }
    else update_(SHEETS.EMP, emp);
    audit_(me.id, created ? 'emp_create' : 'emp_update', emp.id, { empNo: empNo, role: role, status: status });
    return { ok: true, emp: publicEmp_(emp), activationCode: code };
  });
}

/** New activation code. Enrolling with it replaces the current device. */
function api_empActivation(req, me) {
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.id);
    if (!emp) fail_('not_found');
    if (me.role !== 'admin' && emp.role !== 'employee') fail_('forbidden');
    var code = setActivation_(emp, me.id);
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'activation_issued', emp.id, null);
    return { ok: true, activationCode: code, expires: emp.actExp };
  });
}

// A temporary password: 10 characters, always letters and digits, no look-alike characters.
function tempPassword_() {
  var letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', digits = '23456789', all = letters + digits;
  for (;;) {
    var b = randomBytes_(10), pw = '';
    for (var i = 0; i < 10; i++) pw += all[b[i] % all.length];
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw) && Object.keys(pw.split('').reduce(function (o, c) { o[c] = 1; return o; }, {})).length >= 5) return pw;
  }
}

/** HR / admin: issue a one-time temporary password. It must be changed at the next sign-in; lockouts are cleared. */
function api_empPasswordReset(req, me) {
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.id);
    if (!emp) fail_('not_found');
    if (emp.id === me.id) fail_('cannot_reset_own_password');
    if (me.role !== 'admin' && emp.role !== 'employee') fail_('forbidden');
    var pw = tempPassword_();
    emp.pwSalt = bytesToB64u_(randomBytes_(16));
    emp.pwHash = pwHash_(pw, emp.pwSalt);
    emp.pwTries = 0; emp.pwLockUntil = ''; emp.pwMustChange = true;
    emp.tokenVer = Number(emp.tokenVer || 0) + 1; // ends sessions opened with the old password
    emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'password_reset', emp.id, null);
    return { ok: true, tempPassword: pw };
  });
}

function api_empResetDevice(req, me) {
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.id);
    if (!emp) fail_('not_found');
    readAll_(SHEETS.CRED).forEach(function (c) {
      if (c.empId !== emp.id || (c.status !== 'active' && c.status !== 'locked')) return;
      if (req.credId && c.credId !== req.credId) return;
      c.status = 'revoked'; update_(SHEETS.CRED, c);
    });
    emp.tokenVer = Number(emp.tokenVer || 0) + 1;
    var code = setActivation_(emp);
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'device_reset', emp.id, { credId: req.credId ? String(req.credId).slice(0, 12) : 'all' });
    return { ok: true, activationCode: code, expires: emp.actExp };
  });
}

// ---------------- zones ----------------

function api_zoneList() { return { ok: true, rows: readAll_(SHEETS.ZONES).map(publicZone_) }; }

function api_zoneSave(req, me) {
  var d = req.zone || {};
  var lat = Number(d.lat), lng = Number(d.lng), radius = Math.round(Number(d.radius));
  if (!str_(d.name) || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) fail_('bad_zone');
  if (!(radius >= 20 && radius <= 5000)) fail_('bad_radius');
  return withLock_(function () {
    var z = d.id ? findBy_(SHEETS.ZONES, 'id', d.id) : null;
    if (d.id && !z) fail_('not_found');
    var now = new Date().toISOString(), created = !z;
    if (!z) z = { id: newId_('Z'), createdAt: now };
    z.name = str_(d.name, 80); z.nameEn = str_(d.nameEn, 80); z.lat = lat; z.lng = lng; z.radius = radius;
    z.status = d.status === 'disabled' ? 'disabled' : 'active'; z.updatedAt = now;
    if (created) append_(SHEETS.ZONES, z); else update_(SHEETS.ZONES, z);
    audit_(me.id, created ? 'zone_create' : 'zone_update', z.id, { lat: lat, lng: lng, radius: radius, status: z.status });
    return { ok: true, zone: publicZone_(z) };
  });
}

function api_zoneDelete(req, me) {
  return withLock_(function () {
    var z = findBy_(SHEETS.ZONES, 'id', req.id);
    if (!z) fail_('not_found');
    z.status = 'disabled'; z.updatedAt = new Date().toISOString();
    update_(SHEETS.ZONES, z);
    audit_(me.id, 'zone_disable', z.id, null);
    return { ok: true };
  });
}

// ---------------- reports ----------------

function api_report(req, me) {
  var s = settings_(), now = new Date(), today = localParts_(now).date;
  var from = /^\d{4}-\d{2}-\d{2}$/.test(req.from || '') ? req.from : today.slice(0, 8) + '01';
  var to = /^\d{4}-\d{2}-\d{2}$/.test(req.to || '') ? req.to : today;
  if (to > today) to = today;
  if (from > to) fail_('bad_range');
  if ((new Date(to) - new Date(from)) / 86400000 > 92) fail_('range_too_long');
  var emps = readAll_(SHEETS.EMP).filter(function (e) { return (!req.empId || e.id === req.empId) && (e.status === 'active' || req.includeDisabled); });
  var by = {};
  readAll_(SHEETS.PUNCH).forEach(function (p) {
    if (!isCounted_(p) || p.date < from || p.date > to) return;
    var k = p.empId + '|' + p.date;
    (by[k] = by[k] || []).push(p);
  });
  var rows = [], totals = [], off = offIndex_(from, to);
  emps.forEach(function (e) {
    var t = { emp: publicEmp_(e), workedMin: 0, lateMin: 0, earlyMin: 0, overtimeMin: 0, present: 0, absent: 0, lateDays: 0, missingOut: 0, leave: 0 };
    var joined = joinedDate_(e);
    for (var d = from; d <= to; d = addDays_(d, 1)) {
      if (d < joined) continue;
      var ps = (by[e.id + '|' + d] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var sum = summarizeDay_(e, d, ps, s, now, off(e.id, d));
      sum.empId = e.id;
      if (sum.status === 'leave') t.leave++;
      rows.push(sum);
      t.workedMin += sum.workedMin; t.lateMin += sum.lateMin; t.earlyMin += sum.earlyMin; t.overtimeMin += sum.overtimeMin;
      if (sum.firstIn) t.present++;
      if (sum.status === 'absent') t.absent++;
      if (sum.lateMin) t.lateDays++;
      if (sum.status === 'missing_out') t.missingOut++;
    }
    totals.push(t);
  });
  return { ok: true, from: from, to: to, rows: rows, totals: totals };
}

// ---------------- review queue and corrections ----------------

function api_reviewList(req, me) {
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = { name: e.name, empNo: String(e.empNo) }; });
  var want = req.scope === 'rejected' ? 'rejected' : 'review';
  var rows = readAll_(SHEETS.PUNCH).filter(function (p) { return p.status === want; })
    .sort(function (a, b) { return a.ts < b.ts ? 1 : -1; }).slice(0, 200)
    .map(function (p) { var o = publicPunch_(p); o.emp = emps[p.empId] || null; return o; });
  return { ok: true, rows: rows };
}

function api_reviewDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approved' : req.decision === 'reject' ? 'rejected' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var p = findBy_(SHEETS.PUNCH, 'id', req.id);
    if (!p || p.status !== 'review') fail_('not_found');
    if (p.empId === me.id) fail_('cannot_review_self');
    p.status = decision; p.reviewBy = me.id; p.reviewAt = new Date().toISOString();
    if (req.note) p.note = str_(req.note, 200);
    update_(SHEETS.PUNCH, p);
    audit_(me.id, 'review_' + decision, p.id, { empId: p.empId, note: p.note });
    return { ok: true };
  });
}

/** HR correction for a forgotten punch. Always needs a reason, never for oneself. */
function api_manualPunch(req, me) {
  var type = req.type === 'out' ? 'out' : req.type === 'in' ? 'in' : '';
  var reason = str_(req.reason, 200);
  if (!type || !reason) fail_('missing_fields');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date || '') || !isHm_(req.time)) fail_('bad_time');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.empId);
    if (!emp) fail_('not_found');
    if (emp.id === me.id) fail_('cannot_correct_self');
    var ts = new Date(new Date(req.date + 'T' + req.time + ':00Z').getTime() - CONFIG.TZ_OFFSET_MIN * 60000);
    if (ts.getTime() > Date.now()) fail_('future_time');
    var p = { id: newId_('P'), empId: emp.id, type: type, ts: ts.toISOString(), date: req.date, lat: '', lng: '', acc: '',
      zoneId: '', distance: '', status: 'manual', risk: 0, flags: '', source: 'hr:' + me.id, note: reason,
      reviewBy: me.id, reviewAt: new Date().toISOString(), credId: '', ua: '', createdAt: new Date().toISOString() };
    append_(SHEETS.PUNCH, p);
    audit_(me.id, 'manual_punch', p.id, { empId: emp.id, type: type, date: req.date, time: req.time, reason: reason });
    return { ok: true, punch: publicPunch_(p) };
  });
}

// ---------------- settings and audit ----------------

function api_settingsGet() { return { ok: true, settings: settings_() }; }

function api_settingsSave(req, me) {
  var d = req.settings || {};
  var next = settings_();
  if (d.shiftStart !== undefined) { if (!isHm_(d.shiftStart)) fail_('bad_time'); next.shiftStart = d.shiftStart; }
  if (d.shiftEnd !== undefined) { if (!isHm_(d.shiftEnd)) fail_('bad_time'); next.shiftEnd = d.shiftEnd; }
  if (d.graceMin !== undefined) next.graceMin = Math.max(0, Math.min(120, Math.round(Number(d.graceMin) || 0)));
  if (d.workdays !== undefined) { if (!/^[0-6](,[0-6])*$/.test(String(d.workdays))) fail_('bad_request'); next.workdays = String(d.workdays); }
  if (d.maxAccuracy !== undefined) next.maxAccuracy = Math.max(10, Math.min(500, Math.round(Number(d.maxAccuracy) || 100)));
  if (d.minPunchGapMin !== undefined) next.minPunchGapMin = Math.max(0, Math.min(60, Math.round(Number(d.minPunchGapMin) || 0)));
  if (d.reviewRiskThreshold !== undefined) next.reviewRiskThreshold = Math.max(10, Math.min(100, Math.round(Number(d.reviewRiskThreshold) || 40)));
  if (d.allowCheckoutOutside !== undefined) next.allowCheckoutOutside = !!d.allowCheckoutOutside;
  if (d.allowDeviceKey !== undefined) next.allowDeviceKey = !!d.allowDeviceKey;
  if (d.allowDesktop !== undefined) next.allowDesktop = !!d.allowDesktop;
  if (d.allowPasswordPunch !== undefined) next.allowPasswordPunch = !!d.allowPasswordPunch;
  if (d.maxAccuracyDesktop !== undefined) next.maxAccuracyDesktop = Math.max(20, Math.min(1000, Math.round(Number(d.maxAccuracyDesktop) || 150)));
  var bad = hrSettings_(d, next) || companySettings_(d, next);
  if (bad) return { ok: false, error: 'bad_setting', key: bad };
  return withLock_(function () {
    var sh = sheet_(SHEETS.SET);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
    // Text is written as text (toRow_): "06-15", "08:00" or "2027-02-08" must not become dates or times.
    var rows = Object.keys(next).map(function (k) { return toRow_(SHEETS.SET, { key: k, value: next[k] }); });
    sh.getRange(2, 1, rows.length, 2).setValues(rows);
    forget_(SHEETS.SET);
    try { CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY); } catch (e) {}
    audit_(me.id, 'settings_save', '', next);
    return { ok: true, settings: next };
  });
}

/**
 * The company profile (white-label). Names are required and plain text; CR is the 10-digit commercial registration,
 * VAT the 15-digit ZATCA number (starts and ends with 3); both may stay empty. Returns the first bad key, or ''.
 */
var COMPANY_TEXT_ = { companyNameAr: [2, 80], companyNameEn: [2, 80], companyShortAr: [1, 30], companyShortEn: [1, 30], companyAddressAr: [0, 200], companyAddressEn: [0, 200] };
function companySettings_(d, next) {
  for (var k in COMPANY_TEXT_) {
    if (d[k] === undefined) continue;
    var v = String(d[k] == null ? '' : d[k]).replace(/\s+/g, ' ').trim(), lim = COMPANY_TEXT_[k];
    if (v.length < lim[0] || v.length > lim[1] || /[<>]/.test(v)) return k;
    next[k] = v;
  }
  if (d.companyCr !== undefined) { var cr = String(d.companyCr == null ? '' : d.companyCr).trim(); if (cr && !/^\d{10}$/.test(cr)) return 'companyCr'; next.companyCr = cr; }
  if (d.companyVat !== undefined) { var vat = String(d.companyVat == null ? '' : d.companyVat).trim(); if (vat && !/^3\d{13}3$/.test(vat)) return 'companyVat'; next.companyVat = vat; }
  return '';
}
/** What the app shows as the employer on every screen and document. */
function companyOf_(s) {
  return { nameAr: s.companyNameAr, nameEn: s.companyNameEn, shortAr: s.companyShortAr, shortEn: s.companyShortEn, cr: s.companyCr, vat: s.companyVat,
    addressAr: s.companyAddressAr, addressEn: s.companyAddressEn };
}

/**
 * The HR and payroll settings an administrator may set from the settings screen. Each value is checked and
 * written into next; returns '' when all are valid, else the key of the first bad one (nothing is saved then).
 */
var SETTING_BOOLS_ = ['rostersEnabled', 'deductAbsence', 'deductLateMinutes', 'payOvertimeFromAttendance', 'adminSeesPay', 'timesheetRequired', 'notifyDigest', 'attachmentsEnabled'];
function settingBool_(v) { return v === true || v === 'true' ? true : v === false || v === 'false' ? false : null; }
/** 'MM-DD' with a real month and day (02-29 allowed), else ''. */
function settingMmdd_(v) { var m = /^(\d{2})-(\d{2})$/.exec(String(v == null ? '' : v)); return m && ymd_(2024, +m[1], +m[2]) ? m[0] : ''; }
/** 'YYYY-MM-DD' of a real date, or '' for empty; null when unreadable. */
function settingDate_(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDate_(s) === s ? s : null;
}
function hrSettings_(d, next) {
  var k, i, v, n;
  for (i = 0; i < SETTING_BOOLS_.length; i++) {
    k = SETTING_BOOLS_[i];
    if (d[k] === undefined) continue;
    v = settingBool_(d[k]); if (v === null) return k;
    next[k] = v;
  }
  if (d.saudizationTarget !== undefined) {
    v = d.saudizationTarget;
    if (v === '' || v === null) next.saudizationTarget = '';
    else { n = Number(v); if (v === true || v === false || !isFinite(n) || n < 0 || n > 100) return 'saudizationTarget'; next.saudizationTarget = String(Math.round(n * 10) / 10); }
  }
  if (d.ramadanHours !== undefined) {
    n = Number(d.ramadanHours);
    if (d.ramadanHours === '' || !isFinite(n) || n < 1 || n > 6 || Math.round(n * 2) !== n * 2) return 'ramadanHours';
    next.ramadanHours = n;
  }
  // Wave 3 (2026-10-18): permission, overtime and per diem limits
  var W3 = { permissionMaxHours: [1, 8], permissionMonthHours: [1, 40], overtimeYearHours: [1, 2000], perDiemInside: [0, 5000], perDiemAbroad: [0, 10000] };
  for (k in W3) { if (d[k] === undefined) continue; n = Number(d[k]); if (d[k] === '' || d[k] === true || !isFinite(n) || n < W3[k][0] || n > W3[k][1]) return k; next[k] = n; }
  if (d.wpsDueDay !== undefined) {
    n = Number(d.wpsDueDay);
    if (d.wpsDueDay === '' || !isFinite(n) || Math.round(n) !== n || n < 1 || n > 28) return 'wpsDueDay';
    next.wpsDueDay = n;
  }
  if (d.eosWageBasis !== undefined) {
    if (['total', 'basic_housing'].indexOf(d.eosWageBasis) < 0) return 'eosWageBasis';
    next.eosWageBasis = d.eosWageBasis;
  }
  var dates = ['ramadanFrom', 'ramadanTo'];
  for (i = 0; i < dates.length; i++) {
    k = dates[i];
    if (d[k] === undefined) continue;
    v = settingDate_(d[k]); if (v === null) return k;
    next[k] = v;
  }
  if (d.ramadanFrom !== undefined || d.ramadanTo !== undefined) {
    // Both dates or neither; the end on or after the start; one Ramadan (at most 31 days).
    if (!next.ramadanFrom !== !next.ramadanTo) return next.ramadanFrom ? 'ramadanTo' : 'ramadanFrom';
    if (next.ramadanFrom && (next.ramadanTo < next.ramadanFrom || daysBetween_(next.ramadanFrom, next.ramadanTo) > 30)) return 'ramadanTo';
  }
  var mmdd = ['summerBanFrom', 'summerBanTo'];
  for (i = 0; i < mmdd.length; i++) {
    k = mmdd[i];
    if (d[k] === undefined) continue;
    v = settingMmdd_(d[k]); if (!v) return k;
    next[k] = v;
  }
  if ((d.summerBanFrom !== undefined || d.summerBanTo !== undefined) && next.summerBanFrom > next.summerBanTo) return 'summerBanTo'; // one season inside a calendar year
  var hm = ['summerBanStart', 'summerBanEnd'];
  for (i = 0; i < hm.length; i++) {
    k = hm[i];
    if (d[k] === undefined) continue;
    if (!isHm_(d[k])) return k;
    next[k] = String(d[k]);
  }
  if ((d.summerBanStart !== undefined || d.summerBanEnd !== undefined) && hmToMin_(next.summerBanEnd) <= hmToMin_(next.summerBanStart)) return 'summerBanEnd';
  if (d.refPrefixes !== undefined) {
    v = d.refPrefixes;
    if (v === '' || v === null) { next.refPrefixes = ''; return ''; }
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return 'refPrefixes'; } }
    if (!v || typeof v !== 'object' || Array.isArray(v)) return 'refPrefixes';
    var clean = {}, used = {}, kinds = Object.keys(v);
    for (i = 0; i < kinds.length; i++) {
      k = kinds[i];
      if (!REF_DEFAULTS[k] || typeof v[k] !== 'string' || !/^[A-Za-z0-9]{1,6}$/.test(v[k])) return 'refPrefixes';
      clean[k] = v[k].toUpperCase();
    }
    // Two kinds may not share a prefix (their numbers would look alike).
    var all = Object.keys(REF_DEFAULTS);
    for (i = 0; i < all.length; i++) { var p = clean[all[i]] || REF_DEFAULTS[all[i]]; if (used[p]) return 'refPrefixes'; used[p] = 1; }
    next.refPrefixes = Object.keys(clean).length ? JSON.stringify(clean) : '';
  }
  return '';
}

function api_auditList(req, me) {
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e.name; });
  var rows = readAll_(SHEETS.AUDIT).slice(-300).reverse().map(function (a) {
    return { ts: a.ts, actor: emps[a.actorId] || a.actorId, action: a.action, target: emps[a.targetId] || a.targetId, detail: a.detail };
  });
  return { ok: true, rows: rows };
}

/**
 * Roles and permissions overview (2026-10-19, gap list item 10; Jisr 2026 redesigned this screen; rebuilt as our own).
 * Read-only: who holds each role (hr, admin, payroll, executive) and how many people manage a team, plus the latest role
 * changes from the audit trail. Roles are still changed where they always were (employee record, hrRolesSave by admin).
 * HR and admin only. No salary, ID or contact data.
 */
function api_rolesOverview(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var ctx = orgCtx_(), holders = { hr: [], admin: [], payroll: [], executive: [] }, managers = 0, active = 0;
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k]; if (e.status !== 'active') return;
    active++;
    if (e.role === 'hr') holders.hr.push(empCard_(e));
    if (e.role === 'admin') holders.admin.push(empCard_(e));
    if (hasRole_(e, 'payroll')) holders.payroll.push(empCard_(e));
    if (hasRole_(e, 'executive')) holders.executive.push(empCard_(e));
    if (managesAnyone_(e, ctx)) managers++;
  });
  var changes = readAll_(SHEETS.AUDIT).filter(function (a) {
    if (a.action === 'roles_update') return true;
    if (a.action !== 'emp_update' && a.action !== 'emp_create') return false;
    var d = parseJson_(a.detail, {}); return d.role && d.role !== 'employee';
  }).slice(-30).reverse().map(function (a) {
    var d = parseJson_(a.detail, {}), by = ctx.emps[a.actorId], who = ctx.emps[a.targetId];
    return { at: String(a.ts).slice(0, 16).replace('T', ' '), by: by ? by.name : '', who: empCard_(who), action: a.action, role: d.role || '', extraRoles: d.extraRoles == null ? null : String(d.extraRoles) };
  });
  return { ok: true, active: active, managers: managers, holders: holders, changes: changes };
}

/**
 * Full company data export (2026-10-20, PDPL data portability; Jisr offers one). Administrator only, 3 a day, audited.
 * Every tab in HEADERS, as headers + rows, except sign-in secrets: the credentials tab, one-time challenges, and the
 * employee columns holding password and PIN hashes, activation codes and session versions. Salaries, payslips, private
 * data and adjustments go out only when the administrator also holds the payroll role (an administrator alone never sees
 * pay). Anonymous survey answers keep no employee id, as stored.
 */
var EXPORT_SKIP_ = { credentials: 1, challenges: 1 };
var EXPORT_PAY_ = { compensation: 1, payslips: 1, empPrivate: 1, adjustments: 1, payrollRuns: 1, salaryRecon: 1, wpsLog: 1, finalSettlements: 1, compProposals: 1, journalLog: 1, loans: 1 };
var EXPORT_DROP_COLS_ = { pwHash: 1, pwSalt: 1, pwTries: 1, pwLockUntil: 1, actHash: 1, actExp: 1, actTries: 1, tokenVer: 1, pinHash: 1, pinSalt: 1, votersJson: 1 };
function api_dataExport(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  if (!rateLimit_('export:' + me.id, 3, 86400)) fail_('too_many_attempts');
  var pay = hasRole_(me, 'payroll'), out = {}, skipped = [];
  Object.keys(HEADERS).forEach(function (tab) {
    if (EXPORT_SKIP_[tab]) { skipped.push(tab); return; }
    if (EXPORT_PAY_[tab] && !pay) { skipped.push(tab); return; }
    var cols = HEADERS[tab].filter(function (h) { return !EXPORT_DROP_COLS_[h]; }), rows;
    try { rows = readAll_(tab); } catch (e) { return; }
    out[tab] = { headers: cols, rows: rows.map(function (r) { return cols.map(function (h) { var v = r[h]; return v instanceof Date ? v.toISOString() : v == null ? '' : v; }); }) };
  });
  audit_(me.id, 'data_export', '', { tabs: Object.keys(out).length, skipped: skipped, withPay: pay });
  return { ok: true, at: new Date().toISOString(), company: companyOf_(settings_()), tabs: out, skipped: skipped, withPay: pay };
}
