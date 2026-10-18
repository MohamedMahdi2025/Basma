/**
 * Employee loans (القروض), Wave 2, 2026-10-14. Apart from salary advances (Leave.gs 'advance': at most
 * maxAdvanceSalaries and 12 months, no schedule): a loan is larger and longer, has a schedule, early settlement
 * and an agreement number (LN-YYYY-00001).
 *  - Policy (setting loanPolicy, JSON): maxSalaries (3) monthly wages, maxMonths (24), minServiceMonths (6),
 *    oneActive (true: no second loan while one is pending, approved or being repaid).
 *  - Art. 92: an instalment over 10% of the wage needs the worker's written consent (consent: true at request).
 *  - Chain: hr then payroll. Nobody acts on their own loan, on a loan they requested for someone, or on two steps.
 *  - Money leaves only when a payroll holder records the disbursement (date and transfer reference); instalments run
 *    from startMonth as payslip lines code 'loan' (Payroll.gs calcSlip_ -> loanSlipLines_), capped and deferred with
 *    advances (Art. 93). Repaid = locked payslip lines + early settlements verified by a second payroll holder.
 *  - The final settlement (api_eosQuote) deducts what is still owed (loansOwed_); the Odoo journal credits the same
 *    employee receivable as advances.
 */

var LOAN_KINDS = ['personal', 'housing', 'car', 'education', 'medical', 'emergency', 'other'];
var LOAN_DEFAULTS = { maxSalaries: 3, maxMonths: 24, minServiceMonths: 6, oneActive: true };

function loanPolicy_() {
  var p = parseJson_(settings_().loanPolicy, {}), out = {};
  Object.keys(LOAN_DEFAULTS).forEach(function (k) { out[k] = p && p[k] !== undefined && p[k] !== '' ? p[k] : LOAN_DEFAULTS[k]; });
  out.maxSalaries = Number(out.maxSalaries); out.maxMonths = Number(out.maxMonths); out.minServiceMonths = Number(out.minServiceMonths);
  out.oneActive = out.oneActive === true || out.oneActive === 'true';
  return out;
}
function loanLive_(l) { return l.status === 'pending' || l.status === 'approved' || l.status === 'active'; }
function loanSeesMoney_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }

/** Repaid per loan ref: locked payslip lines plus verified early settlements. */
function loanRepaidMap_() {
  var done = {};
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (sl.status !== 'locked') return;
    lines_(sl).forEach(function (l) { if (l.code === 'loan' && l.ref) done[l.ref] = r2_((done[l.ref] || 0) + Number(l.amount)); });
  });
  readAll_(SHEETS.LOAN).forEach(function (l) {
    parseJson_(l.settlementsJson, []).forEach(function (s) { if (s.status === 'verified') done[l.ref] = r2_((done[l.ref] || 0) + Number(s.amount)); });
  });
  return done;
}
function loanOutstanding_(l, done) { return l.status === 'active' ? Math.max(0, r2_(Number(l.principal) - (done[l.ref] || 0))) : 0; }

/** Payroll.gs calcSlip_ hook: the month's instalment of each disbursed loan, until repaid. */
function loanSlipLines_(emp, x, add) {
  if (!x._loans) { x._loans = readAll_(SHEETS.LOAN).filter(function (l) { return l.status === 'active' && l.disbursedOn; }); x._loanDone = loanRepaidMap_(); }
  x._loans.forEach(function (l) {
    if (l.empId !== emp.id || x.month < String(l.startMonth)) return;
    var left = loanOutstanding_(l, x._loanDone);
    if (left > 0) add({ kind: 'deduction', code: 'loan', ref: l.ref, amount: Math.min(Number(l.installment) || left, left), cap: true, deferrable: true });
  });
}
/** Payroll.gs api_eosQuote hook: loans still owed by the person. */
function loansOwed_(empId) {
  var done = loanRepaidMap_();
  return r2_(readAll_(SHEETS.LOAN).filter(function (l) { return l.empId === empId; }).reduce(function (t, l) { return t + loanOutstanding_(l, done); }, 0));
}

function loanSchedule_(principal, installment, startMonth) {
  var out = [], left = r2_(principal), m = startMonth;
  for (var i = 0; left > 0.004 && i < 240; i++) {
    var a = r2_(Math.min(installment, left));
    out.push({ month: m, amount: a }); left = r2_(left - a);
    m = govAddMonths_(m + '-01', 1).slice(0, 7);
  }
  return out;
}

/** Checks a loan for a person: { errors: [], warnings: [], installment, schedule, wage }. */
function loanCheck_(emp, d, excludeId) {
  var pol = loanPolicy_(), errors = [], warnings = [], t = today_();
  var principal = num_(d.principal), months = Math.floor(Number(d.months));
  var startMonth = /^\d{4}-\d{2}$/.test(String(d.startMonth || '')) ? String(d.startMonth) : openPayMonth_();
  if (!(principal > 0) || principal > 1000000) errors.push('bad_amount');
  if (!(months >= 1)) errors.push('bad_value');
  else if (months > pol.maxMonths) errors.push('months_over_limit');
  if (startMonth < t.slice(0, 7)) errors.push('bad_date');
  else if (monthLocked_(emp.id, startMonth)) errors.push('month_locked');
  var comp = currentComp_(emp.id, t), wage = comp ? comp.total : 0;
  if (!comp) errors.push('no_package');
  var hire = String(emp.hireDate || '').slice(0, 10) || String(emp.createdAt || '').slice(0, 10);
  if (pol.minServiceMonths > 0 && (!hire || govAddMonths_(hire, pol.minServiceMonths) > t)) errors.push('service_too_short');
  if (comp && principal > wage * pol.maxSalaries + 0.004) errors.push('loan_over_limit');
  if (pol.oneActive && readAll_(SHEETS.LOAN).some(function (l) { return l.empId === emp.id && l.id !== excludeId && loanLive_(l) && !(l.status === 'active' && loansOwedOne_(l) <= 0); })) errors.push('loan_active_exists');
  var installment = months >= 1 && principal > 0 ? Math.ceil(principal / months * 100) / 100 : 0;
  if (wage && installment > wage * 0.1) warnings.push('deduction_over_10');
  if (wage && installment > wage * 0.5) warnings.push('over_half_wage');
  if (readAll_(SHEETS.REQ).some(function (r) { return r.empId === emp.id && r.type === 'advance' && r.status === 'approved'; })) warnings.push('advance_open');
  return { errors: errors, warnings: warnings, principal: principal, months: months, installment: installment, startMonth: startMonth,
    schedule: installment ? loanSchedule_(principal, installment, startMonth) : [], wage: wage, policy: pol };
}
function loansOwedOne_(l) { return loanOutstanding_(l, loanRepaidMap_()); }

function loanApprovedBy_(l) { var h = parseJson_(l.stepsJson, []).filter(function (x) { return x.step === 'payroll' && x.decision === 'approve'; }); return h.length ? h[h.length - 1].by : ''; }
function canActLoan_(me, l) {
  if (!me || l.status !== 'pending' || l.empId === me.id || l.requestedBy === me.id) return false;
  if (parseJson_(l.stepsJson, []).some(function (h) { return h.by === me.id; })) return false;
  if (l.step === 'hr') return isHr_(me);
  if (l.step === 'payroll') return hasRole_(me, 'payroll');
  return false;
}

function loanPublic_(l, ctx, me, done) {
  var emp = ctx.emps[l.empId], own = l.empId === me.id, money = own || loanSeesMoney_(me);
  var repaid = done[l.ref] || 0, out = loanOutstanding_(l, done);
  var paidByMonth = {};
  readAll_(SHEETS.SLIP).forEach(function (sl) { if (sl.status === 'locked' && sl.empId === l.empId) lines_(sl).forEach(function (x) { if (x.code === 'loan' && x.ref === l.ref) paidByMonth[sl.month] = r2_((paidByMonth[sl.month] || 0) + Number(x.amount)); }); });
  var v = { id: l.id, ref: l.ref, emp: empCard_(emp), kind: l.kind, purpose: l.purpose, months: Number(l.months), startMonth: String(l.startMonth),
    status: l.status === 'active' && out <= 0 ? 'settled' : l.status, step: l.step, consent: !!l.consentAt, consentAt: l.consentAt,
    disbursedOn: String(l.disbursedOn || '').slice(0, 10), disbursedRef: l.disbursedRef, createdAt: l.createdAt, decidedAt: l.decidedAt, closedOn: String(l.closedOn || '').slice(0, 10),
    history: parseJson_(l.stepsJson, []).map(function (h) { var b = ctx.emps[h.by]; return { step: h.step, decision: h.decision, note: h.note, at: h.at, by: b ? b.name : '' }; }),
    mine: own, canAct: canActLoan_(me, l),
    canCancel: (own && l.status === 'pending') || (hasRole_(me, 'payroll') && !own && l.status === 'approved'),
    canDisburse: hasRole_(me, 'payroll') && !own && l.status === 'approved' && loanApprovedBy_(l) !== me.id,
    canSettle: hasRole_(me, 'payroll') && !own && l.status === 'active' && out > 0 };
  if (money) {
    v.principal = Number(l.principal); v.installment = Number(l.installment); v.repaid = r2_(repaid); v.outstanding = out;
    v.settlements = parseJson_(l.settlementsJson, []).map(function (s) { var b = ctx.emps[s.by], vb = ctx.emps[s.verifiedBy];
      return { id: s.id, amount: s.amount, on: s.on, reference: s.reference, status: s.status, by: b ? b.name : '', verifiedBy: vb ? vb.name : '',
        canVerify: s.status === 'pending' && hasRole_(me, 'payroll') && s.by !== me.id && !own }; });
    v.schedule = loanSchedule_(Number(l.principal), Number(l.installment), String(l.startMonth)).map(function (s) {
      return { month: s.month, amount: s.amount, paid: paidByMonth[s.month] || 0 }; });
  }
  return v;
}

function api_loanQuote(req, me) {
  var emp = me;
  if (req.empId && req.empId !== me.id) { if (!loanSeesMoney_(me)) fail_('forbidden'); emp = findBy_(SHEETS.EMP, 'id', req.empId); if (!emp) fail_('not_found'); }
  var c = loanCheck_(emp, req.loan || req, null);
  return { ok: true, quote: c };
}

/** The employee asks for a loan; HR (or payroll) may enter one for an employee who signed on paper. */
function api_loanCreate(req, me) {
  var d = req.loan || {};
  return withLock_(function () {
    var ctx = orgCtx_(), forOther = d.empId && d.empId !== me.id;
    if (forOther && !isHr_(me) && !loanSeesMoney_(me)) fail_('forbidden');
    var emp = ctx.emps[forOther ? d.empId : me.id];
    if (!emp || emp.status !== 'active') fail_('not_found');
    var c = loanCheck_(emp, d, null);
    if (c.errors.length) fail_(c.errors[0]);
    if (LOAN_KINDS.indexOf(d.kind) < 0) fail_('bad_value');
    var purpose = str_(d.purpose, 300);
    if (!purpose) fail_('missing_fields');
    if (c.warnings.indexOf('deduction_over_10') >= 0 && d.consent !== true) fail_('consent_required');
    var now = new Date().toISOString();
    var row = { id: newId_('L'), ref: nextRef_('loan', refsOf_(SHEETS.LOAN)), empId: emp.id, kind: d.kind, principal: c.principal, months: c.months,
      installment: c.installment, startMonth: c.startMonth, purpose: purpose, consentAt: d.consent === true ? now : '', status: 'pending', step: 'hr', stepsJson: '[]',
      requestedBy: me.id, disbursedOn: '', disbursedRef: '', disbursedBy: '', settlementsJson: '[]', closedOn: '', createdAt: now, updatedAt: now, decidedAt: '' };
    append_(SHEETS.LOAN, row);
    audit_(me.id, 'loan_create', emp.id, { ref: row.ref, principal: row.principal, months: row.months });
    return { ok: true, loan: loanPublic_(row, ctx, me, loanRepaidMap_()), warnings: c.warnings };
  });
}

function api_loanCancel(req, me) {
  return withLock_(function () {
    var l = findBy_(SHEETS.LOAN, 'id', req.id), ctx = orgCtx_();
    if (!l) fail_('not_found');
    var note = str_(req.note, 300), own = l.empId === me.id;
    if (own && l.status === 'pending') { /* withdrawn */ }
    else if (!own && hasRole_(me, 'payroll') && l.status === 'approved') { if (!note) fail_('note_required'); }
    else fail_('forbidden');
    var h = parseJson_(l.stepsJson, []);
    h.push({ step: l.step || 'done', by: me.id, decision: 'cancelled', note: note, at: new Date().toISOString() });
    l.stepsJson = JSON.stringify(h); l.status = 'cancelled'; l.updatedAt = new Date().toISOString();
    update_(SHEETS.LOAN, l);
    audit_(me.id, 'loan_cancel', l.empId, { ref: l.ref });
    return { ok: true, loan: loanPublic_(l, ctx, me, loanRepaidMap_()) };
  });
}

/** hr step then payroll step; the final step re-checks the policy against today's data. */
function api_loanDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approve' : req.decision === 'reject' ? 'reject' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), l = findBy_(SHEETS.LOAN, 'id', req.id);
    if (!l) fail_('not_found');
    if (l.empId === me.id) fail_('cannot_decide_own');
    if (l.status === 'pending' && l.requestedBy === me.id) fail_('second_approver_required');
    if (!canActLoan_(me, l)) fail_(l.status !== 'pending' ? 'not_found' : 'forbidden');
    var note = str_(req.note, 300), now = new Date().toISOString();
    if (decision === 'reject' && !note) fail_('note_required');
    if (decision === 'approve' && l.step === 'payroll') {
      var c = loanCheck_(ctx.emps[l.empId], { principal: l.principal, months: l.months, startMonth: l.startMonth }, l.id);
      var hard = c.errors.filter(function (e) { return e !== 'bad_date' && e !== 'month_locked'; });
      if (hard.length) fail_(hard[0]);
    }
    var h = parseJson_(l.stepsJson, []);
    h.push({ step: l.step, by: me.id, decision: decision, note: note, at: now });
    l.stepsJson = JSON.stringify(h); l.updatedAt = now;
    if (decision === 'reject') { l.status = 'rejected'; l.decidedAt = now; }
    else if (l.step === 'hr') l.step = 'payroll';
    else { l.status = 'approved'; l.step = 'done'; l.decidedAt = now; }
    update_(SHEETS.LOAN, l);
    audit_(me.id, 'loan_' + (l.status === 'approved' ? 'approved' : decision === 'reject' ? 'rejected' : 'step'), l.empId, { ref: l.ref });
    return { ok: true, loan: loanPublic_(l, ctx, me, loanRepaidMap_()) };
  });
}

/** A payroll holder records the money paid out; instalments start at startMonth (moved forward if that month is closed). */
function api_loanDisburse(req, me) {
  if (!hasRole_(me, 'payroll')) fail_('forbidden');
  var ref = str_(req.disbursedRef, 60), on = isoDate_(req.disbursedOn) || today_();
  if (!ref) fail_('missing_fields');
  if (on > today_()) fail_('bad_date');
  return withLock_(function () {
    var l = findBy_(SHEETS.LOAN, 'id', req.id), ctx = orgCtx_();
    if (!l || l.status !== 'approved') fail_('not_found');
    if (l.empId === me.id) fail_('cannot_decide_own');
    if (loanApprovedBy_(l) === me.id) fail_('second_approver_required'); // who approved it does not also pay it out
    var start = String(l.startMonth);
    if (start < on.slice(0, 7)) start = on.slice(0, 7);
    for (var i = 0; i < 24 && monthLocked_(l.empId, start); i++) start = govAddMonths_(start + '-01', 1).slice(0, 7);
    l.startMonth = start; l.status = 'active'; l.disbursedOn = on; l.disbursedRef = ref; l.disbursedBy = me.id; l.updatedAt = new Date().toISOString();
    update_(SHEETS.LOAN, l);
    audit_(me.id, 'loan_disburse', l.empId, { ref: l.ref, disbursedRef: ref, startMonth: start });
    return { ok: true, loan: loanPublic_(l, ctx, me, loanRepaidMap_()) };
  });
}

/** Early (part or full) settlement paid by the employee: recorded by one payroll holder, counted once another verifies. */
function api_loanSettle(req, me) {
  if (!hasRole_(me, 'payroll')) fail_('forbidden');
  var amount = num_(req.amount), on = isoDate_(req.on) || today_(), reference = str_(req.reference, 60);
  if (!(amount > 0)) fail_('bad_amount');
  if (!reference) fail_('missing_fields');
  if (on > today_()) fail_('bad_date');
  return withLock_(function () {
    var l = findBy_(SHEETS.LOAN, 'id', req.id), ctx = orgCtx_();
    if (!l || l.status !== 'active') fail_('not_found');
    if (l.empId === me.id) fail_('cannot_decide_own');
    var done = loanRepaidMap_(), s = parseJson_(l.settlementsJson, []);
    var pending = s.filter(function (x) { return x.status === 'pending'; }).reduce(function (t, x) { return t + Number(x.amount); }, 0);
    if (amount > loanOutstanding_(l, done) - pending + 0.004) fail_('bad_amount');
    s.push({ id: newId_('S'), amount: r2_(amount), on: on, reference: reference, status: 'pending', by: me.id, at: new Date().toISOString(), verifiedBy: '', verifiedAt: '' });
    l.settlementsJson = JSON.stringify(s); l.updatedAt = new Date().toISOString();
    update_(SHEETS.LOAN, l);
    audit_(me.id, 'loan_settle', l.empId, { ref: l.ref, amount: amount, reference: reference });
    return { ok: true, loan: loanPublic_(l, ctx, me, done) };
  });
}

function api_loanSettleVerify(req, me) {
  if (!hasRole_(me, 'payroll')) fail_('forbidden');
  var decision = req.decision === 'reject' ? 'rejected' : 'verified';
  return withLock_(function () {
    var l = findBy_(SHEETS.LOAN, 'id', req.id), ctx = orgCtx_();
    if (!l) fail_('not_found');
    if (l.empId === me.id) fail_('cannot_decide_own');
    var s = parseJson_(l.settlementsJson, []), x = s.filter(function (v) { return v.id === req.settlementId && v.status === 'pending'; })[0];
    if (!x) fail_('not_found');
    if (x.by === me.id) fail_('second_approver_required');
    if (decision === 'rejected' && !str_(req.note, 300)) fail_('note_required');
    x.status = decision; x.verifiedBy = me.id; x.verifiedAt = new Date().toISOString(); x.note = str_(req.note, 300);
    l.settlementsJson = JSON.stringify(s); l.updatedAt = x.verifiedAt;
    update_(SHEETS.LOAN, l);
    forget_(SHEETS.LOAN);
    var done = loanRepaidMap_(), row = findBy_(SHEETS.LOAN, 'id', l.id);
    if (loanOutstanding_(row, done) <= 0 && !row.closedOn) { row.closedOn = today_(); update_(SHEETS.LOAN, row); }
    audit_(me.id, 'loan_settle_' + decision, l.empId, { ref: l.ref, amount: x.amount });
    return { ok: true, loan: loanPublic_(row, ctx, me, done) };
  });
}

function api_myLoans(req, me) {
  var ctx = orgCtx_(), done = loanRepaidMap_(), all = readAll_(SHEETS.LOAN);
  var rows = all.filter(function (l) { return l.empId === me.id; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (l) { return loanPublic_(l, ctx, me, done); });
  return { ok: true, rows: rows, policy: loanPolicy_(), kinds: LOAN_KINDS, inbox: all.filter(function (l) { return canActLoan_(me, l); }).length,
    canAll: loanSeesMoney_(me) || isHr_(me) };
}

/** scope 'inbox' (default): waiting for my step; 'all': every loan (hr role, admin, payroll). Amounts only for hr role/payroll. */
function api_loanList(req, me) {
  var ctx = orgCtx_(), done = loanRepaidMap_(), all = readAll_(SHEETS.LOAN), rows;
  if (req.scope === 'all') {
    if (!isHr_(me) && !loanSeesMoney_(me)) fail_('forbidden');
    rows = all.filter(function (l) { return l.empId !== me.id && (!req.status || l.status === req.status); });
  } else rows = all.filter(function (l) { return canActLoan_(me, l); });
  rows = rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 500).map(function (l) { return loanPublic_(l, ctx, me, done); });
  var totals = null;
  if (loanSeesMoney_(me)) {
    totals = { active: 0, outstanding: 0, pending: 0 };
    all.forEach(function (l) { if (l.status === 'active' && loanOutstanding_(l, done) > 0) { totals.active++; totals.outstanding = r2_(totals.outstanding + loanOutstanding_(l, done)); } if (l.status === 'pending') totals.pending++; });
    audit_(me.id, 'salary_view', '', { loans: rows.length });
  }
  return { ok: true, rows: rows, totals: totals };
}

function api_loanPolicySave(req, me) {
  if (me.role !== 'admin' && !loanSeesMoney_(me)) fail_('forbidden');
  var p = req.policy || {}, cur = loanPolicy_(), next = {};
  var rng = { maxSalaries: [0.5, 24], maxMonths: [1, 120], minServiceMonths: [0, 60] };
  Object.keys(rng).forEach(function (k) {
    var v = p[k] === undefined || p[k] === '' ? cur[k] : Number(p[k]);
    if (!isFinite(v) || v < rng[k][0] || v > rng[k][1]) fail_('bad_value');
    next[k] = v;
  });
  next.oneActive = p.oneActive === undefined ? cur.oneActive : bool_(p.oneActive);
  return withLock_(function () {
    saveSettingKey_('loanPolicy', JSON.stringify(next));
    audit_(me.id, 'loan_policy_save', '', next);
    return { ok: true, policy: next };
  });
}

hrisHook_('tasks', function (me, ctx, add) {
  var all = readAll_(SHEETS.LOAN);
  add('loan_approve', all.filter(function (l) { return canActLoan_(me, l); }).length, { tab: 'hr', sec: 'loans' });
  if (hasRole_(me, 'payroll')) {
    add('loan_disburse', all.filter(function (l) { return l.status === 'approved' && l.empId !== me.id && loanApprovedBy_(l) !== me.id; }).length, { tab: 'hr', sec: 'loans' });
    add('loan_settle_verify', all.filter(function (l) { return l.empId !== me.id && parseJson_(l.settlementsJson, []).some(function (s) { return s.status === 'pending' && s.by !== me.id; }); }).length, { tab: 'hr', sec: 'loans' });
  }
});
