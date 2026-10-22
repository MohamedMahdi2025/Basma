# Each company its own logo and colours, in one unified design (2026-10-22)

The owner asked:
- "every company may has its logo, not unified as Best Gas";
- "unify the animations and visualizations";
- "the green colours … redesign to be reasonable with all companies".

## Principle

The way Workday and SAP SuccessFactors handle tenant branding is **one design system, the tenant's mark and accent**. Every
company gets the same layout, motion, 3D medallion, splash, gate dial, charts and type scale. Only the logo and the
colour family are its own.

## Logo

- Administration → Settings → Company profile → **Upload logo**. The upload is resized to at most 512 px (WebP) and
  must be at most 48,000 characters; PNG, JPEG and WebP are accepted. SVG is refused, so nothing executable can ride in.
- It is stored in the company's own `branding` tab. Settings are not used, because a settings save rewrites that tab.
- The app receives a version string with every payload and fetches the image once per version (`orgLogo`, public, so
  the sign-in screen shows it before anyone signs in).
- The logo is used:
  - on the face of the 3D coin, whole and on a cream disc (the home artwork keeps its measured crop);
  - in the fallback image, the sidebar, and every printed document.
- A company without a logo gets a **monogram** of its initials in the same coin style. It never shows Best Gas's mark.
- The home company (1001) keeps its artwork until its administrator uploads a logo.

## Colours

- One **brand colour** per company (Settings → Company colour). It can be **taken from the logo**: the dominant strong
  hue is suggested, and the admin confirms.
- The whole palette is generated from it (`brandPalette`):
  - primary, hover, tint, light and deep variants;
  - dark chrome (gate, splash, sidebar shades) and the glow;
  - cool neutrals (paper, lines, ink) in the brand hue.
- **Accessibility:** the primary is darkened until white text passes WCAG AA (≥ 4.5:1). The chrome stays ≥ 10:1 and
  body text ≥ 12:1. `tests/brand.js` checks 10 extreme inputs, including yellow, pale pink, white and black.
- **Coverage:**
  - the base, v2-shell and dark-mode token scopes are all themed by one injected stylesheet (`#brandTheme`);
  - 116 green shades and 13 green rgba values across all screens became `var(--g-RRGGBB, #RRGGBB)` tokens. The home
    company sees the exact original through the fallback; another company's theme regenerates each shade in its own hue
    with the same lightness;
  - **status greens** (vivid mid-tone "present", "approved" and success) stay green on purpose: they mean "OK", not
    "brand";
  - the 3D coin's light, glow and face, the monogram, the browser theme colour and printed documents all follow the
    palette.
- Companies that pick no colour start on a neutral **slate blue** (#2F5D8C). The home company keeps its pine-and-cream.

## Evidence

- REA `capture_web_screenshot` of the themed app (evidence `ev_5967aff7…` before the fix, `ev_c557524e…` after) found
  one real bug: the coin kept the previous colour when the palette changed. Fixed with `brandRedraw()`.
- Preview: a second company shows its monogram and slate palette everywhere (splash, lock screen, sidebar, buttons,
  tabs, page banner). Best Gas is unchanged.
