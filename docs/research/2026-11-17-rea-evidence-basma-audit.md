# BASMA: current experience structure (source audit, read-only)

Source: `D:\Best Gas\Finance\Claude\Claude\Basma - Mahdi\src`. Nothing was edited, run against the live backend, or tested in a browser; every figure is from static reading and counting scripts. Tap counts are derived from code, not observed.

**Correction to the brief:** `AREAS` has **14 areas, not seven** (index.html:4902-5012): 12 in the sidebar (home + 9 "lifecycle" + 2 "management") and 2 in the footer (profile, account). CLAUDE.md's "seven areas" is stale.

## 1. Information architecture

98 sub-pages: 94 tabs + 4 full pages (`page:1`). Kinds: 64 lazy module (`files`+`run`), 23 `sec` (HR console), 7 `adm` (old admin screens), 4 plain `run`.

Role letters: **E** employee, **M** manager, **H** hr, **A** admin (no payroll), **P** payroll holder, **X** executive. "all" = everyone. Kind suffix: s = sec, a = adm, r = plain run, none = module.

| Area (ar / en) | Sub-pages |
|---|---|
| home (الرئيسية / Home) | main: all |
| hire (التخطيط والتوظيف / Plan and hire) | workforce MHAPX · org(s) HA · positions(s) HA · recruitment MHAPX · careers HA |
| onboard (التعيين والتهيئة / Onboard) | accounts(a) HA · welcome HA · onboarding(s) MHA |
| people (الموظفون / Employees) | directory(s) HA · mass HA · team(s) M · orgchart HA · expiring(s) HA · gov HAP · insurance HAP · custody(s) HAP · contingent MHAP · customfields HA · import(s) HA |
| time (الحضور والدوام / Time & attendance) | punch(r) all · history(r) all · board(a) HA · office all · review(a) HA · shifts(s) MHA · openshifts all · timesheets MHA · zones(a) A · kiosks HA |
| requests (الطلبات والإجازات / Requests & leave) | mine all · signatures all · autotasks all · ask (only when AI is on) · inbox(s) MHAP · centre MHAPX · leave(s) MHA · calendar all · holidays(s) HA · cycles MHAP · expenses all · helpdesk HAP · kb all · full pages new, view, claim, claimview: all |
| pay (الرواتب / Pay) | slips all · runs(s) HP · grades HPX · retro HP · paygroups HP · approvals(s) HP · compliance(s) HP · budget HAPX · gosi HAP · journal HP · loans HAP · payreview MHAP · perks all |
| growth (الأداء والتطوير / Performance & growth) | me, oneonone, mobility, kudos, mentoring, skills, quizzes: all · cycle(s), plans(s) MHA · training, talent MHAX |
| engage (التواصل وعلاقات العمل / Engagement and relations) | announce HA · celebrate, svactions, safety all · pulse(s) HAPX · relations(s) MHA · policies(s) HA |
| offboard (إنهاء الخدمة / Offboard) | offboarding(s) MHAP · settlements HP · exits HX · alumni HA |
| insights (التقارير والتحليلات / Reports & insights) | dashboard(s) HAPX · nitaqat HAPX · reports(s) MHAPX · history HAPX · schedules(r) MHAPX · builder HA · attendance(a) HA · audit(a) HA |
| admin (الإدارة والصلاحيات / Administration) | settings(a) A · roles HA · letters HA · flows HA · export A · integrations A |
| profile (ملفي / My file), account (الحساب والأجهزة / Account & devices) | main: all |

**Pages visible per role** (tabs + 4 full pages; AI off; "A" = admin without the payroll role; computed by evaluating each `ok()`):

| Role | Areas | Tabs | Total |
|---|---|---|---|
| Employee | 8 | 25 | 29 |
| Manager | 13 | 45 | 49 |
| Executive | 11 | 39 | 43 |
| Payroll holder | 12 | 54 | 58 |
| Admin | 14 | 83 | 87 |
| HR | 14 | 88 | 92 |
| Admin + payroll | 14 | 91 | 95 |

Largest areas for HR: pay 13, requests 12, growth 11, people 10, time 9. `R()` also carries an `hse` role that no `AREAS` predicate uses (index.html:4882).

## 2. Home per role (`js/home.js`)

Frame for everyone (home.js:326-346): greeting banner → Company/Mine toggle (HR, admin, payroll, executive only; **defaults to Company**) → 8-icon quick grid, **phone only** (check in, new request, my requests, payslips, expense claim, 1:1s, recognition, my file; home.js:238) → body → "wisdom of the day" + "on this day" (Wikipedia).

- **Employee** (`myHome`, home.js:452): (1) "My month" KPI row: attendance %, late days, leave balance, last net pay; (2) insights card, up to 5 nudges (missed check-out, shift soon/not in, late run, oldest pending request, holiday, leave ≥15 days, new payslip; home.js:504-554); (3) shift card with today ring + check-in/out button; (4) My tasks; (5) month strip of day squares; (6) quick requests (leave, letter, expense, correction).
- **Manager:** team KPI row (team size, on leave today, leave waiting, decisions waiting) and a team insights card (absent, late, pending, overlap) come first, then the employee blocks.
- **HR / admin** (`companyHome`, home.js:399): (1) attendance row: present, late, on leave, absent with 14-day sparklines; (2) company insights (punch review queue, absence, missed check-outs, old requests, weakest department, compliance, Saudization); (3) today gauge + sentence + 4 facts (headcount, Saudization, payroll, open requests); (4) Decisions waiting; (5) compliance deadlines; (6) joiners/leavers chart; (7) attendance by department.
- **Payroll holder:** same layout, KPI row is pay (wage bill, last run, employer GOSI, waiting at payroll). **Executive:** overview row (headcount, attendance rate, Saudization, open requests) plus the pay row; no deadlines card. At most two KPI rows (`rowKinds`, home.js:348).

Every tile, fact and insight row is tappable (`go` lists resolved by `goOk`).

## 3. Top-task paths

Counting rule: taps from home on a first visit (`goArea` remembers the last tab per area), excluding typing and the Face ID/PIN prompt. On phones tabs are replaced by a picker (`m-pick` → sheet), so a non-first tab costs 2 taps, and areas outside the bottom bar (home, requests, check-in, people-or-pay, More) cost one more via the drawer.

| Task | Desktop | Phone | Notes |
|---|---|---|---|
| Check in / out | 2: top-bar attendance chip → punch button | 2: bottom-bar centre → punch button | The chip is hidden on phones (index.html:1683). One button flips in/out. |
| Request leave | Employee 2: home "Leave" quick card → Send. HR and other company roles 3 (Mine toggle first) | 3: quick grid "New request" → Leave → Send | Not verified: form fields and any extra confirm. |
| Leave balance | Employee/manager 0 (KPI tile). Company roles 1 (toggle) | Same, but below the 8-icon grid (and the team blocks for managers) | Also on requests:mine and the new-request picker. |
| Approve (manager) | 2-3: "Decisions waiting" tile → Approvals → Approve in the row | 2-3 | Whether the row must be expanded first was not verified. |
| Approve (HR) | 2-3: "Decisions waiting" card Open → Approve; via bell 3 | 2-3 | |
| Latest payslip | Employee 2: net-pay tile → slip row. Company roles 2 via sidebar Pay | 2: quick grid "My payslips" → row | |
| Find a colleague | HR 2 + typing (search → pick, opens the file). Manager 1 (team tile). **Employee: 2 + typing via Time → Office map only** | Employee 4: More → Time → picker → Office map | See problem 3. |
| Add an employee | 3: Employees → Add employee → Save | 3: bottom-bar People → Add → Save | Creates the sign-in account; the HR file is filled afterwards. |
| Run and lock payroll | Preparer 3: Pay → Payroll runs → Create. Approver about 4: Pay → Payroll runs → open run → Approve | Preparer 5, approver about 6 | **Two people by rule**; admin alone has no access. |
| Export a report | 4-5: Reports & insights → Reports tab → report → (Run) → Excel. Or 1: top-bar Excel icon on any screen | 6 via Reports; 2 via avatar → Excel | The top-bar Excel is a client-side copy of visible tables (index.html:5685), with no API call in that function. |
| Change a setting | Admin 2 + edit: Administration → Save | 3: More → Administration → Save | Admin only; HR has no settings page. |

**Dead ends and silent fallbacks**
- `goArea` sends any unknown or forbidden address to home with no message (index.html:5253); `taskDest` defaults to home/profile (5051).
- The joiners/leavers card targets `people:onboarding` and `people:offboarding`, which moved on 2026-10-20. `goOk` does not apply `MOVED` (dashboard.js:216-222), so the card always falls through to the dashboard (home.js:433).
- The payroll run view is held in `S.prRun` with its own back button and no URL (payroll.js:269-327); a reload loses it.
- Employees have no directory; Ctrl K returns people only for HR.

**Duplicate routes**
- Approvals: `requests:inbox`, `requests:centre`, `pay:approvals`.
- Add employee: `people:directory` Add and `onboard:accounts` open the same `newEmpPage` (hr-console.js:418); also import, mass changes, recruitment hire.
- Reports: `insights:schedules` is the reports section with a jump flag (index.html:4999); `insights:attendance` is the old admin report beside the reports centre and the builder.
- Org: `hire:org` and `people:orgchart`. Leave: `leave`, `calendar`, `holidays`, `cycles` are four tabs.
- Profile, account, language, print, Excel and sign-out each appear in two or three of: sidebar foot, avatar menu, top bar, quick grid.

**Reachable only by link or search:** `requests:view` and `requests:claimview` (links only); `requests:new` and `requests:claim` (buttons or Ctrl K, no tab).

## 4. Global patterns

- **Ctrl K** (index.html:5699): pages the viewer may open (14 shown when empty, 8 when filtered); employees from `hrBootstrap` **for HR only**; server `searchAll` records in 7 groups (requests, announcements, help desk, courses, documents, requisitions, candidates; Hr.gs:936). Arabic-normalised, highlighted, debounced 150 ms.
- **Bell** (5784): `myTasks` grouped by area with count tiles; a row routes via `taskDest`; `TASK_SPOT` scrolls to a profile card. The same answer feeds sidebar counts and bottom-bar dots.
- **Three overlay patterns coexist:** `drawer()` now opens a full "record page" with a `~key` URL (5437; 86 call sites); `sheetDrawer` is the pre-shell fallback; phones add the bottom sheet page picker (5318). Confirmation is "tap again" (`confirmTap`, 44 uses, defined twice: expenses.js:61, flows.js:171) versus 4 native `confirm()` calls.
- **Empty and error states:** 43 `class="empty"`, 11 `db-empty`, 5 `cr-empty`, 5 `V.empty`; error-with-retry (`failBox`/`failed`) 22 uses. dsv6 puts one desk illustration behind all empties.
- **Phone bottom bar** (5125-5130): Home, Requests, centre check-in, People (HR/manager) or My pay, More (opens the sidebar drawer). Badges on each.
- **Language:** top-bar button on desktop; on phones only in the avatar menu (2 taps). `toggleLang` redraws the shell and keeps typed forms for 20 s (`draftSave`).
- **Offline / updating:** the service worker caches the shell network-first and never caches API calls (sw.js). No `online`/`offline` listener and no punch queue were found; failures show a wifi-slash empty state with retry or a toast. `version.json` is checked on open, on resume and every minute; the page reloads itself when `updateSafeNow()` holds, otherwise an update bar appears (index.html:6760-6790).

## 5. Visual layering debt

16 `<style>` blocks in index.html; 14 are design layers. About 325k characters of CSS (about 240k without the icon-font map), roughly 31% of the file. **474 `!important`** in index.html, plus 57 in modules.

| Layer | Lines | Chars | !important |
|---|---|---|---|
| base (unnamed) | 27-652 | 60.8k | 12 |
| dsv2 | 653-923 | 26.7k | 54 |
| dsv3 | 924-1057 | 14.3k | 30 |
| dsed | 1058-1074 | 1.3k | 0 |
| dsdark | 1075-1113 | 5.0k | 5 |
| dsfp | 1114-1198 | 9.9k | 2 |
| dspg | 1199-1302 | 9.7k | 6 |
| dsmo | 1303-1363 | 7.3k | 4 |
| dsgate | 1364-1650 | 29.3k | 19 |
| dsfbx | 1651-1672 | 1.9k | 4 |
| dsfb | 1673-1765 | 10.7k | 43 |
| dsv4 | 1766-1819 | 5.8k | 10 |
| dsv5 | 1820-1923 | 11.3k | 98 |
| dsv6 | 1924-2316 | 45.6k | 180 |

Conflict evidence:
- **Overlap (approximate parse):** of 1,761 distinct selectors, 340 are declared in 2+ layers, 120 in 3+, 33 in 5+. `.v2-card`, `.mf-card` and `.set-card` are each restyled in **8 layers**; `.tblwrap` and `.v2-views` in 7.
- **dsv6 is an override layer:** of its 463 selectors, 103 also exist in dsv2, 89 in base, 81 in dsv3, 51 in dsv5. 212 of its rules carry the `html body.v2-on` specificity prefix and 180 use `!important`.
- **One button, three rules:** `.v2-lang` is hidden in dsv2 (line 903), forced visible with `!important` in dsgate (1581), and hidden again with `!important` in dsfb (1683).
- **Order changes at run time:** `themeLast` (5030) re-appends the sheets in a different order from the source (dsdark after dsfp/dspg; dsfb and dsfbx swapped) after each lazy module loads. I did not observe a visible effect.
- Modules fight back: home.js:108 uses `.hm-card.hm-clock.hm-clock` to beat dsv3. Every module injects its own style block.
- dsv4's 7 gradients and dsv3's tints are still shipped although dsv6 forbids them; dsv6's own gradients are confined to sign-in, welcome and platform rules.

## 6. Size facts

- index.html: **785,382 bytes**, 6,802 lines. 59 `Object.assign(T.ar…)` string blocks across the client.
- 26 modules, **1,718,538 bytes**: wave2 202k · wave4 156k · reports 145k · hr-console 135k · ops 131k · flows 98k · requests 93k · payroll 89k · home 87k · dashboard 83k · engage 63k · wave5 57k · wave6 48k · expenses 44k · compliance 43k · wave7 41k · performance 41k · my-file 36k · gov 34k · journal 27k · xl 18k · presence 15k · doc 12k · careers 11k · assistant 9k · kiosk 7k.
- Home loads 3 modules; opening "My requests" loads 11 (`MY_FILES`, about 870 KB of source).
- Backend: **447 `api_` functions** in 29 `.gs` files (18,555 lines); `handle_` dispatches by the `api_` prefix (Code.gs:1263). Largest: Admin 35, Payroll 30, Wave5 30.
- **120 tabs** in `HEADERS` (Code.gs:43), 1,615 columns.

## 7. Top 15 experience problems, by impact

1. **Too many destinations.** HR sees 88 tabs in 14 areas; an employee still sees 25. Requests has 13 tabs, pay 13.
2. **Phone navigation is deep.** Tabs are hidden (index.html:1704) behind a picker, and 9 of 14 areas sit behind More: payroll runs is 4 taps before any work.
3. **Employees cannot look up a colleague.** No directory; Ctrl K gives people to HR only (5768); the office map shows presence, not contact details.
4. **Irreversible payroll actions fire on one tap.** Approve-and-lock and Delete call the API directly (payroll.js:348-349), while routine approvals in the centre need "tap again".
5. **Three approval surfaces** (inbox, centre, salary approvals) with different confirmation behaviour (hr-console.js:985-992 versus flows.js:297).
6. **Company roles land away from their own data.** HR, admin, payroll and executives default to Company scope, so leave balance, payslip and the check-in card are one toggle away (home.js:327).
7. **Navigation fails silently.** Forbidden or stale addresses go to home without a message (5253); the home movement card proves it (home.js:433).
8. **Home leaves skeletons on failure.** 13 callbacks in home.js return on `!r.ok` with no error state or retry.
9. **Fourteen style layers, 474 `!important`.** New work must out-specify five earlier systems; 120 selectors are restyled in three or more layers.
10. **Mixed interaction generations.** 7 `adm` screens, 23 `sec` console sections and 64 module pages share the shell with different headers, toolbars and back behaviour; the payroll run view has no URL.
11. **Duplicate routes blur the model:** add employee (5 entry points), reports (4 tabs for one job), org (2), leave (4 tabs).
12. **Label collision.** `time:history` and `insights:history` share the key `vwHistory`, defined twice per language (index.html:4789/4793, 4839/4843). If both sit in one literal, as the lines suggest, the personal tab reads "Monthly history" instead of "My attendance". `SUB_ICON` also repeats `history` and `paygroups` (5014).
13. **Two "Excel" meanings.** The top-bar Excel copies visible tables on the device; report export is server-run, numbered and fingerprinted. Same icon, different guarantees.
14. **No offline or connection signal.** Check-in is the core phone task, yet there is no offline banner or queued punch; a failure appears only after the attempt.
15. **Home spends space on non-work content.** The wisdom and Wikipedia cards appear for every role, and the phone quick grid pushes KPIs below the first screen; settings is one 93-line form with about 35 controls and a single save (6637-6710).

Not verified, worth a browser pass: the exact tap count inside the request form and the inbox row, whether a report runs automatically on open, and whether problem 12 shows on screen.
