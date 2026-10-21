# Scheduled reports by e-mail: research and design

Date: 2026-10-21. Status: built and tested (tests/reports.js "Scheduled reports by e-mail", 22 checks).

## 1. Why

Managers and HR open the same reports every week, for example the weekly attendance summary, last month's leave
and the daily list of people who did not check out. A subscription brings the report to them at the time they
choose, without signing in, so the numbers are seen even on the days nobody opens the app.

## 2. What the leading systems do (public documentation only)

| System | Whose access decides the data | Delivery |
|---|---|---|
| Workday (custom reports) | By default the schedule runs as the person who scheduled it and goes to them. "Sharing output" lets others see the data **exactly as the scheduler saw it, regardless of their own security**. That needs a special domain (Report Output Sharing). [Workday docs](https://doc.workday.com/workday-education/en-us/course-manuals/workday-reporting/report-administration.html) | In-app output and notifications |
| Workday Adaptive Planning | "Report bursting": one schedule, many recipients, **each gets their own slice using the recipient's data access** (up to 250 people). [Workday docs](https://doc.workday.com/adaptive-planning/en-us/what-s-new/releases/2025r1-release-notes/report-bursting-through-scheduled-attachments.html), [attachment schedules](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/web-reports/viewing-and-building-reports/report-scheduling/create-email-attachment-schedules.html) | E-mail attachment |
| BambooHR | Recurring e-mails go to the people the report is shared with. Fields the recipient cannot see stay locked, and they must sign in to view. [BambooHR help](https://bamboohr.screenstepslive.com/m/53902/l/587704-report-actions) | E-mail with a link |
| University policy on Workday (UPenn) | Delivered only to the person who scheduled it; their role decides the data. [workday.upenn.edu](https://workday.upenn.edu/node/42) | Notification |
| Generic report-subscription tools (Appfire, Pega, Commvault) | The saved report with its filters runs on a frequency; recipients can unsubscribe | E-mail with the results |

HiBob and Rippling publish nothing searchable about this. No claim is made for them.

### The decision this research drives

There are two models:

- **Bursting:** each recipient's own access decides their data.
- **Sharing:** the scheduler's view is copied to everyone.

Sharing is the source of real leaks, because a manager's or HR's view lands in the inbox of someone who would be
refused in the app. **We take the bursting model only:**

- every send runs the report on the server **as the recipient, at send time**;
- the recipient's role and row-level scope (`reportScope_`) decide the rows;
- a person who lost access stops getting it on the very next send;
- the failed send is recorded with its reason.

## 3. Design

### Data

The tab `reportSubs` (prefix RSB) holds, for each subscription:

- owner;
- report;
- saved filters (departments, people, nationality…);
- visible columns and column names as shown on screen;
- period (yesterday / last 7 / last 30 / this month to date / last month);
- repeat (daily, weekly on a day, monthly on day 1-28) and hour (05-22 Riyadh);
- recipients;
- status, next run, last run, last result, last numbers, consecutive failures.

### Rules

- Anyone who can run a report can schedule it for **themselves**. Only HR can add other recipients, and each one
  must have their own access to the report and an e-mail address on file. The save is refused otherwise
  (`recipient_no_access`, `no_email`). At most 10 recipients and 20 schedules per person.
- **Pay never leaves by e-mail:**
  - reports with `money` access (pay register, variance, GOSI) cannot be scheduled (`not_emailable`);
  - every `money`-type column is dropped from every e-mailed copy, even when the recipient could see it in the app.
- Every send is numbered in the export log, with format `email`, the same `RPT-YYYY-00000` series and the same
  SHA-256 fingerprint. The fingerprint is printed in the e-mail, so `reportVerify` proves the e-mailed numbers
  later, exactly like a printed report.
- The e-mail has:
  - company name, report name, period, row count and number;
  - a warning line if the report's data checks found problems;
  - the first 25 rows and 8 columns;
  - the full report as a UTF-8 CSV (with BOM for Excel; cells starting with = + - @ are neutralised against
    formula injection);
  - a link to manage or stop the schedule (`#insights/schedules`).
- Owner left the company → paused (`owner_inactive`). Five failed runs in a row → paused.

### Sending without a trigger

The project has no trigger scope, so sending works like the daily digest. After any writing request:

1. A cache key holding the earliest due time is checked, which costs one cache read on most requests.
2. When something is due, one subscription is sent per request, with a 20-second guard.

Sending uses the same Microsoft 365 Graph sender as payslips; `graphSend_` gained optional attachments. Until the
M365 script properties are set, schedules are saved and the screens say e-mail is not connected yet. "Send me one
now" answers `email_not_configured`.

### Screens

- On every report (except pay): **Schedule by e-mail**, a form for period, repeat, day, hour and recipients (HR only).
- **Insights → Scheduled reports** (also a tab in Reports), listing each schedule with:
  - code, report and plan;
  - recipients;
  - next and last send, with the result in words (for example "not sent: one of the recipients has no access");
  - Send me one now, Edit, Pause/Resume and Delete.

  HR can switch to "All company schedules".

## 4. Threats and answers

| Threat | Answer |
|---|---|
| A manager's team data reaching someone outside the team | Runs as each recipient; their scope only |
| Access removed but the e-mails continue | Re-checked at every send; the send is refused and the reason recorded |
| Salaries in inboxes (PDPL, internal policy) | Pay reports blocked; money columns stripped for all |
| Doubt later about what was e-mailed | Export log number + fingerprint in the e-mail; `reportVerify` |
| CSV formula injection when opened in Excel | Leading = + - @ prefixed with ' |
| Spam / runaway schedules | 10 recipients, 20 schedules per person, one send per request, "send now" 5 per hour, auto-pause after 5 failures |
| The employee who scheduled it leaves | Paused automatically |

## 5. Tests (tests/reports.js)

They cover:

- weekly next-Sunday timing;
- pay report refused;
- no access refused;
- a manager limited to themselves;
- HR recipients without access or without e-mail refused;
- the not-connected path;
- send now: the manager's team only, numbered and verifiable;
- money columns dropped;
- the Sunday send covering 1-7 November;
- moving to the next week;
- nothing sent twice;
- access loss refused with the reason;
- only owner or HR edits;
- a paused schedule sends nothing.

## 6. Owner step

The same as the daily digest: set the four M365 script properties (docs/OWNER-STEPS.md). Nothing else.
