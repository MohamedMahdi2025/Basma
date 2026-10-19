# Phone design 2026: REA before and after (2026-10-19)

**Method.** The local preview ran in headless Chrome with the phone viewport (390 x 844, touch). REA captured the screen
(`capture_web_screenshot`, artifact sha256 `f7e08659…0700` for Home before the change). A measurement script ran in the
same emulation on five screens, before and after the change. The script counted:
- elements that scroll sideways;
- items in the top bar;
- tap targets under 40 px;
- elements off-screen;
- the height of the page header.

**Sources for the patterns.** The public 2026 platform guidance: Apple Human Interface Guidelines (iOS 26) and Material 3
Expressive. These patterns are shared by the leading apps:
- large-title headers;
- at most three actions in the top bar;
- bottom sheets instead of side-scrolling strips;
- 44 px touch targets;
- a pill marker on the active tab.

No app's assets or brand were copied.

| Screen | Sideways scrollers (before → after) | Top bar items | Off-screen elements |
|---|---|---|---|
| Home | shortcut row 592/390 px → none | 7 → 5 | 8 → 0 |
| Time / check-in | page strip 988/362 px → none | 7 → 5 | 14 → 4 (radar labels) |
| Requests | page strip 1132/362 px → none | 7 → 5 | 11 → 0 |
| People | page strip 2271/362 px (19 tabs) → none | 7 → 5 | 31 → 0 |
| Pay | page strip 823/362 px → none | 7 → 5 | 8 → 0 |

**What changed (phones only; desktop is unchanged):**
- **Top bar:** menu, company name, search, bell and avatar. Language, print and the status chip moved to the avatar menu.
- **Page headers:** a large title replaces the green banner.
- **Sub-pages:** a page picker (current page, its area, the page count) opens a bottom sheet with a 3-column grid. It closes
  with (x), Escape or a tap outside.
- **Home:**
  - The shortcuts form a 4 x 2 grid.
  - The company/me switch is a segmented control.
  - The stat cards lose their decoration.
- **Inside pages:** chips wrap; nothing scrolls sideways (wide data tables still scroll inside their own box).
- **Tab bar:** a pill marks the active tab.
- **Panels:** bottom sheets with a grab handle; buttons are at least 40 to 44 px.
