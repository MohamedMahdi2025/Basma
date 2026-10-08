/**
 * Government services (الخدمات الحكومية), gap matrix P0-9, 2026-10-05. Records kept by hand until a Muqeem / Absher
 * link exists (P2-3): HR does the transaction in Muqeem, then records what Muqeem issued here.
 *
 *  - Exit/re-entry visa: a request type in the Leave.gs engine ('exit_reentry', chain manager then HR). On the final
 *    approval a govVisas row waits for HR to record the issued visa (number, expiry, fee, who paid). The manager or HR
 *    confirms the return; past the expiry plus GOV_RETURN_GRACE days HR gets a task. Nothing automatic follows.
 *  - Final exit: HR records it for a leaving non-Saudi (usually from the offboarding clearance), then the departure.
 *  - Iqama register: every non-Saudi with the iqama expiry; a renewal records the new expiry (it updates the private
 *    file and the iqama document), the Muqeem reference and the fees.
 *  - Annual ticket: one entitlement per contract (economy or business, every 1 or 2 years, plus family members),
 *    its use history and what is left in the current cycle. A use with an amount is approved by a payroll holder who
 *    did not record it; a cash ticket then becomes an 'other_earning' line in the next open payroll.
 *  - Fee ledger: iqama, work permit, visas, Muqeem printing... with amount, date and reference. Amounts follow the
 *    dashboard money rule (hr role, payroll, executive; an administrator alone sees none). A fee is verified by a
 *    second person. Art. 40: iqama, work permit, their renewal and exit/re-entry fees are the employer's; a fee marked
 *    as paid by the employee is flagged so HR can refund it. Have counsel confirm before recovering any fee (Art. 92).
 *
 * Also here: the two hooks the compliance calendar and the bell call (extraCalendar_, extraTasks_), which gather the
 * Art. 72 answer dates (Relations.gs), these services, expenses (Expenses.gs) and journals (Journal.gs).
 */

var GOV_FEE_TYPES = ['iqama', 'work_permit', 'exit_reentry', 'final_exit', 'muqeem_print', 'visa', 'transfer', 'other'];
var GOV_EMPLOYER_FEES = { iqama: 1, work_permit: 1, exit_reentry: 1, final_exit: 1 }; // Art. 40: borne by the employer
var GOV_RETURN_GRACE = 7;        // days after an exit/re-entry visa expires before HR is asked to follow up
var GOV_IQAMA_WARN = 60;         // the register and the calendar flag an iqama this many days before it expires
var TICKET_CLASSES = { economy: 1, business: 1 };

/** Enter and verify fee amounts: the hr role or a payroll holder (the administrator while adminSeesPay is on). */
function govMoney_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }
/** See fee amounts: as the dashboard money blocks (hr role, payroll, executive). */
function govSeesMoney_(me) { return govMoney_(me) || hasRole_(me, 'executive'); }
function canGov_(me) { return isHr_(me) || hasRole_(me, 'payroll'); }
function govAddMonths_(d, n) {
  var y = +d.slice(0, 4), m = +d.slice(5, 7) - 1 + n, day = +d.slice(8, 10);
  var ty = y + Math.floor(m / 12), tm = ((m % 12) + 12) % 12, last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ty, tm, Math.min(day, last))).toISOString().slice(0, 10);
}
/** The first payroll month from this one on that is not locked yet. */
function openPayMonth_() {
  var m = today_().slice(0, 7);
  for (var i = 0; i < 24 && monthLocked_(null, m); i++) m = govAddMonths_(m + '-01', 1).slice(0, 7);
  return m;
}
function govPaidBy_(v) { return v === 'employee' ? 'employee' : 'company'; }
function govFeeAmount_(v) { var n = num_(v == null || v === '' ? 0 : v); return isFinite(n) ? n : NaN; }

/** The iqama in force: the latest active iqama document, else the private file's ID expiry. */
function iqamaOf_(empId, docs, priv) {
  var best = null;
  docs.forEach(function (x) { if (x.empId === empId && x.type === 'iqama' && x.status !== 'deleted' && x.expiryDate && (!best || String(x.expiryDate) > String(best.expiryDate))) best = x; });
  var p = priv[empId] || {};
  if (best) return { number: String(best.number || p.nationalId || ''), expiry: String(best.expiryDate).slice(0, 10), docId: best.id };
  return { number: String(p.nationalId || ''), expiry: String(p.idExpiry || '').slice(0, 10), docId: '' };
}
function privMap_() { var m = {}; readAll_(SHEETS.PRIV).forEach(function (p) { m[p.empId] = p; }); return m; }

// ---------------- exit/re-entry: the request (called from Leave.gs) ----------------

/** quote_ for type 'exit_reentry': travel dates, single or multiple, the visa length, an optional linked leave. */
function govQuote_(emp, d, excludeId, q, reqs, t) {
  var p = d.payload || {};
  if (bool_(emp.isSaudi)) return { error: 'saudi_not_applicable' };
  var from = isoDate_(d.fromDate), to = isoDate_(d.toDate);
  if (!from || !to || to < from) return { error: 'bad_date' };
  if (from < t && !d._recheck) return { error: 'bad_date' };
  var vt = p.visaType === 'multiple' || p.visaType === 'single' ? p.visaType : '';
  if (!vt) return { error: 'missing_fields' };
  var dur = Math.round(Number(p.durationDays) || 0);
  if (!(dur >= 1 && dur <= (vt === 'multiple' ? 730 : 365))) return { error: 'bad_value' };
  var trip = daysBetween_(from, to) + 1;
  if (trip > 365) return { error: 'too_many_days' };
  var clash = reqs.some(function (r) { return r.id !== excludeId && r.type === 'exit_reentry' && (r.status === 'pending' || r.status === 'approved') && !(String(r.toDate).slice(0, 10) < from || String(r.fromDate).slice(0, 10) > to); });
  if (clash) return { error: 'overlaps' };
  var leaveRef = str_(p.leaveRef, 30).toUpperCase();
  if (leaveRef) {
    var lv = reqs.filter(function (r) { return r.type === 'leave' && String(r.ref).toUpperCase() === leaveRef && (r.status === 'pending' || r.status === 'approved'); })[0];
    if (!lv) return { error: 'leave_not_found' };
    if (String(lv.fromDate).slice(0, 10) < from || String(lv.toDate).slice(0, 10) > to) q.warnings.push('leave_outside_trip');
  }
  if (dur < trip) q.warnings.push('visa_shorter_than_trip');
  var iq = iqamaOf_(emp.id, readAll_(SHEETS.DOCS), privMap_());
  if (iq.expiry && iq.expiry < to) q.warnings.push('iqama_expires_before_return');
  q.fromDate = from; q.toDate = to; q.days = trip;
  q.payload = { visaType: vt, durationDays: dur, dependants: Math.max(0, Math.min(20, Math.round(Number(p.dependants) || 0))), leaveRef: leaveRef, purpose: str_(p.purpose, 200) };
  return q;
}
function govVisaOf_(requestId) { return readAll_(SHEETS.GOV_VISA).filter(function (v) { return v.requestId === requestId; })[0] || null; }
/** What publicReq_ shows of an exit/re-entry request (the visa once HR recorded it; never the fee). */
function govReqView_(r, p) {
  var v = r.status === 'approved' ? govVisaOf_(r.id) : null;
  return { visaType: p.visaType, durationDays: Number(p.durationDays) || 0, dependants: Number(p.dependants) || 0, leaveRef: p.leaveRef || '', purpose: p.purpose || '',
    visaStatus: v ? v.status : '', visaNo: v ? String(v.visaNo || '') : '', expiry: v ? String(v.expiry || '').slice(0, 10) : '' };
}
/** Final approval (applyEffect_): the visa waits for HR to record what Muqeem issued. */
function govVisaApproved_(r, emp, me, p) {
  if (govVisaOf_(r.id)) return;
  var now = new Date().toISOString();
  append_(SHEETS.GOV_VISA, { id: newId_('V'), ref: r.ref, kind: 'exit_reentry', empId: emp.id, requestId: r.id, visaType: p.visaType, durationDays: Number(p.durationDays) || 0,
    travelFrom: String(r.fromDate).slice(0, 10), travelTo: String(r.toDate).slice(0, 10), linkRef: p.leaveRef || '', dependants: Number(p.dependants) || 0, visaNo: '', issuedOn: '', expiry: '',
    fee: '', feeRef: '', paidBy: '', status: 'approved', issuedBy: '', issuedAt: '', returnedOn: '', returnBy: '', note: '', createdBy: me.id, createdAt: now, updatedAt: now });
}

// ---------------- visas: views and HR steps ----------------

function govVisaFlags_(v, t) {
  var exp = String(v.expiry || '').slice(0, 10), out = { away: false, overdue: false, expiringSoon: false };
  if (v.status !== 'issued') return out;
  if (v.kind === 'exit_reentry') {
    out.away = String(v.travelFrom).slice(0, 10) <= t;
    out.overdue = !!exp && t > addDays_(exp, GOV_RETURN_GRACE);
  }
  out.expiringSoon = !!exp && exp >= t && daysBetween_(t, exp) <= 14;
  return out;
}
function publicVisa_(v, ctx, me, t) {
  var money = govSeesMoney_(me) || v.empId === me.id, f = govVisaFlags_(v, t), e = ctx.emps[v.empId];
  return { id: v.id, ref: v.ref, kind: v.kind, emp: empCard_(e), visaType: v.visaType, durationDays: Number(v.durationDays) || 0, travelFrom: String(v.travelFrom || '').slice(0, 10),
    travelTo: String(v.travelTo || '').slice(0, 10), linkRef: v.linkRef, dependants: Number(v.dependants) || 0, visaNo: String(v.visaNo || ''), issuedOn: String(v.issuedOn || '').slice(0, 10),
    expiry: String(v.expiry || '').slice(0, 10), fee: money && v.fee !== '' ? Number(v.fee) : null, paidBy: v.paidBy, status: v.status, returnedOn: String(v.returnedOn || '').slice(0, 10),
    issuedBy: ctx.emps[v.issuedBy] ? ctx.emps[v.issuedBy].name : '', returnBy: ctx.emps[v.returnBy] ? ctx.emps[v.returnBy].name : '', note: v.note,
    away: f.away, overdue: f.overdue, expiringSoon: f.expiringSoon, art40: v.paidBy === 'employee' && !!GOV_EMPLOYER_FEES[v.kind],
    canIssue: isHr_(me) && v.empId !== me.id && (v.status === 'approved' || v.status === 'planned'),
    canReturn: v.status === 'issued' && v.empId !== me.id && (isHr_(me) || (v.kind === 'exit_reentry' && e && (manages_(me, e, ctx) || !!delegatedFor_(me, e, ctx)))) };
}
function govFeeRow_(o, me) {
  return { id: newId_('Y'), ref: '', empId: o.empId || '', type: o.type, amount: o.amount, date: o.date, reference: str_(o.reference, 60), paidBy: govPaidBy_(o.paidBy), sourceRef: o.sourceRef || '',
    note: str_(o.note, 300), status: 'recorded', enteredBy: me.id, enteredAt: new Date().toISOString(), verifiedBy: '', verifiedAt: '', voidNote: '' };
}
function appendFees_(rows) {
  if (!rows.length) return [];
  var refs = nextRefs_('gov_fee', rows.length, refsOf_(SHEETS.GOV_FEE));
  rows.forEach(function (r, i) { r.ref = refs[i]; });
  appendMany_(SHEETS.GOV_FEE, rows);
  return refs;
}

/** HR records the visa Muqeem issued: number, issue and expiry dates, the fee and who paid it. */
function api_govVisaIssue(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.visa || {};
  var visaNo = str_(x.visaNo, 30), issued = isoDate_(x.issuedOn) || today_(), exp = isoDate_(x.expiry), fee = govFeeAmount_(x.fee);
  if (!visaNo || !exp) fail_('missing_fields');
  if (issued > today_() || exp <= issued) fail_('bad_date');
  if (!(fee >= 0) || fee > 100000) fail_('bad_amount');
  if (fee > 0 && !govMoney_(me)) fail_('forbidden'); // an amount: the hr role or payroll, not an administrator alone
  return withLock_(function () {
    var v = findBy_(SHEETS.GOV_VISA, 'id', req.id), ctx = orgCtx_();
    if (!v || (v.status !== 'approved' && v.status !== 'planned')) fail_('not_found');
    if (v.empId === me.id) fail_('forbidden');
    var paid = govPaidBy_(x.paidBy);
    if (paid === 'employee' && GOV_EMPLOYER_FEES[v.kind] && !str_(x.note, 300)) fail_('note_required'); // Art. 40: say why the employee paid
    v.visaNo = visaNo; v.issuedOn = issued; v.expiry = exp; v.fee = fee; v.paidBy = paid; v.status = 'issued'; v.issuedBy = me.id; v.issuedAt = new Date().toISOString();
    v.note = str_(x.note, 300) || v.note; v.updatedAt = v.issuedAt;
    if (fee > 0) v.feeRef = appendFees_([govFeeRow_({ empId: v.empId, type: v.kind, amount: fee, date: issued, reference: x.feeReference || visaNo, paidBy: paid, sourceRef: v.ref, note: x.note }, me)])[0];
    update_(SHEETS.GOV_VISA, v);
    audit_(me.id, 'gov_visa_issue', v.empId, { ref: v.ref, kind: v.kind, expiry: exp, fee: fee > 0 });
    return { ok: true, visa: publicVisa_(v, ctx, me, today_()) };
  });
}
/** The return from an exit/re-entry trip (the manager or HR, never the traveller), or the departure on final exit (HR). */
function api_govVisaReturn(req, me) {
  return withLock_(function () {
    var v = findBy_(SHEETS.GOV_VISA, 'id', req.id), ctx = orgCtx_(), t = today_();
    if (!v || v.status !== 'issued') fail_('not_found');
    var e = ctx.emps[v.empId];
    if (v.empId === me.id) fail_('forbidden');
    var mgr = e && (manages_(me, e, ctx) || !!delegatedFor_(me, e, ctx));
    if (!isHr_(me) && !(v.kind === 'exit_reentry' && mgr)) fail_('forbidden');
    var d = isoDate_(req.date) || t;
    if (d > t || d < String(v.issuedOn).slice(0, 10)) fail_('bad_date');
    v.status = v.kind === 'final_exit' ? 'departed' : 'returned'; v.returnedOn = d; v.returnBy = me.id; v.updatedAt = new Date().toISOString();
    if (req.note) v.note = str_(req.note, 300);
    update_(SHEETS.GOV_VISA, v);
    audit_(me.id, 'gov_visa_' + v.status, v.empId, { ref: v.ref, date: d });
    return { ok: true, visa: publicVisa_(v, ctx, me, t) };
  });
}
function api_govVisaCancel(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var note = str_(req.note, 300); if (!note) fail_('note_required');
  return withLock_(function () {
    var v = findBy_(SHEETS.GOV_VISA, 'id', req.id), ctx = orgCtx_();
    if (!v || ['approved', 'planned', 'issued'].indexOf(v.status) < 0) fail_('not_found');
    if (v.empId === me.id) fail_('forbidden');
    v.status = 'cancelled'; v.note = note; v.updatedAt = new Date().toISOString();
    update_(SHEETS.GOV_VISA, v);
    audit_(me.id, 'gov_visa_cancel', v.empId, { ref: v.ref });
    return { ok: true, visa: publicVisa_(v, ctx, me, today_()) };
  });
}
/** Final exit for a leaving non-Saudi: planned now, issued with govVisaIssue, departure with govVisaReturn. */
function api_govFinalExit(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.exit || {};
  return withLock_(function () {
    var ctx = orgCtx_(), e = ctx.emps[x.empId];
    if (!e) fail_('not_found');
    if (e.id === me.id) fail_('forbidden');
    if (bool_(e.isSaudi)) fail_('saudi_not_applicable');
    if (readAll_(SHEETS.GOV_VISA).some(function (v) { return v.empId === e.id && v.kind === 'final_exit' && v.status !== 'cancelled'; })) fail_('already_exists');
    var last = isoDate_(x.lastDay) || String(e.lastWorkingDay || '').slice(0, 10), travel = isoDate_(x.travelDate) || last;
    if (!last) fail_('bad_date');
    var clr = readAll_(SHEETS.CLR).filter(function (c) { return c.empId === e.id && c.status !== 'cancelled'; })[0], now = new Date().toISOString();
    var v = { id: newId_('V'), ref: nextRef_('final_exit', refsOf_(SHEETS.GOV_VISA)), kind: 'final_exit', empId: e.id, requestId: '', visaType: '', durationDays: '', travelFrom: travel, travelTo: '',
      linkRef: clr ? clr.ref : '', dependants: Math.max(0, Math.min(20, Math.round(Number(x.dependants) || 0))), visaNo: '', issuedOn: '', expiry: '', fee: '', feeRef: '', paidBy: '',
      status: 'planned', issuedBy: '', issuedAt: '', returnedOn: '', returnBy: '', note: str_(x.note, 300), createdBy: me.id, createdAt: now, updatedAt: now };
    append_(SHEETS.GOV_VISA, v);
    audit_(me.id, 'gov_final_exit', e.id, { ref: v.ref, lastDay: last });
    return { ok: true, visa: publicVisa_(v, ctx, me, today_()) };
  });
}

// ---------------- iqama register ----------------

function iqamaRows_(ctx, me, t) {
  var docs = readAll_(SHEETS.DOCS), priv = privMap_(), last = {}, money = govSeesMoney_(me);
  readAll_(SHEETS.GOV_IQR).forEach(function (r) { if (!last[r.empId] || String(r.createdAt) > String(last[r.empId].createdAt)) last[r.empId] = r; });
  return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && !bool_(e.isSaudi) && !!String(e.nationality || '').trim(); }).map(function (e) { // nationality not recorded: not listed
    var iq = iqamaOf_(e.id, docs, priv), d = iq.expiry ? daysBetween_(t, iq.expiry) : null, r = last[e.id];
    return { emp: empCard_(e), number: iq.number, expiry: iq.expiry, daysLeft: d, level: d == null ? 'missing' : d < 0 ? 'expired' : d <= 30 ? 'due' : d <= GOV_IQAMA_WARN ? 'soon' : 'ok',
      last: r ? { ref: r.ref, renewedOn: String(r.renewedOn).slice(0, 10), newExpiry: String(r.newExpiry).slice(0, 10), muqeemRef: r.muqeemRef, total: money ? Number(r.total) || 0 : null } : null };
  }).sort(function (a, b) { return (a.daysLeft == null ? -1e9 : a.daysLeft) - (b.daysLeft == null ? -1e9 : b.daysLeft); });
}
/** A renewal done in Muqeem: the new expiry (private file and iqama document follow), the reference and each fee. */
function api_iqamaRenew(req, me) {
  if (!isHr_(me) && !govMoney_(me)) fail_('forbidden');
  var x = req.renewal || {}, t = today_(), fees = x.fees || {};
  var exp = isoDate_(x.newExpiry), on = isoDate_(x.renewedOn) || t, ref = str_(x.muqeemRef, 60);
  if (!exp || exp <= t || on > t) fail_('bad_date');
  var list = [], total = 0;
  ['iqama', 'work_permit', 'muqeem_print', 'other'].forEach(function (k) {
    var a = govFeeAmount_(fees[k]);
    if (!(a >= 0) || a > 100000) fail_('bad_amount');
    if (a > 0) { list.push({ type: k, amount: a }); total = r2_(total + a); }
  });
  if (total > 0 && !govMoney_(me)) fail_('forbidden');
  var paid = govPaidBy_(x.paidBy);
  if (paid === 'employee' && list.some(function (f) { return GOV_EMPLOYER_FEES[f.type]; }) && !str_(x.note, 300)) fail_('note_required');
  return withLock_(function () {
    var ctx = orgCtx_(), e = ctx.emps[x.empId];
    if (!e || e.status !== 'active') fail_('not_found');
    if (e.id === me.id) fail_('forbidden');
    if (bool_(e.isSaudi)) fail_('saudi_not_applicable');
    var docs = readAll_(SHEETS.DOCS), priv = privMap_(), iq = iqamaOf_(e.id, docs, priv);
    if (iq.expiry && exp <= iq.expiry) fail_('bad_date'); // a renewal moves the expiry forward
    var now = new Date().toISOString();
    var row = { id: newId_('Q'), ref: nextRef_('iqama_renewal', refsOf_(SHEETS.GOV_IQR)), empId: e.id, iqamaNo: iq.number, oldExpiry: iq.expiry, newExpiry: exp, renewedOn: on,
      years: Math.max(0, Math.min(5, Math.round(Number(x.years) || 0))) || '', muqeemRef: ref, paidBy: paid, feesJson: JSON.stringify(list), total: total, note: str_(x.note, 300), enteredBy: me.id, createdAt: now };
    append_(SHEETS.GOV_IQR, row);
    appendFees_(list.map(function (f) { return govFeeRow_({ empId: e.id, type: f.type, amount: f.amount, date: on, reference: ref, paidBy: paid, sourceRef: row.ref, note: x.note }, me); }));
    var p = priv[e.id];
    if (p) { p.idExpiry = exp; p.updatedAt = now; update_(SHEETS.PRIV, p); }
    else append_(SHEETS.PRIV, { empId: e.id, idExpiry: exp, updatedAt: now });
    if (iq.docId) { var doc = findBy_(SHEETS.DOCS, 'id', iq.docId); if (doc) { doc.expiryDate = exp; doc.updatedAt = now; update_(SHEETS.DOCS, doc); } }
    audit_(me.id, 'iqama_renew', e.id, { ref: row.ref, from: iq.expiry, to: exp, fees: list.length });
    return { ok: true, ref: row.ref };
  });
}

// ---------------- fee ledger ----------------

function publicFee_(f, ctx, me) {
  var money = govSeesMoney_(me);
  return { id: f.id, ref: f.ref, emp: empCard_(ctx.emps[f.empId]), type: f.type, amount: money ? Number(f.amount) : null, date: String(f.date).slice(0, 10), reference: String(f.reference || ''),
    paidBy: f.paidBy, sourceRef: f.sourceRef, note: f.note, status: f.status, art40: f.paidBy === 'employee' && !!GOV_EMPLOYER_FEES[f.type],
    enteredBy: ctx.emps[f.enteredBy] ? ctx.emps[f.enteredBy].name : '', verifiedBy: ctx.emps[f.verifiedBy] ? ctx.emps[f.verifiedBy].name : '', verifiedAt: f.verifiedAt,
    canVerify: govMoney_(me) && f.status === 'recorded' && f.enteredBy !== me.id && f.empId !== me.id,
    canVoid: govMoney_(me) && f.status === 'recorded' };
}
function api_govFeeSave(req, me) {
  if (!govMoney_(me)) fail_('forbidden');
  var x = req.fee || {}, amount = govFeeAmount_(x.amount), date = isoDate_(x.date) || today_();
  if (GOV_FEE_TYPES.indexOf(x.type) < 0) fail_('bad_value');
  if (!(amount > 0) || amount > 1000000) fail_('bad_amount');
  if (date > today_()) fail_('bad_date');
  if (!str_(x.reference, 60)) fail_('missing_fields');
  if (govPaidBy_(x.paidBy) === 'employee' && GOV_EMPLOYER_FEES[x.type] && !str_(x.note, 300)) fail_('note_required');
  return withLock_(function () {
    var ctx = orgCtx_();
    if (x.empId && !ctx.emps[x.empId]) fail_('not_found');
    var row = govFeeRow_({ empId: x.empId || '', type: x.type, amount: amount, date: date, reference: x.reference, paidBy: x.paidBy, sourceRef: str_(x.sourceRef, 30), note: x.note }, me);
    appendFees_([row]);
    audit_(me.id, 'gov_fee_save', row.empId, { ref: row.ref, type: row.type });
    return { ok: true, fee: publicFee_(row, ctx, me) };
  });
}
/** A second person checks each fee against the receipt: never the one who entered it, never on their own record. */
function api_govFeeVerify(req, me) {
  if (!govMoney_(me)) fail_('forbidden');
  var ids = (Array.isArray(req.ids) ? req.ids : [req.id]).map(String).filter(Boolean);
  if (!ids.length || ids.length > 500) fail_('bad_request');
  return withLock_(function () {
    var rows = readAll_(SHEETS.GOV_FEE).filter(function (f) { return ids.indexOf(f.id) >= 0; });
    if (rows.length !== ids.length || rows.some(function (f) { return f.status !== 'recorded'; })) fail_('not_found');
    if (rows.some(function (f) { return f.enteredBy === me.id; })) fail_('second_approver_required');
    if (rows.some(function (f) { return f.empId === me.id; })) fail_('cannot_decide_own');
    var now = new Date().toISOString();
    rows.forEach(function (f) { f.status = 'verified'; f.verifiedBy = me.id; f.verifiedAt = now; });
    updateMany_(SHEETS.GOV_FEE, rows);
    audit_(me.id, 'gov_fee_verify', '', { count: rows.length });
    return { ok: true, verified: rows.length };
  });
}
function api_govFeeVoid(req, me) {
  if (!govMoney_(me)) fail_('forbidden');
  var note = str_(req.note, 300); if (!note) fail_('note_required');
  return withLock_(function () {
    var f = findBy_(SHEETS.GOV_FEE, 'id', req.id);
    if (!f || f.status !== 'recorded') fail_('not_found');
    f.status = 'void'; f.voidNote = note;
    update_(SHEETS.GOV_FEE, f);
    audit_(me.id, 'gov_fee_void', f.empId, { ref: f.ref });
    return { ok: true };
  });
}
/** Dashboard money block: government fees by month (12 months) and by type this month. */
function dashGovFees_(t) {
  var months = {}, byType = {}, cur = t.slice(0, 7), since = govAddMonths_(cur + '-01', -11).slice(0, 7), toVerify = 0;
  readAll_(SHEETS.GOV_FEE).forEach(function (f) {
    if (f.status === 'void') return;
    if (f.status === 'recorded') toVerify++;
    var m = String(f.date).slice(0, 7); if (m < since || m > cur) return;
    months[m] = r2_((months[m] || 0) + Number(f.amount));
    if (m === cur) byType[f.type] = r2_((byType[f.type] || 0) + Number(f.amount));
  });
  return { trend: Object.keys(months).sort().map(function (m) { return { month: m, amount: months[m] }; }), thisMonth: months[cur] || 0, byType: byType, toVerify: toVerify };
}

// ---------------- annual tickets ----------------

function ticketCycle_(right, t) {
  var from = String(right.fromDate || '').slice(0, 10), every = Number(right.everyYears) === 2 ? 2 : 1;
  if (!from) return { current: null, next: '' };
  var k = 0, due = '';
  for (var i = 1; i < 60; i++) { var d = govAddMonths_(from, i * every * 12); if (d > t) break; k = i; due = d; }
  return { current: k ? { due: due, next: govAddMonths_(from, (k + 1) * every * 12) } : null, next: govAddMonths_(from, (k + 1) * every * 12) };
}
function ticketView_(right, uses, ctx, me, t) {
  var c = ticketCycle_(right, t), entitled = 1 + (Number(right.dependants) || 0), money = govSeesMoney_(me) || right.empId === me.id;
  var mine = uses.filter(function (u) { return u.rightId === right.id && u.status !== 'rejected'; });
  var used = c.current ? mine.filter(function (u) { return String(u.cycleDue).slice(0, 10) === c.current.due; }).reduce(function (s, u) { return s + (Number(u.persons) || 0); }, 0) : 0;
  return { id: right.id, emp: empCard_(ctx.emps[right.empId]), travelClass: right.travelClass, everyYears: Number(right.everyYears) || 1, dependants: Number(right.dependants) || 0,
    route: right.route, cashValue: money && right.cashValue !== '' ? Number(right.cashValue) : null, fromDate: String(right.fromDate).slice(0, 10), status: right.status, note: right.note,
    entitled: entitled, cycleDue: c.current ? c.current.due : '', nextDue: c.next, used: used, remaining: c.current ? Math.max(0, entitled - used) : 0,
    history: mine.sort(function (a, b) { return a.usedOn < b.usedOn ? 1 : -1; }).map(function (u) { return publicTicketUse_(u, ctx, me); }) };
}
function publicTicketUse_(u, ctx, me) {
  var money = govSeesMoney_(me) || u.empId === me.id;
  return { id: u.id, ref: u.ref, emp: empCard_(ctx.emps[u.empId]), usedOn: String(u.usedOn).slice(0, 10), cycleDue: String(u.cycleDue).slice(0, 10), persons: Number(u.persons) || 0, kind: u.kind,
    amount: money && u.amount !== '' ? Number(u.amount) : null, reference: u.reference, note: u.note, status: u.status, adjRef: u.adjRef,
    enteredBy: ctx.emps[u.enteredBy] ? ctx.emps[u.enteredBy].name : '', approvedBy: ctx.emps[u.approvedBy] ? ctx.emps[u.approvedBy].name : '',
    canApprove: canPayroll_(me) && u.status === 'pending' && u.enteredBy !== me.id && u.empId !== me.id };
}
/** The contract's ticket terms (one entitlement per employee; saving again updates it). */
function api_ticketSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.ticket || {};
  if (!TICKET_CLASSES[x.travelClass]) fail_('bad_value');
  var every = Number(x.everyYears), deps = Math.round(Number(x.dependants) || 0), cash = govFeeAmount_(x.cashValue);
  if (every !== 1 && every !== 2) fail_('bad_value');
  if (deps < 0 || deps > 10) fail_('bad_value');
  if (!(cash >= 0) || cash > 200000) fail_('bad_amount');
  return withLock_(function () {
    var ctx = orgCtx_(), e = ctx.emps[x.empId];
    if (!e || e.status !== 'active') fail_('not_found');
    if (e.id === me.id) fail_('forbidden');
    var from = isoDate_(x.fromDate) || String(e.hireDate || '').slice(0, 10);
    if (!from) fail_('bad_date');
    var row = readAll_(SHEETS.TICKET).filter(function (r) { return r.empId === e.id && r.status === 'active'; })[0], now = new Date().toISOString(), created = !row;
    if (cash > 0 && !govMoney_(me) && !(row && Number(row.cashValue) === cash)) fail_('forbidden');
    if (!row) row = { id: newId_('T'), empId: e.id, status: 'active', setBy: me.id, createdAt: now };
    row.travelClass = x.travelClass; row.everyYears = every; row.dependants = deps; row.route = str_(x.route, 120); row.cashValue = cash || ''; row.fromDate = from;
    row.note = str_(x.note, 300); row.setBy = me.id; row.updatedAt = now;
    if (created) append_(SHEETS.TICKET, row); else update_(SHEETS.TICKET, row);
    audit_(me.id, created ? 'ticket_right_create' : 'ticket_right_update', e.id, { travelClass: row.travelClass, everyYears: every, dependants: deps });
    return { ok: true, ticket: ticketView_(row, readAll_(SHEETS.TICKET_USE), ctx, me, today_()) };
  });
}
/** A ticket used in the current cycle (issued, or paid as cash). With an amount it waits for a payroll holder. */
function api_ticketUse(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.use || {}, kind = x.kind === 'cash' ? 'cash' : 'ticket', amount = govFeeAmount_(x.amount), persons = Math.round(Number(x.persons) || 0);
  if (!(amount >= 0) || amount > 200000 || (kind === 'cash' && !(amount > 0))) fail_('bad_amount');
  if (amount > 0 && !govMoney_(me)) fail_('forbidden');
  return withLock_(function () {
    var ctx = orgCtx_(), right = readAll_(SHEETS.TICKET).filter(function (r) { return r.empId === x.empId && r.status === 'active'; })[0], t = today_();
    if (!right) fail_('not_found');
    if (right.empId === me.id) fail_('forbidden');
    var uses = readAll_(SHEETS.TICKET_USE), v = ticketView_(right, uses, ctx, me, t);
    if (!v.cycleDue) fail_('ticket_not_due');
    if (persons < 1 || persons > v.remaining) fail_('ticket_exhausted');
    var on = isoDate_(x.usedOn) || t;
    if (on < v.cycleDue && on < addDays_(v.cycleDue, -60)) fail_('bad_date'); // booked up to 60 days before the entitlement starts
    var row = { id: newId_('U'), ref: nextRef_('ticket', refsOf_(SHEETS.TICKET_USE)), empId: right.empId, rightId: right.id, usedOn: on, cycleDue: v.cycleDue, persons: persons, kind: kind,
      amount: amount || '', reference: str_(x.reference, 60), note: str_(x.note, 300), status: amount > 0 ? 'pending' : 'approved', enteredBy: me.id, approvedBy: '', approvedAt: '', adjRef: '', createdAt: new Date().toISOString() };
    append_(SHEETS.TICKET_USE, row);
    audit_(me.id, 'ticket_use', right.empId, { ref: row.ref, kind: kind, persons: persons });
    return { ok: true, use: publicTicketUse_(row, ctx, me) };
  });
}
/** Payroll holder (not the one who recorded it, not the traveller): approve or reject; cash goes to the next open payroll. */
function api_ticketUseApprove(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var decision = req.decision === 'reject' ? 'reject' : 'approve', note = str_(req.note, 300);
  if (decision === 'reject' && !note) fail_('note_required');
  return withLock_(function () {
    var u = findBy_(SHEETS.TICKET_USE, 'id', req.id), ctx = orgCtx_();
    if (!u || u.status !== 'pending') fail_('not_found');
    if (u.enteredBy === me.id) fail_('second_approver_required');
    if (u.empId === me.id) fail_('cannot_decide_own');
    var now = new Date().toISOString();
    u.approvedBy = me.id; u.approvedAt = now;
    if (decision === 'reject') { u.status = 'rejected'; u.note = note; }
    else {
      u.status = 'approved';
      if (u.kind === 'cash') {
        var m = openPayMonth_(), ref = nextRef_('adjustment', refsOf_(SHEETS.ADJ));
        append_(SHEETS.ADJ, { id: newId_('A'), ref: ref, empId: u.empId, month: m, kind: 'earning', code: 'other_earning', amount: Number(u.amount),
          reason: u.ref + ' بدل تذكرة سفر', enteredBy: me.id, status: 'active', createdAt: now });
        u.adjRef = ref;
      }
    }
    update_(SHEETS.TICKET_USE, u);
    audit_(me.id, 'ticket_use_' + u.status, u.empId, { ref: u.ref, adj: u.adjRef || '' });
    return { ok: true, use: publicTicketUse_(u, ctx, me) };
  });
}

// ---------------- the screens' reads ----------------

/** HR / payroll: counts, visas, final exits, the iqama register, tickets and the fee ledger in one call. */
function api_govOverview(req, me) {
  if (!canGov_(me)) fail_('forbidden');
  var ctx = orgCtx_(), t = today_(), money = govSeesMoney_(me);
  var visas = readAll_(SHEETS.GOV_VISA).slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 400).map(function (v) { return publicVisa_(v, ctx, me, t); });
  var iqama = iqamaRows_(ctx, me, t), uses = readAll_(SHEETS.TICKET_USE);
  var tickets = readAll_(SHEETS.TICKET).filter(function (r) { return r.status === 'active'; }).map(function (r) { return ticketView_(r, uses, ctx, me, t); });
  var fees = readAll_(SHEETS.GOV_FEE).slice().sort(function (a, b) { return a.enteredAt < b.enteredAt ? 1 : -1; }).slice(0, 500).map(function (f) { return publicFee_(f, ctx, me); });
  var month = t.slice(0, 7), feeMonth = 0;
  readAll_(SHEETS.GOV_FEE).forEach(function (f) { if (f.status !== 'void' && String(f.date).slice(0, 7) === month) feeMonth = r2_(feeMonth + Number(f.amount)); });
  var counts = {
    away: visas.filter(function (v) { return v.away; }).length,
    toIssue: visas.filter(function (v) { return v.status === 'approved' || v.status === 'planned'; }).length,
    overdue: visas.filter(function (v) { return v.overdue; }).length,
    expiringSoon: visas.filter(function (v) { return v.expiringSoon; }).length,
    iqamaSoon: iqama.filter(function (x) { return x.level === 'soon' || x.level === 'due'; }).length,
    iqamaExpired: iqama.filter(function (x) { return x.level === 'expired'; }).length,
    iqamaMissing: iqama.filter(function (x) { return x.level === 'missing'; }).length,
    ticketsDue: tickets.filter(function (x) { return x.remaining > 0; }).length,
    feesToVerify: fees.filter(function (f) { return f.status === 'recorded'; }).length,
    feesMonth: money ? feeMonth : null
  };
  var people = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.id !== me.id; })
    .map(function (e) { return { id: e.id, name: e.name, nameEn: e.nameEn, empNo: String(e.empNo), saudi: bool_(e.isSaudi), hireDate: String(e.hireDate || '').slice(0, 10), lastWorkingDay: String(e.lastWorkingDay || '').slice(0, 10) }; })
    .sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ar'); });
  return { ok: true, today: t, money: money, canMoney: govMoney_(me), isHr: isHr_(me), counts: counts, visas: visas, iqama: iqama, tickets: tickets, fees: fees, people: people,
    feeTypes: GOV_FEE_TYPES, grace: GOV_RETURN_GRACE };
}
/** The employee: own visas, iqama expiry, ticket entitlement and what is left. */
function api_myGov(req, me) {
  var ctx = orgCtx_(), t = today_(), e = ctx.emps[me.id] || me, saudi = bool_(e.isSaudi);
  var visas = readAll_(SHEETS.GOV_VISA).filter(function (v) { return v.empId === me.id && v.status !== 'cancelled'; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (v) { return publicVisa_(v, ctx, me, t); });
  var right = readAll_(SHEETS.TICKET).filter(function (r) { return r.empId === me.id && r.status === 'active'; })[0];
  var iq = saudi ? null : iqamaOf_(me.id, readAll_(SHEETS.DOCS), privMap_());
  var leaves = readAll_(SHEETS.REQ).filter(function (r) { return r.empId === me.id && r.type === 'leave' && (r.status === 'pending' || r.status === 'approved') && String(r.toDate).slice(0, 10) >= t; })
    .map(function (r) { return { ref: r.ref, fromDate: String(r.fromDate).slice(0, 10), toDate: String(r.toDate).slice(0, 10), subtype: r.subtype, status: r.status }; });
  return { ok: true, saudi: saudi, visas: visas, iqama: iq ? { expiry: iq.expiry, daysLeft: iq.expiry ? daysBetween_(t, iq.expiry) : null } : null,
    ticket: right ? ticketView_(right, readAll_(SHEETS.TICKET_USE), ctx, me, t) : null, leaves: leaves };
}

// ---------------- calendar and bell (called from Compliance.gs) ----------------

function govCalendar_(items, add, ctx, t) {
  // The general expiry list already shows iqamas (90 days): inside the 60-day renewal window its item is marked
  // `renewal` (renew in Muqeem now); an iqama it missed gets its own 'iqama_renewal' item.
  var listed = {};
  items.forEach(function (x) { if (x.kind === 'iqama' && x.emp) { listed[x.emp.id] = 1; if (x.daysLeft != null && x.daysLeft <= GOV_IQAMA_WARN) x.renewal = true; } });
  iqamaRows_(ctx, { id: '' }, t).forEach(function (x) {
    if (x.daysLeft == null || x.daysLeft > GOV_IQAMA_WARN || listed[x.emp.id]) return;
    add('iqama_renewal', x.expiry, ctx.emps[x.emp.id], { number: x.number });
  });
  readAll_(SHEETS.GOV_VISA).forEach(function (v) {
    var e = ctx.emps[v.empId], exp = String(v.expiry || '').slice(0, 10);
    if (!e || v.status !== 'issued' || !exp) return;
    if (v.kind === 'exit_reentry') {
      if (t > addDays_(exp, GOV_RETURN_GRACE)) add('visa_not_returned', addDays_(exp, GOV_RETURN_GRACE), e, { ref: v.ref, expiry: exp });
      else if (daysBetween_(t, exp) <= 30) add('visa_expiring', exp, e, { ref: v.ref });
    } else if (daysBetween_(t, exp) <= 14) add('final_exit_expiring', exp, e, { ref: v.ref });
  });
  var hasFex = {};
  readAll_(SHEETS.GOV_VISA).forEach(function (v) { if (v.kind === 'final_exit' && v.status !== 'cancelled') hasFex[v.empId] = 1; });
  readAll_(SHEETS.CLR).forEach(function (c) {
    var e = ctx.emps[c.empId];
    if (c.status === 'open' && e && !bool_(e.isSaudi) && !hasFex[e.id]) add('final_exit_needed', String(c.lastDay).slice(0, 10), e, { ref: c.ref });
  });
  var uses = readAll_(SHEETS.TICKET_USE);
  readAll_(SHEETS.TICKET).forEach(function (r) {
    var e = ctx.emps[r.empId]; if (r.status !== 'active' || !e || e.status !== 'active') return;
    var v = ticketView_(r, uses, ctx, { id: '' }, t);
    if (v.remaining > 0) add('ticket_due', v.nextDue, e, { since: v.cycleDue, persons: v.remaining });
    else if (daysBetween_(t, v.nextDue) <= 30) add('ticket_upcoming', v.nextDue, e, { persons: v.entitled });
  });
}
function extraCalendar_(items, add, ctx, t, me) {
  [function () { discCalendar_(add, ctx); }, function () { govCalendar_(items, add, ctx, t); }, function () { journalCalendar_(add, t); }]
    .forEach(function (fn) { try { fn(); } catch (e) { console.error('calendar part: ' + (e && e.message)); } });
}
/** Bell items for these modules; add(kind, count, target) skips zero counts. */
function extraTasks_(me, ctx, out, add) {
  var t = today_(), hr = isHr_(me), money = govMoney_(me), pay = canPayroll_(me);
  var parts = [
    function () { if (hr) discTaskDue_(me, out); },
    function () {
      if (!hr) return;
      var vs = readAll_(SHEETS.GOV_VISA).filter(function (v) { return v.empId !== me.id; });
      add('gov_visa_issue', vs.filter(function (v) { return v.status === 'approved' || v.status === 'planned'; }).length, { tab: 'hr', sec: 'gov' });
      add('gov_visa_return', vs.filter(function (v) { return govVisaFlags_(v, t).overdue; }).length, { tab: 'hr', sec: 'gov' });
      add('iqama_renewal', iqamaRows_(ctx, me, t).filter(function (x) { return x.emp.id !== me.id && x.daysLeft != null && x.daysLeft <= 30; }).length, { tab: 'hr', sec: 'gov' });
      var uses = readAll_(SHEETS.TICKET_USE);
      add('ticket_due', readAll_(SHEETS.TICKET).filter(function (r) { return r.status === 'active' && r.empId !== me.id && ctx.emps[r.empId] && ctx.emps[r.empId].status === 'active'; })
        .filter(function (r) { return ticketView_(r, uses, ctx, me, t).remaining > 0; }).length, { tab: 'hr', sec: 'gov' });
    },
    function () {
      if (money) add('gov_fee_verify', readAll_(SHEETS.GOV_FEE).filter(function (f) { return f.status === 'recorded' && f.enteredBy !== me.id && f.empId !== me.id; }).length, { tab: 'hr', sec: 'gov' });
      if (pay) add('ticket_approve', readAll_(SHEETS.TICKET_USE).filter(function (u) { return u.status === 'pending' && u.enteredBy !== me.id && u.empId !== me.id; }).length, { tab: 'hr', sec: 'gov' });
    },
    function () { expenseTasks_(me, ctx, add); },
    function () { journalTasks_(me, add); }
  ];
  parts.forEach(function (fn) { try { fn(); } catch (e) { console.error('tasks part: ' + (e && e.message)); } });
}
