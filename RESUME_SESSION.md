# Session Resume: COD Golf App — v280.4 (GOLD)

## Current Status
- **App Version:** v280.4 - GOLD
- **Branch:** `main` → `https://github.com/dvaugha/COD_APP`
- **Last Updated:** 2026-04-27
- **Gold Standard File:** `CODv280_1_GOLD.html` (Baseline for 280.x updates)

---

## What Was Built This Session (v279.3 → v280.4)

### 🐇 Rabbit Hunter Hardening (v280.2 - v280.3)
- **UI Decoupling:** Completely removed the "Carts / Opposites / Drivers" segment tracking UI and disabled the "PRESS" buttons from the dashboard when playing Rabbit Hunter.
- **Voice Logic Constraints:** Restricted the "Segment Winner" voice announcements and the automatic Standings Modal popups (triggered on holes 6, 12, 18) to only execute during COD and Scramble modes, preventing irrelevant mid-round alerts during Rabbit Hunter.

### 🎨 High-Contrast & Typography UI Overhaul
- **Legibility Boost:** Increased the dashboard hole/segment indicator text (`d-h-num`) by ~30% (from 14px to 18px) for easier reading from the cart (v280.4).
- **Color Clashes Resolved:** Changed Team A to Bright Cobalt Blue (`#60A5FA`) and Team B to Bright Cyan (`#22D3EE`). This prevents them from blending into the green '+' buttons and gold Stroke Alerts.
- **Stroke Alert Banner:** Replaced the old "Caddy Insights" banner with a bright Gold/Amber (`#F59E0B`) "Stroke Alert" banner that actively displays exactly who receives a stroke on the *current* hole. 

### 🔊 Enhanced Voice Announcements
- **Bullhorn Delay & Sequencing:** Prevented audio overlap by implementing sequential callbacks. Added a mandatory 30-second delay for segment-end announcements to allow post-hole chatter to settle.
- **Personalized Stroke Alerts:** The voice alert now explicitly speaks the *names* of the players receiving strokes on the upcoming hole instead of a generic warning.
- **Combo Tee Navigation:** If playing "Combo" tees, the app intelligently scans ahead and announces: "Attention! Next hole is a Gold tee" 3 seconds after the previous score is entered.

### 🖼️ Simplified "Share Scorecard Only"
- Added a dedicated "SHARE SCORECARD ONLY" button on the Recap view.
- Generates a completely clean, "financials-free" snapshot of just the Front 9 and Back 9 Gross and Net scorecards.
- Fixed a bug where `html2canvas` was hanging on "Preview still loading" by explicitly waiting 300ms for DOM rendering.

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
- **Test Scorecard Snapshot:** Verify the 300ms rendering delay works consistently across older mobile devices when taking the new Scorecard-Only photo.
- **Test Voice Sequencing:** Monitor the 30-second delay for segment-end announcements to ensure it triggers correctly alongside "Combo" tee alerts without crashing.
- **Monitor Rabbit Hunter:** Confirm the dashboard remains clean of COD-related match elements during active play.
