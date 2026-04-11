# Session Resume: COD Golf App Development

## Current Status
- **App Version:** v275.4
- **Branch:** `main` (Synced to GitHub: `https://github.com/dvaugha/COD_APP`)
- **Key Feature Added:** **RABBIT HUNTER** game mode.

## Implementation Details
1. **Game Logic:** 18-hole Rabbit Hunter mode with $10 buy-in ($40 pot).
   - Front 9: 25% ($10).
   - Back 18: 75% ($30).
2. **Math Engine:** Fully Zero-Sum. 
   - If a nine pushes, no money moves.
   - Junk (Greenies/Sandies) is calculated and added to the final Net Totals.
3. **UI Hooks:**
   - **Live Banner:** Visual tracker for Rabbit state on the dashboard.
   - **Voice:** Audio announcements when Rabbit is captured, lost, or defended.
   - **Screenshot Recap:** Custom dark-themed payout box on the shareable image.
   - **Ronnie Simple Button:** Detailed text summary showing Rabbit vs Junk breakdown.

## Files Modified
- [index.html](index.html)
- [js/app.js](js/app.js)

## Next Steps
- Verify with user if the Zero-Sum math meets all field requirements.
- Continue adding more betting games (Concept 4: "Dot Hunters") if requested.
- Monitor for any mobile-specific performance or caching issues.
