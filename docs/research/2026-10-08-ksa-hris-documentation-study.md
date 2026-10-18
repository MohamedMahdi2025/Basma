# KSA HRIS documentation study: what the Saudi leaders actually document (2026-10-08)

**Status:** COMPLETE 2026-10-14 (vendor notes 2026-10-08; Workday/SAP, the statutory comparison, the code audit and the
gap table added 2026-10-14, see the last four sections).

**Question.** The owner wants the strongest HRIS in KSA. The 2026-10-04 matrix
(`2026-10-04-feature-gap-matrix.md`) compared 96 sub-features from product pages. This study goes one level deeper:
the vendors' **help centres and release notes**, and the **government platforms** an HRIS has to work with
(Mudad, Qiwa, GOSI, Muqeem, the Labour Law, PDPL).

**Rules used here.**
- Every vendor claim has a URL. "unverified" = I could not read a primary page that says it.
- Help-centre pages describe what a feature does; they do not prove how well it works.
- Not found = not found in this pass, not proof of absence.
- Jisr's Zendesk help centre (jisr.zendesk.com) returns HTTP 403 to automated reads. Jisr help-centre facts below come
  from the search engine's index of those articles (title + indexed text), marked "(help-centre index)".

---

## Vendor notes

### Jisr (jisr.net), Riyadh

Modules (features page, [jisr-f]): Core HR (multi-entity, org chart, pre-boarding, contract automation, probation
tracking), Payroll (custom payroll groups by project / pay type / nationality / entity, accounting integration, overtime,
EOS), T&A (geofence + biometric devices, shift scheduler, Ramadan/summer hours, mobile punch), Compliance (GOSI, Saned,
Muqeem, Mudad; **Qiwa still "coming soon"** on [jisr-comp]), Recruitment (AI CV parsing and ranking, career portal,
Google Meet / Outlook / Zoom), Performance (cycles; 360 "coming"), Engagement (announcements, surveys, eNPS, "Jisri" AI bot),
Learning (Arabic courses, Qiwa compliance reports, Lumofy), Spend (expenses with **OCR receipt scanning** in the app,
business travel with flight booking). Menu also lists Salary Benchmarking, Workforce planning, Journal hub, Payments.

| Area | What the documentation says | Source |
|---|---|---|
| Mudad / WPS | "Integration with Mudad to process payroll payments" (2023); "You won't need to upload the bank file"; generates Mudad WPS files | [jisr-comp], [jisr-run-payroll] |
| GOSI | Add Saudi / non-Saudi employee, update wage, edit data, terminate, from Jisr, "no additional fee" | [jisr-gosi] |
| Muqeem | Iqama renewal, passport extension/renewal, exit re-entry issue/extend/cancel/reprint, final exit issue/cancel, Muqeem reports. Only visas issued **through Jisr** can be managed in Jisr; Muqeem users need privileges on both platforms; exit/re-entry is a field of the leave request, visible only to non-Saudis (help-centre index) | [jisr-muqeem], [jisr-muqeem-kb] |
| Qiwa | "COMING SOON" on the compliance page (Oct 2026 read) | [jisr-comp] |
| Attendance | Geofence circle drawn on a map per location; ZKTeco via BioTime; Jisr clocking devices (fingerprint, PIN, card). **No face/selfie or offline punch found.** Missing punch = shift incomplete, no hours | [jisr-att], [jisr-geo-kb] |
| Leave settlement | "Vacation settlement" = prepaid leave pay chosen on the annual-leave request (days x daily wage of last salary); minimum days setting; Jisr's own FAQ says a full balance cannot be cashed out while employed (help-centre index) | [jisr-vac-kb] |
| Final settlement | Generated when HR terminates the record; unpaid salary + unused leave + EOS - advances/GOSI; paid **off-cycle** citing Art. 88; resignation ladder 0 / 1/3 / 2/3 / full; basis selectable (basic, basic + chosen allowances, full); workday balances converted x30/21 (help-centre index) | [jisr-eos-kb], [jisr-eos-set-kb] |
| Accruals | Retro journal entries for EOS and vacation accrual when salary rises; journals posted to Qoyod as drafts; ERP guide (Odoo, SAP B1, NetSuite, QuickBooks, Xero, Zoho, Dynamics, Qoyod) | [jisr-retro-kb], [jisr-erp] |
| Workflows | Custom request types with fields and **up to 6 approvers**; approval cycles by job title (direct manager, dept manager) or named person, targeted by group; admin direct-approval bypass (manager notified); **automation rule: auto-approve after N days pending and move to next step** | [jisr-custom], [jisr-cycles-kb], [jisr-auto-kb] |
| Release Nov 2025 | Bulk sick-leave approval; centralised audit log (activated by CSM); salary benchmarking with bands and out-of-band alerts; expense policies with multi-step approvals; post-paid travel billing; self-review + upward feedback | [jisr-nov25] |
| Security | "PDPL Compliant"; data on GCP Saudi Arabia or AWS Bahrain; ISO 27001; SOC 2 Type II; 2-step login; SSO SAML 2.0 / OIDC (Okta, Azure AD, Google); Excel or API export | [jisr-sec] |
| Pricing | Basic / Advanced / Enterprise, demo-only; custom requests once "Professional plan" only. Third-party 10-16 SAR per employee per month is **unverified** (Preqin profile, dated) | [jisr-plans], [preqin-jisr] |
| Letters | Letter templates exist (manager help article title); **QR verification not found** | [jisr-mgr-kb] |

### ZenHR (zenhr.com), Amman / Riyadh

| Area | What the documentation says | Source |
|---|---|---|
| Law mapping | Help article maps Labour Law articles to features: Art. 53 probation auto-converts on day 91/181 unless extended; Art. 98 Ramadan reduction driven by the Religion field; Art. 101 shift templates insert the mandatory break after 5 h; Art. 107 overtime 50% of basic (policy can use actual wage); Art. 84-86 EOS with configurable "wage"; **Art. 87 full EOS for a woman resigning within the marriage/birth window**; Nitaqat dashboard and Tawteen reports; tracks Qiwa contract ID and visa quota usage. Many articles (66-72, 109-117, 151-160) are "not mapped" in the article itself | [zen-law] |
| Mudad | "Automatically send employee payroll data to Mudad"; near real-time payment status; cancel or adjust after a batch reached Mudad | [zen-mudad] |
| GOSI | Add Saudi contributors, approve pending non-Saudi contributors, update, terminate (date + reason), import contributors, link employees; **"Salary on GOSI" vs ZenHR salary with a sync icon and bulk "Sync Salary"** | [zen-gosi-kb], [zen-gosi-mkt] |
| Muqeem | Iqama issue / renew / transfer / add existing / import; exit re-entry issue / cancel / extend / reprint; final exit issue / cancel; passport extend / renew. Superadmin activates with the company's **Muqeem username and password**; roles Muqeem Admin / Read-only | [zen-muqeem] |
| Qiwa | Marketing says "100% authenticated digital contracts" and real-time submission to Qiwa; **no help article on how** (unverified mechanism) | [zen-expat] |
| Attendance | Mobile GPS punch with optional geofence and several work sites; **dynamic rotating QR on a shared screen** with Wi-Fi/IP restriction; home-screen widget one-tap punch; ZKTeco via BioTimeCloud (fingerprint, face, iris on the device). No in-app face match, no offline punch found | [zen-att], [zen-ess25] |
| ESS app 2025 | Leave, overtime, missing-punch, loan, reimbursement, letter, custom requests; manager approvals with rejection reason and attachments; "Who's Off"; push notifications; document-expiry, birthday reminders; Altibbi telemedicine; Arabic/English | [zen-ess25] |
| July 2026 release | Employee letter requests with preview and custom fields through approval workflows; competencies linked to positions and succession; business travel with per diem; SOC 2 Type II renewed; 2FA recommended | [zen-2026] |
| Letters | Default and custom templates (Documents > HR Letters > Templates). **QR verification not found** | [zen-letters] |
| Leave encashment | In final settlement and payroll setup (marketing level) | [zen-payroll] |

<!-- SOURCES-JISR-ZENHR (moved to the Sources section at the end when finished) -->
[jisr-f]: https://www.jisr.net/en/features
[jisr-comp]: https://www.jisr.net/en/saudi-compliance-management
[jisr-run-payroll]: https://www.jisr.net/en/run-payroll
[jisr-gosi]: https://www.jisr.net/en/product-updates/integration-with-gosi
[jisr-muqeem]: https://www.jisr.net/en/product-updates/integration-with-muqeem
[jisr-muqeem-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13787054402065-List-of-Muqeem-available-services-on-Jisr
[jisr-att]: https://www.jisr.net/en/attendance-management
[jisr-geo-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13536914327185-Attendance-registration-via-Geofencing-Technology
[jisr-vac-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13350244714641-Vacation-Settlement-Q-A
[jisr-eos-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13340353842193-What-is-meant-by-the-end-of-service-settlement-final-settlement
[jisr-eos-set-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13340428526225-Settings-for-calculating-the-end-of-service-reward-and-annual-leave-balance-entitlements-in-Final-Settlement
[jisr-retro-kb]: https://jisr.zendesk.com/hc/en-sa/articles/37257344096145-Retro-journal-entries-for-EOS-and-vacation-accrual
[jisr-erp]: https://jisr.zendesk.com/hc/en-sa/articles/26593704650897-ERP-Accounting-Integration-with-Jisr-Comprehensive-User-Guide
[jisr-custom]: https://www.jisr.net/en/product-updates/employee-custom-requests-creation-and-authorization
[jisr-cycles-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13401453139729-Self-Service-Request-Approval-Cycles
[jisr-auto-kb]: https://jisr.zendesk.com/hc/en-sa/articles/19294372509073-Workflow-Automation
[jisr-nov25]: https://www.jisr.net/en/product-updates/november-2025
[jisr-sec]: https://www.jisr.net/en/security
[jisr-plans]: https://jisr.net/en/plans
[preqin-jisr]: https://www.preqin.com/data/profile/asset/jisr/566626
[jisr-mgr-kb]: https://jisr.zendesk.com/hc/en-sa/articles/13797128786321-How-Jisr-System-can-help-you-as-a-manager
[zen-law]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features
[zen-mudad]: https://www.zenhr.com/en/marketplace-integration/mudad
[zen-gosi-kb]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000696295-the-general-organization-for-social-insurance-gosi-integration
[zen-gosi-mkt]: https://www.zenhr.com/en/marketplace-integration/general-organization-for-social-insurance-gosi
[zen-muqeem]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000685060-muqeem-native-integration
[zen-expat]: https://blog.zenhr.com/en/expat-management-in-saudi-arabia-2026
[zen-att]: https://www.zenhr.com/en/modules/attendance-and-time-tracking
[zen-ess25]: https://blog.zenhr.com/en/whats-new-on-zenhrs-ess-mobile-app-2025
[zen-2026]: https://blog.zenhr.com/en/new-zenhr-features-security-updates-for-2026
[zen-letters]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000031707-how-to-generate-hr-letters-
[zen-payroll]: https://www.zenhr.com/en/modules/payroll

### Bayzat (bayzat.com/ksa), Dubai / Riyadh

| Area | What the documentation says | Source |
|---|---|---|
| Modules | Time off (team overlaps), attendance, shift scheduler, employee records with expiry notifications, **letter requests in the app**, onboarding/offboarding, ESS; performance, surveys, ATS; payroll, accounting integration, Mudad, Muqeem, **SAB bank integration**; work expenses, corporate cards, payouts; benefits, fitness challenges, perks; "Bayzat Studio" (apps, workflows, task manager, **service desk / employee ticketing** incl. salary certificates); Bayzat AI (knowledge hub, AI reporting, AI assistant) | [bay-f] |
| Attendance | "AI-driven biometric verification using facial recognition", **"liveliness detection"**, employees "take selfies for verification", geofencing, GPS, **shared kiosks**, biometric devices; overtime rules by scenario and group; missed-punch request to manager; corrections keep an audit trail. **Offline not mentioned** | [bay-att] |
| Mudad | "your WPS files will automatically be sent to Mudad" after payroll; pay "at the click of a button" without going to individual banks | [bay-mudad] |
| Muqeem | "initiate actions directly from Bayzat and get real-time updates"; services not listed (unverified detail) | [bay-muqeem] |
| GOSI / insurance | GOSI employee and employer shares automated; group health insurance managed in the platform; the vendor's own 2026 buyer guide calls its benefits "CCHI-aware"; dependants **not documented** | [bay-payroll], [bay-guide] |
| Pricing / residency | Quote-only per employee per month; the vendor's own guide lists "KSA residency on enterprise tier only" as a Bayzat con | [bay-guide] |

The Bayzat 2026 buyer guide ([bay-guide], vendor-written, so a lead not evidence) gives the buyer checklist the market now
uses: (1) native Mudad submission, not CSV upload, demonstrated live; (2) live Nitaqat tracking that forecasts planned
hires and warns before a downgrade; (3) GOSI legacy vs new-law schedules applied automatically; (4) Hijri and Gregorian
natively on payslips, leave and contracts; (5) KSA data residency + PDPL documentation; (6) KSA + UAE in one tenant.
It quotes list prices (all **unverified**): Jisr SAR 17, PalmHR SAR 19, ZenHR SAR 25, Zoho People SAR 6 per employee
per month; Qoyod HR SAR 49 base; Mawared on-premises, project priced.

### Menaitech (menaitech.com), Amman / Riyadh

| Area | What the documentation says | Source |
|---|---|---|
| Suite | Curio (HR and talent), MenaPAY (payroll), MenaTA (time), MenaME (web ESS/MSS), **MenaME-Plus+ (mobile)**, MenaBI (analytics), Mena360, MenaLMS, MenaTrip, MenaSME | [mena-me] |
| ESS / MSS | Employee: salary inquiries, vacation planning, data updates, requests "through approval cycle", **time sheet entry**, career path / IDP / succession tracking, "geographic online punching". Manager: approvals, timesheet approval, candidate screening, **job requisition, workforce plan**, announcements, appraisal, roster | [mena-me] |
| Government | MenaPAY "integrates directly with Mudad"; "integrates fully with GOSI" incl. contributions and statutory reporting; Muqeem (issue, renew, transfer residency; entry/exit records) and **Masdr** (profiled as a GOSI-owned data company [masdr-org], unverified: sync of GOSI employee data, cancellation of subscriptions), June 2023; Qiwa **not mentioned** | [mena-faq], [mena-masdr] |
| Saudization | "Saudization dashboard" with real-time Saudization rate and analytical reports | [mena-faq] |
| Attendance | Biometric or GPS tracking; **Google Maps integration for field workforce** | [mena-faq] |
| Hosting / security | Cloud, on-premises "may be available"; ISO/IEC 27001:2022; claims "Saudi data protection requirements" (PDPL not named) | [mena-faq] |

### Palm HR (palmhr.net), Riyadh

| Area | What the documentation says | Source |
|---|---|---|
| Modules | People (records, onboarding/offboarding, documents, **assets**), Time (mobile check-in/out, **timesheet approval**, shifts), Pay (payroll approval workflows, **expense and loan management**, multi-company, multi-currency, WPS); add-ons performance, project time tracking, recruitment; **outsourced HR / "concierge" doing the government-platform work** (Absher, Mudad, Muqeem, GOSI, Qiwa) for the client | [palm], [palm-concierge] |
| Government | "Seamless connectivity with Qiwa, GOSI, Mudad for compliance reporting" (blog); mechanism (API vs file) **not documented**; the public payroll page reads UAE-first (GPSSA) | [palm-law24], [palm-pay] |
| Pricing (public) | Starter 1,000 AED / year up to 15 employees (no payroll); Core adds payroll (WPS ready), EOS, multiple approval flows; Professional adds multi-company, custom fields and workflows, **public API**, white-label; Enterprise quote. Biometric devices (CAMS, ZKTeco) paid add-on | [palm-price] |
| Attendance | GPS; geofence / selfie **not documented** | [palm-price] |
<!-- SOURCES-BAYZAT-MENA-PALM -->
[bay-f]: https://www.bayzat.com/ksa/features
[bay-att]: https://www.bayzat.com/ksa/attendance
[bay-mudad]: https://www.bayzat.com/ksa/mudad
[bay-muqeem]: https://www.bayzat.com/ksa/muqeem-integration
[bay-payroll]: https://www.bayzat.com/ksa/payroll
[bay-guide]: https://www.bayzat.com/blog/best-hr-software-in-saudi-arabia/
[mena-me]: https://menaitech.com/en-sa/products/mename/
[mena-faq]: https://menaitech.com/en-sa/faqs-sa/
[mena-masdr]: https://menaitech.com/en/news/menaitech-integrates-masdr-and-muqeem-within-its-system-in-saudi-arabia/
[palm]: https://palmhr.net/en
[palm-concierge]: https://palmhr.net/en/concierge/
[palm-law24]: https://palmhr.net/en/resources/changes-to-the-saudi-labor-law-august-2024
[palm-pay]: https://palmhr.net/en/products/pay
[palm-price]: https://palmhr.net/en/pricing

### Workday and SAP SuccessFactors (global suites)

| Area | What the documentation says | Source |
|---|---|---|
| SAP SuccessFactors / SAP HCM | A Saudi payroll country version exists: EOS configuration ("old method" and "new method") under Payroll: Saudi Arabia in SPRO; an SAP KBA covers EOS not generated (wage type /670, rule SA91). KSA partner job posts list GOSI, WPS, EOSB and Labour Law localisation as implementation work, i.e. partner-configured, not out of the box | [sap-eos1], [sap-eos2], [sap-kba], [sap-job] |
| Workday | No public Workday page on KSA payroll, GOSI, Mudad or EOS was found in this pass; Workday KSA payroll is normally run through a partner payroll (PECI/Cloud Connect). **unverified** | (search, no primary page) |
| Takeaway | The global suites win on scale and audit, lose on KSA statutory depth: every GOSI / Mudad / Muqeem / Qiwa piece is a partner project. The local vendors (Jisr, ZenHR, Bayzat) sell exactly those connectors | |

[sap-eos1]: https://blogs.sap.com/2015/12/15/eos-benefit-calculation-with-new-method-for-saudi-arabia-payroll-part-01/
[sap-eos2]: https://blogs.sap.com/2015/12/20/eos-benefit-calculation-with-new-method-for-saudi-arabia-payroll-part-02/
[sap-kba]: https://userapps.support.sap.com/sap/support/knowledge/en/3758669
[sap-job]: https://www.founditgulf.com/job/sap-successfactors-employee-central-payroll-ecp-consultant-ejada-saudi-arabia-59199465

---

## The statutory rules in force on 2026-10-14

| Rule | Value used | Source |
|---|---|---|
| GOSI legacy (registered before 3 Jul 2024) | employee 9 annuity + 0.75 SANED = 9.75%; employer 9 + 0.75 + 2 hazards = 11.75% | [gosi-new], [noqta-gosi] |
| GOSI new law (Royal Decree M/273, first registered from 3 Jul 2024) | annuity +0.5% each side every July 2025-2028: 9.75/11.75 (to Jun 2025), 10.25/12.25 (Jul 2025), **10.75/12.75 (Jul 2026, in force now)**, 11.25/13.25 (Jul 2027), 11.75/13.75 (Jul 2028+). Sources differ on whether the first step was Jul 2025 or Jul 2026; Argaam, Ramco and Payspace support Jul 2025 / Jul 2026 steps as coded | [argaam-gosi], [payspace-gosi], [mercans-gosi] |
| Non-Saudi | employer 2% occupational hazards only | [payspace-gosi] |
| GCC nationals | GOSI collects at the home-country rates (GCC extension of insurance protection) + 2% hazards; rates per country, published tables disagree | [sov-gcc], [lenvica] |
| Contribution wage | basic + housing (cash, or in kind valued at two months' basic a year); other allowances excluded; min 1,500, max 45,000 | [qoyod-cw] |
| Nitaqat | Saudi counts 1 at wage >= 4,000, 0.5 at 3,000-3,999, 0 below | [argaam-nit] |
| Labour Law amendments (Royal Decree M/44, in force 19 Feb 2025) | notice 30 days from the employee / 60 from the employer (indefinite contracts); resignation deemed accepted after 30 days unanswered, deferrable up to 60 days in writing; probation up to 180 days if written; maternity 12 weeks; sibling bereavement 3 days; paternity 3 days; expat contract silent on term = 1 year; Art. 107 overtime may be compensated with paid leave by agreement | [tamimi-25], [ml-25], [qoyod-aw] |
| Unchanged by the 2025 amendments | Art. 2 wage definitions, Art. 84 EOS (last **actual** wage), Art. 92-93 deductions; Art. 70 fines at most 5 days' (actual) wage a month | [qoyod-aw], [qoyod-fine] |

---

## Code audit against those rules (2026-10-14)

Locked by `tests/ksa-law.js` (65 golden numbers worked by hand: EOS at 1.5/2/3/5/7/10/12 years for resignation, termination,
Art. 80 and Art. 87; GOSI per cohort for Jun vs Jul 2026, cap, floor, non-Saudi, GCC, in-kind housing; Art. 107 overtime;
Art. 117 sick tiers; Art. 70 fines; Art. 93 half-wage cap; Art. 109 accrual; Art. 116; Art. 75 notice; Art. 88 due dates).

| # | Finding | Fix |
|---|---|---|
| 1 | `api_eosQuote` paid the award on basic + housing when `eosWageBasis = basic_housing`; Art. 84 + Art. 2 require the last actual wage (Art. 8 voids less favourable terms) | Settlement always on the total wage; warning `eos_basis_below_actual` (Payroll.gs) |
| 2 | Any approved unpaid leave paused annual-leave accrual; Art. 116 suspends the contract only beyond the 20th day | `annualBalance_` pauses only days 21+ (Leave.gs); reports/sim50 expectations updated |
| 3 | Resignation notice took `noticeDays` as is, so 1-29 days was accepted; Art. 75 (2025) floor is 30 | `Math.max(30, noticeDays)` (Leave.gs) |
| 4 | No trace of the 2025 deemed-acceptance rule for resignations | `resignationAcceptBy_` (submission + 30 days), `acceptBy` and `deemedAccepted` on the request (Leave.gs) |
| 5 | GCC nationals were silently treated as expats (0% / 2%) | Warning `gosi_gcc_national` on the slip (Payroll.gs) |
| 6 | Housing in kind was invisible to GOSI (base = basic only) | Warning `gosi_housing_zero` with `info.gosi.inKindWage = basic x 14/12` (Payroll.gs) |
| ok | GOSI rate table, cap, floor, non-Saudi; Art. 107 (hourly actual + 50% basic hourly); Art. 70 on actual wage; Art. 93 with advances deferred first; Art. 92 10% loan warning; Art. 117 30/60/30; Art. 109 21/30; Art. 85 bands; Art. 80/81/87; Art. 88 7/14 days; Art. 53 180 days; Art. 37; maternity 84, iddah 130/15, sibling 3, paternity 3 within 7 | no change |

---

## What we still miss (prioritised)

| P | Gap | Why it matters | Who has it |
|---|---|---|---|
| P1 | EOS provision (`calcSlip_`), dashboard and reports liability still follow `eosWageBasis`; with basic_housing they understate the liability | Accounts and board figures below the legal amount | Jisr (basis selectable, but defaults full) |
| P1 | Mudad / WPS: file only, no API submission or payment-status read-back; template to confirm with the bank | Buyer checklist item 1; WPS non-compliance blocks Qiwa services | Jisr, ZenHR, Bayzat, Menaitech |
| P1 | GOSI: no register/update/terminate connector; no in-kind housing flag on the package; GCC home-country rates not modelled (warning only) | Wage drift between payroll and GOSI = penalties | Jisr, ZenHR (salary-on-GOSI sync) |
| P1 | Resignation auto-acceptance is shown, not enforced: no task at day 25, no automatic approval at day 30, no 60-day written deferral | 2025 amendment | Jisr (auto-approve after N days) |
| P2 | Art. 77 compensation for termination without a valid reason (15 days per year, min 2 months; fixed term: remaining term) and employer 60-day notice pay in the EOS quote | Final settlement incomplete on unfair dismissal | Labour courts' standard; none documented by vendors |
| P2 | Maternity pay by service (Art. 151: half pay at 1-3 years, full from 3) not applied on the payslip | Over/under payment risk | ZenHR (article map) |
| P2 | Overtime compensated with paid leave (Art. 107 as amended) | 2025 option | none documented |
| P2 | Expat contract with no end date: default 1 year (2025) | Contract register accuracy | ZenHR (Qiwa contract tracking) |
| P2 | GOSI part-month: contributions prorated by paid days; confirm with GOSI whether the month of joining/leaving is charged in full | Small reconciliation differences | n/a |
| P3 | Qiwa contract authentication and Muqeem connectors (manual today) | Workload | Jisr (Muqeem), ZenHR (both), Menaitech |
| P3 | Nitaqat forecast before a hire or exit (we show the current weighted %) | Buyer checklist item 2 | Bayzat guide, ZenHR |
| P3 | Hijri dates on payslips and contracts (only on printed reports today) | Buyer checklist item 4 | Bayzat guide |

[gosi-new]: https://saudipedia.com/en/social-insurance-law-in-saudi-arabia
[noqta-gosi]: https://noqta.tn/en/blog/gosi-contribution-rate-salary-deduction-saudi-2026
[argaam-gosi]: https://www.argaam.com/en/article/articledetail/id/1824657
[payspace-gosi]: https://payspace.com/blog/saudi-arabia-gosi-contribution-rates-increase-1-july-2026-new-employee-employer-rates
[mercans-gosi]: https://mercans.com/resources/statutory-alerts/saudi-arabia-new-social-security-law-3-july-2025
[sov-gcc]: https://www.sovereigngroup.com/news/gcc-nationals-pension-contributions-across-the-gcc/
[lenvica]: https://lenvica.com/gosi-general-organization-for-social-insurance-in-saudi-arabia/
[qoyod-cw]: https://www.qoyod.com/en/glossary/contributory-wage/
[argaam-nit]: https://www.argaam.com/en/article/articledetail/id/1460333
[tamimi-25]: https://turtl.tamimi.com/story/amendments-to-labour-law
[ml-25]: https://www.morganlewis.com/pubs/2024/08/key-amendments-to-the-kingdom-of-saudi-arabia-labour-law-announced
[qoyod-aw]: https://www.qoyod.com/en/glossary/actual-wage/
[qoyod-fine]: https://www.qoyod.com/en/glossary/disciplinary-fine/

Caveat: the HRSD (hrsd.gov.sa) and GOSI portals did not return the law texts to automated reads in this pass; the rule
table rests on law-firm and payroll-vendor summaries that agree with each other. Re-check against the official texts
before a legal opinion relies on it.