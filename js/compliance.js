// Compliance (Compliance.gs): calendar of legal deadlines, the WPS (Mudad) salary file with its checks and tracker,
// GOSI / Qiwa wage reconciliation, and delegation of approvals. HR and payroll see the section; delegation is for managers.
(function(){
'use strict';

Object.assign(T.ar, {
  cpTitle:'الامتثال', cpCal:'التقويم النظامي', cpWps:'ملف حماية الأجور (مدد)', cpRecon:'مطابقة الأجور', cpDash:'الامتثال في لمحة',
  cpOverdue:'متأخرة', cpSoon:'خلال 14 يوما', cpLater:'لاحقا', cpOpenRecon:'فروقات أجور مفتوحة', cpAllClear:'لا توجد التزامات متأخرة أو قريبة.', cpDue:'الموعد', cpLeft:'متبقي', cpLate:'متأخر',
  ck_gosi_register:'تسجيل الموظف في التأمينات الاجتماعية (خلال 15 يوما من المباشرة)', ck_qiwa_contract:'توثيق العقد في منصة قوى', ck_iqama:'انتهاء الإقامة', ck_passport:'انتهاء جواز السفر',
  ck_contract_end:'انتهاء العقد محدد المدة', ck_probation_end:'انتهاء فترة التجربة', ck_work_permit:'انتهاء رخصة العمل', ck_medical_insurance:'انتهاء التأمين الطبي', ck_driving_licence:'انتهاء رخصة القيادة',
  ck_payroll_not_locked:'مسير الشهر لم يعتمد بعد', ck_iqama_renewal:'تجديد الإقامة في مقيم', ck_visa_not_returned:'لم يعد بعد انتهاء تأشيرة الخروج والعودة', ck_visa_expiring:'تأشيرة خروج وعودة تنتهي قريبا',
  ck_final_exit_expiring:'تأشيرة خروج نهائي تنتهي قريبا', ck_final_exit_needed:'غير سعودي في إخلاء طرف بلا تأشيرة خروج نهائي', ck_ticket_due:'تذكرة سنوية مستحقة', ck_ticket_upcoming:'تذكرة سنوية تستحق قريبا',
  ck_disc_objection_decide:'الرد على تظلم موظف (15 يوما، المادة 72)', ck_journal_pending:'قيد رواتب لم يؤكد في المحاسبة', ck_injury_gosi:'إبلاغ التأمينات عن إصابة عمل (3 أيام)', ck_wps_upload:'رفع ملف حماية الأجور للشهر', ck_wps_confirm:'تأكيد نجاح رفع ملف حماية الأجور', ck_recon_open:'فروقات أجور لم تغلق', ck_saudization:'نسبة التوطين دون المستهدف',
  cpQiwaNote:'منذ أبريل 2026 لا يحتسب السعودي في نطاقات إلا بعقد موثق في قوى.', cpVerify:'المواعيد والقواعد من ملخصات المزودين؛ تحقق منها في أنظمة الموارد البشرية وقوى والتأمينات قبل الاعتماد عليها.',
  wpRun:'المسير المعتمد', wpNoRun:'لا يوجد مسير معتمد بعد. يصدر الملف بعد اعتماد المسير.', wpRows:'موظفون في الملف', wpTotal:'إجمالي الصافي', wpErrors:'أخطاء تمنع الرفع', wpDueT:'موعد الرفع',
  wpDownload:'تنزيل ملف Excel', wpGen:'تم تجهيز الملف', wpUp:'تم الرفع إلى البنك أو مدد', wpConf:'تأكيد النجاح (شخص آخر)', wpBankRef:'رقم المرجع من البنك أو مدد', wpSkipped:'لم يدخلوا الملف (بلا راتب معتمد)',
  wpTemplate:'الأعمدة وفق الشائع في ملفات حماية الأجور. طابقها مع القالب المعتمد لدى بنك الشركة أو منصة مدد قبل الرفع الأول.', wpProblems:'الموظفون الذين يحتاجون تصحيحا',
  wps_generated:'جاهز', wps_uploaded:'مرفوع', wps_confirmed:'مؤكد', wpNone:'لم يجهز بعد', wpSteps:'مراحل الرفع',
  wp_no_iban:'لا يوجد آيبان', wp_bad_iban:'الآيبان غير صحيح', wp_no_id:'لا يوجد رقم هوية/إقامة', wp_bad_id:'رقم الهوية/الإقامة غير صحيح', wp_net_not_positive:'الصافي صفر أو سالب', wp_no_basic:'لا يوجد راتب أساسي',
  rcSource:'المصدر', rcGosi:'التأمينات الاجتماعية (الأجر الخاضع = الأساسي + السكن)', rcQiwa:'قوى (الأجر الأساسي في العقد)', rcMonth:'الشهر', rcFile:'ملف التصدير (Excel أو CSV)', rcIdCol:'عمود رقم الهوية', rcWageCol:'عمود الأجر',
  rcUpload:'مطابقة', rcMatched:'متطابق', rcMism:'فروقات', rcMissing:'لدينا وليسوا في الملف', rcUnknown:'في الملف وليسوا لدينا', rcOurs:'أجرنا', rcTheirs:'أجرهم', rcDiff:'الفرق',
  rcResolve:'إغلاق الفروقات', rcNote:'ما الذي عولج؟', rcHistory:'المطابقات السابقة', rcLead:'ارفع تصدير التأمينات أو قوى. أي فرق أكثر من ريال يمنع اعتماد مسير الشهر حتى يغلقه شخص غير من رفع الملف.',
  rc_open:'مفتوحة', rc_clean:'مطابقة', rc_resolved:'أغلقت', rcRows:'صفا', rcPick:'اختر العمود',
  dgTitle:'تفويض الموافقات', dgLead:'عند غيابك (إجازة، حج، سفر عمل) يوافق من تختاره على طلبات فريقك نيابة عنك، حتى 60 يوما. يسجل كل قرار باسمه ونيابة عنك، ولا يوافق أحد على طلبه هو.',
  dgTo:'المفوض', dgFrom:'من', dgUntil:'إلى', dgReason:'السبب', dgSave:'تفويض', dgRevoke:'إلغاء', dgGiven:'فوضت', dgReceived:'مفوض إليك', dgNone:'لا توجد تفويضات.', dgActive:'سار', dgRevoked:'ملغى', dgEnded:'منتهي',
  e_delegation_too_long:'التفويض 60 يوما كحد أقصى.', e_delegation_overlap:'يوجد تفويض آخر في نفس الأيام.', e_recon_open:'توجد فروقات أجور مفتوحة لهذا الشهر (التأمينات أو قوى). أغلقها من صفحة الامتثال أولا.',
  wpFormat:'تنسيق ملف البنك', wpValue:'تاريخ القيمة', wpBankFile:'تنزيل ملف البنك', wpMissing:'ينقص لهذا التنسيق (من صفحة قيد الرواتب، ملفات البنوك):', wpMissing_molId:'رقم المنشأة', wpMissing_debitIban:'آيبان الشركة', wpMissing_companyCode:'رمز الشركة لدى البنك',
  wpFmtNote:'كل تنسيق بنكي قراءة لعينات عامة: طابقه مع البنك أو مدد قبل أول رفع.',
  e_run_not_locked:'يصدر الملف بعد اعتماد المسير.', e_wps_errors:'في الملف أخطاء. صحح بيانات الموظفين أولا.', e_bad_state:'هذه الخطوة غير متاحة الآن.', e_note_required:'اكتب ملاحظة.'
});
Object.assign(T.en, {
  cpTitle:'Compliance', cpCal:'Legal calendar', cpWps:'WPS salary file (Mudad)', cpRecon:'Wage reconciliation', cpDash:'Compliance at a glance',
  cpOverdue:'Overdue', cpSoon:'Within 14 days', cpLater:'Later', cpOpenRecon:'Open wage mismatches', cpAllClear:'Nothing overdue or due soon.', cpDue:'Due', cpLeft:'left', cpLate:'late',
  ck_gosi_register:'Register with GOSI (within 15 days of joining)', ck_qiwa_contract:'Document the contract in Qiwa', ck_iqama:'Iqama expiry', ck_passport:'Passport expiry',
  ck_contract_end:'Fixed-term contract ends', ck_probation_end:'Probation ends', ck_work_permit:'Work permit expiry', ck_medical_insurance:'Medical insurance expiry', ck_driving_licence:'Driving licence expiry',
  ck_payroll_not_locked:'Payroll for the month not approved', ck_iqama_renewal:'Renew the iqama in Muqeem', ck_visa_not_returned:'Not back after the exit/re-entry visa expired', ck_visa_expiring:'Exit/re-entry visa expiring soon',
  ck_final_exit_expiring:'Final exit visa expiring soon', ck_final_exit_needed:'Non-Saudi leaving with no final exit visa', ck_ticket_due:'Annual ticket due', ck_ticket_upcoming:'Annual ticket due soon',
  ck_disc_objection_decide:'Answer an employee grievance (15 days, Art. 72)', ck_journal_pending:'Payroll journal not confirmed in accounting', ck_injury_gosi:'Notify GOSI of a work injury (3 days)', ck_wps_upload:'Upload the WPS file for the month', ck_wps_confirm:'Confirm the WPS upload succeeded', ck_recon_open:'Wage mismatches still open', ck_saudization:'Saudization below target',
  cpQiwaNote:'Since April 2026 a Saudi counts in Nitaqat only with a contract documented in Qiwa.', cpVerify:'Deadlines and rules come from vendor summaries; check them against HRSD, Qiwa and GOSI before relying on them.',
  wpRun:'Approved run', wpNoRun:'No approved payroll yet. The file is made after approval.', wpRows:'People in the file', wpTotal:'Total net', wpErrors:'Errors blocking upload', wpDueT:'Upload due',
  wpDownload:'Download Excel file', wpGen:'File prepared', wpUp:'Uploaded to the bank or Mudad', wpConf:'Confirm success (another person)', wpBankRef:'Reference from the bank or Mudad', wpSkipped:'Left out (no approved package)',
  wpTemplate:'Columns follow common WPS files. Match them to the template of the company\'s bank or Mudad before the first upload.', wpProblems:'People who need a correction',
  wps_generated:'Ready', wps_uploaded:'Uploaded', wps_confirmed:'Confirmed', wpNone:'Not prepared yet', wpSteps:'Upload steps',
  wp_no_iban:'No IBAN', wp_bad_iban:'Invalid IBAN', wp_no_id:'No ID / iqama number', wp_bad_id:'Invalid ID / iqama number', wp_net_not_positive:'Net pay is zero or negative', wp_no_basic:'No basic salary',
  rcSource:'Source', rcGosi:'GOSI (contributory wage = basic + housing)', rcQiwa:'Qiwa (contract basic wage)', rcMonth:'Month', rcFile:'Export file (Excel or CSV)', rcIdCol:'ID column', rcWageCol:'Wage column',
  rcUpload:'Reconcile', rcMatched:'Matched', rcMism:'Mismatches', rcMissing:'Ours, not in the file', rcUnknown:'In the file, not ours', rcOurs:'Our wage', rcTheirs:'Their wage', rcDiff:'Difference',
  rcResolve:'Close mismatches', rcNote:'What was fixed?', rcHistory:'Earlier reconciliations', rcLead:'Upload the GOSI or Qiwa export. Any difference over 1 SAR blocks that month\'s payroll approval until someone other than the uploader closes it.',
  rc_open:'Open', rc_clean:'Matched', rc_resolved:'Closed', rcRows:'rows', rcPick:'Choose the column',
  dgTitle:'Delegate approvals', dgLead:'While you are away (leave, Hajj, travel) the person you choose approves your team\'s requests on your behalf, for up to 60 days. Every decision is recorded under their name on your behalf; nobody approves their own request.',
  dgTo:'Delegate', dgFrom:'From', dgUntil:'To', dgReason:'Reason', dgSave:'Delegate', dgRevoke:'Revoke', dgGiven:'Given by you', dgReceived:'Given to you', dgNone:'No delegations.', dgActive:'Active', dgRevoked:'Revoked', dgEnded:'Ended',
  e_delegation_too_long:'A delegation lasts at most 60 days.', e_delegation_overlap:'Another delegation covers the same days.', e_recon_open:'Open wage mismatches for this month (GOSI or Qiwa). Close them in Compliance first.',
  wpFormat:'Bank file layout', wpValue:'Value date', wpBankFile:'Download bank file', wpMissing:'Missing for this layout (Payroll journal page, bank files):', wpMissing_molId:'establishment number', wpMissing_debitIban:'company IBAN', wpMissing_companyCode:'company code at the bank',
  wpFmtNote:'Each bank layout is a reading of public samples: match it with the bank or Mudad before the first upload.',
  e_run_not_locked:'The file is made after the run is approved.', e_wps_errors:'The file has errors. Fix the employee data first.', e_bad_state:'This step is not available now.', e_note_required:'Write a note.'
});

var css = '' +
'.cp-seg{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.cp-seg button{height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13.5px;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px}' +
'.cp-seg button[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.cp-item{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(28,42,31,.05),0 8px 20px -16px rgba(28,42,31,.3);margin-bottom:8px;border-inline-start:4px solid #2a78d6}' +
'.cp-item.error{border-color:#B3261E}.cp-item.warn{border-color:#C98500}.cp-item .main{flex:1;min-width:0}.cp-item b{font-weight:500}.cp-item small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:2px}' +
'.cp-item .ic{font-size:20px;margin-top:1px}.cp-item.error .ic{color:#B3261E}.cp-item.warn .ic{color:#8A5A00}.cp-item.info .ic{color:#2a78d6}' +
'.cp-when{text-align:end;white-space:nowrap;font-size:12.5px;color:var(--ink-2)}.cp-when b{display:block;font-size:14px;color:var(--ink)}' +
'.cp-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 14px}.cp-step{padding:12px;border-radius:14px;background:var(--card);border:1px solid var(--line);font-size:13px}' +
'.cp-step b{display:flex;align-items:center;gap:6px;font-size:14px;margin-bottom:4px}.cp-step.done{border-color:#9CC7A6;background:#F1F8F2}.cp-step.done b i{color:#2E7D4F}.cp-step small{color:var(--ink-2)}' +
'.cp-box{background:var(--card);border-radius:18px;padding:16px;box-shadow:0 1px 2px rgba(28,42,31,.05),0 10px 26px -18px rgba(28,42,31,.28);margin-bottom:14px}' +
'.cp-note{font-size:12.5px;color:var(--ink-2);display:flex;gap:6px;align-items:flex-start;margin:6px 0 12px}' +
'@media (max-width:640px){.cp-steps{grid-template-columns:1fr}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function monthName(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric' }); }
function busy(el){ el.innerHTML = '<span class="sk" style="width:40%"></span><span class="sk"></span>'; }
var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', xp = null;
function xlsxLib(){ if (window.XLSX) return Promise.resolve(); if (xp) return xp; xp = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = XLSX_URL; s.onload = res; s.onerror = function(){ xp = null; rej(); }; document.head.appendChild(s); }); return xp; }

function section(body){
  var v = S.cpView || 'cal';
  body.innerHTML = '<div class="hr-h"><h2>' + t('cpTitle') + '</h2></div><div class="cp-seg" role="group">' + [['cal', 'calendar-check', 'cpCal'], ['wps', 'bank', 'cpWps'], ['recon', 'scales', 'cpRecon']].map(function(x){
    return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (v === x[0]) + '">' + ph(x[1]) + t(x[2]) + '</button>'; }).join('') + '</div><div id="cpB"></div>';
  $$('[data-v]', body).forEach(function(b){ b.onclick = function(){ S.cpView = b.dataset.v; section(body); }; });
  var el = $('#cpB', body);
  if (v === 'wps') return wpsView(el);
  if (v === 'recon') return reconView(el);
  calendar(el);
}

// ---------------- calendar ----------------
function calendar(el){
  busy(el);
  apiFresh('complianceCalendar', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var V = window.Viz, c = { error: 0, warn: 0, info: 0 }; r.items.forEach(function(x){ c[x.level]++; });
    var byKind = {}; r.items.forEach(function(x){ byKind[x.kind] = (byKind[x.kind] || 0) + 1; });
    var kinds = Object.keys(byKind).sort(function(a, b){ return byKind[b] - byKind[a]; }).map(function(k){ return { label: t('ck_' + k), value: byKind[k], text: String(byKind[k]), tip: t('ck_' + k) + ': ' + byKind[k] }; });
    var h = V ? V.panel('comp', t('cpDash'), '<div class="db-tiles">' + V.tile(t('cpOverdue'), '<span class="db-status">' + (c.error ? ph('warning-circle') + ' ' : '') + c.error + '</span>', '', null, true, true) +
      V.tile(t('cpSoon'), V.n1(c.warn, 0), '') + V.tile(t('cpLater'), V.n1(c.info, 0), '') + V.tile(t('cpOpenRecon'), V.n1(r.items.filter(function(x){ return x.kind === 'recon_open'; }).length, 0), '') + '</div>' +
      (kinds.length ? '<div class="db-grid">' + V.card('ck', t('cpCal'), '', V.hbars(kinds), '') + '</div>' : '')) : '';
    h += '<p class="cp-note">' + ph('info') + t('cpVerify') + '</p>';
    h += r.items.length ? r.items.map(function(x){
      var ic = x.level === 'error' ? 'warning-circle' : x.level === 'warn' ? 'warning' : 'calendar-blank';
      var sub = [x.emp ? esc(x.emp.name) + ' <bdi>' + esc(x.emp.empNo) + '</bdi>' : '', x.month ? esc(monthName(x.month)) : '', x.number ? '<bdi>' + esc(x.number) + '</bdi>' : '', x.count ? x.count + ' ' + t('rcMism') : '',
        x.kind === 'qiwa_contract' && x.saudi ? t('cpQiwaNote') : '', x.kind === 'saudization' ? x.value + '% / ' + x.target + '%' : ''].filter(Boolean).join(' · ');
      var when = x.due ? '<div class="cp-when"><b>' + fmt(x.due) + '</b>' + (x.daysLeft < 0 ? t('cpLate') + ' ' + plural(-x.daysLeft, 'days') : t('cpLeft') + ' ' + plural(x.daysLeft, 'days')) + '</div>' : '';
      return '<div class="cp-item ' + x.level + '">' + ph(ic, 'fill').replace('class="', 'class="ic ') + '<div class="main"><b>' + t('ck_' + x.kind) + '</b><small>' + sub + '</small></div>' + when + '</div>';
    }).join('') : '<div class="empty">' + ph('seal-check') + '<b>' + t('cpAllClear') + '</b></div>';
    el.innerHTML = h; if (V) V.wire(el);
  });
}

// ---------------- WPS ----------------
function wpsView(el){
  busy(el);
  api('payrollList', {}, true).then(function(pl){
    if (!el.isConnected) return;
    var runs = pl.ok ? pl.rows.filter(function(x){ return x.status === 'locked'; }) : [];
    if (!runs.length) return el.innerHTML = '<div class="empty">' + ph('bank') + '<b>' + t('wpNoRun') + '</b></div>';
    var cur = S.cpRun && runs.some(function(x){ return x.id === S.cpRun; }) ? S.cpRun : runs[0].id;
    el.innerHTML = '<div class="toolbar"><label class="hr-hint" style="margin:0">' + t('wpRun') + '</label><select id="wpSel">' + runs.map(function(x){ return '<option value="' + x.id + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(monthName(x.month) + ' · ' + x.ref) + '</option>'; }).join('') + '</select></div><div id="wpB"></div>';
    $('#wpSel', el).onchange = function(){ S.cpRun = this.value; wpsView(el); };
    var box = $('#wpB', el); busy(box);
    api('wpsFile', { id: cur }).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
      var V = window.Viz, g = r.log, st = g ? g.status : '', bad = r.rows.filter(function(x){ return x.problems.length; });
      var step = function(key, icon, title, done, who, act){ return '<div class="cp-step' + (done ? ' done' : '') + '"><b>' + ph(done ? 'check-circle' : icon, done ? 'fill' : '') + title + '</b><small>' + (who || '') + '</small>' + (act || '') + '</div>'; };
      var h = V ? '<div class="db-tiles">' + V.tile(t('wpTotal'), money(r.total), t('mfSar'), null, true, true) + V.tile(t('wpRows'), V.n1(r.rows.length, 0), '') +
        V.tile(t('wpErrors'), '<span class="db-status">' + (r.errors ? ph('warning-circle') + ' ' : '') + r.errors + '</span>', '') + V.tile(t('wpDueT'), fmt(r.due), g ? t('wps_' + g.status) : t('wpNone')) + '</div>' : '';
      h += '<h3 class="hr-sub">' + t('wpSteps') + '</h3><div class="cp-steps">' +
        step('g', 'file-arrow-down', t('wpGen'), !!g, g ? esc(g.generatedBy) + ' · ' + fmt(g.generatedAt) + ' · <bdi>' + esc(g.ref) + '</bdi>' : '', !g ? '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn btn-dark btn-sm" data-step="generated"' + (r.errors ? ' disabled' : '') + '>' + t('wpGen') + '</button></div>' : '') +
        step('u', 'upload-simple', t('wpUp'), st === 'uploaded' || st === 'confirmed', g && g.uploadedAt ? esc(g.uploadedBy) + ' · ' + fmt(g.uploadedAt) + ' · <bdi>' + esc(g.bankRef) + '</bdi>' : '',
          st === 'generated' ? '<form class="form" id="wpUpF" style="gap:6px;margin-top:8px"><input name="ref" required placeholder="' + t('wpBankRef') + '" maxlength="60" dir="ltr"><button type="submit" class="btn btn-dark btn-sm">' + t('wpUp') + '</button></form>' : '') +
        step('c', 'seal-check', t('wpConf'), st === 'confirmed', g && g.confirmedAt ? esc(g.confirmedBy) + ' · ' + fmt(g.confirmedAt) : '', st === 'uploaded' ? '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn btn-dark btn-sm" data-step="confirmed">' + t('wpConf') + '</button></div>' : '') + '</div>';
      h += '<div class="btnrow" style="margin:0 0 6px"><button type="button" class="btn btn-line btn-sm" id="wpX"' + (r.errors ? ' disabled' : '') + '>' + ph('microsoft-excel-logo') + t('wpDownload') + '</button></div><p class="cp-note">' + ph('info') + t('wpTemplate') + '</p>';
      if (r.formats && r.formats.length > 1) h += '<div class="toolbar"><label class="hr-hint" for="wpFmt" style="margin:0">' + t('wpFormat') + '</label><select id="wpFmt">' + r.formats.filter(function(f){ return f.id !== 'generic'; }).map(function(f){ return '<option value="' + esc(f.id) + '">' + esc(S.lang === 'en' ? f.en : f.ar) + '</option>'; }).join('') + '</select>' +
        '<label class="hr-hint" for="wpVd" style="margin:0">' + t('wpValue') + '</label><input type="date" id="wpVd" value="' + riyadhToday() + '"><button type="button" class="btn btn-line btn-sm" id="wpBk"' + (r.errors ? ' disabled' : '') + '>' + ph('bank') + t('wpBankFile') + '</button></div><p class="cp-note">' + ph('info') + t('wpFmtNote') + '</p>';
      if (bad.length) h += '<h3 class="hr-sub">' + t('wpProblems') + '</h3><div class="list">' + bad.map(function(x){ return '<div class="row"><div class="main"><b>' + esc(x.nameAr || x.name) + '</b><small><bdi>' + esc(x.empNo) + '</bdi> · ' + x.problems.map(function(p){ return t('wp_' + p); }).join('، ') + '</small></div></div>'; }).join('') + '</div>';
      if (r.skipped && r.skipped.length) h += '<h3 class="hr-sub">' + t('wpSkipped') + '</h3><p class="hr-hint">' + r.skipped.map(function(x){ return esc(x.name) + ' (' + esc(x.empNo) + ')'; }).join('، ') + '</p>';
      box.innerHTML = h;
      var msg = function(x){ if (!x.ok) toast(errText(x.error)); wpsView(el); };
      $$('[data-step]', box).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('wpsStep', { id: cur, step: b.dataset.step }).then(msg); }; });
      var uf = $('#wpUpF', box); if (uf) uf.onsubmit = function(ev){ ev.preventDefault(); api('wpsStep', { id: cur, step: 'uploaded', bankRef: this.elements.ref.value }).then(msg); };
      var bk = $('#wpBk', box); if (bk) bk.onclick = function(){ bk.disabled = true; api('wpsFile', { id: cur, format: $('#wpFmt', box).value, valueDate: $('#wpVd', box).value }).then(function(x){ bk.disabled = false;
        if (!x.ok || !x.layout) return toast(errText(x.error || 'bad_value'));
        if (x.layout.missing.length) return toast(t('wpMissing') + ' ' + x.layout.missing.map(function(k){ return t('wpMissing_' + k); }).join('، '));
        loadScript('js/journal.js').then(function(){ Journal.bankFile(x.layout); }, function(){ toast(errText('network')); }); }); };
      $('#wpX', box).onclick = function(){ xlsxLib().then(function(){ wpsXlsx(r); }, function(){ toast(errText('network')); }); };
    });
  });
}
function wpsXlsx(r){
  var X = window.XLSX, head = ['Employee Name', 'Employee Name (Arabic)', 'ID / Iqama Number', 'Nationality', 'Bank Code', 'Bank', 'IBAN', 'Basic Salary', 'Housing Allowance', 'Other Earnings', 'Deductions', 'Net Salary', 'Employee No.', 'Payslip'];
  var aoa = [head].concat(r.rows.map(function(x){ return [x.name, x.nameAr, x.idNumber, x.nationality, x.bankCode, x.bank, x.iban, x.basic, x.housing, x.other, x.deductions, x.net, x.empNo, x.payslip]; }));
  var ws = X.utils.aoa_to_sheet(aoa), last = aoa.length;
  ['H', 'I', 'J', 'K', 'L'].forEach(function(c){ for (var i = 2; i <= last; i++) if (ws[c + i]) ws[c + i].z = '#,##0.00'; ws[c + (last + 1)] = { t: 'n', f: 'SUM(' + c + '2:' + c + last + ')', v: r.rows.reduce(function(s, x){ return s + (Number(x[{ H: 'basic', I: 'housing', J: 'other', K: 'deductions', L: 'net' }[c]]) || 0); }, 0), z: '#,##0.00' }; });
  ws['A' + (last + 1)] = { t: 's', v: 'Total' }; ws['!ref'] = 'A1:N' + (last + 1);
  ws['!cols'] = head.map(function(h, i){ return { wch: [26, 26, 14, 8, 8, 20, 28, 12, 12, 12, 12, 12, 10, 16][i] }; });
  var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'WPS');
  var info = X.utils.aoa_to_sheet([['Run', r.run.ref], ['Month', r.run.month], ['Rows', r.rows.length], ['Total net', r.total], ['Upload due', r.due], ['Note', t('wpTemplate')]]);
  X.utils.book_append_sheet(wb, info, 'Info');
  X.writeFile(wb, 'WPS_' + r.run.month + '_' + r.run.ref + '.xlsx');
}

// ---------------- reconciliation ----------------
var ID_HINTS = /هوية|إقامة|اقامة|السجل|national|iqama|id\s*(no|number)?$|^id$/i, WAGE_HINTS = /أجر|اجر|راتب|الأساسي|wage|salary|basic|contribut/i;
function reconView(el){
  var d = new Date(riyadhToday() + 'T00:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1);
  el.innerHTML = '<div class="cp-box"><p class="cp-note" style="margin-top:0">' + ph('info') + t('rcLead') + '</p><form class="form" id="rcF"><div class="two"><div class="field"><label>' + t('rcSource') + '</label><select name="source"><option value="gosi">' + t('rcGosi') + '</option><option value="qiwa">' + t('rcQiwa') + '</option></select></div>' +
    '<div class="field"><label>' + t('rcMonth') + '</label><input type="month" name="month" value="' + d.toISOString().slice(0, 7) + '" required></div></div>' +
    '<div class="field"><label>' + t('rcFile') + '</label><input type="file" name="file" accept=".xlsx,.xls,.csv" required></div><div id="rcMap"></div><p class="hr-bad" id="rcE"></p>' +
    '<div class="btnrow"><button type="submit" class="btn btn-dark" disabled id="rcGo">' + ph('scales') + t('rcUpload') + '</button></div></form></div><div id="rcRes"></div><h3 class="hr-sub">' + t('rcHistory') + '</h3><div id="rcH"></div>';
  var f = $('#rcF', el), sheet = null;
  f.elements.file.onchange = function(){
    var file = this.files[0]; if (!file) return;
    xlsxLib().then(function(){
      var rd = new FileReader();
      rd.onload = function(){
        try {
          var wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' }), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
          var hi = 0; for (var i = 0; i < Math.min(10, rows.length); i++) if (rows[i].filter(String).length >= 2) { hi = i; break; }
          var head = rows[hi].map(String);
          sheet = { head: head, rows: rows.slice(hi + 1).filter(function(r){ return r.some(String); }) };
          var guess = function(re){ for (var k = 0; k < head.length; k++) if (re.test(head[k].trim())) return k; return ''; };
          var opts = function(sel){ return '<option value="">' + t('rcPick') + '</option>' + head.map(function(h, k){ return '<option value="' + k + '"' + (String(sel) === String(k) ? ' selected' : '') + '>' + esc(h || ('#' + (k + 1))) + '</option>'; }).join(''); };
          $('#rcMap', el).innerHTML = '<div class="two"><div class="field"><label>' + t('rcIdCol') + '</label><select name="idc">' + opts(guess(ID_HINTS)) + '</select></div><div class="field"><label>' + t('rcWageCol') + '</label><select name="wc">' + opts(guess(WAGE_HINTS)) + '</select></div></div><p class="hr-hint">' + sheet.rows.length + ' ' + t('rcRows') + '</p>';
          $('#rcGo', el).disabled = false;
        } catch (e) { $('#rcE', el).textContent = errText('bad_file'); }
      };
      rd.readAsArrayBuffer(file);
    });
  };
  f.onsubmit = function(ev){
    ev.preventDefault(); if (!sheet) return;
    var ic = f.elements.idc.value, wc = f.elements.wc.value;
    if (ic === '' || wc === '') return $('#rcE', el).textContent = errText('missing_fields');
    var rows = sheet.rows.map(function(r){ return { id: String(r[ic]).replace(/\D/g, ''), wage: Number(String(r[wc]).replace(/[^\d.]/g, '')) || 0 }; }).filter(function(r){ return r.id; });
    var btn = $('#rcGo', el); btn.disabled = true;
    api('reconUpload', { source: f.elements.source.value, month: f.elements.month.value, rows: rows }).then(function(r){
      btn.disabled = false;
      if (!r.ok) return $('#rcE', el).textContent = errText(r.error);
      result($('#rcRes', el), r.recon); history($('#rcH', el));
    });
  };
  history($('#rcH', el));
}
function result(box, x){
  var V = window.Viz, tb = function(list, cols){ return V.tbl(cols.map(function(c){ return c[0]; }), list.map(function(m){ return cols.map(function(c){ return c[1](m); }); })); };
  box.innerHTML = '<div class="cp-box"><h3 class="hr-sub" style="margin-top:0">' + esc(x.ref) + ' · ' + esc(monthName(x.month)) + ' · ' + t('rc_' + x.status) + '</h3>' +
    '<div class="db-tiles">' + V.tile(t('rcMatched'), V.n1(x.matched, 0), plural(x.total, 'rows'), null, true, true) + V.tile(t('rcMism'), '<span class="db-status">' + (x.mismatches.length ? ph('warning-circle') + ' ' : '') + x.mismatches.length + '</span>', '') +
    V.tile(t('rcMissing'), V.n1(x.missing.length, 0), '') + V.tile(t('rcUnknown'), V.n1(x.unknown.length, 0), '') + '</div>' +
    (x.mismatches.length ? tb(x.mismatches, [[t('hrName'), function(m){ return esc(m.name) + ' <small>' + esc(m.empNo) + '</small>'; }], [t('rcOurs'), function(m){ return m.ours == null ? '-' : money(m.ours); }], [t('rcTheirs'), function(m){ return money(m.theirs); }], [t('rcDiff'), function(m){ return m.diff == null ? '-' : money(m.diff); }]]) : '') +
    (x.missing.length ? '<h4 class="hr-sub">' + t('rcMissing') + '</h4><p class="hr-hint">' + x.missing.map(function(m){ return esc(m.name) + ' (' + esc(m.empNo) + ')'; }).join('، ') + '</p>' : '') +
    (x.unknown.length ? '<h4 class="hr-sub">' + t('rcUnknown') + '</h4><p class="hr-hint" dir="ltr">' + x.unknown.map(function(m){ return esc(m.id); }).join(', ') + '</p>' : '') + '</div>';
  V.wire(box);
}
function history(el){
  busy(el);
  api('reconList', {}, true).then(function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    el.innerHTML = r.rows.length ? '<div class="list">' + r.rows.map(function(x, i){ return '<div class="row"><div class="main"><b>' + esc(x.ref) + ' · ' + esc(monthName(x.month)) + ' · ' + (x.source === 'gosi' ? 'GOSI' : 'Qiwa') + '</b><small>' + t('rcMatched') + ' ' + x.matched + ' · ' + t('rcMism') + ' ' + x.mismatches.length + (x.note ? ' · ' + esc(x.note) : '') + '</small></div>' +
      '<span class="chip ' + (x.status === 'open' ? 'absent' : 'in') + '">' + t('rc_' + x.status) + '</span>' + (x.status === 'open' ? ' <button type="button" class="btn btn-line btn-sm" data-rs="' + i + '">' + t('rcResolve') + '</button>' : '') + ' <button type="button" class="btn btn-line btn-sm" data-rv="' + i + '">' + ph('eye') + '</button></div>'; }).join('') + '</div>' : '<p class="hr-hint">-</p>';
    $$('[data-rv]', el).forEach(function(b){ b.onclick = function(){ var box = el.parentNode.querySelector('#rcRes'); result(box, r.rows[b.dataset.rv]); box.scrollIntoView({ block: 'start' }); }; });
    $$('[data-rs]', el).forEach(function(b){ b.onclick = function(){
      var x = r.rows[b.dataset.rs], d = drawer('<h3>' + t('rcResolve') + '</h3><p class="hr-hint">' + esc(x.ref) + ' · ' + x.mismatches.length + ' ' + t('rcMism') + '</p><form class="form" id="rsF"><div class="field"><label>' + t('rcNote') + '</label><textarea name="n" rows="3" required maxlength="500"></textarea></div><p class="hr-bad" id="rsE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('rcResolve') + '</button></div></form>');
      $('#rsF', d).onsubmit = function(ev){ ev.preventDefault(); api('reconResolve', { id: x.id, note: this.elements.n.value }).then(function(y){ if (!y.ok) return $('#rsE', d).textContent = errText(y.error); d.remove(); history(el); }); };
    }; });
  });
}

// ---------------- delegation (managers, from the inbox) ----------------
function delegations(){
  var d = drawer('<h3>' + t('dgTitle') + '</h3><p class="hr-hint">' + t('dgLead') + '</p><div id="dgB"><span class="sk"></span></div>');
  var el = $('#dgB', d);
  function draw(){
    api('delegationList', {}, true).then(function(r){
      if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
      var st = function(x){ return x.status === 'revoked' ? t('dgRevoked') : x.active ? t('dgActive') : x.toDate < riyadhToday() ? t('dgEnded') : t('dgActive'); };
      var list = r.rows.length ? '<div class="list">' + r.rows.map(function(x){ var mine = x.from && x.from.id === S.me.id;
        return '<div class="row"><div class="main"><b>' + (mine ? t('dgGiven') + ': ' + esc(x.to ? x.to.name : '') : t('dgReceived') + ': ' + esc(x.from ? x.from.name : '')) + '</b><small>' + fmt(x.fromDate) + ' - ' + fmt(x.toDate) + (x.reason ? ' · ' + esc(x.reason) : '') + ' · <bdi>' + esc(x.ref) + '</bdi></small></div>' +
          '<span class="chip ' + (x.active ? 'in' : '') + '">' + st(x) + '</span>' + ((mine || roles().hr) && x.status === 'active' && x.toDate >= riyadhToday() ? ' <button type="button" class="btn btn-line btn-sm" data-rv="' + x.id + '">' + t('dgRevoke') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('dgNone') + '</p>';
      var form = r.canDelegate ? '<form class="form" id="dgF" style="margin-top:14px"><div class="field"><label>' + t('dgTo') + '</label><select name="to" required><option value="">-</option>' + r.people.map(function(p){ return '<option value="' + esc(p.id) + '">' + esc(p.name + ' (' + p.empNo + ')') + '</option>'; }).join('') + '</select></div>' +
        '<div class="two"><div class="field"><label>' + t('dgFrom') + '</label><input type="date" name="a" value="' + riyadhToday() + '" required></div><div class="field"><label>' + t('dgUntil') + '</label><input type="date" name="b" required></div></div>' +
        '<div class="field"><label>' + t('dgReason') + '</label><input name="r" maxlength="300"></div><p class="hr-bad" id="dgE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('handshake') + t('dgSave') + '</button></div></form>' : '';
      el.innerHTML = list + form;
      $$('[data-rv]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('delegationRevoke', { id: b.dataset.rv }).then(function(x){ if (!x.ok) toast(errText(x.error)); draw(); }); }; });
      var f = $('#dgF', el); if (f) f.onsubmit = function(ev){ ev.preventDefault(); api('delegationSave', { delegation: { toEmpId: f.elements.to.value, fromDate: f.elements.a.value, toDate: f.elements.b.value, reason: f.elements.r.value } }).then(function(x){ if (!x.ok) return $('#dgE', el).textContent = errText(x.error); toast(x.delegation.ref); draw(); }); };
    });
  }
  draw();
}
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, manager: false }; }

window.Compliance = { section: section, delegations: delegations };
})();
