/**
 * Expense claims (المصروفات), gap matrix P0-8, 2026-10-05.
 *  - The employee claims lines (category, date, amount incl. VAT, VAT, merchant, description, receipt reference).
 *    Files are not attached yet: P0-7 needs a Drive scope; attachmentsJson is kept empty for it.
 *  - Checks on the server: dates within EXP_MAX_AGE_DAYS and not in the future, VAT at most 15% of the amount, a receipt
 *    reference above the setting expenseReceiptOver, and a duplicate check (same category, date and amount in another
 *    live claim of the same person, or twice in one claim) that refuses the claim.
 *  - Limits per category per calendar month (setting expenseLimits, JSON): going over is flagged, and the payroll
 *    approver must write the reason to approve.
 *  - Chain: the line manager (or a delegate, or HR on their behalf), then a payroll holder. Nobody acts on their own
 *    claim or on two steps of one claim; rejecting needs a note.
 *  - Payout: through the next open payroll as the earning 'reimbursement' (not wage: no GOSI, outside the Art. 93 base,
 *    Payroll.gs ADJ_NON_WAGE), or "paid outside payroll" with a reference recorded by a payroll holder.
 */

var EXP_CATS = ['fuel', 'tolls', 'parking', 'meals', 'per_diem', 'phone', 'vehicle', 'travel', 'other'];
var EXP_MAX_LINES = 40, EXP_MAX_AGE_DAYS = 90, EXP_VAT_RATE = 0.15;

function expLimits_() {
  var o = parseJson_(settings_().expenseLimits, {});
  return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
}
function expSteps_(emp, ctx) {
  var m = ctx.emps[emp.managerId];
  return m && m.status === 'active' && m.id !== emp.id ? ['manager', 'payroll'] : ['payroll'];
}
function expLive_(x) { return x.status === 'pending' || x.status === 'approved' || x.status === 'paid'; }
function canActExpense_(me, x, emp, ctx) {
  if (!me || !emp || x.status !== 'pending' || x.empId === me.id) return false;
  if (parseJson_(x.stepsJson, []).some(function (h) { return h.by === me.id; })) return false;
  if (x.step === 'manager') return manages_(me, emp, ctx) || isHr_(me) || !!delegatedFor_(me, emp, ctx);
  if (x.step === 'payroll') return hasRole_(me, 'payroll');
  return false;
}
function h_(n) { return Math.round((Number(n) || 0) * 100); } // halalas

/**
 * Validates the lines of a claim against the person's other live claims. Returns { error, line } or
 * { lines, total, vat, flags } where flags lists every category-month over its limit.
 */
function expCheck_(emp, raw, excludeId) {
  var t = today_(), s = settings_(), receiptOver = Number(s.expenseReceiptOver) || 0, out = [];
  if (!Array.isArray(raw) || !raw.length) return { error: 'missing_fields' };
  if (raw.length > EXP_MAX_LINES) return { error: 'too_many_lines' };
  for (var i = 0; i < raw.length; i++) {
    var l = raw[i] || {}, cat = String(l.category || ''), date = isoDate_(l.date), amount = num_(l.amount), vat = l.vat === '' || l.vat == null ? 0 : num_(l.vat);
    if (EXP_CATS.indexOf(cat) < 0) return { error: 'bad_value', line: i };
    if (!date || date > t || date < addDays_(t, -EXP_MAX_AGE_DAYS)) return { error: 'bad_date', line: i };
    if (!(amount > 0) || amount > 100000) return { error: 'bad_amount', line: i };
    if (!(vat >= 0) || h_(vat) > Math.ceil(h_(amount) * EXP_VAT_RATE / (1 + EXP_VAT_RATE)) + 1) return { error: 'bad_vat', line: i };
    var desc = str_(l.description, 300), receipt = str_(l.receiptRef, 60);
    if (!desc) return { error: 'missing_fields', line: i };
    if (receiptOver && amount > receiptOver && !receipt) return { error: 'receipt_required', line: i };
    out.push({ category: cat, date: date, amount: amount, vat: vat, merchant: str_(l.merchant, 120), description: desc, receiptRef: receipt });
  }
  var key = function (l) { return l.category + '|' + l.date + '|' + h_(l.amount); }, seen = {};
  for (var j = 0; j < out.length; j++) { if (seen[key(out[j])]) return { error: 'duplicate_expense', line: j }; seen[key(out[j])] = 1; }
  var others = readAll_(SHEETS.EXPENSE).filter(function (x) { return x.empId === emp.id && x.id !== excludeId && expLive_(x); });
  var used = {};
  for (var k = 0; k < others.length; k++) {
    var ls = parseJson_(others[k].linesJson, []);
    for (var m = 0; m < ls.length; m++) {
      if (seen[key(ls[m])]) return { error: 'duplicate_expense', line: out.map(key).indexOf(key(ls[m])), ref: others[k].ref };
      var um = ls[m].category + '|' + String(ls[m].date).slice(0, 7); used[um] = (used[um] || 0) + h_(ls[m].amount);
    }
  }
  var lim = expLimits_(), mine = {}, flags = [];
  out.forEach(function (l) { var um = l.category + '|' + l.date.slice(0, 7); mine[um] = (mine[um] || 0) + h_(l.amount); });
  Object.keys(mine).forEach(function (um) {
    var cat = um.split('|')[0], cap = Number(lim[cat]);
    if (!(cap > 0)) return;
    var all = (used[um] || 0) + mine[um];
    if (all > h_(cap)) flags.push({ code: 'over_limit', category: cat, month: um.split('|')[1], limit: cap, total: all / 100 });
  });
  return { lines: out, total: out.reduce(function (a, l) { return a + h_(l.amount); }, 0) / 100, vat: out.reduce(function (a, l) { return a + h_(l.vat); }, 0) / 100, flags: flags };
}

function publicExpense_(x, ctx, me) {
  var emp = ctx.emps[x.empId], steps = emp ? expSteps_(emp, ctx) : ['payroll'];
  var paid = x.status === 'paid' || (x.status === 'approved' && x.payout === 'payroll' && !!x.payMonth && monthLocked_(x.empId, x.payMonth));
  return { id: x.id, ref: x.ref, emp: empCard_(emp), title: x.title, lines: parseJson_(x.linesJson, []), total: Number(x.total) || 0, vat: Number(x.vat) || 0,
    flags: parseJson_(x.flagsJson, []), attachments: parseJson_(x.attachmentsJson, []), status: paid ? 'paid' : x.status, step: x.step, steps: steps,
    payout: x.payout, payMonth: x.payMonth, adjRef: x.adjRef, paidRef: x.paidRef, paidOn: String(x.paidOn || '').slice(0, 10), costCenter: x.costCenter,
    department: emp ? emp.department : '', departmentId: x.departmentId, createdAt: x.createdAt, decidedAt: x.decidedAt,
    history: parseJson_(x.stepsJson, []).map(function (h) { var b = ctx.emps[h.by]; return { step: h.step, role: h.role, decision: h.decision, note: h.note, at: h.at, by: b ? b.name : '' }; }),
    canAct: canActExpense_(me, x, emp, ctx), mine: x.empId === me.id,
    canCancel: (x.empId === me.id && x.status === 'pending') || (canPayroll_(me) && x.empId !== me.id && x.status === 'approved' && !paid),
    canPay: canPayroll_(me) && x.empId !== me.id && x.status === 'approved' && x.payout === 'outside' };
}

function api_expenseCheck(req, me) {
  var emp = findBy_(SHEETS.EMP, 'id', me.id) || me, c = expCheck_(emp, (req.claim || {}).lines, req.excludeId);
  return { ok: true, check: c };
}
function api_expenseCreate(req, me) {
  var d = req.claim || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[me.id];
    if (!emp || emp.status !== 'active') fail_('forbidden');
    var c = expCheck_(emp, d.lines, null);
    if (c.error) fail_(c.error);
    var steps = expSteps_(emp, ctx), now = new Date().toISOString(), dept = ctx.depts[emp.departmentId];
    var row = { id: newId_('X'), ref: nextRef_('expense', refsOf_(SHEETS.EXPENSE)), empId: emp.id, title: str_(d.title, 120), linesJson: JSON.stringify(c.lines), total: c.total, vat: c.vat,
      flagsJson: JSON.stringify(c.flags), attachmentsJson: '[]', status: 'pending', step: steps[0], stepsJson: '[]', payout: '', payMonth: '', adjRef: '', paidRef: '', paidOn: '', paidBy: '',
      costCenter: dept ? String(dept.costCenter || '') : '', departmentId: emp.departmentId || '', createdAt: now, updatedAt: now, decidedAt: '' };
    append_(SHEETS.EXPENSE, row);
    audit_(me.id, 'expense_create', emp.id, { ref: row.ref, lines: c.lines.length, flags: c.flags.length });
    return { ok: true, claim: publicExpense_(row, ctx, me) };
  });
}
/** The claimant withdraws a pending claim; a payroll holder withdraws an approved one not paid yet (its payroll line goes too). */
function api_expenseCancel(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.EXPENSE, 'id', req.id), ctx = orgCtx_();
    if (!x) fail_('not_found');
    var note = str_(req.note, 300), own = x.empId === me.id;
    if (own && x.status === 'pending') { /* withdrawn by the claimant */ }
    else if (!own && canPayroll_(me) && x.status === 'approved') {
      if (!note) fail_('note_required');
      if (x.payout === 'payroll') {
        if (monthLocked_(x.empId, x.payMonth)) fail_('month_locked');
        var adj = findBy_(SHEETS.ADJ, 'ref', x.adjRef);
        if (adj && adj.status !== 'deleted') { adj.status = 'deleted'; update_(SHEETS.ADJ, adj); }
      }
    } else fail_('forbidden');
    var h = parseJson_(x.stepsJson, []);
    h.push({ step: x.step || 'done', by: me.id, decision: 'cancelled', note: note, at: new Date().toISOString() });
    x.stepsJson = JSON.stringify(h); x.status = 'cancelled'; x.updatedAt = new Date().toISOString();
    update_(SHEETS.EXPENSE, x);
    audit_(me.id, 'expense_cancel', x.empId, { ref: x.ref });
    return { ok: true, claim: publicExpense_(x, ctx, me) };
  });
}
/** The current step decides. The payroll step chooses the payout; an over-limit claim needs the reason. */
function api_expenseDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approve' : req.decision === 'reject' ? 'reject' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.EXPENSE, 'id', req.id);
    if (!x) fail_('not_found');
    var emp = ctx.emps[x.empId];
    if (x.empId === me.id) fail_('cannot_decide_own');
    if (!canActExpense_(me, x, emp, ctx)) fail_(x.status !== 'pending' ? 'not_found' : 'forbidden');
    var note = str_(req.note, 300), now = new Date().toISOString();
    if (decision === 'reject' && !note) fail_('note_required');
    var final = x.step === 'payroll';
    if (decision === 'approve' && final && parseJson_(x.flagsJson, []).length && !note) fail_('note_required');
    var h = parseJson_(x.stepsJson, []);
    var dg = x.step === 'manager' && !manages_(me, emp, ctx) && !isHr_(me) ? delegatedFor_(me, emp, ctx) : null;
    h.push({ step: x.step, by: me.id, role: dg ? 'delegate' : x.step === 'manager' && !manages_(me, emp, ctx) ? 'hr_on_behalf' : x.step, onBehalfOf: dg ? dg.fromEmpId : '',
      decision: decision, note: note, at: now });
    x.stepsJson = JSON.stringify(h); x.updatedAt = now;
    if (decision === 'reject') { x.status = 'rejected'; x.decidedAt = now; }
    else if (!final) x.step = 'payroll';
    else {
      // Re-check against today's data: a duplicate or a bad line that slipped in since the claim was made stops here.
      var c = expCheck_(emp, parseJson_(x.linesJson, []), x.id);
      if (c.error) fail_(c.error);
      x.flagsJson = JSON.stringify(c.flags);
      var payout = req.payout === 'outside' ? 'outside' : 'payroll';
      x.status = 'approved'; x.step = 'done'; x.decidedAt = now; x.payout = payout;
      if (payout === 'payroll') {
        var m = openPayMonth_(), ref = nextRef_('adjustment', refsOf_(SHEETS.ADJ));
        append_(SHEETS.ADJ, { id: newId_('A'), ref: ref, empId: x.empId, month: m, kind: 'earning', code: 'reimbursement', amount: Number(x.total),
          reason: x.ref + ' مطالبة مصروفات', enteredBy: me.id, status: 'active', createdAt: now });
        x.payMonth = m; x.adjRef = ref;
      }
    }
    update_(SHEETS.EXPENSE, x);
    audit_(me.id, 'expense_' + (x.status === 'approved' ? 'approved' : decision === 'reject' ? 'rejected' : 'step'), x.empId, { ref: x.ref, payout: x.payout || '', month: x.payMonth || '' });
    return { ok: true, claim: publicExpense_(x, ctx, me) };
  });
}
/** Paid outside payroll (transfer, cash): a payroll holder records the reference. */
function api_expensePaid(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var ref = str_(req.paidRef, 60), on = isoDate_(req.paidOn) || today_();
  if (!ref) fail_('missing_fields');
  if (on > today_()) fail_('bad_date');
  return withLock_(function () {
    var x = findBy_(SHEETS.EXPENSE, 'id', req.id), ctx = orgCtx_();
    if (!x || x.status !== 'approved' || x.payout !== 'outside') fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    x.status = 'paid'; x.paidRef = ref; x.paidOn = on; x.paidBy = me.id; x.updatedAt = new Date().toISOString();
    update_(SHEETS.EXPENSE, x);
    audit_(me.id, 'expense_paid', x.empId, { ref: x.ref, paidRef: ref });
    return { ok: true, claim: publicExpense_(x, ctx, me) };
  });
}

function api_myExpenses(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.EXPENSE), emp = ctx.emps[me.id] || me;
  var rows = all.filter(function (x) { return x.empId === me.id; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return publicExpense_(x, ctx, me); });
  var inbox = all.filter(function (x) { return canActExpense_(me, x, ctx.emps[x.empId], ctx); }).length;
  var s = settings_();
  return { ok: true, rows: rows, inbox: inbox, categories: EXP_CATS, limits: expLimits_(), receiptOver: Number(s.expenseReceiptOver) || 0, maxAgeDays: EXP_MAX_AGE_DAYS,
    steps: expSteps_(emp, ctx), canAll: canPayroll_(me), isManager: managesAnyone_(me, ctx) };
}
/** Waiting for me (default); 'team' = my people's claims; 'all' = everyone's (the hr role and payroll). */
function api_expenseInbox(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.EXPENSE), rows;
  if (req.scope === 'all') { if (!canPayroll_(me)) fail_('forbidden'); rows = all.filter(function (x) { return x.empId !== me.id; }); }
  else if (req.scope === 'team') rows = all.filter(function (x) { var e = ctx.emps[x.empId]; return e && manages_(me, e, ctx); });
  else rows = all.filter(function (x) { return canActExpense_(me, x, ctx.emps[x.empId], ctx); });
  rows = rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 500);
  return { ok: true, rows: rows.map(function (x) { return publicExpense_(x, ctx, me); }), canAll: canPayroll_(me) };
}
/** Claims by month, department and category (approved and paid; pending shown apart). For the Excel export. */
function api_expenseReport(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var t = today_(), to = /^\d{4}-\d{2}$/.test(req.to || '') ? req.to : t.slice(0, 7), from = /^\d{4}-\d{2}$/.test(req.from || '') ? req.from : govAddMonths_(to + '-01', -11).slice(0, 7);
  if (from > to) fail_('bad_range');
  var ctx = orgCtx_(), groups = {}, flags = 0;
  readAll_(SHEETS.EXPENSE).forEach(function (x) {
    if (!expLive_(x)) return;
    var e = ctx.emps[x.empId] || {}, d = ctx.depts[x.departmentId || e.departmentId], dept = d ? d.nameAr : (e.department || '-');
    var state = x.status === 'pending' ? 'pending' : 'approved';
    if (parseJson_(x.flagsJson, []).length) flags++;
    parseJson_(x.linesJson, []).forEach(function (l) {
      var m = String(l.date).slice(0, 7); if (m < from || m > to) return;
      var k = [m, dept, l.category, state].join('|'), g = groups[k] = groups[k] || { month: m, department: dept, costCenter: d ? String(d.costCenter || '') : '', category: l.category, state: state, claims: {}, lines: 0, amount: 0, vat: 0 };
      g.claims[x.ref] = 1; g.lines++; g.amount += h_(l.amount); g.vat += h_(l.vat);
    });
  });
  var rows = Object.keys(groups).sort().map(function (k) { var g = groups[k]; return { month: g.month, department: g.department, costCenter: g.costCenter, category: g.category, state: g.state,
    claims: Object.keys(g.claims).length, lines: g.lines, amount: g.amount / 100, net: (g.amount - g.vat) / 100, vat: g.vat / 100 }; });
  audit_(me.id, 'expense_report', '', { from: from, to: to, rows: rows.length });
  return { ok: true, from: from, to: to, rows: rows, overLimitClaims: flags };
}
/** Limits per category per month and the receipt threshold: an administrator or a payroll holder. */
function api_expenseLimitsSave(req, me) {
  if (me.role !== 'admin' && !canPayroll_(me)) fail_('forbidden');
  var lim = req.limits || {}, clean = {}, over = req.receiptOver === undefined ? null : Number(req.receiptOver);
  if (typeof lim !== 'object' || Array.isArray(lim)) fail_('bad_value');
  Object.keys(lim).forEach(function (k) {
    if (EXP_CATS.indexOf(k) < 0) fail_('bad_value');
    if (lim[k] === '' || lim[k] == null) return;
    var n = num_(lim[k]); if (!(n > 0) || n > 1000000) fail_('bad_amount');
    clean[k] = n;
  });
  if (over !== null && (!isFinite(over) || over < 0 || over > 100000)) fail_('bad_amount');
  return withLock_(function () {
    saveSettingKey_('expenseLimits', Object.keys(clean).length ? JSON.stringify(clean) : '');
    if (over !== null) saveSettingKey_('expenseReceiptOver', over);
    audit_(me.id, 'expense_limits_save', '', { limits: clean, receiptOver: over });
    return { ok: true, limits: clean, receiptOver: over === null ? Number(settings_().expenseReceiptOver) : over };
  });
}
/** Bell: claims waiting for my step; approved claims paid outside payroll and not recorded yet (payroll). */
function expenseTasks_(me, ctx, add) {
  var all = readAll_(SHEETS.EXPENSE);
  add('expense_approve', all.filter(function (x) { return canActExpense_(me, x, ctx.emps[x.empId], ctx); }).length, { tab: 'hr', sec: 'expenses' });
  if (canPayroll_(me)) add('expense_pay', all.filter(function (x) { return x.status === 'approved' && x.payout === 'outside' && x.empId !== me.id; }).length, { tab: 'hr', sec: 'expenses' });
}
