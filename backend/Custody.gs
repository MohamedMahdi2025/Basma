/**
 * Company assets in employees' custody, and offboarding clearance (gap study items 7 and 8), 2026-09-30.
 *
 * Custody: HR registers an asset (vehicle, POS device, phone, laptop, uniform, cylinder set, card, tool) and hands it to
 * someone; the employee confirms receipt in the app (their signed-in session is a passkey / PIN sign-in). On return HR
 * records the condition; for loss or damage HR proposes a charge and a payroll person other than the proposer approves
 * it, which becomes a payroll deduction (payroll's own cap of half the wage applies; check Art. 91 for the amount).
 *
 * Clearance: opened by HR, and automatically when a resignation is approved. Tasks for the manager (handover), HR
 * (system access, GOSI, Qiwa / Muqeem, service certificate, Art. 64) and payroll (final settlement). Company assets
 * clear by themselves when nothing is held. "Settlement paid" is the last step, by a payroll person who did not prepare
 * the settlement, and only after every other task is done.
 */

var ASSET_TYPES = { vehicle: 1, pos: 1, phone: 1, laptop: 1, uniform: 1, cylinders: 1, card: 1, tool: 1, other: 1 };

function publicAsset_(a, holder) {
  return { id: a.id, ref: a.ref, type: a.type, nameAr: a.nameAr, serial: a.serial, value: Number(a.value) || 0, status: a.status, note: a.note, holder: holder || null };
}
function publicCustody_(c, ctx, assets) {
  var a = assets[c.assetId] || {};
  return { id: c.id, asset: a.id ? publicAsset_(a) : null, emp: empCard_(ctx.emps[c.empId]), handedAt: c.handedAt, conditionOut: c.conditionOut, ackAt: c.ackAt,
    returnedAt: c.returnedAt, conditionIn: c.conditionIn, status: c.status, charge: c.charge === '' ? null : Number(c.charge), chargeStatus: c.chargeStatus, note: c.note };
}
function api_assetSave(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var x = req.asset || {};
  if (!ASSET_TYPES[x.type] || !str_(x.nameAr, 120)) fail_('missing_fields');
  return withLock_(function () {
    var now = new Date().toISOString(), a = x.id ? findBy_(SHEETS.ASSET, 'id', x.id) : null;
    if (x.id && !a) fail_('not_found');
    var serial = str_(x.serial, 80);
    if (serial && readAll_(SHEETS.ASSET).some(function (o) { return o.serial === serial && o.id !== x.id && o.status !== 'retired'; })) fail_('duplicate_serial');
    if (!a) a = { id: newId_('T'), ref: nextRef_('asset', refsOf_(SHEETS.ASSET)), status: 'available', createdAt: now };
    a.type = x.type; a.nameAr = str_(x.nameAr, 120); a.serial = serial; a.value = Math.max(0, Number(x.value) || 0); a.note = str_(x.note, 300); a.updatedAt = now;
    if (x.retire && a.status === 'available') a.status = 'retired';
    if (a._row) update_(SHEETS.ASSET, a); else append_(SHEETS.ASSET, a);
    audit_(me.id, 'asset_save', '', { ref: a.ref });
    return { ok: true, asset: publicAsset_(a) };
  });
}
/** A proposed charge with only what the payroll approver needs: the asset, whose custody, the return note, the amount. */
function chargeView_(c, ctx, assets) {
  var a = assets[c.assetId] || {}, e = ctx.emps[c.empId], by = ctx.emps[c.chargeBy];
  return { id: c.id, asset: a.id ? { ref: a.ref, type: a.type, nameAr: a.nameAr, serial: a.serial, value: Number(a.value) || 0 } : null,
    emp: e ? { id: e.id, empNo: String(e.empNo), name: e.name } : null, returnedAt: c.returnedAt, status: c.status, conditionIn: c.conditionIn,
    charge: Number(c.charge) || 0, chargeStatus: c.chargeStatus, proposedBy: by ? by.name : '' };
}
/**
 * Everyone: `mine`, what they hold now. HR: `rows`, every asset with its holder, and `charges`, every proposed charge
 * (the hr role only: an administrator alone gets none, the amounts are pay). A payroll holder: `toDecide`, the charges
 * they may approve (never their own custody or their own proposal), with no other employee data.
 */
function api_assetList(req, me) {
  var ctx = orgCtx_(), assets = {}, held = {}, pay = hasRole_(me, 'payroll');
  readAll_(SHEETS.ASSET).forEach(function (a) { assets[a.id] = a; });
  var cust = readAll_(SHEETS.CUST);
  cust.forEach(function (c) { if (c.status === 'held') held[c.assetId] = c; });
  var mine = cust.filter(function (c) { return c.empId === me.id && (c.status === 'held' || c.chargeStatus === 'proposed'); }).map(function (c) { return publicCustody_(c, ctx, assets); });
  var toDecide = pay ? cust.filter(function (c) { return c.chargeStatus === 'proposed' && c.chargeBy !== me.id && c.empId !== me.id; }).map(function (c) { return chargeView_(c, ctx, assets); }) : [];
  if (!isHr_(me)) return pay ? { ok: true, mine: mine, toDecide: toDecide, canApproveCharge: true } : { ok: true, mine: mine };
  var rows = Object.keys(assets).map(function (k) { var a = assets[k], c = held[k]; return publicAsset_(a, c ? { custodyId: c.id, emp: empCard_(ctx.emps[c.empId]), since: c.handedAt, ack: !!c.ackAt } : null); });
  var charges = canPayroll_(me) ? cust.filter(function (c) { return c.chargeStatus === 'proposed'; }).map(function (c) { return publicCustody_(c, ctx, assets); }) : [];
  return { ok: true, rows: rows, mine: mine, charges: charges, canApproveCharge: pay, toDecide: toDecide };
}
function api_assetAssign(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  return withLock_(function () {
    var a = findBy_(SHEETS.ASSET, 'id', req.assetId), emp = findBy_(SHEETS.EMP, 'id', req.empId);
    if (!a || !emp || emp.status !== 'active') fail_('not_found');
    if (a.status !== 'available') fail_('asset_not_available');
    var now = new Date().toISOString();
    append_(SHEETS.CUST, { id: newId_('U'), assetId: a.id, empId: emp.id, handedAt: now, handedBy: me.id, conditionOut: str_(req.condition, 200) || 'سليم', ackAt: '', returnedAt: '',
      returnedTo: '', conditionIn: '', status: 'held', charge: '', chargeStatus: '', chargeBy: '', chargeApprovedBy: '', note: '' });
    a.status = 'assigned'; a.updatedAt = now; update_(SHEETS.ASSET, a);
    audit_(me.id, 'asset_assign', emp.id, { ref: a.ref });
    return { ok: true };
  });
}
function api_assetAck(req, me) {
  return withLock_(function () {
    var c = findBy_(SHEETS.CUST, 'id', req.id);
    if (!c || c.empId !== me.id || c.status !== 'held') fail_('not_found');
    if (c.ackAt) return { ok: true, already: true };
    c.ackAt = new Date().toISOString(); update_(SHEETS.CUST, c);
    audit_(me.id, 'asset_ack', me.id, { custody: c.id });
    return { ok: true };
  });
}
/** HR records the return: good (the asset is free again), damaged or lost (a charge may be proposed). */
function api_assetReturn(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var cond = ['good', 'damaged', 'lost'].indexOf(req.condition) >= 0 ? req.condition : '';
  if (!cond) fail_('bad_value');
  return withLock_(function () {
    var c = findBy_(SHEETS.CUST, 'id', req.id);
    if (!c || c.status !== 'held') fail_('not_found');
    if (c.empId === me.id) fail_('forbidden');
    var a = findBy_(SHEETS.ASSET, 'id', c.assetId), now = new Date().toISOString(), charge = Math.max(0, Number(req.charge) || 0);
    if (charge && cond === 'good') fail_('bad_value');
    if (charge && me.role !== 'hr') fail_('forbidden'); // a charge becomes a pay deduction: the hr role proposes it
    if (charge && a && Number(a.value) && charge > Number(a.value)) fail_('charge_over_value');
    c.status = cond === 'good' ? 'returned' : cond; c.returnedAt = now; c.returnedTo = me.id; c.conditionIn = str_(req.note, 300) || cond;
    if (charge) { c.charge = charge; c.chargeStatus = 'proposed'; c.chargeBy = me.id; }
    update_(SHEETS.CUST, c);
    if (a) { a.status = cond === 'lost' ? 'lost' : cond === 'damaged' ? 'retired' : 'available'; a.updatedAt = now; update_(SHEETS.ASSET, a); }
    audit_(me.id, 'asset_return', c.empId, { ref: a && a.ref, condition: cond, charge: charge });
    return { ok: true };
  });
}
/** A payroll person other than the proposer approves (-> deduction next open month) or rejects the charge. */
function api_assetCharge(req, me) {
  if (!hasRole_(me, 'payroll')) fail_('forbidden');
  return withLock_(function () {
    var c = findBy_(SHEETS.CUST, 'id', req.id);
    if (!c || c.chargeStatus !== 'proposed') fail_('not_found');
    if (c.chargeBy === me.id || c.empId === me.id) fail_('second_approver_required');
    var a = findBy_(SHEETS.ASSET, 'id', c.assetId);
    if (req.approve) {
      var month = today_().slice(0, 7);
      if (monthLocked_(c.empId, month)) month = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString().slice(0, 7);
      append_(SHEETS.ADJ, { id: newId_('A'), ref: nextRef_('adjustment', refsOf_(SHEETS.ADJ)), empId: c.empId, month: month, kind: 'deduction', code: 'other_deduction',
        amount: Number(c.charge), reason: 'عهدة ' + (a ? a.ref + ' ' + a.nameAr : ''), enteredBy: me.id, status: 'active', createdAt: new Date().toISOString() });
      c.chargeStatus = 'approved'; c.note = month;
    } else { c.chargeStatus = 'rejected'; c.note = str_(req.note, 300); }
    c.chargeApprovedBy = me.id; update_(SHEETS.CUST, c);
    audit_(me.id, 'asset_charge', c.empId, { approved: !!req.approve, amount: Number(c.charge) });
    return { ok: true };
  });
}

// ---------------- offboarding clearance ----------------

var CLR_TASKS = [
  { key: 'handover', owner: 'manager', ar: 'تسليم الأعمال والملفات للمدير أو البديل', en: 'Hand over work and files to the manager or replacement' },
  { key: 'assets', owner: 'system', ar: 'إعادة كل العهد (تحسب تلقائيا من سجل العهد)', en: 'Return all company assets (checked automatically)' },
  { key: 'access', owner: 'hr', ar: 'إيقاف صلاحيات الأنظمة وفك ربط جهاز الحضور', en: 'Close system access and unlink the attendance device' },
  { key: 'settlement', owner: 'payroll', ar: 'تجهيز المخالصة النهائية ومكافأة نهاية الخدمة', en: 'Prepare the final settlement and end-of-service award' },
  { key: 'gosi', owner: 'hr', ar: 'استبعاد الموظف من التأمينات الاجتماعية', en: 'Remove the employee from GOSI' },
  { key: 'qiwa', owner: 'hr', ar: 'إنهاء العقد في قوى، وتأشيرة الخروج النهائي لغير السعوديين (مقيم)', en: 'End the contract in Qiwa; final exit visa for non-Saudis (Muqeem)' },
  { key: 'certificate', owner: 'hr', ar: 'إصدار شهادة الخدمة (المادة 64)', en: 'Issue the service certificate (Art. 64)' },
  { key: 'paid', owner: 'payroll', ar: 'صرف المخالصة (بعد اكتمال كل ما سبق، من غير معدها)', en: 'Pay the settlement (after everything else, by someone other than the preparer)' }
];
function heldBy_(empId) { return readAll_(SHEETS.CUST).filter(function (c) { return c.empId === empId && c.status === 'held'; }).length; }
function clearanceView_(x, me, ctx) {
  var emp = ctx.emps[x.empId], tasks = parseJson_(x.tasksJson, []), held = heldBy_(x.empId);
  tasks.forEach(function (t) {
    if (t.key === 'assets') { t.status = held ? 'open' : 'done'; t.held = held; }
    // The settlement is prepared like a payroll draft (the hr role or a payroll holder) and paid only by a payroll
    // holder who did not prepare it, so a company with a single payroll holder can still finish a clearance.
    var byMe = t.key === 'settlement' ? canPayroll_(me) : t.owner === 'hr' ? isHr_(me) : t.owner === 'payroll' ? hasRole_(me, 'payroll') : t.owner === 'manager' ? (emp && manages_(me, emp, ctx)) || isHr_(me) : false;
    t.canTick = t.status !== 'done' && byMe && me.id !== x.empId;
  });
  var others = tasks.filter(function (t) { return t.key !== 'paid'; }).every(function (t) { return t.status === 'done'; });
  var paid = tasks.filter(function (t) { return t.key === 'paid'; })[0];
  if (paid && !others) paid.canTick = false;
  var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
  return { id: x.id, ref: x.ref, emp: empCard_(emp), lastDay: String(x.lastDay).slice(0, 10), reason: x.reason, tasks: tasks, done: done, total: tasks.length,
    status: done === tasks.length ? 'cleared' : 'open', daysLeft: daysBetween_(today_(), String(x.lastDay).slice(0, 10)) };
}
function clearanceOpen_(emp, lastDay, reason, byId) {
  if (readAll_(SHEETS.CLR).some(function (x) { return x.empId === emp.id && x.status !== 'cancelled'; })) return null;
  var row = { id: newId_('K'), ref: nextRef_('clearance', refsOf_(SHEETS.CLR)), empId: emp.id, lastDay: lastDay, reason: reason,
    tasksJson: JSON.stringify(CLR_TASKS.map(function (t) { return { key: t.key, owner: t.owner, ar: t.ar, en: t.en, status: 'open', by: '', at: '' }; })),
    status: 'open', createdBy: byId, createdAt: new Date().toISOString(), clearedAt: '' };
  append_(SHEETS.CLR, row);
  if (typeof exitSurveyOpen_ === 'function') exitSurveyOpen_(emp); // the exit interview opens with the clearance (Engage.gs)
  return row;
}
function api_clearanceStart(req, me) {
  if (!isHr_(me)) fail_('forbidden');
  var reason = ['resignation', 'termination', 'contract_end', 'retirement', 'other'].indexOf(req.reason) >= 0 ? req.reason : 'other';
  return withLock_(function () {
    var emp = findBy_(SHEETS.EMP, 'id', req.empId), last = isoDate_(req.lastDay);
    if (!emp || emp.status !== 'active') fail_('not_found');
    if (emp.id === me.id) fail_('forbidden');
    if (!last) fail_('bad_date');
    var row = clearanceOpen_(emp, last, reason, me.id);
    if (!row) fail_('already_exists');
    if (!emp.lastWorkingDay) { emp.lastWorkingDay = last; emp.updatedAt = new Date().toISOString(); update_(SHEETS.EMP, emp); }
    audit_(me.id, 'clearance_start', emp.id, { ref: row.ref, lastDay: last });
    return { ok: true, clearance: clearanceView_(row, me, orgCtx_()) };
  });
}
function api_clearanceList(req, me) {
  var ctx = orgCtx_(), hr = isHr_(me), pay = hasRole_(me, 'payroll');
  var rows = readAll_(SHEETS.CLR).filter(function (x) { var e = ctx.emps[x.empId]; return x.status !== 'cancelled' && (hr || pay || x.empId === me.id || (e && manages_(me, e, ctx))); })
    .sort(function (a, b) { return a.lastDay < b.lastDay ? -1 : 1; }).map(function (x) { return clearanceView_(x, me, ctx); });
  return { ok: true, rows: rows };
}
function api_clearanceTask(req, me) {
  return withLock_(function () {
    var x = findBy_(SHEETS.CLR, 'id', req.id), ctx = orgCtx_();
    if (!x || x.status === 'cancelled') fail_('not_found');
    var view = clearanceView_(x, me, ctx), t = view.tasks.filter(function (k) { return k.key === req.key; })[0];
    if (!t || t.key === 'assets') fail_('bad_value');
    // "incomplete" only for someone who could pay once everything else is done; anyone else is simply not allowed.
    if (!t.canTick) fail_(t.key === 'paid' && hasRole_(me, 'payroll') && me.id !== x.empId && t.status !== 'done' ? 'clearance_incomplete' : 'forbidden');
    var tasks = parseJson_(x.tasksJson, []), raw = tasks.filter(function (k) { return k.key === req.key; })[0];
    if (raw.key === 'paid') { var prep = tasks.filter(function (k) { return k.key === 'settlement'; })[0]; if (prep && prep.by === me.id) fail_('second_approver_required'); }
    raw.status = 'done'; raw.by = me.id; raw.at = new Date().toISOString(); raw.note = str_(req.note, 300);
    x.tasksJson = JSON.stringify(tasks);
    var v2 = clearanceView_(x, me, ctx);
    if (v2.status === 'cleared') { x.status = 'cleared'; x.clearedAt = new Date().toISOString(); }
    update_(SHEETS.CLR, x);
    audit_(me.id, 'clearance_task', x.empId, { ref: x.ref, task: raw.key });
    return { ok: true, clearance: clearanceView_(x, me, ctx) };
  });
}
