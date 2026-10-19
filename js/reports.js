// Reports centre: catalogue, filters, table (sort, search, columns, group-by with subtotals, pages), checks, chart,
// and numbered exports (Excel with an Info sheet, CSV, PDF/print with watermark, fingerprint and QR), plus the export
// log with second-person review and a verifier. Every number and every access rule comes from Reports.gs.
// Excel follows the xlsx skill: Arial, zeros as "-", negatives in brackets, totals as SUM formulas (with cached values).
(function(){
'use strict';
var V = window.Viz;

var RPT = {
  rec_pipeline: ['مسار التوظيف حسب الطلب', 'Hiring funnel by requisition', 'لكل طلب توظيف: المرشحون (والداخليون منهم) والمقابلات والعروض والتعيينات وأيام الفتح.', 'Per requisition: candidates (internal among them), interviews, offers, hires and days open.'],
  rec_sources: ['مصادر المرشحين', 'Candidate sources', 'لكل مصدر: المرشحون ومن قوبل ومن عرض عليه ومن عين ونسبة التعيين.', 'Per source: candidates, interviewed, offered, hired and the hire rate.'],
  trn_hours: ['ساعات التدريب وتكلفته', 'Training hours and cost', 'لكل موظف: الدورات المكتملة وساعاتها وتكلفتها والشهادات التي تنتهي خلال 90 يوما.', 'Per person: completed courses, hours, cost and certificates expiring within 90 days.'],
  ins_coverage: ['تغطية التأمين الطبي', 'Medical insurance coverage', 'لكل موظف: مغطى أم لا، الفئة، عدد المرافقين. غير السعودي بلا تغطية مخالفة لنظام الضمان الصحي.', 'Per person: covered or not, class, dependants. A non-Saudi without cover breaches the health insurance law.'],
  att_daily: ['الحضور اليومي التفصيلي', 'Daily attendance detail', 'كل يوم عمل لكل موظف: الحضور والانصراف والتأخير والإضافي ومصدر البصمة. حتى 31 يوما.', 'Every working day per person: in, out, lateness, overtime and punch source. Up to 31 days.'],
  att_monthly: ['كشف الحضور الشهري', 'Monthly attendance sheet', 'شبكة الشهر يوما بيوم بالرموز مع مجاميع الحضور والغياب والتأخير. جاهز للتوقيع.', 'The month day by day in codes, with totals. Ready to sign.'],
  att_summary: ['ملخص الحضور والانضباط', 'Attendance and punctuality summary', 'لكل موظف: الأيام المتوقعة والحضور والغياب والتأخير ونسبتا الحضور والانضباط.', 'Per person: expected days, present, absent, late, attendance and on-time rates.'],
  att_exceptions: ['استثناءات البصمة', 'Punch exceptions', 'البصمات المحتجزة للمراجعة أو المرفوضة أو اليدوية، مع مؤشرات الخطر والمسافة ومن راجعها.', 'Punches held for review, rejected or manual, with risk flags, distance and reviewer.'],
  leave_balances: ['أرصدة الإجازات', 'Leave balances', 'الافتتاحي والمستحق والمستخدم والمحجوز والمتاح في تاريخ تختاره، والالتزام المالي لمن يملك الصلاحية.', 'Opening, accrued, used, reserved and available on a date, with the money liability where allowed.'],
  leave_taken: ['الإجازات المأخوذة', 'Leave taken', 'الإجازات المعتمدة في الفترة بنوعها وأيامها داخل الفترة.', 'Approved leave in the period by type, with the days that fall inside it.'],
  requests_log: ['سجل الطلبات وزمن البت', 'Requests and decision time', 'كل الطلبات في الفترة بحالتها ومرحلتها والساعات حتى القرار.', 'Every request in the period with status, step and hours to decision.'],
  hr_headcount: ['سجل الموظفين', 'Employee register', 'القائمة الكاملة بالوظيفة والمدير والتعيين والجنسية والعقد، مع فحص الآيبان والهويات.', 'Everyone with position, manager, hire date, nationality and contract, with IBAN and ID checks.'],
  hr_movement: ['المنضمون والمغادرون', 'Joiners and leavers', 'حركة التعيين والمغادرة خلال سنة.', 'Hires and exits over up to a year.'],
  hr_expiry: ['الوثائق والعقود التي تنتهي', 'Expiring documents and contracts', 'الإقامات والجوازات والعقود وفترات التجربة التي تنتهي خلال الأيام التي تحددها.', 'Iqamas, passports, contracts and probation ending within the days you choose.'],
  hr_saudization: ['التوطين حسب الإدارة (نطاقات)', 'Saudization by department (Nitaqat)', 'العدد والسعوديون ووزن الأجر (نصف أو صفر) والنسبة المرجحة.', 'Headcount, Saudis, wage weighting (half or zero) and the weighted rate.'],
  pay_register: ['مسير الرواتب التفصيلي', 'Payroll register', 'كل بند لكل موظف، الآيبان مخفي، وإجمالي تحكم للمطابقة مع ملف البنك.', 'Every line per person, IBAN masked, with a control total to match the bank file.'],
  pay_variance: ['فروقات الرواتب عن الشهر السابق', 'Payroll variance vs last month', 'يقارن كل موظف بآخر مسير مقفل ويبرز من تغير صافيه بأكثر من النسبة المحددة.', 'Compares each person with the last locked run and flags changes above the threshold.'],
  pay_gosi: ['اشتراكات التأمينات الاجتماعية', 'GOSI contributions', 'الأجر الخاضع ونسب ومبالغ الموظف والشركة حسب الفئة.', 'Contributory wage, employee and employer rates and amounts by cohort.'],
  pay_cost: ['تكلفة الرواتب حسب الإدارة', 'Payroll cost by department', 'الإجمالي والتأمينات على الشركة والتكلفة الكلية لكل إدارة ومركز تكلفة، دون أي راتب فردي.', 'Gross, employer GOSI and total cost per department and cost centre; no individual pay.'],
  pay_equity: ['عدالة الأجور (الجنس والجنسية)', 'Pay equity (gender and nationality)', 'متوسط الراتب الشهري لكل وظيفة للرجال والنساء وللسعوديين وغيرهم، والفجوة بينهم. الفجوة سؤال يستحق التحقق (الخبرة، الدرجة، الأقدمية) وليست حكما.', 'Average monthly package per position for men and women, Saudis and non-Saudis, and the gap. A gap is a question to check (experience, grade, tenure), not a finding.'],
  pay_eos: ['التزام مكافأة نهاية الخدمة', 'End-of-service liability', 'الخدمة المحتسبة والأجر والمكافأة كاملة (م 84) وعند الاستقالة (م 85) وبدل الإجازة (م 111).', 'Counted service, wage, full award (Art. 84), on resignation (Art. 85) and leave pay (Art. 111).'],
  perf_results: ['نتائج تقييم الأداء', 'Performance results', 'التقييم الذاتي وتقييم المدير والدرجات والتقدير النهائي لكل موظف في الدورة.', 'Self and manager review status, scores and final rating per person in the cycle.'],
  audit_log: ['سجل التدقيق', 'Audit log', 'كل إجراء حساس: من فعل ماذا ومتى. حتى 3000 سطر.', 'Every sensitive action: who did what and when. Up to 3,000 lines.'],
  // analytical reports (2026-10-04)
  att_dept_trend: ['نسبة الحضور حسب الإدارة شهريا', 'Attendance rate by department and month', 'نسبة الحضور لكل إدارة في كل شهر، والفرق عن الشهر السابق بالنقاط وبالنسبة.', 'Each department\'s attendance rate per month, with the change from the month before in points and %.'],
  att_punctuality: ['اتجاه الانضباط في المواعيد', 'Punctuality trend', 'نسبة الحضور في الموعد شهريا، مع متوسط دقائق التأخير ووسيطها والشريحة العليا (90%)، ومقارنة بالشهر السابق.', 'On-time arrivals per month, with the mean, median and 90th percentile of minutes late, against the month before.'],
  att_late_top: ['التأخير حسب الموظف (الأكثر تأخرا)', 'Lateness by employee (top 10)', 'ترتيب الموظفين بدقائق التأخير وأيامه ونسبته، مع الفترة السابقة وحصة الأكثر عشرة تأخرا.', 'People ranked by minutes late, late days and late rate, with the previous period and the top ten\'s share.'],
  att_bradford: ['مؤشر برادفورد للغياب', 'Bradford factor (absence)', 'عدد فترات الغياب مربعا × أيام الغياب دون عذر لكل موظف، بشرائح التنبيه والفترة السابقة. تنبيه للحديث، لا عقوبة.', 'Spells of unexcused absence squared x days, per person, in alert bands with the previous period. A prompt to talk, not a penalty.'],
  att_weekday: ['أنماط أيام الأسبوع', 'Day-of-week patterns', 'الغياب والتأخير لكل يوم من أيام الأسبوع مقارنة بالفترة السابقة، مع تنبيه لليوم الذي يتضاعف فيه الغياب.', 'Absence and lateness by day of the week against the previous period, flagging a day with double the absence.'],
  att_checkin_bands: ['توزيع أوقات الحضور', 'Check-in time distribution', 'أول حضور في كل يوم عمل مقارنة ببداية الدوام: مبكر، في الموعد، متأخر بشرائح، لكل إدارة ومع الفترة السابقة.', 'First check-in of each working day against the shift start: early, on time, late in bands, per department, with the previous period.'],
  att_missing_out: ['أيام بلا تسجيل انصراف', 'Missing check-outs', 'من سجل حضوره ولم يسجل انصرافه، كم مرة ومتى، ونسبتها من أيام حضوره، مع الفترة السابقة.', 'Who checked in but never out, how often and when, as a share of their days, with the previous period.'],
  att_flags: ['البصمات حسب مؤشر الخطر', 'Flagged punches by risk flag', 'كل مؤشر خطر: عدد البصمات والموظفين، وما احتجز للمراجعة وما اعتمد أو رفض، ومتوسط الخطر، مع الفترة السابقة.', 'Each risk flag: punches and people, held for review, approved or rejected, the average risk, with the previous period.'],
  att_overtime: ['ساعات العمل الإضافي', 'Overtime hours', 'الإضافي من البصمات لكل موظف في أيام العمل والراحة، بمجاميع الإدارات والفترة السابقة، وتقدير التكلفة (م 107) لمن يملك صلاحية الرواتب.', 'Overtime from the punches per person on working and rest days, with department subtotals and the previous period, and the Art. 107 cost estimate for payroll access.'],
  leave_util_dept: ['استخدام الإجازات حسب الإدارة', 'Leave utilisation by department', 'الإجازة السنوية المأخوذة مقابل المستحقة في الفترة لكل إدارة، والمرضية والأخرى، ومن لم يأخذ إجازة، مع الفترة السابقة.', 'Annual leave taken against leave earned in the period per department, sick and other leave, who took none, with the period before.'],
  leave_type_month: ['الإجازات حسب النوع شهريا', 'Leave by type and month', 'أيام الإجازات المعتمدة لكل نوع في كل شهر، وعدد الطلبات والموظفين، والفرق عن الشهر السابق.', 'Approved leave days per type and month, requests and people, with the change from the month before.'],
  leave_upcoming: ['الإجازات القادمة', 'Upcoming leave', 'الإجازات المعتمدة والمنتظرة خلال الأيام القادمة (60 افتراضيا)، مع أكثر يوم غياب في الإدارة لكشف تزاحم الإجازات.', 'Approved and pending leave in the coming days (60 by default), with the department\'s busiest day away to spot clashes.'],
  leave_sick_bradford: ['تكرار الإجازات المرضية (برادفورد)', 'Sick leave frequency (Bradford)', 'فترات الإجازة المرضية المعتمدة وأيامها ومؤشر برادفورد لكل موظف، والمتبقي بأجر كامل (م 117)، مع الفترة السابقة.', 'Spells and days of approved sick leave and the Bradford factor per person, full-pay days left (Art. 117), with the previous period.'],
  leave_yearend_risk: ['أرصدة معرضة للتراكم في نهاية السنة', 'Balances at risk at year end', 'الرصيد المتوقع في 31 ديسمبر بعد المعتمد والمنتظر، وما يزيد على استحقاق سنة، والأيام المطلوب جدولتها شهريا، وقيمتها لمن يملك الصلاحية.', 'Projected balance on 31 December after approved and pending leave, the excess over one year, days a month to plan, and its value where allowed.'],
  leave_liability_trend: ['اتجاه التزام الإجازات', 'Leave liability trend', 'التزام الإجازة السنوية غير المستخدمة في نهاية كل شهر (الرصيد × الأجر ÷ 30)، مجاميع فقط، مع الشهر السابق.', 'The unused annual leave liability at each month end (balance x wage / 30), totals only, with the month before.'],
  pay_company_cost: ['تكلفة الموظف على الشركة', 'Company cost per employee', 'لكل موظف: الإجمالي وتأمينات الشركة ومخصص نهاية الخدمة الشهري والتكلفة الكلية، بمجاميع الإدارات وحصة كل منهم ومقارنة بالمسير السابق.', 'Per person: gross, employer GOSI, the monthly end-of-service provision and total cost, with department subtotals, share and the last run.'],
  pay_gosi_wage: ['أجر التأمينات مقابل الإجمالي', 'GOSI wage vs gross', 'الأجر الخاضع للتأمينات (الأساسي والسكن أو المسجل، بعد الحد الأدنى والأعلى) مقابل الإجمالي، وما خرج منه، والمطابقة مع آخر ملف تأمينات.', 'The contributory wage (basic + housing or the registered wage, after the floor and ceiling) against gross, what is left out, and the latest GOSI upload.'],
  pay_var_lines: ['فروقات الرواتب حسب البند', 'Payroll variance by line', 'لكل من تغير صافيه عن آخر مسير مقفل: البنود التي تغيرت وأثر كل منها على الصافي، والبند الذي سبب التغير.', 'For everyone whose net moved against the last locked run: the lines that changed, each line\'s effect on net, and the line that caused it.'],
  pay_ytd: ['المستحقات منذ بداية السنة', 'Year-to-date earnings', 'مجاميع كل موظف من بداية السنة حتى المسير المختار، بندا بندا، مقارنة بالفترة نفسها من السنة الماضية.', 'Each person\'s totals from the start of the year to the chosen run, line by line, against the same months last year.'],
  pay_bands: ['شرائح الرواتب حسب الدرجة والوظيفة', 'Pay bands by grade and position', 'أدنى راتب ووسيطه ومتوسطه وأعلاه والفارق لكل وظيفة، ووسيط الدرجة، والقيم الشاذة.', 'Minimum, median, mean and maximum pay and the spread per position, the grade median, and outliers.'],
  pay_gosi_cohort: ['التأمينات حسب الفئة', 'GOSI by cohort', 'الأجر الخاضع وحصتا الموظف والشركة لكل فئة (النظام السابق، الجديد، غير السعوديين)، مجاميع فقط مع المسير السابق.', 'Contributory wage and employee and employer shares per cohort (legacy, new law, non-Saudi), totals only, with the last run.'],
  pay_deductions: ['تحليل الخصومات', 'Deductions analysis', 'كل نوع خصم: عدد الموظفين والمبلغ وحصته من الخصومات ومن الإجمالي والمتوسط، مع المسير السابق.', 'Each deduction type: people, amount, share of deductions and of gross, the average, with the last run.'],
  pay_ot_trend: ['اتجاه تكلفة العمل الإضافي', 'Overtime cost trend', 'ساعات ومبالغ الإضافي المدفوعة شهريا من المسيرات، وحصتها من الإجمالي، مع الشهر السابق.', 'Overtime hours and pay per month from the runs, as a share of gross, with the month before.'],
  pay_cost_per_head: ['تكلفة الموظف الواحد شهريا', 'Payroll cost per head', 'التكلفة الكلية (الإجمالي وتأمينات الشركة ومخصص نهاية الخدمة) مقسومة على عدد الموظفين في كل شهر، مع الشهر السابق.', 'Total cost (gross, employer GOSI and end-of-service provision) divided by the people paid each month, with the month before.'],
  wf_snapshot: ['لقطة العدد الشهرية', 'Monthly headcount snapshot', 'العدد في نهاية الشهر لكل إدارة حسب الجنسية والجنس، والمنضمون والمغادرون فيه، والفرق عن نهاية الشهر السابق.', 'Headcount at the month end per department by nationality and gender, joiners and leavers, and the change from last month end.'],
  wf_joiners: ['سجل المنضمين', 'Joiners register', 'كل من عين في الفترة: الوظيفة والمدير والعقد والتجربة وتقدم التهيئة، وهل بقي أو غادر مبكرا، مع عدد الفترة السابقة.', 'Everyone hired in the period: position, manager, contract, probation, onboarding progress, still here or gone early, with the period before.'],
  wf_leavers: ['سجل المغادرين', 'Leavers register', 'كل من غادر في الفترة: مدة الخدمة والسبب والطوعية، ومغادرو السنة الأولى، والإشعار، وإخلاء الطرف، وآخر تقييم.', 'Everyone who left in the period: service, reason, voluntary or not, first-year leavers, notice, clearance, and the last rating.'],
  wf_turnover_dept: ['معدل الدوران حسب الإدارة', 'Turnover by department', 'المغادرون مقسومون على متوسط العدد في الفترة (12 شهرا افتراضيا) لكل إدارة، طوعا وغير ذلك، مع الفترة السابقة.', 'Leavers over the average headcount in the period (12 months by default) per department, voluntary and other, with the period before.'],
  wf_tenure: ['توزيع مدة الخدمة', 'Tenure distribution', 'مدة الخدمة اليوم لكل إدارة بشرائح، مع المتوسط والوسيط ونسبة من في سنتهم الأولى.', 'Years of service today per department in bands, with the mean, median and the share in their first year.'],
  wf_span: ['نطاق الإشراف', 'Span of control', 'لكل مدير: المرؤوسون المباشرون وكل من تحته وعدد المستويات، مع تنبيه للنطاق الواسع جدا أو الضيق.', 'Per manager: direct reports, everyone below and the layers, flagging very wide or narrow spans.'],
  wf_org: ['خطوط التبعية (الهيكل)', 'Reporting lines (org chart)', 'لكل موظف: مديره ورئيس إدارته ومستواه من القمة وسلسلة المديرين فوقه. جاهز للتصدير.', 'Per person: manager, department head, level from the top and the chain of managers above. Ready to export.'],
  wf_vacancies: ['الوظائف الشاغرة', 'Positions without holders', 'كل وظيفة لا يشغلها أحد الآن، ومنذ متى، وآخر من شغلها.', 'Every position nobody holds now, since when, and who held it last.'],
  wf_probation: ['انتهاء فترات التجربة', 'Probation endings', 'من تنتهي تجربته خلال 30 أو 60 أو 90 يوما، مع حالة تقييم التجربة وتقدم التهيئة (م 53).', 'Probation ending within 30, 60 or 90 days, with the probation review and onboarding progress (Art. 53).'],
  perf_curve: ['توزيع التقديرات مقابل المنحنى', 'Rating distribution vs the curve', 'عدد ونسبة كل تقدير من 1 إلى 5 مقابل النطاق الصحي، والفرق بالنقاط.', 'Count and share of each rating 1 to 5 against the healthy range, and the gap in points.'],
  perf_kpi: ['إنجاز الأهداف في الدورة', 'KPI completion', 'لكل موظف: الأهداف وأوزانها ومراجعة منتصف العام وحالتها والتقييم الذاتي وتقييم المدير ونسبة الإنجاز.', 'Per person: KPIs and weights, mid-year check-in and status, self and manager review, and completion.'],
  perf_360: ['المشاركة في تقييم 360', '360 participation', 'الدعوات والإجابات ونسبة الاستجابة لكل موظف، وهل تبلغ مجموعات الزملاء والمرؤوسين 3 إجابات لتعرض. أعداد فقط.', 'Invitations, answers and response rate per person, and whether peer and report groups reach 3 answers to show. Counts only.'],
  perf_plans: ['حالة خطط التطوير والتحسين', 'IDP and PIP status', 'كل خطة تطوير أو تحسين أداء: المدة والأهداف المحققة والمتعثرة والمتابعات والاطلاع، مع تنبيه للمتأخرة.', 'Every development or improvement plan: dates, goals met and at risk, check-ins and acknowledgement, flagging overdue ones.'],
  req_sla: ['زمن البت في الموافقات', 'Approval SLA', 'زمن القرار لكل مرحلة ولكل معتمد: المتوسط والوسيط والشريحة العليا ونسبة ما تم خلال 48 ساعة، مع الفترة السابقة.', 'Time to decide per step and approver: mean, median, 90th percentile and the share within 48 hours, with the previous period.'],
  req_bottlenecks: ['الطلبات المتعثرة', 'Approval bottlenecks', 'كل طلب ينتظر قرارا الآن عند من هو، الأقدم أولا، وأيام الانتظار منذ آخر إجراء ومنذ تقديمه.', 'Every request waiting for a decision now, with whom, oldest first, days since the last action and since it was made.'],
  req_volume: ['حجم الطلبات حسب النوع شهريا', 'Request volume by type and month', 'الطلبات المقدمة لكل نوع في كل شهر ونتائجها ونسبة الاعتماد وزمن القرار، مع الشهر السابق.', 'Requests made per type and month, their outcome, approval rate and time to decide, with the month before.'],
  cmp_disciplinary: ['ملخص القضايا التأديبية', 'Disciplinary cases summary', 'القضايا حسب المخالفة: المفتوحة والمبتوت فيها والمعترض عليها والمتكررة والجزاءات، وزمن البت، والغرامات لمن يملك صلاحية الرواتب.', 'Cases by violation: open, decided, objected, repeated, penalties, time to decide, and the fines for payroll access.'],
  cmp_injuries: ['سجل إصابات العمل', 'Work injuries log', 'كل إصابة ومتى أبلغت التأمينات مقارنة بمهلة 3 أيام، وأيام التأخير والانقطاع، وحالتها.', 'Every injury and when GOSI was told against the 3-day limit, days late and days off, and where it stands.'],
  cmp_custody: ['العهد لدى الموظفين', 'Assets in custody', 'العهد التي يحملها كل موظف حسب النوع وقيمتها، وما لم يؤكد استلامه، ومنذ متى، والمغادرون الذين ما زالوا يحملون عهدا.', 'Assets each person holds by type and value, receipts not confirmed, since when, and leavers still holding them.'],
  cmp_clearance: ['حالة إخلاء الطرف', 'Clearance status', 'كل إخلاء طرف: التقدم والمهام المفتوحة عند المدير والموارد البشرية والرواتب، والعهد غير المعادة، والمتأخر.', 'Every clearance: progress, open tasks with the manager, HR and payroll, assets not returned, and overdue ones.'],
  cmp_wps: ['سجل حماية الأجور والمطابقات', 'WPS and reconciliation history', 'لكل شهر: المسير وملف حماية الأجور (إنشاء، رفع، تأكيد) وموعده والتأخير، وآخر مطابقة للتأمينات وقوى.', 'Per month: the run, the WPS file (generated, uploaded, confirmed), its due date and delay, and the latest GOSI and Qiwa reconciliations.']
};
var GROUPS = [['attendance', 'clock-countdown', 'الحضور والانصراف', 'Attendance'], ['leave', 'calendar-dots', 'الإجازات والطلبات', 'Leave and requests'],
  ['people', 'users-three', 'الموظفون', 'People'], ['payroll', 'money', 'الرواتب', 'Payroll'], ['performance', 'target', 'الأداء', 'Performance'],
  ['requests', 'flow-arrow', 'الطلبات والموافقات', 'Requests and approvals'], ['compliance', 'scales', 'الامتثال وعلاقات العمل', 'Compliance and relations'], ['talent', 'graduation-cap', 'التوظيف والتدريب والتأمين', 'Hiring, training and insurance'], ['audit', 'shield-check', 'التدقيق', 'Audit']];

var COLS = {
  ref: ['المرجع', 'Ref'], title: ['المسمى', 'Title'], headcount: ['العدد المطلوب', 'Headcount'], filled: ['المشغول', 'Filled'], candidates: ['المرشحون', 'Candidates'], internal: ['داخليون', 'Internal'], interviews: ['المقابلات', 'Interviews'], offers: ['العروض', 'Offers'], hired: ['التعيينات', 'Hired'], daysOpen: ['أيام الفتح', 'Days open'],
  source: ['المصدر', 'Source'], interviewed: ['قوبلوا', 'Interviewed'], offered: ['عرض عليهم', 'Offered'], hireRate: ['نسبة التعيين', 'Hire rate'], courses: ['الدورات', 'Courses'], hours: ['الساعات', 'Hours'], cost: ['التكلفة', 'Cost'], certExpiring: ['شهادات تنتهي قريبا', 'Certificates expiring'],
  covered: ['مغطى', 'Covered'], insClass: ['الفئة', 'Class'], dependants: ['المرافقون', 'Dependants'], memberNo: ['رقم العضوية', 'Member no.'],
  empNo: ['الرقم', 'No.'], name: ['الاسم', 'Name'], department: ['الإدارة', 'Department'], date: ['التاريخ', 'Date'], shift: ['الدوام', 'Shift'],
  checkIn: ['الحضور', 'In'], checkOut: ['الانصراف', 'Out'], worked: ['ساعات العمل', 'Hours worked'], late: ['تأخير (د)', 'Late (min)'], early: ['خروج مبكر (د)', 'Early (min)'],
  overtime: ['إضافي (س)', 'Overtime (h)'], status: ['الحالة', 'Status'], source: ['المصدر', 'Source'], leaveType: ['نوع الإجازة', 'Leave type'], holiday: ['العطلة', 'Holiday'],
  present: ['حضور', 'Present'], absent: ['غياب', 'Absent'], leave: ['إجازة', 'Leave'], lateDays: ['أيام تأخير', 'Late days'], lateMin: ['دقائق التأخير', 'Late minutes'],
  expected: ['أيام متوقعة', 'Expected days'], earlyMin: ['دقائق الخروج المبكر', 'Early minutes'], missingOut: ['بلا انصراف', 'No check-out'], attendance: ['الحضور %', 'Attendance %'],
  punctuality: ['الانضباط %', 'On time %'], time: ['الوقت', 'Time'], type: ['النوع', 'Type'], risk: ['الخطر', 'Risk'], flags: ['المؤشرات', 'Flags'], distance: ['المسافة (م)', 'Distance (m)'],
  by: ['بواسطة', 'By'], note: ['ملاحظة', 'Note'], perYear: ['الاستحقاق السنوي', 'Per year'], opening: ['افتتاحي', 'Opening'], accrued: ['مستحق', 'Accrued'], used: ['مستخدم', 'Used'],
  pending: ['محجوز', 'Reserved'], available: ['متاح', 'Available'], sickUsed: ['مرضية مستخدمة', 'Sick used'], liability: ['الالتزام (ريال)', 'Liability (SAR)'],
  ref: ['المرجع', 'Ref'], fromDate: ['من', 'From'], toDate: ['إلى', 'To'], days: ['الأيام', 'Days'], daysInPeriod: ['أيام داخل الفترة', 'Days in period'], docNo: ['رقم المستند', 'Document no.'],
  subtype: ['التفصيل', 'Detail'], created: ['تاريخ الطلب', 'Requested'], step: ['المرحلة', 'Step'], decided: ['تاريخ القرار', 'Decided'], hours: ['ساعات حتى القرار', 'Hours to decide'],
  position: ['الوظيفة', 'Position'], manager: ['المدير المباشر', 'Manager'], hireDate: ['تاريخ التعيين', 'Hire date'], years: ['سنوات الخدمة', 'Years'], nationality: ['الجنسية', 'Nationality'],
  saudi: ['سعودي / غير سعودي', 'Saudi / non-Saudi'], gender: ['الجنس', 'Gender'], contractType: ['نوع العقد', 'Contract'], contractEnd: ['نهاية العقد', 'Contract end'],
  movement: ['الحركة', 'Movement'], reason: ['السبب', 'Reason'], kind: ['الوثيقة', 'Document'], number: ['الرقم', 'Number'], daysLeft: ['أيام متبقية', 'Days left'],
  headcount: ['العدد', 'Headcount'], saudis: ['السعوديون', 'Saudis'], weighted: ['العدد المرجح', 'Weighted'], half: ['بنصف وزن', 'Half weight'], zero: ['بلا وزن', 'Zero weight'], pct: ['النسبة المرجحة %', 'Weighted %'],
  payslip: ['القسيمة', 'Payslip'], basic: ['الأساسي', 'Basic'], housing: ['السكن', 'Housing'], transport: ['النقل', 'Transport'], allowances: ['بدلات أخرى', 'Other allowances'],
  otherEarnings: ['مستحقات أخرى', 'Other earnings'], gross: ['الإجمالي', 'Gross'], gosi: ['تأمينات الموظف', 'Employee GOSI'], advances: ['السلف', 'Advances'],
  leaveDeductions: ['خصم إجازات وغياب', 'Leave and absence'], otherDeductions: ['خصومات أخرى', 'Other deductions'], deductions: ['مجموع الخصومات', 'Total deductions'], net: ['الصافي', 'Net'],
  gosiEmployer: ['تأمينات الشركة', 'Employer GOSI'], iban: ['الآيبان', 'IBAN'], previousGross: ['الإجمالي السابق', 'Previous gross'], previousNet: ['الصافي السابق', 'Previous net'],
  change: ['الفرق', 'Change'], changePct: ['الفرق %', 'Change %'], flag: ['التصنيف', 'Flag'], nationalId: ['الهوية / الإقامة', 'ID / Iqama'], gosiNumber: ['رقم التأمينات', 'GOSI no.'],
  cohort: ['الفئة', 'Cohort'], base: ['الأجر الخاضع', 'Contributory wage'], employeeRate: ['نسبة الموظف', 'Employee rate'], employee: ['حصة الموظف', 'Employee share'],
  employerRate: ['نسبة الشركة', 'Employer rate'], employer: ['حصة الشركة', 'Employer share'], costCenter: ['مركز التكلفة', 'Cost centre'], cost: ['التكلفة الكلية', 'Total cost'],
  excludedDays: ['أيام مستبعدة (م 116)', 'Excluded days (116)'], wage: ['الأجر المعتمد', 'Wage'], awardFull: ['المكافأة كاملة', 'Full award'], awardResignation: ['عند الاستقالة', 'On resignation'],
  leaveDays: ['رصيد الإجازة', 'Leave days'], leavePay: ['بدل الإجازة', 'Leave pay'], kpis: ['الأهداف', 'KPIs'], selfDone: ['التقييم الذاتي', 'Self review'], managerDone: ['تقييم المدير', 'Manager review'],
  kpiScore: ['درجة الأهداف', 'KPI score'], compScore: ['درجة الجدارات', 'Competency score'], overall: ['الإجمالي', 'Overall'], finalRating: ['التقدير النهائي', 'Final rating'],
  average: ['متوسط الراتب', 'Average pay'], men: ['رجال', 'Men'], menAvg: ['متوسط الرجال', 'Men average'], women: ['نساء', 'Women'], womenAvg: ['متوسط النساء', 'Women average'],
  genderGap: ['فجوة الجنس %', 'Gender gap %'], saudiAvg: ['متوسط السعوديين', 'Saudi average'], nonSaudis: ['غير السعوديين', 'Non-Saudis'], nonSaudiAvg: ['متوسط غير السعوديين', 'Non-Saudi average'], nationalityGap: ['فجوة الجنسية %', 'Nationality gap %'],
  adjusted: ['معدل بالمعايرة', 'Calibrated'], acknowledged: ['اطلع الموظف', 'Acknowledged'], at: ['الوقت', 'Time'], actor: ['المنفذ', 'Actor'], action: ['الإجراء', 'Action'], target: ['على', 'Target'], detail: ['التفاصيل', 'Detail'],
  // analytical reports (2026-10-04)
  month: ['الشهر', 'Month'], prev: ['الفترة السابقة', 'Previous'], prevRate: ['النسبة السابقة %', 'Previous rate %'], changePts: ['الفرق (نقاط)', 'Change (pts)'], share: ['الحصة %', 'Share %'],
  rank: ['الترتيب', 'Rank'], top10: ['ضمن الأكثر 10', 'Top 10'], onTime: ['في الموعد', 'On time'], avgLate: ['متوسط التأخير (د)', 'Mean late (min)'], medianLate: ['وسيط التأخير (د)', 'Median late (min)'],
  p90Late: ['التأخير عند 90% (د)', 'Late at p90 (min)'], lateRate: ['نسبة التأخير %', 'Late rate %'], maxLate: ['أطول تأخير (د)', 'Longest late (min)'], spells: ['فترات', 'Spells'], bradford: ['مؤشر برادفورد', 'Bradford'],
  band: ['الشريحة', 'Band'], lastAbsent: ['آخر غياب', 'Last absence'], weekday: ['اليوم', 'Weekday'], absentRate: ['نسبة الغياب %', 'Absence rate %'], prevAbsentRate: ['الغياب السابق %', 'Previous absence %'],
  absentChange: ['فرق الغياب (نقاط)', 'Absence change (pts)'], prevLateRate: ['التأخير السابق %', 'Previous late %'], lateChange: ['فرق التأخير (نقاط)', 'Late change (pts)'], arrivals: ['مرات الحضور', 'Arrivals'],
  prevShare: ['الحصة السابقة %', 'Previous share %'], missingRate: ['نسبة بلا انصراف %', 'Missing rate %'], lastDate: ['آخر مرة', 'Last time'], punches: ['البصمات', 'Punches'], people: ['الموظفون', 'People'],
  pendingReview: ['تنتظر المراجعة', 'Awaiting review'], approvedN: ['معتمدة', 'Approved'], rejectedN: ['مرفوضة', 'Rejected'], cancelledN: ['ملغاة', 'Withdrawn'], avgRisk: ['متوسط الخطر', 'Mean risk'],
  otDays: ['أيام الإضافي', 'Overtime days'], workdayOt: ['إضافي أيام العمل (س)', 'Working-day overtime (h)'], restOt: ['إضافي الراحة والعطل (س)', 'Rest-day overtime (h)'], estCost: ['التكلفة التقديرية', 'Estimated cost'],
  earned: ['المستحق في الفترة', 'Earned in period'], taken: ['المأخوذ', 'Taken'], utilisation: ['الاستخدام %', 'Utilisation %'], sickDays: ['أيام مرضية', 'Sick days'], otherDays: ['إجازات أخرى', 'Other leave'],
  noLeave: ['بلا إجازة سنوية', 'No annual leave'], requests: ['الطلبات', 'Requests'], openReq: ['قيد المراجعة', 'Pending'], startsIn: ['تبدأ بعد (يوم)', 'Starts in (days)'], peakAway: ['أعلى غياب في يوم', 'Most away on a day'],
  deptHeadcount: ['عدد الإدارة', 'Department size'], peakShare: ['ذروة الغياب %', 'Peak away %'], fullPayLeft: ['المتبقي بأجر كامل', 'Full-pay days left'], toAccrue: ['يستحق حتى نهاية السنة', 'Still to accrue'],
  projected: ['المتوقع في 31 ديسمبر', 'Projected 31 Dec'], excess: ['الزائد على استحقاق سنة', 'Over one year'], perMonth: ['يلزم جدولته شهريا', 'To plan a month'], risk: ['الخطر', 'Risk'], perHead: ['للموظف الواحد', 'Per head'],
  eosAccrual: ['مخصص نهاية الخدمة', 'End-of-service provision'], companyCost: ['التكلفة على الشركة', 'Company cost'], packageWage: ['الأساسي والسكن', 'Basic + housing'], registered: ['المسجل في التأمينات', 'Registered with GOSI'],
  contributory: ['الأجر الخاضع', 'Contributory wage'], excluded: ['خارج التأمينات', 'Outside GOSI'], excludedPct: ['خارج التأمينات %', 'Outside GOSI %'], reconWage: ['أجر ملف التأمينات', 'Wage in GOSI file'],
  reconDiff: ['فرق الملف', 'File difference'], reconStatus: ['المطابقة', 'Reconciliation'], line: ['البند', 'Line'], label: ['الوصف', 'Description'], amount: ['المبلغ', 'Amount'], effect: ['الأثر على الصافي', 'Effect on net'],
  netChange: ['تغير الصافي', 'Net change'], driver: ['سبب التغير', 'Driver'], months: ['الأشهر', 'Months'], otAmount: ['مبلغ الإضافي', 'Overtime pay'], otHours: ['ساعات الإضافي', 'Overtime hours'], grade: ['الدرجة', 'Grade'],
  min: ['الأدنى', 'Minimum'], median: ['الوسيط', 'Median'], max: ['الأعلى', 'Maximum'], spread: ['الفارق %', 'Spread %'], gradeMedian: ['وسيط الدرجة', 'Grade median'], vsGrade: ['عن وسيط الدرجة %', 'vs grade median %'],
  outliers: ['قيم شاذة', 'Outliers'], total: ['المجموع', 'Total'], ofGross: ['من الإجمالي %', 'Of gross %'], avgAmount: ['المتوسط للفرد', 'Mean per person'], runStatus: ['حالة المسير', 'Run status'],
  noGender: ['جنس غير مسجل', 'Gender not set'], saudiShare: ['السعوديون %', 'Saudi %'], womenShare: ['النساء %', 'Women %'], joiners: ['المنضمون', 'Joiners'], leavers: ['المغادرون', 'Leavers'],
  probationEnd: ['نهاية التجربة', 'Probation end'], onboarding: ['التهيئة %', 'Onboarding %'], employed: ['ما زال يعمل', 'Still employed'], lastDay: ['آخر يوم عمل', 'Last working day'], tenureDays: ['أيام الخدمة', 'Days of service'],
  earlyExit: ['مغادرة مبكرة', 'Early exit'], tenureBand: ['شريحة الخدمة', 'Service band'], voluntary: ['طوعي', 'Voluntary'], firstYear: ['في السنة الأولى', 'First year'], noticeDays: ['أيام الإشعار', 'Notice days'],
  clearanceDone: ['إخلاء الطرف %', 'Clearance %'], lastRating: ['آخر تقدير', 'Last rating'], regretted: ['خسارة يؤسف لها', 'Regretted'], avgHeadcount: ['متوسط العدد', 'Average headcount'], other: ['غير طوعي', 'Other'],
  turnover: ['الدوران %', 'Turnover %'], voluntaryRate: ['الدوران الطوعي %', 'Voluntary %'], tenure0: ['أقل من سنة', 'Under 1 year'], tenure1: ['1-3 سنوات', '1-3 years'], tenure3: ['3-5 سنوات', '3-5 years'],
  tenure5: ['5-10 سنوات', '5-10 years'], tenure10: ['10 سنوات فأكثر', '10+ years'], avgYears: ['متوسط السنوات', 'Mean years'], medianYears: ['وسيط السنوات', 'Median years'], newShare: ['في السنة الأولى %', 'First year %'],
  noHire: ['بلا تاريخ تعيين', 'No hire date'], directs: ['المرؤوسون المباشرون', 'Direct reports'], totalReports: ['كل من تحته', 'Everyone below'], layers: ['المستويات', 'Layers'], spanBand: ['النطاق', 'Span'],
  spanFlag: ['تنبيه', 'Flag'], managerNo: ['رقم المدير', 'Manager no.'], deptHead: ['رئيس الإدارة', 'Department head'], level: ['المستوى', 'Level'], chain: ['خط التبعية', 'Reporting line'], code: ['الرمز', 'Code'],
  lastHolder: ['آخر من شغلها', 'Last holder'], vacantSince: ['شاغرة منذ', 'Vacant since'], daysVacant: ['أيام الشغور', 'Days vacant'], probationDays: ['مدة التجربة (يوم)', 'Probation (days)'], window: ['خلال', 'Within'],
  reviewTask: ['تقييم التجربة', 'Probation review'], rating: ['التقدير', 'Rating'], ratingName: ['الوصف', 'Meaning'], guideMin: ['النطاق من %', 'Range from %'], guideMax: ['النطاق إلى %', 'Range to %'],
  gap: ['الفرق عن النطاق (نقاط)', 'Gap to range (pts)'], inRange: ['ضمن النطاق', 'In range'], weightTotal: ['مجموع الأوزان', 'Weights total'], midDone: ['مراجعات منتصف العام', 'Mid-year done'], onTrack: ['على المسار', 'On track'],
  atRisk: ['معرضة للخطر', 'At risk'], offTrack: ['خارج المسار', 'Off track'], selfScored: ['قيمها الموظف', 'Self scored'], mgrScored: ['قيمها المدير', 'Manager scored'], completion: ['الإنجاز %', 'Completion %'],
  stage: ['المرحلة', 'Stage'], invited: ['الدعوات', 'Invited'], submitted: ['الإجابات', 'Answered'], responseRate: ['الاستجابة %', 'Response %'], peers: ['إجابات الزملاء', 'Peer answers'], reports: ['إجابات المرؤوسين', 'Report answers'],
  peersShown: ['تعرض نتيجة الزملاء', 'Peers shown'], reportsShown: ['تعرض نتيجة المرؤوسين', 'Reports shown'], planType: ['نوع الخطة', 'Plan'], startDate: ['البداية', 'Start'], endDate: ['النهاية', 'End'], goals: ['الأهداف', 'Goals'],
  goalsMet: ['محققة', 'Met'], goalsAtRisk: ['متعثرة', 'At risk'], checkIns: ['المتابعات', 'Check-ins'], lastCheckIn: ['آخر متابعة', 'Last check-in'], sinceCheckIn: ['أيام منذ المتابعة', 'Days since check-in'],
  approvalStep: ['المرحلة', 'Step'], approver: ['عند', 'With'], decisions: ['القرارات', 'Decisions'], avgHours: ['متوسط الساعات', 'Mean hours'], medianHours: ['وسيط الساعات', 'Median hours'], p90Hours: ['الساعات عند 90%', 'Hours at p90'],
  maxHours: ['أطول مدة (س)', 'Longest (h)'], withinSla: ['خلال 48 ساعة %', 'Within 48 h %'], waitingSince: ['ينتظر منذ', 'Waiting since'], daysWaiting: ['أيام الانتظار', 'Days waiting'], ageDays: ['عمر الطلب (يوم)', 'Age (days)'],
  approvalRate: ['نسبة الاعتماد %', 'Approval rate %'], violation: ['المخالفة', 'Violation'], cases: ['القضايا', 'Cases'], openCases: ['مفتوحة', 'Open'], decided: ['مبتوت فيها', 'Decided'], objected: ['معترض عليها', 'Objected'],
  repeat: ['متكررة', 'Repeat'], warnings: ['إنذارات', 'Warnings'], fines: ['غرامات', 'Fines'], suspensions: ['إيقاف', 'Suspensions'], dismissals: ['فصل', 'Dismissals'], avgDays: ['متوسط أيام البت', 'Mean days to decide'],
  occurred: ['تاريخ الإصابة', 'Occurred'], place: ['المكان', 'Place'], gosiDue: ['موعد إبلاغ التأمينات', 'GOSI due'], gosiReported: ['أبلغت في', 'Reported on'], delayDays: ['أيام التأخير', 'Days late'],
  timeliness: ['الالتزام بالمهلة', 'Timeliness'], daysOff: ['أيام الانقطاع', 'Days off'], assetType: ['نوع العهدة', 'Asset type'], items: ['القطع', 'Items'], value: ['القيمة', 'Value'], unacked: ['لم يؤكد استلامها', 'Not confirmed'],
  heldSince: ['في العهدة منذ', 'Held since'], heldDays: ['أيام في العهدة', 'Days held'], leaving: ['مغادر', 'Leaving'], tasksDone: ['المنجز', 'Done'], tasksTotal: ['المهام', 'Tasks'], progress: ['التقدم %', 'Progress %'],
  openManager: ['مفتوحة عند المدير', 'Open with manager'], openHr: ['مفتوحة عند الموارد البشرية', 'Open with HR'], openPayroll: ['مفتوحة عند الرواتب', 'Open with payroll'], assetsHeld: ['عهد لم تعد', 'Assets not back'],
  overdue: ['متأخر', 'Overdue'], payrollRef: ['المسير', 'Payroll run'], payslips: ['القسائم', 'Payslips'], wpsStatus: ['ملف حماية الأجور', 'WPS file'], due: ['الموعد', 'Due'], uploaded: ['رفع في', 'Uploaded'],
  daysLate: ['أيام التأخير', 'Days late'], bankRef: ['مرجع البنك', 'Bank reference'], gosiRecon: ['مطابقة التأمينات', 'GOSI check'], gosiMismatches: ['فروقات التأمينات', 'GOSI mismatches'], qiwaRecon: ['مطابقة قوى', 'Qiwa check'],
  qiwaMismatches: ['فروقات قوى', 'Qiwa mismatches'], saudiTarget: ['الهدف %', 'Target %'], needed: ['سعوديون مطلوبون', 'Saudis needed'], prevPct: ['النسبة الشهر السابق %', 'Last month %']
};
var CODES = {
  yes: ['نعم', 'Yes'], no: ['لا', 'No'], referral: ['ترشيح', 'Referral'], linkedin: ['لينكدإن', 'LinkedIn'], jadarat: ['جدارات', 'Jadarat'], bayt: ['بيت.كوم', 'Bayt'], website: ['صفحة الوظائف', 'Careers page'], agency: ['وكالة', 'Agency'], walk_in: ['حضور مباشر', 'Walk-in'], internal: ['داخلي', 'Internal'], other: ['أخرى', 'Other'],
  pending: ['بانتظار القرار', 'Pending'], closed: ['مغلق', 'Closed'], saudi: ['سعودي', 'Saudi'], non_saudi: ['غير سعودي', 'Non-Saudi'],
  review: ['للمراجعة', 'Review'], rejected: ['مرفوض', 'Rejected'], manual: ['يدوي', 'Manual'], approved: ['معتمد', 'Approved'], ok: ['سليم', 'OK'], app: ['التطبيق', 'App'],
  hr: ['الموارد البشرية', 'HR'], request: ['طلب', 'Request'], in: ['حضور', 'In'], out: ['انصراف', 'Out'], active: ['نشط', 'Active'], disabled: ['موقوف', 'Disabled'],
  new: ['جديد', 'New'], missing: ['غير موجود هذا الشهر', 'Not in this run'], changed: ['تغير', 'Changed'], same: ['دون تغيير يذكر', 'No material change'], joined: ['انضم', 'Joined'], left: ['غادر', 'Left'],
  resignation: ['استقالة', 'Resignation'], saudi: ['سعودي', 'Saudi'], non_saudi: ['غير سعودي', 'Non-Saudi'], male: ['ذكر', 'Male'], female: ['أنثى', 'Female'],
  fixed: ['محدد المدة', 'Fixed term'], indefinite: ['غير محدد المدة', 'Indefinite'], yes: ['نعم', 'Yes'], no: ['لا', 'No'], iqama: ['إقامة', 'Iqama'], passport: ['جواز سفر', 'Passport'],
  national_id: ['هوية وطنية', 'National ID'], contract_end: ['نهاية العقد', 'Contract end'], probation_end: ['نهاية فترة التجربة', 'Probation end'], legacy: ['النظام السابق', 'Legacy'],
  pending: ['قيد المراجعة', 'Pending'], cancelled: ['ملغى', 'Cancelled'], manager: ['المدير', 'Manager'], payroll: ['الرواتب', 'Payroll'], done: ['منتهي', 'Done'],
  // analytical reports (2026-10-04)
  low: ['منخفض', 'Low'], watch: ['للمتابعة', 'Watch'], concern: ['مقلق', 'Concern'], high: ['مرتفع', 'High'],
  sun: ['الأحد', 'Sunday'], mon: ['الاثنين', 'Monday'], tue: ['الثلاثاء', 'Tuesday'], wed: ['الأربعاء', 'Wednesday'], thu: ['الخميس', 'Thursday'], fri: ['الجمعة', 'Friday'], sat: ['السبت', 'Saturday'],
  early_30: ['مبكر 30 دقيقة فأكثر', '30+ min early'], early: ['مبكر', 'Early'], on_time: ['في الموعد', 'On time'], late_30: ['متأخر حتى 30 دقيقة', 'Up to 30 min late'], late_60: ['متأخر 31-60 دقيقة', '31-60 min late'],
  late_over: ['متأخر أكثر من ساعة', 'Over an hour late'], static_samples: ['مواقع متطابقة (ثابتة)', 'Frozen samples'], zero_accuracy: ['دقة صفرية', 'Zero accuracy'], stale_fix: ['موقع قديم', 'Stale fix'],
  clock_drift: ['فرق في ساعة الجهاز', 'Clock drift'], impossible_travel: ['تنقل مستحيل', 'Impossible travel'], new_device: ['جهاز جديد', 'New device'], few_samples: ['عينات قليلة', 'Few samples'],
  off_hours: ['خارج الساعات', 'Off hours'], edge: ['على حافة النطاق', 'Zone edge'], outside_checkout: ['انصراف خارج النطاق', 'Check-out outside'], no_biometric: ['بلا بصمة حيوية', 'No biometric'], laptop: ['حاسب محمول', 'Laptop'],
  password_login: ['دخول بكلمة مرور', 'Password sign-in'], mismatch: ['لا يطابق', 'Mismatch'], matched: ['مطابق', 'Matched'], not_in_upload: ['غير موجود في الملف', 'Not in the file'], no_upload: ['لم يرفع ملف', 'No file uploaded'],
  registered_differs: ['المسجل يختلف عن الباقة', 'Registered differs'], cap: ['فوق الحد الأعلى', 'Above the ceiling'], floor: ['تحت الحد الأدنى', 'Below the floor'], low_share: ['أقل من نصف الإجمالي', 'Under half of gross'],
  basic: ['الأساسي', 'Basic'], housing: ['السكن', 'Housing'], transport: ['النقل', 'Transport'], allowance: ['بدل', 'Allowance'], overtime: ['عمل إضافي', 'Overtime'], bonus: ['مكافأة', 'Bonus'], commission: ['عمولة', 'Commission'],
  other_earning: ['مستحق آخر', 'Other earning'], reimbursement: ['تعويض مصروفات', 'Reimbursement'], unpaid_leave: ['إجازة بدون راتب', 'Unpaid leave'], sick_75: ['مرضية بـ 75%', 'Sick at 75%'], sick_unpaid: ['مرضية بلا أجر', 'Sick unpaid'],
  absence: ['غياب', 'Absence'], late: ['تأخير', 'Late'], fine: ['غرامة', 'Fine'], other_deduction: ['خصم آخر', 'Other deduction'], gosi: ['التأمينات', 'GOSI'], advance: ['سلفة', 'Advance'],
  draft: ['مسودة', 'Draft'], locked: ['مقفل', 'Locked'], none: ['لا يوجد', 'None'], '<1': ['أقل من سنة', 'Under 1 year'], '1-3': ['1-3 سنوات', '1-3 years'], '3-5': ['3-5 سنوات', '3-5 years'], '5-10': ['5-10 سنوات', '5-10 years'],
  '10+': ['10 سنوات فأكثر', '10+ years'], span_1: ['مرؤوس واحد', 'One'], span_2_4: ['2-4', '2-4'], span_5_8: ['5-8', '5-8'], span_9_12: ['9-12', '9-12'], span_13: ['13 فأكثر', '13+'], wide: ['واسع', 'Wide'], narrow: ['ضيق', 'Narrow'],
  d30: ['خلال 30 يوما', 'Within 30 days'], d60: ['31-60 يوما', '31-60 days'], d90: ['61-90 يوما', '61-90 days'], later: ['بعد 90 يوما', 'After 90 days'], open: ['مفتوح', 'Open'],
  rating1: ['دون التوقعات بكثير', 'Well below expectations'], rating2: ['دون التوقعات', 'Below expectations'], rating3: ['يحقق التوقعات', 'Meets expectations'], rating4: ['يفوق التوقعات', 'Exceeds expectations'], rating5: ['استثنائي', 'Outstanding'],
  pk_none: ['لم تحدد الأهداف', 'No goals yet'], pk_goals: ['الأهداف محددة', 'Goals set'], pk_mid: ['منتصف العام', 'Mid-year done'], pk_self: ['التقييم الذاتي', 'Self review done'], pk_mgr: ['تقييم المدير', 'Manager review done'],
  idp: ['خطة تطوير', 'Development plan'], pip: ['خطة تحسين أداء', 'Improvement plan'], extended: ['ممددة', 'Extended'], closed_met: ['أغلقت: تحققت', 'Closed: met'], closed_not_met: ['أغلقت: لم تتحقق', 'Closed: not met'],
  overdue: ['تجاوز المهلة', 'Overdue'], due: ['ضمن المهلة', 'Within the limit'], reported: ['مبلغ عنها', 'Reported'], gosi_notified: ['أبلغت التأمينات', 'GOSI notified'],
  recovering: ['في فترة العلاج', 'Recovering'], closed: ['مغلقة', 'Closed'], cleared: ['مكتمل', 'Cleared'], generated: ['أنشئ الملف', 'Generated'], uploaded: ['رفع', 'Uploaded'], confirmed: ['تأكد', 'Confirmed'],
  resolved: ['أغلقت', 'Resolved'], vehicle: ['مركبة', 'Vehicle'], pos: ['جهاز نقاط بيع', 'POS device'], phone: ['جوال', 'Phone'], uniform: ['زي رسمي', 'Uniform'], cylinders: ['أسطوانات', 'Cylinders'],
  card: ['بطاقة', 'Card'], tool: ['أداة', 'Tool'], other: ['أخرى', 'Other'], termination: ['إنهاء من الشركة', 'Termination'], retirement: ['تقاعد', 'Retirement'], unrecorded: ['غير مسجل', 'Not recorded']
};
var CHECKS = {
  req_open_60: ['طلبات توظيف مفتوحة أكثر من 60 يوما: {n}', 'Requisitions open more than 60 days: {n}'], no_training: ['بلا أي تدريب مكتمل في الفترة: {n}', 'No completed training in the period: {n}'],
  cert_expiring: ['لديهم شهادات تنتهي خلال 90 يوما: {n}', 'With certificates expiring within 90 days: {n}'], non_saudi_uncovered: ['غير سعوديين بلا تأمين طبي: {n}', 'Non-Saudis with no medical cover: {n}'],
  missing_out: ['أيام بلا تسجيل انصراف: {n}', 'Days with no check-out: {n}'], punch_review: ['بصمات تنتظر المراجعة: {n}', 'Punches waiting for review: {n}'],
  opening_missing: ['بلا رصيد افتتاحي، يحتسب رصيدهم من بدء النظام فقط: {n}', 'No opening balance, counted from go-live only: {n}'],
  no_iban: ['بلا آيبان مسجل: {n}', 'No IBAN on file: {n}'], id_expired: ['هويات أو إقامات منتهية: {n}', 'Expired IDs or iqamas: {n}'], expired: ['وثائق انتهت فعلا: {n}', 'Already expired: {n}'],
  net_negative: ['صافي بالسالب: {n}', 'Negative net pay: {n}'], slip_warnings: ['قسائم عليها ملاحظات حساب: {n}', 'Payslips with calculation notes: {n}'],
  control_total: ['إجمالي التحكم: {n} قسيمة بصافي {v} ريال. طابقه مع ملف البنك قبل التحويل.', 'Control total: {n} payslips, net {v} SAR. Match it with the bank file before paying.'],
  variance_flagged: ['تغير صافيهم بأكثر من {v}% أو جدد أو غابوا عن المسير: {n}', 'Net changed by more than {v}%, new, or missing: {n}'],
  gosi_cohort_missing: ['سعوديون بلا فئة تأمينات مسجلة، تحتسب على النظام السابق: {n}', 'Saudis with no GOSI cohort, counted as legacy: {n}'],
  missing_hire_date: ['بلا تاريخ تعيين، لم يحتسبوا: {n}', 'No hire date, left out: {n}'], no_package: ['بلا راتب معتمد، لم يحتسبوا: {n}', 'No approved package, left out: {n}'],
  pay_gap: ['وظائف فيها فجوة أجر {v}% أو أكثر بين الجنسين أو الجنسيات: {n}. تحقق من الأسباب المشروعة قبل أي تعديل.', 'Positions with a gap of {v}% or more: {n}. Check the legitimate reasons before any adjustment.'],
  no_gender: ['بلا جنس مسجل، خارج مقارنة الجنس: {n}', 'No gender on file, left out of the gender comparison: {n}'],
  no_run: ['لا يوجد مسير رواتب بعد.', 'No payroll run yet.'], no_cycle: ['لا توجد دورة تقييم بعد.', 'No review cycle yet.'],
  // analytical reports (2026-10-04); counts follow a colon so Arabic never needs number agreement
  late_top_share: ['الأكثر تأخرا ({n}) يمثلون {v}% من كل دقائق التأخير.', 'The most late ({n}) account for {v}% of all minutes late.'],
  late_arrivals: ['حضور بعد فترة السماح: {n}، أي {v}% من مرات الحضور.', 'Arrivals after the grace period: {n}, {v}% of all arrivals.'],
  att_drop: ['أشهر إدارات انخفض فيها الحضور 5 نقاط أو أكثر عن الشهر السابق: {n}', 'Department-months where attendance fell 5 points or more from the month before: {n}'],
  punct_drop: ['أشهر انخفض فيها الانضباط 5 نقاط أو أكثر عن الشهر السابق: {n}', 'Months where punctuality fell 5 points or more from the month before: {n}'],
  bradford_high: ['مؤشر برادفورد فوق 200: {n}. ابدأ بحديث العودة إلى العمل وتحقق من الأسباب؛ المؤشر تنبيه لا عقوبة.', 'Bradford factor over 200: {n}. Start with a return-to-work talk and check the reasons; it is a prompt, not a penalty.'],
  weekday_spike: ['أيام من الأسبوع غيابها ضعف بقية الأيام أو أكثر: {n}', 'Days of the week with twice the absence of the others or more: {n}'],
  missing_out_repeat: ['تركوا الانصراف بلا تسجيل 3 مرات أو أكثر: {n}', 'Left without checking out 3 times or more: {n}'],
  ot_over_cap: ['تجاوزوا دليل 720 ساعة إضافية في السنة (بنسبة الفترة): {n}. راجع اللائحة التنفيذية الحالية.', 'Over the 720 overtime hours a year guide (pro rata): {n}. Check the current executive regulations.'],
  ot_estimate: ['التكلفة تقدير من البصمات بأجر الساعة وفق المادة 107، والمدفوع فعلا هو ما في المسير. السجلات: {n}', 'The cost is an estimate from the punches at the Art. 107 hourly rate; what is paid is in the payroll run. Records: {n}'],
  no_annual_leave: ['لم يأخذوا أي إجازة سنوية خلال 90 يوما أو أكثر من الفترة: {n}', 'Took no annual leave in 90 days or more of the period: {n}'],
  leave_overlap: ['إجازات يغيب خلالها 30% أو أكثر من الإدارة في يوم واحد: {n}. راجع التغطية.', 'Leave during which 30% or more of the department is away on one day: {n}. Check cover.'],
  leave_pending: ['إجازات قادمة لم تعتمد بعد: {n}', 'Upcoming leave not yet approved: {n}'],
  yearend_excess: ['سيزيد رصيدهم في 31 ديسمبر على استحقاق سنة كاملة: {n}. خطط إجازاتهم الآن (دليل للترحيل، لا حد نظامي).', 'Balance on 31 December above one year\'s entitlement: {n}. Plan their leave now (a carry-over guide, not a legal cap).'],
  small_group_hidden: ['مجموعات أقل من 3 أشخاص أخفيت مبالغها حتى لا يظهر أجر فرد: {n}', 'Groups under 3 people with amounts hidden so no one\'s pay shows: {n}'],
  no_previous_run: ['لا يوجد مسير مقفل سابق للمقارنة.', 'No earlier locked run to compare with.'],
  gosi_cap: ['أجورهم فوق الحد الأعلى للتأمينات (45,000 ريال): {n}', 'Wages above the GOSI ceiling (45,000 SAR): {n}'],
  deductions_capped: ['قسائم خفضت فيها الخصومات أو أجلت السلف عند نصف الأجر (م 92-93): {n}', 'Payslips where deductions were cut or advances deferred at half the wage (Art. 92-93): {n}'],
  band_spread: ['وظائف يزيد فيها أعلى راتب على أدناه بـ 50% أو أكثر: {n}', 'Positions where the top pay is 50% or more above the lowest: {n}'],
  no_grade: ['بلا درجة وظيفية مسجلة: {n}', 'No grade on file: {n}'],
  ytd_includes_draft: ['المجاميع تشمل المسير المختار، وهو لم يقفل بعد.', 'The totals include the chosen run, which is not locked yet.'],
  eos_accrual: ['مخصص نهاية الخدمة الشهري = الأجر ÷ 24 لأول 5 سنوات و ÷ 12 بعدها (م 84)، على أساس الأجر في الإعدادات. الموظفون: {n}', 'Monthly end-of-service provision = wage / 24 for the first 5 years and / 12 after (Art. 84), on the wage basis in settings. People: {n}'],
  recon_mismatch: ['أجر التأمينات في آخر ملف مرفوع لا يطابق أجرنا: {n}', 'The wage in the latest GOSI upload differs from ours: {n}'],
  gosi_wage_differs: ['أجر مسجل في التأمينات يختلف عن الأساسي والسكن: {n}', 'Registered GOSI wage differs from basic + housing: {n}'],
  gosi_low_share: ['أجر التأمينات أقل من نصف الإجمالي: {n}. تحقق من توزيع البدلات.', 'GOSI wage under half of gross: {n}. Check how allowances are split.'],
  no_recon: ['لم يرفع ملف التأمينات لهذا الشهر بعد، فلا مقارنة.', 'No GOSI file uploaded for this month yet, so no comparison.'],
  unknown_end: ['موقوفون بلا آخر يوم عمل، خارج الأعداد: {n}', 'Switched off with no last working day, left out: {n}'],
  prev_count: ['في الفترة السابقة بالطول نفسه: {n}', 'Same-length period before: {n}'],
  early_exit: ['غادروا خلال 90 يوما أو قبل نهاية التجربة: {n}', 'Left within 90 days or before the end of probation: {n}'],
  first_year_leavers: ['غادروا في سنتهم الأولى: {n}', 'Left in their first year: {n}'],
  regretted: ['مستقيلون بتقدير 4 أو 5 (خسارة يؤسف لها): {n}', 'Resigned with a rating of 4 or 5 (regretted loss): {n}'],
  turnover_high: ['إدارات دورانها 20% أو أكثر: {n}', 'Departments with turnover of 20% or more: {n}'],
  span_wide: ['مديرون بأكثر من 12 مرؤوسا مباشرا: {n}', 'Managers with more than 12 direct reports: {n}'],
  span_narrow: ['مديرون بمرؤوس مباشر واحد: {n}', 'Managers with a single direct report: {n}'],
  orphan_reports: ['مديرهم المسجل موقوف أو غير موجود: {n}', 'Their recorded manager is switched off or unknown: {n}'],
  no_manager: ['بلا مدير مباشر (قمة الهيكل): {n}', 'No line manager (top of the structure): {n}'],
  positions_filled: ['وظائف مشغولة: {n}', 'Positions filled: {n}'],
  vacant_long: ['شاغرة منذ أكثر من 90 يوما: {n}', 'Vacant for more than 90 days: {n}'],
  probation_too_long: ['تجربة أطول من 180 يوما (م 53): {n}', 'Probation longer than 180 days (Art. 53): {n}'],
  probation_review_open: ['تنتهي تجربتهم خلال 30 يوما ولم يكتمل تقييمها: {n}', 'Probation ends within 30 days and its review is not done: {n}'],
  curve_out: ['تقديرات خارج النطاق الصحي للتوزيع: {n}. راجعها في المعايرة.', 'Ratings outside the healthy range: {n}. Review them in calibration.'],
  curve_few: ['يحكم على التوزيع بعد 5 تقييمات على الأقل. المقيمون الآن: {n}', 'The spread is judged once at least 5 are rated. Rated now: {n}'],
  not_rated: ['بلا تقييم في هذه الدورة: {n}', 'Not rated in this cycle: {n}'],
  kpi_weights: ['مجموع أوزان أهدافهم لا يساوي 100: {n}', 'KPI weights do not add up to 100: {n}'],
  no_kpis: ['بلا أهداف في هذه الدورة: {n}', 'No KPIs in this cycle: {n}'],
  fb_hidden: ['مجموعة زملاء أو مرؤوسين لديها أقل من 3 إجابات فلا تعرض: {n}', 'A peer or report group with fewer than 3 answers, so not shown: {n}'],
  plan_overdue: ['خطط تجاوزت تاريخ نهايتها دون نتيجة: {n}', 'Plans past their end date with no outcome: {n}'],
  plan_no_checkin: ['خطط بلا متابعة منذ أكثر من 14 يوما: {n}', 'Plans with no check-in for more than 14 days: {n}'],
  plan_not_acked: ['خطط لم يطلع عليها الموظف بعد: {n}', 'Plans the employee has not acknowledged: {n}'],
  sla_breach: ['قرارات استغرقت أكثر من 48 ساعة: {n}', 'Decisions that took more than 48 hours: {n}'],
  waiting_over_7: ['طلبات تنتظر أكثر من 7 أيام: {n}', 'Waiting more than 7 days: {n}'],
  waiting_over_3: ['طلبات تنتظر من 3 إلى 7 أيام: {n}', 'Waiting 3 to 7 days: {n}'],
  case_open_long: ['قضايا مفتوحة منذ أكثر من 30 يوما من توجيه المخالفة: {n}', 'Cases open more than 30 days after the charge: {n}'],
  gosi_overdue: ['إصابات لم تبلغ بها التأمينات وتجاوزت مهلة 3 أيام: {n}', 'Injuries not reported to GOSI, past the 3-day limit: {n}'],
  gosi_late: ['إصابات أبلغ بها بعد المهلة: {n}', 'Injuries reported after the limit: {n}'],
  leaver_holds_assets: ['مغادرون ما زالوا يحملون عهدا: {n}', 'Leavers still holding company assets: {n}'],
  custody_unacked: ['عهد لم يؤكد الموظف استلامها: {n}', 'Assets whose receipt is not confirmed: {n}'],
  clearance_overdue: ['إخلاءات طرف مفتوحة بعد آخر يوم عمل: {n}', 'Clearances still open after the last day: {n}'],
  clearance_assets: ['إخلاءات طرف تنتظر إعادة عهد: {n}', 'Clearances waiting for assets to come back: {n}'],
  wps_overdue: ['مسيرات مقفلة فات موعد رفع ملف حماية الأجور لها: {n}', 'Locked runs past the WPS due date with no upload: {n}'],
  recon_open: ['مطابقات أجور مفتوحة (تمنع اعتماد المسير): {n}', 'Open wage reconciliations (they block payroll approval): {n}'],
  run_not_locked: ['أشهر لم يقفل مسيرها بعد: {n}', 'Months whose run is not locked yet: {n}'],
  saudi_vs_target: ['سعوديون بوزن كامل يلزم إضافتهم لبلوغ الهدف: {n}. النسبة المرجحة للشركة الآن {v}%.', 'Full-weight Saudis still needed to reach the target: {n}. The company weighted rate is {v}% now.']
};
var DAYCODE = { P: ['حاضر', 'Present'], L: ['متأخر', 'Late'], A: ['غائب', 'Absent'], V: ['إجازة', 'Leave'], H: ['عطلة رسمية', 'Holiday'], O: ['راحة', 'Day off'], M: ['بلا انصراف', 'No check-out'] };
var LEAVE_KEYS = ['annual', 'sick', 'marriage', 'paternity', 'bereavement', 'bereavement_sibling', 'maternity', 'hajj', 'exam', 'iddah', 'unpaid'];

Object.assign(T.ar, {
  rpTitle:'التقارير', rpCatalog:'مكتبة التقارير', rpLog:'سجل التصدير', rpVerify:'التحقق من تقرير', rpLead:'كل تقرير يحسب على الخادم بصلاحياتك. كل ملف يصدر يأخذ رقما وبصمة رقمية يمكن التحقق منهما لاحقا.',
  rpFrom:'من', rpTo:'إلى', rpMonth:'الشهر', rpAsOf:'في تاريخ', rpDepts:'الإدارات', rpAllDepts:'كل الإدارات', rpSub:'مع الإدارات الفرعية', rpEmps:'الموظفون', rpAllEmps:'كل الموظفين',
  rpNat:'الجنسية', rpStatus:'حالة الموظف', rpActive:'النشطون', rpDisabledOnly:'الموقوفون', rpAll:'الكل', rpDays:'خلال (يوما)', rpRun:'المسير', rpCycle:'الدورة', rpThreshold:'حد الفرق %',
  rpLeaveType:'نوع الإجازة', rpReqType:'نوع الطلب', rpReqStatus:'حالة الطلب', rpAction:'الإجراء', rpAny:'الكل', rpPick:'اختر', rpFind:'بحث بالاسم أو الرقم',
  rpToday:'اليوم', rpThisMonth:'هذا الشهر', rpLastMonth:'الشهر الماضي', rpLast7:'آخر 7 أيام', rpLast30:'آخر 30 يوما', rpQuarter:'هذا الربع', rpYear:'آخر 12 شهرا',
  rpShow:'عرض التقرير', rpBack:'كل التقارير', rpExcel:'Excel', rpCsv:'CSV', rpPdf:'PDF / طباعة', rpSaveView:'حفظ العرض', rpViewName:'اسم العرض', rpViews:'عروضي المحفوظة',
  rpColumns:'الأعمدة', rpColsHint:'الملف المصدر يحمل الأعمدة الظاهرة فقط، والبصمة تحسب عليها.', rpGroup:'تجميع حسب', rpNoGroup:'بلا تجميع', rpSearch:'بحث في النتائج',
  rpTotal:'الإجمالي', rpRows:'السجلات', rpShown:'يظهر', rpOf:'من', rpPrev:'السابق', rpNext:'التالي', rpChecks:'فحص البيانات', rpAllGood:'لا ملاحظات على البيانات.',
  rpTeamOnly:'يعرض فريقك فقط', rpRunning:'جار حساب التقرير', rpExporting:'جار ترقيم التقرير وتجهيز الملف', rpExported:'صدر التقرير برقم', rpInfo:'معلومات التقرير',
  rpRef:'رقم التقرير', rpHash:'البصمة الرقمية (SHA-256)', rpFilters:'عوامل التصفية', rpBy:'أعده', rpAt:'وقت الإعداد', rpHijri:'الموافق', rpConf:'سري، للاستخدام الداخلي',
  rpVerifyHow:'للتحقق: التقارير ← التحقق من تقرير، وأدخل الرقم والبصمة أو امسح الرمز.', rpPage:'صفحة', rpNoRows:'لا توجد سجلات بهذه التصفية.',
  rpReviewed:'روجع', rpNotReviewed:'لم يراجع', rpDoReview:'اعتماد المراجعة', rpReviewNote:'ملاحظة المراجعة (اختيارية)', rpReviewDone:'سجلت المراجعة.',
  rpVerifyLead:'أدخل رقم التقرير المطبوع (RPT-...) وبصمته، أو أول 12 حرفا منها على الأقل.', rpVerifyBtn:'تحقق', rpNotFound:'لا يوجد تقرير بهذا الرقم في السجل.',
  rpMatch:'البصمة مطابقة: هذه النسخة هي نفس التقرير الذي صدر.', rpNoMatch:'البصمة لا تطابق: النسخة التي بين يديك معدلة أو ليست هذا التقرير.', rpNoHash:'لم تدخل بصمة، تحققنا من وجود الرقم فقط.',
  rpSame:'لو أعيد التقرير اليوم لخرج بنفس البيانات.', rpChangedSince:'تغيرت البيانات منذ التصدير (تصحيح أو إضافة لاحقة). أصدر نسخة جديدة إن احتجت الأرقام الحالية.', rpCannotRerun:'لا تملك صلاحية إعادة تشغيل هذا التقرير للمقارنة.',
  rpFormat:'الصيغة', rpMaker:'المصدر', rpReviewer:'المراجع', rpExports30:'تقارير صدرت (30 يوما)', rpReviewRate:'نسبة المراجعة', rpAwaiting:'تنتظر مراجعة', rpByFormat:'حسب الصيغة', rpByReport:'الأكثر إصدارا',
  rpMoney:'رواتب', rpCostOnly:'مجاميع فقط', rpLegend:'الرموز', rpCount:'العدد', rpInfoSheet:'معلومات', rpDataSheet:'التقرير', rpChecksSheet:'فحص البيانات', rpNone:'-',
  rpCleared:'مسح', rpSaved:'حفظ العرض.', rpDelView:'حذف', rpDetails:'التفاصيل', rpChart:'الصورة العامة'
});
Object.assign(T.en, {
  rpTitle:'Reports', rpCatalog:'Report library', rpLog:'Export log', rpVerify:'Verify a report', rpLead:'Every report is computed on the server with your access. Every export gets a number and a fingerprint that can be checked later.',
  rpFrom:'From', rpTo:'To', rpMonth:'Month', rpAsOf:'As of', rpDepts:'Departments', rpAllDepts:'All departments', rpSub:'Include sub-departments', rpEmps:'People', rpAllEmps:'Everyone',
  rpNat:'Nationality', rpStatus:'Employee status', rpActive:'Active', rpDisabledOnly:'Disabled', rpAll:'All', rpDays:'Within (days)', rpRun:'Payroll run', rpCycle:'Cycle', rpThreshold:'Change threshold %',
  rpLeaveType:'Leave type', rpReqType:'Request type', rpReqStatus:'Request status', rpAction:'Action', rpAny:'Any', rpPick:'Choose', rpFind:'Search name or number',
  rpToday:'Today', rpThisMonth:'This month', rpLastMonth:'Last month', rpLast7:'Last 7 days', rpLast30:'Last 30 days', rpQuarter:'This quarter', rpYear:'Last 12 months',
  rpShow:'Run report', rpBack:'All reports', rpExcel:'Excel', rpCsv:'CSV', rpPdf:'PDF / print', rpSaveView:'Save view', rpViewName:'View name', rpViews:'My saved views',
  rpColumns:'Columns', rpColsHint:'Exports carry the visible columns only; the fingerprint covers them.', rpGroup:'Group by', rpNoGroup:'No grouping', rpSearch:'Search results',
  rpTotal:'Total', rpRows:'Records', rpShown:'Showing', rpOf:'of', rpPrev:'Previous', rpNext:'Next', rpChecks:'Data checks', rpAllGood:'No data issues.',
  rpTeamOnly:'Your team only', rpRunning:'Computing the report', rpExporting:'Numbering the report and preparing the file', rpExported:'Exported as', rpInfo:'Report information',
  rpRef:'Report number', rpHash:'Fingerprint (SHA-256)', rpFilters:'Filters', rpBy:'Prepared by', rpAt:'Prepared at', rpHijri:'Hijri', rpConf:'Confidential, internal use',
  rpVerifyHow:'To verify: Reports > Verify a report, enter the number and fingerprint or scan the code.', rpPage:'Page', rpNoRows:'No records match these filters.',
  rpReviewed:'Reviewed', rpNotReviewed:'Not reviewed', rpDoReview:'Mark reviewed', rpReviewNote:'Review note (optional)', rpReviewDone:'Review recorded.',
  rpVerifyLead:'Enter the printed report number (RPT-...) and its fingerprint, or at least its first 12 characters.', rpVerifyBtn:'Verify', rpNotFound:'No report with this number in the log.',
  rpMatch:'Fingerprint matches: this copy is the report that was exported.', rpNoMatch:'Fingerprint does not match: this copy was altered or is a different report.', rpNoHash:'No fingerprint entered; only the number was checked.',
  rpSame:'Run again today, the report gives the same data.', rpChangedSince:'The data changed after the export (a later correction or addition). Export again if you need current figures.', rpCannotRerun:'You cannot re-run this report to compare.',
  rpFormat:'Format', rpMaker:'Exported by', rpReviewer:'Reviewer', rpExports30:'Exports (30 days)', rpReviewRate:'Reviewed', rpAwaiting:'Awaiting review', rpByFormat:'By format', rpByReport:'Most exported',
  rpMoney:'Payroll', rpCostOnly:'Totals only', rpLegend:'Codes', rpCount:'Count', rpInfoSheet:'Info', rpDataSheet:'Report', rpChecksSheet:'Checks', rpNone:'-',
  rpCleared:'Clear', rpSaved:'View saved.', rpDelView:'Delete', rpDetails:'Details', rpChart:'Overview',
  e_range_too_long:'That period is too long for this report. Choose a shorter one.', e_bad_range:'The start date is after the end date.'
});
T.ar.e_range_too_long = 'الفترة أطول من المسموح لهذا التقرير. اختر فترة أقصر.'; T.ar.e_bad_range = 'تاريخ البداية بعد تاريخ النهاية.';

var css = '' +
'@keyframes rpSpin{to{transform:rotate(360deg)}}' +
'.rp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}' +
'.rp-tabs button,.rp-chip-btn{height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:13.5px;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px}' +
'.rp-tabs button[aria-pressed="true"]{background:var(--pine);color:var(--cream);border-color:var(--pine)}' +
'.rp-lead{color:var(--ink-2);font-size:13px;margin:-4px 0 16px;max-width:70ch}' +
'.rp-lib{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}' +
'.rp-grp{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:14px 16px}' +
'.rp-grp h3{margin:0 0 8px;font-size:15px;font-weight:600;display:flex;gap:8px;align-items:center}.rp-grp h3 i{font-size:20px;color:var(--brand)}' +
'.rp-item{display:grid;grid-template-columns:1fr auto;gap:2px 10px;width:100%;text-align:start;background:none;border:0;border-top:1px solid var(--line);padding:11px 2px;color:var(--ink);cursor:pointer}' +
'.rp-item:first-of-type{border-top:0}.rp-item b{font-weight:500;font-size:14px}.rp-item small{grid-column:1;color:var(--ink-2);font-size:12.5px;line-height:1.5}' +
'.rp-item .ar{grid-row:1 / span 2;grid-column:2;align-self:center;color:var(--ink-2)}.rp-item:hover b{color:var(--brand)}.rp-item:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:8px}' +
'.rp-tag{font-size:11px;padding:1px 7px;border-radius:999px;background:#EDEAE0;color:var(--ink-2);margin-inline-start:6px;vertical-align:middle;font-weight:400}' +
'.rp-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}.rp-head .iconbtn{flex:none;width:40px;height:40px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);display:grid;place-items:center;font-size:18px}.rp-head .iconbtn:hover{background:#EDEAE0}'+
'.rp-head h2{margin:0;font-size:20px}.rp-head p{margin:2px 0 0;color:var(--ink-2);font-size:13px}' +
'.rp-filt{background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:14px 16px;margin-bottom:12px}' +
'.rp-fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px 12px;align-items:end}' +
'.rp-fgrid .field{margin:0}.rp-fgrid .field label{font-size:12.5px}.rp-fgrid input,.rp-fgrid select{height:40px}' +
'.rp-presets{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.rp-presets button{height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--line);background:var(--paper);font-size:12.5px;color:var(--ink-2)}' +
'.rp-presets button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:#fff}' +
'.rp-multi{position:relative}.rp-multi > summary{list-style:none;height:40px;border:1px solid var(--line);border-radius:var(--r-s);background:var(--card);padding:0 12px;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;white-space:nowrap;overflow:hidden}' +
'.rp-multi > summary::-webkit-details-marker{display:none}.rp-multi > summary span{flex:1;overflow:hidden;text-overflow:ellipsis}' +
'.rp-multi .pop{position:absolute;z-index:30;inset-inline-start:0;top:44px;min-width:260px;max-width:92vw;max-height:320px;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:var(--r-s);box-shadow:0 12px 30px rgba(0,0,0,.14);padding:8px}' +
'.rp-multi .pop label{display:flex;gap:8px;align-items:center;padding:6px 6px;border-radius:6px;font-size:13.5px;cursor:pointer}.rp-multi .pop label:hover{background:var(--paper)}' +
'.rp-multi .pop input[type=search]{width:100%;height:36px;margin-bottom:6px}' +
'.rp-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}.rp-actions .sp{flex:1}' +
'.rp-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.rp-chips .chip button{border:0;background:none;padding:0 0 0 2px;color:inherit;cursor:pointer;font-size:14px;line-height:1}' +
'.rp-checks{display:grid;gap:6px;margin:0 0 12px;padding:0;list-style:none}' +
'.rp-checks li{display:flex;gap:8px;align-items:flex-start;padding:9px 12px;border-radius:var(--r-s);font-size:13.5px;border:1px solid var(--line);background:var(--card)}' +
'.rp-checks li i{font-size:18px;flex:none;margin-top:1px}.rp-checks .error{border-color:#E7B2A6;background:#FBEFEC}.rp-checks .error i{color:#B3261E}' +
'.rp-checks .warn{border-color:#EBD2A2;background:#FCF5E6}.rp-checks .warn i{color:#8A5A00}.rp-checks .info i{color:#2a78d6}.rp-checks .good i{color:#2E7D4F}' +
'.rp-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 10px}.rp-bar input[type=search]{height:38px;min-width:200px;flex:1;max-width:320px}.rp-bar select{height:38px}' +
'.rp-bar .sp{flex:1}.rp-bar .btn-sm{height:38px}' +
'.rp-tw{border:1px solid var(--line);border-radius:var(--r-m);overflow:auto;max-height:70vh;background:var(--card)}' +
'.rp-t{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}' +
'.rp-t th{position:sticky;top:0;z-index:2;background:#F1EEE6;text-align:start;font-weight:600;padding:0;border-bottom:1px solid var(--line);white-space:nowrap}' +
'.rp-t th button{all:unset;display:flex;gap:4px;align-items:center;padding:9px 10px;cursor:pointer;width:100%;box-sizing:border-box}.rp-t th button:focus-visible{outline:2px solid var(--brand)}' +
'.rp-t th .ar{opacity:.35;font-size:11px}.rp-t th[aria-sort] .ar{opacity:1;color:var(--brand)}' +
'.rp-t td{padding:8px 10px;border-bottom:1px solid #EEEBE3;white-space:nowrap;vertical-align:top}.rp-t td.wrap{white-space:normal;min-width:180px;max-width:360px}' +
'.rp-t td.n,.rp-t th.n button{text-align:end;justify-content:flex-end;font-variant-numeric:tabular-nums}.rp-t td.id{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}' +
'.rp-t tbody tr:hover td{background:#FAF8F3}.rp-t td.neg{color:#B3261E}' +
'.rp-t tfoot td{position:sticky;bottom:0;background:#F1EEE6;font-weight:600;border-top:1px solid var(--line);border-bottom:0}' +
'.rp-t tr.gh td{background:#F7F5EF;font-weight:600;cursor:pointer}.rp-t tr.gh td:first-child{white-space:nowrap}.rp-t tr.gh .tw{display:inline-block;width:16px;transition:transform .15s}' +
'.rp-t tr.gh[aria-expanded="true"] .tw{transform:rotate(90deg)}[dir="rtl"] .rp-t tr.gh .tw{transform:scaleX(-1)}[dir="rtl"] .rp-t tr.gh[aria-expanded="true"] .tw{transform:rotate(90deg)}' +
'.rp-t .dc{text-align:center;padding:8px 4px;min-width:26px;font-weight:600;font-size:12px}' +
'.dc-P{background:#E6F2EA}.dc-L{background:#FBEFD7}.dc-A{background:#F8E1DB}.dc-V{background:#E3EEFA}.dc-H,.dc-O{background:#F1EFE9;color:#6B786D}.dc-M{background:#F3E6F4}' +
'.rp-t th.wk{background:#E9E6DC}' +
'.rp-legend{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:var(--ink-2);margin:8px 0}.rp-legend b{display:inline-block;min-width:20px;text-align:center;border-radius:4px;margin-inline-end:4px;padding:1px 3px;color:var(--ink)}' +
'.rp-pg{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:10px;font-size:13px;color:var(--ink-2)}' +
'.rp-colpop label{white-space:nowrap}' +
'.rp-verify{max-width:560px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-m);padding:16px}' +
'.rp-res{margin-top:14px;display:grid;gap:8px}' +
'.rp-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:13px;margin:0}.rp-kv dt{color:var(--ink-2)}.rp-kv dd{margin:0;word-break:break-all}' +
'.rp-log .rev{display:inline-flex;align-items:center;gap:4px;font-size:12.5px}.rp-log .rev.ok{color:#006300}.rp-log .rev.no{color:#8A5A00}' +
'@media (min-width:1024px){.rp-lib{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
'@media (max-width:640px){.rp-fgrid{grid-template-columns:1fr 1fr}.rp-bar input[type=search]{min-width:0;max-width:none;width:100%}}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

var L = function(pair){ return pair ? (S.lang === 'en' ? pair[1] : pair[0]) : ''; };
function rpName(id){ var r = RPT[id]; return r ? (S.lang === 'en' ? r[1] : r[0]) : id; }
function rpDesc(id){ var r = RPT[id]; return r ? (S.lang === 'en' ? r[3] : r[2]) : ''; }
function colLabel(c){ if (/^d\d+$/.test(c.key)) return String(c.day); return L(COLS[c.key]) || c.key; }
function codeText(key, v){
  if (v == null || v === '') return '';
  var s = String(v);
  if (key === 'type' && CODES[s] && (s === 'in' || s === 'out')) return L(CODES[s]);
  if (key === 'type' || key === 'reqType') { var r = T[S.lang]['rt_' + s]; if (r) return r; }
  if (key === 'leaveType' || key === 'subtype') { var l = T[S.lang]['lt_' + s]; if (l) return l; }
  if (key === 'step') { var p = T[S.lang]['rstep_' + s]; if (p) return p; }
  if (key === 'status') { var q = T[S.lang]['rs_' + s] || T[S.lang]['st_' + s]; if (q && !CODES[s]) return q; }
  if (CODES[s]) return L(CODES[s]);
  return T[S.lang]['st_' + s] || T[S.lang]['rt_' + s] || T[S.lang]['lt_' + s] || s;
}
function isNum(c){ return ['hours', 'min', 'int', 'num', 'days', 'pct', 'money'].indexOf(c.type) >= 0; }
function nf(v, d){ return Number(v).toLocaleString(LOCALE(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
function riyadhDT(iso){ var d = new Date(iso); if (isNaN(d)) return String(iso || ''); var p = new Date(d.getTime() + 180 * 60000).toISOString(); return p.slice(0, 10) + ' ' + p.slice(11, 16); }
/** Plain text of a cell for the screen, search, CSV and PDF. */
function cellText(c, v){
  if (v == null || v === '') return '';
  switch (c.type) {
    case 'money': return nf(v, 2);
    case 'pct': return nf(v, 1) + '%';
    case 'hours': case 'days': return nf(v, Number(v) % 1 ? (c.type === 'days' ? 2 : 1) : 0);
    case 'num': return nf(v, 2);
    case 'min': case 'int': return nf(v, 0);
    case 'datetime': return riyadhDT(v);
    case 'code': case 'status': return codeText(c.key, v);
    default: return String(v);
  }
}
function hijri(d){ try { return d.toLocaleDateString((S.lang === 'en' ? 'en' : 'ar-SA') + '-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
function greg(d){ return d.toLocaleDateString(LOCALE(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' }) + ' ' + d.toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }); }

// ---------------- state ----------------
var R = S.rp = S.rp || { view: 'catalog', id: null, params: {}, res: null, sort: null, dir: 1, q: '', group: '', hidden: {}, page: 0, open: {}, preset: 'month' };
var CAT = null;
function views(){ try { return JSON.parse(localStorage.getItem('bgatt.rpViews') || '{}') || {}; } catch (e) { return {}; } }
function saveViews(v){ try { localStorage.setItem('bgatt.rpViews', JSON.stringify(v)); } catch (e) {} }

function section(body){
  var can = roles();
  var tabs = [['catalog', 'squares-four', t('rpCatalog')]];
  if (can.hr || can.payroll) tabs.push(['log', 'list-checks', t('rpLog')]);
  if (can.hr || can.payroll || can.executive) tabs.push(['verify', 'seal-check', t('rpVerify')]);
  if (S.rpJump) { R.view = S.rpJump; S.rpJump = null; }
  if (R.view === 'run' && !R.id) R.view = 'catalog';
  var top = R.view === 'run' ? 'catalog' : R.view;
  body.innerHTML = '<div class="db rp"><div class="hr-h"><h2>' + t('rpTitle') + '</h2></div>' +
    (tabs.length > 1 ? '<div class="rp-tabs" role="group">' + tabs.map(function(x){ return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (top === x[0]) + '">' + ph(x[1]) + x[2] + '</button>'; }).join('') + '</div>' : '') +
    '<div id="rpBody"></div></div>';
  $$('.rp-tabs [data-v]', body).forEach(function(b){ b.onclick = function(){ R.view = b.dataset.v; section(body); }; });
  var el = $('#rpBody', body);
  if (R.view === 'log') return logView(el);
  if (R.view === 'verify') return verifyView(el);
  catalogThen(el, function(){ if (R.view === 'run') runView(el); else catalogView(el); });
}
function roles(){ return S.fileRoles || { hr: isHr(), payroll: false, executive: false, manager: false }; }

function catalogThen(el, fn){
  if (CAT) return fn();
  var stop = progressCard(el, t('rpTitle'));
  apiFresh('reportCatalog', {}, function(r){
    stop();
    if (!r.ok) { el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
    CAT = r; fn();
  });
}

// ---------------- catalogue ----------------
function catalogView(el){
  var by = {}; CAT.reports.forEach(function(r){ (by[r.group] = by[r.group] || []).push(r); });
  if (!CAT.reports.length) { el.innerHTML = '<div class="empty">' + ph('file-lock') + '<b>' + errText('forbidden') + '</b></div>'; return; }
  el.innerHTML = '<p class="rp-lead">' + t('rpLead') + (CAT.teamOnly ? ' <span class="chip">' + ph('users') + t('rpTeamOnly') + '</span>' : '') + '</p><div class="rp-lib">' +
    GROUPS.filter(function(g){ return by[g[0]]; }).map(function(g){
      return '<section class="rp-grp"><h3>' + ph(g[1]) + (S.lang === 'en' ? g[3] : g[2]) + '</h3>' + by[g[0]].map(function(r){
        var tag = r.access === 'money' ? '<span class="rp-tag">' + ph('lock-simple') + ' ' + t('rpMoney') + '</span>' : r.access === 'cost' ? '<span class="rp-tag">' + t('rpCostOnly') + '</span>' : '';
        return '<button type="button" class="rp-item" data-id="' + r.id + '"><b>' + esc(rpName(r.id)) + tag + '</b><small>' + esc(rpDesc(r.id)) + '</small><span class="ar">' + (S.lang === 'ar' ? ph('caret-left') : ph('caret-right')) + '</span></button>';
      }).join('') + '</section>';
    }).join('') + '</div>';
  $$('.rp-item', el).forEach(function(b){ b.onclick = function(){ openReport(b.dataset.id, el); }; });
}
function def(id){ return CAT.reports.filter(function(r){ return r.id === id; })[0]; }
function openReport(id, el, params){
  R.view = 'run'; R.id = id; R.res = null; R.sort = null; R.q = ''; R.group = ''; R.page = 0; R.open = {}; R.hidden = {};
  R.params = params || defaults(def(id)); R.preset = params ? '' : (def(id).params.indexOf('range365') >= 0 ? 'year' : 'month');
  runView(el, true);
}

// ---------------- parameters ----------------
function iso(d){ return d.toISOString().slice(0, 10); }
function presetRange(k){
  var td = riyadhToday(), d = new Date(td + 'T00:00:00Z'), y = d.getUTCFullYear(), m = d.getUTCMonth();
  if (k === 'today') return [td, td];
  if (k === 'last') return [iso(new Date(Date.UTC(y, m - 1, 1))), iso(new Date(Date.UTC(y, m, 0)))];
  if (k === '7' || k === '30') return [iso(new Date(d.getTime() - (Number(k) - 1) * 864e5)), td];
  if (k === 'quarter') return [iso(new Date(Date.UTC(y, m - m % 3, 1))), td];
  if (k === 'year') return [iso(new Date(Date.UTC(y - 1, m, d.getUTCDate() + 1))), td];
  return [td.slice(0, 8) + '01', td];
}
function defaults(d){
  var p = {}, has = function(k){ return d.params.indexOf(k) >= 0; };
  if (has('range') || has('range31')) { var r = presetRange('month'); p.from = r[0]; p.to = r[1]; }
  if (has('range365')) { var y = presetRange('year'); p.from = y[0]; p.to = y[1]; }
  if (has('month')) p.month = riyadhToday().slice(0, 7);
  if (has('asOf')) p.asOf = riyadhToday();
  if (has('depts')) { p.depts = []; p.subDepts = true; }
  if (has('emps')) p.emps = [];
  if (has('days')) p.days = 60;
  if (has('threshold')) p.threshold = 5;
  if (has('run') && CAT.runs[0]) p.run = CAT.runs[0].id;
  if (has('cycle') && CAT.cycles[0]) p.cycle = CAT.cycles[0].id;
  return p;
}
function deptTree(){
  var kids = {}, out = [];
  CAT.depts.forEach(function(d){ (kids[d.parentId || ''] = kids[d.parentId || ''] || []).push(d); });
  (function walk(pid, depth){ (kids[pid] || []).sort(function(a, b){ return String(a.name).localeCompare(String(b.name), 'ar'); }).forEach(function(d){ out.push({ id: d.id, name: d.name, depth: depth }); if (depth < 8) walk(d.id, depth + 1); }); })('', 0);
  return out;
}
function nameOfDept(id){ var d = CAT.depts.filter(function(x){ return x.id === id; })[0]; return d ? d.name : id; }
function nameOfEmp(id){ var e = CAT.emps.filter(function(x){ return x.id === id; })[0]; return e ? e.name : id; }
function selectHtml(name, label, list, cur){ return '<div class="field"><label>' + label + '</label><select name="' + name + '">' + list.map(function(x){ return '<option value="' + esc(x[0]) + '"' + (String(cur == null ? '' : cur) === String(x[0]) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></div>'; }
function inputHtml(name, label, type, val, extra){ return '<div class="field"><label>' + label + '</label><input name="' + name + '" type="' + type + '" value="' + esc(val == null ? '' : val) + '"' + (extra || '') + '></div>'; }

function filtersHtml(d){
  var p = R.params, h = '', has = function(k){ return d.params.indexOf(k) >= 0; };
  var ranged = has('range') || has('range31') || has('range365');
  var pre = ranged ? '<div class="rp-presets" role="group">' + (has('range365') ? [['quarter', 'rpQuarter'], ['year', 'rpYear']] : [['today', 'rpToday'], ['7', 'rpLast7'], ['month', 'rpThisMonth'], ['last', 'rpLastMonth'], ['30', 'rpLast30']].concat(has('range31') ? [] : [['quarter', 'rpQuarter']]))
    .map(function(x){ return '<button type="button" data-pre="' + x[0] + '" aria-pressed="' + (R.preset === x[0]) + '">' + t(x[1]) + '</button>'; }).join('') + '</div>' : '';
  if (ranged) h += inputHtml('from', t('rpFrom'), 'date', p.from) + inputHtml('to', t('rpTo'), 'date', p.to);
  if (has('month')) h += inputHtml('month', t('rpMonth'), 'month', p.month);
  if (has('asOf')) h += inputHtml('asOf', t('rpAsOf'), 'date', p.asOf);
  if (has('run')) h += selectHtml('run', t('rpRun'), CAT.runs.map(function(r){ return [r.id, r.ref + ' · ' + r.month + ' · ' + (T[S.lang]['pr_' + r.status] || r.status)]; }), p.run);
  if (has('cycle')) h += selectHtml('cycle', t('rpCycle'), CAT.cycles.map(function(c){ return [c.id, (S.lang === 'en' && c.nameEn ? c.nameEn : c.nameAr) + ' · ' + c.ref]; }), p.cycle);
  if (has('depts')) {
    var sel = p.depts || [];
    h += '<div class="field"><label>' + t('rpDepts') + '</label><details class="rp-multi" data-m="depts"><summary><span>' + (sel.length ? esc(sel.map(nameOfDept).join('، ')) : t('rpAllDepts')) + '</span>' + ph('caret-down') + '</summary><div class="pop">' +
      deptTree().map(function(x){ return '<label style="padding-inline-start:' + (6 + x.depth * 16) + 'px"><input type="checkbox" value="' + x.id + '"' + (sel.indexOf(x.id) >= 0 ? ' checked' : '') + '>' + esc(x.name) + '</label>'; }).join('') +
      '<label style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px"><input type="checkbox" name="subDepts"' + (p.subDepts !== false ? ' checked' : '') + '>' + t('rpSub') + '</label></div></details></div>';
  }
  if (has('emps')) {
    var es = p.emps || [];
    h += '<div class="field"><label>' + t('rpEmps') + '</label><details class="rp-multi" data-m="emps"><summary><span>' + (es.length ? esc(es.length > 2 ? plural(es.length, 'people') : es.map(nameOfEmp).join('، ')) : t('rpAllEmps')) + '</span>' + ph('caret-down') + '</summary><div class="pop"><input type="search" placeholder="' + t('rpFind') + '">' +
      CAT.emps.filter(function(e){ return e.status === 'active' || es.indexOf(e.id) >= 0; }).map(function(e){ return '<label data-s="' + esc((e.name + ' ' + e.empNo).toLowerCase()) + '"><input type="checkbox" value="' + e.id + '"' + (es.indexOf(e.id) >= 0 ? ' checked' : '') + '>' + esc(e.name) + ' <small style="color:var(--ink-2)">' + esc(e.empNo) + '</small></label>'; }).join('') + '</div></details></div>';
  }
  if (has('nationality')) h += selectHtml('nationality', t('rpNat'), [['', t('rpAll')], ['saudi', L(CODES.saudi)], ['non_saudi', L(CODES.non_saudi)]], p.nationality);
  if (has('status')) h += selectHtml('status', t('rpStatus'), [['active', t('rpActive')], ['disabled', t('rpDisabledOnly')], ['all', t('rpAll')]], p.status || 'active');
  if (has('days')) h += inputHtml('days', t('rpDays'), 'number', p.days, ' min="1" max="365"');
  if (has('threshold')) h += inputHtml('threshold', t('rpThreshold'), 'number', p.threshold, ' min="0" max="100" step="0.5"');
  if (has('leaveType')) h += selectHtml('leaveType', t('rpLeaveType'), [['', t('rpAny')]].concat(LEAVE_KEYS.map(function(k){ return [k, t('lt_' + k)]; })), p.leaveType);
  if (has('reqType')) h += selectHtml('reqType', t('rpReqType'), [['', t('rpAny')]].concat(['leave', 'letter', 'advance', 'correction', 'data_change', 'resignation'].map(function(k){ return [k, t('rt_' + k)]; })), p.reqType);
  if (has('reqStatus')) h += selectHtml('reqStatus', t('rpReqStatus'), [['', t('rpAny')]].concat(['pending', 'approved', 'rejected', 'cancelled'].map(function(k){ return [k, t('rs_' + k)]; })), p.reqStatus);
  if (has('auditAction')) h += inputHtml('auditAction', t('rpAction'), 'text', p.auditAction, ' dir="ltr" placeholder="salary_view"');
  var vs = views()[R.id] || [];
  return '<form class="rp-filt" id="rpF">' + pre + '<div class="rp-fgrid">' + h + '</div>' +
    '<div class="rp-actions"><button type="submit" class="btn btn-dark btn-sm">' + ph('play') + t('rpShow') + '</button>' +
    '<button type="button" class="rp-chip-btn" id="rpSave">' + ph('bookmark-simple') + t('rpSaveView') + '</button><span class="sp"></span>' +
    (vs.length ? '<span style="font-size:12.5px;color:var(--ink-2)">' + t('rpViews') + ':</span>' + vs.map(function(v, i){ return '<span class="chip"><button type="button" data-view="' + i + '" style="border:0;background:none;color:inherit;padding:0;cursor:pointer">' + esc(v.name) + '</button><button type="button" data-delview="' + i + '" aria-label="' + t('rpDelView') + '" style="border:0;background:none;color:inherit;cursor:pointer">×</button></span>'; }).join('') : '') +
    '</div>' + chipsHtml(d) + '</form>';
}
function chipsHtml(d){
  var p = R.params, c = [];
  (p.depts || []).forEach(function(id){ c.push(['depts', id, nameOfDept(id)]); });
  (p.emps || []).forEach(function(id){ c.push(['emps', id, nameOfEmp(id)]); });
  ['nationality', 'leaveType', 'reqType', 'reqStatus', 'auditAction'].forEach(function(k){ if (p[k]) c.push([k, '', k === 'leaveType' ? t('lt_' + p[k]) : k === 'reqType' ? t('rt_' + p[k]) : k === 'reqStatus' ? t('rs_' + p[k]) : k === 'nationality' ? L(CODES[p[k]]) : p[k]]); });
  if (!c.length) return '';
  return '<div class="rp-chips">' + c.map(function(x){ return '<span class="chip">' + esc(x[2]) + '<button type="button" data-rm="' + x[0] + '" data-rmv="' + esc(x[1]) + '" aria-label="' + t('rpCleared') + '">×</button></span>'; }).join('') + '</div>';
}
function readForm(f, d){
  var p = R.params, g = function(n){ return f.elements[n] ? f.elements[n].value : undefined; };
  ['from', 'to', 'month', 'asOf', 'run', 'cycle', 'nationality', 'status', 'leaveType', 'reqType', 'reqStatus', 'auditAction'].forEach(function(k){ if (f.elements[k]) p[k] = g(k); });
  if (f.elements.days) p.days = Number(g('days')) || 60;
  if (f.elements.threshold) p.threshold = Number(g('threshold')) || 0;
  var dm = $('[data-m="depts"]', f); if (dm) { p.depts = $$('.pop input[value]', dm).filter(function(i){ return i.checked; }).map(function(i){ return i.value; }); p.subDepts = !!$('[name="subDepts"]', dm).checked; }
  var em = $('[data-m="emps"]', f); if (em) p.emps = $$('.pop input[value]', em).filter(function(i){ return i.checked; }).map(function(i){ return i.value; });
}

// ---------------- run ----------------
function runView(el, fetchNow){
  var d = def(R.id);
  if (!d) { R.view = 'catalog'; return catalogView(el); }
  el.innerHTML = '<div class="rp-head"><button type="button" class="iconbtn" id="rpBackBtn" aria-label="' + t('rpBack') + '">' + (S.lang === 'ar' ? I.chev : I.chevb) + '</button><div><h2>' + esc(rpName(R.id)) + '</h2><p>' + esc(rpDesc(R.id)) + '</p></div></div>' +
    filtersHtml(d) + '<div id="rpRes"></div>';
  $('#rpBackBtn', el).onclick = function(){ R.view = 'catalog'; R.id = null; catalogView(el); };
  var f = $('#rpF', el);
  f.onsubmit = function(ev){ ev.preventDefault(); readForm(f, d); R.page = 0; R.open = {}; runView(el, true); };
  $$('[data-pre]', f).forEach(function(b){ b.onclick = function(){ var r = presetRange(b.dataset.pre); readForm(f, d); R.params.from = r[0]; R.params.to = r[1]; R.preset = b.dataset.pre; R.page = 0; runView(el, true); }; });
  ['from', 'to'].forEach(function(k){ if (f.elements[k]) f.elements[k].addEventListener('change', function(){ R.preset = ''; $$('[data-pre]', f).forEach(function(b){ b.setAttribute('aria-pressed', 'false'); }); }); });
  $$('.rp-multi', f).forEach(function(m){
    var q = $('input[type=search]', m);
    if (q) q.oninput = function(){ var s = q.value.trim().toLowerCase(); $$('label[data-s]', m).forEach(function(l){ l.style.display = !s || l.dataset.s.indexOf(s) >= 0 ? '' : 'none'; }); };
    m.addEventListener('toggle', function(){ if (m.open) $$('.rp-multi', f).forEach(function(o){ if (o !== m) o.open = false; }); });
  });
  document.addEventListener('click', function close(ev){ if (!f.isConnected) return document.removeEventListener('click', close); $$('.rp-multi[open]', f).forEach(function(m){ if (!m.contains(ev.target)) m.open = false; }); });
  $$('[data-rm]', f).forEach(function(b){ b.onclick = function(){ readForm(f, d); var k = b.dataset.rm, v = b.dataset.rmv; if (Array.isArray(R.params[k])) R.params[k] = R.params[k].filter(function(x){ return x !== v; }); else R.params[k] = ''; runView(el, true); }; });
  $('#rpSave', f).onclick = function(){
    readForm(f, d);
    var n = prompt(t('rpViewName'), rpName(R.id)); if (!n) return;
    var all = views(); (all[R.id] = all[R.id] || []).push({ name: n.slice(0, 40), params: JSON.parse(JSON.stringify(R.params)), hidden: R.hidden, group: R.group }); all[R.id] = all[R.id].slice(-8); saveViews(all);
    toast(t('rpSaved')); runView(el, false);
  };
  $$('[data-view]', f).forEach(function(b){ b.onclick = function(){ var v = (views()[R.id] || [])[b.dataset.view]; if (!v) return; R.params = JSON.parse(JSON.stringify(v.params)); R.hidden = v.hidden || {}; R.group = v.group || ''; R.preset = ''; R.page = 0; runView(el, true); }; });
  $$('[data-delview]', f).forEach(function(b){ b.onclick = function(){ var all = views(); (all[R.id] || []).splice(Number(b.dataset.delview), 1); saveViews(all); runView(el, false); }; });
  var box = $('#rpRes', el);
  if (!fetchNow && R.res) return drawResult(box);
  var stop = progressCard(box, t('rpRunning'));
  var want = JSON.stringify([R.id, R.params]);
  api('reportRun', { reportId: R.id, params: R.params }).then(function(r){
    stop();
    if (!box.isConnected || JSON.stringify([R.id, R.params]) !== want) return;
    if (!r.ok) { R.res = null; box.innerHTML = '<p class="hr-bad" role="alert">' + errText(r.error) + '</p>'; return; }
    R.res = r;
    if (r.params) { ['run', 'cycle'].forEach(function(k){ if (r.params[k]) R.params[k] = r.params[k]; }); }
    drawResult(box);
  });
}

function visibleCols(res){ return res.columns.filter(function(c){ return !R.hidden[c.key]; }); }
function filteredRows(res, cols){
  var rows = res.rows, q = R.q.trim().toLowerCase();
  if (q) rows = rows.filter(function(r){ return cols.some(function(c){ return cellText(c, r[c.key]).toLowerCase().indexOf(q) >= 0; }); });
  if (R.sort) {
    var c = res.columns.filter(function(x){ return x.key === R.sort; })[0], dir = R.dir;
    if (c) rows = rows.slice().sort(function(a, b){
      var x = a[c.key], y = b[c.key];
      if (x == null || x === '') return 1; if (y == null || y === '') return -1;
      if (isNum(c)) return (Number(x) - Number(y)) * dir;
      return String(cellText(c, x)).localeCompare(String(cellText(c, y)), S.lang === 'en' ? 'en' : 'ar', { numeric: true }) * dir;
    });
  }
  return rows;
}
function sums(cols, rows){ var o = {}; cols.forEach(function(c){ if (c.sum) o[c.key] = Math.round(rows.reduce(function(t, r){ return t + (Number(r[c.key]) || 0); }, 0) * 100) / 100; }); return o; }

function drawResult(box){
  var res = R.res, cols = visibleCols(res), rows = filteredRows(res, cols), all = res.rows;
  var h = '';
  // headline tiles: records plus the first totals
  var sumCols = res.columns.filter(function(c){ return c.sum; }).slice(0, 5), tot = sums(res.columns, all);
  h += '<div class="db-tiles">' + V.tile(t('rpRows'), V.n1(all.length, 0), res.teamOnly ? t('rpTeamOnly') : '', null, true, true) + sumCols.map(function(c){ return V.tile(esc(colLabel(c)), esc(cellText(c, tot[c.key])), ''); }).join('') + '</div>';
  // checks
  var ch = res.checks || [];
  h += '<ul class="rp-checks" aria-label="' + t('rpChecks') + '">' + (ch.length ? ch.map(function(c){
    var txt = L(CHECKS[c.code]) || c.code; txt = txt.replace('{n}', nf(c.count || 0, 0)).replace('{v}', c.value != null ? nf(c.value, c.code === 'variance_flagged' ? 0 : 2) : '');
    var ic = c.level === 'error' ? 'x-circle' : c.level === 'warn' ? 'warning' : 'info';
    return '<li class="' + c.level + '">' + ph(ic, 'fill') + '<span>' + esc(txt) + '</span></li>';
  }).join('') : '<li class="good">' + ph('check-circle', 'fill') + '<span>' + t('rpAllGood') + '</span></li>') + '</ul>';
  // chart
  var chart = chartHtml(res);
  if (chart) h += '<div class="db-grid">' + chart + '</div>';
  if (res.legend) h += '<div class="rp-legend"><span>' + t('rpLegend') + ':</span>' + res.legend.map(function(k){ return '<span><b class="dc-' + k + '">' + k + '</b>' + L(DAYCODE[k]) + '</span>'; }).join('') + '</div>';
  // toolbar
  var groupable = res.columns.filter(function(c){ return c.group; });
  h += '<div class="rp-bar"><input type="search" id="rpQ" placeholder="' + t('rpSearch') + '" value="' + esc(R.q) + '" aria-label="' + t('rpSearch') + '">' +
    (groupable.length ? '<select id="rpG" aria-label="' + t('rpGroup') + '"><option value="">' + t('rpNoGroup') + '</option>' + groupable.map(function(c){ return '<option value="' + c.key + '"' + (R.group === c.key ? ' selected' : '') + '>' + t('rpGroup') + ': ' + esc(colLabel(c)) + '</option>'; }).join('') + '</select>' : '') +
    '<details class="rp-multi rp-colpop"><summary style="height:38px">' + ph('columns') + '<span>' + t('rpColumns') + ' (' + cols.length + '/' + res.columns.length + ')</span></summary><div class="pop"><p class="hr-hint" style="margin:2px 6px 6px">' + t('rpColsHint') + '</p>' +
    res.columns.filter(function(c){ return !/^d\d+$/.test(c.key); }).map(function(c){ return '<label><input type="checkbox" data-col="' + c.key + '"' + (R.hidden[c.key] ? '' : ' checked') + '>' + esc(colLabel(c)) + '</label>'; }).join('') + '</div></details>' +
    '<span class="sp"></span><button type="button" class="btn btn-line btn-sm" data-ex="xlsx">' + ph('microsoft-excel-logo') + t('rpExcel') + '</button><button type="button" class="btn btn-line btn-sm" data-ex="csv">' + ph('file-csv') + t('rpCsv') + '</button><button type="button" class="btn btn-dark btn-sm" data-ex="pdf">' + ph('file-pdf') + t('rpPdf') + '</button></div>';
  h += '<div id="rpTbl"></div>';
  box.innerHTML = h;
  V.wireTips(box);
  var q = $('#rpQ', box); q.oninput = function(){ R.q = q.value; R.page = 0; drawTable($('#rpTbl', box)); };
  var g = $('#rpG', box); if (g) g.onchange = function(){ R.group = g.value; R.page = 0; R.open = {}; drawTable($('#rpTbl', box)); };
  $$('[data-col]', box).forEach(function(i){ i.onchange = function(){ if (i.checked) delete R.hidden[i.dataset.col]; else R.hidden[i.dataset.col] = 1; if (visibleCols(res).length === 0) { delete R.hidden[i.dataset.col]; i.checked = true; } drawResult(box); $('.rp-colpop', box).open = true; }; });
  $$('[data-ex]', box).forEach(function(b){ b.onclick = function(){ doExport(b.dataset.ex, b); }; });
  drawTable($('#rpTbl', box));
}

function chartHtml(res){
  var c = res.chart; if (!c || !res.rows.length) return '';
  var items = [];
  if (c.type === 'bars') {
    var col = res.columns.filter(function(x){ return x.key === c.by; })[0] || { key: c.by, type: 'code' }, vcol = c.value !== 'count' ? res.columns.filter(function(x){ return x.key === c.value; })[0] : null, m = {};
    res.rows.forEach(function(r){ var k = r[c.by] == null || r[c.by] === '' ? '-' : String(r[c.by]); m[k] = (m[k] || 0) + (vcol ? Number(r[c.value]) || 0 : 1); });
    items = Object.keys(m).map(function(k){ var lb = k === '-' ? '-' : cellText(col, k); return { label: lb, value: m[k], text: vcol ? cellText(vcol, m[k]) : V.n1(m[k], 0), tip: lb + ': ' + (vcol ? cellText(vcol, m[k]) : V.n1(m[k], 0)) }; })
      .sort(function(a, b){ return b.value - a.value; }).slice(0, 12);
  } else if (c.type === 'hbar') {
    var vc = res.columns.filter(function(x){ return x.key === c.value; })[0];
    items = res.rows.filter(function(r){ return r[c.value] != null; }).slice().sort(function(a, b){ return (Number(b[c.value]) || 0) - (Number(a[c.value]) || 0); }).slice(0, 12)
      .map(function(r){ return { label: String(r[c.label] || ''), value: Number(r[c.value]) || 0, text: cellText(vc, r[c.value]), tip: r[c.label] + ': ' + cellText(vc, r[c.value]) }; });
  }
  if (!items.length) return '';
  var table = V.tbl(['', t('rpCount')], items.map(function(i){ return [esc(i.label), esc(i.text)]; }));
  return V.card('rpc', t('rpChart'), '', V.hbars(items.map(function(i){ return { label: i.label, value: i.value, text: esc(i.text), tip: i.tip }; }), c.max ? { max: c.max } : null), table);
}

var PAGE = 50;
function tdHtml(c, v){
  var cls = [], txt = cellText(c, v);
  if (/^d\d+$/.test(c.key)) return '<td class="dc' + (v ? ' dc-' + esc(v) : '') + '">' + esc(v || '') + '</td>';
  if (isNum(c)) cls.push('n'); if (c.type === 'id' || c.type === 'date' || c.type === 'time' || c.type === 'datetime') cls.push('id');
  if ((c.type === 'money' || c.key === 'change' || c.key === 'changePct') && Number(v) < 0) cls.push('neg');
  if (c.key === 'detail' || c.key === 'note' || c.key === 'flags') cls.push('wrap');
  return '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + esc(txt) + '</td>';
}
function drawTable(el){
  var res = R.res, cols = visibleCols(res), rows = filteredRows(res, cols);
  if (!res.columns.length || !rows.length) { el.innerHTML = '<div class="empty">' + ph('magnifying-glass') + '<b>' + t('rpNoRows') + '</b></div>'; return; }
  var head = '<thead><tr>' + cols.map(function(c){
    var sorted = R.sort === c.key, wk = c.dow === 5 || c.dow === 6;
    return '<th scope="col"' + (isNum(c) ? ' class="n' + (wk ? ' wk' : '') + '"' : wk ? ' class="wk"' : '') + (sorted ? ' aria-sort="' + (R.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-sort="' + c.key + '">' + esc(colLabel(c)) +
      '<span class="ar">' + (sorted ? (R.dir > 0 ? '▲' : '▼') : '↕') + '</span></button></th>';
  }).join('') + '</tr></thead>';
  var tot = sums(cols, rows), anySum = cols.some(function(c){ return c.sum; });
  var foot = anySum ? '<tfoot><tr>' + cols.map(function(c, i){ return i === 0 ? '<td>' + t('rpTotal') + '</td>' : c.sum ? '<td class="n">' + esc(cellText(c, tot[c.key])) + '</td>' : '<td></td>'; }).join('') + '</tr></tfoot>' : '';
  var body = '', info = '';
  if (R.group) {
    var gc = res.columns.filter(function(c){ return c.key === R.group; })[0], groups = {}, order = [];
    rows.forEach(function(r){ var k = r[R.group] == null ? '' : String(r[R.group]); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(r); });
    order.sort(function(a, b){ return groups[b].length - groups[a].length; });
    body = order.map(function(k, gi){
      var list = groups[k], sub = sums(cols, list), open = !!R.open[k];
      var gh = '<tr class="gh" data-g="' + esc(k) + '" tabindex="0" aria-expanded="' + open + '">' + cols.map(function(c, i){
        if (i === 0) return '<td><span class="tw">▸</span> ' + esc(k === '' ? '-' : cellText(gc, k)) + ' <span class="chip">' + list.length + '</span></td>';
        return c.sum ? '<td class="n">' + esc(cellText(c, sub[c.key])) + '</td>' : '<td></td>';
      }).join('') + '</tr>';
      return gh + (open ? list.map(function(r){ return '<tr>' + cols.map(function(c){ return tdHtml(c, r[c.key]); }).join('') + '</tr>'; }).join('') : '');
    }).join('');
    info = order.length + ' · ' + rows.length + ' ' + t('rpRows');
  } else {
    var pages = Math.ceil(rows.length / PAGE); R.page = Math.min(R.page, pages - 1);
    var slice = rows.slice(R.page * PAGE, R.page * PAGE + PAGE);
    body = slice.map(function(r){ return '<tr>' + cols.map(function(c){ return tdHtml(c, r[c.key]); }).join('') + '</tr>'; }).join('');
    info = t('rpShown') + ' ' + (R.page * PAGE + 1) + '–' + (R.page * PAGE + slice.length) + ' ' + t('rpOf') + ' ' + rows.length + (rows.length !== res.rows.length ? ' (' + res.rows.length + ')' : '');
    if (pages > 1) info += '</span><span class="btnrow" style="margin:0"><button type="button" class="btn btn-line btn-sm" data-pg="-1"' + (R.page ? '' : ' disabled') + '>' + t('rpPrev') + '</button><span style="align-self:center">' + t('rpPage') + ' ' + (R.page + 1) + ' / ' + pages + '</span><button type="button" class="btn btn-line btn-sm" data-pg="1"' + (R.page < pages - 1 ? '' : ' disabled') + '>' + t('rpNext') + '</button>';
  }
  el.innerHTML = '<div class="rp-tw"><table class="rp-t">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div><div class="rp-pg"><span>' + info + '</span></div>';
  $$('[data-sort]', el).forEach(function(b){ b.onclick = function(){ var k = b.dataset.sort; if (R.sort === k) R.dir = -R.dir; else { R.sort = k; R.dir = isNum(res.columns.filter(function(c){ return c.key === k; })[0]) ? -1 : 1; } R.page = 0; drawTable(el); }; });
  $$('[data-pg]', el).forEach(function(b){ b.onclick = function(){ R.page += Number(b.dataset.pg); drawTable(el); el.querySelector('.rp-tw').scrollTop = 0; }; });
  $$('tr.gh', el).forEach(function(tr){ var tg = function(){ var k = tr.dataset.g; R.open[k] = !R.open[k]; drawTable(el); }; tr.onclick = tg; tr.onkeydown = function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } }; });
}

// ---------------- exports ----------------
function filterLines(p){
  var out = [];
  if (p.from) out.push([t('rpFrom') + ' - ' + t('rpTo'), p.from + ' → ' + p.to]);
  if (p.month) out.push([t('rpMonth'), p.month]);
  if (p.asOf) out.push([t('rpAsOf'), p.asOf]);
  if (p.run) { var r = CAT.runs.filter(function(x){ return x.id === p.run; })[0]; out.push([t('rpRun'), r ? r.ref + ' (' + r.month + ')' : p.run]); }
  if (p.cycle) { var c = CAT.cycles.filter(function(x){ return x.id === p.cycle; })[0]; out.push([t('rpCycle'), c ? c.ref : p.cycle]); }
  if (p.depts) out.push([t('rpDepts'), p.depts.length ? p.depts.map(nameOfDept).join('، ') + (p.subDepts ? ' (+' + t('rpSub') + ')' : '') : t('rpAllDepts')]);
  if (p.emps) out.push([t('rpEmps'), p.emps.length ? p.emps.map(nameOfEmp).join('، ') : t('rpAllEmps')]);
  if (p.nationality) out.push([t('rpNat'), L(CODES[p.nationality])]);
  if (p.status && p.status !== 'active') out.push([t('rpStatus'), p.status === 'all' ? t('rpAll') : t('rpDisabledOnly')]);
  if (p.days) out.push([t('rpDays'), p.days]);
  if (p.threshold != null && p.threshold !== '') out.push([t('rpThreshold'), p.threshold]);
  if (p.leaveType) out.push([t('rpLeaveType'), t('lt_' + p.leaveType)]);
  if (p.reqType) out.push([t('rpReqType'), t('rt_' + p.reqType)]);
  if (p.reqStatus) out.push([t('rpReqStatus'), t('rs_' + p.reqStatus)]);
  if (p.auditAction) out.push([t('rpAction'), p.auditAction]);
  return out;
}
var busy = false;
function doExport(fmt, btn){
  if (busy) return; busy = true;
  var keep = visibleCols(R.res).map(function(c){ return c.key; });
  var old = btn.innerHTML; btn.disabled = true; btn.innerHTML = ph('circle-notch') + t('rpExporting'); btn.querySelector('i').style.animation = 'rpSpin .8s linear infinite';
  var need = fmt === 'xlsx' ? loadScript('js/xl.js').then(function(){ return XL.lib(); }) : Promise.resolve();
  need.then(function(){ return api('reportExport', { reportId: R.id, params: R.params, format: fmt, columns: keep }); }, function(){ return { ok: false, error: 'network' }; }).then(function(r){
    busy = false; btn.disabled = false; btn.innerHTML = old;
    if (!r.ok) return toast(errText(r.error));
    var at = new Date(r.generatedAt);
    var meta = { ref: r.export.ref, hash: r.export.hash, name: rpName(R.id), by: r.by, at: at, filters: filterLines(r.params || R.params), teamOnly: r.teamOnly, checks: r.checks || [] };
    if (fmt === 'xlsx') toXlsx(r, meta); else if (fmt === 'csv') toCsv(r, meta); else toPdf(r, meta);
    toast(t('rpExported') + ' ' + meta.ref);
  });
}
function download(blob, name){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function fileBase(meta){ return meta.ref + '_' + R.id; }
function checkText(c){ return (L(CHECKS[c.code]) || c.code).replace('{n}', nf(c.count || 0, 0)).replace('{v}', c.value != null ? nf(c.value, c.code === 'variance_flagged' ? 0 : 2) : ''); }

/** A status word to the colour it shows in Excel. */
function statusTone(v){
  var s = String(v == null ? '' : v).toLowerCase();
  if (/^(approved|active|locked|paid|done|present|in|ok|confirmed|closed|resolved|returned|cleared|good)$/.test(s)) return 'ok';
  if (/^(pending|draft|late|review|open|uploaded|generated|charged|responded|in_progress|due|warn|missing_out)$/.test(s)) return 'warn';
  if (/^(rejected|absent|disabled|overdue|error|lost|damaged|objected|expired|bad)$/.test(s)) return 'bad';
  if (/^(leave|holiday|cancelled|info|upcoming|off)$/.test(s)) return 'info';
  return null;
}
/** Excel through the shared kit (js/xl.js): typed columns, totals that follow the filter, status colours, an About sheet. */
var DTONE = { P: 'ok', L: 'warn', A: 'bad', V: 'info', H: 'none', O: 'none', M: 'info' };
var XTYPE = { money: 'money', pct: 'pct', int: 'int', min: 'int', hours: 'hours', num: 'num', days: 'days', date: 'date', datetime: 'datetime' };
function toXlsx(r, meta){
  var en = S.lang === 'en';
  var cols = r.columns.map(function(c){
    var day = /^d\d+$/.test(c.key), o = { key: c.key, label: colLabel(c), type: day ? 'text' : XTYPE[c.type] || 'text', sum: !!c.sum };
    if (day) { o.width = 4.5; o.center = true; o.tone = function(v){ return DTONE[v] || null; }; }
    else if (o.type === 'text') o.text = function(v){ return cellText(c, v); };
    if (!day && (c.type === 'status' || c.type === 'code')) o.tone = function(v){ return statusTone(v); };
    return o;
  });
  var info = [[t('rpRef'), meta.ref], [t('rpAt'), greg(meta.at)], [t('rpHijri'), hijri(meta.at)], [t('rpBy'), meta.by.name + ' (' + meta.by.empNo + ')'], [t('rpRows'), r.rows.length], [t('rpHash'), meta.hash, true]];
  if (meta.teamOnly) info.push(['', t('rpTeamOnly')]);
  return loadScript('js/xl.js').then(function(){
    return XL.download({ fileName: fileBase(meta), title: meta.name, description: rpDesc(R.id), lang: en ? 'en' : 'ar', company: coName(), ref: meta.ref,
      when: greg(meta.at) + ' · ' + hijri(meta.at), by: meta.by.name, logo: logoInk(), meta: info, filters: meta.filters,
      checks: meta.checks.map(function(c){ return { level: c.level, text: checkText(c) }; }), footnote: t('rpConf') + ' · ' + t('rpVerifyHow'),
      sheets: [{ name: t('rpDataSheet'), title: meta.name, columns: cols, rows: r.rows }] });
  }).catch(function(){ toast(t('e_network')); });
}
function toCsv(r, meta){
  var q = function(s){ s = String(s == null ? '' : s); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  var raw = function(c, v){ if (v == null) return ''; if (c.type === 'code' || c.type === 'status') return codeText(c.key, v); if (c.type === 'datetime') return riyadhDT(v); return v; };
  var lines = [r.columns.map(function(c){ return q(colLabel(c)); }).join(',')].concat(r.rows.map(function(row){ return r.columns.map(function(c){ return q(raw(c, row[c.key])); }).join(','); }));
  download(new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }), fileBase(meta) + '.csv');
}
function toPdf(r, meta){
  var en = S.lang === 'en', cols = r.columns, land = cols.length > 9 || r.wide, tot = sums(cols, r.rows);
  var wm = esc(meta.by.name + ' · ' + meta.by.empNo + ' · ' + riyadhDT(meta.at.toISOString()) + ' · ' + meta.ref);
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='420' height='260'><text x='20' y='150' transform='rotate(-28 210 130)' font-family='Arial' font-size='15' fill='rgba(28,42,31,0.07)'>" + wm + "</text></svg>";
  var head = '<tr>' + cols.map(function(c){ return '<th' + (isNum(c) ? ' class="n"' : '') + '>' + esc(colLabel(c)) + '</th>'; }).join('') + '</tr>';
  var body = r.rows.map(function(row){ return '<tr>' + cols.map(function(c){ var v = row[c.key]; if (/^d\d+$/.test(c.key)) return '<td class="dc dc-' + esc(v || '') + '">' + esc(v || '') + '</td>'; return '<td class="' + (isNum(c) ? 'n' : '') + ((c.type === 'money' && Number(v) < 0) ? ' neg' : '') + '">' + esc(cellText(c, v)) + '</td>'; }).join('') + '</tr>'; }).join('');
  var foot = cols.some(function(c){ return c.sum; }) ? '<tr>' + cols.map(function(c, i){ return i === 0 ? '<td>' + t('rpTotal') + '</td>' : c.sum ? '<td class="n">' + esc(cellText(c, tot[c.key])) + '</td>' : '<td></td>'; }).join('') + '</tr>' : '';
  var checks = meta.checks.length ? '<ul class="ck">' + meta.checks.map(function(c){ return '<li class="' + c.level + '">' + esc(checkText(c)) + '</li>'; }).join('') + '</ul>' : '';
  var legend = r.legend ? '<p class="lg">' + r.legend.map(function(k){ return '<b class="dc-' + k + '">' + k + '</b> ' + L(DAYCODE[k]); }).join(' &nbsp; ') + '</p>' : '';
  var html = '<!doctype html><html lang="' + (en ? 'en' : 'ar') + '" dir="' + (en ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><title>' + esc(meta.ref + ' ' + meta.name) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600&display=swap" rel="stylesheet"><style>' +
    '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:14mm 10mm 16mm;@bottom-center{content:"' + meta.ref + '  ·  ' + meta.hash.slice(0, 16) + '  ·  ' + (en ? 'Page ' : 'صفحة ') + '" counter(page) " / " counter(pages);font-size:8pt;color:#6B786D;font-family:Arial}}' +
    'body{font-family:"Readex Pro",Tahoma,Arial,sans-serif;color:#17221A;font-size:' + (cols.length > 16 ? '7.5' : cols.length > 10 ? '8.5' : '10') + 'pt;margin:0}' +
    '.wm{position:fixed;inset:0;background-image:url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '");background-repeat:repeat;z-index:0;pointer-events:none}' +
    'main{position:relative;z-index:1}header{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:2px solid #4D6D51;padding-bottom:8px}header img{height:46px}' +
    'h1{font-size:15pt;margin:10px 0 2px}.sub{color:#4A5A4D;font-size:9pt;margin:0 0 8px}.meta{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;margin-bottom:8px}' +
    'dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:0;font-size:8.5pt}dt{color:#4A5A4D}dd{margin:0}dd.h{font-family:Consolas,monospace;font-size:7.5pt;word-break:break-all;direction:ltr;text-align:start}' +
    '#qr{width:84px;height:84px}#qr img,#qr canvas{width:84px!important;height:84px!important}' +
    '.ck{margin:4px 0 8px;padding:0;list-style:none;font-size:8.5pt}.ck li{padding:3px 8px;border-inline-start:3px solid #2a78d6;margin-bottom:2px;background:#F4F7FB}.ck .error{border-color:#B3261E;background:#FBEFEC}.ck .warn{border-color:#C98500;background:#FCF5E6}' +
    'table{width:100%;border-collapse:collapse}thead{display:table-header-group}tfoot{display:table-footer-group}tr{break-inside:avoid}' +
    'th{background:#EDEAE0;text-align:start;font-weight:600;padding:4px 5px;border:1px solid #CFCABD}td{padding:3px 5px;border:1px solid #E1DDD2;background:rgba(255,255,255,.6)}' +
    '.n{text-align:end;font-variant-numeric:tabular-nums}.neg{color:#B3261E}.dc{text-align:center;padding:3px 1px;font-weight:600}' +
    '.dc-P{background:#E6F2EA}.dc-L{background:#FBEFD7}.dc-A{background:#F8E1DB}.dc-V{background:#E3EEFA}.dc-H,.dc-O{background:#F1EFE9;color:#6B786D}.dc-M{background:#F3E6F4}' +
    '.tf td{font-weight:600;background:#EDEAE0}.lg{font-size:8pt;color:#4A5A4D}.lg b{padding:0 4px;border-radius:3px}' +
    '.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:26px;break-inside:avoid}.sign div{border-top:1px solid #999;padding-top:5px;font-size:8.5pt;color:#4A5A4D}' +
    '.conf{font-size:8pt;color:#8A948B;margin-top:10px}</style></head><body><div class="wm"></div><main>' +
    '<header><img src="' + logoInk() + '" alt=""><div style="text-align:end;font-size:9pt;color:#4A5A4D">' + esc(coName()) + '<br><b style="color:#17221A;font-size:11pt;direction:ltr;unicode-bidi:isolate">' + esc(meta.ref) + '</b></div></header>' +
    '<h1>' + esc(meta.name) + '</h1><p class="sub">' + esc(rpDesc(R.id)) + '</p>' +
    '<div class="meta"><dl><dt>' + t('rpAt') + '</dt><dd>' + esc(greg(meta.at)) + ' · ' + t('rpHijri') + ' ' + esc(hijri(meta.at)) + '</dd><dt>' + t('rpBy') + '</dt><dd>' + esc(meta.by.name + ' (' + meta.by.empNo + ')') + (meta.teamOnly ? ' · ' + t('rpTeamOnly') : '') + '</dd>' +
    meta.filters.map(function(f){ return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '<dt>' + t('rpRows') + '</dt><dd>' + r.rows.length + '</dd><dt>' + t('rpHash') + '</dt><dd class="h">' + esc(meta.hash) + '</dd></dl><div id="qr" aria-label="QR"></div></div>' +
    checks + legend + '<table><thead>' + head + '</thead><tbody>' + body + '</tbody>' + (foot ? '<tfoot class="tf">' + foot + '</tfoot>' : '') + '</table>' +
    '<div class="sign"><div>' + (en ? 'Prepared by' : 'أعده') + '</div><div>' + (en ? 'Reviewed by' : 'راجعه') + '</div><div>' + (en ? 'Approved by' : 'اعتمده') + '</div></div>' +
    '<p class="conf">' + t('rpConf') + ' · ' + t('rpVerifyHow') + '</p></main>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" integrity="sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU" crossorigin="anonymous"><\/script><script>' +
    'function go(){try{new QRCode(document.getElementById("qr"),{text:' + JSON.stringify(meta.ref + '|' + meta.hash) + ',width:168,height:168,correctLevel:QRCode.CorrectLevel.M})}catch(e){}setTimeout(function(){window.print()},500)}' +
    'if(document.readyState==="complete")go();else window.addEventListener("load",go);<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return toast(t('e_generic'));
  w.document.open(); w.document.write(html); w.document.close(); if (window.docBar) docBar(w);
}

// ---------------- export log (its own mini dashboard) ----------------
function logView(el){
  var stop = progressCard(el, t('rpLog'));
  apiFresh('reportLog', {}, function(r){
    stop();
    if (!el.isConnected) return;
    if (!r.ok) { el.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
    var since = Date.now() - 30 * 864e5, recent = r.rows.filter(function(x){ return Date.parse(x.at) >= since; });
    var rev = recent.filter(function(x){ return x.reviewedBy; }).length, byF = {}, byR = {};
    recent.forEach(function(x){ byF[x.format] = (byF[x.format] || 0) + 1; byR[x.reportId] = (byR[x.reportId] || 0) + 1; });
    var h = '<div class="db-tiles">' + V.tile(t('rpExports30'), V.n1(recent.length, 0), '', null, true, true) + V.tile(t('rpReviewRate'), recent.length ? V.n1(rev / recent.length * 100, 0) + '%' : '-', '') +
      V.tile(t('rpAwaiting'), V.n1(r.rows.filter(function(x){ return !x.reviewedBy; }).length, 0), '') + '</div>';
    if (recent.length) h += '<div class="db-grid two">' + V.card('lf', t('rpByReport'), '', V.hbars(Object.keys(byR).sort(function(a, b){ return byR[b] - byR[a]; }).slice(0, 8).map(function(k){ return { label: rpName(k), value: byR[k], text: String(byR[k]), tip: rpName(k) + ': ' + byR[k] }; })), '') +
      V.card('lfm', t('rpByFormat'), '', V.hbars(Object.keys(byF).map(function(k){ return { label: k.toUpperCase(), value: byF[k], text: String(byF[k]), tip: k + ': ' + byF[k] }; })), '') + '</div>';
    h += r.rows.length ? '<div class="rp-tw rp-log"><table class="rp-t"><thead><tr>' + [t('rpRef'), t('rpTitle'), t('rpFormat'), t('rpRows'), t('rpMaker'), t('rpAt'), t('rpReviewer'), ''].map(function(x){ return '<th scope="col"><button type="button" tabindex="-1">' + x + '</button></th>'; }).join('') + '</tr></thead><tbody>' +
      r.rows.map(function(x, i){
        return '<tr><td class="id">' + esc(x.ref) + '</td><td>' + esc(rpName(x.reportId)) + '</td><td>' + esc(String(x.format).toUpperCase()) + '</td><td class="n">' + x.rows + '</td><td>' + esc(x.by) + '</td><td class="id">' + esc(riyadhDT(x.at)) + '</td>' +
          '<td>' + (x.reviewedBy ? '<span class="rev ok">' + ph('check-circle', 'fill') + esc(x.reviewedBy) + '</span>' + (x.reviewNote ? '<br><small style="color:var(--ink-2)">' + esc(x.reviewNote) + '</small>' : '') : '<span class="rev no">' + ph('clock') + t('rpNotReviewed') + '</span>') + '</td>' +
          '<td style="white-space:nowrap">' + (x.reviewedBy ? '' : '<button type="button" class="btn btn-line btn-sm" data-rv="' + i + '">' + t('rpDoReview') + '</button> ') + '<button type="button" class="btn btn-line btn-sm" data-vf="' + i + '">' + t('rpVerifyBtn') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">' + ph('files') + '<b>' + t('rpNoRows') + '</b></div>';
    el.innerHTML = h; V.wireTips(el);
    $$('[data-rv]', el).forEach(function(b){ b.onclick = function(){
      var x = r.rows[b.dataset.rv];
      var d = drawer('<h3>' + t('rpDoReview') + '</h3><p class="hr-hint">' + esc(x.ref + ' · ' + rpName(x.reportId) + ' · ' + x.by) + '</p><form class="form" id="rvF"><div class="field"><label>' + t('rpReviewNote') + '</label><textarea name="note" maxlength="300" rows="3"></textarea></div><p class="hr-bad" id="rvE" role="alert"></p><div class="btnrow"><button class="btn btn-dark" type="submit">' + t('rpDoReview') + '</button></div></form>');
      $('#rvF', d).onsubmit = function(ev){ ev.preventDefault(); api('reportReview', { ref: x.ref, note: this.elements.note.value }).then(function(y){ if (!y.ok) return $('#rvE', d).textContent = errText(y.error); d.remove(); toast(t('rpReviewDone')); logView(el); }); };
    }; });
    $$('[data-vf]', el).forEach(function(b){ b.onclick = function(){ var x = r.rows[b.dataset.vf]; R.view = 'verify'; R.verify = { ref: x.ref, hash: x.hash }; var body = el.closest('.hr-body') || el.parentNode.parentNode; section(body); }; });
  });
}

// ---------------- verifier ----------------
function verifyView(el){
  var v = R.verify || { ref: '', hash: '' };
  el.innerHTML = '<form class="rp-verify form" id="vfF"><p class="hr-hint" style="margin-top:0">' + t('rpVerifyLead') + '</p>' +
    '<div class="field"><label>' + t('rpRef') + '</label><input name="ref" dir="ltr" required placeholder="RPT-2026-00001" value="' + esc(v.ref) + '" autocomplete="off"></div>' +
    '<div class="field"><label>' + t('rpHash') + '</label><input name="hash" dir="ltr" value="' + esc(v.hash) + '" autocomplete="off" spellcheck="false"></div>' +
    '<p class="hr-hint">' + ph('qr-code') + ' RPT-…|hash</p><div class="btnrow"><button class="btn btn-dark" type="submit">' + ph('seal-check') + t('rpVerifyBtn') + '</button></div><div class="rp-res" id="vfR" aria-live="polite"></div></form>';
  var f = $('#vfF', el);
  // A scanned QR pastes "REF|HASH" into one box: split it.
  f.elements.ref.addEventListener('input', function(){ var s = f.elements.ref.value; if (s.indexOf('|') > 0) { f.elements.hash.value = s.split('|')[1].trim(); f.elements.ref.value = s.split('|')[0].trim(); } });
  f.onsubmit = function(ev){
    ev.preventDefault();
    R.verify = { ref: f.elements.ref.value.trim(), hash: f.elements.hash.value.trim() };
    var out = $('#vfR', el); out.innerHTML = '<span class="sk"></span>';
    api('reportVerify', R.verify).then(function(r){
      if (!r.ok) { out.innerHTML = '<p class="hr-bad">' + errText(r.error) + '</p>'; return; }
      if (!r.found) { out.innerHTML = '<ul class="rp-checks"><li class="error">' + ph('x-circle', 'fill') + '<span>' + t('rpNotFound') + '</span></li></ul>'; return; }
      var li = [];
      li.push(r.match === true ? ['good', 'check-circle', t('rpMatch')] : r.match === false ? ['error', 'x-circle', t('rpNoMatch')] : ['info', 'info', t('rpNoHash')]);
      li.push(r.unchanged === true ? ['good', 'check-circle', t('rpSame')] : r.unchanged === false ? ['warn', 'warning', t('rpChangedSince')] : ['info', 'info', t('rpCannotRerun')]);
      var g = r.log;
      out.innerHTML = '<ul class="rp-checks">' + li.map(function(x){ return '<li class="' + x[0] + '">' + ph(x[1], 'fill') + '<span>' + x[2] + '</span></li>'; }).join('') + '</ul>' +
        '<dl class="rp-kv"><dt>' + t('rpRef') + '</dt><dd dir="ltr">' + esc(g.ref) + '</dd><dt>' + t('rpTitle') + '</dt><dd>' + esc(rpName(g.reportId)) + '</dd><dt>' + t('rpMaker') + '</dt><dd>' + esc(g.by) + '</dd><dt>' + t('rpAt') + '</dt><dd dir="ltr">' + esc(riyadhDT(g.at)) + '</dd>' +
        '<dt>' + t('rpRows') + '</dt><dd>' + g.rows + ' · ' + esc(String(g.format).toUpperCase()) + '</dd><dt>' + t('rpReviewer') + '</dt><dd>' + (g.reviewedBy ? esc(g.reviewedBy) + ' · ' + esc(riyadhDT(g.reviewedAt)) : t('rpNotReviewed')) + '</dd>' +
        '<dt>' + t('rpHash') + '</dt><dd dir="ltr" style="font-family:Consolas,monospace;font-size:12px">' + esc(g.hash) + '</dd></dl>';
    });
  };
  if (v.ref) f.requestSubmit ? f.requestSubmit() : f.onsubmit(new Event('submit'));
}

window.Reports = { section: section, reset: function(){ CAT = null; } };
})();
