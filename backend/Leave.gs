/**
 * Leave and requests (Phase 2): balances by Saudi Labour Law, one request engine
 * (leave, letters, salary advances, attendance corrections, data changes, resignation)
 * with role-based approval steps, public holidays, and what attendance shows on those days.
 * Plan: docs/superpowers/plans/2026-09-30-hr-phase2-leave-requests.md
 */

// ---------------- leave types (Labour Law, 2025 amendments) ----------------

var LEAVE_TYPES = {
  annual: { balance: true },
  sick: { doc: true },                                          // Art. 117: tiers per sick year
  marriage: { max: 5, once: true },                             // Art. 113
  paternity: { max: 3, gender: 'male', event: 7 },              // within 7 days of the birth (2025)
  bereavement: { max: 5 },                                      // spouse, parent, child
  bereavement_sibling: { max: 3 },                              // 2025
  maternity: { max: 84, gender: 'female', doc: true },          // 12 weeks, Art. 151 (2025)
  hajj: { min: 10, max: 15, once: true, serviceYears: 2 },      // Art. 114
  exam: { max: 30, doc: true },                                 // Art. 115, the exam days
  iddah: { gender: 'female', doc: true, variants: { full: 130, short: 15 } }, // Art. 160; religion is never stored
  unpaid: { max: 180 }                                          // Art. 116, over 20 days suspends the contract
};
var LETTERS = ['salary_certificate', 'employment_certificate', 'experience'];
var REQUEST_STEPS = {
  leave: ['manager', 'hr'], correction: ['manager', 'hr'], resignation: ['manager', 'hr'],
  letter: ['hr'], data_change: ['hr'],
  advance: ['hr', 'payroll'], // salary-related: the line manager is not in the chain
  exit_reentry: ['manager', 'hr'], // exit/re-entry visa for a non-Saudi (GovServices.gs): HR then records the visa issued in Muqeem
  permission: ['manager', 'hr'], // hourly permission (استئذان): hours out of the working day, capped per request and per month
  travel: ['manager', 'hr'], // business trip with per diem: on final approval the per diem goes to payroll (non-wage)
  remote: ['manager', 'hr'], // remote work days (2026-10-23): never absent; a check-in that day is accepted from anywhere
  overtime: ['manager', 'hr'] // overtime pre-approval: on final approval an overtime_hours adjustment goes to payroll (Art. 107)
};
var DATA_FIELDS = { phone: 'emp', personalEmail: 'priv', nationalAddress: 'priv', address: 'priv', maritalStatus: 'priv',
  emergencyName: 'priv', emergencyPhone: 'priv', iban: 'priv', bankName: 'priv', passportNo: 'priv', passportExpiry: 'priv', idExpiry: 'priv' };
var SICK_TIERS = [30, 90, 120]; // cumulative days in a sick year: full pay, then 75%, then unpaid

// ---------------- dates and holidays ----------------

function holidayMap_() {
  var m = {};
  readAll_(SHEETS.HOL).forEach(function (h) {
    if (h.status === 'deleted') return;
    var d = String(h.date).slice(0, 10), e = String(h.toDate || h.date).slice(0, 10);
    for (var i = 0; d <= e && i < 40; i++) { m[d] = h.nameAr; d = addDays_(d, 1); }
  });
  return m;
}
function dow_(d) { return new Date(d + 'T00:00:00Z').getUTCDay(); }
function addYears_(d, n) {
  var y = Number(String(d).slice(0, 4)) + n, rest = String(d).slice(4, 10);
  return isoDate_(y + rest) || (y + rest.slice(0, 4) + '28'); // 29 February
}
function maxDate_(a, b) { return a > b ? a : b; }
function minDate_(a, b) { return a < b ? a : b; }

/** Days a leave consumes: annual skips public holidays (and rest days in 'working' mode); the rest are calendar days. */
function countLeaveDays_(emp, subtype, from, to, hol, s) {
  var sh = shiftOf_(emp, s), n = 0, cal = 0, holidays = [];
  for (var d = from, i = 0; d <= to && i < 400; d = addDays_(d, 1), i++) {
    cal++;
    if (subtype === 'annual') {
      if (hol[d]) { holidays.push(d); continue; }
      if (s.leaveCountMode !== 'calendar' && sh.workdays.indexOf(dow_(d)) < 0) continue;
    }
    n++;
  }
  return { days: n, calendarDays: cal, holidays: holidays };
}

// ---------------- balances ----------------

function annualRates_(emp) {
  var c = Number(emp.annualLeaveDays) || 0;
  return { before5: Math.max(21, c), after5: Math.max(30, c) };
}
/** Days of annual leave earned from `from` to `to` inclusive: 21 a year, 30 after 5 years (or the contract's days). */
function accrueBetween_(emp, from, to) {
  if (!from || !to || to < from) return 0;
  var rt = annualRates_(emp), five = emp.hireDate ? addYears_(String(emp.hireDate).slice(0, 10), 5) : null;
  var n = daysBetween_(from, to) + 1;
  if (!five || five > to) return n * rt.before5 / 365;
  if (five <= from) return n * rt.after5 / 365;
  var a = daysBetween_(from, five);
  return a * rt.before5 / 365 + (n - a) * rt.after5 / 365;
}
function round2_(n) { return Math.round(n * 100) / 100; }

/**
 * The annual balance on `asOf`. With an opening balance (carried over from the old system on
 * leaveOpeningDate) accrual starts the next day and only leave taken after it counts. Without one,
 * accrual starts the day the person joined this system (or the hire date if later): leave taken
 * before that is unknown here, so counting from the hire date would hand out years of "unused" leave.
 * Approved unpaid leave pauses accrual (Art. 116).
 */
function annualBalance_(emp, asOf, reqs, excludeId) {
  var hasOpening = emp.leaveOpeningDate !== '' && emp.leaveOpeningDate != null;
  var hire = String(emp.hireDate || '').slice(0, 10), joined = joinedDate_(emp);
  var start = hasOpening ? addDays_(String(emp.leaveOpeningDate).slice(0, 10), 1) : maxDate_(hire || joined, joined);
  var opening = hasOpening ? Number(emp.leaveOpeningDays) || 0 : 0;
  var accrued = accrueBetween_(emp, start, asOf), used = 0, pending = 0;
  reqs.forEach(function (r) {
    if (r.empId !== emp.id || r.type !== 'leave' || r.id === excludeId) return;
    if (r.subtype === 'unpaid' && r.status === 'approved') {
      // Art. 116: the contract is suspended only for the days beyond the 20th of an unpaid leave, so only those pause accrual
      var a = maxDate_(maxDate_(String(r.fromDate).slice(0, 10), start), addDays_(String(r.fromDate).slice(0, 10), 20)), b = minDate_(String(r.toDate).slice(0, 10), asOf);
      if (a <= b) accrued -= accrueBetween_(emp, a, b);
    }
    if (r.subtype !== 'annual' || String(r.fromDate) < start) return;
    if (r.status === 'approved') used += Number(r.days) || 0;
    else if (r.status === 'pending') pending += Number(r.days) || 0;
  });
  var svc = emp.hireDate ? daysBetween_(String(emp.hireDate).slice(0, 10), asOf) / 365.25 : 0;
  return { opening: round2_(opening), accrued: round2_(accrued), used: round2_(used), pending: round2_(pending),
    balance: round2_(opening + accrued - used), available: round2_(opening + accrued - used - pending), since: start,
    openingMissing: !hasOpening && !!hire && hire < joined,
    perYear: svc >= 5 ? annualRates_(emp).after5 : annualRates_(emp).before5 };
}

/** Splits a sick leave into full-pay, 75% and unpaid days by the sick year it falls in (Art. 117). */
function sickSplit_(empId, from, days, reqs, excludeId) {
  var list = reqs.filter(function (r) {
    return r.empId === empId && r.type === 'leave' && r.subtype === 'sick' && r.id !== excludeId && (r.status === 'approved' || r.status === 'pending') && String(r.fromDate) < from;
  }).sort(function (a, b) { return a.fromDate < b.fromDate ? -1 : 1; });
  var yearStart = null, used = 0;
  list.forEach(function (r) {
    if (!yearStart || String(r.fromDate) > addDays_(yearStart, 364)) { yearStart = String(r.fromDate); used = 0; }
    used += Number(r.days) || 0;
  });
  if (!yearStart || from > addDays_(yearStart, 364)) { yearStart = from; used = 0; }
  var left = days, out = { yearStart: yearStart, usedBefore: used, full: 0, p75: 0, unpaid: 0, over: 0 };
  var take = function (cap) { var n = Math.max(0, Math.min(left, cap - Math.max(used, 0))); used += n; left -= n; return n; };
  out.full = take(SICK_TIERS[0]); out.p75 = take(SICK_TIERS[1]); out.unpaid = take(SICK_TIERS[2]); out.over = left;
  return out;
}

// ---------------- validating a request (shared by the live quote and by create / approve) ----------------

function requestsOf_(empId) { return readAll_(SHEETS.REQ).filter(function (r) { return r.empId === empId; }); }
function parsePayload_(r) { try { return JSON.parse(r.payloadJson || '{}') || {}; } catch (e) { return {}; } }
function wage_(empId) { var c = currentComp_(empId, today_()); return c ? c.total : 0; }

/** Returns { error, warnings, days, ... } for a proposed request. Never writes. */
function quote_(emp, d, excludeId) {
  var s = settings_(), t = today_(), reqs = requestsOf_(emp.id), q = { warnings: [] };
  var type = String(d.type || ''), p = d.payload || {};
  if (!REQUEST_STEPS[type]) return { error: 'bad_value' };
  q.type = type;
  if (type === 'leave') {
    var sub = String(d.subtype || ''), rule = LEAVE_TYPES[sub];
    if (!rule) return { error: 'bad_value' };
    var from = isoDate_(d.fromDate), to = isoDate_(d.toDate || d.fromDate);
    if (!from || !to || to < from) return { error: 'bad_date' };
    if (from < addDays_(t, -30) && !d._recheck) return { error: 'too_old' };
    if (daysBetween_(from, to) > 180) return { error: 'too_many_days' };
    if (rule.gender && !emp.gender) return { error: 'gender_required' }; // maternity, iddah, paternity: HR records the gender first
    if (rule.gender && emp.gender !== rule.gender) return { error: 'leave_not_eligible' };
    if (rule.serviceYears && (!emp.hireDate || daysBetween_(String(emp.hireDate).slice(0, 10), from) < rule.serviceYears * 365)) return { error: 'leave_not_eligible' };
    if (rule.once && reqs.some(function (r) { return r.id !== excludeId && r.type === 'leave' && r.subtype === sub && (r.status === 'approved' || r.status === 'pending'); })) return { error: 'leave_once' };
    if (reqs.some(function (r) { return r.id !== excludeId && r.type === 'leave' && (r.status === 'approved' || r.status === 'pending') && !(String(r.toDate) < from || String(r.fromDate) > to); })) return { error: 'overlaps' };
    if (rule.doc && !str_(d.docNo, 60)) return { error: 'document_required' };
    var cnt = countLeaveDays_(emp, sub, from, to, holidayMap_(), s);
    q.subtype = sub; q.fromDate = from; q.toDate = to; q.days = cnt.days; q.calendarDays = cnt.calendarDays; q.holidays = cnt.holidays;
    if (!cnt.days) return { error: 'no_working_days' };
    var max = rule.variants ? rule.variants[p.variant === 'short' ? 'short' : 'full'] : rule.max;
    if (max && cnt.days > max) return { error: 'too_many_days', max: max };
    if (rule.min && cnt.days < rule.min) return { error: 'too_few_days', min: rule.min };
    if (rule.event) {
      var ev = isoDate_(p.eventDate);
      if (!ev) return { error: 'missing_fields' };
      if (from < ev || to > addDays_(ev, rule.event - 1)) return { error: 'outside_window' };
    }
    if (sub === 'annual') {
      var bal = annualBalance_(emp, maxDate_(from, t), reqs, excludeId);
      q.balanceBefore = bal.available; q.balanceAfter = round2_(bal.available - cnt.days);
      if (q.balanceAfter < -Number(s.allowNegativeLeave || 0)) return Object.assign(q, { error: 'insufficient_balance' });
    }
    if (sub === 'sick') {
      q.sick = sickSplit_(emp.id, from, cnt.days, reqs, excludeId);
      if (q.sick.over > 0) return Object.assign(q, { error: 'sick_limit' });
      if (q.sick.p75 || q.sick.unpaid) q.warnings.push('sick_reduced_pay');
    }
    if (sub === 'unpaid' && cnt.days > 20) q.warnings.push('contract_suspended');
    // team overlap (2026-10-18): how many of the same team (same manager, else same department) are off on these dates
    var team = readAll_(SHEETS.EMP).filter(function (x) { return x.id !== emp.id && x.status === 'active' && ((emp.managerId && x.managerId === emp.managerId) || (!emp.managerId && emp.departmentId && x.departmentId === emp.departmentId)); });
    if (team.length) {
      var ids = {}; team.forEach(function (x) { ids[x.id] = 1; });
      var off = {}; readAll_(SHEETS.REQ).forEach(function (r) { if (ids[r.empId] && r.type === 'leave' && (r.status === 'approved' || r.status === 'pending') && !(String(r.toDate) < from || String(r.fromDate) > to)) off[r.empId] = 1; });
      var n = Object.keys(off).length, share = (n + 1) / (team.length + 1);
      q.teamOff = n; q.teamSize = team.length + 1;
      if (n && share >= (Number(s.leaveOverlapShare) || 0.34)) q.warnings.push('team_overlap');
    }
    return q;
  }
  if (type === 'letter') {
    if (LETTERS.indexOf(d.subtype) < 0) return { error: 'bad_value' };
    q.subtype = d.subtype;
    q.payload = { addressee: str_(p.addressee, 120) || 'لمن يهمه الأمر', lang: p.lang === 'en' ? 'en' : 'ar' };
    return q;
  }
  if (type === 'advance') {
    var amount = num_(d.amount), months = Math.round(Number(d.months) || 0), w = wage_(emp.id);
    if (!(amount > 0)) return { error: 'bad_amount' };
    if (!(months >= 1 && months <= Number(s.advanceMaxMonths || 12))) return { error: 'bad_value' };
    if (!w) return { error: 'no_package' };
    if (amount > Number(s.maxAdvanceSalaries || 1) * w) return { error: 'advance_too_large', max: Number(s.maxAdvanceSalaries || 1) * w };
    if (reqs.some(function (r) { return r.id !== excludeId && r.type === 'advance' && r.status === 'pending'; })) return { error: 'advance_pending' };
    var inst = round2_(amount / months);
    q.amount = amount; q.months = months; q.installment = inst;
    if (inst > w * 0.5) return Object.assign(q, { error: 'deduction_over_half' });   // Art. 93: total deductions at most half the wage
    if (inst > w * 0.1) q.warnings.push('deduction_over_10');                        // Art. 92: a loan instalment over 10% needs the worker's consent
    var st = new Date(t + 'T00:00:00Z'); st.setUTCMonth(st.getUTCMonth() + 1, 1);
    q.payload = { startMonth: st.toISOString().slice(0, 7), installment: inst };
    return q;
  }
  if (type === 'correction') {
    var date = isoDate_(p.date), time = String(p.time || ''), pt = p.punchType === 'out' ? 'out' : p.punchType === 'in' ? 'in' : '';
    if (!date || !isHm_(time) || !pt) return { error: 'missing_fields' };
    if (date > t || (date < addDays_(t, -30) && !d._recheck)) return { error: 'bad_date' };
    var ts = new Date(new Date(date + 'T' + time + ':00Z').getTime() - CONFIG.TZ_OFFSET_MIN * 60000);
    if (ts.getTime() > Date.now()) return { error: 'future_time' };
    if (reqs.some(function (r) { var x = parsePayload_(r); return r.id !== excludeId && r.type === 'correction' && r.status === 'pending' && x.date === date && x.punchType === pt; })) return { error: 'overlaps' };
    q.fromDate = date; q.payload = { date: date, time: time, punchType: pt };
    return q;
  }
  if (type === 'data_change') {
    var f = p.fields || {}, keys = Object.keys(f).filter(function (k) { return DATA_FIELDS[k]; });
    if (!keys.length) return { error: 'missing_fields' };
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], v = String(f[k] == null ? '' : f[k]).trim();
      if (k === 'iban') { v = v.replace(/\s+/g, '').toUpperCase(); if (v && !validIban_(v)) return { error: 'bad_iban' }; }
      else if (k === 'personalEmail' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return { error: 'bad_email' };
      else if ((k === 'passportExpiry' || k === 'idExpiry') && v) { v = isoDate_(v); if (!v) return { error: 'bad_date' }; }
      else v = str_(v, 200);
      out[k] = v;
    }
    q.payload = { fields: out };
    return q;
  }
  if (type === 'resignation') {
    if (reqs.some(function (r) { return r.id !== excludeId && r.type === 'resignation' && (r.status === 'pending' || r.status === 'approved'); }) || emp.resignedOn) return { error: 'already_resigned' };
    // Art. 75 (amended 2025): the employee gives at least 30 days; a longer contractual notice is kept, a shorter one is not
    var notice = Math.max(30, Number(emp.noticeDays) || 0), minLast = addDays_(t, notice);
    var last = p.lastDay ? isoDate_(p.lastDay) : minLast;
    if (!last || last < t) return { error: 'bad_date' };
    if (last < minLast) q.warnings.push('short_notice');
    q.fromDate = t; q.toDate = last; q.payload = { lastDay: last, noticeDays: notice, minLastDay: minLast };
    return q;
  }
  if (type === 'exit_reentry') return govQuote_(emp, d, excludeId, q, reqs, t); // GovServices.gs
  if (type === 'permission') {
    var pd = isoDate_(p.date), f1 = String(p.fromTime || ''), f2 = String(p.toTime || '');
    if (!pd || !isHm_(f1) || !isHm_(f2)) return { error: 'missing_fields' };
    if ((pd < addDays_(t, -7) || pd > addDays_(t, 60)) && !d._recheck) return { error: 'bad_date' };
    var hm = function (x) { return Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5)); }, mins = hm(f2) - hm(f1);
    if (mins < 15) return { error: 'bad_value' };
    var maxH = Number(s.permissionMaxHours) || 4, capH = Number(s.permissionMonthHours) || 8;
    if (mins > maxH * 60) return { error: 'too_many_hours', max: maxH };
    if (reqs.some(function (r) { return r.id !== excludeId && r.type === 'leave' && (r.status === 'approved' || r.status === 'pending') && String(r.fromDate) <= pd && String(r.toDate) >= pd; })) return { error: 'overlaps' };
    var used = 0;
    reqs.forEach(function (r) { if (r.id !== excludeId && r.type === 'permission' && (r.status === 'approved' || r.status === 'pending') && String(r.fromDate).slice(0, 7) === pd.slice(0, 7)) used += Number(parsePayload_(r).minutes) || 0; });
    q.fromDate = pd; q.toDate = pd; q.hours = round2_(mins / 60);
    q.payload = { date: pd, fromTime: f1, toTime: f2, minutes: mins, monthUsed: used, monthCap: capH * 60 };
    if (used + mins > capH * 60) return Object.assign(q, { error: 'permission_month_cap', max: capH });
    return q;
  }
  if (type === 'remote') {
    var rf = isoDate_(d.fromDate), rt = isoDate_(d.toDate || d.fromDate);
    if (!rf || !rt || rt < rf) return { error: 'bad_date' };
    if (rf < addDays_(t, -7) && !d._recheck) return { error: 'bad_date' };
    var rdays = daysBetween_(rf, rt) + 1;
    if (rdays > 31) return { error: 'too_many_days', max: 31 };
    if (!str_(p.reason, 300)) return { error: 'note_required' };
    if (reqs.some(function (r) { return r.id !== excludeId && (r.type === 'remote' || r.type === 'leave' || r.type === 'travel') && (r.status === 'approved' || r.status === 'pending') && !(String(r.toDate) < rf || String(r.fromDate) > rt); })) return { error: 'overlaps' };
    var sh = shiftOf_(emp, s), work = 0;
    for (var dd = rf, k = 0; dd <= rt && k < 40; dd = addDays_(dd, 1), k++) if (sh.workdays.indexOf(new Date(dd + 'T00:00:00Z').getUTCDay()) >= 0) work++;
    q.fromDate = rf; q.toDate = rt; q.days = work; q.payload = { reason: str_(p.reason, 300), days: work, calendarDays: rdays };
    return q;
  }
  if (type === 'travel') {
    var tf = isoDate_(d.fromDate), tt = isoDate_(d.toDate || d.fromDate), abroad = p.scope === 'abroad', dest = str_(p.destination, 120);
    if (!tf || !tt || tt < tf) return { error: 'bad_date' };
    if (!dest) return { error: 'missing_fields' };
    if (tf < addDays_(t, -7) && !d._recheck) return { error: 'bad_date' };
    var tdays = daysBetween_(tf, tt) + 1;
    if (tdays > 60) return { error: 'too_many_days', max: 60 };
    if (reqs.some(function (r) { return r.id !== excludeId && (r.type === 'travel' || r.type === 'leave') && (r.status === 'approved' || r.status === 'pending') && !(String(r.toDate) < tf || String(r.fromDate) > tt); })) return { error: 'overlaps' };
    var rate = abroad ? (Number(s.perDiemAbroad) || 600) : (Number(s.perDiemInside) || 300);
    q.fromDate = tf; q.toDate = tt; q.days = tdays; q.amount = round2_(rate * tdays);
    q.payload = { destination: dest, scope: abroad ? 'abroad' : 'inside', purpose: str_(p.purpose, 200), transport: ['air', 'company_car', 'own_car', 'other'].indexOf(p.transport) >= 0 ? p.transport : 'air', rate: rate, days: tdays, perDiem: q.amount };
    return q;
  }
  if (type === 'overtime') {
    var od = isoDate_(p.date), hrs = Number(p.hours);
    if (!od) return { error: 'missing_fields' };
    if ((od < addDays_(t, -7) || od > addDays_(t, 60)) && !d._recheck) return { error: 'bad_date' };
    if (!(hrs >= 0.5 && hrs <= 12) || Math.round(hrs * 2) !== hrs * 2) return { error: 'bad_value' };
    if (reqs.some(function (r) { return r.id !== excludeId && r.type === 'overtime' && (r.status === 'approved' || r.status === 'pending') && String(r.fromDate).slice(0, 10) === od; })) return { error: 'overlaps' };
    var yr = 0;
    reqs.forEach(function (r) { if (r.id !== excludeId && r.type === 'overtime' && r.status === 'approved' && String(r.fromDate).slice(0, 4) === od.slice(0, 4)) yr += Number(parsePayload_(r).hours) || 0; });
    q.fromDate = od; q.toDate = od; q.hours = hrs; q.payload = { date: od, hours: hrs, yearHours: yr };
    if (yr + hrs > (Number(s.overtimeYearHours) || 720)) q.warnings.push('overtime_year_cap'); // the ministerial yearly ceiling on overtime hours
    return q;
  }
  return { error: 'bad_value' };
}

/**
 * Labour Law (2025 amendments, resignation article): a resignation the employer has not answered within 30 days of
 * submission counts as accepted; the employer may defer acceptance up to 60 days in writing for a work need.
 * Returns the day the 30 days run out (day of submission + 30).
 */
function resignationAcceptBy_(r) {
  var d = parsePayload_(r).deferUntil;
  return d && /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? String(d) : addDays_(String(r.createdAt || '').slice(0, 10), 30);
}
function resignationDeemed_(r) { return r.type === 'resignation' && r.status === 'pending' && today_() > resignationAcceptBy_(r); }

/**
 * Enforcement (2026-10-18): a pending resignation past its accept-by day is accepted by the system, with the same effect as
 * an approval (resignedOn, last working day, offboarding clearance). Runs at most once an hour, before any write action
 * (Code.gs handle_), and never fails the action that triggered it. Returns the refs it accepted.
 */
function resignationDeemedSweep_(force) {
  if (!force) {
    try { var c = cache_(); if (c.get('deemedSweep')) return []; c.put('deemedSweep', '1', 3600); } catch (e) {}
  }
  var done = [];
  try {
    withLock_(function () {
      var ctx = null, now = new Date().toISOString(), sys = { id: 'system', role: 'system' };
      readAll_(SHEETS.REQ).filter(resignationDeemed_).forEach(function (r) {
        ctx = ctx || orgCtx_();
        var emp = ctx.emps[r.empId];
        if (!emp) return;
        var h = history_(r);
        h.push({ step: r.step, by: 'system', role: 'system', decision: 'deemed_accepted', note: resignationAcceptBy_(r), at: now });
        r.stepsJson = JSON.stringify(h); r.status = 'approved'; r.step = 'done'; r.decidedAt = now; r.updatedAt = now;
        update_(SHEETS.REQ, r);
        applyEffect_(r, emp, sys, parsePayload_(r));
        audit_('system', 'resignation_deemed_accepted', r.empId, { ref: r.ref, acceptBy: resignationAcceptBy_(r) });
        done.push(r.ref);
      });
    });
  } catch (e) { console.error('deemed sweep: ' + (e && e.message)); }
  return done;
}

/**
 * The employer may defer acceptance in writing, for a work need, up to 60 days from submission (once the 30 days have not
 * yet run out). HR only; never on their own resignation; a reason is required and shown to the employee.
 */
function api_resignationDefer(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var reason = str_(req.reason, 300), until = isoDate_(req.until);
  if (!reason) fail_('note_required');
  return withLock_(function () {
    var ctx = orgCtx_(), r = findBy_(SHEETS.REQ, 'id', req.id);
    if (!r || r.type !== 'resignation' || r.status !== 'pending') fail_('not_found');
    if (r.empId === me.id) fail_('cannot_decide_own');
    if (resignationDeemed_(r)) fail_('deemed_accepted');
    var max = addDays_(String(r.createdAt || '').slice(0, 10), 60);
    if (!until || until <= resignationAcceptBy_(r) || until > max) fail_('bad_date');
    var p = parsePayload_(r), now = new Date().toISOString();
    p.deferUntil = until; p.deferReason = reason; p.deferBy = me.id; p.deferAt = now;
    r.payloadJson = JSON.stringify(p);
    var h = history_(r);
    h.push({ step: r.step, by: me.id, role: 'hr', decision: 'deferred', note: until + ' ' + reason, at: now });
    r.stepsJson = JSON.stringify(h); r.updatedAt = now;
    update_(SHEETS.REQ, r);
    audit_(me.id, 'resignation_deferred', r.empId, { ref: r.ref, until: until });
    return { ok: true, request: publicReq_(r, ctx, me) };
  });
}

function api_requestQuote(req, me) {
  var emp = findBy_(SHEETS.EMP, 'id', me.id) || me;
  var q = quote_(emp, req.request || {}, req.excludeId);
  return { ok: true, quote: q };
}

// ---------------- who acts on which step ----------------

function stepsFor_(type, emp, ctx, r) {
  var fixed = r && r.flowJson ? flowSteps_(r) : null; // a configured approval flow, fixed when the request was made (Flows.gs)
  if (fixed) return fixed;
  return REQUEST_STEPS[type].filter(function (st) {
    if (st !== 'manager') return true;
    var m = ctx.emps[emp.managerId];
    return !!(m && m.status === 'active' && m.id !== emp.id);
  });
}
function history_(r) { try { return JSON.parse(r.stepsJson || '[]') || []; } catch (e) { return []; } }

/** Can `me` decide the current step of r? Never the requester, never twice on one request. */
function canAct_(me, r, emp, ctx) {
  if (!me || !emp || r.status !== 'pending' || r.empId === me.id) return false;
  if (history_(r).some(function (h) { return h.by === me.id; })) return false;
  if (r.step === 'manager') return manages_(me, emp, ctx) || isHr_(me) || !!delegatedFor_(me, emp, ctx);
  // A salary advance is pay: its HR step needs the hr role (an administrator alone never), its last step a payroll holder.
  if (r.step === 'hr') return r.type === 'advance' ? (me.role === 'hr' || adminPay_(me)) : isHr_(me);
  if (r.step === 'payroll') return hasRole_(me, 'payroll');
  if (r.step === 'executive') return hasRole_(me, 'executive');
  if (r.step === 'dept_head' || String(r.step).indexOf('person:') === 0) return flowCanAct_(me, r, emp, ctx); // configured flows (Flows.gs)
  return false;
}

// ---------------- create, cancel, decide ----------------

function api_requestCreate(req, me) {
  var d = req.request || {};
  return withLock_(function () {
    var ctx = orgCtx_(), emp = ctx.emps[me.id];
    if (!emp || emp.status !== 'active') fail_('forbidden');
    var q = quote_(emp, d, null);
    if (q.error) fail_(q.error);
    var plan = flowPlan_(q.type, emp, q, ctx); // a configured approval flow (Flows.gs), else the built-in chain
    var steps = plan ? plan.steps.map(function (s) { return s.key; }) : stepsFor_(q.type, emp, ctx), now = new Date().toISOString();
    var kind = q.type === 'leave' ? 'leave' : q.type;
    var row = { id: newId_('R'), ref: nextRef_(kind, refsOf_(SHEETS.REQ)), empId: emp.id, type: q.type, subtype: q.subtype || '', fromDate: q.fromDate || '',
      toDate: q.toDate || '', days: q.days == null ? '' : q.days, amount: q.amount == null ? '' : q.amount, months: q.months || '',
      payloadJson: JSON.stringify(Object.assign({}, d.payload || {}, q.payload || {})), reason: str_(d.reason, 500), docNo: str_(d.docNo, 60),
      status: 'pending', step: steps[0], stepsJson: '[]',
      effectJson: JSON.stringify({ warnings: q.warnings, sick: q.sick || null, holidays: q.holidays || [], calendarDays: q.calendarDays || null }),
      createdAt: now, updatedAt: now, decidedAt: '', flowJson: plan ? JSON.stringify(plan) : '' };
    append_(SHEETS.REQ, row);
    audit_(me.id, 'request_create', emp.id, { ref: row.ref, type: row.type, subtype: row.subtype });
    return { ok: true, request: publicReq_(row, ctx, me) };
  });
}

function api_requestCancel(req, me) {
  return withLock_(function () {
    var r = findBy_(SHEETS.REQ, 'id', req.id);
    if (!r) fail_('not_found');
    var own = r.empId === me.id;
    if (own && r.status === 'pending') { /* the requester withdraws it */ }
    else if (isHr_(me) && !own && r.status === 'approved' && r.type === 'leave' && String(r.toDate) >= today_()) { /* HR cancels leave not yet over */ }
    else fail_('forbidden');
    var h = history_(r);
    h.push({ step: r.step || 'done', by: me.id, decision: 'cancelled', note: str_(req.note, 300), at: new Date().toISOString() });
    r.status = 'cancelled'; r.stepsJson = JSON.stringify(h); r.updatedAt = new Date().toISOString();
    update_(SHEETS.REQ, r);
    if (r.type === 'leave') leaveCycleCancel_(r, me); // its leave cycle goes with it (Flows.gs)
    audit_(me.id, 'request_cancel', r.empId, { ref: r.ref });
    return { ok: true };
  });
}

function api_reqDecide(req, me) {
  var decision = req.decision === 'approve' ? 'approve' : req.decision === 'reject' ? 'reject' : '';
  if (!decision) fail_('bad_request');
  return withLock_(function () {
    var ctx = orgCtx_(), r = findBy_(SHEETS.REQ, 'id', req.id);
    if (!r) fail_('not_found');
    var emp = ctx.emps[r.empId];
    if (r.empId === me.id) fail_('cannot_decide_own');
    if (!canAct_(me, r, emp, ctx)) fail_(r.status !== 'pending' ? 'not_found' : 'forbidden');
    var note = str_(req.note, 300), now = new Date().toISOString();
    if (decision === 'reject' && !note) fail_('note_required');
    if (decision === 'reject' && resignationDeemed_(r)) fail_('deemed_accepted'); // 2025 amendment: past the accept-by day it cannot be refused
    var h = history_(r);
    var who = flowActor_(me, r, emp, ctx); // the step itself, a delegate on behalf of the approver, or HR on behalf (Flows.gs)
    h.push({ step: r.step, by: me.id, role: who.role, onBehalfOf: who.onBehalfOf, decision: decision, note: note, at: now });
    r.stepsJson = JSON.stringify(h); r.updatedAt = now;
    if (decision === 'reject') { r.status = 'rejected'; r.decidedAt = now; }
    else {
      var steps = stepsFor_(r.type, emp, ctx, r), next = steps[steps.indexOf(r.step) + 1];
      if (next) r.step = next;
      else {
        // Final approval: re-check against today's data (balance, overlaps) before it takes effect.
        var p = parsePayload_(r);
        var q = quote_(emp, { type: r.type, subtype: r.subtype, fromDate: r.fromDate, toDate: r.toDate, amount: r.amount, months: r.months, docNo: r.docNo, payload: p, _recheck: true }, r.id);
        if (q.error) fail_(q.error);
        r.status = 'approved'; r.step = 'done'; r.decidedAt = now;
        if (r.type === 'leave') r.days = q.days;
        applyEffect_(r, emp, me, p);
      }
    }
    update_(SHEETS.REQ, r);
    audit_(me.id, 'request_' + (r.status === 'approved' ? 'approved' : decision === 'reject' ? 'rejected' : 'step'), r.empId, { ref: r.ref, step: r.step });
    return { ok: true, request: publicReq_(r, ctx, me) };
  });
}

/** What an approved request changes elsewhere. */
function applyEffect_(r, emp, me, p) {
  var now = new Date().toISOString();
  if (r.type === 'correction') {
    var ts = new Date(new Date(p.date + 'T' + p.time + ':00Z').getTime() - CONFIG.TZ_OFFSET_MIN * 60000);
    append_(SHEETS.PUNCH, { id: newId_('P'), empId: emp.id, type: p.punchType, ts: ts.toISOString(), date: p.date, lat: '', lng: '', acc: '',
      zoneId: '', distance: '', status: 'manual', risk: 0, flags: '', source: 'request:' + r.ref, note: (r.reason || '') + ' (' + r.ref + ')',
      reviewBy: me.id, reviewAt: now, credId: '', ua: '', createdAt: now });
  } else if (r.type === 'data_change') {
    var f = (p.fields || {}), priv = findBy_(SHEETS.PRIV, 'empId', emp.id), created = !priv, oldIban = priv ? priv.iban : '';
    if (!priv) priv = { empId: emp.id };
    var empChanged = false;
    Object.keys(f).forEach(function (k) { if (DATA_FIELDS[k] === 'emp') { emp[k] = f[k]; empChanged = true; } else priv[k] = f[k]; });
    priv.updatedAt = now;
    if (empChanged) { emp.updatedAt = now; update_(SHEETS.EMP, emp); }
    if (Object.keys(f).some(function (k) { return DATA_FIELDS[k] === 'priv'; })) { if (created) append_(SHEETS.PRIV, priv); else update_(SHEETS.PRIV, priv); }
    audit_(me.id, 'data_change_applied', emp.id, { ref: r.ref, fields: Object.keys(f), iban: 'iban' in f ? (String(oldIban || '').slice(-4) || '-') + ' > ' + (String(f.iban).slice(-4) || '-') : undefined });
  } else if (r.type === 'resignation') {
    emp.resignedOn = String(r.createdAt).slice(0, 10); emp.lastWorkingDay = p.lastDay; emp.updatedAt = now;
    update_(SHEETS.EMP, emp);
    clearanceOpen_(emp, p.lastDay, 'resignation', me.id); // offboarding clearance (Custody.gs)
  } else if (r.type === 'exit_reentry') {
    govVisaApproved_(r, emp, me, p); // GovServices.gs: waits for HR to record the visa issued in Muqeem
  } else if (r.type === 'leave') {
    leaveCycleAuto_(r, emp, me); // a long enough leave opens its leave cycle (Flows.gs)
  } else if (r.type === 'travel' && Number(p.perDiem) > 0) {
    // the per diem is paid with the salary of the month the trip starts (or the next open one); non-wage (no GOSI, outside Art. 93)
    var tm = String(r.fromDate).slice(0, 7);
    for (var k = 0; k < 12 && monthLocked_(emp.id, tm); k++) tm = govAddMonths_(tm + '-01', 1).slice(0, 7);
    append_(SHEETS.ADJ, { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: emp.id, month: tm, kind: 'earning', code: 'per_diem',
      amount: Number(p.perDiem), reason: r.ref + ' ' + String(p.destination || '').slice(0, 100), enteredBy: me.id, status: 'active', createdAt: now });
  } else if (r.type === 'overtime') {
    // approved overtime becomes an overtime_hours adjustment in the month it was worked (or the next open one); payroll pays it per Art. 107
    var month = String(p.date).slice(0, 7);
    for (var i = 0; i < 12 && monthLocked_(emp.id, month); i++) month = govAddMonths_(month + '-01', 1).slice(0, 7);
    append_(SHEETS.ADJ, { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: emp.id, month: month, kind: ADJ_CODES.overtime_hours, code: 'overtime_hours',
      amount: Number(p.hours), reason: r.ref + (r.reason ? ' ' + String(r.reason).slice(0, 150) : ''), enteredBy: me.id, status: 'active', createdAt: now });
  }
}

// ---------------- reading requests ----------------

function empCard_(e) { return e ? { id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, title: e.title, department: e.department } : null; }

/**
 * A request as `viewer` may see it: advance amounts only for the requester, the hr role and payroll (an administrator
 * alone never sees pay); data-change values for the requester, HR (with the administrator) and payroll.
 */
function publicReq_(r, ctx, viewer) {
  var p = parsePayload_(r), fx = {};
  try { fx = JSON.parse(r.effectJson || '{}') || {}; } catch (e) { fx = {}; }
  var money = viewer && (viewer.id === r.empId || viewer.role === 'hr' || hasRole_(viewer, 'payroll'));
  var data = viewer && (viewer.id === r.empId || isHr_(viewer) || hasRole_(viewer, 'payroll'));
  var steps = stepsFor_(r.type, ctx.emps[r.empId] || { id: r.empId }, ctx, r);
  var o = { id: r.id, ref: r.ref, type: r.type, subtype: r.subtype, fromDate: r.fromDate ? String(r.fromDate).slice(0, 10) : '',
    toDate: r.toDate ? String(r.toDate).slice(0, 10) : '', days: r.days === '' ? null : Number(r.days), reason: r.reason, docNo: r.docNo,
    status: r.status, step: r.step, steps: steps, createdAt: r.createdAt, decidedAt: r.decidedAt, warnings: fx.warnings || [], sick: fx.sick || null,
    emp: empCard_(ctx.emps[r.empId]),
    history: history_(r).map(function (h) { var b = ctx.emps[h.by], ob = ctx.emps[h.onBehalfOf]; return { step: h.step, role: h.role, decision: h.decision, note: h.note, at: h.at, by: b ? b.name : '', onBehalfOf: ob ? ob.name : '' }; }) };
  if (String(r.step).indexOf('person:') === 0 && ctx.emps[r.step.slice(7)]) o.stepWho = ctx.emps[r.step.slice(7)].name; // a named approver (Flows.gs)
  if (r.type === 'advance' && money) { o.amount = Number(r.amount); o.months = Number(r.months); o.installment = p.installment; o.startMonth = p.startMonth; }
  if (r.type === 'letter') o.letter = { addressee: p.addressee, lang: p.lang };
  if (r.type === 'correction') o.correction = { date: p.date, time: p.time, punchType: p.punchType };
  if (r.type === 'permission') o.permission = { date: p.date, fromTime: p.fromTime, toTime: p.toTime, minutes: Number(p.minutes) || 0 };
  if (r.type === 'overtime') o.overtime = { date: p.date, hours: Number(p.hours) || 0 };
  if (r.type === 'travel') { o.travel = { destination: p.destination, scope: p.scope, purpose: p.purpose, transport: p.transport, days: Number(p.days) || 0 }; if (money) { o.travel.rate = Number(p.rate) || 0; o.travel.perDiem = Number(p.perDiem) || 0; } }
  if (r.type === 'resignation') o.resignation = { lastDay: p.lastDay, noticeDays: p.noticeDays, minLastDay: p.minLastDay, acceptBy: resignationAcceptBy_(r),
    deemedAccepted: resignationDeemed_(r) || history_(r).some(function (h) { return h.decision === 'deemed_accepted'; }),
    deferUntil: parsePayload_(r).deferUntil || '', deferReason: parsePayload_(r).deferReason || '', maxDefer: addDays_(String(r.createdAt || '').slice(0, 10), 60) };
  if (r.type === 'data_change' && data) o.fields = p.fields || {};
  else if (r.type === 'data_change') o.fieldNames = Object.keys(p.fields || {});
  if (r.type === 'leave' && p.variant) o.variant = p.variant;
  if (r.type === 'leave' && p.eventDate) o.eventDate = p.eventDate;
  if (r.type === 'exit_reentry') o.visa = govReqView_(r, p); // GovServices.gs
  return o;
}

function leaveSummary_(emp, reqs) {
  var t = today_(), mine = reqs.filter(function (r) { return r.empId === emp.id; });
  var sickNow = sickSplit_(emp.id, t, 0, mine, null);
  return { annual: annualBalance_(emp, t, mine, null),
    sick: { yearStart: sickNow.yearStart, used: sickNow.usedBefore, fullLeft: Math.max(0, SICK_TIERS[0] - sickNow.usedBefore) } };
}

function api_myRequests(req, me) {
  var ctx = orgCtx_(), emp = ctx.emps[me.id] || me, all = readAll_(SHEETS.REQ);
  var mine = all.filter(function (r) { return r.empId === me.id; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  var inbox = all.filter(function (r) { return canAct_(me, r, ctx.emps[r.empId], ctx); }).length;
  var hol = holidayMap_(), t = today_(), upcoming = [];
  Object.keys(hol).sort().forEach(function (d) { if (d >= t && d <= addDays_(t, 120)) upcoming.push({ date: d, name: hol[d] }); });
  return { ok: true, rows: mine.map(function (r) { return publicReq_(r, ctx, me); }), leave: leaveSummary_(emp, all), inbox: inbox,
    holidays: upcoming, rules: { leaveCountMode: settings_().leaveCountMode, types: Object.keys(LEAVE_TYPES), letters: LETTERS } };
}

/** Requests waiting for me (default) or, for HR, every request filtered by status. */
function api_reqInbox(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.REQ), rows;
  if (req.scope === 'all') {
    if (!isHr_(me)) fail_('forbidden');
    var st = ['pending', 'approved', 'rejected', 'cancelled'].indexOf(req.status) >= 0 ? req.status : '';
    rows = all.filter(function (r) { return !st || r.status === st; });
  } else rows = all.filter(function (r) { return canAct_(me, r, ctx.emps[r.empId], ctx); });
  rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  rows = rows.slice(0, 300);
  var out = rows.map(function (r) {
    var o = publicReq_(r, ctx, me), e = ctx.emps[r.empId];
    o.canAct = canAct_(me, r, e, ctx);
    if (r.type === 'leave' && e) o.balance = annualBalance_(e, today_(), all.filter(function (x) { return x.empId === e.id; }), null);
    return o;
  });
  return { ok: true, rows: out };
}

// ---------------- public holidays ----------------

function publicHoliday_(h) { return { id: h.id, date: String(h.date).slice(0, 10), toDate: String(h.toDate || h.date).slice(0, 10), nameAr: h.nameAr, nameEn: h.nameEn }; }
function api_holidayList(req, me) {
  return { ok: true, rows: readAll_(SHEETS.HOL).filter(function (h) { return h.status !== 'deleted'; }).map(publicHoliday_)
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; }) };
}
function api_holidaySave(req, me) {
  var d = req.holiday || {}, from = isoDate_(d.date), to = isoDate_(d.toDate || d.date), name = str_(d.nameAr, 80);
  if (!from || !to || to < from || daysBetween_(from, to) > 30) fail_('bad_date');
  if (!name) fail_('missing_fields');
  return withLock_(function () {
    var row = d.id ? findBy_(SHEETS.HOL, 'id', d.id) : null, created = !row;
    if (d.id && !row) fail_('not_found');
    if (!row) row = { id: newId_('O'), createdBy: me.id, createdAt: new Date().toISOString() };
    row.date = from; row.toDate = to; row.nameAr = name; row.nameEn = str_(d.nameEn, 80); row.status = 'active';
    if (created) append_(SHEETS.HOL, row); else update_(SHEETS.HOL, row);
    audit_(me.id, created ? 'holiday_create' : 'holiday_update', '', { date: from, toDate: to, name: name });
    return { ok: true, holiday: publicHoliday_(row) };
  });
}
function api_holidayDelete(req, me) {
  return withLock_(function () {
    var row = findBy_(SHEETS.HOL, 'id', req.id);
    if (!row) fail_('not_found');
    row.status = 'deleted';
    update_(SHEETS.HOL, row);
    audit_(me.id, 'holiday_delete', '', { date: row.date, name: row.nameAr });
    return { ok: true };
  });
}

// ---------------- team leave and balances ----------------

/** Who is on leave in a month: HR sees everyone, a manager their people. Pending leave is shown as such. */
function api_leaveTeam(req, me) {
  var ctx = orgCtx_(), m = /^\d{4}-\d{2}$/.test(req.month || '') ? req.month : today_().slice(0, 7);
  var first = m + '-01', last = addDays_(addDays_(first, 32).slice(0, 8) + '01', -1);
  var hr = isHr_(me), who = {}, managesAny = false;
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k], mg = manages_(me, e, ctx);
    if (mg) managesAny = true;
    if (e.status === 'active' && (hr || e.id === me.id || mg)) who[e.id] = e;
  });
  if (!hr && !managesAny) fail_('forbidden');
  var rows = readAll_(SHEETS.REQ).filter(function (r) {
    return who[r.empId] && r.type === 'leave' && (r.status === 'approved' || r.status === 'pending') && !(String(r.toDate) < first || String(r.fromDate) > last);
  }).map(function (r) { return { ref: r.ref, emp: empCard_(who[r.empId]), subtype: r.subtype, fromDate: String(r.fromDate).slice(0, 10), toDate: String(r.toDate).slice(0, 10), days: Number(r.days), status: r.status }; })
    .sort(function (a, b) { return a.fromDate < b.fromDate ? -1 : 1; });
  var hol = holidayMap_(), hs = [];
  Object.keys(hol).sort().forEach(function (d) { if (d >= first && d <= last) hs.push({ date: d, name: hol[d] }); });
  return { ok: true, month: m, rows: rows, holidays: hs, people: Object.keys(who).length };
}

function api_leaveBalances(req, me) {
  var ctx = orgCtx_(), all = readAll_(SHEETS.REQ), t = today_();
  var rows = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; })
    .map(function (e) {
      var s = leaveSummary_(e, all);
      return { emp: empCard_(e), hireDate: e.hireDate || '', openingDays: e.leaveOpeningDays === '' ? null : Number(e.leaveOpeningDays),
        openingDate: e.leaveOpeningDate ? String(e.leaveOpeningDate).slice(0, 10) : '', annual: s.annual, sick: s.sick,
        onLeaveToday: all.some(function (r) { return r.empId === e.id && r.type === 'leave' && r.status === 'approved' && String(r.fromDate) <= t && String(r.toDate) >= t; }) };
    });
  return { ok: true, rows: rows };
}

/** The balance carried over from the old system: `days` as at `asOf` (usually the go-live date). */
function api_leaveOpeningSave(req, me) {
  var days = Number(req.days), asOf = isoDate_(req.asOf);
  if (!isFinite(days) || days < -60 || days > 365) fail_('bad_value');
  if (!asOf) fail_('bad_date');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.empId);
    if (!emp) fail_('not_found');
    if (emp.id === me.id) fail_('cannot_change_own_balance');
    // No guardEdit_ here: an administrator may never set their own balance, so HR must be able to load it
    // (otherwise a company with one administrator could never record that person's carried-over leave).
    var before = { days: emp.leaveOpeningDays, asOf: emp.leaveOpeningDate };
    emp.leaveOpeningDays = round2_(days); emp.leaveOpeningDate = asOf; emp.updatedAt = new Date().toISOString();
    update_(SHEETS.EMP, emp);
    audit_(me.id, 'leave_opening', emp.id, { before: before, days: emp.leaveOpeningDays, asOf: asOf });
    return { ok: true };
  });
}

// ---------------- what attendance shows on leave days and public holidays ----------------

/**
 * One read of requests and holidays for a date range. Returns off(empId, date) ->
 * { holiday: name } | { leave: subtype } | { holiday, leave } | null.
 */
function offIndex_(from, to) {
  var hol = holidayMap_(), leave = {}, remote = {};
  readAll_(SHEETS.REQ).forEach(function (r) {
    if (r.type === 'remote' && r.status === 'approved') { var ra = maxDate_(String(r.fromDate).slice(0, 10), from), rb = minDate_(String(r.toDate).slice(0, 10), to); for (var rd = ra, ri = 0; rd <= rb && ri < 62; rd = addDays_(rd, 1), ri++) remote[r.empId + '|' + rd] = 1; return; }
    if (r.type !== 'leave' || r.status !== 'approved') return;
    var a = maxDate_(String(r.fromDate).slice(0, 10), from), b = minDate_(String(r.toDate).slice(0, 10), to);
    for (var d = a, i = 0; d <= b && i < 200; d = addDays_(d, 1), i++) leave[r.empId + '|' + d] = r.subtype;
  });
  // Days off after a work injury (Relations.gs) are paid leave, never absence.
  readAll_(SHEETS.INJ).forEach(function (x) {
    if (!x.offFrom || !x.offTo) return;
    var a = maxDate_(String(x.offFrom).slice(0, 10), from), b = minDate_(String(x.offTo).slice(0, 10), to);
    for (var d = a, i = 0; d <= b && i < 200; d = addDays_(d, 1), i++) if (!leave[x.empId + '|' + d]) leave[x.empId + '|' + d] = 'injury';
  });
  return function (empId, date) {
    var h = hol[date], l = leave[empId + '|' + date], rm = remote[empId + '|' + date];
    if (!h && !l && !rm) return null;
    var o = {}; if (h) o.holiday = h; if (l) o.leave = l; if (rm) o.remote = true; return o;
  };
}
