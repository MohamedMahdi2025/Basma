/**
 * Payroll (Phase 3): the monthly run from package + attendance + leave, two people to approve,
 * payslips in "ملفي", WPS / bank rows, end of service, and payslip email through Microsoft 365.
 * Plan: docs/superpowers/plans/2026-09-30-hr-phase3-payroll.md
 */

// GOSI employee / employer % by cohort and month (Social Insurance Law; new law for first-time contributors from Jul 2024)
var GOSI_NEW = [['2024-07', 9.75, 11.75], ['2025-07', 10.25, 12.25], ['2026-07', 10.75, 12.75], ['2027-07', 11.25, 13.25], ['2028-07', 11.75, 13.75]];
var GOSI_LEGACY = [9.75, 11.75], GOSI_NON_SAUDI_ER = 2, GOSI_MIN = 1500, GOSI_MAX = 45000;
// GCC states other than KSA (ISO 2 and 3 letter codes): covered by the GCC extension, see calcSlip_
var GOSI_GCC = { KW: 1, KWT: 1, BH: 1, BHR: 1, QA: 1, QAT: 1, AE: 1, ARE: 1, OM: 1, OMN: 1 };
var ADJ_CODES = { bonus: 'earning', commission: 'earning', other_earning: 'earning', overtime_hours: 'hours', fine: 'deduction', other_deduction: 'deduction',
  reimbursement: 'earning', per_diem: 'earning' }; // per_diem: an approved business trip (Leave.gs 'travel'), non-wage like reimbursement; an approved expense claim (Expenses.gs): paid with the salary, not wage (no GOSI, outside the Art. 93 base)
var ADJ_NON_WAGE = { reimbursement: 1, per_diem: 1 };
var ADJ_SYSTEM_ONLY = { reimbursement: 1, per_diem: 1 }; // only written by an approved claim, never typed in payroll

function gosiRates_(isSaudi, cohort, month) {
  if (!isSaudi) return { emp: 0, er: GOSI_NON_SAUDI_ER, cohort: 'non_saudi' };
  if (cohort === 'new') { var r = GOSI_NEW[0]; GOSI_NEW.forEach(function (x) { if (month >= x[0]) r = x; }); return { emp: r[1], er: r[2], cohort: 'new' }; }
  return { emp: GOSI_LEGACY[0], er: GOSI_LEGACY[1], cohort: 'legacy' };
}
function monthLast_(m) { return addDays_(addDays_(m + '-01', 32).slice(0, 8) + '01', -1); }
function canPayroll_(me) { return !!me && (me.role === 'hr' || hasRole_(me, 'payroll')); }
function canApprovePayroll_(me) { return hasRole_(me, 'payroll'); }
function r2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }

/** The approved package in force on `date`, from rows already read. */
function compOn_(empId, date, compRows) {
  var best = null;
  compRows.forEach(function (c) {
    if (c.empId !== empId || c.status !== 'approved' || String(c.effectiveFrom) > date) return;
    if (better_(c, best)) best = c;
  });
  return best ? compView_(best) : null;
}

/** Everything a run needs, read once. */
function payrollCtx_(month) {
  var first = month + '-01', last = monthLast_(month), s = settings_();
  var byEmpDay = {};
  readAll_(SHEETS.PUNCH).forEach(function (p) {
    if (!isCounted_(p) || String(p.date) < first || String(p.date) > last) return;
    var k = p.empId + '|' + p.date; (byEmpDay[k] = byEmpDay[k] || []).push(p);
  });
  var priv = {}; readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  var advDone = {}; // repaid so far per advance, from locked payslips
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (sl.status !== 'locked') return;
    lines_(sl).forEach(function (l) { if (l.code === 'advance' && l.ref) advDone[l.ref] = (advDone[l.ref] || 0) + l.amount; });
  });
  return { month: month, first: first, last: last, s: s, now: new Date(), today: today_(), comps: readAll_(SHEETS.COMP), reqs: readAll_(SHEETS.REQ),
    adjs: readAll_(SHEETS.ADJ).filter(function (a) { return a.month === month && a.status !== 'deleted'; }), off: offIndex_(first, last),
    byEmpDay: byEmpDay, priv: priv, advDone: advDone };
}
function lines_(sl) { try { return JSON.parse(sl.linesJson || '[]') || []; } catch (e) { return []; } }

/** One employee's payslip for the month, or null when not employed in it. Every amount is a line with its reason. */
function calcSlip_(emp, x) {
  var hire = String(emp.hireDate || '').slice(0, 10) || joinedDate_(emp), lwd = String(emp.lastWorkingDay || '').slice(0, 10);
  var from = maxDate_(x.first, hire), to = lwd ? minDate_(x.last, lwd) : x.last;
  if (from > to) return null;
  var out = { lines: [], warnings: [], info: {} }, add = function (l) { l.amount = r2_(l.amount); if (l.amount) out.lines.push(l); };
  var comp = compOn_(emp.id, to, x.comps);
  var p = x.priv[emp.id] || {};
  out.info = { from: from, to: to, iban: p.iban || '', bankName: p.bankName || '', nationalId: p.nationalId ? String(p.nationalId) : '' };
  if (!p.iban) out.warnings.push('no_iban');
  if (!comp) { out.warnings.push('no_package'); return finish_(out); }
  var full = from === x.first && to === x.last, paidDays = full ? 30 : Math.min(30, daysBetween_(from, to) + 1);
  var monthly = comp.total, daily = monthly / 30, hours = Number(emp.dailyHours) || 8;
  out.info.paidDays = paidDays; out.info.monthly = monthly; out.info.package = { basic: comp.basic, housing: comp.housing, transport: comp.transport, other: comp.other };
  var f = paidDays / 30;
  add({ kind: 'earning', code: 'basic', amount: comp.basic * f });
  add({ kind: 'earning', code: 'housing', amount: comp.housing * f });
  add({ kind: 'earning', code: 'transport', amount: comp.transport * f });
  Object.keys(comp.other || {}).forEach(function (k) { add({ kind: 'earning', code: 'allowance', label: k, amount: comp.other[k] * f }); });

  // leave that is not (fully) paid
  var unpaid = 0, sick75 = 0, sickNone = 0;
  x.reqs.forEach(function (r) {
    if (r.empId !== emp.id || r.type !== 'leave' || r.status !== 'approved') return;
    var a = maxDate_(String(r.fromDate).slice(0, 10), from), b = minDate_(String(r.toDate).slice(0, 10), to);
    if (a > b) return;
    if (r.subtype === 'unpaid') { unpaid += daysBetween_(a, b) + 1; return; }
    if (r.subtype !== 'sick') return;
    var fx = {}; try { fx = JSON.parse(r.effectJson || '{}') || {}; } catch (e) {}
    var t = fx.sick || { full: Number(r.days) || 0, p75: 0, unpaid: 0 };
    for (var d = String(r.fromDate).slice(0, 10), i = 0; d <= String(r.toDate).slice(0, 10) && i < 200; d = addDays_(d, 1), i++) {
      if (d < a || d > b) continue;
      if (i >= t.full && i < t.full + t.p75) sick75++;
      else if (i >= t.full + t.p75) sickNone++;
    }
  });
  if (unpaid) add({ kind: 'deduction', code: 'unpaid_leave', days: unpaid, amount: Math.min(unpaid, paidDays) * daily, cap: false });
  if (sick75) add({ kind: 'deduction', code: 'sick_75', days: sick75, amount: sick75 * daily * 0.25, cap: false });
  if (sickNone) add({ kind: 'deduction', code: 'sick_unpaid', days: sickNone, amount: sickNone * daily, cap: false });

  // attendance: absence, minutes late, overtime (only days this system has seen)
  var absent = 0, lateMin = 0, otMin = 0, seenFrom = maxDate_(from, joinedDate_(emp));
  for (var day = seenFrom, j = 0; day <= to && j < 40; day = addDays_(day, 1), j++) {
    if (day >= x.today) break;
    var ps = (x.byEmpDay[emp.id + '|' + day] || []).sort(function (m, n) { return m.ts < n.ts ? -1 : 1; });
    var sum = summarizeDay_(emp, day, ps, x.s, x.now, x.off(emp.id, day));
    if (sum.status === 'absent') absent++;
    lateMin += sum.lateMin || 0; otMin += sum.overtimeMin || 0;
  }
  out.info.absentDays = absent; out.info.lateMin = lateMin;
  if (absent && x.s.deductAbsence) add({ kind: 'deduction', code: 'absence', days: absent, amount: absent * daily, cap: false });
  if (lateMin && x.s.deductLateMinutes) add({ kind: 'deduction', code: 'late', minutes: lateMin, amount: lateMin * daily / (hours * 60), cap: false });
  var otHours = x.s.payOvertimeFromAttendance ? otMin / 60 : 0;
  x.adjs.forEach(function (a) { if (a.empId === emp.id && a.code === 'overtime_hours') otHours += Number(a.amount) || 0; });
  if (otHours > 0) {
    var hourly = monthly / 30 / hours, basicHourly = comp.basic / 30 / hours; // Art. 107: hourly wage plus 50% of the basic hourly wage
    add({ kind: 'earning', code: 'overtime', hours: r2_(otHours), amount: otHours * (hourly + basicHourly * 0.5) });
  }
  out.info.overtimeHours = r2_(otHours);

  // HR / payroll adjustments
  var fines = 0;
  x.adjs.forEach(function (a) {
    if (a.empId !== emp.id || a.code === 'overtime_hours') return;
    var k = ADJ_CODES[a.code];
    if (k === 'earning' && ADJ_NON_WAGE[a.code]) add({ kind: 'earning', code: a.code, ref: a.ref, label: a.reason, amount: Number(a.amount), nonWage: true });
    else if (k === 'earning') add({ kind: 'earning', code: a.code, ref: a.ref, label: a.reason, amount: Number(a.amount) });
    else if (a.code === 'fine') fines += Number(a.amount) || 0;
    else if (k === 'deduction') add({ kind: 'deduction', code: a.code, ref: a.ref, label: a.reason, amount: Number(a.amount), cap: true });
  });
  if (fines) { // Art. 70: fines at most five days' wage in a month
    var maxFine = daily * 5;
    if (fines > maxFine) { out.warnings.push('fine_capped'); fines = maxFine; }
    add({ kind: 'deduction', code: 'fine', amount: fines, cap: true });
  }

  // GOSI, employee share deducted; employer share shown
  var saudi = bool_(emp.isSaudi), rates = gosiRates_(saudi, p.gosiCohort, x.month);
  if (saudi && !p.gosiCohort) out.warnings.push('gosi_cohort_missing');
  // contributions follow the wage registered with GOSI; when HR recorded one that differs from basic + housing, say so
  var pkgWage = comp.basic + comp.housing, regWage = Number(p.gosiWage) || 0, gWage = regWage || pkgWage;
  if (regWage && Math.abs(regWage - pkgWage) > 1) out.warnings.push('gosi_wage_differs');
  var base = Math.min(GOSI_MAX, Math.max(saudi ? GOSI_MIN : 0, gWage)) * f;
  out.info.gosi = { base: r2_(base), empRate: rates.emp, erRate: rates.er, cohort: rates.cohort, registered: regWage || null, packageWage: r2_(pkgWage) };
  // Social Insurance Law: housing given in kind counts at two months' basic wage a year (basic x 2/12). The package has no
  // in-kind flag, so with no cash housing and no registered wage the slip shows that figure for HR to register with GOSI.
  if (!(Number(comp.housing) > 0) && !regWage) { out.warnings.push('gosi_housing_zero'); out.info.gosi.inKindWage = r2_(comp.basic * 14 / 12); }
  // GCC nationals: GOSI collects under the GCC extension of insurance protection at the home country's rates, not the
  // 2% expatriate hazards rate. Those rates differ by country, so HR records the registered rates; the slip warns.
  if (!saudi && GOSI_GCC[String(emp.nationality || '').trim().toUpperCase()]) out.warnings.push('gosi_gcc_national');
  if (rates.emp) add({ kind: 'deduction', code: 'gosi', rate: rates.emp, amount: base * rates.emp / 100, cap: true, statutory: true });
  out.gosiEmployer = r2_(base * rates.er / 100);

  // end of service the company sets aside this month (Art. 84): half a month's wage a year for the first five years,
  // a full month after; the wage follows the eosWageBasis setting. A provision, never paid on the slip.
  var eosWage = monthly; // Art. 2 + 84: the actual wage, whatever eosWageBasis says (the setting no longer lowers the provision)
  var years = hire ? Math.max(0, (Date.parse(to) - Date.parse(hire)) / (365.25 * 864e5)) : 0;
  out.eosAccrual = r2_((years >= 5 ? eosWage / 12 : eosWage / 24) * f);
  out.info.eos = { wage: r2_(eosWage), years: Math.round(years * 100) / 100, perYear: years >= 5 ? 1 : 0.5 };

  // salary advances: an instalment each month from the start month until repaid
  x.reqs.forEach(function (r) {
    if (r.empId !== emp.id || r.type !== 'advance' || r.status !== 'approved') return;
    var pl = parsePayload_(r), left = r2_(Number(r.amount) - (x.advDone[r.ref] || 0));
    if (!pl.startMonth || x.month < pl.startMonth || left <= 0) return;
    add({ kind: 'deduction', code: 'advance', ref: r.ref, amount: Math.min(Number(pl.installment) || left, left), cap: true, deferrable: true });
  });
  // employee loans (Loans.gs): an instalment each month from the start month until repaid, deferred like advances
  if (typeof loanSlipLines_ === 'function') loanSlipLines_(emp, x, add);

  // Art. 92-93: deductions at most half the wage due; advances wait first, then other deductions, then fines
  var due = sumOf_(out.lines, 'earning') - out.lines.filter(function (l) { return (l.kind === 'deduction' && l.cap === false) || (l.kind === 'earning' && l.nonWage); }).reduce(function (t, l) { return t + l.amount; }, 0);
  var capped = function () { return out.lines.filter(function (l) { return l.cap; }).reduce(function (t, l) { return t + l.amount; }, 0); };
  var limit = Math.max(0, due) * 0.5;
  ['advance', 'loan', 'other_deduction', 'fine'].forEach(function (code) {
    out.lines.filter(function (l) { return l.code === code; }).forEach(function (l) {
      var over = capped() - limit;
      if (over <= 0.004) return;
      var cut = Math.min(l.amount, over);
      l.amount = r2_(l.amount - cut); l.reduced = r2_(cut);
      out.warnings.push(code === 'advance' || code === 'loan' ? 'advance_deferred' : 'deductions_capped');
    });
  });
  out.lines = out.lines.filter(function (l) { return l.amount > 0; });
  out.info.leaveBalance = annualBalance_(emp, x.last, x.reqs.filter(function (r) { return r.empId === emp.id; }), null).available;
  return finish_(out);
}
function sumOf_(lines, kind) { return lines.filter(function (l) { return l.kind === kind; }).reduce(function (t, l) { return t + l.amount; }, 0); }
function finish_(out) {
  out.gross = r2_(sumOf_(out.lines, 'earning'));
  out.deductions = r2_(sumOf_(out.lines, 'deduction'));
  out.net = r2_(out.gross - out.deductions);
  if (out.net < 0) { out.warnings.push('net_negative'); }
  out.gosiEmployee = r2_(out.lines.filter(function (l) { return l.code === 'gosi'; }).reduce(function (t, l) { return t + l.amount; }, 0));
  out.gosiEmployer = out.gosiEmployer || 0;
  out.eosAccrual = out.eosAccrual || 0;
  // what the month costs the company: everything earned, plus employer GOSI, plus the end-of-service provision
  out.companyCost = r2_(out.gross + out.gosiEmployer + out.eosAccrual);
  return out;
}

/** Employees paid in a month: active, or leaving during it. scope 'demo': the demo people only; else never them (Demo.gs). */
function payrollEmps_(month, scope) {
  var first = month + '-01', demo = demoEmpIds_(), wantDemo = scope === 'demo';
  return readAll_(SHEETS.EMP).filter(function (e) {
    if (!!demo[e.id] !== wantDemo) return false;
    var lwd = String(e.lastWorkingDay || '').slice(0, 10);
    if (fsPaidMonth_(e.id, month)) return false; // the month's days are paid in the final settlement (its own last day)
    return e.status === 'active' || (lwd && lwd >= first);
  });
}

function slipRow_(emp, run, calc, existing) {
  var now = new Date().toISOString(), row = existing || { id: newId_('S'), ref: '', runId: run.id, month: run.month, empId: emp.id, createdAt: now, emailedAt: '' };
  row.status = run.status === 'locked' ? 'locked' : 'draft';
  row.linesJson = JSON.stringify(calc.lines); row.gross = calc.gross; row.deductions = calc.deductions; row.net = calc.net;
  row.gosiEmployee = calc.gosiEmployee; row.gosiEmployer = calc.gosiEmployer; row.paidDays = calc.info.paidDays || 0;
  row.eosAccrual = calc.eosAccrual || 0; row.companyCost = calc.companyCost || 0;
  row.absentDays = calc.info.absentDays || 0; row.infoJson = JSON.stringify({ info: calc.info, warnings: calc.warnings }); row.updatedAt = now;
  return row;
}
function totals_(rows) {
  var t = { headcount: 0, gross: 0, deductions: 0, net: 0, gosiEmployee: 0, gosiEmployer: 0, eosAccrual: 0, companyCost: 0, warnings: 0 };
  rows.forEach(function (r) {
    if (r.status === 'void') return;
    t.headcount++; t.gross += Number(r.gross) || 0; t.deductions += Number(r.deductions) || 0; t.net += Number(r.net) || 0;
    t.gosiEmployee += Number(r.gosiEmployee) || 0; t.gosiEmployer += Number(r.gosiEmployer) || 0;
    t.eosAccrual += Number(r.eosAccrual) || 0; t.companyCost += Number(r.companyCost) || (Number(r.gross) || 0) + (Number(r.gosiEmployer) || 0);
    try { t.warnings += (JSON.parse(r.infoJson || '{}').warnings || []).length; } catch (e) {}
  });
  Object.keys(t).forEach(function (k) { t[k] = r2_(t[k]); });
  return t;
}

// ---------------- the run ----------------

function api_payrollCreate(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var month = String(req.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) fail_('bad_date');
  if (month > today_().slice(0, 7)) fail_('future_month');
  return withLock_(function () {
    if (readAll_(SHEETS.RUN).some(function (r) { return r.month === month && r.status !== 'cancelled' && !isDemoRun_(r); })) fail_('run_exists'); // a demo run never blocks
    var now = new Date().toISOString(), x = payrollCtx_(month);
    var run = { id: newId_('P'), ref: nextRef_('payroll', refsOf_(SHEETS.RUN)), month: month, status: 'draft', preparedBy: me.id, preparedAt: now,
      approvedBy: '', approvedAt: '', totalsJson: '', note: str_(req.note, 300), emailedAt: '', createdAt: now, updatedAt: now, scope: '' };
    var rows = [];
    payrollEmps_(month, '').forEach(function (e) { var c = calcSlip_(e, x); if (c) rows.push(slipRow_(e, run, c, null)); });
    var refs = nextRefs_('payslip', rows.length, refsOf_(SHEETS.SLIP));
    rows.forEach(function (r, i) { r.ref = refs[i]; });
    run.totalsJson = JSON.stringify(totals_(rows));
    append_(SHEETS.RUN, run);
    appendMany_(SHEETS.SLIP, rows);
    audit_(me.id, 'payroll_create', run.id, { ref: run.ref, month: month, headcount: rows.length });
    return { ok: true, run: publicRun_(run) };
  });
}

/** Recalculate a draft after corrections (package, leave, attendance, adjustments). The recalculator becomes the preparer. */
function api_payrollRecalc(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'draft') fail_('not_found');
    var x = payrollCtx_(run.month), existing = {}, now = new Date().toISOString();
    readAll_(SHEETS.SLIP).forEach(function (s) { if (s.runId === run.id) existing[s.empId] = s; });
    var upd = [], add = [], seen = {};
    payrollEmps_(run.month, runScope_(run)).forEach(function (e) {
      var c = calcSlip_(e, x); if (!c) return;
      seen[e.id] = 1;
      if (existing[e.id]) upd.push(slipRow_(e, run, c, existing[e.id])); else add.push(slipRow_(e, run, c, null));
    });
    Object.keys(existing).forEach(function (k) { if (!seen[k] && existing[k].status !== 'void') { existing[k].status = 'void'; existing[k].updatedAt = now; upd.push(existing[k]); } });
    var refs = nextRefs_('payslip', add.length, refsOf_(SHEETS.SLIP));
    add.forEach(function (r, i) { r.ref = refs[i]; });
    updateMany_(SHEETS.SLIP, upd);
    appendMany_(SHEETS.SLIP, add);
    run.preparedBy = me.id; run.preparedAt = now; run.updatedAt = now;
    run.totalsJson = JSON.stringify(totals_(upd.concat(add)));
    update_(SHEETS.RUN, run);
    audit_(me.id, 'payroll_recalc', run.id, { ref: run.ref });
    return { ok: true, run: publicRun_(run) };
  });
}

/** Second person: a payroll holder who did not prepare or last recalculate it. Locks the run and publishes payslips. */
function api_payrollApprove(req, me) {
  if (!canApprovePayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'draft') fail_('not_found');
    if (run.preparedBy === me.id) fail_('second_approver_required');
    if (reconBlocks_(run.month)) fail_('recon_open'); // an open GOSI / Qiwa wage mismatch for this month
    var now = new Date().toISOString();
    var slips = readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status === 'draft'; });
    if (!isDemoRun_(run) && tsMissing_(run.month, slips.map(function (s) { return s.empId; }))) fail_('timesheets_open'); // setting timesheetRequired (Attendance.gs)
    slips.forEach(function (s) { s.status = 'locked'; s.updatedAt = now; });
    updateMany_(SHEETS.SLIP, slips);
    run.status = 'locked'; run.approvedBy = me.id; run.approvedAt = now; run.updatedAt = now;
    update_(SHEETS.RUN, run);
    audit_(me.id, 'payroll_approve', run.id, { ref: run.ref, month: run.month, net: totals_(slips).net });
    return { ok: true, run: publicRun_(run) };
  });
}

function api_payrollDelete(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'draft') fail_('not_found');
    var slips = readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status !== 'void'; });
    slips.forEach(function (s) { s.status = 'void'; });
    updateMany_(SHEETS.SLIP, slips);
    run.status = 'cancelled'; run.updatedAt = new Date().toISOString();
    update_(SHEETS.RUN, run);
    audit_(me.id, 'payroll_delete', run.id, { ref: run.ref });
    return { ok: true };
  });
}

function publicRun_(r) {
  var t = {}; try { t = JSON.parse(r.totalsJson || '{}'); } catch (e) {}
  return { id: r.id, ref: r.ref, month: r.month, status: r.status, preparedBy: r.preparedBy, preparedAt: r.preparedAt, approvedBy: r.approvedBy,
    approvedAt: r.approvedAt, totals: t, note: r.note, emailedAt: r.emailedAt, scope: runScope_(r) };
}
function publicSlip_(s, emps) {
  var info = {}; try { info = JSON.parse(s.infoJson || '{}'); } catch (e) {}
  var e = emps && emps[s.empId];
  return { id: s.id, ref: s.ref, runId: s.runId, month: s.month, empId: s.empId, status: s.status, lines: lines_(s), gross: Number(s.gross), deductions: Number(s.deductions),
    net: Number(s.net), gosiEmployee: Number(s.gosiEmployee), gosiEmployer: Number(s.gosiEmployer), paidDays: Number(s.paidDays), absentDays: Number(s.absentDays),
    eosAccrual: Number(s.eosAccrual) || 0, companyCost: Number(s.companyCost) || r2_(Number(s.gross) + Number(s.gosiEmployer)),
    info: info.info || {}, warnings: info.warnings || [], emailedAt: s.emailedAt,
    emp: e ? { id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, title: e.title, department: e.department, email: e.email, departmentId: e.departmentId } : null };
}

function api_payrollList(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var emps = {}; readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e.name; });
  var rows = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; })
    .sort(function (a, b) { return a.month < b.month ? 1 : -1; })
    .map(function (r) { var o = publicRun_(r); o.preparedByName = emps[r.preparedBy] || ''; o.approvedByName = emps[r.approvedBy] || ''; return o; });
  return { ok: true, rows: rows, canApprove: canApprovePayroll_(me), me: me.id };
}

function api_payrollGet(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var run = findBy_(SHEETS.RUN, 'id', req.id);
  if (!run) fail_('not_found');
  var emps = {}; readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  var slips = readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status !== 'void'; }).map(function (s) { return publicSlip_(s, emps); })
    .sort(function (a, b) { return String(a.emp && a.emp.name).localeCompare(String(b.emp && b.emp.name)); });
  var adjs = readAll_(SHEETS.ADJ).filter(function (a) { return a.month === run.month && a.status !== 'deleted'; }).map(function (a) {
    return { id: a.id, ref: a.ref, empId: a.empId, empName: emps[a.empId] ? emps[a.empId].name : '', kind: a.kind, code: a.code, amount: Number(a.amount), reason: a.reason, enteredBy: emps[a.enteredBy] ? emps[a.enteredBy].name : '' };
  });
  audit_(me.id, 'salary_view', run.id, { payroll: run.ref });
  var o = publicRun_(run);
  o.preparedByName = emps[run.preparedBy] ? emps[run.preparedBy].name : ''; o.approvedByName = emps[run.approvedBy] ? emps[run.approvedBy].name : '';
  return { ok: true, run: o, slips: slips, adjustments: adjs, canApprove: canApprovePayroll_(me) && run.preparedBy !== me.id && run.status === 'draft' };
}

// ---------------- adjustments (one month, one line each) ----------------

/** A locked run of the person's own scope (demo people: a demo run; everyone else: a real run) closes the month for them. */
function monthLocked_(empId, month) {
  var runs = readAll_(SHEETS.RUN).filter(function (r) { return r.month === month && r.status === 'locked'; });
  if (!runs.length) return false;
  var sc = demoEmpIds_()[empId] ? 'demo' : '';
  return runs.some(function (r) { return runScope_(r) === sc; });
}
function api_payrollAdjSave(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var d = req.adj || {}, month = String(d.month || ''), code = String(d.code || ''), amount = num_(d.amount);
  if (!/^\d{4}-\d{2}$/.test(month)) fail_('bad_date');
  if (!ADJ_CODES[code] || ADJ_SYSTEM_ONLY[code]) fail_('bad_value');
  if (!(amount > 0) || (code === 'overtime_hours' && amount > 200)) fail_('bad_amount');
  if (!str_(d.reason, 200)) fail_('note_required');
  if (d.empId === me.id) fail_('cannot_change_own_salary');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', d.empId);
    if (!emp) fail_('not_found');
    if (monthLocked_(emp.id, month)) fail_('month_locked');
    var row = { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: emp.id, month: month, kind: ADJ_CODES[code], code: code,
      amount: amount, reason: str_(d.reason, 200), enteredBy: me.id, status: 'active', createdAt: new Date().toISOString() };
    append_(SHEETS.ADJ, row);
    audit_(me.id, 'payroll_adjustment', emp.id, { ref: row.ref, code: code, amount: amount, month: month });
    return { ok: true, adj: { id: row.id, ref: row.ref } };
  });
}
function api_payrollAdjDelete(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var a = findBy_(SHEETS.ADJ, 'id', req.id);
    if (!a || a.status === 'deleted') fail_('not_found');
    if (ADJ_SYSTEM_ONLY[a.code]) fail_('forbidden'); // withdrawn by cancelling its expense claim
    if (a.empId === me.id) fail_('cannot_change_own_salary');
    if (monthLocked_(a.empId, a.month)) fail_('month_locked');
    a.status = 'deleted';
    update_(SHEETS.ADJ, a);
    audit_(me.id, 'payroll_adjustment_delete', a.empId, { ref: a.ref });
    return { ok: true };
  });
}

// ---------------- what the employee sees ----------------

function api_mySlips(req, me) {
  var emps = {}; emps[me.id] = me;
  var rows = readAll_(SHEETS.SLIP).filter(function (s) { return s.empId === me.id && s.status === 'locked'; })
    .sort(function (a, b) { return a.month < b.month ? 1 : -1; }).map(function (s) { return publicSlip_(s, emps); });
  return { ok: true, rows: rows };
}

// ---------------- WPS / bank file and accounting summary ----------------

function api_payrollExport(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var run = findBy_(SHEETS.RUN, 'id', req.id);
  if (!run || run.status === 'cancelled') fail_('not_found');
  var emps = {}, depts = {}, priv = {};
  readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
  readAll_(SHEETS.DEPT).forEach(function (d) { depts[d.id] = d; });
  readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  var byDept = {}, rows = [];
  readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status !== 'void'; }).forEach(function (s) {
    var e = emps[s.empId] || {}, p = priv[s.empId] || {}, ls = lines_(s), sum = function (codes) { return r2_(ls.filter(function (l) { return codes.indexOf(l.code) >= 0; }).reduce(function (t, l) { return t + l.amount; }, 0)); };
    var basic = sum(['basic']), housing = sum(['housing']), other = r2_(Number(s.gross) - basic - housing);
    rows.push({ empNo: String(e.empNo || ''), nationalId: String(p.nationalId || ''), name: p.nameEnOfficial || e.nameEn || e.name || '', nameAr: e.name || '',
      bankName: p.bankName || '', iban: p.iban || '', basic: basic, housing: housing, other: other, deductions: Number(s.deductions), net: Number(s.net),
      gosiEmployee: Number(s.gosiEmployee), gosiEmployer: Number(s.gosiEmployer), eosAccrual: Number(s.eosAccrual) || 0, companyCost: Number(s.companyCost) || 0, ref: s.ref });
    var d = depts[e.departmentId], key = d ? d.id : '';
    var g = byDept[key] = byDept[key] || { department: d ? d.nameAr : '', costCenter: d ? d.costCenter : '', headcount: 0, gross: 0, gosiEmployer: 0, gosiEmployee: 0, net: 0, deductions: 0, eosAccrual: 0, companyCost: 0 };
    g.headcount++; g.gross = r2_(g.gross + Number(s.gross)); g.gosiEmployer = r2_(g.gosiEmployer + Number(s.gosiEmployer));
    g.gosiEmployee = r2_(g.gosiEmployee + Number(s.gosiEmployee)); g.net = r2_(g.net + Number(s.net)); g.deductions = r2_(g.deductions + Number(s.deductions));
    g.eosAccrual = r2_(g.eosAccrual + (Number(s.eosAccrual) || 0)); g.companyCost = r2_(g.companyCost + (Number(s.companyCost) || 0));
  });
  audit_(me.id, 'payroll_export', run.id, { ref: run.ref, rows: rows.length });
  return { ok: true, run: publicRun_(run), rows: rows, departments: Object.keys(byDept).map(function (k) { return byDept[k]; }) };
}

// ---------------- end of service (Art. 84, 85, 87) ----------------

/** Reasons and the share of the award they carry (Labour Law Art. 80, 81, 84, 85, 87). */
var EOS_REASONS = {
  resignation: 'scale',          // Art. 85: under 2 years none, 2-5 a third, 5-10 two thirds, 10+ full
  termination: 'full',           // ended by the employer (not Art. 80)
  contract_end: 'full',          // fixed term ended
  art81: 'full',                 // the employee leaves because of the employer's breach (Art. 81)
  art87_force_majeure: 'full',   // Art. 87: force majeure beyond the employee's control
  art87_marriage: 'full',        // Art. 87: a woman leaving within 6 months of marriage
  art87_childbirth: 'full',      // Art. 87: a woman leaving within 3 months of giving birth
  art87: 'full',                 // older key, same as above
  art80: 'none'                  // dismissal under Art. 80: no award
};

/** Service counted for the award: calendar days from hire to last day, less unpaid leave beyond 20 days (Art. 116). */
function eosService_(emp, hire, last, reqs) {
  var excluded = 0;
  reqs.forEach(function (r) {
    if (r.empId !== emp.id || r.type !== 'leave' || r.subtype !== 'unpaid' || r.status !== 'approved') return;
    var a = maxDate_(String(r.fromDate).slice(0, 10), hire), b = minDate_(String(r.toDate).slice(0, 10), last);
    if (a > b) return;
    excluded += Math.max(0, daysBetween_(a, b) + 1 - 20);
  });
  var days = daysBetween_(hire, last) + 1 - excluded;
  return { days: days, excluded: excluded, years: days / 365 };
}

/** The award alone, used by the calculator and by the liability report. */
function eosAward_(years, wage, reason) {
  var first5 = Math.min(years, 5) * wage / 2, after5 = Math.max(0, years - 5) * wage, full = first5 + after5;
  var kind = EOS_REASONS[reason] || 'scale';
  var factor = kind === 'none' ? 0 : kind === 'full' ? 1 : years < 2 ? 0 : years < 5 ? 1 / 3 : years < 10 ? 2 / 3 : 1;
  return { first5: first5, after5: after5, full: full, factor: factor, award: full * factor };
}

/**
 * The final settlement on a last working day: the end-of-service award, unused annual leave (Art. 111),
 * the unpaid days of the final month, less advances still owed. Due within a week when the employer ends
 * the contract, within two weeks on resignation (Art. 88).
 */
function api_eosQuote(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var emp = req.empId ? findBy_(SHEETS.EMP, 'id', req.empId) : empByNo_(req.empNo);
  if (!emp) fail_('not_found');
  var last = isoDate_(req.lastDay) || String(emp.lastWorkingDay || '').slice(0, 10) || today_();
  var hire = String(emp.hireDate || '').slice(0, 10);
  if (!hire) fail_('missing_hire_date');
  if (last < hire) fail_('bad_date');
  var reason = EOS_REASONS[req.reason] ? req.reason : 'resignation';
  var comp = compOn_(emp.id, last, readAll_(SHEETS.COMP));
  if (!comp) fail_('no_package');
  var s = settings_(), reqs = readAll_(SHEETS.REQ).filter(function (r) { return r.empId === emp.id; });
  // Art. 84 pays on the last wage, and Art. 2 reads "wage" as the actual wage (basic plus every regular allowance).
  // A basic + housing basis would pay less than the law, which Art. 8 voids, so the settlement always uses the
  // actual wage; the eosWageBasis setting only shapes provisions, and the quote warns when it is lower.
  var eosWarn = [], wage = comp.total;
  if (s.eosWageBasis === 'basic_housing' && comp.basic + comp.housing < comp.total) eosWarn.push('eos_basis_below_actual');
  var svc = eosService_(emp, hire, last, reqs), aw = eosAward_(svc.years, wage, reason);
  var bal = annualBalance_(emp, last, reqs, null);
  var leaveDays = Math.max(0, bal.balance), leavePay = leaveDays * comp.total / 30;
  // salary for the final month's days, unless that month is already in a locked payroll
  var m = last.slice(0, 7), locked = monthLocked_(emp.id, m);
  var lastDays = locked ? 0 : Math.min(30, daysBetween_(maxDate_(m + '-01', hire), last) + 1), lastPay = lastDays * comp.total / 30;
  // advances still owed
  var done = {};
  readAll_(SHEETS.SLIP).forEach(function (sl) { if (sl.status === 'locked') lines_(sl).forEach(function (l) { if (l.code === 'advance' && l.ref) done[l.ref] = (done[l.ref] || 0) + l.amount; }); });
  var advances = 0;
  reqs.forEach(function (r) { if (r.type === 'advance' && r.status === 'approved') advances += Math.max(0, Number(r.amount) - (done[r.ref] || 0)); });
  var loans = typeof loansOwed_ === 'function' ? loansOwed_(emp.id) : 0; // employee loans still owed (Loans.gs)
  // Art. 77 (as amended 2019): a contract ended for no valid reason entitles the other party to compensation, on top of the
  // award: a fixed-term contract the wage for its remaining period, an open-ended one 15 days' wage per year of service,
  // never less than two months' wage (the contract may set a higher amount; a court decides disputes).
  //  - 'employer': the company ended it without a valid reason; the compensation is added to what the employee receives.
  //  - 'employee': the employee left without notice or a valid reason; shown as a claim the company may pursue, never
  //    deducted here (Art. 92/93 limit deductions from wages).
  var a77 = null, party = req.art77 === 'employer' || req.art77 === 'employee' ? req.art77 : '';
  if (party) {
    if (party === 'employer' && (reason === 'art80' || reason === 'resignation')) fail_('art77_reason');
    var fixed = String(emp.contractType || '') === 'fixed' && emp.contractEnd, end = fixed ? String(emp.contractEnd).slice(0, 10) : '';
    var remain = fixed && end > last ? daysBetween_(last, end) : 0;
    var computed = fixed ? remain * wage / 30 : svc.years * 15 * wage / 30, minimum = 2 * wage;
    a77 = { party: party, basis: fixed ? 'fixed_remaining' : 'open_15_days', remainingDays: remain, contractEnd: end, computed: r2_(computed), minimum: r2_(minimum), amount: r2_(Math.max(computed, minimum)) };
    if (party === 'employee') eosWarn.push('art77_claim_not_deducted');
  }
  var gross = aw.award + leavePay + lastPay + (a77 && a77.party === 'employer' ? a77.amount : 0), net = gross - advances - loans;
  var dueDays = reason === 'resignation' ? 14 : 7;
  audit_(me.id, 'salary_view', emp.id, { eos: true, lastDay: last, reason: reason });
  return { ok: true, eos: { hireDate: hire, lastDay: last, reason: reason, basis: 'total', warnings: eosWarn,
    serviceDays: svc.days, unpaidExcluded: svc.excluded, years: r2_(svc.years), wage: r2_(wage),
    first5: r2_(aw.first5), after5: r2_(aw.after5), fullAward: r2_(aw.full), factor: r2_(aw.factor), award: r2_(aw.award),
    leaveDays: r2_(leaveDays), leavePay: r2_(leavePay), lastMonthDays: lastDays, lastMonthPay: r2_(lastPay), lastMonthLocked: locked,
    advances: r2_(advances), loans: r2_(loans), art77: a77, gross: r2_(gross), net: r2_(net), total: r2_(aw.award + leavePay), dueBy: addDays_(last, dueDays), dueDays: dueDays } };
}

// ---------------- payslip email (Microsoft 365, switched on later) ----------------

/**
 * Sends each payslip of a locked run to the employee's work email through Microsoft Graph
 * (client credentials: script properties M365_TENANT, M365_CLIENT_ID, M365_CLIENT_SECRET, M365_SENDER).
 * Needs the script.external_request scope and the tenant's Mail.Send consent; until both exist it
 * answers email_not_configured. It never falls back to Gmail.
 */
function api_payrollEmail(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var cfg = mailConfig_();
  if (!cfg) fail_('email_not_configured');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id);
    if (!run || run.status !== 'locked') fail_('not_found');
    var emps = {}; readAll_(SHEETS.EMP).forEach(function (e) { emps[e.id] = e; });
    var token = graphToken_(cfg), sent = 0, skipped = [], now = new Date().toISOString(), upd = [];
    var only = (req.empIds || []).length ? req.empIds : null;
    readAll_(SHEETS.SLIP).filter(function (s) { return s.runId === run.id && s.status === 'locked' && (!only || only.indexOf(s.empId) >= 0); }).forEach(function (s) {
      var e = emps[s.empId];
      if (!e || !e.email) { skipped.push(e ? String(e.empNo) : s.empId); return; }
      var sl = publicSlip_(s, emps);
      graphSend_(cfg, token, e.email, 'قسيمة الراتب ' + run.month + ' | Payslip ' + run.month, payslipEmailHtml_(sl));
      s.emailedAt = now; upd.push(s); sent++;
    });
    updateMany_(SHEETS.SLIP, upd);
    run.emailedAt = now; update_(SHEETS.RUN, run);
    audit_(me.id, 'payroll_email', run.id, { ref: run.ref, sent: sent, skipped: skipped.length });
    return { ok: true, sent: sent, skipped: skipped };
  });
}
function mailConfig_() {
  var p = PropertiesService.getScriptProperties();
  var c = { tenant: p.getProperty('M365_TENANT'), id: p.getProperty('M365_CLIENT_ID'), secret: p.getProperty('M365_CLIENT_SECRET'), sender: p.getProperty('M365_SENDER') };
  return c.tenant && c.id && c.secret && c.sender ? c : null;
}
function graphToken_(c) {
  var r = UrlFetchApp.fetch('https://login.microsoftonline.com/' + encodeURIComponent(c.tenant) + '/oauth2/v2.0/token', { method: 'post', muteHttpExceptions: true,
    payload: { client_id: c.id, client_secret: c.secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' } });
  var j = JSON.parse(r.getContentText() || '{}');
  if (!j.access_token) fail_('email_auth_failed');
  return j.access_token;
}
function graphSend_(c, token, to, subject, html) {
  var r = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(c.sender) + '/sendMail', { method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
    payload: JSON.stringify({ message: { subject: subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }) });
  if (r.getResponseCode() >= 300) fail_('email_send_failed');
}
var PAY_LABELS_AR = { basic: 'الراتب الأساسي', housing: 'بدل السكن', transport: 'بدل النقل', allowance: 'بدل', overtime: 'عمل إضافي', bonus: 'مكافأة', commission: 'عمولة',
  other_earning: 'استحقاق آخر', reimbursement: 'تعويض مصروفات', unpaid_leave: 'إجازة بدون راتب', sick_75: 'إجازة مرضية بثلاثة أرباع الأجر', sick_unpaid: 'إجازة مرضية بدون أجر', absence: 'غياب',
  late: 'دقائق التأخير', gosi: 'التأمينات الاجتماعية (حصة الموظف)', advance: 'قسط سلفة', fine: 'جزاء', other_deduction: 'خصم آخر' };
function payslipEmailHtml_(sl) {
  var e = sl.emp || {}, m = function (n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var row = function (l) { return '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">' + (l.code === 'allowance' ? (/^بدل/.test(String(l.label || '')) ? l.label : PAY_LABELS_AR.allowance + ' ' + (l.label || '')) : (PAY_LABELS_AR[l.code] || l.code)) + (l.ref ? ' (' + l.ref + ')' : '') + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">' + m(l.amount) + '</td></tr>'; };
  return '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#17221A;max-width:560px">' +
    '<h2 style="color:#1C2A1F;margin:0 0 4px">قسيمة الراتب لشهر ' + sl.month + '</h2><p style="margin:0 0 14px;color:#4A5A4D">' + (e.name || '') + '، الرقم الوظيفي ' + (e.empNo || '') + '، المرجع ' + sl.ref + '</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th colspan="2" style="text-align:right;padding:6px 8px;background:#F2EEE4">الاستحقاقات</th></tr>' +
    sl.lines.filter(function (l) { return l.kind === 'earning'; }).map(row).join('') +
    '<tr><th colspan="2" style="text-align:right;padding:6px 8px;background:#F2EEE4">الاستقطاعات</th></tr>' + sl.lines.filter(function (l) { return l.kind === 'deduction'; }).map(row).join('') +
    '<tr><td style="padding:10px 8px;font-weight:bold">صافي الراتب</td><td style="padding:10px 8px;font-weight:bold;text-align:left">' + m(sl.net) + ' ر.س</td></tr></table>' +
    '<p style="color:#4A5A4D;font-size:12px">تجد القسيمة كاملة في التطبيق، صفحة ملفي. ' + settings_().companyNameAr + '، إدارة الموارد البشرية.</p></div>';
}


// ======================================================================= final settlement (Wave 3, 2026-10-18)
// The figures come from api_eosQuote (Art. 84/85 award, leave pay, last month's days unless locked, advances and loans owed).
// Prepared by a payroll holder or the hr role, approved by a different payroll holder (the numbers freeze), then the payout
// is recorded with the transfer reference. Approval closes the person's loans (a verified system settlement) and keeps the
// regular run of the last month from paying that month's days a second time (payrollEmps_).
function fsPublic_(x, emps) {
  var q = parseJson_(x.quoteJson, {}), e = emps[x.empId];
  return { id: x.id, ref: x.ref, emp: empCard_(e), lastDay: String(x.lastDay).slice(0, 10), reason: x.reason, status: x.status, net: Number(x.net) || 0, quote: q,
    preparedBy: emps[x.preparedBy] ? emps[x.preparedBy].name : '', approvedBy: emps[x.approvedBy] ? emps[x.approvedBy].name : '', approvedAt: x.approvedAt,
    paidOn: String(x.paidOn || '').slice(0, 10), paidRef: x.paidRef, note: x.note, createdAt: x.createdAt, preparedById: x.preparedBy };
}
function fsEmps_() { var o = {}; readAll_(SHEETS.EMP).forEach(function (e) { o[e.id] = e; }); return o; }
/** Employees whose last month is paid by an approved settlement: the regular run of that month leaves them out. */
function fsPaidMonth_(empId, month) {
  return readAll_(SHEETS.FSET).some(function (x) { return x.empId === empId && (x.status === 'approved' || x.status === 'paid') && String(x.lastDay).slice(0, 7) === month && Number(parseJson_(x.quoteJson, {}).lastMonthPay) > 0; });
}
function api_finalSettlementCreate(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  if (req.empId === me.id) fail_('cannot_change_own_salary');
  var q = api_eosQuote({ empId: req.empId, lastDay: req.lastDay, reason: req.reason, art77: req.art77 }, me).eos;
  return withLock_(function () {
    if (readAll_(SHEETS.FSET).some(function (x) { return x.empId === req.empId && x.status !== 'cancelled'; })) fail_('already_exists');
    var now = new Date().toISOString(), row = { id: newId_('Z'), ref: nextRef_('settlement', refsOf_(SHEETS.FSET)), empId: req.empId, lastDay: q.lastDay, reason: q.reason,
      quoteJson: JSON.stringify(q), net: q.net, status: 'draft', preparedBy: me.id, preparedAt: now, approvedBy: '', approvedAt: '', paidOn: '', paidRef: '', paidBy: '',
      note: str_(req.note, 300), createdAt: now, updatedAt: now };
    append_(SHEETS.FSET, row);
    audit_(me.id, 'settlement_create', row.empId, { ref: row.ref, net: row.net });
    return { ok: true, settlement: fsPublic_(row, fsEmps_()) };
  });
}
/** A different payroll holder approves (numbers freeze) or rejects (note). Approval closes the loans still owed. */
function api_finalSettlementDecide(req, me) {
  if (!canApprovePayroll_(me)) fail_('forbidden');
  var decision = req.decision === 'approve' ? 'approve' : req.decision === 'reject' ? 'reject' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var x = findBy_(SHEETS.FSET, 'id', req.id), now = new Date().toISOString();
    if (!x || x.status !== 'draft') fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    if (x.preparedBy === me.id) fail_('second_approver_required');
    if (decision === 'reject') { if (!str_(req.note, 300)) fail_('note_required'); x.status = 'cancelled'; x.note = str_(req.note, 300); }
    else {
      x.status = 'approved'; x.approvedBy = me.id; x.approvedAt = now;
      if (typeof loanRepaidMap_ === 'function') {
        var done = loanRepaidMap_();
        readAll_(SHEETS.LOAN).forEach(function (l) {
          var left = l.empId === x.empId ? loanOutstanding_(l, done) : 0;
          if (left <= 0) return;
          var s = parseJson_(l.settlementsJson, []);
          s.push({ id: newId_('S'), amount: left, on: today_(), reference: x.ref, status: 'verified', by: me.id, at: now, verifiedBy: 'system', verifiedAt: now });
          l.settlementsJson = JSON.stringify(s); l.closedOn = today_(); l.updatedAt = now; update_(SHEETS.LOAN, l);
        });
      }
    }
    x.updatedAt = now; update_(SHEETS.FSET, x);
    audit_(me.id, 'settlement_' + (decision === 'approve' ? 'approved' : 'rejected'), x.empId, { ref: x.ref });
    return { ok: true, settlement: fsPublic_(x, fsEmps_()) };
  });
}
function api_finalSettlementPaid(req, me) {
  if (!canApprovePayroll_(me)) fail_('forbidden');
  var ref = str_(req.paidRef, 60), on = isoDate_(req.paidOn) || today_();
  if (!ref) fail_('missing_fields');
  if (on > today_()) fail_('bad_date');
  return withLock_(function () {
    var x = findBy_(SHEETS.FSET, 'id', req.id);
    if (!x || x.status !== 'approved') fail_('not_found');
    if (x.empId === me.id) fail_('cannot_decide_own');
    x.status = 'paid'; x.paidOn = on; x.paidRef = ref; x.paidBy = me.id; x.updatedAt = new Date().toISOString();
    update_(SHEETS.FSET, x);
    audit_(me.id, 'settlement_paid', x.empId, { ref: x.ref, paidRef: ref });
    return { ok: true, settlement: fsPublic_(x, fsEmps_()) };
  });
}
function api_finalSettlementList(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var emps = fsEmps_();
  audit_(me.id, 'salary_view', '', { settlements: true });
  var leavers = Object.keys(emps).map(function (k) { return emps[k]; }).filter(function (e) { return e.lastWorkingDay || e.resignedOn || e.status !== 'active'; })
    .map(function (e) { return { id: e.id, empNo: String(e.empNo), name: e.name, lastDay: String(e.lastWorkingDay || '').slice(0, 10) }; });
  return { ok: true, rows: readAll_(SHEETS.FSET).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return fsPublic_(x, emps); }),
    leavers: leavers, canApprove: canApprovePayroll_(me), me: me.id };
}
function api_myFinalSettlement(req, me) {
  var x = readAll_(SHEETS.FSET).filter(function (r) { return r.empId === me.id && (r.status === 'approved' || r.status === 'paid'); })[0];
  return { ok: true, settlement: x ? fsPublic_(x, fsEmps_()) : null };
}
hrisHook_('tasks', function (me, ctx, add) {
  if (!hasRole_(me, 'payroll')) return;
  var all = readAll_(SHEETS.FSET);
  add('settlement_approve', all.filter(function (x) { return x.status === 'draft' && x.preparedBy !== me.id && x.empId !== me.id; }).length, { tab: 'hr', sec: 'settlements' });
  add('settlement_pay', all.filter(function (x) { return x.status === 'approved' && x.empId !== me.id; }).length, { tab: 'hr', sec: 'settlements' });
});


// ======================================================================= annual pay review (Wave 3, 2026-10-18)
function crSeesPay_(me) { return canProposeComp_(me); } // the hr role or payroll
function crRows_(cycleId) { return readAll_(SHEETS.CRP).filter(function (p) { return p.cycleId === cycleId; }); }
function crPublic_(c, me, ctx) {
  var rows = crRows_(c.id), money = crSeesPay_(me), comp = readAll_(SHEETS.COMP), base = 0, inc = 0, proposed = 0;
  var mine = rows.filter(function (p) { if (money) return true; var e = ctx.emps[p.empId]; return e && manages_(me, e, ctx); });
  var out = mine.map(function (p) {
    var e = ctx.emps[p.empId], v = { id: p.id, emp: empCard_(e), pct: p.pct === '' ? null : Number(p.pct), note: p.note, proposedBy: ctx.emps[p.proposedBy] ? ctx.emps[p.proposedBy].name : '', status: p.status };
    if (money) { var k = compOn_(p.empId, today_(), comp), b = k ? k.basic + (c.basis === 'basic' ? 0 : k.housing) : 0; v.base = r2_(b); v.increase = r2_(b * (Number(p.pct) || 0) / 100); base += b; inc += v.increase; }
    if (p.pct !== '') proposed++;
    return v;
  });
  var o = { id: c.id, ref: c.ref, name: c.name, effectiveFrom: String(c.effectiveFrom).slice(0, 10), basis: c.basis, status: c.status, rows: out, proposed: proposed, total: mine.length,
    canManage: crSeesPay_(me), note: c.note };
  if (money) { o.budgetPct = Number(c.budgetPct) || 0; o.base = r2_(base); o.increase = r2_(inc); o.usedPct = base ? Math.round(inc / base * 1000) / 10 : 0; }
  return o;
}
function api_compCycleSave(req, me) {
  if (!crSeesPay_(me)) fail_('forbidden');
  var d = req.cycle || {}, name = str_(d.name, 100), eff = isoDate_(d.effectiveFrom), bud = Number(d.budgetPct);
  if (!name || !eff) fail_('missing_fields');
  if (!(bud >= 0 && bud <= 50)) fail_('bad_value');
  return withLock_(function () {
    if (readAll_(SHEETS.CRC).some(function (c) { return c.status === 'open'; })) fail_('already_exists');
    var ctx = orgCtx_(), now = new Date().toISOString(), c = { id: newId_('C'), ref: nextRef_('comp_cycle', refsOf_(SHEETS.CRC)), name: name, effectiveFrom: eff, budgetPct: bud,
      basis: d.basis === 'basic' ? 'basic' : 'basic_housing', status: 'open', note: str_(d.note, 300), createdBy: me.id, createdAt: now, closedAt: '' };
    append_(SHEETS.CRC, c);
    var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && !demoEmpIds_()[e.id]; })
      .map(function (e) { return { id: newId_('Q'), cycleId: c.id, empId: e.id, pct: '', note: '', proposedBy: '', status: 'open', updatedAt: now }; });
    appendMany_(SHEETS.CRP, rows);
    audit_(me.id, 'comp_cycle_open', '', { ref: c.ref, people: rows.length });
    return { ok: true, cycle: crPublic_(c, me, ctx) };
  });
}
function api_compCycleList(req, me) {
  var ctx = orgCtx_();
  if (!crSeesPay_(me) && !managesAnyone_(me, ctx)) fail_('forbidden');
  var rows = readAll_(SHEETS.CRC).filter(function (c) { return crSeesPay_(me) || c.status === 'open'; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  if (crSeesPay_(me)) audit_(me.id, 'salary_view', '', { compCycles: rows.length });
  return { ok: true, rows: rows.map(function (c) { return crPublic_(c, me, ctx); }), canManage: crSeesPay_(me) };
}
/** A manager (for their people) or the hr role / payroll proposes an increase % while the cycle is open. */
function api_compPropose(req, me) {
  if (!crSeesPay_(me) && !managesAnyone_(me, orgCtx_())) fail_('forbidden'); // the role gate comes before any validation
  var pct = Number(req.pct);
  if (!(pct >= 0 && pct <= 50) || Math.round(pct * 10) !== pct * 10) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), p = findBy_(SHEETS.CRP, 'id', req.id);
    if (!p) fail_('not_found');
    var c = findBy_(SHEETS.CRC, 'id', p.cycleId), e = ctx.emps[p.empId];
    if (!c || c.status !== 'open') fail_('not_found');
    if (p.empId === me.id) fail_('cannot_change_own_salary');
    if (!crSeesPay_(me) && !(e && manages_(me, e, ctx))) fail_('forbidden');
    p.pct = pct; p.note = str_(req.note, 300); p.proposedBy = me.id; p.updatedAt = new Date().toISOString();
    update_(SHEETS.CRP, p);
    audit_(me.id, 'comp_cycle_propose', p.empId, { cycle: c.ref, pct: pct });
    return { ok: true };
  });
}
/** HR / payroll close the cycle: each increase above 0 becomes a pending salary proposal from the effective date. */
function api_compCycleClose(req, me) {
  if (!crSeesPay_(me)) fail_('forbidden');
  var c = findBy_(SHEETS.CRC, 'id', req.id);
  if (!c || c.status !== 'open') fail_('not_found');
  var comp = readAll_(SHEETS.COMP), made = 0, skipped = 0;
  crRows_(c.id).forEach(function (p) {
    var pct = Number(p.pct) || 0;
    if (!(pct > 0) || p.empId === me.id) { skipped++; return; }
    var k = compOn_(p.empId, today_(), comp);
    if (!k) { skipped++; return; }
    var f = 1 + pct / 100;
    api_hrCompPropose({ empId: p.empId, effectiveFrom: String(c.effectiveFrom).slice(0, 10), basic: r2_(k.basic * f), housing: r2_(c.basis === 'basic' ? k.housing : k.housing * f),
      transport: k.transport, other: k.other || {}, reason: c.ref + ' ' + c.name + ' +' + pct + '%' }, me);
    READ_MEMO_ = {}; made++;
  });
  return withLock_(function () {
    var x = findBy_(SHEETS.CRC, 'id', c.id);
    x.status = 'closed'; x.closedAt = new Date().toISOString(); update_(SHEETS.CRC, x);
    audit_(me.id, 'comp_cycle_close', '', { ref: x.ref, proposals: made });
    return { ok: true, proposals: made, skipped: skipped };
  });
}
hrisHook_('tasks', function (me, ctx, add) {
  var open = readAll_(SHEETS.CRC).filter(function (c) { return c.status === 'open'; });
  if (!open.length || crSeesPay_(me)) return;
  add('comp_review', readAll_(SHEETS.CRP).filter(function (p) { var e = ctx.emps[p.empId]; return p.cycleId === open[0].id && p.pct === '' && e && manages_(me, e, ctx); }).length, { tab: 'hr', sec: 'payreview' });
});

// ---------------- daily e-mail digest (2026-10-20; switched on by the owner) ----------------
/**
 * Once a day after `notifyHour` (Riyadh), everyone with an e-mail and something waiting in their bell gets one short
 * e-mail through Microsoft 365 (the same Graph sender as payslips): how many items wait and a link to the app. Nothing
 * else (no names, amounts or details) leaves the system. Runs only when ALL of these hold:
 *   setting notifyDigest = true; script properties M365_TENANT/CLIENT_ID/CLIENT_SECRET/SENDER; the
 *   script.external_request scope in appsscript.json, authorised once by the owner in the editor.
 * There is no trigger scope either, so it runs lazily: the first writing request after the hour sends up to 10 e-mails,
 * the next requests continue, one row per person per day in tab notifyLog (never two e-mails a day).
 */
var NOTIFY_BATCH_ = 5;
function notifySweep_() {
  try {
    var s = settings_();
    if (!(s.notifyDigest === true || String(s.notifyDigest) === 'true')) return;
    var now = localParts_(new Date()), hour = Number(String(now.time || '00:00').slice(0, 2));
    if (hour < (Number(s.notifyHour) || 7)) return;
    var c = CacheService.getScriptCache(), doneKey = 'notify:done:' + now.date;
    if (c.get(doneKey)) return;
    var cfg = mailConfig_(); if (!cfg) return;
    if (!rateLimit_('notify:run', 1, 20)) return; // one sweep at a time
    var sent = {}; readAll_(SHEETS.NLOG).forEach(function (x) { if (String(x.date).slice(0, 10) === now.date) sent[x.empId] = 1; });
    var ctx = orgCtx_(), todo = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.email && !sent[e.id]; });
    if (!todo.length) { c.put(doneKey, '1', 21600); return; }
    var token = null, rows = [], url = s.appUrl || 'https://besgasksa.github.io/BG-attendance/';
    todo.slice(0, NOTIFY_BATCH_).forEach(function (e) {
      var n = 0;
      try { n = (api_myTasks({}, e).tasks || []).filter(function (x) { return x.kind !== 'delegated'; }).reduce(function (a, x) { return a + (x.count || 0); }, 0); } catch (err) { n = 0; }
      var row = { id: newId_('N'), empId: e.id, date: now.date, count: n, status: 'none', at: new Date().toISOString() };
      if (n) {
        try { token = token || graphToken_(cfg); graphSend_(cfg, token, e.email, 'لديك ' + n + ' بانتظارك | ' + n + ' waiting for you', notifyHtml_(e, n, url)); row.status = 'sent'; }
        catch (err) { row.status = 'failed'; }
      }
      rows.push(row);
    });
    appendMany_(SHEETS.NLOG, rows);
  } catch (e) { console.error('notify: ' + (e && e.message)); }
}
function notifyHtml_(e, n, url) {
  var esc = function (x) { return String(x || '').replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); };
  return '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;color:#17221A">' +
    '<p>مرحبا ' + esc(e.name) + '،</p><p>لديك <b>' + n + '</b> بانتظارك في نظام الحضور والموارد البشرية (طلبات أو موافقات أو مهام).</p>' +
    '<p><a href="' + esc(url) + '" style="background:#4D6D51;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">فتح التطبيق</a></p></div>' +
    '<hr style="border:0;border-top:1px solid #ddd"><div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;color:#17221A"><p>Hello ' + esc(e.nameEn || e.name) + ',</p>' +
    '<p>You have <b>' + n + '</b> item(s) waiting for you in the attendance and HR system.</p><p><a href="' + esc(url) + '">Open the app</a></p></div>';
}
/** Administrator: what is in place for e-mail, and a test message to their own address. */
function api_notifyStatus(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  var s = settings_(), cfg = mailConfig_(), today = localParts_(new Date()).date, log = readAll_(SHEETS.NLOG).filter(function (x) { return String(x.date).slice(0, 10) === today; });
  return { ok: true, enabled: s.notifyDigest === true || String(s.notifyDigest) === 'true', hour: Number(s.notifyHour) || 7, m365: !!cfg,
    today: { sent: log.filter(function (x) { return x.status === 'sent'; }).length, failed: log.filter(function (x) { return x.status === 'failed'; }).length, nothing: log.filter(function (x) { return x.status === 'none'; }).length } };
}
function api_notifyTest(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  var cfg = mailConfig_(); if (!cfg) fail_('email_not_configured');
  var emp = findBy_(SHEETS.EMP, 'id', me.id); if (!emp || !emp.email) fail_('no_email');
  if (!rateLimit_('notifytest:' + me.id, 5, 3600)) fail_('too_many_attempts');
  graphSend_(cfg, graphToken_(cfg), emp.email, 'رسالة تجربة | Test message', notifyHtml_(emp, 1, settings_().appUrl || 'https://besgasksa.github.io/BG-attendance/'));
  audit_(me.id, 'notify_test', me.id, null);
  return { ok: true, to: emp.email };
}
