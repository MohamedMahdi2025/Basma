/**
 * Employee relations (gap study items 6 and 10), 2026-09-30.
 *
 * Disciplinary cases, following the Labour Law steps:
 *  - A penalty schedule (the company's approved work regulation, لائحة تنظيم العمل): each violation has the penalty for
 *    the 1st to 4th occurrence. DISC_STARTER is a starting point loosely based on the ministry's model regulation; HR
 *    must replace it with the approved one before using it for real cases.
 *  - A case can only be opened within 30 days of discovering the violation (Art. 71).
 *  - The employee is charged in writing (they see the case in the app and may answer); no penalty without at least one
 *    recorded hearing / investigation (Art. 71). The decision is taken by HR, never by the person who reported it.
 *  - The occurrence counts repeats of the same violation in the previous 180 days.
 *  - Fines and suspension become payroll deductions (the month is the decision month, the next if it is locked); a
 *    suspension is at most 5 days in a month (Art. 66) and payroll already caps fines at 5 days' wage a month (Art. 70).
 *  - Art. 72 as amended (in force 19 Feb 2025): the employee may file a written grievance within 30 days of being
 *    notified of the decision, official holidays (the holidays tab) not counted; the employer decides within 15 days
 *    (a deadline in the compliance calendar and the bell); the worker then has 30 days to go to the labour court.
 *    The notice day defaults to the decision day; HR records a later one (registered mail) with discNotice.
 *
 * Work injuries: reported by anyone who sees it (manager, HR, the employee); GOSI must be notified within 3 days; the
 * days off for the injury count as paid leave (subtype 'injury') so attendance never shows them as absence.
 */

var DISC_STARTER = [
  { code: 'LATE15', ar: 'التأخر عن بداية الدوام حتى 15 دقيقة دون إذن أو عذر', en: 'Late up to 15 minutes without permission', p: ['warning', 'fine_pct:5', 'fine_pct:10', 'fine_pct:20'] },
  { code: 'LATE30', ar: 'التأخر من 15 إلى 30 دقيقة دون إذن أو عذر', en: 'Late 15-30 minutes without permission', p: ['fine_pct:10', 'fine_pct:15', 'fine_pct:25', 'fine_pct:50'] },
  { code: 'LATE60', ar: 'التأخر من 30 دقيقة إلى ساعة دون إذن أو عذر', en: 'Late 30-60 minutes without permission', p: ['fine_pct:25', 'fine_pct:50', 'fine_pct:75', 'fine_days:1'] },
  { code: 'EARLY', ar: 'ترك العمل أو الانصراف قبل الموعد دون إذن', en: 'Leaving before the end of the shift without permission', p: ['warning', 'fine_pct:10', 'fine_pct:25', 'fine_days:1'] },
  { code: 'ABS1', ar: 'الغياب يوما دون إذن أو عذر مقبول', en: 'One day of absence without permission', p: ['fine_days:2', 'fine_days:3', 'fine_days:4', 'dismiss_award'] },
  { code: 'SAFETY', ar: 'مخالفة تعليمات السلامة في مواقع الغاز أو النقل', en: 'Breaking safety instructions at gas sites or in transport', p: ['written', 'fine_days:1', 'suspend:3', 'dismiss_award'] },
  { code: 'SMOKE', ar: 'التدخين في الأماكن المحظورة (مستودعات ومركبات الغاز)', en: 'Smoking in prohibited areas (gas stores and vehicles)', p: ['fine_days:2', 'suspend:3', 'dismiss_award', 'dismiss_award'] },
  { code: 'CUSTODY', ar: 'الإهمال في العهدة الموكلة (أسطوانات، مركبات، أجهزة نقاط البيع)', en: 'Negligence with company custody (cylinders, vehicles, POS devices)', p: ['written', 'fine_days:1', 'fine_days:2', 'suspend:3'] }
];
var PENALTY_KINDS = { warning: 1, written: 1, fine_pct: 1, fine_days: 1, suspend: 1, deny_raise: 1, deny_promotion: 1, dismiss_award: 1, dismiss_art80: 1 };

function penaltyOk_(p) {
  var m = /^([a-z_0-9]+)(?::(\d+(?:\.\d+)?))?$/.exec(String(p || ''));
  if (!m || !PENALTY_KINDS[m[1]]) return false;
  if ((m[1] === 'fine_pct' || m[1] === 'fine_days' || m[1] === 'suspend') && !(Number(m[2]) > 0)) return false;
  if (m[1] === 'fine_pct' && Number(m[2]) > 100) return false;
  if ((m[1] === 'fine_days' || m[1] === 'suspend') && Number(m[2]) > 5) return false; // Art. 66: a fine or suspension of at most 5 days
  return true;
}
function penaltyParts_(p) { var m = String(p).split(':'); return { kind: m[0], n: Number(m[1]) || 0 }; }

function discCodes_() {
  var rows = readAll_(SHEETS.DCODE).filter(function (c) { return c.status !== 'deleted'; });
  if (rows.length) return rows.map(function (c) { return { id: c.id, code: c.code, ar: c.titleAr, en: c.titleEn, p: [c.p1, c.p2, c.p3, c.p4], status: c.status, starter: false }; });
  return DISC_STARTER.map(function (c) { return { id: 'starter:' + c.code, code: c.code, ar: c.ar, en: c.en, p: c.p, status: 'active', starter: true }; });
}
function api_discCodes(req, me) {
  if (!isHr_(me) && !managesAnyone_(me, orgCtx_())) fail_('forbidden');
  var list = discCodes_();
  return { ok: true, rows: list, starter: list.length > 0 && list[0].starter };
}
/** HR saves the approved schedule (the whole list at once, replacing the starter). */
function api_discCodesSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var list = (Array.isArray(req.rows) ? req.rows : []).slice(0, 120);
  if (!list.length) fail_('missing_fields');
  list.forEach(function (c) {
    if (!/^[A-Z0-9_-]{2,16}$/.test(String(c.code || '')) || !str_(c.ar, 300)) fail_('bad_value');
    if (!Array.isArray(c.p) || c.p.length !== 4 || !c.p.every(penaltyOk_)) fail_('bad_penalty');
  });
  return withLock_(function () {
    var old = readAll_(SHEETS.DCODE), now = new Date().toISOString(), byCode = {};
    old.forEach(function (c) { byCode[c.code] = c; });
    var upd = [], add = [];
    list.forEach(function (c) {
      var o = byCode[c.code];
      var row = o || { id: newId_('Z'), code: c.code, createdAt: now };
      row.titleAr = str_(c.ar, 300); row.titleEn = str_(c.en, 300); row.p1 = c.p[0]; row.p2 = c.p[1]; row.p3 = c.p[2]; row.p4 = c.p[3]; row.status = 'active'; row.updatedAt = now;
      (o ? upd : add).push(row); delete byCode[c.code];
    });
    Object.keys(byCode).forEach(function (k) { byCode[k].status = 'deleted'; upd.push(byCode[k]); });
    if (upd.length) updateMany_(SHEETS.DCODE, upd);
    if (add.length) appendMany_(SHEETS.DCODE, add);
    audit_(me.id, 'disc_codes_save', '', { count: list.length });
    return { ok: true, count: list.length };
  });
}

function dailyWage_(empId, date) { var c = currentCompMap_(date)[empId]; return c ? c.total / 30 : 0; }

// ---------------- Art. 72 windows (amended 2025) ----------------
var ART72_OBJECT_DAYS = 30, ART72_DECIDE_DAYS = 15, ART72_COURT_DAYS = 30;
/** The Riyadh calendar day of an ISO timestamp (a stored date passes through). */
function isoLocalDay_(v) {
  var s = String(v || '');
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var ms = Date.parse(s);
  return isFinite(ms) ? localParts_(new Date(ms)).date : s.slice(0, 10);
}
/** Last day to file: 30 days after the notice, a day on an active official holiday not counted. */
function objectionDue_(notified, hol) {
  var d = notified, n = 0;
  for (var i = 0; n < ART72_OBJECT_DAYS && i < 400; i++) { d = addDays_(d, 1); if (!hol[d]) n++; }
  return d;
}
function caseNotified_(x) { return isoLocalDay_(x.notifiedOn) || isoLocalDay_(x.decidedAt); }
function caseObjectionDue_(x, hol) { var n = caseNotified_(x); return n ? objectionDue_(n, hol || holidayMap_()) : ''; }
/** The employer answers a grievance within 15 days of receiving it. */
function caseDecideDue_(x) { var d = isoLocalDay_(x.objectedAt); return d ? addDays_(d, ART72_DECIDE_DAYS) : ''; }

function publicCase_(x, me, ctx) {
  var hr = isHr_(me), mine = x.empId === me.id, t72 = today_();
  var objDue = x.decidedAt ? caseObjectionDue_(x) : '', decDue = x.status === 'objected' ? caseDecideDue_(x) : '';
  return { id: x.id, ref: x.ref, emp: empCard_(ctx.emps[x.empId]), code: x.code, violation: x.violation, occurrence: Number(x.occurrence) || 1,
    incidentDate: String(x.incidentDate).slice(0, 10), discoveredDate: String(x.discoveredDate).slice(0, 10), description: x.description,
    reportedBy: hr || !mine ? (ctx.emps[x.reportedBy] ? ctx.emps[x.reportedBy].name : '') : '', chargedAt: x.chargedAt, response: x.responseText, respondedAt: x.responseAt,
    hearings: hr || mine ? parseJson_(x.hearingsJson, []) : [], suggested: x.suggested, decision: x.decision, decisionNote: x.decisionNote, decidedAt: x.decidedAt,
    // The amount is pay: the employee, the hr role and payroll see it, an administrator alone does not.
    decidedBy: ctx.emps[x.decidedBy] ? ctx.emps[x.decidedBy].name : '', amount: x.amount === '' || !(mine || canPayroll_(me)) ? null : Number(x.amount), adjMonth: x.adjMonth,
    objection: x.objection, objectedAt: x.objectedAt, objectionResult: x.objectionResult, status: x.status, mine: mine,
    notifiedOn: caseNotified_(x), objectionDue: objDue, objectDaysLeft: objDue && x.status === 'decided' ? Math.max(0, daysBetween_(t72, objDue)) : null,
    decideDue: decDue, decideOverdue: !!decDue && t72 > decDue, courtDays: ART72_COURT_DAYS,
    canRespond: mine && x.status === 'charged', canObject: mine && x.status === 'decided' && !!objDue && t72 <= objDue,
    canNotice: hr && !mine && x.status === 'decided',
    canDecide: hr && x.reportedBy !== me.id && !mine && (x.status === 'charged' || x.status === 'responded') };
}
/** HR or the employee's manager opens a case; it is a written charge the employee sees at once. */
function api_discOpen(req, me) {
  var x = req.case || {}, ctx = orgCtx_(), emp = ctx.emps[x.empId];
  if (!emp || emp.status !== 'active') fail_('not_found');
  if (emp.id === me.id) fail_('forbidden');
  if (!isHr_(me) && !manages_(me, emp, ctx)) fail_('forbidden');
  var codes = discCodes_(), c = codes.filter(function (k) { return k.code === x.code && k.status !== 'deleted'; })[0];
  if (!c) fail_('not_found');
  var t = today_(), inc = isoDate_(x.incidentDate), disc = isoDate_(x.discoveredDate) || inc;
  if (!inc || inc > t || disc < inc || disc > t) fail_('bad_date');
  if (daysBetween_(disc, t) > 30) fail_('too_late'); // Art. 71
  var desc = str_(x.description, 1500); if (desc.length < 10) fail_('missing_fields');
  return withLock_(function () {
    var since = addDays_(inc, -180);
    var prior = readAll_(SHEETS.DCASE).filter(function (k) { return k.empId === emp.id && k.code === c.code && (k.status === 'decided' || k.status === 'closed') && String(k.incidentDate).slice(0, 10) >= since && String(k.incidentDate).slice(0, 10) < inc; }).length;
    var occ = Math.min(4, prior + 1), now = new Date().toISOString();
    var row = { id: newId_('J'), ref: nextRef_('disciplinary', refsOf_(SHEETS.DCASE)), empId: emp.id, code: c.code, violation: c.ar, occurrence: occ, incidentDate: inc, discoveredDate: disc,
      description: desc, reportedBy: me.id, chargedAt: now, responseText: '', responseAt: '', hearingsJson: '[]', suggested: c.p[occ - 1], decision: '', decisionNote: '',
      decidedBy: '', decidedAt: '', amount: '', adjMonth: '', objection: '', objectedAt: '', objectionResult: '', status: 'charged', createdAt: now, updatedAt: now };
    append_(SHEETS.DCASE, row);
    audit_(me.id, 'disc_open', emp.id, { ref: row.ref, code: c.code, occurrence: occ });
    return { ok: true, case: publicCase_(row, me, ctx) };
  });
}
function api_discList(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me);
  var rows = readAll_(SHEETS.DCASE).filter(function (x) { var e = ctx.emps[x.empId]; return x.status !== 'cancelled' && (hr || x.empId === me.id || (e && manages_(me, e, ctx))); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return publicCase_(x, me, ctx); });
  return { ok: true, rows: rows };
}
/** The employee's written answer to the charge. */
function api_discRespond(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || x.empId !== me.id || x.status !== 'charged') fail_('not_found');
    var txt = str_(req.text, 2000); if (!txt) fail_('missing_fields');
    x.responseText = txt; x.responseAt = new Date().toISOString(); x.status = 'responded'; x.updatedAt = x.responseAt;
    update_(SHEETS.DCASE, x);
    audit_(me.id, 'disc_respond', me.id, { ref: x.ref });
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}
/** Minutes of a hearing or investigation (HR). */
function api_discHearing(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || (x.status !== 'charged' && x.status !== 'responded')) fail_('not_found');
    if (x.empId === me.id) fail_('forbidden');
    var m = str_(req.minutes, 3000); if (m.length < 10) fail_('missing_fields');
    var h = parseJson_(x.hearingsJson, []); h.push({ date: isoDate_(req.date) || today_(), by: me.name, minutes: m, attendees: str_(req.attendees, 300) });
    x.hearingsJson = JSON.stringify(h.slice(-20)); x.updatedAt = new Date().toISOString();
    update_(SHEETS.DCASE, x);
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}
/** The decision: never by the reporter; needs a hearing; fines and suspension go to payroll. */
function api_discDecide(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || (x.status !== 'charged' && x.status !== 'responded')) fail_('not_found');
    if (x.empId === me.id) fail_('forbidden');
    if (x.reportedBy === me.id) fail_('second_approver_required');
    if (!parseJson_(x.hearingsJson, []).length) fail_('hearing_required');
    var pen = String(req.penalty || x.suggested), note = str_(req.note, 1000);
    if (req.penalty === 'none') pen = 'none';
    else if (!penaltyOk_(pen)) fail_('bad_penalty');
    if (pen !== x.suggested && !note) fail_('note_required'); // any change from the schedule is explained
    var t = today_(), pp = penaltyParts_(pen), amount = 0, month = t.slice(0, 7);
    if (pp.kind === 'suspend') {
      var used = readAll_(SHEETS.DCASE).filter(function (k) { return k.empId === x.empId && k.status === 'decided' && String(k.decidedAt).slice(0, 7) === month && penaltyParts_(k.decision).kind === 'suspend'; })
        .reduce(function (s, k) { return s + penaltyParts_(k.decision).n; }, 0);
      if (used + pp.n > 5) fail_('suspension_cap');
    }
    if (pp.kind === 'fine_pct') amount = r2_(dailyWage_(x.empId, t) * pp.n / 100);
    if (pp.kind === 'fine_days' || pp.kind === 'suspend') amount = r2_(dailyWage_(x.empId, t) * pp.n);
    if (amount > 0 && me.role !== 'hr') fail_('forbidden'); // a fine or suspension is a pay deduction: the hr role decides it
    if (amount > 0) {
      if (monthLocked_(x.empId, month)) { var d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)); month = d.toISOString().slice(0, 7); }
      append_(SHEETS.ADJ, { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: x.empId, month: month, kind: 'deduction', code: pp.kind === 'suspend' ? 'other_deduction' : 'fine',
        amount: amount, reason: x.ref + ' ' + (pp.kind === 'suspend' ? 'إيقاف ' + pp.n + ' أيام' : 'جزاء'), enteredBy: me.id, status: 'active', createdAt: new Date().toISOString() });
      x.adjMonth = month;
    }
    x.decision = pen; x.decisionNote = note; x.decidedBy = me.id; x.decidedAt = new Date().toISOString(); x.amount = amount || ''; x.status = 'decided'; x.updatedAt = x.decidedAt;
    update_(SHEETS.DCASE, x);
    audit_(me.id, 'disc_decide', x.empId, { ref: x.ref, penalty: pen, amount: amount, month: x.adjMonth });
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}
function api_discObject(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || x.empId !== me.id || x.status !== 'decided') fail_('not_found');
    if (today_() > caseObjectionDue_(x)) fail_('too_late'); // Art. 72 (amended 2025): 30 days from notice, official holidays not counted
    var txt = str_(req.text, 2000); if (!txt) fail_('missing_fields');
    x.objection = txt; x.objectedAt = new Date().toISOString(); x.status = 'objected'; x.updatedAt = x.objectedAt;
    update_(SHEETS.DCASE, x);
    audit_(me.id, 'disc_object', me.id, { ref: x.ref });
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}
/**
 * HR records the day the employee was actually told of the decision (registered mail, a signed copy), when it was not
 * the decision day. Only before a grievance, never earlier than the decision, never in the future.
 */
function api_discNotice(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || x.status !== 'decided') fail_('not_found');
    if (x.empId === me.id) fail_('forbidden');
    var d = isoDate_(req.date);
    if (!d || d < isoLocalDay_(x.decidedAt) || d > today_()) fail_('bad_date');
    var before = caseNotified_(x);
    x.notifiedOn = d; x.updatedAt = new Date().toISOString();
    update_(SHEETS.DCASE, x);
    audit_(me.id, 'disc_notice', x.empId, { ref: x.ref, before: before, notifiedOn: d });
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}
/** Compliance calendar: every grievance waiting for the employer's answer, due 15 days after it was filed. */
function discCalendar_(add, ctx) {
  readAll_(SHEETS.DCASE).forEach(function (x) {
    if (x.status !== 'objected') return;
    add('disc_objection_decide', caseDecideDue_(x), ctx.emps[x.empId], { ref: x.ref });
  });
}
/** The bell's grievance task carries the earliest answer date and how many are overdue. */
function discTaskDue_(me, out) {
  var task = out.filter(function (k) { return k.kind === 'disc_objection'; })[0];
  if (!task) return;
  var t = today_(), dues = readAll_(SHEETS.DCASE).filter(function (x) { return x.status === 'objected' && x.decidedBy !== me.id; }).map(caseDecideDue_).sort();
  task.due = dues[0] || '';
  task.overdue = dues.filter(function (d) { return d < t; }).length;
}
/** HR answers an objection: upheld (penalty stays) or cancelled (any deduction not yet paid is removed). */
function api_discObjectionDecide(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.DCASE, 'id', req.id), ctx = orgCtx_();
    if (!x || x.status !== 'objected') fail_('not_found');
    if (x.empId === me.id) fail_('forbidden'); // nobody rules on the objection to their own penalty (it can delete the deduction)
    if (x.decidedBy === me.id) fail_('second_approver_required'); // someone other than the one who decided
    var res = req.result === 'cancelled' ? 'cancelled' : 'upheld', note = str_(req.note, 1000); if (!note) fail_('note_required');
    if (x.amount && me.role !== 'hr') fail_('forbidden'); // ruling on a penalty with a deduction is pay: the hr role
    if (res === 'cancelled' && x.amount) {
      var adj = readAll_(SHEETS.ADJ).filter(function (a) { return a.empId === x.empId && a.status === 'active' && String(a.reason).indexOf(x.ref) === 0; })[0];
      if (adj && !monthLocked_(adj.empId, adj.month)) { adj.status = 'deleted'; update_(SHEETS.ADJ, adj); }
    }
    x.objectionResult = res + ': ' + note; x.status = 'closed'; x.updatedAt = new Date().toISOString();
    update_(SHEETS.DCASE, x);
    audit_(me.id, 'disc_objection', x.empId, { ref: x.ref, result: res });
    return { ok: true, case: publicCase_(x, me, ctx) };
  });
}

// ---------------- work injuries ----------------

function publicInjury_(x, ctx) {
  return { id: x.id, ref: x.ref, emp: empCard_(ctx.emps[x.empId]), occurredAt: x.occurredAt, place: x.place, description: x.description, firstAid: x.firstAid,
    reportedBy: ctx.emps[x.reportedBy] ? ctx.emps[x.reportedBy].name : '', gosiDue: String(x.gosiDue).slice(0, 10), gosiRef: x.gosiRef, gosiReportedAt: x.gosiReportedAt,
    offFrom: String(x.offFrom || '').slice(0, 10), offTo: String(x.offTo || '').slice(0, 10), status: x.status, closedNote: x.closedNote };
}
function api_injuryReport(req, me) {
  var x = req.injury || {}, ctx = orgCtx_(), emp = ctx.emps[x.empId || me.id];
  if (!emp) fail_('not_found');
  if (emp.id !== me.id && !isHr_(me) && !manages_(me, emp, ctx)) fail_('forbidden');
  var when = String(x.occurredAt || ''), d = when.slice(0, 10);
  if (!isoDate_(d) || d > today_()) fail_('bad_date');
  if (str_(x.description, 2000).length < 10 || !str_(x.place, 200)) fail_('missing_fields');
  return withLock_(function () {
    var now = new Date().toISOString();
    var row = { id: newId_('I'), ref: nextRef_('injury', refsOf_(SHEETS.INJ)), empId: emp.id, occurredAt: when.slice(0, 16), place: str_(x.place, 200), description: str_(x.description, 2000),
      firstAid: str_(x.firstAid, 500), witnesses: str_(x.witnesses, 300), reportedBy: me.id, reportedAt: now, gosiDue: addDays_(d, 3), gosiRef: '', gosiReportedAt: '',
      offFrom: '', offTo: '', status: 'reported', closedNote: '', createdAt: now, updatedAt: now };
    append_(SHEETS.INJ, row);
    audit_(me.id, 'injury_report', emp.id, { ref: row.ref });
    return { ok: true, injury: publicInjury_(row, ctx) };
  });
}
function api_injuryList(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me);
  var rows = readAll_(SHEETS.INJ).filter(function (x) { var e = ctx.emps[x.empId]; return hr || x.empId === me.id || x.reportedBy === me.id || (e && manages_(me, e, ctx)); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return publicInjury_(x, ctx); });
  return { ok: true, rows: rows };
}
/** HR: record the GOSI notification, the days off (paid, never absence) and the close. */
function api_injuryUpdate(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.INJ, 'id', req.id), ctx = orgCtx_();
    if (!x) fail_('not_found');
    if (req.gosiRef != null) { var g = str_(req.gosiRef, 60); if (!g) fail_('missing_fields'); x.gosiRef = g; x.gosiReportedAt = new Date().toISOString(); if (x.status === 'reported') x.status = 'gosi_notified'; }
    if (req.offFrom != null) {
      var a = isoDate_(req.offFrom), b = isoDate_(req.offTo);
      if (!a || !b || b < a) fail_('bad_range');
      x.offFrom = a; x.offTo = b; if (x.status !== 'closed') x.status = 'recovering';
    }
    if (req.close) { var n = str_(req.note, 1000); if (!n) fail_('note_required'); x.status = 'closed'; x.closedNote = n; }
    x.updatedAt = new Date().toISOString();
    update_(SHEETS.INJ, x);
    audit_(me.id, 'injury_update', x.empId, { ref: x.ref, status: x.status });
    return { ok: true, injury: publicInjury_(x, ctx) };
  });
}
