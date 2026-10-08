/**
 * Leave cycle (دورة الإجازة), approvals centre (مركز الموافقات) and configurable approval flows, 2026-10-05.
 *
 * LEAVE CYCLE. An approved leave of `leaveClearanceMinDays` or more counted days (default 7; 1 = every leave) opens a
 * cycle LC-YYYY-00001 that runs pre-leave clearance, departure and the return to work, the way Saudi employers do it:
 *   - handover of duties to a named substitute, who must accept (or decline: the handover opens again);
 *   - custody check of the assets the employee holds (Custody.gs); nothing held = not applicable;
 *   - the leaver's approvals delegated for the leave dates (Compliance.gs delegation), only when the leaver manages people;
 *   - exit and re-entry visa for non-Saudis (number and validity, valid past the return); a GovServices exit_reentry request
 *     for the same dates is shown beside it;
 *   - air ticket per contract (employees.ticketEntitlement: none, self, family, self_2y, family_2y) with the booking reference;
 *   - leave salary in advance (optional, by HR or payroll: a numbered payroll adjustment for the next open run; Art. 109).
 *   Each task is ticked only by its owner (employee, substitute, line manager or their delegate, HR, payroll), or marked not
 *   applicable with a note. Departure is "cleared" when every required task is done or not applicable.
 *   Departure: the employee (or HR) confirms the actual date; a later departure gives the unused days back.
 *   Return: the employee records it and the manager (or HR) confirms the actual date. Early: the unused days go back to the
 *   balance (the request's dates and days are shortened). Late: the working days missed are absence, or an extension (a new
 *   leave request through the normal chain), decided by the manager or HR. Absence of more than 20 consecutive days, or more
 *   than 30 days in 12 months, is flagged under Art. 80: a warning for HR, never an automatic action (the article also needs
 *   a prior written warning). Thresholds are constants below: check them against the current HRSD text.
 *   Status: approved > clearing > cleared > departed > returned (or overdue_return) > closed; cancelled with the leave.
 *
 * APPROVALS CENTRE. approvalsInbox (read-only, every tab read once) lists what waits for the viewer across modules, with
 * age and SLA state (on_time / due_today / late) against `approvalSlaHours` (default 48) or the flow step's own target.
 * After 2x the SLA an item also shows to the next level (the approver's manager, or HR) as "escalated", without taking the
 * original approver's right away. approvalsAct acts through each module's own endpoint, so every module rule stays in
 * force (nobody acts on their own item or on two steps; a reject needs a note); a bulk is one type, approve only, and must
 * carry confirm: true. approvalHistory rebuilds who did what, when, with what note and on whose behalf.
 *
 * APPROVAL FLOWS (tab approvalFlows, versioned AF-001...). Per request type: ordered steps (manager, dept_head, hr, payroll,
 * executive, person) each with an optional condition (amountOver, daysOver, departmentId, saudi) and SLA hours. The plan is
 * resolved when a request is created and kept on it (requests.flowJson), so editing a flow never changes requests in
 * progress. No flow, or a reset, keeps the built-in chains (REQUEST_STEPS in Leave.gs) exactly as before.
 */

// ---------------- settings and calendar helpers ----------------

var LC_ART80 = { consecutive: 20, year: 30 }; // Art. 80: more than 20 consecutive days, or more than 30 in a year (verify with HRSD)
var LC_TASKS = [
  { key: 'handover', owner: 'employee', due: -1 },
  { key: 'handover_accept', owner: 'substitute', due: -1 },
  { key: 'custody', owner: 'manager', due: -1 },
  { key: 'delegation', owner: 'employee', due: -1 },
  { key: 'exit_reentry', owner: 'hr', due: -3 },
  { key: 'ticket', owner: 'hr', due: -7 },
  { key: 'leave_salary', owner: 'payroll', due: -3 }
];

function lcConf_() {
  var s = settings_(), min = Math.round(Number(s.leaveClearanceMinDays)), sla = Number(s.approvalSlaHours);
  if (!(min >= 1)) min = 7;
  if (!(sla >= 1)) sla = 48;
  return { minDays: Math.min(min, 365), slaHours: Math.min(sla, 720), s: s };
}
function lcWorkday_(emp, s, hol, d) { return shiftOf_(emp, s).workdays.indexOf(dow_(d)) >= 0 && !hol[d]; }
/** The first working day after the leave: when the employee is due back. */
function lcBackOn_(emp, toDate, s, hol) {
  var d = addDays_(String(toDate).slice(0, 10), 1);
  for (var i = 0; i < 30; i++, d = addDays_(d, 1)) if (lcWorkday_(emp, s, hol, d)) return d;
  return addDays_(String(toDate).slice(0, 10), 1);
}
function lcWorkdays_(emp, from, to, s, hol) {
  var n = 0;
  for (var d = from, i = 0; d <= to && i < 400; d = addDays_(d, 1), i++) if (lcWorkday_(emp, s, hol, d)) n++;
  return n;
}
function lcName_(ctx, id) { var e = ctx.emps[id]; return e ? e.name : ''; }

// ---------------- opening and cancelling a cycle ----------------

/** The contract's ticket terms (GovServices.gs ticketRights): due in the current cycle and not used up = required. */
function lcTicketRight_(empId) {
  var right = readAll_(SHEETS.TICKET).filter(function (r) { return r.empId === empId && r.status === 'active'; })[0];
  if (!right) return null;
  var cyc = ticketCycle_(right, today_()), entitled = 1 + (Number(right.dependants) || 0), used = 0;
  if (cyc.current) readAll_(SHEETS.TICKET_USE).forEach(function (u) { if (u.rightId === right.id && u.status !== 'rejected' && String(u.cycleDue).slice(0, 10) === cyc.current.due) used += Number(u.persons) || 0; });
  return { travelClass: right.travelClass, everyYears: Number(right.everyYears) || 1, dependants: Number(right.dependants) || 0, route: right.route || '',
    cycleDue: cyc.current ? cyc.current.due : '', nextDue: cyc.next, remaining: cyc.current ? Math.max(0, entitled - used) : 0 };
}
function lcTicketTask_(emp, x) {
  var r = lcTicketRight_(emp.id);
  x.data = { right: r };
  if (!r) { x.required = false; x.note = 'no_right'; return; } // no ticket terms recorded: HR decides when ticking
  if (!r.remaining) { x.status = 'na'; x.required = false; x.note = 'not_due'; }
}

/** Opens the cycle of an approved leave request (one per request). Called inside the caller's lock. */
function lcOpen_(r, emp, byId, ctx) {
  var cycles = readAll_(SHEETS.LCYC);
  if (cycles.some(function (c) { return c.requestId === r.id && c.status !== 'cancelled'; })) return null;
  ctx = ctx || orgCtx_();
  var from = String(r.fromDate).slice(0, 10), to = String(r.toDate).slice(0, 10), now = new Date().toISOString();
  var saudi = bool_(emp.isSaudi), mgr = managesAnyone_(emp, ctx);
  var tasks = LC_TASKS.map(function (d) {
    var x = { key: d.key, owner: d.owner, required: true, status: 'open', due: addDays_(from, d.due), since: now, by: '', at: '', note: '', onBehalfOf: '', data: {} };
    if (d.key === 'handover_accept') x.status = 'waiting';
    if (d.key === 'delegation' && !mgr) { x.status = 'na'; x.required = false; x.note = 'not_manager'; }
    if (d.key === 'exit_reentry' && saudi) { x.status = 'na'; x.required = false; x.note = 'saudi'; }
    if (d.key === 'ticket') lcTicketTask_(emp, x);
    if (d.key === 'leave_salary') x.required = false;
    return x;
  });
  var row = { id: newId_('Y'), ref: nextRef_('leavecycle', refsOf_(SHEETS.LCYC)), requestId: r.id, requestRef: r.ref, empId: emp.id, subtype: r.subtype,
    fromDate: from, toDate: to, days: Number(r.days) || 0, status: 'approved', substituteId: '', tasksJson: JSON.stringify(tasks), departedOn: '', departedBy: '',
    returnedOn: '', returnRecordedAt: '', returnConfirmedOn: '', returnConfirmedBy: '', outcome: '', earlyDays: '', lateDays: '', extensionRef: '', art80Json: '',
    historyJson: JSON.stringify([{ at: now, by: byId, action: 'opened' }]), createdBy: byId, createdAt: now, updatedAt: now, closedAt: '' };
  append_(SHEETS.LCYC, row);
  return row;
}

/** Leave.gs applyEffect_: an approved leave long enough opens its cycle. An extension of a late return never opens another. */
function leaveCycleAuto_(r, emp, me) {
  if (r.type !== 'leave' || r.status !== 'approved') return null;
  if (parsePayload_(r).extensionOf) return null;
  if ((Number(r.days) || 0) < lcConf_().minDays) return null;
  var row = lcOpen_(r, emp, me.id);
  if (row) audit_(me.id, 'leave_cycle_open', emp.id, { ref: row.ref, request: r.ref });
  return row;
}
/** Leave.gs api_requestCancel: a cancelled leave cancels its open cycle. */
function leaveCycleCancel_(r, me) {
  var now = new Date().toISOString();
  readAll_(SHEETS.LCYC).forEach(function (c) {
    if (c.requestId !== r.id || c.status === 'cancelled' || c.status === 'closed') return;
    var h = parseJson_(c.historyJson, []); h.push({ at: now, by: me.id, action: 'cancelled' });
    c.status = 'cancelled'; c.historyJson = JSON.stringify(h); c.updatedAt = now;
    update_(SHEETS.LCYC, c);
    audit_(me.id, 'leave_cycle_cancel', c.empId, { ref: c.ref });
  });
}

// ---------------- who may act, and the live state ----------------

function lcHasManager_(emp, ctx) {
  var m = ctx.emps[emp.managerId];
  if (m && m.status === 'active' && m.id !== emp.id) return true;
  var h = headFor_(emp, ctx);
  return !!(h && h.status === 'active');
}
/** Owner rule: each task is ticked only by its owner. A manager task falls to HR when nobody manages the employee. */
function lcIsOwner_(me, owner, c, emp, ctx) {
  if (!me || !emp) return false;
  if (owner === 'employee') return me.id === c.empId;
  if (owner === 'substitute') return !!c.substituteId && me.id === c.substituteId;
  if (me.id === c.empId) return false;
  if (owner === 'manager') return lcHasManager_(emp, ctx) ? (manages_(me, emp, ctx) || !!delegatedFor_(me, emp, ctx)) : isHr_(me);
  if (owner === 'hr') return isHr_(me);
  if (owner === 'payroll') return canPayroll_(me);
  return false;
}
function lcHeld_(empId) { return readAll_(SHEETS.CUST).filter(function (x) { return x.empId === empId && x.status === 'held'; }); }
/** Tasks with what is computed live: custody is not applicable when nothing is held. */
function lcLive_(c, emp) {
  var tasks = parseJson_(c.tasksJson, []), held = null;
  tasks.forEach(function (x) {
    if (x.key === 'custody' && x.status === 'open') { if (held === null) held = lcHeld_(c.empId).length; if (!held) { x.status = 'na'; x.auto = true; } }
  });
  return tasks;
}
function lcCleared_(tasks) { return tasks.every(function (x) { return !x.required || x.status === 'done' || x.status === 'na'; }); }
function lcState_(c, tasks, back, t) {
  if (c.status === 'cancelled' || c.status === 'closed') return c.status;
  if (c.returnedOn) return 'returned';
  if (c.departedOn) return t > back ? 'overdue_return' : 'departed';
  if (lcCleared_(tasks)) return 'cleared';
  return tasks.some(function (x) { return x.by && (x.status === 'done' || x.status === 'na'); }) ? 'clearing' : 'approved';
}
/** What the viewer can do on this cycle right now: open tasks they own (before departure) and the lifecycle steps. */
function lcMine_(c, tasks, me, emp, ctx, t, back) {
  var out = [];
  if (c.status === 'closed' || c.status === 'cancelled') return out;
  if (!c.departedOn && !c.returnedOn) tasks.forEach(function (x) {
    if (x.status === 'open' && lcIsOwner_(me, x.owner, c, emp, ctx)) out.push({ key: x.key, kind: 'task', owner: x.owner, due: x.due, since: x.since || c.createdAt });
  });
  if (!c.departedOn && !c.returnedOn && me.id === c.empId && t >= c.fromDate && lcCleared_(tasks)) out.push({ key: 'depart', kind: 'step', owner: 'employee', due: c.fromDate, since: c.createdAt });
  if (!c.returnedOn && me.id === c.empId && t >= back) out.push({ key: 'return', kind: 'step', owner: 'employee', due: back, since: c.departedOn || c.createdAt });
  if (!c.returnConfirmedOn && me.id !== c.empId && lcIsOwner_(me, 'manager', c, emp, ctx) && (c.returnedOn || t > back))
    out.push({ key: 'confirm', kind: 'step', owner: 'manager', due: c.returnedOn ? String(c.returnedOn).slice(0, 10) : addDays_(back, 1), since: c.returnRecordedAt || c.createdAt });
  return out;
}
/** Absence days counted towards Art. 80 in the last 12 months, plus `extra` (this return or the days overdue so far). */
function lcArt80_(empId, cycles, extra, excludeId) {
  var since = addDays_(today_(), -365), total = 0;
  cycles.forEach(function (c) {
    if (c.empId !== empId || c.id === excludeId || c.outcome !== 'absence' || String(c.returnConfirmedOn).slice(0, 10) < since) return;
    total += Number(c.lateDays) || 0;
  });
  var year = total + extra;
  return { consecutive: extra, yearTotal: year, flagged: extra > LC_ART80.consecutive || year > LC_ART80.year, limits: LC_ART80 };
}
function lcPaySuggest_(emp, c) {
  var w = wage_(emp.id);
  return w ? round2_(w / 30 * (daysBetween_(String(c.fromDate).slice(0, 10), String(c.toDate).slice(0, 10)) + 1)) : null;
}
function lcNextMonth_(empId) {
  var m = today_().slice(0, 7);
  for (var i = 0; i < 3 && monthLocked_(empId, m); i++) m = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 1)).toISOString().slice(0, 7);
  return m;
}

/** A cycle as the viewer may see it (null when they may not). Travel data: the employee and HR; money: the employee and pay. */
function lcView_(c, me, ctx, o) {
  var emp = ctx.emps[c.empId];
  if (!emp) return null;
  var self = me.id === c.empId, hr = isHr_(me), pay = canPayroll_(me), sub = (!!c.substituteId && me.id === c.substituteId) || (!!o.viewAsSub && o.viewAsSub === me.id);
  var mgr = !self && (manages_(me, emp, ctx) || !!delegatedFor_(me, emp, ctx));
  if (!self && !hr && !pay && !sub && !mgr) return null;
  var t = today_(), back = lcBackOn_(emp, c.toDate, o.s, o.hol), tasks = lcLive_(c, emp), state = lcState_(c, tasks, back, t);
  var mine = lcMine_(c, tasks, me, emp, ctx, t, back), mk = {};
  mine.forEach(function (a) { mk[a.key] = 1; });
  var seeTravel = self || hr, seeMoney = self || pay, seeWork = self || hr || mgr || sub, open = state !== 'closed' && state !== 'cancelled';
  var vt = tasks.map(function (x) {
    var d = x.data || {}, v = { key: x.key, owner: x.owner, required: !!x.required, status: x.status, due: x.due, by: lcName_(ctx, x.by), at: x.at,
      onBehalfOf: lcName_(ctx, x.onBehalfOf), auto: !!x.auto, canAct: !!mk[x.key] };
    var travel = x.key === 'exit_reentry' || x.key === 'ticket';
    if (x.note && (travel ? seeTravel : x.key === 'leave_salary' ? seeMoney : seeWork)) v.note = x.note;
    if (x.key === 'handover' && seeWork) v.data = { substitute: d.substituteId ? empCard_(ctx.emps[d.substituteId]) : null, notes: d.notes || '' };
    if (x.key === 'delegation' && (self || hr || mgr)) v.data = { delegate: d.delegateId ? empCard_(ctx.emps[d.delegateId]) : null, delegationRef: d.delegationRef || '' };
    if (x.key === 'exit_reentry' && seeTravel) v.data = { visaNo: d.visaNo || '', validUntil: d.validUntil || '', kind: d.kind || '', request: o.gov ? o.gov[c.id] || null : null };
    if (x.key === 'ticket' && seeTravel) v.data = { right: d.right || null, bookingRef: d.bookingRef || '', route: d.route || '' };
    if (x.key === 'leave_salary' && seeMoney) v.data = { amount: d.amount || null, month: d.month || '', adjRef: d.adjRef || '', suggested: pay && !self && x.status === 'open' ? lcPaySuggest_(emp, c) : null };
    if (x.key === 'custody' && (self || hr || mgr)) v.data = { held: o.assets ? (o.assets[c.empId] || []) : [], note: d.note || '' };
    return v;
  });
  var notClosed = state !== 'closed' && state !== 'cancelled', canMgr = !self && (lcIsOwner_(me, 'manager', c, emp, ctx) || hr);
  var steps = [
    { key: 'depart', status: c.departedOn ? 'done' : 'open', date: c.departedOn ? String(c.departedOn).slice(0, 10) : '', by: lcName_(ctx, c.departedBy), due: c.fromDate,
      canAct: open && !c.departedOn && !c.returnedOn && t >= c.fromDate && ((self && lcCleared_(tasks)) || (hr && !self)) },
    { key: 'return', status: c.returnedOn ? 'done' : 'open', date: c.returnedOn ? String(c.returnedOn).slice(0, 10) : '', due: back, canAct: open && self && !c.returnedOn && t > c.fromDate },
    { key: 'confirm', status: c.returnConfirmedOn ? 'done' : 'open', date: c.returnConfirmedOn ? String(c.returnConfirmedOn).slice(0, 10) : '', by: lcName_(ctx, c.returnConfirmedBy),
      canAct: notClosed && canMgr && !c.returnConfirmedOn && (!!c.returnedOn || t > c.fromDate) }
  ];
  var req = tasks.filter(function (x) { return x.required; }), done = req.filter(function (x) { return x.status === 'done' || x.status === 'na'; }).length;
  var overdue = state === 'overdue_return' ? lcWorkdays_(emp, back, addDays_(t, -1), o.s, o.hol) : 0;
  var a80 = parseJson_(c.art80Json, null);
  if (!a80 && overdue) a80 = lcArt80_(c.empId, o.cycles || [], overdue, c.id), a80.provisional = true;
  return { id: c.id, ref: c.ref, requestId: c.requestId, requestRef: c.requestRef, emp: empCard_(emp), subtype: c.subtype, fromDate: String(c.fromDate).slice(0, 10),
    toDate: String(c.toDate).slice(0, 10), days: Number(c.days) || 0, status: state, backOn: back, departedOn: c.departedOn ? String(c.departedOn).slice(0, 10) : '',
    returnedOn: c.returnedOn ? String(c.returnedOn).slice(0, 10) : '', returnConfirmedOn: c.returnConfirmedOn ? String(c.returnConfirmedOn).slice(0, 10) : '',
    outcome: c.outcome || '', earlyDays: c.earlyDays === '' ? null : Number(c.earlyDays), lateDays: c.lateDays === '' ? null : Number(c.lateDays), extensionRef: c.extensionRef || '',
    substitute: c.substituteId ? empCard_(ctx.emps[c.substituteId]) : null, isSaudi: seeTravel ? bool_(emp.isSaudi) : null,
    tasks: vt, steps: steps, required: req.length, done: done, cleared: lcCleared_(tasks), mine: mine.length, overdueDays: overdue,
    art80: (hr || mgr) && a80 ? a80 : null, role: self ? 'employee' : sub ? 'substitute' : hr ? 'hr' : mgr ? 'manager' : 'payroll',
    history: seeWork || pay ? parseJson_(c.historyJson, []).map(function (h) { return { at: h.at, by: lcName_(ctx, h.by), action: h.action, key: h.key || '', note: seeWork ? h.note || '' : '', onBehalfOf: lcName_(ctx, h.onBehalfOf) }; }) : [],
    createdAt: c.createdAt };
}
/** One read of what a cycle view needs beyond the cycle itself. */
function lcViewCtx_(ctx) {
  var conf = lcConf_(), assets = {}, byId = {}, gov = {}, cycles = readAll_(SHEETS.LCYC);
  readAll_(SHEETS.ASSET).forEach(function (a) { byId[a.id] = a; });
  readAll_(SHEETS.CUST).forEach(function (x) { if (x.status !== 'held') return; var a = byId[x.assetId] || {}; (assets[x.empId] = assets[x.empId] || []).push({ ref: a.ref || '', type: a.type || '', nameAr: a.nameAr || '', serial: a.serial || '' }); });
  // The exit and re-entry request and visa (GovServices.gs) for this leave, linked by leaveRef or by the dates, shown beside the task.
  var reqs = readAll_(SHEETS.REQ).filter(function (r) { return r.type === 'exit_reentry' && (r.status === 'pending' || r.status === 'approved'); });
  var visas = readAll_(SHEETS.GOV_VISA).filter(function (v) { return v.kind === 'exit_reentry' && v.status !== 'cancelled'; });
  var over = function (a1, a2, c) { return !(String(a2).slice(0, 10) < String(c.fromDate).slice(0, 10) || String(a1).slice(0, 10) > String(c.toDate).slice(0, 10)); };
  cycles.forEach(function (c) {
    var hit = reqs.filter(function (r) { return r.empId === c.empId && (parsePayload_(r).leaveRef === c.requestRef || over(r.fromDate, r.toDate, c)); })[0];
    var v = visas.filter(function (x) { return x.empId === c.empId && (x.linkRef === c.requestRef || (hit && x.requestId === hit.id) || over(x.travelFrom, x.travelTo, c)); })[0];
    if (hit || v) gov[c.id] = { ref: hit ? hit.ref : v.ref, status: hit ? hit.status : '', visaStatus: v ? v.status : '', visaNo: v ? String(v.visaNo || '') : '', expiry: v ? String(v.expiry || '').slice(0, 10) : '' };
  });
  return { s: conf.s, conf: conf, hol: holidayMap_(), assets: assets, gov: gov, cycles: cycles };
}

// ---------------- reading cycles ----------------

/** HR all, payroll all (pay tasks), managers their people, everyone their own and the cycles they cover as substitute. */
function api_leaveCycleList(req, me) {
  var ctx = orgCtx_(), o = lcViewCtx_(ctx), t = today_(), want = String(req.status || 'open');
  var rows = o.cycles.slice().sort(function (a, b) { return String(a.fromDate) < String(b.fromDate) ? 1 : -1; }).map(function (c) { return lcView_(c, me, ctx, o); }).filter(Boolean);
  var all = rows;
  if (want === 'open') rows = rows.filter(function (v) { return v.status !== 'closed' && v.status !== 'cancelled'; });
  else if (want !== 'all') rows = rows.filter(function (v) { return v.status === want; });
  var by = {}, overdueTasks = 0, art80 = 0, outNow = 0, backWeek = 0, week = addDays_(t, 7);
  all.forEach(function (v) {
    by[v.status] = (by[v.status] || 0) + 1;
    if (v.status === 'departed' || v.status === 'overdue_return') outNow++;
    if ((v.status === 'departed' || v.status === 'cleared' || v.status === 'clearing' || v.status === 'approved') && v.backOn >= t && v.backOn <= week) backWeek++;
    if (v.art80 && v.art80.flagged) art80++;
    if (v.status !== 'closed' && v.status !== 'cancelled' && !v.departedOn) v.tasks.forEach(function (x) { if (x.required && x.status === 'open' && x.due < t) overdueTasks++; });
  });
  // HR: approved leaves not over yet with no live cycle (shorter than the threshold, or approved before this module)
  var openable = [];
  if (isHr_(me)) {
    var has = {};
    o.cycles.forEach(function (c) { if (c.status !== 'cancelled') has[c.requestId] = 1; });
    openable = readAll_(SHEETS.REQ).filter(function (r) { return r.type === 'leave' && r.status === 'approved' && !has[r.id] && r.empId !== me.id && String(r.toDate).slice(0, 10) >= t && ctx.emps[r.empId]; })
      .sort(function (a, b) { return String(a.fromDate) < String(b.fromDate) ? -1 : 1; }).slice(0, 200)
      .map(function (r) { return { id: r.id, ref: r.ref, emp: empCard_(ctx.emps[r.empId]), fromDate: String(r.fromDate).slice(0, 10), toDate: String(r.toDate).slice(0, 10), days: Number(r.days) || 0 }; });
  }
  return { ok: true, rows: rows.slice(0, 300), stats: { byStatus: by, outNow: outNow, returningWeek: backWeek, overdueTasks: overdueTasks, art80: art80, total: all.length },
    minDays: o.conf.minDays, canOpen: isHr_(me), openable: openable };
}
/** The signed-in person's own cycles, the cycles they cover as substitute, and (when they must name one) colleagues to choose from. */
function api_myLeaveCycles(req, me) {
  var ctx = orgCtx_(), o = lcViewCtx_(ctx), since = addDays_(today_(), -45);
  var keep = function (c) { return c.status !== 'cancelled' && (c.status !== 'closed' || String(c.closedAt).slice(0, 10) >= since); };
  var mine = o.cycles.filter(function (c) { return c.empId === me.id && keep(c); }).map(function (c) { return lcView_(c, me, ctx, o); }).filter(Boolean);
  var covering = o.cycles.filter(function (c) { return c.substituteId === me.id && c.empId !== me.id && keep(c); }).map(function (c) { return lcView_(c, me, ctx, o); }).filter(Boolean);
  var needPeople = mine.some(function (v) { return v.tasks.some(function (x) { return x.canAct && (x.key === 'handover' || x.key === 'delegation'); }); });
  var me2 = ctx.emps[me.id] || me;
  var people = needPeople ? Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active' && e.id !== me.id; })
    .map(function (e) { return { id: e.id, name: e.name, empNo: String(e.empNo), same: !!me2.departmentId && e.departmentId === me2.departmentId }; })
    .sort(function (a, b) { return (b.same ? 1 : 0) - (a.same ? 1 : 0) || String(a.name).localeCompare(String(b.name), 'ar'); }) : [];
  return { ok: true, mine: mine, covering: covering, people: people };
}

// ---------------- acting on a cycle ----------------

function lcLoad_(id) {
  var c = findBy_(SHEETS.LCYC, 'id', id);
  if (!c || c.status === 'cancelled') fail_('not_found');
  return c;
}
function lcSave_(c, me, ctx, entry) {
  var now = new Date().toISOString(), h = parseJson_(c.historyJson, []);
  if (entry) { entry.at = now; entry.by = me.id; h.push(entry); }
  var emp = ctx.emps[c.empId], conf = lcConf_(), back = lcBackOn_(emp, c.toDate, conf.s, holidayMap_());
  var st = lcState_(c, lcLive_(c, emp), back, today_());
  if (c.status !== 'closed' && c.status !== 'cancelled') c.status = st === 'overdue_return' ? 'departed' : st; // overdue is a live state
  c.historyJson = JSON.stringify(h.slice(-80)); c.updatedAt = now;
  update_(SHEETS.LCYC, c);
}
/** Shortens or moves the approved request (early return, later departure): the balance and attendance follow its days. */
function lcAdjustRequest_(c, emp, from, to, kind, info) {
  var r = findBy_(SHEETS.REQ, 'id', c.requestId);
  if (!r || r.status !== 'approved') return null;
  var cnt = countLeaveDays_(emp, r.subtype, from, to, holidayMap_(), settings_()), fx = parseJson_(r.effectJson, {});
  info.daysBefore = Number(r.days) || 0; info.daysAfter = cnt.days;
  fx[kind] = info; fx.calendarDays = cnt.calendarDays;
  r.fromDate = from; r.toDate = to; r.days = cnt.days; r.effectJson = JSON.stringify(fx); r.updatedAt = new Date().toISOString();
  update_(SHEETS.REQ, r);
  return info;
}

/**
 * Tick a task. op: done | na (not applicable, note needed) | accept / decline (the substitute). The field is `op`, never
 * `action`: `action` is the dispatcher's own key (Code.gs handle_), so a payload field of that name replaces the endpoint. data per task:
 * handover {substituteId, notes}; delegation {delegateId}; exit_reentry {visaNo, validUntil, kind}; ticket {entitlement?, bookingRef, route};
 * leave_salary {amount, month}; custody {note}.
 */
function api_leaveCycleTask(req, me) {
  var key = String(req.key || ''), action = ['done', 'na', 'accept', 'decline'].indexOf(req.op) >= 0 ? req.op : 'done', d = req.data || {}, note = str_(req.note, 500);
  var pre = null;
  if (key === 'delegation' && action === 'done') pre = lcDelegate_(req, me, d); // the delegation takes its own lock (Compliance.gs)
  return withLock_(function () {
    var c = lcLoad_(req.id), ctx = orgCtx_(), emp = ctx.emps[c.empId];
    if (!emp) fail_('not_found');
    if (c.departedOn || c.returnedOn || c.status === 'closed') fail_('bad_state');
    var tasks = parseJson_(c.tasksJson, []), x = tasks.filter(function (k) { return k.key === key; })[0];
    if (!x) fail_('bad_value');
    if (!lcIsOwner_(me, x.owner, c, emp, ctx)) fail_('forbidden');
    if (x.status === 'waiting') fail_('bad_state');
    if (x.status === 'done' || x.status === 'na') fail_('already_done');
    var lx = lcLive_(c, emp).filter(function (k) { return k.key === key; })[0];
    if (lx && lx.auto && lx.status === 'na') fail_('already_done'); // custody with nothing held: not applicable, nothing to tick
    var now = new Date().toISOString(), onBehalf = '';
    if (x.owner === 'manager' && !manages_(me, emp, ctx) && !isHr_(me)) { var dg = delegatedFor_(me, emp, ctx); onBehalf = dg ? dg.fromEmpId : ''; }
    var acc = tasks.filter(function (k) { return k.key === 'handover_accept'; })[0];
    if (key === 'handover_accept') {
      if (action !== 'accept' && action !== 'decline') fail_('bad_value');
      if (action === 'decline') {
        if (!note) fail_('note_required');
        var ho = tasks.filter(function (k) { return k.key === 'handover'; })[0];
        ho.status = 'open'; ho.by = ''; ho.at = ''; ho.since = now; ho.note = 'declined: ' + note;
        x.status = 'waiting'; x.since = ''; c.substituteId = '';
      } else { x.status = 'done'; x.by = me.id; x.at = now; x.note = note; }
    } else if (action === 'na') {
      if (!note) fail_('note_required');
      if (key === 'leave_salary' && emp.id === me.id) fail_('cannot_change_own_salary');
      x.status = 'na'; x.by = me.id; x.at = now; x.note = note; x.onBehalfOf = onBehalf;
      if (key === 'handover' && acc) { acc.status = 'na'; acc.note = 'no_handover'; }
    } else if (action !== 'done') fail_('bad_value');
    else {
      if (key === 'handover') {
        var sub = ctx.emps[d.substituteId], notes = str_(d.notes, 1000);
        if (!sub || sub.status !== 'active' || sub.id === emp.id) fail_('bad_substitute');
        if (notes.length < 3) fail_('missing_fields');
        x.data = { substituteId: sub.id, notes: notes }; c.substituteId = sub.id;
        if (acc) { acc.status = 'open'; acc.since = now; acc.by = ''; acc.at = ''; }
      } else if (key === 'custody') {
        x.data = { note: note, held: lcHeld_(c.empId).length };
      } else if (key === 'delegation') {
        x.data = { delegateId: pre.delegateId, delegationRef: pre.ref };
      } else if (key === 'exit_reentry') {
        var gv = d.visaNo ? null : readAll_(SHEETS.GOV_VISA).filter(function (v) { return v.kind === 'exit_reentry' && v.empId === emp.id && v.status === 'issued' && (v.linkRef === c.requestRef || !(String(v.travelTo).slice(0, 10) < c.fromDate || String(v.travelFrom).slice(0, 10) > c.toDate)); })[0];
        if (gv) { d.visaNo = gv.visaNo; d.validUntil = String(gv.expiry).slice(0, 10); } // the visa HR recorded from Muqeem (GovServices.gs)
        var vn = str_(d.visaNo, 30).replace(/\s+/g, ''), vu = isoDate_(d.validUntil);
        if (!/^[0-9A-Za-z-]{4,30}$/.test(vn)) fail_('bad_visa');
        if (!vu) fail_('bad_date');
        if (vu < lcBackOn_(emp, c.toDate, settings_(), holidayMap_())) fail_('visa_before_return');
        x.data = { visaNo: vn, validUntil: vu, kind: d.kind === 'multiple' ? 'multiple' : 'single' };
      } else if (key === 'ticket') {
        var br = str_(d.bookingRef, 40);
        if (br.length < 3) fail_('missing_fields');
        x.data = { right: lcTicketRight_(emp.id), bookingRef: br, route: str_(d.route, 80) };
      } else if (key === 'leave_salary') {
        if (emp.id === me.id) fail_('cannot_change_own_salary');
        var amount = num_(d.amount), month = /^\d{4}-\d{2}$/.test(String(d.month || '')) ? String(d.month) : lcNextMonth_(emp.id);
        var cap = lcPaySuggest_(emp, c);
        if (!(amount > 0)) fail_('bad_amount');
        if (cap && amount > round2_(cap * 1.0001)) fail_('advance_too_large');
        if (monthLocked_(emp.id, month)) fail_('month_locked');
        var adj = { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: emp.id, month: month, kind: 'earning', code: 'other_earning',
          amount: round2_(amount), reason: 'راتب إجازة مقدم ' + c.ref + ' (' + c.requestRef + ')', enteredBy: me.id, status: 'active', createdAt: now };
        append_(SHEETS.ADJ, adj);
        audit_(me.id, 'payroll_adjustment', emp.id, { ref: adj.ref, code: adj.code, amount: adj.amount, month: month, cycle: c.ref });
        x.data = { amount: adj.amount, month: month, adjRef: adj.ref };
      }
      if (x.status !== 'na') { x.status = 'done'; x.by = me.id; x.at = now; x.note = note; x.onBehalfOf = onBehalf; }
    }
    c.tasksJson = JSON.stringify(tasks);
    lcSave_(c, me, ctx, { action: action, key: key, note: note, onBehalfOf: onBehalf });
    audit_(me.id, 'leave_cycle_task', c.empId, { ref: c.ref, key: key, action: action, onBehalfOf: onBehalf || undefined });
    var vc = lcViewCtx_(ctx);
    if (action === 'decline') vc.viewAsSub = me.id; // the one who just declined sees the result once (they are no longer the substitute)
    return { ok: true, cycle: lcView_(c, me, ctx, vc) };
  });
}
/** The leaver (a manager) hands their approvals to someone for the leave dates; an existing delegation that covers them counts. */
function lcDelegate_(req, me, d) {
  var c = lcLoad_(req.id), ctx = orgCtx_(), emp = ctx.emps[c.empId];
  if (!emp || me.id !== c.empId) fail_('forbidden');
  var t = today_(), from = maxDate_(String(c.fromDate).slice(0, 10), t), to = minDate_(String(c.toDate).slice(0, 10), addDays_(from, 60));
  var have = readAll_(SHEETS.DLG).filter(function (g) { return g.fromEmpId === me.id && g.status === 'active' && String(g.fromDate).slice(0, 10) <= from && String(g.toDate).slice(0, 10) >= to; })[0];
  if (have) return { ref: have.ref, delegateId: have.toEmpId };
  var to2 = d.delegateId || c.substituteId;
  if (!to2) fail_('missing_fields');
  var r = api_delegationSave({ delegation: { toEmpId: to2, fromDate: from, toDate: to, reason: 'إجازة ' + c.ref } }, me);
  return { ref: r.delegation.ref, delegateId: to2 };
}

/** The employee (cleared) or HR confirms the actual departure date. Leaving later than planned gives those days back. */
function api_leaveCycleDepart(req, me) {
  return withLock_(function () {
    var c = lcLoad_(req.id), ctx = orgCtx_(), emp = ctx.emps[c.empId], t = today_(), note = str_(req.note, 500);
    if (!emp) fail_('not_found');
    var self = me.id === c.empId;
    if (!self && !isHr_(me)) fail_('forbidden');
    if (c.departedOn || c.returnedOn || c.status === 'closed') fail_('already_done');
    var date = isoDate_(req.date) || t, from = String(c.fromDate).slice(0, 10), to = String(c.toDate).slice(0, 10);
    if (date < from || date > to || date > t) fail_('bad_date');
    var cleared = lcCleared_(lcLive_(c, emp));
    if (!cleared && self) fail_('clearance_incomplete');
    if (!cleared && !note) fail_('note_required'); // HR lets someone leave before the clearance is complete: say why
    var info = null;
    if (date > from) info = lcAdjustRequest_(c, emp, date, to, 'lateDeparture', { plannedFrom: from, departedOn: date });
    c.departedOn = date; c.departedBy = me.id; if (info) c.days = info.daysAfter;
    lcSave_(c, me, ctx, { action: 'departed', key: date, note: note || (cleared ? '' : 'not_cleared') });
    audit_(me.id, 'leave_cycle_depart', c.empId, { ref: c.ref, date: date, cleared: cleared });
    return { ok: true, cycle: lcView_(c, me, ctx, lcViewCtx_(ctx)) };
  });
}

/** The employee records their first day back. */
function api_leaveCycleReturn(req, me) {
  return withLock_(function () {
    var c = lcLoad_(req.id), ctx = orgCtx_(), t = today_();
    if (me.id !== c.empId) fail_('forbidden');
    if (c.returnedOn || c.status === 'closed') fail_('already_done');
    var date = isoDate_(req.date) || t;
    if (date <= String(c.fromDate).slice(0, 10) || date > t) fail_('bad_date');
    if (!c.departedOn) c.departedOn = String(c.fromDate).slice(0, 10); // never recorded: it began as planned
    c.returnedOn = date; c.returnRecordedAt = new Date().toISOString();
    lcSave_(c, me, ctx, { action: 'returned', key: date, note: str_(req.note, 300) });
    audit_(me.id, 'leave_cycle_return', c.empId, { ref: c.ref, date: date });
    return { ok: true, cycle: lcView_(c, me, ctx, lcViewCtx_(ctx)) };
  });
}

/**
 * The manager (or HR, never the employee) confirms the actual return date and closes the cycle.
 * Early: the unused days go back. Late: outcome 'absence' or 'extension' (extensionType annual | unpaid: a new leave request).
 */
function api_leaveCycleConfirm(req, me) {
  var made = withLock_(function () {
    var c = lcLoad_(req.id), ctx = orgCtx_(), emp = ctx.emps[c.empId], t = today_(), s = settings_(), hol = holidayMap_();
    if (!emp) fail_('not_found');
    if (me.id === c.empId) fail_('cannot_decide_own');
    if (!lcIsOwner_(me, 'manager', c, emp, ctx) && !isHr_(me)) fail_('forbidden');
    if (c.returnConfirmedOn || c.status === 'closed') fail_('already_done');
    var date = isoDate_(req.date) || (c.returnedOn ? String(c.returnedOn).slice(0, 10) : '');
    var from = String(c.departedOn || c.fromDate).slice(0, 10), to = String(c.toDate).slice(0, 10), back = lcBackOn_(emp, to, s, hol);
    if (!date || date <= from || date > t) fail_('bad_date');
    var note = str_(req.note, 500), entry = { action: 'confirmed', key: date, note: note }, ext = null;
    if (!c.departedOn) c.departedOn = from;
    if (!c.returnedOn) c.returnedOn = date;
    if (date < back) { // early: the days not taken go back to the balance
      var before = Number(c.days) || 0, info = lcAdjustRequest_(c, emp, String(c.departedOn).slice(0, 10), addDays_(date, -1), 'earlyReturn', { plannedTo: to, returnedOn: date });
      c.outcome = 'early'; c.earlyDays = info ? round2_(info.daysBefore - info.daysAfter) : 0; c.lateDays = 0; if (info) c.days = info.daysAfter;
      entry.outcome = 'early';
      if (!info) c.earlyDays = before ? 0 : 0;
    } else if (date === back) { c.outcome = 'on_time'; c.earlyDays = 0; c.lateDays = 0; entry.outcome = 'on_time'; }
    else { // late: the working days missed are absence, or an extension through a new leave request
      var late = lcWorkdays_(emp, back, addDays_(date, -1), s, hol), outcome = req.outcome === 'absence' || req.outcome === 'extension' ? req.outcome : '';
      if (!outcome) fail_('late_outcome_required');
      c.lateDays = late; c.earlyDays = 0; c.outcome = outcome; entry.outcome = outcome;
      if (outcome === 'absence') {
        var a = lcArt80_(c.empId, readAll_(SHEETS.LCYC), late, c.id);
        c.art80Json = JSON.stringify(a);
        if (a.flagged) audit_(me.id, 'art80_flag', c.empId, { ref: c.ref, consecutive: a.consecutive, yearTotal: a.yearTotal });
      } else {
        ext = lcExtension_(c, emp, ctx, me, back, addDays_(date, -1), req.extensionType === 'unpaid' ? 'unpaid' : 'annual', note);
        c.extensionRef = ext.ref; entry.extension = ext.ref;
      }
    }
    c.returnConfirmedOn = date; c.returnConfirmedBy = me.id; c.status = 'closed'; c.closedAt = new Date().toISOString();
    lcSave_(c, me, ctx, entry);
    audit_(me.id, 'leave_cycle_confirm', c.empId, { ref: c.ref, date: date, outcome: c.outcome, early: c.earlyDays, late: c.lateDays, extension: c.extensionRef || undefined });
    return { c: c, ext: ext };
  });
  // The one who decided the extension also takes its first step when they may (outside the lock: reqDecide takes its own).
  if (made.ext) {
    var ctx2 = orgCtx_(), r = findBy_(SHEETS.REQ, 'id', made.ext.id), emp2 = ctx2.emps[made.c.empId];
    if (r && canAct_(me, r, emp2, ctx2)) { try { api_reqDecide({ id: r.id, decision: 'approve', note: 'تمديد بعد العودة المتأخرة ' + made.c.ref }, me); } catch (e) { /* stays pending for the chain */ } }
  }
  var ctx3 = orgCtx_();
  return { ok: true, cycle: lcView_(findBy_(SHEETS.LCYC, 'id', made.c.id), me, ctx3, lcViewCtx_(ctx3)), extension: made.ext ? made.ext.ref : '' };
}
/** A leave request for the days missed after a late return, made by the manager or HR for the employee, through the normal chain. */
function lcExtension_(c, emp, ctx, me, from, to, subtype, note) {
  var q = quote_(emp, { type: 'leave', subtype: subtype, fromDate: from, toDate: to, payload: { extensionOf: c.ref }, _recheck: true }, null);
  if (q.error) fail_(q.error === 'no_working_days' ? 'bad_date' : q.error);
  var plan = flowPlan_('leave', emp, q, ctx), steps = plan ? plan.steps.map(function (s) { return s.key; }) : stepsFor_('leave', emp, ctx), now = new Date().toISOString();
  var row = { id: newId_('R'), ref: nextRef_('leave', refsOf_(SHEETS.REQ)), empId: emp.id, type: 'leave', subtype: subtype, fromDate: q.fromDate, toDate: q.toDate, days: q.days,
    amount: '', months: '', payloadJson: JSON.stringify({ extensionOf: c.ref, requestedBy: me.id }), reason: 'تمديد بعد العودة المتأخرة ' + c.ref + (note ? ': ' + note : ''), docNo: '',
    status: 'pending', step: steps[0], stepsJson: '[]', effectJson: JSON.stringify({ warnings: q.warnings, holidays: q.holidays || [], calendarDays: q.calendarDays || null, extensionOf: c.ref }),
    createdAt: now, updatedAt: now, decidedAt: '', flowJson: plan ? JSON.stringify(plan) : '' };
  append_(SHEETS.REQ, row);
  audit_(me.id, 'request_create', emp.id, { ref: row.ref, type: 'leave', subtype: subtype, extensionOf: c.ref, onBehalf: true });
  return { id: row.id, ref: row.ref };
}

/** HR opens a cycle by hand for an approved leave (shorter than the threshold, or approved before this module). */
function api_leaveCycleOpen(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var r = findBy_(SHEETS.REQ, 'id', req.requestId), ctx = orgCtx_();
    if (!r || r.type !== 'leave' || r.status !== 'approved') fail_('not_found');
    if (r.empId === me.id) fail_('forbidden');
    if (String(r.toDate).slice(0, 10) < today_()) fail_('bad_date');
    var row = lcOpen_(r, ctx.emps[r.empId], me.id, ctx);
    if (!row) fail_('already_exists');
    audit_(me.id, 'leave_cycle_open', r.empId, { ref: row.ref, request: r.ref, manual: true });
    return { ok: true, cycle: lcView_(row, me, ctx, lcViewCtx_(ctx)) };
  });
}

/** myTasks (Compliance.gs): leave-cycle actions due within 14 days, and escalated approvals the viewer cannot act on. */
function lcMyTasks_(me, ctx, out, add) {
  var conf = lcConf_(), hol = holidayMap_(), t = today_(), soon = addDays_(t, 14), sec = 0, mine = 0;
  readAll_(SHEETS.LCYC).forEach(function (c) {
    if (c.status === 'closed' || c.status === 'cancelled') return;
    var emp = ctx.emps[c.empId];
    if (!emp) return;
    lcMine_(c, lcLive_(c, emp), me, emp, ctx, t, lcBackOn_(emp, c.toDate, conf.s, hol)).forEach(function (a) {
      if (a.kind === 'task' && a.due > soon) return;
      if (a.owner === 'employee' || a.owner === 'substitute') mine++; else sec++;
    });
  });
  var seeSec = isHr_(me) || hasRole_(me, 'payroll') || managesAnyone_(me, ctx); // the client shows the section to hr, payroll and managers
  add('leavecycle', sec, seeSec ? { tab: 'hr', sec: 'leavecycle' } : { tab: 'hr', sec: 'approvalcentre' });
  add('leavecycle_me', mine, { tab: 'file' });
  if (seeSec) add('escalated', apItems_(me, ctx).filter(function (x) { return x.escalated && !x.canAct; }).length, { tab: 'hr', sec: 'approvalcentre' });
}

// ---------------- approval flows (configurable chains) ----------------

var FLOW_KINDS = { manager: 1, dept_head: 1, hr: 1, payroll: 1, executive: 1, person: 1 };
function flowTypes_() { return Object.keys(REQUEST_STEPS); }
function flowRows_(type) { return readAll_(SHEETS.FLOW).filter(function (f) { return f.type === type; }).sort(function (a, b) { return Number(b.version) - Number(a.version); }); }
/** The latest version of a type's flow; status 'default' means "back to the built-in chain". */
function flowActive_(type) { var f = flowRows_(type)[0]; return f && f.status === 'active' ? f : null; }
function flowInDept_(emp, deptId, ctx) {
  for (var d = ctx.depts[emp.departmentId], i = 0; d && i < 25; d = ctx.depts[d.parentId], i++) if (d.id === deptId) return true;
  return false;
}
function flowWhen_(w, emp, q, ctx) {
  if (!w) return true;
  if (w.amountOver != null && !(Number(q.amount) > Number(w.amountOver))) return false;
  if (w.daysOver != null && !(Number(q.days) > Number(w.daysOver))) return false;
  if (w.departmentId && !flowInDept_(emp, w.departmentId, ctx)) return false;
  if (w.saudi === 'saudi' && !bool_(emp.isSaudi)) return false;
  if (w.saudi === 'non_saudi' && bool_(emp.isSaudi)) return false;
  return true;
}
/**
 * The steps a new request takes under the configured flow, or null for the built-in chain. A step whose approver is missing,
 * inactive or the requester is skipped; one person never holds two steps (they could act on only one); none left = HR.
 */
function flowPlan_(type, emp, q, ctx) {
  var f = flowActive_(type);
  if (!f) return null;
  var out = [], seen = {}, people = {};
  parseJson_(f.stepsJson, []).forEach(function (st) {
    if (!flowWhen_(st.when, emp, q, ctx)) return;
    var key = st.kind, who = '';
    if (st.kind === 'manager') { var m = ctx.emps[emp.managerId]; if (!m || m.status !== 'active' || m.id === emp.id) return; who = m.id; }
    else if (st.kind === 'dept_head') { var h = headFor_(emp, ctx); if (!h || h.status !== 'active' || h.id === emp.id) return; who = h.id; }
    else if (st.kind === 'person') { var p = ctx.emps[st.personId]; if (!p || p.status !== 'active' || p.id === emp.id) return; who = p.id; key = 'person:' + p.id; }
    if (seen[key] || (who && people[who])) return;
    seen[key] = 1; if (who) people[who] = 1;
    out.push({ key: key, sla: Number(st.slaHours) > 0 ? Number(st.slaHours) : null });
  });
  if (!out.length) out.push({ key: 'hr', sla: null });
  return { flowId: f.id, ref: f.ref, version: Number(f.version), steps: out };
}
/** Leave.gs stepsFor_: the steps fixed on a request made under a configured flow, or null. */
function flowSteps_(r) {
  var p = parseJson_(r.flowJson, null);
  return p && p.steps && p.steps.length ? p.steps.map(function (s) { return s.key; }) : null;
}
function flowDelegFrom_(me, fromId) {
  var t = today_(), hit = null;
  readAll_(SHEETS.DLG).some(function (d) {
    if (d.status === 'active' && d.toEmpId === me.id && d.fromEmpId === fromId && String(d.fromDate).slice(0, 10) <= t && String(d.toDate).slice(0, 10) >= t) { hit = d; return true; }
    return false;
  });
  return hit;
}
/** Leave.gs canAct_ for configured steps: the department head (or HR on behalf, or the head's delegate); a named person (or their delegate). */
function flowCanAct_(me, r, emp, ctx) {
  var st = String(r.step || '');
  if (st === 'dept_head') { var h = headFor_(emp, ctx); return !!h && (h.id === me.id || isHr_(me) || !!flowDelegFrom_(me, h.id)); }
  if (st.indexOf('person:') === 0) { var pid = st.slice(7); return me.id === pid || !!flowDelegFrom_(me, pid); }
  return false;
}
/** Leave.gs api_reqDecide: in what capacity the decider acts (the step, a delegate on behalf of the approver, or HR on behalf). */
function flowActor_(me, r, emp, ctx) {
  var st = String(r.step || '');
  if (st === 'manager') {
    var mg = manages_(me, emp, ctx), dg = !mg && !isHr_(me) ? delegatedFor_(me, emp, ctx) : null;
    return { role: dg ? 'delegate' : !mg ? 'hr_on_behalf' : 'manager', onBehalfOf: dg ? dg.fromEmpId : '' };
  }
  var pid = st === 'dept_head' ? (headFor_(emp, ctx) || {}).id || '' : st.indexOf('person:') === 0 ? st.slice(7) : '';
  if (pid) {
    if (me.id === pid) return { role: st === 'dept_head' ? 'dept_head' : 'person', onBehalfOf: '' };
    if (st === 'dept_head' && isHr_(me)) return { role: 'hr_on_behalf', onBehalfOf: pid };
    return { role: 'delegate', onBehalfOf: flowDelegFrom_(me, pid) ? pid : '' };
  }
  return { role: st, onBehalfOf: '' };
}
function flowPublic_(f, ctx) {
  return { id: f.id, ref: f.ref, type: f.type, version: Number(f.version), status: f.status, note: f.note, createdBy: lcName_(ctx, f.createdBy), createdAt: f.createdAt,
    steps: parseJson_(f.stepsJson, []).map(function (s) { var o = Object.assign({}, s); if (s.personId) o.person = empCard_(ctx.emps[s.personId]); return o; }) };
}
function holdersOf_(role, ctx) { return Object.keys(ctx.emps).filter(function (k) { var e = ctx.emps[k]; return e.status === 'active' && hasRole_(e, role); }).length; }

function api_flowList(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var ctx = orgCtx_(), conf = lcConf_();
  var types = flowTypes_().map(function (type) {
    var rows = flowRows_(type), act = rows[0] && rows[0].status === 'active' ? rows[0] : null;
    return { type: type, builtin: REQUEST_STEPS[type].map(function (k) { return { kind: k }; }), active: act ? flowPublic_(act, ctx) : null,
      versions: rows.slice(0, 20).map(function (f) { return flowPublic_(f, ctx); }) };
  });
  var people = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; })
    .map(function (e) { return { id: e.id, name: e.name, empNo: String(e.empNo) }; }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ar'); });
  var depts = Object.keys(ctx.depts).map(function (k) { var d = ctx.depts[k]; return { id: d.id, nameAr: d.nameAr, nameEn: d.nameEn }; }).filter(function (d) { return ctx.depts[d.id].status !== 'inactive'; });
  return { ok: true, types: types, settings: { approvalSlaHours: conf.slaHours, leaveClearanceMinDays: conf.minDays }, people: people, depts: depts,
    holders: { payroll: holdersOf_('payroll', ctx), executive: holdersOf_('executive', ctx) }, kinds: Object.keys(FLOW_KINDS) };
}

/** Saves a new version of a type's flow (admin and HR). reset: true goes back to the built-in chain (kept as a version too). */
function api_flowSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var type = String(req.type || ''), note = str_(req.note, 300);
  if (!REQUEST_STEPS[type]) fail_('bad_value');
  var ctx = orgCtx_(), steps = [];
  if (!req.reset) {
    var raw = Array.isArray(req.steps) ? req.steps : [];
    if (!raw.length || raw.length > 6) fail_('flow_steps_count');
    raw.forEach(function (s) {
      var kind = String(s && s.kind || '');
      if (!FLOW_KINDS[kind]) fail_('bad_value');
      var st = { kind: kind };
      if (kind === 'person') { var p = ctx.emps[s.personId]; if (!p || p.status !== 'active') fail_('not_found'); st.personId = p.id; }
      if ((kind === 'payroll' || kind === 'executive') && !holdersOf_(kind, ctx)) fail_('flow_no_holder');
      if (type === 'advance' && (kind === 'manager' || kind === 'dept_head')) fail_('flow_step_not_allowed'); // pay: the line never sees the amount
      var sla = Number(s.slaHours);
      if (s.slaHours != null && s.slaHours !== '') { if (!(sla >= 1 && sla <= 720)) fail_('bad_value'); st.slaHours = Math.round(sla); }
      var w = s.when || null, ww = {};
      if (w) {
        if (w.amountOver != null && w.amountOver !== '') { if (type !== 'advance' || !(Number(w.amountOver) >= 0)) fail_('flow_bad_condition'); ww.amountOver = Number(w.amountOver); }
        if (w.daysOver != null && w.daysOver !== '') { if (type !== 'leave' || !(Number(w.daysOver) >= 0)) fail_('flow_bad_condition'); ww.daysOver = Math.round(Number(w.daysOver)); }
        if (w.departmentId) { if (!ctx.depts[w.departmentId]) fail_('flow_bad_condition'); ww.departmentId = w.departmentId; }
        if (w.saudi) { if (w.saudi !== 'saudi' && w.saudi !== 'non_saudi') fail_('flow_bad_condition'); ww.saudi = w.saudi; }
        if (Object.keys(ww).length) st.when = ww;
      }
      steps.push(st);
    });
    if (!steps.some(function (s) { return !s.when; })) fail_('flow_needs_unconditional'); // every request must reach someone
    var keys = {};
    steps.forEach(function (s) { if (s.when) return; var k = s.kind + (s.personId ? ':' + s.personId : ''); if (keys[k]) fail_('flow_duplicate_step'); keys[k] = 1; });
    if (type === 'advance' && !steps.some(function (s) { return s.kind === 'payroll' && !s.when; })) fail_('flow_needs_payroll');
  } else steps = REQUEST_STEPS[type].map(function (k) { return { kind: k }; });
  return withLock_(function () {
    var rows = flowRows_(type), now = new Date().toISOString(), version = rows.length ? Number(rows[0].version) + 1 : 1;
    if (req.reset && !(rows[0] && rows[0].status === 'active')) fail_('bad_state');
    rows.forEach(function (f) { if (f.status === 'active') { f.status = 'superseded'; update_(SHEETS.FLOW, f); } });
    var row = { id: newId_('F'), ref: nextRef_('flow', refsOf_(SHEETS.FLOW)), type: type, version: version, status: req.reset ? 'default' : 'active',
      stepsJson: JSON.stringify(steps), note: note, createdBy: me.id, createdAt: now };
    append_(SHEETS.FLOW, row);
    audit_(me.id, req.reset ? 'flow_reset' : 'flow_save', '', { ref: row.ref, type: type, version: version, steps: steps.map(function (s) { return s.kind; }) });
    return { ok: true, flow: flowPublic_(row, ctx) };
  });
}

/** The two settings of this module, from its own screen (admin and HR). Written as rows of the settings tab. */
function api_flowSettingsSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var val = {}, d = req.settings || {};
  if (d.approvalSlaHours !== undefined) { var h = Number(d.approvalSlaHours); if (!(h >= 1 && h <= 720) || Math.round(h) !== h) return { ok: false, error: 'bad_setting', key: 'approvalSlaHours' }; val.approvalSlaHours = h; }
  if (d.leaveClearanceMinDays !== undefined) { var n = Number(d.leaveClearanceMinDays); if (!(n >= 1 && n <= 365) || Math.round(n) !== n) return { ok: false, error: 'bad_setting', key: 'leaveClearanceMinDays' }; val.leaveClearanceMinDays = n; }
  if (!Object.keys(val).length) fail_('missing_fields');
  return withLock_(function () {
    var rows = readAll_(SHEETS.SET);
    Object.keys(val).forEach(function (k) {
      var r = rows.filter(function (x) { return x.key === k; })[0];
      if (r) { r.value = val[k]; update_(SHEETS.SET, r); } else append_(SHEETS.SET, { key: k, value: val[k] });
    });
    try { CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY); } catch (e) {}
    audit_(me.id, 'settings_save', '', val);
    return { ok: true, settings: val };
  });
}

// ---------------- approvals centre ----------------

var AP_BULK = { request: 1, salary: 1, asset_charge: 1, report: 1, onboarding: 1, expense: 1, gov_fee: 1 };

/** SLA of one item: hours from `since`, or the end of a due date (Riyadh). Escalated after 2x the SLA (or one SLA past the due date). */
function apSla_(sinceIso, hours, dueDate) {
  var now = Date.now(), since = Date.parse(sinceIso) || now, h = hours * 3600000;
  var due = dueDate ? Date.parse(String(dueDate).slice(0, 10) + 'T20:59:59Z') : since + h;
  var t = today_(), dueDay = localParts_(new Date(due)).date, escAt = dueDate ? due + h : since + 2 * h;
  return { since: new Date(since).toISOString(), hours: hours, dueAt: new Date(due).toISOString(), state: now > due ? 'late' : dueDay === t ? 'due_today' : 'on_time',
    escalated: now > escAt, ageDays: Math.max(0, Math.floor((now - since) / 86400000)), pct: Math.max(0, Math.min(200, Math.round((now - since) / Math.max(60000, due - since) * 100))) };
}
function apMgrOf_(id, ctx) { var p = ctx.emps[id], m = p && ctx.emps[p.managerId]; return m && m.status === 'active' && m.id !== id ? m : null; }
/** Is me the next level for an item owned by these people (their managers, or HR) or this role (payroll and executive: HR; HR: admin)? */
function apEscalates_(me, owner, ctx) {
  if (!owner) return false;
  if (owner.people) {
    var ids = owner.people.filter(Boolean);
    if (ids.indexOf(me.id) >= 0) return false;
    var mg = ids.map(function (id) { var m = apMgrOf_(id, ctx); return m ? m.id : ''; }).filter(Boolean);
    if (mg.length) return mg.indexOf(me.id) >= 0;
    return isHr_(me) && (!owner.money || canPayroll_(me));
  }
  if (owner.role === 'hr') return me.role === 'admin';
  return isHr_(me) && (!owner.money || canPayroll_(me));
}
function apReqOwner_(r, emp, ctx) {
  var st = String(r.step || '');
  if (st === 'manager') { var m = ctx.emps[emp.managerId]; return m && m.status === 'active' ? { people: [m.id] } : { role: 'hr' }; }
  if (st === 'dept_head') { var h = headFor_(emp, ctx); return h ? { people: [h.id] } : { role: 'hr' }; }
  if (st.indexOf('person:') === 0) return { people: [st.slice(7)] };
  if (st === 'payroll') return { role: 'payroll', money: true };
  if (st === 'hr') return { role: 'hr', money: r.type === 'advance' };
  return { role: st || 'hr' };
}
function apReqWhat_(r, me) {
  var p = parsePayload_(r), money = me.role === 'hr' || hasRole_(me, 'payroll'), o = { sub: r.type, subtype: r.subtype || '' };
  if (r.fromDate) o.from = String(r.fromDate).slice(0, 10);
  if (r.toDate) o.to = String(r.toDate).slice(0, 10);
  if (r.days !== '' && r.days != null) o.days = Number(r.days);
  if (r.type === 'advance' && money) { o.amount = Number(r.amount); o.months = Number(r.months); }
  if (r.type === 'correction') o.text = (p.date || '') + ' ' + (p.time || '') + ' ' + (p.punchType || '');
  if (r.type === 'resignation') o.to = p.lastDay || o.to;
  if (r.type === 'data_change') o.fields = Object.keys(p.fields || {});
  if (r.type === 'letter') o.subtype = r.subtype;
  return o;
}

/**
 * Everything waiting for me (actor) or escalated to me (next level, after 2x the SLA). Each tab is read once.
 * Item: { key, type, id, task, ref, emp, what, step, sla, canAct, actions, escalated, primary, onBehalfOf, link }.
 */
function apItems_(me, ctx) {
  var conf = lcConf_(), H = conf.slaHours, out = [], t = today_(), soon = addDays_(t, 7);
  var hr = isHr_(me), pay = canPayroll_(me), payH = hasRole_(me, 'payroll'), roleWork = hr || pay || payH;
  var push = function (x) {
    var sla = apSla_(x.since, x.hours || H, x.due), primary = x.actor && x.primary !== false;
    var esc = sla.escalated && !x.maker && !primary && apEscalates_(me, x.owner, ctx);
    if (!x.actor && !esc) return;
    out.push({ key: x.type + ':' + x.id + (x.task ? ':' + x.task : ''), type: x.type, id: x.id, task: x.task || '', ref: x.ref || '', emp: x.emp ? empCard_(x.emp) : null,
      what: x.what || {}, step: x.step || '', sla: sla, canAct: !!x.actor, actions: x.actor ? (x.actions || []) : [], escalated: !!esc, primary: !!primary,
      onBehalfOf: x.onBehalfOf || '', onBehalfRole: x.onBehalfRole || '', link: x.link || null });
  };
  // requests (leave, letters, advances, corrections, data changes, resignations, exit/re-entry)
  readAll_(SHEETS.REQ).forEach(function (r) {
    if (r.status !== 'pending' || r.empId === me.id) return;
    var emp = ctx.emps[r.empId];
    if (!emp) return;
    var h = history_(r);
    if (h.some(function (x) { return x.by === me.id; })) return; // never two steps of one request
    var can = canAct_(me, r, emp, ctx), ow = apReqOwner_(r, emp, ctx), plan = parseJson_(r.flowJson, null);
    var sd = plan && plan.steps ? plan.steps.filter(function (s) { return s.key === r.step; })[0] : null;
    var prim = can, beh = '', behRole = '';
    if (can && ow.people) {
      var dg = ow.people.map(function (pid) { return pid === me.id ? null : (flowDelegFrom_(me, pid) ? pid : null); }).filter(Boolean)[0];
      if (!dg && r.step === 'manager') { var d2 = delegatedFor_(me, emp, ctx); if (d2 && !manages_(me, emp, ctx) && !isHr_(me)) dg = d2.fromEmpId; }
      prim = ow.people.indexOf(me.id) >= 0 || !!dg;
      if (dg) beh = lcName_(ctx, dg); else if (!prim && isHr_(me)) behRole = 'hr';
    }
    push({ type: 'request', id: r.id, ref: r.ref, emp: emp, step: r.step, since: h.length ? h[h.length - 1].at : r.createdAt, hours: sd && sd.sla, actor: can, owner: ow, primary: prim,
      onBehalfOf: beh, onBehalfRole: behRole, actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'inbox' }, what: apReqWhat_(r, me) });
  });
  // expense claims (Expenses.gs): the line manager (a delegate, or HR on behalf), then a payroll holder; never one's own, never two steps
  readAll_(SHEETS.EXPENSE).forEach(function (x) {
    if (x.status !== 'pending' || x.empId === me.id) return;
    var emp = ctx.emps[x.empId];
    if (!emp) return;
    var h = parseJson_(x.stepsJson, []);
    if (h.some(function (k) { return k.by === me.id; })) return;
    var can = canActExpense_(me, x, emp, ctx), mgr = x.step === 'manager', m = mgr ? apMgrOf_(emp.id, ctx) : null;
    var dg = can && mgr && !manages_(me, emp, ctx) && !isHr_(me) ? delegatedFor_(me, emp, ctx) : null;
    var prim = can && (!mgr || manages_(me, emp, ctx) || !!dg || !m);
    push({ type: 'expense', id: x.id, ref: x.ref, emp: emp, step: x.step, since: h.length ? h[h.length - 1].at : x.createdAt, actor: can,
      owner: mgr ? (m ? { people: [m.id] } : { role: 'hr' }) : { role: 'payroll', money: true }, primary: prim, onBehalfOf: dg ? lcName_(ctx, dg.fromEmpId) : '',
      onBehalfRole: can && !prim && isHr_(me) ? 'hr' : '', actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'expenses' },
      what: { amount: round2_(Number(x.total) || 0), count: parseJson_(x.linesJson, []).length, text: x.title || '', flags: parseJson_(x.flagsJson, []).length } });
  });
  if (roleWork) {
    readAll_(SHEETS.COMP).forEach(function (c) {
      if (c.status !== 'pending') return;
      var other = parseJson_(c.otherJson, {}), total = (Number(c.basic) || 0) + (Number(c.housing) || 0) + (Number(c.transport) || 0);
      Object.keys(other).forEach(function (k) { total += Number(other[k]) || 0; });
      push({ type: 'salary', id: c.id, ref: c.ref, emp: ctx.emps[c.empId], since: c.createdAt, actor: canDecideComp_(me) && c.empId !== me.id && c.enteredBy !== me.id,
        maker: c.enteredBy === me.id || c.empId === me.id, owner: { role: 'payroll', money: true }, actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'approvals' },
        what: pay || payH ? { amount: round2_(total), from: String(c.effectiveFrom).slice(0, 10) } : { from: String(c.effectiveFrom).slice(0, 10) } });
    });
    readAll_(SHEETS.RUN).forEach(function (r) {
      if (r.status !== 'draft') return;
      var tt = parseJson_(r.totalsJson, {});
      push({ type: 'payroll', id: r.id, ref: r.ref, since: r.preparedAt || r.createdAt, actor: payH && r.preparedBy !== me.id, maker: r.preparedBy === me.id,
        owner: { role: 'payroll', money: true }, actions: ['approve'], link: { tab: 'hr', sec: 'payroll' }, what: { month: r.month, count: tt.headcount || 0, amount: pay || payH ? round2_(tt.net || 0) : null } });
    });
    readAll_(SHEETS.WPS).forEach(function (w) {
      if (w.status !== 'uploaded') return;
      push({ type: 'wps', id: w.runId, ref: w.ref, since: w.uploadedAt, actor: pay && w.uploadedBy !== me.id, maker: w.uploadedBy === me.id, owner: { role: 'payroll', money: true },
        actions: ['approve'], link: { tab: 'hr', sec: 'compliance' }, what: { month: w.month, count: Number(w.rows) || 0, amount: pay ? Number(w.total) || 0 : null, text: w.bankRef } });
    });
    readAll_(SHEETS.RECON).forEach(function (x) {
      if (x.status !== 'open') return;
      push({ type: 'recon', id: x.id, ref: x.ref, since: x.at, actor: pay && x.by !== me.id, maker: x.by === me.id, owner: { role: 'payroll', money: true },
        actions: ['approve'], link: { tab: 'hr', sec: 'compliance' }, what: { month: x.month, text: x.source, count: parseJson_(x.mismatchesJson, []).length } });
    });
    readAll_(SHEETS.DCASE).forEach(function (x) {
      var emp = ctx.emps[x.empId];
      if ((x.status === 'charged' || x.status === 'responded') && parseJson_(x.hearingsJson, []).length)
        push({ type: 'disc_decide', id: x.id, ref: x.ref, emp: emp, since: x.responseAt || x.chargedAt || x.createdAt, actor: hr && x.reportedBy !== me.id && x.empId !== me.id,
          maker: x.reportedBy === me.id || x.empId === me.id, owner: { role: 'hr' }, actions: [], link: { tab: 'hr', sec: 'relations' }, what: { text: x.code } });
      if (x.status === 'objected')
        push({ type: 'disc_objection', id: x.id, ref: x.ref, emp: emp, since: x.objectedAt || x.updatedAt, actor: hr && x.decidedBy !== me.id && x.empId !== me.id && !(x.amount && me.role !== 'hr'),
          maker: x.decidedBy === me.id || x.empId === me.id, owner: { role: 'hr' }, actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'relations' }, what: { text: x.decision } });
    });
    var assets = {};
    readAll_(SHEETS.ASSET).forEach(function (a) { assets[a.id] = a; });
    readAll_(SHEETS.CUST).forEach(function (c) {
      if (c.chargeStatus !== 'proposed') return;
      var a = assets[c.assetId] || {};
      push({ type: 'asset_charge', id: c.id, ref: a.ref || '', emp: ctx.emps[c.empId], since: c.returnedAt, actor: payH && c.chargeBy !== me.id && c.empId !== me.id,
        maker: c.chargeBy === me.id || c.empId === me.id, owner: { role: 'payroll', money: true }, actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'custody' },
        what: { amount: pay || payH ? Number(c.charge) || 0 : null, text: a.nameAr || '' } });
    });
    readAll_(SHEETS.RLOG).forEach(function (x) {
      if (x.reviewedBy) return;
      var money = (REPORTS[x.reportId] || {}).access === 'money';
      push({ type: 'report', id: x.id, ref: x.ref, since: x.at, actor: x.by !== me.id && (money ? pay : hr), maker: x.by === me.id, owner: { role: money ? 'payroll' : 'hr', money: money },
        actions: ['approve'], link: { tab: 'hr', sec: 'reports', view: 'log' }, what: { text: x.reportId, count: Number(x.rows) || 0 } });
    });
    // the payroll journal imported in Odoo, confirmed by a payroll holder who neither generated nor imported it (Journal.gs)
    readAll_(SHEETS.JOURNAL).forEach(function (j) {
      if (j.status !== 'imported') return;
      var mk = j.generatedBy === me.id || j.importedBy === me.id;
      push({ type: 'journal', id: j.runId, ref: j.ref, since: j.importedAt, actor: pay && !mk, maker: mk, owner: { role: 'payroll', money: true }, actions: ['approve'],
        link: { tab: 'hr', sec: 'journal' }, what: { month: j.month, count: Number(j.lines) || 0, amount: pay ? Number(j.debit) || 0 : null, text: String(j.odooRef || '') } });
    });
    // ticket uses with an amount: a payroll holder who did not record it, never the traveller (GovServices.gs)
    readAll_(SHEETS.TICKET_USE).forEach(function (u) {
      if (u.status !== 'pending') return;
      var mk = u.enteredBy === me.id || u.empId === me.id;
      push({ type: 'ticket_use', id: u.id, ref: u.ref, emp: ctx.emps[u.empId], since: u.createdAt, actor: pay && !mk, maker: mk, owner: { role: 'payroll', money: true },
        actions: ['approve', 'reject'], link: { tab: 'hr', sec: 'gov' }, what: { amount: pay || payH ? Number(u.amount) || 0 : null, count: Number(u.persons) || 0, text: u.kind, from: String(u.usedOn).slice(0, 10) } });
    });
    // government fees checked against the receipt by a second person (GovServices.gs)
    var gm = govMoney_(me), gs = govSeesMoney_(me);
    readAll_(SHEETS.GOV_FEE).forEach(function (f) {
      if (f.status !== 'recorded') return;
      var mk = f.enteredBy === me.id || f.empId === me.id;
      push({ type: 'gov_fee', id: f.id, ref: f.ref, emp: f.empId ? ctx.emps[f.empId] : null, since: f.enteredAt, actor: gm && !mk, maker: mk, owner: { role: 'payroll', money: true },
        actions: ['approve'], link: { tab: 'hr', sec: 'gov' }, what: { amount: gs ? Number(f.amount) || 0 : null, text: f.type, from: String(f.date).slice(0, 10) } });
    });
    if (hr) {
      // visas approved and waiting for HR to record what Muqeem issued: their own screen (the visa number and dates)
      readAll_(SHEETS.GOV_VISA).forEach(function (v) {
        if ((v.status !== 'approved' && v.status !== 'planned') || v.empId === me.id) return;
        push({ type: 'gov_visa', id: v.id, ref: v.ref, emp: ctx.emps[v.empId], since: v.updatedAt || v.createdAt, due: v.travelFrom ? String(v.travelFrom).slice(0, 10) : '', actor: true,
          owner: { role: 'hr' }, actions: [], link: { tab: 'hr', sec: 'gov' }, what: { text: v.kind, from: String(v.travelFrom || '').slice(0, 10), to: String(v.travelTo || '').slice(0, 10) } });
      });
      var cal = {};
      readAll_(SHEETS.CYC).forEach(function (cy) { if (cy.status === 'calibration') cal[cy.id] = cy; });
      if (Object.keys(cal).length) readAll_(SHEETS.REV).forEach(function (r) {
        if (!cal[r.cycleId] || !r.mgrAt || r.calibratedBy || r.empId === me.id) return;
        push({ type: 'calibration', id: r.id, ref: r.ref, emp: ctx.emps[r.empId], since: r.mgrAt, actor: true, owner: { role: 'hr' }, actions: [], link: { tab: 'hr', sec: 'performance' },
          what: { text: String(r.overall || ''), month: cal[r.cycleId].ref } });
      });
    }
  }
  // offboarding clearance tasks
  readAll_(SHEETS.CLR).forEach(function (x) {
    if (x.status !== 'open') return;
    var emp = ctx.emps[x.empId], v = clearanceView_(x, me, ctx);
    v.tasks.forEach(function (tk) {
      if (tk.status === 'done' || tk.key === 'assets') return;
      var ow = tk.owner === 'manager' ? { people: [emp && emp.managerId] } : tk.owner === 'payroll' ? { role: 'payroll', money: true } : { role: 'hr' };
      push({ type: 'clearance', id: x.id, task: tk.key, ref: x.ref, emp: emp, since: x.createdAt, due: x.lastDay, actor: tk.canTick, maker: x.empId === me.id, owner: ow,
        actions: ['done'], link: { tab: 'hr', sec: 'offboarding' }, what: { task: tk.key, to: String(x.lastDay).slice(0, 10) } });
    });
  });
  // leave-cycle tasks and steps
  var hol = holidayMap_();
  readAll_(SHEETS.LCYC).forEach(function (c) {
    if (c.status === 'closed' || c.status === 'cancelled') return;
    var emp = ctx.emps[c.empId];
    if (!emp) return;
    var tasks = lcLive_(c, emp), back = lcBackOn_(emp, c.toDate, conf.s, hol), mine = lcMine_(c, tasks, me, emp, ctx, t, back), mk = {};
    mine.forEach(function (a) { mk[a.key] = a; });
    var link = function (owner) { return owner === 'employee' || owner === 'substitute' ? { tab: 'file' } : { tab: 'hr', sec: 'leavecycle' }; };
    var what = { from: String(c.fromDate).slice(0, 10), to: String(c.toDate).slice(0, 10), days: Number(c.days) || 0 };
    mine.forEach(function (a) {
      push({ type: 'leavecycle', id: c.id, task: a.key, ref: c.ref, emp: emp, since: a.since, due: a.due, actor: true, owner: { people: [c.empId] },
        actions: a.key === 'custody' || a.key === 'handover_accept' ? ['done'] : [], link: link(a.owner), what: Object.assign({ task: a.key }, what) });
    });
    if (c.departedOn) return;
    tasks.forEach(function (x) { // escalation of what others still owe
      if (x.status !== 'open' || mk[x.key] || !x.required) return;
      var ow = x.owner === 'manager' ? { people: [emp.managerId] } : x.owner === 'hr' ? { role: 'hr' } : x.owner === 'payroll' ? { role: 'payroll', money: true } : { people: [c.empId] };
      push({ type: 'leavecycle', id: c.id, task: x.key, ref: c.ref, emp: emp, since: x.since || c.createdAt, due: x.due, actor: false, maker: me.id === c.empId, owner: ow, actions: [],
        link: { tab: 'hr', sec: 'leavecycle' }, what: Object.assign({ task: x.key }, what) });
    });
  });
  // onboarding tasks due within a week
  readAll_(SHEETS.ONB).forEach(function (x) {
    if (x.status !== 'open' || String(x.dueDate).slice(0, 10) > soon) return;
    var emp = ctx.emps[x.empId];
    if (!emp || emp.status !== 'active') return;
    var ow = x.owner === 'manager' ? { people: [emp.managerId] } : x.owner === 'employee' ? { people: [emp.id] } : { role: 'hr' };
    push({ type: 'onboarding', id: x.id, task: x.taskKey, ref: x.ref, emp: emp, since: x.createdAt, due: x.dueDate, actor: onbCanTick_(me, x, emp, ctx) && (x.owner !== 'it' || hr),
      primary: x.owner === 'hr' || x.owner === 'it' ? hr : x.owner === 'employee' ? me.id === emp.id : !hr || manages_(me, emp, ctx), owner: ow, actions: ['done'],
      link: me.id === emp.id ? { tab: 'file' } : { tab: 'hr', sec: 'onboarding' }, what: { task: x.taskKey, text: x.titleAr, textEn: x.titleEn, to: String(x.dueDate).slice(0, 10) } });
  });
  var rank = { late: 0, due_today: 1, on_time: 2 };
  out.sort(function (a, b) { return (b.canAct ? 1 : 0) - (a.canAct ? 1 : 0) || rank[a.sla.state] - rank[b.sla.state] || b.sla.ageDays - a.sla.ageDays || String(a.sla.dueAt).localeCompare(String(b.sla.dueAt)); });
  return out;
}

/** How fast I decide: average hours from the step's start to my decision, over the last 90 days (and the company's, for HR). */
function apSpeed_(me) {
  var since = new Date(Date.now() - 90 * 86400000).toISOString(), mine = [], org = [];
  var add = function (who, from, at) { var a = Date.parse(at), b = Date.parse(from); if (!(a > b) || String(at) < since) return; var hh = (a - b) / 3600000; org.push(hh); if (who === me.id) mine.push(hh); };
  readAll_(SHEETS.REQ).forEach(function (r) {
    var prev = r.createdAt;
    history_(r).forEach(function (h) { if (h.decision === 'approve' || h.decision === 'reject') add(h.by, prev, h.at); prev = h.at; });
  });
  if (isHr_(me) || canPayroll_(me)) {
    readAll_(SHEETS.COMP).forEach(function (c) { if (c.approvedBy) add(c.approvedBy, c.createdAt, c.approvedAt); });
    readAll_(SHEETS.RUN).forEach(function (r) { if (r.approvedBy) add(r.approvedBy, r.preparedAt, r.approvedAt); });
    readAll_(SHEETS.WPS).forEach(function (w) { if (w.confirmedBy) add(w.confirmedBy, w.uploadedAt, w.confirmedAt); });
    readAll_(SHEETS.RECON).forEach(function (x) { if (x.resolvedBy) add(x.resolvedBy, x.at, x.resolvedAt); });
    readAll_(SHEETS.RLOG).forEach(function (x) { if (x.reviewedBy) add(x.reviewedBy, x.at, x.reviewedAt); });
  }
  var avg = function (l) { return l.length ? round2_(l.reduce(function (s, x) { return s + x; }, 0) / l.length) : null; };
  return { mine: avg(mine), mineCount: mine.length, org: isHr_(me) ? avg(org) : null, orgCount: isHr_(me) ? org.length : null };
}

function api_approvalsInbox(req, me) {
  var ctx = orgCtx_(), items = apItems_(me, ctx), by = {}, st = { late: 0, due_today: 0, on_time: 0 }, esc = 0, act = 0;
  items.forEach(function (x) { by[x.type] = (by[x.type] || 0) + 1; st[x.sla.state]++; if (x.escalated) esc++; if (x.canAct) act++; });
  var type = String(req.type || '');
  var rows = type ? items.filter(function (x) { return x.type === type; }) : items;
  return { ok: true, items: rows.slice(0, 500), stats: { total: items.length, actionable: act, byType: by, late: st.late, dueToday: st.due_today, onTime: st.on_time, escalated: esc, speed: apSpeed_(me) },
    slaHours: lcConf_().slaHours, bulk: AP_BULK, today: today_() };
}

/** One item through its module's own endpoint; that endpoint's rules decide. */
function apDo_(type, x, decision, note, me) {
  var need = function (ok) { if (!ok) fail_('bad_request'); };
  if (type === 'request') { need(decision !== 'done'); return { ref: api_reqDecide({ id: x.id, decision: decision, note: note }, me).request.ref }; }
  if (type === 'salary') { need(decision !== 'done'); api_hrCompDecide({ ids: [x.id], decision: decision }, me); var c = findBy_(SHEETS.COMP, 'id', x.id); return { ref: c ? c.ref : '' }; }
  if (type === 'payroll') { need(decision === 'approve'); return { ref: api_payrollApprove({ id: x.id }, me).run.ref }; }
  if (type === 'wps') { need(decision === 'approve'); return { ref: api_wpsStep({ id: x.id, step: 'confirmed', note: note }, me).log.ref }; }
  if (type === 'recon') { need(decision === 'approve'); if (!note) fail_('note_required'); return { ref: api_reconResolve({ id: x.id, note: note }, me).recon.ref }; }
  if (type === 'disc_objection') { need(decision !== 'done'); if (!note) fail_('note_required'); return { ref: api_discObjectionDecide({ id: x.id, result: decision === 'approve' ? 'cancelled' : 'upheld', note: note }, me).case.ref }; }
  if (type === 'asset_charge') { need(decision !== 'done'); api_assetCharge({ id: x.id, approve: decision === 'approve', note: note }, me); return { ref: '' }; }
  if (type === 'clearance') { need(decision === 'done'); return { ref: api_clearanceTask({ id: x.id, key: x.task, note: note }, me).clearance.ref }; }
  if (type === 'onboarding') { need(decision === 'done' || decision === 'approve'); var o = api_onboardTask({ id: x.id, status: 'done', note: note }, me); return { ref: o.task.ref }; }
  if (type === 'report') { need(decision === 'approve'); var lg = findBy_(SHEETS.RLOG, 'id', x.id); if (!lg) fail_('not_found'); api_reportReview({ ref: lg.ref, note: note }, me); return { ref: lg.ref }; }
  if (type === 'expense') { need(decision !== 'done'); return { ref: api_expenseDecide({ id: x.id, decision: decision, note: note, payout: x.payout === 'outside' ? 'outside' : 'payroll' }, me).claim.ref }; }
  if (type === 'journal') { need(decision === 'approve'); return { ref: api_journalStep({ id: x.id, step: 'confirmed', note: note }, me).log.ref }; }
  if (type === 'ticket_use') { need(decision !== 'done'); return { ref: api_ticketUseApprove({ id: x.id, decision: decision, note: note }, me).use.ref }; }
  if (type === 'gov_fee') { need(decision === 'approve'); api_govFeeVerify({ ids: [x.id] }, me); var gf = findBy_(SHEETS.GOV_FEE, 'id', x.id); return { ref: gf ? gf.ref : '' }; }
  if (type === 'leavecycle') {
    if (x.task !== 'custody' && x.task !== 'handover_accept') fail_('deep_link_only'); // forms with data (visa, ticket, amounts, dates) are on the leave-cycle screen
    need(decision === 'done');
    return { ref: api_leaveCycleTask({ id: x.id, key: x.task, op: x.task === 'handover_accept' ? 'accept' : 'done', note: note }, me).cycle.ref };
  }
  fail_('deep_link_only');
}

/**
 * Act from the centre. items: [{ type, id, task? }], decision: approve | reject | done, note. A reject needs a note. More than
 * one item: same type, a type that allows bulk, approve only, and confirm: true (the confirmation step).
 */
function api_approvalsAct(req, me) {
  var list = Array.isArray(req.items) ? req.items : [], decision = ['approve', 'reject', 'done'].indexOf(req.decision) >= 0 ? req.decision : '', note = str_(req.note, 500);
  if (!list.length || !decision) fail_('bad_request');
  if (list.length > 30) fail_('too_many');
  var type = String(list[0] && list[0].type || '');
  if (list.some(function (x) { return !x || x.type !== type; })) fail_('bulk_one_type');
  if (list.length > 1) {
    if (!AP_BULK[type] || (decision !== 'approve' && decision !== 'done')) fail_('bulk_not_allowed');
    if (req.confirm !== true) fail_('confirm_required');
  }
  if (decision === 'reject' && !note) fail_('note_required');
  var results = list.map(function (x) {
    try { var r = apDo_(type, { id: String(x.id || ''), task: x.task || '', payout: x.payout || '' }, decision, note, me); return { id: x.id, task: x.task || '', ok: true, ref: r.ref || '' }; }
    catch (e) {
      var m = String(e && e.message || e);
      if (m.indexOf('E:') !== 0) console.error('approvalsAct ' + type + ': ' + m);
      return { id: x.id, task: x.task || '', ok: false, error: m.indexOf('E:') === 0 ? m.slice(2) : 'server_error' };
    }
  });
  var done = results.filter(function (x) { return x.ok; }).length;
  audit_(me.id, 'approvals_act', '', { type: type, decision: decision, items: list.length, done: done, bulk: list.length > 1 });
  return { ok: true, results: results, done: done, failed: results.length - done };
}

/** Who did what, when, with what note and on whose behalf, for one item the viewer may see. */
function api_approvalHistory(req, me) {
  var ctx = orgCtx_(), type = String(req.type || ''), id = String(req.id || ''), N = function (x) { return lcName_(ctx, x); }, out = [], head = {};
  var ev = function (at, by, decision, note, extra) { if (at) out.push(Object.assign({ at: at, by: N(by), decision: decision, note: note || '' }, extra || {})); };
  var pay = canPayroll_(me) || hasRole_(me, 'payroll'), hr = isHr_(me);
  if (type === 'request') {
    var r = findBy_(SHEETS.REQ, 'id', id), emp = r && ctx.emps[r.empId];
    if (!r) fail_('not_found');
    var h = history_(r);
    if (!(hr || r.empId === me.id || (emp && manages_(me, emp, ctx)) || h.some(function (x) { return x.by === me.id; }) || canAct_(me, r, emp, ctx) || (pay && r.type === 'advance'))) fail_('forbidden');
    head = { ref: r.ref, emp: empCard_(emp), status: r.status, step: r.step, steps: stepsFor_(r.type, emp || { id: r.empId }, ctx, r), sub: r.type };
    ev(r.createdAt, r.empId, 'submitted', '');
    h.forEach(function (x) { ev(x.at, x.by, x.decision, x.note, { step: x.step, role: x.role || '', onBehalfOf: N(x.onBehalfOf) }); });
  } else if (type === 'salary' || type === 'payroll' || type === 'wps' || type === 'recon' || type === 'asset_charge') {
    if (!pay) fail_('forbidden');
    if (type === 'salary') { var c = findBy_(SHEETS.COMP, 'id', id); if (!c) fail_('not_found'); head = { ref: c.ref, emp: empCard_(ctx.emps[c.empId]), status: c.status }; ev(c.createdAt, c.enteredBy, 'proposed', c.reason); ev(c.approvedAt, c.approvedBy, c.status, ''); }
    if (type === 'payroll') { var u = findBy_(SHEETS.RUN, 'id', id); if (!u) fail_('not_found'); head = { ref: u.ref, status: u.status, month: u.month }; ev(u.preparedAt, u.preparedBy, 'prepared', u.note); ev(u.approvedAt, u.approvedBy, 'approved', ''); }
    if (type === 'wps') { var w = findBy_(SHEETS.WPS, 'runId', id) || findBy_(SHEETS.WPS, 'id', id); if (!w) fail_('not_found'); head = { ref: w.ref, status: w.status, month: w.month }; ev(w.generatedAt, w.generatedBy, 'generated', ''); ev(w.uploadedAt, w.uploadedBy, 'uploaded', w.bankRef); ev(w.confirmedAt, w.confirmedBy, 'confirmed', w.note); }
    if (type === 'recon') { var q = findBy_(SHEETS.RECON, 'id', id); if (!q) fail_('not_found'); head = { ref: q.ref, status: q.status, month: q.month }; ev(q.at, q.by, 'uploaded', q.source); ev(q.resolvedAt, q.resolvedBy, 'resolved', q.note); }
    if (type === 'asset_charge') { var k = findBy_(SHEETS.CUST, 'id', id); if (!k) fail_('not_found'); head = { emp: empCard_(ctx.emps[k.empId]), status: k.chargeStatus }; ev(k.returnedAt, k.chargeBy, 'proposed', k.conditionIn); if (k.chargeApprovedBy) ev(k.returnedAt, k.chargeApprovedBy, k.chargeStatus, k.chargeStatus === 'rejected' ? k.note : ''); }
  } else if (type === 'disc_decide' || type === 'disc_objection') {
    var x = findBy_(SHEETS.DCASE, 'id', id);
    if (!x) fail_('not_found');
    if (!hr && x.empId !== me.id) fail_('forbidden');
    head = { ref: x.ref, emp: empCard_(ctx.emps[x.empId]), status: x.status };
    ev(x.createdAt, x.reportedBy, 'reported', ''); ev(x.chargedAt, x.reportedBy, 'charged', ''); ev(x.responseAt, x.empId, 'responded', '');
    ev(x.decidedAt, x.decidedBy, 'decided', x.decisionNote, { step: x.decision }); ev(x.objectedAt, x.empId, 'objected', ''); if (x.objectionResult) ev(x.updatedAt, '', 'objection', x.objectionResult);
  } else if (type === 'clearance') {
    var cl = findBy_(SHEETS.CLR, 'id', id), ce = cl && ctx.emps[cl.empId];
    if (!cl) fail_('not_found');
    if (!(hr || pay || cl.empId === me.id || (ce && manages_(me, ce, ctx)))) fail_('forbidden');
    head = { ref: cl.ref, emp: empCard_(ce), status: cl.status };
    ev(cl.createdAt, cl.createdBy, 'opened', cl.reason);
    parseJson_(cl.tasksJson, []).forEach(function (tk) { if (tk.status === 'done') ev(tk.at, tk.by, 'done', tk.note, { step: tk.key }); });
  } else if (type === 'leavecycle') {
    var lc = findBy_(SHEETS.LCYC, 'id', id), v = lc ? lcView_(lc, me, ctx, lcViewCtx_(ctx)) : null;
    if (!lc) fail_('not_found');
    if (!v) fail_('forbidden');
    head = { ref: v.ref, emp: v.emp, status: v.status };
    out = v.history.map(function (e) { return { at: e.at, by: e.by, decision: e.action, note: e.note, step: e.key, onBehalfOf: e.onBehalfOf }; });
  } else if (type === 'onboarding') {
    var ob = findBy_(SHEETS.ONB, 'id', id), oe = ob && ctx.emps[ob.empId];
    if (!ob) fail_('not_found');
    if (!(hr || ob.empId === me.id || (oe && manages_(me, oe, ctx)))) fail_('forbidden');
    head = { ref: ob.ref, emp: empCard_(oe), status: ob.status };
    ev(ob.createdAt, ob.createdBy, 'opened', ''); ev(ob.doneAt, ob.doneBy, ob.status, ob.note, { step: ob.taskKey });
  } else if (type === 'report') {
    if (!hr && !pay) fail_('forbidden');
    var lg = findBy_(SHEETS.RLOG, 'id', id);
    if (!lg) fail_('not_found');
    head = { ref: lg.ref, status: lg.reviewedBy ? 'reviewed' : 'pending' };
    ev(lg.at, lg.by, 'exported', lg.format); ev(lg.reviewedAt, lg.reviewedBy, 'reviewed', lg.reviewNote);
  } else if (type === 'expense') {
    var ex = findBy_(SHEETS.EXPENSE, 'id', id), xe = ex && ctx.emps[ex.empId];
    if (!ex) fail_('not_found');
    var xh = parseJson_(ex.stepsJson, []);
    if (!(hr || canPayroll_(me) || ex.empId === me.id || (xe && manages_(me, xe, ctx)) || xh.some(function (k) { return k.by === me.id; }) || canActExpense_(me, ex, xe, ctx))) fail_('forbidden');
    head = { ref: ex.ref, emp: empCard_(xe), status: ex.status, step: ex.step, sub: 'expense' };
    ev(ex.createdAt, ex.empId, 'submitted', ex.title);
    xh.forEach(function (k) { ev(k.at, k.by, k.decision, k.note, { step: k.step, role: k.role || '', onBehalfOf: N(k.onBehalfOf) }); });
    if (ex.status === 'paid' && ex.paidBy) ev(ex.updatedAt, ex.paidBy, 'paid', ex.paidRef);
  } else if (type === 'journal') {
    if (!canPayroll_(me)) fail_('forbidden');
    var jl = journalLogOf_(id) || findBy_(SHEETS.JOURNAL, 'id', id);
    if (!jl) fail_('not_found');
    head = { ref: jl.ref, status: jl.status, month: jl.month };
    ev(jl.generatedAt, jl.generatedBy, 'generated', ''); ev(jl.importedAt, jl.importedBy, 'imported', jl.odooRef); ev(jl.confirmedAt, jl.confirmedBy, 'confirmed', jl.note);
  } else if (type === 'ticket_use') {
    if (!hr && !pay) fail_('forbidden');
    var tu = findBy_(SHEETS.TICKET_USE, 'id', id);
    if (!tu) fail_('not_found');
    head = { ref: tu.ref, emp: empCard_(ctx.emps[tu.empId]), status: tu.status };
    ev(tu.createdAt, tu.enteredBy, 'recorded', tu.reference); ev(tu.approvedAt, tu.approvedBy, tu.status, tu.status === 'rejected' ? tu.note : '');
  } else if (type === 'gov_fee') {
    if (!hr && !govMoney_(me)) fail_('forbidden');
    var gf = findBy_(SHEETS.GOV_FEE, 'id', id);
    if (!gf) fail_('not_found');
    head = { ref: gf.ref, emp: gf.empId ? empCard_(ctx.emps[gf.empId]) : null, status: gf.status };
    ev(gf.enteredAt, gf.enteredBy, 'recorded', gf.reference); ev(gf.verifiedAt, gf.verifiedBy, 'verified', '');
  } else if (type === 'gov_visa') {
    var gv = findBy_(SHEETS.GOV_VISA, 'id', id);
    if (!gv) fail_('not_found');
    if (!hr && gv.empId !== me.id) fail_('forbidden');
    head = { ref: gv.ref, emp: empCard_(ctx.emps[gv.empId]), status: gv.status };
    ev(gv.createdAt, gv.createdBy, 'opened', ''); ev(gv.issuedAt, gv.issuedBy, 'issued', String(gv.visaNo || '')); ev(gv.returnedOn ? gv.updatedAt : '', gv.returnBy, 'returned', '');
  } else if (type === 'calibration') {
    if (!hr) fail_('forbidden');
    var rv = findBy_(SHEETS.REV, 'id', id);
    if (!rv) fail_('not_found');
    head = { ref: rv.ref, emp: empCard_(ctx.emps[rv.empId]), status: rv.calibratedBy ? 'calibrated' : 'pending' };
    ev(rv.selfAt, rv.empId, 'self', ''); ev(rv.mgrAt, rv.mgrBy, 'manager', ''); if (rv.calibratedBy) ev(rv.updatedAt, rv.calibratedBy, 'calibrated', rv.calibrationNote);
  } else fail_('bad_value');
  out.sort(function (a, b) { return String(a.at) < String(b.at) ? -1 : 1; });
  return { ok: true, type: type, item: head, entries: out };
}
