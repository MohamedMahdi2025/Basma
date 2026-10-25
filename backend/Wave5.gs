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

// ======================================================================= 3. salary structures (grades and bands)
// Each grade has a monthly range: minimum, midpoint, maximum, measured on the whole package (basic + housing + transport + other
// fixed allowances, as compView_ totals it) or on basic only, per grade. A position's grade (positions.grade, free text) links it
// to the range. Per person: compa-ratio = pay / midpoint, range penetration = (pay - min) / (max - min), and below / within / above.
// Who sees what: the ranges themselves are company pay policy (hr role, payroll, executive; not an admin alone, not managers);
// individual compa-ratios are pay, so only the hr role or a payroll holder (canProposeComp_), as for packages. Offers outside the
// range get a warning (Recruitment.gs), and a package proposal answers with where it falls in the range.
var GRADE_BASES = ['total', 'basic'];
function gradeSees_(me) { return me.role === 'hr' || hasRole_(me, 'payroll') || hasRole_(me, 'executive'); }
function gradeView_(g, used) {
  var mn = Number(g.min) || 0, mx = Number(g.max) || 0, md = Number(g.mid) || 0;
  return { id: g.id, code: g.code, nameAr: g.nameAr, nameEn: g.nameEn, basis: g.basis || 'total', min: mn, mid: md, max: mx, spread: mn ? Math.round((mx - mn) / mn * 1000) / 10 : null,
    note: g.note, positions: used || 0, updatedAt: g.updatedAt };
}
function gradeMap_() { var m = {}; readAll_(SHEETS.GRADE).forEach(function (g) { if (g.status !== 'deleted') m[String(g.code).trim().toUpperCase()] = g; }); return m; }
/** Where a monthly package falls in a grade's range; null without a grade or a range. c: compView_-shaped ({ basic, total }). */
function bandOf_(g, c) {
  if (!g || !c) return null;
  var pay = g.basis === 'basic' ? Number(c.basic) || 0 : Number(c.total) || 0, mn = Number(g.min), md = Number(g.mid), mx = Number(g.max);
  return { grade: g.code, basis: g.basis || 'total', pay: r2_(pay), min: mn, mid: md, max: mx, compa: md ? Math.round(pay / md * 1000) / 1000 : null,
    penetration: mx > mn ? Math.round((pay - mn) / (mx - mn) * 1000) / 10 : null, status: pay < mn ? 'below' : pay > mx ? 'above' : 'within', toMin: pay < mn ? r2_(mn - pay) : 0 };
}
function gradeOfPosition_(positionId, gm) { var p = positionId && findBy_(SHEETS.POS, 'id', positionId); return p && p.grade ? (gm || gradeMap_())[String(p.grade).trim().toUpperCase()] || null : null; }
/** Recruitment.gs offers: 'below_band' / 'above_band' for a package outside the position's range, '' otherwise. */
function bandWarn_(positionId, total, basic) {
  var b = bandOf_(gradeOfPosition_(positionId), { total: total, basic: basic });
  return b && b.status !== 'within' ? b.status + '_band' : '';
}
function api_gradeList(req, me) {
  if (!gradeSees_(me)) fail_('forbidden');
  var used = {}; readAll_(SHEETS.POS).forEach(function (p) { if (p.grade) { var k = String(p.grade).trim().toUpperCase(); used[k] = (used[k] || 0) + 1; } });
  var rows = readAll_(SHEETS.GRADE).filter(function (g) { return g.status !== 'deleted'; }).map(function (g) { return gradeView_(g, used[String(g.code).trim().toUpperCase()]); })
    .sort(function (a, b) { return a.min - b.min || (a.code < b.code ? -1 : 1); });
  var codes = {}; rows.forEach(function (g) { codes[String(g.code).toUpperCase()] = 1; });
  var unlinked = Object.keys(used).filter(function (k) { return !codes[k]; });
  return { ok: true, rows: rows, unlinked: unlinked, canEdit: canProposeComp_(me) };
}
function api_gradeSave(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  var g = req.grade || {}, code = str_(g.code, 12).toUpperCase(), mn = num_(g.min), md = num_(g.mid), mx = num_(g.max);
  if (!/^[A-Z0-9][A-Z0-9-]{0,11}$/.test(code) || !str_(g.nameAr, 80)) fail_('missing_fields');
  if (!(mn > 0) || !(md > 0) || !(mx > 0) || !(mn < md && md < mx)) fail_('bad_range');
  if (mx > mn * 4) fail_('band_too_wide');
  if (GRADE_BASES.indexOf(g.basis || 'total') < 0) fail_('bad_value');
  return withLock_(function () {
    var rows = readAll_(SHEETS.GRADE), now = new Date().toISOString(), cur = g.id ? findBy_(SHEETS.GRADE, 'id', g.id) : null;
    if (g.id && !cur) fail_('not_found');
    if (rows.some(function (x) { return x.status !== 'deleted' && String(x.code).toUpperCase() === code && (!cur || x.id !== cur.id); })) fail_('duplicate');
    var row = cur || { id: newId_('GR'), createdBy: me.id, createdAt: now, status: 'active' };
    var before = cur ? { min: cur.min, mid: cur.mid, max: cur.max } : null;
    row.code = code; row.nameAr = str_(g.nameAr, 80); row.nameEn = str_(g.nameEn, 80); row.basis = g.basis || 'total'; row.min = mn; row.mid = md; row.max = mx;
    row.note = str_(g.note, 300); row.updatedBy = me.id; row.updatedAt = now;
    if (cur) update_(SHEETS.GRADE, row); else append_(SHEETS.GRADE, row);
    audit_(me.id, cur ? 'grade_update' : 'grade_create', '', { code: code, before: before, min: mn, mid: md, max: mx });
    return { ok: true, grade: gradeView_(row) };
  });
}
function api_gradeDelete(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  return withLock_(function () {
    var g = findBy_(SHEETS.GRADE, 'id', req.id); if (!g || g.status === 'deleted') fail_('not_found');
    var code = String(g.code).toUpperCase();
    if (readAll_(SHEETS.POS).some(function (p) { return String(p.grade || '').trim().toUpperCase() === code; })) fail_('grade_in_use');
    g.status = 'deleted'; g.updatedAt = new Date().toISOString(); update_(SHEETS.GRADE, g);
    audit_(me.id, 'grade_delete', '', { code: code });
    return { ok: true };
  });
}
/** Everyone's package against their grade: compa-ratio, penetration, below / within / above, and the cost to bring all to the minimum. */
function api_bandReport(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  var t = today_(), comps = currentCompMap_(t), gm = gradeMap_(), pos = {}, ctx = orgCtx_();
  readAll_(SHEETS.POS).forEach(function (p) { pos[p.id] = p; });
  var rows = [], sum = { below: 0, within: 0, above: 0, noGrade: 0, noPackage: 0, toMinMonthly: 0 }, byGrade = {};
  Object.keys(ctx.emps).forEach(function (k) {
    var e = ctx.emps[k]; if (e.status !== 'active') return;
    var p = pos[e.positionId], g = p && p.grade ? gm[String(p.grade).trim().toUpperCase()] : null, c = comps[e.id];
    if (!c) { sum.noPackage++; return; }
    if (!g) { sum.noGrade++; return; }
    var b = bandOf_(g, c); sum[b.status]++; sum.toMinMonthly += b.toMin;
    var bg = byGrade[g.code] = byGrade[g.code] || { grade: g.code, n: 0, compa: 0, below: 0, above: 0 };
    bg.n++; bg.compa += b.compa || 0; if (b.status === 'below') bg.below++; if (b.status === 'above') bg.above++;
    rows.push(Object.assign({ emp: empCard_(e), position: p ? (p.titleAr || p.title || '') : '', positionEn: p ? p.titleEn || '' : '', department: e.department || '' }, b));
  });
  Object.keys(byGrade).forEach(function (k) { byGrade[k].compa = Math.round(byGrade[k].compa / byGrade[k].n * 1000) / 1000; });
  sum.toMinMonthly = r2_(sum.toMinMonthly); sum.toMinYearly = r2_(sum.toMinMonthly * 12);
  rows.sort(function (a, b) { return (a.compa || 0) - (b.compa || 0); });
  audit_(me.id, 'salary_view', '', { report: 'bands', count: rows.length });
  return { ok: true, asOf: t, rows: rows, summary: sum, byGrade: Object.keys(byGrade).sort().map(function (k) { return byGrade[k]; }) };
}

// ======================================================================= 4. retro pay (arrears)
// A package approved with an effective date in a month whose payroll is already locked was never paid for those months. The
// scan compares, for every locked payslip of the last RETRO_MONTHS_ months, the package the slip paid (infoJson.package) with
// the package in force today for that month's end, over the same paid days (and only from the effective date when it falls
// inside the month). Positive differences become one 'arrears' earning in an open month (Payroll.gs ADJ_CODES), recorded in
// retroLog per employee and month so a month is never paid twice. A negative difference (a package lowered back in time) is
// shown but never deducted automatically: recovering it needs the employee's written agreement (Art. 92). Prepared by the hr
// role or payroll; the run itself is still approved by a payroll holder who did not prepare it. GOSI wages of past months are
// corrected in GOSI itself, so each arrears line carries a reminder.
var RETRO_MONTHS_ = 12;
function pkgTotal_(p) { if (!p) return null; var t = (Number(p.basic) || 0) + (Number(p.housing) || 0) + (Number(p.transport) || 0); Object.keys(p.other || {}).forEach(function (k) { t += Number(p.other[k]) || 0; }); return r2_(t); }
function monthEnd_(m) { var y = +m.slice(0, 4), mo = +m.slice(5, 7); return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); }
/** Owed differences per employee: { empId: { months: [{ month, paid, should, days, diff, settled }], owed, overpaid } }. */
function retroCompute_(onlyEmp) {
  var t = today_(), since = addDays_(t, -RETRO_MONTHS_ * 31).slice(0, 7), runs = {}, settled = {}, out = {};
  readAll_(SHEETS.RUN).forEach(function (r) { if (r.status === 'locked') runs[r.id] = r; });
  readAll_(SHEETS.RETRO).forEach(function (x) { if (x.status === 'active') settled[x.empId + '|' + x.month] = x.ref; });
  var comps = {}; readAll_(SHEETS.COMP).forEach(function (c) { if (c.status === 'approved' && (!onlyEmp || c.empId === onlyEmp)) (comps[c.empId] = comps[c.empId] || []).push(c); });
  var compOn = function (empId, d) { var best = null; (comps[empId] || []).forEach(function (c) { if (String(c.effectiveFrom) <= d && better_(c, best)) best = c; }); return best ? compView_(best) : null; };
  var slips = {}; // one per employee and month: the latest locked slip of a locked run
  readAll_(SHEETS.SLIP).forEach(function (sl) {
    if (sl.status !== 'locked' || !runs[sl.runId] || String(sl.month) < since || (onlyEmp && sl.empId !== onlyEmp)) return;
    var k = sl.empId + '|' + sl.month; if (!slips[k] || String(sl.updatedAt) > String(slips[k].updatedAt)) slips[k] = sl;
  });
  Object.keys(slips).forEach(function (k) {
    var sl = slips[k], ij = parseJson_(sl.infoJson, {}), info = ij.info || ij, paidPkg = info.package; if (!paidPkg) return;
    var end = monthEnd_(sl.month), now = compOn(sl.empId, end); if (!now) return;
    var paid = pkgTotal_(paidPkg), should = now.total; if (Math.abs(should - paid) < 0.01) return;
    var from = String(info.from || sl.month + '-01'), to = String(info.to || end), eff = String(now.effectiveFrom).slice(0, 10);
    var start = eff > from ? eff : from; if (start > to) return;
    var full = start === sl.month + '-01' && to === end, days = full ? 30 : Math.min(30, daysBetween_(start, to) + 1);
    var diff = r2_((should - paid) * days / 30), e = out[sl.empId] = out[sl.empId] || { months: [], owed: 0, overpaid: 0 };
    var s = settled[k] || '';
    e.months.push({ month: sl.month, paid: paid, should: should, days: days, diff: diff, settled: s, compRef: now.ref || '' });
    if (!s) { if (diff > 0) e.owed = r2_(e.owed + diff); else e.overpaid = r2_(e.overpaid - diff); }
  });
  Object.keys(out).forEach(function (k) { out[k].months.sort(function (a, b) { return a.month < b.month ? -1 : 1; }); });
  return out;
}
function api_retroScan(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  var ctx = orgCtx_(), data = retroCompute_(''), rows = [];
  Object.keys(data).forEach(function (id) { var e = ctx.emps[id]; if (!e || !payGroupAccess_(me, groupOf_(e))) return; rows.push(Object.assign({ emp: empCard_(e), empId: id }, data[id])); });
  rows.sort(function (a, b) { return b.owed - a.owed || b.overpaid - a.overpaid; });
  var log = readAll_(SHEETS.RETRO).filter(function (x) { return x.status === 'active'; }).length;
  audit_(me.id, 'salary_view', '', { report: 'retro', count: rows.length });
  return { ok: true, rows: rows, owed: r2_(rows.reduce(function (a, r) { return a + r.owed; }, 0)), people: rows.filter(function (r) { return r.owed > 0; }).length, settledMonths: log, monthsBack: RETRO_MONTHS_ };
}
/** Pays an employee's unsettled positive differences as one arrears line in an open month. */
function api_retroApply(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  var month = String(req.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) fail_('bad_date');
  if (req.empId === me.id) fail_('cannot_change_own_salary');
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.empId); if (!emp) fail_('not_found');
    if (!payGroupAccess_(me, groupOf_(emp))) fail_('forbidden');
    if (monthLocked_(emp.id, month)) fail_('month_locked');
    var d = retroCompute_(emp.id)[emp.id], todo = d ? d.months.filter(function (m) { return !m.settled && m.diff > 0; }) : [];
    if (!todo.length) fail_('nothing_owed');
    var amount = r2_(todo.reduce(function (a, m) { return a + m.diff; }, 0)), now = new Date().toISOString();
    var span = todo[0].month + (todo.length > 1 ? '..' + todo[todo.length - 1].month : '');
    var ref = nextRef_('retro', refsOf_(SHEETS.RETRO));
    var adj = { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: emp.id, month: month, kind: 'earning', code: 'arrears', amount: amount,
      reason: 'فروقات بأثر رجعي ' + span + ' (' + ref + ')', enteredBy: me.id, status: 'active', createdAt: now };
    append_(SHEETS.ADJ, adj);
    appendMany_(SHEETS.RETRO, todo.map(function (m) { return { id: newId_('RT'), ref: ref, empId: emp.id, month: m.month, paid: m.paid, should: m.should, days: m.days, diff: m.diff,
      adjId: adj.id, payMonth: month, compRef: m.compRef, status: 'active', createdBy: me.id, createdAt: now }; }));
    audit_(me.id, 'retro_apply', emp.id, { ref: ref, amount: amount, months: todo.length, payMonth: month });
    return { ok: true, ref: ref, amount: amount, months: todo.length, adjRef: adj.ref, warnings: ['gosi_past_months'] };
  });
}
/** Withdraws an arrears line before its month is locked; the months become owed again. */
function api_retroCancel(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  return withLock_(function () {
    var rows = readAll_(SHEETS.RETRO).filter(function (x) { return x.ref === req.ref && x.status === 'active'; });
    if (!rows.length) fail_('not_found');
    if (rows[0].empId === me.id) fail_('cannot_change_own_salary');
    if (monthLocked_(rows[0].empId, rows[0].payMonth)) fail_('month_locked');
    var a = findBy_(SHEETS.ADJ, 'id', rows[0].adjId); if (a && a.status !== 'deleted') { a.status = 'deleted'; update_(SHEETS.ADJ, a); }
    rows.forEach(function (x) { x.status = 'cancelled'; update_(SHEETS.RETRO, x); });
    audit_(me.id, 'retro_cancel', rows[0].empId, { ref: req.ref });
    return { ok: true };
  });
}
function api_retroLog(req, me) {
  if (!canProposeComp_(me)) fail_('forbidden');
  var ctx = orgCtx_(), by = {};
  readAll_(SHEETS.RETRO).forEach(function (x) {
    var g = by[x.ref] = by[x.ref] || { ref: x.ref, emp: empCard_(ctx.emps[x.empId]), payMonth: x.payMonth, months: [], amount: 0, status: x.status, createdAt: x.createdAt, locked: false };
    g.months.push(x.month); g.amount = r2_(g.amount + Number(x.diff));
  });
  var rows = Object.keys(by).map(function (k) { var g = by[k]; g.locked = g.status === 'active' && monthLocked_(readAll_(SHEETS.RETRO).filter(function (x) { return x.ref === k; })[0].empId, g.payMonth); return g; })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  return { ok: true, rows: rows };
}
