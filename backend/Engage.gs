/**
 * People programmes built from the installed HR skills (2026-09-30):
 *  - Onboarding (onboarding-planner): a 30-60-90 day plan per new hire from a template, with owners (HR, manager,
 *    employee, IT) and due dates from the hire date; the probation review falls before day 90 (Labour Law Art. 53).
 *  - Pulse survey (employee-engagement-survey): eNPS plus five 1-5 statements and one comment, anonymous. Nobody's
 *    answers carry their id; the voter list is a sorted set of keyed hashes on the survey row, so row order cannot tie a
 *    vote to an answer; any group smaller than MIN_GROUP is never shown, comments only when the whole survey reaches it.
 *  - Policies (employee-handbook-builder): versioned company policies each employee acknowledges; a new version asks again.
 *  - Development plans (performance-review-assistant): an IDP (growth) or a PIP (30-90 days, measurable goals, support,
 *    check-ins, the employee's acknowledgement, and an outcome recorded by HR).
 */

// ---------------- onboarding ----------------

// day: offset from the hire date; owner: who ticks it.
var ONB_TEMPLATE = [
  { key: 'workspace', phase: 'pre', day: -5, owner: 'it', ar: 'تجهيز المكتب والجهاز والبريد', en: 'Prepare desk, device and email' },
  { key: 'access', phase: 'pre', day: -3, owner: 'it', ar: 'إنشاء صلاحيات الأنظمة', en: 'Create system access' },
  { key: 'buddy', phase: 'pre', day: -3, owner: 'manager', ar: 'تعيين زميل مرافق (Buddy) للأسابيع الأولى', en: 'Assign a buddy for the first weeks' },
  { key: 'welcome', phase: 'pre', day: -1, owner: 'manager', ar: 'رسالة ترحيب وجدول الأسبوع الأول', en: 'Welcome message and first-week schedule' },
  { key: 'contract', phase: 'day1', day: 0, owner: 'hr', ar: 'توقيع العقد وتوثيقه في قوى', en: 'Sign the contract and document it in Qiwa' },
  { key: 'gosi', phase: 'day1', day: 0, owner: 'hr', ar: 'التسجيل في التأمينات الاجتماعية', en: 'Register with GOSI' },
  { key: 'app', phase: 'day1', day: 0, owner: 'hr', ar: 'تفعيل تطبيق الحضور على جوال الموظف', en: 'Activate the attendance app on the employee\'s phone' },
  { key: 'tour', phase: 'day1', day: 0, owner: 'manager', ar: 'استقبال شخصي وجولة في المقر والتعريف بالفريق', en: 'Personal welcome, office tour, team introductions' },
  { key: 'policies', phase: 'day1', day: 1, owner: 'employee', ar: 'قراءة سياسات الشركة والإقرار بها في التطبيق', en: 'Read and acknowledge company policies in the app' },
  { key: 'profile', phase: 'week1', day: 3, owner: 'employee', ar: 'استكمال بياناتي (الهوية، الآيبان، جهة الطوارئ)', en: 'Complete my details (ID, IBAN, emergency contact)' },
  { key: 'training', phase: 'week1', day: 4, owner: 'manager', ar: 'خطة تدريب على الوظيفة والأنظمة', en: 'Role and systems training plan' },
  { key: 'week1', phase: 'week1', day: 5, owner: 'manager', ar: 'لقاء نهاية الأسبوع الأول: الأسئلة والملاحظات', en: 'End of week one 1:1: questions and feedback' },
  { key: 'goals', phase: 'd30', day: 21, owner: 'manager', ar: 'الاتفاق على أهداف أول 90 يوما', en: 'Agree goals for the first 90 days' },
  { key: 'd30', phase: 'd30', day: 30, owner: 'manager', ar: 'مراجعة اليوم 30: ما الواضح وما يحتاج دعما', en: 'Day 30 check-in: what is clear, what needs support' },
  { key: 'd60', phase: 'd60', day: 60, owner: 'manager', ar: 'مراجعة اليوم 60: الأداء والتقدم في الأهداف', en: 'Day 60 review: performance and goal progress' },
  { key: 'probation', phase: 'd90', day: 80, owner: 'manager', ar: 'تقييم فترة التجربة قبل انتهائها (المادة 53)', en: 'Probation review before it ends (Art. 53)' },
  { key: 'confirm', phase: 'd90', day: 89, owner: 'hr', ar: 'اعتماد نتيجة التجربة: تثبيت أو تمديد (بموافقة كتابية حتى 180 يوما)', en: 'Record the probation outcome: confirm or extend (in writing, up to 180 days)' },
  { key: 'survey', phase: 'd90', day: 90, owner: 'hr', ar: 'استطلاع تجربة الانضمام', en: 'Onboarding experience survey' }
];
var ONB_PHASES = ['pre', 'day1', 'week1', 'd30', 'd60', 'd90'];

function onbCanTick_(me, task, emp, ctx) {
  if (isHr_(me)) return true;
  if (task.owner === 'employee') return me.id === emp.id;
  if (task.owner === 'manager') return manages_(me, emp, ctx);
  return false; // it tasks: HR ticks them for IT
}
function publicOnb_(x, me, emp, ctx) {
  return { id: x.id, ref: x.ref, key: x.taskKey, phase: x.phase, titleAr: x.titleAr, titleEn: x.titleEn, owner: x.owner, dueDate: String(x.dueDate).slice(0, 10),
    status: x.status, doneAt: x.doneAt, note: x.note, canTick: onbCanTick_(me, x, emp, ctx) };
}
function onbPlan_(emp, tasks, me, ctx) {
  var t = today_(), list = tasks.map(function (x) { return publicOnb_(x, me, emp, ctx); }).sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0; });
  var done = list.filter(function (x) { return x.status !== 'open'; }).length, late = list.filter(function (x) { return x.status === 'open' && x.dueDate < t; }).length;
  return { emp: empCard_(emp), hireDate: String(emp.hireDate || '').slice(0, 10), day: emp.hireDate ? daysBetween_(String(emp.hireDate).slice(0, 10), t) : null,
    total: list.length, done: done, late: late, tasks: list };
}

/** HR starts the plan for one person; due dates follow the hire date (today when it is not set). */
function api_onboardStart(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.empId);
    if (!emp || emp.status !== 'active') fail_('not_found');
    if (readAll_(SHEETS.ONB).some(function (x) { return x.empId === emp.id; })) fail_('already_exists');
    var hire = isoDate_(emp.hireDate) || today_(), now = new Date().toISOString(), refs = nextRefs_('onboarding', ONB_TEMPLATE.length, refsOf_(SHEETS.ONB));
    var rows = ONB_TEMPLATE.map(function (tp, i) {
      return { id: newId_('O'), ref: refs[i], empId: emp.id, taskKey: tp.key, phase: tp.phase, titleAr: tp.ar, titleEn: tp.en, owner: tp.owner, dueDate: addDays_(hire, tp.day),
        status: 'open', doneBy: '', doneAt: '', note: '', createdBy: me.id, createdAt: now };
    });
    appendMany_(SHEETS.ONB, rows);
    audit_(me.id, 'onboard_start', emp.id, { tasks: rows.length });
    return { ok: true, count: rows.length };
  });
}

/** Plans the viewer may see: HR all, a manager their people, everyone their own. HR also gets recent hires with no plan. */
function api_onboardList(req, me) {
  var ctx = orgCtx_(), by = {}, hr = isHr_(me);
  readAll_(SHEETS.ONB).forEach(function (x) { (by[x.empId] = by[x.empId] || []).push(x); });
  var plans = Object.keys(by).map(function (k) { return ctx.emps[k]; }).filter(function (e) {
    return e && (hr || e.id === me.id || manages_(me, e, ctx)) && (e.status === 'active' || req.all);
  }).map(function (e) { return onbPlan_(e, by[e.id], me, ctx); }).sort(function (a, b) { return a.hireDate < b.hireDate ? 1 : -1; });
  var out = { ok: true, plans: plans };
  if (hr) {
    var since = addDays_(today_(), -120);
    out.withoutPlan = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) {
      var h = String(e.hireDate || '').slice(0, 10), c = String(e.createdAt || '').slice(0, 10);
      return e.status === 'active' && !by[e.id] && ((h && h >= since) || (!h && c >= since));
    }).map(function (e) { return { emp: empCard_(e), hireDate: String(e.hireDate || '').slice(0, 10) }; });
  }
  return out;
}

function api_onboardTask(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.ONB, 'id', req.id);
    if (!x) fail_('not_found');
    var ctx = orgCtx_(), emp = ctx.emps[x.empId];
    if (!emp || !onbCanTick_(me, x, emp, ctx)) fail_('forbidden');
    var st = ['done', 'skipped', 'open'].indexOf(req.status) >= 0 ? req.status : 'done';
    if (st === 'skipped' && !isHr_(me)) fail_('forbidden');
    x.status = st; x.doneBy = st === 'open' ? '' : me.id; x.doneAt = st === 'open' ? '' : new Date().toISOString(); x.note = str_(req.note, 300);
    update_(SHEETS.ONB, x);
    return { ok: true, task: publicOnb_(x, me, emp, ctx) };
  });
}

// ---------------- pulse survey (anonymous) ----------------

var MIN_GROUP = 5;
var PULSE_ITEMS = [
  { key: 'enps', kind: 'nps', ar: 'ما مدى احتمال أن تنصح صديقا بالعمل في شركتنا؟', en: 'How likely are you to recommend working here to a friend?' },
  { key: 'engaged', kind: 'likert', ar: 'أشعر بالحماس والانخراط في عملي', en: 'I feel engaged and energised by my work' },
  { key: 'belong', kind: 'likert', ar: 'أشعر بالانتماء لهذه الشركة', en: 'I feel I belong at this company' },
  { key: 'manager', kind: 'likert', ar: 'مديري يدعم تطوري ويعطيني ملاحظات منتظمة', en: 'My manager supports my growth and gives me regular feedback' },
  { key: 'growth', kind: 'likert', ar: 'أرى فرصة واضحة للتعلم والتطور هنا', en: 'I see a clear chance to learn and grow here' },
  { key: 'tools', kind: 'likert', ar: 'لدي الأدوات والموارد لأؤدي عملي جيدا', en: 'I have the tools and resources to do my job well' }
];

function voterHash_(surveyId, empId) { return hmac_('survey|' + surveyId + '|' + empId).slice(0, 22); }
function publicSurvey_(s) {
  return { id: s.id, ref: s.ref, titleAr: s.titleAr, titleEn: s.titleEn, items: parseJson_(s.questionsJson, PULSE_ITEMS), status: s.status,
    opensAt: s.opensAt, closesAt: String(s.closesAt || '').slice(0, 10), eligible: Number(s.eligible) || 0, answered: parseJson_(s.votersJson, []).length };
}

function api_surveySave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    if (readAll_(SHEETS.SRV).some(function (s) { return s.status === 'open'; })) fail_('survey_open');
    var close = isoDate_(req.closesAt) || addDays_(today_(), 14);
    if (close <= today_()) fail_('bad_date');
    var active = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active'; }).length, now = new Date().toISOString();
    var s = { id: newId_('V'), ref: nextRef_('survey', refsOf_(SHEETS.SRV)), titleAr: str_(req.titleAr, 120) || 'استبيان النبض', titleEn: str_(req.titleEn, 120) || 'Pulse survey',
      questionsJson: JSON.stringify(PULSE_ITEMS), status: 'open', opensAt: now, closesAt: close, eligible: active, votersJson: '[]', createdBy: me.id, createdAt: now };
    append_(SHEETS.SRV, s);
    audit_(me.id, 'survey_open', '', { ref: s.ref, eligible: active });
    return { ok: true, survey: publicSurvey_(s) };
  });
}
function api_surveyClose(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var s = findBy_(SHEETS.SRV, 'id', req.id);
    if (!s) fail_('not_found');
    s.status = 'closed'; update_(SHEETS.SRV, s);
    audit_(me.id, 'survey_close', '', { ref: s.ref });
    return { ok: true };
  });
}
/** Open surveys this person has not answered yet (closed on their date automatically). */
function api_mySurveys(req, me) {
  var t = today_();
  var rows = readAll_(SHEETS.SRV).filter(function (s) { return s.status === 'open' && String(s.closesAt).slice(0, 10) >= t && parseJson_(s.votersJson, []).indexOf(voterHash_(s.id, me.id)) < 0; });
  return { ok: true, rows: rows.map(publicSurvey_) };
}
function api_surveyAnswer(req, me) {
  return withLock_(function () {
    var s = findBy_(SHEETS.SRV, 'id', req.id);
    if (!s || s.status !== 'open' || String(s.closesAt).slice(0, 10) < today_()) fail_('survey_closed');
    var voters = parseJson_(s.votersJson, []), h = voterHash_(s.id, me.id);
    if (voters.indexOf(h) >= 0) fail_('already_submitted');
    var items = parseJson_(s.questionsJson, PULSE_ITEMS), a = req.answers || {}, clean = {};
    items.forEach(function (it) {
      var v = Number(a[it.key]);
      var okv = it.kind === 'nps' ? v >= 0 && v <= 10 : v >= 1 && v <= 5;
      if (!okv || v % 1) fail_('bad_value');
      clean[it.key] = v;
    });
    var emp = findBy_(SHEETS.EMP, 'id', me.id) || me, hire = String(emp.hireDate || '').slice(0, 10), yrs = hire ? daysBetween_(hire, today_()) / 365.25 : null;
    append_(SHEETS.SANS, { id: newId_('A'), surveyId: s.id, departmentId: emp.departmentId || '', tenureBand: yrs == null ? '' : yrs < 1 ? '<1' : yrs < 3 ? '1-3' : yrs < 5 ? '3-5' : '5+',
      answersJson: JSON.stringify(clean), comment: str_(req.comment, 500), at: today_() });
    voters.push(h); voters.sort();
    s.votersJson = JSON.stringify(voters); update_(SHEETS.SRV, s);
    return { ok: true };
  });
}
function scoreBlock_(list, items) {
  var o = { n: list.length };
  if (list.length < MIN_GROUP) { o.hidden = true; return o; }
  items.forEach(function (it) {
    var vals = list.map(function (x) { return Number(x.a[it.key]); }).filter(function (v) { return isFinite(v); });
    if (it.kind === 'nps') {
      var pro = vals.filter(function (v) { return v >= 9; }).length, det = vals.filter(function (v) { return v <= 6; }).length;
      o.enps = Math.round((pro - det) / vals.length * 100); o.promoters = pct_(pro, vals.length); o.detractors = pct_(det, vals.length); o.passives = pct_(vals.length - pro - det, vals.length);
    } else o[it.key] = { avg: Math.round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length * 100) / 100, favorable: pct_(vals.filter(function (v) { return v >= 4; }).length, vals.length) };
  });
  return o;
}
/** Aggregates only; nothing that could single anyone out. */
function api_surveyResults(req, me) {
  if (!canDash_(me)) fail_('forbidden');
  var all = readAll_(SHEETS.SRV).filter(function (s) { return s.status !== 'deleted'; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  var s = req.id ? all.filter(function (x) { return x.id === req.id; })[0] : all[0];
  if (!s) return { ok: true, survey: null, surveys: [] };
  var items = parseJson_(s.questionsJson, PULSE_ITEMS), ctx = orgCtx_();
  var ans = readAll_(SHEETS.SANS).filter(function (x) { return x.surveyId === s.id; }).map(function (x) { return { a: parseJson_(x.answersJson, {}), d: x.departmentId, t: x.tenureBand, c: x.comment }; });
  var byDept = {}, byTen = {};
  ans.forEach(function (x) { (byDept[x.d || '-'] = byDept[x.d || '-'] || []).push(x); (byTen[x.t || '-'] = byTen[x.t || '-'] || []).push(x); });
  var overall = scoreBlock_(ans, items);
  var comments = overall.hidden ? [] : ans.map(function (x) { return x.c; }).filter(Boolean);
  for (var i = comments.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = comments[i]; comments[i] = comments[j]; comments[j] = tmp; }
  var trend = all.slice(0, 6).reverse().map(function (x) {
    var list = readAll_(SHEETS.SANS).filter(function (y) { return y.surveyId === x.id; }).map(function (y) { return { a: parseJson_(y.answersJson, {}) }; }), b = scoreBlock_(list, parseJson_(x.questionsJson, PULSE_ITEMS));
    return { ref: x.ref, at: String(x.opensAt).slice(0, 10), n: list.length, enps: b.hidden ? null : b.enps };
  });
  return { ok: true, survey: publicSurvey_(s), surveys: all.map(publicSurvey_), responses: ans.length, rate: pct_(ans.length, Number(s.eligible) || 0), minGroup: MIN_GROUP,
    overall: overall, departments: Object.keys(byDept).map(function (k) { var b = scoreBlock_(byDept[k], items); b.department = ctx.depts[k] ? ctx.depts[k].nameAr : '-'; return b; }),
    tenure: Object.keys(byTen).map(function (k) { var b = scoreBlock_(byTen[k], items); b.band = k; return b; }), comments: comments, trend: trend };
}

// ---------------- policies and acknowledgements ----------------

function publicPolicy_(p) {
  return { id: p.id, ref: p.ref, code: p.code, titleAr: p.titleAr, titleEn: p.titleEn, bodyAr: p.bodyAr, bodyEn: p.bodyEn, version: Number(p.version) || 1,
    effectiveFrom: String(p.effectiveFrom || '').slice(0, 10), status: p.status, updatedAt: p.updatedAt };
}
/** New policy, or a new version of one: a changed text asks everyone to acknowledge again. */
function api_policySave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.policy || {};
  var title = str_(x.titleAr, 150), body = String(x.bodyAr == null ? '' : x.bodyAr).slice(0, 20000);
  if (!title || !body.trim()) fail_('missing_fields');
  return withLock_(function () {
    var now = new Date().toISOString(), p = x.id ? findBy_(SHEETS.POL, 'id', x.id) : null;
    if (x.id && !p) fail_('not_found');
    if (p) {
      var changed = p.bodyAr !== body || String(p.bodyEn || '') !== String(x.bodyEn || '') || p.titleAr !== title;
      if (changed) p.version = (Number(p.version) || 1) + 1;
      p.titleAr = title; p.titleEn = str_(x.titleEn, 150); p.bodyAr = body; p.bodyEn = String(x.bodyEn || '').slice(0, 20000);
      p.status = x.status === 'retired' ? 'retired' : 'active'; p.effectiveFrom = isoDate_(x.effectiveFrom) || p.effectiveFrom; p.updatedAt = now;
      update_(SHEETS.POL, p);
      audit_(me.id, 'policy_save', '', { ref: p.ref, version: p.version });
      return { ok: true, policy: publicPolicy_(p) };
    }
    var n = { id: newId_('L'), ref: nextRef_('policy', refsOf_(SHEETS.POL)), code: str_(x.code, 30), titleAr: title, titleEn: str_(x.titleEn, 150), bodyAr: body, bodyEn: String(x.bodyEn || '').slice(0, 20000),
      version: 1, effectiveFrom: isoDate_(x.effectiveFrom) || today_(), status: 'active', createdBy: me.id, createdAt: now, updatedAt: now };
    append_(SHEETS.POL, n);
    audit_(me.id, 'policy_save', '', { ref: n.ref, version: 1 });
    return { ok: true, policy: publicPolicy_(n) };
  });
}
/** Active policies with my acknowledgement; HR also gets coverage per policy (who is still missing). */
function api_policyList(req, me) {
  var acks = readAll_(SHEETS.PACK), pols = readAll_(SHEETS.POL).filter(function (p) { return p.status === 'active' || (isHr_(me) && req.all); });
  var mine = {}; acks.forEach(function (a) { if (a.empId === me.id) mine[a.policyId + '|' + a.version] = a.at; });
  var rows = pols.map(function (p) { var o = publicPolicy_(p); o.ackedAt = mine[p.id + '|' + o.version] || ''; return o; });
  var out = { ok: true, rows: rows, pending: rows.filter(function (r) { return r.status === 'active' && !r.ackedAt; }).length };
  if (isHr_(me)) {
    var emps = readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active'; });
    out.coverage = pols.filter(function (p) { return p.status === 'active'; }).map(function (p) {
      var v = Number(p.version) || 1, who = {}; acks.forEach(function (a) { if (a.policyId === p.id && Number(a.version) === v) who[a.empId] = 1; });
      var missing = emps.filter(function (e) { return !who[e.id]; });
      return { id: p.id, ref: p.ref, titleAr: p.titleAr, version: v, acked: emps.length - missing.length, people: emps.length, missing: missing.slice(0, 200).map(empCard_) };
    });
  }
  return out;
}
function api_policyAck(req, me) {
  return withLock_(function () {
    var p = findBy_(SHEETS.POL, 'id', req.id);
    if (!p || p.status !== 'active') fail_('not_found');
    var v = Number(p.version) || 1;
    if (Number(req.version) !== v) fail_('policy_changed');
    if (readAll_(SHEETS.PACK).some(function (a) { return a.policyId === p.id && a.empId === me.id && Number(a.version) === v; })) return { ok: true, already: true };
    append_(SHEETS.PACK, { id: newId_('K'), policyId: p.id, version: v, empId: me.id, at: new Date().toISOString() });
    audit_(me.id, 'policy_ack', me.id, { ref: p.ref, version: v });
    return { ok: true };
  });
}

// ---------------- development and improvement plans ----------------

function planCanManage_(me, emp, ctx) { return isHr_(me) || manages_(me, emp, ctx); }
function publicPlan_(x, me, ctx) {
  var emp = ctx.emps[x.empId];
  return { id: x.id, ref: x.ref, type: x.type, emp: empCard_(emp), titleAr: x.titleAr, reason: me.id === x.empId || planCanManage_(me, emp, ctx) ? x.reason : '',
    goals: parseJson_(x.goalsJson, []), support: x.support, startDate: String(x.startDate).slice(0, 10), endDate: String(x.endDate).slice(0, 10), status: x.status,
    checkIns: parseJson_(x.checkInsJson, []), acknowledgedAt: x.ackAt, employeeComment: x.employeeComment, outcomeNote: x.outcomeNote,
    createdBy: ctx.emps[x.createdBy] ? ctx.emps[x.createdBy].name : '', canManage: planCanManage_(me, emp, ctx), canClose: isHr_(me) && me.id !== x.empId, mine: me.id === x.empId };
}
/**
 * A manager or HR writes the plan. PIP: 30-90 days, at least one goal with a measure, the support given and the
 * reason (specific, factual). The employee sees it at once and acknowledges; nobody writes their own.
 */
function api_planSave(req, me) {
  var x = req.plan || {}, ctx = orgCtx_(), emp = ctx.emps[x.empId];
  if (!emp || emp.status !== 'active') fail_('not_found');
  if (emp.id === me.id) fail_('forbidden');
  if (!planCanManage_(me, emp, ctx)) fail_('forbidden');
  var type = x.type === 'pip' ? 'pip' : 'idp', start = isoDate_(x.startDate) || today_(), end = isoDate_(x.endDate);
  if (!end || end <= start) fail_('bad_range');
  var len = daysBetween_(start, end);
  if (type === 'pip' && (len < 30 || len > 90)) fail_('pip_length');
  if (type === 'idp' && len > 731) fail_('bad_range');
  var goals = (Array.isArray(x.goals) ? x.goals : []).slice(0, 8).map(function (g) { return { title: str_(g.title, 200), measure: str_(g.measure, 300), due: isoDate_(g.due) || end, status: 'open' }; })
    .filter(function (g) { return g.title; });
  if (!goals.length) fail_('missing_fields');
  if (type === 'pip' && (goals.some(function (g) { return !g.measure; }) || !str_(x.reason, 10) || !str_(x.support, 10))) fail_('pip_incomplete');
  return withLock_(function () {
    var open = readAll_(SHEETS.PLAN).some(function (p) { return p.empId === emp.id && p.type === type && (p.status === 'active' || p.status === 'extended'); });
    if (open) fail_('plan_open');
    var now = new Date().toISOString(), row = { id: newId_('D'), ref: nextRef_(type, refsOf_(SHEETS.PLAN)), empId: emp.id, type: type, titleAr: str_(x.titleAr, 150),
      reason: str_(x.reason, 1500), goalsJson: JSON.stringify(goals), support: str_(x.support, 1500), startDate: start, endDate: end, status: 'active', checkInsJson: '[]',
      ackAt: '', employeeComment: '', outcomeNote: '', createdBy: me.id, createdAt: now, updatedAt: now };
    append_(SHEETS.PLAN, row);
    audit_(me.id, type === 'pip' ? 'pip_start' : 'idp_start', emp.id, { ref: row.ref, end: end });
    return { ok: true, plan: publicPlan_(row, me, ctx) };
  });
}
function api_planList(req, me) {
  var ctx = orgCtx_();
  var rows = readAll_(SHEETS.PLAN).filter(function (p) { var e = ctx.emps[p.empId]; return p.empId === me.id || (e && planCanManage_(me, e, ctx)); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (p) { return publicPlan_(p, me, ctx); });
  return { ok: true, rows: rows };
}
/** A dated check-in with goal progress; the manager (or HR) records it. */
function api_planCheckIn(req, me) {
  return withLock_(function () {
    var p = findBy_(SHEETS.PLAN, 'id', req.id), ctx = orgCtx_();
    if (!p) fail_('not_found');
    if (!planCanManage_(me, ctx.emps[p.empId], ctx) || me.id === p.empId) fail_('forbidden');
    if (p.status !== 'active' && p.status !== 'extended') fail_('plan_closed');
    var note = str_(req.note, 1000); if (!note) fail_('missing_fields');
    var goals = parseJson_(p.goalsJson, []), st = req.goalStatus || {};
    goals.forEach(function (g, i) { if (['open', 'on_track', 'at_risk', 'met', 'not_met'].indexOf(st[i]) >= 0) g.status = st[i]; });
    var ci = parseJson_(p.checkInsJson, []); ci.push({ date: today_(), note: note, by: me.name });
    p.goalsJson = JSON.stringify(goals); p.checkInsJson = JSON.stringify(ci.slice(-40)); p.updatedAt = new Date().toISOString();
    update_(SHEETS.PLAN, p);
    return { ok: true, plan: publicPlan_(p, me, ctx) };
  });
}
function api_planAck(req, me) {
  return withLock_(function () {
    var p = findBy_(SHEETS.PLAN, 'id', req.id), ctx = orgCtx_();
    if (!p || p.empId !== me.id) fail_('not_found');
    if (p.ackAt) fail_('already_submitted');
    p.ackAt = new Date().toISOString(); p.employeeComment = str_(req.comment, 1000); p.updatedAt = p.ackAt;
    update_(SHEETS.PLAN, p);
    audit_(me.id, 'plan_ack', me.id, { ref: p.ref });
    return { ok: true, plan: publicPlan_(p, me, ctx) };
  });
}
/** HR records the outcome: met, not met, or extended to a new end (a PIP stays within 90 days in total). */
function api_planClose(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var p = findBy_(SHEETS.PLAN, 'id', req.id), ctx = orgCtx_();
    if (!p) fail_('not_found');
    if (p.empId === me.id) fail_('forbidden');
    if (p.status !== 'active' && p.status !== 'extended') fail_('plan_closed');
    var out = ['met', 'not_met', 'extended', 'cancelled'].indexOf(req.outcome) >= 0 ? req.outcome : '';
    if (!out) fail_('bad_value');
    var note = str_(req.note, 1000); if (!note) fail_('missing_fields');
    if (out === 'extended') {
      var end = isoDate_(req.endDate);
      if (!end || end <= String(p.endDate).slice(0, 10)) fail_('bad_range');
      if (p.type === 'pip' && daysBetween_(String(p.startDate).slice(0, 10), end) > 90) fail_('pip_length');
      p.endDate = end; p.status = 'extended';
    } else p.status = out === 'met' ? 'closed_met' : out === 'not_met' ? 'closed_not_met' : 'cancelled';
    p.outcomeNote = note; p.updatedAt = new Date().toISOString();
    update_(SHEETS.PLAN, p);
    audit_(me.id, 'plan_close', p.empId, { ref: p.ref, outcome: out });
    return { ok: true, plan: publicPlan_(p, me, ctx) };
  });
}


// ======================================================================= exit interview (Wave 3, 2026-10-18)
// Opened when an offboarding clearance starts (Custody.gs clearanceOpen_). The leaver rates five areas 1-5, gives the main
// reason, would-return and recommend (0-10), and a comment. HR sees only aggregates, and only from MIN_GROUP answers; comments
// are shown without names and shuffled. Nobody, HR included, reads one person's answers through the API.
var EXIT_AREAS = ['manager', 'pay', 'growth', 'workload', 'culture'];
var EXIT_REASONS = ['pay', 'growth', 'manager', 'workload', 'relocation', 'family', 'study', 'better_offer', 'health', 'other'];

function exitSurveyOpen_(emp) {
  if (readAll_(SHEETS.EXS).some(function (x) { return x.empId === emp.id && x.status !== 'cancelled'; })) return null;
  var now = new Date().toISOString(), row = { id: newId_('X'), ref: nextRef_('exit_survey', refsOf_(SHEETS.EXS)), empId: emp.id, status: 'open', answersJson: '{}',
    reason: '', submittedAt: '', createdAt: now };
  append_(SHEETS.EXS, row);
  return row;
}
function api_myExitSurvey(req, me) {
  var x = readAll_(SHEETS.EXS).filter(function (r) { return r.empId === me.id && r.status === 'open'; })[0];
  return { ok: true, survey: x ? { id: x.id, ref: x.ref, areas: EXIT_AREAS, reasons: EXIT_REASONS } : null };
}
function api_exitSurveySubmit(req, me) {
  var a = req.answers || {}, out = { ratings: {} };
  EXIT_AREAS.forEach(function (k) { var n = Math.floor(Number(a.ratings && a.ratings[k])); if (!(n >= 1 && n <= 5)) fail_('missing_fields'); out.ratings[k] = n; });
  if (EXIT_REASONS.indexOf(a.reason) < 0) fail_('missing_fields');
  var rec = Math.floor(Number(a.recommend));
  if (!(rec >= 0 && rec <= 10)) fail_('bad_value');
  out.reason = a.reason; out.recommend = rec; out.wouldReturn = a.wouldReturn === true; out.comment = str_(a.comment, 1000);
  return withLock_(function () {
    var x = readAll_(SHEETS.EXS).filter(function (r) { return r.empId === me.id && r.status === 'open'; })[0];
    if (!x) fail_('not_found');
    x.answersJson = JSON.stringify(out); x.reason = out.reason; x.status = 'submitted'; x.submittedAt = new Date().toISOString();
    update_(SHEETS.EXS, x);
    audit_(me.id, 'exit_survey_submit', me.id, { ref: x.ref });
    return { ok: true };
  });
}
/** The hr role only: averages, reasons, recommend score and anonymous comments, from MIN_GROUP answers in the period. */
function api_exitSurveyResults(req, me) {
  if (me.role !== 'hr' && !hasRole_(me, 'executive')) fail_('forbidden');
  var from = isoDate_(req.from) || addDays_(today_(), -365), to = isoDate_(req.to) || today_();
  var rows = readAll_(SHEETS.EXS).filter(function (x) { return x.status === 'submitted' && String(x.submittedAt).slice(0, 10) >= from && String(x.submittedAt).slice(0, 10) <= to; });
  var open = readAll_(SHEETS.EXS).filter(function (x) { return x.status === 'open'; }).length;
  if (rows.length < MIN_GROUP) return { ok: true, count: rows.length, open: open, minGroup: MIN_GROUP, hidden: true };
  var sum = {}, reasons = {}, prom = 0, det = 0, back = 0, comments = [];
  rows.forEach(function (x) {
    var a = parseJson_(x.answersJson, {});
    EXIT_AREAS.forEach(function (k) { sum[k] = (sum[k] || 0) + (Number(a.ratings && a.ratings[k]) || 0); });
    reasons[a.reason] = (reasons[a.reason] || 0) + 1;
    if (a.recommend >= 9) prom++; else if (a.recommend <= 6) det++;
    if (a.wouldReturn) back++;
    if (a.comment) comments.push(a.comment);
  });
  for (var i = comments.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = comments[i]; comments[i] = comments[j]; comments[j] = tmp; }
  var avg = {}; EXIT_AREAS.forEach(function (k) { avg[k] = Math.round(sum[k] / rows.length * 10) / 10; });
  return { ok: true, count: rows.length, open: open, averages: avg, reasons: reasons, enps: Math.round((prom - det) / rows.length * 100),
    wouldReturn: Math.round(back / rows.length * 100), comments: comments };
}

// ======================================================================= recognition / kudos (Wave 3, 2026-10-18)
var KUDOS_VALUES = ['teamwork', 'customer', 'safety', 'initiative', 'excellence'];
function kudosPublic_(k, ctx) { return { id: k.id, from: empCard_(ctx.emps[k.fromId]), to: empCard_(ctx.emps[k.toId]), value: k.value, message: k.message, at: k.createdAt }; }
function api_kudosSend(req, me) {
  var d = req.kudos || {}, msg = str_(d.message, 280);
  if (KUDOS_VALUES.indexOf(d.value) < 0 || !msg) fail_('missing_fields');
  if (d.toId === me.id) fail_('cannot_decide_own');
  return withLock_(function () {
    var ctx = orgCtx_(), to = ctx.emps[d.toId];
    if (!to || to.status !== 'active') fail_('not_found');
    var t = today_();
    if (readAll_(SHEETS.KUD).filter(function (k) { return k.fromId === me.id && String(k.createdAt).slice(0, 10) === t; }).length >= 5) fail_('kudos_daily_limit');
    var row = { id: newId_('U'), fromId: me.id, toId: to.id, value: d.value, message: msg, status: 'active', createdAt: new Date().toISOString() };
    append_(SHEETS.KUD, row);
    audit_(me.id, 'kudos_send', to.id, { value: d.value });
    return { ok: true, kudos: kudosPublic_(row, ctx) };
  });
}
/** The company feed (everyone), what I received, and people to thank. */
function api_kudosFeed(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.KUD).filter(function (k) { return k.status === 'active'; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  var people = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.id !== me.id; })
    .map(function (e) { return { id: e.id, name: e.name, nameEn: e.nameEn, empNo: String(e.empNo) }; });
  return { ok: true, values: KUDOS_VALUES, feed: all.slice(0, 40).map(function (k) { return kudosPublic_(k, ctx); }),
    mine: all.filter(function (k) { return k.toId === me.id; }).slice(0, 20).map(function (k) { return kudosPublic_(k, ctx); }),
    received: all.filter(function (k) { return k.toId === me.id; }).length, sentToday: all.filter(function (k) { return k.fromId === me.id && String(k.createdAt).slice(0, 10) === today_(); }).length, people: people };
}
/** HR, executives: by value and by department, this month and the last 12 months. */
function api_kudosStats(req, me) {
  if (!isHr_(me) && !hasRole_(me, 'executive')) fail_('forbidden');
  var ctx = orgCtx_(), since = govAddMonths_(today_().slice(0, 7) + '-01', -11).slice(0, 7), byMonth = {}, byValue = {}, byDept = {}, top = {};
  readAll_(SHEETS.KUD).forEach(function (k) {
    if (k.status !== 'active') return;
    var m = String(k.createdAt).slice(0, 7); if (m < since) return;
    byMonth[m] = (byMonth[m] || 0) + 1; byValue[k.value] = (byValue[k.value] || 0) + 1;
    var e = ctx.emps[k.toId] || {}, dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    byDept[dn] = (byDept[dn] || 0) + 1; top[k.toId] = (top[k.toId] || 0) + 1;
  });
  return { ok: true, byMonth: byMonth, byValue: byValue, byDept: byDept,
    top: Object.keys(top).sort(function (a, b) { return top[b] - top[a]; }).slice(0, 10).map(function (id) { return { emp: empCard_(ctx.emps[id]), count: top[id] }; }) };
}
hrisHook_('tasks', function (me, ctx, add) {
  add('exit_survey', readAll_(SHEETS.EXS).filter(function (x) { return x.empId === me.id && x.status === 'open'; }).length, { tab: 'file' });
});
