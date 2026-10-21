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
    K.two(K.fld(t('cpCity'), '<input name="city" maxlength="60" value="' + esc(p.city || '') + '">'), K.fld(t('cpCloses'), '<input type="date" name="closesOn" value="' + esc(p.closesOn || '') + '">')) +
    K.fld(t('cpAudience'), '<select name="audience">' + K.opts([['public', t('cpaPublic')], ['internal', t('cpaInternal')]], p.audience || 'public') + '</select>'),
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

// =================================================================== TALENT: 9-BOX AND SUCCESSION (2026-10-19)
Object.assign(T.ar, {
  tlTitle:'المواهب والتعاقب', tlLead:'مصفوفة الأداء والإمكانات (9 مربعات) وخطط التعاقب على الوظائف الحرجة. سرية: لا يراها الموظف المعني. الأداء من آخر تقييم مغلق؛ الإمكانات يحددها المدير أو الموارد البشرية مع ملاحظة.',
  tlGrid:'مصفوفة الأداء والإمكانات', tlSucc:'التعاقب', tlPerf:'الأداء', tlPot:'الإمكانات', tlLow:'منخفض', tlMed:'متوسط', tlHigh:'مرتفع', tlRate:'تحديد الإمكانات', tlUnrated:'بلا إمكانات', tlNoReview:'بلا تقييم مغلق',
  tlPlaced:'في المصفوفة', tlNote:'سبب التقدير', tlKey:'وظيفة حرجة', tlIncumbent:'شاغل الوظيفة', tlFlight:'خطر المغادرة', tlSuccessors:'المرشحون للخلافة', tlReady:'الجاهزية', tlr_now:'جاهز الآن', 'tlr_1-2y':'خلال 1-2 سنة', 'tlr_3y+':'3 سنوات أو أكثر',
  tlGaps:'وظائف بلا خليفة جاهز', tlHighRisk:'خطر مغادرة مرتفع', tlAddPlan:'إضافة وظيفة حرجة', tlPerson:'الموظف', tlNoPerson:'-',
  tb_11:'أداء منخفض · إمكانات منخفضة', tb_12:'أداء منخفض · إمكانات متوسطة', tb_13:'إمكانات مرتفعة · أداء منخفض', tb_21:'أداء متوسط · إمكانات منخفضة', tb_22:'الركيزة الأساسية', tb_23:'نجم صاعد', tb_31:'خبير موثوق', tb_32:'أداء مرتفع', tb_33:'نجم'
});
Object.assign(T.en, {
  tlTitle:'Talent and succession', tlLead:'The performance and potential grid (9-box) and succession plans for key positions. Confidential: never shown to the person concerned. Performance comes from the latest closed review; potential is set by the manager or HR, with a note.',
  tlGrid:'Performance and potential grid', tlSucc:'Succession', tlPerf:'Performance', tlPot:'Potential', tlLow:'Low', tlMed:'Medium', tlHigh:'High', tlRate:'Set potential', tlUnrated:'No potential set', tlNoReview:'No closed review',
  tlPlaced:'On the grid', tlNote:'Reason', tlKey:'Key position', tlIncumbent:'Incumbent', tlFlight:'Flight risk', tlSuccessors:'Successors', tlReady:'Readiness', tlr_now:'Ready now', 'tlr_1-2y':'In 1-2 years', 'tlr_3y+':'3+ years',
  tlGaps:'Positions with no ready successor', tlHighRisk:'High flight risk', tlAddPlan:'Add a key position', tlPerson:'Person', tlNoPerson:'-',
  tb_11:'Low performance · low potential', tb_12:'Low performance · medium potential', tb_13:'High potential · low performance', tb_21:'Medium performance · low potential', tb_22:'Core player', tb_23:'Rising star', tb_31:'Trusted expert', tb_32:'High performer', tb_33:'Star'
});
function talentSection(body){
  var box = K.head(body, 'tlTitle', 'tlLead'), tab = S.tlTab || 'grid', lv = { low: 'tlLow', medium: 'tlMed', high: 'tlHigh' }, n3 = { low: 1, medium: 2, high: 3 };
  function load(){
    K.busy(box);
    var calls = [api('nineBox', {}, true)]; if (R().hr || R().executive || isHr()) calls.push(api('successionList', {}, true));
    Promise.all(calls).then(function(res){
      if (!box.isConnected) return;
      var g = res[0], sc = res[1];
      if (!g.ok) return box.innerHTML = K.bad(g.error);
      var tabs = [['grid', 'squares-four', 'tlGrid']]; if (sc && sc.ok) tabs.push(['succ', 'tree-structure', 'tlSucc']); else tab = 'grid';
      var h = '<div class="toolbar">' + K.tabsBar(tab, tabs) + '</div>';
      if (tab === 'grid') {
        h += K.tiles([[t('tlPlaced'), K.n(g.placed)], [t('tlUnrated'), K.n(g.unrated), '', g.unrated > 0], [t('tlNoReview'), K.n(g.noReview)]]);
        var cell = function(p, q){ var k = p + '|' + q, ppl = g.rows.filter(function(x){ return x.performance === p && x.potential === q; });
          var tone = n3[p] + n3[q] >= 5 ? 'background:#E3F1E7' : n3[p] + n3[q] <= 3 ? 'background:#FBE9E7' : 'background:var(--paper)';
          return '<div style="' + tone + ';border-radius:12px;padding:8px;min-height:86px"><b style="font-size:12px">' + t('tb_' + n3[p] + n3[q]) + '</b><div class="num" style="font-size:22px;font-weight:800">' + (g.grid[k] || 0) + '</div><small style="display:block;color:var(--ink-3)">' + ppl.slice(0, 4).map(function(x){ return esc(K.lang(x.emp.name, x.emp.nameEn)); }).join('، ') + (ppl.length > 4 ? ' +' + (ppl.length - 4) : '') + '</small></div>'; };
        h += '<div class="db-card" style="padding:14px;margin-bottom:12px"><div style="display:grid;grid-template-columns:28px repeat(3,1fr);gap:6px;align-items:stretch">' +
          ['high', 'medium', 'low'].map(function(q){ return '<div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;text-align:center;color:var(--ink-3)">' + t('tlPot') + ' ' + t(lv[q]) + '</div>' + ['low', 'medium', 'high'].map(function(p){ return cell(p, q); }).join(''); }).join('') +
          '<div></div>' + ['low', 'medium', 'high'].map(function(p){ return '<div style="text-align:center;font-size:11px;color:var(--ink-3)">' + t('tlPerf') + ' ' + t(lv[p]) + '</div>'; }).join('') + '</div></div>';
        h += g.rows.length ? '<div class="list">' + g.rows.map(function(x, i){ return '<div class="row w2-row"><div class="main"><b>' + K.empLine(x.emp) + '</b><small>' + t('tlPerf') + ': ' + (x.performance ? t(lv[x.performance]) + ' (' + x.rating + ')' : t('tlNoReview')) + K.sep() + t('tlPot') + ': ' + (x.potential ? t(lv[x.potential]) : '-') + (x.note ? K.sep() + esc(x.note) : '') + '</small></div><div class="act"><button type="button" class="btn btn-line btn-sm" data-pt="' + i + '">' + t('tlRate') + '</button></div></div>'; }).join('') + '</div>' : K.empty('users', t('w2None'));
      } else {
        h += K.tiles([[t('tlKey'), K.n(sc.rows.length)], [t('tlGaps'), K.n(sc.gaps), '', sc.gaps > 0], [t('tlHighRisk'), K.n(sc.highRisk), '', sc.highRisk > 0]]) +
          (sc.canEdit ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="tlAdd">' + ph('plus') + t('tlAddPlan') + '</button></div>' : '');
        h += sc.rows.length ? sc.rows.map(function(p, i){ return '<div class="db-card" style="padding:14px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>' + esc(K.lang(p.position.titleAr, p.position.titleEn)) + '</b>' + (p.readyNow ? K.chip(t('tlr_now') + ' ' + p.readyNow, 'in') : K.chip(t('tlGaps'), 'out')) + (p.flightRisk ? K.chip(t('tlFlight') + ': ' + t(lv[p.flightRisk]), p.flightRisk === 'high' ? 'late' : '') : '') + '<span style="flex:1"></span>' + (sc.canEdit ? '<button type="button" class="btn btn-line btn-sm" data-sp="' + i + '">' + t('w2Edit') + '</button>' : '') + '</div>' +
          '<small>' + t('tlIncumbent') + ': ' + (p.incumbent ? K.empLine(p.incumbent) : '-') + '</small><ol style="margin:8px 0 0;padding-inline-start:20px">' + p.successors.map(function(s){ return '<li>' + K.empLine(s.emp) + ' · ' + t('tlr_' + s.readiness) + (s.rating ? ' · ' + t('tlPerf') + ' ' + s.rating : '') + (s.note ? ' · ' + esc(s.note) : '') + '</li>'; }).join('') + '</ol></div>'; }).join('') : K.empty('tree-structure', t('w2None'));
      }
      box.innerHTML = h; K.wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.tlTab = b.dataset.tab; load(); }; });
      $$('[data-pt]', box).forEach(function(b){ b.onclick = function(){ var x = g.rows[b.dataset.pt];
        K.formDrawer(t('tlRate'), K.empLine(x.emp), K.fld(t('tlPot'), '<select name="potential">' + K.opts([['low', t('tlLow')], ['medium', t('tlMed')], ['high', t('tlHigh')]], x.potential || 'medium') + '</select>') + K.fld(t('tlNote'), '<input name="note" maxlength="300" required value="' + esc(x.note) + '">'),
          function(v){ return api('potentialSave', { empId: x.emp.id, potential: v.potential, note: v.note }); }, load); }; });
      var add = $('#tlAdd', box); if (add) add.onclick = function(){ planForm({}, sc, load); };
      $$('[data-sp]', box).forEach(function(b){ b.onclick = function(){ planForm(sc.rows[b.dataset.sp], sc, load); }; });
    });
  }
  function planForm(p, sc, again){
    K.people(function(P){
      var emps = P.rows.map(function(e){ return [e.id, e.name + ' (' + e.empNo + ')']; }), su = (p.successors || []).concat([{}, {}, {}, {}]).slice(0, 4);
      var rd = [['now', t('tlr_now')], ['1-2y', t('tlr_1-2y')], ['3y+', t('tlr_3y+')]];
      K.formDrawer(p.id ? t('w2Edit') : t('tlAddPlan'), '', K.fld(t('tlKey'), '<select name="positionId" required>' + K.opts(sc.positions.map(function(x){ return [x.id, K.lang(x.titleAr, x.titleEn) + (x.code ? ' · ' + x.code : '')]; }), p.positionId || '', t('w2Pick')) + '</select>') +
        K.two(K.fld(t('tlIncumbent'), '<select name="incumbentEmpId">' + K.opts(emps, p.incumbent ? p.incumbent.id : '', t('tlNoPerson')) + '</select>'), K.fld(t('tlFlight'), '<select name="flightRisk">' + K.opts([['low', t('tlLow')], ['medium', t('tlMed')], ['high', t('tlHigh')]], p.flightRisk || '', '-') + '</select>')) +
        su.map(function(s, i){ return K.two(K.fld(t('tlSuccessors') + ' ' + (i + 1), '<select name="s' + i + '">' + K.opts(emps, s.emp ? s.emp.id : '', '-') + '</select>'), K.fld(t('tlReady'), '<select name="r' + i + '">' + K.opts(rd, s.readiness || '1-2y') + '</select>')); }).join(''),
        function(v){ var list = [0, 1, 2, 3].filter(function(i){ return v['s' + i]; }).map(function(i){ return { empId: v['s' + i], readiness: v['r' + i] }; });
          return api('successionSave', { plan: { id: p.id, positionId: v.positionId, incumbentEmpId: v.incumbentEmpId, flightRisk: v.flightRisk, successors: list } }); }, again);
    });
  }
  load();
}
window.Talent = { section: talentSection };

// =================================================================== ROLES AND PERMISSIONS (2026-10-19)
Object.assign(T.ar, {
  rlTitle:'الأدوار والصلاحيات', rlLead:'عرض للقراءة فقط: من يحمل كل دور، وما يفتحه كل دور من صفحات، وآخر تغييرات الأدوار. تعديل الأدوار يبقى في سجل الموظف (المدير العام يمنح الرواتب والإدارة التنفيذية). كل قاعدة هنا مطبقة على الخادم أيضا.',
  rlHolders:'من يحمل الأدوار', rlMatrix:'الصفحات حسب الدور', rlRules:'قواعد مطبقة على الخادم', rlChanges:'آخر تغييرات الأدوار', rlPage:'الصفحة', rlManagers:'مديرون لديهم فريق', rlActive:'موظفون نشطون',
  rlr_employee:'موظف', rlr_manager:'مدير فريق', rlr_hr:'موارد بشرية', rlr_payroll:'رواتب', rlr_executive:'إدارة تنفيذية', rlr_admin:'مدير النظام', rlr_adminpay:'مدير نظام + رواتب',
  rlRule1:'لا أحد يعتمد طلبه أو يغير راتبه أو حسابه البنكي أو صلاحياته بنفسه.', rlRule2:'تغيير الراتب يحتاج شخصا ثانيا للاعتماد، واعتماد مسير الرواتب لا يكون ممن أعده.', rlRule3:'مدير النظام وحده لا يرى الرواتب إلا إذا منح دور الرواتب.',
  rlRule4:'المدير يرى بيانات فريقه الوظيفية فقط، دون الرواتب والبيانات الخاصة والمستندات.', rlRule5:'الاستبيانات والتقييم 360 مجهولة: لا تظهر نتيجة لمجموعة أقل من 5 (360: أقل من 3).', rlRule6:'المواهب والتعاقب سرية ولا يراها الموظف المعني.',
  rlBy:'بواسطة', rla_roles_update:'تغيير الأدوار الإضافية', rla_emp_update:'تغيير الدور', rla_emp_create:'إنشاء بدور'
});
Object.assign(T.en, {
  rlTitle:'Roles and permissions', rlLead:'Read-only: who holds each role, which pages each role opens, and the latest role changes. Roles are still changed on the employee record (the administrator grants payroll and executive). Every rule here is also enforced on the server.',
  rlHolders:'Who holds the roles', rlMatrix:'Pages by role', rlRules:'Rules enforced on the server', rlChanges:'Latest role changes', rlPage:'Page', rlManagers:'Managers with a team', rlActive:'Active employees',
  rlr_employee:'Employee', rlr_manager:'Team manager', rlr_hr:'HR', rlr_payroll:'Payroll', rlr_executive:'Executive', rlr_admin:'Administrator', rlr_adminpay:'Admin + payroll',
  rlRule1:'Nobody approves their own request or changes their own salary, bank account or rights.', rlRule2:'A salary change needs a second approver; a payroll run is approved by someone other than its preparer.', rlRule3:'An administrator alone sees no salaries unless also given the payroll role.',
  rlRule4:'Managers see their team\'s job data only: no salaries, private data or documents.', rlRule5:'Surveys and 360 feedback are anonymous: no result for a group under 5 (360: under 3).', rlRule6:'Talent and succession are confidential and never shown to the person concerned.',
  rlBy:'By', rla_roles_update:'Extra roles changed', rla_emp_update:'Role changed', rla_emp_create:'Created with role'
});
/** Which sub-pages a role profile opens: evaluates the menu's own rules with that profile, then restores the session. */
function pagesFor(profile){
  var me0 = S.me, fr0 = S.fileRoles, out = {};
  try {
    S.me = Object.assign({}, me0, { role: profile.role });
    S.fileRoles = { hr: profile.role === 'hr' || profile.role === 'admin', payroll: !!profile.payroll, executive: !!profile.executive, manager: !!profile.manager };
    AREAS.forEach(function(a){ a.subs.forEach(function(s){ if (s.page) return; try { out[a.id + ':' + s.id] = !!s.ok(); } catch (e) { out[a.id + ':' + s.id] = false; } }); });
  } finally { S.me = me0; S.fileRoles = fr0; }
  return out;
}
function rolesSection(body){
  var box = K.head(body, 'rlTitle', 'rlLead'); K.busy(box);
  api('rolesOverview', {}, true).then(function(r){
    if (!box.isConnected) return;
    if (!r.ok) return box.innerHTML = K.bad(r.error);
    var P = [['employee', { role: 'employee' }], ['manager', { role: 'employee', manager: true }], ['hr', { role: 'hr' }], ['payroll', { role: 'employee', payroll: true }], ['executive', { role: 'employee', executive: true }], ['admin', { role: 'admin' }], ['adminpay', { role: 'admin', payroll: true }]];
    var M = P.map(function(p){ return pagesFor(p[1]); });
    var h = K.tiles([[t('rlActive'), K.n(r.active)], [t('rlr_hr'), K.n(r.holders.hr.length)], [t('rlr_payroll'), K.n(r.holders.payroll.length)], [t('rlr_executive'), K.n(r.holders.executive.length)], [t('rlr_admin'), K.n(r.holders.admin.length)], [t('rlManagers'), K.n(r.managers)]]);
    h += '<h3 style="margin:16px 0 8px">' + t('rlHolders') + '</h3><div class="list">' + ['hr', 'payroll', 'executive', 'admin'].map(function(k){
      return '<div class="row w2-row"><div class="main"><b>' + t('rlr_' + k) + ' · ' + r.holders[k].length + '</b><small>' + (r.holders[k].map(K.empLine).join('، ') || '-') + '</small></div></div>'; }).join('') + '</div>';
    h += '<h3 style="margin:16px 0 8px">' + t('rlRules') + '</h3><ul style="margin:0;padding-inline-start:20px;line-height:1.9">' + [1, 2, 3, 4, 5, 6].map(function(i){ return '<li>' + t('rlRule' + i) + '</li>'; }).join('') + '</ul>';
    h += '<h3 style="margin:16px 0 8px">' + t('rlMatrix') + '</h3><div class="w2-mx"><table><thead><tr><th>' + t('rlPage') + '</th>' + P.map(function(p){ return '<th style="text-align:center">' + t('rlr_' + p[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      AREAS.map(function(a){ return '<tr><th colspan="' + (P.length + 1) + '" style="background:var(--paper)">' + areaName(a) + '</th></tr>' + a.subs.filter(function(s){ return !s.page; }).map(function(s){
        return '<tr><td>' + t(s.n) + '</td>' + M.map(function(m){ return '<td style="text-align:center">' + (m[a.id + ':' + s.id] ? '<span style="color:var(--brand)">' + ph('check-circle', 'fill') + '</span>' : '<span style="color:var(--ink-3)">–</span>') + '</td>'; }).join('') + '</tr>'; }).join(''); }).join('') + '</tbody></table></div>';
    h += '<h3 style="margin:16px 0 8px">' + t('rlChanges') + '</h3>' + (r.changes.length ? '<div class="list">' + r.changes.map(function(c){
      return '<div class="row w2-row"><div class="main"><b>' + K.empLine(c.who) + ' · ' + t('rla_' + c.action) + ': ' + esc(c.extraRoles != null ? (c.extraRoles ? c.extraRoles.split(',').map(function(x){ return t('rlr_' + x); }).join('، ') : '-') : t('rlr_' + c.role)) + '</b><small>' + esc(c.at) + K.sep() + t('rlBy') + ' ' + esc(c.by) + '</small></div></div>'; }).join('') + '</div>' : K.empty('shield-check', t('w2None')));
    box.innerHTML = h; K.wire(box);
  });
}
window.Roles = { section: rolesSection };

// =================================================================== INTERNAL MOBILITY (2026-10-20)
Object.assign(T.ar, {
  mbTitle:'التنقل الداخلي والمسار الوظيفي', mbLead:'الوظائف المفتوحة داخل الشركة يمكنك التقدم لها مباشرة، ومسارات الترقي من وظيفتك الحالية ومتطلباتها. يتقدم الموظف بعد إكمال الحد الأدنى من الخدمة في وظيفته.',
  mbJobs:'وظائف داخلية', mbPaths:'المسارات الوظيفية', mbApply:'أتقدم لهذه الوظيفة', mbApplied:'تقدمت', mbInternalOnly:'داخلية فقط', mbNotYet:'يمكنك التقدم للوظائف الداخلية من {d} (بعد {m} أشهر خدمة).',
  mbFromMine:'من وظيفتك الحالية', mbAll:'كل المسارات', mbYears:'سنوات عادة', mbReq:'المتطلبات', mbNewPath:'مسار جديد', mbFrom:'من وظيفة', mbTo:'إلى وظيفة', mbNoPos:'لا توجد وظيفة مسجلة لك؛ تواصل مع الموارد البشرية.',
  mbRemove:'حذف المسار', mbNote:'لماذا تناسبك هذه الوظيفة؟ (اختياري)', cpAudience:'من يراها', cpaPublic:'الموظفون وصفحة الوظائف العامة', cpaInternal:'الموظفون فقط', e_too_early:'لم تكمل بعد الحد الأدنى من الخدمة للتقدم الداخلي.'
});
Object.assign(T.en, {
  mbTitle:'Internal mobility and career paths', mbLead:'Open jobs inside the company you can apply for directly, and the paths up from your current position with what they need. Employees apply after the minimum service in their role.',
  mbJobs:'Internal jobs', mbPaths:'Career paths', mbApply:'Apply for this job', mbApplied:'Applied', mbInternalOnly:'Internal only', mbNotYet:'You can apply for internal jobs from {d} (after {m} months of service).',
  mbFromMine:'From your position', mbAll:'All paths', mbYears:'years typically', mbReq:'Requirements', mbNewPath:'New path', mbFrom:'From position', mbTo:'To position', mbNoPos:'No position is recorded for you; contact HR.',
  mbRemove:'Remove the path', mbNote:'Why does this job suit you? (optional)', cpAudience:'Who sees it', cpaPublic:'Employees and the public careers page', cpaInternal:'Employees only', e_too_early:'You have not yet completed the minimum service to apply internally.'
});
function mobilitySection(body){
  var box = K.head(body, 'mbTitle', 'mbLead'), tab = S.mbTab || 'jobs';
  function load(){
    K.busy(box);
    Promise.all([api('internalJobs', {}, true), api('careerPathList', {}, true)]).then(function(res){
      if (!box.isConnected) return;
      var j = res[0], p = res[1];
      if (!j.ok) return box.innerHTML = K.bad(j.error);
      var h = '<div class="toolbar">' + K.tabsBar(tab, [['jobs', 'briefcase', 'mbJobs'], ['paths', 'path', 'mbPaths']]) + '<span class="sp"></span>' + (tab === 'paths' && p.canEdit ? '<button type="button" class="btn btn-dark btn-sm" id="mbN">' + ph('plus') + t('mbNewPath') + '</button>' : '') + '</div>';
      if (tab === 'jobs') {
        if (!j.eligible) h += '<p class="w2-warn">' + ph('info') + ' ' + t('mbNotYet').replace('{d}', K.fmt(j.eligibleFrom)).replace('{m}', j.minMonths) + '</p>';
        h += j.rows.length ? '<div class="list">' + j.rows.map(function(x, i){
          return '<div class="row w2-row"><div class="main"><b>' + esc(K.lang(x.titleAr, x.titleEn)) + '</b><small>' + [K.lang(x.deptAr, x.deptEn), x.city, x.closesOn ? t('cpCloses') + ' ' + K.fmt(x.closesOn) : ''].filter(String).map(esc).join(' · ') + '</small>' +
            (K.lang(x.summaryAr, x.summaryEn) ? '<small>' + esc(K.lang(x.summaryAr, x.summaryEn)).slice(0, 220) + '</small>' : '') + '</div><div class="act" style="display:flex;gap:6px;align-items:center">' + (x.internalOnly ? K.chip(t('mbInternalOnly'), '') : '') +
            (x.applied ? K.chip(t('mbApplied'), 'in') : j.eligible ? '<button type="button" class="btn btn-dark btn-sm" data-ap="' + i + '">' + t('mbApply') + '</button>' : '') + '</div></div>';
        }).join('') + '</div>' : K.empty('briefcase', t('w2None'));
      } else {
        var mine = p.rows.filter(function(x){ return x.from.id === p.myPositionId; }), rest = p.rows.filter(function(x){ return x.from.id !== p.myPositionId; });
        var card = function(x, i){ return '<div class="row w2-row"><div class="main"><b>' + esc(K.lang(x.from.titleAr, x.from.titleEn)) + ' ' + ph(S.lang === 'en' ? 'arrow-right' : 'arrow-left') + ' ' + esc(K.lang(x.to.titleAr, x.to.titleEn)) + (x.to.grade ? ' <small>(' + esc(x.to.grade) + ')</small>' : '') + '</b><small>' + (x.years ? x.years + ' ' + t('mbYears') : '') + '</small>' + (K.lang(x.requirementsAr, x.requirementsEn) ? '<small style="white-space:pre-wrap">' + t('mbReq') + ': ' + esc(K.lang(x.requirementsAr, x.requirementsEn)) + '</small>' : '') + '</div>' + (p.canEdit ? '<div class="act"><button type="button" class="btn btn-line btn-sm" data-pe="' + p.rows.indexOf(x) + '">' + t('w2Edit') + '</button></div>' : '') + '</div>'; };
        h += '<h3 style="margin:8px 0">' + t('mbFromMine') + '</h3>' + (p.myPositionId ? (mine.length ? '<div class="list">' + mine.map(card).join('') + '</div>' : K.empty('path', t('w2None'))) : '<p class="hr-hint">' + t('mbNoPos') + '</p>') +
          (rest.length ? '<h3 style="margin:16px 0 8px">' + t('mbAll') + '</h3><div class="list">' + rest.map(card).join('') + '</div>' : '');
      }
      box.innerHTML = h; K.wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.mbTab = b.dataset.tab; load(); }; });
      $$('[data-ap]', box).forEach(function(b){ b.onclick = function(){ var x = j.rows[b.dataset.ap];
        K.formDrawer(t('mbApply'), esc(K.lang(x.titleAr, x.titleEn)), K.fld(t('mbNote'), '<textarea name="note" rows="3" maxlength="1000"></textarea>'), function(v){ return api('internalApply', { postId: x.id, note: v.note }); }, load, t('mbApply')); }; });
      var pf = function(x){ var po = p.positions.map(function(q){ return [q.id, K.lang(q.titleAr, q.titleEn) + (q.grade ? ' (' + q.grade + ')' : '')]; });
        K.formDrawer(x.id ? t('w2Edit') : t('mbNewPath'), '', K.two(K.fld(t('mbFrom'), '<select name="fromPositionId" required>' + K.opts(po, x.from ? x.from.id : '', t('w2Pick')) + '</select>'), K.fld(t('mbTo'), '<select name="toPositionId" required>' + K.opts(po, x.to ? x.to.id : '', t('w2Pick')) + '</select>')) +
          K.fld(t('mbYears'), '<input type="number" name="years" min="0" max="30" value="' + (x.years || 2) + '">') + K.fld(t('mbReq') + ' (AR)', '<textarea name="requirementsAr" rows="3" maxlength="1000">' + esc(x.requirementsAr || '') + '</textarea>') + K.fld(t('mbReq') + ' (EN)', '<textarea name="requirementsEn" rows="3" maxlength="1000" dir="ltr">' + esc(x.requirementsEn || '') + '</textarea>') + (x.id ? K.chk('remove', t('mbRemove'), false) : ''),
          function(v){ v.id = x.id; v.years = Number(v.years); return api('careerPathSave', { path: v }); }, load); };
      var nb = $('#mbN', box); if (nb) nb.onclick = function(){ pf({}); };
      $$('[data-pe]', box).forEach(function(b){ b.onclick = function(){ pf(p.rows[b.dataset.pe]); }; });
    });
  }
  load();
}
window.Mobility = { section: mobilitySection };

// =================================================================== COMPANY DATA EXPORT (2026-10-20)
Object.assign(T.ar, {
  dxTitle:'تصدير بيانات الشركة', dxLead:'ملف Excel واحد فيه كل جداول النظام، لنقل البيانات أو الاحتفاظ بنسخة (حق نقل البيانات في نظام حماية البيانات الشخصية). لا يتضمن أبدا أسرار الدخول (كلمات المرور والرموز السرية ومفاتيح الأجهزة). الرواتب والبيانات الخاصة تخرج فقط إن كان لديك دور الرواتب. كل تصدير يسجل في سجل التدقيق، وبحد 3 مرات يوميا.',
  dxRun:'تصدير الآن', dxWorking:'جار تجهيز الملف…', dxDone:'تم تنزيل الملف', dxTabs:'الجداول', dxRows:'الصفوف', dxSkipped:'لم تصدر', dxNoPay:'بدون الرواتب (ليس لديك دور الرواتب)', dxWithPay:'مع الرواتب'
});
Object.assign(T.en, {
  dxTitle:'Company data export', dxLead:'One Excel file with every table in the system, to move the data or keep a copy (data portability under the Personal Data Protection Law). It never includes sign-in secrets (passwords, PINs, device keys). Salaries and private data are included only if you also hold the payroll role. Every export is written to the audit trail, at most 3 a day.',
  dxRun:'Export now', dxWorking:'Preparing the file…', dxDone:'File downloaded', dxTabs:'Tables', dxRows:'Rows', dxSkipped:'Not exported', dxNoPay:'Without pay data (you do not hold the payroll role)', dxWithPay:'With pay data'
});
var XLSX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', xlsxWait = null;
function xlsxReady(){ if (window.XLSX) return Promise.resolve(); if (xlsxWait) return xlsxWait; xlsxWait = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = XLSX_SRC; s.onload = res; s.onerror = function(){ xlsxWait = null; rej(); }; document.head.appendChild(s); }); return xlsxWait; }
function exportSection(body){
  var box = K.head(body, 'dxTitle', 'dxLead');
  box.innerHTML = '<div class="toolbar"><button type="button" class="btn btn-dark" id="dxGo">' + ph('download-simple') + t('dxRun') + '</button></div><div id="dxOut"></div>';
  var b = $('#dxGo', box), out = $('#dxOut', box);
  K.confirmTap(b, function(){
    out.innerHTML = '<p class="hr-hint">' + t('dxWorking') + '</p>';
    Promise.all([api('dataExport', {}), xlsxReady()]).then(function(res){
      var r = res[0]; b.disabled = false; delete b.dataset.armed; b.innerHTML = ph('download-simple') + t('dxRun');
      if (!r.ok) return out.innerHTML = K.bad(r.error);
      var wb = XLSX.utils.book_new(), names = Object.keys(r.tabs), total = 0;
      var info = [['Company', (r.company || {}).nameEn || (r.company || {}).nameAr || ''], ['Exported at', r.at], ['Exported by', S.me.name + ' (' + S.me.empNo + ')'], ['Pay data', r.withPay ? 'included' : 'not included'], ['Not exported', r.skipped.join(', ')], [], ['Table', 'Rows']];
      names.forEach(function(n){ var tb = r.tabs[n]; total += tb.rows.length; info.push([n, tb.rows.length]); });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), 'Info');
      names.forEach(function(n){ var tb = r.tabs[n]; XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tb.headers].concat(tb.rows)), n.slice(0, 31)); });
      XLSX.writeFile(wb, 'company-export-' + r.at.slice(0, 10) + '.xlsx');
      out.innerHTML = K.tiles([[t('dxTabs'), K.n(names.length)], [t('dxRows'), K.n(total)], [t('dxSkipped'), K.n(r.skipped.length)]]) + '<p class="hr-hint">' + ph('check-circle') + ' ' + t('dxDone') + ' · ' + (r.withPay ? t('dxWithPay') : t('dxNoPay')) + '</p>';
    }, function(){ b.disabled = false; out.innerHTML = K.bad('network'); });
  });
}
window.DataExport = { section: exportSection };

// =================================================================== WELCOME MESSAGE (HR, 2026-10-20)
function welcomeSection(body){
  var box = K.head(body, 'wlEdit', 'wlEditLead'); K.busy(box);
  api('welcome', { preview: true }, true).then(function(w){
    if (!box.isConnected) return;
    if (!w.ok) return box.innerHTML = K.bad(w.error);
    box.innerHTML = '<form class="form" id="wlF">' + K.fld(t('wlTextAr'), '<textarea name="welcomeAr" rows="6" maxlength="3000">' + esc(w.welcomeAr) + '</textarea>') + K.fld(t('wlTextEn'), '<textarea name="welcomeEn" rows="6" maxlength="3000" dir="ltr">' + esc(w.welcomeEn) + '</textarea>') +
      K.fld(t('wlDocsEdit'), '<textarea name="preboardDocs" rows="6">' + esc(w.docs.join('\n')) + '</textarea>') + '<div class="btnrow"><button class="btn btn-dark" type="submit">' + t('w2Save') + '</button></div></form><h3 style="margin:18px 0 8px">' + t('wlPreview') + '</h3><div id="wlP"></div>';
    var f = $('#wlF', box), pv = $('#wlP', box);
    var paint = function(){ var v = K.formVals(f); pv.innerHTML = welcomeHtml(Object.assign({}, w, { daysToStart: 3, hireDate: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), welcomeAr: v.welcomeAr, welcomeEn: v.welcomeEn, docs: v.preboardDocs.split('\n').map(function(x){ return x.trim(); }).filter(String) })); };
    f.oninput = paint; paint();
    f.onsubmit = function(ev){ ev.preventDefault(); var b = f.querySelector('[type=submit]'); b.disabled = true; api('welcomeSave', K.formVals(f)).then(function(r){ b.disabled = false; toast(r.ok ? t('w2Saved') : errText(r.error)); }); };
  });
}
window.Welcome = { section: welcomeSection };
// =================================================================== PERKS AND WELLNESS (2026-10-20)
Object.assign(T.ar, {
  pkTitle:'المزايا والرفاهية', pkLead:'خصومات ومزايا الموظفين وبرامج الصحة والرفاهية، وكيف تستفيد من كل منها.', pkNew:'ميزة جديدة', pkAll:'الكل', pkHow:'كيف أستفيد', pkProvider:'المقدم', pkUntil:'سارية حتى', pkLink:'الرابط (https)', pkOpenLink:'فتح الرابط', pkViews:'مشاهدات',
  pkTitleAr:'العنوان بالعربية', pkTitleEn:'العنوان بالإنجليزية', pkDescAr:'الوصف بالعربية', pkDescEn:'الوصف بالإنجليزية', pkHowAr:'طريقة الاستفادة بالعربية', pkHowEn:'طريقة الاستفادة بالإنجليزية', pkStatus:'الحالة', pks_active:'ظاهرة', pks_hidden:'مخفية', pks_deleted:'محذوفة',
  pkc_discount:'خصومات', pkc_health:'الصحة', pkc_family:'العائلة', pkc_learning:'التعلم', pkc_transport:'التنقل', pkc_wellbeing:'الرفاهية', pkc_other:'أخرى'
});
Object.assign(T.en, {
  pkTitle:'Perks and wellbeing', pkLead:'Staff discounts and benefits, health and wellbeing programmes, and how to use each one.', pkNew:'New perk', pkAll:'All', pkHow:'How to use it', pkProvider:'Provider', pkUntil:'Valid until', pkLink:'Link (https)', pkOpenLink:'Open the link', pkViews:'Views',
  pkTitleAr:'Title (Arabic)', pkTitleEn:'Title (English)', pkDescAr:'Description (Arabic)', pkDescEn:'Description (English)', pkHowAr:'How to use (Arabic)', pkHowEn:'How to use (English)', pkStatus:'Status', pks_active:'Shown', pks_hidden:'Hidden', pks_deleted:'Deleted',
  pkc_discount:'Discounts', pkc_health:'Health', pkc_family:'Family', pkc_learning:'Learning', pkc_transport:'Transport', pkc_wellbeing:'Wellbeing', pkc_other:'Other'
});
var PK_IC = { discount: 'tag', health: 'heartbeat', family: 'baby', learning: 'graduation-cap', transport: 'car', wellbeing: 'flower-lotus', other: 'gift' };
function perksSection(body){
  var box = K.head(body, 'pkTitle', 'pkLead'), cat = S.pkCat || '';
  function load(){
    K.busy(box);
    api('perkList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      var rows = r.rows.filter(function(p){ return !cat || p.category === cat; });
      var h = '<div class="toolbar"><div class="op-tabs" role="tablist"><button type="button" role="tab" data-pc="" aria-selected="' + !cat + '">' + t('pkAll') + '</button>' + r.categories.filter(function(c){ return r.rows.some(function(p){ return p.category === c; }); }).map(function(c){ return '<button type="button" role="tab" data-pc="' + c + '" aria-selected="' + (cat === c) + '">' + ph(PK_IC[c]) + t('pkc_' + c) + '</button>'; }).join('') + '</div><span class="sp"></span>' +
        (r.canEdit ? '<button type="button" class="btn btn-dark btn-sm" id="pkN">' + ph('plus') + t('pkNew') + '</button>' : '') + '</div>';
      h += rows.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">' + rows.map(function(p, i){
        return '<button type="button" class="db-card" data-pk="' + i + '" style="text-align:start;padding:14px;font:inherit;color:inherit;cursor:pointer;display:grid;gap:6px;border:1px solid var(--line);border-radius:16px;background:var(--card)">' +
          '<span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#E6F0E8;color:var(--brand);font-size:22px">' + ph(PK_IC[p.category] || 'gift', 'duotone') + '</span><b>' + esc(K.lang(p.titleAr, p.titleEn)) + '</b><small style="color:var(--ink-3)">' + esc(p.provider) + (p.validTo ? ' · ' + t('pkUntil') + ' ' + K.fmt(p.validTo) : '') + '</small>' +
          (r.canEdit ? '<small>' + (p.status !== 'active' ? K.chip(t('pks_' + p.status), 'late') + ' ' : '') + t('pkViews') + ' ' + p.views + '</small>' : '') + '</button>';
      }).join('') + '</div>' : K.empty('gift', t('w2None'));
      box.innerHTML = h; K.wire(box);
      $$('[data-pc]', box).forEach(function(b){ b.onclick = function(){ cat = S.pkCat = b.dataset.pc; load(); }; });
      $$('[data-pk]', box).forEach(function(b){ b.onclick = function(){ var p = rows[b.dataset.pk]; if (p.status === 'active') api('perkView', { id: p.id });
        var d = drawer('<h3>' + esc(K.lang(p.titleAr, p.titleEn)) + '</h3><p class="hr-hint">' + t('pkc_' + p.category) + (p.provider ? ' · ' + esc(p.provider) : '') + (p.validTo ? ' · ' + t('pkUntil') + ' ' + K.fmt(p.validTo) : '') + '</p>' +
          (K.lang(p.descAr, p.descEn) ? '<p style="white-space:pre-wrap">' + esc(K.lang(p.descAr, p.descEn)) + '</p>' : '') + (K.lang(p.howAr, p.howEn) ? '<h4>' + t('pkHow') + '</h4><p style="white-space:pre-wrap">' + esc(K.lang(p.howAr, p.howEn)) + '</p>' : '') +
          '<div class="btnrow">' + (p.link ? '<a class="btn btn-dark btn-sm" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' + ph('arrow-square-out') + t('pkOpenLink') + '</a>' : '') + (r.canEdit ? ' <button type="button" class="btn btn-line btn-sm" id="pkE">' + t('w2Edit') + '</button>' : '') + '</div>');
        var e = $('#pkE', d); if (e) e.onclick = function(){ d.remove(); perkForm(p, r.categories, load); }; }; });
      var nb = $('#pkN', box); if (nb) nb.onclick = function(){ perkForm({}, r.categories, load); };
    });
  }
  load();
}
function perkForm(p, cats, again){
  K.formDrawer(p.id ? t('w2Edit') : t('pkNew'), '', K.two(K.fld(t('w2Kind'), '<select name="category">' + K.opts(cats.map(function(c){ return [c, t('pkc_' + c)]; }), p.category || 'discount') + '</select>'), K.fld(t('pkStatus'), '<select name="status">' + K.opts([['active', t('pks_active')], ['hidden', t('pks_hidden')], ['deleted', t('pks_deleted')]], p.status || 'active') + '</select>')) +
    K.fld(t('pkTitleAr'), '<input name="titleAr" maxlength="120" required value="' + esc(p.titleAr || '') + '">') + K.fld(t('pkTitleEn'), '<input name="titleEn" maxlength="120" dir="ltr" value="' + esc(p.titleEn || '') + '">') +
    K.two(K.fld(t('pkProvider'), '<input name="provider" maxlength="80" value="' + esc(p.provider || '') + '">'), K.fld(t('pkUntil'), '<input type="date" name="validTo" value="' + esc(p.validTo || '') + '">')) +
    K.fld(t('pkDescAr'), '<textarea name="descAr" rows="3" maxlength="1500">' + esc(p.descAr || '') + '</textarea>') + K.fld(t('pkDescEn'), '<textarea name="descEn" rows="3" maxlength="1500" dir="ltr">' + esc(p.descEn || '') + '</textarea>') +
    K.fld(t('pkHowAr'), '<textarea name="howAr" rows="3" maxlength="1000">' + esc(p.howAr || '') + '</textarea>') + K.fld(t('pkHowEn'), '<textarea name="howEn" rows="3" maxlength="1000" dir="ltr">' + esc(p.howEn || '') + '</textarea>') +
    K.fld(t('pkLink'), '<input type="url" name="link" maxlength="300" dir="ltr" placeholder="https://" value="' + esc(p.link || '') + '">'),
    function(v){ v.id = p.id; return api('perkSave', { perk: v }); }, again);
}
window.Perks = { section: perksSection };

// =================================================================== ATTENDANCE SCREENS / KIOSKS (admin, 2026-10-20)
Object.assign(T.ar, {
  ksTitle:'شاشات الحضور (رمز المكتب)', ksLead:'جهاز لوحي عند مدخل المكتب يعرض رمزا يتغير كل 20 ثانية. يمسحه الموظف من التطبيق فيثبت وجوده في المكتب حتى لو كان موقع الهاتف ضعيفا داخل المبنى. يبقى التحقق ببصمة الهاتف أو الرمز السري، ويرفض الرمز المرسل من خارج المكتب.',
  ksNew:'شاشة جديدة', ksLabel:'اسم الشاشة (مثلا: المدخل الرئيسي)', ksZone:'الموقع', ksSetup:'رمز إعداد جديد', ksDisable:'إيقاف', ksSeen:'آخر اتصال', ksNever:'لم تتصل بعد', ksLinkLead:'افتح هذا الرابط مرة واحدة على الجهاز اللوحي (يظهر مرة واحدة فقط؛ إصدار رمز جديد يوقف الجهاز القديم):', ksCopy:'نسخ الرابط', ksCopied:'تم النسخ', kss_active:'تعمل', kss_disabled:'موقوفة'
});
Object.assign(T.en, {
  ksTitle:'Attendance screens (office QR)', ksLead:'A tablet at the office entrance shows a code that changes every 20 seconds. Scanning it in the app proves the person is at the office even when phone location is weak indoors. The phone\'s fingerprint or PIN is still required, and a code sent from outside the office is refused.',
  ksNew:'New screen', ksLabel:'Screen name (for example: main entrance)', ksZone:'Location', ksSetup:'New setup code', ksDisable:'Stop', ksSeen:'Last seen', ksNever:'Not connected yet', ksLinkLead:'Open this link once on the tablet (it is shown only now; a new code stops the old tablet):', ksCopy:'Copy link', ksCopied:'Copied', kss_active:'Running', kss_disabled:'Stopped'
});
function kioskAdmin(body){
  var box = K.head(body, 'ksTitle', 'ksLead');
  function showLink(r){
    var url = location.origin + location.pathname + '#kiosk/' + encodeURIComponent(r.setup);
    var d = drawer('<h3>' + esc(r.kiosk.label) + '</h3><p class="hr-hint">' + t('ksLinkLead') + '</p><input readonly dir="ltr" value="' + esc(url) + '" style="width:100%;font-size:13px;padding:10px;border:1px solid var(--line);border-radius:10px"><div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="ksC">' + ph('copy') + t('ksCopy') + '</button></div>');
    $('#ksC', d).onclick = function(){ try { navigator.clipboard.writeText(url).then(function(){ toast(t('ksCopied')); }); } catch (e) {} };
  }
  function load(){
    K.busy(box);
    api('kioskList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      var admin = isAdmin();
      box.innerHTML = (admin ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="ksN">' + ph('plus') + t('ksNew') + '</button></div>' : '') +
        (r.rows.length ? '<div class="list">' + r.rows.map(function(k, i){ return '<div class="row w2-row"><div class="main"><b><bdi>' + esc(k.code) + '</bdi> · ' + esc(k.label) + '</b><small>' + esc(k.zone) + ' · ' + t('ksSeen') + ': ' + (k.lastSeenAt ? K.fmtT(k.lastSeenAt) : t('ksNever')) + '</small></div>' +
          '<div class="act" style="display:flex;gap:6px;align-items:center">' + K.chip(t('kss_' + k.status), k.status === 'active' ? 'in' : '') + (admin ? '<button type="button" class="btn btn-line btn-sm" data-ks="' + i + '">' + t('ksSetup') + '</button>' + (k.status === 'active' ? '<button type="button" class="btn btn-line btn-sm" data-kx="' + i + '">' + t('ksDisable') + '</button>' : '') : '') + '</div></div>'; }).join('') + '</div>' : K.empty('qr-code', t('w2None')));
      var nb = $('#ksN', box); if (nb) nb.onclick = function(){ K.formDrawer(t('ksNew'), '', K.fld(t('ksLabel'), '<input name="label" maxlength="60" required>') + K.fld(t('ksZone'), '<select name="zoneId" required>' + K.opts(r.zones.map(function(z){ return [z.id, z.name]; }), '', t('w2Pick')) + '</select>'),
        function(v){ return api('kioskSave', v); }, function(x){ load(); showLink(x); }); };
      $$('[data-ks]', box).forEach(function(b){ K.confirmTap(b, function(){ api('kioskSave', { id: r.rows[b.dataset.ks].id }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); showLink(x); }); }); });
      $$('[data-kx]', box).forEach(function(b){ K.confirmTap(b, function(){ api('kioskSave', { id: r.rows[b.dataset.kx].id, disable: true }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); }); });
    });
  }
  load();
}
window.KioskAdmin = { section: kioskAdmin };

// =================================================================== HISTORY SNAPSHOTS (insights, 2026-10-21)
Object.assign(T.ar, {
  hsTitle:'السجل التاريخي الشهري', hsLead:'صورة مجمدة للقوى العاملة في آخر يوم من كل شهر: الأقسام والوظائف والسعودة والحضور والتكلفة كما كانت حينها، فلا يغير تعديل اليوم أرقام الماضي.',
  hsMonth:'الشهر', hsCompare:'مقارنة مع', hsNone2:'بدون مقارنة', hsBy:'التوزيع حسب', hsDim_dept:'القسم', hsDim_position:'الوظيفة', hsDim_nationality:'سعودي / غير سعودي', hsDim_gender:'الجنس', hsDim_tenure:'مدة الخدمة', hsDim_contract:'نوع العقد', hsDim_grade:'الدرجة',
  hsTake:'التقاط الشهر الحالي الآن', hsRebuild:'إعادة بناء شهر فائت', hsRebuildLead:'للشهور التي لم تلتقط: الحضور والتعيين وترك العمل من السجل الفعلي، أما القسم والراتب فكما هي مسجلة اليوم، ويوسم الشهر بأنه «أعيد بناؤه».', hsTaken:'تم التقاط السجل',
  hsNone:'لا توجد سجلات بعد. يلتقط النظام كل شهر تلقائيا بعد انتهائه، ويمكنك التقاط الشهر الحالي الآن أو إعادة بناء الشهور السابقة.',
  hsk_final:'نهائي', hsk_provisional:'مؤقت (يستبدل بنهاية الشهر)', hsk_rebuilt:'أعيد بناؤه', hsDamaged:'هذا السجل لا يطابق بصمته؛ عدل في الجدول يدويا.',
  hsHead:'عدد الموظفين', hsSaudi:'السعودة', hsTenure:'متوسط الخدمة (سنة)', hsAtt:'نسبة الحضور', hsTurn:'دوران العمل', hsCost:'تكلفة الرواتب', hsFemale:'نسبة الإناث', hsPkgAvg:'متوسط الراتب الشامل', hsLate:'أيام التأخير',
  hsJoined:'انضموا', hsLeft:'غادروا', hsMoved:'انتقلوا بين الأقسام', hsPaid:'تغير راتبهم', hsTrend:'الاتجاه عبر الأشهر', hsGroups:'التفاصيل', hsSmall:'مجموعة صغيرة: العدد فقط', hsPeople:'الموظفون في', hsFrom:'من قسم', hsVs:'مقابل',
  hsCostRun:'من مسير الرواتب المعتمد', hsMale:'ذكور', hsFem:'إناث', hsEmpNo:'الرقم', hsName:'الاسم', hsSaudiY:'سعودي', hsSaudiN:'غير سعودي', hsCostPkg:'تقدير من الرواتب الشاملة', e_snapshot_damaged:'السجل لا يطابق بصمته الرقمية.'
});
Object.assign(T.en, {
  hsTitle:'Monthly history', hsLead:'A frozen picture of the workforce on the last day of every month: departments, positions, Saudization, attendance and cost as they were then, so today\'s edits never change past numbers.',
  hsMonth:'Month', hsCompare:'Compare with', hsNone2:'No comparison', hsBy:'Break down by', hsDim_dept:'Department', hsDim_position:'Position', hsDim_nationality:'Saudi / non-Saudi', hsDim_gender:'Gender', hsDim_tenure:'Length of service', hsDim_contract:'Contract type', hsDim_grade:'Grade',
  hsTake:'Take this month now', hsRebuild:'Rebuild a past month', hsRebuildLead:'For months that were never taken: attendance, hires and leavers come from the real history; department and pay are as recorded today, and the month is marked "rebuilt".', hsTaken:'Snapshot taken',
  hsNone:'No snapshots yet. The system takes each month automatically once it ends; you can take this month now or rebuild past months.',
  hsk_final:'Final', hsk_provisional:'Provisional (replaced at month end)', hsk_rebuilt:'Rebuilt', hsDamaged:'This snapshot does not match its fingerprint; it was edited by hand in the sheet.',
  hsHead:'Headcount', hsSaudi:'Saudization', hsTenure:'Average service (years)', hsAtt:'Attendance', hsTurn:'Turnover', hsCost:'Payroll cost', hsFemale:'Women', hsPkgAvg:'Average package', hsLate:'Late days',
  hsJoined:'Joined', hsLeft:'Left', hsMoved:'Moved department', hsPaid:'Pay changed', hsTrend:'Trend over the months', hsGroups:'Breakdown', hsSmall:'Small group: count only', hsPeople:'People in', hsFrom:'From', hsVs:'vs',
  hsCostRun:'from the approved payroll run', hsMale:'Men', hsFem:'Women', hsEmpNo:'No.', hsName:'Name', hsSaudiY:'Saudi', hsSaudiN:'Non-Saudi', hsCostPkg:'estimate from packages', e_snapshot_damaged:'The snapshot does not match its fingerprint.'
});
function historySection(body){
  var box = K.head(body, 'hsTitle', 'hsLead'), V = window.Viz, st = { month: '', compare: '', dim: 'dept' }, LIST = null;
  var pct = function(v){ return v == null ? '-' : V.n1(v) + '%'; };
  function load(){
    K.busy(box);
    api('snapshotList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = K.bad(r.error);
      LIST = r;
      var ms = r.months;
      if (!st.month || !ms.some(function(m){ return m.month === st.month; })) { st.month = ms.length ? ms[ms.length - 1].month : ''; st.compare = ms.length > 1 ? ms[ms.length - 2].month : ''; }
      draw();
    });
  }
  function tools(){
    var r = LIST;
    return (r.canTake ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="hsRb">' + ph('clock-counter-clockwise') + t('hsRebuild') + '</button><button type="button" class="btn btn-dark btn-sm" id="hsTk">' + ph('camera') + t('hsTake') + '</button></div>' : '');
  }
  function draw(){
    var r = LIST;
    if (!r.months.length) { box.innerHTML = tools() + K.empty('clock-counter-clockwise', t('hsNone')); wireTools(); return; }
    var mo = function(sel, none){ return (none ? '<option value="">' + t('hsNone2') + '</option>' : '') + r.months.slice().reverse().map(function(m){ return '<option value="' + m.month + '"' + (m.month === sel ? ' selected' : '') + '>' + V.monthShort(m.month) + ' · ' + t('hsk_' + m.kind) + '</option>'; }).join(''); };
    var dims = ['dept', 'position', 'grade', 'nationality', 'gender', 'tenure', 'contract'];
    box.innerHTML = tools() + '<div class="toolbar" style="flex-wrap:wrap;gap:8px">' +
      '<label>' + t('hsMonth') + ' <select id="hsM">' + mo(st.month) + '</select></label>' +
      '<label>' + t('hsCompare') + ' <select id="hsC">' + mo(st.compare, true) + '</select></label>' +
      '<label>' + t('hsBy') + ' <select id="hsD">' + dims.map(function(d){ return '<option value="' + d + '"' + (d === st.dim ? ' selected' : '') + '>' + t('hsDim_' + d) + '</option>'; }).join('') + '</select></label></div>' +
      trendHtml() + '<div id="hsV"></div>';
    $('#hsM', box).onchange = function(){ st.month = this.value; view(); };
    $('#hsC', box).onchange = function(){ st.compare = this.value; view(); };
    $('#hsD', box).onchange = function(){ st.dim = this.value; view(); };
    wireTools(); V.wireLines(box); V.wireTips(box);
    view();
  }
  function trendHtml(){
    var ms = LIST.months.filter(function(m){ return m.summary && m.summary.headcount != null; });
    if (ms.length < 2) return '';
    var line = function(id, title, key, o){ return V.card(id, title, '', V.lineChart(ms.map(function(m){ var v = typeof key === 'function' ? key(m.summary) : m.summary[key]; return { label: V.monthShort(m.month), y: v == null ? 0 : v }; }), o || {})); };
    return '<h3 style="margin:14px 0 6px">' + t('hsTrend') + '</h3><div class="db-grid">' + line('hsT1', t('hsHead'), 'headcount') + line('hsT2', t('hsSaudi'), 'saudiPct', { suffix: '%', max: 100 }) +
      line('hsT3', t('hsAtt'), 'attendancePct', { suffix: '%', max: 100 }) + line('hsT4', t('hsTurn'), 'turnoverPct', { suffix: '%' }) +
      (LIST.money ? line('hsT5', t('hsCost'), function(s){ return s.payroll ? s.payroll.cost : null; }, { fmt: 'sar' }) : '') + '</div>';
  }
  function wireTools(){
    var tk = $('#hsTk', box), rb = $('#hsRb', box);
    if (tk) K.confirmTap(tk, function(){ api('snapshotTake', {}).then(function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('hsTaken')); st.month = x.month; load(); }); });
    if (rb) rb.onclick = function(){
      K.formDrawer(t('hsRebuild'), t('hsRebuildLead'), K.fld(t('hsMonth'), '<input type="month" name="month" required dir="ltr">'), function(v){ return api('snapshotTake', { month: v.month }); }, function(x){ st.month = x.month; load(); });
    };
  }
  function view(){
    var el = $('#hsV', box); K.busy(el);
    api('snapshotView', { month: st.month, compare: st.compare || undefined, dim: st.dim }, true).then(function(r){
      if (!el.isConnected) return;
      if (!r.ok) return el.innerHTML = K.bad(r.error);
      var s = r.summary, c = r.compare ? r.compare.summary : null, dlt = function(k, f){ if (!c) return null; var a = f ? f(s) : s[k], b = f ? f(c) : c[k]; return a == null || b == null ? null : a - b; };
      var cost = function(x){ return x.payroll ? x.payroll.cost : null; };
      var words = c ? t('hsVs') + ' ' + V.monthShort(r.compare.month) : '';
      var h = '<p class="hr-hint">' + K.chip(t('hsk_' + r.kind), r.kind === 'final' ? 'in' : '') + ' ' + K.fmt(r.asOf) + '</p>' +
        '<div class="db-tiles">' + V.tile(t('hsHead'), V.n1(s.headcount, 0), '', dlt('headcount'), null, true, '', { words: words }) +
        V.tile(t('hsSaudi'), pct(s.saudiPct), '', dlt('saudiPct'), true, false, 'pt', { words: words }) +
        V.tile(t('hsAtt'), pct(s.attendancePct), '', dlt('attendancePct'), true, false, 'pt', { words: words }) +
        V.tile(t('hsTurn'), pct(s.turnoverPct), s.hires + ' ' + t('hsJoined') + ' · ' + s.leavers + ' ' + t('hsLeft'), dlt('turnoverPct'), false, false, 'pt', { words: words }) +
        V.tile(t('hsTenure'), V.n1(s.avgTenure), '', dlt('avgTenure'), true, false, '', { words: words }) +
        (s.payroll ? V.tile(t('hsCost'), V.sar(s.payroll.cost), t(s.payroll.source === 'run' ? 'hsCostRun' : 'hsCostPkg'), dlt(null, cost), null, false, '', { words: words }) : '') + '</div>';
      if (r.compare) {
        var mv = r.compare.movement, chip = function(k, n, key){ return '<button type="button" class="btn btn-line btn-sm" data-ch="' + key + '"' + (LIST.names && n ? '' : ' disabled') + '>' + t(k) + ': <b>' + n + '</b></button>'; };
        h += '<div class="toolbar" style="flex-wrap:wrap;gap:6px">' + chip('hsJoined', mv.joined, 'joined') + chip('hsLeft', mv.left, 'left') + chip('hsMoved', mv.transferred, 'transferred') +
          (mv.payChanged != null ? '<span class="chip">' + t('hsPaid') + ': ' + mv.payChanged + '</span>' : '') + '</div>';
      }
      var cg = {}; if (r.compare) r.compare.groups.forEach(function(g){ cg[g.key] = g; });
      var money = LIST.money, head = [t('hsDim_' + st.dim), t('hsHead'), t('hsSaudi'), t('hsFemale'), t('hsTenure'), t('hsAtt'), t('hsLate')].concat(money ? [t('hsPkgAvg')] : []);
      var dif = function(a, b, unit){ return b == null || a == null ? '' : ' <small class="muted">(' + (a - b >= 0 ? '+' : '') + V.n1(a - b) + (unit || '') + ')</small>'; };
      var rows = r.groups.map(function(g, i){
        var o = cg[g.key] || {}, lbl = st.dim === 'nationality' ? t(g.key === 'saudi' ? 'hsSaudiY' : 'hsSaudiN') : st.dim === 'gender' ? (g.key === 'male' ? t('hsMale') : g.key === 'female' ? t('hsFem') : '-') : esc(g.label);
        var name = LIST.names ? '<a href="#" data-g="' + i + '">' + lbl + '</a>' : lbl;
        if (g.small) return [name, g.headcount + dif(g.headcount, o.headcount), '<small class="muted">' + t('hsSmall') + '</small>', '', '', '', ''].concat(money ? [''] : []);
        return [name, g.headcount + dif(g.headcount, o.headcount), pct(g.saudiPct) + dif(g.saudiPct, o.saudiPct, '%'), pct(g.femalePct), V.n1(g.avgTenure), pct(g.attendancePct) + dif(g.attendancePct, o.attendancePct, '%'), V.n1(g.lateDays, 0)]
          .concat(money ? [g.packageAvg == null ? '-' : V.sar(g.packageAvg)] : []);
      });
      h += '<h3 style="margin:14px 0 6px">' + t('hsGroups') + '</h3>' + V.tbl(head, rows);
      el.innerHTML = h; V.wireTips(el);
      $$('[data-g]', el).forEach(function(a){ a.onclick = function(ev){ ev.preventDefault(); var g = r.groups[a.dataset.g]; people({ key: g.key }, g.label); }; });
      $$('[data-ch]', el).forEach(function(b){ b.onclick = function(){ people({ change: b.dataset.ch }, b.textContent); }; });
    });
  }
  function people(q, title){
    var d = drawer('<h3>' + t('hsPeople') + ' ' + esc(title) + ' · ' + V.monthShort(st.month) + '</h3><div id="hsP"></div>', { wide: true }), el = $('#hsP', d);
    K.busy(el);
    api('snapshotPeople', Object.assign({ month: st.month, compare: st.compare || undefined, dim: st.dim }, q), true).then(function(r){
      if (!r.ok) return el.innerHTML = K.bad(r.error);
      var pay = r.rows.some(function(x){ return x.package != null; });
      el.innerHTML = V.tbl([t('hsEmpNo'), t('hsName'), t('hsDim_dept')].concat(q.change === 'transferred' ? [t('hsFrom')] : []).concat([t('hsDim_position'), t('hsTenure'), t('hsAtt')]).concat(pay ? [t('hsPkgAvg')] : []),
        r.rows.map(function(x){ return ['<bdi>' + esc(x.empNo) + '</bdi>', esc(x.name), esc(x.department)].concat(q.change === 'transferred' ? [esc(x.from)] : [])
          .concat([esc(x.position), V.n1(x.tenure), x.present + ' / ' + (x.present + x.absent)]).concat(pay ? [x.package == null ? '-' : V.sar(x.package)] : []); }));
    });
  }
  load();
}
window.SnapHistory = { section: historySection };

window.OpenShifts = { section: openShiftsSection };
})();
