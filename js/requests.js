// Requests (Phase 2): the form with a live check, the list, and printable letters.
// Shared by "ملفي" and the HR console. Every rule is re-checked by the server (requestQuote / requestCreate).
(function(){
'use strict';

Object.assign(T.ar, {
  rqTitle:'طلباتي', rqNew:'طلب جديد', rqEmpty:'لا توجد طلبات بعد. ابدأ بطلب جديد.', rqChoose:'ما نوع الطلب؟',
  rt_leave:'إجازة', rt_letter:'خطاب', rt_advance:'سلفة على الراتب', rt_correction:'تصحيح حضور', rt_data_change:'تحديث بياناتي', rt_resignation:'استقالة',
  rtd_leave:'سنوية أو مرضية أو غيرها', rtd_letter:'تعريف بالراتب أو خبرة', rtd_advance:'تسدد على أقساط شهرية', rtd_correction:'بصمة لم تسجل',
  rtd_data_change:'الجوال والعنوان والحساب البنكي', rtd_resignation:'مع فترة الإشعار',
  lt_annual:'سنوية', lt_sick:'مرضية', lt_marriage:'زواج (5 أيام)', lt_paternity:'مولود (3 أيام)', lt_bereavement:'وفاة الزوج أو أحد الوالدين أو الأبناء (5 أيام)',
  lt_bereavement_sibling:'وفاة أخ أو أخت (3 أيام)', lt_maternity:'وضع (12 أسبوعا)', lt_hajj:'حج (10 إلى 15 يوما)', lt_exam:'امتحان', lt_iddah:'عدة', lt_unpaid:'بدون راتب',
  ls_salary_certificate:'تعريف بالراتب', ls_employment_certificate:'تعريف بدون راتب', ls_experience:'شهادة خبرة',
  rqType:'نوع الإجازة', rqFrom:'من', rqTo:'إلى', rqEvent:'تاريخ الولادة', rqVariant:'مدة العدة', rqV_full:'أربعة أشهر وعشرة أيام (130 يوما)', rqV_short:'15 يوما',
  rqDoc:'رقم التقرير أو المستند', rqReason:'ملاحظة', rqSend:'إرسال الطلب', rqSent:'أرسل الطلب', rqChecking:'جار الحساب',
  rqCounts:'المدة المحتسبة:', rqInside:'عطلة رسمية داخل المدة لا تحتسب', rqAfter:'رصيدك بعد الطلب', rqSickSplit:'بأجر كامل', rqSick75:'بثلاثة أرباع الأجر', rqSickUnpaid:'بدون أجر',
  rqLetterType:'نوع الخطاب', rqAddressee:'موجه إلى', rqAddrHint:'مثل: بنك الراجحي، أو اتركه فارغا لعبارة لمن يهمه الأمر', rqLang:'لغة الخطاب', rqLangAr:'العربية', rqLangEn:'الإنجليزية',
  rqAmount:'المبلغ', rqMonths:'عدد الأقساط الشهرية', rqInstallment:'القسط الشهري', rqStart:'يبدأ الخصم من', rqCorrDate:'اليوم', rqCorrTime:'الوقت', rqCorrType:'نوع البصمة',
  rqIn:'حضور', rqOut:'انصراف', rqDataLead:'اكتب الجديد فقط في الحقول التي تريد تغييرها.', rqLastDay:'آخر يوم عمل', rqNotice:'فترة الإشعار',
  rs_pending:'قيد المراجعة', rs_approved:'معتمد', rs_rejected:'مرفوض', rs_cancelled:'ملغى', rstep_manager:'بانتظار المدير', rstep_hr:'بانتظار الموارد البشرية', rstep_payroll:'بانتظار الرواتب',
  rqCancel:'سحب الطلب', rqCancelled:'سحب الطلب', rqPrint:'طباعة الخطاب', rqHistory:'سير الطلب', rqBy:'بواسطة', rqApproved:'اعتمد', rqRejected:'رفض', rqCancelledBy:'ألغى',
  rw_sick_reduced_pay:'جزء من المدة بأجر مخفض حسب المادة 117.', rw_contract_suspended:'أكثر من 20 يوما بدون راتب يوقف العقد مؤقتا (المادة 116).',
  rw_deduction_over_10:'القسط أكثر من 10% من الأجر، ويحتاج موافقتك الكتابية (المادة 92).', rw_short_notice:'أقل من فترة الإشعار. الموافقة تعني قبول الشركة بتاريخ أقرب.',
  lvBalance:'رصيد الإجازة السنوية', lvAvailable:'متاح الآن', lvAccrued:'المكتسب', lvUsed:'المستخدم', lvPending:'قيد الاعتماد', lvPerYear:'في السنة', lvSick:'الإجازة المرضية',
  lvSickLine:'من 30 يوما بأجر كامل في سنتك المرضية', lvHolidays:'العطل الرسمية القادمة', lvOpening:'منها رصيد منقول', lvNoOpening:'لم يسجل رصيدك المنقول من النظام السابق بعد. الرصيد هنا من تاريخ بدء النظام فقط.',
  e_overlaps:'يوجد طلب آخر في نفس الأيام.', e_insufficient_balance:'الرصيد لا يكفي لهذه المدة.', e_leave_once:'هذه الإجازة تمنح مرة واحدة خلال الخدمة.',
  e_leave_not_eligible:'هذه الإجازة غير متاحة لك.', e_too_many_days:'المدة أطول من المسموح.', e_too_few_days:'المدة أقصر من المسموح.',
  e_document_required:'أضف رقم التقرير أو المستند.', e_outside_window:'تؤخذ خلال 7 أيام من الولادة.', e_no_working_days:'لا توجد أيام عمل في هذه المدة.',
  e_too_old:'لا يقبل طلب يبدأ قبل أكثر من 30 يوما.', e_sick_limit:'تجاوزت 120 يوما مرضيا في السنة.', e_advance_too_large:'السلفة أكبر من الحد المسموح.',
  e_deduction_over_half:'القسط أكبر من نصف الأجر (المادة 93). زد عدد الأقساط.', e_advance_pending:'لديك سلفة قيد المراجعة.', e_no_package:'لا يوجد راتب معتمد في ملفك.',
  e_already_resigned:'يوجد طلب استقالة مسبق.', e_note_required:'اكتب سبب الرفض.', e_cannot_decide_own:'لا يمكنك اعتماد طلبك.', e_future_time:'الوقت لم يأت بعد.',
  e_cannot_change_own_balance:'لا يمكنك تعديل رصيدك.'
});
Object.assign(T.en, {
  rqTitle:'My requests', rqNew:'New request', rqEmpty:'No requests yet. Start a new one.', rqChoose:'What would you like to request?',
  rt_leave:'Leave', rt_letter:'Letter', rt_advance:'Salary advance', rt_correction:'Attendance correction', rt_data_change:'Update my details', rt_resignation:'Resignation',
  rtd_leave:'Annual, sick and other leave', rtd_letter:'Salary or experience letter', rtd_advance:'Repaid in monthly instalments', rtd_correction:'A punch that did not record',
  rtd_data_change:'Mobile, address and bank account', rtd_resignation:'With the notice period',
  lt_annual:'Annual', lt_sick:'Sick', lt_marriage:'Marriage (5 days)', lt_paternity:'New baby (3 days)', lt_bereavement:'Death of spouse, parent or child (5 days)',
  lt_bereavement_sibling:'Death of a sibling (3 days)', lt_maternity:'Maternity (12 weeks)', lt_hajj:'Hajj (10 to 15 days)', lt_exam:'Exam', lt_iddah:'Iddah', lt_unpaid:'Unpaid',
  ls_salary_certificate:'Salary certificate', ls_employment_certificate:'Employment certificate', ls_experience:'Experience certificate',
  rqType:'Leave type', rqFrom:'From', rqTo:'To', rqEvent:'Date of birth', rqVariant:'Iddah length', rqV_full:'Four months and ten days (130 days)', rqV_short:'15 days',
  rqDoc:'Report or document number', rqReason:'Note', rqSend:'Send request', rqSent:'Request sent', rqChecking:'Checking',
  rqCounts:'Days counted:', rqInside:'public holiday inside, not counted', rqAfter:'Balance after this request', rqSickSplit:'full pay', rqSick75:'three-quarter pay', rqSickUnpaid:'unpaid',
  rqLetterType:'Letter type', rqAddressee:'Addressed to', rqAddrHint:'For example: Al Rajhi Bank, or leave empty for To whom it may concern', rqLang:'Letter language', rqLangAr:'Arabic', rqLangEn:'English',
  rqAmount:'Amount', rqMonths:'Monthly instalments', rqInstallment:'Monthly instalment', rqStart:'Deductions start', rqCorrDate:'Day', rqCorrTime:'Time', rqCorrType:'Punch',
  rqIn:'Check in', rqOut:'Check out', rqDataLead:'Fill in only the fields you want to change.', rqLastDay:'Last working day', rqNotice:'Notice period',
  rs_pending:'In review', rs_approved:'Approved', rs_rejected:'Rejected', rs_cancelled:'Withdrawn', rstep_manager:'With the manager', rstep_hr:'With HR', rstep_payroll:'With payroll',
  rqCancel:'Withdraw', rqCancelled:'Request withdrawn', rqPrint:'Print letter', rqHistory:'Progress', rqBy:'by', rqApproved:'Approved', rqRejected:'Rejected', rqCancelledBy:'Cancelled',
  rw_sick_reduced_pay:'Part of this is on reduced pay under Article 117.', rw_contract_suspended:'Over 20 unpaid days suspends the contract (Article 116).',
  rw_deduction_over_10:'The instalment is over 10% of your wage and needs your written consent (Article 92).', rw_short_notice:'Shorter than the notice period. Approval means the company accepts the earlier date.',
  lvBalance:'Annual leave balance', lvAvailable:'available now', lvAccrued:'Earned', lvUsed:'Used', lvPending:'Waiting approval', lvPerYear:'a year', lvSick:'Sick leave',
  lvSickLine:'of 30 full-pay days in your sick year', lvHolidays:'Coming public holidays', lvOpening:'carried over', lvNoOpening:'Your balance from the old system is not recorded yet. This counts only from the go-live date.',
  e_overlaps:'Another request covers these days.', e_insufficient_balance:'Your balance is not enough for this.', e_leave_once:'This leave is given once in service.',
  e_leave_not_eligible:'This leave is not available to you.', e_too_many_days:'Longer than allowed.', e_too_few_days:'Shorter than allowed.',
  e_document_required:'Add the report or document number.', e_outside_window:'Taken within 7 days of the birth.', e_no_working_days:'No working days in these dates.',
  e_too_old:'A request cannot start more than 30 days ago.', e_sick_limit:'Over 120 sick days in the year.', e_advance_too_large:'The advance is above the limit.',
  e_deduction_over_half:'The instalment is over half the wage (Article 93). Add more instalments.', e_advance_pending:'You have an advance in review.', e_no_package:'There is no approved salary on your file.',
  e_already_resigned:'A resignation is already on file.', e_note_required:'Write the reason for rejecting.', e_cannot_decide_own:'You cannot approve your own request.', e_future_time:'That time has not come yet.',
  e_cannot_change_own_balance:'You cannot change your own balance.'
});

var css = '' +
'.rq-types{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
'.rq-types button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:start;background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:14px;min-height:92px}' +
'.rq-types button i{font-size:24px;color:var(--brand)}' +
'.rq-types button b{font-weight:600;font-size:15px}' +
'.rq-types button small{color:var(--ink-2);font-size:12px;line-height:1.4}' +
'.rq-types button:hover{border-color:var(--brand)}' +
'.rq-quote{border-radius:var(--r-s);padding:12px 14px;background:#EEF3EC;color:#23452B;font-size:14px;line-height:1.6}' +
'.rq-quote.bad{background:#FBE9E4;color:#8E2F1C}' +
'.rq-quote.wait{background:#F1EFE8;color:var(--ink-2)}' +
'.rq-quote b{font-size:18px;font-weight:600}' +
'.rq-warn{display:block;margin-top:6px;color:#8A5A12}' +
'.rq-row{display:flex;gap:12px;align-items:flex-start;padding:12px 0;cursor:pointer}' +
'.rq-row + .rq-row{border-top:1px solid var(--line)}' +
'.rq-row .main{flex:1;min-width:0}' +
'.rq-row .main small{display:block;color:var(--ink-2);font-size:12.5px}' +
'.rq-row .ref{font-size:11.5px;color:var(--ink-2);direction:ltr;unicode-bidi:isolate}' +
'.rq-detail{margin:0 0 6px;padding:10px 12px;background:var(--paper);border-radius:var(--r-s);font-size:13.5px}' +
'.rq-tl{list-style:none;margin:8px 0 0;padding:0}' +
'.rq-tl li{position:relative;padding-inline-start:18px;margin:4px 0;color:var(--ink-2)}' +
'.rq-tl li::before{content:"";position:absolute;inset-inline-start:2px;top:8px;width:8px;height:8px;border-radius:50%;background:var(--brand)}' +
'.rq-tl li.no::before{background:var(--red)}' +
'.lv-big{display:flex;align-items:baseline;gap:8px;margin:2px 0 8px}' +
'.lv-big b{font-size:44px;font-weight:600;line-height:1;color:var(--pine)}' +
'.lv-big span{color:var(--ink-2)}' +
'.lv-bar{height:8px;border-radius:4px;background:#E7E3D8;overflow:hidden;display:flex;margin:6px 0 10px}' +
'.lv-bar i{display:block;height:100%}' +
'.lv-bar .u{background:var(--brand)}.lv-bar .p{background:var(--amber)}' +
'.lv-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--ink-2)}' +
'.lv-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-inline-end:5px;vertical-align:middle}' +
'.lv-hol{margin-top:10px;font-size:13px;color:var(--ink-2)}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var TYPES = [['leave', 'calendar-plus'], ['letter', 'envelope-simple'], ['advance', 'hand-coins'], ['correction', 'clock-counter-clockwise'], ['data_change', 'user-gear'], ['resignation', 'door-open']];
var DATA_KEYS = [['phone', 'phone', 'tel'], ['personalEmail', 'fPEmail', 'email'], ['nationalAddress', 'fNatAddr'], ['address', 'fAddr'], ['maritalStatus', 'fMarital', 'marital'],
  ['emergencyName', 'fEmName'], ['emergencyPhone', 'fEmPhone', 'tel'], ['iban', 'fIban', 'iban'], ['bankName', 'fBank'], ['passportNo', 'fPassport'], ['passportExpiry', 'fPassExp', 'date'], ['idExpiry', 'fIdExp', 'date']];
var DOC_LEAVES = { sick: 1, maternity: 1, exam: 1, iddah: 1 };

function fmtDate(d){ if (!d) return ''; return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + ' ' + t('mfSar'); }
function num1(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 1 }); }
function typeLabel(o){ return o.type === 'leave' ? t('rt_leave') + ' ' + t('lt_' + o.subtype) : o.type === 'letter' ? t('ls_' + o.subtype) : t('rt_' + o.type); }
function statusChip(o){
  if (o.status === 'pending') return '<span class="chip late">' + t('rstep_' + o.step) + '</span>';
  return '<span class="chip ' + ({ approved: 'in', rejected: 'absent', cancelled: 'off' }[o.status] || '') + '">' + t('rs_' + o.status) + '</span>';
}
function summary(o){
  if (o.type === 'leave') return fmtDate(o.fromDate) + (o.toDate && o.toDate !== o.fromDate ? ' - ' + fmtDate(o.toDate) : '') + (o.days != null ? '، ' + plural(o.days, 'days') : '');
  if (o.type === 'advance' && o.amount) return money(o.amount) + '، ' + t('rqInstallment') + ' ' + money(o.installment);
  if (o.type === 'correction' && o.correction) return fmtDate(o.correction.date) + '، ' + (o.correction.punchType === 'in' ? t('rqIn') : t('rqOut')) + ' ' + o.correction.time;
  if (o.type === 'resignation' && o.resignation) return t('rqLastDay') + ' ' + fmtDate(o.resignation.lastDay);
  if (o.type === 'letter' && o.letter) return o.letter.addressee;
  if (o.type === 'data_change') return Object.keys(o.fields || {}).concat(o.fieldNames || []).map(function(k){ var d = DATA_KEYS.filter(function(x){ return x[0] === k; })[0]; return d ? t(d[1]) : k; }).join('، ');
  return '';
}
function detail(o){
  var h = '<div class="rq-detail">';
  if (o.reason) h += '<div>' + esc(o.reason) + '</div>';
  if (o.docNo) h += '<div>' + t('rqDoc') + ': <bdi>' + esc(o.docNo) + '</bdi></div>';
  if (o.sick && (o.sick.full || o.sick.p75 || o.sick.unpaid)) h += '<div>' + [o.sick.full ? plural(o.sick.full, 'days') + ' ' + t('rqSickSplit') : '', o.sick.p75 ? plural(o.sick.p75, 'days') + ' ' + t('rqSick75') : '', o.sick.unpaid ? plural(o.sick.unpaid, 'days') + ' ' + t('rqSickUnpaid') : ''].filter(Boolean).join('، ') + '</div>';
  if (o.fields) h += '<div>' + Object.keys(o.fields).map(function(k){ var d = DATA_KEYS.filter(function(x){ return x[0] === k; })[0]; return (d ? t(d[1]) : k) + ': <bdi>' + esc(o.fields[k]) + '</bdi>'; }).join('<br>') + '</div>';
  (o.warnings || []).forEach(function(w){ h += '<span class="rq-warn">' + t('rw_' + w) + '</span>'; });
  if (o.history && o.history.length) h += '<ul class="rq-tl">' + o.history.map(function(x){
    var verb = x.decision === 'approve' ? t('rqApproved') : x.decision === 'reject' ? t('rqRejected') : t('rqCancelledBy');
    return '<li class="' + (x.decision === 'approve' ? '' : 'no') + '">' + verb + ' ' + esc(x.by) + '، ' + fmtDate(x.at) + (x.note ? ': ' + esc(x.note) : '') + '</li>';
  }).join('') + '</ul>';
  return h + '</div>';
}
function rowHtml(o, opts){
  opts = opts || {};
  return '<div class="rq-row" data-rq="' + o.id + '" tabindex="0"><div class="av">' + ph((TYPES.filter(function(x){ return x[0] === o.type; })[0] || [0, 'file'])[1]) + '</div><div class="main"><b>' +
    (opts.who && o.emp ? esc(o.emp.name) + '، ' : '') + typeLabel(o) + '</b><small>' + esc(summary(o)) + '</small><span class="ref">' + esc(o.ref || '') + '</span></div>' + statusChip(o) + '</div>' +
    '<div class="rq-more hidden" data-more="' + o.id + '">' + detail(o) + (opts.actions ? opts.actions(o) : '') + '</div>';
}

// ---------------- balance card ----------------
function balanceCard(sum, holidays){
  var a = sum.annual, total = Math.max(a.opening + a.accrued, 0.01);
  var u = Math.min(100, a.used / total * 100), p = Math.min(100 - u, a.pending / total * 100);
  return '<h3>' + ph('sun-horizon') + t('lvBalance') + '<span class="sp"></span><span class="chip num">' + plural(a.perYear, 'days') + ' ' + t('lvPerYear') + '</span></h3>' +
    '<div class="lv-big"><b class="num">' + num1(a.available) + '</b><span>' + t('lvAvailable') + '</span></div>' +
    '<div class="lv-bar"><i class="u" style="width:' + u + '%"></i><i class="p" style="width:' + p + '%"></i></div>' +
    '<div class="lv-legend"><span>' + t('lvAccrued') + ' <b class="num">' + num1(a.opening + a.accrued) + '</b>' + (a.opening ? ' (' + t('lvOpening') + ' ' + num1(a.opening) + ')' : '') + '</span>' +
    '<span><i style="background:var(--brand)"></i>' + t('lvUsed') + ' <b class="num">' + num1(a.used) + '</b></span>' +
    '<span><i style="background:var(--amber)"></i>' + t('lvPending') + ' <b class="num">' + num1(a.pending) + '</b></span></div>' +
    (a.openingMissing ? '<p class="rq-warn" style="margin-top:8px">' + t('lvNoOpening') + '</p>' : '') +
    '<p style="margin-top:10px;font-size:13px">' + t('lvSick') + ': <b class="num">' + sum.sick.used + '</b> ' + t('lvSickLine') + '</p>' +
    (holidays && holidays.length ? '<div class="lv-hol">' + t('lvHolidays') + ': ' + groupHolidays(holidays).map(function(h){ return esc(h.name) + ' (' + fmtDate(h.date) + ')'; }).join('، ') + '</div>' : '');
}
function groupHolidays(list){
  var out = [];
  list.forEach(function(h){ var last = out[out.length - 1]; if (last && last.name === h.name) return; out.push(h); });
  return out.slice(0, 4);
}

// ---------------- list card ----------------
function listCard(rows){
  return '<h3>' + ph('tray') + t('rqTitle') + '<span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="rqNew">' + ph('plus') + t('rqNew') + '</button></h3>' +
    (rows.length ? rows.slice(0, 12).map(function(o){ return rowHtml(o, { actions: myActions }); }).join('') : '<p>' + t('rqEmpty') + '</p>');
}
function myActions(o){
  var b = '';
  if (o.status === 'pending') b += '<button type="button" class="btn btn-line btn-sm" data-cancel="' + o.id + '">' + t('rqCancel') + '</button>';
  if (o.type === 'letter' && o.status === 'approved') b += '<button type="button" class="btn btn-dark btn-sm" data-print="' + o.id + '">' + ph('printer') + t('rqPrint') + '</button>';
  return b ? '<div class="btnrow" style="margin:0 0 10px">' + b + '</div>' : '';
}
/** Expand rows, cancel, print. file: the owner's file (for letters). */
function wireList(el, rows, file, reload){
  $$('[data-rq]', el).forEach(function(r){
    var toggle = function(){ var m = el.querySelector('[data-more="' + r.dataset.rq + '"]'); if (m) m.classList.toggle('hidden'); };
    r.onclick = toggle; r.onkeydown = function(e){ if (e.key === 'Enter') toggle(); };
  });
  $$('[data-cancel]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('requestCancel', { id: b.dataset.cancel }).then(function(r){ if (!r.ok) { b.disabled = false; return toast(errText(r.error)); } toast(t('rqCancelled')); reload(); }); }; });
  $$('[data-print]', el).forEach(function(b){ b.onclick = function(){ printLetter(rows.filter(function(x){ return x.id === b.dataset.print; })[0], file); }; });
}

// ---------------- the new-request drawer ----------------
function newRequest(file, done){
  var gender = file && file.job ? file.job.gender : '';
  var d = drawer('<h3>' + t('rqNew') + '</h3><div id="rqBody"></div>');
  var body = $('#rqBody', d);
  body.innerHTML = '<p style="margin:0 0 12px;color:var(--ink-2)">' + t('rqChoose') + '</p><div class="rq-types">' + TYPES.map(function(x){
    return '<button type="button" data-type="' + x[0] + '">' + ph(x[1]) + '<b>' + t('rt_' + x[0]) + '</b><small>' + t('rtd_' + x[0]) + '</small></button>';
  }).join('') + '</div>';
  $$('[data-type]', body).forEach(function(b){ b.onclick = function(){ form(b.dataset.type); }; });

  function form(type){
    var h = '<form class="form" id="rqf"><h4 class="hr-sub" style="margin:0">' + ph((TYPES.filter(function(x){ return x[0] === type; })[0])[1]) + ' ' + t('rt_' + type) + '</h4>';
    var today = riyadhToday();
    if (type === 'leave') {
      var kinds = ['annual', 'sick', 'marriage', 'paternity', 'bereavement', 'bereavement_sibling', 'maternity', 'hajj', 'exam', 'iddah', 'unpaid']
        .filter(function(k){ return !(gender === 'male' && (k === 'maternity' || k === 'iddah')) && !(gender === 'female' && k === 'paternity'); });
      h += '<div class="field"><label>' + t('rqType') + '</label><select name="subtype">' + kinds.map(function(k){ return '<option value="' + k + '">' + t('lt_' + k) + '</option>'; }).join('') + '</select></div>' +
        '<div class="two"><div class="field"><label>' + t('rqFrom') + '</label><input type="date" name="fromDate" value="' + today + '" required></div><div class="field"><label>' + t('rqTo') + '</label><input type="date" name="toDate" value="' + today + '" required></div></div>' +
        '<div class="field hidden" data-for="paternity"><label>' + t('rqEvent') + '</label><input type="date" name="eventDate"></div>' +
        '<div class="field hidden" data-for="iddah"><label>' + t('rqVariant') + '</label><select name="variant"><option value="full">' + t('rqV_full') + '</option><option value="short">' + t('rqV_short') + '</option></select></div>' +
        '<div class="field hidden" data-for="doc"><label>' + t('rqDoc') + '</label><input name="docNo" dir="ltr" maxlength="60"></div>';
    } else if (type === 'letter') {
      h += '<div class="field"><label>' + t('rqLetterType') + '</label><select name="subtype">' + ['salary_certificate', 'employment_certificate', 'experience'].map(function(k){ return '<option value="' + k + '">' + t('ls_' + k) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('rqAddressee') + '</label><input name="addressee" maxlength="120"><div class="hr-hint">' + t('rqAddrHint') + '</div></div>' +
        '<div class="field"><label>' + t('rqLang') + '</label><select name="lang"><option value="ar">' + t('rqLangAr') + '</option><option value="en">' + t('rqLangEn') + '</option></select></div>';
    } else if (type === 'advance') {
      h += '<div class="two"><div class="field"><label>' + t('rqAmount') + '</label><input type="number" name="amount" min="1" step="1" inputmode="numeric" required></div>' +
        '<div class="field"><label>' + t('rqMonths') + '</label><input type="number" name="months" min="1" max="12" value="3" inputmode="numeric" required></div></div>';
    } else if (type === 'correction') {
      h += '<div class="two"><div class="field"><label>' + t('rqCorrDate') + '</label><input type="date" name="date" value="' + today + '" max="' + today + '" required></div>' +
        '<div class="field"><label>' + t('rqCorrTime') + '</label><input type="time" name="time" value="08:00" required></div></div>' +
        '<div class="field"><label>' + t('rqCorrType') + '</label><select name="punchType"><option value="in">' + t('rqIn') + '</option><option value="out">' + t('rqOut') + '</option></select></div>';
    } else if (type === 'data_change') {
      var p = (file && file.priv) || {}, e = (file && file.emp) || {};
      h += '<p class="hr-hint" style="margin:0">' + t('rqDataLead') + '</p>' + DATA_KEYS.map(function(k){
        var cur = k[0] === 'phone' ? e.phone : p[k[0]];
        if (k[2] === 'marital') return '<div class="field"><label>' + t(k[1]) + '</label><select name="f_' + k[0] + '"><option value="">' + t('fNoneOpt') + '</option>' + ['single', 'married', 'other'].map(function(m){ return '<option value="' + m + '">' + t('ms_' + m) + '</option>'; }).join('') + '</select></div>';
        return '<div class="field"><label>' + t(k[1]) + '</label><input name="f_' + k[0] + '"' + (k[2] === 'date' ? ' type="date"' : k[2] === 'email' ? ' type="email" dir="ltr"' : k[2] === 'tel' ? ' inputmode="tel" dir="ltr"' : k[2] === 'iban' ? ' dir="ltr" maxlength="34"' : '') + ' placeholder="' + esc(cur || '') + '"></div>';
      }).join('');
    } else if (type === 'resignation') {
      var notice = (file && file.job && file.job.noticeDays) || 30, min = new Date(Date.parse(today + 'T00:00:00Z') + notice * 86400000).toISOString().slice(0, 10);
      h += '<div class="field"><label>' + t('rqLastDay') + '</label><input type="date" name="lastDay" value="' + min + '" min="' + today + '" required><div class="hr-hint">' + t('rqNotice') + ': ' + plural(notice, 'days') + '</div></div>';
    }
    h += '<div class="field"><label>' + t('rqReason') + '</label><textarea name="reason" maxlength="500"></textarea></div>' +
      '<div class="rq-quote wait" id="rqQuote" aria-live="polite">' + t('rqChecking') + '</div>' +
      '<div class="btnrow"><button class="btn btn-dark" id="rqSend" disabled>' + t('rqSend') + '</button><button type="button" class="btn btn-line" id="rqBack">' + t('cancel') + '</button></div></form>';
    body.innerHTML = h;
    var f = $('#rqf', body), timer = null, seq = 0, lastOk = false;
    $('#rqBack', body).onclick = function(){ d.remove(); };
    function build(){
      var v = {}; Array.prototype.forEach.call(f.elements, function(x){ if (x.name) v[x.name] = x.value.trim(); });
      var rq = { type: type, reason: v.reason, payload: {} };
      if (type === 'leave') { rq.subtype = v.subtype; rq.fromDate = v.fromDate; rq.toDate = v.toDate; rq.docNo = v.docNo; if (v.eventDate) rq.payload.eventDate = v.eventDate; if (v.subtype === 'iddah') rq.payload.variant = v.variant; }
      if (type === 'letter') { rq.subtype = v.subtype; rq.payload = { addressee: v.addressee, lang: v.lang }; }
      if (type === 'advance') { rq.amount = v.amount; rq.months = v.months; }
      if (type === 'correction') rq.payload = { date: v.date, time: v.time, punchType: v.punchType };
      if (type === 'data_change') { rq.payload.fields = {}; DATA_KEYS.forEach(function(k){ if (v['f_' + k[0]]) rq.payload.fields[k[0]] = v['f_' + k[0]]; }); }
      if (type === 'resignation') rq.payload = { lastDay: v.lastDay };
      return rq;
    }
    function showFor(){
      if (type !== 'leave') return;
      var sub = f.elements.subtype.value;
      $$('[data-for]', f).forEach(function(x){ var k = x.dataset.for; x.classList.toggle('hidden', !(k === sub || (k === 'doc' && DOC_LEAVES[sub]))); });
    }
    function check(){
      clearTimeout(timer);
      var box = $('#rqQuote', body); box.className = 'rq-quote wait'; box.textContent = t('rqChecking'); $('#rqSend', body).disabled = true;
      timer = setTimeout(function(){
        var my = ++seq;
        api('requestQuote', { request: build() }, true).then(function(r){
          if (my !== seq || !box.isConnected) return;
          var q = r.ok ? r.quote : { error: r.error };
          lastOk = !q.error;
          box.className = 'rq-quote' + (q.error ? ' bad' : '');
          box.innerHTML = quoteHtml(q, type);
          $('#rqSend', body).disabled = !lastOk;
        });
      }, 350);
    }
    f.oninput = check; f.onchange = function(){ showFor(); check(); };
    showFor(); check();
    f.onsubmit = function(ev){
      ev.preventDefault();
      if (!lastOk) return;
      var btn = $('#rqSend', body); btn.disabled = true;
      api('requestCreate', { request: build() }).then(function(r){
        if (!r.ok) { btn.disabled = false; var box = $('#rqQuote', body); box.className = 'rq-quote bad'; box.textContent = errText(r.error); return; }
        d.remove(); toast(t('rqSent') + ' ' + r.request.ref); if (done) done(r.request);
      });
    };
  }
}
function quoteHtml(q, type){
  if (q.error) return esc(errText(q.error));
  var h = '';
  if (type === 'leave') {
    h += t('rqCounts') + ' <b class="num">' + plural(q.days, 'days') + '</b>';
    if (q.holidays && q.holidays.length) h += '<br>' + plural(q.holidays.length, 'days') + ' ' + t('rqInside');
    if (q.balanceAfter != null) h += '<br>' + t('rqAfter') + ': <b class="num">' + num1(q.balanceAfter) + '</b>';
    if (q.sick) h += '<br>' + [q.sick.full ? plural(q.sick.full, 'days') + ' ' + t('rqSickSplit') : '', q.sick.p75 ? plural(q.sick.p75, 'days') + ' ' + t('rqSick75') : '', q.sick.unpaid ? plural(q.sick.unpaid, 'days') + ' ' + t('rqSickUnpaid') : ''].filter(Boolean).join('، ');
  } else if (type === 'advance') {
    h += t('rqInstallment') + ': <b class="num">' + money(q.installment) + '</b><br>' + t('rqStart') + ' ' + esc(q.payload && q.payload.startMonth || '');
  } else if (type === 'resignation') {
    h += t('rqLastDay') + ': <b>' + fmtDate(q.toDate) + '</b>';
  } else h += ph('check-circle') + ' ' + t('rqSend');
  (q.warnings || []).forEach(function(w){ h += '<span class="rq-warn">' + t('rw_' + w) + '</span>'; });
  return h;
}

// ---------------- printable letters ----------------
function printLetter(o, file){
  if (!o || !file) return;
  var e = file.emp, j = file.job, p = file.priv || {}, c = file.comp, en = o.letter && o.letter.lang === 'en';
  var fem = j.gender === 'female', name = en ? (p.nameEnOfficial || e.nameEn || e.name) : e.name;
  var pos = j.position ? (en ? j.position.titleEn || j.position.titleAr : j.position.titleAr) : (e.title || '');
  var to = (o.letter && o.letter.addressee) || (en ? 'To whom it may concern' : 'لمن يهمه الأمر');
  var d = function(x){ return x ? new Date(String(x).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(en ? 'en-GB' : 'ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; };
  var m = function(n){ return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var nat = j.nationality || '', idno = p.nationalId || '';
  var body;
  if (en) {
    var pr = fem ? 'Ms.' : 'Mr.', he = fem ? 'she' : 'he', his = fem ? 'her' : 'his';
    body = '<p>This is to certify that ' + pr + ' <b>' + esc(name) + '</b>' + (nat ? ', ' + esc(nat) + ' national' : '') + (idno ? ', ID No. ' + esc(idno) : '') + ', ' +
      (o.subtype === 'experience' ? 'worked with Best Gas Carrier Co. as ' + esc(pos) + ' from ' + d(j.hireDate) + (e.status !== 'active' || file.emp.lastWorkingDay ? ' to ' + d(file.emp.lastWorkingDay) : ' to date') + '.' :
        'has been employed by Best Gas Carrier Co. as ' + esc(pos) + ' since ' + d(j.hireDate) + '.') + '</p>' +
      (o.subtype === 'salary_certificate' && c ? '<p>' + (fem ? 'Her' : 'His') + ' monthly salary is SAR <b>' + m(c.total) + '</b>: basic ' + m(c.basic) + ', housing ' + m(c.housing) + ', transport ' + m(c.transport) +
        Object.keys(c.other || {}).map(function(k){ return ', ' + esc(k) + ' ' + m(c.other[k]); }).join('') + '.</p>' : '') +
      '<p>This letter is issued at ' + his + ' request for submission to ' + esc(to) + ', without any liability on the company.</p>';
  } else {
    var s = fem ? { t: 'السيدة', w: 'تعمل', had: 'عملت', g: 'وتتقاضى', r: 'طلبها', n: 'الجنسية' } : { t: 'السيد', w: 'يعمل', had: 'عمل', g: 'ويتقاضى', r: 'طلبه', n: 'الجنسية' };
    body = '<p>تشهد شركة الناقل الأفضل للغاز بأن ' + s.t + ' / <b>' + esc(name) + '</b>' + (nat ? '، ' + s.n + ' ' + esc(nat) : '') + (idno ? '، رقم الهوية ' + esc(idno) : '') + '، ' +
      (o.subtype === 'experience' ? s.had + ' لديها بوظيفة ' + esc(pos) + ' من ' + d(j.hireDate) + (file.emp.lastWorkingDay ? ' إلى ' + d(file.emp.lastWorkingDay) : ' حتى تاريخه') + '.' :
        s.w + ' لديها بوظيفة ' + esc(pos) + ' منذ ' + d(j.hireDate) + (o.subtype === 'salary_certificate' && c ? '، ' + s.g + ' راتبا شهريا إجماليا قدره <b>' + m(c.total) + '</b> ريال، منه الأساسي ' + m(c.basic) + ' والسكن ' + m(c.housing) + ' والنقل ' + m(c.transport) +
          Object.keys(c.other || {}).map(function(k){ return ' و' + esc(k) + ' ' + m(c.other[k]); }).join('') : '') + '.') + '</p>' +
      '<p>وقد أعطيت هذه الشهادة بناء على ' + s.r + ' لتقديمها إلى ' + esc(to) + '، دون أدنى مسؤولية على الشركة.</p>';
  }
  var title = en ? { salary_certificate: 'Salary Certificate', employment_certificate: 'Employment Certificate', experience: 'Experience Certificate' }[o.subtype]
    : { salary_certificate: 'شهادة تعريف بالراتب', employment_certificate: 'شهادة تعريف', experience: 'شهادة خبرة' }[o.subtype];
  var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc(o.ref) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4;margin:22mm 20mm}body{font-family:"Readex Pro",Tahoma,sans-serif;color:#17221A;font-size:15px;line-height:2}' +
    'header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #4D6D51;padding-bottom:12px;margin-bottom:26px}header img{height:64px}' +
    'header div{text-align:end;font-size:12px;color:#4A5A4D;line-height:1.6}h1{text-align:center;font-size:21px;margin:10px 0 26px;color:#1C2A1F}' +
    '.meta{display:flex;justify-content:space-between;font-size:13px;color:#4A5A4D;margin-bottom:18px}.sign{margin-top:60px}.sign b{display:block}' +
    'footer{position:fixed;bottom:0;inset-inline:0;font-size:11px;color:#8A948B;text-align:center;border-top:1px solid #DAD5C8;padding-top:6px}</style></head><body>' +
    '<header><img src="' + LOGO + '" alt=""><div>' + (en ? 'Best Gas Carrier Co.<br>Human Resources' : 'شركة الناقل الأفضل للغاز<br>إدارة الموارد البشرية') + '</div></header>' +
    '<div class="meta"><span>' + (en ? 'Ref: ' : 'الرقم: ') + '<bdi>' + esc(o.ref) + '</bdi></span><span>' + (en ? 'Date: ' : 'التاريخ: ') + d(o.decidedAt || o.createdAt) + '</span></div>' +
    '<h1>' + title + '</h1><p>' + (en ? 'To: ' : 'إلى: ') + esc(to) + '</p>' + body +
    '<div class="sign"><b>' + (en ? 'Human Resources Department' : 'إدارة الموارد البشرية') + '</b>' + (en ? 'Best Gas Carrier Co.' : 'شركة الناقل الأفضل للغاز') + '</div>' +
    '<footer>' + (en ? 'Verify this letter with HR quoting reference ' : 'للتحقق من هذه الشهادة تواصل مع الموارد البشرية بذكر الرقم ') + '<bdi>' + esc(o.ref) + '</bdi></footer>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
  var w = window.open('', '_blank');
  if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(html); w.document.close();
}

window.Req = { balanceCard: balanceCard, listCard: listCard, wireList: wireList, newRequest: newRequest, rowHtml: rowHtml, detail: detail,
  typeLabel: typeLabel, statusChip: statusChip, summary: summary, printLetter: printLetter, fmtDate: fmtDate };
})();
