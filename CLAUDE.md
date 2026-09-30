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

```bash
node tests/run.js                                   # must be 48/48
cd ../apps-script && for f in Code WebAuthn Attendance Admin; do cp ../app/backend/$f.gs $f.js; done
clasp push -f && clasp deploy -i AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG -d "what changed"
curl -sL https://script.google.com/macros/s/AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG/exec   # must be JSON
cd ../app && git push                               # Pages rebuilds in ~1 min, caches ~10 min
```

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
  checks `version.json` on open, on resume and every 5 min (reloads when signed out,
  shows an update banner when signed in). Navigation is fetched `no-store`.

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
