# World-class gap check (2026-10-25)

**Question from the owner:** is any module missing compared with the strongest systems?

**Compared with:**
- global: Workday, SAP SuccessFactors, Oracle HCM, Rippling, HiBob, Personio, Deel;
- Saudi: Jisr, ZenHR, Bayzat, Menaitech, Palm HR.

**Baseline:** the 116 rows of `2026-10-14-module-gap-audit.md` and its re-audit `2026-10-20-module-gap-reaudit.md`. All of
their code-only rows were built by 2026-10-24.

**Method:** a second pass over the leaders' module lists for things the first audit did not have as rows. Each candidate
was checked in `backend/*.gs`, `js/*.js` and `index.html` by searching for its data and actions, then reading the hits.
"Missing" below means no tab, action or screen for it exists.

## Verified gaps (new rows, not in the earlier audits)

| # | Module | Who has it | What exists here today | Verdict | Size |
|---|---|---|---|---|---|
| 1 | **Health, safety and environment (HSE)**: incident and near-miss reports, investigation, corrective actions, PPE issue log, safety KPIs (LTIFR) | Workday, SAP EHS, Oracle, Menaitech | Safety is only a training category; `incidentDate` is the disciplinary violation date | Missing. **Highest priority for a gas company** | M |
| 2 | **Salary structures**: grades and bands (min, mid, max), compa-ratio, range penetration, out-of-band warnings on offers and raises | Workday, SAP, Oracle, HiBob, Jisr | Pay-equity report groups by grade; requisitions have a budget min and max | Partial: no band table, no compa-ratio | M |
| 3 | **Retro pay (arrears)**: a back-dated salary change pays the difference for locked months in the next run | Workday, SAP, Oracle, ZenHR | Locked runs are final; HR adds a manual adjustment | Missing | M |
| 4 | **Contingent workforce**: contractors, outsourced manpower-agency staff and freelancers, with their own lighter record, timesheets, agency invoice check, end dates | Workday, SAP Fieldglass, Deel, Rippling | Only employees | Missing | M |
| 5 | **Push notifications** to phones (web push, and native in the wrapper) for approvals, check-in reminders and payslips | All of them | In-app bell only (polled); e-mail and WhatsApp wait for owner keys | Missing (code only, no owner key) | S |
| 6 | **Calendar feed**: each person's leave, shifts and holidays (and the team's for managers) as a private iCal link for Outlook or Google | HiBob, Personio, Rippling, Deel | None | Missing | S |
| 7 | **Skills inventory**: skills library, each person's skills with level and evidence, skills gap per position, search people by skill | Workday Skills Cloud, SAP, Oracle, HiBob | Competencies in reviews only | Missing | M |
| 8 | **Learning assessments and paths**: quizzes with a pass mark, certificates on pass, learning paths assigned by position, auto-assign mandatory courses to new hires, renewal before expiry | Workday Learning, SAP, Oracle, Bayzat | Course catalogue, sessions, enrolments, certificates | Partial: no quiz, no path, no auto-assign | M |
| 9 | **Mentoring programme**: mentor and mentee profiles, matching, sessions and goals | Workday, SAP, Oracle | None | Missing | S |
| 10 | **Celebrations**: birthdays (opt-in) and work anniversaries on home and in the team, with milestone recognition | HiBob, Personio, Bayzat, Jisr | Recognition (kudos) only | Missing | S |
| 11 | **Mass changes**: a salary increase by percent, transfers or a manager change for many people in one approved batch, with a preview | Workday, SAP, Oracle, Jisr | Excel import (new people), bulk approve | Partial | M |
| 12 | **Survey action plans**: turn low pulse or eNPS results into owned actions with due dates, then track them | Workday Peakon, HiBob, Qualtrics | Survey and results only | Missing | S |
| 13 | **Editable letter templates**: HR edits the wording of each letter (salary certificate, experience, NOC) with merge fields and a version history | Jisr, ZenHR, Bayzat, HiBob | Letters are fixed in code (bilingual) | Partial | S |
| 14 | **Rehire and alumni**: a rehire-eligible flag at exit, a rehire check on candidates, and boomerang history | Workday, SAP, Oracle | Exit interviews, clearance | Missing | S |

S = about a day, M = two to three days, each with tests in the house style.

## Looked at and already covered (no new row)

- Recruitment: interviews and scorecards, offers, PDPL consent, careers page, referrals.
- Time: overtime cap of 720 hours a year, rest-day work warnings (Art. 104), Ramadan hours (Art. 98), hourly permission
  caps, open shifts, kiosk QR.
- Records: emergency contacts and dependants in the private file; iqama, passport and visa expiries; exit and re-entry
  visas.
- Organisation and cost: cost centres on departments and pay groups; workforce plan and requisition budget.
- Leave types: Hajj, maternity, bereavement and sick tiers.
- Data: PDPL export.

## Deliberately not built

- **An offline punch queue.** A punch needs a fresh server challenge and a GPS fix checked at punch time, so storing
  punches to send later would defeat the anti-fraud checks. The kiosk QR already works offline on the tablet side.
- **Year-end leave forfeiture or encashment** (Art. 109).
- **Equity plans and global payroll or employer-of-record.** Neither applies to a Saudi single-country employer.

## Still waiting on the owner (unchanged, see docs/OWNER-STEPS.md)

- E-mail and file attachments, WhatsApp, AI assistant key, SSO client IDs.
- Speed server, iPhone and Android store accounts.
- Mudad, GOSI, Qiwa, Muqeem and Tameeni APIs.
- Biometric vendor, salary benchmark data, LMS content, background-check vendor, Nafath e-signature.

## Recommended build order

1. HSE.
2. Push notifications.
3. Salary structures.
4. Retro pay.
5. Contingent workforce.
6. Learning assessments and paths.
7. Skills inventory.
8. Mass changes.
9. Calendar feed.
10. Editable letter templates.
11. Survey action plans.
12. Celebrations.
13. Mentoring.
14. Rehire and alumni.
