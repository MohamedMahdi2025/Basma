// Operations: shifts and rosters (Shifts.gs), employee relations: disciplinary cases, penalty schedule and work injuries
// (Relations.gs), company assets in custody and offboarding clearance with the Art. 64 service certificate (Custody.gs).
// HR console sections plus the employee's cards in "ملفي". Every rule is enforced by the server; this file explains the
// rule before the click and shows the server's answer after it.
(function(){
'use strict';

Object.assign(T.ar, {
  opShifts:'الورديات والجداول', opRelations:'علاقات الموظفين', opCustody:'العهد والأصول', opOffboarding:'إخلاء الطرف',
  opSave:'حفظ', opSaved:'تم الحفظ', opConfirm:'اضغط مرة أخرى للتأكيد', opCancel:'إلغاء', opSearch:'ابحث بالاسم أو الرقم', opMe:'أنا', opView:'عرض',
  opNote:'ملاحظة', opNoteOpt:'ملاحظة (اختياري)', opSent:'تم الإرسال', opCount:'العدد', opNoPeople:'لا يوجد موظفون مطابقون.',
  // shifts and rosters
  shList:'الورديات', shNew:'وردية جديدة', shEdit:'تعديل الوردية', shName:'اسم الوردية', shNameEn:'الاسم بالإنجليزية', shStart:'تبدأ', shEnd:'تنتهي',
  shDays:'أيام العمل', shNoDays:'اختر يوم عمل واحدا على الأقل.', shOutdoor:'عمل ميداني تحت الشمس (يخضع لحظر الظهيرة صيفا)', shOutdoorTag:'ميدانية', shStatus:'الحالة',
  shActive:'سارية', shDisabled:'موقوفة', shHrs:'ساعة', shLen:'مدة الوردية', shSaved:'حفظت الوردية', shNoActive:'أضف وردية سارية أولا.',
  shNone:'لا توجد ورديات بعد. أضف أول وردية ثم أسند الموظفين إليها.',
  shNoOvernight:'تنتهي الوردية في نفس اليوم: الورديات عبر منتصف الليل غير مدعومة حاليا، والحد 12 ساعة.',
  roAssign:'إسناد جدول', roLead:'الإسناد الجديد يقصر أو يستبدل أي جدول سابق يتداخل معه لنفس الموظفين. حتى 300 موظف ولمدة أقصاها سنة.',
  roShift:'الوردية', roFrom:'من', roTo:'إلى', roPeople:'الموظفون', roPick:'تحديد الظاهرين', roClear:'إلغاء التحديد', roPicked:'محدد', roMax:'300 موظف كحد أقصى في الإسناد الواحد.',
  roSaved:'أسند الجدول إلى', roReplaced:'وعدلت جداول سابقة:', roList:'الجداول في الفترة', roEmpty:'لا توجد جداول في هذه الفترة.', roDelete:'حذف الجدول', roDeleted:'حذف الجدول', roShowRange:'عرض',
  roBan:'حظر العمل تحت الشمس', roBanRow:'وردية ميدانية وقت حظر الظهيرة ابتداء من', roBanPreview:'هذه الوردية ميدانية وتتداخل مع ساعات حظر الظهيرة في الفترة المختارة ابتداء من',
  shDash:'الورديات في لمحة', shActiveT:'ورديات سارية', shPeopleT:'موظفون على جداول', shWarnT:'تنبيهات حظر الظهيرة', shOutdoorT:'ورديات ميدانية', shByShift:'الموظفون حسب الوردية',
  setTitle:'قواعد الدوام المطبقة', setRosters:'تطبيق الجداول على الحضور', setOn:'مفعل', setOff:'غير مفعل: يحسب الحضور على دوام كل موظف الخاص',
  setRamadan:'دوام رمضان (المادة 98)', setRamadanNone:'لم تحدد تواريخ رمضان بعد', setRamadanHours:'ساعات يوميا بحد أقصى للموظف المسلم', setSummer:'حظر العمل تحت الشمس وقت الظهيرة',
  setNote:'للعرض فقط. تضبط هذه القيم من الإعدادات: rostersEnabled و ramadanFrom و ramadanTo و ramadanHours، ومواعيد الحظر summerBanFrom و summerBanTo و summerBanStart و summerBanEnd. تحقق من مواعيد الحظر مع وزارة الموارد البشرية كل عام.',
  // employee relations
  rlCases:'القضايا التأديبية', rlInjuries:'إصابات العمل', rlSchedule:'لائحة الجزاءات',
  rlDash:'علاقات الموظفين في لمحة', rlOpenT:'قضايا مفتوحة', rlWaitResp:'بانتظار رد الموظف', rlReady:'جاهزة للقرار', rlObjT:'اعتراضات بانتظار البت', rlMonthT:'قرارات هذا الشهر', rlByCode:'القضايا حسب المخالفة',
  dcOpen:'فتح قضية', dcEmp:'الموظف', dcCode:'المخالفة', dcIncident:'تاريخ المخالفة', dcDiscovered:'تاريخ العلم بها', dcDesc:'وصف الواقعة: ماذا حدث ومتى وأين (10 أحرف على الأقل)',
  dc30:'تفتح القضية خلال 30 يوما من العلم بالمخالفة (المادة 71).', dcLeft:'المتبقي:', dcLastDay:'اليوم آخر يوم لفتحها.',
  dcExpired:'مضى أكثر من 30 يوما على العلم بالمخالفة؛ لا يجوز فتح القضية الآن (المادة 71).', dcFuture:'لا يكون التاريخ في المستقبل، ولا يسبق تاريخ العلم تاريخ المخالفة.',
  dcSchedFor:'الجزاء في اللائحة حسب التكرار', dcOccLead:'يحسب التكرار من نفس المخالفة خلال 180 يوما سابقة، ويقترح النظام الجزاء من اللائحة.', dcCharged:'يوجه الاتهام كتابيا ويراه الموظف في ملفه ليرد عليه.',
  occ1:'المرة الأولى', occ2:'المرة الثانية', occ3:'المرة الثالثة', occ4:'المرة الرابعة',
  dcCharge:'الاتهام', dcReportedBy:'أبلغ عنها', dcChargedAt:'وجه الاتهام في', dcResponse:'رد الموظف', dcNoResponse:'لم يرد الموظف بعد.',
  dcHearings:'محاضر التحقيق والاستماع', dcNoHearing:'لا يوجد محضر بعد. لا يوقع جزاء قبل التحقيق كتابة وسماع أقوال الموظف (المادة 71).',
  dcAddHearing:'إضافة محضر', dcDate:'التاريخ', dcAttendees:'الحضور', dcMinutes:'نص المحضر (10 أحرف على الأقل)', dcHearingSaved:'حفظ المحضر',
  dcDecide:'القرار', dcSuggested:'حسب اللائحة', dcPenalty:'الجزاء', dcNoteReq:'سبب الخروج عن اللائحة (مطلوب)', dcDecideBtn:'إصدار القرار', dcDecided:'صدر القرار', dcChanged:'خلاف اللائحة',
  dcPayrollNote:'الحسم والإيقاف يضافان إلى مسير شهر القرار، أو الشهر التالي إن كان معتمدا. الإيقاف 5 أيام في الشهر كحد أقصى (المادة 66)، ومجموع الغرامات لا يتجاوز أجر 5 أيام في الشهر (المادة 70).',
  dcNotYou:'يصدر القرار شخص من الموارد البشرية غير من أبلغ عن المخالفة.', dcDecision:'القرار', dcAmount:'المبلغ', dcMonth:'مسير شهر', dcDecidedBy:'أصدره',
  dcObjWindow:'للموظف التظلم كتابة خلال 30 يوما من تبليغه بالقرار، لا تحسب منها أيام العطل الرسمية، ويرد صاحب العمل خلال 15 يوما، ثم للموظف 30 يوما للجوء إلى المحكمة العمالية (المادة 72 المعدلة 2025؛ تحقق مع وزارة الموارد البشرية).', dcObjection:'اعتراض الموظف', dcObjDecide:'البت في الاعتراض',
  dcUpheld:'رفض الاعتراض وتثبيت الجزاء', dcCancelled:'قبول الاعتراض وإلغاء الجزاء', dcObjNote:'أسباب القرار (مطلوب)',
  dcObjLead:'يبت في الاعتراض شخص غير من أصدر القرار. إلغاء الجزاء يحذف الحسم إن لم يعتمد مسير ذلك الشهر بعد.', dcObjSelf:'أنت من أصدر القرار؛ يبت في الاعتراض زميل آخر.',
  dcResult:'نتيجة الاعتراض', dcNone:'لا توجد قضايا.', dcNoMatch:'لا توجد قضايا مطابقة.', dcAllSt:'كل الحالات',
  ds_charged:'بانتظار رد الموظف', ds_responded:'رد الموظف', ds_decided:'صدر القرار', ds_objected:'معترض عليه', ds_closed:'مغلقة', dr_upheld:'رفض الاعتراض', dr_cancelled:'ألغي الجزاء',
  pk_warning:'لفت نظر', pk_written:'إنذار كتابي', pk_fine_pct:'حسم نسبة من أجر يوم', pk_fine_days:'حسم أجر أيام', pk_suspend:'إيقاف عن العمل بدون أجر',
  pk_deny_raise:'الحرمان من العلاوة الدورية أو تأجيلها', pk_deny_promotion:'تأجيل الترقية', pk_dismiss_award:'الفصل مع مكافأة نهاية الخدمة', pk_dismiss_art80:'الفصل دون مكافأة (المادة 80)',
  pk_none:'دون جزاء', pkN:'العدد أو النسبة',
  scStarter:'هذه لائحة مبدئية؛ استبدلها باللائحة المعتمدة', scStarterLead:'بنيت تقريبيا على اللائحة النموذجية للوزارة. عدلها لتطابق لائحة تنظيم العمل المعتمدة للشركة واحفظها قبل استخدامها في قضايا فعلية.',
  scApproved:'اللائحة المعتمدة المحفوظة في النظام.', scEdit:'تعديل اللائحة', scSave:'حفظ اللائحة', scAdd:'إضافة مخالفة', scRemove:'حذف المخالفة', scCode:'الرمز', scAr:'المخالفة', scEn:'بالإنجليزية',
  scSaved:'حفظت اللائحة', scCodeHint:'حروف إنجليزية كبيرة وأرقام و _ أو -، من 2 إلى 16', scRules:'الغرامة بالأيام والإيقاف 5 أيام كحد أقصى للمخالفة الواحدة (المادة 66)، والنسبة حتى 100% من أجر يوم. يحفظ الجدول كله دفعة واحدة.',
  scDupCode:'رمز مكرر:', scBadCode:'رمز غير صحيح:', scNeedAr:'اكتب وصف كل مخالفة.', scEmpty:'أضف مخالفة واحدة على الأقل.',
  ijReport:'الإبلاغ عن إصابة عمل', ijEmp:'المصاب', ijWhen:'وقت الإصابة', ijPlace:'المكان', ijDesc:'ماذا حدث (10 أحرف على الأقل)', ijAid:'الإسعاف الأولي', ijWit:'الشهود',
  ijLead:'تبلغ الشركة التأمينات الاجتماعية خلال 3 أيام من الإصابة. أيام الانقطاع بسبب الإصابة إجازة مدفوعة ولا تحسب غيابا.', ijSaved:'سجل البلاغ',
  ijGosiDue:'موعد إبلاغ التأمينات', ijGosiLate:'تأخر إبلاغ التأمينات', ijGosiRef:'رقم بلاغ التأمينات', ijGosiSave:'تسجيل إبلاغ التأمينات', ijOff:'أيام الانقطاع (إجازة إصابة مدفوعة)',
  ijOffSave:'تسجيل أيام الانقطاع', ijClose:'إغلاق الملف', ijCloseNote:'ملاحظة الإغلاق، مثل: عاد للعمل', ijClosedNote:'ملاحظة الإغلاق', ijReportedBy:'أبلغ', ijNone:'لا توجد إصابات مسجلة.',
  ijDash:'إصابات العمل في لمحة', ijOpenT:'ملفات مفتوحة', ijLateT:'تأخر إبلاغ التأمينات', ijRecovT:'في فترة التعافي', ijClosedT:'مغلقة',
  is_reported:'مبلغ عنها', is_gosi_notified:'أبلغت التأمينات', is_recovering:'في التعافي', is_closed:'مغلقة',
  // custody
  asRegister:'تسجيل أصل', asEdit:'تعديل الأصل', asType:'النوع', asName:'الوصف', asSerial:'الرقم التسلسلي أو اللوحة', asValue:'القيمة', asNote:'ملاحظة', asRetire:'إخراج من الخدمة',
  asAssign:'تسليم', asReturn:'استلام', asHolder:'في عهدة', asSince:'منذ', asAcked:'أكد الاستلام', asNotAcked:'لم يؤكد الاستلام بعد', asCondOut:'الحالة عند التسليم', asCondDefault:'سليم',
  asAssignLead:'يصل للموظف طلب تأكيد الاستلام في التطبيق.', asCond:'الحالة عند الاستلام', asCharge:'مبلغ التحميل المقترح',
  asChargeLead:'اقتراح فقط: يعتمده شخص لديه صلاحية الرواتب غير من اقترحه، ثم يخصم في أول مسير مفتوح، ويسري حد الخصم (نصف الأجر). راجع المادة 91 لتقدير المبلغ.',
  asChargeMax:'بحد أقصى قيمة الأصل:', asNone:'لا توجد أصول مسجلة بعد.', asNoMatch:'لا توجد أصول مطابقة.', asCharges:'تحميلات بانتظار اعتماد الرواتب', asApprove:'اعتماد الخصم', asReject:'رفض',
  asRejectNote:'سبب الرفض', asNoCharges:'لا توجد تحميلات بانتظار الاعتماد.', asPayrollOnly:'يعتمدها من لديه صلاحية الرواتب، غير من اقترحها وغير الموظف نفسه.',
  asAllTypes:'كل الأنواع', asAllSt:'كل الحالات', asSaved:'حفظ الأصل', asAssigned:'سلم الأصل', asReturned:'سجل الاستلام', asApproved:'اعتمد الخصم', asRejected:'رفض التحميل',
  asPayrollView:'تظهر هنا تحميلات العهد التي تنتظر اعتمادك.', asProposedBy:'اقترحه',
  ac_good:'سليم', ac_damaged:'تالف', ac_lost:'مفقود',
  at_vehicle:'مركبة', at_pos:'جهاز نقاط بيع', at_phone:'جوال', at_laptop:'حاسب محمول', at_uniform:'زي رسمي', at_cylinders:'أسطوانات', at_card:'بطاقة', at_tool:'أداة', at_other:'أخرى',
  ast_available:'متاح', ast_assigned:'في عهدة', ast_lost:'مفقود', ast_retired:'خارج الخدمة',
  asDash:'العهد في لمحة', asTotalT:'الأصول المسجلة', asHeldT:'في عهدة موظفين', asAvailT:'متاحة للتسليم', asNoAckT:'بانتظار تأكيد الاستلام', asValueT:'قيمة ما في العهدة', asChargesT:'تحميلات تنتظر', asByType:'الأصول حسب النوع',
  // offboarding
  obStart:'بدء إخلاء طرف', obEmp:'الموظف', obLastDay:'آخر يوم عمل', obReason:'السبب',
  obLead:'يبدأ تلقائيا عند اعتماد الاستقالة. المهام موزعة على المدير والموارد البشرية والرواتب، وتغلق العهد وحدها عند إعادة كل شيء. صرف المخالصة آخر خطوة.',
  obNone:'لا توجد إجراءات إخلاء طرف.', obTasks:'المهام', obLeft:'متبق', obPast:'انتهت منذ', obToday:'اليوم آخر يوم', obCleared:'مكتمل', obOpen:'جار', obHeld:'عهد لم تعد',
  obPaidLock:'يتاح بعد اكتمال كل المهام الأخرى، ويصرفه شخص غير معد المخالصة.', obDone:'تم', obConfirm:'تأكيد', obTicked:'سجلت المهمة', obStarted:'بدأ إخلاء الطرف',
  obCert:'طباعة شهادة الخدمة', obCertLead:'شهادة الخدمة (المادة 64): الاسم والرقم الوظيفي والوظيفة وتاريخ الالتحاق وآخر يوم عمل، دون أي بيانات عن الأجر.',
  or_resignation:'استقالة', or_termination:'إنهاء من الشركة', or_contract_end:'انتهاء العقد', or_retirement:'تقاعد', or_other:'أخرى',
  ob_manager:'المدير', ob_hr:'الموارد البشرية', ob_payroll:'الرواتب', ob_system:'تلقائي',
  obDash:'إخلاء الطرف في لمحة', obOpenT:'إجراءات جارية', obSoonT:'آخر يوم خلال 14 يوما', obMineT:'مهام بانتظارك', obHeldT:'لم يعيدوا العهد', obByOwner:'المهام المفتوحة حسب المسؤول',
  ceTitle:'شهادة خدمة', ceRef:'الرقم', ceDate:'التاريخ', ceName:'الاسم', ceNo:'الرقم الوظيفي', cePos:'الوظيفة', ceHire:'تاريخ الالتحاق بالعمل', ceLast:'آخر يوم عمل',
  ceHr:'إدارة الموارد البشرية', ceSign:'التوقيع', ceStamp:'الختم', ceVerify:'للتحقق من هذه الشهادة تواصل مع الموارد البشرية بذكر الرقم', ceLoading:'جار إعداد الشهادة...', cePopup:'اسمح بالنوافذ المنبثقة لهذا الموقع ثم اضغط طباعة الشهادة مرة أخرى.',
  // my file
  myAssets:'عهدتي', myAck:'تأكيد الاستلام', myAcked:'تم تأكيد الاستلام', myAckLead:'بتأكيدك تقر باستلام الأصل بالحالة المذكورة عند التسليم.', myHanded:'سلم في',
  myCharge:'تحميل مقترح بانتظار الاعتماد', myCases:'المخالفات', myNewCase:'بانتظار ردك', myResponded:'أرسلت ردك، والقضية قيد المراجعة', myRespond:'الرد', myRespondT:'ردك على الاتهام',
  myRespondLead:'اكتب ردك وأسبابك وما يثبتها. يطلع عليه المختص قبل أي قرار، ولا يصدر جزاء قبل سماع أقوالك.', mySendResp:'إرسال الرد',
  dcNotified:'تاريخ التبليغ', dcObjDue:'آخر يوم للتظلم', dcDecideDue:'يرد صاحب العمل قبل', dcDecideLate:'تأخر الرد على التظلم', dcNotice:'تسجيل تاريخ التبليغ', dcNoticeLead:'يحسب أجل التظلم من يوم تبليغ الموظف بالقرار. إن بلغ في يوم غير يوم القرار فسجله هنا.',
  myObject:'اعتراض', myObjectT:'اعتراضك على القرار', myObjLeft:'المتبقي للاعتراض:', myObjLead:'يحق لك التظلم كتابة خلال 30 يوما من تبليغك بالقرار، لا تحسب منها العطل الرسمية (المادة 72). يبت فيه شخص غير من أصدر القرار خلال 15 يوما.',
  mySendObj:'إرسال الاعتراض', myObjPending:'اعتراضك قيد المراجعة.', myInjury:'إصابات العمل', myInjBtn:'الإبلاغ عن إصابة',
  myInjLead:'إذا أصبت أثناء العمل أو بسببه أبلغ فورا، ولو كانت الإصابة بسيطة. تبلغ الشركة التأمينات خلال 3 أيام.',
  // server errors
  e_too_late:'فات الموعد النظامي لهذا الإجراء.', e_open_too_late:'مضى أكثر من 30 يوما على العلم بالمخالفة؛ لا يجوز فتح القضية (المادة 71).',
  e_object_too_late:'انتهت مهلة التظلم: 30 يوما من التبليغ بالقرار (المادة 72).', e_hearing_required:'سجل محضر تحقيق أو استماع قبل إصدار الجزاء (المادة 71).',
  e_bad_penalty:'جزاء غير صحيح: الغرامة بالأيام والإيقاف 5 أيام كحد أقصى، والنسبة من 1 إلى 100%.', e_suspension_cap:'يتجاوز الإيقاف بهذا القرار 5 أيام في الشهر (المادة 66).',
  e_overnight_not_supported:'يجب أن تنتهي الوردية بعد بدايتها في نفس اليوم؛ الورديات عبر منتصف الليل غير مدعومة حاليا.', e_shift_too_long:'الوردية 12 ساعة كحد أقصى.',
  e_asset_not_available:'الأصل غير متاح للتسليم: في عهدة موظف آخر أو خارج الخدمة.', e_duplicate_serial:'هذا الرقم التسلسلي مسجل لأصل آخر.', e_charge_over_value:'مبلغ التحميل أكبر من قيمة الأصل.',
  e_clearance_incomplete:'لا تصرف المخالصة قبل اكتمال كل المهام الأخرى.',
  e_charge_second_approver_required:'يعتمد الخصم شخص من الرواتب غير من اقترحه وغير الموظف نفسه.', e_decide_second_approver_required:'لا يصدر القرار من أبلغ عن المخالفة؛ يصدره زميل آخر في الموارد البشرية.',
  e_objection_second_approver_required:'يبت في الاعتراض شخص غير من أصدر القرار.', e_paid_second_approver_required:'يصرف المخالصة شخص من الرواتب غير من أعدها.',
  e_decide_note_required:'اكتب سبب الخروج عن اللائحة.', e_objection_note_required:'اكتب أسباب البت في الاعتراض.', e_close_note_required:'اكتب ملاحظة الإغلاق.',
  e_roster_range_too_long:'الجدول سنة واحدة كحد أقصى.', e_clearance_already_exists:'يوجد إجراء إخلاء طرف مفتوح لهذا الموظف.',
  e_return_forbidden:'لا تسجل استلام عهدة في عهدتك أنت، ويقترح التحميل موظف بدور الموارد البشرية لا مسؤول النظام وحده.',
  e_decide_forbidden:'الغرامة والإيقاف حسم من الأجر، فيصدرهما موظف بدور الموارد البشرية لا مسؤول النظام وحده.', e_objection_forbidden:'البت في جزاء فيه حسم من الأجر لموظف بدور الموارد البشرية.', e_task_forbidden:'هذه المهمة لمسؤول آخر، ولا يسجل الموظف مهام إخلاء طرفه.',
  e_open_forbidden:'تفتح القضية الموارد البشرية أو مدير الموظف، ولا يفتحها أحد على نفسه.', e_injury_forbidden:'تبلغ عن نفسك، أو عن فريقك إن كنت مديرا.'
});
Object.assign(T.en, {
  opShifts:'Shifts and rosters', opRelations:'Employee relations', opCustody:'Company assets', opOffboarding:'Offboarding',
  opSave:'Save', opSaved:'Saved', opConfirm:'Tap again to confirm', opCancel:'Cancel', opSearch:'Search by name or number', opMe:'Me', opView:'View',
  opNote:'Note', opNoteOpt:'Note (optional)', opSent:'Sent', opCount:'Count', opNoPeople:'No matching people.',
  shList:'Shifts', shNew:'New shift', shEdit:'Edit shift', shName:'Shift name', shNameEn:'Name in English', shStart:'Starts', shEnd:'Ends',
  shDays:'Working days', shNoDays:'Pick at least one working day.', shOutdoor:'Outdoor work in the sun (the summer midday ban applies)', shOutdoorTag:'Outdoor', shStatus:'Status',
  shActive:'Active', shDisabled:'Stopped', shHrs:'h', shLen:'Length', shSaved:'Shift saved', shNoActive:'Add an active shift first.',
  shNone:'No shifts yet. Add the first one, then put people on it.',
  shNoOvernight:'A shift ends on the same day: shifts across midnight are not supported yet, and the limit is 12 hours.',
  roAssign:'Assign roster', roLead:'A new assignment cuts back or replaces any earlier roster that overlaps it for the same people. Up to 300 people and one year.',
  roShift:'Shift', roFrom:'From', roTo:'To', roPeople:'People', roPick:'Select shown', roClear:'Clear', roPicked:'selected', roMax:'At most 300 people in one assignment.',
  roSaved:'Roster assigned to', roReplaced:'earlier rosters changed:', roList:'Rosters in the period', roEmpty:'No rosters in this period.', roDelete:'Delete roster', roDeleted:'Roster deleted', roShowRange:'Show',
  roBan:'Summer midday ban', roBanRow:'Outdoor shift during the midday ban from', roBanPreview:'This outdoor shift overlaps the midday ban hours in the chosen period, from',
  shDash:'Shifts at a glance', shActiveT:'Active shifts', shPeopleT:'People on rosters', shWarnT:'Midday ban warnings', shOutdoorT:'Outdoor shifts', shByShift:'People by shift',
  setTitle:'Working-time rules in force', setRosters:'Rosters drive attendance', setOn:'On', setOff:'Off: attendance uses each person\'s own hours',
  setRamadan:'Ramadan hours (Art. 98)', setRamadanNone:'No Ramadan dates set yet', setRamadanHours:'hours a day at most for Muslim employees', setSummer:'Midday ban on outdoor work',
  setNote:'Read only. These values are set in settings: rostersEnabled, ramadanFrom, ramadanTo, ramadanHours, and the ban dates summerBanFrom, summerBanTo, summerBanStart, summerBanEnd. Check the ban dates with HRSD every year.',
  rlCases:'Disciplinary cases', rlInjuries:'Work injuries', rlSchedule:'Penalty schedule',
  rlDash:'Employee relations at a glance', rlOpenT:'Open cases', rlWaitResp:'Waiting for the employee', rlReady:'Ready for a decision', rlObjT:'Objections to rule on', rlMonthT:'Decisions this month', rlByCode:'Cases by violation',
  dcOpen:'Open case', dcEmp:'Employee', dcCode:'Violation', dcIncident:'Date of the violation', dcDiscovered:'Date it became known', dcDesc:'What happened, when and where (at least 10 characters)',
  dc30:'A case is opened within 30 days of learning of the violation (Art. 71).', dcLeft:'Left:', dcLastDay:'Today is the last day to open it.',
  dcExpired:'More than 30 days since the violation became known; the case can no longer be opened (Art. 71).', dcFuture:'Dates cannot be in the future, and the date it became known cannot be before the violation.',
  dcSchedFor:'Penalty in the schedule by occurrence', dcOccLead:'The occurrence counts the same violation in the previous 180 days; the schedule suggests the penalty.', dcCharged:'The charge is written and the employee sees it in their file to answer.',
  occ1:'1st time', occ2:'2nd time', occ3:'3rd time', occ4:'4th time',
  dcCharge:'Charge', dcReportedBy:'Reported by', dcChargedAt:'Charged on', dcResponse:'Employee\'s answer', dcNoResponse:'The employee has not answered yet.',
  dcHearings:'Hearing and investigation minutes', dcNoHearing:'No minutes yet. No penalty before a written investigation that hears the employee (Art. 71).',
  dcAddHearing:'Add minutes', dcDate:'Date', dcAttendees:'Attendees', dcMinutes:'Minutes (at least 10 characters)', dcHearingSaved:'Minutes saved',
  dcDecide:'Decision', dcSuggested:'Schedule', dcPenalty:'Penalty', dcNoteReq:'Why the penalty differs from the schedule (required)', dcDecideBtn:'Issue decision', dcDecided:'Decision issued', dcChanged:'Differs from schedule',
  dcPayrollNote:'Fines and suspensions go to the payroll of the decision month, or the next one if it is approved. Suspension is at most 5 days a month (Art. 66) and fines at most 5 days\' wage a month (Art. 70).',
  dcNotYou:'The decision is taken by someone in HR other than the person who reported it.', dcDecision:'Decision', dcAmount:'Amount', dcMonth:'Payroll month', dcDecidedBy:'Decided by',
  dcObjWindow:'The employee may file a written grievance within 30 days of being notified, official holidays not counted; the employer answers within 15 days, then the employee has 30 days to go to the labour court (Art. 72 as amended in 2025; verify with HRSD).', dcObjection:'Employee\'s objection', dcObjDecide:'Rule on the objection',
  dcUpheld:'Reject the objection, keep the penalty', dcCancelled:'Accept the objection, cancel the penalty', dcObjNote:'Reasons (required)',
  dcObjLead:'Someone other than the decision maker rules on an objection. Cancelling removes the deduction if that month\'s payroll is not approved yet.', dcObjSelf:'You took this decision; a colleague rules on the objection.',
  dcResult:'Objection outcome', dcNone:'No cases.', dcNoMatch:'No matching cases.', dcAllSt:'Any status',
  ds_charged:'Waiting for the employee', ds_responded:'Answered', ds_decided:'Decided', ds_objected:'Objected', ds_closed:'Closed', dr_upheld:'Objection rejected', dr_cancelled:'Penalty cancelled',
  pk_warning:'Notice', pk_written:'Written warning', pk_fine_pct:'Deduct a share of a day\'s wage', pk_fine_days:'Deduct days\' wage', pk_suspend:'Suspension without pay',
  pk_deny_raise:'Withhold or defer the annual raise', pk_deny_promotion:'Defer promotion', pk_dismiss_award:'Dismissal with end-of-service award', pk_dismiss_art80:'Dismissal without award (Art. 80)',
  pk_none:'No penalty', pkN:'Number or percent',
  scStarter:'This is a starter schedule; replace it with the approved one', scStarterLead:'Loosely based on the ministry\'s model regulation. Edit it to match the company\'s approved work regulation and save it before using it for real cases.',
  scApproved:'The approved schedule saved in the system.', scEdit:'Edit schedule', scSave:'Save schedule', scAdd:'Add violation', scRemove:'Remove violation', scCode:'Code', scAr:'Violation (Arabic)', scEn:'In English',
  scSaved:'Schedule saved', scCodeHint:'Capital letters, digits, _ or -, 2 to 16', scRules:'Fines in days and suspensions are at most 5 days per violation (Art. 66); a percentage is up to 100% of a day\'s wage. The whole schedule is saved at once.',
  scDupCode:'Repeated code:', scBadCode:'Invalid code:', scNeedAr:'Describe every violation.', scEmpty:'Add at least one violation.',
  ijReport:'Report a work injury', ijEmp:'Injured person', ijWhen:'When it happened', ijPlace:'Where', ijDesc:'What happened (at least 10 characters)', ijAid:'First aid given', ijWit:'Witnesses',
  ijLead:'The company notifies GOSI within 3 days of the injury. Days off for the injury are paid leave and never count as absence.', ijSaved:'Report recorded',
  ijGosiDue:'GOSI notice due', ijGosiLate:'GOSI notice overdue', ijGosiRef:'GOSI notification number', ijGosiSave:'Record GOSI notification', ijOff:'Days off (paid injury leave)',
  ijOffSave:'Record days off', ijClose:'Close the file', ijCloseNote:'Closing note, e.g. back at work', ijClosedNote:'Closing note', ijReportedBy:'Reported by', ijNone:'No injuries recorded.',
  ijDash:'Work injuries at a glance', ijOpenT:'Open files', ijLateT:'GOSI notice overdue', ijRecovT:'Recovering', ijClosedT:'Closed',
  is_reported:'Reported', is_gosi_notified:'GOSI notified', is_recovering:'Recovering', is_closed:'Closed',
  asRegister:'Register asset', asEdit:'Edit asset', asType:'Type', asName:'Description', asSerial:'Serial or plate number', asValue:'Value', asNote:'Note', asRetire:'Retire from service',
  asAssign:'Hand over', asReturn:'Take back', asHolder:'Held by', asSince:'since', asAcked:'Receipt confirmed', asNotAcked:'Receipt not confirmed yet', asCondOut:'Condition at hand-over', asCondDefault:'Good',
  asAssignLead:'The employee is asked to confirm receipt in the app.', asCond:'Condition on return', asCharge:'Proposed charge',
  asChargeLead:'A proposal only: someone with payroll access other than the proposer approves it, then it is deducted in the first open payroll, within the half-wage cap. See Art. 91 for the amount.',
  asChargeMax:'At most the asset value:', asNone:'No assets registered yet.', asNoMatch:'No matching assets.', asCharges:'Charges waiting for payroll approval', asApprove:'Approve deduction', asReject:'Reject',
  asRejectNote:'Reason for rejecting', asNoCharges:'No charges waiting for approval.', asPayrollOnly:'Approved by someone with payroll access, other than the proposer and the employee.',
  asAllTypes:'All types', asAllSt:'Any status', asSaved:'Asset saved', asAssigned:'Asset handed over', asReturned:'Return recorded', asApproved:'Deduction approved', asRejected:'Charge rejected',
  asPayrollView:'Asset charges waiting for your approval show here.', asProposedBy:'proposed by',
  ac_good:'Good', ac_damaged:'Damaged', ac_lost:'Lost',
  at_vehicle:'Vehicle', at_pos:'POS device', at_phone:'Phone', at_laptop:'Laptop', at_uniform:'Uniform', at_cylinders:'Cylinders', at_card:'Card', at_tool:'Tool', at_other:'Other',
  ast_available:'Available', ast_assigned:'In custody', ast_lost:'Lost', ast_retired:'Retired',
  asDash:'Company assets at a glance', asTotalT:'Registered assets', asHeldT:'Held by employees', asAvailT:'Available', asNoAckT:'Waiting for receipt', asValueT:'Value in custody', asChargesT:'Charges waiting', asByType:'Assets by type',
  obStart:'Start clearance', obEmp:'Employee', obLastDay:'Last working day', obReason:'Reason',
  obLead:'Starts by itself when a resignation is approved. Tasks go to the manager, HR and payroll; assets clear by themselves once everything is back. Paying the settlement is the last step.',
  obNone:'No clearances.', obTasks:'Tasks', obLeft:'left', obPast:'ended', obToday:'Last day today', obCleared:'Cleared', obOpen:'In progress', obHeld:'Assets not returned',
  obPaidLock:'Opens once every other task is done; paid by someone other than the preparer.', obDone:'Done', obConfirm:'Confirm', obTicked:'Task recorded', obStarted:'Clearance started',
  obCert:'Print service certificate', obCertLead:'Service certificate (Art. 64): name, employee number, position, start date and last working day, with no pay figures.',
  or_resignation:'Resignation', or_termination:'Termination', or_contract_end:'Contract end', or_retirement:'Retirement', or_other:'Other',
  ob_manager:'Manager', ob_hr:'HR', ob_payroll:'Payroll', ob_system:'Automatic',
  obDash:'Offboarding at a glance', obOpenT:'Clearances in progress', obSoonT:'Last day within 14 days', obMineT:'Tasks waiting for you', obHeldT:'Assets not returned', obByOwner:'Open tasks by owner',
  ceTitle:'Service Certificate', ceRef:'Ref', ceDate:'Date', ceName:'Name', ceNo:'Employee No.', cePos:'Position', ceHire:'Start date', ceLast:'Last working day',
  ceHr:'Human Resources Department', ceSign:'Signature', ceStamp:'Stamp', ceVerify:'Verify this certificate with HR quoting reference', ceLoading:'Preparing the certificate...', cePopup:'Allow pop-ups for this site, then tap print certificate again.',
  myAssets:'My company assets', myAck:'Confirm receipt', myAcked:'Receipt confirmed', myAckLead:'By confirming you accept receipt of the asset in the condition recorded at hand-over.', myHanded:'Handed over',
  myCharge:'Proposed charge waiting for approval', myCases:'Disciplinary cases', myNewCase:'Waiting for your answer', myResponded:'You answered; the case is under review', myRespond:'Answer', myRespondT:'Your answer to the charge',
  myRespondLead:'Write your answer, your reasons and anything that supports them. It is read before any decision, and no penalty is given before you are heard.', mySendResp:'Send answer',
  dcNotified:'Notified on', dcObjDue:'Last day to file a grievance', dcDecideDue:'Employer answers by', dcDecideLate:'Grievance answer overdue', dcNotice:'Record notice date', dcNoticeLead:'The grievance window runs from the day the employee was notified. If that was not the decision day, record it here.',
  myObject:'Object', myObjectT:'Your objection to the decision', myObjLeft:'Left to object:', myObjLead:'You may file a written grievance within 30 days of being notified, official holidays not counted (Art. 72). Someone other than the decision maker rules on it within 15 days.',
  mySendObj:'Send objection', myObjPending:'Your objection is being reviewed.', myInjury:'Work injuries', myInjBtn:'Report an injury',
  myInjLead:'If you are hurt at or because of work, report it at once, even if it seems minor. The company notifies GOSI within 3 days.',
  e_too_late:'The legal deadline for this step has passed.', e_open_too_late:'More than 30 days since the violation became known; the case cannot be opened (Art. 71).',
  e_object_too_late:'The grievance window has closed: 30 days from notice of the decision (Art. 72).', e_hearing_required:'Record hearing or investigation minutes before a penalty (Art. 71).',
  e_bad_penalty:'Invalid penalty: fines in days and suspensions are at most 5 days, a percentage from 1 to 100.', e_suspension_cap:'This would take suspension over 5 days in the month (Art. 66).',
  e_overnight_not_supported:'The shift must end after it starts on the same day; shifts across midnight are not supported yet.', e_shift_too_long:'A shift is at most 12 hours.',
  e_asset_not_available:'The asset is not available: someone holds it or it is retired.', e_duplicate_serial:'This serial number belongs to another asset.', e_charge_over_value:'The charge is more than the asset value.',
  e_clearance_incomplete:'The settlement is paid only after every other task is done.',
  e_charge_second_approver_required:'Someone in payroll other than the proposer, and not the employee, approves the deduction.', e_decide_second_approver_required:'The person who reported the violation cannot decide it; another HR colleague does.',
  e_objection_second_approver_required:'Someone other than the decision maker rules on the objection.', e_paid_second_approver_required:'Someone in payroll other than the preparer pays the settlement.',
  e_decide_note_required:'Say why the penalty differs from the schedule.', e_objection_note_required:'Give the reasons for the ruling.', e_close_note_required:'Write a closing note.',
  e_roster_range_too_long:'A roster covers one year at most.', e_clearance_already_exists:'This person already has an open clearance.',
  e_return_forbidden:'You cannot record the return of an asset you hold, and a charge is proposed by someone with the hr role, not an administrator alone.',
  e_decide_forbidden:'Fines and suspensions are pay deductions: someone with the hr role decides them, not an administrator alone.', e_objection_forbidden:'Ruling on a penalty with a pay deduction is for someone with the hr role.', e_task_forbidden:'This task belongs to someone else, and nobody ticks their own clearance.',
  e_open_forbidden:'HR or the employee\'s manager opens a case, and nobody opens one on themselves.', e_injury_forbidden:'Report for yourself, or for your team if you are a manager.'
});
// Generic errors other screens usually define; only filled when missing (e.g. in "ملفي" before the HR console loads).
[['ar', { e_not_found:'السجل غير موجود أو تغيرت حالته. حدث الصفحة.', e_bad_date:'تاريخ غير صحيح.', e_bad_value:'قيمة غير مقبولة.', e_note_required:'اكتب ملاحظة.', e_bad_range:'تاريخ البداية بعد تاريخ النهاية.', e_already_exists:'موجود مسبقا.' }],
 ['en', { e_not_found:'Record not found or its status changed. Refresh the page.', e_bad_date:'Invalid date.', e_bad_value:'Value not accepted.', e_note_required:'Write a note.', e_bad_range:'The start date is after the end date.', e_already_exists:'Already exists.' }]]
  .forEach(function(p){ Object.keys(p[1]).forEach(function(k){ if (T[p[0]][k] === undefined) T[p[0]][k] = p[1][k]; }); });

var css = '' +
'.op-tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin:0 0 16px;overflow-x:auto;scrollbar-width:none}.op-tabs::-webkit-scrollbar{display:none}' +
'.op-tabs button{flex:none;display:inline-flex;align-items:center;gap:7px;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:10px 12px;color:var(--ink-2);font-size:14px;cursor:pointer}' +
'.op-tabs button i{font-size:17px}.op-tabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--brand);font-weight:500}.op-tabs button:focus-visible{outline:2px solid var(--brand);outline-offset:-2px}' +
'.op-bar{height:8px;background:#EEEBE3;border-radius:999px;overflow:hidden;margin-top:6px}.op-bar i{display:block;height:100%;background:#2E7D4F;border-radius:999px}' +
'.row.warn{background:#FDF6E7;border-inline-start:3px solid #C98500}.row.warn.click:hover{background:#FBEFD6}' +
'.op-warn{display:flex;align-items:center;gap:5px;color:#8A5A00;font-size:12.5px;margin-top:3px}.op-late{color:#B42318}.op-sub{display:block;margin-top:2px}' +
'.op-acts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex:none}' +
'.op-box{background:var(--card);border-radius:14px;padding:14px 16px;margin:0 0 12px;box-shadow:0 1px 2px rgba(28,42,31,.05),0 8px 22px -16px rgba(28,42,31,.28)}' +
'.op-box > h4,.op-h4{margin:0 0 8px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px}.op-h4{margin:18px 0 8px}.op-box > h4 i,.op-h4 i{color:var(--brand);font-size:17px}' +
'.op-meta{display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);gap:5px 14px;margin:0 0 10px;font-size:13.5px}.op-meta dt{color:var(--ink-2)}.op-meta dd{margin:0;min-width:0}' +
'.op-quote{white-space:pre-wrap;background:var(--card);border-inline-start:3px solid var(--line);border-radius:8px;padding:10px 12px;margin:4px 0 10px;font-size:14px;line-height:1.8}' +
'.op-set{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 18px}.op-set b{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;margin-bottom:3px}.op-set > div > span{font-size:13px;color:var(--ink-2)}' +
'.op-pick{display:flex;gap:6px;align-items:center}.op-pick select{flex:1;min-width:0}.op-pick input{width:78px!important;flex:none;text-align:center}' +
'.op-pen{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.op-pen .field label{font-size:12px}' +
'.op-people{max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:var(--r-s);background:var(--card)}' +
'.op-people label{display:flex;gap:10px;align-items:center;padding:9px 12px;border-bottom:1px solid #EEEBE3;cursor:pointer;font-size:14px;color:var(--ink)}.op-people label:last-child{border-bottom:0}.op-people small{color:var(--ink-2);margin-inline-start:auto}' +
'.op-task{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #EEEBE3}.op-task:first-child{border-top:0}.op-task .main{flex:1;min-width:0}.op-task b{font-weight:500;font-size:14px;display:block}' +
'.op-task small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:2px}.op-task > i{font-size:20px;color:var(--ink-2);margin-top:1px}.op-task.done > i{color:#2E7D4F}.op-task.done b{color:var(--ink-2)}' +
'.op-inline{display:flex;gap:6px;margin-top:8px}.op-inline input{flex:1;min-width:0;height:38px;border:1px solid var(--line);border-radius:var(--r-s);padding:0 10px;background:var(--card)}' +
'.op-tbl td{white-space:normal;vertical-align:top;min-width:120px}.op-tbl td:first-child{min-width:0}' +
'.op-card h3 .sp{flex:1}.op-card .row{padding:10px 0;border-bottom:1px solid #EEEBE3}.op-card .row:last-of-type{border-bottom:0}' +
'.hr-hint{color:var(--ink-2);font-size:12.5px;margin-top:4px}.hr-bad{color:var(--red,#B42318);font-size:12.5px;margin-top:4px}' +
'@media (max-width:640px){.op-pen{grid-template-columns:repeat(2,minmax(0,1fr))}.op-meta{grid-template-columns:minmax(0,1fr)}.op-meta dt{margin-top:4px}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ---------------- helpers ----------------
var uid = 0;
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, manager: false }; }
function fmt(d){ return d ? new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
/** A timestamp or a date as the Riyadh calendar day. */
function day(iso){ var ms = Date.parse(iso); return isNaN(ms) ? String(iso || '').slice(0, 10) : new Date(ms + 180 * 60000).toISOString().slice(0, 10); }
/** "2026-11-03T10:30" (local time from a datetime-local field). */
function fmtLocal(s){ s = String(s || ''); return s ? fmt(s) + (s.length >= 16 ? ' <bdi class="num">' + esc(s.slice(11, 16)) + '</bdi>' : '') : ''; }
function monthName(m){ return m ? new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 15)).toLocaleDateString(LOCALE(), { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; }
function riyadhNow(){ return new Date(Date.now() + 180 * 60000).toISOString().slice(0, 16); }
function addDays(d, n){ return new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
function daysBetween(a, b){ return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
function hmMin(s){ var m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? +m[1] * 60 + +m[2] : 0; }
function sar(){ var v = t('mfSar'); return v === 'mfSar' ? (S.lang === 'en' ? 'SAR' : 'ر.س') : v; }
function money(n){ return '<span class="num">' + Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + '</span> ' + sar(); }
function moneyTxt(n){ return Number(n || 0).toLocaleString(LOCALE(), { maximumFractionDigits: 2 }) + ' ' + sar(); }
function comma(){ return S.lang === 'en' ? ', ' : '، '; }
/** 8 -> "8 ساعات", 2 -> "ساعتان", 12 -> "12 ساعة", 7.5 -> "7.5 ساعة"; "8 h" in English. */
function hours(n){
  var v = Number(n) || 0, s = v.toLocaleString(LOCALE(), { maximumFractionDigits: 1 });
  if (S.lang === 'en') return s + ' h';
  if (v === 1) return 'ساعة واحدة';
  if (v === 2) return 'ساعتان';
  return s + (v % 1 === 0 && v >= 3 && v <= 10 ? ' ساعات' : ' ساعة');
}
function busy(el){ el.innerHTML = '<div class="list">' + [0, 1, 2].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%;margin-top:6px"></span></div></div>'; }).join('') + '</div>'; }
/** Server error text; ctx picks a message for this screen first (e_<ctx>_<code>), e.g. which "second person" rule it was. */
function oerr(code, ctx){ var v = ctx && T[S.lang]['e_' + ctx + '_' + code]; return v || errText(code); }
function bad(code, ctx){ return '<p class="hr-bad" role="alert">' + esc(oerr(code, ctx)) + '</p>'; }
function head(title, acts){ return '<div class="hr-h"><h2>' + title + '</h2>' + (acts || '') + '</div>'; }
function btn(id, icon, label, kind){ return '<button type="button" class="btn btn-' + (kind || 'dark') + ' btn-sm" id="' + id + '">' + ph(icon) + label + '</button>'; }
/** A labelled field; the label is tied to the control with a generated id. */
function fld(label, control, hint){
  var id = 'opf' + (++uid);
  return '<div class="field"><label for="' + id + '">' + label + '</label>' + control.replace(/^<(input|select|textarea)/, '<$1 id="' + id + '"') + (hint ? '<small class="hr-hint">' + hint + '</small>' : '') + '</div>';
}
function chip(label, cls){ return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + '</span>'; }
function bar(p){ return '<div class="op-bar" role="presentation"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }
function empName(e){ return e ? esc(lang(e.name, e.nameEn)) : '-'; }
function empLine(e){ return e ? empName(e) + ' <bdi class="num">' + esc(e.empNo) + '</bdi>' : '-'; }
function av(e){ return '<div class="av">' + esc(initials(e ? e.name : '')) + '</div>'; }
function empty(icon, text){ return '<div class="empty">' + ph(icon) + '<b>' + text + '</b></div>'; }
function meta(rows){
  rows = rows.filter(function(r){ return r[1] !== '' && r[1] != null; });
  return rows.length ? '<dl class="op-meta">' + rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' : '';
}
function quote(s){ return s ? '<div class="op-quote">' + esc(s) + '</div>' : ''; }
function opts(list, cur, none){ return (none != null ? '<option value="">' + none + '</option>' : '') + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
function tabs(list, cur){ return '<div class="op-tabs" role="tablist">' + list.map(function(x){ return '<button type="button" role="tab" data-tab="' + x[0] + '" aria-selected="' + (cur === x[0]) + '" tabindex="' + (cur === x[0] ? 0 : -1) + '">' + ph(x[1]) + t(x[2]) + '</button>'; }).join('') + '</div>'; }
/** Tabs: click, and arrow keys that follow the reading direction. */
function wireTabs(root, go){
  var bs = $$('[role=tab]', root);
  bs.forEach(function(b, n){
    b.onclick = function(){ go(b.dataset.tab); };
    b.onkeydown = function(ev){
      var fwd = S.lang === 'ar' ? 'ArrowLeft' : 'ArrowRight', back = S.lang === 'ar' ? 'ArrowRight' : 'ArrowLeft';
      var m = ev.key === fwd ? (n + 1) % bs.length : ev.key === back ? (n - 1 + bs.length) % bs.length : -1;
      if (m >= 0) { ev.preventDefault(); go(bs[m].dataset.tab, true); }
    };
  });
}
function clickable(nodes, fn){ nodes.forEach(function(x){ x.onclick = function(){ fn(x); }; x.onkeydown = function(ev){ if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(x); } }; }); }
/** A deliberate step: the first tap arms the button, the second runs it. */
function confirmTap(b, fn){
  b.onclick = function(){
    if (b.dataset.armed) { b.disabled = true; return fn(); }
    var old = b.innerHTML; b.dataset.armed = '1'; b.textContent = t('opConfirm');
    setTimeout(function(){ if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.innerHTML = old; } }, 4000);
  };
}
function tip(label, n){ return { label: label, value: n, text: String(n), tip: label + ': ' + n }; }
function byValue(a, b){ return b.value - a.value; }
function refreshTasks(){ if (typeof loadTasks === 'function') loadTasks(); }
/** Active people for a picker: the whole directory for HR, the team for a manager. Self left out unless withSelf. */
function people(cb, withSelf){
  var done = function(rows){ cb((rows || []).filter(function(e){ return (!e.status || e.status === 'active') && (withSelf || e.id !== S.me.id); }).sort(function(a, b){ return String(a.name).localeCompare(String(b.name), 'ar'); })); };
  if (roles().hr && window.HrDirLoad) return HrDirLoad(done);
  api('hrTeam', {}, true).then(function(r){ done(r && r.ok ? r.rows : []); });
}
function empOpts(rows){ return opts(rows.map(function(e){ return [e.id, e.name + ' (' + e.empNo + ')']; }), '', '-'); }

// ---------------- penalties: spec strings from the schedule, human labels ----------------
var PKINDS = ['warning', 'written', 'fine_pct', 'fine_days', 'suspend', 'deny_raise', 'deny_promotion', 'dismiss_award', 'dismiss_art80'];
var PNUM = { fine_pct: [1, 100, 5], fine_days: [1, 5, 1], suspend: [1, 5, 1] }; // [min, max, default]
function penParts(p){ var m = String(p || '').split(':'); return { kind: m[0], n: Number(m[1]) || 0 }; }
/** Mirrors penaltyOk_ in Relations.gs. */
function penOk(p){
  var m = /^([a-z_0-9]+)(?::(\d+(?:\.\d+)?))?$/.exec(String(p || ''));
  if (!m || PKINDS.indexOf(m[1]) < 0) return false;
  var r = PNUM[m[1]];
  return !r || (Number(m[2]) > 0 && Number(m[2]) <= r[1]);
}
/** fine_pct:10 -> "حسم 10% من أجر يوم", fine_days:2 -> "حسم أجر يومين", suspend:3 -> "إيقاف عن العمل 3 أيام بدون أجر". */
function penLabel(p){
  if (!p) return '-';
  var x = penParts(p), n = x.n, en = S.lang === 'en';
  if (x.kind === 'none') return t('pk_none');
  if (x.kind === 'fine_pct') return en ? 'Deduct ' + n + "% of a day's wage" : 'حسم ' + n + '% من أجر يوم';
  if (x.kind === 'fine_days') return en ? 'Deduct ' + (n === 1 ? "one day's wage" : n + " days' wage") : n === 1 ? 'حسم أجر يوم' : n === 2 ? 'حسم أجر يومين' : 'حسم أجر ' + n + ' أيام';
  if (x.kind === 'suspend') return en ? 'Suspension without pay, ' + n + ' day' + (n === 1 ? '' : 's') : n === 1 ? 'إيقاف عن العمل يوما واحدا بدون أجر' : n === 2 ? 'إيقاف عن العمل يومين بدون أجر' : 'إيقاف عن العمل ' + n + ' أيام بدون أجر';
  var v = t('pk_' + x.kind);
  return v === 'pk_' + x.kind ? String(p) : v;
}
function pickHtml(cur, allowNone){
  var x = penParts(cur), num = PNUM[x.kind];
  return '<div class="op-pick"><select data-pk aria-label="' + t('dcPenalty') + '">' + (allowNone ? '<option value="none"' + (x.kind === 'none' ? ' selected' : '') + '>' + t('pk_none') + '</option>' : '') +
    PKINDS.map(function(k){ return '<option value="' + k + '"' + (x.kind === k ? ' selected' : '') + '>' + t('pk_' + k) + '</option>'; }).join('') + '</select>' +
    '<input data-pn type="number" inputmode="numeric" step="1" min="1" max="' + (num ? num[1] : 100) + '" value="' + (num ? (x.n || num[2]) : '') + '" aria-label="' + t('pkN') + '"' + (num ? '' : ' hidden') + '></div>' +
    '<small class="hr-hint" data-pl>' + esc(penLabel(cur)) + '</small>';
}
function pickVal(w){ var k = $('[data-pk]', w).value, r = PNUM[k]; return r ? k + ':' + Number($('[data-pn]', w).value || 0) : k; }
function wirePick(w, onChange){
  var s = $('[data-pk]', w), n = $('[data-pn]', w), l = $('[data-pl]', w);
  var upd = function(){ var v = pickVal(w); l.textContent = penLabel(v); if (onChange) onChange(v); };
  s.onchange = function(){ var r = PNUM[s.value]; n.hidden = !r; if (r) { n.max = r[1]; if (!(Number(n.value) >= 1 && Number(n.value) <= r[1])) n.value = r[2]; } upd(); };
  n.oninput = upd;
}

// ================= shifts and rosters (HR edits; managers see their people) =================
function shifts(body){
  var hr = roles().hr, again = function(){ shifts(body); };
  body.innerHTML = head(t('opShifts'), hr ? btn('shN', 'plus', t('shNew')) + btn('roN', 'users-three', t('roAssign'), 'line') : '') + '<div id="shB"></div>';
  var el = $('#shB', body); busy(el);
  apiFresh('shiftList', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var list = r.rows.slice().sort(function(a, b){ return (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1) || String(a.code).localeCompare(String(b.code)); });
    var nb = $('#shN', body); if (nb) nb.onclick = function(){ shiftDrawer(null, again); };
    var rb = $('#roN', body); if (rb) rb.onclick = function(){ rosterDrawer(list, r.summer || {}, again); };
    var from = S.opRoFrom || riyadhToday(), to = S.opRoTo || addDays(riyadhToday(), 30);
    el.innerHTML = '<div id="shD"></div>' + settingsBox(r) + '<h3 class="hr-sub">' + t('shList') + '</h3>' +
      (list.length ? '<div class="list">' + list.map(function(x, i){ return shiftRow(x, i, hr); }).join('') + '</div>' : empty('clock-user', t('shNone'))) +
      '<h3 class="hr-sub">' + t('roList') + '</h3><form class="toolbar" id="roR"><input type="date" name="from" value="' + from + '" aria-label="' + t('roFrom') + '"><input type="date" name="to" value="' + to + '" aria-label="' + t('roTo') + '">' +
      '<button class="btn btn-line btn-sm" type="submit">' + ph('funnel') + t('roShowRange') + '</button></form><div id="roL"></div>';
    clickable($$('[data-sh]', el), function(x){ shiftDrawer(list[x.dataset.sh], again); });
    var f = $('#roR', el);
    f.onsubmit = function(ev){ ev.preventDefault(); S.opRoFrom = f.elements.from.value; S.opRoTo = f.elements.to.value; roster(); };
    roster();
    function roster(){
      var box = $('#roL', el), a = S.opRoFrom || from, b = S.opRoTo || to;
      if (!a || !b || b < a) return box.innerHTML = bad('bad_range');
      busy(box);
      apiFresh('rosterList', { from: a, to: b }, function(q){
        if (!box.isConnected) return;
        if (!q.ok) return box.innerHTML = bad(q.error, 'roster');
        var warn = {}; q.warnings.forEach(function(w){ warn[w.emp.id + '|' + w.shift] = w; });
        var rows = q.rows.slice().sort(function(x, y){ return String(x.emp.name).localeCompare(String(y.emp.name), 'ar') || (x.fromDate < y.fromDate ? -1 : 1); });
        box.innerHTML = rows.length ? '<div class="list">' + rows.map(function(x){ return rosterRow(x, x.shift && warn[x.emp.id + '|' + x.shift.code], hr); }).join('') + '</div>' : empty('calendar-blank', t('roEmpty'));
        $$('[data-rdel]', box).forEach(function(bt){ confirmTap(bt, function(){ api('rosterDelete', { id: bt.dataset.rdel }).then(function(y){ if (!y.ok) { bt.disabled = false; return toast(oerr(y.error)); } toast(t('roDeleted')); roster(); }); }); });
        shiftDash(el, list, q, a, b);
      });
    }
  });
}
function shiftDash(el, list, q, a, b){
  var V = window.Viz, box = $('#shD', el); if (!V || !box) return;
  var act = list.filter(function(x){ return x.status === 'active'; }), ppl = {}, per = {}, warned = {};
  q.rows.forEach(function(x){
    ppl[x.emp.id] = 1;
    if (x.shift) { var k = x.shift.code; per[k] = per[k] || { label: lang(x.shift.nameAr, x.shift.nameEn) + ' · ' + k, ids: {} }; per[k].ids[x.emp.id] = 1; }
  });
  q.warnings.forEach(function(w){ warned[w.emp.id] = 1; });
  var nw = Object.keys(warned).length;
  var bars = Object.keys(per).map(function(k){ return tip(per[k].label, Object.keys(per[k].ids).length); }).sort(byValue);
  box.innerHTML = V.panel('shifts', t('shDash'), '<div class="db-tiles">' + V.tile(t('shPeopleT'), V.n1(Object.keys(ppl).length, 0), fmt(a) + ' - ' + fmt(b), null, true, true) +
    V.tile(t('shActiveT'), V.n1(act.length, 0), '') + V.tile(t('shWarnT'), '<span class="db-status">' + (nw ? ph('sun') + ' ' : '') + nw + '</span>', t('roBan')) +
    V.tile(t('shOutdoorT'), V.n1(act.filter(function(x){ return x.outdoor; }).length, 0), '') + '</div>' +
    (bars.length ? '<div class="db-grid">' + V.card('shp', t('shByShift'), '', V.hbars(bars), V.tbl([t('roShift'), t('roPeople')], bars.map(function(x){ return [esc(x.label), x.value]; }))) + '</div>' : ''));
  V.wire(box);
}
function settingsBox(r){
  var rm = r.ramadan || {}, sm = r.summer || {};
  var md = function(s){ var m = /^(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(Date.UTC(2001, +m[1] - 1, +m[2])).toLocaleDateString(LOCALE(), { day: 'numeric', month: 'long', timeZone: 'UTC' }) : esc(s); };
  return '<div class="op-box"><h4>' + ph('sliders-horizontal') + t('setTitle') + '</h4><div class="op-set">' +
    '<div><b>' + ph('calendar-check') + t('setRosters') + '</b>' + (r.enabled ? chip(ph('check') + t('setOn'), 'in') : '<span>' + t('setOff') + '</span>') + '</div>' +
    '<div><b>' + ph('moon-stars') + t('setRamadan') + '</b><span>' + (rm.from && rm.to ? fmt(rm.from) + ' - ' + fmt(rm.to) : t('setRamadanNone')) + ' · <span class="num">' + (rm.hours || 6) + '</span> ' + t('setRamadanHours') + '</span></div>' +
    '<div><b>' + ph('sun') + t('setSummer') + '</b><span>' + md(sm.from || '06-15') + ' - ' + md(sm.to || '09-15') + ' · <bdi class="num">' + esc(sm.start || '12:00') + '-' + esc(sm.end || '15:00') + '</bdi></span></div>' +
    '</div><p class="hr-hint">' + ph('info') + ' ' + t('setNote') + '</p></div>';
}
function dayNames(wd){ var n = t('dows'); return String(wd || '').split(',').filter(String).map(function(i){ return n[+i] || ''; }).join(comma()); }
function shiftRow(x, i, hr){
  return '<div class="row' + (hr ? ' click" tabindex="0" role="button" data-sh="' + i : '') + '"><div class="av">' + ph(x.outdoor ? 'sun' : 'clock') + '</div><div class="main"><b>' + esc(lang(x.nameAr, x.nameEn)) + '</b>' +
    '<small><bdi>' + esc(x.code) + '</bdi> · <bdi class="num">' + esc(x.start) + '-' + esc(x.end) + '</bdi> · <span class="num">' + hours(x.hours) + '</span> · ' + dayNames(x.workdays) + '</small></div>' +
    '<div class="op-acts">' + (x.outdoor ? chip(ph('sun') + t('shOutdoorTag'), 'late') : '') + (x.status === 'disabled' ? chip(t('shDisabled'), 'off') : '') + '</div></div>';
}
function rosterRow(x, w, hr){
  var s = x.shift;
  return '<div class="row' + (w ? ' warn' : '') + '">' + av(x.emp) + '<div class="main"><b>' + empName(x.emp) + '</b><small><bdi class="num">' + esc(x.emp.empNo) + '</bdi> · ' +
    (s ? esc(lang(s.nameAr, s.nameEn)) + ' <bdi class="num">' + esc(s.start) + '-' + esc(s.end) + '</bdi>' : '-') + ' · ' + fmt(x.fromDate) + ' - ' + fmt(x.toDate) + '</small>' +
    (w ? '<span class="op-warn">' + ph('sun') + t('roBanRow') + ' ' + fmt(w.from) + '</span>' : '') + '</div>' +
    (hr ? '<button type="button" class="btn btn-line btn-sm" data-rdel="' + esc(x.id) + '" aria-label="' + t('roDelete') + '" title="' + t('roDelete') + '">' + ph('trash') + '</button>' : '') + '</div>';
}
function shiftDrawer(x, done){
  var wd = String(x ? x.workdays : '0,1,2,3,4').split(',');
  var d = drawer('<h3>' + (x ? t('shEdit') + ' <bdi class="chip">' + esc(x.code) + '</bdi>' : t('shNew')) + '</h3><form class="form" id="shF">' +
    fld(t('shName'), '<input name="nameAr" required maxlength="60" value="' + esc(x ? x.nameAr : '') + '">') +
    fld(t('shNameEn'), '<input name="nameEn" maxlength="60" dir="ltr" value="' + esc(x ? x.nameEn : '') + '">') +
    '<div class="two">' + fld(t('shStart'), '<input name="start" type="time" required value="' + esc(x ? x.start : '08:00') + '">') + fld(t('shEnd'), '<input name="end" type="time" required value="' + esc(x ? x.end : '16:00') + '">') + '</div>' +
    '<p class="hr-hint" id="shLen" aria-live="polite"></p>' +
    '<div class="field"><label>' + t('shDays') + '</label><div class="checks">' + t('dows').map(function(n, i){ return '<label><input type="checkbox" name="wd" value="' + i + '"' + (wd.indexOf(String(i)) >= 0 ? ' checked' : '') + '>' + n + '</label>'; }).join('') + '</div></div>' +
    '<label class="hr-check"><input type="checkbox" name="outdoor"' + (x && x.outdoor ? ' checked' : '') + '><span>' + t('shOutdoor') + '</span></label>' +
    (x ? fld(t('shStatus'), '<select name="status">' + opts([['active', t('shActive')], ['disabled', t('shDisabled')]], x.status) + '</select>') : '') +
    '<p class="hr-hint">' + t('shNoOvernight') + '</p><p class="hr-bad" id="shE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('opSave') + '</button></div></form>');
  var f = $('#shF', d), len = $('#shLen', d), er = $('#shE', d);
  function check(){
    var m = hmMin(f.elements.end.value) - hmMin(f.elements.start.value);
    len.textContent = m > 0 ? t('shLen') + ': ' + hours(Math.round(m / 6) / 10) : '';
    return !f.elements.start.value || !f.elements.end.value ? 'missing_fields' : m === 0 ? 'bad_value' : (m < 0 ? m + 1440 : m) > 720 ? 'shift_too_long' : '';
  }
  f.elements.start.oninput = f.elements.end.oninput = function(){ var c = check(); er.textContent = c && c !== 'missing_fields' ? oerr(c) : ''; };
  check();
  f.onsubmit = function(ev){
    ev.preventDefault();
    var c = check(), days = $$('[name=wd]', f).filter(function(i){ return i.checked; }).map(function(i){ return i.value; });
    if (!c && !f.elements.nameAr.value.trim()) c = 'missing_fields';
    if (c) return er.textContent = oerr(c);
    if (!days.length) return er.textContent = t('shNoDays');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('shiftSave', { shift: { id: x ? x.id : '', nameAr: f.elements.nameAr.value.trim(), nameEn: f.elements.nameEn.value.trim(), start: f.elements.start.value, end: f.elements.end.value,
      workdays: days.join(','), outdoor: f.elements.outdoor.checked, status: f.elements.status ? f.elements.status.value : 'active' } }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error);
      d.remove(); toast(t('shSaved') + ' · ' + r.shift.code); done();
    });
  };
}
/** First day in [from, to] on which an outdoor shift overlaps the midday ban (mirrors summerWarnings_). */
function banHit(sh, from, to, sm){
  if (!sh || !sh.outdoor || !from || !to || to < from) return '';
  var bs = hmMin(sm.start || '12:00'), be = hmMin(sm.end || '15:00'), a = sm.from || '06-15', b = sm.to || '09-15';
  if (!(hmMin(sh.start) < be && hmMin(sh.end) > bs)) return '';
  for (var d = from, i = 0; d <= to && i < 400; d = addDays(d, 1), i++) { var md = d.slice(5); if (md >= a && md <= b) return d; }
  return '';
}
function rosterDrawer(list, summer, done){
  var act = list.filter(function(x){ return x.status === 'active'; }), td = riyadhToday();
  if (!act.length) return toast(t('shNoActive'));
  var d = drawer('<h3>' + t('roAssign') + '</h3><p class="hr-hint">' + t('roLead') + '</p><form class="form" id="roF">' +
    fld(t('roShift'), '<select name="shiftId" required>' + opts(act.map(function(x){ return [x.id, lang(x.nameAr, x.nameEn) + ' · ' + x.start + '-' + x.end + ' · ' + x.code]; }), '') + '</select>') +
    '<div class="two">' + fld(t('roFrom'), '<input name="from" type="date" required value="' + td + '">') + fld(t('roTo'), '<input name="to" type="date" required value="' + addDays(td, 30) + '">') + '</div>' +
    '<p class="notice hidden" id="roBan" role="status"></p>' +
    '<div class="field"><label>' + t('roPeople') + ' · <span class="num" id="roCnt">0</span> ' + t('roPicked') + '</label>' +
    '<div class="toolbar"><input class="grow" type="search" id="roQ" placeholder="' + t('opSearch') + '" aria-label="' + t('opSearch') + '"><button type="button" class="btn btn-line btn-sm" id="roAll">' + t('roPick') + '</button><button type="button" class="btn btn-line btn-sm" id="roClr">' + t('roClear') + '</button></div>' +
    '<div class="op-people" id="roP" role="group" aria-label="' + t('roPeople') + '"><span class="sk" style="margin:12px"></span></div></div>' +
    '<p class="hr-bad" id="roE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('users-three') + t('roAssign') + '</button></div></form>');
  var f = $('#roF', d), box = $('#roP', d), picked = {}, all = [];
  function shown(){ var q = $('#roQ', d).value.trim().toLowerCase(); return all.filter(function(e){ return !q || [e.name, e.nameEn, e.empNo, e.departmentName].join(' ').toLowerCase().indexOf(q) >= 0; }); }
  function count(){ $('#roCnt', d).textContent = Object.keys(picked).length; }
  function draw(){
    var l = shown();
    box.innerHTML = l.length ? l.map(function(e){ return '<label><input type="checkbox" value="' + esc(e.id) + '"' + (picked[e.id] ? ' checked' : '') + '><span>' + esc(e.name) + '</span><small><bdi class="num">' + esc(e.empNo) + '</bdi>' + (e.departmentName ? ' · ' + esc(e.departmentName) : '') + '</small></label>'; }).join('') : '<p class="hr-hint" style="padding:10px 12px;margin:0">' + t('opNoPeople') + '</p>';
    $$('input', box).forEach(function(c){ c.onchange = function(){ if (c.checked) picked[c.value] = 1; else delete picked[c.value]; count(); }; });
  }
  people(function(rows){ all = rows; draw(); }, true);
  $('#roQ', d).oninput = draw;
  $('#roAll', d).onclick = function(){ shown().forEach(function(e){ picked[e.id] = 1; }); draw(); count(); };
  $('#roClr', d).onclick = function(){ picked = {}; draw(); count(); };
  function ban(){
    var sh = act.filter(function(x){ return x.id === f.elements.shiftId.value; })[0], n = $('#roBan', d), hit = banHit(sh, f.elements.from.value, f.elements.to.value, summer);
    n.classList.toggle('hidden', !hit);
    n.innerHTML = hit ? ph('sun') + ' ' + t('roBanPreview') + ' ' + fmt(hit) + ' (<bdi class="num">' + esc(summer.start || '12:00') + '-' + esc(summer.end || '15:00') + '</bdi>).' : '';
  }
  f.elements.shiftId.onchange = f.elements.from.onchange = f.elements.to.onchange = ban; ban();
  f.onsubmit = function(ev){
    ev.preventDefault();
    var er = $('#roE', d), ids = Object.keys(picked), a = f.elements.from.value, b = f.elements.to.value;
    if (!f.elements.shiftId.value || !ids.length) return er.textContent = oerr('missing_fields');
    if (!a || !b || b < a) return er.textContent = oerr('bad_range');
    if (daysBetween(a, b) > 366) return er.textContent = oerr('range_too_long', 'roster');
    if (ids.length > 300) return er.textContent = t('roMax');
    var bt = f.querySelector('[type=submit]'); bt.disabled = true;
    api('rosterSave', { empIds: ids, shiftId: f.elements.shiftId.value, fromDate: a, toDate: b }).then(function(r){
      bt.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error, 'roster');
      d.remove(); toast(t('roSaved') + ' ' + plural(r.count, 'people') + (r.replaced ? ' · ' + t('roReplaced') + ' ' + r.replaced : '')); done();
    });
  };
}

// ================= employee relations: cases, injuries, penalty schedule =================
var REL_TABS = [['cases', 'gavel', 'rlCases'], ['injuries', 'first-aid-kit', 'rlInjuries'], ['schedule', 'list-checks', 'rlSchedule']];
var DS_CLS = { charged: 'late', responded: 'leave', decided: 'absent', objected: 'late', closed: 'off' };
var IS_CLS = { reported: 'late', gosi_notified: 'leave', recovering: 'leave', closed: 'off' };
function relations(body, focusTab){
  var v = S.opRel || 'cases', r = roles(), again = function(){ relations(body); };
  var acts = v === 'cases' && (r.hr || r.manager) ? btn('dcN', 'gavel', t('dcOpen')) : v === 'injuries' ? btn('ijN', 'first-aid-kit', t('ijReport')) : v === 'schedule' && r.hr ? '<span id="scAct"></span>' : '';
  body.innerHTML = head(t('opRelations'), acts) + tabs(REL_TABS, v) + '<div id="rlB"></div>';
  wireTabs(body, function(k, focus){ S.opRel = k; relations(body, focus); });
  if (focusTab) { var sel = $('[role=tab][aria-selected="true"]', body); if (sel) sel.focus(); }
  var el = $('#rlB', body);
  var dn = $('#dcN', body); if (dn) dn.onclick = function(){ openCase(again); };
  var ij = $('#ijN', body); if (ij) ij.onclick = function(){ reportInjury(false, again); };
  if (v === 'injuries') return injuriesView(el, again);
  if (v === 'schedule') return scheduleView(el, body);
  casesView(el, again);
}
function occLabel(n){ return t('occ' + Math.max(1, Math.min(4, Number(n) || 1))); }

// ---------------- cases ----------------
function casesView(el, again){
  busy(el);
  apiFresh('discList', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var rows = r.rows.filter(function(x){ return !x.mine; }), V = window.Viz, h = '', month = riyadhToday().slice(0, 7);
    var cnt = function(fn){ return rows.filter(fn).length; };
    if (V && rows.length) {
      var by = {}; rows.forEach(function(x){ by[x.code] = (by[x.code] || 0) + 1; });
      var bars = Object.keys(by).map(function(k){ return tip(k, by[k]); }).sort(byValue);
      h += V.panel('relations', t('rlDash'), '<div class="db-tiles">' + V.tile(t('rlOpenT'), V.n1(cnt(function(x){ return x.status === 'charged' || x.status === 'responded'; }), 0), '', null, true, true) +
        V.tile(t('rlWaitResp'), V.n1(cnt(function(x){ return x.status === 'charged'; }), 0), '') +
        (roles().hr ? V.tile(t('rlReady'), V.n1(cnt(function(x){ return x.canDecide && x.hearings.length; }), 0), '') : '') +
        V.tile(t('rlObjT'), '<span class="db-status">' + (cnt(function(x){ return x.status === 'objected'; }) ? ph('warning') + ' ' : '') + cnt(function(x){ return x.status === 'objected'; }) + '</span>', '') +
        V.tile(t('rlMonthT'), V.n1(cnt(function(x){ return String(x.decidedAt || '').slice(0, 7) === month; }), 0), '') + '</div>' +
        '<div class="db-grid">' + V.card('rlc', t('rlByCode'), '', V.hbars(bars), V.tbl([t('dcCode'), t('opCount')], bars.map(function(x){ return [esc(x.label), x.value]; }))) + '</div>');
    }
    h += '<div class="toolbar"><input class="grow" type="search" id="dcQ" placeholder="' + t('opSearch') + '" aria-label="' + t('opSearch') + '" value="' + esc(S.opDcQ || '') + '">' +
      '<select id="dcS" aria-label="' + t('dcAllSt') + '">' + opts(['charged', 'responded', 'decided', 'objected', 'closed'].map(function(s){ return [s, t('ds_' + s)]; }), S.opDcSt || '', t('dcAllSt')) + '</select></div><div id="dcL"></div>';
    el.innerHTML = h; if (V) V.wire(el);
    function list(){
      var q = (S.opDcQ || '').toLowerCase(), s = S.opDcSt || '', box = $('#dcL', el);
      var l = rows.filter(function(x){ return (!s || x.status === s) && (!q || [x.emp && x.emp.name, x.emp && x.emp.empNo, x.ref, x.code, x.violation].join(' ').toLowerCase().indexOf(q) >= 0); });
      box.innerHTML = !rows.length ? empty('gavel', t('dcNone')) : l.length ? '<div class="list">' + l.map(function(x){ return caseRow(x, rows.indexOf(x)); }).join('') + '</div>' : empty('magnifying-glass', t('dcNoMatch'));
      clickable($$('[data-c]', box), function(x){ caseDrawer(rows[x.dataset.c], again); });
    }
    $('#dcQ', el).oninput = function(){ S.opDcQ = this.value; list(); };
    $('#dcS', el).onchange = function(){ S.opDcSt = this.value; list(); };
    list();
  });
}
function caseRow(x, i){
  return '<div class="row click" tabindex="0" role="button" data-c="' + i + '">' + av(x.emp) + '<div class="main"><b>' + empName(x.emp) + ' · ' + esc(x.violation) + '</b>' +
    '<small><bdi>' + esc(x.ref) + '</bdi> · <bdi>' + esc(x.code) + '</bdi> · ' + occLabel(x.occurrence) + ' · ' + fmt(x.incidentDate) + (x.decision ? ' · ' + esc(penLabel(x.decision)) : '') + '</small></div>' +
    chip(t('ds_' + x.status), DS_CLS[x.status]) + '</div>';
}
function hearingsHtml(x){
  return x.hearings.length ? x.hearings.map(function(hg){ return '<p class="hr-hint">' + fmt(hg.date) + ' · ' + esc(hg.by) + (hg.attendees ? ' · ' + t('dcAttendees') + ': ' + esc(hg.attendees) : '') + '</p>' + quote(hg.minutes); }).join('')
    : '<p class="notice">' + t('dcNoHearing') + '</p>';
}
function decisionHtml(x){
  if (!x.decision) return '';
  var res = String(x.objectionResult || ''), rk = res.split(':')[0], rn = res.slice(rk.length + 1).trim();
  return '<h4 class="op-h4">' + ph('gavel') + t('dcDecision') + '</h4>' +
    meta([[t('dcPenalty'), '<b>' + esc(penLabel(x.decision)) + '</b>' + (x.suggested && x.decision !== x.suggested ? ' ' + chip(t('dcChanged'), 'late') : '')], [t('dcAmount'), x.amount ? money(x.amount) : ''],
      [t('dcMonth'), x.adjMonth ? esc(monthName(x.adjMonth)) : ''], [t('dcDecidedBy'), esc(x.decidedBy) + (x.decidedAt ? ' · ' + fmt(day(x.decidedAt)) : '')], [t('opNote'), esc(x.decisionNote || '')]]) +
    meta([[t('dcNotified'), x.notifiedOn ? fmt(x.notifiedOn) : ''], [t('dcObjDue'), x.objectionDue && x.status === 'decided' ? fmt(x.objectionDue) + (x.objectDaysLeft != null ? ' (' + plural(x.objectDaysLeft, 'days') + ')' : '') : ''],
      [t('dcDecideDue'), x.decideDue ? fmt(x.decideDue) + (x.decideOverdue ? ' ' + chip(t('dcDecideLate'), 'late') : '') : '']]) +
    (x.status === 'decided' ? '<p class="hr-hint">' + ph('info') + ' ' + t('dcObjWindow') + '</p>' : '') +
    (x.objection ? '<h4 class="op-h4">' + ph('megaphone') + t('dcObjection') + '</h4>' + quote(x.objection) + '<p class="hr-hint">' + fmt(day(x.objectedAt)) + '</p>' : '') +
    (res ? '<h4 class="op-h4">' + ph('scales') + t('dcResult') + '</h4><p>' + chip(t('dr_' + rk), rk === 'cancelled' ? 'in' : 'off') + ' ' + esc(rn) + '</p>' : '');
}
function chargeHtml(x){
  return '<h4 class="op-h4">' + ph('file-text') + t('dcCharge') + '</h4>' +
    meta([[t('dcEmp'), empLine(x.emp)], [t('dcCode'), '<bdi>' + esc(x.code) + '</bdi> · ' + occLabel(x.occurrence)], [t('dcIncident'), fmt(x.incidentDate)], [t('dcDiscovered'), fmt(x.discoveredDate)],
      [t('dcReportedBy'), esc(x.reportedBy || '')], [t('dcChargedAt'), x.chargedAt ? fmt(day(x.chargedAt)) : ''], [t('dcSuggested'), esc(penLabel(x.suggested))]]) + quote(x.description);
}
/** HR / manager view of one case: the charge, the answer, hearings (HR), the decision and the objection. */
function caseDrawer(x, done){
  var hr = roles().hr, open = x.status === 'charged' || x.status === 'responded';
  var d = drawer('<h3>' + esc(x.violation) + '</h3><p class="hr-hint">' + chip(t('ds_' + x.status), DS_CLS[x.status]) + ' <bdi>' + esc(x.ref) + '</bdi> · ' + empLine(x.emp) + '</p>' + chargeHtml(x) +
    '<h4 class="op-h4">' + ph('chat-text') + t('dcResponse') + '</h4>' + (x.response ? quote(x.response) + '<p class="hr-hint">' + fmt(day(x.respondedAt)) + '</p>' : '<p class="hr-hint">' + t('dcNoResponse') + '</p>') +
    (hr ? '<h4 class="op-h4">' + ph('notebook') + t('dcHearings') + '</h4>' + hearingsHtml(x) : '') + decisionHtml(x) + '<div id="dcAct"></div><p class="hr-bad" id="dcE" role="alert"></p>');
  var act = $('#dcAct', d), er = $('#dcE', d), td = riyadhToday(), h = '';
  var reopen = function(c){ d.remove(); caseDrawer(c, done); done(); refreshTasks(); };
  if (hr && open && !x.mine) h += '<form class="form op-box" id="dcHf"><h4>' + ph('notebook') + t('dcAddHearing') + '</h4><div class="two">' + fld(t('dcDate'), '<input name="date" type="date" max="' + td + '" value="' + td + '">') +
    fld(t('dcAttendees'), '<input name="att" maxlength="300">') + '</div>' + fld(t('dcMinutes'), '<textarea name="min" rows="4" maxlength="3000"></textarea>') +
    '<div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + ph('plus') + t('dcAddHearing') + '</button></div></form>';
  if (x.canDecide) h += '<form class="form op-box" id="dcDf"><h4>' + ph('gavel') + t('dcDecide') + '</h4>' + (x.hearings.length ? '' : '<p class="notice">' + t('dcNoHearing') + '</p>') +
    '<div class="field"><label>' + t('dcPenalty') + ' · ' + t('dcSuggested') + ': <b>' + esc(penLabel(x.suggested)) + '</b></label><div data-pw>' + pickHtml(x.suggested, true) + '</div></div>' +
    fld('<span id="dcNl">' + t('opNoteOpt') + '</span>', '<textarea name="note" rows="2" maxlength="1000"></textarea>') + '<p class="hr-hint">' + t('dcPayrollNote') + '</p>' +
    '<div class="btnrow"><button class="btn btn-dark" type="submit"' + (x.hearings.length ? '' : ' disabled') + '>' + t('dcDecideBtn') + '</button></div></form>';
  else if (hr && open && !x.mine) h += '<p class="notice">' + t('dcNotYou') + '</p>';
  if (x.canNotice) h += '<form class="form op-box" id="dcNf"><h4>' + ph('envelope-simple') + t('dcNotice') + '</h4><p class="hr-hint">' + t('dcNoticeLead') + '</p>' + fld(t('dcNotified'), '<input name="date" type="date" max="' + td + '" value="' + esc(x.notifiedOn || td) + '">') +
    '<div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + t('dcNotice') + '</button></div></form>';
  if (hr && x.status === 'objected') h += '<form class="form op-box" id="dcOf"><h4>' + ph('scales') + t('dcObjDecide') + '</h4><p class="hr-hint">' + t('dcObjLead') + '</p>' +
    (x.decidedBy && S.me && x.decidedBy === S.me.name ? '<p class="notice">' + t('dcObjSelf') + '</p>' : '') +
    '<div class="checks" role="radiogroup" aria-label="' + t('dcObjDecide') + '"><label><input type="radio" name="res" value="upheld" checked>' + t('dcUpheld') + '</label><label><input type="radio" name="res" value="cancelled">' + t('dcCancelled') + '</label></div>' +
    fld(t('dcObjNote'), '<textarea name="note" rows="2" maxlength="1000"></textarea>') + '<div class="btnrow"><button class="btn btn-dark" type="submit">' + t('dcObjDecide') + '</button></div></form>';
  act.innerHTML = h;
  var hf = $('#dcHf', d);
  if (hf) hf.onsubmit = function(ev){
    ev.preventDefault();
    var m = hf.elements.min.value.trim(); if (m.length < 10) return er.textContent = oerr('missing_fields');
    var b = hf.querySelector('[type=submit]'); b.disabled = true;
    api('discHearing', { id: x.id, date: hf.elements.date.value, minutes: m, attendees: hf.elements.att.value.trim() }).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error); toast(t('dcHearingSaved')); reopen(r.case); });
  };
  var df = $('#dcDf', d);
  if (df) {
    var w = $('[data-pw]', df);
    wirePick(w, function(v){ $('#dcNl', df).textContent = v !== x.suggested ? t('dcNoteReq') : t('opNoteOpt'); });
    df.onsubmit = function(ev){
      ev.preventDefault();
      var v = pickVal(w), note = df.elements.note.value.trim();
      if (v !== 'none' && !penOk(v)) return er.textContent = oerr('bad_penalty');
      if (v !== x.suggested && !note) return er.textContent = oerr('note_required', 'decide');
      var b = df.querySelector('[type=submit]'); b.disabled = true;
      api('discDecide', { id: x.id, penalty: v, note: note }).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error, 'decide'); toast(t('dcDecided') + (r.case.amount ? ' · ' + moneyTxt(r.case.amount) : '')); reopen(r.case); });
    };
  }
  var nf = $('#dcNf', d);
  if (nf) nf.onsubmit = function(ev){ ev.preventDefault(); var b = nf.querySelector('[type=submit]'); b.disabled = true; api('discNotice', { id: x.id, date: nf.elements.date.value }).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error); toast(t('opSaved')); reopen(r.case); }); };
  var of = $('#dcOf', d);
  if (of) of.onsubmit = function(ev){
    ev.preventDefault();
    var note = of.elements.note.value.trim(); if (!note) return er.textContent = oerr('note_required', 'objection');
    var b = of.querySelector('[type=submit]'); b.disabled = true;
    api('discObjectionDecide', { id: x.id, result: of.elements.res.value, note: note }).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error, 'objection'); toast(t('dr_' + of.elements.res.value)); reopen(r.case); });
  };
}
/** Opening a case (HR, or the employee's manager): shows the 30-day rule live and the schedule for the violation. */
function openCase(done){
  var td = riyadhToday();
  var d = drawer('<h3>' + t('dcOpen') + '</h3><div id="ocB"></div><form class="form" id="ocF">' +
    fld(t('dcEmp'), '<select name="empId" required><option value="">-</option></select>') +
    fld(t('dcCode'), '<select name="code" required><option value="">-</option></select>') + '<div id="ocS"></div>' +
    '<div class="two">' + fld(t('dcIncident'), '<input name="inc" type="date" required max="' + td + '" value="' + td + '">') + fld(t('dcDiscovered'), '<input name="disc" type="date" required max="' + td + '" value="' + td + '">') + '</div>' +
    '<p class="notice" id="oc30" aria-live="polite"></p>' + fld(t('dcDesc'), '<textarea name="desc" rows="4" maxlength="1500"></textarea>') +
    '<p class="hr-hint">' + t('dcOccLead') + ' ' + t('dcCharged') + '</p><p class="hr-bad" id="ocE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('gavel') + t('dcOpen') + '</button></div></form>');
  var f = $('#ocF', d), er = $('#ocE', d), codes = [];
  people(function(rows){ f.elements.empId.innerHTML = empOpts(rows); });
  api('discCodes', {}, true).then(function(r){
    if (!d.isConnected) return;
    if (!r.ok) return er.textContent = oerr(r.error);
    codes = r.rows.filter(function(c){ return c.status !== 'deleted'; });
    if (r.starter) $('#ocB', d).innerHTML = '<p class="notice">' + ph('warning') + ' ' + t('scStarter') + '</p>';
    f.elements.code.innerHTML = opts(codes.map(function(c){ return [c.code, c.code + ' · ' + lang(c.ar, c.en)]; }), '', '-');
  });
  f.elements.code.onchange = function(){
    var c = codes.filter(function(k){ return k.code === f.elements.code.value; })[0];
    $('#ocS', d).innerHTML = c ? '<div class="op-box"><h4>' + ph('list-checks') + t('dcSchedFor') + '</h4>' + meta(c.p.map(function(p, i){ return [t('occ' + (i + 1)), esc(penLabel(p))]; })) + '</div>' : '';
  };
  function rule(){
    var n = $('#oc30', d), inc = f.elements.inc.value, dc = f.elements.disc.value || inc, now = riyadhToday();
    if (!inc || inc > now || dc < inc || dc > now) { n.className = 'notice'; n.textContent = t('dcFuture'); return 'bad_date'; }
    var left = 30 - daysBetween(dc, now);
    if (left < 0) { n.className = 'hr-bad'; n.textContent = t('dcExpired'); return 'too_late'; }
    n.className = 'notice ok'; n.innerHTML = ph('hourglass') + ' ' + t('dc30') + ' ' + (left ? t('dcLeft') + ' ' + plural(left, 'days') : t('dcLastDay'));
    return '';
  }
  f.elements.inc.onchange = function(){ if (f.elements.disc.value < f.elements.inc.value) f.elements.disc.value = f.elements.inc.value; rule(); };
  f.elements.disc.onchange = rule; rule();
  f.onsubmit = function(ev){
    ev.preventDefault();
    if (!f.elements.empId.value || !f.elements.code.value) return er.textContent = oerr('missing_fields');
    var c = rule(); if (c) return er.textContent = oerr(c, 'open');
    var desc = f.elements.desc.value.trim(); if (desc.length < 10) return er.textContent = oerr('missing_fields');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('discOpen', { case: { empId: f.elements.empId.value, code: f.elements.code.value, incidentDate: f.elements.inc.value, discoveredDate: f.elements.disc.value, description: desc } }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error, 'open');
      d.remove(); toast(r.case.ref + ' · ' + occLabel(r.case.occurrence) + ' · ' + penLabel(r.case.suggested)); done();
    });
  };
}

// ---------------- penalty schedule ----------------
function starterBanner(){ return '<div class="notice"><b>' + ph('warning') + ' ' + t('scStarter') + '</b><br>' + t('scStarterLead') + '</div>'; }
function scheduleView(el, body){
  busy(el);
  apiFresh('discCodes', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var rows = r.rows.filter(function(c){ return c.status !== 'deleted'; }), ab = $('#scAct', body);
    if (ab && roles().hr) { ab.innerHTML = btn('scE', 'pencil-simple', t('scEdit')); $('#scE', ab).onclick = function(){ scheduleEdit(el, rows, r.starter, body); }; }
    el.innerHTML = (r.starter ? starterBanner() : '<p class="notice ok">' + ph('seal-check') + ' ' + t('scApproved') + '</p>') + '<p class="hr-hint">' + t('scRules') + '</p>' +
      '<div class="tblwrap"><table class="tbl op-tbl"><thead><tr><th>' + t('scCode') + '</th><th>' + t('scAr') + '</th>' + [1, 2, 3, 4].map(function(i){ return '<th>' + t('occ' + i) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(c){ return '<tr><td><bdi>' + esc(c.code) + '</bdi></td><td>' + esc(lang(c.ar, c.en)) + '</td>' + c.p.map(function(p){ return '<td>' + esc(penLabel(p)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  });
}
/** The whole schedule is edited and saved at once (discCodesSave replaces it; codes left out are retired). */
function scheduleEdit(el, rows, starter, body){
  var list = rows.map(function(c){ return { code: c.code, ar: c.ar || '', en: c.en || '', p: c.p.slice() }; });
  var ab = $('#scAct', body); if (ab) ab.innerHTML = '';
  function block(c, i){
    return '<div class="op-box" data-i="' + i + '"><div class="two">' + fld(t('scCode'), '<input data-f="code" dir="ltr" maxlength="16" value="' + esc(c.code) + '" placeholder="LATE15">', t('scCodeHint')) +
      fld(t('scEn'), '<input data-f="en" dir="ltr" maxlength="300" value="' + esc(c.en) + '">') + '</div>' + fld(t('scAr'), '<textarea data-f="ar" rows="2" maxlength="300">' + esc(c.ar) + '</textarea>') +
      '<div class="op-pen">' + [0, 1, 2, 3].map(function(k){ return '<div class="field"><label>' + t('occ' + (k + 1)) + '</label><div data-pw data-occ="' + k + '">' + pickHtml(c.p[k] || 'warning', false) + '</div></div>'; }).join('') + '</div>' +
      '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" data-rm="' + i + '">' + ph('trash') + t('scRemove') + '</button></div></div>';
  }
  function sync(){
    $$('[data-i]', el).forEach(function(b){
      var c = list[b.dataset.i]; if (!c) return;
      c.code = $('[data-f=code]', b).value.trim().toUpperCase(); c.en = $('[data-f=en]', b).value.trim(); c.ar = $('[data-f=ar]', b).value.trim();
      $$('[data-pw]', b).forEach(function(w){ c.p[+w.dataset.occ] = pickVal(w); });
    });
  }
  function invalid(){
    if (!list.length) return t('scEmpty');
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!/^[A-Z0-9_-]{2,16}$/.test(c.code)) return t('scBadCode') + ' ' + (c.code || '-');
      if (seen[c.code]) return t('scDupCode') + ' ' + c.code;
      seen[c.code] = 1;
      if (!c.ar) return t('scNeedAr');
      if (!c.p.every(penOk)) return oerr('bad_penalty') + ' (' + c.code + ')';
    }
    return '';
  }
  function draw(){
    el.innerHTML = (starter ? starterBanner() : '') + '<p class="hr-hint">' + t('scRules') + '</p><form class="form" id="scF">' + list.map(block).join('') +
      '<div class="btnrow"><button type="button" class="btn btn-line btn-sm" id="scAdd">' + ph('plus') + t('scAdd') + '</button></div><p class="hr-bad" id="scErr" role="alert"></p>' +
      '<div class="btnrow"><button type="submit" class="btn btn-dark">' + t('scSave') + '</button><button type="button" class="btn btn-line" id="scX">' + t('opCancel') + '</button></div></form>';
    $$('[data-pw]', el).forEach(function(w){ wirePick(w); });
    $$('[data-rm]', el).forEach(function(b){ b.onclick = function(){ sync(); list.splice(+b.dataset.rm, 1); draw(); }; });
    $('#scAdd', el).onclick = function(){ sync(); list.push({ code: '', ar: '', en: '', p: ['warning', 'written', 'fine_days:1', 'suspend:1'] }); draw(); var last = $$('[data-f=code]', el).pop(); if (last) last.focus(); };
    $('#scX', el).onclick = function(){ scheduleView(el, body); };
    $('#scF', el).onsubmit = function(ev){
      ev.preventDefault(); sync();
      var msg = invalid(), er = $('#scErr', el); if (msg) return er.textContent = msg;
      var b = this.querySelector('[type=submit]'); b.disabled = true;
      api('discCodesSave', { rows: list.map(function(c){ return { code: c.code, ar: c.ar, en: c.en, p: c.p }; }) }).then(function(r){
        b.disabled = false;
        if (!r.ok) return er.textContent = oerr(r.error);
        toast(t('scSaved')); scheduleView(el, body);
      });
    };
  }
  draw();
}

// ---------------- work injuries ----------------
function injuriesView(el, again){
  busy(el);
  apiFresh('injuryList', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var td = riyadhToday(), rows = r.rows.filter(function(x){ return !x.emp || x.emp.id !== S.me.id; }), V = window.Viz, h = '';
    var late = function(x){ return !x.gosiRef && x.status !== 'closed' && x.gosiDue && x.gosiDue < td; }, nLate = rows.filter(late).length;
    var n = function(s){ return rows.filter(function(x){ return x.status === s; }).length; };
    if (V && rows.length) h += V.panel('injuries', t('ijDash'), '<div class="db-tiles">' + V.tile(t('ijOpenT'), V.n1(rows.length - n('closed'), 0), '', null, true, true) +
      V.tile(t('ijLateT'), '<span class="db-status">' + (nLate ? ph('warning-circle') + ' ' : '') + nLate + '</span>', '') + V.tile(t('ijRecovT'), V.n1(n('recovering'), 0), '') + V.tile(t('ijClosedT'), V.n1(n('closed'), 0), '') + '</div>');
    h += '<p class="hr-hint">' + ph('info') + ' ' + t('ijLead') + '</p>';
    h += rows.length ? '<div class="list">' + rows.map(function(x, i){ return injRow(x, i, late(x)); }).join('') + '</div>' : empty('first-aid-kit', t('ijNone'));
    el.innerHTML = h; if (V) V.wire(el);
    clickable($$('[data-ij]', el), function(x){ injuryDrawer(rows[x.dataset.ij], again); });
  });
}
function injRow(x, i, late){
  return '<div class="row click' + (late ? ' warn' : '') + '" tabindex="0" role="button" data-ij="' + i + '">' + av(x.emp) + '<div class="main"><b>' + empName(x.emp) + ' · ' + esc(x.place) + '</b>' +
    '<small><bdi>' + esc(x.ref) + '</bdi> · ' + fmtLocal(x.occurredAt) + (x.gosiRef ? ' · GOSI <bdi>' + esc(x.gosiRef) + '</bdi>' : x.status !== 'closed' ? ' · ' + (late ? '<span class="op-late">' + t('ijGosiLate') + '</span>' : t('ijGosiDue')) + ' ' + fmt(x.gosiDue) : '') + '</small></div>' +
    chip(t('is_' + x.status), IS_CLS[x.status]) + '</div>';
}
function injuryDrawer(x, done){
  var hr = roles().hr;
  var d = drawer('<h3>' + t('rlInjuries') + ' · <bdi>' + esc(x.ref) + '</bdi></h3><p class="hr-hint">' + chip(t('is_' + x.status), IS_CLS[x.status]) + ' ' + empLine(x.emp) + '</p>' +
    meta([[t('ijWhen'), fmtLocal(x.occurredAt)], [t('ijPlace'), esc(x.place)], [t('ijAid'), esc(x.firstAid || '')], [t('ijReportedBy'), esc(x.reportedBy || '')], [t('ijGosiDue'), fmt(x.gosiDue)],
      [t('ijGosiRef'), x.gosiRef ? '<bdi>' + esc(x.gosiRef) + '</bdi>' + (x.gosiReportedAt ? ' · ' + fmt(day(x.gosiReportedAt)) : '') : ''], [t('ijOff'), x.offFrom ? fmt(x.offFrom) + ' - ' + fmt(x.offTo) : ''], [t('ijClosedNote'), esc(x.closedNote || '')]]) +
    quote(x.description) + '<div id="ijAct"></div><p class="hr-bad" id="ijE" role="alert"></p>');
  if (!hr) return;
  var act = $('#ijAct', d), er = $('#ijE', d), h = '';
  if (!x.gosiRef) h += '<form class="form op-box" id="ijG"><h4>' + ph('shield-check') + t('ijGosiSave') + '</h4>' + fld(t('ijGosiRef'), '<input name="ref" dir="ltr" maxlength="60">') +
    '<div class="btnrow"><button class="btn btn-dark btn-sm" type="submit">' + t('ijGosiSave') + '</button></div></form>';
  if (x.status !== 'closed') h += '<form class="form op-box" id="ijO"><h4>' + ph('calendar-x') + t('ijOff') + '</h4><div class="two">' + fld(t('roFrom'), '<input name="a" type="date" value="' + esc(x.offFrom || String(x.occurredAt || '').slice(0, 10)) + '">') +
    fld(t('roTo'), '<input name="b" type="date" value="' + esc(x.offTo || '') + '">') + '</div><div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + t('ijOffSave') + '</button></div></form>' +
    '<form class="form op-box" id="ijC"><h4>' + ph('check-circle') + t('ijClose') + '</h4>' + fld(t('ijCloseNote'), '<textarea name="n" rows="2" maxlength="1000"></textarea>') +
    '<div class="btnrow"><button class="btn btn-line btn-sm" type="submit">' + t('ijClose') + '</button></div></form>';
  act.innerHTML = h;
  var send = function(form, payload){
    var b = form.querySelector('[type=submit]'); b.disabled = true;
    api('injuryUpdate', Object.assign({ id: x.id }, payload)).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error, 'close'); d.remove(); toast(t('opSaved')); injuryDrawer(r.injury, done); done(); refreshTasks(); });
  };
  var g = $('#ijG', d); if (g) g.onsubmit = function(ev){ ev.preventDefault(); var v = g.elements.ref.value.trim(); if (!v) return er.textContent = oerr('missing_fields'); send(g, { gosiRef: v }); };
  var o = $('#ijO', d); if (o) o.onsubmit = function(ev){ ev.preventDefault(); var a = o.elements.a.value, b = o.elements.b.value; if (!a || !b || b < a) return er.textContent = oerr('bad_range'); send(o, { offFrom: a, offTo: b }); };
  var c = $('#ijC', d); if (c) c.onsubmit = function(ev){ ev.preventDefault(); var v = c.elements.n.value.trim(); if (!v) return er.textContent = oerr('note_required', 'close'); send(c, { close: true, note: v }); };
}
/** Anyone reports for themselves; a manager for their team and HR for anyone (selfOnly from "ملفي"). */
function reportInjury(selfOnly, done){
  var r = roles(), others = !selfOnly && (r.hr || r.manager), now = riyadhNow();
  var d = drawer('<h3>' + t('ijReport') + '</h3><p class="notice">' + ph('first-aid-kit') + ' ' + t('ijLead') + '</p><form class="form" id="irF">' +
    (others ? fld(t('ijEmp'), '<select name="emp"><option value="">' + esc(t('opMe') + ' (' + (S.me ? S.me.name : '') + ')') + '</option></select>') : '') +
    fld(t('ijWhen'), '<input name="when" type="datetime-local" required max="' + now + '" value="' + now + '">') + fld(t('ijPlace'), '<input name="place" required maxlength="200">') +
    fld(t('ijDesc'), '<textarea name="desc" rows="3" maxlength="2000"></textarea>') + fld(t('ijAid'), '<input name="aid" maxlength="500">') + fld(t('ijWit'), '<input name="wit" maxlength="300">') +
    '<p class="hr-bad" id="irE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('ijReport') + '</button></div></form>');
  var f = $('#irF', d), er = $('#irE', d);
  if (others) people(function(rows){ var s = f.elements.emp; s.innerHTML = s.options[0].outerHTML + rows.map(function(e){ return '<option value="' + esc(e.id) + '">' + esc(e.name + ' (' + e.empNo + ')') + '</option>'; }).join(''); });
  f.onsubmit = function(ev){
    ev.preventDefault();
    var when = f.elements.when.value, place = f.elements.place.value.trim(), desc = f.elements.desc.value.trim();
    if (!when || when.slice(0, 10) > riyadhToday()) return er.textContent = oerr('bad_date');
    if (!place || desc.length < 10) return er.textContent = oerr('missing_fields');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('injuryReport', { injury: { empId: (others && f.elements.emp.value) || S.me.id, occurredAt: when, place: place, description: desc, firstAid: f.elements.aid.value.trim(), witnesses: f.elements.wit.value.trim() } }).then(function(x){
      b.disabled = false;
      if (!x.ok) return er.textContent = oerr(x.error, 'injury');
      d.remove(); toast(x.injury.ref + ' · ' + t('ijGosiDue') + ' ' + fmt(x.injury.gosiDue)); done(); refreshTasks();
    });
  };
}

// ================= company assets in custody =================
var ASSET_TYPES = ['vehicle', 'pos', 'phone', 'laptop', 'uniform', 'cylinders', 'card', 'tool', 'other'];
var ASSET_ICON = { vehicle: 'truck', pos: 'credit-card', phone: 'device-mobile', laptop: 'laptop', uniform: 't-shirt', cylinders: 'cylinder', card: 'identification-card', tool: 'wrench', other: 'cube' };
var AST_CLS = { available: 'in', assigned: 'leave', lost: 'absent', retired: 'off' };
function custody(body){
  var hr = roles().hr, again = function(){ custody(body); };
  body.innerHTML = head(t('opCustody'), hr ? btn('asN', 'plus', t('asRegister')) : '') + '<div id="asB"></div>';
  var el = $('#asB', body), nb = $('#asN', body);
  if (nb) nb.onclick = function(){ assetDrawer(null, again); };
  busy(el);
  apiFresh('assetList', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    // toDecide: the charges this person may approve (payroll, never their own proposal or custody). charges: HR's overview of every proposal.
    var toDecide = r.toDecide || [], can = {};
    if (r.canApproveCharge) toDecide.forEach(function(c){ can[c.id] = 1; });
    var charges = (r.charges && r.charges.length ? r.charges : toDecide).map(function(c){ var x = toDecide.filter(function(y){ return y.id === c.id; })[0]; return x ? Object.assign({}, c, { proposedBy: x.proposedBy }) : c; });
    if (!r.rows) { // payroll without HR: only the charges waiting for their approval
      el.innerHTML = '<p class="hr-hint">' + t('asPayrollView') + '</p>' + (toDecide.length ? chargesBlock(toDecide, can) : empty('hand-coins', t('asNoCharges')));
      return wireCharges(el, toDecide, again);
    }
    var rows = r.rows, V = window.Viz, h = '';
    var held = rows.filter(function(a){ return a.holder; }), noAck = held.filter(function(a){ return !a.holder.ack; });
    if (V && rows.length) {
      var byT = {}; rows.forEach(function(a){ if (a.status !== 'retired') byT[a.type] = (byT[a.type] || 0) + 1; });
      var bars = Object.keys(byT).map(function(k){ return tip(t('at_' + k), byT[k]); }).sort(byValue);
      h += V.panel('custody', t('asDash'), '<div class="db-tiles">' + V.tile(t('asHeldT'), V.n1(held.length, 0), t('asTotalT') + ': ' + rows.length, null, true, true) +
        V.tile(t('asAvailT'), V.n1(rows.filter(function(a){ return a.status === 'available'; }).length, 0), '') +
        V.tile(t('asNoAckT'), '<span class="db-status">' + (noAck.length ? ph('hourglass') + ' ' : '') + noAck.length + '</span>', '') +
        V.tile(t('asValueT'), V.sar(held.reduce(function(s, a){ return s + (Number(a.value) || 0); }, 0)), '') + V.tile(t('asChargesT'), V.n1(charges.length, 0), '') + '</div>' +
        (bars.length ? '<div class="db-grid">' + V.card('ast', t('asByType'), '', V.hbars(bars), V.tbl([t('asType'), t('opCount')], bars.map(function(x){ return [esc(x.label), x.value]; }))) + '</div>' : ''));
    }
    h += chargesBlock(charges, can);
    h += '<h3 class="hr-sub">' + t('opCustody') + '</h3><div class="toolbar"><input class="grow" type="search" id="asQ" placeholder="' + t('opSearch') + '" aria-label="' + t('opSearch') + '" value="' + esc(S.opAsQ || '') + '">' +
      '<select id="asT" aria-label="' + t('asType') + '">' + opts(ASSET_TYPES.map(function(k){ return [k, t('at_' + k)]; }), S.opAsT || '', t('asAllTypes')) + '</select>' +
      '<select id="asS" aria-label="' + t('asAllSt') + '">' + opts(['available', 'assigned', 'lost', 'retired'].map(function(k){ return [k, t('ast_' + k)]; }), S.opAsS || '', t('asAllSt')) + '</select></div><div id="asL"></div>';
    el.innerHTML = h; if (V) V.wire(el);
    wireCharges(el, charges, again);
    function list(){
      var q = (S.opAsQ || '').toLowerCase(), ty = S.opAsT || '', s = S.opAsS || '', box = $('#asL', el);
      var l = rows.filter(function(a){ var e = a.holder && a.holder.emp; return (!ty || a.type === ty) && (!s || a.status === s) && (!q || [a.nameAr, a.ref, a.serial, e && e.name, e && e.empNo].join(' ').toLowerCase().indexOf(q) >= 0); })
        .sort(function(a, b){ return String(a.ref).localeCompare(String(b.ref)); });
      box.innerHTML = !rows.length ? empty('package', t('asNone')) : l.length ? '<div class="list">' + l.map(function(a){ return assetRow(a, rows.indexOf(a)); }).join('') + '</div>' : empty('magnifying-glass', t('asNoMatch'));
      $$('[data-as]', box).forEach(function(b){ b.onclick = function(){ assignDrawer(rows[b.dataset.as], again); }; });
      $$('[data-ar]', box).forEach(function(b){ b.onclick = function(){ returnDrawer(rows[b.dataset.ar], again); }; });
      $$('[data-ae]', box).forEach(function(b){ b.onclick = function(){ assetDrawer(rows[b.dataset.ae], again); }; });
    }
    $('#asQ', el).oninput = function(){ S.opAsQ = this.value; list(); };
    $('#asT', el).onchange = function(){ S.opAsT = this.value; list(); };
    $('#asS', el).onchange = function(){ S.opAsS = this.value; list(); };
    list();
  });
}
function assetRow(a, i){
  var h = a.holder;
  return '<div class="row"><div class="av">' + ph(ASSET_ICON[a.type] || 'cube') + '</div><div class="main"><b>' + esc(a.nameAr) + '</b>' +
    '<small><bdi>' + esc(a.ref) + '</bdi> · ' + t('at_' + a.type) + (a.serial ? ' · <bdi>' + esc(a.serial) + '</bdi>' : '') + (a.value ? ' · ' + money(a.value) : '') + '</small>' +
    (h ? '<small class="op-sub">' + t('asHolder') + ' ' + empLine(h.emp) + ' · ' + t('asSince') + ' ' + fmt(day(h.since)) + ' · ' + (h.ack ? t('asAcked') : '<span class="op-late">' + t('asNotAcked') + '</span>') + '</small>' : '') + '</div>' +
    '<div class="op-acts">' + chip(t('ast_' + a.status), AST_CLS[a.status]) +
    (a.status === 'available' ? '<button type="button" class="btn btn-dark btn-sm" data-as="' + i + '">' + ph('handshake') + t('asAssign') + '</button>' : '') +
    (h ? '<button type="button" class="btn btn-line btn-sm" data-ar="' + i + '">' + ph('arrow-u-down-left') + t('asReturn') + '</button>' : '') +
    '<button type="button" class="btn btn-line btn-sm" data-ae="' + i + '" aria-label="' + t('asEdit') + '" title="' + t('asEdit') + '">' + ph('pencil-simple') + '</button></div></div>';
}
function assetDrawer(a, done){
  var d = drawer('<h3>' + (a ? t('asEdit') + ' <bdi class="chip">' + esc(a.ref) + '</bdi>' : t('asRegister')) + '</h3><form class="form" id="adF">' +
    fld(t('asType'), '<select name="type" required>' + opts(ASSET_TYPES.map(function(k){ return [k, t('at_' + k)]; }), a ? a.type : '', '-') + '</select>') +
    fld(t('asName'), '<input name="nameAr" required maxlength="120" value="' + esc(a ? a.nameAr : '') + '">') +
    '<div class="two">' + fld(t('asSerial'), '<input name="serial" dir="ltr" maxlength="80" value="' + esc(a ? a.serial : '') + '">') +
    fld(t('asValue') + ' (' + sar() + ')', '<input name="value" type="number" min="0" step="0.01" inputmode="decimal" value="' + (a && a.value ? a.value : '') + '">') + '</div>' +
    fld(t('asNote'), '<input name="note" maxlength="300" value="' + esc(a ? a.note : '') + '">') +
    (a && a.status === 'available' ? '<label class="hr-check"><input type="checkbox" name="retire"><span>' + t('asRetire') + '</span></label>' : '') +
    '<p class="hr-bad" id="adE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('opSave') + '</button></div></form>');
  var f = $('#adF', d), er = $('#adE', d);
  f.onsubmit = function(ev){
    ev.preventDefault();
    var v = f.elements.value.value === '' ? 0 : Number(f.elements.value.value);
    if (!f.elements.type.value || !f.elements.nameAr.value.trim()) return er.textContent = oerr('missing_fields');
    if (!(v >= 0)) return er.textContent = oerr('bad_value');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('assetSave', { asset: { id: a ? a.id : '', type: f.elements.type.value, nameAr: f.elements.nameAr.value.trim(), serial: f.elements.serial.value.trim(), value: v, note: f.elements.note.value.trim(), retire: !!(f.elements.retire && f.elements.retire.checked) } }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error);
      d.remove(); toast(t('asSaved') + ' · ' + r.asset.ref); done();
    });
  };
}
function assignDrawer(a, done){
  var d = drawer('<h3>' + t('asAssign') + ': ' + esc(a.nameAr) + '</h3><p class="hr-hint"><bdi>' + esc(a.ref) + '</bdi>' + (a.serial ? ' · <bdi>' + esc(a.serial) + '</bdi>' : '') + '</p><form class="form" id="agF">' +
    fld(t('dcEmp'), '<select name="emp" required><option value="">-</option></select>') + fld(t('asCondOut'), '<input name="cond" maxlength="200" value="' + esc(t('asCondDefault')) + '">') +
    '<p class="hr-hint">' + t('asAssignLead') + '</p><p class="hr-bad" id="agE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('handshake') + t('asAssign') + '</button></div></form>');
  var f = $('#agF', d), er = $('#agE', d);
  people(function(rows){ f.elements.emp.innerHTML = empOpts(rows); }, true);
  f.onsubmit = function(ev){
    ev.preventDefault();
    if (!f.elements.emp.value) return er.textContent = oerr('missing_fields');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('assetAssign', { assetId: a.id, empId: f.elements.emp.value, condition: f.elements.cond.value.trim() }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error);
      d.remove(); toast(t('asAssigned')); done();
    });
  };
}
function returnDrawer(a, done){
  var h = a.holder || {};
  var d = drawer('<h3>' + t('asReturn') + ': ' + esc(a.nameAr) + '</h3><p class="hr-hint"><bdi>' + esc(a.ref) + '</bdi> · ' + t('asHolder') + ' ' + empLine(h.emp) + ' · ' + t('asSince') + ' ' + fmt(day(h.since)) + '</p><form class="form" id="rtF">' +
    '<div class="field"><label>' + t('asCond') + '</label><div class="checks" role="radiogroup" aria-label="' + t('asCond') + '">' + ['good', 'damaged', 'lost'].map(function(c, i){ return '<label><input type="radio" name="cond" value="' + c + '"' + (i ? '' : ' checked') + '>' + t('ac_' + c) + '</label>'; }).join('') + '</div></div>' +
    '<div class="form hidden" id="rtC">' + fld(t('asCharge') + ' (' + sar() + ')', '<input name="charge" type="number" min="0" step="0.01" inputmode="decimal"' + (a.value ? ' max="' + a.value + '"' : '') + '>', a.value ? t('asChargeMax') + ' ' + money(a.value) : '') +
    '<p class="hr-hint">' + t('asChargeLead') + '</p></div>' + fld(t('asNote'), '<input name="note" maxlength="300">') +
    '<p class="hr-bad" id="rtE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('asReturn') + '</button></div></form>');
  var f = $('#rtF', d), er = $('#rtE', d);
  $$('[name=cond]', f).forEach(function(x){ x.onchange = function(){ $('#rtC', d).classList.toggle('hidden', f.elements.cond.value === 'good'); }; });
  f.onsubmit = function(ev){
    ev.preventDefault();
    var cond = f.elements.cond.value, charge = cond === 'good' ? 0 : Number(f.elements.charge.value) || 0;
    if (charge < 0) return er.textContent = oerr('bad_value');
    if (charge && a.value && charge > a.value) return er.textContent = oerr('charge_over_value');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('assetReturn', { id: h.custodyId, condition: cond, charge: charge, note: f.elements.note.value.trim() }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error, 'return');
      d.remove(); toast(t('asReturned')); done(); refreshTasks();
    });
  };
}
/** can: ids this viewer may approve or reject (from toDecide); the others are shown read-only. */
function chargesBlock(list, can){
  if (!list.length) return '';
  return '<h3 class="hr-sub">' + t('asCharges') + '</h3><p class="hr-hint">' + t('asPayrollOnly') + '</p><div class="list">' + list.map(function(c, i){
    var a = c.asset || {};
    return '<div class="row">' + av(c.emp) + '<div class="main"><b>' + empName(c.emp) + '</b><small><bdi class="num">' + esc(c.emp ? c.emp.empNo : '') + '</bdi> · ' + esc(a.nameAr || '') + ' <bdi>' + esc(a.ref || '') + '</bdi> · ' + t('ac_' + c.status) +
      (c.returnedAt ? ' · ' + fmt(day(c.returnedAt)) : '') + (c.conditionIn && c.conditionIn !== c.status ? ' · ' + esc(c.conditionIn) : '') + (c.proposedBy ? ' · ' + t('asProposedBy') + ' ' + esc(c.proposedBy) : '') + '</small></div>' +
      '<div class="op-acts"><b>' + money(c.charge) + '</b>' + (can && can[c.id] ? '<button type="button" class="btn btn-dark btn-sm" data-ca="' + i + '">' + t('asApprove') + '</button><button type="button" class="btn btn-line btn-sm" data-cr="' + i + '">' + t('asReject') + '</button>' : '') + '</div></div>';
  }).join('') + '</div>';
}
function wireCharges(root, list, again){
  $$('[data-ca]', root).forEach(function(b){ confirmTap(b, function(){
    api('assetCharge', { id: list[b.dataset.ca].id, approve: true }).then(function(r){ if (!r.ok) { b.disabled = false; delete b.dataset.armed; b.textContent = t('asApprove'); return toast(oerr(r.error, 'charge')); } toast(t('asApproved')); again(); refreshTasks(); });
  }); });
  $$('[data-cr]', root).forEach(function(b){ b.onclick = function(){
    var c = list[b.dataset.cr];
    var d = drawer('<h3>' + t('asReject') + '</h3><p class="hr-hint">' + empLine(c.emp) + ' · ' + money(c.charge) + '</p><form class="form" id="crF">' + fld(t('asRejectNote'), '<textarea name="n" rows="2" maxlength="300"></textarea>') +
      '<p class="hr-bad" id="crE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('asReject') + '</button></div></form>');
    var f = $('#crF', d);
    f.onsubmit = function(ev){
      ev.preventDefault();
      var n = f.elements.n.value.trim(); if (!n) return $('#crE', d).textContent = oerr('note_required');
      api('assetCharge', { id: c.id, approve: false, note: n }).then(function(r){ if (!r.ok) return $('#crE', d).textContent = oerr(r.error, 'charge'); d.remove(); toast(t('asRejected')); again(); refreshTasks(); });
    };
  }; });
}

// ================= offboarding clearance =================
var OB_REASONS = ['resignation', 'termination', 'contract_end', 'retirement', 'other'];
function offboarding(body){
  var hr = roles().hr, again = function(){ offboarding(body); };
  body.innerHTML = head(t('opOffboarding'), hr ? btn('obN', 'user-minus', t('obStart')) : '') + '<p class="hr-hint" style="margin:-6px 0 12px">' + t('obLead') + '</p><div id="obB"></div>';
  var el = $('#obB', body), nb = $('#obN', body);
  if (nb) nb.onclick = function(){ startClearance(again); };
  busy(el);
  apiFresh('clearanceList', {}, function(r){
    if (!el.isConnected) return;
    if (!r.ok) return el.innerHTML = bad(r.error);
    var rows = r.rows.filter(function(x){ return !x.emp || x.emp.id !== S.me.id; }), V = window.Viz, h = '';
    var open = rows.filter(function(x){ return x.status === 'open'; });
    if (V && rows.length) {
      var mine = open.reduce(function(s, x){ return s + x.tasks.filter(function(k){ return k.canTick; }).length; }, 0);
      var soon = open.filter(function(x){ return x.daysLeft >= 0 && x.daysLeft <= 14; }).length;
      var heldN = open.filter(function(x){ return x.tasks.some(function(k){ return k.key === 'assets' && k.status !== 'done'; }); }).length;
      var own = {}; open.forEach(function(x){ x.tasks.forEach(function(k){ if (k.status !== 'done') own[k.owner] = (own[k.owner] || 0) + 1; }); });
      var bars = Object.keys(own).map(function(k){ return tip(t('ob_' + k), own[k]); }).sort(byValue);
      h += V.panel('offboarding', t('obDash'), '<div class="db-tiles">' + V.tile(t('obOpenT'), V.n1(open.length, 0), '', null, true, true) + V.tile(t('obSoonT'), V.n1(soon, 0), '') +
        V.tile(t('obMineT'), '<span class="db-status">' + (mine ? ph('bell-ringing') + ' ' : '') + mine + '</span>', '') + V.tile(t('obHeldT'), V.n1(heldN, 0), '') + '</div>' +
        (bars.length ? '<div class="db-grid">' + V.card('obo', t('obByOwner'), '', V.hbars(bars), V.tbl([t('obTasks'), t('opCount')], bars.map(function(x){ return [esc(x.label), x.value]; }))) + '</div>' : ''));
    }
    h += rows.length ? '<div class="list">' + rows.map(clrRow).join('') + '</div>' : empty('sign-out', t('obNone'));
    el.innerHTML = h; if (V) V.wire(el);
    clickable($$('[data-cl]', el), function(x){ clearanceDrawer(rows[x.dataset.cl], again); });
  });
}
function clrRow(x, i){
  var left = x.daysLeft, when = left > 0 ? t('obLeft') + ' ' + plural(left, 'days') : left === 0 ? t('obToday') : t('obPast') + ' ' + plural(-left, 'days');
  return '<div class="row click" tabindex="0" role="button" data-cl="' + i + '">' + av(x.emp) + '<div class="main"><b>' + empName(x.emp) + '</b><small><bdi>' + esc(x.ref) + '</bdi> · ' + t('or_' + x.reason) + ' · ' + t('obLastDay') + ' ' + fmt(x.lastDay) +
    (x.status === 'open' ? ' · ' + when : '') + '</small>' + bar(x.done / x.total * 100) + '</div><div class="op-acts"><span class="num">' + x.done + ' / ' + x.total + '</span>' +
    chip(x.status === 'cleared' ? t('obCleared') : t('obOpen'), x.status === 'cleared' ? 'in' : 'late') + '</div></div>';
}
function taskRow(k, others){
  var done = k.status === 'done', lockPaid = k.key === 'paid' && !done && !others;
  var sub = t('ob_' + k.owner) + (done && k.at ? ' · ' + fmt(day(k.at)) : '') + (k.note ? ' · ' + esc(k.note) : '') +
    (k.key === 'assets' && !done && k.held ? ' · <span class="op-late">' + t('obHeld') + ': <span class="num">' + k.held + '</span></span>' : '') + (lockPaid ? ' · ' + t('obPaidLock') : '');
  var act = !done && k.canTick ? '<button type="button" class="btn btn-dark btn-sm" data-tick="' + esc(k.key) + '">' + ph('check') + t('obDone') + '</button>'
    : lockPaid && roles().payroll ? '<button type="button" class="btn btn-line btn-sm" disabled title="' + t('obPaidLock') + '">' + ph('lock-simple') + t('obDone') + '</button>' : '';
  return '<div class="op-task' + (done ? ' done' : '') + '">' + ph(done ? 'check-circle' : 'circle', done ? 'fill' : '') + '<div class="main"><b>' + esc(lang(k.ar, k.en)) + '</b><small>' + sub + '</small><div data-slot="' + esc(k.key) + '"></div></div>' + act + '</div>';
}
/** The 8 tasks; each person ticks only their own (the server says which: canTick). Ticking asks for an optional note. */
function clearanceDrawer(x, done){
  var d = drawer('<div id="clB"></div>'), box = $('#clB', d);
  function draw(c){
    var others = c.tasks.filter(function(k){ return k.key !== 'paid'; }).every(function(k){ return k.status === 'done'; });
    box.innerHTML = '<h3>' + empName(c.emp) + '</h3><p class="hr-hint"><bdi>' + esc(c.ref) + '</bdi> · ' + t('or_' + c.reason) + ' · ' + t('obLastDay') + ' ' + fmt(c.lastDay) + ' · <span class="num">' + c.done + ' / ' + c.total + '</span> · ' +
      chip(c.status === 'cleared' ? t('obCleared') : t('obOpen'), c.status === 'cleared' ? 'in' : 'late') + '</p>' + bar(c.done / c.total * 100) +
      (roles().hr ? '<div class="op-box" style="margin-top:14px"><div class="btnrow" style="margin:0"><button type="button" class="btn btn-line btn-sm" id="clCert">' + ph('printer') + t('obCert') + '</button></div><p class="hr-hint">' + t('obCertLead') + '</p></div>' : '') +
      '<h4 class="op-h4">' + ph('list-checks') + t('obTasks') + '</h4><div>' + c.tasks.map(function(k){ return taskRow(k, others); }).join('') + '</div><p class="hr-bad" id="clE" role="alert"></p>';
    var cb = $('#clCert', box); if (cb) cb.onclick = function(){ printCertificate(c); };
    $$('[data-tick]', box).forEach(function(b){ b.onclick = function(){
      var key = b.dataset.tick, slot = $('[data-slot="' + key + '"]', box);
      b.remove();
      slot.innerHTML = '<div class="op-inline"><input maxlength="300" placeholder="' + t('opNoteOpt') + '" aria-label="' + t('opNoteOpt') + '"><button type="button" class="btn btn-dark btn-sm">' + ph('check') + t('obConfirm') + '</button></div>';
      var inp = $('input', slot), ok = $('button', slot); inp.focus();
      inp.onkeydown = function(ev){ if (ev.key === 'Enter') { ev.preventDefault(); ok.click(); } };
      ok.onclick = function(){
        ok.disabled = true;
        api('clearanceTask', { id: c.id, key: key, note: inp.value.trim() }).then(function(r){
          if (!r.ok) { ok.disabled = false; return $('#clE', box).textContent = oerr(r.error, key === 'paid' ? 'paid' : 'task'); }
          toast(t('obTicked')); draw(r.clearance); done(); refreshTasks();
        });
      };
    }; });
  }
  draw(x);
}
function startClearance(done){
  var d = drawer('<h3>' + t('obStart') + '</h3><p class="hr-hint">' + t('obLead') + '</p><form class="form" id="obF">' + fld(t('obEmp'), '<select name="emp" required><option value="">-</option></select>') +
    '<div class="two">' + fld(t('obLastDay'), '<input name="last" type="date" required value="' + riyadhToday() + '">') + fld(t('obReason'), '<select name="reason">' + opts(OB_REASONS.map(function(k){ return [k, t('or_' + k)]; }), 'resignation') + '</select>') + '</div>' +
    '<p class="hr-bad" id="obE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('user-minus') + t('obStart') + '</button></div></form>');
  var f = $('#obF', d), er = $('#obE', d), all = [];
  people(function(rows){ all = rows; f.elements.emp.innerHTML = empOpts(rows); });
  f.elements.emp.onchange = function(){ var e = all.filter(function(x){ return x.id === f.elements.emp.value; })[0]; if (e && e.lastWorkingDay) f.elements.last.value = String(e.lastWorkingDay).slice(0, 10); };
  f.onsubmit = function(ev){
    ev.preventDefault();
    if (!f.elements.emp.value) return er.textContent = oerr('missing_fields');
    if (!f.elements.last.value) return er.textContent = oerr('bad_date');
    var b = f.querySelector('[type=submit]'); b.disabled = true;
    api('clearanceStart', { empId: f.elements.emp.value, lastDay: f.elements.last.value, reason: f.elements.reason.value }).then(function(r){
      b.disabled = false;
      if (!r.ok) return er.textContent = oerr(r.error, 'clearance');
      d.remove(); toast(t('obStarted') + ' · ' + r.clearance.ref); done(); refreshTasks();
    });
  };
}
/**
 * Service certificate (Labour Law Art. 64): name, employee no., position, start date and last working day, on the
 * letterhead. No pay figures. The window opens inside the click (popup blockers), then fills once the directory is read.
 */
function printCertificate(c){
  var w = window.open('', '_blank');
  if (!w) return toast(t('cePopup'));
  w.document.open(); w.document.write('<!doctype html><meta charset="utf-8"><p style="font-family:Tahoma,sans-serif;padding:24px">' + esc(t('ceLoading')) + '</p>');
  var fill = function(dir){
    var emp = c.emp || {}, e = (dir || []).filter(function(x){ return x.id === emp.id; })[0] || {}, en = S.lang === 'en';
    var name = en && emp.nameEn ? emp.nameEn : emp.name, pos = e.positionName || emp.title || '', hire = e.hireDate ? String(e.hireDate).slice(0, 10) : '', last = c.lastDay, fem = e.gender === 'female', today = riyadhToday();
    var dG = function(s){ return s ? new Date(s + 'T12:00:00Z').toLocaleDateString(en ? 'en-GB' : 'ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '-'; };
    var dH = function(s){ if (!s) return ''; try { return new Date(s + 'T12:00:00Z').toLocaleDateString((en ? 'en-GB' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (x) { return ''; } };
    var text = en
      ? '<p>This is to certify that ' + (fem ? 'Ms.' : 'Mr.') + ' <b>' + esc(name) + '</b>, employee no. <bdi>' + esc(emp.empNo) + '</bdi>, worked with ' + esc(coName('en')) + ' as <b>' + esc(pos || '-') + '</b> from ' + dG(hire) + ' until ' + dG(last) + ', the last working day.</p>' +
        '<p>This certificate is issued free of charge at the end of service under Article 64 of the Labour Law, without any liability on the company.</p>'
      : '<p>تشهد ' + esc(coName('ar')) + ' بأن ' + (fem ? 'السيدة' : 'السيد') + ' / <b>' + esc(name) + '</b>، الرقم الوظيفي <bdi>' + esc(emp.empNo) + '</bdi>، ' + (fem ? 'عملت' : 'عمل') + ' لديها بوظيفة <b>' + esc(pos || '-') + '</b> من تاريخ ' + dG(hire) + ' حتى تاريخ ' + dG(last) + '، وهو آخر يوم عمل ' + (fem ? 'لها' : 'له') + '.</p>' +
        '<p>وقد أعطيت ' + (fem ? 'لها' : 'له') + ' هذه الشهادة دون مقابل عند انتهاء الخدمة تطبيقا للمادة الرابعة والستين من نظام العمل، دون أدنى مسؤولية على الشركة.</p>';
    var facts = [[t('ceName'), esc(name)], [t('ceNo'), '<bdi>' + esc(emp.empNo) + '</bdi>'], [t('cePos'), esc(pos || '-')], [t('ceHire'), dG(hire) + (hire ? '<small>' + dH(hire) + '</small>' : '')], [t('ceLast'), dG(last) + '<small>' + dH(last) + '</small>']];
    var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc(t('ceTitle') + ' ' + c.ref) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600&display=swap" rel="stylesheet"><style>@page{size:A4;margin:22mm 20mm}' +
      'body{font-family:"Readex Pro",Tahoma,sans-serif;color:#17221A;font-size:15px;line-height:2;margin:0}bdi{unicode-bidi:isolate}' +
      'header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #4D6D51;padding-bottom:12px;margin-bottom:26px}header img{height:64px}header div{text-align:end;font-size:12px;color:#4A5A4D;line-height:1.6}' +
      'h1{text-align:center;font-size:22px;margin:10px 0 24px;color:#1C2A1F}.meta{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#4A5A4D;margin-bottom:18px}' +
      'table{width:100%;border-collapse:collapse;margin:18px 0 22px;font-size:14px;line-height:1.7}td{border:1px solid #DAD5C8;padding:8px 12px;vertical-align:top}td:first-child{width:34%;background:#F2EEE4;color:#4A5A4D}td small{display:block;color:#5F6D63;font-size:12px}' +
      '.sign{display:flex;justify-content:space-between;margin-top:56px;font-size:14px}.sign div{width:42%}.sign span{display:block;border-top:1px solid #8F8878;margin-top:46px;padding-top:4px;font-size:12px;color:#5F6D63}' +
      'footer{position:fixed;bottom:0;left:0;right:0;font-size:11px;color:#8A948B;text-align:center;border-top:1px solid #DAD5C8;padding-top:6px}</style></head><body>' +
      '<header><img src="' + logoInk() + '" alt=""><div>' + esc(coName(en ? 'en' : 'ar')) + '<br>' + (en ? 'Human Resources' : 'إدارة الموارد البشرية') + (coMeta(en ? 'en' : 'ar') ? '<br>' + coMeta(en ? 'en' : 'ar') : '') + '</div></header>' +
      '<div class="meta"><span>' + t('ceRef') + ': <bdi>' + esc(c.ref) + '</bdi></span><span>' + t('ceDate') + ': ' + dG(today) + ' · ' + dH(today) + '</span></div>' +
      '<h1>' + t('ceTitle') + '</h1>' + text + '<table>' + facts.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' +
      '<div class="sign"><div><b>' + t('ceHr') + '</b><span>' + t('ceSign') + '</span></div><div><b>&nbsp;</b><span>' + t('ceStamp') + '</span></div></div>' +
      '<footer>' + t('ceVerify') + ' <bdi>' + esc(c.ref) + '</bdi></footer>' +
      '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>';
    if (w.closed) return;
    w.document.open(); w.document.write(html); w.document.close(); if (window.docBar) docBar(w);
  };
  if (window.HrDirLoad) HrDirLoad(fill); else fill([]);
}

// ================= employee cards in "ملفي" (same slot pattern as Engage.myCards) =================
function myCards(el){
  el.innerHTML = '';
  var slots = {}, again = function(){ myCards(el); };
  ['cases', 'assets', 'injury'].forEach(function(k){ var d = document.createElement('div'); d.className = 'mf-card op-card' + (k === 'injury' ? '' : ' hidden'); el.appendChild(d); slots[k] = d; });
  var h3 = function(icon, title, extra){ return '<h3><span class="ic">' + ph(icon) + '</span>' + title + '<span class="sp"></span>' + (extra || '') + '</h3>'; };
  apiFresh('assetList', {}, function(r){
    var d = slots.assets; if (!d.isConnected) return;
    if (!r.ok || !r.mine || !r.mine.length) return d.classList.add('hidden');
    var todo = r.mine.filter(function(c){ return c.status === 'held' && !c.ackAt; }).length;
    d.classList.remove('hidden');
    d.innerHTML = h3('package', t('myAssets'), todo ? chip('<span class="num">' + todo + '</span>', 'late') : '') + (todo ? '<p>' + t('myAckLead') + '</p>' : '') + r.mine.map(function(c){
      var a = c.asset || {};
      return '<div class="row"><div class="av">' + ph(ASSET_ICON[a.type] || 'cube') + '</div><div class="main"><b>' + esc(a.nameAr || '') + '</b><small><bdi>' + esc(a.ref || '') + '</bdi>' + (a.serial ? ' · <bdi>' + esc(a.serial) + '</bdi>' : '') +
        ' · ' + t('myHanded') + ' ' + fmt(day(c.handedAt)) + (c.conditionOut ? ' · ' + esc(c.conditionOut) : '') + '</small>' +
        (c.chargeStatus === 'proposed' ? '<small class="op-sub op-late">' + t('myCharge') + ': ' + money(c.charge) + '</small>' : '') + '</div>' +
        (c.status === 'held' && !c.ackAt ? '<button type="button" class="btn btn-dark btn-sm" data-ack="' + esc(c.id) + '">' + ph('check') + t('myAck') + '</button>' : c.ackAt ? chip(ph('check') + t('myAcked'), 'in') : '') + '</div>';
    }).join('');
    $$('[data-ack]', d).forEach(function(b){ confirmTap(b, function(){
      api('assetAck', { id: b.dataset.ack }).then(function(x){ if (!x.ok) { b.disabled = false; return toast(oerr(x.error)); } toast(t('myAcked')); again(); refreshTasks(); });
    }); });
  }, true);
  apiFresh('discList', {}, function(r){
    var d = slots.cases; if (!d.isConnected) return;
    var mine = r.ok ? r.rows.filter(function(x){ return x.mine; }) : [];
    if (!mine.length) return d.classList.add('hidden');
    var todo = mine.filter(function(x){ return x.canRespond || x.canObject; }).length;
    d.classList.remove('hidden');
    d.innerHTML = h3('gavel', t('myCases'), todo ? chip('<span class="num">' + todo + '</span>', 'late') : '') + mine.slice(0, 6).map(function(x, i){
      var b = x.canRespond ? '<button type="button" class="btn btn-dark btn-sm" data-mc="' + i + '">' + ph('chat-text') + t('myRespond') + '</button>'
        : x.canObject ? '<button type="button" class="btn btn-line btn-sm" data-mc="' + i + '">' + ph('megaphone') + t('myObject') + '</button>'
        : '<button type="button" class="btn btn-line btn-sm" data-mc="' + i + '" aria-label="' + t('opView') + '" title="' + t('opView') + '">' + ph('eye') + '</button>';
      return '<div class="row"><div class="main"><b>' + esc(x.violation) + '</b><small><bdi>' + esc(x.ref) + '</bdi> · ' + fmt(x.incidentDate) + ' · ' + myStatus(x.status) + (x.decision ? ' · ' + esc(penLabel(x.decision)) : '') + '</small></div>' + b + '</div>';
    }).join('');
    $$('[data-mc]', d).forEach(function(b){ b.onclick = function(){ myCase(mine[b.dataset.mc], again); }; });
  }, true);
  var inj = slots.injury;
  inj.innerHTML = h3('first-aid-kit', t('myInjury')) + '<p>' + t('myInjLead') + '</p><div data-myinj></div><button type="button" class="btn btn-line btn-sm mf-go" data-rep>' + ph('first-aid-kit') + t('myInjBtn') + '</button>';
  inj.querySelector('[data-rep]').onclick = function(){ reportInjury(true, again); };
  apiFresh('injuryList', {}, function(r){
    var box = inj.querySelector('[data-myinj]'); if (!box || !r.ok) return;
    box.innerHTML = r.rows.filter(function(x){ return x.emp && x.emp.id === S.me.id; }).slice(0, 3).map(function(x){
      return '<div class="row"><div class="main"><b>' + esc(x.place) + '</b><small><bdi>' + esc(x.ref) + '</bdi> · ' + fmtLocal(x.occurredAt) + '</small></div>' + chip(t('is_' + x.status), IS_CLS[x.status]) + '</div>';
    }).join('');
  }, true);
}
function myStatus(s){ return s === 'charged' ? t('myNewCase') : s === 'responded' ? t('myResponded') : t('ds_' + s); }
/** The employee's own case: answer the charge, see hearings and the decision, object within 30 days of notice (Art. 72 as amended). */
function myCase(x, done){
  var d = drawer('<h3>' + esc(x.violation) + '</h3><p class="hr-hint">' + chip(myStatus(x.status), DS_CLS[x.status]) + ' <bdi>' + esc(x.ref) + '</bdi></p>' +
    meta([[t('dcCode'), '<bdi>' + esc(x.code) + '</bdi> · ' + occLabel(x.occurrence)], [t('dcIncident'), fmt(x.incidentDate)], [t('dcChargedAt'), x.chargedAt ? fmt(day(x.chargedAt)) : ''], [t('dcSuggested'), esc(penLabel(x.suggested))]]) + quote(x.description) +
    (x.response ? '<h4 class="op-h4">' + ph('chat-text') + t('myRespondT') + '</h4>' + quote(x.response) : '') +
    (x.hearings && x.hearings.length ? '<h4 class="op-h4">' + ph('notebook') + t('dcHearings') + '</h4>' + hearingsHtml(x) : '') + decisionHtml(x) + '<div id="mcAct"></div><p class="hr-bad" id="mcE" role="alert"></p>');
  var act = $('#mcAct', d), er = $('#mcE', d);
  var form = function(id, title, lead, btnLabel){ return '<form class="form op-box" id="' + id + '"><h4>' + ph('chat-text') + title + '</h4><p class="hr-hint">' + lead + '</p>' + fld(title, '<textarea name="txt" rows="4" maxlength="2000"></textarea>') + '<div class="btnrow"><button class="btn btn-dark" type="submit">' + btnLabel + '</button></div></form>'; };
  var wire = function(id, action, ctx){
    var f = $('#' + id, d);
    f.onsubmit = function(ev){
      ev.preventDefault();
      var v = f.elements.txt.value.trim(); if (!v) return er.textContent = oerr('missing_fields');
      var b = f.querySelector('[type=submit]'); b.disabled = true;
      api(action, { id: x.id, text: v }).then(function(r){ b.disabled = false; if (!r.ok) return er.textContent = oerr(r.error, ctx); d.remove(); toast(t('opSent')); done(); refreshTasks(); });
    };
  };
  if (x.canRespond) { act.innerHTML = form('mcR', t('myRespondT'), t('myRespondLead'), t('mySendResp')); wire('mcR', 'discRespond', ''); }
  else if (x.canObject) {
    var left = x.objectDaysLeft != null ? x.objectDaysLeft : 0; // the server counts 30 days from notice, official holidays not counted (Art. 72)
    act.innerHTML = form('mcO', t('myObjectT'), t('myObjLead') + ' ' + t('myObjLeft') + ' ' + plural(left, 'days') + (x.objectionDue ? ' (' + fmt(x.objectionDue) + ')' : ''), t('mySendObj')); wire('mcO', 'discObject', 'object');
  } else if (x.status === 'objected') act.innerHTML = '<p class="notice">' + t('myObjPending') + '</p>';
}

window.Ops = { shifts: shifts, relations: relations, custody: custody, offboarding: offboarding, myCards: myCards, penaltyLabel: penLabel };
})();
