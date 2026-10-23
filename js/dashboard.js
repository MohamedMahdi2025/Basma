// Management dashboard: every figure comes from api dashboard (Dashboard.gs); this file only draws.
// Palette validated with the dataviz validator on the white card surface: green #2E7D4F, amber #C98500, blue #2a78d6
// (CVD adjacent dE 10.5, normal-vision 21.7, all >= 3:1). Text never wears a series colour.
(function(){
'use strict';

Object.assign(T.ar, {
  dbTitle:'لوحة الإدارة', dbThisMonth:'هذا الشهر', dbLastMonth:'الشهر الماضي', dbLast30:'آخر 30 يوما', dbLast90:'آخر 90 يوما', dbPrint:'طباعة',
  dbAttRate:'نسبة الحضور', dbPunct:'الانضباط في الموعد', dbAvgLate:'متوسط التأخير', dbAbsent:'أيام الغياب', dbOvertime:'ساعات إضافية', dbOnLeave:'في إجازة اليوم',
  dbVsPrev:'عن الفترة السابقة', dbMinutes:'دقيقة', dbHours:'ساعة', dbTrend:'الحضور يوما بيوم', dbTrendLead:'نسبة من حضر من المتوقع حضورهم كل يوم عمل.',
  dbWeekday:'التأخير حسب يوم الأسبوع', dbWeekdayLead:'نسبة المتأخرين من المتوقع حضورهم.', dbCheckin:'أوقات تسجيل الحضور', dbCheckinLead:'عدد البصمات كل ربع ساعة. الأعمدة البرتقالية بعد بداية الدوام ومهلة التأخير.', dbPts:'نقطة',
  dbDepts:'الإدارات', dbDeptLead:'نسبة الحضور لكل إدارة، والانضباط بجانبها.', dbTopLate:'الأكثر تأخيرا', dbTopAbsent:'الأكثر غيابا', dbDays:'أيام', dbTimes:'مرات',
  dbWorkforce:'القوى العاملة', dbHeadcount:'الموظفون النشطون', dbSaudization:'التوطين المرجح (نطاقات)', dbTarget:'المستهدف', dbNoTarget:'حدد النسبة المستهدفة في الإعدادات (saudizationTarget) لإظهار الفجوة.',
  dbMix:'السعوديون وغير السعوديين حسب الإدارة', dbSaudi:'سعودي', dbNonSaudi:'غير سعودي', dbSaudisK:'السعوديون', dbTenure:'سنوات الخدمة', dbMovement:'المنضمون والمغادرون (12 شهرا)',
  dbJoiners:'انضموا', dbLeavers:'غادروا', dbExpiring:'وثائق تنتهي خلال 60 يوما', dbExpired:'وثائق منتهية', dbLeaveType:'الإجازات حسب النوع',
  dbPending:'طلبات تنتظر', dbOldest:'أقدم طلب مفتوح', dbSlow:'مفتوحة منذ أكثر من 3 أيام', dbSpeed:'متوسط وقت البت في الطلبات', dbPerf:'الأداء',
  dbPerfNone:'لا توجد دورة تقييم بعد.', dbNotRated:'لم يكتمل أي تقييم في هذه الدورة بعد.', dbRated:'قيموا', dbCost:'تكلفة الرواتب والالتزامات', dbWageBill:'الرواتب الشهرية السارية', dbLastCost:'تكلفة آخر مسير',
  dbGosiEr:'تأمينات على الشركة', dbOtCost:'تكلفة العمل الإضافي', dbLeaveLiab:'التزام الإجازات غير المستخدمة', dbEosLiab:'التزام مكافأة نهاية الخدمة',
  dbAdvances:'سلف غير مسددة', dbCostTrend:'تكلفة الرواتب الشهرية (الإجمالي والتأمينات على الشركة)', dbCostDept:'تكلفة آخر مسير حسب الإدارة', dbNoRuns:'لا توجد مسيرات معتمدة بعد.',
  dbTable:'جدول', dbChart:'رسم', dbGenerated:'أعدت في', dbReview:'بصمات للمراجعة', dbMissingOut:'بلا انصراف', dbLiabNote:'تقدير حتى اليوم: المكافأة كاملة لكل الموظفين حسب المادة 84، والإجازة بالأجر الإجمالي.',
  dbNoData:'لا توجد بيانات في هذه الفترة.', dbHideDash:'إخفاء الملخص', dbShowDash:'إظهار الملخص', lt_unpaid_short:'بدون راتب',
  dbViewAs:'طريقة العرض', dbNoChange:'دون تغيير', dbOpen:'فتح', dbOpenIn:'افتح الشاشة', dbChartView:'عرض الرسم', dbTableView:'عرض الجدول', dbSparkOf:'الاتجاه', dbFromTo:'من {a} إلى {b}',
  dbLoading:'جار تحميل اللوحة', dbPrevPeriod:'الفترة السابقة', dbBasis:'الأسهم تقارن بالفترة السابقة بنفس الطول ({a} - {b})', dbBasisRun:'الأسهم تقارن بالمسير السابق', dbVsTarget:'عن المستهدف', dbVsLastMonth:'عن الشهر الماضي', dbVsRun:'عن المسير السابق'
});
Object.assign(T.en, {
  dbTitle:'Management dashboard', dbThisMonth:'This month', dbLastMonth:'Last month', dbLast30:'Last 30 days', dbLast90:'Last 90 days', dbPrint:'Print',
  dbAttRate:'Attendance rate', dbPunct:'On time', dbAvgLate:'Average lateness', dbAbsent:'Absence days', dbOvertime:'Overtime hours', dbOnLeave:'On leave today',
  dbVsPrev:'vs previous period', dbMinutes:'min', dbHours:'h', dbTrend:'Attendance day by day', dbTrendLead:'Share of expected people who checked in, each working day.',
  dbWeekday:'Lateness by weekday', dbWeekdayLead:'Share of expected people who arrived late.', dbCheckin:'Check-in times', dbCheckinLead:'Check-ins per quarter hour. Amber columns are after the shift start and grace.', dbPts:'pts',
  dbDepts:'Departments', dbDeptLead:'Attendance rate per department, with on-time share beside it.', dbTopLate:'Late most often', dbTopAbsent:'Absent most often', dbDays:'days', dbTimes:'times',
  dbWorkforce:'Workforce', dbHeadcount:'Active employees', dbSaudization:'Weighted Saudization (Nitaqat)', dbTarget:'Target', dbNoTarget:'Set the target % in settings (saudizationTarget) to show the gap.',
  dbMix:'Saudi and non-Saudi by department', dbSaudi:'Saudi', dbNonSaudi:'Non-Saudi', dbSaudisK:'Saudis', dbTenure:'Years of service', dbMovement:'Joiners and leavers (12 months)',
  dbJoiners:'Joined', dbLeavers:'Left', dbExpiring:'Documents expiring within 60 days', dbExpired:'Expired documents', dbLeaveType:'Leave by type',
  dbPending:'Requests waiting', dbOldest:'Oldest open request', dbSlow:'Open more than 3 days', dbSpeed:'Average time to decide a request', dbPerf:'Performance',
  dbPerfNone:'No review cycle yet.', dbNotRated:'No review is complete in this cycle yet.', dbRated:'rated', dbCost:'Payroll cost and liabilities', dbWageBill:'Monthly wage bill in force', dbLastCost:'Last payroll cost',
  dbGosiEr:'Employer GOSI', dbOtCost:'Overtime cost', dbLeaveLiab:'Unused leave liability', dbEosLiab:'End-of-service liability',
  dbAdvances:'Advances outstanding', dbCostTrend:'Monthly payroll cost (gross plus employer GOSI)', dbCostDept:'Last payroll cost by department', dbNoRuns:'No approved payroll yet.',
  dbTable:'Table', dbChart:'Chart', dbGenerated:'Prepared', dbReview:'Punches to review', dbMissingOut:'No check-out', dbLiabNote:'Estimate as of today: full Art. 84 award for everyone, leave at total wage.',
  dbNoData:'No data in this period.', dbHideDash:'Hide summary', dbShowDash:'Show summary', lt_unpaid_short:'Unpaid',
  dbViewAs:'View as', dbNoChange:'No change', dbOpen:'Open', dbOpenIn:'Open the screen', dbChartView:'Chart view', dbTableView:'Table view', dbSparkOf:'Trend', dbFromTo:'from {a} to {b}',
  dbLoading:'Loading the dashboard', dbPrevPeriod:'Previous period', dbBasis:'Arrows compare with the previous period of the same length ({a} - {b})', dbBasisRun:'Arrows compare with the previous payroll run', dbVsTarget:'vs target', dbVsLastMonth:'vs last month', dbVsRun:'vs previous run'
});
// Workforce analytics (prefix wa). Arabic counts of people go through plural(n, 'people').
Object.assign(T.ar, {
  waTitle:'تحليلات القوى العاملة', waAll:'الكل', waLead:'آخر 12 شهرا حتى اليوم، محسوبة من بيانات الوظيفة فقط ولا تتأثر بالفترة المختارة أعلاه.', waPartFailed:'تعذر حساب هذا الجزء الآن.',
  waTurnover:'معدل الدوران (12 شهرا)', waVoluntary:'الاستقالات (طوعي)', waOther:'المغادرة لأسباب أخرى', waFirstYear:'غادروا قبل إكمال سنة', waOfLeavers:'من المغادرين',
  waLeaversK:'المغادرون', waAvgHc:'متوسط عدد الموظفين', waOtherWhy:'أسباب المغادرة الأخرى', waTrend:'معدل الدوران شهريا', waTrendLead:'المغادرون في الشهر مقسومون على متوسط عدد الموظفين في أوله وآخره.',
  waSplit:'المغادرون شهريا: طوعي وغيره', waMonth:'الشهر', waHcStart:'أول الشهر', waHcEnd:'آخر الشهر', waRate:'المعدل', waVolShort:'طوعي', waOtherShort:'أخرى',
  waTenure:'مدة الخدمة', waTenureAvg:'المتوسط', waMedian:'الوسيط', waYearsU:'سنة', waNoHire:'بلا تاريخ تعيين', waTenureDept:'متوسط مدة الخدمة حسب الإدارة',
  waCountOnly:'العدد فقط', waSmallNote:'الإدارات والمجموعات الأقل من 5 موظفين تظهر بعددها فقط.', waDept:'الإدارة', waPeopleK:'الموظفون', waBand:'الفئة',
  waSpan:'نطاق الإشراف', waSpanLead:'عدد المرؤوسين المباشرين لكل مدير.', waManagers:'المديرون', waAvgSpan:'المتوسط', waMinMax:'الأدنى والأعلى', waTeam:'حجم الفريق',
  waInRange:'ضمن المعتاد', waFlagged:'للعلم', waWide:'أكثر من 12 مرؤوسا', waNarrow:'مرؤوس واحد فقط', waOrphans:'موظفون مديرهم غادر أو غير نشط',
  waSpanNote:'للعلم وليس خطأ: قد يناسب ذلك طبيعة العمل.', waReportsK:'المرؤوسون',
  waCohorts:'البقاء حسب سنة التعيين', waCohortsLead:'نسبة من بقوا على رأس العمل بعد 3 و6 و12 شهرا من التعيين، ممن بلغوا تلك المدة. السنوات قبل تشغيل النظام قد لا تشمل من غادر قبله.',
  waM3:'بعد 3 أشهر', waM6:'بعد 6 أشهر', waM12:'بعد 12 شهرا', waHires:'المعينون', waYear:'السنة', waNotYet:'لم يحن بعد',
  waFlight:'مؤشرات للحوار حول البقاء', waFlightLead:'مؤشرات لبدء حوار مع الموظف، وليست تنبؤا ولا حكما على أحد. تعتمد على بيانات الوظيفة فقط، ولا تستخدم الجنس أو الجنسية أو العمر أو أي صفة شخصية.',
  waScored:'شملهم الفحص', waWithSignals:'مؤشر واحد على الأقل', waTwoPlus:'مؤشران أو أكثر', waLeaving:'في فترة الإشعار', waLeavingSub:'لا يشملهم الفحص',
  waBySignal:'المؤشرات حسب النوع', waBySignalLead:'من ظهر عندهم المؤشر / من أمكن تقييمه له.', waByDept:'حسب الإدارة', waByDeptLead:'من عندهم مؤشر واحد على الأقل من موظفي الإدارة.',
  waIndicator:'المؤشر', waFired:'ظهر', waCheckable:'أمكن تقييمه', waChecked:'أمكن تقييمه لـ', waHidden:'مجموعات أقل من 5 موظفين لا تظهر هنا: ', waPooled:'إدارات صغيرة مجتمعة',
  waPeople:'الموظفون ومؤشراتهم', waPeopleLead:'للموارد البشرية فقط. ابدأ بحوار مفتوح عن العمل والتطور، لا بالمؤشر نفسه.', waHrOnly:'أسماء الموظفين تظهر للموارد البشرية فقط.', waNone:'لا يوجد موظف ظهر عنده مؤشر.',
  waScore:'العدد', waUnknown:'تعذر التقييم', waSig_new_hire:'أقل من سنة في الشركة', waSig_pay_static:'لا تغيير في الراتب منذ 18 شهرا أو أكثر',
  waSig_low_rating:'آخر تقييم أداء في الفئة الدنيا', waSig_attendance_up:'تزايد التأخير أو الغياب', waSig_manager_change:'تغير المدير خلال 6 أشهر',
  waSs_new_hire:'مدة الخدمة', waSs_pay_static:'الراتب', waSs_low_rating:'التقييم', waSs_attendance_up:'الحضور', waSs_manager_change:'المدير',
  waHired:'التعيين', waLastChange:'آخر تغيير', waRatingK:'التقييم', waLateK:'تأخير', waAbsK:'غياب', waVsPrior:'مقابل', waPriorNote:'(آخر 90 يوما مقابل الـ90 قبلها)', waMgrNew:'مدير جديد منذ', waMgrLeft:'غادر المدير في',
  waCk_wa_no_last_day:'غير نشطين بلا آخر يوم عمل (خارج الحساب)', waCk_wa_end_before_start:'آخر يوم عمل قبل تاريخ التعيين', waCk_wa_orphan_reports:'مديرهم غادر أو غير نشط', waCk_wa_no_hire_date:'بلا تاريخ تعيين',
  waR_termination:'إنهاء من الشركة', waR_contract_end:'انتهاء العقد', waR_retirement:'تقاعد', waR_other:'أخرى', waR_unrecorded:'غير مسجل'
});
Object.assign(T.en, {
  waTitle:'Workforce analytics', waAll:'All', waLead:'Last 12 months to today, from job data only; the period picked above does not change it.', waPartFailed:'This part could not be worked out just now.',
  waTurnover:'Turnover (12 months)', waVoluntary:'Resignations (voluntary)', waOther:'Other leavers', waFirstYear:'Left within the first year', waOfLeavers:'of leavers',
  waLeaversK:'Leavers', waAvgHc:'Average headcount', waOtherWhy:'Other reasons for leaving', waTrend:'Monthly turnover', waTrendLead:'Leavers in the month divided by the average of the headcount at its start and end.',
  waSplit:'Leavers per month: voluntary and other', waMonth:'Month', waHcStart:'At start', waHcEnd:'At end', waRate:'Rate', waVolShort:'Voluntary', waOtherShort:'Other',
  waTenure:'Tenure', waTenureAvg:'Average', waMedian:'Median', waYearsU:'yrs', waNoHire:'No hire date', waTenureDept:'Average tenure by department',
  waCountOnly:'Count only', waSmallNote:'Departments and groups under 5 people show their count only.', waDept:'Department', waPeopleK:'People', waBand:'Band',
  waSpan:'Span of control', waSpanLead:'Direct reports per manager.', waManagers:'Managers', waAvgSpan:'Average', waMinMax:'Min and max', waTeam:'Team size',
  waInRange:'Usual range', waFlagged:'For information', waWide:'More than 12 reports', waNarrow:'Only 1 report', waOrphans:'People whose manager has left or is inactive',
  waSpanNote:'For information, not an error: it may suit the work.', waReportsK:'Reports',
  waCohorts:'Retention by hire year', waCohortsLead:'Share still employed 3, 6 and 12 months after hire, among those that far along. Years before go-live may miss people who left before it.',
  waM3:'At 3 months', waM6:'At 6 months', waM12:'At 12 months', waHires:'Hired', waYear:'Year', waNotYet:'Not yet',
  waFlight:'Retention conversation indicators', waFlightLead:'Indicators to start a conversation, not a prediction or a judgement of anyone. Job data only; never gender, nationality, age or any personal attribute.',
  waScored:'People checked', waWithSignals:'At least one indicator', waTwoPlus:'Two or more', waLeaving:'Serving notice', waLeavingSub:'not checked',
  waBySignal:'Indicators by type', waBySignalLead:'People with the indicator / people it could be checked for.', waByDept:'By department', waByDeptLead:'Share of the department with at least one indicator.',
  waIndicator:'Indicator', waFired:'Shown', waCheckable:'Could be checked', waChecked:'Could be checked for', waHidden:'Groups under 5 people are not shown here: ', waPooled:'Smaller departments combined',
  waPeople:'People and their indicators', waPeopleLead:'HR only. Open with a conversation about the work and growth, not with the indicator itself.', waHrOnly:'Names are shown to HR only.', waNone:'Nobody shows an indicator.',
  waScore:'Count', waUnknown:'Could not check', waSig_new_hire:'Less than a year in the company', waSig_pay_static:'No pay change in 18+ months',
  waSig_low_rating:'Last performance rating in the bottom band', waSig_attendance_up:'Rising lateness or absence', waSig_manager_change:'Manager changed in the last 6 months',
  waSs_new_hire:'tenure', waSs_pay_static:'pay', waSs_low_rating:'rating', waSs_attendance_up:'attendance', waSs_manager_change:'manager',
  waHired:'Hired', waLastChange:'Last change', waRatingK:'Rating', waLateK:'Late', waAbsK:'Absent', waVsPrior:'vs', waPriorNote:'(last 90 days vs the 90 before)', waMgrNew:'New manager since', waMgrLeft:'Manager left on',
  waCk_wa_no_last_day:'Inactive without a last working day (left out)', waCk_wa_end_before_start:'Last working day before the hire date', waCk_wa_orphan_reports:'Manager has left or is inactive', waCk_wa_no_hire_date:'No hire date',
  waR_termination:'Ended by the company', waR_contract_end:'Contract ended', waR_retirement:'Retirement', waR_other:'Other', waR_unrecorded:'Not recorded'
});

var css = '' +
// Chart tokens live on body, so charts drawn outside .db (home, my file, reports) read the same validated values.
// Light (white card): #2E7D4F / #C98500 / #2a78d6, all-pairs CVD dE 10.5, normal 21.5, all >= 3:1.
// Dark (card var(--g-17201B,#17201B)): #1F7A4A / #C98500 / #4688E0, all-pairs CVD dE 11.2, normal 23.0, all >= 3:1 (dataviz validate_palette.js, 2026-10-14).
'body{--s1:#2E7D4F;--s2:#C98500;--s3:#2a78d6;--grid:var(--g-E6E9E6,#E6E9E6);--axis:#C3C8C4;--muted:#66726A;--wash:var(--g-EEF2EF,#EEF2EF)}' +
'html[data-theme="dark"] body{--s1:#1F7A4A;--s2:#C98500;--s3:#4688E0;--grid:var(--g-26322B,#26322B);--axis:var(--g-3A4740,#3A4740);--muted:var(--g-93A097,#93A097);--wash:var(--g-1F2A24,#1F2A24)}' +
'.db-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 14px}' +
'.db-filters button{height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink-2);display:inline-flex;align-items:center;gap:8px}' +
'.db-filters button[aria-pressed="true"]{background:var(--brand);color:var(--on-brand,#fff);border-color:var(--brand)}' +
'.db-filters .sp{flex:1}.db-filters small{color:var(--ink-2)}' +
'.db-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}@media (max-width:1023px){.db-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
'.db-tile{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:12px 16px;min-width:0}' +
'.db-tile span{display:block;font-size:13px;color:var(--ink-2)}' +
'.db-tile b{display:block;font-size:28px;font-weight:600;line-height:1.2;margin-top:2px}' +
'.db-tile small{display:block;font-size:12px;color:var(--ink-2);margin-top:2px}' +
'.db-tile .up{color:var(--ok)}.db-tile .down{color:var(--bad)}' +
'.db-tile.lead{grid-column:1 / -1;background:var(--pine);border-color:var(--pine);color:var(--cream)}.db-tile.lead span,.db-tile.lead small{color:var(--g-AFC0AD,#AFC0AD)}' +
'.db-tile.lead b{font-size:48px}.db-tile.lead .up{color:var(--signal)}.db-tile.lead .down{color:#F4B4A8}' +
'.db-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin-bottom:14px}' +
'.db-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:16px 16px;min-width:0;position:relative}' +
'.db-card h3{margin:0;font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px}.db-ch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 4px}.db-ch .sp{flex:1}.db-card h3 .sp{flex:1}' +
'.db-card > p{margin:2px 0 10px;color:var(--ink-2);font-size:13px}' +
'.db-card .tg{height:28px;padding:0 12px;border-radius:8px;border:1px solid var(--line);background:var(--paper);font-size:12px;color:var(--ink-2)}' +
'.db-h{margin:22px 0 10px;font-size:18px;font-weight:600}' +
'.db-svg{width:100%;height:auto;display:block;overflow:visible;direction:ltr;unicode-bidi:isolate}' +
'.db-svg text{direction:ltr;unicode-bidi:plaintext}' +
'.db-svg text{font-size:11px;fill:var(--muted);font-family:var(--font)}' +
'.db-cols{display:flex;align-items:flex-end;gap:2px;height:150px;direction:ltr;padding-top:20px}' +
'.db-cols .c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0;cursor:default}' +
'.db-cols .c i{display:block;width:78%;max-width:34px;background:var(--s1);border-radius:4px 4px 0 0;min-height:1px;transition:opacity .15s}' +
'.db-cols .c i.alt{background:var(--s2)}.db-cols .c:hover i,.db-cols .c:focus i{opacity:.75}' +
'.db-cols .c span{font-size:11px;color:var(--muted);margin-top:4px;white-space:nowrap}' +
'.db-cols .c em{font-style:normal;font-size:11px;color:var(--ink-2);margin-bottom:2px;font-variant-numeric:tabular-nums}' +
'.db-cols .grp{flex:1;display:flex;align-items:flex-end;justify-content:center;gap:2px;height:100%;flex-direction:row;position:relative;padding-bottom:20px}' +
'.db-cols .grp i{width:40%;max-width:14px;border-radius:4px 4px 0 0;background:var(--s1)}.db-cols .grp i.b{background:var(--s2)}' +
'.db-cols .grp span{position:absolute;bottom:0;font-size:11px;color:var(--muted)}' +
'.db-hbars{display:grid;gap:8px}' +
'.db-hb{display:grid;grid-template-columns:minmax(90px,32%) 1fr auto;gap:12px;align-items:center;font-size:13px}' +
'.db-hb .tr{height:14px;background:var(--wash);border-radius:4px;position:relative;overflow:hidden}' +
'.db-hb .tr i{position:absolute;inset-block:0;inset-inline-start:0;background:var(--s1);border-radius:4px}' +
'.db-hb .tr i.gray{background:var(--axis)}.db-hb b{font-weight:500;font-variant-numeric:tabular-nums;min-width:52px;text-align:end}' +
'.db-hb .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.db-stack{display:flex;height:14px;border-radius:4px;overflow:hidden;gap:2px;background:var(--card)}' +
'.db-stack i{display:block;height:100%}.db-stack i:first-child{background:var(--s1)}.db-stack i:last-child{background:var(--s3)}' +
'.db-meter{position:relative;height:18px;background:var(--wash);border-radius:6px;margin:14px 0 6px}' +
'.db-meter i{position:absolute;inset-block:0;inset-inline-start:0;background:var(--s1);border-radius:6px}' +
'.db-meter u{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--ink)}' +
'.db-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--ink-2);margin-top:8px}' +
'.db-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-inline-end:5px;vertical-align:middle}.db-legend i.ln{height:2px;width:14px;border-radius:2px}' +
'.db-tip{position:fixed;z-index:95;pointer-events:none;background:var(--ink);color:var(--cream);border-radius:8px;padding:6px 12px;font-size:12px;line-height:1.5;box-shadow:var(--e3);white-space:nowrap}' +
'.db-tip b{font-size:14px}.db-tip .k{display:inline-block;width:12px;height:2px;margin-inline-end:6px;vertical-align:middle}' +
'.db-status{display:inline-flex;align-items:center;gap:4px}' +
'.gauge{width:230px;max-width:100%;height:auto;display:block}.gauge text{fill:var(--ink-3,var(--g-5F6D63,#5F6D63));font-family:var(--font);font-size:11px}' +
'.gauge .val{fill:var(--ink);font-size:40px;font-weight:600;font-variation-settings:"HEXP" 80}.gauge .unit{fill:var(--ink-3,var(--g-5F6D63,#5F6D63));font-size:11px}' +
'.gauge .needle{transform-origin:115px 115px;transition:transform 1.1s cubic-bezier(.2,.9,.25,1.15)}@media (prefers-reduced-motion:reduce){.gauge .needle{transition:none}}' +
// calmer surfaces: no hard borders, one soft tinted shadow (redesign-skill: tinted shadows, hierarchy by elevation)
'.db-card,.db-tile{border-color:transparent;box-shadow:var(--e3)}.db-tile{border-radius:16px}.db-card{border-radius:16px}' +
'.db-tile.lead{box-shadow:var(--e3);background:radial-gradient(90% 120% at 100% 0%, rgba(var(--signal-rgb),.18), transparent 55%), linear-gradient(155deg,var(--pine-3),var(--pine) 75%)}' +
'.db-tile b{font-variant-numeric:tabular-nums;letter-spacing:-.01em}' +
'.db-tile b .db-status{display:inline-flex;font-size:inherit;color:inherit;gap:8px}.db-tile b .db-status i{font-size:.6em}' +
'.db-panel{background:var(--paper);border:1px solid var(--line);border-radius:var(--r-m);padding:12px 16px 2px;margin:0 0 16px}' +
'.db-ph{display:flex;align-items:center;gap:8px;margin-bottom:10px}.db-ph h3,.db-ph h2{margin:0;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;flex:1}.db-ph h2 i,.db-ph h3 i{color:var(--brand);font-size:18px}' +
'.db-panel .db-tiles{margin-bottom:12px}.db-panel .db-grid{margin-bottom:12px}.db-panel .db-tile.lead b{font-size:32px}' +
'.db-panel .tg{height:28px;padding:0 12px;border-radius:8px;border:1px solid var(--line);background:var(--card);font-size:12px;color:var(--ink-2)}' +
// workforce analytics: three-series columns, signal chips, information notes (status colours only, never a series colour on text)
'.db-cols .grp i.c{background:var(--s3)}.db-cols.wa-n3 .grp i{width:27%}.db-cols .grp.dim span{color:var(--ink-3,var(--g-5F6D63,#5F6D63))}' +
'.db-cols.wa-n2 .grp span,.db-cols.wa-n3 .grp span{white-space:nowrap}@media (max-width:640px){.db-cols.wa-n2 .grp:nth-child(even) span{visibility:hidden}}' +
'.wa-note{display:flex;gap:8px;align-items:flex-start;background:var(--info-bg,#E8F1FC);color:var(--ink);border-radius:12px;padding:12px 12px;font-size:13px;line-height:1.6;margin:0 0 12px}' +
'.wa-note > i{color:var(--info,#1F5FAE);font-size:18px;flex:none;margin-top:1px}' +
'.wa-chips{display:flex;flex-wrap:wrap;gap:8px;white-space:normal}.wa-chips .chip{white-space:normal;line-height:1.45}.wa-chips .chip small{color:var(--ink-3,var(--g-5F6D63,#5F6D63));margin-inline-start:4px}' +
'.wa-unk{display:block;color:var(--ink-3,var(--g-5F6D63,#5F6D63));font-size:12px;margin-top:4px;white-space:normal}' +
'.wa-checks{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}.wa-ck{display:inline-flex;align-items:center;gap:8px;font-size:13px;padding:4px 12px;border-radius:999px}' +
'.wa-ck.warn{background:var(--warn-bg,#FBF1DC);color:var(--warn,#8A5A00)}.wa-ck.info{background:var(--info-bg,#E8F1FC);color:var(--info,#1F5FAE)}' +
'.wa-flag{display:inline-flex;align-items:center;gap:4px;color:var(--info,#1F5FAE)}.db-card td.wa-who{white-space:normal;min-width:150px}.db-card td.wa-sig{white-space:normal;min-width:240px;text-align:start}' +
'@media (min-width:1024px){.db-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}.db-tiles:has(> :nth-child(5)){grid-template-columns:repeat(3,minmax(0,1fr))}.db-tiles:has(> :nth-child(7)){grid-template-columns:repeat(4,minmax(0,1fr))}.db-tiles:not(:has(> :nth-child(4))){grid-template-columns:repeat(3,minmax(0,1fr))}.db-tiles:not(:has(> :nth-child(3))){grid-template-columns:repeat(2,minmax(0,1fr))}.db-tile.lead{grid-column:auto}.db-grid.two{grid-template-columns:1.4fr 1fr}.db-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
// ---- 2026-10-14 (skills: kpi-dashboard-design, dataviz, motion-system): delta pills, sparklines, drill-down tiles, view toggle, empty and loading states ----
'.db-tile{display:flex;flex-direction:column;gap:2px}' +
'.db-tile .db-lb{display:flex;align-items:center;gap:8px}.db-tile .db-lb i{font-size:16px;color:var(--t-fg,var(--brand))}' +
'.db-tf{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:6px;min-height:28px;flex-wrap:wrap}' +
':root body .db-tile small.db-delta,:root body .hm-k small.db-delta,small.db-delta{display:inline-flex;align-items:center;gap:4px;width:fit-content;max-width:100%;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.6;margin:0;white-space:normal}' +
'.db-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.db-basis{display:flex;align-items:center;gap:8px;margin:-4px 2px 10px;font-size:13px;color:var(--ink-3)}.db-basis i{font-size:16px}' +
'.db-delta i{font-size:13px;flex:none}.db-delta bdi{font-variant-numeric:tabular-nums}' +
':root body small.db-delta.up{background:var(--ok-bg)!important;color:var(--ok)!important}:root body small.db-delta.down{background:var(--bad-bg)!important;color:var(--bad)!important}:root body small.db-delta.flat{background:var(--well)!important;color:var(--ink-3)!important}:root body small.db-delta.neu{background:var(--info-bg)!important;color:var(--info)!important}' +
'.db-spark{width:96px;height:28px;flex:none;display:block;overflow:visible;direction:ltr;margin-inline-start:auto}' +
'.db-spark .l{fill:none;stroke:var(--s1);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.db-spark .a{fill:var(--s1);opacity:.13;stroke:none}' +
'.db-spark circle{fill:var(--s1);stroke:var(--card);stroke-width:2}.db-spark.warm .l,.db-spark.warm circle{stroke:var(--s2)}.db-spark.warm circle,.db-spark.warm .a{fill:var(--s2)}.db-spark.warm circle{stroke:var(--card)}' +
'.db-tile.is-go,.hm-k.is-go{cursor:pointer}:root body .db-tile::before{display:none}' +
':root body .db-tile > .db-go,:root body .hm-k > .db-go{position:absolute;top:10px;inset-inline-end:10px;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:var(--t-fg,var(--brand));font-size:16px;z-index:2;background:color-mix(in srgb,var(--card) 70%,transparent);transition:transform var(--mo-base,.18s) var(--ease-out,ease-out)}' +
'@media (hover:hover){.is-go:hover > .db-go{transform:translate(calc(var(--mo-x,1) * 2px),-2px)}}' +
'[dir="rtl"] .is-go{--mo-x:-1}' +
'.is-go:focus-visible{outline:2px solid var(--brand);outline-offset:2px}' +
'.db-card h3{flex-wrap:wrap}.db-tools{display:inline-flex;align-items:center;gap:8px}' +
'.db-seg{display:inline-flex;padding:2px;border-radius:8px;background:var(--well);gap:2px}' +
'.db-seg button{width:30px;height:26px;border:0;border-radius:8px;background:none;color:var(--ink-3);display:grid;place-items:center;font-size:16px;cursor:pointer;transition:background-color var(--mo-base,.18s),color var(--mo-base,.18s)}' +
'.db-seg button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:var(--e1)}' +
'.db-open{height:28px;padding:0 8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink-2);font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:pointer}' +
'.db-open:hover{border-color:var(--input);color:var(--ink)}.db-open i{font-size:14px}' +
'.db-empty{display:grid;justify-items:center;gap:8px;padding:20px 8px;color:var(--ink-3);font-size:13px;text-align:center}' +
'.db-empty i{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:var(--well);color:var(--ink-3);font-size:28px}' +
'.db-skc{height:150px;display:flex;align-items:flex-end;gap:8px;padding:16px 4px 0;direction:ltr}.db-skc .sk{flex:1;border-radius:6px 6px 0 0;height:auto}' +
'.db-skh{display:flex;gap:12px;align-items:center;margin-bottom:8px}.db-skh .sk{height:14px}' +
'.db-ring{display:block;flex:none;direction:ltr}.db-ring .tr{fill:none;stroke:var(--wash);stroke-width:7}.db-ring .fg{fill:none;stroke:var(--s1);stroke-width:7;stroke-linecap:round}.db-ring.warm .fg{stroke:var(--s2)}' +
'.db-ring text{fill:var(--ink);font-family:var(--f-num,inherit);font-size:13px;font-weight:700}' +
'@media print{.db-seg,.db-open,.db-go{display:none!important}}' +
'@media print{.tabs,.topbar,.hr-rail,.db-filters button,.db-card .tg,.update-bar{display:none!important}.app{padding:0!important}.hr-shell{display:block!important;min-height:0!important}.db-card,.db-tile{break-inside:avoid}body{background:#fff}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var tip = null, gradN = 0;
function showTip(ev, html){
  if (!tip) { tip = document.createElement('div'); tip.className = 'db-tip'; document.body.appendChild(tip); }
  tip.innerHTML = html; tip.style.display = 'block';
  var x = ev.clientX, y = ev.clientY, w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px'; tip.style.top = Math.max(8, y - tip.offsetHeight - 14) + 'px';
}
function hideTip(){ if (tip) tip.style.display = 'none'; }
function n1(v, d){ return v == null ? '-' : Number(v).toLocaleString(LOCALE(), { maximumFractionDigits: d == null ? 1 : d }); }
function sar(v){ return v == null ? '-' : Number(v).toLocaleString(LOCALE(), { maximumFractionDigits: 0 }) + ' ' + t('mfSar'); }
function shortDate(d){ return new Date(d + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', timeZone: 'UTC' }); }
function monthShort(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'short', year: '2-digit' }); }
function hm(min){ return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
function tx(s){ return esc(s == null ? '' : String(s)); }

/** Whether the viewer may open "area:sub" (the same role predicates the shell uses). A list picks the first allowed. */
function goOk(dest){
  if (!dest) return null;
  if (Array.isArray(dest)) { for (var i = 0; i < dest.length; i++) if (goOk(dest[i])) return dest[i]; return null; }
  if (typeof areaOf !== 'function' || typeof subsOf !== 'function') return null;
  var p = String(dest).split(':'), a = areaOf(p[0]); if (!a) return null;
  var subs = subsOf(a); if (!subs.length) return null;
  return !p[1] || subs.some(function(s){ return s.id === p[1]; }) ? dest : null;
}
function goArrow(){ return '<span class="db-go" aria-hidden="true">' + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</span>'; }
/** The change against the previous period as a pill: arrow, signed amount, words. Colour follows good/bad, never alone. */
function delta(d, goodUp, unit, words){
  if (d == null || !isFinite(d)) return '';
  // the basis ("vs previous period", "vs yesterday") is said once above the row; in the pill it is a tooltip and screen-reader text
  var w = words || t('dbVsPrev');
  if (Math.abs(d) < 0.05) return '<small class="db-delta flat" title="' + tx(w) + '">' + ph('equals') + t('dbNoChange') + '<span class="db-sr"> ' + w + '</span></small>';
  var up = d > 0, good = up === goodUp; // goodUp null: neither direction is good or bad (cost, overtime): a neutral pill
  return '<small class="db-delta ' + (goodUp == null ? 'neu' : good ? 'up' : 'down') + '" title="' + tx(w) + '">' + ph(up ? 'trend-up' : 'trend-down') + '<bdi dir="ltr">' + (up ? '+' : '−') + n1(Math.abs(d)) + '</bdi>' + (unit ? ' ' + unit : '') + '<span class="db-sr"> ' + w + '</span></small>';
}
/** A sparkline: values oldest first, 96 x 28, 2px line, soft area, a dot on the latest value. Time runs left to right. */
function spark(vals, opts){
  opts = opts || {};
  var v = (vals || []).map(function(x){ return x == null || !isFinite(x) ? null : Number(x); }).filter(function(x){ return x != null; });
  if (v.length < 2) return '';
  var W = 96, H = 28, pad = 3, min = opts.min != null ? opts.min : Math.min.apply(null, v), max = opts.max != null ? opts.max : Math.max.apply(null, v);
  if (max === min) { max = max + 1; min = min - 1; }
  var x = function(i){ return pad + i * (W - pad * 2) / (v.length - 1); }, y = function(n){ return pad + (H - pad * 2) * (1 - (n - min) / (max - min)); };
  var line = v.map(function(n, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(n).toFixed(1); }).join(' ');
  var area = line + ' L' + x(v.length - 1).toFixed(1) + ' ' + H + ' L' + x(0).toFixed(1) + ' ' + H + ' Z';
  var label = (opts.label || t('dbSparkOf')) + ': ' + t('dbFromTo').replace('{a}', n1(v[0])).replace('{b}', n1(v[v.length - 1]));
  return '<svg class="db-spark' + (opts.warm ? ' warm' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + tx(label) + '" data-tip="' + tx(label) + '"><path class="a" d="' + area + '"/><path class="l mo-line" pathLength="1" d="' + line + '"/>' +
    '<circle class="mo-dot" r="3" cx="' + x(v.length - 1).toFixed(1) + '" cy="' + y(v[v.length - 1]).toFixed(1) + '"/></svg>';
}
/**
 * A stat tile. delta: change vs the previous period; goodUp: whether up is good.
 * o (optional): { spark: [values oldest first], sparkOpts, go: 'area:sub' or a list (first allowed wins), icon }.
 * With go the whole tile opens that screen (click, Enter or Space) and shows an arrow.
 */
function tile(label, value, sub, d, goodUp, hero, unit, o){
  o = o || {};
  var dest = goOk(o.go), dl = delta(d, goodUp, unit, o.words), sp = o.spark ? spark(o.spark, o.sparkOpts) : '';
  var head = o.icon ? '<span class="db-lb">' + ph(o.icon, 'duotone') + label + '</span>' : '<span>' + label + '</span>';
  var attrs = dest ? ' data-go="' + dest + '" role="link" tabindex="0" aria-label="' + tx(String(label).replace(/<[^>]*>/g, '')) + ': ' + tx(String(value).replace(/<[^>]*>/g, '')) + ' · ' + t('dbOpenIn') + '"' : '';
  return '<div class="db-tile' + (hero ? ' lead' : '') + (dest ? ' is-go' : '') + '"' + attrs + '>' + head + '<b>' + value + '</b>' +
    (dl || sp ? '<div class="db-tf">' + dl + sp + '</div>' : '') + (sub ? '<small>' + sub + '</small>' : '') + (dest ? goArrow() : '') + '</div>';
}

/** No data yet: an icon in a quiet well and one line. */
function empty(text, icon){ return '<div class="db-empty">' + ph(icon || 'chart-bar', 'duotone') + '<span>' + (text || t('dbNoData')) + '</span></div>'; }

/** A card with a chart and its table view (a two-button chart / table switch). go: a screen to open from the card. */
function card(id, title, lead, chart, table, go){
  var dest = goOk(go === undefined ? CARD_GO[id] : go); // CARD_GO only for the dashboard's own cards (other screens call Viz.card)
  var tools = (table ? '<span class="db-seg" role="group" aria-label="' + t('dbViewAs') + '"><button type="button" data-tg="' + id + '" data-m="chart" aria-pressed="true" aria-label="' + t('dbChartView') + '" title="' + t('dbChartView') + '">' + ph('chart-bar') + '</button>' +
      '<button type="button" data-tg="' + id + '" data-m="table" aria-pressed="false" aria-label="' + t('dbTableView') + '" title="' + t('dbTableView') + '">' + ph('table') + '</button></span>' : '') +
    (dest ? '<button type="button" class="db-open" data-go="' + dest + '">' + t('dbOpen') + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</button>' : '');
  return '<div class="db-card" data-card="' + id + '"><div class="db-ch"><h3>' + title + '</h3><span class="sp"></span>' + (tools ? '<span class="db-tools">' + tools + '</span>' : '') + '</div>' +
    (lead ? '<p>' + lead + '</p>' : '') + '<div data-v="chart">' + chart + '</div>' + (table ? '<div data-v="table" class="hidden">' + table + '</div>' : '') + '</div>';
}
/** Where each dashboard card drills to (first allowed screen wins). */
var CARD_GO = { trend: ['time:board', 'insights:attendance'], wd: ['insights:attendance'], ci: ['time:board'], dept: ['insights:attendance'], late: ['insights:attendance'], abs: ['time:board', 'insights:attendance'],
  mix: ['people:directory'], ten: ['people:directory'], mov: ['people:onboarding', 'people:offboarding'], lv: ['requests:leave'], rq: ['requests:inbox', 'requests:centre'], pf: ['growth:cycle'],
  cost: ['pay:runs'], cd: ['pay:runs'], watr: ['people:offboarding', 'insights:reports'], wasp: ['people:offboarding', 'insights:reports'], wate: ['people:directory', 'insights:reports'],
  wasc: ['people:org', 'people:directory'], waco: ['people:onboarding', 'insights:reports'], wasg: ['growth:plans', 'insights:reports'], wadp: ['growth:plans', 'insights:reports'], wapp: ['growth:plans'] };
function tbl(head, rows){ return '<div class="tblwrap"><table class="tbl"><thead><tr>' + head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td class="num">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }

/** Line chart, one series, y from 0 to max; crosshair snaps to the nearest point. */
function lineChart(pts, opts){
  if (!pts.length) return empty(null, 'chart-line');
  var W = 640, H = 200, L = 48, R = 10, Tt = 10, Bm = 26, max = opts.max || Math.max.apply(null, pts.map(function(p){ return p.y || 0; }).concat([1]));
  var x = function(i){ return L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)); }, y = function(v){ return Tt + (H - Tt - Bm) * (1 - (v || 0) / max); };
  var grid = [0, 0.5, 1].map(function(f){ var v = max * f, yy = y(v); return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--grid)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + n1(v, 0) + (opts.suffix || '') + '</text>'; }).join('');
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1); }).join(' ');
  var step = Math.max(1, Math.ceil(pts.length / 6)), labels = pts.map(function(p, i){ var last = pts.length - 1; return (i % step || (i !== last && last - i < step * 0.7)) && i !== last ? '' : '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + tx(p.label) + '</text>'; }).join('');
  var dotsLast = '<circle class="mo-dot" cx="' + x(pts.length - 1) + '" cy="' + y(pts[pts.length - 1].y) + '" r="4" style="fill:var(--s1);stroke:var(--card)" stroke-width="2"/>';
  var gid = 'dbg' + (++gradN), area = d + ' L' + x(pts.length - 1).toFixed(1) + ' ' + y(0).toFixed(1) + ' L' + x(0).toFixed(1) + ' ' + y(0).toFixed(1) + ' Z';
  return '<svg class="db-svg" dir="ltr" viewBox="0 0 ' + W + ' ' + H + '" data-line=\'' + esc(JSON.stringify({ pts: pts, L: L, R: R, W: W, suffix: opts.suffix || '', fmt: opts.fmt || '' })) + '\' role="img" aria-label="' + tx(opts.aria || '') + '">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s1);stop-opacity:.2"/><stop offset="1" style="stop-color:var(--s1);stop-opacity:0"/></linearGradient></defs>' + grid +
    '<path class="mo-area" d="' + area + '" fill="url(#' + gid + ')" stroke="none"/>' +
    '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" style="stroke:var(--axis)"/>' + '<path class="mo-line" pathLength="1" d="' + d + '" fill="none" style="stroke:var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dotsLast + labels +
    '<line class="xh" x1="0" x2="0" y1="' + Tt + '" y2="' + (H - Bm) + '" stroke="var(--ink-2)" stroke-width="1" style="display:none"/><rect x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" fill="transparent"/></svg>';
}
function wireLines(root){
  $$('svg[data-line]', root).forEach(function(svg){
    var o = JSON.parse(svg.getAttribute('data-line')), xh = svg.querySelector('.xh');
    svg.addEventListener('pointermove', function(ev){
      var r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * o.W, n = o.pts.length;
      var i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((sx - o.L) / (o.W - o.L - o.R) * (n - 1))));
      var px = n === 1 ? (o.W - o.L - o.R) / 2 + o.L : o.L + i * (o.W - o.L - o.R) / (n - 1);
      xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.display = '';
      var p = o.pts[i];
      showTip(ev, '<b>' + (o.fmt === 'sar' ? sar(p.y) : n1(p.y) + o.suffix) + '</b><br><span class="k" style="background:var(--s1)"></span>' + tx(p.label) + (p.note ? '<br>' + tx(p.note) : ''));
    });
    svg.addEventListener('pointerleave', function(){ xh.style.display = 'none'; hideTip(); });
  });
}
/** Columns: items [{label, value, tip}] with optional marker at index. Bars grow in one after another (--i). */
function cols(items, opts){
  if (!items.length) return empty();
  var max = Math.max.apply(null, items.map(function(i){ return i.value || 0; }).concat([opts && opts.max || 1]));
  return '<div class="db-cols">' + items.map(function(i, n){
    return '<div class="c" tabindex="0" data-tip="' + esc(i.tip || (n1(i.value) + ' ' + (i.label || ''))) + '">' + (opts && opts.labels ? '<em>' + (i.value ? n1(i.value, 0) + (opts.suffix || '') : '') + '</em>' : '') +
      '<i class="' + (i.alt ? 'alt' : '') + '" style="height:' + ((i.value || 0) / max * 100) + '%;--i:' + Math.min(n, 16) + '"></i><span>' + tx(i.label) + '</span></div>';
  }).join('') + '</div>';
}
function grouped(items){
  if (!items.length || items.every(function(i){ return !i.a && !i.b; })) return empty();
  var max = Math.max.apply(null, items.map(function(i){ return Math.max(i.a, i.b); }).concat([1]));
  return '<div class="db-cols" style="height:140px">' + items.map(function(i, n){
    return '<div class="grp" tabindex="0" data-tip="' + esc(tx(i.label) + ': ' + t('dbJoiners') + ' ' + i.a + '، ' + t('dbLeavers') + ' ' + i.b) + '"><i style="height:' + (i.a / max * 100) + '%;--i:' + Math.min(n, 16) + '"></i><i class="b" style="height:' + (i.b / max * 100) + '%;--i:' + Math.min(n, 16) + '"></i><span>' + tx(i.label) + '</span></div>';
  }).join('') + '</div><div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('dbJoiners') + '</span><span><i style="background:var(--s2)"></i>' + t('dbLeavers') + '</span></div>';
}
function hbars(items, opts){
  if (!items.length) return empty(null, 'chart-bar-horizontal');
  var max = opts && opts.max || Math.max.apply(null, items.map(function(i){ return i.value || 0; }).concat([1]));
  return '<div class="db-hbars">' + items.map(function(i, n){
    return '<div class="db-hb" tabindex="0" data-tip="' + esc(i.tip || '') + '"><span class="nm">' + tx(i.label) + '</span><div class="tr"><i class="' + (i.gray ? 'gray' : '') + '" style="width:' + Math.max(0, Math.min(100, (i.value || 0) / max * 100)) + '%;--i:' + Math.min(n, 12) + '"></i></div><b>' + i.text + '</b></div>';
  }).join('') + '</div>';
}
function wireTips(root){
  $$('[data-tip]', root).forEach(function(el){
    if (!el.getAttribute('data-tip') || el.dataset.tipOn) return;
    el.dataset.tipOn = '1';
    el.addEventListener('pointermove', function(ev){ showTip(ev, esc(el.getAttribute('data-tip'))); });
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('focus', function(){ var r = el.getBoundingClientRect(); showTip({ clientX: r.left + r.width / 2, clientY: r.top }, esc(el.getAttribute('data-tip'))); });
    el.addEventListener('blur', hideTip);
  });
  // chart / table switch: two pressed-state buttons per card
  $$('[data-tg]', root).forEach(function(b){ b.onclick = function(){
    var c = b.closest('.db-card, [data-tgbox]'), tab = b.dataset.m === 'table'; if (!c) return;
    $$('[data-tg]', c).forEach(function(x){ x.setAttribute('aria-pressed', String((x.dataset.m === 'table') === tab)); });
    c.querySelector('[data-v="chart"]').classList.toggle('hidden', tab); c.querySelector('[data-v="table"]').classList.toggle('hidden', !tab);
  }; });
  wireGo(root);
}
/** Drill-down: any [data-go="area:sub"] opens that screen on click, Enter or Space. */
function wireGo(root){
  $$('[data-go*=":"]', root).forEach(function(el){
    el.onclick = function(){ hideTip(); var p = el.dataset.go.split(':'); if (window.goArea) goArea(p[0], p[1], p[2]); };
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A') el.onkeydown = function(e){ if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.onclick(e); } };
  });
}

function range(k){
  var td = riyadhToday(), d = new Date(td + 'T00:00:00Z');
  if (k === 'last') { var a = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)), b = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)); return [a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]; }
  if (k === '30' || k === '90') return [new Date(d.getTime() - (Number(k) - 1) * 86400000).toISOString().slice(0, 10), td];
  return [td.slice(0, 8) + '01', td];
}

/** Loading state shaped like the page: a tile row and chart cards with column ghosts. */
function skelPage(tiles, cards){
  var col = function(){ return '<div class="db-card" aria-hidden="true"><div class="db-skh"><span class="sk" style="width:38%"></span></div><span class="sk" style="width:62%;height:10px"></span><div class="db-skc">' +
    [46, 70, 58, 84, 62, 76, 52, 90, 66].map(function(h){ return '<span class="sk" style="height:' + h + '%"></span>'; }).join('') + '</div></div>'; };
  var h = skeleton(tiles || 6);
  for (var i = 0; i < (cards || 2); i += 2) h += '<div class="db-grid two">' + col() + col() + '</div>';
  return '<div role="status" aria-label="' + t('dbLoading') + '">' + h + '</div>';
}

function section(body){
  var k = S.dbRange || 'month';
  body.innerHTML = '<div class="db"><div class="hr-h"><h2>' + t('dbTitle') + '</h2></div><div class="db-filters" role="group" aria-label="' + t('dbTitle') + '">' + [['month', 'dbThisMonth'], ['last', 'dbLastMonth'], ['30', 'dbLast30'], ['90', 'dbLast90']].map(function(x){
    return '<button type="button" data-r="' + x[0] + '" aria-pressed="' + (k === x[0]) + '">' + t(x[1]) + '</button>'; }).join('') + '<span class="sp"></span><small id="dbGen"></small><button type="button" id="dbPrint">' + ph('printer') + ' ' + t('dbPrint') + '</button></div><div id="dbBody"></div></div>';
  $$('[data-r]', body).forEach(function(b){ b.onclick = function(){
    if (b.getAttribute('aria-pressed') === 'true') return;
    S.dbRange = b.dataset.r; $$('[data-r]', body).forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); load();
  }; });
  $('#dbPrint', body).onclick = function(){ window.print(); };
  var el = $('#dbBody', body), seq = 0;
  function load(){
    var rg = range(S.dbRange || 'month'), my = ++seq;
    el.innerHTML = skelPage(6, 4);
    apiFresh('dashboard', { from: rg[0], to: rg[1], analytics: 1 }, function(r){
      if (!el.isConnected || my !== seq) return; // a later period was picked meanwhile
      if (!r.ok) { el.innerHTML = '<div class="db-empty">' + ph('wifi-slash', 'duotone') + '<span>' + errText(r.error) + '</span><button type="button" class="btn btn-line btn-sm" id="dbRetry">' + t('retry') + '</button></div>'; $('#dbRetry', el).onclick = load; return; }
      $('#dbGen', body).textContent = t('dbGenerated') + ' ' + new Date(r.generatedAt).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = draw(r); wireLines(el); wireTips(el);
    });
  }
  load();
}

/** Headcount at the end of each movement month, worked back from today's count (oldest first). */
function headcountSeries(now, mv){
  if (now == null || !mv || !mv.length) return [];
  var out = [now], hc = now;
  for (var i = mv.length - 1; i > 0; i--) { hc = hc - (mv[i].joiners || 0) + (mv[i].leavers || 0); out.unshift(hc); }
  return out;
}
function draw(r){
  var A = r.attendance || {}, T0 = A.totals || {}, P = r.attendancePrev || {}, h = '';
  var dRate = P.attendanceRate != null && T0.attendanceRate != null ? T0.attendanceRate - P.attendanceRate : null;
  var dPunct = P.punctuality != null && T0.punctuality != null ? T0.punctuality - P.punctuality : null;
  var dd = A.daily || [], dif = function(k){ return P[k] != null && T0[k] != null ? T0[k] - P[k] : null; };
  var ser = function(f){ return dd.map(f); };
  h += (r.prevFrom ? '<p class="db-basis">' + ph('arrows-left-right') + t('dbBasis').replace('{a}', '<bdi>' + shortDate(r.prevFrom) + '</bdi>').replace('{b}', '<bdi>' + shortDate(r.prevTo) + '</bdi>') + '</p>' : '') +
    '<div class="db-tiles">' + tile(t('dbAttRate'), n1(T0.attendanceRate) + '%', plural(T0.present || 0, 'days') + ' / ' + n1(T0.expected, 0), dRate, true, true, t('dbPts'),
      { icon: 'user-check', spark: ser(function(d){ return d.rate; }), sparkOpts: { min: 0, max: 100, label: t('dbAttRate') }, go: ['time:board', 'insights:attendance'] }) +
    tile(t('dbPunct'), n1(T0.punctuality) + '%', '', dPunct, true, false, t('dbPts'), { icon: 'timer', spark: ser(function(d){ return d.punctual; }), sparkOpts: { min: 0, max: 100, label: t('dbPunct') }, go: ['insights:attendance'] }) +
    tile(t('dbAvgLate'), n1(T0.avgLate, 0) + ' ' + t('dbMinutes'), plural(T0.late || 0, 'days'), dif('avgLate'), false, false, t('dbMinutes'),
      { icon: 'clock-countdown', spark: ser(function(d){ return d.late; }), sparkOpts: { min: 0, warm: true, label: t('late') }, go: ['insights:attendance'] }) +
    tile(t('dbAbsent'), n1(T0.absent, 0), T0.missingOut ? t('dbMissingOut') + ' ' + T0.missingOut : '', dif('absent'), false, false, '',
      { icon: 'user-minus', spark: ser(function(d){ return Math.max(0, (d.expected || 0) - (d.present || 0)); }), sparkOpts: { min: 0, warm: true, label: t('dbAbsent') }, go: ['time:board', 'insights:attendance'] }) +
    tile(t('dbOvertime'), n1(T0.overtimeHours), '', dif('overtimeHours'), null, false, t('dbHours'), { icon: 'hourglass-medium', go: ['insights:reports'] }) +
    tile(t('dbOnLeave'), n1(r.leave && r.leave.onLeaveToday, 0), T0.review ? '<span class="db-status">' + ph('warning') + ' ' + t('dbReview') + ' ' + T0.review + '</span>' : '', null, true, false, '',
      { icon: 'airplane-tilt', go: ['requests:leave'] }) + '</div>';

  // attendance: trend, weekday, check-in times
  var daily = (A.daily || []).map(function(d){ return { label: shortDate(d.date), y: d.rate, note: d.present + ' / ' + d.expected }; });
  var wd = (A.weekday || []).map(function(w){ return { label: t('dows')[w.dow], value: w.lateRate || 0, tip: t('dows')[w.dow] + ': ' + n1(w.lateRate) + '% (' + w.late + ')' }; });
  var shiftMin = A.shiftStart ? Number(A.shiftStart.slice(0, 2)) * 60 + Number(A.shiftStart.slice(3, 5)) : 480;
  var raw = A.checkin || [], filled = [];
  if (raw.length) { var byM = {}; raw.forEach(function(b){ byM[b.minute] = b.count; }); for (var m = raw[0].minute; m <= raw[raw.length - 1].minute; m += 15) filled.push({ minute: m, count: byM[m] || 0 }); }
  var ci = filled.map(function(b){ return { label: hm(b.minute), value: b.count, alt: b.minute >= shiftMin + (A.grace || 0), tip: hm(b.minute) + ': ' + b.count }; });
  h += '<div class="db-grid two">' + card('trend', t('dbTrend'), t('dbTrendLead'), lineChart(daily, { max: 100, suffix: '%', aria: t('dbTrend') }), tbl([t('date'), t('dbAttRate')], (A.daily || []).map(function(d){ return [shortDate(d.date), n1(d.rate) + '%', ]; }))) +
    card('wd', t('dbWeekday'), t('dbWeekdayLead'), cols(wd, { labels: true, suffix: '%' }), tbl([t('date'), '%'], wd.map(function(w){ return [tx(w.label), n1(w.value) + '%']; }))) + '</div>';
  h += '<div class="db-grid two">' + card('ci', t('dbCheckin'), t('dbCheckinLead'), cols(ci, {}) + '<div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('st_present') + '</span><span><i style="background:var(--s2)"></i>' + t('late') + '</span></div>',
      tbl(['', ''], ci.map(function(c){ return [c.label, c.value]; }))) +
    card('dept', t('dbDepts'), t('dbDeptLead'), hbars((A.departments || []).map(function(d){ return { label: d.department, value: d.rate, text: n1(d.rate) + '% / ' + n1(d.punctuality) + '%', tip: d.department + ': ' + n1(d.rate) + '% / ' + n1(d.punctuality) + '%' }; }), { max: 100 }),
      tbl([t('hrDept'), t('dbAttRate'), t('dbPunct'), t('dbAbsent')], (A.departments || []).map(function(d){ return [tx(d.department), n1(d.rate) + '%', n1(d.punctuality) + '%', d.absent]; }))) + '</div>';
  h += '<div class="db-grid two">' + card('late', t('dbTopLate'), '', (A.topLate || []).length ? tbl([t('hrName'), t('dbTimes'), t('dbMinutes')], A.topLate.map(function(x){ return [tx(x.emp.name) + ' <small style="color:var(--ink-2)">' + tx(x.emp.department) + '</small>', x.lateDays, x.lateMin]; })) : empty(null, 'table')) +
    card('abs', t('dbTopAbsent'), '', (A.topAbsent || []).length ? tbl([t('hrName'), t('dbDays')], A.topAbsent.map(function(x){ return [tx(x.emp.name) + ' <small style="color:var(--ink-2)">' + tx(x.emp.department) + '</small>', x.absent]; })) : empty(null, 'table')) + '</div>';

  // workforce
  var Wf = r.workforce || {};
  var mv = Wf.movement || [], hcs = headcountSeries(Wf.headcount, mv);
  h += '<h3 class="db-h">' + t('dbWorkforce') + '</h3><div class="db-tiles">' + tile(t('dbHeadcount'), n1(Wf.headcount, 0), t('dbSaudisK') + ': ' + n1(Wf.saudis || 0, 0),
      hcs.length > 1 ? hcs[hcs.length - 1] - hcs[hcs.length - 2] : null, true, true, '', { icon: 'users-three', spark: hcs, sparkOpts: { label: t('dbHeadcount') }, go: ['people:directory'], words: t('dbVsLastMonth') }) +
    tile(t('dbSaudization'), n1(Wf.saudiPct) + '%', Wf.target ? t('dbTarget') + ' ' + Wf.target + '%' : '', Wf.target && Wf.saudiPct != null ? Wf.saudiPct - Wf.target : null, true, false, t('dbPts'),
      { icon: 'flag', go: ['people:directory'], words: t('dbVsTarget') }) +
    tile(t('dbExpiring'), n1(Wf.expiringSoon, 0), '', null, true, false, '', { icon: 'calendar-x', go: ['people:expiring'] }) +
    tile(t('dbExpired'), '<span class="db-status">' + (Wf.expired ? ph('warning-circle') + ' ' : '') + n1(Wf.expired, 0) + '</span>', '', null, true, false, '', { icon: 'file-x', go: ['people:expiring'] }) +
    tile(t('dbJoiners'), n1(mv.reduce(function(s, m){ return s + m.joiners; }, 0), 0), '12', null, true, false, '', { icon: 'user-plus', spark: mv.map(function(m){ return m.joiners; }), sparkOpts: { min: 0, label: t('dbJoiners') }, go: ['people:onboarding'] }) +
    tile(t('dbLeavers'), n1(mv.reduce(function(s, m){ return s + m.leavers; }, 0), 0), '12', null, true, false, '', { icon: 'sign-out', spark: mv.map(function(m){ return m.leavers; }), sparkOpts: { min: 0, warm: true, label: t('dbLeavers') }, go: ['people:offboarding'] }) + '</div>';
  var meter = '<div class="db-meter"><i style="width:' + Math.min(100, Wf.saudiPct || 0) + '%"></i>' + (Wf.target ? '<u style="inset-inline-start:' + Math.min(100, Wf.target) + '%"></u>' : '') + '</div><p class="hr-hint">' + n1(Wf.saudiPct) + '%' + (Wf.target ? '، ' + t('dbTarget') + ' ' + Wf.target + '%' : '، ' + t('dbNoTarget')) + '</p>';
  var mix = (Wf.departments || []).map(function(d){ var n = d.saudi + d.nonSaudi; return '<div class="db-hb" tabindex="0" data-tip="' + esc(d.department + ': ' + t('dbSaudi') + ' ' + d.saudi + '، ' + t('dbNonSaudi') + ' ' + d.nonSaudi) + '"><span class="nm">' + tx(d.department) + '</span><div class="db-stack"><i style="width:' + (d.saudi / (n || 1) * 100) + '%"></i><i style="width:' + (d.nonSaudi / (n || 1) * 100) + '%"></i></div><b>' + d.saudi + ' / ' + n + '</b></div>'; }).join('');
  h += '<div class="db-grid two">' + card('mix', t('dbMix'), '', meter + '<div class="db-hbars">' + mix + '</div><div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('dbSaudi') + '</span><span><i style="background:var(--s3)"></i>' + t('dbNonSaudi') + '</span></div>',
      tbl([t('hrDept'), t('dbSaudi'), t('dbNonSaudi')], (Wf.departments || []).map(function(d){ return [tx(d.department), d.saudi, d.nonSaudi]; }))) +
    card('ten', t('dbTenure'), '', cols(Object.keys(Wf.tenure || {}).map(function(k){ return { label: k, value: Wf.tenure[k], tip: k + ': ' + Wf.tenure[k] }; }), { labels: true }), tbl(['', ''], Object.keys(Wf.tenure || {}).map(function(k){ return [k, Wf.tenure[k]]; }))) + '</div>';
  h += '<div class="db-grid">' + card('mov', t('dbMovement'), '', grouped((Wf.movement || []).map(function(m){ return { label: monthShort(m.month), a: m.joiners, b: m.leavers }; })),
    tbl(['', t('dbJoiners'), t('dbLeavers')], (Wf.movement || []).map(function(m){ return [monthShort(m.month), m.joiners, m.leavers]; }))) + '</div>';
  h += drawAnalytics(r.analytics);

  // leave, requests, performance
  var Lv = r.leave || {}, Rq = r.requests || {}, Pf = r.performance || {};
  var lt = (Lv.byType || []).map(function(x){ return { label: t('lt_' + x.type), value: x.days, text: plural(x.days, 'days'), tip: t('lt_' + x.type) + ': ' + x.days }; });
  var pend = Rq.pending || {};
  h += '<div class="db-grid three">' + card('lv', t('dbLeaveType'), '', hbars(lt), tbl(['', t('dbDays')], lt.map(function(x){ return [tx(x.label), x.value]; }))) +
    card('rq', t('dbPending'), '', hbars(['manager', 'hr', 'payroll'].map(function(s){ return { label: t('rstep_' + s), value: pend[s] || 0, text: n1(pend[s] || 0, 0), gray: !pend[s] }; })) +
      '<p class="hr-hint" style="margin-top:10px">' + t('dbOldest') + ': ' + plural(Rq.oldestOpenDays || 0, 'days') + (Rq.openOver3Days ? '، <span class="db-status">' + ph('warning') + ' ' + t('dbSlow') + ' ' + Rq.openOver3Days + '</span>' : '') + '</p>' +
      ((Rq.speed || []).length ? '<h4 class="hr-sub">' + t('dbSpeed') + '</h4>' + hbars(Rq.speed.map(function(x){ return { label: t('rt_' + x.type), value: x.avgHours, text: n1(x.avgHours) + ' ' + t('dbHours'), tip: t('rt_' + x.type) + ': ' + n1(x.avgHours) + ' ' + t('dbHours') + ' (' + x.n + ')' }; })) : '')) +
    card('pf', t('dbPerf'), Pf.cycle ? tx(lang(Pf.cycle.nameAr, Pf.cycle.nameEn)) + '، ' + Pf.rated + ' / ' + Pf.people + ' ' + t('dbRated') : '',
      Pf.cycle && !Pf.rated ? empty(t('dbNotRated'), 'hourglass') : Pf.cycle ? cols([1, 2, 3, 4, 5].map(function(n){ return { label: String(n), value: Pf.distribution[n], tip: n + ': ' + Pf.distribution[n] }; }), { labels: true }) : empty(t('dbPerfNone'), 'chart-bar'),
      Pf.cycle ? tbl(['', ''], [1, 2, 3, 4, 5].map(function(n){ return [n, Pf.distribution[n]]; })) : '') + '</div>';

  // money
  if (r.money && r.cost && !r.cost.error) {
    var C = r.cost, last = (C.trend || [])[C.trend.length - 1] || {};
    var tr = C.trend || [], prev = tr.length > 1 ? tr[tr.length - 2] : null, ser2 = function(k){ return tr.map(function(m){ return m[k]; }); };
    var dm = function(k){ return prev && last[k] != null && prev[k] != null ? last[k] - prev[k] : null; };
    h += '<h3 class="db-h">' + t('dbCost') + '</h3>' + (prev ? '<p class="db-basis">' + ph('arrows-left-right') + t('dbBasisRun') + '</p>' : '') + '<div class="db-tiles">' + tile(t('dbWageBill'), sar(C.monthlyPackage), C.noPackage ? t('pw_no_package') + ' ' + C.noPackage : '', null, true, true, '', { icon: 'wallet', go: ['pay:runs'] }) +
      tile(t('dbLastCost'), sar(last.cost), C.lastMonth ? monthShort(C.lastMonth) : t('dbNoRuns'), dm('cost'), null, false, t('mfSar'), { icon: 'money', spark: ser2('cost'), sparkOpts: { label: t('dbLastCost') }, go: ['pay:runs'], words: t('dbVsRun') }) +
      tile(t('dbGosiEr'), sar(last.gosiEmployer), '', dm('gosiEmployer'), null, false, t('mfSar'), { icon: 'bank', spark: ser2('gosiEmployer'), sparkOpts: { label: t('dbGosiEr') }, go: ['pay:compliance', 'pay:runs'], words: t('dbVsRun') }) +
      tile(t('dbOtCost'), sar(last.overtime), '', dm('overtime'), null, false, t('mfSar'), { icon: 'hourglass-medium', spark: ser2('overtime'), sparkOpts: { min: 0, warm: true, label: t('dbOtCost') }, go: ['pay:runs'], words: t('dbVsRun') }) +
      tile(t('dbLeaveLiab'), sar(C.leaveLiability), '', null, true, false, '', { icon: 'airplane-tilt', go: ['insights:reports'] }) +
      tile(t('dbEosLiab'), sar(C.eosLiability), '', null, true, false, '', { icon: 'scales', go: ['insights:reports'] }) + '</div>' +
      '<p class="hr-hint" style="margin:-6px 0 12px">' + t('dbLiabNote') + (C.advancesOutstanding ? '، ' + t('dbAdvances') + ' ' + sar(C.advancesOutstanding) : '') + '</p>' +
      '<div class="db-grid two">' + card('cost', t('dbCostTrend'), '', (C.trend || []).length ? lineChart(C.trend.map(function(m){ return { label: monthShort(m.month), y: m.cost, note: plural(m.headcount, 'people') }; }), { fmt: 'sar' }) : empty(t('dbNoRuns'), 'money'),
        tbl(['', t('prGross'), t('prGosiEr'), t('dbOtCost')], (C.trend || []).map(function(m){ return [monthShort(m.month), sar(m.gross), sar(m.gosiEmployer), sar(m.overtime)]; }))) +
      card('cd', t('dbCostDept'), '', hbars((C.byDepartment || []).map(function(d){ return { label: d.department, value: d.cost, text: sar(d.cost), tip: d.department + ': ' + sar(d.cost) + ' (' + d.headcount + ')' }; })),
        tbl([t('hrDept'), t('prGross'), t('prHead')], (C.byDepartment || []).map(function(d){ return [tx(d.department), sar(d.cost), d.headcount]; }))) + '</div>';
  }
  return h;
}
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }

// ---------------- workforce analytics (analytics block of api dashboard; names arrive only for the HR role) ----------------
var WA_SIG = ['new_hire', 'pay_static', 'low_rating', 'attendance_up', 'manager_change'], WA_BANDS = ['<1', '1-3', '3-5', '5-10', '10+'];
function pc(v){ return v == null ? '-' : n1(v) + '%'; }
function yrs(v){ return v == null ? '-' : n1(v) + ' ' + t('waYearsU'); }
function ltr(s){ return '<bdi dir="ltr">' + s + '</bdi>'; }
function fullDate(d){ return d ? new Date(d + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-'; }
function waBroken(x){ return !x || !!x.error; }
function waFail(id, title){ return card(id, title, '', '<p class="hr-hint">' + t('waPartFailed') + '</p>'); }
/** Columns with two or three series per group (validated series colours s1, s2, s3). items: [{label, v: [..], tip, dim}] */
function waBars(items, names, opts){
  if (!items.length) return empty(null, 'table');
  var max = opts && opts.max || Math.max.apply(null, items.map(function(i){ return Math.max.apply(null, i.v.map(function(x){ return x || 0; })); }).concat([1])), cls = ['', 'b', 'c'];
  return '<div class="db-cols wa-n' + names.length + '" style="height:150px">' + items.map(function(i){
    return '<div class="grp' + (i.dim ? ' dim' : '') + '" tabindex="0" data-tip="' + esc(i.tip) + '">' + i.v.map(function(x, k){ return '<i class="' + cls[k] + '" style="height:' + ((x || 0) / max * 100) + '%"></i>'; }).join('') + '<span>' + tx(i.label) + '</span></div>';
  }).join('') + '</div><div class="db-legend">' + names.map(function(n, k){ return '<span><i style="background:var(--s' + (k + 1) + ')"></i>' + n + '</span>'; }).join('') + '</div>';
}

function waTurnover(Tv){
  if (waBroken(Tv)) return '<div class="db-grid">' + waFail('watr', t('waTurnover')) + '</div>';
  var fy = Tv.firstYear || {}, why = Object.keys(Tv.otherReasons || {});
  var h = '<div class="db-tiles">' + tile(t('waTurnover'), pc(Tv.rate), t('waLeaversK') + ' ' + n1(Tv.leavers, 0) + ' · ' + t('waAvgHc') + ' ' + n1(Tv.avgHeadcount), null, false, true, '',
      { icon: 'arrows-clockwise', spark: (Tv.months || []).map(function(m){ return m.rate || 0; }), sparkOpts: { min: 0, warm: true, label: t('waTrend') }, go: ['people:offboarding', 'insights:reports'] }) +
    tile(t('waVoluntary'), pc(Tv.voluntaryRate), t('waLeaversK') + ' ' + n1(Tv.voluntary, 0)) + tile(t('waOther'), pc(Tv.otherRate), t('waLeaversK') + ' ' + n1(Tv.other, 0)) +
    tile(t('waFirstYear'), n1(fy.leavers || 0, 0), fy.share != null ? pc(fy.share) + ' ' + t('waOfLeavers') : '') + '</div>';
  if (why.length) h += '<p class="hr-hint" style="margin:-6px 0 12px">' + t('waOtherWhy') + ': ' + why.map(function(k){ return tx(T[S.lang]['waR_' + k] || k) + ' ' + Tv.otherReasons[k]; }).join('، ') + '</p>';
  var ms = Tv.months || [], top = Math.max.apply(null, ms.map(function(m){ return m.rate || 0; }).concat([0]));
  var line = lineChart(ms.map(function(m){ return { label: monthShort(m.month), y: m.rate || 0, note: t('waLeaversK') + ' ' + m.leavers + ' / ' + t('waAvgHc') + ' ' + n1(m.avgHc) }; }),
    { suffix: '%', aria: t('waTrend'), max: Math.max(10, Math.ceil(top / 10) * 10) }); // whole-number axis (0 / half / top), never "1% 1%"
  var split = waBars(ms.map(function(m){ return { label: monthShort(m.month), v: [m.voluntary, m.other], tip: monthShort(m.month) + ': ' + t('waVolShort') + ' ' + m.voluntary + '، ' + t('waOtherShort') + ' ' + m.other }; }), [t('waVolShort'), t('waOtherShort')]);
  var table = tbl([t('waMonth'), t('waHcStart'), t('waHcEnd'), t('waAvgHc'), t('waLeaversK'), t('waVolShort'), t('waOtherShort'), t('waRate')],
    ms.map(function(m){ return [monthShort(m.month), m.startHc, m.endHc, n1(m.avgHc), m.leavers, m.voluntary, m.other, pc(m.rate)]; }));
  return h + '<div class="db-grid two">' + card('watr', t('waTrend'), t('waTrendLead'), line, table) +
    card('wasp', t('waSplit'), '', split, tbl([t('waMonth'), t('waVolShort'), t('waOtherShort')], ms.map(function(m){ return [monthShort(m.month), m.voluntary, m.other]; }))) + '</div>';
}

function waTenure(Te){
  if (waBroken(Te)) return waFail('wate', t('waTenure'));
  var bands = Te.bands || {}, depts = Te.departments || [];
  var lead = t('waTenureAvg') + ' ' + yrs(Te.avgYears) + ' · ' + t('waMedian') + ' ' + yrs(Te.medianYears) + (Te.headcount > Te.known ? ' · ' + t('waNoHire') + ': ' + plural(Te.headcount - Te.known, 'people') : '');
  var chart = cols(WA_BANDS.map(function(k){ return { label: k, value: bands[k] || 0, tip: k + ': ' + plural(bands[k] || 0, 'people') }; }), { labels: true }) +
    '<h4 class="hr-sub">' + t('waTenureDept') + '</h4>' + hbars(depts.map(function(d){
      return d.suppressed ? { label: d.department, value: 0, gray: true, text: t('waCountOnly'), tip: d.department + ': ' + plural(d.headcount, 'people') + ' · ' + t('waCountOnly') }
        : { label: d.department, value: d.avgYears || 0, text: yrs(d.avgYears), tip: d.department + ': ' + yrs(d.avgYears) + ' · ' + t('waMedian') + ' ' + yrs(d.medianYears) + ' · ' + plural(d.headcount, 'people') };
    })) + (depts.some(function(d){ return d.suppressed; }) ? '<p class="hr-hint" style="margin-top:8px">' + t('waSmallNote') + '</p>' : '');
  var table = tbl([t('waDept'), t('waPeopleK'), t('waTenureAvg'), t('waMedian')].concat(WA_BANDS), [[t('waAll'), Te.headcount, yrs(Te.avgYears), yrs(Te.medianYears)].concat(WA_BANDS.map(function(k){ return bands[k] || 0; }))]
    .concat(depts.map(function(d){ return d.suppressed ? [tx(d.department), d.headcount, t('waCountOnly'), '-'].concat(WA_BANDS.map(function(){ return '-'; }))
      : [tx(d.department), d.headcount, yrs(d.avgYears), yrs(d.medianYears)].concat(WA_BANDS.map(function(k){ return d.bands[k] || 0; })); })));
  return card('wate', t('waTenure'), lead, chart, table);
}

function waSpan(Sp){
  if (waBroken(Sp)) return waFail('wasc', t('waSpan'));
  var flagged = function(l){ return l === '1' || l === '13+'; };
  var chart = cols((Sp.distribution || []).map(function(d){ return { label: d.label, value: d.managers, alt: flagged(d.label), tip: t('waTeam') + ' ' + d.label + ': ' + t('waManagers') + ' ' + d.managers }; }), { labels: true }) +
    '<div class="db-legend"><span><i style="background:var(--s1)"></i>' + t('waInRange') + '</span><span><i style="background:var(--s2)"></i>' + t('waFlagged') + '</span></div>';
  var lead = t('waSpanLead') + ' ' + t('waManagers') + ' ' + n1(Sp.managers, 0) + ' · ' + t('waAvgSpan') + ' ' + n1(Sp.avg) + ' · ' + t('waMedian') + ' ' + n1(Sp.median) +
    ' · ' + t('waMinMax') + ' ' + (Sp.min == null ? '-' : ltr(Sp.min + ' - ' + Sp.max));
  var info = '<div class="wa-note" style="margin-top:12px">' + ph('info') + '<div><b>' + t('waWide') + '</b>: ' + n1(Sp.wide, 0) + ' · <b>' + t('waNarrow') + '</b>: ' + n1(Sp.narrow, 0) +
    (Sp.orphans ? ' · ' + t('waOrphans') + ': ' + plural(Sp.orphans, 'people') : '') + '<br><small>' + t('waSpanNote') + '</small></div></div>';
  if (Sp.flags && Sp.flags.length) info += tbl([t('waManagers'), t('waReportsK'), ''], Sp.flags.map(function(f){
    return [tx(f.emp.name) + ' <small style="color:var(--ink-2)">' + tx(f.emp.department) + '</small>', f.reports, '<span class="wa-flag">' + ph('info') + (f.flag === 'wide' ? t('waWide') : t('waNarrow')) + '</span>'];
  }));
  return card('wasc', t('waSpan'), lead, chart + info, tbl([t('waTeam'), t('waManagers')], (Sp.distribution || []).map(function(d){ return [d.label, d.managers]; })));
}

function waCohorts(Co){
  if (waBroken(Co) || !Array.isArray(Co)) return waFail('waco', t('waCohorts'));
  var keys = ['m3', 'm6', 'm12'], names = [t('waM3'), t('waM6'), t('waM12')], rows = Co.slice().reverse();
  var cell = function(m){ return !m || m.pct == null ? t('waNotYet') : n1(m.pct) + '% (' + m.retained + '/' + m.eligible + ')'; };
  var chart = waBars(rows.map(function(c){
    if (c.suppressed) return { label: c.year, v: [0, 0, 0], dim: true, tip: c.year + ': ' + t('waHires') + ' ' + c.hires + ' · ' + t('waCountOnly') };
    return { label: c.year, v: keys.map(function(k){ return c[k] && c[k].pct; }), tip: c.year + ' (' + t('waHires') + ' ' + c.hires + '): ' + keys.map(function(k, i){ return names[i] + ' ' + cell(c[k]); }).join(' · ') };
  }), names, { max: 100 }) + (Co.some(function(c){ return c.suppressed; }) ? '<p class="hr-hint" style="margin-top:8px">' + t('waSmallNote') + '</p>' : '');
  var table = tbl([t('waYear'), t('waHires')].concat(names), Co.map(function(c){ return [c.year, c.hires].concat(keys.map(function(k){ return c.suppressed ? t('waCountOnly') : cell(c[k]); })); }));
  return card('waco', t('waCohorts'), t('waCohortsLead'), chart, table);
}

function waDetail(s){
  if (s.code === 'new_hire') return t('waHired') + ' ' + fullDate(s.since);
  if (s.code === 'pay_static') return t('waLastChange') + ' ' + fullDate(s.since);
  if (s.code === 'low_rating') return t('waRatingK') + ' ' + ltr(s.rating + ' / 5') + (s.cycleAr ? ' · ' + tx(lang(s.cycleAr, s.cycleEn)) : '');
  if (s.code === 'manager_change') return (s.why === 'left' ? t('waMgrLeft') : t('waMgrNew')) + ' ' + fullDate(s.on);
  if (s.code === 'attendance_up') {
    var part = function(k, label){ return label + ' ' + ltr(s.last[k] + '/' + s.last.expected) + ' ' + t('waVsPrior') + ' ' + ltr(s.prior[k] + '/' + s.prior.expected); };
    return [s.late ? part('late', t('waLateK')) : '', s.absent ? part('absent', t('waAbsK')) : ''].filter(String).join(' · ') + ' ' + t('waPriorNote');
  }
  return '';
}
function waFlight(F){
  var h = '<h3 class="db-h">' + t('waFlight') + '</h3><div class="wa-note">' + ph('chat-circle-dots') + '<span>' + t('waFlightLead') + '</span></div>';
  if (waBroken(F)) return h + '<div class="db-grid">' + waFail('wafr', t('waFlight')) + '</div>';
  var sigs = F.signalsList || WA_SIG, by = F.bySignal || {}, cov = F.coverage || {}, groups = F.groups || [];
  h += '<div class="db-tiles">' + tile(t('waScored'), n1(F.scored, 0), '', null, true, true) + tile(t('waWithSignals'), n1(F.withSignals, 0), F.scored ? pc(Math.round(F.withSignals / F.scored * 1000) / 10) : '') +
    tile(t('waTwoPlus'), n1(F.twoPlus, 0), '') + tile(t('waLeaving'), n1(F.leaving, 0), t('waLeavingSub')) + '</div>';
  var bySig = hbars(sigs.map(function(k){ return { label: t('waSig_' + k), value: by[k] || 0, text: ltr(n1(by[k] || 0, 0) + ' / ' + n1(cov[k] || 0, 0)), tip: t('waSig_' + k) + ': ' + (by[k] || 0) + ' · ' + t('waChecked') + ' ' + plural(cov[k] || 0, 'people') }; }),
    { max: Math.max(1, F.scored || 0) });
  var gname = function(g){ return g.pooled ? t('waPooled') + ' (' + g.groups + ')' : g.department; };
  var byDept = hbars(groups.map(function(g){ return { label: gname(g), value: g.headcount ? g.withSignals / g.headcount * 100 : 0, text: ltr(g.withSignals + ' / ' + g.headcount),
    tip: gname(g) + ': ' + t('waWithSignals') + ' ' + g.withSignals + ' · ' + t('waTwoPlus') + ' ' + g.twoPlus + ' · ' + plural(g.headcount, 'people') }; }), { max: 100 }) +
    (F.hidden && F.hidden.people ? '<p class="hr-hint" style="margin-top:8px">' + ph('lock-simple') + ' ' + t('waHidden') + plural(F.hidden.people, 'people') + '</p>' : '');
  h += '<div class="db-grid two">' + card('wasg', t('waBySignal'), t('waBySignalLead'), bySig, tbl([t('waIndicator'), t('waFired'), t('waCheckable')], sigs.map(function(k){ return [t('waSig_' + k), by[k] || 0, cov[k] || 0]; }))) +
    card('wadp', t('waByDept'), t('waByDeptLead'), byDept, tbl([t('waDept'), t('waPeopleK'), t('waWithSignals'), t('waTwoPlus')].concat(sigs.map(function(k){ return t('waSs_' + k); })),
      groups.map(function(g){ return [tx(gname(g)), g.headcount, g.withSignals, g.twoPlus].concat(sigs.map(function(k){ return g.signals[k] || 0; })); }))) + '</div>';
  if (!F.people) return h + '<p class="hr-hint" style="margin:-4px 0 16px">' + ph('lock-simple') + ' ' + t('waHrOnly') + '</p>';
  var rows = F.people.map(function(p){
    return '<tr><td class="wa-who">' + tx(p.emp.name) + '<br><small style="color:var(--ink-2)">' + tx(p.emp.empNo) + ' · ' + tx(p.emp.department) + '</small></td><td class="num">' + p.score + '</td><td class="wa-sig"><div class="wa-chips">' +
      p.signals.map(function(s){ return '<span class="chip">' + t('waSig_' + s.code) + '<small>' + waDetail(s) + '</small></span>'; }).join('') + '</div>' +
      (p.unknown && p.unknown.length ? '<small class="wa-unk">' + t('waUnknown') + ': ' + p.unknown.map(function(k){ return t('waSs_' + k); }).join('، ') + '</small>' : '') + '</td></tr>';
  }).join('');
  return h + '<div class="db-grid">' + card('wapp', t('waPeople'), t('waPeopleLead'), F.people.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('hrName') + '</th><th>' + t('waScore') + '</th><th>' + t('waIndicator') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    : empty(t('waNone'), 'check-circle')) + '</div>';
}

function waChecks(C){
  if (!Array.isArray(C) || !C.length) return '';
  return '<div class="wa-checks">' + C.map(function(c){ return '<span class="wa-ck ' + (c.level === 'warn' ? 'warn' : 'info') + '">' + ph(c.level === 'warn' ? 'warning' : 'info') + (T[S.lang]['waCk_' + c.code] || c.code) + ': ' + plural(c.count, 'people') + '</span>'; }).join('') + '</div>';
}

function drawAnalytics(A){
  if (!A) return '';
  var h = '<h3 class="db-h">' + t('waTitle') + '</h3><p class="hr-hint" style="margin:-4px 0 12px">' + t('waLead') + '</p>';
  if (A.error) return h + '<p class="hr-hint">' + t('waPartFailed') + '</p>';
  return h + waChecks(A.checks) + waTurnover(A.turnover) + '<div class="db-grid two">' + waTenure(A.tenure) + waSpan(A.span) + '</div>' +
    '<div class="db-grid">' + waCohorts(A.cohorts) + '</div>' + waFlight(A.flightRisk);
}

/** A screen's own dashboard: a titled band that can be folded (remembered per device). */
function panel(key, title, html){
  var hid = false; try { hid = (JSON.parse(localStorage.getItem('bgatt.dashFold') || '{}') || {})[key]; } catch (e) {}
  return '<section class="db db-panel" data-fold="' + key + '"><div class="db-ph"><h2>' + ph('chart-pie-slice') + title + '</h2><button type="button" class="tg" data-foldbtn aria-expanded="' + !hid + '">' + (hid ? t('dbShowDash') : t('dbHideDash')) + '</button></div>' +
    '<div class="db-pb' + (hid ? ' hidden' : '') + '">' + html + '</div></section>';
}
function wire(root){
  wireLines(root); wireTips(root);
  $$('[data-foldbtn]', root).forEach(function(b){ b.onclick = function(){
    var p = b.closest('[data-fold]'), body = p.querySelector('.db-pb'), hide = !body.classList.contains('hidden');
    body.classList.toggle('hidden', hide); b.setAttribute('aria-expanded', !hide); b.textContent = hide ? t('dbShowDash') : t('dbHideDash');
    try { var m = JSON.parse(localStorage.getItem('bgatt.dashFold') || '{}') || {}; m[p.dataset.fold] = hide; localStorage.setItem('bgatt.dashFold', JSON.stringify(m)); } catch (e) {}
  }; });
}
/**
 * The pressure gauge (design system v2, 2026-09-30): the one bold element on a page. 240-degree dial with 5% ticks,
 * zones red < 70, amber < 85, green up to 100 (override with opts.zones), and a needle that settles once on load.
 */
function gauge(v, label, opts){
  opts = opts || {};
  var cx = 115, cy = 115, R = 92, a0 = 210, a1 = -30, val = Math.max(0, Math.min(100, Number(v) || 0));
  var pt = function(deg, r){ var a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  var arc = function(from, to, r){ var p = pt(from, r), q = pt(to, r), large = Math.abs(from - to) > 180 ? 1 : 0; return 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1); };
  var ang = function(pc){ return a0 - (a0 - a1) * pc / 100; }, z = opts.zones || [70, 85], ticks = '';
  for (var k = 0; k <= 100; k += 5) {
    var big = k % 20 === 0, p1 = pt(ang(k), R - 2), p2 = pt(ang(k), R - (big ? 13 : 7));
    ticks += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="var(--ink-3,var(--g-5F6D63,#5F6D63))" stroke-width="' + (big ? 1.6 : 0.8) + '" stroke-linecap="round"/>';
    if (big) { var lp = pt(ang(k), R - 25); ticks += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3.5).toFixed(1) + '" text-anchor="middle">' + k + '</text>'; }
  }
  var zones = '<path d="' + arc(ang(0), ang(z[0]), R + 6) + '" stroke="#B42318" stroke-width="5" fill="none" opacity=".5"/><path d="' + arc(ang(z[0]), ang(z[1]), R + 6) + '" stroke="#C98500" stroke-width="5" fill="none" opacity=".75"/><path d="' + arc(ang(z[1]), ang(100), R + 6) + '" stroke="#2E7D4F" stroke-width="5" fill="none"/>';
  // No value: no needle at all (a needle parked at the left would read as 0%), "-" without the % unit.
  var none = v == null || !isFinite(Number(v)), shown = none ? '-' : n1(v, 0);
  return '<svg class="gauge" viewBox="0 0 230 168" role="img" aria-label="' + tx(label) + ' ' + shown + (none ? '' : '%') + '" direction="ltr">' + zones + ticks +
    (none ? '' : '<g class="needle" data-v="' + val + '" style="transform:rotate(-120deg)"><line x1="115" y1="115" x2="115" y2="34" stroke="var(--ink,var(--g-17221A,#17221A))" stroke-width="3" stroke-linecap="round"/><circle cx="115" cy="115" r="8" fill="var(--ink,var(--g-17221A,#17221A))"/><circle cx="115" cy="115" r="3" fill="var(--card,#fff)"/></g>') +
    '<text class="val" x="115" y="158" text-anchor="middle">' + shown + (none ? '' : '<tspan class="unit" dx="3">%</tspan>') + '</text></svg>';
}
/** A progress ring (0-100) with the figure in the middle; the arc draws in (CSS .mo-ring). */
function ring(pct, centre, label, opts){
  opts = opts || {};
  var v = Math.max(0, Math.min(100, Number(pct) || 0)), r = 26, c = 2 * Math.PI * r, sz = opts.size || 72;
  return '<svg class="db-ring' + (opts.warm ? ' warm' : '') + '" width="' + sz + '" height="' + sz + '" viewBox="0 0 64 64" role="img" aria-label="' + tx(label || '') + '">' +
    '<circle cx="32" cy="32" r="' + r + '" class="tr"/><circle cx="32" cy="32" r="' + r + '" class="fg mo-ring" style="stroke-dasharray:' + c.toFixed(2) + ';stroke-dashoffset:' + (c * (1 - v / 100)).toFixed(2) + ';--c:' + c.toFixed(2) + '" transform="rotate(-90 32 32)"/>' +
    '<text x="32" y="36" text-anchor="middle">' + tx(centre == null ? Math.round(v) + '%' : centre) + '</text></svg>';
}
function spinGauges(root){ $$('.gauge .needle', root).forEach(function(n){ var v = Number(n.dataset.v); if (!isFinite(v)) return; requestAnimationFrame(function(){ requestAnimationFrame(function(){ n.style.transform = 'rotate(' + (-120 + 240 * v / 100) + 'deg)'; }); }); }); }
function skeleton(n){ return '<div class="db-tiles">' + Array.apply(null, Array(n || 4)).map(function(_, i){ return '<div class="db-tile' + (i ? '' : ' lead') + '"><span class="sk" style="width:60%"></span><span class="sk" style="margin-top:10px;height:22px"></span></div>'; }).join('') + '</div>'; }

window.Dash = { section: section };
// Shared chart kit: every other screen draws its own mini dashboard with these, so all charts look and behave alike.
window.Viz = { tile: tile, card: card, tbl: tbl, lineChart: lineChart, cols: cols, grouped: grouped, hbars: hbars, wireLines: wireLines, wireTips: wireTips,
  n1: n1, sar: sar, shortDate: shortDate, monthShort: monthShort, range: range, showTip: showTip, hideTip: hideTip, panel: panel, wire: wire, skeleton: skeleton, gauge: gauge, spinGauges: spinGauges,
  spark: spark, delta: delta, empty: empty, goOk: goOk, wireGo: wireGo, skelPage: skelPage, ring: ring };
Viz.card = function(id, title, lead, chart, table, go){ return card(id, title, lead, chart, table, go || ''); }; // other screens: no dashboard drill map
})();
