// Wave 5 screens (2026-10-25): the modules a second pass over the leading HRIS found missing
// (docs/research/2026-10-25-world-class-gap-check.md). Built on the Wave 2 screen kit (window.W2K from js/wave2.js, loaded first).
// Every rule is enforced on the server (backend/Wave5.gs); these screens only show what each answer allows.
(function(){
'use strict';
var K = window.W2K;
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, hse: false, manager: false }; }
function pct(v, max){ return Math.max(0, Math.min(100, max ? v / max * 100 : 0)); }
function bars(obj, prefix){
  var ks = Object.keys(obj || {}), max = Math.max.apply(null, ks.map(function(k){ return obj[k]; }).concat([1]));
  return ks.length && window.Viz ? Viz.hbars(ks.sort(function(a, b){ return obj[b] - obj[a]; }).map(function(k){ return { label: t(prefix + k), value: obj[k], text: K.n(obj[k]) }; }), { max: max }) : K.empty('chart-bar-horizontal', t('w2None'));
}

// =================================================================== 1. HEALTH, SAFETY AND ENVIRONMENT
Object.assign(T.ar, {
  hsTitle:'الصحة والسلامة والبيئة', hsLead:'بلّغ عن أي خطر أو حادث وشيك أو حادث أو تسرب أو ضرر في الممتلكات، باسمك أو دون اسم. يحقق مسؤول السلامة ويضع إجراءات تصحيحية لكل منها مسؤول وموعد، ولا يُغلق البلاغ قبل التحقق منها. إصابات العمل وإشعار التأمينات في صفحة علاقات الموظفين.',
  hsReport:'بلاغ جديد', hsReports:'البلاغات', hsActions:'الإجراءات التصحيحية', hsPpe:'معدات الوقاية', hsFigures:'مؤشرات السلامة',
  hsKind:'النوع', hsSev:'الخطورة', hsWhen:'متى حدث', hsPlace:'المكان', hsZone:'الموقع', hsWhat:'ماذا حدث', hsDone:'ما الذي فُعل فورا', hsAnon:'بلّغ دون ذكر اسمي (لا يُحفظ أي رابط بك، فلن تستطيع متابعة البلاغ)',
  hsk_hazard:'خطر', hsk_near_miss:'حادث وشيك', hsk_incident:'حادث', hsk_environment:'بيئي (تسرب أو انبعاث)', hsk_property:'ضرر في الممتلكات',
  hsv_low:'منخفضة', hsv_medium:'متوسطة', hsv_high:'عالية', hsv_critical:'حرجة',
  hss_open:'جديد', hss_investigating:'قيد التحقيق', hss_actions:'إجراءات قائمة', hss_closed:'مغلق',
  hsr_people:'سلوك أو تدريب', hsr_equipment:'معدات', hsr_procedure:'إجراء عمل', hsr_environment:'بيئة العمل', hsr_management:'إدارة وإشراف',
  hsInvest:'المحقق', hsRoot:'السبب الجذري', hsRootCat:'فئة السبب', hsSaveRoot:'حفظ السبب', hsAssign:'تعيين محقق', hsAddAct:'إجراء تصحيحي', hsClose:'إغلاق البلاغ', hsCloseNote:'ملخص الإغلاق',
  hsActTitle:'الإجراء', hsOwner:'المسؤول', hsDue:'الموعد', hsMarkDone:'تم التنفيذ', hsWhatDone:'ما الذي نُفذ', hsVerify:'تحقق', hsReopen:'إعادة فتح', hsCancel:'إلغاء',
  hsa_open:'مفتوح', hsa_done:'بانتظار التحقق', hsa_verified:'تم التحقق', hsa_cancelled:'ملغى', hsOverdue:'متأخر', hsAnonymous:'دون اسم', hsBy:'المبلغ', hsMineOnly:'إجراءاتي',
  hsIssue:'صرف معدات', hsItem:'المعدة', hsItemName:'اسم المعدة', hsSize:'المقاس', hsQty:'الكمية', hsIssued:'تاريخ الصرف', hsReplace:'موعد الاستبدال', hsAck:'استلمتها', hsAcked:'استلمها',
  hsReturned:'أعيدت', hsReplaced:'استبدلت', hsReplaceSoon:'يحين استبدالها', pps_issued:'مصروفة', pps_returned:'معادة', pps_replaced:'مستبدلة',
  ppe_helmet:'خوذة', ppe_safety_shoes:'حذاء سلامة', ppe_gloves:'قفازات', ppe_goggles:'نظارة واقية', ppe_coverall:'بدلة عمل', ppe_vest:'سترة عاكسة', ppe_ear_protection:'واقي أذن', ppe_respirator:'كمامة تنفس', ppe_harness:'حزام أمان', ppe_fire_suit:'بدلة مقاومة للحريق', ppe_other:'أخرى',
  hsLtifr:'معدل الإصابات المضيعة للوقت (LTIFR)', hsLtifrSub:'لكل مليون ساعة عمل', hsTrir:'معدل الإصابات المسجلة (TRIR)', hsTrirSub:'لكل 200,000 ساعة', hsDaysSince:'أيام دون إصابة مضيعة للوقت', hsHours:'ساعات العمل في الفترة',
  hsOpenActs:'إجراءات مفتوحة', hsOverdueActs:'إجراءات متأخرة', hsByKind:'البلاغات حسب النوع', hsBySev:'حسب الخطورة', hsByRoot:'الأسباب الجذرية', hsNearMiss:'حادث وشيك لكل حادث', hsYear:'آخر 12 شهرا',
  hsNoReports:'لا توجد بلاغات بعد.', hsNoActs:'لا توجد إجراءات.', hsNoPpe:'لم تُصرف معدات بعد.', hsSent:'وصل البلاغ، شكرا لك',
  e_bad_kind:'اختر نوعا صحيحا.', e_actions_open:'لا يُغلق البلاغ قبل التحقق من كل إجراءاته أو إلغائها.', e_root_cause_required:'سجّل السبب الجذري قبل الإغلاق.', e_cannot_verify_own:'لا يتحقق أحد من إجراء هو مسؤول عنه.', e_bad_state:'لا يمكن ذلك في الحالة الحالية.', e_already_closed:'السجل مغلق.'
});
Object.assign(T.en, {
  hsTitle:'Health, safety and environment', hsLead:'Report any hazard, near miss, incident, spill or property damage, by name or anonymously. The safety officer investigates and sets corrective actions, each with an owner and a due date; a report closes only once they are verified. Work injuries and the GOSI notice are on the employee relations page.',
  hsReport:'New report', hsReports:'Reports', hsActions:'Corrective actions', hsPpe:'Protective equipment', hsFigures:'Safety figures',
  hsKind:'Type', hsSev:'Severity', hsWhen:'When it happened', hsPlace:'Where', hsZone:'Site', hsWhat:'What happened', hsDone:'What was done straight away', hsAnon:'Report without my name (no link to you is kept, so you cannot follow it up)',
  hsk_hazard:'Hazard', hsk_near_miss:'Near miss', hsk_incident:'Incident', hsk_environment:'Environmental (spill or release)', hsk_property:'Property damage',
  hsv_low:'Low', hsv_medium:'Medium', hsv_high:'High', hsv_critical:'Critical',
  hss_open:'New', hss_investigating:'Investigating', hss_actions:'Actions open', hss_closed:'Closed',
  hsr_people:'Behaviour or training', hsr_equipment:'Equipment', hsr_procedure:'Work procedure', hsr_environment:'Work environment', hsr_management:'Management and supervision',
  hsInvest:'Investigator', hsRoot:'Root cause', hsRootCat:'Cause category', hsSaveRoot:'Save the cause', hsAssign:'Assign an investigator', hsAddAct:'Corrective action', hsClose:'Close the report', hsCloseNote:'Closing summary',
  hsActTitle:'Action', hsOwner:'Owner', hsDue:'Due', hsMarkDone:'Mark done', hsWhatDone:'What was done', hsVerify:'Verify', hsReopen:'Reopen', hsCancel:'Cancel',
  hsa_open:'Open', hsa_done:'Waiting for verification', hsa_verified:'Verified', hsa_cancelled:'Cancelled', hsOverdue:'Overdue', hsAnonymous:'Anonymous', hsBy:'Reported by', hsMineOnly:'My actions',
  hsIssue:'Issue equipment', hsItem:'Item', hsItemName:'Item name', hsSize:'Size', hsQty:'Quantity', hsIssued:'Issued on', hsReplace:'Replace by', hsAck:'I received it', hsAcked:'Received',
  hsReturned:'Returned', hsReplaced:'Replaced', hsReplaceSoon:'Due for replacement', pps_issued:'Issued', pps_returned:'Returned', pps_replaced:'Replaced',
  ppe_helmet:'Helmet', ppe_safety_shoes:'Safety shoes', ppe_gloves:'Gloves', ppe_goggles:'Goggles', ppe_coverall:'Coverall', ppe_vest:'High-visibility vest', ppe_ear_protection:'Ear protection', ppe_respirator:'Respirator', ppe_harness:'Safety harness', ppe_fire_suit:'Fire-resistant suit', ppe_other:'Other',
  hsLtifr:'Lost-time injury frequency (LTIFR)', hsLtifrSub:'per million hours worked', hsTrir:'Recordable injury rate (TRIR)', hsTrirSub:'per 200,000 hours', hsDaysSince:'Days without a lost-time injury', hsHours:'Hours worked in the period',
  hsOpenActs:'Open actions', hsOverdueActs:'Overdue actions', hsByKind:'Reports by type', hsBySev:'By severity', hsByRoot:'Root causes', hsNearMiss:'Near misses per incident', hsYear:'Last 12 months',
  hsNoReports:'No reports yet.', hsNoActs:'No actions.', hsNoPpe:'No equipment issued yet.', hsSent:'Report received, thank you',
  e_bad_kind:'Pick a valid type.', e_actions_open:'The report closes only once every action is verified or cancelled.', e_root_cause_required:'Record the root cause before closing.', e_cannot_verify_own:'Nobody verifies an action they own.', e_bad_state:'That is not possible in the current state.', e_already_closed:'The record is closed.'
});
var HS_SEV_CLS = { low: '', medium: 'late', high: 'out', critical: 'absent' };
var HS_ST_CLS = { open: 'late', investigating: 'late', actions: 'late', closed: 'in' };
function safetySection(body){
  var box = K.head(body, 'hsTitle', 'hsLead'), tab = S.hsTab || 'reports', r0 = roles(), officer = r0.hr || r0.hse || isHr();
  var tabs = [['reports', 'warning-diamond', 'hsReports'], ['actions', 'list-checks', 'hsActions'], ['ppe', 'hard-hat', 'hsPpe']];
  if (officer || r0.executive) tabs.push(['figures', 'chart-line-up', 'hsFigures']);
  function load(){
    K.busy(box);
    var calls = [api('hseList', {}, true), api('ppeList', {}, true)];
    if (tab === 'figures') calls.push(api('hseStats', {}, true));
    Promise.all(calls).then(function(res){
      if (!box.isConnected) return;
      var L = res[0], P = res[1], F = res[2];
      if (!L.ok) return box.innerHTML = K.bad(L.error);
      officer = L.officer;
      var h = '<div class="toolbar">' + K.tabsBar(tab, tabs) + '<span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="hsNew">' + ph('megaphone-simple') + t('hsReport') + '</button>' +
        (tab === 'ppe' && P.officer ? ' <button type="button" class="btn btn-line btn-sm" id="hsIss">' + ph('hard-hat') + t('hsIssue') + '</button>' : '') + '</div>';
      if (tab === 'reports') h += L.rows.length ? L.rows.map(reportCard).join('') : K.empty('shield-check', t('hsNoReports'));
      else if (tab === 'actions') {
        var all = []; L.rows.forEach(function(x){ x.actions.forEach(function(a){ all.push([a, x]); }); });
        var mine = all.filter(function(p){ return p[0].ownerId === S.me.id && p[0].status === 'open'; });
        h += '<h3 class="w5-h">' + t('hsMineOnly') + '</h3>' + (L.myActions.length ? '<div class="list">' + L.myActions.map(function(a){ return actRow(a, null); }).join('') + '</div>' : K.empty('list-checks', t('hsNoActs')));
        if (officer) h += '<h3 class="w5-h">' + t('hsActions') + '</h3>' + (all.length ? '<div class="list">' + all.filter(function(p){ return mine.indexOf(p) < 0; }).map(function(p){ return actRow(p[0], p[1]); }).join('') + '</div>' : K.empty('list-checks', t('hsNoActs')));
      } else if (tab === 'ppe') h += P.ok && P.rows.length ? '<div class="list">' + P.rows.map(ppeRow).join('') + '</div>' : K.empty('hard-hat', t('hsNoPpe'));
      else if (tab === 'figures') h += F && F.ok ? figures(F) : K.bad(F && F.error);
      box.innerHTML = h; K.wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.hsTab = b.dataset.tab; load(); }; });
      $('#hsNew', box).onclick = function(){ reportForm(L, load); };
      var iss = $('#hsIss', box); if (iss) iss.onclick = function(){ issueForm(P, load); };
      wireReports(L, load); wireActs(load); wirePpe(load);
    });
  }
  function reportCard(x){
    var acts = x.actions.length ? '<div class="list">' + x.actions.map(function(a){ return actRow(a, x); }).join('') + '</div>' : '';
    var tools = officer && x.status !== 'closed' ? '<div class="btnrow">' +
      '<button type="button" class="btn btn-line btn-sm" data-hsx="assign" data-id="' + x.id + '">' + ph('user-focus') + t('hsAssign') + '</button>' +
      '<button type="button" class="btn btn-line btn-sm" data-hsx="root" data-id="' + x.id + '">' + ph('magnifying-glass') + t('hsRoot') + '</button>' +
      '<button type="button" class="btn btn-line btn-sm" data-hsx="act" data-id="' + x.id + '">' + ph('plus') + t('hsAddAct') + '</button>' +
      '<button type="button" class="btn btn-dark btn-sm" data-hsx="close" data-id="' + x.id + '">' + ph('check-circle') + t('hsClose') + '</button></div>' : '';
    return '<div class="db-card w5-card" style="padding:16px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b><bdi class="num">' + esc(x.ref) + '</bdi></b>' + K.sep() + t('hsk_' + x.kind) +
      '<span style="flex:1"></span>' + K.chip(t('hsv_' + x.severity), HS_SEV_CLS[x.severity]) + ' ' + K.chip(t('hss_' + x.status), HS_ST_CLS[x.status]) + '</div>' +
      '<small class="hr-hint">' + K.fmtT(x.occurredAt.length > 10 ? x.occurredAt + ':00+03:00' : x.occurredAt + 'T12:00:00+03:00') + K.sep() + esc(x.place) + K.sep() + (x.anonymous ? t('hsAnonymous') : t('hsBy') + ' ' + K.empLine(x.reporter)) + '</small>' +
      '<p style="white-space:pre-wrap;margin:8px 0">' + esc(x.description) + '</p>' + (x.immediateAction ? '<p class="hr-hint"><b>' + t('hsDone') + ':</b> ' + esc(x.immediateAction) + '</p>' : '') +
      (x.investigator ? '<p class="hr-hint"><b>' + t('hsInvest') + ':</b> ' + K.empLine(x.investigator) + '</p>' : '') +
      (x.rootCause ? '<p class="hr-hint"><b>' + t('hsRoot') + ' (' + t('hsr_' + x.rootCategory) + '):</b> ' + esc(x.rootCause) + '</p>' : '') +
      (x.closedNote ? '<p class="hr-hint"><b>' + t('hsCloseNote') + ':</b> ' + esc(x.closedNote) + '</p>' : '') + acts + tools + '</div>';
  }
  function actRow(a, x){
    var b = '';
    if (a.ownerId === S.me.id && a.status === 'open') b += '<button type="button" class="btn btn-dark btn-sm" data-hsa="done" data-id="' + a.id + '">' + t('hsMarkDone') + '</button>';
    if (officer && a.status === 'done' && a.ownerId !== S.me.id) b += '<button type="button" class="btn btn-dark btn-sm" data-hsa="verify" data-id="' + a.id + '">' + t('hsVerify') + '</button> <button type="button" class="btn btn-line btn-sm" data-hsa="reopen" data-id="' + a.id + '">' + t('hsReopen') + '</button>';
    if (officer && (a.status === 'open' || a.status === 'done')) b += ' <button type="button" class="btn btn-line btn-sm" data-hsa="cancel" data-id="' + a.id + '">' + t('hsCancel') + '</button>';
    return '<div class="row w2-row"><div class="main"><b><bdi class="num">' + esc(a.ref) + '</bdi>' + K.sep() + esc(a.title) + '</b><small>' + t('hsOwner') + ' ' + K.empLine(a.owner) + K.sep() + t('hsDue') + ' ' + K.fmt(a.dueDate) +
      (x ? K.sep() + '<bdi class="num">' + esc(x.ref) + '</bdi>' : '') + (a.doneNote ? K.sep() + esc(a.doneNote) : '') + '</small></div><div class="act" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
      (a.overdue ? K.chip(t('hsOverdue'), 'absent') : '') + K.chip(t('hsa_' + a.status), a.status === 'verified' ? 'in' : a.status === 'cancelled' ? 'off' : 'late') + b + '</div></div>';
  }
  function ppeRow(p){
    var b = '';
    if (p.empId === S.me.id && !p.ackAt && p.status === 'issued') b += '<button type="button" class="btn btn-dark btn-sm" data-pp="ack" data-id="' + p.id + '">' + t('hsAck') + '</button>';
    if (officer && p.status === 'issued') b += ' <button type="button" class="btn btn-line btn-sm" data-pp="replaced" data-id="' + p.id + '">' + t('hsReplaced') + '</button> <button type="button" class="btn btn-line btn-sm" data-pp="returned" data-id="' + p.id + '">' + t('hsReturned') + '</button>';
    return '<div class="row w2-row"><div class="main"><b>' + (p.item === 'other' ? esc(p.itemName) : t('ppe_' + p.item)) + (p.size ? ' <bdi class="num">' + esc(p.size) + '</bdi>' : '') + ' × <span class="num">' + p.qty + '</span></b><small>' +
      (p.emp && p.empId !== S.me.id ? K.empLine(p.emp) + K.sep() : '') + t('hsIssued') + ' ' + K.fmt(p.issuedOn) + (p.replaceBy ? K.sep() + t('hsReplace') + ' ' + K.fmt(p.replaceBy) : '') + (p.ackAt ? K.sep() + t('hsAcked') + ' ' + K.fmtT(p.ackAt) : '') + '</small></div>' +
      '<div class="act" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + (p.due ? K.chip(t('hsReplaceSoon'), 'late') : '') + K.chip(t('pps_' + p.status), p.status === 'issued' ? 'in' : 'off') + b + '</div></div>';
  }
  function figures(F){
    var V = window.Viz, d = F.daysSinceLti;
    return '<p class="hr-hint">' + t('hsYear') + ': ' + K.fmt(F.from) + ' – ' + K.fmt(F.to) + '</p>' +
      K.tiles([[t('hsLtifr'), F.ltifr == null ? '-' : V.n1(F.ltifr, 2), t('hsLtifrSub'), true], [t('hsTrir'), F.trir == null ? '-' : V.n1(F.trir, 2), t('hsTrirSub')],
        [t('hsDaysSince'), d == null ? '∞' : K.n(d), ''], [t('hsHours'), K.n(F.hours), ''], [t('hsOpenActs'), K.n(F.openActions), ''], [t('hsOverdueActs'), K.n(F.overdueActions), ''],
        [t('hsNearMiss'), F.nearMissRatio == null ? '-' : V.n1(F.nearMissRatio, 1), '']]) +
      '<div class="w5-grid">' + V.card('hsK', t('hsByKind'), '', bars(F.byKind, 'hsk_'), null, null) + V.card('hsS', t('hsBySev'), '', bars(F.bySeverity, 'hsv_'), null, null) + V.card('hsR', t('hsByRoot'), '', bars(F.byRoot, 'hsr_'), null, null) + '</div>';
  }
  function wireReports(L, again){
    var find = function(id){ return L.rows.filter(function(x){ return x.id === id; })[0]; };
    $$('[data-hsx]', box).forEach(function(b){ b.onclick = function(){
      var x = find(b.dataset.id), k = b.dataset.hsx;
      if (k === 'assign') K.people(function(P){ K.formDrawer(t('hsAssign'), esc(x.ref), K.fld(t('hsInvest'), '<select name="who" required>' + K.empOpts(P.rows, x.investigator && x.investigator.id, '') + '</select>'), function(v){ return api('hseUpdate', { id: x.id, investigatorId: v.who }); }, again); });
      if (k === 'root') K.formDrawer(t('hsRoot'), esc(x.ref), K.fld(t('hsRootCat'), '<select name="cat" required>' + K.opts(L.roots.map(function(r){ return [r, t('hsr_' + r)]; }), x.rootCategory, '') + '</select>') +
        K.fld(t('hsRoot'), '<textarea name="cause" rows="4" minlength="10" maxlength="2000" required>' + esc(x.rootCause || '') + '</textarea>'), function(v){ return api('hseUpdate', { id: x.id, rootCategory: v.cat, rootCause: v.cause }); }, again, t('hsSaveRoot'));
      if (k === 'act') K.people(function(P){ K.formDrawer(t('hsAddAct'), esc(x.ref), K.fld(t('hsActTitle'), '<input name="title" minlength="5" maxlength="300" required>') +
        K.two(K.fld(t('hsOwner'), '<select name="owner" required>' + K.empOpts(P.rows, '', '') + '</select>'), K.fld(t('hsDue'), '<input type="date" name="due" required min="' + riyadhToday() + '">')),
        function(v){ return api('hseActionSave', { capa: { reportId: x.id, title: v.title, ownerId: v.owner, dueDate: v.due } }); }, again); });
      if (k === 'close') K.noteDrawer(t('hsClose'), esc(x.ref), function(note){ return api('hseUpdate', { id: x.id, close: true, note: note }); }, again);
    }; });
  }
  function wireActs(again){
    $$('[data-hsa]', box).forEach(function(b){ b.onclick = function(){
      var k = b.dataset.hsa, id = b.dataset.id;
      if (k === 'verify') return api('hseActionStep', { id: id, step: 'verify' }).then(function(r){ if (!r.ok) return toast(errText(r.error)); toast(t('w2Saved')); K.refreshTasks(); again(); });
      K.noteDrawer(t(k === 'done' ? 'hsMarkDone' : k === 'reopen' ? 'hsReopen' : 'hsCancel'), k === 'done' ? t('hsWhatDone') : '', function(note){ return api('hseActionStep', { id: id, step: k, note: note }); }, again);
    }; });
  }
  function wirePpe(again){
    $$('[data-pp]', box).forEach(function(b){ K.confirmTap(b, function(){ api('ppeStep', { id: b.dataset.id, step: b.dataset.pp }).then(function(r){ if (!r.ok) return toast(errText(r.error)); toast(t('w2Saved')); K.refreshTasks(); again(); }); }); });
  }
  function reportForm(L, again){
    var now = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 16);
    K.formDrawer(t('hsReport'), '', K.two(K.fld(t('hsKind'), '<select name="kind" required>' + K.opts(L.kinds.map(function(k){ return [k, t('hsk_' + k)]; }), '', '') + '</select>'),
        K.fld(t('hsSev'), '<select name="severity" required>' + K.opts(L.severities.map(function(k){ return [k, t('hsv_' + k)]; }), 'medium') + '</select>')) +
      K.two(K.fld(t('hsWhen'), '<input type="datetime-local" name="when" required max="' + now + '" value="' + now + '">'), K.fld(t('hsZone'), '<select name="zone">' + K.opts(L.zones.map(function(z){ return [z.id, z.name]; }), '', '-') + '</select>')) +
      K.fld(t('hsPlace'), '<input name="place" maxlength="200" required>') + K.fld(t('hsWhat'), '<textarea name="what" rows="4" minlength="10" maxlength="2000" required></textarea>') +
      K.fld(t('hsDone'), '<textarea name="done" rows="2" maxlength="1000"></textarea>') + K.chk('anon', t('hsAnon'), false),
      function(v){ return api('hseReport', { report: { kind: v.kind, severity: v.severity, occurredAt: v.when, zoneId: v.zone, place: v.place, description: v.what, immediateAction: v.done, anonymous: v.anon } }); },
      function(){ toast(t('hsSent')); again(); });
  }
  function issueForm(P, again){
    K.people(function(PP){
      K.formDrawer(t('hsIssue'), '', K.fld(K.lang('الموظف', 'Employee'), '<select name="emp" required>' + K.empOpts(PP.rows, '', '') + '</select>') +
        K.two(K.fld(t('hsItem'), '<select name="item" required>' + K.opts(P.items.map(function(k){ return [k, t('ppe_' + k)]; }), '', '') + '</select>'), K.fld(t('hsItemName'), '<input name="itemName" maxlength="80">')) +
        K.two(K.fld(t('hsSize'), '<input name="size" maxlength="20">'), K.fld(t('hsQty'), '<input type="number" name="qty" min="1" max="50" value="1" required>')) +
        K.two(K.fld(t('hsIssued'), '<input type="date" name="on" required value="' + riyadhToday() + '" max="' + riyadhToday() + '">'), K.fld(t('hsReplace'), '<input type="date" name="rb">')),
        function(v){ return api('ppeIssue', { ppe: { empId: v.emp, item: v.item, itemName: v.itemName, size: v.size, qty: Number(v.qty), issuedOn: v.on, replaceBy: v.rb } }); }, again);
    });
  }
  load();
}
window.Safety = { section: safetySection };

if (!document.getElementById('w5css')) {
  var st = document.createElement('style'); st.id = 'w5css';
  st.textContent = '.w5-h{font-size:16px;margin:16px 0 8px}.w5-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:12px}.w5-card .btnrow{margin-top:10px;flex-wrap:wrap;gap:6px}';
  document.head.appendChild(st);
}
})();
