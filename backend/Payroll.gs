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
  reimbursement: 'earning', per_diem: 'earning', arrears: 'earning' }; // arrears: Wave5.gs retro pay // per_diem: an approved business trip (Leave.gs 'travel'), non-wage like reimbursement; an approved expense claim (Expenses.gs): paid with the salary, not wage (no GOSI, outside the Art. 93 base)
var ADJ_NON_WAGE = { reimbursement: 1, per_diem: 1 };
var ADJ_SYSTEM_ONLY = { reimbursement: 1, per_diem: 1, arrears: 1 }; // arrears: withdrawn with retroCancel // only written by an approved claim, never typed in payroll

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
function payrollCtx_(month, gid) {
  var first = month + '-01', last = monthLast_(month), s = settings_();
  var grp = gid ? payGroups_()[gid] || null : null, win = pgWindow_(month, grp), from0 = minDate_(win.from, first);
  var byEmpDay = {};
  readAll_(SHEETS.PUNCH).forEach(function (p) {
    if (!isCounted_(p) || String(p.date) < from0 || String(p.date) > last) return;
    var k = p.empId + '|' + p.date; (byEmpDay[k] = byEmpDay[k] || []).push(p);
  });
  var priv = {}; readAll_(SHEETS.PRIV).forEach(function (p) { priv[p.empId] = p; });
  var advDone = {}; // repaid so far per advance, from locked payslips
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (sl.status !== 'locked') return;
    lines_(sl).forEach(function (l) { if (l.code === 'advance' && l.ref) advDone[l.ref] = (advDone[l.ref] || 0) + l.amount; });
  });
  return { month: month, first: first, last: last, s: s, now: new Date(), today: today_(), comps: readAll_(SHEETS.COMP), reqs: readAll_(SHEETS.REQ),
    adjs: readAll_(SHEETS.ADJ).filter(function (a) { return a.month === month && a.status !== 'deleted'; }), off: offIndex_(from0, last), win: win, group: grp, lastAtt: lastAttTo_(),
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
  // the attendance window: the calendar month, or (pay group with a cut-off) the day after last month's cut-off to this month's;
  // a leaver up to the last day; never a day already counted on an earlier locked payslip (a new cut-off, or a move between groups)
  var aw = x.win || { from: x.first, to: x.last }, attFrom = maxDate_(maxDate_(aw.from, hire), joinedDate_(emp)), attTo = lwd && lwd <= x.last ? lwd : minDate_(aw.to, to);
  if (x.lastAtt && x.lastAtt[emp.id] && x.lastAtt[emp.id] >= attFrom) attFrom = addDays_(x.lastAtt[emp.id], 1);
  out.info.attFrom = attFrom; out.info.attTo = attTo;
  var absent = 0, lateMin = 0, otMin = 0;
  for (var day = attFrom, j = 0; day <= attTo && j < 40; day = addDays_(day, 1), j++) {
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
function payrollEmps_(month, scope, gid, runId) {
  var first = month + '-01', demo = demoEmpIds_(), wantDemo = scope === 'demo';
  var groups = gid === undefined ? null : payGroups_(), other = gid === undefined ? {} : paidElsewhere_(month, scope || '', runId);
  return readAll_(SHEETS.EMP).filter(function (e) {
    if (!!demo[e.id] !== wantDemo) return false;
    var lwd = String(e.lastWorkingDay || '').slice(0, 10);
    if (fsPaidMonth_(e.id, month)) return false; // the month's days are paid in the final settlement (its own last day)
    if (groups && groupOf_(e, groups) !== gid) return false; // pay groups: this run's group only
    if (other[e.id]) return false; // one payslip per person per month
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
  var gid = String(req.payGroupId || ''), groups = payGroups_();
  if (gid && !groups[gid]) fail_('not_found');
  if (!payGroupAccess_(me, gid, groups)) fail_('forbidden');
  return withLock_(function () {
    if (readAll_(SHEETS.RUN).some(function (r) { return r.month === month && r.status !== 'cancelled' && !isDemoRun_(r) && String(r.payGroupId || '') === gid; })) fail_('run_exists'); // a demo run never blocks
    var now = new Date().toISOString(), x = payrollCtx_(month, gid);
    var run = { id: newId_('P'), ref: nextRef_('payroll', refsOf_(SHEETS.RUN)), month: month, status: 'draft', preparedBy: me.id, preparedAt: now,
      approvedBy: '', approvedAt: '', totalsJson: '', note: str_(req.note, 300), emailedAt: '', createdAt: now, updatedAt: now, scope: '', payGroupId: gid };
    var rows = [];
    payrollEmps_(month, '', gid, run.id).forEach(function (e) { var c = calcSlip_(e, x); if (c) rows.push(slipRow_(e, run, c, null)); });
    var refs = nextRefs_('payslip', rows.length, refsOf_(SHEETS.SLIP));
    rows.forEach(function (r, i) { r.ref = refs[i]; });
    run.totalsJson = JSON.stringify(totals_(rows));
    append_(SHEETS.RUN, run);
    appendMany_(SHEETS.SLIP, rows);
    audit_(me.id, 'payroll_create', run.id, { ref: run.ref, month: month, headcount: rows.length, payGroup: gid });
    return { ok: true, run: publicRun_(run) };
  });
}

/** Recalculate a draft after corrections (package, leave, attendance, adjustments). The recalculator becomes the preparer. */
function api_payrollRecalc(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
    if (!run || run.status !== 'draft') fail_('not_found');
    if (run.scope === 'import') fail_('imported_run'); // the lines are the employer's own sheet: correct it there and import again
    var x = payrollCtx_(run.month, String(run.payGroupId || '')), existing = {}, now = new Date().toISOString();
    readAll_(SHEETS.SLIP).forEach(function (s) { if (s.runId === run.id) existing[s.empId] = s; });
    var upd = [], add = [], seen = {};
    payrollEmps_(run.month, runScope_(run), isDemoRun_(run) ? undefined : String(run.payGroupId || ''), run.id).forEach(function (e) {
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
    var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
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
    var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
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
    approvedAt: r.approvedAt, totals: t, note: r.note, emailedAt: r.emailedAt, scope: runScope_(r), payGroupId: String(r.payGroupId || '') };
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
  var groups = payGroups_(), gname = {}; readAll_(SHEETS.PGRP).forEach(function (g) { gname[g.id] = g; });
  var rows = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled' && runAccess_(me, r, groups); })
    .sort(function (a, b) { return a.month < b.month ? 1 : -1; })
    .map(function (r) { var o = publicRun_(r), g = gname[o.payGroupId]; o.payGroupName = g ? g.nameAr : ''; o.payGroupNameEn = g ? g.nameEn : ''; o.preparedByName = emps[r.preparedBy] || ''; o.approvedByName = emps[r.approvedBy] || ''; return o; });
  return { ok: true, rows: rows, canApprove: canApprovePayroll_(me), me: me.id, groups: [{ id: '', nameAr: 'المجموعة العامة', nameEn: 'General group' }].concat(Object.keys(groups).filter(function (k) { return payGroupAccess_(me, k, groups); }).map(function (k) { return { id: k, nameAr: groups[k].nameAr, nameEn: groups[k].nameEn, cutoffDay: Number(groups[k].cutoffDay) || 0, payDay: Number(groups[k].payDay) || 0 }; })) };
}

function api_payrollGet(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
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
  var sc = demoEmpIds_()[empId] ? 'demo' : '', gid = groupOf_(findBy_(SHEETS.EMP, 'id', empId)), mine = {};
  runs.forEach(function (r) { if (runScope_(r) === sc) mine[r.id] = String(r.payGroupId || ''); });
  if (Object.keys(mine).some(function (k) { return mine[k] === gid; })) return true;
  return readAll_(SHEETS.SLIP).some(function (sl) { return sl.empId === empId && sl.status === 'locked' && mine[sl.runId] !== undefined; });
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
    if (!payGroupAccess_(me, groupOf_(emp))) fail_('forbidden');
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
    if (!payGroupAccess_(me, groupOf_(findBy_(SHEETS.EMP, 'id', a.empId)))) fail_('forbidden');
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
  var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
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
    var run = findBy_(SHEETS.RUN, 'id', req.id); if (run && !runAccess_(me, run)) fail_('forbidden'); // a closed pay group: its own payroll staff only
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
/** files: optional [{ name, type, bytes }] sent as attachments (scheduled reports send a CSV). */
function graphSend_(c, token, to, subject, html, files) {
  var r = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(c.sender) + '/sendMail', { method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
    payload: JSON.stringify({ message: { subject: subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }],
      attachments: (files || []).map(function (f) { return { '@odata.type': '#microsoft.graph.fileAttachment', name: f.name, contentType: f.type, contentBytes: Utilities.base64Encode(f.bytes) }; }) }, saveToSentItems: true }) });
  if (r.getResponseCode() >= 300) fail_('email_send_failed');
}
var PAY_LABELS_AR = { arrears: 'فروقات بأثر رجعي', basic: 'الراتب الأساسي', housing: 'بدل السكن', transport: 'بدل النقل', allowance: 'بدل', overtime: 'عمل إضافي', bonus: 'مكافأة', commission: 'عمولة',
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
    var mailOn = s.notifyDigest === true || String(s.notifyDigest) === 'true', waOn = s.whatsappDigest === true || String(s.whatsappDigest) === 'true';
    if (!mailOn && !waOn) return; // each channel has its own switch
    var now = localParts_(new Date()), hour = Number(String(now.time || '00:00').slice(0, 2));
    if (hour < (Number(s.notifyHour) || 7)) return;
    var c = cache_(), doneKey = 'notify:done:' + now.date;
    if (c.get(doneKey)) return;
    var cfg = mailOn ? mailConfig_() : null, wa = waOn ? waConfig_() : null; if (!cfg && !wa) return;
    if (!rateLimit_('notify:run', 1, 20)) return; // one sweep at a time
    var sent = {}; readAll_(SHEETS.NLOG).forEach(function (x) { if (String(x.date).slice(0, 10) === now.date) sent[x.empId] = 1; });
    var ctx = orgCtx_(), todo = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && ((cfg && e.email) || (wa && waPhone_(e.phone))) && !sent[e.id]; });
    if (!todo.length) { c.put(doneKey, '1', 21600); return; }
    var token = null, rows = [], url = s.appUrl || 'https://besgasksa.github.io/BG-attendance/';
    todo.slice(0, NOTIFY_BATCH_).forEach(function (e) {
      var n = 0;
      try { n = (api_myTasks({}, e).tasks || []).filter(function (x) { return x.kind !== 'delegated'; }).reduce(function (a, x) { return a + (x.count || 0); }, 0); } catch (err) { n = 0; }
      var row = { id: newId_('N'), empId: e.id, date: now.date, count: n, status: 'none', at: new Date().toISOString() };
      if (n) {
        if (cfg && e.email) { try { token = token || graphToken_(cfg); graphSend_(cfg, token, e.email, 'لديك ' + n + ' بانتظارك | ' + n + ' waiting for you', notifyHtml_(e, n, url)); row.status = 'sent'; } catch (err) { row.status = 'failed'; } }
        if (wa && waPhone_(e.phone)) { try { waSend_(wa, waPhone_(e.phone), [String(n)]); row.wa = 'sent'; if (row.status !== 'sent') row.status = 'sent'; } catch (err) { row.wa = 'failed'; if (row.status === 'none') row.status = 'failed'; } }
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


// ======================================================================= pay groups (2026-10-21)
// docs/research/2026-10-21-pay-groups-design.md. A pay group is a set of people paid together: its own monthly run,
// pay day, attendance cut-off, cost centre and WPS establishment, and optionally a closed list of the payroll staff who
// may see and run it (for example executive pay). People with no group (or in a stopped group) are in the general
// group (id ''). One run per group per month; a person is never on two payslips of the same month.
function payGroups_() { var o = {}; readAll_(SHEETS.PGRP).forEach(function (g) { if (g.status === 'active') o[g.id] = g; }); return o; }
function groupOf_(emp, groups) { var g = String(emp && emp.payGroupId || ''); return g && (groups || payGroups_())[g] ? g : ''; }
function pgManagers_(g) { return g ? parseJson_(g.managersJson, []) : []; }
/** May me see and run this group's payroll? The general group and open groups: every payroll holder (and the hr role). */
function payGroupAccess_(me, gid, groups) {
  if (!canPayroll_(me)) return false;
  var g = gid ? (groups || payGroups_())[gid] : null, m = pgManagers_(g);
  return !m.length || m.indexOf(me.id) >= 0;
}
function runAccess_(me, run, groups) { return !!run && payGroupAccess_(me, String(run.payGroupId || ''), groups); }
/** The attendance window of a month for a group: the calendar month, or (cut-off day c) the day after c last month to c. */
function pgWindow_(month, g) {
  var c = g ? Number(g.cutoffDay) || 0 : 0, first = month + '-01', last = monthLast_(month);
  if (!c) return { from: first, to: last, cutoff: 0 };
  var prev = addDays_(first, -1).slice(0, 7);
  return { from: addDays_(prev + '-' + String(c).padStart(2, '0'), 1), to: month + '-' + String(c).padStart(2, '0'), cutoff: c };
}
function publicGroup_(g, n) {
  return { id: g.id, code: g.code, nameAr: g.nameAr, nameEn: g.nameEn, payDay: Number(g.payDay) || 0, cutoffDay: Number(g.cutoffDay) || 0, costCenter: g.costCenter || '',
    wpsEstablishment: g.wpsEstablishment || '', managers: pgManagers_(g), status: g.status, members: n || 0 };
}
function api_payGroupList(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  var all = readAll_(SHEETS.PGRP).filter(function (g) { return g.status !== 'deleted'; }), act = payGroups_(), count = { '': 0 }, emps = [];
  var names = {};
  readAll_(SHEETS.EMP).forEach(function (e) {
    names[e.id] = e.name;
    if (e.status !== 'active') return;
    var gid = groupOf_(e, act); count[gid] = (count[gid] || 0) + 1;
    var open = payGroupAccess_(me, gid, act);
    emps.push({ id: e.id, empNo: String(e.empNo), name: open ? e.name : '', groupId: gid, locked: !open });
  });
  var s = settings_();
  var general = { id: '', code: '', nameAr: 'المجموعة العامة', nameEn: 'General group', payDay: Number(s.payDay) || 0, cutoffDay: 0, costCenter: '', wpsEstablishment: '', managers: [], status: 'active', members: count[''] || 0, access: true };
  return { ok: true, groups: [general].concat(all.map(function (g) {
    var o = publicGroup_(g, count[g.id]); o.access = payGroupAccess_(me, g.id, act); o.managerNames = o.managers.map(function (id) { return names[id] || ''; }); return o;
  })), emps: emps, canEdit: true,
    staff: readAll_(SHEETS.EMP).filter(function (e) { return e.status === 'active' && canPayroll_(e); }).map(function (e) { return { id: e.id, name: e.name, payroll: hasRole_(e, 'payroll') }; }) };
}
/** Create or change a group (any payroll holder or the hr role; a closed group only by its own managers). */
function api_payGroupSave(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var now = new Date().toISOString(), g = req.id ? findBy_(SHEETS.PGRP, 'id', String(req.id)) : null, act = payGroups_();
    if (req.id && (!g || g.status === 'deleted')) fail_('not_found');
    if (g && pgManagers_(g).length && pgManagers_(g).indexOf(me.id) < 0) fail_('forbidden');
    if (g && req.stop) {
      if (readAll_(SHEETS.EMP).some(function (e) { return e.status === 'active' && String(e.payGroupId || '') === g.id; })) fail_('group_not_empty');
      if (readAll_(SHEETS.RUN).some(function (r) { return r.payGroupId === g.id && r.status === 'draft'; })) fail_('run_open');
      g.status = 'stopped'; g.updatedAt = now; update_(SHEETS.PGRP, g); audit_(me.id, 'pay_group_stop', '', { code: g.code }); return { ok: true };
    }
    var d = req.group || {};
    if (!str_(d.nameAr, 80)) fail_('missing_fields');
    var payDay = Math.round(Number(d.payDay) || 0), cut = Math.round(Number(d.cutoffDay) || 0);
    if (payDay < 0 || payDay > 28 || cut < 0 || cut > 27) fail_('bad_value');
    var ctx = orgCtx_(), mg = (Array.isArray(d.managers) ? d.managers : []).map(String).filter(function (v, i, a) { return a.indexOf(v) === i; });
    mg.forEach(function (id) { var e = ctx.emps[id]; if (!e || e.status !== 'active' || !canPayroll_(e)) fail_('manager_not_payroll'); });
    // a closed group still needs four eyes: two people at least, one able to approve (payroll role), and the editor stays in
    if (mg.length && (mg.length < 2 || !mg.some(function (id) { return hasRole_(ctx.emps[id], 'payroll'); }) || mg.indexOf(me.id) < 0)) fail_('needs_two_managers');
    if (g && Number(g.cutoffDay || 0) !== cut && readAll_(SHEETS.RUN).some(function (r) { return r.payGroupId === g.id && r.status === 'draft'; })) fail_('run_open');
    var row = g || { id: newId_('G'), code: nextRef_('payGroup', refsOf_(SHEETS.PGRP)), status: 'active', createdAt: now, createdBy: me.id };
    row.nameAr = str_(d.nameAr, 80); row.nameEn = str_(d.nameEn, 80); row.payDay = payDay; row.cutoffDay = cut; row.costCenter = str_(d.costCenter, 40);
    row.wpsEstablishment = str_(d.wpsEstablishment, 40); row.managersJson = JSON.stringify(mg); row.updatedAt = now;
    if (g) update_(SHEETS.PGRP, row); else append_(SHEETS.PGRP, row);
    audit_(me.id, g ? 'pay_group_change' : 'pay_group_create', '', { code: row.code, closed: mg.length > 0, cutoff: cut });
    return { ok: true, group: publicGroup_(row, 0) };
  });
}
/** Move people into a group ('' = the general group). Needs access to both the old and the new group of each person. */
function api_payGroupAssign(req, me) {
  if (!canPayroll_(me)) fail_('forbidden');
  return withLock_(function () {
    var act = payGroups_(), to = String(req.groupId || '');
    if (to && !act[to]) fail_('not_found');
    if (!payGroupAccess_(me, to, act)) fail_('forbidden');
    var ids = (req.empIds || []).map(String).slice(0, 500), rows = [];
    ids.forEach(function (id) {
      var e = findBy_(SHEETS.EMP, 'id', id); if (!e) fail_('not_found');
      if (!payGroupAccess_(me, groupOf_(e, act), act)) fail_('forbidden');
      if (String(e.payGroupId || '') !== to) { e.payGroupId = to; e.updatedAt = new Date().toISOString(); rows.push(e); }
    });
    if (rows.length) updateMany_(SHEETS.EMP, rows);
    audit_(me.id, 'pay_group_assign', '', { group: to, people: rows.length });
    return { ok: true, moved: rows.length };
  });
}
/** People already on a (non-cancelled) payslip of this month in another run of the same scope: never paid twice. */
function paidElsewhere_(month, scope, runId) {
  var runs = {}; readAll_(SHEETS.RUN).forEach(function (r) { if (r.month === month && r.status !== 'cancelled' && r.id !== runId && runScope_(r) === scope) runs[r.id] = 1; });
  var o = {}; readAll_(SHEETS.SLIP).forEach(function (sl) { if (runs[sl.runId] && sl.status !== 'void') o[sl.empId] = 1; });
  return o;
}
/** Where each person's attendance was last counted: the attTo of their latest locked payslip (calendar month end before cut-offs). */
function lastAttTo_() {
  var o = {};
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (sl.status !== 'locked') return;
    var inf = parseJson_(sl.infoJson, {}).info || {}, to = inf.attTo || monthLast_(String(sl.month));
    if (!o[sl.empId] || to > o[sl.empId]) o[sl.empId] = to;
  });
  return o;
}


// ======================================================================= total rewards statement (2026-10-23)
// The year's value to the employee: cash pay (package x 12) plus what the company pays on their behalf (GOSI employer share,
// medical insurance premiums, the end-of-service provision, Art. 84). Paid annual leave is shown as part of pay, not added.
// Own statement for everyone; another person's only for payroll staff with access to their pay group (logged as a salary view).
function api_myTotalRewards(req, me) {
  var who = me;
  if (req.empId && req.empId !== me.id) {
    if (!canPayroll_(me)) fail_('forbidden');
    who = findBy_(SHEETS.EMP, 'id', String(req.empId)); if (!who) fail_('not_found');
    if (!payGroupAccess_(me, groupOf_(who))) fail_('forbidden');
    audit_(me.id, 'salary_view', who.id, { totalRewards: true });
  }
  var t = today_(), c = currentComp_(who.id, t);
  if (!c) return { ok: true, none: true };
  var priv = findBy_(SHEETS.PRIV, 'empId', who.id) || {}, saudi = bool_(who.isSaudi), rates = gosiRates_(saudi, priv.gosiCohort, t.slice(0, 7));
  var gWage = Number(priv.gosiWage) || (c.basic + c.housing), base = Math.min(GOSI_MAX, Math.max(saudi ? GOSI_MIN : 0, gWage));
  var hire = isoDate_(who.hireDate) || joinedDate_(who), years = hire ? Math.max(0, (Date.parse(t) - Date.parse(hire)) / (365.25 * 864e5)) : 0;
  var ins = 0, insPeople = 0;
  readAll_(SHEETS.INSM).forEach(function (m) { if (m.empId === who.id && m.status === 'active') { ins += Number(m.premium) || 0; insPeople++; } });
  var cash = [{ code: 'basic', annual: r2_(c.basic * 12) }, { code: 'housing', annual: r2_(c.housing * 12) }, { code: 'transport', annual: r2_(c.transport * 12) }];
  Object.keys(c.other || {}).forEach(function (k) { cash.push({ code: 'allowance', label: k, annual: r2_((Number(c.other[k]) || 0) * 12) }); });
  cash = cash.filter(function (l) { return l.annual; });
  var leaveDays = Number(who.annualLeaveDays) || (years >= 5 ? 30 : 21);
  var company = [{ code: 'gosi_employer', annual: r2_(base * rates.er / 100 * 12), rate: rates.er },
    { code: 'medical', annual: r2_(ins), people: insPeople },
    { code: 'eos', annual: r2_(c.total * (years >= 5 ? 1 : 0.5)), perYear: years >= 5 ? 1 : 0.5 }].filter(function (l) { return l.annual; });
  var sum = function (a) { return r2_(a.reduce(function (s, l) { return s + l.annual; }, 0)); }, cashTotal = sum(cash), companyTotal = sum(company);
  return { ok: true, asOf: t, emp: { name: who.name, empNo: String(who.empNo) }, monthly: c.total, cash: cash, company: company, cashTotal: cashTotal, companyTotal: companyTotal,
    total: r2_(cashTotal + companyTotal), leave: { days: leaveDays, value: r2_(leaveDays * c.total / 30) }, years: Math.round(years * 10) / 10 };
}


// ======================================================================= WhatsApp (2026-10-23)
// The daily digest can also go by WhatsApp (Meta WhatsApp Cloud API): an approved template with one body parameter, the
// number of items waiting. Nothing else leaves the system. Needs script properties WA_PHONE_ID, WA_TOKEN, WA_TEMPLATE
// (template name) and optionally WA_LANG (default 'ar'), plus the admin setting whatsappDigest. The token is never in code.
function waConfig_() {
  var p = PropertiesService.getScriptProperties(), c = { phoneId: p.getProperty(orgKey_('WA_PHONE_ID')) || p.getProperty('WA_PHONE_ID'), token: p.getProperty(orgKey_('WA_TOKEN')) || p.getProperty('WA_TOKEN'),
    template: p.getProperty(orgKey_('WA_TEMPLATE')) || p.getProperty('WA_TEMPLATE'), lang: p.getProperty(orgKey_('WA_LANG')) || p.getProperty('WA_LANG') || 'ar' };
  return c.phoneId && c.token && c.template ? c : null;
}
/** A Saudi mobile in international form without +: 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +966 5X... all give 9665XXXXXXXX; anything else ''. */
function waPhone_(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (/^05\d{8}$/.test(d)) d = '966' + d.slice(1); else if (/^5\d{8}$/.test(d)) d = '966' + d; else if (/^009665\d{8}$/.test(d)) d = d.slice(2);
  return /^9665\d{8}$/.test(d) ? d : '';
}
function waSend_(c, to, params) {
  var r = UrlFetchApp.fetch('https://graph.facebook.com/v21.0/' + encodeURIComponent(c.phoneId) + '/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + c.token },
    payload: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'template', template: { name: c.template, language: { code: c.lang },
      components: [{ type: 'body', parameters: params.map(function (x) { return { type: 'text', text: String(x) }; }) }] } }) });
  if (r.getResponseCode() >= 300) { console.error('whatsapp ' + r.getResponseCode() + ': ' + String(r.getContentText()).slice(0, 300)); throw new Error('whatsapp_failed'); }
  return true;
}
function api_waTest(req, me) {
  if (me.role !== 'admin') fail_('forbidden');
  var c = waConfig_(); if (!c) fail_('whatsapp_not_configured');
  var emp = findBy_(SHEETS.EMP, 'id', me.id), to = emp && waPhone_(emp.phone); if (!to) fail_('no_phone');
  if (!rateLimit_('watest:' + me.id, 5, 3600)) fail_('too_many_attempts');
  try { waSend_(c, to, ['1']); } catch (e) { fail_('whatsapp_failed'); }
  audit_(me.id, 'whatsapp_test', me.id, null);
  return { ok: true, to: to.slice(0, 5) + '•••' + to.slice(-2) };
}


// ======================================================================= platform import of a salary sheet (2026-11-03)
/**
 * Platform owner (setup key): load one organisation from its own monthly salary sheet, rows already parsed by the console.
 * - Each branch / group becomes a department with its own cost centre (CC-01, CC-02, ... in sheet order; existing ones reused).
 * - Each person becomes an employee (the number in the sheet, or the organisation's next number), marked incomplete:
 *   national ID, nationality, hire date and job title are left for HR.
 * - The package (basic, housing, transport) is approved from the month's first day: the sheet is the employer's own record.
 * - The month's payroll is a draft run with scope 'import': every line exactly as the sheet (absence, advances, fines,
 *   other deductions, bonuses, overtime), no GOSI added; a recalculation is refused so it can never drift from the sheet.
 *   A row whose net the sheet left at 0 is kept with a "withheld" line, so the run's totals equal the sheet's.
 * Approval and locking stay with the organisation's payroll people (second person rule), as for any run.
 */
function api_orgImport(req) {
  platformKeyOk_(req);
  var id = String(req.id || ''), month = String(req.month || ''), rows = Array.isArray(req.rows) ? req.rows : [];
  if (!PropertiesService.getScriptProperties().getProperty('ORG:' + id)) fail_('org_not_found');
  if (!/^\d{4}-\d{2}$/.test(month)) fail_('bad_date');
  if (!rows.length || rows.length > 2000) fail_('bad_request');
  setOrg_(orgRec_(id));
  var n = function (v) { var x = Number(v); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };
  var clean = rows.map(function (r, i) {
    var o = { line: i + 1, branch: str_(r.branch, 80) || 'الإدارة العامة', empNo: str_(r.empNo, 30), name: str_(r.name, 80), days: Math.max(0, Math.min(31, Math.round(n(r.days)))),
      basic: n(r.basic), housing: n(r.housing), transport: n(r.transport), overtime: n(r.overtime), bonus: n(r.bonus),
      absence: n(r.absence), advance: n(r.advance), fine: n(r.fine), other: n(r.other), net: r.net === '' || r.net == null ? null : n(r.net), note: str_(r.note, 200) };
    if (!o.name) fail_('missing_fields');
    if ([o.basic, o.housing, o.transport, o.overtime, o.bonus, o.absence, o.advance, o.fine, o.other].some(function (v) { return v < 0; })) fail_('bad_amount');
    return o;
  });
  return withLock_(function () {
    var now = new Date().toISOString(), first = month + '-01';
    if (readAll_(SHEETS.RUN).some(function (r) { return r.month === month && r.status !== 'cancelled' && !isDemoRun_(r) && !String(r.payGroupId || ''); })) fail_('run_exists');
    // departments = cost centres
    var depts = readAll_(SHEETS.DEPT), byName = {}, newDepts = [], cc = 0;
    depts.forEach(function (d) { byName[normName_(d.nameAr)] = d; var m = String(d.costCenter || '').match(/^CC-(\d+)$/); if (m) cc = Math.max(cc, Number(m[1])); });
    var branches = []; clean.forEach(function (r) { if (branches.indexOf(r.branch) < 0) branches.push(r.branch); });
    var codes = nextRefs_('department', branches.filter(function (b) { return !byName[normName_(b)]; }).length, codesOf_(depts)), ci = 0;
    branches.forEach(function (b) {
      if (byName[normName_(b)]) return;
      cc++; var d = { id: newId_('D'), code: codes[ci++] || '', nameAr: b, nameEn: '', parentId: '', headEmpId: '', costCenter: 'CC-' + String(cc).padStart(2, '0'), status: 'active', createdAt: now, updatedAt: now };
      byName[normName_(b)] = d; newDepts.push(d);
    });
    // employees
    var emps = readAll_(SHEETS.EMP), byNo = {}; emps.forEach(function (e) { byNo[String(e.empNo).trim()] = e; });
    var autoNos = nextEmpNos_(clean.filter(function (r) { return !r.empNo; }).length, emps), ai = 0, newEmps = [], updEmps = [], seen = {};
    clean.forEach(function (r) {
      if (r.empNo && seen[r.empNo]) fail_('duplicate_emp_no'); if (r.empNo) seen[r.empNo] = 1;
      var d = byName[normName_(r.branch)], e = r.empNo ? byNo[r.empNo] : null;
      if (e) { e.departmentId = d.id; e.department = d.nameAr; e.updatedAt = now; updEmps.push(e); }
      else {
        e = { id: newId_('E'), empNo: r.empNo || autoNos[ai++], name: r.name, nameEn: '', email: '', phone: '', department: d.nameAr, title: '', role: 'employee', status: 'active',
          zoneIds: '', shiftStart: '', shiftEnd: '', workdays: '', tokenVer: 0, actHash: '', actExp: '', actTries: 0, createdAt: now, updatedAt: now, departmentId: d.id,
          employmentType: '', hireDate: '', nationality: '' };
        newEmps.push(e); byNo[e.empNo] = e;
      }
      r.emp = e;
    });
    // approved packages from the month's first day
    var comps = [];
    clean.forEach(function (r) {
      if (!(r.basic > 0)) return;
      var c = compRowFrom_({ empId: r.emp.id, effectiveFrom: first, basic: r.basic, housing: r.housing, transport: r.transport, reason: 'استيراد من كشف رواتب ' + month }, 'platform');
      c.status = 'approved'; c.approvedBy = 'platform'; c.approvedAt = now; comps.push(c);
    });
    var salRefs = nextRefs_('salary', comps.length, refsOf_(SHEETS.COMP)); comps.forEach(function (c, i) { c.ref = salRefs[i]; });
    // the month's run, line by line as the sheet
    var run = { id: newId_('P'), ref: nextRef_('payroll', refsOf_(SHEETS.RUN)), month: month, status: 'draft', preparedBy: 'import', preparedAt: now, approvedBy: '', approvedAt: '',
      totalsJson: '', note: 'استيراد من كشف الرواتب كما هو (بدون تأمينات محسوبة)', emailedAt: '', createdAt: now, updatedAt: now, scope: 'import', payGroupId: '' };
    var slips = [], mismatch = [];
    clean.forEach(function (r) {
      var lines = [], add = function (l) { l.amount = r2_(l.amount); if (l.amount) lines.push(l); };
      add({ kind: 'earning', code: 'basic', amount: r.basic }); add({ kind: 'earning', code: 'housing', amount: r.housing }); add({ kind: 'earning', code: 'transport', amount: r.transport });
      add({ kind: 'earning', code: 'overtime', amount: r.overtime }); add({ kind: 'earning', code: 'bonus', amount: r.bonus });
      add({ kind: 'deduction', code: 'absence', days: Math.max(0, 30 - r.days) || undefined, amount: r.absence }); add({ kind: 'deduction', code: 'advance', amount: r.advance });
      add({ kind: 'deduction', code: 'fine', amount: r.fine }); add({ kind: 'deduction', code: 'other_deduction', amount: r.other });
      var calc = finish_({ lines: lines, warnings: [], info: { paidDays: r.days, imported: true, note: r.note } });
      if (r.net !== null && Math.abs(calc.net - r.net) > 0.01) {
        var due = calc.net;
        if (r.net === 0 && calc.net > 0) { add({ kind: 'deduction', code: 'other_deduction', label: 'موقوف الصرف (صافي الكشف صفر)', amount: calc.net }); calc = finish_({ lines: lines, warnings: ['withheld'], info: { paidDays: r.days, imported: true, note: r.note } }); }
        mismatch.push({ line: r.line, name: r.name, sheet: r.net, net: due });
      }
      slips.push(slipRow_(r.emp, run, calc, null));
    });
    var refs = nextRefs_('payslip', slips.length, refsOf_(SHEETS.SLIP)); slips.forEach(function (x, i) { x.ref = refs[i]; });
    run.totalsJson = JSON.stringify(totals_(slips));
    appendMany_(SHEETS.DEPT, newDepts); updateMany_(SHEETS.EMP, updEmps); appendMany_(SHEETS.EMP, newEmps);
    appendMany_(SHEETS.COMP, comps); append_(SHEETS.RUN, run); appendMany_(SHEETS.SLIP, slips);
    audit_('platform', 'org_import', run.id, { month: month, departments: newDepts.length, employees: newEmps.length, updated: updEmps.length, packages: comps.length, slips: slips.length });
    return { ok: true, orgId: id, month: month, run: run.ref, departments: newDepts.map(function (d) { return { name: d.nameAr, costCenter: d.costCenter }; }),
      created: newEmps.length, updated: updEmps.length, numbered: ai, packages: comps.length, totals: totals_(slips), mismatch: mismatch };
  });
}
