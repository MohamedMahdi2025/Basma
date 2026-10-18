/**
 * HR help desk (طلبات الدعم), Wave 2, 2026-10-14. Employees raise a question or a case (HD-YYYY-00001); it lands in a
 * queue: 'payroll' (payroll and GOSI questions: payroll holders or the hr role), 'hr_confidential' (conduct and harassment
 * reports: the hr role only, never an administrator or payroll), or 'hr' (everything else: hr role and administrators).
 *  - SLA by priority: urgent 4 h, high 24 h, normal 72 h; overdue = past slaDue and not resolved or closed.
 *  - Handlers can add internal notes the requester never sees; nobody handles their own ticket.
 *  - The requester can reply, close, reopen within 7 days of the resolution, and rate it once (1-5).
 */

var HD_CATS = ['payroll', 'gosi', 'leave', 'documents', 'letters', 'insurance', 'gov_services', 'it_access', 'conduct', 'other'];
var HD_SLA_HOURS = { urgent: 4, high: 24, normal: 72 };
var HD_OPEN = { open: 1, in_progress: 1, waiting_employee: 1 };

function hdQueueOf_(cat) { return cat === 'payroll' || cat === 'gosi' ? 'payroll' : cat === 'conduct' ? 'hr_confidential' : 'hr'; }
function hdHandles_(me, queue) {
  if (!me) return false;
  if (queue === 'payroll') return me.role === 'hr' || hasRole_(me, 'payroll');
  if (queue === 'hr_confidential') return me.role === 'hr';
  return isHr_(me);
}
function hdCanWork_(me, x) { return !!me && x.empId !== me.id && hdHandles_(me, x.queue); }
function hdOverdue_(x, nowIso) { return !!HD_OPEN[x.status] && !!x.slaDue && String(x.slaDue) < nowIso; }

function hdPublicTicket_(x, ctx, me, full) {
  var agent = hdCanWork_(me, x), now = new Date().toISOString();
  var v = { id: x.id, ref: x.ref, emp: empCard_(ctx.emps[x.empId]), category: x.category, subject: x.subject, priority: x.priority, confidential: bool_(x.confidential),
    status: x.status, queue: x.queue, assignee: empCard_(ctx.emps[x.assigneeId]), slaDue: x.slaDue, overdue: hdOverdue_(x, now), firstResponseAt: x.firstResponseAt,
    resolvedAt: x.resolvedAt, closedAt: x.closedAt, rating: x.rating === '' ? null : Number(x.rating), createdAt: x.createdAt, updatedAt: x.updatedAt,
    mine: x.empId === me.id, canWork: agent };
  if (full) {
    v.body = x.body;
    v.messages = parseJson_(x.messagesJson, []).filter(function (m) { return agent || !m.internal; }).map(function (m) {
      var b = ctx.emps[m.by]; return { by: b ? b.name : '', byId: m.by, fromHandler: m.by !== x.empId, text: m.text, internal: !!m.internal, at: m.at }; });
    v.ratingNote = agent || x.empId === me.id ? x.ratingNote : '';
  }
  return v;
}

function api_hdCreate(req, me) {
  var d = req.ticket || {};
  if (HD_CATS.indexOf(d.category) < 0) fail_('bad_value');
  var subject = str_(d.subject, 150), body = str_(d.body, 4000);
  if (!subject || !body) fail_('missing_fields');
  var pr = HD_SLA_HOURS[d.priority] ? d.priority : 'normal';
  return withLock_(function () {
    var ctx = orgCtx_(), now = new Date(), iso = now.toISOString();
    var x = { id: newId_('D'), ref: nextRef_('helpdesk', refsOf_(SHEETS.HDT)), empId: me.id, category: d.category, subject: subject, body: body, priority: pr,
      confidential: d.category === 'conduct', status: 'open', assigneeId: '', queue: hdQueueOf_(d.category), messagesJson: '[]',
      slaDue: new Date(now.getTime() + HD_SLA_HOURS[pr] * 3600000).toISOString(), firstResponseAt: '', resolvedAt: '', closedAt: '', rating: '', ratingNote: '', createdAt: iso, updatedAt: iso };
    append_(SHEETS.HDT, x);
    audit_(me.id, 'hd_create', me.id, { ref: x.ref, queue: x.queue });
    return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
  });
}

function api_hdMine(req, me) {
  var ctx = orgCtx_();
  return { ok: true, categories: HD_CATS, rows: readAll_(SHEETS.HDT).filter(function (x) { return x.empId === me.id; })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return hdPublicTicket_(x, ctx, me, false); }) };
}

/** Tickets in the queues I handle (never my own). Filters: status, queue, mine (assigned to me). */
function api_hdList(req, me) {
  if (!hdHandles_(me, 'hr') && !hdHandles_(me, 'payroll')) fail_('forbidden');
  var ctx = orgCtx_(), now = new Date().toISOString(), all = readAll_(SHEETS.HDT).filter(function (x) { return hdCanWork_(me, x); });
  var counts = { open: 0, in_progress: 0, waiting_employee: 0, resolved: 0, closed: 0, overdue: 0, unassigned: 0 };
  all.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; if (hdOverdue_(x, now)) counts.overdue++; if (HD_OPEN[x.status] && !x.assigneeId) counts.unassigned++; });
  var rows = all.filter(function (x) {
    return (!req.status || (req.status === 'active' ? !!HD_OPEN[x.status] : x.status === req.status)) && (!req.queue || x.queue === req.queue) && (!req.mine || x.assigneeId === me.id);
  }).sort(function (a, b) { return String(a.slaDue) < String(b.slaDue) ? -1 : 1; }).slice(0, 500).map(function (x) { return hdPublicTicket_(x, ctx, me, false); });
  return { ok: true, rows: rows, counts: counts, queues: ['hr', 'payroll', 'hr_confidential'].filter(function (q) { return hdHandles_(me, q); }) };
}

function hdFind_(me, id) {
  var x = findBy_(SHEETS.HDT, 'id', id);
  if (!x || (x.empId !== me.id && !hdCanWork_(me, x))) fail_('not_found');
  return x;
}
function api_hdGet(req, me) {
  var ctx = orgCtx_(), x = hdFind_(me, req.id);
  return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
}

function api_hdReply(req, me) {
  var text = str_(req.text, 4000);
  if (!text) fail_('missing_fields');
  return withLock_(function () {
    var ctx = orgCtx_(), x = hdFind_(me, req.id), now = new Date().toISOString(), own = x.empId === me.id;
    if (x.status === 'closed') fail_('bad_request');
    var internal = !own && req.internal === true;
    var msgs = parseJson_(x.messagesJson, []); msgs.push({ by: me.id, text: text, internal: internal, at: now });
    x.messagesJson = JSON.stringify(msgs);
    if (own) { if (x.status === 'waiting_employee' || x.status === 'resolved') { x.status = 'open'; x.resolvedAt = ''; } }
    else if (!internal) {
      if (!x.firstResponseAt) x.firstResponseAt = now;
      if (!x.assigneeId) x.assigneeId = me.id;
      var st = ['in_progress', 'waiting_employee', 'resolved'].indexOf(req.status) >= 0 ? req.status : (x.status === 'open' ? 'in_progress' : x.status);
      x.status = st; if (st === 'resolved') x.resolvedAt = now;
    }
    x.updatedAt = now;
    update_(SHEETS.HDT, x);
    audit_(me.id, 'hd_reply', x.empId, { ref: x.ref, internal: internal });
    return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
  });
}

function api_hdAssign(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.HDT, 'id', req.id);
    if (!x || !hdCanWork_(me, x)) fail_('not_found');
    if (!HD_OPEN[x.status]) fail_('bad_request');
    var to = req.assigneeId || me.id, who = ctx.emps[to];
    if (!who || who.status !== 'active' || !hdCanWork_(who, x)) fail_('forbidden');
    x.assigneeId = to; x.updatedAt = new Date().toISOString();
    update_(SHEETS.HDT, x);
    audit_(me.id, 'hd_assign', x.empId, { ref: x.ref, to: to });
    return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
  });
}

/** Handlers set in_progress / waiting_employee / resolved / closed; the requester may close, or reopen within 7 days of the resolution. */
function api_hdStatus(req, me) {
  var st = String(req.status || '');
  if (['open', 'in_progress', 'waiting_employee', 'resolved', 'closed'].indexOf(st) < 0) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), x = hdFind_(me, req.id), now = new Date().toISOString(), own = x.empId === me.id, note = str_(req.note, 1000);
    if (own) {
      if (st === 'closed') { if (x.status === 'closed') fail_('bad_request'); }
      else if (st === 'open') { if (x.status !== 'resolved' || (Date.now() - Date.parse(x.resolvedAt)) > 7 * 864e5) fail_('bad_request'); }
      else fail_('forbidden');
    } else {
      if (st === 'open' || x.status === 'closed') fail_('bad_request');
      if (st === 'resolved' && !note && !parseJson_(x.messagesJson, []).some(function (m) { return m.by !== x.empId && !m.internal; })) fail_('note_required');
    }
    if (note) { var msgs = parseJson_(x.messagesJson, []); msgs.push({ by: me.id, text: note, internal: false, at: now }); x.messagesJson = JSON.stringify(msgs); if (!own && !x.firstResponseAt) x.firstResponseAt = now; }
    x.status = st; x.updatedAt = now;
    if (st === 'resolved') x.resolvedAt = now;
    if (st === 'open') x.resolvedAt = '';
    if (st === 'closed') x.closedAt = now;
    if (!own && !x.assigneeId) x.assigneeId = me.id;
    update_(SHEETS.HDT, x);
    audit_(me.id, 'hd_status', x.empId, { ref: x.ref, status: st });
    return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
  });
}

function api_hdRate(req, me) {
  var n = Math.floor(Number(req.rating));
  if (!(n >= 1 && n <= 5)) fail_('bad_value');
  return withLock_(function () {
    var ctx = orgCtx_(), x = findBy_(SHEETS.HDT, 'id', req.id);
    if (!x || x.empId !== me.id) fail_('not_found');
    if ((x.status !== 'resolved' && x.status !== 'closed') || x.rating !== '') fail_('bad_request');
    x.rating = n; x.ratingNote = str_(req.note, 500); x.updatedAt = new Date().toISOString();
    update_(SHEETS.HDT, x);
    audit_(me.id, 'hd_rate', me.id, { ref: x.ref, rating: n });
    return { ok: true, ticket: hdPublicTicket_(x, ctx, me, true) };
  });
}

hrisHook_('tasks', function (me, ctx, add) {
  var all = readAll_(SHEETS.HDT);
  add('hd_unassigned', all.filter(function (x) { return HD_OPEN[x.status] && !x.assigneeId && hdCanWork_(me, x); }).length, { tab: 'hr', sec: 'helpdesk' });
  add('hd_assigned', all.filter(function (x) { return HD_OPEN[x.status] && x.assigneeId === me.id && x.status !== 'waiting_employee' && hdCanWork_(me, x); }).length, { tab: 'hr', sec: 'helpdesk' });
  add('hd_reply', all.filter(function (x) { return x.empId === me.id && x.status === 'waiting_employee'; }).length, { tab: 'file' });
});
