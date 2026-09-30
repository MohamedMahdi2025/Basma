# HR Phase 4 — Performance: KPIs, reviews, calibration, 360

**Goal:** a yearly cycle (and probation cycles) where each employee has 3 to 7 weighted KPIs,
a mid-year check-in, a self-assessment and a manager review scored 70% KPIs / 30% competencies
on a 5-point scale, HR calibration, and results with acknowledgement in "ملفي"; 360 feedback
for managers with anonymity rules.

**Architecture:** `backend/Performance.gs`; tabs `perfCycles`, `kpis`, `reviews`, `feedback360`.
Client `js/performance.js` (cards in "ملفي", team and HR sections in the console).

## Stages (HR moves the cycle): setup, goals, midyear, review, calibration, closed

| Stage | Who does what |
|---|---|
| goals | the manager (or HR) sets 3 to 7 KPIs, weights 5 to 50 each, summing to 100 |
| midyear | the manager records on track / at risk / off track with a note; the employee sees it |
| review | the employee rates each KPI and competency and comments; then the manager does the same |
| calibration | HR sees the computed overall and the distribution, sets the final rating (1 to 5), a change needs a note and is marked adjusted |
| closed | the employee sees the final rating and the manager's comment, and acknowledges it with an optional comment |

Overall = kpiWeight x (weighted average of the manager's KPI scores) + compWeight x (average of the
manager's competency scores), weights 70 / 30 by default (set per cycle).

Competencies: safety and compliance, customer service, teamwork, ownership, communication,
problem solving; leadership and developing people for managers.

## 360

HR launches it for chosen people (default: everyone who manages someone). Raters: the direct
manager, all direct reports, and peers (same department, up to 4, or picked by HR); the subject
rates themselves too. Results reach the subject, their manager and HR only when the cycle is closed.
Manager and self are shown by name; peers and reports only as groups and only with 3 or more
answers; comments never carry a name. Raw answers are never returned by the API.

## Access
Employee: own KPIs, review, results, 360 tasks and own 360 results. Manager (`manages_`): KPIs,
mid-year and review of their people, their 360 results; never salaries. HR: everything, calibration.

## Numbers
PC-YYYY-00001 cycles, KPI-YYYY-00001, PE-YYYY-00001 reviews, FB-YYYY-00001 360 requests.
