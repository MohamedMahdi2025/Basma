// Payroll (Phase 3): the HR console section, and the payslip shared with "ملفي".
// Amounts come from the server (Payroll.gs); this file only shows, collects and prints.
(function(){
'use strict';

var L = {
  ar: { arrears:'فروقات بأثر رجعي', basic:'الراتب الأساسي', housing:'بدل السكن', transport:'بدل النقل', allowance:'بدل', overtime:'عمل إضافي', bonus:'مكافأة', commission:'عمولة', other_earning:'استحقاق آخر', reimbursement:'تعويض مصروفات', per_diem:'بدل انتداب',
    unpaid_leave:'إجازة بدون راتب', sick_75:'إجازة مرضية بثلاثة أرباع الأجر', sick_unpaid:'إجازة مرضية بدون أجر', absence:'غياب', late:'دقائق التأخير',
    gosi:'التأمينات الاجتماعية', advance:'قسط سلفة', fine:'جزاء', other_deduction:'خصم آخر', overtime_hours:'ساعات عمل إضافي' },
  en: { arrears:'Retro pay (arrears)', basic:'Basic salary', housing:'Housing allowance', transport:'Transport allowance', allowance:'Allowance', overtime:'Overtime', bonus:'Bonus', commission:'Commission', other_earning:'Other earning', reimbursement:'Expense reimbursement', per_diem:'Travel per diem',
    unpaid_leave:'Unpaid leave', sick_75:'Sick leave at 75%', sick_unpaid:'Unpaid sick leave', absence:'Absence', late:'Minutes late',
    gosi:'GOSI (employee share)', advance:'Advance instalment', fine:'Fine', other_deduction:'Other deduction', overtime_hours:'Overtime hours' }
};
Object.assign(T.ar, {
  pdTitle:'الرواتب في لمحة', pdLastNet:'صافي آخر مسير', pdDrafts:'مسيرات بانتظار الاعتماد', pdDraftsNote:'يعتمدها شخص غير الذي أعدها', pdTrend:'صافي الرواتب شهرا بشهر',
  pdRunTitle:'تحليل المسير', pdEarn:'مكونات الإجمالي', pdDed:'الخصومات', pdDept:'الصافي حسب الإدارة', pdWarn:'قسائم عليها ملاحظات',
  psCost:'تكلفة الشركة', psCostTitle:'تكلفة الشركة عن هذا الشهر', psGosiEr:'التأمينات (حصة الشركة)', psEos:'مخصص مكافأة نهاية الخدمة', psYears:'{y} سنة خدمة',
  psEosFull:'شهر عن كل سنة', psEosHalf:'نصف شهر عن كل سنة', psGosiDiff:'أجر التأمينات المسجل {r} يختلف عن الأساسي والسكن {p}. الاشتراكات محسوبة على الأجر المسجل.', psLate:'دقائق التأخير', psOt:'ساعات إضافية',
  psItem:'البند', psAmount:'المبلغ (ر.س)', psPeriod:'فترة الراتب', psBank:'البنك والحساب', psEmployee:'بيانات الموظف', psName:'الاسم', psPosition:'الوظيفة', psDept:'الإدارة', psId:'رقم الهوية',
  psGosiBase:'أجر الاشتراك', psCohort:'فئة التأمينات', psAttendance:'الحضور خلال الشهر', psKind:'قسيمة راتب', psTitle:'قسيمة راتب شهر {m}', psFoot:'وثيقة صادرة من نظام الموارد البشرية. للتحقق امسح الرمز أو اذكر المرجع.',
  psSignHr:'الموارد البشرية', psSignPay:'الرواتب', psSignEmp:'توقيع الموظف بالاستلام',
  prTitle:'الرواتب', prMine:'رواتبي', prMineEmpty:'تظهر هنا قسيمة كل شهر بعد اعتماد مسير الرواتب.', prOpen:'عرض القسيمة', prPrint:'طباعة القسيمة',
  prRuns:'مسيرات الرواتب', prNew:'إعداد مسير شهر', prMonth:'الشهر', prCreate:'إعداد المسير', prEmpty:'لا توجد مسيرات بعد. ابدأ بإعداد مسير الشهر الماضي.',
  pr_draft:'مسودة', pvAdd:'الاستحقاقات', pvDedG:'الخصومات', pvCostG:'تكلفة الشركة', pvTotAdd:'إجمالي الاستحقاقات', pvTotDed:'إجمالي الخصومات', pvDays:'أيام العمل', pvAll:'كل الموظفين', pvAnalysis:'تحليل المسير', pvStaff:'موظفو المسير', pvNew:'تجهيز مسير جديد', pvNewLead:'اختر الشهر ومجموعة الرواتب ثم احسب المسير.', pvRuns:'المسيرات', pvMonthTot:'صافي الشهر', ptNo:'الرقم', ptDept:'الإدارة / مركز التكلفة', ptShare:'النسبة من الإجمالي', ptGosiEr:'تأمينات الشركة', ptCost:'تكلفة الشركة', ptDedRate:'من الإجمالي', ptSearch:'ابحث بالاسم أو الرقم', ptAllDept:'كل الإدارات', ptTotal:'الإجمالي', ptOpen:'عرض قسيمة الراتب', ptShown:'معروض', ptOf:'من', ptByDept:'حسب الإدارة', ptPeople:'موظف', ptNone:'لا نتائج', pr_locked:'معتمد ومقفل', prHead:'الموظفون', prGross:'الإجمالي', prDed:'الاستقطاعات', prNet:'الصافي', prGosiEr:'تأمينات على الشركة', prWarn:'ملاحظات',
  prPrepared:'أعده', prApprovedBy:'اعتمده', prRecalc:'إعادة الحساب', prApprove:'اعتماد وقفل المسير', prDelete:'حذف المسودة', prExport:'ملف البنك وحماية الأجور (Excel)',
  prEmail:'إرسال القسائم بالبريد', prEmailed:'أرسلت القسائم', prEmailNo:'البريد غير مفعل بعد. يحتاج موافقة مسؤول Microsoft 365 على صلاحية الإرسال (Mail.Send)، ثم نربط الحساب.',
  prApproveHint:'يعتمده شخص لديه صلاحية الرواتب غير الذي أعده. بعد الاعتماد تظهر القسائم للموظفين ولا يمكن تعديل المسير.',
  prAdj:'إضافات وخصومات هذا الشهر', prAdjAdd:'إضافة بند', prAdjEmp:'الموظف', prAdjCode:'البند', prAdjAmount:'المبلغ أو الساعات', prAdjReason:'السبب', prAdjNone:'لا بنود.',
  prDays:'أيام مدفوعة', prAbsent:'أيام غياب', prLeaveBal:'رصيد الإجازة', prEarnings:'الاستحقاقات', prDeductions:'الاستقطاعات', prRef:'المرجع', prIban:'الحساب',
  prEos:'مكافأة نهاية الخدمة', prEosEmp:'الموظف', prEosLast:'آخر يوم عمل', prEosReason:'سبب انتهاء العلاقة', prEosCalc:'احسب',
  eos_resignation:'استقالة', eos_termination:'إنهاء من الشركة', eos_contract_end:'انتهاء العقد', eos_art87:'حالات المادة 87 (مكافأة كاملة)', eos_art80:'فصل حسب المادة 80 (بلا مكافأة)',
  eos_art81:'ترك العمل لإخلال صاحب العمل (المادة 81)', eos_art87_force_majeure:'قوة قاهرة (المادة 87)', eos_art87_marriage:'موظفة خلال 6 أشهر من الزواج (المادة 87)',
  eos_art87_childbirth:'موظفة خلال 3 أشهر من الولادة (المادة 87)', prEosPrint:'طباعة المخالصة', prEosService:'مدة الخدمة', prEosPeriod:'من - إلى', prEosExcluded:'إجازة بدون راتب لا تحتسب',
  prEosBasisT:'الأجر الإجمالي', prEosBasisBH:'الأساسي والسكن', prEosFirst5:'السنوات الخمس الأولى: نصف شهر عن كل سنة', prEosAfter5:'ما بعدها: شهر عن كل سنة',
  prEosSettlement:'المخالصة النهائية', prEosLastMonth:'أيام الشهر الأخير', prEosLastLocked:'مدفوعة في مسير معتمد', prEosAdvances:'سلف غير مسددة', prEosNet:'صافي المستحق',
  prEosDue:'يدفع في موعد أقصاه',
  prEosYears:'مدة الخدمة', prEosWage:'الأجر المعتمد للحساب', prEosFull:'المكافأة الكاملة', prEosFactor:'النسبة المستحقة', prEosAward:'المكافأة المستحقة', prEosLeave:'بدل رصيد الإجازة', prEosTotal:'الإجمالي المستحق', prYears:'سنة',
  pw_no_iban:'لا يوجد آيبان', pw_no_package:'لا يوجد راتب معتمد', pw_gosi_cohort_missing:'فئة التأمينات غير محددة', pw_fine_capped:'الجزاء خفض إلى 5 أيام', pw_advance_deferred:'أجل جزء من السلفة (50%)',
  pw_deductions_capped:'خفضت الخصومات إلى نصف الأجر', pw_gosi_housing_zero:'لا بدل سكن نقدي: إن كان السكن عينيا يحسب للتأمينات بأجر شهرين أساسي سنويا', pw_gosi_gcc_national:'مواطن خليجي: تطبق نسب بلده (مد الحماية التأمينية)', pw_eos_basis_below_actual:'المكافأة حسبت على الأجر الفعلي (المادة 84)؛ إعداد الأساسي والسكن أقل من النظام', pw_net_negative:'الصافي سالب', e_run_exists:'يوجد مسير لهذا الشهر.', e_future_month:'لا يمكن إعداد مسير لشهر لم يأت.',
  e_month_locked:'مسير هذا الشهر معتمد ومقفل. أضف البند في الشهر التالي.', e_email_not_configured:'البريد غير مفعل بعد.', e_missing_hire_date:'تاريخ المباشرة غير مسجل.',
  prRecalcDone:'أعيد الحساب', prApproved:'اعتمد المسير وأقفل', prGosiNote:'حصة الشركة في التأمينات',
  prSureLock:'اضغط مرة أخرى للاعتماد والقفل، ولا يمكن التراجع', prSureDel:'اضغط مرة أخرى لحذف المسودة',
  prTitlePrep:'إعداد رواتب جديدة', prLeadPrep:'المسيرات قيد الإعداد فقط (مسودات). بعد الاعتماد والقفل ينتقل المسير إلى صفحة المسيرات المعتمدة.', prEmptyPrep:'لا يوجد مسير قيد الإعداد. اختر الشهر ثم أنشئ المسير.',
  prTitleDone:'المسيرات المعتمدة', prLeadDone:'كل مسير اعتُمد وأُقفل، ومنها المستوردة من الكشوف المعتمدة. للعرض والتنزيل فقط؛ لا تتغير بعد القفل.', prEmptyDone:'لا توجد مسيرات معتمدة بعد.'
});
Object.assign(T.en, {
  pdTitle:'Payroll at a glance', pdLastNet:'Last run net', pdDrafts:'Runs awaiting approval', pdDraftsNote:'approved by someone other than the preparer', pdTrend:'Net pay month by month',
  pdRunTitle:'Run analysis', pdEarn:'What the gross is made of', pdDed:'Deductions', pdDept:'Net by department', pdWarn:'Payslips with notes',
  psCost:'Company cost', psCostTitle:'What this month cost the company', psGosiEr:'GOSI (employer share)', psEos:'End-of-service provision', psYears:'{y} years of service',
  psEosFull:'one month per year', psEosHalf:'half a month per year', psGosiDiff:'The GOSI-registered wage {r} differs from basic plus housing {p}. Contributions use the registered wage.', psLate:'Minutes late', psOt:'Overtime hours',
  psItem:'Item', psAmount:'Amount (SAR)', psPeriod:'Pay period', psBank:'Bank and account', psEmployee:'Employee', psName:'Name', psPosition:'Position', psDept:'Department', psId:'ID number',
  psGosiBase:'Contribution wage', psCohort:'GOSI group', psAttendance:'Attendance this month', psKind:'Payslip', psTitle:'Payslip for {m}', psFoot:'Issued by the HR system. To verify, scan the code or quote the reference.',
  psSignHr:'Human Resources', psSignPay:'Payroll', psSignEmp:'Employee acknowledgement',
  prTitle:'Payroll', prMine:'My payslips', prMineEmpty:'Each month\'s payslip appears here once payroll is approved.', prOpen:'View payslip', prPrint:'Print payslip',
  prRuns:'Payroll runs', prNew:'Prepare a month', prMonth:'Month', prCreate:'Prepare payroll', prEmpty:'No payroll runs yet. Start with last month.',
  pr_draft:'Draft', pvAdd:'Additions', pvDedG:'Deductions', pvCostG:'Company cost', pvTotAdd:'Total additions', pvTotDed:'Total deductions', pvDays:'Days worked', pvAll:'All staff', pvAnalysis:'Run analysis', pvStaff:'People in this run', pvNew:'Prepare a new run', pvNewLead:'Pick the month and pay group, then calculate.', pvRuns:'Runs', pvMonthTot:'Month net', ptNo:'No.', ptDept:'Department / cost centre', ptShare:'Share of total', ptGosiEr:'Employer GOSI', ptCost:'Company cost', ptDedRate:'of gross', ptSearch:'Search name or number', ptAllDept:'All departments', ptTotal:'Total', ptOpen:'Open payslip', ptShown:'Showing', ptOf:'of', ptByDept:'By department', ptPeople:'people', ptNone:'No results', pr_locked:'Approved and locked', prHead:'Employees', prGross:'Gross', prDed:'Deductions', prNet:'Net', prGosiEr:'Employer GOSI', prWarn:'Notes',
  prPrepared:'Prepared by', prApprovedBy:'Approved by', prRecalc:'Recalculate', prApprove:'Approve and lock', prDelete:'Discard draft', prExport:'Bank and WPS file (Excel)',
  prEmail:'Email payslips', prEmailed:'Payslips emailed', prEmailNo:'Email is not switched on yet. The Microsoft 365 admin must grant Mail.Send, then we connect the account.',
  prApproveHint:'Approved by a payroll person other than the preparer. Once approved, employees see their payslips and the run cannot change.',
  prAdj:'This month\'s additions and deductions', prAdjAdd:'Add line', prAdjEmp:'Employee', prAdjCode:'Item', prAdjAmount:'Amount or hours', prAdjReason:'Reason', prAdjNone:'No lines.',
  prDays:'Paid days', prAbsent:'Absent days', prLeaveBal:'Leave balance', prEarnings:'Earnings', prDeductions:'Deductions', prRef:'Ref', prIban:'Account',
  prEos:'End of service', prEosEmp:'Employee', prEosLast:'Last working day', prEosReason:'How it ends', prEosCalc:'Calculate',
  eos_resignation:'Resignation', eos_termination:'Ended by the company', eos_contract_end:'Contract end', eos_art87:'Article 87 cases (full award)', eos_art80:'Dismissal under Article 80 (no award)',
  eos_art81:'Left for the employer\'s breach (Article 81)', eos_art87_force_majeure:'Force majeure (Article 87)', eos_art87_marriage:'Woman within 6 months of marriage (Article 87)',
  eos_art87_childbirth:'Woman within 3 months of childbirth (Article 87)', prEosPrint:'Print settlement', prEosService:'Service', prEosPeriod:'From - to', prEosExcluded:'Unpaid leave not counted',
  prEosBasisT:'Total wage', prEosBasisBH:'Basic and housing', prEosFirst5:'First five years: half a month per year', prEosAfter5:'After that: a month per year',
  prEosSettlement:'Final settlement', prEosLastMonth:'Final month days', prEosLastLocked:'paid in an approved payroll', prEosAdvances:'Advances still owed', prEosNet:'Net due',
  prEosDue:'Pay no later than',
  prEosYears:'Service', prEosWage:'Wage used', prEosFull:'Full award', prEosFactor:'Share due', prEosAward:'Award due', prEosLeave:'Unused leave pay', prEosTotal:'Total due', prYears:'years',
  pw_no_iban:'No IBAN', pw_no_package:'No approved salary', pw_gosi_cohort_missing:'GOSI group not set', pw_fine_capped:'Fine cut to 5 days', pw_advance_deferred:'Part of the advance deferred (50%)',
  pw_deductions_capped:'Deductions cut to half the wage', pw_gosi_housing_zero:'No cash housing: housing in kind counts as two months basic a year for GOSI', pw_gosi_gcc_national:'GCC national: home-country GOSI rates apply (GCC extension)', pw_eos_basis_below_actual:'Award on the actual wage (Art. 84); the basic + housing setting is below the law', pw_net_negative:'Net below zero', e_run_exists:'This month already has a run.', e_future_month:'That month has not come yet.',
  e_month_locked:'This month is approved and locked. Add the line next month.', e_email_not_configured:'Email is not switched on yet.', e_missing_hire_date:'No start date on file.',
  prRecalcDone:'Recalculated', prApproved:'Payroll approved and locked', prGosiNote:'Employer GOSI share',
  prSureLock:'Tap again to approve and lock. This cannot be undone', prSureDel:'Tap again to discard the draft',
  prTitlePrep:'Prepare new payroll', prLeadPrep:'Runs being prepared only (drafts). Once approved and locked, a run moves to Approved payroll.', prEmptyPrep:'No payroll in preparation. Choose the month and create the run.',
  prTitleDone:'Approved payroll', prLeadDone:'Every approved and locked run, including those imported from the approved sheets. View and download only; they never change once locked.', prEmptyDone:'No approved payroll yet.'
});

var css = '' +
'.pt-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 10px}.pt-bar input,.pt-bar select{height:38px;border-radius:10px;border:1px solid var(--line,#E4DFD3);padding:0 12px;background:var(--card,#fff);font:inherit;font-size:14px;min-width:200px}.pt-bar .pt-count{margin-inline-start:auto;font-size:13px;color:var(--ink-2)}' +
'.pt-wrap{overflow:auto;border:1px solid var(--line,#E4DFD3);border-radius:14px;background:var(--card,#fff);max-height:70vh}' +
'.pt{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px;min-width:1080px}.pt th{position:sticky;top:0;z-index:2;background:var(--panel,#F7F4EC);color:var(--ink-2);font-weight:600;font-size:12px;text-align:start;padding:10px 12px;border-bottom:1px solid var(--line,#E4DFD3);white-space:nowrap;cursor:pointer;user-select:none}' +
'.pt th[data-k]:hover{color:var(--ink)}.pt th.on::after{content:" ↓";opacity:.7}.pt th.on.up::after{content:" ↑"}' +
'.pt td{padding:10px 12px;border-bottom:1px solid var(--line-2,#EFEBE1);vertical-align:middle;white-space:nowrap}.pt .a{text-align:end;font-variant-numeric:tabular-nums;font-feature-settings:"tnum";direction:ltr;unicode-bidi:isolate}' +
'.pt tbody tr{cursor:pointer;transition:background .12s}.pt tbody tr:hover,.pt tbody tr:focus-visible{background:rgba(var(--brand-rgb),.06);outline:none}.pt tbody tr:hover .pt-go{opacity:1}' +
'.pt .no{font-variant-numeric:tabular-nums;color:var(--ink-2);direction:ltr;unicode-bidi:isolate}.pt .nm b{font-weight:600;display:block}.pt .nm small{color:var(--ink-2);font-size:11.5px}.pt .dp{color:var(--ink-2);max-width:220px;overflow:hidden;text-overflow:ellipsis}' +
'.pt .net{font-weight:700}.pt .sub{display:block;font-size:11px;color:var(--ink-2);font-weight:400}.pt .shr{display:flex;align-items:center;gap:8px;justify-content:flex-end}.pt .shr i{display:block;height:6px;border-radius:3px;background:var(--brand);opacity:.55;min-width:2px}' +
'.pt .pt-go{opacity:.35;transition:opacity .12s;color:var(--brand)}.pt tfoot td{position:sticky;bottom:0;background:var(--panel,#F7F4EC);font-weight:700;border-top:2px solid var(--line,#E4DFD3);border-bottom:0}' +
'.pt-depts{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.pt-depts button{border:1px solid var(--line,#E4DFD3);background:var(--card,#fff);border-radius:999px;padding:5px 12px;font:inherit;font-size:12.5px;cursor:pointer}.pt-depts button.on{background:var(--brand);color:#fff;border-color:transparent}.pt-depts button b{font-variant-numeric:tabular-nums;margin-inline-start:6px;opacity:.75;font-weight:500}' +
'.pr-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}' +
'.pr-kpis .net{grid-column:1 / -1;background:var(--pine);color:var(--cream);border-radius:var(--r-m);padding:16px 16px}' +
'.pr-kpis .net span{color:var(--g-AFC0AD,#AFC0AD);font-size:13px}.pr-kpis .net b{display:block;font-size:32px;font-weight:600}' +
'.pr-slip h4{margin:14px 0 6px;font-size:14px;color:var(--ink-2);font-weight:500}' +
'.pr-slip dl{display:grid;grid-template-columns:1fr auto;margin:0}' +
'.pr-slip dt,.pr-slip dd{padding:8px 0;border-bottom:1px solid var(--line);margin:0}.pr-slip dd{text-align:end;font-variant-numeric:tabular-nums;padding-inline-start:16px}' +
'.pr-slip dt small{display:block;color:var(--ink-2);font-size:12px}' +
'.pr-slip .tot dt,.pr-slip .tot dd{font-weight:600;font-size:16px;border-bottom:0}' +
'.pr-month{display:flex;align-items:center;gap:12px;padding:12px 0;cursor:pointer}.pr-month + .pr-month{border-top:1px solid var(--line)}' +
'.pr-month .main{flex:1}.pr-month .main small{display:block;color:var(--ink-2);font-size:13px}' +
'@media (min-width:1024px){.pr-kpis{grid-template-columns:2fr 1fr 1fr 1fr 1fr}.pr-kpis .net{grid-column:auto}}' +
'.ps{display:grid;gap:16px}.ps-net{display:grid;grid-template-columns:1.3fr 1fr;border-radius:16px;overflow:hidden;box-shadow:0 10px 26px -16px rgba(var(--gr-23-63-42,23,63,42),.6)}' +
'.ps-net-main{background:linear-gradient(135deg,var(--brand-deep),var(--brand) 60%,var(--brand-lite));color:#fff;padding:16px 20px;position:relative}.ps-net-main span{display:flex;align-items:center;gap:8px;color:var(--g-D2E8DA,#D2E8DA);font-size:13px;font-weight:600}.ps-net-main span i{font-size:20px}' +
'.ps-net-main b{display:inline-block;font-family:var(--f-num,Manrope,sans-serif);font-size:32px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0;direction:ltr;unicode-bidi:isolate}.ps-net-main em{font-style:normal;margin-inline-start:6px;color:var(--g-D2E8DA,#D2E8DA);font-weight:600}' +
'.ps-net-main p{margin:6px 0 0;font-size:12px;color:var(--g-CFE5D7,#CFE5D7);line-height:1.5}.ps-net-side{margin:0;background:var(--g-F7FAF8,#F7FAF8);display:grid;align-content:center}.ps-net-side div{padding:8px 16px;border-top:1px solid var(--line-2)}.ps-net-side div:first-child{border-top:0}' +
'.ps-net-side dt{font-size:12px;color:var(--ink-3)}.ps-net-side dd{margin:0;font-weight:700;font-size:16px}' +
'.ps-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ps-box{background:#fff;border-radius:16px;padding:12px 16px;box-shadow:var(--e3)}' +
'.ps-box h4{margin:0 0 6px;font-size:14px;display:flex;align-items:center;gap:8px;font-family:var(--f-head)}.ps-box h4 i{font-size:20px}.ps-box.earn h4 i{color:#067647}.ps-box.ded h4 i{color:#B42318}.ps-box.cost h4 i{color:#3538CD}' +
'.ps-r{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line-2);font-size:14px}.ps-r:first-of-type{border-top:0}.ps-r small{display:block;color:var(--ink-3);font-size:12px}.ps-r b{font-weight:600;white-space:nowrap}' +
'.ps-r.tot{border-top:1.5px solid var(--line);font-weight:800}.ps-r.tot b{font-weight:800}.ps-box.cost .ps-r.tot{color:#3538CD}' +
'.ps-note{display:flex;gap:8px;align-items:flex-start;margin:8px 0 0;padding:8px 12px;border-radius:12px;background:#FEF0C7;color:#7A3E00;font-size:13px}.ps-note i{font-size:18px}' +
'.ps-facts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.ps-facts div{background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:var(--e1)}' +
'.ps-facts i{font-size:20px;color:var(--brand)}.ps-facts span{display:block;font-size:12px;color:var(--ink-3)}.ps-facts b{font-size:18px;font-weight:800}.ps-warn{display:flex;gap:8px;flex-wrap:wrap}' +
'@media (max-width:700px){.ps-net,.ps-cols{grid-template-columns:1fr}.ps-facts{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
'.ps-nav{display:inline-flex;gap:8px}.ps-nav .btn{width:38px;padding:0;justify-content:center}.fp-rows b.neg{color:var(--bad)}';
css += ".pv{display:grid;gap:16px;min-width:0}.pv-head h2,.pv-tt h2{margin:0;font-size:24px;font-weight:600;letter-spacing:-.01em;color:var(--ink)}.pv-head p,.pv-tt p{margin:4px 0 0;color:var(--ink-2);font-size:13px;line-height:1.6}.pv-new{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:16px;border-radius:16px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3)}.pv-new[hidden]{display:none}.pv-new-t{display:flex;align-items:center;gap:12px;flex:1 1 260px;min-width:0}.pv-new-t>i{font-size:28px;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:var(--card,#fff);color:var(--ink);box-shadow:var(--e1)}.pv-new-t b{display:block;font-size:16px;font-weight:600}.pv-new-t small{display:block;color:var(--ink-2);font-size:12px}.pv-fld{display:grid;gap:4px;font-size:12px;color:var(--ink-2)}.pv-fld[hidden]{display:none}.pv-fld input,.pv-fld select{min-height:40px;border-radius:12px;border:1px solid var(--q-hair-3,#D6D0C2);background:var(--card,#fff);padding:0 12px;font:inherit;font-size:14px;color:var(--ink)}.pv-new .btn{min-height:40px}.pv-new .err{flex-basis:100%;color:var(--bad,#B42318);font-size:13px}.pv-new .err:empty{display:none}.pv-reg{display:grid;gap:16px}.pv-month>header{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px;padding:0 4px 8px;border-bottom:1px solid var(--q-hair,#E4DFD3);margin-bottom:12px}.pv-month h3{margin:0;font-size:18px;font-weight:600}.pv-month header span{font-size:13px;color:var(--ink-2)}.pv-month header b{color:var(--ink);font-weight:700;font-size:16px;margin-inline-start:4px}.pv-runs{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.pv-run{all:unset;box-sizing:border-box;display:grid;gap:4px;padding:16px;border-radius:16px;background:var(--card,#fff);border:1px solid var(--q-hair,#E4DFD3);box-shadow:var(--e1);cursor:pointer;position:relative;transition:box-shadow .15s,transform .15s}.pv-run:hover{box-shadow:var(--e3);transform:translateY(-1px)}.pv-run:focus-visible{outline:2px solid var(--brand);outline-offset:2px}.pv-grp{font-size:16px;font-weight:600;color:var(--ink);line-height:1.5;overflow-wrap:anywhere}.pv-ref{color:var(--ink-2);font-size:12px}.pv-run .pv-st{position:static;justify-self:start;margin-bottom:4px}.pv-fig{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 0;padding-top:12px;border-top:1px solid var(--q-hair-2,#EEEAE0)}.pv-fig div{min-width:0}.pv-fig dt{font-size:11px;color:var(--ink-2)}.pv-fig dd{margin:2px 0 0;font-size:14px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;unicode-bidi:isolate}.pv-fig .pv-netf{grid-column:1/-1;display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px dashed var(--q-hair-2,#EEEAE0)}.pv-fig .pv-netf dt{font-size:13px;font-weight:600}.pv-fig .pv-netf dd{font-size:20px;font-weight:700;overflow:visible}.pv-st{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:600;vertical-align:middle;letter-spacing:0}.pv-st::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}.pv-draft{background:#FEF3D7;color:#8A5300}.pv-approved{background:#E4EEFB;color:#1F4E8C}.pv-locked{background:color-mix(in srgb,var(--ink) 8%,transparent);color:var(--ink)}.pv-cancelled{background:#FDECEA;color:#B42318}.pv-top{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.pv-tt{flex:1 1 280px;min-width:0}.pv-tt h2 em{font-style:normal;color:var(--ink-2);font-weight:500;font-size:18px}.pv-acts{display:flex;flex-wrap:wrap;gap:8px}.pv-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:8px;border-radius:16px;background:var(--q-tray,#F4F2EC);border:1px solid var(--q-hair,#E4DFD3)}.pv-k{background:var(--card,#fff);border-radius:12px;padding:12px 16px;min-width:0}.pv-k span{display:block;font-size:12px;color:var(--ink-2)}.pv-k span small{font-size:11px}.pv-k b{display:block;margin-top:4px;font-size:20px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;unicode-bidi:isolate}.pv-k.add{box-shadow:inset 0 -3px 0 var(--g-2E7D4F,#2E7D4F)}.pv-k.ded{box-shadow:inset 0 -3px 0 #B4532A}.pv-k.net{background:var(--ink);color:var(--paper,#FAF8F3)}.pv-k.net span{color:color-mix(in srgb,var(--paper,#FAF8F3) 70%,transparent)}.pv-k.net b{color:var(--paper,#FAF8F3);font-size:24px}.pv-hint{display:flex;gap:8px;align-items:flex-start;margin:0;padding:12px 16px;border-radius:12px;background:#FEF3D7;color:#6B4300;font-size:13px;line-height:1.6}.pv-hint i{font-size:18px}.pv .err:empty{display:none}.pv .err{color:var(--bad,#B42318);font-size:13px}.pv-card{background:var(--card,#fff);border-radius:16px;border:1px solid var(--q-hair,#E4DFD3);box-shadow:var(--e1);padding:16px;min-width:0}.pv-h3{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:16px;font-weight:600;color:var(--ink)}.pv-h3 i{font-size:20px;color:var(--ink-2)}.pv-tblcard{padding:16px 0 0}.pv-tblcard .pv-h3,.pv-tblcard .pt-bar{padding:0 16px}.pv-more{border-radius:16px;border:1px solid var(--q-hair,#E4DFD3);background:var(--card,#fff);padding:0 16px}.pv-more>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;min-height:48px;font-weight:600;font-size:14px}.pv-more>summary::-webkit-details-marker{display:none}.pv-more>summary::after{content:\"+\";margin-inline-start:auto;font-size:20px;color:var(--ink-2)}.pv-more[open]>summary::after{content:\"\\2212\"}.pv-more[open]{padding-bottom:16px}.pt-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px}.pt-q{display:flex;align-items:center;gap:8px;flex:1 1 220px;min-height:40px;padding:0 12px;border-radius:999px;background:var(--well,#F6F3EC);border:1px solid var(--q-hair,#E4DFD3)}.pt-q i{color:var(--ink-2);font-size:16px}.pt-q input{all:unset;flex:1;font-size:14px;min-width:0;color:var(--ink)}.pt-bar select{min-height:40px;border-radius:999px;border:1px solid var(--q-hair,#E4DFD3);background:var(--card,#fff);padding:0 12px;font:inherit;font-size:13px}.pt-count{font-size:12px;color:var(--ink-2);margin-inline-start:auto}.pv-tblcard .pt-wrap{max-height:70vh;overflow:auto;border-top:1px solid var(--q-hair,#E4DFD3)}.pt-reg{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:13px}.pt-reg thead th{position:sticky;top:0;z-index:2;background:var(--q-tray,#F4F2EC);color:var(--ink-2);font-weight:600;font-size:12px;padding:8px 12px;border-bottom:1px solid var(--q-hair-3,#D6D0C2);white-space:nowrap;cursor:pointer;user-select:none}.pt-reg thead tr.pt-grp th{top:0;z-index:3;cursor:default;font-size:11px;letter-spacing:.02em;text-transform:none;padding:6px 12px;border-bottom:0;text-align:center;color:var(--ink)}.pt-reg thead tr:nth-child(2) th{top:29px}.pt-reg thead th.on{color:var(--ink)}.pt-reg thead th.on::after{content:\" \\25BE\";font-size:10px}.pt-reg thead th.on.up::after{content:\" \\25B4\"}.pt-reg .g-add{background:color-mix(in srgb,#2E7D4F 12%,var(--q-tray,#F4F2EC))}.pt-reg .g-ded{background:color-mix(in srgb,#B4532A 12%,var(--q-tray,#F4F2EC))}.pt-reg .g-cost{background:color-mix(in srgb,var(--ink) 8%,var(--q-tray,#F4F2EC))}.pt-reg thead th.z-add{background:color-mix(in srgb,#2E7D4F 6%,var(--q-tray,#F4F2EC))}.pt-reg thead th.z-ded{background:color-mix(in srgb,#B4532A 6%,var(--q-tray,#F4F2EC))}.pt-reg td{padding:10px 12px;border-bottom:1px solid var(--q-hair-2,#EEEAE0);white-space:nowrap;background:var(--card,#fff)}.pt-reg tbody td.z-add{background:color-mix(in srgb,#2E7D4F 2.5%,var(--card,#fff))}.pt-reg tbody td.z-ded{background:color-mix(in srgb,#B4532A 2.5%,var(--card,#fff))}.pt-reg .a{text-align:end;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}.pt-reg .tot{font-weight:600;color:var(--ink);border-inline-start:1px solid var(--q-hair,#E4DFD3)}.pt-reg .net{font-weight:700;font-size:14px;color:var(--ink);background:color-mix(in srgb,var(--ink) 4%,var(--card,#fff));border-inline:1px solid var(--q-hair-3,#D6D0C2)}.pt-reg .stick{position:sticky;inset-inline-start:0;z-index:1;box-shadow:inset -1px 0 0 var(--q-hair,#E4DFD3)}[dir=rtl] .pt-reg .stick{box-shadow:inset 1px 0 0 var(--q-hair,#E4DFD3)}.pt-reg thead th.stick{z-index:4}.pt-reg .nm{min-width:180px;max-width:240px;white-space:normal}.pt-reg .nm b{display:block;font-weight:600}.pt-reg .nm small{display:block;color:var(--ink-2);font-size:11px}.pt-reg .no{color:var(--ink-2);font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}.pt-reg .dp{color:var(--ink-2);max-width:180px;overflow:hidden;text-overflow:ellipsis}.pt-reg tbody tr{cursor:pointer}.pt-reg tbody tr:hover td{background:color-mix(in srgb,var(--brand) 6%,var(--card,#fff))}.pt-reg tbody tr:focus-visible{outline:2px solid var(--brand);outline-offset:-2px}.pt-reg tfoot td{position:sticky;bottom:0;z-index:1;background:var(--q-tray-2,#EFECE4);font-weight:700;border-top:2px solid var(--q-hair-3,#D6D0C2);border-bottom:0;color:var(--ink)}.pt-reg tfoot td.stick{z-index:2}.pt-reg tfoot small{font-weight:500;color:var(--ink-2)}.pt-reg .pt-go{color:var(--ink-2);opacity:.4}.pt-reg tr:hover .pt-go{opacity:1}.pt-reg .pt-none{text-align:center;color:var(--ink-2);padding:24px}html body .ps-net{box-shadow:none;border:1px solid var(--q-hair,#E4DFD3)}html body .ps-net-main{background:var(--ink);color:var(--paper,#FAF8F3)}html body .ps-net-main span,html body .ps-net-main em,html body .ps-net-main p{color:color-mix(in srgb,var(--paper,#FAF8F3) 72%,transparent)}html body .ps-net-side{background:var(--q-tray,#F4F2EC)}html body .ps-box{box-shadow:none;border:1px solid var(--q-hair,#E4DFD3)}html body .ps-box.earn{box-shadow:inset 0 3px 0 var(--g-2E7D4F,#2E7D4F)}html body .ps-box.ded{box-shadow:inset 0 3px 0 #B4532A}html body .ps-box.earn h4 i{color:var(--g-2E7D4F,#2E7D4F)}html body .ps-box.ded h4 i{color:#B4532A}html body .ps-box.cost h4 i,html body .ps-box.cost .ps-r.tot{color:var(--ink)}html body .ps-facts div{box-shadow:none;border:1px solid var(--q-hair,#E4DFD3)}html body .ps-facts i{color:var(--ink-2)}@media (max-width:900px){.pv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pv-k.net{grid-column:1 / -1;order:-1}.pv-head h2,.pv-tt h2{font-size:20px}.pv-acts{width:100%}.pv-acts .btn{flex:1 1 auto}.pv-runs{grid-template-columns:1fr}.pv-new .btn{width:100%}.pv-fld{flex:1 1 140px}.pv-tblcard .pt-wrap{max-height:none}}";
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

function lab(l){ var m = L[S.lang] || L.ar; if (l.code !== 'allowance') return m[l.code] || l.code; var n = String(l.label || ''); return /^(بدل|allowance)/i.test(n) ? n : m.allowance + ' ' + n; }
function money(n){ var v = Number(n || 0), s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return v < 0 ? '(' + s + ')' : s; }
/** Accounting format for tables: zero as a dash, negatives in brackets, always Western digits so columns line up. */
function acct(n){ var v = Math.round(Number(n || 0) * 100) / 100; return v === 0 ? '-' : money(v); }
function pct(n){ return isFinite(n) ? (Math.round(n * 10) / 10).toFixed(1) + '%' : '-'; }
function monthName(m){ return new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric' }); }
function lineNote(l){
  var bits = [];
  if (l.days) bits.push(plural(l.days, 'days'));
  if (l.hours) bits.push(l.hours + (S.lang === 'en' ? ' h' : ' ساعة'));
  if (l.minutes) bits.push(l.minutes + ' ' + t('min'));
  if (l.rate) bits.push(l.rate + '%');
  if (l.ref) bits.push(l.ref);
  if (l.label && l.code !== 'allowance') bits.push(l.label);
  return bits.length ? '<small>' + esc(bits.join('، ')) + '</small>' : '';
}
function warnChips(ws){ return (ws || []).filter(function(w, i, a){ return a.indexOf(w) === i; }).map(function(w){ return '<span class="chip ' + (w === 'no_package' || w === 'net_negative' ? 'absent' : 'late') + '">' + t('pw_' + w) + '</span>'; }).join(' '); }

/** A label in a given language (the payslip prints both). */
function labIn(l, lang){ var m = L[lang] || L.ar; if (l.code !== 'allowance') return m[l.code] || l.code; var n = String(l.label || ''); return /^(بدل|allowance)/i.test(n) ? n : m.allowance + ' ' + n; }
function sumBy(ls){ return ls.reduce(function(t, l){ return t + (Number(l.amount) || 0); }, 0); }
function companyCostOf(s){ return s.companyCost != null ? Number(s.companyCost) : Number(s.gross || 0) + Number(s.gosiEmployer || 0) + Number(s.eosAccrual || 0); }
function maskTail(v, n){ v = String(v || ''); return v ? '•••• ' + v.slice(-(n || 4)) : '-'; }

/** The payslip on screen: net pay up top with the amount in words, earnings beside deductions, then what the month cost the company. */
function slipHtml(s){
  var en = S.lang === 'en', e = inOrder(s.lines.filter(function(l){ return l.kind === 'earning'; })), d = inOrder(s.lines.filter(function(l){ return l.kind === 'deduction'; }));
  var g = (s.info && s.info.gosi) || {}, eos = (s.info && s.info.eos) || {};
  var rows = function(ls){ return ls.map(function(l){ return '<div class="ps-r"><span>' + esc(lab(l)) + lineNote(l) + '</span><b class="num">' + money(l.amount) + '</b></div>'; }).join(''); };
  var words = window.Doc ? Doc.words(s.net, en ? 'en' : 'ar') : '';
  return '<div class="ps">' +
    '<div class="ps-net"><div class="ps-net-main"><span>' + ph('wallet', 'duotone') + t('prNet') + '</span><b class="num" data-count>' + money(s.net) + '</b><em>' + t('mfSar') + '</em>' + (words ? '<p>' + esc(words) + '</p>' : '') + '</div>' +
      '<dl class="ps-net-side"><div><dt>' + t('prGross') + '</dt><dd class="num">' + money(s.gross) + '</dd></div><div><dt>' + t('prDed') + '</dt><dd class="num">' + money(s.deductions) + '</dd></div>' +
      '<div><dt>' + t('psCost') + '</dt><dd class="num">' + money(companyCostOf(s)) + '</dd></div></dl></div>' +
    '<div class="ps-cols"><section class="ps-box earn"><h4>' + ph('arrow-circle-up', 'duotone') + t('prEarnings') + '</h4>' + rows(e) + '<div class="ps-r tot"><span>' + t('prGross') + '</span><b class="num">' + money(s.gross) + '</b></div></section>' +
      '<section class="ps-box ded"><h4>' + ph('arrow-circle-down', 'duotone') + t('prDeductions') + '</h4>' + (d.length ? rows(d) : '<div class="ps-r"><span>-</span><b class="num">0.00</b></div>') +
      '<div class="ps-r tot"><span>' + t('prDed') + '</span><b class="num">' + money(s.deductions) + '</b></div></section></div>' +
    '<section class="ps-box cost"><h4>' + ph('buildings', 'duotone') + t('psCostTitle') + '</h4>' +
      '<div class="ps-r"><span>' + t('prGross') + '</span><b class="num">' + money(s.gross) + '</b></div>' +
      '<div class="ps-r"><span>' + t('psGosiEr') + '<small>' + (g.erRate != null ? g.erRate + '% × ' + money(g.base) : '') + '</small></span><b class="num">' + money(s.gosiEmployer) + '</b></div>' +
      '<div class="ps-r"><span>' + t('psEos') + '<small>' + (eos.years != null ? t('psYears').replace('{y}', eos.years) + ' · ' + (eos.perYear === 1 ? t('psEosFull') : t('psEosHalf')) : '') + '</small></span><b class="num">' + money(s.eosAccrual || 0) + '</b></div>' +
      '<div class="ps-r tot"><span>' + t('psCost') + '</span><b class="num">' + money(companyCostOf(s)) + '</b></div>' +
      (g.registered && Math.abs(g.registered - (g.packageWage || 0)) > 1 ? '<p class="ps-note">' + ph('warning-circle', 'fill') + t('psGosiDiff').replace('{r}', money(g.registered)).replace('{p}', money(g.packageWage)) + '</p>' : '') + '</section>' +
    '<div class="ps-facts">' + [['calendar-check', t('prDays'), s.paidDays || 0], ['user-minus', t('prAbsent'), s.absentDays || 0], ['clock-countdown', t('psLate'), (s.info && s.info.lateMin) || 0],
      ['timer', t('psOt'), (s.info && s.info.overtimeHours) || 0], ['airplane-tilt', t('prLeaveBal'), s.info && s.info.leaveBalance != null ? Number(s.info.leaveBalance).toLocaleString(LOCALE(), { maximumFractionDigits: 1 }) : '-']]
      .map(function(x){ return '<div>' + ph(x[0], 'duotone') + '<span>' + x[1] + '</span><b class="num">' + x[2] + '</b></div>'; }).join('') + '</div>' +
    (s.warnings && s.warnings.length ? '<div class="ps-warn">' + warnChips(s.warnings) + '</div>' : '') + '</div>';
}

/** The payslip on paper: the shared A4 document kit, bilingual labels, amount in words, company cost, verification QR. */
function printSlip(s, who){
  if (!window.Doc) { loadScript('js/doc.js').then(function(){ printSlip(s, who); }); return; }
  var lang = S.lang === 'en' ? 'en' : 'ar', other = lang === 'en' ? 'ar' : 'en', e = s.emp || who || {}, info = s.info || {}, g = info.gosi || {}, eos = info.eos || {};
  var bi = function(k){ return Doc.bi((T.ar[k] || k), (T.en[k] || k), lang); };
  var lb = function(l){ return Doc.bi(labIn(l, 'ar'), labIn(l, 'en'), lang); };
  var note = function(l){ var x = lineNote(l); return x ? x.replace('<small>', '<small>').replace('</small>', '</small>') : ''; };
  var tbl = function(ls, totKey, total){ return '<table class="tb"><thead><tr><th>' + bi('psItem') + '</th><th class="n">' + bi('psAmount') + '</th></tr></thead><tbody>' +
    (ls.length ? ls.map(function(l){ return '<tr><td>' + lb(l) + note(l) + '</td><td class="n num">' + money(l.amount) + '</td></tr>'; }).join('') : '<tr><td>-</td><td class="n num">0.00</td></tr>') +
    '</tbody><tfoot><tr><td>' + bi(totKey) + '</td><td class="n num">' + money(total) + '</td></tr></tfoot></table>'; };
  var ear = inOrder(s.lines.filter(function(l){ return l.kind === 'earning'; })), ded = inOrder(s.lines.filter(function(l){ return l.kind === 'deduction'; }));
  var cost = companyCostOf(s), period = info.from && info.to ? info.from + ' → ' + info.to : s.month;
  var body =
    '<section class="pnet"><div class="pn-main"><span>' + bi('prNet') + '</span><b class="num">' + money(s.net) + ' <em>' + (lang === 'en' ? 'SAR' : 'ر.س') + '</em></b>' +
      '<p>' + Doc.esc(Doc.words(s.net, lang)) + '</p><p class="o">' + Doc.esc(Doc.words(s.net, other)) + '</p></div>' +
      '<dl class="pn-side"><div><dt>' + bi('psPeriod') + '</dt><dd class="num">' + Doc.esc(period) + '</dd></div><div><dt>' + bi('psBank') + '</dt><dd>' + Doc.esc(info.bankName || '-') + ' · <span class="num">' + Doc.esc(maskTail(info.iban, 4)) + '</span></dd></div>' +
      '<div><dt>' + bi('prDays') + '</dt><dd class="num">' + (s.paidDays || 0) + ' / 30</dd></div></dl></section>' +
    '<section><h2 class="sh">' + bi('psEmployee') + '</h2><dl class="grid c4">' +
      [['psName', e.name || ''], ['mfEmpNo', e.empNo || ''], ['psPosition', e.title || '-'], ['psDept', e.department || '-'], ['psId', maskTail(info.nationalId, 4)], ['psGosiBase', money(g.base || 0)], ['psCohort', g.cohort ? (T[lang]['co_' + g.cohort] || g.cohort) : '-'], ['prRef', s.ref]]
        .map(function(x){ return '<div><dt>' + bi(x[0]) + '</dt><dd' + (/Ref|mfEmpNo|psGosiBase|psId/.test(x[0]) ? ' class="num"' : '') + '>' + Doc.esc(x[1]) + '</dd></div>'; }).join('') + '</dl></section>' +
    '<section class="two"><div><h2 class="sh">' + bi('prEarnings') + '</h2>' + tbl(ear, 'prGross', s.gross) + '</div><div><h2 class="sh">' + bi('prDeductions') + '</h2>' + tbl(ded, 'prDed', s.deductions) + '</div></section>' +
    '<section class="eq"><div><span>' + bi('prGross') + '</span><b class="num">' + money(s.gross) + '</b></div><i>−</i><div><span>' + bi('prDed') + '</span><b class="num">' + money(s.deductions) + '</b></div><i>=</i><div class="net"><span>' + bi('prNet') + '</span><b class="num">' + money(s.net) + '</b></div></section>' +
    '<section><h2 class="sh">' + bi('psCostTitle') + '</h2><table class="tb"><tbody>' +
      '<tr><td>' + bi('prGross') + '</td><td class="n num">' + money(s.gross) + '</td></tr>' +
      '<tr><td>' + bi('psGosiEr') + '<small>' + (g.erRate != null ? g.erRate + '% × ' + money(g.base) : '') + '</small></td><td class="n num">' + money(s.gosiEmployer) + '</td></tr>' +
      '<tr><td>' + bi('psEos') + '<small>' + (eos.years != null ? Doc.esc(T[lang].psYears.replace('{y}', eos.years)) + ' · ' + (eos.perYear === 1 ? T[lang].psEosFull : T[lang].psEosHalf) : '') + '</small></td><td class="n num">' + money(s.eosAccrual || 0) + '</td></tr>' +
      '</tbody><tfoot><tr><td>' + bi('psCost') + '</td><td class="n num">' + money(cost) + '</td></tr></tfoot></table>' +
      (g.registered && Math.abs(g.registered - (g.packageWage || 0)) > 1 ? '<p class="note warn" style="margin-top:6px">' + Doc.esc(T[lang].psGosiDiff.replace('{r}', money(g.registered)).replace('{p}', money(g.packageWage))) + '</p>' : '') + '</section>' +
    '<section><h2 class="sh">' + bi('psAttendance') + '</h2><dl class="grid c4">' +
      [['prDays', s.paidDays || 0], ['prAbsent', s.absentDays || 0], ['psLate', info.lateMin || 0], ['psOt', info.overtimeHours || 0]].map(function(x){ return '<div><dt>' + bi(x[0]) + '</dt><dd class="num">' + x[1] + '</dd></div>'; }).join('') + '</dl></section>';
  var css = '.pnet{display:grid;grid-template-columns:1.25fr 1fr;border-radius:12px;overflow:hidden;border:1px solid #DCD6C9;margin-top:4px}' +
    '.pn-main{background:linear-gradient(135deg,var(--g-1F4A33,#1F4A33),var(--brand));color:#fff;padding:16px 20px}.pn-main span .bi b{color:#fff}.pn-main span .bi i{color:var(--g-CFE5D7,#CFE5D7)}' +
    '.pn-main b{display:block;font-size:27pt;font-weight:700;line-height:1.15;margin:4px 0 4px;font-family:"IBM Plex Sans",sans-serif}.pn-main b em{font-style:normal;font-size:12pt;font-weight:600;opacity:.85}' +
    '.pn-main p{margin:0;font-size:8.5pt;color:var(--g-E3F1E8,#E3F1E8)}.pn-main p.o{font-size:7.5pt;color:var(--g-BCD8C6,#BCD8C6);margin-top:2px}' +
    '.pn-side{margin:0;display:grid;align-content:center;gap:0;background:#FAF8F3}.pn-side div{padding:8px 16px;border-top:1px solid #EEEAE0}.pn-side div:first-child{border-top:0}.pn-side dt{font-size:7.5pt;color:#6B786D;margin:0}.pn-side dd{margin:1px 0 0;font-weight:600}' +
    'section.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.eq{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:8px;background:var(--g-F4F7F5,#F4F7F5);border-radius:12px;padding:12px 16px}.eq i{font-style:normal;font-size:16pt;color:#8F8878}' +
    '.eq > div > span{display:block;font-size:8pt;color:#6B786D}.eq b{font-size:13pt}.eq .net b{color:var(--g-2F5134,#2F5134);font-size:15pt}';
  Doc.open({ lang: lang, kind: T[lang].psKind, title: T[lang].psTitle.replace('{m}', monthName(s.month)), ref: s.ref, body: body, extraCss: css,
    qr: 'PS|' + s.ref + '|' + (e.empNo || '') + '|' + s.month + '|' + Number(s.net).toFixed(2), by: S.me ? S.me.name : '',
    footnote: T[lang].psFoot, signatures: [bi('psSignHr'), bi('psSignPay'), bi('psSignEmp')] });
}

// ---------------- "ملفي": my payslips ----------------
function myCard(el, me){
  apiFresh('mySlips', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) { el.remove(); return; }
    setTimeout(function(){ var b = $('#trOpen', el); if (b) b.onclick = function(){ totalRewards(); }; }, 0);
    el.innerHTML = '<h3>' + ph('money') + t('prMine') + '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="trOpen">' + ph('gift') + t('trTitle') + '</button></h3>' + (r.rows.length ? r.rows.slice(0, 12).map(function(s){
      return '<div class="pr-month" data-slip="' + s.id + '" tabindex="0"><div class="av">' + ph('receipt') + '</div><div class="main"><b>' + esc(monthName(s.month)) + '</b><small><bdi>' + esc(s.ref) + '</bdi></small></div><b class="num">' + money(s.net) + '</b></div>';
    }).join('') : '<p>' + t('prMineEmpty') + '</p>');
    $$('[data-slip]', el).forEach(function(x){ var go = function(){ var s = r.rows.filter(function(y){ return y.id === x.dataset.slip; })[0]; openSlip(s, me, { mine: r.rows }); }; x.onclick = go; x.setAttribute('role', 'link'); x.onkeydown = function(e){ if (e.key === 'Enter') go(); }; });
  });
}
// ---------------- the payslip: a full page (#pay/slips/~slip/me.<id>, HR: ~slip/<runId>.<slipId>) ----------------
Object.assign(T.ar, { psPageLead:'صافي الراتب وتفاصيله وتكلفة الشركة', psSplit:'من الإجمالي إلى الصافي', psNetShare:'الصافي', psDedShare:'الخصومات', psTrend:'صافي آخر الأشهر', psPrev:'الشهر السابق', psNext:'الشهر التالي',
  psVsPrev:'عن الشهر السابق', psNotFound:'لم نجد هذه القسيمة، أو لا تملك صلاحية عرضها.', psLoading:'جار تحميل القسيمة' });
Object.assign(T.en, { psPageLead:'Net pay, its lines and the company cost', psSplit:'From gross to net', psNetShare:'Net', psDedShare:'Deductions', psTrend:'Net over recent months', psPrev:'Previous month', psNext:'Next month',
  psVsPrev:'vs previous month', psNotFound:'This payslip was not found, or you cannot see it.', psLoading:'Loading the payslip' });
/** Reopen from the URL: "me.<slipId>" (my own) or "<runId>.<slipId>" (HR, from a run). */
function openSlipRef(arg){
  var p = String(arg).split('.'), d = slipShell(), box = $('#psBody', d);
  var miss = function(err){ if (!d.isConnected) return; box.innerHTML = '<div class="rp-sec"><div class="empty">' + ph(err ? 'wifi-slash' : 'receipt-x') + '<b>' + (err ? esc(errText(err)) : t('psNotFound')) + '</b>' + (err ? '<div class="btnrow" style="justify-content:center;margin-top:10px"><button class="btn btn-dark btn-sm" type="button" data-retry>' + t('retry') + '</button></div>' : '') + '</div></div>'; var rb = $('[data-retry]', box); if (rb) rb.onclick = function(){ d.remove(); openSlipRef(arg); }; };
  if (p[0] === 'me') return apiFresh('mySlips', {}, function(r){ if (!d.isConnected) return; if (!r.ok) return miss(r.error); var s = r.rows.filter(function(x){ return x.id === p[1]; })[0]; if (!s) return miss(); slipInto(d, s, S.me, { mine: r.rows }); }, true);
  api('payrollGet', { id: p[0] }, true).then(function(r){ if (!d.isConnected) return; if (!r.ok) return miss(r.error === 'not_found' ? '' : r.error); var s = r.slips.filter(function(x){ return x.id === p[1]; })[0]; if (!s) return miss(); slipInto(d, s, null, { run: r.run }); });
}
function slipShell(o){
  var d = drawer('<div id="psBody"><div class="fp-grid"><div class="fp-main"><div class="rp-sec" role="status" aria-label="' + t('psLoading') + '"><span class="sk" style="height:96px;border-radius:16px"></span><span class="sk" style="width:70%;margin-top:14px"></span><span class="sk" style="width:55%;margin-top:10px"></span></div></div><aside class="fp-aside"><div class="rp-sec"><span class="sk" style="width:50%"></span><span class="sk" style="margin-top:12px;height:12px"></span></div></aside></div></div>',
    Object.assign({ key: 'slip', icon: 'receipt', tint: 'pay', title: t('psKind'), lead: t('psPageLead'), bare: true, wide: true }, o || {}));
  return d;
}
/** Kept for every caller: opens the payslip page. ctx: { mine: my slips (for previous / next), run: the HR run it came from }. */
function openSlip(s, who, ctx){
  if (!s) return;
  ctx = ctx || {};
  var d = slipShell({ arg: ctx.mine ? 'me.' + s.id : ctx.run ? ctx.run.id + '.' + s.id : '' });
  slipInto(d, s, who, ctx);
  return d;
}
function slipInto(d, s, who, ctx){
  var box = $('#psBody', d), mine = (ctx.mine || []).slice().sort(function(a, b){ return a.month < b.month ? -1 : 1; }), at = -1;
  mine.forEach(function(x, i){ if (x.id === s.id) at = i; });
  var prev = at > 0 ? mine[at - 1] : null, next = at >= 0 && at < mine.length - 1 ? mine[at + 1] : null, en = S.lang === 'en';
  var nav = mine.length > 1 ? '<span class="ps-nav" role="group" aria-label="' + t('psTrend') + '"><button type="button" class="btn btn-line btn-sm" data-mv="-1"' + (prev ? '' : ' disabled') + ' aria-label="' + t('psPrev') + '" title="' + t('psPrev') + '">' + ph(en ? 'caret-left' : 'caret-right') + '</button>' +
    '<button type="button" class="btn btn-line btn-sm" data-mv="1"' + (next ? '' : ' disabled') + ' aria-label="' + t('psNext') + '" title="' + t('psNext') + '">' + ph(en ? 'caret-right' : 'caret-left') + '</button></span>' : '';
  d.setHead({ title: esc(t('psTitle').replace('{m}', monthName(s.month))), lead: '<bdi class="num">' + esc(s.ref) + '</bdi>' + (s.emp ? ' · ' + esc(s.emp.name) : ''), chips: nav + '<button type="button" class="btn btn-dark btn-sm" data-print>' + ph('printer') + t('prPrint') + '</button>' });
  var gross = Math.max(0, Number(s.gross) || 0), ded = Math.max(0, Number(s.deductions) || 0), net = Math.max(0, Number(s.net) || 0), base = gross || 1;
  var change = prev && prev.net ? (s.net - prev.net) / prev.net * 100 : null;
  var trend = mine.slice(Math.max(0, at - 5), at + 1);
  var split = '<section class="rp-sec"><h2>' + ph('chart-donut') + t('psSplit') + '</h2>' +
    '<div class="fp-split" role="img" aria-label="' + t('psNetShare') + ' ' + money(net) + ', ' + t('psDedShare') + ' ' + money(ded) + '"><i style="width:' + (net / base * 100) + '%;background:var(--s1)"></i><i style="width:' + (ded / base * 100) + '%;background:var(--s2)"></i></div>' +
    '<div class="fp-legend" style="margin-top:8px"><span><i style="background:var(--s1)"></i>' + t('psNetShare') + ' ' + Math.round(net / base * 100) + '%</span><span><i style="background:var(--s2)"></i>' + t('psDedShare') + ' ' + Math.round(ded / base * 100) + '%</span></div>' +
    '<div class="fp-rows" style="margin-top:12px"><div><span>' + t('prGross') + '</span><b class="num">' + money(gross) + '</b></div><div><span>' + t('prDed') + '</span><b class="num">' + money(ded) + '</b></div><div><span>' + t('prNet') + '</span><b class="num">' + money(s.net) + '</b></div>' +
    (change != null ? '<div><span>' + t('psVsPrev') + '</span><b class="num ' + (change >= 0 ? '' : 'neg') + '">' + (change >= 0 ? '+' : '') + change.toFixed(1) + '%</b></div>' : '') + '</div></section>';
  var trendCard = trend.length > 1 && window.Viz ? '<section class="rp-sec"><h2>' + ph('chart-line-up') + t('psTrend') + '</h2>' +
    Viz.cols(trend.map(function(x){ return { label: Viz.monthShort(x.month), value: Number(x.net) || 0, tip: monthName(x.month) + ': ' + money(x.net), alt: x.id !== s.id }; }), { labels: true }) +
    '<div class="sr-only">' + trend.map(function(x){ return esc(monthName(x.month)) + ' ' + money(x.net); }).join('، ') + '</div></section>' : '';
  box.innerHTML = '<div class="fp-grid"><div class="fp-main"><div class="pr-slip-page">' + slipHtml(s) + '</div></div><aside class="fp-aside">' + split + trendCard + '</aside></div>' +
    '<div class="fp-bar"><div class="fp-sumline"><span>' + t('prNet') + '</span><b class="num">' + money(s.net) + ' ' + t('mfSar') + '</b></div><button type="button" class="btn btn-dark" data-print>' + ph('printer') + t('prPrint') + '</button></div>';
  if (window.Viz) Viz.wire(box);
  $$('[data-print]', d).forEach(function(b){ b.onclick = function(){ printSlip(s, who); }; });
  $$('[data-mv]', d).forEach(function(b){ b.onclick = function(){ var to = +b.dataset.mv < 0 ? prev : next; if (!to) return; d.setArg('me.' + to.id); slipInto(d, to, who, ctx); var f = $('[data-mv="' + b.dataset.mv + '"]', d); if (f && !f.disabled) f.focus(); }; });
}

// draft from last month, supporting documents, step-by-step approval (2026-11-20)
Object.assign(T.ar, { pvFromPrev:'ابدأ من الشهر السابق', pvFromPrevHint:'تنسخ إضافات وخصومات الشهر الذي تختاره (من آخر 3 أشهر معتمدة) إلى المسودة، ثم تراجعها وتعدلها قبل الاعتماد.',
  pvFromM:'ابدأ من مسير', pvFromNone:'لا تنسخ شيئا',
  pvCopied:'نسخنا {n} بندا من {m}. الإضافات تحتاج مستند اعتماد قبل اعتماد المسير.', pvCopiedNone:'لا توجد بنود في الشهر السابق لنسخها.',
  prAdjDoc:'مستند الاعتماد', prAdjDocPh:'رقم المستند أو الطلب أو رابطه', prAdjDocNeed:'أي إضافة أو ساعات عمل إضافي تحتاج مستند اعتماد.', prAdjCopy:'نسخة من الشهر السابق', prAdjNoDoc:'بدون مستند',
  awTitle:'مراجعة المسير قبل الاعتماد', awLead:'كل عمود في المسير خطوة: راجعه مقابل الشهر السابق ثم أكد. الإضافات تحتاج مستند اعتماد لكل سطر.',
  awStep:'الخطوة {i} من {n}', awDays:'أيام العمل', awPrev:'الشهر السابق', awNow:'هذا الشهر', awDiff:'الفرق', awNoPrev:'لا يوجد مسير معتمد للشهر السابق للمقارنة.',
  awConfirm:'راجعت هذا العمود وأؤكد صحته', awNext:'التالي', awBack:'السابق', awFinish:'اعتماد المسير وقفله', awDocs:'مستندات الاعتماد', awDocMissing:'أدخل مستند الاعتماد لكل سطر.',
  awChanged:'تغير', awNew:'جديد', awOnly:'المتغير فقط', awAll:'الكل', awSum:'المجموع', awFinal:'بعد الاعتماد يقفل المسير ولا يمكن التعديل.', awSupport:'المستندات',
  e_review_incomplete:'راجع كل أعمدة المسير قبل الاعتماد.', e_support_missing:'كل إضافة تحتاج مستند اعتماد قبل اعتماد المسير.', e_support_required:'أدخل مستند الاعتماد لهذه الإضافة (مثلا رقم طلب العمل الإضافي).',
  e_prep_changed:'تغيرت بيانات هذه الخطوة منذ فتحها. راجعها مرة أخرى ثم أكد.', e_prep_errors:'في المسير صافي سالب يمنع التأكيد. عالجه ثم أعد الاحتساب.', e_prep_incomplete:'أكمل خطوات إعداد المسير الثماني قبل الاعتماد.', e_prep_step_locked:'أكد الخطوات السابقة أولا.', e_recalc_needed:'أضيفت أو حذفت بنود بعد آخر احتساب. أعد احتساب المسير ثم أكد.', e_variance_unexplained:'اكتب سبب التغير لكل موظف تغير صافيه قبل تأكيد المراجعة.', e_clearance_changed:'تغيرت أرقام المخالصة منذ إعدادها. أعد إعدادها ثم اعتمدها.', e_leave_not_approved:'الإجازة غير معتمدة بعد.', pzWhyCol:'ما الذي تغير', pzExplCol:'التبرير', pzExplBtn:'اشرح', pzX_open:'بلا تبرير', pzX_explained:'مبرر', pzX_accepted:'مقبول', pzX_query:'استيضاح' });
Object.assign(T.en, { pvFromPrev:'Start from last month', pvFromPrevHint:'Copies the additions and deductions of the month you pick (one of the last 3 approved) into the draft; review and edit them before approval.',
  pvFromM:'Start from the run of', pvFromNone:'Copy nothing',
  pvCopied:'Copied {n} lines from {m}. Additions need a supporting document before the run is approved.', pvCopiedNone:'Last month has no lines to copy.',
  prAdjDoc:'Supporting document', prAdjDocPh:'Document or request number, or a link', prAdjDocNeed:'Every addition or overtime entry needs a supporting document.', prAdjCopy:'Copied from last month', prAdjNoDoc:'no document',
  awTitle:'Review the run before approval', awLead:'Each column of the run is a step: check it against last month, then confirm. Additions need a supporting document per line.',
  awStep:'Step {i} of {n}', awDays:'Days worked', awPrev:'Last month', awNow:'This month', awDiff:'Difference', awNoPrev:'No approved run last month to compare with.',
  awConfirm:'I have checked this column and confirm it', awNext:'Next', awBack:'Back', awFinish:'Approve and lock the run', awDocs:'Supporting documents', awDocMissing:'Enter a supporting document for every line.',
  awChanged:'changed', awNew:'new', awOnly:'Changes only', awAll:'All', awSum:'Total', awFinal:'Once approved the run is locked and cannot be changed.', awSupport:'Documents',
  e_review_incomplete:'Review every column of the run before approval.', e_support_missing:'Every addition needs a supporting document before the run is approved.', e_support_required:'Enter a supporting document for this addition (for example the overtime request number).',
  e_prep_changed:'This step changed since you opened it. Review it again, then confirm.', e_prep_errors:'A negative net blocks confirmation. Fix it and recalculate.', e_prep_incomplete:'Complete the eight preparation steps before approval.', e_prep_step_locked:'Confirm the earlier steps first.', e_recalc_needed:'Lines were added or removed after the last calculation. Recalculate the run, then confirm.', e_variance_unexplained:'Write the reason for every person whose net moved before confirming the review.', e_clearance_changed:'The clearance figures changed since it was prepared. Prepare it again, then approve.', e_leave_not_approved:'The leave is not approved yet.', pzWhyCol:'What changed', pzExplCol:'Explanation', pzExplBtn:'Explain', pzX_open:'Not explained', pzX_explained:'Explained', pzX_accepted:'Accepted', pzX_query:'Query' });
var SUPPORT_CODES = { overtime: 1, bonus: 1, commission: 1, incentive: 1, other_earning: 1 }; // the server's PAY_SUPPORT_CODES

/** Approval, one column at a time (owner 2026-11-20): days worked, then every addition, then every deduction, each against
 *  last month. Additions in SUPPORT_CODES need a document per line (prefilled from the adjustment). The server checks it all again. */
function approveWizard(r, run, done){
  var keys = r.reviewKeys || ['days'], prev = r.prev || { byEmp: {}, has: false }, adjRef = {}, i = 0, ticked = {}, support = {}, only = false;
  (r.adjustments || []).forEach(function(a){ adjRef[a.ref] = a; });
  var people = r.slips.slice().sort(function(a, b){ return String(a.emp ? a.emp.name : '').localeCompare(String(b.emp ? b.emp.name : '')); });
  var nm = function(k){ if (k === 'days') return t('awDays'); var p = k.split(':'); return lab({ code: p[1], kind: p[0] === 'd' ? 'deduction' : 'earning' }); };
  var d = drawer('<h3>' + t('awTitle') + ' · ' + esc(monthName(run.month)) + '</h3><p class="hr-hint">' + t('awLead') + '</p><div id="awB"></div>', { wide: true });
  var el = $('#awB', d);
  // every line of this column, per person: [{ slip, label, amount, ref, key }]
  var rowsOf = function(k){ var out = [];
    people.forEach(function(s){ var pv = prev.byEmp[s.empId] || null;
      if (k === 'days') return out.push({ s: s, now: +s.paidDays || 0, was: pv ? pv.days : null, lines: [] });
      var p = k.split(':'), kind = p[0] === 'd' ? 'deduction' : 'earning', ls = (s.lines || []).filter(function(l){ return l.code === p[1] && (l.kind === 'deduction') === (kind === 'deduction') && +l.amount > 0; });
      var now = ls.reduce(function(a, l){ return a + (+l.amount || 0); }, 0), was = pv ? (pv.lines[k] || 0) : null;
      if (now || was) out.push({ s: s, now: Math.round(now * 100) / 100, was: was, lines: ls });
    });
    return out; };
  var needDoc = function(k){ return k.indexOf('e:') === 0 && SUPPORT_CODES[k.slice(2)]; };
  var sk = function(s, l){ return s.id + ':' + l.code + (l.ref ? ':' + l.ref : ''); };
  var docOf = function(s, l){ var key = sk(s, l); if (support[key] != null) return support[key]; var a = l.ref && adjRef[l.ref]; return (a && a.docRef) || (s.support && s.support[key]) || ''; };
  var fmt = function(k, v){ return v == null ? '-' : k === 'days' ? String(v) : acct(v); };
  function draw(){
    var k = keys[i], rows = rowsOf(k), doc = needDoc(k), changed = function(x){ return x.was == null || Math.abs(x.now - x.was) > 0.005; };
    var shown = only ? rows.filter(changed) : rows, sum = function(f){ return rows.reduce(function(a, x){ return a + (+x[f] || 0); }, 0); };
    el.innerHTML = '<div class="aw-steps" role="list">' + keys.map(function(x, n){ return '<button type="button" role="listitem" class="aw-dot' + (n === i ? ' on' : '') + (ticked[x] ? ' ok' : '') + '" data-go="' + n + '"' + (n > i && !keys.slice(0, n).every(function(y){ return ticked[y]; }) ? ' disabled' : '') + '>' + (ticked[x] ? ph('check') : n + 1) + ' <span>' + esc(nm(x)) + '</span></button>'; }).join('') + '</div>' +
      '<div class="aw-head"><small>' + t('awStep').replace('{i}', i + 1).replace('{n}', keys.length) + '</small><h4>' + esc(nm(k)) + '</h4>' +
      '<div class="aw-tot"><span>' + t('awPrev') + ' <b class="num">' + (prev.has ? fmt(k, sum('was')) : '-') + '</b></span><span>' + t('awNow') + ' <b class="num">' + fmt(k, sum('now')) + '</b></span>' +
      (prev.has ? '<span>' + t('awDiff') + ' <b class="num">' + fmt(k, Math.round((sum('now') - sum('was')) * 100) / 100) + '</b></span>' : '') + '</div>' +
      (prev.has ? '' : '<p class="hr-hint">' + ph('info') + t('awNoPrev') + '</p>') +
      '<div class="aw-flt"><button type="button" class="chip' + (only ? '' : ' on') + '" data-only="0">' + t('awAll') + ' (' + rows.length + ')</button><button type="button" class="chip' + (only ? ' on' : '') + '" data-only="1">' + t('awOnly') + ' (' + rows.filter(changed).length + ')</button></div></div>' +
      '<div class="pt-wrap"><table class="pt aw-t"><thead><tr><th>' + t('hrName') + '</th><th class="a">' + t('awPrev') + '</th><th class="a">' + t('awNow') + '</th><th class="a">' + t('awDiff') + '</th>' + (doc ? '<th>' + t('awDocs') + '</th>' : '') + '</tr></thead><tbody>' +
      (shown.length ? shown.map(function(x){ var c = changed(x), df = x.was == null ? null : Math.round((x.now - x.was) * 100) / 100;
        return '<tr class="' + (c ? 'aw-ch' : '') + '"><td class="nm"><b>' + esc(x.s.emp ? x.s.emp.name : '') + '</b><small>' + esc(x.s.emp ? x.s.emp.empNo : '') + '</small></td>' +
          '<td class="a">' + fmt(k, x.was) + '</td><td class="a"><b>' + fmt(k, x.now) + '</b></td><td class="a">' + (x.was == null ? '<span class="pv-st pv-draft">' + t('awNew') + '</span>' : c ? fmt(k, df) : '-') + '</td>' +
          (doc ? '<td class="aw-docs">' + x.lines.map(function(l){ var key = sk(x.s, l); return '<label><small>' + esc(l.label || nm(k)) + ' · <b class="num">' + acct(l.amount) + '</b></small><input data-sup="' + esc(key) + '" value="' + esc(docOf(x.s, l)) + '" maxlength="200" placeholder="' + t('prAdjDocPh') + '"></label>'; }).join('') + '</td>' : '') + '</tr>'; }).join('')
        : '<tr><td colspan="' + (doc ? 5 : 4) + '" class="pt-none">' + t('ptNone') + '</td></tr>') + '</tbody></table></div>' +
      '<label class="aw-ok"><input type="checkbox" id="awTick"' + (ticked[k] ? ' checked' : '') + '> ' + t('awConfirm') + '</label><div class="err" id="awErr"></div>' +
      (i === keys.length - 1 ? '<p class="hr-hint">' + ph('lock') + t('awFinal') + '</p>' : '') +
      '<div class="btnrow">' + (i ? '<button type="button" class="btn btn-line btn-sm" id="awPrevB">' + t('awBack') + '</button>' : '') +
      '<button type="button" class="btn btn-dark btn-sm" id="awNextB"' + (ticked[k] ? '' : ' disabled') + '>' + (i === keys.length - 1 ? ph('seal-check') + t('awFinish') : t('awNext')) + '</button></div>';
    $$('[data-sup]', el).forEach(function(x){ x.oninput = function(){ support[x.dataset.sup] = x.value; }; });
    $$('[data-only]', el).forEach(function(b){ b.onclick = function(){ only = b.dataset.only === '1'; draw(); }; });
    $$('[data-go]', el).forEach(function(b){ b.onclick = function(){ i = +b.dataset.go; draw(); }; });
    $('#awTick', el).onchange = function(){ ticked[k] = this.checked; $('#awNextB', el).disabled = !this.checked; };
    if ($('#awPrevB', el)) $('#awPrevB', el).onclick = function(){ i--; draw(); };
    $('#awNextB', el).onclick = function(){
      if (doc) { var miss = rows.some(function(x){ return x.lines.some(function(l){ return !String(docOf(x.s, l)).trim(); }); }); if (miss) { $('#awErr', el).textContent = t('awDocMissing'); return; } }
      if (i < keys.length - 1) { i++; return draw(); }
      var sup = {}; keys.filter(needDoc).forEach(function(kk){ rowsOf(kk).forEach(function(x){ x.lines.forEach(function(l){ sup[sk(x.s, l)] = String(docOf(x.s, l)).trim(); }); }); });
      var b = this; b.disabled = true;
      api('payrollApprove', { id: run.id, review: keys.slice(), support: sup }).then(function(x){ b.disabled = false; if (!x.ok) return $('#awErr', el).textContent = errText(x.error); d.remove(); done(x); });
    };
  }
  if (!$('#awCss')) { var st = document.createElement('style'); st.id = 'awCss'; st.textContent =
    '.aw-steps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}.aw-dot{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--q-hair,#ddd);background:transparent;border-radius:999px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer;color:inherit}' +
    '.aw-dot.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}.aw-dot.ok{background:var(--q-tray,#f3f1ec)}.aw-dot:disabled{opacity:.45;cursor:default}' +
    '.aw-head h4{margin:2px 0 8px;font-size:20px}.aw-tot{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;margin-bottom:8px}.aw-flt{display:flex;gap:6px;margin:8px 0}' +
    '.aw-flt .chip{border:1px solid var(--q-hair,#ddd);background:transparent;border-radius:999px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer;color:inherit}.aw-flt .chip.on{background:var(--ink,#222);color:var(--paper,#fff)}' +
    '.aw-t tr.aw-ch td{background:color-mix(in srgb,var(--brand) 7%,transparent)}.aw-docs label{display:block;margin:2px 0}.aw-docs input{width:100%;min-width:180px;font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--q-hair,#ccc);border-radius:8px;background:transparent;color:inherit}' +
    '.va .aw-t,.aw-t{min-width:0!important;width:100%;table-layout:auto}.aw-t td,.aw-t th{white-space:nowrap}.aw-t td.aw-docs{white-space:normal;min-width:200px}' +
    '.aw-ok{display:flex;gap:8px;align-items:center;margin:14px 0 6px;font-weight:600}';
    document.head.appendChild(st); }
  draw();
}

// ---------------- preparation wizard (2026-11-24) ----------------
// A new month is prepared in nine steps, one after another (docs/research/2026-11-24-payroll-prep-wizard-rea.md). Steps 1-8 are
// confirmed here (payrollPrepConfirm records who and when, and the fingerprint of what was shown); step 9 is approveWizard, by
// another payroll holder. The server decides which step is open, which are stale (changed after confirming) and which are locked.
Object.assign(T.ar, { pzTitle:'إعداد مسير الرواتب خطوة بخطوة', pzLead:'كل خطوة تفتح بعد تأكيد التي قبلها. تعرض كل خطوة الموظفين المتأثرين فقط وما تغير عن الشهر السابق.',
  pzStep:'الخطوة {i} من 9', pzOpen:'متابعة الإعداد', pzOpenN:'متابعة الإعداد: الخطوة {i} من 9', pzDoneAll:'اكتملت خطوات الإعداد الثماني. ينتظر الاعتماد من شخص آخر.',
  pzBanner:'إعداد المسير', pzBannerLead:'أكد الخطوات بالترتيب قبل أن يُرسل المسير للاعتماد.',
  pz_days:'أيام العمل والحضور', pz_status:'حالة الموظفين', pz_hires:'المعينون الجدد', pz_leavers:'المغادرون', pz_package:'تغييرات الرواتب', pz_additions:'الإضافات', pz_deductions:'الخصومات', pz_review:'المراجعة مقابل الشهر السابق', pz_approve:'الاعتماد',
  pzL_days:'أيام العمل في فترة الحضور لكل موظف: الغياب والتأخير والعمل الإضافي، والأيام مقابل الشهر السابق.',
  pzL_status:'من الموقوف عن العمل (لا يصرف له)، ومن في إجازة أو إجازة بدون راتب أو مرضية خلال الشهر.',
  pzL_hires:'من انضم منذ الشهر السابق، وراتبه محسوب بالأيام من تاريخ مباشرته.',
  pzL_leavers:'من ينتهي عمله أو لم يعد في المسير، بآخر يوم عمل وحالة المخالصة النهائية ومكافأة نهاية الخدمة.',
  pzL_package:'كل راتب معتمد تغير منذ بداية الشهر السابق: من كم إلى كم، ومن أي تاريخ، ومن اعتمده.',
  pzL_additions:'كل ما يصرف فوق الراتب الثابت. كل إضافة تحتاج مستند اعتماد.',
  pzL_deductions:'كل خصم في المسير: التأمينات والجزاءات والسلف والغياب والإجازات غير المدفوعة.',
  pzL_review:'المجاميع مقابل الشهر السابق، ومطابقة العدد (السابق + الجدد - المغادرين)، ومن تغير صافيه كثيرا.',
  pzL_approve:'يعتمد المسير شخص يحمل صلاحية الرواتب لم يعده ولم يؤكد أي خطوة من خطواته.',
  pzConfirm:'أؤكد {s}', pzConfirmed:'أكدها {n} في {d}', pzStale:'تغيرت بيانات هذه الخطوة بعد تأكيدها. راجعها وأكدها مرة أخرى.', pzLocked:'أكد الخطوات السابقة أولا.',
  pzWasConfirmed:'أكدت سابقا من {n}', pzNote:'ملاحظة (اختياري)', pzNone:'لا يوجد موظف متأثر في هذه الخطوة.', pzNoneOk:'لا يوجد ما يراجع هنا. أكد الخطوة للمتابعة.',
  pzOthers:'{n} آخرون بلا تغيير', pzWindow:'فترة الحضور', pzRecalc:'إعادة الاحتساب', pzRecalcNeed:'أضيفت أو حذفت بنود بعد آخر احتساب. أعد الاحتساب قبل التأكيد.',
  pzAddLine:'إضافة بند', pzDays:'الأيام', pzAbsent:'غياب', pzLate:'تأخير (دقيقة)', pzOt:'إضافي (ساعة)', pzKind:'الحالة', pzFrom:'من', pzTo:'إلى', pzInRun:'في المسير',
  pzK_suspended:'موقوف', pzK_leave:'إجازة', pzK_unpaid:'إجازة بدون راتب', pzK_sick:'إجازة مرضية', pzNotPaid:'لا يصرف له', pzWasPaid:'صرف له الشهر السابق',
  pzHire:'تاريخ المباشرة', pzPaidFrom:'يصرف من', pzMonthly:'الراتب الشهري', pzGross:'الإجمالي', pzLateHire:'لم يكن في مسير الشهر السابق', pzNoPkg:'بلا راتب معتمد',
  pzLastDay:'آخر يوم عمل', pzWhy:'السبب', pzW_last_day:'آخر يوم عمل مسجل', pzW_not_in_run:'كان في الشهر السابق وليس في هذا المسير', pzW_suspended:'موقوف',
  pzSettle:'المخالصة النهائية', pzNoSettle:'لا مخالصة بعد', pzBySettle:'يصرف الشهر ضمن المخالصة', pzFs_draft:'مسودة', pzFs_approved:'معتمدة', pzFs_paid:'مصروفة', pzFs_pending:'بانتظار الاعتماد',
  pzWas:'كان', pzNow:'أصبح', pzEff:'يسري من', pzReason:'السبب', pzApprover:'اعتمده', pzLines:'البنود', pzDoc:'المستند', pzCopied:'منسوخة',
  pzHead:'العدد', pzNet:'الصافي', pzRecon:'مطابقة العدد', pzReconLine:'{a} الشهر السابق + {j} جدد - {l} مغادرون = {e}؛ في المسير {n}', pzReconOk:'العدد مطابق', pzReconBad:'العدد غير مطابق: راجع المعينين والمغادرين',
  pzErrors:'أخطاء تمنع التأكيد', pzNoPkgList:'بلا راتب معتمد، لا يصرف لهم شيء هذا الشهر', pzVarLead:'من تغير صافيه {p}% و{m} ريال أو أكثر', pzWarns:'ملاحظات على القسائم',
  pzToApprove:'فتح الاعتماد', pzApproveOther:'يعتمده شخص آخر يحمل صلاحية الرواتب ولم يعد المسير ولم يؤكد أي خطوة.', pzApproved:'اعتمد المسير وقفل.',
  pzStepDone:'تم تأكيد الخطوة', pzNoPrev:'لا يوجد مسير معتمد للشهر السابق؛ كل الموظفين يظهرون جددا.', pzLockedRun:'المسير معتمد ومقفل.' });
Object.assign(T.en, { pzTitle:'Prepare the payroll step by step', pzLead:'Each step opens once the one before it is confirmed. Each step shows only the people affected and what changed since last month.',
  pzStep:'Step {i} of 9', pzOpen:'Continue preparing', pzOpenN:'Continue preparing: step {i} of 9', pzDoneAll:'All eight preparation steps are confirmed. Waiting for approval by someone else.',
  pzBanner:'Run preparation', pzBannerLead:'Confirm the steps in order before the run goes for approval.',
  pz_days:'Working days and attendance', pz_status:'Employee status', pz_hires:'New hires', pz_leavers:'Leavers', pz_package:'Package changes', pz_additions:'Additions', pz_deductions:'Deductions', pz_review:'Review against last month', pz_approve:'Approval',
  pzL_days:'Days worked in the attendance window per person: absence, minutes late, overtime, and days against last month.',
  pzL_status:'Who is suspended (not paid), and who is on leave, unpaid leave or sick leave during the month.',
  pzL_hires:'Who joined since last month, paid by the day from their start date.',
  pzL_leavers:'Who is leaving or no longer on the run, with the last working day and the final settlement and end-of-service status.',
  pzL_package:'Every approved package that changed since last month began: from what to what, from which date, approved by whom.',
  pzL_additions:'Everything paid above fixed pay. Each addition needs a supporting document.',
  pzL_deductions:'Every deduction on the run: GOSI, fines, advances, absence, unpaid leave.',
  pzL_review:'Totals against last month, the headcount check (last month + joiners - leavers), and whose net moved a lot.',
  pzL_approve:'A payroll holder who did not prepare the run and confirmed none of its steps approves it.',
  pzConfirm:'Confirm {s}', pzConfirmed:'Confirmed by {n} on {d}', pzStale:'This step changed after it was confirmed. Review it and confirm it again.', pzLocked:'Confirm the earlier steps first.',
  pzWasConfirmed:'Earlier confirmed by {n}', pzNote:'Note (optional)', pzNone:'Nobody is affected in this step.', pzNoneOk:'Nothing to review here. Confirm the step to continue.',
  pzOthers:'{n} others unchanged', pzWindow:'Attendance window', pzRecalc:'Recalculate', pzRecalcNeed:'Lines were added or removed after the last calculation. Recalculate before confirming.',
  pzAddLine:'Add a line', pzDays:'Days', pzAbsent:'Absent', pzLate:'Late (min)', pzOt:'Overtime (h)', pzKind:'Status', pzFrom:'From', pzTo:'To', pzInRun:'On the run',
  pzK_suspended:'Suspended', pzK_leave:'Leave', pzK_unpaid:'Unpaid leave', pzK_sick:'Sick leave', pzNotPaid:'not paid', pzWasPaid:'paid last month',
  pzHire:'Start date', pzPaidFrom:'Paid from', pzMonthly:'Monthly pay', pzGross:'Gross', pzLateHire:'was not on last month\'s run', pzNoPkg:'no approved package',
  pzLastDay:'Last working day', pzWhy:'Reason', pzW_last_day:'last working day recorded', pzW_not_in_run:'on last month, not on this run', pzW_suspended:'suspended',
  pzSettle:'Final settlement', pzNoSettle:'no settlement yet', pzBySettle:'this month is paid in the settlement', pzFs_draft:'draft', pzFs_approved:'approved', pzFs_paid:'paid', pzFs_pending:'awaiting approval',
  pzWas:'Was', pzNow:'Now', pzEff:'From', pzReason:'Reason', pzApprover:'Approved by', pzLines:'Lines', pzDoc:'Document', pzCopied:'copied',
  pzHead:'Headcount', pzNet:'Net', pzRecon:'Headcount check', pzReconLine:'{a} last month + {j} joiners - {l} leavers = {e}; on the run {n}', pzReconOk:'Headcount matches', pzReconBad:'Headcount does not match: check hires and leavers',
  pzErrors:'Errors that block confirmation', pzNoPkgList:'No approved package: paid nothing this month', pzVarLead:'Whose net moved by {p}% and {m} SAR or more', pzWarns:'Payslip notes',
  pzToApprove:'Open approval', pzApproveOther:'Someone else with payroll access, who did not prepare the run and confirmed none of its steps, approves it.', pzApproved:'The run is approved and locked.',
  pzStepDone:'Step confirmed', pzNoPrev:'No approved run last month: everyone shows as new.', pzLockedRun:'The run is approved and locked.' });

var PZ_ICON = { days: 'calendar-check', status: 'user-switch', hires: 'user-plus', leavers: 'user-minus', package: 'currency-circle-dollar', additions: 'plus-circle', deductions: 'minus-circle', review: 'scales', approve: 'seal-check' };
function pzDate(d){ d = String(d || '').slice(0, 10); return d ? new Date(d + 'T00:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '-'; }
function pzWhen(ts){ try { return new Date(ts).toLocaleString(LOCALE(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }); } catch (e) { return ''; } }
function pzName(x){ return '<td class="nm"><b><bdi dir="auto">' + esc((S.lang === 'en' && x.nameEn) || x.name || '') + '</bdi></b><small>' + esc(x.empNo || '') + '</small></td>'; }
function pzDiff(was, now, days){ if (was == null) return '<span class="pv-st pv-draft">' + t('awNew') + '</span>'; var d = Math.round((now - was) * 100) / 100; return d ? '<b class="pz-d ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '+' : '') + (days ? d : acct(d)) + '</b>' : '-'; }

/** The wizard page for a draft run. done(): the run page redraws after closing (a confirmation or approval changed it). */
function prepWizard(runId, done, opts){
  var d = drawer('<h3>' + t('pzTitle') + '</h3><p class="hr-hint">' + t('pzLead') + '</p><div id="pzB"><div class="list"><div class="row"><div class="main"><span class="sk" style="width:40%"></span><span class="sk"></span></div></div></div></div>', { wide: true });
  var el = $('#pzB', d), P = null, cur = null, support = {}, changed = false;
  var close = function(){ d.remove(); if (changed && done) done(); };
  pzCss();
  function load(goOpen){
    api('payrollPrep', { id: runId }, true).then(function(r){
      if (!d.isConnected) return;
      if (!r.ok) { el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
      P = r;
      if (goOpen || cur == null) cur = r.complete || r.run.status !== 'draft' ? 8 : r.steps.findIndex(function(x){ return x.state === 'open'; });
      draw();
    });
  }
  function stepper(){
    var list = P.steps.map(function(x){ return { key: x.key, n: x.n, state: x.state, stale: x.stale }; }).concat([{ key: 'approve', n: 9, state: P.run.status === 'locked' ? 'done' : P.complete ? 'open' : 'locked' }]);
    return '<ol class="pz-steps" role="list">' + list.map(function(x, i){
      return '<li><button type="button" class="pz-dot pz-' + x.state + (x.stale ? ' pz-stale' : '') + (i === cur ? ' on' : '') + '" data-go="' + i + '"' + (x.state === 'locked' ? ' disabled' : '') + ' aria-current="' + (i === cur ? 'step' : 'false') + '">' +
        '<i>' + (x.state === 'done' ? ph('check') : x.state === 'locked' ? ph('lock-simple') : x.n) + '</i><span>' + t('pz_' + x.key) + '</span></button></li>'; }).join('') + '</ol>';
  }
  function table(head, rows){ return '<div class="pt-wrap"><table class="pt pz-t"><thead><tr>' + head.map(function(h){ return '<th' + (h.a ? ' class="a"' : '') + '>' + h.t + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  var A = function(s){ return { t: s, a: 1 }; }, L = function(s){ return { t: s }; };
  function body(x){
    var R = x.rows, prevNone = !P.prev.has ? '<p class="hr-hint">' + ph('info') + t('pzNoPrev') + '</p>' : '';
    if (x.key === 'days') return '<div class="pz-facts"><span>' + ph('calendar') + t('pzWindow') + ' <b>' + pzDate(x.window.from) + ' – ' + pzDate(x.window.to) + '</b></span><span>' + plural(x.total, 'people') + '</span>' +
        (x.total > R.length ? '<span>' + t('pzOthers').replace('{n}', x.total - R.length) + '</span>' : '') + '</div>' + prevNone +
      (R.length ? table([L(t('hrName')), A(t('awPrev')), A(t('pzDays')), A(t('awDiff')), A(t('pzAbsent')), A(t('pzLate')), A(t('pzOt')), L(t('pzWindow'))], R.map(function(r){
        return '<tr class="' + (r.was == null || r.was !== r.days ? 'aw-ch' : '') + '">' + pzName(r) + '<td class="a">' + (r.was == null ? '-' : r.was) + '</td><td class="a"><b>' + r.days + '</b></td><td class="a">' + pzDiff(r.was, r.days, true) + '</td>' +
          '<td class="a">' + (r.absent || '-') + '</td><td class="a">' + (r.lateMin || '-') + '</td><td class="a">' + (r.otHours || '-') + '</td><td class="pz-sm">' + (r.attFrom ? pzDate(r.attFrom) + ' – ' + pzDate(r.attTo) : '-') + '</td></tr>'; })) : '');
    if (x.key === 'status') return R.length ? table([L(t('hrName')), L(t('pzKind')), L(t('pzFrom')), L(t('pzTo')), A(t('pzDays')), L(t('pzInRun'))], R.map(function(r){
        return '<tr>' + pzName(r) + '<td><span class="pz-chip pz-' + r.kind + '">' + t('pzK_' + r.kind) + '</span></td><td>' + pzDate(r.from) + '</td><td>' + pzDate(r.to) + '</td><td class="a">' + (r.days || '-') + '</td>' +
          '<td>' + (r.inRun ? ph('check') : '<small class="pz-warn">' + t('pzNotPaid') + (r.wasPaid ? ' · ' + t('pzWasPaid') : '') + '</small>') + '</td></tr>'; })) : '';
    if (x.key === 'hires') return prevNone + (R.length ? table([L(t('hrName')), L(t('pzHire')), L(t('pzPaidFrom')), A(t('pzDays')), A(t('pzMonthly')), A(t('pzGross')), A(t('prNet'))], R.map(function(r){
        return '<tr>' + pzName(r) + '<td>' + pzDate(r.hireDate) + (r.late ? '<small class="pz-warn">' + t('pzLateHire') + '</small>' : '') + '</td><td>' + pzDate(r.from) + '</td><td class="a"><b>' + r.days + '</b></td>' +
          '<td class="a">' + (r.noPackage ? '<span class="pz-warn">' + t('pzNoPkg') + '</span>' : acct(r.monthly)) + '</td><td class="a">' + acct(r.gross) + '</td><td class="a"><b>' + acct(r.net) + '</b></td></tr>'; })) : '');
    if (x.key === 'leavers') return R.length ? table([L(t('hrName')), L(t('pzLastDay')), L(t('pzWhy')), A(t('pzDays')), A(t('prNet')), L(t('pzSettle'))], R.map(function(r){
        var s = r.settlement;
        return '<tr>' + pzName(r) + '<td>' + pzDate(r.lastDay) + '</td><td class="pz-sm">' + t('pzW_' + r.why) + '</td><td class="a">' + (r.inRun ? r.days : '-') + '</td><td class="a">' + (r.inRun ? acct(r.net) : '-') + '</td>' +
          '<td>' + (s ? '<bdi>' + esc(s.ref) + '</bdi> · ' + (T[S.lang]['pzFs_' + s.status] ? t('pzFs_' + s.status) : esc(s.status)) + ' · <b class="num">' + acct(s.net) + '</b>' : '<span class="pz-warn">' + t('pzNoSettle') + '</span>') +
          (r.paidBySettlement ? '<small>' + t('pzBySettle') + '</small>' : '') + '</td></tr>'; })) : '';
    if (x.key === 'package') return R.length ? table([L(t('hrName')), A(t('pzWas')), A(t('pzNow')), A(t('awDiff')), L(t('pzEff')), L(t('pzReason')), L(t('pzApprover'))], R.map(function(r){
        return '<tr class="aw-ch">' + pzName(r) + '<td class="a">' + (r.was == null ? '-' : acct(r.was)) + '</td><td class="a"><b>' + acct(r.now) + '</b></td><td class="a">' + pzDiff(r.was, r.now) + '</td>' +
          '<td>' + pzDate(r.effectiveFrom) + '</td><td class="pz-sm"><bdi dir="auto">' + esc(r.reason || '-') + '</bdi>' + (r.ref ? ' <small><bdi>' + esc(r.ref) + '</bdi></small>' : '') + '</td><td class="pz-sm">' + esc(r.approvedBy || '-') + (r.approvedAt ? '<small>' + pzDate(r.approvedAt) + '</small>' : '') + '</td></tr>'; })) : '';
    if (x.key === 'additions' || x.key === 'deductions') { var add = x.key === 'additions';
      return (R.length ? table([L(t('hrName')), L(t('pzLines')), A(t('awPrev')), A(t('awNow')), A(t('awDiff'))], R.map(function(r){
        return '<tr class="' + (r.was == null || Math.abs(r.now - r.was) > 0.005 ? 'aw-ch' : '') + '">' + pzName(r) + '<td class="pz-lines">' + r.lines.map(function(l){
            var doc = l.doc || support[l.key] || P.support[l.key] || '';
            return '<div><span>' + esc(lab(l)) + (l.label && l.code !== 'allowance' ? ' <small><bdi dir="auto">' + esc(l.label) + '</bdi></small>' : '') + (l.hours ? ' <small>' + l.hours + 'h</small>' : '') + (l.days ? ' <small>' + plural(l.days, 'days') + '</small>' : '') +
              (l.copied ? ' <small class="pz-chip">' + t('pzCopied') + '</small>' : '') + '</span><b class="num">' + acct(l.amount) + '</b>' +
              (add && l.needDoc ? (l.doc ? '<small class="pz-doc">' + ph('paperclip') + '<bdi>' + esc(l.doc) + '</bdi></small>' : '<input class="pz-in" data-sup="' + esc(l.key) + '" value="' + esc(doc) + '" maxlength="200" placeholder="' + t('prAdjDocPh') + '" aria-label="' + t('pzDoc') + '">') : '') + '</div>'; }).join('') +
            (r.warnings.length ? warnChips(r.warnings) : '') + '</td><td class="a">' + (r.was == null ? '-' : acct(r.was)) + '</td><td class="a"><b>' + acct(r.now) + '</b></td><td class="a">' + pzDiff(r.was, r.now) + '</td></tr>'; })) : '');
    }
    if (x.key === 'review') { var tt = x.totals, pt = x.prevTotals || {}, exp = (pt.headcount || 0) + x.joiners - x.leavers, kp = function(lb, a, b){ return '<div class="pv-k"><span>' + lb + '</span><b class="num">' + b + '</b><small>' + t('awPrev') + ' ' + a + '</small></div>'; };
      var w = Object.keys(x.warnings || {});
      return '<div class="pv-kpis">' + kp(t('pzHead'), P.prev.has ? pt.headcount : '-', tt.headcount) + kp(t('pvTotAdd'), P.prev.has ? money(pt.gross) : '-', money(tt.gross)) + kp(t('pvTotDed'), P.prev.has ? money(pt.deductions) : '-', money(tt.deductions)) +
          kp(t('pzNet'), P.prev.has ? money(pt.net) : '-', money(tt.net)) + '</div>' +
        (P.prev.has ? '<p class="pz-recon ' + (exp === tt.headcount ? 'ok' : 'bad') + '">' + ph(exp === tt.headcount ? 'check-circle' : 'warning') + '<b>' + t(exp === tt.headcount ? 'pzReconOk' : 'pzReconBad') + '</b> ' +
          t('pzReconLine').replace('{a}', pt.headcount).replace('{j}', x.joiners).replace('{l}', x.leavers).replace('{e}', exp).replace('{n}', tt.headcount) + '</p>' : prevNone) +
        (x.errors.length ? '<div class="pz-err"><b>' + ph('x-circle') + t('pzErrors') + '</b><ul>' + x.errors.map(function(e){ return '<li><bdi dir="auto">' + esc(e.name) + '</bdi> <small>' + esc(e.empNo) + '</small> · ' + t('pw_' + e.code) + '</li>'; }).join('') + '</ul></div>' : '') +
        ((x.noPackage || []).length ? '<div class="pz-stalebar">' + ph('warning') + '<b>' + t('pzNoPkgList') + ':</b> ' + x.noPackage.map(function(e){ return '<bdi dir="auto">' + esc(e.name) + '</bdi> <small>' + esc(e.empNo) + '</small>'; }).join('، ') + '</div>' : '') +
        (w.length ? '<p class="pz-sm">' + t('pzWarns') + ': ' + w.map(function(k){ return '<span class="chip late">' + t('pw_' + k) + ' · ' + x.warnings[k] + '</span>'; }).join(' ') + '</p>' : '') +
        (R.length ? '<h4 class="pz-h4">' + t('pzVarLead').replace('{p}', x.pct).replace('{m}', x.min) + '</h4>' + table([L(t('hrName')), A(t('awPrev')), A(t('awNow')), A(t('awDiff')), L(t('pzWhyCol')), L(t('pzExplCol'))], R.map(function(r, ri){
          var n = r.note, st = !n || n.stale ? 'open' : n.status;
          return '<tr class="aw-ch">' + pzName(r) + '<td class="a">' + acct(r.was) + '</td><td class="a"><b>' + acct(r.now) + '</b></td><td class="a">' + pzDiff(r.was, r.now) + '</td>' +
            '<td class="pz-sm">' + (r.why || []).map(function(w){ var p = w.line.split(':'); return '<div>' + esc(lab({ code: p[1], kind: p[0] === 'd' ? 'deduction' : 'earning' })) + ' <b class="pz-d ' + (w.effect > 0 ? 'up' : 'dn') + '">' + (w.effect > 0 ? '+' : '') + acct(w.effect) + '</b></div>'; }).join('') +
            (r.daysWas != null && r.daysWas !== r.daysNow ? '<div>' + t('pzDays') + ' ' + r.daysWas + ' → ' + r.daysNow + '</div>' : '') + '</td>' +
            '<td class="pz-sm"><span class="pz-chip pz-x' + st + '">' + t('pzX_' + st) + '</span>' + (n && !n.stale ? '<small><bdi dir="auto">' + esc(n.note) + '</bdi></small>' : '') +
            (P.run.status === 'draft' ? '<button type="button" class="btn btn-line btn-sm" data-vx="' + ri + '">' + ph('pencil-simple') + t('pzExplBtn') + '</button>' : '') + '</td></tr>'; })) : '');
    }
    return '';
  }
  function draw(){
    var locked = P.run.status !== 'draft', i = cur;
    if (i === 8) {
      el.innerHTML = stepper() + '<section class="pz-card"><header class="pz-hd"><small>' + t('pzStep').replace('{i}', 9) + '</small><h4>' + ph(PZ_ICON.approve) + t('pz_approve') + '</h4><p>' + t('pzL_approve') + '</p></header>' +
        (locked ? '<p class="pz-ok">' + ph('lock') + t('pzLockedRun') + '</p>' : !P.complete ? '<p class="pz-lock">' + ph('lock-simple') + t('pzLocked') + '</p>'
          : '<p class="pz-ok">' + ph('check-circle') + t('pzDoneAll') + '</p>' + (P.canApprove ? '<div class="btnrow"><button type="button" class="btn btn-dark" id="pzAppr">' + ph('seal-check') + t('pzToApprove') + '</button></div>' : '<p class="hr-hint">' + ph('info') + t('pzApproveOther') + '</p>')) +
        '<div class="err" id="pzErr"></div><div class="btnrow pz-nav"><button type="button" class="btn btn-line btn-sm" id="pzBack">' + t('awBack') + '</button></div></section>';
      wire();
      if ($('#pzAppr', el)) $('#pzAppr', el).onclick = function(){ var b = this; b.disabled = true;
        api('payrollGet', { id: runId }, true).then(function(g){ b.disabled = false; if (!g.ok) return $('#pzErr', el).textContent = errText(g.error);
          approveWizard(g, g.run, function(){ toast(t('pzApproved')); changed = true; close(); }); }); };
      return;
    }
    var x = P.steps[i], c = x.confirmed, can = !locked && x.state === 'open';
    var needRecalc = P.pendingAdjustments && (x.key === 'additions' || x.key === 'deductions' || x.key === 'review');
    el.innerHTML = stepper() + '<section class="pz-card"><header class="pz-hd"><small>' + t('pzStep').replace('{i}', x.n) + ' · ' + plural(x.count, 'people') + '</small><h4>' + ph(PZ_ICON[x.key]) + t('pz_' + x.key) + '</h4><p>' + t('pzL_' + x.key) + '</p></header>' +
      (x.stale ? '<p class="pz-stalebar">' + ph('arrows-clockwise') + t('pzStale') + (c ? ' <small>' + t('pzWasConfirmed').replace('{n}', esc(c.byName)) + '</small>' : '') + '</p>'
        : c && x.state === 'done' ? '<p class="pz-ok">' + ph('check-circle') + t('pzConfirmed').replace('{n}', esc(c.byName)).replace('{d}', pzWhen(c.at)) + (c.note ? ' · <bdi dir="auto">' + esc(c.note) + '</bdi>' : '') + '</p>' : '') +
      (x.state === 'locked' ? '<p class="pz-lock">' + ph('lock-simple') + t('pzLocked') + '</p>' : '') +
      (needRecalc && !locked ? '<p class="pz-stalebar">' + ph('warning') + t('pzRecalcNeed') + '</p>' : '') +
      '<div class="pz-body">' + (x.rows.length || x.key === 'review' || x.key === 'days' ? body(x) : '<div class="pz-empty">' + ph('check-circle') + '<b>' + t('pzNone') + '</b><small>' + t('pzNoneOk') + '</small></div>') + '</div>' +
      (!locked ? '<div class="pz-tools">' + ((x.key === 'days' || needRecalc || x.stale || x.key === 'review') ? '<button type="button" class="btn btn-line btn-sm" id="pzRe">' + ph('arrows-clockwise') + t('pzRecalc') + '</button>' : '') +
        (x.key === 'additions' || x.key === 'deductions' ? '<button type="button" class="btn btn-line btn-sm" id="pzAdd">' + ph('plus') + t('pzAddLine') + '</button>' : '') + '</div>' : '') +
      (can ? '<label class="pz-note"><span>' + t('pzNote') + '</span><input id="pzNote" maxlength="300"></label>' : '') + '<div class="err" id="pzErr"></div>' +
      '<div class="btnrow pz-nav">' + (i ? '<button type="button" class="btn btn-line btn-sm" id="pzBack">' + t('awBack') + '</button>' : '') +
      (can ? '<button type="button" class="btn btn-dark" id="pzOk"' + (needRecalc || (x.errors || []).length ? ' disabled' : '') + '>' + ph('check') + t('pzConfirm').replace('{s}', t('pz_' + x.key)) + '</button>'
        : x.state === 'done' ? '<button type="button" class="btn btn-line btn-sm" id="pzNext">' + t('awNext') + '</button>' : '') + '</div></section>';
    wire();
    $$('[data-vx]', el).forEach(function(b){ b.onclick = function(){ var r = x.rows[+b.dataset.vx];
      W2_FILES.concat(['js/variance.js']).reduce(function(p, f){ return p.then(function(){ return loadScript(f); }); }, Promise.resolve()).then(function(){ Variance.explain(runId, r.empId, r.name, r.note, P.me, function(){ load(false); }); }); }; });
    $$('[data-sup]', el).forEach(function(inp){ inp.oninput = function(){ support[inp.dataset.sup] = inp.value; }; });
    if ($('#pzRe', el)) $('#pzRe', el).onclick = function(){ var b = this; b.disabled = true; api('payrollRecalc', { id: runId }).then(function(r){ b.disabled = false; if (!r.ok) return $('#pzErr', el).textContent = errText(r.error); changed = true; toast(t('prRecalcDone')); load(true); }); };
    if ($('#pzAdd', el)) $('#pzAdd', el).onclick = function(){ changed = true; close(); setTimeout(function(){ var a = $('#prAdj'); if (a) { a.scrollIntoView({ behavior: 'smooth', block: 'start' }); var f = a.querySelector('select,input'); if (f) f.focus(); } }, 300); };
    if ($('#pzNext', el)) $('#pzNext', el).onclick = function(){ cur = i + 1; draw(); };
    if ($('#pzOk', el)) $('#pzOk', el).onclick = function(){
      var b = this, sup = {};
      if (x.key === 'additions') { var miss = false;
        x.rows.forEach(function(r){ r.lines.forEach(function(l){ if (!l.needDoc || l.doc) return; var v = String(support[l.key] || P.support[l.key] || '').trim(); if (!v) miss = true; sup[l.key] = v; }); });
        if (miss) { $('#pzErr', el).textContent = t('awDocMissing'); return; } }
      b.disabled = true;
      api('payrollPrepConfirm', { id: runId, step: x.key, sig: x.sig, note: ($('#pzNote', el) || {}).value || '', support: sup }).then(function(r){
        b.disabled = false; if (!r.ok) { $('#pzErr', el).textContent = errText(r.error); if (r.error === 'prep_changed') load(false); return; }
        changed = true; toast(t('pzStepDone')); load(true);
        var top = d.querySelector('.dp-panel') || d; if (top.scrollIntoView) top.scrollIntoView({ block: 'start' });
      });
    };
  }
  function wire(){
    $$('[data-go]', el).forEach(function(b){ b.onclick = function(){ cur = +b.dataset.go; draw(); }; });
    if ($('#pzBack', el)) $('#pzBack', el).onclick = function(){ cur = Math.max(0, cur - 1); draw(); };
    var on = $('.pz-dot.on', el); if (on && on.scrollIntoView) try { on.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
  }
  // closing by the drawer's own close button: redraw the run page when something was confirmed
  var mo = new MutationObserver(function(){ if (!d.isConnected) { mo.disconnect(); if (changed && done) { var f = done; done = null; f(); } } });
  if (d.parentNode) mo.observe(d.parentNode, { childList: true });
  load(true);
}
/** The wizard's place on the run page: where preparation stands and the button that continues it. */
function prepBanner(r){
  pzCss();
  var p = r.prep; if (!p) return '';
  var n = p.complete ? 9 : (['days', 'status', 'hires', 'leavers', 'package', 'additions', 'deductions', 'review'].indexOf(p.open) + 1);
  return '<section class="pz-banner' + (p.complete ? ' ok' : '') + '"><div class="pz-bt">' + ph(p.complete ? 'check-circle' : 'list-checks', 'duotone') + '<div><b>' + t('pzBanner') + '</b><small>' + (p.complete ? t('pzDoneAll') : t('pzBannerLead')) + '</small></div></div>' +
    '<div class="pz-mini" aria-hidden="true">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(k){ return '<i class="' + (k <= p.done ? 'd' : k === n ? 'o' : '') + '"></i>'; }).join('') + '</div>' +
    '<button type="button" class="btn ' + (p.complete ? 'btn-line' : 'btn-dark') + ' btn-sm" id="pzGo">' + ph('list-checks') + (p.complete ? t('pzOpen') : t('pzOpenN').replace('{i}', n)) + '</button></section>';
}
function pzCss(){
  if ($('#pzCss')) return;
  var st = document.createElement('style'); st.id = 'pzCss'; st.textContent =
    'html body.v2-on .pz-steps{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;padding:0 0 4px}' +
    'html body.v2-on .pz-steps li{flex:0 0 auto}' +
    'html body.v2-on .pz-dot{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--q-hair,#ddd);background:transparent;border-radius:999px;padding:4px 12px 4px 4px;font:inherit;font-size:13px;cursor:pointer;color:inherit;white-space:nowrap}' +
    'html body.v2-on [dir=rtl] .pz-dot,html[dir=rtl] body.v2-on .pz-dot{padding:4px 4px 4px 12px}' +
    'html body.v2-on .pz-dot i{font-style:normal;display:inline-grid;place-items:center;width:24px;height:24px;border-radius:999px;background:var(--q-tray,#f3f1ec);font-size:12px;font-weight:700}' +
    'html body.v2-on .pz-dot.pz-done i{background:var(--q-brand-ink,var(--brand));color:var(--paper,#fff)}' +
    'html body.v2-on .pz-dot.pz-open i{background:var(--ink,#222);color:var(--paper,#fff)}' +
    'html body.v2-on .pz-dot.pz-stale i{background:#C98500;color:#fff}' +
    'html body.v2-on .pz-dot.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}html body.v2-on .pz-dot:disabled{opacity:.5;cursor:default}' +
    'html body.v2-on .pz-card{border:1px solid var(--q-hair,#e5e2dc);border-radius:16px;padding:24px;background:var(--card,transparent)}' +
    'html body.v2-on .pz-hd small{color:var(--muted,#777);font-size:12px}html body.v2-on .pz-hd h4{margin:4px 0 4px;font-size:20px;display:flex;align-items:center;gap:8px}html body.v2-on .pz-hd p{margin:0 0 16px;color:var(--muted,#666);font-size:14px}' +
    'html body.v2-on .pz-ok,html body.v2-on .pz-lock,html body.v2-on .pz-stalebar,html body.v2-on .pz-recon{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-radius:12px;padding:8px 12px;margin:0 0 12px;font-size:13px}' +
    'html body.v2-on .pz-ok{background:color-mix(in srgb,#2E7D4F 10%,transparent)}html body.v2-on .pz-lock{background:var(--q-tray,#f3f1ec)}' +
    'html body.v2-on .pz-stalebar{background:color-mix(in srgb,#C98500 14%,transparent)}html body.v2-on .pz-recon.ok{background:color-mix(in srgb,#2E7D4F 10%,transparent)}html body.v2-on .pz-recon.bad{background:color-mix(in srgb,#C98500 14%,transparent)}' +
    'html body.v2-on .pz-facts{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;margin:0 0 12px}html body.v2-on .pz-facts span{display:inline-flex;align-items:center;gap:4px}' +
    'html body.v2-on .pz-t{width:100%;min-width:0!important}html body.v2-on .pz-t td,html body.v2-on .pz-t th{white-space:nowrap}html body.v2-on .pz-t td.nm small,html body.v2-on .pz-t td small{display:block;color:var(--muted,#777);font-size:12px}' +
    'html body.v2-on .pz-t tr.aw-ch td{background:color-mix(in srgb,var(--brand) 7%,transparent)}html body.v2-on .pz-sm{font-size:12px;white-space:normal!important}' +
    'html body.v2-on .pz-lines{white-space:normal!important;min-width:220px}html body.v2-on .pz-lines>div{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 12px;padding:2px 0}' +
    'html body.v2-on .pz-lines small{display:inline!important}html body.v2-on .pz-in{flex:1 0 100%;font:inherit;font-size:13px;padding:6px 10px;border:1px solid var(--q-hair,#ccc);border-radius:8px;background:transparent;color:inherit}' +
    'html body.v2-on .pz-doc{flex:1 0 100%;display:flex!important;align-items:center;gap:4px}html body.v2-on .pz-chip{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;background:var(--q-tray,#f3f1ec)}' +
    'html body.v2-on .pz-chip.pz-suspended{background:color-mix(in srgb,#B3261E 12%,transparent)}html body.v2-on .pz-chip.pz-unpaid{background:color-mix(in srgb,#C98500 16%,transparent)}' +
    'html body.v2-on .pz-warn{color:#9A5B00;font-size:12px}html body.v2-on .pz-d.up{color:#2E7D4F}html body.v2-on .pz-d.dn{color:#B3261E}' +
    'html body.v2-on .pz-err{border:1px solid color-mix(in srgb,#B3261E 40%,transparent);border-radius:12px;padding:8px 12px;margin:0 0 12px;font-size:13px}html body.v2-on .pz-err ul{margin:4px 0 0;padding-inline-start:20px}' +
    'html body.v2-on .pz-h4{font-size:14px;margin:16px 0 8px}html body.v2-on .pz-empty{display:grid;justify-items:center;gap:4px;padding:24px;text-align:center;color:var(--muted,#666)}' +
    'html body.v2-on .pz-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}html body.v2-on .pz-note{display:grid;gap:4px;margin:12px 0 0;font-size:13px}' +
    'html body.v2-on .pz-note input{font:inherit;padding:8px 12px;border:1px solid var(--q-hair,#ccc);border-radius:12px;background:transparent;color:inherit}' +
    'html body.v2-on .pz-nav{margin-top:16px;justify-content:space-between}' +
    'html body.v2-on .pz-banner{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;border:1px solid var(--q-hair,#e5e2dc);border-radius:16px;padding:16px 24px;margin:0 0 16px;background:color-mix(in srgb,var(--brand) 5%,transparent)}' +
    'html body.v2-on .pz-banner.ok{background:color-mix(in srgb,#2E7D4F 7%,transparent)}html body.v2-on .pz-bt{display:flex;align-items:center;gap:12px;flex:1 1 260px}html body.v2-on .pz-bt small{display:block;color:var(--muted,#666);font-size:12px}' +
    'html body.v2-on .pz-bt>i,html body.v2-on .pz-bt>.ph-duotone{font-size:28px}html body.v2-on .pz-mini{display:flex;gap:4px}html body.v2-on .pz-mini i{width:16px;height:6px;border-radius:4px;background:var(--q-hair,#ddd)}' +
    'html body.v2-on .pz-mini i.d{background:var(--q-brand-ink,var(--brand))}html body.v2-on .pz-mini i.o{background:var(--ink,#222)}' +
    '@media (max-width:600px){html body.v2-on .pz-steps{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}html body.v2-on .pz-card{padding:16px}html body.v2-on .pz-banner{padding:16px}html body.v2-on .pz-dot span{display:none}html body.v2-on .pz-dot.on span{display:inline}html body.v2-on .pz-nav .btn{flex:1}}';
  document.head.appendChild(st);
}

// ---------------- HR console: payroll ----------------
var xlsxP = null;
function xlsx(){ if (window.XLSX) return Promise.resolve(); if (xlsxP) return xlsxP; xlsxP = new Promise(function(res, rej){ var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sri(sc, sc.src); sc.onload = res; sc.onerror = function(){ xlsxP = null; rej(); }; document.head.appendChild(sc); }); return xlsxP; }

function section(body){
  if (S.prRun) return runView(body, S.prRun);
  var last = (function(){ var d = new Date(riyadhToday() + 'T00:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })();
  var done = S.prMode === 'approved'; // 2026-11-17: preparing new payroll and the approved runs are separate pages
  body.innerHTML = '<div class="pv"><header class="pv-head"><div><h2>' + t(done ? 'prTitleDone' : 'prTitlePrep') + '</h2><p>' + t(done ? 'prLeadDone' : 'prLeadPrep') + '</p></div></header>' +
    '<form class="pv-new" id="prNewF"' + (done ? ' hidden' : '') + '><div class="pv-new-t">' + ph('calculator', 'duotone') + '<div><b>' + t('pvNew') + '</b><small>' + t('pvNewLead') + '</small></div></div>' +
    '<label class="pv-fld"><span>' + t('prMonth') + '</span><input type="month" name="month" value="' + last + '" max="' + riyadhToday().slice(0, 7) + '" required></label>' +
    '<label class="pv-fld" id="prGrpL" hidden><span>' + t('pgGroup') + '</span><select name="group" id="prGrp" aria-label="' + t('pgGroup') + '"></select></label>' +
    '<label class="pv-fld" title="' + t('pvFromPrevHint') + '"><span>' + t('pvFromM') + '</span><select name="fromM" id="prFromM" aria-label="' + t('pvFromM') + '"><option value="">' + t('pvFromNone') + '</option></select></label>' +
    '<button class="btn btn-dark">' + ph('calculator') + t('prCreate') + '</button><span class="err" id="prErr"></span></form><div id="prList"></div>' +
    (done ? '' : '<section class="pv-card"><h3 class="pv-h3">' + ph('calculator') + t('prEos') + '</h3><div id="prEos"></div></section>') + '</div>';
  $('#prNewF', body).onsubmit = function(ev){
    ev.preventDefault(); var b = this.querySelector('button'); b.disabled = true;
    api('payrollCreate', { month: this.elements.month.value, payGroupId: this.elements.group.value || '', fromMonth: this.elements.fromM.value || '' }).then(function(r){ b.disabled = false; if (!r.ok) { $('#prErr', body).textContent = errText(r.error); return; }
      if (r.copied) toast(r.copied.count ? t('pvCopied').replace('{n}', r.copied.count).replace('{m}', monthName(r.copied.from)) : t('pvCopiedNone'));
      S.prRun = r.run.id; section(body); prepWizard(r.run.id, function(){ section(body); }); });
  };
  var el = $('#prList', body);
  apiFresh('payrollList', {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var gs = $('#prGrp', body); // pay groups (2026-10-21): pick which group's run to prepare
    if (gs && r.groups && r.groups.length > 1) { var keep = gs.value; gs.innerHTML = r.groups.map(function(g){ return '<option value="' + esc(g.id) + '">' + esc((S.lang === 'en' ? g.nameEn : g.nameAr) || g.nameAr) + '</option>'; }).join(''); gs.value = keep || ''; $('#prGrpL', body).hidden = false; }
    // start from any of the last 3 months that has a locked run of the chosen group (owner 2026-11-25), the month before first
    var fm = $('#prFromM', body), fF = $('#prNewF', body), fromOpts = function(){
      if (!fm) return; var m = fF.elements.month.value, g = fF.elements.group.value || '', keep = fm.value, opts = [];
      for (var k = 1; k <= 3 && /^\d{4}-\d{2}$/.test(m); k++) { var d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 - k, 15)).toISOString().slice(0, 7);
        var lr = r.rows.filter(function(x){ return x.month === d && x.status === 'locked' && String(x.payGroupId || '') === g; })[0];
        if (lr) opts.push('<option value="' + d + '">' + esc(monthName(d)) + ' · ' + t('prNet') + ' ' + money(lr.totals && lr.totals.net) + '</option>'); }
      fm.innerHTML = '<option value="">' + t('pvFromNone') + '</option>' + opts.join('');
      fm.value = keep && fm.querySelector('option[value="' + keep + '"]') ? keep : (opts.length ? fm.options[1].value : '');
    };
    if (fm && !fm.dataset.wired) { fm.dataset.wired = '1'; fF.elements.month.addEventListener('change', function(){ fm.value = ''; fromOpts(); }); fF.elements.group.addEventListener('change', function(){ fm.value = ''; fromOpts(); }); }
    fromOpts();
    var rows = r.rows.filter(function(x){ return done ? x.status === 'locked' : x.status !== 'locked'; });
    // one block per month (newest first), one card per pay-group run inside it
    var byM = {}; rows.forEach(function(x){ (byM[x.month] = byM[x.month] || []).push(x); });
    var tot = function(list, k){ return list.reduce(function(a, x){ return a + (Number(x.totals[k]) || 0); }, 0); };
    var gname = function(x){ return x.payGroupName ? ((S.lang === 'en' ? x.payGroupNameEn : x.payGroupName) || x.payGroupName) : t('pvAll'); };
    var card = function(x){ var tt = x.totals || {}, dd = tt.deductions != null ? tt.deductions : (tt.gross || 0) - (tt.net || 0);
      return '<button type="button" class="pv-run" data-run="' + x.id + '"><span class="pv-st pv-' + esc(x.status) + '">' + t('pr_' + x.status) + '</span>' +
        '<b class="pv-grp"><bdi dir="auto">' + esc(gname(x)) + '</bdi></b><small class="pv-ref"><bdi>' + esc(x.ref) + '</bdi> · ' + plural(tt.headcount || 0, 'people') + '</small>' +
        '<dl class="pv-fig"><div><dt>' + t('pvTotAdd') + '</dt><dd class="num">' + money(tt.gross) + '</dd></div><div><dt>' + t('pvTotDed') + '</dt><dd class="num">' + money(dd) + '</dd></div>' +
        '<div class="pv-netf"><dt>' + t('prNet') + '</dt><dd class="num">' + money(tt.net) + '</dd></div></dl></button>'; };
    el.innerHTML = (done && window.Viz && rows.length ? listDash(rows) : '') + (rows.length ? '<div class="pv-reg">' + Object.keys(byM).sort().reverse().map(function(m){ var rs = byM[m];
      return '<section class="pv-month"><header><h3>' + esc(monthName(m)) + '</h3><span>' + plural(tot(rs, 'headcount'), 'people') + ' · ' + t('pvMonthTot') + ' <b class="num">' + money(tot(rs, 'net')) + '</b></span></header>' +
        '<div class="pv-runs">' + rs.map(card).join('') + '</div></section>'; }).join('') + '</div>'
      : '<div class="empty">' + ph('money') + '<b>' + t(done ? 'prEmptyDone' : 'prEmptyPrep') + '</b></div>');
    if (window.Viz) Viz.wire(el);
    $$('[data-run]', el).forEach(function(x){ x.onclick = function(){ S.prRun = x.dataset.run; section(body); }; });
  });
  if (!done) eosBox($('#prEos', body));
}

/** The payroll over time: net and headcount per run, and what changed since the previous one. */
function listDash(rows){
  var drafts0 = rows.filter(function(x){ return x.status === 'draft'; }).length, mm = {};
  rows.forEach(function(x){ var m = mm[x.month] = mm[x.month] || { month: x.month, status: 'locked', totals: { net: 0, gross: 0, gosiEmployer: 0, headcount: 0 } }; ['net', 'gross', 'gosiEmployer', 'headcount'].forEach(function(k){ m.totals[k] += Number(x.totals[k]) || 0; }); if (x.status === 'draft') m.status = 'draft'; });
  rows = Object.keys(mm).map(function(k){ return mm[k]; }); // pay groups: one point per month, all groups added up
  var V = Viz, asc = rows.slice().sort(function(a, b){ return a.month < b.month ? -1 : 1; }), last = asc[asc.length - 1], prev = asc[asc.length - 2];
  var ch = prev && prev.totals.net ? (last.totals.net - prev.totals.net) / prev.totals.net * 100 : null, drafts = drafts0;
  var pts = asc.slice(-12).map(function(x){ return { label: V.monthShort(x.month), y: x.totals.net, note: plural(x.totals.headcount || 0, 'people') }; });
  return V.panel('payroll', t('pdTitle'), '<div class="db-tiles">' + V.tile(t('pdLastNet'), V.sar(last.totals.net), monthName(last.month), ch, true, true, '%') +
    V.tile(t('prGross'), V.sar(last.totals.gross), '') + V.tile(t('prGosiEr'), V.sar(last.totals.gosiEmployer), '') + V.tile(t('prHead'), V.n1(last.totals.headcount || 0, 0), '') +
    V.tile(t('pdDrafts'), V.n1(drafts, 0), drafts ? t('pdDraftsNote') : '') + '</div>' +
    (pts.length > 1 ? '<div class="db-grid">' + V.card('pn', t('pdTrend'), '', V.lineChart(pts, { fmt: 'sar', aria: t('pdTrend') }), V.tbl(['', t('prNet'), t('prHead')], asc.map(function(x){ return [monthName(x.month), money(x.totals.net), x.totals.headcount]; }))) + '</div>' : ''));
}
var EARN = { arrears: 1, basic: 1, housing: 1, transport: 1, allowance: 1, overtime: 1, bonus: 1, commission: 1, other_earning: 1, reimbursement: 1, per_diem: 1 };
/** One run: what the gross is made of, where the deductions go, and net by department. */
function runDash(r){
  var V = Viz, earn = {}, ded = {}, dept = {}, warn = 0, lab = L[S.lang] || L.ar;
  r.slips.forEach(function(s){
    (s.lines || []).forEach(function(l){ var a = Math.abs(Number(l.amount) || 0); if (!a) return; if (EARN[l.code]) earn[l.code] = (earn[l.code] || 0) + a; else ded[l.code] = (ded[l.code] || 0) + a; });
    var d = s.emp && s.emp.department || '-'; dept[d] = (dept[d] || 0) + s.net;
    if ((s.warnings || []).length) warn++;
  });
  var items = function(m, labels){ return Object.keys(m).sort(function(a, b){ return m[b] - m[a]; }).slice(0, 10).map(function(k){ var lb = labels ? labels[k] || k : k; return { label: lb, value: m[k], text: V.sar(m[k]), tip: lb + ': ' + V.sar(m[k]) }; }); };
  var e = items(earn, lab), d = items(ded, lab), n = items(dept);
  var tb = function(list){ return V.tbl(['', t('mfSar')], list.map(function(i){ return [esc(i.label), money(i.value)]; })); };
  return V.panel('payrun', t('pdRunTitle'), (warn ? '<p class="hr-hint" style="margin:0 0 10px"><span class="db-status">' + ph('warning') + ' ' + t('pdWarn') + ': ' + warn + '</span></p>' : '') +
    '<div class="db-grid three">' + V.card('pe', t('pdEarn'), '', V.hbars(e), tb(e)) + V.card('pdd', t('pdDed'), '', V.hbars(d), tb(d)) + V.card('pdn', t('pdDept'), '', V.hbars(n), tb(n)) + '</div>');
}

function runView(body, id){
  body.innerHTML = '<div id="prRun"></div>';
  var el = $('#prRun', body);
  el.innerHTML = '<div class="list"><div class="row"><div class="main"><span class="sk" style="width:40%"></span><span class="sk"></span></div></div></div>';
  api('payrollGet', { id: id }, true).then(function(r){
    if (!r.ok) { S.prRun = null; return section(body); }
    var run = r.run, tt = run.totals, draft = run.status === 'draft';
    var grp = run.payGroupName || (r.run && r.run.payGroupName) || '';
    var kpi = function(label, val, cls){ return '<div class="pv-k' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><b class="num">' + val + '</b></div>'; };
    el.innerHTML = '<div class="pv"><header class="pv-top"><button type="button" class="iconbtn" id="prBack" aria-label="back">' + (S.lang === 'ar' ? I.chev : I.chevb) + '</button>' +
      '<div class="pv-tt"><h2>' + esc(monthName(run.month)) + (grp ? ' <em>' + esc(grp) + '</em>' : '') + ' <span class="pv-st pv-' + esc(run.status) + '">' + t('pr_' + run.status) + '</span></h2>' +
      '<p><bdi>' + esc(run.ref) + '</bdi> · ' + t('prPrepared') + ' ' + esc(run.preparedByName || '') + (run.approvedByName ? ' · ' + t('prApprovedBy') + ' ' + esc(run.approvedByName) : '') + '</p></div>' +
      '<div class="pv-acts">' + (draft ? '<button type="button" class="btn btn-line btn-sm" id="prRe">' + ph('arrows-clockwise') + t('prRecalc') + '</button>' +
        '<button type="button" class="btn btn-danger btn-sm" id="prDel">' + t('prDelete') + '</button>' : '<button type="button" class="btn btn-line btn-sm" id="prMail">' + ph('envelope-simple') + t('prEmail') + '</button>') +
      '<button type="button" class="btn btn-line btn-sm" id="prVar">' + ph('chart-line-up') + t('vaBtn') + '</button><button type="button" class="btn btn-line btn-sm" id="prXls">' + ph('microsoft-excel-logo') + t('prExport') + '</button>' +
      (draft && r.canApprove && (!r.prep || r.prep.complete) ? '<button type="button" class="btn btn-dark btn-sm" id="prOk">' + ph('seal-check') + t('prApprove') + '</button>' : '') + '</div></header>' +
      '<div class="pv-kpis">' + kpi(t('prHead'), tt.headcount || 0) + kpi(t('pvTotAdd'), money(tt.gross), 'add') + kpi(t('pvTotDed'), money(tt.deductions), 'ded') +
        kpi(t('prNet') + ' <small>' + t('mfSar') + '</small>', money(tt.net), 'net') + kpi(t('prGosiEr'), money(tt.gosiEmployer)) + '</div>' +
      (draft ? prepBanner(r) + '<p class="pv-hint">' + ph('info') + t('prApproveHint') + '</p>' : '') + '<div class="err" id="prMsg"></div>' +
      '<section class="pv-card pv-tblcard"><h3 class="pv-h3">' + ph('users-three') + t('pvStaff') + '</h3><div id="ptBox"></div></section>' +
      (window.Viz ? '<details class="pv-more"><summary>' + ph('chart-bar') + t('pvAnalysis') + '</summary>' + runDash(r) + '</details>' : '') +
      '<section class="pv-card"><h3 class="pv-h3">' + ph('sliders-horizontal') + t('prAdj') + '</h3><div id="prAdj"></div></section></div>';
    $('#prBack', el).onclick = function(){ S.prRun = null; section(body); };
    // the main variance engine for this run alone (2026-11-25; the old drawer mixed in other pay groups)
    $('#prVar', el).onclick = function(){ W2_FILES.concat(['js/variance.js']).reduce(function(p, f){ return p.then(function(){ return loadScript(f); }); }, Promise.resolve()).then(function(){ Variance.openRun(run); }, function(){ varianceView(run); }); };
    if ($('#pzGo', el)) { pzCss(); $('#pzGo', el).onclick = function(){ prepWizard(run.id, function(){ runView(body, id); }); }; }
    if (window.Viz) Viz.wire(el);
    slipTable($('#ptBox', el), r, run);
    var msg = $('#prMsg', el), act = function(action, done){ return function(){ this.disabled = true; var b = this; api(action, { id: run.id }).then(function(x){ b.disabled = false; if (!x.ok) { msg.textContent = errText(x.error); if (x.error === 'email_not_configured') msg.textContent = t('prEmailNo'); return; } done(x); }); }; };
    if ($('#prRe', el)) $('#prRe', el).onclick = act('payrollRecalc', function(){ toast(t('prRecalcDone')); runView(body, id); });
    // Locking is final and deleting loses the draft: both need a second tap within 4 s (the button says what will happen).
    var twice = function(key, handler){ return function(){
      var b = this;
      if (b.dataset.armed) { delete b.dataset.armed; b.innerHTML = b.dataset.old; return handler.call(b); }
      b.dataset.old = b.innerHTML; b.dataset.armed = '1'; b.textContent = t(key);
      setTimeout(function(){ if (b.isConnected && b.dataset.armed && !b.disabled) { delete b.dataset.armed; b.innerHTML = b.dataset.old; } }, 4000);
    }; };
    if ($('#prOk', el)) $('#prOk', el).onclick = function(){ approveWizard(r, run, function(){ toast(t('prApproved')); runView(body, id); }); };
    if ($('#prDel', el)) $('#prDel', el).onclick = twice('prSureDel', act('payrollDelete', function(){ S.prRun = null; section(body); }));
    if ($('#prMail', el)) $('#prMail', el).onclick = act('payrollEmail', function(x){
      toast(t('prEmailed') + ': ' + x.queued);
      var pump = function(n){ api('jobRun', {}, true).then(function(r){ if (r && r.ok && r.left > 0 && n < 60) setTimeout(function(){ pump(n + 1); }, 3000); else if (r && r.ok && r.dead > 0) toast(errText('email_send_failed')); }); };
      if (x.queued) pump(0);
    });
    $('#prXls', el).onclick = function(){ exportXls(run); };
    adjBox($('#prAdj', el), r, draft, function(){ api('payrollRecalc', { id: run.id }).then(function(){ runView(body, id); }); });
  });
}

/** The run's people as a payroll register in payslip order: name, number, department, basic, days worked, every other
 *  addition, total additions, each deduction, total deductions, net; then employer GOSI and company cost (2026-11-18). */
// PAY ORDER (docs/research/2026-11-18-pay-item-order-rea.md). One order for every payroll screen, payslip and export; the same list
// lives in js/variance.js and tests/payorder.js checks they agree. Earnings: the GOSI wage (basic, housing: the two WPS wage
// fields), fixed allowances, arrears, variable pay (overtime first: it is set by law), then non-wage payments. Deductions: GOSI
// (statutory) first, then the company's own sheet order: fines (traffic before other penalties), loan and advance instalments,
// leave and absence, the new joiner's unworked days ('join'), other deductions.
var PAY_ORDER = { e: ['basic', 'housing', 'transport', 'allowance', 'other_allowance', 'arrears', 'overtime', 'commission', 'incentive', 'bonus', 'per_diem', 'reimbursement', 'other_earning'],
  d: ['gosi', 'fine', 'advance', 'loan', 'unpaid_leave', 'sick_75', 'sick_unpaid', 'absence', 'late', 'join', 'other_deduction'] };
function payRank(kind, code, label){
  var ded = kind === 'deduction' || kind === 'd', c = code === 'other_deduction' && /انضمام|join/i.test(String(label || '')) ? 'join' : code, i = PAY_ORDER[ded ? 'd' : 'e'].indexOf(c);
  return (ded ? 1000 : 0) + (i < 0 ? 500 : i * 10) - (code === 'fine' && /مرور|traffic/i.test(String(label || '')) ? 1 : 0);
}
function pRank(kind, code, label){ return payRank(kind, code, label); }
function inOrder(ls){ return ls.slice().sort(function(a, b){ return pRank(a.kind, a.code, a.label) - pRank(b.kind, b.code, b.label) || String(a.label || '').localeCompare(String(b.label || '')); }); }
// a register column per pay item; lines that share a code but carry their own name (traffic fines vs other penalties, a named
// allowance, a new joiner's days) get their own column, the same split the variance screens use
// (a one-off adjustment carries its free-text reason as the label and a ref: those stay in the code's column)
function regKey(l){ var lb = String(l.label || '').trim(), split = lb && !l.ref && l.code !== 'basic' && l.code !== 'gosi' && l.code !== 'overtime';
  return (l.kind === 'deduction' ? 'd:' : 'e:') + l.code + (split ? ':' + lb.replace(/:/g, ' ') : ''); }
function slipTable(box, r, run){
  var st = { q: '', dept: '', k: 'name', up: true };
  var dn = function(s){ return (s.emp && (s.emp.deptName || s.emp.department)) || '-'; };
  var keys = {};
  var rows = r.slips.map(function(s){
    var x = { s: s, no: s.emp ? String(s.emp.empNo) : '', name: s.emp ? s.emp.name : '', dept: dn(s), days: +s.paidDays || 0, gross: +s.gross || 0, ded: +s.deductions || 0, net: +s.net || 0, er: +s.gosiEmployer || 0, cost: +s.companyCost || ((+s.gross || 0) + (+s.gosiEmployer || 0)) };
    (s.lines || []).forEach(function(l){ var k = regKey(l); keys[k] = 1; x['L' + k] = (x['L' + k] || 0) + (Number(l.amount) || 0); });
    return x; });
  var kp = function(k){ var p = k.split(':'); return { kind: p[0] === 'd' ? 'deduction' : 'earning', code: p[1], label: p.slice(2).join(':') }; };
  var ks = Object.keys(keys).sort(function(a, b){ var A = kp(a), B = kp(b); return pRank(A.kind, A.code, A.label) - pRank(B.kind, B.code, B.label) || A.label.localeCompare(B.label); });
  var ek = ks.filter(function(k){ return k[0] === 'e'; }), dk2 = ks.filter(function(k){ return k[0] === 'd'; });
  var hasBasic = ek[0] === 'e:basic', lname = function(k){ var o = kp(k); return o.label && o.code !== 'allowance' ? lab(o) + ' · ' + o.label : lab(o); };
  // columns: [sort key, label, kind]  kind: t = text, m = money, n = count, g = group total
  var cols = [['name', t('hrName'), 't'], ['no', t('ptNo'), 't'], ['dept', t('ptDept'), 't']]
    .concat(hasBasic ? [['Le:basic', lname('e:basic'), 'm']] : []).concat([['days', t('pvDays'), 'n']])
    .concat(ek.slice(hasBasic ? 1 : 0).map(function(k){ return ['L' + k, lname(k), 'm']; })).concat([['gross', t('pvTotAdd'), 'g']])
    .concat(dk2.map(function(k){ return ['L' + k, lname(k), 'm']; })).concat([['ded', t('pvTotDed'), 'g'], ['net', t('prNet'), 'net'], ['er', t('ptGosiEr'), 'm'], ['cost', t('ptCost'), 'g']]);
  var nAdd = ek.length + 2, nDed = dk2.length + 1;
  var depts = {}; rows.forEach(function(x){ depts[x.dept] = (depts[x.dept] || 0) + 1; });
  var dk = Object.keys(depts).sort(function(a, b){ return depts[b] - depts[a]; });
  var grpRow = '<tr class="pt-grp"><th colspan="3"></th><th colspan="' + nAdd + '" class="g-add">' + t('pvAdd') + '</th><th colspan="' + nDed + '" class="g-ded">' + t('pvDedG') + '</th><th class="g-net"></th><th colspan="2" class="g-cost">' + t('pvCostG') + '</th><th colspan="2"></th></tr>';
  var zone = function(i){ return i < 3 ? '' : i < 3 + nAdd ? ' z-add' : i < 3 + nAdd + nDed ? ' z-ded' : ''; };
  box.innerHTML = '<div class="pt-bar"><label class="pt-q">' + ph('magnifying-glass') + '<input type="search" id="ptQ" placeholder="' + t('ptSearch') + '" aria-label="' + t('ptSearch') + '"></label>' +
    (dk.length > 1 ? '<select id="ptD" aria-label="' + t('ptDept') + '"><option value="">' + t('ptAllDept') + '</option>' + dk.map(function(d){ return '<option value="' + esc(d) + '">' + esc(d) + ' (' + depts[d] + ')</option>'; }).join('') + '</select>' : '') +
    '<span class="pt-count" id="ptN"></span></div><div class="pt-wrap"><table class="pt pt-reg"><thead>' + grpRow + '<tr>' +
    cols.map(function(c, i){ return '<th data-k="' + esc(c[0]) + '" class="' + (c[2] === 't' ? '' : 'a') + (c[2] === 'g' || c[2] === 'net' ? ' tot' : '') + (i === 0 ? ' stick' : '') + zone(i) + '">' + esc(c[1]) + '</th>'; }).join('') +
    '<th>' + t('prWarn') + '</th><th aria-label="' + t('ptOpen') + '"></th></tr></thead><tbody id="ptB"></tbody><tfoot id="ptF"></tfoot></table></div>';
  var body = $('#ptB', box), foot = $('#ptF', box);
  var cell = function(x, c, i){ var k = c[0], v = x[k];
    if (k === 'name') return '<td class="nm stick"><b>' + esc(x.name) + '</b>' + (x.s.emp && x.s.emp.title ? '<small>' + esc(x.s.emp.title) + '</small>' : '') + '</td>';
    if (k === 'no') return '<td class="no">' + esc(x.no) + '</td>';
    if (k === 'dept') return '<td class="dp">' + esc(x.dept) + '</td>';
    if (c[2] === 'n') return '<td class="a' + zone(i) + '">' + (v || 0) + '</td>';
    return '<td class="a' + (c[2] === 'g' ? ' tot' : '') + (c[2] === 'net' ? ' net' : '') + zone(i) + '">' + acct(v || 0) + '</td>'; };
  function draw(){
    var q = st.q.trim().toLowerCase(), list = rows.filter(function(x){ return (!st.dept || x.dept === st.dept) && (!q || x.name.toLowerCase().indexOf(q) >= 0 || x.no.toLowerCase().indexOf(q) >= 0); });
    list.sort(function(a, b){ var A = a[st.k] || 0, B = b[st.k] || 0, c = typeof A === 'number' && typeof B === 'number' ? A - B : String(a[st.k] || '').localeCompare(String(b[st.k] || ''), st.k === 'no' ? 'en' : 'ar', { numeric: true }); return st.up ? c : -c; });
    body.innerHTML = list.length ? list.map(function(x){
      return '<tr data-s="' + esc(x.s.id) + '" tabindex="0" title="' + t('ptOpen') + '">' + cols.map(function(c, i){ return cell(x, c, i); }).join('') +
        '<td>' + warnChips(x.s.warnings) + '</td><td class="pt-go">' + ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') + '</td></tr>'; }).join('')
      : '<tr><td colspan="' + (cols.length + 2) + '" class="pt-none">' + t('ptNone') + '</td></tr>';
    var sum = function(k){ return list.reduce(function(a, x){ return a + (x[k] || 0); }, 0); };
    foot.innerHTML = '<tr>' + cols.map(function(c, i){ if (i === 0) return '<td class="stick">' + t('ptTotal') + ' <small>(' + list.length + ' ' + t('ptPeople') + ')</small></td>';
      if (c[2] === 't' || c[2] === 'n') return '<td' + (zone(i) ? ' class="' + zone(i).trim() + '"' : '') + '></td>';
      return '<td class="a' + (c[2] === 'g' ? ' tot' : '') + (c[2] === 'net' ? ' net' : '') + zone(i) + '">' + acct(sum(c[0])) + '</td>'; }).join('') + '<td colspan="2"></td></tr>';
    $('#ptN', box).textContent = t('ptShown') + ' ' + list.length + ' ' + t('ptOf') + ' ' + rows.length;
    $$('thead th[data-k]', box).forEach(function(th){ th.classList.toggle('on', th.dataset.k === st.k); th.classList.toggle('up', th.dataset.k === st.k && st.up); });
    $$('tr[data-s]', body).forEach(function(tr){ var go = function(){ openSlip(r.slips.filter(function(s){ return s.id === tr.dataset.s; })[0], null, { run: run }); };
      tr.onclick = go; tr.onkeydown = function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  }
  $('#ptQ', box).oninput = function(){ st.q = this.value; draw(); };
  if ($('#ptD', box)) $('#ptD', box).onchange = function(){ st.dept = this.value; draw(); };
  $$('thead th[data-k]', box).forEach(function(th){ th.onclick = function(){ var k = th.dataset.k; if (st.k === k) st.up = !st.up; else { st.k = k; st.up = !(th.classList.contains('a')); } draw(); }; });
  draw();
}

function adjBox(el, r, draft, changed){
  var names = {}; r.slips.forEach(function(s){ if (s.emp) names[s.emp.id] = s.emp.name; });
  var codes = ['overtime_hours', 'bonus', 'commission', 'other_earning', 'fine', 'other_deduction'];
  el.innerHTML = (r.adjustments.length ? '<div class="list">' + r.adjustments.map(function(a){
    return '<div class="row"><div class="main"><b>' + esc(a.empName) + '، ' + esc((L[S.lang] || L.ar)[a.code] || a.code) + '</b><small><bdi>' + esc(a.ref) + '</bdi>، ' + esc(a.reason) + (a.copiedFrom ? ' · ' + t('prAdjCopy') : '') + (a.kind === 'earning' || a.code === 'overtime_hours' ? ' · ' + ph('paperclip') + (a.docRef ? '<bdi>' + esc(a.docRef) + '</bdi>' : '<em>' + t('prAdjNoDoc') + '</em>') : '') + '</small></div><b class="num">' + (a.code === 'overtime_hours' ? a.amount : money(a.amount)) + '</b>' +
      (draft ? '<button type="button" class="btn btn-line btn-sm" data-adel="' + a.id + '">' + I.x + '</button>' : '') + '</div>';
  }).join('') + '</div>' : '<p class="hr-hint">' + t('prAdjNone') + '</p>') +
    (draft ? '<form class="form" id="adjF" style="margin-top:10px"><div class="two"><div class="field"><label>' + t('prAdjEmp') + '</label><select name="empId" required>' + Object.keys(names).filter(function(k){ return k !== S.me.id; }).map(function(k){ return '<option value="' + k + '">' + esc(names[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>' + t('prAdjCode') + '</label><select name="code">' + codes.map(function(c){ return '<option value="' + c + '">' + esc((L[S.lang] || L.ar)[c]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="field"><label>' + t('prAdjAmount') + '</label><input name="amount" type="number" min="0.01" step="0.01" required inputmode="decimal"></div><div class="field"><label>' + t('prAdjReason') + '</label><input name="reason" required maxlength="200"></div></div>' +
      '<div class="field" id="adjDocF"><label>' + t('prAdjDoc') + '</label><input name="docRef" maxlength="200" placeholder="' + t('prAdjDocPh') + '"><small class="hr-hint">' + t('prAdjDocNeed') + '</small></div>' +
      '<div class="err" id="adjErr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark btn-sm">' + ph('plus') + t('prAdjAdd') + '</button></div></form>' : '');
  $$('[data-adel]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('payrollAdjDelete', { id: b.dataset.adel }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } changed(); }); }; });
  var f = $('#adjF', el);
  // a deduction needs no document; an addition or overtime hours does (the server refuses it without one)
  if (f) { var syncDoc = function(){ var c = f.elements.code.value, need = c === 'overtime_hours' || c === 'bonus' || c === 'commission' || c === 'other_earning'; $('#adjDocF', el).hidden = !need; f.elements.docRef.required = need; }; f.elements.code.onchange = syncDoc; syncDoc(); }
  if (f) f.onsubmit = function(ev){ ev.preventDefault(); var v = {}; Array.prototype.forEach.call(f.elements, function(x){ if (x.name) v[x.name] = x.value; }); v.month = r.run.month;
    var b = f.querySelector('button'); b.disabled = true;
    api('payrollAdjSave', { adj: v }).then(function(x){ b.disabled = false; if (!x.ok) return $('#adjErr', el).textContent = errText(x.error); changed(); }); };
}

function exportXls(run){
  Promise.all([xlsx(), api('payrollExport', { id: run.id })]).then(function(rs){
    var r = rs[1]; if (!r.ok) return toast(errText(r.error));
    var wb = XLSX.utils.book_new();
    var head = ['Employee No', 'National ID / Iqama', 'Name', 'Bank', 'IBAN', 'Basic', 'Housing', 'Other earnings', 'Deductions', 'Net', 'Payslip'];
    var ws = XLSX.utils.aoa_to_sheet([head].concat(r.rows.map(function(x){ return [x.empNo, x.nationalId, x.name, x.bankName, x.iban, x.basic, x.housing, x.other, x.deductions, x.net, x.ref]; })));
    ws['!cols'] = head.map(function(){ return { wch: 18 }; });
    XLSX.utils.book_append_sheet(wb, ws, 'WPS');
    var gl = [['Department', 'Cost centre', 'Employees', 'Gross (salary expense)', 'Employer GOSI (expense)', 'Employee GOSI (payable)', 'Other deductions', 'Net (payable to staff)']].concat(r.departments.map(function(d){
      return [d.department || '-', d.costCenter || '', d.headcount, d.gross, d.gosiEmployer, d.gosiEmployee, Math.round((d.deductions - d.gosiEmployee) * 100) / 100, d.net]; }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gl), 'Accounting');
    XLSX.writeFile(wb, 'payroll-' + run.month + '-' + run.ref + '.xlsx');
  }, function(){ toast(t('imLibFail')); });
}

function eosBox(el){
  el.innerHTML = '<form class="form" id="eosF"><div class="two"><div class="field"><label>' + t('prEosEmp') + '</label><select name="empId" id="eosEmp"></select></div>' +
    '<div class="field"><label>' + t('prEosLast') + '</label><input type="date" name="lastDay" value="' + riyadhToday() + '" required></div></div>' +
    '<div class="field"><label>' + t('prEosReason') + '</label><select name="reason">' + ['resignation', 'termination', 'contract_end', 'art81', 'art87_force_majeure', 'art87_marriage', 'art87_childbirth', 'art80'].map(function(x){ return '<option value="' + x + '">' + t('eos_' + x) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>' + t('a77Label') + '</label><select name="art77"><option value="">' + t('a77None') + '</option><option value="employer">' + t('a77Employer') + '</option><option value="employee">' + t('a77Employee') + '</option></select></div>' +
    '<div class="btnrow"><button class="btn btn-line btn-sm">' + ph('calculator') + t('prEosCalc') + '</button></div><div id="eosOut"></div></form>';
  apiFresh('hrBootstrap', {}, function(r){
    var sel = $('#eosEmp', el); if (!sel) return;
    if (!r.ok) { var i = document.createElement('input'); i.name = 'empNo'; i.required = true; i.inputMode = 'numeric'; i.placeholder = t('empNo'); sel.replaceWith(i); return; }
    sel.innerHTML = r.rows.filter(function(e){ return e.status === 'active'; }).map(function(e){ return '<option value="' + e.id + '">' + esc(e.name + ' (' + e.empNo + ')') + '</option>'; }).join('');
  }, true);
  $('#eosF', el).onsubmit = function(ev){
    ev.preventDefault(); var f = this, out = $('#eosOut', el);
    api('eosQuote', { empId: f.elements.empId ? f.elements.empId.value : '', empNo: f.elements.empNo ? f.elements.empNo.value : '', lastDay: f.elements.lastDay.value, reason: f.elements.reason.value, art77: f.elements.art77 ? f.elements.art77.value : '' }).then(function(r){
      if (!r.ok) { out.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
      var q = r.eos, name = f.elements.empId && f.elements.empId.selectedOptions && f.elements.empId.selectedOptions[0] ? f.elements.empId.selectedOptions[0].textContent : (f.elements.empNo ? f.elements.empNo.value : '');
      out.innerHTML = eosHtml(q) + '<div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="eosPrint">' + ph('printer') + t('prEosPrint') + '</button></div>';
      $('#eosPrint', out).onclick = function(){ printEos(q, name); };
    });
  };
}

/** The settlement statement: every figure with the article it comes from. */
function eosHtml(q){
  var row = function(label, note, val, neg){ return '<dt>' + label + (note ? '<small>' + note + '</small>' : '') + '</dt><dd>' + (neg ? '- ' : '') + money(val) + '</dd>'; };
  return '<div class="pr-slip"><h4>' + t('prEosService') + '</h4><dl>' +
    '<dt>' + t('prEosPeriod') + '</dt><dd>' + esc(q.hireDate) + ' - ' + esc(q.lastDay) + '</dd>' +
    '<dt>' + t('prEosYears') + (q.unpaidExcluded ? '<small>' + t('prEosExcluded') + ': ' + plural(q.unpaidExcluded, 'days') + ' (116)</small>' : '') + '</dt><dd>' + plural(q.serviceDays, 'days') + '، ' + q.years + ' ' + t('prYears') + '</dd>' +
    '<dt>' + t('prEosWage') + '<small>' + (q.basis === 'basic_housing' ? t('prEosBasisBH') : t('prEosBasisT')) + '</small></dt><dd>' + money(q.wage) + '</dd></dl>' +
    '<h4>' + t('prEosAward') + '</h4><dl>' + row(t('prEosFirst5'), '½ × ' + Math.min(q.years, 5).toFixed(2) + ' (84)', q.first5) +
    (q.after5 ? row(t('prEosAfter5'), '1 × ' + (q.years - 5).toFixed(2) + ' (84)', q.after5) : '') +
    row(t('prEosFull'), '', q.fullAward) + '<dt>' + t('prEosFactor') + '<small>' + t('eos_' + q.reason) + '</small></dt><dd>' + Math.round(q.factor * 100) + '%</dd>' +
    '<dt style="font-weight:600">' + t('prEosAward') + '</dt><dd style="font-weight:600">' + money(q.award) + '</dd></dl>' +
    '<h4>' + t('prEosSettlement') + '</h4><dl>' + row(t('prEosAward'), '', q.award) + row(t('prEosLeave'), plural(Math.round(q.leaveDays * 10) / 10, 'days') + ' (111)', q.leavePay) +
    row(t('prEosLastMonth'), q.lastMonthLocked ? t('prEosLastLocked') : plural(q.lastMonthDays, 'days'), q.lastMonthPay) +
    (q.art77 && q.art77.party === 'employer' ? row(t('a77Label'), t(q.art77.basis === 'fixed_remaining' ? 'a77Fixed' : 'a77Open') + (q.art77.computed < q.art77.minimum ? ' · ' + t('a77Min') : '') + ' (77)', q.art77.amount) : '') +
    (q.advances ? row(t('prEosAdvances'), '', q.advances, true) : '') + '</dl>' +
    (q.art77 && q.art77.party === 'employee' ? '<dl><dt>' + t('a77Claim') + '<small>' + t(q.art77.basis === 'fixed_remaining' ? 'a77Fixed' : 'a77Open') + ' (77)</small></dt><dd>' + money(q.art77.amount) + '</dd></dl><p class="hr-hint">' + t('w_art77_claim_not_deducted') + '</p>' : '') +
    '<dl class="tot"><dt>' + t('prEosNet') + '</dt><dd>' + money(q.net) + ' ' + t('mfSar') + '</dd></dl>' +
    '<p class="hr-hint">' + t('prEosDue') + ' ' + esc(q.dueBy) + ' (' + plural(q.dueDays, 'days') + '، 88)</p></div>';
}
function printEos(q, name){
  var en = S.lang === 'en';
  var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>EOS</title>' +
    '<link href="' + FONTS_CSS + '" rel="stylesheet"><style>@page{size:A4;margin:16mm}body{font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;color:var(--g-17221A,#17221A);font-size:13px}' +
    'header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--brand);padding-bottom:12px}header img{height:54px}h1{font-size:20px;margin:14px 0 4px}' +
    '.pr-slip h4{margin:14px 0 4px;font-size:13px;color:var(--g-4A5A4D,#4A5A4D)}.pr-slip dl{display:grid;grid-template-columns:1fr auto;margin:0}.pr-slip dt,.pr-slip dd{padding:4px 0;border-bottom:1px solid #E5E1D6;margin:0}' +
    '.pr-slip dd{text-align:end;font-variant-numeric:tabular-nums}.pr-slip dt small{color:#6B786D;margin-inline-start:8px}.tot dt,.tot dd{font-weight:600;font-size:16px;border:0}.hr-hint{color:var(--g-4A5A4D,#4A5A4D)}' +
    '.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:40px}.sign div{border-top:1px solid #999;padding-top:6px;font-size:12px;color:var(--g-4A5A4D,#4A5A4D)}</style></head><body>' +
    '<header><img src="' + logoInk() + '" alt=""><div style="text-align:end;font-size:12px;color:var(--g-4A5A4D,#4A5A4D)">' + esc(coName(en ? 'en' : 'ar')) + (en ? '<br>Final settlement' : '<br>مخالصة نهائية') + '</div></header>' +
    '<h1>' + (en ? 'End-of-service and final settlement' : 'مكافأة نهاية الخدمة والمخالصة النهائية') + '</h1><p>' + esc(name || '') + '</p>' + eosHtml(q) +
    '<div class="sign"><div>' + (en ? 'Prepared by (HR)' : 'أعده (الموارد البشرية)') + '</div><div>' + (en ? 'Approved by (Finance)' : 'اعتمده (المالية)') + '</div><div>' + (en ? 'Received by the employee' : 'استلمه الموظف') + '</div></div>' +
    '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(window.brandVarsCss ? String(html).replace(/<head>/i, '<head><style>' + brandVarsCss() + '</style>') : html); w.document.close(); if (window.docBar) docBar(w);
}

/** The total rewards statement: a year's cash pay and what the company pays on the person's behalf, printable. */
function totalRewards(empId){
  var d = drawer('<h3>' + t('trTitle') + '</h3><p class="hr-hint">' + t('trLead') + '</p><div id="trB"></div>'), el = $('#trB', d);
  el.innerHTML = '<p class="hr-hint">…</p>';
  api('myTotalRewards', empId ? { empId: empId } : {}, true).then(function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    if (r.none) return el.innerHTML = '<p>' + t('trNone') + '</p>';
    var lab = function(l){ return l.code === 'allowance' ? esc(l.label) : t('tr_' + l.code); };
    var tbl = function(list){ return '<table class="tbl" style="width:100%"><tbody>' + list.map(function(l){ return '<tr><td>' + lab(l) + (l.code === 'gosi_employer' ? ' <small>(' + l.rate + '%)</small>' : '') + (l.code === 'medical' && l.people > 1 ? ' <small>(' + l.people + ')</small>' : '') + '</td><td class="num" style="text-align:end">' + money(l.annual) + '</td></tr>'; }).join('') + '</tbody></table>'; };
    var pct = r.total ? Math.round(r.companyTotal / r.total * 100) : 0;
    el.innerHTML = '<div class="fp-big"><b class="num">' + money(r.total) + '</b><span>' + t('trYear') + '</span></div>' +
      '<div class="tr-bar" style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin:10px 0 4px"><i style="flex:' + r.cashTotal + ';background:var(--brand)"></i><i style="flex:' + r.companyTotal + ';background:var(--brand-lite,#3D8559)"></i></div>' +
      '<p class="hr-hint" style="margin:0 0 12px">' + t('trSplit').replace('{a}', 100 - pct).replace('{b}', pct) + '</p>' +
      '<h4 style="margin:6px 0">' + t('trCash') + ' · ' + money(r.cashTotal) + '</h4>' + tbl(r.cash) +
      '<h4 style="margin:14px 0 6px">' + t('trCompany') + ' · ' + money(r.companyTotal) + '</h4>' + tbl(r.company) +
      '<p class="hr-hint" style="margin-top:12px">' + t('trLeave').replace('{d}', r.leave.days).replace('{v}', money(r.leave.value)) + '</p>' +
      '<p class="hr-hint">' + t('trAsOf') + ' ' + esc(r.asOf) + '</p><div class="btnrow"><button type="button" class="btn btn-dark btn-sm" id="trPrint">' + ph('printer') + t('trPrint') + '</button></div>';
    $('#trPrint', el).onclick = function(){ window.print(); };
  });
}
// ======================================================================= variance analysis (2026-11-04)
Object.assign(T.ar, { vaBtn:'تحليل الفروقات', vaTitle:'تحليل فروقات الرواتب', vaLead:'كل رقم في هذا المسير مقارنا بالشهرين السابقين: الإجماليات، الإدارات، بنود الراتب، وكل موظف مرتبا من الأعلى خطورة.',
  vaM1:'الشهر السابق', vaM2:'قبل شهرين', vaAvg:'متوسط الشهرين', vaNow:'هذا المسير', vaHead:'عدد الموظفين', vaGross:'الإجمالي المستحق', vaDed:'الاستقطاعات', vaNet:'صافي الرواتب', vaGosiE:'تأمينات الموظف', vaGosiR:'تأمينات الشركة', vaCost:'تكلفة الشركة',
  vaDrivers:'محركات التغيّر للموظفين المستمرين', drv_pay:'الراتب والبدلات', drv_overtime:'العمل الإضافي', drv_oneoff:'مكافآت ومبالغ لمرة', drv_absence:'غياب وإجازات بلا أجر', drv_gosi:'التأمينات (حصة الموظف)', drv_advances:'السلف', drv_fines:'الجزاءات', drv_otherDeductions:'استقطاعات أخرى', drv_other:'أخرى',
  vaVolRate:'عدد الموظفين أم الأجور؟', vaHeadEff:'أثر عدد الموظفين', vaRateEff:'أثر متوسط الأجر', vaAvgNow:'متوسط الصافي الآن', vaTrend:'تكلفة الرواتب آخر 12 شهرا', vaExp:'الباقات المعتمدة مقابل المصروف', vaPkg:'مجموع الباقات',
  vaBridge:'من أين جاء الفرق في الصافي؟', vaFrom:'صافي الشهر السابق', vaJoin:'موظفون جدد', vaLeave:'موظفون غادروا', vaStay:'تغيرات المستمرين', vaTo:'صافي هذا المسير',
  vaDepts:'حسب الإدارة / مركز التكلفة', vaLines:'حسب بند الراتب', vaPeople:'الموظفون (الأعلى خطورة أولا)', vaFilter:'عرض', vaAll:'الكل', vaFlagged:'بها ملاحظات', vaUp:'زيادة', vaDown:'نقص', vaNew:'جدد', vaGone:'غادروا',
  vaThr:'حد الفرق', vaPct:'٪', vaMin:'ريال', vaApply:'تطبيق', vaCsv:'تصدير التقرير (CSV)', vaNoPrev:'لا يوجد مسير للشهرين السابقين بعد: كل الموظفين يظهرون جددا. تكتمل المقارنة من الشهر القادم.',
  vaLine:'البند', vaChange:'التغير', vaScore:'الخطورة', vaWhy:'الملاحظات', vaPeopleN:'موظف',
  vf_joiner:'موظف جديد', vf_returner:'عاد بعد انقطاع', vf_leaver:'غادر (صرف سابقا ولا يظهر الآن)', vf_net_up:'زيادة كبيرة في الصافي', vf_net_down:'نقص كبير في الصافي', vf_deductions_spike:'قفزة في الاستقطاعات',
  vf_package_change:'تغير في الراتب الأساسي أو البدلات', vf_new_line:'بند جديد', vf_gone_line:'بند اختفى', vf_net_zero:'صافي صفر أو سالب', vf_one_off:'مبالغ لمرة واحدة (مكافأة / إضافي)', vf_absence:'خصم غياب أو إجازة بدون راتب' });
Object.assign(T.en, { vaBtn:'Variance analysis', vaTitle:'Payroll variance analysis', vaLead:'Every number in this run against the two months before it: totals, departments, pay lines, and every employee, riskiest first.',
  vaM1:'Last month', vaM2:'Two months ago', vaAvg:'Two-month average', vaNow:'This run', vaHead:'Headcount', vaGross:'Gross pay', vaDed:'Deductions', vaNet:'Net pay', vaGosiE:'GOSI (employee)', vaGosiR:'GOSI (company)', vaCost:'Company cost',
  vaDrivers:'What moved pay for people paid both months', drv_pay:'Salary and allowances', drv_overtime:'Overtime', drv_oneoff:'Bonuses and one-offs', drv_absence:'Absence and unpaid leave', drv_gosi:'GOSI (employee share)', drv_advances:'Advances', drv_fines:'Penalties', drv_otherDeductions:'Other deductions', drv_other:'Other',
  vaVolRate:'More people, or different pay?', vaHeadEff:'Headcount effect', vaRateEff:'Average pay effect', vaAvgNow:'Average net now', vaTrend:'Payroll cost, last 12 months', vaExp:'Approved packages vs paid', vaPkg:'Packages total',
  vaBridge:'Where the change in net comes from', vaFrom:'Last month net', vaJoin:'Joiners', vaLeave:'Leavers', vaStay:'Changes for people who stayed', vaTo:'This run net',
  vaDepts:'By department / cost centre', vaLines:'By pay line', vaPeople:'Employees (riskiest first)', vaFilter:'Show', vaAll:'All', vaFlagged:'Flagged', vaUp:'Up', vaDown:'Down', vaNew:'Joiners', vaGone:'Leavers',
  vaThr:'Threshold', vaPct:'%', vaMin:'SAR', vaApply:'Apply', vaCsv:'Export the report (CSV)', vaNoPrev:'No run exists for the two previous months yet: everyone shows as a joiner. The comparison completes from next month.',
  vaLine:'Line', vaChange:'Change', vaScore:'Risk', vaWhy:'Notes', vaPeopleN:'employees',
  vf_joiner:'Joiner', vf_returner:'Back after a gap', vf_leaver:'Left (paid before, not now)', vf_net_up:'Big rise in net', vf_net_down:'Big drop in net', vf_deductions_spike:'Deductions spike',
  vf_package_change:'Basic or allowances changed', vf_new_line:'New line', vf_gone_line:'Line disappeared', vf_net_zero:'Net zero or negative', vf_one_off:'One-off amounts (bonus / overtime)', vf_absence:'Absence or unpaid leave deduction' });
(function(){ var st = document.createElement('style'); st.textContent =
  '.va .va-kp{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:12px 0}' +
  '.va .va-k{background:var(--frame,#fff);border:1px solid var(--line-2,#E6E1D6);border-radius:14px;padding:14px}' +
  '.va .va-k span{display:block;font-size:12px;color:var(--ink-3)}.va .va-k b{display:block;font-size:22px;margin:4px 0;font-variant-numeric:tabular-nums}' +
  '.va .va-d{display:flex;gap:8px;flex-wrap:wrap;font-size:12px}.va .va-d i{font-style:normal;padding:2px 8px;border-radius:999px;background:var(--well,#F3F5F8)}' +
  '.va .up{color:#B42318}.va .dn{color:#027A48}.va .va-d i.up{background:#FEE4E2}.va .va-d i.dn{background:#D1FADF}' +
  '.va .va-br{display:flex;align-items:flex-end;gap:6px;height:180px;padding:10px 4px;border-bottom:1px solid var(--line,#ddd);margin:8px 0 4px}' +
  '.va .va-br div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px;font-size:11px;text-align:center}' +
  '.va .va-br i{display:block;width:70%;border-radius:6px 6px 0 0;background:var(--brand,#2F5D8C)}.va .va-br i.pos{background:#2a78d6}.va .va-br i.neg{background:#C98500}' +
  '.va .va-trend{height:170px}.va .va-trend i{background:color-mix(in srgb,var(--brand) 55%,#fff)}.va .va-trend div:last-child i{background:var(--brand)}' +
  '.va .va-rs{display:flex;flex-direction:column;gap:2px;margin-top:4px}.va .va-rs small{color:var(--ink-2)}' +
  '.va .va-tbl td,.va .va-tbl th{font-variant-numeric:tabular-nums;white-space:nowrap}.va .va-tbl tr.open+tr.det{display:table-row}.va .va-tbl tr.det{display:none;background:var(--well,#F7F8FA)}' +
  '.va .va-sc{display:inline-grid;place-items:center;min-width:34px;height:24px;border-radius:999px;font-weight:700;font-size:12px;color:#fff}' +
  '.va .va-fl{display:flex;gap:4px;flex-wrap:wrap}.va .va-fl small{padding:2px 8px;border-radius:999px;background:#FEF0C7;color:#93370D;font-size:11px}' +
  '.va .va-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.va .va-bar button[aria-pressed="true"]{background:var(--brand,#2F5D8C);color:#fff;border-color:var(--brand,#2F5D8C)}' +
  '.va .va-bar input{width:72px}';
  document.head.appendChild(st); })();
function varianceView(run, pct, min){
  var d = drawer('<div class="va"><h3>' + t('vaTitle') + ' · ' + esc(monthName(run.month)) + '</h3><p class="hr-hint">' + t('vaLead') + '</p><div id="vaB"><div class="list"><div class="row"><span class="sk" style="width:60%"></span></div></div></div></div>', { wide: true });
  api('payrollVariance', { id: run.id, pct: pct, min: min }, true).then(function(r){
    var B = $('#vaB', d); if (!r.ok) return B.innerHTML = '<p class="hr-bad">' + esc(errText(r.error)) + '</p>';
    var fmt = function(n){ return n === null || n === undefined ? '-' : money(n); };
    var pc = function(c, whole){ if (!c) return '<i>-</i>'; var up = c.diff > 0, cls = c.diff === 0 ? '' : (up ? 'up' : 'dn'); return '<i class="' + cls + '">' + (c.diff > 0 ? '+' : '') + (whole ? Math.round(c.diff) : money(c.diff)) + (c.pct === null ? '' : ' · ' + (c.pct > 0 ? '+' : '') + c.pct + '%') + '</i>'; };
    var K = [['headcount', 'vaHead'], ['gross', 'vaGross'], ['deductions', 'vaDed'], ['net', 'vaNet'], ['gosiEmployee', 'vaGosiE'], ['gosiEmployer', 'vaGosiR'], ['companyCost', 'vaCost']];
    var tiles = K.map(function(k){ var x = r.totals[k[0]]; return '<div class="va-k"><span>' + t(k[1]) + '</span><b>' + (k[0] === 'headcount' ? x.m0 : money(x.m0)) + '</b><div class="va-d"><span>' + t('vaM1') + '</span>' + pc(x.vsM1, k[0] === 'headcount') + '</div><div class="va-d"><span>' + t('vaM2') + '</span>' + pc(x.vsM2, k[0] === 'headcount') + '</div><div class="va-d"><span>' + t('vaAvg') + '</span>' + pc(x.vsAvg, k[0] === 'headcount') + '</div></div>'; }).join('');
    var b = r.bridge, DK = ['pay', 'overtime', 'oneoff', 'absence', 'gosi', 'advances', 'fines', 'otherDeductions', 'other'], dr = r.drivers || {};
    var mid = [[t('vaJoin'), b.joiners], [t('vaLeave'), b.leavers]].concat(r.drivers ? DK.map(function(k){ return [t('drv_' + k), dr[k] || 0]; }) : [[t('vaStay'), b.stayers]]);
    var steps = [[t('vaFrom'), b.from, '']].concat(mid.filter(function(x){ return Math.abs(x[1]) >= 0.01; }).map(function(x){ return [x[0], x[1], x[1] >= 0 ? 'pos' : 'neg']; }), [[t('vaTo'), b.to, '']]);
    var mx = Math.max.apply(null, steps.map(function(x){ return Math.abs(x[1]) || 1; }));
    var vr = r.volumeRate, ex = r.expected, tr = (r.trend || []).filter(function(p){ return !p.none; }), tmx = Math.max.apply(null, tr.map(function(p){ return p.companyCost; }).concat([1]));
    var deeper = (vr ? '<h4>' + t('vaVolRate') + '</h4><div class="va-kp"><div class="va-k"><span>' + t('vaHeadEff') + '</span><b>' + money(vr.headcountEffect) + '</b></div><div class="va-k"><span>' + t('vaRateEff') + '</span><b>' + money(vr.rateEffect) + '</b></div><div class="va-k"><span>' + t('vaAvgNow') + '</span><b>' + money(vr.avgNow) + '</b><div class="va-d"><span>' + t('vaM1') + '</span><i>' + money(vr.avgBefore) + '</i></div></div>' +
        (ex && ex.package ? '<div class="va-k"><span>' + t('vaExp') + '</span><b>' + money(ex.actual) + '</b><div class="va-d"><span>' + t('vaPkg') + ' ' + money(ex.package) + '</span>' + pc(ex.diff) + '</div></div>' : '') + '</div>' : '') +
      (r.trend ? '<h4>' + t('vaTrend') + '</h4><div class="va-br va-trend">' + r.trend.map(function(p){ return '<div title="' + esc(monthName(p.month)) + (p.none ? '' : ': ' + money(p.companyCost)) + '">' + (p.none ? '<b>-</b><i style="height:4px;opacity:.25"></i>' : '<b>' + Math.round(p.companyCost / 1000) + 'k</b><i style="height:' + Math.max(4, Math.round(p.companyCost / tmx * 120)) + 'px"></i>') + '<span>' + esc(monthName(p.month).split(' ')[0]) + (p.none ? '' : '<br>' + p.headcount) + '</span></div>'; }).join('') + '</div>' : '');
    var bridge = '<h4>' + t('vaBridge') + '</h4><div class="va-br">' + steps.map(function(x){ return '<div><b>' + money(x[1]) + '</b><i class="' + x[2] + '" style="height:' + Math.max(4, Math.round(Math.abs(x[1]) / mx * 130)) + 'px"></i><span>' + esc(x[0]) + '</span></div>'; }).join('') + '</div>';
    var tbl = function(head, rows){ return '<div class="tblwrap"><table class="tbl va-tbl"><thead><tr>' + head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; };
    var lineName = function(c){ var parts = c.split(':'), code = parts[1], lab = parts.slice(2).join(':'); return esc((typeof lab === 'string' && lab) ? lab : (L[S.lang] || L.ar)[code] || code) + (parts[0] === 'd' ? ' <small>(−)</small>' : ''); };
    var depts = tbl([t('vaDepts'), t('vaNow'), t('vaM1'), t('vaM2'), t('vaChange')], r.departments.map(function(x){ return '<tr><td>' + esc(x.name) + (x.costCenter ? ' <small dir="ltr">' + esc(x.costCenter) + '</small>' : '') + ' <small>(' + x.m0.head + ')</small></td><td>' + money(x.m0.net) + '</td><td>' + money(x.m1.net) + '</td><td>' + money(x.m2.net) + '</td><td class="va-d">' + pc(x.vsM1) + '</td></tr>'; }));
    var lines = tbl([t('vaLine'), t('vaNow'), t('vaM1'), t('vaM2'), t('vaChange')], r.lines.map(function(x){ return '<tr><td>' + lineName(x.code) + ' <small>(' + x.people.m0 + ')</small></td><td>' + money(x.m0) + '</td><td>' + money(x.m1) + '</td><td>' + money(x.m2) + '</td><td class="va-d">' + pc(x.vsM1) + '</td></tr>'; }));
    var flagTxt = function(f){ var p2 = f.split(':'); return t('vf_' + p2[0]) + (p2[1] ? ': ' + lineName(p2.slice(1).join(':')) : ''); };
    var scoreCol = function(n){ return n >= 60 ? '#D92D20' : n >= 30 ? '#F79009' : n > 0 ? '#2E90FA' : '#98A2B3'; };
    var filt = 'flagged';
    var rowsFor = function(){ return r.people.filter(function(x){
      if (filt === 'all') return true; if (filt === 'flagged') return x.flags.length > 0;
      if (filt === 'up') return x.netVsM1 && x.netVsM1.diff > 0; if (filt === 'down') return x.netVsM1 && x.netVsM1.diff < 0;
      if (filt === 'new') return x.flags.indexOf('joiner') >= 0 || x.flags.indexOf('returner') >= 0; if (filt === 'gone') return x.flags.indexOf('leaver') >= 0; return true; }); };
    var peopleTbl = function(){ var list = rowsFor(); return tbl([t('vaScore'), t('hrName'), t('vaNow'), t('vaM1'), t('vaM2'), t('vaChange'), t('vaWhy')], list.map(function(x, i){
      var det = '<tr class="det"><td colspan="7">' + tbl([t('vaLine'), t('vaNow'), t('vaM1'), t('vaM2')], Object.keys(x.lines).map(function(c){ var v = x.lines[c]; var ch = v[0] !== v[1]; return '<tr' + (ch ? ' style="font-weight:600"' : '') + '><td>' + lineName(c) + '</td><td>' + money(v[0]) + '</td><td>' + money(v[1]) + '</td><td>' + money(v[2]) + '</td></tr>'; })) + '</td></tr>';
      return '<tr class="click" data-i="' + i + '"><td><span class="va-sc" style="background:' + scoreCol(x.score) + '">' + x.score + '</span></td><td><b style="font-weight:500">' + esc(x.name) + '</b> <small dir="ltr">' + esc(x.empNo) + '</small><br><small>' + esc(x.department) + '</small></td>' +
        '<td>' + fmt(x.m0 && x.m0.net) + '</td><td>' + fmt(x.m1 && x.m1.net) + '</td><td>' + fmt(x.m2 && x.m2.net) + '</td><td class="va-d">' + pc(x.netVsM1) + '</td><td><div class="va-fl">' + x.flags.map(function(f){ return '<small>' + flagTxt(f) + '</small>'; }).join('') + '</div>' + (x.reasons && x.reasons.length ? '<div class="va-rs">' + x.reasons.map(function(q){ return '<small>' + lineName(q.line) + ': <bdi class="num">' + money(q.from) + ' → ' + money(q.to) + '</bdi></small>'; }).join('') + '</div>' : '') + '</td></tr>' + det; })) + '<p class="hr-hint">' + list.length + ' ' + t('vaPeopleN') + '</p>'; };
    var F = [['flagged', 'vaFlagged'], ['all', 'vaAll'], ['up', 'vaUp'], ['down', 'vaDown'], ['new', 'vaNew'], ['gone', 'vaGone']];
    B.innerHTML = (!r.months.have1 && !r.months.have2 ? '<p class="hr-hint" style="background:#FEF0C7;padding:10px 12px;border-radius:10px">' + t('vaNoPrev') + '</p>' : '') +
      '<p class="hr-hint">' + t('vaNow') + ': <b>' + esc(monthName(r.months.m0)) + '</b> · ' + t('vaM1') + ': ' + esc(monthName(r.months.m1)) + ' · ' + t('vaM2') + ': ' + esc(monthName(r.months.m2)) + '</p>' +
      '<div class="va-kp">' + tiles + '</div>' + bridge + deeper + '<h4>' + t('vaDepts') + '</h4>' + depts + '<h4>' + t('vaLines') + '</h4>' + lines +
      '<h4>' + t('vaPeople') + '</h4><div class="va-bar"><span>' + t('vaFilter') + ':</span>' + F.map(function(f){ return '<button type="button" class="btn btn-line btn-sm" data-f="' + f[0] + '" aria-pressed="' + (f[0] === filt) + '">' + t(f[1]) + ' (' + (f[0] === 'all' ? r.people.length : r.people.filter(function(x){ var o = filt; filt = f[0]; var keep = rowsFor().indexOf(x) >= 0; filt = o; return keep; }).length) + ')</button>'; }).join('') +
      '<span style="margin-inline-start:auto">' + t('vaThr') + '</span><input type="number" id="vaP" min="1" max="100" value="' + r.threshold.pct + '">' + t('vaPct') + '<input type="number" id="vaM" min="0" value="' + r.threshold.min + '">' + t('vaMin') + '<button type="button" class="btn btn-line btn-sm" id="vaGo">' + t('vaApply') + '</button>' +
      '<button type="button" class="btn btn-dark btn-sm" id="vaCsv">' + ph('download-simple') + t('vaCsv') + '</button></div><div id="vaPpl">' + peopleTbl() + '</div>';
    var wirePeople = function(){ $$('#vaPpl tr.click', B).forEach(function(tr){ tr.onclick = function(){ tr.classList.toggle('open'); }; }); };
    wirePeople();
    $$('[data-f]', B).forEach(function(btn){ btn.onclick = function(){ filt = btn.dataset.f; $$('[data-f]', B).forEach(function(x){ x.setAttribute('aria-pressed', String(x === btn)); }); $('#vaPpl', B).innerHTML = peopleTbl(); wirePeople(); }; });
    $('#vaGo', B).onclick = function(){ d.remove(); varianceView(run, Number($('#vaP', B).value), Number($('#vaM', B).value)); };
    $('#vaCsv', B).onclick = function(){
      var q = function(v){ return '"' + csvText(String(v === null || v === undefined ? '' : v)).replace(/"/g, '""') + '"'; };
      var rows = [[t('vaScore'), t('hrName'), 'No', t('vaDepts'), t('vaNow'), t('vaM1'), t('vaM2'), t('vaChange'), '%', t('vaWhy')].map(q).join(',')];
      r.people.forEach(function(x){ rows.push([x.score, x.name, x.empNo, x.department, x.m0 && x.m0.net, x.m1 && x.m1.net, x.m2 && x.m2.net, x.netVsM1 && x.netVsM1.diff, x.netVsM1 && x.netVsM1.pct, x.flags.map(flagTxt).join(' | ').replace(/<[^>]+>/g, '')].map(q).join(',')); });
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'variance-' + run.month + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
  });
}

window.Payroll = { prepWizard: prepWizard, section: section, myCard: myCard, totalRewards: totalRewards, openSlip: openSlip, openSlipRef: openSlipRef, printSlip: printSlip, variance: varianceView };
})();
