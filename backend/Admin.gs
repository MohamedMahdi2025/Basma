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
  var emps = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active'; });
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
  return withLock_(function () {
    var sh = sheet_(SHEETS.SET);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
    var rows = Object.keys(next).map(function (k) { return [k, String(next[k])]; });
    sh.getRange(2, 1, rows.length, 2).setValues(rows);
    forget_(SHEETS.SET);
    try { CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY); } catch (e) {}
    audit_(me.id, 'settings_save', '', next);
    return { ok: true, settings: next };
  });
}

function api_auditList(req, me) {
  var emps = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e.name; });
  var rows = readAll_(SHEETS.AUDIT).slice(-300).reverse().map(function (a) {
    return { ts: a.ts, actor: emps[a.actorId] || a.actorId, action: a.action, target: emps[a.targetId] || a.targetId, detail: a.detail };
  });
  return { ok: true, rows: rows };
}
