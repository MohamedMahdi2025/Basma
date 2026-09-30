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
