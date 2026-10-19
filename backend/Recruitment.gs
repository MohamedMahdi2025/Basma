/**
 * Recruitment (التوظيف), Wave 2, 2026-10-14: requisition RQ -> candidates CND -> interviews INT -> offer OFR -> hire.
 *  - Requisition: HR, or a manager for their own people, asks for headcount; someone else (HR, admin or an executive)
 *    approves it. 'saudiOnly' marks a localised job (Nitaqat / Qiwa localisation decisions): no offer to a non-Saudi.
 *  - Candidates: PDPL consent is recorded before any data is kept; contact data is shown to HR only; rejected and
 *    withdrawn candidates get a purge date (1 year) and HR can erase their personal data ('erased').
 *  - Interviews: HR schedules a panel (1-6 employees); each panel member scores 1-5 with a recommendation. A panel member
 *    sees the others' scores only after submitting their own (no anchoring). HR and the hiring manager see all.
 *  - Offer: HR prepares the package and terms; Labour Law checks (Art. 37 expat fixed-term, Art. 53 probation <= 180,
 *    Art. 109 leave >= 21); a second person (hr role or payroll, never the preparer) approves; over the requisition budget
 *    needs the reason. Sent, then accepted or declined (recorded by HR); recruitOfferLetter gives the letter data.
 *  - Hire: an accepted offer creates the employee (api_empSave), the job and contract (api_hrEmpSave), the package as a
 *    PENDING salary proposal (api_hrCompPropose: payroll still approves it) and the 30-60-90 plan (api_onboardStart).
 *    Each of those takes the lock itself, so recruitHire never runs inside withLock_; the new employee id is written to the
 *    offer at once, so a retry after a failure continues instead of creating a second person.
 */

var RCT_SOURCES = ['referral', 'linkedin', 'jadarat', 'bayt', 'website', 'agency', 'walk_in', 'internal', 'other'];
var RCT_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn', 'erased'];
var RCT_RECS = ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'];
var RCT_PURGE_DAYS = 365;

function rctCanManage_(me) { return isHr_(me); }
function rctSeesPay_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }
function rctCanDecideReq_(me, q) { return !!me && q.status === 'pending' && q.requestedBy !== me.id && (isHr_(me) || hasRole_(me, 'executive')); }
function rctCanDecideOffer_(me, o) { return !!me && o.status === 'pending' && o.preparedBy !== me.id && rctSeesPay_(me); }
function rctIsSaudi_(c) { return bool_(c.isSaudi) || SAUDI_RE.test(String(c.nationality || '').trim()); }
/** The requisitions a person may look at: HR / executives all; a hiring manager or the requester their own. */
function rctReqVisible_(me, q, ctx) {
  if (isHr_(me) || hasRole_(me, 'executive')) return true;
  if (q.hiringManagerId === me.id || q.requestedBy === me.id) return true;
  var m = ctx.emps[q.hiringManagerId];
  return !!m && manages_(me, m, ctx);
}
function rctPanel_(i) { return parseJson_(i.panelJson, []); }

function rctPublicReq_(q, ctx, me) {
  var mgr = ctx.emps[q.hiringManagerId], dept = ctx.depts[q.departmentId], v = { id: q.id, ref: q.ref, titleAr: q.titleAr, titleEn: q.titleEn,
    departmentId: q.departmentId, department: dept ? dept.nameAr : '', positionId: q.positionId, headcount: Number(q.headcount) || 1, filled: Number(q.filled) || 0,
    employmentType: q.employmentType, contractType: q.contractType, reason: q.reason, replacesEmpId: q.replacesEmpId, hiringManager: empCard_(mgr),
    saudiOnly: bool_(q.saudiOnly), targetDate: String(q.targetDate || '').slice(0, 10), justification: q.justification, status: q.status,
    requestedBy: empCard_(ctx.emps[q.requestedBy]), decidedBy: empCard_(ctx.emps[q.decidedBy]), decidedAt: q.decidedAt, closedNote: q.closedNote,
    history: parseJson_(q.stepsJson, []).map(function (h) { var b = ctx.emps[h.by]; return { decision: h.decision, note: h.note, at: h.at, by: b ? b.name : '' }; }),
    createdAt: q.createdAt, canDecide: rctCanDecideReq_(me, q), canManage: rctCanManage_(me) };
  if (rctSeesPay_(me) || hasRole_(me, 'executive')) { v.budgetMin = Number(q.budgetMin) || 0; v.budgetMax = Number(q.budgetMax) || 0; }
  return v;
}

function rctPublicCand_(c, ctx, me, full) {
  var hr = rctCanManage_(me), v = { id: c.id, ref: c.ref, reqId: c.reqId, name: c.name, nameEn: c.nameEn, nationality: c.nationality, isSaudi: rctIsSaudi_(c),
    gender: c.gender, source: c.source, currentTitle: c.currentTitle, currentEmployer: c.currentEmployer, yearsExperience: Number(c.yearsExperience) || 0,
    noticeDays: c.noticeDays === '' ? '' : Number(c.noticeDays), stage: c.stage, rating: c.rating === '' ? null : Number(c.rating), rejectReason: c.rejectReason,
    empId: c.empId || '', createdAt: c.createdAt, updatedAt: c.updatedAt };
  if (hr) {
    v.email = c.email; v.phone = String(c.phone || ''); v.birthDate = String(c.birthDate || '').slice(0, 10); v.cvRef = c.cvRef; v.note = c.note;
    v.referredBy = empCard_(ctx.emps[c.referredBy]); v.consentAt = c.consentAt; v.purgeAfter = String(c.purgeAfter || '').slice(0, 10);
  }
  if (rctSeesPay_(me)) v.expectedSalary = c.expectedSalary === '' ? null : Number(c.expectedSalary);
  if (full) v.history = parseJson_(c.historyJson, []).map(function (h) { var b = ctx.emps[h.by]; return { from: h.from, to: h.to, note: hr ? h.note : '', at: h.at, by: b ? b.name : '' }; });
  return v;
}

function rctPublicInterview_(i, ctx, me) {
  var panel = rctPanel_(i), fb = parseJson_(i.feedbackJson, []), q = findBy_(SHEETS.REQN, 'id', i.reqId);
  var mineDone = fb.some(function (f) { return f.by === me.id; });
  var seeAll = rctCanManage_(me) || (q && q.hiringManagerId === me.id) || mineDone;
  return { id: i.id, ref: i.ref, candidateId: i.candidateId, reqId: i.reqId, at: i.at, durationMin: Number(i.durationMin) || 0, mode: i.mode, location: i.location,
    panel: panel.map(function (p) { return empCard_(ctx.emps[p]); }), status: i.status, onPanel: panel.indexOf(me.id) >= 0, myFeedbackDone: mineDone,
    feedback: fb.filter(function (f) { return seeAll || f.by === me.id; }).map(function (f) { var b = ctx.emps[f.by];
      return { by: b ? b.name : '', byId: f.by, score: f.score, criteria: f.criteria, recommendation: f.recommendation, comment: f.comment, at: f.at }; }),
    feedbackCount: fb.length, panelSize: panel.length };
}

function rctOfferTotal_(o) {
  var other = parseJson_(o.otherJson, {}), t = (Number(o.basic) || 0) + (Number(o.housing) || 0) + (Number(o.transport) || 0);
  Object.keys(other).forEach(function (k) { t += Number(other[k]) || 0; });
  return r2_(t);
}
function rctPublicOffer_(o, ctx, me) {
  var c = findBy_(SHEETS.CAND, 'id', o.candidateId), pay = rctSeesPay_(me);
  var status = o.status === 'sent' && o.expiresOn && String(o.expiresOn).slice(0, 10) < today_() ? 'expired' : o.status;
  var v = { id: o.id, ref: o.ref, candidateId: o.candidateId, candidate: c ? { id: c.id, ref: c.ref, name: c.name, nameEn: c.nameEn } : null, reqId: o.reqId,
    titleAr: o.titleAr, positionId: o.positionId, departmentId: o.departmentId, manager: empCard_(ctx.emps[o.managerId]), startDate: String(o.startDate || '').slice(0, 10),
    contractType: o.contractType, contractMonths: Number(o.contractMonths) || 0, probationDays: Number(o.probationDays) || 0, annualLeaveDays: Number(o.annualLeaveDays) || 0,
    noticeDays: Number(o.noticeDays) || 0, workLocation: o.workLocation, workDaysPerWeek: Number(o.workDaysPerWeek) || 0, dailyHours: Number(o.dailyHours) || 0,
    expiresOn: String(o.expiresOn || '').slice(0, 10), warnings: parseJson_(o.warningsJson, []), status: status, preparedBy: empCard_(ctx.emps[o.preparedBy]),
    approvedBy: empCard_(ctx.emps[o.approvedBy]), approvedAt: o.approvedAt, decisionNote: o.decisionNote, sentAt: o.sentAt, respondedAt: o.respondedAt,
    responseNote: o.responseNote, empId: o.empId || '', compRef: o.compRef || '', createdAt: o.createdAt, canDecide: rctCanDecideOffer_(me, o) };
  if (pay) { v.basic = Number(o.basic) || 0; v.housing = Number(o.housing) || 0; v.transport = Number(o.transport) || 0; v.other = parseJson_(o.otherJson, {}); v.total = rctOfferTotal_(o); }
  return v;
}

// ---------------- requisitions ----------------

function api_recruitReqSave(req, me) {
  var d = req.requisition || {};
  return withLock_(function () {
    var ctx = orgCtx_(), now = new Date().toISOString(), hr = rctCanManage_(me), q = d.id ? findBy_(SHEETS.REQN, 'id', d.id) : null;
    if (d.id && !q) fail_('not_found');
    if (!hr && !managesAnyone_(me, ctx)) fail_('forbidden');
    if (q && (q.status !== 'pending' && q.status !== 'rejected')) fail_('bad_request');
    if (q && !hr && q.requestedBy !== me.id) fail_('forbidden');
    var titleAr = str_(d.titleAr, 120);
    if (!titleAr) fail_('missing_fields');
    if (d.departmentId && !ctx.depts[d.departmentId]) fail_('not_found');
    var pos = d.positionId ? findBy_(SHEETS.POS, 'id', d.positionId) : null;
    if (d.positionId && !pos) fail_('not_found');
    var mgrId = d.hiringManagerId || me.id, mgr = ctx.emps[mgrId];
    if (!mgr || mgr.status !== 'active') fail_('not_found');
    if (!hr && mgrId !== me.id && !manages_(me, mgr, ctx)) fail_('forbidden');
    var head = Math.floor(Number(d.headcount) || 1);
    if (head < 1 || head > 100) fail_('bad_value');
    var reason = ['new', 'replacement', 'temporary', 'growth'].indexOf(d.reason) >= 0 ? d.reason : 'new';
    if (reason === 'replacement' && (!d.replacesEmpId || !ctx.emps[d.replacesEmpId])) fail_('missing_fields');
    var bmin = d.budgetMin === '' || d.budgetMin == null ? 0 : num_(d.budgetMin), bmax = d.budgetMax === '' || d.budgetMax == null ? 0 : num_(d.budgetMax);
    if (!(bmin >= 0) || !(bmax >= 0) || (bmax && bmin > bmax)) fail_('bad_amount');
    var target = d.targetDate ? isoDate_(d.targetDate) : '';
    if (d.targetDate && !target) fail_('bad_date');
    var ct = contractType_(d.contractType);
    if (ct === null) fail_('bad_value');
    if (!q) q = { id: newId_('Q'), ref: nextRef_('requisition', refsOf_(SHEETS.REQN)), stepsJson: '[]', requestedBy: me.id, filled: 0, createdAt: now, decidedBy: '', decidedAt: '', closedNote: '' };
    var fresh = !q._row;
    q.titleAr = titleAr; q.titleEn = str_(d.titleEn, 120); q.departmentId = d.departmentId || (pos ? pos.departmentId : '') || mgr.departmentId || '';
    q.positionId = d.positionId || ''; q.headcount = head; q.employmentType = ['full_time', 'part_time', 'temporary', 'internship'].indexOf(d.employmentType) >= 0 ? d.employmentType : 'full_time';
    q.contractType = ct; q.reason = reason; q.replacesEmpId = reason === 'replacement' ? d.replacesEmpId : ''; q.hiringManagerId = mgrId;
    q.budgetMin = bmin; q.budgetMax = bmax; q.saudiOnly = bool_(d.saudiOnly); q.targetDate = target; q.justification = str_(d.justification, 1000);
    q.status = 'pending'; q.updatedAt = now;
    if (fresh) append_(SHEETS.REQN, q); else update_(SHEETS.REQN, q);
    audit_(me.id, fresh ? 'recruit_req_create' : 'recruit_req_update', '', { ref: q.ref, headcount: head });
    return { ok: true, requisition: rctPublicReq_(q, ctx, me) };
  });
}

function api_recruitReqDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approved' : req.decision === 'reject' ? 'rejected' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), q = findBy_(SHEETS.REQN, 'id', req.id);
    if (!q || q.status !== 'pending') fail_('not_found');
    if (q.requestedBy === me.id) fail_('second_approver_required');
    if (!rctCanDecideReq_(me, q)) fail_('forbidden');
    var note = str_(req.note, 300), now = new Date().toISOString();
    if (decision === 'rejected' && !note) fail_('note_required');
    var h = parseJson_(q.stepsJson, []); h.push({ by: me.id, decision: decision, note: note, at: now });
    q.stepsJson = JSON.stringify(h); q.status = decision; q.decidedBy = me.id; q.decidedAt = now; q.updatedAt = now;
    update_(SHEETS.REQN, q);
    audit_(me.id, 'recruit_req_' + decision, '', { ref: q.ref });
    return { ok: true, requisition: rctPublicReq_(q, ctx, me) };
  });
}

/** HR closes or cancels a requisition (note required). */
function api_recruitReqClose(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), q = findBy_(SHEETS.REQN, 'id', req.id);
    if (!q || ['closed', 'cancelled', 'filled'].indexOf(q.status) >= 0) fail_('not_found');
    var note = str_(req.note, 300);
    if (!note) fail_('note_required');
    q.status = q.status === 'approved' ? 'closed' : 'cancelled'; q.closedNote = note; q.updatedAt = new Date().toISOString();
    update_(SHEETS.REQN, q);
    audit_(me.id, 'recruit_req_close', '', { ref: q.ref, status: q.status });
    return { ok: true, requisition: rctPublicReq_(q, ctx, me) };
  });
}

function api_recruitReqList(req, me) {
  var ctx = orgCtx_(), cands = readAll_(SHEETS.CAND), byReq = {};
  cands.forEach(function (c) { var s = byReq[c.reqId] = byReq[c.reqId] || {}; s[c.stage] = (s[c.stage] || 0) + 1; });
  var rows = readAll_(SHEETS.REQN).filter(function (q) { return rctReqVisible_(me, q, ctx) && (!req.status || q.status === req.status); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
    .map(function (q) { var v = rctPublicReq_(q, ctx, me); v.stages = byReq[q.id] || {}; return v; });
  return { ok: true, rows: rows, canCreate: rctCanManage_(me) || managesAnyone_(me, ctx), canManage: rctCanManage_(me), sources: RCT_SOURCES, stages: RCT_STAGES };
}

// ---------------- candidates ----------------

function api_recruitCandSave(req, me) {
  var d = req.candidate || {};
  return withLock_(function () {
    var ctx = orgCtx_(), now = new Date().toISOString(), c = d.id ? findBy_(SHEETS.CAND, 'id', d.id) : null;
    if (d.id && (!c || c.stage === 'erased' || c.stage === 'hired')) fail_('not_found');
    var q = findBy_(SHEETS.REQN, 'id', c ? c.reqId : d.reqId);
    if (!q) fail_('not_found');
    if (!c && q.status !== 'approved') fail_('bad_request');
    var name = str_(d.name, 100), phone = str_(d.phone, 30), email = str_(d.email, 120).toLowerCase();
    if (!name || (!phone && !email)) fail_('missing_fields');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail_('bad_value');
    if (!c && d.consent !== true) fail_('consent_required'); // PDPL: the candidate agreed to their data being kept
    if (readAll_(SHEETS.CAND).some(function (x) { return x.reqId === q.id && x.id !== (c && c.id) && x.stage !== 'erased' && ((phone && String(x.phone) === phone) || (email && x.email === email)); })) fail_('already_exists');
    var src = RCT_SOURCES.indexOf(d.source) >= 0 ? d.source : 'other';
    if (src === 'referral' && d.referredBy && !ctx.emps[d.referredBy]) fail_('not_found');
    var exp = d.expectedSalary === '' || d.expectedSalary == null ? '' : num_(d.expectedSalary);
    if (exp !== '' && !(exp >= 0)) fail_('bad_amount');
    var bd = d.birthDate ? isoDate_(d.birthDate) : '';
    if (d.birthDate && !bd) fail_('bad_date');
    var fresh = !c;
    if (!c) c = { id: newId_('K'), ref: nextRef_('candidate', refsOf_(SHEETS.CAND)), reqId: q.id, stage: 'applied', historyJson: JSON.stringify([{ from: '', to: 'applied', by: me.id, at: now }]),
      rating: '', rejectReason: '', empId: '', consentAt: now, createdBy: me.id, createdAt: now, purgeAfter: '' };
    c.name = name; c.nameEn = str_(d.nameEn, 100); c.email = email; c.phone = phone; c.nationality = str_(d.nationality, 40);
    c.isSaudi = 'isSaudi' in d ? bool_(d.isSaudi) : SAUDI_RE.test(c.nationality); c.gender = d.gender === 'female' ? 'female' : d.gender === 'male' ? 'male' : '';
    c.birthDate = bd; c.source = src; c.referredBy = src === 'referral' ? (d.referredBy || '') : ''; c.currentTitle = str_(d.currentTitle, 100);
    c.currentEmployer = str_(d.currentEmployer, 100); c.yearsExperience = Math.max(0, Math.min(60, Number(d.yearsExperience) || 0));
    c.expectedSalary = exp; c.noticeDays = d.noticeDays === '' || d.noticeDays == null ? '' : Math.max(0, Math.min(180, Math.floor(Number(d.noticeDays) || 0)));
    c.cvRef = str_(d.cvRef, 200); c.note = str_(d.note, 1000); c.updatedAt = now;
    if (fresh) append_(SHEETS.CAND, c); else update_(SHEETS.CAND, c);
    audit_(me.id, fresh ? 'recruit_cand_create' : 'recruit_cand_update', '', { ref: c.ref, req: q.ref });
    return { ok: true, candidate: rctPublicCand_(c, ctx, me, true) };
  });
}

/** HR moves a candidate. 'hired' only through recruitHire; 'offer' only through an offer; 'erased' wipes personal data (PDPL). */
function api_recruitCandStage(req, me) {
  var to = String(req.stage || '');
  if (['applied', 'screening', 'interview', 'rejected', 'withdrawn', 'erased'].indexOf(to) < 0) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), c = findBy_(SHEETS.CAND, 'id', req.id), now = new Date().toISOString(), note = str_(req.note, 300);
    if (!c || c.stage === 'hired' || c.stage === 'erased') fail_('not_found');
    if (to === 'rejected' && !note) fail_('note_required');
    if (to === 'erased' && c.stage !== 'rejected' && c.stage !== 'withdrawn') fail_('bad_request');
    if (c.stage === 'offer' && to !== 'rejected' && to !== 'withdrawn' && readAll_(SHEETS.OFFER).some(function (o) { return o.candidateId === c.id && ['pending', 'approved', 'sent', 'accepted'].indexOf(o.status) >= 0; })) fail_('bad_request');
    var h = parseJson_(c.historyJson, []); h.push({ from: c.stage, to: to, by: me.id, note: to === 'erased' ? '' : note, at: now });
    c.historyJson = JSON.stringify(h);
    if (to === 'rejected' || to === 'withdrawn') {
      c.rejectReason = note; c.purgeAfter = addDays_(today_(), RCT_PURGE_DAYS);
      readAll_(SHEETS.OFFER).filter(function (o) { return o.candidateId === c.id && ['draft', 'pending', 'approved', 'sent'].indexOf(o.status) >= 0; })
        .forEach(function (o) { o.status = 'withdrawn'; o.updatedAt = now; update_(SHEETS.OFFER, o); });
    }
    if (to === 'erased') {
      ['name', 'nameEn', 'email', 'phone', 'birthDate', 'cvRef', 'note', 'currentEmployer', 'rejectReason'].forEach(function (k) { c[k] = ''; });
      c.name = '—'; c.purgeAfter = '';
    }
    c.stage = to; c.updatedAt = now;
    update_(SHEETS.CAND, c);
    audit_(me.id, 'recruit_cand_' + to, '', { ref: c.ref });
    return { ok: true, candidate: rctPublicCand_(c, ctx, me, true) };
  });
}

/** Candidates of one requisition (or all I may see). HR all; hiring managers their requisitions; panel members whom they interview. */
function api_recruitCandList(req, me) {
  var ctx = orgCtx_(), reqs = {}, mine = {};
  readAll_(SHEETS.REQN).forEach(function (q) { reqs[q.id] = q; });
  readAll_(SHEETS.INTV).forEach(function (i) { if (rctPanel_(i).indexOf(me.id) >= 0 && i.status !== 'cancelled') mine[i.candidateId] = 1; });
  var rows = readAll_(SHEETS.CAND).filter(function (c) {
    if (req.reqId && c.reqId !== req.reqId) return false;
    if (req.stage && c.stage !== req.stage) return false;
    var q = reqs[c.reqId];
    return rctCanManage_(me) || (q && rctReqVisible_(me, q, ctx) && !hasRole_(me, 'executive')) || mine[c.id] || (q && q.hiringManagerId === me.id);
  }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (c) { return rctPublicCand_(c, ctx, me, false); });
  return { ok: true, rows: rows };
}

function rctCanSeeCand_(me, c, ctx) {
  if (rctCanManage_(me)) return true;
  var q = findBy_(SHEETS.REQN, 'id', c.reqId);
  if (q && (q.hiringManagerId === me.id || (q.requestedBy === me.id))) return true;
  return readAll_(SHEETS.INTV).some(function (i) { return i.candidateId === c.id && i.status !== 'cancelled' && rctPanel_(i).indexOf(me.id) >= 0; });
}

function api_recruitCandGet(req, me) {
  var ctx = orgCtx_(), c = findBy_(SHEETS.CAND, 'id', req.id);
  if (!c || !rctCanSeeCand_(me, c, ctx)) fail_('not_found');
  var q = findBy_(SHEETS.REQN, 'id', c.reqId);
  return { ok: true, candidate: rctPublicCand_(c, ctx, me, true), requisition: q ? rctPublicReq_(q, ctx, me) : null,
    interviews: readAll_(SHEETS.INTV).filter(function (i) { return i.candidateId === c.id; }).map(function (i) { return rctPublicInterview_(i, ctx, me); }),
    offers: rctCanManage_(me) || rctSeesPay_(me) || (q && q.hiringManagerId === me.id) ? readAll_(SHEETS.OFFER).filter(function (o) { return o.candidateId === c.id; }).map(function (o) { return rctPublicOffer_(o, ctx, me); }) : [] };
}

// ---------------- interviews ----------------

function api_recruitInterviewSave(req, me) {
  var d = req.interview || {};
  return withLock_(function () {
    var ctx = orgCtx_(), now = new Date().toISOString(), i = d.id ? findBy_(SHEETS.INTV, 'id', d.id) : null;
    if (d.id && !i) fail_('not_found');
    var c = findBy_(SHEETS.CAND, 'id', i ? i.candidateId : d.candidateId);
    if (!c || ['applied', 'screening', 'interview'].indexOf(c.stage) < 0 && !i) fail_('not_found');
    var at = String(d.at || (i && i.at) || '');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at) || isNaN(Date.parse(at))) fail_('bad_date');
    var panel = (Array.isArray(d.panel) ? d.panel : rctPanel_(i || {})).map(String).filter(function (x, k, a) { return a.indexOf(x) === k; });
    if (!panel.length || panel.length > 6) fail_('bad_value');
    panel.forEach(function (p) { if (!ctx.emps[p] || ctx.emps[p].status !== 'active') fail_('not_found'); });
    var st = ['scheduled', 'done', 'cancelled', 'no_show'].indexOf(d.status) >= 0 ? d.status : (i ? i.status : 'scheduled');
    var fresh = !i;
    if (!i) i = { id: newId_('V'), ref: nextRef_('interview', refsOf_(SHEETS.INTV)), candidateId: c.id, reqId: c.reqId, feedbackJson: '[]', createdBy: me.id, createdAt: now };
    i.at = at; i.durationMin = Math.max(10, Math.min(480, Math.floor(Number(d.durationMin) || 45))); i.mode = ['onsite', 'phone', 'video'].indexOf(d.mode) >= 0 ? d.mode : 'onsite';
    i.location = str_(d.location, 200); i.panelJson = JSON.stringify(panel); i.status = st; i.updatedAt = now;
    if (fresh) append_(SHEETS.INTV, i); else update_(SHEETS.INTV, i);
    if (fresh && (c.stage === 'applied' || c.stage === 'screening')) {
      var h = parseJson_(c.historyJson, []); h.push({ from: c.stage, to: 'interview', by: me.id, at: now });
      c.historyJson = JSON.stringify(h); c.stage = 'interview'; c.updatedAt = now; update_(SHEETS.CAND, c);
    }
    audit_(me.id, fresh ? 'recruit_interview_create' : 'recruit_interview_update', '', { ref: i.ref, cand: c.ref, status: st });
    return { ok: true, interview: rctPublicInterview_(i, ctx, me) };
  });
}

/** A panel member scores the candidate (once the interview time has come); resubmitting replaces their own scorecard. */
function api_recruitInterviewFeedback(req, me) {
  var score = Math.floor(Number(req.score));
  if (!(score >= 1 && score <= 5)) fail_('bad_value');
  if (RCT_RECS.indexOf(req.recommendation) < 0) fail_('bad_value');
  var crit = {};
  Object.keys(req.criteria || {}).slice(0, 8).forEach(function (k) { var n = Math.floor(Number(req.criteria[k])); if (n >= 1 && n <= 5) crit[str_(k, 30)] = n; });
  return withLock_(function () {
    var ctx = orgCtx_(), i = findBy_(SHEETS.INTV, 'id', req.id), now = new Date().toISOString();
    if (!i || i.status === 'cancelled') fail_('not_found');
    if (rctPanel_(i).indexOf(me.id) < 0) fail_('forbidden');
    if (Date.parse(i.at) > Date.now()) fail_('bad_date');
    var fb = parseJson_(i.feedbackJson, []).filter(function (f) { return f.by !== me.id; });
    fb.push({ by: me.id, score: score, criteria: crit, recommendation: req.recommendation, comment: str_(req.comment, 1000), at: now });
    i.feedbackJson = JSON.stringify(fb); i.updatedAt = now;
    if (i.status === 'scheduled' && fb.length >= rctPanel_(i).length) i.status = 'done';
    update_(SHEETS.INTV, i);
    var c = findBy_(SHEETS.CAND, 'id', i.candidateId), all = [];
    readAll_(SHEETS.INTV).forEach(function (x) { if (x.candidateId === i.candidateId) parseJson_(x.feedbackJson, []).forEach(function (f) { all.push(f.score); }); });
    if (c) { c.rating = Math.round(all.reduce(function (t, n) { return t + n; }, 0) / all.length * 10) / 10; c.updatedAt = now; update_(SHEETS.CAND, c); }
    audit_(me.id, 'recruit_feedback', '', { ref: i.ref });
    return { ok: true, interview: rctPublicInterview_(i, ctx, me) };
  });
}

// ---------------- offers ----------------

function api_recruitOfferSave(req, me) {
  var d = req.offer || {};
  return withLock_(function () {
    var ctx = orgCtx_(), now = new Date().toISOString(), o = d.id ? findBy_(SHEETS.OFFER, 'id', d.id) : null;
    if (d.id && (!o || ['draft', 'pending', 'rejected'].indexOf(o.status) < 0)) fail_('not_found');
    var c = findBy_(SHEETS.CAND, 'id', o ? o.candidateId : d.candidateId);
    if (!c || ['screening', 'interview', 'offer'].indexOf(c.stage) < 0) fail_('not_found');
    var q = findBy_(SHEETS.REQN, 'id', c.reqId);
    if (!q || q.status !== 'approved') fail_('bad_request');
    if (!o && readAll_(SHEETS.OFFER).some(function (x) { return x.candidateId === c.id && ['pending', 'approved', 'sent', 'accepted'].indexOf(x.status) >= 0; })) fail_('already_exists');
    var saudi = rctIsSaudi_(c);
    if (bool_(q.saudiOnly) && !saudi) fail_('saudi_only');
    var start = isoDate_(d.startDate), exp = d.expiresOn ? isoDate_(d.expiresOn) : addDays_(today_(), 7);
    if (!start || start < today_() || !exp || exp < today_()) fail_('bad_date');
    var basic = num_(d.basic), housing = num_(d.housing || 0), transport = num_(d.transport || 0), other = {};
    if (!(basic > 0) || !(housing >= 0) || !(transport >= 0)) fail_('bad_amount');
    Object.keys(d.other || {}).forEach(function (k) { var v = num_(d.other[k]); if (!(v >= 0)) fail_('bad_amount'); if (str_(k, 40)) other[str_(k, 40)] = v; });
    var ct = contractType_(d.contractType || q.contractType || (saudi ? 'indefinite' : 'fixed'));
    if (!ct) fail_('bad_value');
    var months = ct === 'fixed' ? Math.floor(Number(d.contractMonths) || 12) : 0;
    if (ct === 'fixed' && (months < 1 || months > 120)) fail_('bad_value');
    var prob = Math.floor(Number(d.probationDays === undefined ? 90 : d.probationDays) || 0), leave = Math.floor(Number(d.annualLeaveDays) || 21);
    var rule = contractRule_({ isSaudi: saudi, contractType: ct, hireDate: start, contractEnd: ct === 'fixed' ? addDays_(govAddMonths_(start, months), -1) : '',
      probationEnd: prob ? addDays_(start, prob - 1) : '', annualLeaveDays: leave });
    if (rule) fail_(rule);
    if (prob < 0) fail_('bad_value');
    if (d.managerId && !ctx.emps[d.managerId]) fail_('not_found');
    if (d.positionId && !findBy_(SHEETS.POS, 'id', d.positionId)) fail_('not_found');
    var row = o || { id: newId_('F'), ref: nextRef_('offer', refsOf_(SHEETS.OFFER)), candidateId: c.id, reqId: q.id, preparedBy: me.id, createdAt: now, approvedBy: '', approvedAt: '',
      decisionNote: '', sentAt: '', respondedAt: '', responseNote: '', empId: '', compRef: '' };
    row.positionId = d.positionId || q.positionId || ''; row.departmentId = d.departmentId || q.departmentId || ''; row.managerId = d.managerId || q.hiringManagerId || '';
    row.titleAr = str_(d.titleAr, 120) || q.titleAr; row.startDate = start; row.contractType = ct; row.contractMonths = months; row.probationDays = prob;
    row.basic = basic; row.housing = housing; row.transport = transport; row.otherJson = JSON.stringify(other); row.annualLeaveDays = leave;
    row.noticeDays = Math.max(saudi || ct === 'indefinite' ? 30 : 0, Math.min(180, Math.floor(Number(d.noticeDays) || 30)));
    row.workLocation = str_(d.workLocation, 100); row.workDaysPerWeek = Math.max(1, Math.min(7, Math.floor(Number(d.workDaysPerWeek) || 5)));
    row.dailyHours = Math.max(1, Math.min(12, Number(d.dailyHours) || 8)); row.expiresOn = exp;
    var total = rctOfferTotal_(row), warn = [], gw = basic + housing;
    if (Number(q.budgetMax) && total > Number(q.budgetMax)) warn.push('over_budget');
    if (Number(q.budgetMin) && total < Number(q.budgetMin)) warn.push('under_budget');
    if (saudi && gw < 4000) warn.push(gw >= 3000 ? 'nitaqat_half' : 'nitaqat_zero'); // Nitaqat: a Saudi counts 1 at >= 4,000, 0.5 at 3,000-3,999
    if (c.expectedSalary !== '' && Number(c.expectedSalary) > total) warn.push('below_expectation');
    row.warningsJson = JSON.stringify(warn); row.status = 'pending'; row.preparedBy = me.id; row.updatedAt = now;
    if (o) update_(SHEETS.OFFER, row); else append_(SHEETS.OFFER, row);
    if (c.stage !== 'offer') { var h = parseJson_(c.historyJson, []); h.push({ from: c.stage, to: 'offer', by: me.id, at: now }); c.historyJson = JSON.stringify(h); c.stage = 'offer'; c.updatedAt = now; update_(SHEETS.CAND, c); }
    audit_(me.id, o ? 'recruit_offer_update' : 'recruit_offer_create', '', { ref: row.ref, cand: c.ref });
    return { ok: true, offer: rctPublicOffer_(row, ctx, me) };
  });
}

/** A second person (hr role or payroll, never the preparer) approves or rejects the offer; over budget needs the reason. */
function api_recruitOfferDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approved' : req.decision === 'reject' ? 'rejected' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), o = findBy_(SHEETS.OFFER, 'id', req.id);
    if (!o || o.status !== 'pending') fail_('not_found');
    if (o.preparedBy === me.id) fail_('second_approver_required');
    if (!rctCanDecideOffer_(me, o)) fail_('forbidden');
    var note = str_(req.note, 300);
    if (!note && (decision === 'rejected' || parseJson_(o.warningsJson, []).indexOf('over_budget') >= 0)) fail_('note_required');
    o.status = decision; o.approvedBy = me.id; o.approvedAt = new Date().toISOString(); o.decisionNote = note; o.updatedAt = o.approvedAt;
    update_(SHEETS.OFFER, o);
    audit_(me.id, 'recruit_offer_' + decision, '', { ref: o.ref });
    return { ok: true, offer: rctPublicOffer_(o, ctx, me) };
  });
}

function api_recruitOfferSend(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), o = findBy_(SHEETS.OFFER, 'id', req.id);
    if (!o || o.status !== 'approved') fail_('not_found');
    o.status = 'sent'; o.sentAt = new Date().toISOString(); o.updatedAt = o.sentAt;
    update_(SHEETS.OFFER, o);
    audit_(me.id, 'recruit_offer_sent', '', { ref: o.ref });
    return { ok: true, offer: rctPublicOffer_(o, ctx, me) };
  });
}

/** HR records the candidate's answer. An accepted offer past its expiry date is refused. */
function api_recruitOfferRespond(req, me) {
  var answer = req.response === 'accepted' ? 'accepted' : req.response === 'declined' ? 'declined' : '';
  if (!answer) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), o = findBy_(SHEETS.OFFER, 'id', req.id), now = new Date().toISOString();
    if (!o || o.status !== 'sent') fail_('not_found');
    if (answer === 'accepted' && String(o.expiresOn).slice(0, 10) < today_()) fail_('offer_expired');
    o.status = answer; o.respondedAt = now; o.responseNote = str_(req.note, 300); o.updatedAt = now;
    update_(SHEETS.OFFER, o);
    if (answer === 'declined') {
      var c = findBy_(SHEETS.CAND, 'id', o.candidateId);
      if (c) { var h = parseJson_(c.historyJson, []); h.push({ from: c.stage, to: 'withdrawn', by: me.id, note: 'offer declined', at: now });
        c.historyJson = JSON.stringify(h); c.stage = 'withdrawn'; c.rejectReason = 'offer_declined'; c.purgeAfter = addDays_(today_(), RCT_PURGE_DAYS); c.updatedAt = now; update_(SHEETS.CAND, c); }
    }
    audit_(me.id, 'recruit_offer_' + answer, '', { ref: o.ref });
    return { ok: true, offer: rctPublicOffer_(o, ctx, me) };
  });
}

/** Everything the printed offer letter needs (the client renders it with the shared document kit). */
function api_recruitOfferLetter(req, me) {
  var ctx = orgCtx_(), o = findBy_(SHEETS.OFFER, 'id', req.id);
  if (!o || ['approved', 'sent', 'accepted'].indexOf(o.status) < 0) fail_('not_found');
  var c = findBy_(SHEETS.CAND, 'id', o.candidateId) || {}, pos = o.positionId ? findBy_(SHEETS.POS, 'id', o.positionId) : null, dept = ctx.depts[o.departmentId];
  var v = rctPublicOffer_(o, ctx, me);
  audit_(me.id, 'salary_view', '', { offerLetter: o.ref });
  return { ok: true, letter: { ref: o.ref, date: String(o.approvedAt || o.createdAt).slice(0, 10), company: companyOf_(settings_()),
    candidate: { name: c.name, nameEn: c.nameEn, nationality: c.nationality, email: c.email, phone: String(c.phone || '') },
    job: { titleAr: o.titleAr, titleEn: pos ? pos.titleEn : '', department: dept ? dept.nameAr : '', departmentEn: dept ? dept.nameEn : '', manager: v.manager, workLocation: o.workLocation },
    terms: { startDate: v.startDate, contractType: v.contractType, contractMonths: v.contractMonths, probationDays: v.probationDays, annualLeaveDays: v.annualLeaveDays,
      noticeDays: v.noticeDays, workDaysPerWeek: v.workDaysPerWeek, dailyHours: v.dailyHours, expiresOn: v.expiresOn },
    pay: rctSeesPay_(me) ? { basic: v.basic, housing: v.housing, transport: v.transport, other: v.other, total: v.total, currency: 'SAR' } : null,
    approvedBy: v.approvedBy, preparedBy: v.preparedBy } };
}

// ---------------- hire ----------------

function api_recruitHire(req, me) {
  var o = findBy_(SHEETS.OFFER, 'id', req.offerId);
  if (!o || o.status !== 'accepted') fail_('not_found');
  var c = findBy_(SHEETS.CAND, 'id', o.candidateId), q = findBy_(SHEETS.REQN, 'id', o.reqId);
  if (!c || !q) fail_('not_found');
  var code = null, steps = [];
  if (!o.empId) {
    var empNo = str_(req.empNo, 30);
    if (!empNo) fail_('missing_fields');
    var created = api_empSave({ emp: { empNo: empNo, name: c.name, nameEn: c.nameEn, email: c.email, phone: String(c.phone || ''), title: o.titleAr, role: 'employee',
      zoneIds: str_(req.zoneIds, 200) } }, me);
    code = created.activationCode;
    withLock_(function () { var x = findBy_(SHEETS.OFFER, 'id', o.id); x.empId = created.emp.id; x.updatedAt = new Date().toISOString(); update_(SHEETS.OFFER, x); });
    o.empId = created.emp.id; steps.push('employee');
  }
  READ_MEMO_ = {};
  var start = String(o.startDate).slice(0, 10), ct = o.contractType, months = Number(o.contractMonths) || 0, prob = Number(o.probationDays) || 0;
  api_hrEmpSave({ emp: { id: o.empId, departmentId: o.departmentId, positionId: o.positionId, managerId: o.managerId, hireDate: start, contractType: ct,
    contractEnd: ct === 'fixed' && months ? addDays_(govAddMonths_(start, months), -1) : '', probationEnd: prob ? addDays_(start, prob - 1) : '',
    nationality: c.nationality, isSaudi: rctIsSaudi_(c), gender: c.gender, workLocation: o.workLocation, workDaysPerWeek: Number(o.workDaysPerWeek) || '',
    dailyHours: Number(o.dailyHours) || '', annualLeaveDays: Number(o.annualLeaveDays) || '', noticeDays: Number(o.noticeDays) || '', employmentType: q.employmentType,
    effectiveFrom: start, reason: o.ref } }, me);
  steps.push('job');
  var compRef = o.compRef;
  READ_MEMO_ = {};
  if (!compRef && canProposeComp_(me) && o.empId !== me.id) {
    var comp = api_hrCompPropose({ empId: o.empId, effectiveFrom: start, basic: o.basic, housing: o.housing, transport: o.transport, other: parseJson_(o.otherJson, {}),
      reason: o.ref + ' عرض وظيفي' }, me);
    compRef = comp.comp.ref; steps.push('package_pending');
  }
  READ_MEMO_ = {};
  if (req.onboard !== false && !readAll_(SHEETS.ONB).some(function (x) { return x.empId === o.empId; })) { api_onboardStart({ empId: o.empId }, me); steps.push('onboarding'); }
  READ_MEMO_ = {};
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.OFFER, 'id', o.id), cc = findBy_(SHEETS.CAND, 'id', c.id), qq = findBy_(SHEETS.REQN, 'id', q.id), now = new Date().toISOString();
    x.status = 'hired'; x.compRef = compRef || ''; x.updatedAt = now; update_(SHEETS.OFFER, x);
    var h = parseJson_(cc.historyJson, []); h.push({ from: cc.stage, to: 'hired', by: me.id, at: now });
    cc.historyJson = JSON.stringify(h); cc.stage = 'hired'; cc.empId = x.empId; cc.updatedAt = now; update_(SHEETS.CAND, cc);
    qq.filled = (Number(qq.filled) || 0) + 1; if (qq.filled >= (Number(qq.headcount) || 1)) qq.status = 'filled'; qq.updatedAt = now; update_(SHEETS.REQN, qq);
    audit_(me.id, 'recruit_hire', x.empId, { offer: x.ref, cand: cc.ref, req: qq.ref, steps: steps });
    return { ok: true, empId: x.empId, activationCode: code, compRef: compRef || '', packagePending: !!compRef, steps: steps, offer: rctPublicOffer_(x, ctx, me) };
  });
}

// ---------------- pipeline board ----------------

/** Funnel and metrics: counts per stage, conversion, sources, offer acceptance, time to fill. HR, executives, hiring managers (their own). */
function api_recruitBoard(req, me) {
  var ctx = orgCtx_(), reqs = readAll_(SHEETS.REQN).filter(function (q) { return rctReqVisible_(me, q, ctx); });
  if (!reqs.length && !isHr_(me) && !hasRole_(me, 'executive') && !managesAnyone_(me, ctx)) fail_('forbidden');
  var ids = {}; reqs.forEach(function (q) { ids[q.id] = q; });
  var cands = readAll_(SHEETS.CAND).filter(function (c) { return ids[c.reqId]; }), offers = readAll_(SHEETS.OFFER).filter(function (o) { return ids[o.reqId]; });
  var stages = {}, reached = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 }, order = ['applied', 'screening', 'interview', 'offer', 'hired'], sources = {};
  cands.forEach(function (c) {
    stages[c.stage] = (stages[c.stage] || 0) + 1;
    var seen = {}; parseJson_(c.historyJson, []).forEach(function (h) { seen[h.to] = 1; });
    var top = -1; order.forEach(function (s, i) { if (seen[s]) top = i; });
    for (var i = 0; i <= top; i++) reached[order[i]]++;
    var s = sources[c.source || 'other'] = sources[c.source || 'other'] || { source: c.source || 'other', candidates: 0, hired: 0 };
    s.candidates++; if (c.stage === 'hired') s.hired++;
  });
  var conv = order.slice(1).map(function (s, i) { var from = reached[order[i]]; return { from: order[i], to: s, rate: from ? Math.round(reached[s] / from * 1000) / 10 : null }; });
  var acc = offers.filter(function (o) { return o.status === 'accepted' || o.status === 'hired'; }).length, dec = offers.filter(function (o) { return o.status === 'declined'; }).length;
  var fills = [];
  offers.forEach(function (o) { if (o.status === 'hired' && ids[o.reqId].decidedAt) fills.push(daysBetween_(String(ids[o.reqId].decidedAt).slice(0, 10), String(o.respondedAt || o.updatedAt).slice(0, 10))); });
  var t = today_();
  return { ok: true, requisitions: { open: reqs.filter(function (q) { return q.status === 'approved'; }).length, pending: reqs.filter(function (q) { return q.status === 'pending'; }).length,
      filled: reqs.filter(function (q) { return q.status === 'filled'; }).length, overdue: reqs.filter(function (q) { return q.status === 'approved' && q.targetDate && String(q.targetDate).slice(0, 10) < t; }).length,
      openSeats: reqs.filter(function (q) { return q.status === 'approved'; }).reduce(function (s, q) { return s + Math.max(0, (Number(q.headcount) || 1) - (Number(q.filled) || 0)); }, 0) },
    stages: stages, reached: reached, conversion: conv, sources: Object.keys(sources).map(function (k) { return sources[k]; }),
    offers: { total: offers.length, pending: offers.filter(function (o) { return o.status === 'pending'; }).length, accepted: acc, declined: dec,
      acceptanceRate: acc + dec ? Math.round(acc / (acc + dec) * 1000) / 10 : null },
    timeToFillDays: fills.length ? Math.round(fills.reduce(function (s, n) { return s + n; }, 0) / fills.length) : null };
}

hrisHook_('tasks', function (me, ctx, add) {
  add('recruit_req_approve', readAll_(SHEETS.REQN).filter(function (q) { return rctCanDecideReq_(me, q); }).length, { tab: 'hr', sec: 'recruitment' });
  add('recruit_offer_approve', readAll_(SHEETS.OFFER).filter(function (o) { return rctCanDecideOffer_(me, o); }).length, { tab: 'hr', sec: 'recruitment' });
  var now = Date.now();
  add('recruit_feedback', readAll_(SHEETS.INTV).filter(function (i) {
    return (i.status === 'scheduled' || i.status === 'done') && rctPanel_(i).indexOf(me.id) >= 0 && Date.parse(i.at) <= now && !parseJson_(i.feedbackJson, []).some(function (f) { return f.by === me.id; });
  }).length, { tab: 'hr', sec: 'recruitment' });
  if (isHr_(me)) {
    var t = today_();
    add('recruit_hire', readAll_(SHEETS.OFFER).filter(function (o) { return o.status === 'accepted'; }).length, { tab: 'hr', sec: 'recruitment' });
    add('recruit_purge', readAll_(SHEETS.CAND).filter(function (c) { return c.purgeAfter && String(c.purgeAfter).slice(0, 10) <= t && c.stage !== 'erased'; }).length, { tab: 'hr', sec: 'recruitment' });
  }
});

/**
 * Public careers page (2026-10-19, gap list item 3; seen in Jisr 2026, rebuilt as our own flow). Tab careerPosts.
 *  - HR publishes an approved requisition with a public ad (title, summary, requirements, city, closing date). Internal
 *    fields (budget, justification, hiring manager, replaced employee) never leave the server on the public actions.
 *  - careersList and careersApply need no sign-in. An application is a candidate with source 'website', recorded only with
 *    the PDPL consent ticked; a hidden field catches simple bots (they get the same answer and nothing is stored);
 *    rate limits: 40 applications an hour in total, 3 a day per phone or e-mail. A repeat application answers ok too, so
 *    the page never reveals who has applied.
 */
function careerOpen_(p, q, t) {
  return p.status === 'open' && q && q.status === 'approved' && (Number(q.filled) || 0) < (Number(q.headcount) || 1) && (!p.closesOn || String(p.closesOn).slice(0, 10) >= t);
}
function publicPost_(p, q, depts) {
  var d = depts[q.departmentId] || {};
  return { id: p.id, ref: q.ref, titleAr: p.titleAr || q.titleAr, titleEn: p.titleEn || q.titleEn, deptAr: d.nameAr || d.name || '', deptEn: d.nameEn || '',
    summaryAr: p.summaryAr, summaryEn: p.summaryEn, requirementsAr: p.requirementsAr, requirementsEn: p.requirementsEn, city: p.city || '',
    closesOn: p.closesOn ? String(p.closesOn).slice(0, 10) : '', employmentType: q.employmentType || '', saudiOnly: bool_(q.saudiOnly) };
}
function api_careersList(req) {
  var t = today_(), reqs = {}, depts = {};
  readAll_(SHEETS.REQN).forEach(function (q) { reqs[q.id] = q; });
  readAll_(SHEETS.DEPT).forEach(function (d) { depts[d.id] = d; });
  return { ok: true, company: companyOf_(settings_()), rows: readAll_(SHEETS.CPOST).filter(function (p) { return careerOpen_(p, reqs[p.reqId], t); }).map(function (p) { return publicPost_(p, reqs[p.reqId], depts); }) };
}
function api_careersApply(req) {
  var d = req.application || {};
  if (str_(d.website, 200)) return { ok: true }; // the hidden field: bots fill it, people never see it
  var name = str_(d.name, 100), phone = String(d.phone || '').replace(/[^\d+]/g, '').slice(0, 20), email = str_(d.email, 120).toLowerCase();
  if (!name || !phone) fail_('missing_fields');
  if (!/^\+?\d{9,15}$/.test(phone)) fail_('bad_phone');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail_('bad_value');
  if (d.consent !== true) fail_('consent_required');
  if (!rateLimit_('careers', 40, 3600) || !rateLimit_('careers:' + phone, 3, 86400) || (email && !rateLimit_('careers:' + email, 3, 86400))) fail_('too_many_attempts');
  return withLock_(function () {
    var p = findBy_(SHEETS.CPOST, 'id', d.postId), q = p ? findBy_(SHEETS.REQN, 'id', p.reqId) : null;
    if (!p || !careerOpen_(p, q, today_())) fail_('not_found');
    var dup = readAll_(SHEETS.CAND).some(function (x) { return x.reqId === q.id && x.stage !== 'erased' && (String(x.phone) === phone || (email && x.email === email)); });
    if (dup) return { ok: true };
    var now = new Date().toISOString(), nat = str_(d.nationality, 40);
    var c = { id: newId_('K'), ref: nextRef_('candidate', refsOf_(SHEETS.CAND)), reqId: q.id, name: name, nameEn: '', email: email, phone: phone, nationality: nat,
      isSaudi: SAUDI_RE.test(nat), gender: '', birthDate: '', source: 'website', referredBy: '', currentTitle: str_(d.currentTitle, 100), currentEmployer: str_(d.currentEmployer, 100),
      yearsExperience: Math.max(0, Math.min(60, Number(d.yearsExperience) || 0)), expectedSalary: '', noticeDays: '', cvRef: str_(d.cvLink, 200), consentAt: now, stage: 'applied',
      historyJson: JSON.stringify([{ from: '', to: 'applied', by: 'website', at: now }]), rating: '', rejectReason: '', note: str_(d.message, 1000), empId: '',
      createdBy: 'website', createdAt: now, updatedAt: now, purgeAfter: '' };
    append_(SHEETS.CAND, c);
    p.applications = (Number(p.applications) || 0) + 1; p.updatedAt = now; update_(SHEETS.CPOST, p);
    audit_('', 'careers_apply', '', { ref: c.ref, req: q.ref });
    return { ok: true };
  });
}
function api_careerPostList(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var t = today_(), posts = {}, depts = {};
  readAll_(SHEETS.CPOST).forEach(function (p) { posts[p.reqId] = p; });
  readAll_(SHEETS.DEPT).forEach(function (d) { depts[d.id] = d; });
  var rows = readAll_(SHEETS.REQN).filter(function (q) { return q.status === 'approved' || posts[q.id]; }).map(function (q) {
    var p = posts[q.id];
    return { reqId: q.id, ref: q.ref, titleAr: q.titleAr, titleEn: q.titleEn, reqStatus: q.status, headcount: Number(q.headcount) || 1, filled: Number(q.filled) || 0,
      post: p ? Object.assign(publicPost_(p, q, depts), { status: p.status, live: careerOpen_(p, q, t), applications: Number(p.applications) || 0 }) : null };
  });
  return { ok: true, rows: rows };
}
function api_careerPostSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.post || {};
  return withLock_(function () {
    var q = findBy_(SHEETS.REQN, 'id', x.reqId);
    if (!q) fail_('not_found');
    var p = readAll_(SHEETS.CPOST).filter(function (r) { return r.reqId === q.id; })[0], now = new Date().toISOString();
    var status = x.status === 'closed' ? 'closed' : 'open';
    if (status === 'open' && q.status !== 'approved') fail_('bad_state');
    var closes = x.closesOn ? isoDate_(x.closesOn) : '';
    if (x.closesOn && !closes) fail_('bad_date');
    if (status === 'open' && !str_(x.summaryAr, 2000) && !str_(x.summaryEn, 2000)) fail_('missing_fields');
    var fresh = !p;
    if (!p) p = { id: newId_('J'), reqId: q.id, applications: 0, createdBy: me.id, createdAt: now };
    p.status = status; p.titleAr = str_(x.titleAr, 120) || q.titleAr; p.titleEn = str_(x.titleEn, 120) || q.titleEn;
    p.summaryAr = str_(x.summaryAr, 2000); p.summaryEn = str_(x.summaryEn, 2000); p.requirementsAr = str_(x.requirementsAr, 2000); p.requirementsEn = str_(x.requirementsEn, 2000);
    p.city = str_(x.city, 60); p.closesOn = closes; p.updatedAt = now;
    if (fresh) append_(SHEETS.CPOST, p); else update_(SHEETS.CPOST, p);
    audit_(me.id, 'career_post_save', '', { req: q.ref, status: status });
    return { ok: true };
  });
}

/**
 * Workforce / headcount plan (2026-10-19, gap list item 4; seen in Deel and Workday, rebuilt as our own). Tab workforcePlans.
 * Per department and year: the planned headcount (set by HR) against active staff, approved requisitions still open and
 * requisitions waiting for approval. Gap = planned - staff - open. Cost of the gap = gap x the department's average monthly
 * package x 12, shown only to hr, payroll and executive, and only for departments of 3 or more (an average of one or two
 * people is their salary). Managers see their own departments, without cost.
 */
function wfpScope_(me, ctx) {
  if (isHr_(me) || hasRole_(me, 'executive') || hasRole_(me, 'payroll')) return null; // all departments
  var mine = {};
  Object.keys(ctx.emps).forEach(function (k) { var e = ctx.emps[k]; if (e.departmentId && e.status === 'active' && manages_(me, e, ctx)) mine[e.departmentId] = 1; });
  if (!Object.keys(mine).length) fail_('forbidden');
  return mine;
}
function api_workforcePlan(req, me) {
  var ctx = orgCtx_(), scope = wfpScope_(me, ctx), year = Math.floor(Number(req.year) || Number(today_().slice(0, 4)));
  var cost = me.role === 'hr' || hasRole_(me, 'payroll') || hasRole_(me, 'executive');
  var comp = cost ? currentCompMap_(today_()) : {}, plans = {}, by = {};
  readAll_(SHEETS.WFP).forEach(function (p) { if (Number(p.year) === year) plans[p.deptId] = p; });
  readAll_(SHEETS.DEPT).forEach(function (d) {
    if (d.status === 'inactive' || (scope && !scope[d.id])) return;
    by[d.id] = { deptId: d.id, nameAr: d.nameAr || d.name, nameEn: d.nameEn, staff: 0, saudi: 0, open: 0, pending: 0, pay: 0, paid: 0,
      planned: plans[d.id] ? Number(plans[d.id].planned) : null, note: plans[d.id] ? plans[d.id].note || '' : '' };
  });
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k], r = by[e.departmentId];
    if (!r || e.status !== 'active') return;
    r.staff++; if (bool_(e.isSaudi) || SAUDI_RE.test(String(e.nationality || ''))) r.saudi++;
    if (comp[e.id]) { r.pay += comp[e.id].total; r.paid++; }
  });
  readAll_(SHEETS.REQN).forEach(function (q) {
    var r = by[q.departmentId], left = Math.max(0, (Number(q.headcount) || 1) - (Number(q.filled) || 0));
    if (!r) return;
    if (q.status === 'approved') r.open += left; else if (q.status === 'pending') r.pending += left;
  });
  var rows = Object.keys(by).map(function (k) {
    var r = by[k], out = { deptId: r.deptId, nameAr: r.nameAr, nameEn: r.nameEn, staff: r.staff, saudi: r.saudi, open: r.open, pending: r.pending, planned: r.planned, note: r.note };
    out.gap = r.planned == null ? null : r.planned - r.staff - r.open;
    if (cost && r.paid >= 3) { out.avgMonthly = Math.round(r.pay / r.paid); out.gapCostYear = out.gap ? Math.round(out.gap * out.avgMonthly * 12) : 0; }
    return out;
  }).sort(function (a, b) { return String(a.nameAr).localeCompare(String(b.nameAr)); });
  var tot = { staff: 0, open: 0, pending: 0, planned: 0, gap: 0, gapCostYear: 0 };
  rows.forEach(function (r) { tot.staff += r.staff; tot.open += r.open; tot.pending += r.pending; tot.planned += r.planned || 0; tot.gap += r.gap || 0; tot.gapCostYear += r.gapCostYear || 0; });
  if (!cost) delete tot.gapCostYear;
  return { ok: true, year: year, rows: rows, totals: tot, canEdit: isHr_(me), cost: cost };
}
function api_workforcePlanSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var year = Math.floor(Number(req.year)), planned = Number(req.planned);
  if (!(year >= 2020 && year <= 2100) || !(planned >= 0 && planned <= 100000) || Math.floor(planned) !== planned) fail_('bad_value');
  return withLock_(function () {
    var d = findBy_(SHEETS.DEPT, 'id', req.deptId);
    if (!d) fail_('not_found');
    var p = readAll_(SHEETS.WFP).filter(function (x) { return x.deptId === d.id && Number(x.year) === year; })[0], now = new Date().toISOString();
    var was = p ? Number(p.planned) : null;
    if (!p) p = { id: newId_('W'), year: year, deptId: d.id };
    p.planned = planned; p.note = str_(req.note, 300); p.updatedBy = me.id; p.updatedAt = now;
    if (p._row) update_(SHEETS.WFP, p); else append_(SHEETS.WFP, p);
    audit_(me.id, 'workforce_plan_save', '', { dept: d.code || d.id, year: year, from: was, to: planned });
    return { ok: true };
  });
}
