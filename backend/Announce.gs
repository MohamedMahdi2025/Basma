/**
 * Announcements (الإعلانات), Wave 2, 2026-10-14. HR writes a draft (ANN-YYYY-00001) for everyone, departments (with their
 * sub-departments), positions or named people; publishes it (now or from publishAt) with an optional expiry, pinning and
 * a required acknowledgement. Employees see only what is addressed to them; reads and acknowledgements are recorded once
 * per person, and HR sees who has not acknowledged yet.
 */

var ANN_KINDS = ['general', 'policy', 'event', 'urgent', 'celebration'];

function annAudience_(a, ctx) {
  var aud = parseJson_(a.audienceJson, {}), out = {};
  var emps = Object.keys(ctx.emps).map(function (k) { return ctx.emps[k]; }).filter(function (e) { return e.status === 'active'; });
  if (aud.all) { emps.forEach(function (e) { out[e.id] = 1; }); return out; }
  var depts = {};
  (aud.departmentIds || []).forEach(function (d) { depts[d] = 1; });
  var inDept = function (e) {
    for (var d = ctx.depts[e.departmentId], i = 0; d && i < 25; d = ctx.depts[d.parentId], i++) if (depts[d.id]) return true;
    return false;
  };
  emps.forEach(function (e) {
    if (inDept(e) || (aud.positionIds || []).indexOf(e.positionId) >= 0 || (aud.empIds || []).indexOf(e.id) >= 0) out[e.id] = 1;
  });
  return out;
}
function annLive_(a, now) {
  return a.status === 'published' && String(a.publishAt || '') <= now && (!a.expiresAt || String(a.expiresAt) > now);
}
function annNowIso_() { return new Date().toISOString(); }
/** ISO date or datetime -> ISO datetime (a date alone is midnight Riyadh). */
function annWhen_(v) {
  v = String(v || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(Date.parse(v + 'T00:00:00+03:00')).toISOString();
  var t = Date.parse(v);
  return isNaN(t) ? '' : new Date(t).toISOString();
}
function annPublic_(a, me, reads, full, ctx) {
  var r = reads.filter(function (x) { return x.annId === a.id && x.empId === me.id; })[0];
  var v = { id: a.id, ref: a.ref, kind: a.kind, titleAr: a.titleAr, titleEn: a.titleEn, bodyAr: a.bodyAr, bodyEn: a.bodyEn, pinned: bool_(a.pinned),
    requireAck: bool_(a.requireAck), publishAt: a.publishAt, expiresAt: a.expiresAt, status: a.status, publishedAt: a.publishedAt,
    readAt: r ? r.readAt : '', ackAt: r ? r.ackAt : '' };
  if (full) {
    var aud = annAudience_(a, ctx), ids = Object.keys(aud), rs = reads.filter(function (x) { return x.annId === a.id && aud[x.empId]; });
    v.audience = parseJson_(a.audienceJson, {}); v.audienceSize = ids.length; v.reads = rs.length; v.acks = rs.filter(function (x) { return x.ackAt; }).length;
    v.createdBy = empCard_(ctx.emps[a.createdBy]); v.publishedBy = empCard_(ctx.emps[a.publishedBy]);
    if (bool_(a.requireAck)) { var acked = {}; rs.forEach(function (x) { if (x.ackAt) acked[x.empId] = 1; }); v.notAcked = ids.filter(function (id) { return !acked[id]; }).map(function (id) { return empCard_(ctx.emps[id]); }); }
  }
  return v;
}

function api_annSave(req, me) {
  var d = req.announcement || {};
  return withLock_(function () {
    var ctx = orgCtx_(), now = annNowIso_(), a = d.id ? findBy_(SHEETS.ANN, 'id', d.id) : null;
    if (d.id && !a) fail_('not_found');
    if (a && a.status !== 'draft') fail_('bad_request');
    var titleAr = str_(d.titleAr, 150), bodyAr = str_(d.bodyAr, 4000);
    if (!titleAr || !bodyAr) fail_('missing_fields');
    var kind = ANN_KINDS.indexOf(d.kind) >= 0 ? d.kind : 'general';
    var au = d.audience || {}, aud = au.all ? { all: true } : { departmentIds: [], positionIds: [], empIds: [] };
    if (!au.all) {
      (au.departmentIds || []).forEach(function (id) { if (!ctx.depts[id]) fail_('not_found'); aud.departmentIds.push(id); });
      (au.positionIds || []).forEach(function (id) { if (!findBy_(SHEETS.POS, 'id', id)) fail_('not_found'); aud.positionIds.push(id); });
      (au.empIds || []).forEach(function (id) { if (!ctx.emps[id]) fail_('not_found'); aud.empIds.push(id); });
      if (!aud.departmentIds.length && !aud.positionIds.length && !aud.empIds.length) fail_('missing_fields');
    }
    var pub = d.publishAt ? annWhen_(d.publishAt) : '', exp = d.expiresAt ? annWhen_(d.expiresAt) : '';
    if ((d.publishAt && !pub) || (d.expiresAt && !exp) || (exp && exp <= (pub || now))) fail_('bad_date');
    var fresh = !a;
    if (!a) a = { id: newId_('B'), ref: nextRef_('announcement', refsOf_(SHEETS.ANN)), status: 'draft', createdBy: me.id, createdAt: now, publishedBy: '', publishedAt: '' };
    a.kind = kind; a.titleAr = titleAr; a.titleEn = str_(d.titleEn, 150); a.bodyAr = bodyAr; a.bodyEn = str_(d.bodyEn, 4000); a.audienceJson = JSON.stringify(aud);
    a.pinned = !!d.pinned; a.requireAck = !!d.requireAck; a.publishAt = pub; a.expiresAt = exp; a.updatedAt = now;
    if (fresh) append_(SHEETS.ANN, a); else update_(SHEETS.ANN, a);
    audit_(me.id, fresh ? 'ann_create' : 'ann_update', '', { ref: a.ref });
    return { ok: true, announcement: annPublic_(a, me, [], true, ctx) };
  });
}

function api_annPublish(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), a = findBy_(SHEETS.ANN, 'id', req.id), now = annNowIso_();
    if (!a || a.status !== 'draft') fail_('not_found');
    if (a.expiresAt && String(a.expiresAt) <= now) fail_('bad_date');
    a.status = 'published'; a.publishedBy = me.id; a.publishedAt = now; if (!a.publishAt) a.publishAt = now; a.updatedAt = now;
    update_(SHEETS.ANN, a);
    audit_(me.id, 'ann_publish', '', { ref: a.ref });
    return { ok: true, announcement: annPublic_(a, me, readAll_(SHEETS.ANNR), true, ctx) };
  });
}

function api_annArchive(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), a = findBy_(SHEETS.ANN, 'id', req.id);
    if (!a || a.status === 'archived') fail_('not_found');
    a.status = 'archived'; a.updatedAt = annNowIso_();
    update_(SHEETS.ANN, a);
    audit_(me.id, 'ann_archive', '', { ref: a.ref });
    return { ok: true, announcement: annPublic_(a, me, readAll_(SHEETS.ANNR), true, ctx) };
  });
}

function api_annList(req, me) {
  var ctx = orgCtx_(), reads = readAll_(SHEETS.ANNR);
  return { ok: true, kinds: ANN_KINDS, rows: readAll_(SHEETS.ANN).filter(function (a) { return !req.status || a.status === req.status; })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).map(function (a) { return annPublic_(a, me, reads, true, ctx); }) };
}

function annMine_(me, ctx) {
  var now = annNowIso_();
  return readAll_(SHEETS.ANN).filter(function (a) { return annLive_(a, now) && annAudience_(a, ctx)[me.id]; });
}
function api_myAnnouncements(req, me) {
  var ctx = orgCtx_(), reads = readAll_(SHEETS.ANNR);
  var rows = annMine_(me, ctx).sort(function (a, b) { return (bool_(b.pinned) - bool_(a.pinned)) || (String(a.publishAt) < String(b.publishAt) ? 1 : -1); })
    .map(function (a) { return annPublic_(a, me, reads, false, ctx); });
  return { ok: true, rows: rows, unread: rows.filter(function (x) { return !x.readAt; }).length, toAck: rows.filter(function (x) { return x.requireAck && !x.ackAt; }).length };
}

function api_annRead(req, me) {
  return withLock_(function () {
    var ctx = orgCtx_(), a = findBy_(SHEETS.ANN, 'id', req.id), now = annNowIso_();
    if (!a || !annLive_(a, now) || !annAudience_(a, ctx)[me.id]) fail_('not_found');
    var r = readAll_(SHEETS.ANNR).filter(function (x) { return x.annId === a.id && x.empId === me.id; })[0], ack = req.ack === true && bool_(a.requireAck);
    if (!r) { r = { id: newId_('R'), annId: a.id, empId: me.id, readAt: now, ackAt: ack ? now : '' }; append_(SHEETS.ANNR, r); }
    else if (ack && !r.ackAt) { r.ackAt = now; update_(SHEETS.ANNR, r); }
    if (ack) audit_(me.id, 'ann_ack', me.id, { ref: a.ref });
    return { ok: true, readAt: r.readAt, ackAt: r.ackAt };
  });
}

hrisHook_('tasks', function (me, ctx, add) {
  var acked = {};
  readAll_(SHEETS.ANNR).forEach(function (x) { if (x.empId === me.id && x.ackAt) acked[x.annId] = 1; });
  add('announcement_ack', annMine_(me, ctx).filter(function (a) { return bool_(a.requireAck) && !acked[a.id]; }).length, { tab: 'file' });
});
