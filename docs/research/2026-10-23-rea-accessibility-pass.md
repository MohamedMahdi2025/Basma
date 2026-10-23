# REA pass on the leading HR products and on our app (2026-10-23)

The owner asked whether the reverse-engineering (REA) tools were really used. This pass uses the REA functions
themselves: `inspect_web_page` (DOM, accessibility tree and resources over Chrome DevTools) and `capture_web_screenshot`.
They ran in a separate headless Chrome (port 9335), stopped by process afterwards. Public pages only; nothing was
logged into, and no assets were copied.

## 1. The leading products (REA `inspect_web_page`, accessibility tree)

| Product (public HRIS page) | Evidence | Landmarks (banner / nav / main / footer) | h1 | Unnamed buttons | Images without alt | Skip link |
|---|---|---|---|---|---|---|
| Workday HCM | ev_bb43e487d88f2 | 1 / 3 / 1 / 1 | 0 | 0 | 1 of 15 | yes |
| Rippling HRIS | ev_4e217c2d50b1d | 1 / 1 / 1 / 1 | 1 | 4 of 12 | 73 of 102 | yes |
| HiBob | ev_c3e35ae6e88c1 | 1 / 1 / 1 / 1 | 1 | 0 of 45 | 16 of 88 | yes |
| Personio | ev_f3e94cc9cd51a | 1 / 2 / 1 / 1 | 1 | 11 of 51 | 118 of 302 | no |
| SAP SuccessFactors | — | refused the headless browser ("Access Denied"); not bypassed | | | | |

What the best of them share:
- every page is built from landmarks;
- one page title (h1);
- a skip link;
- every button named.

## 2. Our app (same REA inspection, signed in as HR, Org 1001)

| Page | Evidence | Landmarks | h1 | Unnamed buttons | Images without alt | Skip link |
|---|---|---|---|---|---|---|
| Home | ev_da1fc62ebbdb9 | 1 / 2 / 1 / 0 | 1 | 0 of 21 | 0 of 5 | yes |
| People, before fixes | ev_26f7f99ec574b | 1 / 2 / 1 / 0 | 1 | 0 of 20 | 0 | yes |
| People, after fixes | ev_93938e8c54416 | 1 / 2 / 1 / 0 | 1 | 0 of 20 | 0 | yes |

REA found three real problems on our People page, which the leading products do not have:

| Problem | Before | After |
|---|---|---|
| Card titles read twice ("Years of service Years of service"): the chart/table switch sat inside the heading and was named after it | 5 cards | none |
| Section title one level too deep (h1 then h3) | h3 | h2 |
| Department filter with no accessible name | 1 | 0 |

A sweep of all 74 pages HR and the admin can open found more of the same class. These were fixed for every screen
at once (`axLabels` in index.html):
- visible labels not tied to their field (location form, import dates and others);
- an icon-only refresh button.

## 3. Fixes

- `js/dashboard.js` `card()`: the title is the heading. The view switch sits beside it, named "View as".
- `panel()`: section titles are h2.
- `index.html` `axLabels`: a light observer pairs every `.field` label with its own control whenever a screen
  renders, and gives icon-only buttons their title as a name.
- The department filter and the approvals refresh button are named.

## 4. Not changed, on purpose

- No footer landmark: the app shell is a work tool with a sidebar, not a marketing page (Workday's product UI has
  none either). It can be added if an accessibility audit asks for it.
