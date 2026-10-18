// Home (design system v2, 2026-09-30; KPI rows per role, sparklines, comparisons and drill-down 2026-10-14 with the
// kpi-dashboard-design and dataviz skills): the first page of the HR system, role-aware.
// Company view for HR, payroll and executives: one or two KPI rows chosen by role (attendance, pay, executive), the day's
// gauge, what waits for a decision, legal deadlines, attendance by department and joiners/leavers.
// Personal view for everyone: my team (managers), my month, the check-in card (the only pine surface), my tasks, a month
// strip and quick actions. Every tile opens its screen (goArea); every chart has a table view.
(function(){
'use strict';
var V = window.Viz;

Object.assign(T.ar, {
  hmMorning:'صباح الخير', hmEvening:'مساء الخير', hmCompany:'الشركة', hmMine:'أنا', fdTab:'الحائط', fdToday:'اليوم', fdAway:'خارج المكتب', fdJoin:'انضم حديثا', fdAnv:'ذكرى انضمام', fdEmpty:'لا جديد على الحائط بعد.', fdErr:'تعذر تحميل الحائط.',
  fdk_announcement:'إعلان', fdk_kudos:'شكر وتقدير', fdk_joiner:'موظف جديد', fdk_anniversary:'ذكرى انضمام', fdk_training:'دورة تدريبية', fdJoined:'انضم إلى الفريق', fdYears:'{n} سنوات معنا', fdYear1:'سنة معنا', fdThanks:'شكر', fdTrainFrom:'تبدأ', fdAndOthers:'و{n} آخرون',
  fdr_like:'أعجبني', fdr_celebrate:'تهنئة', fdr_support:'دعم', fdr_insightful:'مفيد', fdReactOn:'تفاعلت', fdNoToday:'لا أحد خارج المكتب، ولا انضمامات أو ذكريات اليوم.', hmToday:'الحضور اليوم', hmTodaySentence:'{p} من {e} بدأوا يومهم. {l} متأخرون و{v} في إجازة.',
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
  hmMorning:'Good morning', hmEvening:'Good evening', hmCompany:'Company', hmMine:'Me', fdTab:'Feed', fdToday:'Today', fdAway:'Away', fdJoin:'New', fdAnv:'Anniversary', fdEmpty:'Nothing on the feed yet.', fdErr:'The feed could not load.',
  fdk_announcement:'Announcement', fdk_kudos:'Thanks', fdk_joiner:'New joiner', fdk_anniversary:'Work anniversary', fdk_training:'Training', fdJoined:'joined the team', fdYears:'{n} years with us', fdYear1:'one year with us', fdThanks:'thanked', fdTrainFrom:'Starts', fdAndOthers:'and {n} others',
  fdr_like:'Like', fdr_celebrate:'Celebrate', fdr_support:'Support', fdr_insightful:'Insightful', fdReactOn:'You reacted', fdNoToday:'Nobody away, and no joiners or anniversaries today.', hmToday:'Attendance today', hmTodaySentence:'{p} of {e} have started their day. {l} late and {v} on leave.',
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
'.hm-ph h1{margin:0;font-size:30px;line-height:1.25;font-weight:600;letter-spacing:-.01em;font-variation-settings:"HEXP" 35;text-wrap:balance}.hm-ph p{margin:4px 0 0;color:var(--ink-2);font-size:14.5px}' +
'.hm-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.hm-grid > *{min-width:0}' +
'.hm-s4{grid-column:span 4}.hm-s5{grid-column:span 5}.hm-s7{grid-column:span 7}.hm-s8{grid-column:span 8}.hm-s12{grid-column:1 / -1}' +
'.hm-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;position:relative}' +
'.hm-card h2{margin:0;font-size:16px;font-weight:600;line-height:1.4;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hm-card h2 > i{color:var(--brand);font-size:19px}.hm-card h2 .sp{flex:1}' +
'.hm-card h2 > button:not(.db-open){border:0;background:none;color:var(--brand);font-size:13px;font-weight:500;padding:0;cursor:pointer}' +
'.hm-card .lead{margin:2px 0 12px;color:var(--ink-3,#5F6D63);font-size:13px}' +
'.hm-hero{display:grid;grid-template-columns:auto minmax(0,1fr);gap:28px;align-items:center;padding:22px 26px}' +
'.hm-hero h2{font-size:14px;color:var(--ink-3,#5F6D63);font-weight:500}.hm-hero .big{font-size:21px;font-weight:600;margin:2px 0 14px;line-height:1.45;text-wrap:balance}' +
'.hm-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;border-top:1px solid var(--line-2,#EEEAE0)}' +
'.hm-facts div{padding:12px 14px 2px;border-inline-start:1px solid var(--line-2,#EEEAE0)}.hm-facts div:first-child{border-inline-start:0;padding-inline-start:0}' +
'.hm-facts dt{font-size:12.5px;color:var(--ink-3,#5F6D63)}.hm-facts dd{margin:0;font-size:22px;font-weight:600;font-variation-settings:"HEXP" 40;line-height:1.35;font-variant-numeric:tabular-nums}' +
'.hm-facts dd small{font-size:12.5px;font-weight:500;color:var(--ink-3,#5F6D63);font-variation-settings:normal}' +
'.hm-rows{display:grid}.hm-r{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line-2,#EEEAE0)}.hm-r:first-child{border-top:0}' +
'.hm-r .m{flex:1;min-width:0}.hm-r .m b{display:block;font-weight:500;font-size:14.5px;line-height:1.45}.hm-r .m small{display:block;color:var(--ink-3,#5F6D63);font-size:12.5px}' +
'.hm-r .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--brand-tint,#E7EFE6);color:var(--brand);font-size:18px;flex:none}' +
'.hm-r .n{min-width:28px;height:24px;border-radius:7px;display:grid;place-items:center;font-size:12.5px;font-weight:600;background:var(--warn-bg,#FBF1DC);color:var(--warn,#8A5A00);padding:0 7px}' +
'.hm-sev{border-inline-start:3px solid var(--line);padding-inline-start:12px}.hm-sev.error{border-color:var(--bad)}.hm-sev.warn{border-color:var(--s2)}.hm-sev.info{border-color:var(--s3)}' +
'.hm-mini{height:32px;padding:0 12px;border-radius:6px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink);cursor:pointer}.hm-mini:hover{border-color:var(--input,#8F8878)}' +
'.hm-clock{background:var(--pine);color:#F2EEE4;border-color:var(--pine);position:relative;overflow:hidden}' +
'.hm-clock::after{content:"";position:absolute;inset:auto -40px -60px auto;width:220px;height:220px;border-radius:50%;border:1px solid rgba(159,224,174,.18);box-shadow:0 0 0 30px rgba(159,224,174,.05),0 0 0 60px rgba(159,224,174,.035);pointer-events:none}' +
'.hm-clock h2{color:#AFC0AD;font-weight:500;font-size:13.5px}.hm-clock h2 > i{color:#9FE0AE}.hm-clock .t{font-size:clamp(28px,7.5vw,38px);white-space:nowrap;font-weight:600;line-height:1.2;font-variation-settings:"HEXP" 70;margin:6px 0 2px;font-variant-numeric:tabular-nums}' +
'.hm-clock small{color:#AFC0AD;font-size:13px}.hm-clock .go{margin-top:16px;height:44px;padding:0 18px;border-radius:8px;border:0;background:#F2EEE4;color:#1C2A1F;font-weight:600;font-size:15px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;position:relative;z-index:1}' +
'.hm-clock .go:hover{background:#fff}.hm-clock .go:focus-visible{outline:2px solid #9FE0AE;outline-offset:2px}' +
'.hm-big{display:flex;align-items:baseline;gap:8px;margin:6px 0 10px}.hm-big b{font-size:clamp(26px,7vw,34px);font-weight:600;font-variation-settings:"HEXP" 70;font-variant-numeric:tabular-nums;line-height:1.1}.hm-big span{color:var(--ink-3,#5F6D63)}' +
'.hm-bar{height:8px;border-radius:4px;background:var(--well,#F6F3EC);overflow:hidden}.hm-bar i{display:block;height:100%;background:var(--s1);border-radius:4px}' +
'.hm-btn{height:40px;padding:0 16px;border-radius:8px;border:1px solid var(--brand);background:var(--brand);color:var(--on-brand,#fff);font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer}.hm-btn:hover{filter:brightness(.93)}' +
'.hm-banner{margin-bottom:18px}.hm-scope{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22)}' +
'.hm-scope button{height:34px;padding:0 14px;border-radius:999px;border:0;background:none;color:#fff;font:inherit;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer}' +
'.hm-scope button[aria-pressed="true"]{background:#fff;color:#1D5E3A;box-shadow:0 6px 14px -8px rgba(0,0,0,.4)}.hm-scope i{font-size:17px}' +
// KPI rows: a quiet heading, then four tiles; each tile: icon, label, big number, change pill and sparkline, footnote
'body .hm-rowh{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;margin:2px 2px 10px;color:var(--ink);font-size:16px;line-height:1.4;font-weight:700}.hm-rowh i{font-size:17px;color:var(--brand)}.hm-rowh small{color:var(--ink-3);font-weight:500;margin-inline-start:4px;font-size:12px}.hm-rowh small::before{content:"· "}' +
'.hm-rowset{display:grid;gap:18px}' +
'.hm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}' +
'.hm-k{position:relative;overflow:hidden;background:var(--card);border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(15,28,20,.05),0 8px 24px -14px rgba(15,28,20,.18);display:flex;flex-direction:column;gap:4px;min-width:0}' +
'.hm-k > *{position:relative;z-index:1}' +
'.hm-k .ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-size:22px;margin-bottom:4px}' +
'.hm-k .lb{color:var(--ink-3);font-size:13px;font-weight:500}.hm-k .v{font-family:var(--f-num,Manrope,sans-serif);font-size:30px;font-weight:800;line-height:1.1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.hm-k .v small{font-size:13px;font-weight:600;color:var(--ink-3);letter-spacing:0;margin-inline-start:4px}' +
'.hm-k > small{color:var(--ink-3);font-size:12px}' +
'.hm-k::after{content:"";position:absolute;inset-inline-end:-26px;top:-30px;width:100px;height:100px;border-radius:50%;opacity:.5;z-index:0}' +
'.hm-k.k-g .ic{background:var(--ok-bg);color:var(--ok)}.hm-k.k-g::after{background:var(--ok-bg)}.hm-k.k-y .ic{background:var(--warn-bg);color:var(--warn)}.hm-k.k-y::after{background:var(--warn-bg)}' +
'.hm-k.k-b .ic{background:var(--info-bg);color:var(--info)}.hm-k.k-b::after{background:var(--info-bg)}.hm-k.k-r .ic{background:var(--bad-bg);color:var(--bad)}.hm-k.k-r::after{background:var(--bad-bg)}' +
'.hm-k.k-g{--t-fg:var(--ok)}.hm-k.k-y{--t-fg:var(--warn)}.hm-k.k-b{--t-fg:var(--info)}.hm-k.k-r{--t-fg:var(--bad)}' +
'.hm-k .db-tf{margin-top:auto;padding-top:6px}.hm-k .db-ring{margin-inline-start:auto}' +
'.hm-k .sk{margin:4px 0}' +
// month strip: one square per day, status by colour AND a mark (dot, ring, cross), legend in words
'.hm-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(32px,1fr));gap:6px}' +
'.hm-d{aspect-ratio:1;border-radius:8px;display:grid;place-items:center;font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums;background:var(--well);color:var(--ink-3);position:relative;cursor:default}' +
'.hm-d.p{background:var(--ok-bg);color:var(--ok)}.hm-d.l{background:var(--warn-bg);color:var(--warn)}.hm-d.a{background:var(--bad-bg);color:var(--bad)}.hm-d.v{background:var(--info-bg);color:var(--info)}' +
'.hm-d.l::after{content:"";position:absolute;top:4px;inset-inline-end:4px;width:5px;height:5px;border-radius:50%;background:currentColor}' +
'.hm-d.a::after{content:"";position:absolute;inset:auto 6px 4px;height:2px;border-radius:1px;background:currentColor}' +
'.hm-d.today{box-shadow:0 0 0 2px var(--brand)}' +
'.hm-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;font-size:12px;color:var(--ink-2)}.hm-legend span{display:inline-flex;align-items:center;gap:6px}.hm-legend i{width:12px;height:12px;border-radius:4px;display:inline-block}' +
'.hm-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
'.hm-q{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;text-align:start;transition:border-color var(--mo-base,.18s),transform var(--mo-fast,.12s) var(--ease-out,ease-out)}' +
'.hm-q .qi{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:21px;background:var(--brand-tint);color:var(--brand)}' +
'.hm-q:hover{border-color:var(--input)}.hm-q:active{transform:scale(.97)}' +
'@media (max-width:1100px){.hm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
'@media (max-width:900px){.hm-kpis{gap:12px}.hm-k{padding:14px}.hm-k .v{font-size:25px}.hm-k .ic{width:36px;height:36px;font-size:19px}.hm-k .db-spark{width:72px}}' +
'@media (max-width:1100px){.hm-s4,.hm-s5,.hm-s7,.hm-s8{grid-column:1 / -1}.hm-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.hm-facts div:nth-child(3){border-inline-start:0;padding-inline-start:0}}' +
'@media (max-width:900px){.hm-hero{grid-template-columns:1fr;justify-items:center}.hm-hero > div{justify-self:stretch}.hm-ph h1{font-size:25px}}' +
'@media (max-width:380px){.hm-k .db-tf{flex-direction:column;align-items:flex-start}.hm-k .db-spark{margin-inline-start:0}}';
css += '' +
'.fd-wrap{display:grid;gap:14px;max-width:760px;margin:0 auto}' +
'.fd-today{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:thin}' +
'.fd-pp{flex:none;width:76px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;font-size:12px;color:var(--ink-2)}' +
'.fd-ring{width:62px;height:62px;border-radius:50%;padding:3px;background:conic-gradient(var(--brand),#C9A45C,var(--brand))}' +
'.fd-ring.away{background:var(--line)}.fd-ring span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:var(--card);border:2px solid var(--card);font-weight:700;color:var(--brand);font-size:17px}' +
'.fd-pp b{font-weight:600;color:var(--ink);max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'.fd-card{background:var(--card);border:1px solid var(--line-2,var(--line));border-radius:18px;padding:14px 16px 8px;box-shadow:0 1px 2px rgba(15,23,18,.04)}' +
'.fd-card.fd-in{animation:fdIn .45s var(--ease) both;animation-delay:calc(var(--i,0) * 50ms)}' +
'@keyframes fdIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
'.fd-hd{display:flex;gap:10px;align-items:center}.fd-av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--brand-tint,#E7EFE6);color:var(--brand);font-weight:700;flex:none}' +
'.fd-av.ic{font-size:21px}.fd-hd b{display:block;font-weight:600}.fd-hd small{display:block;color:var(--ink-3,#7B877F);font-size:12.5px}' +
'.fd-tag{margin-inline-start:auto;font-size:11.5px;font-weight:600;border-radius:999px;padding:3px 9px;background:var(--well,#F6F3EC);color:var(--ink-2)}' +
'.fd-bd{margin:10px 2px 6px;white-space:pre-wrap;line-height:1.6}.fd-bd h4{margin:0 0 4px;font-size:15.5px}' +
'.fd-hero{display:flex;align-items:center;gap:12px;margin:10px 0 6px;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--brand-tint,#E7EFE6),transparent)}.fd-hero i{font-size:30px;color:var(--brand)}' +
'.fd-sum{display:flex;justify-content:space-between;align-items:center;color:var(--ink-3,#7B877F);font-size:12.5px;padding:4px 2px;min-height:24px}' +
'.fd-sum .fd-ics{display:inline-flex;gap:0}.fd-sum .fd-ics i{width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;font-size:12px;color:#fff;background:var(--brand);border:2px solid var(--card);margin-inline-start:-5px}' +
'.fd-bar{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line-2,var(--line));margin-top:4px;padding-top:4px}' +
'.fd-r{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;border:0;background:none;border-radius:10px;color:var(--ink-2);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background-color .15s,color .15s}' +
'.fd-r:hover{background:var(--well,#F6F3EC)}.fd-r i{font-size:18px;transition:transform .25s var(--ease)}.fd-r[aria-pressed="true"]{color:var(--brand)}.fd-r[aria-pressed="true"] i{transform:scale(1.15)}' +
'.fd-r:focus-visible{outline:2px solid var(--brand);outline-offset:2px}' +
'.fd-r.fd-pop i{animation:fdPop .45s var(--ease)}@keyframes fdPop{0%{transform:scale(.6)}50%{transform:scale(1.45) rotate(-8deg)}100%{transform:scale(1.15)}}' +
'.fd-r .fd-burst{position:absolute;inset:0;pointer-events:none}.fd-burst b{position:absolute;left:50%;top:50%;width:6px;height:6px;border-radius:50%;background:var(--brand);opacity:0;animation:fdB .6s ease-out forwards}' +
'@keyframes fdB{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)))}}' +
'.fd-sk{background:var(--card);border:1px solid var(--line-2,var(--line));border-radius:18px;padding:16px;display:grid;gap:10px}.fd-sk .sk{height:12px}.fd-sk .sk.c{width:42px;height:42px;border-radius:50%}' +
'@media (max-width:640px){.fd-r span{display:none}.fd-card{border-radius:14px;padding:12px 12px 6px}}' +
'@media (prefers-reduced-motion:reduce){.fd-card.fd-in,.fd-r.fd-pop i,.fd-burst b{animation:none!important}}';
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

function render(main){
  var company = companyRole(), scope = S.homeScope === 'feed' ? 'feed' : company ? (S.homeScope || 'company') : 'mine';
  var h = new Date(Date.now() + 180 * 60000).getUTCHours();
  main.innerHTML = '<div class="page v2"><header class="v3-hero hm-banner"><span class="v3-hero-ic">' + ph(h < 12 ? 'sun-horizon' : h < 17 ? 'sun' : 'moon-stars', 'duotone') + '</span><div><h1>' + greet() + '</h1><p>' + dateLine() + '</p></div>' +
    '<div class="v3-hero-stats"><div class="hm-scope" role="group">' + (company ? '<button type="button" data-sc="company" aria-pressed="' + (scope === 'company') + '">' + ph('buildings', 'duotone') + t('hmCompany') + '</button>' : '') + '<button type="button" data-sc="mine" aria-pressed="' + (scope === 'mine') + '">' + ph('user', 'duotone') + t('hmMine') + '</button><button type="button" data-sc="feed" aria-pressed="' + (scope === 'feed') + '">' + ph('newspaper', 'duotone') + t('fdTab') + '</button></div></div></header>' +
    '<div id="hmBody"></div></div>';
  $$('[data-sc]', main).forEach(function(b){ b.onclick = function(){
    if (b.getAttribute('aria-pressed') === 'true') return;
    S.homeScope = b.dataset.sc; $$('[data-sc]', main).forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    var body = $('#hmBody', main); body.classList.remove('mo-sub'); void body.offsetWidth;
    if (!moReduced()) { body.classList.add('mo-sub'); body.style.setProperty('--mo-dir', String((b.dataset.sc === 'mine' ? 1 : -1) * (S.lang === 'ar' ? -1 : 1))); }
    var ord = { company: 0, mine: 1, feed: 2 };
    if (!moReduced()) body.style.setProperty('--mo-dir', String((ord[b.dataset.sc] > ord[scope] ? 1 : -1) * (S.lang === 'ar' ? -1 : 1)));
    scope = b.dataset.sc;
    if (b.dataset.sc === 'company') companyHome(body); else if (b.dataset.sc === 'feed') feedHome(body); else myHome(body);
  }; });
  var body = $('#hmBody', main);
  if (scope === 'company') companyHome(body); else if (scope === 'feed') feedHome(body); else myHome(body);
}

// ---------------- feed (design choice: social-feed patterns) ----------------
var FD_ICON = { like: 'thumbs-up', celebrate: 'confetti', support: 'hand-heart', insightful: 'lightbulb' };
var FD_KIND = { announcement: 'megaphone', kudos: 'hands-clapping', joiner: 'user-plus', anniversary: 'cake', training: 'graduation-cap' };
function fdName(e){ return e ? esc(S.lang === 'en' && e.nameEn ? e.nameEn : e.name) : ''; }
function fdAgo(iso){
  var ms = Date.now() - Date.parse(iso); if (isNaN(ms)) return '';
  var m = Math.round(ms / 60000), rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(S.lang === 'en' ? 'en' : 'ar', { numeric: 'auto' }) : null;
  if (!rtf) return new Date(iso).toLocaleDateString(LOCALE());
  if (m < 60) return rtf.format(-Math.max(1, m), 'minute');
  if (m < 1440) return rtf.format(-Math.round(m / 60), 'hour');
  if (m < 43200) return rtf.format(-Math.round(m / 1440), 'day');
  return new Date(iso).toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short' });
}
function fdSkel(n){ var h = ''; for (var i = 0; i < n; i++) h += '<div class="fd-sk" aria-hidden="true"><div style="display:flex;gap:10px;align-items:center"><span class="sk c"></span><div style="flex:1;display:grid;gap:6px"><span class="sk" style="width:40%"></span><span class="sk" style="width:25%"></span></div></div><span class="sk" style="width:90%"></span><span class="sk" style="width:70%"></span></div>'; return h; }
function fdToday(td){
  var pp = [];
  (td.away || []).forEach(function(e){ pp.push({ e: e, cls: 'away', lab: t('fdAway') }); });
  (td.joiners || []).forEach(function(e){ pp.push({ e: e, cls: '', lab: t('fdJoin') }); });
  (td.anniversaries || []).forEach(function(e){ pp.push({ e: e, cls: '', lab: t('fdAnv') }); });
  if (!pp.length) return '<p class="hr-hint" style="margin:0">' + t('fdNoToday') + '</p>';
  return '<div class="fd-today" role="list" aria-label="' + t('fdToday') + '">' + pp.map(function(x){ return '<div class="fd-pp" role="listitem"><div class="fd-ring ' + x.cls + '"><span>' + esc(initials(x.e.name)) + '</span></div><b>' + fdName(x.e) + '</b><small>' + x.lab + '</small></div>'; }).join('') + '</div>';
}
function fdBody(x){
  var L = function(ar, en){ return esc(S.lang === 'en' && en ? en : ar || ''); };
  if (x.kind === 'announcement') return '<div class="fd-bd"><h4>' + L(x.title, x.titleEn) + '</h4>' + L(x.body, x.bodyEn) + '</div>';
  if (x.kind === 'kudos') return '<div class="fd-bd">' + esc(x.body || '') + '</div>';
  if (x.kind === 'joiner') return '<div class="fd-hero">' + ph('hand-waving', 'duotone') + '<div><b>' + fdName(x.who) + '</b> ' + t('fdJoined') + (x.position ? '<br><small>' + esc(x.position) + '</small>' : '') + '</div></div>';
  if (x.kind === 'anniversary') return '<div class="fd-hero">' + ph('confetti', 'duotone') + '<div><b>' + fdName(x.who) + '</b><br>' + (x.years === 1 ? t('fdYear1') : t('fdYears').replace('{n}', x.years)) + '</div></div>';
  if (x.kind === 'training') return '<div class="fd-bd"><h4>' + L(x.title, x.titleEn) + '</h4>' + t('fdTrainFrom') + ' ' + esc(x.from) + (x.location ? ' · ' + esc(x.location) : '') + '</div>';
  return '';
}
function fdHead(x){
  var who = x.kind === 'kudos' ? fdName(x.from) + ' ' + t('fdThanks') + ' ' + fdName(x.to) : x.who ? fdName(x.who) : t('fdk_' + x.kind);
  var avh = x.kind === 'kudos' && x.from ? '<span class="fd-av">' + esc(initials(x.from.name)) + '</span>' : x.who ? '<span class="fd-av">' + esc(initials(x.who.name)) + '</span>' : '<span class="fd-av ic">' + ph(FD_KIND[x.kind] || 'note', 'duotone') + '</span>';
  return '<div class="fd-hd">' + avh + '<div><b>' + who + '</b><small>' + fdAgo(x.at) + '</small></div><span class="fd-tag">' + (x.pinned ? ph('push-pin') + ' ' : '') + t('fdk_' + x.kind) + '</span></div>';
}
function fdSum(x, reacts){
  var tot = 0, ics = '';
  reacts.forEach(function(k){ var n = x.reactions[k] || 0; tot += n; if (n) ics += ph(FD_ICON[k], 'fill'); });
  if (!tot) return '<div class="fd-sum"></div>';
  var shown = (x.reactors || []).slice(0, 2), names = shown.map(esc).join(S.lang === 'en' ? ', ' : '، '), more = tot - shown.length;
  return '<div class="fd-sum"><span><span class="fd-ics" aria-hidden="true">' + ics + '</span> ' + names + (names && more > 0 ? ' ' + t('fdAndOthers').replace('{n}', more) : '') + '</span><span class="num">' + tot + '</span></div>';
}
function fdCard(x, i, reacts){
  return '<article class="fd-card fd-in" style="--i:' + Math.min(i, 8) + '" data-k="' + esc(x.key) + '">' + fdHead(x) + fdBody(x) + '<div data-sum>' + fdSum(x, reacts) + '</div>' +
    '<div class="fd-bar" role="group" aria-label="' + t('fdReactOn') + '">' + reacts.map(function(k){ return '<button type="button" class="fd-r" data-r="' + k + '" aria-pressed="' + (x.mine === k) + '" aria-label="' + t('fdr_' + k) + '">' + ph(FD_ICON[k], x.mine === k ? 'fill' : '') + '<span>' + t('fdr_' + k) + '</span></button>'; }).join('') + '</div></article>';
}
function fdBurst(b){
  if (moReduced()) return;
  var w = document.createElement('span'); w.className = 'fd-burst';
  for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, d = document.createElement('b'); d.style.setProperty('--dx', Math.round(Math.cos(a) * 22) + 'px'); d.style.setProperty('--dy', Math.round(Math.sin(a) * 22) + 'px'); w.appendChild(d); }
  b.appendChild(w); setTimeout(function(){ w.remove(); }, 650);
}
function feedHome(el){
  el.innerHTML = '<div class="fd-wrap">' + fdSkel(3) + '</div>';
  api('feed', {}, true).then(function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.innerHTML = '<div class="fd-wrap"><p class="hr-bad">' + t('fdErr') + '</p></div>'; return; }
    var reacts = r.reacts || ['like', 'celebrate', 'support', 'insightful'], items = r.items, byKey = {};
    items.forEach(function(x){ byKey[x.key] = x; });
    el.innerHTML = '<div class="fd-wrap"><section class="fd-card"><div class="fd-hd" style="margin-bottom:10px"><span class="fd-av ic">' + ph('sun', 'duotone') + '</span><div><b>' + t('fdToday') + '</b></div></div>' + fdToday(r.today || {}) + '</section>' +
      (items.length ? items.map(function(x, i){ return fdCard(x, i, reacts); }).join('') : '<p class="hr-hint">' + t('fdEmpty') + '</p>') + '</div>';
    $$('.fd-r', el).forEach(function(b){ b.onclick = function(){
      var card = b.closest('.fd-card'), x = byKey[card.dataset.k], k = b.dataset.r, prev = x.mine, next = prev === k ? '' : k;
      // optimistic: show the change at once, put it back if the server refuses
      var myName = S.me ? S.me.name : '';
      var apply = function(to){ if (x.mine) x.reactions[x.mine] = Math.max(0, (x.reactions[x.mine] || 1) - 1); x.mine = to; if (to) x.reactions[to] = (x.reactions[to] || 0) + 1;
        x.reactors = (x.reactors || []).filter(function(n){ return n !== myName; }); if (to && myName) x.reactors.unshift(myName); // my own name first while I react
        $$('.fd-r', card).forEach(function(o){ var on = o.dataset.r === x.mine; o.setAttribute('aria-pressed', String(on)); o.querySelector('i').outerHTML = ph(FD_ICON[o.dataset.r], on ? 'fill' : ''); });
        card.querySelector('[data-sum]').innerHTML = fdSum(x, reacts); };
      apply(next);
      if (next) { b.classList.remove('fd-pop'); void b.offsetWidth; b.classList.add('fd-pop'); fdBurst(b); }
      api('feedReact', { key: x.key, kind: k }, true).then(function(y){ if (!y.ok) { apply(prev); toast(errText(y.error)); } });
    }; });
  });
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
  el.innerHTML = '<div class="hm-grid"><section class="hm-s12 hm-rowset" id="hmRows">' + rowsHtml(kinds, null, null) + '</section>' +
    '<section class="hm-card hm-hero hm-s12" id="hmHero">' + (V ? V.gauge(null, t('hmToday')) : '') + '<div>' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s7" id="hmDecide"><h2>' + ph('tray') + t('hmDecide') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    (canCal ? '<section class="hm-card hm-s5" id="hmCal"><h2>' + ph('shield-check') + t('hmDeadlines') + '<span class="sp"></span><button type="button" data-go="pay:compliance">' + t('hmCalendar') + '</button></h2><p class="lead">' + t('hmDeadLead') + '</p><div class="hm-rows">' + sk(3) + '</div></section>' : '') +
    '<section class="hm-card hm-s8" id="hmMove"><h2>' + ph('users-three') + t('hmMove') + '</h2><p class="lead">' + t('hmMoveLead') + '</p>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmDept"><h2>' + ph('buildings') + t('hmDepts') + '</h2>' + sk(4) + '</section></div>';
  wire(el);
  function paintRows(){ var box = $('#hmRows', el); if (box && R0) { var again = !!box.dataset.p; box.dataset.p = '1'; box.innerHTML = rowsHtml(kinds, R0, R14); if (again) still(box); V.wire(box); } }
  apiFresh('dashboard', { from: today, to: today }, function(r){
    if (!live() || !r.ok) return;
    R0 = r; paintRows();
    var A = r.attendance || {}, T0 = A.totals || {}, W = r.workforce || {}, Rq = r.requests || {}, C = r.cost || {};
    var rate = T0.attendanceRate, pend = Rq.pending || {}, open = (pend.manager || 0) + (pend.hr || 0) + (pend.payroll || 0);
    var last = C.trend && C.trend.length ? C.trend[C.trend.length - 1] : null;
    var sent = t('hmTodaySentence').replace('{p}', V.n1(T0.present || 0, 0)).replace('{e}', V.n1(T0.expected || 0, 0)).replace('{l}', V.n1(T0.late || 0, 0)).replace('{v}', V.n1(T0.leave || 0, 0));
    if (!$('#hmHero', el)) return;
    $('#hmHero', el).innerHTML = V.gauge(rate == null ? null : Math.round(rate), t('hmToday')) + '<div><h2>' + t('hmToday') + '</h2><p class="big">' + sent + '</p><dl class="hm-facts">' +
      '<div><dt>' + t('hmHeadcount') + '</dt><dd>' + V.n1(W.headcount, 0) + '</dd></div><div><dt>' + t('hmSaudi') + '</dt><dd>' + V.n1(W.saudiPct) + '%' + (W.target ? ' <small>/ ' + W.target + '%</small>' : '') + '</dd></div>' +
      '<div><dt>' + t('hmPayroll') + '</dt><dd>' + (r.money && last ? V.n1(last.cost / 1000, 0) + 'K <small>' + V.monthShort(last.month) + '</small>' : '-') + '</dd></div><div><dt>' + t('hmOpenReq') + '</dt><dd>' + V.n1(open, 0) + (Rq.openOver3Days ? ' <small>' + Rq.openOver3Days + ' &gt; 3 ' + t('dbDays') + '</small>' : '') + '</dd></div></dl></div>';
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
  el.innerHTML = '<div class="hm-grid">' + (mgr ? '<section class="hm-s12" id="hmTeamRow">' + teamRow(D) + '</section>' : '') +
    '<section class="hm-s12" id="hmMineRow">' + mineRow(D) + '</section>' +
    '<section class="hm-card hm-clock hm-s5"><h2>' + ph('clock') + t('hmShift') + '</h2><div class="t"><bdi dir="ltr">' + esc(sh.start || '--:--') + ' – ' + esc(sh.end || '--:--') + '</bdi></div><small>' + status + '</small><br>' +
      '<button type="button" class="go" data-go="time:punch">' + ph('fingerprint') + (next === 'out' ? t('hmCheckOut') : t('hmCheckIn')) + '</button></section>' +
    '<section class="hm-card hm-s7" id="hmTasks"><h2>' + ph('bell') + t('hmMyTasks') + '<span class="sp"></span><button type="button" data-open-tasks>' + t('hmAllTasks') + '</button></h2><div class="hm-rows">' + sk(3) + '</div></section>' +
    '<section class="hm-card hm-s8" id="hmMonth"><h2>' + ph('calendar-check') + t('hmMonthStrip') + '</h2><p class="lead">' + t('hmMonthLead') + '</p>' + sk(2) + '</section>' +
    '<section class="hm-card hm-s4" id="hmQuick"><h2>' + ph('lightning') + t('hmQuick') + '</h2><p class="lead">' + t('hmQuickLead') + '</p><div class="hm-quick">' +
      [['leave', 'airplane-tilt', 'requests:new:leave'], ['letter', 'envelope-simple', 'requests:new:letter'], ['expense', 'receipt', 'requests:claim'], ['correction', 'fingerprint-simple', 'requests:new:correction']].map(function(q){
        var d = V.goOk(q[2]); return d ? '<button type="button" class="hm-q" data-go="' + d + '"><span class="qi">' + ph(q[1], 'duotone') + '</span>' + t('hmQ_' + q[0]) + '</button>' : ''; }).join('') + '</div></section></div>';
  wire(el);
  var pq = 0;
  function paint(){ if (pq) return; pq = requestAnimationFrame(function(){ pq = 0; if (!live()) return;
    [['#hmMineRow', mineRow], ['#hmTeamRow', teamRow]].forEach(function(x){ var box = $(x[0], el); if (!box) return; var again = !!box.dataset.p; box.dataset.p = '1'; box.innerHTML = x[1](D); if (again) still(box); V.wire(box); });
  }); }
  var month = riyadhToday().slice(0, 7);
  apiFresh('myTasks', {}, function(r){ if (!live() || !r.ok) return; D.tasks = r; tasksPaint($('#hmTasks .hm-rows', el), r, false); paint(); }, true);
  apiFresh('myHistory', {}, function(r){ if (!live() || !r.ok) return; D.hist = r; paint(); monthStrip($('#hmMonth', el), r); }, true);
  apiFresh('myHistory', { month: prevMonth(month) }, function(r){ if (!live() || !r.ok) return; D.prev = r; paint(); }, true);
  apiFresh('myRequests', {}, function(r){ if (!live() || !r.ok) return; D.leave = r; paint(); }, true);
  apiFresh('mySlips', {}, function(r){ if (!live() || !r.ok) return; D.slips = r; paint(); }, true);
  if (mgr) {
    apiFresh('hrTeam', {}, function(r){ if (!live() || !r.ok) return; D.team = r; paint(); }, true);
    apiFresh('leaveTeam', {}, function(r){ if (!live() || !r.ok) return; D.teamLeave = r; paint(); }, true);
  }
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
    return '<span class="hm-d ' + c + (d.date === today ? ' today' : '') + '" role="img" tabindex="0" aria-label="' + esc(lbl) + '" data-tip="' + esc(lbl) + '">' + (+d.date.slice(8, 10)) + '</span>';
  }).join('');
  var legend = [['p', 'ok'], ['l', 'warn'], ['a', 'bad'], ['v', 'info']].map(function(x){ return '<span><i style="background:var(--' + x[1] + '-bg);box-shadow:inset 0 0 0 1.5px var(--' + x[1] + ')"></i>' + word[x[0]] + '</span>'; }).join('');
  box.innerHTML = '<h2>' + ph('calendar-check') + t('hmMonthStrip') + '<span class="sp"></span>' + (V.goOk('time:history') ? '<button type="button" class="db-open" data-go="time:history">' + t('dbOpen') + ph(S.lang === 'ar' ? 'arrow-up-left' : 'arrow-up-right') + '</button>' : '') + '</h2><p class="lead">' + t('hmMonthLead') + '</p>' +
    (days.length ? '<div class="hm-days">' + cells + '</div><div class="hm-legend">' + legend + '</div>' : V.empty(null, 'calendar-blank'));
  V.wire(box);
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
