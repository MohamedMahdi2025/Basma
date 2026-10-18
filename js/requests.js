// Requests (Phase 2): the form with a live check, the list, and printable letters.
// Shared by "ملفي" and the HR console. Every rule is re-checked by the server (requestQuote / requestCreate).
(function(){
'use strict';

Object.assign(T.ar, {
  rqTitle:'طلباتي', rqNew:'طلب جديد', rqEmpty:'لا توجد طلبات بعد. ابدأ بطلب جديد.', rqChoose:'ما نوع الطلب؟',
  rt_leave:'إجازة', rt_letter:'خطاب', rt_advance:'سلفة على الراتب', rt_correction:'تصحيح حضور', rt_data_change:'تحديث بياناتي', rt_resignation:'استقالة',
  rt_exit_reentry:'تأشيرة خروج وعودة', rqVisaSingle:'مفردة', rqVisaMultiple:'متعددة', rqVisaDays:'مدة التأشيرة',
  rtd_exit_reentry:'لغير السعوديين: للسفر والعودة', rqVisaType:'نوع التأشيرة', rqTravelFrom:'تاريخ السفر', rqTravelTo:'تاريخ العودة', rqDeps:'المرافقون', rqLeaveRef:'رقم طلب الإجازة المرتبط (اختياري)', rqPurpose:'الغرض', rqTrip:'مدة الرحلة',
  rstep_executive:'بانتظار الرئيس التنفيذي', rstep_dept_head:'بانتظار رئيس الإدارة', rstep_person:'بانتظار',
  rw_iqama_expires_before_return:'تنتهي الإقامة قبل تاريخ العودة؛ جدّدها قبل إصدار التأشيرة.', rw_visa_shorter_than_trip:'مدة التأشيرة أقصر من مدة السفر.',
  rw_leave_outside_trip:'تواريخ الإجازة المرتبطة لا تقع داخل فترة السفر.',
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
  rt_exit_reentry:'Exit/re-entry visa', rqVisaSingle:'single', rqVisaMultiple:'multiple', rqVisaDays:'Visa length',
  rtd_exit_reentry:'For non-Saudis: to travel and come back', rqVisaType:'Visa type', rqTravelFrom:'Travel date', rqTravelTo:'Return date', rqDeps:'Dependants', rqLeaveRef:'Linked leave request number (optional)', rqPurpose:'Purpose', rqTrip:'Trip length',
  rstep_executive:'With the CEO', rstep_dept_head:'With the department head', rstep_person:'With',
  rw_iqama_expires_before_return:'The iqama expires before the return date; renew it before the visa is issued.', rw_visa_shorter_than_trip:'The visa is shorter than the trip.',
  rw_leave_outside_trip:'The linked leave dates fall outside the travel dates.',
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

var TYPES = [['leave', 'calendar-plus'], ['letter', 'envelope-simple'], ['advance', 'hand-coins'], ['correction', 'clock-counter-clockwise'], ['data_change', 'user-gear'], ['resignation', 'door-open'], ['exit_reentry', 'airplane-takeoff']];
var DATA_KEYS = [['phone', 'phone', 'tel'], ['personalEmail', 'fPEmail', 'email'], ['nationalAddress', 'fNatAddr'], ['address', 'fAddr'], ['maritalStatus', 'fMarital', 'marital'],
  ['emergencyName', 'fEmName'], ['emergencyPhone', 'fEmPhone', 'tel'], ['iban', 'fIban', 'iban'], ['bankName', 'fBank'], ['passportNo', 'fPassport'], ['passportExpiry', 'fPassExp', 'date'], ['idExpiry', 'fIdExp', 'date']];
var DOC_LEAVES = { sick: 1, maternity: 1, exam: 1, iddah: 1 };

function fmtDate(d){ if (!d) return ''; return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + ' ' + t('mfSar'); }
function num1(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 1 }); }
function typeLabel(o){ return o.type === 'leave' ? t('rt_leave') + ' ' + t('lt_' + o.subtype) : o.type === 'letter' ? t('ls_' + o.subtype) : t('rt_' + o.type); }
function statusChip(o){
  if (o.status === 'pending') return '<span class="chip late">' + (String(o.step).indexOf('person:') === 0 ? t('rstep_person') + ' ' + esc(o.stepWho || '') : t('rstep_' + o.step)) + '</span>';
  return '<span class="chip ' + ({ approved: 'in', rejected: 'absent', cancelled: 'off' }[o.status] || '') + '">' + t('rs_' + o.status) + '</span>';
}
function summary(o){
  if (o.type === 'leave') return fmtDate(o.fromDate) + (o.toDate && o.toDate !== o.fromDate ? ' - ' + fmtDate(o.toDate) : '') + (o.days != null ? '، ' + plural(o.days, 'days') : '');
  if (o.type === 'advance' && o.amount) return money(o.amount) + '، ' + t('rqInstallment') + ' ' + money(o.installment);
  if (o.type === 'correction' && o.correction) return fmtDate(o.correction.date) + '، ' + (o.correction.punchType === 'in' ? t('rqIn') : t('rqOut')) + ' ' + o.correction.time;
  if (o.type === 'resignation' && o.resignation) return t('rqLastDay') + ' ' + fmtDate(o.resignation.lastDay);
  if (o.type === 'letter' && o.letter) return o.letter.addressee;
  if (o.type === 'exit_reentry' && o.visa) return fmtDate(o.fromDate) + ' - ' + fmtDate(o.toDate) + '، ' + t(o.visa.visaType === 'multiple' ? 'rqVisaMultiple' : 'rqVisaSingle') + '، ' + t('rqVisaDays') + ' ' + plural(o.visa.durationDays, 'days');
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
  remember(rows);
  $$('[data-rq]', el).forEach(function(r){
    // a request opens on its own page (#requests/view/<id>); the row stays the quick summary
    var open = function(){ goArea('requests', 'view', r.dataset.rq); };
    r.setAttribute('role', 'link'); r.onclick = open; r.onkeydown = function(e){ if (e.key === 'Enter') open(); };
  });
  $$('[data-cancel]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('requestCancel', { id: b.dataset.cancel }).then(function(r){ if (!r.ok) { b.disabled = false; return toast(errText(r.error)); } toast(t('rqCancelled')); reload(); }); }; });
  $$('[data-print]', el).forEach(function(b){ b.onclick = function(){ printLetter(rows.filter(function(x){ return x.id === b.dataset.print; })[0], file); }; });
}

/// ---------------- a new request opens as a full page (2026-10-14; the drawer it replaced is gone) ----------------
/** Kept for callers (my file, home, government services): opens #requests/new[/type]. file and done are no longer needed. */
function newRequest(file, done, preType){
  if (window.goArea) goArea('requests', 'new', preType && TYPES.some(function(x){ return x[0] === preType; }) ? preType : '');
}


// ---------------- printable letters ----------------
/** win: a window opened inside the click (iPhone Safari blocks window.open after an await); written into once the file arrives. */
function printLetter(o, file, win){
  if (!o || !file) { if (win) try { win.close(); } catch (e) {} return; }
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
      (o.subtype === 'experience' ? 'worked with ' + esc(coName('en')) + ' as ' + esc(pos) + ' from ' + d(j.hireDate) + (e.status !== 'active' || file.emp.lastWorkingDay ? ' to ' + d(file.emp.lastWorkingDay) : ' to date') + '.' :
        'has been employed by ' + esc(coName('en')) + ' as ' + esc(pos) + ' since ' + d(j.hireDate) + '.') + '</p>' +
      (o.subtype === 'salary_certificate' && c ? '<p>' + (fem ? 'Her' : 'His') + ' monthly salary is SAR <b>' + m(c.total) + '</b>: basic ' + m(c.basic) + ', housing ' + m(c.housing) + ', transport ' + m(c.transport) +
        Object.keys(c.other || {}).map(function(k){ return ', ' + esc(k) + ' ' + m(c.other[k]); }).join('') + '.</p>' : '') +
      '<p>This letter is issued at ' + his + ' request for submission to ' + esc(to) + ', without any liability on the company.</p>';
  } else {
    var s = fem ? { t: 'السيدة', w: 'تعمل', had: 'عملت', g: 'وتتقاضى', r: 'طلبها', n: 'الجنسية' } : { t: 'السيد', w: 'يعمل', had: 'عمل', g: 'ويتقاضى', r: 'طلبه', n: 'الجنسية' };
    body = '<p>تشهد ' + esc(coName('ar')) + ' بأن ' + s.t + ' / <b>' + esc(name) + '</b>' + (nat ? '، ' + s.n + ' ' + esc(nat) : '') + (idno ? '، رقم الهوية ' + esc(idno) : '') + '، ' +
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
    '<header><img src="' + logoInk() + '" alt=""><div>' + esc(coName(en ? 'en' : 'ar')) + '<br>' + (en ? 'Human Resources' : 'إدارة الموارد البشرية') + (coMeta(en ? 'en' : 'ar') ? '<br>' + coMeta(en ? 'en' : 'ar') : '') + '</div></header>' +
    '<div class="meta"><span>' + (en ? 'Ref: ' : 'الرقم: ') + '<bdi>' + esc(o.ref) + '</bdi></span><span>' + (en ? 'Date: ' : 'التاريخ: ') + d(o.decidedAt || o.createdAt) + '</span></div>' +
    '<h1>' + title + '</h1><p>' + (en ? 'To: ' : 'إلى: ') + esc(to) + '</p>' + body +
    '<div class="sign"><b>' + (en ? 'Human Resources Department' : 'إدارة الموارد البشرية') + '</b>' + esc(coName(en ? 'en' : 'ar')) + '</div>' +
    '<footer>' + (en ? 'Verify this letter with HR quoting reference ' : 'للتحقق من هذه الشهادة تواصل مع الموارد البشرية بذكر الرقم ') + '<bdi>' + esc(o.ref) + '</bdi></footer>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
  var w = win || window.open('', '_blank');
  if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(html); w.document.close();
}

/** Print a letter whose file must still be fetched: the window opens now, inside the tap, and is filled when the file arrives. */
function printFetched(o, fetchFile){
  if (!o) return;
  var w = window.open('', '_blank');
  if (w) try { w.document.write('<p style="font-family:sans-serif;padding:24px">' + esc(t('rqChecking')) + '</p>'); } catch (e) {}
  fetchFile().then(function(f){ if (f && f.ok) printLetter(o, f.file, w); else { if (w) try { w.close(); } catch (e) {} toast(errText(f && f.error)); } });
}

// ---------------- full pages (2026-10-14): a new request and a request's own page ----------------
// Routed by the shell: #requests/new (choose a type), #requests/new/<type> (the form), #requests/view/<id> (one request).
// Everything the requester needs is on the page and fetched on open: who is asking, live balance and the server's own
// quote (requestQuote: days, holidays skipped, sick tiers, pay effect), the approval path with names, recent requests of
// the type, the rules that apply and a summary before sending. The server re-checks everything on requestCreate.
Object.assign(T.ar, {
  rqPageLead:'اختر نوع الطلب. صفحة الطلب تعرض رصيدك والحساب المباشر ومسار الاعتماد قبل الإرسال.', rqWho:'مقدم الطلب', rqDetails:'تفاصيل الطلب', rqNoteAtt:'ملاحظة ومستندات',
  rqSummary:'الملخص', rqPath:'مسار الاعتماد', rqPathNote:'المسار المعتاد لهذا النوع. يثبت المسار النهائي لحظة الإرسال ويظهر في صفحة الطلب.', rqGuide:'قبل أن ترسل',
  rqRecent:'آخر طلباتك من هذا النوع', rqNoRecent:'لم ترسل طلبا من هذا النوع بعد.',
  rqAttach:'رفع الملفات غير متاح بعد. اكتب رقم المستند (مثل رقم تقرير صحتي) في حقله، واحتفظ بالأصل لتسليمه عند الطلب.',
  rqStepSubmit:'ترسل الطلب', rqStep_manager:'المدير المباشر', rqStep_hr:'الموارد البشرية', rqStep_payroll:'الرواتب', rqStep_executive:'الرئيس التنفيذي', rqStep_dept_head:'رئيس الإدارة', rqStep_person:'معتمد محدد',
  rqStepEnd:'يعتمد الطلب نهائيا', rqNoManager:'لا يوجد مدير نشط في ملفك، فتبدأ الخطوة عند الموارد البشرية.', rqYou:'أنت',
  rqEmpNo:'الرقم الوظيفي', rqPosition:'الوظيفة', rqDept:'الإدارة', rqManager:'المدير المباشر', rqHire:'تاريخ التعيين',
  rqBalBefore:'الرصيد قبل الطلب', rqBalAfter:'الرصيد بعد الطلب', rqCal:'المدة التقويمية', rqWork:'محتسبة', rqHolSkipped:'عطل رسمية لا تحتسب', rqPayEffect:'الأثر على الراتب',
  rqPayNone:'لا أثر على الراتب', rqPayUnpaid:'تخصم هذه الأيام من الراتب', rqPayAdvance:'يخصم القسط من الراتب كل شهر', rqThisReq:'هذا الطلب', rqLeft:'يبقى',
  rqSchedule:'جدول الخصم', rqFixFirst:'أكمل الحقول ليظهر الحساب.', rqReady:'جاهز للإرسال', rqSentTitle:'أرسل طلبك', rqSentLead:'تابع خطواته هنا. يصل الطلب الآن إلى',
  rqDecideTitle:'قرارك', rqApprove:'اعتماد', rqReject:'رفض', rqNoteFor:'ملاحظة (مطلوبة عند الرفض)', rqNotFound:'لم نجد هذا الطلب، أو لا تملك صلاحية عرضه.',
  rqAllMine:'كل طلباتي', rqCreated:'تاريخ الطلب', rqStatus:'الحالة', rqWithdrawSure:'اضغط مرة أخرى للتأكيد', rqAcceptBy:'تعد مقبولة إن لم يرد عليها حتى', rqDeemed:'مضت 30 يوما دون رد، فتعد الاستقالة مقبولة.',
  rqOnBehalf:'نيابة عن', rqDays:'المدة', rqDates:'التواريخ', rqTimeline:'سير الطلب', rqNow:'الآن', rqLater:'لاحقا', rqDecided:'تم القرار', rqChanges:'التغييرات المطلوبة',
  rqCurrent:'الحالي', rqNew2:'الجديد', rqVisa:'التأشيرة', rqMinLast:'أقرب آخر يوم حسب الإشعار', rqPayslipMonth:'أول خصم',
  rh_annual:'الإجازة السنوية 21 يوما في السنة، و30 يوما بعد 5 سنوات خدمة (المادة 109). الطلبات قيد الاعتماد تحجز من رصيدك.',
  rh_sick:'الإجازة المرضية: 30 يوما بأجر كامل، ثم 60 بثلاثة أرباع الأجر، ثم 30 بدون أجر في السنة (المادة 117). أضف رقم تقرير صحتي.',
  rh_unpaid:'الإجازة بدون راتب تخصم أيامها، وأكثر من 20 يوما يوقف العقد مؤقتا (المادة 116).',
  rh_leave:'لا تحتسب العطل الرسمية وأيام الراحة. لا يقبل طلب يبدأ قبل أكثر من 30 يوما.',
  rh_letter:'تعد الموارد البشرية الخطاب وتعتمده، ثم تطبعه من صفحة الطلب. اترك الجهة فارغة لعبارة لمن يهمه الأمر.',
  rh_advance:'لا يزيد القسط على نصف الأجر (المادة 93)، وما زاد على 10% يحتاج موافقتك الكتابية (المادة 92). المدير المباشر ليس في مسار السلفة.',
  rh_correction:'لبصمة لم تسجل في يومها. يراجعها مديرك ثم الموارد البشرية. خلال 30 يوما فقط.',
  rh_data_change:'تراجع الموارد البشرية التغيير قبل اعتماده. تغيير الحساب البنكي يسري بعد الاعتماد.',
  rh_resignation:'فترة الإشعار 30 يوما على الأقل أو حسب عقدك إن كانت أطول (المادة 75). الاستقالة التي لا يرد عليها خلال 30 يوما تعد مقبولة.',
  rh_exit_reentry:'لغير السعوديين. يجب أن تكون الإقامة سارية بعد تاريخ العودة.'
});
Object.assign(T.en, {
  rqPageLead:'Choose what you need. The request page shows your balance, the live check and the approval path before you send.', rqWho:'Requested by', rqDetails:'Request details', rqNoteAtt:'Note and documents',
  rqSummary:'Summary', rqPath:'Approval path', rqPathNote:'The usual path for this type. The final path is fixed when you send and shows on the request page.', rqGuide:'Before you send',
  rqRecent:'Your recent requests of this type', rqNoRecent:'You have not sent this type yet.',
  rqAttach:'File upload is not available yet. Type the document number (such as the Seha report number) in its field and keep the original to hand in if asked.',
  rqStepSubmit:'You send it', rqStep_manager:'Line manager', rqStep_hr:'Human resources', rqStep_payroll:'Payroll', rqStep_executive:'Chief executive', rqStep_dept_head:'Department head', rqStep_person:'Named approver',
  rqStepEnd:'Final approval', rqNoManager:'No active manager on your file, so it starts with HR.', rqYou:'You',
  rqEmpNo:'Employee no.', rqPosition:'Position', rqDept:'Department', rqManager:'Line manager', rqHire:'Hire date',
  rqBalBefore:'Balance before', rqBalAfter:'Balance after', rqCal:'Calendar length', rqWork:'counted', rqHolSkipped:'Public holidays not counted', rqPayEffect:'Pay effect',
  rqPayNone:'No effect on pay', rqPayUnpaid:'These days are deducted from pay', rqPayAdvance:'The instalment is deducted from pay each month', rqThisReq:'This request', rqLeft:'Left',
  rqSchedule:'Deduction schedule', rqFixFirst:'Fill in the fields to see the check.', rqReady:'Ready to send', rqSentTitle:'Your request is sent', rqSentLead:'Follow each step here. It now goes to',
  rqDecideTitle:'Your decision', rqApprove:'Approve', rqReject:'Reject', rqNoteFor:'Note (required to reject)', rqNotFound:'This request was not found, or you cannot see it.',
  rqAllMine:'All my requests', rqCreated:'Requested on', rqStatus:'Status', rqWithdrawSure:'Tap again to confirm', rqAcceptBy:'Counts as accepted if not answered by', rqDeemed:'30 days passed without an answer, so the resignation counts as accepted.',
  rqOnBehalf:'on behalf of', rqDays:'Length', rqDates:'Dates', rqTimeline:'Progress', rqNow:'Now', rqLater:'Later', rqDecided:'Decided', rqChanges:'Requested changes',
  rqCurrent:'Current', rqNew2:'New', rqVisa:'Visa', rqMinLast:'Earliest last day by notice', rqPayslipMonth:'First deduction',
  rh_annual:'Annual leave is 21 days a year, 30 after 5 years of service (Art. 109). Requests in review hold days from your balance.',
  rh_sick:'Sick leave: 30 days on full pay, then 60 at three-quarters, then 30 unpaid in a year (Art. 117). Add the Seha report number.',
  rh_unpaid:'Unpaid leave days are deducted; more than 20 days suspends the contract (Art. 116).',
  rh_leave:'Public holidays and rest days are not counted. A request cannot start more than 30 days ago.',
  rh_letter:'HR prepares and approves the letter, then you print it from the request page. Leave the addressee empty for To whom it may concern.',
  rh_advance:'An instalment cannot exceed half the wage (Art. 93); above 10% needs your written consent (Art. 92). The line manager is not in the advance path.',
  rh_correction:'For a punch that did not record that day. Your manager and then HR check it. Within 30 days only.',
  rh_data_change:'HR reviews the change before it applies. A new bank account applies once approved.',
  rh_resignation:'Notice is at least 30 days, or your contract notice if longer (Art. 75). A resignation not answered within 30 days counts as accepted.',
  rh_exit_reentry:'For non-Saudis. Your iqama must stay valid past the return date.'
});
// The data-change labels (also in hr-console.js, which employees never load): defined here so the form never shows raw keys.
Object.assign(T.ar, { fPEmail:'البريد الشخصي', fNatAddr:'العنوان الوطني', fAddr:'العنوان', fMarital:'الحالة الاجتماعية', fEmName:'اسم جهة الطوارئ', fEmPhone:'هاتف الطوارئ',
  fIban:'الآيبان', fBank:'البنك', fPassport:'رقم الجواز', fPassExp:'انتهاء الجواز', fIdExp:'انتهاء الهوية أو الإقامة', fNoneOpt:'بدون', ms_single:'أعزب', ms_married:'متزوج', ms_other:'أخرى',
  rqLoadFail:'تعذر تحميل الطلب. تحقق من الاتصال ثم أعد المحاولة.' });
Object.assign(T.en, { fPEmail:'Personal email', fNatAddr:'National address', fAddr:'Address', fMarital:'Marital status', fEmName:'Emergency contact', fEmPhone:'Emergency phone',
  fIban:'IBAN', fBank:'Bank', fPassport:'Passport number', fPassExp:'Passport expiry', fIdExp:'ID or iqama expiry', fNoneOpt:'None', ms_single:'Single', ms_married:'Married', ms_other:'Other',
  rqLoadFail:'The request could not load. Check the connection and try again.' });
// .rq-page and .rq-mini-av moved to index.html <style id="dsfp"> (the expense pages use them too)
var css2 = '' +
'.rq-sched{display:flex;align-items:flex-end;gap:4px;height:56px;direction:ltr}.rq-sched i{flex:1;background:var(--s1);border-radius:4px 4px 0 0;min-width:6px}' +
'.rq-sched-l{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-3);direction:ltr}' +
'.rq-fields .two{gap:12px}' +
'.rq-hol{display:flex;flex-wrap:wrap;gap:6px}.rq-hol span{font-size:12px;padding:3px 9px;border-radius:999px;background:var(--info-bg);color:var(--info)}';
var st2 = document.createElement('style'); st2.textContent = css2; document.head.appendChild(st2);

var STEPS = { leave: ['manager', 'hr'], correction: ['manager', 'hr'], resignation: ['manager', 'hr'], letter: ['hr'], data_change: ['hr'], advance: ['hr', 'payroll'], exit_reentry: ['manager', 'hr'] };
var ICON = {}; TYPES.forEach(function(x){ ICON[x[0]] = x[1]; });
var TYPE_TINT = { leave: 'requests', letter: 'growth', advance: 'pay', correction: 'time', data_change: 'profile', resignation: 'people', exit_reentry: 'insights' };
function lng(ar, en){ return S.lang === 'en' && en ? en : ar; }
function initials2(n){ return typeof initials === 'function' ? initials(n || '') : String(n || '').slice(0, 2); }
function stepName(st, o){
  if (String(st).indexOf('person:') === 0) return (o && o.stepWho && o.step === st ? esc(o.stepWho) : t('rqStep_person'));
  return t('rqStep_' + st) === 'rqStep_' + st ? esc(st) : t('rqStep_' + st);
}
function remember(rows){ S.reqSeen = S.reqSeen || {}; (rows || []).forEach(function(o){ S.reqSeen[o.id] = o; }); }
/** A request this viewer just decided leaves their inbox, so a reload could not find it: keep a copy for this tab only (sign-out clears it). */
function keepReq(o){ try { var m = JSON.parse(sessionStorage.getItem('bgReqKept') || '{}'), ks = Object.keys(m); m[o.id] = o; if (ks.length > 20) delete m[ks[0]]; sessionStorage.setItem('bgReqKept', JSON.stringify(m)); } catch (e) {} }
function keptReq(id){ try { return JSON.parse(sessionStorage.getItem('bgReqKept') || '{}')[id] || null; } catch (e) { return null; } }

/** The requester card: who, number, position, department, manager, hire date. */
function whoCard(emp, job, title){
  emp = emp || {}; job = job || {};
  var pos = job.position ? lng(job.position.titleAr, job.position.titleEn) : (emp.title || ''), dept = job.department ? lng(job.department.nameAr, job.department.nameEn) : (emp.department || '');
  var mgr = job.manager ? lng(job.manager.name, job.manager.nameEn) : '';
  return '<section class="fp-card"><h2>' + ph('identification-badge') + (title || t('rqWho')) + '</h2><div class="fp-who"><span class="fp-av">' + esc(initials2(emp.name)) + '</span><div><b>' + esc(lng(emp.name, emp.nameEn)) + '</b><small>' + esc([pos, dept].filter(Boolean).join(' · ')) + '</small></div></div>' +
    '<dl class="fp-facts"><div><dt>' + t('rqEmpNo') + '</dt><dd><bdi class="num">' + esc(emp.empNo || '-') + '</bdi></dd></div>' + (dept ? '<div><dt>' + t('rqDept') + '</dt><dd>' + esc(dept) + '</dd></div>' : '') +
    (job.manager !== undefined ? '<div><dt>' + t('rqManager') + '</dt><dd>' + (mgr ? esc(mgr) : '-') + '</dd></div>' : '') + (job.hireDate ? '<div><dt>' + t('rqHire') + '</dt><dd>' + fmtDate(job.hireDate) + '</dd></div>' : '') + '</dl></section>';
}
/** The approval path before sending: the usual chain for the type, with the manager's name from the requester's file. */
function draftChain(type, file){
  var mgr = file && file.job && file.job.manager, steps = (STEPS[type] || ['hr']).filter(function(s){ return s !== 'manager' || mgr; });
  var li = function(cls, icon, b, small){ return '<li class="' + cls + '"><span class="fp-dot">' + ph(icon) + '</span><div><b>' + b + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div></li>'; };
  return '<section class="fp-card"><h2>' + ph('flow-arrow') + t('rqPath') + '</h2><ol class="fp-chain">' + li('now', 'paper-plane-tilt', t('rqStepSubmit'), t('rqYou')) +
    steps.map(function(s){ return li('off', s === 'manager' ? 'user' : s === 'payroll' ? 'money' : 'users-three', t('rqStep_' + s), s === 'manager' ? esc(lng(mgr.name, mgr.nameEn)) : ''); }).join('') +
    li('off', 'seal-check', t('rqStepEnd'), '') + '</ol>' + ((STEPS[type] || []).indexOf('manager') >= 0 && !mgr ? '<p class="hr-hint" style="margin:10px 0 0">' + t('rqNoManager') + '</p>' : '') +
    '<p class="hr-hint" style="margin:10px 0 0;font-size:12px">' + t('rqPathNote') + '</p></section>';
}
/** The real path of a sent request: submitted, each step done / now / later / rejected, with names, dates and notes. */
function realChain(o){
  var hist = (o.history || []).slice(), steps = o.steps || [], li = [];
  var node = function(cls, icon, b, small, note){ return '<li class="' + cls + '"><span class="fp-dot">' + ph(icon) + '</span><div><b>' + b + '</b>' + (small ? '<small>' + small + '</small>' : '') + (note ? '<div class="note">' + esc(note) + '</div>' : '') + '</div></li>'; };
  li.push(node('done', 'paper-plane-tilt', t('rqStepSubmit'), esc(o.emp ? lng(o.emp.name, o.emp.nameEn) : '') + ' · ' + fmtDate(o.createdAt)));
  var ended = false;
  steps.forEach(function(st){
    if (ended) return;
    var h = hist.filter(function(x){ return x.step === st && x.decision !== 'cancelled'; })[0];
    if (h) {
      var by = esc(h.by) + (h.onBehalfOf ? ' (' + t('rqOnBehalf') + ' ' + esc(h.onBehalfOf) + ')' : '') + ' · ' + fmtDate(h.at);
      if (h.decision === 'reject') { li.push(node('no', 'x', stepName(st, o) + ': ' + t('rqRejected'), by, h.note)); ended = true; }
      else li.push(node('done', 'check', stepName(st, o) + ': ' + t('rqApproved'), by, h.note));
    } else if (o.status === 'pending' && o.step === st) li.push(node('now', 'hourglass-medium', stepName(st, o), t('rqNow')));
    else li.push(node('off', 'circle-dashed', stepName(st, o), o.status === 'pending' ? t('rqLater') : ''));
  });
  var c = hist.filter(function(x){ return x.decision === 'cancelled'; })[0];
  if (c) li.push(node('no', 'arrow-u-up-left', t('rs_cancelled'), esc(c.by) + ' · ' + fmtDate(c.at), c.note));
  else if (o.status === 'approved') li.push(node('done', 'seal-check', t('rqStepEnd'), o.decidedAt ? fmtDate(o.decidedAt) : ''));
  else if (o.status === 'pending') li.push(node('off', 'seal-check', t('rqStepEnd'), ''));
  return '<ol class="fp-chain">' + li.join('') + '</ol>';
}
function hintsCard(type, sub){
  var keys = type === 'leave' ? (sub === 'annual' ? ['rh_annual', 'rh_leave'] : sub === 'sick' ? ['rh_sick', 'rh_leave'] : sub === 'unpaid' ? ['rh_unpaid', 'rh_leave'] : ['rh_leave']) : ['rh_' + type];
  return '<section class="fp-card" id="rqHints"><h2>' + ph('lightbulb') + t('rqGuide') + '</h2><ul class="fp-hints">' + keys.map(function(k){ return '<li>' + ph('info') + '<span>' + t(k) + '</span></li>'; }).join('') + '</ul></section>';
}
function recentCard(type, rows){
  var list = (rows || []).filter(function(o){ return o.type === type; }).slice(0, 3);
  return '<section class="fp-card"><h2>' + ph('clock-counter-clockwise') + t('rqRecent') + '</h2>' + (list.length ? '<div class="fp-mini">' + list.map(function(o){
    return '<div data-open="' + o.id + '" role="link" tabindex="0"><span class="rq-mini-av">' + ph(ICON[o.type] || 'file') + '</span><div class="m"><b>' + typeLabel(o) + '</b><small>' + esc(summary(o)) + ' · <bdi>' + esc(o.ref) + '</bdi></small></div>' + statusChip(o) + '</div>'; }).join('') + '</div>'
    : '<p class="hr-hint" style="margin:0">' + t('rqNoRecent') + '</p>') + '</section>';
}
function wireOpen(root){ $$('[data-open]', root).forEach(function(el){ var go = function(){ goArea('requests', 'view', el.dataset.open); }; el.onclick = go; el.onkeydown = function(e){ if (e.key === 'Enter') go(); }; }); }

/** The live summary from the server's quote: the headline figure, the rows that matter and any warning. */
function sumHtml(type, q, rq, file){
  if (!q) return '<div class="fp-state wait">' + ph('hourglass-medium') + '<span>' + t('rqChecking') + '</span></div>';
  var errBox = q.error ? '<div class="fp-state bad" role="alert">' + ph('warning-circle') + '<span>' + esc(errText(q.error)) + (q.max ? ' (' + (type === 'advance' ? money(q.max) : plural(Math.round(q.max), 'days')) + ')' : q.min ? ' (' + plural(Math.round(q.min), 'days') + ')' : '') + '</span></div>' : '';
  if (q.error && q.days == null && q.installment == null) return errBox; // nothing worked out yet: only say what is wrong
  var h = '', rows = [], row = function(k, v){ rows.push('<div><span>' + k + '</span><b>' + v + '</b></div>'); };
  if (type === 'leave') {
    h += '<div class="fp-big"><b class="num">' + num1(q.days) + '</b><span>' + t('rqWork') + '</span></div>';
    row(t('rqDates'), '<bdi>' + fmtDate(q.fromDate) + (q.toDate !== q.fromDate ? ' - ' + fmtDate(q.toDate) : '') + '</bdi>');
    if (q.calendarDays && q.calendarDays !== q.days) row(t('rqCal'), plural(q.calendarDays, 'days'));
    if (q.balanceBefore != null) {
      var before = Math.max(0, q.balanceBefore), used = Math.min(before, q.days), left = Math.max(0, q.balanceAfter);
      h += '<div class="fp-split" role="img" aria-label="' + t('rqBalAfter') + ' ' + num1(q.balanceAfter) + '"><i style="width:' + (before ? used / before * 100 : 0) + '%;background:var(--s2)"></i><i style="width:' + (before ? left / before * 100 : 100) + '%;background:var(--s1)"></i></div>' +
        '<div class="fp-legend"><span><i style="background:var(--s2)"></i>' + t('rqThisReq') + ' ' + num1(q.days) + '</span><span><i style="background:var(--s1)"></i>' + t('rqLeft') + ' ' + num1(q.balanceAfter) + '</span></div>';
      row(t('rqBalBefore'), '<span class="num">' + num1(q.balanceBefore) + '</span>'); row(t('rqBalAfter'), '<span class="num">' + num1(q.balanceAfter) + '</span>');
    }
    if (q.sick) {
      var tot = (q.sick.full || 0) + (q.sick.p75 || 0) + (q.sick.unpaid || 0) || 1;
      h += '<div class="fp-split"><i style="width:' + (q.sick.full || 0) / tot * 100 + '%;background:var(--s1)"></i><i style="width:' + (q.sick.p75 || 0) / tot * 100 + '%;background:var(--s2)"></i><i style="width:' + (q.sick.unpaid || 0) / tot * 100 + '%;background:var(--s3)"></i></div>' +
        '<div class="fp-legend"><span><i style="background:var(--s1)"></i>' + t('rqSickSplit') + ' ' + num1(q.sick.full || 0) + '</span><span><i style="background:var(--s2)"></i>' + t('rqSick75') + ' ' + num1(q.sick.p75 || 0) + '</span><span><i style="background:var(--s3)"></i>' + t('rqSickUnpaid') + ' ' + num1(q.sick.unpaid || 0) + '</span></div>';
    }
    if (q.holidays && q.holidays.length) rows.push('<div style="display:block"><span>' + t('rqHolSkipped') + ' (' + q.holidays.length + ')</span><div class="rq-hol" style="margin-top:6px">' + q.holidays.slice(0, 8).map(function(d){ return '<span>' + fmtDate(d.date || d) + '</span>'; }).join('') + '</div></div>');
    row(t('rqPayEffect'), rq.subtype === 'unpaid' ? t('rqPayUnpaid') : q.sick && (q.sick.p75 || q.sick.unpaid) ? t('rw_sick_reduced_pay') : t('rqPayNone'));
  } else if (type === 'advance') {
    h += '<div class="fp-big"><b class="num">' + num1(q.installment) + '</b><span>' + t('mfSar') + ' / ' + t('rqInstallment') + '</span></div>';
    var n = Math.min(24, q.months || 0), m0 = q.payload && q.payload.startMonth;
    if (n) h += '<div><div class="rq-sched" aria-hidden="true">' + Array.apply(null, Array(n)).map(function(_, i){ return '<i style="height:100%;--i:' + Math.min(i, 16) + '"></i>'; }).join('') + '</div><div class="rq-sched-l"><span>' + esc(m0 || '') + '</span><span>' + plural(n, 'months') + '</span></div></div>';
    row(t('rqAmount'), money(q.amount)); row(t('rqMonths'), '<span class="num">' + (q.months || '-') + '</span>'); row(t('rqPayslipMonth'), '<bdi>' + esc(m0 || '-') + '</bdi>'); row(t('rqPayEffect'), t('rqPayAdvance'));
  } else if (type === 'resignation') {
    var p = q.payload || {};
    h += '<div class="fp-big"><b>' + fmtDate(q.toDate) + '</b><span>' + t('rqLastDay') + '</span></div>';
    row(t('rqNotice'), plural(p.noticeDays || 30, 'days')); row(t('rqMinLast'), fmtDate(p.minLastDay));
  } else if (type === 'exit_reentry') {
    h += '<div class="fp-big"><b class="num">' + num1(q.days) + '</b><span>' + t('rqTrip') + '</span></div>';
    row(t('rqDates'), '<bdi>' + fmtDate(q.fromDate) + ' - ' + fmtDate(q.toDate) + '</bdi>');
    if (rq.payload) { row(t('rqVisaType'), t(rq.payload.visaType === 'multiple' ? 'rqVisaMultiple' : 'rqVisaSingle')); row(t('rqVisaDays'), plural(Number(rq.payload.durationDays) || 0, 'days')); }
  } else if (type === 'correction') {
    var c = q.payload || {};
    h += '<div class="fp-big"><b><bdi dir="ltr">' + esc(c.time || '') + '</bdi></b><span>' + (c.punchType === 'out' ? t('rqOut') : t('rqIn')) + ' · ' + fmtDate(c.date) + '</span></div>';
  } else if (type === 'letter') {
    var l = q.payload || {};
    h += '<div class="fp-big"><b style="font-size:22px">' + t('ls_' + q.subtype) + '</b></div>';
    row(t('rqAddressee'), esc(l.addressee || '')); row(t('rqLang'), l.lang === 'en' ? t('rqLangEn') : t('rqLangAr'));
  } else if (type === 'data_change') {
    var fl = (q.payload && q.payload.fields) || {}, pv = (file && file.priv) || {}, em = (file && file.emp) || {};
    Object.keys(fl).forEach(function(k){ var d = DATA_KEYS.filter(function(x){ return x[0] === k; })[0]; var cur = k === 'phone' ? em.phone : pv[k];
      rows.push('<div style="display:block"><span>' + (d ? t(d[1]) : esc(k)) + '</span><div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap"><bdi style="color:var(--ink-3);text-decoration:line-through">' + esc(cur || '-') + '</bdi>' + ph(S.lang === 'ar' ? 'arrow-left' : 'arrow-right') + '<bdi><b>' + esc(fl[k]) + '</b></bdi></div></div>'); });
  }
  if (rows.length) h += '<div class="fp-rows">' + rows.join('') + '</div>';
  (q.warnings || []).forEach(function(w){ h += '<div class="fp-state warn">' + ph('warning') + '<span>' + t('rw_' + w) + '</span></div>'; });
  if (!(q.warnings || []).length && !q.error) h += '<div class="fp-state ok">' + ph('check-circle') + '<span>' + t('rqReady') + '</span></div>';
  return '<div class="fp-sum">' + errBox + h + '</div>';
}

/** #requests/new and #requests/new/<type>. */
function newPage(body, type){
  type = TYPES.some(function(x){ return x[0] === type; }) ? type : '';
  body.innerHTML = '<div class="rq-page">' + fpTop({ icon: type ? ICON[type] : 'plus-circle', title: type ? t('rt_' + type) : t('rqNew'), lead: type ? t('rtd_' + type) : t('rqPageLead'), crumb: [t('arRequests'), t('rqNew')].concat(type ? [t('rt_' + type)] : []) }) +
    (window.Viz ? Viz.skelPage(3, 2) : '') + '</div>';
  fpWire(body, type ? 'requests' : 'requests', type ? 'new' : 'mine');
  if (type) $$('[data-fp-back]', body).forEach(function(b){ b.onclick = function(){ if (history.state && history.state.fp && history.length > 1) history.back(); else goArea('requests', 'new', '', { replace: true }); }; });
  var F = null, M = null, drawn = false;
  apiFresh('myFile', {}, function(r){ if (!body.isConnected) return; if (!r.ok) return fail(r); F = r.file; if (F && M) draw(); }, true);
  apiFresh('myRequests', {}, function(r){ if (!body.isConnected) return; if (!r.ok) return fail(r); M = r; remember(r.rows); if (F && M) draw(); }, true);
  function fail(r){ var pg = $('.rq-page', body); if (!pg || F && M) return; pg.lastChild.outerHTML = '<div class="db-empty">' + ph('wifi-slash', 'duotone') + '<span>' + esc(errText(r.error)) + '</span><button type="button" class="btn btn-line btn-sm" id="rqRetry">' + t('retry') + '</button></div>'; $('#rqRetry', body).onclick = function(){ newPage(body, type); }; }
  function draw(){
    var pg = $('.rq-page', body); if (!pg || drawn) return; drawn = true; // once: a fresher answer must never wipe what the person typed
    var top = fpTop({ icon: type ? ICON[type] : 'plus-circle', title: type ? t('rt_' + type) : t('rqNew'), lead: type ? t('rtd_' + type) : t('rqPageLead'), crumb: [t('arRequests'), t('rqNew')].concat(type ? [t('rt_' + type)] : []) });
    if (!type) return picker(pg, top);
    form(pg, top);
  }
  function picker(pg, top){
    var saudi = !!(F.job && F.job.isSaudi), a = M.leave && M.leave.annual;
    var bal = a ? '<section class="fp-card" style="margin-bottom:18px"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' + (window.Viz ? Viz.ring(Math.min(100, (a.available || 0) / Math.max(1, a.perYear || 21) * 100), num1(a.available), t('lvBalance'), { size: 64 }) : '') +
      '<div style="flex:1;min-width:180px"><b style="font-size:16px">' + t('lvBalance') + '</b><div class="hr-hint">' + plural(Math.round((a.available || 0) * 10) / 10, 'days') + ' ' + t('lvAvailable') + ' · ' + t('lvPending') + ' ' + num1(a.pending) + ' · ' + t('lvSick') + ' ' + num1(M.leave.sick.used) + '</div></div>' +
      '<button type="button" class="btn btn-line btn-sm" data-go="requests:mine">' + ph('tray') + t('rqAllMine') + '</button></div></section>' : '';
    pg.innerHTML = top + bal + '<div class="fp-types">' + TYPES.filter(function(x){ return x[0] !== 'exit_reentry' || !saudi; }).map(function(x){
      return '<button type="button" class="fp-type" data-tint="' + TYPE_TINT[x[0]] + '" data-type="' + x[0] + '"><span class="ti">' + ph(x[1], 'duotone') + '</span><span><b>' + t('rt_' + x[0]) + '</b><small>' + t('rtd_' + x[0]) + '</small></span>' + ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') + '</button>'; }).join('') + '</div>';
    fpWire(pg, 'requests', 'mine');
    $$('[data-type]', pg).forEach(function(b){ b.onclick = function(){ goArea('requests', 'new', b.dataset.type); }; });
    $$('[data-go]', pg).forEach(function(b){ b.onclick = function(){ var p = b.dataset.go.split(':'); goArea(p[0], p[1]); }; });
  }
  function form(pg, top){
    var file = F, today = riyadhToday(), gender = file.job ? file.job.gender : '';
    var fields = '';
    if (type === 'leave') {
      var kinds = ['annual', 'sick', 'marriage', 'paternity', 'bereavement', 'bereavement_sibling', 'maternity', 'hajj', 'exam', 'iddah', 'unpaid']
        .filter(function(k){ return !(gender === 'male' && (k === 'maternity' || k === 'iddah')) && !(gender === 'female' && k === 'paternity'); });
      fields = '<div class="field"><label for="rqSub">' + t('rqType') + '</label><select id="rqSub" name="subtype">' + kinds.map(function(k){ return '<option value="' + k + '">' + t('lt_' + k) + '</option>'; }).join('') + '</select></div>' +
        '<div class="two"><div class="field"><label for="rqFd">' + t('rqFrom') + '</label><input id="rqFd" type="date" name="fromDate" value="' + today + '" required></div><div class="field"><label for="rqTd">' + t('rqTo') + '</label><input id="rqTd" type="date" name="toDate" value="' + today + '" required></div></div>' +
        '<div class="field hidden" data-for="paternity"><label>' + t('rqEvent') + '</label><input type="date" name="eventDate"></div>' +
        '<div class="field hidden" data-for="iddah"><label>' + t('rqVariant') + '</label><select name="variant"><option value="full">' + t('rqV_full') + '</option><option value="short">' + t('rqV_short') + '</option></select></div>' +
        '<div class="field hidden" data-for="doc"><label>' + t('rqDoc') + '</label><input name="docNo" dir="ltr" maxlength="60"></div>';
    } else if (type === 'letter') {
      fields = '<div class="field"><label>' + t('rqLetterType') + '</label><select name="subtype">' + ['salary_certificate', 'employment_certificate', 'experience'].map(function(k){ return '<option value="' + k + '">' + t('ls_' + k) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('rqAddressee') + '</label><input name="addressee" maxlength="120"><small>' + t('rqAddrHint') + '</small></div>' +
        '<div class="field"><label>' + t('rqLang') + '</label><select name="lang"><option value="ar">' + t('rqLangAr') + '</option><option value="en">' + t('rqLangEn') + '</option></select></div>';
    } else if (type === 'advance') {
      fields = '<div class="two"><div class="field"><label>' + t('rqAmount') + '</label><input type="number" name="amount" min="1" step="1" inputmode="numeric" required></div>' +
        '<div class="field"><label>' + t('rqMonths') + '</label><input type="number" name="months" min="1" max="12" value="3" inputmode="numeric" required></div></div>';
    } else if (type === 'correction') {
      fields = '<div class="two"><div class="field"><label>' + t('rqCorrDate') + '</label><input type="date" name="date" value="' + today + '" max="' + today + '" required></div>' +
        '<div class="field"><label>' + t('rqCorrTime') + '</label><input type="time" name="time" value="08:00" required></div></div>' +
        '<div class="field"><label>' + t('rqCorrType') + '</label><select name="punchType"><option value="in">' + t('rqIn') + '</option><option value="out">' + t('rqOut') + '</option></select></div>';
    } else if (type === 'data_change') {
      var p = file.priv || {}, e = file.emp || {};
      fields = '<p class="hr-hint" style="margin:0 0 12px">' + t('rqDataLead') + '</p><div class="two">' + DATA_KEYS.map(function(k){
        var cur = k[0] === 'phone' ? e.phone : p[k[0]];
        if (k[2] === 'marital') return '<div class="field"><label>' + t(k[1]) + '</label><select name="f_' + k[0] + '"><option value="">' + t('fNoneOpt') + '</option>' + ['single', 'married', 'other'].map(function(m){ return '<option value="' + m + '">' + t('ms_' + m) + '</option>'; }).join('') + '</select>' + (cur ? '<small>' + t('rqCurrent') + ': ' + esc(t('ms_' + cur)) + '</small>' : '') + '</div>';
        return '<div class="field"><label>' + t(k[1]) + '</label><input name="f_' + k[0] + '"' + (k[2] === 'date' ? ' type="date"' : k[2] === 'email' ? ' type="email" dir="ltr"' : k[2] === 'tel' ? ' inputmode="tel" dir="ltr"' : k[2] === 'iban' ? ' dir="ltr" maxlength="34"' : '') + '>' + (cur ? '<small>' + t('rqCurrent') + ': <bdi>' + esc(cur) + '</bdi></small>' : '') + '</div>';
      }).join('') + '</div>';
    } else if (type === 'exit_reentry') {
      fields = '<div class="two"><div class="field"><label>' + t('rqTravelFrom') + '</label><input type="date" name="fromDate" value="' + today + '" min="' + today + '" required></div><div class="field"><label>' + t('rqTravelTo') + '</label><input type="date" name="toDate" value="' + today + '" min="' + today + '" required></div></div>' +
        '<div class="two"><div class="field"><label>' + t('rqVisaType') + '</label><select name="visaType"><option value="single">' + t('rqVisaSingle') + '</option><option value="multiple">' + t('rqVisaMultiple') + '</option></select></div>' +
        '<div class="field"><label>' + t('rqVisaDays') + '</label><input type="number" name="durationDays" min="1" max="730" value="60" inputmode="numeric" required></div></div>' +
        '<div class="two"><div class="field"><label>' + t('rqDeps') + '</label><input type="number" name="dependants" min="0" max="20" value="0" inputmode="numeric"></div><div class="field"><label>' + t('rqLeaveRef') + '</label><input name="leaveRef" dir="ltr" maxlength="30"></div></div>' +
        '<div class="field"><label>' + t('rqPurpose') + '</label><input name="purpose" maxlength="200"></div>';
    } else if (type === 'resignation') {
      var notice = Math.max(30, (file.job && file.job.noticeDays) || 30), min = new Date(Date.parse(today + 'T00:00:00Z') + notice * 86400000).toISOString().slice(0, 10);
      fields = '<div class="field"><label>' + t('rqLastDay') + '</label><input type="date" name="lastDay" value="' + min + '" min="' + today + '" required><small>' + t('rqNotice') + ': ' + plural(notice, 'days') + '</small></div>';
    }
    var send = '<button class="btn btn-dark" type="submit" form="rqf" data-send disabled>' + ph('paper-plane-tilt') + t('rqSend') + '</button>';
    pg.innerHTML = top + '<form class="form" id="rqf" novalidate><div class="fp-grid"><div class="fp-main">' + whoCard(file.emp, file.job) +
      '<section class="fp-card rq-fields"><h2><span class="fp-n">1</span>' + t('rqDetails') + '</h2>' + fields + '</section>' +
      '<section class="fp-card"><h2><span class="fp-n">2</span>' + t('rqNoteAtt') + '</h2><div class="field"><label for="rqNote">' + t('rqReason') + '</label><textarea id="rqNote" name="reason" maxlength="500" rows="3"></textarea></div>' +
        '<div class="fp-drop">' + ph('paperclip') + '<span>' + t('rqAttach') + '</span></div></section>' +
      recentCard(type, M.rows) + '</div>' +
      '<aside class="fp-aside"><section class="fp-card" aria-live="polite"><h2><span class="fp-n">3</span>' + t('rqSummary') + '</h2><div id="rqSum">' + sumHtml(type, null) + '</div>' +
        '<p class="fp-err" id="rqErr" role="alert"></p><div class="fp-actions fp-desk" style="margin-top:14px">' + send + '<button type="button" class="btn btn-line" data-fp-back>' + t('cancel') + '</button></div></section>' +
        draftChain(type, file) + '<div id="rqHintsBox">' + hintsCard(type, 'annual') + '</div></aside></div>' +
      '<div class="fp-bar"><div class="fp-sumline" id="rqSumLine"><span>' + t('rqSummary') + '</span><b>' + t('rqChecking') + '</b></div>' + send + '</div></form>';
    fpWire(pg, 'requests', 'new'); $$('[data-fp-back]', pg).forEach(function(b){ b.onclick = function(){ if (history.state && history.state.fp && history.length > 1) history.back(); else goArea('requests', 'new', '', { replace: true }); }; });
    wireOpen(pg);
    var f = $('#rqf', pg), timer = null, seq = 0, lastOk = false;
    function build(){
      var v = {}; Array.prototype.forEach.call(f.elements, function(x){ if (x.name) v[x.name] = String(x.value || '').trim(); });
      var rq = { type: type, reason: v.reason, payload: {} };
      if (type === 'leave') { rq.subtype = v.subtype; rq.fromDate = v.fromDate; rq.toDate = v.toDate; rq.docNo = v.docNo; if (v.eventDate) rq.payload.eventDate = v.eventDate; if (v.subtype === 'iddah') rq.payload.variant = v.variant; }
      if (type === 'letter') { rq.subtype = v.subtype; rq.payload = { addressee: v.addressee, lang: v.lang }; }
      if (type === 'advance') { rq.amount = v.amount; rq.months = v.months; }
      if (type === 'correction') rq.payload = { date: v.date, time: v.time, punchType: v.punchType };
      if (type === 'data_change') { rq.payload.fields = {}; DATA_KEYS.forEach(function(k){ if (v['f_' + k[0]]) rq.payload.fields[k[0]] = v['f_' + k[0]]; }); }
      if (type === 'resignation') rq.payload = { lastDay: v.lastDay };
      if (type === 'exit_reentry') { rq.fromDate = v.fromDate; rq.toDate = v.toDate; rq.payload = { visaType: v.visaType, durationDays: v.durationDays, dependants: v.dependants, leaveRef: v.leaveRef, purpose: v.purpose }; }
      return rq;
    }
    function showFor(){
      if (type !== 'leave') return;
      var sub = f.elements.subtype.value;
      $$('[data-for]', f).forEach(function(x){ var k = x.dataset.for; x.classList.toggle('hidden', !(k === sub || (k === 'doc' && DOC_LEAVES[sub]))); });
      $('#rqHintsBox', pg).innerHTML = hintsCard('leave', sub);
    }
    var sending = false;
    function setSend(on){ $$('[data-send]', pg).forEach(function(b){ b.disabled = !on || sending; }); }
    function line(q){
      var l = $('#rqSumLine b', pg); if (!l) return;
      l.textContent = !q ? t('rqChecking') : q.error ? errText(q.error) : type === 'leave' ? plural(q.days, 'days') : type === 'advance' ? num1(q.installment) + ' ' + t('mfSar') : t('rqReady');
    }
    function check(){
      clearTimeout(timer); setSend(false); $('#rqErr', pg).textContent = '';
      timer = setTimeout(function(){
        var my = ++seq, rq = build();
        api('requestQuote', { request: rq }, true).then(function(r){
          if (my !== seq || !f.isConnected) return;
          var q = r.ok ? r.quote : { error: r.error };
          lastOk = !q.error; $('#rqSum', pg).innerHTML = sumHtml(type, q, rq, file); line(q); setSend(lastOk);
        });
      }, 320);
    }
    f.oninput = check; f.onchange = function(){ showFor(); check(); };
    showFor(); check();
    f.onsubmit = function(ev){
      ev.preventDefault();
      if (!lastOk || sending) return; // one send at a time: a double tap must never create two requests
      sending = true; setSend(false);
      api('requestCreate', { request: build() }).then(function(r){
        sending = false;
        if (!r.ok) { setSend(lastOk); $('#rqErr', pg).textContent = errText(r.error); return; }
        S.reqJust = r.request.id; remember([r.request]);
        if (typeof loadTasks === 'function') loadTasks();
        goArea('requests', 'view', r.request.id, { replace: true }); // the form's entry becomes the request: Back returns to where the form was opened
      });
    };
  }
}

/** #requests/view/<id>: the request's own page with its timeline; withdraw, print or decide from here. */
function viewPage(body, id){
  var seen = (S.reqSeen || {})[id] || keptReq(id), justSent = S.reqJust === id; // the "sent" banner stays through later redraws
  if (justSent) S.reqJust = null;
  body.innerHTML = '<div class="rq-page">' + fpTop({ icon: seen ? ICON[seen.type] || 'file' : 'file', title: seen ? typeLabel(seen) : t('vwReqView'), crumb: [t('arRequests'), t('vwReqView')] }) + (window.Viz ? Viz.skelPage(2, 2) : '') + '</div>';
  fpWire(body, 'requests', 'mine');
  if (seen) draw(seen, null);
  // find it: my own, then waiting for me, then (HR) everything
  apiFresh('myRequests', {}, function(r){
    if (!body.isConnected) return;
    if (!r.ok) return seen ? null : failed();
    var o = r.rows.filter(function(x){ return x.id === id; })[0];
    if (o) { remember(r.rows); return draw(o, 'mine'); }
    apiFresh('reqInbox', {}, function(x){
      if (!body.isConnected) return;
      if (!x.ok) return seen ? null : failed();
      var p = x.rows.filter(function(y){ return y.id === id; })[0];
      if (p) { remember(x.rows); return draw(p, 'decide'); }
      // decided by this viewer earlier (no longer in the inbox): the copy kept on this device still shows it
      if (!isHr()) return seen ? null : missing();
      apiFresh('reqInbox', { scope: 'all', status: '' }, function(z){ if (!body.isConnected) return; if (!z.ok) return seen ? null : failed(); var q = z.rows.filter(function(y){ return y.id === id; })[0]; if (q) draw(q, 'hr'); else if (!seen) missing(); }, true);
    }, true);
  }, true);
  function failed(){ var pg = $('.rq-page', body); if (!pg) return; pg.innerHTML = fpTop({ icon: 'wifi-slash', title: t('vwReqView'), crumb: [t('arRequests')] }) + '<div class="db-empty">' + ph('wifi-slash', 'duotone') + '<span>' + t('rqLoadFail') + '</span><button type="button" class="btn btn-line btn-sm" data-retry>' + t('retry') + '</button></div>'; fpWire(pg, 'requests', 'mine'); $('[data-retry]', pg).onclick = function(){ viewPage(body, id); }; }
  function missing(){ var pg = $('.rq-page', body); pg.innerHTML = fpTop({ icon: 'file-x', title: t('vwReqView'), crumb: [t('arRequests')] }) + '<div class="db-empty">' + ph('file-x', 'duotone') + '<span>' + t('rqNotFound') + '</span></div>'; fpWire(pg, 'requests', 'mine'); }
  var shown = '';
  function draw(o, how){
    var pg = $('.rq-page', body); if (!pg) return;
    var key = how + JSON.stringify(o); if (key === shown) return; shown = key;
    var mine = how === 'mine' || (S.me && o.emp && o.emp.id === S.me.id), just = justSent;
    var facts = '<dl class="fp-facts" style="border-top:0;margin-top:0;padding-top:0"><div><dt>' + t('rqCreated') + '</dt><dd>' + fmtDate(o.createdAt) + '</dd></div><div><dt>' + t('rqStatus') + '</dt><dd>' + statusChip(o) + '</dd></div>' +
      (summary(o) ? '<div style="grid-column:1 / -1"><dt>' + t('rqDetails') + '</dt><dd>' + esc(summary(o)) + '</dd></div>' : '') + '</dl>';
    var extra = '';
    if (o.reason) extra += '<div class="fp-rows"><div><span>' + t('rqReason') + '</span><b style="font-weight:500">' + esc(o.reason) + '</b></div></div>';
    if (o.docNo) extra += '<div class="fp-rows"><div><span>' + t('rqDoc') + '</span><b><bdi>' + esc(o.docNo) + '</bdi></b></div></div>';
    if (o.sick && (o.sick.full || o.sick.p75 || o.sick.unpaid)) extra += '<div class="fp-rows"><div><span>' + t('lt_sick') + '</span><b>' + [o.sick.full ? plural(o.sick.full, 'days') + ' ' + t('rqSickSplit') : '', o.sick.p75 ? plural(o.sick.p75, 'days') + ' ' + t('rqSick75') : '', o.sick.unpaid ? plural(o.sick.unpaid, 'days') + ' ' + t('rqSickUnpaid') : ''].filter(Boolean).join('، ') + '</b></div></div>';
    if (o.fields) extra += '<h3 class="hr-sub" style="margin:14px 0 6px;font-size:14px">' + t('rqChanges') + '</h3><div class="fp-rows">' + Object.keys(o.fields).map(function(k){ var d = DATA_KEYS.filter(function(x){ return x[0] === k; })[0]; return '<div><span>' + (d ? t(d[1]) : esc(k)) + '</span><b><bdi>' + esc(o.fields[k]) + '</bdi></b></div>'; }).join('') + '</div>';
    if (o.type === 'advance' && o.amount) extra += '<div class="fp-rows"><div><span>' + t('rqAmount') + '</span><b>' + money(o.amount) + '</b></div><div><span>' + t('rqInstallment') + '</span><b>' + money(o.installment) + ' × ' + o.months + '</b></div>' + (o.startMonth ? '<div><span>' + t('rqStart') + '</span><b><bdi>' + esc(o.startMonth) + '</bdi></b></div>' : '') + '</div>';
    if (o.resignation) extra += '<div class="fp-rows"><div><span>' + t('rqNotice') + '</span><b>' + plural(o.resignation.noticeDays || 30, 'days') + '</b></div>' + (o.status === 'pending' ? '<div><span>' + t('rqAcceptBy') + '</span><b>' + fmtDate(o.resignation.acceptBy) + '</b></div>' : '') + '</div>' + (o.resignation.deemedAccepted ? '<div class="fp-state warn" style="margin-top:10px">' + ph('info') + '<span>' + t('rqDeemed') + '</span></div>' : '');
    (o.warnings || []).forEach(function(w){ extra += '<div class="fp-state warn" style="margin-top:10px">' + ph('warning') + '<span>' + t('rw_' + w) + '</span></div>'; });
    var acts = '';
    if (mine && o.status === 'pending') acts += '<button type="button" class="btn btn-line" data-withdraw>' + ph('arrow-u-up-left') + t('rqCancel') + '</button>';
    // a salary certificate printed by someone who may not see pay would come out without the salary: hide it for them
    if (o.type === 'letter' && o.status === 'approved' && (mine || isHr()) && (mine || o.subtype !== 'salary_certificate' || (typeof salaryOk !== 'function' || salaryOk()))) acts += '<button type="button" class="btn btn-dark" data-print>' + ph('printer') + t('rqPrint') + '</button>';
    // HR may cancel approved leave that has not ended (the server checks the same rule)
    if (!mine && isHr() && o.type === 'leave' && o.status === 'approved' && o.toDate >= riyadhToday()) acts += '<button type="button" class="btn btn-line" data-withdraw>' + ph('arrow-u-up-left') + t('rqCancel') + '</button>';
    var decide = how === 'decide' && o.status === 'pending' ? '<section class="fp-card"><h2>' + ph('seal-check') + t('rqDecideTitle') + '</h2><div class="form"><div class="field"><label for="rqDn">' + t('rqNoteFor') + '</label><textarea id="rqDn" rows="3" maxlength="300"></textarea></div></div>' +
      '<p class="fp-err" id="rqDe" role="alert"></p><div class="fp-actions"><button type="button" class="btn btn-dark" data-dec="approve">' + ph('check') + t('rqApprove') + '</button><button type="button" class="btn btn-danger" data-dec="reject">' + ph('x') + t('rqReject') + '</button></div></section>' : '';
    var nowWho = o.status === 'pending' ? stepName(o.step, o) : '';
    pg.innerHTML = fpTop({ icon: ICON[o.type] || 'file', title: typeLabel(o), lead: '<bdi class="num">' + esc(o.ref || '') + '</bdi>', crumb: [t('arRequests'), t('vwReqView')], chips: statusChip(o) }) +
      (just ? '<div class="fp-ok" role="status"><span class="ic">' + ph('check') + '</span><div><b>' + t('rqSentTitle') + '</b><small>' + t('rqSentLead') + ' ' + nowWho + '.</small></div></div>' : '') +
      '<div class="fp-grid"><div class="fp-main"><section class="fp-card"><h2>' + ph('file-text') + t('rqDetails') + '</h2>' + facts + extra + '</section>' + whoCard(o.emp, {}, t('rqWho')) + decide + '</div>' +
      '<aside class="fp-aside"><section class="fp-card"><h2>' + ph('flow-arrow') + t('rqTimeline') + '</h2>' + realChain(o) + '</section>' + (acts ? '<section class="fp-card"><div class="fp-actions">' + acts + '</div><p class="fp-err" id="rqAe" role="alert"></p></section>' : '') + '</aside></div>';
    fpWire(pg, 'requests', mine ? 'mine' : 'inbox');
    var w = $('[data-withdraw]', pg);
    if (w) w.onclick = function(){
      if (!w.dataset.sure) { w.dataset.sure = '1'; w.innerHTML = ph('warning') + t('rqWithdrawSure'); setTimeout(function(){ if (w.isConnected) { delete w.dataset.sure; w.innerHTML = ph('arrow-u-up-left') + t('rqCancel'); } }, 4000); return; }
      w.disabled = true;
      api('requestCancel', { id: o.id }).then(function(r){ if (!r.ok) { w.disabled = false; $('#rqAe', pg).textContent = errText(r.error); return; } toast(t('rqCancelled')); if (typeof loadTasks === 'function') loadTasks(); viewPage(body, id); });
    };
    var pr = $('[data-print]', pg);
    if (pr) pr.onclick = function(){ if (!mine && !(o.emp && o.emp.id)) return; printFetched(o, function(){ return mine ? api('myFile', {}, true) : api('hrEmpFile', { id: o.emp.id }); }); };
    $$('[data-dec]', pg).forEach(function(b){ b.onclick = function(){
      var note = ($('#rqDn', pg) || {}).value || '';
      $$('[data-dec]', pg).forEach(function(x){ x.disabled = true; });
      api('reqDecide', { id: o.id, decision: b.dataset.dec, note: note }).then(function(x){
        if (!x.ok) { $$('[data-dec]', pg).forEach(function(y){ y.disabled = false; }); $('#rqDe', pg).textContent = errText(x.error); return; }
        remember([x.request]); keepReq(x.request); if (typeof loadTasks === 'function') loadTasks(); draw(x.request, 'hr');
      });
    }; });
  }
}

window.Req = { balanceCard: balanceCard, listCard: listCard, wireList: wireList, newRequest: newRequest, rowHtml: rowHtml, detail: detail,
  typeLabel: typeLabel, statusChip: statusChip, summary: summary, printLetter: printLetter, printFetched: printFetched, keepReq: keepReq, fmtDate: fmtDate, newPage: newPage, viewPage: viewPage };
})();
