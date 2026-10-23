// COD Golf — Tee Name Tags (v281.3)
// Purpose: courses whose real tee names are not plain colors (e.g. River Hills
// "Garnet" stored under the internal key "blue") can carry a small name-tag map
// in their course data:
//     "tn": { "blue": "Garnet", "gold": "Carolina Blue", "red": "Purple" }
//     "th": [ "white" ]            // optional: internal keys to hide in the picker
// Internal keys, saved rounds, handicaps and combo logic are NEVER changed —
// this file only changes what the player SEES: picker labels, the in-round tee
// banner, and the share-card header. One generic lookup, no per-course code.
(function () {
    'use strict';

    var COLOR_LABELS = {
        black: 'Black', blue: 'Blue', white: 'White', gold: 'Gold',
        orange: 'Orange', green: 'Green', red: 'Red', teal: 'Teal', combo: 'Combo'
    };

    function teeLabel(course, key) {
        if (!key) return '';
        if (course && course.tn && course.tn[key]) return course.tn[key];
        return COLOR_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
    }

    function currentCourse() {
        try {
            if (typeof CS !== 'undefined' && typeof App !== 'undefined' && App.d && App.d.crs) {
                return CS[App.d.crs] || null;
            }
        } catch (e) { /* fall through */ }
        return null;
    }

    function pickerCourse() {
        try {
            var sel = document.getElementById('s-course');
            if (sel && typeof CS !== 'undefined') return CS[sel.value] || null;
        } catch (e) { /* fall through */ }
        return null;
    }

    // --- Tee picker labels -------------------------------------------------
    function relabelPicker() {
        var sel = document.getElementById('s-tee');
        if (!sel) return;
        var c = pickerCourse();
        Array.prototype.forEach.call(sel.options, function (opt) {
            var key = opt.value;
            var label = teeLabel(c, key);
            // Show the total when the course carries a full 18-hole set for it.
            if (c && c.y && c.y[key] && c.y[key].length === 18) {
                var total = c.y[key].reduce(function (a, b) { return a + b; }, 0);
                if (total > 0) label += ' · ' + total.toLocaleString('en-US');
            }
            opt.textContent = label;
            var hidden = !!(c && c.th && c.th.indexOf(key) !== -1);
            opt.hidden = hidden;
            if (hidden) opt.disabled = true;
        });
        // If the current selection just became hidden/disabled, move to the
        // first usable option (mirrors the app's own fallback behaviour).
        if (sel.selectedIndex >= 0) {
            var cur = sel.options[sel.selectedIndex];
            if (cur && (cur.hidden || cur.disabled)) {
                for (var i = 0; i < sel.options.length; i++) {
                    if (!sel.options[i].disabled && !sel.options[i].hidden) { sel.value = sel.options[i].value; break; }
                }
            }
        }
    }

    // --- In-round tee banner ----------------------------------------------
    function fixBanner() {
        var ind = document.getElementById('d-tee-ind');
        if (!ind) return;
        var c = currentCourse();
        if (!c || !c.tn) return;
        var m = (ind.innerText || '').match(/^([A-Z]+)\s+TEE$/);
        if (!m) return;
        var key = m[1].toLowerCase();
        if (c.tn[key]) {
            ind.innerText = c.tn[key].toUpperCase() + ' TEE';
            ind.style.color = (key === 'gold') ? '#FFD700' : (key === 'green') ? '#4ade80' : '#FFFFFF';
        }
    }

    // --- Share-card header --------------------------------------------------
    function fixShareNode() {
        var c = currentCourse();
        if (!c || !c.tn) return;
        var subs = document.querySelectorAll('#share-node .sn-sub');
        Array.prototype.forEach.call(subs, function (el) {
            var parts = el.textContent.split('•');
            if (parts.length >= 3) {
                var key = parts[1].trim().toLowerCase();
                if (c.tn[key]) {
                    parts[1] = ' ' + c.tn[key].toUpperCase() + ' ';
                    el.textContent = parts.join('•');
                }
            }
        });
    }

    // Public handle for any future display spot.
    if (typeof window !== 'undefined') {
        window.TeeNames = { label: teeLabel, relabelPicker: relabelPicker };
    }

    // --- Wiring (browser only) ---------------------------------------------
    if (typeof document === 'undefined' || typeof App === 'undefined') return;

    if (App.checkCourseOptions && !App.checkCourseOptions.__tnWrapped) {
        var origCheck = App.checkCourseOptions.bind(App);
        App.checkCourseOptions = function () {
            var r = origCheck();
            try { relabelPicker(); } catch (e) { /* labels are cosmetic; never break setup */ }
            return r;
        };
        App.checkCourseOptions.__tnWrapped = true;
    }

    if (App.uDash && !App.uDash.__tnWrapped) {
        var origDash = App.uDash.bind(App);
        App.uDash = function () {
            var r = origDash();
            try { fixBanner(); } catch (e) { /* cosmetic only */ }
            return r;
        };
        App.uDash.__tnWrapped = true;
    }

    // Share cards are captured ~200-300ms after their HTML is built, so a
    // mutation fix lands well before the snapshot is taken.
    var sn = document.getElementById('share-node');
    if (sn && typeof MutationObserver !== 'undefined') {
        new MutationObserver(function () {
            try { fixShareNode(); } catch (e) { /* cosmetic only */ }
        }).observe(sn, { childList: true, subtree: true, characterData: true });
    }

    // Initial pass once the page is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { try { relabelPicker(); } catch (e) {} });
    } else {
        try { relabelPicker(); } catch (e) {}
    }
})();
