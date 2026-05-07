const fs = require('fs');
window = { addEventListener: function(){} };
document = { getElementById: function(){ return { classList: { remove: function(){}, add: function(){} }, style: {} }; }, querySelectorAll: function(){ return []; } };
let code = fs.readFileSync('js/app.js', 'utf8');
code += `
App.d = {
    h: 15,
    start: 10,
    s: {
        10: {0:4,1:4,2:4,3:4},
        11: {0:4,1:4,2:4,3:4},
        12: {0:4,1:4,2:4,3:4},
        13: {0:4,1:4,2:4,3:4},
        14: {0:4,1:4,2:4,3:4},
        15: {0:4,1:4,2:4,3:4}
    },
    ps: ['Dan', 'Dave', 'Jim', 'Mike'],
    crs: 'cc',
    gameType: 'cod',
    roundEnded: false,
    press: {0:[],1:[],2:[]}
};
App.save = function(){};
App.uDash = function(){};
App.updateJunkUI = function(){};
App.nav = function(){};
CS = { 'cc': { p: [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4], hcp: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] } };
try {
    App.navH(1);
    console.log('navH(1) completed successfully! Next h: ' + App.d.h);
    App.navH(-1);
    console.log('navH(-1) completed successfully! Next h: ' + App.d.h);
} catch(e) {
    console.error('navH CRASHED:', e);
}
`;
eval(code);
