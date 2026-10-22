// Performance (Phase 4): "ملفي" cards, the manager's team view and HR's cycle console.
// Scores, stages and who-sees-what are decided by the server (Performance.gs).
(function(){
'use strict';

Object.assign(T.ar, {
  scd_1:'يخفق باستمرار في مسؤوليات أساسية، ويحتاج تحسينا فوريا أو خطة تحسين أداء.', scd_2:'يحقق بعض المسؤوليات الأساسية دون غيرها، ويحتاج خطة تطوير ودعما.',
  scd_3:'يحقق متطلبات الوظيفة باستمرار، مساهم ثابت يعتمد عليه. هذا مستوى أغلب الموظفين.', scd_4:'يتجاوز متطلبات الوظيفة بوضوح، ويضيف قيمة قابلة للقياس ويساند زملاءه.',
  scd_5:'أداء استثنائي في كل الجوانب وأثر كبير على نجاح الشركة. نادر.',
  pdPerfTitle:'دورة التقييم في لمحة', pdRated:'قيموا', pdGuide:'النطاق الصحي', pdInRange:'ضمن النطاق', pdOutRange:'خارج النطاق', pdDistLead:'التوزيع النهائي مقارنة بالنطاق الصحي المعتاد.',
  pdFewRated:'يظهر الحكم على التوزيع بعد اكتمال 5 تقييمات على الأقل.', pdCalibrateHint:'التوزيع خارج النطاق المعتاد: راجع التقييمات في المعايرة وتأكد أن كل تقدير مدعوم بأمثلة.',
  pfTitle:'الأداء', pfMine:'أهدافي وأدائي', pfNoCycle:'لا توجد دورة تقييم مفتوحة الآن.', pfNoKpis:'لم يحدد مديرك أهدافك لهذه الدورة بعد.',
  pfWeight:'الوزن', pfTarget:'المستهدف', pfSelf:'تقييمي الذاتي', pfSelfDone:'أرسلت تقييمك الذاتي', pfLast:'آخر تقييم أداء', pfAck:'اطلعت على التقييم',
  pfAckDone:'تم الاطلاع', pfAckNote:'تعليقك (اختياري)', pfMgrComment:'ملاحظة المدير', pfAdjusted:'عدلته لجنة المعايرة', pf360Tasks:'تقييمات 360 مطلوبة منك',
  pf360Mine:'نتيجة تقييم 360', pf360Open:'عرض النتيجة', pfRate:'قيّم', pfSend:'إرسال', pfSave:'حفظ مسودة', pfSent:'أرسل',
  pfActual:'المتحقق', pfComment:'تعليق', pfComps:'الكفاءات', pfOverall:'النتيجة', pfFinal:'التقييم النهائي', pfKpiScore:'الأهداف', pfCompScore:'الكفاءات',
  st_setup:'الإعداد', st_goals:'تحديد الأهداف', st_midyear:'منتصف العام', st_review:'التقييم', st_calibration:'المعايرة', st_closed:'مغلقة',
  md_on_track:'على المسار', md_at_risk:'في خطر', md_off_track:'متأخر', sc_1:'دون التوقعات بكثير', sc_2:'دون التوقعات', sc_3:'يحقق التوقعات', sc_4:'يفوق التوقعات', sc_5:'استثنائي',
  cp_safety:'السلامة والالتزام بالأنظمة', cp_customer:'خدمة العملاء', cp_teamwork:'العمل الجماعي', cp_ownership:'المسؤولية والالتزام', cp_communication:'التواصل',
  cp_problem_solving:'حل المشكلات', cp_leadership:'القيادة وتطوير الفريق', rel_self:'تقييمك', rel_manager:'المدير', rel_peer:'الزملاء', rel_report:'الفريق', rel_others:'متوسط الآخرين',
  pfHidden:'أقل من 3 إجابات، لا تعرض حفاظا على السرية', pfTeam:'أداء فريقي', pfNew:'دورة جديدة', pfYear:'السنة', pfName:'اسم الدورة', pfKpiW:'وزن الأهداف %',
  pfCreate:'إنشاء الدورة', pfNext:'المرحلة التالية', pfPrev:'المرحلة السابقة', pfLaunch:'إطلاق تقييم 360 للمديرين', pfLaunched:'أرسلت دعوات 360',
  pfProgress:'سير الدورة', pfPeople:'الموظفون', pfKpisSet:'حددت أهدافهم', pfMidDone:'راجعوا منتصف العام', pfSelfDoneK:'قيموا أنفسهم', pfMgrDoneK:'قيمهم المدير', pfAckK:'اطلعوا',
  pfDist:'توزيع التقييمات', pfDept:'متوسط الإدارات', pfEmp:'الموظف', pfStatus:'الحالة', pfCalibrate:'اعتماد', pfNote:'سبب التعديل', pfEditKpis:'أهداف الموظف',
  pfAddKpi:'إضافة هدف', pfKpiTitle:'الهدف', pfMeasure:'طريقة القياس', pfUnit:'الوحدة', pfTotal:'مجموع الأوزان', pfSaveKpis:'حفظ الأهداف', pfMid:'مراجعة منتصف العام',
  pfMgrReview:'تقييم المدير', pfSelfBy:'تقييمه الذاتي', pfDone:'تم', pfPending:'لم يتم', pfNoTeam:'لا يوجد موظفون تديرهم.', pfSelfComment:'تعليقك العام',
  e_kpi_count:'من 3 إلى 7 أهداف.', e_kpi_weight:'وزن كل هدف من 5 إلى 50.', e_kpi_total:'مجموع الأوزان يجب أن يكون 100.', e_stage_closed:'هذه المرحلة غير مفتوحة الآن.',
  e_cannot_edit_own:'لا يمكنك تعديل تقييمك أو أهدافك.', e_incomplete:'أكمل كل البنود أولا.', e_already_submitted:'أرسل من قبل.'
});
Object.assign(T.en, {
  scd_1:'Consistently misses key responsibilities; needs immediate improvement or a performance plan.', scd_2:'Meets some key responsibilities but not all; needs a development plan and support.',
  scd_3:'Consistently meets the job requirements; a solid contributor. Most people sit here.', scd_4:'Clearly exceeds the job requirements; adds measurable value and helps others.',
  scd_5:'Exceptional across every dimension with major impact. Rare.',
  pdPerfTitle:'Review cycle at a glance', pdRated:'rated', pdGuide:'Healthy range', pdInRange:'In range', pdOutRange:'Out of range', pdDistLead:'Final ratings against the usual healthy spread.',
  pdFewRated:'The spread is judged once at least 5 reviews are complete.', pdCalibrateHint:'The spread is outside the usual range: review ratings in calibration and make sure each is backed by examples.',
  pfTitle:'Performance', pfMine:'My goals and performance', pfNoCycle:'No review cycle is open now.', pfNoKpis:'Your manager has not set your goals for this cycle yet.',
  pfWeight:'Weight', pfTarget:'Target', pfSelf:'My self-assessment', pfSelfDone:'Self-assessment sent', pfLast:'Latest performance review', pfAck:'I have read this review',
  pfAckDone:'Acknowledged', pfAckNote:'Your comment (optional)', pfMgrComment:'Manager\'s note', pfAdjusted:'Adjusted in calibration', pf360Tasks:'360 feedback requested from you',
  pf360Mine:'My 360 feedback', pf360Open:'View results', pfRate:'Rate', pfSend:'Send', pfSave:'Save draft', pfSent:'Sent',
  pfActual:'Achieved', pfComment:'Comment', pfComps:'Competencies', pfOverall:'Result', pfFinal:'Final rating', pfKpiScore:'Goals', pfCompScore:'Competencies',
  st_setup:'Set-up', st_goals:'Goal setting', st_midyear:'Mid-year', st_review:'Review', st_calibration:'Calibration', st_closed:'Closed',
  md_on_track:'On track', md_at_risk:'At risk', md_off_track:'Off track', sc_1:'Well below expectations', sc_2:'Below expectations', sc_3:'Meets expectations', sc_4:'Exceeds expectations', sc_5:'Outstanding',
  cp_safety:'Safety and compliance', cp_customer:'Customer service', cp_teamwork:'Teamwork', cp_ownership:'Ownership', cp_communication:'Communication',
  cp_problem_solving:'Problem solving', cp_leadership:'Leadership and developing people', rel_self:'You', rel_manager:'Manager', rel_peer:'Peers', rel_report:'Team', rel_others:'Everyone else',
  pfHidden:'Fewer than 3 answers: hidden to protect anonymity', pfTeam:'My team\'s performance', pfNew:'New cycle', pfYear:'Year', pfName:'Cycle name', pfKpiW:'Goals weight %',
  pfCreate:'Create cycle', pfNext:'Next stage', pfPrev:'Previous stage', pfLaunch:'Launch 360 for managers', pfLaunched:'360 invitations sent',
  pfProgress:'Cycle progress', pfPeople:'Employees', pfKpisSet:'Goals set', pfMidDone:'Mid-year done', pfSelfDoneK:'Self-assessed', pfMgrDoneK:'Manager reviewed', pfAckK:'Acknowledged',
  pfDist:'Rating distribution', pfDept:'Department averages', pfEmp:'Employee', pfStatus:'Status', pfCalibrate:'Confirm', pfNote:'Reason for the change', pfEditKpis:'Employee goals',
  pfAddKpi:'Add goal', pfKpiTitle:'Goal', pfMeasure:'How it is measured', pfUnit:'Unit', pfTotal:'Total weight', pfSaveKpis:'Save goals', pfMid:'Mid-year check-in',
  pfMgrReview:'Manager review', pfSelfBy:'Their self-assessment', pfDone:'Done', pfPending:'Not yet', pfNoTeam:'You do not manage anyone.', pfSelfComment:'Your overall comment',
  e_kpi_count:'3 to 7 goals.', e_kpi_weight:'Each goal weighs 5 to 50.', e_kpi_total:'Weights must add up to 100.', e_stage_closed:'This stage is not open now.',
  e_cannot_edit_own:'You cannot change your own review or goals.', e_incomplete:'Complete every item first.', e_already_submitted:'Already sent.'
});

var css = '' +
'.pf-score{display:inline-flex;gap:4px;flex-wrap:wrap}' +
'.pf-score button{width:38px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-weight:600;font-variant-numeric:tabular-nums}' +
'.pf-score button[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.pf-item{padding:12px 0;border-bottom:1px solid var(--line)}.pf-item:last-child{border-bottom:0}' +
'.pf-item .top{display:flex;align-items:flex-start;gap:12px}.pf-item .top b{flex:1;font-weight:500}.pf-item small{display:block;color:var(--ink-2);font-size:13px}' +
'.pf-item .hint{font-size:12px;color:var(--ink-2);margin-top:4px;min-height:16px}' +
'.pf-rating{display:flex;align-items:center;gap:16px;margin:4px 0 10px}' +
'.pf-rating b{font-size:48px;font-weight:600;line-height:1;color:var(--pine)}' +
'.pf-dots{display:flex;gap:4px}.pf-dots i{width:14px;height:14px;border-radius:50%;background:#E4E0D5}.pf-dots i.on{background:var(--brand)}' +
'.pf-bars{display:grid;gap:8px}' +
'.pf-bar{display:grid;grid-template-columns:minmax(110px,40%) 1fr;gap:12px;align-items:center;font-size:13px}' +
'.pf-bar .track{position:relative;height:22px;background:#F1EEE6;border-radius:6px}' +
'.pf-bar .track i{position:absolute;inset-block:3px;inset-inline-start:0;border-radius:4px;background:var(--brand)}' +
'.pf-bar .track i.s{background:transparent;border:2px solid var(--amber);inset-block:1px}' +
'.pf-bar .track span{position:absolute;inset-inline-end:6px;top:2px;font-size:12px;font-variant-numeric:tabular-nums;color:var(--ink-2)}' +
'.pf-stages{display:flex;gap:4px;margin:4px 0 14px;overflow-x:auto}' +
'.pf-stages span{flex:1;min-width:88px;text-align:center;font-size:13px;padding:8px 6px;border-radius:8px;background:#EFECE3;color:var(--ink-2)}' +
'.pf-stages span.done{background:var(--g-DDEFE0,#DDEFE0);color:var(--g-255B31,#255B31)}.pf-stages span.cur{background:var(--pine);color:var(--cream);font-weight:500}' +
'.pf-dist{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;align-items:end;height:150px;padding:10px 4px 0}' +
'.pf-dist div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;font-size:12px;color:var(--ink-2)}' +
'.pf-dist i{display:block;width:70%;max-width:56px;background:var(--brand);border-radius:6px 6px 0 0;min-height:2px}' +
'.pf-dist b{font-variant-numeric:tabular-nums;color:var(--ink)}' +
'.pf-kpirow{display:grid;grid-template-columns:1fr 90px 34px;gap:8px;align-items:start;padding:8px 0;border-bottom:1px solid var(--line)}' +
'.pf-kpirow .sub{grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}' +
'@media (max-width:600px){.pf-kpirow .sub{grid-template-columns:1fr}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var STAGES = ['setup', 'goals', 'midyear', 'review', 'calibration', 'closed'];
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function num(n){ return n == null ? '-' : Number(n).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }); }
function dots(n){ var h = ''; for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= Math.round(n || 0) ? 'on' : '') + '"></i>'; return '<span class="pf-dots" aria-label="' + n + ' / 5">' + h + '</span>'; }
function picker(name, val){
  var h = '<div class="pf-score" role="radiogroup" data-pick="' + esc(name) + '">';
  for (var i = 1; i <= 5; i++) h += '<button type="button" role="radio" data-v="' + i + '" aria-pressed="' + (Number(val) === i) + '" title="' + t('sc_' + i) + '">' + i + '</button>';
  return h + '</div><div class="hint" data-hint="' + esc(name) + '">' + (val ? scText(val) : '') + '</div>';
}
function scText(v){ return t('sc_' + v) + ': ' + t('scd_' + v);
}
function wirePickers(root){
  $$('[data-pick]', root).forEach(function(g){ $$('button', g).forEach(function(b){ b.onclick = function(){
    $$('button', g).forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); g.dataset.val = b.dataset.v;
    var h = root.querySelector('[data-hint="' + g.dataset.pick + '"]'); if (h) h.textContent = scText(b.dataset.v);
  }; }); var on = g.querySelector('[aria-pressed="true"]'); if (on) g.dataset.val = on.dataset.v; });
}
function picked(root, name){ var g = root.querySelector('[data-pick="' + name + '"]'); return g && g.dataset.val ? Number(g.dataset.val) : null; }
function kpiLine(k, extra){
  return '<div class="pf-item"><div class="top"><b>' + esc(lang(k.titleAr, k.titleEn)) + '</b><span class="chip num">' + k.weight + '%</span></div>' +
    '<small>' + [k.target ? t('pfTarget') + ': ' + esc(k.target) + (k.unit ? ' ' + esc(k.unit) : '') : '', k.measure ? esc(k.measure) : ''].filter(Boolean).join('، ') + '</small>' +
    (k.midStatus ? '<small><span class="chip ' + (k.midStatus === 'on_track' ? 'in' : k.midStatus === 'at_risk' ? 'late' : 'absent') + '">' + t('md_' + k.midStatus) + '</span> ' + esc(k.midNote || '') + '</small>' : '') + (extra || '') + '</div>';
}

// ---------------- "ملفي" ----------------
function myCards(el){
  apiFresh('myPerformance', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.remove(); return; }
    var c = r.cycle, h = '<h3>' + ph('target') + t('pfMine') + (c ? '<span class="sp"></span><span class="chip">' + esc(lang(c.nameAr, c.nameEn)) + '، ' + t('st_' + c.status) + '</span>' : '') + '</h3>';
    if (!c) h += '<p>' + t('pfNoCycle') + '</p>';
    else if (!r.kpis.length) h += '<p>' + t('pfNoKpis') + '</p>';
    else h += r.kpis.map(function(k){ return kpiLine(k); }).join('');
    if (c && c.status === 'review' && r.kpis.length) h += r.review && r.review.selfAt ? '<p class="hr-hint">' + ph('check-circle') + ' ' + t('pfSelfDone') + '</p>' : '<div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="pfSelf">' + ph('pencil-simple-line') + t('pfSelf') + '</button></div>';
    if (r.tasks.length) h += '<h4 class="hr-sub">' + t('pf360Tasks') + '</h4>' + r.tasks.map(function(x){ return '<div class="pf-item"><div class="top"><b>' + esc(x.subject ? x.subject.name : '') + '</b><button type="button" class="btn btn-line btn-sm" data-task="' + x.id + '">' + t('pfRate') + '</button></div><small>' + t('rel_' + x.relation) + '</small></div>'; }).join('');
    if (r.last) {
      var v = r.last.review;
      h += '<h4 class="hr-sub">' + t('pfLast') + ' (' + esc(lang(r.last.cycle.nameAr, r.last.cycle.nameEn)) + ')</h4><div class="pf-rating"><b class="num">' + v.finalRating + '</b><div>' + dots(v.finalRating) + '<small style="display:block;margin-top:4px">' + t('sc_' + v.finalRating) + (v.adjusted ? '، ' + t('pfAdjusted') : '') + '</small></div></div>' +
        (v.mgrComment ? '<p><b style="font-weight:500">' + t('pfMgrComment') + ':</b> ' + esc(v.mgrComment) + '</p>' : '') +
        (v.acknowledgedAt ? '<p class="hr-hint">' + ph('check') + ' ' + t('pfAckDone') + '</p>' : '<div class="form" style="margin-top:8px"><textarea id="pfAckC" placeholder="' + t('pfAckNote') + '" maxlength="1000" style="height:60px"></textarea><div class="btnrow" style="margin:0"><button type="button" class="btn btn-dark btn-sm" id="pfAck" data-rev="' + v.id + '">' + t('pfAck') + '</button></div></div>');
    }
    if (r.my360.length) h += '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="pf360" data-cy="' + r.my360[0].id + '">' + ph('users-four') + t('pf360Mine') + '</button></div>';
    el.innerHTML = h;
    var sb = $('#pfSelf', el); if (sb) sb.onclick = function(){ selfForm(r, function(){ myCards(el); }); };
    $$('[data-task]', el).forEach(function(b){ b.onclick = function(){ feedbackForm(r.tasks.filter(function(x){ return x.id === b.dataset.task; })[0], function(){ myCards(el); }); }; });
    var ab = $('#pfAck', el); if (ab) ab.onclick = function(){ ab.disabled = true; api('reviewAck', { reviewId: ab.dataset.rev, comment: $('#pfAckC', el).value }).then(function(x){ if (!x.ok) { ab.disabled = false; return toast(errText(x.error)); } myCards(el); }); };
    var fb = $('#pf360', el); if (fb) fb.onclick = function(){ results360(fb.dataset.cy, null); };
  });
}

function selfForm(r, done){
  var d = drawer('<h3>' + t('pfSelf') + '</h3><form class="form" id="sf">' + r.kpis.map(function(k){
    return kpiLine(k, '<div class="two" style="margin-top:8px"><div class="field"><label>' + t('pfActual') + '</label><input data-actual="' + k.id + '" value="' + esc(k.actual || '') + '"></div><div class="field"><label>' + t('pfComment') + '</label><input data-kc="' + k.id + '" value="' + esc(k.selfComment || '') + '"></div></div>' + picker('k_' + k.id, k.selfScore));
  }).join('') + '<h4 class="hr-sub">' + t('pfComps') + '</h4>' + r.competencies.map(function(c){ return '<div class="pf-item"><b style="font-weight:500">' + t('cp_' + c) + '</b>' + picker('c_' + c, r.review && r.review.selfComps ? r.review.selfComps[c] : null) + '</div>'; }).join('') +
    '<div class="field"><label>' + t('pfSelfComment') + '</label><textarea name="comment" maxlength="1500">' + esc(r.review && r.review.selfComment || '') + '</textarea></div>' +
    '<div class="err" id="sfErr" style="color:var(--red)"></div><div class="btnrow"><button type="button" class="btn btn-dark" id="sfSend">' + t('pfSend') + '</button><button type="button" class="btn btn-line" id="sfSave">' + t('pfSave') + '</button></div></form>');
  d.querySelector('.panel').classList.add('wide');
  wirePickers(d);
  function send(submit){
    var comps = {}; r.competencies.forEach(function(c){ var v = picked(d, 'c_' + c); if (v) comps[c] = v; });
    var kp = r.kpis.map(function(k){ return { id: k.id, selfScore: picked(d, 'k_' + k.id), actual: d.querySelector('[data-actual="' + k.id + '"]').value, selfComment: d.querySelector('[data-kc="' + k.id + '"]').value }; });
    api('reviewSelf', { cycleId: r.cycle.id, kpis: kp, comps: comps, comment: $('#sf', d).elements.comment.value, submit: submit }).then(function(x){
      if (!x.ok) return $('#sfErr', d).textContent = errText(x.error);
      d.remove(); toast(submit ? t('pfSelfDone') : t('saved')); done();
    });
  }
  $('#sfSend', d).onclick = function(){ send(true); }; $('#sfSave', d).onclick = function(){ send(false); };
}

function feedbackForm(task, done){
  var d = drawer('<h3>' + t('pfRate') + ': ' + esc(task.subject ? task.subject.name : '') + '</h3><p class="hr-hint" style="margin-top:-8px">' + t('rel_' + task.relation) + '، ' + t('pfHidden').split('،')[0] + '</p><form class="form" id="ff">' +
    task.competencies.map(function(c){ return '<div class="pf-item"><b style="font-weight:500">' + t('cp_' + c) + '</b>' + picker('c_' + c, null) + '</div>'; }).join('') +
    '<div class="field"><label>' + t('pfComment') + '</label><textarea name="comment" maxlength="1000"></textarea></div><div class="err" id="ffErr" style="color:var(--red)"></div><div class="btnrow"><button type="button" class="btn btn-dark" id="ffSend">' + t('pfSend') + '</button></div></form>');
  wirePickers(d);
  $('#ffSend', d).onclick = function(){
    var a = {}; task.competencies.forEach(function(c){ var v = picked(d, 'c_' + c); if (v) a[c] = v; });
    api('feedbackSubmit', { id: task.id, answers: a, comment: $('#ff', d).elements.comment.value }).then(function(x){ if (!x.ok) return $('#ffErr', d).textContent = errText(x.error); d.remove(); toast(t('pfSent')); done(); });
  };
}

function results360(cycleId, subjectId){
  var d = drawer('<h3>' + t('pf360Mine') + '</h3><div id="r360"></div>'), el = $('#r360', d);
  api('feedbackResults', { cycleId: cycleId, subjectId: subjectId || undefined }).then(function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var g = r.groups;
    el.innerHTML = '<p class="hr-hint">' + esc(r.subject.name) + '، ' + ['self', 'manager', 'peer', 'report'].map(function(k){ return t('rel_' + k) + ' ' + g[k].n; }).join('، ') + '</p>' +
      '<div class="lv-legend" style="margin-bottom:10px"><span><i style="background:var(--brand)"></i>' + t('rel_others') + '</span><span><i style="background:transparent;border:2px solid var(--amber)"></i>' + t('rel_self') + '</span></div>' +
      '<div class="pf-bars">' + r.competencies.map(function(c){
        var o = r.others[c], s = g.self.shown && g.self.avg ? g.self.avg[c] : null;
        return '<div class="pf-bar"><span>' + t('cp_' + c) + '</span><div class="track">' + (o ? '<i style="width:' + (o / 5 * 100) + '%"></i>' : '') + (s ? '<i class="s" style="width:' + (s / 5 * 100) + '%"></i>' : '') + '<span>' + num(o) + (s ? ' / ' + num(s) : '') + '</span></div></div>';
      }).join('') + '</div>' +
      ['peer', 'report'].filter(function(k){ return g[k].n && !g[k].shown; }).map(function(k){ return '<p class="hr-hint">' + t('rel_' + k) + ': ' + t('pfHidden') + '</p>'; }).join('') +
      (r.comments.length ? '<h4 class="hr-sub">' + t('pfComment') + '</h4>' + r.comments.map(function(x){ return '<p style="margin:0 0 8px;padding:8px 12px;background:var(--paper);border-radius:8px">' + esc(x) + '</p>'; }).join('') : '');
  });
}

// ---------------- console: team (managers) and cycle (HR) ----------------
function section(body, roles){
  if (roles.hr) return hrView(body);
  teamView(body, null);
}

function stagesBar(c){ var i = STAGES.indexOf(c.status); return '<div class="pf-stages">' + STAGES.map(function(s, j){ return '<span class="' + (j < i ? 'done' : j === i ? 'cur' : '') + '">' + t('st_' + s) + '</span>'; }).join('') + '</div>'; }
function statusCell(x){ return [x.kpiCount >= 3 && x.kpiWeight === 100 ? ph('target') : '', x.midDone ? ph('flag') : '', x.selfDone ? ph('user-check') : '', x.mgrDone ? ph('seal-check') : ''].join(' ') || '<span class="hr-hint">' + t('pfPending') + '</span>'; }

function teamView(body, cycleId){
  body.innerHTML = '<div class="hr-h"><h2>' + t('pfTeam') + '</h2></div><div id="pfT"></div>';
  var el = $('#pfT', body); el.innerHTML = '<span class="sk"></span>';
  apiFresh('perfTeam', cycleId ? { cycleId: cycleId } : {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    if (!r.cycle) return el.innerHTML = '<div class="empty">' + ph('target') + '<b>' + t('pfNoCycle') + '</b></div>';
    el.innerHTML = stagesBar(r.cycle) + (r.rows.length ? teamTable(r.rows, r.cycle) : '<div class="empty"><b>' + t('pfNoTeam') + '</b></div>');
    $$('[data-emp]', el).forEach(function(x){ x.onclick = function(){ empDrawer(x.dataset.emp, r.cycle.id, function(){ teamView(body, cycleId); }); }; });
  });
}
function teamTable(rows, cycle, calib){
  return '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('pfEmp') + '</th><th>' + t('pfStatus') + '</th><th class="hr-amt">' + t('pfOverall') + '</th><th class="hr-amt">' + t('pfFinal') + '</th>' + (calib ? '<th></th>' : '') + '</tr></thead><tbody>' +
    rows.map(function(x){ return '<tr class="click" data-emp="' + x.emp.id + '"><td><b style="font-weight:500">' + esc(x.emp.name) + '</b> <small style="color:var(--ink-2)">' + esc(x.emp.department || '') + '</small></td><td>' + statusCell(x) + '</td>' +
      '<td class="hr-amt">' + num(x.overall) + '</td><td class="hr-amt">' + (x.finalRating ? '<b>' + x.finalRating + '</b>' + (x.adjusted ? ' <span class="chip late">' + t('pfAdjusted') + '</span>' : '') : '-') + '</td>' +
      (calib ? '<td onclick="event.stopPropagation()">' + (x.reviewId && x.mgrDone ? '<div class="toolbar" style="margin:0;flex-wrap:nowrap"><select data-cal="' + x.reviewId + '">' + [1, 2, 3, 4, 5].map(function(n){ return '<option value="' + n + '"' + ((x.finalRating || Math.round(x.overall)) === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>' +
        '<input data-note="' + x.reviewId + '" placeholder="' + t('pfNote') + '" style="min-width:140px"><button type="button" class="btn btn-line btn-sm" data-calok="' + x.reviewId + '">' + t('pfCalibrate') + '</button></div>' : '') + '</td>' : '') + '</tr>'; }).join('') +
    '</tbody></table></div>';
}

function hrView(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('pfTitle') + '</h2><select id="pfCy" style="height:38px;border:1px solid var(--line);border-radius:var(--r-s);background:var(--card);padding:0 10px"></select><button type="button" class="btn btn-line btn-sm" id="pfNewB">' + ph('plus') + t('pfNew') + '</button></div><div id="pfH"></div>';
  $('#pfNewB', body).onclick = function(){ newCycle(function(){ hrView(body); }); };
  api('perfCycleList', {}, true).then(function(cl){
    if (!cl.ok) return;
    var sel = $('#pfCy', body);
    if (!cl.rows.length) { sel.remove(); $('#pfH', body).innerHTML = '<div class="empty">' + ph('target') + '<b>' + t('pfNoCycle') + '</b></div>'; return; }
    sel.innerHTML = cl.rows.map(function(c){ return '<option value="' + c.id + '"' + (S.pfCycle === c.id ? ' selected' : '') + '>' + esc(lang(c.nameAr, c.nameEn)) + '</option>'; }).join('');
    S.pfCycle = sel.value; sel.onchange = function(){ S.pfCycle = this.value; hrView(body); };
    overview(body, S.pfCycle);
  });
}
function overview(body, id){
  var el = $('#pfH', body); el.innerHTML = '<span class="sk"></span>';
  api('perfOverview', { cycleId: id }, true).then(function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var c = r.cycle, i = STAGES.indexOf(c.status), p = r.progress, max = Math.max.apply(null, [1, 2, 3, 4, 5].map(function(n){ return r.distribution[n]; }).concat([1]));
    el.innerHTML = stagesBar(c) + '<div class="btnrow" style="margin:0 0 14px">' + (i > 0 ? '<button type="button" class="btn btn-line btn-sm" data-st="' + STAGES[i - 1] + '">' + t('pfPrev') + '</button>' : '') +
      (i < STAGES.length - 1 ? '<button type="button" class="btn btn-dark btn-sm" data-st="' + STAGES[i + 1] + '">' + t('pfNext') + ': ' + t('st_' + STAGES[i + 1]) + '</button>' : '') +
      (c.status !== 'closed' ? '<button type="button" class="btn btn-line btn-sm" id="pfL">' + ph('users-four') + t('pfLaunch') + '</button>' : '') + '</div>' +
      (window.Viz ? perfDash(r) : '') +
      teamTable(r.rows, c, c.status === 'calibration');
    if (window.Viz) Viz.wire(el);
    $$('[data-st]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('perfCycleStage', { id: c.id, status: b.dataset.st }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } overview(body, id); }); }; });
    var lb = $('#pfL', el); if (lb) lb.onclick = function(){ lb.disabled = true; api('feedbackLaunch', { cycleId: c.id }).then(function(x){ lb.disabled = false; if (!x.ok) return toast(errText(x.error)); toast(t('pfLaunched') + ': ' + x.invitations); overview(body, id); }); };
    $$('[data-calok]', el).forEach(function(b){ b.onclick = function(){ var rid = b.dataset.calok; b.disabled = true;
      api('perfCalibrate', { reviewId: rid, finalRating: el.querySelector('[data-cal="' + rid + '"]').value, note: el.querySelector('[data-note="' + rid + '"]').value }).then(function(x){ b.disabled = false; if (!x.ok) return toast(errText(x.error)); toast(t('saved')); overview(body, id); }); }; });
    $$('[data-emp]', el).forEach(function(x){ x.onclick = function(){ empDrawer(x.dataset.emp, c.id, function(){ overview(body, id); }); }; });
  });
}
// Healthy spread of final ratings (performance-review skill): roughly 0-5% / 5-15% / 60-75% / 10-20% / 1-5%.
var GUIDE = { 1: [0, 5], 2: [5, 15], 3: [60, 75], 4: [10, 20], 5: [1, 5] };
/** Cycle progress step by step, the rating spread against the healthy range, and department averages. */
function perfDash(r){
  var V = Viz, p = r.progress, n = p.people || 0, pc = function(x){ return n ? x / n * 100 : 0; };
  var steps = [['pfKpisSet', p.kpisSet], ['pfMidDone', p.midDone], ['pfSelfDoneK', p.selfDone], ['pfMgrDoneK', p.mgrDone], ['pfAckK', p.acknowledged]].map(function(x){
    return { label: t(x[0]), value: pc(x[1]), text: x[1] + ' / ' + n, tip: t(x[0]) + ': ' + x[1] + ' / ' + n + ' (' + V.n1(pc(x[1]), 0) + '%)', gray: !x[1] }; });
  var rated = [1, 2, 3, 4, 5].reduce(function(s, k){ return s + (r.distribution[k] || 0); }, 0);
  var dist = [1, 2, 3, 4, 5].map(function(k){ var share = rated ? r.distribution[k] / rated * 100 : 0, g = GUIDE[k], off = rated >= 5 && (share < g[0] - 0.01 || share > g[1] + 0.01);
    return { label: k + ' ' + t('sc_' + k), value: share, alt: off, text: V.n1(share, 0) + '%', tip: t('sc_' + k) + ': ' + r.distribution[k] + ' (' + V.n1(share, 0) + '%) · ' + t('pdGuide') + ' ' + g[0] + '-' + g[1] + '%' }; });
  var offs = dist.filter(function(d){ return d.alt; }).length;
  var distHtml = '<div class="db-cols">' + dist.map(function(d){ return '<div class="c" tabindex="0" data-tip="' + esc(d.tip) + '"><em>' + (rated ? d.text : '') + '</em><i class="' + (d.alt ? 'alt' : '') + '" style="height:' + d.value + '%"></i><span>' + d.label.split(' ')[0] + '</span></div>'; }).join('') + '</div>' +
    '<div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('pdInRange') + '</span><span><i style="background:var(--s2)"></i>' + t('pdOutRange') + '</span></div>' +
    (rated < 5 ? '<p class="hr-hint">' + t('pdFewRated') + '</p>' : offs ? '<p class="hr-hint"><span class="db-status">' + ph('warning') + ' ' + t('pdCalibrateHint') + '</span></p>' : '');
  var depts = r.departments.filter(function(d){ return d.average != null; }).map(function(d){ return { label: d.department, value: d.average, text: V.n1(d.average, 2), tip: d.department + ': ' + V.n1(d.average, 2) + ' (' + d.rated + '/' + d.people + ')' }; });
  var tiles = V.tile(t('pfPeople'), V.n1(n, 0), t('pdRated') + ': ' + rated, null, true, true) + V.tile(t('pfSelfDoneK'), V.n1(pc(p.selfDone), 0) + '%', '') + V.tile(t('pfMgrDoneK'), V.n1(pc(p.mgrDone), 0) + '%', '') +
    V.tile('360', r.fb360.invited ? V.n1(r.fb360.submitted / r.fb360.invited * 100, 0) + '%' : '-', r.fb360.submitted + ' / ' + r.fb360.invited);
  return V.panel('perf', t('pdPerfTitle'), '<div class="db-tiles">' + tiles + '</div><div class="db-grid three">' +
    V.card('pfs', t('pfProgress'), '', V.hbars(steps, { max: 100 }), V.tbl(['', ''], steps.map(function(s){ return [esc(s.label), s.text]; }))) +
    V.card('pfd', t('pfDist'), t('pdDistLead'), distHtml, V.tbl(['', '%', t('pdGuide')], dist.map(function(d, i){ return [esc(d.label), d.text, GUIDE[i + 1][0] + '-' + GUIDE[i + 1][1] + '%']; }))) +
    V.card('pfdp', t('pfDept'), '', V.hbars(depts, { max: 5 }), V.tbl(['', ''], depts.map(function(d){ return [esc(d.label), d.text]; }))) + '</div>');
}
function newCycle(done){
  var y = new Date().getFullYear();
  var d = drawer('<h3>' + t('pfNew') + '</h3><form class="form" id="ncf"><div class="two"><div class="field"><label>' + t('pfYear') + '</label><input name="year" type="number" value="' + y + '" min="2024" max="2100" required></div>' +
    '<div class="field"><label>' + t('pfKpiW') + '</label><input name="kpiWeight" type="number" value="70" min="0" max="100"></div></div><div class="field"><label>' + t('pfName') + '</label><input name="nameAr" value="تقييم الأداء ' + y + '"></div>' +
    '<div class="err" id="ncE" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('pfCreate') + '</button></div></form>');
  $('#ncf', d).onsubmit = function(ev){ ev.preventDefault(); var f = this; api('perfCycleSave', { cycle: { year: f.elements.year.value, kpiWeight: f.elements.kpiWeight.value, nameAr: f.elements.nameAr.value } }).then(function(x){ if (!x.ok) return $('#ncE', d).textContent = errText(x.error); S.pfCycle = x.cycle.id; d.remove(); done(); }); };
}

/** One employee: set goals (goal stage), mid-year check (mid-year), the manager review (review), and the result. */
function empDrawer(empId, cycleId, done){
  var d = drawer('<div id="ped"><span class="sk"></span></div>'); d.querySelector('.panel').classList.add('wide');
  var el = $('#ped', d);
  api('perfEmp', { empId: empId, cycleId: cycleId }).then(function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var c = r.cycle, st = c.status, h = '<h3>' + esc(r.emp.name) + '</h3><p class="hr-hint" style="margin-top:-8px">' + esc(lang(c.nameAr, c.nameEn)) + '، ' + t('st_' + st) + '</p>';
    if (st === 'setup' || st === 'goals') h += kpiEditor(r.kpis);
    else if (st === 'midyear') h += '<h4 class="hr-sub">' + t('pfMid') + '</h4>' + r.kpis.map(function(k){ return kpiLine(k, '<div class="toolbar" style="margin:8px 0 0"><select data-mid="' + k.id + '">' + ['on_track', 'at_risk', 'off_track'].map(function(m){ return '<option value="' + m + '"' + (k.midStatus === m ? ' selected' : '') + '>' + t('md_' + m) + '</option>'; }).join('') + '</select><input class="grow" data-midn="' + k.id + '" value="' + esc(k.midNote || '') + '" placeholder="' + t('pfComment') + '"><button type="button" class="btn btn-line btn-sm" data-midok="' + k.id + '">' + t('save') + '</button></div>'); }).join('');
    else {
      var v = r.review || {}, editable = st === 'review' && !v.mgrAt;
      h += (v.selfComps ? '<p class="hr-hint">' + t('pfSelfBy') + ': ' + (v.selfAt ? t('pfDone') : t('pfPending')) + (v.selfComment ? '، ' + esc(v.selfComment) : '') + '</p>' : '');
      h += '<h4 class="hr-sub">' + t('pfMgrReview') + '</h4>' + r.kpis.map(function(k){ return kpiLine(k, '<small>' + t('pfActual') + ': ' + esc(k.actual || '-') + '، ' + t('pfSelf') + ': ' + (k.selfScore || '-') + (k.selfComment ? '، ' + esc(k.selfComment) : '') + '</small>' +
        (editable ? picker('k_' + k.id, k.mgrScore) + '<input data-mc="' + k.id + '" value="' + esc(k.mgrComment || '') + '" placeholder="' + t('pfComment') + '" style="width:100%;margin-top:6px;height:38px;border:1px solid var(--line);border-radius:var(--r-s);padding:0 10px">' : '<small>' + t('pfMgrReview') + ': <b>' + (k.mgrScore || '-') + '</b></small>')); }).join('') +
        '<h4 class="hr-sub">' + t('pfComps') + '</h4>' + r.competencies.map(function(cp){ var sv = v.selfComps ? v.selfComps[cp] : null, mv = v.mgrComps ? v.mgrComps[cp] : null;
          return '<div class="pf-item"><div class="top"><b>' + t('cp_' + cp) + '</b>' + (sv ? '<small>' + t('pfSelf') + ': ' + sv + '</small>' : '') + '</div>' + (editable ? picker('c_' + cp, mv) : '<small>' + t('pfMgrReview') + ': <b>' + (mv || '-') + '</b></small>') + '</div>'; }).join('') +
        (editable ? '<div class="form"><div class="field"><label>' + t('pfMgrComment') + '</label><textarea id="mgrC" maxlength="1500">' + esc(v.mgrComment || '') + '</textarea></div><div class="err" id="mrE" style="color:var(--red)"></div><div class="btnrow"><button type="button" class="btn btn-dark" id="mrSend">' + t('pfSend') + '</button><button type="button" class="btn btn-line" id="mrSave">' + t('pfSave') + '</button></div></div>'
          : (v.overall != null ? '<div class="pf-rating"><b class="num">' + num(v.finalRating || v.overall) + '</b><div>' + dots(v.finalRating || v.overall) + '<small style="display:block">' + t('pfKpiScore') + ' ' + num(v.kpiScore) + '، ' + t('pfCompScore') + ' ' + num(v.compScore) + '</small></div></div>' + (v.mgrComment ? '<p>' + esc(v.mgrComment) + '</p>' : '') : ''));
      if (st === 'closed' || isHr()) h += '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="r360b">' + ph('users-four') + t('pf360Mine') + '</button></div>';
    }
    el.innerHTML = h;
    wirePickers(el);
    wireKpiEditor(el, r, done, d);
    $$('[data-midok]', el).forEach(function(b){ b.onclick = function(){ var id = b.dataset.midok; api('kpiMid', { kpiId: id, midStatus: el.querySelector('[data-mid="' + id + '"]').value, midNote: el.querySelector('[data-midn="' + id + '"]').value }).then(function(x){ toast(x.ok ? t('saved') : errText(x.error)); }); }; });
    var send = function(submit){
      var comps = {}; r.competencies.forEach(function(cp){ var x = picked(el, 'c_' + cp); if (x) comps[cp] = x; });
      api('reviewManager', { cycleId: c.id, empId: empId, comps: comps, comment: $('#mgrC', el).value, submit: submit,
        kpis: r.kpis.map(function(k){ return { id: k.id, mgrScore: picked(el, 'k_' + k.id), mgrComment: el.querySelector('[data-mc="' + k.id + '"]').value }; }) })
        .then(function(x){ if (!x.ok) return $('#mrE', el).textContent = errText(x.error); d.remove(); toast(t('saved')); done(); });
    };
    if ($('#mrSend', el)) { $('#mrSend', el).onclick = function(){ send(true); }; $('#mrSave', el).onclick = function(){ send(false); }; }
    var rb = $('#r360b', el); if (rb) rb.onclick = function(){ results360(c.id, empId); };
  });
}
function kpiEditor(kpis){
  var rows = kpis.length ? kpis : [{}, {}, {}];
  return '<h4 class="hr-sub">' + t('pfEditKpis') + '</h4><div id="kpiRows">' + rows.map(kpiRow).join('') + '</div>' +
    '<p class="hr-hint" id="kpiSum"></p><div class="err" id="kpiE" style="color:var(--red)"></div><div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="kpiAdd">' + ph('plus') + t('pfAddKpi') + '</button><button type="button" class="btn btn-dark btn-sm" id="kpiSave">' + t('pfSaveKpis') + '</button></div>';
}
function kpiRow(k){
  return '<div class="pf-kpirow" data-kid="' + esc(k.id || '') + '"><input data-f="titleAr" placeholder="' + t('pfKpiTitle') + '" value="' + esc(k.titleAr || '') + '"><input data-f="weight" type="number" min="5" max="50" placeholder="' + t('pfWeight') + '" value="' + esc(k.weight || '') + '">' +
    '<button type="button" class="iconbtn" data-rm aria-label="' + t('docDelete') + '">' + I.x + '</button><div class="sub"><input data-f="measure" placeholder="' + t('pfMeasure') + '" value="' + esc(k.measure || '') + '"><input data-f="target" placeholder="' + t('pfTarget') + '" value="' + esc(k.target || '') + '"><input data-f="unit" placeholder="' + t('pfUnit') + '" value="' + esc(k.unit || '') + '"></div></div>';
}
function wireKpiEditor(el, r, done, d){
  var box = $('#kpiRows', el); if (!box) return;
  $$('input', box).forEach(function(i){ i.style.cssText = 'height:40px;border:1px solid var(--line);border-radius:var(--r-s);padding:0 10px;background:var(--card);width:100%'; });
  var sum = function(){ var n = 0; $$('[data-f="weight"]', box).forEach(function(i){ n += Number(i.value) || 0; }); $('#kpiSum', el).textContent = t('pfTotal') + ': ' + n + ' / 100'; $('#kpiSum', el).style.color = n === 100 ? '#255B31' : 'var(--ink-2)'; };
  var wireRow = function(row){ row.querySelector('[data-rm]').onclick = function(){ row.remove(); sum(); }; row.oninput = sum; };
  $$('.pf-kpirow', box).forEach(wireRow); sum();
  $('#kpiAdd', el).onclick = function(){ if ($$('.pf-kpirow', box).length >= 7) return; box.insertAdjacentHTML('beforeend', kpiRow({})); var row = box.lastElementChild; $$('input', row).forEach(function(i){ i.style.cssText = 'height:40px;border:1px solid var(--line);border-radius:var(--r-s);padding:0 10px;background:var(--card);width:100%'; }); wireRow(row); };
  $('#kpiSave', el).onclick = function(){
    var list = $$('.pf-kpirow', box).map(function(row){ var o = { id: row.dataset.kid || undefined }; $$('[data-f]', row).forEach(function(i){ o[i.dataset.f] = i.dataset.f === 'weight' ? Number(i.value) : i.value; }); return o; }).filter(function(k){ return k.titleAr || k.weight; });
    api('kpiSave', { cycleId: r.cycle.id, empId: r.emp.id, kpis: list }).then(function(x){ if (!x.ok) return $('#kpiE', el).textContent = errText(x.error); d.remove(); toast(t('saved')); done(); });
  };
}

window.Perf = { myCards: myCards, section: section, results360: results360 };
})();
