/**
 * Wave 5 (2026-10-25): the modules a second pass over the leading HRIS found missing (docs/research/2026-10-25-world-class-gap-check.md).
 * One file so the backend file list (deploy.sh, tests/harness.js, ../apps-script/.clasp.json) changes once.
 */

// ======================================================================= 1. health, safety and environment (HSE)
// Anyone reports a hazard, a near miss, an incident, an environmental spill or property damage, by name or anonymously.
// An anonymous report keeps no link to the reporter at all (not even for HR), so it cannot be traced back. Work injuries stay in
// Relations.gs (GOSI 3-day notice, paid days off); an HSE report can point at one. The safety officer (extra role 'hse') and HR
// investigate, record the root cause and raise corrective actions (CAPA) with an owner and a due date. The owner marks an action
// done; someone else (HSE or HR, never the owner) verifies it, and a report closes only when every action is verified or cancelled.
// PPE issues are logged per person with a replacement date and the employee's acknowledgement. Safety figures: LTIFR (lost-time
// injuries per million hours worked) and TRIR (recordable injuries per 200,000 hours), hours from the period's punches.
var HSE_KINDS = ['hazard', 'near_miss', 'incident', 'environment', 'property'];
var HSE_SEV = ['low', 'medium', 'high', 'critical'];
var HSE_ROOT = ['people', 'equipment', 'procedure', 'environment', 'management'];
var PPE_ITEMS = ['helmet', 'safety_shoes', 'gloves', 'goggles', 'coverall', 'vest', 'ear_protection', 'respirator', 'harness', 'fire_suit', 'other'];

function hseOfficer_(me) { return isHr_(me) || hasRole_(me, 'hse'); }
function hseSees_(me, x, ctx) {
  if (hseOfficer_(me) || hasRole_(me, 'executive')) return true;
  if (x.reportedBy && x.reportedBy === me.id) return true;
  var e = ctx.emps[x.reportedBy]; return !!(e && manages_(me, e, ctx));
}
function hseView_(x, ctx, acts, me) {
  var mine = acts.filter(function (a) { return a.reportId === x.id; }).map(function (a) { return hseActView_(a, ctx); });
  var officer = hseOfficer_(me);
  return { id: x.id, ref: x.ref, kind: x.kind, severity: x.severity, occurredAt: x.occurredAt, place: x.place, zoneId: x.zoneId, description: x.description,
    immediateAction: x.immediateAction, anonymous: bool_(x.anonymous), reporter: x.reportedBy && ctx.emps[x.reportedBy] ? empCard_(ctx.emps[x.reportedBy]) : null,
    status: x.status, investigator: ctx.emps[x.investigatorId] ? empCard_(ctx.emps[x.investigatorId]) : null, rootCause: officer || x.status === 'closed' ? x.rootCause : '',
    rootCategory: x.rootCategory, injuryId: x.injuryId, closedNote: x.closedNote, createdAt: x.createdAt, actions: mine, mine: !!(x.reportedBy && x.reportedBy === me.id) };
}
function hseActView_(a, ctx) {
  return { id: a.id, ref: a.ref, reportId: a.reportId, title: a.title, owner: ctx.emps[a.ownerId] ? empCard_(ctx.emps[a.ownerId]) : null, ownerId: a.ownerId,
    dueDate: String(a.dueDate).slice(0, 10), status: a.status, doneNote: a.doneNote, doneAt: a.doneAt, verifiedBy: ctx.emps[a.verifiedBy] ? ctx.emps[a.verifiedBy].name : '',
    overdue: (a.status === 'open') && String(a.dueDate).slice(0, 10) < today_() };
}
function api_hseReport(req, me) {
  var x = req.report || {};
  if (HSE_KINDS.indexOf(x.kind) < 0 || HSE_SEV.indexOf(x.severity) < 0) fail_('bad_kind');
  var when = String(x.occurredAt || ''), d = when.slice(0, 10);
  if (!isoDate_(d) || d > today_()) fail_('bad_date');
  if (str_(x.description, 2000).length < 10 || !str_(x.place, 200)) fail_('missing_fields');
  var anon = bool_(x.anonymous), ctx = orgCtx_();
  if (x.injuryId && !findBy_(SHEETS.INJ, 'id', x.injuryId)) fail_('not_found');
  return withLock_(function () {
    var now = new Date().toISOString();
    var row = { id: newId_('HS'), ref: nextRef_('hse', refsOf_(SHEETS.HSE)), kind: x.kind, severity: x.severity, occurredAt: when.slice(0, 16), place: str_(x.place, 200),
      zoneId: str_(x.zoneId, 40), description: str_(x.description, 2000), immediateAction: str_(x.immediateAction, 1000), anonymous: anon,
      reportedBy: anon ? '' : me.id, status: 'open', investigatorId: '', rootCause: '', rootCategory: '', injuryId: anon ? '' : str_(x.injuryId, 40), closedNote: '', createdAt: now, updatedAt: now };
    append_(SHEETS.HSE, row);
    audit_(anon ? '' : me.id, 'hse_report', '', { ref: row.ref, kind: row.kind, severity: row.severity });
    return { ok: true, report: hseView_(row, ctx, [], me) };
  });
}
function api_hseList(req, me) {
  var ctx = orgCtx_(), acts = readAll_(SHEETS.HSEA);
  var rows = readAll_(SHEETS.HSE).filter(function (x) { return hseSees_(me, x, ctx); })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (x) { return hseView_(x, ctx, acts, me); });
  var myActions = acts.filter(function (a) { return a.ownerId === me.id && a.status === 'open'; }).map(function (a) { return hseActView_(a, ctx); });
  return { ok: true, rows: rows, myActions: myActions, officer: hseOfficer_(me), kinds: HSE_KINDS, severities: HSE_SEV, roots: HSE_ROOT,
    zones: readAll_(SHEETS.ZONES).map(function (z) { return { id: z.id, name: z.name }; }) };
}
/** HSE or HR: assign the investigator, record the root cause, move the status, close with a note once every action is settled. */
function api_hseUpdate(req, me) {
  if (!hseOfficer_(me)) fail_('forbidden');
  return withLock_(function () {
    var x = findBy_(SHEETS.HSE, 'id', req.id), ctx = orgCtx_();
    if (!x) fail_('not_found');
    if (x.status === 'closed') fail_('already_closed');
    if (req.investigatorId != null) { if (req.investigatorId && !ctx.emps[req.investigatorId]) fail_('not_found'); x.investigatorId = req.investigatorId; if (x.status === 'open' && req.investigatorId) x.status = 'investigating'; }
    if (req.rootCause != null) {
      if (HSE_ROOT.indexOf(req.rootCategory) < 0 || str_(req.rootCause, 2000).length < 10) fail_('missing_fields');
      x.rootCause = str_(req.rootCause, 2000); x.rootCategory = req.rootCategory; if (x.status !== 'closed') x.status = 'actions';
    }
    if (req.severity && HSE_SEV.indexOf(req.severity) >= 0) x.severity = req.severity;
    if (req.close) {
      var n = str_(req.note, 1000); if (!n) fail_('note_required');
      if (!x.rootCause && x.kind !== 'hazard') fail_('root_cause_required');
      var open = readAll_(SHEETS.HSEA).filter(function (a) { return a.reportId === x.id && (a.status === 'open' || a.status === 'done'); });
      if (open.length) fail_('actions_open');
      x.status = 'closed'; x.closedNote = n;
    }
    x.updatedAt = new Date().toISOString();
    update_(SHEETS.HSE, x);
    audit_(me.id, 'hse_update', '', { ref: x.ref, status: x.status });
    return { ok: true, report: hseView_(x, ctx, readAll_(SHEETS.HSEA), me) };
  });
}
/** HSE or HR: a corrective action with an owner (any active employee) and a due date. */
function api_hseActionSave(req, me) {
  if (!hseOfficer_(me)) fail_('forbidden');
  var a = req.capa || {};
  return withLock_(function () {
    var rep = findBy_(SHEETS.HSE, 'id', a.reportId), ctx = orgCtx_(), owner = ctx.emps[a.ownerId];
    if (!rep) fail_('not_found');
    if (rep.status === 'closed') fail_('already_closed');
    if (!owner || owner.status !== 'active') fail_('not_found');
    var due = isoDate_(a.dueDate); if (!due || due < today_()) fail_('bad_date');
    var title = str_(a.title, 300); if (title.length < 5) fail_('missing_fields');
    var now = new Date().toISOString();
    var row = { id: newId_('CA'), ref: nextRef_('hseAction', refsOf_(SHEETS.HSEA)), reportId: rep.id, title: title, ownerId: owner.id, dueDate: due, status: 'open',
      doneNote: '', doneAt: '', verifiedBy: '', verifiedAt: '', createdBy: me.id, createdAt: now, updatedAt: now };
    append_(SHEETS.HSEA, row);
    if (rep.status === 'open' || rep.status === 'investigating') { rep.status = 'actions'; rep.updatedAt = now; update_(SHEETS.HSE, rep); }
    audit_(me.id, 'hse_action', owner.id, { ref: row.ref, report: rep.ref });
    return { ok: true, action: hseActView_(row, ctx) };
  });
}
/** The owner marks done (with what was done); HSE/HR (not the owner) verifies or reopens; HSE/HR may cancel with a note. */
function api_hseActionStep(req, me) {
  return withLock_(function () {
    var a = findBy_(SHEETS.HSEA, 'id', req.id), ctx = orgCtx_(), now = new Date().toISOString(), note = str_(req.note, 1000);
    if (!a) fail_('not_found');
    if (req.step === 'done') {
      if (a.ownerId !== me.id) fail_('forbidden');
      if (a.status !== 'open') fail_('bad_state');
      if (!note) fail_('note_required');
      a.status = 'done'; a.doneNote = note; a.doneAt = now;
    } else if (req.step === 'verify' || req.step === 'reopen') {
      if (!hseOfficer_(me)) fail_('forbidden');
      if (a.ownerId === me.id) fail_('cannot_verify_own');
      if (a.status !== 'done') fail_('bad_state');
      if (req.step === 'verify') { a.status = 'verified'; a.verifiedBy = me.id; a.verifiedAt = now; }
      else { if (!note) fail_('note_required'); a.status = 'open'; a.doneNote = a.doneNote + ' | ' + note; }
    } else if (req.step === 'cancel') {
      if (!hseOfficer_(me)) fail_('forbidden');
      if (a.status === 'verified' || a.status === 'cancelled') fail_('bad_state');
      if (!note) fail_('note_required');
      a.status = 'cancelled'; a.doneNote = note;
    } else fail_('bad_state');
    a.updatedAt = now;
    update_(SHEETS.HSEA, a);
    audit_(me.id, 'hse_action_' + req.step, a.ownerId, { ref: a.ref });
    return { ok: true, action: hseActView_(a, ctx) };
  });
}

// ---------------- PPE ----------------
function ppeView_(p, ctx) {
  return { id: p.id, emp: ctx.emps[p.empId] ? empCard_(ctx.emps[p.empId]) : null, empId: p.empId, item: p.item, itemName: p.itemName, size: p.size, qty: Number(p.qty) || 1,
    issuedOn: String(p.issuedOn).slice(0, 10), replaceBy: String(p.replaceBy || '').slice(0, 10), status: p.status, ackAt: p.ackAt, note: p.note,
    due: p.status === 'issued' && p.replaceBy && String(p.replaceBy).slice(0, 10) <= addDays_(today_(), 30) };
}
function api_ppeIssue(req, me) {
  if (!hseOfficer_(me)) fail_('forbidden');
  var x = req.ppe || {}, ctx = orgCtx_(), emp = ctx.emps[x.empId];
  if (!emp || emp.status !== 'active') fail_('not_found');
  if (PPE_ITEMS.indexOf(x.item) < 0) fail_('bad_kind');
  if (x.item === 'other' && !str_(x.itemName, 80)) fail_('missing_fields');
  var on = isoDate_(x.issuedOn) || today_(), rb = x.replaceBy ? isoDate_(x.replaceBy) : '', qty = Math.round(Number(x.qty) || 1);
  if (on > today_() || (x.replaceBy && (!rb || rb <= on)) || qty < 1 || qty > 50) fail_('bad_range');
  return withLock_(function () {
    var now = new Date().toISOString();
    var row = { id: newId_('PP'), empId: emp.id, item: x.item, itemName: str_(x.itemName, 80), size: str_(x.size, 20), qty: qty, issuedOn: on, replaceBy: rb,
      issuedBy: me.id, status: 'issued', ackAt: '', note: str_(x.note, 300), createdAt: now, updatedAt: now };
    append_(SHEETS.PPE, row);
    audit_(me.id, 'ppe_issue', emp.id, { item: row.item, qty: qty });
    return { ok: true, ppe: ppeView_(row, ctx) };
  });
}
/** The employee confirms they received it; HSE/HR records a return or a replacement (which closes this line). */
function api_ppeStep(req, me) {
  return withLock_(function () {
    var p = findBy_(SHEETS.PPE, 'id', req.id), ctx = orgCtx_();
    if (!p) fail_('not_found');
    if (req.step === 'ack') { if (p.empId !== me.id) fail_('forbidden'); if (p.ackAt) fail_('bad_state'); p.ackAt = new Date().toISOString(); }
    else if (req.step === 'returned' || req.step === 'replaced') { if (!hseOfficer_(me)) fail_('forbidden'); if (p.status !== 'issued') fail_('bad_state'); p.status = req.step; }
    else fail_('bad_state');
    p.updatedAt = new Date().toISOString();
    update_(SHEETS.PPE, p);
    audit_(me.id, 'ppe_' + req.step, p.empId, { item: p.item });
    return { ok: true, ppe: ppeView_(p, ctx) };
  });
}
function api_ppeList(req, me) {
  var ctx = orgCtx_(), all = hseOfficer_(me);
  var rows = readAll_(SHEETS.PPE).filter(function (p) { return all ? (!req.empId || p.empId === req.empId) : p.empId === me.id; })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (p) { return ppeView_(p, ctx); });
  return { ok: true, rows: rows, items: PPE_ITEMS, officer: all };
}

// ---------------- safety figures ----------------
/** Hours worked in [from, to] from counted punches (each check-in paired with the next check-out of the same day). */
function hoursWorked_(from, to) {
  var by = {};
  readAll_(SHEETS.PUNCH).forEach(function (p) { if (p.date >= from && p.date <= to && isCounted_(p)) (by[p.empId + '|' + p.date] = by[p.empId + '|' + p.date] || []).push(p); });
  var ms = 0;
  Object.keys(by).forEach(function (k) {
    var ps = by[k].sort(function (a, b) { return a.ts < b.ts ? -1 : 1; }), open = null;
    ps.forEach(function (p) { var t = Date.parse(p.ts); if (p.type === 'in') open = t; else if (p.type === 'out' && open != null && t > open) { ms += t - open; open = null; } });
  });
  return ms / 3600000;
}
function api_hseStats(req, me) {
  if (!hseOfficer_(me) && !hasRole_(me, 'executive')) fail_('forbidden');
  var to = isoDate_(req.to) || today_(), from = isoDate_(req.from) || addDays_(to, -364);
  if (from > to) fail_('bad_range');
  var hrs = hoursWorked_(from, to);
  var inj = readAll_(SHEETS.INJ).filter(function (x) { var d = String(x.occurredAt).slice(0, 10); return d >= from && d <= to; });
  var lti = inj.filter(function (x) { return x.offFrom; }).length, rec = inj.length;
  var lastLti = readAll_(SHEETS.INJ).filter(function (x) { return x.offFrom; }).map(function (x) { return String(x.occurredAt).slice(0, 10); }).sort().pop() || '';
  var reps = readAll_(SHEETS.HSE).filter(function (x) { var d = String(x.occurredAt).slice(0, 10); return d >= from && d <= to; });
  var byKind = {}, bySev = {}, byMonth = {}, byRoot = {};
  reps.forEach(function (x) { byKind[x.kind] = (byKind[x.kind] || 0) + 1; bySev[x.severity] = (bySev[x.severity] || 0) + 1; var m = String(x.occurredAt).slice(0, 7); byMonth[m] = (byMonth[m] || 0) + 1; if (x.rootCategory) byRoot[x.rootCategory] = (byRoot[x.rootCategory] || 0) + 1; });
  var acts = readAll_(SHEETS.HSEA), t = today_();
  var openActs = acts.filter(function (a) { return a.status === 'open' || a.status === 'done'; });
  var daysSince = lastLti ? Math.round((Date.parse(t + 'T00:00:00Z') - Date.parse(lastLti + 'T00:00:00Z')) / 864e5) : null;
  return { ok: true, from: from, to: to, hours: Math.round(hrs), lti: lti, recordable: rec,
    ltifr: hrs > 0 ? Math.round(lti * 1e6 / hrs * 100) / 100 : null, trir: hrs > 0 ? Math.round(rec * 2e5 / hrs * 100) / 100 : null,
    daysSinceLti: daysSince, reports: reps.length, nearMissRatio: (byKind.incident || 0) ? Math.round((byKind.near_miss || 0) / byKind.incident * 10) / 10 : null,
    byKind: byKind, bySeverity: bySev, byMonth: byMonth, byRoot: byRoot, openActions: openActs.length,
    overdueActions: openActs.filter(function (a) { return a.status === 'open' && String(a.dueDate).slice(0, 10) < t; }).length,
    openReports: readAll_(SHEETS.HSE).filter(function (x) { return x.status !== 'closed'; }).length };
}
hrisHook_('tasks', function (me, ctx, add) {
  add('hse_action', readAll_(SHEETS.HSEA).filter(function (a) { return a.ownerId === me.id && a.status === 'open'; }).length, { tab: 'mine', mine: 'hse' });
  add('ppe_ack', readAll_(SHEETS.PPE).filter(function (p) { return p.empId === me.id && !p.ackAt && p.status === 'issued'; }).length, { tab: 'mine', mine: 'hse' });
  if (hseOfficer_(me)) {
    add('hse_new', readAll_(SHEETS.HSE).filter(function (x) { return x.status === 'open' && !x.investigatorId; }).length, { tab: 'hr', sec: 'safety' });
    add('hse_verify', readAll_(SHEETS.HSEA).filter(function (a) { return a.status === 'done' && a.ownerId !== me.id; }).length, { tab: 'hr', sec: 'safety' });
  }
});

// ======================================================================= 2. push notifications (web push, VAPID)
// Each person turns notifications on per device. The push carries no payload at all (nothing to encrypt, nothing to leak):
// the service worker shows a fixed "you have new items waiting" and opens the app, where the bell shows what it is (the same
// rule as the e-mail and WhatsApp digests: never a name or a detail outside the app). A lazy sweep after write requests, at most
// every PUSH_SWEEP_S_ seconds and PUSH_BATCH_ devices at a time, recounts each subscribed person's bell and pushes only when the
// count went up since the last check. The VAPID key pair is made once (P-256, Utilities.getUuid as the randomness) and kept in
// script properties; the JWT is signed ES256 with a deterministic nonce (HMAC of the key and the hash, as in RFC 6979).
// Only the known browser push services are accepted as endpoints (no request to an arbitrary address).
var PUSH_SWEEP_S_ = 120, PUSH_BATCH_ = 12, PUSH_MAX_PER_EMP_ = 5;
var PUSH_HOSTS_ = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
function pushEndpointOk_(u) {
  var m = String(u || '').match(/^https:\/\/([^\/:?#]+)(\/\S*)$/);
  return !!(m && String(u).length <= 1000 && PUSH_HOSTS_.some(function (re) { return re.test(m[1].toLowerCase()); }));
}
function jMul_(k, P) {
  var C = p256_(), R = [C.I, C.I, C.Z], Q = P;
  while (k > C.Z) { if (k & C.I) R = jAdd_(R, Q); Q = jDouble_(Q); k >>= C.I; }
  return R;
}
function jAffine_(R) { var C = P256_, zi = modInv_(R[2], C.p), zi2 = zi * zi % C.p; return [R[0] * zi2 % C.p, R[1] * zi2 % C.p * zi % C.p]; }
function bigToBytes32_(v) { var h = v.toString(16); while (h.length < 64) h = '0' + h; var o = []; for (var i = 0; i < 64; i += 2) o.push(parseInt(h.substr(i, 2), 16)); return o; }
/** The VAPID key pair { d (BigInt), pub (65 bytes) }: made once and stored in script properties. */
function vapidKeys_() {
  var pr = PropertiesService.getScriptProperties(), C = p256_(), d = pr.getProperty('PUSH_VAPID_D');
  if (!d) {
    var seed = []; for (var i = 0; i < 4; i++) seed = seed.concat(utf8Bytes_(Utilities.getUuid()));
    var dv = bytesToBig_(sha256_(seed)) % (C.n - C.I) + C.I, Q = jAffine_(jMul_(dv, [C.gx, C.gy, C.I]));
    pr.setProperty('PUSH_VAPID_D', bytesToB64u_(bigToBytes32_(dv)));
    pr.setProperty('PUSH_VAPID_PUB', bytesToB64u_([4].concat(bigToBytes32_(Q[0]), bigToBytes32_(Q[1]))));
    d = pr.getProperty('PUSH_VAPID_D');
  }
  return { d: bytesToBig_(b64uToBytes_(d)), pub: b64uToBytes_(pr.getProperty('PUSH_VAPID_PUB')) };
}
/** ES256 over bytes: the 64-byte r||s, nonce k = HMAC-SHA256(d, hash || counter) mod n, low s. */
function es256Sign_(msgBytes, d) {
  var C = p256_(), h = sha256_(msgBytes), e = bytesToBig_(h), key = s8_(bigToBytes32_(d));
  for (var ctr = 0; ctr < 64; ctr++) {
    var k = bytesToBig_(u8_(Utilities.computeHmacSha256Signature(s8_(h.concat([ctr])), key))) % C.n;
    if (k === C.Z) continue;
    var r = jAffine_(jMul_(k, [C.gx, C.gy, C.I]))[0] % C.n; if (r === C.Z) continue;
    var s = modInv_(k, C.n) * ((e + r * d) % C.n) % C.n; if (s === C.Z) continue;
    if (s > C.n / C.T2) s = C.n - s;
    return bigToBytes32_(r).concat(bigToBytes32_(s));
  }
  throw new Error('sign failed');
}
function vapidAuth_(endpoint, keys) {
  var aud = endpoint.match(/^https:\/\/[^\/]+/)[0], s = settings_();
  var enc = function (o) { return bytesToB64u_(utf8Bytes_(JSON.stringify(o))); };
  var input = enc({ typ: 'JWT', alg: 'ES256' }) + '.' + enc({ aud: aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: s.appUrl || 'https://besgasksa.github.io/BG-attendance/' });
  return 'vapid t=' + input + '.' + bytesToB64u_(es256Sign_(utf8Bytes_(input), keys.d)) + ', k=' + bytesToB64u_(keys.pub);
}
/** One push with no body. Returns 'sent', 'gone' (the browser dropped the subscription) or 'failed'. */
function pushSend_(endpoint, keys) {
  if (!pushEndpointOk_(endpoint)) return 'gone';
  try {
    var r = UrlFetchApp.fetch(endpoint, { method: 'post', muteHttpExceptions: true, followRedirects: false, payload: '', contentType: 'application/octet-stream',
      headers: { TTL: '86400', Urgency: 'normal', Topic: 'hr-tasks', Authorization: vapidAuth_(endpoint, keys) } });
    var c = r.getResponseCode();
    return c >= 200 && c < 300 ? 'sent' : c === 404 || c === 410 ? 'gone' : 'failed';
  } catch (e) { return 'failed'; }
}
function pushCount_(emp) {
  try { return (api_myTasks({}, emp).tasks || []).filter(function (x) { return x.kind !== 'delegated'; }).reduce(function (a, x) { return a + (x.count || 0); }, 0); } catch (e) { return 0; }
}
function pushHash_(endpoint) { return bytesToB64u_(sha256_(utf8Bytes_(String(endpoint)))).slice(0, 22); }
function api_pushKey(req, me) {
  var mine = readAll_(SHEETS.PUSH).filter(function (p) { return p.empId === me.id && p.status === 'active'; });
  return { ok: true, key: bytesToB64u_(vapidKeys_().pub), devices: mine.length, hashes: mine.map(function (p) { return p.endpointHash; }) };
}
function api_pushSubscribe(req, me) {
  var ep = String(req.endpoint || '');
  if (!pushEndpointOk_(ep)) fail_('bad_url');
  var n = pushCount_(me);
  return withLock_(function () {
    var h = pushHash_(ep), rows = readAll_(SHEETS.PUSH), now = new Date().toISOString(), cur = rows.filter(function (p) { return p.endpointHash === h; })[0];
    if (cur) { cur.empId = me.id; cur.status = 'active'; cur.endpoint = ep; cur.lastCount = n; cur.updatedAt = now; update_(SHEETS.PUSH, cur); }
    else {
      var mine = rows.filter(function (p) { return p.empId === me.id && p.status === 'active'; }).sort(function (a, b) { return a.updatedAt < b.updatedAt ? -1 : 1; });
      while (mine.length >= PUSH_MAX_PER_EMP_) { var old = mine.shift(); old.status = 'replaced'; old.updatedAt = now; update_(SHEETS.PUSH, old); }
      append_(SHEETS.PUSH, { id: newId_('PS'), empId: me.id, endpoint: ep, endpointHash: h, ua: str_(req.ua, 120), status: 'active', lastCount: n, lastCheckedAt: now, lastSentAt: '', createdAt: now, updatedAt: now });
    }
    audit_(me.id, 'push_on', me.id, {});
    return { ok: true, hash: h };
  });
}
function api_pushUnsubscribe(req, me) {
  return withLock_(function () {
    var h = req.endpoint ? pushHash_(req.endpoint) : String(req.hash || ''), n = 0;
    readAll_(SHEETS.PUSH).forEach(function (p) { if (p.empId === me.id && p.status === 'active' && (req.all || p.endpointHash === h)) { p.status = 'off'; p.updatedAt = new Date().toISOString(); update_(SHEETS.PUSH, p); n++; } });
    return { ok: true, removed: n };
  });
}
/** A test push to each of your own devices (at most once a minute). */
function api_pushTest(req, me) {
  var mine = readAll_(SHEETS.PUSH).filter(function (p) { return p.empId === me.id && p.status === 'active'; });
  if (!mine.length) fail_('no_push_device');
  if (!rateLimit_('pushtest:' + me.id, 1, 60)) fail_('too_many_attempts');
  var keys = vapidKeys_(), out = { sent: 0, gone: 0, failed: 0 }, gone = [];
  mine.forEach(function (p) { var r = pushSend_(p.endpoint, keys); out[r]++; if (r === 'gone') gone.push(p.id); });
  if (gone.length) withLock_(function () { gone.forEach(function (id) { var x = findBy_(SHEETS.PUSH, 'id', id); x.status = 'gone'; x.updatedAt = new Date().toISOString(); update_(SHEETS.PUSH, x); }); });
  return { ok: true, result: out };
}
function pushSweep_() {
  try {
    var c = cache_(); if (c.get('push:sweep')) return; c.put('push:sweep', '1', PUSH_SWEEP_S_);
    var subs = readAll_(SHEETS.PUSH).filter(function (p) { return p.status === 'active'; }).sort(function (a, b) { return String(a.lastCheckedAt) < String(b.lastCheckedAt) ? -1 : 1; }).slice(0, PUSH_BATCH_);
    if (!subs.length) return;
    var ctx = orgCtx_(), keys = null, counts = {}, now = new Date().toISOString(), changes = [];
    subs.forEach(function (p) {
      var e = ctx.emps[p.empId]; if (!e || e.status !== 'active') { changes.push([p.id, { status: 'off' }]); return; }
      var n = counts[e.id] != null ? counts[e.id] : (counts[e.id] = pushCount_(e)), ch = { lastCount: n, lastCheckedAt: now };
      if (n > (Number(p.lastCount) || 0)) { keys = keys || vapidKeys_(); var r = pushSend_(p.endpoint, keys); if (r === 'sent') ch.lastSentAt = now; if (r === 'gone') ch.status = 'gone'; }
      changes.push([p.id, ch]);
    });
    withLock_(function () { changes.forEach(function (x) { var row = findBy_(SHEETS.PUSH, 'id', x[0]); if (row) { Object.keys(x[1]).forEach(function (k) { row[k] = x[1][k]; }); row.updatedAt = now; update_(SHEETS.PUSH, row); } }); });
  } catch (e) { console.error('push: ' + (e && e.message)); }
}
