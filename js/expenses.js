// Expense claims (Expenses.gs), 2026-10-08. One page for everyone (requests area): my claims with a new-claim form
// that checks every line live; claims waiting for my step (line manager, then a payroll holder); for payroll, all claims,
// payment outside payroll, the report by month / department / category with an Excel export, and the monthly limits.
// Receipts are referenced by number for now; attaching files needs a Drive scope (Wave 2).
(function(){
'use strict';

Object.assign(T.ar, {
  vwExpenses:'المصروفات', xpTitle:'المصروفات', xpLead:'اطلب تعويض ما دفعته للعمل: وقود ورسوم طرق ومواقف ووجبات عمل وغيرها. يعتمدها مديرك ثم الرواتب، وتصرف مع أول مسير مفتوح أو بتحويل مستقل.',
  xpMine:'مطالباتي', xpInbox:'بانتظار قراري', xpTeam:'فريقي', xpAll:'كل المطالبات', xpReport:'التقرير', xpLimits:'الحدود',
  xpNew:'مطالبة جديدة', xpTitleF:'عنوان المطالبة', xpLines:'البنود', xpAddLine:'إضافة بند', xpCat:'الفئة', xpDate:'التاريخ', xpAmount:'المبلغ شامل الضريبة', xpVat:'منها ضريبة القيمة المضافة',
  xpMerchant:'الجهة', xpDesc:'البيان', xpReceipt:'رقم الإيصال', xpRemove:'حذف البند', xpTotal:'الإجمالي', xpChecking:'جار التحقق...', xpOk:'البنود سليمة', xpSend:'إرسال المطالبة',
  xpLineN:'البند', xpOver:'يتجاوز حد الفئة الشهري', xpOverLead:'يمكن الإرسال، لكن يكتب معتمد الرواتب السبب عند الاعتماد.', xpReceiptOver:'الإيصال مطلوب فوق', xpMaxAge:'خلال آخر 90 يوما',
  xpNone:'لا توجد مطالبات.', xpCancel:'سحب', xpCancelPay:'إلغاء قبل الصرف', xpApprove:'اعتماد', xpReject:'رفض', xpPayout:'طريقة الصرف', xpViaPayroll:'مع مسير الرواتب', xpOutside:'تحويل مستقل',
  xpNoteReq:'السبب (مطلوب)', xpNoteOpt:'ملاحظة', xpPaid:'تسجيل الصرف', xpPaidRef:'مرجع التحويل', xpPaidOn:'تاريخ الصرف', xpPrint:'طباعة', xpFlags:'تنبيهات', xpStep:'المرحلة',
  xps_pending:'قيد الاعتماد', xps_approved:'معتمدة', xps_paid:'مصروفة', xps_rejected:'مرفوضة', xps_cancelled:'مسحوبة', xpst_manager:'بانتظار المدير', xpst_payroll:'بانتظار الرواتب', xpst_done:'منتهية',
  xc_fuel:'وقود', xc_tolls:'رسوم طرق', xc_parking:'مواقف', xc_meals:'وجبات عمل', xc_per_diem:'بدل يومي', xc_phone:'اتصالات', xc_vehicle:'صيانة مركبة', xc_travel:'سفر', xc_other:'أخرى',
  xpFrom:'من شهر', xpTo:'إلى شهر', xpShow:'عرض', xpExcel:'تصدير Excel', xpMonth:'الشهر', xpDept:'الإدارة', xpCc:'مركز التكلفة', xpState:'الحالة', xpClaims:'المطالبات', xpNet:'قبل الضريبة', xpOverN:'مطالبات فوق الحد',
  xpLimitsLead:'حد شهري لكل فئة لكل موظف (فارغ = بلا حد). يمكن تجاوزه بسبب يكتبه معتمد الرواتب.', xpSaveLimits:'حفظ الحدود', xpSaved:'تم الحفظ', xpSent:'أرسلت المطالبة',
  xpVoucher:'سند مطالبة مصروفات', xpVoucherKind:'مطالبة مصروفات', xpSignEmp:'مقدم المطالبة', xpSignMgr:'المدير المباشر', xpSignPay:'الرواتب',
  e_duplicate_expense:'هذا البند مكرر: نفس الفئة والتاريخ والمبلغ في مطالبة أخرى أو في نفس المطالبة.', e_receipt_required:'رقم الإيصال مطلوب لهذا المبلغ.', e_bad_vat:'الضريبة أكبر من 15% من المبلغ.',
  e_too_many_lines:'40 بندا كحد أقصى في المطالبة.', e_bad_amount:'مبلغ غير صحيح.'
});
Object.assign(T.en, {
  vwExpenses:'Expenses', xpTitle:'Expenses', xpLead:'Claim back what you paid for work: fuel, tolls, parking, business meals and more. Your manager approves, then payroll, and it is paid with the next open payroll or by a separate transfer.',
  xpMine:'My claims', xpInbox:'Waiting for me', xpTeam:'My team', xpAll:'All claims', xpReport:'Report', xpLimits:'Limits',
  xpNew:'New claim', xpTitleF:'Claim title', xpLines:'Lines', xpAddLine:'Add line', xpCat:'Category', xpDate:'Date', xpAmount:'Amount incl. VAT', xpVat:'of which VAT',
  xpMerchant:'Merchant', xpDesc:'Description', xpReceipt:'Receipt number', xpRemove:'Remove line', xpTotal:'Total', xpChecking:'Checking...', xpOk:'The lines are fine', xpSend:'Send claim',
  xpLineN:'Line', xpOver:'Over the monthly limit of the category', xpOverLead:'You can send it; the payroll approver writes the reason when approving.', xpReceiptOver:'Receipt needed above', xpMaxAge:'within the last 90 days',
  xpNone:'No claims.', xpCancel:'Withdraw', xpCancelPay:'Cancel before payment', xpApprove:'Approve', xpReject:'Reject', xpPayout:'Payout', xpViaPayroll:'With payroll', xpOutside:'Separate transfer',
  xpNoteReq:'Reason (required)', xpNoteOpt:'Note', xpPaid:'Record payment', xpPaidRef:'Transfer reference', xpPaidOn:'Paid on', xpPrint:'Print', xpFlags:'Warnings', xpStep:'Step',
  xps_pending:'In approval', xps_approved:'Approved', xps_paid:'Paid', xps_rejected:'Rejected', xps_cancelled:'Withdrawn', xpst_manager:'With the manager', xpst_payroll:'With payroll', xpst_done:'Finished',
  xc_fuel:'Fuel', xc_tolls:'Tolls', xc_parking:'Parking', xc_meals:'Business meals', xc_per_diem:'Per diem', xc_phone:'Phone', xc_vehicle:'Vehicle upkeep', xc_travel:'Travel', xc_other:'Other',
  xpFrom:'From month', xpTo:'To month', xpShow:'Show', xpExcel:'Export to Excel', xpMonth:'Month', xpDept:'Department', xpCc:'Cost centre', xpState:'Status', xpClaims:'Claims', xpNet:'Before VAT', xpOverN:'Claims over a limit',
  xpLimitsLead:'A monthly limit per category per employee (blank = none). It can be exceeded with a reason written by the payroll approver.', xpSaveLimits:'Save limits', xpSaved:'Saved', xpSent:'Claim sent',
  xpVoucher:'Expense claim voucher', xpVoucherKind:'Expense claim', xpSignEmp:'Claimant', xpSignMgr:'Line manager', xpSignPay:'Payroll',
  e_duplicate_expense:'This line is a duplicate: same category, date and amount in another claim or in this one.', e_receipt_required:'A receipt number is needed for this amount.', e_bad_vat:'VAT is more than 15% of the amount.',
  e_too_many_lines:'At most 40 lines in a claim.', e_bad_amount:'Invalid amount.'
});

var css = '.xp-line{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px 0;border-top:1px solid var(--line)}.xp-line:first-child{border-top:0}' +
  '.xp-line .field{margin:0}.xp-line .wide{grid-column:span 2}.xp-line .rm{align-self:end}.xp-chk{padding:10px 12px;border-radius:12px;background:var(--well);font-size:13px;margin:8px 0}.xp-chk.bad{background:var(--bad-bg);color:var(--bad)}' +
  '.xp-chk.warn{background:var(--warn-bg);color:var(--warn)}@media (max-width:640px){.xp-line{grid-template-columns:repeat(2,minmax(0,1fr))}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var uid = 0;
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function day(iso){ var ms = Date.parse(iso); return isNaN(ms) ? String(iso || '').slice(0, 10) : new Date(ms + 180 * 60000).toISOString().slice(0, 10); }
function monthName(m){ return m ? new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function money(n){ return '<span class="num">' + Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span> ' + sar(); }
function sep(){ return ' · '; }
function busy(el){ el.innerHTML = '<div class="list">' + [0, 1, 2].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%;margin-top:6px"></span></div></div>'; }).join('') + '</div>'; }
function bad(code){ return '<p class="hr-bad" role="alert">' + esc(errText(code)) + '</p>'; }
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function empLine(e){ return e ? esc(lang(e.name, e.nameEn)) + ' <bdi class="num">' + esc(e.empNo) + '</bdi>' : ''; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function fld(label, control){ var id = 'xpf' + (++uid); return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + '</div>'; }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
function confirmTap(b, fn){
  b.onclick = function(){
    if (b.dataset.armed) { b.disabled = true; return fn(); }
    var old = b.innerHTML; b.dataset.armed = '1'; b.textContent = S.lang === 'en' ? 'Tap again to confirm' : 'اضغط مرة أخرى للتأكيد';
    setTimeout(function(){ if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.innerHTML = old; } }, 4000);
  };
}
var XS_CLS = { pending: 'late', approved: 'in', paid: 'in', rejected: 'absent', cancelled: 'off' };
function stChip(x){ return chip(x.status === 'pending' ? t('xpst_' + x.step) : t('xps_' + x.status), XS_CLS[x.status]); }
function flagText(f){ return t('xpOver') + ': ' + t('xc_' + f.category) + sep() + monthName(f.month) + sep() + money(f.total) + ' / ' + money(f.limit); }

// ---------------- the page ----------------
function page(body){
  var tab = S.xpTab || 'mine';
  body.innerHTML = '<div class="hr-h"><h2>' + t('xpTitle') + '</h2></div><p class="hr-hint" style="margin:-4px 0 12px">' + t('xpLead') + '</p><div id="xpB"></div>';
  var box = $('#xpB', body);
  apiFresh('myExpenses', {}, function(me){
    if (!box.isConnected) return;
    if (!me.ok) return box.innerHTML = bad(me.error);
    var tabs = [['mine', 'receipt', 'xpMine']];
    if (me.inbox || me.isManager || me.canAll) tabs.push(['inbox', 'seal-check', 'xpInbox']);
    if (me.isManager) tabs.push(['team', 'users', 'xpTeam']);
    if (me.canAll) tabs.push(['all', 'list-bullets', 'xpAll'], ['report', 'chart-bar', 'xpReport'], ['limits', 'sliders-horizontal', 'xpLimits']);
    if (!tabs.some(function(x){ return x[0] === tab; })) tab = 'mine';
    box.innerHTML = '<div class="op-tabs" role="tablist">' + tabs.map(function(x){ return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (tab === x[0]) + '">' + ph(x[1]) + t(x[2]) + (x[0] === 'inbox' && me.inbox ? ' <span class="chip late num">' + me.inbox + '</span>' : '') + '</button>'; }).join('') + '</div><div id="xpT"></div>';
    $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.xpTab = b.dataset.tab; page(body); }; });
    var el = $('#xpT', box), again = function(){ page(body); };
    if (tab === 'mine') mine(el, me, again);
    else if (tab === 'report') report(el);
    else if (tab === 'limits') limits(el, me, again);
    else inbox(el, tab === 'inbox' ? '' : tab, again);
  }, true);
}
function claimRow(x, i, who){
  return '<div class="row"><div class="av">' + ph('receipt') + '</div><div class="main"><b>' + (who ? empLine(x.emp) + sep() : '') + esc(x.title || t('xpTitle')) + '</b>' +
    '<small><bdi>' + esc(x.ref) + '</bdi>' + sep() + fmt(day(x.createdAt)) + sep() + money(x.total) + sep() + x.lines.length + ' ' + t('xpLines') + (x.payMonth ? sep() + esc(monthName(x.payMonth)) : '') + (x.paidRef ? sep() + '<bdi>' + esc(x.paidRef) + '</bdi>' : '') + '</small>' +
    (x.flags.length ? '<small style="color:var(--warn)">' + ph('warning') + ' ' + x.flags.map(flagText).join('؛ ') + '</small>' : '') + '</div>' + stChip(x) +
    ' <button type="button" class="btn btn-line btn-sm" data-v="' + i + '" aria-label="' + t('xpPrint') + '">' + ph('eye') + '</button></div>';
}
function mine(el, me, again){
  el.innerHTML = '<div class="toolbar"><span class="hr-hint">' + (me.receiptOver ? t('xpReceiptOver') + ' ' + money(me.receiptOver) + sep() : '') + t('xpMaxAge') + '</span><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="xpNew">' + ph('plus') + t('xpNew') + '</button></div>' +
    (me.rows.length ? '<div class="list">' + me.rows.map(function(x, i){ return claimRow(x, i, false); }).join('') + '</div>' : empty('receipt', t('xpNone')));
  $('#xpNew', el).onclick = function(){ newClaim(me, again); };
  $$('[data-v]', el).forEach(function(b){ b.onclick = function(){ view(me.rows[b.dataset.v], again); }; });
}
function inbox(el, scope, again){
  busy(el);
  api('expenseInbox', scope ? { scope: scope } : {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    el.innerHTML = r.rows.length ? '<div class="list">' + r.rows.map(function(x, i){ return claimRow(x, i, true); }).join('') + '</div>' : empty('seal-check', t('xpNone'));
    $$('[data-v]', el).forEach(function(b){ b.onclick = function(){ view(r.rows[b.dataset.v], again); }; });
  });
}
/** One claim: its lines, warnings and history, and the actions the viewer may take. */
function view(x, again){
  var d = drawer('<h3>' + esc(x.title || t('xpTitle')) + ' <bdi>' + esc(x.ref) + '</bdi></h3><p class="hr-hint">' + empLine(x.emp) + sep() + stChip(x) + '</p>' +
    '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('xpDate') + '</th><th>' + t('xpCat') + '</th><th>' + t('xpDesc') + '</th><th>' + t('xpReceipt') + '</th><th>' + t('xpVat') + '</th><th>' + t('xpAmount') + '</th></tr></thead><tbody>' +
    x.lines.map(function(l){ return '<tr><td class="num">' + esc(l.date) + '</td><td>' + t('xc_' + l.category) + '</td><td>' + esc(l.description) + (l.merchant ? ' <small>' + esc(l.merchant) + '</small>' : '') + '</td><td><bdi>' + esc(l.receiptRef || '') + '</bdi></td><td class="num">' + Number(l.vat || 0).toFixed(2) + '</td><td class="num">' + Number(l.amount).toFixed(2) + '</td></tr>'; }).join('') +
    '</tbody></table></div><p><b>' + t('xpTotal') + ': ' + money(x.total) + '</b> (' + t('xpVat') + ' ' + money(x.vat) + ')</p>' +
    (x.flags.length ? '<div class="xp-chk warn">' + x.flags.map(flagText).join('<br>') + '</div>' : '') +
    (x.history.length ? '<ul class="cn-tl" style="list-style:none;padding:0">' + x.history.map(function(h){ return '<li><b>' + esc(T[S.lang]['cnd_' + h.decision] || h.decision) + sep() + esc(h.by) + '</b> <small>' + fmt(day(h.at)) + (h.note ? sep() + esc(h.note) : '') + '</small></li>'; }).join('') + '</ul>' : '') +
    '<div id="xpAct"></div><p class="hr-bad" id="xpE" role="alert"></p><div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="xpPr">' + ph('printer') + t('xpPrint') + '</button></div>');
  var act = $('#xpAct', d), er = $('#xpE', d), h = '';
  var done = function(r, b){ if (b) b.disabled = false; if (!r.ok) return er.textContent = errText(r.error); d.remove(); toast(t('xpSaved')); refreshTasks(); again(); };
  if (x.canAct) h += '<form class="form op-box" id="xpD">' + (x.step === 'payroll' ? fld(t('xpPayout'), '<select name="payout"><option value="payroll">' + t('xpViaPayroll') + '</option><option value="outside">' + t('xpOutside') + '</option></select>') : '') +
    fld(x.flags.length && x.step === 'payroll' ? t('xpNoteReq') : t('xpNoteOpt'), '<input name="note" maxlength="300">') + '<div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + ph('check') + t('xpApprove') + '</button><button type="button" class="btn btn-line btn-sm" id="xpRj">' + t('xpReject') + '</button></div></form>';
  if (x.canPay) h += '<form class="form op-box" id="xpP"><div class="two">' + fld(t('xpPaidRef'), '<input name="ref" dir="ltr" maxlength="60" required>') + fld(t('xpPaidOn'), '<input name="on" type="date" value="' + riyadhToday() + '" max="' + riyadhToday() + '">') + '</div><div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + t('xpPaid') + '</button></div></form>';
  if (x.canCancel) h += '<form class="form op-box" id="xpC">' + (x.mine ? '' : fld(t('xpNoteReq'), '<input name="note" maxlength="300">')) + '<div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + (x.mine ? t('xpCancel') : t('xpCancelPay')) + '</button></div></form>';
  act.innerHTML = h;
  var fd = $('#xpD', d);
  if (fd) {
    fd.onsubmit = function(ev){ ev.preventDefault(); var b = fd.querySelector('[type=submit]'); b.disabled = true; api('expenseDecide', { id: x.id, decision: 'approve', note: fd.elements.note.value.trim(), payout: fd.elements.payout ? fd.elements.payout.value : '' }).then(function(r){ done(r, b); }); };
    $('#xpRj', d).onclick = function(){ var n = fd.elements.note.value.trim(); if (!n) return er.textContent = errText('note_required'); api('expenseDecide', { id: x.id, decision: 'reject', note: n }).then(function(r){ done(r); }); };
  }
  var fp = $('#xpP', d); if (fp) fp.onsubmit = function(ev){ ev.preventDefault(); var b = fp.querySelector('[type=submit]'); b.disabled = true; api('expensePaid', { id: x.id, paidRef: fp.elements.ref.value.trim(), paidOn: fp.elements.on.value }).then(function(r){ done(r, b); }); };
  var fc = $('#xpC', d); if (fc) fc.onsubmit = function(ev){ ev.preventDefault(); var b = fc.querySelector('[type=submit]'); b.disabled = true; api('expenseCancel', { id: x.id, note: fc.elements.note ? fc.elements.note.value.trim() : '' }).then(function(r){ done(r, b); }); };
  $('#xpPr', d).onclick = function(){ voucher(x); };
}
/** The claim on A4 with its lines, totals in words and three signature lines. */
function voucher(x){
  if (!window.Doc) return loadScript('js/doc.js').then(function(){ voucher(x); });
  var en = S.lang === 'en', D = Doc;
  var body = '<section><dl class="grid c4">' + [[en ? 'Claimant' : 'مقدم المطالبة', x.emp ? x.emp.name + ' (' + x.emp.empNo + ')' : ''], [en ? 'Department' : 'الإدارة', x.department], [en ? 'Cost centre' : 'مركز التكلفة', x.costCenter], [en ? 'Status' : 'الحالة', t('xps_' + x.status)]]
      .map(function(r){ return '<div><dt>' + D.esc(r[0]) + '</dt><dd>' + D.esc(r[1] || '-') + '</dd></div>'; }).join('') + '</dl></section>' +
    '<section><table class="tb"><thead><tr><th>' + D.esc(t('xpDate')) + '</th><th>' + D.esc(t('xpCat')) + '</th><th>' + D.esc(t('xpDesc')) + '</th><th>' + D.esc(t('xpReceipt')) + '</th><th class="n">' + D.esc(t('xpVat')) + '</th><th class="n">' + D.esc(t('xpAmount')) + '</th></tr></thead><tbody>' +
    x.lines.map(function(l){ return '<tr><td class="num">' + D.esc(l.date) + '</td><td>' + D.esc(t('xc_' + l.category)) + '</td><td>' + D.esc(l.description) + (l.merchant ? '<small>' + D.esc(l.merchant) + '</small>' : '') + '</td><td>' + D.esc(l.receiptRef || '') + '</td><td class="n num">' + D.money(l.vat || 0) + '</td><td class="n num">' + D.money(l.amount) + '</td></tr>'; }).join('') +
    '</tbody><tfoot><tr><td colspan="4">' + D.esc(t('xpTotal')) + '</td><td class="n num">' + D.money(x.vat) + '</td><td class="n num">' + D.money(x.total) + '</td></tr></tfoot></table>' +
    '<p class="note">' + D.esc(D.words(x.total, en ? 'en' : 'ar')) + '</p></section>' +
    (x.flags.length ? '<section><p class="note warn">' + D.esc(x.flags.map(function(f){ var tmp = document.createElement('div'); tmp.innerHTML = flagText(f); return tmp.textContent; }).join(' / ')) + '</p></section>' : '');
  D.open({ lang: en ? 'en' : 'ar', kind: t('xpVoucherKind'), title: t('xpVoucher'), ref: x.ref, body: body, qr: x.ref + '|' + x.total, by: S.me && S.me.name, signatures: [t('xpSignEmp'), t('xpSignMgr'), t('xpSignPay')] });
}
function newClaim(me, again){
  var cats = me.categories || ['fuel', 'tolls', 'parking', 'meals', 'per_diem', 'phone', 'vehicle', 'travel', 'other'], td = riyadhToday();
  var lines = [{ category: cats[0], date: td, amount: '', vat: '', merchant: '', description: '', receiptRef: '' }];
  var d = drawer('<h3>' + t('xpNew') + '</h3><form class="form" id="xnF">' + fld(t('xpTitleF'), '<input name="title" maxlength="120">') + '<h4 class="hr-sub">' + t('xpLines') + '</h4><div id="xnL"></div>' +
    '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="xnAdd">' + ph('plus') + t('xpAddLine') + '</button></div><div class="xp-chk" id="xnC" aria-live="polite"></div>' +
    '<div class="btnrow"><button class="btn btn-dark" type="submit" id="xnGo" disabled>' + t('xpSend') + '</button></div></form>');
  var box = $('#xnL', d), chk = $('#xnC', d), go = $('#xnGo', d), timer = null, seq = 0;
  function paint(){
    box.innerHTML = lines.map(function(l, i){
      return '<div class="xp-line" data-i="' + i + '">' + fld(t('xpCat'), '<select data-k="category">' + cats.map(function(c){ return '<option value="' + c + '"' + (l.category === c ? ' selected' : '') + '>' + t('xc_' + c) + '</option>'; }).join('') + '</select>') +
        fld(t('xpDate'), '<input data-k="date" type="date" max="' + td + '" value="' + esc(l.date) + '">') + fld(t('xpAmount'), '<input data-k="amount" type="number" min="0.01" step="0.01" inputmode="decimal" value="' + esc(l.amount) + '">') +
        fld(t('xpVat'), '<input data-k="vat" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(l.vat) + '">') + '<div class="wide">' + fld(t('xpDesc'), '<input data-k="description" maxlength="300" value="' + esc(l.description) + '">') + '</div>' +
        fld(t('xpMerchant'), '<input data-k="merchant" maxlength="120" value="' + esc(l.merchant) + '">') + fld(t('xpReceipt'), '<input data-k="receiptRef" dir="ltr" maxlength="60" value="' + esc(l.receiptRef) + '">') +
        (lines.length > 1 ? '<button type="button" class="btn btn-line btn-sm rm" data-rm aria-label="' + t('xpRemove') + '">' + ph('trash') + '</button>' : '') + '</div>';
    }).join('');
    $$('.xp-line', box).forEach(function(row){ var i = +row.dataset.i;
      $$('[data-k]', row).forEach(function(x){ x.oninput = x.onchange = function(){ lines[i][x.dataset.k] = x.value; check(); }; });
      var rm = $('[data-rm]', row); if (rm) rm.onclick = function(){ lines.splice(i, 1); paint(); check(); };
    });
  }
  function check(){
    clearTimeout(timer); chk.className = 'xp-chk'; chk.textContent = t('xpChecking'); go.disabled = true;
    timer = setTimeout(function(){
      var my = ++seq;
      api('expenseCheck', { claim: { lines: lines } }, true).then(function(r){
        if (my !== seq || !chk.isConnected) return;
        var c = r.ok ? r.check : { error: r.error };
        if (c.error) { chk.className = 'xp-chk bad'; chk.textContent = (c.line != null ? t('xpLineN') + ' ' + (c.line + 1) + ': ' : '') + errText(c.error); return; }
        go.disabled = false;
        chk.className = 'xp-chk' + (c.flags.length ? ' warn' : '');
        chk.innerHTML = t('xpTotal') + ': <b>' + money(c.total) + '</b> (' + t('xpVat') + ' ' + money(c.vat) + ')' + (c.flags.length ? '<br>' + c.flags.map(flagText).join('<br>') + '<br>' + t('xpOverLead') : '<br>' + t('xpOk'));
      });
    }, 400);
  }
  $('#xnAdd', d).onclick = function(){ if (lines.length >= 40) return; var last = lines[lines.length - 1]; lines.push({ category: last.category, date: last.date, amount: '', vat: '', merchant: '', description: '', receiptRef: '' }); paint(); check(); };
  $('#xnF', d).onsubmit = function(ev){
    ev.preventDefault(); go.disabled = true;
    api('expenseCreate', { claim: { title: this.elements.title.value.trim(), lines: lines } }).then(function(r){
      if (!r.ok) { go.disabled = false; chk.className = 'xp-chk bad'; chk.textContent = errText(r.error); return; }
      d.remove(); toast(t('xpSent') + ' ' + r.claim.ref); refreshTasks(); again();
    });
  };
  paint(); check();
}
function report(el){
  var to = riyadhToday().slice(0, 7), y = +to.slice(0, 4), m = +to.slice(5, 7) - 11, from = (m <= 0 ? (y - 1) + '-' + String(m + 12).padStart(2, '0') : y + '-' + String(m).padStart(2, '0'));
  el.innerHTML = '<form class="toolbar" id="xrF"><label class="hr-hint">' + t('xpFrom') + '</label><input type="month" name="from" value="' + from + '"><label class="hr-hint">' + t('xpTo') + '</label><input type="month" name="to" value="' + to + '"><button class="btn btn-dark btn-sm" type="submit">' + t('xpShow') + '</button><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="xrX" disabled>' + ph('microsoft-excel-logo') + t('xpExcel') + '</button></form><div id="xrB"></div>';
  var box = $('#xrB', el), last = null;
  function load(){
    busy(box);
    var f = $('#xrF', el);
    api('expenseReport', { from: f.elements.from.value, to: f.elements.to.value }).then(function(r){
      if (!r.ok) return box.innerHTML = bad(r.error);
      last = r; $('#xrX', el).disabled = !r.rows.length;
      var sum = function(k){ return r.rows.reduce(function(s, x){ return s + (x.state === 'approved' ? Number(x[k]) : 0); }, 0); };
      box.innerHTML = '<p class="hr-hint">' + t('xpOverN') + ': ' + r.overLimitClaims + '</p>' + (r.rows.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('xpMonth') + '</th><th>' + t('xpDept') + '</th><th>' + t('xpCc') + '</th><th>' + t('xpCat') + '</th><th>' + t('xpState') + '</th><th>' + t('xpClaims') + '</th><th>' + t('xpNet') + '</th><th>' + t('xpVat') + '</th><th>' + t('xpAmount') + '</th></tr></thead><tbody>' +
        r.rows.map(function(x){ return '<tr><td class="num">' + esc(x.month) + '</td><td>' + esc(x.department) + '</td><td><bdi>' + esc(x.costCenter) + '</bdi></td><td>' + t('xc_' + x.category) + '</td><td>' + t('xps_' + x.state) + '</td><td class="num">' + x.claims + '</td><td class="num">' + x.net.toFixed(2) + '</td><td class="num">' + x.vat.toFixed(2) + '</td><td class="num">' + x.amount.toFixed(2) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="6">' + t('xpTotal') + ' (' + t('xps_approved') + ')</td><td class="num">' + sum('net').toFixed(2) + '</td><td class="num">' + sum('vat').toFixed(2) + '</td><td class="num">' + sum('amount').toFixed(2) + '</td></tr></tfoot></table></div>' : empty('chart-bar', t('xpNone')));
    });
  }
  $('#xrF', el).onsubmit = function(ev){ ev.preventDefault(); load(); };
  $('#xrX', el).onclick = function(){
    if (!last) return;
    loadScript('js/xl.js').then(function(){
      var en = S.lang === 'en', title = t('xpTitle') + ' ' + last.from + ' - ' + last.to;
      return XL.download({ fileName: title, title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(), filters: [[t('xpFrom'), last.from], [t('xpTo'), last.to]],
        sheets: [{ name: t('xpTitle'), title: title, columns: [{ key: 'month', label: t('xpMonth'), type: 'text' }, { key: 'department', label: t('xpDept'), type: 'text' }, { key: 'costCenter', label: t('xpCc'), type: 'text' },
          { key: 'category', label: t('xpCat'), type: 'text' }, { key: 'state', label: t('xpState'), type: 'text' }, { key: 'claims', label: t('xpClaims'), type: 'int', sum: true }, { key: 'net', label: t('xpNet'), type: 'money', sum: true },
          { key: 'vat', label: t('xpVat'), type: 'money', sum: true }, { key: 'amount', label: t('xpAmount'), type: 'money', sum: true }],
          rows: last.rows.map(function(x){ return { month: x.month, department: x.department, costCenter: x.costCenter, category: t('xc_' + x.category), state: t('xps_' + x.state), claims: x.claims, net: x.net, vat: x.vat, amount: x.amount }; }) }] });
    }).then(function(){ toast(t('v2Exported')); }, function(){ toast(errText('network')); });
  };
  load();
}
function limits(el, me, again){
  var cats = me.categories || [], lim = me.limits || {};
  el.innerHTML = '<p class="hr-hint">' + t('xpLimitsLead') + '</p><form class="form op-box" id="xlF"><div class="two">' + cats.map(function(c){ return fld(t('xc_' + c), '<input name="' + c + '" type="number" min="0" step="1" value="' + esc(lim[c] == null ? '' : lim[c]) + '">'); }).join('') + '</div>' +
    fld(t('xpReceiptOver'), '<input name="receiptOver" type="number" min="0" step="1" value="' + esc(me.receiptOver || 0) + '">') + '<p class="hr-bad" id="xlE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('xpSaveLimits') + '</button></div></form>';
  $('#xlF', el).onsubmit = function(ev){
    ev.preventDefault(); var f = this, b = f.querySelector('[type=submit]'), out = {}; b.disabled = true;
    cats.forEach(function(c){ out[c] = f.elements[c].value; });
    api('expenseLimitsSave', { limits: out, receiptOver: Number(f.elements.receiptOver.value || 0) }).then(function(r){ b.disabled = false; if (!r.ok) return $('#xlE', el).textContent = errText(r.error); toast(t('xpSaved')); again(); });
  };
}

window.Expense = { page: page, view: view, voucher: voucher };
})();
