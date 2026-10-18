/**
 * Shifts and rosters (gap study item 9), 2026-09-30. Hooked into summarizeDay_ (Attendance.gs) through adjustShift_; tests/shifts.js.
 *  - Named shifts (start, end, workdays, outdoor flag) and roster assignments per person and date range. With the
 *    setting rostersEnabled off (default) nothing is read and attendance keeps each person's own shift.
 *  - Ramadan (Labour Law Art. 98): between settings ramadanFrom and ramadanTo, a Muslim employee's day is at most
 *    ramadanHours (6); the shift end moves earlier. Employees marked ramadanReduced = no are not reduced.
 *  - Summer midday ban on outdoor work (15 Jun - 15 Sep, 12:00-15:00): an outdoor shift overlapping it is reported.
 *    Dates and hours are settings; verify them with HRSD each year.
 *  - Shifts that cross midnight are refused for now: the day summary groups punches by calendar day.
 */

function hm_(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

function rosterFor_(empId, date) {
  var hit = null;
  readAll_(SHEETS.ROSTER).some(function (r) {
    if (r.status !== 'active' || r.empId !== empId || String(r.fromDate).slice(0, 10) > date || String(r.toDate).slice(0, 10) < date) return false;
    hit = r; return true;
  });
  if (!hit) return null;
  var sh = findBy_(SHEETS.SHIFT, 'id', hit.shiftId);
  return sh && sh.status !== 'disabled' ? sh : null;
}

function ramadanHours_(emp, date, s) {
  if (!s.ramadanFrom || !s.ramadanTo || date < String(s.ramadanFrom).slice(0, 10) || date > String(s.ramadanTo).slice(0, 10)) return 0;
  if (String(emp.ramadanReduced || '').toLowerCase() === 'no' || emp.ramadanReduced === false) return 0;
  return Math.max(1, Number(s.ramadanHours) || 6);
}

/** Applied to a shift from shiftOf_: roster first, then the Ramadan cap. */
function adjustShift_(emp, sh, s, date) {
  if (!date) return sh;
  if (s.rostersEnabled === true || String(s.rostersEnabled) === 'true') {
    var r = rosterFor_(emp.id, date);
    if (r) sh = { start: String(r.start), end: String(r.end), workdays: String(r.workdays || sh.workdays.join(',')).split(',').map(Number), grace: sh.grace, shiftId: r.id, shiftCode: r.code };
  }
  var rh = ramadanHours_(emp, date, s);
  if (rh) {
    var a = hmToMin_(sh.start), b = hmToMin_(sh.end); if (b <= a) b += 1440;
    if (b - a > rh * 60) sh = Object.assign({}, sh, { end: hm_((a + rh * 60) % 1440), ramadan: true });
  }
  return sh;
}

function publicShift_(x) {
  return { id: x.id, code: x.code, nameAr: x.nameAr, nameEn: x.nameEn, start: String(x.start), end: String(x.end), workdays: String(x.workdays || ''),
    outdoor: bool_(x.outdoor), status: x.status, hours: Math.round((((hmToMin_(x.end) - hmToMin_(x.start)) + 1440) % 1440 || 1440) / 6) / 10, overnight: hmToMin_(x.end) <= hmToMin_(x.start) };
}
function api_shiftList(req, me) {
  if (!isHr_(me) && !managesAnyone_(me, orgCtx_())) fail_('forbidden');
  var s = settings_();
  return { ok: true, rows: readAll_(SHEETS.SHIFT).filter(function (x) { return x.status !== 'deleted'; }).map(publicShift_),
    enabled: s.rostersEnabled === true || String(s.rostersEnabled) === 'true', ramadan: { from: s.ramadanFrom || '', to: s.ramadanTo || '', hours: Number(s.ramadanHours) || 6 },
    summer: { from: s.summerBanFrom || '06-15', to: s.summerBanTo || '09-15', start: s.summerBanStart || '12:00', end: s.summerBanEnd || '15:00' } };
}
function api_shiftSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.shift || {}, start = String(x.start || ''), end = String(x.end || '');
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) fail_('bad_value');
  var dur = hmToMin_(end) - hmToMin_(start); if (dur <= 0) dur += 1440; // overnight shifts cross midnight (2026-10-18)
  if (start === end) fail_('bad_value');
  if (dur > 12 * 60) fail_('shift_too_long');
  var days = String(x.workdays || '0,1,2,3,4').split(',').map(Number).filter(function (d) { return d >= 0 && d <= 6; });
  if (!days.length) fail_('bad_value');
  if (!str_(x.nameAr, 60)) fail_('missing_fields');
  return withLock_(function () {
    var now = new Date().toISOString(), row = x.id ? findBy_(SHEETS.SHIFT, 'id', x.id) : null;
    if (x.id && !row) fail_('not_found');
    if (!row) row = { id: newId_('H'), code: nextRef_('shift', refsOf_(SHEETS.SHIFT)), createdAt: now };
    row.nameAr = str_(x.nameAr, 60); row.nameEn = str_(x.nameEn, 60); row.start = start; row.end = end; row.workdays = days.join(',');
    row.outdoor = !!x.outdoor; row.status = x.status === 'disabled' ? 'disabled' : 'active'; row.updatedAt = now;
    if (row._row) update_(SHEETS.SHIFT, row); else append_(SHEETS.SHIFT, row);
    audit_(me.id, 'shift_save', '', { code: row.code, start: start, end: end });
    return { ok: true, shift: publicShift_(row) };
  });
}
function api_rosterSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var ids = (Array.isArray(req.empIds) ? req.empIds : []).slice(0, 300), from = isoDate_(req.fromDate), to = isoDate_(req.toDate);
  if (!ids.length || !from || !to || to < from) fail_('bad_range');
  if (daysBetween_(from, to) > 366) fail_('range_too_long');
  return withLock_(function () {
    var sh = findBy_(SHEETS.SHIFT, 'id', req.shiftId);
    if (!sh || sh.status !== 'active') fail_('not_found');
    var ctx = orgCtx_(), now = new Date().toISOString(), cut = [], rows = [];
    readAll_(SHEETS.ROSTER).forEach(function (r) {
      if (r.status !== 'active' || ids.indexOf(r.empId) < 0 || String(r.toDate).slice(0, 10) < from || String(r.fromDate).slice(0, 10) > to) return;
      if (String(r.fromDate).slice(0, 10) >= from) r.status = 'replaced'; else r.toDate = addDays_(from, -1);
      cut.push(r);
    });
    if (cut.length) updateMany_(SHEETS.ROSTER, cut);
    ids.forEach(function (id) { if (ctx.emps[id] && ctx.emps[id].status === 'active') rows.push({ id: newId_('Y'), empId: id, shiftId: sh.id, fromDate: from, toDate: to, status: 'active', createdBy: me.id, createdAt: now }); });
    appendMany_(SHEETS.ROSTER, rows);
    audit_(me.id, 'roster_save', '', { shift: sh.code, people: rows.length, from: from, to: to });
    return { ok: true, count: rows.length, replaced: cut.length };
  });
}
function api_rosterList(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me);
  if (!hr && !managesAnyone_(me, ctx)) fail_('forbidden');
  var t = today_(), from = isoDate_(req.from) || t, to = isoDate_(req.to) || addDays_(t, 30), s = settings_(), shifts = {};
  readAll_(SHEETS.SHIFT).forEach(function (x) { shifts[x.id] = x; });
  var rows = readAll_(SHEETS.ROSTER).filter(function (r) {
    var e = ctx.emps[r.empId];
    return r.status === 'active' && e && e.status === 'active' && (hr || manages_(me, e, ctx)) && !(String(r.toDate).slice(0, 10) < from || String(r.fromDate).slice(0, 10) > to);
  }).map(function (r) { var sh = shifts[r.shiftId] || {}; return { id: r.id, emp: empCard_(ctx.emps[r.empId]), shift: sh.id ? publicShift_(sh) : null, fromDate: String(r.fromDate).slice(0, 10), toDate: String(r.toDate).slice(0, 10) }; });
  return { ok: true, rows: rows, warnings: summerWarnings_(rows, ctx, s, from, to) };
}
function api_rosterDelete(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var r = findBy_(SHEETS.ROSTER, 'id', req.id);
    if (!r || r.status !== 'active') fail_('not_found');
    r.status = 'deleted'; update_(SHEETS.ROSTER, r);
    audit_(me.id, 'roster_delete', r.empId, { id: r.id });
    return { ok: true };
  });
}
function summerWarnings_(rows, ctx, s, from, to) {
  var bs = hmToMin_(s.summerBanStart || '12:00'), be = hmToMin_(s.summerBanEnd || '15:00'), out = [];
  rows.forEach(function (r) {
    if (!r.shift) return;
    var e = ctx.emps[r.emp.id], outdoor = r.shift.outdoor || bool_(e && e.outdoor);
    if (!outdoor || !(hmToMin_(r.shift.start) < be && hmToMin_(r.shift.end) > bs)) return;
    var a = maxDate_(r.fromDate, from), b = minDate_(r.toDate, to), hit = null;
    for (var d = a, i = 0; d <= b && i < 400; d = addDays_(d, 1), i++) { var md = d.slice(5); if (md >= (s.summerBanFrom || '06-15') && md <= (s.summerBanTo || '09-15')) { hit = d; break; } }
    if (hit) out.push({ kind: 'summer_ban', emp: r.emp, shift: r.shift.code, from: hit });
  });
  return out;
}
