# HR Phase 3 — Payroll, payslips, WPS, end of service

**Goal:** one monthly payroll run computed from the approved salary package, attendance and leave;
reviewed and approved by two different people; payslips published to each employee's "ملفي";
a WPS / bank Excel and an accounting summary; an end-of-service calculator; payslip email via
Microsoft 365 ready to switch on.

**Architecture:** new `backend/Payroll.gs`; tabs `payrollRuns`, `payslips`, `adjustments`.
Client: `js/payroll.js` (HR section and the printable payslip, shared with "ملفي").

## Calculation (per employee, per month; every line itemised with its reason)

| Line | Rule |
|---|---|
| Earnings | Package in force on the last day of the month (basic, housing, transport, other allowances), daily rate = monthly / 30; a partial month (joined or left) pays the employed days, a full month is 30/30 whatever its length |
| Unpaid leave | not paid: daily wage x days (Art. 116) |
| Sick leave | Art. 117 tiers from the request: 75% days deduct 25% of the daily wage, unpaid days 100% |
| Absence | unexcused absent working days from attendance (never leave or holiday days, never before go-live): daily wage x days (setting `deductAbsence`, off until everyone checks in with the app) |
| Late minutes | pay for minutes late after grace (setting `deductLateMinutes`, off: needs the approved work regulation) |
| Overtime | Art. 107: hours x (total hourly + 50% of basic hourly); hourly = monthly / 30 / daily hours (8). Hours come from HR adjustments (`overtime_hours`), or from attendance when `payOvertimeFromAttendance` is on |
| GOSI | Saudi: employee share on basic + housing (min 1,500, cap 45,000): legacy 9.75%; new law 9.75% (Jul 2024), 10.25% (Jul 2025), 10.75% (Jul 2026), 11.25% (Jul 2027), 11.75% (Jul 2028). Employer share shown (11.75% to 13.75%; non-Saudi 2% hazards) |
| Advances | approved advance requests: instalment from the start month until repaid (repaid = sum deducted in locked payslips) |
| Adjustments | HR / payroll add bonus, commission, other earnings; fines (all fines in a month at most 5 days' wage, Art. 70) and other deductions |
| Cap | deductions (GOSI, advances, fines, other) at most 50% of the month's wage (Art. 92-93): advances are deferred first, then other deductions, then fines; flagged |

## Workflow

draft (prepared by hr or payroll) -> approved and locked (by a payroll person who did not prepare or
last recalculate it). Locked runs are final; corrections go in the next month's adjustments.
On lock, payslips appear in each employee's "ملفي". Email: `payrollEmail` sends through Microsoft
Graph when the tenant consent and script properties exist; otherwise it says `email_not_configured`.
It never falls back to Gmail.

## End of service (Art. 84, 85, 87)

Half a month's wage per year for the first 5 years, a month per year after, pro rata; resignation:
under 2 years none, 2-5 a third, 5-10 two thirds, 10+ full; termination, contract end and Art. 87
cases full. Wage basis = total monthly wage (setting `eosWageBasis`: total | basic_housing).
Unused annual leave is paid at exit: balance x daily wage.

## Numbers
PR-YYYY-00001 runs, PS-YYYY-00001 payslips, ADJ-YYYY-00001 adjustments.
