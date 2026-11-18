# Pay-item order on payslips, registers and exports: rapid evidence assessment (2026-11-18)

Question: in what order should BASMA list pay items (earnings and deductions) on the payslip, the payroll register, the combined
sheet, the variance tables and the Excel files, so that a Saudi employee, a payroll officer and an auditor read them the same way?

Method: one pass over official Saudi sources, the large global payroll suites (Workday, SAP), Saudi HR products, generic payslip
guidance, and the company's own approved salary sheets (Jan–Oct 2026, `Salaries/`). Evidence grades: **[O]** official,
**[V]** vendor documentation, **[S]** secondary or blog, **[C]** company's own practice. What was looked for and not found is
listed under limits.

## What the evidence says

| # | Finding | Grade | Source |
|---|---|---|---|
| 1 | The WPS wage file (Mudad) has separate fields for basic salary and housing allowance; everything else paid is "other earnings", everything withheld is "deductions". | [O] (2017 spec, file not machine-readable here) + [S] restating it | MHRSD WPS wage file specification; Qeemah, Kiework guides |
| 2 | GOSI is calculated on basic + housing (capped at SAR 45,000). These two are the contributory wage. Transport and other allowances are outside it. | [S] (consistent across 6+ sources) | ZenHR, Wafeq, Qoyod, Skuad, RemotePass |
| 3 | Saudi payslip templates list earnings basic → housing → transport → other, then GOSI and other deductions, then net transferred via WPS. | [S] | Qoyod salary receipt template, Aqid ERP payslip template |
| 4 | Global suites do not impose one order. Workday prints in the order set in "Maintain Earnings and Deductions Reporting Order", alphabetical for anything unset. SAP prints by group and subgroup numbers per window. The order is the customer's decision. | [V] | Workday admin guide; SAP remuneration statement and wage type statement help |
| 5 | General payslip guidance: earnings first, statutory deductions before voluntary ones, net last. Base pay is kept apart from overtime, bonuses and allowances. Each deduction gets its own label, not a catch-all. | [S] | TCW Global, Fourmio, Cleverslip and similar payslip guides |
| 6 | Best Gas's approved sheets list: Basic, Housing, Transportation, Other allowances, Incentive/Bonus, Gross, GOSI, Traffic violations, Penalties, Loan deduction, Unpaid leave, New joiner, Other deductions, Total deductions, Net. | [C] | `tools/salary-sheets2.py` header map, Jan–Oct 2026 workbooks |

## Decision

The rule follows the official buckets first, then the company's own reading order inside each bucket (finding 6 is what staff and
the finance team reconcile against). It uses general principles only where neither of those speaks.

**Earnings**
1. **GOSI wage:** basic, then housing. These are the two WPS wage fields and the contributory wage (1, 2).
2. **Fixed allowances:** transport, then named allowances and other allowances. They are the WPS "other earnings" that recur every month (1, 3, 6).
3. **Arrears:** corrections of earlier months' fixed pay. They sit after fixed pay so the month's own package reads first (5).
4. **Variable pay:** overtime first (its rate is set by law), then commission, incentive and bonus (5, 6).
5. **Non-wage payments:** per diem, reimbursement, other earnings. These are not wages, so they come last (5).

**Deductions**
1. **GOSI**, the statutory deduction (2, 5).
2. **Fines:** traffic violations before other penalties (6).
3. **Loan and advance instalments** (6).
4. **Leave and absence:** unpaid leave, sick leave at 75% and unpaid sick leave, absence, minutes late (6).
5. **New joiner's unworked days** (the imported `other_deduction` "انضمام جديد") (6).
6. **Other deductions**, last, as the catch-all (5, 6).

Rule in code: `PAY_ORDER` and `payRank()` in `js/payroll.js` and `js/variance.js`. They are identical, and `tests/payorder.js`
checks that. Lines with the same code and their own name (traffic fines vs penalties, each named allowance, the new joiner's days)
get their own column (`regKey()` on screen, `lineKey_()` on the server). A one-off adjustment's free-text reason never creates a
column of its own.

Where it applies: the payslip on screen and on paper (the paper copy was unsorted before this change), the payroll register, the
combined sheet, the variance tables and the person drawer, and the Excel files built from them. The WPS export keeps the ministry's
own column layout (finding 1).

## Limits

- The official WPS specification PDF could not be read as text from here. Finding 1 rests on its title, its structure as quoted by
  secondary sources, and BASMA's existing WPS export.
- No source publishes a payslip order for Jisr, ZenHR or Bayzat. Their public pages show calculators, not payslips.
- Workday and SAP leave the order to the customer, so there is no "global standard order" to copy. The claim is only that this
  order follows the Saudi official buckets and the company's own approved sheets, with general payslip practice where both are
  silent.
- Sources disagree on whether housing counts toward end-of-service pay. That does not affect the order.

## Sources

- MHRSD, WPS Wages File Technical Specification (2017): https://www.hrsd.gov.sa/sites/default/files/2017-06/WPS%20Wages%20File%20Technical%20Specification.pdf
- Qeemah, Saudi GOSI, WPS/Mudad and EOSB guide: https://qeemahcloud.com/en/blog/saudi-gosi-wps-payroll-compliance-guide/
- Kiework, Mudad WPS Saudi Arabia 2026: https://kiework.ai/compliance/wps-mudad
- Qoyod, salary receipt template: https://www.qoyod.com/en/templates/salary-receipt/
- Aqid ERP, KSA payslip template: https://aqiderp.com/sa/en/templates/payslip
- ZenHR, GOSI deductions guide 2026: https://blog.zenhr.com/en/how-to-calculate-gosi-deductions-in-saudi-arabia-complete-guide-2026
- Wafeq, ZATCA and Labor Law payroll: https://www.wafeq.com/en-sa/business-hub/for-business/zatca-and-labor-law-compliant-payroll-software-for-businesses-in-saudi-arabia
- Workday, payslip content and order: https://doc.workday.com/admin-guide/en-us/payroll/payslips/emi1453154047118.html
- SAP, wage type statement: https://help.sap.com/saphelp_46C/helpdata/EN/c0/627c66bf4211d1952300a0c9306433/content.htm
- TCW Global, payslip line by line: https://www.tcwglobal.com/articles/what-is-a-payslip-understanding-your-pay-stub-line-by-line
- Fourmio, understanding your payslip: https://fourmio.com/en/blog/understanding-payslip-line-by-line/
