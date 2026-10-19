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

/**
 * Open shifts and shift swaps (2026-10-19, gap list item 2; seen in UKG and Jisr, rebuilt as our own flow). Tab shiftOffers, ref OSH.
 *  - Open shift: a manager (for a department they head or manage people in) or HR posts a shift on a date, one row per slot.
 *    An eligible employee claims it; the claimant's manager or HR approves; approval writes a one-day roster row.
 *  - Swap: A asks a team-mate B to swap their rostered shifts on one date; B accepts; A's manager or HR approves;
 *    approval writes two one-day roster rows (A gets B's shift, B gets A's).
 *  - Both need rosters on (setting rostersEnabled), a date from today on, and nobody approves a change that involves themself.
 *  - A claim on someone's weekly rest day is allowed with a warning (Art. 104: work on the rest day is paid as overtime).
 */
var OSH_OPEN_ = { open: 1, claimed: 1, peer: 1, manager: 1 };
function rostersOn_(s) { return s.rostersEnabled === true || String(s.rostersEnabled) === 'true'; }
function onLeave_(empId, date) {
  return readAll_(SHEETS.REQ).some(function (r) { return r.empId === empId && r.type === 'leave' && r.status === 'approved' && String(r.fromDate).slice(0, 10) <= date && String(r.toDate).slice(0, 10) >= date; });
}
/** Writes a one-day roster row for empId on date and trims or splits the rows it overlaps. Call inside the lock. */
function rosterPut_(empId, shiftId, date, me, now) {
  var cut = [], add = [];
  readAll_(SHEETS.ROSTER).forEach(function (r) {
    var f = String(r.fromDate).slice(0, 10), t = String(r.toDate).slice(0, 10);
    if (r.status !== 'active' || r.empId !== empId || t < date || f > date) return;
    if (f < date && t > date) add.push({ id: newId_('Y'), empId: empId, shiftId: r.shiftId, fromDate: addDays_(date, 1), toDate: t, status: 'active', createdBy: me.id, createdAt: now });
    if (f < date) r.toDate = addDays_(date, -1); else if (t > date) r.fromDate = addDays_(date, 1); else r.status = 'replaced';
    cut.push(r);
  });
  if (cut.length) updateMany_(SHEETS.ROSTER, cut);
  add.push({ id: newId_('Y'), empId: empId, shiftId: shiftId, fromDate: date, toDate: date, status: 'active', createdBy: me.id, createdAt: now });
  appendMany_(SHEETS.ROSTER, add);
}
function rosterRow_(empId, date) {
  var hit = null;
  readAll_(SHEETS.ROSTER).some(function (r) { if (r.status === 'active' && r.empId === empId && String(r.fromDate).slice(0, 10) <= date && String(r.toDate).slice(0, 10) >= date) { hit = r; return true; } return false; });
  return hit;
}
function teamMates_(emp, ctx) {
  return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (x) {
    return x.id !== emp.id && x.status === 'active' && ((emp.managerId && x.managerId === emp.managerId) || (emp.departmentId && x.departmentId === emp.departmentId));
  });
}
function oshCanDecide_(me, x, ctx) {
  if (x.empId === me.id || x.peerId === me.id) return false;
  var e = ctx.emps[x.empId];
  return isHr_(me) || !!(e && manages_(me, e, ctx));
}
function oshCanPost_(me, deptId, ctx) {
  if (isHr_(me)) return true;
  if (!managesAnyone_(me, ctx)) return false;
  return !deptId || Object.keys(ctx.emps).some(function (k) { var e = ctx.emps[k]; return e.departmentId === deptId && manages_(me, e, ctx); });
}
function publicOffer_(x, ctx, shifts, me) {
  var sh = shifts[x.shiftId], ps = shifts[x.peerShiftId];
  return { id: x.id, ref: x.ref, kind: x.kind, date: String(x.date).slice(0, 10), status: x.status, note: x.note || '', deptId: x.deptId || '',
    shift: sh ? publicShift_(sh) : null, peerShift: ps ? publicShift_(ps) : null, emp: empCard_(ctx.emps[x.empId]), peer: empCard_(ctx.emps[x.peerId]),
    postedBy: (ctx.emps[x.postedBy] || {}).name || '', decisionNote: x.decisionNote || '', warnings: String(x.warnings || '').split(',').filter(String),
    canDecide: (x.status === 'claimed' || x.status === 'manager') && oshCanDecide_(me, x, ctx), mine: x.empId === me.id, askedMe: x.status === 'peer' && x.peerId === me.id };
}

function api_shiftOfferList(req, me) {
  var ctx = orgCtx_(), s = settings_(), t = today_(), hr = isHr_(me), mgr = managesAnyone_(me, ctx), shifts = {};
  readAll_(SHEETS.SHIFT).forEach(function (x) { shifts[x.id] = x; });
  var self = ctx.emps[me.id] || me, rows = [];
  readAll_(SHEETS.OSH).forEach(function (x) {
    var d = String(x.date).slice(0, 10), e = ctx.emps[x.empId];
    var mineRow = x.empId === me.id || x.peerId === me.id || x.postedBy === me.id;
    var openForMe = x.status === 'open' && d >= t && (!x.deptId || x.deptId === self.departmentId);
    var scope = hr || (e && manages_(me, e, ctx)) || (x.status === 'open' && oshCanPost_(me, x.deptId, ctx) && x.postedBy === me.id);
    if (!(mineRow || openForMe || scope)) return;
    if (d < addDays_(t, -60)) return;
    rows.push(publicOffer_(x, ctx, shifts, me));
  });
  rows.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var mine = rosterRow_(me.id, isoDate_(req.date) || t);
  return { ok: true, enabled: rostersOn_(s), rows: rows, canPost: hr || mgr, shifts: (hr || mgr) ? readAll_(SHEETS.SHIFT).filter(function (x) { return x.status === 'active'; }).map(publicShift_) : [],
    depts: (hr || mgr) ? readAll_(SHEETS.DEPT).filter(function (d) { return d.status !== 'inactive' && oshCanPost_(me, d.id, ctx); }).map(function (d) { return { id: d.id, nameAr: d.nameAr || d.name, nameEn: d.nameEn }; }) : [],
    mates: teamMates_(self, ctx).map(empCard_), myShift: mine && shifts[mine.shiftId] ? publicShift_(shifts[mine.shiftId]) : null };
}
function api_openShiftPost(req, me) {
  var ctx = orgCtx_(), deptId = String(req.deptId || ''), date = isoDate_(req.date), slots = Math.floor(Number(req.slots) || 1);
  if (!oshCanPost_(me, deptId, ctx)) fail_('forbidden');
  if (!rostersOn_(settings_())) fail_('rosters_off');
  if (!date) fail_('bad_value');
  if (date < today_()) fail_('past_date');
  if (slots < 1 || slots > 20) fail_('bad_value');
  return withLock_(function () {
    var sh = findBy_(SHEETS.SHIFT, 'id', req.shiftId);
    if (!sh || sh.status !== 'active') fail_('not_found');
    var now = new Date().toISOString(), refs = nextRefs_('open_shift', slots, refsOf_(SHEETS.OSH)), rows = [];
    for (var i = 0; i < slots; i++) rows.push({ id: newId_('O'), ref: refs[i], kind: 'open', shiftId: sh.id, date: date, deptId: deptId, note: str_(req.note, 200), status: 'open', postedBy: me.id, createdAt: now, updatedAt: now });
    appendMany_(SHEETS.OSH, rows);
    audit_(me.id, 'open_shift_post', '', { shift: sh.code, date: date, slots: slots });
    return { ok: true, count: rows.length };
  });
}
function api_openShiftClaim(req, me) {
  var ctx = orgCtx_(), s = settings_(), emp = ctx.emps[me.id];
  if (!emp || emp.status !== 'active') fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.OSH, 'id', req.id);
    if (!x || x.kind !== 'open') fail_('not_found');
    if (x.status !== 'open') fail_('bad_state');
    var d = String(x.date).slice(0, 10);
    if (d < today_()) fail_('past_date');
    if (x.deptId && x.deptId !== emp.departmentId) fail_('not_eligible');
    if (onLeave_(me.id, d)) fail_('on_leave');
    if (readAll_(SHEETS.OSH).some(function (o) { return o.kind === 'open' && o.empId === me.id && OSH_OPEN_[o.status] && String(o.date).slice(0, 10) === d; })) fail_('already_claimed');
    var warn = [], day = new Date(d + 'T12:00:00Z').getUTCDay(), own = shiftOf_(emp, s);
    if (own.workdays.indexOf(day) < 0) warn.push('rest_day');
    if (rosterRow_(me.id, d)) warn.push('replaces_shift');
    x.status = 'claimed'; x.empId = me.id; x.warnings = warn.join(','); x.updatedAt = new Date().toISOString();
    update_(SHEETS.OSH, x);
    audit_(me.id, 'open_shift_claim', me.id, { ref: x.ref });
    return { ok: true, warnings: warn };
  });
}
function api_shiftSwapAsk(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[me.id], date = isoDate_(req.date), peer = ctx.emps[req.peerId];
  if (!emp || emp.status !== 'active') fail_('forbidden');
  if (!rostersOn_(settings_())) fail_('rosters_off');
  if (!date) fail_('bad_value');
  if (date < today_()) fail_('past_date');
  if (!peer || peer.status !== 'active' || peer.id === me.id || teamMates_(emp, ctx).indexOf(peer) < 0) fail_('not_eligible');
  return withLock_(function () {
    var a = rosterRow_(me.id, date), b = rosterRow_(peer.id, date);
    if (!a || !b) fail_('not_rostered');
    if (a.shiftId === b.shiftId) fail_('same_shift');
    if (onLeave_(me.id, date) || onLeave_(peer.id, date)) fail_('on_leave');
    if (readAll_(SHEETS.OSH).some(function (o) { return o.kind === 'swap' && OSH_OPEN_[o.status] && String(o.date).slice(0, 10) === date && [o.empId, o.peerId].some(function (id) { return id === me.id || id === peer.id; }); })) fail_('already_claimed');
    var now = new Date().toISOString(), row = { id: newId_('O'), ref: nextRef_('open_shift', refsOf_(SHEETS.OSH)), kind: 'swap', shiftId: a.shiftId, peerShiftId: b.shiftId, date: date,
      note: str_(req.note, 200), status: 'peer', postedBy: me.id, empId: me.id, peerId: peer.id, createdAt: now, updatedAt: now };
    append_(SHEETS.OSH, row);
    audit_(me.id, 'shift_swap_ask', peer.id, { ref: row.ref, date: date });
    return { ok: true, ref: row.ref };
  });
}
function api_shiftSwapAnswer(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.OSH, 'id', req.id);
    if (!x || x.kind !== 'swap' || x.peerId !== me.id) fail_('not_found');
    if (x.status !== 'peer') fail_('bad_state');
    x.status = req.accept ? 'manager' : 'rejected'; if (!req.accept) x.decisionNote = str_(req.note, 200);
    x.updatedAt = new Date().toISOString(); update_(SHEETS.OSH, x);
    audit_(me.id, 'shift_swap_answer', x.empId, { ref: x.ref, accept: !!req.accept });
    return { ok: true, status: x.status };
  });
}
function api_shiftOfferDecide(req, me) {
  var ctx = orgCtx_();
  if (!isHr_(me) && !managesAnyone_(me, ctx)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.OSH, 'id', req.id);
    if (!x) fail_('not_found');
    if (x.status !== 'claimed' && x.status !== 'manager') fail_('bad_state');
    if (x.empId === me.id || x.peerId === me.id) fail_('cannot_decide_own');
    if (!oshCanDecide_(me, x, ctx)) fail_('forbidden');
    var now = new Date().toISOString(), d = String(x.date).slice(0, 10);
    if (!req.approve) {
      if (!str_(req.note, 300)) fail_('note_required');
      if (x.kind === 'open') { x.status = 'open'; x.empId = ''; x.warnings = ''; } else x.status = 'rejected';
      x.decisionNote = str_(req.note, 300); x.decidedBy = me.id; x.decidedAt = now; x.updatedAt = now; update_(SHEETS.OSH, x);
      audit_(me.id, 'shift_offer_reject', x.empId, { ref: x.ref });
      return { ok: true, status: x.status };
    }
    if (d < today_()) fail_('past_date');
    if (x.kind === 'open') rosterPut_(x.empId, x.shiftId, d, me, now);
    else {
      var a = rosterRow_(x.empId, d), b = rosterRow_(x.peerId, d);
      if (!a || !b || a.shiftId !== x.shiftId || b.shiftId !== x.peerShiftId) fail_('roster_changed');
      rosterPut_(x.empId, x.peerShiftId, d, me, now); rosterPut_(x.peerId, x.shiftId, d, me, now);
    }
    x.status = 'approved'; x.decidedBy = me.id; x.decidedAt = now; x.decisionNote = str_(req.note, 300); x.updatedAt = now; update_(SHEETS.OSH, x);
    audit_(me.id, 'shift_offer_approve', x.empId, { ref: x.ref, kind: x.kind, date: d });
    return { ok: true, status: 'approved' };
  });
}
function api_shiftOfferCancel(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.OSH, 'id', req.id);
    if (!x) fail_('not_found');
    if (!OSH_OPEN_[x.status]) fail_('bad_state');
    var now = new Date().toISOString();
    if (x.kind === 'open' && x.status === 'claimed' && x.empId === me.id) { x.status = 'open'; x.empId = ''; x.warnings = ''; }
    else if (x.postedBy === me.id || (x.kind === 'open' && isHr_(me))) x.status = 'cancelled';
    else fail_('forbidden');
    x.updatedAt = now; update_(SHEETS.OSH, x);
    audit_(me.id, 'shift_offer_cancel', x.empId || '', { ref: x.ref });
    return { ok: true, status: x.status };
  });
}
hrisHook_('tasks', function (me, ctx, add) {
  var t = today_(), peer = 0, dec = 0;
  readAll_(SHEETS.OSH).forEach(function (x) {
    if (String(x.date).slice(0, 10) < t) return;
    if (x.status === 'peer' && x.peerId === me.id) peer++;
    if ((x.status === 'claimed' || x.status === 'manager') && oshCanDecide_(me, x, ctx)) dec++;
  });
  add('swap_ask', peer, { tab: 'file' });
  add('shift_offer', dec, { tab: 'hr', sec: 'openshifts' });
});
