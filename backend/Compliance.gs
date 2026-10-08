/**
 * Saudi compliance and daily-work tools, from the gap study of 2026-09-30 (docs/research/2026-09-30-hr-gap-study.md):
 *  - WPS (Mudad) salary file for a locked run, with the checks banks reject files for (IBAN, ID, net), and a monthly
 *    tracker: generated -> uploaded (payroll, with the bank/Mudad reference) -> confirmed (a second person).
 *  - Salary reconciliation: HR uploads the GOSI or Qiwa export; any wage that differs from the package in force is a
 *    mismatch, and payroll for that month cannot be approved while one stays open (the usual cause of WPS rejections).
 *  - Compliance calendar: GOSI registration within 15 days, Qiwa contract documentation, iqama / passport / contract /
 *    probation dates, the WPS upload deadline, open mismatches, Saudization below target.
 *  - My tasks: everything waiting for the signed-in person, in one list.
 *  - Delegation: a manager away (leave, Hajj) hands their approvals to someone else for up to 60 days; every decision
 *    is recorded as "on behalf of".
 * Rule details taken from vendor summaries (the WPS due day in particular) are settings, not constants: check them
 * against HRSD / Qiwa / GOSI texts before relying on them.
 */

// ---------------- delegation ----------------

/** The active delegation that lets me act for someone who manages emp, or null. */
function delegatedFor_(me, emp, ctx) {
  if (!me || !emp || emp.id === me.id) return null;
  var t = today_(), hit = null;
  readAll_(SHEETS.DLG).some(function (d) {
    if (d.status !== 'active' || d.toEmpId !== me.id || String(d.fromDate).slice(0, 10) > t || String(d.toDate).slice(0, 10) < t) return false;
    var from = ctx.emps[d.fromEmpId];
    if (from && from.id !== emp.id && manages_(from, emp, ctx)) { hit = d; return true; }
    return false;
  });
  return hit;
}
function publicDlg_(d, ctx) {
  return { id: d.id, ref: d.ref, from: empCard_(ctx.emps[d.fromEmpId]), to: empCard_(ctx.emps[d.toEmpId]), fromDate: String(d.fromDate).slice(0, 10), toDate: String(d.toDate).slice(0, 10),
    reason: d.reason, status: d.status, active: d.status === 'active' && String(d.fromDate).slice(0, 10) <= today_() && String(d.toDate).slice(0, 10) >= today_() };
}
function api_delegationSave(req, me) {
  var ctx = orgCtx_(), x = req.delegation || {};
  var fromId = isHr_(me) && x.fromEmpId ? x.fromEmpId : me.id, from = ctx.emps[fromId], to = ctx.emps[x.toEmpId];
  if (!from || !to || to.status !== 'active') fail_('not_found');
  if (from.id === to.id) fail_('bad_value');
  if (!isHr_(me) && !managesAnyone_(me, ctx)) fail_('forbidden');
  var a = isoDate_(x.fromDate) || today_(), b = isoDate_(x.toDate);
  if (!b || b < a || b < today_()) fail_('bad_range');
  if (daysBetween_(a, b) > 60) fail_('delegation_too_long');
  return withLock_(function () {
    var clash = readAll_(SHEETS.DLG).some(function (d) { return d.fromEmpId === from.id && d.status === 'active' && !(String(d.toDate).slice(0, 10) < a || String(d.fromDate).slice(0, 10) > b); });
    if (clash) fail_('delegation_overlap');
    var row = { id: newId_('G'), ref: nextRef_('delegation', refsOf_(SHEETS.DLG)), fromEmpId: from.id, toEmpId: to.id, fromDate: a, toDate: b, scope: 'manager',
      reason: str_(x.reason, 300), status: 'active', createdBy: me.id, createdAt: new Date().toISOString() };
    append_(SHEETS.DLG, row);
    audit_(me.id, 'delegation_save', to.id, { ref: row.ref, from: from.id, until: b });
    return { ok: true, delegation: publicDlg_(row, ctx) };
  });
}
function api_delegationList(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me);
  var rows = readAll_(SHEETS.DLG).filter(function (d) { return hr || d.fromEmpId === me.id || d.toEmpId === me.id; })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (d) { return publicDlg_(d, ctx); });
  var can = hr || managesAnyone_(me, ctx);
  // Names and numbers only, for choosing who covers; nothing else about colleagues.
  var people = can ? Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.id !== me.id; })
    .map(function (e) { return { id: e.id, name: e.name, empNo: String(e.empNo) }; }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ar'); }) : [];
  return { ok: true, rows: rows, canDelegate: can, people: people };
}
function api_delegationRevoke(req, me) {
  return withLock_(function () {
    var d = findBy_(SHEETS.DLG, 'id', req.id);
    if (!d) fail_('not_found');
    if (!isHr_(me) && d.fromEmpId !== me.id) fail_('forbidden');
    d.status = 'revoked'; update_(SHEETS.DLG, d);
    audit_(me.id, 'delegation_revoke', d.toEmpId, { ref: d.ref });
    return { ok: true };
  });
}

// ---------------- WPS (Mudad) file and tracker ----------------

// SAMA bank codes: characters 5-6 of a Saudi IBAN. Confirm with the company's bank before relying on the names.
var SA_BANKS = { '05': 'Alinma Bank', '10': 'Saudi National Bank', '15': 'Bank AlBilad', '20': 'Riyad Bank', '30': 'Arab National Bank', '45': 'Saudi Awwal Bank (SAB)',
  '55': 'Banque Saudi Fransi', '60': 'Bank AlJazira', '65': 'Saudi Investment Bank', '80': 'Al Rajhi Bank' };

/** ISO 13616 check: SA + 2 check digits + 20 digits, mod 97 = 1. */
function ibanOk_(iban) {
  var s = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{22}$/.test(s)) return false;
  var r = s.slice(4) + s.slice(0, 4), num = r.replace(/[A-Z]/g, function (c) { return String(c.charCodeAt(0) - 55); }), rem = 0;
  for (var i = 0; i < num.length; i += 7) rem = Number(String(rem) + num.slice(i, i + 7)) % 97;
  return rem === 1;
}
/** A Saudi national ID starts with 1, an iqama with 2; both are 10 digits. */
function saIdOk_(id, saudi) { var s = String(id || ''); return /^\d{10}$/.test(s) && s[0] === (saudi ? '1' : '2'); }

function wpsDue_(month, s) {
  var p = month.split('-'), d = new Date(Date.UTC(+p[0], +p[1], 1)), day = Math.max(1, Math.min(28, Number(s.wpsDueDay) || 10));
  return d.toISOString().slice(0, 8) + String(day).padStart(2, '0');
}
/** The file rows for a locked run, each with its problems; the file is blocked while any row has an error. */
function api_wpsFile(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var run = findBy_(SHEETS.RUN, 'id', req.id);
  if (!run || run.status !== 'locked') fail_('run_not_locked');
  var emps = {}, priv = {}, rows = [], skipped = [], errors = 0, total = 0;
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  readAll_(SHEETS.SLIP).filter(function (x) { return x.runId === run.id && x.status !== 'void'; }).forEach(function (sl) {
    var e = emps[sl.empId] || {}, p = priv[sl.empId] || {}, ls = lines_(sl), saudi = bool_(e.isSaudi);
    var sum = function (codes) { return r2_(ls.filter(function (l) { return codes.indexOf(l.code) >= 0; }).reduce(function (t, l) { return t + l.amount; }, 0)); };
    var iban = String(p.iban || '').replace(/\s+/g, '').toUpperCase(), basic = sum(['basic']), housing = sum(['housing']), net = Number(sl.net), gross = Number(sl.gross);
    // Nothing earned (no approved package): not a salary to transfer. Listed so HR can fix the package.
    if (!gross && !net) { skipped.push({ empNo: String(e.empNo || ''), name: e.name || '', payslip: sl.ref }); return; }
    var probs = [];
    if (!iban) probs.push('no_iban'); else if (!ibanOk_(iban)) probs.push('bad_iban');
    if (!p.nationalId) probs.push('no_id'); else if (!saIdOk_(p.nationalId, saudi)) probs.push('bad_id');
    if (!(net > 0)) probs.push('net_not_positive');
    if (!(basic > 0)) probs.push('no_basic');
    if (probs.length) errors++;
    total = r2_(total + net);
    rows.push({ empNo: String(e.empNo || ''), name: p.nameEnOfficial || e.nameEn || e.name || '', nameAr: e.name || '', idNumber: String(p.nationalId || ''), nationality: saudi ? 'SA' : (e.nationality || ''),
      bankCode: iban ? iban.slice(4, 6) : '', bank: iban ? SA_BANKS[iban.slice(4, 6)] || '' : '', iban: iban, basic: basic, housing: housing, other: r2_(gross - basic - housing),
      deductions: Number(sl.deductions), net: net, payslip: sl.ref, problems: probs });
  });
  audit_(me.id, 'wps_file', run.id, { ref: run.ref, rows: rows.length, errors: errors });
  var log = wpsLogOf_(run.id);
  // req.format picks a bank / Mudad layout (Journal.gs bankLayout_); every layout says "verify with the bank before first use"
  var layout = req.format && BANK_FORMATS[req.format] ? bankLayout_(req.format, rows, run, isoDate_(req.valueDate)) : null;
  return { ok: true, run: publicRun_(run), rows: rows, skipped: skipped, errors: errors, total: total, due: wpsDue_(run.month, settings_()), log: log ? publicWps_(log) : null,
    formats: Object.keys(BANK_FORMATS).map(function (k) { return { id: k, ar: BANK_FORMATS[k].ar, en: BANK_FORMATS[k].en }; }), layout: layout };
}
function wpsLogOf_(runId) { return readAll_(SHEETS.WPS).filter(function (w) { return w.runId === runId; })[0] || null; }
function publicWps_(w) {
  var names = {}; readAll_(SHEETS.EMP).forEach(function (e) { names[e.id] = e.name; });
  return { id: w.id, ref: w.ref, runId: w.runId, month: w.month, status: w.status, rows: Number(w.rows), total: Number(w.total), generatedBy: names[w.generatedBy] || '', generatedAt: w.generatedAt,
    uploadedBy: names[w.uploadedBy] || '', uploadedAt: w.uploadedAt, bankRef: w.bankRef, confirmedBy: names[w.confirmedBy] || '', confirmedAt: w.confirmedAt, note: w.note };
}
/** generated (file made, no errors) -> uploaded (reference from the bank or Mudad) -> confirmed (someone else checked the result). */
function api_wpsStep(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'locked') fail_('run_not_locked');
    var w = wpsLogOf_(run.id), now = new Date().toISOString(), step = req.step;
    if (step === 'generated') {
      if (w) fail_('already_exists');
      var f = api_wpsFile({ id: run.id }, me);
      if (f.errors) fail_('wps_errors');
      w = { id: newId_('W'), ref: nextRef_('wps', refsOf_(SHEETS.WPS)), runId: run.id, month: run.month, status: 'generated', rows: f.rows.length, total: f.total,
        generatedBy: me.id, generatedAt: now, uploadedBy: '', uploadedAt: '', bankRef: '', confirmedBy: '', confirmedAt: '', note: '' };
      append_(SHEETS.WPS, w);
    } else if (step === 'uploaded') {
      if (!w || w.status !== 'generated') fail_('bad_state');
      var ref = str_(req.bankRef, 60); if (!ref) fail_('missing_fields');
      w.status = 'uploaded'; w.uploadedBy = me.id; w.uploadedAt = now; w.bankRef = ref; w.note = str_(req.note, 300);
      update_(SHEETS.WPS, w);
    } else if (step === 'confirmed') {
      if (!w || w.status !== 'uploaded') fail_('bad_state');
      if (w.uploadedBy === me.id) fail_('second_approver_required');
      w.status = 'confirmed'; w.confirmedBy = me.id; w.confirmedAt = now; w.note = str_(req.note, 300) || w.note;
      update_(SHEETS.WPS, w);
    } else fail_('bad_value');
    audit_(me.id, 'wps_' + step, run.id, { ref: w.ref, month: run.month });
    return { ok: true, log: publicWps_(w) };
  });
}

// ---------------- salary reconciliation (GOSI / Qiwa exports) ----------------

/**
 * rows: [{ id, wage, basic?, housing? }] parsed in the browser from the export. GOSI's contributory wage is basic +
 * housing; Qiwa's contract wage is the basic. A difference of more than 1 SAR is a mismatch; people on one side only are listed too.
 */
function api_reconUpload(req, me) {
  if (!canPayroll_(me)) fail_('forbidden'); // wages: the hr role or payroll, never an administrator alone
  var source = req.source === 'qiwa' ? 'qiwa' : 'gosi', month = /^\d{4}-\d{2}$/.test(req.month || '') ? req.month : today_().slice(0, 7);
  var rows = (Array.isArray(req.rows) ? req.rows : []).slice(0, 3000);
  if (!rows.length) fail_('missing_fields');
  var byId = {}, emps = {}, priv = readAll_(SHEETS.PRIV), comps = currentCompMap_(monthLast_(month) > today_() ? today_() : monthLast_(month));
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  priv.forEach(function (p) { if (p.nationalId) byId[String(p.nationalId).trim()] = p.empId; });
  var seen = {}, mism = [], missing = [], unknown = [], matched = 0;
  rows.forEach(function (r) {
    var id = String(r.id || '').replace(/\D/g, ''), empId = byId[id];
    if (!id) return;
    if (!empId || !emps[empId]) { unknown.push({ id: id, wage: Number(r.wage) || 0 }); return; }
    seen[empId] = 1;
    var c = comps[empId], ours = c ? (source === 'gosi' ? r2_(c.basic + c.housing) : r2_(c.basic)) : null, theirs = r2_(Number(r.wage) || 0);
    if (ours == null || Math.abs(ours - theirs) > 1) mism.push({ empId: empId, empNo: String(emps[empId].empNo), name: emps[empId].name, ours: ours, theirs: theirs, diff: ours == null ? null : r2_(theirs - ours) });
    else matched++;
  });
  Object.keys(emps).forEach(function (k) { var e = emps[k]; if (e.status === 'active' && comps[k] && !seen[k]) missing.push({ empId: k, empNo: String(e.empNo), name: e.name }); });
  return withLock_(function () {
    var now = new Date().toISOString();
    var row = { id: newId_('Q'), ref: nextRef_('recon', refsOf_(SHEETS.RECON)), month: month, source: source, total: rows.length, matched: matched,
      mismatchesJson: JSON.stringify(mism), missingJson: JSON.stringify(missing.slice(0, 500)), unknownJson: JSON.stringify(unknown.slice(0, 500)),
      status: mism.length ? 'open' : 'clean', by: me.id, at: now, resolvedBy: '', resolvedAt: '', note: '' };
    append_(SHEETS.RECON, row);
    audit_(me.id, 'recon_upload', '', { ref: row.ref, source: source, month: month, mismatches: mism.length });
    return { ok: true, recon: publicRecon_(row) };
  });
}
function publicRecon_(x) {
  return { id: x.id, ref: x.ref, month: x.month, source: x.source, total: Number(x.total), matched: Number(x.matched), mismatches: parseJson_(x.mismatchesJson, []),
    missing: parseJson_(x.missingJson, []), unknown: parseJson_(x.unknownJson, []), status: x.status, at: x.at, note: x.note, resolvedAt: x.resolvedAt };
}
function api_reconList(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return { ok: true, rows: readAll_(SHEETS.RECON).slice(-60).reverse().map(publicRecon_) };
}
/** Someone other than the uploader closes the mismatches with a note (corrected in Qiwa / GOSI, or in our packages). */
function api_reconResolve(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.RECON, 'id', req.id);
    if (!x || x.status !== 'open') fail_('not_found');
    if (x.by === me.id) fail_('second_approver_required');
    var note = str_(req.note, 500); if (!note) fail_('note_required');
    x.status = 'resolved'; x.resolvedBy = me.id; x.resolvedAt = new Date().toISOString(); x.note = note;
    update_(SHEETS.RECON, x);
    audit_(me.id, 'recon_resolve', '', { ref: x.ref });
    return { ok: true, recon: publicRecon_(x) };
  });
}
/** Payroll approval asks this: an open mismatch for the month blocks it. */
function reconBlocks_(month) { return readAll_(SHEETS.RECON).some(function (x) { return x.month === month && x.status === 'open'; }); }

// ---------------- compliance calendar ----------------

function api_complianceCalendar(req, me) {
  if (!isHr_(me) && !hasRole_(me, 'payroll')) fail_('forbidden');
  var t = today_(), s = settings_(), ctx = orgCtx_(), items = [], priv = {};
  readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  var add = function (kind, due, emp, extra) { var d = due ? daysBetween_(t, due) : null; items.push(Object.assign({ kind: kind, due: due || '', daysLeft: d, emp: emp ? empCard_(emp) : null,
    level: d == null ? 'warn' : d < 0 ? 'error' : d <= 14 ? 'warn' : 'info' }, extra || {})); };
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k], p = priv[k] || {}, hire = String(e.hireDate || '').slice(0, 10);
    if (e.status !== 'active') return;
    if (hire && !p.gosiNumber && daysBetween_(hire, t) <= 90) add('gosi_register', addDays_(hire, 15), e);
    if (!e.contractNo) add('qiwa_contract', hire ? addDays_(hire, 30) : '', e, { saudi: bool_(e.isSaudi) });
  });
  api_hrExpiring({ days: 90 }, me).rows.forEach(function (x) { add(x.kind, x.date, ctx.emps[x.empId], { number: x.number }); });
  var runs = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }), wps = readAll_(SHEETS.WPS);
  for (var i = 1; i <= 3; i++) {
    var d = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1 - i, 1)), m = d.toISOString().slice(0, 7), run = runs.filter(function (r) { return r.month === m; })[0], due = wpsDue_(m, s);
    var w = run && wps.filter(function (x) { return x.runId === run.id; })[0];
    if (!run || run.status !== 'locked') add('payroll_not_locked', due, null, { month: m });
    else if (!w || w.status === 'generated') add('wps_upload', due, null, { month: m, run: run.ref });
    else if (w.status === 'uploaded') add('wps_confirm', due, null, { month: m, run: run.ref });
  }
  readAll_(SHEETS.INJ).filter(function (x) { return x.status === 'reported'; }).forEach(function (x) { add('injury_gosi', String(x.gosiDue).slice(0, 10), ctx.emps[x.empId], { ref: x.ref }); });
  readAll_(SHEETS.RECON).filter(function (x) { return x.status === 'open'; }).forEach(function (x) { add('recon_open', '', null, { month: x.month, ref: x.ref, count: parseJson_(x.mismatchesJson, []).length, level: 'error' }); });
  extraCalendar_(items, add, ctx, t, me); // Art. 72 grievance answers, government services, expenses, journals (GovServices.gs)
  items.forEach(function (x) { if (x.kind === 'recon_open') x.level = 'error'; });
  var target = Number(s.saudizationTarget) || 0;
  if (target) { var dir = api_hrDirectory({}, me).saudization; if (dir.saudiPct < target) items.push({ kind: 'saudization', due: '', daysLeft: null, emp: null, level: 'warn', value: dir.saudiPct, target: target }); }
  items.sort(function (a, b) { var r = { error: 0, warn: 1, info: 2 }; return r[a.level] - r[b.level] || String(a.due || '9').localeCompare(String(b.due || '9')); });
  return { ok: true, items: items, today: t, wpsDueDay: Number(s.wpsDueDay) || 10 };
}

// ---------------- my tasks ----------------

/** Everything waiting for me, counted, with where it lives in the app. Cheap: reads only what my roles can act on. */
function api_myTasks(req, me) {
  var ctx = orgCtx_(), out = [], t = today_(), soon = addDays_(t, 7), hr = isHr_(me), pay = hasRole_(me, 'payroll');
  var add = function (kind, n, target, extra) { if (n) out.push(Object.assign({ kind: kind, count: n, target: target }, extra || {})); };
  var reqs = readAll_(SHEETS.REQ);
  add('requests', reqs.filter(function (r) { return canAct_(me, r, ctx.emps[r.empId], ctx); }).length, { tab: 'hr', sec: 'inbox' });
  if (canDecideComp_(me)) add('salaries', readAll_(SHEETS.COMP).filter(function (c) { return c.status === 'pending' && c.empId !== me.id && c.enteredBy !== me.id; }).length, { tab: 'hr', sec: 'approvals' });
  if (pay) add('payroll', readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'draft' && r.preparedBy !== me.id; }).length, { tab: 'hr', sec: 'payroll' });
  if (hr || pay) {
    // Money exports, wage mismatches and the WPS upload are pay: the hr role or payroll, not an administrator alone.
    add('reports', readAll_(SHEETS.RLOG).filter(function (x) { return !x.reviewedBy && x.by !== me.id && ((REPORTS[x.reportId] || {}).access === 'money' ? canPayroll_(me) : hr); }).length, { tab: 'hr', sec: 'reports', view: 'log' });
    if (canPayroll_(me)) {
      add('recon', readAll_(SHEETS.RECON).filter(function (x) { return x.status === 'open' && x.by !== me.id; }).length, { tab: 'hr', sec: 'compliance' });
      add('wps', readAll_(SHEETS.WPS).filter(function (w) { return w.status === 'uploaded' && w.uploadedBy !== me.id; }).length, { tab: 'hr', sec: 'compliance' });
    }
  }
  var onb = readAll_(SHEETS.ONB).filter(function (x) { var e = ctx.emps[x.empId]; return x.status === 'open' && String(x.dueDate).slice(0, 10) <= soon && e && e.status === 'active' && onbCanTick_(me, x, e, ctx) && (x.owner !== 'it' || hr); });
  add('onboarding', onb.length, onb.some(function (x) { return x.empId === me.id; }) && onb.every(function (x) { return x.empId === me.id; }) ? { tab: 'file' } : { tab: 'hr', sec: 'onboarding' });
  var acks = {}; readAll_(SHEETS.PACK).forEach(function (a) { if (a.empId === me.id) acks[a.policyId + '|' + a.version] = 1; });
  add('policies', readAll_(SHEETS.POL).filter(function (p) { return p.status === 'active' && !acks[p.id + '|' + (Number(p.version) || 1)]; }).length, { tab: 'file' });
  add('survey', readAll_(SHEETS.SRV).filter(function (s) { return s.status === 'open' && String(s.closesAt).slice(0, 10) >= t && parseJson_(s.votersJson, []).indexOf(voterHash_(s.id, me.id)) < 0; }).length, { tab: 'file' });
  add('plans', readAll_(SHEETS.PLAN).filter(function (p) { return p.empId === me.id && !p.ackAt && (p.status === 'active' || p.status === 'extended'); }).length, { tab: 'file' });
  add('disc_respond', readAll_(SHEETS.DCASE).filter(function (x) { return x.empId === me.id && x.status === 'charged'; }).length, { tab: 'file' });
  if (hr) {
    add('disc_decide', readAll_(SHEETS.DCASE).filter(function (x) { return (x.status === 'charged' || x.status === 'responded') && x.reportedBy !== me.id && x.empId !== me.id && parseJson_(x.hearingsJson, []).length; }).length, { tab: 'hr', sec: 'relations' });
    add('disc_objection', readAll_(SHEETS.DCASE).filter(function (x) { return x.status === 'objected' && x.decidedBy !== me.id; }).length, { tab: 'hr', sec: 'relations' });
    add('injury', readAll_(SHEETS.INJ).filter(function (x) { return x.status === 'reported'; }).length, { tab: 'hr', sec: 'relations' });
  }
  add('asset_ack', readAll_(SHEETS.CUST).filter(function (c) { return c.empId === me.id && c.status === 'held' && !c.ackAt; }).length, { tab: 'file' });
  if (pay) add('asset_charge', readAll_(SHEETS.CUST).filter(function (c) { return c.chargeStatus === 'proposed' && c.chargeBy !== me.id && c.empId !== me.id; }).length, { tab: 'hr', sec: 'custody' });
  if (hr || pay || managesAnyone_(me, ctx)) add('clearance', readAll_(SHEETS.CLR).filter(function (x) { return x.status === 'open'; }).map(function (x) { return clearanceView_(x, me, ctx); })
    .reduce(function (s, v) { return s + v.tasks.filter(function (t) { return t.canTick; }).length; }, 0), { tab: 'hr', sec: 'offboarding' });
  extraTasks_(me, ctx, out, add); // government services, expenses, journals, Art. 72 answer dates (GovServices.gs)
  lcMyTasks_(me, ctx, out, add); // leave-cycle tasks and escalated approvals (Flows.gs)
  var dl = readAll_(SHEETS.DLG).filter(function (d) { return d.toEmpId === me.id && d.status === 'active' && String(d.fromDate).slice(0, 10) <= t && String(d.toDate).slice(0, 10) >= t; });
  if (dl.length) out.push({ kind: 'delegated', count: dl.length, target: { tab: 'hr', sec: 'inbox' }, names: dl.map(function (d) { return ctx.emps[d.fromEmpId] ? ctx.emps[d.fromEmpId].name : ''; }) });
  return { ok: true, tasks: out, total: out.filter(function (x) { return x.kind !== 'delegated'; }).reduce(function (s, x) { return s + x.count; }, 0) };
}
