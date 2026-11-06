// Home (design system v2, 2026-09-30; KPI rows per role, sparklines, comparisons and drill-down 2026-10-14 with the
// kpi-dashboard-design and dataviz skills): the first page of the HR system, role-aware.
// Company view for HR, payroll and executives: one or two KPI rows chosen by role (attendance, pay, executive), the day's
// gauge, what waits for a decision, legal deadlines, attendance by department and joiners/leavers.
// Personal view for everyone: my team (managers), my month, the check-in card (the only pine surface), my tasks, a month
// strip and quick actions. Every tile opens its screen (goArea); every chart has a table view.
(function(){
'use strict';
var V = window.Viz;
Object.assign(T.ar, { dyTitle:'تفاصيل يوم {d}', dyStatus:'الحالة', dyIn:'الحضور', dyOut:'الانصراف', dyLate:'التأخير', dyWorked:'ساعات العمل', dyShift:'الدوام', dyLeave:'الإجازة', dyHoliday:'العطلة', dyFix:'طلب تصحيح لهذا اليوم', dyNone:'-', dyMin:'{n} دقيقة', dyLog:'سجل الشهر كاملا' });
Object.assign(T.en, { dyTitle:'Details for {d}', dyStatus:'Status', dyIn:'Check-in', dyOut:'Check-out', dyLate:'Late', dyWorked:'Hours worked', dyShift:'Shift', dyLeave:'Leave', dyHoliday:'Holiday', dyFix:'Ask to correct this day', dyNone:'-', dyMin:'{n} min', dyLog:'Whole month log' });
Object.assign(T.ar, { tiTitle:'لمحات فريقك', tiLead:'ما يحتاج انتباهك في فريقك اليوم، من بيانات الحضور والطلبات.', tiNone:'فريقك بخير اليوم: لا تأخير ولا غياب ولا طلبات متأخرة.',
  tiLate:'تأخر اليوم من فريقك ({n}): {who}.', tiAbsent:'بدأ الدوام ولم يسجل حضوره بعد من فريقك ({n}): {who}.', tiLeaveToday:'في إجازة اليوم من فريقك: {n}.', tiSeeMap:'خريطة المكتب',
  tiPending:'طلبات إجازة من فريقك بانتظار قرارك: {n}، أقدمها منذ {d}.', tiPendingN:'طلبات إجازة من فريقك بانتظار قرارك: {n}.', tiDecide:'قرّر الآن', tiOverlap:'في إجازة معا يوم {d} من فريقك: {n}. راجع التغطية قبل اعتماد المزيد.', tiSeeLeave:'إجازات الفريق',
  ciTitle:'لمحات الشركة', ciLead:'ما يستحق المتابعة اليوم، مرتبا حسب الأهمية.', ciNone:'لا شيء عاجل اليوم في الحضور والطلبات والامتثال.',
  ciReview:'{n} تسجيلات حضور معلقة للمراجعة (إشارات موقع أو جهاز).', ciReviewGo:'مراجعة', ciAbsent:'{n} غائبون اليوم و{l} متأخرون من أصل {e} متوقعين.', ciBoard:'لوحة اليوم',
  ciMissOut:'{n} أيام بلا تسجيل انصراف في آخر أسبوعين.', ciOld:'{n} طلبات مفتوحة منذ أكثر من 3 أيام، أقدمها منذ {d}.', ciCentre:'مركز الموافقات', ciDept:'حضور {dept} اليوم {r}%، الأدنى بين الإدارات.',
  ciLate:'{n} مواعيد امتثال متأخرة (تأمينات أو قوى أو وثائق).', ciLateGo:'الامتثال', ciSoon:'{n} مواعيد امتثال خلال 7 أيام.', ciSaudi:'نسبة التوطين {p}% أقل من الهدف {t}%.', ciSaudiGo:'لوحة الإدارة' });
Object.assign(T.en, { tiTitle:'Your team today', tiLead:'What needs your attention in your team, from attendance and requests.', tiNone:'Your team is fine today: nobody late or absent, no requests waiting long.',
  tiLate:'{n} of your team are late today: {who}.', tiAbsent:'{n} of your team have not checked in and their shift has started: {who}.', tiLeaveToday:'{n} of your team are on leave today.', tiSeeMap:'Office map',
  tiPending:'{n} leave requests from your team wait for you; the oldest for {d}.', tiPendingN:'{n} leave requests from your team wait for you.', tiDecide:'Decide now', tiOverlap:'{n} of your team are on leave at the same time on {d}. Check cover before approving more.', tiSeeLeave:'Team leave',
  ciTitle:'Company insights', ciLead:'What deserves follow-up today, most important first.', ciNone:'Nothing urgent today in attendance, requests or compliance.',
  ciReview:'{n} check-ins are held for review (location or device signals).', ciReviewGo:'Review', ciAbsent:'{n} absent and {l} late today, out of {e} expected.', ciBoard:'Today board',
  ciMissOut:'{n} days without a check-out in the last two weeks.', ciOld:'{n} requests open more than 3 days; the oldest for {d}.', ciCentre:'Approvals centre', ciDept:'{dept} is at {r}% attendance today, the lowest department.',
  ciLate:'{n} compliance deadlines are overdue (GOSI, Qiwa or documents).', ciLateGo:'Compliance', ciSoon:'{n} compliance deadlines within 7 days.', ciSaudi:'Saudization is {p}%, below the {t}% target.', ciSaudiGo:'Management dashboard' });
Object.assign(T.ar, { inTitle:'لمحات ذكية لك', inLead:'ملاحظات من بياناتك أنت، كل واحدة بسببها وبخطوتها التالية.', inNone:'لا شيء يحتاج انتباهك الآن. يوم موفق!',
  inMissOut:'لم يُسجَّل انصرافك يوم {d}. اطلب تصحيحا حتى يُحسب يومك كاملا.', inMissOutGo:'طلب تصحيح',
  inNotIn:'لم تسجل حضورك اليوم بعد، وبدأ دوامك الساعة {t}.', inSoon:'يبدأ دوامك بعد {m} دقيقة (الساعة {t}).', inGoPunch:'سجّل الآن',
  inWorked:'عملت اليوم {w} من {s} ساعات الدوام، يتبقى {r}.', inDone:'أكملت ساعات دوامك اليوم ({w}). يمكنك تسجيل الانصراف.', inRemote:'اليوم يوم عمل عن بعد معتمد لك: سجّل حضورك من أي مكان.',
  inOnTime:'حضرت في الموعد {a} من {b} يوما هذا الشهر، ومتوسط وصولك الساعة {t}.', inLateRun:'تأخرت {n} أيام من آخر سبعة أيام عمل، ومتوسط وصولك {t} بعد بداية الدوام {s}.', inSeeLog:'سجلي',
  inPending:'طلبك {r} بانتظار {w} منذ {d}.', inSeeReq:'طلباتي', inWho_manager:'مديرك', inWho_hr:'الموارد البشرية', inWho_payroll:'الرواتب', inWho_dept_head:'رئيس الإدارة', inWho_executive:'الإدارة العليا', inWho_other:'المعتمد',
  inLeave:'رصيدك {n} من الإجازة السنوية. التخطيط المبكر يسهل اعتمادها.', inLeaveGo:'طلب إجازة', inHoliday:'العطلة الرسمية القادمة: {h}، بعد {n}.', inHolidayToday:'اليوم عطلة رسمية: {h}.',
  inSlip:'مسير راتب {m} متاح: صافي {v}.', inSlipGo:'عرض المسير', inToday:'اليوم', inDays1:'يوم', inDays:'{n} أيام', inHm:'{h}:{m}' });
Object.assign(T.en, { inTitle:'Smart insights for you', inLead:'Notes from your own data, each with its reason and next step.', inNone:'Nothing needs your attention right now. Have a good day!',
  inMissOut:'No check-out was recorded on {d}. Ask for a correction so the whole day counts.', inMissOutGo:'Ask for a correction',
  inNotIn:'You have not checked in today; your shift started at {t}.', inSoon:'Your shift starts in {m} minutes ({t}).', inGoPunch:'Check in now',
  inWorked:'You have worked {w} of your {s} today; {r} to go.', inDone:'You have completed today\'s hours ({w}). You can check out.', inRemote:'Today is an approved remote day: check in from anywhere.',
  inOnTime:'On time {a} of {b} days this month; you arrive at {t} on average.', inLateRun:'Late {n} of the last seven working days; on average you arrive {t} after your {s} start.', inSeeLog:'My attendance',
  inPending:'Your request {r} has been waiting for {w} for {d}.', inSeeReq:'My requests', inWho_manager:'your manager', inWho_hr:'HR', inWho_payroll:'payroll', inWho_dept_head:'the department head', inWho_executive:'senior management', inWho_other:'the approver',
  inLeave:'You have {n} of annual leave. Planning early makes approval easier.', inLeaveGo:'Request leave', inHoliday:'Next public holiday: {h}, in {n}.', inHolidayToday:'Today is a public holiday: {h}.',
  inSlip:'Your {m} payslip is ready: net {v}.', inSlipGo:'View payslip', inToday:'today', inDays1:'1 day', inDays:'{n} days', inHm:'{h}:{m}' });

Object.assign(T.ar, {
  hmMorning:'صباح الخير', hmEvening:'مساء الخير', hmCompany:'الشركة', hmMine:'أنا', hmToday:'الحضور اليوم', hmTodaySentence:'{p} من {e} بدأوا يومهم. {l} متأخرون و{v} في إجازة.',
  hmHeadcount:'الموظفون النشطون', hmSaudi:'التوطين المرجح', hmPayroll:'آخر مسير', hmOpenReq:'طلبات مفتوحة', hmDecide:'يحتاج قرارك', hmAllTasks:'كل المهام', hmNothing:'لا شيء ينتظر قرارك الآن.',
  hmDeadlines:'مواعيد نظامية', hmCalendar:'التقويم', hmDeadLead:'الأقرب موعدا أولا', hmNoDeadlines:'لا مواعيد قريبة.', hmDepts:'الحضور حسب الإدارة اليوم', hmMove:'حركة القوى العاملة',
  hmMoveLead:'المنضمون والمغادرون كل شهر', hmJoin:'انضموا', hmLeft:'غادروا', hmShift:'دوامك اليوم', hmIn:'سجلت حضورك', hmOut:'سجلت انصرافك', hmNotYet:'لم تسجل حضورك بعد',
  hmCheckIn:'تسجيل الحضور', hmCheckOut:'تسجيل الانصراف', hmOff:'يوم راحة', hmMyTasks:'مهامي', hmLeave:'رصيد إجازتي', hmAvail:'في رصيدك', hmUsed:'مستخدم', hmAskLeave:'طلب إجازة',
  hmK_present:'حاضرون الآن', hmK_late:'متأخرون', hmK_leave:'في إجازة', hmK_absent:'غائبون', hmOfExpected:'من المتوقع', hmSlip:'آخر قسيمة راتب', hmNoSlip:'تظهر قسائمك هنا بعد اعتماد المسير.', hmMonth:'شهري حتى الآن', hmAttRate:'حضوري', hmLateDays:'أيام تأخير', hmOt:'إضافي', hmOpen:'فتح', hmAt:'في',
  hmRowAtt:'الحضور اليوم', hmRowPay:'الرواتب', hmRowExec:'نظرة عامة', hmRowTeam:'فريقي', hmRowMine:'شهري',
  hmVsYday:'عن أمس', hmVsRun:'عن المسير السابق', hmVsMonth:'عن الشهر الماضي', hmVsSameDays:'عن نفس الأيام من الشهر الماضي', hmVsSlip:'عن القسيمة السابقة', hmVsTarget:'عن المستهدف',
  hmWageBill:'الرواتب الشهرية السارية', hmLastRun:'تكلفة آخر مسير', hmGosi:'تأمينات على الشركة', hmAtPayroll:'طلبات عند الرواتب', hmAttRateCo:'نسبة الحضور اليوم', hmOver3:'منها أكثر من 3 أيام',
  hmTeamSize:'أعضاء فريقي', hmDirect:'مباشرون', hmTeamLeave:'في إجازة اليوم', hmTeamPending:'إجازات تنتظر', hmTeamDecide:'تنتظر قراري', hmNetPay:'صافي آخر راتب',
  hmMonthStrip:'شهري يوما بيوم', hmMonthLead:'كل مربع يوم: الحضور والتأخير والغياب والإجازة.', hmQuick:'طلبات سريعة', hmQuickLead:'ابدأ طلبا جديدا',
  hmQ_leave:'إجازة', hmQ_letter:'خطاب', hmQ_expense:'مصروفات', hmQ_correction:'تصحيح بصمة', hmD_present:'حاضر', hmD_late:'متأخر', hmD_absent:'غائب', hmD_leave:'إجازة أو عطلة', hmD_off:'راحة أو لم يأت بعد',
  hmPerYear:'سنويا', hmBasis14:'الخط الصغير: آخر 14 يوم عمل', hmLateMin:'دقائق التأخير', hmBasisYday:'الأسهم مقارنة بأمس', hmBasisRun:'الأسهم مقارنة بالمسير السابق', hmBasisSame:'الأسهم مقارنة بنفس الأيام من الشهر الماضي'
});
Object.assign(T.en, {
  hmMorning:'Good morning', hmEvening:'Good evening', hmCompany:'Company', hmMine:'Me', hmToday:'Attendance today', hmTodaySentence:'{p} of {e} have started their day. {l} late and {v} on leave.',
  hmHeadcount:'Active employees', hmSaudi:'Weighted Saudization', hmPayroll:'Last payroll', hmOpenReq:'Open requests', hmDecide:'Waiting for your decision', hmAllTasks:'All tasks', hmNothing:'Nothing is waiting for you.',
  hmDeadlines:'Legal deadlines', hmCalendar:'Calendar', hmDeadLead:'Soonest first', hmNoDeadlines:'Nothing due soon.', hmDepts:'Attendance by department today', hmMove:'Workforce movement',
  hmMoveLead:'Joiners and leavers each month', hmJoin:'Joined', hmLeft:'Left', hmShift:'Your hours today', hmIn:'Checked in', hmOut:'Checked out', hmNotYet:'Not checked in yet',
  hmCheckIn:'Check in', hmCheckOut:'Check out', hmOff:'Day off', hmMyTasks:'My tasks', hmLeave:'My leave balance', hmAvail:'available', hmUsed:'Used', hmAskLeave:'Request leave',
  hmK_present:'Present now', hmK_late:'Late', hmK_leave:'On leave', hmK_absent:'Absent', hmOfExpected:'of expected', hmSlip:'Last payslip', hmNoSlip:'Your payslips appear here once payroll is approved.', hmMonth:'My month so far', hmAttRate:'Attendance', hmLateDays:'Late days', hmOt:'Overtime', hmOpen:'Open', hmAt:'at',
  hmRowAtt:'Attendance today', hmRowPay:'Payroll', hmRowExec:'Overview', hmRowTeam:'My team', hmRowMine:'My month',
  hmVsYday:'vs yesterday', hmVsRun:'vs previous run', hmVsMonth:'vs last month', hmVsSameDays:'vs the same days last month', hmVsSlip:'vs previous payslip', hmVsTarget:'vs target',
  hmWageBill:'Monthly wage bill', hmLastRun:'Last payroll cost', hmGosi:'Employer GOSI', hmAtPayroll:'Requests at payroll', hmAttRateCo:'Attendance today', hmOver3:'over 3 days',
  hmTeamSize:'My team', hmDirect:'direct', hmTeamLeave:'On leave today', hmTeamPending:'Leave waiting', hmTeamDecide:'Waiting for me', hmNetPay:'Last net pay',
  hmMonthStrip:'My month day by day', hmMonthLead:'Each square is a day: present, late, absent, leave.', hmQuick:'Quick requests', hmQuickLead:'Start a new request',
  hmQ_leave:'Leave', hmQ_letter:'Letter', hmQ_expense:'Expenses', hmQ_correction:'Punch correction', hmD_present:'Present', hmD_late:'Late', hmD_absent:'Absent', hmD_leave:'Leave or holiday', hmD_off:'Rest day or not yet',
  hmPerYear:'a year', hmBasis14:'small line: the last 14 working days', hmLateMin:'Late minutes', hmBasisYday:'arrows compare with yesterday', hmBasisRun:'arrows compare with the previous run', hmBasisSame:'arrows compare with the same days last month'
});

var css = '' +
'.hm-ph{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}.hm-ph .sp{flex:1}' +
'.hm-ph h1{margin:0;font-size:32px;line-height:1.25;font-weight:600;letter-spacing:-.01em;font-variation-settings:"HEXP" 35;text-wrap:balance}.hm-ph p{margin:4px 0 0;color:var(--ink-2);font-size:14px}' +
'.hm-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.hm-grid > *{min-width:0}' +
'.hm-s4{grid-column:span 4}.hm-s5{grid-column:span 5}.hm-s7{grid-column:span 7}.hm-s8{grid-column:span 8}.hm-s12{grid-column:1 / -1}' +
'.hm-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px 20px;position:relative}' +
'.hm-ins-list{display:grid;gap:8px;margin-top:8px}.hm-in{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:var(--in-bg);border:1px solid transparent}.hm-in p{flex:1;margin:0;font-size:14px;line-height:1.6}' +
'.hm-in .ic{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:12px;background:var(--card);color:var(--in-c);font-size:20px;box-shadow:var(--e1)}.hm-in .btn{flex:none;gap:4px}' +
'.hm-in-g{--in-c:var(--brand);--in-bg:color-mix(in srgb,var(--brand) 8%,transparent)}.hm-in-b{--in-c:var(--info);--in-bg:color-mix(in srgb,var(--info) 8%,transparent)}.hm-in-y{--in-c:var(--amber);--in-bg:color-mix(in srgb,var(--amber) 10%,transparent)}.hm-in-r{--in-c:var(--bad);--in-bg:color-mix(in srgb,var(--bad) 8%,transparent)}' +
'.hm-in.is-go{cursor:pointer}.hm-in.is-go:hover{border-color:var(--in-c)}.hm-facts .is-go{cursor:pointer;border-radius:8px;transition:background .15s}.hm-facts .is-go:hover,.hm-facts .is-go:focus-visible{background:var(--wash,rgba(0,0,0,.04))}' +
'button.hm-d{font:inherit;border:0;cursor:pointer;padding:0}.hm-hero .gauge.is-go{cursor:pointer}' +
'.hm-day{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 16px}.hm-day div{background:var(--wash,rgba(0,0,0,.04));border-radius:12px;padding:12px}.hm-day dt{font-size:12px;color:var(--ink-3)}.hm-day dd{margin:4px 0 0;font-size:18px;font-weight:600}' +
'.hm-ins-none{display:flex;align-items:center;gap:8px;margin:8px 0 0;color:var(--ink-2)}.hm-ring{float:inline-end;margin:-4px 0 0 8px}.hm-clock .db-ring text{fill:#F2EEE4}.hm-clock .db-ring .tr{stroke:rgba(242,238,228,.18)}.hm-clock .db-ring .fg{stroke:var(--signal)}' +
'@media (prefers-reduced-motion:no-preference){.hm-in{animation:hmIn .35s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 60ms)}}@keyframes hmIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
'@media (max-width:600px){.hm-in{flex-wrap:wrap}.hm-in .btn{margin-inline-start:48px}}' +
'.hm-card h2{margin:0;font-size:16px;font-weight:600;line-height:1.4;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hm-card h2 > i{color:var(--brand);font-size:20px}.hm-card h2 .sp{flex:1}' +
'.hm-card h2 > button:not(.db-open){border:0;background:none;color:var(--brand);font-size:13px;font-weight:500;padding:0;cursor:pointer}' +
'.hm-card .lead{margin:2px 0 12px;color:var(--ink-3,var(--g-5F6D63,#5F6D63));font-size:13px}' +
'.hm-hero{display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:center;padding:24px 28px}' +
'.hm-hero h2{font-size:14px;color:var(--ink-3,var(--g-5F6D63,#5F6D63));font-weight:500}.hm-hero .big{font-size:20px;font-weight:600;margin:2px 0 14px;line-height:1.45;text-wrap:balance}' +
'.hm-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;border-top:1px solid var(--line-2,#EEEAE0)}' +
'.hm-facts div{padding:12px 16px 2px;border-inline-start:1px solid var(--line-2,#EEEAE0)}.hm-facts div:first-child{border-inline-start:0;padding-inline-start:0}' +
'.hm-facts dt{font-size:13px;color:var(--ink-3,var(--g-5F6D63,#5F6D63))}.hm-facts dd{margin:0;font-size:24px;font-weight:600;font-variation-settings:"HEXP" 40;line-height:1.35;font-variant-numeric:tabular-nums}' +
'.hm-facts dd small{font-size:13px;font-weight:500;color:var(--ink-3,var(--g-5F6D63,#5F6D63));font-variation-settings:normal}' +
'.hm-rows{display:grid}.hm-r{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line-2,#EEEAE0)}.hm-r:first-child{border-top:0}' +
'.hm-r .m{flex:1;min-width:0}.hm-r .m b{display:block;font-weight:500;font-size:14px;line-height:1.45}.hm-r .m small{display:block;color:var(--ink-3,var(--g-5F6D63,#5F6D63));font-size:13px}' +
'.hm-r .ic{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--brand-tint,var(--g-E7EFE6,#E7EFE6));color:var(--brand);font-size:18px;flex:none}' +
'.hm-r .n{min-width:28px;height:24px;border-radius:8px;display:grid;place-items:center;font-size:13px;font-weight:600;background:var(--warn-bg,#FBF1DC);color:var(--warn,#8A5A00);padding:0 8px}' +
'.hm-sev{border-inline-start:3px solid var(--line);padding-inline-start:12px}.hm-sev.error{border-color:var(--bad)}.hm-sev.warn{border-color:var(--s2)}.hm-sev.info{border-color:var(--s3)}' +
'.hm-mini{height:32px;padding:0 12px;border-radius:6px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink);cursor:pointer}.hm-mini:hover{border-color:var(--input,#8F8878)}' +
'.hm-clock{background:var(--pine);color:#F2EEE4;border-color:var(--pine);position:relative;overflow:hidden}' +
'body.v2-on .hm-card.hm-clock.hm-clock{background:var(--pine);border-color:var(--pine)}' + /* the v3 card rule paints every .hm-card white; the shift card stays the one pine surface */
'.hm-clock::after{content:"";position:absolute;inset:auto -40px -60px auto;width:220px;height:220px;border-radius:50%;border:1px solid rgba(var(--signal-rgb),.18);box-shadow:0 0 0 30px rgba(var(--signal-rgb),.05),0 0 0 60px rgba(var(--signal-rgb),.035);pointer-events:none}' +
'.hm-clock h2{color:var(--g-AFC0AD,#AFC0AD);font-weight:500;font-size:14px}.hm-clock h2 > i{color:var(--signal)}.hm-clock .t{font-size:clamp(28px,7.5vw,38px);white-space:nowrap;font-weight:600;line-height:1.2;font-variation-settings:"HEXP" 70;margin:6px 0 2px;font-variant-numeric:tabular-nums}' +
'.hm-clock small{color:var(--g-AFC0AD,#AFC0AD);font-size:13px}.hm-clock .go{margin-top:16px;height:44px;padding:0 20px;border-radius:8px;border:0;background:#F2EEE4;color:var(--pine);font-weight:600;font-size:16px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;position:relative;z-index:1}' +
'.hm-clock .go:hover{background:#fff}.hm-clock .go:focus-visible{outline:2px solid var(--signal);outline-offset:2px}' +
'.hm-big{display:flex;align-items:baseline;gap:8px;margin:6px 0 10px}.hm-big b{font-size:clamp(26px,7vw,34px);font-weight:600;font-variation-settings:"HEXP" 70;font-variant-numeric:tabular-nums;line-height:1.1}.hm-big span{color:var(--ink-3,var(--g-5F6D63,#5F6D63))}' +
'.hm-bar{height:8px;border-radius:4px;background:var(--well,#F6F3EC);overflow:hidden}.hm-bar i{display:block;height:100%;background:var(--s1);border-radius:4px}' +
'.hm-btn{height:40px;padding:0 16px;border-radius:8px;border:1px solid var(--brand);background:var(--brand);color:var(--on-brand,#fff);font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer}.hm-btn:hover{filter:brightness(.93)}' +
'.hm-banner{margin-bottom:18px}.hm-scope{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22)}' +
'.hm-scope button{height:34px;padding:0 16px;border-radius:999px;border:0;background:none;color:#fff;font:inherit;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:8px;cursor:pointer}' +
'.hm-scope button[aria-pressed="true"]{background:#fff;color:#1D5E3A;box-shadow:var(--e2)}.hm-scope i{font-size:18px}' +
// KPI rows: a quiet heading, then four tiles; each tile: icon, label, big number, change pill and sparkline, footnote
'body .hm-rowh{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;margin:2px 2px 10px;color:var(--ink);font-size:16px;line-height:1.4;font-weight:700}.hm-rowh i{font-size:18px;color:var(--brand)}.hm-rowh small{color:var(--ink-3);font-weight:500;margin-inline-start:4px;font-size:12px}.hm-rowh small::before{content:"· "}' +
'.hm-rowset{display:grid;gap:16px}' +
'.hm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}' +
'.hm-k{position:relative;overflow:hidden;background:var(--card);border-radius:16px;padding:16px 20px;box-shadow:var(--e3);display:flex;flex-direction:column;gap:4px;min-width:0}' +
'.hm-k > *{position:relative;z-index:1}' +
'.hm-k .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:24px;margin-bottom:4px}' +
'.hm-k .lb{color:var(--ink-3);font-size:13px;font-weight:500}.hm-k .v{font-family:var(--f-num,Manrope,sans-serif);font-size:32px;font-weight:800;line-height:1.1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.hm-k .v small{font-size:13px;font-weight:600;color:var(--ink-3);letter-spacing:0;margin-inline-start:4px}' +
'.hm-k > small{color:var(--ink-3);font-size:12px}' +
'.hm-k::after{content:"";position:absolute;inset-inline-end:-26px;top:-30px;width:100px;height:100px;border-radius:50%;opacity:.5;z-index:0}' +
'.hm-k.k-g .ic{background:var(--ok-bg);color:var(--ok)}.hm-k.k-g::after{background:var(--ok-bg)}.hm-k.k-y .ic{background:var(--warn-bg);color:var(--warn)}.hm-k.k-y::after{background:var(--warn-bg)}' +
'.hm-k.k-b .ic{background:var(--info-bg);color:var(--info)}.hm-k.k-b::after{background:var(--info-bg)}.hm-k.k-r .ic{background:var(--bad-bg);color:var(--bad)}.hm-k.k-r::after{background:var(--bad-bg)}' +
'.hm-k.k-g{--t-fg:var(--ok)}.hm-k.k-y{--t-fg:var(--warn)}.hm-k.k-b{--t-fg:var(--info)}.hm-k.k-r{--t-fg:var(--bad)}' +
'.hm-k .db-tf{margin-top:auto;padding-top:6px}.hm-k .db-ring{margin-inline-start:auto}' +
'.hm-k .sk{margin:4px 0}' +
// month strip: one square per day, status by colour AND a mark (dot, ring, cross), legend in words
'.hm-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(32px,1fr));gap:8px}' +
'.hm-d{aspect-ratio:1;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;background:var(--well);color:var(--ink-3);position:relative;cursor:default}' +
'.hm-d.p{background:var(--ok-bg);color:var(--ok)}.hm-d.l{background:var(--warn-bg);color:var(--warn)}.hm-d.a{background:var(--bad-bg);color:var(--bad)}.hm-d.v{background:var(--info-bg);color:var(--info)}' +
'.hm-d.l::after{content:"";position:absolute;top:4px;inset-inline-end:4px;width:5px;height:5px;border-radius:50%;background:currentColor}' +
'.hm-d.a::after{content:"";position:absolute;inset:auto 6px 4px;height:2px;border-radius:2px;background:currentColor}' +
'.hm-d.today{box-shadow:0 0 0 2px var(--brand)}' +
'.hm-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;font-size:12px;color:var(--ink-2)}.hm-legend span{display:inline-flex;align-items:center;gap:8px}.hm-legend i{width:12px;height:12px;border-radius:4px;display:inline-block}' +
'.hm-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
'.hm-q{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:16px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-align:start;transition:border-color var(--mo-base,.18s),transform var(--mo-fast,.12s) var(--ease-out,ease-out)}' +
'.hm-q .qi{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:var(--brand-tint);color:var(--brand)}' +
'.hm-q:hover{border-color:var(--input)}.hm-q:active{transform:scale(.97)}' +
'@media (max-width:1100px){.hm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
'@media (max-width:900px){.hm-kpis{gap:12px}.hm-k{padding:16px}.hm-k .v{font-size:24px}.hm-k .ic{width:36px;height:36px;font-size:20px}.hm-k .db-spark{width:72px}}' +
'@media (max-width:1100px){.hm-s4,.hm-s5,.hm-s7,.hm-s8{grid-column:1 / -1}.hm-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.hm-facts div:nth-child(3){border-inline-start:0;padding-inline-start:0}}' +
'@media (max-width:900px){.hm-hero{grid-template-columns:1fr;justify-items:center}.hm-hero > div{justify-self:stretch}.hm-ph h1{font-size:24px}}' +
'@media (max-width:380px){.hm-k .db-tf{flex-direction:column;align-items:flex-start}.hm-k .db-spark{margin-inline-start:0}}';
css += '' +
// header: no banner, the greeting on the page itself
'.hm-page .v3-hero.hm-banner{background:none;color:var(--ink);padding:6px 2px 0;margin-bottom:22px;overflow:visible;border-radius:0;box-shadow:none}' +
'.hm-page .v3-hero.hm-banner::before,.hm-page .v3-hero.hm-banner::after{display:none}' +
'.hm-page .hm-banner h1{color:var(--ink);font-size:clamp(24px,3vw,34px);font-weight:700;letter-spacing:-.015em;line-height:1.2}' +
'.hm-page .hm-banner p{color:var(--ink-3);font-size:14px;margin-top:6px}' +
'.hm-page .hm-banner .v3-hero-ic{background:var(--card);border:1px solid var(--line);box-shadow:var(--e1)}.hm-page .hm-banner .v3-hero-ic i{color:var(--brand)}' +
'.hm-page .hm-scope{background:var(--card);border:1px solid var(--line);box-shadow:var(--e1)}' +
'.hm-page .hm-scope button{color:var(--ink-2)}.hm-page .hm-scope button[aria-pressed="true"]{background:var(--ink);color:var(--card);box-shadow:var(--e2)}' +
// KPI tiles: white, the icon in a corner chip, the number large, a lift on hover
'.hm-page .hm-rowh{font-size:15px;margin-bottom:12px}' +
'.hm-page .hm-k{border:1px solid var(--line);border-radius:20px;padding:18px 20px 16px;box-shadow:var(--e1);transition:transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s,border-color .28s}' +
'.hm-page .hm-k::after{display:none}' +
'.hm-page .hm-k .db-go{display:none}.hm-page .hm-k.is-go{cursor:pointer}' +
'.hm-page .hm-k .ic{position:absolute;top:16px;inset-inline-end:16px;width:38px;height:38px;font-size:20px;margin:0;border-radius:12px}' +
'.hm-page .hm-k .lb{padding-inline-end:48px;min-height:20px;display:block}' +
'.hm-page .hm-k .v{font-size:clamp(26px,2.6vw,36px);margin-top:14px}' +
'.hm-page .hm-k.is-go:hover,.hm-page .hm-k.is-go:focus-visible{transform:translateY(-4px);box-shadow:var(--e3);border-color:transparent}' +
// the first tile of a row is the featured one: the company gradient, white type, a soft glow that drifts slowly
'.hm-page .hm-kpis > .hm-k:first-child{background:linear-gradient(140deg,var(--brand) 0%,color-mix(in srgb,var(--brand) 62%,var(--accent2,var(--signal))) 100%);border-color:transparent;color:#fff;box-shadow:0 18px 36px -18px color-mix(in srgb,var(--brand) 75%,transparent)}' +
'.hm-page .hm-kpis > .hm-k:first-child::before{content:"";position:absolute;inset:-40% -30% auto auto;width:78%;aspect-ratio:1;border-radius:50%;z-index:0;pointer-events:none;' +
  'background:radial-gradient(circle,rgba(255,255,255,.34) 0%,rgba(255,255,255,.08) 45%,transparent 70%)}' +
'.hm-page .hm-kpis > .hm-k:first-child .lb,.hm-page .hm-kpis > .hm-k:first-child > small,.hm-page .hm-kpis > .hm-k:first-child .v small{color:rgba(255,255,255,.86)}' +
'.hm-page .hm-kpis > .hm-k:first-child .v{color:#fff}' +
'.hm-page .hm-kpis > .hm-k:first-child .ic{background:rgba(255,255,255,.2);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}' +
'.hm-page .hm-kpis > .hm-k:first-child .db-go{color:#fff}' +
'.hm-page .hm-kpis > .hm-k:first-child .db-spark path,.hm-page .hm-kpis > .hm-k:first-child .db-spark polyline{stroke:#fff}' +
'.hm-page .hm-kpis > .hm-k:first-child .db-spark .ar,.hm-page .hm-kpis > .hm-k:first-child .db-spark [fill]:not([fill="none"]){fill:rgba(255,255,255,.22)}' +
'.hm-page .hm-kpis > .hm-k:first-child .db-delta{background:rgba(255,255,255,.18);color:#fff}' +
'@media (prefers-reduced-motion:no-preference){.hm-page .hm-kpis > .hm-k:first-child::before{animation:hmGlow 9s ease-in-out infinite alternate}}' +
'@keyframes hmGlow{from{transform:translate(0,0) scale(1)}to{transform:translate(-14%,18%) scale(1.15)}}' +
// cards: rounder, quieter borders, the same lift as tiles where they open something
'.hm-page .hm-card{border-radius:20px;box-shadow:var(--e1);padding:22px 24px}' +
'.hm-page .hm-card h2{font-size:16px}.hm-page .hm-card h2 > i{width:32px;height:32px;border-radius:10px;display:inline-grid;place-items:center;background:var(--brand-tint,color-mix(in srgb,var(--brand) 12%,transparent));font-size:18px}' +
'.hm-page .hm-hero{background:linear-gradient(180deg,var(--card) 0%,color-mix(in srgb,var(--brand) 4%,var(--card)) 100%)}' +
'.hm-page .hm-hero .big{font-size:21px}' +
'.hm-page .hm-in{border-radius:14px}' +
// the daily wisdom and "on this day" become a quiet footer strip
'.hm-page .hm-daily{margin-top:22px;opacity:.95}' +
'@media (max-width:900px){.hm-page .hm-k .v{margin-top:10px}.hm-page .hm-card{padding:18px}.hm-page .hm-banner h1{font-size:22px}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function go(area, sub){ if (window.goArea) goArea(area, sub); }
function first(n){ return String(n || '').trim().split(/\s+/)[0]; }
function dateLine(){
  var d = new Date(), g = d.toLocaleDateString((S.lang === 'en' ? 'en-GB' : 'ar-SA') + '-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  var h = d.toLocaleDateString((S.lang === 'en' ? 'en' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' });
  return g + (S.lang === 'en' ? ' · ' : '، ') + h;
}
function greet(){ var h = new Date(Date.now() + 180 * 60000).getUTCHours(); return t(h < 12 ? 'hmMorning' : 'hmEvening') + (S.lang === 'en' ? ', ' : '، ') + esc(first(S.me.name)); }
function sk(n){ var h = ''; for (var i = 0; i < (n || 3); i++) h += '<span class="sk" style="width:' + (80 - i * 15) + '%"></span>'; return h; }
function fmtHm(iso){ return iso ? new Date(iso).toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }) : ''; }
function companyRole(){ var r = S.fileRoles || {}; return isHr() || r.hr || r.payroll || r.executive; }
function addDays(d, n){ return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
function prevMonth(m){ var y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1; if (!mo) { y--; mo = 12; } return y + '-' + String(mo).padStart(2, '0'); }
function arrow(){ return '<span class="db-go" aria-hidden="true">' + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</span>'; }

/**
 * One KPI tile. o: { k: colour g/y/b/r, icon, label, value (html), unit, sub, delta (html), spark (html), go: dest or list }.
 * value null = still loading (a skeleton bar). With go the tile is a link to that screen.
 */
/** A headline figure as a link to its breakdown (or a plain block when the viewer cannot open that screen). */
function factBox(){ var d = V.goOk(Array.prototype.slice.call(arguments)); return d ? '<div class="is-go" data-go="' + d + '" role="link" tabindex="0">' : '<div>'; }
function kTile(o){
  var dest = V.goOk(o.go), loading = o.value == null;
  var attrs = dest && !loading ? ' data-go="' + dest + '" role="link" tabindex="0" aria-label="' + esc(o.label) + ': ' + esc(String(o.value).replace(/<[^>]*>/g, '')) + ' · ' + t('dbOpenIn') + '"' : '';
  return '<div class="hm-k k-' + o.k + (dest && !loading ? ' is-go' : '') + '"' + attrs + '><span class="ic">' + ph(o.icon, 'duotone') + '</span><span class="lb">' + o.label + '</span>' +
    (loading ? '<span class="sk" style="width:46%;height:26px"></span><span class="sk" style="width:70%"></span>' :
      '<b class="v">' + o.value + (o.unit ? '<small>' + o.unit + '</small>' : '') + '</b>' + (o.delta || o.spark ? '<div class="db-tf">' + (o.delta || '') + (o.spark || '') + '</div>' : '') + (o.sub ? '<small>' + o.sub + '</small>' : '')) +
    (dest && !loading ? arrow() : '') + '</div>';
}
function row(id, icon, title, tiles, note){
  return '<div class="hm-row" id="' + id + '"><h2 class="hm-rowh">' + ph(icon, 'duotone') + title + (note ? '<small>' + note + '</small>' : '') + '</h2><div class="hm-kpis">' + tiles + '</div></div>';
}
/** A repaint of a row that already showed: no second entrance, no second count-up. */
function still(box){ $$('.hm-kpis', box).forEach(function(g){ g.classList.add('mo-still'); g.dataset.moSeen = '1'; Array.prototype.forEach.call(g.children, function(c){ c.dataset.moIn = '1'; }); }); $$('.v', box).forEach(function(v){ v.dataset.cu = '1'; }); }
function dif(a, b){ return a != null && b != null && isFinite(a) && isFinite(b) ? a - b : null; }
/** A card with a chart / table switch and an optional "open" link, wired by Viz.wire (data-tgbox). */
function chartCard(id, cls, icon, title, lead, chart, table, dest){
  var d = V.goOk(dest);
  return '<section class="hm-card ' + cls + '" id="' + id + '" data-tgbox><h2>' + ph(icon) + title + '<span class="sp"></span><span class="db-tools">' +
    (table ? '<span class="db-seg" role="group" aria-label="' + esc(title) + '"><button type="button" data-tg="' + id + '" data-m="chart" aria-pressed="true" aria-label="' + t('dbChartView') + '" title="' + t('dbChartView') + '">' + ph('chart-bar') + '</button><button type="button" data-tg="' + id + '" data-m="table" aria-pressed="false" aria-label="' + t('dbTableView') + '" title="' + t('dbTableView') + '">' + ph('table') + '</button></span>' : '') +
    (d ? '<button type="button" class="db-open" data-go="' + d + '">' + t('dbOpen') + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</button>' : '') + '</span></h2>' +
    (lead ? '<p class="lead">' + lead + '</p>' : '') + '<div data-v="chart">' + chart + '</div>' + (table ? '<div data-v="table" class="hidden">' + table + '</div>' : '') + '</section>';
}

/** Round shortcuts (phone layout, design choice): the six things an employee opens most. */
function quickRow(){
  var q = [['time:punch', 'fingerprint', 'vwPunch'], ['requests:new', 'plus-circle', 'vwNewReq'], ['requests:mine', 'tray', 'vwMine'], ['pay:slips', 'receipt', 'vwSlips'], ['requests:claim', 'money', 'vwNewClaim'], ['growth:oneonone', 'target', 'vwOneOnOne'], ['growth:kudos', 'hands-clapping', 'vwKudos'], ['profile:main', 'identification-card', 'arProfile']];
  return '<nav class="fb-quick" aria-label="' + t('v2Menu') + '">' + q.map(function(x){ return '<button type="button" data-qk="' + x[0] + '"><span>' + ph(x[1], 'duotone') + '</span>' + esc(t(x[2])) + '</button>'; }).join('') + '</nav>';
}
// ---------------- the daily welcome (2026-11-03): a wisdom and "on this day", the same for everyone on a given date ----------------
Object.assign(T.ar, { hmWisdom:'حكمة اليوم', hmOtd:'حدث في مثل هذا اليوم', hmOtdYear:'عام {y}', hmOtdMore:'اقرأ المزيد في ويكيبيديا' });
Object.assign(T.en, { hmWisdom:'Wisdom of the day', hmOtd:'On this day', hmOtdYear:'In {y}', hmOtdMore:'Read more on Wikipedia' });
var WISDOM = [["من جدّ وجد، ومن زرع حصد.","Whoever strives finds, and whoever sows reaps.","مثل عربي","Arabic proverb"],
  ["الوقت كالسيف، إن لم تقطعه قطعك.","Time is like a sword: if you do not cut it, it cuts you.","مثل عربي","Arabic proverb"],
  ["خير الكلام ما قلّ ودلّ.","The best words are few and to the point.","مثل عربي","Arabic proverb"],
  ["في التأني السلامة، وفي العجلة الندامة.","In patience lies safety, in haste regret.","مثل عربي","Arabic proverb"],
  ["لا تؤجل عمل اليوم إلى الغد.","Do not put off today's work until tomorrow.","مثل عربي","Arabic proverb"],
  ["يد واحدة لا تصفق.","One hand cannot clap.","مثل عربي","Arabic proverb"],
  ["الصبر مفتاح الفرج.","Patience is the key to relief.","مثل عربي","Arabic proverb"],
  ["قيمة كل امرئ ما يحسنه.","Each person is worth what they do well.","علي بن أبي طالب","Ali ibn Abi Talib"],
  ["من سار على الدرب وصل.","Whoever keeps to the road arrives.","مثل عربي","Arabic proverb"],
  ["العلم في الصغر كالنقش على الحجر.","Learning when young is like carving in stone.","مثل عربي","Arabic proverb"],
  ["الجار قبل الدار، والرفيق قبل الطريق.","Choose the neighbour before the house, and the companion before the road.","مثل عربي","Arabic proverb"],
  ["على قدر أهل العزم تأتي العزائم.","Great resolve comes to those of great resolve.","المتنبي","Al-Mutanabbi"],
  ["إذا كان الكلام من فضة فالسكوت من ذهب.","If speech is silver, silence is gold.","مثل عربي","Arabic proverb"],
  ["كل إناء بما فيه ينضح.","Every vessel pours out what it holds.","مثل عربي","Arabic proverb"],
  ["القناعة كنز لا يفنى.","Contentment is a treasure that never runs out.","مثل عربي","Arabic proverb"],
  ["ما لا يدرك كله لا يترك جله.","What cannot be done in full should not be left undone in most.","مثل عربي","Arabic proverb"],
  ["خير الأمور أوسطها.","The best of things is the middle way.","مثل عربي","Arabic proverb"],
  ["من طلب العلا سهر الليالي.","Whoever seeks the heights stays up the nights.","حكمة عربية","Arabic saying"],
  ["درهم وقاية خير من قنطار علاج.","An ounce of prevention is worth a pound of cure.","مثل عربي","Arabic proverb"],
  ["لكل مجتهد نصيب.","Every hard worker gets their share.","مثل عربي","Arabic proverb"],
  ["الاتحاد قوة.","Unity is strength.","حكمة","Saying"],
  ["لسانك حصانك، إن صنته صانك.","Your tongue is your horse: guard it and it guards you.","مثل عربي","Arabic proverb"],
  ["المرء بأصغريه: قلبه ولسانه.","A person is known by two small things: the heart and the tongue.","مثل عربي","Arabic proverb"],
  ["الحاجة أم الاختراع.","Necessity is the mother of invention.","حكمة","Saying"],
  ["ليس الخبر كالمعاينة.","Hearing is not the same as seeing.","مثل عربي","Arabic proverb"],
  ["قليل دائم خير من كثير منقطع.","A little that lasts is better than a lot that stops.","حكمة عربية","Arabic saying"],
  ["إذا هبّت رياحك فاغتنمها.","When your winds blow, make the most of them.","حكمة عربية","Arabic saying"],
  ["أول الغيث قطرة.","The first rain begins with a single drop.","مثل عربي","Arabic proverb"],
  ["العبرة بالخواتيم.","What counts is how things end.","مثل عربي","Arabic proverb"],
  ["ما ضاع حق وراءه مطالب.","No right is lost while someone keeps asking for it.","مثل عربي","Arabic proverb"],
  ["الصديق وقت الضيق.","A friend is the one who stands by you in hard times.","مثل عربي","Arabic proverb"],
  ["اسأل مجرّبًا ولا تسأل حكيمًا.","Ask someone who has done it, not someone who only knows of it.","مثل عربي","Arabic proverb"],
  ["بالشكر تدوم النعم.","Gratitude keeps good things lasting.","حكمة عربية","Arabic saying"],
  ["من أتقن عمله أتقن نجاحه.","Whoever perfects their work perfects their success.","حكمة","Saying"],
  ["الكلمة الطيبة مفتاح القلوب.","A kind word is the key to every heart.","حكمة","Saying"],
  ["اعمل لتنجح لا لتُرى.","Work to succeed, not to be seen.","حكمة","Saying"],
  ["خطوة صغيرة كل يوم خير من قفزة لا تأتي.","A small step every day beats a leap that never comes.","حكمة","Saying"],
  ["النظام نصف النجاح.","Order is half of success.","حكمة","Saying"],
  ["من عرف قدر نفسه ارتاح.","Whoever knows their own worth is at peace.","حكمة عربية","Arabic saying"],
  ["التعاون يقصر الطريق.","Working together shortens the road.","حكمة","Saying"]];
/** Riyadh date parts: the day number of the year picks the wisdom, so everyone sees the same one all day. */
function riyadhDay(){ var d = new Date(Date.now() + 180 * 60000); var y = d.getUTCFullYear(), start = Date.UTC(y, 0, 1); return { y: y, m: d.getUTCMonth() + 1, d: d.getUTCDate(), n: Math.floor((d.getTime() - start) / 864e5) }; }
function wisdomHtml(){
  var day = riyadhDay(), q = WISDOM[(day.y * 7 + day.n) % WISDOM.length], en = S.lang === 'en';
  return '<figure class="hm-wis"><span class="hm-dly-ic" aria-hidden="true">' + ph('quotes', 'duotone') + '</span><div><small>' + t('hmWisdom') + '</small><blockquote>' + esc(en ? q[1] : q[0]) + '</blockquote><figcaption>' + esc(en ? q[3] : q[2]) + '</figcaption></div></figure>';
}
/** "On this day": Wikipedia's selected events for today's date, in the reader's language, fetched once a day per language. */
function loadOnThisDay(box){
  var day = riyadhDay(), lang = S.lang === 'en' ? 'en' : 'ar', mm = ('0' + day.m).slice(-2), dd = ('0' + day.d).slice(-2), key = 'otd:' + lang + ':' + mm + dd;
  var show = function(list){
    if (!box || !document.body.contains(box)) return;
    if (!list || !list.length) { box.remove(); return; }
    var e = list[(day.y + day.n) % list.length], page = (e.pages || [])[0] || {}, url = page.content_urls && page.content_urls.desktop && page.content_urls.desktop.page;
    box.innerHTML = '<span class="hm-dly-ic" aria-hidden="true">' + ph('calendar-star', 'duotone') + '</span><div><small>' + t('hmOtd') + ' · ' + esc(t('hmOtdYear').replace('{y}', e.year)) + '</small><p>' + esc(e.text) + '</p>' +
      (url && /^https:\/\/[a-z]+\.wikipedia\.org\//.test(url) ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + t('hmOtdMore') + ' ' + ph('arrow-square-out') + '</a>' : '') + '</div>';
    box.hidden = false;
  };
  try { var kept = JSON.parse(localStorage.getItem('bgatt.' + key) || 'null'); if (kept && kept.y === day.y) return show(kept.list); } catch (x) {}
  fetch('https://' + lang + '.wikipedia.org/api/rest_v1/feed/onthisday/selected/' + mm + '/' + dd, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var list = ((j && j.selected) || []).filter(function(e){ return e && e.text && e.year; }).slice(0, 30).map(function(e){ return { year: e.year, text: String(e.text).slice(0, 320), pages: (e.pages || []).slice(0, 1).map(function(p){ return { content_urls: p.content_urls }; }) }; });
      try { localStorage.setItem('bgatt.' + key, JSON.stringify({ y: day.y, list: list })); } catch (x) {}
      show(list);
    }, function(){ show(null); });
}
function dailyHtml(){ return '<section class="hm-daily" aria-label="' + esc(t('hmWisdom')) + '">' + wisdomHtml() + '<div class="hm-otd" id="hmOtd" hidden></div></section>'; }
(function(){ var st = document.createElement('style'); st.textContent =
  '.hm-daily{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:-4px 0 18px}' +
  '.hm-wis,.hm-otd{margin:0;display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:var(--r-l,16px);background:var(--frame,#fff);border:1px solid var(--line-2,#E6E1D6)}' +
  '.hm-wis{background:linear-gradient(135deg,var(--brand-tint,#EEF3EE),var(--frame,#fff) 70%)}' +
  '.hm-dly-ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--brand,#2F5D8C);color:#fff;font-size:22px}' +
  '.hm-otd .hm-dly-ic{background:var(--accent2,var(--brand-h,#1E4A70))}' +
  '.hm-daily small{display:block;font-size:12px;font-weight:600;color:var(--ink-3,#5F6D63);margin-bottom:4px}' +
  '.hm-wis blockquote{margin:0;font-family:var(--f-head,inherit);font-size:18px;line-height:1.6;color:var(--ink,#14202F)}' +
  '.hm-wis figcaption{margin-top:6px;font-size:13px;color:var(--ink-2,#3A4A40)}' +
  '.hm-otd p{margin:0;font-size:15px;line-height:1.65;color:var(--ink,#14202F)}' +
  '.hm-otd a{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-size:13px;font-weight:600;color:var(--brand,#2F5D8C);text-decoration:none}.hm-otd a:hover{text-decoration:underline}' +
  '.hm-daily [hidden]{display:none!important}' +
  '@media (max-width:760px){.hm-daily{grid-template-columns:1fr}.hm-wis blockquote{font-size:17px}}';
  document.head.appendChild(st); })();
function render(main){
  var company = companyRole(), scope = company ? (S.homeScope || 'company') : 'mine';
  var h = new Date(Date.now() + 180 * 60000).getUTCHours();
  main.innerHTML = '<div class="page v2 hm-page"><header class="v3-hero hm-banner"><span class="v3-hero-ic">' + ph(h < 12 ? 'sun-horizon' : h < 17 ? 'sun' : 'moon-stars', 'duotone') + '</span><div><h1>' + greet() + '</h1><p>' + dateLine() + '</p></div>' +
    '<div class="v3-hero-stats">' + (company ? '<div class="hm-scope" role="group"><button type="button" data-sc="company" aria-pressed="' + (scope === 'company') + '">' + ph('buildings', 'duotone') + t('hmCompany') + '</button><button type="button" data-sc="mine" aria-pressed="' + (scope === 'mine') + '">' + ph('user', 'duotone') + t('hmMine') + '</button></div>' : '') + '</div></header>' +
    quickRow() + '<div id="hmBody"></div>' + dailyHtml() + '</div>';
  loadOnThisDay($('#hmOtd', main));
  $$('[data-qk]', main).forEach(function(b){ b.onclick = function(){ var p = b.dataset.qk.split(':'); goArea(p[0], p[1]); }; });
  $$('[data-sc]', main).forEach(function(b){ b.onclick = function(){
    if (S.homeScope === b.dataset.sc || (!S.homeScope && b.dataset.sc === 'company')) return;
    S.homeScope = b.dataset.sc; $$('[data-sc]', main).forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    var body = $('#hmBody', main); body.classList.remove('mo-sub'); void body.offsetWidth;
    if (!moReduced()) { body.classList.add('mo-sub'); body.style.setProperty('--mo-dir', String((b.dataset.sc === 'mine' ? 1 : -1) * (S.lang === 'ar' ? -1 : 1))); }
    if (b.dataset.sc === 'company') companyHome(body); else myHome(body);
  }; });
  var body = $('#hmBody', main);
  if (scope === 'company') companyHome(body); else myHome(body);
  if (window.welcomeCard) welcomeCard(main);
}

// ---------------- company ----------------
/** Which KPI rows a viewer gets: attendance for HR (and admin), pay for payroll holders, an overview for executives. */
function rowKinds(){
  var r = R(), hr = isHr() || r.hr, list = [];
  if (r.executive && !hr) list.push('exec');
  if (r.payroll && !hr) list.push('pay');
  if (hr) list.push('att');
  if ((r.payroll || (r.executive && !hr)) && list.indexOf('pay') < 0) list.push('pay');
  if (!list.length) list.push('att');
  return list.slice(0, 2);
}
function rowsHtml(kinds, r, r14){
  var A = r && r.attendance || {}, T0 = A.totals || {}, P = r && r.attendancePrev || {}, W = r && r.workforce || {}, Rq = r && r.requests || {}, C = r && r.cost || {};
  var dd = r14 && r14.attendance && r14.attendance.daily || [], ser = function(f){ return dd.length > 1 ? V.spark(dd.map(f), { min: 0 }) : ''; };
  var serW = function(f, lbl){ return dd.length > 1 ? V.spark(dd.map(f), { min: 0, warm: true, label: lbl }) : ''; };
  var yd = t('hmVsYday'), on = !!r, pend = Rq.pending || {};
  var out = {
    att: function(){ return row('hmRowAtt', 'user-check', t('hmRowAtt'), [
      kTile({ k: 'g', icon: 'user-check', label: t('hmK_present'), value: on ? V.n1(T0.present || 0, 0) : null, sub: T0.expected ? Math.round((T0.present || 0) / T0.expected * 100) + '% ' + t('hmOfExpected') : '',
        spark: ser(function(d){ return d.present; }), go: ['time:board', 'insights:dashboard'] }),
      kTile({ k: 'y', icon: 'clock-countdown', label: t('hmK_late'), value: on ? V.n1(T0.late || 0, 0) : null, sub: T0.lateMin ? Math.round(T0.lateMin) + ' ' + t('dbMinutes') : '',
        spark: serW(function(d){ return d.late; }, t('hmK_late')), go: ['time:board', 'insights:dashboard'] }),
      kTile({ k: 'b', icon: 'airplane-tilt', label: t('hmK_leave'), value: on ? V.n1(T0.leave || 0, 0) : null, go: ['requests:leave', 'insights:dashboard'] }),
      kTile({ k: 'r', icon: 'user-minus', label: t('hmK_absent'), value: on ? V.n1(T0.absent || 0, 0) : null,
        spark: serW(function(d){ return Math.max(0, (d.expected || 0) - (d.present || 0)); }, t('hmK_absent')), go: ['time:board', 'insights:dashboard'] })].join(''), t('hmBasis14')); },
    pay: function(){
      if (on && (!r.money || !C || C.error)) return '';
      var tr = C.trend || [], last = tr[tr.length - 1] || {}, prev = tr[tr.length - 2], sp = function(k){ return tr.length > 1 ? V.spark(tr.map(function(m){ return m[k]; }), { label: t('hmLastRun') }) : ''; };
      return row('hmRowPay', 'wallet', t('hmRowPay'), [
        kTile({ k: 'g', icon: 'wallet', label: t('hmWageBill'), value: on ? V.n1(C.monthlyPackage || 0, 0) : null, unit: t('mfSar'), sub: C.noPackage ? t('pw_no_package') + ' ' + C.noPackage : '', go: ['pay:runs'] }),
        kTile({ k: 'b', icon: 'money', label: t('hmLastRun'), value: on ? (last.cost != null ? V.n1(last.cost, 0) : '-') : null, unit: last.cost != null ? t('mfSar') : '', sub: C.lastMonth ? V.monthShort(C.lastMonth) : t('dbNoRuns'),
          delta: prev ? V.delta(dif(last.cost, prev.cost), null, t('mfSar'), t('hmVsRun')) : '', spark: sp('cost'), go: ['pay:runs'] }),
        kTile({ k: 'y', icon: 'bank', label: t('hmGosi'), value: on ? (last.gosiEmployer != null ? V.n1(last.gosiEmployer, 0) : '-') : null, unit: last.gosiEmployer != null ? t('mfSar') : '',
          delta: prev ? V.delta(dif(last.gosiEmployer, prev.gosiEmployer), null, t('mfSar'), t('hmVsRun')) : '', spark: sp('gosiEmployer'), go: ['pay:compliance', 'pay:runs'] }),
        kTile({ k: 'r', icon: 'hourglass-medium', label: t('hmAtPayroll'), value: on ? V.n1(pend.payroll || 0, 0) : null, sub: Rq.openOver3Days ? Rq.openOver3Days + ' ' + t('hmOver3') : '', go: ['pay:approvals', 'requests:inbox', 'insights:dashboard'] })].join(''), t('hmBasisRun'));
    },
    exec: function(){
      var mv = W.movement || [], hc = [], x = W.headcount;
      if (x != null && mv.length) { hc = [x]; for (var i = mv.length - 1; i > 0; i--) { x = x - (mv[i].joiners || 0) + (mv[i].leavers || 0); hc.unshift(x); } }
      var open = (pend.manager || 0) + (pend.hr || 0) + (pend.payroll || 0);
      return row('hmRowExec', 'chart-line-up', t('hmRowExec'), [
        kTile({ k: 'g', icon: 'users-three', label: t('hmHeadcount'), value: on ? V.n1(W.headcount, 0) : null, delta: hc.length > 1 ? V.delta(hc[hc.length - 1] - hc[hc.length - 2], true, '', t('hmVsMonth')) : '',
          spark: hc.length > 1 ? V.spark(hc, { label: t('hmHeadcount') }) : '', go: ['people:directory', 'insights:dashboard'] }),
        kTile({ k: 'b', icon: 'user-check', label: t('hmAttRateCo'), value: on ? (T0.attendanceRate == null ? '-' : V.n1(T0.attendanceRate, 0) + '%') : null,
          spark: dd.length > 1 ? V.spark(dd.map(function(d){ return d.rate; }), { min: 0, max: 100, label: t('dbAttRate') }) : '', go: ['insights:dashboard'] }),
        kTile({ k: 'y', icon: 'flag', label: t('hmSaudi'), value: on ? (W.saudiPct == null ? '-' : V.n1(W.saudiPct) + '%') : null, sub: W.target ? t('dbTarget') + ' ' + W.target + '%' : '',
          delta: W.target && W.saudiPct != null ? V.delta(W.saudiPct - W.target, true, t('dbPts'), t('hmVsTarget')) : '', go: ['insights:dashboard'] }),
        kTile({ k: 'r', icon: 'tray', label: t('hmOpenReq'), value: on ? V.n1(open, 0) : null, sub: Rq.openOver3Days ? Rq.openOver3Days + ' ' + t('hmOver3') : '', go: ['requests:centre', 'insights:dashboard'] })].join(''));
    }
  };
  return kinds.map(function(k){ return out[k](); }).join('');
}

function companyHome(el){
  var gen = el._g = (el._g || 0) + 1, live = function(){ return el.isConnected && el._g === gen; };
  var today = riyadhToday(), canCal = isHr() || (S.fileRoles || {}).payroll, kinds = rowKinds(), R0 = null, R14 = null;
  el.innerHTML = '<div class="hm-grid"><section class="hm-s12 hm-rowset" id="hmRows">' + rowsHtml(kinds, null, null) + '</section>' + insCard('hmCoIns', 'sparkle', 'ciTitle', 'ciLead') +
    '<section class="hm-card hm-hero hm-s12" id="hmHero">' + (V ? V.gauge(null, t('hmToday')) : '') + '<div>' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s7" id="hmDecide"><h2>' + ph('tray') + t('hmDecide') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    (canCal ? '<section class="hm-card hm-s5" id="hmCal"><h2>' + ph('shield-check') + t('hmDeadlines') + '<span class="sp"></span><button type="button" data-go="pay:compliance">' + t('hmCalendar') + '</button></h2><p class="lead">' + t('hmDeadLead') + '</p><div class="hm-rows">' + sk(3) + '</div></section>' : '') +
    '<section class="hm-card hm-s8" id="hmMove"><h2>' + ph('users-three') + t('hmMove') + '</h2><p class="lead">' + t('hmMoveLead') + '</p>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmDept"><h2>' + ph('buildings') + t('hmDepts') + '</h2>' + sk(4) + '</section></div>';
  wire(el);
  var CAL = null, calDone = !canCal;
  function paintIns(){ if (R0 && R14 && calDone && live()) insPaint($('#hmCoIns .hm-ins-list', el), companyInsights(R0, R14, CAL), 'ciNone'); }
  function paintRows(){ paintIns(); var box = $('#hmRows', el); if (box && R0) { var again = !!box.dataset.p; box.dataset.p = '1'; box.innerHTML = rowsHtml(kinds, R0, R14); if (again) still(box); V.wire(box); } }
  apiFresh('dashboard', { from: today, to: today }, function(r){
    if (!live() || !r.ok) return;
    R0 = r; paintRows();
    var A = r.attendance || {}, T0 = A.totals || {}, W = r.workforce || {}, Rq = r.requests || {}, C = r.cost || {};
    var rate = T0.attendanceRate, pend = Rq.pending || {}, open = (pend.manager || 0) + (pend.hr || 0) + (pend.payroll || 0);
    var last = C.trend && C.trend.length ? C.trend[C.trend.length - 1] : null;
    var sent = t('hmTodaySentence').replace('{p}', V.n1(T0.present || 0, 0)).replace('{e}', V.n1(T0.expected || 0, 0)).replace('{l}', V.n1(T0.late || 0, 0)).replace('{v}', V.n1(T0.leave || 0, 0));
    if (!$('#hmHero', el)) return;
    $('#hmHero', el).innerHTML = V.gauge(rate == null ? null : Math.round(rate), t('hmToday')) + '<div><h2>' + t('hmToday') + '</h2><p class="big">' + sent + '</p><dl class="hm-facts">' +
      factBox('people:directory', 'insights:dashboard') + '<dt>' + t('hmHeadcount') + '</dt><dd>' + V.n1(W.headcount, 0) + '</dd></div>' + factBox('insights:dashboard') + '<dt>' + t('hmSaudi') + '</dt><dd>' + V.n1(W.saudiPct) + '%' + (W.target ? ' <small>/ ' + W.target + '%</small>' : '') + '</dd></div>' +
      factBox('pay:runs') + '<dt>' + t('hmPayroll') + '</dt><dd>' + (r.money && last ? V.n1(last.cost / 1000, 0) + 'K <small>' + V.monthShort(last.month) + '</small>' : '-') + '</dd></div>' + factBox('requests:centre', 'requests:inbox') + '<dt>' + t('hmOpenReq') + '</dt><dd>' + V.n1(open, 0) + (Rq.openOver3Days ? ' <small>' + Rq.openOver3Days + ' &gt; 3 ' + t('dbDays') + '</small>' : '') + '</dd></div></dl></div>';
    var hg = $('#hmHero .gauge', el), hd = V.goOk(['time:board', 'insights:dashboard']); if (hg && hd) { hg.setAttribute('data-go', hd); hg.setAttribute('role', 'link'); hg.setAttribute('tabindex', '0'); hg.classList.add('is-go'); }
    wire($('#hmHero', el));
    V.spinGauges(el);
    var dp = (A.departments || []).slice().sort(function(a, b){ return (b.expected || 0) - (a.expected || 0); }).slice(0, 7);
    var dept = $('#hmDept', el); if (dept) dept.outerHTML = chartCard('hmDept', 'hm-s4', 'buildings', t('hmDepts'), '',
      dp.length ? V.hbars(dp.map(function(d){ return { label: d.department, value: d.rate || 0, text: V.n1(d.rate, 0) + '%', tip: d.department + ': ' + V.n1(d.rate) + '%' }; }), { max: 100 }) : V.empty(null, 'buildings'),
      dp.length ? V.tbl([t('hrDept'), t('dbAttRate'), t('hmK_present'), t('hmK_late')], dp.map(function(d){ return [esc(d.department), V.n1(d.rate) + '%', d.present, d.late]; })) : '', ['time:board', 'insights:attendance']);
    var mv = W.movement || [];
    var move = $('#hmMove', el); if (move) move.outerHTML = chartCard('hmMove', 'hm-s8', 'users-three', t('hmMove'), t('hmMoveLead'),
      mv.length ? V.grouped(mv.map(function(m){ return { label: V.monthShort(m.month), a: m.joiners, b: m.leavers }; })) : V.empty(null, 'users-three'),
      mv.length ? V.tbl(['', t('hmJoin'), t('hmLeft')], mv.map(function(m){ return [V.monthShort(m.month), m.joiners, m.leavers]; })) : '', ['people:onboarding', 'people:offboarding', 'insights:dashboard']);
    V.wire(el);
  }, true);
  // the last 14 days feed the sparklines; one more read after the page is drawn, never before it
  apiFresh('dashboard', { from: addDays(today, -13), to: today }, function(r){ if (!live() || !r.ok) return; R14 = r; paintRows(); }, true);
  tasksInto($('#hmDecide .hm-rows', el), true);
  if (canCal) apiFresh('complianceCalendar', {}, function(r){
    if (r && r.ok) CAL = r; calDone = true; paintIns();
    var box = $('#hmCal .hm-rows', el); if (!live() || !box || !r.ok) return;
    var items = r.items.filter(function(x){ return x.level !== 'info'; }).slice(0, 5);
    box.innerHTML = items.length ? items.map(function(x){
      var who = x.emp ? esc(x.emp.name) : x.month ? esc(x.month) : '';
      var when = x.due ? (x.daysLeft < 0 ? t('cpLate') + ' ' + plural(-x.daysLeft, 'days') : t('cpLeft') + ' ' + plural(x.daysLeft, 'days')) : '';
      return '<div class="hm-r"><div class="m hm-sev ' + x.level + '"><b>' + (T[S.lang]['ck_' + x.kind] || x.kind) + '</b><small>' + [who, when].filter(Boolean).join(' · ') + '</small></div></div>';
    }).join('') : V.empty(t('hmNoDeadlines'), 'shield-check');
  }, true);
}

// ---------------- personal ----------------
function myHome(el){
  var gen = el._g = (el._g || 0) + 1, live = function(){ return el.isConnected && el._g === gen; };
  var td = S.today || {}, sh = S.shift || {}, next = td.next || 'in', off = td.status === 'off', mgr = R().manager;
  var status = td.lastOut && next === 'in' ? t('hmOut') + ' ' + fmtHm(td.lastOut) : td.firstIn ? t('hmIn') + ' ' + fmtHm(td.firstIn) : off ? t('hmOff') : t('hmNotYet');
  sh = { start: td.shiftStart || sh.start, end: td.shiftEnd || sh.end };
  var D = {}; // answers as they arrive: hist, prev, leave, slips, team, teamLeave, tasks
  el.innerHTML = '<div class="hm-grid">' + (mgr ? '<section class="hm-s12" id="hmTeamRow">' + teamRow(D) + '</section>' + insCard('hmTeamIns', 'users-three', 'tiTitle', 'tiLead') : '') +
    '<section class="hm-s12" id="hmMineRow">' + mineRow(D) + '</section>' +
    '<section class="hm-card hm-s12 hm-ins" id="hmIns" aria-live="polite"><h2>' + ph('sparkle', 'duotone') + t('inTitle') + '</h2><p class="lead">' + t('inLead') + '</p><div class="hm-ins-list">' + sk(2) + '</div></section>' +
    '<section class="hm-card hm-clock hm-s5"><h2>' + ph('clock') + t('hmShift') + '</h2>' + todayRing(td, sh) + '<div class="t"><bdi dir="ltr">' + esc(sh.start || '--:--') + ' – ' + esc(sh.end || '--:--') + '</bdi></div><small>' + status + '</small><br>' +
      '<button type="button" class="go" data-go="time:punch">' + ph('fingerprint') + (next === 'out' ? t('hmCheckOut') : t('hmCheckIn')) + '</button></section>' +
    '<section class="hm-card hm-s7" id="hmTasks"><h2>' + ph('bell') + t('hmMyTasks') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s8" id="hmMonth"><h2>' + ph('calendar-check') + t('hmMonthStrip') + '</h2><p class="lead">' + t('hmMonthLead') + '</p>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmQuick"><h2>' + ph('lightning') + t('hmQuick') + '</h2><p class="lead">' + t('hmQuickLead') + '</p><div class="hm-quick">' +
      [['leave', 'airplane-tilt', 'requests:new:leave'], ['letter', 'envelope-simple', 'requests:new:letter'], ['expense', 'receipt', 'requests:claim'], ['correction', 'fingerprint-simple', 'requests:new:correction']].map(function(q){
        var d = V.goOk(q[2]); return d ? '<button type="button" class="hm-q" data-go="' + d + '"><span class="qi">' + ph(q[1], 'duotone') + '</span>' + t('hmQ_' + q[0]) + '</button>' : ''; }).join('') + '</div></section></div>';
  wire(el);
  var pq = 0;
  function paint(){ if (pq) return; pq = requestAnimationFrame(function(){ pq = 0; if (!live()) return;
    if (mgr && D.team && D.teamLeave && D.office) insPaint($('#hmTeamIns .hm-ins-list', el), teamInsights(D), 'tiNone');
    var ib = $('#hmIns .hm-ins-list', el); if (ib && D.hist && D.leave) { ib.innerHTML = insightsHtml(D); wire(ib); rowTap(ib); }
    [['#hmMineRow', mineRow], ['#hmTeamRow', teamRow]].forEach(function(x){ var box = $(x[0], el); if (!box) return; var again = !!box.dataset.p; box.dataset.p = '1'; box.innerHTML = x[1](D); if (again) still(box); V.wire(box); });
  }); }
  var month = riyadhToday().slice(0, 7);
  apiFresh('myTasks', {}, function(r){ if (!live() || !r.ok) return; D.tasks = r; tasksPaint($('#hmTasks .hm-rows', el), r, false); paint(); }, true);
  apiFresh('myHistory', {}, function(r){ if (!live() || !r.ok) return; D.hist = r; paint(); monthStrip($('#hmMonth', el), r); }, true);
  apiFresh('myHistory', { month: prevMonth(month) }, function(r){ if (!live() || !r.ok) return; D.prev = r; paint(); }, true);
  apiFresh('myRequests', {}, function(r){ if (!live() || !r.ok) return; D.leave = r; paint(); }, true);
  apiFresh('mySlips', {}, function(r){ if (!live() || !r.ok) return; D.slips = r; paint(); }, true);
  apiFresh('holidayList', {}, function(r){ if (!live() || !r.ok) return; D.hol = r; paint(); }, true);
  if (mgr) {
    apiFresh('hrTeam', {}, function(r){ if (!live() || !r.ok) return; D.team = r; paint(); }, true);
    apiFresh('leaveTeam', {}, function(r){ if (!live() || !r.ok) return; D.teamLeave = r; paint(); }, true);
    apiFresh('officeMap', {}, function(r){ if (!live() || !r.ok) return; D.office = r; paint(); }, true);
    var nm = addDays(riyadhToday().slice(0, 7) + '-28', 7).slice(0, 7); // next month too, for leave in the coming two weeks
    apiFresh('leaveTeam', { month: nm }, function(r){ if (!live() || !r.ok) return; D.teamLeave2 = r; paint(); }, true);
  }
}
function hmOf(min){ min = Math.max(0, Math.round(min || 0)); return t('inHm').replace('{h}', Math.floor(min / 60)).replace('{m}', ('0' + (min % 60)).slice(-2)); }
function minOf(hm){ var m = /^(\d{1,2}):(\d{2})/.exec(hm || ''); return m ? +m[1] * 60 + +m[2] : null; }
function riyadhMin(iso){ var d = new Date(Date.parse(iso) + 180 * 60000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
function daysWord(n){ return n === 0 ? t('inToday') : n === 1 ? t('inDays1') : t('inDays').replace('{n}', n); }
/** Today's hours against the shift, as a ring (only on a working day with a known shift). */
function todayRing(td, sh){
  var s = minOf(sh.start), e = minOf(sh.end); if (s == null || e == null || td.status === 'off') return '';
  var plan = (e > s ? e - s : e + 1440 - s), w = td.workedMin || 0;
  return '<div class="hm-ring" aria-label="' + esc(t('inWorked').replace('{w}', hmOf(w)).replace('{s}', hmOf(plan)).replace('{r}', hmOf(plan - w))) + '">' + V.ring(Math.min(100, w / plan * 100), hmOf(w), t('hmShift'), { size: 64 }) + '</div>';
}
/**
 * Smart insights: plain rules over the person's own data (today, this month's days, requests, leave, payslips, holidays).
 * Each says why and offers one next step. At most five, most urgent first. Nothing here is sent anywhere.
 */
function insights(D){
  var out = [], td = S.today || {}, sh = S.shift || {}, now = riyadhMin(new Date().toISOString()), today = riyadhToday();
  var start = minOf(td.shiftStart || sh.start), end = minOf(td.shiftEnd || sh.end);
  var add = function(pri, tone, icon, text, go, label){ out.push({ pri: pri, tone: tone, icon: icon, text: text, go: go, label: label }); };
  var days = (D.hist && D.hist.days) || [];
  // 1. a check-out that never came (last 7 days)
  var miss = days.filter(function(d){ return d.status === 'missing_out' && d.date < today && d.date >= addDays(today, -7); }).pop();
  if (miss) add(1, 'r', 'clock-counter-clockwise', t('inMissOut').replace('{d}', V.shortDate(miss.date)), V.goOk('requests:new:correction'), t('inMissOutGo'));
  // 2. today
  if (td.remoteDay) add(3, 'b', 'house-line', t('inRemote'), td.firstIn ? '' : 'time:punch', td.firstIn ? '' : t('inGoPunch'));
  else if (td.workday !== false && td.status !== 'off' && td.status !== 'leave' && td.status !== 'holiday' && start != null) {
    if (!td.firstIn && now < start && start - now <= 90) add(2, 'b', 'alarm', t('inSoon').replace('{m}', start - now).replace('{t}', esc(td.shiftStart || sh.start)), 'time:punch', t('inGoPunch'));
    else if (!td.firstIn && now >= start && (end == null || now < end)) add(1, 'y', 'fingerprint', t('inNotIn').replace('{t}', esc(td.shiftStart || sh.start)), 'time:punch', t('inGoPunch'));
    else if (td.firstIn && td.next === 'out' && end != null) {
      var plan = end > start ? end - start : end + 1440 - start, w = td.workedMin || 0;
      if (w >= plan) add(3, 'g', 'check-circle', t('inDone').replace('{w}', hmOf(w)), 'time:punch', t('inGoPunch'));
      else add(5, 'g', 'hourglass-medium', t('inWorked').replace('{w}', hmOf(w)).replace('{s}', hmOf(plan)).replace('{r}', hmOf(plan - w)), '', '');
    }
  }
  // 3. punctuality: a run of late days, or the month's good record
  var work = days.filter(function(d){ return d.workday && d.firstIn && d.date <= today; });
  var last7 = work.slice(-7), lateN = last7.filter(function(d){ return d.lateMin > 0; }).length;
  var avg = function(list){ return list.length ? Math.round(list.reduce(function(a, d){ return a + riyadhMin(d.firstIn); }, 0) / list.length) : null; };
  if (lateN >= 3 && start != null) {
    var lateAvg = Math.round(last7.filter(function(d){ return d.lateMin > 0; }).reduce(function(a, d){ return a + d.lateMin; }, 0) / lateN);
    add(2, 'y', 'clock-countdown', t('inLateRun').replace('{n}', lateN).replace('{t}', hmOf(lateAvg)).replace('{s}', esc(td.shiftStart || sh.start)), 'time:history', t('inSeeLog'));
  } else if (work.length >= 5) {
    var onTime = work.filter(function(d){ return !d.lateMin; }).length, a = avg(work);
    add(6, 'g', 'medal', t('inOnTime').replace('{a}', onTime).replace('{b}', work.length).replace('{t}', hmOf(a)), 'time:history', t('inSeeLog'));
  }
  // 4. the oldest request still waiting
  var pend = ((D.leave && D.leave.rows) || []).filter(function(r){ return r.status === 'pending'; }).sort(function(a, b){ return a.createdAt < b.createdAt ? -1 : 1; })[0];
  if (pend) {
    var age = Math.max(0, Math.floor((Date.now() - Date.parse(pend.createdAt)) / 864e5)), st = String(pend.step || '');
    var who = st.indexOf('person:') === 0 ? esc(pend.stepWho || t('inWho_other')) : t('inWho_' + (['manager', 'hr', 'payroll', 'dept_head', 'executive'].indexOf(st) >= 0 ? st : 'other'));
    if (age >= 2) add(age >= 5 ? 2 : 4, age >= 5 ? 'y' : 'b', 'hourglass-medium', t('inPending').replace('{r}', '<bdi>' + esc(pend.ref) + '</bdi>').replace('{w}', who).replace('{d}', daysWord(age)), 'requests:mine', t('inSeeReq'));
  }
  // 5. holidays, then leave balance
  var hol = ((D.hol && D.hol.rows) || []).filter(function(h){ return (h.toDate || h.date) >= today; })[0];
  if (hol) {
    var hn = esc(S.lang === 'en' && hol.nameEn ? hol.nameEn : hol.nameAr), inN = Math.round((Date.parse(hol.date) - Date.parse(today)) / 864e5);
    if (hol.date <= today) add(2, 'b', 'confetti', t('inHolidayToday').replace('{h}', hn), '', '');
    else if (inN <= 45) add(5, 'b', 'calendar-star', t('inHoliday').replace('{h}', hn).replace('{n}', daysWord(inN)), '', '');
  }
  var an = D.leave && D.leave.leave && D.leave.leave.annual;
  if (an && an.available >= 15) add(6, 'b', 'airplane-tilt', t('inLeave').replace('{n}', plural(Math.floor(an.available), 'days')), V.goOk('requests:new:leave'), t('inLeaveGo'));
  // 6. a payslip from this month or last
  var s0 = D.slips && D.slips.rows && D.slips.rows[0];
  if (s0 && (s0.month === today.slice(0, 7) || s0.month === prevMonth(today.slice(0, 7)))) add(5, 'g', 'receipt', t('inSlip').replace('{m}', V.monthShort(s0.month)).replace('{v}', V.n1(s0.net, 0) + ' ' + t('mfSar')), V.goOk('pay:slips'), t('inSlipGo'));
  return out.sort(function(a, b){ return a.pri - b.pri; }).slice(0, 5);
}
function insightsHtml(D, list, none){
  list = list || insights(D);
  if (!list.length) return '<p class="hm-ins-none">' + ph('sun', 'duotone') + t(none || 'inNone') + '</p>';
  return list.map(function(x, i){
    return '<div class="hm-in hm-in-' + x.tone + '" style="--i:' + i + '"><span class="ic">' + ph(x.icon, 'duotone') + '</span><p>' + x.text + '</p>' +
      (x.go ? '<button type="button" class="btn btn-line btn-sm" data-go="' + esc(x.go) + '">' + esc(x.label) + ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') + '</button>' : '') + '</div>';
  }).join('');
}
function insCard(id, icon, title, lead){ return '<section class="hm-card hm-s12 hm-ins" id="' + id + '" aria-live="polite"><h2>' + ph(icon, 'duotone') + t(title) + '</h2><p class="lead">' + t(lead) + '</p><div class="hm-ins-list">' + sk(2) + '</div></section>'; }
function insPaint(box, list, none){ if (!box) return; box.innerHTML = insightsHtml(null, list, none); wire(box); rowTap(box); }
function rowTap(box){ $$('.hm-in', box).forEach(function(r){ var b = r.querySelector('[data-go]'); if (!b) return; r.classList.add('is-go'); r.onclick = function(ev){ if (ev.target.closest('button')) return; b.click(); }; }); }
function names(list){ var n = list.slice(0, 3).map(function(p){ return esc(first(p.name)); }).join('، '); return list.length > 3 ? n + ' +' + (list.length - 3) : n; }
/** A manager's team: late and not-yet-in today (office map day status, own people only), leave today, leave waiting, overlapping leave. */
function teamInsights(D){
  var out = [], today = riyadhToday(), add = function(pri, tone, icon, text, go, label){ out.push({ pri: pri, tone: tone, icon: icon, text: text, go: go, label: label }); };
  var ids = {}; ((D.team && D.team.rows) || []).forEach(function(r){ ids[(r.emp && r.emp.id) || r.id] = 1; });
  var team = ((D.office && D.office.people) || []).filter(function(p){ return p.day && !p.me && ids[p.id]; });
  var late = team.filter(function(p){ return p.day.lateMin > 0; }), absent = team.filter(function(p){ return p.day.status === 'absent'; }), onLeave = team.filter(function(p){ return p.day.status === 'leave'; });
  if (absent.length) add(1, 'r', 'user-minus', t('tiAbsent').replace('{n}', absent.length).replace('{who}', names(absent)), 'time:office', t('tiSeeMap'));
  if (late.length) add(2, 'y', 'clock-countdown', t('tiLate').replace('{n}', late.length).replace('{who}', names(late)), 'time:office', t('tiSeeMap'));
  if (onLeave.length) add(5, 'b', 'airplane-tilt', t('tiLeaveToday').replace('{n}', onLeave.length), V.goOk('requests:leave'), t('tiSeeLeave'));
  var lv = ((D.teamLeave && D.teamLeave.rows) || []).concat((D.teamLeave2 && D.teamLeave2.rows) || []).filter(function(x){ return x.emp && ids[x.emp.id] && (!S.me || x.emp.id !== S.me.id); }); // own people only (an HR manager gets the whole company here)
  var pend = lv.filter(function(x){ return x.status === 'pending'; }).sort(function(a, b){ return a.createdAt < b.createdAt ? -1 : 1; });
  if (pend.length) { var at = Date.parse(pend[0].createdAt), age = isNaN(at) ? 0 : Math.max(0, Math.floor((Date.now() - at) / 864e5)); add(age >= 3 ? 1 : 3, age >= 3 ? 'y' : 'b', 'hourglass-medium', (isNaN(at) ? t('tiPendingN') : t('tiPending')).replace('{n}', pend.length).replace('{d}', daysWord(age)), V.goOk('requests:inbox') || V.goOk('requests:centre'), t('tiDecide')); }
  // the busiest day in the next 14 days (approved and pending leave together)
  var busy = null;
  for (var i = 0; i < 14; i++) {
    var d = addDays(today, i), n = lv.filter(function(x){ return (x.status === 'approved' || x.status === 'pending') && x.fromDate <= d && x.toDate >= d; }).length;
    if (n >= 2 && (!busy || n > busy.n)) busy = { d: d, n: n };
  }
  if (busy) add(3, 'y', 'users-three', t('tiOverlap').replace('{n}', busy.n).replace('{d}', V.shortDate(busy.d)), V.goOk('requests:leave'), t('tiSeeLeave'));
  return out.sort(function(a, b){ return a.pri - b.pri; }).slice(0, 5);
}
/** HR, payroll and executives: today's attendance, review queue, missing check-outs, request age, departments, compliance, Saudization. */
function companyInsights(r, r14, cal){
  var out = [], add = function(pri, tone, icon, text, go, label){ out.push({ pri: pri, tone: tone, icon: icon, text: text, go: go, label: label }); };
  var A = (r && r.attendance) || {}, T0 = A.totals || {}, Rq = (r && r.requests) || {}, W = (r && r.workforce) || {};
  if (T0.review) add(1, 'y', 'shield-warning', t('ciReview').replace('{n}', T0.review), V.goOk('time:review'), t('ciReviewGo'));
  if (T0.expected && (T0.absent || T0.late)) add(T0.absent / T0.expected >= .1 ? 1 : 3, T0.absent / T0.expected >= .1 ? 'r' : 'y', 'users', t('ciAbsent').replace('{n}', T0.absent || 0).replace('{l}', T0.late || 0).replace('{e}', T0.expected), V.goOk('time:board'), t('ciBoard'));
  var mo = r14 && r14.attendance && r14.attendance.totals && r14.attendance.totals.missingOut;
  if (mo) add(4, 'y', 'clock-counter-clockwise', t('ciMissOut').replace('{n}', mo), V.goOk('time:board'), t('ciBoard'));
  if (Rq.openOver3Days) add(2, 'y', 'hourglass-medium', t('ciOld').replace('{n}', Rq.openOver3Days).replace('{d}', daysWord(Rq.oldestOpenDays || 0)), V.goOk('requests:centre') || V.goOk('requests:inbox'), t('ciCentre'));
  var dp = (A.departments || []).filter(function(d){ return d.expected >= 3 && d.rate != null; }).sort(function(a, b){ return a.rate - b.rate; })[0];
  if (dp && dp.rate < 80) add(4, 'y', 'buildings', t('ciDept').replace('{dept}', esc(dp.department)).replace('{r}', V.n1(dp.rate, 0)), V.goOk('time:board'), t('ciBoard'));
  if (cal) {
    var items = cal.items || [], over = items.filter(function(x){ return x.due && x.daysLeft < 0; }).length, soon = items.filter(function(x){ return x.due && x.daysLeft >= 0 && x.daysLeft <= 7 && x.level !== 'info'; }).length;
    if (over) add(1, 'r', 'warning-circle', t('ciLate').replace('{n}', over), V.goOk('pay:compliance'), t('ciLateGo'));
    else if (soon) add(4, 'b', 'calendar-dots', t('ciSoon').replace('{n}', soon), V.goOk('pay:compliance'), t('ciLateGo'));
  }
  if (W.target && W.saudiPct != null && W.saudiPct < W.target) add(5, 'b', 'flag', t('ciSaudi').replace('{p}', V.n1(W.saudiPct)).replace('{t}', W.target), V.goOk('insights:dashboard'), t('ciSaudiGo'));
  return out.sort(function(a, b){ return a.pri - b.pri; }).slice(0, 5);
}
/** My month: attendance share, late days, leave balance, last net pay; each against the same days last month or the slip before. */
function mineRow(D){
  var h = D.hist, p = D.prev, today = riyadhToday(), dayN = +today.slice(8, 10);
  var stat = function(r, upto){
    if (!r) return null;
    var ds = r.days.slice().reverse().filter(function(d){ return !upto || +d.date.slice(8, 10) <= upto; });
    var exp = 0, pres = 0, late = 0, run = [], lateRun = [];
    ds.forEach(function(d){ if (!d.workday || ['upcoming', 'leave', 'holiday'].indexOf(d.status) >= 0 || d.leaveType || d.holiday) return; exp++; if (d.firstIn) pres++; if (d.lateMin) late++; run.push(pres / exp * 100); lateRun.push(d.lateMin || 0); });
    return { rate: exp ? pres / exp * 100 : null, late: late, run: run, lateRun: lateRun };
  };
  var cur = stat(h), old = stat(p, dayN), a = D.leave && D.leave.leave && D.leave.leave.annual || null, slips = D.slips && D.slips.rows || null;
  var s0 = slips && slips[0], s1 = slips && slips[1], words = t('hmVsSameDays');
  var tiles = [
    kTile({ k: 'g', icon: 'calendar-check', label: t('hmAttRate'), value: cur ? (cur.rate == null ? '-' : V.n1(cur.rate, 0) + '%') : null, sub: cur ? plural(h.totals.present, 'days') : '',
      delta: cur && old ? V.delta(dif(cur.rate, old.rate), true, t('dbPts'), words) : '', spark: cur && cur.run.length > 1 ? V.spark(cur.run, { min: 0, max: 100, label: t('hmAttRate') }) : '', go: ['time:history'] }),
    kTile({ k: 'y', icon: 'clock-countdown', label: t('hmLateDays'), value: cur ? V.n1(cur.late, 0) : null, sub: h && h.totals.lateMin ? V.n1(h.totals.lateMin, 0) + ' ' + t('dbMinutes') : '',
      delta: cur && old ? V.delta(cur.late - old.late, false, '', words) : '', spark: cur && cur.lateRun.length > 1 ? V.spark(cur.lateRun, { min: 0, warm: true, label: t('hmLateMin') }) : '', go: ['time:history'] }),
    kTile({ k: 'b', icon: 'airplane-tilt', label: t('hmLeave'), value: D.leave ? (a ? plural(Math.round((a.available || 0) * 10) / 10, 'days') : '-') : null,
      sub: a ? t('hmUsed') + ' ' + V.n1(a.used || 0) + ' / ' + (a.perYear || 21) + ' ' + t('hmPerYear') : '',
      spark: a ? V.ring(Math.min(100, (a.available || 0) / Math.max(1, a.perYear || 21) * 100), V.n1(Math.round((a.available || 0) * 10) / 10), t('hmLeave'), { size: 46 }) : '', go: ['requests:mine'] }),
    kTile({ k: 'r', icon: 'receipt', label: t('hmNetPay'), value: D.slips ? (s0 ? V.n1(s0.net, 0) : '-') : null, unit: s0 ? t('mfSar') : '', sub: s0 ? V.monthShort(s0.month) : (D.slips ? t('hmNoSlip') : ''),
      delta: s0 && s1 ? V.delta(dif(s0.net, s1.net), true, t('mfSar'), t('hmVsSlip')) : '',
      spark: slips && slips.length > 1 ? V.spark(slips.slice(0, 6).reverse().map(function(s){ return s.net; }), { label: t('hmNetPay') }) : '', go: ['pay:slips'] })];
  return row('hmRowMine', 'user', t('hmRowMine'), tiles.join(''), t('hmBasisSame'));
}
/** A manager's team at a glance: people, on leave today, leave waiting, decisions waiting. */
function teamRow(D){
  var today = riyadhToday(), tm = D.team && D.team.rows || null, lv = D.teamLeave && D.teamLeave.rows || null;
  if (lv && S.me) lv = lv.filter(function(x){ return !x.emp || x.emp.id !== S.me.id; });
  var onLeave = lv ? lv.filter(function(x){ return x.status === 'approved' && x.fromDate <= today && x.toDate >= today; }).length : null;
  var waiting = lv ? lv.filter(function(x){ return x.status === 'pending'; }).length : null;
  var decide = D.tasks ? D.tasks.tasks.filter(function(x){ return x.kind !== 'delegated' && x.target && x.target.tab === 'hr'; }).reduce(function(s, x){ return s + (x.count || 0); }, 0) : null;
  return row('hmRowTeam', 'users-three', t('hmRowTeam'), [
    kTile({ k: 'g', icon: 'users-three', label: t('hmTeamSize'), value: tm ? V.n1(tm.length, 0) : null, sub: tm ? V.n1(tm.filter(function(x){ return x.direct; }).length, 0) + ' ' + t('hmDirect') : '', go: ['people:team'] }),
    kTile({ k: 'b', icon: 'airplane-tilt', label: t('hmTeamLeave'), value: onLeave == null ? null : V.n1(onLeave, 0), go: ['requests:leave'] }),
    kTile({ k: 'y', icon: 'hourglass-medium', label: t('hmTeamPending'), value: waiting == null ? null : V.n1(waiting, 0), go: ['requests:inbox', 'requests:leave'] }),
    kTile({ k: 'r', icon: 'seal-check', label: t('hmTeamDecide'), value: decide == null ? null : V.n1(decide, 0), go: ['requests:inbox', 'requests:centre'] })].join(''));
}
/** The month as squares: status in colour plus a mark and a word in the tooltip; a legend in words under it. */
function monthStrip(box, r){
  if (!box) return;
  var days = r.days.slice().reverse(), today = riyadhToday();
  var cls = function(d){ if (d.leaveType || d.holiday || d.status === 'leave' || d.status === 'holiday') return 'v'; if (d.firstIn) return d.lateMin ? 'l' : 'p'; if (d.status === 'absent') return 'a'; return ''; };
  var word = { p: t('hmD_present'), l: t('hmD_late'), a: t('hmD_absent'), v: t('hmD_leave'), '': t('hmD_off') };
  var cells = days.map(function(d){
    var c = cls(d), lbl = V.shortDate(d.date) + ': ' + word[c] + (d.lateMin ? ' (' + d.lateMin + ' ' + t('dbMinutes') + ')' : '');
    return '<button type="button" class="hm-d ' + c + (d.date === today ? ' today' : '') + '" data-day="' + esc(d.date) + '" aria-label="' + esc(lbl) + '" data-tip="' + esc(lbl) + '">' + (+d.date.slice(8, 10)) + '</button>';
  }).join('');
  var legend = [['p', 'ok'], ['l', 'warn'], ['a', 'bad'], ['v', 'info']].map(function(x){ return '<span><i style="background:var(--' + x[1] + '-bg);box-shadow:inset 0 0 0 1.5px var(--' + x[1] + ')"></i>' + word[x[0]] + '</span>'; }).join('');
  box.innerHTML = '<h2>' + ph('calendar-check') + t('hmMonthStrip') + '<span class="sp"></span>' + (V.goOk('time:history') ? '<button type="button" class="db-open" data-go="time:history">' + t('dbOpen') + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</button>' : '') + '</h2><p class="lead">' + t('hmMonthLead') + '</p>' +
    (days.length ? '<div class="hm-days">' + cells + '</div><div class="hm-legend">' + legend + '</div>' : V.empty(null, 'calendar-blank'));
  V.wire(box);
  $$('[data-day]', box).forEach(function(b){ b.onclick = function(){ dayDrawer(days.filter(function(d){ return d.date === b.dataset.day; })[0]); }; });
}
/** One day in full: times, lateness, hours, leave or holiday, and a correction request when the check-out is missing. */
function dayDrawer(d){
  if (!d) return;
  var st = T[S.lang]['st_' + d.status] || d.status || t('dyNone'), row = function(k, v){ return '<div><dt>' + t(k) + '</dt><dd>' + (v || t('dyNone')) + '</dd></div>'; };
  var hol = d.holiday && typeof d.holiday === 'object' ? (S.lang === 'en' && d.holiday.nameEn ? d.holiday.nameEn : d.holiday.nameAr) : d.holiday;
  var html = '<h3>' + t('dyTitle').replace('{d}', V.shortDate(d.date)) + '</h3><dl class="hm-day">' + row('dyStatus', esc(st)) + row('dyShift', d.shiftStart ? '<bdi dir="ltr">' + esc(d.shiftStart) + ' – ' + esc(d.shiftEnd) + '</bdi>' : '') +
    row('dyIn', d.firstIn ? '<bdi>' + fmtHm(d.firstIn) + '</bdi>' : '') + row('dyOut', d.lastOut ? '<bdi>' + fmtHm(d.lastOut) + '</bdi>' : '') +
    row('dyLate', d.lateMin ? t('dyMin').replace('{n}', d.lateMin) : '') + row('dyWorked', d.workedMin ? '<bdi>' + hmOf(d.workedMin) + '</bdi>' : '') +
    (d.leaveType ? row('dyLeave', esc(T[S.lang]['lt_' + d.leaveType] || d.leaveType)) : '') + (hol ? row('dyHoliday', esc(hol)) : '') + '</dl><div class="btnrow">' +
    (d.status === 'missing_out' && V.goOk('requests:new:correction') ? '<button type="button" class="btn btn-dark btn-sm" data-go="requests:new:correction">' + ph('clock-counter-clockwise') + t('dyFix') + '</button>' : '') +
    (V.goOk('time:history') ? '<button type="button" class="btn btn-line btn-sm" data-go="time:history">' + ph('calendar-check') + t('dyLog') + '</button>' : '') + '</div>';
  var dr = drawer(html); $$('[data-go]', dr).forEach(function(b){ b.onclick = function(){ var q = b.dataset.go.split(':'); dr.remove(); goArea(q[0], q[1], q[2]); }; });
}

/** My tasks as rows; each opens where the work is. */
var TK = { requests: 'tray', salaries: 'seal-check', payroll: 'money', reports: 'file-text', recon: 'scales', wps: 'bank', onboarding: 'rocket-launch', policies: 'book-open-text', survey: 'heartbeat', plans: 'path',
  disc_respond: 'scales', disc_decide: 'gavel', disc_objection: 'gavel', injury: 'first-aid-kit', asset_ack: 'package', asset_charge: 'package', clearance: 'sign-out', delegated: 'handshake' };
function tasksPaint(box, r, decideOnly){
  if (!box || !box.isConnected) return;
  var list = r.tasks.filter(function(x){ return x.kind !== 'delegated' && (!decideOnly || (x.target && x.target.tab === 'hr')); });
  box.innerHTML = list.length ? list.slice(0, 6).map(function(x){
    var dest = taskDest(x);
    return '<div class="hm-r"><span class="ic">' + ph(TK[x.kind] || 'circle', 'duotone') + '</span><div class="m"><b>' + (T[S.lang]['tk_' + x.kind] || x.kind) + '</b></div><span class="n num">' + x.count + '</span><button type="button" class="hm-mini" data-go="' + dest + '">' + t('hmOpen') + '</button></div>';
  }).join('') : V.empty(t('hmNothing'), 'check-circle');
  wire(box);
}
function tasksInto(box, decideOnly){
  apiFresh('myTasks', {}, function(r){ if (r.ok) tasksPaint(box, r, decideOnly); }, true);
}
function wire(root){
  $$('[data-go]', root).forEach(function(b){ b.onclick = function(){ var p = b.dataset.go.split(':'); if (window.goArea) goArea(p[0], p[1], p[2]); }; });
  $$('[data-open-tasks]', root).forEach(function(b){ b.onclick = function(){ if (window.openTasks) openTasks(); }; });
}

window.Home = { render: render };
})();
