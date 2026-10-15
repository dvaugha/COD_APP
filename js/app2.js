Object.assign(App, {

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

                if (this.d.gameType === 'highlow' && Math.abs(diff) >= 3) {
                    warningHtml = `
                        <div style="color:#EF4444; font-weight:900; font-size:18px; margin-bottom:12px;">⚠️ $3 PRESS</div>
                        <div style="color:white; margin-bottom:12px;">${nameStr} are trailing by ${Math.abs(diff)}.</div>
                        <div style="color:#FCA5A5; font-weight:700; border:1px solid #EF4444; padding:8px; border-radius:4px;">
                            NOTICE: Down 3 or more, this press is a $3 bet (not $5) — win it and you still can't break even on the segment.
                        </div>
                    `;
                    voiceMsg = `Attention! ${nameStr} are trailing by ${Math.abs(diff)}. This press is a 3 dollar bet, not 5. Accept the challenge?`;
                } else if (Math.abs(diff) >= 3) {
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

            initiateNassauPress: function (team) {
                const rh = this.getRelHole(this.d.h);
                const isFront = (rh <= 9);
                const curNine = isFront ? 'front' : 'back';
                const nineLabel = isFront ? 'Front 9' : 'Back 9';

                if (!this.d.nassauPresses) this.d.nassauPresses = [];
                if (this.d.nassauPresses.some(p => p.nine === curNine && p.team === team)) {
                    alert(`A ${nineLabel} press is already active for this team!`);
                    return;
                }

                const nr = this.calcNassau();
                const activeSeg = isFront ? nr.front : nr.back;
                const diff = (team === 1) ? (activeSeg.w1 - activeSeg.w2) : (activeSeg.w2 - activeSeg.w1);
                if (diff >= 0) {
                    alert("Team must be trailing in this nine to press!");
                    return;
                }

                const t1 = [0, 1];
                const t2 = [2, 3];
                const tNames = (team === 1 ? t1 : t2).map(idx => this.d.ps[idx]);
                const nameStr = tNames.join(" & ");
                const startAbs = this.getAbsHole(rh);
                const endAbs = isFront ? this.getAbsHole(9) : this.getAbsHole(18);

                const startThePress = () => {
                    this.d.nassauPresses.push({
                        nine: curNine,
                        team: team,
                        startH: rh,
                        bet: 5
                    });
                    this.save();
                    this.uDash();
                    this.closePress();
                };

                const modal = document.getElementById('press-modal');
                const msg = document.getElementById('pm-msg');
                const btn = document.getElementById('pm-btn');

                let warningHtml = `
                    <div style="color:white; font-weight:700; font-size:16px; margin-bottom:8px;">Initiate $5 ${nineLabel} Press?</div>
                    <div style="color:#94A3B8; font-size:13px; margin-bottom:12px;">${nameStr} trailing by ${Math.abs(diff)} in the ${nineLabel}.</div>
                    <div style="color:#10B981; font-weight:700; background:rgba(16,185,129,0.1); border:1px solid #10B981; padding:8px; border-radius:6px; font-size:12px;">
                        Scores Holes ${startAbs} through ${endAbs} for a new $5 bet.
                    </div>
                `;
                let voiceMsg = `Press initiated on hole ${startAbs} for the ${nineLabel}.`;

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
                if (completedHoles === 0) { con.innerHTML = '<div style="padding:20px; text-align:center; color:#FFFFFF;">No scores yet.</div>'; return; }

                let html = '';
                // 0. FULL SCORECARD (Requested v275.5)
                html += this.getScorecardHTML();
                html += this.getGrossTotalsHTML();

                // 1. GROSS BREAKDOWN
                html += `<div class="box" style="margin-top:20px;">
                    <div class="tx-sm" style="color:white; margin-bottom:12px;">SCORING BREAKDOWN (GROSS)</div>
                    <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                        <div style="flex:2; color:#FFFFFF; font-size:10px; font-weight:700;">PLAYER</div>
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
                        <div style="flex:2; color:#FFFFFF; font-size:10px; font-weight:700;">PLAYER</div>
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
                    const hcpAlloc = this.getDisplayHcp(h - 1);
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
                            <span style="color:#cbd5e1; font-size:12px; font-weight:700;">HOLE ${item.h} <span style="color:#FFFFFF; font-weight:400;">(HCP ${item.hcp})</span></span>
                            <span style="color:#F59E0B; font-size:11px; font-weight:700; text-align:right;">${item.list.join(', ')}</span>
                          </div>`;
                    });
                } else {
                    html += `<div style="color:#FFFFFF; font-size:12px; padding:6px;">No strokes given.</div>`;
                }
                html += `</div></div>`;

                // JUNK DRAWER
                const junk = this.getJunkStats();
                html += `<div class="box" style="margin-top:12px;">
                    <div class="tx-sm" style="color:white; margin-bottom:12px;">THE JUNK DRAWER</div>
                    <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                        <div style="flex:2; color:#FFFFFF; font-size:10px; font-weight:700;">PLAYER</div>
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
                    html += `<div style="color:#FFFFFF; font-size:12px; text-align:center; padding:8px;">No Fireballs Yet.</div>`;
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
                const c = CS[this.d.crs];
                const hIdx = this.d.h - 1;
                const par = (c && c.p) ? c.p[hIdx] : 4;

                const rh = this.getRelHole(this.d.h);
                let lbl = (this.d.nines && this.d.h > 9) ? `#${this.d.h - 9} / ${this.d.h}` : this.d.h;
                let hNumStr = "HOLE " + lbl;
                
                // Segment Hole Tracker (S1-H1 style)
                if (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') {
                    const rhp = ((rh - 1) % 6) + 1;
                    const sIdx = Math.floor((rh - 1) / 6) + 1;
                    hNumStr += ` (S${sIdx}-H${rhp})`;
                }
                
                const safeGet = (elId, val) => { const el = document.getElementById(elId); if (el) el.innerText = val; };
                safeGet('d-h-num', hNumStr);
                safeGet('d-par', par);
                
                const dists = (c && c.y) ? (c.y[this.d.tee] || []) : [];
                safeGet('d-dist', dists[hIdx] || '-');
                safeGet('d-hcp', this.getDisplayHcp(hIdx));
                
                let tT = (this.d.tee || 'white').toUpperCase() + " TEE";
                if (this.d.tee === 'combo' && c) { 
                    let useGold = false;
                    const hasCmb = (c.cmb && c.cmb.length === 18);
                    const hasHcp = (c.hcp && c.hcp.length === 18);

                    if (this.d.crs === 'cc' && hasCmb) useGold = (c.cmb[hIdx] === 1);
                    else if (hasHcp) useGold = (c.hcp[hIdx] <= 9);
                    else if (hasCmb) useGold = (c.cmb[hIdx] === 1);

                    if (this.d.crs === 're') {
                        tT = useGold ? "GREEN TEE" : "WHITE TEE"; 
                    } else {
                        tT = useGold ? "GOLD TEE" : "WHITE TEE"; 
                    }
                }
                const teeInd = document.getElementById('d-tee-ind');
                if (teeInd) {
                    teeInd.innerText = tT;
                    teeInd.style.color = (tT.includes('GOLD') ? '#FFD700' : tT.includes('GREEN') ? '#4ade80' : '#FFFFFF');
                }

                // Helper for safe name substrings
                const sn = (idx) => (this.d.ps[idx] || "").substring(0, 3).toUpperCase() || `P${idx+1}`;

                // RELATIVE HOLE LOGIC
                let m = Math.floor((rh - 1) / 6);
                if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') m = 0;
                const results = this.calcSegResults(m);
                const main = results[0];
                const t1 = (main && main.seg) ? main.seg.t1 : [0, 1];
                const t2 = (main && main.seg) ? main.seg.t2 : [2, 3];

                let fmt = "COD (1-18)";
                if (this.d.gameType === 'single') fmt = "SCORECARD ONLY";
                else if (this.d.gameType === 'nassau') fmt = "NASSAU MATCH";
                else if (this.d.gameType === 'cc_match') fmt = "CAPTAIN'S CHOICE";
                else if (this.d.gameType === 'highlow') fmt = "HIGH-LOW · " + (m === 0 ? "CARTS (1-6)" : (m === 1 ? "OPPOSITES (7-12)" : "DRIVERS (13-18)"));
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
                        if (d > 0) s = `${sn(rt1[0])}/${sn(rt1[1])} <em style="color:#60A5FA">${d} UP</em>`;
                        else if (d < 0) s = `${sn(rt2[0])}/${sn(rt2[1])} <em style="color:#22D3EE">${Math.abs(d)} UP</em>`;
                    }
                    return `<div style="margin-bottom:4px;"><span style="font-size:10px; color:#FFFFFF; font-weight:900; text-transform:uppercase; margin-right:8px;">${label}:</span> ${s}</div>`;
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
                } else if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') {
                    const nr = this.calcNassau();
                    const tn1 = `${sn(nr.t1[0])}/${sn(nr.t1[1])}`;
                    const tn2 = `${sn(nr.t2[0])}/${sn(nr.t2[1])}`;
                    const nassauLine = (label, seg) => {
                        const d = seg.w1 - seg.w2;
                        let val = 'ALL SQUARE';
                        if (d > 0) val = `${tn1} <em style="color:#60A5FA">${d} UP</em>`;
                        else if (d < 0) val = `${tn2} <em style="color:#22D3EE">${Math.abs(d)} UP</em>`;
                        return `<div style="margin-bottom:4px;"><span style="font-size:10px; color:#FFFFFF; font-weight:900; text-transform:uppercase; margin-right:8px;">${label}:</span> ${val}</div>`;
                    };
                    statHTML = nassauLine('Front', nr.front) + nassauLine('Back', nr.back) + nassauLine('Total', nr.overall);
                    if (nr.presses && nr.presses.length > 0) {
                        nr.presses.forEach(p => {
                            statHTML += nassauLine(p.name, p);
                        });
                    }
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
                if (this.d.gameType === 'cc_match' || this.d.gameType === 'nassau') {
                    const isFront = (rh <= 9);
                    const curNine = isFront ? 'front' : 'back';
                    const nr = this.calcNassau();
                    const activeSeg = isFront ? nr.front : nr.back;
                    const diff1 = activeSeg.w1 - activeSeg.w2;
                    const diff2 = activeSeg.w2 - activeSeg.w1;
                    const hasP1 = this.d.nassauPresses && this.d.nassauPresses.some(p => p.nine === curNine && p.team === 1);
                    const hasP2 = this.d.nassauPresses && this.d.nassauPresses.some(p => p.nine === curNine && p.team === 2);
                    if (diff1 < 0 && !hasP1) pressButtons += `<button class="g-btn g-btn-sm" style="background:#EF4444; width:auto; margin-top:4px; margin-right:4px; padding:6px 10px; font-size:10px;" onclick="App.initiateNassauPress(1)">${sn(nr.t1[0])}/${sn(nr.t1[1])} PRESS</button>`;
                    if (diff2 < 0 && !hasP2) pressButtons += `<button class="g-btn g-btn-sm" style="background:#F59E0B; width:auto; margin-top:4px; padding:6px 10px; font-size:10px;" onclick="App.initiateNassauPress(2)">${sn(nr.t2[0])}/${sn(nr.t2[1])} PRESS</button>`;
                } else if (main && this.d.gameType !== 'scramble' && this.d.gameType !== 'stroke') {
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

                const isCC = (this.d.gameType === 'cc_match');
                const map = (id, pid) => {
                    this.slotMap[id] = pid;
                    const ec = document.getElementById('slot-' + id);
                    if (!ec) return;
                    const jRow = ec.nextElementSibling;
                    
                    if (isCC && (id === 1 || id === 3)) {
                        ec.style.display = 'none';
                        if (jRow) jRow.style.display = 'none';
                        return;
                    }

                    if (!this.d.ps[pid]) { ec.style.display = 'none'; if (jRow) jRow.style.display = 'none'; return; }
                    ec.style.display = 'flex';
                    if (jRow) jRow.style.display = 'flex';
                    const nmEl = document.getElementById('nm-' + id);
                    const pops = isCC
                        ? Math.max(this.getPops(pid, hIdx), this.getPops(pid + 1, hIdx))
                        : this.getPops(pid, hIdx);
                    const dots = " (H)".repeat(pops);
                    
                    let displayName = this.d.ps[pid];
                    if (isCC) {
                        if (id === 0) displayName = `${this.d.ps[0]} & ${this.d.ps[1]}`;
                        else if (id === 2) displayName = `${this.d.ps[2]} & ${this.d.ps[3]}`;
                    }

                    if (this.d.gameType === 'single') {
                        let relScore = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = (this.d.s[h] && this.d.s[h][pid]);
                            if (sc) relScore += (sc - ((c && c.p) ? c.p[h-1] : 4));
                        }
                        const sStr = relScore === 0 ? 'E' : (relScore > 0 ? '+' + relScore : relScore);
                        nmEl.innerHTML = `${displayName} <span style="color:#10B981; font-weight:900; margin-left:8px; font-size:16px;">${sStr}</span>`;
                    } else {
                        const expVal = Math.round(exposure[pid] || 0);
                        const expTxt = (expVal >= 0 ? '+' : '') + expVal;
                        const expCol = expVal >= 0 ? '#10B981' : '#F87171';
                        const expBg = expVal >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)';
                        const jk = this.getJunkStats()[this.d.ps[pid]] || { G: 0, S: 0, P: 0 };
                        const junkStr = isCC ? "" : `<span style="font-size:9px; color:#FFFFFF; margin-left:8px;">🟢${jk.G} 🏖️${jk.S} LP${jk.P}</span>`;
                        nmEl.innerHTML = `${displayName}${dots} ${junkStr} <span style="color:${expCol}; background:${expBg}; border:1px solid ${expCol}44; font-weight:900; font-size:10px; padding:2px 6px; border-radius:6px; margin-left:4px; vertical-align:middle;">$${expTxt}</span>`;
                    }
                    nmEl.style.color = (pops > 0 && this.d.gameType !== 'single') ? '#F59E0B' : '#FFFFFF';
                    const ghEl = document.getElementById('gh-' + id);
                    if (ghEl) ghEl.innerText = "PAR " + par;
                    const sc = (this.d.s[this.d.h] && this.d.s[this.d.h][pid]) !== undefined ? this.d.s[this.d.h][pid] : (isCC ? par : undefined);
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
                const main_calc = (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') ? this.calcSegResults(curSeg_calc)[0] : null;

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
                this.updateStrokeAlert();
                this.updateJunkUI();
                this.checkStandingsBtn();
            },

            updateStrokeAlert: function () {
                const el = document.getElementById('stroke-alert-box');
                const msgEl = document.getElementById('stroke-alert-msg');
                if (!el || !msgEl) return;

                const hIdx = this.d.h - 1;
                let strokedPlayers = [];
                for (let i = 0; i < 4; i++) {
                    if (this.d.ps[i] && this.getPops(i, hIdx) > 0) {
                        strokedPlayers.push(this.d.ps[i].trim());
                    }
                }

                if (strokedPlayers.length > 0 && this.d.gameType !== 'single' && this.d.gameType !== 'scramble') {
                    let namesStr = "";
                    if (strokedPlayers.length === 1) namesStr = strokedPlayers[0] + " has a stroke";
                    else if (strokedPlayers.length === 2) namesStr = strokedPlayers[0] + " and " + strokedPlayers[1] + " have strokes";
                    else if (strokedPlayers.length === 3) namesStr = strokedPlayers[0] + ", " + strokedPlayers[1] + " and " + strokedPlayers[2] + " have strokes";
                    else if (strokedPlayers.length === 4) namesStr = "Everyone has strokes";
                    
                    msgEl.innerText = namesStr + " on this hole";
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

                if (r.totalItems === 0) {
                    h += `<div style="color:#94a3b8; font-style:italic; padding:8px;">No Junk items earned in this segment.</div>`;
                } else {
                    let winners = false;
                    jRes.players.forEach(pIdx => {
                        const items = r.items[pIdx];
                        if (items > 0) {
                            winners = true;
                            const earned = items * (jRes.players.length - 1) * (this.d.junkBet || 1);
                            h += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b;">
                                <span style="font-weight:700; color:white;">${this.d.ps[pIdx]} (${items} item${items > 1 ? 's' : ''})</span>
                                <span style="font-weight:900; color:#10B981;">+$${earned}</span>
                            </div>`;
                        }
                    });
                    if (!winners) h += `<div style="color:#FFFFFF; font-style:italic;">No payouts this segment.</div>`;
                }

                if (r.voided && r.voided.length > 0) {
                    h += `<div style="margin-top:16px; font-size:12px; font-weight:700; color:#EF4444;">VOIDED (Bogey+):</div>`;
                    r.voided.forEach(v => {
                        h += `<div style="font-size:11px; color:#F87171; font-style:italic; margin-bottom:2px;">⚠️ ${this.d.ps[v.pIdx].substring(0,3)} ${v.type[0]} on H${v.h}</div>`;
                    });
                }

                const body = document.getElementById('junk-payout-body');
                const modal = document.getElementById('junk-payout-modal');
                if (body) body.innerHTML = h;
                if (modal) modal.classList.add('active');
            },
            calcJunkRes: function () {
                const bet = this.d.junkBet !== undefined && this.d.junkBet > 0 ? this.d.junkBet : 1;
                let players = (!this.d.junkPlayers || this.d.junkPlayers.length == 0) ? [0, 1, 2, 3] : this.d.junkPlayers;
                players = players.filter(idx => this.d.ps[idx]);
                if (players.length === 0) return null;

                const segs = [
                    { name: "HOLES 1-6", h: [1, 6] },
                    { name: "HOLES 7-12", h: [7, 12] },
                    { name: "HOLES 13-18", h: [13, 18] }
                ];
                
                const results = [];
                const totalNet = { 0: 0, 1: 0, 2: 0, 3: 0 };
                const totalItems = { 0: 0, 1: 0, 2: 0, 3: 0 };

                segs.forEach((sig, segIdx) => {
                    const playerItems = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    let totalItemsInSeg = 0;
                    const voided = []; // Track voided items for the note

                    [1, 2, 3, 4, 5, 6].forEach(rh => {
                        const relH = (segIdx * 6) + rh;
                        const absH = this.getAbsHole(relH);
                        const c = CS[this.d.crs] || CS['cc'];
                        if (!c || !c.p) return;
                        const par = c.p[absH - 1];
                        if (this.d.junk && this.d.junk[absH]) {
                            players.forEach(pIdx => {
                                ['G', 'S', 'P'].forEach(t => {
                                    if (this.d.junk[absH][pIdx + '_' + t]) {
                                        const sc = (this.d.s[absH] && this.d.s[absH][pIdx]);
                                        // RULE: G and S require Par or BETTER
                                        if (sc && (t === 'G' || t === 'S') && sc > par) {
                                            voided.push({ pIdx, h: absH, type: t === 'G' ? 'Greenie' : 'Sandie', sc });
                                        } else {
                                            playerItems[pIdx]++;
                                            totalItems[pIdx]++;
                                            totalItemsInSeg++;
                                        }
                                    }
                                });
                            });
                        }
                    });

                    // Direct $1 per item from each other player (No limits)
                    const payouts = { 0: 0, 1: 0, 2: 0, 3: 0 };
                    players.forEach(i => {
                        // Net for this segment: (items earned * (N - 1)) - (items earned by everyone else)
                        const segNet = (playerItems[i] * players.length - totalItemsInSeg) * bet;
                        totalNet[i] += segNet;
                        payouts[i] = playerItems[i] * (players.length - 1) * bet;
                    });

                    results.push({
                        name: sig.name,
                        totalItems: totalItemsInSeg,
                        items: playerItems,
                        payouts: payouts,
                        voided: voided
                    });
                });

                return { results, net: totalNet, players, totalItems };
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
                    const isCC = (this.d.gameType === 'cc_match');
                    const playerIndices = isCC ? [0, 2] : [0, 1, 2, 3];
                    playerIndices.forEach(pIdx => {
                        if (!this.d.ps[pIdx]) return;
                        let nameLabel = this.d.ps[pIdx].substring(0, 8);
                        if (isCC) {
                            if (pIdx === 0) nameLabel = `${this.d.ps[0].substring(0, 3)}/${this.d.ps[1].substring(0, 3)}`;
                            else if (pIdx === 2) nameLabel = `${this.d.ps[2].substring(0, 3)}/${this.d.ps[3].substring(0, 3)}`;
                        }
                        let r = `<tr><td>${nameLabel}</td>`;
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

                            const pops = isCC
                                ? Math.max(this.getPops(pIdx, n - 1), this.getPops(pIdx + 1, n - 1))
                                : this.getPops(pIdx, n - 1);
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
                const isCC = (this.d.gameType === 'cc_match');
                const playerIndices = isCC ? [0, 2] : [0, 1, 2, 3];
                playerIndices.forEach(i => {
                    if (!this.d.ps[i]) return;
                    let t = 0;
                    for (let h = 1; h <= 18; h++) if (this.d.s[h] && this.d.s[h][i]) t += this.d.s[h][i];
                    
                    let nameLabel = this.d.ps[i].substring(0, 8);
                    if (isCC) {
                        if (i === 0) nameLabel = `${this.d.ps[0]} & ${this.d.ps[1]}`;
                        else if (i === 2) nameLabel = `${this.d.ps[2]} & ${this.d.ps[3]}`;
                    }
                    totHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#0F172A; padding:8px 12px; border-radius:8px; border:1px solid #334155;"><span style="font-size:12px; font-weight:700; color:#FFFFFF; text-transform:uppercase;">${nameLabel}</span><span style="font-size:15px; font-weight:900; color:white;">${t || '-'}</span></div>`;
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
                } else if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') {
                    const nr = this.calcNassau();
                    const bet = this.d.bet || (this.d.gameType === 'cc_match' ? 5 : 4);
                    [nr.front, nr.back, nr.overall].forEach(seg => {
                        if (seg.winner === 1) {
                            nr.t1.forEach(p => bets[p] += bet);
                            nr.t2.forEach(p => bets[p] -= bet);
                        } else if (seg.winner === 2) {
                            nr.t2.forEach(p => bets[p] += bet);
                            nr.t1.forEach(p => bets[p] -= bet);
                        }
                    });
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') {
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
                            <span style="font-size:13px; font-weight:700; color:#FFFFFF;">${this.d.ps[i]}</span>
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
                
                } else if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') {
                    const nr = this.calcNassau();
                    const bet = this.d.bet || 4;
                    const tn1 = `${this.d.ps[nr.t1[0]]}/${this.d.ps[nr.t1[1]]}`;
                    const tn2 = `${this.d.ps[nr.t2[0]]}/${this.d.ps[nr.t2[1]]}`;
                    [nr.front, nr.back, nr.overall].forEach(seg => {
                        if (seg.winner === 1) { nr.t1.forEach(p => bets[p] += bet); nr.t2.forEach(p => bets[p] -= bet); }
                        else if (seg.winner === 2) { nr.t2.forEach(p => bets[p] += bet); nr.t1.forEach(p => bets[p] -= bet); }
                    });
                    const segLine = (label, seg) => {
                        if (seg.winner === 1) return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#FFFFFF;">${label}:</span><span style="color:#60A5FA;">${tn1} wins +$${bet}</span></div>`;
                        if (seg.winner === 2) return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#FFFFFF;">${label}:</span><span style="color:#22D3EE;">${tn2} wins +$${bet}</span></div>`;
                        return `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;"><span style="color:#FFFFFF;">${label}:</span><span style="color:#FFFFFF;">All Square</span></div>`;
                    };
                    const title = this.d.gameType === 'cc_match' ? "CAPTAIN'S CHOICE RESULTS" : "NASSAU RESULTS";
                    const titleCol = this.d.gameType === 'cc_match' ? "#F59E0B" : "#60A5FA";
                    resHTML += `<div style="margin-bottom:16px;background:rgba(96,165,250,0.1);padding:10px;border-radius:8px;">`
                        + `<div style="font-weight:900;color:${titleCol};font-size:14px;text-align:center;margin-bottom:10px;">🏆 ${title}</div>`
                        + segLine('FRONT 9', nr.front)
                        + segLine('BACK 9', nr.back)
                        + segLine('TOTAL', nr.overall)
                        + `</div>`;
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') {
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
                            if (r.winner === 1) { wTxt = `${this.d.ps[r.seg.t1[0]]}/${this.d.ps[r.seg.t1[1]]} (+$${r.amt})`; wCol = "#60A5FA"; }
                            else if (r.winner === 2) { wTxt = `${this.d.ps[r.seg.t2[0]]}/${this.d.ps[r.seg.t2[1]]} (+$${r.amt})`; wCol = "#22D3EE"; }

                            resHTML += `<div style="margin-bottom:16px;">
                                <div style="font-weight:900; color:#FFFFFF; font-size:11px; text-transform:uppercase; margin-bottom:2px;">${matchName}</div>
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
                                let bStyle = "background:#334155; color:#FFFFFF;", bTxt = `H${h}`;
                                if (best1 < best2) { bStyle = "background:#60A5FA; color:#0F172A;"; bTxt = `H${h}: ${best1}`; }
                                else if (best2 < best1) { bStyle = "background:#22D3EE; color:#082F49;"; bTxt = `H${h}: ${best2}`; }
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
                            <div>${r.refunded ? '<span style="color:#F59E0B;">(REFUNDED)</span>' : ''} ${inner || '<span style="color:#FFFFFF;">-</span>'}</div>
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
                    resHTML += `<div style="margin-top:12px; border-top:1px solid #334155; padding-top:4px;"><div style="font-size:11px; font-weight:900; color:#FFFFFF; text-transform:uppercase;">Junk Round Totals</div>`;
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
            }
        });
