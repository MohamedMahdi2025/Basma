# Pay groups: research and design

Date: 2026-10-22. Status: built and tested (tests/paygroups.js, 24 checks; sim50 matrix). Screens: Pay → Pay groups,
and the group picker on Pay → Payroll runs.

## 1. What the leading systems do (public product documentation, ideas only)

| System | Concept | What it carries |
|---|---|---|
| Workday | **Pay Group** | Pay frequency and period schedule, run category, country; every worker belongs to exactly one pay group; payroll is run per pay group and period |
| SAP SuccessFactors / SAP HCM | **Payroll area** | Period schedule and pay date per area; one employee, one area; the payroll control record locks an area's period |
| Oracle HCM | **Payroll definition** | Period type, cut-off date, pay date per definition; assignments attach to one payroll |
| ADP / UKG | Pay group / pay rule | Pay date, period end, cost allocation |
| KSA vendors (Jisr, ZenHR, Bayzat) | Payroll group / "salary cycle" | Separate runs per establishment or category; WPS file per establishment |

The common core:

- one person belongs to exactly one group;
- a group has its own run per period, its own pay date and its own attendance cut-off;
- the group's period is locked independently;
- a person never appears on two payslips of the same period.

Confidential groups (executive pay) are restricted to named payroll users through security groups.

## 2. Design

### The group

- Tab `payGroups` (code PGR). Each group holds:
  - Arabic and English name;
  - pay day (1-28, or 0 for month end);
  - attendance cut-off day (0 for the calendar month, or 1-27);
  - cost centre;
  - WPS establishment number;
  - optional managers;
  - status.
- People with no group, or in a stopped group, are in the **general group** (id ''), so nothing changes until HR
  creates groups.
- An employee's group is the column `payGroupId`. Moving someone needs access to both the old and the new group.

### Closed groups

A closed group has a managers list. Only those payroll people see its runs (list, open, recalc, approve, delete, export,
e-mail, WPS file and steps, journal, run-based reports), add adjustments for its people, or move people in or out.

Four eyes are preserved: a closed group needs at least two managers, one holding the payroll role, and the person
saving is one of them. HR sees how many people a closed group has, never who.

Executives keep cost totals (cost reports) except for closed groups.

### Runs

`payrollCreate { month, payGroupId }`:

- one run per group per month;
- `payrollEmps_` takes only the group's people and **skips anyone already on a non-cancelled payslip of the month in
  another run**, so a move never pays someone twice;
- a month is closed for a person when their group's run is locked, or when a locked run they are on exists.

### Attendance cut-off

With cut-off *c*, absence, late minutes and attendance overtime for month *M* are counted from *c+1* of the month
before to *c* of *M*. Salary itself still follows the calendar month (KSA monthly wage).

- A leaver's attendance runs to their last working day.
- Each payslip stores `attFrom`/`attTo`. The next run starts after the person's last counted day, so introducing a
  cut-off, or moving between groups, never counts a day twice.

### Company-wide views

These now add up every group's run of a month:

- dashboard cost trend;
- monthly cost reports (`rxRunsByMonth_`);
- history snapshots;
- the payroll list's trend.

Run-to-run comparisons (variance) compare the same group. WPS tracking, the compliance calendar and the WPS report
list each group's run separately, because each has its own WPS file.

## 3. Tests (tests/paygroups.js)

They cover:

- closed group needs two managers;
- HR cannot edit or fill a closed group, and sees members as anonymous;
- a group with people cannot stop;
- one run per group;
- HR cannot run, open, list or adjust the closed group;
- general run excludes grouped people;
- cut-off window 26 Sep – 25 Oct vs the calendar month;
- absences counted in the window;
- each run approved by a second person;
- November window continues from 26 Oct;
- a person moved in starts after their last counted day;
- a moved person's locked month stays closed;
- the dashboard adds up all three groups.
