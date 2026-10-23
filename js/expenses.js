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

var css = '.xp-line{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px 0;border-top:1px solid var(--line)}.xp-line:first-child{border-top:0}' +
  '.xp-line .field{margin:0}.xp-line .wide{grid-column:span 2}.xp-line .rm{align-self:end}.xp-chk{padding:12px 12px;border-radius:12px;background:var(--well);font-size:13px;margin:8px 0}.xp-chk.bad{background:var(--bad-bg);color:var(--bad)}' +
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
    '<small><bdi>' + esc(x.ref) + '</bdi>' + sep() + fmt(day(x.createdAt)) + sep() + money(x.total) + sep() + t('xpLines') + ': ' + x.lines.length + (x.payMonth ? sep() + esc(monthName(x.payMonth)) : '') + (x.paidRef ? sep() + '<bdi>' + esc(x.paidRef) + '</bdi>' : '') + '</small>' +
    (x.flags.length ? '<small style="color:var(--warn)">' + ph('warning') + ' ' + x.flags.map(flagText).join('؛ ') + '</small>' : '') + '</div>' + stChip(x) +
    ' <button type="button" class="btn btn-line btn-sm" data-v="' + i + '" aria-label="' + t('xpPrint') + '">' + ph('eye') + '</button></div>';
}
function mine(el, me, again){
  el.innerHTML = '<div class="toolbar"><span class="hr-hint">' + (me.receiptOver ? t('xpReceiptOver') + ' ' + money(me.receiptOver) + sep() : '') + t('xpMaxAge') + '</span><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="xpNew">' + ph('plus') + t('xpNew') + '</button></div>' +
    (me.rows.length ? '<div class="list">' + me.rows.map(function(x, i){ return claimRow(x, i, false); }).join('') + '</div>' : empty('receipt', t('xpNone')));
  $('#xpNew', el).onclick = function(){ goArea('requests', 'claim'); };
  seen(me.rows); $$('[data-v]', el).forEach(function(b){ b.onclick = function(){ goArea('requests', 'claimview', me.rows[b.dataset.v].id); }; });
}
function inbox(el, scope, again){
  busy(el);
  api('expenseInbox', scope ? { scope: scope } : {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    el.innerHTML = r.rows.length ? '<div class="list">' + r.rows.map(function(x, i){ return claimRow(x, i, true); }).join('') + '</div>' : empty('seal-check', t('xpNone'));
    seen(r.rows); $$('[data-v]', el).forEach(function(b){ b.onclick = function(){ goArea('requests', 'claimview', r.rows[b.dataset.v].id); }; });
  });
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
// ---------------- full pages (2026-10-14): a new claim (#requests/claim) and one claim (#requests/claimview/<id>) ----------------
Object.assign(T.ar, { xpWho:'مقدم المطالبة', xpSum:'الملخص', xpByCat:'حسب الفئة', xpPath:'مسار الاعتماد', xpPathLead:'يعتمدها مديرك ثم الرواتب، ثم تصرف.', xpGuide:'قبل أن ترسل',
  xpG1:'أضف كل مصروف في بند مستقل بتاريخه ومبلغه شامل الضريبة.', xpG2:'تقبل المصروفات خلال آخر 90 يوما فقط.', xpRecent:'آخر مطالباتك', xpStepMgr:'المدير المباشر', xpStepPay:'الرواتب', xpStepPaid:'الصرف',
  xpSendIt:'ترسل المطالبة', xpLinesN:'عدد البنود', xpSentT:'أرسلت مطالبتك', xpSentL:'تابع خطواتها هنا.', xpNotFound:'لم نجد هذه المطالبة، أو لا تملك صلاحية عرضها.', xpDecide:'قرارك', xpView:'المطالبة', xpEmpNo:'الرقم الوظيفي', xpTimeline:'سير المطالبة', xpFillFirst:'أدخل المبلغ والوصف لكل بند ليظهر الحساب.', xpAttach:'رفع صور الإيصالات غير متاح بعد. اكتب رقم كل إيصال في بنده واحتفظ بالأصل.' });
Object.assign(T.en, { xpWho:'Claimant', xpSum:'Summary', xpByCat:'By category', xpPath:'Approval path', xpPathLead:'Your manager approves, then payroll, then it is paid.', xpGuide:'Before you send',
  xpG1:'Put each expense on its own line with its date and the amount including VAT.', xpG2:'Only expenses from the last 90 days are accepted.', xpRecent:'Your recent claims', xpStepMgr:'Line manager', xpStepPay:'Payroll', xpStepPaid:'Payment',
  xpSendIt:'You send it', xpLinesN:'Lines', xpSentT:'Your claim is sent', xpSentL:'Follow its steps here.', xpNotFound:'This claim was not found, or you cannot see it.', xpDecide:'Your decision', xpView:'Claim', xpEmpNo:'Employee no.', xpTimeline:'Progress', xpFillFirst:'Enter the amount and description of each line to see the check.', xpAttach:'Receipt photos cannot be attached yet. Type each receipt number on its line and keep the original.' });
var css2 = '.xp-page .xp-line{grid-template-columns:repeat(4,minmax(0,1fr));padding:16px 0}.xp-page .xp-line + .xp-line{border-top:1px dashed var(--line)}' +
  '.xp-ln{grid-column:1 / -1;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--ink-3)}.xp-ln .sp{flex:1}' +
  '.xp-ln b{width:22px;height:22px;border-radius:8px;display:grid;place-items:center;background:var(--well);color:var(--ink-2);font-size:12px}' +
  '@media (max-width:640px){.xp-page .xp-line{grid-template-columns:repeat(2,minmax(0,1fr))}}';
var st2 = document.createElement('style'); st2.textContent = css2; document.head.appendChild(st2);
function seen(rows){ S.xpSeen = S.xpSeen || {}; (rows || []).forEach(function(x){ S.xpSeen[x.id] = x; }); }
function back2(pg){ $$('[data-fp-back]', pg).forEach(function(b){ b.onclick = function(){ if (history.state && history.state.fp && history.length > 1) history.back(); else goArea('requests', 'expenses', '', { replace: true }); }; }); }
function chainHtml(x){
  var node = function(cls, icon, b, small, note){ return '<li class="' + cls + '"><span class="fp-dot">' + ph(icon) + '</span><div><b>' + b + '</b>' + (small ? '<small>' + small + '</small>' : '') + (note ? '<div class="note">' + esc(note) + '</div>' : '') + '</div></li>'; };
  if (!x) return '<ol class="fp-chain">' + node('now', 'paper-plane-tilt', t('xpSendIt'), '') + node('off', 'user', t('xpStepMgr'), '') + node('off', 'money', t('xpStepPay'), '') + node('off', 'seal-check', t('xpStepPaid'), '') + '</ol>';
  var li = [node('done', 'paper-plane-tilt', t('xpSendIt'), empLine(x.emp) + sep() + fmt(day(x.createdAt)))], ended = false;
  (x.steps || ['manager', 'payroll']).forEach(function(st){
    if (ended) return;
    var h = (x.history || []).filter(function(y){ return y.step === st && (y.decision === 'approve' || y.decision === 'reject'); })[0], name = st === 'manager' ? t('xpStepMgr') : st === 'payroll' ? t('xpStepPay') : esc(st);
    if (h && h.decision === 'reject') { li.push(node('no', 'x', name + ': ' + t('xpReject'), esc(h.by) + sep() + fmt(day(h.at)), h.note)); ended = true; }
    else if (h) li.push(node('done', 'check', name + ': ' + t('xpApprove'), esc(h.by) + sep() + fmt(day(h.at)), h.note));
    else if (x.status === 'pending' && x.step === st) li.push(node('now', 'hourglass-medium', name, ''));
    else li.push(node('off', 'circle-dashed', name, ''));
  });
  var c = (x.history || []).filter(function(y){ return y.decision === 'cancelled' || y.decision === 'cancel'; })[0];
  if (c) li.push(node('no', 'arrow-u-up-left', t('xps_cancelled'), esc(c.by) + sep() + fmt(day(c.at)), c.note));
  else if (x.status === 'paid') li.push(node('done', 'seal-check', t('xpStepPaid'), (x.paidOn ? fmt(x.paidOn) : '') + (x.paidRef ? sep() + '<bdi>' + esc(x.paidRef) + '</bdi>' : '')));
  else if (!ended) li.push(node(x.status === 'approved' ? 'now' : 'off', 'seal-check', t('xpStepPaid'), x.payMonth ? esc(monthName(x.payMonth)) : ''));
  return '<ol class="fp-chain">' + li.join('') + '</ol>';
}
function catBars(lines){
  var by = {}, tot = 0;
  lines.forEach(function(l){ var a = Number(l.amount) || 0; if (a > 0) { by[l.category] = (by[l.category] || 0) + a; tot += a; } });
  var ks = Object.keys(by).sort(function(a, b){ return by[b] - by[a]; });
  if (!ks.length || !window.Viz) return '';
  return '<h3 class="hr-sub" style="font-size:14px;margin:4px 0 8px">' + t('xpByCat') + '</h3>' + Viz.hbars(ks.map(function(k){ return { label: t('xc_' + k), value: by[k], text: Number(by[k]).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }), tip: t('xc_' + k) + ': ' + by[k].toFixed(2) }; }), { max: tot });
}
function newPage(body){
  var top = fpTop({ icon: 'receipt', title: t('xpNew'), lead: t('xpLead'), crumb: [t('arRequests'), t('xpTitle'), t('xpNew')] });
  body.innerHTML = '<div class="rq-page xp-page">' + top + (window.Viz ? Viz.skelPage(3, 2) : '') + '</div>';
  back2(body);
  var ME = null, F = null, drawn = false;
  apiFresh('myExpenses', {}, function(r){ if (!body.isConnected) return; if (!r.ok) return $('.xp-page', body).insertAdjacentHTML('beforeend', bad(r.error)); ME = r; seen(r.rows); if (F !== null) draw(); }, true);
  apiFresh('myFile', {}, function(r){ if (!body.isConnected) return; F = r.ok ? r.file : false; if (ME) draw(); }, true);
  function draw(){
    if (drawn) return; drawn = true;
    var pg = $('.xp-page', body), me = ME, cats = me.categories || ['fuel', 'tolls', 'parking', 'meals', 'per_diem', 'phone', 'vehicle', 'travel', 'other'], td = riyadhToday();
    var lines = [{ category: cats[0], date: td, amount: '', vat: '', merchant: '', description: '', receiptRef: '' }];
    var who = F && window.Req ? '' : '<section class="fp-card"><h2>' + ph('identification-badge') + t('xpWho') + '</h2><div class="fp-who"><span class="fp-av">' + esc(initials(S.me.name)) + '</span><div><b>' + esc(S.me.name) + '</b><small><bdi>' + esc(S.me.empNo) + '</bdi></small></div></div></section>';
    if (F) { var j = F.job || {}, e = F.emp || {}; who = '<section class="fp-card"><h2>' + ph('identification-badge') + t('xpWho') + '</h2><div class="fp-who"><span class="fp-av">' + esc(initials(e.name)) + '</span><div><b>' + esc(lang(e.name, e.nameEn)) + '</b><small>' +
      esc([j.position ? lang(j.position.titleAr, j.position.titleEn) : '', j.department ? lang(j.department.nameAr, j.department.nameEn) : ''].filter(Boolean).join(sep())) + '</small></div></div><dl class="fp-facts"><div><dt>' + t('xpEmpNo') + '</dt><dd><bdi class="num">' + esc(e.empNo) + '</bdi></dd></div>' +
      (j.manager ? '<div><dt>' + t('xpStepMgr') + '</dt><dd>' + esc(lang(j.manager.name, j.manager.nameEn)) + '</dd></div>' : '') + (j.department && j.department.costCenter ? '<div><dt>' + t('xpCc') + '</dt><dd><bdi>' + esc(j.department.costCenter) + '</bdi></dd></div>' : '') + '</dl></section>'; }
    var recent = me.rows.slice(0, 3);
    var send = '<button class="btn btn-dark" type="submit" form="xnF" data-send disabled>' + ph('paper-plane-tilt') + t('xpSend') + '</button>';
    pg.innerHTML = top + '<form class="form" id="xnF" novalidate><div class="fp-grid"><div class="fp-main">' + who +
      '<section class="fp-card"><h2><span class="fp-n">1</span>' + t('xpTitleF') + '</h2>' + fld(t('xpTitleF'), '<input name="title" maxlength="120">') + '</section>' +
      '<section class="fp-card"><h2><span class="fp-n">2</span>' + t('xpLines') + '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="xnAdd">' + ph('plus') + t('xpAddLine') + '</button></h2><div id="xnL"></div><div class="fp-drop" style="margin-top:12px">' + ph('paperclip') + '<span>' + t('xpAttach') + '</span></div></section>' +
      '<section class="fp-card"><h2>' + ph('clock-counter-clockwise') + t('xpRecent') + '</h2>' + (recent.length ? '<div class="fp-mini">' + recent.map(function(x){ return '<div data-open="' + x.id + '" role="link" tabindex="0"><span class="rq-mini-av">' + ph('receipt') + '</span><div class="m"><b>' + esc(x.title || t('xpTitle')) + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + sep() + money(x.total) + '</small></div>' + stChip(x) + '</div>'; }).join('') + '</div>' : '<p class="hr-hint" style="margin:0">' + t('xpNone') + '</p>') + '</section></div>' +
      '<aside class="fp-aside"><section class="fp-card" aria-live="polite"><h2><span class="fp-n">3</span>' + t('xpSum') + '</h2><div id="xnC"></div><p class="fp-err" id="xnE" role="alert"></p><div class="fp-actions fp-desk" style="margin-top:14px">' + send + '<button type="button" class="btn btn-line" data-fp-back>' + t('cancel') + '</button></div></section>' +
        '<section class="fp-card"><h2>' + ph('flow-arrow') + t('xpPath') + '</h2>' + chainHtml(null) + '<p class="hr-hint" style="margin:10px 0 0;font-size:12px">' + t('xpPathLead') + '</p></section>' +
        '<section class="fp-card"><h2>' + ph('lightbulb') + t('xpGuide') + '</h2><ul class="fp-hints"><li>' + ph('info') + '<span>' + t('xpG1') + '</span></li><li>' + ph('info') + '<span>' + t('xpG2') + '</span></li>' +
          (me.receiptOver ? '<li>' + ph('info') + '<span>' + t('xpReceiptOver') + ' ' + money(me.receiptOver) + '</span></li>' : '') + '<li>' + ph('info') + '<span>' + t('xpOverLead') + '</span></li></ul></section></aside></div>' +
      '<div class="fp-bar"><div class="fp-sumline"><span>' + t('xpTotal') + '</span><b id="xnTot">-</b></div>' + send + '</div></form>';
    back2(pg);
    $$('[data-open]', pg).forEach(function(el){ el.onclick = function(){ goArea('requests', 'claimview', el.dataset.open); }; el.onkeydown = function(e){ if (e.key === 'Enter') el.onclick(); }; });
    var box = $('#xnL', pg), chk = $('#xnC', pg), timer = null, seq = 0, sending = false, ready = false;
    var setSend = function(on){ ready = !!on; $$('[data-send]', pg).forEach(function(b){ b.disabled = !on || sending; }); };
    function paint(){
      box.innerHTML = lines.map(function(l, i){
        return '<div class="xp-line" data-i="' + i + '"><div class="xp-ln"><b class="num">' + (i + 1) + '</b>' + t('xpLineN') + '<span class="sp"></span>' + (lines.length > 1 ? '<button type="button" class="btn btn-line btn-sm" data-rm aria-label="' + t('xpRemove') + '">' + ph('trash') + '</button>' : '') + '</div>' +
          fld(t('xpCat'), '<select data-k="category">' + cats.map(function(c){ return '<option value="' + c + '"' + (l.category === c ? ' selected' : '') + '>' + t('xc_' + c) + '</option>'; }).join('') + '</select>') +
          fld(t('xpDate'), '<input data-k="date" type="date" max="' + td + '" value="' + esc(l.date) + '">') + fld(t('xpAmount'), '<input data-k="amount" type="number" min="0.01" step="0.01" inputmode="decimal" value="' + esc(l.amount) + '">') +
          fld(t('xpVat'), '<input data-k="vat" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(l.vat) + '">') + '<div class="wide">' + fld(t('xpDesc'), '<input data-k="description" maxlength="300" value="' + esc(l.description) + '">') + '</div>' +
          fld(t('xpMerchant'), '<input data-k="merchant" maxlength="120" value="' + esc(l.merchant) + '">') + fld(t('xpReceipt'), '<input data-k="receiptRef" dir="ltr" maxlength="60" value="' + esc(l.receiptRef) + '">') + '</div>';
      }).join('');
      $$('.xp-line', box).forEach(function(row){ var i = +row.dataset.i;
        $$('[data-k]', row).forEach(function(x){ x.oninput = x.onchange = function(){ lines[i][x.dataset.k] = x.value; check(); }; });
        var rm = $('[data-rm]', row); if (rm) rm.onclick = function(){ lines.splice(i, 1); paint(); check(); };
      });
    }
    function check(){
      clearTimeout(timer); setSend(false); $('#xnE', pg).textContent = '';
      // nothing filled in yet: a neutral hint, not a red error, until every line has an amount and a description
      if (lines.some(function(l){ return !(Number(l.amount) > 0) || !String(l.description || '').trim(); })) {
        ++seq; $('#xnTot', pg).textContent = '-';
        chk.innerHTML = '<div class="fp-state wait">' + ph('pencil-simple-line') + '<span>' + t('xpFillFirst') + '</span></div>'; return;
      }
      chk.innerHTML = '<div class="fp-state wait">' + ph('hourglass-medium') + '<span>' + t('xpChecking') + '</span></div>';
      timer = setTimeout(function(){
        var my = ++seq;
        api('expenseCheck', { claim: { lines: lines } }, true).then(function(r){
          if (my !== seq || !chk.isConnected) return;
          var c = r.ok ? r.check : { error: r.error };
          if (c.error) { chk.innerHTML = '<div class="fp-state bad" role="alert">' + ph('warning-circle') + '<span>' + (c.line != null ? t('xpLineN') + ' ' + (c.line + 1) + ': ' : '') + esc(errText(c.error)) + '</span></div>'; $('#xnTot', pg).textContent = '-'; return; }
          setSend(true);
          $('#xnTot', pg).innerHTML = money(c.total);
          chk.innerHTML = '<div class="fp-sum"><div class="fp-big"><b class="num">' + Number(c.total || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</b><span>' + sar() + '</span></div>' +
            '<div class="fp-rows"><div><span>' + t('xpVat') + '</span><b>' + money(c.vat) + '</b></div><div><span>' + t('xpLinesN') + '</span><b class="num">' + lines.length + '</b></div></div>' + catBars(lines) +
            (c.flags.length ? c.flags.map(function(f){ return '<div class="fp-state warn">' + ph('warning') + '<span>' + flagText(f) + '</span></div>'; }).join('') : '<div class="fp-state ok">' + ph('check-circle') + '<span>' + t('xpOk') + '</span></div>') + '</div>';
          if (window.Viz) Viz.wire(chk);
        });
      }, 380);
    }
    $('#xnAdd', pg).onclick = function(){ if (lines.length >= 40) return; var last = lines[lines.length - 1]; lines.push({ category: last.category, date: last.date, amount: '', vat: '', merchant: '', description: '', receiptRef: '' }); paint(); check(); var rows = $$('.xp-line', box); if (rows.length) { var inp = rows[rows.length - 1].querySelector('[data-k="amount"]'); if (inp) inp.focus(); } };
    $('#xnF', pg).onsubmit = function(ev){
      ev.preventDefault();
      if (sending || !ready) return; // one send at a time: a double tap must never file two claims
      var was = ready; sending = true; setSend(false);
      api('expenseCreate', { claim: { title: this.elements.title.value.trim(), lines: lines } }).then(function(r){
        sending = false;
        if (!r.ok) { setSend(was); $('#xnE', pg).textContent = errText(r.error); return; }
        S.xpJust = r.claim.id; seen([r.claim]); refreshTasks();
        goArea('requests', 'claimview', r.claim.id, { replace: true }); // the form's entry becomes the claim: Back returns to where the form was opened
      });
    };
    paint(); check();
  }
}
/** One claim on its own page: lines, warnings, timeline, and the actions the viewer may take. */
function viewPage(body, id){
  var hit = (S.xpSeen || {})[id], shown = '', justSent = S.xpJust === id;
  if (justSent) S.xpJust = null;
  var top = function(x){ return fpTop({ icon: 'receipt', title: x ? esc(x.title || t('xpTitle')) : t('xpView'), lead: x ? '<bdi class="num">' + esc(x.ref) + '</bdi>' : '', crumb: [t('arRequests'), t('xpTitle'), t('xpView')], chips: x ? stChip(x) : '' }); };
  body.innerHTML = '<div class="rq-page xp-page">' + top(null) + (window.Viz ? Viz.skelPage(2, 2) : '') + '</div>';
  back2(body);
  if (hit) draw(hit);
  var again = function(){ S.xpSeen = {}; viewPage(body, id); };
  var scopes = [null, {}, { scope: 'team' }, { scope: 'all' }], k = 0;
  (function next(){
    var sc = scopes[k++]; if (k > scopes.length) { if (!hit) missing(); return; }
    var call = sc === null ? function(cb){ apiFresh('myExpenses', {}, cb, true); } : function(cb){ api('expenseInbox', sc, true).then(cb); };
    call(function(r){
      if (!body.isConnected) return;
      var x = r && r.ok && r.rows.filter(function(y){ return y.id === id; })[0];
      if (r && r.ok) seen(r.rows);
      if (x) draw(x); else next();
    });
  })();
  function missing(){ var pg = $('.xp-page', body); pg.innerHTML = top(null) + '<div class="db-empty">' + ph('file-x', 'duotone') + '<span>' + t('xpNotFound') + '</span></div>'; back2(pg); }
  function draw(x){
    var key = JSON.stringify(x); if (key === shown) return; shown = key;
    var pg = $('.xp-page', body); if (!pg) return;
    var just = justSent;
    var acts = '';
    if (x.canAct) acts += '<section class="fp-card"><h2>' + ph('seal-check') + t('xpDecide') + '</h2><form class="form" id="xpD">' + (x.step === 'payroll' ? fld(t('xpPayout'), '<select name="payout"><option value="payroll">' + t('xpViaPayroll') + '</option><option value="outside">' + t('xpOutside') + '</option></select>') : '') +
      fld(x.flags.length && x.step === 'payroll' ? t('xpNoteReq') : t('xpNoteOpt'), '<input name="note" maxlength="300">') + '<div class="fp-actions"><button class="btn btn-dark" type="submit">' + ph('check') + t('xpApprove') + '</button><button type="button" class="btn btn-danger" id="xpRj">' + ph('x') + t('xpReject') + '</button></div></form></section>';
    if (x.canPay) acts += '<section class="fp-card"><h2>' + ph('bank') + t('xpPaid') + '</h2><form class="form" id="xpP"><div class="two">' + fld(t('xpPaidRef'), '<input name="ref" dir="ltr" maxlength="60" required>') + fld(t('xpPaidOn'), '<input name="on" type="date" value="' + riyadhToday() + '" max="' + riyadhToday() + '">') + '</div><div class="fp-actions"><button class="btn btn-dark" type="submit">' + t('xpPaid') + '</button></div></form></section>';
    if (x.canCancel) acts += '<section class="fp-card"><form class="form" id="xpC">' + (x.mine ? '' : fld(t('xpNoteReq'), '<input name="note" maxlength="300">')) + '<div class="fp-actions"><button class="btn btn-line" type="submit">' + ph('arrow-u-up-left') + (x.mine ? t('xpCancel') : t('xpCancelPay')) + '</button></div></form></section>';
    pg.innerHTML = top(x) + (just ? '<div class="fp-ok" role="status"><span class="ic">' + ph('check') + '</span><div><b>' + t('xpSentT') + '</b><small>' + t('xpSentL') + '</small></div></div>' : '') +
      '<div class="fp-grid"><div class="fp-main"><section class="fp-card"><h2>' + ph('list-bullets') + t('xpLines') + '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="xpPr">' + ph('printer') + t('xpPrint') + '</button></h2>' +
        '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('xpDate') + '</th><th>' + t('xpCat') + '</th><th>' + t('xpDesc') + '</th><th>' + t('xpReceipt') + '</th><th>' + t('xpVat') + '</th><th>' + t('xpAmount') + '</th></tr></thead><tbody>' +
        x.lines.map(function(l){ return '<tr><td class="num">' + esc(l.date) + '</td><td>' + t('xc_' + l.category) + '</td><td>' + esc(l.description) + (l.merchant ? ' <small>' + esc(l.merchant) + '</small>' : '') + '</td><td><bdi>' + esc(l.receiptRef || '') + '</bdi></td><td class="num">' + Number(l.vat || 0).toFixed(2) + '</td><td class="num">' + Number(l.amount).toFixed(2) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + (x.flags.length ? x.flags.map(function(f){ return '<div class="fp-state warn" style="margin-top:10px">' + ph('warning') + '<span>' + flagText(f) + '</span></div>'; }).join('') : '') + '</section>' +
        '<section class="fp-card"><h2>' + ph('identification-badge') + t('xpWho') + '</h2><div class="fp-who"><span class="fp-av">' + esc(initials(x.emp ? x.emp.name : '')) + '</span><div><b>' + (x.emp ? esc(lang(x.emp.name, x.emp.nameEn)) : '') + '</b><small>' + esc([x.department, x.costCenter].filter(Boolean).join(sep())) + '</small></div></div></section>' + acts + '</div>' +
      '<aside class="fp-aside"><section class="fp-card"><h2>' + ph('calculator') + t('xpSum') + '</h2><div class="fp-sum"><div class="fp-big"><b class="num">' + Number(x.total || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</b><span>' + sar() + '</span></div>' +
        '<div class="fp-rows"><div><span>' + t('xpVat') + '</span><b>' + money(x.vat) + '</b></div><div><span>' + t('xpLinesN') + '</span><b class="num">' + x.lines.length + '</b></div>' + (x.payMonth ? '<div><span>' + t('xpPayout') + '</span><b>' + esc(monthName(x.payMonth)) + '</b></div>' : '') + '</div>' + catBars(x.lines) + '</div></section>' +
        '<section class="fp-card"><h2>' + ph('flow-arrow') + t('xpTimeline') + '</h2>' + chainHtml(x) + '</section><p class="fp-err" id="xpE" role="alert"></p></aside></div>';
    back2(pg); if (window.Viz) Viz.wire(pg);
    var er = $('#xpE', pg), done = function(r, b){ if (b) b.disabled = false; if (!r.ok) return er.textContent = errText(r.error); toast(t('xpSaved')); refreshTasks(); again(); };
    var fd = $('#xpD', pg);
    if (fd) {
      fd.onsubmit = function(ev){ ev.preventDefault(); var b = fd.querySelector('[type=submit]'); b.disabled = true; api('expenseDecide', { id: x.id, decision: 'approve', note: fd.elements.note.value.trim(), payout: fd.elements.payout ? fd.elements.payout.value : '' }).then(function(r){ done(r, b); }); };
      $('#xpRj', pg).onclick = function(){ var n = fd.elements.note.value.trim(); if (!n) return er.textContent = errText('note_required'); api('expenseDecide', { id: x.id, decision: 'reject', note: n }).then(function(r){ done(r); }); };
    }
    var fp = $('#xpP', pg); if (fp) fp.onsubmit = function(ev){ ev.preventDefault(); var b = fp.querySelector('[type=submit]'); b.disabled = true; api('expensePaid', { id: x.id, paidRef: fp.elements.ref.value.trim(), paidOn: fp.elements.on.value }).then(function(r){ done(r, b); }); };
    var fc = $('#xpC', pg); if (fc) fc.onsubmit = function(ev){ ev.preventDefault(); var b = fc.querySelector('[type=submit]'); b.disabled = true; api('expenseCancel', { id: x.id, note: fc.elements.note ? fc.elements.note.value.trim() : '' }).then(function(r){ done(r, b); }); };
    $('#xpPr', pg).onclick = function(){ voucher(x); };
  }
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

window.Expense = { page: page, view: function(x){ goArea('requests', 'claimview', x.id); }, voucher: voucher, newPage: newPage, viewPage: viewPage };
})();
