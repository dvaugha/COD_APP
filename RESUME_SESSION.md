# Session Resume: COD Golf App — GOLD STANDARD v275.17

## Current Status
- **App Version:** v275.17
- **Gold Tag:** `gold-v275.17` (tagged in GitHub)
- **Branch:** `main` → `https://github.com/dvaugha/COD_APP`
- **Date Promoted:** 2026-04-11

---

## Active Game Modes

| Mode | Players | Notes |
|---|---|---|
| **C.O.D. (6-6-6)** | 4 (2v2) | SEG BET only, POT hidden |
| **2-Man Scramble** | 4 (2v2) | SEG BET only, POT hidden |
| **Versus (18-Hole Stroke)** | 2–4 | TOTAL POT field shown |
| **Scorecard Only** | 1–4 | No money fields |
| **Rabbit Hunter** | 2–4 | BUY-IN field shown, defaults $10/player |

---

## Rabbit Hunter Rules (v275.17)

1. **Lone Low Net** → Captures or Knocks Loose the Rabbit
2. **Lone Natural Birdie (Gross < Par)** → Super Capture (overrides standard rule)
3. **Double Bogey Penalty (Gross ≥ Par + 2)** → Holder releases Rabbit automatically (goes free)
4. **Tie (2+ players tie low net)** → Rabbit holder defends / rabbit stays free
5. **Payout Split:** Front 9 = **40%** of total pot | Back 9 = **60%** of total pot
6. **BUY-IN** is per player (e.g. 3 players × $10 = $30 total pot)

---

## UI / Dashboard Features

- 🐇 **Rabbit Holder Icon** — appears next to current holder's name on dashboard
- **Rabbit Tracker Grid** — in Recap view, shows who held rabbit on each hole (H1–H18), placed directly under Gross Totals
- **POT Field Smart Labels:**
  - COD / Scramble → POT field hidden (not relevant)
  - Stroke → labeled **"TOTAL POT $"**
  - Rabbit Hunter → labeled **"BUY-IN $"**, auto-sets to $10 on mode switch
- **End Round** → Confirmation dialog, returns to Setup screen
- **Recap Button** at top → Full scorecard + Rabbit Tracker + stats

---

## Key Bug Fixes This Session

| Version | Fix |
|---|---|
| v275.15 | `par` variable out of scope in `calcRabbit` Double Bogey check |
| v275.16 | `rabbitHistory` not cleared on new round, caused Rabbit UI to bleed into COD |

---

## Files Modified
- [`index.html`](index.html) — UI structure, version strings
- [`js/app.js`](js/app.js) — All game logic

## Key Functions
- `calcRabbit()` — Rabbit state machine (runs on every score save)
- `announceRabbit()` — Voice alerts for Rabbit events
- `uDash()` — Dashboard rendering (includes 🐇 icon logic)
- `uRecap()` — Recap view (includes Rabbit Tracker grid)
- `getNetTotalsHTML()` — Financial payout summary
- `onGameModeChange()` — POT field visibility/label logic
- `startRound()` — Round initialization (clears all state including rabbitHistory)

---

## Next Steps / Future Ideas
- Junk payout deep-dive per hole in Recap
- "Caddy Insights" — real-time match strategy panel
- "Dot Hunters" game mode concept

---

## Git Reference
- **Gold Tag:** `gold-v275.17`
- **Repo:** https://github.com/dvaugha/COD_APP
