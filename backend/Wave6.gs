/**
 * Wave 6 (2026-11-06): the modules the world-class gap check still listed as missing
 * (docs/research/2026-10-25-world-class-gap-check.md rows 6-14). One file, so the backend file list changes once.
 *   1 celebrations   2 rehire and alumni   3 survey action plans   4 mentoring   5 skills inventory
 *   6 calendar feed  7 mass changes        8 letter templates      9 learning quizzes
 * Every rule is checked here; the screens (js/wave6.js) only show what each answer allows.
 */
function w6Hr_(me) { return isHr_(me); }
function w6Exec_(me) { return isHr_(me) || hasRole_(me, 'executive'); }
function w6Date_(v) { return isoDate_(v) || ''; }
function w6Active_(e) { return e && e.status === 'active'; }
function w6Card_(e) { var c = empCard_(e); if (c) { c.departmentId = e.departmentId || ''; } return c; }

// ======================================================================= 1. celebrations
// Work anniversaries come from the hire date (everyone sees them). Birthdays only for people who opted in, and only the
// day and month: never the year or the age. The private file (empPrivate) is read here only for opted-in people.
var CELEB_MILESTONES = [1, 3, 5, 10, 15, 20, 25, 30];
function api_celebrations(req, me) {
  var ctx = orgCtx_(), t0 = today_(), days = Math.max(7, Math.min(60, Math.round(Number(req.days) || 30)));
  var opt = {}; readAll_(SHEETS.CELEB).forEach(function (o) { opt[o.empId] = bool_(o.showBirthday); });
  var priv = {}; if (Object.keys(opt).some(function (k) { return opt[k]; })) readAll_(SHEETS.PRIV).forEach(function (p) { if (opt[p.empId]) priv[p.empId] = p; });
  var out = [], y = +t0.slice(0, 4);
  var next = function (mmdd) { var d = y + '-' + mmdd; if (d < t0) d = (y + 1) + '-' + mmdd; return d; };
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k]; if (!w6Active_(e)) return;
    var hire = w6Date_(e.hireDate);
    if (hire && hire.slice(5) !== '02-29') {
      var on = next(hire.slice(5)), yrs = +on.slice(0, 4) - +hire.slice(0, 4), left = daysBetween_(t0, on);
      if (yrs >= 1 && left <= days) out.push({ kind: 'anniversary', emp: w6Card_(e), date: on, years: yrs, milestone: CELEB_MILESTONES.indexOf(yrs) >= 0, daysLeft: left });
    }
    var b = priv[e.id] && w6Date_(priv[e.id].birthDate);
    if (b && b.slice(5) !== '02-29') { var bd = next(b.slice(5)), bl = daysBetween_(t0, bd); if (bl <= days) out.push({ kind: 'birthday', emp: w6Card_(e), date: bd, daysLeft: bl }); }
  });
  out.sort(function (a, b) { return a.daysLeft - b.daysLeft || String(a.emp.name).localeCompare(String(b.emp.name)); });
  return { ok: true, rows: out, mine: { showBirthday: !!opt[me.id] }, days: days };
}
function api_celebOptSave(req, me) {
  return withLock_(function () {
    var row = findBy_(SHEETS.CELEB, 'empId', me.id), now = new Date().toISOString();
    if (row) { row.showBirthday = !!req.showBirthday; row.updatedAt = now; update_(SHEETS.CELEB, row); }
    else append_(SHEETS.CELEB, { empId: me.id, showBirthday: !!req.showBirthday, updatedAt: now });
    return { ok: true, showBirthday: !!req.showBirthday };
  });
}

// ======================================================================= 2. rehire and alumni
// Every person who left is an alumnus. HR records whether they may be rehired (yes / conditional / no) with a reason;
// nobody records it for themselves. A rehire check by name, ID number or e-mail tells recruiters before an offer.
var REHIRE = ['yes', 'conditional', 'no'];
function alumniRows_(ctx) {
  var flags = {}; readAll_(SHEETS.ALUM).forEach(function (a) { flags[a.empId] = a; });
  return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status !== 'active' || w6Date_(e.lastWorkingDay); })
    .map(function (e) { var f = flags[e.id] || {};
      return { emp: w6Card_(e), hireDate: w6Date_(e.hireDate), lastDay: w6Date_(e.lastWorkingDay), status: e.status, rehire: f.rehire || '', reason: f.reason || '', decidedBy: f.decidedBy && ctx.emps[f.decidedBy] ? ctx.emps[f.decidedBy].name : '', decidedAt: f.updatedAt || '' }; })
    .sort(function (a, b) { return String(b.lastDay).localeCompare(String(a.lastDay)); });
}
function api_alumniList(req, me) { if (!w6Hr_(me)) fail_('forbidden'); return { ok: true, rows: alumniRows_(orgCtx_()) }; }
function api_alumniSave(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  if (REHIRE.indexOf(req.rehire) < 0) fail_('bad_value');
  if (req.rehire !== 'yes' && !str_(req.reason, 300)) fail_('reason_required');
  return withLock_(function () {
    var e = findBy_(SHEETS.EMP, 'id', req.empId); if (!e) fail_('not_found');
    if (e.id === me.id) fail_('cannot_decide_own');
    var row = findBy_(SHEETS.ALUM, 'empId', e.id), now = new Date().toISOString();
    var o = { empId: e.id, rehire: req.rehire, reason: str_(req.reason, 300), decidedBy: me.id, updatedAt: now };
    if (row) { Object.assign(row, o); update_(SHEETS.ALUM, row); } else append_(SHEETS.ALUM, o);
    audit_(me.id, 'rehire_flag', e.id, { rehire: req.rehire });
    return { ok: true };
  });
}
function api_rehireCheck(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  var q = String(req.q || '').trim().toLowerCase(); if (q.length < 3) fail_('bad_request');
  var ctx = orgCtx_(), ids = {}; readAll_(SHEETS.PRIV).forEach(function (p) { if (String(p.nationalId || '').toLowerCase() === q) ids[p.empId] = 1; });
  var rows = alumniRows_(ctx).filter(function (a) { var e = ctx.emps[a.emp.id];
    return ids[e.id] || String(e.name || '').toLowerCase().indexOf(q) >= 0 || String(e.nameEn || '').toLowerCase().indexOf(q) >= 0 || String(e.email || '').toLowerCase() === q || String(e.empNo).toLowerCase() === q; });
  return { ok: true, rows: rows.slice(0, 20) };
}

// ======================================================================= 3. survey action plans
// A low pulse or eNPS result becomes owned actions with a due date. HR or an executive raises them; the owner marks one
// done with what was done; HR closes or cancels. Everyone sees the plan of a survey (actions are not personal data).
var SVA_ST = ['open', 'done', 'cancelled'];
function svaView_(a, ctx) {
  return { id: a.id, ref: a.ref, surveyId: a.surveyId, area: a.area, title: a.title, owner: ctx.emps[a.ownerId] ? w6Card_(ctx.emps[a.ownerId]) : null, ownerId: a.ownerId,
    dueDate: w6Date_(a.dueDate), status: a.status, doneNote: a.doneNote, doneAt: a.doneAt, overdue: a.status === 'open' && w6Date_(a.dueDate) < today_() };
}
function api_svActList(req, me) {
  var ctx = orgCtx_(), sv = {}; readAll_(SHEETS.SRV).forEach(function (s) { sv[s.id] = s; });
  var rows = readAll_(SHEETS.SVA).filter(function (a) { return !req.surveyId || a.surveyId === req.surveyId; }).map(function (a) { var v = svaView_(a, ctx); v.survey = sv[a.surveyId] ? sv[a.surveyId].title || sv[a.surveyId].ref : ''; return v; })
    .sort(function (a, b) { return (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || String(a.dueDate).localeCompare(String(b.dueDate)); });
  return { ok: true, rows: rows, canEdit: w6Exec_(me), surveys: Object.keys(sv).map(function (k) { return { id: k, title: sv[k].title || sv[k].ref || k }; }) };
}
function api_svActSave(req, me) {
  if (!w6Exec_(me)) fail_('forbidden');
  var x = req.item || {}, title = str_(x.title, 200), due = w6Date_(x.dueDate);
  if (!title) fail_('title_required'); if (!due) fail_('bad_date');
  return withLock_(function () {
    if (!findBy_(SHEETS.SRV, 'id', x.surveyId)) fail_('not_found');
    var owner = findBy_(SHEETS.EMP, 'id', x.ownerId); if (!w6Active_(owner)) fail_('bad_owner');
    var row = { id: newId_('SA'), ref: nextRef_('surveyAction', refsOf_(SHEETS.SVA)), surveyId: x.surveyId, area: str_(x.area, 120), title: title, ownerId: owner.id, dueDate: due,
      status: 'open', doneNote: '', doneAt: '', createdBy: me.id, createdAt: new Date().toISOString() };
    append_(SHEETS.SVA, row); audit_(me.id, 'survey_action', row.id, { survey: x.surveyId });
    return { ok: true, action: svaView_(row, orgCtx_()) };
  });
}
function api_svActStep(req, me) {
  return withLock_(function () {
    var a = findBy_(SHEETS.SVA, 'id', req.id); if (!a) fail_('not_found');
    if (req.step === 'done') { if (a.ownerId !== me.id && !w6Exec_(me)) fail_('forbidden'); if (a.status !== 'open') fail_('bad_state'); if (!str_(req.note, 300)) fail_('note_required');
      a.status = 'done'; a.doneNote = str_(req.note, 300); a.doneAt = new Date().toISOString(); }
    else if (req.step === 'cancel' || req.step === 'reopen') { if (!w6Exec_(me)) fail_('forbidden'); a.status = req.step === 'cancel' ? 'cancelled' : 'open'; if (req.step === 'reopen') { a.doneAt = ''; } }
    else fail_('bad_request');
    update_(SHEETS.SVA, a); audit_(me.id, 'survey_action_' + req.step, a.id, null);
    return { ok: true };
  });
}

// ======================================================================= 4. mentoring
// Anyone may offer to mentor (topics, how many mentees). A mentee asks a mentor; the mentor accepts or declines. HR may pair
// two people directly. Sessions are logged by either side; the notes stay with the two of them (HR sees the count only).
function mentorView_(m, ctx, me, sessions) {
  var mine = m.mentorId === me.id || m.menteeId === me.id, ss = sessions.filter(function (s) { return s.mentorshipId === m.id; });
  return { id: m.id, ref: m.ref, mentor: w6Card_(ctx.emps[m.mentorId]), mentee: w6Card_(ctx.emps[m.menteeId]), goal: mine || w6Hr_(me) ? m.goal : '', status: m.status,
    startDate: w6Date_(m.startDate), endDate: w6Date_(m.endDate), role: m.mentorId === me.id ? 'mentor' : m.menteeId === me.id ? 'mentee' : '',
    sessions: mine ? ss.map(function (s) { return { id: s.id, date: w6Date_(s.date), notes: s.notes, by: ctx.emps[s.byId] ? ctx.emps[s.byId].name : '' }; }) : [], sessionCount: ss.length };
}
function api_mentorHub(req, me) {
  var ctx = orgCtx_(), profs = readAll_(SHEETS.MPROF), ms = readAll_(SHEETS.MSHIP), ss = readAll_(SHEETS.MSESS);
  var load = {}; ms.forEach(function (m) { if (m.status === 'active' || m.status === 'requested') load[m.mentorId] = (load[m.mentorId] || 0) + 1; });
  var me0 = ctx.emps[me.id], q = String(req.q || '').trim().toLowerCase();
  var mentors = profs.filter(function (p) { return bool_(p.offer) && w6Active_(ctx.emps[p.empId]) && p.empId !== me.id; }).map(function (p) {
    var e = ctx.emps[p.empId], cap = Math.max(1, Number(p.capacity) || 2), score = 0;
    if (q && String(p.topics || '').toLowerCase().indexOf(q) >= 0) score += 3;
    if (me0 && e.departmentId && e.departmentId !== me0.departmentId) score += 1; // a view from outside one's own department
    return { emp: w6Card_(e), topics: p.topics, capacity: cap, taken: load[p.empId] || 0, full: (load[p.empId] || 0) >= cap, score: score };
  }).filter(function (m) { return !q || m.score >= 3; }).sort(function (a, b) { return (a.full - b.full) || b.score - a.score || a.taken - b.taken; });
  var mine = ms.filter(function (m) { return m.mentorId === me.id || m.menteeId === me.id || w6Hr_(me); }).map(function (m) { return mentorView_(m, ctx, me, ss); })
    .sort(function (a, b) { return String(b.startDate).localeCompare(String(a.startDate)); });
  var p0 = profs.filter(function (p) { return p.empId === me.id; })[0] || {};
  return { ok: true, mentors: mentors.slice(0, 50), mine: mine, profile: { offer: bool_(p0.offer), topics: p0.topics || '', capacity: Number(p0.capacity) || 2 }, hr: w6Hr_(me) };
}
function api_mentorProfileSave(req, me) {
  return withLock_(function () {
    var row = findBy_(SHEETS.MPROF, 'empId', me.id), o = { empId: me.id, offer: !!req.offer, topics: str_(req.topics, 300), capacity: Math.max(1, Math.min(6, Math.round(Number(req.capacity) || 2))), updatedAt: new Date().toISOString() };
    if (row) { Object.assign(row, o); update_(SHEETS.MPROF, row); } else append_(SHEETS.MPROF, o);
    return { ok: true };
  });
}
function api_mentorRequest(req, me) {
  var goal = str_(req.goal, 300); if (!goal) fail_('goal_required');
  return withLock_(function () {
    var hr = w6Hr_(me) && req.menteeId, menteeId = hr ? req.menteeId : me.id, mentorId = String(req.mentorId || '');
    if (mentorId === menteeId) fail_('same_person');
    var mentor = findBy_(SHEETS.EMP, 'id', mentorId), mentee = findBy_(SHEETS.EMP, 'id', menteeId);
    if (!w6Active_(mentor) || !w6Active_(mentee)) fail_('not_found');
    var prof = findBy_(SHEETS.MPROF, 'empId', mentorId); if (!hr && !(prof && bool_(prof.offer))) fail_('not_a_mentor');
    var ms = readAll_(SHEETS.MSHIP);
    if (ms.some(function (m) { return m.mentorId === mentorId && m.menteeId === menteeId && (m.status === 'active' || m.status === 'requested'); })) fail_('already_paired');
    var cap = prof ? Math.max(1, Number(prof.capacity) || 2) : 2, taken = ms.filter(function (m) { return m.mentorId === mentorId && (m.status === 'active' || m.status === 'requested'); }).length;
    if (!hr && taken >= cap) fail_('mentor_full');
    var row = { id: newId_('MS'), ref: nextRef_('mentorship', refsOf_(SHEETS.MSHIP)), mentorId: mentorId, menteeId: menteeId, goal: goal, status: hr ? 'active' : 'requested',
      startDate: hr ? today_() : '', endDate: '', createdBy: me.id, createdAt: new Date().toISOString() };
    append_(SHEETS.MSHIP, row); audit_(me.id, 'mentorship_' + row.status, row.id, null);
    return { ok: true, status: row.status };
  });
}
function api_mentorStep(req, me) {
  return withLock_(function () {
    var m = findBy_(SHEETS.MSHIP, 'id', req.id); if (!m) fail_('not_found');
    var s = req.step;
    if (s === 'accept' || s === 'decline') { if (m.mentorId !== me.id) fail_('forbidden'); if (m.status !== 'requested') fail_('bad_state'); m.status = s === 'accept' ? 'active' : 'declined'; if (s === 'accept') m.startDate = today_(); }
    else if (s === 'end') { if (m.mentorId !== me.id && m.menteeId !== me.id && !w6Hr_(me)) fail_('forbidden'); if (m.status !== 'active') fail_('bad_state'); m.status = 'ended'; m.endDate = today_(); }
    else if (s === 'session') {
      if (m.mentorId !== me.id && m.menteeId !== me.id) fail_('forbidden'); if (m.status !== 'active') fail_('bad_state');
      var d = w6Date_(req.date) || today_(); if (d > today_()) fail_('future_date');
      append_(SHEETS.MSESS, { id: newId_('SE'), mentorshipId: m.id, date: d, notes: str_(req.notes, 1000), byId: me.id, createdAt: new Date().toISOString() });
      return { ok: true };
    } else fail_('bad_request');
    update_(SHEETS.MSHIP, m); audit_(me.id, 'mentorship_' + s, m.id, null);
    return { ok: true };
  });
}

// ======================================================================= 5. skills inventory
// HR keeps the skills library and what each position needs (level 1 basic - 4 expert). People record their own skills
// with evidence; a manager or HR verifies them (never one's own). The gap view compares each person with their position.
var SK_LEVELS = [1, 2, 3, 4];
function api_skillHub(req, me) {
  var ctx = orgCtx_(), lib = readAll_(SHEETS.SKILL).filter(function (s) { return s.status !== 'retired'; }), es = readAll_(SHEETS.ESKILL), ps = readAll_(SHEETS.PSKILL);
  var sees = function (e) { return e && (e.id === me.id || w6Hr_(me) || manages_(me, e, ctx)); };
  var mine = es.filter(function (x) { return x.empId === me.id; }).map(function (x) { return { id: x.id, skillId: x.skillId, level: Number(x.level), evidence: x.evidence, verified: !!x.verifiedBy }; });
  var team = es.filter(function (x) { var e = ctx.emps[x.empId]; return x.empId !== me.id && w6Active_(e) && sees(e); })
    .map(function (x) { return { id: x.id, emp: w6Card_(ctx.emps[x.empId]), skillId: x.skillId, level: Number(x.level), evidence: x.evidence, verified: !!x.verifiedBy }; });
  return { ok: true, library: lib.map(function (s) { return { id: s.id, code: s.code, nameAr: s.nameAr, nameEn: s.nameEn, category: s.category }; }), mine: mine, team: team,
    positions: ps.map(function (p) { return { id: p.id, positionId: p.positionId, skillId: p.skillId, level: Number(p.level) }; }), hr: w6Hr_(me) };
}
function api_skillSave(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  var x = req.skill || {}, nameAr = str_(x.nameAr, 80); if (!nameAr) fail_('name_required');
  return withLock_(function () {
    var now = new Date().toISOString(), row = x.id ? findBy_(SHEETS.SKILL, 'id', x.id) : null;
    if (row) { row.nameAr = nameAr; row.nameEn = str_(x.nameEn, 80); row.category = str_(x.category, 60); row.status = x.status === 'retired' ? 'retired' : 'active'; row.updatedAt = now; update_(SHEETS.SKILL, row); }
    else { if (readAll_(SHEETS.SKILL).some(function (s) { return String(s.nameAr).trim() === nameAr && s.status !== 'retired'; })) fail_('duplicate');
      row = { id: newId_('SK'), code: nextRef_('skill', codesOf_(readAll_(SHEETS.SKILL), 'code')), nameAr: nameAr, nameEn: str_(x.nameEn, 80), category: str_(x.category, 60), status: 'active', updatedAt: now };
      append_(SHEETS.SKILL, row); }
    return { ok: true, id: row.id };
  });
}
function api_mySkillSave(req, me) {
  var lvl = Math.round(Number(req.level)); if (SK_LEVELS.indexOf(lvl) < 0) fail_('bad_value');
  return withLock_(function () {
    if (!findBy_(SHEETS.SKILL, 'id', req.skillId)) fail_('not_found');
    var row = readAll_(SHEETS.ESKILL).filter(function (x) { return x.empId === me.id && x.skillId === req.skillId; })[0], now = new Date().toISOString();
    if (req.remove) { if (row) { row.empId = ''; row.skillId = ''; row.level = ''; row.evidence = ''; row.verifiedBy = ''; row.updatedAt = now; update_(SHEETS.ESKILL, row); } return { ok: true }; }
    if (row) { var changed = Number(row.level) !== lvl; row.level = lvl; row.evidence = str_(req.evidence, 300); if (changed) { row.verifiedBy = ''; row.verifiedAt = ''; } row.updatedAt = now; update_(SHEETS.ESKILL, row); }
    else append_(SHEETS.ESKILL, { id: newId_('ES'), empId: me.id, skillId: req.skillId, level: lvl, evidence: str_(req.evidence, 300), verifiedBy: '', verifiedAt: '', updatedAt: now });
    return { ok: true };
  });
}
function api_skillVerify(req, me) {
  return withLock_(function () {
    var row = findBy_(SHEETS.ESKILL, 'id', req.id); if (!row || !row.empId) fail_('not_found');
    if (row.empId === me.id) fail_('cannot_verify_own');
    var ctx = orgCtx_(), e = ctx.emps[row.empId]; if (!(w6Hr_(me) || manages_(me, e, ctx))) fail_('forbidden');
    row.verifiedBy = req.undo ? '' : me.id; row.verifiedAt = req.undo ? '' : new Date().toISOString(); update_(SHEETS.ESKILL, row);
    audit_(me.id, 'skill_verify', row.empId, { skill: row.skillId, undo: !!req.undo });
    return { ok: true };
  });
}
function api_posSkillSave(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  var lvl = Math.round(Number(req.level));
  return withLock_(function () {
    if (!findBy_(SHEETS.POS, 'id', req.positionId) || !findBy_(SHEETS.SKILL, 'id', req.skillId)) fail_('not_found');
    var row = readAll_(SHEETS.PSKILL).filter(function (p) { return p.positionId === req.positionId && p.skillId === req.skillId; })[0];
    if (!lvl) { if (row) { row.positionId = ''; row.skillId = ''; row.level = ''; update_(SHEETS.PSKILL, row); } return { ok: true }; }
    if (SK_LEVELS.indexOf(lvl) < 0) fail_('bad_value');
    if (row) { row.level = lvl; update_(SHEETS.PSKILL, row); } else append_(SHEETS.PSKILL, { id: newId_('PS'), positionId: req.positionId, skillId: req.skillId, level: lvl });
    return { ok: true };
  });
}
/** Each person (own team for managers, everyone for HR) against their position's required skills. */
function api_skillGap(req, me) {
  var ctx = orgCtx_(), need = {}, have = {};
  readAll_(SHEETS.PSKILL).forEach(function (p) { if (p.positionId) (need[p.positionId] = need[p.positionId] || []).push({ skillId: p.skillId, level: Number(p.level) }); });
  readAll_(SHEETS.ESKILL).forEach(function (x) { if (x.empId) (have[x.empId] = have[x.empId] || {})[x.skillId] = { level: Number(x.level), verified: !!x.verifiedBy }; });
  var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return w6Active_(e) && (w6Hr_(me) || manages_(me, e, ctx)) && need[e.positionId]; })
    .map(function (e) { var req0 = need[e.positionId], h = have[e.id] || {};
      var gaps = req0.filter(function (r) { return !(h[r.skillId] && h[r.skillId].level >= r.level); }).map(function (r) { return { skillId: r.skillId, need: r.level, has: h[r.skillId] ? h[r.skillId].level : 0 }; });
      return { emp: w6Card_(e), required: req0.length, met: req0.length - gaps.length, gaps: gaps }; })
    .sort(function (a, b) { return (a.met / a.required) - (b.met / b.required); });
  return { ok: true, rows: rows };
}

// ======================================================================= 6. calendar feed (iCal)
// Each person gets a private link for Outlook or Google Calendar: their approved leave, public holidays and, for managers,
// their people's approved leave (who and when only, never the leave type). The link holds a random token; only its SHA-256
// is stored. Making a new link ends the old one.
function api_calFeedLink(req, me) {
  return withLock_(function () {
    var tok = bytesToB64u_(randomBytes_(24)), hash = sha256Hex_(tok), row = findBy_(SHEETS.CALF, 'empId', me.id), now = new Date().toISOString();
    if (row) { row.tokenHash = hash; row.createdAt = now; update_(SHEETS.CALF, row); } else append_(SHEETS.CALF, { empId: me.id, tokenHash: hash, createdAt: now });
    audit_(me.id, 'calendar_link', me.id, null);
    return { ok: true, token: tok, org: ORG_ ? String(ORG_.id) : '' };
  });
}
function icsEsc_(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function calFeedIcs_(token) {
  var row = token ? findBy_(SHEETS.CALF, 'tokenHash', sha256Hex_(String(token))) : null;
  if (!row) return null;
  var ctx = orgCtx_(), me = ctx.emps[row.empId]; if (!w6Active_(me)) return null;
  var from = addDays_(today_(), -90), to = addDays_(today_(), 365), ev = [];
  var dt = function (d) { return String(d).slice(0, 10).replace(/-/g, ''); };
  var add = function (uid, a, b, sum) { ev.push('BEGIN:VEVENT\r\nUID:' + uid + '@basma\r\nDTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z\r\nDTSTART;VALUE=DATE:' + dt(a) + '\r\nDTEND;VALUE=DATE:' + dt(addDays_(b, 1)) + '\r\nSUMMARY:' + icsEsc_(sum) + '\r\nTRANSP:TRANSPARENT\r\nEND:VEVENT'); };
  readAll_(SHEETS.REQ).forEach(function (r) {
    if (r.type !== 'leave' || r.status !== 'approved' || String(r.toDate) < from || String(r.fromDate) > to) return;
    var e = ctx.emps[r.empId]; if (!e) return;
    if (r.empId === me.id) add(r.id, r.fromDate, r.toDate, (me.lang === 'en' ? 'Leave' : 'إجازة') + ' (' + (r.ref || '') + ')');
    else if (manages_(me, e, ctx)) add(r.id + '-t', r.fromDate, r.toDate, e.name + ': ' + 'إجازة');
  });
  readAll_(SHEETS.HOL).forEach(function (h) { var d = w6Date_(h.date || h.fromDate); if (d && d >= from && d <= to) add('hol-' + d, d, w6Date_(h.toDate) || d, h.name || h.nameAr || 'عطلة رسمية'); });
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BASMA//HR//AR\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:' + icsEsc_('BASMA · ' + me.name) + '\r\nX-WR-TIMEZONE:Asia/Riyadh\r\n' + ev.join('\r\n') + (ev.length ? '\r\n' : '') + 'END:VCALENDAR\r\n';
}

// ======================================================================= 7. mass changes
// HR changes many people at once: a salary increase by percent (each becomes a pending package for the payroll approver,
// exactly as one change would), a new manager, department or work location. Always previewed first (dryRun); applying
// runs the same checks again. Nobody is changed who is the requester or an administrator (unless the requester is admin).
var MASS_KINDS = ['salary_pct', 'manager', 'department', 'location'];
function api_massChange(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  var kind = req.kind, ids = (req.ids || []).map(String).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
  if (MASS_KINDS.indexOf(kind) < 0) fail_('bad_kind'); if (!ids.length || ids.length > 500) fail_('bad_request');
  if (kind === 'salary_pct' && !canProposeComp_(me)) fail_('forbidden');
  var pct = Number(req.pct), eff = w6Date_(req.effectiveFrom) || today_();
  if (kind === 'salary_pct' && !(pct > 0 && pct <= 50)) fail_('bad_value');
  var run = function () {
    var ctx = orgCtx_(), comps = kind === 'salary_pct' ? currentCompMap_(today_()) : {}, out = [], skip = [];
    if (kind === 'manager' && !w6Active_(ctx.emps[req.value])) fail_('bad_value');
    if (kind === 'department' && !ctx.depts[req.value]) fail_('bad_value');
    if (kind === 'location' && !str_(req.value, 80)) fail_('bad_value');
    ids.forEach(function (id) {
      var e = ctx.emps[id];
      if (!w6Active_(e)) return skip.push({ id: id, why: 'not_active' });
      if (e.id === me.id) return skip.push({ id: id, name: e.name, why: kind === 'salary_pct' ? 'cannot_change_own_salary' : 'cannot_change_self' });
      if (e.role === 'admin' && me.role !== 'admin') return skip.push({ id: id, name: e.name, why: 'forbidden' });
      if (kind === 'manager' && e.id === req.value) return skip.push({ id: id, name: e.name, why: 'own_manager' });
      var c = comps[e.id];
      if (kind === 'salary_pct') { if (!c) return skip.push({ id: id, name: e.name, why: 'no_package' });
        var f = 1 + pct / 100, nb = Math.round(Number(c.basic) * f * 100) / 100;
        out.push({ emp: w6Card_(e), before: Number(c.basic), after: nb, housing: Math.round(Number(c.housing || 0) * f * 100) / 100, transport: Number(c.transport || 0), other: JSON.stringify(c.other || {}) });
      } else out.push({ emp: w6Card_(e), before: kind === 'manager' ? (ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '') : kind === 'department' ? (ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : '') : e.workLocation || '',
        after: kind === 'manager' ? ctx.emps[req.value].name : kind === 'department' ? ctx.depts[req.value].nameAr : str_(req.value, 80) });
    });
    return { ctx: ctx, out: out, skip: skip };
  };
  if (req.dryRun) { var p = run(); return { ok: true, preview: p.out, skipped: p.skip, total: p.out.reduce(function (s, x) { return s + (kind === 'salary_pct' ? x.after - x.before : 0); }, 0) }; }
  return withLock_(function () {
    var p = run(), now = new Date().toISOString(), batch = newId_('MC'), comp = [], emps = [];
    p.out.forEach(function (x) {
      var e = p.ctx.emps[x.emp.id];
      if (kind === 'salary_pct') comp.push(compRowFrom_({ empId: e.id, effectiveFrom: eff, basic: x.after, housing: x.housing, transport: x.transport, other: (function () { try { return JSON.parse(x.other || '{}'); } catch (er) { return {}; } })(), reason: 'mass_' + pct + '%', batchId: batch }, me.id));
      else { if (kind === 'manager') e.managerId = req.value; else if (kind === 'department') e.departmentId = req.value; else e.workLocation = str_(req.value, 80); e.updatedAt = now; emps.push(e); }
    });
    if (comp.length) appendMany_(SHEETS.COMP, comp);
    if (emps.length) updateMany_(SHEETS.EMP, emps);
    audit_(me.id, 'mass_change', batch, { kind: kind, count: p.out.length, pct: kind === 'salary_pct' ? pct : undefined, value: kind === 'salary_pct' ? undefined : req.value });
    return { ok: true, changed: p.out.length, skipped: p.skip, pending: kind === 'salary_pct' };
  });
}

// ======================================================================= 8. letter templates
// HR rewrites the wording of each letter (salary certificate, employment certificate, experience) in Arabic and English.
// Placeholders such as {name} are filled when the letter prints. Each save is a new version; the old ones stay listed.
var LETTER_TPL_KINDS = ['salary_certificate', 'employment_certificate', 'experience'];
var LETTER_TPL_KEYS = ['name', 'title', 'nationality', 'idNumber', 'position', 'hireDate', 'lastDay', 'total', 'basic', 'housing', 'transport', 'company', 'addressee', 'ref', 'date'];
function api_letterTplList(req, me) {
  var rows = readAll_(SHEETS.LTPL), cur = {};
  rows.forEach(function (r) { var k = r.kind + ':' + r.lang; if (!cur[k] || Number(r.version) > Number(cur[k].version)) cur[k] = r; });
  return { ok: true, templates: Object.keys(cur).filter(function (k) { return cur[k].status !== 'off'; }).map(function (k) { var r = cur[k]; return { kind: r.kind, lang: r.lang, title: r.title, body: r.body, version: Number(r.version) }; }),
    history: w6Hr_(me) ? rows.map(function (r) { return { kind: r.kind, lang: r.lang, version: Number(r.version), status: r.status, updatedAt: r.updatedAt }; }) : [], keys: LETTER_TPL_KEYS, kinds: LETTER_TPL_KINDS };
}
function api_letterTplSave(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  if (LETTER_TPL_KINDS.indexOf(req.kind) < 0) fail_('bad_kind'); var lng = req.lang === 'en' ? 'en' : 'ar';
  var body = String(req.body || '').slice(0, 4000).trim(), off = !!req.off;
  if (!off && body.length < 20) fail_('body_required');
  var unknown = (body.match(/\{([a-zA-Z]+)\}/g) || []).map(function (x) { return x.slice(1, -1); }).filter(function (k) { return LETTER_TPL_KEYS.indexOf(k) < 0; });
  if (unknown.length) return { ok: false, error: 'unknown_placeholder', detail: unknown.join(', ') };
  return withLock_(function () {
    var last = readAll_(SHEETS.LTPL).filter(function (r) { return r.kind === req.kind && r.lang === lng; }).reduce(function (m, r) { return Math.max(m, Number(r.version) || 0); }, 0);
    append_(SHEETS.LTPL, { id: newId_('LT'), kind: req.kind, lang: lng, title: str_(req.title, 120), body: off ? '' : body, version: last + 1, status: off ? 'off' : 'active', updatedBy: me.id, updatedAt: new Date().toISOString() });
    audit_(me.id, 'letter_template', req.kind + ':' + lng, { version: last + 1, off: off });
    return { ok: true, version: last + 1 };
  });
}

// ======================================================================= 9. learning quizzes
// HR writes a quiz (2-30 questions, 2-6 choices each, one correct) with a pass mark, optionally for one course. People take it;
// the answers are marked here, never in the page (the page never receives the correct choices). A pass records a certificate
// number. At most three attempts a day per quiz.
function quizPublic_(q) { var qs = []; try { qs = JSON.parse(q.questionsJson || '[]'); } catch (e) {} return { id: q.id, ref: q.ref, title: q.title, courseId: q.courseId, passMark: Number(q.passMark), status: q.status, count: qs.length,
  questions: qs.map(function (x, i) { return { i: i, text: x.text, choices: x.choices }; }) }; }
function api_quizList(req, me) {
  var at = readAll_(SHEETS.QATT), ctx = orgCtx_();
  var rows = readAll_(SHEETS.QUIZ).filter(function (q) { return q.status === 'active' || w6Hr_(me); }).map(function (q) {
    var mine = at.filter(function (a) { return a.quizId === q.id && a.empId === me.id; }), best = mine.reduce(function (m, a) { return Math.max(m, Number(a.score) || 0); }, 0), p = quizPublic_(q);
    delete p.questions; p.best = mine.length ? best : null; p.passed = mine.some(function (a) { return bool_(a.passed); }); p.cert = (mine.filter(function (a) { return bool_(a.passed); })[0] || {}).certNo || '';
    if (w6Hr_(me)) { var all = at.filter(function (a) { return a.quizId === q.id; }); p.takers = all.map(function (a) { return a.empId; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).length; p.passes = all.filter(function (a) { return bool_(a.passed); }).length; }
    return p; });
  return { ok: true, rows: rows, hr: w6Hr_(me), results: w6Hr_(me) ? at.slice(-200).map(function (a) { return { quizId: a.quizId, emp: w6Card_(ctx.emps[a.empId]), score: Number(a.score), passed: bool_(a.passed), at: a.at, certNo: a.certNo }; }) : [] };
}
function api_quizSave(req, me) {
  if (!w6Hr_(me)) fail_('forbidden');
  var x = req.quiz || {}, title = str_(x.title, 120), pass = Math.round(Number(x.passMark));
  if (!title) fail_('title_required'); if (!(pass >= 40 && pass <= 100)) fail_('bad_value');
  var qs = Array.isArray(x.questions) ? x.questions : [];
  if (qs.length < 2 || qs.length > 30) fail_('bad_questions');
  qs = qs.map(function (q) { var ch = (q.choices || []).map(function (c) { return str_(c, 200); }).filter(Boolean), ok = Math.round(Number(q.correct));
    if (!str_(q.text, 300) || ch.length < 2 || ch.length > 6 || !(ok >= 0 && ok < ch.length)) fail_('bad_questions');
    return { text: str_(q.text, 300), choices: ch, correct: ok }; });
  return withLock_(function () {
    var now = new Date().toISOString(), row = x.id ? findBy_(SHEETS.QUIZ, 'id', x.id) : null;
    if (row) { row.title = title; row.passMark = pass; row.courseId = str_(x.courseId, 40); row.questionsJson = JSON.stringify(qs); row.status = x.status === 'off' ? 'off' : 'active'; row.updatedAt = now; update_(SHEETS.QUIZ, row); }
    else { row = { id: newId_('QZ'), ref: nextRef_('quiz', refsOf_(SHEETS.QUIZ)), title: title, courseId: str_(x.courseId, 40), passMark: pass, questionsJson: JSON.stringify(qs), status: 'active', createdBy: me.id, updatedAt: now }; append_(SHEETS.QUIZ, row); }
    return { ok: true, id: row.id };
  });
}
function api_quizTake(req, me) { var q = findBy_(SHEETS.QUIZ, 'id', req.id); if (!q || q.status !== 'active') fail_('not_found'); return { ok: true, quiz: quizPublic_(q) }; }
function api_quizSubmit(req, me) {
  var answers = Array.isArray(req.answers) ? req.answers.map(function (a) { return Math.round(Number(a)); }) : [];
  return withLock_(function () {
    var q = findBy_(SHEETS.QUIZ, 'id', req.id); if (!q || q.status !== 'active') fail_('not_found');
    var qs = JSON.parse(q.questionsJson || '[]'), day = today_();
    if (readAll_(SHEETS.QATT).filter(function (a) { return a.quizId === q.id && a.empId === me.id && String(a.at).slice(0, 10) === day; }).length >= 3) fail_('too_many_attempts');
    if (answers.length !== qs.length) fail_('answer_all');
    var right = qs.filter(function (x, i) { return answers[i] === x.correct; }).length, score = Math.round(right / qs.length * 100), passed = score >= Number(q.passMark);
    var row = { id: newId_('QA'), quizId: q.id, empId: me.id, score: score, passed: passed, answersJson: JSON.stringify(answers), at: new Date().toISOString(), certNo: passed ? nextRef_('quizCert', codesOf_(readAll_(SHEETS.QATT), 'certNo')) : '' };
    append_(SHEETS.QATT, row);
    return { ok: true, score: score, passed: passed, passMark: Number(q.passMark), right: right, of: qs.length, certNo: row.certNo, wrong: qs.map(function (x, i) { return answers[i] === x.correct ? null : i; }).filter(function (x) { return x !== null; }) };
  });
}

// ======================================================================= 10. GOSI work queue (2026-11-06)
// What has to be done in GOSI, worked out from BASMA's own data: register new joiners (due 15 days after the hire date),
// update the insured wage when basic + housing changed (or the wage HR recorded), and terminate leavers. HR or payroll do
// each item in the GOSI portal and record GOSI's reference here; a readiness check lists the data GOSI will ask for that is
// missing or wrong. A direct connection stays off until the organisation's own GOSI credentials are in Script properties
// (GOSI_REG_NO, GOSI_CLIENT_ID, GOSI_CLIENT_SECRET): no call is made without them, and none is invented here.
var GOSI_KINDS = ['register', 'update_wage', 'terminate'];
function gosiInsured_(e, priv, comp) {
  // the wage GOSI should hold now: basic + housing from the current package; the wage already registered (priv.gosiWage)
  // is what it is compared with, and is used only when there is no package
  var w = comp ? Number(comp.basic) + Number(comp.housing || 0) : Number(priv.gosiWage) || 0;
  if (!w) return 0;
  return Math.min(GOSI_MAX, Math.max(bool_(e.isSaudi) ? GOSI_MIN : 0, Math.round(w * 100) / 100));
}
function gosiReady_(e, priv, comp) {
  var issues = [], id = String(priv.nationalId || '').trim();
  if (!/^[12]\d{9}$/.test(id)) issues.push(id ? 'gosi_bad_id' : 'gosi_no_id');
  else if (bool_(e.isSaudi) !== (id[0] === '1')) issues.push('gosi_id_nationality');
  if (!w6Date_(priv.birthDate)) issues.push('gosi_no_birth');
  if (!w6Date_(e.hireDate)) issues.push('gosi_no_hire');
  if (!comp && !Number(priv.gosiWage)) issues.push('gosi_no_wage');
  if (bool_(e.isSaudi) && !priv.gosiCohort) issues.push('gosi_no_cohort');
  return issues;
}
function gosiQueue_(ctx) {
  var t = today_(), privs = {}, comps = currentCompMap_(t), done = {};
  readAll_(SHEETS.PRIV).forEach(function (p) { privs[p.empId] = p; });
  readAll_(SHEETS.GOSIS).forEach(function (s) { (done[s.empId] = done[s.empId] || []).push(s); });
  var items = [];
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k], p = privs[e.id] || {}, c = comps[e.id] || null, hist = (done[e.id] || []).slice().sort(function (a, b) { return String(a.doneAt).localeCompare(String(b.doneAt)); });
    var reg = !!(String(p.gosiNumber || '').trim() || hist.some(function (s) { return s.kind === 'register'; }));
    var lastDay = w6Date_(e.lastWorkingDay), gone = e.status !== 'active' || (lastDay && lastDay <= t), hire = w6Date_(e.hireDate);
    var ready = gosiReady_(e, p, c), insured = gosiInsured_(e, p, c);
    var base = { emp: w6Card_(e), saudi: bool_(e.isSaudi), gosiNumber: String(p.gosiNumber || ''), issues: ready, wage: insured };
    if (!gone && !reg && hire) items.push(Object.assign({ kind: 'register', due: addDays_(hire, 15), overdue: addDays_(hire, 15) < t, since: hire }, base));
    else if (gone && reg && !hist.some(function (s) { return s.kind === 'terminate'; })) items.push(Object.assign({ kind: 'terminate', due: lastDay ? addDays_(lastDay, 15) : '', overdue: !!lastDay && addDays_(lastDay, 15) < t, since: lastDay }, base));
    else if (!gone && reg) {
      var synced = hist.filter(function (s) { return s.kind !== 'terminate' && Number(s.wage); }).pop(), was = synced ? Number(synced.wage) : Number(p.gosiWage) || 0;
      if (was && insured && Math.abs(was - insured) >= 1) items.push(Object.assign({ kind: 'update_wage', due: '', overdue: false, from: was }, base));
    }
  });
  var rank = { register: 0, terminate: 1, update_wage: 2 };
  return items.sort(function (a, b) { return (b.overdue - a.overdue) || rank[a.kind] - rank[b.kind] || String(a.due).localeCompare(String(b.due)); });
}
function api_gosiQueue(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var ctx = orgCtx_(), items = gosiQueue_(ctx), p = PropertiesService.getScriptProperties();
  var configured = ['GOSI_REG_NO', 'GOSI_CLIENT_ID', 'GOSI_CLIENT_SECRET'].every(function (k) { return !!p.getProperty(orgKey_(k)); });
  var log = readAll_(SHEETS.GOSIS).slice(-60).reverse().map(function (s) { return { kind: s.kind, emp: w6Card_(ctx.emps[s.empId]), ref: s.ref, wage: Number(s.wage) || null, date: w6Date_(s.date), by: ctx.emps[s.doneBy] ? ctx.emps[s.doneBy].name : '' }; });
  return { ok: true, items: items, log: log, connector: { configured: configured },
    counts: { register: items.filter(function (x) { return x.kind === 'register'; }).length, update_wage: items.filter(function (x) { return x.kind === 'update_wage'; }).length,
      terminate: items.filter(function (x) { return x.kind === 'terminate'; }).length, overdue: items.filter(function (x) { return x.overdue; }).length, issues: items.filter(function (x) { return x.issues.length; }).length } };
}
function api_gosiMark(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  if (GOSI_KINDS.indexOf(req.kind) < 0) fail_('bad_kind');
  var ref = str_(req.ref, 40), date = w6Date_(req.date) || today_();
  if (!ref) fail_('ref_required'); if (date > today_()) fail_('future_date');
  return withLock_(function () {
    var ctx = orgCtx_(), e = ctx.emps[req.empId]; if (!e) fail_('not_found');
    if (e.id === me.id) fail_('cannot_change_self');
    var item = gosiQueue_(ctx).filter(function (x) { return x.emp.id === e.id && x.kind === req.kind; })[0];
    if (!item) fail_('nothing_to_do');
    if (req.kind === 'register' && item.issues.length) return { ok: false, error: 'gosi_data_incomplete', detail: item.issues.join(', ') };
    var now = new Date().toISOString(), wage = req.kind === 'terminate' ? '' : item.wage;
    append_(SHEETS.GOSIS, { id: newId_('GS'), empId: e.id, kind: req.kind, wage: wage, ref: ref, date: date, doneBy: me.id, doneAt: now });
    var p = findBy_(SHEETS.PRIV, 'empId', e.id), num = str_(req.gosiNumber, 20);
    if (p && (req.kind !== 'terminate')) { if (num) p.gosiNumber = num; if (wage) p.gosiWage = wage; p.updatedAt = now; update_(SHEETS.PRIV, p); }
    audit_(me.id, 'gosi_' + req.kind, e.id, { ref: ref, wage: wage || undefined });
    return { ok: true };
  });
}
