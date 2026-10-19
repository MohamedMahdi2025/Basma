# Best Gas Attendance (نظام الحضور) — working notes

Geofenced check-in / check-out for الناقل الأفضل للغاز head office. Same
architecture as `bestgas-cash-collection/app`: one static `index.html` (PWA)
on GitHub Pages, a Google Apps Script web app, a Google Sheet as the database.
Independent deployment; shares nothing with the other systems.

- Live: <https://besgasksa.github.io/BG-attendance/> (repo `BesGasKSA/BG-attendance`, public)
- Script `1e2oWAEY-G12L1MdtVHGDizyspELxu7qxVmvrd0orRQ3Z5mwbCVlReCH_`, sheet
  `1bwklmSqzZzkfd4Pb5YGBQ-WnPhDbAbXk4j80HTDF6mQ`, owner aboumahdi04@gmail.com
- Web app deployment `AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG`
  (baked into `index.html`; update this one, never create a new one, or the URL changes)

## Layout

```
app/                     the public git repo
  index.html             the whole client, ar/en, RTL/LTR
  sw.js, manifest.webmanifest, icons/
  backend/*.gs           source of truth for the Apps Script code (no secrets)
  tests/harness.js       runs backend/*.gs in Node's vm + a software passkey
  tests/run.js           48 end-to-end checks — node tests/run.js
  tests/preview-server.js + preview-shims.js   local preview with the real backend
../apps-script/          clasp folder (PRIVATE, not in git)
  Secrets.js             SETUP_KEY_HASH;  SETUP-KEY.txt holds the key itself
```

## Deploying

`bash tools/deploy.sh "what changed"`. It runs every `tests/*.js` and stops on the first one whose
last line lacks " 0 failed". Then it builds (`tools/build.js` XOR-encodes index.html and js/*.js into
../app), copies the backend files to ../apps-script, and runs `clasp push`. Next it runs
`clasp deploy -i <fixed id>`, checks that the backend answers JSON, pushes ../app (GitHub Pages) and
commits src.
- The backend file list lives in three places: deploy.sh, tests/harness.js and
  ../apps-script/.clasp.json filePushOrder. Keep them in step when a .gs file is added.
- Rollback: `clasp deploy -i <id> -V <previous version>` (see `clasp deployments`), then revert the
  ../app commit.
- Deploy outside the check-in peaks (07:30-08:30 and 16:30-17:30 Riyadh).

`filePushOrder` pins Code.js first. Only scope is `spreadsheets.currentonly`;
adding any service that needs a new scope (UrlFetchApp, MailApp, openById)
makes every request return Google's HTML "authorisation needed" page until the
owner runs `authorize` in the editor again — deploy that only when the user can click.

## Security model (what is actually enforced, server side)

- **Enrollment:** HR issues a one-time activation code (8 chars, 72 h, 5 tries,
  stored hashed). The code + a new platform passkey binds one device; enrolling
  again retires every earlier passkey. Admin "unlink device" revokes and kills sessions.
- **Every punch** needs a fresh WebAuthn assertion with user verification
  (Face ID / fingerprint), over a single-use 3-minute challenge issued for
  that punch type. P-256 ECDSA is implemented in `WebAuthn.gs` (BigInt,
  Jacobian, Shamir) and tested against Node crypto. Origin and RP ID hash are
  checked, sign counter must rise when non-zero (clone detection).
- **Geofence:** best of the recent GPS samples must be inside an assigned zone
  and accuracy ≤ `maxAccuracy`. Otherwise the attempt is stored as `rejected`.
- **Risk flags** (frozen samples, zero accuracy, stale fix, clock drift,
  impossible travel, new device, few samples, off hours, edge): ≥ threshold →
  counts but status `review` for HR. A browser cannot detect mock-location apps
  directly; these are the signals it can see.
- **Sessions:** HMAC-signed tokens (secret auto-created in script properties),
  12 h employee / 8 h HR+admin, revoked by bumping `tokenVer`.
- **Roles:** employee < hr < admin. HR: board, employees (only role employee),
  review, reports, manual corrections (never their own). Admin: zones,
  settings, device resets, roles.

RP ID is `besgasksa.github.io`, shared with every other BesGasKSA Pages site
(the cash-collection app is the same origin). Moving to a custom domain later
(e.g. attendance.bestgas.sa) means every employee re-enrolls, because passkeys
are bound to the RP ID. Set script properties `RP_ID` / `ORIGINS` then.

## Traps

- Safari only opens Face ID from a live user gesture, so the punch and sign-in
  challenges are **prefetched** (`schedulePunchPrefetch`) and `credentials.get`
  runs straight from `pointerup`. Adding an `await` before it breaks iPhones.
- History/report days before `createdAt` are skipped — otherwise a new hire is
  "absent" for the whole month.

## Speed and live data (2026-09-30)

Measured live with `diag` (POST `{action:'diag', setupKey, empNo}`; owner only): every
SpreadsheetApp read costs 250-900 ms whatever the tab size, a CacheService call ~50 ms,
the lock ~150 ms, and Google's own round trip ~2 s. So speed = fewer Sheet calls.

- PIN rounds use `sha256Js_` (plain JS). The old `Utilities.computeDigest` loop cost
  0.9-1.8 s per sign-in. A test pins it byte-equal to the service SHA-256; never change
  `pinHash_` output or every stored PIN stops working.
- `readAll_` is one `getDataRange().getValues()` call; `update_` keeps the request memo.
- Sign-in (`authBegin`, `authFinish`) sets `USE_TAB_CACHE_` and reads **employees and
  zones only** from a versioned CacheService copy (60 s). Every app write (`append_`,
  `update_`, `appendMany_`) and every hand edit (`onEdit` simple trigger) sets a new
  version, so changes show on the very next request. `update_` refuses rows from the copy.
  Credentials, punches and anything written under the lock are always read fresh.
  Row deletes/sorts by hand fire no onEdit: the 60 s expiry covers them. Never turn the
  copy on for an action that writes employees or zones.
- Since 2026-09-30 (later): every action in `READ_ONLY_ACTIONS` (Code.gs) reads all small tabs
  (`CACHED_TABS_`: everything except punches, audit, settings) from the versioned copy, token check included;
  one CacheService getAll fetches all copies (`prefetchTabs_`), big tabs are split in 90 KB parts. Sign-in
  uses the copy for employees and zones only (it writes credentials). Adding an action that writes to
  READ_ONLY_ACTIONS makes update_ throw "cached copy" - that is the guard working, remove it from the list.
  Copy expiry 300 s bounds only hand row deletes/sorts; edits and app writes show on the next request.
- Client: `apiFresh(action, payload, onData)` shows the last answer from memory at once and redraws only
  when the fresh one differs; any successful non-read action clears the memory; lock clears it too.
  After sign-in the app pre-loads myFile (and hrBootstrap for HR). HR lists come in one call, `hrBootstrap`.
- **Sheets converts text on write** ("2026-09-30" to a date, "08:00" to a time, "0501..." to a number, "=..." to
  a formula). `toRow_` writes every string with a leading apostrophe (stored as text); `cellDate_` reads back
  cells converted before that fix. The test harness sheet now mimics the conversion (`sheetValue`), so a raw
  write would fail the tests. This bug had stopped check-out on the live system until 2026-09-30 @16.
- Settings cache is 120 s (cleared on save and on hand edits of the settings tab).
- The site: each build stamps `BUILD`, `version.json` and the SW cache name; the page
  checks `version.json` on open, on resume and every minute (since 2026-10-08: the user wants phones
  updated instantly). Signed out it reloads at once; signed in it reloads by itself as soon as
  `updateSafeNow()` holds (no punch in flight `S.busy`, no drawer, no focused field, nothing typed for
  60 s), and shows the update bar meanwhile. Navigation is fetched `no-store`.

## HR (Phase 1, live 2026-09-30)

Files: `backend/Hr.gs` (all HR actions), `js/my-file.js` ("ملفي" tab), `js/hr-console.js`
(tab "hr", opened by `#hr`), tests `tests/hr.js` (`node tests/hr.js`). The two js files load
on demand (`loadScript`, `lazyScreen` in index.html) so the check-in screen never waits;
`build.js` XOR-encodes each into `app/js/`. hr-console needs my-file loaded first (shared
strings and `.mf-kv` / `.mf-hist` styles).

Tabs: employees, departments, positions, empPrivate, compensation, jobHistory, documents.
`compensation` and `jobHistory` are append-only and effective-dated.

Who sees what (enforced in `buildFile_` and each action, never in the page):
- employee: own file, own package, own private data and documents
- manager / department head (`manages_`: manager chain or head of the dept or a parent):
  job, JD, history of their people; never `comp`, `priv`, `documents` (keys absent, not empty)
- hr: everything; admin: everything except salaries unless also `payroll` (`hrRolesSave`)
- payroll (extra role, admin grants): salaries and private data, approves packages
Rules: a salary change needs a second person (`second_approver_required`), nobody proposes,
approves, imports or changes the bank account of themselves (`cannot_change_own_salary`,
`cannot_import_self`, `cannot_change_own_bank`), HR cannot edit an admin record.
KSA checks: `expat_contract_fixed` (Art. 37), `probation_too_long` (> 180 days, Art. 53),
`leave_below_minimum` (< 21, Art. 109); Saudization in `hrDirectory` (Nitaqat weights).

Import: client parses Excel with SheetJS (cdnjs xlsx 0.18.5), maps Arabic or English headers
(`COLS` in hr-console.js), skips blank rows and maps server row numbers back to Excel rows.
Server re-validates everything and commits all or nothing; salaries arrive `pending`.
Arabic counts go through `plural(n, 'people'|'days'|'rows')`; never "3 موظف".

## HR (Phase 2, live 2026-09-30): leave and requests

`backend/Leave.gs`, `js/requests.js` (form with live `requestQuote`, list, printable letters; loaded
before hr-console), tests `tests/leave.js`. Tabs `requests`, `holidays`; employees gained
`leaveOpeningDays/Date`, `resignedOn`, `lastWorkingDay`. Plan: docs/superpowers/plans/2026-09-30-hr-phase2-leave-requests.md.
- Chains: leave, correction, resignation = manager then hr; letter, data change = hr; advance = hr then
  payroll (never the line manager). Manager step skipped with no active manager. Nobody acts on their
  own request or on two steps of one request. Rejecting needs a note. Final approval re-runs `quote_`.
- Annual balance: opening (carried over) + accrual (21/yr, 30 after 5 years, contract days if higher,
  paused on approved unpaid) - approved; pending reserved. **Without an opening balance accrual starts at
  the go-live (createdAt), not the hire date** (`openingMissing` tells the employee), so HR must load the
  old system's balances (import columns leaveOpeningDays / leaveOpeningDate, or the Leave section).
- Attendance: `offIndex_` (one read of requests + holidays) feeds `summarizeDay_(..., off)` in board,
  report and history: approved leave = 'leave', holiday = 'holiday' (work on it is overtime). The home
  screen passes no `off`, so sign-in reads nothing new.
- Numbers: LV/LT/AD/AC/DC/RS-YYYY-00001 via `nextRef_(kind, refsOf_(tab))` (never reuses a number already in
  the sheet). Prefixes renameable with the `refPrefixes` setting (JSON).

## HR (Phase 3, live 2026-09-30): payroll

`backend/Payroll.gs`, `js/payroll.js` (HR section "الرواتب" and the payslip in "ملفي"), tests `tests/payroll.js`.
Tabs `payrollRuns`, `payslips`, `adjustments`. Plan: docs/superpowers/plans/2026-09-30-hr-phase3-payroll.md.
- `calcSlip_` itemises every line: package on the month's last day (monthly/30, partial months by days),
  unpaid and sick-tier leave, absence (setting deductAbsence), late minutes (deductLateMinutes, off),
  Art. 107 overtime from `overtime_hours` adjustments (or attendance with payOvertimeFromAttendance),
  GOSI by cohort and month (legacy 9.75/11.75; new law steps each July to 11.75/13.75; non-Saudi 0/2),
  advance instalments until repaid (repaid = locked payslip lines), fines capped at 5 days (Art. 70),
  deductions capped at 50% of wage due (advances deferred first).
- Draft by hr or payroll; approved and locked by a payroll holder who did not prepare or last recalculate.
  Locked is final: no recalc, no adjustments for that month. Payslips show to employees only when locked.
- Email: `payrollEmail` uses Microsoft Graph with script properties M365_TENANT, M365_CLIENT_ID,
  M365_CLIENT_SECRET, M365_SENDER. **Also needs `https://www.googleapis.com/auth/script.external_request`
  in appsscript.json oauthScopes and the owner re-running `authorize`** (deploy that only when the user can
  click, or every request breaks). Until then it answers email_not_configured; it never uses Gmail.

## HR (Phase 4, live 2026-09-30): performance

`backend/Performance.gs`, `js/performance.js` (card in "ملفي", section "الأداء": team view for managers,
cycle console for HR), tests `tests/performance.js`. Tabs perfCycles, kpis, reviews, feedback360.
Plan: docs/superpowers/plans/2026-09-30-hr-phase4-performance.md.
- Stages setup > goals > midyear > review > calibration > closed, moved by HR. KPIs 3-7, weights 5-50,
  total 100, set by the manager or HR (never by the employee). Overall = kpiWeight x weighted KPI score +
  compWeight x competency average (70/30 default). Calibration to another rating needs a note (shown to
  the employee only as "adjusted"; the note stays with HR). Closing fills finals from the rounded overall.
- The employee sees manager scores and the final rating only when closed. 360: groups of peers or reports
  appear only with 3+ answers, comments never carry names, raw answers are never returned by the API.
- Action names must be letters only (handle_ regex), so 360 actions are feedbackLaunch / Submit / Results.

## Management dashboard (live 2026-09-30)

`backend/Dashboard.gs` (`api_dashboard`: one call, parts wrapped in `dashSafe_` so one failing block
does not blank the page), `js/dashboard.js` (section "لوحة الإدارة", first in the HR console), tests
`tests/dashboard.js`. Access: HR, admin, payroll, and the new extra role `executive` (admin grants it
with hrRolesSave). Money blocks (payroll cost, leave and end-of-service liabilities, advances) only for
hr, payroll, executive; admin alone sees none; no individual salary or IBAN leaves the server.
Periods up to 92 days, compared with the previous period of the same length.
Chart colours validated with the dataviz validator on the white card: #2E7D4F / #C98500 / #2a78d6
(the brand #4D6D51 fails the chroma floor as a series colour). Charts are plain SVG/CSS, LTR inside,
with hover tooltips and a table view per card. `saudizationTarget` setting draws the Nitaqat target.
Trap: never name a dashboard class `.hero` (index.html uses it for the check-in radar).

## Reports centre (live 2026-09-30)

`backend/Reports.gs` (catalogue `REPORTS`, one function per report in `REPORT_FNS`), `js/reports.js` (section "التقارير" in the
HR console), tests `tests/reports.js`. 18 reports in six groups. Access: 'people' (HR, admin, executive, payroll, managers for
their team only: row-level security in `reportScope_`), 'money' (HR and payroll, per person), 'cost' (HR, payroll, executive,
totals only), 'audit' (HR, admin). Managers never see advances or the leave liability column. Money reports write salary_view.
- Every report returns columns [{key, type, sum, group}], rows, checks (error / warn / info with counts) and a chart hint.
- Export = `reportExport`: the server runs the report again, keeps the columns the viewer chose (`keepColumns_`), numbers it
  RPT-YYYY-00001 and stores a SHA-256 of id + params + column keys + rows in tab `reportLog`. `reportReview` is a second person
  (never the maker); `reportVerify` says whether a fingerprint matches and whether a re-run today would give the same rows.
- Client files: Excel (SheetJS, Info sheet, SUM formulas with cached values, number formats with "-" zeros and bracketed
  negatives, RTL), CSV with BOM, PDF/print (A4, watermark with viewer name/no./time/ref, Gregorian + Hijri, QR of "ref|hash"
  via cdnjs qrcodejs, page x / y in the @page footer, signature lines).
- Shared chart kit: dashboard.js exports `window.Viz` (tile, card, hbars, cols, lineChart, wireTips...). Load dashboard.js first.
- Every drawer (index.html `drawer()`) has a close (x) button, Escape and tap-outside; do not build panels without it.

## People programmes (live 2026-09-30, from the installed HR skills)

`backend/Engage.gs`, `js/engage.js` (cards in "ملفي", HR console sections onboarding / plans / engagement / policies),
tests `tests/engage.js`. Tabs onboarding, surveys, surveyAnswers, policies, policyAcks, devPlans. Refs ONB, SRV, POL, IDP, PIP.
- Onboarding: HR starts an 18-task 30-60-90 plan (`ONB_TEMPLATE`, due dates from the hire date, probation review day 80,
  outcome day 89, Art. 53). Owners hr / manager / employee / it; each ticks only their own (HR ticks IT's, only HR skips).
- Pulse survey: eNPS + 5 statements + comment. **Anonymous by design**: surveyAnswers has no employee id; the voter list is
  a sorted set of HMAC hashes on the survey row (so row order cannot tie a vote to an answer); results, departments and
  tenure bands with fewer than `MIN_GROUP` (5) answers are hidden; comments shuffled and only when the survey reaches 5.
  (The sheet owner's Google version history could still correlate edit times; say so if asked.)
- Policies: versioned; any change to the text bumps the version and asks everyone again; HR sees coverage and who is missing.
  Starter texts in engage.js (attendance, conduct, anti-harassment, confidentiality/PDPL, leave) for HR to edit.
- Plans: IDP (up to 2 years) or PIP (30-90 days incl. extensions, a measure per goal, reason and support required), written by
  the manager or HR, never by the person; check-ins by manager/HR; employee acknowledges; outcome only by HR.
- Report `pay_equity` (Reports.gs): average package per position by gender and Saudi/non-Saudi, gap %, warn at 10%.
- Trap (again): String.replace turns `$$` into `$` in inserted code; tests/run.js now fails on `$(...).forEach`.

## Compliance and daily work (live 2026-09-30, from docs/research/2026-09-30-hr-gap-study.md)

`backend/Compliance.gs`, `js/compliance.js` (HR console section "الامتثال" for hr/payroll; delegation drawer from the inbox),
the bell "مهامي" in index.html (`loadTasks`/`openTasks`, action `myTasks`), tests `tests/compliance.js`.
Tabs delegations (DLG), wpsLog (WPS), salaryRecon (REC). Setting `wpsDueDay` (10).
- Delegation: a manager (or HR for anyone) hands manager-step approvals to someone for up to 60 days, no overlaps;
  `canAct_` accepts `delegatedFor_`; the history records role 'delegate' + onBehalfOf. Nobody approves their own request.
- WPS: `wpsFile` for a locked run checks IBAN (mod 97), ID (1… Saudi, 2… iqama), net > 0, basic > 0; zero payslips are
  skipped and listed. Tracker generated -> uploaded (bank/Mudad ref) -> confirmed by someone else. Excel columns follow
  common WPS files; **confirm the exact template with the bank / Mudad before the first upload**.
- Reconciliation: GOSI wage = basic + housing, Qiwa = basic; > 1 SAR difference is a mismatch; `payrollApprove` fails
  `recon_open` while a mismatch for that month is open; closing needs a note and a second person.
- Calendar: GOSI registration 15 days, Qiwa contract documentation, expiries (90 days), payroll/WPS by month, open recon,
  Saudization vs target. Rule details from vendor summaries: verify with HRSD / Qiwa / GOSI.

## The v2 shell (design system v2, built 2026-10-01; docs/research/2026-09-30-hr-ui-design-study.md)

index.html `renderShell` draws a cream sidebar with seven areas plus a top bar. The top bar holds the Ctrl K search,
an attendance chip, the bell, the language switch and an avatar menu. On phones the sidebar becomes a drawer and a
bottom bar appears, with check-in in the centre. `AREAS` lists each area's sub-pages, and each sub-page has an `ok()`
role predicate: `R()` gives the file roles, plus `isHr`, `isAdmin` and `salaryOk`. An admin alone sees no pay pages,
which matches the server. A sub-page is one of four kinds:
- `sec`: an HR console section, via `HrConsole.section(id, body)`;
- `adm`: an old admin screen in `#admBody`;
- `files` + `run`: a lazily loaded module;
- a plain `run`.

`goArea(area, sub)` routes everything, and the URL hash is `#area/sub`; the old `#hr` and `#file` still work. The
check-in radar is `time:punch` (renderHome renders into `view()`); `onPunch()` replaces the old `S.tab === 'home'`
checks.
- `taskDest(task)` maps a bell task to a page: an HR `sec` goes through `SEC_DEST`, and personal tasks go to
  growth:me or profile. Nav counts come from the same myTasks answer.
- `themeLast()` keeps `<style id="dsv2">` last in head, after each module's own style.
- The employee panel (hr-console `openEmp`) has a lifecycle strip from hire to clearance; each stage links to its
  screen.
- New module files: js/home.js (role-aware home with the gauge) and js/ops.js (shifts, relations, custody,
  offboarding, `Ops.myCards` in the profile).
- Settings: admin `settingsSave` also takes the HR keys, writes them as text, and answers `bad_setting` with the
  `key`. The form is in admSettings.
- Tests: 13 suites plus `tests/sim50.js`, a 50-employee company that runs every cycle and the access matrix.

## Workforce analytics (dashboard, 2026-10-01)

`api_dashboard` computes it only when called with `analytics: 1` (home does not send it). It covers:
- 12-month turnover, split voluntary and other, plus first-year attrition;
- tenure;
- span of control;
- cohort retention at 3, 6 and 12 months;
- retention indicators (0-5 signals, each with its reason).

Rules:
- The indicators never read gender, nationality, Saudi status, age or the private file; a test flips those and
  expects identical output.
- Names are visible to the hr role only.
- Groups under 5 people show counts only, for anyone who is not HR.
- Voluntary leaver = `resignedOn`, an approved resignation, or a clearance with reason `resignation`.

## SaaS direction

The plan for licensing the system to many companies is in docs/research/2026-10-01-saas-multitenant-design.md.
The recommendation is one Node + PostgreSQL platform in a KSA region that reuses backend/*.gs through a storage
adapter (all data access is in a few Code.gs helpers). Best Gas would be company one. The owner has not decided yet.

## White-label company profile (2026-10-03, SaaS groundwork)

Settings `companyNameAr/En`, `companyShortAr/En`, `companyCr` (10 digits), `companyVat` (15, 3...3) and
`companyAddressAr/En` are validated in Admin.gs `companySettings_`, with the card "ملف الشركة" in admin settings.
- They reach the client as `company` in the home payload (`companyOf_`).
- The client names the employer only through `coName(lang)`, `coShort(lang)` and `coMeta(lang)` (CR · VAT ·
  address for letterheads). The profile is remembered on the device (`store('co')`), so the sign-in wordmark
  shows it too.
- No module may contain a literal company name. `grep -rn "Best Gas\|الناقل الأفضل" js/` must stay empty.
- The logo file is cream on transparent (made for pine screens), so it was nearly invisible on white printed
  pages. `logoInk()` returns a copy inked #4D6D51 on a canvas at start-up; every printed document uses it.
- The logo image itself still says Best Gas: per-company logo upload is a platform (Phase 2) item.

## Phone app wrapper and iPhone location (2026-10-19)

`../native/` is a Capacitor 8 wrapper that loads the live site. Plugins: native geolocation and `capacitor-native-settings`.
`index.html` defines `BGNative.openSettings()` and swaps `navigator.geolocation` for the native plugin only inside the
wrapper; `tests/native-bridge.js` covers it. The iPhone App Store build needs the owner's Apple Developer account, so read
`../native/README.md` before touching it. A web page cannot open iPhone Settings (Apple blocks `App-Prefs:`), so on the web
the check-in card shows a 3-step guide (`locIos*`) and re-checks on return. `locDiag()` prints a one-line diagnostic under the
check-in title. iPhone `err:1` with `perm:prompt` means Location Services or Safari Websites is off at the iPhone level.
Phone layout: `<style id="dsfb">` (≤900px), page picker sheet `openPagePicker`, REA evidence in
docs/research/2026-10-19-mobile-design-rea.md.
