/**
 * Wave 7 (2026-11-08): the four HRIS gaps from the benchmark against Workday, SAP SuccessFactors, Rippling, HiBob,
 * Personio, Jisr, ZenHR and Bayzat. One file, so the backend file list changes once.
 *   1 payroll budget vs actual with a year-end forecast   2 Nitaqat what-if simulator
 *   3 in-app e-signature with a tamper seal               4 HR automation rules ("when X happens, do Y")
 * Every rule is checked here; the screens (js/wave7.js) only show what each answer allows.
 */
function w7Money_(me) { return canPayroll_(me); }                                 // hr role or payroll: per person and totals
function w7Exec_(me) { return canPayroll_(me) || hasRole_(me, 'executive'); }      // totals only
function w7Year_(v) { var y = Math.round(Number(v)); return y >= 2000 && y <= 2100 ? y : Number(today_().slice(0, 4)); }

// ======================================================================= 1. budget vs actual, with a forecast
// Budgets are monthly, for the whole company (departmentId '') or one department. Actual = company cost (gross + employer
// GOSI + end-of-service accrual) of each month's runs, locked runs preferred, every pay group added. The forecast for the
// months still to come is the average cost per head of the last three months with a run, times today's active headcount.
function api_budgetSave(req, me) {
  if (!w7Money_(me)) fail_('forbidden');
  var y = w7Year_(req.year), dep = str_(req.departmentId, 40), list = req.months;
  if (!Array.isArray(list) || list.length !== 12) fail_('bad_months');
  var nums = list.map(function (v) { if (v === '' || v == null) return null; var n = Number(v); if (!isFinite(n) || n < 0 || n > 1e10) fail_('bad_amount'); return r2_(n); });
  if (dep && !orgCtx_().depts[dep]) fail_('not_found');
  return withLock_(function () {
    var rows = readAll_(SHEETS.BUDGET), now = new Date().toISOString(), n = 0;
    nums.forEach(function (amt, i) {
      var m = y + '-' + String(i + 1).padStart(2, '0');
      var row = rows.filter(function (b) { return b.month === m && String(b.departmentId || '') === dep; })[0];
      if (amt === null) { if (row && Number(row.amount)) { row.amount = 0; row.updatedBy = me.id; row.updatedAt = now; update_(SHEETS.BUDGET, row); n++; } return; }
      if (row) { if (Number(row.amount) !== amt) { row.amount = amt; row.updatedBy = me.id; row.updatedAt = now; update_(SHEETS.BUDGET, row); n++; } }
      else { append_(SHEETS.BUDGET, { id: newId_('BG'), month: m, departmentId: dep, amount: amt, note: '', updatedBy: me.id, updatedAt: now }); n++; }
    });
    return { ok: true, changed: n };
  });
}

function budgetActuals_(year) {
  var runs = readAll_(SHEETS.RUN), slips = readAll_(SHEETS.SLIP), ctx = orgCtx_(), out = {};
  var pick = function (month) { var rs = runs.filter(function (r) { return r.month === month; }); var lk = rs.filter(function (r) { return r.status === 'locked'; }); return (lk.length ? lk : rs).map(function (r) { return r.id; }); };
  for (var i = 1; i <= 12; i++) {
    var m = year + '-' + String(i).padStart(2, '0'), ids = pick(m); if (!ids.length) continue;
    var pt = { total: 0, headcount: 0, locked: runs.some(function (r) { return r.month === m && r.status === 'locked'; }), dept: {} }, seen = {};
    slips.forEach(function (x) {
      if (ids.indexOf(x.runId) < 0) return;
      var c = Number(x.companyCost) || ((Number(x.gross) || 0) + (Number(x.gosiEmployer) || 0)), e = ctx.emps[x.empId], d = (e && e.departmentId) || '';
      pt.total = r2_(pt.total + c); if (!seen[x.empId]) { seen[x.empId] = 1; pt.headcount++; }
      pt.dept[d] = r2_((pt.dept[d] || 0) + c);
    });
    out[m] = pt;
  }
  return out;
}

function api_budgetView(req, me) {
  if (!w7Exec_(me)) fail_('forbidden');
  var y = w7Year_(req.year), ctx = orgCtx_(), dep = str_(req.departmentId, 40), t = today_();
  var act = budgetActuals_(y), prevAct = budgetActuals_(y - 1);
  var bud = {}; readAll_(SHEETS.BUDGET).forEach(function (b) { if (String(b.month).slice(0, 4) === String(y) && String(b.departmentId || '') === dep) bud[b.month] = Number(b.amount) || 0; });
  // run rate: the last three months with a run (this year, then last year), cost per head
  var hist = [];
  for (var k = 12; k >= 1 && hist.length < 3; k--) { var mm = y + '-' + String(k).padStart(2, '0'); if (act[mm]) hist.push(act[mm]); }
  for (var j = 12; j >= 1 && hist.length < 3; j--) { var pm = (y - 1) + '-' + String(j).padStart(2, '0'); if (prevAct[pm]) hist.push(prevAct[pm]); }
  var costOf = function (p) { return dep ? (p.dept[dep] || 0) : p.total; };
  var headOf = function (p) { return dep ? null : p.headcount; };
  var active = Object.keys(ctx.emps).filter(function (id) { var e = ctx.emps[id]; return e.status === 'active' && (!dep || e.departmentId === dep); }).length;
  var rate = 0, basis = 'none';
  if (hist.length) {
    var hc = hist.map(headOf), cost = hist.reduce(function (s, p) { return s + costOf(p); }, 0) / hist.length;
    if (!dep && hc.every(function (h) { return h > 0; })) { var perHead = hist.reduce(function (s, p) { return s + p.total / p.headcount; }, 0) / hist.length; rate = r2_(perHead * active); basis = 'per_head'; }
    else { rate = r2_(cost); basis = 'average'; }
  }
  var lastActual = Object.keys(act).sort().pop() || '';
  var months = [], tot = { budget: 0, actual: 0, forecast: 0, budgetToDate: 0 };
  for (var i = 1; i <= 12; i++) {
    var m = y + '-' + String(i).padStart(2, '0'), a = act[m] ? r2_(costOf(act[m])) : null, b = bud[m] || 0;
    var future = !act[m] && m > (lastActual || t.slice(0, 7)) || (!act[m] && m >= t.slice(0, 7));
    var f = a !== null ? a : (future ? rate : 0);
    months.push({ month: m, budget: r2_(b), actual: a, forecast: a === null && future ? rate : null, locked: act[m] ? act[m].locked : false, variance: a !== null && b ? r2_(a - b) : null,
      variancePct: a !== null && b ? Math.round((a - b) / b * 1000) / 10 : null, lastYear: prevAct[(y - 1) + m.slice(4)] ? r2_(costOf(prevAct[(y - 1) + m.slice(4)])) : null });
    tot.budget = r2_(tot.budget + b); tot.forecast = r2_(tot.forecast + f);
    if (a !== null) { tot.actual = r2_(tot.actual + a); tot.budgetToDate = r2_(tot.budgetToDate + b); }
  }
  var landing = tot.forecast, gap = tot.budget ? r2_(landing - tot.budget) : null;
  var status = !tot.budget ? 'no_budget' : landing > tot.budget * 1.02 ? 'over' : landing > tot.budget * 0.98 ? 'on_track' : 'under';
  // by department (company view only): this year's actual to date against each department's own budget
  var depts = [];
  if (!dep) {
    var dBud = {}; readAll_(SHEETS.BUDGET).forEach(function (b) { if (String(b.month).slice(0, 4) === String(y) && b.departmentId) dBud[b.departmentId] = r2_((dBud[b.departmentId] || 0) + (Number(b.amount) || 0)); });
    var dAct = {}; Object.keys(act).forEach(function (m) { Object.keys(act[m].dept).forEach(function (d) { dAct[d] = r2_((dAct[d] || 0) + act[m].dept[d]); }); });
    Object.keys(dAct).concat(Object.keys(dBud)).filter(function (d, i, a) { return a.indexOf(d) === i; }).forEach(function (d) {
      var dd = ctx.depts[d]; depts.push({ id: d, name: dd ? dd.nameAr : '', nameEn: dd ? (dd.nameEn || dd.nameAr) : '', actual: dAct[d] || 0, budget: dBud[d] || 0 });
    });
    depts.sort(function (u, v) { return v.actual - u.actual; });
  }
  return { ok: true, year: y, departmentId: dep, months: months, totals: { budget: tot.budget, actual: tot.actual, budgetToDate: tot.budgetToDate, landing: landing, gap: gap,
    usedPct: tot.budget ? Math.round(tot.actual / tot.budget * 1000) / 10 : null, ytdVariance: tot.budgetToDate ? r2_(tot.actual - tot.budgetToDate) : null },
    runRate: rate, basis: basis, activeHeadcount: active, status: status, departments: depts, canEdit: w7Money_(me),
    deptList: Object.keys(ctx.depts).map(function (d) { return { id: d, name: ctx.depts[d].nameAr, nameEn: ctx.depts[d].nameEn || ctx.depts[d].nameAr }; }) };
}

// ======================================================================= 2. Nitaqat what-if simulator
// Weighted Saudization = full-weight Saudis (basic + housing >= 4,000 counts 1, 3,000-3,999 counts 0.5, less counts 0) over
// the active headcount. The scenario adds hires, removes leavers and lifts wages, and says how many full-weight Saudis the
// target still needs. Qiwa has more rules (students, people with disabilities, part-time, the activity's own bands), so the
// answer is a planning guide and says so; the Qiwa calculator stays the official figure.
function api_nitaqatSim(req, me) {
  if (!w7Exec_(me)) fail_('forbidden');
  var ctx = orgCtx_(), comps = currentCompMap_(today_()), money = w7Money_(me), target = Number(settings_().saudizationTarget) || null;
  var people = Object.keys(ctx.emps).map(function (id) { return ctx.emps[id]; }).filter(function (e) { return e.status === 'active'; });
  var base = { headcount: people.length, saudis: 0, weighted: 0 }, wins = [];
  people.forEach(function (e) {
    if (!bool_(e.isSaudi)) return;
    var c = comps[e.id], w = nitaqatWeight_(c); base.saudis++; base.weighted += w;
    if (w < 1) { var wage = c ? (Number(c.basic) || 0) + (Number(c.housing) || 0) : 0, need = r2_(Math.max(0, 4000 - wage)); wins.push({ emp: money ? empCard_(e) : null, weight: w, wage: money ? wage : null, monthlyCost: need, gain: r2_(1 - w) }); }
  });
  var pct = function (w, h) { return h ? Math.round(w / h * 1000) / 10 : 0; };
  base.pct = pct(base.weighted, base.headcount);
  var hires = Array.isArray(req.hires) ? req.hires.slice(0, 20) : [], leavers = Array.isArray(req.leavers) ? req.leavers.slice(0, 200) : [], raises = Array.isArray(req.raises) ? req.raises.slice(0, 200) : [];
  var sc = { headcount: base.headcount, weighted: base.weighted, cost: 0 };
  hires.forEach(function (h) {
    var n = Math.max(0, Math.min(500, Math.round(Number(h.count) || 0))), wage = Math.max(0, Number(h.wage) || 0);
    sc.headcount += n; sc.cost = r2_(sc.cost + n * wage);
    if (bool_(h.saudi)) sc.weighted += n * (wage >= 4000 ? 1 : wage >= 3000 ? 0.5 : 0);
  });
  var gone = {};
  leavers.forEach(function (id) { var e = ctx.emps[id]; if (!e || e.status !== 'active' || gone[id]) return; gone[id] = 1; sc.headcount--; if (bool_(e.isSaudi)) sc.weighted -= nitaqatWeight_(comps[id]); });
  raises.forEach(function (r) {
    var e = ctx.emps[r.empId]; if (!e || gone[r.empId] || e.status !== 'active' || !bool_(e.isSaudi)) return;
    var c = comps[r.empId], was = c ? (Number(c.basic) || 0) + (Number(c.housing) || 0) : 0, to = Math.max(0, Number(r.wage) || 0);
    if (to <= was) return; sc.weighted += (to >= 4000 ? 1 : to >= 3000 ? 0.5 : 0) - nitaqatWeight_(c); sc.cost = r2_(sc.cost + to - was);
  });
  sc.weighted = Math.round(sc.weighted * 10) / 10; sc.pct = pct(sc.weighted, sc.headcount);
  // full-weight Saudis to add (each adds 1 to both sides) so that (W + x) / (H + x) >= target
  var needFor = function (w, h) { if (!target) return null; var p = target / 100; if (p >= 1) return null; var x = Math.ceil((p * h - w) / (1 - p) - 1e-9); return Math.max(0, x); };
  wins.sort(function (u, v) { return u.monthlyCost / u.gain - v.monthlyCost / v.gain; });
  var winsCost = wins.reduce(function (s, w) { return r2_(s + w.monthlyCost); }, 0), winsGain = wins.reduce(function (s, w) { return s + w.gain; }, 0);
  return { ok: true, target: target, base: { headcount: base.headcount, saudis: base.saudis, weighted: Math.round(base.weighted * 10) / 10, pct: base.pct, need: needFor(base.weighted, base.headcount) },
    scenario: { headcount: sc.headcount, weighted: sc.weighted, pct: sc.pct, change: Math.round((sc.pct - base.pct) * 10) / 10, need: needFor(sc.weighted, sc.headcount), monthlyCost: money ? sc.cost : null },
    quickWins: { count: wins.length, gain: Math.round(winsGain * 10) / 10, monthlyCost: winsCost, pctIfAll: pct(base.weighted + winsGain, base.headcount), rows: money ? wins.slice(0, 50) : [] },
    canNames: money };
}

// ======================================================================= 3. e-signature
// HR sends a text (contract, letter, policy, undertaking) to one or more people. The signer reads it in the app, types their
// full name as it appears in the file and signs; the server stores who, when and a SHA-256 of the exact text, sealed with
// the organisation's signing secret (HMAC). Verifying recomputes both, so any edit to the text or the record shows.
// Nobody signs a document they requested. Signed and declined records are final.
function signNorm_(s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase(); }
function signSeal_(r) { return hmac_('esign|' + r.id + '|' + r.docHash + '|' + r.empId + '|' + r.signedAt + '|' + signNorm_(r.signedName)); }
function signView_(r, ctx, withBody) {
  var o = { id: r.id, ref: r.ref, title: r.title, kind: r.kind || 'other', status: r.status, emp: empCard_(ctx.emps[r.empId]), requestedBy: empCard_(ctx.emps[r.requestedBy]), requestedAt: r.requestedAt,
    dueDate: r.dueDate || '', signedAt: r.signedAt || '', signedName: r.signedName || '', declineNote: r.declineNote || '', docHash: r.docHash, seal: r.status === 'signed' ? r.seal : '',
    overdue: r.status === 'pending' && r.dueDate && String(r.dueDate).slice(0, 10) < today_() };
  if (withBody) o.body = r.body;
  return o;
}
var SIGN_KINDS_ = ['contract', 'letter', 'policy', 'undertaking', 'other'];
function api_signRequest(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var d = req.doc || {}, title = str_(d.title, 160), body = String(d.body == null ? '' : d.body).trim().slice(0, 20000), kind = SIGN_KINDS_.indexOf(d.kind) >= 0 ? d.kind : 'other';
  var due = d.dueDate ? isoDate_(d.dueDate) : '', ids = Array.isArray(req.empIds) ? req.empIds : [];
  if (!title) fail_('title_required'); if (body.length < 20) fail_('body_required'); if (!ids.length) fail_('people_required'); if (ids.length > 300) fail_('too_many');
  if (d.dueDate && !due) fail_('bad_date'); if (due && due < today_()) fail_('date_past');
  var ctx = orgCtx_(), clean = [];
  ids.forEach(function (id) { var e = ctx.emps[id]; if (!e || e.status !== 'active') fail_('not_found'); if (id === me.id) fail_('cannot_sign_own_request'); if (clean.indexOf(id) < 0) clean.push(id); });
  return withLock_(function () {
    var now = new Date().toISOString(), hash = sha256Hex_(body), refs = nextRefs_('esign', clean.length, refsOf_(SHEETS.SIGN));
    var rows = clean.map(function (id, i) { return { id: newId_('SG'), ref: refs[i], kind: kind, title: title, body: body, docHash: hash, empId: id, status: 'pending', requestedBy: me.id, requestedAt: now, dueDate: due,
      signedName: '', signedAt: '', seal: '', declineNote: '', declinedAt: '' }; });
    if (typeof appendMany_ === 'function') appendMany_(SHEETS.SIGN, rows); else rows.forEach(function (r) { append_(SHEETS.SIGN, r); });
    return { ok: true, count: rows.length, refs: refs, docHash: hash };
  });
}
function api_signList(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.SIGN), hr = isHr_(me);
  var mine = all.filter(function (r) { return r.empId === me.id; }).map(function (r) { return signView_(r, ctx, true); });
  var sent = hr ? all.filter(function (r) { return r.empId !== me.id; }).map(function (r) { return signView_(r, ctx, false); }) : [];
  var desc = function (a, b) { return String(b.requestedAt).localeCompare(String(a.requestedAt)); };
  mine.sort(desc); sent.sort(desc);
  return { ok: true, mine: mine, sent: sent, isHr: hr, myName: me.name };
}
function api_signDoc(req, me) {
  return withLock_(function () {
    var r = findBy_(SHEETS.SIGN, 'id', req.id);
    if (!r || r.empId !== me.id) fail_('not_found');
    if (r.status !== 'pending') fail_('already_done');
    if (r.requestedBy === me.id) fail_('cannot_sign_own_request');
    if (req.agree !== true) fail_('agree_required');
    if (String(req.docHash || '') !== r.docHash || sha256Hex_(r.body) !== r.docHash) fail_('doc_changed');
    var typed = signNorm_(req.name), names = [me.name, me.nameEn].filter(Boolean).map(signNorm_);
    if (!typed || names.indexOf(typed) < 0) fail_('name_mismatch');
    r.signedName = str_(req.name, 120); r.signedAt = new Date().toISOString(); r.status = 'signed'; r.seal = signSeal_(r);
    update_(SHEETS.SIGN, r);
    return { ok: true, ref: r.ref, signedAt: r.signedAt, seal: r.seal };
  });
}
function api_signDecline(req, me) {
  var note = str_(req.note, 500); if (!note) fail_('note_required');
  return withLock_(function () {
    var r = findBy_(SHEETS.SIGN, 'id', req.id);
    if (!r || r.empId !== me.id) fail_('not_found'); if (r.status !== 'pending') fail_('already_done');
    r.status = 'declined'; r.declineNote = note; r.declinedAt = new Date().toISOString(); update_(SHEETS.SIGN, r);
    return { ok: true };
  });
}
function api_signCancel(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var r = findBy_(SHEETS.SIGN, 'id', req.id); if (!r) fail_('not_found'); if (r.status !== 'pending') fail_('already_done');
    r.status = 'cancelled'; r.declinedAt = new Date().toISOString(); r.declineNote = 'cancelled by ' + (me.empNo || me.id); update_(SHEETS.SIGN, r);
    return { ok: true };
  });
}
function api_signVerify(req, me) {
  var ref = str_(req.ref, 40), r = readAll_(SHEETS.SIGN).filter(function (x) { return x.ref === ref || x.id === req.id; })[0];
  if (!r || (!isHr_(me) && r.empId !== me.id)) fail_('not_found');
  var textOk = sha256Hex_(r.body) === r.docHash, sealOk = r.status === 'signed' && !!r.seal && signSeal_(r) === r.seal;
  var given = str_(req.seal, 200), sealMatch = given ? given === r.seal : null;
  return { ok: true, ref: r.ref, status: r.status, textIntact: textOk, sealValid: sealOk, sealMatches: sealMatch, valid: textOk && sealOk && sealMatch !== false, signedAt: r.signedAt || '', signer: empCard_(orgCtx_().emps[r.empId]) };
}
hrisHook_('tasks', function (me, ctx, add) {
  add('sign_pending', readAll_(SHEETS.SIGN).filter(function (r) { return r.empId === me.id && r.status === 'pending'; }).length, { tab: 'file' });
});

// ======================================================================= 4. automation rules
// HR writes rules: a trigger (N days before or after an event in the employee's file), who acts (HR, the line manager or the
// employee) and a message. A sweep after write requests, at most once an hour, turns due rules into to-dos in the bell. Each
// rule fires once per person per event date (key). A 'before' rule stays due until the event passes (a contract ending in 40 days
// still needs its 60-day reminder); an 'after' rule only within 14 days of its date, so a new rule never floods the
// list with years of history. HR can run the sweep at once.
var AUTO_TRIGGERS_ = { after_hire: 'after', probation_end: 'before', contract_end: 'before', id_expiry: 'before', doc_expiry: 'before', anniversary: 'before', after_resignation: 'after' };
var AUTO_WHO_ = ['hr', 'manager', 'employee'];
var AUTO_WINDOW_ = 14;
function autoClean_(d) {
  var name = str_(d.name, 120), trig = String(d.trigger || ''), days = Math.round(Number(d.days)), who = String(d.audience || ''), msg = str_(d.message, 300);
  if (!name) fail_('name_required'); if (!AUTO_TRIGGERS_[trig]) fail_('bad_trigger'); if (!isFinite(days) || days < 0 || days > 365) fail_('bad_days');
  if (AUTO_WHO_.indexOf(who) < 0) fail_('bad_audience'); if (!msg) fail_('message_required');
  return { name: name, trigger: trig, days: days, audience: who, message: msg };
}
function api_autoRuleSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var d = req.rule || {}, v = autoClean_(d);
  return withLock_(function () {
    var now = new Date().toISOString();
    if (d.id) { var r = findBy_(SHEETS.AUTO, 'id', d.id); if (!r) fail_('not_found'); Object.assign(r, v); r.status = d.status === 'paused' ? 'paused' : 'active'; r.updatedAt = now; update_(SHEETS.AUTO, r); return { ok: true, id: r.id }; }
    var row = Object.assign({ id: newId_('AR'), ref: nextRef_('autoRule', refsOf_(SHEETS.AUTO)), status: 'active', createdBy: me.id, createdAt: now, updatedAt: now }, v);
    append_(SHEETS.AUTO, row); return { ok: true, id: row.id, ref: row.ref };
  });
}
function autoEvents_(rule, ctx, priv, docs) {
  var out = [], when = AUTO_TRIGGERS_[rule.trigger], n = Number(rule.days) || 0, t = today_();
  Object.keys(ctx.emps).forEach(function (id) {
    var e = ctx.emps[id], dates = [];
    if (rule.trigger === 'after_resignation') { if (e.resignedOn) dates.push([isoDate_(e.resignedOn), '']); }
    else if (e.status !== 'active') return;
    else if (rule.trigger === 'after_hire') dates.push([isoDate_(e.hireDate), '']);
    else if (rule.trigger === 'probation_end') dates.push([isoDate_(e.probationEnd), '']);
    else if (rule.trigger === 'contract_end') dates.push([isoDate_(e.contractEnd), '']);
    else if (rule.trigger === 'id_expiry') { if (priv[id]) dates.push([isoDate_(priv[id].idExpiry), '']); }
    else if (rule.trigger === 'doc_expiry') (docs[id] || []).forEach(function (d) { dates.push([isoDate_(d.expiryDate), d.type || '']); });
    else if (rule.trigger === 'anniversary') { var h = isoDate_(e.hireDate); if (h && h.slice(5) !== '02-29') { var y = +t.slice(0, 4); [y, y + 1].forEach(function (yy) { if (yy > +h.slice(0, 4)) dates.push([yy + h.slice(4), String(yy - +h.slice(0, 4))]); }); } }
    dates.forEach(function (p) {
      if (!p[0]) return;
      var fire = addDays_(p[0], when === 'before' ? -n : n);
      if (fire <= t && (when === 'before' ? p[0] >= t : daysBetween_(fire, t) <= AUTO_WINDOW_)) out.push({ emp: e, eventDate: p[0], fire: fire, extra: p[1] });
    });
  });
  return out;
}
function autoText_(msg, e, ev) { return String(msg).replace(/\{name\}/g, e.name || '').replace(/\{empNo\}/g, String(e.empNo || '')).replace(/\{date\}/g, ev.eventDate).replace(/\{extra\}/g, ev.extra || ''); }
function autoRun_(ctx) {
  var rules = readAll_(SHEETS.AUTO).filter(function (r) { return r.status === 'active'; }); if (!rules.length) return 0;
  var have = {}; readAll_(SHEETS.AUTOT).forEach(function (x) { have[x.key] = 1; });
  var priv = {}, docs = {};
  if (rules.some(function (r) { return r.trigger === 'id_expiry'; })) readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  if (rules.some(function (r) { return r.trigger === 'doc_expiry'; })) readAll_(SHEETS.DOCS).forEach(function (d) { if (d.status !== 'deleted' && d.expiryDate) (docs[d.empId] = docs[d.empId] || []).push(d); });
  var now = new Date().toISOString(), add = [];
  rules.forEach(function (r) {
    autoEvents_(r, ctx, priv, docs).forEach(function (ev) {
      var key = r.id + '|' + ev.emp.id + '|' + ev.eventDate + '|' + ev.extra; if (have[key]) return; have[key] = 1;
      var who = r.audience === 'employee' ? ev.emp.id : r.audience === 'manager' && ev.emp.managerId && ctx.emps[ev.emp.managerId] && ctx.emps[ev.emp.managerId].status === 'active' ? ev.emp.managerId : '';
      add.push({ id: newId_('AT'), ruleId: r.id, empId: ev.emp.id, assigneeId: who, audience: who ? r.audience : 'hr', key: key, title: autoText_(r.message, ev.emp, ev), eventDate: ev.eventDate, dueDate: ev.eventDate > ev.fire ? ev.eventDate : addDays_(ev.fire, 7),
        status: 'open', doneBy: '', doneAt: '', createdAt: now });
    });
  });
  if (add.length) { if (typeof appendMany_ === 'function') appendMany_(SHEETS.AUTOT, add); else add.forEach(function (x) { append_(SHEETS.AUTOT, x); }); }
  return add.length;
}
function autoSweep_() {
  try {
    if (!rateLimit_('auto:run', 1, 3600)) return;
    if (!readAll_(SHEETS.AUTO).some(function (r) { return r.status === 'active'; })) return;
    withLock_(function () { autoRun_(orgCtx_()); });
  } catch (e) { console.error('automation: ' + (e && e.message)); }
}
function api_autoRunNow(req, me) { if (!isHr_(me)) fail_('forbidden'); return withLock_(function () { return { ok: true, created: autoRun_(orgCtx_()) }; }); }
function autoMine_(x, me, ctx) { return x.assigneeId ? x.assigneeId === me.id : isHr_(me) && x.empId !== me.id; }
function api_autoHub(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me), tasks = readAll_(SHEETS.AUTOT), rules = readAll_(SHEETS.AUTO);
  var rname = {}; rules.forEach(function (r) { rname[r.id] = r.name; });
  var view = function (x) { return { id: x.id, title: x.title, rule: rname[x.ruleId] || '', emp: empCard_(ctx.emps[x.empId]), audience: x.audience, eventDate: x.eventDate, dueDate: x.dueDate, status: x.status,
    doneBy: empCard_(ctx.emps[x.doneBy]), doneAt: x.doneAt, overdue: x.status === 'open' && String(x.dueDate) < today_(), canAct: x.status === 'open' && autoMine_(x, me, ctx) }; };
  var mine = tasks.filter(function (x) { return x.status === 'open' && autoMine_(x, me, ctx); }).map(view).sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
  var out = { ok: true, mine: mine, isHr: hr };
  if (hr) {
    var count = {}; tasks.forEach(function (x) { count[x.ruleId] = count[x.ruleId] || { open: 0, done: 0 }; count[x.ruleId][x.status === 'open' ? 'open' : 'done']++; });
    out.rules = rules.map(function (r) { return { id: r.id, ref: r.ref, name: r.name, trigger: r.trigger, days: Number(r.days) || 0, audience: r.audience, message: r.message, status: r.status, open: (count[r.id] || {}).open || 0, done: (count[r.id] || {}).done || 0 }; });
    out.recent = tasks.filter(function (x) { return x.status !== 'open'; }).sort(function (a, b) { return String(b.doneAt).localeCompare(String(a.doneAt)); }).slice(0, 30).map(view);
    out.allOpen = tasks.filter(function (x) { return x.status === 'open'; }).length;
  }
  return out;
}
function api_autoTaskStep(req, me) {
  var step = req.step === 'dismiss' ? 'dismissed' : 'done';
  return withLock_(function () {
    var x = findBy_(SHEETS.AUTOT, 'id', req.id), ctx = orgCtx_();
    if (!x) fail_('not_found'); if (x.status !== 'open') fail_('already_done');
    if (!autoMine_(x, me, ctx) && !(isHr_(me) && x.empId !== me.id)) fail_('forbidden');
    if (step === 'dismissed' && !isHr_(me)) fail_('forbidden');
    x.status = step; x.doneBy = me.id; x.doneAt = new Date().toISOString(); update_(SHEETS.AUTOT, x);
    return { ok: true };
  });
}
hrisHook_('tasks', function (me, ctx, add) {
  add('auto_task', readAll_(SHEETS.AUTOT).filter(function (x) { return x.status === 'open' && autoMine_(x, me, ctx); }).length, { tab: 'file' });
});
