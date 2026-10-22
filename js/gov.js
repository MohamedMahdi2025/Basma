// Government services (GovServices.gs), 2026-10-08: exit/re-entry and final exit visas, the iqama register with renewals,
// annual air tickets, and the government fee ledger with second-person verification. HR and payroll see the section;
// Gov.myCard(el) is the employee's own card in the profile. Records are kept by hand until a Muqeem / Absher link exists:
// HR does the transaction in Muqeem, then records here what Muqeem issued.
(function(){
'use strict';

Object.assign(T.ar, {
  vwGov:'الخدمات الحكومية', gvTitle:'الخدمات الحكومية', gvLead:'تسجيل ما يصدر من مقيم: التأشيرات والخروج النهائي وتجديد الإقامات والتذاكر والرسوم. لا يوجد ربط مباشر مع مقيم أو أبشر بعد؛ تنجز المعاملة هناك ثم تسجل هنا.',
  gvVisas:'التأشيرات', gvIqama:'الإقامات', gvTickets:'التذاكر', gvFees:'الرسوم',
  gvAway:'مسافرون الآن', gvToIssue:'بانتظار تسجيل التأشيرة', gvOverdue:'لم يعودوا بعد انتهاء التأشيرة', gvExpSoon:'تأشيرات تنتهي قريبا', gvIqSoon:'إقامات تنتهي خلال 60 يوما', gvIqExp:'إقامات منتهية',
  gvIqMissing:'بلا تاريخ إقامة', gvTkDue:'تذاكر مستحقة', gvFeesVerify:'رسوم بانتظار التحقق', gvFeesMonth:'رسوم هذا الشهر',
  gvv_exit_reentry:'خروج وعودة', gvv_final_exit:'خروج نهائي', gvs_approved:'بانتظار التسجيل', gvs_planned:'مخطط', gvs_issued:'صادرة', gvs_returned:'عاد', gvs_departed:'غادر', gvs_cancelled:'ملغاة',
  gvIssue:'تسجيل التأشيرة', gvReturn:'تسجيل العودة', gvDepart:'تسجيل المغادرة', gvCancel:'إلغاء', gvFinal:'خروج نهائي', gvVisaNo:'رقم التأشيرة', gvIssued:'تاريخ الإصدار', gvExpiry:'تنتهي في',
  gvFee:'الرسم', gvFeeRef:'مرجع السداد', gvPaidBy:'دفعها', gvCompany:'الشركة', gvEmployee:'الموظف', gvNote:'ملاحظة', gvNoteReq:'ملاحظة (مطلوبة)', gvTravel:'السفر', gvLink:'مرتبطة بـ',
  gvArt40:'المادة 40: رسوم الإقامة ورخصة العمل وتأشيرة الخروج والعودة وتجديدها على صاحب العمل. إن دفعها الموظف فاذكر السبب لترد إليه. استشر المستشار القانوني قبل استرداد أي رسم (المادة 92).',
  gvArt40Flag:'دفعها الموظف: تستحق الرد (المادة 40)', gvLastDay:'آخر يوم عمل', gvTravelDate:'تاريخ السفر', gvDeps:'المرافقون', gvDate:'التاريخ', gvSaudiNa:'لا تنطبق على السعوديين.',
  gvNumber:'رقم الإقامة', gvDaysLeft:'المتبقي', gvRenew:'تسجيل التجديد', gvNewExp:'تاريخ الانتهاء الجديد', gvRenewedOn:'تاريخ التجديد', gvYears:'المدة بالسنوات', gvMuqeem:'مرجع مقيم',
  gvFeeIqama:'رسم الإقامة', gvFeeWp:'رخصة العمل', gvFeePrint:'طباعة مقيم', gvFeeOther:'أخرى', gvLastRenew:'آخر تجديد', gvl_ok:'سارية', gvl_soon:'قريبة', gvl_due:'جدد الآن', gvl_expired:'منتهية', gvl_missing:'بلا تاريخ',
  gvRight:'الاستحقاق', gvSetRight:'تحديد الاستحقاق', gvClass:'الدرجة', gvEconomy:'سياحية', gvBusiness:'أعمال', gvEvery:'كل', gvYear1:'سنة', gvYear2:'سنتين', gvRoute:'خط السير', gvFrom:'يبدأ الاحتساب من',
  gvCash:'البدل النقدي', gvCycle:'الدورة الحالية', gvNext:'التالية', gvLeft:'المتبقي', gvUse:'تسجيل استخدام', gvPersons:'الأشخاص', gvKind:'النوع', gvkTicket:'تذكرة', gvkCash:'بدل نقدي', gvAmount:'المبلغ',
  gvUsedOn:'تاريخ الاستخدام', gvRef:'المرجع', gvApprove:'اعتماد', gvReject:'رفض', gvHistory:'السجل', gvNotDue:'لم يحن موعد الاستحقاق بعد.', gvUsePending:'بانتظار اعتماد الرواتب',
  gvk_ticket:'تذكرة', gvk_cash:'بدل نقدي', gvus_pending:'بانتظار الاعتماد', gvus_approved:'معتمد', gvus_rejected:'مرفوض',
  gvAddFee:'تسجيل رسم', gvType:'النوع', gvVerify:'تحقق', gvVoid:'إلغاء القيد', gvfs_recorded:'مسجل', gvfs_verified:'تم التحقق', gvfs_void:'ملغى', gvEnteredBy:'سجله', gvVerifiedBy:'تحقق منه',
  gvf_iqama:'إقامة', gvf_work_permit:'رخصة عمل', gvf_exit_reentry:'خروج وعودة', gvf_final_exit:'خروج نهائي', gvf_muqeem_print:'طباعة مقيم', gvf_visa:'تأشيرة', gvf_transfer:'نقل كفالة', gvf_other:'أخرى',
  gvSecond:'يتحقق من الرسم شخص غير من سجله، مقابل الإيصال.', gvNone:'لا توجد سجلات.', gvSaved:'تم التسجيل', gvMy:'إقامتي وسفري', gvMyIqama:'إقامتي تنتهي في', gvMyTicket:'تذكرتي السنوية',
  gvMyVisas:'تأشيراتي', gvAskVisa:'طلب تأشيرة خروج وعودة', gvAll:'الكل',
  e_saudi_not_applicable:'لا تنطبق على الموظف السعودي.', e_ticket_not_due:'لم يحن موعد التذكرة بعد.', e_ticket_exhausted:'استخدم كامل استحقاق هذه الدورة.', e_leave_not_found:'لا توجد إجازة بهذا الرقم.',
  e_second_approver_required:'يعتمدها شخص آخر غير من سجلها.'
});
Object.assign(T.en, {
  vwGov:'Government services', gvTitle:'Government services', gvLead:'Record what Muqeem issues: visas, final exits, iqama renewals, tickets and fees. There is no direct Muqeem or Absher link yet; do the transaction there, then record it here.',
  gvVisas:'Visas', gvIqama:'Iqamas', gvTickets:'Tickets', gvFees:'Fees',
  gvAway:'Travelling now', gvToIssue:'Visas to record', gvOverdue:'Not back after the visa expired', gvExpSoon:'Visas expiring soon', gvIqSoon:'Iqamas expiring within 60 days', gvIqExp:'Expired iqamas',
  gvIqMissing:'No iqama date', gvTkDue:'Tickets due', gvFeesVerify:'Fees to verify', gvFeesMonth:'Fees this month',
  gvv_exit_reentry:'Exit/re-entry', gvv_final_exit:'Final exit', gvs_approved:'To record', gvs_planned:'Planned', gvs_issued:'Issued', gvs_returned:'Returned', gvs_departed:'Departed', gvs_cancelled:'Cancelled',
  gvIssue:'Record visa', gvReturn:'Record return', gvDepart:'Record departure', gvCancel:'Cancel', gvFinal:'Final exit', gvVisaNo:'Visa number', gvIssued:'Issued on', gvExpiry:'Expires',
  gvFee:'Fee', gvFeeRef:'Payment reference', gvPaidBy:'Paid by', gvCompany:'Company', gvEmployee:'Employee', gvNote:'Note', gvNoteReq:'Note (required)', gvTravel:'Travel', gvLink:'Linked to',
  gvArt40:'Art. 40: iqama, work permit and exit/re-entry fees and their renewal are the employer\'s. If the employee paid, say why so it is refunded. Ask counsel before recovering any fee (Art. 92).',
  gvArt40Flag:'Paid by the employee: refund due (Art. 40)', gvLastDay:'Last working day', gvTravelDate:'Travel date', gvDeps:'Dependants', gvDate:'Date', gvSaudiNa:'Does not apply to Saudis.',
  gvNumber:'Iqama number', gvDaysLeft:'Left', gvRenew:'Record renewal', gvNewExp:'New expiry', gvRenewedOn:'Renewed on', gvYears:'Years', gvMuqeem:'Muqeem reference',
  gvFeeIqama:'Iqama fee', gvFeeWp:'Work permit', gvFeePrint:'Muqeem printing', gvFeeOther:'Other', gvLastRenew:'Last renewal', gvl_ok:'Valid', gvl_soon:'Soon', gvl_due:'Renew now', gvl_expired:'Expired', gvl_missing:'No date',
  gvRight:'Entitlement', gvSetRight:'Set entitlement', gvClass:'Class', gvEconomy:'Economy', gvBusiness:'Business', gvEvery:'Every', gvYear1:'year', gvYear2:'2 years', gvRoute:'Route', gvFrom:'Counted from',
  gvCash:'Cash value', gvCycle:'Current cycle', gvNext:'Next', gvLeft:'Left', gvUse:'Record use', gvPersons:'People', gvKind:'Kind', gvkTicket:'Ticket', gvkCash:'Cash allowance', gvAmount:'Amount',
  gvUsedOn:'Used on', gvRef:'Reference', gvApprove:'Approve', gvReject:'Reject', gvHistory:'History', gvNotDue:'Not due yet.', gvUsePending:'Waiting for payroll approval',
  gvk_ticket:'Ticket', gvk_cash:'Cash allowance', gvus_pending:'Pending', gvus_approved:'Approved', gvus_rejected:'Rejected',
  gvAddFee:'Record fee', gvType:'Type', gvVerify:'Verify', gvVoid:'Void', gvfs_recorded:'Recorded', gvfs_verified:'Verified', gvfs_void:'Void', gvEnteredBy:'Recorded by', gvVerifiedBy:'Verified by',
  gvf_iqama:'Iqama', gvf_work_permit:'Work permit', gvf_exit_reentry:'Exit/re-entry', gvf_final_exit:'Final exit', gvf_muqeem_print:'Muqeem printing', gvf_visa:'Visa', gvf_transfer:'Sponsorship transfer', gvf_other:'Other',
  gvSecond:'Someone other than the person who recorded the fee checks it against the receipt.', gvNone:'Nothing recorded.', gvSaved:'Recorded', gvMy:'My iqama and travel', gvMyIqama:'My iqama expires',
  gvMyTicket:'My annual ticket', gvMyVisas:'My visas', gvAskVisa:'Request exit/re-entry visa', gvAll:'All',
  e_saudi_not_applicable:'Does not apply to a Saudi employee.', e_ticket_not_due:'The ticket is not due yet.', e_ticket_exhausted:'This cycle\'s entitlement is used up.', e_leave_not_found:'No leave with that number.',
  e_second_approver_required:'Someone other than the person who recorded it approves it.'
});

var css = '' +
'.gv-row .main small{display:block}.gv-flag{color:var(--bad);font-size:13px;display:flex;gap:4px;align-items:center;margin-top:2px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var uid = 0;
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function day(iso){ var ms = Date.parse(iso); return isNaN(ms) ? String(iso || '').slice(0, 10) : new Date(ms + 180 * 60000).toISOString().slice(0, 10); }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function money(n){ return n == null ? '-' : '<span class="num">' + Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + '</span> ' + sar(); }
function sep(){ return ' · '; }
function busy(el){ el.innerHTML = '<div class="list">' + [0, 1, 2].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%;margin-top:6px"></span></div></div>'; }).join('') + '</div>'; }
function bad(code){ return '<p class="hr-bad" role="alert">' + esc(errText(code)) + '</p>'; }
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function empLine(e){ return e ? esc(lang(e.name, e.nameEn)) + ' <bdi class="num">' + esc(e.empNo) + '</bdi>' : ''; }
function av(e, icon){ return '<div class="av">' + (e ? esc(initials(e.name)) : ph(icon || 'file')) + '</div>'; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function fld(label, control, hint){
  var id = 'gvf' + (++uid);
  return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + (hint ? '<small class="hr-hint">' + hint + '</small>' : '') + '</div>';
}
function opts(list, cur, none){ return (none != null ? '<option value="">' + none + '</option>' : '') + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
function confirmTap(b, fn){
  b.onclick = function(){
    if (b.dataset.armed) { b.disabled = true; return fn(); }
    var old = b.innerHTML; b.dataset.armed = '1'; b.textContent = S.lang === 'en' ? 'Tap again to confirm' : 'اضغط مرة أخرى للتأكيد';
    setTimeout(function(){ if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.innerHTML = old; } }, 4000);
  };
}
function paidSel(){ return '<select name="paidBy"><option value="company">' + t('gvCompany') + '</option><option value="employee">' + t('gvEmployee') + '</option></select>'; }
/** A drawer with a form; submit(values) returns the api promise; on success the list reloads. */
function formDrawer(title, lead, html, submit, after){
  var d = drawer('<h3>' + title + '</h3>' + (lead ? '<p class="hr-hint">' + lead + '</p>' : '') + '<form class="form" id="gvF">' + html + '<p class="hr-bad" id="gvE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + title + '</button></div></form>');
  var f = $('#gvF', d);
  f.onsubmit = function(ev){
    ev.preventDefault(); var b = f.querySelector('[type=submit]'); b.disabled = true;
    var v = {}; Array.prototype.forEach.call(f.elements, function(x){ if (x.name) v[x.name] = x.type === 'checkbox' ? x.checked : x.value.trim(); });
    submit(v).then(function(r){ b.disabled = false; if (!r.ok) return $('#gvE', d).textContent = errText(r.error); d.remove(); toast(t('gvSaved')); refreshTasks(); if (after) after(r); });
  };
  return d;
}

// ================= HR / payroll section =================
function section(body){
  var tab = S.gvTab || 'visas';
  body.innerHTML = '<div class="hr-h"><h2>' + t('gvTitle') + '</h2></div><p class="hr-hint" style="margin:-4px 0 12px">' + t('gvLead') + '</p><div id="gvB"></div>';
  var box = $('#gvB', body);
  function load(){
    busy(box);
    api('govOverview', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var V = window.Viz, c = r.counts;
      var h = V ? '<div class="db-tiles">' + V.tile(t('gvToIssue'), V.n1(c.toIssue, 0), '', null, true, true) + V.tile(t('gvAway'), V.n1(c.away, 0), '') +
        V.tile(t('gvOverdue'), '<span class="db-status">' + (c.overdue ? ph('warning-circle') + ' ' : '') + c.overdue + '</span>', '') + V.tile(t('gvIqSoon'), V.n1(c.iqamaSoon, 0), t('gvIqExp') + ' ' + c.iqamaExpired) +
        V.tile(t('gvTkDue'), V.n1(c.ticketsDue, 0), '') + V.tile(t('gvFeesVerify'), V.n1(c.feesToVerify, 0), c.feesMonth != null ? t('gvFeesMonth') + ' ' + money(c.feesMonth) : '') + '</div>' : '';
      h += '<div class="op-tabs" role="tablist">' + [['visas', 'airplane', 'gvVisas'], ['iqama', 'identification-card', 'gvIqama'], ['tickets', 'ticket', 'gvTickets'], ['fees', 'receipt', 'gvFees']].map(function(x){
        return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (tab === x[0]) + '">' + ph(x[1]) + t(x[2]) + '</button>'; }).join('') + '</div><div id="gvT"></div>';
      box.innerHTML = h; if (V) V.wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.gvTab = b.dataset.tab; section(body); }; });
      var el = $('#gvT', box);
      ({ visas: visas, iqama: iqama, tickets: tickets, fees: fees })[tab](el, r, load);
    });
  }
  load();
}
var GVS_CLS = { approved: 'late', planned: 'late', issued: 'in', returned: 'off', departed: 'off', cancelled: 'off' };
function visas(el, r, again){
  var h = r.isHr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="gvFx">' + ph('sign-out') + t('gvFinal') + '</button></div>' : '';
  h += r.visas.length ? '<div class="list">' + r.visas.map(function(v, i){
    var acts = (v.canIssue ? '<button type="button" class="btn btn-dark btn-sm" data-is="' + i + '">' + t('gvIssue') + '</button>' : '') +
      (v.canReturn ? '<button type="button" class="btn btn-line btn-sm" data-rt="' + i + '">' + t(v.kind === 'final_exit' ? 'gvDepart' : 'gvReturn') + '</button>' : '') +
      (r.isHr && (v.status === 'approved' || v.status === 'planned' || v.status === 'issued') ? '<button type="button" class="btn btn-line btn-sm" data-cx="' + i + '">' + t('gvCancel') + '</button>' : '');
    return '<div class="row gv-row">' + av(v.emp) + '<div class="main"><b>' + empLine(v.emp) + sep() + t('gvv_' + v.kind) + '</b>' +
      '<small><bdi>' + esc(v.ref) + '</bdi>' + (v.travelFrom ? sep() + t('gvTravel') + ' ' + fmt(v.travelFrom) + (v.travelTo ? ' - ' + fmt(v.travelTo) : '') : '') + (v.visaNo ? sep() + t('gvVisaNo') + ' <bdi class="num">' + esc(v.visaNo) + '</bdi>' : '') + (v.expiry ? sep() + t('gvExpiry') + ' ' + fmt(v.expiry) : '') + (v.fee != null ? sep() + money(v.fee) : '') + (v.linkRef ? sep() + t('gvLink') + ' <bdi>' + esc(v.linkRef) + '</bdi>' : '') + '</small>' +
      (v.overdue ? '<span class="gv-flag">' + ph('warning') + t('gvOverdue') + '</span>' : v.expiringSoon ? '<span class="gv-flag">' + ph('clock') + t('gvExpSoon') + '</span>' : '') + (v.art40 ? '<span class="gv-flag">' + ph('scales') + t('gvArt40Flag') + '</span>' : '') + '</div>' +
      chip(t('gvs_' + v.status), GVS_CLS[v.status]) + ' ' + acts + '</div>';
  }).join('') + '</div>' : empty('airplane', t('gvNone'));
  el.innerHTML = h;
  var fx = $('#gvFx', el);
  if (fx) fx.onclick = function(){
    var ppl = r.people.filter(function(p){ return !p.saudi; });
    formDrawer(t('gvFinal'), '', fld(t('gvEmployee'), '<select name="empId" required>' + opts(ppl.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), '', '-') + '</select>') +
      '<div class="two">' + fld(t('gvLastDay'), '<input name="lastDay" type="date">') + fld(t('gvTravelDate'), '<input name="travelDate" type="date">') + '</div>' + fld(t('gvDeps'), '<input name="dependants" type="number" min="0" max="20" value="0">') + fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(v){ return api('govFinalExit', { exit: v }); }, again);
  };
  $$('[data-is]', el).forEach(function(b){ b.onclick = function(){ var v = r.visas[b.dataset.is], td = riyadhToday();
    formDrawer(t('gvIssue'), t('gvv_' + v.kind) + sep() + esc(v.emp ? v.emp.name : '') + ' <bdi>' + esc(v.ref) + '</bdi>', '<div class="two">' + fld(t('gvVisaNo'), '<input name="visaNo" dir="ltr" maxlength="30" required>') + fld(t('gvIssued'), '<input name="issuedOn" type="date" max="' + td + '" value="' + td + '">') + '</div>' +
      fld(t('gvExpiry'), '<input name="expiry" type="date" required>') + (r.canMoney ? '<div class="two">' + fld(t('gvFee'), '<input name="fee" type="number" min="0" step="0.01" value="0">') + fld(t('gvFeeRef'), '<input name="feeReference" dir="ltr" maxlength="60">') + '</div>' + fld(t('gvPaidBy'), paidSel(), t('gvArt40')) : '') +
      fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(x){ return api('govVisaIssue', { id: v.id, visa: x }); }, again); }; });
  $$('[data-rt]', el).forEach(function(b){ b.onclick = function(){ var v = r.visas[b.dataset.rt], td = riyadhToday();
    formDrawer(t(v.kind === 'final_exit' ? 'gvDepart' : 'gvReturn'), esc(v.emp ? v.emp.name : '') + ' <bdi>' + esc(v.ref) + '</bdi>', fld(t('gvDate'), '<input name="date" type="date" max="' + td + '" value="' + td + '">') + fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(x){ return api('govVisaReturn', { id: v.id, date: x.date, note: x.note }); }, again); }; });
  $$('[data-cx]', el).forEach(function(b){ b.onclick = function(){ var v = r.visas[b.dataset.cx];
    formDrawer(t('gvCancel'), esc(v.ref), fld(t('gvNoteReq'), '<input name="note" maxlength="300" required>'), function(x){ return api('govVisaCancel', { id: v.id, note: x.note }); }, again); }; });
}
var LVL_CLS = { ok: 'in', soon: 'late', due: 'late', expired: 'absent', missing: 'off' };
function iqama(el, r, again){
  el.innerHTML = r.iqama.length ? '<div class="list">' + r.iqama.map(function(x, i){
    return '<div class="row gv-row">' + av(x.emp) + '<div class="main"><b>' + empLine(x.emp) + '</b><small>' + (x.number ? t('gvNumber') + ' <bdi class="num">' + esc(x.number) + '</bdi>' + sep() : '') + (x.expiry ? t('gvExpiry') + ' ' + fmt(x.expiry) : '') +
      (x.daysLeft != null ? sep() + t('gvDaysLeft') + ' ' + plural(Math.max(0, x.daysLeft), 'days') : '') + '</small>' + (x.last ? '<small>' + t('gvLastRenew') + ' <bdi>' + esc(x.last.ref) + '</bdi>' + sep() + fmt(x.last.renewedOn) + sep() + fmt(x.last.newExpiry) + (x.last.total != null ? sep() + money(x.last.total) : '') + '</small>' : '') + '</div>' +
      chip(t('gvl_' + x.level), LVL_CLS[x.level]) + ' <button type="button" class="btn btn-line btn-sm" data-rn="' + i + '">' + t('gvRenew') + '</button></div>';
  }).join('') + '</div>' : empty('identification-card', t('gvNone'));
  $$('[data-rn]', el).forEach(function(b){ b.onclick = function(){ var x = r.iqama[b.dataset.rn], td = riyadhToday();
    var fee = function(k, l){ return fld(l, '<input name="f_' + k + '" type="number" min="0" step="0.01" value="0">'); };
    formDrawer(t('gvRenew'), empLine(x.emp) + (x.expiry ? sep() + fmt(x.expiry) : ''), '<div class="two">' + fld(t('gvNewExp'), '<input name="newExpiry" type="date" required>') + fld(t('gvRenewedOn'), '<input name="renewedOn" type="date" max="' + td + '" value="' + td + '">') + '</div>' +
      '<div class="two">' + fld(t('gvYears'), '<input name="years" type="number" min="1" max="5" value="1">') + fld(t('gvMuqeem'), '<input name="muqeemRef" dir="ltr" maxlength="60">') + '</div>' +
      (r.canMoney ? '<div class="two">' + fee('iqama', t('gvFeeIqama')) + fee('work_permit', t('gvFeeWp')) + '</div><div class="two">' + fee('muqeem_print', t('gvFeePrint')) + fee('other', t('gvFeeOther')) + '</div>' + fld(t('gvPaidBy'), paidSel(), t('gvArt40')) : '') + fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(v){ return api('iqamaRenew', { renewal: { empId: x.emp.id, newExpiry: v.newExpiry, renewedOn: v.renewedOn, years: v.years, muqeemRef: v.muqeemRef, paidBy: v.paidBy, note: v.note,
        fees: { iqama: v.f_iqama || 0, work_permit: v.f_work_permit || 0, muqeem_print: v.f_muqeem_print || 0, other: v.f_other || 0 } } }); }, again); }; });
}
function rightForm(r, x, again){
  var td = riyadhToday(), ppl = r.people;
  formDrawer(t('gvSetRight'), x ? empLine(x.emp) : '', (x ? '<input type="hidden" name="empId" value="' + esc(x.emp.id) + '">' : fld(t('gvEmployee'), '<select name="empId" required>' + opts(ppl.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), '', '-') + '</select>')) +
    '<div class="two">' + fld(t('gvClass'), '<select name="travelClass">' + opts([['economy', t('gvEconomy')], ['business', t('gvBusiness')]], x ? x.travelClass : 'economy') + '</select>') + fld(t('gvEvery'), '<select name="everyYears">' + opts([['1', t('gvYear1')], ['2', t('gvYear2')]], x ? String(x.everyYears) : '1') + '</select>') + '</div>' +
    '<div class="two">' + fld(t('gvDeps'), '<input name="dependants" type="number" min="0" max="10" value="' + (x ? x.dependants : 0) + '">') + fld(t('gvRoute'), '<input name="route" dir="ltr" maxlength="120" value="' + esc(x ? x.route || '' : '') + '">') + '</div>' +
    '<div class="two">' + fld(t('gvFrom'), '<input name="fromDate" type="date" value="' + esc(x ? x.fromDate : '') + '">') + (r.canMoney ? fld(t('gvCash'), '<input name="cashValue" type="number" min="0" step="0.01" value="' + esc(x && x.cashValue != null ? x.cashValue : 0) + '">') : '') + '</div>' + fld(t('gvNote'), '<input name="note" maxlength="300" value="' + esc(x ? x.note || '' : '') + '">'),
    function(v){ return api('ticketSave', { ticket: v }); }, again);
  void td;
}
var US_CLS = { pending: 'late', approved: 'in', rejected: 'absent' };
function tickets(el, r, again){
  var h = r.isHr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="gvTk">' + ph('plus') + t('gvSetRight') + '</button></div>' : '';
  h += r.tickets.length ? '<div class="list">' + r.tickets.map(function(x, i){
    var pend = x.history.filter(function(u){ return u.status === 'pending'; });
    return '<div class="row gv-row">' + av(x.emp) + '<div class="main"><b>' + empLine(x.emp) + '</b><small>' + t(x.travelClass === 'business' ? 'gvBusiness' : 'gvEconomy') + sep() + t('gvEvery') + ' ' + t(x.everyYears === 2 ? 'gvYear2' : 'gvYear1') + sep() + t('gvDeps') + ' ' + x.dependants + (x.route ? sep() + '<bdi>' + esc(x.route) + '</bdi>' : '') + (x.cashValue != null ? sep() + t('gvCash') + ' ' + money(x.cashValue) : '') + '</small>' +
      '<small>' + (x.cycleDue ? t('gvCycle') + ' ' + fmt(x.cycleDue) + sep() + t('gvLeft') + ' ' + x.remaining + '/' + x.entitled : t('gvNotDue')) + sep() + t('gvNext') + ' ' + fmt(x.nextDue) + '</small>' +
      (pend.length ? '<span class="gv-flag">' + ph('hourglass') + t('gvUsePending') + ' (' + pend.length + ')</span>' : '') + '</div>' +
      (r.isHr && x.remaining > 0 ? '<button type="button" class="btn btn-dark btn-sm" data-us="' + i + '">' + t('gvUse') + '</button> ' : '') +
      (r.isHr ? '<button type="button" class="btn btn-line btn-sm" data-ed="' + i + '" aria-label="' + t('gvSetRight') + '">' + ph('pencil-simple') + '</button> ' : '') +
      '<button type="button" class="btn btn-line btn-sm" data-hs="' + i + '" aria-label="' + t('gvHistory') + '">' + ph('clock-counter-clockwise') + (pend.some(function(u){ return u.canApprove; }) ? ' ' + t('gvApprove') : '') + '</button></div>';
  }).join('') + '</div>' : empty('ticket', t('gvNone'));
  el.innerHTML = h;
  var nb = $('#gvTk', el); if (nb) nb.onclick = function(){ rightForm(r, null, again); };
  $$('[data-ed]', el).forEach(function(b){ b.onclick = function(){ rightForm(r, r.tickets[b.dataset.ed], again); }; });
  $$('[data-us]', el).forEach(function(b){ b.onclick = function(){ var x = r.tickets[b.dataset.us], td = riyadhToday();
    formDrawer(t('gvUse'), empLine(x.emp) + sep() + t('gvLeft') + ' ' + x.remaining, '<div class="two">' + fld(t('gvPersons'), '<input name="persons" type="number" min="1" max="' + x.remaining + '" value="1">') + fld(t('gvKind'), '<select name="kind"><option value="ticket">' + t('gvkTicket') + '</option><option value="cash">' + t('gvkCash') + '</option></select>') + '</div>' +
      '<div class="two">' + (r.canMoney ? fld(t('gvAmount'), '<input name="amount" type="number" min="0" step="0.01" value="0">') : '') + fld(t('gvUsedOn'), '<input name="usedOn" type="date" value="' + td + '">') + '</div>' + fld(t('gvRef'), '<input name="reference" dir="ltr" maxlength="60">') + fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(v){ v.empId = x.emp.id; return api('ticketUse', { use: v }); }, again); }; });
  $$('[data-hs]', el).forEach(function(b){ b.onclick = function(){ var x = r.tickets[b.dataset.hs];
    var d = drawer('<h3>' + t('gvHistory') + '</h3><p class="hr-hint">' + empLine(x.emp) + '</p>' + (x.history.length ? '<div class="list">' + x.history.map(function(u, k){
      return '<div class="row"><div class="main"><b><bdi>' + esc(u.ref) + '</bdi>' + sep() + t('gvk_' + u.kind) + sep() + plural(u.persons, 'people') + '</b><small>' + fmt(u.usedOn) + (u.amount != null ? sep() + money(u.amount) : '') + (u.reference ? sep() + '<bdi>' + esc(u.reference) + '</bdi>' : '') + sep() + esc(u.enteredBy) + (u.approvedBy ? sep() + esc(u.approvedBy) : '') + (u.adjRef ? sep() + '<bdi>' + esc(u.adjRef) + '</bdi>' : '') + '</small>' + (u.note ? '<small>' + esc(u.note) + '</small>' : '') + '</div>' +
        chip(t('gvus_' + u.status), US_CLS[u.status]) + (u.canApprove ? ' <button type="button" class="btn btn-dark btn-sm" data-ok="' + k + '">' + t('gvApprove') + '</button> <button type="button" class="btn btn-line btn-sm" data-no="' + k + '">' + t('gvReject') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('gvNone') + '</p>') + '<p class="hr-bad" id="huE" role="alert"></p>');
    var fin = function(y){ if (!y.ok) return $('#huE', d).textContent = errText(y.error); d.remove(); toast(t('gvSaved')); refreshTasks(); again(); };
    $$('[data-ok]', d).forEach(function(bb){ confirmTap(bb, function(){ api('ticketUseApprove', { id: x.history[bb.dataset.ok].id, decision: 'approve' }).then(fin); }); });
    $$('[data-no]', d).forEach(function(bb){ bb.onclick = function(){ var u = x.history[bb.dataset.no]; d.remove();
      formDrawer(t('gvReject'), '<bdi>' + esc(u.ref) + '</bdi>', fld(t('gvNoteReq'), '<input name="note" maxlength="300" required>'), function(v){ return api('ticketUseApprove', { id: u.id, decision: 'reject', note: v.note }); }, again); }; });
  }; });
}
var FS_CLS = { recorded: 'late', verified: 'in', void: 'off' };
function fees(el, r, again){
  var types = ['iqama', 'work_permit', 'exit_reentry', 'final_exit', 'muqeem_print', 'visa', 'transfer', 'other'];
  var h = '<p class="hr-hint">' + ph('info') + ' ' + t('gvSecond') + '</p>' + (r.canMoney ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="gvAdd">' + ph('plus') + t('gvAddFee') + '</button></div>' : '');
  h += r.fees.length ? '<div class="list">' + r.fees.map(function(f, i){
    return '<div class="row gv-row">' + av(f.emp, 'receipt') + '<div class="main"><b>' + t('gvf_' + f.type) + (f.emp ? sep() + empLine(f.emp) : '') + '</b><small><bdi>' + esc(f.ref) + '</bdi>' + sep() + fmt(f.date) + sep() + money(f.amount) + (f.reference ? sep() + '<bdi>' + esc(f.reference) + '</bdi>' : '') + sep() + t('gvPaidBy') + ' ' + t(f.paidBy === 'employee' ? 'gvEmployee' : 'gvCompany') + '</small>' +
      '<small>' + t('gvEnteredBy') + ' ' + esc(f.enteredBy) + (f.verifiedBy ? sep() + t('gvVerifiedBy') + ' ' + esc(f.verifiedBy) : '') + (f.note ? sep() + esc(f.note) : '') + '</small>' + (f.art40 ? '<span class="gv-flag">' + ph('scales') + t('gvArt40Flag') + '</span>' : '') + '</div>' +
      chip(t('gvfs_' + f.status), FS_CLS[f.status]) + (f.canVerify ? ' <button type="button" class="btn btn-dark btn-sm" data-vf="' + i + '">' + t('gvVerify') + '</button>' : '') + (f.canVoid ? ' <button type="button" class="btn btn-line btn-sm" data-vd="' + i + '">' + t('gvVoid') + '</button>' : '') + '</div>';
  }).join('') + '</div>' : empty('receipt', t('gvNone'));
  el.innerHTML = h;
  var ab = $('#gvAdd', el); if (ab) ab.onclick = function(){ var td = riyadhToday();
    formDrawer(t('gvAddFee'), t('gvArt40'), '<div class="two">' + fld(t('gvType'), '<select name="type">' + opts(types.map(function(k){ return [k, t('gvf_' + k)]; }), 'iqama') + '</select>') + fld(t('gvEmployee'), '<select name="empId">' + opts(r.people.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), '', '-') + '</select>') + '</div>' +
      '<div class="two">' + fld(t('gvAmount'), '<input name="amount" type="number" min="0.01" step="0.01" required>') + fld(t('gvDate'), '<input name="date" type="date" max="' + td + '" value="' + td + '">') + '</div>' +
      '<div class="two">' + fld(t('gvRef'), '<input name="reference" dir="ltr" maxlength="60" required>') + fld(t('gvPaidBy'), paidSel()) + '</div>' + fld(t('gvNote'), '<input name="note" maxlength="300">'),
      function(v){ return api('govFeeSave', { fee: v }); }, again); };
  $$('[data-vf]', el).forEach(function(b){ confirmTap(b, function(){ api('govFeeVerify', { ids: [r.fees[b.dataset.vf].id] }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('gvSaved')); refreshTasks(); again(); }); }); });
  $$('[data-vd]', el).forEach(function(b){ b.onclick = function(){ var f = r.fees[b.dataset.vd];
    formDrawer(t('gvVoid'), '<bdi>' + esc(f.ref) + '</bdi>', fld(t('gvNoteReq'), '<input name="note" maxlength="300" required>'), function(v){ return api('govFeeVoid', { id: f.id, note: v.note }); }, again); }; });
}

// ================= the employee's card =================
function myCard(el){
  el.innerHTML = '';
  apiFresh('myGov', {}, function(r){
    if (!el.isConnected) return;
    el.innerHTML = '';
    if (!r.ok || (r.saudi && !r.visas.length && !r.ticket)) return;
    var d = document.createElement('div'); d.className = 'mf-card op-card';
    var h = '<h3><span class="ic">' + ph('airplane-tilt') + '</span>' + t('gvMy') + '<span class="sp"></span></h3>';
    if (r.iqama && r.iqama.expiry) h += '<div class="row"><div class="main"><b>' + t('gvMyIqama') + ' ' + fmt(r.iqama.expiry) + '</b><small>' + (r.iqama.daysLeft != null ? t('gvDaysLeft') + ' ' + plural(Math.max(0, r.iqama.daysLeft), 'days') : '') + '</small></div>' +
      chip(r.iqama.daysLeft < 0 ? t('gvl_expired') : r.iqama.daysLeft <= 60 ? t('gvl_soon') : t('gvl_ok'), r.iqama.daysLeft < 0 ? 'absent' : r.iqama.daysLeft <= 60 ? 'late' : 'in') + '</div>';
    if (r.ticket) h += '<div class="row"><div class="main"><b>' + t('gvMyTicket') + '</b><small>' + t(r.ticket.travelClass === 'business' ? 'gvBusiness' : 'gvEconomy') + sep() + (r.ticket.cycleDue ? t('gvLeft') + ' ' + r.ticket.remaining + '/' + r.ticket.entitled : t('gvNotDue')) + sep() + t('gvNext') + ' ' + fmt(r.ticket.nextDue) + '</small></div></div>';
    r.visas.slice(0, 4).forEach(function(v){ h += '<div class="row"><div class="main"><b>' + t('gvv_' + v.kind) + ' <bdi>' + esc(v.ref) + '</bdi></b><small>' + (v.travelFrom ? fmt(v.travelFrom) + (v.travelTo ? ' - ' + fmt(v.travelTo) : '') : '') + (v.visaNo ? sep() + '<bdi class="num">' + esc(v.visaNo) + '</bdi>' : '') + (v.expiry ? sep() + t('gvExpiry') + ' ' + fmt(v.expiry) : '') + '</small></div>' + chip(t('gvs_' + v.status), GVS_CLS[v.status]) + '</div>'; });
    if (!r.saudi && window.Req) h += '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn btn-line btn-sm" id="gvAsk">' + ph('airplane-takeoff') + t('gvAskVisa') + '</button></div>';
    d.innerHTML = h; el.appendChild(d);
    var ask = $('#gvAsk', d); if (ask) ask.onclick = function(){ api('myFile', {}, true).then(function(f){ Req.newRequest(f.ok ? f.file : null, function(){ myCard(el); }, 'exit_reentry'); }); };
  }, true);
}

window.Gov = { section: section, myCard: myCard };
})();
