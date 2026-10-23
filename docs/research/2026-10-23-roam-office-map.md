# Roam (ro.am) study and the live office map — 2026-10-23

## How Roam was studied

- REA (`inspect_web_page`, `capture_web_screenshot`) only attaches to loopback targets. It refused ro.am pages with
  `target_not_allowed`.
- ro.am also resets plain fetches and serves headless Chrome an empty page.
- Bot protection was not bypassed. The findings below come from Roam's indexed product and support pages, which are
  vendor material.

## What Roam does (public pages)

- **Floor map:** after entering from the "Overworld", you land on a visual overview of everyone in the office. A profile
  picture in a room means that person is present.
  - [What is Roam](https://ro.am/support/what-is-roam)
  - [Virtual Office Platform](https://ro.am/virtual-office-platform)
  - [Floor map](https://ro.am/support/topic/floor-map)
- **Rooms:** private offices (knock to enter), meeting/team rooms, theater for all-hands, game room.
  - [Room types](https://ro.am/support/room-types)
- **Office tags (hybrid):** the map shows which physical office each person is in (Miami, New York, London) or
  remote, live.
  - [Virtual Office Platform](https://ro.am/virtual-office-platform)
- **Honest presence:** closing the window takes you out of your office; "Will Return" and "Out of Roam" cover short
  absences, so the map never goes stale.
  - [Closing vs minimizing](https://ro.am/support/closing-minimizing-roam)
- **On-It:** an AI assistant that watches the map and tells you when someone enters the office.
  - [AI assistant](https://ro.am/ai-assistant)
- **Mobile:** presence on the phone, including the lock screen.
  - [Roam mobile](https://ro.am/mobile)

## What we took (ideas only, no assets)

| Roam | Ours |
|---|---|
| Floor map with a room per space | `time:office` "خريطة المكتب": one room per zone (office/branch) with avatars of who is checked in there |
| Office tags for hybrid teams | The zone of the open check-in is the office tag. An approved remote day (or a check-in with no zone) is "remote", and an approved business trip is "work trip" |
| Presence that never goes stale | Built from real punches and approved requests. A checked-out person moves to "left for the day" |
| Will Return | "حالتي": a status of up to 60 characters, with an optional end time (30 min to 4 h). It disappears at that time |
| Filters | Count pills per state (tap to filter), department filter, name search |

Privacy is the deliberate difference from Roam:
- A colleague sees only office, remote, trip, left and away.
- "Away" covers leave, absence, days off and not-yet-in, so nobody learns why someone is away.
- The day status (late minutes, absent, leave type, worked time) goes to:
  - HR, admin and executive, for everyone;
  - a manager, for their own people;
  - each person, for themselves.

`tests/presence.js` (24 checks) enforces this.

Not taken: video rooms, knocking, the theater and AI meeting notes. These are video-conferencing features, not HRIS
features. The On-It idea ("tell me when X checks in") is a possible follow-up that would build on the push notifications
the app already sends.

## Code

- **Backend** (`backend/Attendance.gs`, end):
  - `api_officeMap`: read-only, every employee;
  - `api_presenceSet`;
  - tab `presenceNotes`.
- **Client:** `js/presence.js` (`window.OfficeMap`), registered as page `time:office` for everyone.
  - It refreshes every 60 s while open, and not while a drawer is open.
  - Animations sit behind `prefers-reduced-motion`.
