# Multi-Curve Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to compare 2-5 curves simultaneously by entering PR numbers or "main", with interactive legend toggles and URL-based state persistence.

**Architecture:** 
- New `ComparisonPanel.tsx` component handles input/UI for adding curves
- App.tsx manages two modes: single (one curve) and compare (2-5 curves)
- URL params determine mode: `?curve=main` vs `?curves=main,PR-123,PR-456`
- Parallel fetch all curve URLs, merge into array for overlay on unified chart
- CurveChart accepts array of curves and overlays all with Plotly legend toggles
- MetadataPanel shows primary curve stats only in comparison mode

**Tech Stack:** React, TypeScript, Plotly.js, URL URLSearchParams API

---

## File Structure

**Modified Files:**
- `viz/src/App.tsx` - Add compare mode state, URL parsing, fetch logic
- `viz/src/components/CurveChart.tsx` - Accept curve array, overlay logic
- `viz/src/components/MetadataPanel.tsx` - Show primary curve stats in compare mode
- `viz/src/types.ts` - Add comparison types if needed

**New Files:**
- `viz/src/components/ComparisonPanel.tsx` - Slide-in panel with 5 inputs
- `viz/src/utils/curveMapper.ts` - Map PR-123 → GitHub URL

---

## Tasks

### Task 1: Create curve identifier mapper utility

**Files:**
- Create: `viz/src/utils/curveMapper.ts`

- [ ] **Step 1: Write the utility function**

```typescript
// viz/src/utils/curveMapper.ts
export interface CurveIdentifier {
  id: string
  url: string
}

export function mapCurveIdentifierToUrl(
  identifier: string,
  env: string,
  region: string,
  owner: string = 'VaibhavDesai',
  repo: string = 'Load-predictor'
): CurveIdentifier {
  const id = identifier.trim().toLowerCase()
  let url: string

  if (id === 'main') {
    url = `https://raw.githubusercontent.com/${owner}/${repo}/main/data/curves/${env}_${region}.json`
  } else if (id.match(/^pr-\d+$/)) {
    const prNumber = id.split('-')[1]
    url = `https://raw.githubusercontent.com/${owner}/${repo}/refs/pull/${prNumber}/head/data/curves/${env}_${region}.json`
  } else {
    throw new Error(`Invalid curve identifier: ${identifier}. Use 'main' or 'PR-123'`)
  }

  return { id, url }
}

export function validateCurveIdentifier(identifier: string): boolean {
  const id = identifier.trim().toLowerCase()
  return id === 'main' || /^pr-\d+$/.test(id)
}
```

- [ ] **Step 2: Verify utility works**

Create a quick test in your editor or terminal:
```bash
node -e "
const mapper = require('./viz/src/utils/curveMapper.ts');
console.log(mapper.mapCurveIdentifierToUrl('main', 'cprod', 'amer'));
console.log(mapper.mapCurveIdentifierToUrl('PR-123', 'cprod', 'amer'));
"
```

Expected output: Two URLs, one with `/main/` and one with `/refs/pull/123/head/`

- [ ] **Step 3: Commit**

```bash
cd /Users/vaibhavdesai/workspace/load-predictor-v2
git add viz/src/utils/curveMapper.ts
git commit -m "feat: add curve identifier to URL mapper utility"
```

---

### Task 2: Create ComparisonPanel component

**Files:**
- Create: `viz/src/components/ComparisonPanel.tsx`

- [ ] **Step 1: Write the component**

```typescript
// viz/src/components/ComparisonPanel.tsx
import React, { useState, useEffect } from 'react'

interface ComparisonPanelProps {
  isOpen: boolean
  onClose: () => void
  curves: string[]
  onCurvesChange: (curves: string[]) => void
  isLoading: boolean
  error: string | null
  onCompare: (curves: string[]) => Promise<void>
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  isOpen,
  onClose,
  curves,
  onCurvesChange,
  isLoading,
  error,
  onCompare,
}) => {
  const [localCurves, setLocalCurves] = useState(curves)

  useEffect(() => {
    setLocalCurves(curves)
  }, [curves])

  const handleInputChange = (index: number, value: string) => {
    const newCurves = [...localCurves]
    newCurves[index] = value.trim().toLowerCase()
    setLocalCurves(newCurves)
  }

  const handleClear = (index: number) => {
    const newCurves = [...localCurves]
    newCurves[index] = ''
    setLocalCurves(newCurves)
  }

  const handleDone = async () => {
    const filledCurves = localCurves.filter((c) => c.length > 0)
    if (filledCurves.length < 2) {
      return
    }
    await onCompare(localCurves)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 998,
        }}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
          Compare Curves
        </h2>

        {/* Curve Input Fields */}
        <div style={{ flex: 1, marginBottom: '20px' }}>
          {localCurves.map((curve, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Curve {index + 1}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={curve}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={index === 0 ? 'main' : 'PR-123'}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                  disabled={isLoading}
                />
                {curve && (
                  <button
                    onClick={() => handleClear(index)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#f5f5f5',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              background: '#ffe6e6',
              border: '1px solid #ffcccc',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#c41e3a',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              padding: '12px',
              background: '#e6f3ff',
              border: '1px solid #cce6ff',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#0066cc',
              marginBottom: '16px',
            }}
          >
            Loading curves...
          </div>
        )}

        {/* Done Button */}
        <button
          onClick={handleDone}
          style={{
            padding: '10px 16px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
          disabled={isLoading}
        >
          Done
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add viz/src/components/ComparisonPanel.tsx
git commit -m "feat: create ComparisonPanel component with slide-in UI"
```

---

### Task 3: Update App.tsx state and URL handling

**Context:** This is the largest task. App.tsx will manage both single-curve and compare modes. Focus on:
- Adding compare mode state
- Parsing ?curves URL param
- Implementing parallel fetch
- Toggling between modes

**Files:**
- Modify: `viz/src/App.tsx`

- [ ] **Step 1: Add imports**

At the top of App.tsx, after existing imports, add:
```typescript
import { ComparisonPanel } from './components/ComparisonPanel'
import { mapCurveIdentifierToUrl } from './utils/curveMapper'
```

- [ ] **Step 2: Add new state variables**

After existing useState declarations, add:
```typescript
const [compareCurves, setCompareCurves] = useState<CurveData[]>([])
const [comparisonPanelOpen, setComparisonPanelOpen] = useState(false)
const [comparisonCurveIds, setComparisonCurveIds] = useState<string[]>(['main'])
const [comparisonError, setComparisonError] = useState<string>('')
const [comparisonLoading, setComparisonLoading] = useState(false)
```

- [ ] **Step 3: Add loadComparisonCurves function**

Add this inside the App component body:
```typescript
const loadComparisonCurves = async (curveIds: string[]) => {
  const filledIds = curveIds.filter((id) => id.length > 0)

  if (filledIds.length < 2) {
    setComparisonError('Add at least 2 curves to compare')
    return
  }

  setComparisonLoading(true)
  setComparisonError('')

  try {
    if (!curveData) {
      throw new Error('Load a single curve first')
    }

    const env = curveData.meta.env
    const region = curveData.meta.region

    const urls = filledIds.map((id) => {
      const mapped = mapCurveIdentifierToUrl(id, env, region)
      return { id: mapped.id, url: mapped.url }
    })

    const fetchPromises = urls.map((u) => 
      fetchCurveFromUrl(u.url).catch((err) => {
        throw new Error(`Failed to load ${u.id}: ${err.message}`)
      })
    )

    const curves = await Promise.all(fetchPromises)
    setCompareCurves(curves)
    setMode('compare')
    setComparisonPanelOpen(false)

    const curveParam = filledIds.join(',')
    window.history.replaceState(null, '', `?curves=${curveParam}`)
  } catch (err) {
    setComparisonError(err instanceof Error ? err.message : 'Unknown error')
  } finally {
    setComparisonLoading(false)
  }
}
```

- [ ] **Step 4: Update useEffect to handle ?curves param**

Replace the entire useEffect hook with:
```typescript
useEffect(() => {
  const loadCurvesFromUrl = async () => {
    const params = new URLSearchParams(window.location.search)
    const curveUrl = params.get('curve')
    const curvesParam = params.get('curves')

    try {
      setLoading(true)
      setError('')

      if (curvesParam) {
        const ids = curvesParam.split(',')
        setComparisonCurveIds(ids)

        if (!curveData) {
          const mainUrl =
            'https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json'
          const data = await fetchCurveFromUrl(mainUrl)
          setCurveData(data)
        }

        await loadComparisonCurves(ids)
      } else if (curveUrl) {
        setMode('single')
        const data = await fetchCurveFromUrl(curveUrl)
        setCurveData(data)
        setSourceUrl(curveUrl)
      } else {
        setMode('single')
        const defaultUrl =
          'https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json'
        try {
          const data = await fetchCurveFromUrl(defaultUrl)
          setCurveData(data)
          setSourceUrl(defaultUrl)
        } catch (err) {
          setCurveData(null)
        }
      }
    } catch (err) {
      setError(
        `Failed to load curve: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
      setCurveData(null)
      setCompareCurves([])
    } finally {
      setLoading(false)
    }
  }

  loadCurvesFromUrl()
}, [])
```

- [ ] **Step 5: Update JSX - controls section**

Replace the `<div className="controls">` section with:
```typescript
<div className="controls">
  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
    <div className="tab-container">
      <button
        className={`tab ${mode === 'single' ? 'active' : ''}`}
        onClick={() => {
          setMode('single')
          window.history.replaceState(null, '', window.location.pathname)
        }}
      >
        Single Curve
      </button>
      {mode === 'compare' && (
        <button
          className={`tab ${mode === 'compare' ? 'active' : ''}`}
          onClick={() => {}}
          style={{ cursor: 'default' }}
        >
          Compare ({compareCurves.length})
        </button>
      )}
    </div>
    {mode === 'single' && (
      <button
        onClick={() => setComparisonPanelOpen(true)}
        style={{
          padding: '8px 16px',
          background: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Compare
      </button>
    )}
  </div>

  {error && <div className="error">{error}</div>}
  {loading && <div className="loading">Loading curve from GitHub...</div>}
</div>

<ComparisonPanel
  isOpen={comparisonPanelOpen}
  onClose={() => setComparisonPanelOpen(false)}
  curves={comparisonCurveIds}
  onCurvesChange={setComparisonCurveIds}
  isLoading={comparisonLoading}
  error={comparisonError}
  onCompare={loadComparisonCurves}
/>
```

- [ ] **Step 6: Update JSX - content sections**

Replace the single curve content section (after controls):
```typescript
{mode === 'single' && curveData && (
  <>
    {sourceUrl && (
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
        📊 {curveData.meta.env.toUpperCase()}_{curveData.meta.region.toUpperCase()}{' '}
        {getSourceDisplay(sourceUrl)}
      </div>
    )}
    <MetadataPanel data={curveData} />
    <div style={{ marginBottom: '24px' }}>
      <CurveChart data={curveData} />
    </div>
    <Heatmap data={curveData} />
  </>
)}

{mode === 'compare' && compareCurves.length > 0 && curveData && (
  <>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
      📊 Comparing {compareCurves.length} curves
    </div>
    <MetadataPanel data={curveData} title="Primary Curve" isComparison={true} />
    <div style={{ marginBottom: '24px' }}>
      <CurveChart data={compareCurves} isComparison={true} />
    </div>
  </>
)}
```

- [ ] **Step 7: Commit**

```bash
git add viz/src/App.tsx
git commit -m "feat: add compare mode state and URL handling to App.tsx"
```

---

### Task 4: Update CurveChart to handle multiple curves

**Files:**
- Modify: `viz/src/components/CurveChart.tsx`

- [ ] **Step 1: Update interface**

Change:
```typescript
interface CurveChartProps {
  data: CurveData
  title?: string
}
```

To:
```typescript
interface CurveChartProps {
  data: CurveData | CurveData[]
  title?: string
  isComparison?: boolean
}
```

- [ ] **Step 2: Update useMemo for array handling**

Replace the entire useMemo hook:
```typescript
const { traces, yMin, yMax } = useMemo(() => {
  const traces: any[] = []
  let globalYMin = Infinity
  let globalYMax = -Infinity

  const curveArray = Array.isArray(data) ? data : [data]
  const intervalSeconds = (Array.isArray(data) ? data[0] : data).meta.aggregation_interval || 1800
  const intervalMinutes = intervalSeconds / 60

  curveArray.forEach((curveData, curveIndex) => {
    Object.entries(curveData.curves).forEach(([weekdayStr, slots], dayIndex) => {
      const weekday = parseInt(weekdayStr)
      const dayName = WEEKDAY_NAMES[weekday - 1]
      const x: number[] = []
      const y: number[] = []
      const customData: string[] = []

      const sortedSlots = Object.entries(slots).sort(
        ([a], [b]) => parseInt(a) - parseInt(b)
      )

      sortedSlots.forEach(([slotStr, value]) => {
        const slot = parseInt(slotStr)
        const minuteOfDay = slot * intervalMinutes
        const hour = Math.floor(minuteOfDay / 60)
        const minute = minuteOfDay % 60
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

        x.push(slot)
        y.push(value as number)

        const curveLabel =
          curveArray.length > 1
            ? `${curveData.meta.env.toUpperCase()}_${curveData.meta.region.toUpperCase()}`
            : dayName
        customData.push(
          curveArray.length > 1 ? `${curveLabel} ${dayName} ${timeStr}` : `${dayName} ${timeStr}`
        )

        globalYMin = Math.min(globalYMin, value as number)
        globalYMax = Math.max(globalYMax, value as number)
      })

      let color: string
      if (curveArray.length > 1) {
        color = COLORS[curveIndex % COLORS.length]
      } else {
        color = COLORS[dayIndex % COLORS.length]
      }

      traces.push({
        x,
        y,
        customdata: customData,
        name:
          curveArray.length > 1
            ? `${curveData.meta.env.toUpperCase()}_${curveData.meta.region.toUpperCase()}`
            : dayName,
        type: 'scatter',
        mode: 'lines',
        line: {
          color: color,
          width: 2.5,
        },
        fill: 'tozeroy',
        fillcolor: color + '1a',
        hovertemplate:
          `<b>%{customdata}</b><br>` + 'Load: %{y:,.0f}<br>' + '<extra></extra>',
        visible: true,
      })
    })
  })

  const padding = (globalYMax - globalYMin) * 0.1
  return {
    traces,
    yMin: Math.max(0, globalYMin - padding),
    yMax: globalYMax + padding,
  }
}, [data])
```

- [ ] **Step 3: Commit**

```bash
git add viz/src/components/CurveChart.tsx
git commit -m "feat: update CurveChart to overlay multiple curves"
```

---

### Task 5: Update MetadataPanel for comparison mode

**Files:**
- Modify: `viz/src/components/MetadataPanel.tsx`

- [ ] **Step 1: Add isComparison prop**

Update interface:
```typescript
interface MetadataPanelProps {
  data: CurveData
  title?: string
  isComparison?: boolean
}
```

- [ ] **Step 2: Wrap capacity planning with condition**

Find the "Capacity Planning" section heading and wrap it with:
```typescript
{!isComparison && (
  <div>
    <h3 style={{ ... }}>Capacity Planning</h3>
    {/* rest of capacity planning section */}
  </div>
)}
```

- [ ] **Step 3: Add comparison info before capacity planning**

Add before the capacity planning section:
```typescript
{isComparison && (
  <div style={{ marginBottom: '32px' }}>
    <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Comparison Info
    </h3>
    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
      Showing stats for primary curve. Toggle legend items in chart to compare patterns.
    </p>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add viz/src/components/MetadataPanel.tsx
git commit -m "feat: update MetadataPanel for comparison mode"
```

---

### Task 6: Integration test and build

**Files:**
- Build and test (no file changes, verification only)

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/vaibhavdesai/workspace/load-predictor-v2/viz
npm install
```

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:5173

- [ ] **Step 3: Manual test - Load default single curve**

- Open http://localhost:5173
- Should load cprod_AMER curve
- Verify chart renders, heatmap shows below

- [ ] **Step 4: Manual test - Click + Compare button**

- Click "+ Compare" button
- Slide-in panel should appear on right
- Curve 1 field should be pre-filled with "main"
- Fields 2-5 should be empty

- [ ] **Step 5: Manual test - Add PR curve**

- In Curve 2 field, type `PR-123`
- Click "Done"
- Should show loading spinner
- Will fail to load (PR doesn't exist in mock data), but error should display gracefully

- [ ] **Step 6: Manual test - URL state**

- After error, go back to single curve view
- Copy URL from browser (should be clean)
- Click + Compare again, try with valid test data
- Verify URL updates to `?curves=main,PR-123` format

- [ ] **Step 7: Build for production**

```bash
npm run build
```

Expected: `✓ built in Xs` with no errors, dist/ folder created

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete multi-curve comparison implementation with testing"
git push
```

---

## Execution

I'll now dispatch subagents for each task sequentially. Starting with Task 1.

---

**Ready to execute. Dispatching Task 1 implementer subagent now.**