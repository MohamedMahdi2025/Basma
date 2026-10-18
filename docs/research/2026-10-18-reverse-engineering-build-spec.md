# Reverse-engineering build spec: what the leading HRIS have that we do not (2026-10-18)

**Mode:** benchmark a product (public material studied for ideas, re-expressed as our own features; no vendor assets copied).
**Goal:** one ordered build list for `bestgas-attendance`. Each item maps onto Apps Script actions, Sheet tabs and a screen.
**Evidence used:**
- Vendor studies already in this folder:
  - `2026-10-03-documentation-benchmark.md`
  - `2026-10-04-feature-gap-matrix.md`
  - `2026-10-08-ksa-hris-documentation-study.md` (Jisr, ZenHR, Bayzat, Menaitech, Palm HR, with sources)
  - `2026-10-14-module-gap-audit.md` (26 families, 116 sub-features; Workday, SAP, Oracle, Rippling, HiBob, Personio, Deel)
- Code read today: `backend/*.gs` action maps and `index.html` AREAS.
- A live timing of the backend, taken today.

**Legend:** O = observed (in vendor docs or our code); I = inferred.

## 1. Where we stand (O, from code)

- **Built:** 27 backend files and about 260 actions. Since 2026-10-18 every Wave 2 module (recruitment, loans, training,
  insurance, announcements, help desk) has screens, and the 2025 resignation deemed-acceptance rule is enforced.
- **Still missing or partial:** 40 sub-features. Grouped by what they need:

| Group | Items | Needs |
|---|---|---|
| A. Buildable now (no owner action) | hourly permission, overtime pre-approval, timesheet approval before payroll lock, overnight shifts, rotations and swaps, team-calendar overlap warning, carry-over caps and encashment, off-cycle / final-pay / retro runs, compensation review cycle, exit interview, recognition, survey builder, travel requests and per diem, visual org chart, headcount plan, continuous 1:1s and goals, knowledge base, Art. 77 compensation, custom fields, report builder | code only |
| B. Needs a Google scope and an owner re-authorise | e-mail and WhatsApp notifications, payslip e-mail, file attachments (Drive) | owner click in the Apps Script editor |
| C. Needs a partner or hardware | Mudad, GOSI, Qiwa and Muqeem APIs; Tameeni; biometric devices; LMS content; CV parsing | contracts, devices |
| D. Needs hosting | speed (see section 3), multi-entity, SSO, public API | the platform server |

## 2. Wave 3 build order (group A)

Each row gives the module, then the source, tabs, actions and screen.

| # | Module | Seen in (O) | Tabs | Actions | Screen |
|---|---|---|---|---|---|
| 1 | Hourly permission (استئذان) | KSA practice; Jisr request types | `requests`, type `permission` | existing request engine: quote checks the date, from/to time, monthly hours cap (setting) | the New request page, "Permission" |
| 2 | Overtime pre-approval | Jisr; Workday | `requests`, type `overtime` | manager then HR; on approval writes an `overtime_hours` adjustment for payroll (Art. 107, 150%) | the New request page, "Overtime" |
| 3 | Exit interview | Jisr, Workday, HiBob | `exitSurveys` | `exitSurveyOpen` (from offboarding), `exitSurveySubmit`, `exitSurveyResults` (HR, at least 5 for themes) | card in the profile; section in offboarding |
| 4 | Recognition (kudos) | HiBob, ADP | `kudos` | `kudosSend`, `kudosFeed`, `kudosStats` | home card "Thanks"; profile wall |
| 5 | Team calendar overlap warning | Bayzat | none | `requestQuote` warns when more than N% of the team is off | warning on the leave form |
| 6 | Travel requests and per diem | Jisr, ZenHR, Menaitech | `requests`, type `travel` | per diem by city grade (setting); approved travel creates an expense claim | the New request page, "Business trip" |
| 7 | Off-cycle / final-pay run | Jisr; SAP; Oracle | `payrollRuns.kind` | `payrollOffCycle(empIds, reason)` reuses `calcSlip_`; final pay adds EOS and loans owed | Pay → Runs, "Off-cycle run" |
| 8 | Compensation review cycle | HiBob, Workday, BambooHR | `compCycles`, `compProposals` | budget %, a manager proposal per person, HR and payroll approval, then `hrCompPropose` | Growth → "Pay review" |
| 9 | Timesheet approval | Menaitech, Palm | `timesheets` | per month per person: computed from punches, the manager approves, payroll lock requires it (setting) | Time → "Timesheets" |
| 10 | Overnight shifts | Jisr, UKG | `shifts.overnight` | `summarizeDay_` crosses midnight | Shifts form checkbox |
| 11 | Visual org chart | Jisr, Menaitech, HiBob | none | from `hrBootstrap` | People → Org (chart view) |
| 12 | Custom fields | Rippling, HiBob, Personio | `customFields`, `empCustom` | define, then edit per person | Settings and the employee panel |
| 13 | Report builder | owner must-have | `savedReports` | pick a dataset, columns, filters and group; reuse the export kit | Insights → "Build a report" |

## 3. Speed: measured, and what can and cannot fix it

- **Measured today (O):**
  - An empty `ping` to the live web app takes **2.2 to 3.2 s**, with no Sheet read at all.
  - Each Sheet read adds 0.25 to 0.9 s (CLAUDE.md "Speed and live data").
- **What follows (I):** the floor is Google's own redirect and script start-up. No code inside Apps Script removes it.
- **Already done:** one-call reads, the versioned 60 to 300 s tab copies, memory-first screens (`apiFresh`), and
  pre-loading after sign-in.
- **Can still help without the owner:**
  - Optimistic updates on more forms.
  - Fewer round trips per screen (batch reads).
  - A light keep-warm ping while the app is open.
- **The real fix:**
  - Move the backend to the platform in `platform/`: Node + PostgreSQL, stage 3 done, running the same
    `backend/*.gs` through the storage adapter. It answers in milliseconds.
  - It needs the owner's cloud account (GCP me-central2 recommended for PDPL residency); see
    `platform/docs/DEPLOYMENT-KSA.md`.

## 4. Open questions

- **Permission hours cap per month:** Jisr's default is configurable (I). Proposed default: 8 hours a month.
- **Per diem rates:** the company policy is needed (inside and outside KSA, by grade).
- **Timesheets before the payroll lock:** should they be mandatory? Proposed: a setting, off by default.

**Confidence:** high on what we lack (read from our code); medium on how each vendor implements it (from their public
documentation, not hands-on use).

## 5. Update, later on 2026-10-18: what is now built, and the next build list

**Built and live today (O, from our code and the deploy log):**
- permission (PM) and overtime (OT) requests;
- resignation deemed acceptance enforced;
- overnight shifts;
- business trips with per diem (TR);
- final settlement (FS);
- annual pay review (CR);
- timesheets;
- exit interview;
- recognition;
- org chart;
- custom fields and the report builder;
- icons on every tab;
- sign-in redesign;
- laptop check-in fix;
- location prompt;
- print margins.

**Fresh public evidence (O: vendor pages and press, 2026):**
- **Gartner 2026 HCM leaders:** Workday, Oracle, UKG.
  - Oracle pushes agentic AI inside HCM.
  - UKG's strength is workforce management (open shifts, swaps).
- **Jisr 2026:** public careers page for ATS, a redesigned roles and permissions screen, a redesigned GOSI page, and a move into payments, expenses and accounting.
- **Deel:** workforce planning inside the HRIS.
- **ZenHR:** earned-wage access (a partner product).
- **Bayzat:** a live Nitaqat band dashboard (vendor claim).

Sources:
- https://newsroom.workday.com/2026-09-02-Workday-Named-a-Leader-in-2026-Gartner-R-Magic-Quadrant-TM-for-Cloud-HCM-Suites-for-1,000-Employee-Enterprises-for-Eleventh-Consecutive-Year
- https://www.oracle.com/news/announcement/oracle-named-a-leader-in-2026-gartner-magic-quadrant-for-hcm-suites-2026-09-22/
- https://www.ukg.com/learn/resources/analyst-report/2026-gartner-magic-quadrant-cloud-hcm-suites-1000-employee-enterprises
- https://www.jisr.net/en/product-updates/march-2026
- https://updates.jisr.net/en/whats-new-at-jisr-june-2025
- https://www.zawya.com/en/press-release/events-conferences/leap-2026-sees-launch-of-new-technologies-for-hr-and-financial-operations-472694
- https://www.outsail.co/post/is-rippling-right-for-your-business-2026
- https://www.bayzat.com/blog/?p=26314

**Next build list (code only, no owner action), in order:**

| # | Module | Seen in | Fits into |
|---|---|---|---|
| 1 | Leave year-end: carry-over cap and encashment, plus a team overlap warning on the leave form | Oracle, Bayzat | Leave.gs quote_, a new year-end action |
| 2 | Open shifts and shift swaps (manager approves) | UKG, Jisr | Shifts.gs roster |
| 3 | Public careers page and online application with PDPL consent | Jisr 2026 | Recruitment.gs public action, rate-limited |
| 4 | Workforce / headcount plan by department against approved positions | Deel, Workday | positions + requisitions |
| 5 | 1:1 meetings and continuous goals between review cycles | HiBob, Workday | Performance.gs |
| 6 | Survey builder (custom questions, anonymity kept) | Workday, HiBob | Engage.gs surveys |
| 7 | HR knowledge base articles shown inside the help desk before a ticket | Oracle, Jisr | HelpDesk.gs |
| 8 | Succession and 9-box (performance x potential) | SAP, Oracle, Workday | Performance.gs |
| 9 | Art. 77 compensation in the settlement | KSA law | Payroll.gs api_eosQuote |
| 10 | Roles and permissions overview screen | Jisr 2026 | Admin.gs, read-only matrix |

**Still blocked:**
- On the owner: e-mail and WhatsApp notifications, file attachments, payslip e-mail (each needs a scope and a re-authorise), and the speed fix (the platform server needs a cloud account).
- On partners or hardware: Mudad, GOSI, Qiwa and Muqeem APIs; Tameeni; earned-wage access; LMS content; biometric devices.
- On a provider key: AI agents.
