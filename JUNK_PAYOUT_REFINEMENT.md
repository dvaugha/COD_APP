# JUNK PAYOUT REFINEMENT - SESSION SUMMARY (v268.0)

## 🎯 OBJECTIVE
Refine the "Junk Drawer" betting system to enforce a "Par or Better" rule for Greenies and Sandies, and improve transparency in end-of-round summaries.

## 🛠️ CORE FEATURES IMPLEMENTED

### 1. The "Par or Better" Rule
*   **Definition**: Greenies (**G**) and Sandies (**S**) only count toward payouts if the player achieves **Par or better** on the hole.
*   **Logic**: If a player cards a Bogey or worse on a hole where they were marked for a Greenie/Sandy, the item is automatically **voided**.
*   **Tracking**: A new `voided` tracker was added to the `calcJunkRes` function to identify these specific instances for reporting.

### 2. Financial Rules (The "True Payout")
*   **Pot Size**: $1 per player per segment (e.g., $4 pot for a 4-man group).
*   **Fixed Value**: Each junk item is worth $1 by default.
*   **The Overflow Rule**: If the group earns more items than the pot size (e.g. 5 items vs $4 pot), the $4 pot is split proportionally among winners (e.g. 2 items = $1.60 -> $2).
*   **The Carryover Rule**: If the group earns fewer items than the pot size (e.g. 2 items vs $4 pot), the winners get their $1 per item, and the remainder (e.g. $2) carries over to the next segment's pot.
*   **The Last Segment Refund**: In the final segment, if zero items are earned, the entire remaining pot (including any carryovers) is refunded equally to all participating players to maintain a zero-sum game.

### 3. UI & Reporting
*   **Voided Item Notes**: The scorecard summary now includes specific warnings (e.g., `⚠️ DAN G voided by Bogey+ on H6`) to explain why a payout might be lower than expected.
*   **The Junk Drawer Table (Share Summary)**: 
    *   Added a dedicated **VOID** column to the summary table.
    *   Columns: **PLY | 🟢 | 🏖️ | LP | VOID**.
    *   This provides a visual tracker of "what could have been" for players who stuck the green but missed the par.
*   **Sharing Summaries**: 
    *   **Ronnie Simple**: Included a condensed net junk summary line (e.g., `💰 JUNK: DAN (+$3), CHRIS (-$1)`).
    *   **TXT Share**: Refactored to remove redundant score logs and provide a clean, financials-first summary.

### 4. Technical Robustness
*   **Variable Renaming**: Renamed the ambiguous `sIdx` (Segment Index) variable to **`segIdx`** throughout the code. This eliminates confusion between the letter 'I' and the numerical 'l', fixing a "Variable not found" error reported on some platforms.
*   **Dashboard Syncing**: Ensured that junk button visibility (like the Greenie toggle on Par 3s) is correctly refreshed when navigating holes or using the **TEST** fill button.

---
**Status**: COMPLETED & PUSHED TO GITHUB
**Version**: v268.0
**Project**: COD Golf App
