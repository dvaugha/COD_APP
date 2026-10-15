Object.assign(App, {

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
                    } else if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') {
                        const nr = this.calcNassau();
                        const bet = this.d.bet || (this.d.gameType === 'cc_match' ? 5 : 4);
                        const tn1 = `${ps[nr.t1[0]]} & ${ps[nr.t1[1]]}`;
                        const tn2 = `${ps[nr.t2[0]]} & ${ps[nr.t2[1]]}`;
                        [
                            { name: "FRONT 9", seg: nr.front },
                            { name: "BACK 9", seg: nr.back },
                            { name: "TOTAL", seg: nr.overall }
                        ].forEach(s => {
                            let wStr = "ALL SQUARE", col = "white";
                            if (s.seg.winner === 1) {
                                nr.t1.forEach(p => bets[p] += bet);
                                nr.t2.forEach(p => bets[p] -= bet);
                                wStr = `${tn1} won $${bet}`;
                                col = "#10B981";
                            } else if (s.seg.winner === 2) {
                                nr.t2.forEach(p => bets[p] += bet);
                                nr.t1.forEach(p => bets[p] -= bet);
                                wStr = `${tn2} won $${bet}`;
                                col = "#F59E0B";
                            }
                            segRes.push({ name: s.name, val: wStr, color: col });
                        });
                    } else { // Handles COD and Scramble games
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
                        recapHTML += `<div style="color:#FFFFFF; font-size:10px; text-align:center;">No Fireballs.</div>`;
                    }
                    recapHTML += `</div></div>`;

                    recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;"><div class="tx-sm" style="color:white; margin-bottom:8px;">SCORING BREAKDOWN</div><div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;"><div style="flex:2; color:#FFFFFF; font-size:10px; font-weight:700;">PLY</div><div style="flex:1; text-align:center; color:#10B981; font-size:10px; font-weight:900;">BIRD</div><div style="flex:1; text-align:center; color:#cbd5e1; font-size:10px; font-weight:900;">PAR</div><div style="flex:1; text-align:center; color:#F59E0B; font-size:10px; font-weight:900;">BOG</div><div style="flex:1; text-align:center; color:#EF4444; font-size:10px; font-weight:900;">DBL+</div></div>`;
                    pRecap.forEach(p => { if (p.totalStrokes === 0) return; recapHTML += `<div style="display:flex; align-items:center; padding:4px 0; border-bottom:1px solid #334155;"><div style="flex:2; color:white; font-weight:700; font-size:13px;">${p.name.substring(0, 6)}</div><div style="flex:1; text-align:center; color:#10B981; font-weight:700;">${p.dist.bird}</div><div style="flex:1; text-align:center; color:#cbd5e1; font-weight:700;">${p.dist.par}</div><div style="flex:1; text-align:center; color:#F59E0B; font-weight:700;">${p.dist.bog}</div><div style="flex:1; text-align:center; color:#EF4444; font-weight:700;">${p.dist.dbl}</div></div>`; });
                    recapHTML += `</div>`;

                    // HANDICAP SUMMARY (Share)
                    const sHoles = [];
                    for (let h = 1; h <= 18; h++) {
                        const hcpAlloc = this.getDisplayHcp(h - 1);
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
                                <span style="color:#cbd5e1; font-size:12px; font-weight:700;">HOLE ${this.ghl(item.h)} <span style="color:#FFFFFF; font-weight:400;">(HCP ${item.hcp})</span></span>
                                <span style="color:#F59E0B; font-size:10px; font-weight:700; text-align:right;">${item.list.join(', ')}</span>
                            </div>`;
                        });
                    } else {
                        recapHTML += `<div style="color:#FFFFFF; font-size:10px; padding:4px;">No strokes given.</div>`;
                    }
                    recapHTML += `</div></div>`;

                    // JUNK for Share
                    if (this.d.gameType !== 'single') {
                        const junk = this.getJunkStats();
                        recapHTML += `<div class="box" style="margin-top:12px; border:1px solid #334155; padding:8px; border-radius:12px; background:#1E293B;">
                            <div class="tx-sm" style="color:white; margin-bottom:8px;">THE JUNK DRAWER</div>
                            <div style="display:flex; border-bottom:1px solid #334155; padding-bottom:6px; margin-bottom:6px;">
                                <div style="flex:1.5; color:#FFFFFF; font-size:10px; font-weight:700;">PLY</div>
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

                    const jRes = this.calcJunkRes();
                    if (jRes && jRes.net && this.d.gameType !== 'single') {
                        [0, 1, 2, 3].forEach(i => {
                            if (ps[i] && jRes.net[i]) bets[i] += jRes.net[i];
                        });
                    }

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
                            <span style="color:#FFFFFF; font-weight:700; width:80px;">${s.name}</span>
                            <span style="color:${s.color || 'white'}; font-weight:700;">${s.val}</span>
                        </div>`;
                    });
                    // Add Junk Financials to Share
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
                                <span>${inner || '<span style="color:#FFFFFF;">-</span>'}</span>
                            </div>`;
                        });

                        segHTML += `<div style="margin-top:8px; border-top:1px solid #334155; padding-top:4px; font-size:11px; color:#FFFFFF; font-weight:900; text-transform:uppercase;">Junk Round Totals</div>`;
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
                        <div class="sn-sub">${new Date().toLocaleDateString()} • ${this.d.tee.toUpperCase()} • COD GOLF v281.1</div>
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

                // Add Junk in simple terms (for non-cc_match games)
                if (this.d.gameType !== 'cc_match' && jRes && jRes.net) {
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
                } else if (this.d.gameType === 'nassau' || this.d.gameType === 'cc_match') {
                    const nr = this.calcNassau();
                    const bet = this.d.bet || (this.d.gameType === 'cc_match' ? 5 : 4);
                    const tn1 = `${this.d.ps[nr.t1[0]]}/${this.d.ps[nr.t1[1]]}`;
                    const tn2 = `${this.d.ps[nr.t2[0]]}/${this.d.ps[nr.t2[1]]}`;

                    const segs = [
                        { name: "FRONT 9", seg: nr.front, bet: bet },
                        { name: "BACK 9", seg: nr.back, bet: bet },
                        { name: "TOTAL", seg: nr.overall, bet: bet }
                    ];

                    if (nr.presses && nr.presses.length > 0) {
                        nr.presses.forEach(p => {
                            segs.push({ name: p.name, seg: p, bet: p.bet || 5 });
                        });
                    }

                    segs.forEach(s => {
                        let wStr = "ALL SQUARE";
                        const sBet = s.bet;
                        if (s.seg.winner === 1) {
                            nr.t1.forEach(p => { bets[p] += sBet; logs[p].push(`${s.name}: +$${sBet}`); });
                            nr.t2.forEach(p => { bets[p] -= sBet; logs[p].push(`${s.name}: ($-${sBet})`); });
                            wStr = `${tn1} (+$${sBet})`;
                        } else if (s.seg.winner === 2) {
                            nr.t2.forEach(p => { bets[p] += sBet; logs[p].push(`${s.name}: +$${sBet}`); });
                            nr.t1.forEach(p => { bets[p] -= sBet; logs[p].push(`${s.name}: ($-${sBet})`); });
                            wStr = `${tn2} (+$${sBet})`;
                        }
                        summary += `${s.name}: ${wStr}\n`;
                    });

                    // Birdie stats for Nassau / Captain's Choice
                    [0, 1, 2, 3].forEach(i => {
                        if (!this.d.ps[i]) return;
                        let gross = 0;
                        for (let h = 1; h <= 18; h++) {
                            const sc = this.d.s[h] && this.d.s[h][i];
                            if (sc) { gross += sc; if (sc < c.p[h - 1]) birdCounts[i]++; }
                        }
                        if (gross > 0 && gross < bestGross) { bestGross = gross; bestPlayerIdx = i; }
                    });
                } else if (this.d.gameType === 'cod' || this.d.gameType === 'scramble' || this.d.gameType === 'highlow') {
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

                let statsStr = "";
                if (bestPlayerIdx !== -1) statsStr += `Low Round: ${this.d.ps[bestPlayerIdx]} (${bestGross})\n`;
                const fireballers = [0, 1, 2, 3].filter(i => birdCounts[i] >= 2).map(i => `${this.d.ps[i]} (${birdCounts[i]})`);
                if (fireballers.length > 0) statsStr += `🔥 Birds: ${fireballers.join(', ')}\n`;

                return { bets, logs, summary, statsStr };
            },

            getSettleStr: function (bets) {
                if (this.d.gameType === 'cc_match') {
                    const t1Names = `${this.d.ps[0]} and ${this.d.ps[1]}`;
                    const t2Names = `${this.d.ps[2]} and ${this.d.ps[3]}`;
                    
                    const nr = this.calcNassau();
                    const bet = this.d.bet || 5;
                    let t1Wins = 0, t2Wins = 0;
                    [nr.front, nr.back, nr.overall].forEach(seg => {
                        if (seg.winner === 1) t1Wins++;
                        else if (seg.winner === 2) t2Wins++;
                    });

                    const diff = (t1Wins - t2Wins) * bet;
                    let matchTxt = "";
                    if (diff > 0) matchTxt = `⚔️ MATCH: ${t2Names} owe ${t1Names} $${diff}`;
                    else if (diff < 0) matchTxt = `⚔️ MATCH: ${t1Names} owe ${t2Names} $${Math.abs(diff)}`;
                    else matchTxt = `⚔️ MATCH: ALL SQUARE`;

                    const fmtAmt = (v) => {
                        const val = Math.round(v || 0);
                        if (val > 0) return `+$${val}`;
                        if (val < 0) return `-$${Math.abs(val)}`;
                        return `$0`;
                    };

                    let txt = matchTxt;

                    // 1. Individual Junk Payouts & totals owed by each person
                    const jRes = this.calcJunkRes();
                    const hasJunk = jRes && jRes.net && Object.values(jRes.net).some(v => Math.round(v) !== 0);
                    if (hasJunk) {
                        txt += "\n\n💰 JUNK TOTALS:\n";
                        [0, 1, 2, 3].forEach(i => {
                            if (this.d.ps[i]) {
                                txt += `${this.d.ps[i]}: ${fmtAmt(jRes.net[i])}\n`;
                            }
                        });

                        // Calculate individual junk payouts
                        let jDebtors = [], jCreditors = [];
                        [0, 1, 2, 3].forEach(i => {
                            let b = Math.round(jRes.net[i] || 0);
                            if (b < 0) jDebtors.push({ id: i, val: Math.abs(b) });
                            else if (b > 0) jCreditors.push({ id: i, val: b });
                        });
                        if (jDebtors.length > 0) {
                            txt += "\nJUNK PAYOUTS:\n";
                            jDebtors.forEach(d => {
                                while (d.val > 0 && jCreditors.length > 0) {
                                    let c = jCreditors[0], amt = Math.min(d.val, c.val);
                                    txt += `${this.d.ps[d.id]} pays ${this.d.ps[c.id]} $${amt}\n`;
                                    d.val -= amt; c.val -= amt; if (c.val === 0) jCreditors.shift();
                                }
                            });
                        }
                    }

                    // 2. Complete totals owed by each player in total (Match + Junk)
                    txt += (txt.endsWith('\n') ? "\n" : "\n\n") + "🏆 COMPLETE TOTALS (Match + Junk):\n";
                    [0, 1, 2, 3].forEach(i => {
                        if (this.d.ps[i]) {
                            txt += `${this.d.ps[i]}: ${fmtAmt(bets[i])}\n`;
                        }
                    });

                    // 3. Final complete payouts
                    let debtors = [], creditors = [];
                    [0, 1, 2, 3].forEach(i => {
                        let b = Math.round(bets[i]);
                        if (b < 0) debtors.push({ id: i, val: Math.abs(b) }); else if (b > 0) creditors.push({ id: i, val: b });
                    });

                    if (debtors.length > 0) {
                        txt += "\nFINAL PAYOUTS:\n";
                        debtors.forEach(d => {
                            while (d.val > 0 && creditors.length > 0) {
                                let c = creditors[0], amt = Math.min(d.val, c.val);
                                txt += `${this.d.ps[d.id]} pays ${this.d.ps[c.id]} $${amt}\n`;
                                d.val -= amt; c.val -= amt; if (c.val === 0) creditors.shift();
                            }
                        });
                    } else {
                        txt += "\nFINAL PAYOUTS:\nALL SQUARE\n";
                    }

                    return txt.trim();
                }

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

                // Add Junk in simple terms (for non-cc_match games)
                if (this.d.gameType !== 'cc_match' && jRes && jRes.net) {
                    let jStr = "";
                    jRes.players.forEach(i => {
                        const v = Math.round(jRes.net[i]);
                        if (v !== 0) jStr += `${this.d.ps[i]} ($${v >= 0 ? '+' : ''}${v}), `;
                    });
                    if (jStr) sett += "\n💰 JUNK: " + jStr.slice(0, -2) + "\n";
                }

                sett += "\n---\n" + (this.d.gameType === 'cc_match' ? "" : "PAYOUTS:\n") + this.getSettleStr(bets);

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
                if (gt === 'cod' || gt === 'scramble' || gt === 'highlow') {
                    const rh = this.getRelHole(this.d.h > 1 ? this.d.h : 1);
                    const curSeg = Math.min(Math.floor((rh - 1) / 6), 2);

                    html += `<div class="std-section">`;
                    html += `<div class="std-section-title" style="color:#10B981;">🏌️ ${gt === 'highlow' ? 'HIGH-LOW' : 'COD'} Match — Segment Status</div>`;

                    for (let si = 0; si <= curSeg; si++) {
                        const seg = segs[si];
                        const res = (gt === 'highlow') ? this.calcMatchHL(si, si*6+1, si*6+6, 0, null) : this.calcMatch(si, si*6+1, si*6+6, 0, null);
                        const n1 = `${this.d.ps[seg.t1[0]] || '?'}/${this.d.ps[seg.t1[1]] || '?'}`;
                        const n2 = `${this.d.ps[seg.t2[0]] || '?'}/${this.d.ps[seg.t2[1]] || '?'}`;
                        const d = res.w1 - res.w2;
                        let statusTxt, statusCol;
                        if (d > 0)       { statusTxt = `${n1} leads ${d} UP`; statusCol = '#60A5FA'; }
                        else if (d < 0)  { statusTxt = `${n2} leads ${Math.abs(d)} UP`; statusCol = '#22D3EE'; }
                        else             { statusTxt = 'All Square'; statusCol = '#FFFFFF'; }

                        html += `<div class="std-row">`;
                        html += `<span style="color:#FFFFFF; font-size:12px;">${seg.label}</span>`;
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
                        if (d > 0)      { txt = `${tn1} leads ${d} UP`; col = '#60A5FA'; }
                        else if (d < 0) { txt = `${tn2} leads ${Math.abs(d)} UP`; col = '#22D3EE'; }
                        else            { txt = 'All Square'; col = '#FFFFFF'; }
                        return `<div class="std-row"><span style="color:#FFFFFF;font-size:12px;">${label}</span><span style="color:${col};font-weight:900;">${txt}</span></div>`;
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
                        const valCol = row.net > 0 ? '#10B981' : row.net < 0 ? '#F87171' : '#FFFFFF';
                        const itemStr = `<span style="font-size:10px;color:#64748B;margin-left:6px;">🟢${row.g} 🏖️${row.s} LP${row.p}</span>`;
                        html += `<div class="std-row">`;
                        html += `<span style="color:white;">${row.name}${itemStr}</span>`;
                        html += `<span style="color:${valCol}; font-size:16px; font-weight:900;">${valStr}</span>`;
                        html += `</div>`;
                    });
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
                    if (!s) continue;
                    if (this.d.gameType === 'cc_match') {
                        if (s[0] === undefined || s[2] === undefined) continue;
                    } else {
                        if (Object.keys(s).length < activeCount) continue;
                    }
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

                const presses = [];
                if (this.d.nassauPresses && this.d.nassauPresses.length > 0) {
                    this.d.nassauPresses.forEach(p => {
                        let pW1 = 0, pW2 = 0;
                        const startH = p.startH;
                        const endH = (p.nine === 'front' ? 9 : 18);
                        for (let rh = startH; rh <= endH; rh++) {
                            const absH = this.getAbsHole(rh);
                            const s = this.d.s[absH];
                            if (!s) continue;
                            if (this.d.gameType === 'cc_match') {
                                if (s[0] === undefined || s[2] === undefined) continue;
                            } else {
                                if (Object.keys(s).length < activeCount) continue;
                            }
                            const best1 = Math.min(
                                (s[t1[0]] || 99) - this.getPops(t1[0], absH - 1),
                                (s[t1[1]] || 99) - this.getPops(t1[1], absH - 1)
                            );
                            const best2 = Math.min(
                                (s[t2[0]] || 99) - this.getPops(t2[0], absH - 1),
                                (s[t2[1]] || 99) - this.getPops(t2[1], absH - 1)
                            );
                            if (best1 < best2) pW1++;
                            else if (best2 < best1) pW2++;
                        }
                        const winner = pW1 > pW2 ? 1 : (pW2 > pW1 ? 2 : 0);
                        const startAbs = this.getAbsHole(startH);
                        const endAbs = this.getAbsHole(endH);
                        const name = `${p.nine === 'front' ? 'FRONT 9' : 'BACK 9'} PRESS (H${startAbs}-${endAbs})`;
                        presses.push({
                            ...p,
                            w1: pW1,
                            w2: pW2,
                            winner,
                            name,
                            bet: p.bet || 5
                        });
                    });
                }

                return {
                    t1, t2,
                    front:   { w1: fW1, w2: fW2, winner: fW1 > fW2 ? 1 : (fW2 > fW1 ? 2 : 0) },
                    back:    { w1: bW1, w2: bW2, winner: bW1 > bW2 ? 1 : (bW2 > bW1 ? 2 : 0) },
                    overall: { w1: oW1, w2: oW2, winner: oW1 > oW2 ? 1 : (oW2 > oW1 ? 2 : 0) },
                    presses
                };
            },

            shareSimpleScorecard: async function () {
                const btn = document.getElementById('sms-score-btn');
                try {
                    btn.innerText = "GENERATING...";
                    const c = CS[this.d.crs] || CS['cc'];
                    const node = document.getElementById('share-node');
                    
                    // Simple Scorecard Snapshot Layout
                    node.innerHTML = `
                        <div class="sn-head" style="font-size:24px; font-weight:900; color:#10B981; margin-bottom:4px;">${c.n}</div>
                        <div class="sn-sub" style="font-size:12px; color:#cbd5e1; margin-bottom:20px;">${new Date().toLocaleDateString()} • ${this.d.tee.toUpperCase()} • SCORECARD</div>
                        <div style="background:#0F172A; border-radius:12px; border:1px solid #334155; padding:16px;">
                            ${this.getScorecardHTML()}
                        </div>
                        <div style="margin-top:20px; text-align:center; font-size:10px; color:#475569;">GENERATED BY COD GOLF v281.1</div>
                    `;

                    // Inject necessary table styles for the snapshot
                    const style = document.createElement('style');
                    style.innerHTML = `
                        #share-node table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                        #share-node th, #share-node td { border: 1px solid #334155; text-align: center; padding: 6px 2px; color: white; font-size: 11px; }
                        #share-node th { background: #1E293B; color: #10B981; font-weight: 900; }
                        #share-node .par-row { background: #0F172A; font-weight: 700; color: #94A3B8; }
                        #share-node .sc-val { font-weight: 900; font-size: 14px; position:relative; z-index:2; }
                        #share-node .sc-bird { color: #10B981; }
                        #share-node .sc-bog { color: #F87171; }
                        #share-node .sc-dbl { color: #EF4444; }
                        #share-node .sc-eagle { color: #22D3EE; text-decoration: underline; }
                        #share-node .card-table-wrap { overflow: hidden; border-radius: 8px; border: 1px solid #334155; }
                    `;
                    node.appendChild(style);

                    // Add a small delay to ensure DOM is rendered before capture
                    await new Promise(r => setTimeout(r, 300));
                    await document.fonts.ready;

                    const canvas = await html2canvas(node, { backgroundColor: '#0F172A', scale: 2, scrollY: 0 });
                    canvas.toBlob(async (blob) => {
                        if (!blob) throw new Error("Canvas Blob Failed");
                        this.shareBlob = blob;
                        const url = URL.createObjectURL(blob);
                        document.getElementById('sp-img').src = url;
                        document.getElementById('share-preview-modal').classList.add('active');
                        
                        const file = new File([blob], 'scorecard.png', { type: 'image/png' });
                        if (navigator.share) {
                            try {
                                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                    await navigator.share({ files: [file], title: `${c.n} Scorecard` });
                                } else {
                                    await navigator.share({ title: `${c.n} Scorecard` });
                                }
                            } catch (e) {
                                if (e.name !== 'AbortError') console.error("Share failed", e);
                            }
                        } else if (navigator.clipboard && navigator.clipboard.write) {
                            try {
                                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                                alert("Scorecard image copied to clipboard!");
                            } catch (err) {
                                console.log("Clipboard image write not supported", err);
                            }
                        }
                        btn.innerText = "SHARE SCORECARD ONLY 📄";
                    }, 'image/png');
                } catch (e) {
                    console.error("Scorecard Share Error: ", e);
                    btn.innerText = "SHARE ERROR";
                }
            },

            closeStandings: function () {
                const modal = document.getElementById('standings-modal');
                if (modal) modal.classList.remove('active');
            }
        });
        window.addEventListener('load', () => App.init());
        window.App = App;
