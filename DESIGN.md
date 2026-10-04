# Design System: Best Gas HR (نظام الموارد البشرية)

Single source of truth for every screen. It was written with the stitch and stitch-skill design skills (and ant and
ui-designer for component discipline) on top of the v2 direction the owner approved on 2026-09-30
(docs/research/2026-09-30-hr-ui-design-study.md). The tokens live in `index.html` `<style id="dsv2">`. Modules use
the tokens and never raw colours.

## 0. Context and goals
- Who uses it: field employees on phones (check-in, requests, payslips), managers (approvals, their team), HR, payroll
  and executives on laptops (people, pay, compliance, reports).
- Arabic first, right to left, with English as the second language. Western digits. Dates are Gregorian first,
  then Hijri.
- Goal: a calm, trustworthy work tool. The day's most important fact must be readable in two seconds, and every
  decision must be two clicks from the bell.

## 1. Visual theme and atmosphere
A quiet, high-contrast enterprise frame in warm paper and cream, with one confident green. The atmosphere is a
well-run Saudi head office at 8 am: ordered, bright, nothing shouting. Hierarchy comes from type weight, spacing and
one accent, not from colour floods or shadows.
- Density: **Daily App Balanced (6)**. Comfortable on phones; data screens tighten to tables with dividers.
- Variance: **Offset, purposeful (4)**. Asymmetric splits only where meaning differs (hero gauge beside facts,
  radar beside the punch sheet); data grids stay regular.
- Motion: **Fluid CSS, restrained (4)**. Motion explains change (a drawer arriving, a needle settling, a list
  cascading in) and never decorates. One perpetual loop is allowed: the live "in" dot.
- The one pine moment: dark pine (#1C2A1F) belongs only to check-in (radar, punch card, the centre button) and
  sign-in. Everywhere else is light.

## 2. Colour palette and roles
| Name | Hex | Role |
|---|---|---|
| Warm Paper | #FAF8F3 | Page canvas behind every area |
| Cream Frame | #F2EEE4 | Sidebar and logo ground (the logo PNG has this exact background) |
| Pure Surface | #FFFFFF | Cards, tables, panels, inputs |
| Quiet Well | #F6F3EC | Inset areas, segmented-control track, neutral chips |
| Deep Ink | #17221A | Primary text (never pure black) |
| Slate Moss | #4A5A4D | Secondary text, labels |
| Muted Moss | #5F6D63 | Metadata, hints (4.8:1 on paper) |
| Hairline | #E4DFD3 | 1px structural borders |
| Soft Divider | #EEEAE0 | Row dividers inside surfaces |
| Input Edge | #8F8878 | Field borders (3:1 non-text contrast) |
| **Best Gas Green** | #4D6D51 | THE accent: primary buttons, selection, focus ring, active nav |
| Green Hover | #3F5C43 | Hover and pressed state of the accent |
| Green Tint | #E7EFE6 | Selected backgrounds, avatars, icon wells |
| Check-in Pine | #1C2A1F | Check-in and sign-in only |
| Status ok | #1E6B3F on #E6F2EA | Present, approved, paid, compliant |
| Status warn | #8A5A00 on #FBF1DC | Late, pending, due soon |
| Status bad | #B42318 on #FDECEA | Absent, rejected, overdue, errors |
| Status info | #1F5FAE on #E8F1FC | Leave, holiday, information |
| Chart series | #2E7D4F / #C98500 / #2a78d6 | Data marks only (validated with the dataviz validator; the brand green fails the chroma floor) |

Rules: one accent only. Status colours always come with a word or an icon, never colour alone. No gradients on
surfaces or text. No purple or neon. The old tokens `--pine`, `--red` and `--amber` are remapped inside the shell
(section 9), so module code that still names them gets v2 colours.

## 3. Typography
- **Readex Pro** (variable, with the HEXP width axis) for everything: it is the only premium sans here with true
  Arabic and Latin. Geist, Satoshi and Inter have no Arabic glyphs, so they are not used.
- Display (page titles, the big number on a card): weight 600, HEXP 35-70, tight leading (1.2-1.25), `text-wrap:
  balance`.
- Body: 14.5-15px, leading 1.55, max 65ch for prose (policies, job descriptions).
- Numbers: `font-variant-numeric: tabular-nums` everywhere numbers line up (tables, KPIs, times, money). Reference
  numbers (AD-2026-00001) are wrapped in `<bdi>` so they read left to right inside Arabic.
- Scale (px): 12 meta, 13 labels, 14.5 body, 16 card titles, 19 drawer titles, 23-28 page titles, 30-38 hero
  numbers.
- Banned: serif fonts in the app, all-caps Arabic tricks, letter-spaced Arabic (it breaks joining), more than two
  weights on one card.

## 4. Component stylings (anatomy and states)
Every interactive element has these states: default, hover, focus-visible (2px green ring with a 2px offset),
active (a tactile 1px press), disabled (45% opacity, no pointer), and loading where it applies.
- **Buttons.** 40px tall (36 small, 44 minimum on touch). Radius 8. Primary: green fill, white text. Secondary:
  white with a hairline border, and the edge darkens on hover. Danger: bad-on-bad-tint. No glows, no gradients.
  The label is a verb ("اعتماد", "حفظ"), with at most one primary per view.
- **Cards.** Only when the grouping means something (a KPI, a person, a run). White, a 1px hairline, radius 12,
  no shadow. Dense lists are not cards: rows with Soft Divider lines inside one surface.
- **Inputs.** Label above (13px, Slate Moss), field 40px, 1px Input Edge, radius 8. Focus: green edge plus a 3px
  tint ring. Error: `aria-invalid="true"` turns the border status-bad and the message appears below in bad text.
  Hints sit below in Muted Moss. No floating labels.
- **Chips (status).** Radius 6, 12px, weight 500, status pair colours; a dot or icon is optional, but the word is
  required.
- **Segmented control.** A well track with a white pressed segment, a subtle shadow and weight 600. It is used for
  2-4 views of the same data.
- **Tabs.** An underline style, with a 2px green bar under the selected tab. They are keyboard reachable: arrows
  move (mirrored in RTL).
- **Tables.** A white surface, 12.5px Muted Moss headers, dividers between rows, numbers aligned to the end, and
  a hover tint on clickable rows. On phones, wide tables scroll inside their own box and never the page.
- **Drawers (side panels).** White, a close (x) button, Escape and tap-outside all close. They slide in from the
  inline end; on phones they are a bottom sheet. A drawer title is 19px/600.
- **Loaders.** Skeleton bars that match the final layout, and the top progress bar with its % badge (6px, dark
  green). No spinners inside content.
- **Empty states.** An icon in a tinted well, one line saying what is missing, and the action that fills it (for
  example "سياسة جديدة").
- **Error states.** Inline, next to the thing that failed, in plain words, with a retry button when it can be
  retried.

## 5. Layout principles
- Shell: a 256px cream sidebar holding the seven areas, a 60px top bar (search, attendance chip, bell, language,
  avatar), and content capped at 1280px with 28px padding.
- An area page is a title, a one-line lead, underline sub-tabs, then the body. The body builds with CSS Grid
  (12 columns on desktop, single column below 900px).
- Spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32. Gaps between cards are 16; between sections 24-32.
- No overlapping elements, no absolute-positioned content stacks, and no horizontal page scroll at any width.
- Phones (< 900px): the sidebar becomes a drawer; a bottom bar holds Home, Requests, check-in (centre, pine),
  Pay or People, and More. Touch targets are at least 44px.

## 6. Motion and interaction
- Ease `cubic-bezier(.2,.8,.2,1)`, 150-320ms. Animate only transform and opacity (the loading bar width is the one
  exception, and it is cheap).
- Lists and cards cascade in with a 30ms stagger, capped at 8 items.
- The gauge needle settles with a spring curve once per load.
- The live "in" dot pulses slowly (2.4s).
- `prefers-reduced-motion: reduce` removes the cascade, the pulse and the needle swing.

## 7. Accessibility (testable)
- Text contrast is at least 4.5:1 (body) and 3:1 (18px+ and UI edges). Measured: Deep Ink on Paper 15.8:1, Slate
  Moss 7.1:1, Muted Moss 4.8:1, green on white 5.9:1.
- Every control is reachable and usable by keyboard. Focus is always visible (the green ring) and never removed
  without a replacement.
- Dialogs: `role="dialog"` with `aria-modal`, focus moves in on open and returns on close, and Escape closes.
- Tabs use `role="tab"` and `aria-selected`; menus use `role="menu"`; the palette uses a combobox with a listbox
  and `aria-activedescendant`.
- Touch targets are at least 44x44 on phones.
- State is never shown by colour alone.

## 8. Content and tone
- Arabic first, plain and direct: "سجلت حضورك 07:52" rather than "تم تسجيل عملية الحضور بنجاح". English
  mirrors it, with no jargon.
- Counts use `plural(n, ...)`: "3 أيام", "21 يوما", never "3 يوم".
- Buttons are verbs. Errors say what happened and what to do next.
- Employees see "دوامك" (their working hours), not "ورديتك". "الورديات" is only the HR scheduling feature.

## 9. Anti-patterns (banned)
- Emojis anywhere in the UI.
- Pure black, neon or glow shadows, gradient text, purple accents, gradients on cards.
- A dark pine surface outside check-in and sign-in (this is what made the old screens heavy).
- Floating labels, placeholder-as-label, spinners inside content.
- Cards inside cards inside cards; three identical cards in a row used as decoration.
- Hardcoded colours in module CSS when a token exists.
- Raw keys on screen ("tk_payroll"), English fallbacks in the Arabic UI, mixed Arabic digits.
- Horizontal page scroll; text over images; custom cursors.

## 10. QA checklist (run before each deploy)
- [ ] All 13 suites plus `tests/sim50.js` end with "0 failed".
- [ ] A preview crawl of every area and sub-page as HR, manager, employee and admin shows no errors, no raw keys
      and no forbidden messages.
- [ ] Phone (375px) and desktop (1280px) screenshots of home, check-in, a table screen and a drawer.
- [ ] No pine surface outside check-in and sign-in; no new raw colours in module CSS.
- [ ] Keyboard pass: Tab through the shell, open and close a drawer, use Ctrl K, arrow through tabs.
- [ ] Reduced motion: the cascade and the pulse stop.
