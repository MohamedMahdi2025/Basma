# Module gap audit against the HRIS leaders (2026-10-14)

**Question from the owner:** he thinks many modules are missing. This audit lists the modules that exist today, read from the
code rather than from older documents, and compares them with Workday, SAP SuccessFactors, Oracle HCM, Rippling, BambooHR,
HiBob, Personio and Deel. For KSA it compares with Jisr, ZenHR, Bayzat, Menaitech and Palm HR.

**Method.**
- I read the action maps in `backend/Code.gs`: `EMP_ACTIONS`, `HR_ACTIONS`, `ADMIN_ACTIONS` and `READ_ONLY_ACTIONS`.
- I also read every `api_*` function in the 20 backend files (195 actions before today), the `js/*.js` screens and the
  `AREAS` list in `index.html`.
- Vendor modules come from `2026-10-04-feature-gap-matrix.md`, `2026-10-08-ksa-hris-documentation-study.md` and new searches
  done today (sources at the end).
- "Ours" uses three values:
  - **H** have;
  - **P** partial;
  - **M** missing.
- **H\*** means it was built today, on the backend with tests. It has no screen yet, because the client is being redesigned.
- **Skills used:**
  - engineering:system-design, for the module boundaries, hooks and data model;
  - human-resources:recruiting-pipeline, for the stages and funnel metrics;
  - test-driven-development, for a suite per module;
  - verification-before-completion, so that all suites are run before anything is reported.

## 1. Answer in one page

- **The owner is right about the gaps as of this morning.**
  - Six families that every Saudi competitor sells were absent from the code: recruitment, employee loans, training and
    certificates, medical insurance, announcements and the HR help desk. No `api_`, tab or screen existed for any of them.
  - The existing core is deep: attendance, leave, payroll, GOSI, WPS, end of service (EOS), government services,
    discipline, custody, performance, reports and approvals.
- **Built today, P1:** all six of those families, as backend and tests only.
  - 6 new backend files: `Recruitment`, `Loans`, `Training`, `Insurance`, `Announce` and `HelpDesk`.
  - 61 new actions.
  - 14 new tabs.
  - 253 new test checks.
- **Tally across 26 families and 116 sub-features, after today:**

| | Have | of which built today (H\*) | Partial | Missing |
|---|---|---|---|---|
| Sub-features | **66** | 21 | **16** | **34** |

  Before today the same 116 rows were 45 have, 19 partial and 52 missing. Three partial rows (training records and the two loan rows) became
  have today.
- **Still missing, highest value first:**
  1. Notifications by e-mail or WhatsApp. This needs a new scope.
  2. File attachments. These need a Drive scope.
  3. Hourly permission (استئذان) and overtime requests.
  4. Off-cycle, final-pay and retro payroll runs.
  5. A compensation review cycle.
  6. Custom fields.
  7. A report builder.
  8. Mudad, GOSI, Qiwa and Muqeem APIs. These need partner agreements.
  9. SSO and a public API.
  10. Succession planning.

## 2. Module inventory and gap table

Evidence uses the form `file:function`. A Saudi vendor column marked "✓" means the vendor documents that feature publicly
(sources in the earlier studies).

| # | Family | Sub-feature | Ours | Evidence / note | KSA leaders | Global leaders |
|---|---|---|---|---|---|---|
| 1 | Core HR | Employee file, effective-dated job history | H | Hr.gs:api_hrEmpSave, api_hrEmpFile, tab jobHistory | all | all |
| 1 | Core HR | Private file (ID, IBAN, GOSI no.) with field-level access | H | Hr.gs:api_hrPrivateSave, buildFile_ | all | all |
| 1 | Core HR | Documents with expiry alerts | H | Hr.gs:api_hrDocSave, api_hrExpiring | Jisr, ZenHR, Bayzat, Palm | Deel |
| 1 | Core HR | File attachments (the scan itself) | M | metadata only; needs Drive scope | Jisr, ZenHR, Bayzat | all |
| 1 | Core HR | Excel import with validation | H | Hr.gs:api_hrImportValidate/Commit | Jisr | HiBob |
| 1 | Core HR | Custom fields | M | — | — | Rippling, HiBob, Personio |
| 1 | Core HR | Multi-entity / several CRs | M | single company profile (Admin.gs:companyOf_) | Jisr, Palm | Oracle, Workday |
| 2 | Organisation | Departments tree, heads, cost centres | H | Hr.gs:api_hrDeptSave | Jisr, Menaitech | all |
| 2 | Organisation | Positions with JD | H | Hr.gs:api_hrPositionSave | Menaitech | Workday, SAP |
| 2 | Organisation | Visual org chart | P | list views only (hr-console) | Jisr, Menaitech | Workday, HiBob |
| 2 | Organisation | Headcount plan / position control | P | requisitions now control approved headcount (Recruitment.gs) but no budgeted-position plan | Jisr, Menaitech | HiBob, Workday |
| 2 | Organisation | Nitaqat weighting and target | H | Hr.gs:api_hrDirectory, Dashboard.gs | Jisr | — |
| 3 | Recruitment | Requisition with approval | H\* | Recruitment.gs:api_recruitReqSave/Decide/Close | all five | all |
| 3 | Recruitment | Candidate pipeline, sources, referral | H\* | api_recruitCandSave/Stage/List/Get | all five | all |
| 3 | Recruitment | Interview scheduling and scorecards (blind until own score) | H\* | api_recruitInterviewSave/Feedback | Jisr, ZenHR, Bayzat | Workday, Greenhouse-class |
| 3 | Recruitment | Offer with Labour Law checks and second approver | H\* | api_recruitOfferSave/Decide/Send/Respond | Jisr, ZenHR (ZenATS) | BambooHR, HiBob |
| 3 | Recruitment | Offer letter data | H\* | api_recruitOfferLetter (print kit to render) | ZenHR | BambooHR |
| 3 | Recruitment | One-step hire into employee, contract, package, onboarding | H\* | api_recruitHire | Jisr | BambooHR, Rippling |
| 3 | Recruitment | Funnel metrics (conversion, source, acceptance, time to fill) | H\* | api_recruitBoard | Jisr | all |
| 3 | Recruitment | PDPL consent and erasure of candidate data | H\* | consentAt, purgeAfter, stage 'erased' | — | Personio (GDPR) |
| 3 | Recruitment | Careers page / job boards (Jadarat, LinkedIn) | M | source field only | Jisr, ZenHR | Workday, Personio |
| 3 | Recruitment | CV parsing / AI screening | M | — | ZenHR (AI) | Workday, HiBob |
| 4 | Onboarding | 30-60-90 plan with owners and due dates | H | Engage.gs:api_onboardStart/Task | Jisr, Bayzat, Palm | SAP, HiBob |
| 4 | Onboarding | Pre-boarding portal (documents before day 1) | M | — | Jisr | BambooHR |
| 4 | Onboarding | Probation review (Art. 53) | H | ONB_TEMPLATE day 80/89 | — | — |
| 5 | Offboarding | Clearance gated on custody return | H | Custody.gs:api_clearanceStart/Task | Jisr, Bayzat, Palm | Rippling |
| 5 | Offboarding | Resignation with 2025 deemed acceptance | P | Leave.gs:resignationAcceptBy_ shown, not enforced | Jisr | — |
| 5 | Offboarding | Exit interview / survey | M | — | Jisr | Workday, HiBob |
| 6 | Time | Geofenced passkey check-in with risk flags | H | Attendance.gs:api_punchBegin/Finish | all (weaker) | UKG |
| 6 | Time | Review queue and manual corrections | H | Admin.gs:api_reviewDecide, api_manualPunch | Jisr, ZenHR, Bayzat | — |
| 6 | Time | Biometric device integration | M | — | all five | — |
| 6 | Time | Kiosk / QR punch | M | — | ZenHR | — |
| 6 | Time | Timesheet approval before payroll lock | M | — | Menaitech, Palm | UKG |
| 6 | Time | Overtime request / pre-approval | P | HR adjustments only (Payroll.gs overtime_hours) | Jisr | Workday |
| 6 | Time | Hourly permission (استئذان) | M | no request type in Leave.gs REQUEST_STEPS | common in KSA | — |
| 7 | Shifts | Shifts and rosters | P | Shifts.gs; no overnight shifts (`overnight_not_supported`) | Jisr, Bayzat, Menaitech | Personio, UKG |
| 7 | Shifts | Ramadan hours, summer midday ban | H | Shifts.gs, settings | Jisr | — |
| 7 | Shifts | Rotations and shift swaps | M | — | Jisr | UKG |
| 8 | Leave | Statutory types, accrual, 2025 amendments | H | Leave.gs:LEAVE_TYPES, annualBalance_ | all | Oracle |
| 8 | Leave | Opening balances | H | Leave.gs:api_leaveOpeningSave | — | HiBob |
| 8 | Leave | Leave cycle: clearance, departure, return | H | Flows.gs:api_leaveCycle* | — | — |
| 8 | Leave | Team calendar with overlap warning | P | Leave.gs:api_leaveTeam (no warning) | Bayzat | — |
| 8 | Leave | Year-end carry-over caps and encashment | M | — | — | Oracle |
| 8 | Leave | Official holidays | H | Leave.gs:api_holidaySave | Jisr | — |
| 9 | Payroll | Monthly run, maker-checker, lock | H | Payroll.gs:api_payrollCreate/Approve | all | ADP, Workday |
| 9 | Payroll | Company cost, EOS provision, GOSI registered wage | H | Payroll.gs:calcSlip_, finish_ | Jisr | Oracle |
| 9 | Payroll | Variance and payroll reports | H | Reports.gs | — | — |
| 9 | Payroll | Off-cycle, final-pay and retro runs | M | EOS settlement is outside the run | Jisr | SAP, Oracle |
| 9 | Payroll | Several pay groups or cycles | M | — | Jisr, Palm | — |
| 9 | Payroll | Odoo journal | H | Journal.gs:api_journalBuild (loan lines map to the advances receivable since today) | Jisr, ZenHR, Bayzat | ADP |
| 9 | Payroll | Payslip by e-mail | P | Payroll.gs:api_payrollEmail needs the external-request scope | Jisr, Bayzat | all |
| 10 | Government (KSA) | GOSI cohorts, caps, GCC warning | H | Payroll.gs:gosiRates_ | Jisr, ZenHR, Bayzat | Oracle |
| 10 | Government (KSA) | WPS / Mudad / bank files | P | Compliance.gs:api_wpsFile, Journal.gs bank formats; no API | all five | — |
| 10 | Government (KSA) | GOSI / Qiwa reconciliation that blocks payroll | H | Compliance.gs:api_reconUpload | — | — |
| 10 | Government (KSA) | Exit/re-entry, final exit, iqama renewal, fees, tickets | H | GovServices.gs | Jisr, ZenHR, Bayzat, Menaitech | SAP (Muqeem) |
| 10 | Government (KSA) | Compliance calendar | H | Compliance.gs:api_complianceCalendar (+ certificate, insurance and policy items since today) | Jisr | Deel |
| 10 | Government (KSA) | Mudad / GOSI / Qiwa / Muqeem APIs | M | partner agreements needed | Jisr, ZenHR, Bayzat | — |
| 11 | EOS | Arts. 84-88 calculation and settlement | H | Payroll.gs:api_eosQuote (deducts loans since today) | Jisr | — |
| 11 | EOS | Art. 77 compensation for unfair dismissal | M | — | — | — |
| 12 | Advances and loans | Salary advance with instalments | H | Leave.gs 'advance', Payroll.gs | Menaitech, Palm | — |
| 12 | Advances and loans | Long-term loans: policy, consent, schedule, payout, early settlement | H\* | Loans.gs:api_loanCreate/Decide/Disburse/Settle | ZenHR, Menaitech, Palm | — |
| 12 | Advances and loans | Loan instalments through payroll with the Art. 93 cap | H\* | Loans.gs:loanSlipLines_ hooked in Payroll.gs calcSlip_ | ZenHR | — |
| 13 | Spend | Expense claims | H | Expenses.gs | Jisr, Bayzat, Palm | Rippling |
| 13 | Spend | Travel requests and per diem | M | — | Jisr, ZenHR, Menaitech | Rippling |
| 13 | Spend | Annual leave tickets | H | GovServices.gs:api_ticketSave/Use | — | — |
| 14 | Benefits | Medical policy, classes, premiums | H\* | Insurance.gs:api_insPolicySave | ZenHR, Bayzat | Oracle, HiBob |
| 14 | Benefits | Members and dependants, CCHI checks (son ≤ 25) | H\* | api_insMemberAdd, api_insDependantRequest | Bayzat | Oracle |
| 14 | Benefits | Additions and deletions, pro-rata premium, two people | H\* | api_insMemberDelete, api_insMoveStep | Bayzat | — |
| 14 | Benefits | Premium cost by department and month | H\* | api_insCost | Bayzat | — |
| 14 | Benefits | Insurer API / Tameeni | M | — | ZenHR (Tameeni), Bayzat | — |
| 14 | Benefits | Perks and wellness | M | — | ZenHR, Bayzat | ADP |
| 15 | Performance | Cycles, KPIs, calibration | H | Performance.gs | all | all |
| 15 | Performance | 360 feedback | H | Performance.gs:api_feedbackLaunch | Jisr, Menaitech | — |
| 15 | Performance | IDP and PIP | H | Engage.gs:api_planSave | Menaitech | — |
| 15 | Performance | Continuous goals / OKRs / 1:1s | P | KPIs per cycle only | — | Oracle, SAP, HiBob |
| 16 | Learning | Course catalogue, sessions, capacity | H\* | Training.gs:api_courseSave, api_trainSessionSave | Jisr, Menaitech | Workday, HiBob |
| 16 | Learning | Requests and manager approval, nomination | H\* | api_trainRequest/Decide/Enrol | Jisr | all |
| 16 | Learning | Results and certificates with expiry | H\* | api_trainMark, api_certRecord | Jisr, Menaitech | UKG |
| 16 | Learning | Mandatory-training matrix and calendar | H\* | api_trainMatrix; calendar cert_expiry / training_missing | — | Workday |
| 16 | Learning | E-learning content (LMS) | M | — | Jisr, ZenHR (Classera) | Workday, HiBob |
| 16 | Learning | HRDF / Qiwa L&D report | P | hours and cost per person in api_trainMatrix; no official format | — | — |
| 17 | Compensation | Pay equity report | H | Reports.gs pay_equity | — | — |
| 17 | Compensation | Review cycle (bands, budget, merit) | M | — | Jisr (benchmarking) | HiBob, BambooHR, Workday |
| 17 | Compensation | Salary benchmarking | M | — | Jisr | ADP |
| 18 | Talent | Succession, 9-box, talent pools | M | — | — | SAP, Oracle, Workday |
| 18 | Talent | Career paths and internal mobility | M | — | Menaitech | SAP |
| 19 | Engagement | Anonymous pulse survey | P | Engage.gs fixed eNPS + 5; no builder | Jisr, Bayzat | Workday, HiBob |
| 19 | Engagement | Recognition / kudos | M | — | — | HiBob, ADP |
| 19 | Engagement | Policies with versioned acknowledgement | H | Engage.gs:api_policySave/Ack | — | — |
| 20 | Communication | Announcements with audience, pinning, acknowledgement | H\* | Announce.gs | Jisr, Bayzat | HiBob, Personio |
| 20 | Communication | In-app bell (tasks) | H | Compliance.gs:api_myTasks (+ Wave 2 hooks) | all | all |
| 20 | Communication | E-mail / WhatsApp / push notifications | M | needs the external-request scope | Jisr | all |
| 21 | HR service | Letters (salary, employment, experience) | H | Leave.gs LETTERS | Menaitech | — |
| 21 | HR service | Help desk tickets, queues, SLA, internal notes | H\* | HelpDesk.gs | Jisr (bot), Bayzat | Oracle, ServiceNow-class |
| 21 | HR service | Confidential conduct reporting channel | H\* | HelpDesk.gs queue hr_confidential | — | — |
| 21 | HR service | Knowledge base / chatbot | M | — | Jisr (AI bot) | Oracle, Darwinbox |
| 22 | Relations | Discipline with penalty table and Art. 72 objection | H | Relations.gs | — | — |
| 22 | Relations | Work injuries with the GOSI deadline | H | Relations.gs:api_injuryReport | — | Oracle |
| 23 | Assets | Custody register, acknowledgement, charges | H | Custody.gs | Jisr, Palm | UKG |
| 24 | Self-service and workflow | Bilingual PWA self-service | H | index.html, js/my-file.js | all | all |
| 24 | Self-service and workflow | Approvals centre, configurable chains, SLA, delegation | H | Flows.gs, Compliance.gs:api_delegationSave | Jisr, Bayzat | Workday |
| 24 | Self-service and workflow | Visual workflow designer for any form | P | approval chains per request type only | Jisr, Bayzat | Rippling, Workday |
| 24 | Self-service and workflow | Native apps | M | PWA | Jisr, ZenHR, Menaitech | HiBob |
| 24 | Self-service and workflow | E-signature (Nafath) | P | in-app acknowledgements only | — | Deel, BambooHR |
| 25 | Reporting | Report catalogue with fingerprinted exports | H | Reports.gs (64 reports) | all | — |
| 25 | Reporting | Dashboard and workforce analytics | H | Dashboard.gs | Jisr, Bayzat, Menaitech | UKG, Workday |
| 25 | Reporting | Report builder, pivot, saved views | M | — | Jisr, Bayzat | Rippling |
| 25 | Reporting | Scheduled reports | M | needs triggers | — | Workday |
| 25 | Reporting | History snapshots and drill-down | P | period compare only | — | Workday |
| 25 | Reporting | Recruitment, training and insurance analytics | P | module boards (recruitBoard, trainMatrix, insCost); not in the report catalogue yet | Jisr | all |
| 26 | Platform | Audit trail incl. salary views | H | Code.gs:audit_ | — | — |
| 26 | Platform | Passkey sign-in, device binding | H | WebAuthn.gs | Jisr (MFA) | — |
| 26 | Platform | SSO (Entra ID / Google) | M | — | Jisr | ADP, Workday |
| 26 | Platform | Public API and webhooks | M | — | ZenHR, Palm (Zapier) | HiBob, BambooHR |
| 26 | Platform | Multi-tenant SaaS in KSA | P | designed, platform/ in progress | Jisr | — |
| 26 | Platform | Full company export and deletion | M | — | Jisr | — |

## 3. Prioritised build list

The six P1 items marked built today are backend and tests only; each needs its screens from the designer.

| Pri | Item | KSA relevance | Status |
|---|---|---|---|
| P1 | Recruitment, from requisition to hire | Every Saudi competitor sells it. It enforces Saudi-only jobs (localisation), Art. 37/53/109 checks on offers, PDPL consent and erasure, and Jadarat as a tracked source. | **built 2026-10-14** |
| P1 | Employee loans | Art. 92 consent and the Art. 93 cap. ZenHR, Menaitech and Palm have loans. | **built** |
| P1 | Training and certificates | Civil-defence, dangerous-goods and forklift certificates for LPG staff, with expiry in the calendar. HRDF / Qiwa L&D. | **built** |
| P1 | Medical insurance (CCHI) | Cover is mandatory, and iqama renewal needs it. Bayzat and ZenHR have this. | **built** |
| P1 | Announcements | Jisr and Bayzat have it. | **built** |
| P1 | HR help desk with a confidential channel | The anti-harassment policy needs a channel. Jisr and Bayzat have it. | **built** |
| P1 | Notifications by e-mail and WhatsApp | Buyers expect them. They need the external-request scope and an owner re-authorise. | missing |
| P1 | Hourly permission and overtime pre-approval | Daily Saudi practice; Art. 107 overtime. | missing |
| P1 | Enforce resignation deemed acceptance (2025) | Required by the 2025 amendment. | partial |
| P2 | File attachments | These need a Drive scope; bundle it with the notifications deploy. | missing |
| P2 | Off-cycle, final-pay and retro runs | Final settlement inside payroll; GOSI arrears. | missing |
| P2 | Compensation review cycle | Annual increments. | missing |
| P2 | Custom fields | Needed for SaaS customers. | missing |
| P2 | Report builder; Wave 2 reports in the catalogue | Owner must-have. | missing |
| P2 | Timesheets, overnight shifts, biometric devices | Plants and 24-hour stations. | missing |
| P2 | Exit survey, recognition, survey builder | Engagement. | missing |
| P2 | Insurer files (Tameeni), Jadarat posting links | Integrations. | missing |
| P3 | Mudad, GOSI, Qiwa and Muqeem APIs | Partner agreements needed. | missing |
| P3 | SSO, public API, webhooks | Enterprise and SaaS buyers. | missing |
| P3 | Succession, OKRs, career paths, LMS content, native apps, Nafath | Larger customers. | missing |

## 4. What was built today (backend + tests)

| File | Tabs | Refs | Actions | Test suite |
|---|---|---|---|---|
| Recruitment.gs | requisitions, candidates, interviews, offers | RQ, CND, INT, OFR | 17 | tests/recruitment.js: 67 |
| Loans.gs | loans | LN | 10 | tests/loans.js: 46 |
| Training.gs | courses, trainSessions, trainEnrol | CRS, TRS, CRT | 11 | tests/training.js: 42 |
| Insurance.gs | insPolicies, insMembers, insMoves | INP, INS | 9 | tests/insurance.js: 36 |
| Announce.gs | announcements, annReads | ANN | 6 | tests/announce.js: 25 |
| HelpDesk.gs | hdTickets | HD | 8 | tests/helpdesk.js: 37 |

Shared changes:
- Code.gs gained the tabs, headers, refs, action maps and the `loanPolicy` setting.
- Code.gs also gained `hrisHook_` and `hrisHooks_`. Compliance.gs reads them in myTasks and the calendar, so a new module can
  add bell and calendar items without editing Compliance.gs again.
- Payroll.gs got the loan instalment hook, the Art. 93 deferral order (advance, loan, other deduction, fine) and loans in
  the EOS settlement.
- Journal.gs credits loan lines to the advances receivable.
- tests/sim50.js gained the access-matrix expectations.

## Sources (new in this pass)

- Jisr feature overview: https://www.jisr.net/en/features ; https://jisr.net/en
- ZenHR (loans, insurance deductions, ZenATS): https://www.zenhr.com/en/hrms-saudi-arabia ; https://blog.zenhr.com/en/what-is-zenhr-the-most-secure-fully-localized-hr-software-in-mena
- Bayzat (insurance, announcements): https://bayzat.com/features ; https://www.bayzat.com/individual-contributors
- HiBob (Bob Hiring, Bob Learning), Rippling, Personio: https://www.outsail.co/post/bamboohr-vs-rippling-vs-hibob-best-hris-for-companies-with-50-300-employees ; https://www.remotelytalents.com/blog/personio-review-features-pricing-competitors
- Earlier evidence: docs/research/2026-10-04-feature-gap-matrix.md and 2026-10-08-ksa-hris-documentation-study.md.
