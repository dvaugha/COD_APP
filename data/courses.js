/**
 * COURSE DATABASE INDEX (v275.20)
 * This index is used for searching. Full data is lazy-loaded from regional files.
 */
const CS_INDEX = {
    // FLORIDA (FL)
    "belle": { n: "Belle Glade", r: "FL" },
    "bonifay": { n: "Bonifay", r: "FL" },
    "havana": { n: "Havana CC", r: "FL" },
    "lopez": { n: "Nancy Lopez", r: "FL" },
    "palmer": { n: "Palmer Legends", r: "FL" },
    "sc": { n: "Shallow Creek", r: "FL" },
    "so": { n: "Southern Oaks", r: "FL" },
    "wl": { n: "Woodlands", r: "FL" },
    
    // NORTH CAROLINA (NC)
    "byrd": { n: "Byrd (Sea Trail)", r: "NC" },
    "cc": { n: "Crow Creek CC", r: "NC" },
    "ec": { n: "Eagle Chase GC", r: "NC" },
    "jones": { n: "Jones (Sea Trail)", r: "NC" },
    "lp": { n: "Lonnie Poole", r: "NC" },
    "maples": { n: "Maples (Sea Trail)", r: "NC" },
    "meadowlands": { n: "Meadowlands", r: "NC" },
    "pearl": { n: "The Pearl", r: "NC" },
    "re": { n: "Rivers Edge", r: "NC" },
    "rga": { n: "Raleigh Golf Association", r: "NC" },
    "rr": { n: "River Ridge", r: "NC" },
    "sandpiper": { n: "Sandpiper Bay", r: "NC" },
    "lionspaw": { n: "Lion's Paw", r: "NC" },
    "panthersrun": { n: "Panther's Run", r: "NC" },
    
    // SOUTH CAROLINA (SC)
    "prestwick": { n: "Prestwick CC", r: "SC" },
    "blackmoor": { n: "Blackmoor GC", r: "SC" },
    "river_hills": { n: "River Hills", r: "SC" },
    "grande_dunes": { n: "Grande Dunes Resort Course", r: "SC" },
    "tidewater": { n: "Tidewater", r: "SC" },
    "caledonia": { n: "Caledonia", r: "SC" },
    "trueblue": { n: "True Blue", r: "SC" },
    "diamondback": { n: "Diamondback", r: "SC" },
    "barefoot_fazio": { n: "Barefoot \u2014 Fazio", r: "SC" },
    "barefoot_love": { n: "Barefoot \u2014 Love", r: "SC" },
    "beachwood": { n: "Beachwood", r: "SC" },
    "heritage": { n: "Heritage Club", r: "SC" },
    "manowar": { n: "Man O' War", r: "SC" },
    "pawleys": { n: "Pawleys Plantation", r: "SC" },
    "pine_lakes": { n: "Pine Lakes", r: "SC" },
    "surf": { n: "Surf Club", r: "SC" },
    "tpcmyrtle": { n: "TPC Myrtle Beach", r: "SC" },
    "tradition": { n: "Tradition Golf Club", r: "SC" },
    "willbrook": { n: "Willbrook Plantation", r: "SC" },
    "wizard": { n: "The Wizard", r: "SC" }
};

/**
 * CS stores the full course detail objects once loaded.
 * Backwards compatibility: initialized with a few essential defaults if needed.
 */
let CS = {};