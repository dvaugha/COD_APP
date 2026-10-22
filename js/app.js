const App = {
            d: { roster: ["Dan", "Dave", "Eddie", "Muzzy", "Mark", "Tom", "TonyC", "JohnP", "MikeG", "Putt", "Rizzo", "Dante", "Steve", "Dom", "Lino", "BillB", "JohnT", "TonyS"], permHcps: { "Dan":13, "Dave":18, "Eddie":17, "Muzzy":14, "Mark":16, "Tom":15, "TonyC":22, "JohnP":22, "MikeG":18, "Putt":12, "Rizzo":18, "Dante":15, "Steve":12, "Dom":10, "Lino":20, "BillB":15, "TonyS":9, "JohnT":8 }, ps: ['', '', '', ''], chosen: ['', '', '', ''], bet: 5, pot: 20, gameType: 'cod', crs: 'jones', tee: 'white', start: 1, h: 1, s: {}, gameId: null, voiceEnabled: false, ghToken: '', testSyncsDone: 0, isTestMode: false, roundEnded: false, noHandicaps: false },

            ghl: function (h) {
                if (this.d.nines && h > 9) return `${h - 9}/${h}`;
                return h;
            },

            slotMap: {}, tmr: null, strokesTmr: null, corr: false, delMode: false, histEdit: false,
            selIds: [],
            wakeLock: null,
            keepAwake: async function () {
                if ('wakeLock' in navigator) {
                    try {
                        this.wakeLock = await navigator.wakeLock.request('screen');
                        console.log("WakeLock Active");
                    } catch (e) { console.log("WakeLock Err", e); }
                }
            },

            init: function () {
                const defR = [...this.d.roster];
                try {
                    let s = localStorage.getItem('COD_GOLF_DATA_v281_0');
                    if (!s) {
                        const old = localStorage.getItem('COD_GOLF_DATA_v277_0') ||
                                    localStorage.getItem('COD_GOLF_DATA_v276_0') ||
                                    localStorage.getItem('COD_GOLF_DATA_v275_22') ||
                                    localStorage.getItem('COD_GOLF_DATA_v275_21') ||
                                    localStorage.getItem('COD_GOLF_DATA_v275_20') || 
                                    localStorage.getItem('COD_GOLF_v275_20') || 
                                    localStorage.getItem('COD_GOLF_DATA_v273_0') || 
                                    localStorage.getItem('GOLF_265') ||
                                    localStorage.getItem('GOLF_241');
                        if (old) this.d = JSON.parse(old);
                    } else {
                        this.d = JSON.parse(s);
                    }

                    if (!this.d.roster || this.d.roster.length === 0) this.d.roster = defR;
                    if (!this.d.s) this.d.s = {};
                    if (!this.d.ps) this.d.ps = ['', '', '', ''];
                    
                    // Migrate 'chosen' from object to array if needed
                    if (this.d.chosen && typeof this.d.chosen === 'object' && !Array.isArray(this.d.chosen)) {
                        const newC = ['', '', '', ''];
                        Object.keys(this.d.chosen).forEach(k => newC[k] = this.d.chosen[k]);
                        this.d.chosen = newC;
                    }
                    if (!this.d.chosen || !Array.isArray(this.d.chosen)) this.d.chosen = ['', '', '', ''];
                    this.save();
                    let h = localStorage.getItem('GOLF_HISTORY_265');
                    if (h) {
                        this.historyArchive = JSON.parse(h);
                    } else if (this.historyArchive) {
                        this.historyArchive = this.historyArchive;
                        delete this.historyArchive;
                        localStorage.setItem('GOLF_HISTORY_265', JSON.stringify(this.historyArchive));
                    } else {
                        this.historyArchive = [];
                    }
                    if (!this.d.start) this.d.start = 1;
                    if (!this.d.press) this.d.press = { 0: [], 1: [], 2: [] };
                    if (!this.d.nassauPresses) this.d.nassauPresses = [];
                    if (!this.d.hcps) this.d.hcps = {};
                    if (!this.d.gameType) this.d.gameType = 'cod';
                    if (!this.d.pot) this.d.pot = 20;
                    if (!this.d.hcpMode) this.d.hcpMode = 'standard';
                    if (!this.d.permHcps) this.d.permHcps = {};
                    if (this.d.voiceEnabled === undefined) this.d.voiceEnabled = false;
                    if (this.d.testSyncsDone === undefined) this.d.testSyncsDone = 0;
                    if (this.d.ghToken === undefined) this.d.ghToken = '';
                    if (this.d.roundEnded === undefined) this.d.roundEnded = false;
                    if (this.d.noHandicaps === undefined) this.d.noHandicaps = false;
                } catch (e) { }
                this.renderRoster(); this.renderHistory(); this.refreshDrop(); this.restoreSet();

                if (this.d.crs) {
                    // Start by checking index
                    const entry = CS_INDEX[this.d.crs];
                    if (entry) {
                        this.selectCourse(this.d.crs, true).then(() => {
                            if (this.d.nines && CS[this.d.crs]) {
                                this.buildComposite(this.d.crs, this.d.nines[0], this.d.nines[1]);
                            }
                        });
                    }
                }

                if (!this.d.roundEnded && Object.keys(this.d.s).length > 0 && this.d.ps[0]) {
                    this.nav('v-dash');
                } else {
                    this.nav('v-setup');
                }
                if ('wakeLock' in navigator) {
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') this.keepAwake();
                    });
                    this.keepAwake();
                }
            },
            save: (function () {
                let t = null;
                return function () {
                    clearTimeout(t);
                    t = setTimeout(() => {
                        localStorage.setItem('COD_GOLF_DATA_v281_0', JSON.stringify(this.d));
                    }, 500);
                };
            })(),

            hardReset: function () {
                if (confirm("This will Delete History and Reset Roster. Continue?")) {
                    localStorage.removeItem('COD_GOLF_DATA_v281_0');
                    localStorage.removeItem('GOLF_HISTORY_265');
                    location.reload();
                }
            },
            saveHistoryData: function() {
                localStorage.setItem('GOLF_HISTORY_265', JSON.stringify(this.historyArchive));
            },

            tryNewGame: function (btn) {
                if (btn.innerText.includes("CONFIRM")) {
                    try {
                        this.startRound(false);
                    } catch (e) {
                        console.error("Start match error:", e);
                        alert("Error starting match: " + e.message);
                    }
                    btn.innerText = "START NEW MATCH";
                    btn.style.backgroundColor = "#EF4444";
                    return;
                }
                const oldText = btn.innerText;
                btn.innerText = "CONFIRM NEW MATCH?";
                btn.style.backgroundColor = "#B91C1C";
                setTimeout(() => {
                    if (btn.innerText.includes("CONFIRM")) {
                        btn.innerText = oldText;
                        btn.style.backgroundColor = "#EF4444";
                    }
                }, 4000);
            },

            resetScores: function () {
                this.d.s = {};
                this.d.junk = {};
                this.d.isTestMode = false; // Reset test flag
                this.d.press = { 0: [], 1: [], 2: [] };
                this.d.nassauPresses = [];
                this.d.start = parseInt(document.getElementById('s-start').value);
                this.d.h = this.d.start;
                this.d.ps = ['', '', '', ''];
                this.d.chosen = ['', '', '', ''];
                delete this.d.hcpEqualize;
                this.d.roundEnded = false;
                this.save();
                this.renderRoster();
                this.refreshDrop();
                this.restoreSet();
                this.resetCourseNames();
                this.nav('v-setup');
            },

            saveGH: function() {
                const val = document.getElementById('gh-token-input').value.trim();
                this.d.ghToken = val;
                this.save();
                alert(val ? "GitHub Token Saved!" : "GitHub Token Cleared!");
            },

            deleteGH: function() {
                if (confirm("Clear your GitHub Sync Token?")) {
                    this.d.ghToken = '';
                    document.getElementById('gh-token-input').value = '';
                    this.save();
                    alert("Token Deleted!");
                }
            },

            resetCourseNames: function () {
                this.updateActiveCourseUI();
            },

            clearSeats: function () {
                this.d.chosen = ['', '', '', ''];
                this.refreshDrop();
                this.renderRoster();
                this.save();
            },

            onGameModeChange: function (el) {
                // Sync the two dropdowns if they exist
                const other = (el.id === 'g-mode-top') ? document.getElementById('g-mode') : document.getElementById('g-mode-top');
                if (other) other.value = el.value;
                this.d.gameType = el.value;
                
                const pc = document.getElementById('pot-container');
                const potLbl = document.getElementById('pot-label');
                const potWrap = document.querySelectorAll('#s-pot');

                if (el.value === 'single') {
                    if (pc) pc.style.display = 'none';
                    document.querySelectorAll('#s-bet').forEach(i => i.value = 0);
                    potWrap.forEach(i => i.value = 0);
                    this.d.junkBet = 0;
                    if (document.getElementById('j-bet')) document.getElementById('j-bet').value = 0;
                } else if (el.value === 'cod' || el.value === 'scramble' || el.value === 'highlow') {
                    if (pc) pc.style.display = 'none';
                    document.querySelectorAll('#s-bet').forEach(i => i.value = 5); // Always default $5 for COD
                } else if (el.value === 'nassau' || el.value === 'cc_match') {
                    if (pc) pc.style.display = 'none'; // No separate pot for Nassau / CC match
                    document.querySelectorAll('#s-bet').forEach(i => i.value = (el.value === 'cc_match' ? 5 : 4));
                } else if (el.value === 'stroke') {
                    if (pc) pc.style.display = 'flex';
                    if (potLbl) potLbl.innerText = 'TOTAL POT $';
                    document.querySelectorAll('#s-bet').forEach(i => { if (i.value == 0) i.value = 5; });
                    potWrap.forEach(i => { if (i.value == 0) i.value = 20; });
                } else {
                    if (pc) pc.style.display = 'flex';
                    if (potLbl) potLbl.innerText = 'POT';
                    document.querySelectorAll('#s-bet').forEach(i => { if (i.value == 0) i.value = 5; });
                    potWrap.forEach(i => { if (i.value == 0) i.value = 20; });
                }
                this.save();
                this.restoreSet(); // Update UI
            },

            onHcpModeChange: function (el) {
                const gmEl = document.getElementById('g-mode') || document.getElementById('g-mode-top');
                const gmVal = gmEl ? gmEl.value : '';
                if ((el.value === 'spread' || el.value === 'team') && (gmVal === 'cod' || gmVal === 'highlow')) {
                    const activeNames = [0, 1, 2, 3].map(i => this.d.chosen[i]).filter(n => n);
                    const msg = el.value === 'team'
                        ? "Team Equalizer: Recalculates handicaps for EVERY 6-hole segment based on the rotating partners. This makes every match start even. Proceed?"
                        : `Would you like to spread - ${activeNames.join(' & ')} - to allow more strokes so that it is even for each segment?`;

                    if (confirm(msg)) {
                        this.d.hcpEqualize = true;
                    } else {
                        this.d.hcpEqualize = false;
                    }
                } else {
                    this.d.hcpEqualize = false;
                }
                this.d.hcpMode = el.value;
                this.save();
            },

            nav: function (id) {
                const tgt = document.getElementById(id);
                if (!tgt) return;
                document.querySelectorAll('.g-view').forEach(e => e.classList.remove('active'));
                tgt.classList.add('active');
                if (id === 'v-setup') { this.checkCourseOptions(); }
                if (id === 'v-dash') { this.uDash(); this.updateJunkUI(); }
                if (id === 'v-card') this.uCard();
                if (id === 'v-recap') this.uRecap();
            },

            toggleVoice: function (val) {
                this.d.voiceEnabled = val;
                this.save();
                if (val) this.speak("Voice alerts enabled");
            },

            toggleNoHcps: function (val) {
                this.d.noHandicaps = val;
                this.save();
            },

            speak: function (text, callback) {
                if (!this.d.voiceEnabled || !window.speechSynthesis || this.d.gameType === 'single') return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                if (callback) u.onend = callback;
                u.rate = 0.9;
                u.pitch = 1.0;

                const findVoice = () => {
                    const voices = window.speechSynthesis.getVoices();
                    if (voices.length === 0) return null;
                    const femaleKeywords = ['female', 'woman', 'hazel', 'susan', 'serena', 'libby', 'victoria', 'amy', 'martha', 'sonia', 'alice', 'google', 'catherine', 'elizabeth', 'sarah', 'moira', 'tessa', 'karen', 'stephanie', 'samantha', 'siri'];
                    const maleKeywords = ['male', 'man', 'george', 'david', 'james', 'harry', 'thomas', 'oliver', 'mark', 'daniel', 'peter', 'richard', 'albert', 'fred', 'lesya', 'olena', 'taras'];

                    const search = (locales, genderKeywords) => {
                        return voices.find(v => {
                            const n = v.name.toLowerCase();
                            const l = v.lang.toLowerCase();
                            // Look for British (GB/UK) in lang or name
                            const matchesLocale = locales.some(loc => l.includes(loc.toLowerCase()) || n.includes(loc.toLowerCase()));
                            if (!matchesLocale) return false;
                            
                            // If searching for female, check keywords
                            if (genderKeywords) {
                                // Explicitly match "Siri" + Female if possible
                                if (n.includes('siri')) return true; 
                                return genderKeywords.some(kw => n.includes(kw));
                            }
                            // Otherwise just ensure it's not a known male
                            return !maleKeywords.some(kw => n.includes(kw));
                        });
                    };

                    // 1. British Female (High Priority: Siri/Hazel/etc)
                    let v = search(['gb', 'british', 'united kingdom'], femaleKeywords);
                    // 2. British Any (Non-male)
                    if (!v) v = search(['gb', 'british', 'united kingdom'], null);
                    // 3. Fallback: Irish/Australian Female
                    if (!v) v = search(['ie', 'ireland', 'au', 'australia'], femaleKeywords);
                    
                    return v;
                };

                const gbVoice = findVoice();
                if (gbVoice) u.voice = gbVoice;

                window.speechSynthesis.speak(u);
            },

            testVoice: function () {
                if (!window.speechSynthesis) return;
                const voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) {
                    window.speechSynthesis.getVoices();
                    setTimeout(() => this.testVoice(), 100);
                    return;
                }

                const femaleKeywords = ['female', 'woman', 'hazel', 'susan', 'serena', 'libby', 'victoria', 'amy', 'martha', 'sonia', 'alice', 'google', 'catherine', 'elizabeth', 'sarah', 'moira', 'tessa', 'karen', 'stephanie', 'samantha', 'siri'];
                const maleKeywords = ['male', 'man', 'george', 'david', 'james', 'harry', 'thomas', 'oliver', 'mark', 'daniel', 'peter', 'richard', 'albert', 'fred', 'lesya', 'olena', 'taras'];

                const search = (locales, genderKeywords) => {
                    return voices.find(v => {
                        const n = v.name.toLowerCase();
                        const l = v.lang.toLowerCase();
                        const matchesLocale = locales.some(loc => l.includes(loc.toLowerCase()) || n.includes(loc.toLowerCase()));
                        if (!matchesLocale) return false;
                        if (genderKeywords) {
                            if (n.includes('siri')) return true;
                            return genderKeywords.some(kw => n.includes(kw));
                        }
                        return !maleKeywords.some(kw => n.includes(kw));
                    });
                };

                let gbVoice = search(['gb', 'british', 'united kingdom'], femaleKeywords);
                if (!gbVoice) gbVoice = search(['gb', 'british', 'united kingdom'], null);
                if (!gbVoice) gbVoice = search(['ie', 'ireland', 'au', 'australia'], femaleKeywords);

                const u = new SpeechSynthesisUtterance("Hello! This is a test of the British female voice. How does it sound?");
                if (gbVoice) u.voice = gbVoice;

                u.rate = 0.9;
                u.pitch = 1.1;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            },

            
            navH: function (d) {
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
                    if (startH === 10) {
                        if (curH === 18) n = 1;
                        else if (curH === 9) n = 19; // Done
                        else n = curH + 1;
                    } else {
                        n = curH + 1;
                    }
                }
                else {
                    this.corr = true;
                    if (startH === 10) {
                        if (curH === 1) n = 18;
                        else if (curH === 10) n = 10;
                        else n = curH - 1;
                    } else {
                        if (curH === 1) n = 1;
                        else n = curH - 1;
                    }
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
                    const lastH = (n === 1) ? 18 : (n === 19 ? (this.d.start === 10 ? 9 : 18) : n - 1);
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
            },

            announceSegmentWinner: function (sIdx) {
                if (!this.d.voiceEnabled) return;
                
                const res = this.calcSegResults(sIdx)[0]; // Main match
                const segs = [
                    { t1: [0, 1], t2: [2, 3] },
                    { t1: [0, 3], t2: [1, 2] },
                    { t1: [0, 2], t2: [1, 3] }
                ];
                const team = segs[sIdx];
                const n1 = `${this.d.ps[team.t1[0]]} and ${this.d.ps[team.t1[1]]}`;
                const n2 = `${this.d.ps[team.t2[0]]} and ${this.d.ps[team.t2[1]]}`;

                let winnerMsg = "";
                if (res.winner === 1) {
                    winnerMsg = `Attention! Team ${n1} have won Segment ${sIdx + 1}!`;
                } else if (res.winner === 2) {
                    winnerMsg = `Attention! Team ${n2} have won Segment ${sIdx + 1}!`;
                } else {
                    winnerMsg = `Segment ${sIdx + 1} has ended in a push. All square!`;
                }

                // If moving to a next segment, we need to sequence the partnership announcement
                if (sIdx < 2 && (this.d.gameType === 'cod' || this.d.gameType === 'highlow')) {
                    const ps = this.d.ps;
                    let nextMsg = "";
                    if (sIdx === 0) { // Moving to Seg 2
                        nextMsg = `Attention! Segment Two: Opposites. ${ps[0]} and ${ps[3]} are now partners, versus ${ps[1]} and ${ps[2]}.`;
                    } else if (sIdx === 1) { // Moving to Seg 3
                        nextMsg = `Attention! Final Segment: Drivers. ${ps[0]} and ${ps[2]} are now partners, versus ${ps[1]} and ${ps[3]}.`;
                    }
                    
                    // Sequence them: Winner then Partnership
                    this.speakSequence([winnerMsg, nextMsg]);
                } else {
                    this.speak(winnerMsg);
                }
            },

            speakSequence: function (messages) {
                if (!messages || messages.length === 0) return;
                const msg = messages.shift();
                
                // We use a custom version of speak that returns a promise or uses a callback
                this.speak(msg, () => {
                    if (messages.length > 0) {
                        setTimeout(() => this.speakSequence(messages), 2000);
                    }
                });
            },

            announceNextTee: function() {
                if (!this.d.voiceEnabled || this.d.tee !== 'combo') return;
                const c = CS[this.d.crs];
                if (!c) return;

                const hIdx = this.d.h - 1; // Current hole (which was just incremented in navH)
                let isGold = false;
                const hasCmb = (c.cmb && c.cmb.length === 18);
                const hasHcp = (c.hcp && c.hcp.length === 18);

                if (this.d.crs === 'cc' && hasCmb) isGold = (c.cmb[hIdx] === 1);
                else if (hasHcp) isGold = (c.hcp[hIdx] <= 9);
                else if (hasCmb) isGold = (c.cmb[hIdx] === 1);

                if (isGold) {
                    if (this.d.crs === 're') {
                        this.speak("Attention! Next hole is a Green tee. Move to the green markers.");
                    } else {
                        this.speak("Attention! Next hole is a Gold tee. Move to the gold markers.");
                    }
                }
            },


             mod: function (idx, delta) {
                if (!this.d.s[this.d.h]) this.d.s[this.d.h] = {};
                const pid = this.slotMap[idx];
                const par = CS[this.d.crs].p[this.d.h - 1];
                let s = this.d.s[this.d.h][pid] || par;
                s += delta;
                if (s < 1) s = 1;
                if (s > par + 2) s = par + 2; // Cap at Double Bogey
                this.d.s[this.d.h][pid] = s;

                // Captain's Choice Auto-Fill
                if (this.d.scoringMode === 'cc') {
                    const partnerIdx = (idx === 0) ? 1 : (idx === 1 ? 0 : (idx === 2 ? 3 : 2));
                    const pPid = this.slotMap[partnerIdx];
                    this.d.s[this.d.h][pPid] = s;
                }

                if (this.d.gameType === 'cc_match') {
                    const p1 = this.slotMap[0];
                    const p2 = this.slotMap[1];
                    const p3 = this.slotMap[2];
                    const p4 = this.slotMap[3];
                    if (idx === 0) {
                        this.d.s[this.d.h][p1] = s;
                        this.d.s[this.d.h][p2] = s;
                    } else if (idx === 2) {
                        this.d.s[this.d.h][p3] = s;
                        this.d.s[this.d.h][p4] = s;
                    }
                }

                this.save();
                this.uDash();
                this.checkAuto();
            },
            setPar: function (idx) {
                if (!this.d.s[this.d.h]) this.d.s[this.d.h] = {};
                const pid = this.slotMap[idx];
                const s = CS[this.d.crs].p[this.d.h - 1];
                this.d.s[this.d.h][pid] = s;

                // Captain's Choice Auto-Fill
                if (this.d.scoringMode === 'cc') {
                    const partnerIdx = (idx === 0) ? 1 : (idx === 1 ? 0 : (idx === 2 ? 3 : 2));
                    const pPid = this.slotMap[partnerIdx];
                    this.d.s[this.d.h][pPid] = s;
                }

                if (this.d.gameType === 'cc_match') {
                    const p1 = this.slotMap[0];
                    const p2 = this.slotMap[1];
                    const p3 = this.slotMap[2];
                    const p4 = this.slotMap[3];
                    if (idx === 0) {
                        this.d.s[this.d.h][p1] = s;
                        this.d.s[this.d.h][p2] = s;
                    } else if (idx === 2) {
                        this.d.s[this.d.h][p3] = s;
                        this.d.s[this.d.h][p4] = s;
                    }
                }

                this.save();
                this.uDash();
                this.checkAuto();
            },
            checkAuto: function () {
                const s = this.d.s[this.d.h];
                if (!s) return;
                
                let enteredCount = 0;
                let allPositive = true;
                let activeCount = 0;
                
                const indices = this.d.gameType === 'cc_match' ? [0, 2] : [0, 1, 2, 3];
                indices.forEach(i => {
                    if (this.d.ps[i]) {
                        activeCount++;
                        if (s[i] === undefined || s[i] <= 0) {
                            allPositive = false;
                        } else {
                            enteredCount++;
                        }
                    }
                });

                if (activeCount > 0 && enteredCount === activeCount && allPositive) {
                    const banner = document.getElementById('auto-adv-banner');
                    if (banner) banner.classList.add('show');
                    if (this.tmr) clearTimeout(this.tmr);
                    this.tmr = setTimeout(() => { 
                        try {
                            this.navH(1); 
                        } catch (e) {
                            console.error("Auto-Forward Error:", e);
                        }
                    }, 3000);
                } else {
                    const banner = document.getElementById('auto-adv-banner');
                    if (banner) banner.classList.remove('show');
                    if (this.tmr) clearTimeout(this.tmr);
                }
            },

            testFill: function () {
                try {
                    this.d.isTestMode = true; // Mark as test
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
                            // Variance: Tuned v253.1 - Handicap Based
                            // Exp = Par + Strokes
                            const pops = this.getPops(p, hIdx, true);
                            const exp = par + pops;
                            const rv = Math.random();
                            let v = 0;
                            // 1% Eagle, 19% Birdie, 60% Par, 15% Bogey, 5% Double
                            if (rv < 0.01) v = -2;
                            else if (rv < 0.20) v = -1;
                            else if (rv < 0.80) v = 0;
                            else if (rv < 0.95) v = 1;
                            else v = 2;

                            let s = exp + v;
                            const max = par + 2;
                            if (s > max) s = max; // Cap at Double Bogey

                            this.d.s[this.d.h][pid] = Math.max(1, s);
                            // Random Junk for Testing
                            ['G', 'S', 'P'].forEach(t => {
                                if (Math.random() < 0.03) {
                                    // Respect Greenies Par 3 Rule in Test
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

                        // Navigate Forward correctly matching the back 9 nav logic
                        let nextH;
                        let curH = parseInt(this.d.h);
                        let startH = parseInt(this.d.start);
                        if (startH === 10) {
                            if (curH === 18) nextH = 1;
                            else if (curH === 9) nextH = 99;
                            else nextH = curH + 1;
                        } else {
                            if (curH === 18) nextH = 99;
                            else nextH = curH + 1;
                        }
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
            },

            toggleDelMode: function () { this.delMode = !this.delMode; const b = document.getElementById('del-mode-btn'), l = document.getElementById('roster-list'), s = document.getElementById('del-status'); if (this.delMode) { b.innerText = "DONE DELETING"; b.style.background = "#EF4444"; l.classList.add('del-mode'); s.style.display = "block"; } else { b.innerText = "ENABLE DELETE MODE"; b.style.background = "#334155"; l.classList.remove('del-mode'); s.style.display = "none"; } },
            renderRoster: function () { 
                const c = document.getElementById('roster-list'); 
                if (!c) return;
                c.innerHTML = ''; 
                this.d.roster.sort().forEach(p => { 
                    const isSelected = this.d.chosen.includes(p);
                    const d = document.createElement('div');
                    d.className = 'chip' + (isSelected ? ' active-g' : '');
                    d.innerHTML = `<div class="chip-lbl">${p}</div>`;
                    d.onclick = () => this.onRosterClick(p);
                    c.appendChild(d);
                }); 
            },
            onRosterClick: function (p) {
                if (this.delMode) { this.delP(p); return; }
                const idx = this.d.chosen.indexOf(p);
                if (idx !== -1) {
                    this.d.chosen[idx] = '';
                } else {
                    const empty = this.d.chosen.indexOf('');
                    if (empty !== -1) this.d.chosen[empty] = p;
                }
                this.save();
                this.refreshDrop();
                this.renderRoster();
            },
            clickRoster: function (p) { if (this.delMode) this.delP(p); },
            addRoster: function () { const el = document.getElementById('new-p-name'); const v = el.value.trim(); if (v && !this.d.roster.includes(v)) { this.d.roster.push(v); el.value = ''; this.save(); this.renderRoster(); this.refreshDrop(); } },
            delP: function (p) { this.d.roster = this.d.roster.filter(n => n !== p); this.save(); this.renderRoster(); this.refreshDrop(); },
            refreshDrop: function () { [0, 1, 2, 3].forEach(i => { const el = document.getElementById('sel-' + i); const c = this.d.chosen[i]; const u = [];[0, 1, 2, 3].forEach(k => { if (k !== i && this.d.chosen[k]) u.push(this.d.chosen[k]) }); const o = this.d.roster.filter(n => !u.includes(n)); if (c && !u.includes(c) && !o.includes(c) && this.d.roster.includes(c)) o.push(c); let h = '<option value="">--</option>'; o.forEach(x => { h += `<option value="${x}" ${x === c ? 'selected' : ''}>${x}</option>` }); el.innerHTML = h; el.value = c; }); },
            onRole: function () { [0, 1, 2, 3].forEach(i => this.d.chosen[i] = document.getElementById('sel-' + i).value); this.save(); this.refreshDrop(); },
            openHcpModal: function () {
                const c = document.getElementById('hcp-roster');
                c.innerHTML = '';
                [0, 1, 2, 3].forEach(i => {
                    const p = this.d.chosen[i];
                    let v = '';
                    if (p) {
                        if (this.d.hcps && this.d.hcps[p] !== undefined) v = this.d.hcps[p];
                        else if (this.d.permHcps && this.d.permHcps[p] !== undefined) v = this.d.permHcps[p];
                    }
                    const lbl = p || `Seat ${i + 1}`;
                    c.innerHTML += `<div class="flex-r" style="margin-bottom:8px;"><div style="font-weight:700; color:white; font-size:14px; flex:1; text-align:left;">${lbl}</div><input id="hcp-in-${i}" type="number" class="g-inp" style="width:80px; padding:8px;" value="${v}" placeholder="-"></div>`;
                });
                document.getElementById('hcp-modal').classList.add('active');
            },
            saveHcps: function () {
                if (!this.d.hcps) this.d.hcps = {};
                if (!this.d.permHcps) this.d.permHcps = {};
                [0, 1, 2, 3].forEach(i => {
                    const el = document.getElementById(`hcp-in-${i}`);
                    const p = this.d.chosen[i];
                    if (p && el.value !== '') {
                        const val = Number(el.value);
                        this.d.hcps[p] = val;
                        this.d.permHcps[p] = val; // Persist
                    } else if (p) {
                        delete this.d.hcps[p];
                    }
                });
                this.save();
                this.closeHcpModal();
            },
            closeHcpModal: function () { document.getElementById('hcp-modal').classList.remove('active'); },
            setScoringMode: function (mode) {
                console.log("Setting mode:", mode);
                this.d.scoringMode = mode;
                this.updateScoringModeUI();
                this.save();
            },
            updateScoringModeUI: function () {
                const mode = this.d.scoringMode || 'std';
                const bStd = document.getElementById('sm-std');
                const bCc = document.getElementById('sm-cc');
                const desc = document.getElementById('sm-desc');

                if (mode === 'cc') {
                    bStd.className = 'g-btn g-btn-sec';
                    bStd.style.backgroundColor = '#334155';
                    bStd.style.color = 'white';

                    bCc.className = 'g-btn';
                    bCc.style.backgroundColor = '#F59E0B';
                    bCc.style.color = 'black';

                    desc.innerText = "Captain's Choice: Partner score auto-fills (Gross). Net calculated independently.";
                } else {
                    bStd.className = 'g-btn';
                    bStd.style.backgroundColor = '#10B981';
                    bStd.style.color = 'white';

                    bCc.className = 'g-btn g-btn-sec';
                    bCc.style.backgroundColor = '#334155';
                    bCc.style.color = 'white';

                    desc.innerText = "Standard: Enter individual scores for each player.";
                }
            },

             restoreSet: function () {
                const ids = ['s-course', 's-tee', 's-bet', 's-start', 'g-mode', 's-pot', 's-hcp-mode'];
                ids.forEach(k => {
                    const el = document.getElementById(k);
                    const prop = k.replace('s-', '').replace('g-mode', 'gameType').replace('hcp-mode', 'hcpMode');
                    if (el && this.d[prop] !== undefined) el.value = this.d[prop];
                });
                const gTop = document.getElementById('g-mode-top');
                if (gTop && this.d.gameType) gTop.value = this.d.gameType;

                if (document.getElementById('s-voice')) document.getElementById('s-voice').checked = !!this.d.voiceEnabled;
                if (document.getElementById('s-no-hcps')) document.getElementById('s-no-hcps').checked = !!this.d.noHandicaps;
                if (document.getElementById('gh-token-input')) document.getElementById('gh-token-input').value = this.d.ghToken || '';
                this.updateScoringModeUI();
                
                // Update POT visibility and label based on game mode (v275.17)
                const gt = this.d.gameType;
                const pc2 = document.getElementById('pot-container');
                const potLbl2 = document.getElementById('pot-label');
                if (gt === 'cod' || gt === 'scramble' || gt === 'highlow' || gt === 'single' || gt === 'nassau' || gt === 'cc_match') {
                    if (pc2) pc2.style.display = 'none';
                } else {
                    if (pc2) pc2.style.display = 'flex';
                    if (potLbl2) {
                        if (gt === 'stroke') potLbl2.innerText = 'TOTAL POT $';
                        else potLbl2.innerText = 'POT';
                    }
                }

                this.checkCourseOptions();
            },
            startRound: function (keepScores) {
                try {
                    const p = [0, 1, 2, 3].map(i => this.d.chosen[i]);
                    const gtLine = document.getElementById('g-mode-top');
                    const gt = gtLine ? gtLine.value : (this.d.gameType || 'cod');
                    const count = p.filter(x => x).length;

                    if (gt === 'stroke') {
                        if (count < 2) { alert("Need at least 2 players for Stroke Play!"); return; }
                    } else if (gt === 'single') {
                        if (count < 1) { alert("Need at least 1 player for Single Player!"); return; }
                    } else if (gt === 'nassau' || gt === 'cc_match') {
                        if (count < 4) { alert("Nassau and Captain's Choice require 4 players (Cart A vs Cart B)!"); return; }
                    } else {
                        if (count < 4) { alert("COD, High-Low and Scramble require 4 players (2 vs 2 / Rotating)!"); return; }
                    }

                    // SYNC SETTINGS
                    this.d.ps = p;
                    const searchEl = document.getElementById('course-search');
                    const sCourseEl = document.getElementById('s-course');
                    if (searchEl && searchEl.value && sCourseEl && sCourseEl.value && CS[sCourseEl.value]) {
                        this.d.crs = sCourseEl.value;
                    } else if (!this.d.crs || !CS[this.d.crs]) {
                        this.d.crs = 'cc';
                    }

                    const teeEl = document.getElementById('s-tee');
                    if (teeEl && teeEl.value) this.d.tee = teeEl.value;
                    const betEl = document.getElementById('s-bet');
                    if (betEl && betEl.value !== '') this.d.bet = parseInt(betEl.value);
                    const startEl = document.getElementById('s-start');
                    if (startEl && startEl.value !== '') this.d.start = parseInt(startEl.value);
                    this.d.gameType = gt;
                    const potEl = document.getElementById('s-pot');
                    if (potEl && potEl.value !== '') this.d.pot = parseInt(potEl.value) || 20;
                    const hcpModeEl = document.getElementById('s-hcp-mode');
                    if (hcpModeEl && hcpModeEl.value) this.d.hcpMode = hcpModeEl.value;
                    const noHcpsEl = document.getElementById('s-no-hcps');
                    if (noHcpsEl) this.d.noHandicaps = noHcpsEl.checked;

                    if ((this.d.gameType === 'cod' || this.d.gameType === 'highlow') && this.d.hcpMode === 'spread' && this.d.hcpEqualize === undefined) {
                        const activeNames = [0, 1, 2, 3].map(i => this.d.chosen[i]).filter(n => n);
                        this.d.hcpEqualize = confirm(`Would you like to spread - ${activeNames.join(' & ')} - to allow more strokes so that it is even for each segment?`);
                    }

                    if (!this.d.scoringMode) this.d.scoringMode = 'std';
                    if (this.d.gameType === 'single') {
                        this.d.bet = 0;
                        this.d.pot = 0;
                        this.d.junkBet = 0;
                    }

                    // ONLY WIPE IF STARTING NEW
                    if (!keepScores) {
                        this.d.s = {};
                        this.d.junk = {};
                        this.d.press = { 0: [], 1: [], 2: [] };
                        this.d.nassauPresses = [];
                        this.d.h = parseInt(this.d.start) || 1;
                    }

                    // Composite Course Logic
                    const crsData = CS[this.d.crs] || CS['cc'];
                    if (crsData && crsData.nines) {
                        const n1El = document.getElementById('s-n1');
                        const n2El = document.getElementById('s-n2');
                        const n1 = n1El ? n1El.value : 'n1';
                        const n2 = n2El ? n2El.value : 'n2';
                        this.d.nines = [n1, n2];
                        this.buildComposite(this.d.crs, n1, n2);
                    } else {
                        delete this.d.nines;
                    }

                    this.d.roundEnded = false;
                    this.save();
                    this.nav('v-dash');
                    this.keepAwake();

                    // WELCOME SPEECH
                    if (this.d.voiceEnabled) {
                        if (this.d.gameType === 'cod' || this.d.gameType === 'highlow') {
                            const ps = this.d.ps;
                            this.speak(`Welcome to today's round. First segment: Carts. ${ps[0]} and ${ps[1]} versus ${ps[2]} and ${ps[3]}. Let the games begin!`);
                        } else {
                            this.speak(`Welcome to today's round. Let the games begin!`);
                        }
                    }
                    this.showCartCheck();
                } catch (err) {
                    console.error("Failed to start round:", err);
                    alert("Error starting round: " + err.message);
                }
            },

            endRound: function () {
                if (confirm("End this round and return to setup?")) {
                    this.d.roundEnded = true;
                    this.save();
                    this.nav('v-setup');
                }
            },

            showCartCheck: function () {
                document.getElementById('cart-check-modal').classList.add('active');
            },

            closeCartCheck: function () {
                document.getElementById('cart-check-modal').classList.remove('active');
            },

            onSearchInput: function(q) {
                const resDiv = document.getElementById('course-results');
                if (!q || q.length < 1) { resDiv.classList.remove('active'); return; }
                
                const matches = [];
                const searchQ = q.toLowerCase();
                
                Object.keys(CS_INDEX).forEach(id => {
                    const c = CS_INDEX[id];
                    if (c.n.toLowerCase().includes(searchQ) || id.toLowerCase().includes(searchQ) || c.r.toLowerCase().includes(searchQ)) {
                        matches.push({ id, ...c });
                    }
                });

                if (matches.length > 0) {
                    let html = '';
                    matches.slice(0, 10).forEach(m => {
                        html += `<div class="search-item" onclick="App.selectCourse('${m.id}')">
                            <span class="course-name">${m.n}</span>
                            <span class="course-region">${m.r}</span>
                        </div>`;
                    });
                    resDiv.innerHTML = html;
                    resDiv.classList.add('active');
                } else {
                    resDiv.classList.remove('active');
                }
            },

            selectCourse: async function(id, fromInit = false) {
                const entry = CS_INDEX[id];
                if (!entry) return;

                // Load region if not already in memory
                if (!CS[id]) {
                    try {
                        const regId = entry.r.toLowerCase();
                        const response = await fetch(`data/regions/${regId}.json?v=${Date.now()}`);
                        const data = await response.json();
                        // Merge regional data into local CS cache
                        Object.assign(CS, data);
                    } catch (e) {
                        console.error("Course load failed", e);
                        if (!fromInit) alert("Error loading course data. Ensure you're connected to the internet.");
                        return;
                    }
                }

                this.d.crs = id;
                const sel = document.getElementById('s-course');
                
                // Add to hidden select for compatibility with rest of app
                if (!Array.from(sel.options).some(o => o.value === id)) {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.innerText = entry.n;
                    sel.appendChild(opt);
                }
                sel.value = id;

                // Fixup course data: Generate 'smart' combo yards
                const c = CS[id];
                if (c && c.y && (!c.y.combo || c.y.combo.length === 0)) {
                    const hasCmb = (c.cmb && c.cmb.length === 18);
                    const hasHcp = (c.hcp && c.hcp.length === 18);
                    
                    if (hasCmb || hasHcp) {
                        c.y.combo = [];
                        for (let i = 0; i < 18; i++) {
                            let useGold = false;
                            // Priority: 1. Crow Creek official cmb, 2. HCP 1-9 Logic, 3. Manual cmb fallback
                            if (id === 'cc' && hasCmb) useGold = (c.cmb[i] === 1);
                            else if (hasHcp) useGold = (c.hcp[i] <= 9);
                            else if (hasCmb) useGold = (c.cmb[i] === 1);
                            
                            if (id === 're' && c.y.green && c.y.white) {
                                c.y.combo[i] = useGold ? (c.y.green[i] || 0) : (c.y.white[i] || 0);
                            } else if (c.y.gold && c.y.white) {
                                c.y.combo[i] = useGold ? (c.y.gold[i] || 0) : (c.y.white[i] || 0);
                            } else {
                                c.y.combo[i] = 0;
                            }
                        }
                    }
                }

                document.getElementById('course-results').classList.remove('active');
                document.getElementById('course-search').value = '';
                
                this.updateActiveCourseUI();
                this.checkCourseOptions();
                this.save();
                this.uDash();
                this.uCard();
            },

            updateActiveCourseUI: function() {
                const indicator = document.getElementById('active-course-indicator');
                if (!this.d.crs || !CS_INDEX[this.d.crs]) {
                    indicator.style.display = 'none';
                    return;
                }
                const c = CS_INDEX[this.d.crs];
                indicator.innerHTML = `<div class="active-course-ribbon">
                    <span>⛳ ${c.n} (${c.r})</span>
                    <button class="clear-btn" onclick="App.clearActiveCourse()">×</button>
                </div>`;
                indicator.style.display = 'block';
            },

            clearActiveCourse: function() {
                this.d.crs = '';
                delete this.d.nines;
                this.updateActiveCourseUI();
                this.checkCourseOptions();
                this.save();
            },

            checkCourseOptions: function () {
                const el = document.getElementById('s-course');
                const teeSelect = document.getElementById('s-tee');
                const optEl = document.getElementById('course-routing-opt');
                const n1 = document.getElementById('s-n1');
                const n2 = document.getElementById('s-n2');
                const val = el.value;
                const c = CS[val];

                // Update Tee Dropdown (v275.24)
                if (c) {
                    const yardageSource = c.y || (c.nines && Object.values(c.nines)[0] && Object.values(c.nines)[0].y);
                    if (yardageSource) {
                        Array.from(teeSelect.options).forEach(opt => {
                            const t = opt.value;
                            if (t === 'combo') {
                                opt.disabled = !(yardageSource.combo || (c.cmb && c.cmb.length === 18) || (yardageSource.white && yardageSource.gold));
                            } else {
                                opt.disabled = !yardageSource[t];
                            }
                        });
                        if (teeSelect.selectedIndex >= 0 && teeSelect.options[teeSelect.selectedIndex].disabled) {
                            for (let opt of teeSelect.options) {
                                if (!opt.disabled) {
                                    teeSelect.value = opt.value;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!c || !c.nines) {
                    optEl.style.display = 'none';
                    return;
                }

                optEl.style.display = 'block';

                // Helper to populate n2 based on n1
                const populateN2 = (selectedN1) => {
                    const currentSelection2 = n2.value;
                    n2.innerHTML = '';
                    Object.keys(c.nines).forEach(k => {
                        if (k !== selectedN1) {
                            const opt = document.createElement('option');
                            opt.value = k;
                            opt.innerText = c.nines[k].n;
                            n2.appendChild(opt);
                        }
                    });

                    // Restore selection if valid
                    const available = Array.from(n2.options).map(o => o.value);
                    const saved2 = (this.d.nines && this.d.crs === val) ? this.d.nines[1] : null;

                    if (currentSelection2 && available.includes(currentSelection2)) n2.value = currentSelection2;
                    else if (saved2 && available.includes(saved2)) n2.value = saved2;
                    else n2.value = available[0];
                };

                // Rebuild N1
                const currentSelection1 = n1.value;
                const saved1 = (this.d.nines && this.d.crs === val) ? this.d.nines[0] : null;
                const keys = Object.keys(c.nines);
                
                n1.innerHTML = '';
                keys.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k;
                    opt.innerText = c.nines[k].n;
                    n1.appendChild(opt);
                });

                if (currentSelection1 && c.nines[currentSelection1]) n1.value = currentSelection1;
                else if (saved1 && c.nines[saved1]) n1.value = saved1;
                else n1.value = keys[0];

                // Attach event listener
                n1.onchange = () => {
                    populateN2(n1.value);
                    this.buildComposite(val, n1.value, n2.value);
                    this.uCard();
                    this.uDash();
                };
                n2.onchange = () => {
                    this.buildComposite(val, n1.value, n2.value);
                    this.uCard();
                    this.uDash();
                };

                // Initial population of N2
                populateN2(n1.value);
                
                // Build composite immediately so that uCard and uDash can render it without crashing
                this.buildComposite(val, n1.value, n2.value);
            },

            buildComposite: function (crsId, k1, k2) {
                const c = CS[crsId];
                if (!c.nines || !c.nines[k1] || !c.nines[k2]) return;

                const n1 = c.nines[k1];
                const n2 = c.nines[k2];

                // Preserve original name if not already done
                if (!c.origN) c.origN = c.n;

                // Construct Composite Name
                c.n = `${n1.n} / ${n2.n}`;

                // Concatenate Pars
                c.p = [...n1.p, ...n2.p];

                // Construct HCPS (Odds Front, Evens Back)
                const h1 = n1.hcp.map(h => (h * 2) - 1);
                const h2 = n2.hcp.map(h => h * 2);
                c.hcp = [...h1, ...h2];

                // Construct Combo Logic if present
                if (n1.cmb && n2.cmb) {
                    c.cmb = [...n1.cmb, ...n2.cmb];
                } else {
                    c.cmb = Array(18).fill(1); // Default to Gold if missing
                }

                // Construct Yards
                c.y = { white: [], gold: [], combo: [] };

                const pushY = (color) => {
                    const arr1 = (n1.y[color] && n1.y[color].length === 9) ? n1.y[color] : Array(9).fill(0);
                    const arr2 = (n2.y[color] && n2.y[color].length === 9) ? n2.y[color] : Array(9).fill(0);
                    c.y[color] = [...arr1, ...arr2];
                };
                pushY('black');
                pushY('blue');
                pushY('white');
                pushY('gold');
                pushY('orange');
                pushY('red');
                pushY('teal');

                // Build Smart Combo Yards
                for (let i = 0; i < 18; i++) {
                    let useGold = false;
                    // For composite courses, we always use the HCP logic (1-9 = Gold)
                    if (c.hcp && c.hcp[i] <= 9) useGold = true;
                    else if (c.cmb && c.cmb[i] === 1) useGold = true;
                    
                    c.y.combo[i] = useGold ? c.y.gold[i] : c.y.white[i];
                }
            },

            getDisplayHcp: function(hIdx) {
                const c = CS[this.d.crs];
                if (!c) return '-';
                const hcpVal = c.hcp ? c.hcp[hIdx] : null;
                if (!hcpVal) return '-';
                if (c.origN) {
                    if (hIdx < 9) {
                        return (hcpVal + 1) / 2;
                    } else {
                        return hcpVal / 2;
                    }
                }
                return hcpVal;
            },

            getPops: function (pIdx, hIdx, useFull) {
                if (this.d.noHandicaps) return 0;
                if (!this.d.hcps || Object.keys(this.d.hcps).length === 0) return 0;
                const mode = this.d.hcpMode || 'standard';
                const rh = this.getRelHole(hIdx + 1);
                const segIdx = Math.floor((rh - 1) / 6);
                const course = CS[this.d.crs] || CS['cc'];
                const holeAlloc = course.hcp[hIdx];

                // 1. Calculate Base Handicap Difference
                let ph = (this.d.chosen[pIdx] && this.d.hcps[this.d.chosen[pIdx]]) ? this.d.hcps[this.d.chosen[pIdx]] : 0;
                let diff = ph;

                if (mode === 'team' && (this.d.gameType === 'cod' || this.d.gameType === 'highlow')) {
                    // IDEA #1: Team-Based Difference per Segment
                    const segs = [{ t1: [0, 1], t2: [2, 3] }, { t1: [0, 3], t2: [1, 2] }, { t1: [0, 2], t2: [1, 3] }];
                    const seg = segs[segIdx];
                    const getH = (idx) => { const n = this.d.chosen[idx]; return (n && this.d.hcps[n] !== undefined) ? this.d.hcps[n] : 0; };

                    const t1H = getH(seg.t1[0]) + getH(seg.t1[1]);
                    const t2H = getH(seg.t2[0]) + getH(seg.t2[1]);

                    const isT1 = seg.t1.includes(pIdx);
                    const netTeamDiff = isT1 ? (t1H - t2H) : (t2H - t1H);

                    if (netTeamDiff <= 0) return 0;

                    const strokesForSeg = this.d.hcpEqualize ? Math.ceil(netTeamDiff / 3) : Math.round(netTeamDiff / 3);
                    const baseStrokes = Math.floor(strokesForSeg / 6);
                    const remStrokes = strokesForSeg % 6;

                    // Get actual HCP values for the 6 holes in this segment
                    const segHcpVals = [];
                    for (let i = 1; i <= 6; i++) {
                        const ah = this.getAbsHole((segIdx * 6) + i);
                        segHcpVals.push(course.hcp[ah - 1]);
                    }
                    const sorted = [...segHcpVals].sort((a, b) => a - b);
                    const myRank = sorted.indexOf(holeAlloc);

                    if (myRank < remStrokes) return baseStrokes + 1;
                    return baseStrokes;

                } else if (mode === 'spread') {
                    // Existing Spread Logic (Individual Based)
                    if (!useFull) {
                        const allH = [0, 1, 2, 3].map(i => { const n = this.d.chosen[i]; return (n && this.d.hcps[n] !== undefined) ? this.d.hcps[n] : 0; });
                        const min = Math.min(...allH);
                        diff = ph - min;
                    }
                    if (diff <= 0) return 0;

                    let strokesForSeg = (this.d.hcpEqualize) ? Math.ceil(diff / 3) : Math.floor(diff / 3);
                    if (!this.d.hcpEqualize && (diff % 3 > segIdx)) strokesForSeg++;

                    const baseStrokes = Math.floor(strokesForSeg / 6);
                    const remStrokes = strokesForSeg % 6;

                    // Get actual HCP values for the 6 holes in this segment
                    const segHcpVals = [];
                    for (let i = 1; i <= 6; i++) {
                        const ah = this.getAbsHole((segIdx * 6) + i);
                        segHcpVals.push(course.hcp[ah - 1]);
                    }
                    const sorted = [...segHcpVals].sort((a, b) => a - b);
                    const myRank = sorted.indexOf(holeAlloc);

                    if (myRank < remStrokes) return baseStrokes + 1;
                    return baseStrokes;

                } else {
                    // Standard Logic
                    if (!useFull) {
                        const allH = [0, 1, 2, 3].map(i => { const n = this.d.chosen[i]; return (n && this.d.hcps[n] !== undefined) ? this.d.hcps[n] : 0; });
                        const min = Math.min(...allH);
                        diff = ph - min;
                    }
                    if (diff < holeAlloc) return 0;
                    return Math.floor((diff - holeAlloc) / 18) + 1;
                }
            },

            getAbsHole: function (rh) {
                if (this.d.start === 1) return rh;
                if (rh <= 9) return rh + 9;
                return rh - 9;
            },
            getRelHole: function (absH) {
                if (this.d.start === 1) return absH;
                if (absH >= 10) return absH - 9;
                return absH + 9;
            },

            calcMatch: function (segIdx, startRh, endRh, initialDiff, teamPressed) {
                const segs = [{ t1: [0, 1], t2: [2, 3] }, { t1: [0, 3], t2: [1, 2] }, { t1: [0, 2], t2: [1, 3] }];
                const seg = segs[segIdx];
                const gt = this.d.gameType;
                const c = CS[this.d.crs] || CS['cc'];

                let w1 = 0, w2 = 0;
                let birds = { t1: 0, t2: 0 };
                let sum1 = 0, sum2 = 0;
                let completedHoles = 0;

                for (let rh = startRh; rh <= endRh; rh++) {
                    const h = this.getAbsHole(rh);
                    const s = this.d.s[h];
                    const activeCount = this.d.ps.filter(x => x).length;

                    if (s && Object.keys(s).length === activeCount) {
                        completedHoles++;
                        const par = c.p[h - 1];
                        if (gt === 'scramble') {
                            const sc1 = Math.min(s[seg.t1[0]], s[seg.t1[1]]);
                            const sc2 = Math.min(s[seg.t2[0]], s[seg.t2[1]]);
                            sum1 += sc1; sum2 += sc2;
                            if (sc1 < par) birds.t1++;
                            if (sc2 < par) birds.t2++;
                        } else {
                            let b1 = Math.min(s[seg.t1[0]] - this.getPops(seg.t1[0], h - 1), s[seg.t1[1]] - this.getPops(seg.t1[1], h - 1));
                            let b2 = Math.min(s[seg.t2[0]] - this.getPops(seg.t2[0], h - 1), s[seg.t2[1]] - this.getPops(seg.t2[1], h - 1));
                            if (b1 < b2) w1++; else if (b2 < b1) w2++;
                        }
                    }
                }

                let winner = 0;
                let amt = 5;

                if (gt === 'scramble') {
                    let pts1 = birds.t1, pts2 = birds.t2;
                    if (sum1 < sum2) { pts1 += 3; winner = 1; }
                    else if (sum2 < sum1) { pts2 += 3; winner = 2; }
                    else { pts1 += 1; pts2 += 1; }
                    return { winner, amt, w1: pts1, w2: pts2, seg, isScramble: true, holes: [startRh, endRh] };
                } else {
                    if (w1 > w2) winner = 1;
                    else if (w2 > w1) winner = 2;
                    else { winner = 0; amt = 0; } // Tied segment or tied press = push

                    // Dan's $3 rule (aligned across COD and High-Low, Oct 15, 2026):
                    // a press made while down by more than two is a $3 bet, not $5 —
                    // a routed team can't press its way back to even.
                    if (teamPressed && winner !== 0 && Math.abs(initialDiff) >= 3) amt = 3;
                    return { winner, amt, w1, w2, seg, isScramble: false, teamPressed, startRh, endRh };
                }
            },

            calcMatchHL: function (segIdx, startRh, endRh, initialDiff, teamPressed) {
                // HIGH-LOW ENGINE (v282.0): rotating teams like COD, but each hole is
                // three battles on NET scores — low ball, high ball, combined.
                // Win the hole by taking at least 2 of the 3 battles.
                const segs = [{ t1: [0, 1], t2: [2, 3] }, { t1: [0, 3], t2: [1, 2] }, { t1: [0, 2], t2: [1, 3] }];
                const seg = segs[segIdx];

                let w1 = 0, w2 = 0;

                for (let rh = startRh; rh <= endRh; rh++) {
                    const h = this.getAbsHole(rh);
                    const s = this.d.s[h];
                    const activeCount = this.d.ps.filter(x => x).length;

                    if (s && Object.keys(s).length === activeCount) {
                        const net = (idx) => s[idx] - this.getPops(idx, h - 1);
                        const n1 = seg.t1.map(net), n2 = seg.t2.map(net);
                        const low1 = Math.min(...n1), high1 = Math.max(...n1), sum1 = n1[0] + n1[1];
                        const low2 = Math.min(...n2), high2 = Math.max(...n2), sum2 = n2[0] + n2[1];
                        let b1 = 0, b2 = 0;
                        if (low1 < low2) b1++; else if (low2 < low1) b2++;
                        if (high1 < high2) b1++; else if (high2 < high1) b2++;
                        if (sum1 < sum2) b1++; else if (sum2 < sum1) b2++;
                        if (b1 > b2) w1++; else if (b2 > b1) w2++;
                    }
                }

                let winner = 0;
                let amt = 5;
                if (w1 > w2) winner = 1;
                else if (w2 > w1) winner = 2;
                else { winner = 0; amt = 0; } // Tied segment or tied press = push

                if (teamPressed && winner !== 0 && Math.abs(initialDiff) >= 3) {
                    // Dan's $3 rule: a press made while down by more than two holes is a
                    // $3 bet, not $5 — a routed team can't press its way back to even.
                    amt = 3;
                }
                return { winner, amt, w1, w2, seg, isScramble: false, teamPressed, startRh, endRh };
            },

            calcSegResults: function (segIdx) {
                const results = [];
                const isHL = this.d.gameType === 'highlow';
                // 1. Main Match
                results.push(isHL
                    ? this.calcMatchHL(segIdx, (segIdx * 6) + 1, (segIdx * 6) + 6, 0, null)
                    : this.calcMatch(segIdx, (segIdx * 6) + 1, (segIdx * 6) + 6, 0, null));
                // 2. Presses
                if (this.d.press && this.d.press[segIdx]) {
                    this.d.press[segIdx].forEach(p => {
                        results.push(isHL
                            ? this.calcMatchHL(segIdx, p.startH, (segIdx * 6) + 6, p.initialDiff, p.team)
                            : this.calcMatch(segIdx, p.startH, (segIdx * 6) + 6, p.initialDiff, p.team));
                    });
                }
                return results;
            },

            calcSeg: function (idx) {
                // Compatibility wrapper for old calls that expect a single result
                return this.calcSegResults(idx)[0];
            },

            initiatePress: function (team) {
                let rh = this.getRelHole(this.d.h);
                let m = Math.floor((rh - 1) / 6);

                // Only allow one press per team per segment
                if (this.d.press[m] && this.d.press[m].some(p => p.team === team)) {
                    alert("A press is already active for this team in this segment!");
                    return;
                }

                // Check trailing status based on holes completed up to current hole
                const r = (this.d.gameType === 'highlow') ? this.calcMatchHL(m, (m * 6) + 1, rh, 0, null) : this.calcMatch(m, (m * 6) + 1, rh, 0, null);
                const diff = (team === 1) ? (r.w1 - r.w2) : (r.w2 - r.w1);

                if (diff >= 0) {
                    alert("Team must be trailing to press!");
                    return;
                }

                const startH = rh;
                const t1 = (m === 0) ? [0, 1] : (m === 1 ? [0, 3] : [0, 2]);
                const t2 = (m === 0) ? [2, 3] : (m === 1 ? [1, 2] : [1, 3]);
                const tNames = (team === 1 ? t1 : t2).map(idx => this.d.ps[idx]);
                const nameStr = tNames.join(" & ");

                const startThePress = () => {
                    if (!this.d.press[m]) this.d.press[m] = [];
                    this.d.press[m].push({ team, startH, initialDiff: diff });
                    this.save();
                    this.uDash();
                    this.closePress();
                };

                const modal = document.getElementById('press-modal');
                const msg = document.getElementById('pm-msg');
                const btn = document.getElementById('pm-btn');

                let warningHtml = `<div style="color:white; font-weight:700; margin-bottom:8px;">Initiate PRESS on Hole ${this.getAbsHole(startH)}?</div>`;
                let voiceMsg = `Press initiated on hole ${this.getAbsHole(startH)}.`;

                if ((this.d.gameType === 'highlow' || this.d.gameType === 'cod') && Math.abs(diff) >= 3) {
                    warningHtml = `
                        <div style="color:#EF4444; font-weight:900; font-size:18px; margin-bottom:12px;">⚠️ $3 PRESS</div>
                        <div style="color:white; margin-bottom:12px;">${nameStr} are trailing by ${Math.abs(diff)}.</div>
                        <div style="color:#FCA5A5; font-weight:700; border:1px solid #EF4444; padding:8px; border-radius:4px;">
                            NOTICE: Down 3 or more, this press is a $3 bet (not $5) — win it and you still can't break even on the segment.
                        </div>
                    `;
                    voiceMsg = `Attention! ${nameStr} are trailing by ${Math.abs(diff)}. This press is a 3 dollar bet, not 5. Accept the challenge?`;
                }

                msg.innerHTML = warningHtml;
                this.speak(voiceMsg);
                
                btn.onclick = () => startThePress();
                modal.classList.add('active');
            }
        };
