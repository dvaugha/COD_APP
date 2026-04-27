# Session Resume: COD Golf App — v280.1 (GOLD)

## Current Status
- **App Version:** v280.1 - GOLD
- **Branch:** `main` → `https://github.com/dvaugha/COD_APP`
- **Last Updated:** 2026-04-27
- **Gold Standard File:** `CODv280_1_GOLD.html`

---

## What Was Built This Session (v279.3 → v280.1)

### 🔊 Enhanced Voice Announcements
- **Bullhorn Delay & Sequencing:** Prevented audio overlap ("stepping") by implementing sequential callbacks (`onend`). Added a mandatory 30-second delay for segment-end announcements to allow post-hole chatter to settle.
- **Personalized Stroke Alerts:** The voice alert now explicitly speaks the *names* of the players receiving strokes on the upcoming hole (e.g., "Dan and Doug have strokes on this next hole") instead of a generic warning.
- **Combo Tee Navigation:** If playing "Combo" tees, the app intelligently scans ahead and announces: "Attention! Next hole is a Gold tee. Move to the gold markers" 3 seconds after the previous score is entered.

### 🖼️ Simplified "Share Scorecard Only"
- Added a dedicated "SHARE SCORECARD ONLY" button on the Recap view.
- Generates a completely clean, "financials-free" snapshot of just the Front 9 and Back 9 Gross and Net scorecards.
- Fixed a bug where `html2canvas` was hanging on "Preview still loading" by explicitly waiting 300ms for DOM rendering and actively generating the canvas blob before sharing.

### 🎨 High-Contrast "Neon" UI Overhaul
To ensure maximum visibility outdoors and prevent functional color clashes (like green '+' buttons bleeding into green team colors):
- **Team A:** Changed to Bright Cobalt Blue (`#60A5FA`).
- **Team B:** Changed to Bright Cyan (`#22D3EE`).
- **Stroke Alert Banner:** Replaced the old "Caddy Insights" banner with a bright Gold/Amber (`#F59E0B`) "Stroke Alert" banner that actively displays exactly who receives a stroke on the *current* hole. 
- All muted gray text was previously converted to Pure White (`#FFFFFF`) to survive harsh sunlight on mobile screens.

### 🚀 Automation & Deployment
- Relied on `bundle_gold.py` to create a new `CODv280_1_GOLD.html` standalone artifact.
- Extremely aggressive cache-busting required (`?v=202604271058`) to force iOS Safari to dump stale javascript.

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
