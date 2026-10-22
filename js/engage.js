// People programmes (Engage.gs): onboarding 30-60-90, anonymous pulse survey, policy acknowledgement, development
// plans and PIPs. Cards in "ملفي" for the employee; HR console sections with their own dashboards for HR and managers.
(function(){
'use strict';

Object.assign(T.ar, {
  enOnb:'الانضمام (30-60-90)', enSurvey:'استبيان النبض', enPolicies:'السياسات', enPlans:'خطط التطوير',
  onMyTasks:'مهامي في خطة الانضمام', onDay:'اليوم', onOf:'من', onDone:'تم', onOpen:'مفتوحة', onLate:'متأخرة', onSkip:'تخطي', onReopen:'إعادة فتح', onStart:'بدء خطة انضمام',
  onNoPlan:'موظفون جدد بلا خطة انضمام', onNone:'لا توجد خطط انضمام بعد.', onLead:'خطة من 18 خطوة من قبل المباشرة حتى تقييم فترة التجربة قبل اليوم 90 (المادة 53).',
  on_pre:'قبل المباشرة', on_day1:'اليوم الأول', on_week1:'الأسبوع الأول', on_d30:'أول 30 يوما', on_d60:'حتى اليوم 60', on_d90:'حتى اليوم 90',
  ow_hr:'الموارد البشرية', ow_manager:'المدير', ow_employee:'الموظف', ow_it:'تقنية المعلومات', onDash:'الانضمام في لمحة', onActive:'خطط جارية', onPct:'نسبة الإنجاز', onLateT:'مهام متأخرة',
  onByPhase:'الإنجاز حسب المرحلة', onByOwner:'المتأخر حسب المسؤول', onStarted:'بدأت الخطة',
  svTake:'شارك في استبيان النبض', svLead:'دقيقتان. إجاباتك مجهولة: لا يحفظ اسمك مع الإجابة، ولا تظهر أي نتيجة لمجموعة أقل من 5 أشخاص.', svSend:'إرسال', svThanks:'شكرا، سجلت إجابتك.',
  svNps0:'لا أنصح إطلاقا', svNps10:'أنصح بشدة', svL1:'لا أوافق بشدة', svL5:'أوافق بشدة', svComment:'شيء واحد يحسن تجربتك هنا (اختياري)', svAnswerAll:'أجب عن كل الأسئلة.',
  sbBuild:'استبيان مخصص', sbPulse:'استبيان النبض (جاهز)', sbTemplate:'ابدأ من', sbTplBlank:'فارغ', sbTplOnb:'تجربة الانضمام', sbTplMgr:'فعالية المدير', sbTplWell:'الرفاهية وضغط العمل', sbAudience:'الفئة المستهدفة', sbAll:'كل الموظفين', sbAllHint:'بدون اختيار = كل الموظفين. اضغط Ctrl أو ⌘ لاختيار أكثر من قسم.', sbQuestions:'الأسئلة', sbAddQ:'إضافة سؤال', sbKind:'نوع السؤال', sbQAr:'السؤال بالعربية', sbQEn:'السؤال بالإنجليزية', sbOptions:'الخيارات (سطر لكل خيار)', sbRemove:'حذف', sbAnon:'الإجابات مجهولة الهوية: لا يحفظ اسم أي موظف مع إجابته، ولا تظهر أي نتيجة لمجموعة أقل من 5. يرفض الاستبيان إن كانت الفئة أقل من 5 أشخاص.', sbk_likert:'موافقة من 1 إلى 5', sbk_nps:'احتمال التوصية 0-10', sbk_choice:'اختيار من متعدد', sbk_yesno:'نعم / لا', sbk_text:'نص حر', sbYes:'نعم', sbNo:'لا', sbYesPct:'نسبة نعم', sbTextAns:'إجابات نصية', e_audience_too_small:'الفئة المستهدفة أقل من 5 أشخاص؛ لا يمكن ضمان سرية الإجابات.',
  svDash:'النبض في لمحة', svNew:'فتح استبيان جديد', svClose:'إغلاق الاستبيان', svClosesAt:'يغلق في', svNone:'لا يوجد استبيان بعد.', svRate:'نسبة المشاركة', svResp:'إجابات',
  svEnps:'مؤشر صافي الترويج (eNPS)', svEnpsLead:'نسبة من يوصون (9-10) ناقص نسبة من لا يوصون (0-6).', svFav:'نسبة الموافقة (4-5) لكل عبارة', svDepts:'حسب الإدارة', svTenure:'حسب مدة الخدمة',
  svHidden:'أقل من 5 إجابات', svHiddenAll:'تظهر النتائج بعد 5 إجابات على الأقل حفاظا على سرية المشاركين.', svComments:'تعليقات الموظفين', svTrend:'eNPS عبر الاستبيانات', svOpenNow:'مفتوح',
  svClosed:'مغلق', svPro:'مروجون', svPas:'محايدون', svDet:'غير مروجين', svEligible:'من أصل',
  poMine:'سياسات تحتاج إقرارك', poRead:'قراءة وإقرار', poAck:'قرأت السياسة وأقر بالالتزام بها', poAcked:'أقررت بها', poVersion:'الإصدار', poNone:'لا توجد سياسات بعد.',
  poNew:'سياسة جديدة', poEdit:'تعديل السياسة', poTitle:'العنوان', poBody:'نص السياسة', poFrom:'سارية من', poRetire:'إيقاف السياسة', poStarter:'ابدأ من نموذج', poSaved:'حفظت السياسة. أي تعديل في النص يطلب من الجميع الإقرار من جديد.',
  poDash:'الإقرار بالسياسات في لمحة', poCoverage:'نسبة الإقرار', poMissing:'لم يقروا بعد', poActive:'سياسات سارية', poAllAcked:'الجميع أقر بها.',
  plMine:'خطتي للتطوير', plNew:'خطة جديدة', plIdp:'خطة تطوير فردية', plPip:'خطة تحسين الأداء', plEmp:'الموظف', plTitle:'العنوان', plReason:'سبب الخطة (وقائع محددة)', plSupport:'الدعم الذي ستقدمه الشركة',
  plGoals:'الأهداف', plGoal:'الهدف', plMeasure:'مقياس النجاح', plAddGoal:'إضافة هدف', plFrom:'من', plTo:'إلى', plCheck:'متابعة', plCheckNote:'ملاحظة المتابعة', plAckBtn:'اطلعت على الخطة',
  plComment:'تعليقي (اختياري)', plClose:'تسجيل النتيجة', plOutcome:'النتيجة', plNote:'ملاحظة', plNewEnd:'تاريخ النهاية الجديد', plNone:'لا توجد خطط.', plPipHint:'خطة تحسين الأداء من 30 إلى 90 يوما، بأهداف قابلة للقياس ودعم حقيقي ومتابعة منتظمة. ليست عقوبة: هدفها أن ينجح الموظف.',
  plAckd:'اطلع الموظف', plNotAckd:'لم يطلع بعد', plDash:'خطط التطوير في لمحة', plActivePip:'خطط تحسين جارية', plActiveIdp:'خطط تطوير جارية', plEnding:'تنتهي خلال 14 يوما', plNoAck:'بانتظار اطلاع الموظف',
  plChecks:'المتابعات', plDays:'يوما', plDaysLeft:'متبقي',
  pls_active:'جارية', pls_extended:'ممددة', pls_closed_met:'حقق الأهداف', pls_closed_not_met:'لم يحقق الأهداف', pls_cancelled:'ملغاة',
  plo_met:'حقق الأهداف', plo_not_met:'لم يحقق الأهداف', plo_extended:'تمديد', plo_cancelled:'إلغاء',
  gs_open:'مفتوح', gs_on_track:'على المسار', gs_at_risk:'متعثر', gs_met:'تحقق', gs_not_met:'لم يتحقق',
  e_already_exists:'موجود مسبقا.', e_survey_open:'يوجد استبيان مفتوح. أغلقه أولا.', e_survey_closed:'الاستبيان مغلق.', e_policy_changed:'تغير نص السياسة، أعد فتحها واقرأ الإصدار الجديد.',
  e_pip_length:'خطة تحسين الأداء من 30 إلى 90 يوما.', e_pip_incomplete:'خطة التحسين تحتاج السبب والدعم ومقياسا لكل هدف.', e_plan_open:'لدى الموظف خطة من هذا النوع جارية.',
  e_plan_closed:'الخطة منتهية.', e_bad_range:'تاريخ البداية بعد تاريخ النهاية.'
});
Object.assign(T.en, {
  enOnb:'Onboarding (30-60-90)', enSurvey:'Pulse survey', enPolicies:'Policies', enPlans:'Development plans',
  onMyTasks:'My onboarding tasks', onDay:'Day', onOf:'of', onDone:'Done', onOpen:'Open', onLate:'Late', onSkip:'Skip', onReopen:'Reopen', onStart:'Start onboarding plan',
  onNoPlan:'New hires without a plan', onNone:'No onboarding plans yet.', onLead:'An 18-step plan from before day one to the probation review before day 90 (Art. 53).',
  on_pre:'Before day one', on_day1:'Day one', on_week1:'Week one', on_d30:'First 30 days', on_d60:'To day 60', on_d90:'To day 90',
  ow_hr:'HR', ow_manager:'Manager', ow_employee:'Employee', ow_it:'IT', onDash:'Onboarding at a glance', onActive:'Plans in progress', onPct:'Completion', onLateT:'Late tasks',
  onByPhase:'Completion by phase', onByOwner:'Late tasks by owner', onStarted:'Plan started',
  svTake:'Take the pulse survey', svLead:'Two minutes. Anonymous: your name is not stored with your answers and no result shows for a group under 5 people.', svSend:'Send', svThanks:'Thank you, your answers are in.',
  svNps0:'Not at all likely', svNps10:'Extremely likely', svL1:'Strongly disagree', svL5:'Strongly agree', svComment:'One thing that would improve your experience here (optional)', svAnswerAll:'Answer every question.',
  sbBuild:'Custom survey', sbPulse:'Pulse survey (ready-made)', sbTemplate:'Start from', sbTplBlank:'Blank', sbTplOnb:'Onboarding experience', sbTplMgr:'Manager effectiveness', sbTplWell:'Wellbeing and workload', sbAudience:'Audience', sbAll:'All employees', sbAllHint:'None selected = everyone. Hold Ctrl or ⌘ to pick several departments.', sbQuestions:'Questions', sbAddQ:'Add a question', sbKind:'Question type', sbQAr:'Question (Arabic)', sbQEn:'Question (English)', sbOptions:'Options (one per line)', sbRemove:'Remove', sbAnon:'Answers are anonymous: no employee name is stored with an answer, and no result shows for a group under 5. A survey whose audience is under 5 people is refused.', sbk_likert:'Agreement 1 to 5', sbk_nps:'Likelihood to recommend 0-10', sbk_choice:'Multiple choice', sbk_yesno:'Yes / no', sbk_text:'Free text', sbYes:'Yes', sbNo:'No', sbYesPct:'Yes', sbTextAns:'Text answers', e_audience_too_small:'The audience is under 5 people; answers could not stay anonymous.',
  svDash:'Pulse at a glance', svNew:'Open a new survey', svClose:'Close the survey', svClosesAt:'Closes', svNone:'No survey yet.', svRate:'Response rate', svResp:'Responses',
  svEnps:'Employee NPS (eNPS)', svEnpsLead:'% promoters (9-10) minus % detractors (0-6).', svFav:'% favourable (4-5) per statement', svDepts:'By department', svTenure:'By tenure',
  svHidden:'Fewer than 5', svHiddenAll:'Results show once at least 5 people answer, to protect anonymity.', svComments:'Comments', svTrend:'eNPS across surveys', svOpenNow:'Open',
  svClosed:'Closed', svPro:'Promoters', svPas:'Passives', svDet:'Detractors', svEligible:'of',
  poMine:'Policies to acknowledge', poRead:'Read and acknowledge', poAck:'I have read this policy and agree to follow it', poAcked:'Acknowledged', poVersion:'Version', poNone:'No policies yet.',
  poNew:'New policy', poEdit:'Edit policy', poTitle:'Title', poBody:'Policy text', poFrom:'Effective from', poRetire:'Retire policy', poStarter:'Start from a template', poSaved:'Policy saved. Any change to the text asks everyone to acknowledge again.',
  poDash:'Policy acknowledgement at a glance', poCoverage:'Acknowledged', poMissing:'Not yet', poActive:'Active policies', poAllAcked:'Everyone has acknowledged.',
  plMine:'My development plan', plNew:'New plan', plIdp:'Individual development plan', plPip:'Performance improvement plan', plEmp:'Employee', plTitle:'Title', plReason:'Why this plan (specific facts)', plSupport:'Support the company will give',
  plGoals:'Goals', plGoal:'Goal', plMeasure:'How success is measured', plAddGoal:'Add goal', plFrom:'From', plTo:'To', plCheck:'Check-in', plCheckNote:'Check-in note', plAckBtn:'I have read the plan',
  plComment:'My comment (optional)', plClose:'Record the outcome', plOutcome:'Outcome', plNote:'Note', plNewEnd:'New end date', plNone:'No plans.', plPipHint:'A PIP runs 30-90 days with measurable goals, real support and regular check-ins. It is not a punishment: its aim is that the person succeeds.',
  plAckd:'Acknowledged', plNotAckd:'Not yet acknowledged', plDash:'Development plans at a glance', plActivePip:'PIPs in progress', plActiveIdp:'IDPs in progress', plEnding:'Ending within 14 days', plNoAck:'Awaiting acknowledgement',
  plChecks:'Check-ins', plDays:'days', plDaysLeft:'left',
  pls_active:'Active', pls_extended:'Extended', pls_closed_met:'Goals met', pls_closed_not_met:'Goals not met', pls_cancelled:'Cancelled',
  plo_met:'Goals met', plo_not_met:'Goals not met', plo_extended:'Extend', plo_cancelled:'Cancel',
  gs_open:'Open', gs_on_track:'On track', gs_at_risk:'At risk', gs_met:'Met', gs_not_met:'Not met',
  e_already_exists:'Already exists.', e_survey_open:'A survey is open. Close it first.', e_survey_closed:'The survey is closed.', e_policy_changed:'The policy changed; open it again and read the new version.',
  e_pip_length:'A PIP runs 30 to 90 days.', e_pip_incomplete:'A PIP needs the reason, the support and a measure for each goal.', e_plan_open:'This person already has an open plan of this kind.',
  e_plan_closed:'The plan is closed.', e_bad_range:'The start date is after the end date.'
});

// Starter policies (employee-handbook-builder skill): short, plain, KSA-aware; HR edits before publishing.
var STARTERS = [
  ['سياسة الحضور والانصراف', 'Attendance and punctuality',
   'الهدف: تنظيم مواعيد العمل وتسجيلها بعدالة ووضوح.\n\n1. ساعات العمل: حسب العقد، وبحد أقصى 8 ساعات يوميا و48 أسبوعيا (6 ساعات يوميا في رمضان للمسلمين)، وفق المادة 98 من نظام العمل.\n2. التسجيل: يسجل كل موظف حضوره وانصرافه من تطبيق الحضور داخل نطاق المقر، ببصمة الوجه أو الإصبع أو الرمز السري على جهازه المسجل. لا يسجل أحد عن غيره.\n3. التأخير: تحتسب مهلة التأخير المحددة في النظام، وما زاد عليها تأخير يظهر في التقارير.\n4. النسيان أو العطل: يقدم الموظف طلب تصحيح حضور من التطبيق خلال 3 أيام، ويعتمده المدير ثم الموارد البشرية.\n5. الغياب: يبلغ الموظف مديره قبل بداية الدوام أو في أقرب وقت، ويقدم ما يثبت العذر.\n6. العمل الإضافي: بموافقة مسبقة من المدير، ويعوض وفق المادة 107.\n7. المخالفات: تطبق لائحة تنظيم العمل المعتمدة، ولا يزيد الخصم على ما تسمح به المادتان 66 و92.'],
  ['قواعد السلوك المهني', 'Code of conduct',
   'نتوقع من الجميع:\n\n1. الاحترام: معاملة الزملاء والعملاء باحترام بصرف النظر عن المنصب أو الجنسية أو الخلفية.\n2. الأمانة: الصدق في العمل والسجلات والتقارير، والإبلاغ عن الأخطاء.\n3. تضارب المصالح: الإفصاح عن أي مصلحة شخصية تتعلق بمورد أو عميل أو قرار.\n4. الهدايا: لا تقبل هدية أو ضيافة تؤثر أو يبدو أنها تؤثر على قرار عمل.\n5. أصول الشركة: تستخدم في العمل فقط وتعاد عند انتهاء الخدمة.\n6. السلامة: الالتزام بتعليمات السلامة، خاصة في مواقع الغاز والنقل.\n7. الإبلاغ: يمكن الإبلاغ عن أي مخالفة للمدير أو الموارد البشرية دون أي انتقام من المبلغ بحسن نية.'],
  ['سياسة مكافحة التحرش', 'Anti-harassment',
   'تطبيقا لنظام مكافحة جريمة التحرش (1439هـ):\n\n1. يمنع أي قول أو فعل أو إشارة ذات مدلول جنسي تخدش الكرامة أو الحياء، بأي وسيلة بما فيها وسائل التقنية.\n2. البلاغ: للموارد البشرية أو الإدارة العليا، شفهيا أو كتابيا، وتحفظ سريته.\n3. التحقيق: يستمع لكل الأطراف والشهود وتوثق النتائج، ويبلغ الطرفان بالنتيجة.\n4. لا انتقام: يمنع أي إجراء ضد من أبلغ أو شهد بحسن نية.\n5. العقوبة: جزاء تأديبي قد يصل إلى الفصل وفق المادة 80، مع حق الإبلاغ للجهات المختصة.'],
  ['سرية المعلومات وحماية البيانات الشخصية', 'Confidentiality and personal data',
   'تطبيقا لنظام حماية البيانات الشخصية:\n\n1. معلومات الشركة والعملاء والرواتب سرية، لا تشارك إلا مع من يحتاجها لعمله.\n2. البيانات الشخصية للموظفين (الهوية، الآيبان، الراتب) لا يطلع عليها إلا المخولون، والنظام يسجل كل اطلاع على الرواتب.\n3. كلمات المرور والرموز شخصية، ولا تشارك مع أحد.\n4. يمنع نقل ملفات الشركة إلى أجهزة أو حسابات شخصية دون إذن.\n5. يبلغ عن أي تسرب أو اشتباه فورا.\n6. يستمر الالتزام بالسرية بعد انتهاء الخدمة.'],
  ['سياسة الإجازات', 'Leave policy',
   'وفق نظام العمل:\n\n1. السنوية: 21 يوما، و30 يوما بعد خمس سنوات خدمة (المادة 109)، تطلب من التطبيق قبل موعدها بوقت كاف.\n2. المرضية: بتقرير طبي معتمد؛ 30 يوما بأجر كامل ثم 60 بثلاثة أرباعه ثم 30 بدون أجر في السنة (المادة 117).\n3. الزواج 5 أيام، المولود 3 أيام، الوفاة 5 أيام (المادة 113)، الوضع 12 أسبوعا (المادة 151)، الحج 10 إلى 15 يوما مرة واحدة (المادة 114).\n4. بدون راتب: باتفاق الطرفين، وما زاد على 20 يوما لا يحتسب من الخدمة (المادة 116).\n5. الرصيد يظهر للموظف في التطبيق، ويصرف بدل المتبقي عند انتهاء الخدمة (المادة 111).']
];

var css = '' +
'.en-card h3 .sp{flex:1}.en-row{display:flex;gap:12px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.en-row:first-of-type{border-top:0}.en-row .main{flex:1;min-width:0}.en-row small{display:block;color:var(--ink-2);font-size:13px}' +
'.en-bar{height:8px;background:#EEEBE3;border-radius:999px;overflow:hidden;margin-top:6px}.en-bar i{display:block;height:100%;background:#2E7D4F;border-radius:999px}' +
'.en-ph{margin:14px 0 6px;font-size:13px;font-weight:600;color:var(--ink-2)}' +
'.en-task{display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-top:1px solid #EEEBE3}.en-task input{width:20px;height:20px;margin-top:2px;flex:none;accent-color:#2E7D4F}.en-task .main{flex:1}.en-task b{font-weight:500;font-size:14px}' +
'.en-task small{display:block;color:var(--ink-2);font-size:12px}.en-task.done b{text-decoration:line-through;color:var(--ink-2)}.en-task .late{color:#B3261E}' +
'.en-scale{display:flex;flex-wrap:wrap;gap:4px;direction:ltr;justify-content:flex-start}.en-scale button{min-width:36px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-weight:600;font-variant-numeric:tabular-nums}' +
'.en-scale button[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}.en-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);margin-top:3px}' +
'.en-q{margin:0 0 16px}.en-q p{margin:0 0 6px;font-weight:500}' +
'.en-pol{white-space:pre-wrap;line-height:1.9;background:var(--card);border:1px solid var(--line);border-radius:var(--r-s);padding:14px;max-height:52vh;overflow:auto;font-size:14px}' +
'.en-goal{border:1px solid var(--line);border-radius:var(--r-s);padding:10px;margin-bottom:8px;display:grid;gap:8px;background:var(--card)}' +
'.en-ci{border-inline-start:3px solid var(--line);padding:2px 10px;margin:6px 0;font-size:13px}.en-ci small{color:var(--ink-2)}' +
'.en-hid{color:var(--ink-2);font-style:italic}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, manager: false }; }
function busy(el){ el.innerHTML = '<span class="sk" style="width:40%"></span><span class="sk"></span>'; }
function bar(p){ return '<div class="en-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }

// ================= employee cards in "ملفي" =================
function myCards(el){
  el.innerHTML = '';
  var slots = { srv: null, pol: null, onb: null, plan: null };
  ['srv', 'pol', 'onb', 'plan'].forEach(function(k){ var d = document.createElement('div'); d.className = 'mf-card wide en-card hidden'; el.appendChild(d); slots[k] = d; });
  apiFresh('mySurveys', {}, function(r){ var d = slots.srv; if (!r.ok || !r.rows.length) return d.classList.add('hidden');
    var s = r.rows[0]; d.classList.remove('hidden');
    d.innerHTML = '<h3>' + ph('heartbeat') + t('svTake') + '</h3><p>' + t('svLead') + '</p><p class="hr-hint">' + t('svClosesAt') + ' ' + fmt(s.closesAt) + '</p><button type="button" class="btn btn-dark btn-sm mf-go">' + ph('chat-circle-dots') + t('svTake') + '</button>';
    d.querySelector('button').onclick = function(){ surveyForm(s, function(){ myCards(el); }); };
  }, true);
  apiFresh('policyList', {}, function(r){ var d = slots.pol; if (!r.ok) return;
    var todo = r.rows.filter(function(p){ return !p.ackedAt; });
    if (!r.rows.length) return d.classList.add('hidden');
    d.classList.remove('hidden');
    d.innerHTML = '<h3>' + ph('book-open-text') + (todo.length ? t('poMine') : t('enPolicies')) + '<span class="sp"></span>' + (todo.length ? '<span class="chip late num">' + todo.length + '</span>' : '<span class="chip in">' + ph('check') + t('poAcked') + '</span>') + '</h3>' +
      r.rows.map(function(p){ return '<div class="en-row"><div class="main"><b>' + esc(lang(p.titleAr, p.titleEn)) + '</b><small>' + t('poVersion') + ' ' + p.version + (p.ackedAt ? ' · ' + t('poAcked') + ' ' + fmt(p.ackedAt) : '') + '</small></div>' +
        '<button type="button" class="btn ' + (p.ackedAt ? 'btn-line' : 'btn-dark') + ' btn-sm" data-pol="' + p.id + '">' + (p.ackedAt ? ph('eye') : t('poRead')) + '</button></div>'; }).join('');
    $$('[data-pol]', d).forEach(function(b){ b.onclick = function(){ policyRead(r.rows.filter(function(p){ return p.id === b.dataset.pol; })[0], function(){ myCards(el); }); }; });
  }, true);
  apiFresh('onboardList', {}, function(r){ var d = slots.onb; if (!r.ok) return;
    var mine = r.plans.filter(function(p){ return p.emp.id === S.me.id; })[0];
    if (!mine || mine.done === mine.total) return d.classList.add('hidden');
    d.classList.remove('hidden');
    var my = mine.tasks.filter(function(x){ return x.owner === 'employee'; });
    d.innerHTML = '<h3>' + ph('rocket-launch') + t('onMyTasks') + '<span class="sp"></span><span class="chip num">' + t('onDay') + ' ' + Math.max(0, mine.day || 0) + '</span></h3>' +
      '<p>' + mine.done + ' ' + t('onOf') + ' ' + mine.total + '</p>' + bar(mine.done / mine.total * 100) + tasksHtml(my, true) +
      '<button type="button" class="btn btn-line btn-sm mf-go" data-all>' + t('enOnb') + '</button>';
    wireTasks(d, function(){ myCards(el); });
    d.querySelector('[data-all]').onclick = function(){ planDrawer(mine, function(){ myCards(el); }); };
  }, true);
  apiFresh('planList', {}, function(r){ var d = slots.plan; if (!r.ok) return;
    var mine = r.rows.filter(function(p){ return p.mine && (p.status === 'active' || p.status === 'extended'); });
    if (!mine.length) return d.classList.add('hidden');
    d.classList.remove('hidden');
    d.innerHTML = '<h3>' + ph('path') + t('plMine') + '</h3>' + mine.map(function(p){ return '<div class="en-row"><div class="main"><b>' + (p.type === 'pip' ? t('plPip') : t('plIdp')) + (p.titleAr ? ': ' + esc(p.titleAr) : '') + '</b><small>' + fmt(p.startDate) + ' - ' + fmt(p.endDate) + ' · ' + (p.acknowledgedAt ? t('plAckd') : t('plNotAckd')) + '</small></div>' +
      '<button type="button" class="btn ' + (p.acknowledgedAt ? 'btn-line' : 'btn-dark') + ' btn-sm" data-plan="' + p.id + '">' + ph('eye') + '</button></div>'; }).join('');
    $$('[data-plan]', d).forEach(function(b){ b.onclick = function(){ planView(mine.filter(function(p){ return p.id === b.dataset.plan; })[0], function(){ myCards(el); }); }; });
  }, true);
}

// ---------------- survey form ----------------
function scale(key, from, to, lo, hi){
  var h = '<div class="en-scale" role="radiogroup" data-q="' + key + '">';
  for (var i = from; i <= to; i++) h += '<button type="button" role="radio" aria-pressed="false" data-v="' + i + '">' + i + '</button>';
  return h + '</div><div class="en-ends"><span>' + lo + '</span><span>' + hi + '</span></div>';
}
function surveyForm(s, done){
  var ctl = function(it){
    if (it.kind === 'nps') return scale(it.key, 0, 10, t('svNps0'), t('svNps10'));
    if (it.kind === 'choice') return '<div class="en-scale en-opts" role="radiogroup" data-q="' + it.key + '">' + it.options.map(function(o, i){ return '<button type="button" role="radio" aria-pressed="false" data-v="' + i + '">' + esc(lang(o.ar, o.en)) + '</button>'; }).join('') + '</div>';
    if (it.kind === 'yesno') return '<div class="en-scale en-opts" role="radiogroup" data-q="' + it.key + '"><button type="button" role="radio" aria-pressed="false" data-v="1">' + t('sbYes') + '</button><button type="button" role="radio" aria-pressed="false" data-v="0">' + t('sbNo') + '</button></div>';
    if (it.kind === 'text') return '<textarea data-t="' + it.key + '" maxlength="500" rows="3" style="width:100%"></textarea>';
    return scale(it.key, 1, 5, t('svL1'), t('svL5'));
  };
  var d = drawer('<h3>' + esc(lang(s.titleAr, s.titleEn)) + '</h3><p class="hr-hint">' + ph('lock-simple') + ' ' + t('svLead') + '</p><form class="form" id="svF">' +
    s.items.map(function(it){ return '<div class="en-q"><p>' + esc(lang(it.ar, it.en)) + '</p>' + ctl(it) + '</div>'; }).join('') +
    '<div class="field"><label>' + t('svComment') + '</label><textarea name="comment" maxlength="500" rows="3"></textarea></div><p class="hr-bad" id="svE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('svSend') + '</button></div></form>');
  $$('[data-q]', d).forEach(function(g){ $$('button', g).forEach(function(b){ b.onclick = function(){ $$('button', g).forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); g.dataset.val = b.dataset.v; }; }); });
  $('#svF', d).onsubmit = function(ev){
    ev.preventDefault(); var a = {}, miss = false;
    $$('[data-q]', d).forEach(function(g){ if (g.dataset.val == null) miss = true; else a[g.dataset.q] = Number(g.dataset.val); });
    $$('[data-t]', d).forEach(function(x){ a[x.dataset.t] = x.value.trim(); });
    if (miss) return $('#svE', d).textContent = t('svAnswerAll');
    var btn = this.querySelector('[type=submit]'); btn.disabled = true;
    api('surveyAnswer', { id: s.id, answers: a, comment: this.elements.comment.value }).then(function(r){ btn.disabled = false; if (!r.ok) return $('#svE', d).textContent = errText(r.error); d.remove(); toast(t('svThanks')); done(); });
  };
}

// ---------------- policy reader ----------------
function policyRead(p, done){
  var d = drawer('<h3>' + esc(lang(p.titleAr, p.titleEn)) + '</h3><p class="hr-hint">' + t('poVersion') + ' ' + p.version + (p.effectiveFrom ? ' · ' + t('poFrom') + ' ' + fmt(p.effectiveFrom) : '') + '</p>' +
    '<div class="en-pol">' + esc(lang(p.bodyAr, p.bodyEn)) + '</div><p class="hr-bad" id="poE" role="alert"></p>' +
    (p.ackedAt ? '<p class="hr-hint">' + ph('check-circle') + ' ' + t('poAcked') + ' ' + fmt(p.ackedAt) + '</p>' : '<div class="btnrow"><button type="button" class="btn btn-dark" id="poA">' + ph('check') + t('poAck') + '</button></div>'));
  var b = $('#poA', d);
  if (b) b.onclick = function(){ b.disabled = true; api('policyAck', { id: p.id, version: p.version }).then(function(r){ b.disabled = false; if (!r.ok) return $('#poE', d).textContent = errText(r.error); d.remove(); toast(t('poAcked')); done(); }); };
}

// ---------------- onboarding plan ----------------
function tasksHtml(list, compact){
  var td = riyadhToday();
  return list.map(function(x){
    var late = x.status === 'open' && x.dueDate < td;
    return '<div class="en-task' + (x.status !== 'open' ? ' done' : '') + '"><input type="checkbox" data-task="' + x.id + '"' + (x.status !== 'open' ? ' checked' : '') + (x.canTick ? '' : ' disabled') + ' aria-label="' + esc(lang(x.titleAr, x.titleEn)) + '">' +
      '<div class="main"><b>' + esc(lang(x.titleAr, x.titleEn)) + '</b><small>' + (compact ? '' : t('ow_' + x.owner) + ' · ') + '<span class="' + (late ? 'late' : '') + '">' + fmt(x.dueDate) + (late ? ' · ' + t('onLate') : '') + '</span>' +
      (x.status === 'skipped' ? ' · ' + t('onSkip') : '') + (x.note ? ' · ' + esc(x.note) : '') + '</small></div>' +
      (!compact && roles().hr && x.status === 'open' ? '<button type="button" class="btn btn-line btn-sm" data-skip="' + x.id + '">' + t('onSkip') + '</button>' : '') + '</div>';
  }).join('');
}
function wireTasks(root, done){
  $$('[data-task]', root).forEach(function(c){ c.onchange = function(){ c.disabled = true; api('onboardTask', { id: c.dataset.task, status: c.checked ? 'done' : 'open' }).then(function(r){ c.disabled = false; if (!r.ok) { c.checked = !c.checked; return toast(errText(r.error)); } done(); }); }; });
  $$('[data-skip]', root).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('onboardTask', { id: b.dataset.skip, status: 'skipped' }).then(function(r){ b.disabled = false; if (!r.ok) return toast(errText(r.error)); done(); }); }; });
}
function planDrawer(p, done){
  var d = drawer('<h3>' + esc(p.emp.name) + '</h3><p class="hr-hint">' + t('onDay') + ' ' + Math.max(0, p.day || 0) + ' · ' + p.done + ' ' + t('onOf') + ' ' + p.total + (p.late ? ' · <span style="color:#B3261E">' + t('onLate') + ' ' + p.late + '</span>' : '') + '</p>' + bar(p.done / p.total * 100) + '<div id="onT"></div>');
  var box = $('#onT', d);
  function draw(plan){
    box.innerHTML = ['pre', 'day1', 'week1', 'd30', 'd60', 'd90'].map(function(ph2){ var l = plan.tasks.filter(function(x){ return x.phase === ph2; }); return l.length ? '<h4 class="en-ph">' + t('on_' + ph2) + '</h4>' + tasksHtml(l) : ''; }).join('');
    wireTasks(box, function(){ api('onboardList', {}, true).then(function(r){ if (!r.ok) return; var np = r.plans.filter(function(x){ return x.emp.id === plan.emp.id; })[0]; if (np) draw(np); done(); }); });
  }
  draw(p);
}

// ================= HR console sections =================
function onboarding(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('enOnb') + '</h2></div><p class="hr-hint" style="margin:-6px 0 12px">' + t('onLead') + '</p><div id="onB"></div>';
  var el = $('#onB', body); busy(el);
  apiFresh('onboardList', {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var V = window.Viz, plans = r.plans.filter(function(p){ return p.emp.id !== S.me.id || roles().hr; }), td = riyadhToday(), h = '';
    if (V && plans.length) {
      var all = [], tot = 0, dn = 0; plans.forEach(function(p){ tot += p.total; dn += p.done; all = all.concat(p.tasks); });
      var phase = ['pre', 'day1', 'week1', 'd30', 'd60', 'd90'].map(function(k){ var l = all.filter(function(x){ return x.phase === k; }), d2 = l.filter(function(x){ return x.status !== 'open'; }).length; return { label: t('on_' + k), value: l.length ? d2 / l.length * 100 : 0, text: d2 + ' / ' + l.length, tip: t('on_' + k) + ': ' + d2 + ' / ' + l.length }; });
      var lateBy = {}; all.forEach(function(x){ if (x.status === 'open' && x.dueDate < td) lateBy[x.owner] = (lateBy[x.owner] || 0) + 1; });
      var lb = Object.keys(lateBy).map(function(k){ return { label: t('ow_' + k), value: lateBy[k], text: String(lateBy[k]), tip: t('ow_' + k) + ': ' + lateBy[k] }; });
      h += V.panel('onb', t('onDash'), '<div class="db-tiles">' + V.tile(t('onActive'), V.n1(plans.filter(function(p){ return p.done < p.total; }).length, 0), plural(plans.length, 'people'), null, true, true) +
        V.tile(t('onPct'), V.n1(tot ? dn / tot * 100 : 0, 0) + '%', dn + ' / ' + tot) + V.tile(t('onLateT'), '<span class="db-status">' + (all.some(function(x){ return x.status === 'open' && x.dueDate < td; }) ? ph('warning') + ' ' : '') + plans.reduce(function(s, p){ return s + p.late; }, 0) + '</span>', '') +
        (r.withoutPlan ? V.tile(t('onNoPlan'), V.n1(r.withoutPlan.length, 0), '') : '') + '</div><div class="db-grid two">' + V.card('onp', t('onByPhase'), '', V.hbars(phase, { max: 100 }), '') + V.card('ono', t('onByOwner'), '', lb.length ? V.hbars(lb) : '<p class="hr-hint">-</p>', '') + '</div>');
    }
    if (r.withoutPlan && r.withoutPlan.length) h += '<h3 class="hr-sub">' + t('onNoPlan') + '</h3><div class="list">' + r.withoutPlan.map(function(x){ return '<div class="row"><div class="main"><b>' + esc(x.emp.name) + '</b><small>' + esc(x.emp.empNo) + (x.hireDate ? ' · ' + fmt(x.hireDate) : '') + '</small></div><button type="button" class="btn btn-dark btn-sm" data-start="' + x.emp.id + '">' + ph('rocket-launch') + t('onStart') + '</button></div>'; }).join('') + '</div>';
    h += plans.length ? '<h3 class="hr-sub">' + t('onActive') + '</h3><div class="list">' + plans.map(function(p, i){ return '<div class="row click" data-p="' + i + '" tabindex="0"><div class="main"><b>' + esc(p.emp.name) + '</b><small>' + t('onDay') + ' ' + Math.max(0, p.day || 0) + ' · ' + p.done + ' / ' + p.total + (p.late ? ' · <span style="color:#B3261E">' + t('onLate') + ' ' + p.late + '</span>' : '') + '</small>' + bar(p.done / p.total * 100) + '</div></div>'; }).join('') + '</div>'
      : (r.withoutPlan && r.withoutPlan.length ? '' : '<div class="empty">' + ph('rocket-launch') + '<b>' + t('onNone') + '</b></div>');
    el.innerHTML = h; if (V) V.wire(el);
    $$('[data-start]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('onboardStart', { empId: b.dataset.start }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('onStarted')); onboarding(body); }); }; });
    $$('[data-p]', el).forEach(function(x){ x.onclick = function(){ planDrawer(plans[x.dataset.p], function(){ onboarding(body); }); }; });
  });
}

function engagement(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('enSurvey') + '</h2><select id="svSel" style="height:38px;border:1px solid var(--line);border-radius:var(--r-s);background:var(--card);padding:0 10px" class="hidden"></select>' +
    (roles().hr ? '<button type="button" class="btn btn-dark btn-sm" id="svNew">' + ph('plus') + t('svNew') + '</button>' : '') + '</div><div id="svB"></div>';
  var el = $('#svB', body); busy(el);
  var nb = $('#svNew', body); if (nb) nb.onclick = function(){ newSurvey(function(){ S.svId = null; engagement(body); }); };
  apiFresh('surveyResults', S.svId ? { id: S.svId } : {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    if (!r.survey) return el.innerHTML = '<div class="empty">' + ph('heartbeat') + '<b>' + t('svNone') + '</b></div>';
    var sel = $('#svSel', body); sel.classList.toggle('hidden', r.surveys.length < 2);
    sel.innerHTML = r.surveys.map(function(s){ return '<option value="' + s.id + '"' + (s.id === r.survey.id ? ' selected' : '') + '>' + esc(s.ref + ' · ' + String(s.opensAt).slice(0, 10)) + '</option>'; }).join('');
    sel.onchange = function(){ S.svId = sel.value; engagement(body); };
    var V = window.Viz, s = r.survey, o = r.overall, extra = s.items.filter(function(it){ return it.kind === 'choice' || it.kind === 'yesno' || it.kind === 'text'; }), hasNps = s.items.some(function(it){ return it.kind === 'nps'; }), items = s.items.filter(function(it){ return it.kind === 'likert'; }), h = '';
    h += '<p class="hr-hint" style="margin:-4px 0 12px"><span class="chip ' + (s.status === 'open' ? 'in' : '') + '">' + (s.status === 'open' ? t('svOpenNow') : t('svClosed')) + '</span> ' + esc(s.ref) + ' · ' + t('svClosesAt') + ' ' + fmt(s.closesAt) +
      (s.status === 'open' && roles().hr ? ' <button type="button" class="btn btn-line btn-sm" id="svCl" style="margin-inline-start:8px">' + t('svClose') + '</button>' : '') + '</p>';
    var tiles = (hasNps ? V.tile(t('svEnps'), o.hidden ? '-' : (o.enps > 0 ? '+' : '') + o.enps, t('svEnpsLead'), null, true, true) : '') + V.tile(t('svRate'), V.n1(r.rate || 0, 0) + '%', r.responses + ' ' + t('svEligible') + ' ' + s.eligible) +
      (o.hidden || !hasNps ? '' : V.tile(t('svPro'), V.n1(o.promoters, 0) + '%', '') + V.tile(t('svPas'), V.n1(o.passives, 0) + '%', '') + V.tile(t('svDet'), V.n1(o.detractors, 0) + '%', ''));
    var body2 = '<div class="db-tiles">' + tiles + '</div>';
    if (o.hidden) body2 += '<p class="hr-hint">' + ph('lock-simple') + ' ' + t('svHiddenAll') + '</p>';
    else {
      var fav = items.map(function(it){ var b = o[it.key] || {}; return { label: lang(it.ar, it.en), value: b.favorable || 0, text: V.n1(b.favorable, 0) + '% · ' + V.n1(b.avg, 2), tip: lang(it.ar, it.en) + ': ' + V.n1(b.favorable, 0) + '% (' + V.n1(b.avg, 2) + ' / 5)' }; });
      var head = [t('hrDept'), t('svResp'), 'eNPS'].concat(items.map(function(it){ return esc(lang(it.ar, it.en)).slice(0, 22); }));
      var grp = function(list, labelKey){ return V.tbl(head, list.map(function(g){ return [esc(g[labelKey] || '-'), g.n, g.hidden ? '<span class="en-hid">' + t('svHidden') + '</span>' : g.enps].concat(items.map(function(it){ return g.hidden ? '' : V.n1(g[it.key].favorable, 0) + '%'; })); })); };
      var tr = (r.trend || []).filter(function(x){ return x.enps != null; }).map(function(x){ return { label: x.at, y: x.enps, note: x.ref + ' · ' + x.n }; });
      body2 += '<div class="db-grid two">' + V.card('svf', t('svFav'), '', V.hbars(fav, { max: 100 }), '') + (tr.length > 1 ? V.card('svt', t('svTrend'), '', V.lineChart(tr, { max: 100, aria: t('svTrend') }), '') : V.card('svc0', t('svComments'), '', comments(r.comments), '')) + '</div>' +
        '<div class="db-grid">' + V.card('svd', t('svDepts'), '', grp(r.departments, 'department'), '') + '</div><div class="db-grid two">' + V.card('svte', t('svTenure'), '', grp(r.tenure, 'band'), '') + (tr.length > 1 ? V.card('svc', t('svComments'), '', comments(r.comments), '') : '') + '</div>';
    }
    if (!o.hidden && extra.length) body2 += '<div class="db-grid two">' + extra.map(function(it){
      var b = o[it.key] || {}, inner = it.kind === 'choice' ? V.hbars(it.options.map(function(op, i){ return { label: lang(op.ar, op.en), value: (b.dist || [])[i] || 0, text: V.n1((b.dist || [])[i] || 0, 0) + '%' }; }), { max: 100 })
        : it.kind === 'yesno' ? V.hbars([{ label: t('sbYes'), value: b.yes || 0, text: V.n1(b.yes || 0, 0) + '%' }, { label: t('sbNo'), value: 100 - (b.yes || 0), text: V.n1(100 - (b.yes || 0), 0) + '%' }], { max: 100 })
        : comments((r.texts || {})[it.key] || []);
      return V.card('sx' + it.key, esc(lang(it.ar, it.en)), it.kind === 'text' ? t('sbTextAns') : '', inner, '');
    }).join('') + '</div>';
    h += V.panel('survey', t('svDash'), body2);
    el.innerHTML = h; V.wire(el);
    var cl = $('#svCl', el); if (cl) cl.onclick = function(){ cl.disabled = true; api('surveyClose', { id: s.id }).then(function(x){ if (!x.ok) { cl.disabled = false; return toast(errText(x.error)); } engagement(body); }); };
  });
  function comments(list){ return list.length ? '<div style="display:grid;gap:8px;max-height:280px;overflow:auto">' + list.map(function(c){ return '<blockquote style="margin:0;padding:8px 12px;background:var(--paper);border-radius:8px;font-size:14px">' + esc(c) + '</blockquote>'; }).join('') + '</div>' : '<p class="hr-hint">-</p>'; }
}
function newSurveyPulse(done){
  var close = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  var d = drawer('<h3>' + t('svNew') + '</h3><p class="hr-hint">' + t('svLead') + '</p><form class="form" id="nsF"><div class="field"><label>' + t('poTitle') + '</label><input name="titleAr" value="استبيان النبض"></div>' +
    '<div class="field"><label>' + t('svClosesAt') + '</label><input name="closesAt" type="date" value="' + close + '" required></div><p class="hr-bad" id="nsE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('svNew') + '</button></div></form>');
  $('#nsF', d).onsubmit = function(ev){ ev.preventDefault(); var f = this; api('surveySave', { titleAr: f.elements.titleAr.value, closesAt: f.elements.closesAt.value }).then(function(r){ if (!r.ok) return $('#nsE', d).textContent = errText(r.error); d.remove(); done(); }); };
}

/** Survey builder (2026-10-19): the ready-made pulse, or a custom survey from a template, with an audience by department. */
var SB_TPL = {
  onb: [['likert', 'كانت تجربة انضمامي منظمة وواضحة', 'My onboarding was organised and clear'], ['likert', 'حصلت على الأدوات والصلاحيات في أول أسبوع', 'I had my tools and access in the first week'], ['yesno', 'هل قابلت مديرك في أول يوم؟', 'Did you meet your manager on day one?'], ['text', 'ما الذي كان سيجعل بدايتك أفضل؟', 'What would have made your start better?']],
  mgr: [['likert', 'مديري يوضح ما هو متوقع مني', 'My manager makes clear what is expected of me'], ['likert', 'أحصل على ملاحظات مفيدة بانتظام', 'I get useful feedback regularly'], ['likert', 'مديري يدعم تطوري', 'My manager supports my growth'], ['nps', 'ما مدى احتمال أن تنصح زميلا بالعمل مع مديرك؟', 'How likely are you to recommend working for your manager?'], ['text', 'شيء واحد يفعله مديرك جيدا وشيء يمكن تحسينه', 'One thing your manager does well and one to improve']],
  well: [['likert', 'حجم عملي معقول', 'My workload is reasonable'], ['choice', 'كم مرة تعمل بعد الدوام في الأسبوع؟', 'How often do you work after hours each week?', ['أبدا|Never', 'مرة أو مرتين|Once or twice', '3 مرات أو أكثر|3 times or more']], ['yesno', 'هل تعرف لمن تتحدث إن شعرت بالضغط؟', 'Do you know who to talk to if you feel under pressure?'], ['text', 'ما الذي يساعدك على التوازن؟', 'What helps your balance?']]
};
function newSurvey(done){
  api('hrBootstrap', {}, true).then(function(r0){ var P = { depts: (r0 && r0.ok && r0.depts) || [] };
    var close = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), qs = [];
    var depts = (P.depts || []).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(lang(x.nameAr, x.nameEn)) + '</option>'; }).join('');
    var d = drawer('<h3>' + t('svNew') + '</h3><p class="hr-hint">' + ph('lock-simple') + ' ' + t('sbAnon') + '</p><form class="form" id="nsF">' +
      '<div class="field"><label>' + t('sbTemplate') + '</label><select name="tpl"><option value="pulse">' + t('sbPulse') + '</option><option value="blank">' + t('sbTplBlank') + '</option><option value="onb">' + t('sbTplOnb') + '</option><option value="mgr">' + t('sbTplMgr') + '</option><option value="well">' + t('sbTplWell') + '</option></select></div>' +
      '<div class="field"><label>' + t('poTitle') + '</label><input name="titleAr" value="استبيان النبض" required maxlength="120"></div>' +
      '<div class="field"><label>' + t('svClosesAt') + '</label><input name="closesAt" type="date" value="' + close + '" required></div>' +
      (depts ? '<div class="field"><label>' + t('sbAudience') + '</label><select name="deptIds" multiple size="4">' + depts + '</select><small class="hr-hint">' + t('sbAllHint') + '</small></div>' : '') +
      '<div id="sbQ"></div><p class="hr-bad" id="nsE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('svNew') + '</button></div></form>');
    var f = $('#nsF', d), box = $('#sbQ', d);
    function paint(){
      if (f.elements.tpl.value === 'pulse') { box.innerHTML = ''; return; }
      box.innerHTML = '<h4 style="margin:12px 0 6px">' + t('sbQuestions') + '</h4>' + qs.map(function(q, i){
        return '<div class="sb-q" data-i="' + i + '" style="border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px"><div class="two"><div class="field"><label>' + t('sbKind') + '</label><select data-k="kind">' +
          ['likert', 'nps', 'choice', 'yesno', 'text'].map(function(k){ return '<option value="' + k + '"' + (q.kind === k ? ' selected' : '') + '>' + t('sbk_' + k) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field" style="align-self:end"><button type="button" class="btn btn-line btn-sm" data-rm="' + i + '">' + ph('trash') + t('sbRemove') + '</button></div></div>' +
          '<div class="field"><label>' + t('sbQAr') + '</label><input data-k="ar" maxlength="200" value="' + esc(q.ar) + '"></div><div class="field"><label>' + t('sbQEn') + '</label><input data-k="en" maxlength="200" dir="ltr" value="' + esc(q.en) + '"></div>' +
          (q.kind === 'choice' ? '<div class="field"><label>' + t('sbOptions') + '</label><textarea data-k="opts" rows="3">' + esc((q.opts || []).join('\n')) + '</textarea></div>' : '') + '</div>';
      }).join('') + (qs.length < 20 ? '<button type="button" class="btn btn-line btn-sm" id="sbAdd">' + ph('plus') + t('sbAddQ') + '</button>' : '');
      $$('.sb-q', box).forEach(function(row){ var q = qs[row.dataset.i];
        $$('[data-k]', row).forEach(function(x){ x.oninput = x.onchange = function(){ if (x.dataset.k === 'opts') q.opts = x.value.split('\n').map(function(s){ return s.trim(); }).filter(String); else q[x.dataset.k] = x.value; if (x.dataset.k === 'kind') paint(); }; }); });
      $$('[data-rm]', box).forEach(function(b){ b.onclick = function(){ qs.splice(Number(b.dataset.rm), 1); paint(); }; });
      var add = $('#sbAdd', box); if (add) add.onclick = function(){ qs.push({ kind: 'likert', ar: '', en: '' }); paint(); };
    }
    f.elements.tpl.onchange = function(){
      var v = this.value, tpl = SB_TPL[v] || [];
      qs = tpl.map(function(x){ return { kind: x[0], ar: x[1], en: x[2], opts: (x[3] || []).map(function(o){ return o.split('|')[S.lang === 'en' ? 1 : 0]; }) }; });
      if (v === 'blank') qs = [{ kind: 'likert', ar: '', en: '' }];
      f.elements.titleAr.value = v === 'pulse' ? 'استبيان النبض' : v === 'blank' ? '' : this.options[this.selectedIndex].text;
      paint();
    };
    f.onsubmit = function(ev){
      ev.preventDefault();
      var dep = f.elements.deptIds ? Array.prototype.filter.call(f.elements.deptIds.options, function(o){ return o.selected; }).map(function(o){ return o.value; }) : [];
      var body = { titleAr: f.elements.titleAr.value, closesAt: f.elements.closesAt.value, deptIds: dep };
      if (f.elements.tpl.value !== 'pulse') body.items = qs.map(function(q){ return { kind: q.kind, ar: q.ar, en: q.en, options: (q.opts || []).map(function(o){ return { ar: o, en: o }; }) }; });
      var b = f.querySelector('[type=submit]'); b.disabled = true;
      api('surveySave', body).then(function(r){ b.disabled = false; if (!r.ok) return $('#nsE', d).textContent = errText(r.error); d.remove(); done(); });
    };
  });
}

function policies(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('enPolicies') + '</h2><button type="button" class="btn btn-dark btn-sm" id="poN">' + ph('plus') + t('poNew') + '</button></div><div id="poB"></div>';
  $('#poN', body).onclick = function(){ policyEdit(null, function(){ policies(body); }); };
  var el = $('#poB', body); busy(el);
  apiFresh('policyList', { all: true }, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    if (!r.rows.length) return el.innerHTML = '<div class="empty">' + ph('book-open-text') + '<b>' + t('poNone') + '</b></div>';
    var V = window.Viz, cov = r.coverage || [], acked = cov.reduce(function(s, c){ return s + c.acked; }, 0), need = cov.reduce(function(s, c){ return s + c.people; }, 0), h = '';
    if (V && cov.length) h += V.panel('pol', t('poDash'), '<div class="db-tiles">' + V.tile(t('poCoverage'), V.n1(need ? acked / need * 100 : 0, 0) + '%', acked + ' / ' + need, null, true, true) + V.tile(t('poActive'), V.n1(cov.length, 0), '') +
      V.tile(t('poMissing'), V.n1(need - acked, 0), '') + '</div><div class="db-grid">' + V.card('poc', t('poCoverage'), '', V.hbars(cov.map(function(c){ var p = c.people ? c.acked / c.people * 100 : 0; return { label: c.titleAr + ' (v' + c.version + ')', value: p, text: c.acked + ' / ' + c.people, tip: c.titleAr + ': ' + V.n1(p, 0) + '%' }; }), { max: 100 }), '') + '</div>');
    h += '<div class="list">' + r.rows.map(function(p){
      var c = cov.filter(function(x){ return x.id === p.id; })[0];
      return '<div class="row"><div class="main"><b>' + esc(p.titleAr) + '</b><small>' + esc(p.ref) + ' · ' + t('poVersion') + ' ' + p.version + ' · ' + (p.status === 'active' ? (c ? c.acked + ' / ' + c.people : '') : t('svClosed')) + '</small>' +
        (c && c.missing.length ? '<details style="margin-top:6px"><summary style="font-size:13px;color:var(--ink-2);cursor:pointer">' + t('poMissing') + ' (' + c.missing.length + ')</summary><small>' + c.missing.map(function(e){ return esc(e.name); }).join('، ') + '</small></details>' : c ? '<small style="color:var(--g-006300,#006300)">' + t('poAllAcked') + '</small>' : '') + '</div>' +
        '<button type="button" class="btn btn-line btn-sm" data-edit="' + p.id + '">' + ph('pencil-simple') + '</button></div>';
    }).join('') + '</div>';
    el.innerHTML = h; if (V) V.wire(el);
    $$('[data-edit]', el).forEach(function(b){ b.onclick = function(){ policyEdit(r.rows.filter(function(p){ return p.id === b.dataset.edit; })[0], function(){ policies(body); }); }; });
  });
}
function policyEdit(p, done){
  var d = drawer('<h3>' + (p ? t('poEdit') : t('poNew')) + '</h3><form class="form" id="peF">' +
    (p ? '' : '<div class="field"><label>' + t('poStarter') + '</label><select id="peS"><option value="">-</option>' + STARTERS.map(function(s, i){ return '<option value="' + i + '">' + esc(S.lang === 'en' ? s[1] : s[0]) + '</option>'; }).join('') + '</select></div>') +
    '<div class="field"><label>' + t('poTitle') + '</label><input name="titleAr" required maxlength="150" value="' + esc(p ? p.titleAr : '') + '"></div>' +
    '<div class="field"><label>' + t('poBody') + '</label><textarea name="bodyAr" required rows="14" maxlength="20000">' + esc(p ? p.bodyAr : '') + '</textarea></div>' +
    '<div class="two"><div class="field"><label>' + t('poFrom') + '</label><input name="effectiveFrom" type="date" value="' + esc(p ? p.effectiveFrom : riyadhToday()) + '"></div>' +
    (p ? '<div class="field"><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="retire"' + (p.status === 'retired' ? ' checked' : '') + '>' + t('poRetire') + '</label></div>' : '') + '</div>' +
    '<p class="hr-bad" id="peE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('saved') + '</button></div></form>');
  var f = $('#peF', d), sel = $('#peS', d);
  if (sel) sel.onchange = function(){ var s = STARTERS[sel.value]; if (!s) return; f.elements.titleAr.value = s[0]; f.elements.bodyAr.value = s[2]; };
  f.querySelector('[type=submit]').textContent = t('mfSave') !== 'mfSave' ? t('mfSave') : (S.lang === 'en' ? 'Save' : 'حفظ');
  f.onsubmit = function(ev){
    ev.preventDefault();
    var body = { id: p ? p.id : '', titleAr: f.elements.titleAr.value, bodyAr: f.elements.bodyAr.value, effectiveFrom: f.elements.effectiveFrom.value, status: f.elements.retire && f.elements.retire.checked ? 'retired' : 'active' };
    api('policySave', { policy: body }).then(function(r){ if (!r.ok) return $('#peE', d).textContent = errText(r.error); d.remove(); toast(t('poSaved')); done(); });
  };
}

function plans(body){
  body.innerHTML = '<div class="hr-h"><h2>' + t('enPlans') + '</h2><button type="button" class="btn btn-dark btn-sm" id="plN">' + ph('plus') + t('plNew') + '</button></div><div id="plB"></div>';
  var el = $('#plB', body); busy(el);
  $('#plN', body).onclick = function(){ planEdit(function(){ plans(body); }); };
  apiFresh('planList', {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var rows = r.rows.filter(function(p){ return !p.mine; }), V = window.Viz, td = riyadhToday(), h = '';
    var act = rows.filter(function(p){ return p.status === 'active' || p.status === 'extended'; }), soon = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    if (V && rows.length) h += V.panel('plans', t('plDash'), '<div class="db-tiles">' + V.tile(t('plActivePip'), V.n1(act.filter(function(p){ return p.type === 'pip'; }).length, 0), '', null, true, true) +
      V.tile(t('plActiveIdp'), V.n1(act.filter(function(p){ return p.type === 'idp'; }).length, 0), '') + V.tile(t('plEnding'), V.n1(act.filter(function(p){ return p.endDate <= soon; }).length, 0), '') +
      V.tile(t('plNoAck'), V.n1(act.filter(function(p){ return !p.acknowledgedAt; }).length, 0), '') + '</div>');
    h += rows.length ? '<div class="list">' + rows.map(function(p, i){
      var left = Math.round((Date.parse(p.endDate) - Date.parse(td)) / 864e5), met = p.goals.filter(function(g){ return g.status === 'met'; }).length;
      return '<div class="row click" data-pl="' + i + '" tabindex="0"><div class="main"><b>' + esc(p.emp ? p.emp.name : '') + ' · ' + (p.type === 'pip' ? t('plPip') : t('plIdp')) + '</b><small>' + esc(p.ref) + ' · ' + fmt(p.startDate) + ' - ' + fmt(p.endDate) +
        (p.status === 'active' || p.status === 'extended' ? ' · ' + t('plDaysLeft') + ' ' + Math.max(0, left) + ' ' + t('plDays') : '') + ' · ' + met + '/' + p.goals.length + ' · ' + (p.acknowledgedAt ? t('plAckd') : t('plNotAckd')) + '</small></div>' +
        '<span class="chip ' + (p.status === 'closed_met' ? 'in' : p.status === 'closed_not_met' ? 'absent' : 'late') + '">' + t('pls_' + p.status) + '</span></div>';
    }).join('') + '</div>' : '<div class="empty">' + ph('path') + '<b>' + t('plNone') + '</b></div>';
    el.innerHTML = h; if (V) V.wire(el);
    $$('[data-pl]', el).forEach(function(x){ x.onclick = function(){ planView(rows[x.dataset.pl], function(){ plans(body); }); }; });
  });
}
function planEdit(done){
  var dir = roles().hr && window.HrDirLoad;
  var d = drawer('<h3>' + t('plNew') + '</h3><form class="form" id="plF"><div class="two"><div class="field"><label>' + t('plEmp') + '</label><select name="empId" required><option value="">-</option></select></div>' +
    '<div class="field"><label>&nbsp;</label><select name="type"><option value="idp">' + t('plIdp') + '</option><option value="pip">' + t('plPip') + '</option></select></div></div>' +
    '<p class="hr-hint hidden" id="pipH">' + t('plPipHint') + '</p><div class="field"><label>' + t('plTitle') + '</label><input name="titleAr" maxlength="150"></div>' +
    '<div class="field"><label>' + t('plReason') + '</label><textarea name="reason" rows="3" maxlength="1500"></textarea></div><div class="field"><label>' + t('plSupport') + '</label><textarea name="support" rows="3" maxlength="1500"></textarea></div>' +
    '<div class="two"><div class="field"><label>' + t('plFrom') + '</label><input name="startDate" type="date" value="' + riyadhToday() + '"></div><div class="field"><label>' + t('plTo') + '</label><input name="endDate" type="date" required></div></div>' +
    '<div class="field"><label>' + t('plGoals') + '</label><div id="plGs"></div><button type="button" class="btn btn-line btn-sm" id="plAdd" style="margin-top:6px">' + ph('plus') + t('plAddGoal') + '</button></div>' +
    '<p class="hr-bad" id="plE"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('plNew') + '</button></div></form>');
  var f = $('#plF', d), gs = $('#plGs', d);
  (dir ? new Promise(function(res){ HrDirLoad(function(rows){ res({ ok: true, rows: rows.filter(function(e){ return e.status === 'active'; }) }); }); }) : api('hrTeam', {}, true)).then(function(r){
    var list = r && r.ok ? r.rows || [] : [];
    var opts = list.map(function(e){ return [e.id, e.name + ' (' + e.empNo + ')']; });
    f.elements.empId.innerHTML = '<option value="">-</option>' + opts.filter(function(o){ return o[0] !== S.me.id; }).map(function(o){ return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
  });
  function addGoal(){ var g = document.createElement('div'); g.className = 'en-goal'; g.innerHTML = '<input data-g="title" placeholder="' + t('plGoal') + '" maxlength="200"><input data-g="measure" placeholder="' + t('plMeasure') + '" maxlength="300">'; gs.appendChild(g); }
  addGoal(); $('#plAdd', d).onclick = addGoal;
  var setEnd = function(){ var n = f.elements.type.value === 'pip' ? 60 : 365; f.elements.endDate.value = new Date(Date.parse(f.elements.startDate.value || riyadhToday()) + n * 864e5).toISOString().slice(0, 10); $('#pipH', d).classList.toggle('hidden', f.elements.type.value !== 'pip'); };
  f.elements.type.onchange = setEnd; setEnd();
  f.onsubmit = function(ev){
    ev.preventDefault();
    var goals = $$('.en-goal', gs).map(function(g){ return { title: g.querySelector('[data-g=title]').value, measure: g.querySelector('[data-g=measure]').value }; });
    var plan = { empId: f.elements.empId.value, type: f.elements.type.value, titleAr: f.elements.titleAr.value, reason: f.elements.reason.value, support: f.elements.support.value, startDate: f.elements.startDate.value, endDate: f.elements.endDate.value, goals: goals };
    api('planSave', { plan: plan }).then(function(r){ if (!r.ok) return $('#plE', d).textContent = errText(r.error); d.remove(); toast(r.plan.ref); done(); });
  };
}
function planView(p, done){
  var open = p.status === 'active' || p.status === 'extended';
  var goals = p.goals.map(function(g, i){ return '<div class="en-goal"><b>' + esc(g.title) + '</b>' + (g.measure ? '<small class="hr-hint">' + t('plMeasure') + ': ' + esc(g.measure) + '</small>' : '') +
    (p.canManage && open && !p.mine ? '<select data-gs="' + i + '">' + ['open', 'on_track', 'at_risk', 'met', 'not_met'].map(function(s){ return '<option value="' + s + '"' + (g.status === s ? ' selected' : '') + '>' + t('gs_' + s) + '</option>'; }).join('') + '</select>' : '<span class="chip">' + t('gs_' + (g.status || 'open')) + '</span>') + '</div>'; }).join('');
  var d = drawer('<h3>' + (p.type === 'pip' ? t('plPip') : t('plIdp')) + (p.titleAr ? ': ' + esc(p.titleAr) : '') + '</h3><p class="hr-hint">' + esc(p.ref) + ' · ' + esc(p.emp ? p.emp.name : '') + ' · ' + fmt(p.startDate) + ' - ' + fmt(p.endDate) + ' · <b>' + t('pls_' + p.status) + '</b></p>' +
    (p.type === 'pip' ? '<p class="hr-hint">' + t('plPipHint') + '</p>' : '') +
    (p.reason ? '<h4 class="en-ph">' + t('plReason') + '</h4><p style="white-space:pre-wrap">' + esc(p.reason) + '</p>' : '') + (p.support ? '<h4 class="en-ph">' + t('plSupport') + '</h4><p style="white-space:pre-wrap">' + esc(p.support) + '</p>' : '') +
    '<h4 class="en-ph">' + t('plGoals') + '</h4>' + goals +
    '<h4 class="en-ph">' + t('plChecks') + ' (' + p.checkIns.length + ')</h4>' + (p.checkIns.length ? p.checkIns.slice().reverse().map(function(c){ return '<div class="en-ci">' + esc(c.note) + '<br><small>' + fmt(c.date) + ' · ' + esc(c.by) + '</small></div>'; }).join('') : '<p class="hr-hint">-</p>') +
    '<p class="hr-hint">' + (p.acknowledgedAt ? ph('check-circle') + ' ' + t('plAckd') + ' ' + fmt(p.acknowledgedAt) + (p.employeeComment ? ': ' + esc(p.employeeComment) : '') : t('plNotAckd')) + '</p>' +
    (p.outcomeNote ? '<p class="hr-hint">' + t('plOutcome') + ': ' + esc(p.outcomeNote) + '</p>' : '') + '<div id="plAct"></div><p class="hr-bad" id="pvE"></p>');
  var act = $('#plAct', d), err = $('#pvE', d);
  if (p.mine && !p.acknowledgedAt) {
    act.innerHTML = '<form class="form" id="akF"><div class="field"><label>' + t('plComment') + '</label><textarea name="c" rows="2" maxlength="1000"></textarea></div><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('check') + t('plAckBtn') + '</button></div></form>';
    $('#akF', d).onsubmit = function(ev){ ev.preventDefault(); api('planAck', { id: p.id, comment: this.elements.c.value }).then(function(r){ if (!r.ok) return err.textContent = errText(r.error); d.remove(); done(); }); };
  }
  if (p.canManage && open && !p.mine) {
    act.innerHTML = '<form class="form" id="ciF"><div class="field"><label>' + t('plCheckNote') + '</label><textarea name="n" rows="2" maxlength="1000" required></textarea></div><div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + t('plCheck') + '</button></div></form>' +
      (p.canClose ? '<form class="form" id="clF" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><div class="two"><div class="field"><label>' + t('plOutcome') + '</label><select name="o">' + ['met', 'not_met', 'extended', 'cancelled'].map(function(o){ return '<option value="' + o + '">' + t('plo_' + o) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>' + t('plNewEnd') + '</label><input name="e" type="date"></div></div><div class="field"><label>' + t('plNote') + '</label><textarea name="n" rows="2" maxlength="1000" required></textarea></div><div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + t('plClose') + '</button></div></form>' : '');
    $('#ciF', d).onsubmit = function(ev){ ev.preventDefault(); var gs = {}; $$('[data-gs]', d).forEach(function(s){ gs[s.dataset.gs] = s.value; });
      api('planCheckIn', { id: p.id, note: this.elements.n.value, goalStatus: gs }).then(function(r){ if (!r.ok) return err.textContent = errText(r.error); d.remove(); toast(t('saved')); done(); }); };
    var cf = $('#clF', d); if (cf) cf.onsubmit = function(ev){ ev.preventDefault(); api('planClose', { id: p.id, outcome: this.elements.o.value, endDate: this.elements.e.value, note: this.elements.n.value }).then(function(r){ if (!r.ok) return err.textContent = errText(r.error); d.remove(); done(); }); };
  }
}

window.Engage = { myCards: myCards, onboarding: onboarding, engagement: engagement, policies: policies, plans: plans };
})();
