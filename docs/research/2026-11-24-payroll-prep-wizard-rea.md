# Payroll-prep wizard: how leading payroll products run the monthly cycle (REA study)

Date: 2026-11-24
Scope: research input for BASMA's nine-step monthly payroll-preparation wizard (معالج تجهيز مسير الرواتب).
Contains no Best Gas employee or payroll data.

---

## 1. Purpose and method

**Purpose.** BASMA is adding a strict, step-locked wizard that HR completes before a monthly salary run.
Each step must be confirmed in order, and each confirmation records who confirmed it and when. This
study checks that design against how established HRIS and payroll products run a pay cycle, so we can
copy what works, avoid known traps, and record deliberate differences.

**Method (REA applied to documentation).** We applied the reverse-engineering-analysis (REA) method to
**public vendor documentation, help centres, training material and product pages only**. We did not
inspect any binaries, tenants, trial accounts or private portals. Every claim carries one of three labels:

- **Observed**: stated in a public source, with the URL cited.
- **Inferred**: a reasonable reading of observed material, or a common industry pattern, not stated outright.
- **Unknown**: we found no public evidence. Several vendors (ADP GlobalView, Rippling, Deel, ZenHR approval)
  keep their detailed runbooks behind a login.

Limits: some help-centre pages refused automated fetching (HTTP 403/404). In those cases we relied on search
snippets from the same domain and marked the claims accordingly. Product behaviour also varies by release
and by country localisation.

---

## 2. Product-by-product findings

### 2.1 SAP SuccessFactors Employee Central Payroll: Payroll Control Center (PCC)

PCC splits the cycle into **Pre-Payroll (monitoring)**, **Payroll Production** and **Payroll Follow-Up**.
Checks are written as *policies* made of *validation rules* that raise alerts. Someone in a managerial
role reviews and signs off.

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Pre-payroll monitoring | Policies run validation rules on master data and test payroll data and raise alerts. Analysts clear or validate the alerts. | Processor validates each alert | https://blogs.sap.com/2014/12/22/successfactors-q4-2014-release-employee-central-payroll-payroll-control-center-add-on/ (Observed) |
| Release payroll | Payroll control record set to *Released*. Payroll-relevant master data for current and past periods is locked. | Payroll admin | https://blog.sap-press.com/how-to-make-the-payroll-control-center-operational (Observed) |
| Production run + checks | Productive run, check results, posting simulation to FI. | n/a | same (Observed) |
| Manager sign-off | A managerial role reviews the process and signs off that the data is in good shape. | Payroll manager, a different role from the processor | https://learning.sap.com/courses/sap-successfactors-employee-central-payroll-for-payroll-administrators-jp/ (search snippet; page later 404) (Observed via snippet) |
| Exit payroll | Period marked complete for every personnel number in the payroll area. | Payroll admin | https://help.sap.com/saphelp_46C/helpdata/EN/bb/db0bc34a3011d189490000e8323c4f/content.htm (Observed) |

Notes:
- Monitoring is split into smaller incremental processes, and sign-off steps have internal and external deadlines
  (https://blogs.sap.com/2015/07/10/new-features-sap-payroll-processing-control-center-rapid-deployment-solution/, Observed).
- Locking master data at "release" is SAP's cut-off mechanism. A change made after release is a *retro* for the next
  period (Inferred from the classic SAP retro model).

### 2.2 Workday Payroll

Workday's cycle is **Payroll Input → Run Pay Calculation → audit / review → Run Pay Complete → Settlement**.
Each worker's result has a status, and the status flips to *Requires ReCalculation* when input changes after
a calculation.

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Payroll input | One-time, ongoing, override and adjustment entries per worker or by worksheet/EIB. Hire and termination dates move one-time payments to the correct sub-period. | Payroll partner | https://doc.workday.com/workday-education/en-us/course-manuals/payroll-for-administrators/payroll-input.html (Observed) |
| Retro | Retro is reviewed with the Retro Calculation Processing Report, then marked complete with Run Retro Pay Complete. **Retro must be completed before regular payroll can complete.** | Payroll partner | https://doc.workday.com/admin-guide/en-us/payroll/retroactive-payroll/review-retroactive-payroll-results/wqh1587576456967.html (Observed) |
| Pay calculation | Run Pay Calculation for the pay group and period. | n/a | https://doc.workday.com/admin-guide/en-us/payroll/payroll-processing/process-payroll/dan1370796931755.html (Observed) |
| Audit | Run Payroll Audit applies audit rules, including *prior-period comparison* rules. Exceptions appear on the Payroll Audit Exceptions report. The audit waits if a calculation is still running. | Payroll partner reviews exceptions | https://doc.workday.com/admin-guide/en-us/payroll/payroll-and-accounting-results/audit-payroll-results/mhp1555521468308.html (Observed) |
| Pay Insights / anomalies | Machine-flagged pay anomalies to examine. | Payroll partner | https://doc.workday.com/admin-guide/en-us/payroll/pay-anomalies/examine-payroll-insight-results.html (Observed: page exists; detailed rules Unknown) |
| Complete | Run Pay Complete per period and pay group. Results flip to Complete. Aborting resets them to In Progress. | Security domain "Process: Run Batch Complete" | dan1370796931755 (Observed) |
| Settlement | Settlement journal entries, payslips. | n/a | same (Observed) |

The staleness mechanism is **Observed**. A worker carries one of three statuses: *Not Yet Started*,
*Requires ReCalculation* ("the period was calculated and the input changed") or *Waiting* (retro
pending) (payroll-input.html). Completing one pay group can push another group's results to
*Requires Re-Calculation* (dan1370796931755).

### 2.3 Oracle Fusion Global Payroll

Oracle packages the cycle as a **payroll flow** built from a *flow pattern*. Submitting a flow generates a
**Checklist** of tasks. Some tasks start automatically. Others are *Verify* tasks that pause the flow
until a person confirms them.

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Prerequisites + data validation | Run the Payroll Data Validation Report, which finds missing or noncompliant statutory data. The flow pauses for correction. | Verify task owner | https://docs.oracle.com/en/cloud/saas/human-resources/fauti/validation-report-for-payroll-for-the-us.html (Observed) |
| Retro | Retroactive Notification Report, then Recalculate Payroll for Retroactive Changes, then Verify Retroactive Report. | Verify task | https://docs.oracle.com/en/cloud/saas/human-resources/faaus/calculate-validate-and-balance-payroll-for-the-us.html (Observed) |
| Calculate + verify | Calculate Payroll, then Verify Report (Gross-to-Net). Balance exception reports. | Verify task | same (Observed) |
| Prepayments + payslips | Calculate Prepayments, then Verify Prepayments, then Verify Payslips. | Verify task | same (Observed) |
| Costing / GL | Payroll Costing Results, then Review Final Journal Entries, then post to GL. | Verify task | same (Observed) |
| Monitoring | Checklist page per flow. View Flows page across flows. | n/a | https://docs.oracle.com/en/cloud/saas/human-resources/faapq/overview-of-payroll-flows.html (Observed) |

Rework is **Observed**: each task must finish without errors or warnings. If one does not, you fix
the problem and *rerun*. Problem employees can be pulled out to QuickPay and merged back before
payments are calculated (calculate-validate-and-balance page). Oracle's 2026 readiness checklist recommends
rehearsing a playbook "covering inputs, settings, approvals, validation reports…"
(https://blogs.oracle.com/oraclehcm/wp-content/uploads/sites/120/2026/11/Companion-Payroll-Readiness-Checklist.pdf, Observed via snippet).
Whether Oracle *automatically* invalidates a completed Verify task when the underlying data changes is
**Unknown**. Public documentation shows only manual rerun and rollback.

### 2.4 ADP (Workforce Now / RUN / GlobalView)

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Prepare employee data | Pre-payroll data preparation and timecard close in the ADP time products. | Practitioner | https://otcdc1.adp.com/ezLMHelp/V18_30/WFN/General/StandardUI/en-US/as_help/as/eop_simp-intro.htm (Observed: ezLM time product) |
| Preview | Payroll Preview with a Liability Preview showing what ADP will debit. | n/a | https://support.adp.com/adp_payroll/content/hybrid/mobile-html/vera/VerifyPayroll.htm (Observed: ADP RUN mobile) |
| Approve | "Go back to the Preview screen and select Approve", which submits the payroll and withdraws funds. | Client payroll approver | same (Observed) |
| Validation checkpoints | ADP guidance lists validation "checkpoints" before payment, kept separate from routine audits. | Practitioner | https://au.adp.com/resources/articles-and-insights/articles/p/proper-pre-payment-practices.aspx (Observed via snippet) |
| GlobalView input cut-off and sign-off | Country payroll calendars with input cut-off and client sign-off. | Client | **Unknown**: no public GlobalView documentation found |

Cut-off: third-party sources put ADP's submission at 2–3 business days before pay date
(https://app.manifest.ly/public/checklists/payroll-processing-checklist). This is **Inferred** and not from an official ADP source.

### 2.5 Rippling

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Change capture | HRIS events (hire, termination, comp change) live in the same system, so the pay run reads them directly. | n/a | https://www.rippling.com/products/payroll (Inferred from "unified" positioning) |
| Review vs prior | "Compare your current pay run with previous ones to catch discrepancies before final approval". Drill into gross, taxes and deductions. | Payroll admin | https://www.rippling.com/products/payroll (Observed) |
| Approve | Role-based control over "who can view, create, manage, and approve pay runs". | Payroll admin | same (Observed) |
| Auto-approval | Scheduled runs can auto-approve. A workflow recipe alerts admins when auto-approval fails. | System | https://rippling.com/recipes/payroll-auto-approval-failure-alert (Observed) |
| Post-approval notice | Other payroll admins are notified when a run is approved. | n/a | https://rippling.com/recipes/pay-run-approved-notification (Observed) |
| Deadline | Approval deadline relative to pay date. | n/a | **Unknown** (not in public pages found) |

### 2.6 Deel (Global Payroll)

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Setup | Admins configure local pay rules, approvals and cut-offs per entity and country. | Admin | https://www.deel.com/en-gb/use-cases/run-global-payroll/ (Observed via snippet) |
| Input until cut-off | Changes are submitted until the cycle's cut-off date. After that, the cycle is *locked*. | n/a | https://support.hubstaff.com/deel-payroll-setup/ (Observed, third-party integration doc) |
| Late changes | A change that misses the cut-off goes to the next cycle or an off-cycle payment. Items can be shifted between payrolls. | n/a | same; https://www.deel.com/blog/whats-new-november-2025/ (Observed via snippet) |
| Error detection | AI payroll error detection before approval. | n/a | https://www.deel.com/blog/ai-payroll-error-detection/ (title Observed; rules Unknown) |
| Approval | Client approves the payroll report before funding. | Client admin | **Inferred** (industry pattern; Deel help pages not public) |

### 2.7 Jisr (Saudi)

| Stage (Arabic) | What happens | Sign-off | Evidence |
|---|---|---|---|
| Start payroll (بدء المسير) | Start Payroll prepares the month. A new run can be blocked if the previous run is not closed. | Payroll admin | https://jisr.zendesk.com/hc/en-sa/articles/15051223467665 (Observed via snippet; page 403 on fetch) |
| Attendance sheet (كشف الحضور) | Attendance-sheet confirmation can be set as a **required step** before payroll is confirmed. The attendance manager who approves it is configurable. | Attendance manager | same + https://jisr.zendesk.com/hc/en-sa/articles/13348706441233 (Observed via snippet) |
| New hires / excluded (الموظفون الجدد / المستبعدون) | A "New Hires" view lists joiners this period. An "Excluded" count shows who is left out of the run. | Payroll admin | 15051223467665 (Observed via snippet) |
| Review requests | Review missing-punch corrections, loans, expense claims, business trips, EOS accrual, paid and unpaid leave. | Payroll admin | https://jisr.net/en/run-payroll (Observed via snippet) |
| Final settlement | EOS calculated automatically. Article 77 compensation added to final-settlement logic (Feb 2026). | n/a | https://www.jisr.net/en/product-updates/february-2026 (Observed via snippet) |
| Approval chain (سلسلة الاعتماد) | When activated, the payroll is sent for review. Each chain member confirms it. The chain is set under "Collaborators and rules". | Configured approvers | 13348706441233 (Observed via snippet) |
| Pay | Mudad WPS file generated. Integration with GOSI, Saned and Mudad. | Payroll admin | https://jisr.net/en/run-payroll ; https://jisr.zendesk.com/hc/en-sa/articles/13348883052305 (Observed) |

### 2.8 ZenHR (Saudi / Jordan)

| Stage | What happens | Sign-off | Evidence |
|---|---|---|---|
| Payroll calculation | Payroll module with attendance, leave, GOSI and EOS. | Payroll admin | https://www.zenhr.com/en/modules/payroll (Observed: module exists) |
| Salary batch | Salaries are grouped into a Salaries Batch. | Payroll admin | https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000650651-mudad-integration (Observed) |
| Send to Mudad | "Send to Mudad" sets a transfer date (next working day or later). Payment status can be viewed. "Cancel Mudad Transaction" cancels a transfer. | Mudad signatory (OTP-verified at setup) | same (Observed) |
| Data matching | Employee names must match across ZenHR, Mudad, the bank and GOSI, or the transfer may fail. | n/a | same (Observed) |
| Internal approval before send | n/a | n/a | **Unknown** (the article does not describe one) |
| Year-end / EOS prep | Guidance on EOSB settlements. | n/a | https://blog.zenhr.com/en/how-to-prepare-for-year-end-payroll-eosb-settlements-in-saudi-arabia-2025-guide (Observed) |

---

## 3. Cross-product pattern synthesis

### 3.1 Common stage order

Every product that publishes its cycle follows the same skeleton:

1. **Open period / start run.** Blocked if the previous period is not closed (Jisr Observed; SAP control record Observed).
2. **Collect inputs up to a cut-off.** Time and attendance, then HR events, then one-time pays and deductions.
3. **Validate inputs (pre-calc).** SAP PCC pre-payroll policies, Oracle Payroll Data Validation Report.
4. **Retro.** Changes dated in closed periods (Workday and Oracle both make retro a gate before completion).
5. **Calculate.**
6. **Audit results (post-calc).** Prior-period comparison, exceptions, gross-to-net, balances.
7. **Approve / sign-off.** Usually a different role from the processor (SAP manager sign-off, Jisr approval chain, Rippling approver permission).
8. **Complete / exit**, then payments (bank or WPS file), then GL posting.

### 3.2 Change-capture model ("delta since last period")

- **Event-driven, not re-keyed.** Hires, terminations and compensation changes are effective-dated HR
  transactions that the payroll engine reads for the period. Payroll Input covers only *one-time* and
  override amounts (Workday Observed; Rippling Inferred).
- **Proration comes from effective dates.** Workday prorates mid-period changes to ongoing entries,
  but "payroll input does not cause proration" (Observed). Hire-date and termination-date rules move
  one-time payments to the first or last sub-period (Observed).
- **Retro is the delta for closed periods.** Workday and Oracle detect back-dated changes and calculate
  differences, which must be reviewed before the current run completes (Observed).
- **Explicit joiner/leaver lists.** Jisr shows a New Hires view and an Excluded count for the period (Observed).

### 3.3 Cut-off model

Two dates are always distinct: **input/attendance cut-off** and **pay date**.
- SAP: *release* of the control record locks master data. The run is then calculated, then *exit* (Observed).
- Deel: changes after cut-off go to the next cycle or off-cycle (Observed, third-party).
- Workday: audit rules can apply a *balance period cut-off date* (Observed). The period cut-off itself is in pay-group calendars (Inferred).
- KSA: attendance windows commonly close before month-end so late days carry into next month (Inferred).
  The statutory backstop is that wages are paid monthly and the WPS file is uploaded within 30 days (see §4).

### 3.4 Checks run before approval

| Check | Who does it (evidence) |
|---|---|
| Missing or invalid statutory or master data | Oracle Payroll Data Validation Report (Observed); SAP PCC pre-payroll policies (Observed) |
| Missing bank or payment details | Oracle Verify Prepayments / View Payments (Observed); ADP payment-method review (Inferred); ZenHR name match bank↔GOSI↔Mudad (Observed) |
| Negative or zero net pay | Common audit rule (Inferred: Workday audit-rule examples not public; SAP PCC rapid-deployment ships reconciliation rules, Observed generally) |
| Variance vs prior period (per employee, per element, totals) | Workday prior-period comparison audit rules (Observed); Rippling pay-run comparison (Observed); Oracle Gross-to-Net and Periodic Activity reports (Observed) |
| Headcount reconciliation (last month + hires − leavers = this month) | Jisr New Hires and Excluded counts (Observed); explicit formula not documented (Inferred) |
| Retro outstanding | Workday "Requires ReCalc due to Retro" blocks completion (Observed) |
| Anomalies (ML) | Workday Payroll Insights (Observed: exists); Deel AI error detection (Observed: exists) |
| GOSI wage match | Mudad rejects files where basic salary ≠ GOSI-registered salary (Inferred from secondary source https://noqta.tn/en/blog/wps-file-rejection-reasons-mudad-saudi-2026) |

### 3.5 Four-eyes approval

- SAP PCC: the processor clears alerts and a *managerial role* signs off (Observed).
- Jisr: a configurable approval chain separate from the payroll admin (Observed).
- Rippling: separate approve permission, with other admins notified on approval (Observed).
- Workday and Oracle: enforced through security domains and business-process approvals (Inferred. Domains are Observed; a strict "approver ≠ preparer" rule is not documented publicly).
- **No source shows a product that technically forbids the same person from preparing and approving.**
  This is usually a configuration or audit control (Inferred). BASMA enforcing it in code would be stricter than the norm.

---

## 4. Saudi specifics affecting pay-run prep

| Rule | Effect on the wizard | Evidence |
|---|---|---|
| **Art. 84: EOS award**: half a month's wage per year for the first 5 years, then one month per year after | Step 4 (leavers) must calculate EOS on the last wage and full service length, including partial years | https://hrsd.gov.sa/en/knowledge-centre/articles/317 (Observed via snippet) |
| **Art. 85: resignation scale**: nothing under 2 years; ⅓ at 2–5 years; ⅔ at 5–10 years; full at 10+ | Step 4 must record the *reason for leaving* (resignation vs termination) because it changes the amount | same; https://www.qoyod.com/en/glossary/article-84-labor-law/ (Observed) |
| **Arts. 92–93: deductions**: deductions need written consent except listed cases. Employer-loan recovery is capped at 10% of wage. Court debts are capped at ¼. **Total deductions ≤ 50% of the due wage** unless a labour court allows more, and never more than ¾ | Step 7 must hard-check each employee's total deductions against 50% of the due wage and flag loan instalments above 10% | https://hrsd.gov.sa/en/knowledge-centre/articles/311 (Observed). Article numbering differs across secondary sources (Qoyod puts the cap in Art. 91/93), so cite the HRSD text |
| **GOSI**: monthly contributions on the registered wage (basic + housing) | Step 5 (package changes) must flag a change to basic or housing because the GOSI-registered wage needs updating, or the Mudad match fails | https://blog.zenhr.com/en/payroll-compliance-in-saudi-arabia-gosi-wps-mudad-explained (Observed); contribution rates not restated here |
| **Mudad / WPS file**: upload deadline cut from 60 to **30 days**, effective 1 Mar 2025 | After approval, the WPS file must be produced and uploaded within 30 days. The wizard should show this deadline | https://www.deloitte.com/middle-east/en/services/tax/perspectives/update-on-wage-protection-system-file-uploading-period.html (Observed) |
| WPS file must match GOSI and identity data | Pre-approval check: IBAN present, ID present, wage consistent with GOSI | https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000650651-mudad-integration (Observed) |
| **Qiwa**: contract and employment status platform | Leavers (step 4) and status changes (step 2) should be consistent with Qiwa contract termination. BASMA tracks a "Qiwa updated" flag rather than integrating | Jisr lists Qiwa integration as "soon" (https://www.jisr.net/en/lp-compliance, Observed via snippet) |
| Art. 77 compensation on unlawful termination | Final settlement may include it. Jisr added it to its final-settlement logic in Feb 2026 | https://www.jisr.net/en/product-updates/february-2026 (Observed via snippet) |

Specific GOSI rates, the SAR 10,000 non-upload fine and the "20 days" upload figure appear only in secondary
blogs and are marked **Unknown/unverified**.

---

## 5. Mapping to BASMA's nine steps

Context from the BASMA repo notes (`src/CLAUDE.md`, no data read). Payroll.gs already has several of these pieces:
- `calcSlip_` caps deductions at 50% of wage due and fines at 5 days (Art. 70);
- a locked run is approved by a payroll holder who did not prepare it or last recalculate it;
- pay groups carry an attendance window (`pgWindow_`, `attFrom`/`attTo`);
- `payrollApprove` fails `recon_open` while a GOSI/Qiwa mismatch is open;
- `wpsFile` checks IBAN, ID and net > 0.

The wizard should **reuse these checks** rather than duplicate them.

| # | BASMA step | What leading products do | What BASMA will do | Gap / deliberate difference |
|---|---|---|---|---|
| 1 | Working days / attendance (أيام العمل والحضور) | Jisr makes attendance-sheet confirmation an optional required gate and assigns an attendance manager (Observed). Workday and SAP read time data up to the period cut-off. | Per-person working days for the attendance cut-off window, confirmed by HR with user and timestamp. | BASMA makes the gate **mandatory**, not optional. Show the cut-off window dates explicitly. |
| 2 | Employee status (حالة الموظف) | Status lives in core HR. Jisr shows an "Excluded" count (Observed). | Active / suspended / on-leave / unpaid, listed and confirmed. | Mostly a review step, because products don't have a separate gate. Keep it: in a small business, status drift is a main error source. |
| 3 | New hires, prorated (الموظفون الجدد) | Jisr New Hires view (Observed). Workday hire-date sub-period rules and effective-date proration (Observed). | List joiners since the last run with prorated days and amounts. | Same as the norm. Show the proration formula per person. |
| 4 | Leavers + final settlement / EOS (المغادرون والمخالصة النهائية) | Jisr calculates EOS automatically, plus Art. 77 (Observed). Workday moves post-termination payments to the last sub-period (Observed). | Last working day, reason, EOS per Arts. 84/85, leave encashment, final settlement. | A leaver's reason is mandatory because Art. 85 depends on it. Consider an off-cycle settlement option like Oracle QuickPay. |
| 5 | Package (salary) changes (تغييرات الراتب) | Effective-dated comp changes. Retro for back-dated ones (Workday and Oracle Observed). | List comp changes with effective date. Prorate mid-month. | **Gap**: BASMA has no full retro engine. A back-dated change must be shown as an explicit "retro difference" line. Flag a GOSI wage update when basic or housing changes. |
| 6 | Additions with supporting documents (الإضافات مع المستندات) | Workday one-time / adjustment Payroll Input, with comments for Special Entry (Observed). | One-time additions, each with an attached document. | **Stricter**: a document is required for every addition, where products only require comments for special entries. |
| 7 | Deductions (الخصومات) | Payroll input deductions. Statutory limits are left to localisation. | Deductions with reason. Hard 50% cap and 10% loan-instalment check. | Saudi caps are enforced in the step itself, not left to audit. |
| 8 | Review vs last month (المراجعة مقابل الشهر السابق) | Workday prior-period audit rules (Observed). Rippling compare-to-previous (Observed). Oracle Gross-to-Net (Observed). | Variance per employee and in total, headcount reconciliation, missing IBAN, negative/zero net, deduction-cap breaches. | Products run this *after* calculation. BASMA's step 8 is the same, so it needs the calculated draft. |
| 9 | Approval by a different payroll holder (اعتماد من حامل صلاحية آخر) | SAP manager sign-off, Jisr approval chain, Rippling approve permission (Observed). | Approver must hold the payroll permission and must not be anyone who confirmed steps 1–8. | **Stricter** than the observed norm, which relies on configuration (Inferred). Keep it. |

### 5.1 Recommendation: stale confirmations ("fingerprint" model)

**Recommendation.** When a step is confirmed, store a **fingerprint** (a hash) of the exact data the
step covered: the period, cut-off dates, the employee set and the relevant field values or rows. Store
it next to the confirming user and timestamp. Whenever the wizard is opened or any covered record
changes, recompute the hash:

- If the hash differs, mark the confirmation **stale** (متقادم). Keep the original who/when in history
  and require re-confirmation.
- **Lock every later step again**. Their confirmations also become stale, because they depended on
  the earlier data. Step 8 variance and step 9 approval must never survive an upstream change.
- Record the event ("step 3 invalidated by change to employee X hire date by user Y at T") in the audit log.

**Precedents:**
- **Workday**: after a calculation, input changes flip a worker to *Requires ReCalculation*.
  Completing one pay group can push other groups to *Requires Re-Calculation*. Outstanding retro blocks
  completion (Observed, payroll-input.html and dan1370796931755). This is the closest public analogue,
  but it works at the *calculation result* level, not the *human confirmation* level.
- **Oracle**: Verify tasks pause the flow. Tasks must finish without errors, and after corrections you
  rerun (Observed). Automatic invalidation of an already-verified task is **Unknown**.
- **SAP**: *Release* locks master data so it cannot change during the run (Observed). This is the opposite
  strategy: prevent changes instead of detecting them.
- **Jisr**: a new run is blocked until the previous one is closed (Observed). Invalidation within a run is Unknown.

**Deliberate difference.** BASMA does both. It detects changes with fingerprints, like Workday's
status model applied to sign-offs. Once step 9 is approved, it freezes the period, like SAP's release lock.
Any later change becomes an adjustment line in the next month.

---

## 6. Finding ledger

| # | Claim | Status | Source |
|---|---|---|---|
| 1 | SAP PCC has Pre-Payroll, Production and Follow-Up stages | Observed | learning.sap.com PCC lesson (search snippet) |
| 2 | SAP PCC validation rules raise alerts on potential issues | Observed | https://blogs.sap.com/2014/12/22/successfactors-q4-2014-release-employee-central-payroll-payroll-control-center-add-on/ |
| 3 | A managerial role signs off in SAP PCC | Observed | learning.sap.com (snippet); https://blog.sap-press.com/how-to-make-the-payroll-control-center-operational |
| 4 | SAP release locks payroll-relevant master data; exit completes the period | Observed | https://blog.sap-press.com/how-to-make-the-payroll-control-center-operational ; https://help.sap.com/saphelp_46C/helpdata/EN/bb/db0bc34a3011d189490000e8323c4f/content.htm |
| 5 | Workday statuses include Requires ReCalculation when input changes after a calculation | Observed | https://doc.workday.com/workday-education/en-us/course-manuals/payroll-for-administrators/payroll-input.html |
| 6 | Workday payroll input does not cause proration; mid-period ongoing changes prorate | Observed | same |
| 7 | Workday retro must be completed before regular payroll completes | Observed | https://doc.workday.com/admin-guide/en-us/payroll/retroactive-payroll/review-retroactive-payroll-results/wqh1587576456967.html |
| 8 | Workday audit supports prior-period comparison rules and an exceptions report | Observed | https://doc.workday.com/admin-guide/en-us/payroll/payroll-and-accounting-results/audit-payroll-results/mhp1555521468308.html |
| 9 | Workday Run Pay Complete is gated by security domains | Observed | https://doc.workday.com/admin-guide/en-us/payroll/payroll-processing/process-payroll/dan1370796931755.html |
| 10 | Oracle payroll flows generate a Checklist and Verify tasks pause the flow | Observed | https://docs.oracle.com/en/cloud/saas/human-resources/faaus/calculate-validate-and-balance-payroll-for-the-us.html |
| 11 | Oracle Payroll Data Validation Report finds missing or noncompliant data before calculation | Observed | https://docs.oracle.com/en/cloud/saas/human-resources/fauti/validation-report-for-payroll-for-the-us.html |
| 12 | Oracle auto-invalidates verified tasks on data change | Unknown | none found |
| 13 | ADP approve = submit payroll and withdraw funds, from the Preview screen | Observed (ADP RUN) | https://support.adp.com/adp_payroll/content/hybrid/mobile-html/vera/VerifyPayroll.htm |
| 14 | ADP submission cut-off is 2–3 business days before pay date | Inferred | https://app.manifest.ly/public/checklists/payroll-processing-checklist (third-party) |
| 15 | ADP GlobalView cut-off and sign-off workflow | Unknown | none public |
| 16 | Rippling compares the current pay run with previous ones before approval | Observed | https://www.rippling.com/products/payroll |
| 17 | Rippling supports auto-approval and alerts on its failure | Observed | https://rippling.com/recipes/payroll-auto-approval-failure-alert |
| 18 | Rippling approval deadline | Unknown | none found |
| 19 | Deel cut-offs are configured per entity and country; locked cycles push changes to next cycle or off-cycle | Observed (partly third-party) | https://www.deel.com/en-gb/use-cases/run-global-payroll/ ; https://support.hubstaff.com/deel-payroll-setup/ |
| 20 | Deel offers AI payroll error detection | Observed (existence) | https://www.deel.com/blog/ai-payroll-error-detection/ |
| 21 | Jisr can make attendance-sheet confirmation a required step before confirming payroll | Observed (snippet) | https://jisr.zendesk.com/hc/en-sa/articles/15051223467665 |
| 22 | Jisr shows New Hires and Excluded counts in a run | Observed (snippet) | same |
| 23 | Jisr payroll approval chain: each member reviews and confirms | Observed (snippet) | https://jisr.zendesk.com/hc/en-sa/articles/13348706441233 |
| 24 | Jisr blocks a new run until the previous one is closed | Observed (snippet) | Jisr help centre (search snippet) |
| 25 | Jisr calculates EOS and added Art. 77 to final settlement | Observed (snippet) | https://www.jisr.net/en/product-updates/february-2026 |
| 26 | ZenHR sends salary batches to Mudad, shows payment status, allows cancel | Observed | https://zenhrsolutions.freshdesk.com/en/support/solutions/articles/43000650651-mudad-integration |
| 27 | ZenHR requires names to match across ZenHR, Mudad, bank and GOSI | Observed | same |
| 28 | ZenHR internal approval before Send to Mudad | Unknown | not in article |
| 29 | Saudi EOS: ½ month per year for first 5 years, 1 month after (Art. 84) | Observed | https://hrsd.gov.sa/en/knowledge-centre/articles/317 |
| 30 | Resignation EOS scale ⅓ / ⅔ / full; nothing under 2 years (Art. 85) | Observed | same; https://www.qoyod.com/en/glossary/article-84-labor-law/ |
| 31 | Total deductions ≤ 50% of due wage (court may allow up to ¾); employer-loan recovery ≤ 10% | Observed | https://hrsd.gov.sa/en/knowledge-centre/articles/311 |
| 32 | Mudad WPS upload window cut to 30 days from 1 Mar 2025 | Observed | https://www.deloitte.com/middle-east/en/services/tax/perspectives/update-on-wage-protection-system-file-uploading-period.html |
| 33 | Mudad rejects files when basic ≠ GOSI-registered salary | Inferred | https://noqta.tn/en/blog/wps-file-rejection-reasons-mudad-saudi-2026 (secondary) |
| 34 | SAR 10,000 fine for not uploading WPS | Unknown | secondary blog only |
| 35 | No product found technically forbids preparer = approver | Inferred | absence across all sources above |
| 36 | Common stage order: open → inputs to cut-off → validate → retro → calculate → audit → approve → complete/pay | Inferred | synthesis of rows 1–27 |
