# Course Database Expansion & Architecture Plan

## 1. Objective
Expand the COD Golf application to support a significantly larger database of courses, specifically including all public courses in North Carolina (NC), South Carolina (SC), and Florida (FL).

## 2. The Problem
The current database is hardcoded into `data/courses.js`. Scaling this from ~20 courses to 1,500+ courses would:
- Increase the initial app download size significantly (5MB+).
- Slow down browser parsing/startup time.
- Make the "Select Course" UI redundant and difficult to navigate.

## 3. Proposed Solution: "Lazy Loading" by Region
Instead of one giant file, the database will be split into regional files hosted within the Git repository.

### File Structure:
```text
/data
  /courses
    nc.js       (All NC Public Courses)
    sc.js       (All SC Public Courses)
    fl.js       (All FL Public Courses)
    master.js   (The current favorites/built-in courses)
```

### Technical Workflow:
1.  **Selection:** User selects a Region (State) from a dropdown.
2.  **Fetch:** The app dynamically fetches the corresponding file (e.g., `data/courses/nc.js`).
3.  **Search:** An **Autocomplete Search bar** replaces the long dropdown list, allowing users to quickly find their course among hundreds of matches.
4.  **Cache:** Once loaded, the data is kept in memory for the duration of the session.

## 4. Why Use Git for this?
- **No Limits:** GitHub easily handles files up to 100MB; our state files will be ~2MB.
- **Versioning:** We can track changes to pars/handicaps over time.
- **Accessibility:** Files are served as static assets (fast and free via GitHub Pages).

## 5. Risk Mitigation & Safety
To ensure no errors during transition:
- **Strict Data Schema:** All courses must follow a consistent JSON-like format (Par, Yardage, HCP arrays).
- **Validation Script:** A small utility to check for missing commas or invalid hole counts before deployment.
- **Incremental Rollout:** 
    1. Keep existing data structure.
    2. Build "Fetch" capability.
    3. Test with one external state (NC).
    4. Move all data once 100% stable.
- **Loading UI:** Add a "Loading Courses..." indicator to prevent user clicks while data is being fetched.

## 6. Next Steps
- Define the exact "Course Object" format.
- Create the `/data/courses/` subdirectory.
- Prototype the Autocomplete UI for large lists.
