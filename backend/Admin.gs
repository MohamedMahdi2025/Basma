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
    try { cache_().remove(SETTINGS_CACHE_KEY); } catch (e) {}
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
  return { orgId: orgId_(), home: !!(!ORG_ || ORG_.home), logoVer: logoVer_(), brandColor: brandColor_(), nameAr: s.companyNameAr, nameEn: s.companyNameEn, shortAr: s.companyShortAr, shortEn: s.companyShortEn, cr: s.companyCr, vat: s.companyVat,
    addressAr: s.companyAddressAr, addressEn: s.companyAddressEn };
}

/**
 * The HR and payroll settings an administrator may set from the settings screen. Each value is checked and
 * written into next; returns '' when all are valid, else the key of the first bad one (nothing is saved then).
 */
var SETTING_BOOLS_ = ['rostersEnabled', 'deductAbsence', 'deductLateMinutes', 'payOvertimeFromAttendance', 'adminSeesPay', 'timesheetRequired', 'notifyDigest', 'attachmentsEnabled', 'aiAssistant', 'whatsappDigest'];
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


// ======================================================================= public API and webhooks (2026-10-22)
// docs/research/2026-10-22-api-webhooks-design.md. Per organisation (its own tabs in its own book):
// - API keys: read-only, scoped, shown once, stored as SHA-256. POST {action:'apiQuery', orgId, apiKey, resource, ...}
//   or GET ?org=&key=&resource=&format=json|csv (Power BI / Excel, which cannot send headers). Every call is audited.
// - Webhooks: HTTPS endpoints (no private addresses) subscribed to events; each delivery is signed
//   X-HRIS-Signature: sha256=HMAC(secret, timestamp + '.' + body). The secret is derived, never stored; shown once.
//   Events are captured at the data layer (append_/update_) into tab webhookOutbox and delivered lazily after write
//   requests, with retries (1, 2, 4 … minutes, 8 attempts). Salaries and private data are never in an API answer or event.
var API_SCOPES_ = { employees: 1, org: 1, attendance: 1, leave: 1, payroll: 1, device: 1 };
var API_RESOURCES_ = { employees: 'employees', departments: 'org', positions: 'org', attendance: 'attendance', leave: 'leave', payrollRuns: 'payroll', journal: 'payroll' };
var WH_EVENTS_ = { 'employee.created': 1, 'employee.updated': 1, 'employee.left': 1, 'leave.approved': 1, 'attendance.punch': 1, 'payroll.locked': 1, 'ping': 1 };
var API_PAGE_ = 500;

function apiKeyParse_(k) { var m = /^hrk_([A-Za-z0-9_-]{6,20})_([A-Za-z0-9_-]{20,64})$/.exec(String(k || '')); return m ? { id: m[1], secret: m[2] } : null; }
function api_apiKeyList(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  return { ok: true, rows: readAll_(SHEETS.APIKEY).filter(function (x) { return x.status !== 'deleted'; }).map(function (x) {
    return { id: x.id, keyId: x.keyId, label: x.label, scopes: parseJson_(x.scopesJson, []), status: x.status, createdAt: x.createdAt, lastUsedAt: x.lastUsedAt, uses: Number(x.uses) || 0 }; }),
    hooks: readAll_(SHEETS.HOOK).filter(function (x) { return x.status !== 'deleted'; }).map(publicHook_), events: Object.keys(WH_EVENTS_).filter(function (e) { return e !== 'ping'; }),
    scopes: Object.keys(API_SCOPES_), orgId: orgId_() };
}
/** Administrator: a new key (shown once) or { id, revoke }. */
function api_apiKeySave(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  return withLock_(function () {
    if (req.id) {
      var x = findBy_(SHEETS.APIKEY, 'id', String(req.id)); if (!x) fail_('not_found');
      x.status = 'revoked'; update_(SHEETS.APIKEY, x); audit_(me.id, 'api_key_revoke', '', { keyId: x.keyId }); return { ok: true };
    }
    var scopes = (req.scopes || []).filter(function (s) { return API_SCOPES_[s]; });
    if (!scopes.length || !str_(req.label, 80)) fail_('missing_fields');
    if (readAll_(SHEETS.APIKEY).filter(function (k) { return k.status === 'active'; }).length >= 20) fail_('too_many');
    var keyId = bytesToB64u_(randomBytes_(6)).replace(/[^A-Za-z0-9]/g, 'x'), secret = bytesToB64u_(randomBytes_(24)).replace(/[^A-Za-z0-9]/g, 'x');
    append_(SHEETS.APIKEY, { id: newId_('K'), keyId: keyId, label: str_(req.label, 80), scopesJson: JSON.stringify(scopes), hash: sha256Hex_(secret), status: 'active', createdBy: me.id, createdAt: new Date().toISOString(), lastUsedAt: '', uses: 0 });
    audit_(me.id, 'api_key_create', '', { keyId: keyId, scopes: scopes.join(',') });
    return { ok: true, key: 'hrk_' + keyId + '_' + secret, orgId: orgId_() };
  });
}
/** The integration's request: one resource, one page; read-only. */
function api_apiQuery(req) {
  var p = apiKeyParse_(req.apiKey);
  if (!p) fail_('bad_api_key');
  if (!rateLimit_('apikey:' + p.id, 120, 60)) fail_('too_many_attempts');
  var k = findBy_(SHEETS.APIKEY, 'keyId', p.id);
  if (!k || k.status !== 'active' || !safeEqual_(sha256Hex_(p.secret), k.hash)) { rateLimit_('apibad', 1000, 600); fail_('bad_api_key'); }
  var res = String(req.resource || ''), need = API_RESOURCES_[res];
  if (!need) fail_('unknown_resource');
  if (parseJson_(k.scopesJson, []).indexOf(need) < 0) fail_('scope_missing');
  var rows = API_FNS_[res](req), page = Math.max(1, Math.floor(Number(req.page) || 1)), total = rows.length;
  rows = rows.slice((page - 1) * API_PAGE_, page * API_PAGE_);
  try { withLock_(function () { var x = findBy_(SHEETS.APIKEY, 'id', k.id); x.lastUsedAt = new Date().toISOString(); x.uses = (Number(x.uses) || 0) + 1; update_(SHEETS.APIKEY, x); audit_('api:' + k.keyId, 'api_query', '', { resource: res, rows: rows.length, page: page }); }); } catch (e) {}
  return { ok: true, orgId: orgId_(), resource: res, page: page, pageSize: API_PAGE_, total: total, hasMore: page * API_PAGE_ < total, rows: rows };
}
function apiRange_(req, max) {
  var t = today_(), to = isoDate_(req.to) || addDays_(t, -1), from = isoDate_(req.from) || to.slice(0, 8) + '01';
  if (from > to || daysBetween_(from, to) >= max) fail_('range_too_long');
  return { from: from, to: to };
}
var API_FNS_ = {
  employees: function (req) {
    var ctx = orgCtx_(), since = String(req.updatedSince || '');
    return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return !since || String(e.updatedAt || e.createdAt) >= since; }).map(function (e) {
      var d = ctx.depts[e.departmentId], m = ctx.emps[e.managerId];
      return { id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn || '', email: e.email || '', status: e.status, departmentId: e.departmentId || '', department: d ? d.nameAr : (e.department || ''),
        positionId: e.positionId || '', title: e.title || '', managerEmpNo: m ? String(m.empNo) : '', hireDate: isoDate_(e.hireDate) || '', lastWorkingDay: isoDate_(e.lastWorkingDay) || '',
        contractType: e.contractType || '', payGroupId: String(e.payGroupId || ''), updatedAt: e.updatedAt || e.createdAt || '' };
    });
  },
  departments: function () { return readAll_(SHEETS.DEPT).map(function (d) { return { id: d.id, nameAr: d.nameAr, nameEn: d.nameEn || '', parentId: d.parentId || '', status: d.status || 'active' }; }); },
  positions: function () { return readAll_(SHEETS.POS).map(function (x) { return { id: x.id, code: x.code || '', titleAr: x.titleAr || '', titleEn: x.titleEn || '', departmentId: x.departmentId || '', grade: String(x.grade || '') }; }); },
  attendance: function (req) {
    var r = apiRange_(req, 31), ctx = orgCtx_(), emps = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; });
    var days = daysFor_(emps, r.from, r.to, settings_()), out = [];
    emps.forEach(function (e) { (days[e.id] || []).forEach(function (x) { if (!x) return;
      out.push({ empNo: String(e.empNo), date: x.date, status: x.status, firstIn: x.firstIn || '', lastOut: x.lastOut || '', workedMin: x.workedMin || 0, lateMin: x.lateMin || 0, overtimeMin: x.overtimeMin || 0 }); }); });
    return out;
  },
  leave: function (req) {
    var r = apiRange_(req, 366), ctx = orgCtx_();
    return readAll_(SHEETS.REQ).filter(function (x) { return x.type === 'leave' && x.status === 'approved' && String(x.toDate).slice(0, 10) >= r.from && String(x.fromDate).slice(0, 10) <= r.to; }).map(function (x) {
      var e = ctx.emps[x.empId] || {}; return { ref: x.ref, empNo: String(e.empNo || ''), subtype: x.subtype, fromDate: String(x.fromDate).slice(0, 10), toDate: String(x.toDate).slice(0, 10), days: Number(x.days) || 0 };
    });
  },
  payrollRuns: function () {
    return readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'locked' && !isDemoRun_(r) && !pgManagers_(payGroups_()[String(r.payGroupId || '')]).length; }).map(function (r) {
      var t = parseJson_(r.totalsJson, {}); return { id: r.id, ref: r.ref, month: r.month, payGroupId: String(r.payGroupId || ''), approvedAt: r.approvedAt, headcount: t.headcount, gross: t.gross, deductions: t.deductions, net: t.net, gosiEmployer: t.gosiEmployer };
    });
  },
  journal: function (req) { // the accounting entry of a locked run, as built for Odoo (Journal.gs); totals by account, no person's pay
    var run = findBy_(SHEETS.RUN, 'id', String(req.runId || ''));
    if (!run || run.status !== 'locked' || isDemoRun_(run) || pgManagers_(payGroups_()[String(run.payGroupId || '')]).length) fail_('not_found');
    var j = journalOf_(run);
    var g = {}; // lines per employee (net per person, advances) are added up per account: no person's pay leaves through the API
    (j.lines || []).forEach(function (l) { var k = [l.account, l.analytic, l.labelKey].join('|'), x = g[k] = g[k] || { runRef: run.ref, month: run.month, date: j.date, account: l.account || '', analytic: l.analytic || '', label: l.labelKey || l.key || '', debit: 0, credit: 0 }; x.debit = r2_(x.debit + (l.debit || 0)); x.credit = r2_(x.credit + (l.credit || 0)); });
    return Object.keys(g).map(function (k) { return g[k]; });
  }
};

// ---------------- webhooks ----------------

function whSecret_(h) { return 'whsec_' + hmac_('webhook|' + orgId_() + '|' + h.id + '|' + (Number(h.ver) || 1)); }
function publicHook_(h) { return { id: h.id, url: h.url, events: parseJson_(h.eventsJson, []), status: h.status, createdAt: h.createdAt, lastStatus: h.lastStatus || '', lastAt: h.lastAt || '', fails: Number(h.fails) || 0 }; }
/** https only, and never an address inside a network (SSRF). */
function whUrlOk_(u) {
  var m = /^https:\/\/([^\/:?#]+)(:\d+)?(\/[^\s]*)?$/i.exec(String(u || ''));
  if (!m) return false;
  var host = m[1].toLowerCase();
  if (/^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/.test(host)) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(host)) return false;
  if (/^\[/.test(host) || /:/.test(host)) return false;
  return true;
}
/** Administrator: add a webhook (its secret shown once), change its events, rotate its secret, pause, delete, or send a test. */
function api_webhookSave(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  return withLock_(function () {
    var now = new Date().toISOString(), h = req.id ? findBy_(SHEETS.HOOK, 'id', String(req.id)) : null;
    if (req.id && (!h || h.status === 'deleted')) fail_('not_found');
    if (h && req.test) { whQueue_(h, 'ping', { message: 'test', at: now }, 'ping:' + now); cache_().remove('wh:next'); return { ok: true }; }
    if (h && (req.pause || req.resume || req.remove)) { h.status = req.remove ? 'deleted' : req.pause ? 'paused' : 'active'; if (req.resume) h.fails = 0; update_(SHEETS.HOOK, h); cache_().remove('wh:subs'); return { ok: true }; }
    var events = (req.events || []).filter(function (e) { return WH_EVENTS_[e] && e !== 'ping'; });
    if (!events.length) fail_('missing_fields');
    var row = h || { id: newId_('W'), ver: 0, status: 'active', createdBy: me.id, createdAt: now, lastStatus: '', lastAt: '', fails: 0 };
    if (!h || req.url) { if (!whUrlOk_(req.url)) fail_('bad_url'); row.url = String(req.url).trim(); }
    row.eventsJson = JSON.stringify(events);
    var showSecret = !h || req.rotate;
    if (showSecret) row.ver = (Number(row.ver) || 0) + 1;
    if (h) update_(SHEETS.HOOK, row); else append_(SHEETS.HOOK, row);
    cache_().remove('wh:subs');
    audit_(me.id, h ? 'webhook_change' : 'webhook_create', '', { url: row.url, events: events.join(',') });
    var out = { ok: true, hook: publicHook_(row) };
    if (showSecret) out.secret = whSecret_(row);
    return out;
  });
}
function api_webhookDeliveries(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  return { ok: true, rows: readAll_(SHEETS.WHOUT).filter(function (x) { return !req.hookId || x.hookId === req.hookId; }).slice(-100).reverse().map(function (x) {
    return { id: x.id, hookId: x.hookId, event: x.event, status: x.status, attempts: Number(x.attempts) || 0, lastCode: x.lastCode, lastError: x.lastError, createdAt: x.createdAt, sentAt: x.sentAt };
  }) };
}
/** Which events have an active subscriber (cached; most requests stop here). */
function whSubs_() {
  var c = cache_(), hit = c.get('wh:subs'); if (hit) return JSON.parse(hit);
  var o = {}; readAll_(SHEETS.HOOK).forEach(function (h) { if (h.status === 'active') parseJson_(h.eventsJson, []).forEach(function (e) { (o[e] = o[e] || []).push(h.id); }); });
  c.put('wh:subs', JSON.stringify(o), 600);
  return o;
}
function whQueue_(h, event, data, dedupe) {
  append_(SHEETS.WHOUT, { id: newId_('D'), hookId: h.id, event: event, dedupe: dedupe || '', payloadJson: JSON.stringify({ id: '', event: event, orgId: orgId_(), createdAt: new Date().toISOString(), data: data }),
    status: 'pending', attempts: 0, nextAt: new Date().toISOString(), lastCode: '', lastError: '', createdAt: new Date().toISOString(), sentAt: '' });
}
var WH_TAPPING_ = false;
/** The data layer tells us what was written; a few writes become events. Never throws into the caller. */
function whTap_(tab, o, isNew) {
  if (WH_TAPPING_ || !o) return;
  if (tab !== SHEETS.EMP && tab !== SHEETS.REQ && tab !== SHEETS.PUNCH && tab !== SHEETS.RUN) return;
  try {
    WH_TAPPING_ = true;
    var subs = whSubs_(), ev = [], c = cache_();
    if (!Object.keys(subs).length) return; // no webhook: nothing to do (most organisations, most requests)
    if (tab === SHEETS.EMP) {
      var pub = { id: o.id, empNo: String(o.empNo), name: o.name, nameEn: o.nameEn || '', email: o.email || '', status: o.status, departmentId: o.departmentId || '', positionId: o.positionId || '', title: o.title || '',
        managerId: String(o.managerId || ''), hireDate: isoDate_(o.hireDate) || '', lastWorkingDay: isoDate_(o.lastWorkingDay) || '' };
      var sig = sha256Hex_(JSON.stringify(pub)), key = 'wh:emp:' + o.id;
      if (isNew) ev.push(['employee.created', pub, 'emp:' + o.id + ':new']);
      else if (c.get(key) !== sig) { ev.push([o.status === 'active' ? 'employee.updated' : 'employee.left', pub, 'emp:' + o.id + ':' + sig]); }
      c.put(key, sig, 21600);
    } else if (tab === SHEETS.REQ && o.type === 'leave' && o.status === 'approved') {
      ev.push(['leave.approved', { ref: o.ref, empId: o.empId, subtype: o.subtype, fromDate: String(o.fromDate).slice(0, 10), toDate: String(o.toDate).slice(0, 10), days: Number(o.days) || 0 }, 'req:' + o.id + ':approved']);
    } else if (tab === SHEETS.PUNCH && isNew) {
      ev.push(['attendance.punch', { id: o.id, empId: o.empId, type: o.type, ts: o.ts, date: String(o.date).slice(0, 10), status: o.status, zoneId: o.zoneId || '' }, 'punch:' + o.id]);
    } else if (tab === SHEETS.RUN && o.status === 'locked' && !isDemoRun_(o) && !pgManagers_(payGroups_()[String(o.payGroupId || '')]).length) {
      var t = parseJson_(o.totalsJson, {});
      ev.push(['payroll.locked', { id: o.id, ref: o.ref, month: o.month, payGroupId: String(o.payGroupId || ''), headcount: t.headcount, net: t.net, gross: t.gross }, 'run:' + o.id + ':locked']);
    }
    ev.forEach(function (x) {
      var hs = subs[x[0]] || []; if (!hs.length) return;
      var seen = {}; if (/^(req|run|emp):/.test(x[2])) readAll_(SHEETS.WHOUT).forEach(function (d) { if (d.dedupe) seen[d.hookId + '|' + d.dedupe] = 1; });
      hs.forEach(function (hid) { if (!seen[hid + '|' + x[2]]) whQueue_({ id: hid }, x[0], x[1], x[2]); });
      c.remove('wh:next');
    });
  } catch (e) { console.error('webhook tap: ' + (e && e.message)); } finally { WH_TAPPING_ = false; }
}
/** Lazy delivery after write requests: up to 5 due deliveries, signed, with backoff; 8 failures make it dead. */
function whSweep_() {
  try {
    var c = cache_(), next = c.get('wh:next'), now = new Date();
    if (next && next > now.toISOString()) return;
    if (!rateLimit_('wh:run', 1, 10)) return;
    var hooks = {}; readAll_(SHEETS.HOOK).forEach(function (h) { hooks[h.id] = h; });
    var all = readAll_(SHEETS.WHOUT).filter(function (d) { return d.status === 'pending'; });
    var due = all.filter(function (d) { return String(d.nextAt) <= now.toISOString(); }).slice(0, 5), done = [], hookUpd = {};
    due.forEach(function (d) {
      var h = hooks[d.hookId];
      if (!h || h.status !== 'active') { d.status = 'skipped'; done.push(d); return; }
      var pl = parseJson_(d.payloadJson, {}); pl.id = d.id; var body = JSON.stringify(pl), ts = String(Math.floor(now.getTime() / 1000));
      var sig = Utilities.computeHmacSha256Signature(ts + '.' + body, whSecret_(h)).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
      var code = 0, err = '';
      try {
        var r = UrlFetchApp.fetch(h.url, { method: 'post', contentType: 'application/json', payload: body, muteHttpExceptions: true, followRedirects: false,
          headers: { 'X-HRIS-Event': d.event, 'X-HRIS-Delivery': d.id, 'X-HRIS-Timestamp': ts, 'X-HRIS-Signature': 'sha256=' + sig, 'X-HRIS-Org': orgId_() } });
        code = r.getResponseCode();
      } catch (e) { err = String(e && e.message || e).slice(0, 200); }
      d.attempts = (Number(d.attempts) || 0) + 1; d.lastCode = code; d.lastError = err;
      if (code >= 200 && code < 300) { d.status = 'sent'; d.sentAt = now.toISOString(); hookUpd[h.id] = 'ok'; }
      else { d.status = d.attempts >= 8 ? 'dead' : 'pending'; d.nextAt = new Date(now.getTime() + Math.pow(2, d.attempts - 1) * 60000).toISOString(); hookUpd[h.id] = hookUpd[h.id] === 'ok' ? 'ok' : 'fail:' + (code || 'network'); }
      done.push(d);
    });
    withLock_(function () {
      done.forEach(function (d) { update_(SHEETS.WHOUT, d); });
      Object.keys(hookUpd).forEach(function (id) { var h = findBy_(SHEETS.HOOK, 'id', id); if (!h) return; h.lastStatus = hookUpd[id]; h.lastAt = now.toISOString(); h.fails = hookUpd[id] === 'ok' ? 0 : (Number(h.fails) || 0) + 1; update_(SHEETS.HOOK, h); });
    });
    var rest = all.filter(function (d) { return done.indexOf(d) < 0 || d.status === 'pending'; }).map(function (d) { return String(d.nextAt); }).sort()[0];
    if (rest) c.put('wh:next', rest, 3600); else c.put('wh:next', new Date(now.getTime() + 3600000).toISOString(), 3600);
  } catch (e) { console.error('webhooks: ' + (e && e.message)); }
}


// ======================================================================= company logo (SaaS branding, 2026-10-22)
// Every organisation shows its OWN logo in the same unified design: the 3D medallion, the splash, the gate, the sidebar and
// every printed document. Stored in the organisation's own tab `branding` (never in settings: a settings save rewrites
// that tab). The app gets only a short version string with every payload and fetches the image once per version.
// PNG, JPEG or WebP only (no SVG: no script can ride in), at most 48,000 characters as a data URL (a Sheets cell holds 50,000);
// the app resizes the upload to 512 px before sending.
var LOGO_MAX_ = 48000;
function brandRow_(key) { return readAll_(SHEETS.BRAND).filter(function (x) { return x.key === key; })[0] || null; }
function logoVer_() { var c = cache_(), v = c.get('logo:ver'); if (v !== null && v !== undefined) return v; var r = brandRow_('logoVer'); v = r ? String(r.value) : ''; c.put('logo:ver', v, 21600); return v; }
/** Public: the organisation's logo (the sign-in screen needs it before anyone signs in). */
function api_orgLogo() {
  var r = brandRow_('logo');
  return { ok: true, orgId: orgId_(), ver: logoVer_(), logo: r ? String(r.value) : '', home: !!(ORG_ && ORG_.home) };
}
/** Administrator: set or remove the logo. */
function api_logoSave(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  var logo = String(req.logo || '');
  if (logo && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(logo) || logo.length > LOGO_MAX_)) fail_('bad_logo');
  return withLock_(function () {
    var now = new Date().toISOString(), ver = logo ? sha256Hex_(logo).slice(0, 12) : '';
    [['logo', logo], ['logoVer', ver]].forEach(function (kv) {
      var r = brandRow_(kv[0]);
      if (r) { r.value = kv[1]; r.updatedAt = now; r.updatedBy = me.id; update_(SHEETS.BRAND, r); }
      else append_(SHEETS.BRAND, { key: kv[0], value: kv[1], updatedAt: now, updatedBy: me.id });
    });
    cache_().put('logo:ver', ver, 21600);
    audit_(me.id, logo ? 'logo_set' : 'logo_remove', '', { ver: ver, size: logo.length });
    return { ok: true, ver: ver };
  });
}
/** The organisation's brand colour ('' = the default palette). Cached like the logo version. */
function brandColor_() { var c = cache_(), v = c.get('brand:color'); if (v !== null && v !== undefined) return v; var r = brandRow_('color'); v = r ? String(r.value) : ''; c.put('brand:color', v, 21600); return v; }
/** Administrator: the brand colour the whole palette is drawn from (#RRGGBB, or '' for the default). */
function api_brandSave(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  var color = String(req.color || '').toUpperCase();
  if (color && !/^#[0-9A-F]{6}$/.test(color)) fail_('bad_value');
  return withLock_(function () {
    var r = brandRow_('color'), now = new Date().toISOString();
    if (r) { r.value = color; r.updatedAt = now; r.updatedBy = me.id; update_(SHEETS.BRAND, r); } else append_(SHEETS.BRAND, { key: 'color', value: color, updatedAt: now, updatedBy: me.id });
    cache_().put('brand:color', color, 21600);
    audit_(me.id, 'brand_color', '', { color: color });
    return { ok: true, color: color };
  });
}


// ======================================================================= single sign-on (2026-10-23)
// "Sign in with Google" / "Sign in with Microsoft" beside the employee number. The provider proves the e-mail address; the
// employee is the active record with that e-mail in this organisation. The session is the same kind as a password session
// (check-in still needs the device passkey or the PIN). Off until the client ID is in Script properties:
//   Google:    SSO_GOOGLE_CLIENT_ID (and optionally SSO_GOOGLE_DOMAIN: only accounts of that Workspace domain)
//   Microsoft: SSO_MS_CLIENT_ID and SSO_MS_TENANT (the Entra tenant ID; only accounts of that tenant)
// Each may also be set per organisation with the 'o<id>:' prefix. Client IDs are public; there is no secret to keep.
function ssoProp_(k) { var p = PropertiesService.getScriptProperties(); return p.getProperty(orgKey_(k)) || p.getProperty(k) || ''; }
function ssoPublic_() {
  var g = ssoProp_('SSO_GOOGLE_CLIENT_ID'), m = ssoProp_('SSO_MS_CLIENT_ID'), t = ssoProp_('SSO_MS_TENANT');
  return { google: g || '', microsoft: m && t ? { clientId: m, tenant: t } : null };
}
function ssoJwtPayload_(tok) {
  var part = String(tok || '').split('.')[1];
  if (!part) return null;
  try { return JSON.parse(bytesToUtf8_(b64uToBytes_(part))); } catch (e) { return null; }
}
/** The verified e-mail behind a Google ID token, checked by Google's tokeninfo endpoint (signature, expiry), then audience. */
function ssoGoogleEmail_(idToken) {
  var cid = ssoProp_('SSO_GOOGLE_CLIENT_ID'); if (!cid) fail_('sso_not_configured');
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) fail_('sso_failed');
  var j = JSON.parse(r.getContentText()), dom = ssoProp_('SSO_GOOGLE_DOMAIN');
  if (j.aud !== cid || (j.iss !== 'accounts.google.com' && j.iss !== 'https://accounts.google.com') || String(j.email_verified) !== 'true' || Number(j.exp) * 1000 < Date.now()) fail_('sso_failed');
  if (dom && j.hd !== dom) fail_('sso_failed');
  return String(j.email || '').toLowerCase();
}
/**
 * The e-mail behind a Microsoft access token for Graph. Graph itself checks the signature and expiry when it answers /me;
 * the token's own claims (trusted once Graph accepted it) must name our app and our tenant, so a token issued to another
 * app cannot be replayed here.
 */
function ssoMicrosoftEmail_(accessToken) {
  var cid = ssoProp_('SSO_MS_CLIENT_ID'), tid = ssoProp_('SSO_MS_TENANT'); if (!cid || !tid) fail_('sso_not_configured');
  var r = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + accessToken } });
  if (r.getResponseCode() !== 200) fail_('sso_failed');
  var c = ssoJwtPayload_(accessToken);
  if (!c || (c.appid || c.azp) !== cid || c.tid !== tid) fail_('sso_failed');
  var j = JSON.parse(r.getContentText());
  return String(j.mail || j.userPrincipalName || '').toLowerCase();
}
function api_ssoLogin(req) {
  if (!rateLimit_('sso', 120, 600)) fail_('too_many_attempts');
  var prov = String(req.provider || ''), cred = String(req.credential || '');
  if (!cred || cred.length > 8000) fail_('missing_fields');
  var email = prov === 'google' ? ssoGoogleEmail_(cred) : prov === 'microsoft' ? ssoMicrosoftEmail_(cred) : fail_('bad_value');
  if (!email) fail_('sso_failed');
  return withLock_(function () {
    var hits = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active' && String(e.email || '').trim().toLowerCase() === email; });
    if (hits.length !== 1) { audit_('', 'sso_no_match', '', { provider: prov, matches: hits.length }); fail_('sso_no_account'); } // two records with one e-mail: refuse, never guess
    var emp = hits[0];
    audit_(emp.id, 'login_sso', emp.id, { provider: prov });
    return { ok: true, token: issueToken_(emp, 'pw'), me: publicEmp_(emp), home: homePayload_(emp, true), mustChange: false, sso: prov };
  });
}

// ======================================================================= punches from devices (2026-10-23)
// Fingerprint or face terminals (or their vendor cloud) POST punches here with an API key that has the 'device' scope
// (Administration > Integrations). The terminal has already identified the person, so these punches count (status ok,
// source device, flagged 'device'). Re-sending the same punch is harmless (same person + same minute = skipped).
var DEVICE_BATCH_ = 200;
function devTs_(v) {
  var s = String(v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) s = s.replace(' ', 'T') + (s.length === 16 ? ':00' : '') + '+03:00'; // device local time is Riyadh
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function api_devicePunch(req) {
  var p = apiKeyParse_(req.apiKey);
  if (!p) fail_('bad_api_key');
  if (!rateLimit_('apikey:' + p.id, 120, 60)) fail_('too_many_attempts');
  var k = findBy_(SHEETS.APIKEY, 'keyId', p.id);
  if (!k || k.status !== 'active' || !safeEqual_(sha256Hex_(p.secret), k.hash)) { rateLimit_('apibad', 1000, 600); fail_('bad_api_key'); }
  if (parseJson_(k.scopesJson, []).indexOf('device') < 0) fail_('scope_missing');
  var ev = Array.isArray(req.events) ? req.events : [];
  if (!ev.length || ev.length > DEVICE_BATCH_) fail_('bad_value');
  var s = settings_(), zones = {};
  readAll_(SHEETS.ZONES).forEach(function (z) { zones[z.id] = z; });
  return withLock_(function () {
    var emps = {}; readAll_(SHEETS.EMP).forEach(function (e) { if (e.status === 'active') emps[String(e.empNo)] = e; });
    var all = readAll_(SHEETS.PUNCH), seen = {}, mine = {};
    all.forEach(function (x) { if (!isCounted_(x)) return; seen[x.empId + '|' + String(x.ts).slice(0, 16)] = 1; (mine[x.empId] = mine[x.empId] || []).push(x); });
    var rows = [], out = { added: 0, duplicate: 0, unknown: [], bad: 0 }, now = new Date().toISOString();
    ev.map(function (e) { return { e: e, d: devTs_(e && e.ts) }; }).sort(function (a, b) { return (a.d ? a.d.getTime() : 0) - (b.d ? b.d.getTime() : 0); }).forEach(function (x) {
      var e = x.e || {}, d = x.d, emp = emps[String(e.empNo || '').trim()];
      if (!d || d.getTime() > Date.now() + 5 * 60000) { out.bad++; return; }
      if (!emp) { if (out.unknown.indexOf(String(e.empNo)) < 0 && out.unknown.length < 50) out.unknown.push(String(e.empNo || '')); return; }
      var iso = d.toISOString(), key = emp.id + '|' + iso.slice(0, 16);
      if (seen[key]) { out.duplicate++; return; }
      var date = workDate_(emp, d, s), list = (mine[emp.id] || []).filter(function (y) { return y.date === date; }).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var type = e.type === 'in' || e.type === 'out' ? e.type : list.length && list[list.length - 1].type === 'in' ? 'out' : 'in';
      var zid = e.zoneId && zones[e.zoneId] ? e.zoneId : '';
      var row = { id: newId_('P'), empId: emp.id, type: type, ts: iso, date: date, lat: '', lng: '', acc: '', zoneId: zid, distance: '', status: 'ok', risk: 0, flags: 'device',
        source: 'device', note: str_(e.deviceId, 60), reviewBy: '', reviewAt: '', credId: '', ua: 'device:' + k.keyId, createdAt: now };
      rows.push(row); seen[key] = 1; (mine[emp.id] = mine[emp.id] || []).push(row); out.added++;
    });
    if (rows.length) appendMany_(SHEETS.PUNCH, rows);
    var x = findBy_(SHEETS.APIKEY, 'id', k.id); x.lastUsedAt = now; x.uses = (Number(x.uses) || 0) + 1; update_(SHEETS.APIKEY, x);
    audit_('api:' + k.keyId, 'device_punch', '', { added: out.added, duplicate: out.duplicate, unknown: out.unknown.length, bad: out.bad });
    out.ok = true; return out;
  });
}
