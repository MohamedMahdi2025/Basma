# Documentation plan (DOCS-PLAN)

**Status:** proposed, 2026-10-04.
**Evidence:** `docs/research/2026-10-03-documentation-benchmark.md`.
**Applies to:** the HR system in its single-company form today, and as a white-label SaaS.
**Skills used:** engineering:documentation, anthropic-skills:documentation-template, design:ux-copy and anthropic-skills:docs.
The docs connector was not used, because the deliverable is a repository file.

## 1. Principles

1. **Arabic first, English second.** Every customer-facing page is written in Arabic first, and English is written from it (§6).
2. **Diátaxis.** Every page has exactly one type:
   - **tutorial**: learn by doing;
   - **how-to**: do one task;
   - **reference**: look a fact up;
   - **explanation**: understand why.

   A page never mixes types; it links to the others instead.
3. **The server is the truth.** A rule is documented only if the server enforces it, or it is marked **يحتاج تحقق**. Keep the
   guide's existing habit.
4. **Generate what can be generated.** These come from code, never from hand typing:
   - the settings reference (`DEFAULT_SETTINGS`);
   - error codes (`T` strings);
   - the role matrix;
   - the report catalogue (`REPORTS`);
   - UI labels (`AREAS`);
   - the data dictionary (tabs and columns).
5. **White-label by default.** Customer docs never contain a company name, logo, URL or real employee data.
   - Use the variables `{{company}}`, `{{company_short}}` and `{{app_url}}`, which mirror `coName()` and `coShort()`.
   - Screenshots come from a demo company.
6. **Legal statements carry a citation and a date.** Each one names the article, the source, the "last verified" date and the
   reviewer, and adds "ليس استشارة قانونية" on public pages.
7. **Three access tiers:**
   - **public**: the help centre, trust and sales pages;
   - **signed-in customer**: risk-flag scoring, settings internals, implementation workbooks;
   - **internal**: engineering, owner and security internals.

## 2. Audiences and their doors

| Code | Audience | Main need | Door |
|---|---|---|---|
| EMP | Employee (often a field driver on a phone) | Check in, request leave, see the payslip | In-app help, a one-page card, 60-second videos |
| MGR | Manager / department head | Approve, set goals, look after the team | In-app help, quick card |
| HR | HR officer | Run people processes end to end | Help centre and in-app |
| PAY | Payroll holder | Run payroll, WPS, reconciliation and end of service correctly | Help centre, PDF checklists |
| ADM | The customer's system admin | Set up the company, locations, roles and devices | Help centre, setup checklist on the home page |
| EXE | Executive | Read the dashboard and trust the numbers | Short explanations, KPI dictionary |
| IMP | The customer company's implementer | Go live safely | Implementation kit (PDF and Excel) |
| OWN | Platform owner (us), internal | Build, deploy, support, provision tenants | Internal docs in the repo |
| BUY | Prospective buyer, security reviewer, lawyer | Decide and sign | Trust and sales site |

## 3. Architecture (where documents live)

```
In-app help ─── "؟" in each area header → drawer with that sub-page's how-to (APP-01)
   │            empty states, field hints, error copy (APP-02..05)
   ▼
Help centre (web; /ar first, /en) ── by audience → by Diátaxis type
   ├── Start here (tutorials per role)
   ├── How-to (by area: الحضور والدوام، الطلبات والإجازات، الرواتب، الأداء والتطوير، الموظفون والمنشأة، التقارير والتحليلات، الإعدادات)
   ├── Reference (generated: errors, settings, roles, reports, leave types, pay rules, reference numbers)
   ├── Explanation (how a day/leave/salary is calculated, security, privacy, maker-checker)
   └── What's new (release notes)
Implementation kit (signed-in) ── playbook, templates, workbook, checklists, rollout kit
Academy ── role paths, videos, quizzes, certificates
Trust and sales site (public) ── trust page, legal, status, overview, compliance map
Internal (repo only) ── CLAUDE.md, action index, data dictionary, runbooks, legal register, style guide
```

Source layout in the repo:
- `docs/help/ar/<audience>/<slug>.md`, mirrored in `docs/help/en/`;
- `docs/kit/`, `docs/trust/` and `docs/internal/`.

Every page carries front matter: `id`, `type`, `audience`, `area:sub` (which links it to the in-app "؟"), `access`, `version`,
`last_verified`, `legal_refs` and `owner`.

## 4. Document catalogue

**Owners**
- **PO**: platform owner, the accountable human.
- **ENG**: engineering (Claude, under the PO).
- **HRX**: HR subject expert (the Best Gas HR team as design partner).
- **PAYX**: payroll subject expert.
- **LEGAL**: external Saudi counsel.
- **CS**: implementation and customer success lead (the PO until hired).

**Priority**
- **P0**: before the first external customer, or needed now by live Best Gas users.
- **P1**: within the first three customers.
- **P2**: later.

**Formats:** in-app, web, PDF, video, Excel, status (a hosted page).

### 4.1 Employee (EMP)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| EMP-01 | ابدأ هنا: فعّل جهازك وسجّل حضورك الأول | Tutorial | First success in under 5 minutes | In-app, web, 60 s video | CS | P0 |
| EMP-02 | تسجيل الحضور والانصراف، وما تفعله إذا رُفض | How-to | Daily task and its fixes (location, accuracy) | In-app (time:punch), web | CS | P0 |
| EMP-03 | تقديم طلب: إجازة، خطاب، سلفة، تصحيح، تحديث بيانات، استقالة | How-to | One page per request type | In-app (requests:mine), web | HRX | P0 |
| EMP-04 | قسيمتي: كيف أقرؤها | How-to + reference | Find a payslip and understand each line | In-app (pay:slips), web | PAYX | P0 |
| EMP-05 | كيف يُحسب يومك (الدوام، التأخير، الإضافي) | Explanation | Fewer disputes | Web | HRX | P0 |
| EMP-06 | رصيد إجازتك: كيف يُكتسب ويُحجز | Explanation | Fewer HR tickets | Web | HRX | P0 |
| EMP-07 | حسابك وأجهزتك: الرمز السري، كلمة المرور، جهاز جديد أو مفقود | How-to | Self-recovery | In-app (account), web | CS | P0 |
| EMP-08 | خصوصيتك: ما يُجمع، ومتى يُقرأ موقعك، وما يراه مديرك | Explanation | Trust; PDPL transparency | Web, linked from sign-in | LEGAL | P0 |
| EMP-09 | بطاقة الموظف (صفحة واحدة مع رمز QR) | Reference | For drivers without email | PDF A4/A5 | CS | P0 |
| EMP-10 | أهدافي وتقييمي وتقييم 360 | How-to | Annual cycle | Web | HRX | P1 |
| EMP-11 | مهامي: السياسات، الاستبيان، العهدة، خطة التطوير، الرد على مخالفة | How-to | Tasks from the bell | In-app, web | HRX | P1 |
| EMP-12 | بطاقات بلغات العمالة الميدانية (أردو، هندي، بنغالي، فلبيني) | Reference | Field staff comprehension | PDF | PO | P2 |

### 4.2 Manager (MGR)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| MGR-01 | اعتماد الطلبات ورفضها وتفويض موافقاتك | How-to | The manager's most frequent task | In-app (requests:inbox), web | HRX | P0 |
| MGR-02 | ابدأ هنا للمدير: الموافقات، فريقي، تقويم الإجازات | Tutorial | First week as an approver | Web, video | CS | P1 |
| MGR-03 | أهداف الفريق وتقييمه، ومنتصف العام | How-to | Performance cycle | Web | HRX | P1 |
| MGR-04 | خطط التطوير وتحسين الأداء | How-to | IDP and PIP | Web | HRX | P1 |
| MGR-05 | فتح مخالفة والإبلاغ عن إصابة | How-to | Labour relations, done lawfully | Web | LEGAL | P1 |
| MGR-06 | التهيئة وإخلاء الطرف لفريقك | How-to | Owner tasks | Web | HRX | P1 |
| MGR-07 | ما يراه المدير وما لا يراه، ولماذا | Explanation | Fewer access requests | Web | ENG | P1 |
| MGR-08 | بطاقة المدير | Reference | Quick card | PDF | CS | P1 |

### 4.3 HR (HR)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| HR-01 | ابدأ هنا للموارد البشرية: أول أسبوع | Tutorial | Add an employee, issue a code, review punches | Web, video | CS | P0 |
| HR-02 | الموظفون: إضافة، تفعيل، كلمة مرور مؤقتة، إيقاف | How-to | Account lifecycle | In-app (people:accounts), web | HRX | P0 |
| HR-03 | الهيكل والوظائف والوصف الوظيفي | How-to | Organisation setup | Web | HRX | P0 |
| HR-04 | الاستيراد من Excel (مع القالب) | How-to | Bulk load, all or nothing | Web + Excel | HRX | P0 |
| HR-05 | لوحة اليوم ومراجعة البصمات والتصحيح اليدوي | How-to | Daily attendance control | In-app, web | HRX | P0 |
| HR-06 | الطلبات والإجازات والعطل والأرصدة المنقولة | How-to | Leave administration | Web | HRX | P0 |
| HR-07 | أنواع الإجازات وقواعدها ومواد النظام | Reference | One table, cited and dated | Web | LEGAL | P0 |
| HR-08 | مسارات الاعتماد: من يعتمد ماذا | Reference | Generated from the server chains | Web | ENG | P0 |
| HR-09 | رسائل الأخطاء كاملة وما العمل | Reference | Generated from `T` | Web | ENG | P0 |
| HR-10 | الورديات والجداول ورمضان والحظر الصيفي | How-to | Rosters and seasonal rules | Web | HRX | P1 |
| HR-11 | دورة التقييم والمعايرة و360 | How-to | Run a cycle | Web | HRX | P1 |
| HR-12 | البرامج: التهيئة، نبض الموظفين، السياسات، خطط التطوير | How-to | People programmes | Web | HRX | P1 |
| HR-13 | علاقات العمل: المخالفات والجزاءات والإصابات | How-to | Lawful process | Web | LEGAL | P1 |
| HR-14 | العهد وإخلاء الطرف | How-to | Custody and exit | Web | HRX | P1 |
| HR-15 | الوثائق التي تنتهي والتوطين | How-to | Expiries and Nitaqat | Web | HRX | P1 |
| HR-16 | لماذا يحتاج كل إجراء مالي أو عقابي إلى شخصين | Explanation | Maker-checker | Web | ENG | P1 |

### 4.4 Payroll (PAY)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| PAY-01 | أول مسير من البداية للنهاية، مع شهر موازٍ | Tutorial | Safe first run | Web, PDF checklist | PAYX | P0 |
| PAY-02 | حزم الرواتب واعتمادها | How-to | Effective-dated pay | Web | PAYX | P0 |
| PAY-03 | البنود الشهرية: إضافات وخصومات وساعات إضافية | How-to | Monthly inputs | Web | PAYX | P0 |
| PAY-04 | ملف حماية الأجور (مدد) ومتابعة الرفع | How-to | WPS duty | Web | PAYX | P0 |
| PAY-05 | مطابقة الأجور مع التأمينات وقوى | How-to | Avoid WPS mismatches | Web | PAYX | P0 |
| PAY-06 | نهاية الخدمة والمخالصة النهائية | How-to | Lawful exit pay | Web | LEGAL | P0 |
| PAY-07 | قواعد حساب الراتب | Reference | The formula table (guide §7.3) | Web | PAYX | P0 |
| PAY-08 | ملاحظات القسيمة وأعمدة ملف البنك | Reference | Exceptions and file columns | Web | ENG | P0 |
| PAY-09 | التأمينات الاجتماعية: الفئات والنسب | Explanation | Old and new GOSI cohorts | Web | LEGAL | P1 |
| PAY-10 | التقويم النظامي | How-to | Deadlines | Web | PAYX | P1 |

### 4.5 Customer admin (ADM)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| ADM-01 | ابدأ هنا: أعدّ منشأتك في يوم واحد (ملف الشركة، المواقع، الإعدادات، الأدوار) | Tutorial | First setup | Web + in-app checklist | CS | P0 |
| ADM-02 | المواقع (النطاقات الجغرافية) | How-to | Geofences | In-app (time:zones), web | CS | P0 |
| ADM-03 | الإعدادات وكيف تختار قيمها | How-to + explanation | Decisions with consequences | Web | PAYX | P0 |
| ADM-04 | الأدوار والصلاحيات الإضافية | How-to | Grant payroll and executive roles | Web | ENG | P0 |
| ADM-05 | الأجهزة: فك الربط والاستعادة | How-to | Lost phones | Web | CS | P0 |
| ADM-06 | مصفوفة الأدوار والصلاحيات | Reference | Generated; who sees what | Web | ENG | P0 |
| ADM-07 | مرجع الإعدادات | Reference | Generated from `DEFAULT_SETTINGS` | Web (signed in) | ENG | P0 |
| ADM-08 | نموذج الأمان للعميل: مفاتيح المرور، الموقع، مؤشرات الخطر، الجلسات | Explanation | Customer-safe version of guide §24 | Web (signed in) | ENG | P0 |
| ADM-09 | سجل التدقيق والتحقق من التقارير المرقمة | How-to | Audit and evidence | Web | ENG | P1 |
| ADM-10 | الأرقام المرجعية وبادئاتها | Reference | Guide §1.6 | Web | ENG | P1 |

### 4.6 Executive (EXE)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| EXE-01 | كيف تقرأ لوحة الإدارة | Explanation | Trust the numbers | Web | ENG | P1 |
| EXE-02 | قاموس المؤشرات (الدوران، التوطين المرجح، الالتزامات) | Reference | Definitions and formulas | Web | ENG | P1 |
| EXE-03 | دليل مركز التقارير | Reference | Generated catalogue with access rules | Web | ENG | P1 |

### 4.7 Customer implementer (IMP)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| IMP-01 | دليل التطبيق: المراحل والمسؤوليات ومعايير الانتقال | How-to | Plan, configure, migrate, parallel run, go-live, hypercare | PDF + web | CS | P0 |
| IMP-02 | دليل ترحيل البيانات وقوالبه (موظفون، أرصدة منقولة، رواتب، وثائق، عهد) | How-to + Excel | Staged import, test one row first | Excel + web | CS | P0 |
| IMP-03 | كراسة الإعداد: القرارات قبل التشغيل | Reference | Leave count mode, EOS basis, deductions, Ramadan, penalty table | Excel/PDF | PAYX | P0 |
| IMP-04 | قائمة الانطلاق والتحويل (من الدليل §25.2) | How-to | Go-live gate | PDF | CS | P0 |
| IMP-05 | حقيبة الإطلاق: رسائل التفعيل، ملصق QR، دليل المدرب | Reference | The customer's own rollout | PDF, DOCX, WhatsApp text | CS | P0 |
| IMP-06 | قائمة التحقق النظامي قبل التشغيل (قالب WPS مع البنك، اللائحة المعتمدة، السياسات) | How-to | Customer-side legal checks (guide §25.1) | PDF | LEGAL | P0 |
| IMP-07 | سيناريوهات اختبار القبول | How-to | UAT per role | Excel | CS | P1 |
| IMP-08 | التسليم بعد الانطلاق والدعم المكثف | How-to | Hypercare exit | PDF | CS | P1 |

### 4.8 Release notes, in-app help and academy

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| REL-01 | ما الجديد: ملاحظة لكل نشر | Reference | Each entry carries type (جديد، تحسين، إصلاح، إيقاف), the affected roles, the action needed, whether it is on by default, and a removal date | Web, in-app badge | ENG | P0 |
| REL-02 | إشعار التغيير الجوهري (مثل نقل النطاق وإعادة التفعيل) | Reference | 90 days' notice | Email, web | PO | P0 |
| APP-01 | مساعدة سياقية "؟" لكل صفحة فرعية | How-to (pull) | Screen → its help | In-app drawer | ENG | P0 |
| APP-02 | نصوص الحالات الفارغة لكل قائمة | Copy | Status, cue and action, per NN/g | In-app | ENG | P0 |
| APP-03 | نصوص رسائل الأخطاء، ومنها 14 رمزا بلا نص | Copy | What happened and what to do | In-app | ENG | P0 |
| APP-04 | تلميحات أول استخدام (اختيارية، تُغلق) | How-to | Check-in, approvals inbox, first payroll | In-app | ENG | P1 |
| APP-05 | تلميحات الحقول (آيبان، هوية، تواريخ) | Reference | Prevent errors | In-app | ENG | P1 |
| ACA-01 | مسارات تعلم لكل دور (الموظف 10 د، المدير 30 د، HR 3 س، الرواتب 3 س، المسؤول 1 س، المطبّق يوم) | Tutorial set | Scalable training | Academy (video + quiz) | CS | P1 |
| ACA-02 | مكتبة فيديو قصيرة بالعربية مع ترجمة نصية | Tutorial | Under 2 minutes each | Video + WebVTT | CS | P1 |
| ACA-03 | دليل المدرّب وعرض التدريب | Reference | Train the trainer | PDF, slides | CS | P1 |
| ACA-04 | شهادات HR والرواتب والمسؤول والمطبّق | Assessment | Certified customer admins | Academy | CS | P2 |

### 4.9 Trust and sales (BUY)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| TRS-01 | صفحة الثقة والأمان: الاستضافة، التشفير، الوصول، النسخ الاحتياطي، RTO/RPO، اختبار الاختراق، التصدير والحذف | Explanation | Pass security review honestly, with no claimed certifications | Web | ENG | P0 |
| TRS-02 | إشعار الخصوصية للمنصة (نحن كمتحكم لبيانات الحسابات والموقع) | Legal | PDPL Art. 12 | Web | LEGAL | P0 |
| TRS-03 | اتفاقية معالجة البيانات (نحن معالج) | Legal | PDPL processor contract | PDF | LEGAL | P0 |
| TRS-04 | قائمة المعالجين الفرعيين | Reference | Prior acceptance by the controller | Web | ENG | P0 |
| TRS-05 | قالب إشعار خصوصية الموظفين (الشركة متحكم) | Legal template | The customer's own duty to its employees | DOCX/PDF | LEGAL | P0 |
| TRS-06 | اتفاقية مستوى الخدمة | Legal | Availability, support times, maintenance outside 07:30-08:30 and 16:30-17:30 | PDF | PO | P0 |
| TRS-07 | سياسة الدعم: القنوات والساعات والأولوية | Reference | Expectations | Web | CS | P0 |
| TRS-08 | شروط الخدمة واتفاقية الترخيص | Legal | Contract | PDF | LEGAL | P0 |
| TRS-09 | صفحة الحالة (الحضور، الموارد البشرية، الرواتب، التقارير) | Status | Incidents and history | Status page | ENG | P1 |
| TRS-10 | حزمة إجابات استبيانات الأمان | Reference | Faster procurement | PDF/Excel | ENG | P1 |
| TRS-11 | تصدير البيانات وحذفها عند انتهاء العقد | How-to | Exit rights | Web | ENG | P1 |
| TRS-12 | بيان إمكانية الوصول | Reference | WCAG level declared | Web | ENG | P2 |
| SAL-01 | نظرة عامة على المنتج | Explanation | First meeting | Web + PDF (AR/EN) | PO | P0 |
| SAL-02 | مصفوفة الوحدات حسب الخطة | Reference | Pricing conversations | Web | PO | P1 |
| SAL-03 | خريطة الامتثال: مادة النظام ← الخاصية (بعد التحقق القانوني) | Reference | Strongest Saudi differentiator | Web | LEGAL | P1 |
| SAL-04 | سيناريو العرض وبيانات الشركة التجريبية | How-to | Repeatable demos | Internal + demo tenant | PO | P1 |
| SAL-05 | دراسة حالة (بموافقة) | Explanation | Proof | PDF | PO | P2 |

### 4.10 Internal (OWN)

| ID | Document | Type | Purpose | Format | Owner | Pri |
|---|---|---|---|---|---|---|
| OWN-01 | ملاحظات الهندسة (`CLAUDE.md`) | Reference | Exists; keep internal | Repo | ENG | P0 (exists) |
| OWN-02 | فهرس إجراءات الخادم (من الدليل §22) | Reference | Generated; future public API base | Repo | ENG | P0 |
| OWN-03 | قاموس البيانات: التبويبات والحقول والنوع وتصنيف البيانات والاحتفاظ | Reference | Migration, PDPL records, support | Repo (generated) | ENG | P0 |
| OWN-04 | دليل النشر والتراجع | How-to | Exists in `CLAUDE.md`; formalise | Repo | ENG | P1 |
| OWN-05 | دليل تهيئة شركة جديدة (الترخيص، أول مسؤول، دخول الدعم) | How-to | SaaS phase 2 | Repo | ENG | P1 |
| OWN-06 | الاستجابة للحوادث وإخطار التسرب (SDAIA خلال 72 ساعة) | How-to | Legal duty | Repo + PDF | LEGAL | P0 |
| OWN-07 | النسخ الاحتياطي والاستعادة وسجل التمارين | How-to | DR evidence | Repo | ENG | P1 |
| OWN-08 | دليل الدعم: التصنيف والأولوية والردود الجاهزة | How-to | Consistent support | Repo | CS | P1 |
| OWN-09 | دليل الأسلوب والمسرد | Reference | §6 to §8 of this plan, materialised | Repo | ENG | P0 |
| OWN-10 | عملية الإصدار وكتابة ملاحظات الإصدار | How-to | REL-01 discipline | Repo | ENG | P0 |
| OWN-11 | تفاصيل الأمان الداخلية (التجزئة، الجلسات، خصائص السكربت) | Reference | Moved out of guide §§23.3 and 24 | Repo only | ENG | P0 |
| OWN-12 | سجل القواعد النظامية: المادة، القاعدة في الشيفرة، المصدر، تاريخ التحقق، المراجع القانوني | Reference | Single legal truth; feeds HR-07, PAY-09 and SAL-03 | Repo | LEGAL | P0 |

## 5. Where each chapter of the current guide goes

The guide (`docs/guide/bestgas-hr-system-guide.md`) stays as the internal master until every row below is done. Then it is
archived.

| Chapter | New home | Action |
|---|---|---|
| 1.1 Coverage | SAL-01, SAL-02 | Rewrite for buyers; drop the company name |
| 1.2 How it works | TRS-01 (customer view); OWN-01 (Google stack) | Split: stack details go internal |
| 1.3 Roles | ADM-06, MGR-07, EMP-08 | Generate the matrix |
| 1.4 Areas | Help-centre navigation map (generated from `AREAS`) | **Rewrite**: placements are pre-v2; fix "ورديتي" |
| 1.5 Global rules | HR-16 | Explanation |
| 1.6 Reference numbers | ADM-10 | As is |
| 1.7 Common messages | APP-03, HR-09 | Generated |
| 2 Sign-in and devices | EMP-01, EMP-07, HR-02; 2.1 and 2.5 to OWN-05 | "تهيئة النظام" becomes "الإعداد الأول" |
| 3 Attendance | EMP-02, EMP-05, HR-05, ADM-08 | Risk-point table goes to signed-in only |
| 4 Shifts, Ramadan, summer | HR-10 | Check against the live shifts screen |
| 5 Employee file | HR-02, HR-03, HR-04, HR-15, ADM-06, EMP-08 | Split |
| 6 Requests and leave | EMP-03, EMP-06, MGR-01, HR-06, HR-07, HR-08 | Split; leave table into OWN-12 |
| 7 Payroll | PAY-01 to PAY-03, PAY-07, PAY-08, EMP-04; 7.7 e-mail to ADM | Split |
| 8 End of service | PAY-06, OWN-12 | Cite and date each rule |
| 9 Compliance | PAY-04, PAY-05, PAY-10, IMP-06 | WPS template caveat stays |
| 10 Performance | HR-11, MGR-03, EMP-10 | Split |
| 11 Onboarding | HR-12, MGR-06 | Term "التهيئة" |
| 12 IDP and PIP | MGR-04, HR-12 | |
| 13 Pulse survey | HR-12, EMP-11, EMP-08 | Never market it as "fully anonymous" (§24.8 limit) |
| 14 Policies | HR-12, EMP-11 | Starter texts need LEGAL |
| 15 Discipline | HR-13, MGR-05, EMP-11, OWN-12 | **Fix the Art. 72 objection period first** |
| 16 Work injuries | HR-13, MGR-05 | Art. 138 pay rule open |
| 17 Custody | HR-14, EMP-11 | |
| 18 Clearance | HR-14, MGR-06, PAY-06 | |
| 19 Home, tasks, dashboard | EMP-01, MGR-02, EXE-01 | Rewrite for the v2 home |
| 20 Reports centre | EXE-03, ADM-09 | Generated catalogue |
| 21 Settings and admin | ADM-01 to ADM-05 | |
| 22 Server action index | OWN-02 | **Internal only** |
| 23 Settings reference | ADM-07 (23.1, 23.2); OWN-11 (23.3) | Script properties are internal |
| 24 Security and privacy | ADM-08, TRS-01, EMP-08; internals to OWN-11 | Hashing schemes and rounds never published |
| 25 Owner checks | OWN-12 (25.1), IMP-04 (25.2), engineering backlog (25.3) | Not customer docs |

## 6. Arabic first, English second

- **Arabic is the source.** English is written from the approved Arabic, never machine-translated without review.
  Legal pages say that the Arabic text governs.
- **Parity by tier**, following Workday's practice of covering languages per audience:
  - EMP, MGR, P0 trust and sales pages, and REL-01 ship in Arabic and English together.
  - HR, PAY, ADM and IMP English may lag by one release.
  - OWN is English only.
- Each page records `ar_version` and `en_version`. A dashboard lists the pages whose English is behind.
- **Register:** Modern Standard Arabic, conversational.
  - Second person, short sentences, one idea per sentence.
  - No dialect and no Arabizi.
- **Addressing the reader:** steps use the singular imperative ("افتح"، "اختر"); labels use verbal nouns ("تسجيل الحضور").
  No slash forms such as "سجّل/ي".
- **Legal citations** name the official Arabic article: "المادة 109 من نظام العمل".

## 7. RTL rules for every format

1. Set `dir="rtl" lang="ar"` on Arabic pages and `dir="ltr" lang="en"` on English ones. A file holds one language; only the
   glossary is bilingual.
2. Use Western digits (0-9) everywhere, matching the app and the government portals.
   - Counts follow `plural()`: "3 أيام", "21 يوما".
   - Money is the amount, then "ر.س": "4,000 ر.س".
3. Isolate left-to-right content with `<bdi>` or code font, and never break it across lines. This covers:
   - IDs, IBANs and reference numbers (<bdi>LV-2026-00001</bdi>);
   - emails, URLs, phone numbers (+966…) and keys.
4. Arabic punctuation (، ؛ ؟) in Arabic prose. No italics, letter-spacing or all-caps tricks; emphasis is bold only.
5. Screen labels appear in **bold**, exactly as on screen. Navigation paths use "←" in Arabic ("الطلبات والإجازات ← الموافقات")
   and "›" in English.
6. Dates are Gregorian first, then Hijri (Umm al-Qura), where official. Reference tables use YYYY-MM-DD. Times follow the UI.
7. Tables:
   - the first column sits on the right;
   - numbers are aligned to the end of the cell;
   - five columns at most on pages read on phones.
8. Screenshots:
   - taken in Arabic RTL from the demo company;
   - phone screenshots at 375 px and desktop at 1280 px;
   - numbered markers matching the steps;
   - Arabic alt text.
9. PDF: Readex Pro, A4, right-to-left page flow. The footer carries the version, the date and "آخر تحقق". Printed pages use
   the inked logo (`logoInk()`).
10. Video: Arabic voice-over and Arabic plus English WebVTT captions, under 2 minutes, with on-screen text that matches the UI.
11. Slugs and file names are English kebab-case (stable URLs). Titles are Arabic.

## 8. Glossary rules

- **One file** (`docs/internal/glossary.csv`, from OWN-09) is the single source. Columns:
  - Arabic term, English term, definition, audience;
  - the UI key (`T` key);
  - forbidden synonyms.
- **The live UI label wins.** If a doc and the UI differ, fix the doc. If the UI is wrong, change it in code and in the
  glossary together.
- A **docs lint** step fails the build when a page uses a forbidden synonym or a bold label that is not in `T`.
- **Seed entries:**

| Use | English | Do not use |
|---|---|---|
| دوامك / دوامي (an employee's own hours) | your working hours | ورديتك، ورديتي |
| الورديات (HR scheduling feature only) | shifts | for an employee's own hours |
| الحضور والدوام (area) | Time | الحضور والورديات |
| المواقع (geofences, user-facing) | locations | النطاقات (admin reference only) |
| لوحة اليوم | Today board | اللوحة المباشرة |
| مراجعة البصمات | Punch review | المراجعة alone |
| الموافقات | Approvals | صندوق الطلبات، بانتظاري |
| سجل التدقيق | Audit log | السجل الأمني |
| التهيئة (new-hire onboarding) | Onboarding | الانضمام |
| الإعداد الأول (system bootstrap; **decision for the PO**) | First-time setup | تهيئة النظام |
| رمز التفعيل / الرمز السري / كلمة المرور / مفتاح المرور | activation code / PIN / password / passkey | one for another |
| مسير الرواتب، قسيمة الراتب، حزمة الراتب، بند | payroll run, payslip, pay package, adjustment | كشف، راتب for a package |
| مكافأة نهاية الخدمة / المخالصة النهائية / إخلاء الطرف | end-of-service award / final settlement / clearance | |
| حماية الأجور (مدد) / مطابقة الأجور | WPS (Mudad) / wage reconciliation | |
| الموارد البشرية (in Arabic prose) | HR | "HR" inside Arabic sentences |
| مسؤول النظام (the customer's admin) / مالك المنصة (us) | system admin / platform owner | "المسؤول" for both |
| {{company}} | {{company}} | any literal company name |

## 9. Templates

These follow the documentation-template skill: a consistent header, status, second person and the most important point first.

- **Every page** opens with: title, a one-line purpose, "لمن" (audience), "قبل أن تبدأ" (conditions first), then the body.
  It closes with "ذو صلة" (related pages) and "آخر تحقق".
- **How-to:** numbered steps with one action each. Exact bold labels. The result is stated at the end. Errors link to HR-09.
- **Reference:** a table only, with no instructions, in the order the product uses.
- **Explanation:** why the rule exists, with an example and the law it cites.
- **Release note:** type · title · who is affected · what changed · action needed (or "لا شيء") · on by default? · related page.
- **Legal register row (OWN-12):** article · rule text · code rule (error key) · source URL · last verified · reviewer ·
  status (verified / needs counsel / changed).

## 10. Governance

- **Definition of done for a feature** includes:
  - its help page or pages;
  - its error copy;
  - its empty state;
  - a REL-01 entry;
  - a glossary check.
- **Each deploy** regenerates the reference pages (settings, errors, roles, reports, screen map, data dictionary) and fails on
  undocumented error keys.
- **Quarterly freshness audit:** every page older than 90 days since `last_verified` is re-checked. Legal rows are re-checked
  every six months and after any HRSD, GOSI or SDAIA change.
- **Review:** an independent reviewer checks each P0 page before it is published. LEGAL signs off every page with
  `legal_refs`.
- **Measures:**
  - help searches with no result;
  - "هل أفادتك هذه الصفحة؟" votes;
  - support tickets per 100 employees by topic;
  - days to first check-in for a new company;
  - the share of employees activated in week 1.

## 11. Order of work (P0)

1. **OWN-12**, the legal rule register. Fix the Art. 72 objection period (30 days, not 15) in code and docs.
2. **OWN-09**, the style guide and glossary. Decide the "التهيئة" collision.
3. **APP-03** error copy (including the 14 codes with no text) and **APP-02** empty states.
4. **EMP-01, EMP-02, EMP-09** and **MGR-01**: live users today.
5. **REL-01**: start with the v2 shell going live.
6. **IMP-01 to IMP-06**: the implementation kit.
7. **TRS-01 to TRS-08** and **SAL-01**: the trust and sales set, with LEGAL.
8. **ADM-01, ADM-06 to ADM-08, HR-01 to HR-09, PAY-01 to PAY-08, EMP-03 to EMP-08**: the rest of P0.
9. **APP-01**: the contextual "؟" drawer, once 20 or more how-to pages exist to link to.
