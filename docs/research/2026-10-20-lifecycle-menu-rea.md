# Lifecycle menu: REA before and after (2026-10-20)

**Request from the owner:** every HR function should be a main module with its sub-modules in the order of the
employment cycle, from request and hire to the end-of-service settlement and deactivation, and the sidebar should show
it that way.

**Sources for the structure:** the public product structure of the leading HRIS, read from their documentation:
- SAP SuccessFactors: Recruiting, Onboarding, Employee Central, Time, Payroll, Performance and Goals, Learning,
  Succession, Offboarding.
- Workday: Hire, Onboard, Core HCM, Time, Pay, Talent, Learning, Offboard.
- Jisr: Employees, Attendance, Leaves, Payroll, Performance, Offboarding.

Their signed-in screens are not public, so REA measured our own app before and after; no vendor screen or asset was
copied.

**Method.** The local preview ran in headless Chrome at 1440 x 900, signed in as HR.
- REA `capture_web_screenshot` artifacts:
  - before: sha256 `e1f90ace…888a`;
  - after: sha256 `31e58f4e…37fb7`.
- A script read the menu the HR user actually sees. It counted modules and pages per module, and walked a 20-step
  hire-to-exit journey, counting every jump back to a module already left.

| Measure | Before | After |
|---|---|---|
| Main modules (HR view) | 7 | 12, under two headings: "Employee lifecycle" and "Analysis and administration" |
| Most pages in one module | 21 (People) | 9 (Leave and requests) |
| Journey jumps back to an earlier module | 3 | 1 |
| Where hiring starts | inside "Insights" | "Plan and hire", first in the list |

The one remaining jump is the user-accounts page, which both activates a new hire and deactivates a leaver. It sits
under "Onboard".

**New order (sub-pages in working order):**
1. Home.
2. Plan and hire: workforce plan, structure, positions, recruitment, careers page.
3. Onboard: accounts and activation, welcome message, 30-60-90 plans.
4. Employees: directory, team, org chart, expiries, government services, insurance, assets, custom fields, import.
5. Time and attendance: check-in, history, today's board, punch review, shifts, open shifts, timesheets, zones.
6. Leave and requests: my requests, inbox, approvals centre, leave, holidays, leave cycle, expenses, help desk,
   knowledge base.
7. Pay: payslips, runs, approvals, compliance and WPS, journal, loans, pay review, perks.
8. Performance and growth: my growth, 1:1s and goals, review cycle, development plans, training, talent and succession,
   internal mobility, recognition.
9. Engagement and relations: announcements, surveys, employee relations, policies.
10. Offboard: clearance, final settlement, exit interviews.
11. Reports and insights: dashboard, reports, report builder, attendance report, audit log.
12. Administration: settings, roles, approval flows, data export.

**Old links:** `MOVED` in index.html maps the 21 old `area:sub` addresses (and `#settings`) to the new ones. `goArea`
follows the map, so bookmarks and search results still land. The bell's `SEC_DEST` and `MINE_DEST` were rewritten to
the new addresses. Checked in the browser: `#people/recruitment` opens `#hire/recruitment`, `#pay/settlements` opens
`#offboard/settlements`, and `#growth/pulse` opens `#engage/pulse`.
