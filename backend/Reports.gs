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
  leave_balances:   { group: 'leave',      access: 'people', params: ['asOf', 'depts', 'emps', 'nationality'] },
  leave_taken:      { group: 'leave',      access: 'people', params: ['range', 'depts', 'emps', 'leaveType'] },
  requests_log:     { group: 'leave',      access: 'people', params: ['range', 'depts', 'emps', 'reqType', 'reqStatus'] },
  hr_headcount:     { group: 'people',     access: 'people', params: ['depts', 'nationality', 'status'] },
  hr_movement:      { group: 'people',     access: 'people', params: ['range365', 'depts'] },
  hr_expiry:        { group: 'people',     access: 'people', params: ['days', 'depts'] },
  hr_saudization:   { group: 'people',     access: 'cost',   params: ['depts'] },
  pay_register:     { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_variance:     { group: 'payroll',    access: 'money',  params: ['run', 'threshold', 'depts'] },
  pay_gosi:         { group: 'payroll',    access: 'money',  params: ['run', 'depts'] },
  pay_cost:         { group: 'payroll',    access: 'cost',   params: ['run'] },
  pay_eos:          { group: 'payroll',    access: 'money',  params: ['asOf', 'depts'] },
  perf_results:     { group: 'performance', access: 'people', params: ['cycle', 'depts'] },
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
  var runs = canPayroll_(me) || hasRole_(me, 'executive') ? readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }).map(function (r) { return { id: r.id, ref: r.ref, month: r.month, status: r.status }; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; }) : [];
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
  if (def.access === 'money') audit_(me.id, 'salary_view', '', { report: req.reportId, rows: res.rows.length });
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

  hr_saudization: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(today_()), by = {};
    emps.forEach(function (e) {
      var d = deptName_(e, ctx) || '-', g = by[d] = by[d] || { department: d, headcount: 0, saudis: 0, weighted: 0, half: 0, zero: 0 };
      g.headcount++;
      if (bool_(e.isSaudi)) { g.saudis++; var w = nitaqatWeight_(comps[e.id]); g.weighted += w; if (w === 0.5) g.half++; if (w === 0) g.zero++; }
    });
    var rows = Object.keys(by).map(function (k) { var g = by[k]; g.pct = pct_(g.weighted, g.headcount); return g; });
    return { columns: [col_('department'), col_('headcount', 'int', { sum: true }), col_('saudis', 'int', { sum: true }), col_('weighted', 'num', { sum: true }),
      col_('half', 'int', { sum: true }), col_('zero', 'int', { sum: true }), col_('pct', 'pct')], rows: rows, chart: { type: 'hbar', label: 'department', value: 'pct', max: 100 },
      totalsNote: 'saudization' };
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
    var prev = readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'locked' && r.month < run.month; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; })[0];
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

  pay_cost: function (p, me, ctx, scope, s) {
    var run = findBy_(SHEETS.RUN, 'id', p.run) || currentRun_();
    if (!run) return { columns: [], rows: [], checks: [{ level: 'info', code: 'no_run', count: 0 }] };
    p.run = run.id;
    var by = {};
    readAll_(SHEETS.SLIP).forEach(function (sl) {
      if (sl.runId !== run.id || sl.status === 'void') return;
      var e = ctx.emps[sl.empId] || {}, d = ctx.depts[e.departmentId], k = d ? d.id : '-';
      var g = by[k] = by[k] || { department: d ? d.nameAr : '-', costCenter: d ? String(d.costCenter || '') : '', headcount: 0, gross: 0, gosiEmployer: 0, cost: 0, net: 0 };
      g.headcount++; g.gross = r2_(g.gross + Number(sl.gross)); g.gosiEmployer = r2_(g.gosiEmployer + Number(sl.gosiEmployer)); g.net = r2_(g.net + Number(sl.net)); g.cost = r2_(g.gross + g.gosiEmployer);
    });
    var rows = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.cost - a.cost; });
    return { columns: [col_('department'), col_('costCenter', 'id'), col_('headcount', 'int', { sum: true }), col_('gross', 'money', { sum: true }), col_('gosiEmployer', 'money', { sum: true }),
      col_('cost', 'money', { sum: true }), col_('net', 'money', { sum: true })], rows: rows, run: publicRun_(run), chart: { type: 'hbar', label: 'department', value: 'cost' } };
  },

  pay_eos: function (p, me, ctx, scope, s) {
    var emps = reportEmps_(p, ctx, scope), comps = currentCompMap_(p.asOf), reqs = readAll_(SHEETS.REQ), rows = [], noHire = 0, noPkg = 0;
    emps.forEach(function (e) {
      var hire = String(e.hireDate || '').slice(0, 10), c = comps[e.id];
      if (!hire) { noHire++; return; } if (!c) { noPkg++; return; }
      var mine = reqs.filter(function (r) { return r.empId === e.id; }), svc = eosService_(e, hire, p.asOf, mine);
      var w = s.eosWageBasis === 'basic_housing' ? c.basic + c.housing : c.total, full = eosAward_(svc.years, w, 'termination'), res = eosAward_(svc.years, w, 'resignation');
      var bal = annualBalance_(e, p.asOf, mine, null), lp = Math.max(0, bal.balance) * c.total / 30;
      rows.push(Object.assign(base_(e, ctx), { hireDate: hire, years: r2_(svc.years), excludedDays: svc.excluded, wage: r2_(w), awardFull: r2_(full.award), awardResignation: r2_(res.award),
        leaveDays: r2_(Math.max(0, bal.balance)), leavePay: r2_(lp), liability: r2_(full.award + lp) }));
    });
    return { columns: EMP_COLS.concat([col_('hireDate', 'date'), col_('years', 'num'), col_('excludedDays', 'int'), col_('wage', 'money', { sum: true }), col_('awardFull', 'money', { sum: true }),
      col_('awardResignation', 'money', { sum: true }), col_('leaveDays', 'days', { sum: true }), col_('leavePay', 'money', { sum: true }), col_('liability', 'money', { sum: true })]), rows: rows,
      checks: [noHire ? { level: 'warn', code: 'missing_hire_date', count: noHire } : null, noPkg ? { level: 'warn', code: 'no_package', count: noPkg } : null].filter(Boolean),
      chart: { type: 'hbar', label: 'name', value: 'liability' } };
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
  return readAll_(SHEETS.RUN).filter(function (r) { return r.status !== 'cancelled'; }).sort(function (a, b) { return a.month < b.month ? 1 : -1; })[0] || null;
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
