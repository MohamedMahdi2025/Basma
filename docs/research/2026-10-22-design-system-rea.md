# Design system: what the strongest HRIS products do, measured (REA, 2026-10-22)

The owner asked: "use REA to choose the best design ever seen for all HRIS systems and build it."

## 1. Method (public evidence only, no assets copied)

The leading HR platforms publish their design systems as open packages. They were downloaded from the public npm CDN
(jsdelivr) and their token chains resolved to pixels (`scratchpad/tokens/analyze.js`):
- **Workday Canvas**: `@workday/canvas-tokens-web` 4.5.1, system and base tokens.
- **SAP Fiori Horizon**, the theme of SAP SuccessFactors: `@sap-theming/theming-base-content` 11.36.5.

Our own app was measured twice:
- **source**: every literal font size, radius, gap and shadow in index.html and js/*.js;
- **rendered**: headless Chrome signed in as HR, visiting every page HR can open (63) at desktop (1440) and phone (390)
  width, reading computed styles (`measure.js`).

## 2. What the strongest systems share

| Token | Workday Canvas | SAP Horizon |
|---|---|---|
| Type scale | 10 12 14 16 18 20 24 28 32 40 48 56 (12 steps) | 12 14 16 20 24 32 48 (base 14) |
| Line height | 4 px grid (16 … 64) | 44 px list lines, 36 px controls (26 compact) |
| Spacing | 4 px unit: 4 8 12 16 20 24 32 40 56 64 80 | 4 px multiples |
| Radius | 2 4 6 8 16 24 + round | 4 (fields), 8 (buttons, popovers), 16 (tiles) |
| Elevation | 6 depth levels, two soft layers each | 4 shadow levels |
| Focus | visible 2 px ring | 2 px focus width |

The lesson is **discipline, not decoration**. Every screen in those products is built from one small scale. That is
what makes them read as one product, however many modules they have.

## 3. Where we stood, and what changed

### Source

| Measure | Before | After |
|---|---|---|
| Distinct font sizes | 35 | **13** (11 12 13 14 16 18 20 24 28 32 40 48 56) |
| Distinct radii | 26 | **8** (2 4 6 8 12 16 24, pill) |
| Distinct gaps | 19 | 12, almost all on the 4 px grid |
| Drop shadows | 80 distinct | neutral drops through **4 elevation tokens** `--e1…--e4`; glows and brand-coloured lifts kept |

### Rendered (HR, all 63 pages)

| Measure | Before: desktop / phone | After: desktop / phone |
|---|---|---|
| Font sizes on screen | 31 / 29 | **13 / 12**, every one on the scale |
| Radii | 15 / 18 | 10 / 11 |
| Shadows | 20 / 15 | 17 / 13 |
| Pages with sideways scroll | 0 / 0 | 0 / 0 |

### How it was done

- `codemod.js` snapped 295 font sizes, 109 radii, 186 gaps and 37 shadows to the nearest step. Body text never
  shrinks: 15 becomes 16, for Arabic legibility.
- Element defaults (h1-h4, small) sit on the scale. Before, browser defaults produced 18.72, 13.33, 11.67 and 10.83 px.
- Tokens live in the first `:root` block of index.html. New code uses the scale and `var(--e1…4)`, never new literal
  values.

## 4. Kept on purpose

- The brand (pine, cream, brass and the medallion), the lifecycle sidebar, and the phone layout (earlier REA studies
  2026-10-19 and 2026-10-20).
- Paddings were not snapped. 106 distinct paddings remain, the next candidates, but changing them shifts layouts and
  needs page-by-page review.
