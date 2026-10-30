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
    };

    const _origRestore = App.restoreSet;
    App.restoreSet = function () {
        _origRestore.call(this);
        this.syncShotgunUI();
    };

    const _origStart = App.startRound;
    App.startRound = async function (keepScores) {
        const modeEl = document.getElementById('g-mode-top');
        const gt = modeEl ? modeEl.value : (this.d.gameType || 'cod');
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

    // Run the gate once the app has finished its own window-load init
    // (app3.js registers its init listener before this file runs).
    window.addEventListener('load', function () {
        setTimeout(function () { try { App.syncShotgunUI(); } catch (e) {} }, 100);
    });
})();
