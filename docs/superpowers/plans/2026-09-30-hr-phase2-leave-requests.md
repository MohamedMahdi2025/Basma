# HR Phase 2 — Leave and Requests

**Goal:** every employee sees their leave balance and asks for leave, letters, salary advances,
attendance corrections, data changes and resignation from "ملفي"; each request walks a
role-based approval chain; approved leave and public holidays show in attendance instead of
"absent"; HR sees balances, a team leave calendar and manages holidays.

**Architecture:** new `backend/Leave.gs` (same helpers, lock, audit, access rules as Hr.gs).
Two new tabs (`requests`, `holidays`), four employee columns. Client additions live in the
two lazy files; the check-in screen and sign-in read nothing new (sign-in speed is kept).

## Law applied (docs/ksa-compliance-research, docs/hr-research)

| Type | Rule |
|---|---|
| annual | 21 days a year, 30 after 5 years of service (Art. 109), or the contract's days if higher; accrues daily, pauses on unpaid leave; public holidays inside it do not count; rest days excluded when `leaveCountMode = working` (default) |
| sick | Art. 117 per sick year (starts at the first sick day not inside an earlier sick year): 30 days full pay, 60 at 75%, 30 unpaid, 120 max; document number required |
| marriage | 5 days, once in service (Art. 113) |
| paternity | 3 days, taken within 7 days of the birth (2025 amendment) |
| bereavement | 5 days (spouse, parent, child); sibling 3 days (2025) |
| maternity | 12 weeks = 84 days (Art. 151, 2025) |
| hajj | 10 to 15 days, once, after 2 years' service (Art. 114) |
| exam | the exam days, with proof (Art. 115) |
| iddah | 130 days, or 15 days (the employee picks; religion is never stored, PDPL) |
| unpaid | by agreement; over 20 days is flagged "contract suspended" (Art. 116) and pauses accrual |
| advance | at most `maxAdvanceSalaries` x monthly wage; instalment over 50% of wage refused (Art. 93), over 10% flagged (Art. 92) |
| resignation | notice `noticeDays` or 30 (Art. 75); shorter is flagged, approval means the employer agreed |

## Approval chains

| Request | Steps |
|---|---|
| leave, correction, resignation | manager, then hr |
| letter, data change | hr |
| advance | hr, then payroll (no manager: salary-related) |

The manager step is skipped when there is no active manager. A step can be acted on by: manager
step, anyone who `manages_` the employee (or HR/admin on their behalf); hr step, hr or admin;
payroll step, payroll or admin. Never by the requester. One rejection ends the request.
Effects on final approval: correction adds a manual punch; data change writes the fields;
resignation sets `resignedOn` and `lastWorkingDay`.

## Actions

Employee: `myRequests`, `requestQuote`, `requestCreate`, `requestCancel`, `reqInbox`, `reqDecide`,
`holidayList`, `leaveTeam`. HR: `holidaySave`, `holidayDelete`, `leaveBalances`, `leaveOpeningSave`.

## Review focus

1. Balance: opening balance + accrual (21 then 30 per year, contract days if higher, paused on unpaid) minus approved; pending reserves days; no negative unless allowed.
2. Overlaps: two leaves on the same day refused.
3. Sick tiers across several requests in one sick year.
4. Nobody approves their own request at any step, including HR requesting their own leave.
5. Attendance: a day on approved leave or a public holiday is never "absent"; work on a holiday is overtime.
6. Sign-in speed: no new sheet reads in authBegin / authFinish / home.
