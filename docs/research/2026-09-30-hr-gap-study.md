# HR gap study: Best Gas HR vs market leaders (2026-09-30)

**Scope.** Compared the current system (attendance, employee file, leave/requests, payroll, performance, reports, onboarding, pulse, policies, IDP/PIP) against the public feature pages of 15 HCM vendors and against KSA regulatory duties. I checked the code before listing anything: Nitaqat weighting, effective-dated pay, expiry lists, the 2025 leave amendments (paternity 3 days, 12-week maternity, sibling bereavement) and 180-day probation already exist, so they are not gaps.

**Stack limits that shape the effort scores.** Apps Script + one Sheet + a single-page PWA. The only OAuth scope is `spreadsheets.currentonly`. Adding UrlFetchApp or MailApp forces the owner to re-authorise, and until then every request fails (see `CLAUDE.md`). No government portal (Qiwa, Mudad, GOSI, Muqeem) offers an open API to an in-house script. Vendors get in through certified channels, for example Elm's integration services for Muqeem [45]. So wherever this report says "integration" for us, it means **generating the file and reconciling it against an uploaded export**, not calling a live API.

Effort: **S** ≤ 3 days, **M** 1–2 weeks, **L** 3+ weeks. Priority: **P1** must, **P2** should, **P3** later.

---

## 1. KSA regulatory baseline: what the system must cover

| Requirement | Rule | Status here |
|---|---|---|
| Wage Protection (Mudad) | Wages go in a Mudad-format file. The Qiwa contract basic, the GOSI wage and the Mudad basic must match. Late months escalate to Qiwa service freezes and a Nitaqat downgrade [30][31] | Generic bank/WPS rows only. **Gap** |
| Qiwa contract documentation | Since 15 Apr 2026 a Saudi counts toward Nitaqat only if the contract is documented on Qiwa [33]. The unified contract reaches all open-ended contracts from 6 Aug 2026 [34] | Qiwa fields stored, no documentation status. **Gap** |
| Work regulations (لائحة تنظيم العمل) | MHRSD has a unified model. Firms with 50+ staff submit their own for e-approval [35][36] | Policy acknowledgement exists, but no approved-regulation record or penalty table. **Gap** |
| Violations & penalties schedule | Art. 66 penalty types. Art. 71: written charge + hearing + minutes. Art. 72: impose within 30 days of discovery / 15 days after the investigation. Fines capped at 5 days' wage a month [39][40] | **Gap**: no disciplinary module |
| Ministry violations schedule | Revised Feb 2026, 24 pages, fines per worker, administrative sanctions [37][38] | Needs a compliance checklist. **Gap** |
| GOSI registration / work injury | Register within 15 days of start [47]. Report a work injury within 3 days [41]. Art. 138 injury wage: 100% for 60 days, then 75% [5] | **Gap**: no injury case or deadline tracking |
| Working-hours rules | Art. 98 Ramadan 6 h/day for Muslims. Art. 101 break after 5 h. Midday outdoor ban 15 Jun–15 Sep, 12:00–15:00 [42][5] | One fixed shift per employee. **Gap** for field staff |
| Nitaqat | SAR 4,000 = 1 Saudi, SAR 3,000–4,000 = 0.5, disabled ×4 (capped) [43][44] | Done (weighting in `Reports.gs`) |
| PDPL (SDAIA) | Employee data is personal data: purpose, retention, access rights, breach duties [46] | Audit log exists. No retention/consent register. **Gap** |
| Muqeem | Iqama renewal, exit/re-entry, final exit are done by the employer [45] | Expiry dates tracked. No exit/re-entry request or tracking. **Gap** |

---

## 2. Gap analysis by module

### Core HR
| Gap | Why it matters here | Vendors | Effort | Pri |
|---|---|---|---|---|
| **Offboarding & clearance (إخلاء طرف)**: asset/custody return, access removal, final-settlement gate, experience certificate (Art. 64) | Final settlements for drivers holding cylinders, vehicles, cash or POS devices must not go out before custody is cleared | Jisr [3], BambooHR [14], Rippling [15], Palm HR [10] | M | P1 |
| **Asset & custody register (العهد)** | Vehicles, handsets, POS devices and uniforms need a signed receipt and a deduction trail | Jisr [3], Darwinbox [21] | S–M | P1 |
| **Disciplinary & investigation module** | Art. 71/72 procedure. A penalty applied without minutes or outside the time limit is void on appeal | ZenHR [5], Jisr [2] | M | P1 |
| Grievance / whistle-blowing case | Required in the work regulations. Lowers labour-court risk | Darwinbox [21], Oracle [27] | S | P2 |
| Headcount / position budget (vacancy control) | Stops unbudgeted hiring, and gives recruitment a source of requisitions | Workday [22], HiBob [11] | M | P3 |

### Time & attendance
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| **Shift rosters & rotating patterns** (multiple shifts, night shifts crossing midnight, swaps) | Delivery and depot staff do not work one fixed 8–5 shift | UKG [29], Jisr [1], ZenHR [4], Personio [16] | M | P1 |
| **Ramadan & summer timing rules** (auto 6 h, midday-ban window) | Legal limits. Overtime is wrong without them | Jisr [2], ZenHR [5] | S | P1 |
| Timesheet approval before payroll lock | Stops disputed overtime reaching the pay run | Palm HR [10], UKG [29] | S | P2 |
| QR / kiosk punch for sites without phones | Some drivers share devices | ZenHR [4] | M | P3 |

### Leave
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| Leave-balance accrual ledger with carry-over / encashment rules and a year-end job | Art. 111 pays accrued leave at exit. Auditors want the ledger, not only the balance | Oracle [28], ZenHR [5] | S–M | P2 |
| **Annual-leave ticket & exit/re-entry request** for expats | Expats go home on annual leave. HR must raise the exit/re-entry visa in Muqeem and track the return date | Bayzat [8], ZenHR [7], Menaitech [9] | S | P1 |
| Team leave calendar with coverage and conflict warnings | Keeps a branch from emptying out in Eid weeks | HiBob [11], Personio [16] | S | P2 |

### Payroll & compliance
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| **Mudad-format WPS file + upload tracker** | The current export is generic. Mudad needs its own template and a monthly compliance % [30] | Jisr [1], ZenHR [6], Menaitech [9], Palm HR [10] | M | P1 |
| **Three-way salary reconciliation (Qiwa ↔ GOSI ↔ payroll)** | A basic-salary mismatch is the top WPS failure cause [31] | Jisr [2], Deel (continuous compliance) [18] | M | P1 |
| **Compliance calendar & alerts engine** (GOSI 15-day registration, injury 3 days, WPS month, contract documentation, iqama/permit, probation end) | One place, with owners and SLAs, instead of scattered expiry lists | Jisr [2], Deel [18] | M | P1 |
| Work-injury case (GOSI occupational hazards) | High risk for an LPG-handling workforce. The 3-day notice and injury pay rules apply | ZenHR [5], GOSI [41] | S–M | P1 |
| Payroll journal to accounting (GL mapping per cost centre) | Odoo is the ledger. Journals are rekeyed by hand today | ZenHR [4], Palm HR [10] | S | P2 |
| Retro pay & off-cycle runs (arrears, final pay) | Mid-month raises and exits | Oracle (GOSI arrears) [28] | M | P2 |
| Expense claims with receipt photo | Driver fuel, tolls and per diems; can be paid through payroll | Jisr [1], Darwinbox [20], Palm HR [10] | M | P2 |

### Talent
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| **Recruitment / ATS lite** (requisition → posting → pipeline → offer → hire into the employee file) | Drivers turn over often. Offers currently live in email. Qiwa offer and contract data can be captured at offer stage | Jisr [1], ZenHR [4], BambooHR [13], Workday [24] | M–L | P2 |
| **Training & certification records** (mandatory safety, civil defence, dangerous-goods and driving licences, with expiry) | LPG handling carries mandatory certifications. Jisr also reports training for Qiwa [1] | Jisr [1], Workday [24], HiBob [11] | M | P1 |
| Micro-LMS (video/PDF course + quiz + completion) | Arabic safety induction for drivers | Jisr [1], HiBob [11] | M | P3 |
| Succession / 9-box on existing ratings | Key-person risk in a small management team | SAP [25], Darwinbox [21] | S | P3 |
| Compensation review cycle (bands, merit budget, manager worksheets, approvals) | Replaces spreadsheet raises. Feeds the pay-equity report already built | HiBob [12], BambooHR [13], Personio [16] | M | P2 |
| Internal job board / mobility | Nice to have at 200 staff | SAP [26] | S | P3 |
| Recognition / kudos | Engagement for field staff | Darwinbox [21], Jisr [1] | S | P3 |

### Benefits
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| Medical insurance (CCHI) enrolment: class, dependants, add/delete, card expiry | Compulsory for staff and expat dependants. Additions and deletions follow hires and exits | Bayzat [8], Palm HR [10] | S–M | P2 |

### Employee self-service & communications
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| **In-app notification inbox + approvals "My tasks"** | Approvers miss requests without a push or email channel | Workday [22], all vendors | S | P1 |
| **Approval delegation / out-of-office** | Approval chains stall when a manager is on leave or Hajj | Workday [23], HiBob [11] | S | P1 |
| HR helpdesk (ticket categories, SLA, FAQ knowledge base) | Cuts WhatsApp traffic to HR | Oracle [27], Darwinbox [19], Workday [24] | M | P2 |
| Announcements / company news | Reaches drivers who do not use email | Jisr [1] | S | P2 |
| E-signature on letters, contracts and warnings (passkey-signed acknowledgement) | Art. 71 needs proof the warning was received. The passkey is already there | Deel [17], BambooHR [14] | S | P1 |

### Analytics, workflow, security, integrations, UX
| Gap | Why | Vendors | Effort | Pri |
|---|---|---|---|---|
| Configurable workflow rules (trigger → actions: tasks, notifications, field updates) | Promotion, transfer and exit each touch 4–6 steps. Wiring every one by hand in code does not scale | Rippling [15], Workday BPF [22], Personio [16] | L | P2 |
| Turnover / absenteeism / cost-per-head trend analytics | Management dashboard shows snapshots, not trends | HiBob [11], ZenHR [4] | S–M | P2 |
| **PDPL register**: data inventory, retention purge job, access-request export, field-level masking | SDAIA enforcement began in 2025 [46] | Deel [18], ZenHR [4] | M | P1 |
| Sandbox / test copy of the sheet | Safe payroll rule changes | HiBob [11] | S | P3 |
| Hijri dates on letters and contracts throughout (already on reports) | Official correspondence | Oracle [28] | S | P3 |
| Offline punch queue | Weak signal at depots | UKG [29] | M | P3 |

---

## 3. Top-15 roadmap

Every item is enforced server-side in `.gs`, Arabic-first with English second, recorded through `audit_()`, and money- or penalty-affecting steps go through maker-checker.

1. **Mudad WPS file generator + monthly WPS tracker (P1, M).** Add `Payroll.gs:api_wpsFile`, which builds the establishment's Mudad/bank template from a locked run (national ID/iqama, basic, housing, other, deductions, IBAN) and validates IBAN checksums and missing IDs before it lets the file out. A `WPS` sheet records each month's upload date, compliance % and the HR maker plus payroll-checker sign-off, and a banner warns from the due date onward. Confirm the exact column template with the bank, because published guides disagree between Excel and XML [30][31].

2. **Three-way salary reconciliation (P1, M).** HR uploads the Qiwa contracts and GOSI wage exports (CSV/XLSX, parsed client-side). The server diffs the basic salary per ID against the employee file and the last run. Each mismatch becomes a task, and a run cannot be approved while blocking mismatches remain (maker-checker override with a reason).

3. **Compliance calendar & alerts engine (P1, M).** Build one `COMPLIANCE` rule table (event, offset, owner role, severity): GOSI registration by hire+15, injury by report+3, WPS month, Qiwa documentation for every Saudi, iqama/permit/passport, probation and contract end. A time-driven trigger (no new scope) writes due items into a "Compliance" dashboard tile and into the notification inbox (#4).

4. **Notification inbox + "My tasks" (P1, S).** Add a `NOTIFY` sheet written by every approval step and rule, a bell badge in the PWA, and a single list of pending approvals across leave, requests, payroll and performance. Email and Web Push come later behind the MailApp/UrlFetch re-authorisation, deployed only when the owner can click authorise.

5. **Approval delegation (P1, S).** A `DELEGATION` row (from, to, start, end, scope) is checked in the approver-resolution function. It is auto-proposed when an approved leave covers an approver. The audit records "approved by X on behalf of Y", and a delegate can never approve their own request.

6. **Disciplinary & investigation module (P1, M).** Load the approved work-regulation penalty table (violation → 1st/2nd/3rd occurrence penalty). Case flow: written charge, then hearing minutes, then decision. The server enforces the 30-day and 15-day limits, the 5-days'-wage monthly deduction cap and the penalty-type whitelist [39]. The employee acknowledges with a passkey. Fines post to payroll as a deduction line that a checker approves.

7. **Offboarding & clearance (P1, M).** An approved resignation or termination opens a checklist: custody items (#8), access, handover, final leave, EOS. The final settlement cannot be locked until clearance is complete. The system generates the Art. 64 service certificate and prompts HR to close GOSI, Qiwa and Muqeem.

8. **Asset & custody register (P1, S–M).** An `ASSETS` sheet (type, serial, plate, value, holder). Issuing or returning an asset needs a passkey acknowledgement from the employee. Damage or loss becomes a deduction proposal, capped by the existing deduction rules and approved by a checker.

9. **Shift rosters, Ramadan & summer rules (P1, M).** Add `SHIFT_PATTERNS` (including overnight shifts) and `ROSTER` (employee × date) that override `shiftOf_()`. Seasonal rules cut Muslim staff to 6 h in Ramadan and flag outdoor field assignments between 12:00 and 15:00 from 15 Jun to 15 Sep [42]. Overtime then uses the rostered hours.

10. **Work-injury case (P1, S–M).** Injury report form (with location from the punch geofence), a 3-day GOSI reporting countdown, a document upload and a status field. Payroll applies Art. 138 injury pay (100% for 60 days, then 75%) instead of sick-leave tiers, with checker approval.

11. **Training & certification records (P1, M).** A `CERTS` sheet with a certificate catalogue tied to positions (mandatory list from the job description) and expiry tracking through #3. Assignment to a zone or role is blocked when a mandatory certificate has expired. Reports show coverage per department.

12. **PDPL controls (P1, M).** Data inventory per sheet column (purpose, legal basis, retention). A nightly purge or anonymise job runs for ex-employees past retention. "Download my data" is added to ملفي, national ID and IBAN are masked by role (extending the existing IBAN masking), and access requests go to the audit log.

13. **Expat mobility: exit/re-entry & annual ticket (P1, S).** A new request type that captures travel dates, visa type and ticket entitlement. HR marks "issued in Muqeem" with the visa number. The system alerts on non-return (Art. 80 absence rule) and posts the ticket allowance to payroll.

14. **Compensation review cycle (P2, M).** Salary bands per position grade, a budget per department, and manager worksheets pre-filled with rating and compa-ratio. The approval chain runs HR → Controller. Approved changes write effective-dated compensation rows, reusing the existing mechanism. Every change must also be mirrored in Qiwa (links to #2).

15. **Recruitment lite (P2, M–L).** Requisitions (reusing positions/JDs), a candidate pipeline kept in HR-only sheets, and an Arabic public apply form as a separate static page posting to the script. The offer letter reuses the letter engine. "Hire" creates the employee file, onboarding checklist and activation code in one step.

**Suggested order.** Months 1–2: 1–5 (pay and compliance, plus the task inbox). Months 3–4: 6–10 (people risk). Months 5–6: 11–15.

---

## Sources

1. Jisr features: https://www.jisr.net/en/features
2. Jisr compliance: https://www.jisr.net/en/saudi-compliance-management
3. Jisr offboarding & assets: https://updates.jisr.net/en/updates-on-offboarding-assets-management
4. ZenHR KSA: https://www.zenhr.com/en/hr-software-saudi-arabia
5. ZenHR labour-law mapping: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features
6. ZenHR Mudad: https://www.zenhr.com/en/marketplace-integration/mudad
7. ZenHR Muqeem: https://www.zenhr.com/en/marketplace-integration/muqeem
8. Bayzat Muqeem: https://www.bayzat.com/ksa/muqeem-integration
9. Menaitech MenaME: https://menaitech.com/en-sa/products/mename/
10. Palm HR People: https://palmhr.net/en/products/people
11. HiBob features: https://www.hibob.com/features/
12. HiBob compensation: https://www.hibob.com/platform/planning/compensation/
13. BambooHR compensation: https://www.bamboohr.com/platform/compensation/
14. BambooHR onboarding/e-sign: https://www.bamboohr.com/platform/onboarding/
15. Rippling workflows: https://www.rippling.com/platform/workflows
16. Personio shift/leave update: https://www.tipranks.com/news/private-companies/personio-expands-hr-platform-with-advanced-shift-and-leave-management
17. Deel documents & e-signatures: https://www.deel.com/blog/how-deel-consolidates-hr-documents-contracts-esignatures/
18. Deel compliance: https://www.deel.com/solutions/compliance/
19. Darwinbox helpdesk: https://darwinbox.com/en-us/products/employee-helpdesk
20. Darwinbox travel & expense: https://darwinbox.com/en-us/products/travel-and-expense
21. Darwinbox HRMS features: https://blog.darwinbox.com/advanced-hrms-features
22. Workday business process framework: https://doc.workday.com/workday-education/en-us/course-manuals/hcm-core-for-administrators/business-process-framework.html
23. Workday delegation: https://doc.workday.com/admin-guide/en-us/manage-workday/business-processes/delegate-business-processes/cxi1568047444210.html
24. Workday talent suite: https://www.workday.com/en-us/pages/cb/hcm-talent-management.html
25. SAP SuccessFactors succession: https://learning.sap.com/learning-journeys/explore-sap-successfactors-solutions/managing-succession-with-sap-successfactors-succession-management_f385d75b-647a-46c7-bb5e-0c63cabd4e18
26. SAP Opportunity Marketplace: https://www.sap.com/products/hcm/opportunity-marketplace.html
27. Oracle HR Help Desk: https://www.oracle.com/human-capital-management/hr-help-desk/
28. Oracle Saudi payroll (GOSI arrears): https://docs.oracle.com/en/cloud/saas/human-resources/22d/faisa/gosi-arrears.html
29. UKG Pro WFM: https://www.ukg.com/products/ukg-pro-workforce-management
30. HRSD WPS upload (Mudad): https://www.hrsd.gov.sa/en/ministry-services/services/wage-protection-file-upload-service
31. Snad Mudad/WPS guide: https://www.snad.io/en/blog/mudad-wps-hamayat-ujur-saudi
32. Gulf News, WPS violations: https://gulfnews.com/world/gulf/saudi/saudi-arabia-flags-unreasonable-wages-and-delayed-payments-as-payroll-violations-1.500233626
33. EIG, Qiwa documentation & Nitaqat: https://eiglaw.com/saudi-arabia-saudization-updates-qiwa-contract-documentation-impacts-nitaqat-calculations/
34. Clyde & Co, unified contract: https://www.clydeco.com/en/insights/2026/02/ksa-launches-unified-employment-contract-initiatve
35. HRSD electronic regulation approval: https://www.hrsd.gov.sa/en/ministry-services/services/972477
36. People Matters, unified work-regulations model: https://me.peoplemattersglobal.com/news/strategic-hr/saudi-arabias-hr-ministry-tightens-labour-laws-48588
37. HRSD, violations schedule amended: https://www.hrsd.gov.sa/en/media-center/news/%D8%AA%D8%B9%D8%AF%D9%8A%D9%84-%D8%AC%D8%AF%D9%88%D9%84-%D8%A7%D9%84%D9%85%D8%AE%D8%A7%D9%84%D9%81%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D8%B9%D9%82%D9%88%D8%A8%D8%A7%D8%AA
38. MRRORS summary of the 2026 schedule: https://www.mrrors.org/2026/05/saudi-arabia-revises-its-schedule-of-violations-and-penalties-for-work-violations/
39. HRSD disciplinary rules: https://www.hrsd.gov.sa/en/knowledge-centre/articles/320
40. Qiwa disciplinary penalties: https://qiwa.sa/en/labor-education/disciplinary-penalties
41. GOSI occupational hazard: https://www.gosi.gov.sa/GOSIOnline/Occupational_Hazard&locale=en_US
42. SPA, midday outdoor work ban: https://www.spa.gov.sa/en/N2612867
43. Qoyod Nitaqat calculator: https://www.qoyod.com/en/calculators/nitaqat-calculator/
44. SPA, SAR 4,000 Nitaqat wage: https://www.spa.gov.sa/en/e6780322f3
45. Motaded, Muqeem employer workflows: https://motaded.com.sa/platforms/muqeem
46. SDAIA data protection: https://sdaia.gov.sa/en/Research/Pages/DataProtection.aspx
47. Safwa, GOSI registration: https://safwahr.com/gosi-registration-and-compliance-2026-employers-complete-guide/
48. Al Tamimi, 2025 labour-law amendments: https://www.tamimi.com/news/key-amendments-to-saudi-arabias-labour-law/

*Caveats.* Some rule details come from vendor or law-firm summaries rather than the gazette: WPS escalation days, GOSI late-registration penalties, the 50-staff regulation threshold and Art. 138 injury pay. Confirm them against the HRSD, Qiwa and GOSI originals before encoding them as hard rules. Rippling, Personio and BambooHR blocked direct fetches, so their rows rely on search-indexed product pages.
