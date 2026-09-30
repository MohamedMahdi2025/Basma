// HR console (tab "hr"): people, organisation, positions, salary approvals, documents and expiries, Excel import.
// Loaded on demand. Every list and every field shown is filtered by the server for the viewer's role.
(function(){
'use strict';

Object.assign(T.ar, {
  hrPeople:'الموظفون', hrTeamSec:'فريقي', hrOrg:'الهيكل التنظيمي', hrPositions:'الوظائف', hrApprovals:'اعتماد الرواتب',
  hrExpiring:'الوثائق والانتهاء', hrImport:'استيراد من Excel', hrSearch:'ابحث بالاسم أو الرقم', hrAllDepts:'كل الإدارات',
  hrHeadcount:'الموظفون النشطون', hrSaudis:'السعوديون', hrSaudiPct:'نسبة التوطين المرجحة', hrNoPkg:'سعوديون بلا راتب معتمد',
  hrSaudiLead:'حسب أوزان نطاقات: 1 عند أساسي وسكن 4,000 ر.س فأكثر، و0.5 من 3,000 إلى 3,999.',
  hrName:'الاسم', hrDept:'الإدارة', hrPos:'الوظيفة', hrMgr:'المدير المباشر', hrHire:'تاريخ المباشرة', hrNat:'الجنسية',
  hrSaudi:'سعودي', hrNonSaudi:'غير سعودي', hrNoRows:'لا يوجد موظفون مطابقون.', hrAddEmp:'إضافة موظف',
  tJob:'الوظيفة', tPersonal:'البيانات الشخصية', tPay:'الراتب', tDocs:'الوثائق', tHist:'المسيرة',
  fDept:'الإدارة', fPos:'الوظيفة', fMgr:'المدير المباشر', fHire:'تاريخ المباشرة', fCType:'نوع العقد', fCEnd:'نهاية العقد',
  fProb:'نهاية فترة التجربة', fNat:'الجنسية (رمز الدولة مثل SA)', fGender:'الجنس', g_male:'ذكر', g_female:'أنثى',
  fLoc:'موقع العمل', fCNo:'رقم العقد في قوى', fOcc:'رمز المهنة', fEType:'نوع التوظيف', et_full_time:'دوام كامل',
  et_part_time:'دوام جزئي', et_temporary:'مؤقت', fWeek:'أيام العمل أسبوعيا', fHours:'ساعات العمل يوميا', fLeave:'أيام الإجازة السنوية',
  fNotice:'فترة الإشعار بالأيام', fEff:'تاريخ سريان التغيير', fReason:'سبب التغيير', fChoose:'اختر', fNoneOpt:'بدون',
  fNid:'رقم الهوية أو الإقامة', fIdExp:'انتهاء الهوية أو الإقامة', fBirth:'تاريخ الميلاد', fMarital:'الحالة الاجتماعية',
  ms_single:'أعزب', ms_married:'متزوج', ms_other:'أخرى', fIban:'الآيبان', fBank:'البنك', fGosi:'رقم التأمينات',
  fCohort:'فئة التأمينات', co_legacy:'قبل يوليو 2024', co_new:'من يوليو 2024', fBorder:'رقم الحدود', fPassport:'رقم الجواز',
  fPassExp:'انتهاء الجواز', fNatAddr:'العنوان الوطني', fPEmail:'البريد الشخصي', fNameOff:'الاسم الإنجليزي كما في الهوية والبنك',
  fAddr:'العنوان', fEmName:'اسم جهة الطوارئ', fEmPhone:'هاتف الطوارئ', ibanBad:'رقم الآيبان غير صحيح، تحقق من الأرقام.',
  payNow:'الراتب الساري', payHist:'سجل الرواتب', payPropose:'اقتراح راتب جديد', payBasic:'الأساسي', payHousing:'السكن',
  payTransport:'النقل', payOther:'بدلات أخرى', payAddOther:'إضافة بدل', payLabel:'اسم البدل', payAmount:'المبلغ',
  payTotal:'الإجمالي', payH25:'السكن 25%', payT10:'النقل 10%', paySend:'إرسال للاعتماد', paySent:'أرسل للاعتماد. يعتمده شخص آخر.',
  payNone:'لا يوجد راتب معتمد.', st_pending:'بانتظار الاعتماد', st_approved:'معتمد', st_rejected:'مرفوض',
  payOwnNote:'لا يمكنك اقتراح راتبك.', docAdd:'إضافة وثيقة', docType:'نوع الوثيقة', docNo:'الرقم', docIssue:'تاريخ الإصدار',
  docExp:'تاريخ الانتهاء', docNote:'ملاحظة', docDelete:'حذف', docSaved:'حفظت الوثيقة', docNone:'لا توجد وثائق.',
  rolePayroll:'صلاحية الرواتب', rolePayrollLead:'يعتمد الرواتب ويطلع عليها. يبدأ مفعولها عند الدخول التالي.',
  orgDepts:'حسب الإدارات', orgChart:'حسب المدير', orgAdd:'إضافة إدارة', orgEdit:'تعديل إدارة', orgNameAr:'اسم الإدارة',
  orgNameEn:'الاسم بالإنجليزية', orgCode:'الرمز', orgParent:'تتبع إدارة', orgHead:'مدير الإدارة', orgCost:'مركز التكلفة',
  orgEmpty:'لا توجد إدارات بعد. أضف أول إدارة أو استورد ملف الموظفين.', orgPeople:'موظف', orgActive:'نشطة', orgDisabled:'موقوفة',
  posAdd:'إضافة وظيفة', posEdit:'تعديل وظيفة', posTitleAr:'المسمى الوظيفي', posTitleEn:'المسمى بالإنجليزية', posCode:'الرمز',
  posGrade:'الدرجة', posPurpose:'الغرض من الوظيفة', posDuties:'المهام، كل مهمة في سطر', posReq:'المتطلبات، كل متطلب في سطر',
  posJdOk:'الوصف مكتمل', posJdMissing:'الوصف ناقص', posEmpty:'لا توجد وظائف بعد.', posJdAr:'بالعربية', posJdEn:'بالإنجليزية',
  apEmpty:'لا توجد رواتب بانتظار الاعتماد.', apSelectAll:'تحديد الكل', apApprove:'اعتماد المحدد', apReject:'رفض المحدد',
  apConfirmReject:'اضغط مرة أخرى لتأكيد الرفض', apDone:'تم اعتماد', apRejected:'تم رفض', apMine:'أدخلته أنت', apImport:'استيراد',
  apBy:'أدخله', rsInitial:'الراتب الأول', apEff:'يسري من', exDays:'خلال', exEmpty:'لا شيء ينتهي في هذه المدة.', exExpired:'منتهية منذ', exIn:'بعد',
  imStep1:'حمل القالب', imStep1Lead:'ملف Excel بأعمدة جاهزة وورقة تعليمات. عمود واحد لكل بيان، وصف واحد لكل موظف.',
  imStep2:'ارفع الملف بعد تعبئته', imStep2Lead:'يفحص النظام كل صف قبل الحفظ ولا يحفظ شيئا إذا وجد خطأ واحدا.',
  imStep3:'راجع ثم استورد', imDownload:'تحميل القالب', imChoose:'اختيار ملف', imReading:'جار قراءة الملف',
  imChecking:'جار فحص الصفوف', imRows:'صفوف', imCreate:'موظفون جدد', imUpdate:'موظفون محدثون', imNewDepts:'إدارات جديدة',
  imNewPos:'وظائف جديدة', imErrors:'أخطاء يجب تصحيحها', imNoErrors:'لا أخطاء. الملف جاهز للاستيراد.', imGo:'استيراد الآن',
  imDone:'تم الاستيراد', imGoApprovals:'الانتقال إلى اعتماد الرواتب', imRow:'الصف', imCol:'العمود', imProblem:'المشكلة',
  imMissingCols:'أعمدة مطلوبة غير موجودة في الملف:', imUnknown:'أعمدة غير معروفة تجاهلها النظام:', imEmptyFile:'الملف لا يحتوي صفوف موظفين.',
  imLibFail:'تعذر تحميل قارئ Excel. تحقق من الاتصال.', imSalaries:'رواتب بانتظار الاعتماد', imRequired:'مطلوب', imOptional:'اختياري',
  imFormat:'الصيغة', imTplSheet:'الموظفون', imHelpSheet:'تعليمات', saved:'تم الحفظ', loadFail:'تعذر التحميل. أعد المحاولة.',
  e_manager_cycle:'لا يمكن أن يدير موظفان بعضهما.', e_dept_cycle:'لا يمكن أن تتبع الإدارة إحدى إداراتها الفرعية.',
  e_duplicate_name:'يوجد اسم مطابق مسبقا.', e_bad_iban:'رقم الآيبان غير صحيح.', e_bad_national_id:'رقم الهوية يجب أن يكون 10 أرقام يبدأ بـ 1 أو 2.',
  e_duplicate_national_id:'رقم الهوية مكرر في الملف أو مسجل لموظف آخر.', e_expat_contract_fixed:'عقد غير السعودي يجب أن يكون محدد المدة (المادة 37).',
  e_probation_too_long:'فترة التجربة لا تتجاوز 180 يوما (المادة 53).', e_leave_below_minimum:'الإجازة السنوية لا تقل عن 21 يوما (المادة 109).',
  e_bad_contract_end:'نهاية العقد يجب أن تكون بعد تاريخ المباشرة.', e_second_approver_required:'يعتمد الراتب شخص غير الذي أدخله.',
  e_cannot_change_own_salary:'لا يمكن تعديل أو اعتماد راتبك.', e_bad_amount:'مبلغ غير صحيح.', e_bad_date:'تاريخ غير صحيح.',
  e_bad_value:'قيمة غير مقبولة.', e_bad_email:'بريد إلكتروني غير صحيح.', e_import_invalid:'في الملف أخطاء، لم يحفظ شيء.',
  e_required:'حقل مطلوب فارغ.', e_duplicate_emp_no:'الرقم الوظيفي مكرر.', e_unknown_manager:'رقم المدير غير موجود.',
  e_cannot_change_own_bank:'لا يمكنك تغيير حسابك البنكي بنفسك. يغيره زميل آخر في الموارد البشرية.',
  e_cannot_import_self:'لا يمكنك استيراد بياناتك أنت. احذف صفك من الملف.', e_forbidden_row:'سجل مسؤول النظام لا يعدله إلا مسؤول النظام.',
  e_forbidden:'ليست لديك صلاحية لهذا الإجراء.',
  e_too_many_rows:'الملف أكبر من 2000 صف.', e_not_found:'السجل غير موجود.', e_missing_fields:'أكمل الحقول المطلوبة.'
});
Object.assign(T.en, {
  hrPeople:'People', hrTeamSec:'My team', hrOrg:'Organisation', hrPositions:'Positions', hrApprovals:'Salary approvals',
  hrExpiring:'Documents and expiries', hrImport:'Import from Excel', hrSearch:'Search by name or number', hrAllDepts:'All departments',
  hrHeadcount:'Active employees', hrSaudis:'Saudis', hrSaudiPct:'Weighted Saudization', hrNoPkg:'Saudis without an approved salary',
  hrSaudiLead:'Nitaqat weights: 1 at basic plus housing of SAR 4,000 or more, 0.5 from 3,000 to 3,999.',
  hrName:'Name', hrDept:'Department', hrPos:'Position', hrMgr:'Direct manager', hrHire:'Start date', hrNat:'Nationality',
  hrSaudi:'Saudi', hrNonSaudi:'Non-Saudi', hrNoRows:'No matching employees.', hrAddEmp:'Add employee',
  tJob:'Job', tPersonal:'Personal', tPay:'Salary', tDocs:'Documents', tHist:'History',
  fDept:'Department', fPos:'Position', fMgr:'Direct manager', fHire:'Start date', fCType:'Contract type', fCEnd:'Contract end',
  fProb:'Probation end', fNat:'Nationality (country code such as SA)', fGender:'Gender', g_male:'Male', g_female:'Female',
  fLoc:'Work location', fCNo:'Qiwa contract number', fOcc:'Occupation code', fEType:'Employment type', et_full_time:'Full time',
  et_part_time:'Part time', et_temporary:'Temporary', fWeek:'Working days a week', fHours:'Working hours a day', fLeave:'Annual leave days',
  fNotice:'Notice period in days', fEff:'Change effective from', fReason:'Reason for the change', fChoose:'Choose', fNoneOpt:'None',
  fNid:'National ID or iqama', fIdExp:'ID or iqama expiry', fBirth:'Date of birth', fMarital:'Marital status',
  ms_single:'Single', ms_married:'Married', ms_other:'Other', fIban:'IBAN', fBank:'Bank', fGosi:'GOSI number',
  fCohort:'GOSI group', co_legacy:'Before July 2024', co_new:'From July 2024', fBorder:'Border number', fPassport:'Passport number',
  fPassExp:'Passport expiry', fNatAddr:'National address', fPEmail:'Personal email', fNameOff:'English name as on the ID and bank',
  fAddr:'Address', fEmName:'Emergency contact', fEmPhone:'Emergency phone', ibanBad:'This IBAN is not valid. Check the digits.',
  payNow:'Current salary', payHist:'Salary history', payPropose:'Propose a new salary', payBasic:'Basic', payHousing:'Housing',
  payTransport:'Transport', payOther:'Other allowances', payAddOther:'Add allowance', payLabel:'Allowance name', payAmount:'Amount',
  payTotal:'Total', payH25:'Housing 25%', payT10:'Transport 10%', paySend:'Send for approval', paySent:'Sent for approval. Someone else approves it.',
  payNone:'No approved salary.', st_pending:'Waiting for approval', st_approved:'Approved', st_rejected:'Rejected',
  payOwnNote:'You cannot propose your own salary.', docAdd:'Add document', docType:'Document type', docNo:'Number', docIssue:'Issue date',
  docExp:'Expiry date', docNote:'Note', docDelete:'Delete', docSaved:'Document saved', docNone:'No documents.',
  rolePayroll:'Payroll access', rolePayrollLead:'Sees and approves salaries. Takes effect at the next sign-in.',
  orgDepts:'By department', orgChart:'By manager', orgAdd:'Add department', orgEdit:'Edit department', orgNameAr:'Department name (Arabic)',
  orgNameEn:'Name in English', orgCode:'Code', orgParent:'Belongs to', orgHead:'Department head', orgCost:'Cost centre',
  orgEmpty:'No departments yet. Add the first one or import the employee file.', orgPeople:'people', orgActive:'Active', orgDisabled:'Stopped',
  posAdd:'Add position', posEdit:'Edit position', posTitleAr:'Job title (Arabic)', posTitleEn:'Job title in English', posCode:'Code',
  posGrade:'Grade', posPurpose:'Purpose of the job', posDuties:'Duties, one per line', posReq:'Requirements, one per line',
  posJdOk:'Description complete', posJdMissing:'Description missing', posEmpty:'No positions yet.', posJdAr:'Arabic', posJdEn:'English',
  apEmpty:'No salaries waiting for approval.', apSelectAll:'Select all', apApprove:'Approve selected', apReject:'Reject selected',
  apConfirmReject:'Tap again to confirm rejection', apDone:'Approved', apRejected:'Rejected', apMine:'Entered by you', apImport:'Import',
  apBy:'Entered by', rsInitial:'Starting salary', apEff:'Effective', exDays:'Within', exEmpty:'Nothing expires in this period.', exExpired:'Expired', exIn:'In',
  imStep1:'Download the template', imStep1Lead:'An Excel file with the columns ready and an instructions sheet. One column per field, one row per employee.',
  imStep2:'Upload the filled file', imStep2Lead:'Every row is checked before saving; nothing is saved if one row is wrong.',
  imStep3:'Review, then import', imDownload:'Download template', imChoose:'Choose file', imReading:'Reading the file',
  imChecking:'Checking rows', imRows:'rows', imCreate:'New employees', imUpdate:'Updated employees', imNewDepts:'New departments',
  imNewPos:'New positions', imErrors:'Errors to fix', imNoErrors:'No errors. The file is ready to import.', imGo:'Import now',
  imDone:'Imported', imGoApprovals:'Go to salary approvals', imRow:'Row', imCol:'Column', imProblem:'Problem',
  imMissingCols:'Required columns missing from the file:', imUnknown:'Unknown columns, ignored:', imEmptyFile:'The file has no employee rows.',
  imLibFail:'The Excel reader could not load. Check the connection.', imSalaries:'Salaries waiting for approval', imRequired:'Required', imOptional:'Optional',
  imFormat:'Format', imTplSheet:'Employees', imHelpSheet:'Instructions', saved:'Saved', loadFail:'Could not load. Try again.',
  e_manager_cycle:'Two people cannot manage each other.', e_dept_cycle:'A department cannot belong to one of its own sub-departments.',
  e_duplicate_name:'That name already exists.', e_bad_iban:'The IBAN is not valid.', e_bad_national_id:'The ID must be 10 digits starting with 1 or 2.',
  e_duplicate_national_id:'This ID is repeated in the file or belongs to another employee.', e_expat_contract_fixed:'A non-Saudi contract must be fixed term (Article 37).',
  e_probation_too_long:'Probation cannot exceed 180 days (Article 53).', e_leave_below_minimum:'Annual leave cannot be under 21 days (Article 109).',
  e_bad_contract_end:'The contract end must be after the start date.', e_second_approver_required:'Someone other than the person who entered it must approve it.',
  e_cannot_change_own_salary:'You cannot change or approve your own salary.', e_bad_amount:'Invalid amount.', e_bad_date:'Invalid date.',
  e_bad_value:'Value not accepted.', e_bad_email:'Invalid email.', e_import_invalid:'The file has errors; nothing was saved.',
  e_required:'A required field is empty.', e_duplicate_emp_no:'Employee number repeated.', e_unknown_manager:'Manager number not found.',
  e_cannot_change_own_bank:'You cannot change your own bank account. Another HR colleague has to do it.',
  e_cannot_import_self:'You cannot import your own record. Remove your row from the file.', e_forbidden_row:'Only an administrator can change an administrator record.',
  e_forbidden:'You do not have access to this action.',
  e_too_many_rows:'The file has more than 2,000 rows.', e_not_found:'Record not found.', e_missing_fields:'Complete the required fields.'
});

// Import columns: key, Arabic header, English header, required, format hint (Arabic, English)
var COLS = [
  ['empNo', 'الرقم الوظيفي', 'Employee No', 1, 'أرقام', 'digits'],
  ['nameAr', 'الاسم بالعربية', 'Name (Arabic)', 1, 'نص', 'text'],
  ['nameEn', 'الاسم بالإنجليزية', 'Name (English)', 0, 'نص', 'text'],
  ['nameEnOfficial', 'الاسم الإنجليزي في الهوية', 'Official English name', 0, 'كما في الهوية والبنك', 'as on the ID and bank'],
  ['department', 'الإدارة', 'Department', 1, 'تنشأ تلقائيا إذا لم تكن موجودة', 'created if new'],
  ['position', 'الوظيفة', 'Position', 1, 'تنشأ تلقائيا إذا لم تكن موجودة', 'created if new'],
  ['managerEmpNo', 'الرقم الوظيفي للمدير', 'Manager employee No', 0, 'رقم موظف في الملف أو في النظام', 'a number in the file or the system'],
  ['hireDate', 'تاريخ المباشرة', 'Start date', 1, 'يوم/شهر/سنة', 'dd/mm/yyyy'],
  ['nationality', 'الجنسية', 'Nationality', 1, 'SA للسعودي، ورمز الدولة لغيره', 'SA for Saudi, else country code'],
  ['gender', 'الجنس', 'Gender', 0, 'male أو female', 'male or female'],
  ['nationalId', 'رقم الهوية أو الإقامة', 'National ID or iqama', 1, '10 أرقام تبدأ بـ 1 أو 2', '10 digits starting 1 or 2'],
  ['idExpiry', 'انتهاء الهوية أو الإقامة', 'ID or iqama expiry', 0, 'يوم/شهر/سنة', 'dd/mm/yyyy'],
  ['birthDate', 'تاريخ الميلاد', 'Date of birth', 0, 'يوم/شهر/سنة', 'dd/mm/yyyy'],
  ['borderNo', 'رقم الحدود', 'Border number', 0, '10 أرقام', '10 digits'],
  ['passportNo', 'رقم الجواز', 'Passport number', 0, 'نص', 'text'],
  ['passportExpiry', 'انتهاء الجواز', 'Passport expiry', 0, 'يوم/شهر/سنة', 'dd/mm/yyyy'],
  ['iban', 'الآيبان', 'IBAN', 0, 'SA ثم 22 رقما', 'SA then 22 digits'],
  ['bankName', 'البنك', 'Bank', 0, 'نص', 'text'],
  ['gosiNumber', 'رقم التأمينات', 'GOSI number', 0, 'أرقام', 'digits'],
  ['gosiCohort', 'فئة التأمينات', 'GOSI group', 0, 'legacy قبل يوليو 2024، new بعده', 'legacy before July 2024, new after'],
  ['contractType', 'نوع العقد', 'Contract type', 0, 'محدد أو غير محدد', 'fixed or indefinite'],
  ['contractEnd', 'نهاية العقد', 'Contract end', 0, 'يوم/شهر/سنة', 'dd/mm/yyyy'],
  ['probationEnd', 'نهاية التجربة', 'Probation end', 0, 'يوم/شهر/سنة، حتى 180 يوما', 'dd/mm/yyyy, up to 180 days'],
  ['contractNo', 'رقم العقد في قوى', 'Qiwa contract No', 0, 'نص', 'text'],
  ['occupationCode', 'رمز المهنة', 'Occupation code', 0, 'كما في قوى', 'as in Qiwa'],
  ['employmentType', 'نوع التوظيف', 'Employment type', 0, 'full_time أو part_time أو temporary', 'full_time, part_time or temporary'],
  ['workDaysPerWeek', 'أيام العمل أسبوعيا', 'Working days a week', 0, 'من 1 إلى 7', '1 to 7'],
  ['dailyHours', 'ساعات العمل يوميا', 'Working hours a day', 0, 'من 1 إلى 12', '1 to 12'],
  ['annualLeaveDays', 'أيام الإجازة السنوية', 'Annual leave days', 0, '21 على الأقل', 'at least 21'],
  ['noticeDays', 'فترة الإشعار بالأيام', 'Notice days', 0, 'أرقام', 'digits'],
  ['basic', 'الراتب الأساسي', 'Basic salary', 1, 'مبلغ بالريال', 'amount in SAR'],
  ['housing', 'بدل السكن', 'Housing allowance', 0, 'مبلغ بالريال', 'amount in SAR'],
  ['transport', 'بدل النقل', 'Transport allowance', 0, 'مبلغ بالريال', 'amount in SAR'],
  ['email', 'البريد الإلكتروني', 'Email', 0, 'بريد العمل', 'work email'],
  ['phone', 'الجوال', 'Mobile', 0, 'أرقام', 'digits'],
  ['workLocation', 'موقع العمل', 'Work location', 0, 'نص', 'text'],
  ['personalEmail', 'البريد الشخصي', 'Personal email', 0, 'بريد', 'email'],
  ['nationalAddress', 'العنوان الوطني', 'National address', 0, 'نص', 'text'],
  ['maritalStatus', 'الحالة الاجتماعية', 'Marital status', 0, 'single أو married', 'single or married'],
  ['emergencyName', 'جهة الطوارئ', 'Emergency contact', 0, 'نص', 'text'],
  ['emergencyPhone', 'هاتف الطوارئ', 'Emergency phone', 0, 'أرقام', 'digits']
];
var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

var css = '' +
'.hr-rail{display:flex;gap:6px;overflow-x:auto;padding:14px 14px 6px;scrollbar-width:none}' +
'.hr-rail::-webkit-scrollbar{display:none}' +
'.hr-rail button{flex:none;height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13.5px;color:var(--ink-2);display:inline-flex;align-items:center;gap:7px}' +
'.hr-rail button i{font-size:17px}' +
'.hr-rail button[aria-current="page"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.hr-rail .badge{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:9px;background:var(--amber);color:#fff;font-size:11px;padding:0 5px}' +
'.hr-body{padding:8px 14px 28px;min-width:0}' +
'.hr-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0 14px}' +
'.hr-h h2{margin:0;font-size:20px;font-weight:600;flex:1}' +
'.hr-sat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}' +
'.hr-sat .meter{grid-column:1 / -1;background:var(--pine);color:var(--cream);border-radius:var(--r-m);padding:14px 16px}' +
'.hr-sat .meter span{font-size:12.5px;color:#AFC0AD}' +
'.hr-sat .meter b{display:block;font-size:34px;font-weight:600;line-height:1.15}' +
'.hr-sat .meter small{display:block;color:#AFC0AD;font-size:12px;margin-top:6px}' +
'.hr-sat .track{height:8px;border-radius:4px;background:rgba(255,255,255,.12);margin-top:10px;overflow:hidden}' +
'.hr-sat .track i{display:block;height:100%;background:var(--signal);border-radius:4px;transition:width .9s var(--ease)}' +
'.hr-cards{display:grid;gap:0}' +
'.hr-desk{display:none}' +
'.tbl tr.click{cursor:pointer}' +
'.tbl tr.click:hover td{background:#FAF9F5}' +
'.hr-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 -18px 16px;padding:0 18px;overflow-x:auto;scrollbar-width:none}' +
'.hr-tabs button{flex:none;background:none;border:0;border-bottom:2px solid transparent;padding:10px 10px;color:var(--ink-2);font-size:14px}' +
'.hr-tabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--brand);font-weight:500}' +
'.hr-sub{margin:18px 0 8px;font-size:15px;font-weight:600}' +
'.hr-who{display:flex;align-items:center;gap:12px;margin-bottom:14px}' +
'.hr-who .av{width:46px;height:46px;font-size:17px}' +
'.hr-who b{display:block;font-size:18px;font-weight:600}' +
'.hr-who small{color:var(--ink-2)}' +
'.hr-tree .row{padding-top:10px;padding-bottom:10px}' +
'.hr-tree .lvl{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--brand);flex:none}' +
'.hr-chart .kids{margin-inline-start:15px;border-inline-start:2px solid #E4E9E1;padding-inline-start:14px}' +
'.hr-chart summary .car{margin-inline-start:auto;color:var(--ink-2);transition:transform .2s var(--ease)}' +
'.hr-chart details:not([open]) > summary .car{transform:rotate(90deg)}' +
'.hr-chart summary{list-style:none;display:flex;align-items:center;gap:10px;padding:7px 0;cursor:pointer}' +
'.hr-chart summary::-webkit-details-marker{display:none}' +
'.hr-chart summary .av{width:32px;height:32px;font-size:13px}' +
'.hr-chart summary small{color:var(--ink-2);font-size:12.5px}' +
'.hr-chart .leaf{display:flex;align-items:center;gap:10px;padding:7px 0}' +
'.hr-chart .leaf .av{width:32px;height:32px;font-size:13px}' +
'.hr-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:3px;background:var(--card)}' +
'.hr-seg button{border:0;background:none;height:32px;padding:0 12px;border-radius:999px;font-size:13px;color:var(--ink-2)}' +
'.hr-seg button[aria-pressed="true"]{background:var(--pine);color:var(--cream)}' +
'.hr-steps{list-style:none;margin:0;padding:0;display:grid;gap:12px;counter-reset:st}' +
'.hr-steps > li{counter-increment:st;background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:16px 16px 16px 16px;position:relative;padding-inline-start:58px}' +
'.hr-steps > li::before{content:counter(st);position:absolute;inset-inline-start:16px;top:14px;width:28px;height:28px;border-radius:50%;background:var(--pine);color:var(--cream);display:grid;place-items:center;font-weight:600;font-size:14px}' +
'.hr-steps h3{margin:0 0 2px;font-size:16px;font-weight:600}' +
'.hr-steps p{margin:0 0 10px;color:var(--ink-2);font-size:13.5px}' +
'.hr-sum{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}' +
'.hr-sum .chip{font-size:13px;padding:5px 11px}' +
'.hr-err td:first-child{font-variant-numeric:tabular-nums}' +
'.hr-amt{font-variant-numeric:tabular-nums;text-align:end}' +
'.hr-other{display:grid;grid-template-columns:1fr 120px 38px;gap:8px;align-items:center}' +
'.hr-hint{color:var(--ink-2);font-size:12.5px;margin-top:4px}' +
'.hr-bad{color:var(--red);font-size:12.5px;margin-top:4px}' +
'.hr-jdtabs{display:flex;gap:6px;margin-bottom:8px}' +
'.hr-check{display:flex;gap:10px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:var(--r-s);padding:12px}' +
'.hr-check input{width:20px!important;height:20px!important;margin-top:2px}' +
'.hr-check small{display:block;color:var(--ink-2)}' +
'.tbl input[type=checkbox]{width:18px;height:18px}' +
'@media (min-width:1024px){' +
  '.hr-shell{display:grid;grid-template-columns:230px minmax(0,1fr);max-width:1440px;width:calc(100% - 56px);margin:0 auto 28px;background:var(--paper);border-radius:32px;min-height:calc(100dvh - 120px)}' +
  '.hr-rail{flex-direction:column;padding:26px 14px;border-inline-end:1px solid var(--line);overflow:visible}' +
  '.hr-rail button{height:42px;border:0;background:none;justify-content:flex-start;border-radius:12px;font-size:14px}' +
  '.hr-rail button:hover{background:#EFECE3}' +
  '.hr-rail .badge{margin-inline-start:auto}' +
  '.hr-body{padding:26px 30px 36px}' +
  '.hr-sat{grid-template-columns:2fr 1fr 1fr 1fr}' +
  '.hr-sat .meter{grid-column:auto}' +
  '.hr-desk{display:block}' +
  '.hr-mob{display:none}' +
  '.drawer .panel.wide{width:640px}' +
'}' +
'@media (max-width:1023px){.hr-shell{background:var(--paper);border-radius:var(--r-l) var(--r-l) 0 0;flex:1}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var H = { dir: null, sat: null, depts: null, pos: null, pending: 0 };

// ---------------- small helpers ----------------
function lang(ar, en){ return S.lang === 'en' && en ? en : ar; }
function fmtDate(d){ if (!d) return ''; return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOCALE(), { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
function money(n){ return Number(n || 0).toLocaleString(LOCALE(), { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function opt(v, label, cur){ return '<option value="' + esc(v) + '"' + (String(cur == null ? '' : cur) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
function sel(name, list, cur, none){ return '<select name="' + name + '">' + (none !== false ? opt('', none || t('fChoose'), cur) : '') + list.map(function(x){ return opt(x[0], x[1], cur); }).join('') + '</select>'; }
function inp(name, label, val, extra){ return '<div class="field"><label>' + label + '</label><input name="' + name + '" value="' + esc(val == null ? '' : val) + '"' + (extra || '') + '></div>'; }
function dateInp(name, label, val){ return inp(name, label, val ? String(val).slice(0, 10) : '', ' type="date"'); }
function fieldSel(name, label, list, cur, none){ return '<div class="field"><label>' + label + '</label>' + sel(name, list, cur, none) + '</div>'; }
function formData(f){ var o = {}; Array.prototype.forEach.call(f.elements, function(el){ if (!el.name || el.type === 'button' || el.type === 'submit') return; if (el.type === 'checkbox') o[el.name] = el.checked; else o[el.name] = el.value.trim(); }); return o; }
function showErr(el, r){ if (el) el.textContent = errText(r && r.error); }
function busy(btn, on){ if (btn) btn.disabled = !!on; }
function validIban(s){
  s = String(s || '').replace(/\s+/g, '').toUpperCase();
  if (!/^SA\d{2}[0-9A-Z]{20}$/.test(s)) return false;
  var r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, function(c){ return String(c.charCodeAt(0) - 55); }), rem = 0;
  for (var i = 0; i < r.length; i++) rem = (rem * 10 + Number(r[i])) % 97;
  return rem === 1;
}
function daysChip(n){
  if (n < 0) return '<span class="chip absent num">' + t('exExpired') + ' ' + plural(-n, 'days') + '</span>';
  return '<span class="chip ' + (n <= 30 ? 'late' : '') + ' num">' + t('exIn') + ' ' + plural(n, 'days') + '</span>';
}
function deptName(id){ var d = (H.depts || []).filter(function(x){ return x.id === id; })[0]; return d ? lang(d.nameAr, d.nameEn) : ''; }
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, manager: false }; }
function empOpts(excludeId){ return (H.dir || []).filter(function(e){ return e.status === 'active' && e.id !== excludeId; }).map(function(e){ return [e.id, e.name + ' (' + e.empNo + ')']; }); }
function loading(el){ el.innerHTML = '<div class="list">' + [0, 1, 2, 3].map(function(){ return '<div class="row"><div class="main"><span class="sk" style="width:45%"></span><span class="sk" style="width:70%"></span></div></div>'; }).join('') + '</div>'; }
function failed(el, retry){ el.innerHTML = '<div class="empty">' + ph('wifi-slash') + '<b>' + t('loadFail') + '</b><div class="btnrow" style="justify-content:center;margin-top:10px"><button class="btn btn-dark btn-sm" type="button">' + t('mfRetry') + '</button></div></div>'; el.querySelector('button').onclick = retry; }

function loadOrg(force){
  if (!force && H.dir && H.depts && H.pos) return Promise.resolve(true);
  return Promise.all([api('hrDirectory', {}, true), api('hrDeptList', {}, true), api('hrPositionList', {}, true)]).then(function(rs){
    if (!rs[0].ok || !rs[1].ok || !rs[2].ok) return false;
    H.dir = rs[0].rows; H.sat = rs[0].saudization; H.depts = rs[1].rows; H.pos = rs[2].rows;
    return true;
  });
}

// ---------------- shell ----------------
function sections(){
  var r = roles(), s = [];
  if (r.hr) s.push(['people', ph('users-three'), t('hrPeople')]);
  if (r.manager) s.push(['team', ph('users'), t('hrTeamSec')]);
  if (r.hr) s.push(['org', ph('tree-structure'), t('hrOrg')], ['positions', ph('briefcase'), t('hrPositions')]);
  if (r.hr || r.payroll) s.push(['approvals', ph('seal-check'), t('hrApprovals')]);
  if (r.hr) s.push(['expiring', ph('calendar-x'), t('hrExpiring')], ['import', ph('microsoft-excel-logo'), t('hrImport')]);
  return s;
}

function render(main){
  if (!S.fileRoles) {
    main.innerHTML = '<div class="hr-shell"><div class="hr-body" id="hrBody"></div></div>';
    loading($('#hrBody'));
    return api('myFile', {}, true).then(function(r){ if (r.ok) setHrAccess(r.file); if (S.fileRoles) render(main); else failed($('#hrBody'), function(){ render(main); }); });
  }
  var secs = sections();
  if (!secs.length) { S.tab = 'file'; return renderShell(); }
  if (!secs.some(function(s){ return s[0] === S.hrSec; })) S.hrSec = secs[0][0];
  main.innerHTML = '<div class="hr-shell"><nav class="hr-rail" aria-label="' + t('tabHr') + '">' + secs.map(function(s){
    return '<button type="button" data-s="' + s[0] + '"' + (S.hrSec === s[0] ? ' aria-current="page"' : '') + '>' + s[1] + '<span>' + s[2] + '</span>' + (s[0] === 'approvals' ? '<span class="badge hidden" id="apBadge"></span>' : '') + '</button>';
  }).join('') + '</nav><div class="hr-body" id="hrBody"></div></div>';
  $$('.hr-rail button').forEach(function(b){ b.onclick = function(){ S.hrSec = b.dataset.s; render(main); }; });
  var body = $('#hrBody');
  ({ people: people, team: team, org: org, positions: positions, approvals: approvals, expiring: expiring, import: importer })[S.hrSec](body);
  if (roles().hr || roles().payroll) api('hrCompList', { status: 'pending' }, true).then(function(r){ if (r.ok) setApBadge(r.rows.filter(function(x){ return !x.mine; }).length); });
}
function setApBadge(n){ var b = $('#apBadge'); if (!b) return; b.textContent = n; b.classList.toggle('hidden', !n); }

// ---------------- people ----------------
function people(body){
  loading(body);
  loadOrg(true).then(function(ok){
    if (!ok) return failed(body, function(){ people(body); });
    var s = H.sat, pct = Math.min(100, s.saudiPct);
    body.innerHTML = '<div class="hr-h"><h2>' + t('hrPeople') + '</h2><button type="button" class="btn btn-dark btn-sm" id="hrAdd">' + ph('user-plus') + t('hrAddEmp') + '</button></div>' +
      '<div class="hr-sat"><div class="meter"><span>' + t('hrSaudiPct') + '</span><b class="num">' + s.saudiPct.toLocaleString(LOCALE()) + '%</b><div class="track"><i style="width:0"></i></div><small>' + t('hrSaudiLead') + '</small></div>' +
      '<div class="kpi"><span>' + t('hrHeadcount') + '</span><b class="num">' + s.headcount + '</b></div>' +
      '<div class="kpi"><span>' + t('hrSaudis') + '</span><b class="num">' + s.saudis + '</b></div>' +
      '<div class="kpi"><span>' + t('hrNoPkg') + '</span><b class="num">' + s.saudiNoPackage + '</b></div></div>' +
      '<div class="toolbar"><input class="grow" id="pq" type="search" placeholder="' + t('hrSearch') + '" value="' + esc(S.hrQ || '') + '">' +
      '<select id="pd">' + opt('', t('hrAllDepts'), S.hrD) + H.depts.map(function(d){ return opt(d.id, lang(d.nameAr, d.nameEn), S.hrD); }).join('') + '</select></div><div id="plist"></div>';
    requestAnimationFrame(function(){ var i = $('.hr-sat .track i'); if (i) i.style.width = pct + '%'; });
    $('#hrAdd').onclick = function(){ if (typeof empDrawer === 'function') empDrawer(null); };
    $('#pq').oninput = function(){ S.hrQ = this.value; list(); };
    $('#pd').onchange = function(){ S.hrD = this.value; list(); };
    list();
  });
  function list(){
    var q = (S.hrQ || '').toLowerCase(), d = S.hrD || '';
    var rows = H.dir.filter(function(e){ return (!q || (e.name + ' ' + (e.nameEn || '') + ' ' + e.empNo).toLowerCase().indexOf(q) >= 0) && (!d || e.departmentId === d); })
      .sort(function(a, b){ return (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1) || String(a.name).localeCompare(b.name, 'ar'); });
    var el = $('#plist');
    if (!rows.length) { el.innerHTML = '<div class="empty">' + ph('users-three') + '<b>' + t('hrNoRows') + '</b></div>'; return; }
    el.innerHTML = '<div class="tblwrap hr-desk"><table class="tbl"><thead><tr><th>' + t('empNo') + '</th><th>' + t('hrName') + '</th><th>' + t('hrDept') + '</th><th>' + t('hrPos') + '</th><th>' + t('hrMgr') + '</th><th>' + t('hrHire') + '</th><th>' + t('hrNat') + '</th></tr></thead><tbody>' +
      rows.map(function(e){ return '<tr class="click" data-id="' + e.id + '" tabindex="0"><td class="num">' + esc(e.empNo) + '</td><td><b style="font-weight:500">' + esc(lang(e.name, e.nameEn)) + '</b>' + (e.status !== 'active' ? ' <span class="chip off">' + t('s_disabled') + '</span>' : '') + '</td><td>' + esc(e.departmentName || '') + '</td><td>' + esc(e.positionName || '') + '</td><td>' + esc(e.managerName || '') + '</td><td class="num">' + fmtDate(e.hireDate) + '</td><td>' + (e.isSaudi ? '<span class="chip in">' + t('hrSaudi') + '</span>' : esc(e.nationality || '')) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="list hr-mob">' + rows.map(function(e){ return '<div class="row click" data-id="' + e.id + '" tabindex="0"><div class="av">' + esc(initials(e.name)) + '</div><div class="main"><b>' + esc(lang(e.name, e.nameEn)) + '</b><small>' + esc([e.positionName, e.departmentName].filter(Boolean).join('، ')) + '</small></div><div class="end num">' + esc(e.empNo) + '</div></div>'; }).join('') + '</div>';
    $$('[data-id]', el).forEach(function(r){ r.onclick = function(){ openEmp(r.dataset.id); }; r.onkeydown = function(ev){ if (ev.key === 'Enter') openEmp(r.dataset.id); }; });
  }
}

// ---------------- the employee drawer ----------------
function openEmp(id, readOnly){
  var d = drawer('<div id="edBody"></div>');
  d.querySelector('.panel').classList.add('wide');
  var box = d.querySelector('#edBody');
  loading(box);
  var tab = 'job';
  function load(){
    Promise.all([api('hrEmpFile', { id: id }, true), readOnly ? Promise.resolve(true) : loadOrg(false)]).then(function(rs){
      var r = rs[0];
      if (!r.ok) { showErr(box, r); return; }
      draw(r.file);
    });
  }
  function draw(f){
    var e = f.emp, tabs = [['job', t('tJob')]];
    if ('priv' in f) tabs.push(['personal', t('tPersonal')]);
    if ('comp' in f) tabs.push(['pay', t('tPay')]);
    if ('documents' in f) tabs.push(['docs', t('tDocs')]);
    if (f.jobHistory) tabs.push(['hist', t('tHist')]);
    box.innerHTML = '<div class="hr-who"><div class="av">' + esc(initials(e.name)) + '</div><div><b>' + esc(lang(e.name, e.nameEn)) + '</b><small class="num">' + esc(e.empNo) + (f.job.position ? '، ' + esc(lang(f.job.position.titleAr, f.job.position.titleEn)) : '') + '</small></div></div>' +
      '<div class="hr-tabs" role="tablist">' + tabs.map(function(x){ return '<button type="button" role="tab" data-t="' + x[0] + '" aria-selected="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><div id="edTab"></div>';
    $$('.hr-tabs button', box).forEach(function(b){ b.onclick = function(){ tab = b.dataset.t; draw(f); }; });
    var el = $('#edTab', box);
    ({ job: jobTab, personal: personalTab, pay: payTab, docs: docsTab, hist: histTab })[tab](el, f, load, readOnly || !roles().hr);
  }
  load();
}

function jobTab(el, f, reload, ro){
  var j = f.job, e = f.emp;
  if (ro) {
    el.innerHTML = '<dl class="mf-kv">' + [[t('fDept'), j.department ? lang(j.department.nameAr, j.department.nameEn) : ''], [t('fPos'), j.position ? lang(j.position.titleAr, j.position.titleEn) : ''],
      [t('fMgr'), j.manager ? j.manager.name : ''], [t('mfHead'), j.head ? j.head.name : ''], [t('fHire'), fmtDate(j.hireDate)], [t('fCType'), j.contractType ? t('ct_' + j.contractType) : '']]
      .filter(function(x){ return x[1]; }).map(function(x){ return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      (f.jd && f.jd.purposeAr ? '<h4 class="hr-sub">' + t('mfJd') + '</h4><p>' + esc(lang(f.jd.purposeAr, f.jd.purposeEn)) + '</p>' : '');
    return;
  }
  el.innerHTML = '<form class="form" id="jf">' +
    '<div class="two">' + fieldSel('departmentId', t('fDept'), H.depts.map(function(d){ return [d.id, lang(d.nameAr, d.nameEn)]; }), j.department && j.department.id) +
    fieldSel('positionId', t('fPos'), H.pos.map(function(p){ return [p.id, lang(p.titleAr, p.titleEn) + (p.departmentId ? ' (' + deptName(p.departmentId) + ')' : '')]; }), j.position && j.position.id) + '</div>' +
    fieldSel('managerId', t('fMgr'), empOpts(e.id), j.manager && j.manager.id, t('fNoneOpt')) +
    '<div class="two">' + dateInp('hireDate', t('fHire'), j.hireDate) + inp('nationality', t('fNat'), j.nationality, ' dir="ltr" list="natList" maxlength="20"') + '</div>' +
    '<datalist id="natList">' + ['SA', 'EG', 'IN', 'PK', 'BD', 'PH', 'YE', 'SD', 'JO', 'SY', 'LB', 'NP', 'LK', 'ID'].map(function(c){ return '<option value="' + c + '">'; }).join('') + '</datalist>' +
    '<div class="two">' + fieldSel('contractType', t('fCType'), [['fixed', t('ct_fixed')], ['indefinite', t('ct_indefinite')]], j.contractType) + dateInp('contractEnd', t('fCEnd'), j.contractEnd) + '</div>' +
    '<div class="two">' + dateInp('probationEnd', t('fProb'), j.probationEnd) + fieldSel('gender', t('fGender'), [['male', t('g_male')], ['female', t('g_female')]], j.gender) + '</div>' +
    '<div class="two">' + inp('contractNo', t('fCNo'), j.contractNo, ' dir="ltr"') + inp('occupationCode', t('fOcc'), j.occupationCode, ' dir="ltr"') + '</div>' +
    '<div class="two">' + fieldSel('employmentType', t('fEType'), [['full_time', t('et_full_time')], ['part_time', t('et_part_time')], ['temporary', t('et_temporary')]], j.employmentType) + inp('workLocation', t('fLoc'), j.workLocation) + '</div>' +
    '<div class="two">' + inp('workDaysPerWeek', t('fWeek'), j.workDaysPerWeek, ' type="number" min="1" max="7" inputmode="numeric"') + inp('dailyHours', t('fHours'), j.dailyHours, ' type="number" min="1" max="12" inputmode="numeric"') + '</div>' +
    '<div class="two">' + inp('annualLeaveDays', t('fLeave'), j.annualLeaveDays, ' type="number" min="21" max="60" inputmode="numeric"') + inp('noticeDays', t('fNotice'), j.noticeDays, ' type="number" min="0" max="180" inputmode="numeric"') + '</div>' +
    '<div class="two">' + dateInp('effectiveFrom', t('fEff'), riyadhToday()) + inp('reason', t('fReason'), '', ' maxlength="200"') + '</div>' +
    (isAdmin() ? '<label class="hr-check"><input type="checkbox" id="payRole"' + (/payroll/.test(f.extraRoles || '') ? ' checked' : '') + '><span><b>' + t('rolePayroll') + '</b><small>' + t('rolePayrollLead') + '</small></span></label>' : '') +
    '<div class="err" id="jerr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('save') + '</button></div></form>';
  var form = $('#jf', el), roleBox = $('#payRole', el);
  form.onsubmit = function(ev){
    ev.preventDefault();
    var d = formData(form), btn = form.querySelector('button.btn-dark');
    delete d.payRole;
    d.id = f.emp.id;
    busy(btn, true); $('#jerr', el).textContent = '';
    var calls = [api('hrEmpSave', { emp: d })];
    if (roleBox && roleBox.checked !== /payroll/.test(f.extraRoles || '')) calls.push(api('hrRolesSave', { id: f.emp.id, extraRoles: roleBox.checked ? 'payroll' : '' }));
    Promise.all(calls).then(function(rs){
      busy(btn, false);
      var bad = rs.filter(function(r){ return !r.ok; })[0];
      if (bad) return showErr($('#jerr', el), bad);
      toast(t('saved')); H.dir = null; reload();
    });
  };
}

function personalTab(el, f, reload, ro){
  var p = f.priv;
  var dis = ro ? ' disabled' : '';
  el.innerHTML = '<form class="form" id="pf">' +
    '<div class="two">' + inp('nationalId', t('fNid'), p.nationalId, ' dir="ltr" inputmode="numeric" maxlength="10"' + dis) + dateInp('idExpiry', t('fIdExp'), p.idExpiry) + '</div>' +
    inp('nameEnOfficial', t('fNameOff'), p.nameEnOfficial, ' dir="ltr"' + dis) +
    '<div class="field"><label>' + t('fIban') + '</label><input name="iban" dir="ltr" value="' + esc(p.iban) + '" maxlength="34" autocomplete="off"' + dis + '><div class="hr-bad hidden" id="ibanBad">' + t('ibanBad') + '</div></div>' +
    '<div class="two">' + inp('bankName', t('fBank'), p.bankName, dis) + inp('gosiNumber', t('fGosi'), p.gosiNumber, ' dir="ltr" inputmode="numeric"' + dis) + '</div>' +
    '<div class="two">' + fieldSel('gosiCohort', t('fCohort'), [['legacy', t('co_legacy')], ['new', t('co_new')]], p.gosiCohort) + dateInp('birthDate', t('fBirth'), p.birthDate) + '</div>' +
    '<div class="two">' + inp('passportNo', t('fPassport'), p.passportNo, ' dir="ltr"' + dis) + dateInp('passportExpiry', t('fPassExp'), p.passportExpiry) + '</div>' +
    '<div class="two">' + inp('borderNo', t('fBorder'), p.borderNo, ' dir="ltr" inputmode="numeric" maxlength="10"' + dis) + fieldSel('maritalStatus', t('fMarital'), [['single', t('ms_single')], ['married', t('ms_married')], ['other', t('ms_other')]], p.maritalStatus) + '</div>' +
    inp('nationalAddress', t('fNatAddr'), p.nationalAddress, dis) + inp('personalEmail', t('fPEmail'), p.personalEmail, ' dir="ltr" type="email"' + dis) +
    '<div class="two">' + inp('emergencyName', t('fEmName'), p.emergencyName, dis) + inp('emergencyPhone', t('fEmPhone'), p.emergencyPhone, ' dir="ltr" inputmode="tel"' + dis) + '</div>' +
    (ro ? '' : '<div class="err" id="perr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('save') + '</button></div>') + '</form>';
  var form = $('#pf', el), ib = form.elements.iban;
  if (ro) { Array.prototype.forEach.call(form.elements, function(x){ x.disabled = true; }); return; }
  ib.oninput = function(){ $('#ibanBad', el).classList.toggle('hidden', !ib.value.trim() || validIban(ib.value)); };
  form.onsubmit = function(ev){
    ev.preventDefault();
    if (ib.value.trim() && !validIban(ib.value)) { $('#ibanBad', el).classList.remove('hidden'); ib.focus(); return; }
    var d = formData(form), btn = form.querySelector('button.btn-dark');
    busy(btn, true); $('#perr', el).textContent = '';
    api('hrPrivateSave', { empId: f.emp.id, priv: d }).then(function(r){ busy(btn, false); if (!r.ok) return showErr($('#perr', el), r); toast(t('saved')); reload(); });
  };
}

function payTab(el, f, reload){
  var c = f.comp, own = f.emp.id === S.me.id, canPropose = (roles().hr && S.me.role === 'hr') || roles().payroll;
  var hist = f.compHistory || [];
  var next = (function(){ var d = new Date(riyadhToday() + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1, 1); return d.toISOString().slice(0, 10); })();
  el.innerHTML = '<h4 class="hr-sub" style="margin-top:0">' + t('payNow') + '</h4>' + (c ? '<dl class="mf-kv">' +
      [[t('payBasic'), c.basic], [t('payHousing'), c.housing], [t('payTransport'), c.transport]].concat(Object.keys(c.other || {}).map(function(k){ return [esc(k), c.other[k]]; }))
        .map(function(x){ return '<dt>' + x[0] + '</dt><dd class="num">' + money(x[1]) + '</dd>'; }).join('') +
      '<dt style="font-weight:600;color:var(--ink)">' + t('payTotal') + '</dt><dd class="num" style="font-weight:600">' + money(c.total) + ' ' + t('mfSar') + '</dd></dl><p class="hr-hint">' + t('mfEffective') + ' ' + fmtDate(c.effectiveFrom) + '</p>' : '<p class="hr-hint">' + t('payNone') + '</p>') +
    (hist.length ? '<h4 class="hr-sub">' + t('payHist') + '</h4><div class="tblwrap"><table class="tbl"><thead><tr><th>' + t('apEff') + '</th><th class="hr-amt">' + t('payBasic') + '</th><th class="hr-amt">' + t('payHousing') + '</th><th class="hr-amt">' + t('payTransport') + '</th><th class="hr-amt">' + t('payTotal') + '</th><th></th></tr></thead><tbody>' +
      hist.map(function(h){ return '<tr><td class="num">' + fmtDate(h.effectiveFrom) + '</td><td class="hr-amt">' + money(h.basic) + '</td><td class="hr-amt">' + money(h.housing) + '</td><td class="hr-amt">' + money(h.transport) + '</td><td class="hr-amt"><b>' + money(h.total) + '</b></td><td><span class="chip ' + ({ approved:'in', pending:'late', rejected:'absent' }[h.status] || '') + '">' + t('st_' + h.status) + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
    (own ? '<p class="hr-hint" style="margin-top:14px">' + t('payOwnNote') + '</p>' : canPropose ? '<h4 class="hr-sub">' + t('payPropose') + '</h4><form class="form" id="cf">' +
      '<div class="two">' + dateInp('effectiveFrom', t('fEff'), next) + inp('reason', t('fReason'), '', ' maxlength="200"') + '</div>' +
      '<div class="two">' + inp('basic', t('payBasic'), c ? c.basic : '', ' type="number" min="1" step="0.01" inputmode="decimal" required') + inp('housing', t('payHousing'), c ? c.housing : '', ' type="number" min="0" step="0.01" inputmode="decimal"') + '</div>' +
      '<div class="two">' + inp('transport', t('payTransport'), c ? c.transport : '', ' type="number" min="0" step="0.01" inputmode="decimal"') + '<div class="field"><label>&nbsp;</label><div class="btnrow" style="margin:0"><button type="button" class="btn btn-line btn-sm" id="h25">' + t('payH25') + '</button><button type="button" class="btn btn-line btn-sm" id="t10">' + t('payT10') + '</button></div></div></div>' +
      '<div class="field"><label>' + t('payOther') + '</label><div id="others" style="display:grid;gap:8px"></div><button type="button" class="btn btn-line btn-sm" id="addOther" style="margin-top:8px">' + ph('plus') + t('payAddOther') + '</button></div>' +
      '<p class="hr-hint" id="cTotal"></p><div class="err" id="cerr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('paySend') + '</button></div></form>' : '');
  var form = $('#cf', el);
  if (!form) return;
  var others = $('#others', el);
  function addOther(k, v){
    var row = document.createElement('div'); row.className = 'hr-other';
    row.innerHTML = '<input placeholder="' + t('payLabel') + '" value="' + esc(k || '') + '" data-k><input type="number" min="0" step="0.01" inputmode="decimal" placeholder="' + t('payAmount') + '" value="' + esc(v == null ? '' : v) + '" data-v><button type="button" class="iconbtn" aria-label="' + t('docDelete') + '">' + I.x + '</button>';
    row.querySelector('button').onclick = function(){ row.remove(); total(); };
    row.oninput = total;
    others.appendChild(row);
  }
  function total(){
    var n = ['basic', 'housing', 'transport'].reduce(function(s, k){ return s + (Number(form.elements[k].value) || 0); }, 0);
    $$('[data-v]', others).forEach(function(x){ n += Number(x.value) || 0; });
    $('#cTotal', el).textContent = t('payTotal') + ': ' + money(n) + ' ' + t('mfSar');
  }
  if (c) Object.keys(c.other || {}).forEach(function(k){ addOther(k, c.other[k]); });
  $('#addOther', el).onclick = function(){ addOther(); };
  $('#h25', el).onclick = function(){ form.elements.housing.value = Math.round((Number(form.elements.basic.value) || 0) * 0.25 * 100) / 100; total(); };
  $('#t10', el).onclick = function(){ form.elements.transport.value = Math.round((Number(form.elements.basic.value) || 0) * 0.10 * 100) / 100; total(); };
  form.oninput = total; total();
  form.onsubmit = function(ev){
    ev.preventDefault();
    var d = formData(form), other = {}, btn = form.querySelector('button.btn-dark');
    $$('.hr-other', others).forEach(function(r){ var k = r.querySelector('[data-k]').value.trim(), v = r.querySelector('[data-v]').value; if (k && v !== '') other[k] = Number(v); });
    busy(btn, true); $('#cerr', el).textContent = '';
    api('hrCompPropose', { empId: f.emp.id, effectiveFrom: d.effectiveFrom, basic: d.basic, housing: d.housing || 0, transport: d.transport || 0, other: other, reason: d.reason })
      .then(function(r){ busy(btn, false); if (!r.ok) return showErr($('#cerr', el), r); toast(t('paySent')); reload(); });
  };
}

var DOC_TYPES = ['iqama', 'passport', 'work_permit', 'medical_insurance', 'contract', 'driving_licence', 'other'];
function docsTab(el, f, reload, ro){
  var docs = f.documents || [];
  el.innerHTML = (docs.length ? '<div class="list">' + docs.map(function(d){
    var n = d.expiryDate ? Math.round((Date.parse(d.expiryDate + 'T00:00:00Z') - Date.parse(riyadhToday() + 'T00:00:00Z')) / 86400000) : null;
    return '<div class="row' + (ro ? '' : ' click') + '" data-doc="' + d.id + '"><div class="av">' + ph('file') + '</div><div class="main"><b>' + t('doc_' + d.type) + '</b><small style="display:block"><bdi>' + esc(d.number || '') + '</bdi></small></div><div class="end">' + (n != null ? daysChip(n) + '<small class="num">' + fmtDate(d.expiryDate) + '</small>' : '') + '</div></div>';
  }).join('') + '</div>' : '<p class="hr-hint">' + t('docNone') + '</p>') + (ro ? '' : '<h4 class="hr-sub">' + t('docAdd') + '</h4><div id="docForm"></div>');
  if (ro) return;
  function form(d){
    var box = $('#docForm', el);
    box.innerHTML = '<form class="form" id="df"><div class="two">' + fieldSel('type', t('docType'), DOC_TYPES.map(function(x){ return [x, t('doc_' + x)]; }), d ? d.type : '', false) + inp('number', t('docNo'), d ? d.number : '', ' dir="ltr" maxlength="40"') + '</div>' +
      '<div class="two">' + dateInp('issueDate', t('docIssue'), d ? d.issueDate : '') + dateInp('expiryDate', t('docExp'), d ? d.expiryDate : '') + '</div>' + inp('note', t('docNote'), d ? d.note : '', ' maxlength="300"') +
      '<div class="err" id="derr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('save') + '</button>' + (d ? '<button type="button" class="btn btn-danger" id="ddel">' + t('docDelete') + '</button>' : '') + '</div></form>';
    var fm = $('#df', box);
    function send(extra){
      var v = Object.assign(formData(fm), extra || {});
      if (d) v.id = d.id; else v.empId = f.emp.id;
      api('hrDocSave', { doc: v }).then(function(r){ if (!r.ok) return showErr($('#derr', box), r); toast(t('docSaved')); reload(); });
    }
    fm.onsubmit = function(ev){ ev.preventDefault(); send(); };
    var del = $('#ddel', box); if (del) del.onclick = function(){ send({ status: 'deleted' }); };
  }
  $$('[data-doc]', el).forEach(function(r){ r.onclick = function(){ form(docs.filter(function(x){ return x.id === r.dataset.doc; })[0]); $('#docForm', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }; });
  form(null);
}

function histTab(el, f){
  el.innerHTML = f.jobHistory.length ? '<ul class="mf-hist">' + f.jobHistory.map(function(h){ return '<li><b>' + esc(h.department || '') + '</b><small>' + fmtDate(h.effectiveFrom) + (h.manager ? '، ' + t('fMgr') + ': ' + esc(h.manager) : '') + (h.reason ? '، ' + esc(h.reason) : '') + '</small></li>'; }).join('') + '</ul>' : '<p class="hr-hint">' + t('mfNone') + '</p>';
}

// ---------------- my team (managers) ----------------
function team(body){
  loading(body);
  api('hrTeam', {}, true).then(function(r){
    if (!r.ok) return failed(body, function(){ team(body); });
    body.innerHTML = '<div class="hr-h"><h2>' + t('hrTeamSec') + '</h2><span class="chip in num">' + plural(r.rows.length, 'people') + '</span></div>' +
      (r.rows.length ? '<div class="list">' + r.rows.map(function(e){ return '<div class="row click" data-id="' + e.id + '" tabindex="0"><div class="av">' + esc(initials(e.name)) + '</div><div class="main"><b>' + esc(lang(e.name, e.nameEn)) + '</b><small>' + esc(e.title || '') + '</small></div><div class="end num">' + esc(e.empNo) + '</div></div>'; }).join('') + '</div>'
        : '<div class="empty">' + ph('users') + '<b>' + t('hrNoRows') + '</b></div>');
    $$('[data-id]', body).forEach(function(x){ x.onclick = function(){ openEmp(x.dataset.id, true); }; });
  });
}

// ---------------- organisation ----------------
function org(body){
  loading(body);
  loadOrg(true).then(function(ok){
    if (!ok) return failed(body, function(){ org(body); });
    var view = S.orgView || 'depts';
    body.innerHTML = '<div class="hr-h"><h2>' + t('hrOrg') + '</h2><div class="hr-seg" role="group"><button type="button" data-v="depts" aria-pressed="' + (view === 'depts') + '">' + t('orgDepts') + '</button><button type="button" data-v="chart" aria-pressed="' + (view === 'chart') + '">' + t('orgChart') + '</button></div>' +
      '<button type="button" class="btn btn-dark btn-sm" id="oAdd">' + ph('plus') + t('orgAdd') + '</button></div><div id="oBody"></div>';
    $$('.hr-seg button', body).forEach(function(b){ b.onclick = function(){ S.orgView = b.dataset.v; org(body); }; });
    $('#oAdd').onclick = function(){ deptDrawer(null, function(){ org(body); }); };
    var el = $('#oBody');
    if (view === 'chart') return chart(el);
    if (!H.depts.length) { el.innerHTML = '<div class="empty">' + ph('tree-structure') + '<b>' + t('orgEmpty') + '</b></div>'; return; }
    var kids = {}, count = {};
    H.depts.forEach(function(d){ var p = d.parentId && H.depts.some(function(x){ return x.id === d.parentId; }) ? d.parentId : ''; (kids[p] = kids[p] || []).push(d); });
    H.dir.forEach(function(e){ if (e.status === 'active' && e.departmentId) count[e.departmentId] = (count[e.departmentId] || 0) + 1; });
    var names = {}; H.dir.forEach(function(e){ names[e.id] = e.name; });
    var out = [];
    (function walk(p, depth){ (kids[p] || []).sort(function(a, b){ return String(a.nameAr).localeCompare(b.nameAr, 'ar'); }).forEach(function(d){ out.push([d, depth]); if (depth < 12) walk(d.id, depth + 1); }); })('', 0);
    el.innerHTML = '<div class="list hr-tree">' + out.map(function(x){ var d = x[0];
      return '<div class="row click" data-d="' + d.id + '" tabindex="0" style="padding-inline-start:' + (14 + x[1] * 22) + 'px"><span class="lvl" style="opacity:' + Math.max(.35, 1 - x[1] * .2) + '"></span><div class="main"><b>' + esc(lang(d.nameAr, d.nameEn)) + (d.status === 'disabled' ? ' <span class="chip off">' + t('orgDisabled') + '</span>' : '') + '</b><small>' + (d.headEmpId && names[d.headEmpId] ? esc(names[d.headEmpId]) : t('mfNone')) + (d.code ? '، ' + esc(d.code) : '') + '</small></div><div class="end num">' + plural(count[d.id] || 0, 'people') + '</div></div>';
    }).join('') + '</div>';
    $$('[data-d]', el).forEach(function(r){ r.onclick = function(){ deptDrawer(H.depts.filter(function(x){ return x.id === r.dataset.d; })[0], function(){ org(body); }); }; });
  });
  function chart(el){
    var kids = {}, byId = {};
    var act = H.dir.filter(function(e){ return e.status === 'active'; });
    act.forEach(function(e){ byId[e.id] = e; });
    act.forEach(function(e){ var m = e.managerId && byId[e.managerId] ? e.managerId : ''; (kids[m] = kids[m] || []).push(e); });
    function size(id, seen){ seen = seen || {}; if (seen[id]) return 0; seen[id] = 1; return (kids[id] || []).reduce(function(s, k){ return s + 1 + size(k.id, seen); }, 0); }
    function node(e, depth){
      var ks = kids[e.id] || [];
      var face = '<span class="av">' + esc(initials(e.name)) + '</span><span><b style="font-weight:500">' + esc(lang(e.name, e.nameEn)) + '</b><small style="display:block">' + [esc(e.positionName || ''), ks.length ? plural(size(e.id), 'people') : ''].filter(Boolean).join('، ') + '</small></span>';
      if (!ks.length || depth > 14) return '<div class="leaf">' + face + '</div>';
      return '<details' + (depth < 2 ? ' open' : '') + '><summary>' + face + '<i class="ph ph-caret-down car" aria-hidden="true"></i></summary><div class="kids">' + ks.map(function(k){ return node(k, depth + 1); }).join('') + '</div></details>';
    }
    el.innerHTML = '<div class="hr-chart list" style="padding:10px 14px">' + (kids[''] || []).map(function(e){ return node(e, 0); }).join('') + '</div>';
  }
}

function deptDrawer(d, done){
  var others = H.depts.filter(function(x){ return !d || x.id !== d.id; });
  if (d) { // a department cannot move under one of its own descendants
    var desc = {}, grew = true; desc[d.id] = 1;
    while (grew) { grew = false; H.depts.forEach(function(x){ if (x.parentId && desc[x.parentId] && !desc[x.id]) { desc[x.id] = 1; grew = true; } }); }
    others = others.filter(function(x){ return !desc[x.id]; });
  }
  var dr = drawer('<h3>' + (d ? t('orgEdit') : t('orgAdd')) + '</h3><form class="form" id="of">' +
    inp('nameAr', t('orgNameAr'), d ? d.nameAr : '', ' required maxlength="80"') + inp('nameEn', t('orgNameEn'), d ? d.nameEn : '', ' dir="ltr" maxlength="80"') +
    '<div class="two">' + inp('code', t('orgCode'), d ? d.code : '', ' dir="ltr" maxlength="20"') + inp('costCenter', t('orgCost'), d ? d.costCenter : '', ' dir="ltr" maxlength="30"') + '</div>' +
    fieldSel('parentId', t('orgParent'), others.map(function(x){ return [x.id, lang(x.nameAr, x.nameEn)]; }), d ? d.parentId : '', t('fNoneOpt')) +
    fieldSel('headEmpId', t('orgHead'), empOpts(''), d ? d.headEmpId : '', t('fNoneOpt')) +
    (d ? fieldSel('status', t('status'), [['active', t('orgActive')], ['disabled', t('orgDisabled')]], d.status, false) : '') +
    '<div class="err" id="oerr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('save') + '</button><button type="button" class="btn btn-line" id="ocancel">' + t('cancel') + '</button></div></form>');
  $('#ocancel', dr).onclick = function(){ dr.remove(); };
  $('#of', dr).onsubmit = function(ev){
    ev.preventDefault();
    var v = formData(this); if (d) v.id = d.id;
    api('hrDeptSave', { dept: v }).then(function(r){ if (!r.ok) return showErr($('#oerr', dr), r); dr.remove(); toast(t('saved')); done(); });
  };
}

// ---------------- positions and job descriptions ----------------
function positions(body){
  loading(body);
  loadOrg(true).then(function(ok){
    if (!ok) return failed(body, function(){ positions(body); });
    var used = {}; H.dir.forEach(function(e){ if (e.status === 'active' && e.positionId) used[e.positionId] = (used[e.positionId] || 0) + 1; });
    body.innerHTML = '<div class="hr-h"><h2>' + t('hrPositions') + '</h2><button type="button" class="btn btn-dark btn-sm" id="posAdd">' + ph('plus') + t('posAdd') + '</button></div>' +
      (H.pos.length ? '<div class="list">' + H.pos.slice().sort(function(a, b){ return String(a.titleAr).localeCompare(b.titleAr, 'ar'); }).map(function(p){
        var full = p.purposeAr && p.dutiesAr;
        return '<div class="row click" data-p="' + p.id + '" tabindex="0"><div class="av">' + ph('briefcase') + '</div><div class="main"><b>' + esc(lang(p.titleAr, p.titleEn)) + '</b><small>' + esc([deptName(p.departmentId), p.grade].filter(Boolean).join('، ')) + '</small></div><div class="end"><span class="chip ' + (full ? 'in' : 'late') + '">' + (full ? t('posJdOk') : t('posJdMissing')) + '</span><small class="num">' + plural(used[p.id] || 0, 'people') + '</small></div></div>';
      }).join('') + '</div>' : '<div class="empty">' + ph('briefcase') + '<b>' + t('posEmpty') + '</b></div>');
    $('#posAdd').onclick = function(){ posDrawer(null, function(){ positions(body); }); };
    $$('[data-p]', body).forEach(function(r){ r.onclick = function(){ posDrawer(H.pos.filter(function(x){ return x.id === r.dataset.p; })[0], function(){ positions(body); }); }; });
  });
}

function posDrawer(p, done){
  var jl = 'Ar';
  var dr = drawer('<h3>' + (p ? t('posEdit') : t('posAdd')) + '</h3><form class="form" id="posf">' +
    inp('titleAr', t('posTitleAr'), p ? p.titleAr : '', ' required maxlength="80"') + inp('titleEn', t('posTitleEn'), p ? p.titleEn : '', ' dir="ltr" maxlength="80"') +
    '<div class="two">' + inp('code', t('posCode'), p ? p.code : '', ' dir="ltr" maxlength="20"') + inp('grade', t('posGrade'), p ? p.grade : '', ' dir="ltr" maxlength="20"') + '</div>' +
    fieldSel('departmentId', t('fDept'), H.depts.map(function(d){ return [d.id, lang(d.nameAr, d.nameEn)]; }), p ? p.departmentId : '', t('fNoneOpt')) +
    '<h4 class="hr-sub">' + t('mfJd') + '</h4><div class="hr-seg hr-jdtabs" role="group"><button type="button" data-l="Ar" aria-pressed="true">' + t('posJdAr') + '</button><button type="button" data-l="En" aria-pressed="false">' + t('posJdEn') + '</button></div>' +
    ['Ar', 'En'].map(function(l){ return '<div data-jd="' + l + '"' + (l === 'En' ? ' class="hidden"' : '') + (l === 'En' ? ' dir="ltr"' : '') + ' style="display:grid;gap:12px">' +
      '<div class="field"><label>' + t('posPurpose') + '</label><textarea name="purpose' + l + '" maxlength="3000">' + esc(p ? p['purpose' + l] : '') + '</textarea></div>' +
      '<div class="field"><label>' + t('posDuties') + '</label><textarea name="duties' + l + '" maxlength="3000" style="height:130px">' + esc(p ? p['duties' + l] : '') + '</textarea></div>' +
      '<div class="field"><label>' + t('posReq') + '</label><textarea name="requirements' + l + '" maxlength="3000" style="height:100px">' + esc(p ? p['requirements' + l] : '') + '</textarea></div></div>'; }).join('') +
    (p ? fieldSel('status', t('status'), [['active', t('orgActive')], ['disabled', t('orgDisabled')]], p.status, false) : '') +
    '<div class="err" id="poerr" style="color:var(--red)"></div><div class="btnrow"><button class="btn btn-dark">' + t('save') + '</button><button type="button" class="btn btn-line" id="pocancel">' + t('cancel') + '</button></div></form>');
  dr.querySelector('.panel').classList.add('wide');
  $$('.hr-jdtabs button', dr).forEach(function(b){ b.onclick = function(){ jl = b.dataset.l; $$('.hr-jdtabs button', dr).forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.l === jl); }); $$('[data-jd]', dr).forEach(function(x){ x.classList.toggle('hidden', x.dataset.jd !== jl); }); }; });
  $('#pocancel', dr).onclick = function(){ dr.remove(); };
  $('#posf', dr).onsubmit = function(ev){
    ev.preventDefault();
    var v = formData(this); if (p) v.id = p.id;
    api('hrPositionSave', { position: v }).then(function(r){ if (!r.ok) return showErr($('#poerr', dr), r); dr.remove(); toast(t('saved')); done(); });
  };
}

// ---------------- salary approvals ----------------
function approvals(body){
  loading(body);
  api('hrCompList', { status: 'pending' }, true).then(function(r){
    if (!r.ok) return failed(body, function(){ approvals(body); });
    var rows = r.rows, open = rows.filter(function(x){ return !x.mine; });
    setApBadge(open.length);
    if (!rows.length) { body.innerHTML = '<div class="hr-h"><h2>' + t('hrApprovals') + '</h2></div><div class="empty">' + ph('seal-check') + '<b>' + t('apEmpty') + '</b></div>'; return; }
    body.innerHTML = '<div class="hr-h"><h2>' + t('hrApprovals') + ' <span class="chip late num" style="vertical-align:middle">' + open.length + '</span></h2></div>' +
      '<div class="toolbar"><label class="chip" style="cursor:pointer;padding:8px 12px"><input type="checkbox" id="apAll"> ' + t('apSelectAll') + '</label><span class="grow"></span>' +
      '<button type="button" class="btn btn-line btn-sm" id="apNo">' + t('apReject') + '</button><button type="button" class="btn btn-dark btn-sm" id="apYes">' + ph('seal-check') + t('apApprove') + '</button></div>' +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>' + t('hrName') + '</th><th>' + t('apEff') + '</th><th class="hr-amt">' + t('payBasic') + '</th><th class="hr-amt">' + t('payHousing') + '</th><th class="hr-amt">' + t('payTransport') + '</th><th class="hr-amt">' + t('payTotal') + '</th><th>' + t('apBy') + '</th></tr></thead><tbody>' +
      rows.map(function(c){ return '<tr><td><input type="checkbox" data-c="' + c.id + '"' + (c.mine ? ' disabled' : '') + ' aria-label="' + esc(c.emp ? c.emp.name : '') + '"></td><td><b style="font-weight:500">' + esc(c.emp ? lang(c.emp.name, c.emp.nameEn) : '') + '</b> <small class="num" style="color:var(--ink-2)">' + esc(c.emp ? c.emp.empNo : '') + '</small>' + (c.reason === 'import' ? ' <span class="chip">' + t('apImport') + '</span>' : c.reason ? ' <small style="color:var(--ink-2)">' + esc(c.reason === 'initial' ? t('rsInitial') : c.reason) + '</small>' : '') + '</td>' +
        '<td class="num">' + fmtDate(c.effectiveFrom) + '</td><td class="hr-amt">' + money(c.basic) + '</td><td class="hr-amt">' + money(c.housing) + '</td><td class="hr-amt">' + money(c.transport) + '</td><td class="hr-amt"><b>' + money(c.total) + '</b></td><td>' + (c.mine ? '<span class="chip">' + t('apMine') + '</span>' : esc(c.enteredByName || '')) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="err" id="aperr" style="color:var(--red);margin-top:8px"></div>';
    var boxes = $$('[data-c]', body).filter(function(x){ return !x.disabled; });
    $('#apAll').onchange = function(){ var v = this.checked; boxes.forEach(function(x){ x.checked = v; }); };
    var armed = false;
    function decide(decision){
      var ids = boxes.filter(function(x){ return x.checked; }).map(function(x){ return x.dataset.c; });
      if (!ids.length) return;
      if (decision === 'reject' && !armed) { armed = true; $('#apNo').textContent = t('apConfirmReject'); return; }
      $('#apYes').disabled = $('#apNo').disabled = true;
      api('hrCompDecide', { ids: ids, decision: decision }).then(function(x){
        if (!x.ok) { $('#apYes').disabled = $('#apNo').disabled = false; return showErr($('#aperr'), x); }
        toast((decision === 'approve' ? t('apDone') : t('apRejected')) + ' ' + x.decided);
        approvals(body);
      });
    }
    $('#apYes').onclick = function(){ decide('approve'); };
    $('#apNo').onclick = function(){ decide('reject'); };
  });
}

// ---------------- documents and expiries ----------------
function expiring(body){
  var days = S.exDays || 60;
  body.innerHTML = '<div class="hr-h"><h2>' + t('hrExpiring') + '</h2><label style="display:flex;align-items:center;gap:8px;color:var(--ink-2);font-size:13.5px">' + t('exDays') +
    '<select id="exd" style="height:38px;border:1px solid var(--line);border-radius:var(--r-s);background:var(--card);padding:0 10px">' + [30, 60, 90, 180].map(function(n){ return opt(n, plural(n, 'days'), days); }).join('') + '</select></label></div><div id="exBody"></div>';
  $('#exd').onchange = function(){ S.exDays = Number(this.value); expiring(body); };
  var el = $('#exBody');
  loading(el);
  api('hrExpiring', { days: days }, true).then(function(r){
    if (!r.ok) return failed(el, function(){ expiring(body); });
    if (!r.rows.length) { el.innerHTML = '<div class="empty">' + ph('calendar-check') + '<b>' + t('exEmpty') + '</b></div>'; return; }
    el.innerHTML = '<div class="list">' + r.rows.map(function(x){
      return '<div class="row click" data-id="' + x.empId + '" tabindex="0"><div class="av">' + ph(x.kind === 'contract_end' || x.kind === 'probation_end' ? 'file-text' : 'identification-card') + '</div><div class="main"><b>' + t('doc_' + x.kind) + '، ' + esc(x.name) + '</b><small class="num">' + esc(x.empNo) + (x.number ? '، <span dir="ltr">' + esc(x.number) + '</span>' : '') + '</small></div><div class="end">' + daysChip(x.daysLeft) + '<small class="num">' + fmtDate(x.date) + '</small></div></div>';
    }).join('') + '</div>';
    $$('[data-id]', el).forEach(function(r){ r.onclick = function(){ openEmp(r.dataset.id); }; });
  });
}

// ---------------- Excel import ----------------
var xlsxLoading = null;
function xlsxLib(){
  if (window.XLSX) return Promise.resolve();
  if (xlsxLoading) return xlsxLoading;
  xlsxLoading = new Promise(function(res, rej){ var s = document.createElement('script'); s.src = XLSX_URL; s.onload = res; s.onerror = function(){ xlsxLoading = null; rej(); }; document.head.appendChild(s); });
  return xlsxLoading;
}
function headKey(h){ return String(h == null ? '' : h).replace(/[*\s_]+/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase(); }
var HEAD_MAP = {};
COLS.forEach(function(c){ HEAD_MAP[headKey(c[1])] = c[0]; HEAD_MAP[headKey(c[2])] = c[0]; HEAD_MAP[headKey(c[0])] = c[0]; });
function colLabel(k){ var c = COLS.filter(function(x){ return x[0] === k; })[0]; return c ? (S.lang === 'en' ? c[2] : c[1]) : k; }

function importer(body){
  var st = { rows: null, lines: null, check: null, file: '' };
  body.innerHTML = '<div class="hr-h"><h2>' + t('hrImport') + '</h2></div><ol class="hr-steps">' +
    '<li><h3>' + t('imStep1') + '</h3><p>' + t('imStep1Lead') + '</p><button type="button" class="btn btn-line btn-sm" id="imTpl">' + ph('download-simple') + t('imDownload') + '</button></li>' +
    '<li><h3>' + t('imStep2') + '</h3><p>' + t('imStep2Lead') + '</p><label class="btn btn-dark btn-sm" style="cursor:pointer">' + ph('upload-simple') + t('imChoose') + '<input type="file" id="imFile" accept=".xlsx,.xls,.csv" hidden></label> <span id="imName" class="hr-hint"></span></li>' +
    '<li><h3>' + t('imStep3') + '</h3><div id="imRes"><p>' + t('imStep2Lead') + '</p></div></li></ol>';
  var res = $('#imRes');
  $('#imTpl').onclick = function(){
    var b = this; b.disabled = true;
    xlsxLib().then(function(){
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.aoa_to_sheet([COLS.map(function(c){ return (S.lang === 'en' ? c[2] : c[1]) + (c[3] ? ' *' : ''); })]);
      ws['!cols'] = COLS.map(function(){ return { wch: 22 }; });
      XLSX.utils.book_append_sheet(wb, ws, t('imTplSheet'));
      var help = [[t('imCol'), t('imRequired'), t('imFormat')]].concat(COLS.map(function(c){ return [S.lang === 'en' ? c[2] : c[1], c[3] ? t('imRequired') : t('imOptional'), S.lang === 'en' ? c[5] : c[4]]; }));
      var hs = XLSX.utils.aoa_to_sheet(help); hs['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 44 }];
      XLSX.utils.book_append_sheet(wb, hs, t('imHelpSheet'));
      XLSX.writeFile(wb, 'bestgas-hr-template.xlsx');
      b.disabled = false;
    }, function(){ b.disabled = false; toast(t('imLibFail')); });
  };
  $('#imFile').onchange = function(){
    var f = this.files && this.files[0]; this.value = '';
    if (!f) return;
    $('#imName').textContent = f.name;
    res.innerHTML = '<p class="hr-hint">' + t('imReading') + '</p>';
    xlsxLib().then(function(){ return f.arrayBuffer(); }).then(function(buf){
      var wb = XLSX.read(buf, { type: 'array', cellDates: false });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
      parse(aoa);
    }, function(){ res.innerHTML = '<p class="hr-bad">' + t('imLibFail') + '</p>'; });
  };
  function parse(aoa){
    var head = (aoa[0] || []).map(function(h){ return HEAD_MAP[headKey(h)] || null; });
    var unknown = (aoa[0] || []).filter(function(h, i){ return String(h).trim() && !head[i]; });
    var missing = COLS.filter(function(c){ return c[3] && head.indexOf(c[0]) < 0; }).map(function(c){ return S.lang === 'en' ? c[2] : c[1]; });
    if (missing.length) { res.innerHTML = '<p class="hr-bad">' + t('imMissingCols') + ' ' + missing.map(esc).join('، ') + '</p>'; return; }
    var rows = [], lines = [];
    for (var i = 1; i < aoa.length; i++) {
      var o = {}, any = false;
      head.forEach(function(k, c){ if (!k) return; var v = aoa[i][c]; if (typeof v === 'string') v = v.trim(); if (v !== '' && v != null) any = true; o[k] = v; });
      if (!any) continue;
      ['empNo', 'managerEmpNo', 'nationalId', 'phone', 'gosiNumber', 'borderNo', 'emergencyPhone', 'contractNo', 'occupationCode'].forEach(function(k){ if (typeof o[k] === 'number') o[k] = String(o[k]); });
      rows.push(o); lines.push(i + 1);
    }
    if (!rows.length) { res.innerHTML = '<p class="hr-bad">' + t('imEmptyFile') + '</p>'; return; }
    st.rows = rows; st.lines = lines;
    res.innerHTML = (unknown.length ? '<p class="hr-hint">' + t('imUnknown') + ' ' + unknown.map(esc).join('، ') + '</p>' : '') + '<p class="hr-hint">' + t('imChecking') + '</p>';
    api('hrImportValidate', { rows: rows }).then(function(r){ show(r, unknown); });
  }
  function show(r, unknown){
    if (!r.ok) { res.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
    var s = r.summary, errs = r.errors;
    var html = (unknown.length ? '<p class="hr-hint">' + t('imUnknown') + ' ' + unknown.map(esc).join('، ') + '</p>' : '') +
      '<div class="hr-sum"><span class="chip num">' + plural(s.rows, 'rows') + '</span><span class="chip in num">' + t('imCreate') + ': ' + s.create + '</span><span class="chip num">' + t('imUpdate') + ': ' + s.update + '</span>' +
      (s.departments ? '<span class="chip num">' + t('imNewDepts') + ': ' + s.departments + '</span>' : '') + (s.positions ? '<span class="chip num">' + t('imNewPos') + ': ' + s.positions + '</span>' : '') +
      (errs.length ? '<span class="chip absent num">' + t('imErrors') + ': ' + errs.length + '</span>' : '') + '</div>';
    if (errs.length) {
      html += '<div class="tblwrap hr-err" style="max-height:420px"><table class="tbl"><thead><tr><th>' + t('imRow') + '</th><th>' + t('imCol') + '</th><th>' + t('imProblem') + '</th></tr></thead><tbody>' +
        errs.map(function(e){ return '<tr><td>' + (st.lines[e.row - 2] || e.row) + '</td><td>' + esc(colLabel(e.field)) + '</td><td>' + esc(errText(e.code)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else html += '<p style="color:#255B31;margin:0 0 10px">' + t('imNoErrors') + '</p><button type="button" class="btn btn-dark" id="imGo">' + ph('check') + t('imGo') + '</button>';
    res.innerHTML = html;
    var go = $('#imGo');
    if (go) go.onclick = function(){
      go.disabled = true;
      api('hrImportCommit', { rows: st.rows }).then(function(x){
        if (!x.ok) { go.disabled = false; if (x.errors) return show({ ok: true, summary: s, errors: x.errors }, []); res.insertAdjacentHTML('beforeend', '<p class="hr-bad">' + errText(x.error) + '</p>'); return; }
        H.dir = null;
        res.innerHTML = '<p style="color:#255B31;font-weight:500;margin:0 0 8px">' + t('imDone') + '</p><div class="hr-sum"><span class="chip in num">' + t('imCreate') + ': ' + x.created + '</span><span class="chip num">' + t('imUpdate') + ': ' + x.updated + '</span>' +
          (x.pendingSalaries ? '<span class="chip late num">' + t('imSalaries') + ': ' + x.pendingSalaries + '</span>' : '') + '</div>' +
          (x.pendingSalaries ? '<button type="button" class="btn btn-dark btn-sm" id="imAp">' + t('imGoApprovals') + '</button>' : '');
        var ap = $('#imAp'); if (ap) ap.onclick = function(){ S.hrSec = 'approvals'; render($('#main')); };
      });
    };
  }
}

window.HrConsole = { render: render, openEmp: openEmp };
})();
