# WATSON - BUG REPORT
Generated: $(date)

## Critical Bugs (Blocking Real Functionality)

### BUG-001: IPC Not Wired to Renderer
- **File:** `src/data/mock.ts` (searchProfiles function)
- **Status:** BROKEN
- **Description:** The renderer never calls `window.api.runLookup()`. The preload exposes it but it's unused. Main process has handler but nothing invokes it.
- **Reproduction:** Open DevTools in app, check `window.api` - may be undefined. Even if defined, searchProfiles doesn't call it.
- **Fix:** Rewrite searchProfiles to use IPC, handle async properly.

### BUG-002: searchProfiles Returns Mock Data Unconditionally
- **File:** `src/data/mock.ts:298-310`
- **Status:** BROKEN
- **Description:** `return foundProfiles` ignores the query parameter completely. Returns same 12 fake profiles for any search.
- **Reproduction:** Search for anything - always get same GitHub/Reddit/Steam results.
- **Fix:** Make function query-aware, call real lookup.

### BUG-003: Preload May Not Load
- **Files:** `electron/main.cjs:22`, `electron/preload.cjs`
- **Status:** SUSPECT
- **Description:** `sandbox: false, contextIsolation: true` is unusual. Preload path uses `path.join(__dirname, 'preload.cjs')` which should be fine. But no code in renderer checks for `window.api`.
- **Reproduction:** Check console for preload errors, or test `window.api` in DevTools.
- **Fix:** Debug preload loading, possibly adjust webPreferences.

## Medium Bugs (UX/Functionality Issues)

### BUG-004: Fake Progress Animation
- **File:** `src/pages/app/Results.tsx:33-40`
- **Status:** MISLEADING
- **Description:** Progress bar is purely cosmetic setInterval, not tied to actual search progress. Completes in ~2.25s regardless of query.
- **Impact:** Users think something is happening when it's not.
- **Fix:** Tie to actual async lookup state.

### BUG-005: Hardcoded Summary Text
- **File:** `src/pages/app/Results.tsx:113-119`
- **Status:** MISLEADING
- **Description:** Summary says "oldest account is from 2015" and "most active on GitHub and Reddit" for ALL searches regardless of actual results.
- **Impact:** Completely inaccurate information.
- **Fix:** Generate summary from actual found profiles.

### BUG-006: Main Process IPC Handler Doesn't Return Results Properly
- **File:** `electron/main.cjs:72-90`
- **Status:** BROKEN
- **Description:** Handler builds `results` array but never returns it! Line 89-90 just logs to file, no `return results`. Also parsing logic for maigret/holehe output may not match actual format.
- **Reproduction:** Even if called, would return undefined.
- **Fix:** Add `return results` at end of handler.

## Low Bugs (Minor Issues)

### BUG-007: Results Page Shows Fake Stage Names
- **File:** `src/pages/app/Results.tsx:8`
- **Status:** COSMETIC
- **Description:** Stages like "Checking social networks" are hardcoded but don't reflect actual tools being used.
- **Impact:** Minor UX issue
- **Fix:** Make stage names reflect actual progress or remove.

### BUG-008: History/Toolkit Use Mock Data
- **Files:** `src/pages/app/History.tsx`, `src/pages/app/Toolkit.tsx`
- **Status:** BY DESIGN (MOCK)
- **Description:** These pages show mock data. Not bugs per se, just not functional.
- **Impact:** Features not implemented
- **Fix:** Implement real functionality if needed.

## Quick Verification Commands

```bash
# Check if preload loads
# In DevTools console: window.__preloadLoaded

# Check if API exposed  
# In DevTools console: window.api

# Check lookup log
cat /tmp/lookup.log

# Test maigret/holehe manually
python3 -m maigret testuser --json simple
python3 -m holehe test@example.com
```

## Priority Fix Order
1. BUG-002 + BUG-006 - Fix searchProfiles and IPC return value (core functionality)
2. BUG-001 + BUG-003 - Wire renderer to IPC and make it async
3. BUG-004 + BUG-005 - Fix fake UX elements
4. BUG-003 (preload) - Debug if needed
