# Monthly history snapshots: research and design

Date: 2026-10-21. Status: built and tested.
- Tests: tests/reports.js "History snapshots", 17 checks.
- Access: the sim50 matrix.
- Screen: Insights → Monthly history.

## 1. The gap

The dashboard and reports compare periods, but they compute everything from **today's** records. Three kinds of
change rewrite the past:

- an employee who moved from Sales to Finance in November now appears in Finance for October too;
- a renamed department renames its whole history;
- a pay rise changes last year's "cost by department".

Nothing was frozen, so a trend could not be drilled into to see who was where at the time.

## 2. What the leading systems do (public evidence)

| Source | Lesson |
|---|---|
| SAP SuccessFactors Workforce Analytics: End of Period headcount is a **point-in-time** measure. Drilling over a quarter returns one row per person per month. [SAP KB 2210214](https://userapps.support.sap.com/sap/support/knowledge/en/2210214) | Count heads on the period's last day, and keep one record per person per month for drill-down |
| SAP community: Story reports have no calendar date for job information, so month start and end dates must be built before any period headcount. [SAP blog](https://blogs.sap.com/t5/human-capital-management-blogs-by-members/creating-month-start-and-end-dates-for-headcount-follow-up-in-story-reports/ba-p/13575435), [hires and leavers trends](https://answers.sap.com/t5/human-capital-management-blogs-by-members/a-deep-dive-into-tacking-new-hires-and-leavers-trends-how-to-build-monthly/ba-p/13580127) | Monthly trends need an explicit month-end frame; joiners and leavers come from dated events |
| Workday: every field carries an **effective date** and an **entry date**, and a headcount "as of" a date differs with the one used. [Miami University guide](https://miamioh.teamdynamix.com/TDClient/1813/Portal/KB/ArticleDet?ID=168151), [headcount summary](https://workday-hr.it.miami.edu/resources/reports/index.html) | Be explicit about which "as of" a number means; mark numbers rebuilt after the fact |
| Workday: only data loaded into Workday can be reported; history from before go-live needs a separate store. [UT Austin wiki](https://cloud.wikis.utexas.edu/wiki/display/coe/Workday) | A system without old history must say so instead of inventing it |
| Sage People snapshot reports: month-end snapshots keep a time-stamped record, because live data cannot reliably reproduce past month-end counts. [summary](https://www.cleverence.com/articles/sage-documentation/snapshot-reports-sage-people-help-center-home-4729/) | Store, do not recompute |

## 3. Design

### What is frozen

At the end of each month, the system stores one record for every person employed on the last day. Each record
holds:

- number and name;
- department and position (with the names as they were then);
- manager;
- Saudi status, nationality and gender;
- hire date, tenure and tenure band;
- contract type and grade;
- monthly package;
- that month's present, absent, late and leave days;
- whether they were leaving.

The month totals are:

- headcount at the start and the end;
- Saudization (Nitaqat-weighted) and the share of women;
- hires, leavers and voluntary leavers;
- turnover, measured as leavers over the average headcount;
- average tenure;
- attendance and absence rates;
- payroll cost: from the locked payroll run when there is one, otherwise an estimate from packages, and labelled
  which it is.

### Storage and integrity

The tab is `snapshots`. A month's record is one JSON body split into 40 KB parts, because Google Sheets cells hold
at most 50,000 characters. Part 0 carries a SHA-256 of the whole body. On every read the parts are joined and checked
against it. A hand edit in the sheet shows as "damaged" and the month is refused, never shown silently wrong. A
retaken month marks the older rows `replaced`; nothing is deleted.

### When it is taken

- **Automatically:** the first writing request in a new month takes the previous month. This is the same lazy
  pattern as the digest, because there is no trigger scope. One cache read per request decides whether anything is
  due.
- **Kinds of snapshot:**
  - `final`: taken within 3 days of the month end;
  - `rebuilt`: taken later. Attendance, hires and leavers come from the real dated history. Department, position
    and pay are as recorded on the day of rebuilding, and the screen says so;
  - `provisional`: HR took the current month before it ended. The month-end snapshot replaces it.
- HR can rebuild any missed month up to two years back, once.

### Who sees what

The rules are the same as the dashboard's:

- Company history (`snapshotList`, `snapshotView`): HR, admin, payroll and executive.
- Money (package averages, payroll cost): hr role, payroll and executive; never an admin alone.
- Names (`snapshotPeople`): the hr role only (an admin only with pay access). Every look at the people is logged.
- Groups under 5 people show a count only to anyone but HR.
- Line managers have no company history.

### Screen

Insights → Monthly history. It shows:

- the month, a comparison month, and a breakdown by department, position, grade, Saudi status, gender, tenure band
  or contract;
- trend lines across all months: headcount, Saudization, attendance, turnover and cost;
- tiles with change against the comparison month;
- movement between the two months: joined, left, moved department, pay changed. HR can open the names, including the
  department each mover came from;
- the breakdown table with each group's change; HR opens the people in any group as they were that month.

## 4. Limits, said plainly

- Months before the first snapshot are "rebuilt", so their departments and pay are today's.
- Attendance figures follow the attendance rules in force when the snapshot is taken; a later rule change does not
  touch stored months.
- Owners of the Google Sheet can still edit the tab. The fingerprint detects it but cannot stop it.

## 5. Tests

They cover:

- October frozen on the first November request;
- present days equal the attendance report;
- a later transfer and department rename leave October unchanged;
- only HR takes;
- provisional current month;
- movement counted, and the names with their old department for HR;
- no names for the executive;
- small groups as counts only;
- cost hidden from an admin alone;
- no access for managers;
- rebuild once;
- no future months;
- splitting into parts;
- tampering detected;
- the provisional month replaced at month end.
