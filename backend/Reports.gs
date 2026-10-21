/**
 * Reports centre: every report is computed here with its access rules (who may run it, whose rows,
 * which columns), data-quality checks and totals. Exports are numbered (RPT-YYYY-00001) and logged with
 * a SHA-256 of the exact rows, so a printed or exported report can be verified later; a second person
 * can mark an export reviewed. Designed from the vendor research in the conversation of 2026-09-30
 * (Workday, SuccessFactors, Oracle HCM, BambooHR, HiBob, Rippling, Jisr, ZenHR, Bayzat).
 */

// Who may run a report: 'people' HR, admin, executive, managers (their team); 'money' HR and payroll (per person);
// 'cost' HR, payroll, executive (totals only); 'audit' HR and admin.
var REPORTS = {
  att_daily:        { group: 'attendance', access: 'people', params: ['range31', 'depts', 'emps', 'nationality'] },
  att_monthly:      { group: 'attendance', access: 'people', params: ['month', 'depts', 'emps', 'nationality'] },
  att_summary:      { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps', 'nationality'] },
  att_exceptions:   { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps'] },
  // analytical (2026-10-04): trends with the previous period, rankings, distributions
  att_dept_trend:   { group: 'attendance', access: 'people', params: ['range365', 'depts', 'nationality'] },
  att_punctuality:  { group: 'attendance', access: 'people', params: ['range365', 'depts', 'emps'] },
  att_late_top:     { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps'] },
  att_bradford:     { group: 'attendance', access: 'people', params: ['range365', 'depts', 'emps'] },
  att_weekday:      { group: 'attendance', access: 'people', params: ['range', 'depts'] },
  att_checkin_bands: { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps'] },
  att_missing_out:  { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps'] },
  att_flags:        { group: 'attendance', access: 'people', params: ['range', 'depts'] },
  att_overtime:     { group: 'attendance', access: 'people', params: ['range', 'depts', 'emps'], moneyCols: true },
  leave_balances:   { group: 'leave',      access: 'people', params: ['asOf', 'depts', 'emps', 'nationality'], moneyCols: true },
  leave_taken:      { group: 'leave',      access: 'people', params: ['range', 'depts', 'emps', 'leaveType'] },
  requests_log:     { group: 'leave',      access: 'people', params: ['range', 'depts', 'emps', 'reqType', 'reqStatus'] },
  leave_util_dept:  { group: 'leave',      access: 'people', params: ['range365', 'depts'] },
  leave_type_month: { group: 'leave',      access: 'people', params: ['range365', 'depts', 'leaveType'] },
  leave_upcoming:   { group: 'leave',      access: 'people', params: ['days', 'depts', 'emps'] },
  leave_sick_bradford: { group: 'leave',   access: 'people', params: ['range365', 'depts', 'emps'] },
  leave_yearend_risk: { group: 'leave',    access: 'people', params: ['asOf', 'depts', 'nationality'], moneyCols: true },
  leave_liability_trend: { group: 'leave', access: 'cost',   params: ['range365', 'depts'] },
  hr_headcount:     { group: 'people',     access: 'people', params: ['depts', 'nationality', 'status'] },
  hr_movement:      { group: 'people',     access: 'people', params: ['range365', 'depts'] },
  hr_expiry:        { group: 'people',     access: 'people', params: ['days', 'depts'] },
  hr_saudization:   { group: 'people',     access: 'cost',   params: ['depts'] },
  wf_snapshot:      { group: 'people',     access: 'people', params: ['month', 'depts'] },
  wf_joiners:       { group: 'people',     access: 'people', params: ['range365', 'depts'] },
  wf_leavers:       { group: 'people',     access: 'people', params: ['range365', 'depts'] },
  wf_turnover_dept: { group: 'people',     access: 'people', params: ['range365', 'depts'] },
  wf_tenure:        { group: 'people',     access: 'people', params: ['depts', 'nationality'] },
  wf_span:          { group: 'people',     access: 'people', params: ['depts'] },
  wf_org:           { group: 'people',     access: 'people', params: ['depts', 'status'] },
  wf_vacancies:     { group: 'people',     access: 'people', params: ['depts'] },
  wf_probation:     { group: 'people',     access: 'people', params: ['days', 'depts'] },
  pay_register:     { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_variance:     { group: 'payroll',    access: 'money',  params: ['run', 'threshold', 'depts'] },
  pay_gosi:         { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_cost:         { group: 'payroll',    access: 'cost',   params: ['run'] },
  pay_eos:          { group: 'payroll',    access: 'money',  params: ['asOf', 'depts'] },
  pay_equity:       { group: 'payroll',    access: 'money',  params: ['depts'] },
  pay_company_cost: { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_gosi_wage:    { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_var_lines:    { group: 'payroll',    access: 'money',  params: ['run', 'threshold', 'depts'] },
  pay_ytd:          { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_bands:        { group: 'payroll',    access: 'money',  params: ['depts'] },
  pay_gosi_cohort:  { group: 'payroll',    access: 'cost',   params: ['run', 'depts'] },
  pay_deductions:   { group: 'payroll',    access: 'cost',   params: ['run', 'depts'] },
  pay_ot_trend:     { group: 'payroll',    access: 'cost',   params: ['range365', 'depts'] },
  pay_cost_per_head: { group: 'payroll',   access: 'cost',   params: ['range365', 'depts'] },
  perf_results:     { group: 'performance', access: 'people', params: ['cycle', 'depts'] },
  perf_curve:       { group: 'performance', access: 'people', params: ['cycle', 'depts'] },
  perf_kpi:         { group: 'performance', access: 'people', params: ['cycle', 'depts'] },
  perf_360:         { group: 'performance', access: 'people', params: ['cycle', 'depts'] },
  perf_plans:       { group: 'performance', access: 'people', params: ['depts'] },
  req_sla:          { group: 'requests',   access: 'people', params: ['range', 'reqType'] },
  req_bottlenecks:  { group: 'requests',   access: 'people', params: ['depts', 'reqType'] },
  req_volume:       { group: 'requests',   access: 'people', params: ['range365', 'reqType', 'depts'] },
  cmp_disciplinary: { group: 'compliance', access: 'people', params: ['range365', 'depts'], moneyCols: true },
  cmp_injuries:     { group: 'compliance', access: 'people', params: ['range365', 'depts'] },
  cmp_custody:      { group: 'compliance', access: 'people', params: ['depts', 'emps'] },
  cmp_clearance:    { group: 'compliance', access: 'people', params: ['depts'] },
  // talent analytics (2026-10-20): recruitment funnel and sources (HR only: candidate data), training and insurance coverage
  rec_pipeline:     { group: 'talent',     access: 'audit',  params: ['depts'] },
  rec_sources:      { group: 'talent',     access: 'audit',  params: ['range365'] },
  trn_hours:        { group: 'talent',     access: 'people', params: ['range365', 'depts', 'emps'] },
  ins_coverage:     { group: 'talent',     access: 'people', params: ['depts', 'nationality'] },
  cmp_wps:          { group: 'compliance', access: 'cost',   params: ['range365'] },
  audit_log:        { group: 'audit',      access: 'audit',  params: ['range', 'auditAction'] }
};

function reportAllowed_(def, me, ctx) {
  if (def.access === 'audit') return isHr_(me);
  if (def.access === 'money') return me.role === 'hr' || hasRole_(me, 'payroll');
  if (def.access === 'cost') return me.role === 'hr' || hasRole_(me, 'payroll') || hasRole_(me, 'executive');
  return isHr_(me) || hasRole_(me, 'executive') || hasRole_(me, 'payroll') || managesAnyone_(me, ctx);
}
/** Whole company or only the viewer's people (row-level security). */
function reportScope_(me, ctx) {
  if (isHr_(me) || hasRole_(me, 'executive') || hasRole_(me, 'payroll')) return null;
  var ids = {};
  Object.keys(ctx.emps).forEach(function (k) { if (manages_(me, ctx.emps[k], ctx)) ids[k] = 1; });
  return ids;
}

function api_reportCatalog(req, me) {
  var ctx = orgCtx_(), out = [];
  Object.keys(REPORTS).forEach(function (id) { var d = REPORTS[id]; if (reportAllowed_(d, me, ctx)) out.push({ id: id, group: d.group, params: d.params, access: d.access }); });
  var depts = readAll_(SHEETS.DEPT).filter(function (d) { return d.status !== 'disabled'; }).map(function (d) { return { id: d.id, name: d.nameAr, parentId: d.parentId }; });
  var scope = reportScope_(me, ctx);
  var emps = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return !scope || scope[e.id]; })
    .map(function (e) { return { id: e.id, empNo: String(e.empNo), name: e.name, departmentId: e.departmentId, status: e.status }; });
  var runs = canPayroll_(me) || hasRole_(me, 'executive') ? readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }).map(function (r) { return { id: r.id, ref: r.ref, month: r.month, status: r.status, scope: runScope_(r) }; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; }) : [];
  var cycles = readAll_(SHEETS.CYC).filter(function (c) { return c.status !== 'deleted'; }).map(publicCycle_);
  return { ok: true, reports: out, depts: depts, emps: emps, runs: runs, cycles: cycles, teamOnly: !!scope };
}

// ---------------- parameters and filters ----------------

function reportParams_(def, raw) {
  var p = {}, t = today_();
  raw = raw || {};
  def.params.forEach(function (k) {
    if (k === 'range' || k === 'range31' || k === 'range365') {
      var max = k === 'range31' ? 31 : k === 'range365' ? 366 : 92;
      p.to = isoDate_(raw.to) || t; p.from = isoDate_(raw.from) || p.to.slice(0, 8) + '01';
      if (p.to > t && k !== 'range365') p.to = t;
      if (p.from > p.to) fail_('bad_range');
      if (daysBetween_(p.from, p.to) >= max) fail_('range_too_long');
    } else if (k === 'month') { p.month = /^\d{4}-\d{2}$/.test(raw.month || '') ? raw.month : t.slice(0, 7); }
    else if (k === 'asOf') { p.asOf = isoDate_(raw.asOf) || t; }
    else if (k === 'depts') { p.depts = (raw.depts || []).map(String).slice(0, 50); p.subDepts = raw.subDepts !== false; }
    else if (k === 'emps') { p.emps = (raw.emps || []).map(String).slice(0, 500); }
    else if (k === 'nationality') { p.nationality = raw.nationality === 'saudi' || raw.nationality === 'non_saudi' ? raw.nationality : ''; }
    else if (k === 'status') { p.status = raw.status === 'all' || raw.status === 'disabled' ? raw.status : 'active'; }
    else if (k === 'days') { p.days = Math.max(1, Math.min(365, Number(raw.days) || 60)); }
    else if (k === 'run') { p.run = String(raw.run || ''); }
    else if (k === 'cycle') { p.cycle = String(raw.cycle || ''); }
    else if (k === 'threshold') { p.threshold = Math.max(0, Math.min(100, Number(raw.threshold) || 5)); }
    else if (k === 'leaveType') { p.leaveType = LEAVE_TYPES[raw.leaveType] ? raw.leaveType : ''; }
    else if (k === 'reqType') { p.reqType = REQUEST_STEPS[raw.reqType] ? raw.reqType : ''; }
    else if (k === 'reqStatus') { p.reqStatus = ['pending', 'approved', 'rejected', 'cancelled'].indexOf(raw.reqStatus) >= 0 ? raw.reqStatus : ''; }
    else if (k === 'auditAction') { p.auditAction = str_(raw.auditAction, 60); }
  });
  return p;
}
function deptSet_(p, ctx) {
  if (!p.depts || !p.depts.length) return null;
  var set = {}; p.depts.forEach(function (d) { set[d] = 1; });
  if (p.subDepts) { var grew = true; while (grew) { grew = false; Object.keys(ctx.depts).forEach(function (k) { var d = ctx.depts[k]; if (d.parentId && set[d.parentId] && !set[d.id]) { set[d.id] = 1; grew = true; } }); } }
  return set;
}
/** The people a report covers after row-level scope and the viewer's filters. */
function reportEmps_(p, ctx, scope, includeInactive) {
  var ds = deptSet_(p, ctx), es = p.emps && p.emps.length ? p.emps : null;
  return Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) {
    if (scope && !scope[e.id]) return false;
    var st = p.status || 'active';
    if (!includeInactive && st === 'active' && e.status !== 'active') return false;
    if (st === 'disabled' && e.status !== 'disabled') return false;
    if (ds && !ds[e.departmentId]) return false;
    if (es && es.indexOf(e.id) < 0) return false;
    if (p.nationality === 'saudi' && !bool_(e.isSaudi)) return false;
    if (p.nationality === 'non_saudi' && bool_(e.isSaudi)) return false;
    return true;
  }).sort(function (a, b) { return String(a.empNo).localeCompare(String(b.empNo), 'en', { numeric: true }); });
}
function deptName_(e, ctx) { return ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || ''); }
function base_(e, ctx) { return { empNo: String(e.empNo), name: e.name, department: deptName_(e, ctx) }; }
function col_(key, type, extra) { var c = { key: key, type: type || 'text' }; if (extra) for (var k in extra) c[k] = extra[k]; return c; }
var EMP_COLS = [col_('empNo', 'id'), col_('name'), col_('department', 'text', { group: true })];

// ---------------- running a report ----------------

function api_reportRun(req, me) {
  var def = REPORTS[req.reportId];
  if (!def) fail_('not_found');
  var ctx = orgCtx_();
  if (!reportAllowed_(def, me, ctx)) fail_('forbidden');
  var p = reportParams_(def, req.params), res = runReport_(req.reportId, p, me, ctx);
  // A people report with a pay-derived column (moneyCols) shows it only to the hr role and payroll, and records it the same way.
  if (def.access === 'money' || (def.moneyCols && canPayroll_(me))) audit_(me.id, 'salary_view', '', { report: req.reportId, rows: res.rows.length });
  res.ok = true; res.reportId = req.reportId; res.params = p; res.generatedAt = new Date().toISOString(); res.by = { name: me.name, empNo: String(me.empNo) };
  res.teamOnly = !!reportScope_(me, ctx);
  return res;
}

function runReport_(id, p, me, ctx) {
  var scope = reportScope_(me, ctx), s = settings_();
  var fn = REPORT_FNS[id];
  if (!fn) fail_('not_found');
  var r = fn(p, me, ctx, scope, s);
  r.checks = r.checks || [];
  return r;
}

/** Day summaries for the covered people over a range: one read of punches, leave and holidays. */
function daysFor_(emps, from, to, s) {
  var byEmpDay = {}, raw = {};
  readAll_(SHEETS.PUNCH).forEach(function (pn) {
    var d = String(pn.date); if (d < from || d > to) return;
    (raw[pn.empId + '|' + d] = raw[pn.empId + '|' + d] || []).push(pn);
    if (isCounted_(pn)) (byEmpDay[pn.empId + '|' + d] = byEmpDay[pn.empId + '|' + d] || []).push(pn);
  });
  var off = offIndex_(from, to), now = new Date(), out = {};
  emps.forEach(function (e) {
    var joined = maxDate_(joinedDate_(e), String(e.hireDate || '').slice(0, 10) || '0000'), list = [];
    for (var d = from, i = 0; d <= to && i < 400; d = addDays_(d, 1), i++) {
      if (d < joined) { list.push(null); continue; }
      var ps = (byEmpDay[e.id + '|' + d] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var sum = summarizeDay_(e, d, ps, s, now, off(e.id, d));
      sum.raw = raw[e.id + '|' + d] || [];
      list.push(sum);
    }
    out[e.id] = list;
  });
  return out;
}
function hmLocal_(iso) { return iso ? localParts_(new Date(iso)).time : ''; }
function r1_(n) { return Math.round((Number(n) || 0) * 10) / 10; }

var REPORT_FNS = {
  att_daily: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), days = daysFor_(emps, p.from, p.to, s), rows = [], missing = 0, review = 0;
    emps.forEach(function (e) {
      days[e.id].forEach(function (d, i) {
        if (!d) return;
        var date = addDays_(p.from, i);
        if (!d.workday && !d.firstIn) return;
        if (d.status === 'missing_out') missing++;
        review += d.review || 0;
        var src = d.raw.filter(function (x) { return x.status === 'manual'; }).length ? 'manual' : d.raw.length ? 'app' : '';
        rows.push(Object.assign(base_(e, ctx), { date: date, shift: d.shiftStart + '-' + d.shiftEnd, checkIn: hmLocal_(d.firstIn), checkOut: hmLocal_(d.lastOut),
          worked: r1_(d.workedMin / 60), late: d.lateMin, early: d.earlyMin, overtime: r1_(d.overtimeMin / 60), status: d.status, source: src, leaveType: d.leaveType || '', holiday: d.holiday || '' }));
      });
    });
    return { columns: EMP_COLS.concat([col_('date', 'date'), col_('shift'), col_('checkIn', 'time'), col_('checkOut', 'time'), col_('worked', 'hours', { sum: true }),
      col_('late', 'min', { sum: true }), col_('early', 'min', { sum: true }), col_('overtime', 'hours', { sum: true }), col_('status', 'status', { group: true }), col_('source', 'code')]),
      rows: rows, checks: [missing ? { level: 'warn', code: 'missing_out', count: missing } : null, review ? { level: 'warn', code: 'punch_review', count: review } : null].filter(Boolean),
      chart: { type: 'bars', by: 'status', value: 'count' } };
  },

  att_monthly: function (p, me, ctx, scope, s) {
    var first = p.month + '-01', last = monthLast_(p.month), t = today_(), to = last > t ? t : last;
    var emps = reportEmps_(p, ctx, scope), days = daysFor_(emps, first, last, s), n = daysBetween_(first, last) + 1, rows = [];
    var code = function (d) { if (!d) return ''; return { present: d.lateMin ? 'L' : 'P', in: d.lateMin ? 'L' : 'P', absent: 'A', leave: 'V', holiday: 'H', off: 'O', missing_out: 'M', upcoming: '' }[d.status] || ''; };
    emps.forEach(function (e) {
      var row = base_(e, ctx), T = { present: 0, absent: 0, leave: 0, lateDays: 0, lateMin: 0, worked: 0, overtime: 0 };
      days[e.id].forEach(function (d, i) {
        row['d' + (i + 1)] = code(d);
        if (!d) return;
        if (d.firstIn) T.present++; if (d.status === 'absent') T.absent++; if (d.status === 'leave') T.leave++;
        if (d.lateMin) { T.lateDays++; T.lateMin += d.lateMin; }
        T.worked += d.workedMin; T.overtime += d.overtimeMin;
      });
      row.present = T.present; row.absent = T.absent; row.leave = T.leave; row.lateDays = T.lateDays; row.lateMin = T.lateMin; row.worked = r1_(T.worked / 60); row.overtime = r1_(T.overtime / 60);
      rows.push(row);
    });
    var dcols = []; for (var i = 1; i <= n; i++) dcols.push(col_('d' + i, 'code', { day: i, dow: new Date(addDays_(first, i - 1) + 'T00:00:00Z').getUTCDay() }));
    return { columns: EMP_COLS.concat(dcols).concat([col_('present', 'int', { sum: true }), col_('absent', 'int', { sum: true }), col_('leave', 'int', { sum: true }),
      col_('lateDays', 'int', { sum: true }), col_('lateMin', 'min', { sum: true }), col_('worked', 'hours', { sum: true }), col_('overtime', 'hours', { sum: true })]),
      rows: rows, legend: ['P', 'L', 'A', 'V', 'H', 'O', 'M'], wide: true };
  },

  att_summary: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), days = daysFor_(emps, p.from, p.to, s), rows = [];
    emps.forEach(function (e) {
      if (!days[e.id].some(Boolean)) return; // joined after the period
      var T = { expected: 0, present: 0, absent: 0, leave: 0, lateDays: 0, lateMin: 0, earlyMin: 0, overtime: 0, missing: 0 };
      days[e.id].forEach(function (d) {
        if (!d || !d.workday) { if (d && d.firstIn) T.overtime += d.overtimeMin; return; }
        if (d.status === 'leave') { T.leave++; return; }
        if (d.status === 'upcoming') return;
        T.expected++;
        if (d.firstIn) { T.present++; T.overtime += d.overtimeMin; if (d.lateMin) { T.lateDays++; T.lateMin += d.lateMin; } T.earlyMin += d.earlyMin; }
        if (d.status === 'absent') T.absent++; if (d.status === 'missing_out') T.missing++;
      });
      rows.push(Object.assign(base_(e, ctx), { expected: T.expected, present: T.present, absent: T.absent, leave: T.leave, lateDays: T.lateDays, lateMin: T.lateMin,
        earlyMin: T.earlyMin, overtime: r1_(T.overtime / 60), missingOut: T.missing, attendance: pct_(T.present, T.expected), punctuality: pct_(T.present - T.lateDays, T.present) }));
    });
    return { columns: EMP_COLS.concat([col_('expected', 'int', { sum: true }), col_('present', 'int', { sum: true }), col_('absent', 'int', { sum: true }), col_('leave', 'int', { sum: true }),
      col_('lateDays', 'int', { sum: true }), col_('lateMin', 'min', { sum: true }), col_('earlyMin', 'min', { sum: true }), col_('overtime', 'hours', { sum: true }),
      col_('missingOut', 'int', { sum: true }), col_('attendance', 'pct'), col_('punctuality', 'pct')]), rows: rows,
      chart: { type: 'hbar', label: 'name', value: 'attendance', max: 100 } };
  },

  att_exceptions: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope, true), ids = {}, names = {};
    emps.forEach(function (e) { ids[e.id] = e; });
    Object.keys(ctx.emps).forEach(function (k) { names[k] = ctx.emps[k].name; });
    var rows = [];
    readAll_(SHEETS.PUNCH).forEach(function (pn) {
      var d = String(pn.date), e = ids[pn.empId];
      if (!e || d < p.from || d > p.to) return;
      if (['review', 'rejected', 'manual', 'approved'].indexOf(pn.status) < 0 && !pn.flags) return;
      rows.push(Object.assign(base_(e, ctx), { date: d, time: hmLocal_(pn.ts), type: pn.type, status: pn.status, risk: Number(pn.risk) || 0, flags: String(pn.flags || ''),
        distance: pn.distance === '' ? null : Number(pn.distance), source: String(pn.source || '').indexOf('hr:') === 0 ? 'hr' : String(pn.source || '').indexOf('request:') === 0 ? 'request' : 'app',
        by: names[pn.reviewBy] || '', note: pn.note || '' }));
    });
    rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return { columns: EMP_COLS.concat([col_('date', 'date'), col_('time', 'time'), col_('type', 'code'), col_('status', 'status', { group: true }), col_('risk', 'int'),
      col_('flags', 'text'), col_('distance', 'int'), col_('source', 'code', { group: true }), col_('by'), col_('note')]), rows: rows,
      chart: { type: 'bars', by: 'status', value: 'count' } };
  },

  leave_balances: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), reqs = readAll_(SHEETS.REQ), money = me.role === 'hr' || hasRole_(me, 'payroll'), comps = money ? currentCompMap_(p.asOf) : {};
    var rows = [], missing = 0;
    emps.forEach(function (e) {
      var mine = reqs.filter(function (r) { return r.empId === e.id; }), b = annualBalance_(e, p.asOf, mine, null), sk = sickSplit_(e.id, p.asOf, 0, mine, null);
      if (b.openingMissing) missing++;
      var row = Object.assign(base_(e, ctx), { perYear: b.perYear, opening: b.opening, accrued: b.accrued, used: b.used, pending: b.pending, available: b.available, sickUsed: sk.usedBefore });
      if (money) row.liability = comps[e.id] ? r2_(Math.max(0, b.balance) * comps[e.id].total / 30) : null;
      rows.push(row);
    });
    var cols = EMP_COLS.concat([col_('perYear', 'int'), col_('opening', 'days', { sum: true }), col_('accrued', 'days', { sum: true }), col_('used', 'days', { sum: true }),
      col_('pending', 'days', { sum: true }), col_('available', 'days', { sum: true }), col_('sickUsed', 'int', { sum: true })]);
    if (money) cols.push(col_('liability', 'money', { sum: true }));
    return { columns: cols, rows: rows, checks: missing ? [{ level: 'warn', code: 'opening_missing', count: missing }] : [], chart: { type: 'hbar', label: 'name', value: 'available' } };
  },

  leave_taken: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope, true), ids = {}, hol = holidayMap_(), rows = [];
    emps.forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.REQ).forEach(function (r) {
      var e = ids[r.empId];
      if (!e || r.type !== 'leave' || r.status !== 'approved' || (p.leaveType && r.subtype !== p.leaveType)) return;
      var a = maxDate_(String(r.fromDate).slice(0, 10), p.from), b = minDate_(String(r.toDate).slice(0, 10), p.to);
      if (a > b) return;
      rows.push(Object.assign(base_(e, ctx), { ref: r.ref, leaveType: r.subtype, fromDate: String(r.fromDate).slice(0, 10), toDate: String(r.toDate).slice(0, 10),
        days: Number(r.days) || 0, daysInPeriod: countLeaveDays_(e, r.subtype, a, b, hol, s).days, docNo: r.docNo || '' }));
    });
    rows.sort(function (a, b) { return a.fromDate < b.fromDate ? -1 : 1; });
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('leaveType', 'code', { group: true }), col_('fromDate', 'date'), col_('toDate', 'date'), col_('days', 'days', { sum: true }),
      col_('daysInPeriod', 'days', { sum: true }), col_('docNo')]), rows: rows, chart: { type: 'bars', by: 'leaveType', value: 'daysInPeriod' } };
  },

  requests_log: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope, true), ids = {}, rows = [], money = me.role === 'hr' || hasRole_(me, 'payroll');
    emps.forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.REQ).forEach(function (r) {
      var e = ids[r.empId], c = String(r.createdAt).slice(0, 10);
      if (!e || c < p.from || c > p.to || (p.reqType && r.type !== p.reqType) || (p.reqStatus && r.status !== p.reqStatus)) return;
      if (r.type === 'advance' && !money) return; // salary-related: never to a manager
      var hrs = r.decidedAt ? r1_((Date.parse(r.decidedAt) - Date.parse(r.createdAt)) / 3600000) : null;
      rows.push(Object.assign(base_(e, ctx), { ref: r.ref, type: r.type, subtype: r.subtype || '', created: c, status: r.status, step: r.status === 'pending' ? r.step : '',
        decided: r.decidedAt ? String(r.decidedAt).slice(0, 10) : '', hours: hrs, days: r.days === '' ? null : Number(r.days) }));
    });
    rows.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('type', 'code', { group: true }), col_('subtype', 'code'), col_('created', 'date'), col_('status', 'status', { group: true }),
      col_('step', 'code'), col_('decided', 'date'), col_('hours', 'hours'), col_('days', 'days', { sum: true })]), rows: rows, chart: { type: 'bars', by: 'status', value: 'count' } };
  },

  hr_headcount: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope, p.status !== 'active'), pos = {}, priv = {}, t = today_(), rows = [], noIban = 0, expired = 0;
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x.titleAr; });
    readAll_(SHEETS.PRIV).forEach(function (x) { priv[x.empId] = x; });
    emps.forEach(function (e) {
      var pv = priv[e.id] || {};
      if (!pv.iban) noIban++;
      if (pv.idExpiry && String(pv.idExpiry) < t) expired++;
      rows.push(Object.assign(base_(e, ctx), { position: pos[e.positionId] || e.title || '', manager: ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '', hireDate: String(e.hireDate || '').slice(0, 10),
        years: e.hireDate ? r1_(daysBetween_(String(e.hireDate).slice(0, 10), t) / 365.25) : null, nationality: e.nationality || '', saudi: bool_(e.isSaudi) ? 'saudi' : 'non_saudi',
        gender: e.gender || '', contractType: e.contractType || '', contractEnd: String(e.contractEnd || '').slice(0, 10), status: e.status }));
    });
    return { columns: EMP_COLS.concat([col_('position', 'text', { group: true }), col_('manager', 'text', { group: true }), col_('hireDate', 'date'), col_('years', 'num'),
      col_('nationality', 'text', { group: true }), col_('saudi', 'code', { group: true }), col_('gender', 'code', { group: true }), col_('contractType', 'code', { group: true }),
      col_('contractEnd', 'date'), col_('status', 'status', { group: true })]), rows: rows,
      checks: [noIban ? { level: 'warn', code: 'no_iban', count: noIban } : null, expired ? { level: 'error', code: 'id_expired', count: expired } : null].filter(Boolean),
      chart: { type: 'bars', by: 'department', value: 'count' } };
  },

  hr_movement: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(Object.assign({}, p, { status: 'all' }), ctx, scope, true), rows = [];
    emps.forEach(function (e) {
      var h = String(e.hireDate || '').slice(0, 10), l = String(e.lastWorkingDay || '').slice(0, 10);
      if (h && h >= p.from && h <= p.to) rows.push(Object.assign(base_(e, ctx), { movement: 'joined', date: h, reason: '' }));
      if (l && l >= p.from && l <= p.to) rows.push(Object.assign(base_(e, ctx), { movement: 'left', date: l, reason: e.resignedOn ? 'resignation' : '' }));
    });
    rows.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return { columns: EMP_COLS.concat([col_('movement', 'code', { group: true }), col_('date', 'date'), col_('reason', 'code')]), rows: rows, chart: { type: 'bars', by: 'movement', value: 'count' } };
  },

  hr_expiry: function (p, me, ctx, scope, s) {
    var list = api_hrExpiring({ days: p.days }, me).rows, ds = deptSet_(p, ctx), rows = [];
    list.forEach(function (x) {
      var e = ctx.emps[x.empId]; if (!e || (scope && !scope[e.id]) || (ds && !ds[e.departmentId])) return;
      rows.push(Object.assign(base_(e, ctx), { kind: x.kind, number: x.number, date: x.date, daysLeft: x.daysLeft }));
    });
    return { columns: EMP_COLS.concat([col_('kind', 'code', { group: true }), col_('number', 'id'), col_('date', 'date'), col_('daysLeft', 'int')]), rows: rows,
      checks: rows.filter(function (r) { return r.daysLeft < 0; }).length ? [{ level: 'error', code: 'expired', count: rows.filter(function (r) { return r.daysLeft < 0; }).length }] : [],
      chart: { type: 'bars', by: 'kind', value: 'count' } };
  },

  // Nitaqat-weighted Saudization per department, against the saudizationTarget setting (full-weight Saudis still needed),
  // and the change from last month end (people employed then, at the package in force then).
  hr_saudization: function (p, me, ctx, scope, s) {
    var t = today_(), emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(t), compRows = readAll_(SHEETS.COMP), by = {}, target = Number(s.saudizationTarget) || null;
    var prevEnd = addDays_(t.slice(0, 8) + '01', -1), grp = function (d) { return by[d] = by[d] || { department: d, headcount: 0, saudis: 0, weighted: 0, half: 0, zero: 0, ph: 0, pw: 0 }; };
    emps.forEach(function (e) {
      var g = grp(deptName_(e, ctx) || '-');
      g.headcount++;
      if (bool_(e.isSaudi)) { g.saudis++; var w = nitaqatWeight_(comps[e.id]); g.weighted += w; if (w === 0.5) g.half++; if (w === 0) g.zero++; }
    });
    rxAllEmps_(p, ctx, scope).forEach(function (e) {
      if (!rxOn_(rxSpan_(e), prevEnd)) return;
      var g = grp(deptName_(e, ctx) || '-'); g.ph++; if (bool_(e.isSaudi)) g.pw += nitaqatWeight_(compOn_(e.id, prevEnd, compRows));
    });
    var need = 0, H = 0, W = 0;
    var rows = Object.keys(by).filter(function (k) { return by[k].headcount; }).map(function (k) {
      var g = by[k], pv = g.ph ? pct_(g.pw, g.ph) : null;
      g.pct = pct_(g.weighted, g.headcount); g.saudiTarget = target; g.needed = target ? Math.max(0, Math.ceil(target / 100 * g.headcount - g.weighted - 1e-9)) : null;
      g.prevPct = pv; g.changePts = rxPts_(g.pct, pv); need += g.needed || 0; H += g.headcount; W += g.weighted;
      delete g.ph; delete g.pw;
      return g;
    });
    var co = pct_(W, H);
    return { columns: [col_('department'), col_('headcount', 'int', { sum: true }), col_('saudis', 'int', { sum: true }), col_('weighted', 'num', { sum: true }),
      col_('half', 'int', { sum: true }), col_('zero', 'int', { sum: true }), col_('pct', 'pct'), col_('saudiTarget', 'pct'), col_('needed', 'int', { sum: true }), col_('prevPct', 'pct'), col_('changePts', 'num')],
      rows: rows, chart: { type: 'hbar', label: 'department', value: 'pct', max: 100 }, totalsNote: 'saudization',
      checks: target && H ? [{ level: co < target ? 'warn' : 'info', code: 'saudi_vs_target', count: Math.max(0, Math.ceil(target / 100 * H - W - 1e-9)), value: co }] : [] };
  },

  pay_register: function (p, me, ctx, scope, s) {
    var run = findBy_(SHEETS.RUN, 'id', p.run) || currentRun_();
    if (!run) return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_run', count: 0 }] };
    p.run = run.id;
    var ds = deptSet_(p, ctx), rows = [], noIban = 0, neg = 0, warn = 0;
    readAll_(SHEETS.SLIP).forEach(function (sl) {
      if (sl.runId !== run.id || sl.status === 'void') return;
      var e = ctx.emps[sl.empId]; if (!e || (ds && !ds[e.departmentId])) return;
      var ls = lines_(sl), sum = function (codes) { return r2_(ls.filter(function (l) { return codes.indexOf(l.code) >= 0; }).reduce(function (t, l) { return t + l.amount; }, 0)); };
      var info = parseJson_(sl.infoJson, {}), iban = String((info.info || {}).iban || '');
      if (!iban) noIban++; if (Number(sl.net) < 0) neg++; if ((info.warnings || []).length) warn++;
      rows.push(Object.assign(base_(e, ctx), { payslip: sl.ref, days: Number(sl.paidDays), basic: sum(['basic']), housing: sum(['housing']), transport: sum(['transport']), allowances: sum(['allowance']),
        overtime: sum(['overtime']), otherEarnings: sum(['bonus', 'commission', 'other_earning']), gross: Number(sl.gross), gosi: sum(['gosi']), advances: sum(['advance']),
        leaveDeductions: sum(['unpaid_leave', 'sick_75', 'sick_unpaid', 'absence', 'late']), otherDeductions: sum(['fine', 'other_deduction']), deductions: Number(sl.deductions), net: Number(sl.net),
        gosiEmployer: Number(sl.gosiEmployer), iban: iban ? iban.slice(0, 4) + '••••' + iban.slice(-4) : '' }));
    });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: EMP_COLS.concat([col_('payslip', 'id'), col_('days', 'int'), m('basic'), m('housing'), m('transport'), m('allowances'), m('overtime'), m('otherEarnings'), m('gross'),
      m('gosi'), m('advances'), m('leaveDeductions'), m('otherDeductions'), m('deductions'), m('net'), m('gosiEmployer'), col_('iban', 'id')]), rows: rows, run: publicRun_(run),
      checks: [noIban ? { level: 'error', code: 'no_iban', count: noIban } : null, neg ? { level: 'error', code: 'net_negative', count: neg } : null, warn ? { level: 'warn', code: 'slip_warnings', count: warn } : null,
        { level: 'info', code: 'control_total', count: rows.length, value: r2_(rows.reduce(function (t, r) { return t + r.net; }, 0)) }].filter(Boolean), wide: true };
  },

  pay_variance: function (p, me, ctx, scope, s) {
    var run = findBy_(SHEETS.RUN, 'id', p.run) || currentRun_();
    if (!run) return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_run', count: 0 }] };
    p.run = run.id;
    var prev = readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'locked' && r.month < run.month && runScope_(r) === runScope_(run); }).sort(function (a, b) { return a.month < b.month ? 1 : -1; })[0];
    var slipsOf = function (r) { var o = {}; if (!r) return o; readAll_(SHEETS.SLIP).forEach(function (sl) { if (sl.runId === r.id && sl.status !== 'void') o[sl.empId] = sl; }); return o; };
    var cur = slipsOf(run), old = slipsOf(prev), ds = deptSet_(p, ctx), rows = [], flagged = 0;
    Object.keys(cur).concat(Object.keys(old).filter(function (k) { return !cur[k]; })).forEach(function (k) {
      var e = ctx.emps[k]; if (!e || (ds && !ds[e.departmentId])) return;
      var a = old[k] ? Number(old[k].net) : null, b = cur[k] ? Number(cur[k].net) : null, ga = old[k] ? Number(old[k].gross) : null, gb = cur[k] ? Number(cur[k].gross) : null;
      var change = a != null && b != null ? r2_(b - a) : null, pctc = a ? r1_((b - a) / a * 100) : null;
      var kind = a == null ? 'new' : b == null ? 'missing' : Math.abs(pctc || 0) >= p.threshold ? 'changed' : 'same';
      if (kind !== 'same') flagged++;
      rows.push(Object.assign(base_(e, ctx), { previousGross: ga, gross: gb, previousNet: a, net: b, change: change, changePct: pctc, flag: kind }));
    });
    rows.sort(function (x, y) { return Math.abs(y.changePct || 999) - Math.abs(x.changePct || 999); });
    return { columns: EMP_COLS.concat([col_('previousGross', 'money', { sum: true }), col_('gross', 'money', { sum: true }), col_('previousNet', 'money', { sum: true }), col_('net', 'money', { sum: true }),
      col_('change', 'money', { sum: true }), col_('changePct', 'pct'), col_('flag', 'status', { group: true })]), rows: rows, run: publicRun_(run), previous: prev ? publicRun_(prev) : null,
      checks: [{ level: flagged ? 'warn' : 'info', code: 'variance_flagged', count: flagged, value: p.threshold }], chart: { type: 'bars', by: 'flag', value: 'count' } };
  },

  pay_gosi: function (p, me, ctx, scope, s) {
    var run = findBy_(SHEETS.RUN, 'id', p.run) || currentRun_();
    if (!run) return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_run', count: 0 }] };
    p.run = run.id;
    var ds = deptSet_(p, ctx), priv = {}, rows = [], missingCohort = 0;
    readAll_(SHEETS.PRIV).forEach(function (x) { priv[x.empId] = x; });
    readAll_(SHEETS.SLIP).forEach(function (sl) {
      if (sl.runId !== run.id || sl.status === 'void') return;
      var e = ctx.emps[sl.empId]; if (!e || (ds && !ds[e.departmentId])) return;
      var g = (parseJson_(sl.infoJson, {}).info || {}).gosi || {}, pv = priv[e.id] || {};
      if (bool_(e.isSaudi) && !pv.gosiCohort) missingCohort++;
      rows.push(Object.assign(base_(e, ctx), { nationalId: String(pv.nationalId || ''), gosiNumber: String(pv.gosiNumber || ''), nationality: e.nationality || '', cohort: g.cohort || '',
        base: g.base || 0, employeeRate: g.empRate || 0, employee: Number(sl.gosiEmployee) || 0, employerRate: g.erRate || 0, employer: Number(sl.gosiEmployer) || 0 }));
    });
    return { columns: EMP_COLS.concat([col_('nationalId', 'id'), col_('gosiNumber', 'id'), col_('nationality', 'text', { group: true }), col_('cohort', 'code', { group: true }),
      col_('base', 'money', { sum: true }), col_('employeeRate', 'pct'), col_('employee', 'money', { sum: true }), col_('employerRate', 'pct'), col_('employer', 'money', { sum: true })]),
      rows: rows, run: publicRun_(run), checks: missingCohort ? [{ level: 'warn', code: 'gosi_cohort_missing', count: missingCohort }] : [] };
  },

  // Per department and cost centre: gross, employer GOSI, cost (the two), the end-of-service provision and the company cost
  // (all three), its share of the total, cost per head, and the company cost of the last locked run with the change.
  pay_cost: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var run = rp.run, ids = {}; ids[run.id] = 1; if (rp.prev) ids[rp.prev.id] = 1;
    var slips = rxSlipsBy_(ids, null, ctx), by = {}, old = {};
    var add = function (map, m, full) {
      Object.keys(m || {}).forEach(function (k) {
        var sl = m[k], e = ctx.emps[sl.empId] || {}, d = ctx.depts[e.departmentId], key = d ? d.id : '-';
        var g = map[key] = map[key] || { department: d ? d.nameAr : '-', costCenter: d ? String(d.costCenter || '') : '', headcount: 0, gross: 0, gosiEmployer: 0, cost: 0, net: 0, eosAccrual: 0, companyCost: 0 };
        g.headcount++; g.companyCost = r2_(g.companyCost + rxCost_(ctx.emps[sl.empId], sl, s));
        if (full) { g.gross = r2_(g.gross + Number(sl.gross)); g.gosiEmployer = r2_(g.gosiEmployer + Number(sl.gosiEmployer)); g.net = r2_(g.net + Number(sl.net)); g.cost = r2_(g.gross + g.gosiEmployer); g.eosAccrual = r2_(g.eosAccrual + rxEos_(ctx.emps[sl.empId], sl, s)); }
      });
    };
    add(by, slips[run.id], true); if (rp.prev) add(old, slips[rp.prev.id], false);
    var tot = Object.keys(by).reduce(function (t, k) { return t + by[k].companyCost; }, 0);
    var rows = Object.keys(by).map(function (k) {
      var g = by[k], o = old[k], c = rxChg_(g.companyCost, o ? o.companyCost : rp.prev ? 0 : null);
      g.share = pct_(g.companyCost, tot); g.perHead = g.headcount ? r2_(g.companyCost / g.headcount) : null; g.prev = c.prev; g.change = c.change; g.changePct = c.changePct;
      return g;
    }).sort(function (a, b) { return b.cost - a.cost; });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: [col_('department'), col_('costCenter', 'id'), col_('headcount', 'int', { sum: true }), m('gross'), m('gosiEmployer'), m('cost'), m('net'), m('eosAccrual'), m('companyCost'),
      col_('share', 'pct'), col_('perHead', 'money'), m('prev'), m('change'), col_('changePct', 'pct')], rows: rows, run: publicRun_(run), chart: { type: 'hbar', label: 'department', value: 'cost' } };
  },

  pay_eos: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(p.asOf), reqs = readAll_(SHEETS.REQ), rows = [], noHire = 0, noPkg = 0;
    emps.forEach(function (e) {
      var hire = String(e.hireDate || '').slice(0, 10), c = comps[e.id];
      if (!hire) { noHire++; return; } if (!c) { noPkg++; return; }
      var mine = reqs.filter(function (r) { return r.empId === e.id; }), svc = eosService_(e, hire, p.asOf, mine);
      var w = c.total, full = eosAward_(svc.years, w, 'termination'), res = eosAward_(svc.years, w, 'resignation');
      var bal = annualBalance_(e, p.asOf, mine, null), lp = Math.max(0, bal.balance) * c.total / 30;
      rows.push(Object.assign(base_(e, ctx), { hireDate: hire, years: r2_(svc.years), excludedDays: svc.excluded, wage: r2_(w), awardFull: r2_(full.award), awardResignation: r2_(res.award),
        leaveDays: r2_(Math.max(0, bal.balance)), leavePay: r2_(lp), liability: r2_(full.award + lp) }));
    });
    return { columns: EMP_COLS.concat([col_('hireDate', 'date'), col_('years', 'num'), col_('excludedDays', 'int'), col_('wage', 'money', { sum: true }), col_('awardFull', 'money', { sum: true }),
      col_('awardResignation', 'money', { sum: true }), col_('leaveDays', 'days', { sum: true }), col_('leavePay', 'money', { sum: true }), col_('liability', 'money', { sum: true })]), rows: rows,
      checks: [noHire ? { level: 'warn', code: 'missing_hire_date', count: noHire } : null, noPkg ? { level: 'warn', code: 'no_package', count: noPkg } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'name', value: 'liability' } };
  },

  // Pay equity (DEI skill): average monthly package by position, men vs women and Saudi vs non-Saudi, and the gap.
  // A gap is a question to investigate (experience, grade, tenure), not a finding; groups under 2 people show no average.
  pay_equity: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(today_()), pos = {}, by = {}, noGender = 0;
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x.titleAr; });
    var add = function (g, key, v) { g[key + 'N']++; g[key + 'S'] += v; };
    emps.forEach(function (e) {
      var c = comps[e.id]; if (!c) return;
      var k = pos[e.positionId] || e.title || deptName_(e, ctx) || '-';
      var g = by[k] = by[k] || { position: k, headcount: 0, maleN: 0, maleS: 0, femaleN: 0, femaleS: 0, saudiN: 0, saudiS: 0, nonN: 0, nonS: 0, all: 0 };
      g.headcount++; g.all += c.total;
      if (e.gender === 'male') add(g, 'male', c.total); else if (e.gender === 'female') add(g, 'female', c.total); else noGender++;
      if (bool_(e.isSaudi)) add(g, 'saudi', c.total); else add(g, 'non', c.total);
    });
    var avg = function (sum, n) { return n >= 2 ? r2_(sum / n) : null; }, gap = function (a, b) { return a && b ? r1_((a - b) / a * 100) : null; }, flagged = 0;
    var rows = Object.keys(by).map(function (k) {
      var g = by[k], m = avg(g.maleS, g.maleN), f = avg(g.femaleS, g.femaleN), sa = avg(g.saudiS, g.saudiN), ns = avg(g.nonS, g.nonN);
      var row = { position: g.position, headcount: g.headcount, average: r2_(g.all / g.headcount), men: g.maleN, menAvg: m, women: g.femaleN, womenAvg: f, genderGap: gap(m, f),
        saudis: g.saudiN, saudiAvg: sa, nonSaudis: g.nonN, nonSaudiAvg: ns, nationalityGap: gap(sa, ns) };
      if (Math.abs(row.genderGap || 0) >= 10 || Math.abs(row.nationalityGap || 0) >= 10) flagged++;
      return row;
    }).sort(function (a, b) { return b.headcount - a.headcount; });
    return { columns: [col_('position', 'text'), col_('headcount', 'int', { sum: true }), col_('average', 'money'), col_('men', 'int', { sum: true }), col_('menAvg', 'money'), col_('women', 'int', { sum: true }),
      col_('womenAvg', 'money'), col_('genderGap', 'pct'), col_('saudis', 'int', { sum: true }), col_('saudiAvg', 'money'), col_('nonSaudis', 'int', { sum: true }), col_('nonSaudiAvg', 'money'), col_('nationalityGap', 'pct')],
      rows: rows, checks: [flagged ? { level: 'warn', code: 'pay_gap', count: flagged, value: 10 } : null, noGender ? { level: 'info', code: 'no_gender', count: noGender } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'position', value: 'average' } };
  },

  perf_results: function (p, me, ctx, scope, s) {
    var cyc = p.cycle ? cycleById_(p.cycle) : currentCycle_();
    if (!cyc) return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_cycle', count: 0 }] };
    p.cycle = cyc.id;
    var emps = reportEmps_(p, ctx, scope), revs = {}, kp = {}, hr = isHr_(me), rows = [];
    readAll_(SHEETS.REV).forEach(function (r) { if (r.cycleId === cyc.id) revs[r.empId] = r; });
    readAll_(SHEETS.KPI).forEach(function (k) { if (k.cycleId === cyc.id && k.status !== 'deleted') kp[k.empId] = (kp[k.empId] || 0) + 1; });
    emps.forEach(function (e) {
      var r = revs[e.id] || {};
      rows.push(Object.assign(base_(e, ctx), { manager: ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '', kpis: kp[e.id] || 0, selfDone: r.selfAt ? 'yes' : 'no', managerDone: r.mgrAt ? 'yes' : 'no',
        kpiScore: r.kpiScore === '' || r.kpiScore == null ? null : Number(r.kpiScore), compScore: r.compScore === '' || r.compScore == null ? null : Number(r.compScore),
        overall: r.overall === '' || r.overall == null ? null : Number(r.overall), finalRating: (hr || cyc.status === 'closed') && r.finalRating !== '' && r.finalRating != null ? Number(r.finalRating) : null,
        adjusted: r.calibrationNote ? 'yes' : '', acknowledged: r.acknowledgedAt ? 'yes' : 'no' }));
    });
    return { columns: EMP_COLS.concat([col_('manager', 'text', { group: true }), col_('kpis', 'int'), col_('selfDone', 'code', { group: true }), col_('managerDone', 'code', { group: true }),
      col_('kpiScore', 'num'), col_('compScore', 'num'), col_('overall', 'num'), col_('finalRating', 'int'), col_('adjusted', 'code'), col_('acknowledged', 'code', { group: true })]), rows: rows,
      cycle: publicCycle_(cyc), chart: { type: 'bars', by: 'finalRating', value: 'count' } };
  },

  audit_log: function (p, me, ctx, scope, s) {
    var names = {}; Object.keys(ctx.emps).forEach(function (k) { names[k] = ctx.emps[k].name; });
    var rows = readAll_(SHEETS.AUDIT).filter(function (a) { var d = localParts_(new Date(a.ts)).date; return d >= p.from && d <= p.to && (!p.auditAction || a.action === p.auditAction); })
      .slice(-3000).reverse().map(function (a) { return { at: String(a.ts), actor: names[a.actorId] || a.actorId || '', action: a.action, target: names[a.targetId] || a.targetId || '', detail: String(a.detail || '').slice(0, 300) }; });
    return { columns: [col_('at', 'datetime'), col_('actor', 'text', { group: true }), col_('action', 'code', { group: true }), col_('target'), col_('detail')], rows: rows,
      chart: { type: 'bars', by: 'action', value: 'count' } };
  }
};
function currentRun_() {
  return runsRealFirst_(readAll_(SHEETS.RUN)).filter(function (r) { return r.status !== 'cancelled'; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; })[0] || null;
}

// ---------------- numbered, fingerprinted exports; review; verification ----------------

/** The fingerprint of a result: SHA-256 over the report id, parameters, column keys and every row, in order. */
function reportHash_(id, p, res) {
  var keys = res.columns.map(function (c) { return c.key; });
  var body = JSON.stringify([id, p, keys, res.rows.map(function (r) { return keys.map(function (k) { return r[k] == null ? '' : r[k]; }); })]);
  return sha256Hex_(body);
}

/** Keeps only the chosen columns (in the report's own order); the file and its fingerprint then cover exactly those. */
function keepColumns_(res, keys) {
  if (!Array.isArray(keys) || !keys.length) return null;
  var want = {}; keys.forEach(function (k) { want[String(k)] = 1; });
  var cols = res.columns.filter(function (c) { return want[c.key]; });
  if (!cols.length || cols.length === res.columns.length) return null;
  res.columns = cols;
  return cols.map(function (c) { return c.key; });
}

/** Before a file is built: the server runs the report again, numbers the export and stores its fingerprint. */
function api_reportExport(req, me) {
  var def = REPORTS[req.reportId];
  if (!def) fail_('not_found');
  var format = ['xlsx', 'csv', 'pdf', 'print'].indexOf(req.format) >= 0 ? req.format : 'xlsx';
  var ctx = orgCtx_();
  if (!reportAllowed_(def, me, ctx)) fail_('forbidden');
  var p = reportParams_(def, req.params), res = runReport_(req.reportId, p, me, ctx), kept = keepColumns_(res, req.columns);
  if (kept) p.columns = kept;
  var hash = reportHash_(req.reportId, p, res);
  return withLock_(function () {
    var row = { id: newId_('X'), ref: nextRef_('report', refsOf_(SHEETS.RLOG)), reportId: req.reportId, paramsJson: JSON.stringify(p), rows: res.rows.length, format: format,
      hash: hash, by: me.id, at: new Date().toISOString(), reviewedBy: '', reviewedAt: '', reviewNote: '' };
    append_(SHEETS.RLOG, row);
    audit_(me.id, 'report_export', '', { ref: row.ref, report: req.reportId, format: format, rows: row.rows });
    res.ok = true; res.reportId = req.reportId; res.params = p; res.generatedAt = row.at; res.by = { name: me.name, empNo: String(me.empNo) };
    res.export = { ref: row.ref, hash: hash, format: format };
    return res;
  });
}

function publicLog_(x, names) {
  return { ref: x.ref, reportId: x.reportId, params: parseJson_(x.paramsJson, {}), rows: Number(x.rows), format: x.format, hash: x.hash, by: names[x.by] || '', at: x.at,
    reviewedBy: names[x.reviewedBy] || '', reviewedAt: x.reviewedAt, reviewNote: x.reviewNote };
}
function api_reportLog(req, me) {
  if (!isHr_(me) && !hasRole_(me, 'payroll')) fail_('forbidden');
  var names = {}; readAll_(SHEETS.EMP).forEach(function (e) { names[e.id] = e.name; });
  var mineOnly = !isHr_(me);
  var rows = readAll_(SHEETS.RLOG).filter(function (x) { return !mineOnly || x.by === me.id || REPORTS[x.reportId] && REPORTS[x.reportId].access === 'money'; })
    .slice(-300).reverse().map(function (x) { return publicLog_(x, names); });
  return { ok: true, rows: rows };
}
/** A second person confirms they checked the export. Never the one who made it. */
function api_reportReview(req, me) {
  if (!isHr_(me) && !hasRole_(me, 'payroll')) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.RLOG, 'ref', String(req.ref || ''));
    if (!x) fail_('not_found');
    if (x.by === me.id) fail_('second_approver_required');
    if (x.reviewedBy) fail_('already_submitted');
    var def = REPORTS[x.reportId];
    if (def && def.access === 'money' && !(me.role === 'hr' || hasRole_(me, 'payroll'))) fail_('forbidden');
    x.reviewedBy = me.id; x.reviewedAt = new Date().toISOString(); x.reviewNote = str_(req.note, 300);
    update_(SHEETS.RLOG, x);
    audit_(me.id, 'report_review', '', { ref: x.ref });
    return { ok: true };
  });
}
/** Is this printed or exported report genuine, and would it still come out the same today? */
function api_reportVerify(req, me) {
  if (!canDash_(me)) fail_('forbidden');
  var x = findBy_(SHEETS.RLOG, 'ref', String(req.ref || '').trim().toUpperCase());
  var names = {}; readAll_(SHEETS.EMP).forEach(function (e) { names[e.id] = e.name; });
  if (!x) return { ok: true, found: false };
  var given = String(req.hash || '').trim().toLowerCase(), match = given ? (x.hash === given || x.hash.slice(0, given.length) === given && given.length >= 12) : null;
  var same = null, def = REPORTS[x.reportId], ctx = orgCtx_();
  if (def && reportAllowed_(def, me, ctx)) {
    try { var p = parseJson_(x.paramsJson, {}), res = runReport_(x.reportId, p, me, ctx); if (p.columns) keepColumns_(res, p.columns); same = reportHash_(x.reportId, p, res) === x.hash; } catch (e) { same = null; }
  }
  audit_(me.id, 'report_verify', '', { ref: x.ref, match: match, same: same });
  return { ok: true, found: true, match: match, unchanged: same, log: publicLog_(x, names) };
}

// ======================================================================================================
// Analytical reports (2026-10-04): trends, comparisons, distributions and data checks on top of the registers above.
// ======================================================================================================
/*
 * Built with the people-report, statistical-analysis and dataviz skills. Every report:
 *  - compares with the period before wherever it has one: the same number of days before a range, the month before a
 *    month, the last locked run before a run (value, previous, change, change %; a rate changes in points);
 *  - reads each Sheet tab once per request (readAll_ keeps a per-request memo; nothing here re-reads after a write);
 *  - keeps the access rules: 'people' rows are cut to the viewer's team by reportScope_, per-person pay goes to the hr
 *    role and payroll only (canPayroll_), and a cost-only viewer (the executive) never sees a money figure for a group of
 *    fewer than RX_MIN_GROUP people, so no total gives away one person's pay.
 * Statistics: a median next to every mean of a skewed figure (minutes late, hours to decide, pay), the 90th percentile by
 * linear interpolation, outliers by the 1.5 x IQR rule, the Bradford factor S² x D with common trigger points.
 * Payroll employer costs: employer GOSI from the payslip; the monthly end-of-service accrual is wage / 24 for the first five
 * years of service and wage / 12 after (Art. 84) on the eosWageBasis setting, pro rata to the days paid. A payslip that
 * carries its own eosAccrual / employerGosi / companyCost (the payslip change in Payroll.gs) is read as it is.
 */
var RX_MIN_GROUP = 3;
var RX_SLA_HOURS = 48;          // target hours for one approval step
var RX_GOSI_SHARE_MIN = 50;     // a GOSI wage under this share of gross is flagged for a look
var RX_OT_YEAR_HOURS = 720;     // overtime guide, hours a year (check the current executive regulations)
var RX_CURVE = { 1: [0, 5], 2: [5, 15], 3: [60, 75], 4: [10, 20], 5: [1, 5] }; // healthy spread of ratings, as js/performance.js
var RX_DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
var RX_ARRIVAL = ['early_30', 'early', 'on_time', 'late_30', 'late_60', 'late_over'];
var RX_DEDUCTIONS = ['gosi', 'advance', 'absence', 'late', 'unpaid_leave', 'sick_75', 'sick_unpaid', 'fine', 'other_deduction'];

/** The period of the same length just before [from, to]. */
function rxPrev_(from, to) { var len = daysBetween_(from, to), pTo = addDays_(from, -1); return { from: addDays_(pTo, -len), to: pTo }; }
function rxAddMonth_(m, n) { return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1)).toISOString().slice(0, 7); }
/** Calendar months 'YYYY-MM' from the month of `from` to the month of `to`. */
function rxMonths_(from, to) {
  var out = [], m = String(from).slice(0, 7), last = String(to).slice(0, 7);
  for (var i = 0; m <= last && i < 40; i++) { out.push(m); m = rxAddMonth_(m, 1); }
  return out;
}
/** Change and change % against the previous value: the change rounded to dp decimals, the % to one; no % from a zero base. */
function rxChg_(cur, prev, dp) {
  var f = Math.pow(10, dp == null ? 2 : dp), ok = cur != null && prev != null;
  return { prev: prev == null ? null : prev, change: ok ? Math.round((cur - prev) * f) / f : null, changePct: ok && prev ? r1_((cur - prev) / Math.abs(prev) * 100) : null };
}
/** A rate's change in percentage points. */
function rxPts_(cur, prev) { return cur != null && prev != null ? r1_(cur - prev) : null; }
/** The q-th quantile (0-1), linear interpolation between the closest ranks. */
function rxQuant_(xs, q) {
  if (!xs.length) return null;
  var s = xs.slice().sort(function (a, b) { return a - b; }), pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
function rxMean_(xs) { return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; }
/** First and last day someone counts: the hire date (else the day they were added) to the last working day. Null for a
 *  person switched off with no last working day (cannot be dated). */
function rxSpan_(e) { var end = isoDate_(e.lastWorkingDay); if (!end && e.status !== 'active') return null; return { start: isoDate_(e.hireDate) || joinedDate_(e), end: end }; }
function rxOn_(sp, d) { return !!sp && sp.start <= d && (!sp.end || sp.end >= d); }
/** True for a viewer who may see cost totals but not individual pay (the executive). */
function rxCostOnly_(me) { return !canPayroll_(me); }
function rxNoRun_() { return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_run', count: 0 }] }; }
function rxEmpty_() { return { columns: [], rows: [], checks: [] }; }
/** Every day each person was employed in [from, to], from the day they joined to their last working day: fn(e, date, day). */
function rxDays_(emps, from, to, s, fn) {
  var list = emps.filter(function (e) { return e.status === 'active' || isoDate_(e.lastWorkingDay); });
  if (!list.length || from > to) return;
  var a = from;
  while (a <= to) {
    var b = minDate_(addDays_(a, 364), to), days = daysFor_(list, a, b, s), start = a; // daysFor_ stops at 400 days
    list.forEach(function (e) {
      var lwd = isoDate_(e.lastWorkingDay);
      days[e.id].forEach(function (d, i) { if (!d) return; var date = addDays_(start, i); if (lwd && date > lwd) return; fn(e, date, d); });
    });
    a = addDays_(b, 1);
  }
}
/** What a day counts as: present / absent (an expected working day), leave, off (rest day or holiday), restwork, upcoming. */
function rxKind_(d) {
  if (!d.workday) return d.firstIn ? 'restwork' : 'off';
  if (d.status === 'leave') return 'leave';
  if (d.status === 'upcoming') return 'upcoming';
  if (d.firstIn) return 'present';
  return d.status === 'absent' ? 'absent' : 'off';
}
/** Common Bradford trigger points (51 / 201 / 401). A prompt for a return-to-work talk, never a penalty by itself. */
function rxBradfordBand_(b) { return b > 400 ? 'high' : b > 200 ? 'concern' : b > 50 ? 'watch' : 'low'; }
function rxArrival_(diff, grace) { return diff <= -30 ? 'early_30' : diff < 0 ? 'early' : diff <= grace ? 'on_time' : diff <= 30 ? 'late_30' : diff <= 60 ? 'late_60' : 'late_over'; }
/** The months of a range365 report: whole calendar months from `from` to `to` (never past today), and the month before the first. */
function rxTrendMonths_(p) {
  var t = today_(), months = rxMonths_(p.from, minDate_(p.to, t));
  return months.length ? { months: months, from: rxAddMonth_(months[0], -1) + '-01', to: minDate_(monthLast_(months[months.length - 1]), t) } : null;
}

// ---------------- attendance ----------------
Object.assign(REPORT_FNS, {
  // Attendance rate per department and month, with the change from the month before (points and %).
  att_dept_trend: function (p, me, ctx, scope, s) {
    var tm = rxTrendMonths_(p); if (!tm) return rxEmpty_();
    var emps = reportEmps_(p, ctx, scope, true), by = {}, depts = {};
    rxDays_(emps, tm.from, tm.to, s, function (e, date, d) {
      var k = rxKind_(d); if (k !== 'present' && k !== 'absent') return;
      var dn = deptName_(e, ctx) || '-', key = dn + '|' + date.slice(0, 7), g = by[key] || (by[key] = { people: {}, expected: 0, present: 0, absent: 0, lateDays: 0 });
      depts[dn] = 1; g.people[e.id] = 1; g.expected++;
      if (k === 'present') { g.present++; if (d.lateMin) g.lateDays++; } else g.absent++;
    });
    var rows = [];
    Object.keys(depts).sort().forEach(function (dn) {
      tm.months.forEach(function (m) {
        var g = by[dn + '|' + m]; if (!g) return;
        var o = by[dn + '|' + rxAddMonth_(m, -1)], rate = pct_(g.present, g.expected), prev = o ? pct_(o.present, o.expected) : null;
        rows.push({ department: dn, month: m, headcount: Object.keys(g.people).length, expected: g.expected, present: g.present, absent: g.absent, lateDays: g.lateDays,
          attendance: rate, prevRate: prev, changePts: rxPts_(rate, prev), changePct: rxChg_(rate, prev, 1).changePct });
      });
    });
    var drops = rows.filter(function (r) { return r.changePts != null && r.changePts <= -5; }).length;
    return { columns: [col_('department', 'text', { group: true }), col_('month', 'text', { group: true }), col_('headcount', 'int'), col_('expected', 'int', { sum: true }),
      col_('present', 'int', { sum: true }), col_('absent', 'int', { sum: true }), col_('lateDays', 'int', { sum: true }), col_('attendance', 'pct'), col_('prevRate', 'pct'),
      col_('changePts', 'num'), col_('changePct', 'pct')], rows: rows,
      checks: drops ? [{ level: 'warn', code: 'att_drop', count: drops }] : [], chart: { type: 'bars', by: 'month', value: 'absent' } };
  },

  // On-time arrivals per month, with the mean, median and 90th percentile of the minutes late (lateness is right-skewed).
  att_punctuality: function (p, me, ctx, scope, s) {
    var tm = rxTrendMonths_(p); if (!tm) return rxEmpty_();
    var emps = reportEmps_(p, ctx, scope, true), by = {};
    rxDays_(emps, tm.from, tm.to, s, function (e, date, d) {
      if (rxKind_(d) !== 'present') return;
      var m = date.slice(0, 7), g = by[m] || (by[m] = { people: {}, present: 0, late: [] });
      g.people[e.id] = 1; g.present++; if (d.lateMin) g.late.push(d.lateMin);
    });
    var rate = function (g) { return g ? pct_(g.present - g.late.length, g.present) : null; }, rows = [];
    tm.months.forEach(function (m) {
      var g = by[m]; if (!g) return;
      var lm = g.late.reduce(function (a, b) { return a + b; }, 0), n = g.late.length, r = rate(g), pv = rate(by[rxAddMonth_(m, -1)]);
      rows.push({ month: m, headcount: Object.keys(g.people).length, present: g.present, onTime: g.present - n, lateDays: n, lateMin: lm,
        avgLate: n ? Math.round(lm / n) : 0, medianLate: n ? Math.round(waMedian_(g.late)) : 0, p90Late: n ? Math.round(rxQuant_(g.late, 0.9)) : 0,
        punctuality: r, prevRate: pv, changePts: rxPts_(r, pv), changePct: rxChg_(r, pv, 1).changePct });
    });
    var drops = rows.filter(function (r) { return r.changePts != null && r.changePts <= -5; }).length;
    return { columns: [col_('month', 'text'), col_('headcount', 'int'), col_('present', 'int', { sum: true }), col_('onTime', 'int', { sum: true }), col_('lateDays', 'int', { sum: true }),
      col_('lateMin', 'min', { sum: true }), col_('avgLate', 'min'), col_('medianLate', 'min'), col_('p90Late', 'min'), col_('punctuality', 'pct'), col_('prevRate', 'pct'),
      col_('changePts', 'num'), col_('changePct', 'pct')], rows: rows,
      checks: drops ? [{ level: 'warn', code: 'punct_drop', count: drops }] : [], chart: { type: 'hbar', label: 'month', value: 'punctuality', max: 100 } };
  },

  // Lateness per person, ranked by minutes, with the previous period; the top ten and their share of all minutes late.
  att_late_top: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), cur = {}, old = {};
    rxDays_(emps, pr.from, p.to, s, function (e, date, d) {
      if (rxKind_(d) !== 'present') return;
      var m = date >= p.from ? cur : old, x = m[e.id] || (m[e.id] = { present: 0, lateDays: 0, lateMin: 0, max: 0 });
      x.present++; if (d.lateMin) { x.lateDays++; x.lateMin += d.lateMin; if (d.lateMin > x.max) x.max = d.lateMin; }
    });
    var rows = emps.filter(function (e) { return cur[e.id] && cur[e.id].lateDays; }).map(function (e) {
      var x = cur[e.id], pv = old[e.id] ? old[e.id].lateMin : null, c = rxChg_(x.lateMin, pv, 0);
      return Object.assign(base_(e, ctx), { present: x.present, lateDays: x.lateDays, lateRate: pct_(x.lateDays, x.present), lateMin: x.lateMin,
        avgLate: Math.round(x.lateMin / x.lateDays), maxLate: x.max, prev: pv, change: c.change, changePct: c.changePct });
    }).sort(function (a, b) { return b.lateMin - a.lateMin || b.lateDays - a.lateDays; });
    rows.forEach(function (r, i) { r.rank = i + 1; r.top10 = i < 10 ? 'yes' : ''; });
    var all = rows.reduce(function (t, r) { return t + r.lateMin; }, 0), top = rows.slice(0, 10).reduce(function (t, r) { return t + r.lateMin; }, 0);
    return { columns: [col_('rank', 'int')].concat(EMP_COLS, [col_('present', 'int', { sum: true }), col_('lateDays', 'int', { sum: true }), col_('lateRate', 'pct'),
      col_('lateMin', 'min', { sum: true }), col_('avgLate', 'min'), col_('maxLate', 'min'), col_('prev', 'min', { sum: true }), col_('change', 'min', { sum: true }),
      col_('changePct', 'pct'), col_('top10', 'code', { group: true })]), rows: rows,
      checks: rows.length ? [{ level: 'info', code: 'late_top_share', count: Math.min(10, rows.length), value: pct_(top, all) }] : [],
      chart: { type: 'hbar', label: 'name', value: 'lateMin' } };
  },

  // Bradford factor = spells² x days of unexcused absence. A spell runs across rest days and holidays; a day present or on
  // approved leave ends it. The previous window of the same length shows the direction.
  att_bradford: function (p, me, ctx, scope, s) {
    var to = minDate_(p.to, today_()); if (p.from > to) return rxEmpty_();
    var pr = rxPrev_(p.from, to), emps = reportEmps_(p, ctx, scope, true), st = {};
    var fresh = function () { return { S: 0, D: 0, on: false, expected: 0, last: '' }; };
    rxDays_(emps, pr.from, to, s, function (e, date, d) {
      var x = st[e.id] || (st[e.id] = { c: fresh(), p: fresh() }), y = date >= p.from ? x.c : x.p, k = rxKind_(d);
      if (k === 'absent') { y.expected++; y.D++; if (!y.on) { y.S++; y.on = true; } y.last = date; }
      else if (k === 'present') { y.expected++; y.on = false; }
      else if (k === 'leave' || k === 'restwork') y.on = false;
    });
    var rows = [];
    emps.forEach(function (e) {
      var x = st[e.id]; if (!x || !x.c.expected) return;
      var b = x.c.S * x.c.S * x.c.D, pb = x.p.expected ? x.p.S * x.p.S * x.p.D : null;
      rows.push(Object.assign(base_(e, ctx), { expected: x.c.expected, spells: x.c.S, absent: x.c.D, bradford: b, band: rxBradfordBand_(b), prev: pb, change: rxChg_(b, pb, 0).change, lastAbsent: x.c.last }));
    });
    rows.sort(function (a, b) { return b.bradford - a.bradford || b.absent - a.absent; });
    var high = rows.filter(function (r) { return r.bradford > 200; }).length;
    return { columns: EMP_COLS.concat([col_('expected', 'int', { sum: true }), col_('spells', 'int', { sum: true }), col_('absent', 'int', { sum: true }), col_('bradford', 'int'),
      col_('band', 'code', { group: true }), col_('prev', 'int'), col_('change', 'int'), col_('lastAbsent', 'date')]), rows: rows,
      checks: high ? [{ level: 'warn', code: 'bradford_high', count: high }] : [], chart: { type: 'hbar', label: 'name', value: 'bradford' } };
  },

  // Absence and lateness by day of the week against the previous period; a day with twice the others' absence is flagged.
  att_weekday: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), c = [], o = [];
    for (var i = 0; i < 7; i++) { c.push({ expected: 0, present: 0, absent: 0, lateDays: 0, lateMin: 0 }); o.push({ expected: 0, present: 0, absent: 0, lateDays: 0, lateMin: 0 }); }
    rxDays_(emps, pr.from, p.to, s, function (e, date, d) {
      var k = rxKind_(d); if (k !== 'present' && k !== 'absent') return;
      var w = (date >= p.from ? c : o)[dow_(date)];
      w.expected++;
      if (k === 'absent') w.absent++; else { w.present++; if (d.lateMin) { w.lateDays++; w.lateMin += d.lateMin; } }
    });
    var rows = [];
    c.forEach(function (w, i) {
      if (!w.expected) return;
      var ar = pct_(w.absent, w.expected), lr = pct_(w.lateDays, w.present), pa = o[i].expected ? pct_(o[i].absent, o[i].expected) : null, pl = o[i].present ? pct_(o[i].lateDays, o[i].present) : null;
      rows.push({ weekday: RX_DOW[i], expected: w.expected, present: w.present, absent: w.absent, lateDays: w.lateDays, absentRate: ar, lateRate: lr,
        avgLate: w.lateDays ? Math.round(w.lateMin / w.lateDays) : 0, prevAbsentRate: pa, absentChange: rxPts_(ar, pa), prevLateRate: pl, lateChange: rxPts_(lr, pl) });
    });
    var spikes = rows.filter(function (r) {
      var others = rows.filter(function (x) { return x !== r; }), ex = others.reduce(function (t, x) { return t + x.expected; }, 0), ab = others.reduce(function (t, x) { return t + x.absent; }, 0);
      return r.absent >= 3 && ex > 0 && r.absentRate >= 2 * (ab / ex * 100);
    }).length;
    return { columns: [col_('weekday', 'code'), col_('expected', 'int', { sum: true }), col_('present', 'int', { sum: true }), col_('absent', 'int', { sum: true }),
      col_('lateDays', 'int', { sum: true }), col_('absentRate', 'pct'), col_('lateRate', 'pct'), col_('avgLate', 'min'), col_('prevAbsentRate', 'pct'), col_('absentChange', 'num'),
      col_('prevLateRate', 'pct'), col_('lateChange', 'num')], rows: rows,
      checks: spikes ? [{ level: 'warn', code: 'weekday_spike', count: spikes }] : [], chart: { type: 'bars', by: 'weekday', value: 'absent' } };
  },

  // First check-in of each working day against the shift start, in bands, per department; share and the previous period.
  att_checkin_bands: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), by = {}, grace = Number(s.graceMin) || 0, lateN = 0, allN = 0;
    rxDays_(emps, pr.from, p.to, s, function (e, date, d) {
      if (!d.workday || !d.firstIn) return;
      var b = rxArrival_(localParts_(new Date(d.firstIn)).minutes - hmToMin_(d.shiftStart), grace), dn = deptName_(e, ctx) || '-';
      var g = by[dn] || (by[dn] = { c: {}, p: {}, cn: 0, pn: 0 });
      if (date >= p.from) { g.c[b] = (g.c[b] || 0) + 1; g.cn++; allN++; if (b.indexOf('late') === 0) lateN++; } else { g.p[b] = (g.p[b] || 0) + 1; g.pn++; }
    });
    var rows = [];
    Object.keys(by).sort().forEach(function (dn) {
      var g = by[dn];
      RX_ARRIVAL.forEach(function (b) {
        var n = g.c[b] || 0, pv = g.p[b] || 0; if (!n && !pv) return;
        var sh = pct_(n, g.cn), ps = pct_(pv, g.pn);
        rows.push({ department: dn, band: b, arrivals: n, share: sh, prev: g.pn ? pv : null, prevShare: ps, changePts: rxPts_(sh, ps) });
      });
    });
    return { columns: [col_('department', 'text', { group: true }), col_('band', 'code', { group: true }), col_('arrivals', 'int', { sum: true }), col_('share', 'pct'),
      col_('prev', 'int', { sum: true }), col_('prevShare', 'pct'), col_('changePts', 'num')], rows: rows,
      checks: allN ? [{ level: lateN ? 'warn' : 'info', code: 'late_arrivals', count: lateN, value: pct_(lateN, allN) }] : [], chart: { type: 'bars', by: 'band', value: 'arrivals' } };
  },

  // Days a check-in was left without a check-out, per person, with the rate and the previous period.
  att_missing_out: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), cur = {}, old = {};
    rxDays_(emps, pr.from, p.to, s, function (e, date, d) {
      if (!d.firstIn) return;
      var m = date >= p.from ? cur : old, x = m[e.id] || (m[e.id] = { present: 0, missing: 0, dates: [] });
      x.present++; if (d.status === 'missing_out') { x.missing++; x.dates.push(date); }
    });
    var rows = emps.filter(function (e) { return cur[e.id] && cur[e.id].missing; }).map(function (e) {
      var x = cur[e.id], pv = old[e.id] ? old[e.id].missing : null;
      return Object.assign(base_(e, ctx), { present: x.present, missingOut: x.missing, missingRate: pct_(x.missing, x.present), prev: pv, change: rxChg_(x.missing, pv, 0).change,
        lastDate: x.dates[x.dates.length - 1], detail: x.dates.slice(-6).join(', ') });
    }).sort(function (a, b) { return b.missingOut - a.missingOut; });
    var total = rows.reduce(function (t, r) { return t + r.missingOut; }, 0), repeat = rows.filter(function (r) { return r.missingOut >= 3; }).length;
    return { columns: EMP_COLS.concat([col_('present', 'int', { sum: true }), col_('missingOut', 'int', { sum: true }), col_('missingRate', 'pct'), col_('prev', 'int', { sum: true }),
      col_('change', 'int', { sum: true }), col_('lastDate', 'date'), col_('detail')]), rows: rows,
      checks: [total ? { level: 'warn', code: 'missing_out', count: total } : null, repeat ? { level: 'warn', code: 'missing_out_repeat', count: repeat } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'name', value: 'missingOut' } };
  },

  // App punches by risk flag: how many, how many people, what the review decided, the average risk, and the previous period.
  att_flags: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), ids = {}, by = {}, app = 0, pending = 0;
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = 1; });
    readAll_(SHEETS.PUNCH).forEach(function (pn) {
      var d = String(pn.date).slice(0, 10), src = String(pn.source || '');
      if (!ids[pn.empId] || d < pr.from || d > p.to || src.indexOf('hr:') === 0 || src.indexOf('request:') === 0) return; // manual punches carry no flags
      var cur = d >= p.from;
      if (cur) { app++; if (pn.status === 'review') pending++; }
      String(pn.flags || '').split(',').map(function (x) { return x.trim(); }).filter(String).forEach(function (f) {
        var g = by[f] || (by[f] = { punches: 0, people: {}, review: 0, approved: 0, rejected: 0, risk: 0, prev: 0 });
        if (!cur) { g.prev++; return; }
        g.punches++; g.people[pn.empId] = 1; g.risk += Number(pn.risk) || 0;
        if (pn.status === 'review') g.review++; else if (pn.status === 'approved') g.approved++; else if (pn.status === 'rejected') g.rejected++;
      });
    });
    var rows = Object.keys(by).map(function (f) {
      var g = by[f], c = rxChg_(g.punches, g.prev, 0);
      return { flag: f, punches: g.punches, people: Object.keys(g.people).length, share: pct_(g.punches, app), pendingReview: g.review, approvedN: g.approved, rejectedN: g.rejected,
        avgRisk: g.punches ? r1_(g.risk / g.punches) : null, prev: g.prev, change: c.change, changePct: c.changePct };
    }).sort(function (a, b) { return b.punches - a.punches || b.prev - a.prev; });
    return { columns: [col_('flag', 'code', { group: true }), col_('punches', 'int', { sum: true }), col_('people', 'int'), col_('share', 'pct'), col_('pendingReview', 'int', { sum: true }),
      col_('approvedN', 'int', { sum: true }), col_('rejectedN', 'int', { sum: true }), col_('avgRisk', 'num'), col_('prev', 'int', { sum: true }), col_('change', 'int', { sum: true }),
      col_('changePct', 'pct')], rows: rows, checks: pending ? [{ level: 'warn', code: 'punch_review', count: pending }] : [], chart: { type: 'bars', by: 'flag', value: 'punches' } };
  },

  // Overtime from the punches: working-day and rest-day hours per person (departments as subtotals), the previous period,
  // and for the hr role and payroll an Art. 107 cost estimate (hourly wage + 50% of the basic hourly wage).
  att_overtime: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), money = canPayroll_(me), comps = money ? currentCompMap_(minDate_(p.to, today_())) : {}, st = {};
    rxDays_(emps, pr.from, p.to, s, function (e, date, d) {
      if (!d.overtimeMin) return;
      var x = st[e.id] || (st[e.id] = { days: 0, work: 0, rest: 0, prev: 0 });
      if (date < p.from) { x.prev += d.overtimeMin; return; }
      x.days++; if (d.workday) x.work += d.overtimeMin; else x.rest += d.overtimeMin;
    });
    var cap = RX_OT_YEAR_HOURS * (daysBetween_(p.from, p.to) + 1) / 365, over = 0, rows = [];
    emps.forEach(function (e) {
      var x = st[e.id]; if (!x || !(x.work + x.rest + x.prev)) return;
      var mins = x.work + x.rest, h = r1_(mins / 60), pv = r1_(x.prev / 60), c = rxChg_(h, pv, 1);
      if (h > cap) over++;
      var row = Object.assign(base_(e, ctx), { otDays: x.days, workdayOt: r1_(x.work / 60), restOt: r1_(x.rest / 60), overtime: h, prev: pv, change: c.change, changePct: c.changePct });
      if (money) { var k = comps[e.id], dh = Number(e.dailyHours) || 8; row.estCost = k ? r2_(mins / 60 * (k.total / 30 / dh + k.basic / 30 / dh * 0.5)) : null; }
      rows.push(row);
    });
    rows.sort(function (a, b) { return b.overtime - a.overtime; });
    var cols = EMP_COLS.concat([col_('otDays', 'int', { sum: true }), col_('workdayOt', 'hours', { sum: true }), col_('restOt', 'hours', { sum: true }), col_('overtime', 'hours', { sum: true }),
      col_('prev', 'hours', { sum: true }), col_('change', 'hours', { sum: true }), col_('changePct', 'pct')]);
    if (money) cols.push(col_('estCost', 'money', { sum: true }));
    return { columns: cols, rows: rows, checks: [over ? { level: 'warn', code: 'ot_over_cap', count: over } : null, money && rows.length ? { level: 'info', code: 'ot_estimate', count: rows.length } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'name', value: 'overtime' } };
  }
});

// ---------------- leave ----------------
/** The day annual leave starts to accrue in this system (as annualBalance_): after the opening date, else the day they joined. */
function rxLeaveStart_(e) { return e.leaveOpeningDate !== '' && e.leaveOpeningDate != null ? addDays_(String(e.leaveOpeningDate).slice(0, 10), 1) : joinedDate_(e); }
/** Approved leave per person, read once. */
function rxLeaveByEmp_(reqs, statuses) {
  var by = {};
  reqs.forEach(function (r) { if (r.type === 'leave' && statuses.indexOf(r.status) >= 0) (by[r.empId] = by[r.empId] || []).push(r); });
  return by;
}
/** True when every day strictly between a and b is a rest day or a public holiday for this person (a sick spell runs on). */
function rxGapOff_(e, a, b, hol, s) {
  var wd = shiftOf_(e, s).workdays;
  for (var d = addDays_(a, 1), i = 0; d < b && i < 30; d = addDays_(d, 1), i++) if (!hol[d] && wd.indexOf(dow_(d)) >= 0) return false;
  return i < 30;
}

Object.assign(REPORT_FNS, {
  // Annual leave taken against the leave earned in the period, per department; sick and other leave beside it; the period before.
  leave_util_dept: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), emps = reportEmps_(p, ctx, scope, true), hol = holidayMap_(), mine = rxLeaveByEmp_(readAll_(SHEETS.REQ), ['approved']), by = {};
    var win = function (e, a, b) { var sp = rxSpan_(e); if (!sp) return null; var x = maxDate_(rxLeaveStart_(e), a), y = sp.end ? minDate_(sp.end, b) : b; return x <= y ? [x, y] : null; };
    var used = function (e, w, sub) { // days of approved leave inside the window: one type, or '' for every type except annual and sick
      return (mine[e.id] || []).reduce(function (t, r) {
        if (sub ? r.subtype !== sub : (r.subtype === 'annual' || r.subtype === 'sick')) return t;
        var a = maxDate_(String(r.fromDate).slice(0, 10), w[0]), b = minDate_(String(r.toDate).slice(0, 10), w[1]);
        return a <= b ? t + countLeaveDays_(e, r.subtype, a, b, hol, s).days : t;
      }, 0);
    };
    emps.forEach(function (e) {
      var w = win(e, p.from, p.to), pw = win(e, pr.from, pr.to); if (!w && !pw) return;
      var dn = deptName_(e, ctx) || '-', g = by[dn] || (by[dn] = { headcount: 0, earned: 0, taken: 0, sick: 0, other: 0, none: 0, pe: 0, pt: 0 });
      if (w) {
        var taken = used(e, w, 'annual');
        g.headcount++; g.earned += accrueBetween_(e, w[0], w[1]); g.taken += taken; g.sick += used(e, w, 'sick'); g.other += used(e, w, '');
        if (!taken && daysBetween_(w[0], w[1]) >= 89) g.none++;
      }
      if (pw) { g.pe += accrueBetween_(e, pw[0], pw[1]); g.pt += used(e, pw, 'annual'); }
    });
    var rows = Object.keys(by).sort().map(function (dn) {
      var g = by[dn], earned = r2_(g.earned), taken = r2_(g.taken), u = pct_(taken, earned), pu = g.pe ? pct_(r2_(g.pt), r2_(g.pe)) : null;
      return { department: dn, headcount: g.headcount, earned: earned, taken: taken, utilisation: u, sickDays: g.sick, otherDays: g.other, noLeave: g.none, prevRate: pu, changePts: rxPts_(u, pu) };
    }).filter(function (r) { return r.headcount; });
    var none = rows.reduce(function (t, r) { return t + r.noLeave; }, 0);
    return { columns: [col_('department'), col_('headcount', 'int', { sum: true }), col_('earned', 'days', { sum: true }), col_('taken', 'days', { sum: true }), col_('utilisation', 'pct'),
      col_('sickDays', 'days', { sum: true }), col_('otherDays', 'days', { sum: true }), col_('noLeave', 'int', { sum: true }), col_('prevRate', 'pct'), col_('changePts', 'num')], rows: rows,
      checks: none ? [{ level: 'warn', code: 'no_annual_leave', count: none }] : [], chart: { type: 'hbar', label: 'department', value: 'utilisation', max: 100 } };
  },

  // Approved leave days by type and calendar month, with the month before.
  leave_type_month: function (p, me, ctx, scope, s) {
    var months = rxMonths_(p.from, p.to); if (!months.length) return rxEmpty_();
    var all = [rxAddMonth_(months[0], -1)].concat(months), ids = {}, hol = holidayMap_(), by = {}, types = {};
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.REQ).forEach(function (r) {
      var e = ids[r.empId];
      if (!e || r.type !== 'leave' || r.status !== 'approved' || (p.leaveType && r.subtype !== p.leaveType)) return;
      var f = String(r.fromDate).slice(0, 10), t = String(r.toDate).slice(0, 10);
      all.forEach(function (m) {
        var a = maxDate_(f, m + '-01'), b = minDate_(t, monthLast_(m)); if (a > b) return;
        var g = by[r.subtype + '|' + m] || (by[r.subtype + '|' + m] = { requests: 0, people: {}, days: 0 });
        types[r.subtype] = 1; g.days += countLeaveDays_(e, r.subtype, a, b, hol, s).days; g.people[r.empId] = 1;
        if (f.slice(0, 7) === m) g.requests++;
      });
    });
    var rows = [];
    Object.keys(types).sort().forEach(function (k) {
      months.forEach(function (m) {
        var g = by[k + '|' + m], o = by[k + '|' + rxAddMonth_(m, -1)]; if (!g) return;
        var c = rxChg_(g.days, o ? o.days : 0, 2);
        rows.push({ leaveType: k, month: m, requests: g.requests, people: Object.keys(g.people).length, days: g.days, prev: o ? o.days : 0, change: c.change, changePct: c.changePct });
      });
    });
    return { columns: [col_('leaveType', 'code', { group: true }), col_('month', 'text', { group: true }), col_('requests', 'int', { sum: true }), col_('people', 'int'),
      col_('days', 'days', { sum: true }), col_('prev', 'days', { sum: true }), col_('change', 'days', { sum: true }), col_('changePct', 'pct')], rows: rows,
      chart: { type: 'bars', by: 'leaveType', value: 'days' } };
  },

  // Approved and pending leave in the next `days` days, with the busiest day of the department while each person is away.
  leave_upcoming: function (p, me, ctx, scope, s) {
    var t = today_(), end = addDays_(t, p.days), ids = {}, head = {}, away = {}, rows = [];
    reportEmps_(p, ctx, scope).forEach(function (e) { ids[e.id] = e; });
    Object.keys(ctx.emps).forEach(function (k) { var e = ctx.emps[k]; if (e.status === 'active') { var dn = deptName_(e, ctx) || '-'; head[dn] = (head[dn] || 0) + 1; } });
    var list = readAll_(SHEETS.REQ).filter(function (r) {
      var e = ctx.emps[r.empId];
      return e && e.status === 'active' && r.type === 'leave' && (r.status === 'approved' || r.status === 'pending') && String(r.toDate).slice(0, 10) >= t && String(r.fromDate).slice(0, 10) <= end;
    });
    var span = function (r, fn) { for (var d = maxDate_(String(r.fromDate).slice(0, 10), t), i = 0; d <= minDate_(String(r.toDate).slice(0, 10), end) && i < 370; d = addDays_(d, 1), i++) fn(d); };
    list.forEach(function (r) { var dn = deptName_(ctx.emps[r.empId], ctx) || '-'; span(r, function (d) { (away[dn + '|' + d] = away[dn + '|' + d] || {})[r.empId] = 1; }); });
    list.forEach(function (r) {
      var e = ids[r.empId]; if (!e) return;
      var dn = deptName_(e, ctx) || '-', peak = 0, f = String(r.fromDate).slice(0, 10);
      span(r, function (d) { peak = Math.max(peak, Object.keys(away[dn + '|' + d] || {}).length); });
      rows.push(Object.assign(base_(e, ctx), { ref: r.ref, leaveType: r.subtype, fromDate: f, toDate: String(r.toDate).slice(0, 10), days: Number(r.days) || 0, status: r.status,
        startsIn: daysBetween_(t, f), peakAway: peak, deptHeadcount: head[dn] || 0, peakShare: pct_(peak, head[dn] || 0) }));
    });
    rows.sort(function (a, b) { return a.fromDate < b.fromDate ? -1 : a.fromDate > b.fromDate ? 1 : 0; });
    var clash = rows.filter(function (r) { return r.peakAway >= 2 && r.peakShare >= 30; }).length, pend = rows.filter(function (r) { return r.status === 'pending'; }).length;
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('leaveType', 'code', { group: true }), col_('fromDate', 'date'), col_('toDate', 'date'), col_('days', 'days', { sum: true }),
      col_('status', 'status', { group: true }), col_('startsIn', 'int'), col_('peakAway', 'int'), col_('deptHeadcount', 'int'), col_('peakShare', 'pct')]), rows: rows,
      checks: [clash ? { level: 'warn', code: 'leave_overlap', count: clash } : null, pend ? { level: 'info', code: 'leave_pending', count: pend } : null].filter(Boolean),
      chart: { type: 'bars', by: 'leaveType', value: 'days' } };
  },

  // Bradford factor of certified sick leave: approved sick requests, a spell running on over rest days and holidays.
  leave_sick_bradford: function (p, me, ctx, scope, s) {
    var t = today_(), to = minDate_(p.to, t); if (p.from > to) return rxEmpty_();
    var pr = rxPrev_(p.from, to), emps = reportEmps_(p, ctx, scope, true), hol = holidayMap_(), reqs = readAll_(SHEETS.REQ), sick = {}, rows = [];
    reqs.forEach(function (r) { if (r.type === 'leave' && r.subtype === 'sick' && r.status === 'approved') (sick[r.empId] = sick[r.empId] || []).push(r); });
    emps.forEach(function (e) {
      var spells = [], parts = (sick[e.id] || []).map(function (r) { return [maxDate_(String(r.fromDate).slice(0, 10), pr.from), minDate_(String(r.toDate).slice(0, 10), to)]; })
        .filter(function (x) { return x[0] <= x[1]; }).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
      parts.forEach(function (x) { var l = spells[spells.length - 1]; if (l && (x[0] <= addDays_(l[1], 1) || rxGapOff_(e, l[1], x[0], hol, s))) { if (x[1] > l[1]) l[1] = x[1]; } else spells.push(x.slice()); });
      // S = merged spells touching the window; D = the sick days themselves (the rest days bridged between two certificates do not count)
      var w = function (a, b) {
        var S = spells.filter(function (x) { return maxDate_(x[0], a) <= minDate_(x[1], b); }).length, D = 0;
        parts.forEach(function (x) { var u = maxDate_(x[0], a), v = minDate_(x[1], b); if (u <= v) D += daysBetween_(u, v) + 1; });
        return { S: S, D: D, B: S * S * D };
      };
      var c = w(p.from, to), o = w(pr.from, pr.to); if (!c.D && !o.D) return;
      var mine = reqs.filter(function (r) { return r.empId === e.id; }), used = sickSplit_(e.id, t, 0, mine, null).usedBefore;
      rows.push(Object.assign(base_(e, ctx), { spells: c.S, sickDays: c.D, bradford: c.B, band: rxBradfordBand_(c.B), prev: o.B, change: c.B - o.B, fullPayLeft: Math.max(0, SICK_TIERS[0] - used) }));
    });
    rows.sort(function (a, b) { return b.bradford - a.bradford; });
    var high = rows.filter(function (r) { return r.bradford > 200; }).length;
    return { columns: EMP_COLS.concat([col_('spells', 'int', { sum: true }), col_('sickDays', 'days', { sum: true }), col_('bradford', 'int'), col_('band', 'code', { group: true }),
      col_('prev', 'int'), col_('change', 'int'), col_('fullPayLeft', 'days')]), rows: rows,
      checks: high ? [{ level: 'warn', code: 'bradford_high', count: high }] : [], chart: { type: 'hbar', label: 'name', value: 'bradford' } };
  },

  // Annual balances projected to 31 December: what is left after approved and pending leave, and what exceeds one year's
  // entitlement (a carry-over guide, not a legal cap), with the days a month to plan and, for the hr role and payroll, its value.
  leave_yearend_risk: function (p, me, ctx, scope, s) {
    var ye = p.asOf.slice(0, 4) + '-12-31', emps = reportEmps_(p, ctx, scope), mine = {}, money = canPayroll_(me), comps = money ? currentCompMap_(p.asOf) : {}, rows = [], missing = 0;
    readAll_(SHEETS.REQ).forEach(function (r) { (mine[r.empId] = mine[r.empId] || []).push(r); });
    var monthsLeft = Math.max(1, (daysBetween_(p.asOf, ye) + 1) / 30.4375);
    emps.forEach(function (e) {
      var now = annualBalance_(e, p.asOf, mine[e.id] || [], null), end = annualBalance_(e, ye, mine[e.id] || [], null);
      if (now.openingMissing) missing++;
      var excess = r2_(Math.max(0, end.available - end.perYear)), row = Object.assign(base_(e, ctx), { perYear: end.perYear, available: now.available, toAccrue: r2_(end.accrued - now.accrued),
        projected: end.available, excess: excess, perMonth: r2_(excess / monthsLeft), risk: excess > 0 ? 'high' : end.available > end.perYear * 0.75 ? 'watch' : 'ok' });
      if (money) row.liability = comps[e.id] ? r2_(excess * comps[e.id].total / 30) : null;
      rows.push(row);
    });
    rows.sort(function (a, b) { return b.excess - a.excess || b.projected - a.projected; });
    var high = rows.filter(function (r) { return r.risk === 'high'; }).length;
    var cols = EMP_COLS.concat([col_('perYear', 'int'), col_('available', 'days', { sum: true }), col_('toAccrue', 'days', { sum: true }), col_('projected', 'days', { sum: true }),
      col_('excess', 'days', { sum: true }), col_('perMonth', 'days'), col_('risk', 'code', { group: true })]);
    if (money) cols.push(col_('liability', 'money', { sum: true }));
    return { columns: cols, rows: rows, checks: [high ? { level: 'warn', code: 'yearend_excess', count: high } : null, missing ? { level: 'warn', code: 'opening_missing', count: missing } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'name', value: 'projected' } };
  },

  // The unused annual leave liability at each month end (balance x package / 30), totals only, with the month before.
  // Leave counts on the month end only if it started by then; a cost-only viewer sees no amount for fewer than RX_MIN_GROUP people.
  leave_liability_trend: function (p, me, ctx, scope, s) {
    var tm = rxTrendMonths_(p); if (!tm) return rxEmpty_();
    var t = today_(), emps = reportEmps_(p, ctx, scope, true), comps = readAll_(SHEETS.COMP), mine = {}, hide = rxCostOnly_(me), hidden = 0;
    readAll_(SHEETS.REQ).forEach(function (r) { (mine[r.empId] = mine[r.empId] || []).push(r); });
    var at = function (d) {
      var o = { hc: 0, days: 0, liab: 0 };
      emps.forEach(function (e) {
        if (!rxOn_(rxSpan_(e), d) || d < joinedDate_(e)) return;
        if (e.leaveOpeningDate !== '' && e.leaveOpeningDate != null && d < String(e.leaveOpeningDate).slice(0, 10)) return;
        var c = compOn_(e.id, d, comps); if (!c) return;
        var b = Math.max(0, annualBalance_(e, d, (mine[e.id] || []).filter(function (r) { return String(r.fromDate).slice(0, 10) <= d; }), null).balance);
        o.hc++; o.days += b; o.liab += b * c.total / 30;
      });
      o.days = r2_(o.days); o.liab = r2_(o.liab);
      return o;
    };
    var vals = {};
    [rxAddMonth_(tm.months[0], -1)].concat(tm.months).forEach(function (m) { vals[m] = at(minDate_(monthLast_(m), t)); });
    var rows = tm.months.map(function (m) {
      var v = vals[m], o = vals[rxAddMonth_(m, -1)], c = rxChg_(v.liab, o.hc ? o.liab : null);
      var row = { month: m, date: minDate_(monthLast_(m), t), headcount: v.hc, leaveDays: v.days, liability: v.liab, perHead: v.hc ? r2_(v.liab / v.hc) : null, prev: c.prev, change: c.change, changePct: c.changePct };
      if (hide && (v.hc < RX_MIN_GROUP || (o.hc && o.hc < RX_MIN_GROUP))) { ['liability', 'perHead', 'prev', 'change', 'changePct'].forEach(function (k) { row[k] = null; }); hidden++; }
      return row;
    });
    return { columns: [col_('month', 'text'), col_('date', 'date'), col_('headcount', 'int'), col_('leaveDays', 'days'), col_('liability', 'money'), col_('perHead', 'money'),
      col_('prev', 'money'), col_('change', 'money'), col_('changePct', 'pct')], rows: rows,
      checks: hidden ? [{ level: 'info', code: 'small_group_hidden', count: hidden }] : [], chart: { type: 'hbar', label: 'month', value: 'liability' } };
  }
});

// ---------------- payroll ----------------
/** The chosen run (else the latest) and the last locked run before it. */
function rxRunPair_(p) {
  var runs = readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }), run = runs.filter(function (r) { return r.id === p.run; })[0] || currentRun_();
  if (!run) return null;
  p.run = run.id;
  var prev = runs.filter(function (r) { return r.status === 'locked' && r.month < run.month && runScope_(r) === runScope_(run); }).sort(function (a, b) { return a.month < b.month ? 1 : -1; })[0] || null;
  return { run: run, prev: prev, runs: runs };
}
/** Payslips of the given runs, { runId: { empId: slip } }, after the department filter: one read of the tab. */
function rxSlipsBy_(runIds, ds, ctx) {
  var out = {};
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (!runIds[sl.runId] || sl.status === 'void') return;
    var e = ctx.emps[sl.empId]; if (ds && (!e || !ds[e.departmentId])) return;
    (out[sl.runId] = out[sl.runId] || {})[sl.empId] = sl;
  });
  return out;
}
function rxInfo_(sl) { return parseJson_(sl.infoJson, {}); }
/** A payslip's lines by code (allowances by their name), amounts and overtime hours added up. */
function rxLines_(sl) {
  var m = {};
  if (sl) lines_(sl).forEach(function (l) {
    var k = l.code === 'allowance' ? 'allowance|' + (l.label || '') : l.code, x = m[k] || (m[k] = { code: l.code, label: l.code === 'allowance' ? (l.label || '') : '', kind: l.kind, amount: 0, hours: 0 });
    x.amount = r2_(x.amount + (Number(l.amount) || 0)); x.hours += Number(l.hours) || 0;
  });
  return m;
}
function rxHas_(v) { return v !== undefined && v !== null && v !== ''; }
function rxErGosi_(sl) { return Number(rxHas_(sl.employerGosi) ? sl.employerGosi : sl.gosiEmployer) || 0; }
/** The month's end-of-service provision: the payslip's own eosAccrual, else the same formula as calcSlip_. */
function rxEos_(e, sl, s) {
  if (rxHas_(sl.eosAccrual)) return Number(sl.eosAccrual) || 0;
  var inf = rxInfo_(sl).info || {}, pk = inf.package, hire = e ? (isoDate_(e.hireDate) || joinedDate_(e)) : '', to = inf.to || monthLast_(String(sl.month));
  if (!pk || !hire) return 0;
  var wage = Number(inf.monthly) || 0; // Art. 2 + 84: actual wage
  var years = Math.max(0, (Date.parse(to) - Date.parse(hire)) / (365.25 * 864e5));
  return r2_((years >= 5 ? wage / 12 : wage / 24) * (Number(sl.paidDays) || 0) / 30);
}
/** What the month cost the company for one payslip: gross + employer GOSI + the end-of-service provision. */
function rxCost_(e, sl, s) { return rxHas_(sl.companyCost) && Number(sl.companyCost) ? Number(sl.companyCost) : r2_((Number(sl.gross) || 0) + rxErGosi_(sl) + rxEos_(e, sl, s)); }
/** For a cost-only viewer, empties the money keys of a group smaller than RX_MIN_GROUP; true when it did. */
function rxHide_(me, row, n, keys) {
  if (!rxCostOnly_(me) || !(n > 0 && n < RX_MIN_GROUP)) return false;
  keys.forEach(function (k) { row[k] = null; });
  return true;
}
/** Runs by month for a range365 report, the month before the first included, and their payslips. */
function rxRunsByMonth_(p, ctx) {
  var months = rxMonths_(p.from, p.to); if (!months.length) return null;
  var first = rxAddMonth_(months[0], -1), runs = {}, ids = {};
  runsRealFirst_(readAll_(SHEETS.RUN)).forEach(function (r) { if (r.status !== 'cancelled' && r.month >= first && r.month <= months[months.length - 1]) { runs[r.month] = r; ids[r.id] = 1; } });
  return { months: months, runs: runs, slips: rxSlipsBy_(ids, deptSet_(p, ctx), ctx) };
}

Object.assign(REPORT_FNS, {
  // Each payslip line that moved against the last locked run, for everyone whose net moved by the threshold or more:
  // the line's effect on net (deductions count against it), its share of the net change, and the line that drove it.
  pay_var_lines: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    if (!rp.prev) return { columns: [], rows: [], run: publicRun_(rp.run), checks: [{ level: 'info', code: 'no_previous_run', count: 0 }] };
    var ids = {}; ids[rp.run.id] = 1; ids[rp.prev.id] = 1;
    var by = rxSlipsBy_(ids, deptSet_(p, ctx), ctx), cur = by[rp.run.id] || {}, old = by[rp.prev.id] || {}, groups = [], flagged = 0;
    Object.keys(cur).concat(Object.keys(old).filter(function (k) { return !cur[k]; })).forEach(function (k) {
      var e = ctx.emps[k]; if (!e) return;
      var a = old[k], b = cur[k], na = a ? Number(a.net) : 0, nb = b ? Number(b.net) : 0, net = r2_(nb - na), pc = a && na ? r1_((nb - na) / Math.abs(na) * 100) : null;
      var flag = !a ? 'new' : !b ? 'missing' : Math.abs(pc || 0) >= p.threshold ? 'changed' : 'same';
      if (flag === 'same') return;
      flagged++;
      var la = rxLines_(a), lb = rxLines_(b), keys = {}, list = [];
      Object.keys(la).concat(Object.keys(lb)).forEach(function (x) { keys[x] = 1; });
      Object.keys(keys).forEach(function (x) {
        var u = la[x], v = lb[x], pa = u ? u.amount : 0, pb = v ? v.amount : 0, d = r2_(pb - pa); if (!d) return;
        var l = v || u, eff = r2_(l.kind === 'deduction' ? -d : d);
        list.push(Object.assign(base_(e, ctx), { flag: flag, line: l.code, label: l.label, prev: pa, amount: pb, change: d, effect: eff, netChange: net, share: net ? r1_(eff / net * 100) : null, driver: '' }));
      });
      list.sort(function (x, y) { return Math.abs(y.effect) - Math.abs(x.effect); });
      if (list.length) { list[0].driver = 'yes'; groups.push({ net: net, list: list }); }
    });
    groups.sort(function (x, y) { return Math.abs(y.net) - Math.abs(x.net); });
    var rows = [].concat.apply([], groups.map(function (g) { return g.list; }));
    return { columns: EMP_COLS.concat([col_('flag', 'status', { group: true }), col_('line', 'code', { group: true }), col_('label'), col_('prev', 'money'), col_('amount', 'money'),
      col_('change', 'money'), col_('effect', 'money', { sum: true }), col_('netChange', 'money'), col_('share', 'pct'), col_('driver', 'code')]), rows: rows,
      run: publicRun_(rp.run), previous: publicRun_(rp.prev), checks: [{ level: flagged ? 'warn' : 'info', code: 'variance_flagged', count: flagged, value: p.threshold }],
      chart: { type: 'bars', by: 'line', value: 'count' } };
  },

  // GOSI by cohort (legacy, new law from July 2024, non-Saudi): contributory wage, rates, employee and employer shares,
  // share of the total and the last locked run.
  pay_gosi_cohort: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var ids = {}; ids[rp.run.id] = 1; if (rp.prev) ids[rp.prev.id] = 1;
    var by = rxSlipsBy_(ids, deptSet_(p, ctx), ctx), cur = {}, old = {}, noPkg = 0, missing = 0, capped = 0, hidden = 0;
    var add = function (map, sl, isCur) {
      var x = rxInfo_(sl), gi = (x.info || {}).gosi; if (!gi) { if (isCur) noPkg++; return; }
      var k = gi.cohort || 'legacy', o = map[k] || (map[k] = { people: 0, base: 0, employee: 0, employer: 0, empRate: gi.empRate, erRate: gi.erRate });
      o.people++; o.base += Number(gi.base) || 0; o.employee += Number(sl.gosiEmployee) || 0; o.employer += rxErGosi_(sl);
      if (isCur) {
        if ((x.warnings || []).indexOf('gosi_cohort_missing') >= 0) missing++;
        var w = Number(gi.registered) || Number(gi.packageWage) || ((x.info.package || {}).basic || 0) + ((x.info.package || {}).housing || 0); if (w > GOSI_MAX) capped++;
      }
    };
    var each = function (id, map, isCur) { var m = by[id] || {}; Object.keys(m).forEach(function (k) { add(map, m[k], isCur); }); };
    each(rp.run.id, cur, true); if (rp.prev) each(rp.prev.id, old, false);
    var rows = ['legacy', 'new', 'non_saudi'].filter(function (k) { return cur[k] || old[k]; }).map(function (k) {
      var o = cur[k] || { people: 0, base: 0, employee: 0, employer: 0 }, q = old[k], tot = r2_(o.employee + o.employer), pt = q ? r2_(q.employee + q.employer) : rp.prev ? 0 : null, c = rxChg_(tot, pt);
      var row = { cohort: k, headcount: o.people, base: r2_(o.base), employeeRate: o.empRate == null ? null : o.empRate, employee: r2_(o.employee), employerRate: o.erRate == null ? null : o.erRate,
        employer: r2_(o.employer), total: tot, share: null, prev: pt, change: c.change, changePct: c.changePct };
      var keys = ['base', 'employee', 'employer', 'total', 'prev', 'change', 'changePct'];
      if (rxHide_(me, row, o.people, keys) || (q && rxHide_(me, row, q.people, keys))) hidden++;
      return row;
    });
    var shown = rows.reduce(function (t, r) { return t + (r.total || 0); }, 0);
    rows.forEach(function (r) { if (r.total != null) r.share = pct_(r.total, shown); });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: [col_('cohort', 'code'), col_('headcount', 'int', { sum: true }), m('base'), col_('employeeRate', 'pct'), m('employee'), col_('employerRate', 'pct'), m('employer'), m('total'),
      col_('share', 'pct'), m('prev'), m('change'), col_('changePct', 'pct')], rows: rows, run: publicRun_(rp.run),
      checks: [missing ? { level: 'warn', code: 'gosi_cohort_missing', count: missing } : null, capped ? { level: 'info', code: 'gosi_cap', count: capped } : null,
        noPkg ? { level: 'info', code: 'no_package', count: noPkg } : null, hidden ? { level: 'info', code: 'small_group_hidden', count: hidden } : null].filter(Boolean),
      chart: { type: 'bars', by: 'cohort', value: 'total' } };
  },

  // Deductions by type: people affected, amount, share of all deductions and of gross, the average, and the last locked run.
  pay_deductions: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var ids = {}; ids[rp.run.id] = 1; if (rp.prev) ids[rp.prev.id] = 1;
    var by = rxSlipsBy_(ids, deptSet_(p, ctx), ctx), cur = {}, old = {}, totD = 0, totG = 0, capped = 0, hidden = 0;
    var add = function (id, map, isCur) {
      var m = by[id] || {};
      Object.keys(m).forEach(function (k) {
        var sl = m[k];
        if (isCur) { totD += Number(sl.deductions) || 0; totG += Number(sl.gross) || 0; if ((rxInfo_(sl).warnings || []).some(function (w) { return ['deductions_capped', 'advance_deferred', 'fine_capped'].indexOf(w) >= 0; })) capped++; }
        lines_(sl).forEach(function (l) {
          if (l.kind !== 'deduction') return;
          var g = map[l.code] || (map[l.code] = { people: {}, amount: 0 }); g.people[k] = 1; g.amount += Number(l.amount) || 0;
        });
      });
    };
    add(rp.run.id, cur, true); if (rp.prev) add(rp.prev.id, old, false);
    var codes = RX_DEDUCTIONS.filter(function (c) { return cur[c] || old[c]; }).concat(Object.keys(cur).filter(function (c) { return RX_DEDUCTIONS.indexOf(c) < 0; }));
    var rows = codes.map(function (c) {
      var g = cur[c] || { people: {}, amount: 0 }, o = old[c], n = Object.keys(g.people).length, amt = r2_(g.amount), pv = o ? r2_(o.amount) : rp.prev ? 0 : null, ch = rxChg_(amt, pv);
      var row = { line: c, people: n, amount: amt, share: pct_(amt, totD), ofGross: pct_(amt, totG), avgAmount: n ? r2_(amt / n) : null, prev: pv, change: ch.change, changePct: ch.changePct };
      var keys = ['amount', 'share', 'ofGross', 'avgAmount', 'prev', 'change', 'changePct'];
      if (rxHide_(me, row, n, keys) || (o && rxHide_(me, row, Object.keys(o.people).length, keys))) hidden++;
      return row;
    }).sort(function (a, b) { return (b.amount || 0) - (a.amount || 0); });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: [col_('line', 'code'), col_('people', 'int'), m('amount'), col_('share', 'pct'), col_('ofGross', 'pct'), col_('avgAmount', 'money'), m('prev'), m('change'), col_('changePct', 'pct')],
      rows: rows, run: publicRun_(rp.run),
      checks: [capped ? { level: 'warn', code: 'deductions_capped', count: capped } : null, hidden ? { level: 'info', code: 'small_group_hidden', count: hidden } : null].filter(Boolean),
      chart: { type: 'bars', by: 'line', value: 'amount' } };
  },

  // Monthly packages by grade and position: minimum, median, mean, maximum, spread, the grade median and outliers (1.5 x IQR).
  pay_bands: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(today_()), pos = {}, by = {}, grades = {}, noGrade = 0, noPkg = 0;
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x; });
    emps.forEach(function (e) {
      var c = comps[e.id]; if (!c) { noPkg++; return; }
      var ps = pos[e.positionId], title = ps ? ps.titleAr : (e.title || '-'), grade = ps && rxHas_(ps.grade) ? String(ps.grade) : '';
      if (!grade) noGrade++;
      (by[grade + '|' + title] = by[grade + '|' + title] || { grade: grade, position: title, pays: [] }).pays.push(c.total);
      (grades[grade] = grades[grade] || []).push(c.total);
    });
    var spread = 0, rows = Object.keys(by).map(function (k) {
      var g = by[k], xs = g.pays, mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs), med = waMedian_(xs), gm = waMedian_(grades[g.grade]), out = 0;
      if (xs.length >= 4) { var q1 = rxQuant_(xs, 0.25), q3 = rxQuant_(xs, 0.75), iqr = q3 - q1; out = xs.filter(function (x) { return x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr; }).length; }
      var row = { grade: g.grade, position: g.position, headcount: xs.length, min: r2_(mn), median: r2_(med), average: r2_(rxMean_(xs)), max: r2_(mx), spread: mn ? r1_((mx - mn) / mn * 100) : null,
        gradeMedian: r2_(gm), vsGrade: gm ? r1_((med - gm) / gm * 100) : null, outliers: out };
      if (xs.length >= 2 && row.spread >= 50) spread++;
      return row;
    }).sort(function (a, b) { return a.grade < b.grade ? -1 : a.grade > b.grade ? 1 : b.median - a.median; });
    return { columns: [col_('grade', 'text', { group: true }), col_('position'), col_('headcount', 'int', { sum: true }), col_('min', 'money'), col_('median', 'money'), col_('average', 'money'),
      col_('max', 'money'), col_('spread', 'pct'), col_('gradeMedian', 'money'), col_('vsGrade', 'pct'), col_('outliers', 'int', { sum: true })], rows: rows,
      checks: [spread ? { level: 'warn', code: 'band_spread', count: spread } : null, noGrade ? { level: 'info', code: 'no_grade', count: noGrade } : null,
        noPkg ? { level: 'info', code: 'no_package', count: noPkg } : null].filter(Boolean), chart: { type: 'hbar', label: 'position', value: 'median' } };
  },

  // Year to date per person to the chosen run: locked runs of the year plus the chosen one, against the same months last year.
  pay_ytd: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var run = rp.run, y = run.month.slice(0, 4), ly = String(+y - 1) + run.month.slice(4), cur = {}, old = {}, ids = {};
    rp.runs.forEach(function (r) {
      if (r.month.slice(0, 4) === y && r.month <= run.month && (r.status === 'locked' || r.id === run.id)) { cur[r.id] = 1; ids[r.id] = 1; }
      if (r.month.slice(0, 4) === ly.slice(0, 4) && r.month <= ly && r.status === 'locked') { old[r.id] = 1; ids[r.id] = 1; }
    });
    var by = rxSlipsBy_(ids, deptSet_(p, ctx), ctx), st = {};
    Object.keys(by).forEach(function (rid) {
      Object.keys(by[rid]).forEach(function (k) {
        var sl = by[rid][k], x = st[k] || (st[k] = { months: 0, basic: 0, housing: 0, transport: 0, allowances: 0, otAmount: 0, otherEarnings: 0, gross: 0, gosi: 0, deductions: 0, net: 0, gosiEmployer: 0, prev: 0, prevN: 0 });
        if (old[rid]) { x.prev += Number(sl.gross) || 0; x.prevN++; return; }
        x.months++; x.gross += Number(sl.gross) || 0; x.deductions += Number(sl.deductions) || 0; x.net += Number(sl.net) || 0; x.gosiEmployer += rxErGosi_(sl);
        lines_(sl).forEach(function (l) {
          var a = Number(l.amount) || 0, c = l.code;
          if (c === 'basic' || c === 'housing' || c === 'transport') x[c] += a; else if (c === 'allowance') x.allowances += a; else if (c === 'overtime') x.otAmount += a;
          else if (c === 'bonus' || c === 'commission' || c === 'other_earning') x.otherEarnings += a; else if (c === 'gosi') x.gosi += a;
        });
      });
    });
    var rows = Object.keys(st).filter(function (k) { return st[k].months && ctx.emps[k]; }).map(function (k) {
      var x = st[k], r = Object.assign(base_(ctx.emps[k], ctx), { months: x.months });
      ['basic', 'housing', 'transport', 'allowances', 'otAmount', 'otherEarnings', 'gross', 'gosi', 'deductions', 'net', 'gosiEmployer'].forEach(function (f) { r[f] = r2_(x[f]); });
      var c = rxChg_(r.gross, x.prevN ? r2_(x.prev) : null); r.prev = c.prev; r.change = c.change; r.changePct = c.changePct;
      return r;
    }).sort(function (a, b) { return String(a.empNo).localeCompare(String(b.empNo), 'en', { numeric: true }); });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: EMP_COLS.concat([col_('months', 'int'), m('basic'), m('housing'), m('transport'), m('allowances'), m('otAmount'), m('otherEarnings'), m('gross'), m('gosi'), m('deductions'),
      m('net'), m('gosiEmployer'), m('prev'), m('change'), col_('changePct', 'pct')]), rows: rows, run: publicRun_(run),
      checks: run.status !== 'locked' ? [{ level: 'info', code: 'ytd_includes_draft', count: 1 }] : [], chart: { type: 'hbar', label: 'name', value: 'gross' }, wide: true };
  },

  // Overtime paid per month (hours and amount from the payslips), its share of gross and the month before.
  pay_ot_trend: function (p, me, ctx, scope, s) {
    var rb = rxRunsByMonth_(p, ctx); if (!rb) return rxEmpty_();
    var st = {}, hidden = 0;
    Object.keys(rb.runs).forEach(function (m) {
      var x = st[m] = { people: 0, hours: 0, amount: 0, gross: 0 }, sl = rb.slips[rb.runs[m].id] || {};
      Object.keys(sl).forEach(function (k) { var ot = rxLines_(sl[k]).overtime; x.gross += Number(sl[k].gross) || 0; if (ot && ot.amount > 0) { x.people++; x.hours += ot.hours; x.amount += ot.amount; } });
    });
    var rows = rb.months.filter(function (m) { return rb.runs[m]; }).map(function (m) {
      var x = st[m], o = st[rxAddMonth_(m, -1)], amt = r2_(x.amount), c = rxChg_(amt, o ? r2_(o.amount) : null);
      var row = { month: m, runStatus: rb.runs[m].status, people: x.people, otHours: r2_(x.hours), otAmount: amt, gross: r2_(x.gross), share: pct_(amt, x.gross),
        avgAmount: x.people ? r2_(amt / x.people) : null, prev: c.prev, change: c.change, changePct: c.changePct };
      var keys = ['otAmount', 'share', 'avgAmount', 'prev', 'change', 'changePct'];
      if (rxHide_(me, row, x.people, keys) || (o && rxHide_(me, row, o.people, keys))) hidden++;
      return row;
    });
    return { columns: [col_('month', 'text'), col_('runStatus', 'code'), col_('people', 'int'), col_('otHours', 'hours', { sum: true }), col_('otAmount', 'money', { sum: true }),
      col_('gross', 'money', { sum: true }), col_('share', 'pct'), col_('avgAmount', 'money'), col_('prev', 'money'), col_('change', 'money'), col_('changePct', 'pct')], rows: rows,
      checks: hidden ? [{ level: 'info', code: 'small_group_hidden', count: hidden }] : [], chart: { type: 'hbar', label: 'month', value: 'otAmount' } };
  },

  // Cost per head per month: gross + employer GOSI + end-of-service provision, divided by the people paid, and the month before.
  pay_cost_per_head: function (p, me, ctx, scope, s) {
    var rb = rxRunsByMonth_(p, ctx); if (!rb) return rxEmpty_();
    var st = {}, hidden = 0;
    Object.keys(rb.runs).forEach(function (m) {
      var x = st[m] = { hc: 0, gross: 0, er: 0, eos: 0, cost: 0 }, sl = rb.slips[rb.runs[m].id] || {};
      Object.keys(sl).forEach(function (k) {
        var a = sl[k], e = ctx.emps[k]; if (!(Number(a.gross) > 0)) return;
        x.hc++; x.gross += Number(a.gross); x.er += rxErGosi_(a); x.eos += rxEos_(e, a, s); x.cost += rxCost_(e, a, s);
      });
    });
    var per = function (x) { return x && x.hc ? r2_(x.cost / x.hc) : null; };
    var rows = rb.months.filter(function (m) { return rb.runs[m]; }).map(function (m) {
      var x = st[m], o = st[rxAddMonth_(m, -1)], c = rxChg_(per(x), per(o));
      var row = { month: m, runStatus: rb.runs[m].status, headcount: x.hc, gross: r2_(x.gross), gosiEmployer: r2_(x.er), eosAccrual: r2_(x.eos), companyCost: r2_(x.cost), perHead: per(x),
        prev: c.prev, change: c.change, changePct: c.changePct };
      var keys = ['gross', 'gosiEmployer', 'eosAccrual', 'companyCost', 'perHead', 'prev', 'change', 'changePct'];
      if (rxHide_(me, row, x.hc, keys) || (o && rxHide_(me, row, o.hc, keys))) hidden++;
      return row;
    });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: [col_('month', 'text'), col_('runStatus', 'code'), col_('headcount', 'int'), m('gross'), m('gosiEmployer'), m('eosAccrual'), m('companyCost'), col_('perHead', 'money'),
      col_('prev', 'money'), col_('change', 'money'), col_('changePct', 'pct')], rows: rows,
      checks: hidden ? [{ level: 'info', code: 'small_group_hidden', count: hidden }] : [], chart: { type: 'hbar', label: 'month', value: 'perHead' } };
  },

  // What each person costs the company in the run: gross, employer GOSI, the month's end-of-service provision and the total,
  // grouped by department (subtotals) with the share of the company total and the last locked run.
  pay_company_cost: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var ids = {}; ids[rp.run.id] = 1; if (rp.prev) ids[rp.prev.id] = 1;
    var by = rxSlipsBy_(ids, deptSet_(p, ctx), ctx), cur = by[rp.run.id] || {}, old = rp.prev ? by[rp.prev.id] || {} : {}, rows = [], noPkg = 0, noHire = 0;
    Object.keys(cur).forEach(function (k) {
      var sl = cur[k], e = ctx.emps[k]; if (!e) return;
      if (!(rxInfo_(sl).info || {}).package && !Number(sl.gross)) { noPkg++; return; }
      if (!isoDate_(e.hireDate)) noHire++;
      var cc = rxCost_(e, sl, s), pc = old[k] ? rxCost_(e, old[k], s) : null, c = rxChg_(cc, pc);
      rows.push(Object.assign(base_(e, ctx), { payslip: sl.ref, gross: Number(sl.gross) || 0, gosiEmployer: rxErGosi_(sl), eosAccrual: rxEos_(e, sl, s), companyCost: cc, share: null,
        prev: c.prev, change: c.change, changePct: c.changePct }));
    });
    var tot = rows.reduce(function (t, r) { return t + r.companyCost; }, 0);
    rows.forEach(function (r) { r.share = pct_(r.companyCost, tot); });
    rows.sort(function (a, b) { return a.department < b.department ? -1 : a.department > b.department ? 1 : b.companyCost - a.companyCost; });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: EMP_COLS.concat([col_('payslip', 'id'), m('gross'), m('gosiEmployer'), m('eosAccrual'), m('companyCost'), col_('share', 'pct'), m('prev'), m('change'), col_('changePct', 'pct')]),
      rows: rows, run: publicRun_(rp.run), previous: rp.prev ? publicRun_(rp.prev) : null,
      checks: [rows.length ? { level: 'info', code: 'eos_accrual', count: rows.length } : null, noHire ? { level: 'warn', code: 'missing_hire_date', count: noHire } : null,
        noPkg ? { level: 'info', code: 'no_package', count: noPkg } : null].filter(Boolean), chart: { type: 'bars', by: 'department', value: 'companyCost' } };
  },

  // The wage GOSI contributions are on against the gross paid: package wage (basic + housing), the wage registered with GOSI
  // when HR recorded one, the contributory wage after the floor and cap, what gross leaves out, and the latest GOSI upload.
  pay_gosi_wage: function (p, me, ctx, scope, s) {
    var rp = rxRunPair_(p); if (!rp) return rxNoRun_();
    var run = rp.run, ids = {}; ids[run.id] = 1;
    var slips = rxSlipsBy_(ids, deptSet_(p, ctx), ctx)[run.id] || {}, mism = {}, miss = {}, rows = [], noPkg = 0;
    var rec = readAll_(SHEETS.RECON).filter(function (x) { return x.month === run.month && x.source === 'gosi'; }).sort(function (a, b) { return String(a.at) < String(b.at) ? 1 : -1; })[0] || null;
    if (rec) { parseJson_(rec.mismatchesJson, []).forEach(function (x) { mism[x.empId] = x; }); parseJson_(rec.missingJson, []).forEach(function (x) { miss[x.empId] = 1; }); }
    Object.keys(slips).forEach(function (k) {
      var sl = slips[k], e = ctx.emps[k], inf = rxInfo_(sl).info || {}, g = inf.gosi, pk = inf.package;
      if (!e || !g || !pk) { noPkg++; return; }
      var saudi = bool_(e.isSaudi), pw = rxHas_(g.packageWage) ? Number(g.packageWage) : r2_(Number(pk.basic) + Number(pk.housing)), reg = Number(g.registered) || null, w = reg || pw;
      var contrib = r2_(Math.min(GOSI_MAX, Math.max(saudi ? GOSI_MIN : 0, w))), gross = Number(sl.gross) || 0;
      var reason = reg && Math.abs(reg - pw) > 1 ? 'registered_differs' : w > GOSI_MAX ? 'cap' : saudi && w < GOSI_MIN ? 'floor' : gross && contrib / gross * 100 < RX_GOSI_SHARE_MIN ? 'low_share' : '';
      var st = !rec ? 'no_upload' : mism[k] ? 'mismatch' : miss[k] ? 'not_in_upload' : 'matched', rw = st === 'mismatch' ? Number(mism[k].theirs) : st === 'matched' ? r2_(Number(pk.basic) + Number(pk.housing)) : null;
      rows.push(Object.assign(base_(e, ctx), { saudi: saudi ? 'saudi' : 'non_saudi', gross: gross, packageWage: pw, registered: reg, contributory: contrib, excluded: r2_(gross - contrib),
        excludedPct: pct_(r2_(gross - contrib), gross), reason: reason, reconWage: rw, reconDiff: rw == null ? null : r2_(rw - w), reconStatus: st }));
    });
    rows.sort(function (a, b) { return Math.abs(b.reconDiff || 0) - Math.abs(a.reconDiff || 0) || b.excluded - a.excluded; });
    var n = function (f) { return rows.filter(f).length; }, mm = n(function (r) { return r.reconStatus === 'mismatch'; });
    var m = function (k) { return col_(k, 'money', { sum: true }); };
    return { columns: EMP_COLS.concat([col_('saudi', 'code', { group: true }), m('gross'), m('packageWage'), col_('registered', 'money'), m('contributory'), m('excluded'), col_('excludedPct', 'pct'),
      col_('reason', 'code', { group: true }), m('reconWage'), m('reconDiff'), col_('reconStatus', 'code', { group: true })]), rows: rows, run: publicRun_(run),
      checks: [mm ? { level: rec && rec.status === 'open' ? 'error' : 'warn', code: 'recon_mismatch', count: mm } : null,
        n(function (r) { return r.reason === 'registered_differs'; }) ? { level: 'info', code: 'gosi_wage_differs', count: n(function (r) { return r.reason === 'registered_differs'; }) } : null,
        n(function (r) { return r.reason === 'low_share'; }) ? { level: 'warn', code: 'gosi_low_share', count: n(function (r) { return r.reason === 'low_share'; }) } : null,
        n(function (r) { return r.reason === 'cap'; }) ? { level: 'info', code: 'gosi_cap', count: n(function (r) { return r.reason === 'cap'; }) } : null,
        !rec && rows.length ? { level: 'info', code: 'no_recon', count: 0 } : null, noPkg ? { level: 'info', code: 'no_package', count: noPkg } : null].filter(Boolean),
      chart: { type: 'bars', by: 'reconStatus', value: 'count' } };
  }
});

// ---------------- workforce ----------------
/** Everyone in scope and filters whatever their status (leavers count in history). */
function rxAllEmps_(p, ctx, scope) { return reportEmps_(Object.assign({}, p, { status: 'all' }), ctx, scope, true); }
/** Direct reports among the people active today, by manager id; and how many have a manager who is gone or unknown. */
function rxKids_(ctx) {
  var act = {}, kids = {}, orphans = 0;
  Object.keys(ctx.emps).forEach(function (k) { if (ctx.emps[k].status === 'active') act[k] = ctx.emps[k]; });
  Object.keys(act).forEach(function (k) { var e = act[k]; if (!e.managerId || e.managerId === e.id) return; if (!act[e.managerId]) { orphans++; return; } (kids[e.managerId] = kids[e.managerId] || []).push(k); });
  return { kids: kids, orphans: orphans, act: act };
}
/** Everyone below a manager and the number of layers under them. */
function rxBelow_(id, kids) {
  var seen = {}, total = 0, depth = 0;
  (function walk(x, d) { (kids[x] || []).forEach(function (k) { if (seen[k] || d > 25) return; seen[k] = 1; total++; if (d + 1 > depth) depth = d + 1; walk(k, d + 1); }); })(id, 0);
  return { total: total, layers: depth };
}
/** Onboarding progress per person: tasks, done (or skipped), and the probation review task. */
function rxOnb_() {
  var by = {};
  readAll_(SHEETS.ONB).forEach(function (x) {
    var o = by[x.empId] || (by[x.empId] = { n: 0, done: 0, review: null });
    o.n++; if (x.status !== 'open') o.done++;
    if (x.taskKey === 'probation') o.review = x;
  });
  return by;
}
function rxSpanBand_(n) { return n <= 1 ? 'span_1' : n <= 4 ? 'span_2_4' : n <= 8 ? 'span_5_8' : n <= 12 ? 'span_9_12' : 'span_13'; }

Object.assign(REPORT_FNS, {
  // Headcount at the month end by department, Saudi / non-Saudi and gender, joiners and leavers in the month, and last month end.
  wf_snapshot: function (p, me, ctx, scope, s) {
    var t = today_(), first = p.month + '-01'; if (first > t) return rxEmpty_();
    var end = minDate_(monthLast_(p.month), t), pEnd = addDays_(first, -1), by = {}, unknown = 0;
    rxAllEmps_(p, ctx, scope).forEach(function (e) {
      var sp = rxSpan_(e); if (!sp) { unknown++; return; }
      var dn = deptName_(e, ctx) || '-', g = by[dn] || (by[dn] = { department: dn, headcount: 0, saudis: 0, nonSaudis: 0, men: 0, women: 0, noGender: 0, joiners: 0, leavers: 0, prev: 0 });
      if (rxOn_(sp, end)) {
        g.headcount++;
        if (bool_(e.isSaudi)) g.saudis++; else g.nonSaudis++;
        if (e.gender === 'male') g.men++; else if (e.gender === 'female') g.women++; else g.noGender++;
      }
      if (rxOn_(sp, pEnd)) g.prev++;
      if (sp.start >= first && sp.start <= end && isoDate_(e.hireDate)) g.joiners++;
      if (sp.end && sp.end >= first && sp.end <= end) g.leavers++;
    });
    var rows = Object.keys(by).sort().map(function (k) {
      var g = by[k], c = rxChg_(g.headcount, g.prev, 0);
      g.saudiShare = pct_(g.saudis, g.headcount); g.womenShare = pct_(g.women, g.headcount); g.change = c.change; g.changePct = c.changePct;
      return g;
    }).filter(function (g) { return g.headcount || g.prev || g.leavers; });
    var i = function (k) { return col_(k, 'int', { sum: true }); };
    return { columns: [col_('department'), i('headcount'), i('saudis'), i('nonSaudis'), i('men'), i('women'), i('noGender'), col_('saudiShare', 'pct'), col_('womenShare', 'pct'),
      i('joiners'), i('leavers'), i('prev'), i('change'), col_('changePct', 'pct')], rows: rows,
      checks: unknown ? [{ level: 'info', code: 'unknown_end', count: unknown }] : [], chart: { type: 'hbar', label: 'department', value: 'headcount' } };
  },

  // Everyone hired in the period: position, manager, contract, probation, onboarding progress, still here or gone, early exits.
  wf_joiners: function (p, me, ctx, scope, s) {
    var t = today_(), pr = rxPrev_(p.from, p.to), pos = {}, onb = rxOnb_(), prevN = 0, rows = [];
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x.titleAr; });
    rxAllEmps_(p, ctx, scope).forEach(function (e) {
      var h = isoDate_(e.hireDate); if (!h) return;
      if (h >= pr.from && h <= pr.to) prevN++;
      if (h < p.from || h > p.to) return;
      var lwd = isoDate_(e.lastWorkingDay), gone = lwd && lwd < t, o = onb[e.id], pe = isoDate_(e.probationEnd);
      rows.push(Object.assign(base_(e, ctx), { hireDate: h, position: pos[e.positionId] || e.title || '', manager: ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '',
        contractType: e.contractType || '', saudi: bool_(e.isSaudi) ? 'saudi' : 'non_saudi', probationEnd: pe, onboarding: o ? pct_(o.done, o.n) : null,
        employed: e.status === 'active' && !gone ? 'yes' : 'no', lastDay: lwd, tenureDays: Math.max(0, daysBetween_(h, gone ? lwd : t)),
        earlyExit: lwd && (daysBetween_(h, lwd) < 90 || (pe && lwd <= pe)) ? 'yes' : '' }));
    });
    rows.sort(function (a, b) { return a.hireDate < b.hireDate ? -1 : 1; });
    var early = rows.filter(function (r) { return r.earlyExit; }).length;
    return { columns: EMP_COLS.concat([col_('hireDate', 'date'), col_('position', 'text', { group: true }), col_('manager', 'text', { group: true }), col_('contractType', 'code', { group: true }),
      col_('saudi', 'code', { group: true }), col_('probationEnd', 'date'), col_('onboarding', 'pct'), col_('employed', 'code', { group: true }), col_('lastDay', 'date'), col_('tenureDays', 'int'),
      col_('earlyExit', 'code')]), rows: rows,
      checks: [{ level: 'info', code: 'prev_count', count: prevN }, early ? { level: 'warn', code: 'early_exit', count: early } : null].filter(Boolean),
      chart: { type: 'bars', by: 'department', value: 'count' } };
  },

  // Everyone whose last working day falls in the period: tenure, reason, voluntary or not, first-year leavers, notice given,
  // clearance progress, and their last published rating (a voluntary leaver rated 4 or 5 is a regretted loss).
  wf_leavers: function (p, me, ctx, scope, s) {
    var reqs = readAll_(SHEETS.REQ), clr = readAll_(SHEETS.CLR), people = waPeople_(ctx, reqs, clr), ok = {}, pr = rxPrev_(p.from, p.to), prevN = 0, rating = waLastRating_(), resAt = {}, cl = {}, rows = [];
    rxAllEmps_(p, ctx, scope).forEach(function (e) { ok[e.id] = e; });
    reqs.forEach(function (r) { if (r.type === 'resignation' && r.status === 'approved') resAt[r.empId] = String(r.createdAt).slice(0, 10); });
    clr.forEach(function (x) { if (x.status !== 'cancelled') { var v = clearanceView_(x, me, ctx); cl[x.empId] = pct_(v.done, v.total); } });
    people.forEach(function (q) {
      var e = ok[q.id]; if (!e || !q.end || !waCounts_(q)) return;
      if (q.end >= pr.from && q.end <= pr.to) prevN++;
      if (q.end < p.from || q.end > p.to) return;
      var y = q.hire ? r2_(daysBetween_(q.hire, q.end) / 365.25) : null, rt = rating[q.id] ? rating[q.id].rating : null;
      rows.push(Object.assign(base_(e, ctx), { hireDate: q.hire, lastDay: q.end, years: y, tenureBand: y == null ? '' : waBand_(y), reason: q.reason, voluntary: q.voluntary ? 'yes' : 'no',
        firstYear: q.hire && q.end < waAddMonths_(q.hire, 12) ? 'yes' : '', noticeDays: resAt[q.id] ? daysBetween_(resAt[q.id], q.end) : null, clearanceDone: cl[q.id] == null ? null : cl[q.id],
        lastRating: rt, regretted: q.voluntary && rt >= 4 ? 'yes' : '' }));
    });
    rows.sort(function (a, b) { return a.lastDay < b.lastDay ? -1 : 1; });
    var first = rows.filter(function (r) { return r.firstYear; }).length, reg = rows.filter(function (r) { return r.regretted; }).length;
    return { columns: EMP_COLS.concat([col_('hireDate', 'date'), col_('lastDay', 'date'), col_('years', 'num'), col_('tenureBand', 'code', { group: true }), col_('reason', 'code', { group: true }),
      col_('voluntary', 'code', { group: true }), col_('firstYear', 'code'), col_('noticeDays', 'int'), col_('clearanceDone', 'pct'), col_('lastRating', 'int'), col_('regretted', 'code')]), rows: rows,
      checks: [{ level: 'info', code: 'prev_count', count: prevN }, first ? { level: 'warn', code: 'first_year_leavers', count: first } : null, reg ? { level: 'warn', code: 'regretted', count: reg } : null].filter(Boolean),
      chart: { type: 'bars', by: 'reason', value: 'count' } };
  },

  // Turnover per department: leavers / average headcount (the mean of each month's first- and last-day headcount), voluntary
  // and other, first-year leavers, and the period before. Departments are today's.
  wf_turnover_dept: function (p, me, ctx, scope, s) {
    var to = minDate_(p.to, today_()); if (p.from > to) return rxEmpty_();
    var pr = rxPrev_(p.from, to), ok = {};
    rxAllEmps_(p, ctx, scope).forEach(function (e) { ok[e.id] = 1; });
    var people = waPeople_(ctx, readAll_(SHEETS.REQ), readAll_(SHEETS.CLR)).filter(function (q) { return ok[q.id] && waCounts_(q); });
    var calc = function (a, b) {
      var months = rxMonths_(a, b), by = {};
      people.forEach(function (q) {
        var g = by[q.dept] || (by[q.dept] = { sum: 0, leavers: 0, voluntary: 0, other: 0, firstYear: 0 });
        months.forEach(function (m) { g.sum += ((waOn_(q, m + '-01') ? 1 : 0) + (waOn_(q, minDate_(monthLast_(m), b)) ? 1 : 0)) / 2; });
        if (q.end && q.end >= a && q.end <= b) { g.leavers++; if (q.voluntary) g.voluntary++; else g.other++; if (q.hire && q.end < waAddMonths_(q.hire, 12)) g.firstYear++; }
      });
      Object.keys(by).forEach(function (k) { by[k].avg = months.length ? by[k].sum / months.length : 0; });
      return by;
    };
    var cur = calc(p.from, to), old = calc(pr.from, pr.to);
    var rows = Object.keys(cur).sort().filter(function (k) { return cur[k].avg || cur[k].leavers; }).map(function (k) {
      var g = cur[k], o = old[k], rate = pct_(g.leavers, g.avg), pv = o && o.avg ? pct_(o.leavers, o.avg) : null;
      return { department: k, avgHeadcount: waRound_(g.avg, 2), leavers: g.leavers, voluntary: g.voluntary, other: g.other, firstYear: g.firstYear, turnover: rate,
        voluntaryRate: pct_(g.voluntary, g.avg), prevRate: pv, changePts: rxPts_(rate, pv) };
    });
    var high = rows.filter(function (r) { return r.turnover >= 20; }).length;
    var i = function (k) { return col_(k, 'int', { sum: true }); };
    return { columns: [col_('department'), col_('avgHeadcount', 'num', { sum: true }), i('leavers'), i('voluntary'), i('other'), i('firstYear'), col_('turnover', 'pct'), col_('voluntaryRate', 'pct'),
      col_('prevRate', 'pct'), col_('changePts', 'num')], rows: rows,
      checks: high ? [{ level: 'warn', code: 'turnover_high', count: high }] : [], chart: { type: 'hbar', label: 'department', value: 'turnover' } };
  },

  // Years of service today by department: bands, mean and median, and the share in their first year.
  wf_tenure: function (p, me, ctx, scope, s) {
    var t = today_(), by = {};
    reportEmps_(p, ctx, scope).forEach(function (e) {
      var dn = deptName_(e, ctx) || '-', g = by[dn] || (by[dn] = { department: dn, headcount: 0, tenure0: 0, tenure1: 0, tenure3: 0, tenure5: 0, tenure10: 0, ys: [], noHire: 0 });
      g.headcount++;
      var h = isoDate_(e.hireDate); if (!h || h > t) { g.noHire++; return; }
      var y = daysBetween_(h, t) / 365.25; g.ys.push(y);
      g[y < 1 ? 'tenure0' : y < 3 ? 'tenure1' : y < 5 ? 'tenure3' : y < 10 ? 'tenure5' : 'tenure10']++;
    });
    var rows = Object.keys(by).sort().map(function (k) {
      var g = by[k];
      return { department: k, headcount: g.headcount, tenure0: g.tenure0, tenure1: g.tenure1, tenure3: g.tenure3, tenure5: g.tenure5, tenure10: g.tenure10,
        avgYears: g.ys.length ? waRound_(rxMean_(g.ys), 2) : null, medianYears: g.ys.length ? waRound_(waMedian_(g.ys), 2) : null, newShare: pct_(g.tenure0, g.ys.length), noHire: g.noHire };
    });
    var noHire = rows.reduce(function (t2, r) { return t2 + r.noHire; }, 0), i = function (k) { return col_(k, 'int', { sum: true }); };
    return { columns: [col_('department'), i('headcount'), i('tenure0'), i('tenure1'), i('tenure3'), i('tenure5'), i('tenure10'), col_('avgYears', 'num'), col_('medianYears', 'num'),
      col_('newShare', 'pct'), i('noHire')], rows: rows,
      checks: noHire ? [{ level: 'info', code: 'missing_hire_date', count: noHire }] : [], chart: { type: 'hbar', label: 'department', value: 'avgYears' } };
  },

  // Span of control: direct reports, everyone below and the layers under each manager; wide (13+) and narrow (1) flagged.
  wf_span: function (p, me, ctx, scope, s) {
    var k = rxKids_(ctx), pos = {}, rows = [];
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x.titleAr; });
    reportEmps_(p, ctx, scope).forEach(function (e) {
      var n = (k.kids[e.id] || []).length; if (!n) return;
      var b = rxBelow_(e.id, k.kids);
      rows.push(Object.assign(base_(e, ctx), { position: pos[e.positionId] || e.title || '', directs: n, totalReports: b.total, layers: b.layers, spanBand: rxSpanBand_(n), spanFlag: n > 12 ? 'wide' : n < 2 ? 'narrow' : '' }));
    });
    rows.sort(function (a, b) { return b.directs - a.directs || b.totalReports - a.totalReports; });
    var wide = rows.filter(function (r) { return r.spanFlag === 'wide'; }).length, narrow = rows.filter(function (r) { return r.spanFlag === 'narrow'; }).length;
    return { columns: EMP_COLS.concat([col_('position'), col_('directs', 'int', { sum: true }), col_('totalReports', 'int'), col_('layers', 'int'), col_('spanBand', 'code', { group: true }), col_('spanFlag', 'code')]),
      rows: rows, checks: [wide ? { level: 'info', code: 'span_wide', count: wide } : null, narrow ? { level: 'info', code: 'span_narrow', count: narrow } : null,
        !scope && k.orphans ? { level: 'warn', code: 'orphan_reports', count: k.orphans } : null].filter(Boolean), chart: { type: 'hbar', label: 'name', value: 'directs' } };
  },

  // The reporting lines: each person's manager, department head, level from the top and the chain of managers above them.
  wf_org: function (p, me, ctx, scope, s) {
    var k = rxKids_(ctx), pos = {}, rows = [], orphans = 0, top = 0;
    readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = x; });
    reportEmps_(p, ctx, scope, p.status !== 'active').forEach(function (e) {
      var chain = [], seen = {}, cur = e, m = ctx.emps[e.managerId];
      for (var i = 0; i < 25 && cur && cur.managerId && cur.managerId !== cur.id && !seen[cur.id]; i++) { seen[cur.id] = 1; cur = ctx.emps[cur.managerId]; if (cur) chain.unshift(cur.name); }
      if (!e.managerId) top++; else if (!m || m.status !== 'active') orphans++;
      var b = rxBelow_(e.id, k.kids), hd = headFor_(e, ctx), ps = pos[e.positionId];
      rows.push(Object.assign(base_(e, ctx), { position: ps ? ps.titleAr : (e.title || ''), grade: ps && rxHas_(ps.grade) ? String(ps.grade) : '', managerNo: m ? String(m.empNo) : '', manager: m ? m.name : '',
        deptHead: hd ? hd.name : '', level: chain.length + 1, chain: chain.join(' › '), directs: (k.kids[e.id] || []).length, totalReports: b.total }));
    });
    rows.sort(function (a, b) { return a.level - b.level || String(a.empNo).localeCompare(String(b.empNo), 'en', { numeric: true }); });
    return { columns: EMP_COLS.concat([col_('position', 'text', { group: true }), col_('grade', 'text', { group: true }), col_('managerNo', 'id'), col_('manager', 'text', { group: true }), col_('deptHead'),
      col_('level', 'int', { group: true }), col_('chain'), col_('directs', 'int'), col_('totalReports', 'int')]), rows: rows,
      checks: [orphans ? { level: 'warn', code: 'orphan_reports', count: orphans } : null, top ? { level: 'info', code: 'no_manager', count: top } : null].filter(Boolean),
      chart: { type: 'bars', by: 'level', value: 'count' } };
  },

  // Positions nobody active holds: since when (the last holder's last day, else the day the position was created) and how long.
  wf_vacancies: function (p, me, ctx, scope, s) {
    var t = today_(), ds = deptSet_(p, ctx), held = {}, last = {}, allowed = null, filled = 0, rows = [];
    if (scope) { // a manager: positions of the departments their people are in, or that they head (and below)
      allowed = {};
      Object.keys(scope).forEach(function (k) { var e = ctx.emps[k]; if (e && e.departmentId) allowed[e.departmentId] = 1; });
      Object.keys(ctx.depts).forEach(function (k) { if (ctx.depts[k].headEmpId === me.id) allowed[k] = 1; });
      allowed = deptSet_({ depts: Object.keys(allowed), subDepts: true }, ctx) || {};
    }
    Object.keys(ctx.emps).forEach(function (k) {
      var e = ctx.emps[k]; if (!e.positionId) return;
      if (e.status === 'active' && !(isoDate_(e.lastWorkingDay) && isoDate_(e.lastWorkingDay) < t)) held[e.positionId] = (held[e.positionId] || 0) + 1;
      else { var l = isoDate_(e.lastWorkingDay); if (l && (!last[e.positionId] || l > last[e.positionId].date)) last[e.positionId] = { date: l, name: e.name }; }
    });
    readAll_(SHEETS.POS).forEach(function (x) {
      if (x.status === 'disabled' || x.status === 'deleted') return;
      if ((ds && !ds[x.departmentId]) || (allowed && !allowed[x.departmentId])) return;
      if (held[x.id]) { filled++; return; }
      var lh = last[x.id], since = lh ? lh.date : (isoDate_(String(x.createdAt).slice(0, 10)) || t);
      rows.push({ code: String(x.code || ''), position: x.titleAr, department: ctx.depts[x.departmentId] ? ctx.depts[x.departmentId].nameAr : '-', grade: rxHas_(x.grade) ? String(x.grade) : '',
        lastHolder: lh ? lh.name : '', vacantSince: since, daysVacant: Math.max(0, daysBetween_(since, t)) });
    });
    rows.sort(function (a, b) { return b.daysVacant - a.daysVacant; });
    var long = rows.filter(function (r) { return r.daysVacant > 90; }).length;
    return { columns: [col_('code', 'id'), col_('position'), col_('department', 'text', { group: true }), col_('grade', 'text', { group: true }), col_('lastHolder'), col_('vacantSince', 'date'),
      col_('daysVacant', 'int')], rows: rows,
      checks: [{ level: 'info', code: 'positions_filled', count: filled }, long ? { level: 'warn', code: 'vacant_long', count: long } : null].filter(Boolean),
      chart: { type: 'bars', by: 'department', value: 'count' } };
  },

  // Probation ending within `days` days, in 30 / 60 / 90-day windows, with the probation review task and onboarding progress.
  wf_probation: function (p, me, ctx, scope, s) {
    var t = today_(), end = addDays_(t, p.days), onb = rxOnb_(), rows = [];
    reportEmps_(p, ctx, scope).forEach(function (e) {
      var pe = isoDate_(e.probationEnd); if (!pe || pe < t || pe > end) return;
      var h = isoDate_(e.hireDate), left = daysBetween_(t, pe), o = onb[e.id], rv = o && o.review;
      rows.push(Object.assign(base_(e, ctx), { manager: ctx.emps[e.managerId] ? ctx.emps[e.managerId].name : '', hireDate: h, probationEnd: pe, probationDays: h ? daysBetween_(h, pe) : null,
        daysLeft: left, window: left <= 30 ? 'd30' : left <= 60 ? 'd60' : left <= 90 ? 'd90' : 'later', onboarding: o ? pct_(o.done, o.n) : null,
        reviewTask: !rv ? 'none' : rv.status !== 'open' ? 'done' : String(rv.dueDate).slice(0, 10) < t ? 'late' : 'open' }));
    });
    rows.sort(function (a, b) { return a.daysLeft - b.daysLeft; });
    var long = rows.filter(function (r) { return r.probationDays > 180; }).length, open = rows.filter(function (r) { return r.daysLeft <= 30 && r.reviewTask !== 'done'; }).length;
    return { columns: EMP_COLS.concat([col_('manager', 'text', { group: true }), col_('hireDate', 'date'), col_('probationEnd', 'date'), col_('probationDays', 'int'), col_('daysLeft', 'int'),
      col_('window', 'code', { group: true }), col_('onboarding', 'pct'), col_('reviewTask', 'code', { group: true })]), rows: rows,
      checks: [long ? { level: 'error', code: 'probation_too_long', count: long } : null, open ? { level: 'warn', code: 'probation_review_open', count: open } : null].filter(Boolean),
      chart: { type: 'bars', by: 'window', value: 'count' } };
  }
});

// ---------------- performance ----------------
function rxCycle_(p) { var c = p.cycle ? cycleById_(p.cycle) : currentCycle_(); if (c) p.cycle = c.id; return c; }
function rxNoCycle_() { return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_cycle', count: 0 }] }; }

Object.assign(REPORT_FNS, {
  // Ratings 1-5 against the healthy spread. The final rating where the viewer may see it (HR, or a closed cycle), else the
  // rounded overall score (as the results report shows it). The spread is judged once at least 5 people are rated.
  perf_curve: function (p, me, ctx, scope, s) {
    var cyc = rxCycle_(p); if (!cyc) return rxNoCycle_();
    var ids = {}, n = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, rated = 0, final = isHr_(me) || cyc.status === 'closed';
    var emps = reportEmps_(p, ctx, scope); emps.forEach(function (e) { ids[e.id] = 1; });
    readAll_(SHEETS.REV).forEach(function (r) {
      if (r.cycleId !== cyc.id || !ids[r.empId]) return;
      var v = final && score_(r.finalRating) ? score_(r.finalRating) : rxHas_(r.overall) ? Math.min(5, Math.max(1, Math.round(Number(r.overall)))) : null;
      if (v) { n[v]++; rated++; }
    });
    var judged = rated >= 5, out = 0;
    var rows = [5, 4, 3, 2, 1].map(function (k) {
      var sh = rated ? r1_(n[k] / rated * 100) : null, g = RX_CURVE[k], gap = sh == null ? null : sh < g[0] ? r1_(sh - g[0]) : sh > g[1] ? r1_(sh - g[1]) : 0;
      if (judged && gap) out++;
      return { rating: k, ratingName: 'rating' + k, people: n[k], share: sh, guideMin: g[0], guideMax: g[1], gap: gap, inRange: judged ? (gap ? 'no' : 'yes') : '' };
    });
    return { columns: [col_('rating', 'int'), col_('ratingName', 'code'), col_('people', 'int', { sum: true }), col_('share', 'pct'), col_('guideMin', 'pct'), col_('guideMax', 'pct'),
      col_('gap', 'num'), col_('inRange', 'code')], rows: rows, cycle: publicCycle_(cyc),
      checks: [out ? { level: 'warn', code: 'curve_out', count: out } : null, !judged ? { level: 'info', code: 'curve_few', count: rated } : null,
        emps.length - rated ? { level: 'info', code: 'not_rated', count: emps.length - rated } : null].filter(Boolean), chart: { type: 'bars', by: 'ratingName', value: 'people' } };
  },

  // KPI cycle progress per person: goals set (weights add to 100), mid-year check-in on every KPI, self and manager review.
  perf_kpi: function (p, me, ctx, scope, s) {
    var cyc = rxCycle_(p); if (!cyc) return rxNoCycle_();
    var kp = {}, rv = {}, rows = [], badW = 0, none = 0;
    readAll_(SHEETS.KPI).forEach(function (k) { if (k.cycleId === cyc.id && k.status !== 'deleted') (kp[k.empId] = kp[k.empId] || []).push(k); });
    readAll_(SHEETS.REV).forEach(function (r) { if (r.cycleId === cyc.id) rv[r.empId] = r; });
    reportEmps_(p, ctx, scope).forEach(function (e) {
      var ks = kp[e.id] || [], r = rv[e.id] || {}, w = ks.reduce(function (t, k) { return t + (Number(k.weight) || 0); }, 0), mid = ks.filter(function (k) { return k.midStatus; });
      var steps = [ks.length > 0 && Math.round(w) === 100, ks.length > 0 && mid.length === ks.length, !!r.selfAt, !!r.mgrAt], codes = ['pk_goals', 'pk_mid', 'pk_self', 'pk_mgr'], stage = 'pk_none';
      steps.forEach(function (ok, i) { if (ok) stage = codes[i]; });
      if (!ks.length) none++; else if (Math.round(w) !== 100) badW++;
      var cnt = function (st) { return ks.filter(function (k) { return k.midStatus === st; }).length; };
      rows.push(Object.assign(base_(e, ctx), { kpis: ks.length, weightTotal: Math.round(w), midDone: mid.length, onTrack: cnt('on_track'), atRisk: cnt('at_risk'), offTrack: cnt('off_track'),
        selfScored: ks.filter(function (k) { return rxHas_(k.selfScore); }).length, mgrScored: ks.filter(function (k) { return rxHas_(k.mgrScore); }).length,
        completion: steps.filter(Boolean).length * 25, stage: stage }));
    });
    return { columns: EMP_COLS.concat([col_('kpis', 'int', { sum: true }), col_('weightTotal', 'int'), col_('midDone', 'int', { sum: true }), col_('onTrack', 'int', { sum: true }),
      col_('atRisk', 'int', { sum: true }), col_('offTrack', 'int', { sum: true }), col_('selfScored', 'int', { sum: true }), col_('mgrScored', 'int', { sum: true }), col_('completion', 'pct'),
      col_('stage', 'code', { group: true })]), rows: rows, cycle: publicCycle_(cyc),
      checks: [badW ? { level: 'warn', code: 'kpi_weights', count: badW } : null, none ? { level: 'info', code: 'no_kpis', count: none } : null].filter(Boolean),
      chart: { type: 'bars', by: 'stage', value: 'count' } };
  },

  // 360 participation per person: invitations, answers, response rate, and whether the peer and report groups reach the
  // three answers they need to be shown. Counts only: no rater and no answer ever leaves the server.
  perf_360: function (p, me, ctx, scope, s) {
    var cyc = rxCycle_(p); if (!cyc) return rxNoCycle_();
    var ids = {}, by = {}, rows = [], hiddenN = 0;
    var emps = reportEmps_(p, ctx, scope); emps.forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.FB).forEach(function (f) {
      if (f.cycleId !== cyc.id || !ids[f.subjectId]) return;
      var g = by[f.subjectId] || (by[f.subjectId] = { invited: 0, submitted: 0, rel: {} }), r = g.rel[f.relation] || (g.rel[f.relation] = { invited: 0, submitted: 0 });
      g.invited++; r.invited++; if (f.status === 'submitted') { g.submitted++; r.submitted++; }
    });
    emps.forEach(function (e) {
      var g = by[e.id]; if (!g) return;
      var rel = function (k) { return g.rel[k] || { invited: 0, submitted: 0 }; }, pe = rel('peer'), re = rel('report'), mg = rel('manager'), sf = rel('self');
      var shown = function (x) { return x.invited ? (x.submitted >= FB_MIN_GROUP ? 'yes' : 'no') : ''; };
      if (shown(pe) === 'no' || shown(re) === 'no') hiddenN++;
      rows.push(Object.assign(base_(e, ctx), { invited: g.invited, submitted: g.submitted, responseRate: pct_(g.submitted, g.invited), selfDone: sf.invited ? (sf.submitted ? 'yes' : 'no') : '',
        managerDone: mg.invited ? (mg.submitted ? 'yes' : 'no') : '', peers: pe.submitted, reports: re.submitted, peersShown: shown(pe), reportsShown: shown(re) }));
    });
    return { columns: EMP_COLS.concat([col_('invited', 'int', { sum: true }), col_('submitted', 'int', { sum: true }), col_('responseRate', 'pct'), col_('selfDone', 'code', { group: true }),
      col_('managerDone', 'code', { group: true }), col_('peers', 'int', { sum: true }), col_('reports', 'int', { sum: true }), col_('peersShown', 'code'), col_('reportsShown', 'code')]), rows: rows,
      cycle: publicCycle_(cyc), checks: hiddenN ? [{ level: 'info', code: 'fb_hidden', count: hiddenN }] : [], chart: { type: 'hbar', label: 'name', value: 'responseRate', max: 100 } };
  },

  // Development (IDP) and improvement (PIP) plans: dates, goals met and at risk, check-ins, acknowledgement; overdue flagged.
  perf_plans: function (p, me, ctx, scope, s) {
    var t = today_(), ids = {}, rows = [], overdue = 0, quiet = 0, noAck = 0;
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.PLAN).forEach(function (x) {
      var e = ids[x.empId]; if (!e || x.status === 'deleted') return;
      var goals = parseJson_(x.goalsJson, []), ci = parseJson_(x.checkInsJson, []), open = x.status === 'active' || x.status === 'extended', end = String(x.endDate).slice(0, 10);
      var lastCi = ci.length ? String(ci[ci.length - 1].date).slice(0, 10) : '', since = daysBetween_(lastCi || String(x.startDate).slice(0, 10), t);
      if (open && end < t) overdue++;
      if (open && since > 14) quiet++;
      if (open && !x.ackAt) noAck++;
      rows.push(Object.assign(base_(e, ctx), { ref: x.ref, planType: x.type, startDate: String(x.startDate).slice(0, 10), endDate: end, status: x.status, daysLeft: open ? daysBetween_(t, end) : null,
        goals: goals.length, goalsMet: goals.filter(function (g) { return g.status === 'met'; }).length, goalsAtRisk: goals.filter(function (g) { return g.status === 'at_risk' || g.status === 'not_met'; }).length,
        checkIns: ci.length, lastCheckIn: lastCi, sinceCheckIn: open ? since : null, acknowledged: x.ackAt ? 'yes' : 'no' }));
    });
    rows.sort(function (a, b) { return (a.daysLeft == null ? 1e9 : a.daysLeft) - (b.daysLeft == null ? 1e9 : b.daysLeft); });
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('planType', 'code', { group: true }), col_('startDate', 'date'), col_('endDate', 'date'), col_('status', 'status', { group: true }),
      col_('daysLeft', 'int'), col_('goals', 'int', { sum: true }), col_('goalsMet', 'int', { sum: true }), col_('goalsAtRisk', 'int', { sum: true }), col_('checkIns', 'int', { sum: true }),
      col_('lastCheckIn', 'date'), col_('sinceCheckIn', 'int'), col_('acknowledged', 'code', { group: true })]), rows: rows,
      checks: [overdue ? { level: 'error', code: 'plan_overdue', count: overdue } : null, quiet ? { level: 'warn', code: 'plan_no_checkin', count: quiet } : null,
        noAck ? { level: 'warn', code: 'plan_not_acked', count: noAck } : null].filter(Boolean), chart: { type: 'bars', by: 'status', value: 'count' } };
  }
});

// ---------------- requests and approvals ----------------
/** The requests the viewer may see in a report: their scope, the type filter, and no salary advance unless they handle pay. */
function rxReqs_(p, me, ctx, scope) {
  var ids = {}, money = canPayroll_(me);
  reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
  return { ids: ids, list: readAll_(SHEETS.REQ).filter(function (r) { return ids[r.empId] && (!p.reqType || r.type === p.reqType) && (r.type !== 'advance' || money); }) };
}

Object.assign(REPORT_FNS, {
  // Time to decide each approval step, per step and approver: from the request (or the step before) to the decision;
  // mean, median, 90th percentile and maximum hours, the share within RX_SLA_HOURS, and the period before.
  req_sla: function (p, me, ctx, scope, s) {
    var pr = rxPrev_(p.from, p.to), q = rxReqs_(p, me, ctx, scope), by = {}, breach = 0;
    q.list.forEach(function (r) {
      var last = r.createdAt;
      history_(r).forEach(function (h) {
        var start = last; last = h.at;
        if (h.decision !== 'approve' && h.decision !== 'reject') return;
        var d = localParts_(new Date(h.at)).date, hrs = (Date.parse(h.at) - Date.parse(start)) / 3600000;
        if (d < pr.from || d > p.to || !(hrs >= 0)) return;
        var who = ctx.emps[h.by] ? ctx.emps[h.by].name : '-', key = h.step + '|' + who, g = by[key] || (by[key] = { step: h.step, who: who, c: [], o: [], ok: 0, no: 0 });
        if (d >= p.from) { g.c.push(hrs); if (h.decision === 'approve') g.ok++; else g.no++; if (hrs > RX_SLA_HOURS) breach++; } else g.o.push(hrs);
      });
    });
    var rows = Object.keys(by).filter(function (k) { return by[k].c.length; }).map(function (k) {
      var g = by[k], avg = r1_(rxMean_(g.c)), pv = g.o.length ? r1_(rxMean_(g.o)) : null, c = rxChg_(avg, pv, 1);
      return { approvalStep: g.step, approver: g.who, decisions: g.c.length, approvedN: g.ok, rejectedN: g.no, avgHours: avg, medianHours: r1_(waMedian_(g.c)), p90Hours: r1_(rxQuant_(g.c, 0.9)),
        maxHours: r1_(Math.max.apply(null, g.c)), withinSla: pct_(g.c.filter(function (x) { return x <= RX_SLA_HOURS; }).length, g.c.length), prev: pv, change: c.change, changePct: c.changePct };
    }).sort(function (a, b) { return b.avgHours - a.avgHours; });
    return { columns: [col_('approvalStep', 'code', { group: true }), col_('approver', 'text', { group: true }), col_('decisions', 'int', { sum: true }), col_('approvedN', 'int', { sum: true }),
      col_('rejectedN', 'int', { sum: true }), col_('avgHours', 'hours'), col_('medianHours', 'hours'), col_('p90Hours', 'hours'), col_('maxHours', 'hours'), col_('withinSla', 'pct'),
      col_('prev', 'hours'), col_('change', 'hours'), col_('changePct', 'pct')], rows: rows,
      checks: breach ? [{ level: 'warn', code: 'sla_breach', count: breach }] : [], chart: { type: 'hbar', label: 'approver', value: 'avgHours' } };
  },

  // Everything waiting for a decision now, by who holds it (the line manager by name, or the HR / payroll queue),
  // oldest first, with the days since the last action and since the request.
  req_bottlenecks: function (p, me, ctx, scope, s) {
    var q = rxReqs_(p, me, ctx, scope), now = Date.now(), rows = [];
    q.list.forEach(function (r) {
      if (r.status !== 'pending') return;
      var e = q.ids[r.empId], h = history_(r), since = h.length ? h[h.length - 1].at : r.createdAt, m = ctx.emps[e.managerId];
      var who = r.step === 'manager' ? (m && m.status === 'active' ? m.name : 'hr') : r.step;
      rows.push(Object.assign(base_(e, ctx), { approver: who, approvalStep: r.step, ref: r.ref, type: r.type, created: String(r.createdAt).slice(0, 10),
        waitingSince: localParts_(new Date(since)).date, daysWaiting: r1_((now - Date.parse(since)) / 864e5), ageDays: r1_((now - Date.parse(r.createdAt)) / 864e5) }));
    });
    rows.sort(function (a, b) { return a.approver < b.approver ? -1 : a.approver > b.approver ? 1 : b.daysWaiting - a.daysWaiting; });
    var rank = {}; rows.forEach(function (r) { r.rank = rank[r.approver] = (rank[r.approver] || 0) + 1; });
    var over7 = rows.filter(function (r) { return r.daysWaiting > 7; }).length, over3 = rows.filter(function (r) { return r.daysWaiting > 3 && r.daysWaiting <= 7; }).length;
    return { columns: [col_('approver', 'code', { group: true }), col_('approvalStep', 'code', { group: true }), col_('rank', 'int')].concat(EMP_COLS, [col_('ref', 'id'), col_('type', 'code', { group: true }),
      col_('created', 'date'), col_('waitingSince', 'date'), col_('daysWaiting', 'num'), col_('ageDays', 'num')]), rows: rows,
      checks: [over7 ? { level: 'error', code: 'waiting_over_7', count: over7 } : null, over3 ? { level: 'warn', code: 'waiting_over_3', count: over3 } : null].filter(Boolean),
      chart: { type: 'bars', by: 'approver', value: 'count' } };
  },

  // Requests made per type and month, how they ended, the approval rate, hours to the final decision, and the month before.
  req_volume: function (p, me, ctx, scope, s) {
    var months = rxMonths_(p.from, p.to); if (!months.length) return rxEmpty_();
    var q = rxReqs_(p, me, ctx, scope), first = rxAddMonth_(months[0], -1), by = {}, types = {};
    q.list.forEach(function (r) {
      var m = localParts_(new Date(r.createdAt)).date.slice(0, 7); if (m < first || m > months[months.length - 1]) return;
      var g = by[r.type + '|' + m] || (by[r.type + '|' + m] = { n: 0, approved: 0, rejected: 0, cancelled: 0, pending: 0, hours: [] });
      types[r.type] = 1; g.n++; if (g[r.status] != null) g[r.status]++;
      if ((r.status === 'approved' || r.status === 'rejected') && r.decidedAt) g.hours.push((Date.parse(r.decidedAt) - Date.parse(r.createdAt)) / 3600000);
    });
    var rows = [];
    Object.keys(types).sort().forEach(function (k) {
      months.forEach(function (m) {
        var g = by[k + '|' + m]; if (!g) return;
        var o = by[k + '|' + rxAddMonth_(m, -1)], c = rxChg_(g.n, o ? o.n : 0, 0);
        rows.push({ type: k, month: m, requests: g.n, approvedN: g.approved, rejectedN: g.rejected, cancelledN: g.cancelled, openReq: g.pending, approvalRate: pct_(g.approved, g.approved + g.rejected),
          avgHours: g.hours.length ? r1_(rxMean_(g.hours)) : null, prev: c.prev, change: c.change, changePct: c.changePct });
      });
    });
    var i = function (k) { return col_(k, 'int', { sum: true }); };
    return { columns: [col_('type', 'code', { group: true }), col_('month', 'text', { group: true }), i('requests'), i('approvedN'), i('rejectedN'), i('cancelledN'), i('openReq'),
      col_('approvalRate', 'pct'), col_('avgHours', 'hours'), i('prev'), i('change'), col_('changePct', 'pct')], rows: rows, chart: { type: 'bars', by: 'type', value: 'requests' } };
  }
});

// ---------------- compliance and employee relations ----------------
Object.assign(REPORT_FNS, {
  // Disciplinary cases by violation in the period (by incident date): open, decided, objected, repeats, penalties by kind,
  // days from the charge to the decision, the fines (hr role and payroll only) and the period before.
  cmp_disciplinary: function (p, me, ctx, scope, s) {
    var t = today_(), pr = rxPrev_(p.from, p.to), ids = {}, by = {}, money = canPayroll_(me), longOpen = 0;
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = 1; });
    readAll_(SHEETS.DCASE).forEach(function (x) {
      if (!ids[x.empId] || x.status === 'cancelled') return;
      var d = String(x.incidentDate).slice(0, 10); if (d < pr.from || d > p.to) return;
      var g = by[x.code] || (by[x.code] = { violation: x.violation, cases: 0, open: 0, decided: 0, objected: 0, repeat: 0, warnings: 0, fines: 0, suspensions: 0, dismissals: 0, days: [], amount: 0, prev: 0 });
      if (d < p.from) { g.prev++; return; }
      var k = penaltyParts_(x.decision || '').kind, open = x.status === 'charged' || x.status === 'responded';
      g.cases++; if (open) g.open++; if (x.decidedAt) g.decided++; if (x.status === 'objected' || x.objectedAt) g.objected++; if (Number(x.occurrence) >= 2) g.repeat++;
      if (k === 'warning' || k === 'written') g.warnings++; else if (k === 'fine_pct' || k === 'fine_days') g.fines++; else if (k === 'suspend') g.suspensions++; else if (k.indexOf('dismiss') === 0) g.dismissals++;
      if (x.decidedAt && x.chargedAt) g.days.push((Date.parse(x.decidedAt) - Date.parse(x.chargedAt)) / 864e5);
      g.amount += Number(x.amount) || 0;
      if (open && x.chargedAt && daysBetween_(String(x.chargedAt).slice(0, 10), t) > 30) longOpen++;
    });
    var rows = Object.keys(by).filter(function (k) { return by[k].cases || by[k].prev; }).map(function (k) {
      var g = by[k], row = { code: k, violation: g.violation, cases: g.cases, openCases: g.open, decided: g.decided, objected: g.objected, repeat: g.repeat, warnings: g.warnings, fines: g.fines,
        suspensions: g.suspensions, dismissals: g.dismissals, avgDays: g.days.length ? r1_(rxMean_(g.days)) : null, prev: g.prev, change: g.cases - g.prev };
      if (money) row.amount = r2_(g.amount);
      return row;
    }).sort(function (a, b) { return b.cases - a.cases; });
    var i = function (k) { return col_(k, 'int', { sum: true }); }, cols = [col_('code', 'id'), col_('violation'), i('cases'), i('openCases'), i('decided'), i('objected'), i('repeat'), i('warnings'), i('fines'),
      i('suspensions'), i('dismissals'), col_('avgDays', 'num')];
    if (money) cols.push(col_('amount', 'money', { sum: true }));
    return { columns: cols.concat([i('prev'), i('change')]), rows: rows,
      checks: longOpen ? [{ level: 'warn', code: 'case_open_long', count: longOpen }] : [], chart: { type: 'hbar', label: 'violation', value: 'cases' } };
  },

  // Work injuries: GOSI must hear within 3 days of the injury. When it was told, how late, days off, and where each case stands.
  cmp_injuries: function (p, me, ctx, scope, s) {
    var t = today_(), pr = rxPrev_(p.from, p.to), ids = {}, rows = [], prevN = 0;
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.INJ).forEach(function (x) {
      var e = ids[x.empId]; if (!e) return;
      var d = String(x.occurredAt).slice(0, 10); if (d >= pr.from && d <= pr.to) prevN++;
      if (d < p.from || d > p.to) return;
      var due = String(x.gosiDue).slice(0, 10), rep = x.gosiReportedAt ? localParts_(new Date(x.gosiReportedAt)).date : '';
      var tl = rep ? (rep > due ? 'late' : 'on_time') : t > due ? 'overdue' : 'due', delay = rep ? Math.max(0, daysBetween_(due, rep)) : t > due ? daysBetween_(due, t) : 0;
      var off = x.offFrom && x.offTo ? daysBetween_(String(x.offFrom).slice(0, 10), String(x.offTo).slice(0, 10)) + 1 : 0;
      rows.push(Object.assign(base_(e, ctx), { ref: x.ref, occurred: d, place: x.place, gosiDue: due, gosiReported: rep, delayDays: delay, timeliness: tl, daysOff: off, status: x.status }));
    });
    rows.sort(function (a, b) { return a.occurred < b.occurred ? 1 : -1; });
    var n = function (k) { return rows.filter(function (r) { return r.timeliness === k; }).length; };
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('occurred', 'date'), col_('place'), col_('gosiDue', 'date'), col_('gosiReported', 'date'), col_('delayDays', 'int'),
      col_('timeliness', 'code', { group: true }), col_('daysOff', 'int', { sum: true }), col_('status', 'status', { group: true })]), rows: rows,
      checks: [n('overdue') ? { level: 'error', code: 'gosi_overdue', count: n('overdue') } : null, n('late') ? { level: 'warn', code: 'gosi_late', count: n('late') } : null,
        { level: 'info', code: 'prev_count', count: prevN }].filter(Boolean), chart: { type: 'bars', by: 'timeliness', value: 'count' } };
  },

  // Company assets held now, per person and type: items, value, receipts not yet confirmed, how long held; leavers still holding.
  cmp_custody: function (p, me, ctx, scope, s) {
    var t = today_(), ids = {}, assets = {}, by = {}, leavers = {};
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.ASSET).forEach(function (a) { assets[a.id] = a; });
    readAll_(SHEETS.CUST).forEach(function (c) {
      var e = ids[c.empId]; if (!e || c.status !== 'held') return;
      var a = assets[c.assetId] || {}, k = c.empId + '|' + (a.type || 'other'), g = by[k] || (by[k] = { e: e, type: a.type || 'other', items: 0, value: 0, unacked: 0, since: '' });
      var h = String(c.handedAt).slice(0, 10);
      g.items++; g.value += Number(a.value) || 0; if (!c.ackAt) g.unacked++; if (!g.since || h < g.since) g.since = h;
      if (e.status !== 'active' || isoDate_(e.lastWorkingDay)) leavers[e.id] = 1;
    });
    var rows = Object.keys(by).map(function (k) {
      var g = by[k], gone = g.e.status !== 'active' || isoDate_(g.e.lastWorkingDay);
      return Object.assign(base_(g.e, ctx), { assetType: g.type, items: g.items, value: r2_(g.value), unacked: g.unacked, heldSince: g.since, heldDays: g.since ? daysBetween_(g.since, t) : null, leaving: gone ? 'yes' : '' });
    }).sort(function (a, b) { return b.value - a.value; });
    var un = rows.reduce(function (x, r) { return x + r.unacked; }, 0), lv = Object.keys(leavers).length;
    return { columns: EMP_COLS.concat([col_('assetType', 'code', { group: true }), col_('items', 'int', { sum: true }), col_('value', 'money', { sum: true }), col_('unacked', 'int', { sum: true }),
      col_('heldSince', 'date'), col_('heldDays', 'int'), col_('leaving', 'code', { group: true })]), rows: rows,
      checks: [lv ? { level: 'error', code: 'leaver_holds_assets', count: lv } : null, un ? { level: 'warn', code: 'custody_unacked', count: un } : null].filter(Boolean),
      chart: { type: 'bars', by: 'assetType', value: 'value' } };
  },

  // Offboarding clearances: progress, the open tasks by owner (manager, HR, payroll), assets still held, overdue ones.
  cmp_clearance: function (p, me, ctx, scope, s) {
    var t = today_(), ids = {}, rows = [];
    reportEmps_(p, ctx, scope, true).forEach(function (e) { ids[e.id] = e; });
    readAll_(SHEETS.CLR).forEach(function (x) {
      var e = ids[x.empId]; if (!e || x.status === 'cancelled') return;
      var v = clearanceView_(x, me, ctx), open = function (o) { return v.tasks.filter(function (k) { return k.owner === o && k.status !== 'done'; }).length; }, held = v.tasks.filter(function (k) { return k.key === 'assets'; })[0];
      rows.push(Object.assign(base_(e, ctx), { ref: x.ref, reason: x.reason, lastDay: v.lastDay, daysLeft: v.daysLeft, tasksDone: v.done, tasksTotal: v.total, progress: pct_(v.done, v.total),
        openManager: open('manager'), openHr: open('hr'), openPayroll: open('payroll'), assetsHeld: held ? held.held || 0 : 0, status: v.status, overdue: v.status === 'open' && v.lastDay < t ? 'yes' : '' }));
    });
    rows.sort(function (a, b) { return a.lastDay < b.lastDay ? -1 : 1; });
    var over = rows.filter(function (r) { return r.overdue; }).length, held = rows.filter(function (r) { return r.status === 'open' && r.assetsHeld; }).length;
    var i = function (k) { return col_(k, 'int', { sum: true }); };
    return { columns: EMP_COLS.concat([col_('ref', 'id'), col_('reason', 'code', { group: true }), col_('lastDay', 'date'), col_('daysLeft', 'int'), col_('tasksDone', 'int'), col_('tasksTotal', 'int'),
      col_('progress', 'pct'), i('openManager'), i('openHr'), i('openPayroll'), i('assetsHeld'), col_('status', 'status', { group: true }), col_('overdue', 'code')]), rows: rows,
      checks: [over ? { level: 'error', code: 'clearance_overdue', count: over } : null, held ? { level: 'warn', code: 'clearance_assets', count: held } : null].filter(Boolean),
      chart: { type: 'bars', by: 'status', value: 'count' } };
  },

  // WPS and wage reconciliation month by month: the run, the WPS file (generated, uploaded with the bank / Mudad reference,
  // confirmed), the due date and days late, and the latest GOSI and Qiwa uploads with their mismatches. Totals only.
  rec_pipeline: function (p, me, ctx, scope, s) {
    var ds = deptSet_(p, ctx), t = today_(), cands = {}, intv = {}, offs = {}, rows = [], stale = 0;
    readAll_(SHEETS.CAND).forEach(function (c) { if (c.stage === 'erased') return; var x = cands[c.reqId] = cands[c.reqId] || { n: 0, hired: 0, internal: 0 }; x.n++; if (c.stage === 'hired') x.hired++; if (c.source === 'internal') x.internal++; });
    readAll_(SHEETS.INTV).forEach(function (i) { intv[i.reqId] = (intv[i.reqId] || 0) + 1; });
    readAll_(SHEETS.OFFER).forEach(function (o) { offs[o.reqId] = (offs[o.reqId] || 0) + 1; });
    readAll_(SHEETS.REQN).forEach(function (q) {
      if (ds && !ds[q.departmentId]) return;
      var c = cands[q.id] || { n: 0, hired: 0, internal: 0 }, opened = String(q.decidedAt || q.createdAt || '').slice(0, 10), open = q.status === 'approved';
      var days = opened ? daysBetween_(opened, t) : null;
      if (open && days > 60) stale++;
      rows.push({ ref: q.ref, title: q.titleAr, department: ctx.depts[q.departmentId] ? ctx.depts[q.departmentId].nameAr : '', status: q.status, headcount: Number(q.headcount) || 1, filled: Number(q.filled) || 0,
        candidates: c.n, internal: c.internal, interviews: intv[q.id] || 0, offers: offs[q.id] || 0, hired: c.hired, daysOpen: open ? days : null });
    });
    return { columns: [col_('ref', 'id'), col_('title'), col_('department', 'text', { group: true }), col_('status', 'status', { group: true }), col_('headcount', 'int', { sum: true }), col_('filled', 'int', { sum: true }),
      col_('candidates', 'int', { sum: true }), col_('internal', 'int', { sum: true }), col_('interviews', 'int', { sum: true }), col_('offers', 'int', { sum: true }), col_('hired', 'int', { sum: true }), col_('daysOpen', 'days')],
      rows: rows, checks: stale ? [{ level: 'warn', code: 'req_open_60', count: stale }] : [], chart: { type: 'bars', by: 'department', value: 'candidates' } };
  },

  rec_sources: function (p, me, ctx, scope, s) {
    var by = {}, intv = {}, offs = {};
    readAll_(SHEETS.INTV).forEach(function (i) { intv[i.candidateId] = 1; });
    readAll_(SHEETS.OFFER).forEach(function (o) { offs[o.candidateId] = 1; });
    readAll_(SHEETS.CAND).forEach(function (c) {
      var d = String(c.createdAt || '').slice(0, 10); if (c.stage === 'erased' || d < p.from || d > p.to) return;
      var x = by[c.source || 'other'] = by[c.source || 'other'] || { candidates: 0, interviewed: 0, offered: 0, hired: 0 };
      x.candidates++; if (intv[c.id]) x.interviewed++; if (offs[c.id]) x.offered++; if (c.stage === 'hired') x.hired++;
    });
    var rows = Object.keys(by).map(function (k) { var x = by[k]; return { source: k, candidates: x.candidates, interviewed: x.interviewed, offered: x.offered, hired: x.hired, hireRate: x.candidates ? Math.round(x.hired / x.candidates * 1000) / 10 : 0 }; })
      .sort(function (a, b) { return b.candidates - a.candidates; });
    return { columns: [col_('source', 'code', { group: true }), col_('candidates', 'int', { sum: true }), col_('interviewed', 'int', { sum: true }), col_('offered', 'int', { sum: true }), col_('hired', 'int', { sum: true }), col_('hireRate', 'pct')],
      rows: rows, checks: [], chart: { type: 'hbar', label: 'source', value: 'candidates' } };
  },

  trn_hours: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), t = today_(), soon = addDays_(t, 90), by = {}, rows = [], expiring = 0, none = 0;
    readAll_(SHEETS.TENR).forEach(function (x) {
      var d = String(x.issuedOn || x.updatedAt || '').slice(0, 10);
      var r = by[x.empId] = by[x.empId] || { done: 0, hours: 0, cost: 0, expiring: 0 };
      var exp = String(x.expiresOn || '').slice(0, 10);
      if (exp && exp >= t && exp <= soon) r.expiring++;
      if (x.status !== 'completed' && x.result !== 'passed' && x.status !== 'passed') return;
      if (d && (d < p.from || d > p.to)) return;
      r.done++; r.hours += Number(x.hours) || 0; r.cost += Number(x.cost) || 0;
    });
    emps.forEach(function (e) { var r = by[e.id] || { done: 0, hours: 0, cost: 0, expiring: 0 }; if (!r.done) none++; expiring += r.expiring ? 1 : 0;
      rows.push(Object.assign(base_(e, ctx), { courses: r.done, hours: Math.round(r.hours * 10) / 10, cost: Math.round(r.cost * 100) / 100, certExpiring: r.expiring })); });
    return { columns: EMP_COLS.concat([col_('courses', 'int', { sum: true }), col_('hours', 'hours', { sum: true }), col_('cost', 'money', { sum: true }), col_('certExpiring', 'int', { sum: true })]), rows: rows,
      checks: [none ? { level: 'info', code: 'no_training', count: none } : null, expiring ? { level: 'warn', code: 'cert_expiring', count: expiring } : null].filter(Boolean), chart: { type: 'bars', by: 'department', value: 'hours' } };
  },

  ins_coverage: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), self = {}, deps = {}, rows = [], uncovered = 0;
    readAll_(SHEETS.INSM).forEach(function (m) {
      if (m.status !== 'active' && m.status !== 'pending_delete') return;
      if (m.relation === 'self') self[m.empId] = m; else deps[m.empId] = (deps[m.empId] || 0) + 1;
    });
    emps.forEach(function (e) {
      var m = self[e.id], saudi = bool_(e.isSaudi);
      if (!m && !saudi) uncovered++;
      rows.push(Object.assign(base_(e, ctx), { saudi: saudi ? 'saudi' : 'non_saudi', covered: m ? 'yes' : 'no', insClass: m ? m.insClass || '' : '', dependants: deps[e.id] || 0, memberNo: m ? String(m.memberNo || '') : '' }));
    });
    return { columns: EMP_COLS.concat([col_('saudi', 'code', { group: true }), col_('covered', 'code', { group: true }), col_('insClass', 'text', { group: true }), col_('dependants', 'int', { sum: true }), col_('memberNo', 'text')]), rows: rows,
      checks: uncovered ? [{ level: 'error', code: 'non_saudi_uncovered', count: uncovered }] : [], chart: { type: 'bars', by: 'department', value: 'count' } };
  },

  cmp_wps: function (p, me, ctx, scope, s) {
    var months = rxMonths_(p.from, p.to); if (!months.length) return rxEmpty_();
    var t = today_(), runs = {}, wps = {}, rec = {}, rows = [], overdue = 0, open = 0, notLocked = 0;
    readAll_(SHEETS.RUN).forEach(function (r) { if (r.status !== 'cancelled' && !isDemoRun_(r) && months.indexOf(r.month) >= 0) runs[r.month] = r; }); // WPS duty: the company's runs
    readAll_(SHEETS.WPS).forEach(function (w) { wps[w.runId] = w; });
    readAll_(SHEETS.RECON).forEach(function (x) { var k = x.month + '|' + x.source; if (!rec[k] || String(x.at) > String(rec[k].at)) rec[k] = x; });
    months.forEach(function (m) {
      var r = runs[m], g = rec[m + '|gosi'], q = rec[m + '|qiwa']; if (!r && !g && !q) return;
      var w = r ? wps[r.id] : null, due = wpsDue_(m, s), up = w && w.uploadedAt ? localParts_(new Date(w.uploadedAt)).date : '', tt = r ? publicRun_(r).totals || {} : {};
      var late = up ? Math.max(0, daysBetween_(due, up)) : t > due ? daysBetween_(due, t) : 0;
      if (r && r.status === 'locked' && !up && t > due) overdue++;
      if (r && r.status !== 'locked') notLocked++;
      [g, q].forEach(function (x) { if (x && x.status === 'open') open++; });
      rows.push({ month: m, payrollRef: r ? r.ref : '', runStatus: r ? r.status : 'none', payslips: tt.headcount == null ? null : Number(tt.headcount), net: tt.net == null ? null : Number(tt.net),
        wpsStatus: w ? w.status : 'none', due: due, uploaded: up, daysLate: late, bankRef: w ? String(w.bankRef || '') : '',
        gosiRecon: g ? g.status : 'none', gosiMismatches: g ? parseJson_(g.mismatchesJson, []).length : null, qiwaRecon: q ? q.status : 'none', qiwaMismatches: q ? parseJson_(q.mismatchesJson, []).length : null });
    });
    return { columns: [col_('month', 'text'), col_('payrollRef', 'id'), col_('runStatus', 'code'), col_('payslips', 'int'), col_('net', 'money', { sum: true }), col_('wpsStatus', 'code', { group: true }),
      col_('due', 'date'), col_('uploaded', 'date'), col_('daysLate', 'int'), col_('bankRef', 'id'), col_('gosiRecon', 'code'), col_('gosiMismatches', 'int', { sum: true }), col_('qiwaRecon', 'code'),
      col_('qiwaMismatches', 'int', { sum: true })], rows: rows,
      checks: [overdue ? { level: 'error', code: 'wps_overdue', count: overdue } : null, open ? { level: 'warn', code: 'recon_open', count: open } : null,
        notLocked ? { level: 'info', code: 'run_not_locked', count: notLocked } : null].filter(Boolean), chart: { type: 'bars', by: 'wpsStatus', value: 'count' } };
  }
});


// ======================================================================= scheduled reports by e-mail (2026-10-21)
// docs/research/2026-10-21-scheduled-reports-design.md. A subscription re-runs a saved report on a schedule and e-mails it
// through the Microsoft 365 sender (the same as payslips and the digest). It runs on the server AS EACH RECIPIENT at send
// time: their access and row-level scope decide what they get, so a person who lost access stops receiving at once.
// Money columns never leave by e-mail and pay reports ('money' access) cannot be scheduled. Every send is numbered in the
// export log (format 'email') with the same SHA-256 fingerprint, so an e-mailed report can be verified like a printed one.
// No time trigger (no scope for it): like the digest, the first writing request after a run is due sends it.
var RSUB_PERIODS_ = { yesterday: 1, last7: 1, last30: 1, thisMonth: 1, lastMonth: 1 };
var RSUB_CADENCE_ = { daily: 1, weekly: 1, monthly: 1 };
var RSUB_MAX_PER_OWNER_ = 20, RSUB_MAX_RECIPIENTS_ = 10, RSUB_PREVIEW_ROWS_ = 25;

/** The report's parameters for this send: the saved filters with the dates moved to the chosen period. */
function rsubParams_(def, saved, period, today) {
  var p = JSON.parse(JSON.stringify(saved || {})), m0 = today.slice(0, 8) + '01', lm = addDays_(m0, -1);
  var range = { yesterday: [addDays_(today, -1), addDays_(today, -1)], last7: [addDays_(today, -7), addDays_(today, -1)], last30: [addDays_(today, -30), addDays_(today, -1)],
    thisMonth: [m0, today], lastMonth: [lm.slice(0, 8) + '01', lm] }[period] || [m0, today];
  if (def.params.indexOf('range31') >= 0 && daysBetween_(range[0], range[1]) >= 31) range[0] = addDays_(range[1], -30);
  p.from = range[0]; p.to = range[1];
  if (def.params.indexOf('month') >= 0) p.month = period === 'lastMonth' ? lm.slice(0, 7) : today.slice(0, 7);
  if (def.params.indexOf('asOf') >= 0) p.asOf = period === 'lastMonth' ? lm : today;
  return p;
}
/** The next send after `from`, at the chosen hour in Riyadh time. */
function rsubNext_(sub, from) {
  var day = localParts_(from).date, hour = Number(sub.hour) || 7;
  for (var i = 0; i < 70; i++, day = addDays_(day, 1)) {
    var at = new Date(Date.parse(day + 'T' + (hour < 10 ? '0' : '') + hour + ':00:00Z') - CONFIG.TZ_OFFSET_MIN * 60000);
    if (at <= from) continue;
    var dow = new Date(day + 'T12:00:00Z').getUTCDay(), dom = Number(day.slice(8, 10));
    if (sub.cadence === 'weekly' && dow !== Number(sub.weekday)) continue;
    if (sub.cadence === 'monthly' && dom !== Number(sub.monthDay)) continue;
    return at.toISOString();
  }
  return '';
}
function rsubRecipients_(sub) { return parseJson_(sub.recipientsJson, []); }
function publicRsub_(x, names) {
  return { id: x.id, code: x.code, owner: names[x.ownerId] || '', ownerId: x.ownerId, reportId: x.reportId, label: x.label, period: x.period, cadence: x.cadence,
    weekday: Number(x.weekday), monthDay: Number(x.monthDay), hour: Number(x.hour), recipients: rsubRecipients_(x).map(function (id) { return { id: id, name: names[id] || '' }; }),
    params: parseJson_(x.paramsJson, {}), columns: parseJson_(x.columnsJson, []), status: x.status, nextRunAt: x.nextRunAt, lastRunAt: x.lastRunAt, lastStatus: x.lastStatus, lastRef: x.lastRef };
}
function api_reportSubList(req, me) {
  var names = {}, emp = null; readAll_(SHEETS.EMP).forEach(function (e) { names[e.id] = e.name; if (e.id === me.id) emp = e; });
  var all = isHr_(me) && req.all;
  var rows = readAll_(SHEETS.RSUB).filter(function (x) { return x.status !== 'deleted' && (all || x.ownerId === me.id || rsubRecipients_(x).indexOf(me.id) >= 0); });
  return { ok: true, rows: rows.map(function (x) { return publicRsub_(x, names); }), mailReady: !!mailConfig_(), myEmail: !!(emp && emp.email), canOthers: isHr_(me) };
}
/** Create or change a subscription; { id, pause | resume | remove } for the owner (or HR). */
function api_reportSubSave(req, me) {
  return withLock_(function () {
    var now = new Date(), x = req.id ? findBy_(SHEETS.RSUB, 'id', String(req.id)) : null;
    if (req.id && (!x || x.status === 'deleted')) fail_('not_found');
    if (x && x.ownerId !== me.id && !isHr_(me)) fail_('forbidden');
    if (x && (req.pause || req.resume || req.remove)) {
      x.status = req.remove ? 'deleted' : req.pause ? 'paused' : 'active';
      if (req.resume) { x.nextRunAt = rsubNext_(x, now); x.fails = 0; }
      x.updatedAt = now.toISOString(); update_(SHEETS.RSUB, x);
      CacheService.getScriptCache().remove('rsub:next');
      audit_(me.id, 'report_sub_' + x.status, '', { code: x.code });
      return { ok: true };
    }
    var reportId = x ? x.reportId : String(req.reportId || ''), def = REPORTS[reportId], ctx = orgCtx_();
    if (!def) fail_('not_found');
    if (def.access === 'money') fail_('not_emailable');
    if (!reportAllowed_(def, me, ctx)) fail_('forbidden');
    if (!RSUB_PERIODS_[req.period] || !RSUB_CADENCE_[req.cadence]) fail_('missing_fields');
    var hour = Math.round(Number(req.hour)), wd = Math.round(Number(req.weekday) || 0), md = Math.round(Number(req.monthDay) || 1);
    if (!(hour >= 5 && hour <= 22) || wd < 0 || wd > 6 || md < 1 || md > 28) fail_('missing_fields');
    var rec = (Array.isArray(req.recipients) && req.recipients.length ? req.recipients : [me.id]).map(String).filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (rec.length > RSUB_MAX_RECIPIENTS_) fail_('too_many');
    if (!isHr_(me) && (rec.length !== 1 || rec[0] !== me.id)) fail_('forbidden'); // only HR sends to other people
    rec.forEach(function (id) {
      var e = ctx.emps[id];
      if (!e || e.status !== 'active') fail_('not_found');
      if (!e.email) fail_('no_email');
      if (!reportAllowed_(def, e, ctx)) fail_('recipient_no_access');
    });
    if (!x && readAll_(SHEETS.RSUB).filter(function (s) { return s.ownerId === me.id && s.status !== 'deleted'; }).length >= RSUB_MAX_PER_OWNER_) fail_('too_many');
    var lbl = req.labels || {}, cols = {};
    Object.keys(lbl.cols || {}).slice(0, 120).forEach(function (k) { cols[str_(k, 40)] = str_(lbl.cols[k], 80); });
    var p = reportParams_(def, req.params); delete p.from; delete p.to; delete p.month; delete p.asOf;
    var row = x || { id: newId_('S'), code: nextRef_('reportSub', refsOf_(SHEETS.RSUB)), ownerId: me.id, reportId: reportId, createdAt: now.toISOString(), lastRunAt: '', lastStatus: '', lastRef: '', fails: 0 };
    row.label = str_(lbl.name || req.label, 120) || reportId; row.lang = req.lang === 'en' ? 'en' : 'ar';
    row.paramsJson = JSON.stringify(p); row.columnsJson = JSON.stringify((req.columns || []).map(String).slice(0, 120)); row.labelsJson = JSON.stringify(cols);
    row.period = req.period; row.cadence = req.cadence; row.weekday = wd; row.monthDay = md; row.hour = hour; row.recipientsJson = JSON.stringify(rec);
    row.status = 'active'; row.updatedAt = now.toISOString(); row.nextRunAt = rsubNext_(row, now);
    if (x) update_(SHEETS.RSUB, row); else append_(SHEETS.RSUB, row);
    CacheService.getScriptCache().remove('rsub:next');
    audit_(me.id, x ? 'report_sub_change' : 'report_sub_create', '', { code: row.code, report: reportId, recipients: rec.length });
    return { ok: true, sub: publicRsub_(row, (function () { var n = {}; Object.keys(ctx.emps).forEach(function (k) { n[k] = ctx.emps[k].name; }); return n; })()) };
  });
}
/** "Send me one now": runs it as the caller and e-mails only the caller (a test of what the others will get). */
function api_reportSubSend(req, me) {
  var x = findBy_(SHEETS.RSUB, 'id', String(req.id || ''));
  if (!x || x.status === 'deleted') fail_('not_found');
  if (x.ownerId !== me.id && !isHr_(me) && rsubRecipients_(x).indexOf(me.id) < 0) fail_('forbidden');
  var cfg = mailConfig_(); if (!cfg) fail_('email_not_configured');
  if (!rateLimit_('rsubsend:' + me.id, 5, 3600)) fail_('too_many_attempts');
  var emp = findBy_(SHEETS.EMP, 'id', me.id);
  var out = rsubDeliver_(x, emp, cfg, null, orgCtx_());
  if (!out.ok) fail_(out.error);
  return { ok: true, to: emp.email, ref: out.ref, rows: out.rows };
}
/** Run the report as `emp` and e-mail it to them. Never throws: returns { ok, ref } or { ok:false, error }. */
function rsubDeliver_(x, emp, cfg, token, ctx) {
  try {
    var def = REPORTS[x.reportId];
    if (!def || def.access === 'money') return { ok: false, error: 'not_emailable' };
    if (!emp || emp.status !== 'active') return { ok: false, error: 'not_found' };
    if (!emp.email) return { ok: false, error: 'no_email' };
    if (!reportAllowed_(def, emp, ctx)) return { ok: false, error: 'recipient_no_access' };
    var today = localParts_(new Date()).date;
    var p = reportParams_(def, rsubParams_(def, parseJson_(x.paramsJson, {}), x.period, today));
    var res = runReport_(x.reportId, p, emp, ctx);
    keepColumns_(res, parseJson_(x.columnsJson, []));
    res.columns = res.columns.filter(function (c) { return c.type !== 'money'; }); // no pay figure leaves by e-mail
    if (!res.columns.length) return { ok: false, error: 'not_emailable' };
    p.columns = res.columns.map(function (c) { return c.key; });
    var hash = reportHash_(x.reportId, p, res), at = new Date().toISOString(), ref;
    withLock_(function () {
      ref = nextRef_('report', refsOf_(SHEETS.RLOG));
      append_(SHEETS.RLOG, { id: newId_('X'), ref: ref, reportId: x.reportId, paramsJson: JSON.stringify(p), rows: res.rows.length, format: 'email', hash: hash, by: emp.id, at: at, reviewedBy: '', reviewedAt: '', reviewNote: '' });
    });
    var labels = parseJson_(x.labelsJson, {}), html = rsubHtml_(x, emp, res, p, labels, ref, hash);
    var csv = rsubCsv_(res, labels), file = x.code + '_' + ref + '.csv';
    graphSend_(cfg, token || graphToken_(cfg), emp.email, (x.lang === 'en' ? 'Report: ' : 'تقرير: ') + x.label + ' (' + (p.from || p.month || p.asOf) + (p.to && p.to !== p.from ? ' → ' + p.to : '') + ')', html,
      [{ name: file, type: 'text/csv', bytes: Utilities.newBlob('﻿' + csv).getBytes() }]);
    audit_(emp.id, 'report_emailed', '', { code: x.code, ref: ref, rows: res.rows.length });
    return { ok: true, ref: ref, rows: res.rows.length };
  } catch (e) { var m = /^E:(w+)/.exec(e && e.message || ''); return { ok: false, error: m ? m[1] : 'email_send_failed' }; }
}
function rsubCell_(c, v) {
  if (v == null) return '';
  if (typeof v === 'object') return Array.isArray(v) ? v.join(' ') : JSON.stringify(v);
  if (c.type === 'pct' && typeof v === 'number') return (Math.round(v * 10) / 10) + '%';
  return String(v);
}
function rsubCsv_(res, labels) {
  var q = function (s) { s = String(s); if (/^[=+@]/.test(s) || /^-(?![0-9.])/.test(s)) s = "'" + s; /* formula guard; negative numbers stay numbers */ return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [res.columns.map(function (c) { return q(labels[c.key] || c.key); }).join(',')].concat(res.rows.map(function (r) {
    return res.columns.map(function (c) { return q(rsubCell_(c, r[c.key])); }).join(',');
  })).join('\r\n');
}
function rsubHtml_(x, emp, res, p, labels, ref, hash) {
  var en = x.lang === 'en', esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); };
  var s = settings_(), url = s.appUrl || 'https://besgasksa.github.io/BG-attendance/', cols = res.columns.slice(0, 8), td = 'padding:6px 8px;border-bottom:1px solid #eee;text-align:' + (en ? 'left' : 'right');
  var warn = (res.checks || []).filter(function (c) { return c.level === 'error' || c.level === 'warn'; }).length;
  var period = p.from ? p.from + (p.to !== p.from ? ' → ' + p.to : '') : (p.month || p.asOf || '');
  return '<div dir="' + (en ? 'ltr' : 'rtl') + '" style="font-family:Tahoma,Arial,sans-serif;color:#17221A;max-width:760px">' +
    '<p style="margin:0;color:#4D6D51;font-weight:bold">' + esc(en ? s.companyNameEn || s.companyNameAr : s.companyNameAr) + '</p>' +
    '<h2 style="margin:4px 0">' + esc(x.label) + '</h2>' +
    '<p style="margin:0 0 12px;color:#4A5A4D">' + esc(period) + ' · ' + res.rows.length + (en ? ' rows' : ' صف') + ' · ' + (en ? 'No. ' : 'الرقم ') + esc(ref) + (res.teamOnly ? (en ? ' · your team only' : ' · فريقك فقط') : '') + '</p>' +
    (warn ? '<p style="background:#FFF4DC;padding:8px 10px;border-radius:8px">' + (en ? warn + ' data check(s) need attention; open the report in the app for details.' : 'يوجد ' + warn + ' من فحوص البيانات تحتاج انتباها؛ افتح التقرير في التطبيق للتفاصيل.') + '</p>' : '') +
    '<table style="border-collapse:collapse;font-size:13px;width:100%"><tr>' + cols.map(function (c) { return '<th style="' + td + ';background:#F2EEE4">' + esc(labels[c.key] || c.key) + '</th>'; }).join('') + '</tr>' +
    res.rows.slice(0, RSUB_PREVIEW_ROWS_).map(function (r) { return '<tr>' + cols.map(function (c) { return '<td style="' + td + '">' + esc(rsubCell_(c, r[c.key])) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
    '<p style="color:#4A5A4D;font-size:13px">' + (en ? (res.rows.length > RSUB_PREVIEW_ROWS_ || res.columns.length > cols.length ? 'The first rows and columns are shown; the full report is attached (CSV). ' : 'The report is also attached (CSV). ') + 'Pay figures are never sent by e-mail.'
      : (res.rows.length > RSUB_PREVIEW_ROWS_ || res.columns.length > cols.length ? 'تظهر الصفوف والأعمدة الأولى؛ التقرير كاملا في الملف المرفق (CSV). ' : 'التقرير مرفق أيضا (CSV). ') + 'لا ترسل أرقام الرواتب بالبريد أبدا.') + '</p>' +
    '<p style="color:#4A5A4D;font-size:12px">' + (en ? 'Fingerprint: ' : 'البصمة: ') + '<span dir="ltr" style="font-family:monospace">' + esc(hash.slice(0, 16)) + '</span> · ' +
    (en ? 'You get this because of subscription ' : 'تصلك هذه الرسالة بسبب الاشتراك ') + esc(x.code) + '. <a href="' + esc(url) + '#insights/schedules">' + (en ? 'Manage or stop it' : 'إدارته أو إيقافه') + '</a></p></div>';
}
/**
 * Lazy sweep, after a writing request (like the digest). A cache key holds the earliest due time, so most requests cost one
 * cache read. One subscription per request; five failures in a row pause it. A recipient who lost access is skipped and logged.
 */
function reportSubsSweep_() {
  try {
    var c = CacheService.getScriptCache(), next = c.get('rsub:next'), now = new Date();
    if (next && next > now.toISOString()) return;
    var cfg = mailConfig_(); if (!cfg) { c.put('rsub:next', new Date(now.getTime() + 3600000).toISOString(), 3600); return; }
    if (!rateLimit_('rsub:run', 1, 20)) return;
    var subs = readAll_(SHEETS.RSUB).filter(function (x) { return x.status === 'active' && x.nextRunAt; }).sort(function (a, b) { return a.nextRunAt < b.nextRunAt ? -1 : 1; });
    var due = subs.filter(function (x) { return x.nextRunAt <= now.toISOString(); })[0];
    if (!due) { c.put('rsub:next', subs.length ? subs[0].nextRunAt : new Date(now.getTime() + 21600000).toISOString(), 21600); return; }
    var ctx = orgCtx_(), owner = ctx.emps[due.ownerId], token = null, sent = 0, errs = [], refs = [];
    if (!owner || owner.status !== 'active') { due.status = 'paused'; due.lastStatus = 'owner_inactive'; }
    else { try { token = graphToken_(cfg); } catch (e) { errs.push('email_auth_failed'); } }
    if (token) rsubRecipients_(due).forEach(function (id) {
      var out = rsubDeliver_(due, ctx.emps[id], cfg, token, ctx);
      if (out.ok) { sent++; refs.push(out.ref); } else errs.push(out.error);
    });
    due.lastRunAt = now.toISOString(); due.lastRef = refs.join(' ');
    if (due.status === 'active') {
      due.lastStatus = errs.length ? (sent ? 'partial:' : 'failed:') + errs.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(',') : 'sent';
      due.fails = sent ? 0 : (Number(due.fails) || 0) + 1;
      if (due.fails >= 5) due.status = 'paused';
      due.nextRunAt = rsubNext_(due, now);
    }
    withLock_(function () { update_(SHEETS.RSUB, due); });
    c.remove('rsub:next');
  } catch (e) { console.error('report subs: ' + (e && e.message)); }
}


// ======================================================================= history snapshots (2026-10-21)
// docs/research/2026-10-21-history-snapshots-design.md. At each month end the workforce is frozen: one compact record
// per person employed on the last day (department, position, manager, Saudi, gender, tenure, contract, package, and
// that month's attendance) plus month totals (headcount, Saudization, joiners and leavers, attendance, payroll cost).
// Later edits (a transfer, a renamed department, a pay rise) never change a past month, so trends and drill-downs show
// what was true then. Stored in tab `snapshots` in 40 KB parts with a SHA-256 of the whole record (tamper check).
// Taken lazily: the first writing request after a month ends takes it (no trigger scope). HR can take the current
// month now ('provisional', replaced at month end) or rebuild a missed past month ('rebuilt': departments and pay
// as recorded today, attendance and movement from the real history).
var SNAP_PART_ = 40000, SNAP_MIN_GROUP_ = 5;
var SNAP_DIMS_ = { dept: 'd', position: 'p', nationality: 's', gender: 'g', tenure: 'tb', contract: 'c', grade: 'gr' };

function snapBuild_(month, kind) {
  var t = today_(), asOf = minDate_(monthLast_(month), t), from = month + '-01', ctx = orgCtx_(), s = settings_();
  var reqs = readAll_(SHEETS.REQ), people = waPeople_(ctx, reqs, readAll_(SHEETS.CLR));
  var on = people.filter(function (p) { return waOn_(p, asOf); }), startOn = people.filter(function (p) { return waOn_(p, addDays_(from, -1)); }).length;
  var comps = currentCompMap_(asOf), emps = on.map(function (p) { return ctx.emps[p.id]; });
  var days = daysFor_(emps, from, asOf, s), pos = {};
  readAll_(SHEETS.POS).forEach(function (x) { pos[x.id] = { title: x.titleAr || x.titleEn || x.code || x.id, grade: String(x.grade || '') }; });
  var dims = { d: {}, p: {} }, rec = [], sum = { headcount: on.length, startHeadcount: startOn, saudis: 0, saudiWeighted: 0, female: 0, tenureSum: 0, tenureN: 0,
    present: 0, absent: 0, leave: 0, lateDays: 0, lateMin: 0, packageTotal: 0, withPackage: 0 };
  on.forEach(function (p) {
    var e = ctx.emps[p.id], c = comps[e.id], dl = (days[e.id] || []).filter(function (x) { return x; });
    var a = { pr: 0, ab: 0, lv: 0, lt: 0, lm: 0 };
    dl.forEach(function (x) { if (x.firstIn) a.pr++; if (x.status === 'absent') a.ab++; if (x.status === 'leave') a.lv++; if (x.lateMin) { a.lt++; a.lm += x.lateMin; } });
    var ten = p.hire ? Math.round(daysBetween_(p.hire, asOf) / 365.25 * 10) / 10 : null, saudi = bool_(e.isSaudi);
    if (e.departmentId) dims.d[e.departmentId] = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    if (e.positionId) dims.p[e.positionId] = pos[e.positionId] ? pos[e.positionId].title : (e.title || e.positionId);
    rec.push({ i: e.id, n: String(e.empNo), nm: e.name, d: e.departmentId || '', p: e.positionId || '', m: String(e.managerId || ''), s: saudi ? 1 : 0, nat: String(e.nationality || '').toUpperCase(),
      g: e.gender === 'male' || e.gender === 'female' ? e.gender : '', h: p.hire || '', t: ten, tb: ten == null ? '' : waBand_(ten), c: String(e.contractType || ''), gr: pos[e.positionId] ? pos[e.positionId].grade : '',
      pk: c ? c.total : null, pr: a.pr, ab: a.ab, lv: a.lv, lt: a.lt, lm: a.lm, x: p.leaving ? 1 : 0 });
    if (saudi) { sum.saudis++; sum.saudiWeighted += nitaqatWeight_(c); }
    if (e.gender === 'female') sum.female++;
    if (ten != null) { sum.tenureSum += ten; sum.tenureN++; }
    sum.present += a.pr; sum.absent += a.ab; sum.leave += a.lv; sum.lateDays += a.lt; sum.lateMin += a.lm;
    if (c) { sum.packageTotal += c.total; sum.withPackage++; }
  });
  var hires = people.filter(function (p) { return waCounts_(p) && p.start >= from && p.start <= asOf; });
  var leavers = people.filter(function (p) { return waCounts_(p) && p.end && p.end >= from && p.end <= asOf; });
  sum.hires = hires.length; sum.leavers = leavers.length; sum.voluntary = leavers.filter(function (p) { return p.voluntary; }).length;
  sum.leaverIds = leavers.map(function (p) { return p.id; }); sum.hireIds = hires.map(function (p) { return p.id; });
  var avg = (sum.startHeadcount + sum.headcount) / 2;
  sum.turnoverPct = avg ? Math.round(sum.leavers / avg * 1000) / 10 : null;
  sum.saudiPct = pct_(sum.saudiWeighted, sum.headcount); sum.femalePct = pct_(sum.female, sum.headcount);
  sum.avgTenure = sum.tenureN ? Math.round(sum.tenureSum / sum.tenureN * 10) / 10 : null;
  sum.attendancePct = pct_(sum.present, sum.present + sum.absent); sum.absencePct = pct_(sum.absent, sum.present + sum.absent);
  sum.packageTotal = r2_(sum.packageTotal);
  var run = runsRealFirst_(readAll_(SHEETS.RUN)).filter(function (r) { return r.status === 'locked' && r.month === month; })[0];
  if (run) {
    var tt = totals_(readAll_(SHEETS.SLIP).filter(function (sl) { return sl.runId === run.id && sl.status === 'locked'; }));
    sum.payroll = { source: 'run', ref: run.ref, gross: tt.gross, net: tt.net, gosiEmployer: tt.gosiEmployer, cost: r2_(tt.gross + tt.gosiEmployer) };
  } else sum.payroll = { source: 'packages', cost: sum.packageTotal };
  delete sum.saudiWeighted; delete sum.tenureSum; delete sum.tenureN;
  return { month: month, asOf: asOf, kind: kind, summary: sum, dims: dims, rec: rec };
}
function snapSave_(snap, by) {
  var body = JSON.stringify({ summary: snap.summary, dims: snap.dims, rec: snap.rec }), hash = sha256Hex_(body), parts = [];
  for (var i = 0; i < body.length; i += SNAP_PART_) parts.push(body.slice(i, i + SNAP_PART_));
  var now = new Date().toISOString(), id = newId_('H');
  readAll_(SHEETS.SNAP).forEach(function (x) { if (x.month === snap.month && x.status === 'current') { x.status = 'replaced'; update_(SHEETS.SNAP, x); } });
  appendMany_(SHEETS.SNAP, parts.map(function (p, n) {
    return { id: id + '-' + n, snapId: id, month: snap.month, part: n, parts: parts.length, kind: snap.kind, asOf: snap.asOf, takenAt: now, takenBy: by, status: 'current', hash: n ? '' : hash, data: p };
  }));
  return { id: id, hash: hash };
}
/** The current snapshot of a month, re-assembled and checked against its fingerprint; null if none. */
function snapRead_(month, rows) {
  var mine = (rows || readAll_(SHEETS.SNAP)).filter(function (x) { return x.month === month && x.status === 'current'; }).sort(function (a, b) { return Number(a.part) - Number(b.part); });
  if (!mine.length) return null;
  var head = mine[0], body = mine.map(function (x) { return String(x.data); }).join(''), o = parseJson_(body, null);
  if (!o) return { month: month, kind: head.kind, takenAt: head.takenAt, intact: false };
  o.month = month; o.kind = head.kind; o.asOf = head.asOf; o.takenAt = head.takenAt; o.takenBy = head.takenBy;
  o.intact = mine.length === Number(head.parts) && sha256Hex_(body) === head.hash;
  return o;
}
function snapMonths_(rows) {
  var m = {}; rows.forEach(function (x) { if (x.status === 'current' && Number(x.part) === 0) m[x.month] = { month: x.month, kind: x.kind, takenAt: x.takenAt }; });
  return Object.keys(m).sort().map(function (k) { return m[k]; });
}
/** Lazy month-end capture: last month, once, after any writing request in the new month. */
function snapSweep_() {
  try {
    var c = CacheService.getScriptCache(), t = today_(), prev = addDays_(t.slice(0, 8) + '01', -1).slice(0, 7), key = 'snap:done:' + prev;
    if (c.get(key)) return;
    if (!rateLimit_('snap:run', 1, 60)) return;
    var rows = readAll_(SHEETS.SNAP), have = rows.some(function (x) { return x.month === prev && x.status === 'current' && x.kind !== 'provisional'; });
    var started = readAll_(SHEETS.EMP).some(function (e) { return e.createdAt && String(e.createdAt).slice(0, 7) <= prev; });
    if (!have && started) withLock_(function () { snapSave_(snapBuild_(prev, daysBetween_(monthLast_(prev), t) > 3 ? 'rebuilt' : 'final'), 'auto'); });
    c.put(key, '1', 21600);
  } catch (e) { console.error('snapshot: ' + (e && e.message)); }
}

// ---------------- reading ----------------

function snapCanMoney_(me) { return canDashMoney_(me); }
function snapNames_(me) { return waNames_(me); }
function snapPublicSummary_(sum, me) {
  var o = JSON.parse(JSON.stringify(sum || {}));
  delete o.leaverIds; delete o.hireIds;
  if (!snapCanMoney_(me)) { delete o.packageTotal; delete o.withPackage; delete o.payroll; }
  return o;
}
function api_snapshotList(req, me) {
  if (!canDash_(me)) fail_('forbidden');
  var rows = readAll_(SHEETS.SNAP), months = snapMonths_(rows).slice(-36);
  return { ok: true, months: months.map(function (m) { var s = snapRead_(m.month, rows) || {}; return { month: m.month, kind: m.kind, takenAt: m.takenAt, intact: s.intact !== false, summary: snapPublicSummary_(s.summary, me) }; }),
    canTake: isHr_(me), money: snapCanMoney_(me), names: snapNames_(me), minGroup: SNAP_MIN_GROUP_ };
}
function snapGroupKey_(r, dim) { var f = SNAP_DIMS_[dim]; return f === 's' ? (r.s ? 'saudi' : 'non_saudi') : String(r[f] == null || r[f] === '' ? '-' : r[f]); }
function snapLabel_(snap, dim, k) { return dim === 'dept' ? (snap.dims.d[k] || k) : dim === 'position' ? (snap.dims.p[k] || k) : k; }
function snapGroups_(snap, dim, me) {
  var g = {}, money = snapCanMoney_(me), hr = snapNames_(me);
  snap.rec.forEach(function (r) {
    var k = snapGroupKey_(r, dim), x = g[k] = g[k] || { key: k, label: snapLabel_(snap, dim, k), headcount: 0, saudi: 0, female: 0, ten: 0, tenN: 0, pr: 0, ab: 0, lt: 0, pk: 0, pkN: 0, leaving: 0 };
    x.headcount++; if (r.s) x.saudi++; if (r.g === 'female') x.female++; if (r.t != null) { x.ten += r.t; x.tenN++; }
    x.pr += r.pr; x.ab += r.ab; x.lt += r.lt; if (r.pk != null) { x.pk += r.pk; x.pkN++; }
  });
  return Object.keys(g).map(function (k) {
    var x = g[k], small = x.headcount < SNAP_MIN_GROUP_ && !hr;
    var o = { key: x.key, label: x.label, headcount: x.headcount, small: small };
    if (!small) {
      o.saudiPct = pct_(x.saudi, x.headcount); o.femalePct = pct_(x.female, x.headcount); o.avgTenure = x.tenN ? Math.round(x.ten / x.tenN * 10) / 10 : null;
      o.attendancePct = pct_(x.pr, x.pr + x.ab); o.lateDays = x.lt;
      if (money) { o.packageAvg = x.pkN ? r2_(x.pk / x.pkN) : null; o.packageTotal = r2_(x.pk); }
    }
    return o;
  }).sort(function (a, b) { return b.headcount - a.headcount; });
}
/** One month by a dimension, optionally against another month: groups, and who joined, left or moved between them. */
function api_snapshotView(req, me) {
  if (!canDash_(me)) fail_('forbidden');
  var dim = SNAP_DIMS_[req.dim] ? req.dim : 'dept', rows = readAll_(SHEETS.SNAP), a = snapRead_(String(req.month || ''), rows);
  if (!a) fail_('not_found');
  if (a.intact === false || !a.rec) fail_('snapshot_damaged');
  var out = { ok: true, month: a.month, kind: a.kind, asOf: a.asOf, takenAt: a.takenAt, dim: dim, summary: snapPublicSummary_(a.summary, me), groups: snapGroups_(a, dim, me) };
  if (req.compare) {
    var b = snapRead_(String(req.compare), rows);
    if (!b) fail_('not_found');
    if (b.intact === false || !b.rec) fail_('snapshot_damaged');
    var ia = {}, ib = {}; a.rec.forEach(function (r) { ia[r.i] = r; }); b.rec.forEach(function (r) { ib[r.i] = r; });
    var moved = 0, paid = 0;
    Object.keys(ia).forEach(function (k) { if (ib[k]) { if (ib[k].d !== ia[k].d) moved++; if (ib[k].pk != null && ia[k].pk != null && ib[k].pk !== ia[k].pk) paid++; } });
    out.compare = { month: b.month, kind: b.kind, summary: snapPublicSummary_(b.summary, me), groups: snapGroups_(b, dim, me),
      movement: { stayed: Object.keys(ia).filter(function (k) { return ib[k]; }).length, joined: Object.keys(ia).filter(function (k) { return !ib[k]; }).length,
        left: Object.keys(ib).filter(function (k) { return !ia[k]; }).length, transferred: moved, payChanged: snapCanMoney_(me) ? paid : null } };
  }
  return out;
}
/** The people behind a number, as they were that month. Names only for the hr role (and admin with payroll). */
function api_snapshotPeople(req, me) {
  if (!snapNames_(me)) fail_('forbidden');
  var dim = SNAP_DIMS_[req.dim] ? req.dim : 'dept', rows = readAll_(SHEETS.SNAP), a = snapRead_(String(req.month || ''), rows);
  if (!a || !a.rec) fail_('not_found');
  var list = a.rec, b = req.compare ? snapRead_(String(req.compare), rows) : null, ib = {};
  if (b && b.rec) b.rec.forEach(function (r) { ib[r.i] = r; });
  if (req.key != null && req.key !== '') list = list.filter(function (r) { return snapGroupKey_(r, dim) === String(req.key); });
  if (req.change && b && b.rec) {
    var ia = {}; a.rec.forEach(function (r) { ia[r.i] = r; });
    if (req.change === 'joined') list = list.filter(function (r) { return !ib[r.i]; });
    else if (req.change === 'transferred') list = list.filter(function (r) { return ib[r.i] && ib[r.i].d !== r.d; });
    else if (req.change === 'left') list = b.rec.filter(function (r) { return !ia[r.i]; }).map(function (r) { r.dd = b.dims.d[r.d] || r.d; return r; });
  }
  var money = canPayroll_(me);
  audit_(me.id, 'snapshot_people', '', { month: a.month, dim: dim, key: req.key || '', change: req.change || '', rows: list.length, pay: money });
  return { ok: true, month: a.month, rows: list.slice(0, 500).map(function (r) {
    return { empNo: r.n, name: r.nm, department: r.dd || a.dims.d[r.d] || r.d || '-', position: a.dims.p[r.p] || '', saudi: !!r.s, gender: r.g, tenure: r.t, contract: r.c,
      present: r.pr, absent: r.ab, lateDays: r.lt, leave: r.lv, from: ib[r.i] ? (b.dims.d[ib[r.i].d] || ib[r.i].d || '') : '',
      package: money ? r.pk : undefined };
  }) };
}
/** HR: take the current month now (provisional) or rebuild a past month that has no snapshot. */
function api_snapshotTake(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var t = today_(), month = /^\d{4}-\d{2}$/.test(req.month || '') ? req.month : t.slice(0, 7);
  if (month > t.slice(0, 7)) fail_('bad_range');
  if (month < addDays_(t.slice(0, 8) + '01', -730).slice(0, 7)) fail_('range_too_long');
  if (!rateLimit_('snaptake:' + me.id, 10, 3600)) fail_('too_many_attempts');
  return withLock_(function () {
    var cur = month === t.slice(0, 7), exists = readAll_(SHEETS.SNAP).some(function (x) { return x.month === month && x.status === 'current' && x.kind !== 'provisional'; });
    if (exists && !cur) fail_('already_submitted');
    var snap = snapBuild_(month, cur ? 'provisional' : 'rebuilt'), saved = snapSave_(snap, me.id);
    audit_(me.id, 'snapshot_take', '', { month: month, kind: snap.kind, people: snap.rec.length });
    return { ok: true, month: month, kind: snap.kind, people: snap.rec.length, hash: saved.hash };
  });
}
