// Wave 6 screens (2026-11-06): celebrations, survey action plans, mentoring, skills, quizzes, alumni and rehire, mass changes,
// letter templates and the private calendar link. Built on the Wave 2 kit (window.W2K from js/wave2.js, loaded first).
// Every rule is enforced on the server (backend/Wave6.gs); these screens only show what each answer allows.
(function(){
'use strict';
var K = window.W2K;
Object.assign(T.ar, {
  w6Celeb:'المناسبات', w6CelebLead:'أعياد الميلاد (لمن اختار إظهارها، اليوم والشهر فقط) وذكرى التعيين خلال الأيام القادمة.', w6Birthday:'عيد ميلاد', w6Anniv:'ذكرى التعيين', w6Years:'سنة', w6Milestone:'محطة مميزة',
  w6InDays:'بعد {n} يوم', w6Today:'اليوم', w6ShowMine:'أظهر يوم ميلادي لزملائي (اليوم والشهر فقط)', w6NoCeleb:'لا مناسبات في الأيام القادمة.',
  w6Actions:'خطط عمل الاستبيانات', w6ActionsLead:'حوّل نتائج الاستبيان الضعيفة إلى إجراءات لها مسؤول وموعد، ثم تابعها حتى الإنجاز.', w6NewAct:'إجراء جديد', w6Survey:'الاستبيان', w6Area:'المحور',
  w6Title:'العنوان', w6Owner:'المسؤول', w6Due:'الموعد', w6Done:'تم', w6WhatDone:'ما الذي نُفذ', w6Cancel:'إلغاء', w6Reopen:'إعادة فتح', w6NoActs:'لا توجد إجراءات بعد.',
  sva_open:'مفتوح', sva_done:'منجز', sva_cancelled:'ملغى', w6Overdue:'متأخر',
  w6Mentor:'الإرشاد المهني', w6MentorLead:'تعلّم من زميل خبير أو أرشد غيرك. اطلب مرشدا حسب الموضوع، وسجّلا جلساتكما.', w6Offer:'أقدّم الإرشاد', w6Topics:'المواضيع التي أرشد فيها', w6Capacity:'عدد المسترشدين',
  w6SaveProfile:'حفظ ملفي', w6FindMentor:'ابحث عن مرشد بالموضوع', w6Ask:'اطلب الإرشاد', w6Goal:'هدف الإرشاد', w6Mine:'برامجي', w6Mentors:'المرشدون المتاحون', w6Full:'مكتمل',
  w6Accept:'قبول', w6Decline:'اعتذار', w6End:'إنهاء', w6Session:'تسجيل جلسة', w6Notes:'ملاحظات الجلسة', w6Sessions:'جلسات', w6AsMentor:'أنت المرشد', w6AsMentee:'أنت المسترشد',
  ms_requested:'بانتظار القبول', ms_active:'قائم', ms_ended:'منتهٍ', ms_declined:'معتذر', w6NoMentors:'لا مرشدين مطابقين الآن.', w6NoMine:'لا برامج إرشاد بعد.',
  w6Skills:'المهارات', w6SkillsLead:'سجّل مهاراتك ومستواك، ويتحقق منها مديرك. تعرض الفجوات مقارنة بما تحتاجه وظيفتك.', w6Level:'المستوى', w6Evidence:'الدليل', w6AddSkill:'إضافة مهارة',
  w6Library:'مكتبة المهارات', w6NewSkill:'مهارة جديدة', w6Category:'الفئة', w6NameAr:'الاسم بالعربية', w6NameEn:'الاسم بالإنجليزية', w6Verified:'متحقق منها', w6Verify:'تحقق', w6Gap:'فجوات المهارات',
  w6Need:'المطلوب', w6Has:'المتوفر', w6Team:'مهارات فريقي', w6PosNeeds:'متطلبات الوظائف', w6Position:'الوظيفة', w6NoSkills:'لم تسجّل مهارات بعد.', w6Remove:'حذف',
  lvl_1:'أساسي', lvl_2:'متوسط', lvl_3:'متقدم', lvl_4:'خبير',
  w6Quiz:'الاختبارات', w6QuizLead:'اختبارات قصيرة بعد التدريب؛ تحصل على شهادة عند النجاح.', w6Take:'ابدأ الاختبار', w6Submit:'إرسال الإجابات', w6Pass:'درجة النجاح', w6Best:'أفضل نتيجة',
  w6Passed:'ناجح', w6Failed:'لم تنجح', w6Cert:'رقم الشهادة', w6NewQuiz:'اختبار جديد', w6Questions:'الأسئلة (سؤال في كل سطر، ثم الخيارات تبدأ بـ - والصحيح بـ *)', w6Takers:'المختبَرون', w6Passes:'الناجحون',
  w6Result:'نتيجتك {s}% ({r} من {n})', w6NoQuiz:'لا اختبارات متاحة.',
  w6Alumni:'الموظفون السابقون', w6AlumniLead:'من ترك العمل وقرار إعادة التوظيف لكل منهم، مع فحص سريع قبل أي عرض.', w6Rehire:'إعادة التوظيف', w6Reason:'السبب', w6Check:'فحص إعادة التوظيف',
  w6CheckQ:'الاسم أو رقم الهوية أو البريد', w6NoAlumni:'لا يوجد موظفون سابقون.', w6LastDay:'آخر يوم', w6Decide:'تحديد', rh_yes:'مؤهل', rh_conditional:'بشروط', rh_no:'غير مؤهل', rh_:'لم يُحدد',
  w6Mass:'التغييرات الجماعية', w6MassLead:'زيادة رواتب بنسبة أو تغيير المدير أو الإدارة أو الموقع لعدة موظفين مرة واحدة. تُعرض المعاينة قبل التطبيق، والرواتب تبقى بانتظار اعتماد الرواتب.',
  w6Kind:'نوع التغيير', mk_salary_pct:'زيادة الراتب بنسبة', mk_manager:'المدير المباشر', mk_department:'الإدارة', mk_location:'موقع العمل', w6Pct:'النسبة %', w6Eff:'يسري من',
  w6Value:'القيمة الجديدة', w6People:'الموظفون', w6Preview:'معاينة', w6Apply:'تطبيق', w6Before:'قبل', w6After:'بعد', w6Skipped:'مستثنون', w6Changed:'تم تغيير {n}', w6PendingNote:'الرواتب الجديدة بانتظار اعتماد الرواتب.',
  w6Letters:'نماذج الخطابات', w6LettersLead:'عدّل صياغة كل خطاب. الحقول بين أقواس { } تُملأ عند الطباعة.', w6Body:'نص الخطاب', w6Fields:'الحقول المتاحة', w6Version:'الإصدار', w6Default:'الصياغة الافتراضية',
  w6UseDefault:'العودة للافتراضي', lk_salary_certificate:'شهادة راتب', lk_employment_certificate:'شهادة تعريف', lk_experience:'شهادة خبرة',
  w6Cal:'تقويمي', w6CalLead:'اشترك في تقويمك من Outlook أو Google: إجازاتك المعتمدة والعطل الرسمية، وإجازات فريقك إن كنت مديرا. الرابط سري لك.', w6CalMake:'إنشاء رابط جديد',
  w6CalNote:'إنشاء رابط جديد يوقف الرابط السابق.', w6Copy:'نسخ', w6Copied:'نُسخ الرابط'
});
Object.assign(T.en, {
  w6Celeb:'Celebrations', w6CelebLead:'Birthdays (for people who chose to show them, day and month only) and work anniversaries in the days ahead.', w6Birthday:'Birthday', w6Anniv:'Work anniversary', w6Years:'years', w6Milestone:'Milestone',
  w6InDays:'in {n} days', w6Today:'Today', w6ShowMine:'Show my birthday to colleagues (day and month only)', w6NoCeleb:'Nothing to celebrate in the days ahead.',
  w6Actions:'Survey action plans', w6ActionsLead:'Turn weak survey results into actions with an owner and a due date, and follow them to done.', w6NewAct:'New action', w6Survey:'Survey', w6Area:'Area',
  w6Title:'Title', w6Owner:'Owner', w6Due:'Due', w6Done:'Done', w6WhatDone:'What was done', w6Cancel:'Cancel', w6Reopen:'Reopen', w6NoActs:'No actions yet.',
  sva_open:'Open', sva_done:'Done', sva_cancelled:'Cancelled', w6Overdue:'Overdue',
  w6Mentor:'Mentoring', w6MentorLead:'Learn from an experienced colleague or mentor someone. Find a mentor by topic and log your sessions.', w6Offer:'I offer mentoring', w6Topics:'Topics I mentor in', w6Capacity:'Mentees',
  w6SaveProfile:'Save my profile', w6FindMentor:'Find a mentor by topic', w6Ask:'Ask for mentoring', w6Goal:'Mentoring goal', w6Mine:'My mentorships', w6Mentors:'Available mentors', w6Full:'Full',
  w6Accept:'Accept', w6Decline:'Decline', w6End:'End', w6Session:'Log a session', w6Notes:'Session notes', w6Sessions:'sessions', w6AsMentor:'You mentor', w6AsMentee:'You are mentored',
  ms_requested:'Waiting', ms_active:'Active', ms_ended:'Ended', ms_declined:'Declined', w6NoMentors:'No matching mentors now.', w6NoMine:'No mentorships yet.',
  w6Skills:'Skills', w6SkillsLead:'Record your skills and level; your manager verifies them. Gaps compare you with what your position needs.', w6Level:'Level', w6Evidence:'Evidence', w6AddSkill:'Add a skill',
  w6Library:'Skills library', w6NewSkill:'New skill', w6Category:'Category', w6NameAr:'Arabic name', w6NameEn:'English name', w6Verified:'Verified', w6Verify:'Verify', w6Gap:'Skill gaps',
  w6Need:'Needed', w6Has:'Has', w6Team:'My team\'s skills', w6PosNeeds:'Position requirements', w6Position:'Position', w6NoSkills:'No skills recorded yet.', w6Remove:'Remove',
  lvl_1:'Basic', lvl_2:'Intermediate', lvl_3:'Advanced', lvl_4:'Expert',
  w6Quiz:'Quizzes', w6QuizLead:'Short quizzes after training; a certificate when you pass.', w6Take:'Start the quiz', w6Submit:'Submit answers', w6Pass:'Pass mark', w6Best:'Best score',
  w6Passed:'Passed', w6Failed:'Not passed', w6Cert:'Certificate no.', w6NewQuiz:'New quiz', w6Questions:'Questions (one per line, then choices starting with -, the correct one with *)', w6Takers:'Taken by', w6Passes:'Passes',
  w6Result:'Your score {s}% ({r} of {n})', w6NoQuiz:'No quizzes available.',
  w6Alumni:'Former employees', w6AlumniLead:'Who left and the rehire decision for each, with a quick check before any offer.', w6Rehire:'Rehire', w6Reason:'Reason', w6Check:'Rehire check',
  w6CheckQ:'Name, ID number or e-mail', w6NoAlumni:'No former employees.', w6LastDay:'Last day', w6Decide:'Decide', rh_yes:'Eligible', rh_conditional:'Conditional', rh_no:'Not eligible', rh_:'Not decided',
  w6Mass:'Mass changes', w6MassLead:'A salary increase by percent, or a new manager, department or work location for many people at once. Previewed before applying; salaries stay pending until payroll approves.',
  w6Kind:'Change', mk_salary_pct:'Salary increase by percent', mk_manager:'Line manager', mk_department:'Department', mk_location:'Work location', w6Pct:'Percent', w6Eff:'Effective from',
  w6Value:'New value', w6People:'People', w6Preview:'Preview', w6Apply:'Apply', w6Before:'Before', w6After:'After', w6Skipped:'Skipped', w6Changed:'{n} changed', w6PendingNote:'The new salaries wait for payroll approval.',
  w6Letters:'Letter templates', w6LettersLead:'Edit the wording of each letter. Fields in { } are filled when the letter prints.', w6Body:'Letter text', w6Fields:'Fields', w6Version:'Version', w6Default:'Default wording',
  w6UseDefault:'Back to default', lk_salary_certificate:'Salary certificate', lk_employment_certificate:'Employment certificate', lk_experience:'Experience certificate',
  w6Cal:'My calendar', w6CalLead:'Subscribe from Outlook or Google: your approved leave and public holidays, and your team\'s leave if you manage people. The link is private to you.', w6CalMake:'Make a new link',
  w6CalNote:'A new link stops the previous one.', w6Copy:'Copy', w6Copied:'Link copied'
});
function rows(){ return S.fileRoles || {}; }
function hr(){ return isHr() || rows().hr; }
function days(n){ return n === 0 ? t('w6Today') : t('w6InDays').replace('{n}', n); }
function dt(d){ return d ? K.fmt(d) : '-'; }
function bind(box, sel, fn){ $$(sel, box).forEach(function(b){ b.onclick = function(){ fn(b); }; }); }

// ============================================================ celebrations
function celebSection(body){
  var box = K.head(body, 'w6Celeb', 'w6CelebLead'); K.busy(box);
  api('celebrations', { days: 45 }, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    box.innerHTML = '<label class="hr-check" style="display:flex;gap:8px;align-items:center;margin:0 0 14px"><input type="checkbox" id="w6Bd"' + (r.mine.showBirthday ? ' checked' : '') + '> <span>' + t('w6ShowMine') + '</span></label>' +
      (r.rows.length ? '<div class="w6-celeb">' + r.rows.map(function(x, i){
        var bd = x.kind === 'birthday';
        return '<div class="w6-cc' + (bd ? ' bd' : '') + (x.milestone ? ' ms' : '') + '" style="--i:' + i + '"><span class="w6-ci">' + ph(bd ? 'cake' : x.milestone ? 'trophy' : 'confetti', 'duotone') + '</span>' +
          '<div><b>' + esc(x.emp.name) + '</b><small>' + (bd ? t('w6Birthday') : t('w6Anniv') + ' · ' + x.years + ' ' + t('w6Years')) + (x.milestone ? ' · ' + t('w6Milestone') : '') + '</small></div>' +
          '<span class="chip' + (x.daysLeft === 0 ? ' in' : '') + '">' + days(x.daysLeft) + '</span></div>'; }).join('') + '</div>' : K.empty('confetti', t('w6NoCeleb')));
    $('#w6Bd', box).onchange = function(){ var c = this.checked; api('celebOptSave', { showBirthday: c }).then(function(x){ if (!x.ok) toast(errText(x.error)); else toast(t('w2Saved')); }); };
  });
}

// ============================================================ survey action plans
function svaSection(body){
  var box = K.head(body, 'w6Actions', 'w6ActionsLead');
  function load(){ K.busy(box); api('svActList', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var cls = { open: 'late', done: 'in', cancelled: 'off' };
    box.innerHTML = (r.canEdit ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="w6New">' + ph('plus') + t('w6NewAct') + '</button></div>' : '') +
      (r.rows.length ? '<div class="list">' + r.rows.map(function(a){
        var mine = a.ownerId === S.me.id, b = '';
        if (a.status === 'open' && (mine || r.canEdit)) b += '<button type="button" class="btn btn-dark btn-sm" data-sa="done" data-id="' + esc(a.id) + '">' + t('w6Done') + '</button>';
        if (r.canEdit && a.status === 'open') b += ' <button type="button" class="btn btn-line btn-sm" data-sa="cancel" data-id="' + esc(a.id) + '">' + t('w6Cancel') + '</button>';
        if (r.canEdit && a.status !== 'open') b += ' <button type="button" class="btn btn-line btn-sm" data-sa="reopen" data-id="' + esc(a.id) + '">' + t('w6Reopen') + '</button>';
        return '<div class="row"><div class="main"><b>' + esc(a.title) + '</b><small><bdi class="num">' + esc(a.ref) + '</bdi>' + K.sep() + esc(a.survey) + (a.area ? K.sep() + esc(a.area) : '') + K.sep() + t('w6Owner') + ': ' + K.empLine(a.owner) + K.sep() + t('w6Due') + ' ' + dt(a.dueDate) + '</small>' +
          (a.doneNote ? '<small>' + t('w6WhatDone') + ': ' + esc(a.doneNote) + '</small>' : '') + '</div>' + K.chip(a.overdue ? t('w6Overdue') : t('sva_' + a.status), a.overdue ? 'absent' : cls[a.status]) + (b ? '<div class="btnrow">' + b + '</div>' : '') + '</div>'; }).join('') + '</div>' : K.empty('list-checks', t('w6NoActs')));
    var nb = $('#w6New', box); if (nb) nb.onclick = function(){ K.people(function(P){
      K.formDrawer(t('w6NewAct'), '', K.fld(t('w6Survey'), '<select name="surveyId" required>' + K.opts(r.surveys.map(function(s){ return [s.id, s.title]; })) + '</select>') + K.fld(t('w6Area'), '<input name="area" maxlength="120">') +
        K.fld(t('w6Title'), '<input name="title" required maxlength="200">') + K.two(K.fld(t('w6Owner'), '<select name="ownerId" required>' + K.empOpts(P.rows) + '</select>'), K.fld(t('w6Due'), '<input type="date" name="dueDate" required>')),
        function(v){ return api('svActSave', { item: v }); }, load); }); };
    bind(box, '[data-sa]', function(b){ var step = b.dataset.sa, id = b.dataset.id;
      if (step === 'done') return K.formDrawer(t('w6Done'), '', K.fld(t('w6WhatDone'), '<input name="note" required maxlength="300">'), function(v){ return api('svActStep', { id: id, step: 'done', note: v.note }); }, load);
      api('svActStep', { id: id, step: step }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); });
  }); }
  load();
}

// ============================================================ mentoring
function mentorSection(body){
  var box = K.head(body, 'w6Mentor', 'w6MentorLead'), q = '';
  function load(){ K.busy(box); api('mentorHub', { q: q }, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var pr = r.profile, cls = { requested: 'late', active: 'in', ended: 'off', declined: 'off' };
    box.innerHTML = '<div class="w6-two"><section class="db-card" style="padding:18px"><h3 class="w5-h">' + t('w6Mine') + '</h3>' +
      (r.mine.length ? '<div class="list">' + r.mine.map(function(m){
        var b = '';
        if (m.role === 'mentor' && m.status === 'requested') b = '<button type="button" class="btn btn-dark btn-sm" data-mt="accept" data-id="' + esc(m.id) + '">' + t('w6Accept') + '</button> <button type="button" class="btn btn-line btn-sm" data-mt="decline" data-id="' + esc(m.id) + '">' + t('w6Decline') + '</button>';
        if (m.status === 'active' && m.role) b = '<button type="button" class="btn btn-dark btn-sm" data-mt="session" data-id="' + esc(m.id) + '">' + ph('notebook') + t('w6Session') + '</button> <button type="button" class="btn btn-line btn-sm" data-mt="end" data-id="' + esc(m.id) + '">' + t('w6End') + '</button>';
        return '<div class="row"><div class="main"><b>' + K.empLine(m.mentor) + ' ← ' + K.empLine(m.mentee) + '</b><small>' + (m.role === 'mentor' ? t('w6AsMentor') : m.role === 'mentee' ? t('w6AsMentee') : '') + (m.goal ? K.sep() + esc(m.goal) : '') + K.sep() + m.sessionCount + ' ' + t('w6Sessions') + '</small>' +
          (m.sessions.length ? '<small>' + m.sessions.slice(-3).map(function(s){ return dt(s.date) + ': ' + esc(s.notes || ''); }).join(' | ') + '</small>' : '') + '</div>' + K.chip(t('ms_' + m.status), cls[m.status]) + (b ? '<div class="btnrow">' + b + '</div>' : '') + '</div>'; }).join('') + '</div>' : K.empty('handshake', t('w6NoMine'))) + '</section>' +
      '<section class="db-card" style="padding:18px"><h3 class="w5-h">' + t('w6Offer') + '</h3><form class="form" id="w6Prof">' + K.chk('offer', t('w6Offer'), pr.offer) + K.fld(t('w6Topics'), '<input name="topics" maxlength="300" value="' + esc(pr.topics) + '">') +
        K.fld(t('w6Capacity'), '<input name="capacity" type="number" min="1" max="6" value="' + esc(pr.capacity) + '">') + '<button class="btn btn-line btn-sm">' + t('w6SaveProfile') + '</button></form></section></div>' +
      '<h3 class="w5-h" style="margin-top:18px">' + t('w6Mentors') + '</h3><div class="toolbar"><input id="w6Q" placeholder="' + t('w6FindMentor') + '" value="' + esc(q) + '" style="max-width:320px"></div>' +
      (r.mentors.length ? '<div class="w6-grid">' + r.mentors.map(function(m){
        return '<div class="db-card w6-mc"><div class="av">' + esc(initials(m.emp.name)) + '</div><b>' + esc(m.emp.name) + '</b><small>' + esc(m.emp.title || '') + '</small><p>' + esc(m.topics || '') + '</p>' +
          '<div class="w6-cap"><i style="width:' + Math.min(100, m.taken / m.capacity * 100) + '%"></i></div><small>' + m.taken + ' / ' + m.capacity + '</small>' +
          (m.full ? K.chip(t('w6Full'), 'off') : '<button type="button" class="btn btn-dark btn-sm" data-ask="' + esc(m.emp.id) + '">' + t('w6Ask') + '</button>') + '</div>'; }).join('') + '</div>' : K.empty('chalkboard-teacher', t('w6NoMentors')));
    $('#w6Prof', box).onsubmit = function(ev){ ev.preventDefault(); var v = K.formVals(this); api('mentorProfileSave', v).then(function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('w2Saved')); load(); }); };
    var qi = $('#w6Q', box); qi.onchange = function(){ q = qi.value.trim(); load(); };
    bind(box, '[data-ask]', function(b){ K.formDrawer(t('w6Ask'), '', K.fld(t('w6Goal'), '<input name="goal" required maxlength="300">'), function(v){ return api('mentorRequest', { mentorId: b.dataset.ask, goal: v.goal }); }, load); });
    bind(box, '[data-mt]', function(b){ var step = b.dataset.mt, id = b.dataset.id;
      if (step === 'session') return K.formDrawer(t('w6Session'), '', K.two(K.fld(t('w6Due'), '<input type="date" name="date" required>'), '') + K.fld(t('w6Notes'), '<textarea name="notes" maxlength="1000" rows="4"></textarea>'), function(v){ return api('mentorStep', { id: id, step: 'session', date: v.date, notes: v.notes }); }, load);
      api('mentorStep', { id: id, step: step }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); });
  }); }
  load();
}

// ============================================================ skills
function skillSection(body){
  var box = K.head(body, 'w6Skills', 'w6SkillsLead'), tab = S.w6SkTab || 'mine';
  function load(){ K.busy(box); Promise.all([api('skillHub', {}, true), api('skillGap', {}, true)]).then(function(res){
    if (!box.isConnected) return; var r = res[0], g = res[1]; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var lib = {}; r.library.forEach(function(s){ lib[s.id] = s; });
    var nm = function(id){ var s = lib[id]; return s ? esc(K.lang(s.nameAr, s.nameEn)) : '-'; };
    var lvl = function(n){ return '<span class="w6-lvl" title="' + t('lvl_' + n) + '">' + [1, 2, 3, 4].map(function(i){ return '<i class="' + (i <= n ? 'on' : '') + '"></i>'; }).join('') + '</span>'; };
    var tabs = [['mine', 'user', 'w6Skills']]; if (r.team.length || r.hr) tabs.push(['team', 'users-three', 'w6Team']); if (g.ok && g.rows.length) tabs.push(['gap', 'chart-bar-horizontal', 'w6Gap']); if (r.hr) tabs.push(['lib', 'books', 'w6Library']);
    var h = '<div class="toolbar">' + K.tabsBar(tab, tabs) + '<span class="sp"></span>' + (tab === 'mine' ? '<button type="button" class="btn btn-dark btn-sm" id="w6Add">' + ph('plus') + t('w6AddSkill') + '</button>' : tab === 'lib' ? '<button type="button" class="btn btn-dark btn-sm" id="w6NewSk">' + ph('plus') + t('w6NewSkill') + '</button>' : '') + '</div>';
    if (tab === 'mine') h += r.mine.length ? '<div class="list">' + r.mine.map(function(x){ return '<div class="row"><div class="main"><b>' + nm(x.skillId) + '</b><small>' + t('lvl_' + x.level) + (x.evidence ? K.sep() + esc(x.evidence) : '') + '</small></div>' + lvl(x.level) + (x.verified ? K.chip(t('w6Verified'), 'in') : '') + '<button type="button" class="btn btn-line btn-sm" data-rm="' + esc(x.skillId) + '">' + t('w6Remove') + '</button></div>'; }).join('') + '</div>' : K.empty('sparkle', t('w6NoSkills'));
    else if (tab === 'team') h += r.team.length ? '<div class="list">' + r.team.map(function(x){ return '<div class="row"><div class="main"><b>' + K.empLine(x.emp) + '</b><small>' + nm(x.skillId) + K.sep() + t('lvl_' + x.level) + (x.evidence ? K.sep() + esc(x.evidence) : '') + '</small></div>' + lvl(x.level) + (x.verified ? K.chip(t('w6Verified'), 'in') : '<button type="button" class="btn btn-dark btn-sm" data-ver="' + esc(x.id) + '">' + t('w6Verify') + '</button>') + '</div>'; }).join('') + '</div>' : K.empty('users-three', t('w6NoSkills'));
    else if (tab === 'gap') h += '<div class="list">' + g.rows.map(function(x){ var p = Math.round(x.met / x.required * 100);
      return '<div class="row"><div class="main"><b>' + K.empLine(x.emp) + '</b><small>' + x.gaps.map(function(q){ return nm(q.skillId) + ' ' + q.has + '/' + q.need; }).join(K.sep()) + '</small><div class="w6-cap"><i style="width:' + p + '%"></i></div></div><b class="num">' + p + '%</b></div>'; }).join('') + '</div>';
    else if (tab === 'lib') h += '<div class="list">' + r.library.map(function(s){ return '<div class="row"><div class="main"><b>' + esc(s.nameAr) + (s.nameEn ? ' · ' + esc(s.nameEn) : '') + '</b><small><bdi class="num">' + esc(s.code) + '</bdi>' + (s.category ? K.sep() + esc(s.category) : '') + '</small></div><button type="button" class="btn btn-line btn-sm" data-pos="' + esc(s.id) + '">' + t('w6PosNeeds') + '</button></div>'; }).join('') + '</div>';
    box.innerHTML = h;
    $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.w6SkTab = b.dataset.tab; load(); }; });
    var add = $('#w6Add', box); if (add) add.onclick = function(){ K.formDrawer(t('w6AddSkill'), '', K.fld(t('w6Skills'), '<select name="skillId" required>' + K.opts(r.library.map(function(s){ return [s.id, K.lang(s.nameAr, s.nameEn)]; })) + '</select>') +
      K.fld(t('w6Level'), '<select name="level">' + K.opts([1, 2, 3, 4].map(function(n){ return [n, t('lvl_' + n)]; }), 2) + '</select>') + K.fld(t('w6Evidence'), '<input name="evidence" maxlength="300">'), function(v){ return api('mySkillSave', v); }, load); };
    var ns = $('#w6NewSk', box); if (ns) ns.onclick = function(){ K.formDrawer(t('w6NewSkill'), '', K.two(K.fld(t('w6NameAr'), '<input name="nameAr" required maxlength="80">'), K.fld(t('w6NameEn'), '<input name="nameEn" maxlength="80">')) + K.fld(t('w6Category'), '<input name="category" maxlength="60">'), function(v){ return api('skillSave', { skill: v }); }, load); };
    bind(box, '[data-rm]', function(b){ api('mySkillSave', { skillId: b.dataset.rm, level: 1, remove: true }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); });
    bind(box, '[data-ver]', function(b){ api('skillVerify', { id: b.dataset.ver }).then(function(x){ if (!x.ok) return toast(errText(x.error)); load(); }); });
    bind(box, '[data-pos]', function(b){ K.people(function(P){ K.formDrawer(t('w6PosNeeds'), nm(b.dataset.pos), K.fld(t('w6Position'), '<select name="positionId" required>' + K.opts(K.posOpts(P)) + '</select>') +
      K.fld(t('w6Level'), '<select name="level">' + K.opts([[0, '-']].concat([1, 2, 3, 4].map(function(n){ return [n, t('lvl_' + n)]; })), 3) + '</select>'), function(v){ return api('posSkillSave', { positionId: v.positionId, skillId: b.dataset.pos, level: Number(v.level) }); }, load); }); });
  }); }
  load();
}

// ============================================================ quizzes
function quizSection(body){
  var box = K.head(body, 'w6Quiz', 'w6QuizLead');
  function load(){ K.busy(box); api('quizList', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    box.innerHTML = (r.hr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="w6NewQ">' + ph('plus') + t('w6NewQuiz') + '</button></div>' : '') +
      (r.rows.length ? '<div class="w6-grid">' + r.rows.map(function(q){
        return '<div class="db-card w6-qc"><span class="w6-ci">' + ph(q.passed ? 'seal-check' : 'exam', 'duotone') + '</span><b>' + esc(q.title) + '</b><small>' + q.count + ' · ' + t('w6Pass') + ' ' + q.passMark + '%' + (q.best != null ? K.sep() + t('w6Best') + ' ' + q.best + '%' : '') + '</small>' +
          (q.passed ? K.chip(t('w6Passed') + (q.cert ? ' · ' + esc(q.cert) : ''), 'in') : '') + (r.hr ? '<small>' + t('w6Takers') + ' ' + (q.takers || 0) + K.sep() + t('w6Passes') + ' ' + (q.passes || 0) + '</small>' : '') +
          (q.status === 'active' ? '<button type="button" class="btn btn-dark btn-sm" data-take="' + esc(q.id) + '">' + t('w6Take') + '</button>' : '') + '</div>'; }).join('') + '</div>' : K.empty('exam', t('w6NoQuiz')));
    bind(box, '[data-take]', function(b){ take(b.dataset.take, load); });
    var nq = $('#w6NewQ', box); if (nq) nq.onclick = function(){ K.formDrawer(t('w6NewQuiz'), '', K.fld(t('w6Title'), '<input name="title" required maxlength="120">') + K.fld(t('w6Pass'), '<input name="passMark" type="number" min="40" max="100" value="70">') +
      K.fld(t('w6Questions'), '<textarea name="qs" rows="10" required placeholder="ما أول خطوة عند الحريق؟\n- الاتصال بالمدير\n* إطلاق الإنذار"></textarea>'), function(v){
        var qs = [], cur = null; String(v.qs).split(/\r?\n/).forEach(function(line){ var s = line.trim(); if (!s) return;
          if (/^[-*]/.test(s)) { if (cur) { if (s[0] === '*') cur.correct = cur.choices.length; cur.choices.push(s.slice(1).trim()); } } else { cur = { text: s, choices: [], correct: -1 }; qs.push(cur); } });
        return api('quizSave', { quiz: { title: v.title, passMark: Number(v.passMark), questions: qs } }); }, load); };
  }); }
  load();
}
function take(id, done){
  api('quizTake', { id: id }).then(function(r){
    if (!r.ok) return toast(errText(r.error));
    var q = r.quiz, d = drawer('<h3>' + esc(q.title) + '</h3><p class="hr-hint">' + t('w6Pass') + ' ' + q.passMark + '%</p><form class="form" id="w6QF">' + q.questions.map(function(x){
      return '<fieldset class="w6-q"><legend>' + (x.i + 1) + '. ' + esc(x.text) + '</legend>' + x.choices.map(function(c, j){ return '<label><input type="radio" name="q' + x.i + '" value="' + j + '" required> <span>' + esc(c) + '</span></label>'; }).join('') + '</fieldset>'; }).join('') +
      '<p class="hr-bad" id="w6QE" role="alert"></p><div class="btnrow"><button class="btn btn-dark">' + t('w6Submit') + '</button></div></form><div id="w6QR"></div>');
    $('#w6QF', d).onsubmit = function(ev){ ev.preventDefault(); var f = this, a = q.questions.map(function(x){ var c = f.querySelector('input[name=q' + x.i + ']:checked'); return c ? Number(c.value) : -1; });
      api('quizSubmit', { id: id, answers: a }).then(function(x){ if (!x.ok) return $('#w6QE', d).textContent = errText(x.error);
        $('#w6QR', d).innerHTML = '<div class="w6-res ' + (x.passed ? 'ok' : 'no') + '"><b>' + t(x.passed ? 'w6Passed' : 'w6Failed') + '</b><span>' + t('w6Result').replace('{s}', x.score).replace('{r}', x.right).replace('{n}', x.of) + '</span>' + (x.certNo ? '<span>' + t('w6Cert') + ': <bdi class="num">' + esc(x.certNo) + '</bdi></span>' : '') + '</div>';
        f.querySelector('button').disabled = true; done(); }); };
  });
}

// ============================================================ alumni and rehire
function alumniSection(body){
  var box = K.head(body, 'w6Alumni', 'w6AlumniLead');
  function load(){ K.busy(box); api('alumniList', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var cls = { yes: 'in', conditional: 'late', no: 'absent', '': 'off' };
    box.innerHTML = '<div class="toolbar"><input id="w6RQ" placeholder="' + t('w6CheckQ') + '" style="max-width:320px"><button type="button" class="btn btn-line btn-sm" id="w6RC">' + ph('magnifying-glass') + t('w6Check') + '</button></div><div id="w6RR"></div>' +
      (r.rows.length ? '<div class="list">' + r.rows.map(function(a){ return '<div class="row"><div class="main"><b>' + K.empLine(a.emp) + '</b><small>' + t('w6LastDay') + ' ' + dt(a.lastDay) + (a.reason ? K.sep() + esc(a.reason) : '') + (a.decidedBy ? K.sep() + esc(a.decidedBy) : '') + '</small></div>' +
        K.chip(t('rh_' + (a.rehire || '')), cls[a.rehire || '']) + '<button type="button" class="btn btn-line btn-sm" data-rh="' + esc(a.emp.id) + '">' + t('w6Decide') + '</button></div>'; }).join('') + '</div>' : K.empty('user-minus', t('w6NoAlumni')));
    $('#w6RC', box).onclick = function(){ var v = $('#w6RQ', box).value.trim(); if (v.length < 3) return; api('rehireCheck', { q: v }).then(function(x){
      $('#w6RR', box).innerHTML = !x.ok ? K.bad(x.error) : x.rows.length ? '<div class="list" style="margin-bottom:12px">' + x.rows.map(function(a){ return '<div class="row"><div class="main"><b>' + K.empLine(a.emp) + '</b><small>' + t('w6LastDay') + ' ' + dt(a.lastDay) + (a.reason ? K.sep() + esc(a.reason) : '') + '</small></div>' + K.chip(t('rh_' + (a.rehire || '')), cls[a.rehire || '']) + '</div>'; }).join('') + '</div>' : K.empty('check-circle', '-'); }); };
    bind(box, '[data-rh]', function(b){ K.formDrawer(t('w6Rehire'), '', K.fld(t('w6Rehire'), '<select name="rehire">' + K.opts([['yes', t('rh_yes')], ['conditional', t('rh_conditional')], ['no', t('rh_no')]]) + '</select>') + K.fld(t('w6Reason'), '<input name="reason" maxlength="300">'),
      function(v){ return api('alumniSave', { empId: b.dataset.rh, rehire: v.rehire, reason: v.reason }); }, load); });
  }); }
  load();
}

// ============================================================ mass changes
function massSection(body){
  var box = K.head(body, 'w6Mass', 'w6MassLead');
  K.people(function(P){
    if (!box.isConnected) return;
    var kinds = ['salary_pct', 'manager', 'department', 'location'];
    box.innerHTML = '<form class="form db-card" id="w6MF" style="padding:18px">' + K.two(K.fld(t('w6Kind'), '<select name="kind">' + K.opts(kinds.map(function(k){ return [k, t('mk_' + k)]; })) + '</select>'), '<div id="w6MV"></div>') +
      K.fld(t('w6People'), '<select name="ids" multiple size="10" required>' + K.empOpts(P.rows) + '</select>') + '<div class="btnrow"><button class="btn btn-line" data-m="preview">' + ph('eye') + t('w6Preview') + '</button><button class="btn btn-dark" data-m="apply" disabled>' + ph('check') + t('w6Apply') + '</button></div><p class="hr-bad" id="w6ME" role="alert"></p></form><div id="w6MP"></div>';
    var f = $('#w6MF', box), mv = $('#w6MV', box), applyB = f.querySelector('[data-m=apply]');
    function valueField(){ var k = f.kind.value; applyB.disabled = true; $('#w6MP', box).innerHTML = '';
      mv.innerHTML = k === 'salary_pct' ? K.two(K.fld(t('w6Pct'), '<input name="pct" type="number" min="0.5" max="50" step="0.5" required value="5">'), K.fld(t('w6Eff'), '<input name="effectiveFrom" type="date" required>'))
        : k === 'manager' ? K.fld(t('w6Value'), '<select name="value" required>' + K.empOpts(P.rows) + '</select>') : k === 'department' ? K.fld(t('w6Value'), '<select name="value" required>' + K.opts(K.deptOpts(P)) + '</select>') : K.fld(t('w6Value'), '<input name="value" required maxlength="80">'); }
    f.kind.onchange = valueField; valueField();
    f.onchange = function(ev){ if (ev.target.name !== 'kind') { applyB.disabled = true; } };
    var send = function(dry){ var v = K.formVals(f); $('#w6ME', box).textContent = '';
      return api('massChange', { kind: v.kind, ids: v.ids, pct: Number(v.pct), effectiveFrom: v.effectiveFrom, value: v.value, dryRun: dry }); };
    f.onsubmit = function(ev){ ev.preventDefault(); var dry = ev.submitter && ev.submitter.dataset.m === 'preview';
      send(dry).then(function(r){ if (!r.ok) return $('#w6ME', box).textContent = errText(r.error);
        if (!dry) { toast(t('w6Changed').replace('{n}', r.changed) + (r.pending ? ' · ' + t('w6PendingNote') : '')); applyB.disabled = true; $('#w6MP', box).innerHTML = ''; return; }
        var sal = f.kind.value === 'salary_pct', cell = function(v){ return sal ? K.money(v) : esc(v); };
        $('#w6MP', box).innerHTML = '<div class="tblwrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>' + t('w6People') + '</th><th>' + t('w6Before') + '</th><th>' + t('w6After') + '</th></tr></thead><tbody>' +
          r.preview.map(function(x){ return '<tr><td>' + K.empLine(x.emp) + '</td><td>' + cell(x.before) + '</td><td><b>' + cell(x.after) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' +
          (r.skipped.length ? '<p class="hr-hint">' + t('w6Skipped') + ': ' + r.skipped.map(function(s){ return esc(s.name || s.id) + ' (' + esc(errText(s.why)) + ')'; }).join('، ') + '</p>' : '');
        applyB.disabled = !r.preview.length; }); };
  });
}

// ============================================================ letter templates
function lettersSection(body){
  var box = K.head(body, 'w6Letters', 'w6LettersLead');
  function load(){ K.busy(box); api('letterTplList', {}, true).then(function(r){
    if (!box.isConnected) return; if (!r.ok) return box.innerHTML = K.bad(r.error);
    var cur = {}; r.templates.forEach(function(x){ cur[x.kind + ':' + x.lang] = x; });
    box.innerHTML = '<p class="hr-hint">' + t('w6Fields') + ': ' + r.keys.map(function(k){ return '<code>{' + esc(k) + '}</code>'; }).join(' ') + '</p><div class="list">' + r.kinds.map(function(k){ return ['ar', 'en'].map(function(l){
      var x = cur[k + ':' + l]; return '<div class="row"><div class="main"><b>' + t('lk_' + k) + ' · ' + (l === 'ar' ? 'العربية' : 'English') + '</b><small>' + (x ? t('w6Version') + ' ' + x.version : t('w6Default')) + '</small></div><button type="button" class="btn btn-line btn-sm" data-lt="' + k + ':' + l + '">' + ph('pencil-simple') + t('w2Edit') + '</button></div>'; }).join(''); }).join('') + '</div>';
    bind(box, '[data-lt]', function(b){ var p = b.dataset.lt.split(':'), x = cur[b.dataset.lt];
      var d = K.formDrawer(t('lk_' + p[0]), t('w6Fields') + ': ' + r.keys.map(function(k){ return '{' + k + '}'; }).join(' '), K.fld(t('w6Title'), '<input name="title" maxlength="120" value="' + esc(x ? x.title : '') + '">') +
        K.fld(t('w6Body'), '<textarea name="body" rows="10" dir="' + (p[1] === 'en' ? 'ltr' : 'rtl') + '">' + esc(x ? x.body : '') + '</textarea>') + (x ? K.chk('off', t('w6UseDefault'), false) : ''),
        function(v){ return api('letterTplSave', { kind: p[0], lang: p[1], title: v.title, body: v.body, off: !!v.off }); }, load); });
  }); }
  load();
}
/** Printing uses HR's wording when one exists: requests.js asks for it with letterBody(kind, lang, vars). */
var TPL = null;
window.letterTemplates = function(){ return TPL ? Promise.resolve(TPL) : api('letterTplList', {}, true).then(function(r){ TPL = r.ok ? r.templates : []; return TPL; }); };

// ============================================================ calendar link
function calSection(body){
  var box = K.head(body, 'w6Cal', 'w6CalLead');
  box.innerHTML = '<div class="db-card" style="padding:18px"><button type="button" class="btn btn-dark" id="w6CM">' + ph('calendar-plus') + t('w6CalMake') + '</button><p class="hr-hint">' + t('w6CalNote') + '</p><div id="w6CL"></div></div>';
  $('#w6CM', box).onclick = function(){ var b = this; b.disabled = true; api('calFeedLink', {}).then(function(r){ b.disabled = false; if (!r.ok) return toast(errText(r.error));
    var url = (window.API_URL || '') + '?ical=' + encodeURIComponent(r.token) + '&org=' + encodeURIComponent(r.org || S.orgId || '');
    $('#w6CL', box).innerHTML = '<div class="w6-link"><input readonly dir="ltr" value="' + esc(url) + '"><button type="button" class="btn btn-line btn-sm" id="w6CC">' + ph('copy') + t('w6Copy') + '</button></div>';
    $('#w6CC', box).onclick = function(){ try { navigator.clipboard.writeText(url).then(function(){ toast(t('w6Copied')); }); } catch (e) {} }; }); };
}

var css = '.w6-celeb{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}' +
  '.w6-cc{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;background:var(--card);border:1px solid var(--line);box-shadow:var(--e1);animation:moRise .5s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i) * 50ms)}' +
  '.w6-cc > div{flex:1;min-width:0}.w6-cc b{display:block}.w6-cc small{color:var(--ink-3)}' +
  '.w6-ci{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:24px;flex:none;background:color-mix(in srgb,var(--brand) 12%,transparent);color:var(--brand)}' +
  '.w6-cc.bd .w6-ci{background:#FCE7F6;color:#C11574}.w6-cc.ms{background:linear-gradient(140deg,var(--brand),color-mix(in srgb,var(--brand) 62%,var(--accent2,var(--signal))));color:#fff;border-color:transparent}.w6-cc.ms small{color:rgba(255,255,255,.85)}.w6-cc.ms .w6-ci{background:rgba(255,255,255,.2);color:#fff}' +
  '.w6-two{display:grid;grid-template-columns:2fr 1fr;gap:16px}@media (max-width:900px){.w6-two{grid-template-columns:1fr}}' +
  '.w6-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}' +
  '.w6-mc,.w6-qc{padding:18px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}.w6-mc p{margin:0;color:var(--ink-2);font-size:13px}.w6-mc .btn,.w6-qc .btn{margin-top:auto}' +
  '.w6-cap{width:100%;height:6px;border-radius:3px;background:var(--well,#EEF1F4);overflow:hidden}.w6-cap i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--brand),var(--accent2,var(--signal)))}' +
  '.w6-lvl{display:inline-flex;gap:3px;margin-inline-end:8px}.w6-lvl i{width:16px;height:6px;border-radius:3px;background:var(--well,#E6E9EE)}.w6-lvl i.on{background:var(--brand)}' +
  '.w6-q{border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:0 0 10px}.w6-q legend{font-weight:600;padding:0 6px}.w6-q label{display:flex;gap:8px;align-items:center;padding:6px 0;cursor:pointer}' +
  '.w6-res{display:flex;flex-direction:column;gap:4px;padding:16px;border-radius:16px;margin-top:10px}.w6-res.ok{background:var(--ok-bg);color:var(--ok)}.w6-res.no{background:var(--bad-bg);color:var(--bad)}.w6-res b{font-size:18px}' +
  '.w6-link{display:flex;gap:8px;margin-top:12px}.w6-link input{flex:1;min-width:0;font-size:13px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

window.Wave6 = { celebrations: celebSection, actions: svaSection, mentoring: mentorSection, skills: skillSection, quizzes: quizSection, alumni: alumniSection, mass: massSection, letters: lettersSection, calendar: calSection };
})();
