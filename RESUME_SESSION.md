# Session Resume: COD Golf App — v275.19

## Current Status
- **App Version:** v275.19 (latest on `main`)
- **Last Gold Tag:** `gold-v275.17`
- **Branch:** `main` → `https://github.com/dvaugha/COD_APP`
- **Last Updated:** 2026-04-12

---

## What Was Built This Session (v275.18 → v275.19)

### v275.18 — Mid-Round Standings Feature
- **📊 STANDINGS button** added to dashboard nav bar (between ⚙️ and RCP)
- Button is **dimmed/disabled** until `holesPlayed % 3 === 0` (every 3 holes completed)
- Button **glows green with pulsing animation** at each 3-hole checkpoint
- Clicking opens a **full-screen scrollable popup modal** with sections:
  - 🏌️ **COD Match** — segment status (leads/all square) for each started segment
  - 🏆 **Nassau Match** — Front 9 / Back 9 / Total (only when game mode = Nassau)
  - 💰 **Junk Earnings** — running $ net per player with item breakdown
  - 🐇 **Rabbit Hunter** — current holder, holes held, pot at stake
- Sections are **conditional** — only shown when relevant game mode is active
- `checkStandingsBtn()` — called from `uDash()` on every render
- `showStandings()` — builds dynamic popup content
- `closeStandings()` — dismisses modal

### v275.19 — Nassau (18-Hole) Game Mode
- **New game mode:** "Nassau (18-Hole)" in both game mode dropdowns
- **Teams:** Cart A (slots 0 & 1) vs Cart B (slots 2 & 3) — fixed all 18 holes, no rotation
- **Scoring:** Match play, hole by hole — best net score of each team wins the hole
- **3 Bets:** Front 9, Back 9, Overall (total holes won)
- **Default SEG BET:** $4/player/segment (auto-sets on mode selection)
- **COD default SEG BET:** fixed to always force $5 (was conditional on 0 — bug)
- Dashboard shows `NASSAU MATCH` label + Front / Back / Total live status
- Scorecard shows 🏆 NASSAU RESULTS with winner + payout per segment
- `calcNassau()` — engine function: returns front/back/overall wins + winner per team
- No presses, no team rotation for Nassau
- Standings popup shows Nassau Match section (only when game = Nassau)
- Nassau section **removed from COD standings** (was showing incorrectly)

---

## Active Game Modes

| Mode | Players | SEG BET Default | Notes |
|---|---|---|---|
| **C.O.D. (6-6-6)** | 4 (2v2) | $5 | Rotating teams, 3 segments, presses |
| **Nassau (18-Hole)** | 4 (2v2) | $4 | Fixed teams, 3 bets (F/B/Total) |
| **2-Man Scramble** | 4 (2v2) | $5 | Points-based, no presses |
| **Versus (18-Hole Stroke)** | 2–4 | $5 | TOTAL POT field shown |
| **Scorecard Only** | 1–4 | — | No money fields |
| **Rabbit Hunter** | 2–4 | — | BUY-IN field shown, 40%/60% split |

---

## Rabbit Hunter Rules (unchanged from v275.17)

1. **Lone Low Net** → Captures or Knocks Loose the Rabbit
2. **Lone Natural Birdie (Gross < Par)** → Super Capture (overrides standard rule)
3. **Double Bogey Penalty (Gross ≥ Par + 2)** → Holder releases Rabbit automatically
4. **Tie (2+ players tie low net)** → Rabbit holder defends / rabbit stays free
5. **Payout Split:** Front 9 = **40%** | Back 9 = **60%**
6. **BUY-IN** is per player (e.g. 3 players × $10 = $30 total pot)

---

## Key Functions Reference

| Function | Purpose |
|---|---|
| `checkStandingsBtn()` | Activates/deactivates 📊 STANDINGS button every 3 holes |
| `showStandings()` | Builds and opens mid-round standings popup |
| `closeStandings()` | Dismisses standings popup |
| `calcNassau()` | Nassau engine — returns front/back/overall hole wins + winner |
| `calcRabbit()` | Rabbit state machine (runs on every score save) |
| `calcSegResults()` | COD segment results including presses |
| `calcJunkRes()` | Junk payout calculation (6-hole segments) |
| `getJunkStats()` | Raw junk item counts per player |
| `uDash()` | Dashboard render — calls `checkStandingsBtn()` |
| `getNetTotalsHTML()` | Financial net totals (all game modes) |
| `onGameModeChange()` | POT/BET field visibility & defaults per mode |
| `startRound()` | Round initialization & player validation |

---

## Files Modified This Session
- [`index.html`](index.html) — Nassau in dropdowns, Standings modal HTML, nav bar button
- [`js/app.js`](js/app.js) — All logic changes
- [`css/styles.css`](css/styles.css) — Standings button & modal styles

---

## UI / Dashboard Features

- 📊 **Standings Button** — nav bar, glows green at 3-hole checkpoints
- 🐇 **Rabbit Holder Icon** — appears next to holder's name on dashboard
- **Rabbit Tracker Grid** — Recap view, H1–H18 holder display
- **POT Field Smart Labels:** COD/Scramble → hidden | Stroke → "TOTAL POT $" | Rabbit → "BUY-IN $"
- **End Round** → Confirmation dialog, returns to Setup
- **RCP Button** → Full scorecard + junk + stats recap

---

## Git Reference
- **Latest commit:** `7735024` — v275.19 hotfix (COD $5 default)
- **Repo:** https://github.com/dvaugha/COD_APP
- **Gold Tag:** `gold-v275.17` (last promoted Gold — consider promoting v275.19 when stable)

---

## Potential Next Steps
- Test Nassau full round end-to-end
- Consider Nassau presses (currently none)
- Promote v275.19 to GOLD STANDARD once confirmed stable
