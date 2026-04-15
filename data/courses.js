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
    "jones": { n: "Jones (Sea Trail)", r: "NC" },
    "lp": { n: "Lonnie Poole", r: "NC" },
    "maples": { n: "Maples (Sea Trail)", r: "NC" },
    "re": { n: "Rivers Edge", r: "NC" },
    "sandpiper": { n: "Sandpiper Bay", r: "NC" },
    
    // SOUTH CAROLINA (SC)
    "prestwick": { n: "Prestwick CC", r: "SC" },
    "blackmoor": { n: "Blackmoor GC", r: "SC" }
};

/**
 * CS stores the full course detail objects once loaded.
 * Backwards compatibility: initialized with a few essential defaults if needed.
 */
let CS = {};