/**
 * Training and certificates (التدريب والشهادات), Wave 2, 2026-10-14.
 *  - Course catalogue CRS-001 (category, hours, certificate validity in months, cost per person, who must take it).
 *  - Sessions TRS-YYYY-00001 with capacity; HR or a manager (for their people) enrols; an employee may ask to join an
 *    open session and their manager (or HR) decides. Nobody approves their own request.
 *  - HR marks attendance / results; a pass (or attendance) on a course with a validity issues a certificate with an
 *    expiry date. External certificates are recorded directly (certRecord).
 *  - The compliance calendar shows certificates expiring within 90 days (or expired) and mandatory courses an employee
 *    lacks: safety certificates for LPG drivers and plant staff (civil defence, dangerous goods, forklift) are the
 *    first use. Training hours and cost per employee feed HRDF / Qiwa L&D reporting.
 */

var TRN_CATS = ['mandatory', 'safety', 'technical', 'soft_skills', 'compliance', 'leadership', 'other'];
var TRN_LIVE = { requested: 1, enrolled: 1, attended: 1, passed: 1 };
var TRN_DONE = { attended: 1, passed: 1 };
var TRN_EXPIRING_DAYS = 60;

function trnSeesCost_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }
function trnMandatoryFor_(course, emp) {
  if (course.status !== 'active') return false;
  var m = parseJson_(course.mandatoryJson, {});
  if (!m || typeof m !== 'object') return false;
  if (m.all) return true;
  return (m.departmentIds || []).indexOf(emp.departmentId) >= 0 || (m.positionIds || []).indexOf(emp.positionId) >= 0;
}
/** Certificate state on a date: valid, expiring (within 60 days), expired. */
function trnCertState_(x, t) {
  var e = String(x.expiresOn || '').slice(0, 10);
  if (!e) return 'valid';
  if (e < t) return 'expired';
  return daysBetween_(t, e) <= TRN_EXPIRING_DAYS ? 'expiring' : 'valid';
}
/** The latest completed enrolment per employee + course (the one that counts). */
function trnLatest_(rows) {
  var best = {};
  rows.forEach(function (x) {
    if (!TRN_DONE[x.status] || !x.courseId) return;
    var k = x.empId + '|' + x.courseId, b = best[k];
    if (!b || String(x.issuedOn || x.updatedAt) > String(b.issuedOn || b.updatedAt)) best[k] = x;
  });
  return best;
}

function trnPublicCourse_(c, me) {
  var v = { id: c.id, code: c.code, titleAr: c.titleAr, titleEn: c.titleEn, provider: c.provider, category: c.category, hours: Number(c.hours) || 0,
    validityMonths: Number(c.validityMonths) || 0, mandatory: parseJson_(c.mandatoryJson, {}), status: c.status };
  if (trnSeesCost_(me)) v.costPerPerson = Number(c.costPerPerson) || 0;
  return v;
}
function trnPublicSession_(s, courses, enr, me) {
  var c = courses[s.courseId] || {}, taken = enr.filter(function (x) { return x.sessionId === s.id && (x.status === 'enrolled' || TRN_DONE[x.status] || x.status === 'failed' || x.status === 'no_show'); }).length;
  var v = { id: s.id, ref: s.ref, courseId: s.courseId, course: c.titleAr || '', courseEn: c.titleEn || '', category: c.category, fromDate: String(s.fromDate).slice(0, 10),
    toDate: String(s.toDate).slice(0, 10), location: s.location, trainer: s.trainer, capacity: Number(s.capacity) || 0, taken: taken,
    left: Math.max(0, (Number(s.capacity) || 0) - taken), status: s.status, note: s.note,
    mine: enr.filter(function (x) { return x.sessionId === s.id && x.empId === me.id && x.status !== 'cancelled' && x.status !== 'rejected'; }).map(function (x) { return x.status; })[0] || '' };
  if (trnSeesCost_(me)) v.cost = Number(s.cost) || 0;
  return v;
}
function trnPublicEnrol_(x, ctx, courses, sessions, me) {
  var c = courses[x.courseId] || {}, s = sessions[x.sessionId] || {}, t = today_();
  var v = { id: x.id, sessionId: x.sessionId, sessionRef: s.ref || '', courseId: x.courseId, course: c.titleAr || x.title, courseEn: c.titleEn || '', provider: x.provider || c.provider || '',
    emp: empCard_(ctx.emps[x.empId]), status: x.status, score: x.score === '' ? null : Number(x.score), result: x.result, certNo: x.certNo,
    issuedOn: String(x.issuedOn || '').slice(0, 10), expiresOn: String(x.expiresOn || '').slice(0, 10), hours: Number(x.hours) || Number(c.hours) || 0,
    fromDate: String(s.fromDate || '').slice(0, 10), toDate: String(s.toDate || '').slice(0, 10), note: x.note, requestedBy: empCard_(ctx.emps[x.requestedBy]),
    certState: TRN_DONE[x.status] && x.certNo ? trnCertState_(x, t) : '' };
  if (trnSeesCost_(me)) v.cost = Number(x.cost) || 0;
  return v;
}
function trnMaps_() {
  var courses = {}, sessions = {};
  readAll_(SHEETS.COURSE).forEach(function (c) { courses[c.id] = c; });
  readAll_(SHEETS.TSESS).forEach(function (s) { sessions[s.id] = s; });
  return { courses: courses, sessions: sessions };
}
function trnCanDecide_(me, x, ctx) {
  if (!me || x.status !== 'requested' || x.empId === me.id) return false;
  var e = ctx.emps[x.empId];
  return isHr_(me) || (!!e && manages_(me, e, ctx));
}

// ---------------- catalogue and sessions ----------------

function api_courseSave(req, me) {
  var d = req.course || {};
  return withLock_(function () {
    var now = new Date().toISOString(), c = d.id ? findBy_(SHEETS.COURSE, 'id', d.id) : null;
    if (d.id && !c) fail_('not_found');
    var titleAr = str_(d.titleAr, 150);
    if (!titleAr) fail_('missing_fields');
    if (TRN_CATS.indexOf(d.category) < 0) fail_('bad_value');
    var hours = Number(d.hours || 0), val = Math.floor(Number(d.validityMonths || 0)), cost = num_(d.costPerPerson === '' || d.costPerPerson == null ? 0 : d.costPerPerson);
    if (!(hours >= 0 && hours <= 1000) || !(val >= 0 && val <= 120)) fail_('bad_value');
    if (!(cost >= 0)) fail_('bad_amount');
    var m = d.mandatory || {}, ctx = orgCtx_(), mand = { all: !!m.all, departmentIds: [], positionIds: [] };
    (m.departmentIds || []).forEach(function (id) { if (!ctx.depts[id]) fail_('not_found'); mand.departmentIds.push(id); });
    (m.positionIds || []).forEach(function (id) { if (!findBy_(SHEETS.POS, 'id', id)) fail_('not_found'); mand.positionIds.push(id); });
    var fresh = !c;
    if (!c) c = { id: newId_('T'), code: nextRef_('course', codesOf_(readAll_(SHEETS.COURSE), 'code')), createdBy: me.id, createdAt: now };
    c.titleAr = titleAr; c.titleEn = str_(d.titleEn, 150); c.provider = str_(d.provider, 120); c.category = d.category; c.hours = hours; c.validityMonths = val;
    c.costPerPerson = cost; c.mandatoryJson = JSON.stringify(mand); c.status = d.status === 'inactive' ? 'inactive' : 'active'; c.updatedAt = now;
    if (fresh) append_(SHEETS.COURSE, c); else update_(SHEETS.COURSE, c);
    audit_(me.id, fresh ? 'course_create' : 'course_update', '', { code: c.code });
    return { ok: true, course: trnPublicCourse_(c, me) };
  });
}

function api_courseList(req, me) {
  var all = isHr_(me) && req.all;
  return { ok: true, rows: readAll_(SHEETS.COURSE).filter(function (c) { return all || c.status === 'active'; }).map(function (c) { return trnPublicCourse_(c, me); }), categories: TRN_CATS };
}

function api_trainSessionSave(req, me) {
  var d = req.session || {};
  return withLock_(function () {
    var now = new Date().toISOString(), s = d.id ? findBy_(SHEETS.TSESS, 'id', d.id) : null;
    if (d.id && !s) fail_('not_found');
    var c = findBy_(SHEETS.COURSE, 'id', s ? s.courseId : d.courseId);
    if (!c || (!s && c.status !== 'active')) fail_('not_found');
    var from = isoDate_(d.fromDate), to = isoDate_(d.toDate || d.fromDate);
    if (!from || !to || to < from) fail_('bad_date');
    var cap = Math.floor(Number(d.capacity));
    if (!(cap >= 1 && cap <= 500)) fail_('bad_value');
    var cost = num_(d.cost === '' || d.cost == null ? 0 : d.cost);
    if (!(cost >= 0)) fail_('bad_amount');
    var st = ['planned', 'open', 'done', 'cancelled'].indexOf(d.status) >= 0 ? d.status : (s ? s.status : 'open');
    var fresh = !s;
    if (!s) s = { id: newId_('W'), ref: nextRef_('training', refsOf_(SHEETS.TSESS)), courseId: c.id, createdBy: me.id, createdAt: now };
    s.fromDate = from; s.toDate = to; s.location = str_(d.location, 150); s.trainer = str_(d.trainer, 120); s.capacity = cap; s.cost = cost; s.status = st; s.note = str_(d.note, 500); s.updatedAt = now;
    if (fresh) append_(SHEETS.TSESS, s); else update_(SHEETS.TSESS, s);
    audit_(me.id, fresh ? 'training_session_create' : 'training_session_update', '', { ref: s.ref, status: st });
    var m = trnMaps_();
    return { ok: true, session: trnPublicSession_(s, m.courses, readAll_(SHEETS.TENR), me) };
  });
}

function api_trainSessionList(req, me) {
  var m = trnMaps_(), enr = readAll_(SHEETS.TENR), hr = isHr_(me);
  var rows = readAll_(SHEETS.TSESS).filter(function (s) { return (hr || s.status === 'open' || s.status === 'planned') && (!req.courseId || s.courseId === req.courseId); })
    .sort(function (a, b) { return String(a.fromDate) < String(b.fromDate) ? 1 : -1; }).map(function (s) { return trnPublicSession_(s, m.courses, enr, me); });
  var out = { ok: true, rows: rows };
  if (hr && req.sessionId) {
    var ctx = orgCtx_();
    out.enrolments = enr.filter(function (x) { return x.sessionId === req.sessionId; }).map(function (x) { return trnPublicEnrol_(x, ctx, m.courses, m.sessions, me); });
  }
  return out;
}

function trnSeatsTaken_(sessionId, rows) {
  return rows.filter(function (x) { return x.sessionId === sessionId && x.status !== 'requested' && x.status !== 'cancelled' && x.status !== 'rejected'; }).length;
}

/** HR (anyone) or a manager (their people) enrols people in a session. */
function api_trainEnrol(req, me) {
  var empIds = (Array.isArray(req.empIds) ? req.empIds : []).map(String).filter(function (x, i, a) { return a.indexOf(x) === i; });
  if (!empIds.length || empIds.length > 200) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), s = findBy_(SHEETS.TSESS, 'id', req.sessionId), now = new Date().toISOString();
    if (!s || s.status === 'cancelled' || s.status === 'done') fail_('not_found');
    var hr = isHr_(me);
    if (!hr && !managesAnyone_(me, ctx)) fail_('forbidden');
    var rows = readAll_(SHEETS.TENR), c = findBy_(SHEETS.COURSE, 'id', s.courseId) || {}, out = [];
    empIds.forEach(function (id) {
      var e = ctx.emps[id];
      if (!e || e.status !== 'active') fail_('not_found');
      if (!hr && !manages_(me, e, ctx)) fail_('forbidden');
      if (rows.some(function (x) { return x.sessionId === s.id && x.empId === id && x.status !== 'cancelled' && x.status !== 'rejected' && x.status !== 'requested'; })) fail_('already_exists');
    });
    if (trnSeatsTaken_(s.id, rows) + empIds.length > Number(s.capacity)) fail_('session_full');
    empIds.forEach(function (id) {
      var req0 = rows.filter(function (x) { return x.sessionId === s.id && x.empId === id && x.status === 'requested'; })[0];
      if (req0) { req0.status = 'enrolled'; req0.approvedBy = me.id; req0.updatedAt = now; update_(SHEETS.TENR, req0); out.push(req0); return; }
      var row = { id: newId_('N'), sessionId: s.id, courseId: s.courseId, empId: id, status: 'enrolled', requestedBy: me.id, approvedBy: me.id, score: '', result: '', certNo: '',
        issuedOn: '', expiresOn: '', title: '', provider: '', hours: Number(c.hours) || 0, cost: Number(c.costPerPerson) || 0, note: '', markedBy: '', createdAt: now, updatedAt: now };
      append_(SHEETS.TENR, row); out.push(row);
    });
    audit_(me.id, 'training_enrol', '', { ref: s.ref, count: out.length });
    return { ok: true, enrolled: out.length };
  });
}

function api_trainRequest(req, me) {
  return withLock_(function () {
    var s = findBy_(SHEETS.TSESS, 'id', req.sessionId), now = new Date().toISOString();
    if (!s || s.status !== 'open') fail_('not_found');
    var rows = readAll_(SHEETS.TENR), c = findBy_(SHEETS.COURSE, 'id', s.courseId) || {};
    if (rows.some(function (x) { return x.sessionId === s.id && x.empId === me.id && x.status !== 'cancelled' && x.status !== 'rejected'; })) fail_('already_exists');
    var row = { id: newId_('N'), sessionId: s.id, courseId: s.courseId, empId: me.id, status: 'requested', requestedBy: me.id, approvedBy: '', score: '', result: '', certNo: '',
      issuedOn: '', expiresOn: '', title: '', provider: '', hours: Number(c.hours) || 0, cost: Number(c.costPerPerson) || 0, note: str_(req.note, 300), markedBy: '', createdAt: now, updatedAt: now };
    append_(SHEETS.TENR, row);
    audit_(me.id, 'training_request', me.id, { ref: s.ref });
    return { ok: true, id: row.id, status: row.status };
  });
}

function api_trainDecide(req, me) {
  var decision = req.decision === 'approve' ? 'enrolled' : req.decision === 'reject' ? 'rejected' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.TENR, 'id', req.id);
    if (!x || x.status !== 'requested') fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    if (!trnCanDecide_(me, x, ctx)) fail_('forbidden');
    var note = str_(req.note, 300);
    if (decision === 'rejected' && !note) fail_('note_required');
    if (decision === 'enrolled') {
      var s = findBy_(SHEETS.TSESS, 'id', x.sessionId);
      if (!s || s.status === 'cancelled' || s.status === 'done') fail_('not_found');
      if (trnSeatsTaken_(s.id, readAll_(SHEETS.TENR)) + 1 > Number(s.capacity)) fail_('session_full');
    }
    x.status = decision; x.approvedBy = me.id; x.note = note || x.note; x.updatedAt = new Date().toISOString();
    update_(SHEETS.TENR, x);
    audit_(me.id, 'training_' + decision, x.empId, { session: x.sessionId });
    return { ok: true, status: x.status };
  });
}

/** HR records the outcome; a pass (or attendance) on a course with a validity issues a certificate. */
function api_trainMark(req, me) {
  var st = ['attended', 'no_show', 'passed', 'failed'].indexOf(req.status) >= 0 ? req.status : '';
  if (!st) fail_('bad_value');
  var score = req.score === '' || req.score == null ? '' : Number(req.score);
  if (score !== '' && !(score >= 0 && score <= 100)) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.TENR, 'id', req.id), now = new Date().toISOString();
    if (!x || ['enrolled', 'attended', 'passed', 'failed', 'no_show'].indexOf(x.status) < 0 || !x.sessionId) fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    var s = findBy_(SHEETS.TSESS, 'id', x.sessionId), c = findBy_(SHEETS.COURSE, 'id', x.courseId) || {};
    if (!s || String(s.fromDate).slice(0, 10) > today_()) fail_('bad_date');
    x.status = st; x.score = score; x.result = str_(req.result, 200); x.markedBy = me.id; x.updatedAt = now;
    if (TRN_DONE[st]) {
      x.issuedOn = isoDate_(req.issuedOn) || String(s.toDate).slice(0, 10);
      x.certNo = str_(req.certNo, 60) || x.certNo || nextRef_('certificate', codesOf_(readAll_(SHEETS.TENR), 'certNo'));
      var val = Number(c.validityMonths) || 0;
      x.expiresOn = val ? govAddMonths_(x.issuedOn, val) : '';
    } else { x.certNo = ''; x.issuedOn = ''; x.expiresOn = ''; }
    update_(SHEETS.TENR, x);
    audit_(me.id, 'training_mark', x.empId, { status: st, certNo: x.certNo });
    var m = trnMaps_();
    return { ok: true, enrolment: trnPublicEnrol_(x, ctx, m.courses, m.sessions, me) };
  });
}

/** An external certificate (no session): course from the catalogue, or a free title. */
function api_certRecord(req, me) {
  var d = req.cert || {};
  return withLock_(function () {
    var ctx = orgCtx_(), e = ctx.emps[d.empId], now = new Date().toISOString();
    if (!e) fail_('not_found');
    if (e.id === me.id) fail_('cannot_decide_own');
    var c = d.courseId ? findBy_(SHEETS.COURSE, 'id', d.courseId) : null;
    if (d.courseId && !c) fail_('not_found');
    var title = str_(d.title, 150);
    if (!c && !title) fail_('missing_fields');
    var issued = isoDate_(d.issuedOn);
    if (!issued || issued > today_()) fail_('bad_date');
    var expires = d.expiresOn ? isoDate_(d.expiresOn) : (c && Number(c.validityMonths) ? govAddMonths_(issued, Number(c.validityMonths)) : '');
    if (d.expiresOn && (!expires || expires <= issued)) fail_('bad_date');
    var cost = num_(d.cost === '' || d.cost == null ? 0 : d.cost);
    if (!(cost >= 0)) fail_('bad_amount');
    var row = { id: newId_('N'), sessionId: '', courseId: c ? c.id : '', empId: e.id, status: 'passed', requestedBy: me.id, approvedBy: me.id, score: '', result: '',
      certNo: str_(d.certNo, 60) || nextRef_('certificate', codesOf_(readAll_(SHEETS.TENR), 'certNo')), issuedOn: issued, expiresOn: expires, title: title,
      provider: str_(d.provider, 120) || (c ? c.provider : ''), hours: Number(d.hours) || (c ? Number(c.hours) || 0 : 0), cost: cost, note: str_(d.note, 300),
      markedBy: me.id, createdAt: now, updatedAt: now };
    append_(SHEETS.TENR, row);
    audit_(me.id, 'cert_record', e.id, { certNo: row.certNo });
    var m = trnMaps_();
    return { ok: true, enrolment: trnPublicEnrol_(row, ctx, m.courses, m.sessions, me) };
  });
}

// ---------------- views ----------------

function api_myTraining(req, me) {
  var ctx = orgCtx_(), m = trnMaps_(), t = today_(), emp = ctx.emps[me.id] || me;
  var mine = readAll_(SHEETS.TENR).filter(function (x) { return x.empId === me.id; });
  var latest = trnLatest_(mine), missing = [];
  Object.keys(m.courses).forEach(function (k) {
    var c = m.courses[k];
    if (!trnMandatoryFor_(c, emp)) return;
    var l = latest[me.id + '|' + c.id];
    if (!l || trnCertState_(l, t) === 'expired') missing.push({ courseId: c.id, code: c.code, titleAr: c.titleAr, titleEn: c.titleEn, expiredOn: l ? String(l.expiresOn).slice(0, 10) : '' });
  });
  var rows = mine.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return trnPublicEnrol_(x, ctx, m.courses, m.sessions, me); });
  return { ok: true, rows: rows, certificates: rows.filter(function (x) { return x.certNo; }), missing: missing,
    hoursThisYear: mine.filter(function (x) { return TRN_DONE[x.status] && String(x.issuedOn).slice(0, 4) === t.slice(0, 4); }).reduce(function (s, x) { return s + (Number(x.hours) || 0); }, 0),
    inbox: readAll_(SHEETS.TENR).filter(function (x) { return trnCanDecide_(me, x, ctx); }).length };
}

/** Employees x mandatory courses (HR all; a manager their people), with hours and cost per person this year. */
function api_trainMatrix(req, me) {
  var ctx = orgCtx_(), m = trnMaps_(), t = today_(), year = /^\d{4}$/.test(String(req.year || '')) ? String(req.year) : t.slice(0, 4), hr = isHr_(me) || hasRole_(me, 'executive');
  if (!hr && !managesAnyone_(me, ctx)) fail_('forbidden');
  var emps = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) {
    return e.status === 'active' && (hr || manages_(me, e, ctx)) && (!req.departmentId || e.departmentId === req.departmentId);
  });
  var all = readAll_(SHEETS.TENR), latest = trnLatest_(all), mand = Object.keys(m.courses).map(function (k) { return m.courses[k]; }).filter(function (c) { return c.status === 'active'; });
  var totals = {}, money = trnSeesCost_(me);
  var rows = emps.map(function (e) {
    var cells = [];
    mand.forEach(function (c) {
      if (!trnMandatoryFor_(c, e)) return;
      var l = latest[e.id + '|' + c.id], state = l ? trnCertState_(l, t) : 'missing';
      cells.push({ courseId: c.id, code: c.code, state: state, expiresOn: l ? String(l.expiresOn || '').slice(0, 10) : '' });
      var tt = totals[c.id] = totals[c.id] || { courseId: c.id, code: c.code, titleAr: c.titleAr, valid: 0, expiring: 0, expired: 0, missing: 0 };
      tt[state]++;
    });
    var yr = all.filter(function (x) { return x.empId === e.id && TRN_DONE[x.status] && String(x.issuedOn).slice(0, 4) === year; });
    var row = { emp: empCard_(e), courses: cells, hours: yr.reduce(function (s, x) { return s + (Number(x.hours) || 0); }, 0) };
    if (money) row.cost = r2_(yr.reduce(function (s, x) { return s + (Number(x.cost) || 0); }, 0));
    return row;
  });
  return { ok: true, year: year, rows: rows, totals: Object.keys(totals).map(function (k) { return totals[k]; }) };
}

hrisHook_('tasks', function (me, ctx, add) {
  var rows = readAll_(SHEETS.TENR);
  add('training_request', rows.filter(function (x) { return trnCanDecide_(me, x, ctx); }).length, { tab: 'hr', sec: 'training' });
  if (isHr_(me)) {
    var t = today_(), open = {};
    rows.forEach(function (x) { if (x.status === 'enrolled' && x.empId !== me.id) open[x.sessionId] = 1; });
    add('training_mark', readAll_(SHEETS.TSESS).filter(function (s) { return open[s.id] && s.status !== 'cancelled' && String(s.toDate).slice(0, 10) < t; }).length, { tab: 'hr', sec: 'training' });
  }
});
hrisHook_('calendar', function (add, ctx, t, me) {
  var m = trnMaps_(), latest = trnLatest_(readAll_(SHEETS.TENR)), soon = addDays_(t, 90);
  Object.keys(latest).forEach(function (k) {
    var x = latest[k], e = ctx.emps[x.empId], c = m.courses[x.courseId] || {}, exp = String(x.expiresOn || '').slice(0, 10);
    if (!e || e.status !== 'active' || !exp || exp > soon) return;
    add('cert_expiry', exp, ctx.emps[x.empId], { course: c.titleAr || x.title, courseEn: c.titleEn || '', number: x.certNo });
  });
  Object.keys(m.courses).forEach(function (k) {
    var c = m.courses[k];
    Object.keys(ctx.emps).forEach(function (id) {
      var e = ctx.emps[id];
      if (e.status !== 'active' || !trnMandatoryFor_(c, e) || latest[e.id + '|' + c.id]) return;
      var h = String(e.hireDate || '').slice(0, 10);
      add('training_missing', h ? addDays_(h, 30) : '', ctx.emps[id], { course: c.titleAr, courseEn: c.titleEn, code: c.code });
    });
  });
});
