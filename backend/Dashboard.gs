/**
 * Management dashboard: one call, every figure computed on the server from the same data the
 * rest of the system uses. Who sees it: HR, admin, payroll and the executive role (CEO / GM).
 * Money (payroll cost, liabilities) only for HR, payroll and executive; never an individual salary.
 */

function canDash_(me) { return isHr_(me) || hasRole_(me, 'executive') || hasRole_(me, 'payroll'); }
function canDashMoney_(me) { return me.role === 'hr' || hasRole_(me, 'payroll') || hasRole_(me, 'executive'); }
function pct_(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
function dashSafe_(fn) { try { return fn(); } catch (e) { console.error('dashboard part: ' + e.message); return { error: 'part_failed' }; } }

function api_dashboard(req, me) {
  if (!canDash_(me)) fail_('forbidden');
  var t = today_(), to = isoDate_(req.to) || t, from = isoDate_(req.from) || (t.slice(0, 8) + '01');
  if (to > t) to = t;
  if (from > to) fail_('bad_range');
  if (daysBetween_(from, to) > 92) fail_('range_too_long');
  var len = daysBetween_(from, to), pTo = addDays_(from, -1), pFrom = addDays_(pTo, -len);
  var ctx = orgCtx_(), s = settings_(), money = canDashMoney_(me);
  var emps = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; });
  var punches = readAll_(SHEETS.PUNCH), reqs = readAll_(SHEETS.REQ);
  var out = { ok: true, from: from, to: to, prevFrom: pFrom, prevTo: pTo, money: money, generatedAt: new Date().toISOString() };
  out.attendance = dashSafe_(function () { return dashAttendance_(emps, ctx, punches, from, to, s, true); });
  out.attendancePrev = dashSafe_(function () { return dashAttendance_(emps, ctx, punches, pFrom, pTo, s, false).totals; });
  out.workforce = dashSafe_(function () { return dashWorkforce_(emps, ctx, t); });
  out.leave = dashSafe_(function () { return dashLeave_(emps, ctx, reqs, from, to, s, t); });
  out.requests = dashSafe_(function () { return dashRequests_(reqs, ctx, t); });
  out.performance = dashSafe_(function () { return dashPerformance_(ctx); });
  if (money) out.cost = dashSafe_(function () { return dashCost_(emps, ctx, reqs, t, s); });
  // Workforce analytics only when asked (the dashboard section asks; the home screen calls this action too and must stay fast).
  var wantA = req.analytics === true || req.analytics === 1 || req.analytics === '1' || req.analytics === 'true', names = wantA && waNames_(me);
  if (wantA) out.analytics = dashSafe_(function () { return dashAnalytics_(ctx, punches, reqs, s, t, names); });
  audit_(me.id, 'dashboard_view', '', names ? { from: from, to: to, money: money, people: true } : { from: from, to: to, money: money });
  return out;
}

// ---------------- attendance ----------------

function dashAttendance_(emps, ctx, punches, from, to, s, detail) {
  var byEmpDay = {}, review = 0, rejected = 0;
  punches.forEach(function (p) {
    var d = String(p.date);
    if (d < from || d > to) return;
    if (p.status === 'review') review++;
    if (p.status === 'rejected') rejected++;
    if (!isCounted_(p)) return;
    var k = p.empId + '|' + d; (byEmpDay[k] = byEmpDay[k] || []).push(p);
  });
  var off = offIndex_(from, to), now = new Date();
  var T = { expected: 0, present: 0, late: 0, absent: 0, leave: 0, lateMin: 0, overtimeMin: 0, missingOut: 0, review: review, rejected: rejected };
  var daily = {}, dow = [0, 0, 0, 0, 0, 0, 0].map(function () { return { late: 0, absent: 0, expected: 0 }; }), hist = {}, dept = {}, per = {};
  emps.forEach(function (e) {
    var joined = maxDate_(joinedDate_(e), String(e.hireDate || '').slice(0, 10) || '0000');
    var dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    var g = dept[dn] = dept[dn] || { department: dn, headcount: 0, expected: 0, present: 0, late: 0, absent: 0, lateMin: 0 };
    g.headcount++;
    var me = per[e.id] = { emp: { id: e.id, empNo: String(e.empNo), name: e.name, department: dn }, lateDays: 0, lateMin: 0, absent: 0, present: 0 };
    for (var d = maxDate_(from, joined), i = 0; d <= to && i < 100; d = addDays_(d, 1), i++) {
      var ps = (byEmpDay[e.id + '|' + d] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var sum = summarizeDay_(e, d, ps, s, now, off(e.id, d));
      if (!sum.workday) { if (sum.firstIn) T.overtimeMin += sum.overtimeMin || 0; continue; } // rest days and holidays: only overtime counts
      if (sum.status === 'leave') { T.leave++; continue; }                                        // a working day on approved leave is not expected
      if (sum.status === 'upcoming') continue;
      var day = daily[d] = daily[d] || { date: d, expected: 0, present: 0, late: 0 }, w = dow[new Date(d + 'T00:00:00Z').getUTCDay()];
      T.expected++; g.expected++; day.expected++; w.expected++;
      if (sum.firstIn) {
        T.present++; g.present++; day.present++; me.present++;
        T.overtimeMin += sum.overtimeMin || 0;
        if (sum.status === 'missing_out') T.missingOut++;
        var m = localParts_(new Date(sum.firstIn)).minutes, b = Math.max(5 * 60, Math.min(11 * 60, Math.floor(m / 15) * 15));
        hist[b] = (hist[b] || 0) + 1;
        if (sum.lateMin) { T.late++; T.lateMin += sum.lateMin; g.late++; g.lateMin += sum.lateMin; day.late++; w.late++; me.lateDays++; me.lateMin += sum.lateMin; }
      } else if (sum.status === 'absent') { T.absent++; g.absent++; w.absent++; me.absent++; }
    }
  });
  T.attendanceRate = pct_(T.present, T.expected);
  T.punctuality = pct_(T.present - T.late, T.present);
  T.avgLate = T.late ? Math.round(T.lateMin / T.late) : 0;
  T.overtimeHours = Math.round(T.overtimeMin / 6) / 10;
  if (!detail) return { totals: T };
  var list = Object.keys(per).map(function (k) { return per[k]; });
  return {
    totals: T,
    daily: Object.keys(daily).sort().map(function (k) { var x = daily[k]; x.rate = pct_(x.present, x.expected); x.punctual = pct_(x.present - x.late, x.present); return x; }),
    weekday: dow.map(function (x, i) { return { dow: i, late: x.late, absent: x.absent, expected: x.expected, lateRate: pct_(x.late, x.expected) }; }).filter(function (x) { return x.expected; }),
    checkin: Object.keys(hist).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return { minute: k, count: hist[k] }; }),
    shiftStart: s.shiftStart, grace: Number(s.graceMin),
    departments: Object.keys(dept).map(function (k) { var g = dept[k]; g.rate = pct_(g.present, g.expected); g.punctuality = pct_(g.present - g.late, g.present); return g; })
      .sort(function (a, b) { return (b.rate || 0) - (a.rate || 0); }),
    topLate: list.filter(function (x) { return x.lateDays; }).sort(function (a, b) { return b.lateMin - a.lateMin; }).slice(0, 8),
    topAbsent: list.filter(function (x) { return x.absent; }).sort(function (a, b) { return b.absent - a.absent; }).slice(0, 8)
  };
}

// ---------------- workforce ----------------

function dashWorkforce_(emps, ctx, t) {
  var dept = {}, tenure = { '<1': 0, '1-3': 0, '3-5': 0, '5-10': 0, '10+': 0 }, nat = {}, gender = { male: 0, female: 0, unknown: 0 };
  var comps = currentCompMap_(t), saudis = 0, weighted = 0;
  emps.forEach(function (e) {
    var dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    var g = dept[dn] = dept[dn] || { department: dn, saudi: 0, nonSaudi: 0 };
    if (bool_(e.isSaudi)) { g.saudi++; saudis++; weighted += nitaqatWeight_(comps[e.id]); } else g.nonSaudi++;
    var y = e.hireDate ? daysBetween_(String(e.hireDate).slice(0, 10), t) / 365.25 : null;
    if (y != null) tenure[y < 1 ? '<1' : y < 3 ? '1-3' : y < 5 ? '3-5' : y < 10 ? '5-10' : '10+']++;
    var n = String(e.nationality || '').toUpperCase() || '-'; nat[n] = (nat[n] || 0) + 1;
    gender[e.gender === 'male' || e.gender === 'female' ? e.gender : 'unknown']++;
  });
  // joiners and leavers, last 12 months
  var months = [], m0 = t.slice(0, 7);
  for (var i = 11; i >= 0; i--) { var d = new Date(m0 + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i); months.push({ month: d.toISOString().slice(0, 7), joiners: 0, leavers: 0 }); }
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k], h = String(e.hireDate || '').slice(0, 7), l = String(e.lastWorkingDay || '').slice(0, 7);
    months.forEach(function (m) { if (h === m.month) m.joiners++; if (l === m.month) m.leavers++; });
  });
  var exp = dashSafe_(function () { return api_hrExpiring({ days: 60 }, null).rows; });
  var soon = Array.isArray(exp) ? exp : [];
  return { headcount: emps.length, saudis: saudis, saudiPct: pct_(weighted, emps.length), saudiHeadPct: pct_(saudis, emps.length),
    target: Number(settings_().saudizationTarget) || null,
    departments: Object.keys(dept).map(function (k) { return dept[k]; }).sort(function (a, b) { return (b.saudi + b.nonSaudi) - (a.saudi + a.nonSaudi); }),
    tenure: tenure, gender: gender, nationalities: Object.keys(nat).map(function (k) { return { code: k, count: nat[k] }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 6),
    movement: months, expiringSoon: soon.filter(function (x) { return x.daysLeft >= 0; }).length, expired: soon.filter(function (x) { return x.daysLeft < 0; }).length };
}

// ---------------- leave and requests ----------------

function dashLeave_(emps, ctx, reqs, from, to, s, t) {
  var types = {}, onLeaveToday = 0, hol = holidayMap_(), ids = {};
  emps.forEach(function (e) { ids[e.id] = e; });
  reqs.forEach(function (r) {
    if (r.type !== 'leave' || r.status !== 'approved' || !ids[r.empId]) return;
    var a = maxDate_(String(r.fromDate).slice(0, 10), from), b = minDate_(String(r.toDate).slice(0, 10), to);
    if (a <= b) types[r.subtype] = (types[r.subtype] || 0) + countLeaveDays_(ids[r.empId], r.subtype, a, b, hol, s).days;
    if (String(r.fromDate) <= t && String(r.toDate) >= t) onLeaveToday++;
  });
  return { byType: Object.keys(types).map(function (k) { return { type: k, days: types[k] }; }).sort(function (a, b) { return b.days - a.days; }), onLeaveToday: onLeaveToday };
}

function dashRequests_(reqs, ctx, t) {
  var pending = { manager: 0, hr: 0, payroll: 0 }, speed = {}, since = addDays_(t, -90), open = [];
  reqs.forEach(function (r) {
    if (r.status === 'pending') {
      pending[r.step] = (pending[r.step] || 0) + 1;
      open.push(daysBetween_(String(r.createdAt).slice(0, 10), t));
    }
    if ((r.status === 'approved' || r.status === 'rejected') && r.decidedAt && String(r.createdAt).slice(0, 10) >= since) {
      var h = (Date.parse(r.decidedAt) - Date.parse(r.createdAt)) / 3600000, g = speed[r.type] = speed[r.type] || { type: r.type, n: 0, hours: 0, approved: 0 };
      g.n++; g.hours += h; if (r.status === 'approved') g.approved++;
    }
  });
  return { pending: pending, oldestOpenDays: open.length ? Math.max.apply(null, open) : 0, openOver3Days: open.filter(function (d) { return d > 3; }).length,
    speed: Object.keys(speed).map(function (k) { var g = speed[k]; return { type: g.type, n: g.n, avgHours: Math.round(g.hours / g.n * 10) / 10, approvalRate: pct_(g.approved, g.n) }; }) };
}

// ---------------- performance ----------------

function dashPerformance_(ctx) {
  var cyc = currentCycle_();
  if (!cyc) return { cycle: null };
  var dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, dept = {}, done = 0, people = 0;
  readAll_(SHEETS.REV).forEach(function (r) {
    if (r.cycleId !== cyc.id) return;
    var e = ctx.emps[r.empId]; if (!e) return;
    var rating = r.finalRating !== '' ? Number(r.finalRating) : r.overall !== '' ? Math.round(Number(r.overall)) : null;
    if (rating) { dist[rating]++; done++; }
    var dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-'), g = dept[dn] = dept[dn] || { department: dn, n: 0, sum: 0 };
    if (r.overall !== '') { g.n++; g.sum += Number(r.overall); }
  });
  Object.keys(ctx.emps).forEach(function (k) { if (ctx.emps[k].status === 'active') people++; });
  return { cycle: publicCycle_(cyc), distribution: dist, rated: done, people: people,
    departments: Object.keys(dept).map(function (k) { var g = dept[k]; return { department: g.department, n: g.n, average: g.n ? Math.round(g.sum / g.n * 100) / 100 : null }; }).filter(function (g) { return g.n; }) };
}

// ---------------- cost and liabilities (money roles only) ----------------

function dashCost_(emps, ctx, reqs, t, s) {
  var runs = readAll_(SHEETS.RUN).filter(function (r) { return r.status === 'locked'; }).sort(function (a, b) { return a.month < b.month ? -1 : 1; }).slice(-12);
  var slips = readAll_(SHEETS.SLIP), byRun = {};
  slips.forEach(function (sl) { if (sl.status === 'locked') (byRun[sl.runId] = byRun[sl.runId] || []).push(sl); });
  var trend = runs.map(function (r) {
    var ls = byRun[r.id] || [], ot = 0;
    ls.forEach(function (sl) { lines_(sl).forEach(function (l) { if (l.code === 'overtime') ot += l.amount; }); });
    var tt = totals_(ls);
    return { month: r.month, gross: tt.gross, net: tt.net, gosiEmployer: tt.gosiEmployer, overtime: r2_(ot), headcount: tt.headcount, cost: r2_(tt.gross + tt.gosiEmployer) };
  });
  var last = runs[runs.length - 1], byDept = {};
  if (last) (byRun[last.id] || []).forEach(function (sl) {
    var e = ctx.emps[sl.empId] || {}, dn = ctx.depts[e.departmentId] ? ctx.depts[e.departmentId].nameAr : (e.department || '-');
    var g = byDept[dn] = byDept[dn] || { department: dn, cost: 0, headcount: 0 };
    g.cost = r2_(g.cost + Number(sl.gross) + Number(sl.gosiEmployer)); g.headcount++;
  });
  // liabilities today: unused annual leave and end of service as if everyone left today on full award (Art. 84)
  var comps = currentCompMap_(t), leaveLiab = 0, eosLiab = 0, monthly = 0, noPackage = 0;
  emps.forEach(function (e) {
    var c = comps[e.id];
    if (!c) { noPackage++; return; }
    monthly += c.total;
    var bal = annualBalance_(e, t, reqs.filter(function (r) { return r.empId === e.id; }), null);
    leaveLiab += Math.max(0, bal.balance) * c.total / 30;
    if (e.hireDate) { // as if everyone left today on the full award (Art. 84), service net of Art. 116 exclusions
      var svc = eosService_(e, String(e.hireDate).slice(0, 10), t, reqs), w = s.eosWageBasis === 'basic_housing' ? c.basic + c.housing : c.total;
      eosLiab += eosAward_(svc.years, w, 'termination').award;
    }
  });
  var advDone = {};
  slips.forEach(function (sl) { if (sl.status === 'locked') lines_(sl).forEach(function (l) { if (l.code === 'advance' && l.ref) advDone[l.ref] = (advDone[l.ref] || 0) + l.amount; }); });
  var advances = 0;
  reqs.forEach(function (r) { if (r.type === 'advance' && r.status === 'approved') advances += Math.max(0, Number(r.amount) - (advDone[r.ref] || 0)); });
  return { trend: trend, lastMonth: last ? last.month : null, byDepartment: Object.keys(byDept).map(function (k) { return byDept[k]; }).sort(function (a, b) { return b.cost - a.cost; }),
    monthlyPackage: r2_(monthly), leaveLiability: r2_(leaveLiab), eosLiability: r2_(eosLiab), advancesOutstanding: r2_(advances), noPackage: noPackage };
}

// ---------------- workforce analytics: turnover, tenure, span of control, cohorts, retention indicators ----------------
/*
 * Everything is worked out from job data only. Each person is first copied into a job view (WA_JOB_FIELDS), so gender,
 * nationality, Saudi status, age and the private file are never in reach of these functions (tests/dashboard.js checks).
 * Individual rows (names) go to the HR role only; every other dashboard role gets counts, and a group of fewer than
 * WA_MIN_GROUP people shows its headcount only. Nothing here is money: the pay signal carries a date, never an amount.
 *
 * Who counts as a leaver: anyone with a lastWorkingDay (set when a resignation is approved, and by the offboarding
 * clearance). Voluntary = resignedOn set, an approved resignation request, or a clearance with reason 'resignation';
 * every other leaver is 'other' (clearance reason when there is one, else 'unrecorded'). A person switched off without
 * a lastWorkingDay cannot be dated: left out of every figure and reported in checks (wa_no_last_day).
 */
var WA_MIN_GROUP = 5;
var WA_SIGNALS = ['new_hire', 'pay_static', 'low_rating', 'attendance_up', 'manager_change'];
var WA_BANDS = ['<1', '1-3', '3-5', '5-10', '10+'];
// The only employee fields analytics may read. Never add gender, nationality, isSaudi or anything from empPrivate.
var WA_JOB_FIELDS = ['id', 'empNo', 'name', 'status', 'department', 'departmentId', 'managerId', 'hireDate', 'lastWorkingDay', 'resignedOn',
  'createdAt', 'shiftStart', 'shiftEnd', 'workdays', 'ramadanReduced', 'outdoor'];

/** Names in analytics: the HR role only (not admin alone, not payroll, not executive). */
function waNames_(me) { return !!me && (me.role === 'hr' || adminPay_(me)); }

/** d plus n calendar months; the day is clamped to the month's last day (31 Jan + 1 = 28/29 Feb). */
function waAddMonths_(d, n) {
  var y = +d.slice(0, 4), m = +d.slice(5, 7) - 1 + n, day = +d.slice(8, 10);
  var ty = y + Math.floor(m / 12), tm = ((m % 12) + 12) % 12, last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ty, tm, Math.min(day, last))).toISOString().slice(0, 10);
}
/** Whole months from a to b. */
function waMonthsBetween_(a, b) {
  var n = (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7));
  if (waAddMonths_(a, n) > b) n--;
  return n;
}
function waMedian_(xs) {
  if (!xs.length) return null;
  var s = xs.slice().sort(function (a, b) { return a - b; }), h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}
function waRound_(n, dp) { if (n == null || !isFinite(n)) return null; var f = Math.pow(10, dp == null ? 1 : dp); return Math.round(n * f) / f; }
function waJob_(e) { var o = {}; WA_JOB_FIELDS.forEach(function (k) { o[k] = e[k] === undefined ? '' : e[k]; }); return o; }
function waCard_(p) { return { id: p.id, empNo: String(p.job.empNo), name: p.job.name, department: p.dept }; }
function waBand_(y) { return y < 1 ? '<1' : y < 3 ? '1-3' : y < 5 ? '3-5' : y < 10 ? '5-10' : '10+'; }

/** One record per employee: dates, leaver type and the job view. */
function waPeople_(ctx, reqs, clr) {
  var resigned = {}, pendingRes = {}, why = {};
  reqs.forEach(function (r) {
    if (r.type !== 'resignation') return;
    if (r.status === 'approved') resigned[r.empId] = 1; else if (r.status === 'pending') pendingRes[r.empId] = 1;
  });
  clr.forEach(function (x) { if (x.status !== 'cancelled' && x.empId) why[x.empId] = String(x.reason || 'other'); });
  return Object.keys(ctx.emps).map(function (k) {
    var job = waJob_(ctx.emps[k]), hire = isoDate_(job.hireDate), end = isoDate_(job.lastWorkingDay);
    var vol = !!(isoDate_(job.resignedOn) || resigned[job.id] || why[job.id] === 'resignation');
    var dept = ctx.depts[job.departmentId] ? ctx.depts[job.departmentId].nameAr : (job.department || '-');
    return { id: job.id, job: job, dept: dept, hire: hire, start: hire || joinedDate_(job), end: end, active: job.status === 'active',
      unknownEnd: !end && job.status !== 'active', voluntary: vol, reason: vol ? 'resignation' : (why[job.id] || 'unrecorded'),
      leaving: !!(end || vol || pendingRes[job.id]), managerId: String(job.managerId || '') };
  });
}
function waCounts_(p) { return !p.unknownEnd && !(p.end && p.end < p.start); }
/** Employed on day d (the last working day itself counts). */
function waOn_(p, d) { return waCounts_(p) && p.start <= d && (!p.end || p.end >= d); }
function waCurrent_(people, t) { return people.filter(function (p) { return p.active && waOn_(p, t); }); }

function dashAnalytics_(ctx, punches, reqs, s, t, full) {
  var people = waPeople_(ctx, reqs, readAll_(SHEETS.CLR));
  return { asOf: t, names: !!full, minGroup: WA_MIN_GROUP,
    turnover: dashSafe_(function () { return waTurnover_(people, t); }),
    tenure: dashSafe_(function () { return waTenure_(people, t, full); }),
    span: dashSafe_(function () { return waSpan_(people, t, full); }),
    cohorts: dashSafe_(function () { return waCohorts_(people, t, full); }),
    flightRisk: dashSafe_(function () { return waFlight_(people, punches, s, t, full); }),
    checks: dashSafe_(function () { return waChecks_(people, t); }) };
}

/**
 * The 12 calendar months ending with this one (to today, like the joiners/leavers chart). Each month: headcount on its
 * first and last day (today for this month), leavers whose last working day falls in it, rate = leavers / average of the two.
 * Rolling rate = all leavers / the mean of the 12 monthly averages. First year = left before 12 months of service.
 */
function waTurnover_(people, t) {
  var months = [], m0 = t.slice(0, 7) + '-01';
  for (var i = 11; i >= 0; i--) {
    var m = waAddMonths_(m0, -i).slice(0, 7), a = m + '-01', b = minDate_(monthLast_(m), t);
    var row = { month: m, startHc: 0, endHc: 0, leavers: 0, voluntary: 0, other: 0 };
    people.forEach(function (p) {
      if (!waCounts_(p)) return;
      if (waOn_(p, a)) row.startHc++;
      if (waOn_(p, b)) row.endHc++;
      if (p.end && p.end >= a && p.end <= b) { row.leavers++; if (p.voluntary) row.voluntary++; else row.other++; }
    });
    row.avgHc = (row.startHc + row.endHc) / 2;
    row.rate = pct_(row.leavers, row.avgHc);
    months.push(row);
  }
  var from = months[0].month + '-01', L = 0, V = 0, O = 0, sum = 0, first = 0, reasons = {};
  months.forEach(function (r) { L += r.leavers; V += r.voluntary; O += r.other; sum += r.avgHc; });
  var avg = sum / months.length;
  people.forEach(function (p) {
    if (!waCounts_(p) || !p.end || p.end < from || p.end > t) return;
    if (!p.voluntary) reasons[p.reason] = (reasons[p.reason] || 0) + 1;
    if (p.hire && p.end < waAddMonths_(p.hire, 12)) first++;
  });
  return { from: from, to: t, months: months, leavers: L, voluntary: V, other: O, avgHeadcount: waRound_(avg, 2),
    headcountNow: people.filter(function (p) { return waOn_(p, t); }).length,
    rate: pct_(L, avg), voluntaryRate: pct_(V, avg), otherRate: pct_(O, avg), otherReasons: reasons,
    firstYear: { leavers: first, share: pct_(first, L) } };
}

/** Years of service of the people employed today, overall and per department (small departments: headcount only). */
function waTenure_(people, t, full) {
  var cur = waCurrent_(people, t), by = {};
  function sum(list) {
    var ys = [], bands = {};
    WA_BANDS.forEach(function (k) { bands[k] = 0; });
    list.forEach(function (p) { if (!p.hire || p.hire > t) return; var y = daysBetween_(p.hire, t) / 365.25; ys.push(y); bands[waBand_(y)]++; });
    return { headcount: list.length, known: ys.length, avgYears: ys.length ? waRound_(ys.reduce(function (a, b) { return a + b; }, 0) / ys.length, 2) : null,
      medianYears: waRound_(waMedian_(ys), 2), bands: bands };
  }
  cur.forEach(function (p) { (by[p.dept] = by[p.dept] || []).push(p); });
  var all = sum(cur);
  all.departments = Object.keys(by).map(function (d) {
    if (!full && by[d].length < WA_MIN_GROUP) return { department: d, headcount: by[d].length, suppressed: true };
    var x = sum(by[d]); x.department = d; return x;
  }).sort(function (a, b) { return b.headcount - a.headcount; });
  return all;
}

/** Direct reports (managerId) per manager among the people employed today. More than 12 or fewer than 2: information only. */
function waSpan_(people, t, full) {
  var cur = waCurrent_(people, t), byId = {}, reports = {}, orphans = 0;
  cur.forEach(function (p) { byId[p.id] = p; });
  cur.forEach(function (p) {
    if (!p.managerId || p.managerId === p.id) return;
    if (!byId[p.managerId]) { orphans++; return; } // the manager left, is switched off, or is unknown
    reports[p.managerId] = (reports[p.managerId] || 0) + 1;
  });
  var ids = Object.keys(reports), ns = ids.map(function (k) { return reports[k]; });
  var buckets = [['1', 1, 1], ['2-4', 2, 4], ['5-8', 5, 8], ['9-12', 9, 12], ['13+', 13, Infinity]];
  var out = { managers: ids.length, reports: ns.reduce(function (a, b) { return a + b; }, 0),
    avg: ns.length ? waRound_(ns.reduce(function (a, b) { return a + b; }, 0) / ns.length, 1) : null, median: waMedian_(ns),
    min: ns.length ? Math.min.apply(null, ns) : null, max: ns.length ? Math.max.apply(null, ns) : null,
    distribution: buckets.map(function (b) { return { label: b[0], managers: ns.filter(function (n) { return n >= b[1] && n <= b[2]; }).length }; }),
    wide: ns.filter(function (n) { return n > 12; }).length, narrow: ns.filter(function (n) { return n < 2; }).length, orphans: orphans };
  if (full) out.flags = ids.filter(function (k) { return reports[k] > 12 || reports[k] < 2; })
    .map(function (k) { return { emp: waCard_(byId[k]), reports: reports[k], flag: reports[k] > 12 ? 'wide' : 'narrow' }; })
    .sort(function (a, b) { return b.reports - a.reports; });
  return out;
}

/** For each hire-year cohort (latest 6): the share still employed 3, 6 and 12 months after the hire date, among those that far along. */
function waCohorts_(people, t, full) {
  var by = {};
  people.forEach(function (p) { if (!waCounts_(p) || !p.hire || p.hire > t) return; var y = p.hire.slice(0, 4); (by[y] = by[y] || []).push(p); });
  return Object.keys(by).sort().reverse().slice(0, 6).map(function (y) {
    var list = by[y], row = { year: y, hires: list.length };
    if (!full && list.length < WA_MIN_GROUP) { row.suppressed = true; return row; }
    [3, 6, 12].forEach(function (k) {
      var due = 0, kept = 0;
      list.forEach(function (p) { var at = waAddMonths_(p.hire, k); if (at > t) return; due++; if (!p.end || p.end >= at) kept++; });
      row['m' + k] = { eligible: due, retained: kept, pct: pct_(kept, due) };
    });
    return row;
  });
}

/** Date of the latest approved pay change in force by t (a package equal to the one before is not a change). Dates only. */
function waPayChange_(t) {
  var by = {}, out = {};
  readAll_(SHEETS.COMP).forEach(function (c) {
    var d = isoDate_(c.effectiveFrom);
    if (c.status !== 'approved' || !d || d > t) return;
    (by[c.empId] = by[c.empId] || []).push({ d: d, at: String(c.approvedAt || ''), total: compView_(c).total });
  });
  Object.keys(by).forEach(function (k) {
    var rows = by[k].sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.at < b.at ? -1 : 1; }), last = rows[0].d;
    for (var i = 1; i < rows.length; i++) if (rows[i].total !== rows[i - 1].total) last = rows[i].d;
    out[k] = last;
  });
  return out;
}
/** Final rating from the latest closed review cycle (the rating the employee has seen). */
function waLastRating_() {
  var cyc = {}, out = {};
  readAll_(SHEETS.CYC).forEach(function (c) { if (c.status === 'closed') cyc[c.id] = c; });
  readAll_(SHEETS.REV).forEach(function (r) {
    var c = cyc[r.cycleId], n = score_(r.finalRating);
    if (!c || n == null) return;
    var key = String(c.year || '') + '|' + String(c.createdAt || ''), cur = out[r.empId];
    if (!cur || key > cur.key) out[r.empId] = { key: key, rating: n, cycleAr: c.nameAr || '', cycleEn: c.nameEn || '' };
  });
  return out;
}
/** Dates a person's manager changed (job history rows in order; the first placement is not a change). */
function waMgrChanges_() {
  var by = {}, out = {};
  readAll_(SHEETS.JOBH).forEach(function (h) { (by[h.empId] = by[h.empId] || []).push(h); });
  Object.keys(by).forEach(function (k) {
    var rows = by[k].sort(function (a, b) { var x = String(a.effectiveFrom), y = String(b.effectiveFrom); return x < y ? -1 : x > y ? 1 : String(a.createdAt) < String(b.createdAt) ? -1 : 1; }), ch = [];
    for (var i = 1; i < rows.length; i++) {
      var was = String(rows[i - 1].managerId || ''), now = String(rows[i].managerId || '');
      if (was && was !== now) ch.push(isoDate_(rows[i].effectiveFrom));
    }
    out[k] = ch;
  });
  return out;
}
/**
 * Late days and absences in the last 90 days against the 90 before, per working day expected (leave and holidays excluded,
 * days before the person joined skipped). Rising = at least 3 in the last 90 days and at least double the earlier rate.
 * Needs 20 expected days in each window, so it stays quiet for about six months after go-live.
 */
function waAttTrend_(list, punches, s, t) {
  var p0 = addDays_(t, -179), p1 = addDays_(t, -90), ids = {}, byEmpDay = {}, out = {}, now = new Date();
  list.forEach(function (p) { ids[p.id] = 1; });
  punches.forEach(function (x) {
    var d = String(x.date).slice(0, 10);
    if (!ids[x.empId] || d < p0 || d > t || !isCounted_(x)) return;
    var k = x.empId + '|' + d; (byEmpDay[k] = byEmpDay[k] || []).push(x);
  });
  var off = offIndex_(p0, t);
  list.forEach(function (p) {
    var w = { prior: { expected: 0, late: 0, absent: 0 }, last: { expected: 0, late: 0, absent: 0 } };
    var joined = maxDate_(joinedDate_(p.job), p.hire || '0000');
    for (var d = maxDate_(p0, joined), i = 0; d <= t && i < 190; d = addDays_(d, 1), i++) {
      var ps = (byEmpDay[p.id + '|' + d] || []).sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var sum = summarizeDay_(p.job, d, ps, s, now, off(p.id, d));
      if (!sum.workday || sum.status === 'leave' || sum.status === 'holiday' || sum.status === 'upcoming') continue;
      var b = d <= p1 ? w.prior : w.last;
      b.expected++;
      if (sum.firstIn) { if (sum.lateMin) b.late++; } else if (sum.status === 'absent') b.absent++;
    }
    var ok = w.prior.expected >= 20 && w.last.expected >= 20;
    var up = function (k) { return ok && w.last[k] >= 3 && w.last[k] / w.last.expected >= 2 * w.prior[k] / w.prior.expected; };
    out[p.id] = { evaluable: ok, late: up('late'), absent: up('absent'), last: w.last, prior: w.prior };
  });
  return out;
}

/**
 * Retention conversation indicators for each person employed today who is not already leaving. Score = number of
 * signals that fired (0-5, equal weights), each with its reason; `unknown` lists signals the data could not check.
 * It is a prompt for a conversation, not a prediction. HR gets the people; everyone else counts by department,
 * and groups under WA_MIN_GROUP are pooled or hidden, with totals only over what is shown (no subtraction back).
 */
function waFlight_(people, punches, s, t, full) {
  var cur = waCurrent_(people, t), list = cur.filter(function (p) { return !p.leaving; }), byId = {};
  people.forEach(function (p) { byId[p.id] = p; });
  var pay = waPayChange_(t), rating = waLastRating_(), mgr = waMgrChanges_(), att = waAttTrend_(list, punches, s, t);
  var cut6 = waAddMonths_(t, -6), cut12 = waAddMonths_(t, -12), cut18 = waAddMonths_(t, -18);
  var rows = list.map(function (p) {
    var sig = [], unknown = [];
    if (!p.hire) unknown.push('new_hire');
    else if (p.hire > cut12) sig.push({ code: 'new_hire', since: p.hire, months: waMonthsBetween_(p.hire, t) });
    var pc = pay[p.id];
    if (!pc) unknown.push('pay_static');
    else if (pc <= cut18) sig.push({ code: 'pay_static', since: pc, months: waMonthsBetween_(pc, t) });
    var rt = rating[p.id];
    if (!rt) unknown.push('low_rating');
    else if (rt.rating <= 2) sig.push({ code: 'low_rating', rating: rt.rating, cycleAr: rt.cycleAr, cycleEn: rt.cycleEn });
    var a = att[p.id];
    if (!a || !a.evaluable) unknown.push('attendance_up');
    else if (a.late || a.absent) sig.push({ code: 'attendance_up', late: a.late, absent: a.absent, last: a.last, prior: a.prior });
    var m = byId[p.managerId], left = m && m.end && m.end >= cut6 && m.end <= t ? m.end : '';
    var changed = (mgr[p.id] || []).filter(function (d) { return d && d >= cut6 && d <= t; }).pop() || '';
    if (changed || left) sig.push({ code: 'manager_change', on: changed || left, why: changed ? 'changed' : 'left' });
    else if (!mgr[p.id]) unknown.push('manager_change');
    return { p: p, signals: sig, unknown: unknown };
  });
  var by = {}, groups = [], pool = [], poolGroups = 0, visible = [], hidden = { groups: 0, people: 0 };
  rows.forEach(function (r) { (by[r.p.dept] = by[r.p.dept] || []).push(r); });
  Object.keys(by).forEach(function (d) {
    if (full || by[d].length >= WA_MIN_GROUP) { groups.push(waFlightAgg_(by[d], { department: d })); visible = visible.concat(by[d]); }
    else { pool = pool.concat(by[d]); poolGroups++; }
  });
  if (pool.length >= WA_MIN_GROUP) { groups.push(waFlightAgg_(pool, { department: '', pooled: true, groups: poolGroups })); visible = visible.concat(pool); }
  else if (pool.length) hidden = { groups: poolGroups, people: pool.length };
  groups.sort(function (a, b) { return (a.pooled ? 1 : 0) - (b.pooled ? 1 : 0) || b.headcount - a.headcount; });
  var tot = waFlightAgg_(visible, {});
  var out = { signalsList: WA_SIGNALS, scored: tot.headcount, withSignals: tot.withSignals, twoPlus: tot.twoPlus, bySignal: tot.signals, coverage: tot.coverage,
    leaving: cur.length - list.length, groups: groups, hidden: hidden };
  if (full) out.people = rows.filter(function (r) { return r.signals.length; })
    .sort(function (a, b) { return b.signals.length - a.signals.length || (a.p.dept < b.p.dept ? -1 : a.p.dept > b.p.dept ? 1 : 0) || (String(a.p.job.name) < String(b.p.job.name) ? -1 : 1); })
    .slice(0, 300).map(function (r) { return { emp: waCard_(r.p), score: r.signals.length, signals: r.signals, unknown: r.unknown }; });
  return out;
}
function waFlightAgg_(list, head) {
  var o = Object.assign(head, { headcount: list.length, withSignals: 0, twoPlus: 0, signals: {}, coverage: {} });
  WA_SIGNALS.forEach(function (k) { o.signals[k] = 0; o.coverage[k] = 0; });
  list.forEach(function (r) {
    if (r.signals.length) o.withSignals++;
    if (r.signals.length >= 2) o.twoPlus++;
    r.signals.forEach(function (x) { o.signals[x.code]++; });
    WA_SIGNALS.forEach(function (k) { if (r.unknown.indexOf(k) < 0) o.coverage[k]++; });
  });
  return o;
}

/** Data gaps that change the figures above (counts only). */
function waChecks_(people, t) {
  var cur = waCurrent_(people, t), ids = {}, out = [];
  cur.forEach(function (p) { ids[p.id] = 1; });
  var noLast = people.filter(function (p) { return p.unknownEnd; }).length;
  var badEnd = people.filter(function (p) { return p.end && p.end < p.start; }).length;
  var noHire = cur.filter(function (p) { return !p.hire; }).length;
  var orphans = cur.filter(function (p) { return p.managerId && p.managerId !== p.id && !ids[p.managerId]; }).length;
  if (noLast) out.push({ level: 'warn', code: 'wa_no_last_day', count: noLast });
  if (badEnd) out.push({ level: 'warn', code: 'wa_end_before_start', count: badEnd });
  if (orphans) out.push({ level: 'warn', code: 'wa_orphan_reports', count: orphans });
  if (noHire) out.push({ level: 'info', code: 'wa_no_hire_date', count: noHire });
  return out;
}
