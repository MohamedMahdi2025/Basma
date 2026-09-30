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
  audit_(me.id, 'dashboard_view', '', { from: from, to: to, money: money });
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
    if (e.hireDate) {
      var y = (daysBetween_(String(e.hireDate).slice(0, 10), t) + 1) / 365, w = s.eosWageBasis === 'basic_housing' ? c.basic + c.housing : c.total;
      eosLiab += Math.min(y, 5) * w / 2 + Math.max(0, y - 5) * w;
    }
  });
  var advDone = {};
  slips.forEach(function (sl) { if (sl.status === 'locked') lines_(sl).forEach(function (l) { if (l.code === 'advance' && l.ref) advDone[l.ref] = (advDone[l.ref] || 0) + l.amount; }); });
  var advances = 0;
  reqs.forEach(function (r) { if (r.type === 'advance' && r.status === 'approved') advances += Math.max(0, Number(r.amount) - (advDone[r.ref] || 0)); });
  return { trend: trend, lastMonth: last ? last.month : null, byDepartment: Object.keys(byDept).map(function (k) { return byDept[k]; }).sort(function (a, b) { return b.cost - a.cost; }),
    monthlyPackage: r2_(monthly), leaveLiability: r2_(leaveLiab), eosLiability: r2_(eosLiab), advancesOutstanding: r2_(advances), noPackage: noPackage };
}
