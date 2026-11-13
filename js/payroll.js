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
  pr_draft:'مسودة', ptNo:'الرقم', ptDept:'الإدارة / مركز التكلفة', ptShare:'النسبة من الإجمالي', ptGosiEr:'تأمينات الشركة', ptCost:'تكلفة الشركة', ptDedRate:'من الإجمالي', ptSearch:'ابحث بالاسم أو الرقم', ptAllDept:'كل الإدارات', ptTotal:'الإجمالي', ptOpen:'عرض قسيمة الراتب', ptShown:'معروض', ptOf:'من', ptByDept:'حسب الإدارة', ptPeople:'موظف', ptNone:'لا نتائج', pr_locked:'معتمد ومقفل', prHead:'الموظفون', prGross:'الإجمالي', prDed:'الاستقطاعات', prNet:'الصافي', prGosiEr:'تأمينات على الشركة', prWarn:'ملاحظات',
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
  prRecalcDone:'أعيد الحساب', prApproved:'اعتمد المسير وأقفل', prGosiNote:'حصة الشركة في التأمينات'
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
  pr_draft:'Draft', ptNo:'No.', ptDept:'Department / cost centre', ptShare:'Share of total', ptGosiEr:'Employer GOSI', ptCost:'Company cost', ptDedRate:'of gross', ptSearch:'Search name or number', ptAllDept:'All departments', ptTotal:'Total', ptOpen:'Open payslip', ptShown:'Showing', ptOf:'of', ptByDept:'By department', ptPeople:'people', ptNone:'No results', pr_locked:'Approved and locked', prHead:'Employees', prGross:'Gross', prDed:'Deductions', prNet:'Net', prGosiEr:'Employer GOSI', prWarn:'Notes',
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
  prRecalcDone:'Recalculated', prApproved:'Payroll approved and locked', prGosiNote:'Employer GOSI share'
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
  var en = S.lang === 'en', e = s.lines.filter(function(l){ return l.kind === 'earning'; }), d = s.lines.filter(function(l){ return l.kind === 'deduction'; });
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
  var ear = s.lines.filter(function(l){ return l.kind === 'earning'; }), ded = s.lines.filter(function(l){ return l.kind === 'deduction'; });
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

// ---------------- HR console: payroll ----------------
var xlsxP = null;
function xlsx(){ if (window.XLSX) return Promise.resolve(); if (xlsxP) return xlsxP; xlsxP = new Promise(function(res, rej){ var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sri(sc, sc.src); sc.onload = res; sc.onerror = function(){ xlsxP = null; rej(); }; document.head.appendChild(sc); }); return xlsxP; }

function section(body){
  if (S.prRun) return runView(body, S.prRun);
  var last = (function(){ var d = new Date(riyadhToday() + 'T00:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })();
  body.innerHTML = '<div class="hr-h"><h2>' + t('prTitle') + '</h2></div>' +
    '<form class="toolbar" id="prNewF"><label class="hr-hint" style="margin:0">' + t('prMonth') + '</label><input type="month" name="month" value="' + last + '" max="' + riyadhToday().slice(0, 7) + '" required><select name="group" id="prGrp" hidden aria-label="' + t('pgGroup') + '"></select>' +
    '<button class="btn btn-dark btn-sm">' + ph('calculator') + t('prCreate') + '</button><span class="err" id="prErr" style="color:var(--red)"></span></form><div id="prList"></div>' +
    '<section class="v2-card"><h3 class="hr-sub">' + ph('calculator') + t('prEos') + '</h3><div id="prEos"></div></section>';
  $('#prNewF', body).onsubmit = function(ev){
    ev.preventDefault(); var b = this.querySelector('button'); b.disabled = true;
    api('payrollCreate', { month: this.elements.month.value, payGroupId: this.elements.group.value || '' }).then(function(r){ b.disabled = false; if (!r.ok) { $('#prErr', body).textContent = errText(r.error); return; } S.prRun = r.run.id; section(body); });
  };
  var el = $('#prList', body);
  apiFresh('payrollList', {}, function(r){
    if (!r.ok) return el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>';
    var gs = $('#prGrp', body); // pay groups (2026-10-21): pick which group's run to prepare
    if (gs && r.groups && r.groups.length > 1) { var keep = gs.value; gs.innerHTML = r.groups.map(function(g){ return '<option value="' + esc(g.id) + '">' + esc((S.lang === 'en' ? g.nameEn : g.nameAr) || g.nameAr) + '</option>'; }).join(''); gs.value = keep || ''; gs.hidden = false; }
    el.innerHTML = (window.Viz && r.rows.length ? listDash(r.rows) : '') + (r.rows.length ? '<div class="list">' + r.rows.map(function(x){
      return '<div class="row click" data-run="' + x.id + '" tabindex="0"><div class="av">' + ph('money') + '</div><div class="main"><b>' + esc(monthName(x.month)) + (x.payGroupName ? ' · ' + esc((S.lang === 'en' ? x.payGroupNameEn : x.payGroupName) || x.payGroupName) : '') + '</b><small><bdi>' + esc(x.ref) + '</bdi>، ' + plural(x.totals.headcount || 0, 'people') + '</small></div>' +
        '<div class="end"><b class="num">' + money(x.totals.net) + '</b><small><span class="chip ' + (x.status === 'locked' ? 'in' : 'late') + '">' + t('pr_' + x.status) + '</span></small></div></div>';
    }).join('') + '</div>' : '<div class="empty">' + ph('money') + '<b>' + t('prEmpty') + '</b></div>');
    if (window.Viz) Viz.wire(el);
    $$('[data-run]', el).forEach(function(x){ x.onclick = function(){ S.prRun = x.dataset.run; section(body); }; });
  });
  eosBox($('#prEos', body));
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
    el.innerHTML = '<div class="hr-h"><button type="button" class="iconbtn" id="prBack" aria-label="back">' + (S.lang === 'ar' ? I.chev : I.chevb) + '</button><h2>' + esc(monthName(run.month)) + ' <span class="chip ' + (draft ? 'late' : 'in') + '" style="vertical-align:middle">' + t('pr_' + run.status) + '</span></h2></div>' +
      '<p class="hr-hint" style="margin:-8px 0 12px"><bdi>' + esc(run.ref) + '</bdi>، ' + t('prPrepared') + ' ' + esc(run.preparedByName || '') + (run.approvedByName ? '، ' + t('prApprovedBy') + ' ' + esc(run.approvedByName) : '') + '</p>' +
      '<div class="pr-kpis"><div class="net"><span>' + t('prNet') + '</span><b class="num">' + money(tt.net) + '</b></div><div class="kpi"><span>' + t('prGross') + '</span><b class="num" style="font-size:20px">' + money(tt.gross) + '</b></div>' +
      '<div class="kpi"><span>' + t('prDed') + '</span><b class="num" style="font-size:20px">' + money(tt.deductions) + '</b></div><div class="kpi"><span>' + t('prGosiEr') + '</span><b class="num" style="font-size:20px">' + money(tt.gosiEmployer) + '</b></div>' +
      '<div class="kpi"><span>' + t('prHead') + '</span><b class="num" style="font-size:20px">' + tt.headcount + '</b></div></div>' +
      (window.Viz ? runDash(r) : '') + '<div class="btnrow" style="margin-bottom:12px">' + (draft ? '<button type="button" class="btn btn-line btn-sm" id="prRe">' + ph('arrows-clockwise') + t('prRecalc') + '</button>' + (r.canApprove ? '<button type="button" class="btn btn-dark btn-sm" id="prOk">' + ph('seal-check') + t('prApprove') + '</button>' : '') +
        '<button type="button" class="btn btn-danger btn-sm" id="prDel">' + t('prDelete') + '</button>' : '<button type="button" class="btn btn-dark btn-sm" id="prMail">' + ph('envelope-simple') + t('prEmail') + '</button>') +
      '<button type="button" class="btn btn-dark btn-sm" id="prVar">' + ph('chart-line-up') + t('vaBtn') + '</button><button type="button" class="btn btn-line btn-sm" id="prXls">' + ph('microsoft-excel-logo') + t('prExport') + '</button></div>' +
      (draft ? '<p class="hr-hint">' + t('prApproveHint') + '</p>' : '') + '<div class="err" id="prMsg" style="color:var(--red);margin-bottom:8px"></div>' +
      '<div id="ptBox"></div>' +
      '<h3 class="hr-sub">' + t('prAdj') + '</h3><div id="prAdj"></div>';
    $('#prBack', el).onclick = function(){ S.prRun = null; section(body); };
    $('#prVar', el).onclick = function(){ varianceView(run); };
    if (window.Viz) Viz.wire(el);
    slipTable($('#ptBox', el), r, run);
    var msg = $('#prMsg', el), act = function(action, done){ return function(){ this.disabled = true; var b = this; api(action, { id: run.id }).then(function(x){ b.disabled = false; if (!x.ok) { msg.textContent = errText(x.error); if (x.error === 'email_not_configured') msg.textContent = t('prEmailNo'); return; } done(x); }); }; };
    if ($('#prRe', el)) $('#prRe', el).onclick = act('payrollRecalc', function(){ toast(t('prRecalcDone')); runView(body, id); });
    if ($('#prOk', el)) $('#prOk', el).onclick = act('payrollApprove', function(){ toast(t('prApproved')); runView(body, id); });
    if ($('#prDel', el)) $('#prDel', el).onclick = act('payrollDelete', function(){ S.prRun = null; section(body); });
    if ($('#prMail', el)) $('#prMail', el).onclick = act('payrollEmail', function(x){
      toast(t('prEmailed') + ': ' + x.queued);
      var pump = function(n){ api('jobRun', {}, true).then(function(r){ if (r && r.ok && r.left > 0 && n < 60) setTimeout(function(){ pump(n + 1); }, 3000); else if (r && r.ok && r.dead > 0) toast(errText('email_send_failed')); }); };
      if (x.queued) pump(0);
    });
    $('#prXls', el).onclick = function(){ exportXls(run); };
    adjBox($('#prAdj', el), r, draft, function(){ api('payrollRecalc', { id: run.id }).then(function(){ runView(body, id); }); });
  });
}

/** The run's people as an accounting table: number, name, department, gross, deductions, net, share, employer GOSI, company cost. */
function slipTable(box, r, run){
  var st = { q: '', dept: '', k: 'name', up: true };
  var dn = function(s){ return (s.emp && (s.emp.deptName || s.emp.department)) || '-'; };
  var rows = r.slips.map(function(s){ return { s: s, no: s.emp ? String(s.emp.empNo) : '', name: s.emp ? s.emp.name : '', dept: dn(s), gross: +s.gross || 0, ded: +s.deductions || 0, net: +s.net || 0, er: +s.gosiEmployer || 0, cost: +s.companyCost || ((+s.gross || 0) + (+s.gosiEmployer || 0)) }; });
  var totCost = rows.reduce(function(a, x){ return a + x.cost; }, 0) || 1;
  var depts = {}; rows.forEach(function(x){ depts[x.dept] = (depts[x.dept] || 0) + 1; });
  var dk = Object.keys(depts).sort(function(a, b){ return depts[b] - depts[a]; });
  var cols = [['no', t('ptNo')], ['name', t('hrName')], ['dept', t('ptDept')], ['gross', t('prGross'), 1], ['ded', t('prDed'), 1], ['net', t('prNet'), 1], ['cost', t('ptShare'), 1], ['er', t('ptGosiEr'), 1], ['cost2', t('ptCost'), 1], ['w', t('prWarn')]];
  box.innerHTML = '<div class="pt-bar"><input type="search" id="ptQ" placeholder="' + t('ptSearch') + '" aria-label="' + t('ptSearch') + '">' +
    (dk.length > 1 ? '<select id="ptD" aria-label="' + t('ptDept') + '"><option value="">' + t('ptAllDept') + '</option>' + dk.map(function(d){ return '<option value="' + esc(d) + '">' + esc(d) + ' (' + depts[d] + ')</option>'; }).join('') + '</select>' : '') +
    '<span class="pt-count" id="ptN"></span></div><div class="pt-wrap"><table class="pt"><thead><tr>' +
    cols.map(function(c){ return '<th' + (c[0] === 'w' ? '' : ' data-k="' + (c[0] === 'cost2' ? 'cost' : c[0]) + '"') + (c[2] ? ' class="a"' : '') + '>' + esc(c[1]) + '</th>'; }).join('') + '<th aria-label="' + t('ptOpen') + '"></th></tr></thead><tbody id="ptB"></tbody><tfoot id="ptF"></tfoot></table></div>';
  var body = $('#ptB', box), foot = $('#ptF', box);
  function draw(){
    var q = st.q.trim().toLowerCase(), list = rows.filter(function(x){ return (!st.dept || x.dept === st.dept) && (!q || x.name.toLowerCase().indexOf(q) >= 0 || x.no.toLowerCase().indexOf(q) >= 0); });
    list.sort(function(a, b){ var A = a[st.k], B = b[st.k], c = typeof A === 'number' ? A - B : String(A).localeCompare(String(B), st.k === 'no' ? 'en' : 'ar', { numeric: true }); return st.up ? c : -c; });
    var maxShare = Math.max.apply(null, rows.map(function(x){ return x.cost; }).concat([1]));
    body.innerHTML = list.length ? list.map(function(x){ var s = x.s, dr = x.gross ? x.ded / x.gross * 100 : 0;
      return '<tr data-s="' + esc(s.id) + '" tabindex="0" title="' + t('ptOpen') + '"><td class="no">' + esc(x.no) + '</td><td class="nm"><b>' + esc(x.name) + '</b>' + (s.emp && s.emp.title ? '<small>' + esc(s.emp.title) + '</small>' : '') + '</td><td class="dp">' + esc(x.dept) + '</td>' +
        '<td class="a">' + acct(x.gross) + '</td><td class="a">' + acct(x.ded) + (x.ded ? '<span class="sub">' + pct(dr) + ' ' + t('ptDedRate') + '</span>' : '') + '</td><td class="a net">' + acct(x.net) + '</td>' +
        '<td class="a"><span class="shr"><i style="width:' + Math.max(2, Math.round(x.cost / maxShare * 44)) + 'px"></i>' + pct(x.cost / totCost * 100) + '</span></td><td class="a">' + acct(x.er) + '</td><td class="a"><b>' + acct(x.cost) + '</b></td>' +
        '<td>' + warnChips(s.warnings) + '</td><td class="pt-go">' + ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') + '</td></tr>'; }).join('') : '<tr><td colspan="11" style="text-align:center;color:var(--ink-2);padding:24px">' + t('ptNone') + '</td></tr>';
    var sum = function(k){ return list.reduce(function(a, x){ return a + x[k]; }, 0); }, c = sum('cost');
    foot.innerHTML = '<tr><td></td><td>' + t('ptTotal') + ' <small style="font-weight:500;color:var(--ink-2)">(' + list.length + ' ' + t('ptPeople') + ')</small></td><td></td><td class="a">' + acct(sum('gross')) + '</td><td class="a">' + acct(sum('ded')) + '</td><td class="a net">' + acct(sum('net')) + '</td>' +
      '<td class="a">' + pct(c / totCost * 100) + '</td><td class="a">' + acct(sum('er')) + '</td><td class="a">' + acct(c) + '</td><td colspan="2"></td></tr>';
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
    return '<div class="row"><div class="main"><b>' + esc(a.empName) + '، ' + esc((L[S.lang] || L.ar)[a.code] || a.code) + '</b><small><bdi>' + esc(a.ref) + '</bdi>، ' + esc(a.reason) + '</small></div><b class="num">' + (a.code === 'overtime_hours' ? a.amount : money(a.amount)) + '</b>' +
      (draft ? '<button type="button" class="btn btn-line btn-sm" data-adel="' + a.id + '">' + I.x + '</button>' : '') + '</div>';
  }).join('') + '</div>' : '<p class="hr-hint">' + t('prAdjNone') + '</p>') +
    (draft ? '<form class="form" id="adjF" style="margin-top:10px"><div class="two"><div class="field"><label>' + t('prAdjEmp') + '</label><select name="empId" required>' + Object.keys(names).filter(function(k){ return k !== S.me.id; }).map(function(k){ return '<option value="' + k + '">' + esc(names[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>' + t('prAdjCode') + '</label><select name="code">' + codes.map(function(c){ return '<option value="' + c + '">' + esc((L[S.lang] || L.ar)[c]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="field"><label>' + t('prAdjAmount') + '</label><input name="amount" type="number" min="0.01" step="0.01" required inputmode="decimal"></div><div class="field"><label>' + t('prAdjReason') + '</label><input name="reason" required maxlength="200"></div></div>' +
      '<div class="err" id="adjErr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark btn-sm">' + ph('plus') + t('prAdjAdd') + '</button></div></form>' : '');
  $$('[data-adel]', el).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('payrollAdjDelete', { id: b.dataset.adel }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } changed(); }); }; });
  var f = $('#adjF', el);
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

window.Payroll = { section: section, myCard: myCard, totalRewards: totalRewards, openSlip: openSlip, openSlipRef: openSlipRef, printSlip: printSlip, variance: varianceView };
})();
