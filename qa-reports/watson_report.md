# WATSON PROJECT - FULL TECHNICAL REPORT
Generated: $(date)

## Project Overview
- **Name:** Watson (OSINT Analyst Tool)
- **Version:** 1.5.0
- **Stack:** Electron 45 + Vite 8 + React 19 + TypeScript 7 + Tailwind CSS 4
- **Type:** Desktop app (Electron) with web-style routing
- **Purpose:** OSINT tool for looking up public footprint of usernames/emails/domains/phones/companies

## Architecture

### Build System
- **Dev:** `npm run dev` (Vite dev server)
- **Build:** `npm run build` (tsc + vite build) → outputs to `dist/`
- **App (dev):** `npm run app` (build + electron .)
- **Package:** electron-builder (portable exe for Windows, AppImage for Linux)

### Entry Points
- **Renderer entry:** `src/app.tsx` (routes), `src/landing.tsx`
- **HTML files:** `index.html`, `app.html` (root), `dist/index.html`, `dist/app.html`
- **Electron main:** `electron/main.cjs`
- **Preload:** `electron/preload.cjs`

### Routing (React Router v7)
- `/` → Landing page
- `/app` → App layout (Search)
- `/app/results` → Results page  
- `/app/history` → History page
- `/app/case/:id` → Case view
- `/app/toolkit` → Toolkit page

## Data Layer Analysis

### `src/data/mock.ts` (CRITICAL)
This file is the central data source. Current state:
- **`searchProfiles(query: string)`** - Lines ~290-310. Currently **IGNORES THE QUERY** and just returns `foundProfiles` array. This is hardcoded mock data. **NOT connected to real data**.
- **`detectKind(q)`** - Actually functional. Uses regex to detect email/phone/domain/company/username. This IS working logic.
- **`foundProfiles`** - Hardcoded array of 12 fake profiles (GitHub, Reddit, Steam, etc.). **All mock data**.
- **`caseGraph`** - Mock graph data for ACME Logistics case. **Mock data**.
- **`tools`** - Lists OSINT tools with status (some 'connected', some 'available', some 'beta'). **Mock metadata only** - doesn't reflect actual tool availability.
- **`cases`** - Mock case list. **Mock data**.
- **`agentSteps`** - Mock step-by-step for agent simulation. **Mock data**.

### Mock Data Summary
| Export | Type | Status | Notes |
|---|---|---|---|
| `caseGraph` | Graph data | **MOCK** | Hardcoded ACME case |
| `tools` | Tool registry | **MOCK** | Fake statuses/runs counts |
| `cases` | Case list | **MOCK** | Fake cases |
| `agentSteps` | Simulation steps | **MOCK** | Fake agent activity |
| `foundProfiles` | Search results | **MOCK/FALLBACK** | Always returned regardless of query |
| `detectKind()` | Utility | **REAL LOGIC** | Actually works |
| `searchProfiles()` | Lookup function | **NOT CONNECTED** | Returns mocks, ignores query |


## Components Analysis

| Component | Status | Notes |
|---|---|---|
| `BrandIcon.tsx` | **REAL UI** | Renders brand icons (uses simple-icons or custom) |
| `GlassLens.tsx` | **REAL UI** | Animated glass lens effect component |
| `Logo.tsx` | **REAL UI** | Logo component |
| `EvidenceGraph.tsx` | **UNKNOWN** | Need to inspect - may use caseGraph |

## Pages Analysis

| Page | Status | Notes |
|---|---|---|
| `Landing.tsx` | **REAL UI** | Landing page, purely presentational |
| `Search.tsx` | **PARTIAL** | UI works, calls `detectKind()` (real), navigates to results. No actual search logic. |
| `Results.tsx` | **PARTIAL** | UI has progress animation (fake - timed with setInterval), calls `searchProfiles()` which returns mocks. Shows real filter UI but data is fake. Has fake "summary" text about the person. |
| `History.tsx` | **MOCK** | Shows history/cases list - uses mock `cases` data |
| `CaseView.tsx` | **MOCK** | Likely displays mock caseGraph data |
| `Toolkit.tsx` | **MOCK** | Lists mock tools with fake status/runs |
| `AppLayout.tsx` | **REAL UI** | Layout shell |

## Electron Integration (IPC)

### Main Process (`electron/main.cjs`)
- **Status:** Implemented but **NOT WORKING**
- Has IPC handler for `lookup` channel
- Spawns `python3 -m maigret` for username lookups (300s timeout)
- Spawns `python3 -m holehe` for email lookups (120s timeout)
- Logs to `/tmp/lookup.log`
- **Issues:** As noted in previous context, `window.api` undefined in renderer. Preload not loading properly.

### Preload (`electron/preload.cjs`)
- **Status:** Implemented but **NOT LOADING**
- Exposes `window.api.runLookup(kind, query)` via contextBridge
- Exposes `window.__preloadLoaded` flag
- **Issues:** contextIsolation/sandbox issues preventing exposure

### Renderer Integration
- `src/data/mock.ts` was **modified** to attempt IPC calls (based on earlier context) but currently falls back to returning `foundProfiles`
- No actual usage of `window.api` found in current codebase state? Let us check...


**Finding:** The renderer code does NOT currently call `window.api` or use IPC. The attempt to wire it up was made in electron layer but the data layer fell back to mocks and renderer doesn't know about it. The IPC bridge is orphaned.

## Current State vs Intended State

### What's Actually Working (Real)
1. **UI/UX** - All components render, navigation works, styling is complete
2. **Search type detection** - `detectKind()` correctly identifies input type
3. **Routing** - React Router works fine
4. **Electron shell** - App launches, window management works
5. **Build system** - Vite + TypeScript compilation works

### What's Mock/Fake/Not Connected
1. **All search results** - Always returns the same 12 fake profiles regardless of query
2. **Progress animation** - Fake timer in Results.tsx (just counts up over ~2.25 seconds)
3. **Summary text** - Hardcoded fake summary ("oldest account from 2015, most active on GitHub and Reddit")
4. **Cases/History** - All mock data
5. **Toolkit/Tools** - Mock registry with fake status
6. **Case graph** - Mock visualization data
7. **Agent steps** - Fake simulation data
8. **Real OSINT lookups** - **NOT FUNCTIONAL** - maigret/holehe installed but IPC broken, not used by renderer

## Bugs Found

### BUG-001: IPC Bridge Not Connected
- **Severity:** High
- **Location:** `electron/preload.cjs`, `electron/main.cjs`, `src/data/mock.ts`
- **Issue:** Preload exposes API but renderer never calls it. `window.api` would be undefined if called. Main process has handler but nothing invokes it.
- **Impact:** Real lookups impossible. All searches return mocks.

### BUG-002: searchProfiles Ignores Input
- **Severity:** High  
- **Location:** `src/data/mock.ts:298-310`
- **Issue:** Function always returns `foundProfiles` without checking query. Even if IPC worked, this function doesn't use it.
- **Impact:** Search is completely non-functional for real lookups.

### BUG-003: Results Page Uses Fake Progress
- **Severity:** Medium
- **Location:** `src/pages/app/Results.tsx:33-40`
- **Issue:** Progress bar is purely cosmetic timer, not tied to actual lookup progress.
- **Impact:** Misleading UX - looks like searching but nothing is happening.

### BUG-004: Summary Text is Hardcoded
- **Severity:** Low
- **Location:** `src/pages/app/Results.tsx:113-119`
- **Issue:** Says "oldest account is from 2015" regardless of actual data.
- **Impact:** Inaccurate/misleading information.

### BUG-005: Main Process loadFile Path
- **Severity:** Medium
- **Location:** `electron/main.cjs:36`
- **Issue:** Loads `dist/app.html` with hash `/app` - depends on build output existing. Also in dev with `npm run app` it builds first which is fine.
- **Impact:** Could fail if dist not built.

### BUG-006: Preload Sandbox Issues
- **Severity:** High
- **Location:** `electron/main.cjs:22`
- **Issue:** `sandbox: false` set but contextIsolation true - unusual combo. May cause issues. Also preload path resolution.
- **Impact:** IPC may not work as intended.


## Data Flow Analysis

### Current (Actual) Flow
1. User enters query in Search.tsx
2. `detectKind()` identifies type (REAL)
3. Navigate to `/app/results?q=...`
4. Results.tsx starts fake progress timer
5. `searchProfiles(q)` called - IGNORES q, returns `foundProfiles` (ALL MOCK)
6. Results render fake data with fake progress
7. **No network calls, no IPC, no real lookups happen**

### Intended Flow (As Designed)
1. User enters query
2. Detect kind
3. Navigate to results
4. Call `window.api.runLookup(kind, query)` via IPC
5. Main process spawns maigret/holehe
6. Parse results and return to renderer
7. Display real results
8. **Currently broken at steps 4-6**

## External Dependencies

### Installed System Tools
- `maigret` - installed via pip3 (found in system)
- `holehe` - installed via pip3

### Node Dependencies (all present)
- React, React Router, Electron, Vite, Tailwind, Phosphor icons, etc.

### Build Artifacts
- `dist/` exists with built assets
- `release/linux-unpacked/` exists (has Electron binary)
- `node_modules/` fully installed

## File Inventory Summary

**Source files (src/):** ~15 files - mostly UI components and pages
**Electron:** 2 files (main.cjs, preload.cjs)
**Config:** package.json, vite.config.ts, tsconfig.json
**Mock data:** 1 large file with all fake data
**Built artifacts:** dist/, release/

## Recommendations

### To Make It Actually Use Real Data
1. Fix IPC bridge - debug why preload doesn't load, ensure contextBridge works
2. Rewrite `searchProfiles()` to actually call `window.api.runLookup()` and parse results
3. Make Results.tsx use real async lookup instead of fake progress timer
4. Parse maigret/holehe output into `FoundProfile` format
5. Handle errors/timeouts gracefully
6. Add loading states tied to actual IPC calls

### Quick Fixes for Current Bugs
1. **BUG-001/002:** Wire up IPC properly in mock.ts
2. **BUG-003:** Replace fake timer with actual async lookup
3. **BUG-004:** Generate summary from actual data

## Verdict

**Overall: ~90% UI/UX complete, ~0% real OSINT functionality connected.**

The app is a well-designed prototype/mockup. The infrastructure for real lookups (Electron IPC, maigret/holehe installed) was partially set up but never properly integrated into the renderer. Everything the user sees is fake data.

