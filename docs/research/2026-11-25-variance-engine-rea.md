# Payroll variance engine: what exists, what the leaders do, what to build (REA, 2026-11-25)

Scope: the payroll VARIANCE engine only (month against month, why net moved, who to check before approval).
Read only. No code was changed. Payroll data never left the repo; the web research covered public product docs only.

Evidence labels: **Observed** (seen in code at file:line, or on a public page at a URL), **Inferred** (follows from what was seen),
**Unknown** (not found).

---

## 1. What BASMA has today

### 1.1 Backend engines (`backend/Payroll.gs`)

| Piece | Where | What it does |
|---|---|---|
| `VAR_PCT_ = 10`, `VAR_MIN_ = 100` | Payroll.gs:1220 | A change counts when it is both ≥10 % and ≥100 SAR. These are global. A request can override them (`req.pct`, `req.min`), but nothing stores them per element or per org. |
| `api_payrollVariance` (old, one run) | Payroll.gs:1221-1333 | Compares one run with the two months before it. Returns totals vs m1 / m2 / their average, by department (with cost centre), by line, and every person with flags and a score. Also returns a bridge (from → joiners, leavers, stayers → to), drivers (`VAR_DRIVERS_`), volume vs rate, a 12-month trend and expected-package vs actual gross. Audited as `salary_view`. |
| `VAR_DRIVERS_` / `varDriver_` | Payroll.gs:1335-1344 | Maps each line to one of nine drivers: pay, overtime, one-off, absence, GOSI, advances, fines, other deductions, other. Deductions are signed against net. `other` takes the leftover, so drivers always sum to the stayers' change (1310). |
| `lineKey_` | Payroll.gs:1363 | Pay-line key: `e:`/`d:` + code, plus a label for named lines. The client's `regKey()` uses the same rule. |
| `VARM_DIMS_` / `VARM_FIELDS_` | Payroll.gs:1367-1368 | Dimensions: department, location, city, payGroup (sponsor), nationality, saudi, employmentType, title. Fields: gross, deductions, net, GOSI employee and employer, companyCost. **No cost-centre dimension.** |
| `CITY_RULES_`, `cityOf_`, `api_varianceCities` | Payroll.gs:1369-1395 | Works out the city from the location name. HR's own mapping is saved per org in the `varCities` script property. Otherwise the city defaults to "Riyadh, assumed". |
| `payBook_` | Payroll.gs:1401-1442 | The book month by month. It only covers runs this viewer may open (`runAccess_`). Per pay group it takes the locked runs, else the drafts. Gives per-person totals and lines per month, detects net-only months (imported "approved net" lines), and returns each person's dimensions. |
| `varFilter_` | Payroll.gs:1444-1459 | Shared filters: list per dimension, flags, free text, changed-only. Each option's count reflects all the other filters. |
| `api_payrollMonthly` | Payroll.gs:1467-1488 | Up to 24 months side by side, per person: gross, deductions, net, cost, days, employer GOSI, sponsor. Uses the same filters. |
| `api_payrollVarianceMonth` (the deep engine) | Payroll.gs:1489-1641 | The whole month, every pay group added, against a base (detail below). |
| `api_payrollPivot` | Payroll.gs:1651-1697 | Month × sponsor cells with every pay line (up to 24 months), plus optional payslip-level detail for one month (lines and IDs). |
| Prep wizard step 8 "review" | Payroll.gs:1839-1850 | People in the run whose net moved ≥`VAR_PCT_` and ≥`VAR_MIN_` against last month's locked slips of the same group, plus blocking errors (`no_package`, `net_negative`). The whole step is confirmed with one note (`api_payrollPrepConfirm`, 1880). |

`api_payrollVarianceMonth` in detail:
- **Base options** (1497-1507): m1, m2, avg3, avgN (1-24), yoy, `pick:` (any set of months, averaged), or one explicit month.
- **Per person** (1539-1580):
  - flags: joiner, returner, leaver, net_up / net_down, deductions_spike, package_change, new_line, gone_line, net_zero (≤0), one_off, absence, off_package (gross vs contract), paid_inactive;
  - a score;
  - drivers, top 5 reasons, lines now vs base;
  - 12-month net and paid-days history;
  - the package change record (date, reason, approver).
- **Totals** (1586-1640): totals, bridge, drivers, volume/rate, lines, every dimension with joiners, leavers, flagged, drivers and topDriver, and a 12-month trend. All are rebuilt from the filtered people, so every number on the screen agrees.
- **Net-only months** turn off the line, gross and package checks (1511).

### 1.2 Reports catalogue (`backend/Reports.gs`)

| Report | Line | Access | Variance content |
|---|---|---|---|
| `pay_variance` | 49, 488-507 | money (hr, payroll) | Net and gross per person against the previous **locked run of the same group and scope**. Flag new / missing / changed / same at a threshold %. |
| `pay_var_lines` | 56, 1271-1298 | money | Each moved line per person whose net moved: effect on net, share of the change, and which line drove it. |
| `pay_cost` | 51, 530-552 | cost (adds executive) | By department / cost centre: company cost (gross, employer GOSI, EOS accrual), against the previous run. Folding: see below. |
| `pay_company_cost` | 54, 1474-1494 | money | Per person: company cost and change vs the previous run. |
| `pay_gosi_wage` | 55, 1498-1525 | money | The GOSI wage against gross and against the latest GOSI upload (`salaryRecon`). Reasons: registered_differs, cap, floor, low_share. |
| `pay_ot_trend`, `pay_cost_per_head` | 61-62, 1426-1470 | cost | Month series with change vs the month before. Hides groups under `RX_MIN_GROUP = 3` (730) for cost-only viewers. |

Small groups:
- `reportNarrowCheck_` and `reportFoldSmall_` / `foldSmallRows_` (198-236) apply `MIN_REPORT_GROUP_ = 5` to `cost` reports for viewers without payroll access.
- **The monthly `rx*` cost reports use 3, not 5** (730, 1250). That is inconsistent with the CLAUDE.md rule "executives never see <5" (CLAUDE.md:567). **Observed.**

### 1.3 Budget vs actual (`backend/Wave7.gs:12-108`)

- `api_budgetSave` stores monthly budgets per company or per department.
- `api_budgetView` shows actual company cost per month (locked runs preferred), variance and variance %, last year, and a run-rate forecast for the year end.
- Per-department rows are folded under `MIN_GROUP_ = 5` for executives (82-102).
- It is **not linked to the variance screen**: there are no drivers and no people. Tests: `tests/wave7.js:36,40`.

### 1.4 Reconciliations (`backend/Compliance.gs`)

- `api_reconUpload` (236-264) compares **wages** (GOSI basic + housing, Qiwa basic) against the packages. An open mismatch blocks `payrollApprove` (Payroll.gs:313).
- `api_wpsFile` (96-127) builds the bank file with per-row problems and the file total. `api_wpsStep` records generated → uploaded → confirmed.
- **Missing:** no reconciliation of the GOSI *invoice amount* against payslip GOSI, and none of the WPS/bank paid total against payroll net or against the journal. **Observed** (no such action found).

### 1.5 Screens

| Screen | Where | Shows | Exports | Who |
|---|---|---|---|---|
| Pay ▸ Variance (`pay:variance`) | index.html:5336, 5427; `js/variance.js` `varianceSection` 488-651 | See the breakdown after this table. | Excel (`exportVar` 628-649: people, one sheet per dimension, trend, lines; SUBTOTAL formulas via `js/xl.js:95-106`) and print (`printVar` 449) | `salaryOk()` = payroll, or hr who is not admin (index.html:5264). Server: `canPayroll_`. |
| Pay ▸ Month by month (`pay:monthly`) | index.html:5337; `monthlySection` 656-753 | Months side by side by person or dimension; amounts / change / change %; trend | Excel (`exportMo`) | same |
| Pay ▸ Combined sheet (`pay:sheet`) | index.html:5335; `sheetSection` 235-365 | `payrollPivot` month × sponsor, plus the month's payslips | Excel (full) | same |
| Run ▸ "Variance" drawer | `js/payroll.js:688`, `varianceView` 940-990 | The old `payrollVariance`: tiles, bridge with drivers, depts, lines, people (filters flagged, all, up, down, new, gone), threshold | CSV | payroll |
| Prep wizard step 8 | Payroll.gs:1839 | Movers vs last month, errors | - | payroll |
| Reports ▸ payroll | Reports.gs:48-62 | See 1.2 | Report Excel / PDF / schedules | money or cost |
| Pay ▸ Budget (`pay:budget`) | Wave7 | Budget vs actual | - | executive (masked), hr, payroll |

The Pay ▸ Variance screen shows:
- a story paragraph;
- tiles;
- insights (`vaInsights` 391-415);
- a trend in six measures;
- the bridge with drivers;
- the biggest movers;
- moving lines;
- a distribution chart;
- a department × driver heatmap (`vaHeat` 417);
- a mix chart;
- volume vs rate;
- a dimension table (click to filter);
- a lines table;
- a people table, with a drawer (`person` 597) showing lines, why (`vaWhy` 372), flags, the 12-month net trend and days per month.

Filters are chips for every dimension plus flags and changed-only. Thresholds are set in a settings popover. City mapping is set in a drawer.

**Executives have no variance screen at all.** Their only views are the `pay_cost` report, dashboard cost and budget. **Observed.**

### 1.6 Tests

| File | What it covers |
|---|---|
| `tests/variance.js` (49 lines) | The old engine: flags, bridge sums, drivers sum to stayers, volume + rate = change, trend, reasons, expected. |
| `tests/variance-month.js` (168 lines) | Pay groups added, no false leavers, bridge and drivers sum, every dimension, city rules and overrides, filters and option counts, avg3 / avgN / pick / yoy, employee refused, pivot detail, month-by-month, package-change record, days history, net-only months. |
| `tests/reports.js:414` | `pay_var_lines` |
| `tests/wave7.js:36-40` | Budget variance |
| `tests/sim50.js:1432` | Role map for `payrollVariance`, `payrollVarianceMonth`, `payrollMonthly`, `payrollPivot`, `varianceCities` |

**No test** covers: explanations or sign-off, executive masking of variance, reconciliation of payroll totals to WPS, GOSI or the journal, or per-element thresholds.

### 1.7 Defects found while reading (Observed)

1. **The old drawer engine mixes pay groups and ignores `runAccess_`.**
   - Code: `api_payrollVariance` takes the current month as one run (`ids.m0 = [run.id]`) but the prior months as **every** non-cancelled run of that month (Payroll.gs:1226-1228). The 12-month trend does the same (1317).
   - Effect 1, false results: for a run of one pay group, everyone paid by other groups last month shows up as a **leaver**, which distorts the bridge, the totals and the drivers.
   - Effect 2, a privacy leak: their names and nets reach a payroll user who has no access to those closed groups. `payBook_` (1404) does filter correctly, so the fix is to reuse it.
   - `tests/variance.js` uses a single group, so the test suite does not catch this.
2. **The cost reports use two different small-group thresholds:** `RX_MIN_GROUP = 3` (Reports.gs:730) and 5 elsewhere.
3. **Two variance engines with different definitions of "previous":**
   - `pay_variance` uses the last locked run of the same group (Reports.gs:492);
   - the drawer uses every run of m1;
   - the page uses `payBook_` (locked per group, else drafts).
   - So the same month can show three different "last month" figures. **Inferred** from the code.

---

## 2. What leading products do (public docs)

| Product | Capability | Evidence |
|---|---|---|
| Workday | Audit rules with a prior-period comparison, e.g. a row for net and gross variance >10 %. Runs via "Run Payroll Audit" and lists exceptions on "Payroll Audit Exceptions". | Observed: doc.workday.com/admin-guide/en-us/payroll/payroll-and-accounting-results/audit-payroll-results/bib1544736234896.html |
| Workday | "Pay Calculation Results Comparison to a Prior Period", by pay group, by worker and as a period summary. Compares in-progress vs any completed period, or any two completed periods. | Observed (same doc set, hrn1555600025286.html, tmn1553025664608.html) |
| Workday | Exceptions get assignment and routing. An exception is "Resolved" only after the audit is rerun. A scheduler runs audits. "Pay anomalies / payroll insight results". | Observed (doc set above; doc.workday.com/admin-guide/en-us/payroll/pay-anomalies/examine-payroll-insight-results.html) |
| SAP SF Payroll Control Center | Policies made of validation rules. KPIs are generated after validations. Alerts are assigned to processors or teams and carry notes and attachments. A gross-pay comparison KPI tile drills to current vs previous per employee and wage type. | Observed: learning.sap.com/courses/sap-successfactors-payroll-control-center/running-and-validating-continuous-payroll-with-pcc ; learning.sap.com/courses/sap-successfactors-employee-central-payroll-project-team-orientation/managing-payroll-alerts_e5bf8722-e322-4280-bcca-7efbfedd5e4f ; blogs.sap.com/2021/01/17/payroll-control-center-and-pa03-conundrum/ |
| SAP SF PCC | Prior-period comparison beyond the KPI tiles needs a purpose-built validation policy; third parties sell "Variance Monitor" to fill the gap. | Observed (vendor white paper): epiuselabs.com …Complementing-PCC-Variance-Monitor… |
| ADP | Recommends comparing the current with the prior cycle and checking the gross-to-net arithmetic. Markets "AI-powered variance detection" in Workforce Now. QTD/YTD gross-to-net report. | Observed (marketing / guidance): adp.com/resources/articles-and-insights/articles/p/payroll-reconciliation.aspx ; adp.com/pdf/SBS_QRR_Overview.pdf. Exact report names and paths: **Unknown**. |
| Oracle Fusion | "Payroll Variance Report" compares two balance-report outputs (CSV). "Balance Exception Report" with previous-period / month columns, difference and difference %. Element Results Register and Payroll Register exist. | Observed: docs.oracle.com/en/cloud/saas/human-resources/fauti/payroll-variance-report.html ; …/faauk/balance-exception-report.html. Element-by-element register diff: **Unknown**. |
| Rippling | Compares the current pay run with previous ones before approval, with drill-down into gross, tax and deduction changes. | Observed (marketing): rippling.com/products/payroll |
| Gusto | On the Review step: per-employee comparison with recent payrolls and alerts (e.g. unusual hours). New hires lack history. | Observed: support.gusto.com/article/260112145935220 |
| Deel | Pay-run comparison | **Unknown** (nothing found) |
| Jisr | Integration with WPS, GOSI and Saned that "flags mismatches". A GOSI-invoice simulation report. "Payroll Comparison" described as a future feature. | Observed: jisr.net/en/lp-payroll ; jisr.zendesk.com/hc/en-sa/articles/13349831767441 |
| ZenHR, Bayzat | Monthly comparison | **Unknown** (no public docs found). Peers in the region (Talenox, HReasily, BrioHR) document "compare this month with any past month, component-wise". Observed: help.talenox.com/en/articles/5041622 ; support.briohr.com/knowledge/how-to-download-and-compare-company-payroll-variance-report-for-two-different-months |

What the leaders share (Inferred from the rows above):
1. Variance is a **rule set** that produces **exceptions**, not only a screen.
2. Exceptions are **assigned, explained and resolved**, and that state feeds approval.
3. Comparisons work at the **element (wage type) level**.
4. Statutory and bank figures are **reconciled** back to the payroll totals.

---

## 3. Gap analysis

Status key: ✅ have · ◐ partial · ✗ missing.

| # | Capability | BASMA | Note |
|---|---|---|---|
| G1 | Cost bridge / waterfall, last net → this net by driver | ✅ | Bridge plus nine drivers that sum exactly. **Missing pieces:** the GOSI driver does not separate a *rate step* (cohort or law change) from a wage change; new hires and leavers are not split into "full month vs part month". |
| G2 | Headcount bridge (opening + joiners − leavers = closing) with names | ◐ | Counts and flags exist, and names are reachable with the flag filter. There is no explicit bridge table with returners, transfers between pay groups, leave date and reason. |
| G3 | Element-level variance per code across months | ◐ | Lines now vs base exist (variance page). `payrollPivot` has lines per month by sponsor. There is no per-element 12-month series with people count, average per head and drill-down. |
| G4 | Per-person explanation | ✅ | Automatic (`vaWhy`, reasons, package record). Missing: a **human** explanation. |
| G5 | Variance by department, location, pay group, nationality, sponsor | ✅ | Missing: a **cost-centre** dimension (departments carry `costCenter`, but it is not in `VARM_DIMS_`). |
| G6 | Rolling 12-month trend per element | ✗ | The trend covers totals only (six measures). |
| G7 | YoY same month | ✅ | `compare: 'yoy'`. |
| G8 | Budget vs actual | ◐ | A separate page (Wave7) with no link to drivers or people, and no budget line on the variance screen. |
| G9 | GOSI contributions on payslips vs GOSI invoice | ✗ | Only wage-vs-package (`reconUpload`, `pay_gosi_wage`). |
| G10 | WPS / bank total vs payroll net vs journal | ✗ | The file total is computed, but nothing compares it with run net, the bank-confirmed amount or the posted journal. |
| G11 | Thresholds configurable per element / per org | ✗ | Global 10 % / 100 SAR, overridable per request only. |
| G12 | Flags: new line, gone line, negative net, zero pay, >X% | ✅ | Missing flags: paid in two pay groups in the same month, IBAN changed since last month, paid days above the window, paid after leaving date, unusual overtime hours, the same amount paid twice (duplicate adjustment ref). |
| G13 | Sign-off of explanations (comment per flagged person, carried into approval) | ✗ | Step 8 has one note for the whole step and nothing per person. Approval does not ask whether flagged people were explained. Workday and SAP PCC both do assign, explain and resolve. |
| G14 | Exports (Excel with formulas, PDF print) | ✅ | SUBTOTAL formulas, print. The old drawer exports CSV only. |
| G15 | Drill from any number to people and payslips | ◐ | Number → filtered people works (rows, insights, heatmap). Person → **payslip** does not: `variance.js` never calls `Payroll.openSlip` and slip refs are not returned. |
| G16 | Small-group masking for executives | ◐ | Executives get no variance view at all. Cost reports mask, but use 3 instead of 5 in the `rx*` reports. |
| G17 | Draft vs draft (before / after recalculation) | ✗ | Workday compares in-progress results; BASMA keeps no snapshot of a run before a recalculation. |
| G18 | One consistent "previous" definition | ✗ | Three engines (see 1.7.3). The old drawer is wrong across pay groups and closed groups (1.7.1). |

---

## 4. Build list

Conventions, from CLAUDE.md:
- Actions are named in letters only and gated by `canPayroll_` / `runAccess_` through `payBook_`.
- Reads are audited as `salary_view`.
- Arabic first.

### P1: clearly missing, most valuable

**P1-1 · Fix and unify the run drawer — توحيد تحليل فروقات المسير (Run variance on one engine)**
- **What:** The run's "Variance" button opens the same engine as Pay ▸ Variance for that month, filtered to the run's pay group. This removes the cross-group false leavers and the closed-group leak (1.7.1).
- **Action:** keep `payrollVarianceMonth` and add a `runId` input. When it is given:
  - the current month = that run only;
  - the base = the same pay group's runs (locked, else drafts) taken through `payBook_`.
- `api_payrollVariance` becomes a thin wrapper or is retired. Read only.
- **Reuse:** `payBook_` (it needs a `groupId` option on `runIds`), `varFilter_` with `payGroup`.
- **UI:** `js/payroll.js:688` calls `Variance.section` in a drawer, or navigates to `pay:variance` with the month and the sponsor chip preset.
- **Access:** payroll only (unchanged).
- **Tests:** in `tests/variance.js`, add two pay groups and a closed group, and assert:
  - no leaver from the other group;
  - a closed group's person never appears for a user without access;
  - drawer totals = page totals filtered to that group.

**P1-2 · Variance explanations and sign-off — تبرير الفروقات واعتمادها (Variance explanations)**
- **What:** For each flagged person in a month and pay group, a reviewer records:
  - a reason code (pay rise, joiner, leaver, overtime, one-off, absence, correction, error-fix-needed);
  - a note;
  - a status: explained, query, or accepted.
- A different payroll holder accepts. The run shows "n of m flagged explained". `payrollApprove` refuses when flagged people (per the org's rule) are unexplained, the same way `reconBlocks_` blocks.
- The explanation is fingerprinted with the person's current net and lines (the `prepSig_` pattern), so a later recalculation reopens it.
- **Actions:**
  - `varianceNote`: write; `{ runId, empId, reason, note, status }`; returns the row. Locked with `withLock_`, audited.
  - `varianceNotes`: read; `{ runId | month }`; returns rows plus a summary.
- **Storage:** a new tab `varianceNotes` (id, runId, month, empId, flags, sig, reason, note, status, by, at, acceptedBy, acceptedAt).
- **Reuse:** the flags from `payrollVarianceMonth`; `prepSig_`; the two-person rule from `api_reconResolve`; and the prep step 8 rows, which become this list.
- **UI:**
  - Pay ▸ Variance person drawer: an explanation box;
  - a "needs explanation" chip;
  - prep wizard step 8 lists unexplained people and cannot be confirmed while any remain;
  - the Excel and print output carry a reason / note / status column.
- **Access:** hr and payroll write; whoever accepts must not be the author.
- **Tests (new `tests/variance-notes.js`):**
  - the author cannot accept their own explanation;
  - approval is blocked while flagged people are unexplained, and passes once they are;
  - a recalculation that changes net reopens the explanation;
  - an employee and an executive are refused;
  - closed pay groups are respected.

**P1-3 · Pay-line trend — اتجاه بنود الرواتب (Element variance over 12 months)**
- **What:** Each pay line (`lineKey_`) over the last 12 months (or any range up to 24), showing per month:
  - amount, people paid, average per head;
  - change vs the previous month and vs the same month last year;
  - flags when a line appears, disappears, or moves by the threshold.
- Clicking a cell gives the people behind it (with their amounts) and their payslips.
- **Action:** `varianceLines`. Read-only. `{ to, n, filters, line? }` returns `{ months, lines:[{ code, driver, m:{ YYYY-MM:{ amt, people } }, yoy, flags }], people? }`; `people` is returned only when `line` and `month` are given.
- **Reuse:** `payBook_().perMonth`, `lineKey_`, `varDriver_`, `varFilter_`, `VAR_PCT_` / `VAR_MIN_`. Net-only months are marked as in `api_payrollMonthly`.
- **UI:** a new "Pay lines" view inside Pay ▸ Month by month (by = line), plus a link from the Lines table on Pay ▸ Variance.
- **Access:** payroll only.
- **Tests:** in `tests/variance-month.js`:
  - line totals per month equal the sum of the payslips;
  - `new_line` and `gone_line` are flagged at the right month;
  - net-only months are excluded;
  - the drill list sums to the cell;
  - an employee is refused.

**P1-4 · Payroll-to-payment reconciliation — مطابقة الرواتب مع التحويل والتأمينات والقيد (Payroll → WPS / GOSI / journal)**
- **What:** For a month and pay group, one table with the checks below. Each mismatch lists the people behind it.

| Check | Compares |
|---|---|
| 1 | Run net vs WPS file total (rows plus skipped) |
| 2 | WPS file total vs the amount the bank or Mudad confirmed (`wpsLog`) |
| 3 | Payslip GOSI (employee + employer) vs the uploaded GOSI invoice total. A new `reconUpload` source, `gosi_invoice`, with per-person contribution. |
| 4 | Run totals vs the posted payroll journal (Journal.gs) |

- **Action:** `payReconcile`. Read-only. `{ month, payGroupId? }` returns `{ checks:[{ key, ours, theirs, diff, status, people:[…] }] }`.
- The `reconUpload` extension is a write that already exists; it only gains the new source.
- **Reuse:** `api_wpsFile`'s row builder (moved into a `wpsRows_` helper), `wpsLogOf_`, `publicRecon_`, `totals_`, `payBook_`.
- **UI:** Pay ▸ Compliance, a "Reconciliation" tab, linked from the run header once the run is locked.
- **Access:** payroll only.
- **Tests (new `tests/pay-reconcile.js`):**
  - a matched month is all green;
  - one person with no IBAN is shown as a skipped difference;
  - a GOSI invoice that is off by one person's contribution names that person;
  - a closed group is excluded for a user without access;
  - a demo run is never counted.

**P1-5 · Executive variance summary — ملخص الفروقات للإدارة (Masked variance for executives)**
- **What:** The bridge by driver, the headcount bridge and the dimension table without names, for executives.
- **Masking (≥5 people):**
  - any dimension row whose current *or* base group has fewer than 5 people is folded with `foldSmallRows_`;
  - a filter that leaves fewer than 5 people is refused with `group_too_small`;
  - driver amounts for a folded or small group are blanked;
  - no people list, no lines per person.
- **Action:** `varianceSummary`. Read-only. `{ month, compare, filters }` returns the same totals, bridge, drivers, dims and trend as `payrollVarianceMonth`, minus `people`, with `folded` / `hidden` counts.
- **Reuse:**
  - factor the aggregation part of `api_payrollVarianceMonth` (1586-1635) into `varAggregate_(keep)`, shared by both;
  - `foldSmallRows_` and `MIN_REPORT_GROUP_`;
  - executives get run visibility through the same rule as `runReport_` (Reports.gs:185: every group except a closed one).
- Also bring `RX_MIN_GROUP` up to 5 (1.7.2).
- **UI:** Insights ▸ Payroll cost, a "What changed" card for executives. Pay ▸ Variance stays payroll-only.
- **Access:** executive, hr, payroll. hr and payroll can open the full screen instead.
- **Tests:** in `tests/variance-month.js`, plus the red-team case in CLAUDE.md:567:
  - a one-person department with 70123.45 never appears in any row, driver, trend or export for an executive;
  - totals minus the rows shown never isolate that department;
  - a narrow filter is refused;
  - set `RX_MIN_GROUP` = 5.

**P1-6 · Headcount bridge with names and payslip drill — جسر عدد الموظفين والانتقال إلى القسيمة (Headcount bridge + payslip links)**
- **What:** A table: opening (base) + joiners + returners + transfers in − leavers − transfers out = closing. Each person appears with hire or leaving date, leaving reason, pay group from and to, and net.
- Every person row (the bridge, the people table, the drawer) links to their payslip(s) for the month and the base month.
- **Action:** no new action. `payrollVarianceMonth` additionally returns:
  - `headBridge` (counts and empIds per bucket, with transfers detected when the pay group differs between base and current);
  - `slips: { cur:[ref], base:[ref] }` per person, added in `payBook_.perMonth`.
- **Reuse:** `payBook_` (it keeps `x.ref`), employee `leaveDate` / exit reason (offboarding), `Payroll.openSlipRef` (js/payroll.js:992).
- **UI:** Pay ▸ Variance, a "Headcount" card next to the bridge. The person drawer gets "Open payslip" buttons.
- **Access:** payroll only. Executives see counts only, through P1-5.
- **Tests:**
  - opening + in − out = closing;
  - a person who moved sponsor counts as a transfer, not as a leaver plus a joiner;
  - the slip refs returned belong to runs the viewer can open.

### P2

| Item | Action | Note |
|---|---|---|
| Per-element / per-org thresholds — حدود التغير لكل بند | `varianceRules` (read / save, script property `orgKey_('varRules')`) | %, min SAR, ignore, and always-flag per line code or driver. The engine reads them in place of `VAR_PCT_` / `VAR_MIN_`. Tests: an ignored line does not flag; per-line pct overrides the global one. |
| More audit flags — تنبيهات إضافية | inside `payrollVarianceMonth` | Flags: `paid_twice` (two groups in the same month), `iban_changed` (PRIV history), `days_over` (paidDays > window), `paid_after_exit`, `ot_hours_high`, `dup_adjustment`. The first two are the classic fraud checks. |
| Cost-centre dimension | add `costCenter` to `VARM_DIMS_` | Departments already carry it. |
| GOSI driver split — تفصيل أثر التأمينات | in `varDriver_` / the person loop | Splits rate step vs wage change vs cohort change, using slip `info.gosi` rates and base. |
| Budget line on the variance screen | `varianceSummary` / `payrollVarianceMonth` add `budget` | From `budgetActuals_` and BUDGET rows. Folded for executives. |
| Before / after recalculation diff — الفرق بعد إعادة الاحتساب | `payrollRecalc` stores a compact snapshot; `runDiff` reads it | Mirrors Workday's in-progress comparison. |

### P3

- Statistical outliers: a z-score of each person's net or line against their own 12 months, shown beside the rule flags.
- A signed variance pack (PDF): the print view with the explanations and the accepter's name, attached to the run.
- Scheduled pre-approval digest: "n flagged, m unexplained" to the payroll approvers through the existing schedules.
- Retire `pay_variance` / `pay_var_lines`, or point them at the same engine, so "previous" means one thing everywhere.

---

## 5. Order and risk

1. **P1-1 first.** It fixes wrong numbers and a privacy leak in a screen that is live today.
2. **P1-2 and P1-6 next.** They share the person drawer and step 8.
3. **P1-3 and P1-4 after that.** They are independent and read only.
4. **P1-5 last.** It needs the `varAggregate_` refactor and the full red-team test before any executive sees it.

Every P1 item keeps the engine rule that totals are rebuilt from the filtered people, so the screen never disagrees with itself.
