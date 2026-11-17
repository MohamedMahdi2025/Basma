# HRIS experience benchmark for the BASMA redesign (public evidence, checked 17 Nov 2026)

**Evidence grades.** **[F]** = page fetched and read. **[S]** = search-result snippet only (page not opened, or it blocked fetching). "URL not pinned" = the claim surfaced in search results but I could not tie it to one specific page. University and employer job aids are customer documentation of a vendor UI, so they are tenant-specific. Anything without a reference is marked **unverified**. No click counts were inferred from memory of any UI.

## 1. Product × dimension

### 1a. Navigation, home, inbox, search

| Product | Navigation model | Home (employee / manager) | Approvals / tasks | Global search |
|---|---|---|---|---|
| Workday | Always-visible left sidebar on every page; hovering an icon lists its apps; Saved shortcuts at the bottom (customer notice, Jul 2026) [W1][F]. Earlier 2025 step: app icons moved from the home page into a global navigation panel [W2][S] | Search bar centred on home [W1][F]; Quick Actions buttons at the top replaced Quick Tasks (2025R2) [W3][S]. Sana announced Oct 2026 as the home screen, combining tasks, decisions, meetings and agent activity; no general-availability date given [W4][F][W5][S]. Manager home: unverified | Inbox moved to My Tasks in the header (2025, campus notices; URL not pinned) [S] | Natural-language search with a best-match box based on the user's frequent items [W1][F] |
| SAP SuccessFactors | Top menu bar with a Home drop-down for modules, a search box and a to-do icon [S1][F] | Quick Action tiles at the top, Approvals below them, then organisational updates; a For You Today section for items due within 30 days (position not stated); sections are role-based and Approvals hides when empty [S1][F]. Up to 16 admin-chosen quick actions (URL not pinned) [S]. 2H 2025 restyled the home page to match the new Full Profile [S4][F] | Approvals section on home: approve inline or open the detail; View All leads to a workflow-requests list for sorting and filtering; delegation is a quick action [S1][F] | Search box in the header [S1][F]; scope unverified |
| Oracle HCM (Redwood) | Hub-and-spoke: home tabs Me / My Team / My Client Groups, each holding quick actions (third-party write-up; URL not pinned) [S] | Newsfeed home with Things to Finish cards [O3][S]; managers get Team Activity Center from the My Team tab [O2][S] | Things to Finish cards carry Approve/Reject buttons; a separate BPM worklist also exists [O3][S] | Ask Oracle (25D) appears in community posts; behaviour unverified [O3][S] |
| UKG Pro | Redesigned menu grouping tasks consistently across roles; opt-in AI-guided experience, to become default later in 2026 [U1][U2][S] | Home redesign scheduled May 2026 at one customer [U2][S]; contents unverified | Unified My Inbox on mobile: notifications plus action items, approve/decline in place [U3][S] | Bryte Search & Navigate matches a question to a navigation path but does not complete the action; mobile first [U2][S] |
| Dayforce | Dayforce Hub widget home; third party says customers were expected on Hub by end-2025 [D1][S]. Nav structure unverified | Hub widgets including AI Assistant [D1][S]; manager Workforce Insights dashboard shows who is in, off or late and exceptions needing attention (Dec 2024) [D2][F] | Unverified | Unverified |
| ADP Lyric / WFN | Intent-led: no separate portals; a plain-language request assembles a page of related tasks (analyst account, Sep 2024) [A1][F]. Workforce Now navigation: unverified | Role-tailored dashboards (payroll, tax); nudges for pending tasks [A1][F] | Unverified | The plain-language request box doubles as search [A1][F] |
| Rippling | App-suite shell, search-first [R1][F]; left-rail detail unverified | Unverified | Policy-based approvals shared across apps [R4][S]; no dedicated inbox found | System-wide bar opened with the / key: people, saved reports, candidates (Aug 2024) [R1][F]; help articles added Jun 2025 [R2][S] |
| HiBob | In-app nav not described publicly: unverified | Social feed: shoutouts, kudos, birthdays, who is in/out/remote, quick links [H1][F] | Workflow task lists with staged approvals and reminders [H1][F] | People Directory, org chart, Club View [H1][F] |
| Personio | Assistant sits in the main/left navigation (sources differ on exact spot) [P3][S]; a new sidebar was in user testing [P6][S]. 2024 redesign detail unverified | Dashboard with a Tasks widget and an Inbox widget [P1][S] | Central Inbox (Nov 2024): tasks, approvals, notifications; act from the home widget or a full-screen view; sort, filter, bulk approve [P1][P2][S] | Unverified |
| Deel | Admin: persistent collapsible left sidebar; workers: two-level profile nav (announced in a what's-coming post for 10 Jun 2026; shipping not confirmed) [De2][F] | Customisable widgets (Deel AI, recent payments, compliance) [De1][F]; For You Today feed, going native on mobile [De2][F] | Mobile approvals for clients [De1][F]; amount-based routing and automatic substitute approver [De2][F] | Global search over pages, apps, people (Dec 2024) [De3][S] |
| BambooHR | Top bar moved to the left side (2024) [B1][F] | Mobile Home: For You section (tasks, announcements, celebrations, surveys) plus My Time widget [B2][F]. Web home: unverified | Inbox on web and mobile (URL not pinned) [S] | Unverified |
| Gusto | Unverified | SMB home unverified; accountant dashboard shows clients and work-to-do [G4][S] | Gus proposes approvals or changes and asks before acting [G1][S] | Unverified |
| Factorial | In-app nav unverified | Launch page depicts a greeting, a prompt box and suggested prompts for One; not confirmed as the live app home [F1][F] | Inbox splits notifications from actions; filters by module, action, status, due date; side-panel decisions; bulk approve/assign/discard [F1][F] | Inbox is searchable [F1][F]; global search unverified |
| Lattice | Left nav inside Reviews lists a person's review tasks with completion ticks [L4][S] | Home (Jun 2026): upcoming 1:1s, open tasks, timely updates; managers generate a 1:1 brief [L1][F] | Open tasks on Home [L1][F] | Unverified |

### 1b. AI, mobile, design system, time-to-value

| Product | AI assistant pattern | Mobile | Design-system traits | Onboarding-to-value |
|---|---|---|---|---|
| Workday | Assistant via a header chat icon (URL not pinned) [S] → Sana conversational front door orchestrating agents, also reachable from Teams, Slack and other AI clients (announced Oct 2026) [W4][F] | Check in/out and breaks in the app [W7][S]; features gated per tenant | Canvas (public site; fetch blocked): Roboto, 12 type styles, 4px baseline, three token tiers (base/system/brand), rem units [W6][S]. Density guidance: unverified | 3–7+ months, grouped enterprise figure [X1][F] |
| SAP SF | Joule for navigation and lookup [S6][S]; Explain My Pay in natural language (2H 2025) [S4][F] | Unverified | Fiori principles: role-based, delightful, coherent, simple, adaptive [S5][S]; dedicated HCM quick-action tile guidance [S7][S]. Horizon and cozy/compact density: unverified (fetch blocked) | 3–7+ months [X1][F] |
| Oracle | Manager Concierge: one conversational entry point over four scoped My Team agents for leave, compensation, talent and employment (25C) [O1][F] | Unverified | Redwood: official site returned no content; about 95% of self-service pages on Redwood by 24A per a partner blog [O4][S] | Unverified |
| UKG Pro | Bryte: conversational search that navigates only [U2][S] | Unified inbox; Bryte reached mobile before web [U2][U3][S] | No public design system found | 3–7+ months [X1][F] |
| Dayforce | AI Assistant (renamed from Co-Pilot, Jul 2025) opens as a side panel from a Hub widget, web only [D1][S]; first agent files time off from natural language [D2][F] | AI Assistant added Jun 2025 [D3][S]; shift marketplace; clock with badge, biometric or face [D2][F] | No public design system found | Unverified |
| ADP | ADP Assist chat for employees, managers and practitioners [A2][S] | Unverified | No public design system found | RUN: 0.9 months; Lyric/WFN unverified [X1][F] |
| Rippling | AI proposes; every action needs explicit human confirmation; admin data-permission controls [R4][S] | Persistent bottom bar: search, home, profile [R1][F]; approvals and expenses (Aug 2025) [R3][S] | No public design system found | 1.5 months [X1][F] |
| HiBob | Bob AI: Companion, Agents, MCP, Studio [H1][F]; admin on/off switch per HiBob FAQ (URL not pinned) [S] | Apps exist; detail unverified | No public design system found | 2.3 months [X1][F] |
| Personio | Assistant (beta Apr 2025): leave balance and payslip questions [P3][S] | Home shows open tasks and frequent actions; clock in/out; absence requests [P5][S] | No public design system found | Unverified |
| Deel | Deel AI Q&A [De3][S]; agentic workflows with human approval steps; AI fills request forms from plain language (announced Jun 2026) [De2][F] | Vendor claims full feature parity; biometrics; offline basics [De1][F]; native time-off rebuild announced [De2][F] | Dark mode [De1][F]; no public design system found | 0.7 months [X1][F] |
| BambooHR | Ask BambooHR button, top-right on web and mobile (URL not pinned) [S]; chat history on mobile [B3][S] | iOS Encore: For You, More menu, Liquid Glass; Android pending [B2][F] | 2024 refresh: rounded corners, new type, left nav [B4][S]; no public design system found | 1.7 months [X1][F] |
| Gusto | Gus acts only after owner approval [G1][S]; payroll runnable from ChatGPT for select customers [G4][S] | Pay tab → Run [G2][S] | Internal system named Workbench (job post only) [G5][S] | 0.9 months [X1][F] |
| Factorial | One: agent for reports, surveys, research [F1][F] | One is read-only on mobile [F2][S]; slide-to-clock home widget, works offline [F3][S] | No public design system found | Unverified |
| Lattice | Agent panel on Home with built-in prompts [L1][F]; moving to a right sidebar [L2][S]; answers name their source areas [L3][S] | Unverified | No public design system found | Unverified |

## 2. Shared patterns

1. **Persistent left rail replaces top bars and app grids.** Workday [W1], BambooHR [B1], Deel admin (announced) [De2]; Lattice inside Reviews [L4]; Personio testing a new sidebar [P6].
2. **Home is an action surface, not a chart dashboard**: quick actions first, then what needs me. SAP [S1], Workday [W3], Lattice [L1], BambooHR mobile [B2], Deel [De2]. SAP alone documents role-conditional sections that hide when empty [S1] (single-vendor evidence).
3. **One inbox for approvals and tasks, with notifications separated.** Personio [P1], Factorial [F1], Workday My Tasks [S], UKG [U3]. Caveat from support and community sources: Oracle customers report notifications reaching the BPM worklist but not the bell or Things to Finish [O3][S]; SAP fixes the home section order [S2][S] and shows only 20 items per list [S3][S].
4. **Decide in place**: approve or reject on the card or in a side panel, without opening the record. SAP [S1], Oracle [O3], Factorial [F1], UKG [U3].
5. **Bulk approve with filters.** Personio [P2], Factorial [F1] (two products).
6. **Search as navigation**: one bar for people, pages, reports and help, with a shortcut. Rippling [R1][R2], Deel [De3], Workday [W1], UKG [U2].
7. **Assistant docked in the shell** (header button or side panel), so users keep their context. Dayforce [D1], Lattice [L2], BambooHR [S], Workday [S], Personio [P3].
8. **Assistant maturity ladder: answer → navigate → act, with human confirmation.** Navigate-only: UKG [U2]. Act with confirmation: Rippling [R4], Gusto [G1], Dayforce [D2], Deel [De2].
9. **Conversational front door.** Workday Sana (announced) [W4], ADP Lyric [A1]; Factorial depicts one on its launch page [F1].
10. **Manager-specific surface over my-team data.** Oracle Manager Concierge is the only agent [O1]; Lattice offers a generated 1:1 brief [L1] and Dayforce a who-is-in/exceptions dashboard [D2].
11. **Mobile For You feed.** BambooHR [B2], Deel [De2]; Personio's mobile home shows open tasks and frequent actions [P5].
12. **Persistent mobile bottom bar with search.** Rippling only [R1] (single-vendor evidence).
13. **User-pinned shortcuts and widgets.** Workday Saved [W1], SAP Favorites tile [S1], Deel widgets [De1].
14. **Plain-language pay explanation.** SAP [S4]; Personio answers payslip questions [P3].
15. **New UX shipped opt-in, then made default.** UKG [U1]; Workday rollouts dated per tenant [W1]; Dayforce Hub migration [D1].

### Anti-patterns (review-backed)

1. **Too many clicks and nested menus for simple self-service** such as PTO or tax forms: Workday HCM, G2 review themes [W10][S].
2. **Breadth without wayfinding**: a steep learning curve and trouble locating documents and settings are among Rippling's most-cited G2 dislikes [R5][S].
3. **Unfriendly or dated employee-facing UI**: user-unfriendliness is a listed G2 con for ADP Workforce Now and UKG Pro, and a Capterra reviewer wants a cleaner employee side in UKG Pro [U5][S].
4. **Limited customization and thin reporting**: limited customization is a top G2 con for Personio [P7][S] and a cited Rippling dislike, where missing reporting features is the largest complaint [R5][S].
5. **Web/mobile capability gaps**: Capterra reviewers cite limited HiBob mobile functionality [H2][S]. Vendor docs show the same gap: Dayforce AI widget is web-only [D1][S], Factorial One is read-only on mobile [F2][S], UKG Bryte was mobile-only at one customer [U2][S].

## 3. Top-task benchmarks

Vendors almost never publish click counts. The counts below are my tally of the steps each cited source lists, not vendor-stated figures; everything else is unverified.

| Task | Documented evidence |
|---|---|
| Check in | Workday web, one county tenant: tile → Time → Check In → pick hours type, about 4 actions [W9][S]. Factorial mobile: one slide gesture on the home widget [F3][S]. Dayforce, Personio: supported, steps not published [D2][P5]. |
| Request leave | Workday mobile, college job aid: open Time Off → Request Time Off → select days → type → review → Submit, about 6 steps [W8][S]. SAP: a home quick-action tile starts it; count unverified [S1][F]. Dayforce: natural-language request through the agent [D2][F]. |
| Approve | SAP: approve directly from the home Approvals section [S1][F]. Personio: act from the home Inbox widget; bulk approve [P1][P2][S]. Factorial: bulk approve in one click (vendor claim) [F1][F]. |
| View payslip | SAP at Purdue: home → organisational updates → Additional Actions → pay statement, 2–3 actions [S1][F]. Deel: in the worker app; steps unverified [De1][F]. |
| Find a colleague | Rippling: / then type a name [R1][F]. Workday: centred home search [W1][F]. HiBob: People Directory [H1][F]. Counts unverified. |
| Run payroll | Gusto: sign in → Pay → choose period → Run; mobile Pay tab → Run [G2][S]; vendor says a few clicks, with no number [G3][S]. Others: unverified. |

**Reading for BASMA (indicative only, given the sparse evidence):** the shortest documented paths are one gesture to clock in, one action to approve from home, and one keystroke to open search. The longest documented path is about six steps to request leave on mobile.

## References

- [W1] https://erp.umd.edu/newsroom/new-homepage-design-coming-workday-july-6-2026 (1 Jul 2026)
- [W2] https://kb.lynn.edu/x/4gbqC (fetch blocked)
- [W3] https://www.unlv.edu/announcement/university-notifications/workday-release-2025-r2-update (Oct 2025)
- [W4] https://blog.workday.com/en-us/rising-product-announcements.html (Oct 2026)
- [W5] https://cio.com/article/4234407/workday-launches-sana-based-ui-autopilot-agents-as-it-deepens-its-focus-on-ai.html
- [W6] https://canvas.workday.com/tokens/type ; https://canvas.workday.com/styles/tokens/overview (fetch blocked)
- [W7] https://www.workday.com/en-us/products/platform-product-extensions/workday-mobile.html
- [W8] https://lclark.edu/live/files/20195-gettingstarted-iphoneandroid-ja-25pdf
- [W9] https://clerkconnect.maricopa.gov/home/showpublisheddocument/2609/637986634027800000
- [W10] https://www.g2.com/products/workday-hcm/reviews
- [S1] https://www.purdue.edu/hr/sfhomepage.php (year not stated)
- [S2] https://userapps.support.sap.com/sap/support/knowledge/en/3363489
- [S3] https://userapps.support.sap.com/sap/support/knowledge/en/3632226
- [S4] https://www.rizing.com/blogs/sap-successfactors-h2-2025-release-overview (partner, 2H 2025)
- [S5] https://www.sap.com/design-system/fiori-design-web/v1-96/discover/sap-design-system/vision-and-mission/design-principles
- [S6] https://learning.sap.com/courses/sap-successfactors-employee-central-core-administration/utilizing-joule-in-sap-successfactors
- [S7] https://www.sap.com/design-system/hcm/components/cards/quick-action-tiles/usage (Nov 2022)
- [O1] https://docs.oracle.com/en/cloud/saas/readiness/hcm/25d/hcom-25d/25D-hcm-common-wn-f42016.htm (URL says 25D; page text says 25C)
- [O2] https://docs.oracle.com/en/cloud/saas/readiness/hcm/24b/hure-24b/24B-hr-wn-f31758.htm
- [O3] https://community.oracle.com/customerconnect/discussions/tagged/redwood (thread titles only, no official answers)
- [O4] https://www.chetu.com/blogs/technical-perspectives/oracle-redwood-enterprise-ux-oracle-fusion-cloud.php
- [U1] https://www.ukg.com/company/newsroom/ukg-debuts-ai-guided-user-experience (30 Oct 2025; fetch blocked)
- [U2] https://controller.ucsf.edu/news/202605/ukg-new-experience-features-added-mytime-mobile-app (May 2026)
- [U3] https://preview.web.ukg.com/email/FY25/us/CUSTOMERCOMMS/Q1-25-EML-CC-Time-Management-unified-inbox-for-mobile.html
- [U5] https://www.g2.com/compare/ukg-pro-vs-adp-workforce-now-vs-paycor-vs-dayforce ; https://www.capterra.com/p/480/UKG-Pro/reviews/?page=9
- [D1] https://help.dayforce.com/r/documents/Advanced-Experience-Hub-Administrator-Guide/AI-Assistant ; Hub deadline from https://redpilllabs.squarespace.com/blog/latest-updates-to-dayforce-co-pilot
- [D2] https://www.dayforce.com/blog/a-new-era-of-intelligence-agility-and-convenience-what-youll-find-in-the-latest-dayforce-release (3 Dec 2024)
- [D3] https://apps.apple.com/gd/app/dayforce/id456073226
- [A1] https://joshbersin.com/2024/09/adp-lyric-hcm-the-next-gen-hr-platform-many-have-waited-for/ (24 Sep 2024)
- [A2] https://www.adp.com/what-we-offer/ai-solutions/ai-capabilities.md
- [R1] https://www.rippling.com/blog/august-2024-product-updates (updated 30 Sep 2024)
- [R2] https://www.rippling.com/blog/june-2025-product-updates
- [R3] https://www-j.rippling.com/blog/august-2025-product-updates (as surfaced; canonical URL not checked)
- [R4] https://www.rippling.com/platform/ai ; https://rippling.com/en-GB
- [R5] https://www.g2.com/products/rippling
- [H1] https://www.hibob.com/features/core-hr-b/ (© 2026)
- [H2] https://www.capterra.com/p/156106/Hibob/reviews/4822548/
- [P1] https://personio.com/blog/redesigned-inbox (12 Nov 2024; fetch blocked)
- [P2] https://www.personio.com/about-personio/press/whats-new-with-personio-december-24
- [P3] https://support.personio.de/hc/en-us/articles/32056339085725
- [P5] https://personio.com/product/mobile ; https://apps.apple.com/om/app/personio/id1470197212
- [P6] https://community.personio.com/product-testing-74/user-test-interview-what-do-you-think-of-our-new-sidebar-fully-booked-600
- [P7] https://www.g2.com/compare/bamboohr-vs-personio
- [De1] https://www.deel.com/blog/new-deel-mobile-app/ (30 Apr 2025)
- [De2] https://www.deel.com/blog/whats-coming-june-2026 (3 Jun 2026)
- [De3] https://www.deel.com/blog/new-at-deel-dec2024
- [B1] https://www.bamboohr.com/product-updates/new-user-interface
- [B2] https://www.bamboohr.com/product-updates/mobile-encore (undated)
- [B3] https://www.bamboohr.com/product-updates/ask-bamboohr-ai-assistant-on-mobile
- [B4] https://www.bamboohr.com/resources/ebooks/behind-the-scenes-ui-2024
- [G1] https://gusto.com/company-news/gus-ai-assistant (fetch blocked)
- [G2] https://support.gusto.com/article/186733245100000/Processing-payroll-overview-for-admins (fetch blocked)
- [G3] https://gusto.com/
- [G4] https://www.cpapracticeadvisor.com/payroll/news/21303172/gusto-launches-payroll-inside-chatgpt ; https://gusto.com/company-news/fall-showcase-2026
- [G5] https://hotfix.jobs/jobs/sr-staff-frontend-engineer-design-systems-at-gusto-761d0d7f-d8cf-4105-a000-c90605cd1f4a
- [F1] https://factorial.com/event/ceo-product-launches-ai-edition-2025 (2025; marketing launch page)
- [F2] https://help.factorialhr.com/en_US/one/one-on-mobile
- [F3] https://help.factorialhr.com/en_US/how-to-clock-in-and-out-offline-mobile-app
- [L1] https://lattice.com/blog/june-2026-product-updates (30 Jun 2026)
- [L2] https://lattice.com/blog/lattice-spring-summer-2026-product-release
- [L3] https://lattice.com/blog/october-2025-product-updates
- [L4] https://www.lattice.com/product-updates
- [X1] https://learn.g2.com/core-hr-implementation-and-roi (29 Jul 2026; G2 review averages)

## Gaps and limits

- **Not verified from public sources:** Rippling, Gusto, HiBob and Factorial web home and in-app navigation; manager-home detail for most products; setup wizards; any vendor-published click counts.
- **Design systems are the weakest dimension.** The official Canvas, Fiori (content density) and Redwood pages all blocked or returned nothing on fetch, so Horizon and Redwood density, colour and type are unverified, and Canvas rests on search snippets. No public design system was found for the other eleven products.
- **Most references are [S].** Only 16 pages were fetched and read (W1, W4, S1, S4, O1, D2, A1, R1, H1, De1, De2, B1, B2, F1, L1, X1). About nine fetches were blocked (403/429/empty); the remaining [S] pages were never opened. All G2 and Capterra items are snippet-level and should be opened by hand before being quoted in the study.
- **Announced, not confirmed shipped:** Workday Sana home (Oct 2026), Deel June 2026 items, Lattice right-sidebar agent.
- A working copy of an earlier draft is at C:\Users\User\AppData\Local\Temp\claude\df0a32c75542766c\8c562c27-9e80-4416-9566-11852d3a9e0b\scratchpad\hris-ux-benchmark.md; this message supersedes it.
