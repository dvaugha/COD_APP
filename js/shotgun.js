// SHOTGUN START — v283.5 (Scorecard Only ONLY)
// Loaded after app.js / app2.js / app3.js / tee-names.js. Overrides only the
// functions it must, so app.js itself is never re-pushed.
// Rule: the Shotgun option exists ONLY when gameType is 'single' (SCORECARD ONLY).
// For any other mode it is removed and START falls back to #1, so a shotgun
// start can never reach a money game. Scores stay keyed by ABSOLUTE hole
// number, so the scorecard/recap still display 1-18 in order.
(function () {
    'use strict';
    if (!window.App) return;

    // --- Relative-hole math, generalized (identical to the old code for start 1 and 10) ---
    App.getAbsHole = function (rh) {
        const s = parseInt(this.d.start, 10) || 1;
        return ((s + rh - 2) % 18) + 1;
    };
    App.getRelHole = function (absH) {
        const s = parseInt(this.d.start, 10) || 1;
        return ((absH - s + 18) % 18) + 1;
    };

    // --- Navigation, generalized (copied from live app.js navH, nav block + lastH generalized) ---
    App.navH = function (d) {
                if (this.tmr) clearTimeout(this.tmr);
                if (this.strokesTmr) clearTimeout(this.strokesTmr);
                const banner = document.getElementById('auto-adv-banner');
                if (banner) banner.classList.remove('show');

                let n;
                let curH = parseInt(this.d.h);
                let startH = parseInt(this.d.start);

                if (isNaN(curH) || isNaN(startH)) {
                    console.error("Navigation Error: curH or startH is NaN", {h: this.d.h, start: this.d.start});
                    return;
                }

                if (d === 1) {
                    // SHOTGUN (v283.5): advance in play order; done after relative hole 18.
                    const rel = this.getRelHole(curH);
                    if (rel >= 18) n = 19; // Done
                    else n = this.getAbsHole(rel + 1);
                }
                else {
                    this.corr = true;
                    const rel = this.getRelHole(curH);
                    if (rel <= 1) n = curH; // cannot go before the starting hole
                    else n = this.getAbsHole(rel - 1);
                }

                if (n > 18) { 
                    alert("Done"); 
                    this.d.roundEnded = true;
                    this.save();
                    this.nav('v-card'); 
                    return; 
                }
                
                if (d === 1 && (!this.d.s[n] || Object.keys(this.d.s[n]).length === 0)) {
                    this.corr = false;
                }

                this.d.h = n;
                this.save();
                this.uDash();
                this.updateJunkUI();

                // NEXT TEE ANNOUNCEMENT (COMBO)
                if (d === 1 && !this.corr && this.d.tee === 'combo') {
                    setTimeout(() => this.announceNextTee(), 3000);
                }

                // SEGMENT JUNK PAYOUT MODAL TRIGGER
                if (d === 1 && !this.corr) {
                    const lastH = (n === 1) ? 18 : (n === 19 ? this.getAbsHole(18) : n - 1);
                    const rhLastH = this.getRelHole(lastH);
                    if (rhLastH === 6 || rhLastH === 12 || rhLastH === 18) {
                        const sIdx = (rhLastH === 6) ? 0 : (rhLastH === 12 ? 1 : 2);
                        if (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') {
                            setTimeout(() => this.announceSegmentWinner(sIdx), 30000);
                        }
                        this.showJunkPayout(sIdx);
                        if (rhLastH === 12 && (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow')) {
                            this.showStandings();
                        }
                    }
                }

                
                // HDCP STROKES ALERT
                if (d === 1 && !this.corr) {
                    this.strokesTmr = setTimeout(() => {
                        const hIdx = this.d.h - 1;
                        let strokedPlayers = [];
                        for (let i = 0; i < 4; i++) {
                            if (this.d.ps[i] && this.getPops(i, hIdx) > 0) {
                                strokedPlayers.push(this.d.ps[i].trim());
                            }
                        }
                        if (strokedPlayers.length > 0) {
                            let namesStr = "";
                            if (strokedPlayers.length === 1) namesStr = strokedPlayers[0] + " has";
                            else if (strokedPlayers.length === 2) namesStr = strokedPlayers[0] + " and " + strokedPlayers[1] + " have";
                            else if (strokedPlayers.length === 3) namesStr = strokedPlayers[0] + ", " + strokedPlayers[1] + " and " + strokedPlayers[2] + " have";
                            else if (strokedPlayers.length === 4) namesStr = "Everyone has";
                            
                            this.speak(namesStr + " strokes on this next hole. Be sure everyone knows!");
                        }
                    }, 15000);
                }

                this.corr = false;
            };

    // --- Shotgun setup UI: gated to SCORECARD ONLY ---
    App.syncShotgunUI = function () {
        const modeEl = document.getElementById('g-mode-top') || document.getElementById('g-mode');
        const mode = modeEl ? modeEl.value : this.d.gameType;
        const startEl = document.getElementById('s-start');
        const holeEl = document.getElementById('s-shotgun-hole');
        if (!startEl) return;
        let shotOpt = startEl.querySelector('option[value="shotgun"]');
        if (mode !== 'single') {
            if (shotOpt) shotOpt.remove();
            if (holeEl) holeEl.style.display = 'none';
            const wrap0 = document.getElementById('s-shotgun-wrap');
            if (wrap0) wrap0.style.display = 'none';
            if (startEl.value === 'shotgun' || startEl.value === '') startEl.value = '1';
            return;
        }
        if (!shotOpt) {
            shotOpt = document.createElement('option');
            shotOpt.value = 'shotgun';
            shotOpt.textContent = 'Shotgun\u2026';
            startEl.appendChild(shotOpt);
        }
        // Restore a saved shotgun round/setup: start is a hole other than #1/#10.
        const savedShot = !!this.d.shotgun || (typeof this.d.start === 'number' && this.d.start !== 1 && this.d.start !== 10);
        if (savedShot && startEl.value !== 'shotgun') {
            startEl.value = 'shotgun';
            if (holeEl) holeEl.value = String(this.d.start);
        }
        if (holeEl) holeEl.style.display = (startEl.value === 'shotgun') ? 'block' : 'none';
        const wrap1 = document.getElementById('s-shotgun-wrap');
        if (wrap1) wrap1.style.display = (startEl.value === 'shotgun') ? 'block' : 'none';
    },

    App.onStartChange = function (el) {
        this.syncShotgunUI();
        if (el.value === 'shotgun') {
            const he = document.getElementById('s-shotgun-hole');
            if (he) he.focus();
        }
    },

    // Valid hole from the Shotgun input, or null.
    App.shotgunHole = function () {
        const he = document.getElementById('s-shotgun-hole');
        if (!he) return null;
        const raw = (he.value || '').trim();
        if (raw === '') return null;
        const hole = parseInt(raw, 10);
        if (isNaN(hole) || hole < 1 || hole > 18 || String(hole) !== raw) return null;
        return hole;
    },

    // Temporarily give s-start a numeric option so the original code, which
    // reads s-start.value, picks up a shotgun hole. Returns the temp option (or null).
    App._shotgunTempOption = function (hole) {
        const startEl = document.getElementById('s-start');
        if (!startEl) return null;
        let opt = startEl.querySelector('option[value="' + hole + '"]');
        if (opt) return null;
        opt = document.createElement('option');
        opt.value = String(hole);
        opt.textContent = '#' + hole;
        startEl.appendChild(opt);
        return opt;
    };

    // --- Wrappers (originals captured, behaviour unchanged except as noted) ---
    const _origMode = App.onGameModeChange;
    App.onGameModeChange = function (el) {
        _origMode.call(this, el);
        this.syncShotgunUI();
        this.syncCcTeamUI();
    };

    const _origRestore = App.restoreSet;
    App.restoreSet = function () {
        _origRestore.call(this);
        this.syncShotgunUI();
        this.syncCcTeamUI();
    };

    // --- Captain's Choice 1-team-of-4 (SCORECARD ONLY + Capt. Choice ONLY) ---
    // New choice, visible only when gameType is 'single' AND scoringMode is 'cc'.
    // Default is 'two' (current 2-teams-of-2 behavior, preserved exactly);
    // 'four' means all 4 players are ONE team. cc_match and all money games
    // are untouched: isTeamCC4() is false for them, so every override below
    // falls through to the original behavior.
    App.isTeamCC4 = function () {
        return this.d.gameType === 'single' && this.d.scoringMode === 'cc' && this.d.ccTeam === 'four';
    };
    App.syncCcTeamUI = function () {
        const box = document.getElementById('cc-team-box');
        const sel = document.getElementById('s-cc-team');
        if (!box || !sel) return;
        const eligible = (this.d.gameType === 'single' && this.d.scoringMode === 'cc');
        box.style.display = eligible ? 'block' : 'none';
        if (eligible) sel.value = this.d.ccTeam || 'two';
    };
    App.onCcTeamChange = function (el) {
        this.d.ccTeam = el ? el.value : 'two';
        if (this.d.ccTeam !== 'four') this.d.ccTeam = 'two';
        this.save();
        this.uDash();
    };
    const _origScoring = App.setScoringMode;
    App.setScoringMode = function (mode) {
        _origScoring.call(this, mode);
        this.syncCcTeamUI();
    };

    const _origStart = App.startRound;
    App.startRound = async function (keepScores) {
        const modeEl = document.getElementById('g-mode-top');
        const gt = modeEl ? modeEl.value : (this.d.gameType || 'cod');
        // Capture the CC team choice (Scorecard Only + Capt. Choice only);
        // anything else defaults to the current 2-team behavior.
        const ccSel = document.getElementById('s-cc-team');
        this.d.ccTeam = (gt === 'single' && this.d.scoringMode === 'cc' && ccSel && ccSel.value === 'four') ? 'four' : 'two';
        const startEl = document.getElementById('s-start');
        const isShot = !!(startEl && startEl.value === 'shotgun');
        if (gt !== 'single' || !isShot) {
            // Defense in depth: a shotgun selection must never start a money game.
            if (isShot && startEl) startEl.value = '1';
            this.d.shotgun = false;
            return _origStart.call(this, keepScores);
        }
        const hole = this.shotgunHole();
        if (hole === null) {
            alert('Shotgun start: enter a hole number from 1 to 18.');
            return;
        }
        const tmp = this._shotgunTempOption(hole);
        if (startEl) startEl.value = String(hole);
        // Set the flag BEFORE the original runs, so the dashboard render
        // inside startRound already shows the play position.
        this.d.shotgun = true;
        try {
            await _origStart.call(this, keepScores);
        } finally {
            if (tmp) tmp.remove();
            if (this.d.start !== hole) this.d.shotgun = false;
            this.syncShotgunUI();
        }
    };

    const _origReset = App.resetScores;
    App.resetScores = function () {
        const startEl = document.getElementById('s-start');
        const isShot = !!(startEl && startEl.value === 'shotgun');
        let tmp = null;
        if (isShot) {
            const hole = this.shotgunHole();
            if (hole !== null && this.d.gameType === 'single') {
                tmp = this._shotgunTempOption(hole);
                if (startEl) startEl.value = String(hole);
            } else if (startEl) {
                startEl.value = '1';
            }
        }
        _origReset.call(this);
        if (tmp) tmp.remove();
        this.d.shotgun = !!(isShot && this.d.gameType === 'single' && this.shotgunHole() !== null);
        this.syncShotgunUI();
    };

    const _origDash = App.uDash;
    App.uDash = function () {
        _origDash.call(this);
        // VISUAL FIX (Oct 30): large hole number directly under the tee label,
        // updated on every uDash call for all tees/modes. Just "HOLE n" (30px)
        // so it stays readable and never wraps, unlike the full shotgun string.
        const underTee = document.getElementById('d-h-num-under-tee');
        if (underTee && this.d.h != null) underTee.innerText = 'HOLE ' + this.d.h;
        // 1-team-of-4 dashboard: original uDash (isTeamCC) shows team cards
        // for slots 0 and 2. For one team, hide the second team card and
        // relabel the first with all four players. Its score/relScore already
        // come from player 0, which mirroring keeps equal to the team score.
        if (this.isTeamCC4 && this.isTeamCC4()) {
            const ec2 = document.getElementById('slot-2');
            if (ec2) {
                ec2.style.display = 'none';
                const jr = ec2.nextElementSibling;
                if (jr) jr.style.display = 'none';
            }
            const nm0 = document.getElementById('nm-0');
            if (nm0) {
                const names = [0, 1, 2, 3].map(i => this.d.ps[i]).filter(Boolean);
                // VISUAL FIX (Oct 30): two lines (pair 1 / pair 2) so the
                // 4-name label cannot overflow its card and cover holes.
                const label = names.slice(0, 2).join(' & ') + (names.length > 2 ? '<br>' + names.slice(2).join(' & ') : '');
                // Preserve the trailing relScore span the original inserted.
                const span = nm0.querySelector('span');
                nm0.innerHTML = label + (span ? ' ' + span.outerHTML : '');
            }
        }
        if (this.d.shotgun) {
            const el = document.getElementById('d-h-num');
            if (el) {
                const rel = this.getRelHole(this.d.h);
                el.innerText = 'HOLE ' + this.d.h + ' \u00b7 ' + rel + ' of 18 \u00b7 START #' + this.d.start;
            }
        }
    };

    // History/share triggers in app3.js check d.h >= 18, which misfires for a
    // shotgun round (its last hole is usually not 18). For a COMPLETED round
    // (roundEnded, set by navH's Done path) with h !== 18, save once first;
    // the original then will not double-save, because its own h >= 18 check
    // is false in exactly that case. Start #1/#10 behaviour is untouched.
    const _preSaveIfComplete = function () {
        if (this.d.roundEnded && this.d.h !== 18 && !this.d.gameId) this.saveToHistory();
    };
    const _origShare = App.share;
    App.share = async function () {
        _preSaveIfComplete.call(this);
        return _origShare.call(this);
    };
    const _origRonnie = App.ronnieSimple;
    App.ronnieSimple = function () {
        _preSaveIfComplete.call(this);
        return _origRonnie.call(this);
    };
    const _origExport = App.exportRound;
    App.exportRound = function () {
        _preSaveIfComplete.call(this);
        return _origExport.call(this);
    };

    // --- TEST button (v283.5 fix): testFill navigation, generalized ---
    // Live app.js testFill still uses the old start-10/else navigation, so a
    // Shotgun round starting at #8 filled 8-18, then jumped to the card,
    // leaving 1-7 blank. This override copies live testFill's score-filling
    // behavior exactly (5 holes per click, par-based random scores capped at
    // double bogey, junk, cc_match partner mirroring) and changes ONLY the
    // navigation: advance in play order via getRelHole/getAbsHole, wrapping
    // 18->1, and end (save + nav to card) only after relative hole 18.
    // For starts #1 and #10 the new navigation is identical to the old code.
    App.testFill = function () {
        try {
            this.d.isTestMode = true;
            const c = CS[this.d.crs] || CS['cc'];
            if (!this.d.ps[0]) { alert("Start round first!"); return; }
            if (Object.keys(this.slotMap).length === 0) {
                [0, 1, 2, 3].forEach(i => this.slotMap[i] = i);
            }
            for (let i = 0; i < 5; i++) {
                const hIdx = this.d.h - 1;
                const par = c.p[hIdx];
                const hAlloc = c.hcp[hIdx];
                if (!this.d.s[this.d.h]) this.d.s[this.d.h] = {};
                [0, 1, 2, 3].forEach(p => {
                    const pid = (this.slotMap[p] !== undefined) ? this.slotMap[p] : p;
                    if (!this.d.ps[pid]) return;
                    const pops = this.getPops(p, hIdx, true);
                    const exp = par + pops;
                    const rv = Math.random();
                    let v = 0;
                    if (rv < 0.01) v = -2;
                    else if (rv < 0.20) v = -1;
                    else if (rv < 0.80) v = 0;
                    else if (rv < 0.95) v = 1;
                    else v = 2;
                    let s = exp + v;
                    const max = par + 2;
                    if (s > max) s = max;
                    this.d.s[this.d.h][pid] = Math.max(1, s);
                    ['G', 'S', 'P'].forEach(t => {
                        if (Math.random() < 0.03) {
                            if (t === 'G' && par !== 3) return;
                            if (!this.d.junk) this.d.junk = {};
                            if (!this.d.junk[this.d.h]) this.d.junk[this.d.h] = {};
                            this.d.junk[this.d.h][pid + '_' + t] = true;
                        }
                    });
                });
                if (this.d.gameType === 'cc_match') {
                    const p0 = this.slotMap[0] !== undefined ? this.slotMap[0] : 0;
                    const p1 = this.slotMap[1] !== undefined ? this.slotMap[1] : 1;
                    const p2 = this.slotMap[2] !== undefined ? this.slotMap[2] : 2;
                    const p3 = this.slotMap[3] !== undefined ? this.slotMap[3] : 3;
                    if (this.d.s[this.d.h][p0] !== undefined) this.d.s[this.d.h][p1] = this.d.s[this.d.h][p0];
                    if (this.d.s[this.d.h][p2] !== undefined) this.d.s[this.d.h][p3] = this.d.s[this.d.h][p2];
                }
                // Generalized navigation (was: start-10 special-case, else 18 -> Done).
                const rel = this.getRelHole(parseInt(this.d.h));
                const nextH = (rel >= 18) ? 99 : this.getAbsHole(rel + 1);
                if (nextH === 99) {
                    this.save();
                    this.nav('v-card');
                    return;
                }
                this.d.h = nextH;
            }
            this.save();
            this.uDash();
        } catch (e) {
            alert("Test Error: " + e.message);
        }
    };

    // --- 1-team score entry mirroring (mod / setPar) ---
    // Copies of live app.js mod/setPar, with one change: when isTeamCC4(),
    // the entered score is set for ALL FOUR players (not just the partner).
    // Otherwise the original partner-mirror and cc_match logic run unchanged.
    App.mod = function (idx, delta) {
        if (!this.d.s[this.d.h]) this.d.s[this.d.h] = {};
        const pid = this.slotMap[idx];
        const par = CS[this.d.crs].p[this.d.h - 1];
        let s = this.d.s[this.d.h][pid] || par;
        s += delta;
        if (s < 1) s = 1;
        if (s > par + 2) s = par + 2;
        this.d.s[this.d.h][pid] = s;
        if (this.isTeamCC4 && this.isTeamCC4()) {
            [0, 1, 2, 3].forEach(i => {
                const pp = this.slotMap[i];
                if (this.d.ps[pp]) this.d.s[this.d.h][pp] = s;
            });
        } else if (this.d.scoringMode === 'cc') {
            const partnerIdx = (idx === 0) ? 1 : (idx === 1 ? 0 : (idx === 2 ? 3 : 2));
            const pPid = this.slotMap[partnerIdx];
            this.d.s[this.d.h][pPid] = s;
        }
        if (this.d.gameType === 'cc_match') {
            const p1 = this.slotMap[0];
            const p2 = this.slotMap[1];
            const p3 = this.slotMap[2];
            const p4 = this.slotMap[3];
            if (idx === 0) { this.d.s[this.d.h][p1] = s; this.d.s[this.d.h][p2] = s; }
            else if (idx === 2) { this.d.s[this.d.h][p3] = s; this.d.s[this.d.h][p4] = s; }
        }
        this.save();
        this.uDash();
        this.checkAuto();
    };
    App.setPar = function (idx) {
        if (!this.d.s[this.d.h]) this.d.s[this.d.h] = {};
        const pid = this.slotMap[idx];
        const s = CS[this.d.crs].p[this.d.h - 1];
        this.d.s[this.d.h][pid] = s;
        if (this.isTeamCC4 && this.isTeamCC4()) {
            [0, 1, 2, 3].forEach(i => {
                const pp = this.slotMap[i];
                if (this.d.ps[pp]) this.d.s[this.d.h][pp] = s;
            });
        } else if (this.d.scoringMode === 'cc') {
            const partnerIdx = (idx === 0) ? 1 : (idx === 1 ? 0 : (idx === 2 ? 3 : 2));
            const pPid = this.slotMap[partnerIdx];
            this.d.s[this.d.h][pPid] = s;
        }
        if (this.d.gameType === 'cc_match') {
            const p1 = this.slotMap[0];
            const p2 = this.slotMap[1];
            const p3 = this.slotMap[2];
            const p4 = this.slotMap[3];
            if (idx === 0) { this.d.s[this.d.h][p1] = s; this.d.s[this.d.h][p2] = s; }
            else if (idx === 2) { this.d.s[this.d.h][p3] = s; this.d.s[this.d.h][p4] = s; }
        }
        this.save();
        this.uDash();
        this.checkAuto();
    };

    // --- 1-team card / gross totals (copies of live app2.js renderers) ---
    if (!App._origScorecardHTML) App._origScorecardHTML = App.getScorecardHTML;
    if (!App._origGrossHTML) App._origGrossHTML = App.getGrossTotalsHTML;
    // Identical to the originals except: when isTeamCC4(), playerIndices is
    // [0] (one team row), the label joins all four players, and pops use
    // the max across all four players. Otherwise the originals are used.
    App.getScorecardHTML = function () {
        if (!(this.isTeamCC4 && this.isTeamCC4())) return App._origScorecardHTML ? App._origScorecardHTML.call(this) : '';
        const c = CS[this.d.crs] || CS['cc'];
        const build9 = (startH, label) => {
            let hH = '<tr><th>#</th>';
            for (let n = startH; n < startH + 9; n++) {
                let l = (this.d.nines && n > 9) ? (n - 9) + '/' + n : n;
                hH += '<th style="font-size:' + ((l.toString().length > 2) ? '8px' : '11px') + '">' + l + '</th>';
            }
            hH += '<th>' + (startH === 1 ? 'OUT' : 'IN') + '</th>';
            if (startH === 10) hH += '<th>TOT</th>';
            hH += '</tr>';
            let hP = '<tr class="par-row"><td>PAR</td>';
            let totP = 0;
            for (let n = startH; n < startH + 9; n++) { hP += '<td>' + c.p[n - 1] + '</td>'; totP += c.p[n - 1]; }
            hP += '<td>' + totP + '</td>';
            if (startH === 10) {
                let grandP = c.p.slice(0, 18).reduce((a, b) => a + b, 0);
                hP += '<td>' + grandP + '</td>';
            }
            hP += '</tr>';
            let pRows = '';
            const names = [0, 1, 2, 3].map(i => this.d.ps[i]).filter(Boolean);
            // VISUAL FIX (Oct 30): two lines (pair 1 / pair 2), smaller font
            // and wrapping, so the label stays in its column and cannot
            // cover holes 1-2 as the single-line 4-name label did.
            const shortLabel = names.slice(0, 2).map(n => n.substring(0, 3)).join('/') + (names.length > 2 ? '<br>' + names.slice(2).map(n => n.substring(0, 3)).join('/') : '');
            let r = '<tr><td style="font-size:11px; line-height:1.25; white-space:normal; word-break:break-word;">' + shortLabel + '</td>';
            let tot = 0;
            for (let n = startH; n < startH + 9; n++) {
                const s = (this.d.s[n] && this.d.s[n][0]);
                const par = c.p[n - 1];
                let valHTML = '';
                if (s) {
                    tot += s;
                    const d = s - par;
                    let cls = '';
                    if (d === -1) cls = 'sc-bird';
                    else if (d <= -2) cls = 'sc-eagle';
                    else if (d === 1) cls = 'sc-bog';
                    else if (d >= 2) cls = 'sc-dbl';
                    valHTML = '<div class="sc-val ' + cls + '">' + s + '</div>';
                }
                const pops = Math.max.apply(null, [0, 1, 2, 3].map(i => this.d.ps[i] ? this.getPops(i, n - 1) : 0));
                if (pops > 0) {
                    let dStr = '';
                    for (let k = 0; k < pops; k++) dStr += '•';
                    valHTML += '<div style="font-size:16px; line-height:10px; color:#F472B6; position:absolute; bottom:2px; right:2px; letter-spacing:-2px;">' + dStr + '</div>';
                }
                r += '<td style="position:relative;">' + valHTML + '</td>';
            }
            r += '<td>' + tot + '</td>';
            if (startH === 10) {
                let grand = 0;
                for (let x = 1; x <= 18; x++) {
                    if (this.d.s[x] && typeof this.d.s[x][0] === 'number') grand += this.d.s[x][0];
                }
                r += '<td>' + (grand === 0 ? '-' : grand) + '</td>';
            }
            r += '</tr>';
            pRows += r;
            return '<div style="margin-bottom:20px;"><div style="font-size:12px; font-weight:900; color:#10B981; margin-bottom:4px; text-transform:uppercase;">' + label + '</div><div class="card-table-wrap"><table><thead>' + hH + '</thead><tbody>' + hP + pRows + '</tbody></table></div></div>';
        };
        return build9(1, 'FRONT 9') + build9(10, 'BACK 18');
    };
    App.getGrossTotalsHTML = function () {
        if (!(this.isTeamCC4 && this.isTeamCC4())) return App._origGrossHTML ? App._origGrossHTML.call(this) : '';
        let t = 0;
        for (let h = 1; h <= 18; h++) if (this.d.s[h] && this.d.s[h][0]) t += this.d.s[h][0];
        const names = [0, 1, 2, 3].map(i => this.d.ps[i]).filter(Boolean);
        const nameLabel = names.join(' & ');
        return '<div class="box" style="margin-top:0; padding:12px; background:#1E293B; border:1px solid #334155; border-radius:12px;"><div style="font-size:12px; font-weight:900; color:#10B981; margin-bottom:8px; text-transform:uppercase;">Gross Totals</div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;"><div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:8px 12px; border-radius:8px; border:1px solid #334155;"><span style="font-size:12px; font-weight:700; color:#FFFFFF; text-transform:uppercase;">' + nameLabel + '</span><span style="font-size:15px; font-weight:900; color:white;">' + (t || '-') + '</span></div></div></div>';
    };

    // Run the gate once the app has finished its own window-load init
    // (app3.js registers its init listener before this file runs).
    window.addEventListener('load', function () {
        setTimeout(function () { try { App.syncShotgunUI(); } catch (e) {} }, 100);
    });
})();
