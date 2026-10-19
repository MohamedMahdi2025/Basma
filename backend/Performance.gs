/**
 * Performance (Phase 4): cycles, weighted KPIs, mid-year check-in, self and manager review,
 * HR calibration, results with acknowledgement, and 360 feedback with anonymity rules.
 * Plan: docs/superpowers/plans/2026-09-30-hr-phase4-performance.md
 */

var COMPETENCIES = ['safety', 'customer', 'teamwork', 'ownership', 'communication', 'problem_solving'];
var LEADER_COMPETENCIES = ['leadership'];
var PERF_STAGES = ['setup', 'goals', 'midyear', 'review', 'calibration', 'closed'];
var MID_STATUS = ['on_track', 'at_risk', 'off_track'];
var FB_MIN_GROUP = 3; // peers and reports are shown only as a group of 3 or more

function cycleById_(id) { return id ? findBy_(SHEETS.CYC, 'id', id) : null; }
/** The cycle people work in now: the latest not closed, else the latest. */
function currentCycle_() {
  var rows = readAll_(SHEETS.CYC).filter(function (c) { return c.status !== 'deleted'; })
    .sort(function (a, b) { return String(a.createdAt) < String(b.createdAt) ? 1 : -1; });
  return rows.filter(function (c) { return c.status !== 'closed'; })[0] || rows[0] || null;
}
function managesAnyone_(emp, ctx) {
  return Object.keys(ctx.emps).some(function (k) { var e = ctx.emps[k]; return e.status === 'active' && e.id !== emp.id && manages_(emp, e, ctx); });
}
function compsFor_(emp, ctx) { return managesAnyone_(emp, ctx) ? COMPETENCIES.concat(LEADER_COMPETENCIES) : COMPETENCIES; }
function kpisOf_(cycleId, empId) {
  return readAll_(SHEETS.KPI).filter(function (k) { return k.cycleId === cycleId && k.empId === empId && k.status !== 'deleted'; })
    .sort(function (a, b) { return String(a.createdAt) < String(b.createdAt) ? -1 : 1; });
}
function reviewOf_(cycleId, empId) {
  return readAll_(SHEETS.REV).filter(function (r) { return r.cycleId === cycleId && r.empId === empId; })[0] || null;
}
function parseJson_(s, d) { try { return JSON.parse(s || '') || d; } catch (e) { return d; } }
function score_(v) { var n = Number(v); return n >= 1 && n <= 5 && Math.round(n) === n ? n : null; }
function needStage_(cycle, stages) {
  if (!cycle) fail_('not_found');
  if (stages.indexOf(cycle.status) < 0) fail_('stage_closed');
}
function canManagePerf_(me, emp, ctx) { return isHr_(me) || manages_(me, emp, ctx); }

function publicCycle_(c) {
  return c ? { id: c.id, ref: c.ref, year: c.year, nameAr: c.nameAr, nameEn: c.nameEn, type: c.type, status: c.status, kpiWeight: Number(c.kpiWeight),
    compWeight: Number(c.compWeight), goalsDue: c.goalsDue ? String(c.goalsDue).slice(0, 10) : '', midDue: c.midDue ? String(c.midDue).slice(0, 10) : '',
    reviewDue: c.reviewDue ? String(c.reviewDue).slice(0, 10) : '' } : null;
}
function publicKpi_(k, showMgr) {
  var o = { id: k.id, ref: k.ref, titleAr: k.titleAr, titleEn: k.titleEn, measure: k.measure, target: k.target, unit: k.unit, weight: Number(k.weight),
    midStatus: k.midStatus, midNote: k.midNote, actual: k.actual, selfScore: k.selfScore === '' ? null : Number(k.selfScore), selfComment: k.selfComment };
  if (showMgr) { o.mgrScore = k.mgrScore === '' ? null : Number(k.mgrScore); o.mgrComment = k.mgrComment; }
  return o;
}
/**
 * A review as the viewer may see it. The employee sees the manager's part and the final rating only
 * once the cycle is closed; the manager sees the self part once submitted; HR sees everything.
 */
function publicReview_(r, cycle, view) {
  if (!r) return null;
  var closed = cycle && cycle.status === 'closed', o = { id: r.id, ref: r.ref, stage: r.stage, selfAt: r.selfAt, mgrAt: r.mgrAt, acknowledgedAt: r.acknowledgedAt, employeeComment: r.employeeComment };
  if (view === 'self' || view === 'hr' || r.selfAt) { o.selfComps = parseJson_(r.selfCompJson, {}); o.selfComment = r.selfComment; }
  if (view !== 'self' || closed) { o.mgrComps = parseJson_(r.mgrCompJson, {}); o.mgrComment = r.mgrComment; o.kpiScore = r.kpiScore === '' ? null : Number(r.kpiScore);
    o.compScore = r.compScore === '' ? null : Number(r.compScore); o.overall = r.overall === '' ? null : Number(r.overall); }
  if (view === 'hr' || closed) { o.finalRating = r.finalRating === '' ? null : Number(r.finalRating); o.calibrationNote = view === 'hr' ? r.calibrationNote : ''; o.adjusted = !!r.calibrationNote; }
  return o;
}
function reviewRow_(cycle, empId, me) {
  var r = reviewOf_(cycle.id, empId);
  if (r) return { row: r, created: false };
  var now = new Date().toISOString();
  return { row: { id: newId_('V'), ref: nextRef_('review', refsOf_(SHEETS.REV)), cycleId: cycle.id, empId: empId, stage: 'self', selfCompJson: '{}', selfComment: '', selfAt: '',
    mgrCompJson: '{}', mgrComment: '', mgrBy: '', mgrAt: '', kpiScore: '', compScore: '', overall: '', finalRating: '', calibratedBy: '', calibrationNote: '',
    employeeComment: '', acknowledgedAt: '', createdAt: now, updatedAt: now }, created: true };
}
function saveRow_(name, x) { if (x.created) append_(name, x.row); else update_(name, x.row); x.created = false; }

// ---------------- cycles (HR) ----------------

function api_perfCycleSave(req, me) {
  var d = req.cycle || {}, year = Number(d.year), kw = d.kpiWeight === undefined || d.kpiWeight === '' ? 70 : Number(d.kpiWeight);
  if (!(year >= 2024 && year <= 2100)) fail_('bad_value');
  if (!(kw >= 0 && kw <= 100)) fail_('bad_value');
  ['goalsDue', 'midDue', 'reviewDue'].forEach(function (k) { if (d[k] && !isoDate_(d[k])) fail_('bad_date'); });
  return withLock_(function () {
    var row = d.id ? cycleById_(d.id) : null, created = !row, now = new Date().toISOString();
    if (d.id && !row) fail_('not_found');
    if (!row) row = { id: newId_('Y'), ref: nextRef_('perf_cycle', refsOf_(SHEETS.CYC)), status: 'setup', createdBy: me.id, createdAt: now };
    row.year = year; row.nameAr = str_(d.nameAr, 80) || ('تقييم الأداء ' + year); row.nameEn = str_(d.nameEn, 80) || ('Performance ' + year);
    row.type = d.type === 'probation' ? 'probation' : 'annual'; row.kpiWeight = kw; row.compWeight = 100 - kw;
    row.goalsDue = isoDate_(d.goalsDue); row.midDue = isoDate_(d.midDue); row.reviewDue = isoDate_(d.reviewDue); row.updatedAt = now;
    if (created) append_(SHEETS.CYC, row); else update_(SHEETS.CYC, row);
    audit_(me.id, created ? 'perf_cycle_create' : 'perf_cycle_update', row.id, { ref: row.ref });
    return { ok: true, cycle: publicCycle_(row) };
  });
}
function api_perfCycleList(req, me) {
  return { ok: true, rows: readAll_(SHEETS.CYC).filter(function (c) { return c.status !== 'deleted'; }).sort(function (a, b) { return String(a.createdAt) < String(b.createdAt) ? 1 : -1; }).map(publicCycle_) };
}
/** HR moves the cycle. Closing sets each final rating not calibrated by hand to the rounded overall. */
function api_perfCycleStage(req, me) {
  if (PERF_STAGES.indexOf(req.status) < 0) fail_('bad_value');
  return withLock_(function () {
    var c = cycleById_(req.id);
    if (!c) fail_('not_found');
    if (c.status === 'closed') fail_('cycle_closed'); // closed is final: results were published and acknowledged
    var now = new Date().toISOString();
    if (req.status === 'closed') {
      var upd = [];
      readAll_(SHEETS.REV).forEach(function (r) {
        if (r.cycleId !== c.id) return;
        if (r.finalRating === '' && r.overall !== '') r.finalRating = Math.round(Number(r.overall));
        r.stage = 'done'; r.updatedAt = now; upd.push(r);
      });
      updateMany_(SHEETS.REV, upd);
    }
    c.status = req.status; c.updatedAt = now;
    update_(SHEETS.CYC, c);
    audit_(me.id, 'perf_cycle_stage', c.id, { ref: c.ref, status: c.status });
    return { ok: true, cycle: publicCycle_(c) };
  });
}

// ---------------- KPIs ----------------

/** The manager (or HR) sets the whole KPI list for one person: 3 to 7 KPIs, weights 5 to 50, total 100. */
function api_kpiSave(req, me) {
  var list = req.kpis || [];
  if (!Array.isArray(list) || list.length < 3 || list.length > 7) fail_('kpi_count');
  var sum = 0;
  list.forEach(function (k) {
    var w = Number(k.weight);
    if (!(w >= 5 && w <= 50) || Math.round(w) !== w) fail_('kpi_weight');
    if (!str_(k.titleAr, 150)) fail_('missing_fields');
    sum += w;
  });
  if (sum !== 100) fail_('kpi_total');
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[req.empId], cycle = cycleById_(req.cycleId);
    if (!emp) fail_('not_found');
    needStage_(cycle, ['setup', 'goals']);
    if (emp.id === me.id) fail_('cannot_edit_own');
    if (!canManagePerf_(me, emp, ctx)) fail_('forbidden');
    var now = new Date().toISOString(), existing = kpisOf_(cycle.id, emp.id), byId = {}, keep = {}, upd = [], add = [];
    existing.forEach(function (k) { byId[k.id] = k; });
    var refs = nextRefs_('kpi', list.filter(function (k) { return !byId[k.id]; }).length, refsOf_(SHEETS.KPI)), ri = 0;
    list.forEach(function (k) {
      var row = byId[k.id];
      if (!row) { row = { id: newId_('K'), ref: refs[ri++], cycleId: cycle.id, empId: emp.id, midStatus: '', midNote: '', actual: '', selfScore: '', selfComment: '', mgrScore: '', mgrComment: '', createdAt: now }; add.push(row); }
      else { keep[row.id] = 1; upd.push(row); }
      row.titleAr = str_(k.titleAr, 150); row.titleEn = str_(k.titleEn, 150); row.measure = str_(k.measure, 300); row.target = str_(k.target, 60);
      row.unit = str_(k.unit, 20); row.weight = Number(k.weight); row.status = 'agreed'; row.setBy = me.id; row.updatedAt = now;
    });
    existing.forEach(function (k) { if (!keep[k.id]) { k.status = 'deleted'; k.updatedAt = now; upd.push(k); } });
    updateMany_(SHEETS.KPI, upd);
    appendMany_(SHEETS.KPI, add);
    audit_(me.id, 'kpi_set', emp.id, { cycle: cycle.ref, count: list.length });
    return { ok: true, kpis: kpisOf_(cycle.id, emp.id).map(function (k) { return publicKpi_(k, true); }) };
  });
}

function api_kpiMid(req, me) {
  if (MID_STATUS.indexOf(req.midStatus) < 0) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), k = findBy_(SHEETS.KPI, 'id', req.kpiId);
    if (!k || k.status === 'deleted') fail_('not_found');
    var cycle = cycleById_(k.cycleId), emp = ctx.emps[k.empId];
    needStage_(cycle, ['midyear']);
    if (emp.id === me.id || !canManagePerf_(me, emp, ctx)) fail_('forbidden');
    k.midStatus = req.midStatus; k.midNote = str_(req.midNote, 500); k.updatedAt = new Date().toISOString();
    update_(SHEETS.KPI, k);
    return { ok: true };
  });
}

// ---------------- the review ----------------

function scoreReview_(cycle, kpis, comps) {
  var kw = Number(cycle.kpiWeight), cw = Number(cycle.compWeight), ws = 0, wsum = 0, cs = [];
  kpis.forEach(function (k) { if (k.mgrScore !== '' && k.mgrScore != null) { ws += Number(k.weight) * Number(k.mgrScore); wsum += Number(k.weight); } });
  Object.keys(comps || {}).forEach(function (c) { if (score_(comps[c])) cs.push(Number(comps[c])); });
  var kpiScore = wsum ? ws / wsum : null, compScore = cs.length ? cs.reduce(function (a, b) { return a + b; }, 0) / cs.length : null;
  var overall = kpiScore != null && compScore != null ? (kw * kpiScore + cw * compScore) / 100 : kpiScore != null ? kpiScore : compScore;
  var r = function (n) { return n == null ? '' : Math.round(n * 100) / 100; };
  return { kpiScore: r(kpiScore), compScore: r(compScore), overall: r(overall) };
}

function api_reviewSelf(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), cycle = cycleById_(req.cycleId), emp = ctx.emps[me.id];
    needStage_(cycle, ['review']);
    var x = reviewRow_(cycle, me.id, me), r = x.row;
    if (r.selfAt || r.stage !== 'self') fail_('already_submitted');
    var kpis = kpisOf_(cycle.id, me.id), byId = {};
    kpis.forEach(function (k) { byId[k.id] = k; });
    (req.kpis || []).forEach(function (v) {
      var k = byId[v.id]; if (!k) return;
      k.actual = str_(v.actual, 60); k.selfScore = score_(v.selfScore) || ''; k.selfComment = str_(v.selfComment, 500);
    });
    var comps = {}, list = compsFor_(emp, ctx);
    list.forEach(function (c) { var s = score_((req.comps || {})[c]); if (s) comps[c] = s; });
    r.selfCompJson = JSON.stringify(comps); r.selfComment = str_(req.comment, 1500); r.updatedAt = new Date().toISOString();
    if (req.submit) {
      if (kpis.some(function (k) { return !score_(k.selfScore); }) || list.some(function (c) { return !comps[c]; })) fail_('incomplete');
      r.selfAt = r.updatedAt; r.stage = 'manager';
    }
    updateMany_(SHEETS.KPI, kpis);
    saveRow_(SHEETS.REV, x);
    audit_(me.id, req.submit ? 'review_self_submit' : 'review_self_save', me.id, { ref: r.ref });
    return { ok: true, review: publicReview_(r, cycle, 'self') };
  });
}

function api_reviewManager(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), cycle = cycleById_(req.cycleId), emp = ctx.emps[req.empId];
    if (!emp) fail_('not_found');
    needStage_(cycle, ['review']);
    if (emp.id === me.id) fail_('cannot_edit_own');
    if (!canManagePerf_(me, emp, ctx)) fail_('forbidden');
    var x = reviewRow_(cycle, emp.id, me), r = x.row;
    if (r.mgrAt) fail_('already_submitted');
    var kpis = kpisOf_(cycle.id, emp.id), byId = {};
    kpis.forEach(function (k) { byId[k.id] = k; });
    (req.kpis || []).forEach(function (v) { var k = byId[v.id]; if (!k) return; k.mgrScore = score_(v.mgrScore) || ''; k.mgrComment = str_(v.mgrComment, 500); });
    var comps = {}, list = compsFor_(emp, ctx);
    list.forEach(function (c) { var s = score_((req.comps || {})[c]); if (s) comps[c] = s; });
    r.mgrCompJson = JSON.stringify(comps); r.mgrComment = str_(req.comment, 1500); r.mgrBy = me.id; r.updatedAt = new Date().toISOString();
    var sc = scoreReview_(cycle, kpis, comps);
    r.kpiScore = sc.kpiScore; r.compScore = sc.compScore; r.overall = sc.overall;
    if (req.submit) {
      if (kpis.some(function (k) { return !score_(k.mgrScore); }) || list.some(function (c) { return !comps[c]; }) || !r.mgrComment) fail_('incomplete');
      r.mgrAt = r.updatedAt; r.stage = 'calibration';
    }
    updateMany_(SHEETS.KPI, kpis);
    saveRow_(SHEETS.REV, x);
    audit_(me.id, req.submit ? 'review_manager_submit' : 'review_manager_save', emp.id, { ref: r.ref, overall: r.overall });
    return { ok: true, review: publicReview_(r, cycle, 'manager') };
  });
}

/** HR sets the final rating. A rating other than the rounded overall needs a note and shows as adjusted. */
function api_perfCalibrate(req, me) {
  var fr = score_(req.finalRating);
  if (!fr) fail_('bad_value');
  return withLock_(function () {
    var r = findBy_(SHEETS.REV, 'id', req.reviewId);
    if (!r) fail_('not_found');
    var cycle = cycleById_(r.cycleId);
    needStage_(cycle, ['calibration']);
    if (r.empId === me.id) fail_('cannot_edit_own');
    if (!r.mgrAt) fail_('incomplete');
    var note = str_(req.note, 500);
    if (fr !== Math.round(Number(r.overall)) && !note) fail_('note_required');
    r.finalRating = fr; r.calibrationNote = fr !== Math.round(Number(r.overall)) ? note : ''; r.calibratedBy = me.id; r.updatedAt = new Date().toISOString();
    update_(SHEETS.REV, r);
    audit_(me.id, 'perf_calibrate', r.empId, { ref: r.ref, overall: r.overall, finalRating: fr });
    return { ok: true };
  });
}

function api_reviewAck(req, me) {
  return withLock_(function () {
    var r = findBy_(SHEETS.REV, 'id', req.reviewId);
    if (!r || r.empId !== me.id) fail_('not_found');
    needStage_(cycleById_(r.cycleId), ['closed']);
    if (r.acknowledgedAt) fail_('already_submitted');
    r.acknowledgedAt = new Date().toISOString(); r.employeeComment = str_(req.comment, 1000); r.updatedAt = r.acknowledgedAt;
    update_(SHEETS.REV, r);
    audit_(me.id, 'review_ack', me.id, { ref: r.ref });
    return { ok: true };
  });
}

// ---------------- what each person sees ----------------

function api_myPerformance(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[me.id] || me, cycle = currentCycle_();
  var out = { ok: true, cycle: publicCycle_(cycle), competencies: compsFor_(emp, ctx), kpis: [], review: null, last: null, tasks: [], my360: [] };
  if (cycle) {
    var closed = cycle.status === 'closed';
    out.kpis = kpisOf_(cycle.id, me.id).map(function (k) { return publicKpi_(k, closed); });
    out.review = publicReview_(reviewOf_(cycle.id, me.id), cycle, 'self');
  }
  // the latest closed result
  var cycles = {}; readAll_(SHEETS.CYC).forEach(function (c) { cycles[c.id] = c; });
  var done = readAll_(SHEETS.REV).filter(function (r) { var c = cycles[r.cycleId]; return r.empId === me.id && c && c.status === 'closed' && r.finalRating !== ''; })
    .sort(function (a, b) { return String(cycles[a.cycleId].createdAt) < String(cycles[b.cycleId].createdAt) ? 1 : -1; })[0];
  if (done) out.last = { cycle: publicCycle_(cycles[done.cycleId]), review: publicReview_(done, cycles[done.cycleId], 'self'),
    kpis: kpisOf_(done.cycleId, me.id).map(function (k) { return publicKpi_(k, true); }) };
  readAll_(SHEETS.FB).forEach(function (f) {
    var c = cycles[f.cycleId];
    if (!c) return;
    if (f.raterId === me.id && f.status === 'invited' && c.status !== 'closed') {
      var s = ctx.emps[f.subjectId];
      out.tasks.push({ id: f.id, ref: f.ref, relation: f.relation, subject: s ? { name: s.name, title: s.title } : null, competencies: s ? compsFor_(s, ctx) : COMPETENCIES, cycle: publicCycle_(c) });
    }
    if (f.subjectId === me.id && c.status === 'closed' && !out.my360.some(function (x) { return x.id === c.id; })) out.my360.push(publicCycle_(c));
  });
  return out;
}

/** A manager's people in the current (or given) cycle, with where each one stands. */
function api_perfTeam(req, me) {
  var ctx = orgCtx_(), cycle = req.cycleId ? cycleById_(req.cycleId) : currentCycle_();
  if (!cycle) return { ok: true, cycle: null, rows: [] };
  var hr = isHr_(me), kpis = readAll_(SHEETS.KPI), revs = readAll_(SHEETS.REV);
  var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) {
    return e.status === 'active' && e.id !== me.id && (req.all && hr ? true : manages_(me, e, ctx));
  }).map(function (e) {
    var ks = kpis.filter(function (k) { return k.cycleId === cycle.id && k.empId === e.id && k.status !== 'deleted'; });
    var r = revs.filter(function (x) { return x.cycleId === cycle.id && x.empId === e.id; })[0];
    return { emp: empCard_(e), direct: e.managerId === me.id, kpiCount: ks.length, kpiWeight: ks.reduce(function (t, k) { return t + Number(k.weight); }, 0),
      midDone: ks.length > 0 && ks.every(function (k) { return k.midStatus; }), selfDone: !!(r && r.selfAt), mgrDone: !!(r && r.mgrAt),
      overall: r && r.overall !== '' ? Number(r.overall) : null, finalRating: r && (cycle.status === 'closed' || hr) && r.finalRating !== '' ? Number(r.finalRating) : null,
      acknowledged: !!(r && r.acknowledgedAt) };
  });
  return { ok: true, cycle: publicCycle_(cycle), rows: rows };
}

function api_perfEmp(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[req.empId], cycle = req.cycleId ? cycleById_(req.cycleId) : currentCycle_();
  if (!emp || !cycle) fail_('not_found');
  if (emp.id === me.id || !canManagePerf_(me, emp, ctx)) fail_('forbidden');
  var view = isHr_(me) ? 'hr' : 'manager';
  var fb = readAll_(SHEETS.FB).filter(function (f) { return f.cycleId === cycle.id && f.subjectId === emp.id; });
  return { ok: true, cycle: publicCycle_(cycle), emp: empCard_(emp), competencies: compsFor_(emp, ctx),
    kpis: kpisOf_(cycle.id, emp.id).map(function (k) { return publicKpi_(k, true); }), review: publicReview_(reviewOf_(cycle.id, emp.id), cycle, view),
    fb360: { invited: fb.length, submitted: fb.filter(function (f) { return f.status === 'submitted'; }).length } };
}

/** HR: progress of every step, the rating distribution and department averages. */
function api_perfOverview(req, me) {
  var cycle = req.cycleId ? cycleById_(req.cycleId) : currentCycle_();
  if (!cycle) return { ok: true, cycle: null };
  var team = api_perfTeam({ cycleId: cycle.id, all: true }, me).rows;
  var revs = readAll_(SHEETS.REV).filter(function (r) { return r.cycleId === cycle.id; });
  var dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, byDept = {};
  team.forEach(function (x) {
    var r = revs.filter(function (v) { return v.empId === x.emp.id; })[0];
    var rating = r && r.finalRating !== '' ? Number(r.finalRating) : r && r.overall !== '' ? Math.round(Number(r.overall)) : null;
    if (rating) dist[rating]++;
    var d = x.emp.department || '-', g = byDept[d] = byDept[d] || { department: d, people: 0, rated: 0, sum: 0 };
    g.people++; if (r && r.overall !== '') { g.rated++; g.sum += Number(r.overall); }
    x.reviewId = r ? r.id : null; x.calibrated = !!(r && r.calibratedBy); x.adjusted = !!(r && r.calibrationNote);
  });
  var fb = readAll_(SHEETS.FB).filter(function (f) { return f.cycleId === cycle.id; });
  var n = team.length, cnt = function (f) { return team.filter(f).length; };
  return { ok: true, cycle: publicCycle_(cycle), rows: team, distribution: dist,
    departments: Object.keys(byDept).map(function (k) { var g = byDept[k]; return { department: g.department, people: g.people, rated: g.rated, average: g.rated ? Math.round(g.sum / g.rated * 100) / 100 : null }; }),
    progress: { people: n, kpisSet: cnt(function (x) { return x.kpiCount >= 3 && x.kpiWeight === 100; }), midDone: cnt(function (x) { return x.midDone; }),
      selfDone: cnt(function (x) { return x.selfDone; }), mgrDone: cnt(function (x) { return x.mgrDone; }), acknowledged: cnt(function (x) { return x.acknowledged; }) },
    fb360: { invited: fb.length, submitted: fb.filter(function (f) { return f.status === 'submitted'; }).length } };
}

// ---------------- 360 ----------------

/** HR invites raters: self, the manager, all direct reports, and peers (given, or up to 4 from the same department). */
function api_feedbackLaunch(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), cycle = cycleById_(req.cycleId);
    needStage_(cycle, ['setup', 'goals', 'midyear', 'review', 'calibration']);
    var active = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; });
    var subjects = (req.subjects && req.subjects.length ? req.subjects.map(function (id) { return ctx.emps[id]; }).filter(Boolean)
      : active.filter(function (e) { return active.some(function (x) { return x.managerId === e.id; }); }));
    var existing = {}, add = [], now = new Date().toISOString();
    readAll_(SHEETS.FB).forEach(function (f) { if (f.cycleId === cycle.id) existing[f.subjectId + '|' + f.raterId] = 1; });
    subjects.forEach(function (s) {
      var raters = [[s.id, 'self']];
      if (s.managerId && ctx.emps[s.managerId] && ctx.emps[s.managerId].status === 'active') raters.push([s.managerId, 'manager']);
      active.forEach(function (e) { if (e.managerId === s.id) raters.push([e.id, 'report']); });
      var peers = (req.peers && req.peers[s.id]) || active.filter(function (e) {
        return e.id !== s.id && e.id !== s.managerId && e.managerId !== s.id && e.departmentId && e.departmentId === s.departmentId;
      }).slice(0, 4).map(function (e) { return e.id; });
      peers.forEach(function (id) { if (ctx.emps[id] && id !== s.id) raters.push([id, 'peer']); });
      raters.forEach(function (x) {
        if (existing[s.id + '|' + x[0]]) return;
        existing[s.id + '|' + x[0]] = 1;
        add.push({ id: newId_('B'), ref: '', cycleId: cycle.id, subjectId: s.id, raterId: x[0], relation: x[1], status: 'invited', answersJson: '', comment: '', createdAt: now, submittedAt: '' });
      });
    });
    var refs = nextRefs_('feedback', add.length, refsOf_(SHEETS.FB));
    add.forEach(function (f, i) { f.ref = refs[i]; });
    appendMany_(SHEETS.FB, add);
    audit_(me.id, 'fb360_launch', cycle.id, { subjects: subjects.length, invitations: add.length });
    return { ok: true, subjects: subjects.length, invitations: add.length };
  });
}

function api_feedbackSubmit(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), f = findBy_(SHEETS.FB, 'id', req.id);
    if (!f || f.raterId !== me.id) fail_('not_found');
    if (f.status !== 'invited') fail_('already_submitted');
    var cycle = cycleById_(f.cycleId);
    if (!cycle || cycle.status === 'closed') fail_('stage_closed');
    var subject = ctx.emps[f.subjectId], list = subject ? compsFor_(subject, ctx) : COMPETENCIES, ans = {};
    list.forEach(function (c) { var s = score_((req.answers || {})[c]); if (s) ans[c] = s; });
    if (list.some(function (c) { return !ans[c]; })) fail_('incomplete');
    f.answersJson = JSON.stringify(ans); f.comment = str_(req.comment, 1000); f.status = 'submitted'; f.submittedAt = new Date().toISOString();
    update_(SHEETS.FB, f);
    audit_(me.id, 'fb360_submit', f.subjectId, { ref: f.ref }); // who rated is in the sheet for audit; the API never returns it
    return { ok: true };
  });
}

/**
 * Aggregated 360 for a subject: to the subject and their manager once the cycle is closed, to HR at any time.
 * Self and manager by relation; peers and reports only as groups of 3 or more; comments without names, shuffled.
 */
function api_feedbackResults(req, me) {
  var ctx = orgCtx_(), cycle = cycleById_(req.cycleId), subject = ctx.emps[req.subjectId || me.id];
  if (!cycle || !subject) fail_('not_found');
  var hr = isHr_(me), self = subject.id === me.id, mgr = manages_(me, subject, ctx);
  if (!hr && !self && !mgr) fail_('forbidden');
  if (!hr && cycle.status !== 'closed') fail_('stage_closed');
  var list = compsFor_(subject, ctx), rows = readAll_(SHEETS.FB).filter(function (f) { return f.cycleId === cycle.id && f.subjectId === subject.id && f.status === 'submitted'; });
  var groups = {}, comments = [];
  ['self', 'manager', 'peer', 'report'].forEach(function (rel) {
    var g = rows.filter(function (f) { return f.relation === rel; }), n = g.length;
    var shown = n > 0 && (rel === 'self' || rel === 'manager' || n >= FB_MIN_GROUP);
    var avg = {};
    if (shown) list.forEach(function (c) { var v = g.map(function (f) { return Number(parseJson_(f.answersJson, {})[c]) || 0; }).filter(Boolean); avg[c] = v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 100) / 100 : null; });
    groups[rel] = { n: n, shown: shown, avg: shown ? avg : null };
    if (shown && rel !== 'self') g.forEach(function (f) { if (f.comment) comments.push(f.comment); });
  });
  // the average of everyone who is not the subject, from shown groups only
  var others = {};
  list.forEach(function (c) {
    var vals = [];
    ['manager', 'peer', 'report'].forEach(function (rel) { if (groups[rel].shown) rows.filter(function (f) { return f.relation === rel; }).forEach(function (f) { var v = Number(parseJson_(f.answersJson, {})[c]); if (v) vals.push(v); }); });
    others[c] = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 100) / 100 : null;
  });
  comments.sort(function () { return 0.5 - Math.random(); });
  if (!self) audit_(me.id, 'fb360_view', subject.id, { cycle: cycle.ref });
  return { ok: true, cycle: publicCycle_(cycle), subject: empCard_(subject), competencies: list, groups: groups, others: others, comments: comments, minGroup: FB_MIN_GROUP };
}

/**
 * 1:1 meetings and continuous goals (2026-10-19, gap list item 5; seen in HiBob and Workday, rebuilt as our own).
 * Tabs oneOnOnes and goals. Separate from the review cycle: nothing here is rated.
 *  - 1:1: the manager (anyone in the person's manager chain) or HR books it; both sides add agenda items; shared notes and
 *    action items are seen by both; private notes are seen only by the person who wrote them (not HR, not the employee).
 *  - Goals: the employee sets their own, or their manager sets them; both check in progress (0-100) with a note; the history
 *    of check-ins is kept. Managers and HR see the goals of the people they look after.
 */
function ooTeam_(me, ctx) {
  return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.id !== me.id && (isHr_(me) || manages_(me, e, ctx)); });
}
function ooCanSee_(me, empId, ctx) {
  if (empId === me.id) return true;
  var e = ctx.emps[empId];
  return !!e && (isHr_(me) || manages_(me, e, ctx));
}
function publicOO_(x, me, ctx) {
  var mine = x.privateBy === me.id;
  return { id: x.id, emp: empCard_(ctx.emps[x.empId]), manager: empCard_(ctx.emps[x.managerId]), date: String(x.date).slice(0, 10), status: x.status,
    agenda: parseJson_(x.agendaJson, []), notes: x.notesShared || '', actions: parseJson_(x.actionsJson, []), privateNote: mine ? x.notesPrivate || '' : undefined,
    canEdit: x.managerId === me.id || isHr_(me), isMine: x.empId === me.id };
}
function api_oneOnOneList(req, me) {
  var ctx = orgCtx_(), empId = req.empId || me.id;
  if (!ooCanSee_(me, empId, ctx)) fail_('forbidden');
  var rows = readAll_(SHEETS.OOO).filter(function (x) { return x.empId === empId && x.status !== 'cancelled'; }).map(function (x) { return publicOO_(x, me, ctx); })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return { ok: true, empId: empId, rows: rows, team: ooTeam_(me, ctx).map(empCard_) };
}
function api_oneOnOneSave(req, me) {
  var ctx = orgCtx_(), e = ctx.emps[req.empId], date = isoDate_(req.date);
  if (!e || e.id === me.id || !(isHr_(me) || manages_(me, e, ctx))) fail_('forbidden');
  if (!date) fail_('bad_date');
  return withLock_(function () {
    var now = new Date().toISOString(), x = req.id ? findBy_(SHEETS.OOO, 'id', req.id) : null;
    if (req.id && (!x || x.empId !== e.id)) fail_('not_found');
    if (!x) x = { id: newId_('M'), empId: e.id, managerId: me.id, status: 'planned', agendaJson: '[]', actionsJson: '[]', notesShared: '', notesPrivate: '', privateBy: '', createdAt: now };
    x.date = date; if (req.cancel) x.status = 'cancelled'; x.updatedAt = now;
    if (x._row) update_(SHEETS.OOO, x); else append_(SHEETS.OOO, x);
    audit_(me.id, 'one_on_one_save', e.id, { date: date });
    return { ok: true, id: x.id };
  });
}
/** Either side adds an agenda item; the manager (or HR) writes notes, action items, and closes it. */
function api_oneOnOneUpdate(req, me) {
  var ctx = orgCtx_();
  return withLock_(function () {
    var x = findBy_(SHEETS.OOO, 'id', req.id);
    if (!x || x.status === 'cancelled') fail_('not_found');
    var side = x.empId === me.id ? 'emp' : (x.managerId === me.id || isHr_(me) || (ctx.emps[x.empId] && manages_(me, ctx.emps[x.empId], ctx))) ? 'mgr' : '';
    if (!side) fail_('forbidden');
    var now = new Date().toISOString();
    if (str_(req.agendaItem, 300)) { var ag = parseJson_(x.agendaJson, []); if (ag.length >= 30) fail_('bad_value'); ag.push({ text: str_(req.agendaItem, 300), by: side, at: now }); x.agendaJson = JSON.stringify(ag); }
    if (req.actionDone != null) { var ac = parseJson_(x.actionsJson, []), i = Number(req.actionDone); if (!ac[i]) fail_('not_found'); ac[i].done = !ac[i].done; x.actionsJson = JSON.stringify(ac); }
    if (side === 'mgr') {
      if ('notes' in req) x.notesShared = str_(req.notes, 4000);
      if ('privateNote' in req) { x.notesPrivate = str_(req.privateNote, 4000); x.privateBy = me.id; }
      if (str_(req.actionItem, 300)) { var a2 = parseJson_(x.actionsJson, []); a2.push({ text: str_(req.actionItem, 300), owner: req.actionOwner === 'mgr' ? 'mgr' : 'emp', done: false }); x.actionsJson = JSON.stringify(a2); }
      if (req.done) x.status = 'done';
    } else if ('notes' in req || 'privateNote' in req || req.actionItem || req.done) fail_('forbidden');
    x.updatedAt = now; update_(SHEETS.OOO, x);
    return { ok: true, row: publicOO_(x, me, ctx) };
  });
}
function publicGoal_(g, me) {
  var ci = parseJson_(g.checkinsJson, []);
  return { id: g.id, empId: g.empId, title: g.title, measure: g.measure || '', dueDate: g.dueDate ? String(g.dueDate).slice(0, 10) : '', progress: Number(g.progress) || 0,
    status: g.status, checkins: ci.slice(-10), setBy: g.createdBy === g.empId ? 'self' : 'manager', canEdit: g.empId === me.id || g.createdBy === me.id || isHr_(me) };
}
function api_goalList(req, me) {
  var ctx = orgCtx_(), empId = req.empId || me.id;
  if (!ooCanSee_(me, empId, ctx)) fail_('forbidden');
  return { ok: true, empId: empId, rows: readAll_(SHEETS.GOAL).filter(function (g) { return g.empId === empId && g.status !== 'deleted'; }).map(function (g) { return publicGoal_(g, me); }),
    team: ooTeam_(me, ctx).map(empCard_) };
}
function api_goalSave(req, me) {
  var ctx = orgCtx_(), d = req.goal || {}, empId = d.empId || me.id;
  if (!ooCanSee_(me, empId, ctx)) fail_('forbidden');
  var title = str_(d.title, 200);
  if (!title) fail_('missing_fields');
  var due = d.dueDate ? isoDate_(d.dueDate) : '';
  if (d.dueDate && !due) fail_('bad_date');
  return withLock_(function () {
    var now = new Date().toISOString(), g = d.id ? findBy_(SHEETS.GOAL, 'id', d.id) : null;
    if (d.id && (!g || g.empId !== empId)) fail_('not_found');
    if (!g) { if (readAll_(SHEETS.GOAL).filter(function (x) { return x.empId === empId && x.status === 'active'; }).length >= 15) fail_('too_many');
      g = { id: newId_('G'), empId: empId, progress: 0, status: 'active', checkinsJson: '[]', createdBy: me.id, createdAt: now }; }
    g.title = title; g.measure = str_(d.measure, 300); g.dueDate = due; g.updatedAt = now;
    if (d.status === 'deleted' || d.status === 'dropped') g.status = d.status;
    if (g._row) update_(SHEETS.GOAL, g); else append_(SHEETS.GOAL, g);
    return { ok: true, goal: publicGoal_(g, me) };
  });
}
function api_goalCheckIn(req, me) {
  var ctx = orgCtx_(), p = Math.round(Number(req.progress));
  if (!(p >= 0 && p <= 100)) fail_('bad_value');
  return withLock_(function () {
    var g = findBy_(SHEETS.GOAL, 'id', req.id);
    if (!g || g.status === 'deleted') fail_('not_found');
    if (!ooCanSee_(me, g.empId, ctx)) fail_('forbidden');
    var ci = parseJson_(g.checkinsJson, []), now = new Date().toISOString();
    ci.push({ at: now, by: (ctx.emps[me.id] || me).name, progress: p, note: str_(req.note, 500) }); if (ci.length > 60) ci = ci.slice(-60);
    g.checkinsJson = JSON.stringify(ci); g.progress = p; g.status = p >= 100 ? 'done' : 'active'; g.updatedAt = now;
    update_(SHEETS.GOAL, g);
    return { ok: true, goal: publicGoal_(g, me) };
  });
}
hrisHook_('tasks', function (me, ctx, add) {
  var t = today_(), soon = addDays_(t, 2);
  add('one_on_one', readAll_(SHEETS.OOO).filter(function (x) { return x.status === 'planned' && (x.empId === me.id || x.managerId === me.id) && String(x.date).slice(0, 10) >= t && String(x.date).slice(0, 10) <= soon; }).length, { tab: 'file' });
});
