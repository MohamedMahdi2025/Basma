# HR suite UI design study (2026-09-30)

**Brief.** This guides the visual redesign of the Best Gas HR PWA (Arabic-first, RTL, ~200 staff). Today's look is a dark pine frame around a cream panel, with white bordered cards, pill tabs and a ~20-item HR rail. The owner finds it unattractive.

**Sources and limits.** I read public design systems (Workday Canvas, SAP Fiori, Culture Amp Kaizen, Gusto Workbench, DGA Platforms Code), vendor redesign posts (HiBob, Lattice, Personio, BambooHR, Workday, Bayzat) and reviews (Factorial, Rippling, Jisr, ZenHR). canvas.workday.com, sap.com and Medium refused automated reads, so for those I used the vendors' GitHub repos and search snippets. Contrast ratios are computed with the WCAG 2.x formula.

**Verdict.** The leaders converge on five things: a quiet light frame, content on white, one accent colour, hierarchy from type and space rather than boxes, and search-led navigation in 7 or fewer areas. The current build breaks four of the five.

---

## 1. Information architecture

**Evidence from the market**
- **Bayzat** regrouped a "cluttered", ungrouped nav into categories and chose a side nav for its room [1].
- **HiBob** put all navigation in one side menu and gave the rest of the screen to the workspace [2].
- **Lattice** added a collapsible side nav, moved profile/company/admin to a top-end menu, and added a manager "My Team" page [3][4].
- **Workday Home** shows up to six role-based sections [5].

**Recommendation: seven areas with the same names for every role.** Each role sees a subset of the seven. Inside an area, a **scope switch** (أنا me · فريقي my team · الشركة company) changes the lens, so managers and HR get no extra nav items.

| # | Area | Employee | Manager adds | HR / payroll / admin adds |
|---|---|---|---|---|
| 1 | الرئيسية Home | Personal dashboard | Team dashboard | HR dashboard |
| 2 | الحضور Time | Check-in (geofence + Face ID), my log, shift | Team today, corrections | Shifts, zones, devices, timesheets |
| 3 | الطلبات Requests | My requests, balances, letters | **Approvals inbox** | Leave types, approval chains, delegation |
| 4 | الرواتب Pay | Payslips, certificates, advances | – | Payroll runs, WPS/Mudad, GOSI, end of service |
| 5 | الأداء Growth | Goals, reviews, 360, IDP, pulse | Team reviews, PIPs | Cycles, templates, survey builder |
| 6 | الأشخاص People | Directory, org chart, **Company** tab (policies, announcements) | Team profiles | Records, onboarding/offboarding, **Compliance** tab (Qiwa, iqama, Nitaqat, expiries) |
| 7 | التقارير Insights | – | Team reports | Reports centre, dashboards, audit |
| – | Settings (sidebar footer gear) | – | – | Roles, company, system |

Where the remaining modules go:
- **My profile:** the avatar menu and People.
- **Policy acknowledgements, surveys, onboarding checklists:** they surface as tasks on Home.
- **Compliance:** WPS and GOSI live in Pay; Qiwa and Nitaqat live in People → Compliance. One compliance card on HR Home links to both.

Top-level count per role: employee 6, manager 7, HR 7 plus Settings.

**Mobile bottom nav** (64px + safe area, 5 items max):

| Role | Items |
|---|---|
| Employee | الرئيسية · الطلبات · **Check-in** (raised 56px centre button) · الرواتب · المزيد |
| Manager | الرئيسية · الموافقات (badge) · **Check-in** · فريقي · المزيد |
| HR | الرئيسية · الموافقات · الأشخاص · الرواتب · المزيد |

"المزيد" (More) opens a sheet with the remaining areas.

## 2. App shell

**Reference patterns**
- **SAP shell bar:** logo at the start, search in the middle; notifications and the user menu at the end. The user menu never collapses into overflow [6].
- **Oracle Redwood** is search-led [7].
- **Rippling's** search returns actions as well as people [8].
- **Linear** made its sidebar quieter than the content and aligned every icon and label [9].

| Element | Spec (in RTL the sidebar sits on the right) |
|---|---|
| Sidebar | 256px expanded / 72px rail with tooltips. Cream `#F2EEE4`, no border: the surface change is the edge |
| Nav item | 36px high, 8px radius, 12px padding. 20px Phosphor Regular icon, 12px gap, label 14/500 |
| Active item | White fill + `e1` shadow. Icon switches to Phosphor Fill in accent colour. No pill, no coloured bar |
| Groups | At most two: "مساحتي" (my space) and "إدارة" (administration). Label 12/500 in text-3 |
| Top bar | 56px, inside the content column. On scroll: 85% canvas background, 12px blur, 1px hairline |
| Top bar content | Start: title or breadcrumb. Middle: search, 400×36 with a `Ctrl K` hint. End: attendance chip ("داخل الدوام · 7:58 ص"), bell, 32px avatar |
| Command palette | 640px wide, 15vh from the top, 48px input. Result groups: إجراءات (actions, e.g. "طلب إجازة"), أشخاص (people), صفحات (pages). Uses `e3` |
| Notifications | 400px popover with tabs الكل (all) / يحتاج إجراء (needs action). Approve or reject inline |
| Profile menu | Name and job title, ع/EN toggle, my profile, devices and passkeys, sign out |
| Content | Max 1280px wide, 32px padding (16px on mobile). Page header: title 24/600, one-line description, primary action at the end |

## 3. Page templates

**Home pages**
- **Employee:**
  1. Greeting with both calendar dates.
  2. Check-in hero. The only pine surface in the app: status, shift, distance to the zone, one big button.
  3. "يحتاج إجراء" (needs action) tasks.
  4. Leave and hours tiles.
  5. Last payslip and next payday.
  6. Announcements and who's out.

  BambooHR builds Home from role-filtered widgets [10], and Personio centres its Home on the user and their team [11].
- **Manager:**
  1. Approvals queue with inline ✓/✗, as in Factorial's single inbox [12].
  2. "Team today" strip of avatars.
  3. Reviews and PIP check-ins due.
  4. Team pulse score.
- **HR:**
  1. KPI row: headcount, attendance, open requests, payroll stage.
  2. Compliance card: iqamas expiring, GOSI registrations past 15 days, WPS due, undocumented Qiwa contracts.
  3. Onboarding pipeline.
  4. Audit feed.

**Employee profile.** HiBob splits the profile into categories [13]; BambooHR uses horizontal, customisable tabs [14].
- **Header:** 72px avatar, name 24/600, then title · department · city. Status chips, a facts row (manager, start date, employee no.) and actions at the end.
- **Tabs:** sticky underline tabs, 44px: نظرة عامة (overview) · الوظيفة (job) · شخصي (personal) · الراتب (pay) · الإجازات (leave) · الحضور (attendance) · الأداء (performance) · المستندات (documents) · السجل (history).
- **Hidden tabs:** tabs the viewer may not see are left out, not shown greyed.
- **Overview:** 8/4 column split.

**Lists and tables**
- **Toolbar:** search (320px), filter chips, saved views as underline tabs [11], column picker, export.
- **Rows:** 48px (40px compact). Sticky header 12/500 on the canvas colour. First cell is a 28px avatar with name and a sub-line.
- **Data:** tabular numerals aligned to the end; status shown as dot + label.
- **Actions:** selecting rows swaps in a bulk-action bar. Clicking a row opens a drawer.

**Drawers.** 480px (640px for payroll lines), sliding in from the inline end, which is the left in RTL.
- Header: title, status, close.
- Footer: sticky action buttons.
- Uses `e3` over a 30% pine scrim. On mobile it becomes a full-height bottom sheet.

**Forms and wizards**
- **Layout:** one column, max 640px, labels above, 44px inputs.
- **Validation:** on blur, shown under the field, never in a toast only.
- **Wizards:** numbered stepper with a sticky Back/Next footer, and autosaved drafts. Example, the payroll run: مراجعة (review) → تعديلات (adjustments) → اعتماد (approval) → ملف WPS (WPS file) → نشر (publish).
- **Short requests:** open in a drawer that shows the live balance after the request, and flags conflicts before submit (Gusto: "prevent errors and fail gracefully" [15]).

**Empty states.** A Phosphor Duotone icon in a 48px tinted circle, one sentence, one hint and one button. Illustrations only on first run: HiBob keeps brand shapes to login and Home [2].

## 4. Visual language

**Colour roles.** Brand green marks only what is interactive or selected. Canvas treats colour roles as semantic tokens that must pass AA [16], and Linear calmed its UI by cutting brand chroma out of the neutrals [9].

| Token | Value | Use | Contrast |
|---|---|---|---|
| `bg-canvas` | `#FAF8F3` | Content background | – |
| `bg-frame` | `#F2EEE4` | Sidebar, wells, table headers | – |
| `surface` | `#FFFFFF` | Cards, drawers, inputs | – |
| `surface-inverse` | `#1C2A1F` | Check-in hero, login, toasts | cream on it 12.9 |
| `border` | `#E4DFD3` | Hairlines (decorative) | 1.3 |
| `border-strong` | `#8F8878` | Input and checkbox outlines | 3.5 ✓ |
| `text-1` | `#17221A` | Headings, body | 16.4 white / 14.2 cream |
| `text-2` | `#4A5A4D` | Secondary text | 7.3 / 6.3 |
| `text-3` | `#5F6D63` | Captions, placeholders | 5.4 / 4.7 |
| `accent` | `#4D6D51` | Primary button, links, focus | white on it 5.8 |
| `accent-hover` | `#3F5C43` | Hover, pressed | 7.4 |
| `accent-soft` | `#E7EEE6` | Selected row, chip | accent text 4.9 |
| `success` | `#1E6B3F` on `#E6F2EA` | Present, approved | 5.7 |
| `warning` | `#8A5A00` on `#FBF1DC` | Late, pending, expiring | 5.3 |
| `danger` | `#B42318` on `#FDECEA` | Absent, rejected | 5.8 |
| `info` | `#1F5FAE` on `#E8F1FC` | Info, draft | 5.6 |
| Focus ring | 2px accent + 2px white offset | Every control | – |

**Type (Readex Pro).** Readex Pro extends Lexend, a family designed for reading fluency; the Arabic is by Nadine Chahine [17][18]. Arabic needs more leading than Latin, about 1.7 for body text [19].

| Role | Size/line | Weight |
|---|---|---|
| Display | 32/44 | 600 |
| H1 page | 24/34 | 600 |
| H2 section | 18/28 | 600 |
| H3 card | 16/24 | 600 |
| Body | 15/26 | 400 |
| Table / small | 14/22 | 400 |
| Label / button | 14/20 | 500 |
| Caption | 12/18 | 500 |
| KPI number | 28/32 | 600, `tabular-nums` |

- Load weights 400, 500 and 600 only.
- Nothing below 12px. HiBob raised its base text from 12 to 14px [2].
- No 300 weight, letter-spacing or italics on Arabic.

**Spacing.** A 4px base: `2 4 8 12 16 20 24 32 40 48 64`. Canvas uses a similar 4–80 scale [20].
- Card padding 20px.
- Gap between cards 16px.
- Gap between sections 32px.

**Radius.** xs 4 (badges) · sm 6 (chips) · md 8 (buttons, inputs, nav) · lg 12 (cards) · xl 16 (drawers, modals) · full (avatars and dots only).
- The current 16/28px radii read as a toy.
- For comparison, Canvas stops at 8px [20] and Kaizen at 16px [21].

**Elevation.** Shadows are tinted with pine, never black. Canvas defines seven depth levels [22]; four are enough here.

| Token | Value | Use |
|---|---|---|
| `e0` | none + 1px border | Cards (the default) |
| `e1` | `0 1px 2px rgba(28,42,31,.06)` | Active nav item, raised button |
| `e2` | `0 1px 3px rgba(28,42,31,.06), 0 6px 16px -4px rgba(28,42,31,.10)` | Menus, popovers |
| `e3` | `0 24px 48px -12px rgba(28,42,31,.22)` | Drawers, modals, palette |

**Icons (Phosphor)**
- **Sizes:** 20px in nav and buttons, 16px inline, 24px in the mobile bar.
- **Weights:** Regular by default, Fill for the active item, Duotone for empty states only.
- **Rules:** use no other icon set. A `.dir` class mirrors directional icons (§6).

**Data viz**
- **Categorical:** keep `#2E7D4F` (present / on target), `#C98500` (late), `#2a78d6` (comparison), and add `#A39B88` for baseline.
- **Sequential:** a ramp from `#E7EEE6` to `#1E6B3F`.
- **Contrast:** `#C98500` (3.1) and `#2a78d6` (4.4) are fine for chart marks (3:1 needed) but not for small text, so labels use the warning and info foreground colours.
- **Style:** one baseline, no gridline clutter.

**Motion**
- **Durations:** 120ms hover and press, 200ms tabs and popovers, 280ms drawers.
- **Easing:** enter with `cubic-bezier(.2,.8,.2,1)`, exit with `cubic-bezier(.4,0,1,1)`.
- **Loading:** skeletons, not spinners.
- **Accessibility:** respect `prefers-reduced-motion`.
- **Celebration:** one only, a successful check-in.

## 5. What reads as premium, and what doesn't

**Do**
1. **Quiet chrome, loud content.** The frame is one step darker than the canvas and never strongly coloured. Linear dimmed its sidebar [9]; HiBob replaced its multi-colour menu with one colour [2].
2. **Hierarchy through type and whitespace.** Use a heading and 32px of space instead of another card. Redwood is praised as "less cluttered" thanks to whitespace and progressive disclosure [23].
3. **Strict alignment.** Icons, labels and table cells share one start edge [9].
4. **Tabular numerals** wherever money, hours or days appear.
5. **Real faces.** Avatars in lists and approvals; Factorial's staff photos are much of its warmth [12].
6. **Brand once per screen.** HiBob limits customer branding to a Home banner [2]; ours is the pine check-in hero.
7. **Search that also runs actions** [7][8].
8. **Confident density:** rows of 40–48px.
9. **Warm neutrals** derived from cream and pine instead of stock greys.

**Avoid (several are in the current build)**
- A dark frame around a light panel: a box inside a box that wastes 24px on every side.
- Pill tabs everywhere. Use underline tabs, and segmented controls only for 2–3 views.
- A flat 20-item rail [1].
- Gradient or glow KPI cards.
- Border, shadow and tint on the same card: pick one.
- Count badges on things that need no action.
- Modals for long forms.
- Icon-only nav without tooltips.
- Eastern and Western digits mixed on one screen.
- 12px body text.

## 6. RTL specifics

- **Logical CSS only.** Use `margin-inline-*`, `inset-inline-*` and `dir` on `<html>`, so one attribute flips the shell.
- **Mirror:** layout, drawer origin, chevrons and arrows, send, breadcrumbs, steppers, progress bars, sliders, linear timelines. Material: linear time runs right-to-left [24].
- **Do not mirror:** clocks, refresh and spinners, the check mark, the search glass, media controls, logos, phone numbers [24][25].
- **Charts:** y-axis on the right, legend at the start, time series running right-to-left.
- **Numerals:** Western digits for all data, matching IDs, IBANs and the government portals.
  - `Intl` with `ar-SA` returns Arabic-Indic digits by default (٤٬٥٠٠). Always pass `-u-nu-latn` (gives 4,500.00).
- **Currency:** the new riyal sign, U+20C1 [26].
  - It was approved in February 2025 and is in Unicode 17.0, but few fonts have it yet, so ship it as SVG with "ر.س" as the fallback.
  - It goes after the amount.
- **Mixed direction:** wrap email, IBAN, iqama and employee numbers, English names and `+966 5x xxx xxxx` in `<bdi>` or `dir="ltr"` with `unicode-bidi: isolate`.
  - Inputs for these fields get `dir="ltr"` but stay right-aligned.
- **Dates:** Gregorian first (payroll, Mudad and contracts use it), Hijri second in text-3.
  - Example: "الأربعاء، 30 سبتمبر 2026 · 19 ربيع الآخر 1448 هـ".
  - For Hijri, use `islamic-umalqura`, the Saudi civil calendar and the ar-SA default [27].
  - The date picker shows a small Hijri day in each cell.
  - The week starts Sunday, and Friday–Saturday are shaded.
  - Times are 12-hour with ص/م.
- **Text:** start-aligned, never centred paragraphs. Icons sit at the inline start. Underline offset 3px so it clears descenders.
- **National reference:** the DGA Platforms Code is Saudi Arabia's open-source, RTL-first design system, published as Figma [28][29]. Use it to sanity-check form and table conventions, not as our visual identity.

---

## Sources

1. Bayzat Design, "Redesigning Bayzat's Navigation" (read via search summary) – https://medium.com/bayzat-design/redesigning-the-bayzat-navigation-871aee70b88a
2. HiBob, "The Great Bob Makeover" – https://www.hibob.com/blog/bob-design-makeover-enhancing-ux-and-ui/
3. Lattice, October 2025 product updates – https://lattice.com/blog/october-2025-product-updates
4. Lattice, "Unveiling Lattice's Elevated Design" – https://lattice.com/blog/unveiling-lattices-elevated-design
5. Brock University, "Workday redesign personalizes experience" – https://brocku.ca/brock-news/2022/09/workday-redesign-personalizes-experience-improves-search/
6. SAP Fiori Fundamentals, Shellbar – https://fundamenta-temp.netlify.app/components/shellbar.html ; SAP Side Navigation – https://www.sap.com/design-system/fiori-design-web/v1-136/ui-elements/side-navigation
7. Chetu, "Oracle Redwood UX" – https://www.chetu.com/blogs/technical-perspectives/oracle-redwood-enterprise-ux-oracle-fusion-cloud.php
8. Workwize, "Rippling vs Workday" – https://www.goworkwize.com/blog/rippling-vs-workday
9. Linear, "How we redesigned the Linear UI (part II)" – https://linear.app/now/how-we-redesigned-the-linear-ui
10. BambooHR, "Insights Dashboard and Homepage Redesign" – https://www.bamboohr.com/product-updates/introducing-insights-dashboard-and-a-redesigned-home
11. Personio, "A reimagined, redesigned Personio" – https://www.personio.com/about-personio/press/personio-redesign/
12. TechRadar, Factorial review – https://www.techradar.com/pro/factorial-hr-software-review ; Factorial F0 – https://github.com/factorialco/f0
13. HiBob Help, "Update an employee profile" – https://help.hibob.com/hc/en-us/articles/4409792452113-Update-an-employee-profile
14. BambooHR, "Custom Tab Builder" – https://www.bamboohr.com/product-updates/custom-tab-builder
15. Gusto Experience Principles – https://docs.gusto.com/app-integrations/docs/gusto-experience-principles
16. Workday Canvas, Color Roles – https://canvas.workday.com/guidelines/color/color-roles
17. Readex Pro repository – https://github.com/ThomasJockin/readexpro
18. Material Design, "The Design of Readex Pro" – https://m3.material.io/blog/readex-pro-legibility-arabic-type-design
19. LearnType, "Arabic Font Readability" – https://learntype.app/blog/arabic-font-readability-size-line-height-weight-and-diacritics-tested
20. Workday Canvas Kit tokens – https://github.com/Workday/canvas-kit/blob/master/modules/react/tokens/README.md
21. Culture Amp Kaizen tokens – https://github.com/cultureamp/kaizen-design-system/tree/main/packages/design-tokens ; summary https://www.ui-skills.com/design-md/culture-amp
22. Workday Canvas, Depth – https://canvas.workday.com/styles/tokens/depth
23. Houseblend, "NetSuite Redwood Experience" – https://www.houseblend.io/articles/netsuite-redwood-experience-interface-evolution
24. Material Design, Bidirectionality – https://m1.material.io/usability/bidirectionality.html ; https://m3.material.io/foundations/layout/bidirectionality-rtl
25. Material Design 2, Bidirectionality – https://m2.material.io/design/usability/bidirectionality.html
26. Wikipedia, "Saudi riyal sign" – https://en.wikipedia.org/wiki/Saudi_riyal_sign
27. A. Elq, "Date in JavaScript: Arabic and Hijri Calendars" – https://medium.com/@ahmelq/date-in-javascript-a-deep-dive-into-arabic-and-hijri-calendars-localization-c632e89b79a2
28. SPA, "DGA Launches Platforms Code" – https://www.spa.gov.sa/en/N2209319
29. DGA National Design System – https://oss.dga.gov.sa/en/products/dga-ac319-national-design-system ; Figma – https://www.figma.com/community/file/1392264328585493958/components-library-platforms-code

Also consulted: Jisr (https://www.jisr.net/en/features), ZenHR ESS/MSS (https://blog.zenhr.com/en/empowering-your-workforce-with-zenhrs-employee-manager-self-service-ess-mss), Gusto Workbench (https://designsystems.surf/design-systems/gusto), Deel tokens summary (https://www.designmd.co/d/deel-com), SAP Horizon (https://www.mindsetconsulting.com/horizon-the-new-sap-fiori-theme/).
