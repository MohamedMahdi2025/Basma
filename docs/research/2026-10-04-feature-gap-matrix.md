# Feature and integrations gap matrix, with a prioritised build backlog (2026-10-04)

**Question from the owner:** many functions and integrated tools seem to be missing, compared with the strongest HR systems in the
world and in KSA. List every gap, say what is feasible for us, and give engineers a backlog they can start from.

**Inputs.**
- Our system: `CLAUDE.md`, the guide `docs/guide/bestgas-hr-system-guide.md`, the 15 files in `backend/*.gs`, the client modules in
  `js/` and the live `AREAS` list in `index.html`. I checked the code directly where it mattered (for example
  `Payroll.gs calcSlip_` and `js/payroll.js slipHtml/printSlip`).
- The competitors' public product pages, help centres and integration pages. Every claim about another product has a link
  (see Sources).
- Earlier studies: `2026-09-30-hr-gap-study.md`, which this one extends, and
  `2026-10-03-documentation-benchmark.md`.

**Skills used:**
- product-management:competitive-brief, for the matrix, the honesty rules and the strategic implications;
- product-management:write-spec, for the backlog specs (P0/P1/P2, acceptance-style detail);
- earlier in this session: engineering:documentation, design:ux-copy and anthropic-skills:documentation-template.

**Limits.**
- Vendor feature pages are marketing. "✓" means the vendor documents the feature publicly. It says nothing about how well the
  feature works.
- "—" means I did not find it in this pass. It does not prove the vendor lacks it.
- Several sites blocked automated reading: SAP, Oracle, Rippling and Personio product pages, the Jisr and Bayzat Zendesk centres
  and trust centres. For those I used search-indexed pages or secondary summaries, and marked them.
- **Sejel** is not an HR product that I could find. The only match is Sejel Technology, an IT-services company in Jeddah
  ([sejeltech.com][sejel]). I added the other Saudi HR and payroll names that buyer guides list instead (§1.3).
- Legal points are flagged **verify** where only secondary sources support them.

**Scale used for effort:** S ≤ 3 days · M 1-2 weeks · L 3+ weeks, for one engineer on the current stack.

---

## 0. Answer in one page

- **Where we stand.** Across 96 sub-features in 17 module families:
  - **33 Have**, 20 Partial and 43 Missing;
  - we already match the Saudi leaders on the legal core: leave law, GOSI cohorts, EOS, Nitaqat, WPS file, compliance calendar,
    discipline, custody and clearance;
  - we are ahead on anti-fraud check-in (passkey plus geofence plus risk flags) and on evidence (maker-checker everywhere,
    numbered SHA-256 reports with QR).
- **Where we lose deals today.** The missing modules fall in six groups:
  1. Spend: expenses, travel, tickets.
  2. Government services: Muqeem / exit-re-entry and live Mudad / GOSI submission.
  3. Benefits: medical insurance and dependants.
  4. Talent acquisition and learning.
  5. Communication: e-mail, WhatsApp, announcements.
  6. Platform: custom fields, a workflow designer, a report builder, an API and SSO.

  Jisr, ZenHR and Bayzat all publish most of these. See §1.
- **The owner's four must-haves.** All four are **Partial** today:

| Must-have | Today (evidence) | Backlog |
|---|---|---|
| Payslip shows company cost: employer GOSI, monthly EOS accrual, total cost | Employer GOSI is computed (`out.gosiEmployer`, Payroll.gs l.133) and shown only as a note under the payslip (`js/payroll.js` l.100). There is no EOS accrual per month (EOS liability exists only as a dashboard snapshot) and no "total cost to company" line. | **P0-2** |
| GOSI wage differs from gross | The GOSI base is always recomputed as `basic + housing`, capped 1,500-45,000 (Payroll.gs l.130). There is no stored, effective-dated "GOSI registered wage", no override, and it is not shown on the payslip. Reconciliation only reports mismatches. | **P0-3** |
| Premium print design for every document | Printable today: payslip, three letter types, EOS settlement, reports (watermark, QR, Hijri) and one ops document. Each has its own CSS. No shared kit; no QR or verification except on reports; most documents (contracts, offers, discipline, custody receipts, approvals, profile sheet) have no print at all. | **P0-4** |
| Deep reporting | 19 fixed reports, a dashboard, workforce analytics, and numbered exports with a fingerprint. There is no report builder, pivot, saved views, drill-down from charts, monthly history snapshots or scheduled reports. | **P0-5**, **P1-14** |

- **The first 11 builds (P0, about 10-12 engineer-weeks):**
  1. Art. 72 grievance fix.
  2. Company cost and EOS accrual on the payslip.
  3. GOSI registered wage.
  4. Print kit.
  5. Report builder, drill-down and snapshots.
  6. Odoo journal.
  7. Attachments.
  8. Expenses.
  9. Exit/re-entry, Muqeem tracker and tickets.
  10. E-mail and WhatsApp notifications.
  11. Exact bank and Mudad files.

  The full list is in §3.

---

## 1. Feature matrix

**Legend.**
- **Ours:** **H** have · **P** partial · **M** missing · ★ an owner must-have.
- **Saudi/Gulf columns:** [✓] documented publicly (the link is the evidence) · — not found.
- **Global column:** examples, with links.

### 1.1 Talent acquisition, onboarding, core HR

| # | Feature | Ours | Jisr | ZenHR | Bayzat | Menaitech | Palm HR | Global leaders (examples) |
|---|---|---|---|---|---|---|---|---|
| A1 | Job requisitions and approval | **M** | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] | [✓][palm] | Oracle Recruiting [↗][ora-mods]; SAP Recruiting [↗][sap-suite] |
| A2 | Careers page and job posting (LinkedIn, Jadarat) | **M** | [✓][jisr-f] | [✓][zen-int] | — | — | — | Workday [↗][wd-hcm] |
| A3 | Candidate pipeline, CV parsing, interview scheduling | **M** | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] | [✓][palm] | UKG [↗][ukg-guide]; ADP [↗][adp-wfn] |
| A4 | Offer letter and one-click hire into the employee file | **M** | [✓][jisr-f] | — | — | — | — | BambooHR (onboarding + e-sign) [↗][bhr-onb] |
| B1 | Onboarding plan with owners and due dates | **H** (ONB, 18 tasks, Engage.gs) | [✓][jisr-f] | — | [✓][bay-f] | — | [✓][palm] | SAP Onboarding [↗][sap-suite]; HiBob [↗][hb-f] |
| B2 | Pre-boarding portal: documents collected and signed before day 1 | **M** | [✓][jisr-f] | — | — | — | — | BambooHR [↗][bhr-onb] |
| B3 | Offboarding and clearance gated on custody return | **H** (CLR + AST, Custody.gs) | [✓][jisr-off] | — | [✓][bay-f] | — | [✓][palm] | Rippling [↗][rip-wf] |
| C1 | Employee file with effective-dated job history | **H** (Hr.gs) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] | [✓][palm] | all suites |
| C2 | Org chart | **P**: department tree and an "by manager" list view; no visual chart or print | [✓][jisr-f] | — | — | [✓][mena-me] | — | Workday [↗][wd-hcm] |
| C3 | Several legal entities or CRs in one account | **M** | [✓][jisr-f] | — | — | — | [✓][palm] | Oracle legal entities [↗][ora-mods] |
| C4 | Custom fields | **M** | — | — | — | — | — | Rippling custom and formula fields [↗][rip-spend]; HiBob [↗][hb-f] |
| C5 | Document records with expiry alerts | **H** (DOC + expiring list + calendar) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | — | [✓][palm] | Deel [↗][deel-docs] |
| C6 | File attachments (store the scan itself) | **M** (metadata only) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | — | [✓][palm] | Deel [↗][deel-docs] |
| C7 | Letters: salary, definition, experience | **H** (LT, 3 types, print) | — | — | — | [✓][mena-me] | — | — |
| C8 | E-signature | **P**: in-app acknowledgements (policies, custody, PIP) but no signed document | — | — | — | — | — | Deel [↗][deel-docs]; BambooHR [↗][bhr-onb]; KSA e-sign with Nafath [↗][signit] |
| C9 | Nitaqat weighting and target | **H** (Hr.gs, Reports.gs) | [✓][jisr-comp] | — | — | — | — | — |
| C10 | Custody / asset register | **H** (Custody.gs) | [✓][jisr-off] | — | — | — | [✓][palm] | UKG asset management [↗][ukg-guide] |
| C11 | Policies with versioned acknowledgement | **H** (POL) | — | — | — | — | — | — |
| C12 | Position management and vacancies (headcount control) | **M** | [✓][jisr-f] (workforce planning) | — | — | [✓][mena-me] | — | HiBob workforce planning [↗][hb-f] |

### 1.2 Time, shifts, leave

| # | Feature | Ours | Jisr | ZenHR | Bayzat | Menaitech | Palm HR | Global leaders |
|---|---|---|---|---|---|---|---|---|
| D1 | Mobile check-in with geofence | **H**, and stronger than usual: a passkey with Face ID on every punch, plus risk flags | [✓][jisr-f] | [✓][zen-kb] (QR) | [✓][bay-f] | [✓][mena-me] | [✓][palm] | UKG [↗][ukg-wfm] |
| D2 | Biometric device integration (e.g. ZKTeco) | **M** | [✓][jisr-f] | [✓][zen-zk] | [✓][bay-f] | [✓][mena-me] (MenaTA) | [✓][palm] | — |
| D3 | Kiosk or QR punch on a shared device | **M** | — | [✓][zen-kb] | — | — | — | — |
| D4 | Timesheet approval before the payroll lock | **M** | — | — | — | [✓][mena-me] | [✓][palm] | UKG [↗][ukg-wfm] |
| D5 | Overtime request and pre-approval | **P**: overtime comes from HR adjustments or attendance; there is no employee request | [✓][jisr-f] | — | — | — | — | Workday time tracking [↗][wd-hcm] |
| D6 | Short permission (استئذان) by the hour | **M** | — | — | — | — | — | (common Saudi request; vendor support not verified) |
| D7 | Live board, punch review, manual corrections | **H** | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | — | — | — |
| E1 | Shift definitions and rosters | **P**: day shifts and rosters for up to 300 people | [✓][jisr-f] | — | [✓][bay-f] | [✓][mena-me] | [✓][palm] | Workday AI scheduling [↗][wd-hcm]; Personio [↗][per-shift] |
| E2 | Ramadan hours and the summer midday ban | **H** (Shifts.gs) | [✓][jisr-f] (Ramadan) | — | — | — | — | — |
| E3 | Overnight shifts, rotations, swaps | **M** (`overnight_not_supported`) | [✓][jisr-f] | — | — | — | — | UKG [↗][ukg-wfm] |
| F1 | Statutory leave types, accrual and balances | **H** (Leave.gs, 2025 amendments) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] | — | Oracle Absence [↗][ora-mods] |
| F2 | Opening balances on migration | **H** | — | — | — | — | — | HiBob staged templates [↗][hb-migration] |
| F3 | Team calendar with overlap warnings | **P**: calendar only | — | — | [✓][bay-f] | — | — | — |
| F4 | Year-end carry-over caps and encashment | **M** | — | — | — | — | — | Oracle accrual plans [↗][ora-mods] |
| F5 | Return-from-leave confirmation | **M** | — | — | — | — | — | — |
| F6 | Official holidays | **H** | [✓][jisr-f] | — | — | — | — | — |

### 1.3 Payroll, government, end of service, money

| # | Feature | Ours | Jisr | ZenHR | Bayzat | Menaitech | Palm HR | Global leaders |
|---|---|---|---|---|---|---|---|---|
| G1 | Monthly run with maker-checker and lock | **H** | [✓][jisr-f] | [✓][zen-payroll] | [✓][bay-f] | [✓][mena-me] | [✓][palm] | ADP [↗][adp-wfn] |
| G2 ★ | Payslip and run show company cost (employer GOSI, EOS accrual, total) | **P**: employer GOSI as a note only | [✓][jisr-f] (EOS automation) | — | — (GOSI employer share automated [↗][bay-mudad]) | — | — | — |
| G3 ★ | GOSI registered wage separate from gross | **P**: computed basic + housing only | [✓][jisr-gosi-wage] (update the wage in GOSI) | [✓][zen-gosi] | — | — | — | Oracle stores Employee GOSI Details per person [↗][ora-gosi] |
| G4 | Off-cycle, retro and final-pay runs | **M** (EOS is calculated outside the run) | [✓][jisr-f] (custom payroll groups) | — | — | — | — | SAP retro pay [↗][sap-suite]; Oracle GOSI arrears [↗][ora-arrears] |
| G5 | Several pay groups or cycles | **M** | [✓][jisr-f] | — | — | — | [✓][palm] | — |
| G6 | Bank and WPS files | **P**: generic WPS Excel; the template still needs bank confirmation | [✓][jisr-mudad] | [✓][zen-mudad] | [✓][bay-mudad] | [✓][mena-me] | [✓][palm] | — |
| G7 | Mudad direct submission and payment status | **M** | [✓][jisr-mudad] | [✓][zen-mudad] | [✓][bay-mudad] | — | — | Mercans [↗][mercans] |
| G8 | Accounting journal / ERP (Odoo) | **P**: department summary export, no account mapping | [✓][jisr-erp] | [✓][zen-int] | [✓][bay-acc] | — | [✓][palm] | ADP marketplace [↗][adp-wfn] |
| G9 | Payslip by e-mail | **P**: code exists but needs the M365 scope | [✓][jisr-f] | — | [✓][bay-f] | — | — | — |
| G10 | Salary benchmarking | **M** | [✓][jisr-f] | — | — | — | — | ADP [↗][adp-wfn] |
| G11 | Payroll variance report | **H** (Reports.gs) | — | — | — | — | — | — |
| H1 | GOSI contributions by cohort and caps | **H** | [✓][jisr-f] | [✓][zen-gosi] | [✓][bay-mudad] | — | — | Oracle [↗][ora-gosi] |
| H2 | GOSI direct actions: register, wage update, terminate | **M** (deadlines and reconciliation only) | [✓][jisr-gosi] | [✓][zen-gosi] | — | — | — | — |
| H3 | Qiwa contract data and documentation status | **P**: fields, reminder and reconciliation; no status field and no link | [✓][jisr-f] (listed as coming soon) | [✓][zen-int] | — | — | — | — |
| H4 | Muqeem: iqama renewal, exit/re-entry, final exit | **M** (expiry dates only) | [✓][jisr-f] | [✓][zen-muqeem] | [✓][bay-muqeem] | [✓][mena-muqeem] | — | SAP Visa & Permits Muqeem integration [↗][sap-muqeem] |
| H5 | Labour-law rule checks (probation, contract, leave minimum, deduction caps) | **H** | [✓][jisr-comp] | [✓][zen-law] | — | — | — | — |
| H6 | Compliance calendar and alerts | **H** | [✓][jisr-f] | — | — | — | — | Deel [↗][deel-comp] |
| H7 | Wage reconciliation against GOSI and Qiwa exports | **H**: and it blocks payroll approval | — | — | — | — | — | — |
| H8 | Disciplinary case flow and penalty table | **H**, but needs the Art. 72 fix (P0-1) | — | — | — | — | — | — |
| H9 | Work-injury cases with the GOSI deadline | **H** | — | — | — | — | — | Oracle Health & Safety [↗][ora-mods] |
| I1 | EOS calculation and final settlement print | **H** | [✓][jisr-f] | — | — | — | — | — |
| I2 ★ | EOS provision: monthly accrual and journal | **P**: liability snapshot only | [✓][jisr-f] (Journal Hub) | — | — | — | — | — |
| J1 | Salary advances with instalments | **H** | — | — | — | [✓][mena-me] | [✓][palm] | — |
| J2 | Long-term loans (schedule, early settlement, agreement) | **P**: advances up to 12 months and one salary | — | — | — | [✓][mena-me] | [✓][palm] | — |
| K1 | Expense claims with receipts | **M** | [✓][jisr-f] (receipt OCR) | — | [✓][bay-f] | — | [✓][palm] | Rippling [↗][rip-spend]; Darwinbox [↗][dbx-te] |
| K2 | Business travel requests and booking | **M** | [✓][jisr-int] (Almosafer) | [✓][zen-int] (Almatar) | — | [✓][mena-me] (MenaTrip) | — | Rippling travel [↗][rip-spend] |
| K3 | Annual leave tickets for expatriates | **M** | — | — | — | — | — | (gap study P1; vendor pages not verified) |
| L1 | Medical insurance (CCHI) members and dependants: add and delete | **M** | — | [✓][zen-int] (Tameeni) | [✓][bay-ksa] | — | — | Oracle Benefits [↗][ora-mods]; HiBob [↗][hb-f] |
| L2 | Perks and wellness | **M** | — | [✓][zen-int] (Altibbi) | [✓][bay-f] | — | — | ADP [↗][adp-wfn] |

### 1.4 Talent, engagement, self-service, reporting, platform

| # | Feature | Ours | Jisr | ZenHR | Bayzat | Menaitech | Palm HR | Global leaders |
|---|---|---|---|---|---|---|---|---|
| M1 | Performance cycles: self, manager, calibration | **H** (Performance.gs) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] (Mena360) | [✓][palm] | all suites |
| M2 | 360 feedback | **H** | [✓][jisr-f] | — | — | [✓][mena-me] | — | — |
| M3 | Goals / OKRs with continuous check-ins and 1:1s | **P**: KPIs per cycle and mid-year only | — | — | — | — | — | Oracle Goals [↗][ora-mods]; SAP Performance & Goals [↗][sap-suite] |
| M4 | IDP and PIP | **H** | — | — | — | [✓][mena-me] | — | — |
| M5 | Learning / LMS | **M** | [✓][jisr-f] (1,500 Arabic courses) | [✓][zen-int] (Classera) | — | [✓][mena-me] (MenaLMS) | — | Workday Learning [↗][wd-hcm]; HiBob LMS [↗][hb-f] |
| M6 | Training and certification records with expiry; Qiwa L&D reporting | **P**: licences only as documents | [✓][jisr-f] | — | — | [✓][mena-me] | — | UKG certifications [↗][ukg-guide] |
| M7 | Succession, 9-box, talent pools | **M** | — | — | — | — | — | SAP [↗][sap-succ]; Oracle [↗][ora-mods] |
| M8 | Compensation review cycle (bands, budgets, merit) | **M** (pay-equity report only) | [✓][jisr-f] (benchmarking) | — | — | — | — | HiBob [↗][hb-comp]; BambooHR [↗][bhr-comp] |
| M9 | Career paths and internal mobility | **M** | — | — | — | [✓][mena-me] | — | SAP Opportunity Marketplace [↗][sap-omp] |
| N1 | Engagement surveys | **P**: fixed pulse (eNPS + 5 statements); no builder; no exit survey | [✓][jisr-f] | — | [✓][bay-f] | — | — | Workday Employee Voice [↗][wd-hcm]; HiBob [↗][hb-f] |
| N2 | Recognition / kudos | **M** | — | — | — | — | — | ADP [↗][adp-wfn]; HiBob "Shoutout" module on its status page [↗][hb-status] |
| N3 | Announcements | **M** | [✓][jisr-f] | — | — | — | — | — |
| N4 | HR help desk, cases, chatbot | **M** | [✓][jisr-f] (AI bot) | — | [✓][bay-f] (ticketing) | — | — | Oracle HR Help Desk [↗][ora-hd]; Darwinbox [↗][dbx-hd] |
| N5 | Notifications by e-mail, push, WhatsApp or SMS | **M**: in-app bell only; activation is sent by hand through a wa.me link | [✓][jisr-f] | — | — | — | — | — |
| O1 | Employee self-service, bilingual | **H** (PWA, v2 shell) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] | [✓][palm] | — |
| O2 | Native iOS and Android apps | **M** (installable PWA) | [✓][jisr-f] | [✓][zen-kb] | — | [✓][mena-me] | — | HiBob app [↗][hb-f] |
| O3 | Manager self-service and delegation | **H** | [✓][jisr-f] | — | — | [✓][mena-me] | — | Workday delegation [↗][wd-deleg] |
| O4 | Workflow / approval designer | **M**: chains are fixed in code | [✓][jisr-f] | — | [✓][bay-f] | — | — | Rippling Workflow Studio [↗][rip-wf]; Workday BPF [↗][wd-bpf] |
| P1 | Report catalogue with numbered, fingerprinted exports | **H** (19 reports, RPT + SHA-256 + QR) | [✓][jisr-f] | [✓][zen-kb] | [✓][bay-f] | [✓][mena-me] (MenaBI) | — | — |
| P2 | Dashboard and workforce analytics | **H** | [✓][jisr-f] | — | [✓][bay-f] | [✓][mena-me] | — | UKG People Analytics [↗][ukg-guide]; Workday [↗][wd-hcm] |
| P3 ★ | Report builder, pivot, saved views | **M** | [✓][jisr-f] (customisable reports) | — | [✓][bay-f] (AI reporting) | — | — | Rippling field-level reports and pivots [↗][rip-spend] |
| P4 ★ | Drill-down, history snapshots, scheduled reports | **P**: period-on-period compare only | — | — | — | — | — | Workday Data Hub [↗][wd-hcm] |
| P5 ★ | Premium print design for every document | **P** (see §0) | — | — | — | — | — | (not compared publicly) |
| Q1 | Audit trail, including salary views | **H** | — | — | — | — | — | — |
| Q2 | Strong sign-in: passkey, device binding, PIN | **H** | [✓][jisr-sec] (MFA) | — | — | — | — | — |
| Q3 | SSO (SAML / OIDC, Entra ID, Google) | **M** | [✓][jisr-sec] | — | — | — | — | ADP SSO [↗][adp-wfn] |
| Q4 | Data import | **P**: employees, pay and opening balances; not history | — | — | — | — | — | HiBob templates [↗][hb-migration] |
| Q5 | Full company export and deletion | **M** | [✓][jisr-sec] | — | — | — | — | — |
| Q6 | Public API and webhooks | **M** | — | [✓][zen-int] (REST + webhooks) | — | — | [✓][palm] (Zapier) | HiBob [↗][hb-api]; BambooHR [↗][bhr-wh]; ADP [↗][adp-dev] |
| Q7 | Multi-company SaaS, hosted in KSA or the GCC | **M** (designed, not built) | [✓][jisr-sec] (GCC hosting) | — | — | — | — | — |
| Q8 | Workforce and headcount planning | **M** | [✓][jisr-f] | — | — | [✓][mena-me] | — | HiBob [↗][hb-f]; Workday [↗][wd-hcm] |
| Q9 | Hijri and Gregorian dates on every document | **P**: reports only | — | — | — | — | — | Mawared, per a vendor-written buyer guide [↗][buyer-guide] |

**Tally (96 rows):**

| Family | Have | Partial | Missing |
|---|---|---|---|
| Talent acquisition (A) | 0 | 0 | 4 |
| Onboarding / offboarding (B) | 2 | 0 | 1 |
| Core HR (C) | 6 | 2 | 4 |
| Time (D) | 2 | 1 | 4 |
| Shifts (E) | 1 | 1 | 1 |
| Leave (F) | 3 | 1 | 2 |
| Payroll (G) | 2 | 5 | 4 |
| Government and compliance (H) | 6 | 1 | 2 |
| EOS (I) | 1 | 1 | 0 |
| Loans (J) | 1 | 1 | 0 |
| Spend (K) | 0 | 0 | 3 |
| Benefits (L) | 0 | 0 | 2 |
| Talent (M) | 3 | 2 | 4 |
| Engagement (N) | 0 | 1 | 4 |
| Self-service (O) | 2 | 0 | 2 |
| Reporting (P) | 2 | 2 | 1 |
| Platform (Q) | 2 | 2 | 5 |
| **Total** | **33** | **20** | **43** |

### 1.5 Other Saudi and Gulf names found

Buyer guides list more Saudi HR and payroll players. These guides are written by vendors (Bayzat, HONO), so treat them as
leads, not evidence:
- **Mawared:** on-premises; Mudad, GOSI and Muqeem; Hijri dates.
- **Mercans:** Mudad-integrated payroll ([↗][mercans]).
- **Qoyod HR**, **Darwinbox**, **HONO**, **GulfHR**.

Sources: [Bayzat buyer guide][buyer-guide] and [HONO comparison][hono].

### 1.6 What we already do better (keep and sell)

1. **Check-in that cannot be shared.** It needs a passkey with Face ID or a fingerprint on every punch, a geofence, and risk flags
   sent to HR. Vendor pages describe app or biometric punching, but not anti-buddy-punching to this depth.
2. **Evidence-grade controls.**
   - A second person on every money or penalty step.
   - Numbered reports with a SHA-256 fingerprint, QR codes and verification.
   - Salary-view auditing.
3. **Reconciliation that blocks payroll** while GOSI or Qiwa wages disagree.
4. **The legal core is coded and cited:**
   - 2025 leave amendments;
   - probation and contract checks;
   - Art. 92-93 deduction caps;
   - Art. 70 fine cap;
   - EOS Arts. 84-88;
   - the custody-to-clearance gate.

---

## 2. Integrations

**Feasibility key.**
- **API** means a documented public or partner API exists.
- **Partner** means access through certification or a commercial agreement.
- **File** means we generate or ingest files and track the steps.

**Stack note.** The current Apps Script stack allows only `spreadsheets.currentonly`. Any outbound call (UrlFetch), any Drive
storage, or any trigger needs a new OAuth scope, and the owner must run `authorize` again. Until then, every request fails
(`CLAUDE.md`). Bundle these scope changes into one deploy, done while the owner is available to click.

| Integration | What leaders offer | Route for us | Feasible approach | Effort | Pri |
|---|---|---|---|---|---|
| **Mudad** (WPS) | ZenHR sends payroll to Mudad, sees payment status and cancels payments [↗][zen-mudad]; Bayzat pays in one click [↗][bay-mudad]; Jisr turns it on after payroll confirmation [↗][jisr-mudad] | Partner (no public API found) | Now: the exact Mudad and bank upload formats (P0-11). Later: apply to become a Mudad-integrated provider (P2-1). | File S-M · API L | P0 / P2 |
| **GOSI** | Jisr: add, update wage, modify, terminate [↗][jisr-gosi] [↗][jisr-gosi-wage]; ZenHR contribution-rate sync [↗][zen-gosi] | API or partner (unverified) | Now: registered wage, reconciliation and deadlines (P0-3). Investigate whether establishments can get API keys (P2-2). | S-M · L | P0 / P2 |
| **Qiwa** | Jisr lists Qiwa as coming [↗][jisr-f]; ZenHR mentions it [↗][zen-int]. HRSD contract management is a portal service [↗][hrsd-contract] | No public API found | Export contract data in Qiwa field order, record the documentation status and reference by hand, and keep the reconciliation (part of P1-20 and H3) | S | P1 |
| **Muqeem / Absher** | Elm offers HR-system integration with Muqeem [↗][elm-muqeem]; SAP [↗][sap-muqeem], ZenHR [↗][zen-muqeem], Bayzat [↗][bay-muqeem] and Menaitech [↗][mena-muqeem] integrate | Partner (Elm, paid) | Now: exit/re-entry and iqama tracker with manual "issued in Muqeem" (P0-9). Later: Elm integration (P2-3). | M · L | P0 / P2 |
| **Etimad** | Government procurement platform, not an HR system | n/a | Relevant only if we sell to government entities (vendor registration). No product work. | — | — |
| **Banks** (salary files, host-to-host) | Bayzat SAB integration [↗][bay-f] | File now; bank agreement for host-to-host | Per-bank salary file formats (P0-11); host-to-host later (P2-13) | S per bank · L | P0 / P2 |
| **Accounting** (Odoo first) | Jisr: Odoo, SAP B1, NetSuite, QuickBooks, Xero, Zoho, Dynamics, Qoyod [↗][jisr-erp]; ZenHR [↗][zen-int]; Bayzat [↗][bay-acc]; Palm HR [↗][palm] | File now; API later (Odoo external API [↗][odoo-api]) | Odoo-importable journal with account and analytic mapping (P0-6); push through the API later | S-M · M | P0 |
| **Microsoft 365 / Google Workspace** | Jisr interview scheduling with Outlook and Google Meet [↗][jisr-f]; SSO [↗][jisr-sec] | API (Graph, Google) | E-mail through the existing Graph code (P0-10); leave in Outlook calendars (P1); SSO with Entra ID / Google (P1-16) | S · M · M | P0 / P1 |
| **WhatsApp / SMS** | Jisr in-app and e-mail messaging [↗][jisr-f] | API through a Saudi provider (e.g. Unifonic [↗][unifonic-wa]) | Approved template messages for tasks, decisions, payslips and activation codes (P0-10) | M | P0 |
| **Biometric devices** (ZKTeco and others) | ZenHR [↗][zen-zk], Jisr [↗][jisr-f], Palm HR [↗][palm]; BioTime 9.5 handles push devices [↗][zk-biotime] and has an API (developer write-up [↗][zk-api]) | API (BioTime) | Pull transactions as `source: device` punches into the same day logic (P1-8) | M | P1 |
| **Insurance providers** | ZenHR with Tameeni [↗][zen-int]; Bayzat insurance with live additions and deletions [↗][bay-ksa] | File now; insurer API later | Member and dependant register plus add/delete files in each insurer's template (P1-2) | M | P1 |
| **Job boards** (LinkedIn, Bayt, Tanqeeb, Jadarat) | ZenHR with LinkedIn [↗][zen-int]; Jisr career portal [↗][jisr-f]. Jadarat is the national employment platform for private-sector postings [↗][jadarat-spa] [↗][jadarat-hrdf] | Links and share now; APIs unverified | Careers page plus posting links; Jadarat posted by hand (P1-1) | M | P1 |
| **E-signature** | Deel [↗][deel-docs], BambooHR [↗][bhr-onb]; Saudi providers with Nafath [↗][signit] [↗][sahl] | We already have passkeys; provider API | Passkey-signed acknowledgement now (P1-17); Nafath-backed signature later (P2-9) | S · M | P1 / P2 |
| **Travel** | Jisr with Almosafer [↗][jisr-int]; ZenHR with Almatar [↗][zen-int]; Menaitech MenaTrip [↗][mena-me] | Partner | Request and approval first (P1-15); booking partner later | M | P1 |
| **Learning** | Jisr with Lumofy [↗][jisr-int]; ZenHR with Classera [↗][zen-int] | Partner | Records first (P1-3); content partner later (P2-8) | M | P2 |

---

## 3. Prioritised build backlog

**Ordering rules.**
- Owner must-haves and legal fixes first, then what Saudi buyers expect in a first demo.
- Every item:
  - is enforced on the server;
  - is Arabic first;
  - writes to the audit log;
  - puts money or penalty steps through two people;
  - ships with its help page, error copy, empty state and release note (DOCS-PLAN §10).

**Platform notes.**
- P0-7 and P0-10 need new Apps Script scopes. Ship them together with one `authorize` by the owner.
- Items marked **(SaaS)** should wait for the Postgres platform (`2026-10-01-saas-multitenant-design.md`).

### P0: build now (about 10-12 engineer-weeks)

**P0-1 · Disciplinary grievance window: fix to the amended Art. 72 (S)**
- *Value:* stops the system rejecting lawful grievances.
- *Legal driver:* the amended Art. 72, in force 19 Feb 2025 ([HRSD][hrsd-disc], [Chambers][chambers]):
  - the worker may file a written grievance within 30 days of notice, excluding public holidays;
  - the employer must decide within 15 days;
  - then the worker has 30 days to go to the labour court.
- *Today:* `discObject` closes after 15 days.
- *Spec:*
  - In `Relations.gs`, record `notifiedOn` with each decision. It defaults to the decision date, and HR can enter a
    registered-mail date.
  - `discObject` accepts grievances until `notifiedOn` + 30 days, skipping official holidays from the holidays tab.
  - On a grievance, create an HR task due in 15 days, with an overdue flag on the case and on the compliance calendar.
  - The grievance outcome letter states the 30-day labour-court window.
  - The employee's case card shows a countdown.
- *Also:*
  - Have counsel confirm the case-opening limit (`too_late`, 30 days from discovery, citing Art. 71). Sources disagree
    ([summary][alfawaz-71]).
  - Update guide §15, the error text and the legal register (DOCS-PLAN OWN-12).
- *Tests:* day 30 is accepted; day 31 is rejected; a holiday extends the window; HR's overdue flag fires on day 16.

**P0-2 ★ · Company cost on the payslip and payroll run, with a monthly EOS accrual (S-M)**
- *Value:* management sees the true monthly cost of every employee and of every department, and the books get an EOS
  provision every month.
- *Legal driver:* Art. 84 (EOS basis). Nothing requires showing this on payslips; it is management and accounting information.
- *Spec, calculation* (in `calcSlip_`):
  - `eosAccrual` is the EOS entitlement at the period end minus the entitlement at the previous month end. It uses the same
    function as `eosQuote` and the dashboard liability: `eosWageBasis`, the Art. 84 tiers, and unpaid leave over 20 days
    excluded.
  - It is floored at 0. A true-up in the exit month equals the settlement minus the provision held.
  - An optional `leaveAccrual` (days accrued × total daily wage) sits behind the setting `costIncludeLeave`.
  - `companyCost` = gross + `gosiEmployer` + `eosAccrual` (+ `leaveAccrual`) (+ the medical premium once P1-2 exists).
  - Store each as a payslip column and in the run totals.
- *Spec, screens:*
  - The payslip drawer and print get a block "تكلفة الموظف على الشركة" with these lines:
    - إجمالي المستحقات;
    - حصة الشركة في التأمينات (with the rate);
    - مخصص نهاية الخدمة لهذا الشهر;
    - مخصص الإجازة (optional);
    - الإجمالي.
  - The employee's copy shows the block only when the setting `slipShowCompanyCost` is on. Default on, at the owner's request.
  - Payroll runs (`pay:runs`) get tiles for total company cost and columns per department and cost centre.
- *Spec, reports:*
  - A new money report, `company_cost`, by employee, department and cost centre over a month range.
  - The dashboard cost card uses company cost.
  - Journal lines are added in P0-6.
- *Caveat:* this is a termination-basis accrual, not an IAS 19 actuarial valuation. The Controller should confirm it is
  acceptable for the statutory accounts.
- *Tests:* the jump when service crosses 5 years; a partial month; the exit-month true-up; and the payslip with the setting off.

**P0-3 ★ · GOSI registered wage, separate from gross (M)**
- *Value:* contributions match what GOSI actually bills, and payslips explain why the GOSI base differs from gross.
- *Legal driver:* social-insurance contributions are due on the wage registered with GOSI, and wage changes must be reported.
  Jisr's help covers updating the wage in GOSI ([↗][jisr-gosi-wage]). The deadline and the 1,500-45,000 limits need verifying
  with GOSI.
- *Spec, record:* a new tab `gosiWages`, with:
  - a reference GW-YYYY-00001;
  - `empId`, `wage`, `effectiveFrom`;
  - `source`: computed, gosi_export or manual;
  - a note;
  - a status (pending or approved), the maker and the checker.

  The checker is never the maker or the employee.
- *Spec, payroll:*
  - With the setting `gosiBaseSource = registered` (the default), payroll uses the latest approved row on or before month end.
  - With no row, it falls back to basic + housing and adds the warning `gosi_wage_missing`.
- *Spec, payslip:* the drawer and print show "الأجر الخاضع للتأمينات" next to gross, with the employee and employer rates and
  amounts.
- *Spec, reconciliation:*
  - The existing wage reconciliation (REC) gains "اعتماد أجر التأمينات". From the uploaded GOSI export it proposes
    `gosiWages` rows for the mismatches selected, and a second person approves them.
  - When a package change moves basic + housing away from the registered wage, it raises the task "حدّث الأجر في التأمينات",
    due by the verified deadline, until a matching row is approved.
- *Spec, import and reports:*
  - The import gains a `gosiWage` column.
  - The GOSI contributions report shows the registered wage, the computed wage and the difference.
  - The compliance calendar lists open wage updates.

**P0-4 ★ · Premium print kit for every document (M kit + S per template; L in total)**
- *Value:* every paper the company issues looks premium and can be checked: letters to banks and embassies, settlements,
  warnings.
- *Legal driver:*
  - Art. 64 service certificate;
  - Art. 71 written charge;
  - Art. 72 written penalty notice.
- *Spec, the kit:* one module, `js/print.js`, with `Print.doc({type, ref, lang, blocks, signers, verify})`. It replaces the
  separate print CSS in `payroll.js`, `requests.js`, `ops.js` and `reports.js`.
- *Spec, design* (the owner's stated taste: big logo, dark cover band, generous padding, two pages maximum for approvals):
  - A4, RTL or LTR;
  - a pine header band (#1C2A1F) with the cream logo, or a light theme with `logoInk()` (setting `printTheme`);
  - `coMeta()` for CR, VAT and address;
  - the document title in Arabic and English, and the number in `<bdi>`;
  - Gregorian and Hijri dates;
  - key-value grids, tables with totals, and notes;
  - an approval and signature block filled from the request history (name, role, time, "اعتُمد إلكترونيا");
  - a QR code of `ref|hash`, checked by a new `docVerify` action;
  - a watermark on drafts and copies;
  - page x of y.
- *Spec, registry:* a tab `docLog` (PRN-YYYY-00001), holding each document's type, reference, employee, content hash, issuer
  and time. A reprint is marked "نسخة".
- *Spec, templates* (all bilingual, 27 in total):
  1. Payslip.
  2. Salary letter.
  3. Definition letter.
  4. Experience / service certificate.
  5. Offer letter.
  6. Contract summary.
  7. Leave approval.
  8. Exit/re-entry approval.
  9. Advance or loan agreement and schedule.
  10. Expense voucher.
  11. EOS settlement.
  12. Clearance certificate.
  13. Custody handover and return receipt.
  14. Charge.
  15. Hearing minutes.
  16. Penalty decision.
  17. Grievance outcome.
  18. Warning.
  19. Injury report.
  20. Performance review.
  21. IDP / PIP.
  22. Onboarding checklist.
  23. Policy acknowledgement certificate.
  24. Payroll approval pack (two pages).
  25. WPS submission summary.
  26. Reconciliation closure.
  27. Employee profile sheet, org chart and monthly attendance sheet.
- *QA:* print-test each template at A4 in headless Chrome. Remember the known trap: paper width crosses the 820 px breakpoint
  and the page re-renders mid-print, so force print CSS.

**P0-5 ★ · Deep reporting I: report builder, drill-down, monthly snapshots (L)**
- *Value:* HR, payroll and executives answer their own questions without a developer.
- *Legal driver:* none.
- *Spec, builder* (new sub-page "تقرير مخصص" under `insights:reports`):
  - Datasets: employees, job history, attendance days, punches, leave, requests, payslip lines, company cost, GOSI, custody,
    discipline, performance, onboarding.
  - Fields come from a server-generated catalogue in which each field carries an access class (people, money, private or
    cost), so the builder never offers a field the viewer may not see.
  - Filters include department with its children.
  - Up to two group-by levels; count, sum, average, minimum and maximum; pivot (rows × columns, e.g. department × month);
    top N; a chart hint.
  - Save views as private or shared to roles, in a tab `reportViews` (RV-…).
  - Exports reuse `reportExport` (RPT number, fingerprint, QR). Row-level security reuses `reportScope_`.
- *Spec, drill-down:* every dashboard tile and chart opens the rows behind it, as a prefilled builder view.
- *Spec, snapshots:*
  - When a payroll run is locked, which needs no trigger scope, write a `snapshots` row per department and month: headcount,
    joiners, leavers, weighted Saudization, company cost, overtime, and leave and EOS liability.
  - Trend reports read the snapshots, so the history stays as it was.
- *Spec, new standard reports:*
  - company-cost trend;
  - overtime by branch;
  - absence heatmap (weekday × branch);
  - lateness by manager;
  - leave-liability trend;
  - GOSI on the registered wage;
  - WPS compliance %;
  - Saudization forecast with planned hires and exits.
- *Limit:* cap a builder run at about 20,000 rows on Sheets; the SaaS port removes the cap.

**P0-6 · Accounting journal export, Odoo first (S-M)**
- *Value:* payroll posts to the ledger without re-keying. Best Gas's ledger is Odoo.
- *Spec, mapping:* a tab `glMap` and a mapping screen beside payroll runs. It maps:
  - each line code to an account code: basic, housing, transport, each named allowance, overtime, bonus, employee GOSI,
    employer GOSI, advance, fine, other deduction, reimbursement, `eosAccrual`, `leaveAccrual`;
  - each department or cost centre to an Odoo analytic account.
- *Spec, journal:* for a locked run, produce a balanced journal:
  - Dr expenses per cost centre;
  - Cr salaries payable (net);
  - Cr GOSI payable (employee + employer);
  - Cr advances receivable;
  - Cr other deductions;
  - Dr/Cr provisions from P0-2.
- *Spec, output:* an Odoo-importable CSV or XLSX (journal, date, `PR-…` reference, account, analytic distribution, label, debit,
  credit), plus a generic CSV.
- *Spec, rules and tracker:*
  - Export is blocked while debits ≠ credits or while any line code is unmapped.
  - Tracker: exported → posted (Odoo reference) → confirmed by a second person.
  - Later: push through the Odoo external API ([↗][odoo-api]), which needs UrlFetch.

**P0-7 · Attachments: store the real files (M)**
- *Value:* scans of iqamas, sick notes, receipts and evidence sit on the record. Every competitor has this.
- *Legal driver:* Art. 117 sick leave needs a medical report. PDPL retention applies.
- *Spec, upload:* one attachment service. Phone camera or PDF, up to 5 MB; jpg, png or pdf (HEIC converted on the client).
- *Spec, storage:*
  - On Apps Script: a restricted Drive folder, which needs the `drive.file` scope.
  - On SaaS: object storage in KSA.
  - A tab `files` (FILE-…) records the parent type and reference, the employee, name, type, size, SHA-256, uploader, time and
    status.
- *Spec, access:* follows the parent record.
  - Medical reports: the employee and HR, never the manager.
  - Receipts: the approvers.
- *Spec, used by:*
  - documents;
  - sick and exam leave;
  - expenses;
  - discipline evidence;
  - injuries;
  - custody photos;
  - contracts.
- *Spec, deletion:* soft delete, then a purge per the PDPL retention register.

**P0-8 · Expense claims and reimbursement (M; needs P0-7)**
- *Value:* drivers' fuel, tolls and per diems leave WhatsApp and paper.
- *Spec, request:* a new request type "مطالبة مصروفات" (EXP-YYYY-00001), with lines:
  - date;
  - category: وقود، رسوم طرق، مواقف، وجبات، بدل يومي، اتصالات، صيانة مركبة، أخرى;
  - amount, VAT and merchant;
  - the receipt;
  - cost centre;
  - optional link to a custody vehicle.
- *Spec, rules:*
  - Limits per category and grade (setting JSON).
  - A receipt is required above a set amount.
  - Duplicate check: same merchant, date and amount within 90 days.
- *Spec, approval and payout:*
  - Chain: manager → payroll (configurable once P1-9 exists).
  - Payout as a non-GOSI earning line `reimbursement` in the next run, or as "paid outside payroll" with a reference.
- *Spec, outputs:*
  - Reports by category, vehicle, department and employee; policy breaches; ageing.
  - Journal mapping through P0-6.
  - A voucher print through P0-4.

**P0-9 · Exit/re-entry, Muqeem tracker and annual tickets (M)**
- *Value:* the most frequent expatriate HR service. All four Saudi competitors integrate with Muqeem.
- *Legal driver:* employer duties for iqamas and visas through Muqeem / Jawazat ([Elm][elm-muqeem]). Tickets follow the contract.
- *Spec, request:* a new type "تأشيرة خروج وعودة" (ERV-YYYY-00001):
  - single or multiple;
  - travel dates;
  - linked annual leave (LV) or standalone;
  - dependants;
  - chain: manager → HR.
- *Spec, HR step "صدرت في مقيم":* records the visa number, expiry and fee, and who pays it. A fee is recovered from the employee
  only with written consent (Art. 92).
- *Spec, return:*
  - The manager or HR confirms the return; the first punch after the leave proposes it.
  - If the employee has not returned by visa expiry plus a grace period, HR gets a task. Nothing automatic follows.
- *Spec, iqama register:* renewal tasks at 60, 30 and 7 days, with the fee. Clearance gains a "final exit visa" task for
  non-Saudis.
- *Spec, tickets:*
  - Entitlement per contract: annual or biennial, class, route, cash value, dependants.
  - Issue as a ticket or as a cash earning line in payroll.
- *Spec, reports:* who is abroad, visas expiring, iqamas expiring, tickets due or paid.
- *Later:* Elm integration (P2-3).

**P0-10 · Notifications: e-mail and WhatsApp/SMS (M)**
- *Value:* approvals stop stalling, and activation codes stop going out by hand.
- *Spec, channels:*
  - in-app (exists);
  - e-mail through the existing Microsoft Graph code (`payrollEmail`);
  - WhatsApp and SMS through a Saudi provider ([Unifonic][unifonic-wa]), with pre-approved Arabic and English templates.
- *Spec, events:*
  - a task created for an approver;
  - a request decided;
  - a payslip published;
  - an activation code;
  - a document or iqama expiring (to HR);
  - acknowledgements due;
  - an optional check-in reminder.
- *Spec, controls:*
  - per-user preferences and quiet hours (22:00-07:00);
  - an HR digest;
  - a tab `notifyLog` with delivery status and retries.
- *Constraints:*
  - Needs the `script.external_request` scope. Deploy it only when the owner can authorize, bundled with P0-7.
  - PDPL: phone numbers are personal data and WhatsApp routes through Meta. Cover this with opt-in and in the DPA.

**P0-11 · Exact bank and Mudad salary files (S-M)**
- *Value:* the first WPS upload succeeds.
- *Legal driver:* the WPS file upload ([HRSD][hrsd-wps]).
- *Spec:*
  - Obtain the official Mudad upload format and each payroll bank's salary-file format.
  - A setting `wpsFormat` per company.
  - One generator per format, with field validation (IBAN, ID type, establishment and Mudad identifiers, bank code), control
    totals, record counts and file naming.
  - The existing tracker stays.
  - Test a file with the bank before the first live month.

### P1: next quarter

1. **P1-1 · Recruitment lite (L).**
   - Requisitions linked to positions.
   - A public careers page, with links to LinkedIn and Jadarat.
   - An apply form.
   - A pipeline: new → screened → interview → offer → hired.
   - Interview slots.
   - Offer letters printed through P0-4.
   - "Hire" creates the employee file, the onboarding plan and the activation code in one step.
   - Candidate data is HR-only, with a PDPL retention timer.
2. **P1-2 · Medical insurance and dependants (M).**
   - Records: policy, class, insurer and premium.
   - Members (employee and dependants, with relation, ID and date of birth).
   - Add and delete requests on hire, exit, birth or marriage, exported in the insurer's template.
   - The card number and its expiry.
   - The monthly premium feeds `companyCost`.
   - *Legal driver:* the Cooperative Health Insurance Law (verify scope with counsel).
3. **P1-3 · Training and certification records (M).**
   - A course and certificate catalogue (safety, civil defence, dangerous goods, driving), with mandatory items linked to
     positions.
   - Sessions and attendance.
   - Expiry alerts on the compliance calendar.
   - Assignment blocked when a mandatory certificate has expired.
   - A Qiwa-ready L&D report (Jisr notes Qiwa learning reporting [↗][jisr-f]).
4. **P1-4 · Loans (S).**
   - A type separate from advances, with a schedule, early settlement and a printed agreement.
   - The Art. 92 rule: a loan instalment above 10% of the wage needs written consent.
   - The Art. 93 50% cap reuses the existing cap engine.
5. **P1-5 · Off-cycle, final-pay and retro runs (M).**
   - Run types: regular, final settlement (EOS and leave pay, inside payroll, ready for WPS within the Art. 88 deadlines),
     bonus, and retro (the difference after a back-dated package).
   - Each run type is locked separately.
6. **P1-6 · Leave year-end, hourly permission, return to work (M).**
   - Carry-over cap and expiry per policy, and encashment requests.
   - Hourly permission (استئذان) with a monthly quota.
   - Return-to-work confirmation that closes the leave.
   - *Legal driver:* Arts. 109 and 111 (verify the carry-over rules).
7. **P1-7 · Timesheets, overtime requests, advanced shifts (M-L).**
   - Monthly timesheet approval by the manager before the payroll lock.
   - Overtime pre-approval requests (Art. 107).
   - Overnight shifts, rotation patterns and swaps (with approval).
8. **P1-8 · Biometric devices (M).**
   - Pull from the ZKTeco BioTime API as `source: device` punches into `summarizeDay_`.
   - A device-to-location map.
   - Biometric data stays on the device. Under PDPL it is sensitive data, so a consent text is needed.
9. **P1-9 · Approval designer lite (L).**
   - Per request type, the admin picks the chain: manager / department head / HR / payroll / a named role, up to four
     steps, with optional amount thresholds.
   - The server enforces "never your own" and maker-checker as it does today.
10. **P1-10 · Custom fields (M).**
    - The admin adds typed fields (text, number, date, list) to employees and request types, with access classes.
    - They appear in import, the report builder and print.
11. **P1-11 · Announcements and recognition (S).**
    - Targeted announcements (by department or location) with read tracking.
    - Kudos tied to company values, on the home page.
12. **P1-12 · HR help desk (M).**
    - Cases by category, with an SLA and an owner.
    - FAQ articles from DOCS-PLAN.
    - A channel for PDPL data-subject requests.
13. **P1-13 · Compensation review cycle (M).**
    - Bands per grade and budgets per department.
    - Manager worksheets with rating and compa-ratio.
    - Chain: HR → Controller.
    - Approved changes write effective-dated packages and open GOSI wage tasks (P0-3).
14. **P1-14 · Deep reporting II (M).**
    - Scheduled reports by e-mail (after P0-10).
    - KPI alerts (attendance below a target, overtime above a budget).
    - Saved dashboards per role.
15. **P1-15 · Business travel and per diem (M).**
    - Request (purpose, route, dates), approval, per-diem table by grade and city, and settlement against expenses (P0-8).
    - A booking partner later.
16. **P1-16 · SSO (M) (SaaS).**
    - OIDC/SAML with Microsoft Entra ID and Google for HR and office staff.
    - Field staff keep passkeys.
17. **P1-17 · Passkey-signed acknowledgements (S).**
    - Warnings, custody receipts, policies, contracts and payslips are signed with a fresh WebAuthn assertion.
    - The signature hash is stored in `docLog`.
18. **P1-18 · Survey builder and lifecycle surveys (S-M).**
    - Custom questions.
    - Onboarding and exit surveys.
    - The same anonymity thresholds as the pulse survey.
19. **P1-19 · Full company export and deletion (M).**
    - PDPL and contract-exit duty: export every tab and file per company; deletion with a certificate.
20. **P1-20 · Multi-entity and Qiwa contract status (M-L) (SaaS).**
    - Several CRs or establishments under one account, each with its own GOSI, Mudad and Qiwa numbers, Nitaqat and WPS.
    - A Qiwa documentation status (documented / pending / rejected) and reference on each contract.

### P2: later or partner-dependent

- **P2-1 · Mudad direct API (L).** Apply as an integrated provider: submit payroll, read payment status, cancel.
- **P2-2 · GOSI direct actions (L).** Confirm whether establishment API keys exist. If they do: register, update wage and
  terminate from the employee file.
- **P2-3 · Muqeem through Elm (L).** Issue, extend and cancel exit/re-entry visas and final exit, and renew iqamas from P0-9
  screens. Fees per transaction.
- **P2-4 · Qiwa integration (L).** Only if a channel opens. Today there is no public API.
- **P2-5 · Public REST API and webhooks (L) (SaaS).** API keys or OAuth per company, a versioned API with a changelog, and
  webhooks for hire, leave, payroll lock and exit.
- **P2-6 · Succession and 9-box (M).** Built on the existing ratings.
- **P2-7 · OKRs and continuous 1:1s (M).** Cascading goals and check-ins between cycles.
- **P2-8 · Learning content (M).** A partner LMS (Lumofy or Classera type) or in-house video plus quiz.
- **P2-9 · Nafath-backed e-signature (M).** Through a Saudi provider ([↗][signit]), for contracts and offers.
- **P2-10 · Workforce planning and position control (M).** Budgeted positions, vacancies and hiring plans.
- **P2-11 · Benefits and perks marketplace (L).**
- **P2-12 · Native apps with push (L).** Store presence; push through the platform.
- **P2-13 · Bank host-to-host salary payment (L).**
- **P2-14 · Career paths and internal mobility (M).**
- **P2-15 · Kiosk / QR punch for shared devices (M).** A supervised tablet that signs with the site's passkey.
- **P2-16 · Salary benchmarking (M).** Needs a market data source.

---

## 4. Strategic implications

- **Parity first, in this order: spend, government services, communication.** P0-6 to P0-11 close the gaps a Saudi buyer
  notices in the first demo, because Jisr, ZenHR and Bayzat show these on their home pages.
- **Differentiate on proof.** Lead every demo with what competitors cannot claim:
  - passkey check-in;
  - "two people approve every riyal";
  - numbered documents a bank can verify by QR (P0-4);
  - a payslip that shows the company's true cost (P0-2).
- **Do not build the partner integrations first.** Mudad, GOSI, Muqeem and Qiwa direct links need certification or commercial
  agreements. Ship the file-and-tracker versions now (P0-3, P0-9, P0-11) and start the applications in parallel. They take
  weeks of paperwork, not code.
- **Platform limits.** The report builder, file storage and notifications push Apps Script and Sheets hard: scopes, 6-minute
  runs, Sheet read costs. If the owner chooses SaaS option B, build P0-5 and P0-7 on Postgres and object storage directly.
- **Watch:**
  - Jisr's Qiwa integration (marked "soon");
  - Mudad and GOSI partner programmes;
  - the next labour-law amendment cycle (the legal register, DOCS-PLAN OWN-12, absorbs it).

---

## Sources

**Global suites**
[wd-hcm]: https://www.workday.com/en-us/products/human-capital-management/overview.html
[wd-bpf]: https://doc.workday.com/workday-education/en-us/course-manuals/hcm-core-for-administrators/business-process-framework.html
[wd-deleg]: https://doc.workday.com/admin-guide/en-us/manage-workday/business-processes/delegate-business-processes/cxi1568047444210.html
[sap-suite]: https://www.techtarget.com/searchhrsoftware/feature/HR-tools-overview-SAP-SuccessFactors-HCM-suite
[sap-succ]: https://learning.sap.com/learning-journeys/explore-sap-successfactors-solutions/managing-succession-with-sap-successfactors-succession-management_f385d75b-647a-46c7-bb5e-0c63cabd4e18
[sap-omp]: https://www.sap.com/products/hcm/opportunity-marketplace.html
[sap-muqeem]: https://help.sap.com/docs/SFSF_Visa_and_Permits_Management/b1a141bbc5d048d8a0d36225bbb93b0b/3d6e670433004f9a9e731735d52fe37f.html
[ora-mods]: https://unogeeks.com/oracle-fusion-hcm-modules/
[ora-hd]: https://www.oracle.com/human-capital-management/hr-help-desk/
[ora-arrears]: https://docs.oracle.com/en/cloud/saas/human-resources/22d/faisa/gosi-arrears.html
[ora-gosi]: https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/overview-of-employee-gosi-details-for-saudi-arabia.html
[adp-wfn]: https://www.adp.com/what-we-offer/products/adp-workforce-now.aspx
[adp-dev]: https://developers.adp.com/
[ukg-guide]: https://www.ukg.com/sites/default/files/2025-01/cv2586_ukg_pro_solutions_guide_0.pdf
[ukg-wfm]: https://www.ukg.com/products/ukg-pro-workforce-management
[rip-spend]: https://www.rippling.com/spend-management-2-2
[rip-wf]: https://www.rippling.com/platform/workflows
[bhr-onb]: https://www.bamboohr.com/platform/onboarding/
[bhr-comp]: https://www.bamboohr.com/platform/compensation/
[bhr-wh]: https://documentation.bamboohr.com/docs/webhooks
[hb-f]: https://www.hibob.com/features/
[hb-comp]: https://www.hibob.com/platform/planning/compensation/
[hb-api]: https://apidocs.hibob.com/
[hb-status]: https://status.hibob.io/
[hb-migration]: https://www.hibob.com/blog/hris-migration/
[per-shift]: https://www.tipranks.com/news/private-companies/personio-expands-hr-platform-with-advanced-shift-and-leave-management
[deel-docs]: https://www.deel.com/blog/how-deel-consolidates-hr-documents-contracts-esignatures/
[deel-comp]: https://www.deel.com/solutions/compliance/
[dbx-hd]: https://darwinbox.com/en-us/products/employee-helpdesk
[dbx-te]: https://darwinbox.com/en-us/products/travel-and-expense

- Workday HCM overview: <https://www.workday.com/en-us/products/human-capital-management/overview.html>
- Workday business process framework: <https://doc.workday.com/workday-education/en-us/course-manuals/hcm-core-for-administrators/business-process-framework.html>
- Workday delegation: <https://doc.workday.com/admin-guide/en-us/manage-workday/business-processes/delegate-business-processes/cxi1568047444210.html>
- SAP SuccessFactors suite overview (secondary, TechTarget): <https://www.techtarget.com/searchhrsoftware/feature/HR-tools-overview-SAP-SuccessFactors-HCM-suite>
- SAP succession: <https://learning.sap.com/learning-journeys/explore-sap-successfactors-solutions/managing-succession-with-sap-successfactors-succession-management_f385d75b-647a-46c7-bb5e-0c63cabd4e18>
- SAP Opportunity Marketplace: <https://www.sap.com/products/hcm/opportunity-marketplace.html>
- SAP Muqeem online service integration: <https://help.sap.com/docs/SFSF_Visa_and_Permits_Management/b1a141bbc5d048d8a0d36225bbb93b0b/3d6e670433004f9a9e731735d52fe37f.html>
- Oracle HCM modules (secondary): <https://unogeeks.com/oracle-fusion-hcm-modules/>
- Oracle HR Help Desk: <https://www.oracle.com/human-capital-management/hr-help-desk/>
- Oracle GOSI arrears: <https://docs.oracle.com/en/cloud/saas/human-resources/22d/faisa/gosi-arrears.html>
- Oracle Employee GOSI details: <https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/overview-of-employee-gosi-details-for-saudi-arabia.html>
- ADP Workforce Now: <https://www.adp.com/what-we-offer/products/adp-workforce-now.aspx>
- ADP developers: <https://developers.adp.com/>
- UKG Pro solution guide: <https://www.ukg.com/sites/default/files/2025-01/cv2586_ukg_pro_solutions_guide_0.pdf>
- UKG Pro Workforce Management: <https://www.ukg.com/products/ukg-pro-workforce-management>
- Rippling spend management (search-indexed): <https://www.rippling.com/spend-management-2-2>
- Rippling workflows: <https://www.rippling.com/platform/workflows>
- BambooHR onboarding: <https://www.bamboohr.com/platform/onboarding/>
- BambooHR compensation: <https://www.bamboohr.com/platform/compensation/>
- BambooHR webhooks: <https://documentation.bamboohr.com/docs/webhooks>
- HiBob features: <https://www.hibob.com/features/>
- HiBob compensation: <https://www.hibob.com/platform/planning/compensation/>
- HiBob API docs: <https://apidocs.hibob.com/>
- HiBob status: <https://status.hibob.io/>
- HiBob migration checklist: <https://www.hibob.com/blog/hris-migration/>
- Personio shift and leave update (secondary): <https://www.tipranks.com/news/private-companies/personio-expands-hr-platform-with-advanced-shift-and-leave-management>
- Deel documents and e-signatures: <https://www.deel.com/blog/how-deel-consolidates-hr-documents-contracts-esignatures/>
- Deel compliance: <https://www.deel.com/solutions/compliance/>
- Darwinbox help desk: <https://darwinbox.com/en-us/products/employee-helpdesk>
- Darwinbox travel and expense: <https://darwinbox.com/en-us/products/travel-and-expense>

**Saudi and Gulf players**
[jisr-f]: https://www.jisr.net/en/features
[jisr-comp]: https://www.jisr.net/en/saudi-compliance-management
[jisr-sec]: https://www.jisr.net/en/security
[jisr-int]: https://www.jisr.net/en/why-jisr/integration-with-government-systems-and-platforms
[jisr-off]: https://updates.jisr.net/en/updates-on-offboarding-assets-management
[jisr-gosi]: https://www.jisr.net/en/product-updates/integration-with-gosi
[jisr-gosi-wage]: https://jisr.zendesk.com/hc/en-sa/articles/13786989457297-Update-employee-salary-in-GOSI
[jisr-mudad]: https://jisr.zendesk.com/hc/en-sa/articles/13753148309265-Activating-Mudad-integration-with-Jisr
[jisr-erp]: https://jisr.zendesk.com/hc/en-sa/articles/26593704650897-ERP-Accounting-Integration-with-Jisr-Comprehensive-User-Guide
[zen-kb]: https://zenhrsolutions.freshdesk.com/en/support/solutions
[zen-int]: https://blog.zenhr.com/en/zenhr-integrations-apis-payroll-erp-accounting-government-bi-systems
[zen-mudad]: https://www.zenhr.com/en/marketplace-integration/mudad
[zen-muqeem]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000685060-muqeem-native-integration
[zen-zk]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000670307-zkteco-attendance-machines-native-integration
[zen-gosi]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000766003-general-organization-for-social-insurance-gosi-contribution-rates-integration
[zen-law]: https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features
[zen-payroll]: https://www.zenhr.com/en/modules/payroll
[bay-f]: https://www.bayzat.com/ksa/features
[bay-ksa]: https://www.bayzat.com/ksa
[bay-mudad]: https://www.bayzat.com/ksa/mudad
[bay-muqeem]: https://www.bayzat.com/ksa/muqeem-integration
[bay-acc]: https://www.bayzat.com/ksa/accounting-integration
[mena-me]: https://menaitech.com/en-sa/products/mename/
[mena-muqeem]: https://menaitech.com/en/news/menaitech-enables-clients-complete-residency-permits-staff-electronically-saudi-arabia/
[palm]: https://palmhr.net/en
[sejel]: https://www.sejeltech.com/
[buyer-guide]: https://www.bayzat.com/blog/best-hr-software-in-saudi-arabia/
[hono]: https://www.hono.ai/blog/hr-payroll-software-saudi-arabia
[mercans]: https://mercans.com/glossary/mudad-payroll-platform/

- Jisr features: <https://www.jisr.net/en/features>
- Jisr compliance: <https://www.jisr.net/en/saudi-compliance-management>
- Jisr security: <https://www.jisr.net/en/security>
- Jisr integrations page: <https://www.jisr.net/en/why-jisr/integration-with-government-systems-and-platforms>
- Jisr offboarding and assets update: <https://updates.jisr.net/en/updates-on-offboarding-assets-management>
- Jisr GOSI integration: <https://www.jisr.net/en/product-updates/integration-with-gosi>
- Jisr help, update employee salary in GOSI: <https://jisr.zendesk.com/hc/en-sa/articles/13786989457297-Update-employee-salary-in-GOSI>
- Jisr help, activating Mudad: <https://jisr.zendesk.com/hc/en-sa/articles/13753148309265-Activating-Mudad-integration-with-Jisr>
- Jisr help, ERP / accounting integration: <https://jisr.zendesk.com/hc/en-sa/articles/26593704650897-ERP-Accounting-Integration-with-Jisr-Comprehensive-User-Guide>
- ZenHR knowledge base: <https://zenhrsolutions.freshdesk.com/en/support/solutions>
- ZenHR integrations and APIs: <https://blog.zenhr.com/en/zenhr-integrations-apis-payroll-erp-accounting-government-bi-systems>
- ZenHR Mudad: <https://www.zenhr.com/en/marketplace-integration/mudad>
- ZenHR Muqeem native integration: <https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000685060-muqeem-native-integration>
- ZenHR ZKTeco native integration: <https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000670307-zkteco-attendance-machines-native-integration>
- ZenHR GOSI contribution rates integration: <https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000766003-general-organization-for-social-insurance-gosi-contribution-rates-integration>
- ZenHR Saudi labour-law map: <https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000793464-saudi-arabia-labor-law-full-reference-mapped-to-zenhr-features>
- ZenHR payroll module: <https://www.zenhr.com/en/modules/payroll>
- Bayzat KSA features: <https://www.bayzat.com/ksa/features>
- Bayzat KSA home (insurance, search-indexed): <https://www.bayzat.com/ksa>
- Bayzat Mudad: <https://www.bayzat.com/ksa/mudad>
- Bayzat Muqeem: <https://www.bayzat.com/ksa/muqeem-integration>
- Bayzat accounting integration: <https://www.bayzat.com/ksa/accounting-integration>
- Menaitech MenaME and suite: <https://menaitech.com/en-sa/products/mename/>
- Menaitech Muqeem news: <https://menaitech.com/en/news/menaitech-enables-clients-complete-residency-permits-staff-electronically-saudi-arabia/>
- Palm HR: <https://palmhr.net/en>
- Sejel Technology (IT services, not HR): <https://www.sejeltech.com/>
- Bayzat buyer guide (vendor-written): <https://www.bayzat.com/blog/best-hr-software-in-saudi-arabia/>
- HONO comparison (vendor-written): <https://www.hono.ai/blog/hr-payroll-software-saudi-arabia>
- Mercans, Mudad payroll platform: <https://mercans.com/glossary/mudad-payroll-platform/>

**Government, integration partners, law**
[elm-muqeem]: https://www.elm.sa/en/e-services/pages/muqeem.aspx
[hrsd-wps]: https://www.hrsd.gov.sa/en/ministry-services/services/wage-protection-file-upload-service
[hrsd-contract]: https://www.hrsd.gov.sa/en/ministry-services/services/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D9%88%D8%AF
[hrsd-disc]: https://www.hrsd.gov.sa/en/knowledge-centre/articles/64405
[chambers]: https://chambers.com/articles/recent-amendments-to-the-kingdom-of-saudi-arabia-labour-law-a-comprehensive-overview
[alfawaz-71]: https://alfawazco.com/Library/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-71-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D8%A7%D9%84%D8%AA%D8%AD%D9%82%D9%8A%D9%82/
[jadarat-spa]: https://www.spa.gov.sa/en/N2156625
[jadarat-hrdf]: https://www.hrdf.org.sa/en/media-center/news/general/launching-the-second-pilot-phase-of-the-unified-national-platform-for-employment-jadarat/
[zk-biotime]: https://zkteco.sa/biotime-95
[zk-api]: https://medium.com/@mohammedkamel24566/my-experience-integrating-zkteco-biometric-device-with-laravel-via-zkbiotime-api-8df2227d2bf8
[unifonic-wa]: https://www.unifonic.com/en/channels/whatsapp
[signit]: https://signit.sa/en/esignature
[sahl]: https://www.sahlsign.com/en/electronic-signature-saudi-arabia
[odoo-api]: https://www.odoo.com/documentation/18.0/developer/reference/external_api.html

- Elm Muqeem: <https://www.elm.sa/en/e-services/pages/muqeem.aspx>
- HRSD WPS file upload: <https://www.hrsd.gov.sa/en/ministry-services/services/wage-protection-file-upload-service>
- HRSD contract management: <https://www.hrsd.gov.sa/en/ministry-services/services/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D9%88%D8%AF>
- HRSD disciplinary sanctions (Art. 72): <https://www.hrsd.gov.sa/en/knowledge-centre/articles/64405>
- Chambers, 2025 labour-law amendments: <https://chambers.com/articles/recent-amendments-to-the-kingdom-of-saudi-arabia-labour-law-a-comprehensive-overview>
- Al Fawaz, Art. 71 (Arabic): <https://alfawazco.com/Library/%D8%A7%D9%84%D9%85%D8%A7%D8%AF%D8%A9-71-%D9%85%D9%86-%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D8%A7%D9%84%D8%AA%D8%AD%D9%82%D9%8A%D9%82/>
- SPA, Jadarat launch: <https://www.spa.gov.sa/en/N2156625>
- HRDF, Jadarat second pilot: <https://www.hrdf.org.sa/en/media-center/news/general/launching-the-second-pilot-phase-of-the-unified-national-platform-for-employment-jadarat/>
- ZKTeco BioTime 9.5: <https://zkteco.sa/biotime-95>
- ZKBioTime API write-up (secondary): <https://medium.com/@mohammedkamel24566/my-experience-integrating-zkteco-biometric-device-with-laravel-via-zkbiotime-api-8df2227d2bf8>
- Unifonic WhatsApp: <https://www.unifonic.com/en/channels/whatsapp>
- Signit e-signature: <https://signit.sa/en/esignature>
- Sahl Sign, e-signature in KSA: <https://www.sahlsign.com/en/electronic-signature-saudi-arabia>
- Odoo external API: <https://www.odoo.com/documentation/18.0/developer/reference/external_api.html>
