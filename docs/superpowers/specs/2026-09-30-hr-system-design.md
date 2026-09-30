# Best Gas HR system — design

Date: 2026-09-30 · Status: **draft for review** · Research basis: `docs/hr-research-2026-09-30.md` (outside the repo, in `C:\Claude\bestgas-attendance\docs`)

## 1. What the user asked for (their words, condensed)

- Run **payroll from attendance** once all data is in, and **send every employee their payslip by email in one click**.
- **Manage people 100%** from here: departments, managers, positions, the whole employee file.
- An **employee screen** where each person sees only their own: check-in/out, **vacation balance, profile, requests, salary package, employee ID, direct manager, department manager, JD, KPIs, last performance evaluation, 360 evaluation, attendance sheet**.
- **HR sees all data and reports according to roles and responsibilities.**
- Research the best HR systems first; fix bugs before deploying; **protect the code**.
- **Keep attendance easy and separate** — not complicated.

## 2. Decisions already made

| Decision | Choice |
|---|---|
| Structure | **A**: employee app keeps its check-in tab untouched and gains a **"ملفي"** tab; HR, payroll and managers work in a separate **HR console** (desktop-first) over the same backend and the same sign-in |
| Database | Same Apps Script + Google Sheet backend as attendance — one employee record for both |
| Payslip email | From **m.mahdi@bestgas.sa via Microsoft 365 (Graph)**. Waits for the tenant admin's `Mail.Send` consent; never silently falls back to Gmail |
| Attendance → pay | **HRSD model penalty schedule**; HR reviews before a payroll run locks |
| Starting data | **One-time Excel import** from HR's file, validated row by row before anything is saved |

## 3. Delivery in five phases

Each phase is designed, tested, reviewed and deployed on its own. Later phases depend on earlier ones.

| Phase | Delivers | Depends on |
|---|---|---|
| **1. People core** | Departments, positions + JDs, reporting lines, full employee file, effective-dated salary package, Excel import, **"ملفي"** (profile, ID, managers, JD, salary package, attendance sheet), HR console shell | attendance (done) |
| **2. Leave & requests** | Leave types per Saudi law, balances and accrual, one request engine (leave, letters, loans/advances, attendance corrections, data changes, resignation) with role-based approval chains | 1 |
| **3. Payroll** | Monthly run from attendance + leave, GOSI by cohort/date, HRSD deductions with legal caps, overtime (Art. 107), draft → HR → finance → locked, payslips (Arabic PDF), one-click email via Microsoft 365, WPS/Mudad file, end-of-service calculator | 1, 2 |
| **4. Performance** | KPIs (3–7, weighted), mid-year check-in, year-end review with calibration, 360 for managers with anonymity rules, results in "ملفي" | 1 |
| **5. Reports & protection** | HR analytics by role, audit views, code protection (below), PDPL housekeeping | all |

This document specifies **Phase 1 in full** and fixes the shape of 2–5 so Phase 1 does not paint them into a corner. Phases 2–5 each get their own short spec before they are built.

## 4. Roles and what each sees

Roles stack; a person can be an employee and a manager and HR.

| Role | How someone gets it | Sees / does |
|---|---|---|
| **Employee** | everyone | Own file only: profile, ID, managers, JD, salary package, attendance, (later) balances, requests, payslips, KPIs, evaluations |
| **Line manager** | anyone named as `managerId` of an active employee | Direct reports' job data, attendance, (later) leave, requests to approve, performance. **No salaries.** |
| **Department head** | `headEmpId` of a department | Same as manager, department-wide, including sub-departments. No salaries unless also payroll. |
| **HR** | role `hr` | All employee files, org, positions, import. Salary package **visible**, changes need a second approver (admin or payroll) |
| **Payroll** | role `payroll` (new) | Compensation, payroll runs, payslips, WPS. Non-sensitive HR fields read-only |
| **Admin** | role `admin` | Configuration, roles, zones, devices. **No routine salary access**: salary screens show only if the admin also holds `payroll` (separation of duties, research §5; matches the finance manual's "Finance ≠ HR payroll processing" control) |

Every read of salary data is filtered on the server and written to the audit log (who, whose, when).

## 5. Data model (Phase 1)

New tabs in the same spreadsheet. The spreadsheet is never shared with anyone; all access goes through the web app's role checks.

**departments** — `id, code, nameAr, nameEn, parentId, headEmpId, costCenter, status, createdAt, updatedAt`

**positions** — `id, code, titleAr, titleEn, departmentId, grade, purposeAr, purposeEn, dutiesAr, dutiesEn, requirementsAr, requirementsEn, status, createdAt, updatedAt` (the JD lives on the position; every holder of the position sees the same JD)

**employees** (existing tab, new columns added at the end) — `departmentId, positionId, managerId, hireDate, contractType, contractEnd, probationEnd, nationality, isSaudi, gender, workLocation`

**empPrivate** (HR/payroll only) — `empId, nationalId, idExpiry, birthDate, maritalStatus, iban, bankName, gosiNumber, gosiCohort (legacy|new), address, emergencyName, emergencyPhone, updatedAt`

**compensation** (effective-dated; never edited in place) — `id, empId, effectiveFrom, basic, housing, transport, otherJson, currency, reason, enteredBy, approvedBy, approvedAt, status (pending|approved|rejected)`. The current package = latest approved row with `effectiveFrom ≤ today`.

**jobHistory** (effective-dated) — `id, empId, effectiveFrom, departmentId, positionId, managerId, grade, reason, enteredBy`. Written automatically whenever department, position or manager changes.

Not stored: religion and health data. Iddah leave (Phase 2) is requested with a document, not derived from a stored religion field (PDPL: minimum data).

## 6. "ملفي" — the employee's own file (Phase 1 part)

A second tab in the employee app. The check-in tab does not change.

- **Header card**: photo-less avatar with initials, name (Ar/En), **employee ID**, position, department, years of service.
- **My managers**: direct manager and department head, each with name and position.
- **My job description**: purpose, duties, requirements from the position.
- **My salary package**: basic, housing, transport, other allowances, total, effective date. Hidden behind a tap ("show amounts") so it isn't on screen by accident.
- **My attendance sheet**: the existing monthly record, moved here and extended with a printable/exportable month view.
- Phase 2–4 sections (balances, requests, payslips, KPIs, evaluations, 360) appear only when those phases ship — no empty "coming soon" cards.

## 7. HR console (Phase 1 part)

Opened at `…/BG-attendance/#hr` (same sign-in, desktop layout). Sections:

1. **People** — searchable directory; the employee file with tabs: Job, Personal (HR only), Compensation (history + "propose change" → second approver), Devices, Attendance.
2. **Organisation** — department tree, heads, org chart generated from `managerId`.
3. **Positions & JDs** — list and editor (Ar/En).
4. **Import** — download the template (.xlsx), upload HR's file, see a validation report per row (duplicate employee numbers or IDs, invalid Saudi IBAN — mod-97 check, unknown department/position/manager, dates in the wrong order, missing required fields), fix and re-upload; only a clean file can be committed. Commit is one server call, all-or-nothing, audited.
5. **Approvals** — pending compensation changes awaiting the second approver.

The existing attendance admin (live board, zones, review, settings, audit) stays where it is and is also reachable from the console.

## 8. Backend

- New file `Hr.gs` with the actions above (`hrDeptList/Save`, `hrPositionList/Save`, `hrEmpFile`, `hrEmpSave`, `hrPrivateSave`, `hrCompPropose/Decide`, `hrImportValidate/Commit`, `myFile`).
- Role checks extend `handle_`: a new `MANAGER` level computed from the org (not stored), plus `payroll`.
- All writes under the script lock; effective-dated tables append only.
- Excel parsing happens in the browser (SheetJS from cdnjs); the server re-validates every row, so a tampered upload cannot bypass the checks.
- No new Google scopes in Phase 1 (still `spreadsheets.currentonly`), so no re-authorisation. Phase 3 adds `script.external_request` for Microsoft Graph, which will need one owner approval at deploy time.

## 9. Code protection (Phase 5, decided now)

- **Backend source leaves the public repository.** `backend/*.gs` moves to the private clasp folder; the repo keeps only the client. This is the protection that matters: the server code enforces every rule.
- **Client obfuscation** at publish time (as in the rental app: encoded payload, 38-character lines so GitHub secret scanning is not tripped). It slows copying; it is not security, and the design never relies on it.
- Real data never enters the repo (import files, names, IBANs stay local or in the Sheet).

## 10. Legal notes carried from research

- GOSI new-entrant rates come from a secondary source; confirm on gosi.gov.sa before Phase 3 hard-codes the rate table.
- Mudad file layout: get the current official template before building the WPS export.
- **PDPL cross-border transfer**: Google stores the Sheet outside KSA. Best Gas's legal owner should document the transfer basis and a risk assessment. The system minimises what it stores (no religion, no health records, geolocation only at check-in).

## 11. Phase 1 — done when

- HR imports the real employee file with zero validation errors and every employee appears in the directory with department, position and manager.
- Every employee opens "ملفي" and sees exactly their own ID, managers, JD, salary package and attendance — and nothing of anyone else's (tested with employee, manager, HR, payroll and admin accounts).
- A manager sees their team's job data and attendance, never salaries.
- A salary change needs two people and appears in the audit log.
- All attendance checks (68 today) still pass, and new HR checks cover every role rule above.
