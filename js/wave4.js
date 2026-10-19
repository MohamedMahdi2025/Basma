// Wave 4 screens (2026-10-19): open shifts and shift swaps (Shifts.gs), and the modules that follow on the gap list.
// Built on the Wave 2 screen kit (window.W2K from js/wave2.js, loaded first). Every rule is enforced on the server.
(function(){
'use strict';
var K = window.W2K;

Object.assign(T.ar, {
  osTitle:'الورديات المفتوحة والتبديل', osLead:'ورديات ينشرها المدير أو الموارد البشرية لمن يرغب، وتبديل وردية مع زميل في نفس الفريق. كل طلب يعتمده مدير الموظف أو الموارد البشرية، وبعد الاعتماد يتغير الجدول لذلك اليوم فقط.',
  osOff:'جداول الورديات غير مفعلة في الإعدادات، لذلك لا يمكن نشر ورديات أو تبديلها الآن.',
  osOpen:'ورديات مفتوحة', osSwaps:'التبديل', osDecide:'بانتظار اعتمادي', osPost:'نشر وردية مفتوحة', osAsk:'طلب تبديل', osClaim:'أريد هذه الوردية',
  osShift:'الوردية', osSlots:'عدد المقاعد', osDeptAny:'كل الأقسام', osWith:'مع الزميل', osMyShift:'ورديتي في هذا اليوم', osAccept:'موافق على التبديل', osDecline:'اعتذار',
  osGive:'يعطي', osTake:'ويأخذ', osPosted:'نشرها', osRelease:'إلغاء طلبي', osCancel:'إلغاء', osMine:'طلباتي',
  oss_open:'متاحة', oss_claimed:'بانتظار الاعتماد', oss_peer:'بانتظار رد الزميل', oss_manager:'بانتظار المدير', oss_approved:'معتمدة', oss_rejected:'مرفوضة', oss_cancelled:'ملغاة',
  osw_rest_day:'هذا يوم راحتك الأسبوعية؛ العمل فيه يحسب عملا إضافيا (المادة 104).', osw_replaces_shift:'لديك وردية في هذا اليوم وستحل هذه محلها بعد الاعتماد.',
  osk_open:'وردية مفتوحة', osk_swap:'تبديل',
  e_rosters_off:'جداول الورديات غير مفعلة في الإعدادات.', e_past_date:'التاريخ مضى.', e_not_eligible:'هذا غير متاح لك.', e_on_leave:'لديك أو لدى الزميل إجازة معتمدة في هذا اليوم.',
  e_already_claimed:'يوجد طلب قائم لنفس اليوم.', e_not_rostered:'يلزم أن يكون لك وللزميل وردية مجدولة في هذا اليوم.', e_same_shift:'لكما الوردية نفسها في هذا اليوم.', e_roster_changed:'تغير الجدول بعد الطلب؛ اطلبوا التبديل من جديد.'
});
Object.assign(T.en, {
  osTitle:'Open shifts and swaps', osLead:'Shifts a manager or HR posts for volunteers, and shift swaps with a team-mate. The employee\'s manager or HR approves each one; the roster then changes for that one day only.',
  osOff:'Rosters are switched off in the settings, so shifts cannot be posted or swapped now.',
  osOpen:'Open shifts', osSwaps:'Swaps', osDecide:'Waiting for me', osPost:'Post an open shift', osAsk:'Ask for a swap', osClaim:'I\'ll take this shift',
  osShift:'Shift', osSlots:'Places', osDeptAny:'All departments', osWith:'With', osMyShift:'My shift that day', osAccept:'Accept the swap', osDecline:'Decline',
  osGive:'gives', osTake:'and takes', osPosted:'Posted by', osRelease:'Withdraw my claim', osCancel:'Cancel', osMine:'My requests',
  oss_open:'Open', oss_claimed:'Waiting for approval', oss_peer:'Waiting for the colleague', oss_manager:'Waiting for the manager', oss_approved:'Approved', oss_rejected:'Declined', oss_cancelled:'Cancelled',
  osw_rest_day:'This is your weekly rest day; work on it counts as overtime (Art. 104).', osw_replaces_shift:'You already have a shift that day; this one replaces it once approved.',
  osk_open:'Open shift', osk_swap:'Swap',
  e_rosters_off:'Rosters are switched off in the settings.', e_past_date:'That date has passed.', e_not_eligible:'This is not open to you.', e_on_leave:'You or the colleague have approved leave that day.',
  e_already_claimed:'There is already a request for that day.', e_not_rostered:'You and the colleague both need a rostered shift that day.', e_same_shift:'You both have the same shift that day.', e_roster_changed:'The roster changed after the request; ask for the swap again.'
});

function shiftTxt(sh){ return sh ? esc(K.lang(sh.nameAr, sh.nameEn)) + ' <bdi class="num">' + esc(sh.start) + '–' + esc(sh.end) + '</bdi>' : '-'; }
function statusChip(x){ return K.chip(t('oss_' + x.status), x.status === 'approved' ? 'in' : x.status === 'rejected' || x.status === 'cancelled' ? 'out' : x.status === 'open' ? '' : 'late'); }

function offerRow(x, i){
  var who = x.kind === 'swap' ? K.empLine(x.emp) + ' ' + t('osGive') + ' ' + shiftTxt(x.shift) + ' ' + t('osTake') + ' ' + shiftTxt(x.peerShift) + ' ' + t('osWith') + ' ' + K.empLine(x.peer)
    : shiftTxt(x.shift) + (x.emp ? K.sep() + K.empLine(x.emp) : '');
  var btns = '';
  if (x.kind === 'open' && x.status === 'open' && !x.canDecide) btns += '<button type="button" class="btn btn-dark btn-sm" data-os="claim" data-i="' + i + '">' + ph('hand') + t('osClaim') + '</button>';
  if (x.askedMe) btns += '<button type="button" class="btn btn-dark btn-sm" data-os="accept" data-i="' + i + '">' + t('osAccept') + '</button> <button type="button" class="btn btn-line btn-sm" data-os="decline" data-i="' + i + '">' + t('osDecline') + '</button>';
  if (x.canDecide) btns += '<button type="button" class="btn btn-dark btn-sm" data-os="approve" data-i="' + i + '">' + t('w2Approve') + '</button> <button type="button" class="btn btn-line btn-sm" data-os="reject" data-i="' + i + '">' + t('w2Reject') + '</button>';
  if (x.mine && x.kind === 'open' && x.status === 'claimed') btns += '<button type="button" class="btn btn-line btn-sm" data-os="cancel" data-i="' + i + '">' + t('osRelease') + '</button>';
  if (x.mine && x.kind === 'swap' && (x.status === 'peer' || x.status === 'manager')) btns += '<button type="button" class="btn btn-line btn-sm" data-os="cancel" data-i="' + i + '">' + t('osCancel') + '</button>';
  return '<div class="row w2-row"><div class="main"><b><bdi>' + esc(x.ref) + '</bdi>' + K.sep() + t('osk_' + x.kind) + K.sep() + K.fmt(x.date) + '</b><small>' + who + '</small>' +
    (x.note ? '<small>' + esc(x.note) + '</small>' : '') + (x.decisionNote ? '<small>' + esc(x.decisionNote) + '</small>' : '') +
    (x.warnings || []).map(function(w){ return '<p class="w2-warn">' + ph('warning') + ' ' + t('osw_' + w) + '</p>'; }).join('') + '</div>' +
    '<div class="act" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + statusChip(x) + btns + '</div></div>';
}

function openShiftsSection(body){
  var box = K.head(body, 'osTitle', 'osLead'), tab = S.osTab || 'open';
  function load(){
    K.busy(box);
    api('shiftOfferList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      var rows = r.rows, dec = rows.filter(function(x){ return x.canDecide; });
      var lists = { open: rows.filter(function(x){ return x.kind === 'open' && !x.canDecide; }), swaps: rows.filter(function(x){ return x.kind === 'swap' && !x.canDecide; }), decide: dec };
      if (!dec.length && tab === 'decide') tab = 'open';
      var tabsL = [['open', 'calendar-plus', 'osOpen'], ['swaps', 'arrows-left-right', 'osSwaps']]; if (dec.length) tabsL.push(['decide', 'seal-check', 'osDecide']);
      var h = (r.enabled ? '' : '<p class="w2-warn">' + ph('info') + ' ' + t('osOff') + '</p>') +
        K.tiles([[t('osOpen'), K.n(rows.filter(function(x){ return x.status === 'open'; }).length)], [t('osSwaps'), K.n(lists.swaps.length)], [t('osDecide'), K.n(dec.length), '', !!dec.length]]) +
        '<div class="toolbar">' + K.tabsBar(tab, tabsL) + '<span class="sp"></span>' +
        (r.enabled && r.canPost ? '<button type="button" class="btn btn-dark btn-sm" id="osPostB">' + ph('plus') + t('osPost') + '</button>' : '') +
        (r.enabled && r.mates.length ? ' <button type="button" class="btn btn-line btn-sm" id="osAskB">' + ph('arrows-left-right') + t('osAsk') + '</button>' : '') + '</div>';
      var L = lists[tab];
      h += L.length ? '<div class="list">' + L.map(function(x){ return offerRow(x, rows.indexOf(x)); }).join('') + '</div>' : K.empty('calendar-blank', t('w2None'));
      box.innerHTML = h; K.wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.osTab = b.dataset.tab; load(); }; });
      var pb = $('#osPostB', box); if (pb) pb.onclick = function(){ postForm(r, load); };
      var ab = $('#osAskB', box); if (ab) ab.onclick = function(){ askForm(r, load); };
      var done = function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('w2Saved')); K.refreshTasks(); load(); };
      $$('[data-os]', box).forEach(function(b){
        var x = rows[b.dataset.i], k = b.dataset.os;
        if (k === 'claim') b.onclick = function(){ b.disabled = true; api('openShiftClaim', { id: x.id }).then(function(y){ if (y.ok && y.warnings && y.warnings.length) toast(t('osw_' + y.warnings[0])); done(y); }); };
        if (k === 'accept') b.onclick = function(){ b.disabled = true; api('shiftSwapAnswer', { id: x.id, accept: true }).then(done); };
        if (k === 'decline') b.onclick = function(){ K.noteDrawer(t('osDecline'), '', function(note){ return api('shiftSwapAnswer', { id: x.id, accept: false, note: note }); }, load, false); };
        if (k === 'approve') b.onclick = function(){ b.disabled = true; api('shiftOfferDecide', { id: x.id, approve: true }).then(done); };
        if (k === 'reject') b.onclick = function(){ K.noteDrawer(t('w2Reject'), '', function(note){ return api('shiftOfferDecide', { id: x.id, approve: false, note: note }); }, load); };
        if (k === 'cancel') K.confirmTap(b, function(){ api('shiftOfferCancel', { id: x.id }).then(done); });
      });
    });
  }
  load();
}
function postForm(r, again){
  var sh = r.shifts.map(function(s){ return [s.id, K.lang(s.nameAr, s.nameEn) + ' ' + s.start + '–' + s.end]; });
  var dp = r.depts.map(function(d){ return [d.id, K.lang(d.nameAr, d.nameEn)]; });
  K.formDrawer(t('osPost'), '', K.fld(t('osShift'), '<select name="shiftId" required>' + K.opts(sh, '', t('w2Pick')) + '</select>') +
    K.two(K.fld(t('w2Date'), '<input type="date" name="date" required min="' + new Date(Date.now() + 180 * 60000).toISOString().slice(0, 10) + '">'), K.fld(t('osSlots'), '<input type="number" name="slots" min="1" max="20" value="1" required>')) +
    K.fld(t('w2Dept'), '<select name="deptId">' + (r.canPost && dp.length && R().hr ? K.opts(dp, '', t('osDeptAny')) : K.opts(dp, dp[0] ? dp[0][0] : '')) + '</select>') +
    K.fld(t('w2Note'), '<input name="note" maxlength="200">'),
    function(v){ return api('openShiftPost', v); }, again);
}
function askForm(r, again){
  K.formDrawer(t('osAsk'), r.myShift ? t('osMyShift') + ': ' + K.lang(r.myShift.nameAr, r.myShift.nameEn) + ' ' + r.myShift.start + '–' + r.myShift.end : '',
    K.two(K.fld(t('w2Date'), '<input type="date" name="date" required>'), K.fld(t('osWith'), '<select name="peerId" required>' + K.opts(r.mates.map(function(m){ return [m.id, K.lang(m.name, m.nameEn) + ' (' + m.empNo + ')']; }), '', t('w2Pick')) + '</select>')) +
    K.fld(t('w2Note'), '<input name="note" maxlength="200">'),
    function(v){ return api('shiftSwapAsk', v); }, again);
}

window.OpenShifts = { section: openShiftsSection };
})();
