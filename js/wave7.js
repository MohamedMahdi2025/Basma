// Wave 7 screens (2026-11-08): payroll budget vs actual with a forecast, the Nitaqat simulator, e-signatures and
// automation rules. Built on the Wave 2 kit (window.W2K). Every rule is enforced on the server (backend/Wave7.gs).
(function(){
'use strict';
var K = window.W2K;
Object.assign(T.ar, {
  w7Budget:'الميزانية مقابل الفعلي', w7BudgetLead:'ميزانية تكلفة الرواتب لكل شهر مقابل ما صُرف فعلا، وتوقّع أين ستنتهي السنة بناء على تكلفة الفرد في آخر ثلاثة أشهر وعدد الموظفين اليوم.',
  w7Year:'السنة', w7Dept:'الإدارة', w7Company:'الشركة كلها', w7Edit:'تعديل الميزانية', w7Annual:'ميزانية السنة', w7Actual:'المصروف حتى الآن', w7Landing:'التوقع لنهاية السنة', w7Gap:'الفرق عن الميزانية',
  w7Month:'الشهر', w7Bud:'الميزانية', w7Act:'الفعلي', w7Fc:'متوقع', w7Var:'الفرق', w7LastYear:'العام الماضي', w7RunRate:'المعدل الشهري المتوقع', w7Fill:'نفس المبلغ لكل الأشهر',
  bs_over:'تتجه لتجاوز الميزانية', bs_on_track:'ضمن الميزانية', bs_under:'أقل من الميزانية', bs_no_budget:'لا توجد ميزانية لهذه السنة', w7ByDept:'حسب الإدارة', w7Used:'المستهلك',
  bb_per_head:'التوقع = تكلفة الفرد × {n} موظفا نشطا', bb_average:'التوقع = متوسط آخر ثلاثة أشهر', bb_none:'لا رواتب مسجلة بعد للتوقع',
  w7Nit:'محاكي نطاقات', w7NitLead:'جرّب قبل أن تقرر: ماذا يحدث لنسبة التوطين الموزونة إذا وظفت أو غادر أحد أو رفعت أجرا. السعودي يُحسب 1 عند أجر أساسي وسكن 4,000 فأكثر، و0.5 من 3,000 إلى 3,999.',
  w7NitNote:'دليل للتخطيط: منصة قوى لها قواعد أخرى (الطلاب، ذوو الإعاقة، الدوام الجزئي، نطاقات النشاط)، وحاسبتها هي المرجع الرسمي.',
  w7Now:'الوضع الحالي', w7After:'بعد السيناريو', w7Target:'المستهدف', w7Need:'سعوديون بوزن كامل لبلوغ المستهدف', w7NoTarget:'حدد نسبة المستهدف في الإعدادات', w7Hires:'تعيينات', w7AddHire:'إضافة تعيين',
  w7Saudi:'سعودي', w7NonSaudi:'غير سعودي', w7Count:'العدد', w7Wage:'الأساسي + السكن', w7Leavers:'مغادرون', w7Raises:'رفع أجور', w7Run:'احسب', w7Cost:'تكلفة شهرية إضافية', w7Wins:'أسرع المكاسب',
  w7WinsLead:'سعوديون يُحسبون نصف أو صفر بسبب الأجر. رفعهم إلى 4,000 يزيد النسبة دون توظيف.', w7WinsAll:'لو رُفعوا جميعا: {p}% بتكلفة {c} شهريا', w7Weight:'الوزن', w7Lift:'الرفع المطلوب', w7Use:'أضف للسيناريو', w7Change:'التغير',
  w7Sign:'التوقيع الإلكتروني', w7SignLead:'اقرأ المستند ووقّعه بكتابة اسمك الكامل كما في ملفك. يُحفظ وقت التوقيع وبصمة النص، فأي تعديل لاحق يظهر عند التحقق.', w7Mine:'مستندات لك', w7Sent:'المرسلة',
  w7New:'مستند للتوقيع', w7Title:'العنوان', w7Body:'نص المستند', w7Kind:'النوع', w7To:'إلى', w7Due:'آخر موعد', w7Send:'إرسال', w7Read:'قراءة وتوقيع', w7Agree:'قرأت المستند وأوافق على ما فيه',
  w7TypeName:'اكتب اسمك الكامل: {n}', w7DoSign:'توقيع', w7Decline:'اعتذار', w7Why:'السبب', w7Verify:'تحقق', w7Valid:'التوقيع سليم والنص لم يتغير', w7Invalid:'تنبيه: النص أو السجل تغيّر بعد التوقيع', w7Seal:'ختم التحقق',
  w7Signed:'وُقّع', w7CancelReq:'إلغاء الطلب', w7NoDocs:'لا مستندات بانتظارك.', w7NoSent:'لم ترسل مستندات بعد.', w7Print:'طباعة', w7SignedBy:'وقّعه', w7At:'في',
  sg_pending:'بانتظار التوقيع', sg_signed:'موقّع', sg_declined:'معتذر', sg_cancelled:'ملغى', sk_contract:'عقد', sk_letter:'خطاب', sk_policy:'سياسة', sk_undertaking:'تعهد', sk_other:'أخرى', w7Overdue:'متأخر',
  w7Auto:'مهام تلقائية', w7AutoLead:'قواعد تعمل وحدها: عند حدث في ملف الموظف تُنشأ مهمة للموارد البشرية أو المدير أو الموظف، مرة واحدة لكل حدث.', w7Todo:'مهامي', w7Rules:'القواعد', w7NewRule:'قاعدة جديدة',
  w7RName:'اسم القاعدة', w7Trig:'عندما', w7Days:'عدد الأيام', w7Who:'من ينفذ', w7Msg:'نص المهمة (يمكن استخدام {name} و{date} و{empNo})', w7RunNow:'شغّل الآن', w7Created:'أُنشئت {n} مهمة', w7Done:'تم', w7Dismiss:'تجاهل',
  w7Pause:'إيقاف', w7Resume:'تشغيل', w7Open:'مفتوحة', w7Closed:'منجزة', w7NoTodo:'لا مهام تلقائية لك.', w7NoRules:'لا قواعد بعد. ابدأ بمتابعة الموظف الجديد أو تجديد العقود.', w7Recent:'آخر ما أُنجز', w7Event:'تاريخ الحدث',
  tr_after_hire:'بعد التعيين بـ', tr_probation_end:'قبل نهاية التجربة بـ', tr_contract_end:'قبل نهاية العقد بـ', tr_id_expiry:'قبل انتهاء الهوية/الإقامة بـ', tr_doc_expiry:'قبل انتهاء مستند بـ', tr_anniversary:'قبل ذكرى التعيين بـ', tr_after_resignation:'بعد الاستقالة بـ',
  au_hr:'الموارد البشرية', au_manager:'المدير المباشر', au_employee:'الموظف نفسه', ar_active:'تعمل', ar_paused:'موقفة', w7DaysUnit:'يوم',
  vwBudget:'الميزانية مقابل الفعلي', vwNitaqat:'محاكي نطاقات', vwSign:'التوقيع الإلكتروني', vwAuto:'المهام التلقائية',
  tk_sign_pending:'مستندات تنتظر توقيعك', tk_auto_task:'مهام تلقائية لك',
  e_name_mismatch:'الاسم لا يطابق الاسم في ملفك.', e_doc_changed:'تغيّر نص المستند. أعد فتحه.', e_cannot_sign_own_request:'لا يمكن توقيع مستند طلبته بنفسك.', e_agree_required:'أكّد أنك قرأت المستند.', e_already_done:'تم اتخاذ إجراء على هذا من قبل.',
  e_bad_trigger:'اختر متى تعمل القاعدة.', e_bad_audience:'اختر من ينفذ المهمة.', e_date_past:'التاريخ في الماضي.', e_bad_days:'الأيام من 0 إلى 365.', e_message_required:'اكتب نص المهمة.', e_body_required:'اكتب نص المستند (20 حرفا على الأقل).', e_people_required:'اختر شخصا واحدا على الأقل.', e_bad_months:'أدخل الأشهر الاثني عشر.'
});
Object.assign(T.en, {
  w7Budget:'Budget vs actual', w7BudgetLead:'Monthly payroll cost budget against what was actually paid, and where the year will land, from the cost per head of the last three months times today\'s headcount.',
  w7Year:'Year', w7Dept:'Department', w7Company:'Whole company', w7Edit:'Edit budget', w7Annual:'Annual budget', w7Actual:'Spent so far', w7Landing:'Year-end forecast', w7Gap:'Against budget',
  w7Month:'Month', w7Bud:'Budget', w7Act:'Actual', w7Fc:'Forecast', w7Var:'Variance', w7LastYear:'Last year', w7RunRate:'Forecast per month', w7Fill:'Same amount every month',
  bs_over:'Heading over budget', bs_on_track:'On budget', bs_under:'Under budget', bs_no_budget:'No budget for this year', w7ByDept:'By department', w7Used:'Used',
  bb_per_head:'Forecast = cost per head x {n} active people', bb_average:'Forecast = average of the last three months', bb_none:'No payroll yet to forecast from',
  w7Nit:'Nitaqat simulator', w7NitLead:'Try it before you decide: what hiring, a departure or a raise does to the weighted Saudization rate. A Saudi counts 1 at basic + housing of 4,000 or more, 0.5 from 3,000 to 3,999.',
  w7NitNote:'A planning guide: Qiwa has more rules (students, people with disabilities, part-time, activity bands), and its calculator is the official figure.',
  w7Now:'Today', w7After:'After the scenario', w7Target:'Target', w7Need:'Full-weight Saudis to reach the target', w7NoTarget:'Set the target in settings', w7Hires:'Hires', w7AddHire:'Add a hire',
  w7Saudi:'Saudi', w7NonSaudi:'Non-Saudi', w7Count:'Count', w7Wage:'Basic + housing', w7Leavers:'Leavers', w7Raises:'Raises', w7Run:'Calculate', w7Cost:'Extra monthly cost', w7Wins:'Quickest wins',
  w7WinsLead:'Saudis who count half or zero because of their wage. Lifting them to 4,000 raises the rate without hiring.', w7WinsAll:'If all are lifted: {p}% for {c} a month', w7Weight:'Weight', w7Lift:'Lift needed', w7Use:'Add to scenario', w7Change:'Change',
  w7Sign:'E-signature', w7SignLead:'Read the document and sign by typing your full name as it is in your file. The time and a fingerprint of the text are kept, so any later edit shows when verified.', w7Mine:'For you', w7Sent:'Sent',
  w7New:'Document to sign', w7Title:'Title', w7Body:'Document text', w7Kind:'Kind', w7To:'To', w7Due:'Due by', w7Send:'Send', w7Read:'Read and sign', w7Agree:'I have read the document and agree to it',
  w7TypeName:'Type your full name: {n}', w7DoSign:'Sign', w7Decline:'Decline', w7Why:'Reason', w7Verify:'Verify', w7Valid:'Signature valid, text unchanged', w7Invalid:'Warning: the text or record changed after signing', w7Seal:'Verification seal',
  w7Signed:'Signed', w7CancelReq:'Cancel request', w7NoDocs:'Nothing waiting for your signature.', w7NoSent:'No documents sent yet.', w7Print:'Print', w7SignedBy:'Signed by', w7At:'at',
  sg_pending:'Waiting', sg_signed:'Signed', sg_declined:'Declined', sg_cancelled:'Cancelled', sk_contract:'Contract', sk_letter:'Letter', sk_policy:'Policy', sk_undertaking:'Undertaking', sk_other:'Other', w7Overdue:'Overdue',
  w7Auto:'Automated tasks', w7AutoLead:'Rules that run by themselves: when something happens in an employee file, a task is created for HR, the manager or the employee, once per event.', w7Todo:'My tasks', w7Rules:'Rules', w7NewRule:'New rule',
  w7RName:'Rule name', w7Trig:'When', w7Days:'Days', w7Who:'Who acts', w7Msg:'Task text ({name}, {date} and {empNo} are filled in)', w7RunNow:'Run now', w7Created:'{n} tasks created', w7Done:'Done', w7Dismiss:'Dismiss',
  w7Pause:'Pause', w7Resume:'Resume', w7Open:'open', w7Closed:'done', w7NoTodo:'No automated tasks for you.', w7NoRules:'No rules yet. Start with a new-hire follow-up or contract renewals.', w7Recent:'Recently done', w7Event:'Event date',
  tr_after_hire:'After hire by', tr_probation_end:'Before probation ends by', tr_contract_end:'Before the contract ends by', tr_id_expiry:'Before the ID / iqama expires by', tr_doc_expiry:'Before a document expires by', tr_anniversary:'Before the work anniversary by', tr_after_resignation:'After resignation by',
  au_hr:'HR', au_manager:'Line manager', au_employee:'The employee', ar_active:'Active', ar_paused:'Paused', w7DaysUnit:'days',
  vwBudget:'Budget vs actual', vwNitaqat:'Nitaqat simulator', vwSign:'E-signature', vwAuto:'Automated tasks',
  tk_sign_pending:'Documents waiting for your signature', tk_auto_task:'Automated tasks for you',
  e_name_mismatch:'The name does not match your file.', e_doc_changed:'The document changed. Open it again.', e_cannot_sign_own_request:'You cannot sign a document you requested.', e_agree_required:'Confirm you read the document.', e_already_done:'This was already acted on.',
  e_bad_trigger:'Choose when the rule runs.', e_bad_audience:'Choose who acts.', e_date_past:'The date is in the past.', e_bad_days:'Days from 0 to 365.', e_message_required:'Write the task text.', e_body_required:'Write the document text (20 characters at least).', e_people_required:'Choose at least one person.', e_bad_months:'Enter all twelve months.'
});
function dt(d){ return d ? K.fmt(d) : '-'; }
function bind(box, sel, fn){ $$(sel, box).forEach(function(b){ b.onclick = function(){ fn(b); }; }); }
function mon(m){ var d = new Date(m + '-01T00:00:00'); return d.toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory', { month: 'short' }); }
function amt(n){ return n == null ? '-' : '<bdi class="num">' + acctFmt(n) + '</bdi>'; }

// ============================================================ budget vs actual
function budgetSection(body){
  var box = K.head(body, 'w7Budget', 'w7BudgetLead'), year = new Date().getFullYear(), dep = '';
  function load(){ K.busy(box); api('budgetView', { year: year, departmentId: dep }, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var T0 = r.totals, mx = Math.max.apply(null, r.months.map(function(m){ return Math.max(m.budget || 0, m.actual || 0, m.forecast || 0); }).concat([1]));
    var stCls = { over: 'absent', on_track: 'in', under: 'in', no_budget: 'off' }[r.status];
    box.innerHTML = '<div class="toolbar"><select id="w7Y">' + K.opts([year - 1, year, year + 1].map(function(y){ return [y, y]; }), r.year) + '</select>' +
      '<select id="w7D">' + K.opts(r.deptList.map(function(d){ return [d.id, K.lang(d.name, d.nameEn)]; }), dep, t('w7Company')) + '</select><span class="sp"></span>' + K.chip(t('bs_' + r.status), stCls) +
      (r.canEdit ? ' <button type="button" class="btn btn-dark btn-sm" id="w7E">' + ph('pencil-simple') + t('w7Edit') + '</button>' : '') + '</div>' +
      K.tiles([[t('w7Annual'), amt(T0.budget)], [t('w7Actual'), amt(T0.actual), T0.usedPct != null ? t('w7Used') + ' ' + T0.usedPct + '%' : ''], [t('w7Landing'), amt(T0.landing), '', r.status === 'over'], [t('w7Gap'), T0.gap == null ? '-' : amt(T0.gap), '', T0.gap > 0]]) +
      '<section class="db-card w7-chart"><div class="w7-bars" dir="ltr">' + r.months.map(function(m, i){
        var v = m.actual != null ? m.actual : m.forecast, h = Math.round((v || 0) / mx * 160), bh = Math.round((m.budget || 0) / mx * 160), over = m.budget && v > m.budget;
        return '<div class="w7-col" style="--i:' + i + '" title="' + esc(mon(m.month)) + ' · ' + t('w7Bud') + ' ' + acctFmt(m.budget) + ' · ' + (m.actual != null ? t('w7Act') : t('w7Fc')) + ' ' + acctFmt(v || 0) + '">' +
          '<div class="w7-stack">' + (bh ? '<span class="w7-bl" style="bottom:' + bh + 'px"></span>' : '') + '<i class="' + (m.actual == null ? 'fc' : over ? 'ov' : 'ok') + '" style="height:' + Math.max(v ? 3 : 0, h) + 'px"></i></div><small>' + esc(mon(m.month)) + '</small></div>'; }).join('') + '</div>' +
        '<p class="w7-leg"><span><i class="ok"></i>' + t('w7Act') + '</span><span><i class="ov"></i>' + t('w7Var') + ' +</span><span><i class="fc"></i>' + t('w7Fc') + '</span><span><i class="bl"></i>' + t('w7Bud') + '</span></p>' +
        '<p class="hr-hint">' + t('bb_' + r.basis).replace('{n}', r.activeHeadcount) + (r.runRate ? ' · ' + t('w7RunRate') + ' ' + amt(r.runRate) : '') + '</p></section>' +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('w7Month') + '</th><th>' + t('w7Bud') + '</th><th>' + t('w7Act') + '</th><th>' + t('w7Fc') + '</th><th>' + t('w7Var') + '</th><th>' + t('w7LastYear') + '</th></tr></thead><tbody>' +
        r.months.map(function(m){ return '<tr><td>' + esc(mon(m.month)) + (m.actual != null && !m.locked ? ' <small class="chip">draft</small>' : '') + '</td><td>' + amt(m.budget) + '</td><td>' + amt(m.actual) + '</td><td>' + amt(m.forecast) + '</td><td class="' + (m.variance > 0 ? 'w7-neg' : '') + '">' + amt(m.variance) + (m.variancePct != null ? ' <small>(' + m.variancePct + '%)</small>' : '') + '</td><td>' + amt(m.lastYear) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (r.departments.length ? '<h3 class="w5-h">' + t('w7ByDept') + '</h3><div class="list">' + r.departments.map(function(d){ var p = d.budget ? Math.round(d.actual / d.budget * 100) : null;
        return '<div class="row"><div class="main"><b>' + esc(K.lang(d.name, d.nameEn) || '-') + '</b><small>' + t('w7Act') + ' ' + amt(d.actual) + K.sep() + t('w7Bud') + ' ' + amt(d.budget) + '</small>' + (p != null ? '<div class="w6-cap"><i style="width:' + Math.min(100, p) + '%;' + (p > 100 ? 'background:#C98500' : '') + '"></i></div>' : '') + '</div>' + (p != null ? '<span class="chip' + (p > 100 ? ' absent' : '') + '">' + p + '%</span>' : '') + '</div>'; }).join('') + '</div>' : '');
    $('#w7Y', box).onchange = function(){ year = +this.value; load(); };
    $('#w7D', box).onchange = function(){ dep = this.value; load(); };
    var eb = $('#w7E', box); if (eb) eb.onclick = function(){
      var f = r.months.map(function(m, i){ return K.fld(esc(mon(m.month)), '<input name="m' + i + '" type="number" min="0" step="0.01" dir="ltr" value="' + (m.budget || '') + '">'); });
      var d = K.formDrawer(t('w7Edit'), (dep ? '' : t('w7Company')) + ' · ' + r.year, K.fld(t('w7Fill'), '<input data-all type="number" min="0" dir="ltr">') + '<div class="w7-mgrid">' + f.join('') + '</div>',
        function(v){ return api('budgetSave', { year: r.year, departmentId: dep, months: r.months.map(function(_, i){ return v['m' + i]; }) }); }, load);
      var all = d && $('[data-all]', d); if (all) all.oninput = function(){ $$('.w7-mgrid input', d).forEach(function(x){ x.value = all.value; }); };
    };
  }); }
  load();
}

// ============================================================ Nitaqat simulator
function nitaqatSection(body){
  var box = K.head(body, 'w7Nit', 'w7NitLead'), sc = { hires: [], leavers: [], raises: [] };
  function pctRing(p, target, label){ var a = Math.max(0, Math.min(100, p)), tg = target ? Math.min(100, target) : null;
    return '<div class="w7-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="tr"/><circle cx="60" cy="60" r="50" class="fg' + (tg != null && p < tg ? ' low' : '') + '" style="stroke-dasharray:' + (a * 3.1416) + ' 400"/>' +
      (tg != null ? '<line x1="60" y1="4" x2="60" y2="18" class="tg" transform="rotate(' + (tg * 3.6) + ' 60 60)"/>' : '') + '</svg><div><b class="num">' + p + '%</b><small>' + label + '</small></div></div>'; }
  function run(){ K.busy(box); api('nitaqatSim', sc, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var b = r.base, s = r.scenario, any = sc.hires.length || sc.leavers.length || sc.raises.length;
    box.innerHTML = '<section class="db-card w7-nit"><div class="w7-rings">' + pctRing(b.pct, r.target, t('w7Now')) + (any ? '<span class="w7-arrow">' + ph(S.lang === 'en' ? 'arrow-right' : 'arrow-left') + '</span>' + pctRing(s.pct, r.target, t('w7After')) : '') + '</div>' +
      '<div class="w7-facts"><div><span>' + t('w7Target') + '</span><b>' + (r.target != null ? r.target + '%' : t('w7NoTarget')) + '</b></div>' +
      '<div><span>' + t('w7Need') + '</span><b class="num">' + ((any ? s.need : b.need) == null ? '-' : (any ? s.need : b.need)) + '</b></div>' +
      (any ? '<div><span>' + t('w7Change') + '</span><b class="num ' + (s.change < 0 ? 'w7-neg' : 'w7-pos') + '">' + (s.change > 0 ? '+' : '') + s.change + '</b></div>' : '') +
      (any && s.monthlyCost != null ? '<div><span>' + t('w7Cost') + '</span><b>' + K.money(s.monthlyCost) + '</b></div>' : '') + '</div>' +
      '<p class="hr-hint">' + b.saudis + ' ' + t('w7Saudi') + ' · ' + b.weighted + ' / ' + b.headcount + (any ? ' → ' + s.weighted + ' / ' + s.headcount : '') + '</p></section>' +
      '<section class="db-card" style="padding:18px"><div class="toolbar"><h3 class="w5-h" style="margin:0">' + t('w7Hires') + '</h3><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="w7AddH">' + ph('plus') + t('w7AddHire') + '</button>' +
        (r.canNames ? ' <button type="button" class="btn btn-line btn-sm" id="w7AddL">' + ph('user-minus') + t('w7Leavers') + '</button>' : '') + '</div>' +
        (sc.hires.length + sc.leavers.length + sc.raises.length ? '<div class="list">' + sc.hires.map(function(h, i){ return '<div class="row"><div class="main"><b>' + h.count + ' × ' + (h.saudi ? t('w7Saudi') : t('w7NonSaudi')) + '</b><small>' + t('w7Wage') + ' ' + amt(h.wage) + '</small></div><button type="button" class="btn btn-line btn-sm" data-rm="hires|' + i + '">' + ph('x') + '</button></div>'; }).join('') +
          sc.leavers.map(function(id, i){ return '<div class="row"><div class="main"><b>' + ph('user-minus') + ' ' + esc(sc.names[id] || id) + '</b></div><button type="button" class="btn btn-line btn-sm" data-rm="leavers|' + i + '">' + ph('x') + '</button></div>'; }).join('') +
          sc.raises.map(function(x, i){ return '<div class="row"><div class="main"><b>' + ph('trend-up') + ' ' + esc(sc.names[x.empId] || '') + '</b><small>' + t('w7Wage') + ' → ' + amt(x.wage) + '</small></div><button type="button" class="btn btn-line btn-sm" data-rm="raises|' + i + '">' + ph('x') + '</button></div>'; }).join('') + '</div>' : '') + '</section>' +
      (r.quickWins.count ? '<section class="db-card" style="padding:18px;margin-top:14px"><h3 class="w5-h" style="margin-top:0">' + ph('lightning') + ' ' + t('w7Wins') + '</h3><p class="hr-hint">' + t('w7WinsLead') + ' ' +
        t('w7WinsAll').replace('{p}', r.quickWins.pctIfAll).replace('{c}', acctFmt(r.quickWins.monthlyCost)) + '</p>' +
        (r.quickWins.rows.length ? '<div class="list">' + r.quickWins.rows.map(function(w){ var on = sc.raises.some(function(x){ return x.empId === w.emp.id; });
          return '<div class="row"><div class="main"><b>' + K.empLine(w.emp) + '</b><small>' + t('w7Weight') + ' ' + w.weight + K.sep() + t('w7Wage') + ' ' + amt(w.wage) + K.sep() + t('w7Lift') + ' ' + amt(w.monthlyCost) + '</small></div>' +
            (on ? K.chip('✓', 'in') : '<button type="button" class="btn btn-dark btn-sm" data-win="' + esc(w.emp.id) + '" data-n="' + esc(w.emp.name) + '">' + t('w7Use') + '</button>') + '</div>'; }).join('') + '</div>' : '') + '</section>' : '') +
      '<p class="hr-hint" style="margin-top:12px">' + ph('info') + ' ' + t('w7NitNote') + '</p>';
    $('#w7AddH', box).onclick = function(){ K.formDrawer(t('w7AddHire'), '', K.two(K.fld(t('w7Count'), '<input name="count" type="number" min="1" max="500" value="1" required>'), K.fld(t('w7Wage'), '<input name="wage" type="number" min="0" value="4000" required dir="ltr">')) + K.chk('saudi', t('w7Saudi'), true),
      function(v){ sc.hires.push({ count: +v.count, wage: +v.wage, saudi: !!v.saudi }); return Promise.resolve({ ok: true }); }, run, t('w7Run')); };
    var lb = $('#w7AddL', box); if (lb) lb.onclick = function(){ K.people(function(P){ K.formDrawer(t('w7Leavers'), '', K.fld(t('w7Leavers'), '<select name="id" required>' + K.empOpts(P.rows) + '</select>'),
      function(v){ if (sc.leavers.indexOf(v.id) < 0) { sc.leavers.push(v.id); var p = P.rows.filter(function(x){ return x.id === v.id; })[0]; sc.names[v.id] = p ? p.name : v.id; } return Promise.resolve({ ok: true }); }, run, t('w7Run')); }); };
    bind(box, '[data-rm]', function(x){ var p = x.dataset.rm.split('|'); sc[p[0]].splice(+p[1], 1); run(); });
    bind(box, '[data-win]', function(x){ sc.raises.push({ empId: x.dataset.win, wage: 4000 }); sc.names[x.dataset.win] = x.dataset.n; run(); });
  }); }
  sc.names = {}; run();
}

// ============================================================ e-signature
function signSection(body){
  var box = K.head(body, 'w7Sign', 'w7SignLead'), tab = 'mine';
  var cls = { pending: 'late', signed: 'in', declined: 'absent', cancelled: 'off' };
  function row(x, mine){
    var b = '';
    if (mine && x.status === 'pending') b = '<button type="button" class="btn btn-dark btn-sm" data-read="' + esc(x.id) + '">' + ph('signature') + t('w7Read') + '</button>';
    if (mine && x.status === 'signed') b = '<button type="button" class="btn btn-line btn-sm" data-read="' + esc(x.id) + '">' + ph('file-text') + t('w7Print') + '</button>';
    if (!mine && x.status === 'pending') b = '<button type="button" class="btn btn-line btn-sm" data-cancel="' + esc(x.id) + '">' + t('w7CancelReq') + '</button>';
    if (x.status === 'signed') b += ' <button type="button" class="btn btn-line btn-sm" data-ver="' + esc(x.ref) + '">' + ph('seal-check') + t('w7Verify') + '</button>';
    return '<div class="row"><div class="main"><b>' + esc(x.title) + '</b><small><bdi class="num">' + esc(x.ref) + '</bdi>' + K.sep() + t('sk_' + x.kind) + K.sep() + (mine ? K.empLine(x.requestedBy) : K.empLine(x.emp)) + K.sep() + dt(x.requestedAt) +
      (x.dueDate ? K.sep() + t('w7Due') + ' ' + dt(x.dueDate) : '') + (x.signedAt ? K.sep() + t('w7Signed') + ' ' + dt(x.signedAt) : '') + '</small>' + (x.declineNote ? '<small>' + t('w7Why') + ': ' + esc(x.declineNote) + '</small>' : '') + '</div>' +
      K.chip(x.overdue ? t('w7Overdue') : t('sg_' + x.status), x.overdue ? 'absent' : cls[x.status]) + (b ? '<div class="btnrow">' + b + '</div>' : '') + '</div>';
  }
  function load(){ K.busy(box); api('signList', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var pend = r.mine.filter(function(x){ return x.status === 'pending'; }).length;
    box.innerHTML = '<div class="toolbar">' + (r.isHr ? '<div class="v2-views" role="tablist"><button type="button" role="tab" data-tab="mine" aria-selected="' + (tab === 'mine') + '">' + t('w7Mine') + (pend ? ' <span class="cnt">' + pend + '</span>' : '') + '</button><button type="button" role="tab" data-tab="sent" aria-selected="' + (tab === 'sent') + '">' + t('w7Sent') + '</button></div>' : '') +
      '<span class="sp"></span>' + (r.isHr ? '<button type="button" class="btn btn-dark btn-sm" id="w7NewS">' + ph('plus') + t('w7New') + '</button>' : '') + '</div>' +
      (tab === 'mine' ? (r.mine.length ? '<div class="list">' + r.mine.map(function(x){ return row(x, true); }).join('') + '</div>' : K.empty('signature', t('w7NoDocs')))
        : (r.sent.length ? '<div class="list">' + r.sent.map(function(x){ return row(x, false); }).join('') + '</div>' : K.empty('paper-plane-tilt', t('w7NoSent'))));
    bind(box, '[data-tab]', function(b){ tab = b.dataset.tab; load(); });
    var nb = $('#w7NewS', box); if (nb) nb.onclick = function(){ K.people(function(P){
      var d = K.formDrawer(t('w7New'), '', K.fld(t('w7Title'), '<input name="title" required maxlength="160">') + K.two(K.fld(t('w7Kind'), '<select name="kind">' + K.opts(['contract', 'letter', 'policy', 'undertaking', 'other'].map(function(k){ return [k, t('sk_' + k)]; }), 'policy') + '</select>'), K.fld(t('w7Due'), '<input type="date" name="dueDate">')) +
        K.fld(t('w7Body'), '<textarea name="body" rows="9" required minlength="20" maxlength="20000"></textarea>') + K.fld(t('w7To'), '<select data-to multiple size="8" required>' + K.empOpts(P.rows.filter(function(p){ return p.id !== S.me.id; })) + '</select>'),
        function(v){ var sel = $('[data-to]', d); return api('signRequest', { doc: { title: v.title, kind: v.kind, dueDate: v.dueDate, body: v.body }, empIds: Array.prototype.slice.call(sel.selectedOptions).map(function(o){ return o.value; }) }); }, load, t('w7Send')); }); };
    bind(box, '[data-read]', function(b){ var x = r.mine.filter(function(m){ return m.id === b.dataset.read; })[0]; if (x) readDoc(x, r.myName); });
    bind(box, '[data-cancel]', function(b){ api('signCancel', { id: b.dataset.cancel }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); });
    bind(box, '[data-ver]', function(b){ api('signVerify', { ref: b.dataset.ver }, true).then(function(v){ if (!v.ok) return toast(errText(v.error));
      drawer('<h3>' + t('w7Verify') + '</h3><div class="w7-ver ' + (v.valid ? 'ok' : 'no') + '">' + ph(v.valid ? 'seal-check' : 'warning', 'duotone') + '<b>' + t(v.valid ? 'w7Valid' : 'w7Invalid') + '</b><small><bdi class="num">' + esc(v.ref) + '</bdi> · ' + K.empLine(v.signer) + ' · ' + dt(v.signedAt) + '</small></div>'); }); });
  }); }
  function readDoc(x, myName){
    var signed = x.status === 'signed';
    var d = drawer('<h3>' + esc(x.title) + '</h3><p class="hr-hint"><bdi class="num">' + esc(x.ref) + '</bdi> · ' + t('sk_' + x.kind) + '</p><div class="w7-doc">' + esc(x.body).replace(/\n/g, '<br>') + '</div>' +
      (signed ? '<div class="w7-ver ok">' + ph('signature', 'duotone') + '<b>' + t('w7SignedBy') + ' ' + esc(x.signedName) + '</b><small>' + t('w7At') + ' ' + esc(new Date(x.signedAt).toLocaleString()) + '</small><small dir="ltr" class="num">' + t('w7Seal') + ': ' + esc(String(x.seal).slice(0, 24)) + '…</small></div>' +
        '<div class="btnrow"><button type="button" class="btn btn-line" id="w7P">' + ph('printer') + t('w7Print') + '</button></div>'
      : '<form class="form" id="w7SF">' + K.chk('agree', t('w7Agree'), false) + K.fld(t('w7TypeName').replace('{n}', esc(myName)), '<input name="name" required autocomplete="off" maxlength="120">') +
        '<p class="hr-bad" id="w7SE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('signature') + t('w7DoSign') + '</button><button type="button" class="btn btn-line" id="w7Dec">' + t('w7Decline') + '</button></div></form>'));
    if (signed) { $('#w7P', d).onclick = function(){ var w = window.open('', '_blank'); if (!w) return; w.document.write('<html dir="' + (S.lang === 'en' ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc(x.ref) + '</title><style>body{font:15px/1.8 system-ui;max-width:720px;margin:40px auto;padding:0 20px}h1{font-size:20px}.s{margin-top:40px;padding-top:12px;border-top:1px solid #999;font-size:13px}</style></head><body><h1>' + esc(x.title) + '</h1><p>' + esc(x.body).replace(/\n/g, '<br>') + '</p><div class="s">' + t('w7SignedBy') + ': ' + esc(x.signedName) + '<br>' + esc(new Date(x.signedAt).toLocaleString()) + '<br>' + esc(x.ref) + '<br><span dir="ltr">SHA-256 ' + esc(x.docHash) + '</span><br><span dir="ltr">' + t('w7Seal') + ' ' + esc(x.seal) + '</span></div></body></html>'); w.document.close(); w.print(); }; return; }
    var f = $('#w7SF', d);
    f.onsubmit = function(ev){ ev.preventDefault(); var v = K.formVals(f), e = $('#w7SE', d);
      if (!v.agree) { e.textContent = errText('agree_required'); return; }
      api('signDoc', { id: x.id, agree: true, docHash: x.docHash, name: v.name }).then(function(res){ if (!res.ok) { e.textContent = errText(res.error); return; } d.remove(); toast(t('w7Signed')); K.refreshTasks(); signSection(body); }); };
    $('#w7Dec', d).onclick = function(){ d.remove(); K.formDrawer(t('w7Decline'), esc(x.title), K.fld(t('w7Why'), '<input name="note" required maxlength="500">'), function(v){ return api('signDecline', { id: x.id, note: v.note }); }, function(){ K.refreshTasks(); signSection(body); }); };
  }
  load();
}

// ============================================================ automation rules
var TRIGS = ['after_hire', 'probation_end', 'contract_end', 'id_expiry', 'doc_expiry', 'anniversary', 'after_resignation'];
function autoSection(body){
  var box = K.head(body, 'w7Auto', 'w7AutoLead');
  function ruleForm(r0, after){ r0 = r0 || {};
    K.formDrawer(r0.id ? r0.name : t('w7NewRule'), '', K.fld(t('w7RName'), '<input name="name" required maxlength="120" value="' + esc(r0.name || '') + '">') +
      K.two(K.fld(t('w7Trig'), '<select name="trigger" required>' + K.opts(TRIGS.map(function(k){ return [k, t('tr_' + k)]; }), r0.trigger || 'after_hire') + '</select>'), K.fld(t('w7Days'), '<input name="days" type="number" min="0" max="365" required value="' + (r0.days != null ? r0.days : 3) + '">')) +
      K.fld(t('w7Who'), '<select name="audience">' + K.opts(['hr', 'manager', 'employee'].map(function(k){ return [k, t('au_' + k)]; }), r0.audience || 'hr') + '</select>') +
      K.fld(t('w7Msg'), '<input name="message" required maxlength="300" value="' + esc(r0.message || '') + '">'),
      function(v){ return api('autoRuleSave', { rule: Object.assign({ id: r0.id, status: r0.status }, v) }); }, after); }
  function load(){ K.busy(box); api('autoHub', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var task = function(x){ return '<div class="row"><div class="main"><b>' + esc(x.title) + '</b><small>' + esc(x.rule) + K.sep() + K.empLine(x.emp) + K.sep() + t('w7Event') + ' ' + dt(x.eventDate) + K.sep() + t('w7Due') + ' ' + dt(x.dueDate) + '</small></div>' +
      (x.overdue ? K.chip(t('w7Overdue'), 'absent') : '') + (x.canAct ? '<div class="btnrow"><button type="button" class="btn btn-dark btn-sm" data-done="' + esc(x.id) + '">' + ph('check') + t('w7Done') + '</button>' + (r.isHr ? ' <button type="button" class="btn btn-line btn-sm" data-dis="' + esc(x.id) + '">' + t('w7Dismiss') + '</button>' : '') + '</div>' : '') + '</div>'; };
    box.innerHTML = '<h3 class="w5-h" style="margin-top:0">' + t('w7Todo') + '</h3>' + (r.mine.length ? '<div class="list">' + r.mine.map(task).join('') + '</div>' : K.empty('check-circle', t('w7NoTodo'))) +
      (r.isHr ? '<div class="toolbar" style="margin-top:22px"><h3 class="w5-h" style="margin:0">' + t('w7Rules') + '</h3><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="w7Run">' + ph('play') + t('w7RunNow') + '</button> <button type="button" class="btn btn-dark btn-sm" id="w7NR">' + ph('plus') + t('w7NewRule') + '</button></div>' +
        (r.rules.length ? '<div class="w6-grid">' + r.rules.map(function(x){ return '<div class="db-card w7-rule' + (x.status === 'paused' ? ' off' : '') + '"><span class="w7-ri">' + ph('lightning', 'duotone') + '</span><b>' + esc(x.name) + '</b>' +
          '<small>' + t('tr_' + x.trigger) + ' ' + x.days + ' ' + t('w7DaysUnit') + ' → ' + t('au_' + x.audience) + '</small><p>' + esc(x.message) + '</p><small>' + x.open + ' ' + t('w7Open') + ' · ' + x.done + ' ' + t('w7Closed') + '</small>' +
          '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-edit="' + esc(x.id) + '">' + ph('pencil-simple') + '</button> <button type="button" class="btn btn-line btn-sm" data-tog="' + esc(x.id) + '">' + t(x.status === 'paused' ? 'w7Resume' : 'w7Pause') + '</button>' + K.chip(t('ar_' + x.status), x.status === 'active' ? 'in' : 'off') + '</div></div>'; }).join('') + '</div>' : K.empty('lightning', t('w7NoRules'))) +
        (r.recent.length ? '<h3 class="w5-h">' + t('w7Recent') + '</h3><div class="list">' + r.recent.map(function(x){ return '<div class="row"><div class="main"><b>' + esc(x.title) + '</b><small>' + K.empLine(x.doneBy) + K.sep() + dt(x.doneAt) + '</small></div>' + K.chip(x.status === 'done' ? t('w7Done') : t('w7Dismiss'), x.status === 'done' ? 'in' : 'off') + '</div>'; }).join('') + '</div>' : '') : '');
    bind(box, '[data-done]', function(b){ api('autoTaskStep', { id: b.dataset.done }).then(function(x){ if (!x.ok) return toast(errText(x.error)); K.refreshTasks(); load(); }); });
    bind(box, '[data-dis]', function(b){ api('autoTaskStep', { id: b.dataset.dis, step: 'dismiss' }).then(function(x){ if (!x.ok) return toast(errText(x.error)); K.refreshTasks(); load(); }); });
    if (!r.isHr) return;
    $('#w7NR', box).onclick = function(){ ruleForm(null, load); };
    $('#w7Run', box).onclick = function(){ api('autoRunNow', {}).then(function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('w7Created').replace('{n}', x.created)); K.refreshTasks(); load(); }); };
    bind(box, '[data-edit]', function(b){ ruleForm(r.rules.filter(function(x){ return x.id === b.dataset.edit; })[0], load); });
    bind(box, '[data-tog]', function(b){ var x = r.rules.filter(function(y){ return y.id === b.dataset.tog; })[0]; api('autoRuleSave', { rule: Object.assign({}, x, { status: x.status === 'paused' ? 'active' : 'paused' }) }).then(function(res){ if (!res.ok) return toast(errText(res.error)); load(); }); });
  }); }
  load();
}

var css = '.w7-chart{padding:18px 18px 8px;margin:0 0 16px}.w7-bars{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;align-items:end;height:190px}' +
  '.w7-col{display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}.w7-col small{font-size:11px;color:var(--ink-3)}' +
  '.w7-stack{position:relative;width:100%;height:160px;display:flex;align-items:flex-end;justify-content:center}.w7-stack i{display:block;width:62%;border-radius:6px 6px 2px 2px;transform-origin:bottom;animation:w7Grow var(--d3,320ms) var(--ease-out,ease) backwards;animation-delay:calc(var(--i) * 30ms)}' +
  '.w7-stack i.ok,.w7-leg i.ok{background:#2a78d6}.w7-stack i.ov,.w7-leg i.ov{background:#C98500}.w7-stack i.fc,.w7-leg i.fc{background:repeating-linear-gradient(135deg,color-mix(in srgb,#2a78d6 40%,transparent) 0 4px,transparent 4px 8px);border:1px dashed #2a78d6}' +
  '.w7-bl{position:absolute;left:8%;right:8%;height:0;border-top:2px solid var(--ink-2)}.w7-leg i.bl{height:2px;background:var(--ink-2)}' +
  '.w7-leg{display:flex;flex-wrap:wrap;gap:14px;margin:10px 0 4px;font-size:12px;color:var(--ink-3)}.w7-leg span{display:inline-flex;align-items:center;gap:6px}.w7-leg i{width:12px;height:12px;border-radius:3px;display:inline-block}' +
  '@keyframes w7Grow{from{transform:scaleY(0)}}@media (prefers-reduced-motion:reduce){.w7-stack i{animation:none}}' +
  '.w7-neg{color:#B54708}.w7-pos{color:#2E7D4F}.w7-mgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media (max-width:560px){.w7-mgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
  '.w7-nit{padding:22px;margin:0 0 14px;display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center}@media (max-width:760px){.w7-nit{grid-template-columns:1fr}}.w7-nit > .hr-hint{grid-column:1 / -1;margin:0}' +
  '.w7-rings{display:flex;align-items:center;gap:14px}.w7-arrow{font-size:22px;color:var(--ink-3)}' +
  '.w7-ring{position:relative;width:132px;height:132px}.w7-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.w7-ring circle{fill:none;stroke-width:11}.w7-ring .tr{stroke:var(--well,#EEF1F4)}' +
  '.w7-ring .fg{stroke:#2E7D4F;stroke-linecap:round;transition:stroke-dasharray var(--d3,320ms) var(--ease,ease)}.w7-ring .fg.low{stroke:#C98500}.w7-ring .tg{stroke:var(--ink);stroke-width:3}' +
  '.w7-ring > div{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.w7-ring b{font-size:26px;font-weight:700}.w7-ring small{color:var(--ink-3);font-size:12px}' +
  '.w7-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.w7-facts div{padding:12px 14px;border-radius:var(--r-ctl,10px);background:var(--well,#F3F4F1)}.w7-facts span{display:block;font-size:12px;color:var(--ink-3)}.w7-facts b{font-size:18px}' +
  '.w7-doc{max-height:46vh;overflow:auto;padding:16px 18px;border:1px solid var(--line);border-radius:var(--r-card,12px);background:var(--card);line-height:1.9;margin:0 0 16px;white-space:normal}' +
  '.w7-ver{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:16px;border-radius:var(--r-card,12px);margin:8px 0 14px}.w7-ver i{font-size:28px}.w7-ver.ok{background:var(--ok-bg);color:var(--ok)}.w7-ver.no{background:var(--bad-bg);color:var(--bad)}.w7-ver small{color:inherit;opacity:.85}' +
  '.w7-rule{padding:18px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}.w7-rule p{margin:0;color:var(--ink-2);font-size:13px}.w7-rule small{color:var(--ink-3)}.w7-rule .btnrow{margin-top:auto;align-items:center}.w7-rule.off{opacity:.65}' +
  '.w7-ri{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:color-mix(in srgb,var(--brand) 12%,transparent);color:var(--brand)}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

window.Wave7 = { budget: budgetSection, nitaqat: nitaqatSection, sign: signSection, auto: autoSection };
})();
