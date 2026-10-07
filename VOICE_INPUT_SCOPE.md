# Voice Score Input — Scope Note

Status: **SCOPED 2026-10-07 — ON HOLD.** Dan's verdict: the achievable version feels too clunky for now. No code changes made. This note preserves the analysis so the idea can be resumed without redoing it.

## The original idea
While COD is running on the phone, say "Baxter" and dictate the hole's scores (e.g. "Baxter, everyone had a par"), and have them entered automatically — with the app always knowing the current hole via its existing start-hole (1 or 10) + auto-advance logic.

## Why the exact version is not possible (as a web app on iPhone)
- iOS does not let a web page listen continuously. There is no always-on wake word available to a PWA/web app.
- Safari does support web speech recognition (webkitSpeechRecognition, iOS 14.5+), but sessions must be started by a user tap/gesture, end on silence, and are historically unreliable in installed (home-screen / standalone) mode — exactly how COD runs.
- Recognition is cloud-backed (Apple servers), so it needs cell signal on the course.
- COD's live round state exists only in phone localStorage (key COD_GOLF_DATA_v281_0). The GitHub sync in the app archives finished rounds only (summary: date, course, players, net) to history/YYYY/MM_Month.json — there is no live hole-by-hole feed for an outside agent to write into or read mid-round.

## The achievable version (what was scoped)
- One big cart-friendly mic button on the scoring screen. Tap, speak one hole: "Baxter, Dan 4, Steve 5, Dewey and Doug par." ("Baxter" is decorative — the parser ignores it.)
- Parsing happens inside COD itself (instant, no round-trip). Routing transcripts to an outside agent and back would add minutes of latency per hole.
- The app already knows the current hole (start + auto-advance, incl. 10-start wrapping 18 -> 1), so the utterance never needs a hole number.
- Mandatory spoken readback via the app's existing voice engine ("Hole 7: Dan 4, Steve 5, Dewey par, Doug par") BEFORE scores are committed — a mishear must be caught before it touches money.
- V1 grammar: gross scores only. Seated players' names only (avoids roster collisions like TonyC vs TonyS), numbers, par/birdie/bogey/double/triple/eagle, "everyone par" / "all 4s", corrections ("change Steve to 5", "scratch that"). Junk (greenie/sandie/pole) and presses stay tap-only in V1.
- Outside agent's role in this design: pre-round setup mirror + post-round verification of card and money from the GitHub history archive.

## Risks / unknowns
- PWA-mode speech recognition reliability on Dan's actual iPhone — UNTESTED. This is the go/no-go gate (Phase 0).
- Wind/cart noise mishearing names and numbers.
- Weak/no signal on some courses kills cloud recognition.
- Battery (partly mitigated: app already uses WakeLock).
- Privacy: dictated audio is processed by Apple's servers in Safari's implementation.

## Phasing (rough estimates, if ever resumed)
- Phase 0: 30-minute on-device test — does recognition work at all in installed COD on Dan's phone? Gate for everything else.
- Phase 1: tap-to-talk gross scores in a WIP build, validated in Test Mode on desktop + phone.
- Phase 2: field test at a real round, Baxter mirroring the card for comparison.
- Phase 3 (optional, only if earned): junk/press phrases.

## Alternatives noted
- Voice via the Muse app (dictation/voice note) with Baxter as scorekeeper-of-record and COD receiving the card after the round: works today, but COD's live money math (segments, presses, stroke alerts) is unavailable mid-round.
- A native wrapper (e.g. Capacitor + native speech plugin) would unlock true native recognition, but is a much bigger project (App Store, signing, maintenance) — out of scope here.
