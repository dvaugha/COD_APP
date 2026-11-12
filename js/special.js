// SPECIAL EVENT format strip — v285.5 (Dan-approved Nov 12, 2026)
// v285.6 (Nov 12, 2026): banner wording trimmed at Dan's request — no star, no 'Special'; the strip is just HOLE <n> — <FORMAT> and the event name.
// v285.7 (Nov 12, 2026): special rounds — on Scramble / Modified Alternate Shot holes ONE team score completes the hole and auto-advances (wraps App.checkAuto); Better Ball holes still require every score; non-special rounds untouched.
// Loaded AFTER js/shotgun.js, so it wraps the shotgun wrappers. Sidecar only:
// app.js / app2.js / app3.js / tee-names.js / shotgun.js are never touched.
// Purpose: for special events (first preset: Veterans Day Classic at
// Meadowlands), show the current hole's format at the top of the dashboard
// and a header on the scorecard. Gated to SCORECARD ONLY ('single') and to a
// setup switch Dan turns on deliberately — with the switch off, nothing
// changes anywhere. EVERYTHING here is wrapped in try/catch: a failure in
// this file must never break the app.
(function () {
    'use strict';
    if (!window.App) return;

    // --- Presets -----------------------------------------------------------
    // segments: [firstHole, lastHole, fullName, shortName]
    // fullName is used in the big dashboard line and the card header;
    // shortName is used only in the small dashboard play-order line.
    var PRESETS = {
        vdc: {
            name: 'VETERANS DAY CLASSIC',
            segments: [
                [1, 3, 'Scramble', 'Scramble'],
                [4, 9, 'Better Ball', 'Better Ball'],
                [10, 12, 'Scramble', 'Scramble'],
                [13, 18, 'Modified Alternate Shot', 'Alt Shot']
            ]
        }
    };

    function preset() {
        try {
            return PRESETS[(App.d && App.d.specialPreset) || 'vdc'] || PRESETS.vdc;
        } catch (e) { return PRESETS.vdc; }
    }

    function formatFor(hole, short) {
        var p = preset();
        for (var i = 0; i < p.segments.length; i++) {
            var s = p.segments[i];
            if (hole >= s[0] && hole <= s[1]) return short ? s[3] : s[2];
        }
        return '';
    }

    // Rotation in hole order (card header): full names, middle-dot separated.
    function holeOrderLine() {
        var p = preset();
        return p.segments.map(function (s) {
            return s[0] + '\u2013' + s[1] + ' ' + s[2];
        }).join(' \u00b7 ');
    }

    // Rotation in play order from the round's start hole (dashboard small
    // line): walk holes in play order, group consecutive same-format holes,
    // short names, arrow separated. For start #10 this yields:
    // 10–12 Scramble → 13–18 Alt Shot → 1–3 Scramble → 4–9 Better Ball
    function playOrderLine(start) {
        var s0 = parseInt(start, 10) || 1;
        var groups = [];
        for (var k = 0; k < 18; k++) {
            var h = ((s0 + k - 1) % 18) + 1;
            var f = formatFor(h, true);
            var last = groups[groups.length - 1];
            if (last && last.fmt === f) last.end = h;
            else groups.push({ start: h, end: h, fmt: f });
        }
        return groups.map(function (g) {
            return (g.start === g.end ? String(g.start) : g.start + '\u2013' + g.end) + ' ' + g.fmt;
        }).join(' \u2192 ');
    }

    // --- Setup UI sync -----------------------------------------------------
    function currentMode() {
        var modeEl = document.getElementById('g-mode-top') || document.getElementById('g-mode');
        return modeEl ? modeEl.value : (App.d && App.d.gameType);
    }

    App.syncSpecialUI = function () {
        try {
            var box = document.getElementById('special-box');
            if (!box) return;
            var single = currentMode() === 'single';
            box.style.display = single ? 'block' : 'none';
            var wrap = document.getElementById('s-special-preset-wrap');
            var cb = document.getElementById('s-special');
            if (wrap) wrap.style.display = (single && cb && cb.checked) ? 'block' : 'none';
        } catch (e) {}
    };

    App.onSpecialChange = function (el) {
        try { App.syncSpecialUI(); } catch (e) {}
    };

    App.onSpecialPresetChange = function (el) {
        // Preset is captured into d.specialPreset at startRound; nothing to
        // persist here. Kept as a hook so the select has a handler.
    };

    // --- Wrappers (originals captured first; shotgun's wrappers are already
    // in the chain because special.js loads after shotgun.js) ---------------
    try {
        var _origMode = App.onGameModeChange;
        App.onGameModeChange = function (el) {
            _origMode.call(this, el);
            try { this.syncSpecialUI(); } catch (e) {}
        };
    } catch (e) {}

    try {
        var _origRestore = App.restoreSet;
        App.restoreSet = function () {
            _origRestore.call(this);
            try {
                // Returning-user path: sync the setup switch + preset from
                // the saved round so a resumed special round shows as on.
                var cb = document.getElementById('s-special');
                if (cb) cb.checked = !!this.d.special;
                var sel = document.getElementById('s-special-preset');
                if (sel && this.d.specialPreset) sel.value = this.d.specialPreset;
                this.syncSpecialUI();
            } catch (e) {}
        };
    } catch (e) {}

    try {
        var _origStart = App.startRound;
        App.startRound = async function (keepScores) {
            try {
                // Capture BEFORE the original runs (same pattern as the
                // shotgun flag) so renders inside startRound already see it.
                // Special can only attach to SCORECARD ONLY with the switch
                // on; every other mode forces it off for that round.
                var on = false, presetVal = '';
                if (currentMode() === 'single') {
                    var cb = document.getElementById('s-special');
                    if (cb && cb.checked) {
                        on = true;
                        var sel = document.getElementById('s-special-preset');
                        presetVal = sel ? sel.value : 'vdc';
                    }
                }
                this.d.special = on;
                this.d.specialPreset = on ? (presetVal || 'vdc') : '';
            } catch (e) {
                try { this.d.special = false; this.d.specialPreset = ''; } catch (e2) {}
            }
            return _origStart.call(this, keepScores);
        };
    } catch (e) {}

    try {
        var _origDash = App.uDash;
        App.uDash = function () {
            _origDash.call(this);
            try {
                var dash = document.getElementById('v-dash');
                if (!dash) return;
                var b = document.getElementById('special-banner');
                if (!this.d.special) {
                    if (b) b.style.display = 'none';
                    return;
                }
                if (!b) {
                    b = document.createElement('div');
                    b.id = 'special-banner';
                    b.style.cssText = 'border:2px solid #FFD700; border-radius:10px; background:rgba(255,215,0,0.10); padding:8px 10px; margin-bottom:10px; text-align:center;';
                    b.innerHTML = '<div id="special-banner-main" style="font-size:15px; font-weight:900; color:#FFD700; letter-spacing:0.5px;"></div>' +
                                  '<div id="special-banner-order" style="font-size:10px; color:#FFFFFF; margin-top:3px;"></div>';
                    var topBar = dash.querySelector('.top-bar');
                    if (topBar && topBar.nextSibling) dash.insertBefore(b, topBar.nextSibling);
                    else if (topBar) dash.appendChild(b);
                    else dash.insertBefore(b, dash.firstChild);
                }
                b.style.display = 'block';
                var h = parseInt(this.d.h, 10) || 1;
                var main = document.getElementById('special-banner-main');
                if (main) main.innerText = 'HOLE ' + h + ' \u2014 ' + formatFor(h, false).toUpperCase();
                var ord = document.getElementById('special-banner-order');
                if (ord) ord.innerText = playOrderLine(this.d.start);
            } catch (e) {}
        };
    } catch (e) {}

    try {
        var _origCard = App.uCard;
        if (typeof _origCard === 'function') {
            App.uCard = function () {
                _origCard.call(this);
                try {
                    if (!this.d.special) return;
                    var cardCon = document.getElementById('card-con-body');
                    if (!cardCon) return;
                    // uCard rewrites card-con-body's innerHTML, so prepend
                    // AFTER the original runs, every time.
                    var hdr = '<div style="border:2px solid #FFD700; border-radius:10px; background:rgba(255,215,0,0.10); padding:8px 10px; margin-bottom:12px; text-align:center;">' +
                        '<div style="font-size:14px; font-weight:900; color:#FFD700; letter-spacing:0.5px;">' + preset().name + '</div>' +
                        '<div style="font-size:11px; color:#FFFFFF; margin-top:3px;">' + holeOrderLine() + '</div></div>';
                    cardCon.innerHTML = hdr + cardCon.innerHTML;
                } catch (e) {}
            };
        }
    } catch (e) {}

    try {
        var _origCheckAuto = App.checkAuto;
        if (typeof _origCheckAuto === 'function') {
            App.checkAuto = function () {
                try {
                    // v285.7: in a special round, the team formats (Scramble,
                    // Modified Alternate Shot) produce ONE team score per
                    // hole, entered in a single player's row. The stock
                    // check waits for EVERY row, which strands the round on
                    // those holes — so while SPECIAL is on and the hole is
                    // not Better Ball, ANY active player's positive score
                    // completes the hole (same banner + 3s advance as the
                    // original). Better Ball keeps the original rule — both
                    // balls must be in before the low ball is known — and
                    // non-special rounds always run the original check.
                    if (this.d && this.d.special && formatFor(parseInt(this.d.h, 10) || 1, false) !== 'Better Ball') {
                        var s = this.d.s ? this.d.s[this.d.h] : null;
                        if (!s) { _origCheckAuto.call(this); return; }
                        var anyEntered = false;
                        for (var i = 0; i < 4; i++) {
                            if (this.d.ps && this.d.ps[i] && s[i] !== undefined && s[i] > 0) { anyEntered = true; break; }
                        }
                        var banner = document.getElementById('auto-adv-banner');
                        if (anyEntered) {
                            if (banner) banner.classList.add('show');
                            if (this.tmr) clearTimeout(this.tmr);
                            var self = this;
                            this.tmr = setTimeout(function () {
                                try { self.navH(1); } catch (e) {}
                            }, 3000);
                        } else {
                            if (banner) banner.classList.remove('show');
                            if (this.tmr) clearTimeout(this.tmr);
                        }
                        return;
                    }
                } catch (e) {}
                return _origCheckAuto.call(this);
            };
        }
    } catch (e) {}

    // Run the gate once the app has finished its own window-load init
    // (same pattern as shotgun.js).
    window.addEventListener('load', function () {
        setTimeout(function () { try { App.syncSpecialUI(); } catch (e) {} }, 100);
    });
})();
