// Approvals centre, leave cycle and configurable approval flows (Flows.gs), 2026-10-08.
// - Flows.centre(body): every decision waiting for the viewer across modules, with SLA, escalation, bulk approve and history.
// - Flows.cycles(body): leave cycles for HR, payroll and managers; Flows.myCards(el): the employee's and the substitute's cards.
// - Flows.config(body): approval chains per request type (HR and admin), SLA hours and the clearance threshold.
// The server decides every rule (Flows.gs and each module's own endpoint); this file explains the rule and shows the answer.
(function(){
'use strict';

Object.assign(T.ar, {
  vwCentre:'مركز الموافقات', vwCycles:'دورة الإجازة', vwFlows:'مسارات الموافقة',
  cnTitle:'مركز الموافقات', cnLead:'كل ما ينتظر قرارك في مكان واحد: الطلبات والمصروفات والرواتب والعهد والتقارير وإخلاء الطرف ودورات الإجازة. يعرض الهدف الزمني لكل بند، ويظهر البند المتأخر ضعف المدة لمن فوق صاحبه للعلم دون أن يسحب منه القرار.',
  cnMine:'بانتظار قرارك', cnLate:'متأخرة', cnToday:'مستحقة اليوم', cnEsc:'مصعدة إليك', cnSpeed:'متوسط سرعة قرارك', cnOrgSpeed:'متوسط الشركة', cnHours:'ساعة', cnAll:'الكل',
  cnNone:'لا شيء بانتظارك. أحسنت.', cnNoneType:'لا توجد بنود من هذا النوع.', cnSel:'محدد', cnBulk:'اعتماد المحدد', cnBulkLead:'الاعتماد الجماعي لنوع واحد فقط، ويمر كل بند على قواعد وحدته كأنه اعتمد وحده.',
  cnClear:'إلغاء التحديد', cnApprove:'اعتماد', cnReject:'رفض', cnDone:'تم', cnOpen:'فتح الشاشة', cnHist:'السجل', cnNote:'ملاحظة', cnNoteReq:'سبب الرفض (مطلوب)', cnNoteOpt:'ملاحظة (اختياري)',
  cnSent:'سجل القرار', cnBulkDone:'تم اعتماد', cnBulkFail:'لم يعتمد', cnOnBehalf:'نيابة عن', cnHrBehalf:'نيابة عن المدير (موارد بشرية)', cnEscTag:'مصعد', cnInfo:'للعلم',
  cnSince:'منذ', cnDue:'الموعد', cnTarget:'الهدف', cnStep:'المرحلة', cnAgo:'عمرها', cnDeep:'يُتخذ هذا القرار من شاشته الخاصة', cnHistT:'سجل القرار',
  sla_late:'متأخر', sla_due_today:'مستحق اليوم', sla_on_time:'في الموعد',
  cnt_request:'طلب', cnt_salary:'باقة راتب', cnt_payroll:'مسير رواتب', cnt_wps:'ملف حماية الأجور', cnt_recon:'مطابقة أجور', cnt_disc_decide:'قرار تأديبي', cnt_disc_objection:'اعتراض على جزاء',
  cnt_asset_charge:'تحميل عهدة', cnt_report:'مراجعة تقرير', cnt_calibration:'معايرة تقييم', cnt_clearance:'إخلاء طرف', cnt_leavecycle:'دورة إجازة', cnt_onboarding:'مهمة تهيئة',
  cnt_expense:'مطالبة مصروفات', cnt_journal:'قيد الرواتب', cnt_ticket_use:'تذكرة سفر', cnt_gov_fee:'رسم حكومي', cnt_gov_visa:'تأشيرة بانتظار التسجيل',
  cnd_submitted:'قدم الطلب', cnd_approve:'اعتمد', cnd_reject:'رفض', cnd_cancelled:'ألغي', cnd_proposed:'اقترح', cnd_approved:'اعتمد', cnd_rejected:'رفض', cnd_prepared:'أعد', cnd_generated:'جهز',
  cnd_uploaded:'رفع', cnd_confirmed:'أكد', cnd_resolved:'أغلق', cnd_reported:'أبلغ', cnd_charged:'وجه الاتهام', cnd_responded:'رد الموظف', cnd_decided:'صدر القرار', cnd_objected:'اعترض',
  cnd_objection:'بت في الاعتراض', cnd_opened:'فتح', cnd_done:'أنجز', cnd_na:'غير منطبق', cnd_accept:'قبل', cnd_decline:'اعتذر', cnd_departed:'سافر', cnd_returned:'عاد', cnd_exported:'صدر',
  cnd_reviewed:'راجع', cnd_self:'التقييم الذاتي', cnd_manager:'تقييم المدير', cnd_calibrated:'عاير', cnd_paid:'صرف', cnd_imported:'استورد', cnd_recorded:'سجل', cnd_verified:'تحقق', cnd_issued:'أصدر', cnd_skipped:'تخطى',
  cl_handover:'تسليم الأعمال', cl_access:'إيقاف الصلاحيات', cl_settlement:'تجهيز المخالصة', cl_gosi:'الاستبعاد من التأمينات', cl_qiwa:'إنهاء العقد في قوى', cl_certificate:'شهادة الخدمة', cl_paid:'صرف المخالصة',
  rstep_executive:'بانتظار الرئيس التنفيذي', rstep_dept_head:'بانتظار رئيس الإدارة', rstep_person:'بانتظار', rstep_done:'منتهٍ',
  // leave cycle
  ycTitle:'دورة الإجازة', ycLead:'كل إجازة معتمدة بالمدة المحددة أو أطول تفتح دورة: إخلاء طرف قبل الإجازة (تسليم الأعمال لبديل، العهد، التفويض، تأشيرة الخروج والعودة، التذكرة، راتب الإجازة مقدما)، ثم السفر، ثم العودة وتأكيدها.',
  ycMine:'إجازتي', ycCovering:'أغطي زميلا', ycOut:'في إجازة الآن', ycBackWeek:'يعودون خلال أسبوع', ycOverdueT:'مهام متأخرة', ycArt80T:'تنبيهات المادة 80', ycTotal:'الدورات',
  ycSt_open:'المفتوحة', ycSt_all:'الكل', ys_approved:'معتمدة', ys_clearing:'قيد الإخلاء', ys_cleared:'جاهزة للسفر', ys_departed:'في الإجازة', ys_overdue_return:'متأخر عن العودة', ys_returned:'عاد', ys_closed:'مغلقة', ys_cancelled:'ملغاة',
  ycNone:'لا توجد دورات إجازة.', ycTasks:'مهام ما قبل الإجازة', ycSteps:'السفر والعودة', ycHistory:'السجل', ycBack:'موعد العودة', ycDays:'الأيام', ycReq:'طلب الإجازة', ycProgress:'المنجز',
  yct_handover:'تسليم الأعمال لبديل', yct_handover_accept:'قبول البديل', yct_custody:'فحص العهد', yct_delegation:'تفويض الموافقات', yct_exit_reentry:'تأشيرة خروج وعودة', yct_ticket:'تذكرة السفر', yct_leave_salary:'راتب الإجازة مقدما',
  yct_depart:'تأكيد السفر', yct_return:'تسجيل العودة', yct_confirm:'تأكيد العودة',
  yo_employee:'الموظف', yo_substitute:'البديل', yo_manager:'المدير', yo_hr:'الموارد البشرية', yo_payroll:'الرواتب',
  yts_open:'مفتوحة', yts_waiting:'بانتظار التسليم', yts_done:'تمت', yts_na:'لا تنطبق', ycOptional:'اختيارية', ycAuto:'تلقائي',
  ycSub:'البديل', ycNotes:'ما يتسلمه البديل: الأعمال والعملاء والمفاتيح والملفات (3 أحرف على الأقل)', ycDelegate:'المفوض بالموافقات', ycVisaNo:'رقم التأشيرة', ycValid:'صالحة حتى', ycVisaKind:'نوعها',
  ycSingle:'مفردة', ycMultiple:'متعددة', ycBooking:'مرجع الحجز', ycRoute:'خط السير', ycAmount:'المبلغ', ycMonth:'مسير شهر', ycSuggested:'المقترح (أجر أيام الإجازة)', ycHeld:'العهد التي لديه',
  ycNa:'لا تنطبق', ycNaNote:'لماذا لا تنطبق؟ (مطلوب)', ycAccept:'قبول', ycDecline:'اعتذار', ycDeclineNote:'سبب الاعتذار (مطلوب)', ycSave:'تسجيل', ycDate:'التاريخ',
  ycDepart:'تأكيد السفر', ycReturn:'تسجيل العودة', ycConfirm:'تأكيد العودة وإغلاق الدورة', ycDepartNote:'سبب السماح بالسفر قبل اكتمال الإخلاء (مطلوب للموارد البشرية)',
  ycLateOutcome:'العودة متأخرة: كيف تحسب الأيام؟', ycAbsence:'غياب', ycExtension:'تمديد بطلب إجازة', ycExtType:'نوع التمديد', ycAnnual:'من رصيد الإجازة السنوية', ycUnpaid:'بدون أجر',
  ycEarly:'عاد مبكرا', ycOnTime:'في الموعد', ycOutcome:'النتيجة', ycEarlyDays:'أيام أعيدت للرصيد', ycLateDays:'أيام التأخر', ycExtRef:'طلب التمديد',
  ycArt80:'تنبيه المادة 80: غياب أكثر من 20 يوما متصلة أو 30 يوما في السنة. تنبيه للموارد البشرية فقط، ولا يتخذ إجراء تلقائي (يلزم إنذار كتابي مسبق). تحقق من النص الحالي مع وزارة الموارد البشرية.',
  ycArt80Prov:'تقدير مؤقت حتى تأكيد العودة', ycOverdue:'متأخر عن العودة', ycMineTask:'مطلوب منك', ycOpenCycle:'عرض الدورة', ycPrint:'طباعة نموذج الإخلاء',
  ycCoverLead:'سمّاك زميلك بديلا عنه في إجازته. اقرأ ما يسلمه إليك ثم اقبل أو اعتذر مع السبب.', ycNeedSub:'اختر البديل أولا.',
  ycPrintTitle:'نموذج إخلاء طرف قبل الإجازة', ycPrintKind:'إخلاء قبل الإجازة', ycSignEmp:'توقيع الموظف', ycSignMgr:'توقيع المدير المباشر', ycSignHr:'اعتماد الموارد البشرية',
  ycOpenLead:'فتح دورة يدويا لإجازة معتمدة أقصر من الحد أو اعتمدت قبل هذه الخاصية.', ycOpenBtn:'فتح دورة لإجازة', ycReqId:'الإجازة المعتمدة', ycMinDays:'الحد الأدنى',
  // flows
  fwTitle:'مسارات الموافقة', fwLead:'لكل نوع طلب مسار من خطوات بالترتيب. لكل خطوة شرط اختياري وهدف زمني. يثبت المسار على الطلب لحظة تقديمه، فتعديل المسار لا يغير الطلبات الجارية. بدون مسار يعمل المسار الأساسي كما كان.',
  fwBuiltin:'المسار الأساسي', fwActive:'المسار المعمول به', fwNoFlow:'يعمل المسار الأساسي', fwEdit:'تعديل المسار', fwReset:'العودة للمسار الأساسي', fwVersions:'الإصدارات', fwSave:'حفظ إصدار جديد',
  fwAdd:'إضافة خطوة', fwUp:'أعلى', fwDown:'أسفل', fwRemove:'حذف', fwKind:'الخطوة', fwPerson:'الشخص', fwWhen:'الشرط (اختياري)', fwSla:'الهدف بالساعات', fwNote:'ملاحظة الإصدار',
  fwAmountOver:'إذا زاد المبلغ عن', fwDaysOver:'إذا زادت الأيام عن', fwDept:'إذا كان الموظف في إدارة', fwSaudi:'الجنسية', fwAnyone:'الجميع', fwSaudiOnly:'السعوديون', fwNonSaudi:'غير السعوديين', fwAnyDept:'أي إدارة',
  fwRules:'خطوة واحدة على الأقل بلا شرط. السلفة لا تمر على المدير المباشر وتنتهي بالرواتب. يتخطى النظام الخطوة إذا لم يوجد صاحبها أو كان هو مقدم الطلب، ولا يتولى شخص واحد خطوتين.',
  fwSettings:'إعدادات المركز والدورة', fwSlaH:'الهدف الزمني الافتراضي لكل قرار (ساعات)', fwMinDays:'تفتح دورة الإجازة من عدد أيام (1 = كل إجازة)', fwSaved:'حفظ المسار', fwSetSaved:'حفظت الإعدادات',
  fwk_manager:'المدير المباشر', fwk_dept_head:'رئيس الإدارة', fwk_hr:'الموارد البشرية', fwk_payroll:'الرواتب', fwk_executive:'الرئيس التنفيذي', fwk_person:'شخص محدد',
  fws_active:'معمول به', fws_superseded:'سابق', fws_default:'رجوع للأساسي', fwHolders:'أصحاب الدور',
  // errors
  e_bad_substitute:'اختر بديلا نشطا غيرك.', e_visa_before_return:'تنتهي التأشيرة قبل موعد العودة.', e_bad_visa:'رقم التأشيرة غير صحيح.', e_advance_too_large:'المبلغ أكبر من أجر أيام الإجازة.',
  e_month_locked:'مسير هذا الشهر معتمد ومقفل.', e_late_outcome_required:'العودة متأخرة: اختر غيابا أو تمديدا.', e_cannot_decide_own:'لا تتخذ قرارا في أمر يخصك.', e_already_done:'تم هذا الإجراء من قبل.',
  e_bulk_not_allowed:'الاعتماد الجماعي غير متاح لهذا النوع أو لهذا القرار.', e_bulk_one_type:'حدد بنودا من نوع واحد.', e_confirm_required:'أكد الاعتماد الجماعي.', e_too_many:'30 بندا كحد أقصى في المرة الواحدة.',
  e_deep_link_only:'يتخذ هذا القرار من شاشته الخاصة.', e_flow_bad_condition:'شرط لا يناسب هذا النوع من الطلبات.', e_flow_duplicate_step:'خطوة مكررة بلا شرط.', e_flow_needs_payroll:'تنتهي السلفة دائما بخطوة الرواتب.',
  e_flow_needs_unconditional:'أضف خطوة واحدة على الأقل بلا شرط.', e_flow_no_holder:'لا يوجد من يحمل هذا الدور بعد.', e_flow_step_not_allowed:'السلفة لا تمر على المدير المباشر أو رئيس الإدارة.',
  e_flow_steps_count:'من خطوة إلى 6 خطوات.', e_server_error:'خطأ في الخادم. حاول مرة أخرى.'
});
Object.assign(T.en, {
  vwCentre:'Approvals centre', vwCycles:'Leave cycle', vwFlows:'Approval flows',
  cnTitle:'Approvals centre', cnLead:'Everything waiting for your decision in one place: requests, expenses, pay, assets, reports, clearances and leave cycles. Each item shows its time target; an item late by twice the target also shows to the next level for information, without taking the decision away.',
  cnMine:'Waiting for you', cnLate:'Late', cnToday:'Due today', cnEsc:'Escalated to you', cnSpeed:'Your average decision time', cnOrgSpeed:'Company average', cnHours:'h', cnAll:'All',
  cnNone:'Nothing is waiting for you. Well done.', cnNoneType:'No items of this type.', cnSel:'selected', cnBulk:'Approve selected', cnBulkLead:'Bulk approval takes one type at a time, and each item still goes through its module\'s rules as if approved alone.',
  cnClear:'Clear', cnApprove:'Approve', cnReject:'Reject', cnDone:'Done', cnOpen:'Open screen', cnHist:'History', cnNote:'Note', cnNoteReq:'Reason for rejecting (required)', cnNoteOpt:'Note (optional)',
  cnSent:'Decision recorded', cnBulkDone:'Approved', cnBulkFail:'Not approved', cnOnBehalf:'On behalf of', cnHrBehalf:'On the manager\'s behalf (HR)', cnEscTag:'Escalated', cnInfo:'For information',
  cnSince:'Since', cnDue:'Due', cnTarget:'Target', cnStep:'Step', cnAgo:'Age', cnDeep:'This decision is taken on its own screen', cnHistT:'Decision history',
  sla_late:'Late', sla_due_today:'Due today', sla_on_time:'On time',
  cnt_request:'Request', cnt_salary:'Salary package', cnt_payroll:'Payroll run', cnt_wps:'WPS file', cnt_recon:'Wage reconciliation', cnt_disc_decide:'Disciplinary decision', cnt_disc_objection:'Objection to a penalty',
  cnt_asset_charge:'Asset charge', cnt_report:'Report review', cnt_calibration:'Rating calibration', cnt_clearance:'Clearance', cnt_leavecycle:'Leave cycle', cnt_onboarding:'Onboarding task',
  cnt_expense:'Expense claim', cnt_journal:'Payroll journal', cnt_ticket_use:'Air ticket', cnt_gov_fee:'Government fee', cnt_gov_visa:'Visa to record',
  cnd_submitted:'Submitted', cnd_approve:'Approved', cnd_reject:'Rejected', cnd_cancelled:'Cancelled', cnd_proposed:'Proposed', cnd_approved:'Approved', cnd_rejected:'Rejected', cnd_prepared:'Prepared', cnd_generated:'Generated',
  cnd_uploaded:'Uploaded', cnd_confirmed:'Confirmed', cnd_resolved:'Resolved', cnd_reported:'Reported', cnd_charged:'Charged', cnd_responded:'Answered', cnd_decided:'Decided', cnd_objected:'Objected',
  cnd_objection:'Objection ruled', cnd_opened:'Opened', cnd_done:'Done', cnd_na:'Not applicable', cnd_accept:'Accepted', cnd_decline:'Declined', cnd_departed:'Departed', cnd_returned:'Returned', cnd_exported:'Exported',
  cnd_reviewed:'Reviewed', cnd_self:'Self review', cnd_manager:'Manager review', cnd_calibrated:'Calibrated', cnd_paid:'Paid', cnd_imported:'Imported', cnd_recorded:'Recorded', cnd_verified:'Verified', cnd_issued:'Issued', cnd_skipped:'Skipped',
  cl_handover:'Hand over work', cl_access:'Close access', cl_settlement:'Prepare settlement', cl_gosi:'Remove from GOSI', cl_qiwa:'End contract in Qiwa', cl_certificate:'Service certificate', cl_paid:'Pay settlement',
  rstep_executive:'With the CEO', rstep_dept_head:'With the department head', rstep_person:'With', rstep_done:'Finished',
  ycTitle:'Leave cycle', ycLead:'Every approved leave of the set length or longer opens a cycle: pre-leave clearance (hand over to a substitute, assets, delegation, exit/re-entry visa, ticket, leave salary in advance), then departure, then the return and its confirmation.',
  ycMine:'My leave', ycCovering:'Covering a colleague', ycOut:'On leave now', ycBackWeek:'Back within a week', ycOverdueT:'Overdue tasks', ycArt80T:'Art. 80 warnings', ycTotal:'Cycles',
  ycSt_open:'Open', ycSt_all:'All', ys_approved:'Approved', ys_clearing:'Clearing', ys_cleared:'Ready to leave', ys_departed:'On leave', ys_overdue_return:'Overdue return', ys_returned:'Returned', ys_closed:'Closed', ys_cancelled:'Cancelled',
  ycNone:'No leave cycles.', ycTasks:'Before the leave', ycSteps:'Departure and return', ycHistory:'History', ycBack:'Due back', ycDays:'Days', ycReq:'Leave request', ycProgress:'Done',
  yct_handover:'Hand over to a substitute', yct_handover_accept:'Substitute accepts', yct_custody:'Asset check', yct_delegation:'Delegate approvals', yct_exit_reentry:'Exit/re-entry visa', yct_ticket:'Air ticket', yct_leave_salary:'Leave salary in advance',
  yct_depart:'Confirm departure', yct_return:'Record return', yct_confirm:'Confirm return',
  yo_employee:'Employee', yo_substitute:'Substitute', yo_manager:'Manager', yo_hr:'HR', yo_payroll:'Payroll',
  yts_open:'Open', yts_waiting:'Waiting for hand-over', yts_done:'Done', yts_na:'Not applicable', ycOptional:'Optional', ycAuto:'Automatic',
  ycSub:'Substitute', ycNotes:'What the substitute takes over: work, customers, keys, files (at least 3 characters)', ycDelegate:'Approvals delegate', ycVisaNo:'Visa number', ycValid:'Valid until', ycVisaKind:'Kind',
  ycSingle:'Single', ycMultiple:'Multiple', ycBooking:'Booking reference', ycRoute:'Route', ycAmount:'Amount', ycMonth:'Payroll month', ycSuggested:'Suggested (wage for the leave days)', ycHeld:'Assets held',
  ycNa:'Not applicable', ycNaNote:'Why does it not apply? (required)', ycAccept:'Accept', ycDecline:'Decline', ycDeclineNote:'Reason for declining (required)', ycSave:'Record', ycDate:'Date',
  ycDepart:'Confirm departure', ycReturn:'Record return', ycConfirm:'Confirm return and close', ycDepartNote:'Why the person may leave before clearance is complete (required for HR)',
  ycLateOutcome:'The return is late: how do the days count?', ycAbsence:'Absence', ycExtension:'Extension as a leave request', ycExtType:'Extension type', ycAnnual:'From annual leave balance', ycUnpaid:'Unpaid',
  ycEarly:'Back early', ycOnTime:'On time', ycOutcome:'Outcome', ycEarlyDays:'Days back to the balance', ycLateDays:'Days late', ycExtRef:'Extension request',
  ycArt80:'Art. 80 warning: absence of more than 20 consecutive days or 30 days in a year. A warning for HR only; nothing happens automatically (a prior written warning is required). Check the current text with HRSD.',
  ycArt80Prov:'Provisional until the return is confirmed', ycOverdue:'Overdue return', ycMineTask:'Your step', ycOpenCycle:'View cycle', ycPrint:'Print clearance form',
  ycCoverLead:'A colleague named you as their substitute for their leave. Read what they hand over, then accept or decline with a reason.', ycNeedSub:'Choose the substitute first.',
  ycPrintTitle:'Pre-leave clearance form', ycPrintKind:'Pre-leave clearance', ycSignEmp:'Employee signature', ycSignMgr:'Line manager signature', ycSignHr:'HR approval',
  ycOpenLead:'Open a cycle by hand for an approved leave shorter than the threshold, or approved before this feature.', ycOpenBtn:'Open a cycle for a leave', ycReqId:'Approved leave', ycMinDays:'Threshold',
  fwTitle:'Approval flows', fwLead:'Each request type has ordered steps. Each step may have a condition and a time target. The flow is fixed on a request when it is made, so editing a flow never changes requests in progress. With no flow, the built-in chain works as before.',
  fwBuiltin:'Built-in chain', fwActive:'Flow in force', fwNoFlow:'The built-in chain applies', fwEdit:'Edit flow', fwReset:'Back to the built-in chain', fwVersions:'Versions', fwSave:'Save a new version',
  fwAdd:'Add step', fwUp:'Up', fwDown:'Down', fwRemove:'Remove', fwKind:'Step', fwPerson:'Person', fwWhen:'Condition (optional)', fwSla:'Target in hours', fwNote:'Version note',
  fwAmountOver:'If the amount is over', fwDaysOver:'If the days are over', fwDept:'If the employee is in', fwSaudi:'Nationality', fwAnyone:'Everyone', fwSaudiOnly:'Saudis', fwNonSaudi:'Non-Saudis', fwAnyDept:'Any department',
  fwRules:'At least one step has no condition. An advance never goes to the line manager and always ends with payroll. A step is skipped when nobody holds it or the holder is the requester, and one person never takes two steps.',
  fwSettings:'Centre and cycle settings', fwSlaH:'Default time target for each decision (hours)', fwMinDays:'A leave cycle opens from this many days (1 = every leave)', fwSaved:'Flow saved', fwSetSaved:'Settings saved',
  fwk_manager:'Line manager', fwk_dept_head:'Department head', fwk_hr:'HR', fwk_payroll:'Payroll', fwk_executive:'CEO', fwk_person:'A named person',
  fws_active:'In force', fws_superseded:'Earlier', fws_default:'Back to built-in', fwHolders:'role holders',
  e_bad_substitute:'Choose an active substitute other than yourself.', e_visa_before_return:'The visa expires before the return date.', e_bad_visa:'Invalid visa number.', e_advance_too_large:'More than the wage for the leave days.',
  e_month_locked:'That month\'s payroll is approved and locked.', e_late_outcome_required:'The return is late: choose absence or extension.', e_cannot_decide_own:'You cannot decide on something about yourself.', e_already_done:'Already done.',
  e_bulk_not_allowed:'Bulk approval is not available for this type or decision.', e_bulk_one_type:'Select items of one type.', e_confirm_required:'Confirm the bulk approval.', e_too_many:'At most 30 items at a time.',
  e_deep_link_only:'This decision is taken on its own screen.', e_flow_bad_condition:'That condition does not fit this request type.', e_flow_duplicate_step:'A repeated step without a condition.', e_flow_needs_payroll:'An advance always ends with a payroll step.',
  e_flow_needs_unconditional:'Add at least one step without a condition.', e_flow_no_holder:'Nobody holds this role yet.', e_flow_step_not_allowed:'An advance never goes to the line manager or department head.',
  e_flow_steps_count:'From one to six steps.', e_server_error:'Server error. Try again.'
});

var css = '' +
'.cn-types{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.cn-types button{height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px;cursor:pointer}' +
'.cn-types button[aria-pressed="true"]{background:var(--pine,#2F5134);color:var(--cream,#F2EEE4);border-color:var(--pine,#2F5134)}.cn-types .n{font-variant-numeric:tabular-nums;opacity:.8}' +
'.cn-row{display:flex;gap:10px;align-items:flex-start}.cn-row .main{flex:1;min-width:0}.cn-row .main b{display:block;font-weight:500}.cn-row .main small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:2px}' +
'.cn-row input[type=checkbox]{width:18px;height:18px;margin-top:10px;flex:none}.cn-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}' +
'.cn-acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex:none;align-items:center}.row.cn-esc{background:#F4F7FD;border-inline-start:3px solid #2a78d6}' +
'.cn-bulk{position:sticky;bottom:10px;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--ink,#17221A);color:#fff;border-radius:14px;padding:10px 14px;margin-top:12px;box-shadow:0 12px 30px -12px rgba(0,0,0,.4)}' +
'.cn-bulk .sp{flex:1}.cn-bulk small{opacity:.8;font-size:12px;flex-basis:100%}' +
'.cn-tl{list-style:none;margin:0;padding:0}.cn-tl li{position:relative;padding:0 0 12px;padding-inline-start:22px;border-inline-start:2px solid var(--line);margin-inline-start:6px}' +
'.cn-tl li::before{content:"";position:absolute;inset-inline-start:-7px;top:3px;width:12px;height:12px;border-radius:50%;background:var(--card);border:2px solid #2E7D4F}.cn-tl li.no::before{border-color:#B42318}' +
'.cn-tl b{font-weight:500}.cn-tl small{display:block;color:var(--ink-2);font-size:12.5px}' +
'.yc-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}.yc-step{padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:13px}' +
'.yc-step b{display:flex;gap:6px;align-items:center;font-weight:500}.yc-step.done{border-color:#9CC7A6;background:#F1F8F2}.yc-step.done b i{color:#2E7D4F}.yc-step small{display:block;color:var(--ink-2);margin-top:3px}' +
'.yc-task{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #EEEBE3}.yc-task:first-child{border-top:0}.yc-task > i{font-size:20px;color:var(--ink-2);margin-top:1px}' +
'.yc-task.done > i{color:#2E7D4F}.yc-task.na > i{color:#9AA39C}.yc-task .main{flex:1;min-width:0}.yc-task b{display:block;font-weight:500;font-size:14px}.yc-task small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:2px}' +
'.yc-form{margin-top:8px;padding:10px 12px;border-radius:12px;background:#FAF8F3;border:1px solid #EEEBE3}.yc-form .btnrow{margin-top:6px}' +
'.yc-warn{display:flex;gap:8px;align-items:flex-start;background:#FDF1EF;border-inline-start:3px solid #B42318;padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 12px}' +
'.fw-card{background:var(--card);border-radius:16px;padding:14px 16px;margin:0 0 12px;box-shadow:0 1px 2px rgba(28,42,31,.05),0 8px 22px -16px rgba(28,42,31,.28)}' +
'.fw-card h4{margin:0 0 8px;display:flex;align-items:center;gap:8px;font-size:15px}.fw-card h4 .sp{flex:1}.fw-chain{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0}' +
'.fw-chain .chip i{font-size:14px}.fw-step{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.6fr) 90px auto;gap:8px;align-items:end;padding:10px 0;border-top:1px solid #EEEBE3}.fw-step:first-child{border-top:0}' +
'.fw-step .field{margin:0}.fw-step .ctl{display:flex;gap:4px}.fw-when{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}' +
'@media (max-width:720px){.yc-steps{grid-template-columns:1fr}.fw-step{grid-template-columns:1fr}.fw-when{grid-template-columns:1fr}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ---------------- helpers ----------------
var uid = 0;
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, manager: false }; }
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function day(iso){ var ms = Date.parse(iso); return isNaN(ms) ? String(iso || '').slice(0, 10) : new Date(ms + 180 * 60000).toISOString().slice(0, 10); }
function when(iso){ var ms = Date.parse(iso); if (isNaN(ms)) return fmt(iso); var l = new Date(ms + 180 * 60000).toISOString(); return fmt(l.slice(0, 10)) + ' <bdi class="num">' + l.slice(11, 16) + '</bdi>'; }
function monthName(m){ return m ? new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function money(n){ return '<span class="num">' + Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + '</span> ' + sar(); }
function num(n, d){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: d == null ? 1 : d }); }
function sep(){ return S.lang === 'en' ? ' · ' : ' · '; }
function busy(el){ el.innerHTML = '<div class="list">' + [0, 1, 2].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%;margin-top:6px"></span></div></div>'; }).join('') + '</div>'; }
function bad(code){ return '<p class="hr-bad" role="alert">' + esc(errText(code)) + '</p>'; }
function head(title, acts){ return '<div class="hr-h"><h2>' + title + '</h2>' + (acts || '') + '</div>'; }
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function empName(e){ return e ? esc(lang(e.name, e.nameEn)) : ''; }
function empLine(e){ return e ? empName(e) + ' <bdi class="num">' + esc(e.empNo) + '</bdi>' : ''; }
function av(e, icon){ return '<div class="av">' + (e ? esc(initials(e.name)) : ph(icon || 'file')) + '</div>'; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function fld(label, control, hint){
  var id = 'fwf' + (++uid);
  return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + (hint ? '<small class="hr-hint">' + hint + '</small>' : '') + '</div>';
}
function opts(list, cur, none){ return (none != null ? '<option value="">' + none + '</option>' : '') + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
function tl(k, fb){ var v = T[S.lang][k]; return v === undefined ? (fb == null ? k : fb) : v; }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
function confirmTap(b, fn){
  b.onclick = function(){
    if (b.dataset.armed) { b.disabled = true; return fn(); }
    var old = b.innerHTML; b.dataset.armed = '1'; b.textContent = t('opConfirm') === 'opConfirm' ? (S.lang === 'en' ? 'Tap again to confirm' : 'اضغط مرة أخرى للتأكيد') : t('opConfirm');
    setTimeout(function(){ if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.innerHTML = old; } }, 4000);
  };
}
/** Where an item's own screen is, through the shell's section map. */
function openLink(link){
  if (!link) return;
  if (link.tab === 'file') return goArea('profile');
  if (link.view) S.rpJump = link.view;
  var dest = ((window.SEC_DEST && SEC_DEST[link.sec]) || 'home').split(':');
  goArea(dest[0], dest[1]);
}

// ================= approvals centre =================
var NOTE_ON_APPROVE = { recon: 1, disc_objection: 1 };
function whatLine(x){
  var w = x.what || {}, p = [];
  if (x.type === 'request') {
    var lt = w.sub === 'leave' && w.subtype ? tl('lt_' + w.subtype, '') : w.sub === 'letter' && w.subtype ? tl('ls_' + w.subtype, '') : '';
    p.push(tl('rt_' + w.sub, w.sub) + (lt ? ' ' + esc(lt) : ''));
  } else if (x.type === 'clearance') p.push(tl('cl_' + w.task, w.task));
  else if (x.type === 'leavecycle') p.push(tl('yct_' + w.task, w.task));
  else if (x.type === 'onboarding') p.push(esc(lang(w.text, w.textEn) || ''));
  else if (x.type === 'gov_fee' && w.text) p.push(esc(tl('gvf_' + w.text, w.text)));
  else if (x.type === 'ticket_use' && w.text) p.push(esc(tl('gvk_' + w.text, w.text)));
  else if (x.type === 'gov_visa' && w.text) p.push(esc(tl('gvv_' + w.text, w.text)));
  else if (w.text && x.type !== 'disc_decide' && x.type !== 'disc_objection') p.push(esc(w.text));
  else if (w.text) p.push('<bdi>' + esc(w.text) + '</bdi>');
  if (w.from) p.push(fmt(w.from) + (w.to && w.to !== w.from ? ' - ' + fmt(w.to) : ''));
  else if (w.to) p.push(fmt(w.to));
  if (w.days != null && x.type !== 'leavecycle') p.push(plural(w.days, 'days'));
  if (w.month) p.push(esc(/^\d{4}-\d{2}$/.test(w.month) ? monthName(w.month) : w.month));
  if (w.amount != null) p.push(money(w.amount));
  if (w.count && (x.type === 'payroll' || x.type === 'wps')) p.push(plural(w.count, 'people'));
  else if (w.count && x.type === 'report') p.push(plural(w.count, 'rows'));
  if (w.flags) p.push(chip(ph('warning') + ' ' + w.flags, 'late'));
  return p.join(sep());
}
function stepLabel(x){
  if (!x.step) return '';
  if (String(x.step).indexOf('person:') === 0) return t('rstep_person');
  var v = T[S.lang]['rstep_' + x.step]; return v || '';
}
function slaChip(s){ return chip(t('sla_' + s.state), s.state === 'late' ? 'absent' : s.state === 'due_today' ? 'late' : 'in'); }

function centre(body){
  var filter = S.cnType || '', sel = {};
  body.innerHTML = head(t('cnTitle'), '<button type="button" class="btn btn-line btn-sm" id="cnR">' + ph('arrows-clockwise') + '</button>') + '<p class="hr-hint" style="margin:-4px 0 12px">' + t('cnLead') + '</p><div id="cnB"></div>';
  var box = $('#cnB', body);
  $('#cnR', body).onclick = function(){ load(true); };
  function load(fresh){
    if (fresh) busy(box);
    apiFresh('approvalsInbox', {}, draw, true);
  }
  function draw(r){
    if (!box.isConnected) return;
    if (!r.ok) return box.innerHTML = bad(r.error);
    var V = window.Viz, s = r.stats, items = r.items, bulk = r.bulk || {};
    var types = Object.keys(s.byType || {}).sort(function(a, b){ return s.byType[b] - s.byType[a]; });
    if (filter && !s.byType[filter]) filter = '';
    var shown = filter ? items.filter(function(x){ return x.type === filter; }) : items;
    var sp = s.speed || {};
    var h = V ? '<div class="db-tiles">' + V.tile(t('cnMine'), V.n1(s.actionable, 0), '', null, true, true) + V.tile(t('cnLate'), '<span class="db-status">' + (s.late ? ph('warning-circle') + ' ' : '') + s.late + '</span>', '') +
      V.tile(t('cnToday'), V.n1(s.dueToday, 0), '') + V.tile(t('cnEsc'), V.n1(s.escalated, 0), '') +
      V.tile(t('cnSpeed'), sp.mine == null ? '-' : V.n1(sp.mine, 1) + ' ' + t('cnHours'), sp.org != null ? t('cnOrgSpeed') + ' ' + V.n1(sp.org, 1) + ' ' + t('cnHours') : '') + '</div>' : '';
    h += '<div class="cn-types" role="group">' + [''].concat(types).map(function(k){
      return '<button type="button" data-ty="' + k + '" aria-pressed="' + (filter === k) + '">' + (k ? t('cnt_' + k) : t('cnAll')) + ' <span class="n">' + (k ? s.byType[k] : s.total) + '</span></button>'; }).join('') + '</div>';
    if (!shown.length) h += empty('seal-check', filter ? t('cnNoneType') : t('cnNone'));
    else h += '<div class="list">' + shown.map(function(x, i){
      var canBulk = x.canAct && bulk[x.type] && (x.actions.indexOf('approve') >= 0 || x.actions.indexOf('done') >= 0);
      var tags = [slaChip(x.sla)];
      if (x.escalated) tags.push(chip(ph('arrow-fat-up') + t('cnEscTag'), 'review'));
      if (!x.canAct) tags.push(chip(t('cnInfo'), 'off'));
      if (x.onBehalfOf) tags.push(chip(t('cnOnBehalf') + ' ' + esc(x.onBehalfOf), ''));
      else if (x.onBehalfRole === 'hr') tags.push(chip(t('cnHrBehalf'), ''));
      var st = stepLabel(x);
      var acts = '';
      if (x.canAct && x.actions.length) {
        if (x.actions.indexOf('approve') >= 0) acts += '<button type="button" class="btn btn-dark btn-sm" data-ap="' + i + '">' + ph('check') + t('cnApprove') + '</button>';
        if (x.actions.indexOf('done') >= 0) acts += '<button type="button" class="btn btn-dark btn-sm" data-dn="' + i + '">' + ph('check') + t('cnDone') + '</button>';
        if (x.actions.indexOf('reject') >= 0) acts += '<button type="button" class="btn btn-line btn-sm" data-rj="' + i + '">' + t('cnReject') + '</button>';
      }
      if (x.link) acts += '<button type="button" class="btn btn-line btn-sm" data-go="' + i + '" title="' + (x.canAct && !x.actions.length ? t('cnDeep') : t('cnOpen')) + '" aria-label="' + t('cnOpen') + '">' + ph('arrow-square-out') + (x.canAct && !x.actions.length ? t('cnOpen') : '') + '</button>';
      acts += '<button type="button" class="btn btn-line btn-sm" data-hi="' + i + '" title="' + t('cnHist') + '" aria-label="' + t('cnHist') + '">' + ph('clock-counter-clockwise') + '</button>';
      return '<div class="row' + (x.escalated && !x.canAct ? ' cn-esc' : '') + '"><div class="cn-row" style="flex:1;min-width:0">' + (canBulk ? '<input type="checkbox" data-sel="' + i + '" aria-label="' + t('cnSel') + '">' : '') + av(x.emp, 'file-text') +
        '<div class="main"><b>' + t('cnt_' + x.type) + (x.emp ? sep() + empLine(x.emp) : '') + '</b><small>' + (x.ref ? '<bdi>' + esc(x.ref) + '</bdi>' + sep() : '') + whatLine(x) + '</small>' +
        '<small>' + (st ? esc(st) + sep() : '') + t('cnSince') + ' ' + when(x.sla.since) + sep() + t('cnDue') + ' ' + when(x.sla.dueAt) + '</small><div class="cn-tags">' + tags.join('') + '</div></div></div>' +
        '<div class="cn-acts">' + acts + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="cn-bulk hidden" id="cnBulk"><b id="cnN"></b><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="cnClr" style="color:#fff;border-color:rgba(255,255,255,.4)">' + t('cnClear') + '</button><button type="button" class="btn btn-sm" id="cnGo" style="background:#fff;color:#17221A">' + ph('checks') + t('cnBulk') + '</button><small>' + t('cnBulkLead') + '</small></div>';
    box.innerHTML = h; if (V) V.wire(box);
    $$('[data-ty]', box).forEach(function(b){ b.onclick = function(){ filter = b.dataset.ty; S.cnType = filter; sel = {}; draw(r); }; });
    var bar = $('#cnBulk', box);
    function selType(){ var ks = Object.keys(sel); return ks.length ? shown[ks[0]].type : ''; }
    function paintBulk(){
      var ks = Object.keys(sel), ty = selType();
      $$('[data-sel]', box).forEach(function(c){ var it = shown[c.dataset.sel]; c.disabled = !!ty && it.type !== ty; });
      bar.classList.toggle('hidden', ks.length < 2);
      $('#cnN', box).textContent = ks.length + ' ' + t('cnSel') + (ty ? ' · ' + t('cnt_' + ty) : '');
    }
    $$('[data-sel]', box).forEach(function(c){ c.onchange = function(){ if (c.checked) sel[c.dataset.sel] = 1; else delete sel[c.dataset.sel]; paintBulk(); }; });
    $('#cnClr', box).onclick = function(){ sel = {}; $$('[data-sel]', box).forEach(function(c){ c.checked = false; }); paintBulk(); };
    confirmTap($('#cnGo', box), function(){
      var list = Object.keys(sel).map(function(k){ return shown[k]; }), ty = list[0].type, dec = list[0].actions.indexOf('approve') >= 0 ? 'approve' : 'done';
      api('approvalsAct', { items: list.map(function(x){ return { type: x.type, id: x.id, task: x.task }; }), decision: dec, confirm: true }).then(function(a){
        if (!a.ok) { toast(errText(a.error)); return load(true); }
        var bad = a.results.filter(function(x){ return !x.ok; });
        toast(t('cnBulkDone') + ' ' + a.done + (bad.length ? ' · ' + t('cnBulkFail') + ' ' + bad.length + ': ' + errText(bad[0].error) : ''));
        sel = {}; refreshTasks(); load(true);
      });
    });
    var act = function(x, dec, note, done){
      api('approvalsAct', { items: [{ type: x.type, id: x.id, task: x.task }], decision: dec, note: note || '' }).then(function(a){
        var res = a.ok ? a.results[0] : { ok: false, error: a.error };
        if (done) done(res);
        if (!res.ok) { if (res.error === 'note_required' && !note) return noteDrawer(x, dec); return toast(errText(res.error)); }
        toast(t('cnSent') + (res.ref ? ' · ' + res.ref : '')); refreshTasks(); load(true);
      });
    };
    function noteDrawer(x, dec){
      var req = dec === 'reject' || NOTE_ON_APPROVE[x.type];
      var d = drawer('<h3>' + (dec === 'reject' ? t('cnReject') : t('cnApprove')) + '</h3><p class="hr-hint">' + t('cnt_' + x.type) + (x.emp ? sep() + empLine(x.emp) : '') + (x.ref ? sep() + '<bdi>' + esc(x.ref) + '</bdi>' : '') + '</p>' +
        '<form class="form" id="cnF">' + fld(dec === 'reject' ? t('cnNoteReq') : req ? t('cnNote') : t('cnNoteOpt'), '<textarea name="n" rows="3" maxlength="500"' + (req ? ' required' : '') + '></textarea>') +
        '<p class="hr-bad" id="cnE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + (dec === 'reject' ? t('cnReject') : t('cnApprove')) + '</button></div></form>');
      $('#cnF', d).onsubmit = function(ev){
        ev.preventDefault(); var n = this.elements.n.value.trim(), b = this.querySelector('[type=submit]');
        if (req && !n) return $('#cnE', d).textContent = errText('note_required');
        b.disabled = true;
        act(x, dec, n, function(res){ b.disabled = false; if (res.ok) d.remove(); else $('#cnE', d).textContent = errText(res.error); });
      };
    }
    $$('[data-ap]', box).forEach(function(b){ var x = shown[b.dataset.ap];
      if (NOTE_ON_APPROVE[x.type]) b.onclick = function(){ noteDrawer(x, 'approve'); };
      else confirmTap(b, function(){ act(x, 'approve', '', function(res){ if (!res.ok) b.disabled = false; }); });
    });
    $$('[data-dn]', box).forEach(function(b){ var x = shown[b.dataset.dn]; confirmTap(b, function(){ act(x, 'done', '', function(res){ if (!res.ok) b.disabled = false; }); }); });
    $$('[data-rj]', box).forEach(function(b){ b.onclick = function(){ noteDrawer(shown[b.dataset.rj], 'reject'); }; });
    $$('[data-go]', box).forEach(function(b){ b.onclick = function(){ openLink(shown[b.dataset.go].link); }; });
    $$('[data-hi]', box).forEach(function(b){ b.onclick = function(){ history(shown[b.dataset.hi]); }; });
  }
  load(true);
}
/** Who did what, when, with what note and on whose behalf. */
function history(x){
  var d = drawer('<h3>' + t('cnHistT') + '</h3><p class="hr-hint">' + t('cnt_' + x.type) + (x.ref ? sep() + '<bdi>' + esc(x.ref) + '</bdi>' : '') + '</p><div id="cnH"><span class="sk"></span><span class="sk" style="width:70%"></span></div>');
  var el = $('#cnH', d);
  api('approvalHistory', { type: x.type, id: x.id }, true).then(function(r){
    if (!r.ok) return el.innerHTML = bad(r.error);
    var it = r.item || {};
    el.innerHTML = (it.emp ? '<p>' + empLine(it.emp) + (it.status ? ' ' + chip(esc(tl('rs_' + it.status, tl('ys_' + it.status, it.status)))) : '') + '</p>' : '') +
      (r.entries.length ? '<ul class="cn-tl">' + r.entries.map(function(e){
        var no = e.decision === 'reject' || e.decision === 'rejected' || e.decision === 'cancelled' || e.decision === 'decline';
        var step = e.step && !/^\d{4}-/.test(e.step) ? tl('yct_' + e.step, tl('cl_' + e.step, tl('rstep_' + e.step, ''))) : '';
        return '<li class="' + (no ? 'no' : '') + '"><b>' + esc(tl('cnd_' + e.decision, e.decision)) + (e.by ? sep() + esc(e.by) : '') + '</b>' +
          '<small>' + when(e.at) + (step ? sep() + esc(step) : '') + (e.role === 'delegate' || e.onBehalfOf ? sep() + t('cnOnBehalf') + ' ' + esc(e.onBehalfOf || '') : e.role === 'hr_on_behalf' ? sep() + t('cnHrBehalf') : '') + '</small>' +
          (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="hr-hint">-</p>');
  });
}

// ================= leave cycle =================
var TASK_ICON = { handover: 'handshake', handover_accept: 'user-check', custody: 'package', delegation: 'arrows-left-right', exit_reentry: 'airplane-takeoff', ticket: 'ticket', leave_salary: 'money' };
var YS_CLS = { approved: '', clearing: 'late', cleared: 'in', departed: 'in', overdue_return: 'absent', returned: 'late', closed: 'off', cancelled: 'off' };
function ycChip(s){ return chip(t('ys_' + s), YS_CLS[s]); }
function cycles(body){
  var want = S.ycWant || 'open';
  body.innerHTML = head(t('ycTitle')) + '<p class="hr-hint" style="margin:-4px 0 12px">' + t('ycLead') + '</p><div id="ycB"></div>';
  var box = $('#ycB', body);
  function load(){
    busy(box);
    api('leaveCycleList', { status: want }, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var V = window.Viz, s = r.stats;
      var h = V ? '<div class="db-tiles">' + V.tile(t('ycOut'), V.n1(s.outNow, 0), '', null, true, true) + V.tile(t('ycBackWeek'), V.n1(s.returningWeek, 0), '') +
        V.tile(t('ycOverdueT'), '<span class="db-status">' + (s.overdueTasks ? ph('warning-circle') + ' ' : '') + s.overdueTasks + '</span>', '') +
        V.tile(t('ycArt80T'), V.n1(s.art80, 0), '') + V.tile(t('ycTotal'), V.n1(s.total, 0), t('ycMinDays') + ' ' + plural(r.minDays, 'days')) + '</div>' : '';
      var sts = ['open', 'all', 'clearing', 'cleared', 'departed', 'overdue_return', 'returned', 'closed', 'cancelled'];
      h += '<div class="toolbar"><select id="ycSel" aria-label="' + t('ycTitle') + '">' + sts.map(function(k){ return '<option value="' + k + '"' + (k === want ? ' selected' : '') + '>' + (k === 'open' || k === 'all' ? t('ycSt_' + k) : t('ys_' + k)) + (s.byStatus[k] ? ' (' + s.byStatus[k] + ')' : '') + '</option>'; }).join('') + '</select>' +
        (r.canOpen ? '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="ycOpen">' + ph('plus') + t('ycOpenBtn') + '</button>' : '') + '</div>';
      h += r.rows.length ? '<div class="list">' + r.rows.map(function(c, i){
        var pct = c.required ? Math.round(c.done / c.required * 100) : 100;
        return '<div class="row click" data-c="' + i + '" tabindex="0">' + av(c.emp) + '<div class="main"><b>' + empLine(c.emp) + sep() + '<bdi>' + esc(c.ref) + '</bdi></b>' +
          '<small>' + fmt(c.fromDate) + ' - ' + fmt(c.toDate) + sep() + plural(c.days, 'days') + sep() + t('ycBack') + ' ' + fmt(c.backOn) + sep() + t('ycProgress') + ' ' + c.done + '/' + c.required + (c.mine ? sep() + t('ycMineTask') : '') + '</small>' +
          (c.art80 && c.art80.flagged ? '<small class="op-late" style="color:#B42318">' + ph('warning') + ' ' + t('ycArt80T') + '</small>' : '') + '</div>' + ycChip(c.status) + '</div>';
      }).join('') + '</div>' : empty('airplane-tilt', t('ycNone'));
      box.innerHTML = h; if (V) V.wire(box);
      $('#ycSel', box).onchange = function(){ want = this.value; S.ycWant = want; load(); };
      $$('[data-c]', box).forEach(function(el){ var go = function(){ cycleDrawer(r.rows[el.dataset.c], load); }; el.onclick = go; el.onkeydown = function(ev){ if (ev.key === 'Enter') go(); }; });
      var ob = $('#ycOpen', box); if (ob) ob.onclick = function(){ openManual(r.openable || [], load); };
    });
  }
  load();
}
/** HR: open a cycle by hand for an approved leave that has none (shorter than the threshold, or approved before this module). */
function openManual(rows, done){
  var d = drawer('<h3>' + t('ycOpenBtn') + '</h3><p class="hr-hint">' + t('ycOpenLead') + '</p><div id="ymB"></div>');
  var el = $('#ymB', d);
  if (!rows.length) { el.innerHTML = '<p class="hr-hint">' + t('ycNone') + '</p>'; return; }
  el.innerHTML = '<form class="form" id="ymF">' + fld(t('ycReqId'), '<select name="id" required>' + opts(rows.map(function(x){ return [x.id, (x.emp ? x.emp.name + ' · ' : '') + x.ref + ' · ' + x.fromDate + ' - ' + x.toDate]; }), '', '-') + '</select>') +
    '<p class="hr-bad" id="ymE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('ycOpenBtn') + '</button></div></form>';
  $('#ymF', d).onsubmit = function(ev){ ev.preventDefault(); var b = this.querySelector('[type=submit]'); b.disabled = true;
    api('leaveCycleOpen', { requestId: this.elements.id.value }).then(function(x){ b.disabled = false; if (!x.ok) return $('#ymE', d).textContent = errText(x.error); d.remove(); toast(x.cycle.ref); done(); cycleDrawer(x.cycle, done); }); };
}
function taskData(x){
  var dd = x.data || {}, p = [];
  if (x.key === 'handover' && dd.substitute) p.push(t('ycSub') + ': ' + empLine(dd.substitute));
  if (x.key === 'handover' && dd.notes) p.push(esc(dd.notes));
  if (x.key === 'delegation' && dd.delegate) p.push(t('ycDelegate') + ': ' + empLine(dd.delegate) + (dd.delegationRef ? ' <bdi>' + esc(dd.delegationRef) + '</bdi>' : ''));
  if (x.key === 'exit_reentry' && dd.visaNo) p.push(t('ycVisaNo') + ' <bdi class="num">' + esc(dd.visaNo) + '</bdi>' + sep() + t('ycValid') + ' ' + fmt(dd.validUntil) + (dd.kind ? sep() + t(dd.kind === 'multiple' ? 'ycMultiple' : 'ycSingle') : ''));
  if (x.key === 'exit_reentry' && dd.request) p.push('<bdi>' + esc(dd.request.ref) + '</bdi>' + (dd.request.visaNo ? sep() + '<bdi class="num">' + esc(dd.request.visaNo) + '</bdi>' : '') + (dd.request.expiry ? sep() + fmt(dd.request.expiry) : ''));
  if (x.key === 'ticket' && dd.right) p.push(esc(dd.right.travelClass || '') + (dd.right.route ? sep() + esc(dd.right.route) : '') + (dd.right.remaining != null ? sep() + plural(dd.right.remaining, 'people') : ''));
  if (x.key === 'ticket' && dd.bookingRef) p.push(t('ycBooking') + ' <bdi>' + esc(dd.bookingRef) + '</bdi>');
  if (x.key === 'leave_salary' && dd.amount) p.push(money(dd.amount) + sep() + esc(monthName(dd.month)) + (dd.adjRef ? sep() + '<bdi>' + esc(dd.adjRef) + '</bdi>' : ''));
  if (x.key === 'custody' && dd.held && dd.held.length) p.push(t('ycHeld') + ': ' + dd.held.map(function(a){ return esc(a.nameAr) + (a.serial ? ' <bdi>' + esc(a.serial) + '</bdi>' : ''); }).join('، '));
  return p.join('<br>');
}
/** One cycle: tasks with their owners, the departure and return steps, the Art. 80 warning and the history. */
function cycleDrawer(c, done){
  var d = drawer('<h3>' + t('ycTitle') + ' <bdi>' + esc(c.ref) + '</bdi></h3><div id="ycD"></div>');
  var el = $('#ycD', d), people = null;
  function reopen(nc){ c = nc; paint(); if (done) done(); refreshTasks(); }
  function needPeople(cb){ if (people) return cb(people); api('myLeaveCycles', {}, true).then(function(r){ people = r.ok ? r.people : []; cb(people); }); }
  function paint(){
    var h = '<p class="hr-hint">' + empLine(c.emp) + sep() + ycChip(c.status) + sep() + t('ycReq') + ' <bdi>' + esc(c.requestRef) + '</bdi></p>' +
      '<dl class="op-meta" style="display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);gap:4px 12px;font-size:13.5px"><dt>' + t('ycDays') + '</dt><dd>' + fmt(c.fromDate) + ' - ' + fmt(c.toDate) + sep() + plural(c.days, 'days') + '</dd>' +
      '<dt>' + t('ycBack') + '</dt><dd>' + fmt(c.backOn) + (c.overdueDays ? ' ' + chip(t('ycOverdue') + ' ' + plural(c.overdueDays, 'days'), 'absent') : '') + '</dd>' +
      (c.substitute ? '<dt>' + t('ycSub') + '</dt><dd>' + empLine(c.substitute) + '</dd>' : '') +
      (c.outcome ? '<dt>' + t('ycOutcome') + '</dt><dd>' + esc(t({ early: 'ycEarly', on_time: 'ycOnTime', absence: 'ycAbsence', extension: 'ycExtension' }[c.outcome] || c.outcome)) +
        (c.earlyDays ? sep() + t('ycEarlyDays') + ' ' + num(c.earlyDays) : '') + (c.lateDays ? sep() + t('ycLateDays') + ' ' + num(c.lateDays) : '') + (c.extensionRef ? sep() + '<bdi>' + esc(c.extensionRef) + '</bdi>' : '') + '</dd>' : '') + '</dl>';
    if (c.art80 && c.art80.flagged) h += '<div class="yc-warn">' + ph('warning-octagon') + '<div>' + t('ycArt80') + (c.art80.provisional ? '<br><small>' + t('ycArt80Prov') + '</small>' : '') + '</div></div>';
    h += '<h4 class="op-h4">' + ph('list-checks') + t('ycTasks') + ' <small class="hr-hint">' + c.done + '/' + c.required + '</small></h4><div>' + c.tasks.map(function(x, i){
      var ic = x.status === 'done' ? 'check-circle' : x.status === 'na' ? 'minus-circle' : x.status === 'waiting' ? 'hourglass' : TASK_ICON[x.key] || 'circle';
      return '<div class="yc-task ' + x.status + '">' + ph(ic, x.status === 'done' ? 'fill' : '') + '<div class="main"><b>' + t('yct_' + x.key) + (x.required ? '' : ' <small class="hr-hint" style="display:inline">(' + t('ycOptional') + ')</small>') + '</b>' +
        '<small>' + t('yo_' + x.owner) + sep() + t('yts_' + x.status) + (x.auto ? ' (' + t('ycAuto') + ')' : '') + (x.due && x.status === 'open' ? sep() + t('cnDue') + ' ' + fmt(x.due) : '') + (x.by ? sep() + esc(x.by) + (x.at ? ' ' + fmt(day(x.at)) : '') : '') + (x.onBehalfOf ? sep() + t('cnOnBehalf') + ' ' + esc(x.onBehalfOf) : '') + '</small>' +
        (taskData(x) ? '<small>' + taskData(x) + '</small>' : '') + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '<div data-tf="' + i + '"></div></div></div>';
    }).join('') + '</div>';
    h += '<h4 class="op-h4">' + ph('airplane') + t('ycSteps') + '</h4><div class="yc-steps">' + c.steps.map(function(s){
      return '<div class="yc-step' + (s.status === 'done' ? ' done' : '') + '"><b>' + ph(s.status === 'done' ? 'check-circle' : s.key === 'depart' ? 'airplane-takeoff' : s.key === 'return' ? 'airplane-landing' : 'seal-check', s.status === 'done' ? 'fill' : '') + t('yct_' + s.key) + '</b>' +
        '<small>' + (s.date ? fmt(s.date) + (s.by ? sep() + esc(s.by) : '') : s.due ? t('cnDue') + ' ' + fmt(s.due) : '') + '</small><div data-sf="' + s.key + '"></div></div>'; }).join('') + '</div>';
    if (c.history && c.history.length) h += '<h4 class="op-h4">' + ph('clock-counter-clockwise') + t('ycHistory') + '</h4><ul class="cn-tl">' + c.history.slice().reverse().map(function(e){
      return '<li class="' + (e.action === 'decline' || e.action === 'cancelled' ? 'no' : '') + '"><b>' + esc(tl('cnd_' + e.action, e.action)) + (e.key && !/^\d{4}-/.test(e.key) ? sep() + esc(tl('yct_' + e.key, e.key)) : e.key ? sep() + fmt(e.key) : '') + '</b><small>' + esc(e.by) + sep() + when(e.at) + (e.onBehalfOf ? sep() + t('cnOnBehalf') + ' ' + esc(e.onBehalfOf) : '') + '</small>' + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
    h += '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn btn-line btn-sm" id="ycPr">' + ph('printer') + t('ycPrint') + '</button></div><p class="hr-bad" id="ycE" role="alert"></p>';
    el.innerHTML = h;
    var er = $('#ycE', el);
    $('#ycPr', el).onclick = function(){ printCycle(c); };
    c.tasks.forEach(function(x, i){ if (x.canAct) taskForm($('[data-tf="' + i + '"]', el), x); });
    c.steps.forEach(function(s){ if (s.canAct) stepForm($('[data-sf="' + s.key + '"]', el), s); });
    function send(action, payload, b){
      if (b) b.disabled = true;
      api(action, payload).then(function(r){ if (b) b.disabled = false; if (!r.ok) { er.textContent = errText(r.error); return; } toast(t('cnSent')); reopen(r.cycle); });
    }
    function naBtn(x){ return x.key === 'handover_accept' ? '' : '<button type="button" class="btn btn-line btn-sm" data-na>' + t('ycNa') + '</button>'; }
    function taskForm(w, x){
      var f = '', key = x.key;
      if (key === 'handover') f = '<div data-pp>' + fld(t('ycSub'), '<select name="sub" required><option value="">-</option></select>') + '</div>' + fld(t('ycNotes'), '<textarea name="notes" rows="3" maxlength="1000"></textarea>');
      else if (key === 'handover_accept') f = '<p class="hr-hint">' + t('ycCoverLead') + '</p>' + fld(t('ycDeclineNote'), '<input name="note" maxlength="500">');
      else if (key === 'delegation') f = '<div data-pp>' + fld(t('ycDelegate'), '<select name="dg"><option value="">-</option></select>') + '</div>';
      else if (key === 'exit_reentry') f = '<div class="two">' + fld(t('ycVisaNo'), '<input name="vn" dir="ltr" maxlength="30" value="' + esc((x.data && x.data.request && x.data.request.visaNo) || '') + '">') + fld(t('ycValid'), '<input name="vu" type="date" value="' + esc((x.data && x.data.request && x.data.request.expiry) || '') + '">') + '</div>' +
        fld(t('ycVisaKind'), '<select name="vk"><option value="single">' + t('ycSingle') + '</option><option value="multiple">' + t('ycMultiple') + '</option></select>');
      else if (key === 'ticket') f = '<div class="two">' + fld(t('ycBooking'), '<input name="br" dir="ltr" maxlength="40">') + fld(t('ycRoute'), '<input name="rt" dir="ltr" maxlength="80" value="' + esc((x.data && x.data.right && x.data.right.route) || '') + '">') + '</div>';
      else if (key === 'leave_salary') f = '<div class="two">' + fld(t('ycAmount'), '<input name="am" type="number" min="1" step="0.01" inputmode="decimal" value="' + esc(x.data && x.data.suggested != null ? x.data.suggested : '') + '">', x.data && x.data.suggested != null ? t('ycSuggested') + ': ' + money(x.data.suggested) : '') + fld(t('ycMonth'), '<input name="mo" type="month">') + '</div>';
      if (key !== 'handover_accept') f += fld(t('cnNoteOpt'), '<input name="note" maxlength="500">');
      w.innerHTML = '<form class="form yc-form">' + f + '<div class="btnrow">' + (key === 'handover_accept' ? '<button class="btn btn-dark btn-sm" type="submit">' + ph('check') + t('ycAccept') + '</button><button type="button" class="btn btn-line btn-sm" data-dec>' + t('ycDecline') + '</button>'
        : '<button class="btn btn-dark btn-sm" type="submit">' + ph('check') + t('ycSave') + '</button>' + naBtn(x)) + '</div></form>';
      var fm = $('form', w);
      if ($('[data-pp]', w)) needPeople(function(pp){ var s = fm.querySelector('select'); s.innerHTML = opts(pp.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), key === 'delegation' && c.substitute ? c.substitute.id : '', '-'); });
      var base = function(){ return { id: c.id, key: key, note: fm.elements.note ? fm.elements.note.value.trim() : '' }; };
      fm.onsubmit = function(ev){
        ev.preventDefault();
        var p = base(), b = fm.querySelector('[type=submit]');
        if (key === 'handover') { if (!fm.elements.sub.value) return er.textContent = t('ycNeedSub'); p.data = { substituteId: fm.elements.sub.value, notes: fm.elements.notes.value.trim() }; }
        else if (key === 'handover_accept') { p.op = 'accept'; p.note = ''; }
        else if (key === 'delegation') p.data = { delegateId: fm.elements.dg.value };
        else if (key === 'exit_reentry') p.data = { visaNo: fm.elements.vn.value.trim(), validUntil: fm.elements.vu.value, kind: fm.elements.vk.value };
        else if (key === 'ticket') p.data = { bookingRef: fm.elements.br.value.trim(), route: fm.elements.rt.value.trim() };
        else if (key === 'leave_salary') p.data = { amount: fm.elements.am.value, month: fm.elements.mo.value };
        if (!p.op) p.op = 'done';
        send('leaveCycleTask', p, b);
      };
      var nb = $('[data-na]', w); if (nb) nb.onclick = function(){ var p = base(); if (!p.note) return er.textContent = t('ycNaNote'); p.op = 'na'; send('leaveCycleTask', p, nb); };
      var db = $('[data-dec]', w); if (db) db.onclick = function(){ var n = fm.elements.note.value.trim(); if (!n) return er.textContent = t('ycDeclineNote'); send('leaveCycleTask', { id: c.id, key: key, op: 'decline', note: n }, db); };
    }
    function stepForm(w, s){
      var td = riyadhToday(), f = fld(t('ycDate'), '<input name="date" type="date" max="' + td + '" value="' + td + '">');
      if (s.key === 'depart' && !c.cleared) f += fld(t('ycDepartNote'), '<input name="note" maxlength="500">');
      if (s.key === 'confirm') f += '<fieldset class="field"><legend class="hr-hint">' + t('ycLateOutcome') + '</legend><div class="checks"><label><input type="radio" name="oc" value="" checked>-</label><label><input type="radio" name="oc" value="absence">' + t('ycAbsence') + '</label><label><input type="radio" name="oc" value="extension">' + t('ycExtension') + '</label></div></fieldset>' +
        fld(t('ycExtType'), '<select name="et"><option value="annual">' + t('ycAnnual') + '</option><option value="unpaid">' + t('ycUnpaid') + '</option></select>') + fld(t('cnNoteOpt'), '<input name="note" maxlength="500">');
      w.innerHTML = '<form class="form yc-form">' + f + '<div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + t(s.key === 'depart' ? 'ycDepart' : s.key === 'return' ? 'ycReturn' : 'ycConfirm') + '</button></div></form>';
      var fm = $('form', w);
      fm.onsubmit = function(ev){
        ev.preventDefault(); var b = fm.querySelector('[type=submit]'), p = { id: c.id, date: fm.elements.date.value };
        if (fm.elements.note) p.note = fm.elements.note.value.trim();
        if (s.key === 'confirm') { var oc = fm.querySelector('[name=oc]:checked'); if (oc && oc.value) p.outcome = oc.value; p.extensionType = fm.elements.et.value; }
        send(s.key === 'depart' ? 'leaveCycleDepart' : s.key === 'return' ? 'leaveCycleReturn' : 'leaveCycleConfirm', p, b);
      };
    }
  }
  paint();
}
/** The pre-leave clearance on A4: the tasks, who did them and when, and three signature lines. */
function printCycle(c){
  if (!window.Doc) return loadScript('js/doc.js').then(function(){ printCycle(c); });
  var en = S.lang === 'en', D = Doc;
  var body = '<section><h2 class="sh">' + D.esc(en ? 'Leave' : 'الإجازة') + '</h2><dl class="grid c4">' +
    [[en ? 'Employee' : 'الموظف', (c.emp ? c.emp.name + ' (' + c.emp.empNo + ')' : '')], [en ? 'Leave request' : 'طلب الإجازة', c.requestRef], [en ? 'From - to' : 'من - إلى', c.fromDate + ' - ' + c.toDate], [en ? 'Due back' : 'موعد العودة', c.backOn]]
      .map(function(x){ return '<div><dt>' + D.esc(x[0]) + '</dt><dd>' + D.esc(x[1] || '-') + '</dd></div>'; }).join('') + '</dl></section>' +
    '<section><h2 class="sh">' + D.esc(t('ycTasks')) + '</h2><table class="tb"><thead><tr><th>' + D.esc(en ? 'Task' : 'المهمة') + '</th><th>' + D.esc(en ? 'Owner' : 'المسؤول') + '</th><th>' + D.esc(en ? 'Status' : 'الحالة') + '</th><th>' + D.esc(en ? 'By / date' : 'بواسطة / التاريخ') + '</th><th>' + D.esc(en ? 'Details' : 'التفاصيل') + '</th></tr></thead><tbody>' +
    c.tasks.map(function(x){ var tmp = document.createElement('div'); tmp.innerHTML = taskData(x) + (x.note ? ' ' + esc(x.note) : '');
      return '<tr><td>' + D.esc(t('yct_' + x.key)) + (x.required ? '' : '<small>' + D.esc(t('ycOptional')) + '</small>') + '</td><td>' + D.esc(t('yo_' + x.owner)) + '</td><td>' + D.esc(t('yts_' + x.status)) + '</td><td>' + D.esc(x.by || '') + (x.at ? '<small class="num">' + D.esc(day(x.at)) + '</small>' : '') + '</td><td>' + D.esc(tmp.textContent) + '</td></tr>'; }).join('') +
    '</tbody></table></section>' +
    (c.substitute ? '<section><p>' + D.esc(t('ycSub')) + ': <b>' + D.esc(c.substitute.name) + '</b></p></section>' : '');
  D.open({ lang: en ? 'en' : 'ar', kind: t('ycPrintKind'), title: t('ycPrintTitle'), ref: c.ref, body: body, qr: c.ref + '|' + c.requestRef, by: S.me && S.me.name,
    signatures: [t('ycSignEmp'), t('ycSignMgr'), t('ycSignHr')] });
}
/** The employee's own cycles and the ones they cover, as cards (hidden when there is nothing). */
function myCards(el){
  el.innerHTML = '';
  apiFresh('myLeaveCycles', {}, function(r){
    if (!el.isConnected) return;
    el.innerHTML = '';
    if (!r.ok || (!r.mine.length && !r.covering.length)) return;
    var h3 = function(icon, title, extra){ return '<h3><span class="ic">' + ph(icon) + '</span>' + title + '<span class="sp"></span>' + (extra || '') + '</h3>'; };
    var card = function(title, icon, list, cover){
      var todo = list.reduce(function(n, c){ return n + c.mine; }, 0), d = document.createElement('div');
      d.className = 'mf-card op-card';
      d.innerHTML = h3(icon, title, todo ? chip('<span class="num">' + todo + '</span>', 'late') : '') + (cover ? '<p>' + t('ycCoverLead') + '</p>' : '') + list.map(function(c, i){
        return '<div class="row"><div class="main"><b>' + (cover ? empLine(c.emp) + sep() : '') + fmt(c.fromDate) + ' - ' + fmt(c.toDate) + '</b><small><bdi>' + esc(c.ref) + '</bdi>' + sep() + t('ycProgress') + ' ' + c.done + '/' + c.required + sep() + t('ycBack') + ' ' + fmt(c.backOn) + '</small></div>' +
          ycChip(c.status) + ' <button type="button" class="btn ' + (c.mine ? 'btn-dark' : 'btn-line') + ' btn-sm" data-yc="' + i + '">' + (c.mine ? t('ycMineTask') : ph('eye')) + '</button></div>'; }).join('');
      el.appendChild(d);
      $$('[data-yc]', d).forEach(function(b){ b.onclick = function(){ cycleDrawer(list[b.dataset.yc], function(){ myCards(el); }); }; });
    };
    if (r.mine.length) card(t('ycMine'), 'airplane-tilt', r.mine, false);
    if (r.covering.length) card(t('ycCovering'), 'handshake', r.covering, true);
  }, true);
}

// ================= approval flows (HR, admin) =================
var KINDS = ['manager', 'dept_head', 'hr', 'payroll', 'executive', 'person'];
function config(body){
  body.innerHTML = head(t('fwTitle')) + '<p class="hr-hint" style="margin:-4px 0 12px">' + t('fwLead') + '</p><div id="fwB"></div>';
  var box = $('#fwB', body);
  function load(){
    busy(box);
    api('flowList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var chain = function(steps){ return '<div class="fw-chain">' + steps.map(function(s, i){
        var w = s.when || {}, cond = [w.amountOver != null ? '> ' + num(w.amountOver) + ' ' + sar() : '', w.daysOver != null ? '> ' + plural(w.daysOver, 'days') : '', w.departmentId ? deptName(r.depts, w.departmentId) : '', w.saudi ? t(w.saudi === 'saudi' ? 'fwSaudiOnly' : 'fwNonSaudi') : ''].filter(Boolean).join(sep());
        return (i ? ph(S.lang === 'ar' ? 'caret-left' : 'caret-right') : '') + chip(esc(t('fwk_' + s.kind)) + (s.person ? ': ' + esc(s.person.name) : '') + (cond ? ' <small>(' + esc(cond) + ')</small>' : '') + (s.slaHours ? ' <small class="num">' + s.slaHours + t('cnHours') + '</small>' : ''), s.when ? 'review' : 'in'); }).join('') + '</div>'; };
      var h = '<div class="fw-card"><h4>' + ph('gear-six') + t('fwSettings') + '</h4><form class="form" id="fwS"><div class="two">' + fld(t('fwSlaH'), '<input name="sla" type="number" min="1" max="720" step="1" value="' + r.settings.approvalSlaHours + '">') +
        fld(t('fwMinDays'), '<input name="min" type="number" min="1" max="365" step="1" value="' + r.settings.leaveClearanceMinDays + '">') + '</div><p class="hr-bad" id="fwSE" role="alert"></p><div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + t('ycSave') + '</button></div></form></div>';
      h += r.types.map(function(ty, i){
        var a = ty.active;
        return '<div class="fw-card"><h4>' + ph('flow-arrow') + esc(tl('rt_' + ty.type, ty.type)) + '<span class="sp"></span>' + (a ? chip(esc(a.ref) + ' v' + a.version, 'in') : chip(t('fwNoFlow'), 'off')) + '</h4>' +
          '<p class="hr-hint" style="margin:0">' + t('fwBuiltin') + '</p>' + chain(ty.builtin) + (a ? '<p class="hr-hint" style="margin:6px 0 0">' + t('fwActive') + '</p>' + chain(a.steps) + (a.note ? '<p class="hr-hint">' + esc(a.note) + '</p>' : '') : '') +
          '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn btn-dark btn-sm" data-ed="' + i + '">' + ph('pencil-simple') + t('fwEdit') + '</button>' + (a ? '<button type="button" class="btn btn-line btn-sm" data-rs="' + i + '">' + t('fwReset') + '</button>' : '') +
          (ty.versions.length ? '<button type="button" class="btn btn-line btn-sm" data-vs="' + i + '">' + ph('clock-counter-clockwise') + t('fwVersions') + ' (' + ty.versions.length + ')</button>' : '') + '</div></div>';
      }).join('');
      box.innerHTML = h;
      $('#fwS', box).onsubmit = function(ev){
        ev.preventDefault(); var b = this.querySelector('[type=submit]'); b.disabled = true;
        api('flowSettingsSave', { settings: { approvalSlaHours: Number(this.elements.sla.value), leaveClearanceMinDays: Number(this.elements.min.value) } }).then(function(x){ b.disabled = false; if (!x.ok) return $('#fwSE', box).textContent = errText(x.error) + (x.key ? ' (' + x.key + ')' : ''); toast(t('fwSetSaved')); });
      };
      $$('[data-ed]', box).forEach(function(b){ b.onclick = function(){ editFlow(r, r.types[b.dataset.ed], load); }; });
      $$('[data-rs]', box).forEach(function(b){ var ty = r.types[b.dataset.rs]; confirmTap(b, function(){ api('flowSave', { type: ty.type, reset: true }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('fwSaved')); load(); }); }); });
      $$('[data-vs]', box).forEach(function(b){ b.onclick = function(){ var ty = r.types[b.dataset.vs];
        drawer('<h3>' + t('fwVersions') + sep() + esc(tl('rt_' + ty.type, ty.type)) + '</h3><div class="list">' + ty.versions.map(function(v){
          return '<div class="row"><div class="main"><b><bdi>' + esc(v.ref) + '</bdi> v' + v.version + '</b><small>' + esc(v.createdBy) + sep() + when(v.createdAt) + (v.note ? sep() + esc(v.note) : '') + '</small>' + chain(v.steps) + '</div>' + chip(t('fws_' + v.status), v.status === 'active' ? 'in' : 'off') + '</div>'; }).join('') + '</div>'); }; });
    });
  }
  load();
}
function deptName(depts, id){ var d = (depts || []).filter(function(x){ return x.id === id; })[0]; return d ? lang(d.nameAr, d.nameEn) : id; }
function editFlow(r, ty, done){
  var steps = JSON.parse(JSON.stringify(ty.active ? ty.active.steps : ty.builtin)).map(function(s){ return { kind: s.kind, personId: s.personId || '', when: s.when || {}, slaHours: s.slaHours || '' }; });
  var d = drawer('<h3>' + t('fwEdit') + sep() + esc(tl('rt_' + ty.type, ty.type)) + '</h3><p class="hr-hint">' + t('fwRules') + '</p><div id="feB"></div>');
  var el = $('#feB', d);
  function paint(){
    el.innerHTML = '<div>' + steps.map(function(s, i){
      var w = s.when || {};
      var cond = '<div class="fw-when">' + (ty.type === 'advance' ? fld(t('fwAmountOver'), '<input data-k="amountOver" type="number" min="0" step="1" value="' + esc(w.amountOver == null ? '' : w.amountOver) + '">') : '') +
        (ty.type === 'leave' ? fld(t('fwDaysOver'), '<input data-k="daysOver" type="number" min="0" step="1" value="' + esc(w.daysOver == null ? '' : w.daysOver) + '">') : '') +
        fld(t('fwDept'), '<select data-k="departmentId">' + opts(r.depts.map(function(x){ return [x.id, lang(x.nameAr, x.nameEn)]; }), w.departmentId || '', t('fwAnyDept')) + '</select>') +
        fld(t('fwSaudi'), '<select data-k="saudi">' + opts([['saudi', t('fwSaudiOnly')], ['non_saudi', t('fwNonSaudi')]], w.saudi || '', t('fwAnyone')) + '</select>') + '</div>';
      return '<div class="fw-step" data-i="' + i + '"><div>' + fld(t('fwKind'), '<select data-f="kind">' + opts(KINDS.map(function(k){ return [k, t('fwk_' + k) + (k === 'payroll' || k === 'executive' ? ' (' + (r.holders[k] || 0) + ' ' + t('fwHolders') + ')' : '')]; }), s.kind) + '</select>') +
        (s.kind === 'person' ? fld(t('fwPerson'), '<select data-f="personId">' + opts(r.people.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), s.personId, '-') + '</select>') : '') + '</div>' +
        '<div><small class="hr-hint">' + t('fwWhen') + '</small>' + cond + '</div>' + fld(t('fwSla'), '<input data-f="slaHours" type="number" min="1" max="720" step="1" value="' + esc(s.slaHours) + '">') +
        '<div class="ctl"><button type="button" class="btn btn-line btn-sm" data-up aria-label="' + t('fwUp') + '"' + (i ? '' : ' disabled') + '>' + ph('arrow-up') + '</button><button type="button" class="btn btn-line btn-sm" data-dn aria-label="' + t('fwDown') + '"' + (i < steps.length - 1 ? '' : ' disabled') + '>' + ph('arrow-down') + '</button>' +
        '<button type="button" class="btn btn-line btn-sm" data-rm aria-label="' + t('fwRemove') + '">' + ph('trash') + '</button></div></div>';
    }).join('') + '</div><div class="btnrow" style="margin:8px 0"><button type="button" class="btn btn-line btn-sm" id="feAdd"' + (steps.length >= 6 ? ' disabled' : '') + '>' + ph('plus') + t('fwAdd') + '</button></div>' +
      '<form class="form" id="feF">' + fld(t('fwNote'), '<input name="note" maxlength="300">') + '<p class="hr-bad" id="feE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('fwSave') + '</button></div></form>';
    $$('.fw-step', el).forEach(function(row){
      var i = +row.dataset.i, s = steps[i];
      $$('[data-f]', row).forEach(function(x){ x.onchange = function(){ s[x.dataset.f] = x.value; if (x.dataset.f === 'kind') paint(); }; });
      $$('[data-k]', row).forEach(function(x){ x.onchange = function(){ if (x.value === '') delete s.when[x.dataset.k]; else s.when[x.dataset.k] = x.value; }; });
      $('[data-up]', row).onclick = function(){ steps.splice(i - 1, 0, steps.splice(i, 1)[0]); paint(); };
      $('[data-dn]', row).onclick = function(){ steps.splice(i + 1, 0, steps.splice(i, 1)[0]); paint(); };
      $('[data-rm]', row).onclick = function(){ steps.splice(i, 1); paint(); };
    });
    $('#feAdd', el).onclick = function(){ steps.push({ kind: 'hr', personId: '', when: {}, slaHours: '' }); paint(); };
    $('#feF', el).onsubmit = function(ev){
      ev.preventDefault(); var b = this.querySelector('[type=submit]'); b.disabled = true;
      var out = steps.map(function(s){ var o = { kind: s.kind }; if (s.kind === 'person') o.personId = s.personId; if (s.slaHours !== '' && s.slaHours != null) o.slaHours = Number(s.slaHours);
        var w = {}; Object.keys(s.when || {}).forEach(function(k){ var v = s.when[k]; if (v === '' || v == null) return; w[k] = k === 'amountOver' || k === 'daysOver' ? Number(v) : v; }); if (Object.keys(w).length) o.when = w; return o; });
      api('flowSave', { type: ty.type, steps: out, note: this.elements.note.value.trim() }).then(function(x){ b.disabled = false; if (!x.ok) return $('#feE', el).textContent = errText(x.error); toast(t('fwSaved') + ' · ' + x.flow.ref); d.remove(); done(); });
    };
  }
  paint();
}

window.Flows = { centre: centre, cycles: cycles, cycleDrawer: cycleDrawer, myCards: myCards, config: config, history: history, printCycle: printCycle };
})();
