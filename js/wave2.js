// Wave 2 screens (2026-10-18) for the backends built on 2026-10-14: recruitment (Recruitment.gs), employee loans (Loans.gs),
// training and certificates (Training.gs), medical insurance (Insurance.gs), announcements (Announce.gs) and the HR help desk
// (HelpDesk.gs). One file, one load: each area page calls X.section(body); W2.myCards(el) adds the employee's own cards to the
// profile (loans, insurance, training, announcements, help desk, interviews to score). Every rule is enforced on the server;
// these pages only show what each answer carries (amounts, IDs and contact data are absent, not empty, for those who may not see them).
(function(){
'use strict';

Object.assign(T.ar, {
  w2Save:'حفظ', w2New:'جديد', w2Approve:'اعتماد', w2Reject:'رفض', w2Cancel:'إلغاء', w2Note:'ملاحظة', w2NoteReq:'ملاحظة (مطلوبة)', w2None:'لا توجد سجلات.', w2Saved:'تم الحفظ',
  w2Employee:'الموظف', w2Status:'الحالة', w2All:'الكل', w2Date:'التاريخ', w2Amount:'المبلغ', w2Ref:'المرجع', w2Details:'التفاصيل', w2Print:'طباعة', w2Close:'إغلاق', w2Kind:'النوع',
  w2From:'من', w2To:'إلى', w2History:'السجل', w2By:'بواسطة', w2Open:'فتح', w2Edit:'تعديل', w2Yes:'نعم', w2No:'لا', w2Dept:'القسم', w2Position:'المسمى', w2Months:'الأشهر',
  w2Pick:'اختر', w2Ctrl:'اضغط Ctrl أو ⌘ لاختيار أكثر من واحد.', w2Loading:'جار التحميل', w2Inbox:'بانتظاري', w2AllRec:'كل السجلات', w2Count:'العدد',

  // loans
  lnTitle:'القروض', lnLead:'قروض الموظفين بجدول أقساط: يعتمدها الموارد البشرية ثم الرواتب، ويسجل الصرف شخص غير من اعتمدها. الأقساط تخصم من المسير، والسداد المبكر يتحقق منه شخص ثان.',
  lnActive:'قروض قائمة', lnOutstanding:'الرصيد القائم', lnPending:'بانتظار القرار', lnNew:'تسجيل قرض لموظف', lnAsk:'طلب قرض', lnMy:'قروضي', lnPrincipal:'مبلغ القرض', lnInstall:'القسط الشهري',
  lnStart:'أول قسط', lnPurpose:'الغرض', lnRepaid:'المسدد', lnLeft:'المتبقي', lnSchedule:'جدول الأقساط', lnPaid:'مسدد', lnDisburse:'تسجيل الصرف', lnDisbOn:'تاريخ الصرف', lnDisbRef:'مرجع التحويل',
  lnSettle:'سداد مبكر', lnSettlements:'السدادات المبكرة', lnVerify:'تحقق', lnPolicy:'سياسة القروض', lnMaxSal:'الحد بالرواتب', lnMaxMonths:'أقصى مدة بالأشهر', lnMinSvc:'أدنى خدمة بالأشهر', lnOneActive:'قرض واحد قائم فقط',
  lnConsent:'أوافق كتابيا على خصم القسط من راتبي، وأعلم أنه يتجاوز 10% من أجري (المادة 92).', lnQuote:'الاحتساب', lnStep:'المرحلة', lnSteps_hr:'الموارد البشرية', lnSteps_payroll:'الرواتب', lnSteps_done:'منتهية',
  lnLimit:'الحد: {n} رواتب، حتى {m} شهرا، بعد {s} أشهر خدمة.',
  lns_pending:'بانتظار القرار', lns_approved:'معتمد، بانتظار الصرف', lns_active:'قائم', lns_settled:'مسدد بالكامل', lns_rejected:'مرفوض', lns_cancelled:'ملغى',
  lnk_personal:'شخصي', lnk_housing:'سكن', lnk_car:'سيارة', lnk_education:'تعليم', lnk_medical:'علاج', lnk_emergency:'طارئ', lnk_other:'أخرى',
  lnss_pending:'بانتظار التحقق', lnss_verified:'متحقق منه', lnss_rejected:'مرفوض',
  lnw_deduction_over_10:'القسط يتجاوز 10% من الأجر: يلزم إقرار الموظف الكتابي (المادة 92).', lnw_over_half_wage:'القسط يتجاوز نصف الأجر؛ الخصم الشهري محدود بنصف الأجر وسيتأجل الباقي (المادة 93).',
  lnw_advance_open:'لدى الموظف سلفة معتمدة لم تسدد بعد.',
  e_loan_over_limit:'المبلغ أعلى من الحد المسموح بالرواتب.', e_service_too_short:'مدة الخدمة أقل من الحد الأدنى للقرض.', e_months_over_limit:'المدة أطول من الحد المسموح.',
  e_loan_active_exists:'يوجد قرض قائم أو طلب قرض لم ينته.', e_consent_required:'يلزم الإقرار الكتابي بالخصم لأن القسط يتجاوز 10% من الأجر.',

  // help desk
  hdTitle:'مكتب الدعم', hdLead:'أسئلة الموظفين وحالاتهم. البلاغات السلوكية سرية ولا يراها إلا دور الموارد البشرية. لكل طلب مهلة حسب الأولوية: عاجل 4 ساعات، مرتفع 24، عادي 72.',
  hdMy:'طلبات الدعم', hdAsk:'طلب دعم جديد', hdCat:'التصنيف', hdPriority:'الأولوية', hdSubject:'الموضوع', hdBody:'التفاصيل', hdReply:'رد', hdInternal:'ملاحظة داخلية لا يراها الموظف', hdAssignMe:'إسنادها لي',
  hdAssignee:'المسؤول', hdNobody:'بلا مسؤول', hdSla:'المهلة', hdOverdue:'متأخر', hdSend:'إرسال', hdSetStatus:'تغيير الحالة', hdRate:'قيّم الخدمة', hdRated:'تقييمك', hdReopen:'إعادة فتح', hdCloseIt:'إغلاق الطلب',
  hdConf:'سري', hdQueue:'الصف', hdUnassigned:'بلا مسؤول', hdMineOnly:'المسندة لي', hdActive:'المفتوحة', hdConduct:'البلاغات السلوكية تذهب إلى الموارد البشرية فقط وتبقى سرية.',
  hdc_payroll:'الرواتب', hdc_gosi:'التأمينات الاجتماعية', hdc_leave:'الإجازات', hdc_documents:'المستندات', hdc_letters:'الخطابات', hdc_insurance:'التأمين الطبي', hdc_gov_services:'الخدمات الحكومية', hdc_it_access:'الدخول والأنظمة', hdc_conduct:'بلاغ سلوكي', hdc_other:'أخرى',
  hdp_urgent:'عاجل', hdp_high:'مرتفع', hdp_normal:'عادي',
  hds_open:'جديد', hds_in_progress:'قيد المعالجة', hds_waiting_employee:'بانتظار رد الموظف', hds_resolved:'تم الحل', hds_closed:'مغلق',
  hdq_hr:'الموارد البشرية', hdq_payroll:'الرواتب', hdq_hr_confidential:'سري',

  // announcements
  anTitle:'الإعلانات', anLead:'إعلانات للجميع أو لأقسام أو مسميات أو أشخاص، مع التثبيت وطلب الإقرار. يرى الموظف ما وجه إليه فقط، ويظهر لك من لم يقر بعد.',
  anNew:'إعلان جديد', anMy:'الإعلانات', anTitleAr:'العنوان بالعربية', anTitleEn:'العنوان بالإنجليزية', anBodyAr:'النص بالعربية', anBodyEn:'النص بالإنجليزية', anAudience:'الجمهور', anEveryone:'جميع الموظفين',
  anDepts:'أقسام', anPositions:'مسميات', anPeople:'أشخاص', anPinned:'تثبيت في الأعلى', anAck:'يطلب إقرار الموظف', anPublishAt:'ينشر من', anExpires:'ينتهي في', anPublish:'نشر', anArchive:'أرشفة',
  anReads:'قرأه', anAcks:'أقر به', anNotAcked:'لم يقر بعد', anAckBtn:'قرأته وأقر به', anAcked:'أقررت به', anNew1:'جديد', anOf:'من',
  ans_draft:'مسودة', ans_published:'منشور', ans_archived:'مؤرشف',
  ank_general:'عام', ank_policy:'سياسة', ank_event:'فعالية', ank_urgent:'عاجل', ank_celebration:'تهنئة',

  // insurance
  inTitle:'التأمين الطبي', inLead:'الوثائق وفئاتها، المؤمن عليهم ومرافقوهم، وحركات الإضافة والحذف: تطلب، ثم ترسل لشركة التأمين، ثم يؤكدها شخص آخر. التغطية إلزامية لغير السعوديين (مجلس الضمان الصحي).',
  inCoverage:'التغطية', inMoves:'الحركات', inPolicies:'الوثائق', inCost:'التكلفة', inUncovered:'غير سعوديين بلا تغطية', inCovered:'مغطى', inNotCovered:'غير مغطى', inPendingAdd:'بانتظار الإضافة',
  inDeps:'المرافقون', inAddMember:'إضافة مؤمن عليه', inAddDep:'طلب إضافة مرافق', inDelete:'حذف من الوثيقة', inPolicy:'الوثيقة', inInsurer:'شركة التأمين', inPolicyNo:'رقم الوثيقة', inClass:'الفئة',
  inClasses:'الفئات', inClassHint:'سطر لكل فئة: الرمز، الاسم، قسط الموظف السنوي، قسط المرافق السنوي. مثال: A, ممتازة, 6000, 4500', inRelation:'صلة القرابة', inName:'الاسم', inNameEn:'الاسم بالإنجليزية',
  inBirth:'تاريخ الميلاد', inGender:'الجنس', inMale:'ذكر', inFemale:'أنثى', inIdNo:'رقم الهوية أو الإقامة', inMemberNo:'رقم العضوية', inEffective:'تاريخ السريان', inPremium:'القسط', inPremiumDelta:'فرق القسط',
  inSubmit:'أرسلت لشركة التأمين', inConfirm:'تأكيد', inInsurerRef:'مرجع شركة التأمين', inNewPolicy:'وثيقة جديدة', inMembers:'المؤمن عليهم', inAnnual:'القسط السنوي', inMonth:'هذا الشهر', inByDept:'حسب القسم',
  inByClass:'حسب الفئة', inMy:'تأميني الطبي', inMyNone:'لا توجد تغطية مسجلة لك بعد. تواصل مع الموارد البشرية.', inDaughter:'ابنة تجاوزت 25 عاما: تأكد من شروط شركة التأمين.',
  inr_self:'الموظف', inr_spouse:'زوج/زوجة', inr_child:'ابن/ابنة', inr_parent:'والد/والدة',
  ims_pending_add:'بانتظار الإضافة', ims_active:'مغطى', ims_pending_delete:'بانتظار الحذف', ims_deleted:'محذوف', ims_rejected:'مرفوض',
  imv_requested:'مطلوبة', imv_submitted:'لدى شركة التأمين', imv_confirmed:'مؤكدة', imv_rejected:'مرفوضة', imk_add:'إضافة', imk_delete:'حذف',
  ips_active:'سارية', ips_expired:'منتهية',
  e_employee_not_covered:'أضف الموظف نفسه إلى الوثيقة قبل مرافقيه.', e_dependant_over_age:'الابن تجاوز 25 عاما ولا يغطى كمرافق.', e_dependants_first:'احذف المرافقين أولا ثم الموظف.',

  // training
  trTitle:'التدريب والشهادات', trLead:'دليل الدورات، الجلسات والتسجيل، النتائج والشهادات وتواريخ انتهائها، والدورات الإلزامية لكل قسم أو مسمى (السلامة والدفاع المدني والمواد الخطرة أولا).',
  trSessions:'الجلسات', trCatalogue:'الدورات', trMatrix:'المصفوفة', trCourse:'الدورة', trCode:'الرمز', trCat:'التصنيف', trHours:'الساعات', trValidity:'صلاحية الشهادة بالأشهر', trCost:'التكلفة للشخص',
  trProvider:'الجهة المدربة', trMandatory:'إلزامية لـ', trMandAll:'جميع الموظفين', trNewCourse:'دورة جديدة', trNewSession:'جلسة جديدة', trLocation:'المكان', trTrainer:'المدرب', trCapacity:'المقاعد',
  trSeatsLeft:'مقاعد متبقية', trEnrol:'تسجيل موظفين', trEnrolled:'المسجلون', trMark:'تسجيل النتيجة', trScore:'الدرجة', trResult:'النتيجة', trCertNo:'رقم الشهادة', trIssued:'تاريخ الإصدار', trExpires:'تنتهي في',
  trRecord:'تسجيل شهادة خارجية', trCertTitle:'اسم الشهادة', trRequest:'طلب الالتحاق', trMy:'تدريبي وشهاداتي', trMissing:'دورات إلزامية تنقصك', trHoursYear:'ساعات التدريب هذا العام', trOpen:'جلسات متاحة',
  trValid:'سارية', trExpiring:'تنتهي قريبا', trExpired:'منتهية', trNone:'لا شيء', trCostYear:'تكلفة العام', trDecide:'قرار', trInactive:'موقوفة',
  trc_mandatory:'إلزامي', trc_safety:'السلامة', trc_technical:'فني', trc_soft_skills:'مهارات شخصية', trc_compliance:'امتثال', trc_leadership:'قيادة', trc_other:'أخرى',
  tss_planned:'مخططة', tss_open:'مفتوحة للتسجيل', tss_done:'منتهية', tss_cancelled:'ملغاة',
  tes_requested:'بانتظار الموافقة', tes_enrolled:'مسجل', tes_attended:'حضر', tes_passed:'اجتاز', tes_failed:'لم يجتز', tes_no_show:'لم يحضر', tes_rejected:'مرفوض', tes_cancelled:'ملغى',
  tcs_valid:'سارية', tcs_expiring:'تنتهي قريبا', tcs_expired:'منتهية', tcs_missing:'ناقصة',
  e_session_full:'لا توجد مقاعد كافية في هذه الجلسة.',

  // recruitment
  rcTitle:'التوظيف', rcLead:'من طلب الاحتياج إلى التعيين: طلب يعتمده شخص آخر، مرشحون بموافقة على حفظ بياناتهم (نظام حماية البيانات الشخصية)، مقابلات بتقييم مستقل، عرض يراجعه شخص ثان ويفحص نظام العمل، ثم تعيين ينشئ ملف الموظف.',
  rcReqs:'طلبات الاحتياج', rcCands:'المرشحون', rcBoard:'المؤشرات', rcNewReq:'طلب احتياج جديد', rcJob:'الوظيفة', rcJobEn:'الوظيفة بالإنجليزية', rcHead:'العدد المطلوب', rcFilled:'تم شغله', rcMgr:'مدير التوظيف',
  rcEmpType:'نوع التوظيف', rcContract:'نوع العقد', rcReason:'السبب', rcReplaces:'بديل عن', rcBudget:'الميزانية الشهرية', rcBudgetMin:'من', rcBudgetMax:'إلى', rcSaudiOnly:'وظيفة موطنة: للسعوديين فقط', rcTarget:'التاريخ المستهدف',
  rcJustify:'المبرر', rcCloseReq:'إغلاق الطلب', rcAddCand:'إضافة مرشح', rcEmail:'البريد', rcPhone:'الجوال', rcNat:'الجنسية', rcSaudi:'سعودي', rcSource:'المصدر', rcReferredBy:'رشحه', rcCurTitle:'المسمى الحالي',
  rcCurEmp:'جهة العمل الحالية', rcYears:'سنوات الخبرة', rcExpected:'الراتب المتوقع', rcNotice:'فترة الإشعار بالأيام', rcCv:'رابط أو مرجع السيرة', rcConsent:'وافق المرشح على حفظ بياناته لأغراض التوظيف (نظام حماية البيانات الشخصية).',
  rcStage:'المرحلة', rcMove:'نقل إلى', rcErase:'محو البيانات الشخصية', rcPurge:'تمحى بعد', rcRating:'التقييم', rcInterviews:'المقابلات', rcSchedule:'جدولة مقابلة', rcAt:'الموعد', rcDuration:'المدة بالدقائق',
  rcMode:'الطريقة', rcPanel:'اللجنة', rcFeedback:'تقييمي', rcScore:'الدرجة من 5', rcRec:'التوصية', rcComment:'تعليق', rcScoresHidden:'تظهر تقييمات اللجنة بعد أن تسجل تقييمك.', rcOffers:'العروض', rcOffer:'إعداد عرض',
  rcStartDate:'تاريخ المباشرة', rcContractMonths:'مدة العقد بالأشهر', rcProbation:'التجربة بالأيام', rcLeave:'الإجازة السنوية بالأيام', rcWorkLoc:'مقر العمل', rcDays:'أيام العمل أسبوعيا', rcDaily:'ساعات اليوم',
  rcBasic:'الأساسي', rcHousing:'السكن', rcTransport:'النقل', rcTotal:'الإجمالي', rcOfferExp:'صلاحية العرض حتى', rcSend:'تم إرسال العرض', rcAccepted:'قبل العرض', rcDeclined:'رفض العرض', rcLetter:'خطاب العرض',
  rcHire:'تعيين', rcEmpNo:'الرقم الوظيفي الجديد', rcHired:'تم التعيين. رمز التفعيل:', rcPkgPending:'الراتب ينتظر اعتماد الرواتب.', rcMyInterviews:'مقابلات أنا في لجنتها', rcOpenSeats:'مقاعد شاغرة',
  rcOverdue:'متأخرة عن الموعد', rcTimeToFill:'متوسط أيام الشغل', rcAcceptance:'نسبة قبول العروض', rcFunnel:'مسار المرشحين', rcSources:'المصادر', rcCandidates:'مرشح', rcHiredN:'معين', rcReqOf:'طلب',
  rcLetterKind:'عرض وظيفي', rcLetterIntro:'يسرنا أن نقدم لكم عرض العمل التالي:', rcLetterAccept:'توقيع المرشح بالقبول', rcLetterHr:'الموارد البشرية', rcLetterApprover:'المعتمد', rcPerMonth:'شهريا',
  rqs_pending:'بانتظار الاعتماد', rqs_approved:'معتمد', rqs_rejected:'مرفوض', rqs_filled:'مكتمل', rqs_closed:'مغلق', rqs_cancelled:'ملغى',
  rqr_new:'وظيفة جديدة', rqr_replacement:'بديل', rqr_temporary:'مؤقت', rqr_growth:'توسع',
  rqe_full_time:'دوام كامل', rqe_part_time:'دوام جزئي', rqe_temporary:'مؤقت', rqe_internship:'تدريب تعاوني', rqc_indefinite:'غير محدد المدة', rqc_fixed:'محدد المدة',
  rcs_applied:'متقدم', rcs_screening:'فرز', rcs_interview:'مقابلة', rcs_offer:'عرض', rcs_hired:'معين', rcs_rejected:'مستبعد', rcs_withdrawn:'منسحب', rcs_erased:'محيت بياناته',
  rcsrc_referral:'ترشيح موظف', rcsrc_linkedin:'لينكدإن', rcsrc_jadarat:'جدارات', rcsrc_bayt:'بيت.كوم', rcsrc_website:'موقع الشركة', rcsrc_agency:'مكتب توظيف', rcsrc_walk_in:'حضور مباشر', rcsrc_internal:'داخلي', rcsrc_other:'أخرى',
  rcm_onsite:'حضوري', rcm_phone:'هاتفي', rcm_video:'مرئي', ris_scheduled:'مجدولة', ris_done:'تمت', ris_cancelled:'ملغاة', ris_no_show:'لم يحضر',
  rcr_strong_hire:'أوصي بشدة', rcr_hire:'أوصي', rcr_no_hire:'لا أوصي', rcr_strong_no_hire:'لا أوصي إطلاقا',
  ros_draft:'مسودة', ros_pending:'بانتظار الاعتماد', ros_approved:'معتمد', ros_rejected:'مرفوض', ros_sent:'مرسل', ros_accepted:'مقبول', ros_declined:'مرفوض من المرشح', ros_expired:'انتهت صلاحيته', ros_withdrawn:'مسحوب', ros_hired:'تم التعيين',
  row_over_budget:'أعلى من ميزانية الطلب: يلزم ذكر السبب عند الاعتماد.', row_under_budget:'أقل من ميزانية الطلب.', row_nitaqat_half:'أجر السعودي بين 3,000 و3,999: يحتسب نصف موظف في نطاقات.',
  row_nitaqat_zero:'أجر السعودي أقل من 3,000: لا يحتسب في نطاقات.', row_below_expectation:'أقل من الراتب الذي يتوقعه المرشح.',
  // Wave 3: exit interview and recognition
  rbTitle:'منشئ التقارير', rbLead:'اختر الأعمدة والفلاتر والتجميع من بيانات الموظفين والحقول المخصصة، ثم صدّر إلى Excel أو اطبع.', rbCols:'الأعمدة', rbFilters:'الفلاتر', rbGroup:'تجميع حسب', rbNoGroup:'بلا تجميع', rbRows:'صف', rbCount:'العدد', rbExport:'تصدير Excel', rbPrint:'طباعة', rbSaudi:'سعودي', rbNonSaudi:'غير سعودي', rbAll:'الكل', rbc_empNo:'الرقم الوظيفي', rbc_name:'الاسم', rbc_nameEn:'الاسم بالإنجليزية', rbc_departmentName:'القسم', rbc_positionName:'المسمى', rbc_managerName:'المدير', rbc_hireDate:'تاريخ التعيين', rbc_status:'الحالة', rbc_nationality:'الجنسية', rbc_isSaudi:'سعودي', rbc_gender:'الجنس', rbc_contractType:'نوع العقد', rbc_contractEnd:'نهاية العقد', rbc_email:'البريد', rbc_phone:'الجوال', rbc_lastWorkingDay:'آخر يوم عمل',
  cfTitle:'الحقول المخصصة', cfLead:'حقول إضافية في ملف الموظف تحددها الشركة (نص، رقم، تاريخ، قائمة، نعم/لا) مع تحديد من يراها. تكتب القيم الموارد البشرية فقط.', cfFields:'الحقول', cfValues:'القيم', cfNew:'حقل جديد', cfLabelAr:'الاسم بالعربية', cfLabelEn:'الاسم بالإنجليزية', cfType:'النوع', cfOptions:'الخيارات', cfOptionsHint:'افصل بين الخيارات بفاصلة.', cfVis:'يراه', cfDisabled:'موقوف', cfPick:'اختر موظفا', cfMy:'بيانات إضافية', cfNone:'لا توجد حقول بعد.', cft_text:'نص', cft_number:'رقم', cft_date:'تاريخ', cft_select:'قائمة خيارات', cft_bool:'نعم / لا', cfv_hr:'الموارد البشرية فقط', cfv_manager:'الموارد البشرية والمدير', cfv_employee:'الموظف أيضا (للقراءة)', cfYes:'نعم', cfNo:'لا',
  ocTitle:'الهيكل التنظيمي', ocLead:'من يتبع لمن، من بيانات الموظفين الحالية. اضغط على أي بطاقة لطي فريقها أو فتحه.', ocReports:'مرؤوسون', ocAll:'الكل', ocSearch:'ابحث عن موظف', ocNoMgr:'بلا مدير مباشر', ocExpand:'فتح الكل', ocCollapse:'طي الكل',
  tsTitle:'كشوف الدوام الشهرية', tsLead:'يعتمد المدير أو الموارد البشرية دوام كل موظف للشهر (الساعات والتأخير والغياب والإضافي) من نفس أرقام التقارير والرواتب. عند تفعيل الإلزام لا تقفل الرواتب قبل اعتماد كل الكشوف.', tsMonth:'الشهر', tsWorked:'ساعات العمل', tsLate:'تأخير (دقيقة)', tsAbsent:'غياب', tsOt:'إضافي (ساعة)', tsMissing:'خروج غير مسجل', tsReview:'بانتظار المراجعة', tsApprove:'اعتماد', tsApproveAll:'اعتماد الكل', tsApproved:'معتمد', tsPending:'بانتظار الاعتماد', tsRequired:'إلزامي قبل إقفال الرواتب', tsOptional:'اختياري', e_timesheets_open:'لا يمكن إقفال الرواتب: توجد كشوف دوام غير معتمدة لهذا الشهر.',
  prTitle:'مراجعة الرواتب السنوية', prLead:'يقترح المديرون نسبة الزيادة لفريقهم دون رؤية الرواتب، وتراجع الموارد البشرية والرواتب الميزانية، وعند الإغلاق تصبح كل زيادة اقتراح راتب ينتظر اعتماد الرواتب.', prNew:'فتح مراجعة', prName:'اسم المراجعة', prEff:'تسري من', prBudget:'الميزانية % من الرواتب', prBasis:'تطبق على', prBasisBH:'الأساسي والسكن', prBasisB:'الأساسي فقط', prPct:'الزيادة %', prBase:'الأجر المعني', prInc:'الزيادة', prUsed:'المستخدم من الميزانية', prProposed:'تم اقتراحه', prClose:'إغلاق وإصدار الاقتراحات', prClosed:'صدرت الاقتراحات', prOpenNone:'لا توجد مراجعة مفتوحة.', prs_open:'مفتوحة', prs_closed:'مغلقة', prSaveRow:'حفظ',
  fsTitle:'المخالصة النهائية', fsLead:'مستحقات نهاية الخدمة من حاسبة المكافأة (المادتان 84 و85) مع رصيد الإجازة وأيام الشهر الأخير والسلف والقروض. يعدها شخص ويعتمدها شخص آخر من الرواتب، ثم يسجل الصرف بمرجع التحويل.', fsNew:'إعداد مخالصة', fsReason:'سبب انتهاء العلاقة', fsLastDay:'آخر يوم عمل', fsAward:'مكافأة نهاية الخدمة', fsLeave:'بدل رصيد الإجازة', fsLastMonth:'أيام الشهر الأخير', fsAdvances:'سلف مستحقة', fsLoans:'قروض مستحقة', fsNet:'الصافي المستحق', fsYears:'سنوات الخدمة', fsWage:'الأجر الفعلي', fsPay:'تسجيل الصرف', fsPaidRef:'مرجع التحويل', fsPaidOn:'تاريخ الصرف', fsPrint:'طباعة المخالصة', fsDue:'تستحق قبل', fsMy:'مخالصتي النهائية', fsKind:'مخالصة نهائية', fsSignEmp:'توقيع الموظف بالاستلام', fsSignHr:'الموارد البشرية', fsSignPay:'الرواتب', fsStatement:'أقر بأنني استلمت المبالغ الموضحة أعلاه وفق نظام العمل.', fss_draft:'بانتظار الاعتماد', fss_approved:'معتمدة، بانتظار الصرف', fss_paid:'صرفت', fss_cancelled:'ملغاة', fsr_resignation:'استقالة', fsr_termination:'إنهاء من صاحب العمل', fsr_contract_end:'انتهاء العقد', fsr_art80:'فصل وفق المادة 80', fsr_art87_marriage:'المادة 87: زواج', fsr_art87_force_majeure:'المادة 87: قوة قاهرة', fsr_art81:'المادة 81: ترك العمل لإخلال صاحب العمل', fsr_art87_childbirth:'المادة 87: خلال 3 أشهر من الولادة',
  exTitle:'رأي المغادرين', exLead:'مقابلة الخروج: تقييم خمسة جوانب وسبب المغادرة، تعرض مجمعة فقط من 5 إجابات فأكثر، والتعليقات بلا أسماء.', exMy:'مقابلة الخروج', exMyLead:'إجاباتك سرية ولا تظهر باسمك؛ تساعدنا على التحسن.', exArea_manager:'المدير المباشر', exArea_pay:'الراتب والمزايا', exArea_growth:'فرص التطور', exArea_workload:'ضغط العمل', exArea_culture:'بيئة العمل', exReason:'السبب الرئيسي للمغادرة', exRecommend:'هل توصي صديقا بالعمل لدينا؟ (0-10)', exReturn:'سأعود للعمل هنا إن سنحت الفرصة', exComment:'ما الذي كان يمكن أن يبقيك؟', exSend:'إرسال', exThanks:'شكرا لك. وصلتنا إجاباتك.', exr_pay:'الراتب', exr_growth:'التطور الوظيفي', exr_manager:'المدير', exr_workload:'ضغط العمل', exr_relocation:'الانتقال لمدينة أخرى', exr_family:'ظروف عائلية', exr_study:'الدراسة', exr_better_offer:'عرض أفضل', exr_health:'الصحة', exr_other:'أخرى', exCount:'إجابات', exOpen:'بانتظار الإجابة', exHidden:'تظهر النتائج عند وصول 5 إجابات أو أكثر حفاظا على السرية.', exAvg:'متوسط التقييم', exReasons:'أسباب المغادرة', exEnps:'مؤشر التوصية', exBack:'سيعودون', exComments:'تعليقات (بلا أسماء)', kdTitle:'التقدير', kdLead:'شكر الزملاء على قيم الشركة؛ يراه الجميع ويقيس ثقافة التقدير.', kdMy:'شكرا زملائي', kdSend:'أرسل شكرا', kdTo:'إلى', kdValue:'القيمة', kdMsg:'رسالتك', kdFeed:'آخر الشكر في الشركة', kdMine:'شكر وصلني', kdReceived:'وصلك', kdSent:'تم إرسال الشكر', kdLeft:'متبقي اليوم', kdByValue:'حسب القيمة', kdByDept:'حسب القسم', kdTop:'الأكثر تقديرا', kdMonth:'هذا الشهر', kdv_teamwork:'روح الفريق', kdv_customer:'خدمة العميل', kdv_safety:'السلامة أولا', kdv_initiative:'المبادرة', kdv_excellence:'الإتقان', e_kudos_daily_limit:'وصلت إلى 5 رسائل شكر اليوم.',
  e_saudi_only:'هذه وظيفة موطنة: لا يقدم عرض لغير سعودي.', e_offer_expired:'انتهت صلاحية العرض؛ جدده قبل تسجيل القبول.'
});
Object.assign(T.en, {
  w2Save:'Save', w2New:'New', w2Approve:'Approve', w2Reject:'Reject', w2Cancel:'Cancel', w2Note:'Note', w2NoteReq:'Note (required)', w2None:'Nothing here.', w2Saved:'Saved',
  w2Employee:'Employee', w2Status:'Status', w2All:'All', w2Date:'Date', w2Amount:'Amount', w2Ref:'Reference', w2Details:'Details', w2Print:'Print', w2Close:'Close', w2Kind:'Kind',
  w2From:'From', w2To:'To', w2History:'History', w2By:'By', w2Open:'Open', w2Edit:'Edit', w2Yes:'Yes', w2No:'No', w2Dept:'Department', w2Position:'Position', w2Months:'Months',
  w2Pick:'Choose', w2Ctrl:'Hold Ctrl or ⌘ to choose more than one.', w2Loading:'Loading', w2Inbox:'Waiting for me', w2AllRec:'All records', w2Count:'Count',

  lnTitle:'Loans', lnLead:'Employee loans with a repayment schedule: HR approves, then payroll, and someone other than the approver records the payout. Instalments come off the payslip; an early repayment is checked by a second person.',
  lnActive:'Active loans', lnOutstanding:'Outstanding', lnPending:'Waiting for a decision', lnNew:'Record a loan for an employee', lnAsk:'Request a loan', lnMy:'My loans', lnPrincipal:'Loan amount', lnInstall:'Monthly instalment',
  lnStart:'First instalment', lnPurpose:'Purpose', lnRepaid:'Repaid', lnLeft:'Left', lnSchedule:'Schedule', lnPaid:'Paid', lnDisburse:'Record payout', lnDisbOn:'Paid out on', lnDisbRef:'Transfer reference',
  lnSettle:'Early repayment', lnSettlements:'Early repayments', lnVerify:'Verify', lnPolicy:'Loan policy', lnMaxSal:'Limit in monthly wages', lnMaxMonths:'Longest term in months', lnMinSvc:'Minimum service in months', lnOneActive:'Only one active loan',
  lnConsent:'I agree in writing to the instalment being deducted from my pay, and I know it is over 10% of my wage (Art. 92).', lnQuote:'Calculation', lnStep:'Step', lnSteps_hr:'HR', lnSteps_payroll:'Payroll', lnSteps_done:'Done',
  lnLimit:'Limit: {n} wages, up to {m} months, after {s} months of service.',
  lns_pending:'Waiting for a decision', lns_approved:'Approved, waiting for payout', lns_active:'Active', lns_settled:'Fully repaid', lns_rejected:'Rejected', lns_cancelled:'Cancelled',
  lnk_personal:'Personal', lnk_housing:'Housing', lnk_car:'Car', lnk_education:'Education', lnk_medical:'Medical', lnk_emergency:'Emergency', lnk_other:'Other',
  lnss_pending:'Waiting for verification', lnss_verified:'Verified', lnss_rejected:'Rejected',
  lnw_deduction_over_10:'The instalment is over 10% of the wage: the employee\'s written consent is needed (Art. 92).', lnw_over_half_wage:'The instalment is over half the wage; monthly deductions are capped at half and the rest is deferred (Art. 93).',
  lnw_advance_open:'The employee has an approved salary advance not yet repaid.',
  e_loan_over_limit:'The amount is above the limit in monthly wages.', e_service_too_short:'Service is shorter than the minimum for a loan.', e_months_over_limit:'The term is longer than allowed.',
  e_loan_active_exists:'There is already an active loan or an open loan request.', e_consent_required:'Written consent is needed because the instalment is over 10% of the wage.',

  hdTitle:'Help desk', hdLead:'Employee questions and cases. Conduct reports are confidential and only the HR role sees them. Each ticket has a deadline by priority: urgent 4 hours, high 24, normal 72.',
  hdMy:'Help desk', hdAsk:'New ticket', hdCat:'Category', hdPriority:'Priority', hdSubject:'Subject', hdBody:'Details', hdReply:'Reply', hdInternal:'Internal note the employee does not see', hdAssignMe:'Assign to me',
  hdAssignee:'Assigned to', hdNobody:'Nobody', hdSla:'Due', hdOverdue:'Overdue', hdSend:'Send', hdSetStatus:'Change status', hdRate:'Rate the service', hdRated:'Your rating', hdReopen:'Reopen', hdCloseIt:'Close ticket',
  hdConf:'Confidential', hdQueue:'Queue', hdUnassigned:'Unassigned', hdMineOnly:'Assigned to me', hdActive:'Open', hdConduct:'Conduct reports go to HR only and stay confidential.',
  hdc_payroll:'Payroll', hdc_gosi:'GOSI', hdc_leave:'Leave', hdc_documents:'Documents', hdc_letters:'Letters', hdc_insurance:'Medical insurance', hdc_gov_services:'Government services', hdc_it_access:'Access and systems', hdc_conduct:'Conduct report', hdc_other:'Other',
  hdp_urgent:'Urgent', hdp_high:'High', hdp_normal:'Normal',
  hds_open:'New', hds_in_progress:'In progress', hds_waiting_employee:'Waiting for the employee', hds_resolved:'Resolved', hds_closed:'Closed',
  hdq_hr:'HR', hdq_payroll:'Payroll', hdq_hr_confidential:'Confidential',

  anTitle:'Announcements', anLead:'Announcements for everyone or for departments, positions or people, with pinning and a required acknowledgement. Employees see only what is addressed to them; you see who has not acknowledged yet.',
  anNew:'New announcement', anMy:'Announcements', anTitleAr:'Title in Arabic', anTitleEn:'Title in English', anBodyAr:'Text in Arabic', anBodyEn:'Text in English', anAudience:'Audience', anEveryone:'All employees',
  anDepts:'Departments', anPositions:'Positions', anPeople:'People', anPinned:'Pin to the top', anAck:'Ask employees to acknowledge', anPublishAt:'Publish from', anExpires:'Expires on', anPublish:'Publish', anArchive:'Archive',
  anReads:'Read', anAcks:'Acknowledged', anNotAcked:'Not acknowledged yet', anAckBtn:'I have read it and acknowledge it', anAcked:'Acknowledged', anNew1:'New', anOf:'of',
  ans_draft:'Draft', ans_published:'Published', ans_archived:'Archived',
  ank_general:'General', ank_policy:'Policy', ank_event:'Event', ank_urgent:'Urgent', ank_celebration:'Celebration',

  inTitle:'Medical insurance', inLead:'Policies and their classes, members and dependants, and additions and deletions: requested, sent to the insurer, then confirmed by someone else. Cover is mandatory for non-Saudis (CCHI).',
  inCoverage:'Coverage', inMoves:'Changes', inPolicies:'Policies', inCost:'Cost', inUncovered:'Non-Saudis without cover', inCovered:'Covered', inNotCovered:'Not covered', inPendingAdd:'Being added',
  inDeps:'Dependants', inAddMember:'Add a member', inAddDep:'Request to add a dependant', inDelete:'Remove from the policy', inPolicy:'Policy', inInsurer:'Insurer', inPolicyNo:'Policy number', inClass:'Class',
  inClasses:'Classes', inClassHint:'One line per class: code, name, annual employee premium, annual dependant premium. Example: A, Premium, 6000, 4500', inRelation:'Relation', inName:'Name', inNameEn:'Name in English',
  inBirth:'Date of birth', inGender:'Gender', inMale:'Male', inFemale:'Female', inIdNo:'National ID or iqama', inMemberNo:'Member number', inEffective:'Effective date', inPremium:'Premium', inPremiumDelta:'Premium change',
  inSubmit:'Sent to the insurer', inConfirm:'Confirm', inInsurerRef:'Insurer reference', inNewPolicy:'New policy', inMembers:'Members', inAnnual:'Annual premium', inMonth:'This month', inByDept:'By department',
  inByClass:'By class', inMy:'My medical insurance', inMyNone:'No cover is recorded for you yet. Please contact HR.', inDaughter:'A daughter over 25: check the insurer\'s terms.',
  inr_self:'Employee', inr_spouse:'Spouse', inr_child:'Child', inr_parent:'Parent',
  ims_pending_add:'Being added', ims_active:'Covered', ims_pending_delete:'Being removed', ims_deleted:'Removed', ims_rejected:'Rejected',
  imv_requested:'Requested', imv_submitted:'With the insurer', imv_confirmed:'Confirmed', imv_rejected:'Rejected', imk_add:'Addition', imk_delete:'Deletion',
  ips_active:'Active', ips_expired:'Expired',
  e_employee_not_covered:'Add the employee to the policy before their dependants.', e_dependant_over_age:'A son over 25 cannot be covered as a dependant.', e_dependants_first:'Remove the dependants first, then the employee.',

  trTitle:'Training and certificates', trLead:'The course catalogue, sessions and enrolment, results and certificates with their expiry, and the mandatory courses for each department or position (safety, civil defence and dangerous goods first).',
  trSessions:'Sessions', trCatalogue:'Courses', trMatrix:'Matrix', trCourse:'Course', trCode:'Code', trCat:'Category', trHours:'Hours', trValidity:'Certificate valid for (months)', trCost:'Cost per person',
  trProvider:'Provider', trMandatory:'Mandatory for', trMandAll:'All employees', trNewCourse:'New course', trNewSession:'New session', trLocation:'Location', trTrainer:'Trainer', trCapacity:'Seats',
  trSeatsLeft:'Seats left', trEnrol:'Enrol employees', trEnrolled:'Enrolled', trMark:'Record result', trScore:'Score', trResult:'Result', trCertNo:'Certificate number', trIssued:'Issued on', trExpires:'Expires on',
  trRecord:'Record an external certificate', trCertTitle:'Certificate name', trRequest:'Ask to join', trMy:'My training and certificates', trMissing:'Mandatory courses you still need', trHoursYear:'Training hours this year', trOpen:'Open sessions',
  trValid:'Valid', trExpiring:'Expiring soon', trExpired:'Expired', trNone:'None', trCostYear:'Cost this year', trDecide:'Decide', trInactive:'Inactive',
  trc_mandatory:'Mandatory', trc_safety:'Safety', trc_technical:'Technical', trc_soft_skills:'Soft skills', trc_compliance:'Compliance', trc_leadership:'Leadership', trc_other:'Other',
  tss_planned:'Planned', tss_open:'Open for enrolment', tss_done:'Done', tss_cancelled:'Cancelled',
  tes_requested:'Waiting for approval', tes_enrolled:'Enrolled', tes_attended:'Attended', tes_passed:'Passed', tes_failed:'Failed', tes_no_show:'No show', tes_rejected:'Rejected', tes_cancelled:'Cancelled',
  tcs_valid:'Valid', tcs_expiring:'Expiring soon', tcs_expired:'Expired', tcs_missing:'Missing',
  e_session_full:'Not enough seats left in this session.',

  rcTitle:'Recruitment', rcLead:'From the hiring request to the hire: a request approved by someone else, candidates who consent to their data being kept (PDPL), interviews scored independently, an offer reviewed by a second person and checked against the Labour Law, then a hire that creates the employee file.',
  rcReqs:'Hiring requests', rcCands:'Candidates', rcBoard:'Metrics', rcNewReq:'New hiring request', rcJob:'Job', rcJobEn:'Job in English', rcHead:'Headcount', rcFilled:'Filled', rcMgr:'Hiring manager',
  rcEmpType:'Employment type', rcContract:'Contract type', rcReason:'Reason', rcReplaces:'Replaces', rcBudget:'Monthly budget', rcBudgetMin:'From', rcBudgetMax:'To', rcSaudiOnly:'Localised job: Saudis only', rcTarget:'Target date',
  rcJustify:'Justification', rcCloseReq:'Close request', rcAddCand:'Add candidate', rcEmail:'Email', rcPhone:'Mobile', rcNat:'Nationality', rcSaudi:'Saudi', rcSource:'Source', rcReferredBy:'Referred by', rcCurTitle:'Current title',
  rcCurEmp:'Current employer', rcYears:'Years of experience', rcExpected:'Expected salary', rcNotice:'Notice period (days)', rcCv:'CV link or reference', rcConsent:'The candidate agreed to their data being kept for recruitment (PDPL).',
  rcStage:'Stage', rcMove:'Move to', rcErase:'Erase personal data', rcPurge:'Erase after', rcRating:'Rating', rcInterviews:'Interviews', rcSchedule:'Schedule interview', rcAt:'Time', rcDuration:'Duration (minutes)',
  rcMode:'Mode', rcPanel:'Panel', rcFeedback:'My scorecard', rcScore:'Score out of 5', rcRec:'Recommendation', rcComment:'Comment', rcScoresHidden:'The panel\'s scores show after you submit yours.', rcOffers:'Offers', rcOffer:'Prepare offer',
  rcStartDate:'Start date', rcContractMonths:'Contract months', rcProbation:'Probation days', rcLeave:'Annual leave days', rcWorkLoc:'Work location', rcDays:'Work days a week', rcDaily:'Hours a day',
  rcBasic:'Basic', rcHousing:'Housing', rcTransport:'Transport', rcTotal:'Total', rcOfferExp:'Offer valid until', rcSend:'Offer sent', rcAccepted:'Accepted', rcDeclined:'Declined', rcLetter:'Offer letter',
  rcHire:'Hire', rcEmpNo:'New employee number', rcHired:'Hired. Activation code:', rcPkgPending:'The salary waits for payroll approval.', rcMyInterviews:'Interviews on my panel', rcOpenSeats:'Open seats',
  rcOverdue:'Past target date', rcTimeToFill:'Average days to fill', rcAcceptance:'Offer acceptance', rcFunnel:'Candidate funnel', rcSources:'Sources', rcCandidates:'candidates', rcHiredN:'hired', rcReqOf:'request',
  rcLetterKind:'Job offer', rcLetterIntro:'We are pleased to offer you the following position:', rcLetterAccept:'Candidate\'s acceptance', rcLetterHr:'Human resources', rcLetterApprover:'Approved by', rcPerMonth:'a month',
  rqs_pending:'Waiting for approval', rqs_approved:'Approved', rqs_rejected:'Rejected', rqs_filled:'Filled', rqs_closed:'Closed', rqs_cancelled:'Cancelled',
  rqr_new:'New job', rqr_replacement:'Replacement', rqr_temporary:'Temporary', rqr_growth:'Growth',
  rqe_full_time:'Full time', rqe_part_time:'Part time', rqe_temporary:'Temporary', rqe_internship:'Internship', rqc_indefinite:'Indefinite', rqc_fixed:'Fixed term',
  rcs_applied:'Applied', rcs_screening:'Screening', rcs_interview:'Interview', rcs_offer:'Offer', rcs_hired:'Hired', rcs_rejected:'Rejected', rcs_withdrawn:'Withdrawn', rcs_erased:'Data erased',
  rcsrc_referral:'Employee referral', rcsrc_linkedin:'LinkedIn', rcsrc_jadarat:'Jadarat', rcsrc_bayt:'Bayt.com', rcsrc_website:'Company website', rcsrc_agency:'Agency', rcsrc_walk_in:'Walk-in', rcsrc_internal:'Internal', rcsrc_other:'Other',
  rcm_onsite:'On site', rcm_phone:'Phone', rcm_video:'Video', ris_scheduled:'Scheduled', ris_done:'Done', ris_cancelled:'Cancelled', ris_no_show:'No show',
  rcr_strong_hire:'Strong hire', rcr_hire:'Hire', rcr_no_hire:'No hire', rcr_strong_no_hire:'Strong no hire',
  ros_draft:'Draft', ros_pending:'Waiting for approval', ros_approved:'Approved', ros_rejected:'Rejected', ros_sent:'Sent', ros_accepted:'Accepted', ros_declined:'Declined by the candidate', ros_expired:'Expired', ros_withdrawn:'Withdrawn', ros_hired:'Hired',
  row_over_budget:'Above the request budget: the approver must give the reason.', row_under_budget:'Below the request budget.', row_nitaqat_half:'Saudi wage between 3,000 and 3,999: counts as half in Nitaqat.',
  row_nitaqat_zero:'Saudi wage under 3,000: does not count in Nitaqat.', row_below_expectation:'Below the salary the candidate expects.',
rbTitle:'Report builder', rbLead:'Pick columns, filters and grouping from employee data and custom fields, then export to Excel or print.', rbCols:'Columns', rbFilters:'Filters', rbGroup:'Group by', rbNoGroup:'No grouping', rbRows:'rows', rbCount:'Count', rbExport:'Export Excel', rbPrint:'Print', rbSaudi:'Saudi', rbNonSaudi:'Non-Saudi', rbAll:'All', rbc_empNo:'Employee no.', rbc_name:'Name', rbc_nameEn:'Name in English', rbc_departmentName:'Department', rbc_positionName:'Position', rbc_managerName:'Manager', rbc_hireDate:'Hire date', rbc_status:'Status', rbc_nationality:'Nationality', rbc_isSaudi:'Saudi', rbc_gender:'Gender', rbc_contractType:'Contract type', rbc_contractEnd:'Contract end', rbc_email:'Email', rbc_phone:'Mobile', rbc_lastWorkingDay:'Last working day',
  cfTitle:'Custom fields', cfLead:'Extra fields on the employee file that the company defines (text, number, date, list, yes/no), with who may see them. Only HR writes the values.', cfFields:'Fields', cfValues:'Values', cfNew:'New field', cfLabelAr:'Name in Arabic', cfLabelEn:'Name in English', cfType:'Type', cfOptions:'Options', cfOptionsHint:'Separate options with commas.', cfVis:'Seen by', cfDisabled:'Disabled', cfPick:'Choose an employee', cfMy:'More about me', cfNone:'No fields yet.', cft_text:'Text', cft_number:'Number', cft_date:'Date', cft_select:'List of options', cft_bool:'Yes / no', cfv_hr:'HR only', cfv_manager:'HR and the manager', cfv_employee:'The employee too (read-only)', cfYes:'Yes', cfNo:'No',
  ocTitle:'Org chart', ocLead:'Who reports to whom, from the current employee records. Tap a card to fold or open its team.', ocReports:'reports', ocAll:'All', ocSearch:'Find a person', ocNoMgr:'No line manager', ocExpand:'Open all', ocCollapse:'Fold all',
  tsTitle:'Monthly timesheets', tsLead:'The manager or HR approves each person\'s month (hours, lateness, absence, overtime) from the same figures as reports and payroll. When required, payroll cannot lock before every timesheet is approved.', tsMonth:'Month', tsWorked:'Hours worked', tsLate:'Late (min)', tsAbsent:'Absent', tsOt:'Overtime (h)', tsMissing:'Missing check-out', tsReview:'Waiting for review', tsApprove:'Approve', tsApproveAll:'Approve all', tsApproved:'Approved', tsPending:'Waiting for approval', tsRequired:'Required before the payroll lock', tsOptional:'Optional', e_timesheets_open:'Payroll cannot lock: some timesheets for this month are not approved.',
  prTitle:'Annual pay review', prLead:'Managers propose an increase for their team without seeing pay; HR and payroll check the budget; on closing each increase becomes a salary proposal waiting for payroll approval.', prNew:'Open a review', prName:'Review name', prEff:'Effective from', prBudget:'Budget % of payroll', prBasis:'Applies to', prBasisBH:'Basic and housing', prBasisB:'Basic only', prPct:'Increase %', prBase:'Pay it applies to', prInc:'Increase', prUsed:'Budget used', prProposed:'Proposed', prClose:'Close and file proposals', prClosed:'Proposals filed', prOpenNone:'No review is open.', prs_open:'Open', prs_closed:'Closed', prSaveRow:'Save',
  fsTitle:'Final settlement', fsLead:'End-of-service dues from the award calculator (Art. 84 and 85) with leave balance, the last month\'s days, advances and loans. One person prepares it, a different payroll holder approves it, then the payout is recorded with the transfer reference.', fsNew:'Prepare a settlement', fsReason:'Reason the employment ended', fsLastDay:'Last working day', fsAward:'End-of-service award', fsLeave:'Leave balance pay', fsLastMonth:'Last month\'s days', fsAdvances:'Advances owed', fsLoans:'Loans owed', fsNet:'Net due', fsYears:'Years of service', fsWage:'Actual wage', fsPay:'Record payout', fsPaidRef:'Transfer reference', fsPaidOn:'Paid on', fsPrint:'Print settlement', fsDue:'Due by', fsMy:'My final settlement', fsKind:'Final settlement', fsSignEmp:'Employee\'s receipt', fsSignHr:'Human resources', fsSignPay:'Payroll', fsStatement:'I confirm I received the amounts above under the Labour Law.', fss_draft:'Waiting for approval', fss_approved:'Approved, waiting for payout', fss_paid:'Paid', fss_cancelled:'Cancelled', fsr_resignation:'Resignation', fsr_termination:'Ended by the employer', fsr_contract_end:'Contract ended', fsr_art80:'Dismissal under Art. 80', fsr_art87_marriage:'Art. 87: marriage', fsr_art87_force_majeure:'Art. 87: force majeure', fsr_art81:'Art. 81: left over the employer\'s breach', fsr_art87_childbirth:'Art. 87: within 3 months of giving birth',
  exTitle:'Exit insights', exLead:'Exit interviews: five areas rated and the reason for leaving, shown only as totals from 5 answers, comments without names.', exMy:'Exit interview', exMyLead:'Your answers are confidential and never shown with your name; they help us improve.', exArea_manager:'Your manager', exArea_pay:'Pay and benefits', exArea_growth:'Room to grow', exArea_workload:'Workload', exArea_culture:'Work environment', exReason:'Main reason for leaving', exRecommend:'Would you recommend working here to a friend? (0-10)', exReturn:'I would come back if the chance came', exComment:'What could have kept you?', exSend:'Send', exThanks:'Thank you. We have your answers.', exr_pay:'Pay', exr_growth:'Career growth', exr_manager:'Manager', exr_workload:'Workload', exr_relocation:'Moving city', exr_family:'Family', exr_study:'Study', exr_better_offer:'A better offer', exr_health:'Health', exr_other:'Other', exCount:'answers', exOpen:'Waiting for an answer', exHidden:'Results show from 5 answers, to keep them confidential.', exAvg:'Average rating', exReasons:'Reasons for leaving', exEnps:'Recommend score', exBack:'Would come back', exComments:'Comments (no names)', kdTitle:'Recognition', kdLead:'Thank colleagues against the company values; everyone sees it, and it measures the culture of recognition.', kdMy:'Thank a colleague', kdSend:'Send thanks', kdTo:'To', kdValue:'Value', kdMsg:'Your message', kdFeed:'Latest thanks across the company', kdMine:'Thanks I received', kdReceived:'Received', kdSent:'Thanks sent', kdLeft:'left today', kdByValue:'By value', kdByDept:'By department', kdTop:'Most thanked', kdMonth:'This month', kdv_teamwork:'Teamwork', kdv_customer:'Customer first', kdv_safety:'Safety first', kdv_initiative:'Initiative', kdv_excellence:'Excellence', e_kudos_daily_limit:'You have sent 5 thanks today.',
  e_saudi_only:'This is a localised job: no offer to a non-Saudi.', e_offer_expired:'The offer has expired; renew it before recording the acceptance.'
});

var css = '' +
'.w2-row .main small{display:block}.w2-flag{color:var(--bad);font-size:12.5px;display:flex;gap:4px;align-items:center;margin-top:2px}.w2-warn{color:var(--warn,var(--bad));font-size:12.5px;display:flex;gap:4px;align-items:flex-start;margin:4px 0}' +
'.w2-thread{display:grid;gap:8px;margin:10px 0}.w2-msg{border:1px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--surface,transparent)}.w2-msg.me{border-color:var(--brand)}.w2-msg.int{border-style:dashed;opacity:.85}' +
'.w2-msg small{display:block;color:var(--muted);font-size:12px;margin-bottom:2px}.w2-msg p{margin:0;white-space:pre-wrap}.w2-sched{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin:8px 0}' +
'.w2-sched div{border:1px solid var(--line);border-radius:10px;padding:6px 8px;font-size:12.5px}.w2-sched div.paid{border-color:var(--brand)}.w2-sched b{display:block}.w2-body{white-space:pre-wrap;margin:6px 0 0}' +
'.w2-mx{overflow:auto}.w2-mx table{border-collapse:collapse;font-size:12.5px;min-width:100%}.w2-mx th,.w2-mx td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:start;white-space:nowrap}' +
'.w2-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--line);vertical-align:middle}.w2-dot.valid{background:var(--brand)}.w2-dot.expiring{background:var(--warn,var(--bad));opacity:.7}.w2-dot.expired,.w2-dot.missing{background:var(--bad)}' +
'.oc-tree,.oc-tree ul{list-style:none;margin:0;padding:0}.oc-tree ul{padding-inline-start:28px;border-inline-start:1px dashed var(--line);margin-inline-start:18px}' +
'.oc-tree li{margin:8px 0;position:relative}.oc-tree ul > li::before{content:"";position:absolute;inset-inline-start:-28px;top:26px;width:24px;border-top:1px dashed var(--line)}' +
'.oc-card{display:inline-flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--card,#fff);border-radius:14px;padding:8px 12px;cursor:pointer;min-width:240px;transition:border-color .2s,box-shadow .2s}' +
'.oc-card:hover{border-color:var(--brand);box-shadow:0 8px 18px -12px rgba(0,0,0,.35)}.oc-card .av{width:36px;height:36px}.oc-card b{display:block}.oc-card small{display:block;color:var(--ink-3,var(--muted));font-size:12px}' +
'.oc-card .oc-n{margin-inline-start:auto;font-size:12px;background:var(--brand-tint,#E7EFE6);color:var(--brand);border-radius:999px;padding:2px 8px}.oc-tree li.fold > ul{display:none}.oc-tree li.hit > .oc-card{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-tint,#E7EFE6)}' +
'.rb-grid{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px;align-items:start}.rb-side{border:1px solid var(--line);border-radius:14px;padding:12px 14px;position:sticky;top:12px}.rb-side h4{margin:6px 0 8px}.rb-cols{display:grid;gap:4px;max-height:280px;overflow:auto;margin-bottom:8px}' +
'.rb-tbl,.rb-sum{border-collapse:collapse;font-size:13px;min-width:100%}.rb-tbl th,.rb-tbl td,.rb-sum th,.rb-sum td{border-bottom:1px solid var(--line);padding:6px 9px;text-align:start;white-space:nowrap}.rb-tbl thead th{position:sticky;top:0;background:var(--card,#fff)}@media (max-width:900px){.rb-grid{grid-template-columns:1fr}.rb-side{position:static}}' +
'.w2-stars{display:flex;gap:4px}.w2-stars button{font-size:20px}.w2-q{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.w2-ann{border-inline-start:3px solid var(--brand);padding-inline-start:10px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ================= shared kit (same shape as gov.js) =================
var uid = 0;
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function fmtT(iso){ var ms = Date.parse(iso); return isNaN(ms) ? '' : new Date(ms).toLocaleString(LOCALE(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }); }
function monthOf(m){ return m ? new Date(m + '-15T12:00:00Z').toLocaleDateString(LOCALE(), { month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function money(n){ return n == null ? '-' : '<span class="num">' + Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + '</span> ' + sar(); }
function sep(){ return ' · '; }
function busy(el){ el.innerHTML = '<div class="list">' + [0, 1, 2].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%;margin-top:6px"></span></div></div>'; }).join('') + '</div>'; }
function bad(code){ return '<p class="hr-bad" role="alert">' + esc(errText(code)) + '</p>'; }
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function empLine(e){ return e ? esc(lang(e.name, e.nameEn)) + ' <bdi class="num">' + esc(e.empNo) + '</bdi>' : ''; }
function av(e, icon){ return '<div class="av">' + (e ? esc(initials(e.name)) : ph(icon || 'file')) + '</div>'; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function fld(label, control, hint){
  var id = 'w2f' + (++uid);
  return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + (hint ? '<small class="hr-hint">' + hint + '</small>' : '') + '</div>';
}
function chk(name, label, on){ return '<label class="hr-check" style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '> <span>' + label + '</span></label>'; }
function opts(list, cur, none){ return (none != null ? '<option value="">' + none + '</option>' : '') + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
function mopts(list, cur){ cur = cur || []; return list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (cur.indexOf(o[0]) >= 0 ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
function keyOpts(keys, prefix, cur, none){ return opts(keys.map(function(k){ return [k, t(prefix + k)]; }), cur, none); }
function two(a, b){ return '<div class="two">' + a + b + '</div>'; }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
function confirmTap(b, fn){
  b.onclick = function(){
    if (b.dataset.armed) { b.disabled = true; return fn(); }
    var old = b.innerHTML; b.dataset.armed = '1'; b.textContent = S.lang === 'en' ? 'Tap again to confirm' : 'اضغط مرة أخرى للتأكيد';
    setTimeout(function(){ if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.innerHTML = old; } }, 4000);
  };
}
/** Form values: text trimmed, checkboxes true/false, multi-selects as arrays. */
function formVals(f){
  var v = {};
  Array.prototype.forEach.call(f.elements, function(x){
    if (!x.name) return;
    if (x.type === 'checkbox') v[x.name] = x.checked;
    else if (x.multiple) v[x.name] = Array.prototype.filter.call(x.options, function(o){ return o.selected; }).map(function(o){ return o.value; });
    else v[x.name] = x.value.trim();
  });
  return v;
}
/** A drawer with a form; submit(values) returns the api promise; on success the drawer closes and after(r) runs. */
function formDrawer(title, lead, html, submit, after, btn){
  var d = drawer('<h3>' + title + '</h3>' + (lead ? '<p class="hr-hint">' + lead + '</p>' : '') + '<form class="form" id="w2F">' + html + '<p class="hr-bad" id="w2E" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + (btn || title) + '</button></div></form>');
  var f = $('#w2F', d);
  f.onsubmit = function(ev){
    ev.preventDefault(); var b = f.querySelector('[type=submit]'); b.disabled = true;
    var p = submit(formVals(f), f);
    if (!p || !p.then) { b.disabled = false; return; }
    p.then(function(r){ b.disabled = false; if (!r.ok) return $('#w2E', d).textContent = errText(r.error); d.remove(); toast(t('w2Saved')); refreshTasks(); if (after) after(r); });
  };
  return d;
}
function noteDrawer(title, lead, call, after, required){
  return formDrawer(title, lead, fld(t(required === false ? 'w2Note' : 'w2NoteReq'), '<input name="note" maxlength="300"' + (required === false ? '' : ' required') + '>'), function(v){ return call(v.note); }, after);
}
function tabsBar(cur, list){
  return '<div class="op-tabs" role="tablist">' + list.map(function(x){ return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (cur === x[0]) + '">' + ph(x[1]) + t(x[2]) + '</button>'; }).join('') + '</div>';
}
function head(body, title, leadKey){ body.innerHTML = '<div class="hr-h"><h2>' + t(title) + '</h2></div><p class="hr-hint" style="margin:-4px 0 12px">' + t(leadKey) + '</p><div id="w2B"></div>'; return $('#w2B', body); }
function tiles(list){ var V = window.Viz; return V ? '<div class="db-tiles">' + list.map(function(x){ return V.tile(x[0], x[1], x[2] || '', null, !!x[3], !!x[3]); }).join('') + '</div>' : ''; }
function n(v){ var V = window.Viz; return V ? V.n1(v || 0, 0) : String(v || 0); }
function wire(el){ if (window.Viz && Viz.wire) Viz.wire(el); }
function warnList(prefix, list){ return (list || []).map(function(w){ return '<p class="w2-warn">' + ph('warning') + ' ' + t(prefix + w) + '</p>'; }).join(''); }
function histList(h){ return h && h.length ? '<div class="list">' + h.map(function(x){ return '<div class="row"><div class="main"><b>' + esc(x.by || '') + (x.decision ? sep() + esc(x.decision) : '') + (x.to ? sep() + t('rcs_' + x.to) : '') + '</b><small>' + fmtT(x.at) + (x.note ? sep() + esc(x.note) : '') + '</small></div></div>'; }).join('') + '</div>' : ''; }

/** The company list for pickers (hrBootstrap: HR, payroll); others get an empty list and the forms that need it stay hidden. */
var PEOPLE = null;
function people(cb){
  if (PEOPLE) return cb(PEOPLE);
  if (!(isHr() || R().hr || R().payroll)) return cb(PEOPLE = { rows: [], depts: [], positions: [] });
  api('hrBootstrap', {}, true).then(function(r){ PEOPLE = r.ok ? { rows: (r.rows || []).filter(function(e){ return e.status !== 'inactive' && e.status !== 'terminated'; }), depts: r.depts || [], positions: r.positions || [] } : { rows: [], depts: [], positions: [] }; cb(PEOPLE); });
}
function empOpts(rows, cur, none){ return opts(rows.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), cur, none); }
function deptOpts(P){ return P.depts.map(function(d){ return [d.id, lang(d.nameAr, d.nameEn)]; }); }
function posOpts(P){ return P.positions.map(function(p){ return [p.id, lang(p.titleAr || p.title, p.titleEn)]; }); }

// =================================================================== LOANS
var LN_CLS = { pending: 'late', approved: 'late', active: 'in', settled: 'off', rejected: 'absent', cancelled: 'off' };
var LN_KINDS = ['personal', 'housing', 'car', 'education', 'medical', 'emergency', 'other'];
function loanRow(l, i){
  var acts = (l.canAct ? '<button type="button" class="btn btn-dark btn-sm" data-ok="' + i + '">' + t('w2Approve') + '</button> <button type="button" class="btn btn-line btn-sm" data-no="' + i + '">' + t('w2Reject') + '</button> ' : '') +
    (l.canDisburse ? '<button type="button" class="btn btn-dark btn-sm" data-pay="' + i + '">' + t('lnDisburse') + '</button> ' : '') +
    '<button type="button" class="btn btn-line btn-sm" data-ln="' + i + '" aria-label="' + t('w2Details') + '">' + ph('list-magnifying-glass') + '</button>';
  return '<div class="row w2-row">' + av(l.emp, 'hand-coins') + '<div class="main"><b>' + (l.mine ? '' : empLine(l.emp) + sep()) + t('lnk_' + l.kind) + (l.principal != null ? sep() + money(l.principal) : '') + '</b>' +
    '<small><bdi>' + esc(l.ref) + '</bdi>' + (l.installment != null ? sep() + t('lnInstall') + ' ' + money(l.installment) : '') + sep() + plural(l.months, 'months') + sep() + t('lnStart') + ' ' + monthOf(l.startMonth) +
    (l.status === 'pending' ? sep() + t('lnStep') + ' ' + t('lnSteps_' + l.step) : '') + (l.outstanding ? sep() + t('lnLeft') + ' ' + money(l.outstanding) : '') + '</small>' +
    (l.purpose ? '<small>' + esc(l.purpose) + '</small>' : '') + '</div>' + chip(t('lns_' + l.status), LN_CLS[l.status]) + ' ' + acts + '</div>';
}
function loanDetail(l, again){
  var h = '<p class="hr-hint">' + (l.mine ? '' : empLine(l.emp) + sep()) + '<bdi>' + esc(l.ref) + '</bdi>' + sep() + t('lns_' + l.status) + '</p>';
  if (l.principal != null) h += '<div class="mf-kv"><div><span>' + t('lnPrincipal') + '</span><b>' + money(l.principal) + '</b></div><div><span>' + t('lnInstall') + '</span><b>' + money(l.installment) + '</b></div>' +
    '<div><span>' + t('lnRepaid') + '</span><b>' + money(l.repaid) + '</b></div><div><span>' + t('lnLeft') + '</span><b>' + money(l.outstanding) + '</b></div>' +
    (l.disbursedOn ? '<div><span>' + t('lnDisbOn') + '</span><b>' + fmt(l.disbursedOn) + ' <bdi>' + esc(l.disbursedRef || '') + '</bdi></b></div>' : '') + '</div>';
  if (l.consentAt) h += '<p class="hr-hint">' + ph('signature') + ' ' + t('lnConsent') + ' ' + fmtT(l.consentAt) + '</p>';
  if (l.schedule && l.schedule.length) h += '<h4>' + t('lnSchedule') + '</h4><div class="w2-sched">' + l.schedule.map(function(s){ return '<div class="' + (s.paid >= s.amount - 0.004 ? 'paid' : '') + '"><b>' + monthOf(s.month) + '</b>' + money(s.amount) + (s.paid ? '<br><small>' + t('lnPaid') + ' ' + money(s.paid) + '</small>' : '') + '</div>'; }).join('') + '</div>';
  if (l.settlements && l.settlements.length) h += '<h4>' + t('lnSettlements') + '</h4><div class="list">' + l.settlements.map(function(s, k){
    return '<div class="row"><div class="main"><b>' + money(s.amount) + sep() + fmt(s.on) + '</b><small><bdi>' + esc(s.reference) + '</bdi>' + sep() + esc(s.by) + (s.verifiedBy ? sep() + esc(s.verifiedBy) : '') + '</small></div>' +
      chip(t('lnss_' + s.status), s.status === 'verified' ? 'in' : s.status === 'pending' ? 'late' : 'absent') + (s.canVerify ? ' <button type="button" class="btn btn-dark btn-sm" data-vf="' + k + '">' + t('lnVerify') + '</button> <button type="button" class="btn btn-line btn-sm" data-vx="' + k + '">' + t('w2Reject') + '</button>' : '') + '</div>'; }).join('') + '</div>';
  if (l.history && l.history.length) h += '<h4>' + t('w2History') + '</h4>' + histList(l.history.map(function(x){ return { by: x.by, decision: x.step ? t('lnSteps_' + x.step) + ': ' + x.decision : x.decision, note: x.note, at: x.at }; }));
  h += '<div class="btnrow">' + (l.canSettle ? '<button type="button" class="btn btn-line btn-sm" id="lnSt">' + ph('hand-coins') + t('lnSettle') + '</button>' : '') + (l.canCancel ? '<button type="button" class="btn btn-line btn-sm" id="lnCx">' + t('w2Cancel') + '</button>' : '') + '</div><p class="hr-bad" id="lnE" role="alert"></p>';
  var d = drawer('<h3>' + t('lnTitle') + '</h3>' + h);
  var fin = function(y){ if (!y.ok) return $('#lnE', d).textContent = errText(y.error); d.remove(); toast(t('w2Saved')); refreshTasks(); again(); };
  $$('[data-vf]', d).forEach(function(b){ confirmTap(b, function(){ api('loanSettleVerify', { id: l.id, settlementId: l.settlements[b.dataset.vf].id, decision: 'verify' }).then(fin); }); });
  $$('[data-vx]', d).forEach(function(b){ b.onclick = function(){ var s = l.settlements[b.dataset.vx]; d.remove(); noteDrawer(t('w2Reject'), money(s.amount), function(note){ return api('loanSettleVerify', { id: l.id, settlementId: s.id, decision: 'reject', note: note }); }, again); }; });
  var stb = $('#lnSt', d); if (stb) stb.onclick = function(){ d.remove(); var td = riyadhToday();
    formDrawer(t('lnSettle'), esc(l.ref) + sep() + t('lnLeft') + ' ' + money(l.outstanding), two(fld(t('w2Amount'), '<input name="amount" type="number" min="0.01" step="0.01" max="' + (l.outstanding || 0) + '" required>'), fld(t('w2Date'), '<input name="on" type="date" max="' + td + '" value="' + td + '">')) +
      fld(t('w2Ref'), '<input name="reference" dir="ltr" maxlength="60" required>'), function(v){ return api('loanSettle', { id: l.id, amount: v.amount, on: v.on, reference: v.reference }); }, again); };
  var cx = $('#lnCx', d); if (cx) cx.onclick = function(){ d.remove(); noteDrawer(t('w2Cancel'), esc(l.ref), function(note){ return api('loanCancel', { id: l.id, note: note }); }, again, !l.mine); };
}
function wireLoans(el, rows, again){
  $$('[data-ln]', el).forEach(function(b){ b.onclick = function(){ loanDetail(rows[b.dataset.ln], again); }; });
  $$('[data-ok]', el).forEach(function(b){ confirmTap(b, function(){ api('loanDecide', { id: rows[b.dataset.ok].id, decision: 'approve' }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('w2Saved')); refreshTasks(); again(); }); }); });
  $$('[data-no]', el).forEach(function(b){ b.onclick = function(){ var l = rows[b.dataset.no]; noteDrawer(t('w2Reject'), esc(l.ref), function(note){ return api('loanDecide', { id: l.id, decision: 'reject', note: note }); }, again); }; });
  $$('[data-pay]', el).forEach(function(b){ b.onclick = function(){ var l = rows[b.dataset.pay], td = riyadhToday();
    formDrawer(t('lnDisburse'), empLine(l.emp) + sep() + money(l.principal), two(fld(t('lnDisbOn'), '<input name="disbursedOn" type="date" max="' + td + '" value="' + td + '">'), fld(t('lnDisbRef'), '<input name="disbursedRef" dir="ltr" maxlength="60" required>')),
      function(v){ return api('loanDisburse', { id: l.id, disbursedOn: v.disbursedOn, disbursedRef: v.disbursedRef }); }, again); }; });
}
/** The loan form with a live quote: for myself (empId empty) or, for HR / payroll, for an employee who signed on paper. */
function loanForm(pol, peopleRows, again){
  var forOther = !!peopleRows;
  var lim = pol ? '<p class="hr-hint">' + t('lnLimit').replace('{n}', pol.maxSalaries).replace('{m}', pol.maxMonths).replace('{s}', pol.minServiceMonths) + '</p>' : '';
  var d = formDrawer(forOther ? t('lnNew') : t('lnAsk'), '', lim + (forOther ? fld(t('w2Employee'), '<select name="empId" required>' + empOpts(peopleRows, '', '-') + '</select>') : '') +
    two(fld(t('w2Kind'), '<select name="kind">' + keyOpts(LN_KINDS, 'lnk_', 'personal') + '</select>'), fld(t('lnPrincipal'), '<input name="principal" type="number" min="1" step="0.01" required>')) +
    two(fld(t('w2Months'), '<input name="months" type="number" min="1" max="' + (pol ? pol.maxMonths : 120) + '" value="12" required>'), fld(t('lnStart'), '<input name="startMonth" type="month">')) +
    fld(t('lnPurpose'), '<input name="purpose" maxlength="300" required>') + '<div id="lnQ"></div>' + chk('consent', t('lnConsent')),
    function(v){ var loan = { empId: v.empId || '', kind: v.kind, principal: v.principal, months: v.months, startMonth: v.startMonth, purpose: v.purpose, consent: v.consent === true }; return api('loanCreate', { loan: loan }); }, again, forOther ? t('w2Save') : t('lnAsk'));
  var f = $('#w2F', d), q = $('#lnQ', d), timer = 0;
  function quote(){
    var v = formVals(f); if (!(Number(v.principal) > 0) || !(Number(v.months) >= 1)) { q.innerHTML = ''; return; }
    var p = { loan: { principal: v.principal, months: v.months, startMonth: v.startMonth } }; if (v.empId) p.empId = v.empId;
    api('loanQuote', p, true).then(function(r){
      if (!q.isConnected) return;
      if (!r.ok) { q.innerHTML = bad(r.error); return; }
      var c = r.quote;
      q.innerHTML = '<div class="mf-kv"><div><span>' + t('lnInstall') + '</span><b>' + money(c.installment) + '</b></div><div><span>' + t('lnStart') + '</span><b>' + monthOf(c.startMonth) + '</b></div><div><span>' + t('w2Months') + '</span><b>' + c.schedule.length + '</b></div></div>' +
        c.errors.map(function(e){ return '<p class="hr-bad">' + esc(errText(e)) + '</p>'; }).join('') + warnList('lnw_', c.warnings);
    });
  }
  f.oninput = function(){ clearTimeout(timer); timer = setTimeout(quote, 400); };
  return d;
}
function loansSection(body){
  var box = head(body, 'lnTitle', 'lnLead'), tab = S.lnTab || 'inbox';
  function load(){
    busy(box);
    Promise.all([api('loanList', { scope: 'inbox' }, true), api('loanList', { scope: 'all' }, true), api('myLoans', {}, true)]).then(function(rs){
      if (!box.isConnected) return;
      var inbox = rs[0], all = rs[1], my = rs[2];
      if (!inbox.ok) return box.innerHTML = bad(inbox.error);
      var tot = (all.ok && all.totals) || inbox.totals;
      var h = tot ? tiles([[t('lnPending'), n(tot.pending), '', true], [t('lnActive'), n(tot.active)], [t('lnOutstanding'), money(tot.outstanding)]]) : '';
      h += tabsBar(tab, [['inbox', 'tray', 'w2Inbox'], ['all', 'list', 'w2AllRec']]);
      var canNew = my.ok && my.canAll;
      h += '<div class="toolbar"><span class="sp"></span>' + (canNew ? '<button type="button" class="btn btn-line btn-sm" id="lnNew">' + ph('plus') + t('lnNew') + '</button> ' : '') +
        (salaryOk() || isAdmin() ? '<button type="button" class="btn btn-line btn-sm" id="lnPol">' + ph('sliders') + t('lnPolicy') + '</button>' : '') + '</div>';
      var rows = tab === 'all' ? (all.ok ? all.rows : []) : inbox.rows;
      h += rows.length ? '<div class="list">' + rows.map(loanRow).join('') + '</div>' : empty('hand-coins', t('w2None'));
      box.innerHTML = h; wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.lnTab = b.dataset.tab; load(); }; });
      wireLoans(box, rows, load);
      var nb = $('#lnNew', box); if (nb) nb.onclick = function(){ people(function(P){ loanForm(my.policy, P.rows, load); }); };
      var pb = $('#lnPol', box); if (pb) pb.onclick = function(){ var p = my.policy || {};
        formDrawer(t('lnPolicy'), '', two(fld(t('lnMaxSal'), '<input name="maxSalaries" type="number" min="0.5" max="24" step="0.5" value="' + p.maxSalaries + '">'), fld(t('lnMaxMonths'), '<input name="maxMonths" type="number" min="1" max="120" value="' + p.maxMonths + '">')) +
          fld(t('lnMinSvc'), '<input name="minServiceMonths" type="number" min="0" max="60" value="' + p.minServiceMonths + '">') + chk('oneActive', t('lnOneActive'), p.oneActive),
          function(v){ return api('loanPolicySave', { policy: v }); }, load, t('w2Save')); };
    });
  }
  load();
}
function myLoansCard(el){
  apiFresh('myLoans', {}, function(r){
    if (!el.isConnected || !r.ok) return;
    var d = el.querySelector('[data-w2=loans]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'loans';
    var h = '<h3><span class="ic">' + ph('hand-coins') + '</span>' + t('lnMy') + '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" data-ask="1">' + ph('plus') + t('lnAsk') + '</button></h3>';
    h += r.rows.length ? r.rows.slice(0, 5).map(loanRow).join('') : '<p class="hr-hint">' + t('w2None') + '</p>';
    d.innerHTML = h; if (!d.isConnected) el.appendChild(d);
    var again = function(){ myLoansCard(el); };
    $('[data-ask]', d).onclick = function(){ loanForm(r.policy, null, again); };
    wireLoans(d, r.rows, again);
  }, true);
}

// =================================================================== HELP DESK
var HD_CATS = ['payroll', 'gosi', 'leave', 'documents', 'letters', 'insurance', 'gov_services', 'it_access', 'conduct', 'other'];
var HD_CLS = { open: 'late', in_progress: 'in', waiting_employee: 'late', resolved: 'off', closed: 'off' };
function hdRow(x, i){
  return '<div class="row w2-row" data-hd="' + i + '" style="cursor:pointer">' + av(x.mine ? null : x.emp, 'lifebuoy') + '<div class="main"><b>' + esc(x.subject) + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + sep() + t('hdc_' + x.category) +
    (x.mine ? '' : sep() + empLine(x.emp)) + sep() + t('hdp_' + x.priority) + (x.assignee && !x.mine ? sep() + t('hdAssignee') + ' ' + esc(x.assignee.name) : '') + sep() + fmtT(x.createdAt) + '</small>' +
    (x.overdue && !x.mine ? '<span class="w2-flag">' + ph('clock-countdown') + t('hdOverdue') + sep() + fmtT(x.slaDue) + '</span>' : '') + (x.confidential ? '<span class="w2-flag">' + ph('lock') + t('hdConf') + '</span>' : '') + '</div>' +
    chip(t('hds_' + x.status), HD_CLS[x.status]) + '</div>';
}
function hdOpen(id, again){
  api('hdGet', { id: id }, true).then(function(r){
    if (!r.ok) return toast(errText(r.error));
    var x = r.ticket, own = x.mine;
    var h = '<p class="hr-hint"><bdi>' + esc(x.ref) + '</bdi>' + sep() + t('hdc_' + x.category) + sep() + t('hdp_' + x.priority) + sep() + t('hds_' + x.status) + (own ? '' : sep() + empLine(x.emp)) +
      (x.canWork ? sep() + t('hdAssignee') + ' ' + (x.assignee ? esc(x.assignee.name) : t('hdNobody')) + sep() + t('hdSla') + ' ' + fmtT(x.slaDue) : '') + '</p>';
    h += '<div class="w2-thread"><div class="w2-msg' + (own ? ' me' : '') + '"><small>' + (own ? '' : esc(x.emp ? x.emp.name : '')) + ' ' + fmtT(x.createdAt) + '</small><p>' + esc(x.body) + '</p></div>' +
      (x.messages || []).map(function(m){ return '<div class="w2-msg' + (m.byId === S.me.id ? ' me' : '') + (m.internal ? ' int' : '') + '"><small>' + esc(m.by) + ' ' + fmtT(m.at) + (m.internal ? sep() + ph('lock') + t('hdInternal') : '') + '</small><p>' + esc(m.text) + '</p></div>'; }).join('') + '</div>';
    if (x.status !== 'closed') {
      h += '<form class="form" id="hdR">' + fld(t('hdReply'), '<textarea name="text" rows="3" maxlength="4000" required></textarea>') +
        (x.canWork ? chk('internal', t('hdInternal')) + fld(t('hdSetStatus'), '<select name="status">' + opts([['', '-'], ['in_progress', t('hds_in_progress')], ['waiting_employee', t('hds_waiting_employee')], ['resolved', t('hds_resolved')]], '') + '</select>') : '') +
        '<div class="btnrow"><button class="btn btn-dark" type="submit">' + t('hdSend') + '</button></div></form>';
    }
    h += '<div class="btnrow">' + (x.canWork && !x.assignee && x.status !== 'closed' && x.status !== 'resolved' ? '<button type="button" class="btn btn-line btn-sm" id="hdMe">' + t('hdAssignMe') + '</button>' : '') +
      (x.canWork && x.status !== 'closed' ? '<button type="button" class="btn btn-line btn-sm" data-st="closed">' + t('hdCloseIt') + '</button>' : '') +
      (own && x.status !== 'closed' ? '<button type="button" class="btn btn-line btn-sm" data-st="closed">' + t('hdCloseIt') + '</button>' : '') +
      (own && x.status === 'resolved' ? '<button type="button" class="btn btn-line btn-sm" data-st="open">' + t('hdReopen') + '</button>' : '') + '</div>';
    if (own && (x.status === 'resolved' || x.status === 'closed')) h += x.rating != null ? '<p class="hr-hint">' + t('hdRated') + ' ' + '★'.repeat(x.rating) + '</p>' :
      '<h4>' + t('hdRate') + '</h4><div class="w2-stars">' + [1, 2, 3, 4, 5].map(function(k){ return '<button type="button" class="btn btn-line btn-sm" data-rate="' + k + '" aria-label="' + k + '">★ ' + k + '</button>'; }).join('') + '</div>';
    h += '<p class="hr-bad" id="hdE" role="alert"></p>';
    var d = drawer('<h3>' + esc(x.subject) + '</h3>' + h);
    var fin = function(y){ if (!y.ok) return $('#hdE', d).textContent = errText(y.error); d.remove(); toast(t('w2Saved')); refreshTasks(); if (again) again(); };
    var f = $('#hdR', d); if (f) f.onsubmit = function(ev){ ev.preventDefault(); var v = formVals(f); f.querySelector('[type=submit]').disabled = true;
      api('hdReply', { id: x.id, text: v.text, internal: v.internal === true, status: v.status || undefined }).then(fin); };
    var me = $('#hdMe', d); if (me) me.onclick = function(){ me.disabled = true; api('hdAssign', { id: x.id }).then(fin); };
    $$('[data-st]', d).forEach(function(b){ confirmTap(b, function(){ api('hdStatus', { id: x.id, status: b.dataset.st }).then(fin); }); });
    $$('[data-rate]', d).forEach(function(b){ b.onclick = function(){ b.disabled = true; api('hdRate', { id: x.id, rating: Number(b.dataset.rate) }).then(fin); }; });
  });
}
function hdForm(again){
  var d = formDrawer(t('hdAsk'), '', two(fld(t('hdCat'), '<select name="category">' + keyOpts(HD_CATS, 'hdc_', 'other') + '</select>'), fld(t('hdPriority'), '<select name="priority">' + keyOpts(['normal', 'high', 'urgent'], 'hdp_', 'normal') + '</select>')) +
    '<p class="hr-hint" id="hdCn" hidden>' + ph('lock') + ' ' + t('hdConduct') + '</p>' + fld(t('hdSubject'), '<input name="subject" maxlength="150" required>') + fld(t('hdBody'), '<textarea name="body" rows="5" maxlength="4000" required></textarea>'),
    function(v){ return api('hdCreate', { ticket: v }); }, again, t('hdSend'));
  var sel = $('[name=category]', d); sel.onchange = function(){ $('#hdCn', d).hidden = sel.value !== 'conduct'; };
  kbSuggest(d, function(){ d.remove(); });
  return d;
}
function deskSection(body){
  var box = head(body, 'hdTitle', 'hdLead'), F = S.hdF || { status: 'active', queue: '', mine: false };
  function load(){
    busy(box);
    api('hdList', { status: F.status, queue: F.queue, mine: F.mine }, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var c = r.counts;
      var h = tiles([[t('hdOverdue'), '<span class="db-status">' + (c.overdue ? ph('warning-circle') + ' ' : '') + c.overdue + '</span>', '', true], [t('hdUnassigned'), n(c.unassigned)], [t('hds_open'), n(c.open)], [t('hds_in_progress'), n(c.in_progress)], [t('hds_waiting_employee'), n(c.waiting_employee)]]);
      h += '<div class="toolbar"><select id="hdS" aria-label="' + t('w2Status') + '">' + opts([['active', t('hdActive')], ['', t('w2All')], ['resolved', t('hds_resolved')], ['closed', t('hds_closed')]], F.status) + '</select>' +
        (r.queues.length > 1 ? '<select id="hdQ" aria-label="' + t('hdQueue') + '">' + opts(r.queues.map(function(q){ return [q, t('hdq_' + q)]; }), F.queue, t('w2All')) + '</select>' : '') +
        '<label class="hr-check"><input type="checkbox" id="hdM"' + (F.mine ? ' checked' : '') + '> ' + t('hdMineOnly') + '</label><span class="sp"></span></div>';
      h += r.rows.length ? '<div class="list">' + r.rows.map(hdRow).join('') + '</div>' : empty('lifebuoy', t('w2None'));
      box.innerHTML = h; wire(box);
      var sync = function(){ F = S.hdF = { status: $('#hdS', box).value, queue: $('#hdQ', box) ? $('#hdQ', box).value : '', mine: $('#hdM', box).checked }; load(); };
      $('#hdS', box).onchange = sync; if ($('#hdQ', box)) $('#hdQ', box).onchange = sync; $('#hdM', box).onchange = sync;
      $$('[data-hd]', box).forEach(function(b){ b.onclick = function(){ hdOpen(r.rows[b.dataset.hd].id, load); }; });
    });
  }
  load();
}
function myDeskCard(el){
  apiFresh('hdMine', {}, function(r){
    if (!el.isConnected || !r.ok) return;
    var d = el.querySelector('[data-w2=hd]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'hd';
    d.innerHTML = '<h3><span class="ic">' + ph('lifebuoy') + '</span>' + t('hdMy') + '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" data-ask="1">' + ph('plus') + t('hdAsk') + '</button></h3>' +
      (r.rows.length ? r.rows.slice(0, 6).map(hdRow).join('') : '<p class="hr-hint">' + t('w2None') + '</p>');
    if (!d.isConnected) el.appendChild(d);
    var again = function(){ myDeskCard(el); };
    $('[data-ask]', d).onclick = function(){ hdForm(again); };
    var kbb = document.createElement('button'); kbb.type = 'button'; kbb.className = 'btn btn-line btn-sm'; kbb.innerHTML = ph('books') + t('kbBrowse'); kbb.onclick = function(){ goArea('requests', 'kb'); }; $('[data-ask]', d).before(kbb);
    $$('[data-hd]', d).forEach(function(b){ b.onclick = function(){ hdOpen(r.rows[b.dataset.hd].id, again); }; });
  }, true);
}

// =================================================================== ANNOUNCEMENTS
var ANN_KINDS = ['general', 'policy', 'event', 'urgent', 'celebration'];
var ANN_CLS = { draft: 'late', published: 'in', archived: 'off' };
function annForm(a, again){
  people(function(P){
    a = a || { kind: 'general', audience: { all: true } };
    var au = a.audience || { all: true }, toLocal = function(iso){ if (!iso) return ''; var ms = Date.parse(iso); return isNaN(ms) ? '' : new Date(ms + 180 * 60000).toISOString().slice(0, 16); };
    var d = formDrawer(a.id ? t('w2Edit') : t('anNew'), a.ref ? '<bdi>' + esc(a.ref) + '</bdi>' : '',
      two(fld(t('w2Kind'), '<select name="kind">' + keyOpts(ANN_KINDS, 'ank_', a.kind) + '</select>'), fld(t('anTitleAr'), '<input name="titleAr" maxlength="150" required value="' + esc(a.titleAr || '') + '">')) +
      fld(t('anBodyAr'), '<textarea name="bodyAr" rows="5" maxlength="4000" required>' + esc(a.bodyAr || '') + '</textarea>') +
      fld(t('anTitleEn'), '<input name="titleEn" maxlength="150" dir="ltr" value="' + esc(a.titleEn || '') + '">') + fld(t('anBodyEn'), '<textarea name="bodyEn" rows="3" maxlength="4000" dir="ltr">' + esc(a.bodyEn || '') + '</textarea>') +
      '<h4>' + t('anAudience') + '</h4>' + chk('all', t('anEveryone'), !!au.all) +
      '<div id="anAud"' + (au.all ? ' hidden' : '') + '>' + fld(t('anDepts'), '<select name="departmentIds" multiple size="4">' + mopts(deptOpts(P), au.departmentIds) + '</select>', t('w2Ctrl')) +
        fld(t('anPositions'), '<select name="positionIds" multiple size="4">' + mopts(posOpts(P), au.positionIds) + '</select>') + fld(t('anPeople'), '<select name="empIds" multiple size="5">' + mopts(P.rows.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), au.empIds) + '</select>') + '</div>' +
      two(fld(t('anPublishAt'), '<input name="publishAt" type="datetime-local" value="' + toLocal(a.publishAt) + '">'), fld(t('anExpires'), '<input name="expiresAt" type="datetime-local" value="' + toLocal(a.expiresAt) + '">')) +
      chk('pinned', t('anPinned'), a.pinned) + chk('requireAck', t('anAck'), a.requireAck),
      function(v){
        var iso = function(x){ return x ? new Date(Date.parse(x + ':00+03:00')).toISOString() : ''; };
        return api('annSave', { announcement: { id: a.id || '', kind: v.kind, titleAr: v.titleAr, titleEn: v.titleEn, bodyAr: v.bodyAr, bodyEn: v.bodyEn, pinned: v.pinned, requireAck: v.requireAck,
          publishAt: iso(v.publishAt), expiresAt: iso(v.expiresAt), audience: v.all ? { all: true } : { departmentIds: v.departmentIds, positionIds: v.positionIds, empIds: v.empIds } } });
      }, again, t('w2Save'));
    var all = $('[name=all]', d); all.onchange = function(){ $('#anAud', d).hidden = all.checked; };
  });
}
function annSection(body){
  var box = head(body, 'anTitle', 'anLead');
  function load(){
    busy(box);
    api('annList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var h = '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="anNew">' + ph('plus') + t('anNew') + '</button></div>';
      h += r.rows.length ? '<div class="list">' + r.rows.map(function(a, i){
        return '<div class="row w2-row">' + av(null, a.pinned ? 'push-pin' : 'megaphone') + '<div class="main"><b>' + esc(lang(a.titleAr, a.titleEn)) + '</b><small><bdi>' + esc(a.ref) + '</bdi>' + sep() + t('ank_' + a.kind) +
          (a.status !== 'draft' ? sep() + t('anReads') + ' ' + a.reads + '/' + a.audienceSize + (a.requireAck ? sep() + t('anAcks') + ' ' + a.acks + '/' + a.audienceSize : '') : sep() + t('anAudience') + ' ' + a.audienceSize) +
          (a.publishAt ? sep() + fmtT(a.publishAt) : '') + (a.expiresAt ? ' - ' + fmtT(a.expiresAt) : '') + '</small></div>' + chip(t('ans_' + a.status), ANN_CLS[a.status]) + ' ' +
          (a.status === 'draft' ? '<button type="button" class="btn btn-dark btn-sm" data-pub="' + i + '">' + t('anPublish') + '</button> <button type="button" class="btn btn-line btn-sm" data-ed="' + i + '" aria-label="' + t('w2Edit') + '">' + ph('pencil-simple') + '</button> ' : '') +
          (a.status !== 'archived' ? '<button type="button" class="btn btn-line btn-sm" data-arc="' + i + '" aria-label="' + t('anArchive') + '">' + ph('archive') + '</button> ' : '') +
          '<button type="button" class="btn btn-line btn-sm" data-vw="' + i + '" aria-label="' + t('w2Details') + '">' + ph('eye') + '</button></div>'; }).join('') + '</div>' : empty('megaphone', t('w2None'));
      box.innerHTML = h;
      $('#anNew', box).onclick = function(){ annForm(null, load); };
      var act = function(b, call){ confirmTap(b, function(){ call().then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('w2Saved')); load(); }); }); };
      $$('[data-pub]', box).forEach(function(b){ act(b, function(){ return api('annPublish', { id: r.rows[b.dataset.pub].id }); }); });
      $$('[data-arc]', box).forEach(function(b){ act(b, function(){ return api('annArchive', { id: r.rows[b.dataset.arc].id }); }); });
      $$('[data-ed]', box).forEach(function(b){ b.onclick = function(){ annForm(r.rows[b.dataset.ed], load); }; });
      $$('[data-vw]', box).forEach(function(b){ b.onclick = function(){ var a = r.rows[b.dataset.vw];
        drawer('<h3>' + esc(lang(a.titleAr, a.titleEn)) + '</h3><p class="hr-hint"><bdi>' + esc(a.ref) + '</bdi>' + sep() + t('ans_' + a.status) + (a.createdBy ? sep() + esc(a.createdBy.name) : '') + (a.publishedBy ? sep() + t('anPublish') + ' ' + esc(a.publishedBy.name) : '') + '</p>' +
          '<p class="w2-body">' + esc(lang(a.bodyAr, a.bodyEn)) + '</p>' + (a.notAcked && a.status !== 'draft' ? '<h4>' + t('anNotAcked') + ' (' + a.notAcked.length + ')</h4>' + (a.notAcked.length ? '<div class="list">' + a.notAcked.map(function(e){ return '<div class="row">' + av(e) + '<div class="main"><b>' + empLine(e) + '</b></div></div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('w2None') + '</p>') : '')); }; });
    });
  }
  load();
}
function myAnnCard(el){
  apiFresh('myAnnouncements', {}, function(r){
    if (!el.isConnected || !r.ok || !r.rows.length) return;
    var d = el.querySelector('[data-w2=ann]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'ann';
    d.innerHTML = '<h3><span class="ic">' + ph('megaphone') + '</span>' + t('anMy') + '<span class="sp"></span>' + (r.unread ? chip(r.unread + ' ' + t('anNew1'), 'late') : '') + '</h3>' + r.rows.slice(0, 6).map(function(a, i){
      return '<div class="row w2-row" data-an="' + i + '" style="cursor:pointer"><div class="main w2-ann"><b>' + (a.pinned ? ph('push-pin') + ' ' : '') + esc(lang(a.titleAr, a.titleEn)) + '</b><small>' + t('ank_' + a.kind) + sep() + fmtT(a.publishAt) + '</small></div>' +
        (a.requireAck && !a.ackAt ? chip(t('anAck'), 'late') : !a.readAt ? chip(t('anNew1'), 'late') : '') + '</div>'; }).join('');
    if (!d.isConnected) el.insertBefore(d, el.firstChild);
    var again = function(){ myAnnCard(el); refreshTasks(); };
    $$('[data-an]', d).forEach(function(b){ b.onclick = function(){ var a = r.rows[b.dataset.an];
      var dd = drawer('<h3>' + esc(lang(a.titleAr, a.titleEn)) + '</h3><p class="hr-hint">' + t('ank_' + a.kind) + sep() + fmtT(a.publishAt) + '</p><p class="w2-body">' + esc(lang(a.bodyAr, a.bodyEn)) + '</p>' +
        (a.requireAck ? (a.ackAt ? '<p class="hr-hint">' + ph('seal-check') + ' ' + t('anAcked') + ' ' + fmtT(a.ackAt) + '</p>' : '<div class="btnrow"><button type="button" class="btn btn-dark" id="anOk">' + t('anAckBtn') + '</button></div>') : ''));
      if (!a.readAt) api('annRead', { id: a.id }, true).then(function(x){ if (x.ok) { a.readAt = x.readAt; again(); } });
      var ok = $('#anOk', dd); if (ok) ok.onclick = function(){ ok.disabled = true; api('annRead', { id: a.id, ack: true }).then(function(x){ if (!x.ok) { ok.disabled = false; return toast(errText(x.error)); } dd.remove(); toast(t('anAcked')); again(); }); };
    }; });
  }, true);
}

// =================================================================== INSURANCE
var INS_REL = ['self', 'spouse', 'child', 'parent'];
var IMS_CLS = { pending_add: 'late', active: 'in', pending_delete: 'late', deleted: 'off', rejected: 'absent' };
var IMV_CLS = { requested: 'late', submitted: 'late', confirmed: 'in', rejected: 'absent' };
function insMoveRow(x, i){
  return '<div class="row w2-row">' + av(x.emp, 'first-aid') + '<div class="main"><b>' + t('imk_' + x.kind) + sep() + esc(x.member) + ' (' + t('inr_' + (x.relation || 'self')) + ')' + (x.emp ? sep() + empLine(x.emp) : '') + '</b>' +
    '<small><bdi>' + esc(x.ref) + '</bdi>' + sep() + t('inEffective') + ' ' + fmt(x.effective) + (x.insClass ? sep() + t('inClass') + ' ' + esc(x.insClass) : '') + (x.premiumDelta != null ? sep() + t('inPremiumDelta') + ' ' + money(x.premiumDelta) : '') +
    (x.insurerRef ? sep() + '<bdi>' + esc(x.insurerRef) + '</bdi>' : '') + '</small>' + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</div>' + chip(t('imv_' + x.status), IMV_CLS[x.status]) + ' ' +
    (x.canSubmit && x.status === 'requested' ? '<button type="button" class="btn btn-dark btn-sm" data-sub="' + i + '">' + t('inSubmit') + '</button> ' : '') +
    (x.canConfirm ? '<button type="button" class="btn btn-dark btn-sm" data-cf="' + i + '">' + t('inConfirm') + '</button> ' : '') +
    (x.canSubmit || x.canConfirm ? '<button type="button" class="btn btn-line btn-sm" data-rj="' + i + '">' + t('w2Reject') + '</button>' : '') + '</div>';
}
function insMemberForm(pols, P, self, again, empId){
  var act = pols.filter(function(p){ return p.status === 'active'; });
  var clsOpts = function(pid){ var p = act.filter(function(x){ return x.id === pid; })[0] || act[0]; return p ? opts(p.classes.map(function(c){ return [c.code, c.code + (c.nameAr && c.nameAr !== c.code ? ' - ' + c.nameAr : '')]; }), '') : ''; };
  var d = formDrawer(self ? t('inAddDep') : t('inAddMember'), '', (self ? '' : fld(t('w2Employee'), '<select name="empId" required>' + empOpts(P.rows, empId || '', '-') + '</select>')) +
    two(fld(t('inPolicy'), '<select name="policyId" required>' + opts(act.map(function(p){ return [p.id, p.insurer + (p.policyNo ? ' (' + p.policyNo + ')' : '')]; }), act[0] ? act[0].id : '') + '</select>'), fld(t('inClass'), '<select name="insClass" required>' + clsOpts(act[0] && act[0].id) + '</select>')) +
    two(fld(t('inRelation'), '<select name="relation">' + keyOpts(self ? INS_REL.slice(1) : INS_REL, 'inr_', self ? 'spouse' : 'self') + '</select>'), fld(t('inEffective'), '<input name="fromDate" type="date">')) +
    '<div id="inDep"' + (self ? '' : ' hidden') + '>' + two(fld(t('inName'), '<input name="name" maxlength="100">'), fld(t('inNameEn'), '<input name="nameEn" maxlength="100" dir="ltr">')) +
    two(fld(t('inBirth'), '<input name="birthDate" type="date">'), fld(t('inGender'), '<select name="gender">' + opts([['male', t('inMale')], ['female', t('inFemale')]], 'male', '-') + '</select>')) + fld(t('inIdNo'), '<input name="idNo" dir="ltr" maxlength="20">') + '</div>' +
    fld(t('w2Note'), '<input name="note" maxlength="300">'),
    function(v){ return api(self ? 'insDependantRequest' : 'insMemberAdd', { member: v }); }, function(r){ if (r.warnings && r.warnings.indexOf('daughter_over_25') >= 0) toast(t('inDaughter')); again(); }, t('w2Save'));
  var ps = $('[name=policyId]', d), rel = $('[name=relation]', d);
  ps.onchange = function(){ $('[name=insClass]', d).innerHTML = clsOpts(ps.value); };
  rel.onchange = function(){ $('#inDep', d).hidden = rel.value === 'self'; };
  return d;
}
function insPolicyForm(p, again){
  p = p || { classes: [] };
  var lines = (p.classes || []).map(function(c){ return [c.code, c.nameAr, c.premiumEmployee != null ? c.premiumEmployee : '', c.premiumDependant != null ? c.premiumDependant : ''].join(', '); }).join('\n');
  formDrawer(p.id ? t('w2Edit') : t('inNewPolicy'), p.ref ? '<bdi>' + esc(p.ref) + '</bdi>' : '', two(fld(t('inInsurer'), '<input name="insurer" maxlength="120" required value="' + esc(p.insurer || '') + '">'), fld(t('inPolicyNo'), '<input name="policyNo" dir="ltr" maxlength="60" required value="' + esc(p.policyNo || '') + '">')) +
    two(fld(t('w2From'), '<input name="fromDate" type="date" required value="' + esc(p.fromDate || '') + '">'), fld(t('w2To'), '<input name="toDate" type="date" required value="' + esc(p.toDate || '') + '">')) +
    fld(t('inClasses'), '<textarea name="classes" rows="4" required dir="auto">' + esc(lines) + '</textarea>', t('inClassHint')) + (p.id ? fld(t('w2Status'), '<select name="status">' + keyOpts(['active', 'expired'], 'ips_', p.status) + '</select>') : '') + fld(t('w2Note'), '<input name="note" maxlength="300" value="' + esc(p.note || '') + '">'),
    function(v){
      var cls = v.classes.split(/\n+/).map(function(l){ return l.split(/[,،]/).map(function(s){ return s.trim(); }); }).filter(function(a){ return a[0]; }).map(function(a){ return { code: a[0], nameAr: a[1] || a[0], premiumEmployee: a[2] || 0, premiumDependant: a[3] || 0 }; });
      return api('insPolicySave', { policy: { id: p.id || '', insurer: v.insurer, policyNo: v.policyNo, fromDate: v.fromDate, toDate: v.toDate, classes: cls, status: v.status, note: v.note } });
    }, again, t('w2Save'));
}
function insSection(body){
  var box = head(body, 'inTitle', 'inLead'), tab = S.inTab || 'coverage';
  function load(){
    busy(box);
    Promise.all([api('insList', {}, true), api('insPolicyList', {}, true)]).then(function(rs){
      if (!box.isConnected) return;
      var r = rs[0], pl = rs[1];
      if (!r.ok) return box.innerHTML = bad(r.error);
      var pols = pl.ok ? pl.rows : [], hr = isHr();
      var pendingMoves = r.moves.filter(function(x){ return x.status === 'requested' || x.status === 'submitted'; }).length;
      var h = tiles([[t('inUncovered'), '<span class="db-status">' + (r.uncoveredNonSaudi ? ph('warning-circle') + ' ' : '') + r.uncoveredNonSaudi + '</span>', '', true], [t('inMembers'), n(r.rows.filter(function(m){ return m.status === 'active' || m.status === 'pending_delete'; }).length)],
        [t('inMoves'), n(pendingMoves)], [t('inPolicies'), n(pols.filter(function(p){ return p.status === 'active'; }).length)]]);
      var tabsL = [['coverage', 'users-three', 'inCoverage'], ['moves', 'arrows-left-right', 'inMoves'], ['policies', 'file-text', 'inPolicies']];
      if (salaryOk() || R().executive) tabsL.push(['cost', 'money', 'inCost']);
      h += tabsBar(tab, tabsL) + '<div id="inT"></div>';
      box.innerHTML = h; wire(box);
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.inTab = b.dataset.tab; load(); }; });
      var el = $('#inT', box);
      if (tab === 'coverage') {
        var byEmp = {}; r.rows.forEach(function(m){ (byEmp[m.emp ? m.emp.id : ''] = byEmp[m.emp ? m.emp.id : ''] || []).push(m); });
        var cov = r.coverage.slice().sort(function(a, b){ return (a.covered - b.covered) || (a.isSaudi - b.isSaudi); });
        el.innerHTML = (hr && pols.length ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="inAdd">' + ph('plus') + t('inAddMember') + '</button></div>' : '') +
          (cov.length ? '<div class="list">' + cov.map(function(c, i){ var ms = (byEmp[c.emp.id] || []).filter(function(m){ return m.status !== 'deleted' && m.status !== 'rejected'; });
            return '<div class="row w2-row">' + av(c.emp) + '<div class="main"><b>' + empLine(c.emp) + (c.isSaudi ? '' : sep() + ph('globe-hemisphere-east')) + '</b><small>' + (ms.length ? ms.map(function(m){ return esc(m.name) + ' (' + t('inr_' + m.relation) + sep() + esc(m.insClass) + (m.memberNo ? sep() + '<bdi>' + esc(m.memberNo) + '</bdi>' : '') + ')'; }).join('، ') : '-') + '</small>' +
              '</div>' + chip(c.covered ? t('inCovered') : c.pending ? t('inPendingAdd') : t('inNotCovered'), c.covered ? 'in' : c.pending ? 'late' : (c.isSaudi ? 'off' : 'absent')) +
              (hr ? ' <button type="button" class="btn btn-line btn-sm" data-mem="' + i + '" aria-label="' + t('w2Details') + '">' + ph('list-magnifying-glass') + '</button>' : '') + '</div>'; }).join('') + '</div>' : empty('first-aid', t('w2None')));
        var ab = $('#inAdd', el); if (ab) ab.onclick = function(){ people(function(P){ insMemberForm(pols, P, false, load); }); };
        $$('[data-mem]', el).forEach(function(b){ b.onclick = function(){ var c = cov[b.dataset.mem], ms = (byEmp[c.emp.id] || []);
          var d = drawer('<h3>' + empLine(c.emp) + '</h3>' + (ms.length ? '<div class="list">' + ms.map(function(m, k){ return '<div class="row"><div class="main"><b>' + esc(m.name) + sep() + t('inr_' + m.relation) + '</b><small>' + esc(m.insurer) + sep() + t('inClass') + ' ' + esc(m.insClass) +
            (m.memberNo ? sep() + '<bdi>' + esc(m.memberNo) + '</bdi>' : '') + (m.idNo ? sep() + '<bdi>' + esc(m.idNo) + '</bdi>' : '') + (m.birthDate ? sep() + fmt(m.birthDate) : '') + (m.premium != null ? sep() + money(m.premium) : '') + '</small></div>' + chip(t('ims_' + m.status), IMS_CLS[m.status]) +
            (m.status === 'active' ? ' <button type="button" class="btn btn-line btn-sm" data-del="' + k + '">' + t('inDelete') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('w2None') + '</p>') +
            (pols.length ? '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="inAdd2">' + ph('plus') + t('inAddMember') + '</button></div>' : ''));
          var a2 = $('#inAdd2', d); if (a2) a2.onclick = function(){ d.remove(); people(function(P){ insMemberForm(pols, P, false, load, c.emp.id); }); };
          $$('[data-del]', d).forEach(function(x){ x.onclick = function(){ var m = ms[x.dataset.del], td = riyadhToday(); d.remove();
            formDrawer(t('inDelete'), esc(m.name), fld(t('inEffective'), '<input name="effective" type="date" value="' + td + '">') + fld(t('w2NoteReq'), '<input name="note" maxlength="300" required>'),
              function(v){ return api('insMemberDelete', { memberId: m.id, effective: v.effective, note: v.note }); }, load); }; });
        }; });
      } else if (tab === 'moves') {
        el.innerHTML = r.moves.length ? '<div class="list">' + r.moves.map(insMoveRow).join('') + '</div>' : empty('arrows-left-right', t('w2None'));
        $$('[data-sub]', el).forEach(function(b){ b.onclick = function(){ var x = r.moves[b.dataset.sub];
          formDrawer(t('inSubmit'), esc(x.ref), fld(t('inInsurerRef'), '<input name="insurerRef" dir="ltr" maxlength="60">'), function(v){ return api('insMoveStep', { id: x.id, step: 'submit', insurerRef: v.insurerRef }); }, load); }; });
        $$('[data-cf]', el).forEach(function(b){ b.onclick = function(){ var x = r.moves[b.dataset.cf];
          formDrawer(t('inConfirm'), esc(x.ref) + sep() + t('imk_' + x.kind), (x.kind === 'add' ? fld(t('inMemberNo'), '<input name="memberNo" dir="ltr" maxlength="40" required>') : '') + fld(t('inInsurerRef'), '<input name="insurerRef" dir="ltr" maxlength="60" value="' + esc(x.insurerRef || '') + '"' + (x.kind === 'add' ? '' : ' required') + '>'),
            function(v){ return api('insMoveStep', { id: x.id, step: 'confirm', memberNo: v.memberNo, insurerRef: v.insurerRef }); }, load); }; });
        $$('[data-rj]', el).forEach(function(b){ b.onclick = function(){ var x = r.moves[b.dataset.rj]; noteDrawer(t('w2Reject'), esc(x.ref), function(note){ return api('insMoveStep', { id: x.id, step: 'reject', note: note }); }, load); }; });
      } else if (tab === 'policies') {
        el.innerHTML = (hr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="inNp">' + ph('plus') + t('inNewPolicy') + '</button></div>' : '') +
          (pols.length ? '<div class="list">' + pols.map(function(p, i){ return '<div class="row w2-row">' + av(null, 'file-text') + '<div class="main"><b>' + esc(p.insurer) + sep() + '<bdi>' + esc(p.policyNo) + '</bdi></b><small><bdi>' + esc(p.ref) + '</bdi>' + sep() + fmt(p.fromDate) + ' - ' + fmt(p.toDate) +
            sep() + t('inMembers') + ' ' + (p.members || 0) + (p.annualPremium != null ? sep() + t('inAnnual') + ' ' + money(p.annualPremium) : '') + '</small><small>' + p.classes.map(function(c){ return esc(c.code) + (c.premiumEmployee != null ? ' ' + money(c.premiumEmployee) + ' / ' + money(c.premiumDependant) : '') + (p.byClass && p.byClass[c.code] ? ' (' + p.byClass[c.code] + ')' : ''); }).join(' · ') + '</small></div>' +
            chip(t('ips_' + p.status), p.status === 'active' ? 'in' : 'off') + (hr ? ' <button type="button" class="btn btn-line btn-sm" data-pe="' + i + '" aria-label="' + t('w2Edit') + '">' + ph('pencil-simple') + '</button>' : '') + '</div>'; }).join('') + '</div>' : empty('file-text', t('w2None')));
        var np = $('#inNp', el); if (np) np.onclick = function(){ insPolicyForm(null, load); };
        $$('[data-pe]', el).forEach(function(b){ b.onclick = function(){ insPolicyForm(pols[b.dataset.pe], load); }; });
      } else {
        busy(el);
        api('insCost', {}, true).then(function(c){
          if (!el.isConnected) return;
          if (!c.ok) return el.innerHTML = bad(c.error);
          var tbl = function(rows, key, label){ return '<div class="w2-mx"><table><thead><tr><th>' + label + '</th><th>' + t('inMembers') + '</th><th>' + t('inAnnual') + '</th><th>' + t('inMonth') + '</th></tr></thead><tbody>' +
            rows.map(function(x){ return '<tr><td>' + esc(x[key]) + '</td><td class="num">' + x.members + '</td><td>' + money(x.annual) + '</td><td>' + money(x.month) + '</td></tr>'; }).join('') + '</tbody></table></div>'; };
          el.innerHTML = tiles([[t('inMembers'), n(c.totals.members)], [t('inAnnual'), money(c.totals.annual)], [t('inMonth') + ' ' + monthOf(c.month), money(c.totals.month)]]) +
            '<h4>' + t('inByDept') + '</h4>' + tbl(c.byDepartment, 'department', t('w2Dept')) + '<h4>' + t('inByClass') + '</h4>' + tbl(c.byClass, 'insClass', t('inClass'));
          wire(el);
        });
      }
    });
  }
  load();
}
function myInsCard(el){
  apiFresh('myInsurance', {}, function(r){
    if (!el.isConnected || !r.ok) return;
    if (!r.members.length && !r.activePolicies.length) return;
    var d = el.querySelector('[data-w2=ins]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'ins';
    var live = r.members.filter(function(m){ return m.status !== 'deleted' && m.status !== 'rejected'; }), self = live.some(function(m){ return m.relation === 'self'; });
    var h = '<h3><span class="ic">' + ph('first-aid') + '</span>' + t('inMy') + '<span class="sp"></span>' + (self ? '<button type="button" class="btn btn-line btn-sm" data-ask="1">' + ph('plus') + t('inAddDep') + '</button>' : '') + '</h3>';
    h += live.length ? live.map(function(m){ return '<div class="row"><div class="main"><b>' + esc(m.name) + sep() + t('inr_' + m.relation) + '</b><small>' + esc(m.insurer) + sep() + t('inClass') + ' ' + esc(m.insClass) + (m.memberNo ? sep() + '<bdi>' + esc(m.memberNo) + '</bdi>' : '') + '</small></div>' + chip(t('ims_' + m.status), IMS_CLS[m.status]) + '</div>'; }).join('') : '<p class="hr-hint">' + t('inMyNone') + '</p>';
    var open = r.moves.filter(function(x){ return x.status === 'requested' || x.status === 'submitted'; });
    if (open.length) h += open.map(function(x){ return '<div class="row"><div class="main"><b>' + t('imk_' + x.kind) + sep() + esc(x.member) + '</b><small><bdi>' + esc(x.ref) + '</bdi></small></div>' + chip(t('imv_' + x.status), IMV_CLS[x.status]) + '</div>'; }).join('');
    d.innerHTML = h; if (!d.isConnected) el.appendChild(d);
    var ask = $('[data-ask]', d); if (ask) ask.onclick = function(){
      var pols = r.activePolicies.filter(function(p){ return live.some(function(m){ return m.relation === 'self' && m.policyId === p.id; }); }).map(function(p){ return { id: p.id, insurer: p.insurer, status: 'active', classes: p.classes.map(function(c){ return { code: c }; }) }; });
      insMemberForm(pols, { rows: [] }, true, function(){ myInsCard(el); });
    };
  }, true);
}

// =================================================================== TRAINING
var TRN_CATS = ['mandatory', 'safety', 'technical', 'soft_skills', 'compliance', 'leadership', 'other'];
var TSS_CLS = { planned: 'late', open: 'in', done: 'off', cancelled: 'off' };
var TES_CLS = { requested: 'late', enrolled: 'in', attended: 'in', passed: 'in', failed: 'absent', no_show: 'absent', rejected: 'off', cancelled: 'off' };
var TCS_CLS = { valid: 'in', expiring: 'late', expired: 'absent', missing: 'absent' };
function courseName(x){ return esc(lang(x.course || x.titleAr, x.courseEn || x.titleEn)); }
function courseForm(c, P, again){
  c = c || { category: 'safety', mandatory: {} };
  var m = c.mandatory || {};
  formDrawer(c.id ? t('w2Edit') : t('trNewCourse'), c.code ? '<bdi>' + esc(c.code) + '</bdi>' : '', two(fld(t('anTitleAr'), '<input name="titleAr" maxlength="150" required value="' + esc(c.titleAr || '') + '">'), fld(t('anTitleEn'), '<input name="titleEn" maxlength="150" dir="ltr" value="' + esc(c.titleEn || '') + '">')) +
    two(fld(t('trCat'), '<select name="category">' + keyOpts(TRN_CATS, 'trc_', c.category) + '</select>'), fld(t('trProvider'), '<input name="provider" maxlength="120" value="' + esc(c.provider || '') + '">')) +
    two(fld(t('trHours'), '<input name="hours" type="number" min="0" max="1000" step="0.5" value="' + (c.hours || 0) + '">'), fld(t('trValidity'), '<input name="validityMonths" type="number" min="0" max="120" value="' + (c.validityMonths || 0) + '">')) +
    (salaryOk() ? fld(t('trCost'), '<input name="costPerPerson" type="number" min="0" step="0.01" value="' + (c.costPerPerson || 0) + '">') : '') +
    '<h4>' + t('trMandatory') + '</h4>' + chk('mAll', t('trMandAll'), m.all) + fld(t('anDepts'), '<select name="departmentIds" multiple size="4">' + mopts(deptOpts(P), m.departmentIds) + '</select>', t('w2Ctrl')) +
    fld(t('anPositions'), '<select name="positionIds" multiple size="4">' + mopts(posOpts(P), m.positionIds) + '</select>') + (c.id ? chk('inactive', t('trInactive'), c.status === 'inactive') : ''),
    function(v){ return api('courseSave', { course: { id: c.id || '', titleAr: v.titleAr, titleEn: v.titleEn, category: v.category, provider: v.provider, hours: v.hours, validityMonths: v.validityMonths,
      costPerPerson: v.costPerPerson, status: v.inactive ? 'inactive' : 'active', mandatory: { all: v.mAll, departmentIds: v.departmentIds, positionIds: v.positionIds } } }); }, again, t('w2Save'));
}
function sessionForm(s, courses, again){
  s = s || { status: 'open', capacity: 15 };
  formDrawer(s.id ? t('w2Edit') : t('trNewSession'), s.ref ? '<bdi>' + esc(s.ref) + '</bdi>' : '', (s.id ? '' : fld(t('trCourse'), '<select name="courseId" required>' + opts(courses.filter(function(c){ return c.status === 'active'; }).map(function(c){ return [c.id, c.code + ' ' + lang(c.titleAr, c.titleEn)]; }), '', '-') + '</select>')) +
    two(fld(t('w2From'), '<input name="fromDate" type="date" required value="' + esc(s.fromDate || '') + '">'), fld(t('w2To'), '<input name="toDate" type="date" value="' + esc(s.toDate || '') + '">')) +
    two(fld(t('trLocation'), '<input name="location" maxlength="150" value="' + esc(s.location || '') + '">'), fld(t('trTrainer'), '<input name="trainer" maxlength="120" value="' + esc(s.trainer || '') + '">')) +
    two(fld(t('trCapacity'), '<input name="capacity" type="number" min="1" max="500" value="' + (s.capacity || 15) + '">'), fld(t('w2Status'), '<select name="status">' + keyOpts(['planned', 'open', 'done', 'cancelled'], 'tss_', s.status) + '</select>')) +
    (salaryOk() ? fld(t('trCost'), '<input name="cost" type="number" min="0" step="0.01" value="' + (s.cost || 0) + '">') : '') + fld(t('w2Note'), '<input name="note" maxlength="500" value="' + esc(s.note || '') + '">'),
    function(v){ v.id = s.id || ''; return api('trainSessionSave', { session: v }); }, again, t('w2Save'));
}
function sessionDrawer(s, again){
  api('trainSessionList', { sessionId: s.id }, true).then(function(r){
    var en = r.ok && r.enrolments ? r.enrolments : [];
    var d = drawer('<h3>' + courseName(s) + '</h3><p class="hr-hint"><bdi>' + esc(s.ref) + '</bdi>' + sep() + fmt(s.fromDate) + (s.toDate !== s.fromDate ? ' - ' + fmt(s.toDate) : '') + sep() + t('tss_' + s.status) + sep() + t('trSeatsLeft') + ' ' + s.left + '/' + s.capacity + '</p>' +
      '<div class="btnrow">' + (s.status !== 'done' && s.status !== 'cancelled' ? '<button type="button" class="btn btn-dark btn-sm" id="trEn">' + ph('user-plus') + t('trEnrol') + '</button>' : '') + '<button type="button" class="btn btn-line btn-sm" id="trEd">' + ph('pencil-simple') + t('w2Edit') + '</button></div>' +
      '<h4>' + t('trEnrolled') + ' (' + en.length + ')</h4>' + (en.length ? '<div class="list">' + en.map(function(x, i){
        return '<div class="row"><div class="main"><b>' + empLine(x.emp) + '</b><small>' + (x.score != null ? t('trScore') + ' ' + x.score + sep() : '') + (x.certNo ? '<bdi>' + esc(x.certNo) + '</bdi>' + (x.expiresOn ? sep() + t('trExpires') + ' ' + fmt(x.expiresOn) : '') : '') + (x.note ? sep() + esc(x.note) : '') + '</small></div>' + chip(t('tes_' + x.status), TES_CLS[x.status]) +
          (x.status === 'requested' ? ' <button type="button" class="btn btn-dark btn-sm" data-ta="' + i + '">' + t('w2Approve') + '</button> <button type="button" class="btn btn-line btn-sm" data-tr="' + i + '">' + t('w2Reject') + '</button>' :
            ['enrolled', 'attended', 'passed', 'failed', 'no_show'].indexOf(x.status) >= 0 && s.fromDate <= riyadhToday() ? ' <button type="button" class="btn btn-line btn-sm" data-tm="' + i + '">' + t('trMark') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('w2None') + '</p>') + '<p class="hr-bad" id="trE" role="alert"></p>');
    var reopen = function(){ again(); };
    $('#trEd', d).onclick = function(){ d.remove(); sessionForm(s, [], again); };
    var eb = $('#trEn', d); if (eb) eb.onclick = function(){ d.remove(); people(function(P){
      var taken = {}; en.forEach(function(x){ if (x.emp && ['cancelled', 'rejected'].indexOf(x.status) < 0) taken[x.emp.id] = 1; });
      formDrawer(t('trEnrol'), courseName(s) + sep() + t('trSeatsLeft') + ' ' + s.left, fld(t('anPeople'), '<select name="empIds" multiple size="10" required>' + mopts(P.rows.filter(function(p){ return !taken[p.id]; }).map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), []) + '</select>', t('w2Ctrl')),
        function(v){ return api('trainEnrol', { sessionId: s.id, empIds: v.empIds }); }, reopen); }); };
    $$('[data-ta]', d).forEach(function(b){ confirmTap(b, function(){ api('trainDecide', { id: en[b.dataset.ta].id, decision: 'approve' }).then(function(y){ if (!y.ok) return $('#trE', d).textContent = errText(y.error); d.remove(); toast(t('w2Saved')); refreshTasks(); again(); }); }); });
    $$('[data-tr]', d).forEach(function(b){ b.onclick = function(){ var x = en[b.dataset.tr]; d.remove(); noteDrawer(t('w2Reject'), empLine(x.emp), function(note){ return api('trainDecide', { id: x.id, decision: 'reject', note: note }); }, reopen); }; });
    $$('[data-tm]', d).forEach(function(b){ b.onclick = function(){ var x = en[b.dataset.tm]; d.remove();
      formDrawer(t('trMark'), empLine(x.emp) + sep() + courseName(s), two(fld(t('w2Status'), '<select name="status">' + keyOpts(['passed', 'attended', 'failed', 'no_show'], 'tes_', x.status === 'enrolled' ? 'passed' : x.status) + '</select>'), fld(t('trScore'), '<input name="score" type="number" min="0" max="100" value="' + (x.score != null ? x.score : '') + '">')) +
        two(fld(t('trCertNo'), '<input name="certNo" dir="ltr" maxlength="60" value="' + esc(x.certNo || '') + '">'), fld(t('trIssued'), '<input name="issuedOn" type="date" value="' + esc(x.issuedOn || s.toDate || '') + '">')) + fld(t('trResult'), '<input name="result" maxlength="200" value="' + esc(x.result || '') + '">'),
        function(v){ v.id = x.id; return api('trainMark', v); }, reopen); }; });
  });
}
function trainingSection(body){
  var box = head(body, 'trTitle', 'trLead'), tab = S.trTab || 'sessions', hr = isHr();
  function load(){
    busy(box);
    Promise.all([api('trainSessionList', {}, true), api('courseList', { all: hr ? 1 : 0 }, true)]).then(function(rs){
      if (!box.isConnected) return;
      var ss = rs[0], cs = rs[1];
      if (!ss.ok) return box.innerHTML = bad(ss.error);
      var courses = cs.ok ? cs.rows : [];
      var h = tabsBar(tab, [['sessions', 'calendar-blank', 'trSessions'], ['catalogue', 'books', 'trCatalogue'], ['matrix', 'grid-four', 'trMatrix']]) + '<div id="trT"></div>';
      box.innerHTML = h;
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.trTab = b.dataset.tab; load(); }; });
      var el = $('#trT', box);
      if (tab === 'sessions') {
        el.innerHTML = (hr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="trRc">' + ph('certificate') + t('trRecord') + '</button> <button type="button" class="btn btn-dark btn-sm" id="trNs">' + ph('plus') + t('trNewSession') + '</button></div>' : '') +
          (ss.rows.length ? '<div class="list">' + ss.rows.map(function(s, i){ return '<div class="row w2-row"' + (hr ? ' data-ss="' + i + '" style="cursor:pointer"' : '') + '>' + av(null, 'chalkboard-teacher') + '<div class="main"><b>' + courseName(s) + '</b><small><bdi>' + esc(s.ref) + '</bdi>' + sep() + fmt(s.fromDate) +
            (s.toDate !== s.fromDate ? ' - ' + fmt(s.toDate) : '') + (s.location ? sep() + esc(s.location) : '') + (s.trainer ? sep() + esc(s.trainer) : '') + sep() + t('trSeatsLeft') + ' ' + s.left + '/' + s.capacity + (s.cost != null && s.cost ? sep() + money(s.cost) : '') + '</small></div>' + chip(t('tss_' + s.status), TSS_CLS[s.status]) + '</div>'; }).join('') + '</div>' : empty('chalkboard-teacher', t('w2None')));
        var nb = $('#trNs', el); if (nb) nb.onclick = function(){ sessionForm(null, courses, load); };
        var rb = $('#trRc', el); if (rb) rb.onclick = function(){ people(function(P){ var td = riyadhToday();
          formDrawer(t('trRecord'), '', fld(t('w2Employee'), '<select name="empId" required>' + empOpts(P.rows, '', '-') + '</select>') + two(fld(t('trCourse'), '<select name="courseId">' + opts(courses.map(function(c){ return [c.id, c.code + ' ' + lang(c.titleAr, c.titleEn)]; }), '', '-') + '</select>'), fld(t('trCertTitle'), '<input name="title" maxlength="150">')) +
            two(fld(t('trCertNo'), '<input name="certNo" dir="ltr" maxlength="60">'), fld(t('trProvider'), '<input name="provider" maxlength="120">')) + two(fld(t('trIssued'), '<input name="issuedOn" type="date" max="' + td + '" required>'), fld(t('trExpires'), '<input name="expiresOn" type="date">')) +
            two(fld(t('trHours'), '<input name="hours" type="number" min="0" step="0.5">'), salaryOk() ? fld(t('trCost'), '<input name="cost" type="number" min="0" step="0.01">') : '') + fld(t('w2Note'), '<input name="note" maxlength="300">'),
            function(v){ return api('certRecord', { cert: v }); }, load, t('w2Save')); }); };
        $$('[data-ss]', el).forEach(function(b){ b.onclick = function(){ sessionDrawer(ss.rows[b.dataset.ss], load); }; });
      } else if (tab === 'catalogue') {
        el.innerHTML = (hr ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="trNc">' + ph('plus') + t('trNewCourse') + '</button></div>' : '') +
          (courses.length ? '<div class="list">' + courses.map(function(c, i){ var m = c.mandatory || {};
            return '<div class="row w2-row">' + av(null, 'book-open') + '<div class="main"><b>' + esc(lang(c.titleAr, c.titleEn)) + '</b><small><bdi>' + esc(c.code) + '</bdi>' + sep() + t('trc_' + c.category) + sep() + c.hours + ' ' + t('trHours') +
              (c.validityMonths ? sep() + t('trValidity') + ' ' + c.validityMonths : '') + (c.provider ? sep() + esc(c.provider) : '') + (c.costPerPerson != null ? sep() + money(c.costPerPerson) : '') + '</small>' +
              (m.all || (m.departmentIds || []).length || (m.positionIds || []).length ? '<small>' + ph('asterisk') + ' ' + t('trMandatory') + ' ' + (m.all ? t('trMandAll') : ((m.departmentIds || []).length + (m.positionIds || []).length) + '') + '</small>' : '') + '</div>' +
              (c.status === 'inactive' ? chip(t('trInactive'), 'off') : '') + (hr ? ' <button type="button" class="btn btn-line btn-sm" data-ce="' + i + '" aria-label="' + t('w2Edit') + '">' + ph('pencil-simple') + '</button>' : '') + '</div>'; }).join('') + '</div>' : empty('books', t('w2None')));
        var nc = $('#trNc', el); if (nc) nc.onclick = function(){ people(function(P){ courseForm(null, P, load); }); };
        $$('[data-ce]', el).forEach(function(b){ b.onclick = function(){ people(function(P){ courseForm(courses[b.dataset.ce], P, load); }); }; });
      } else {
        busy(el);
        api('trainMatrix', {}, true).then(function(m){
          if (!el.isConnected) return;
          if (!m.ok) return el.innerHTML = bad(m.error);
          var cols = m.totals;
          var tot = { valid: 0, expiring: 0, expired: 0, missing: 0 }; cols.forEach(function(c){ ['valid', 'expiring', 'expired', 'missing'].forEach(function(k){ tot[k] += c[k]; }); });
          var h2 = tiles([[t('tcs_missing'), '<span class="db-status">' + (tot.missing ? ph('warning-circle') + ' ' : '') + tot.missing + '</span>', '', true], [t('tcs_expired'), n(tot.expired)], [t('tcs_expiring'), n(tot.expiring)], [t('tcs_valid'), n(tot.valid)]]);
          h2 += m.rows.length ? '<div class="w2-mx"><table><thead><tr><th>' + t('w2Employee') + '</th>' + cols.map(function(c){ return '<th title="' + esc(c.titleAr) + '"><bdi>' + esc(c.code) + '</bdi></th>'; }).join('') + '<th>' + t('trHours') + '</th>' + (m.rows[0] && m.rows[0].cost != null ? '<th>' + t('trCostYear') + '</th>' : '') + '</tr></thead><tbody>' +
            m.rows.map(function(r){ var by = {}; r.courses.forEach(function(c){ by[c.courseId] = c; });
              return '<tr><td>' + empLine(r.emp) + '</td>' + cols.map(function(c){ var x = by[c.courseId]; return '<td>' + (x ? '<span class="w2-dot ' + x.state + '" title="' + t('tcs_' + x.state) + (x.expiresOn ? ' ' + fmt(x.expiresOn) : '') + '"></span>' : '') + '</td>'; }).join('') +
                '<td class="num">' + r.hours + '</td>' + (r.cost != null ? '<td>' + money(r.cost) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' : empty('grid-four', t('w2None'));
          el.innerHTML = h2; wire(el);
        });
      }
    });
  }
  load();
}
function myTrainingCard(el){
  apiFresh('myTraining', {}, function(r){
    if (!el.isConnected || !r.ok) return;
    api('trainSessionList', {}, true).then(function(ss){
      if (!el.isConnected) return;
      var open = ss.ok ? ss.rows.filter(function(s){ return s.status === 'open' && !s.mine && s.left > 0; }) : [];
      if (!r.rows.length && !r.missing.length && !open.length) return;
      var d = el.querySelector('[data-w2=trn]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'trn';
      var h = '<h3><span class="ic">' + ph('graduation-cap') + '</span>' + t('trMy') + '<span class="sp"></span><small>' + t('trHoursYear') + ' <b class="num">' + r.hoursThisYear + '</b></small></h3>';
      if (r.missing.length) h += '<p class="w2-flag">' + ph('warning') + t('trMissing') + ': ' + r.missing.map(function(m){ return esc(lang(m.titleAr, m.titleEn)); }).join('، ') + '</p>';
      h += r.certificates.slice(0, 6).map(function(x){ return '<div class="row"><div class="main"><b>' + courseName(x) + '</b><small><bdi>' + esc(x.certNo) + '</bdi>' + (x.issuedOn ? sep() + fmt(x.issuedOn) : '') + (x.expiresOn ? sep() + t('trExpires') + ' ' + fmt(x.expiresOn) : '') + '</small></div>' + (x.certState ? chip(t('tcs_' + x.certState), TCS_CLS[x.certState]) : '') + '</div>'; }).join('');
      h += r.rows.filter(function(x){ return !x.certNo && ['requested', 'enrolled'].indexOf(x.status) >= 0; }).map(function(x){ return '<div class="row"><div class="main"><b>' + courseName(x) + '</b><small>' + fmt(x.fromDate) + '</small></div>' + chip(t('tes_' + x.status), TES_CLS[x.status]) + '</div>'; }).join('');
      if (open.length) h += '<h4>' + t('trOpen') + '</h4>' + open.slice(0, 5).map(function(s, i){ return '<div class="row"><div class="main"><b>' + courseName(s) + '</b><small>' + fmt(s.fromDate) + (s.location ? sep() + esc(s.location) : '') + sep() + t('trSeatsLeft') + ' ' + s.left + '</small></div><button type="button" class="btn btn-line btn-sm" data-rq="' + i + '">' + t('trRequest') + '</button></div>'; }).join('');
      d.innerHTML = h; if (!d.isConnected) el.appendChild(d);
      $$('[data-rq]', d).forEach(function(b){ b.onclick = function(){ var s = open[b.dataset.rq];
        formDrawer(t('trRequest'), courseName(s) + sep() + fmt(s.fromDate), fld(t('w2Note'), '<input name="note" maxlength="300">'), function(v){ return api('trainRequest', { sessionId: s.id, note: v.note }); }, function(){ myTrainingCard(el); }); }; });
    });
  }, true);
}

// =================================================================== RECRUITMENT
var RQ_CLS = { pending: 'late', approved: 'in', rejected: 'absent', filled: 'off', closed: 'off', cancelled: 'off' };
var RC_CLS = { applied: 'late', screening: 'late', interview: 'late', offer: 'in', hired: 'in', rejected: 'absent', withdrawn: 'off', erased: 'off' };
var RO_CLS = { draft: 'late', pending: 'late', approved: 'in', rejected: 'absent', sent: 'late', accepted: 'in', declined: 'absent', expired: 'absent', withdrawn: 'off', hired: 'in' };
var RC_SOURCES = ['referral', 'linkedin', 'jadarat', 'bayt', 'website', 'agency', 'walk_in', 'internal', 'other'];
function reqForm(q, P, again){
  q = q || { headcount: 1, employmentType: 'full_time', contractType: 'indefinite', reason: 'new' };
  var d = formDrawer(q.id ? t('w2Edit') : t('rcNewReq'), q.ref ? '<bdi>' + esc(q.ref) + '</bdi>' : '', two(fld(t('rcJob'), '<input name="titleAr" maxlength="120" required value="' + esc(q.titleAr || '') + '">'), fld(t('rcJobEn'), '<input name="titleEn" maxlength="120" dir="ltr" value="' + esc(q.titleEn || '') + '">')) +
    (P.depts.length ? two(fld(t('w2Dept'), '<select name="departmentId">' + opts(deptOpts(P), q.departmentId, '-') + '</select>'), fld(t('w2Position'), '<select name="positionId">' + opts(posOpts(P), q.positionId, '-') + '</select>')) : '') +
    (P.rows.length ? fld(t('rcMgr'), '<select name="hiringManagerId">' + empOpts(P.rows, q.hiringManager ? q.hiringManager.id : (S.me && S.me.id), '-') + '</select>') : '') +
    two(fld(t('rcHead'), '<input name="headcount" type="number" min="1" max="100" value="' + (q.headcount || 1) + '">'), fld(t('rcReason'), '<select name="reason">' + keyOpts(['new', 'replacement', 'temporary', 'growth'], 'rqr_', q.reason) + '</select>')) +
    (P.rows.length ? '<div id="rqRep"' + (q.reason === 'replacement' ? '' : ' hidden') + '>' + fld(t('rcReplaces'), '<select name="replacesEmpId">' + empOpts(P.rows, q.replacesEmpId, '-') + '</select>') + '</div>' : '') +
    two(fld(t('rcEmpType'), '<select name="employmentType">' + keyOpts(['full_time', 'part_time', 'temporary', 'internship'], 'rqe_', q.employmentType) + '</select>'), fld(t('rcContract'), '<select name="contractType">' + keyOpts(['indefinite', 'fixed'], 'rqc_', q.contractType) + '</select>')) +
    (salaryOk() || R().executive ? two(fld(t('rcBudget') + ' ' + t('rcBudgetMin'), '<input name="budgetMin" type="number" min="0" step="1" value="' + (q.budgetMin || '') + '">'), fld(t('rcBudgetMax'), '<input name="budgetMax" type="number" min="0" step="1" value="' + (q.budgetMax || '') + '">')) : '') +
    fld(t('rcTarget'), '<input name="targetDate" type="date" value="' + esc(q.targetDate || '') + '">') + chk('saudiOnly', t('rcSaudiOnly'), q.saudiOnly) + fld(t('rcJustify'), '<textarea name="justification" rows="3" maxlength="1000">' + esc(q.justification || '') + '</textarea>'),
    function(v){ v.id = q.id || ''; return api('recruitReqSave', { requisition: v }); }, again, t('w2Save'));
  var rs = $('[name=reason]', d), rep = $('#rqRep', d); if (rep) rs.onchange = function(){ rep.hidden = rs.value !== 'replacement'; };
}
function candForm(q, c, P, again){
  c = c || { source: 'other' };
  formDrawer(c.id ? t('w2Edit') : t('rcAddCand'), esc(lang(q.titleAr, q.titleEn)) + ' <bdi>' + esc(q.ref) + '</bdi>' + (q.saudiOnly ? sep() + t('rcSaudiOnly') : ''),
    two(fld(t('inName'), '<input name="name" maxlength="100" required value="' + esc(c.name || '') + '">'), fld(t('inNameEn'), '<input name="nameEn" maxlength="100" dir="ltr" value="' + esc(c.nameEn || '') + '">')) +
    two(fld(t('rcPhone'), '<input name="phone" type="tel" dir="ltr" maxlength="30" value="' + esc(c.phone || '') + '">'), fld(t('rcEmail'), '<input name="email" type="email" dir="ltr" maxlength="120" value="' + esc(c.email || '') + '">')) +
    two(fld(t('rcNat'), '<input name="nationality" maxlength="40" value="' + esc(c.nationality || '') + '">'), fld(t('inGender'), '<select name="gender">' + opts([['male', t('inMale')], ['female', t('inFemale')]], c.gender, '-') + '</select>')) +
    two(fld(t('rcSource'), '<select name="source">' + keyOpts(RC_SOURCES, 'rcsrc_', c.source) + '</select>'), P.rows.length ? fld(t('rcReferredBy'), '<select name="referredBy">' + empOpts(P.rows, c.referredBy ? c.referredBy.id : '', '-') + '</select>') : '') +
    two(fld(t('rcCurTitle'), '<input name="currentTitle" maxlength="100" value="' + esc(c.currentTitle || '') + '">'), fld(t('rcCurEmp'), '<input name="currentEmployer" maxlength="100" value="' + esc(c.currentEmployer || '') + '">')) +
    two(fld(t('rcYears'), '<input name="yearsExperience" type="number" min="0" max="60" value="' + (c.yearsExperience || 0) + '">'), fld(t('rcNotice'), '<input name="noticeDays" type="number" min="0" max="180" value="' + (c.noticeDays === '' || c.noticeDays == null ? '' : c.noticeDays) + '">')) +
    (salaryOk() ? fld(t('rcExpected'), '<input name="expectedSalary" type="number" min="0" step="1" value="' + (c.expectedSalary == null ? '' : c.expectedSalary) + '">') : '') +
    fld(t('rcCv'), '<input name="cvRef" maxlength="200" dir="ltr" value="' + esc(c.cvRef || '') + '">') + fld(t('w2Note'), '<textarea name="note" rows="2" maxlength="1000">' + esc(c.note || '') + '</textarea>') + (c.id ? '' : chk('consent', t('rcConsent'))),
    function(v){ v.id = c.id || ''; v.reqId = q.id; if (!v.expectedSalary && v.expectedSalary !== 0) delete v.expectedSalary; return api('recruitCandSave', { candidate: v }); }, again, t('w2Save'));
}
function offerForm(cand, q, o, again){
  o = o || {};
  var td = riyadhToday(), saudi = cand.isSaudi, ct = o.contractType || q.contractType || (saudi ? 'indefinite' : 'fixed');
  var d = formDrawer(o.id ? t('w2Edit') : t('rcOffer'), esc(cand.name) + sep() + esc(lang(q.titleAr, q.titleEn)) + (q.budgetMax ? sep() + t('rcBudget') + ' ' + money(q.budgetMin) + ' - ' + money(q.budgetMax) : ''),
    two(fld(t('rcStartDate'), '<input name="startDate" type="date" min="' + td + '" required value="' + esc(o.startDate || '') + '">'), fld(t('rcOfferExp'), '<input name="expiresOn" type="date" min="' + td + '" value="' + esc(o.expiresOn || '') + '">')) +
    two(fld(t('rcContract'), '<select name="contractType">' + keyOpts(['indefinite', 'fixed'], 'rqc_', ct) + '</select>'), fld(t('rcContractMonths'), '<input name="contractMonths" type="number" min="1" max="120" value="' + (o.contractMonths || 12) + '">')) +
    two(fld(t('rcProbation'), '<input name="probationDays" type="number" min="0" max="180" value="' + (o.probationDays != null ? o.probationDays : 90) + '">'), fld(t('rcLeave'), '<input name="annualLeaveDays" type="number" min="21" max="60" value="' + (o.annualLeaveDays || 21) + '">')) +
    two(fld(t('rcBasic'), '<input name="basic" type="number" min="1" step="0.01" required value="' + (o.basic || '') + '">'), fld(t('rcHousing'), '<input name="housing" type="number" min="0" step="0.01" value="' + (o.housing || 0) + '">')) +
    two(fld(t('rcTransport'), '<input name="transport" type="number" min="0" step="0.01" value="' + (o.transport || 0) + '">'), fld(t('rcNotice'), '<input name="noticeDays" type="number" min="0" max="180" value="' + (o.noticeDays || 30) + '">')) +
    two(fld(t('rcWorkLoc'), '<input name="workLocation" maxlength="100" value="' + esc(o.workLocation || '') + '">'), fld(t('rcDays'), '<input name="workDaysPerWeek" type="number" min="1" max="7" value="' + (o.workDaysPerWeek || 5) + '">')) +
    fld(t('rcDaily'), '<input name="dailyHours" type="number" min="1" max="12" step="0.5" value="' + (o.dailyHours || 8) + '">'),
    function(v){ v.id = o.id || ''; v.candidateId = cand.id; return api('recruitOfferSave', { offer: v }); }, again, t('w2Save'));
  return d;
}
function offerLetter(o){
  api('recruitOfferLetter', { id: o.id }, true).then(function(r){
    if (!r.ok) return toast(errText(r.error));
    var L = r.letter, lg = S.lang === 'en' ? 'en' : 'ar', T0 = T[lg], E = Doc.esc, m = function(x){ return Doc.money(x, lg) + ' ' + (lg === 'en' ? 'SAR' : 'ر.س'); };
    var row = function(k, v){ return v === '' || v == null ? '' : '<tr><th>' + E(k) + '</th><td>' + v + '</td></tr>'; };
    var body = '<p>' + E(lg === 'en' && L.candidate.nameEn ? L.candidate.nameEn : L.candidate.name) + '</p><p>' + E(T0.rcLetterIntro) + '</p>' +
      '<table class="kv">' + row(T0.rcJob, E(lg === 'en' && L.job.titleEn ? L.job.titleEn : L.job.titleAr)) + row(T0.w2Dept, E(lg === 'en' && L.job.departmentEn ? L.job.departmentEn : L.job.department)) +
      row(T0.rcStartDate, E(Doc.dates(L.terms.startDate, lg))) + row(T0.rcContract, E(T0['rqc_' + L.terms.contractType] || '') + (L.terms.contractType === 'fixed' ? ' (' + L.terms.contractMonths + ' ' + E(T0.w2Months) + ')' : '')) +
      row(T0.rcProbation, L.terms.probationDays) + row(T0.rcLeave, L.terms.annualLeaveDays) + row(T0.rcNotice, L.terms.noticeDays) + row(T0.rcDays, L.terms.workDaysPerWeek) + row(T0.rcDaily, L.terms.dailyHours) + row(T0.rcWorkLoc, E(L.job.workLocation || '')) +
      (L.pay ? row(T0.rcBasic, m(L.pay.basic)) + row(T0.rcHousing, m(L.pay.housing)) + row(T0.rcTransport, m(L.pay.transport)) + Object.keys(L.pay.other || {}).map(function(k){ return row(k, m(L.pay.other[k])); }).join('') +
        row(T0.rcTotal, '<b>' + m(L.pay.total) + '</b> ' + E(T0.rcPerMonth) + '<br><small>' + E(Doc.words(L.pay.total, lg)) + '</small>') : '') + row(T0.rcOfferExp, E(Doc.dates(L.terms.expiresOn, lg))) + '</table>';
    Doc.open({ lang: lg, kind: T0.rcLetterKind, title: T0.rcLetter, ref: L.ref, body: body, extraCss: 'table.kv{width:100%;border-collapse:collapse;margin:10px 0}table.kv th,table.kv td{padding:6px 8px;border-bottom:1px solid #E4E0D6;text-align:start;vertical-align:top}table.kv th{width:38%;font-weight:600}',
      qr: 'OFR|' + L.ref + '|' + L.date, by: S.me ? S.me.name : '', signatures: [E(T0.rcLetterHr), E(T0.rcLetterApprover) + (L.approvedBy ? ': ' + E(L.approvedBy.name) : ''), E(T0.rcLetterAccept)] });
  });
}
function candDrawer(id, again){
  api('recruitCandGet', { id: id }, true).then(function(r){
    if (!r.ok) return toast(errText(r.error));
    var c = r.candidate, q = r.requisition || {}, hr = isHr();
    var h = '<p class="hr-hint"><bdi>' + esc(c.ref) + '</bdi>' + sep() + esc(lang(q.titleAr, q.titleEn)) + ' <bdi>' + esc(q.ref || '') + '</bdi>' + sep() + t('rcs_' + c.stage) + (c.rating != null ? sep() + t('rcRating') + ' ' + c.rating + '/5' : '') + '</p>';
    h += '<div class="mf-kv">' + [[t('rcNat'), esc(c.nationality || '') + (c.isSaudi ? ' (' + t('rcSaudi') + ')' : '')], [t('rcSource'), t('rcsrc_' + (c.source || 'other'))], [t('rcCurTitle'), esc(c.currentTitle || '')], [t('rcCurEmp'), esc(c.currentEmployer || '')],
      [t('rcYears'), c.yearsExperience], [t('rcNotice'), c.noticeDays === '' ? '' : c.noticeDays], [t('rcPhone'), c.phone ? '<bdi>' + esc(c.phone) + '</bdi>' : ''], [t('rcEmail'), c.email ? '<bdi>' + esc(c.email) + '</bdi>' : ''],
      [t('rcExpected'), c.expectedSalary != null ? money(c.expectedSalary) : ''], [t('rcCv'), c.cvRef ? '<bdi>' + esc(c.cvRef) + '</bdi>' : ''], [t('rcPurge'), c.purgeAfter ? fmt(c.purgeAfter) : '']]
      .filter(function(x){ return x[1] !== '' && x[1] != null; }).map(function(x){ return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>';
    if (c.note) h += '<p class="w2-body">' + esc(c.note) + '</p>';
    if (hr && ['hired', 'erased'].indexOf(c.stage) < 0) h += '<div class="btnrow">' +
      (['applied', 'screening', 'interview'].indexOf(c.stage) >= 0 ? '<button type="button" class="btn btn-line btn-sm" id="rcIv">' + ph('calendar-plus') + t('rcSchedule') + '</button>' : '') +
      (['screening', 'interview', 'offer'].indexOf(c.stage) >= 0 && !r.offers.some(function(o){ return ['pending', 'approved', 'sent', 'accepted'].indexOf(o.status) >= 0; }) ? '<button type="button" class="btn btn-dark btn-sm" id="rcOf">' + ph('handshake') + t('rcOffer') + '</button>' : '') +
      '<button type="button" class="btn btn-line btn-sm" id="rcMv">' + ph('arrows-left-right') + t('rcMove') + '</button>' + '<button type="button" class="btn btn-line btn-sm" id="rcEd">' + ph('pencil-simple') + t('w2Edit') + '</button>' +
      (c.stage === 'rejected' || c.stage === 'withdrawn' ? '<button type="button" class="btn btn-line btn-sm" id="rcEr">' + ph('eraser') + t('rcErase') + '</button>' : '') + '</div>';
    h += '<h4>' + t('rcInterviews') + '</h4>' + (r.interviews.length ? '<div class="list">' + r.interviews.map(function(i, k){
      var fb = i.feedback.map(function(f){ return '<small>' + esc(f.by) + sep() + f.score + '/5' + sep() + t('rcr_' + f.recommendation) + (f.comment ? sep() + esc(f.comment) : '') + '</small>'; }).join('');
      return '<div class="row"><div class="main"><b><bdi>' + esc(i.ref) + '</bdi>' + sep() + fmtT(i.at) + sep() + t('rcm_' + i.mode) + '</b><small>' + t('rcPanel') + ': ' + i.panel.map(function(p){ return p ? esc(p.name) : ''; }).join('، ') + sep() + i.feedbackCount + '/' + i.panelSize + '</small>' +
        (fb || (i.onPanel && !i.myFeedbackDone ? '<small>' + t('rcScoresHidden') + '</small>' : '')) + '</div>' + chip(t('ris_' + i.status), i.status === 'done' ? 'in' : i.status === 'scheduled' ? 'late' : 'off') +
        (i.onPanel && i.status !== 'cancelled' && Date.parse(i.at) <= Date.now() ? ' <button type="button" class="btn btn-dark btn-sm" data-fb="' + k + '">' + t('rcFeedback') + '</button>' : '') +
        (hr && i.status === 'scheduled' ? ' <button type="button" class="btn btn-line btn-sm" data-ix="' + k + '">' + t('w2Cancel') + '</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('w2None') + '</p>');
    if (r.offers.length) h += '<h4>' + t('rcOffers') + '</h4><div class="list">' + r.offers.map(function(o, k){
      return '<div class="row"><div class="main"><b><bdi>' + esc(o.ref) + '</bdi>' + sep() + fmt(o.startDate) + (o.total != null ? sep() + money(o.total) : '') + '</b><small>' + t('rqc_' + o.contractType) + sep() + t('rcProbation') + ' ' + o.probationDays + (o.preparedBy ? sep() + esc(o.preparedBy.name) : '') + (o.approvedBy ? sep() + t('w2Approve') + ' ' + esc(o.approvedBy.name) : '') + (o.decisionNote ? sep() + esc(o.decisionNote) : '') + '</small>' + warnList('row_', o.warnings) + '</div>' +
        chip(t('ros_' + o.status), RO_CLS[o.status]) + ' ' + (o.canDecide ? '<button type="button" class="btn btn-dark btn-sm" data-oa="' + k + '">' + t('w2Approve') + '</button> <button type="button" class="btn btn-line btn-sm" data-or="' + k + '">' + t('w2Reject') + '</button> ' : '') +
        (hr && (o.status === 'pending' || o.status === 'rejected') && !o.canDecide ? '<button type="button" class="btn btn-line btn-sm" data-oe="' + k + '">' + t('w2Edit') + '</button> ' : '') +
        (hr && o.status === 'approved' ? '<button type="button" class="btn btn-dark btn-sm" data-os="' + k + '">' + t('rcSend') + '</button> ' : '') +
        (hr && o.status === 'sent' ? '<button type="button" class="btn btn-dark btn-sm" data-oy="' + k + '">' + t('rcAccepted') + '</button> <button type="button" class="btn btn-line btn-sm" data-on="' + k + '">' + t('rcDeclined') + '</button> ' : '') +
        (hr && o.status === 'accepted' ? '<button type="button" class="btn btn-dark btn-sm" data-oh="' + k + '">' + ph('user-check') + t('rcHire') + '</button> ' : '') +
        (['approved', 'sent', 'accepted'].indexOf(o.status) >= 0 && (hr || salaryOk()) ? '<button type="button" class="btn btn-line btn-sm" data-ol="' + k + '" aria-label="' + t('rcLetter') + '">' + ph('printer') + '</button>' : '') + '</div>'; }).join('') + '</div>';
    if (c.history && c.history.length) h += '<h4>' + t('w2History') + '</h4>' + histList(c.history);
    h += '<p class="hr-bad" id="rcE" role="alert"></p>';
    var d = drawer('<h3>' + esc(lang(c.name, c.nameEn)) + '</h3>' + h);
    var re = function(){ if (again) again(); candDrawer(id, again); };
    var fin = function(y){ if (!y.ok) return $('#rcE', d).textContent = errText(y.error); d.remove(); toast(t('w2Saved')); refreshTasks(); re(); };
    var bt = function(sel, fn){ var b = $(sel, d); if (b) b.onclick = function(){ d.remove(); fn(); }; };
    bt('#rcEd', function(){ people(function(P){ candForm(q, c, P, re); }); });
    bt('#rcOf', function(){ offerForm(c, q, null, re); });
    bt('#rcMv', function(){ formDrawer(t('rcMove'), esc(c.name), fld(t('rcStage'), '<select name="stage">' + keyOpts(['applied', 'screening', 'interview', 'rejected', 'withdrawn'], 'rcs_', c.stage) + '</select>') + fld(t('w2Note'), '<input name="note" maxlength="300">'),
      function(v){ return api('recruitCandStage', { id: c.id, stage: v.stage, note: v.note }); }, re); });
    var er = $('#rcEr', d); if (er) confirmTap(er, function(){ api('recruitCandStage', { id: c.id, stage: 'erased' }).then(fin); });
    bt('#rcIv', function(){ people(function(P){
      formDrawer(t('rcSchedule'), esc(c.name), two(fld(t('rcAt'), '<input name="at" type="datetime-local" required>'), fld(t('rcDuration'), '<input name="durationMin" type="number" min="10" max="480" value="45">')) +
        two(fld(t('rcMode'), '<select name="mode">' + keyOpts(['onsite', 'phone', 'video'], 'rcm_', 'onsite') + '</select>'), fld(t('trLocation'), '<input name="location" maxlength="200">')) +
        fld(t('rcPanel'), '<select name="panel" multiple size="8" required>' + mopts(P.rows.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')']; }), q.hiringManager ? [q.hiringManager.id] : []) + '</select>', t('w2Ctrl')),
        function(v){ return api('recruitInterviewSave', { interview: { candidateId: c.id, at: v.at ? new Date(Date.parse(v.at + ':00+03:00')).toISOString() : '', durationMin: v.durationMin, mode: v.mode, location: v.location, panel: v.panel } }); }, re); }); });
    $$('[data-fb]', d).forEach(function(b){ b.onclick = function(){ var i = r.interviews[b.dataset.fb], mine = i.feedback.filter(function(f){ return f.byId === S.me.id; })[0] || {}; d.remove();
      formDrawer(t('rcFeedback'), esc(c.name) + sep() + fmtT(i.at), two(fld(t('rcScore'), '<select name="score">' + opts([1, 2, 3, 4, 5].map(function(k){ return [k, String(k)]; }), mine.score || 3) + '</select>'), fld(t('rcRec'), '<select name="recommendation">' + keyOpts(['strong_hire', 'hire', 'no_hire', 'strong_no_hire'], 'rcr_', mine.recommendation || 'hire') + '</select>')) +
        fld(t('rcComment'), '<textarea name="comment" rows="4" maxlength="1000">' + esc(mine.comment || '') + '</textarea>'), function(v){ return api('recruitInterviewFeedback', { id: i.id, score: v.score, recommendation: v.recommendation, comment: v.comment }); }, re); }; });
    $$('[data-ix]', d).forEach(function(b){ confirmTap(b, function(){ var i = r.interviews[b.dataset.ix]; api('recruitInterviewSave', { interview: { id: i.id, status: 'cancelled' } }).then(fin); }); });
    var off = function(sel, fn){ $$('[' + sel + ']', d).forEach(function(b){ fn(b, r.offers[b.getAttribute(sel)]); }); };
    off('data-oa', function(b, o){ b.onclick = function(){ d.remove(); var need = o.warnings.indexOf('over_budget') >= 0;
      noteDrawer(t('w2Approve'), '<bdi>' + esc(o.ref) + '</bdi>' + warnList('row_', o.warnings), function(note){ return api('recruitOfferDecide', { id: o.id, decision: 'approve', note: note }); }, re, need); }; });
    off('data-or', function(b, o){ b.onclick = function(){ d.remove(); noteDrawer(t('w2Reject'), '<bdi>' + esc(o.ref) + '</bdi>', function(note){ return api('recruitOfferDecide', { id: o.id, decision: 'reject', note: note }); }, re); }; });
    off('data-oe', function(b, o){ b.onclick = function(){ d.remove(); offerForm(c, q, o, re); }; });
    off('data-os', function(b, o){ confirmTap(b, function(){ api('recruitOfferSend', { id: o.id }).then(fin); }); });
    off('data-oy', function(b, o){ confirmTap(b, function(){ api('recruitOfferRespond', { id: o.id, response: 'accepted' }).then(fin); }); });
    off('data-on', function(b, o){ b.onclick = function(){ d.remove(); noteDrawer(t('rcDeclined'), '<bdi>' + esc(o.ref) + '</bdi>', function(note){ return api('recruitOfferRespond', { id: o.id, response: 'declined', note: note }); }, re, false); }; });
    off('data-ol', function(b, o){ b.onclick = function(){ offerLetter(o); }; });
    off('data-oh', function(b, o){ b.onclick = function(){ d.remove();
      formDrawer(t('rcHire'), esc(c.name) + sep() + '<bdi>' + esc(o.ref) + '</bdi>', o.empId ? '' : fld(t('rcEmpNo'), '<input name="empNo" dir="ltr" maxlength="30" required>'),
        function(v){ return api('recruitHire', { offerId: o.id, empNo: v.empNo }); },
        function(y){ drawer('<h3>' + t('rcHire') + '</h3><p>' + t('rcHired') + ' <b class="num" dir="ltr">' + esc(y.activationCode || '-') + '</b></p>' + (y.packagePending ? '<p class="hr-hint">' + t('rcPkgPending') + ' <bdi>' + esc(y.compRef) + '</bdi></p>' : '')); re(); }, t('rcHire')); }; });
  });
}
function recruitSection(body){
  var box = head(body, 'rcTitle', 'rcLead'), tab = S.rcTab || 'reqs';
  function load(){
    busy(box);
    api('recruitReqList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var h = tabsBar(tab, [['reqs', 'clipboard-text', 'rcReqs'], ['cands', 'users', 'rcCands'], ['board', 'funnel', 'rcBoard']]) + '<div id="rcT"></div>';
      box.innerHTML = h;
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.rcTab = b.dataset.tab; load(); }; });
      var el = $('#rcT', box);
      if (tab === 'reqs') {
        el.innerHTML = (r.canCreate ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="rqNew">' + ph('plus') + t('rcNewReq') + '</button></div>' : '') +
          (r.rows.length ? '<div class="list">' + r.rows.map(function(q, i){ var st = q.stages || {};
            return '<div class="row w2-row">' + av(null, q.saudiOnly ? 'flag' : 'briefcase') + '<div class="main"><b>' + esc(lang(q.titleAr, q.titleEn)) + sep() + q.filled + '/' + q.headcount + '</b><small><bdi>' + esc(q.ref) + '</bdi>' + (q.department ? sep() + esc(q.department) : '') +
              (q.hiringManager ? sep() + esc(q.hiringManager.name) : '') + sep() + t('rqr_' + q.reason) + (q.targetDate ? sep() + t('rcTarget') + ' ' + fmt(q.targetDate) : '') + (q.budgetMax ? sep() + money(q.budgetMin) + ' - ' + money(q.budgetMax) : '') + '</small>' +
              '<small>' + ['applied', 'screening', 'interview', 'offer', 'hired'].filter(function(k){ return st[k]; }).map(function(k){ return t('rcs_' + k) + ' ' + st[k]; }).join(' · ') + (q.saudiOnly ? sep() + t('rcSaudiOnly') : '') + '</small></div>' + chip(t('rqs_' + q.status), RQ_CLS[q.status]) + ' ' +
              (q.canDecide ? '<button type="button" class="btn btn-dark btn-sm" data-qa="' + i + '">' + t('w2Approve') + '</button> <button type="button" class="btn btn-line btn-sm" data-qr="' + i + '">' + t('w2Reject') + '</button> ' : '') +
              (r.canManage && q.status === 'approved' ? '<button type="button" class="btn btn-line btn-sm" data-qc="' + i + '">' + ph('user-plus') + t('rcAddCand') + '</button> ' : '') +
              ((q.status === 'pending' || q.status === 'rejected') && (r.canManage || (q.requestedBy && q.requestedBy.id === S.me.id)) ? '<button type="button" class="btn btn-line btn-sm" data-qe="' + i + '" aria-label="' + t('w2Edit') + '">' + ph('pencil-simple') + '</button> ' : '') +
              (r.canManage && ['pending', 'approved', 'rejected'].indexOf(q.status) >= 0 ? '<button type="button" class="btn btn-line btn-sm" data-qx="' + i + '" aria-label="' + t('rcCloseReq') + '">' + ph('x-circle') + '</button>' : '') + '</div>'; }).join('') + '</div>' : empty('briefcase', t('w2None')));
        var nb = $('#rqNew', el); if (nb) nb.onclick = function(){ people(function(P){ reqForm(null, P, load); }); };
        $$('[data-qa]', el).forEach(function(b){ confirmTap(b, function(){ api('recruitReqDecide', { id: r.rows[b.dataset.qa].id, decision: 'approve' }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('w2Saved')); refreshTasks(); load(); }); }); });
        $$('[data-qr]', el).forEach(function(b){ b.onclick = function(){ var q = r.rows[b.dataset.qr]; noteDrawer(t('w2Reject'), esc(q.ref), function(note){ return api('recruitReqDecide', { id: q.id, decision: 'reject', note: note }); }, load); }; });
        $$('[data-qx]', el).forEach(function(b){ b.onclick = function(){ var q = r.rows[b.dataset.qx]; noteDrawer(t('rcCloseReq'), esc(q.ref), function(note){ return api('recruitReqClose', { id: q.id, note: note }); }, load); }; });
        $$('[data-qe]', el).forEach(function(b){ b.onclick = function(){ people(function(P){ reqForm(r.rows[b.dataset.qe], P, load); }); }; });
        $$('[data-qc]', el).forEach(function(b){ b.onclick = function(){ people(function(P){ candForm(r.rows[b.dataset.qc], null, P, load); }); }; });
      } else if (tab === 'cands') {
        var F = S.rcF || { reqId: '', stage: '' };
        el.innerHTML = '<div class="toolbar"><select id="rcQ" aria-label="' + t('rcReqs') + '">' + opts(r.rows.map(function(q){ return [q.id, q.ref + ' ' + lang(q.titleAr, q.titleEn)]; }), F.reqId, t('w2All')) + '</select>' +
          '<select id="rcS" aria-label="' + t('rcStage') + '">' + keyOpts(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'], 'rcs_', F.stage, t('w2All')) + '</select><span class="sp"></span></div><div id="rcL"></div>';
        var sync = function(){ S.rcF = { reqId: $('#rcQ', el).value, stage: $('#rcS', el).value }; load(); };
        $('#rcQ', el).onchange = sync; $('#rcS', el).onchange = sync;
        var L = $('#rcL', el); busy(L);
        var byReq = {}; r.rows.forEach(function(q){ byReq[q.id] = q; });
        api('recruitCandList', { reqId: F.reqId, stage: F.stage }, true).then(function(c){
          if (!L.isConnected) return;
          if (!c.ok) return L.innerHTML = bad(c.error);
          L.innerHTML = c.rows.length ? '<div class="list">' + c.rows.map(function(x, i){ var q = byReq[x.reqId] || {};
            return '<div class="row w2-row" data-cd="' + i + '" style="cursor:pointer">' + av({ name: x.name }) + '<div class="main"><b>' + esc(lang(x.name, x.nameEn)) + (x.isSaudi ? sep() + t('rcSaudi') : '') + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + sep() + esc(lang(q.titleAr, q.titleEn)) +
              (x.currentTitle ? sep() + esc(x.currentTitle) : '') + sep() + t('rcsrc_' + (x.source || 'other')) + (x.rating != null ? sep() + '★ ' + x.rating : '') + '</small></div>' + chip(t('rcs_' + x.stage), RC_CLS[x.stage]) + '</div>'; }).join('') + '</div>' : empty('users', t('w2None'));
          $$('[data-cd]', L).forEach(function(b){ b.onclick = function(){ candDrawer(c.rows[b.dataset.cd].id, load); }; });
        });
      } else {
        busy(el);
        api('recruitBoard', {}, true).then(function(b){
          if (!el.isConnected) return;
          if (!b.ok) return el.innerHTML = bad(b.error);
          var V = window.Viz, rq = b.requisitions;
          var h2 = tiles([[t('rcOpenSeats'), n(rq.openSeats), '', true], [t('rqs_pending'), n(rq.pending)], [t('rcOverdue'), n(rq.overdue)], [t('rcTimeToFill'), b.timeToFillDays == null ? '-' : n(b.timeToFillDays)],
            [t('rcAcceptance'), b.offers.acceptanceRate == null ? '-' : b.offers.acceptanceRate + '%']]);
          var order = ['applied', 'screening', 'interview', 'offer', 'hired'];
          var funnel = order.map(function(k){ return { label: t('rcs_' + k), value: b.reached[k] || 0, text: String(b.reached[k] || 0), tip: t('rcs_' + k) + ': ' + (b.reached[k] || 0) }; });
          var src = b.sources.sort(function(a, c){ return c.candidates - a.candidates; }).map(function(s){ return { label: t('rcsrc_' + s.source), value: s.candidates, text: s.candidates + ' / ' + s.hired, tip: t('rcsrc_' + s.source) + ': ' + s.candidates + ' ' + t('rcCandidates') + ', ' + s.hired + ' ' + t('rcHiredN') }; });
          h2 += V && V.card && V.hbars ? '<div class="db-grid">' + V.card('rcf', t('rcFunnel'), '', V.hbars(funnel), '') + (src.length ? V.card('rcs', t('rcSources'), '', V.hbars(src), '') : '') + '</div>' :
            '<div class="list">' + funnel.map(function(f){ return '<div class="row"><div class="main"><b>' + f.label + '</b></div>' + f.text + '</div>'; }).join('') + '</div>';
          h2 += b.conversion.length ? '<p class="hr-hint">' + b.conversion.map(function(c){ return t('rcs_' + c.from) + ' → ' + t('rcs_' + c.to) + ': ' + (c.rate == null ? '-' : c.rate + '%'); }).join(' · ') + '</p>' : '';
          el.innerHTML = h2; wire(el);
        });
      }
    });
  }
  load();
}
/** Interviews where I sit on the panel (for people who do not see the recruitment page). */
function myInterviewsCard(el){
  api('recruitCandList', {}, true).then(function(r){
    if (!el.isConnected || !r.ok || !r.rows.length || isHr()) return;
    var d = el.querySelector('[data-w2=rc]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'rc';
    d.innerHTML = '<h3><span class="ic">' + ph('chats-circle') + '</span>' + t('rcMyInterviews') + '</h3>' + r.rows.slice(0, 6).map(function(x, i){
      return '<div class="row w2-row" data-cd="' + i + '" style="cursor:pointer"><div class="main"><b>' + esc(lang(x.name, x.nameEn)) + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + (x.currentTitle ? sep() + esc(x.currentTitle) : '') + '</small></div>' + chip(t('rcs_' + x.stage), RC_CLS[x.stage]) + '</div>'; }).join('');
    if (!d.isConnected) el.appendChild(d);
    $$('[data-cd]', d).forEach(function(b){ b.onclick = function(){ candDrawer(r.rows[b.dataset.cd].id, function(){ myInterviewsCard(el); }); }; });
  });
}


// =================================================================== EXIT INTERVIEW (Wave 3)
var EX_AREAS = ['manager', 'pay', 'growth', 'workload', 'culture'];
function myExitCard(el){
  api('myExitSurvey', {}, true).then(function(r){
    if (!el.isConnected || !r.ok || !r.survey) return;
    var s = r.survey, d = el.querySelector('[data-w2=exit]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'exit';
    d.innerHTML = '<h3><span class="ic">' + ph('door-open') + '</span>' + t('exMy') + '</h3><p class="hr-hint">' + t('exMyLead') + '</p><form class="form" id="exF">' +
      EX_AREAS.map(function(k){ return fld(t('exArea_' + k), '<select name="r_' + k + '" required>' + opts([[5, '5'], [4, '4'], [3, '3'], [2, '2'], [1, '1']], '', '-') + '</select>'); }).join('') +
      fld(t('exReason'), '<select name="reason" required>' + keyOpts(s.reasons, 'exr_', '', '-') + '</select>') + fld(t('exRecommend'), '<input name="recommend" type="number" min="0" max="10" required>') +
      chk('wouldReturn', t('exReturn')) + fld(t('exComment'), '<textarea name="comment" rows="3" maxlength="1000"></textarea>') + '<p class="hr-bad" id="exE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('exSend') + '</button></div></form>';
    if (!d.isConnected) el.insertBefore(d, el.firstChild);
    var f = $('#exF', d); f.onsubmit = function(ev){ ev.preventDefault(); var v = formVals(f), rt = {}; EX_AREAS.forEach(function(k){ rt[k] = v['r_' + k]; });
      api('exitSurveySubmit', { answers: { ratings: rt, reason: v.reason, recommend: v.recommend, wouldReturn: v.wouldReturn, comment: v.comment } }).then(function(x){
        if (!x.ok) return $('#exE', d).textContent = errText(x.error); d.innerHTML = '<h3><span class="ic">' + ph('seal-check') + '</span>' + t('exThanks') + '</h3>'; refreshTasks(); }); };
  });
}
function exitSection(body){
  var box = head(body, 'exTitle', 'exLead'); busy(box);
  api('exitSurveyResults', {}, true).then(function(r){
    if (!box.isConnected) return;
    if (!r.ok) return box.innerHTML = bad(r.error);
    var h = tiles([[t('exCount'), n(r.count), '', true], [t('exOpen'), n(r.open)]].concat(r.hidden ? [] : [[t('exEnps'), n(r.enps)], [t('exBack'), r.wouldReturn + '%']]));
    if (r.hidden) { box.innerHTML = h + empty('lock', t('exHidden')); wire(box); return; }
    var V = window.Viz, bars = function(list){ return V && V.hbars ? V.hbars(list) : list.map(function(x){ return '<div>' + x.label + ': ' + x.text + '</div>'; }).join(''); };
    var av = EX_AREAS.map(function(k){ return { label: t('exArea_' + k), value: r.averages[k], text: String(r.averages[k]), tip: t('exArea_' + k) + ': ' + r.averages[k] + '/5' }; });
    var rs = Object.keys(r.reasons).sort(function(a, b){ return r.reasons[b] - r.reasons[a]; }).map(function(k){ return { label: t('exr_' + k), value: r.reasons[k], text: String(r.reasons[k]), tip: t('exr_' + k) + ': ' + r.reasons[k] }; });
    h += '<div class="db-grid">' + (V && V.card ? V.card('exa', t('exAvg'), '', bars(av), '') + V.card('exr', t('exReasons'), '', bars(rs), '') : bars(av) + bars(rs)) + '</div>';
    h += '<h4>' + t('exComments') + '</h4>' + (r.comments.length ? '<div class="list">' + r.comments.map(function(c){ return '<div class="row"><div class="main"><small class="w2-body">' + esc(c) + '</small></div></div>'; }).join('') + '</div>' : '<p class="hr-hint">' + t('w2None') + '</p>');
    box.innerHTML = h; wire(box);
  });
}

// =================================================================== RECOGNITION / KUDOS (Wave 3)
var KD_ICON = { teamwork: 'users-three', customer: 'handshake', safety: 'shield-check', initiative: 'lightbulb', excellence: 'medal' };
function kudosRow(k){
  return '<div class="row w2-row">' + av(k.from) + '<div class="main"><b>' + (k.from ? esc(lang(k.from.name, k.from.nameEn)) : '') + ' ' + ph(S.lang === 'en' ? 'arrow-right' : 'arrow-left') + ' ' + (k.to ? esc(lang(k.to.name, k.to.nameEn)) : '') + '</b>' +
    '<small>' + ph(KD_ICON[k.value] || 'heart') + ' ' + t('kdv_' + k.value) + sep() + fmtT(k.at) + '</small><small class="w2-body">' + esc(k.message) + '</small></div></div>';
}
function kudosForm(r, again){
  var d = formDrawer(t('kdSend'), (5 - r.sentToday) + ' ' + t('kdLeft'), fld(t('kdTo'), '<select name="toId" required>' + opts(r.people.map(function(p){ return [p.id, lang(p.name, p.nameEn) + ' (' + p.empNo + ')']; }), '', '-') + '</select>') +
    fld(t('kdValue'), '<select name="value" required>' + keyOpts(r.values, 'kdv_', 'teamwork') + '</select>') + fld(t('kdMsg'), '<textarea name="message" rows="3" maxlength="280" required></textarea>'),
    function(v){ return api('kudosSend', { kudos: v }); }, function(){ toast(t('kdSent')); if (again) again(); }, t('kdSend'));
  return d;
}
function myKudosCard(el){
  api('kudosFeed', {}, true).then(function(r){
    if (!el.isConnected || !r.ok) return;
    var d = el.querySelector('[data-w2=kd]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'kd';
    d.innerHTML = '<h3><span class="ic">' + ph('hands-clapping') + '</span>' + t('kdMy') + '<span class="sp"></span>' + (r.received ? chip(t('kdReceived') + ' ' + r.received, 'in') + ' ' : '') +
      '<button type="button" class="btn btn-line btn-sm" data-ask="1">' + ph('heart') + t('kdSend') + '</button></h3>' + (r.mine.length ? r.mine.slice(0, 3).map(kudosRow).join('') : '');
    if (!d.isConnected) el.appendChild(d);
    $('[data-ask]', d).onclick = function(){ kudosForm(r, function(){ myKudosCard(el); }); };
  });
}
function kudosSection(body){
  var box = head(body, 'kdTitle', 'kdLead');
  function load(){
    busy(box);
    Promise.all([api('kudosFeed', {}, true), api('kudosStats', {}, true)]).then(function(rs){
      if (!box.isConnected) return;
      var f = rs[0], s = rs[1];
      if (!f.ok) return box.innerHTML = bad(f.error);
      var h = '';
      if (s.ok) {
        var mk = new Date().toISOString().slice(0, 7), V = window.Viz;
        h += tiles([[t('kdMonth'), n(s.byMonth[mk] || 0), '', true], [t('kdTop'), s.top[0] ? esc(s.top[0].emp ? s.top[0].emp.name : '') : '-']]);
        var vb = Object.keys(s.byValue).map(function(k){ return { label: t('kdv_' + k), value: s.byValue[k], text: String(s.byValue[k]), tip: t('kdv_' + k) + ': ' + s.byValue[k] }; });
        var db = Object.keys(s.byDept).sort(function(a, b){ return s.byDept[b] - s.byDept[a]; }).slice(0, 8).map(function(k){ return { label: esc(k), value: s.byDept[k], text: String(s.byDept[k]), tip: esc(k) + ': ' + s.byDept[k] }; });
        if (V && V.card && V.hbars && (vb.length || db.length)) h += '<div class="db-grid">' + V.card('kdv', t('kdByValue'), '', V.hbars(vb), '') + V.card('kdd', t('kdByDept'), '', V.hbars(db), '') + '</div>';
      }
      h += '<div class="toolbar"><h4 style="margin:0">' + t('kdFeed') + '</h4><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="kdNew">' + ph('heart') + t('kdSend') + '</button></div>';
      h += f.feed.length ? '<div class="list">' + f.feed.map(kudosRow).join('') + '</div>' : empty('hands-clapping', t('w2None'));
      box.innerHTML = h; wire(box);
      $('#kdNew', box).onclick = function(){ kudosForm(f, load); };
    });
  }
  load();
}

// =================================================================== FINAL SETTLEMENT (Wave 3)
var FS_CLS = { draft: 'late', approved: 'late', paid: 'in', cancelled: 'off' };
var FS_REASONS = ['resignation', 'termination', 'contract_end', 'art81', 'art87_marriage', 'art87_childbirth', 'art87_force_majeure', 'art80']; // exactly Payroll.gs EOS_REASONS
function fsLines(q){
  return [[t('fsAward'), q.award], [t('fsLeave'), q.leavePay], [t('fsLastMonth') + (q.lastMonthDays ? ' (' + q.lastMonthDays + ')' : ''), q.lastMonthPay], [t('fsAdvances'), -(q.advances || 0)], [t('fsLoans'), -(q.loans || 0)]];
}
function fsPrint(x){
  var lg = S.lang === 'en' ? 'en' : 'ar', T0 = T[lg], E = Doc.esc, q = x.quote || {}, m = function(v){ return Doc.money(v, lg) + ' ' + (lg === 'en' ? 'SAR' : 'ر.س'); };
  var row = function(k, v){ return '<tr><th>' + E(k) + '</th><td class="n">' + v + '</td></tr>'; };
  var body = '<p><b>' + E(x.emp ? (lg === 'en' && x.emp.nameEn ? x.emp.nameEn : x.emp.name) : '') + '</b> <span class="num">' + E(x.emp ? x.emp.empNo : '') + '</span></p>' +
    '<table class="tb"><tbody>' + row(T0.fsReason, E(T0['fsr_' + x.reason] || x.reason)) + row(T0.fsLastDay, E(Doc.dates(x.lastDay, lg))) + row(T0.fsYears, E(String(q.years))) + row(T0.fsWage, m(q.wage)) + '</tbody></table>' +
    '<table class="tb" style="margin-top:10px"><tbody>' + fsLines(q).map(function(l){ return row(l[0], m(l[1])); }).join('') + '</tbody><tfoot><tr><td>' + E(T0.fsNet) + '</td><td class="n">' + m(x.net) + '<br><small>' + E(Doc.words(x.net, lg)) + '</small></td></tr></tfoot></table>' +
    (x.paidRef ? '<p class="note">' + E(T0.fsPaidRef) + ': <span class="num">' + E(x.paidRef) + '</span> · ' + E(Doc.dates(x.paidOn, lg)) + '</p>' : '') + '<p class="note">' + E(T0.fsStatement) + '</p>';
  Doc.open({ lang: lg, kind: T0.fsKind, title: T0.fsTitle, ref: x.ref, body: body, qr: 'FS|' + x.ref + '|' + (x.emp ? x.emp.empNo : '') + '|' + Number(x.net).toFixed(2), by: S.me ? S.me.name : '',
    signatures: [E(T0.fsSignHr), E(T0.fsSignPay), E(T0.fsSignEmp)] });
}
function fsDetail(x, r, again){
  var q = x.quote || {};
  var h = '<p class="hr-hint">' + empLine(x.emp) + sep() + '<bdi>' + esc(x.ref) + '</bdi>' + sep() + t('fss_' + x.status) + '</p><div class="mf-kv">' +
    [[t('fsReason'), t('fsr_' + x.reason)], [t('fsLastDay'), fmt(x.lastDay)], [t('fsYears'), q.years], [t('fsWage'), money(q.wage)]].concat(fsLines(q).map(function(l){ return [l[0], money(l[1])]; }))
      .concat([[t('fsNet'), '<b>' + money(x.net) + '</b>'], [t('fsDue'), fmt(q.dueBy)]]).map(function(k){ return '<div><span>' + k[0] + '</span><b>' + k[1] + '</b></div>'; }).join('') + '</div>' +
    (x.preparedBy ? '<p class="hr-hint">' + t('w2By') + ' ' + esc(x.preparedBy) + (x.approvedBy ? sep() + t('w2Approve') + ' ' + esc(x.approvedBy) : '') + (x.paidRef ? sep() + t('fsPaidRef') + ' <bdi>' + esc(x.paidRef) + '</bdi>' : '') + '</p>' : '') +
    '<div class="btnrow">' + (r && r.canApprove && x.status === 'draft' && x.preparedById !== r.me ? '<button type="button" class="btn btn-dark btn-sm" id="fsOk">' + t('w2Approve') + '</button><button type="button" class="btn btn-line btn-sm" id="fsNo">' + t('w2Reject') + '</button>' : '') +
    (r && r.canApprove && x.status === 'approved' ? '<button type="button" class="btn btn-dark btn-sm" id="fsPaid">' + ph('bank') + t('fsPay') + '</button>' : '') +
    (x.status === 'approved' || x.status === 'paid' ? '<button type="button" class="btn btn-line btn-sm" id="fsPr">' + ph('printer') + t('fsPrint') + '</button>' : '') + '</div><p class="hr-bad" id="fsE" role="alert"></p>';
  var d = drawer('<h3>' + t('fsTitle') + '</h3>' + h);
  var fin = function(y){ if (!y.ok) return $('#fsE', d).textContent = errText(y.error); d.remove(); toast(t('w2Saved')); refreshTasks(); if (again) again(); };
  var ok = $('#fsOk', d); if (ok) confirmTap(ok, function(){ api('finalSettlementDecide', { id: x.id, decision: 'approve' }).then(fin); });
  var no = $('#fsNo', d); if (no) no.onclick = function(){ d.remove(); noteDrawer(t('w2Reject'), esc(x.ref), function(note){ return api('finalSettlementDecide', { id: x.id, decision: 'reject', note: note }); }, again); };
  var pd = $('#fsPaid', d); if (pd) pd.onclick = function(){ d.remove(); var td = riyadhToday();
    formDrawer(t('fsPay'), esc(x.ref) + sep() + money(x.net), two(fld(t('fsPaidOn'), '<input name="paidOn" type="date" max="' + td + '" value="' + td + '">'), fld(t('fsPaidRef'), '<input name="paidRef" dir="ltr" maxlength="60" required>')),
      function(v){ return api('finalSettlementPaid', { id: x.id, paidOn: v.paidOn, paidRef: v.paidRef }); }, again); };
  var pr = $('#fsPr', d); if (pr) pr.onclick = function(){ fsPrint(x); };
}
function settleSection(body){
  var box = head(body, 'fsTitle', 'fsLead');
  function load(){
    busy(box);
    api('finalSettlementList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var h = tiles([[t('fss_draft'), n(r.rows.filter(function(x){ return x.status === 'draft'; }).length), '', true], [t('fss_approved'), n(r.rows.filter(function(x){ return x.status === 'approved'; }).length)],
        [t('fss_paid'), n(r.rows.filter(function(x){ return x.status === 'paid'; }).length)]]);
      h += '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="fsNew">' + ph('plus') + t('fsNew') + '</button></div>';
      h += r.rows.length ? '<div class="list">' + r.rows.map(function(x, i){ return '<div class="row w2-row" data-fs="' + i + '" style="cursor:pointer">' + av(x.emp) + '<div class="main"><b>' + empLine(x.emp) + sep() + money(x.net) + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + sep() + t('fsr_' + x.reason) + sep() + t('fsLastDay') + ' ' + fmt(x.lastDay) + '</small></div>' + chip(t('fss_' + x.status), FS_CLS[x.status]) + '</div>'; }).join('') + '</div>' : empty('handshake', t('w2None'));
      box.innerHTML = h; wire(box);
      $$('[data-fs]', box).forEach(function(b){ b.onclick = function(){ fsDetail(r.rows[b.dataset.fs], r, load); }; });
      $('#fsNew', box).onclick = function(){ people(function(P){
        var all = r.leavers.concat(P.rows.filter(function(p){ return !r.leavers.some(function(l){ return l.id === p.id; }); }).map(function(p){ return { id: p.id, empNo: p.empNo, name: p.name, lastDay: '' }; }));
        var d = formDrawer(t('fsNew'), '', fld(t('w2Employee'), '<select name="empId" required>' + opts(all.map(function(p){ return [p.id, p.name + ' (' + p.empNo + ')' + (p.lastDay ? ' · ' + p.lastDay : '')]; }), '', '-') + '</select>') +
          two(fld(t('fsLastDay'), '<input name="lastDay" type="date" required>'), fld(t('fsReason'), '<select name="reason">' + keyOpts(FS_REASONS, 'fsr_', 'resignation') + '</select>')) + '<div id="fsQ"></div>' + fld(t('w2Note'), '<input name="note" maxlength="300">'),
          function(v){ return api('finalSettlementCreate', v); }, load, t('fsNew'));
        var f = $('#w2F', d), qb = $('#fsQ', d), tm = 0;
        var emp = $('[name=empId]', d); emp.onchange = function(){ var l = all.filter(function(p){ return p.id === emp.value; })[0]; if (l && l.lastDay) $('[name=lastDay]', d).value = l.lastDay; f.oninput(); };
        f.oninput = function(){ clearTimeout(tm); tm = setTimeout(function(){ var v = formVals(f); if (!v.empId || !v.lastDay) return qb.innerHTML = '';
          api('eosQuote', { empId: v.empId, lastDay: v.lastDay, reason: v.reason }, true).then(function(q){ if (!qb.isConnected) return; if (!q.ok) return qb.innerHTML = bad(q.error);
            var e = q.eos; qb.innerHTML = '<div class="mf-kv">' + fsLines(e).map(function(l){ return '<div><span>' + l[0] + '</span><b>' + money(l[1]) + '</b></div>'; }).join('') + '<div><span>' + t('fsNet') + '</span><b>' + money(e.net) + '</b></div></div>'; }); }, 350); };
      }); };
    });
  }
  load();
}
function mySettleCard(el){
  api('myFinalSettlement', {}, true).then(function(r){
    if (!el.isConnected || !r.ok || !r.settlement) return;
    var x = r.settlement, d = el.querySelector('[data-w2=fs]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'fs';
    d.innerHTML = '<h3><span class="ic">' + ph('handshake') + '</span>' + t('fsMy') + '<span class="sp"></span>' + chip(t('fss_' + x.status), FS_CLS[x.status]) + '</h3><div class="row"><div class="main"><b>' + t('fsNet') + ' ' + money(x.net) + '</b><small><bdi>' + esc(x.ref) + '</bdi>' + sep() + fmt(x.lastDay) + '</small></div><button type="button" class="btn btn-line btn-sm" data-pr="1">' + ph('printer') + t('fsPrint') + '</button></div>';
    if (!d.isConnected) el.insertBefore(d, el.firstChild);
    $('[data-pr]', d).onclick = function(){ fsPrint(x); };
  });
}

// =================================================================== ANNUAL PAY REVIEW (Wave 3)
function payReviewSection(body){
  var box = head(body, 'prTitle', 'prLead');
  function load(){
    busy(box);
    api('compCycleList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var c = r.rows.filter(function(x){ return x.status === 'open'; })[0] || r.rows[0];
      var h = r.canManage && !(c && c.status === 'open') ? '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="prNew">' + ph('plus') + t('prNew') + '</button></div>' : '';
      if (!c) { box.innerHTML = h + empty('trend-up', t('prOpenNone')); var nb0 = $('#prNew', box); if (nb0) nb0.onclick = openForm; return; }
      h += tiles([[t('prProposed'), c.proposed + ' / ' + c.total, '', true]].concat(c.budgetPct != null ? [[t('prBudget'), c.budgetPct + '%'], [t('prUsed'), c.usedPct + '%', money(c.increase)]] : []));
      h += '<div class="toolbar"><b>' + esc(c.name) + '</b> <bdi>' + esc(c.ref) + '</bdi>' + sep() + t('prEff') + ' ' + fmt(c.effectiveFrom) + ' ' + chip(t('prs_' + c.status), c.status === 'open' ? 'in' : 'off') + '<span class="sp"></span>' +
        (r.canManage && c.status === 'open' ? '<button type="button" class="btn btn-dark btn-sm" id="prClose">' + ph('seal-check') + t('prClose') + '</button>' : '') + '</div>';
      h += c.rows.length ? '<div class="list">' + c.rows.map(function(x, i){
        return '<div class="row w2-row">' + av(x.emp) + '<div class="main"><b>' + empLine(x.emp) + '</b><small>' + (x.base != null ? t('prBase') + ' ' + money(x.base) + (x.increase ? sep() + t('prInc') + ' ' + money(x.increase) : '') : '') + (x.proposedBy ? sep() + esc(x.proposedBy) : '') + (x.note ? sep() + esc(x.note) : '') + '</small></div>' +
          (c.status === 'open' ? '<input type="number" min="0" max="50" step="0.5" inputmode="decimal" style="width:84px" aria-label="' + t('prPct') + '" data-pct="' + i + '" value="' + (x.pct == null ? '' : x.pct) + '"> <button type="button" class="btn btn-line btn-sm" data-sv="' + i + '">' + t('prSaveRow') + '</button>' : '<b class="num">' + (x.pct == null ? '-' : x.pct + '%') + '</b>') + '</div>'; }).join('') + '</div>' : empty('users', t('w2None'));
      box.innerHTML = h; wire(box);
      $$('[data-sv]', box).forEach(function(b){ b.onclick = function(){ var i = b.dataset.sv, inp = $('[data-pct="' + i + '"]', box); b.disabled = true;
        api('compPropose', { id: c.rows[i].id, pct: inp.value }).then(function(x){ b.disabled = false; if (!x.ok) return toast(errText(x.error)); toast(t('w2Saved')); refreshTasks(); if (c.budgetPct != null) load(); }); }; });
      var cl = $('#prClose', box); if (cl) confirmTap(cl, function(){ api('compCycleClose', { id: c.id }).then(function(x){ if (!x.ok) { cl.disabled = false; return toast(errText(x.error)); } toast(t('prClosed') + ': ' + x.proposals); refreshTasks(); load(); }); });
      var nb = $('#prNew', box); if (nb) nb.onclick = openForm;
    });
  }
  function openForm(){
    formDrawer(t('prNew'), '', fld(t('prName'), '<input name="name" maxlength="100" required>') + two(fld(t('prEff'), '<input name="effectiveFrom" type="date" required>'), fld(t('prBudget'), '<input name="budgetPct" type="number" min="0" max="50" step="0.5" value="5" required>')) +
      fld(t('prBasis'), '<select name="basis"><option value="basic_housing">' + t('prBasisBH') + '</option><option value="basic">' + t('prBasisB') + '</option></select>'),
      function(v){ return api('compCycleSave', { cycle: v }); }, load, t('prNew'));
  }
  load();
}

// =================================================================== TIMESHEETS (Wave 3)
function timesheetSection(body){
  var box = head(body, 'tsTitle', 'tsLead'), month = S.tsMonth || '';
  function load(){
    busy(box);
    api('timesheetList', month ? { month: month } : {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      month = r.month;
      var pend = r.rows.filter(function(x){ return !x.approved; });
      var h = tiles([[t('tsPending'), n(pend.length), '', true], [t('tsApproved'), n(r.rows.length - pend.length)], [r.required ? t('tsRequired') : t('tsOptional'), r.required ? ph('lock') : ph('lock-open')]]);
      h += '<div class="toolbar"><label>' + t('tsMonth') + ' <input type="month" id="tsM" value="' + esc(month) + '"></label><span class="sp"></span>' + (pend.length ? '<button type="button" class="btn btn-dark btn-sm" id="tsAll">' + ph('checks') + t('tsApproveAll') + ' (' + pend.length + ')</button>' : '') + '</div>';
      h += r.rows.length ? '<div class="w2-mx"><table><thead><tr><th>' + t('w2Employee') + '</th><th>' + t('tsWorked') + '</th><th>' + t('tsLate') + '</th><th>' + t('tsAbsent') + '</th><th>' + t('tsOt') + '</th><th>' + t('tsMissing') + '</th><th>' + t('w2Status') + '</th></tr></thead><tbody>' +
        r.rows.map(function(x, i){ var tt = x.totals; return '<tr><td>' + empLine(x.emp) + '</td><td class="num">' + Math.round(tt.workedMin / 6) / 10 + '</td><td class="num">' + tt.lateMin + '</td><td class="num">' + tt.absent + '</td><td class="num">' + Math.round(tt.overtimeMin / 6) / 10 + '</td><td class="num">' + tt.missingOut +
          (tt.review ? ' ' + chip(t('tsReview') + ' ' + tt.review, 'late') : '') + '</td><td>' + (x.approved ? chip(t('tsApproved'), 'in') + ' <small>' + esc(x.approvedBy) + '</small>' : '<button type="button" class="btn btn-line btn-sm" data-ts="' + i + '">' + t('tsApprove') + '</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : empty('calendar-check', t('w2None'));
      box.innerHTML = h; wire(box);
      $('#tsM', box).onchange = function(){ month = S.tsMonth = this.value; load(); };
      var go = function(ids, b){ b.disabled = true; api('timesheetApprove', { month: month, empIds: ids }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(errText(x.error)); } toast(t('w2Saved')); refreshTasks(); load(); }); };
      $$('[data-ts]', box).forEach(function(b){ b.onclick = function(){ go([r.rows[b.dataset.ts].emp.id], b); }; });
      var all = $('#tsAll', box); if (all) confirmTap(all, function(){ go(pend.map(function(x){ return x.emp.id; }), all); });
    });
  }
  load();
}

// =================================================================== ORG CHART (Wave 3)
function orgChartSection(body){
  var box = head(body, 'ocTitle', 'ocLead'); busy(box);
  api('hrBootstrap', {}, true).then(function(r){
    if (!box.isConnected) return;
    if (!r.ok) return box.innerHTML = bad(r.error);
    var rows = (r.rows || []).filter(function(e){ return e.status === 'active'; }), by = {}, kids = {};
    rows.forEach(function(e){ by[e.id] = e; });
    rows.forEach(function(e){ var m = e.managerId && by[e.managerId] ? e.managerId : ''; (kids[m] = kids[m] || []).push(e); });
    var count = function(id){ return (kids[id] || []).reduce(function(s, k){ return s + 1 + count(k.id); }, 0); };
    var node = function(e, depth){
      var ch = (kids[e.id] || []).sort(function(a, b){ return count(b.id) - count(a.id) || String(a.name).localeCompare(String(b.name)); });
      return '<li data-oc="' + esc(e.id) + '"' + (depth > 1 && ch.length ? ' class="fold"' : '') + '><div class="oc-card" role="button" tabindex="0">' + av(e) + '<div><b>' + esc(lang(e.name, e.nameEn)) + '</b><small>' + esc(e.positionName || e.title || '') + (e.departmentName ? sep() + esc(e.departmentName) : '') + '</small></div>' +
        (ch.length ? '<span class="oc-n">' + count(e.id) + ' ' + t('ocReports') + '</span>' : '') + '</div>' + (ch.length ? '<ul>' + ch.map(function(k){ return node(k, depth + 1); }).join('') + '</ul>' : '') + '</li>';
    };
    var roots = (kids[''] || []).sort(function(a, b){ return count(b.id) - count(a.id); });
    box.innerHTML = '<div class="toolbar"><input type="search" id="ocQ" placeholder="' + t('ocSearch') + '" aria-label="' + t('ocSearch') + '" style="max-width:280px"><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="ocOpen">' + ph('arrows-out-simple') + t('ocExpand') + '</button> <button type="button" class="btn btn-line btn-sm" id="ocFold">' + ph('arrows-in-simple') + t('ocCollapse') + '</button></div>' +
      (roots.length ? '<div class="w2-mx"><ul class="oc-tree">' + roots.map(function(e){ return node(e, 0); }).join('') + '</ul></div>' : empty('tree-structure', t('w2None')));
    $$('.oc-card', box).forEach(function(c){ var tog = function(){ var li = c.parentNode; if (li.querySelector('ul')) li.classList.toggle('fold'); }; c.onclick = tog; c.onkeydown = function(ev){ if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tog(); } }; });
    $('#ocOpen', box).onclick = function(){ $$('.oc-tree li', box).forEach(function(li){ li.classList.remove('fold'); }); };
    $('#ocFold', box).onclick = function(){ $$('.oc-tree li', box).forEach(function(li){ if (li.querySelector('ul') && li.parentNode.classList.contains('oc-tree') === false) li.classList.add('fold'); }); };
    $('#ocQ', box).oninput = function(){ var q = this.value.trim().toLowerCase(); $$('.oc-tree li', box).forEach(function(li){ li.classList.remove('hit'); });
      if (!q) return; rows.filter(function(e){ return (String(e.name) + ' ' + String(e.nameEn || '') + ' ' + e.empNo).toLowerCase().indexOf(q) >= 0; }).forEach(function(e){
        var li = box.querySelector('[data-oc="' + e.id + '"]'); if (!li) return; li.classList.add('hit'); for (var p = li.parentNode; p && p !== box; p = p.parentNode) if (p.tagName === 'LI') p.classList.remove('fold'); });
      var first = box.querySelector('.oc-tree li.hit'); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  });
}

// =================================================================== CUSTOM FIELDS (Wave 3)
var CF_TYPES = ['text', 'number', 'date', 'select', 'bool'];
function cfLabel(f){ return esc(lang(f.labelAr, f.labelEn)); }
function cfShow(f, v){ return v === '' || v == null ? '-' : f.type === 'bool' ? t(v === 'yes' ? 'cfYes' : 'cfNo') : f.type === 'date' ? fmt(v) : esc(v); }
function cfInput(f, v){
  var n = 'v_' + f.id;
  if (f.type === 'select') return '<select name="' + n + '">' + opts(f.options.map(function(o){ return [o, o]; }), v, '-') + '</select>';
  if (f.type === 'bool') return '<select name="' + n + '">' + opts([['yes', t('cfYes')], ['no', t('cfNo')]], v, '-') + '</select>';
  return '<input name="' + n + '"' + (f.type === 'number' ? ' type="number" step="any"' : f.type === 'date' ? ' type="date"' : ' maxlength="300"') + ' value="' + esc(v == null ? '' : v) + '">';
}
function cfFieldForm(f, again){
  f = f || { type: 'text', visibleTo: 'hr', options: [] };
  var d = formDrawer(f.id ? t('w2Edit') : t('cfNew'), f.key ? '<bdi>' + esc(f.key) + '</bdi>' : '', two(fld(t('cfLabelAr'), '<input name="labelAr" maxlength="80" required value="' + esc(f.labelAr || '') + '">'), fld(t('cfLabelEn'), '<input name="labelEn" maxlength="80" dir="ltr" value="' + esc(f.labelEn || '') + '">')) +
    two(fld(t('cfType'), '<select name="type">' + keyOpts(CF_TYPES, 'cft_', f.type) + '</select>'), fld(t('cfVis'), '<select name="visibleTo">' + keyOpts(['hr', 'manager', 'employee'], 'cfv_', f.visibleTo) + '</select>')) +
    '<div id="cfOpt"' + (f.type === 'select' ? '' : ' hidden') + '>' + fld(t('cfOptions'), '<input name="options" maxlength="600" value="' + esc((f.options || []).join(', ')) + '">', t('cfOptionsHint')) + '</div>' + (f.id ? chk('disabled', t('cfDisabled'), f.status === 'disabled') : ''),
    function(v){ return api('customFieldSave', { field: { id: f.id || '', labelAr: v.labelAr, labelEn: v.labelEn, type: v.type, visibleTo: v.visibleTo, options: v.options, status: v.disabled ? 'disabled' : 'active' } }); }, again, t('w2Save'));
  var ty = $('[name=type]', d); ty.onchange = function(){ $('#cfOpt', d).hidden = ty.value !== 'select'; };
}
function customFieldsSection(body){
  var box = head(body, 'cfTitle', 'cfLead'), tab = S.cfTab || 'fields';
  function load(){
    busy(box);
    api('customFieldList', { all: 1 }, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      box.innerHTML = tabsBar(tab, [['fields', 'list-plus', 'cfFields'], ['values', 'user-list', 'cfValues']]) + '<div id="cfT"></div>';
      $$('[data-tab]', box).forEach(function(b){ b.onclick = function(){ tab = S.cfTab = b.dataset.tab; load(); }; });
      var el = $('#cfT', box);
      if (tab === 'fields') {
        el.innerHTML = '<div class="toolbar"><span class="sp"></span><button type="button" class="btn btn-dark btn-sm" id="cfNew">' + ph('plus') + t('cfNew') + '</button></div>' +
          (r.fields.length ? '<div class="list">' + r.fields.map(function(f, i){ return '<div class="row w2-row">' + av(null, 'textbox') + '<div class="main"><b>' + cfLabel(f) + '</b><small><bdi>' + esc(f.key) + '</bdi>' + sep() + t('cft_' + f.type) + sep() + t('cfv_' + f.visibleTo) + (f.options.length ? sep() + esc(f.options.join('، ')) : '') + '</small></div>' +
            (f.status === 'disabled' ? chip(t('cfDisabled'), 'off') + ' ' : '') + '<button type="button" class="btn btn-line btn-sm" data-cf="' + i + '" aria-label="' + t('w2Edit') + '">' + ph('pencil-simple') + '</button></div>'; }).join('') + '</div>' : empty('textbox', t('cfNone')));
        $('#cfNew', el).onclick = function(){ cfFieldForm(null, load); };
        $$('[data-cf]', el).forEach(function(b){ b.onclick = function(){ cfFieldForm(r.fields[b.dataset.cf], load); }; });
      } else {
        people(function(P){
          el.innerHTML = '<div class="toolbar"><select id="cfEmp" aria-label="' + t('cfPick') + '">' + empOpts(P.rows, S.cfEmp || '', t('cfPick')) + '</select></div><div id="cfV"></div>';
          var sel = $('#cfEmp', el), vb = $('#cfV', el);
          var show = function(){ S.cfEmp = sel.value; if (!sel.value) return vb.innerHTML = ''; busy(vb);
            api('customValuesGet', { empId: sel.value }, true).then(function(x){
              if (!vb.isConnected) return;
              if (!x.ok) return vb.innerHTML = bad(x.error);
              if (!x.fields.length) return vb.innerHTML = empty('textbox', t('cfNone'));
              vb.innerHTML = '<form class="form" id="cfVF" style="max-width:560px">' + x.fields.map(function(f){ return fld(cfLabel(f), x.canEdit ? cfInput(f, f.value) : '<input disabled value="' + cfShow(f, f.value) + '">', t('cfv_' + f.visibleTo)); }).join('') +
                '<p class="hr-bad" id="cfE" role="alert"></p>' + (x.canEdit ? '<div class="btnrow"><button class="btn btn-dark" type="submit">' + t('w2Save') + '</button></div>' : '') + '</form>';
              var f = $('#cfVF', vb); f.onsubmit = function(ev){ ev.preventDefault(); var v = formVals(f), vals = {}; x.fields.forEach(function(fd){ vals[fd.id] = v['v_' + fd.id]; });
                api('customValuesSave', { empId: sel.value, values: vals }).then(function(y){ if (!y.ok) return $('#cfE', vb).textContent = errText(y.error); toast(t('w2Saved')); }); };
            }); };
          sel.onchange = show; show();
        });
      }
    });
  }
  load();
}
function myCustomCard(el){
  api('customValuesGet', {}, true).then(function(r){
    if (!el.isConnected || !r.ok || !r.fields.length) return;
    var d = el.querySelector('[data-w2=cf]') || document.createElement('div'); d.className = 'mf-card op-card'; d.dataset.w2 = 'cf';
    d.innerHTML = '<h3><span class="ic">' + ph('identification-badge') + '</span>' + t('cfMy') + '</h3><div class="mf-kv">' + r.fields.map(function(f){ return '<div><span>' + cfLabel(f) + '</span><b>' + cfShow(f, f.value) + '</b></div>'; }).join('') + '</div>';
    if (!d.isConnected) el.appendChild(d);
  });
}

// =================================================================== REPORT BUILDER (Wave 3)
var RB_BASE = ['empNo', 'name', 'nameEn', 'departmentName', 'positionName', 'managerName', 'hireDate', 'status', 'nationality', 'isSaudi', 'gender', 'contractType', 'contractEnd', 'email', 'phone', 'lastWorkingDay'];
var RB_DEFAULT = ['empNo', 'name', 'departmentName', 'positionName', 'hireDate', 'nationality'];
function reportBuilderSection(body){
  var box = head(body, 'rbTitle', 'rbLead'); busy(box);
  Promise.all([api('hrBootstrap', {}, true), api('customValuesAll', {}, true)]).then(function(rs){
    if (!box.isConnected) return;
    if (!rs[0].ok) return box.innerHTML = bad(rs[0].error);
    var cf = rs[1].ok ? rs[1] : { fields: [], values: {} };
    var cols = RB_BASE.map(function(k){ return { key: k, label: t('rbc_' + k), kind: k === 'hireDate' || k === 'contractEnd' || k === 'lastWorkingDay' ? 'date' : 'text' }; })
      .concat(cf.fields.map(function(f){ return { key: 'cf:' + f.id, label: lang(f.labelAr, f.labelEn), kind: f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text', cf: f }; }));
    var colOf = {}; cols.forEach(function(c){ colOf[c.key] = c; });
    var val = function(e, c){ if (c.cf) { var v = (cf.values[e.id] || {})[c.cf.id]; return v === undefined ? '' : c.cf.type === 'bool' ? t(v === 'yes' ? 'cfYes' : 'cfNo') : v; }
      if (c.key === 'isSaudi') return t(e.isSaudi ? 'rbSaudi' : 'rbNonSaudi'); if (c.key === 'contractType') return e.contractType ? t('rqc_' + e.contractType) : ''; return e[c.key] == null ? '' : String(e[c.key]).slice(0, c.kind === 'date' ? 10 : 300); };
    var S0 = S.rb || { cols: RB_DEFAULT.slice(), dept: '', status: 'active', nat: '', saudi: '', contract: '', group: '' };
    var uniq = function(k){ var o = {}; rs[0].rows.forEach(function(e){ if (e[k]) o[e[k]] = 1; }); return Object.keys(o).sort(); };
    box.innerHTML = '<div class="rb-grid"><aside class="rb-side"><h4>' + t('rbCols') + '</h4><div class="rb-cols">' + cols.map(function(c){ return '<label class="hr-check"><input type="checkbox" data-col="' + esc(c.key) + '"' + (S0.cols.indexOf(c.key) >= 0 ? ' checked' : '') + '> ' + esc(c.label) + '</label>'; }).join('') + '</div>' +
      '<h4>' + t('rbFilters') + '</h4>' + fld(t('rbc_departmentName'), '<select data-f="dept">' + opts(uniq('departmentName').map(function(d){ return [d, d]; }), S0.dept, t('rbAll')) + '</select>') +
      fld(t('rbc_status'), '<select data-f="status">' + opts(uniq('status').map(function(d){ return [d, d]; }), S0.status, t('rbAll')) + '</select>') +
      fld(t('rbc_nationality'), '<select data-f="nat">' + opts(uniq('nationality').map(function(d){ return [d, d]; }), S0.nat, t('rbAll')) + '</select>') +
      fld(t('rbc_isSaudi'), '<select data-f="saudi">' + opts([['yes', t('rbSaudi')], ['no', t('rbNonSaudi')]], S0.saudi, t('rbAll')) + '</select>') +
      fld(t('rbc_contractType'), '<select data-f="contract">' + opts([['indefinite', t('rqc_indefinite')], ['fixed', t('rqc_fixed')]], S0.contract, t('rbAll')) + '</select>') +
      fld(t('rbGroup'), '<select data-f="group">' + opts(cols.filter(function(c){ return c.kind === 'text'; }).map(function(c){ return [c.key, c.label]; }), S0.group, t('rbNoGroup')) + '</select>') +
      '</aside><section class="rb-main"><div class="toolbar"><b id="rbN"></b><span class="sp"></span><button type="button" class="btn btn-line btn-sm" id="rbPr">' + ph('printer') + t('rbPrint') + '</button> <button type="button" class="btn btn-dark btn-sm" id="rbXl">' + ph('microsoft-excel-logo') + t('rbExport') + '</button></div><div id="rbOut"></div></section></div>';
    var out = $('#rbOut', box), cur = { rows: [], cols: [] };
    function run(){
      S0.cols = $$('[data-col]', box).filter(function(x){ return x.checked; }).map(function(x){ return x.dataset.col; });
      $$('[data-f]', box).forEach(function(x){ S0[x.dataset.f] = x.value; }); S.rb = S0;
      var rows = rs[0].rows.filter(function(e){ return (!S0.dept || e.departmentName === S0.dept) && (!S0.status || e.status === S0.status) && (!S0.nat || e.nationality === S0.nat) &&
        (!S0.saudi || (S0.saudi === 'yes') === !!e.isSaudi) && (!S0.contract || e.contractType === S0.contract); });
      var cs = S0.cols.map(function(k){ return colOf[k]; }).filter(Boolean);
      cur = { rows: rows, cols: cs };
      $('#rbN', box).textContent = rows.length + ' ' + t('rbRows');
      var h = '';
      if (S0.group && colOf[S0.group]) {
        var g = {}, gc = colOf[S0.group]; rows.forEach(function(e){ var k = val(e, gc) || '-'; g[k] = (g[k] || 0) + 1; });
        var keys = Object.keys(g).sort(function(a, b){ return g[b] - g[a]; });
        h += '<h4>' + esc(gc.label) + '</h4><div class="w2-mx"><table class="rb-sum"><thead><tr><th>' + esc(gc.label) + '</th><th>' + t('rbCount') + '</th></tr></thead><tbody>' + keys.map(function(k){ return '<tr><td>' + esc(k) + '</td><td class="num">' + g[k] + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      h += cs.length ? '<div class="w2-mx"><table class="rb-tbl"><thead><tr>' + cs.map(function(c){ return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.slice(0, 1000).map(function(e){ return '<tr>' + cs.map(function(c){ var v = val(e, c); return '<td' + (c.kind !== 'text' ? ' class="num"' : '') + '>' + esc(c.kind === 'date' && v ? fmt(v) : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '';
      out.innerHTML = h || empty('table', t('w2None'));
    }
    box.addEventListener('change', function(ev){ if (ev.target.matches('[data-col],[data-f]')) run(); });
    run();
    $('#rbXl', box).onclick = function(){ var b = this; b.disabled = true; loadScript('js/xl.js').then(function(){
      var en = S.lang === 'en', title = t('rbTitle');
      return XL.download({ fileName: title + ' ' + riyadhToday(), title: title, lang: en ? 'en' : 'ar', company: coName(), by: S.me.name, logo: logoInk(),
        filters: [['dept', 'rbc_departmentName'], ['status', 'rbc_status'], ['nat', 'rbc_nationality'], ['saudi', 'rbc_isSaudi'], ['contract', 'rbc_contractType']].filter(function(k){ return S0[k[0]]; }).map(function(k){ return [t(k[1]), S0[k[0]]]; }),
        sheets: [{ name: title, title: title, columns: cur.cols.map(function(c){ return { key: c.key, label: c.label, type: c.kind === 'number' ? 'num' : 'text' }; }),
          rows: cur.rows.map(function(e){ var o = {}; cur.cols.forEach(function(c){ var v = val(e, c); o[c.key] = c.kind === 'number' && v !== '' ? Number(v) : v; }); return o; }) }] });
    }).then(function(){ b.disabled = false; }, function(){ b.disabled = false; toast(t('e_generic')); }); };
    $('#rbPr', box).onclick = function(){ if (typeof printView === 'function') printView(); else window.print(); };
  });
}

// =================================================================== the employee's own cards
function myCards(el){
  mySettleCard(el); myExitCard(el); myAnnCard(el); myKudosCard(el); myLoansCard(el); myInsCard(el); myTrainingCard(el); myDeskCard(el); myInterviewsCard(el); myCustomCard(el);
}


// =================================================================== KNOWLEDGE BASE (2026-10-19)
Object.assign(T.ar, {
  kbTitle:'قاعدة المعرفة', kbLead:'مقالات قصيرة تجيب عن الأسئلة المتكررة، تظهر للموظف وهو يكتب طلب الدعم قبل إرساله. تقيس المقالات المفيدة والطلبات التي تم تجنبها.',
  kbNew:'مقال جديد', kbSeed:'تحميل مقالات بداية', kbSeedLead:'ست مقالات بداية كمسودات؛ راجعها مع سياسة الشركة قبل النشر.', kbCat:'التصنيف', kbTitleAr:'العنوان بالعربية', kbTitleEn:'العنوان بالإنجليزية', kbBodyAr:'النص بالعربية', kbBodyEn:'النص بالإنجليزية',
  kbKeywords:'كلمات مفتاحية (للبحث)', kbStatus:'الحالة', kbs_published:'منشور', kbs_draft:'مسودة', kbs_archived:'مؤرشف', kbViews:'مشاهدات', kbHelpful:'مفيد', kbNotHelpful:'غير مفيد', kbDeflected:'طلبات تم تجنبها',
  kbSuggest:'قد تجد الجواب هنا قبل الإرسال', kbDidHelp:'هل أجاب هذا عن سؤالك؟', kbYes:'نعم، شكرا', kbNo:'لا، أكمل الطلب', kbThanks:'شكرا لك', kbBrowse:'مقالات المساعدة', kbSearch:'ابحث في المقالات'
});
Object.assign(T.en, {
  kbTitle:'Knowledge base', kbLead:'Short articles that answer common questions. They show to employees while they type a help desk ticket, before it is sent. Tracks helpful articles and tickets avoided.',
  kbNew:'New article', kbSeed:'Load starter articles', kbSeedLead:'Six starter articles as drafts; check them against company policy before publishing.', kbCat:'Category', kbTitleAr:'Title (Arabic)', kbTitleEn:'Title (English)', kbBodyAr:'Text (Arabic)', kbBodyEn:'Text (English)',
  kbKeywords:'Keywords (for search)', kbStatus:'Status', kbs_published:'Published', kbs_draft:'Draft', kbs_archived:'Archived', kbViews:'Views', kbHelpful:'Helpful', kbNotHelpful:'Not helpful', kbDeflected:'Tickets avoided',
  kbSuggest:'You may find the answer here before sending', kbDidHelp:'Did this answer your question?', kbYes:'Yes, thanks', kbNo:'No, continue', kbThanks:'Thank you', kbBrowse:'Help articles', kbSearch:'Search the articles'
});
function kbArticle(id, fromTicket, onYes){
  api('kbGet', { id: id }).then(function(r){
    if (!r.ok) return toast(errText(r.error));
    var a = r.article, body = lang(a.bodyAr, a.bodyEn);
    var d = drawer('<h3>' + esc(lang(a.titleAr, a.titleEn)) + '</h3><p class="hr-hint"><bdi>' + esc(a.ref) + '</bdi> · ' + t('hdc_' + a.category) + '</p><div style="white-space:pre-wrap;line-height:1.8">' + esc(body) + '</div>' +
      (a.status === 'published' ? '<div class="kb-fb" style="margin-top:16px;padding:12px;border-radius:12px;background:var(--paper)"><b>' + t('kbDidHelp') + '</b><div class="btnrow" style="margin-top:8px"><button type="button" class="btn btn-dark btn-sm" data-kb="1">' + t('kbYes') + '</button> <button type="button" class="btn btn-line btn-sm" data-kb="0">' + t(fromTicket ? 'kbNo' : 'w2No') + '</button></div></div>' : ''));
    $$('[data-kb]', d).forEach(function(b){ b.onclick = function(){
      var yes = b.dataset.kb === '1';
      api('kbFeedback', { id: a.id, helpful: yes, deflected: yes && !!fromTicket });
      d.remove(); if (yes) { toast(t('kbThanks')); if (onYes) onYes(); }
    }; });
  });
}
/** While an employee writes a ticket: suggestions under the subject (debounced; nothing sent under 3 letters). */
function kbSuggest(d, closeForm){
  var subj = $('[name=subject]', d), cat = $('[name=category]', d), box = document.createElement('div'), tm = 0, last = '';
  box.className = 'kb-sug'; box.hidden = true; subj.closest('.field').after(box);
  function run(){
    var q = subj.value.trim(), key = q + '|' + cat.value;
    if (key === last) return; last = key;
    if (q.length < 3) { box.hidden = true; return; }
    api('kbSearch', { q: q, category: cat.value }, true).then(function(r){
      if (!r.ok || !r.rows.length || !d.isConnected) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<p class="hr-hint" style="margin:0 0 6px">' + ph('lightbulb') + ' ' + t('kbSuggest') + '</p>' + r.rows.map(function(a){
        return '<button type="button" class="kb-row" data-id="' + esc(a.id) + '" style="display:block;width:100%;text-align:start;padding:10px 12px;margin:0 0 6px;border-radius:12px;border:1px solid var(--line);background:var(--card);font:inherit;cursor:pointer"><b>' + esc(lang(a.titleAr, a.titleEn)) + '</b><small style="display:block;color:var(--ink-3)">' + esc(lang(a.snippetAr, a.snippetEn)) + '…</small></button>';
      }).join('');
      $$('.kb-row', box).forEach(function(b){ b.onclick = function(){ kbArticle(b.dataset.id, true, closeForm); }; });
    });
  }
  subj.addEventListener('input', function(){ clearTimeout(tm); tm = setTimeout(run, 450); });
  cat.addEventListener('change', run);
}
function kbSection(body){
  var box = head(body, 'kbTitle', 'kbLead'), q = '';
  function load(){
    busy(box);
    api('kbList', {}, true).then(function(r){
      if (!box.isConnected) return;
      if (!r.ok) return box.innerHTML = bad(r.error);
      var rows = r.rows.filter(function(a){ return !q || (a.titleAr + ' ' + a.titleEn + ' ' + a.snippetAr).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
      var tot = function(k){ return r.rows.reduce(function(s, a){ return s + (a[k] || 0); }, 0); };
      var h = r.canEdit ? tiles([[t('kbs_published'), n(r.rows.filter(function(a){ return a.status === 'published'; }).length)], [t('kbViews'), n(tot('views'))], [t('kbHelpful'), n(tot('helpful'))], [t('kbDeflected'), n(tot('deflected')), '', true]]) : '';
      h += '<div class="toolbar"><input type="search" id="kbQ" value="' + esc(q) + '" placeholder="' + t('kbSearch') + '" style="flex:1;min-width:0">' + (r.canEdit ? ' <button type="button" class="btn btn-dark btn-sm" id="kbN">' + ph('plus') + t('kbNew') + '</button>' + (r.rows.length ? '' : ' <button type="button" class="btn btn-line btn-sm" id="kbS">' + ph('books') + t('kbSeed') + '</button>') : '') + '</div>';
      h += rows.length ? '<div class="list">' + rows.map(function(a){
        return '<div class="row w2-row" data-a="' + esc(a.id) + '" style="cursor:pointer"><div class="main"><b>' + esc(lang(a.titleAr, a.titleEn)) + '</b><small>' + t('hdc_' + a.category) + (r.canEdit ? sep() + t('kbViews') + ' ' + a.views + sep() + t('kbHelpful') + ' ' + a.helpful + '/' + (a.helpful + a.notHelpful) + sep() + t('kbDeflected') + ' ' + a.deflected : '') + '</small></div>' +
          '<div class="act" style="display:flex;gap:6px;align-items:center">' + (a.status !== 'published' ? chip(t('kbs_' + a.status), 'late') : '') + (r.canEdit ? '<button type="button" class="btn btn-line btn-sm" data-e="' + esc(a.id) + '">' + t('w2Edit') + '</button>' : '') + '</div></div>';
      }).join('') + '</div>' : empty('books', t('w2None'));
      box.innerHTML = h; wire(box);
      var qi = $('#kbQ', box); qi.oninput = function(){ q = qi.value; var p = qi.selectionStart; load(); setTimeout(function(){ var x = $('#kbQ', box); if (x) { x.focus(); x.setSelectionRange(p, p); } }, 60); };
      $$('[data-a]', box).forEach(function(rw){ rw.onclick = function(ev){ if (ev.target.closest('[data-e]')) return; kbArticle(rw.dataset.a, false); }; });
      $$('[data-e]', box).forEach(function(b){ b.onclick = function(){ api('kbGet', { id: b.dataset.e }).then(function(x){ if (x.ok) kbForm(x.article, r.categories, load); }); }; });
      var nb = $('#kbN', box); if (nb) nb.onclick = function(){ kbForm({}, r.categories, load); };
      var sb = $('#kbS', box); if (sb) confirmTap(sb, function(){ api('kbSeed', {}).then(function(x){ if (!x.ok) return toast(errText(x.error)); toast(t('kbSeedLead')); load(); }); });
    });
  }
  load();
}
function kbForm(a, cats, again){
  formDrawer(a.id ? t('w2Edit') : t('kbNew'), a.ref ? esc(a.ref) : '', two(fld(t('kbCat'), '<select name="category">' + keyOpts(cats, 'hdc_', a.category || 'other') + '</select>'), fld(t('kbStatus'), '<select name="status">' + keyOpts(['published', 'draft', 'archived'], 'kbs_', a.status || 'published') + '</select>')) +
    fld(t('kbTitleAr'), '<input name="titleAr" maxlength="150" required value="' + esc(a.titleAr || '') + '">') + fld(t('kbTitleEn'), '<input name="titleEn" maxlength="150" dir="ltr" value="' + esc(a.titleEn || '') + '">') +
    fld(t('kbBodyAr'), '<textarea name="bodyAr" rows="6" maxlength="6000" required>' + esc(a.bodyAr || '') + '</textarea>') + fld(t('kbBodyEn'), '<textarea name="bodyEn" rows="6" maxlength="6000" dir="ltr">' + esc(a.bodyEn || '') + '</textarea>') +
    fld(t('kbKeywords'), '<input name="keywords" maxlength="300" value="' + esc(a.keywords || '') + '">'),
    function(v){ v.id = a.id; return api('kbSave', { article: v }); }, again);
}

window.KBase = { section: kbSection };
window.Loans = { section: loansSection };
window.Desk = { section: deskSection };
window.Ann = { section: annSection };
window.Ins = { section: insSection };
window.Training = { section: trainingSection };
window.Hire = { section: recruitSection };
window.Exits = { section: exitSection };
window.Settle = { section: settleSection };
window.PayReview = { section: payReviewSection };
window.Timesheets = { section: timesheetSection };
window.OrgChart = { section: orgChartSection };
window.CustomFields = { section: customFieldsSection };
window.ReportBuilder = { section: reportBuilderSection };
window.Kudos = { section: kudosSection };
window.W2 = { myCards: myCards };
/** The screen kit, shared with js/wave4.js (2026-10-19). */
window.W2K = { lang: lang, fmt: fmt, fmtT: fmtT, money: money, sep: sep, busy: busy, bad: bad, chip: chip, empLine: empLine, av: av, empty: empty, fld: fld, chk: chk, opts: opts, mopts: mopts, two: two, refreshTasks: refreshTasks, confirmTap: confirmTap, formVals: formVals, formDrawer: formDrawer, noteDrawer: noteDrawer, tabsBar: tabsBar, head: head, tiles: tiles, n: n, wire: wire, warnList: warnList, people: people, empOpts: empOpts, deptOpts: deptOpts, posOpts: posOpts };
})();
