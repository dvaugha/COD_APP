const fs = require('fs');
window = { addEventListener: () => {}, location: { reload: () => {} }, speechSynthesis: { speak: () => {} } };
document = {
    getElementById: (id) => ({
        value: '10',
        innerText: '',
        innerHTML: '',
        classList: { add: () => {}, remove: () => {} },
        style: {},
        addEventListener: () => {}
    }),
    querySelectorAll: () => []
};
SpeechSynthesisUtterance = function() {};
CS = {
    'cc': { n: 'Custom Course', p: [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4], hcp: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] }
};

let code = fs.readFileSync('js/app.js', 'utf8');
code += `
App.d = {
    h: 15,
    start: 10,
    ps: ["Dan", "Dave", "Jim", "Mike"],
    crs: 'cc',
    gameType: 'cod',
    s: {
        10: {0:4, 1:4, 2:4, 3:4},
        11: {0:4, 1:4, 2:4, 3:4},
        12: {0:4, 1:4, 2:4, 3:4},
        13: {0:4, 1:4, 2:4, 3:4},
        14: {0:4, 1:4, 2:4, 3:4},
        15: {0:4, 1:4, 2:4, 3:4}
    },
    junk: {},
    press: {0:[], 1:[], 2:[]},
    junkPlayers: [0, 1, 2, 3]
};

App.save = function(){};
App.uDash = function(){ console.log("UI DASH Updated to Hole:", App.d.h); };
App.updateJunkUI = function(){};
App.nav = function(){};

try {
    console.log("Current Hole:", App.d.h);
    App.navH(1);
    console.log("New Hole (Forward):", App.d.h);
    App.navH(-1);
    console.log("New Hole (Backward):", App.d.h);
    
    const jRes = App.calcJunkRes();
    if (jRes) {
        console.log("Junk Calculation successful for first segment.");
    }
} catch(e) {
    console.error("TEST FAILED with CRASH:", e);
    process.exit(1);
}
`;
eval(code);
