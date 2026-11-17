# BASMA system redesign: world HRIS benchmark and measured plan (REA, 2026-11-17)

**Owner's request:** "use Fable to redesign the whole system using REA, study the benchmarking, check the HRIS
systems in the world."

**Verdict:** BASMA no longer has a feature problem; it has an **experience** problem. The 2026-10-25 gap check already
put modules at parity with Workday, SAP, Rippling, HiBob and the Saudi players. What separates BASMA from the best now
is how much a person must know to get a job done:
- **88 destinations** for HR across 14 areas;
- 9 of 14 areas behind "More" on phones;
- three approval screens;
- **14 stacked style layers** carrying 474 `!important` declarations.

The redesign below cuts destinations by about half and makes every daily task 1–2 taps. It also turns the Saudi
market's loudest complaint (punches that fail silently) into BASMA's headline strength. It ships in measured phases
behind a per-organisation switch.

## 1. Method (REA discipline: evidence, observation vs inference, stated unknowns)

Three independent research passes ran in parallel on Fable, each told to cite a source for every claim and mark what it
could not verify:

| Pass | Scope | Evidence base |
|---|---|---|
| A. Global HRIS experience | Workday, SAP SuccessFactors, Oracle HCM, UKG Pro, Dayforce, ADP Lyric/WFN, Rippling, HiBob, Personio, Deel, BambooHR, Gusto, Factorial, Lattice | 16 vendor pages read in full, ~50 more from search snippets, G2/Capterra review themes, G2 implementation-time averages |
| B. Saudi and GCC market | Jisr, ZenHR, Bayzat, PalmHR, Menaitech, KayanHR, Idaratech, Daftra; Mudad, Qiwa; Arabic/Hijri support of SAP, Oracle, Workday | Saudi App Store and Google Play listings, ratings and recent written reviews; vendor sites; W3C Arabic Layout Requirements; SAMA riyal-symbol guidance |
| C. BASMA as built | `index.html`, 26 modules, 29 backend files | Static reading and counting scripts with file:line references; two findings re-checked by hand (§3) |

The installed REA toolkit (`reverse-engineer-anything` skill) is for shipped binaries and bundles. Its own rule is to
skip it for source we own, so pass C used the source directly. Competitors' shipped apps were not decompiled; only
public material was used, and no assets were copied.

**Evidence grades used below:**
- **[F]**: a page read in full.
- **[S]**: a search snippet only.
- **[R]**: a store review.
- **[M]**: measured in BASMA's source.

## 2. What the world's best do (pass A)

### Shared patterns, with the products that evidence each

1. **A persistent left rail replaces top bars and app grids.** Workday moved every app into an always-visible sidebar
   (July 2026) [F]; BambooHR made the same move in 2024 [F]; Deel announced one for admins; Personio is testing one.
2. **Home is an action surface, not a chart wall**: quick actions first, then "what needs me". SAP documents
   role-conditional home sections that hide when empty [F]; Workday, Lattice, BambooHR mobile and Deel are similar.
3. **One inbox for approvals and tasks, kept apart from notifications.** Personio (Nov 2024), Factorial, Workday
   My Tasks, UKG mobile.
4. **Decide in place.** Approve or reject on the card or in a side panel, without opening the record: SAP [F], Oracle,
   Factorial [F], UKG.
5. **Bulk approve with filters.** Personio, Factorial.
6. **Search is navigation.** One bar covers people, pages, reports and help, with a key shortcut: Rippling `/` [F],
   Workday's centred home search [F], Deel, UKG.
7. **The assistant is docked in the shell**, so users keep their context: Dayforce side panel, Lattice right sidebar,
   BambooHR, Workday, Personio.
8. **The assistant matures from answer, to navigate, to act with human confirmation.** UKG Bryte only navigates;
   Rippling, Gusto, Dayforce and Deel act, but only after the user confirms.
9. **A manager surface over team data.** Oracle Manager Concierge [F], Lattice 1:1 brief [F], and Dayforce's
   who-is-in and exceptions view [F].
10. **Mobile opens on a "For you" feed**: BambooHR [F], Deel [F], Personio.
11. **Pinned shortcuts and widgets**: Workday Saved [F], SAP Favorites, Deel widgets [F].
12. **Plain-language pay explanations**: SAP "Explain My Pay" (2H 2025) [F]; Personio answers payslip questions.
13. **New experience ships opt-in, then becomes the default.** UKG, Workday's per-tenant dates, Dayforce Hub
    migration.

### What users complain about (G2/Capterra themes [S])

- Too many clicks and nested menus for simple self-service (Workday).
- Breadth without wayfinding, so documents and settings are hard to find (Rippling).
- An unfriendly or dated employee side (ADP WFN, UKG Pro).
- Web and mobile do different things (HiBob; Dayforce AI is web-only; Factorial AI is read-only on mobile).

### Published task depth (sparse; vendors rarely publish click counts)

| Task | Shortest documented elsewhere |
|---|---|
| Check in | one slide gesture on the home widget (Factorial mobile) |
| Approve | from the home card, with bulk (SAP, Personio, Factorial) |
| Find a colleague | `/` then a name (Rippling) |
| Request leave | worst documented is about 6 steps (Workday mobile job aid) |
| Payslip | 2–3 actions (SAP at Purdue) |

**Time to value** (G2 averages [F]):

| Group | Products | Months |
|---|---|---|
| SMB tools | Deel | 0.7 |
| | Gusto | 0.9 |
| | Rippling | 1.5 |
| | BambooHR | 1.7 |
| | HiBob | 2.3 |
| Enterprise suites | Workday, SAP, UKG | 3–7 or more |

## 3. Saudi market (pass B)

### Players

| Product | iOS SA rating | Strength | Visible weakness |
|---|---|---|---|
| Jisr | 4.61 (51k) | Saudi-first, GOSI/Mudad/Muqeem, Monshaat price from SAR 3,000/yr | Qiwa claim inconsistent; English screenshots under Arabic locale |
| ZenHR | 4.25 (1.1k) | Fully mirrored Arabic UI, 11 countries | European digits, Gregorian only; wrong-manager routing in reviews |
| Bayzat | 3.52 | HR + payroll + insurance, face check-in | Thin KSA review base |
| PalmHR | 3.41 | Saudi SME | Punch failures, location-permission loops |
| Menaitech | 3.14 | Legacy enterprise payroll | 41 of the latest 50 written reviews are one star |
| SAP / Oracle | 4.73 / 2.78 | Hijri display exists | SAP has no Hijri in generated documents; Oracle users report one-day Hijri drift |

### What Saudi employees reward and punish [R]

1. **The punch must work every time.** This is the dominant complaint across Jisr, MenaME and PalmHR: freezes at
   check-out, vanished punches, "out of range" while on site.
2. **Getting in without friction.** One-time codes that never arrive, re-login loops, repeated Face ID prompts.
3. **Stability over novelty.** Reviewers resent interface overhauls that regress.
4. **Balances and deductions that explain themselves.** Reviewers ask where the deduction policy is.
5. **Protection from mistakes.** One reviewer lost annual leave twice to a one-tap cancel.
6. **The app takes the blame for employer policy**, so explaining the rule matters as much as applying it.

### What owners buy on [S]

Government compliance (GOSI, Mudad, Muqeem, Qiwa) is the headline. After that come support responsiveness, price
clarity (almost everyone is quote-only) and parity between web and mobile.

### Arabic-first rules the best follow

- Full mirroring.
- One digit family per surface. Arabic-Indic digits are the Saudi convention and behave differently in bidi text.
- Dual Hijri/Gregorian display, including in PDFs. Use Umm al-Qura with a manual override.
- Isolate every embedded Latin run (names, IDs, IBANs, amounts) with bidi isolation.
- Give Arabic more line height, and never letter-space Arabic.
- Put the riyal symbol to the left of the number with a space (SAMA). "SAR" text is also allowed.

## 4. BASMA as built (pass C, measured [M])

| Measure | Now | Notes |
|---|---|---|
| Areas / sub-pages | 14 / 98 | CLAUDE.md still says "seven areas" (stale) |
| Destinations by role: employee, manager, HR, admin + payroll | 29, 49, 92, 95 | |
| Phone areas behind "More" | 9 of 14 | Payroll runs is 4 taps before any work |
| Approval surfaces | 3 (`requests:inbox`, `requests:centre`, `pay:approvals`) | Confirmation behaviour differs |
| Entry points to "add employee" | 5 | |
| Employee can find a colleague | No | Ctrl K returns people to HR only |
| Style layers in index.html | 14 (base, dsv2 … dsv6) | ~325k characters of CSS, 474 `!important`; `.v2-card` is restyled in 8 layers |
| index.html / modules / backend actions / tabs | 785 KB / 1.72 MB in 26 files / 447 / 120 | |
| Check in (desktop / phone) | 2 / 2 taps | Already at the leaders' level, apart from one-gesture clock-in |
| Approve from home | 2–3 taps | |
| Leave request (employee) | 2–3 taps | Better than the worst documented elsewhere (about 6) |

### Defects found (both re-checked by hand on 2026-11-17)

1. **Payroll approve-and-lock and delete fire on one tap, with no confirmation** (`js/payroll.js:348-349`). Locked
   is final by design, so this is the riskiest click in the product.
2. **"My attendance" is labelled "Monthly history" / «السجل الشهري» for every employee.** `vwHistory` is defined twice
   in the same string block (`index.html:4789` and `4793`, English `4839` and `4843`), and the later value wins.

### Defects reported by pass C, not yet re-checked

- Thirteen home callbacks return on failure with no error state, which leaves skeletons on screen (`js/home.js`).
- Forbidden or stale addresses send people home silently (`index.html:5253`).
- The joiners/leavers card targets moved pages, because `goOk` ignores `MOVED` (`js/dashboard.js:216-222`).
- The payroll run view has no URL, so a reload loses it (`js/payroll.js:269-327`).
- Company roles open on Company scope, so their own balance, payslip and check-in are one toggle away
  (`js/home.js:327`).
- The top-bar Excel copies on-screen tables locally, while report export is server-run and fingerprinted. They share
  one icon but carry different guarantees.
- The phone shows no offline or connection signal before a check-in attempt.
- Home spends space on content that isn't work: the wisdom card and "on this day" (Wikipedia).

## 5. The redesign

### 5.1 Principles (each traced to evidence)

| # | Principle | Evidence |
|---|---|---|
| P1 | Every daily task in ≤ 2 taps from home, on phone and desktop alike | Leaders' shortest paths (§2); Saudi reviews punish friction (§3) |
| P2 | One place per job: one inbox, one directory, one add-employee path, one reports centre | Wayfinding complaints about Rippling and Workday; BASMA's 3 approval screens and 5 add paths |
| P3 | Home answers "what needs me today", per role; charts live in Insights | SAP, Workday, Lattice, Deel |
| P4 | Trust is visible: punch receipts, reasons for refusals, rules beside deductions, confirm and undo on irreversible acts | Saudi review themes 1, 4, 5 |
| P5 | Arabic-first done properly: digits, Hijri, bidi isolation, bilingual print | W3C ALReq, SAMA, SAP/Oracle gaps |
| P6 | Calm change: new experience opt-in per organisation, stable URLs, then the default | UKG, Workday, Dayforce rollouts; Saudi reviews resent churn |
| P7 | One design layer; no new `!important` | 14 layers today |

### 5.2 Information architecture: 14 areas → 6 spaces + Inbox + Search

The spaces are organised by who is acting, not by lifecycle stage:

| Space | Who | Contents (folded from today's areas) |
|---|---|---|
| **Today** (home) | everyone | Role-aware action home (§5.3) |
| **Me** | everyone | My time (punch, history, shifts, open shifts), my requests and leave, my pay (payslips, loans, perks, expenses), my growth (goals, reviews, 1:1s, learning, skills), my file and devices |
| **Team** | managers | Who is in, team approvals, team calendar, 1:1s, reviews, plans, team reports |
| **People** | HR | Directory and employee record (with its lifecycle strip from hire to offboard), hiring, onboarding, offboarding, org and positions, documents and expiries, relations, policies, HSE, engagement |
| **Pay** | payroll / HR | Runs (with a URL per run), approvals, GOSI/WPS/Qiwa reconciliation, grades, retro pay, pay groups, budget, journal |
| **Insights** | HR / payroll / executive | Dashboard, reports centre (scheduled and builder as tabs of one page), Nitaqat, history, audit |
| **Settings** | admin | Company, attendance rules, roles, flows, letters, integrations, export: grouped, saved per group |
| **Inbox** (top bar, everyone) | | Every approval and task in one list, filters, decide in place, bulk approve, plus "tap again" or confirm for irreversible acts. Replaces `requests:inbox`, `requests:centre`, `pay:approvals` and the bell list |
| **Search** (`/` or Ctrl K, everyone) | | People for everyone (name, job, department, work contact; private fields stay role-gated on the server), pages, records, help |

**Targets** (measured with the same counting scripts after each phase):

| Role | Today | Target |
|---|---|---|
| Employee | 29 | ≤ 14 |
| Manager | 49 | ≤ 24 |
| HR | 92 | ≤ 50 |
| Admin + payroll | 95 | ≤ 55 |

The phone bottom bar is Today · Me · centre check-in · Inbox · (Team / People / Pay by role). No page that is used
daily may sit behind "More".

### 5.3 Role homes ("Today")

- **Employee:**
  1. The check-in card: state, the shift, a slide-to-check-in gesture, and the last punch's receipt.
  2. My requests and anything needing me.
  3. Balance and next payslip tiles.
  4. Up to 3 nudges.
- **Manager:** the employee block first (their own day), then "your team now" (in, late, off, exceptions) and team
  decisions waiting, with decide-in-place.
- **HR:** today's exceptions (punch review, missed check-outs, expiring documents, compliance due) and decisions
  waiting; a single link to Insights for the charts.
- **Payroll:** the month's run status, reconciliation blockers before the Mudad/WPS file, and approvals.
- **Executive:** four company numbers and three exceptions; everything else is in Insights.
- Company roles open on **their own block first**. The Company/Mine toggle goes.
- The wisdom and "on this day" cards move to an optional widget, off by default.
- Users may pin up to 6 shortcuts.

### 5.4 Trust features (the Saudi differentiator)

1. **Punch receipt:** time, zone, accuracy, method and a reference after every punch, kept in Me → time.
2. **Explained refusal:** the distance to the zone edge and the accuracy, then "retry" or "request an exception" with
   the reading attached. This is the Saudi market's top complaint.
3. **Connection and location banner** before the punch, not after a failure.
4. **Rule beside the number:** each late or absence deduction and each balance links to the policy clause and the
   punch rows, with an appeal button.
5. **Confirm and undo:** confirm on payroll approve, lock and delete (the defect in §4), and on request cancel and
   bulk approvals; a 10-second undo where the action can be reversed.
6. **Pre-payroll compliance check:** Qiwa/GOSI mismatches are shown before the WPS file, not as a separate screen.

### 5.5 Arabic-first details

- A per-organisation digit setting (Arabic-Indic or Latin), applied everywhere, PDFs included.
- `<bdi>` around every name, ID, IBAN and amount.
- Hijri (Umm al-Qura) beside Gregorian on letters, payslips and reports, with a manual override.
- The SAMA riyal symbol, with "ر.س / SAR" as the fallback.
- Arabic line height of at least 1.6.
- A check that fails the build if the Arabic UI contains an English remnant.

### 5.6 Assistant (when the owner adds the API key; code exists in HelpDesk.gs)

Docked as a side panel in the shell, following the maturity ladder in §2:
1. **Answer:** policies, balances, "why is my pay X".
2. **Navigate:** opens the right page with filters set.
3. **Act with confirmation:** drafts a leave request or a report, and the person confirms.

### 5.7 Design system: one layer

- Collapse base, dsv2 … dsv6 into a single `ds` layer that keeps the approved v6 "quiet luxury" look and tokens.
- Delete what no longer renders.
- **Targets:**
  - one style layer;
  - CSS ≤ 140k characters;
  - `!important` ≤ 40, for print and third-party overrides only;
  - no selector restyled in more than one layer.
- **Method:** the same as the 2026-10-22 REA design pass. Screenshot every page for each role at 1440 and 390 px
  before and after, and require no unexplained visual difference.

## 6. Phased plan (each phase deployable alone, behind the switch, with tests and before/after measures)

| Phase | Content | Size | Risk control |
|---|---|---|---|
| **0. Fix now** | Confirm on payroll approve, lock and delete; correct the "My attendance" label; error and retry states on home cards; `goOk` honours `MOVED`; a message instead of a silent redirect home; a URL for the payroll run | ~1 day | Normal deploy; tests added to `tests/payroll.js` and `tests/run.js` |
| **1. Navigation** | Six spaces, the unified Inbox, Search with a people directory for all, the new phone bottom bar; old `#area/sub` addresses keep working through `MOVED` | 3–4 days | Per-organisation switch "new navigation" (off by default); access matrix test re-run for every role |
| **2. Role homes** | §5.3 homes, pinned shortcuts, decide-in-place | 2–3 days | Same switch |
| **3. Trust features** | §5.4 items 1–4 and 6 | 3 days | Punch path tests (geo, punchtail, redteam) must stay green; deploy outside check-in peaks |
| **4. Arabic-first** | §5.5 | 2 days | Print snapshot tests for letters and payslips |
| **5. One design layer** | §5.7 | 3–4 days | Full-page screenshot diff for every role, desktop and phone |
| **6. Assistant ladder** | §5.6 | 2 days | Needs the owner's API key |
| **7. Default on** | Switch on for org 1001, then for every organisation | — | Owner's call after using it |

Phases 1–5 can run in this order without waiting on the owner. Phase 6 needs a key.

## 7. Unknowns and limits

- Most competitor evidence is search snippets. Design-system pages for Canvas, Fiori and Redwood blocked fetching, and
  admin-side Saudi reviews (Capterra, G2) returned 403. Quote any review line from its source before using it in
  marketing.
- Announced but not confirmed as shipped: Workday's Sana home (Oct 2026), Deel's June 2026 items, Lattice's sidebar
  agent.
- BASMA tap counts are derived from code, not observed on a device; Phase 1 re-measures them in a browser.
- The destination targets are design targets, not proof of better usability. A 5-person hallway test per role after
  Phase 2 is the real check.

## 8. Sources

The full per-claim reference lists (about 100 URLs) are kept with the research passes. Key sources:

- **Workday** navigation: erp.umd.edu/newsroom/new-homepage-design-coming-workday-july-6-2026; Sana:
  blog.workday.com/en-us/rising-product-announcements.html
- **SAP** home and approvals: purdue.edu/hr/sfhomepage.php; 2H 2025 release: rizing.com/blogs/sap-successfactors-h2-2025-release-overview
- **Oracle** Manager Concierge: docs.oracle.com/en/cloud/saas/readiness/hcm/25d/hcom-25d/25D-hcm-common-wn-f42016.htm
- **Rippling** search: rippling.com/blog/august-2024-product-updates
- **Personio** inbox: personio.com/about-personio/press/whats-new-with-personio-december-24
- **Deel:** deel.com/blog/whats-coming-june-2026
- **BambooHR:** bamboohr.com/product-updates/mobile-encore
- **Lattice:** lattice.com/blog/june-2026-product-updates
- **Dayforce:** dayforce.com/blog/a-new-era-of-intelligence-agility-and-convenience-what-youll-find-in-the-latest-dayforce-release
- **Implementation time:** learn.g2.com/core-hr-implementation-and-roi
- **Saudi app reviews:**
  - Jisr: apps.apple.com/sa/app/id1129820762
  - ZenHR: apps.apple.com/sa/app/id1376637090
  - Bayzat: apps.apple.com/sa/app/id1057593226
  - PalmHR: apps.apple.com/sa/app/id1517422977
  - MenaME: apps.apple.com/sa/app/id1605759540
- **Saudi vendor claims:** jisr.net/en/features; zenhr.com/en/hrms-saudi-arabia; bayzat.com/ksa/hr-software;
  landing.menaitech.com/saudi-hr-system
- **Standards:** w3.org/TR/alreq; sama.gov.sa riyal-symbol guidelines
- **Hijri gaps:** SAP KBA 3465683; Oracle community thread 833999
