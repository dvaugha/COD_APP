const App = {
            d: { roster: ["Dan", "Dave", "Eddie", "Muzzy", "Mark", "Tom", "TonyC", "JohnP", "MikeG", "Putt", "Rizzo", "Dante", "Steve", "Dom", "Lino", "BillB", "JohnT", "TonyS"], permHcps: { "Dan":13, "Dave":18, "Eddie":17, "Muzzy":14, "Mark":16, "Tom":15, "TonyC":22, "JohnP":22, "MikeG":18, "Putt":12, "Rizzo":18, "Dante":15, "Steve":12, "Dom":10, "Lino":20, "BillB":15, "TonyS":9, "JohnT":8 }, ps: ['', '', '', ''], chosen: ['', '', '', ''], bet: 5, pot: 20, gameType: 'cod', crs: 'jones', tee: 'white', start: 1, h: 1, s: {}, gameId: null, voiceEnabled: false, ghToken: '', testSyncsDone: 0, isTestMode: false, roundEnded: false },

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
                    let s = localStorage.getItem('COD_GOLF_DATA_v277_0');
                    if (!s) {
                        const old = localStorage.getItem('COD_GOLF_DATA_v276_0') ||
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
                    this.d.rabbitHistory = {};
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
                    if (!this.d.hcps) this.d.hcps = {};
                    if (!this.d.gameType) this.d.gameType = 'cod';
                    if (!this.d.pot) this.d.pot = 20;
                    if (!this.d.hcpMode) this.d.hcpMode = 'standard';
                    if (!this.d.permHcps) this.d.permHcps = {};
                    if (this.d.voiceEnabled === undefined) this.d.voiceEnabled = false;
                    if (this.d.testSyncsDone === undefined) this.d.testSyncsDone = 0;
                    if (this.d.ghToken === undefined) this.d.ghToken = '';
                    if (this.d.roundEnded === undefined) this.d.roundEnded = false;
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
                        localStorage.setItem('COD_GOLF_DATA_v277_0', JSON.stringify(this.d));
                    }, 500);
                };
            })(),

            hardReset: function () {
                if (confirm("This will Delete History and Reset Roster. Continue?")) {
                    localStorage.removeItem('COD_GOLF_DATA_v277_0');
                    localStorage.removeItem('GOLF_HISTORY_265');
                    location.reload();
                }
            },
            saveHistoryData: function() {
                localStorage.setItem('GOLF_HISTORY_265', JSON.stringify(this.historyArchive));
            },

            tryNewGame: function (btn) {
                if (btn.innerText.includes("CONFIRM")) {
                    this.startRound(false);
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
                } else if (el.value === 'cod' || el.value === 'scramble') {
                    if (pc) pc.style.display = 'none';
                    document.querySelectorAll('#s-bet').forEach(i => i.value = 5); // Always default $5 for COD
                } else if (el.value === 'nassau') {
                    if (pc) pc.style.display = 'none'; // No separate pot for Nassau
                    document.querySelectorAll('#s-bet').forEach(i => i.value = 4); // Default $4/player/segment
                } else if (el.value === 'rabbit') {
                    if (pc) pc.style.display = 'flex';
                    if (potLbl) potLbl.innerText = 'BUY-IN $';
                    document.querySelectorAll('#s-bet').forEach(i => { if (i.value == 0) i.value = 5; });
                    potWrap.forEach(i => i.value = 10); // Always default $10/player for Rabbit
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
                if ((el.value === 'spread' || el.value === 'team') && document.getElementById('g-mode').value === 'cod') {
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
                document.querySelectorAll('.g-view').forEach(e => e.classList.remove('active'));
                document.getElementById(id).classList.add('active');
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

            speak: function (text) {
                if (!this.d.voiceEnabled || !window.speechSynthesis) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
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

            
            calcRabbit: function () {
                this.d.rabbitHistory = {};
                let currentRabbit = null;
                const c = CS[this.d.crs];
                for (let i = 1; i <= 18; i++) {
                    if (!this.d.s[i]) break;
                    let lowestNet = 999;
                    let lowestPlayers = [];
                    let birdies = []; // Players with Gross < Par
                    const par = c.p[i - 1]; // Declared here so penalty check can access it (bugfix v275.15)

                    this.d.ps.forEach((name, idx) => {
                        if (!name || !this.d.s[i][idx]) return;
                        const gross = this.d.s[i][idx];
                        if (gross < par) birdies.push(idx);

                        const pops = this.getPops(idx, i - 1, true);
                        const net = gross - pops;
                        if (net < lowestNet) { lowestNet = net; lowestPlayers = [idx]; }
                        else if (net === lowestNet) { lowestPlayers.push(idx); }
                    });

                    // 1. DOUBLE BOGEY PENALTY (Requested v275.12)
                    if (currentRabbit !== null) {
                        const holderGross = this.d.s[i][currentRabbit];
                        if (holderGross >= par + 2) {
                            currentRabbit = null;
                        }
                    }

                    // 2. LONE NATURAL BIRDIE RULE (Super Capture)
                    if (birdies.length === 1) {
                        currentRabbit = birdies[0];
                    }
                    // 3. STANDARD LONE LOW RULE
                    else if (lowestPlayers.length === 1 && lowestNet < 99) {
                        const winner = lowestPlayers[0];
                        if (currentRabbit === null) currentRabbit = winner; // Capture
                        else if (currentRabbit !== winner) currentRabbit = null; // Knock Loose
                    }
                    // Otherwise: TIE (Current holder defends)

                    this.d.rabbitHistory[i] = currentRabbit;
                }
            },
            
            announceRabbit: function(finishedHole) {
                const prev = (finishedHole === 1) ? null : this.d.rabbitHistory[finishedHole - 1];
                const curr = this.d.rabbitHistory[finishedHole];
                const activeCount = this.d.ps.filter(x=>x).length;
                if (activeCount < 2) return;
                
                if (finishedHole === 9) {
                    if (curr !== null && curr !== undefined) {
                        this.speak('Front nine complete. ' + this.d.ps[curr] + ' wins the rabbit pot.');
                    } else {
                        this.speak('Front nine complete. The rabbit is free, pot pushes to the back nine.');
                    }
                } else if (finishedHole === 18) {
                    if (curr !== null && curr !== undefined) {
                        this.speak('Round complete. ' + this.d.ps[curr] + ' wins the final rabbit pot. Excellent playing.');
                    } else {
                        this.speak('Round complete. The rabbit is free! Nobody wins the final pot.');
                    }
                } else {
                    if (prev === null && curr !== null) {
                        this.speak(this.d.ps[curr] + ' captured the rabbit!');
                    } else if (prev !== null && curr === null) {
                        const hGross = this.d.s[finishedHole][prev];
                        const hPar = CS[this.d.crs].p[finishedHole - 1];
                        if (hGross >= hPar + 2) {
                            this.speak(this.d.ps[prev] + ' lost the rabbit with a double bogey! The rabbit is free!');
                        } else {
                            this.speak(this.d.ps[prev] + ' lost the rabbit! The rabbit is free!');
                        }
                    } else if (prev !== null && curr !== null && prev !== curr) {
                        this.speak(this.d.ps[curr] + ' stole the rabbit with a natural birdie! Incredible!');
                    } else if (prev !== null && curr !== null && prev === curr) {
                        let isLoneLow = false;
                        let lowestPlayers = [];
                        let lowestNet = 99;
                        this.d.ps.forEach((nm, idx) => {
                            if (!nm || !this.d.s[finishedHole][idx]) return;
                            const np = this.d.s[finishedHole][idx] - this.getPops(idx, finishedHole - 1, true);
                            if (np < lowestNet) { lowestNet = np; lowestPlayers = [idx]; }
                            else if (np === lowestNet) lowestPlayers.push(idx);
                        });
                        if (lowestPlayers.length > 1) {
                            this.speak('Hole pushed. ' + this.d.ps[curr] + ' defends the rabbit.');
                        } else {
                            this.speak(this.d.ps[curr] + ' keeps the rabbit!');
                        }
                    }
                }
            },
            
            navH: function (d) {
                if (this.tmr) clearTimeout(this.tmr);
                if (this.strokesTmr) clearTimeout(this.strokesTmr);
                document.getElementById('auto-adv-banner').classList.remove('show');

                let n;
                if (d === 1) {
                    if (this.d.start === 10) {
                        if (this.d.h === 18) n = 1;
                        else if (this.d.h === 9) n = 19; // Done
                        else n = this.d.h + 1;
                    } else {
                        n = this.d.h + 1;
                    }
                }
                else {
                    this.corr = true;
                    if (this.d.start === 10) {
                        if (this.d.h === 1) n = 18;
                        else if (this.d.h === 10) n = 10;
                        else n = this.d.h - 1;
                    } else {
                        if (this.d.h === 1) n = 1;
                        else n = this.d.h - 1;
                    }
                }

                if (n > 18) { 
                    alert("Done"); 
                    this.d.roundEnded = true;
                    this.save();
                    this.nav('v-card'); 
                    return; 
                }
                this.d.h = n;
                this.save();
                this.uDash();
                this.updateJunkUI();

                // SEGMENT JUNK PAYOUT MODAL TRIGGER
                if (d === 1 && !this.corr) {
                    const lastH = (n === 1) ? 18 : (n === 19 ? (this.d.start === 10 ? 9 : 18) : n - 1);
                    if (lastH === 6 || lastH === 12 || lastH === 18) {
                        const sIdx = (lastH === 6) ? 0 : (lastH === 12 ? 1 : 2);
                        this.showJunkPayout(sIdx);
                    }
                }

                
                // VOICE ANNOUNCEMENT FOR RABBIT
                if (d === 1 && this.d.gameType === 'rabbit' && !this.corr) {
                    const lastH = (n === 1) ? 18 : (n === 19 ? (this.d.start === 10 ? 9 : 18) : n - 1);
                    this.announceRabbit(lastH);
                }

                // VOICE ANNOUNCEMENT FOR COD SEGMENTS
                if (this.d.gameType === 'cod' && !this.corr) {
                    const ps = this.d.ps;
                    if (this.d.h === 7) {
                        this.speak(`Attention! Segment Two: Opposites. ${ps[0]} and ${ps[3]} are now partners, versus ${ps[1]} and ${ps[2]}.`);
                    } else if (this.d.h === 13) {
                        this.speak(`Attention! Final Segment: Drivers. ${ps[0]} and ${ps[2]} are now partners, versus ${ps[1]} and ${ps[3]}.`);
                    }
                }

                // HDCP STROKES ALERT
                if (d === 1 && !this.corr) {
                    this.strokesTmr = setTimeout(() => {
                        const hIdx = this.d.h - 1;
                        let hasStrokes = false;
                        for (let i = 0; i < 4; i++) {
                            if (this.d.ps[i] && this.getPops(i, hIdx) > 0) {
                                hasStrokes = true;
                                break;
                            }
                        }
                        if (hasStrokes) {
                            this.speak("Handicap strokes coming on this next hole. Be sure everyone knows!");
                        }
                    }, 15000);
                }

                this.corr = false;
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

                this.save();
                this.uDash();
                this.checkAuto();
            },
            checkAuto: function () {
                const s = this.d.s[this.d.h];
                const activeCount = this.d.ps.filter(x => x).length;
                if (s && Object.keys(s).length === activeCount && Object.values(s).every(v => v > 0)) {
                    document.getElementById('auto-adv-banner').classList.add('show');
                    if (this.tmr) clearTimeout(this.tmr);
                    this.tmr = setTimeout(() => { this.navH(1); }, 3000);
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

                        let nextH;
                        if (this.d.start === 10) {
                            if (this.d.h === 18) nextH = 1;
                            else if (this.d.h === 9) nextH = 99;
                            else nextH = this.d.h + 1;
                        } else {
                            if (this.d.h === 18) nextH = 99;
                            else nextH = this.d.h + 1;
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
                if (document.getElementById('s-voice')) document.getElementById('s-voice').checked = !!this.d.voiceEnabled;
                if (document.getElementById('gh-token-input')) document.getElementById('gh-token-input').value = this.d.ghToken || '';
                this.updateScoringModeUI();
                
                // Update POT visibility and label based on game mode (v275.17)
                const gt = this.d.gameType;
                const pc2 = document.getElementById('pot-container');
                const potLbl2 = document.getElementById('pot-label');
                if (gt === 'cod' || gt === 'scramble' || gt === 'single') {
                    if (pc2) pc2.style.display = 'none';
                } else {
                    if (pc2) pc2.style.display = 'flex';
                    if (potLbl2) {
                        if (gt === 'rabbit') potLbl2.innerText = 'BUY-IN $';
                        else if (gt === 'stroke') potLbl2.innerText = 'TOTAL POT $';
                        else potLbl2.innerText = 'POT';
                    }
                }

                this.checkCourseOptions();
            },
            startRound: function (keepScores) {
                const p = [0, 1, 2, 3].map(i => this.d.chosen[i]);
                const gtLine = document.getElementById('g-mode-top');
                const gt = gtLine ? gtLine.value : this.d.gameType;
                const count = p.filter(x => x).length;

                if (gt === 'stroke') {
                    if (count < 2) { alert("Need at least 2 players for Stroke Play!"); return; }
                } else if (gt === 'rabbit') {
                    if (count < 2) { alert("Need at least 2 players for Rabbit Hunter!"); return; }
                } else if (gt === 'single') {
                    if (count < 1) { alert("Need at least 1 player for Single Player!"); return; }
                } else if (gt === 'nassau') {
                    if (count < 4) { alert("Nassau requires 4 players (Cart A vs Cart B)!"); return; }
                } else {
                    if (count < 4) { alert("COD and Scramble require 4 players (2 vs 2 / Rotating)!"); return; }
                }

                // SYNC SETTINGS
                this.d.ps = p;
                this.d.crs = document.getElementById('course-search').value ? document.getElementById('s-course').value : this.d.crs;
                this.d.tee = document.getElementById('s-tee').value;
                this.d.bet = parseInt(document.getElementById('s-bet').value);
                this.d.start = parseInt(document.getElementById('s-start').value);
                this.d.gameType = gt;
                this.d.pot = parseInt(document.getElementById('s-pot').value) || 20;
                this.d.hcpMode = document.getElementById('s-hcp-mode').value || 'standard';

                if (this.d.gameType === 'cod' && this.d.hcpMode === 'spread' && this.d.hcpEqualize === undefined) {
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
                    this.d.rabbitHistory = {};
                    this.d.h = this.d.start;
                }

                // Composite Course Logic
                const crsData = CS[this.d.crs];
                if (crsData.nines) {
                    const n1 = document.getElementById('s-n1').value;
                    const n2 = document.getElementById('s-n2').value;
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
                    if (this.d.gameType === 'cod') {
                        const ps = this.d.ps;
                        this.speak(`Welcome to today's round. First segment: Carts. ${ps[0]} and ${ps[1]} versus ${ps[2]} and ${ps[3]}. Let the games begin!`);
                    } else {
                        this.speak(`Welcome to today's round. Let the games begin!`);
                    }
                }
                this.showCartCheck();
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
                if (c && (!c.y.combo || c.y.combo.length === 0)) {
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
                            
                            if (c.y.gold && c.y.white) {
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
                if (c && c.y) {
                    Array.from(teeSelect.options).forEach(opt => {
                        const t = opt.value;
                        if (t === 'combo') {
                            opt.disabled = !(c.y.combo || (c.cmb && c.cmb.length === 18));
                        } else {
                            opt.disabled = !c.y[t];
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
                n1.onchange = () => populateN2(n1.value);

                // Initial population of N2
                populateN2(n1.value);
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
                pushY('white');
                pushY('gold');

                // Build Smart Combo Yards
                for (let i = 0; i < 18; i++) {
                    let useGold = false;
                    // For composite courses, we always use the HCP logic (1-9 = Gold)
                    if (c.hcp && c.hcp[i] <= 9) useGold = true;
                    else if (c.cmb && c.cmb[i] === 1) useGold = true;
                    
                    c.y.combo[i] = useGold ? c.y.gold[i] : c.y.white[i];
                }
            },

            getPops: function (pIdx, hIdx, useFull) {
                if (!this.d.hcps || Object.keys(this.d.hcps).length === 0) return 0;
                const mode = this.d.hcpMode || 'standard';
                const rh = this.getRelHole(hIdx + 1);
                const segIdx = Math.floor((rh - 1) / 6);
                const course = CS[this.d.crs];
                const holeAlloc = course.hcp[hIdx];

                // 1. Calculate Base Handicap Difference
                let ph = (this.d.chosen[pIdx] && this.d.hcps[this.d.chosen[pIdx]]) ? this.d.hcps[this.d.chosen[pIdx]] : 0;
                let diff = ph;

                if (mode === 'team' && this.d.gameType === 'cod') {
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
                    else {
                        // TIE LOGIC for Presses vs Main Matches
                        if (teamPressed) {
                            // If it's a press and it's tied:
                            // The team that was CHALLENGED (non-pressing) wins $3 if they were up by 3+ initially
                            if (Math.abs(initialDiff) >= 3 && completedHoles > 0) {
                                winner = (teamPressed === 1 ? 2 : 1);
                                amt = 3;
                            } else {
                                winner = 0;
                                amt = 0;
                            }
                        } else {
                            winner = 0;
                            amt = 0;
                        }
                    }
                    return { winner, amt, w1, w2, seg, isScramble: false, teamPressed, startRh, endRh };
                }
            },

            calcSegResults: function (segIdx) {
                const results = [];
                // 1. Main Match
                results.push(this.calcMatch(segIdx, (segIdx * 6) + 1, (segIdx * 6) + 6, 0, null));
                // 2. Presses
                if (this.d.press && this.d.press[segIdx]) {
                    this.d.press[segIdx].forEach(p => {
                        results.push(this.calcMatch(segIdx, p.startH, (segIdx * 6) + 6, p.initialDiff, p.team));
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
                const r = this.calcMatch(m, (m * 6) + 1, rh, 0, null);
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

                if (Math.abs(diff) >= 3) {
                    warningHtml = `
                        <div style="color:#EF4444; font-weight:900; font-size:18px; margin-bottom:12px;">⚠️ HIGH STAKES PRESS</div>
                        <div style="color:white; margin-bottom:12px;">${nameStr} are trailing by ${Math.abs(diff)}.</div>
                        <div style="color:#FCA5A5; font-weight:700; border:1px solid #EF4444; padding:8px; border-radius:4px;">
                            NOTICE: A TIE on this hole will still cost ${nameStr} $3!
                        </div>
                    `;
                    voiceMsg = `Attention! ${nameStr} are trailing by 3. A tie on this hole will still cost the pressing team 3 dollars. Accept the challenge?`;
                }

                msg.innerHTML = warningHtml;
                this.speak(voiceMsg);
                
                btn.onclick = () => startThePress();
                modal.classList.add('active');
            },


            closePress: function () { document.getElementById('press-modal').classList.remove('active'); },

            uRecap: function () {
                const c = CS[this.d.crs] || CS['cc'];
                const pStats = [0, 1, 2, 3].map(i => ({
                    id: i, name: this.d.ps[i],
                    dist: { bird: 0, par: 0, bog: 0, dbl: 0 },
                    netDist: { bird: 0, par: 0, bog: 0, dbl: 0 },
                    p3: { tot: 0, cnt: 0 }, p4: { tot: 0, cnt: 0 }, p5: { tot: 0, cnt: 0 },
                    netToPar: 0, birds: 0, pars: 0, dbls: 0, totalStrokes: 0
                }));

                let completedHoles = 0;
                for (let h = 1; h <= 18; h++) {
                    if (!this.d.s[h]) continue;
                    const par = c.p[h - 1];
                    let any = false;
                    [0, 1, 2, 3].forEach(i => {
                        if (typeof this.d.s[h][i] === 'number') {
                            any = true;
                            const g = this.d.s[h][i];
                            const pops = this.getPops(i, h - 1);
                            const n = g - pops;
                            const d = n - par;
                            const grel = g - par;
                            pStats[i].totalStrokes++;
                            if (grel <= -1) { pStats[i].dist.bird++; pStats[i].birds++; }
                            else if (grel === 0) { pStats[i].dist.par++; pStats[i].pars++; }
                            else if (grel === 1) pStats[i].dist.bog++;
                            else { pStats[i].dist.dbl++; pStats[i].dbls++; }

                            // Net Dist
                            const nrel = n - par;
                            if (nrel <= -1) pStats[i].netDist.bird++;
                            else if (nrel === 0) pStats[i].netDist.par++;
                            else if (nrel === 1) pStats[i].netDist.bog++;
                            else pStats[i].netDist.dbl++;

                            pStats[i].netToPar += d;
                            if (par === 3) { pStats[i].p3.tot += g; pStats[i].p3.cnt++; }
                            if (par === 4) { pStats[i].p4.tot += g; pStats[i].p4.cnt++; }
                            if (par === 5) { pStats[i].p5.tot += g; pStats[i].p5.cnt++; }
                        }
                    });
                    if (any) completedHoles++;
                }

                const con = document.getElementById('recap-body');
                if (completedHoles === 0) { con.innerHTML = '<div style="padding:20px; text-align:center; color:#94A3B8;">No scores yet.</div>'; return; }

                let html = '';
                // 0. FULL SCORECARD (Requested v275.5)
                html += this.getScorecardHTML();
                html += this.getGrossTotalsHTML();

                // RABBIT HISTORY TRACKER (Requested v275.9, Moved v275.11)
                if (this.d.gameType === 'rabbit') {
                    this.calcRabbit();
                    let rHTML = `<div class="box" style="margin-top:12px;">
                        <div class="tx-sm" style="color:#F97316; margin-bottom:12px;">🐇 RABBIT TRACKER</div>
                        <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px;">`;
                    for (let h = 1; h <= 18; h++) {
                        const holder = (this.d.rabbitHistory && this.d.rabbitHistory[h] !== undefined) ? this.d.rabbitHistory[h] : null;
                        let hCol = "#1E293B", txt = '-', bdr = '1px solid #334155';
                        if (holder !== null && holder !== undefined) {
                            hCol = "#F97316";
                            txt = this.d.ps[holder] ? this.d.ps[holder].substring(0, 3) : '-';
                            bdr = '1px solid #EA580C';
                        }
                        rHTML += `<div style="background:${hCol}; border:${bdr}; padding:4px; border-radius:6px; text-align:center;">
                            <div style="font-size:9px; color:rgba(255,255,255,0.7); font-weight:900;">H${this.ghl(h)}</div>
                            <div style="font-size:11px; color:white; font-weight:900; overflow:hidden; text-transform:uppercase;">${txt}</div>
                        </div>`;
                    }
                    rHTML += `</div></div>`;
                    html += rHTML;
                }

                // 1. GROSS BREAKDOWN
                html += `<div class="box" style="margin-top:20px;">
                    <div class="tx-sm" style="color:white; margin-bottom:12px;">SCORING BREAKDOWN (GROSS)</div>
                    <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                        <div style="flex:2; color:#94A3B8; font-size:10px; font-weight:700;">PLAYER</div>
                        <div style="flex:1; text-align:center; color:#10B981; font-size:10px; font-weight:900;">BIRD</div>
                        <div style="flex:1; text-align:center; color:#cbd5e1; font-size:10px; font-weight:900;">PAR</div>
                        <div style="flex:1; text-align:center; color:#F59E0B; font-size:10px; font-weight:900;">BOG</div>
                        <div style="flex:1; text-align:center; color:#EF4444; font-size:10px; font-weight:900;">DBL+</div>
                    </div>`;
                pStats.forEach(p => {
                    if (p.totalStrokes === 0) return;
                    html += `<div style="display:flex; align-items:center; padding:6px 0; border-bottom:1px solid #1e293b;">
                        <div style="flex:2; color:white; font-weight:700; font-size:13px;">${p.name}</div>
                        <div style="flex:1; text-align:center; color:#10B981; font-weight:700;">${p.dist.bird}</div>
                        <div style="flex:1; text-align:center; color:#cbd5e1; font-weight:700;">${p.dist.par}</div>
                        <div style="flex:1; text-align:center; color:#F59E0B; font-weight:700;">${p.dist.bog}</div>
                        <div style="flex:1; text-align:center; color:#EF4444; font-weight:700;">${p.dist.dbl}</div>
                    </div>`;
                });
                html += `</div>`;

                // 2. NET BREAKDOWN
                html += `<div class="box" style="margin-top:12px;">
                    <div class="tx-sm" style="color:white; margin-bottom:12px;">SCORING BREAKDOWN (NET)</div>
                    <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                        <div style="flex:2; color:#94A3B8; font-size:10px; font-weight:700;">PLAYER</div>
                        <div style="flex:1; text-align:center; color:#10B981; font-size:10px; font-weight:900;">BIRD</div>
                        <div style="flex:1; text-align:center; color:#cbd5e1; font-size:10px; font-weight:900;">PAR</div>
                        <div style="flex:1; text-align:center; color:#F59E0B; font-size:10px; font-weight:900;">BOG</div>
                        <div style="flex:1; text-align:center; color:#EF4444; font-size:10px; font-weight:900;">DBL+</div>
                    </div>`;
                pStats.forEach(p => {
                    if (p.totalStrokes === 0) return;
                    html += `<div style="display:flex; align-items:center; padding:6px 0; border-bottom:1px solid #1e293b;">
                        <div style="flex:2; color:white; font-weight:700; font-size:13px;">${p.name}</div>
                        <div style="flex:1; text-align:center; color:#10B981; font-weight:700;">${p.netDist.bird}</div>
                        <div style="flex:1; text-align:center; color:#cbd5e1; font-weight:700;">${p.netDist.par}</div>
                        <div style="flex:1; text-align:center; color:#F59E0B; font-weight:700;">${p.netDist.bog}</div>
                        <div style="flex:1; text-align:center; color:#EF4444; font-weight:700;">${p.netDist.dbl}</div>
                    </div>`;
                });
                html += `</div>`;

                // 3. FINANCIAL NET TOTALS (Requested v275.5)
                html += this.getNetTotalsHTML();

                // HANDICAP SUMMARY
                const strokeHoles = [];
                for (let h = 1; h <= 18; h++) {
                    const hcpAlloc = c.hcp[h - 1];
                    const getters = [];
                    [0, 1, 2, 3].forEach(i => {
                        const pops = this.getPops(i, h - 1);
                        if (pops > 0) getters.push(`${this.d.ps[i]} (${pops})`);
                    });
                    if (getters.length > 0) strokeHoles.push({ h: h, hcp: hcpAlloc, list: getters });
                }

                html += `<div class="box" style="margin-top:12px;">
                    <div class="tx-sm" style="color:white; margin-bottom:8px;">HANDICAP SUMMARY</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">`;
                if (strokeHoles.length > 0) {
                    strokeHoles.forEach(item => {
                        html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:6px 10px; border-radius:6px;">
                            <span style="color:#cbd5e1; font-size:12px; font-weight:700;">HOLE ${item.h} <span style="color:#94A3B8; font-weight:400;">(HCP ${item.hcp})</span></span>
                            <span style="color:#F59E0B; font-size:11px; font-weight:700; text-align:right;">${item.list.join(', ')}</span>
                          </div>`;
                    });
                } else {
                    html += `<div style="color:#94A3B8; font-size:12px; padding:6px;">No strokes given.</div>`;
                }
                html += `</div></div>`;

                // JUNK DRAWER
                const junk = this.getJunkStats();
                html += `<div class="box" style="margin-top:12px;">
                    <div class="tx-sm" style="color:white; margin-bottom:12px;">THE JUNK DRAWER</div>
                    <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                        <div style="flex:2; color:#94A3B8; font-size:10px; font-weight:700;">PLAYER</div>
                        <div style="flex:1; text-align:center; color:#10B981; font-size:14px;">🟢</div>
                        <div style="flex:1; text-align:center; color:#F59E0B; font-size:14px;">🏖️</div>
                        <div style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; color:#8B5CF6; font-size:11px; font-weight:900;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3v13" /><rect x="9" y="16" width="8" height="4" rx="1" /><ellipse cx="5" cy="18" rx="3" ry="1.5" /></svg> LP</div>
                    </div>`;
                pStats.forEach(p => {
                    const j = junk[p.name];
                    html += `<div style="display:flex; align-items:center; padding:6px 0; border-bottom:1px solid #1e293b;">
                        <div style="flex:2; color:white; font-weight:700; font-size:13px;">${p.name}</div>
                        <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.G : 0}</div>
                        <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.S : 0}</div>
                        <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.P : 0}</div>
                    </div>`;
                });
                html += `</div>`;

                // FIREBALL HOLES (Redefined v255.1)
                const fbHoles = [];
                for (let h = 1; h <= 18; h++) {
                    if (!this.d.s[h]) continue;
                    const par = c.p[h - 1];
                    const bMakers = [];
                    [0, 1, 2, 3].forEach(i => {
                        const s = (this.d.s[h] && this.d.s[h][this.slotMap[i]]);
                        if (typeof s === 'number' && s < par) bMakers.push(this.d.ps[i]);
                    });
                    if (bMakers.length > 0) fbHoles.push({ h: h, ps: bMakers });
                }

                html += `<div class="box" style="margin-top:12px; background:linear-gradient(135deg, #1E293B, #332d1e);">
                    <div class="flex-r" style="margin-bottom:8px;">
                        <div class="tx-sm" style="color:#F59E0B;">🔥 FIREBALL HOLES</div>
                        <div class="tx-sm" style="color:white;">Total: ${fbHoles.length}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">`;

                if (fbHoles.length > 0) {
                    fbHoles.forEach(item => {
                        html += `<div style="background:#0F172A; padding:6px 12px; border-radius:8px; border:1px solid #F59E0B; display:flex; align-items:center; justify-content:space-between;">
                            <span style="color:#F59E0B; font-weight:900; font-size:14px;">HOLE ${this.ghl(item.h)}</span>
                            <span style="color:white; font-weight:700; font-size:13px; text-align:right;">${item.ps.join(', ')}</span>
                        </div>`;
                    });
                } else {
                    html += `<div style="color:#94A3B8; font-size:12px; text-align:center; padding:8px;">No Fireballs Yet.</div>`;
                }
                html += `</div></div>`;

                // AVERAGES
                html += `<div class="box" style="margin-top:12px;"><div class="tx-sm" style="color:white; margin-bottom:8px;">SCORING AVERAGES</div><div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px;"><div class="tx-sm" style="text-align:left;">PLAYER</div><div class="tx-sm" style="text-align:center;">PAR 3</div><div class="tx-sm" style="text-align:center;">PAR 4</div><div class="tx-sm" style="text-align:center;">PAR 5</div></div>`;
                pStats.forEach(p => {
                    const a3 = p.p3.cnt ? (p.p3.tot / p.p3.cnt).toFixed(1) : '-';
                    const a4 = p.p4.cnt ? (p.p4.tot / p.p4.cnt).toFixed(1) : '-';
                    const a5 = p.p5.cnt ? (p.p5.tot / p.p5.cnt).toFixed(1) : '-';
                    html += `<div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px; padding:6px 0; border-top:1px solid #334155;"><div style="font-size:12px; font-weight:700; color:#cbd5e1;">${p.name.substring(0, 8)}</div><div style="font-size:12px; font-weight:700; color:white; text-align:center;">${a3}</div><div style="font-size:12px; font-weight:700; color:white; text-align:center;">${a4}</div><div style="font-size:12px; font-weight:700; color:white; text-align:center;">${a5}</div></div>`;
                });
                html += `</div>`;

                con.innerHTML = html;
            },

            uDash: function () {
                if (this.d.gameType === 'rabbit') this.calcRabbit();
                const c = CS[this.d.crs];
                const hIdx = this.d.h - 1;
                const par = (c && c.p) ? c.p[hIdx] : 4;

                const rh = this.getRelHole(this.d.h);
                let lbl = (this.d.nines && this.d.h > 9) ? `#${this.d.h - 9} / ${this.d.h}` : this.d.h;
                let hNumStr = "HOLE " + lbl;
                
                // Segment Hole Tracker (S1-H1 style)
                if (this.d.gameType === 'cod' || this.d.gameType === 'scramble') {
                    const rhp = ((rh - 1) % 6) + 1;
                    const sIdx = Math.floor((rh - 1) / 6) + 1;
                    hNumStr += ` (S${sIdx}-H${rhp})`;
                }
                
                const safeGet = (elId, val) => { const el = document.getElementById(elId); if (el) el.innerText = val; };
                safeGet('d-h-num', hNumStr);
                safeGet('d-par', par);
                
                const dists = (c && c.y) ? (c.y[this.d.tee] || []) : [];
                safeGet('d-dist', dists[hIdx] || '-');
                safeGet('d-hcp', (c && c.hcp) ? (c.hcp[hIdx] || '-') : '-');
                
                let tT = (this.d.tee || 'white').toUpperCase() + " TEE";
                if (this.d.tee === 'combo' && c) { 
                    let useGold = false;
                    const hasCmb = (c.cmb && c.cmb.length === 18);
                    const hasHcp = (c.hcp && c.hcp.length === 18);

                    if (this.d.crs === 'cc' && hasCmb) useGold = (c.cmb[hIdx] === 1);
                    else if (hasHcp) useGold = (c.hcp[hIdx] <= 9);
                    else if (hasCmb) useGold = (c.cmb[hIdx] === 1);

                    tT = useGold ? "GOLD TEE" : "WHITE TEE"; 
                }
                const teeInd = document.getElementById('d-tee-ind');
                if (teeInd) {
                    teeInd.innerText = tT;
                    teeInd.style.color = (tT.includes('GOLD') ? '#FFD700' : '#FFFFFF');
                }

                // Helper for safe name substrings
                const sn = (idx) => (this.d.ps[idx] || "").substring(0, 3).toUpperCase() || `P${idx+1}`;

                // RELATIVE HOLE LOGIC
                let m = Math.floor((rh - 1) / 6);
                if (this.d.gameType === 'nassau') m = 0;
                const results = this.calcSegResults(m);
                const main = results[0];
                const t1 = (main && main.seg) ? main.seg.t1 : [0, 1];
                const t2 = (main && main.seg) ? main.seg.t2 : [2, 3];

                let fmt = "COD (1-18)";
                if (this.d.gameType === 'single') fmt = "SCORECARD ONLY";
                else if (this.d.gameType === 'nassau') fmt = "NASSAU MATCH";
                else if (m === 0) fmt = "CARTS (1-6)";
                else if (m === 1) fmt = "OPPOSITES (7-12)";
                else fmt = "DRIVERS (13-18)";
                safeGet('d-fmt', fmt);

                // Status String (Main Match & Presses)
                const getStatStr = (res, label) => {
                    let s = "ALL SQUARE";
                    const rt1 = res.seg.t1, rt2 = res.seg.t2;
                    if (this.d.gameType === 'scramble') {
                        s = `PTS: ${res.w1} - ${res.w2}`;
                    } else if (this.d.gameType === 'stroke') {
                        return "";
                    } else {
                        let d = res.w1 - res.w2;
                        if (d > 0) s = `${sn(rt1[0])}/${sn(rt1[1])} <em style="color:#10B981">${d} UP</em>`;
                        else if (d < 0) s = `${sn(rt2[0])}/${sn(rt2[1])} <em style="color:#10B981">${Math.abs(d)} UP</em>`;
                    }
                    return `<div style="margin-bottom:4px;"><span style="font-size:10px; color:#94A3B8; font-weight:900; text-transform:uppercase; margin-right:8px;">${label}:</span> ${s}</div>`;
                };

                let statHTML = "";
                if (this.d.gameType === 'stroke' || this.d.gameType === 'single') {
                    const totals = [];
                    [0, 1, 2, 3].forEach(pIdx => {
                        if (!this.d.ps[pIdx]) return;
                        let relScore = 0;
                        let played = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                            if (sc) {
                                const hPar = (c && c.p) ? c.p[h - 1] : 4;
                                relScore += (sc - hPar);
                                played++;
                            }
                        }
                        totals.push({ name: this.d.ps[pIdx], short: this.d.ps[pIdx].substring(0, 8), score: relScore, played });
                    });
                    totals.sort((a, b) => a.score - b.score);
                    statHTML = `<div style="font-size:11px; font-weight:900; color:#10B981; margin-bottom:4px;">${this.d.gameType === 'single' ? 'SCORING SUMMARY' : 'LEADERBOARD (NET)'}</div>`;
                    totals.forEach((t, i) => {
                        let sStr = t.score === 0 ? 'E' : (t.score > 0 ? '+' + t.score : t.score);
                        if (t.played === 0) sStr = "-";
                        statHTML += `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:2px;">
                            <span>${i + 1}. ${t.short}</span>
                            <span style="color:${t.score < 0 ? '#10B981' : (t.score > 0 ? '#F87171' : 'white')}">${sStr}</span>
                         </div>`;
                    });

                    // Team Combined Score if 4 players and in stroke mode
                    if (this.d.gameType === 'stroke' && this.d.ps.filter(x => x).length === 4) {
                        const t1Score = (totals.find(t => t.name.substring(0, 3) === (this.d.ps[0]||"").substring(0, 3))?.score || 0) + (totals.find(t => t.name.substring(0, 3) === (this.d.ps[1]||"").substring(0, 3))?.score || 0);
                        const t2Score = (totals.find(t => t.name.substring(0, 3) === (this.d.ps[2]||"").substring(0, 3))?.score || 0) + (totals.find(t => t.name.substring(0, 3) === (this.d.ps[3]||"").substring(0, 3))?.score || 0);
                        statHTML += `<div style="margin-top:8px; border-top:1px solid #334155; padding-top:4px; font-size:10px; font-weight:900; color:#F59E0B;">TEAM TOTALS (NET)</div>`;
                        const n1 = `${sn(0)}/${sn(1)}`;
                        const n2 = `${sn(2)}/${sn(3)}`;
                        statHTML += `<div style="font-size:11px; display:flex; justify-content:space-between;">
                            <span>${n1}: ${t1Score === 0 ? 'E' : (t1Score > 0 ? '+' + t1Score : t1Score)}</span>
                            <span>${n2}: ${t2Score === 0 ? 'E' : (t2Score > 0 ? '+' + t2Score : t2Score)}</span>
                        </div>`;
                    }
                } else if (this.d.gameType === 'nassau') {
                    const nr = this.calcNassau();
                    const tn1 = `${sn(nr.t1[0])}/${sn(nr.t1[1])}`;
                    const tn2 = `${sn(nr.t2[0])}/${sn(nr.t2[1])}`;
                    const nassauLine = (label, seg) => {
                        const d = seg.w1 - seg.w2;
                        let val = 'ALL SQUARE';
                        if (d > 0) val = `${tn1} <em style="color:#10B981">${d} UP</em>`;
                        else if (d < 0) val = `${tn2} <em style="color:#10B981">${Math.abs(d)} UP</em>`;
                        return `<div style="margin-bottom:4px;"><span style="font-size:10px; color:#94A3B8; font-weight:900; text-transform:uppercase; margin-right:8px;">${label}:</span> ${val}</div>`;
                    };
                    statHTML = nassauLine('Front', nr.front) + nassauLine('Back', nr.back) + nassauLine('Total', nr.overall);
                } else if (main) {
                    statHTML = getStatStr(main, "Main Match");
                    results.slice(1).forEach((pR, pIdx) => {
                        const pData = (this.d.press && this.d.press[m]) ? this.d.press[m][pIdx] : null;
                        if (!pData) return;
                        const pNameStr = pData.team === 1 ? `${sn(t1[0])}/${sn(t1[1])}` : `${sn(t2[0])}/${sn(t2[1])}`;
                        statHTML += getStatStr(pR, `${pNameStr} Press (H${this.getAbsHole(pData.startH)})`);
                    });
                }

                // PRESS BUTTONS
                let pressButtons = '';
                if (main && this.d.gameType !== 'scramble' && this.d.gameType !== 'stroke' && this.d.gameType !== 'nassau') {
                    const diff1 = main.w1 - main.w2;
                    const diff2 = main.w2 - main.w1;
                    const hasP1 = this.d.press && this.d.press[m] && this.d.press[m].some(p => p.team === 1);
                    const hasP2 = this.d.press && this.d.press[m] && this.d.press[m].some(p => p.team === 2);
                    if (diff1 < 0 && !hasP1) pressButtons += `<button class="g-btn g-btn-sm" style="background:#EF4444; width:auto; margin-top:4px; margin-right:4px; padding:6px 10px; font-size:10px;" onclick="App.initiatePress(1)">${sn(t1[0])}/${sn(t1[1])} PRESS</button>`;
                    if (diff2 < 0 && !hasP2) pressButtons += `<button class="g-btn g-btn-sm" style="background:#F59E0B; width:auto; margin-top:4px; padding:6px 10px; font-size:10px;" onclick="App.initiatePress(2)">${sn(t2[0])}/${sn(t2[1])} PRESS</button>`;
                }
                const statusEl = document.getElementById('d-status');
                if (statusEl) statusEl.innerHTML = statHTML + pressButtons;

                // Exposure
                const exposure = { 0: 0, 1: 0, 2: 0, 3: 0 };
                [0, 1, 2].forEach(segIdx => {
                    const segRes = this.calcSegResults(segIdx);
                    segRes.forEach(r => {
                        if (r.winner === 1) { r.seg.t1.forEach(p => exposure[p] += r.amt); r.seg.t2.forEach(p => exposure[p] -= r.amt); }
                        else if (r.winner === 2) { r.seg.t2.forEach(p => exposure[p] += r.amt); r.seg.t1.forEach(p => exposure[p] -= r.amt); }
                    });
                });

                const map = (id, pid) => {
                    this.slotMap[id] = pid;
                    const ec = document.getElementById('slot-' + id);
                    if (!ec) return;
                    const jRow = ec.nextElementSibling;
                    if (!this.d.ps[pid]) { ec.style.display = 'none'; if (jRow) jRow.style.display = 'none'; return; }
                    ec.style.display = 'flex';
                    if (jRow) jRow.style.display = 'flex';

                    const nmEl = document.getElementById('nm-' + id);
                    const pops = this.getPops(pid, hIdx);
                    const dots = " (H)".repeat(pops);
                    if (this.d.gameType === 'single') {
                        let relScore = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pid]);
                            if (sc) relScore += (sc - ((c && c.p) ? c.p[h-1] : 4));
                        }
                        const sStr = relScore === 0 ? 'E' : (relScore > 0 ? '+' + relScore : relScore);
                        nmEl.innerHTML = `${this.d.ps[pid]} <span style="color:#10B981; font-weight:900; margin-left:8px; font-size:16px;">${sStr}</span>`;
                    } else {
                        const expVal = Math.round(exposure[pid] || 0);
                        const expTxt = (expVal >= 0 ? '+' : '') + expVal;
                        const expCol = expVal >= 0 ? '#10B981' : '#F87171';
                        const expBg = expVal >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)';
                        const jk = this.getJunkStats()[this.d.ps[pid]] || { G: 0, S: 0, P: 0 };
                        const junkStr = `<span style="font-size:9px; color:#94A3B8; margin-left:8px;">🟢${jk.G} 🏖️${jk.S} LP${jk.P}</span>`;
                        let rabbitIcon = '';
                        const lastHNum = this.d.h === 1 ? null : (this.d.h - 1);
                        if (this.d.gameType === 'rabbit' && lastHNum && this.d.rabbitHistory && this.d.rabbitHistory[lastHNum] === pid) rabbitIcon = ' <span style="font-size:18px;">🐇</span>';
                        nmEl.innerHTML = `${this.d.ps[pid]}${rabbitIcon}${dots} ${junkStr} <span style="color:${expCol}; background:${expBg}; border:1px solid ${expCol}44; font-weight:900; font-size:10px; padding:2px 6px; border-radius:6px; margin-left:4px; vertical-align:middle;">$${expTxt}</span>`;
                    }
                    nmEl.style.color = (pops > 0 && this.d.gameType !== 'single') ? '#F59E0B' : '#94A3B8';
                    const ghEl = document.getElementById('gh-' + id);
                    if (ghEl) ghEl.innerText = "PAR " + par;
                    const sc = this.d.s[this.d.h] && this.d.s[this.d.h][pid];
                    const es = document.getElementById('sc-' + id);
                    if (sc && es) {
                        ec.classList.add('has-score'); es.innerText = sc;
                        const net = sc - pops;
                        es.style.color = net < par ? '#10B981' : (net > par ? '#F87171' : 'white');
                    } else if (es) { ec.classList.remove('has-score'); es.innerText = ""; }
                };

                map(0, t1[0]); map(1, t1[1]);
                map(2, t2[0]); map(3, t2[1]);
                
                const isSingle = (this.d.gameType === 'single');
                
                const rbBanner = document.getElementById('rabbit-banner');
                if (rbBanner) {
                    if (this.d.gameType === 'rabbit') {
                        rbBanner.style.display = 'block';
                        const lastH = this.d.h === 1 ? null : (this.d.h - 1);
                        const holder = (lastH && this.d.rabbitHistory) ? this.d.rabbitHistory[lastH] : null;
                        if (holder !== null && holder !== undefined && this.d.ps[holder]) {
                            rbBanner.innerText = '🐇 ' + this.d.ps[holder] + ' HOLDS THE RABBIT';
                            rbBanner.style.background = '#F97316';
                            rbBanner.style.color = 'white';
                            rbBanner.style.border = 'none';
                        } else {
                            rbBanner.innerText = '🐇 THE RABBIT IS FREE';
                            rbBanner.style.background = 'transparent';
                            rbBanner.style.color = '#94A3B8'; 
                            rbBanner.style.border = '2px dashed #94A3B8';
                        }
                    } else {
                        rbBanner.style.display = 'none';
                    }
                }

                // 4. Update Team Names / Press Buttons
                const getTeamLabel = (indices) => {
                    const n1 = this.d.ps[indices[0]];
                    const n2 = this.d.ps[indices[1]];
                    if (n1 && n2) return `${n1} & ${n2}`;
                    return n1 || n2 || "TEAM";
                };

                const lbl1 = document.getElementById('lbl-t1');
                const lbl2 = document.getElementById('lbl-t2');
                const rh_calc = this.getRelHole(this.d.h);
                const curSeg_calc = Math.floor((rh_calc - 1) / 6);
                const main_calc = (this.d.gameType === 'cod' || this.d.gameType === 'scramble') ? this.calcSegResults(curSeg_calc)[0] : null;

                if (isSingle) {
                    lbl1.innerText = "PLAYERS";
                    lbl1.style.display = 'block';
                    lbl2.style.display = 'none';
                } else if (this.d.gameType === 'stroke') {
                    lbl1.innerText = "PARTNERS A";
                    lbl1.style.display = 'block';
                    lbl2.innerText = "PARTNERS B";
                    lbl2.style.display = 'block';
                } else if (main_calc) {
                    const t1Arr = main_calc.seg.t1, t2Arr = main_calc.seg.t2;
                    lbl1.innerText = getTeamLabel(t1Arr);
                    lbl1.style.display = (this.d.ps[t1Arr[0]] || this.d.ps[t1Arr[1]]) ? 'block' : 'none';
                    lbl2.innerText = getTeamLabel(t2Arr);
                    lbl2.style.display = (this.d.ps[t2Arr[0]] || this.d.ps[t2Arr[1]]) ? 'block' : 'none';
                }
                this.updateCaddy();
                this.updateJunkUI();
                this.checkStandingsBtn();
            },

            updateCaddy: function () {
                const el = document.getElementById('caddy-box');
                const msgEl = document.getElementById('caddy-msg');
                if (!el || !msgEl) return;

                const h = this.d.h;
                const hIdx = h - 1;
                const c = CS[this.d.crs];
                if (!c) return;
                const par = c.p[hIdx];
                const hcp = (c.hcp && c.hcp[hIdx]) ? c.hcp[hIdx] : 0;

                let msgs = [];

                // 1. Handicap Insights
                const hitters = [];
                [0, 1, 2, 3].forEach(i => {
                    if (this.d.ps[i] && this.getPops(i, hIdx) > 0) hitters.push(this.d.ps[i]);
                });

                if (hitters.length > 0 && this.d.gameType !== 'single') {
                    if (hitters.length === 1) {
                        msgs.push(`Strategy: **${hitters[0]}** gets a stroke here—huge strategic advantage!`);
                    } else if (hitters.length === 2) {
                        msgs.push(`Strategy: **${hitters[1]}** & **${hitters[0]}** both get strokes. Team effort needed!`);
                    } else {
                        msgs.push(`This is a high-hcp hole for the field. Grinding pars will win it.`);
                    }
                }

                // 2. COD Segment Context
                if (this.d.gameType === 'cod') {
                    const rh = this.getRelHole(h);
                    const m = Math.floor((rh - 1) / 6);
                    const holesLeft = (m + 1) * 6 - rh + 1;
                    const results = this.calcSegResults(m);
                    const main = results[0];

                    if (main) {
                        const d = main.w1 - main.w2;
                        if (d !== 0) {
                            const teamDown = d < 0 ? 1 : 2;
                            const tIdx = teamDown === 1 ? main.seg.t1 : main.seg.t2;
                            const teamName = `${this.d.ps[tIdx[0]]}/${this.d.ps[tIdx[1]]}`;
                            const diff = Math.abs(d);

                            if (holesLeft <= 2 && holesLeft > 0) {
                                msgs.push(`⚠️ Segment Alert: **${teamName}** is down ${diff} with ${holesLeft} left—Win needed!`);
                            } else if (diff >= 2) {
                                msgs.push(`📈 Momentum: **${teamName}** needs a strong finish to stabilize this segment.`);
                            }
                        } else if (holesLeft === 1) {
                            msgs.push(`🎯 All Square on the final hole of the segment! Pure pressure.`);
                        }
                    }
                }

                // 3. Technical Tips
                if (par === 3) msgs.push("⛳ Par 3: Greenies are active! Aim for the fat of the green and secure the par.");
                if (hcp <= 3 && hcp > 0) msgs.push(`⛰️ Difficulty: Hole Rank ${hcp}. This is the hardest stretch on the course.`);
                if (par === 5 && hcp >= 15) msgs.push("🦅 Scoring Opportunity: Short par 5. Aggressive play could pay off here.");

                if (msgs.length > 0) {
                    msgEl.innerHTML = msgs[0];
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            },

            tJ: function (idx, type) {
                const c = CS[this.d.crs] || CS['cc'];
                if (!c || !c.p) return;

                // Restriction: Greenies only on Par 3s
                if (type === 'G') {
                    if (c.p[this.d.h - 1] !== 3) { alert("Greenies only on Par 3s!"); return; }
                }

                if (!this.d.junk) this.d.junk = {};
                if (!this.d.junk[this.d.h]) this.d.junk[this.d.h] = {};
                const pid = this.slotMap[idx];
                const k = pid + '_' + type;
                if (this.d.junk[this.d.h][k]) delete this.d.junk[this.d.h][k];
                else this.d.junk[this.d.h][k] = true;
                this.save();
                this.updateJunkUI();
            },
            updateJunkUI: function () {
                const c = CS[this.d.crs] || CS['cc'];
                if (!c || !c.p) return;

                const par = c.p[this.d.h - 1];
                const isPar3 = (par === 3);

                document.querySelectorAll('.junk-btn').forEach(b => {
                    b.className = 'junk-btn';
                    if (b.id.endsWith('-g')) {
                        if (!isPar3) {
                            b.style.opacity = '0.2';
                            b.style.pointerEvents = 'none';
                        } else {
                            b.style.opacity = '1';
                            b.style.pointerEvents = 'auto';
                        }
                    } else {
                        b.style.opacity = '1';
                        b.style.pointerEvents = 'auto';
                    }
                });

                if (!this.d.junk || !this.d.junk[this.d.h]) return;

                [0, 1, 2, 3].forEach(i => {
                    const pid = this.slotMap[i];
                    ['G', 'S', 'P'].forEach(t => {
                        const btn = document.getElementById(`j${i}-${t.toLowerCase()}`);
                        if (btn) {
                            const active = this.d.junk[this.d.h][pid + '_' + t];
                            if (active) btn.classList.add('active-' + t.toLowerCase());
                        }
                    });
                });
            },
            getJunkStats: function () {
                const map = {};
                if (!this.d.ps) return map;
                this.d.ps.forEach(name => { if (name) map[name] = { G: 0, S: 0, P: 0, V: 0 }; });

                const c = CS[this.d.crs] || CS['cc'];
                if (this.d.junk) {
                    Object.keys(this.d.junk).forEach(hH => {
                        const h = parseInt(hH);
                        const holeData = this.d.junk[h];
                        const par = c.p[h - 1];
                        Object.keys(holeData).forEach(k => {
                            if (holeData[k]) {
                                const parts = k.split('_');
                                const type = parts.pop();
                                const pIdx = parseInt(parts[0]);
                                if (!isNaN(pIdx) && this.d.ps[pIdx]) {
                                    const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                                    const name = this.d.ps[pIdx];
                                    
                                    // Rule: G and S require Par or BETTER
                                    if (sc && (type === 'G' || type === 'S') && sc > par) {
                                        if (map[name]) map[name].V++;
                                        return;
                                    }
                                    
                                    if (map[name]) map[name][type]++;
                                }
                            }
                        });
                    });
                }
                return map;
            },
            openJunkModal: function () {
                document.getElementById('junk-modal').classList.add('active');
                const c = document.getElementById('j-players-list');
                c.innerHTML = '';
                [0, 1, 2, 3].forEach(i => {
                    if (this.d.chosen[i]) {
                        const name = this.d.chosen[i];
                        const isIn = (!this.d.junkPlayers || this.d.junkPlayers.includes(i));
                        c.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:8px; border-radius:8px; border:1px solid #334155;">
                            <span style="color:white; font-weight:700;">${name}</span>
                            <label class="switch">
                                <input type="checkbox" id="jp-${i}" ${isIn ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>`;
                    }
                });
                if (this.d.junkFreq) document.getElementById('j-freq').value = this.d.junkFreq;
                if (this.d.junkBet !== undefined) document.getElementById('j-bet').value = this.d.junkBet;
            },
            saveJunkSettings: function () {
                this.d.junkFreq = document.getElementById('j-freq').value;
                this.d.junkBet = parseInt(document.getElementById('j-bet').value) || 0;
                this.d.junkPlayers = [];
                [0, 1, 2, 3].forEach(i => {
                    const cb = document.getElementById('jp-' + i);
                    if (cb && cb.checked) this.d.junkPlayers.push(i);
                });
                this.save();
                document.getElementById('junk-modal').classList.remove('active');
            },
            showJunkPayout: function (segIdx) {
                const jRes = this.calcJunkRes();
                if (!jRes || !jRes.results[segIdx]) return;

                const r = jRes.results[segIdx];
                let h = `<div style="font-weight:900; color:#cbd5e1; margin-bottom:12px;">${r.name}</div>`;

                if (r.refunded) {
                    h += `<div style="color:#F59E0B; font-weight:700; background:rgba(245,158,11,0.1); padding:8px; border-radius:6px; margin-bottom:12px;">NO JUNK ITEMS EARNED. $${r.pot} REFUNDED TO GROUP.</div>`;
                } else {
                    let winners = false;
                    jRes.players.forEach(pIdx => {
                        if (r.payouts[pIdx] > 0) {
                            winners = true;
                            h += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b;">
                                <span style="font-weight:700; color:white;">${this.d.ps[pIdx]}</span>
                                <span style="font-weight:900; color:#10B981;">+$${r.payouts[pIdx]}</span>
                            </div>`;
                        }
                    });
                    if (!winners) h += `<div style="color:#94A3B8; font-style:italic;">No payouts this segment.</div>`;
                }

                if (r.voided && r.voided.length > 0) {
                    h += `<div style="margin-top:16px; font-size:12px; font-weight:700; color:#EF4444;">VOIDED (Bogey+):</div>`;
                    r.voided.forEach(v => {
                        h += `<div style="font-size:11px; color:#F87171; font-style:italic; margin-bottom:2px;">⚠️ ${this.d.ps[v.pIdx].substring(0,3)} ${v.type[0]} on H${v.h}</div>`;
                    });
                }

                if (r.carryover > 0) {
                    h += `<div style="margin-top:16px; background:rgba(245,158,11,0.1); border-radius:6px; padding:6px; font-size:12px; text-align:center; color:#F59E0B;">$${r.carryover} carries over to next segment</div>`;
                }

                document.getElementById('junk-payout-body').innerHTML = h;
                document.getElementById('junk-payout-modal').classList.add('active');
            },
            calcJunkRes: function () {
                const bet = 1; // Fixed at $1 as per user instruction
                let players = (!this.d.junkPlayers || this.d.junkPlayers.length == 0) ? [0, 1, 2, 3] : this.d.junkPlayers;
                players = players.filter(idx => this.d.ps[idx]);
                const buyInPerSeg = bet * players.length;
                if (buyInPerSeg === 0) return null;

                const segs = [
                    { name: "HOLES 1-6", h: [1, 6] },
                    { name: "HOLES 7-12", h: [7, 12] },
                    { name: "HOLES 13-18", h: [13, 18] }
                ];
                
                const results = [];
                const totalNet = { 0: 0, 1: 0, 2: 0, 3: 0 };
                let carryover = 0;

                segs.forEach((sig, segIdx) => {
                    const playerItems = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    let totalItemsInSeg = 0;
                    const voided = []; // Track voided items for the note

                    [1, 2, 3, 4, 5, 6].forEach(rh => {
                        const h = (segIdx * 6) + rh;
                        const c = CS[this.d.crs] || CS['cc'];
                        const par = c.p[h - 1];
                        if (this.d.junk && this.d.junk[h]) {
                            players.forEach(pIdx => {
                                ['G', 'S', 'P'].forEach(t => {
                                    if (this.d.junk[h][pIdx + '_' + t]) {
                                        const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                                        // RULE: G and S require Par or BETTER
                                        if (sc && (t === 'G' || t === 'S') && sc > par) {
                                            voided.push({ pIdx, h, type: t === 'G' ? 'Greenie' : 'Sandie', sc });
                                        } else {
                                            playerItems[pIdx]++;
                                            totalItemsInSeg++;
                                        }
                                    }
                                });
                            });
                        }
                    });

                    const segmentPot = buyInPerSeg + carryover;
                    const payouts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    let segCarryover = 0;
                    const isLastSeg = (segIdx === segs.length - 1);

                    if (totalItemsInSeg === 0) {
                        if (isLastSeg) {
                            // LAST SEGMENT REFUND: If no items, refund the pot equally to all players
                            const baseRefund = Math.floor(segmentPot / players.length);
                            let refundRem = segmentPot % players.length;
                            players.forEach(i => {
                                payouts[i] = baseRefund;
                                if (refundRem > 0) { payouts[i]++; refundRem--; }
                            });
                            segCarryover = 0;
                        } else {
                            segCarryover = segmentPot;
                        }
                    } else if (totalItemsInSeg <= segmentPot && !isLastSeg) {
                        // NORMAL SEGMENT: Each item gets $1, remainder carries over
                        players.forEach(i => {
                            payouts[i] = playerItems[i] * bet;
                        });
                        segCarryover = segmentPot - totalItemsInSeg;
                    } else {
                        // OVERFLOW OR LAST SEGMENT DRAIN: Proportional split of segmentPot among players based on items
                        // (On the last segment, we split EVERY dollar in the pot among achievers)
                        let currentTotal = 0;
                        players.forEach(i => {
                            const val = Math.round((playerItems[i] / totalItemsInSeg) * segmentPot);
                            payouts[i] = val;
                            currentTotal += val;
                        });

                        // Adjust for rounding
                        let diff = segmentPot - currentTotal;
                        if (diff !== 0) {
                            const eligible = players.filter(i => playerItems[i] > 0);
                            while (diff !== 0 && eligible.length > 0) {
                                for (let i of eligible) {
                                    if (diff > 0) { payouts[i]++; diff--; }
                                    else if (diff < 0 && payouts[i] > 0) { payouts[i]--; diff++; }
                                    if (diff === 0) break;
                                }
                            }
                        }
                        segCarryover = 0;
                    }

                    // Update total net
                    players.forEach(i => {
                        totalNet[i] += (payouts[i] - bet);
                    });

                    results.push({
                        name: sig.name,
                        pot: segmentPot,
                        totalItems: totalItemsInSeg,
                        payouts: payouts,
                        carryover: segCarryover,
                        refunded: (isLastSeg && totalItemsInSeg === 0),
                        voided: voided
                    });
                    
                    carryover = segCarryover;
                });

                return { results, net: totalNet, players, finalCarryover: carryover };
            },

            getScorecardHTML: function () {
                const c = CS[this.d.crs] || CS['cc'];
                const build9 = (startH, label) => {
                    let hH = `<tr><th>#</th>`;
                    for (let n = startH; n < startH + 9; n++) {
                        let l = (this.d.nines && n > 9) ? (n - 9) + '/' + n : n;
                        hH += `<th style="font-size:${(l.toString().length > 2) ? '8px' : '11px'}">${l}</th>`;
                    }
                    hH += `<th>${startH === 1 ? 'OUT' : 'IN'}</th>`;
                    if (startH === 10) hH += '<th>TOT</th>';
                    hH += '</tr>';

                    let hP = '<tr class="par-row"><td>PAR</td>';
                    let totP = 0;
                    for (let n = startH; n < startH + 9; n++) { hP += `<td>${c.p[n - 1]}</td>`; totP += c.p[n - 1]; }
                    hP += `<td>${totP}</td>`;
                    if (startH === 10) {
                        let grandP = c.p.slice(0, 18).reduce((a, b) => a + b, 0);
                        hP += `<td>${grandP}</td>`;
                    }
                    hP += '</tr>';

                    let pRows = '';
                    [0, 1, 2, 3].forEach(pIdx => {
                        if (!this.d.ps[pIdx]) return;
                        let r = `<tr><td>${this.d.ps[pIdx].substring(0, 8)}</td>`;
                        let tot = 0;
                        for (let n = startH; n < startH + 9; n++) {
                            const s = (this.d.s[n] && this.d.s[n][pIdx]);
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
                                valHTML = `<div class="sc-val ${cls}">${s}</div>`;
                            }

                            const pops = this.getPops(pIdx, n - 1);
                            if (pops > 0) {
                                let dStr = '';
                                for (let k = 0; k < pops; k++) dStr += '•';
                                valHTML += `<div style="font-size:16px; line-height:10px; color:#F472B6; position:absolute; bottom:2px; right:2px; letter-spacing:-2px;">${dStr}</div>`;
                            }

                            r += `<td style="position:relative;">${valHTML}</td>`;
                        }
                        r += `<td>${tot}</td>`;
                        if (startH === 10) {
                            let grand = 0;
                            for (let x = 1; x <= 18; x++) {
                                if (this.d.s[x] && typeof this.d.s[x][pIdx] === 'number') grand += this.d.s[x][pIdx];
                            }
                            r += `<td>${grand === 0 ? '-' : grand}</td>`;
                        }
                        r += '</tr>';
                        pRows += r;
                    });

                    return `<div style="margin-bottom:20px;">
                        <div style="font-size:12px; font-weight:900; color:#10B981; margin-bottom:4px; text-transform:uppercase;">${label}</div>
                        <div class="card-table-wrap">
                            <table><thead>${hH}</thead><tbody>${hP}${pRows}</tbody></table>
                        </div>
                    </div>`;
                };
                return build9(1, 'FRONT 9') + build9(10, 'BACK 18');
            },

            getGrossTotalsHTML: function () {
                let totHTML = '<div class="box" style="margin-top:0; padding:12px; background:#1E293B; border:1px solid #334155; border-radius:12px;"><div style="font-size:12px; font-weight:900; color:#10B981; margin-bottom:8px; text-transform:uppercase;">Gross Totals</div><div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">';
                this.d.ps.forEach((p, i) => {
                    if (!p) return;
                    let t = 0;
                    for (let h = 1; h <= 18; h++) if (this.d.s[h] && this.d.s[h][i]) t += this.d.s[h][i];
                    totHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:8px 12px; border-radius:8px; border:1px solid #334155;"><span style="font-size:12px; font-weight:700; color:#94A3B8; text-transform:uppercase;">${p.substring(0, 8)}</span><span style="font-size:15px; font-weight:900; color:white;">${t || '-'}</span></div>`;
                });
                totHTML += '</div></div>';
                return totHTML;
            },

            getNetTotalsHTML: function () {
                const c = CS[this.d.crs] || CS['cc'];
                const bets = { 0: 0, 1: 0, 2: 0, 3: 0 };
                
                // 1. Match/Game logic
                if (this.d.gameType === 'stroke') {
                    const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                    const pot = this.d.pot || 0;
                    const buyIn = activeSeats.length > 0 ? Math.round(pot / activeSeats.length) : 0;
                    const totals = [];
                    this.d.ps.forEach((p, pIdx) => {
                        if (!p) return;
                        let net = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                            if (sc) net += (sc - this.getPops(pIdx, h - 1) - c.p[h - 1]);
                        }
                        totals.push({ idx: pIdx, score: net });
                    });
                    totals.sort((a, b) => a.score - b.score);
                    const winner = totals[0];
                    if (winner && pot > 0) {
                        activeSeats.forEach(i => {
                            if (i !== winner.idx) bets[i] -= buyIn;
                            else bets[i] += (buyIn * (activeSeats.length - 1));
                        });
                    }
                } else if (this.d.gameType === 'rabbit') {
                    const pot = this.d.pot || 0;
                    const hP = pot * 0.40; // 40% Front (Updated v275.12)
                    const fP = pot * 0.60; // 60% Back (Updated v275.12)
                    const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                    const n = activeSeats.length;
                    if (n > 0) {
                        const h9 = this.d.rabbitHistory && this.d.rabbitHistory[9];
                        const h18 = this.d.rabbitHistory && this.d.rabbitHistory[18];
                        if (h9 !== null && h9 !== undefined && this.d.ps[h9]) {
                            activeSeats.forEach(i => { if (i === h9) bets[i] += (hP * (n - 1)); else bets[i] -= hP; });
                        }
                        if (h18 !== null && h18 !== undefined && this.d.ps[h18]) {
                            activeSeats.forEach(i => { if (i === h18) bets[i] += (fP * (n - 1)); else bets[i] -= fP; });
                        }
                    }
                } else if (this.d.gameType === 'nassau') {
                    const nr = this.calcNassau();
                    const bet = this.d.bet || 4;
                    [nr.front, nr.back, nr.overall].forEach(seg => {
                        if (seg.winner === 1) {
                            nr.t1.forEach(p => bets[p] += bet);
                            nr.t2.forEach(p => bets[p] -= bet);
                        } else if (seg.winner === 2) {
                            nr.t2.forEach(p => bets[p] += bet);
                            nr.t1.forEach(p => bets[p] -= bet);
                        }
                    });
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble') {
                    [0, 1, 2].forEach(idx => {
                        const results = this.calcSegResults(idx);
                        results.forEach(r => {
                            if (r.winner === 1) {
                                r.seg.t1.forEach(p => bets[p] += r.amt);
                                r.seg.t2.forEach(p => bets[p] -= r.amt);
                            } else if (r.winner === 2) {
                                r.seg.t2.forEach(p => bets[p] += r.amt);
                                r.seg.t1.forEach(p => bets[p] -= r.amt);
                            }
                        });
                    });
                }

                // 2. Junk logic
                const jRes = this.calcJunkRes();
                if (jRes && jRes.net) {
                    [0, 1, 2, 3].forEach(i => { if (this.d.ps[i] && jRes.net[i]) bets[i] += jRes.net[i]; });
                }

                // 3. Render
                let html = `<div class="box" style="margin-top:12px; border-top:1px solid #334155; padding-top:12px;">
                    <div style="font-size:11px; font-weight:900; color:#10B981; margin-bottom:12px; text-transform:uppercase;">Financial Net Totals (Incl. Junk)</div>`;
                [0, 1, 2, 3].forEach(i => {
                    if (this.d.ps[i]) {
                        const val = bets[i];
                        const color = val >= 0 ? '#10B981' : '#EF4444';
                        html += `<div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:8px 12px; border-radius:8px; border:1px solid #334155; margin-bottom:6px;">
                            <span style="font-size:13px; font-weight:700; color:#94A3B8;">${this.d.ps[i]}</span>
                            <span style="font-size:15px; font-weight:900; color:${color};">${val >= 0 ? '+' : ''}$${val}</span>
                        </div>`;
                    }
                });
                html += `</div>`;
                return html;
            },

            uCard: function () {
                const c = CS[this.d.crs] || CS['cc'];
                const cardCon = document.getElementById('card-con-body');
                if (!cardCon) return;

                cardCon.innerHTML = this.getScorecardHTML();
                cardCon.innerHTML += this.getGrossTotalsHTML();

                const bets = { 0: 0, 1: 0, 2: 0, 3: 0 };
                let resHTML = "";

                if (this.d.gameType === 'stroke') {
                    const totals = [];
                    this.d.ps.forEach((p, pIdx) => {
                        if (!p) return;
                        let net = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                            if (sc) net += (sc - this.getPops(pIdx, h - 1) - c.p[h - 1]);
                        }
                        totals.push({ idx: pIdx, name: p, score: net });
                    });
                    totals.sort((a, b) => a.score - b.score);
                    const winner = totals[0];
                    const pot = this.d.pot || 0;
                    const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                    const buyIn = activeSeats.length > 0 ? Math.round(pot / activeSeats.length) : 0;
                    if (winner) {
                        resHTML = `<div style="text-align:center; padding:10px; background:rgba(16, 185, 129, 0.1); border-radius:8px;">
                            <div style="font-size:14px; font-weight:900; color:#10B981;">🏆 WINNER: ${winner.name}</div>
                            <div style="font-size:12px; color:white;">SCORE: ${winner.score === 0 ? 'E' : (winner.score > 0 ? '+' + winner.score : winner.score)} NET</div>
                            ${pot > 0 ? `<div style="font-size:18px; font-weight:900; color:#F59E0B; margin-top:5px;">PAYOUT: $${pot}</div>` : ''}
                        </div><br>`;
                        if (pot > 0) {
                            activeSeats.forEach(i => {
                                if (i !== winner.idx) bets[i] -= buyIn;
                                else bets[i] += (buyIn * (activeSeats.length - 1));
                            });
                        }
                    }
                
                } else if (this.d.gameType === 'rabbit') {
                    const pot = this.d.pot || 0;
                    const hP = pot * 0.25;
                    const fP = pot * 0.75;
                    const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                    const n = activeSeats.length;
                    
                    if (n > 0) {
                        const h9 = this.d.rabbitHistory[9];
                        const h18 = this.d.rabbitHistory[18];
                        
                        if (h9 !== null && h9 !== undefined && this.d.ps[h9]) {
                            activeSeats.forEach(i => { if (i === h9) bets[i] += (hP * (n - 1)); else bets[i] -= hP; });
                        }
                        if (h18 !== null && h18 !== undefined && this.d.ps[h18]) {
                            activeSeats.forEach(i => { if (i === h18) bets[i] += (fP * (n - 1)); else bets[i] -= fP; });
                        }

                        const p9 = (h9 !== null && h9 !== undefined && this.d.ps[h9]) ? `${this.d.ps[h9]} (+$${(hP * n).toFixed(2)})` : "NOBODY (PUSHED)";
                        const p18 = (h18 !== null && h18 !== undefined && this.d.ps[h18]) ? `${this.d.ps[h18]} (+$${(fP * n).toFixed(2)})` : "NOBODY (PUSHED)";
                        resHTML += '<div style="margin-bottom:16px; background:rgba(16, 185, 129, 0.1); padding:10px; border-radius:8px;">' +
                            '<div style="font-weight:900; color:#10B981; font-size:14px; text-transform:uppercase; margin-bottom:8px; text-align:center;">🐇 RABBIT HUNTER PAYOUTS</div>' +
                            '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; font-weight:700;"><span style="color:#94A3B8;">FRONT 9:</span><span style="color:white;">' + p9 + '</span></div>' +
                            '<div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;"><span style="color:#94A3B8;">BACK 18:</span><span style="color:white;">' + p18 + '</span></div>' +
                            '</div>';
                    }
                } else if (this.d.gameType === 'nassau') {
                    const nr = this.calcNassau();
                    const bet = this.d.bet || 4;
                    const tn1 = `${this.d.ps[nr.t1[0]]}/${this.d.ps[nr.t1[1]]}`;
                    const tn2 = `${this.d.ps[nr.t2[0]]}/${this.d.ps[nr.t2[1]]}`;
                    [nr.front, nr.back, nr.overall].forEach(seg => {
                        if (seg.winner === 1) { nr.t1.forEach(p => bets[p] += bet); nr.t2.forEach(p => bets[p] -= bet); }
                        else if (seg.winner === 2) { nr.t2.forEach(p => bets[p] += bet); nr.t1.forEach(p => bets[p] -= bet); }
                    });
                    const segLine = (label, seg) => {
                        if (seg.winner === 1) return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#94A3B8;">${label}:</span><span style="color:#10B981;">${tn1} wins +$${bet}</span></div>`;
                        if (seg.winner === 2) return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#94A3B8;">${label}:</span><span style="color:#F59E0B;">${tn2} wins +$${bet}</span></div>`;
                        return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#94A3B8;">${label}:</span><span style="color:#94A3B8;">All Square</span></div>`;
                    };
                    resHTML += `<div style="margin-bottom:16px;background:rgba(96,165,250,0.1);padding:10px;border-radius:8px;">`
                        + `<div style="font-weight:900;color:#60A5FA;font-size:14px;text-align:center;margin-bottom:10px;">🏆 NASSAU RESULTS</div>`
                        + segLine('FRONT 9', nr.front)
                        + segLine('BACK 9', nr.back)
                        + segLine('TOTAL', nr.overall)
                        + `</div>`;
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble') {
                    ["CARTS (1-6)", "OPPOSITES (7-12)", "DRIVERS (13-18)"].forEach((lbl, idx) => {
                        const results = this.calcSegResults(idx);
                        results.forEach((r, rIdx) => {
                            if (r.winner === 1) {
                                r.seg.t1.forEach(p => bets[p] += r.amt);
                                r.seg.t2.forEach(p => bets[p] -= r.amt);
                            } else if (r.winner === 2) {
                                r.seg.t2.forEach(p => bets[p] += r.amt);
                                r.seg.t1.forEach(p => bets[p] -= r.amt);
                            }
                            const matchName = (rIdx === 0) ? lbl : `PRESS (H${this.getAbsHole(r.startRh)}-${this.getAbsHole(r.endRh)})`;
                            let wTxt = "ALL SQUARE", wCol = "white";
                            if (r.winner === 1) { wTxt = `${this.d.ps[r.seg.t1[0]]}/${this.d.ps[r.seg.t1[1]]} (+$${r.amt})`; wCol = "#10B981"; }
                            else if (r.winner === 2) { wTxt = `${this.d.ps[r.seg.t2[0]]}/${this.d.ps[r.seg.t2[1]]} (+$${r.amt})`; wCol = "#F59E0B"; }

                            resHTML += `<div style="margin-bottom:16px;">
                                <div style="font-weight:900; color:#94A3B8; font-size:11px; text-transform:uppercase; margin-bottom:2px;">${matchName}</div>
                                <div style="font-size:14px; font-weight:900; color:${wCol}; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:4px;">${wTxt}</div>
                                <div style="display:flex; flex-wrap:wrap; gap:6px;">`;
                            const start = rIdx === 0 ? (idx * 6) + 1 : r.startRh;
                            const end = (idx * 6) + 6;
                            for (let hRel = start; hRel <= end; hRel++) {
                                const h = this.getAbsHole(hRel);
                                const s = this.d.s[h];
                                if (!s || Object.keys(s).length < 4) continue;
                                let best1, best2;
                                if (this.d.gameType === 'scramble') {
                                    best1 = Math.min(s[r.seg.t1[0]], s[r.seg.t1[1]]);
                                    best2 = Math.min(s[r.seg.t2[0]], s[r.seg.t2[1]]);
                                } else {
                                    best1 = Math.min(s[r.seg.t1[0]] - this.getPops(r.seg.t1[0], h - 1), s[r.seg.t1[1]] - this.getPops(r.seg.t1[1], h - 1));
                                    best2 = Math.min(s[r.seg.t2[0]] - this.getPops(r.seg.t2[0], h - 1), s[r.seg.t2[1]] - this.getPops(r.seg.t2[1], h - 1));
                                }
                                let bStyle = "background:#334155; color:#94A3B8;", bTxt = `H${h}`;
                                if (best1 < best2) { bStyle = "background:#10B981; color:#064E3B;"; bTxt = `H${h}: ${best1}`; }
                                else if (best2 < best1) { bStyle = "background:#F59E0B; color:#78350F;"; bTxt = `H${h}: ${best2}`; }
                                else { bTxt = `H${h}: -`; }
                                resHTML += `<div style="${bStyle} padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700;">${bTxt}</div>`;
                            }
                            resHTML += `</div></div>`;
                        });
                    });
                }

                resHTML += this.getNetTotalsHTML();

                const jRes = this.calcJunkRes();
                if (jRes) {
                    resHTML += `<div style="margin-top:20px; border-top:1px dashed #475569; padding-top:12px;"><div style="font-size:11px; font-weight:900; color:#F59E0B; margin-bottom:4px; text-transform:uppercase;">Segment Junk Payouts</div>`;
                    jRes.results.forEach((r, segIdx) => {
                        let inner = '';
                        jRes.players.forEach(i => {
                            if (r.payouts[i] > 0) {
                                inner += `<span style="margin-left:8px; color:white;">${this.d.ps[i].substring(0,3)}: $${r.payouts[i]}</span>`;
                            }
                        });
                        resHTML += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#cbd5e1; margin-bottom:4px; border-bottom:1px solid #1e293b; padding-bottom:2px;">
                            <div style="font-weight:700;">${r.name} (${r.totalItems} items)</div>
                            <div>${r.refunded ? '<span style="color:#F59E0B;">(REFUNDED)</span>' : ''} ${inner || '<span style="color:#94A3B8;">-</span>'}</div>
                        </div>`;
                        
                        if (r.voided && r.voided.length > 0) {
                            r.voided.forEach(v => {
                                resHTML += `<div style="font-size:9px; color:#EF4444; margin-bottom:2px; text-align:right; font-style:italic;">⚠️ ${this.d.ps[v.pIdx].substring(0,3)} ${v.type[0]} voided by Bogey+ on H${v.h}</div>`;
                            });
                        }

                        if (r.carryover > 0 && segIdx < jRes.results.length - 1) {
                            resHTML += `<div style="text-align:right; font-size:10px; color:#F59E0B; margin-top:-2px; margin-bottom:6px;">$${r.carryover} carries over</div>`;
                        }
                    });
                    resHTML += `<div style="margin-top:12px; border-top:1px solid #334155; padding-top:4px;"><div style="font-size:11px; font-weight:900; color:#94A3B8; text-transform:uppercase;">Junk Round Totals</div>`;
                    jRes.players.forEach(i => {
                        const v = Math.round(jRes.net[i]);
                        resHTML += `<div style="display:flex; justify-content:space-between; font-size:13px; color:#cbd5e1; padding:2px 0;"><span>${this.d.ps[i]}</span><span style="color:${v >= 0 ? '#10B981' : '#F87171'}">${v >= 0 ? '+' : ''}$${v}</span></div>`;
                    });
                    resHTML += `</div></div>`;
                }
                document.getElementById('res-txt').innerHTML = resHTML;

                const btn = document.getElementById('hist-btn');
                if (btn) {
                    const exists = this.historyArchive.some(h => h.id === this.d.gameId);
                    if (exists || Object.keys(this.d.s).length === 0) { btn.disabled = true; btn.innerText = "HISTORY SAVED"; btn.style.background = "#334155"; }
                    else { btn.disabled = false; btn.innerText = "SAVE TO HISTORY"; btn.style.background = "#10B981"; }
                }
            },

            share: async function () {
                if (this.d.h >= 18) this.saveToHistory();
                const btn = document.getElementById('sms-btn');
                try {
                    btn.innerText = "GENERATING PREVIEW...";

                    const c = CS[this.d.crs] || CS['cc'];
                    const ps = this.d.ps;

                    const isScramble = (this.d.gameType === 'scramble');
                    const bets = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    const pts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    const segRes = [];

                    let totals = []; // Defined properly here
                    if (this.d.gameType === 'stroke') {
                        const c = CS[this.d.crs] || CS['cc'];
                        this.d.ps.forEach((p, pIdx) => {
                            if (!p) return;
                            let netScore = 0;
                            for (let h = 1; h <= 18; h++) {
                                const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                                if (sc) netScore += (sc - this.getPops(pIdx, h - 1) - c.p[h - 1]);
                            }
                            totals.push({ idx: pIdx, name: p, score: netScore });
                        });
                        totals.sort((a, b) => a.score - b.score);
                        const winner = totals[0];
                        const pot = this.d.pot || 0;
                        const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                        const buyIn = activeSeats.length > 0 ? Math.round(pot / activeSeats.length) : 0; // Rounded

                        if (winner) {
                            segRes.push({ name: "🏆 WINNER", val: `${winner.name} (${winner.score === 0 ? 'E' : (winner.score > 0 ? '+' + winner.score : winner.score)} NET)`, color: "#10B981" });
                            if (pot > 0) {
                                segRes.push({ name: "💰 PAYOUT", val: `$${buyIn * (activeSeats.length - 1)}`, color: "#F59E0B" });
                                activeSeats.forEach(i => {
                                    if (i !== winner.idx) bets[i] -= buyIn;
                                    else bets[i] += (buyIn * (activeSeats.length - 1));
                                });
                            }
                        }
                        if (this.d.ps.filter(x => x).length === 4) {
                            const t1Score = totals.find(t => t.idx === 0).score + totals.find(t => t.idx === 1).score;
                            const t2Score = totals.find(t => t.idx === 2).score + totals.find(t => t.idx === 3).score;
                            let teamWinner = t1Score < t2Score ? "TEAM A" : (t2Score < t1Score ? "TEAM B" : "PUSH");
                            segRes.push({ name: "👥 TEAM WIN", val: teamWinner, color: "#22D3EE" });
                        }
                    } else if (this.d.gameType === 'single') {
                        this.d.ps.forEach((p, pIdx) => {
                            if (!p) return;
                            let grossScore = 0;
                            let netScore = 0;
                            for (let h = 1; h <= 18; h++) {
                                const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                                if (sc) {
                                    grossScore += sc;
                                    netScore += (sc - this.getPops(pIdx, h - 1, true));
                                }
                            }
                            const parTotal = c.p.slice(0, 18).reduce((a, b) => a + b, 0);
                            const relNet = netScore - parTotal;
                            const sign = relNet > 0 ? '+' : '';
                            const relStr = relNet === 0 ? 'E' : `${sign}${relNet}`;
                            segRes.push({ name: p, val: `${grossScore} (${relStr} NET)`, color: "#10B981" });
                            bets[pIdx] = 0; // No financial in single player
                        });
                    } else { // This else block now correctly handles non-stroke games
                        [0, 1, 2].forEach(idx => {
                            const results = this.calcSegResults(idx);
                            results.forEach((r, rIdx) => {
                                let wStr = "";
                                let col = "white";

                                if (isScramble) {
                                    if (r.winner === 1) {
                                        wStr = `${ps[r.seg.t1[0]]} & ${ps[r.seg.t1[1]]} won (+${r.w1} pts)`;
                                        r.seg.t1.forEach(p => bets[p] += r.amt);
                                        r.seg.t2.forEach(p => bets[p] -= r.amt);
                                        col = "#10B981";
                                    } else if (r.winner === 2) {
                                        wStr = `${ps[r.seg.t2[0]]} & ${ps[r.seg.t2[1]]} won (+${r.w2} pts)`;
                                        r.seg.t2.forEach(p => bets[p] += r.amt);
                                        r.seg.t1.forEach(p => bets[p] -= r.amt);
                                        col = "#F59E0B";
                                    } else {
                                        wStr = `Tie (${r.w1} pts each)`;
                                    }
                                    segRes.push({ name: (rIdx === 0 ? ["BLOCK 1", "BLOCK 2", "BLOCK 3"][idx] : `<span style="color:#22D3EE">PRESS</span>`), val: wStr, color: col });
                                } else {
                                    if (r.winner === 1) {
                                        wStr = `${ps[r.seg.t1[0]]} & ${ps[r.seg.t1[1]]} won $${r.amt}`;
                                        r.seg.t1.forEach(p => bets[p] += r.amt);
                                        r.seg.t2.forEach(p => bets[p] -= r.amt);
                                        col = "#10B981";
                                    } else if (r.winner === 2) {
                                        wStr = `${ps[r.seg.t2[0]]} & ${ps[r.seg.t2[1]]} won $${r.amt}`;
                                        r.seg.t2.forEach(p => bets[p] += r.amt);
                                        r.seg.t1.forEach(p => bets[p] -= r.amt);
                                        col = "#F59E0B";
                                    } else {
                                        wStr = "ALL SQUARE";
                                    }
                                    const matchName = (rIdx === 0) ? ["CARTS", "OPPOSITES", "DRIVERS"][idx] : `<span style="color:#22D3EE">PRESS</span> (H${this.getAbsHole(r.startRh)})`;
                                    segRes.push({ name: matchName, val: wStr, color: col });
                                }
                            });
                        });
                    }

                    // 2. Calculate Recap (Injected)
                    const pRecap = [];
                    [0, 1, 2, 3].forEach(i => {
                        if (!ps[i]) return;
                        pRecap[i] = {
                            id: i, name: ps[i],
                            dist: { bird: 0, par: 0, bog: 0, dbl: 0 },
                            totalStrokes: 0, netToPar: 0, birds: 0, dbls: 0
                        };
                    });
                    for (let x = 1; x <= 18; x++) {
                        const par = c.p[x - 1];
                        let any = false;
                        [0, 1, 2, 3].forEach(i => {
                            if (!ps[i]) return;
                            const s = (this.d.s[x] && this.d.s[x][i]);
                            if (typeof s === 'number') {
                                any = true;
                                pRecap[i].totalStrokes += s;
                                const d = s - par;
                                if (d <= -1) { pRecap[i].dist.bird++; pRecap[i].birds++; }
                                else if (d === 0) pRecap[i].dist.par++;
                                else if (d === 1) pRecap[i].dist.bog++;
                                else { pRecap[i].dist.dbl++; pRecap[i].dbls++; }
                                const pops = this.getPops(i, x - 1);
                                pRecap[i].netToPar += (s - pops) - par;
                            }
                        });
                    }
                    let recapHTML = '';
                    // FIREBALL HOLES (Share)
                    // Recalculate using pRecap scope data? No, need Hole Data.
                    // Loop holes again.
                    const fbHoles = [];
                    for (let h = 1; h <= 18; h++) {
                        if (!this.d.s[h]) continue;
                        const par = c.p[h - 1];
                        const bMakers = [];
                        [0, 1, 2, 3].forEach(i => {
                            const s = (this.d.s[h] && this.d.s[h][i]);
                            if (ps[i] && typeof s === 'number' && s < par) bMakers.push(ps[i]);
                        });
                        if (bMakers.length > 0) fbHoles.push({ h: h, ps: bMakers });
                    }

                    recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;">
                        <div class="flex-r" style="margin-bottom:8px;">
                            <div class="tx-sm" style="color:#F59E0B;">🔥 FIREBALL HOLES</div>
                            <div class="tx-sm" style="color:white; font-size:10px;">TOTAL: ${fbHoles.length}</div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px;">`;

                    if (fbHoles.length > 0) {
                        fbHoles.forEach(item => {
                            recapHTML += `<div style="background:#0F172A; padding:4px 8px; border-radius:6px; border:1px solid #F59E0B; display:flex; align-items:center; justify-content:space-between;">
                                <span style="color:#F59E0B; font-weight:900; font-size:11px;">HOLE ${this.ghl(item.h)}</span>
                                <span style="color:white; font-weight:700; font-size:11px; text-align:right;">${item.ps.join(', ')}</span>
                            </div>`;
                        });
                    } else {
                        recapHTML += `<div style="color:#94A3B8; font-size:10px; text-align:center;">No Fireballs.</div>`;
                    }
                    recapHTML += `</div></div>`;

                    recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;"><div class="tx-sm" style="color:white; margin-bottom:8px;">SCORING BREAKDOWN</div><div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;"><div style="flex:2; color:#94A3B8; font-size:10px; font-weight:700;">PLY</div><div style="flex:1; text-align:center; color:#10B981; font-size:10px; font-weight:900;">BIRD</div><div style="flex:1; text-align:center; color:#cbd5e1; font-size:10px; font-weight:900;">PAR</div><div style="flex:1; text-align:center; color:#F59E0B; font-size:10px; font-weight:900;">BOG</div><div style="flex:1; text-align:center; color:#EF4444; font-size:10px; font-weight:900;">DBL+</div></div>`;
                    pRecap.forEach(p => { if (p.totalStrokes === 0) return; recapHTML += `<div style="display:flex; align-items:center; padding:4px 0; border-bottom:1px solid #334155;"><div style="flex:2; color:white; font-weight:700; font-size:13px;">${p.name.substring(0, 6)}</div><div style="flex:1; text-align:center; color:#10B981; font-weight:700;">${p.dist.bird}</div><div style="flex:1; text-align:center; color:#cbd5e1; font-weight:700;">${p.dist.par}</div><div style="flex:1; text-align:center; color:#F59E0B; font-weight:700;">${p.dist.bog}</div><div style="flex:1; text-align:center; color:#EF4444; font-weight:700;">${p.dist.dbl}</div></div>`; });
                    recapHTML += `</div>`;

                    // HANDICAP SUMMARY (Share)
                    const sHoles = [];
                    for (let h = 1; h <= 18; h++) {
                        const hcpAlloc = c.hcp[h - 1];
                        const getters = [];
                        [0, 1, 2, 3].forEach(i => {
                            const pops = this.getPops(i, h - 1);
                            if (pops > 0) getters.push(`${ps[i]} (${pops})`);
                        });
                        if (getters.length > 0) sHoles.push({ h: h, hcp: hcpAlloc, list: getters });
                    }

                    recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;">
                        <div class="tx-sm" style="color:white; margin-bottom:8px;">HANDICAP SUMMARY</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">`;
                    if (sHoles.length > 0) {
                        sHoles.forEach(item => {
                            recapHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:4px 8px; border-radius:6px; border:1px solid #334155;">
                                <span style="color:#cbd5e1; font-size:12px; font-weight:700;">HOLE ${this.ghl(item.h)} <span style="color:#94A3B8; font-weight:400;">(HCP ${item.hcp})</span></span>
                                <span style="color:#F59E0B; font-size:10px; font-weight:700; text-align:right;">${item.list.join(', ')}</span>
                            </div>`;
                        });
                    } else {
                        recapHTML += `<div style="color:#94A3B8; font-size:10px; padding:4px;">No strokes given.</div>`;
                    }
                    recapHTML += `</div></div>`;

                    // JUNK for Share
                    if (this.d.gameType !== 'single') {
                        const junk = this.getJunkStats();
                        recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;">
                            <div class="tx-sm" style="color:white; margin-bottom:8px;">THE JUNK DRAWER</div>
                            <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                                <div style="flex:1.5; color:#94A3B8; font-size:10px; font-weight:700;">PLY</div>
                                <div style="flex:1; text-align:center; color:#10B981; font-size:11px;">🟢</div>
                                <div style="flex:1; text-align:center; color:#F59E0B; font-size:11px;">🏖️</div>
                                <div style="flex:1; text-align:center; color:#8B5CF6; font-size:11px;">LP</div>
                                <div style="flex:1; text-align:center; color:#EF4444; font-size:10px; font-weight:900;">VOID</div>
                            </div>`;
                        pRecap.forEach(p => { 
                            const j = junk[p.name]; 
                            if (p.totalStrokes > 0) {
                                recapHTML += `<div style="display:flex; align-items:center; padding:4px 0; border-bottom:1px solid #334155;">
                                    <div style="flex:1.5; color:white; font-weight:700; font-size:13px;">${p.name.substring(0, 6)}</div>
                                    <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.G : 0}</div>
                                    <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.S : 0}</div>
                                    <div style="flex:1; text-align:center; color:white; font-weight:700;">${j ? j.P : 0}</div>
                                    <div style="flex:1; text-align:center; color:#EF4444; font-weight:700;">${j ? (j.V || 0) : 0}</div>
                                </div>`;
                            }
                        });
                        recapHTML += `</div>`;
                    }

                    // 2. Build Capture HTML
                    const sn = document.getElementById('share-node');
                    let finHTML = '';

                    if (isScramble) {
                        [0, 1, 2, 3].forEach(i => {
                            const v = Math.round(bets[i]);
                            const formatted = v < 0 ? `($-${Math.abs(v)})` : `$${v}`;
                            finHTML += `<div class="sn-row"><span>${ps[i]}</span><span class="${v >= 0 ? 'sn-hl' : 'sn-neg'}">${v >= 0 ? '+' : ''}${formatted}</span></div>`;
                        });
                    } else {
                        [0, 1, 2, 3].forEach(i => {
                            const v = Math.round(bets[i]);
                            const formatted = v < 0 ? `($-${Math.abs(v)})` : `$${v}`;
                            finHTML += `<div class="sn-row"><span>${ps[i]}</span><span class="${v >= 0 ? 'sn-hl' : 'sn-neg'}">${v >= 0 ? '+' : ''}${formatted}</span></div>`;
                        });
                    }

                    let segHTML = '';
                    segRes.forEach(s => {
                        segHTML += `<div class="sn-row" style="font-size:13px; margin-bottom:4px;">
                            <span style="color:#94A3B8; font-weight:700; width:80px;">${s.name}</span>
                            <span style="color:${s.color || 'white'}; font-weight:700;">${s.val}</span>
                        </div>`;
                    });
                    // Add Junk Financials to Share
                    const jRes = this.calcJunkRes();
                    if (jRes) {
                        segHTML += `<div style="margin-top:12px; border-top:1px dashed #475569; padding-top:6px; font-size:11px; color:#F59E0B; font-weight:900; text-transform:uppercase;">Segment Junk Payouts</div>`;
                        jRes.results.forEach(r => {
                            let inner = '';
                            jRes.players.forEach(i => {
                                if (r.payouts[i] > 0) {
                                    inner += `<span style="margin-left:6px; color:white;">${ps[i].substring(0,3)}: $${r.payouts[i]}</span>`;
                                }
                            });
                            segHTML += `<div class="sn-row" style="margin-bottom:2px; font-size:11px;">
                                <span>${r.name} (${r.totalItems} items)</span>
                                <span>${inner || '<span style="color:#94A3B8;">-</span>'}</span>
                            </div>`;
                        });

                        segHTML += `<div style="margin-top:8px; border-top:1px solid #334155; padding-top:4px; font-size:11px; color:#94A3B8; font-weight:900; text-transform:uppercase;">Junk Round Totals</div>`;
                        jRes.players.forEach(i => {
                            const v = Math.round(jRes.net[i]);
                            segHTML += `<div class="sn-row"><span>${ps[i]}</span><span class="${v >= 0 ? 'sn-hl' : 'sn-neg'}">${v >= 0 ? '+' : ''}$${v}</span></div>`;
                        });
                    }

                    // 3. Scorecard Grid (GROSS & NET)
                    const buildCard_v2 = (start, lbl, isNet) => {
                        // Standard Theme Shared by Both
                        const theme = '#10B981';
                        const subC = '#334155';
                        const bgHead = '#0F172A';
                        const bgBody = '#1E293B';

                        let h = `<div style="margin-top:16px; font-size:11px; font-weight:900; color:${theme}; margin-bottom:4px; text-transform:uppercase;">${lbl}</div><div class="sn-grid" style="border-color:${subC};">`;

                        // HEADER
                        h += `<div class="sn-g-row head" style="background:${bgHead}; border-color:${subC};">`;
                        h += `<div class="sn-col nm" style="border-color:${subC};">PLY</div>`;
                        for (let i = start; i < start + 9; i++) h += `<div class="sn-col h" style="border-color:${subC};">${i}</div>`;
                        h += `<div class="sn-col tot" style="border-color:${subC}; color:${theme};">${start === 1 ? 'OUT' : 'IN'}</div>`;
                        if (start === 10) h += `<div class="sn-col rnd" style="border-color:${subC}; color:${theme};">TOT</div>`;
                        h += `</div>`;

                        // ROWS
                        [0, 1, 2, 3].forEach(pIdx => {
                            let pName = ps[pIdx].substring(0, 3).toUpperCase();
                            h += `<div class="sn-g-row body" style="border-color:${subC}; background:${bgBody};">`;
                            h += `<div class="sn-col nm" style="border-color:${subC};">${pName}</div>`;

                            let segTot = 0;
                            // Holes
                            for (let i = start; i < start + 9; i++) {
                                const s = (this.d.s[i] && this.d.s[i][pIdx]);
                                let disp = '-';
                                let tCol = 'white'; let bStyle = '';

                                if (typeof s === 'number') {
                                    // Net Logic
                                    const pops = isNet ? this.getPops(pIdx, i - 1, true) : 0;
                                    const val = s - pops;
                                    disp = val;
                                    segTot += val;

                                    const par = c.p[i - 1];
                                    const d = val - par;

                                    // 1. Determine Text Color (Lime if Stroked in Net, else White)
                                    if (isNet && pops > 0) tCol = '#bef264'; // LIME

                                    // 2. Determine Border (Birdie/Bogey)
                                    if (d <= -1) {
                                        const bCol = '#10B981'; // Green
                                        bStyle = `border:${d === -1 ? '1px solid' : '3px double'} ${bCol}; border-radius:50%;`;
                                        // If Net card and stroke, keep Lime text. Else use Green.
                                        if (!isNet || pops === 0) tCol = bCol;
                                    } else if (d >= 1) {
                                        const bCol = '#F87171'; // Red
                                        bStyle = `border:${d === 1 ? '1px solid' : '3px double'} ${bCol};`;
                                        if (!isNet || pops === 0) tCol = bCol;
                                    }
                                }
                                h += `<div class="sn-col sc" style="color:${tCol}; border-color:${subC};"><div class="sn-ball" style="${bStyle}">${disp}</div></div>`;
                            }

                            h += `<div class="sn-col tot" style="border-color:${subC}; color:${theme};">${segTot}</div>`;
                            if (start === 10) {
                                let grand = 0;
                                for (let x = 1; x <= 18; x++) {
                                    const rs = this.d.s[x] && this.d.s[x][pIdx];
                                    if (typeof rs === 'number') {
                                        grand += (isNet ? (rs - this.getPops(pIdx, x - 1, true)) : rs);
                                    }
                                }
                                h += `<div class="sn-col rnd" style="border-color:${subC}; color:${theme};">${grand}</div>`;
                            }
                            h += `</div>`;
                        });
                        h += `</div>`;
                        return h;
                    };

                    sn.innerHTML = `
                        <div class="sn-head">${c.n}</div>
                        <div class="sn-sub">${new Date().toLocaleDateString()} • ${this.d.tee.toUpperCase()} • COD GOLF v278.1-GOLD</div>
                        <div class="sn-sect">
                            <div class="sn-sect-tl">FINANCIALS</div>
                            ${finHTML}
                        </div>
                        <div class="sn-sect">
                            <div class="sn-sect-tl">MATCH RESULTS</div>
                            ${segHTML}
                        </div>
                        <div class="sn-sect">
                             <div class="sn-sect-tl">ROUND RECAP</div>
                             ${recapHTML}
                        </div>
                        <div class="sn-sect">
                             <div class="sn-sect-tl">GROSS SCORECARD</div>
                             ${buildCard_v2(1, 'FRONT 9', false)}
                             ${buildCard_v2(10, 'BACK 9', false)}
                        </div>
                        <div class="sn-sect">
                             <div class="sn-sect-tl">NET SCORECARD</div>
                             ${buildCard_v2(1, 'FRONT 9 (NET)', true)}
                             ${buildCard_v2(10, 'BACK 9 (NET)', true)}
                        </div>
                    `;

                    // Generate Image (PNG - High Quality)
                    await new Promise(r => setTimeout(r, 200));
                    await document.fonts.ready;
                    const canvas = await html2canvas(sn, { backgroundColor: '#0F172A', scale: 2, scrollY: 0 });

                    canvas.toBlob(async (blob) => {
                        if (!blob) throw new Error("Canvas Blob Failed");
                        this.shareBlob = blob;
                        const url = URL.createObjectURL(blob);

                        document.getElementById('sp-img').src = url;
                        document.getElementById('share-preview-modal').classList.add('active');
                        // btn.innerText = "SHARE IMAGE SUMMARY"; // Button text is static in HTML now

                    }, 'image/png');

                } catch (e) {
                    alert("Image Share Error: " + e.message);
                    btn.innerText = "SHARE ERROR";
                }
            },

            closeSharePreview: function () {
                document.getElementById('share-preview-modal').classList.remove('active');
            },

            ronnieSimple: function () {
                if (this.d.h >= 18) this.saveToHistory();
                const { bets, summary } = this.calcBets();
                const jRes = this.calcJunkRes();
                let txt = "⛳ ROUND SUMMARY\n\n" + summary;

                // Add Junk in simple terms
                if (jRes && jRes.net) {
                    let jStr = "";
                    jRes.players.forEach(i => {
                        const v = Math.round(jRes.net[i]);
                        if (v !== 0) jStr += `${this.d.ps[i]} ($${v >= 0 ? '+' : ''}${v}), `;
                    });
                    if (jStr) txt += "\n💰 JUNK: " + jStr.slice(0, -2) + "\n";
                }

                txt += "\n---\n" + this.getSettleStr(bets);
                if (navigator.share) {
                    navigator.share({ text: txt }).catch((e) => {
                        if (e.name !== 'AbortError') this.copyToClipboard(txt);
                    });
                } else {
                    this.copyToClipboard(txt);
                }
            },

            calcBets: function () {
                const bets = { 0: 0, 1: 0, 2: 0, 3: 0 }, logs = { 0: [], 1: [], 2: [], 3: [] };
                const birdCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                let summary = "", bestGross = 999, bestPlayerIdx = -1;
                const c = CS[this.d.crs];

                if (this.d.gameType === 'stroke') {
                    const totals = [];
                    this.d.ps.forEach((p, pIdx) => {
                        if (!p) return;
                        let net = 0, gross = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                            if (sc) {
                                net += (sc - this.getPops(pIdx, h - 1) - c.p[h - 1]);
                                gross += sc;
                                if (sc < c.p[h - 1]) birdCounts[pIdx]++;
                            }
                        }
                        totals.push({ idx: pIdx, name: p, score: net });
                        if (gross > 0 && gross < bestGross) { bestGross = gross; bestPlayerIdx = pIdx; }
                    });
                    totals.sort((a, b) => a.score - b.score);
                    const winner = totals[0], pot = this.d.pot || 0, active = this.d.ps.filter(x => x).length;
                    const buyIn = active > 0 ? Math.round(pot / active) : 0;
                    if (winner) {
                        summary += `TROPHY: ${winner.name} (${winner.score === 0 ? 'E' : (winner.score > 0 ? '+' : '') + winner.score} NET)\n`;
                        if (pot > 0) {
                            this.d.ps.forEach((p, i) => {
                                if (!p) return;
                                if (i !== winner.idx) { bets[i] -= buyIn; logs[i].push(`Stroke Buy-in: ($-${buyIn})`); }
                                else { let w = buyIn * (active - 1); bets[i] += w; logs[i].push(`Stroke Win: +$${w}`); }
                            });
                        }
                    }
                } else if (this.d.gameType === 'single') {
                    this.d.ps.forEach((p, pIdx) => {
                        if (!p) return;
                        let gross = 0, net = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pIdx]);
                            if (sc) {
                                gross += sc; net += (sc - this.getPops(pIdx, h - 1, true));
                                if (sc < c.p[h - 1]) birdCounts[pIdx]++;
                            }
                        }
                        if (gross > 0 && gross < bestGross) { bestGross = gross; bestPlayerIdx = pIdx; }
                        const par = c.p.slice(0, 18).reduce((a, b) => a + b, 0), rel = net - par;
                        summary += `${p}: ${gross} (${rel === 0 ? 'E' : (rel > 0 ? '+' : '') + rel} NET)\n`;
                    });
                } else if (this.d.gameType === 'rabbit') {
                    const h9 = this.d.rabbitHistory[9];
                    const h18 = this.d.rabbitHistory[18];
                    const p9 = (h9 !== null && h9 !== undefined && this.d.ps[h9]) ? this.d.ps[h9] : "NOBODY";
                    const p18 = (h18 !== null && h18 !== undefined && this.d.ps[h18]) ? this.d.ps[h18] : "NOBODY";
                    summary += `FRONT 9: ${p9}\nBACK 18: ${p18}\n`;
                    
                    const pot = this.d.pot || 0;
                    const hP = pot * 0.25;
                    const fP = pot * 0.75;
                    const activeSeats = this.d.ps.map((p, i) => p ? i : -1).filter(i => i !== -1);
                    const n = activeSeats.length;
                    if (n > 0) {
                        if (h9 !== null && h9 !== undefined && this.d.ps[h9]) {
                            activeSeats.forEach(i => {
                                if (i === h9) { bets[i] += (hP * (n - 1)); logs[i].push('Front 9 Rabbit Win'); }
                                else { bets[i] -= hP; logs[i].push('Front 9 Rabbit Loss'); }
                            });
                        }
                        if (h18 !== null && h18 !== undefined && this.d.ps[h18]) {
                            activeSeats.forEach(i => {
                                if (i === h18) { bets[i] += (fP * (n - 1)); logs[i].push('Back 18 Rabbit Win'); }
                                else { bets[i] -= fP; logs[i].push('Back 18 Rabbit Loss'); }
                            });
                        }
                    }
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble') {
                    [0, 1, 2].forEach(idx => {
                        const results = this.calcSegResults(idx);
                        results.forEach((r, rIdx) => {
                            let mName = (rIdx === 0) ? (["1-6", "7-12", "13-18"][idx]) : `PRESS (H${this.getAbsHole(r.startRh)})`;
                            if (r.winner === 1) {
                                r.seg.t1.forEach(p => { bets[p] += r.amt; logs[p].push(`${mName}: +$${r.amt}`); });
                                r.seg.t2.forEach(p => { bets[p] -= r.amt; logs[p].push(`${mName}: ($-${r.amt})`); });
                            } else if (r.winner === 2) {
                                r.seg.t2.forEach(p => { bets[p] += r.amt; logs[p].push(`${mName}: +$${r.amt}`); });
                                r.seg.t1.forEach(p => { bets[p] -= r.amt; logs[p].push(`${mName}: ($-${r.amt})`); });
                            }
                            let w = (r.winner === 1) ? `${this.d.ps[r.seg.t1[0]]}/${this.d.ps[r.seg.t1[1]]} (+$${r.amt})` : (r.winner === 2 ? `${this.d.ps[r.seg.t2[0]]}/${this.d.ps[r.seg.t2[1]]} (+$${r.amt})` : 'PUSH');
                            summary += `${mName}: ${w}\n`;
                        });
                    });
                    // Birdie stats for COD
                    [0, 1, 2, 3].forEach(i => {
                        if (!this.d.ps[i]) return;
                        let gross = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = this.d.s[h] && this.d.s[h][i];
                            if (sc) { gross += sc; if (sc < c.p[h - 1]) birdCounts[i]++; }
                        }
                        if (gross > 0 && gross < bestGross) { bestGross = gross; bestPlayerIdx = i; }
                    });
                }

                const jRes = this.calcJunkRes();
                if (jRes && jRes.net) {
                    [0, 1, 2, 3].forEach(i => {
                        if (this.d.ps[i] && jRes.net[i]) { bets[i] += jRes.net[i]; logs[i].push(`Junk: $${Math.round(jRes.net[i])}`); }
                    });
                }

                if (this.d.gameType === 'rabbit') {
                    summary += '---\nTOTAL NET (Incl. Junk):\n';
                    [0, 1, 2, 3].forEach(i => {
                        if (this.d.ps[i]) {
                            const val = Math.round(bets[i]);
                            summary += `${this.d.ps[i]}: ${val >= 0 ? '+' : ''}$${val}\n`;
                        }
                    });
                }

                let statsStr = "";
                if (bestPlayerIdx !== -1) statsStr += `Low Round: ${this.d.ps[bestPlayerIdx]} (${bestGross})\n`;
                const fireballers = [0, 1, 2, 3].filter(i => birdCounts[i] >= 2).map(i => `${this.d.ps[i]} (${birdCounts[i]})`);
                if (fireballers.length > 0) statsStr += `🔥 Birds: ${fireballers.join(', ')}\n`;

                return { bets, logs, summary, statsStr };
            },

            getSettleStr: function (bets) {
                let txt = "", debtors = [], creditors = [];
                [0, 1, 2, 3].forEach(i => {
                    let b = Math.round(bets[i]);
                    if (b < 0) debtors.push({ id: i, val: Math.abs(b) }); else if (b > 0) creditors.push({ id: i, val: b });
                });
                if (debtors.length === 0) return "ALL SQUARE";
                debtors.forEach(d => {
                    while (d.val > 0 && creditors.length > 0) {
                        let c = creditors[0], amt = Math.min(d.val, c.val);
                        txt += `${this.d.ps[d.id]} pays ${this.d.ps[c.id]} $${amt}\n`;
                        d.val -= amt; c.val -= amt; if (c.val === 0) creditors.shift();
                    }
                });
                return txt;
            },

            copyToClipboard: function (txt) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txt).then(() => {
                        alert("Copied to clipboard!");
                    }).catch(() => {
                        this.fallbackCopy(txt);
                    });
                } else {
                    this.fallbackCopy(txt);
                }
            },

            fallbackCopy: function(txt) {
                try {
                    const el = document.createElement('textarea');
                    el.value = txt;
                    el.setAttribute('readonly', '');
                    el.style.position = 'absolute';
                    el.style.left = '-9999px';
                    document.body.appendChild(el);
                    el.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(el);
                    if (success) alert("Copied to clipboard!");
                    else alert("Clipboard failed. Please manual copy.");
                } catch (e) {
                    alert("Clipboard error: " + e.message);
                }
            },

            doShareParams: async function (type) {
                const { bets, summary, statsStr } = this.calcBets();
                const jRes = this.calcJunkRes();

                // Build a clean, non-redundant text summary
                let sett = "⛳ COD GOLF SUMMARY\n\n" + summary;
                if (statsStr) sett += "\n" + statsStr;

                // Add Junk in simple terms
                if (jRes && jRes.net) {
                    let jStr = "";
                    jRes.players.forEach(i => {
                        const v = Math.round(jRes.net[i]);
                        if (v !== 0) jStr += `${this.d.ps[i]} ($${v >= 0 ? '+' : ''}${v}), `;
                    });
                    if (jStr) sett += "\n💰 JUNK: " + jStr.slice(0, -2) + "\n";
                }

                sett += "\n---\nPAYOUTS:\n" + this.getSettleStr(bets);

                if (type === 'both' || type === 'image') {
                    if (!this.shareBlob) { alert("Preview still loading..."); return; }
                    const file = new File([this.shareBlob], 'scorecard.png', { type: 'image/png' });
                    if (navigator.share) {
                        try {
                            await navigator.share({ files: [file], title: 'COD Golf', text: sett });
                        } catch (e) {
                            if (e.name !== 'AbortError') {
                                this.copyToClipboard(sett);
                                alert("Share failed. Text summary copied to clipboard.");
                            }
                        }
                    } else {
                        this.copyToClipboard(sett);
                        alert("Text summary copied to OS clipboard.");
                    }
                } else { // type === 'text'
                    if (navigator.share) {
                        navigator.share({ title: 'COD Golf', text: sett }).catch((e) => {
                            if (e.name !== 'AbortError') this.copyToClipboard(sett);
                        });
                    } else {
                        this.copyToClipboard(sett);
                    }
                }
            },


            saveToHistory: function () {
                // Rule: Strictly NO test rounds (after 3 test syncs)
                if (this.d.isTestMode && this.d.testSyncsDone >= 3) {
                    console.log("History Guard: Test round ignored.");
                    return;
                }
                if (!this.d.s || Object.keys(this.d.s).length === 0) return;
                const { bets } = this.calcBets();
                const c = CS[this.d.crs] || CS['cc'];
                const rec = { id: Date.now(), date: new Date().toLocaleDateString(), course: c.n, ps: this.d.ps, net: [0, 1, 2, 3].map(i => Math.round(bets[i])) };
                this.d.gameId = rec.id;
                this.historyArchive.push(rec);
                this.saveHistoryData();
                this.save();
                this.uCard();
                this.renderHistory();
            },

            ghSync: async function() {
                const btn = document.getElementById('gh-sync-btn');
                if (!this.d.ghToken) { alert("Please set GitHub Token in Setup first!"); return; }
                
                // Final Check for Test Rounds
                if (this.d.isTestMode) {
                    if (this.d.testSyncsDone >= 3) {
                        alert("TEST MODE: No more test syncs allowed. Please start a REAL game.");
                        return;
                    }
                    if (!confirm(`TEST ROUND: You have ${3 - this.d.testSyncsDone} test syncs remaining. Proceed?`)) return;
                }

                try {
                    btn.disabled = true; btn.innerText = "☁️ CONNECTING...";
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const fileName = `${month}_${monthNames[now.getMonth()]}.json`;
                    const path = `history/${year}/${fileName}`;
                    
                    const owner = "dvaugha", repo = "COD_APP";
                    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
                    const headers = { "Authorization": `token ${this.d.ghToken}`, "Accept": "application/vnd.github.v3+json" };

                    // 1. Get latest round data
                    const { bets } = this.calcBets();
                    const c = CS[this.d.crs] || CS['cc'];
                    const newRound = { 
                        id: Date.now(), 
                        date: now.toLocaleDateString(), 
                        course: c.n, 
                        ps: this.d.ps, 
                        net: [0, 1, 2, 3].map(i => Math.round(bets[i])),
                        isTest: !!this.d.isTestMode 
                    };

                    // 2. Fetch existing file
                    let existingContent = [];
                    let sha = null;
                    const res = await fetch(url, { headers });
                    if (res.status === 200) {
                        const data = await res.json();
                        sha = data.sha;
                        existingContent = JSON.parse(atob(data.content));
                    }

                    // 3. Append and Push
                    existingContent.push(newRound);
                    const body = {
                        message: `Archive round: ${newRound.course} (${newRound.date}) ${newRound.isTest ? '[TEST]' : ''}`,
                        content: btoa(JSON.stringify(existingContent, null, 2)),
                        sha: sha
                    };

                    const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
                    if (putRes.ok) {
                        if (this.d.isTestMode) this.d.testSyncsDone++;
                        btn.innerText = "✅ CLOUD SYNCED";
                        btn.style.background = "#059669";
                        this.save();
                        alert("Round successfully secured to GitHub Cloud!");
                    } else {
                        throw new Error("GitHub rejected the update. Check token permissions.");
                    }
                } catch (e) {
                    alert("Sync Error: " + e.message);
                    btn.disabled = false; btn.innerText = "🚀 RETRY CLOUD SYNC";
                }
            },

            renderHistory: function () {
                const div = document.getElementById('hist-list');
                const careerDiv = document.getElementById('career-earnings');
                if (!div || !careerDiv) return;

                const stats = {};
                const labels = {}; // Store display name

                this.historyArchive.forEach(r => {
                    r.ps.forEach((p, i) => {
                        const k = p.trim().toUpperCase();
                        if (!stats[k]) {
                            stats[k] = 0;
                            labels[k] = p.trim();
                        }
                        stats[k] += r.net[i];

                        // If we have a stored label that is ALL CAPS, but this new one isn't, prefer the new one (e.g. switch DAN -> Dan)
                        // This helps fix the "ugly" all caps history if a user corrected it later.
                        const curLbl = labels[k];
                        const newLbl = p.trim();
                        if (curLbl === k && newLbl !== k) {
                            labels[k] = newLbl;
                        }
                    });
                });

                let cHTML = '';
                // Sort by earnings matching the case-insensitive aggregation
                Object.keys(stats).sort((a, b) => stats[b] - stats[a]).forEach(k => {
                    const v = stats[k];
                    const pName = labels[k];
                    cHTML += `<span style="display:inline-block; margin-right:12px; color:${v >= 0 ? '#10B981' : '#F87171'}"><strong>${pName}:</strong> ${v >= 0 ? '+' : ''}${v}</span>`;
                });
                if (cHTML === '') cHTML = 'No data yet.';

                careerDiv.innerHTML = 'Updating...';
                setTimeout(() => { careerDiv.innerHTML = cHTML; }, 10);

                let hH = '';
                const hist = this.historyArchive.slice().reverse();

                const listClass = this.histEdit ? 'hist-edit-mode' : '';
                div.className = listClass;

                hist.forEach(r => {
                    let netS = r.ps.map((p, i) => `${p}:${r.net[i] >= 0 ? '+' : ''}${r.net[i]}`).join(', ');
                    hH += `<div class="hist-item">
                        <input type="checkbox" class="hist-chk" onchange="App.onChk(${r.id}, this)">
                        <div style="flex:1">
                            <div style="font-weight:bold; color:white;">${r.date} - ${r.course}</div>
                            <div style="font-size:11px;">${netS}</div>
                        </div>
                    </div>`;
                });

                if (hH === '') hH = '<div style="padding:10px; color:#64748b; font-style:italic;">No history yet.</div>';
                div.innerHTML = hH;
            },

            onChk: function (id, el) {
                if (el.checked) {
                    if (!this.selIds.includes(id)) this.selIds.push(id);
                } else {
                    this.selIds = this.selIds.filter(x => x !== id);
                }
                const btn = document.getElementById('hist-edit-btn');
                btn.innerText = `DELETE (${this.selIds.length})`;
            },

            handleManageClick: function () {
                if (!this.histEdit) {
                    this.histEdit = true;
                    this.selIds = [];
                    const btn = document.getElementById('hist-edit-btn');
                    btn.innerText = "DELETE (0)";
                    btn.style.backgroundColor = "#EF4444";
                    this.renderHistory();
                } else {
                    this.doDelete();
                }
            },

            doDelete: function () {
                if (this.selIds.length === 0) {
                    this.exitEditMode();
                    return;
                }
                alert(`Deleting ${this.selIds.length} items...`);
                this.historyArchive = this.historyArchive.filter(h => !this.selIds.includes(h.id));
                this.save();
                this.exitEditMode();
            },

            exitEditMode: function () {
                this.histEdit = false;
                this.selIds = [];
                const btn = document.getElementById('hist-edit-btn');
                btn.innerText = "MANAGE";
                btn.style.backgroundColor = "#334155";

                this.renderHistory();
            },

            // ============================================================
            // MID-ROUND STANDINGS  (v275.18)
            // Button activates every time holesPlayed % 3 === 0
            // ============================================================
            checkStandingsBtn: function () {
                const btn = document.getElementById('standings-btn');
                if (!btn) return;

                // Count holes that have a complete score entry
                const activeCount = this.d.ps.filter(x => x).length;
                if (activeCount === 0) { btn.classList.remove('active'); return; }

                let holesPlayed = 0;
                for (let h = 1; h <= 18; h++) {
                    const s = this.d.s[h];
                    if (s && Object.keys(s).length === activeCount && Object.values(s).every(v => v > 0)) {
                        holesPlayed++;
                    }
                }

                if (holesPlayed >= 3 && holesPlayed % 3 === 0) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            },

            showStandings: function () {
                const modal = document.getElementById('standings-modal');
                const inner = document.getElementById('standings-modal-inner');
                const subtitle = document.getElementById('std-subtitle');
                if (!modal || !inner) return;

                // --- Count holes played ---
                const activeCount = this.d.ps.filter(x => x).length;
                let holesPlayed = 0;
                for (let h = 1; h <= 18; h++) {
                    const s = this.d.s[h];
                    if (s && Object.keys(s).length === activeCount && Object.values(s).every(v => v > 0)) {
                        holesPlayed++;
                    }
                }

                // Determine subtitle (last completed absolute hole)
                const lastAbsHole = this.d.h > 1 ? this.d.h - 1 : (holesPlayed > 0 ? this.getAbsHole(holesPlayed) : '-');
                if (subtitle) subtitle.innerText = `Through Hole ${lastAbsHole}  (${holesPlayed} Played)`;

                let html = '';
                const gt = this.d.gameType;
                const c = CS[this.d.crs] || CS['cc'];
                const segs = [
                    { label: 'CARTS (1-6)',      t1: [0,1], t2: [2,3] },
                    { label: 'OPPOSITES (7-12)', t1: [0,3], t2: [1,2] },
                    { label: 'DRIVERS (13-18)',  t1: [0,2], t2: [1,3] }
                ];

                // ===== SECTION 1: COD MATCH =====
                if (gt === 'cod' || gt === 'scramble') {
                    const rh = this.getRelHole(this.d.h > 1 ? this.d.h : 1);
                    const curSeg = Math.min(Math.floor((rh - 1) / 6), 2);

                    html += `<div class="std-section">`;
                    html += `<div class="std-section-title" style="color:#10B981;">🏌️ COD Match — Segment Status</div>`;

                    for (let si = 0; si <= curSeg; si++) {
                        const seg = segs[si];
                        const res = this.calcMatch(si, si*6+1, si*6+6, 0, null);
                        const n1 = `${this.d.ps[seg.t1[0]] || '?'}/${this.d.ps[seg.t1[1]] || '?'}`;
                        const n2 = `${this.d.ps[seg.t2[0]] || '?'}/${this.d.ps[seg.t2[1]] || '?'}`;
                        const d = res.w1 - res.w2;
                        let statusTxt, statusCol;
                        if (d > 0)       { statusTxt = `${n1} leads ${d} UP`; statusCol = '#10B981'; }
                        else if (d < 0)  { statusTxt = `${n2} leads ${Math.abs(d)} UP`; statusCol = '#F59E0B'; }
                        else             { statusTxt = 'All Square'; statusCol = '#94A3B8'; }

                        html += `<div class="std-row">`;
                        html += `<span style="color:#94A3B8; font-size:12px;">${seg.label}</span>`;
                        html += `<span style="color:${statusCol}; font-weight:900;">${statusTxt}</span>`;
                        html += `</div>`;
                    }
                    html += `</div>`;
                }

                // ===== SECTION 2: NASSAU MATCH (only when game mode is nassau) =====
                if (gt === 'nassau') {
                    const nr = this.calcNassau();
                    const tn1 = `${this.d.ps[nr.t1[0]] || '?'}/${this.d.ps[nr.t1[1]] || '?'}`;
                    const tn2 = `${this.d.ps[nr.t2[0]] || '?'}/${this.d.ps[nr.t2[1]] || '?'}`;
                    const nassauStdRow = (label, seg) => {
                        const d = seg.w1 - seg.w2;
                        let txt, col;
                        if (d > 0)      { txt = `${tn1} leads ${d} UP`; col = '#10B981'; }
                        else if (d < 0) { txt = `${tn2} leads ${Math.abs(d)} UP`; col = '#F59E0B'; }
                        else            { txt = 'All Square'; col = '#94A3B8'; }
                        return `<div class="std-row"><span style="color:#94A3B8;font-size:12px;">${label}</span><span style="color:${col};font-weight:900;">${txt}</span></div>`;
                    };
                    html += `<div class="std-section" style="border-color:#60A5FA;">`;
                    html += `<div class="std-section-title" style="color:#60A5FA;">🏆 Nassau Match</div>`;
                    html += nassauStdRow('Front 9', nr.front);
                    html += nassauStdRow('Back 9', nr.back);
                    html += nassauStdRow('Total', nr.overall);
                    html += `</div>`;
                }

                // ===== SECTION 3: JUNK EARNINGS =====
                const jStats = this.getJunkStats();
                const jRes = this.calcJunkRes();
                const junkActive = jRes && jRes.players && jRes.players.length > 0;

                if (junkActive) {
                    // Compute running dollar totals through holes played
                    const bet = 1;
                    const players = jRes.players;
                    const buyInPerSeg = bet * players.length;

                    // Running accumulation per segment
                    const running = { 0:0, 1:0, 2:0, 3:0 };
                    let carryover = 0;
                    const allSegs = [
                        { h: [1,6] }, { h: [7,12] }, { h: [13,18] }
                    ];
                    allSegs.forEach((sig, segIdx) => {
                        const playerItems = { 0:0, 1:0, 2:0, 3:0 };
                        let totalItems = 0;
                        for (let rh = 1; rh <= 6; rh++) {
                            const h = (segIdx * 6) + rh;
                            const par = c.p[h - 1];
                            // Only count if hole is fully scored
                            const s = this.d.s[h];
                            if (!s || Object.keys(s).length < activeCount) continue;
                            if (this.d.junk && this.d.junk[h]) {
                                players.forEach(pIdx => {
                                    ['G','S','P'].forEach(t => {
                                        if (this.d.junk[h][pIdx+'_'+t]) {
                                            const sc = s && s[pIdx];
                                            if (sc && (t==='G'||t==='S') && sc > par) return;
                                            playerItems[pIdx]++; totalItems++;
                                        }
                                    });
                                });
                            }
                        }
                        const segPot = buyInPerSeg + carryover;
                        // Only payout if segment is complete (all 6 holes played)
                        const segComplete = (() => {
                            for (let rh = 1; rh <= 6; rh++) {
                                const h = (segIdx * 6) + rh;
                                const s = this.d.s[h];
                                if (!s || Object.keys(s).length < activeCount) return false;
                            }
                            return true;
                        })();

                        if (segComplete) {
                            if (totalItems === 0) {
                                if (segIdx === 2) players.forEach(i => running[i] += -bet);
                                else { carryover = segPot; players.forEach(i => running[i] -= bet); }
                            } else {
                                players.forEach(i => {
                                    const p = Math.round((playerItems[i] / totalItems) * segPot);
                                    running[i] += (p - bet);
                                });
                                carryover = 0;
                            }
                        } else {
                            // Mid-segment: show items earned only (not finalized payout)
                            players.forEach(i => running[i] += playerItems[i]); // store items as proxy
                            // Use actual calcJunkRes net instead for simplicity
                        }
                    });

                    // Use the system's authoritative calcJunkRes net values
                    const junkNet = jRes.net;

                    html += `<div class="std-section">`;
                    html += `<div class="std-section-title" style="color:#F59E0B;">💰 Junk Earnings (Running)</div>`;

                    // Show each player sorted by earnings desc
                    const jRows = players.map(pIdx => ({
                        name: this.d.ps[pIdx],
                        net: junkNet ? (junkNet[pIdx] || 0) : 0,
                        g: jStats[this.d.ps[pIdx]] ? jStats[this.d.ps[pIdx]].G : 0,
                        s: jStats[this.d.ps[pIdx]] ? jStats[this.d.ps[pIdx]].S : 0,
                        p: jStats[this.d.ps[pIdx]] ? jStats[this.d.ps[pIdx]].P : 0
                    })).sort((a,b) => b.net - a.net);

                    jRows.forEach(row => {
                        const valStr = (row.net >= 0 ? '+$' : '-$') + Math.abs(row.net);
                        const valCol = row.net > 0 ? '#10B981' : row.net < 0 ? '#F87171' : '#94A3B8';
                        const itemStr = `<span style="font-size:10px;color:#64748B;margin-left:6px;">🟢${row.g} 🏖️${row.s} LP${row.p}</span>`;
                        html += `<div class="std-row">`;
                        html += `<span style="color:white;">${row.name}${itemStr}</span>`;
                        html += `<span style="color:${valCol}; font-size:16px; font-weight:900;">${valStr}</span>`;
                        html += `</div>`;
                    });
                    html += `</div>`;
                }

                // ===== SECTION 4: RABBIT (if active) =====
                if (gt === 'rabbit') {
                    this.calcRabbit();
                    const lastH = this.d.h > 1 ? this.d.h - 1 : null;
                    const holder = (lastH && this.d.rabbitHistory) ? this.d.rabbitHistory[lastH] : null;

                    // Count consecutive holes held
                    let holesHeld = 0;
                    if (holder !== null && holder !== undefined) {
                        for (let h = (lastH || 0); h >= 1; h--) {
                            if (this.d.rabbitHistory[h] === holder) holesHeld++;
                            else break;
                        }
                    }

                    const pot = this.d.pot || 0;
                    const n = this.d.ps.filter(x=>x).length;
                    const potPerHole = n > 0 ? (pot * n / 18) : 0; // rough per-hole value

                    html += `<div class="std-section" style="border-color:#F97316;">`;
                    html += `<div class="std-section-title" style="color:#F97316;">🐇 Rabbit Hunter</div>`;
                    if (holder !== null && holder !== undefined && this.d.ps[holder]) {
                        html += `<div class="std-row"><span style="color:#94A3B8;">Current Holder</span><span style="color:#F97316;font-size:16px;font-weight:900;">${this.d.ps[holder]}</span></div>`;
                        html += `<div class="std-row"><span style="color:#94A3B8;">Holes Held</span><span style="color:white;">${holesHeld}</span></div>`;
                        const frontPot = pot * 0.40;
                        const backPot  = pot * 0.60;
                        const rhLastH = lastH ? this.getRelHole(lastH) : 0;
                        const curHalf  = rhLastH <= 9 ? `Front Pot: $${frontPot.toFixed(0)} per player` : `Back Pot: $${backPot.toFixed(0)} per player`;
                        html += `<div class="std-row"><span style="color:#94A3B8;">Pot At Stake</span><span style="color:#F59E0B;font-weight:900;">${curHalf}</span></div>`;
                    } else {
                        html += `<div class="std-row" style="justify-content:center;"><span style="color:#94A3B8;font-style:italic;">🐇 RABBIT IS FREE — up for grabs!</span></div>`;
                    }
                    html += `</div>`;
                }

                inner.innerHTML = html || `<div style="padding:30px;text-align:center;color:#64748B;">No scores entered yet.</div>`;

                modal.classList.add('active');
            },

            // ============================================================
            // NASSAU GAME ENGINE  (v275.19)
            // Fixed teams: Cart A (0,1) vs Cart B (2,3)
            // 3 bets: Front 9, Back 9, Overall (holes won match play)
            // ============================================================
            calcNassau: function () {
                const t1 = [0, 1];  // Cart A
                const t2 = [2, 3];  // Cart B
                const c = CS[this.d.crs] || CS['cc'];
                const activeCount = this.d.ps.filter(x => x).length;
                let fW1 = 0, fW2 = 0, bW1 = 0, bW2 = 0;

                for (let h = 1; h <= 18; h++) {
                    const s = this.d.s[h];
                    if (!s || Object.keys(s).length < activeCount) continue;
                    const best1 = Math.min(
                        (s[t1[0]] || 99) - this.getPops(t1[0], h - 1),
                        (s[t1[1]] || 99) - this.getPops(t1[1], h - 1)
                    );
                    const best2 = Math.min(
                        (s[t2[0]] || 99) - this.getPops(t2[0], h - 1),
                        (s[t2[1]] || 99) - this.getPops(t2[1], h - 1)
                    );
                    const rh = this.getRelHole(h);
                    if (rh <= 9) {
                        if (best1 < best2) fW1++; else if (best2 < best1) fW2++;
                    } else {
                        if (best1 < best2) bW1++; else if (best2 < best1) bW2++;
                    }
                }

                const oW1 = fW1 + bW1, oW2 = fW2 + bW2;
                return {
                    t1, t2,
                    front:   { w1: fW1, w2: fW2, winner: fW1 > fW2 ? 1 : (fW2 > fW1 ? 2 : 0) },
                    back:    { w1: bW1, w2: bW2, winner: bW1 > bW2 ? 1 : (bW2 > bW1 ? 2 : 0) },
                    overall: { w1: oW1, w2: oW2, winner: oW1 > oW2 ? 1 : (oW2 > oW1 ? 2 : 0) }
                };
            },

            closeStandings: function () {
                const modal = document.getElementById('standings-modal');
                if (modal) modal.classList.remove('active');
            }
        };
        window.addEventListener('load', () => App.init());
        window.App = App;