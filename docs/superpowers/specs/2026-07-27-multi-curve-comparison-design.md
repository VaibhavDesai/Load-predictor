# Multi-Curve Comparison Design

**Date:** 2026-07-27  
**Status:** Design  
**Scope:** Add ability to compare 2-5 curves simultaneously with interactive toggles

---

## Overview

Replace the current "Compare Curves" tab with an inline panel that allows users to add up to 5 curves for comparison. Curves overlay on a single unified chart with interactive legend toggles. Primary use case: compare PRs against main branch or compare multiple PRs.

---

## User Stories

1. **Compare PR vs main**: User loads single curve view for `main`, clicks "Compare", adds `PR-123`, sees both overlaid with toggle controls
2. **Compare multiple PRs**: User compares 3 PRs against each other to see which has the best/worst pattern
3. **Share comparison**: User generates comparison link (`?curves=main,PR-123,PR-456`) and shares with team
4. **Remove noise**: User toggles curves on/off in legend to focus on specific pairs

---

## UI Components

### Comparison Panel (Right Slide-In)

**Trigger:** Button next to tabs (label: "+ Compare" or "Add Curves")

**Panel Contents:**
- Title: "Compare Curves"
- 5 input fields, each with:
  - Label: "Curve 1", "Curve 2", etc.
  - Text input field (placeholder: "main, PR-123, etc.")
  - X button to clear field (disabled for Curve 1 if it's the only curve)
- Validation message area (red text for errors)
- "Done" button at bottom
- Click outside panel to close

**Initial State:**
- Curve 1 pre-filled with `main`
- Curves 2–5 empty
- Panel hidden until user clicks "+ Compare"

**Behavior:**
- As user types, fetch curve and update legend live (debounce 500ms)
- Show loading spinner while fetching
- Show error message if fetch fails (e.g., "PR-123 not found")
- Require at least 2 curves to compare (show validation error if user tries to proceed with 1)
- Reorder not initially required (can add later if needed)

---

## Chart Display (Comparison Mode)

**Unified Chart:**
- All curves overlay on single chart (x-axis: timeslots 0-47, y-axis: absolute load)
- Each curve has distinct color (reuse existing COLORS array)
- Legend shows all loaded curves with toggle checkboxes (Plotly native)
- Click legend item to show/hide curve
- Hover tooltip shows values for visible curves only

**Heatmap:**
- Skip heatmap in comparison mode (too complex with multiple overlays)
- Heatmap only shown in single-curve view

---

## Data Flow

### Input Format
- Accept: `main`, `PR-123`, `PR-456`, etc.
- Map to GitHub URLs:
  - `main` → `https://raw.githubusercontent.com/{owner}/{repo}/main/data/curves/{env}_{region}.json`
  - `PR-123` → `https://raw.githubusercontent.com/{owner}/{repo}/refs/pull/123/head/data/curves/{env}_{region}.json`

### Fetch & Merge
- Fetch all curve URLs in parallel (Promise.all)
- Merge into single `CurveData` object with curves array of 2–5 items
- If any fetch fails, show error for that curve; others still display
- Cache fetched curves to avoid re-fetching on toggle

### URL Structure
- Single curve: `?curve=main` (existing, no change)
- Compare mode: `?curves=main,PR-123,PR-456` (new)
- When user modifies curves in panel, URL updates automatically (state machine)
- Shareable: Copy URL from browser address bar to share comparison

---

## State Management

**App State:**
```typescript
mode: 'single' | 'compare'
curveData: CurveData | null          // Single curve mode
compareData: CurveData[] | null      // Compare mode (array of curves)
comparisonPanel: { isOpen: boolean, curves: string[] }
```

**URL Params:**
- Single: `?curve=main`
- Compare: `?curves=main,PR-123,PR-456`

**Panel State:**
- Input fields reflect URL `curves` param
- Updating input → debounce → fetch → update URL
- Closing panel preserves URL (user can re-open and see same curves)

---

## Metadata Panel (Comparison Mode)

Show stats for primary curve (Curve 1 / main) only. Other curves visible in legend but stats focus on baseline.

---

## Error Handling

**Fetch Failures:**
- If curve URL fails to load: Show error badge on that curve's legend item
- Show tooltip: "Failed to load PR-123"
- Other curves still display
- User can remove and re-add the curve

**Validation Errors:**
- Less than 2 curves: Show message "Add at least 2 curves to compare"
- Invalid curve name format: Show inline error "Invalid format (try 'main' or 'PR-123')"

---

## Implementation Notes

**Components to Create:**
- `ComparisonPanel.tsx`: Slide-in panel with 5 input fields
- Modify `App.tsx`: Add compare mode, URL parsing, state machine
- Modify `CurveChart.tsx`: Accept array of curves, overlay logic
- Update `MetadataPanel.tsx`: Handle comparison mode stats

**Dependencies:**
- Existing: Plotly legend toggle (native)
- New: URL parsing for `curves` param
- Parallel fetch: `Promise.all()`

**Testing:**
- Load single curve, click Compare, add PR-123 → both display
- Toggle curve in legend → chart updates
- Close panel, re-open → curves preserved
- Share URL with comparison → recreates same view
- Fetch failure → shows error, other curves display

---

## Scope

**In Scope:**
- Add comparison panel with 5 inputs
- Overlay up to 5 curves on unified chart
- Interactive legend toggles
- URL-based state persistence

**Out of Scope (Future):**
- Reorder curves
- Difference/delta view
- Normalized (0-1) scale option
- Per-curve heatmap
- Comparison stats (composite metrics)

---
