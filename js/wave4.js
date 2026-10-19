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

// =================================================================== CAREERS PAGE ADMIN (2026-10-19)
Object.assign(T.ar, {
  cpTitle:'صفحة الوظائف', cpLead:'انشر الوظائف المعتمدة على صفحة عامة يقدم منها المتقدمون مباشرة، مع موافقتهم على حفظ بياناتهم. يصل كل طلب إلى التوظيف كمرشح مصدره الموقع. لا يظهر للعامة إلا نص الإعلان.',
  cpLink:'رابط الصفحة', cpCopy:'نسخ الرابط', cpCopied:'تم النسخ', cpPublish:'نشر', cpEdit:'تعديل الإعلان', cpClose:'إيقاف النشر', cpLive:'منشورة', cpOff:'غير منشورة', cpApps:'طلبات من الموقع',
  cpTitleAr:'عنوان الإعلان بالعربية', cpTitleEn:'عنوان الإعلان بالإنجليزية', cpSumAr:'نبذة بالعربية', cpSumEn:'نبذة بالإنجليزية', cpReqAr:'المتطلبات بالعربية', cpReqEn:'المتطلبات بالإنجليزية',
  cpCity:'المدينة', cpCloses:'آخر موعد للتقديم', cpOpenSeats:'المقاعد', cpOpenPage:'فتح الصفحة'
});
Object.assign(T.en, {
  cpTitle:'Careers page', cpLead:'Publish approved jobs on a public page where people apply directly, with their consent to keep their data. Each application reaches recruitment as a candidate from the website. Only the ad text is public.',
  cpLink:'Page link', cpCopy:'Copy link', cpCopied:'Copied', cpPublish:'Publish', cpEdit:'Edit the ad', cpClose:'Unpublish', cpLive:'Published', cpOff:'Not published', cpApps:'Applications from the website',
  cpTitleAr:'Ad title (Arabic)', cpTitleEn:'Ad title (English)', cpSumAr:'Summary (Arabic)', cpSumEn:'Summary (English)', cpReqAr:'Requirements (Arabic)', cpReqEn:'Requirements (English)',
  cpCity:'City', cpCloses:'Applications close', cpOpenSeats:'Places', cpOpenPage:'Open the page'
});
function careersAdmin(body){
  var box = K.head(body, 'cpTitle', 'cpLead'), url = location.origin + location.pathname + '#careers';
  function load(){
    K.busy(box);
    api('careerPostList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      var live = r.rows.filter(function(x){ return x.post && x.post.live; }), apps = r.rows.reduce(function(s, x){ return s + (x.post ? x.post.applications : 0); }, 0);
      box.innerHTML = K.tiles([[t('cpLive'), K.n(live.length)], [t('cpApps'), K.n(apps)]]) +
        '<div class="toolbar"><input readonly dir="ltr" value="' + esc(url) + '" aria-label="' + t('cpLink') + '" style="flex:1;min-width:0"> <button type="button" class="btn btn-line btn-sm" id="cpC">' + ph('copy') + t('cpCopy') + '</button> <a class="btn btn-line btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">' + ph('arrow-square-out') + t('cpOpenPage') + '</a></div>' +
        (r.rows.length ? '<div class="list">' + r.rows.map(function(x, i){
          var p = x.post;
          return '<div class="row w2-row"><div class="main"><b><bdi>' + esc(x.ref) + '</bdi>' + K.sep() + esc(K.lang(x.titleAr, x.titleEn)) + '</b><small>' + t('cpOpenSeats') + ' ' + (x.headcount - x.filled) + (p ? K.sep() + t('cpApps') + ' ' + p.applications + (p.closesOn ? K.sep() + t('cpCloses') + ' ' + K.fmt(p.closesOn) : '') : '') + '</small></div>' +
            '<div class="act" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + K.chip(p && p.live ? t('cpLive') : t('cpOff'), p && p.live ? 'in' : '') +
            (x.reqStatus === 'approved' ? '<button type="button" class="btn btn-dark btn-sm" data-cp="' + i + '">' + (p ? t('cpEdit') : t('cpPublish')) + '</button>' : '') +
            (p && p.status === 'open' ? '<button type="button" class="btn btn-line btn-sm" data-cx="' + i + '">' + t('cpClose') + '</button>' : '') + '</div></div>';
        }).join('') + '</div>' : K.empty('briefcase', t('w2None')));
      $('#cpC', box).onclick = function(){ try { navigator.clipboard.writeText(url).then(function(){ toast(t('cpCopied')); }); } catch (e) {} };
      $$('[data-cp]', box).forEach(function(b){ b.onclick = function(){ adForm(r.rows[b.dataset.cp], load); }; });
      $$('[data-cx]', box).forEach(function(b){ K.confirmTap(b, function(){ var x = r.rows[b.dataset.cx], p = x.post;
        api('careerPostSave', { post: Object.assign({}, p, { reqId: x.reqId, status: 'closed' }) }).then(function(y){ if (!y.ok) return toast(errText(y.error)); toast(t('w2Saved')); load(); }); }); });
    });
  }
  load();
}
function adForm(x, again){
  var p = x.post || {}, ta = function(name, label, v){ return K.fld(t(label), '<textarea name="' + name + '" rows="4" maxlength="2000">' + esc(v || '') + '</textarea>'); };
  K.formDrawer(x.post ? t('cpEdit') : t('cpPublish'), esc(x.ref),
    K.two(K.fld(t('cpTitleAr'), '<input name="titleAr" maxlength="120" value="' + esc(p.titleAr || x.titleAr || '') + '">'), K.fld(t('cpTitleEn'), '<input name="titleEn" maxlength="120" dir="ltr" value="' + esc(p.titleEn || x.titleEn || '') + '">')) +
    ta('summaryAr', 'cpSumAr', p.summaryAr) + ta('summaryEn', 'cpSumEn', p.summaryEn) + ta('requirementsAr', 'cpReqAr', p.requirementsAr) + ta('requirementsEn', 'cpReqEn', p.requirementsEn) +
    K.two(K.fld(t('cpCity'), '<input name="city" maxlength="60" value="' + esc(p.city || '') + '">'), K.fld(t('cpCloses'), '<input type="date" name="closesOn" value="' + esc(p.closesOn || '') + '">')),
    function(v){ v.reqId = x.reqId; v.status = 'open'; return api('careerPostSave', { post: v }); }, again);
}
window.CareersAdmin = { section: careersAdmin };

// =================================================================== WORKFORCE PLAN (2026-10-19)
Object.assign(T.ar, {
  wfTitle:'خطة القوى العاملة', wfLead:'العدد المخطط لكل قسم في السنة مقابل الموظفين الحاليين وطلبات التوظيف المعتمدة والمنتظرة. الفجوة = المخطط − الحاليون − المعتمد غير المشغول. تكلفة الفجوة تقديرية بمتوسط رواتب القسم، وتظهر للأقسام التي فيها 3 أشخاص أو أكثر.',
  wfYear:'السنة', wfDept:'القسم', wfStaff:'الحاليون', wfSaudi:'سعوديون', wfOpen:'معتمد غير مشغول', wfPending:'بانتظار الاعتماد', wfPlanned:'المخطط', wfGap:'الفجوة', wfCost:'تكلفة الفجوة سنويا',
  wfSet:'تحديد', wfTotal:'الإجمالي', wfNoPlan:'بلا خطة', wfOver:'زيادة عن الخطة', wfNote:'ملاحظة'
});
Object.assign(T.en, {
  wfTitle:'Workforce plan', wfLead:'Planned headcount per department for the year against current staff and approved and pending requisitions. Gap = planned - staff - approved but unfilled. The gap cost is an estimate from the department\'s average pay, shown for departments of 3 or more.',
  wfYear:'Year', wfDept:'Department', wfStaff:'Staff', wfSaudi:'Saudi', wfOpen:'Approved, unfilled', wfPending:'Awaiting approval', wfPlanned:'Planned', wfGap:'Gap', wfCost:'Gap cost a year',
  wfSet:'Set', wfTotal:'Total', wfNoPlan:'No plan', wfOver:'Over plan', wfNote:'Note'
});
function workforceSection(body){
  var box = K.head(body, 'wfTitle', 'wfLead'), year = S.wfYear || new Date().getFullYear();
  function load(){
    K.busy(box);
    api('workforcePlan', { year: year }, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      var T0 = r.totals, gapTxt = function(g){ return g == null ? '<small>' + t('wfNoPlan') + '</small>' : g > 0 ? '<b class="num">+' + g + '</b>' : g < 0 ? K.chip(t('wfOver') + ' ' + (-g), 'late') : '<span class="num">0</span>'; };
      var h = K.tiles([[t('wfPlanned'), K.n(T0.planned)], [t('wfStaff'), K.n(T0.staff)], [t('wfOpen'), K.n(T0.open)], [t('wfGap'), K.n(T0.gap), '', T0.gap > 0]].concat(r.cost ? [[t('wfCost'), K.money(T0.gapCostYear)]] : [])) +
        '<div class="toolbar"><label>' + t('wfYear') + ' <input type="number" id="wfY" min="2020" max="2100" value="' + year + '" style="width:90px"></label></div>';
      h += r.rows.length ? '<div class="w2-mx"><table><thead><tr><th>' + t('wfDept') + '</th><th>' + t('wfPlanned') + '</th><th>' + t('wfStaff') + '</th><th>' + t('wfSaudi') + '</th><th>' + t('wfOpen') + '</th><th>' + t('wfPending') + '</th><th>' + t('wfGap') + '</th>' + (r.cost ? '<th>' + t('wfCost') + '</th>' : '') + (r.canEdit ? '<th></th>' : '') + '</tr></thead><tbody>' +
        r.rows.map(function(x, i){
          var pct = x.planned ? Math.min(100, Math.round((x.staff / x.planned) * 100)) : 0;
          return '<tr><td>' + esc(K.lang(x.nameAr, x.nameEn)) + (x.note ? '<br><small>' + esc(x.note) + '</small>' : '') + '</td><td class="num">' + (x.planned == null ? '-' : x.planned) +
            (x.planned ? '<div style="height:4px;border-radius:2px;background:var(--line);margin-top:4px"><i style="display:block;height:4px;border-radius:2px;width:' + pct + '%;background:var(--brand)"></i></div>' : '') + '</td>' +
            '<td class="num">' + x.staff + '</td><td class="num">' + x.saudi + '</td><td class="num">' + x.open + '</td><td class="num">' + x.pending + '</td><td>' + gapTxt(x.gap) + '</td>' +
            (r.cost ? '<td>' + (x.gapCostYear != null ? K.money(x.gapCostYear) : '-') + '</td>' : '') +
            (r.canEdit ? '<td><button type="button" class="btn btn-line btn-sm" data-wf="' + i + '">' + t('wfSet') + '</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>' : K.empty('users-three', t('w2None'));
      box.innerHTML = h; K.wire(box);
      $('#wfY', box).onchange = function(){ year = S.wfYear = Number(this.value) || year; load(); };
      $$('[data-wf]', box).forEach(function(b){ b.onclick = function(){ var x = r.rows[b.dataset.wf];
        K.formDrawer(t('wfPlanned') + ' · ' + esc(K.lang(x.nameAr, x.nameEn)), String(year),
          K.fld(t('wfPlanned'), '<input type="number" name="planned" min="0" max="100000" required value="' + (x.planned == null ? x.staff + x.open : x.planned) + '">') + K.fld(t('wfNote'), '<input name="note" maxlength="300" value="' + esc(x.note) + '">'),
          function(v){ return api('workforcePlanSave', { year: year, deptId: x.deptId, planned: Number(v.planned), note: v.note }); }, load); }; });
    });
  }
  load();
}
window.Workforce = { section: workforceSection };

// =================================================================== 1:1s AND GOALS (2026-10-19)
Object.assign(T.ar, {
  ooTitle:'لقاءات 1:1 والأهداف', ooLead:'لقاءات منتظمة بين الموظف ومديره، بجدول أعمال يضيف إليه الطرفان، وملاحظات وإجراءات يراها الاثنان، وملاحظة خاصة لا يراها إلا كاتبها. وأهداف مستمرة يتابع تقدمها الموظف ومديره، منفصلة عن تقييم الأداء.',
  ooWho:'الموظف', ooMe:'أنا', ooMeetings:'اللقاءات', ooGoals:'الأهداف', ooBook:'حجز لقاء', ooAgenda:'جدول الأعمال', ooAddItem:'إضافة بند', ooNotes:'ملاحظات مشتركة', ooPrivate:'ملاحظة خاصة (لك وحدك)',
  ooActions:'الإجراءات', ooAddAction:'إضافة إجراء', ooOwnerEmp:'على الموظف', ooOwnerMgr:'على المدير', ooDone:'إغلاق اللقاء', ooNone:'لا توجد لقاءات بعد.',
  oos_planned:'مجدول', oos_done:'تم', ooNewGoal:'هدف جديد', ooGoal:'الهدف', ooMeasure:'كيف نقيس النجاح', ooDue:'الموعد', ooProgress:'التقدم', ooCheckIn:'تحديث التقدم', ooBySelf:'وضعه الموظف', ooByMgr:'وضعه المدير',
  ooDrop:'إلغاء الهدف', ooHistory:'آخر التحديثات', ooSaveNotes:'حفظ الملاحظات', e_too_many:'وصلت إلى الحد الأعلى.'
});
Object.assign(T.en, {
  ooTitle:'1:1s and goals', ooLead:'Regular meetings between a person and their manager: an agenda both add to, notes and action items both see, and a private note only its writer sees. Ongoing goals both follow, separate from the review cycle.',
  ooWho:'Person', ooMe:'Me', ooMeetings:'Meetings', ooGoals:'Goals', ooBook:'Book a 1:1', ooAgenda:'Agenda', ooAddItem:'Add an item', ooNotes:'Shared notes', ooPrivate:'Private note (only you)',
  ooActions:'Action items', ooAddAction:'Add an action', ooOwnerEmp:'For the employee', ooOwnerMgr:'For the manager', ooDone:'Close the meeting', ooNone:'No meetings yet.',
  oos_planned:'Planned', oos_done:'Done', ooNewGoal:'New goal', ooGoal:'Goal', ooMeasure:'How success is measured', ooDue:'Due', ooProgress:'Progress', ooCheckIn:'Update progress', ooBySelf:'Set by the employee', ooByMgr:'Set by the manager',
  ooDrop:'Drop the goal', ooHistory:'Latest updates', ooSaveNotes:'Save notes', e_too_many:'You have reached the limit.'
});
function oneOnOneSection(body){
  var box = K.head(body, 'ooTitle', 'ooLead'), who = S.ooWho || '', tab = S.ooTab || 'meetings';
  function load(){
    K.busy(box);
    Promise.all([api('oneOnOneList', who ? { empId: who } : {}, true), api('goalList', who ? { empId: who } : {}, true)]).then(function(res){
      if (!box.isConnected) return;
      var m = res[0], g = res[1];
      if (!m.ok) return box.innerHTML = K.bad(m.error);
      var other = who && who !== S.me.id, team = m.team || [];
      var h = '<div class="toolbar">' + (team.length ? '<label>' + t('ooWho') + ' <select id="ooW">' + K.opts([['', t('ooMe')]].concat(team.map(function(e){ return [e.id, K.lang(e.name, e.nameEn) + ' (' + e.empNo + ')']; })), who) + '</select></label>' : '') +
        K.tabsBar(tab, [['meetings', 'chats-circle', 'ooMeetings'], ['goals', 'target', 'ooGoals']]) + '<span class="sp"></span>' +
        (tab === 'meetings' && other ? '<button type="button" class="btn btn-dark btn-sm" id="ooBk">' + ph('calendar-plus') + t('ooBook') + '</button>' : '') +
        (tab === 'goals' ? '<button type="button" class="btn btn-dark btn-sm" id="ooNg">' + ph('plus') + t('ooNewGoal') + '</button>' : '') + '</div>';
      if (tab === 'meetings') h += m.rows.length ? m.rows.map(meetingCard).join('') : K.empty('chats-circle', t('ooNone'));
      else h += g.ok && g.rows.length ? '<div class="list">' + g.rows.map(goalRow).join('') + '</div>' : K.empty('target', t('w2None'));
      box.innerHTML = h; K.wire(box);
      var sel = $('#ooW', box); if (sel) sel.onchange = function(){ who = S.ooWho = this.value; load(); };
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.ooTab = b.dataset.tab; load(); }; });
      var bk = $('#ooBk', box); if (bk) bk.onclick = function(){ K.formDrawer(t('ooBook'), '', K.fld(t('w2Date'), '<input type="date" name="date" required>'), function(v){ return api('oneOnOneSave', { empId: who, date: v.date }); }, load); };
      var ng = $('#ooNg', box); if (ng) ng.onclick = function(){ goalForm({ empId: who || S.me.id }, load); };
      var upd = function(id, extra){ return api('oneOnOneUpdate', Object.assign({ id: id }, extra)).then(function(r){ if (!r.ok) return toast(errText(r.error)); load(); }); };
      $$('[data-ag]', box).forEach(function(f){ f.onsubmit = function(ev){ ev.preventDefault(); var v = f.item.value.trim(); if (v) upd(f.dataset.ag, { agendaItem: v }); }; });
      $$('[data-ac]', box).forEach(function(f){ f.onsubmit = function(ev){ ev.preventDefault(); var v = f.item.value.trim(); if (v) upd(f.dataset.ac, { actionItem: v, actionOwner: f.owner.value }); }; });
      $$('[data-tick]', box).forEach(function(c){ c.onchange = function(){ var p = c.dataset.tick.split(':'); upd(p[0], { actionDone: Number(p[1]) }); }; });
      $$('[data-nt]', box).forEach(function(b){ b.onclick = function(){ var c = b.closest('.oo-card'), x = { notes: $('[name=notes]', c).value }; var pv = $('[name=private]', c); if (pv) x.privateNote = pv.value; upd(b.dataset.nt, x).then(function(){ toast(t('w2Saved')); }); }; });
      $$('[data-dn]', box).forEach(function(b){ K.confirmTap(b, function(){ upd(b.dataset.dn, { done: true }); }); });
      $$('[data-ci]', box).forEach(function(b){ b.onclick = function(){ var x = g.rows[b.dataset.ci];
        K.formDrawer(t('ooCheckIn'), esc(x.title), K.fld(t('ooProgress') + ' %', '<input type="number" name="progress" min="0" max="100" required value="' + x.progress + '">') + K.fld(t('w2Note'), '<input name="note" maxlength="500">'),
          function(v){ return api('goalCheckIn', { id: x.id, progress: Number(v.progress), note: v.note }); }, load); }; });
      $$('[data-ge]', box).forEach(function(b){ b.onclick = function(){ goalForm(g.rows[b.dataset.ge], load); }; });
    });
  }
  function meetingCard(x){
    var mgr = x.canEdit, ag = x.agenda.map(function(a){ return '<li>' + esc(a.text) + ' <small>(' + (a.by === 'emp' ? t('ooOwnerEmp').replace(/^.*? /, '') : t('ooOwnerMgr').replace(/^.*? /, '')) + ')</small></li>'; }).join('');
    var ac = x.actions.map(function(a, i){ return '<li><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-tick="' + x.id + ':' + i + '"' + (a.done ? ' checked' : '') + '> <span' + (a.done ? ' style="text-decoration:line-through"' : '') + '>' + esc(a.text) + '</span> <small>' + t(a.owner === 'mgr' ? 'ooOwnerMgr' : 'ooOwnerEmp') + '</small></label></li>'; }).join('');
    return '<div class="db-card oo-card" style="padding:14px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>' + K.fmt(x.date) + '</b>' + K.sep() + K.empLine(x.manager) + '<span class="sp" style="flex:1"></span>' + K.chip(t('oos_' + x.status), x.status === 'done' ? 'in' : '') + '</div>' +
      '<h4 style="margin:10px 0 4px">' + t('ooAgenda') + '</h4><ul style="margin:0;padding-inline-start:18px">' + ag + '</ul>' +
      (x.status === 'planned' ? '<form class="toolbar" data-ag="' + x.id + '"><input name="item" maxlength="300" placeholder="' + t('ooAddItem') + '" style="flex:1;min-width:0"><button class="btn btn-line btn-sm" type="submit">' + ph('plus') + '</button></form>' : '') +
      '<h4 style="margin:10px 0 4px">' + t('ooActions') + '</h4><ul style="margin:0;padding:0;list-style:none">' + ac + '</ul>' +
      (mgr && x.status === 'planned' ? '<form class="toolbar" data-ac="' + x.id + '"><input name="item" maxlength="300" placeholder="' + t('ooAddAction') + '" style="flex:1;min-width:0"><select name="owner"><option value="emp">' + t('ooOwnerEmp') + '</option><option value="mgr">' + t('ooOwnerMgr') + '</option></select><button class="btn btn-line btn-sm" type="submit">' + ph('plus') + '</button></form>' : '') +
      (mgr ? K.fld(t('ooNotes'), '<textarea name="notes" rows="3" maxlength="4000">' + esc(x.notes) + '</textarea>') + K.fld(t('ooPrivate'), '<textarea name="private" rows="2" maxlength="4000">' + esc(x.privateNote || '') + '</textarea>') +
        '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-nt="' + x.id + '">' + t('ooSaveNotes') + '</button>' + (x.status === 'planned' ? ' <button type="button" class="btn btn-dark btn-sm" data-dn="' + x.id + '">' + t('ooDone') + '</button>' : '') + '</div>'
        : (x.notes ? '<h4 style="margin:10px 0 4px">' + t('ooNotes') + '</h4><p style="white-space:pre-wrap">' + esc(x.notes) + '</p>' : '')) + '</div>';
  }
  function goalRow(x, i){
    var last = x.checkins[x.checkins.length - 1];
    return '<div class="row w2-row"><div class="main"><b>' + esc(x.title) + '</b><small>' + (x.measure ? esc(x.measure) + K.sep() : '') + (x.dueDate ? t('ooDue') + ' ' + K.fmt(x.dueDate) + K.sep() : '') + t(x.setBy === 'self' ? 'ooBySelf' : 'ooByMgr') + '</small>' +
      '<div style="height:6px;border-radius:3px;background:var(--line);margin:6px 0;max-width:320px"><i style="display:block;height:6px;border-radius:3px;width:' + x.progress + '%;background:var(--brand)"></i></div>' +
      (last ? '<small>' + esc(last.by) + K.sep() + K.fmtT(last.at) + (last.note ? K.sep() + esc(last.note) : '') + '</small>' : '') + '</div>' +
      '<div class="act" style="display:flex;gap:6px;align-items:center"><b class="num">' + x.progress + '%</b>' + (x.status === 'active' ? '<button type="button" class="btn btn-dark btn-sm" data-ci="' + i + '">' + t('ooCheckIn') + '</button>' : K.chip(t('oos_done'), 'in')) +
      (x.canEdit ? '<button type="button" class="btn btn-line btn-sm" data-ge="' + i + '">' + t('w2Edit') + '</button>' : '') + '</div></div>';
  }
  function goalForm(x, again){
    K.formDrawer(x.id ? t('w2Edit') : t('ooNewGoal'), '', K.fld(t('ooGoal'), '<input name="title" maxlength="200" required value="' + esc(x.title || '') + '">') + K.fld(t('ooMeasure'), '<input name="measure" maxlength="300" value="' + esc(x.measure || '') + '">') +
      K.fld(t('ooDue'), '<input type="date" name="dueDate" value="' + esc(x.dueDate || '') + '">') + (x.id ? K.chk('drop', t('ooDrop'), false) : ''),
      function(v){ return api('goalSave', { goal: { id: x.id, empId: x.empId, title: v.title, measure: v.measure, dueDate: v.dueDate, status: v.drop ? 'dropped' : undefined } }); }, again);
  }
  load();
}
window.OneOnOne = { section: oneOnOneSection };

window.OpenShifts = { section: openShiftsSection };
})();
