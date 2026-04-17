# Session Resume: COD Golf App — v275.22 (GOLD)

## Current Status
- **App Version:** v275.22 - GOLD
- **Branch:** `main` → `https://github.com/dvaugha/COD_APP`
- **Last Updated:** 2026-04-17

---

## What Was Built This Session (v275.19 → v275.22)

### 🐛 Critical UI & State Management Fixes (v275.20 - v275.22)
- **The "Missing Names" Bug Resolved:** Fixed a critical data-binding regression in the `uDash` function and `App.init` where `this.d.chosen` (active player seats) was sometimes created as an Object instead of an Array. This caused `.filter()` crashes in the background, resulting in blank player lists.
- **Robust Storage Migration:** Standardized the local browser storage key to `COD_GOLF_DATA_v275_22`. Added an aggressive "scavenging" fallback to recover names stored under legacy keys (`GOLF_241`, `GOLF_265`, `COD_GOLF_DATA_v273_0`).
- **Code Deduplication:** Cleaned up over 80 lines of duplicated definitions in `app.js` (e.g., `renderRoster`, `restoreSet`) that were causing strange race conditions and breaking the "Tap Name to Seat" feature.
- **"CLEAR ALL" Button Repaired:** Restored the `clearSeats` function which was accidentally removed during code cleanups, allowing instant reset of all four player spots.
- **Syntax Error Protection:** Validated the application code via `Node.js` after a catastrophic syntax error (a missing closing brace) temporarily broke the entire app initialization during v275.21.

### ⛳ Course Database Accuracy: Crow Creek CC Focus (v275.22)
- Analyzed physical scorecard photos for **Crow Creek CC (Calabash, NC)** to establish absolute accuracy.
- **Handicap Corrections:** Hole #2 is properly recorded as the #1 handicap, and Hole #1 is the #17 handicap.
- **White and Gold Yardages:** Exact yardages for both White (6099 yds) and Gold (5628 yds) copied directly from the physical scorecard photos.
- **Combo Tee Auto-Mapping:** Implemented the exact "Medalist/Combo" tee mapping (5882 yds) used by Crow Creek, accurately alternating between White and Gold tee yardages hole by hole. 
- *Note:* The source scorecard images are now preserved directly inside the repository under the `/scorecards/` directory.

### 🚀 Automation & Deployment
- Consolidated all deployment commands into a single `SYNC.bat` file.
- The sync script now automatically executes cache-busting (updating version tags in `index.html`), commits the changes to Git, and pushes to remote, ensuring quick, safe deployments of hotfixes.

---

## Active Game Modes Summary

| Mode | Players | SEG BET Default | Notes |
|---|---|---|---|
| **C.O.D. (6-6-6)** | 4 (2v2) | $5 | Rotating teams, 3 segments, presses |
| **Nassau (18-Hole)** | 4 (2v2) | $4 | Fixed teams, 3 bets (F/B/Total) |
| **2-Man Scramble** | 4 (2v2) | $5 | Points-based, no presses |
| **Versus (18-Hole Stroke)** | 2–4 | $5 | TOTAL POT field shown |
| **Scorecard Only** | 1–4 | — | No money fields |
| **Rabbit Hunter** | 2–4 | — | BUY-IN field shown, 40%/60% split |

---

## What to Focus on Next
- **Test Nassau full round end-to-end:** Verify all pot distributions and F/B/Overall match play interactions check out under complete live play.
- **Verify Crow Creek CC:** Ensure the newly added Combo Tee yardages correctly surface in the dashboard.
- **Monitor Roster Stability:** Monitor if players report any further empty seat dropdowns upon app refresh.
