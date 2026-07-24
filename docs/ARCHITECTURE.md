# Load Predictor V2 - Architecture

## Overview

Load Predictor V2 is a complete redesign of the curve generation system. It replaces Postgres with WAP (Iceberg tables) and provides an interactive visualization system for reviewing and comparing curves.

### Key Design Principles

1. **Local-first**: Can query WAP only from local environment with VPN
2. **GitHub as source of truth**: Curves versioned in git, released for historical tracking
3. **Simple visualization**: Interactive web UI for inspection and comparison
4. **No external dependencies**: No database, no S3 required (optional for distribution)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
├─────────────────────────────────────────────────────────────┤
│  curves/           - Current curve files                     │
│  archive/          - Historical curves (optional)            │
│  Releases          - Versioned releases                      │
└─────────────────────────────────────────────────────────────┘

        ↓ (Manual trigger via workflow_dispatch)

┌─────────────────────────────────────────────────────────────┐
│         GitHub Actions (self-hosted runner)                  │
├─────────────────────────────────────────────────────────────┤
│  1. Query WAP (Iceberg)  ──→ Raw timeseries data            │
│  2. Build curves        ──→ JSON aggregation                │
│  3. Validate            ──→ Check structure/quality         │
│  4. Create PR           ──→ For manual review               │
│  5. (On merge) Release  ──→ Tag + artifact                  │
└─────────────────────────────────────────────────────────────┘

        ↓ (Developer reviews)

┌─────────────────────────────────────────────────────────────┐
│           Visualization App (React + Plotly)                 │
├─────────────────────────────────────────────────────────────┤
│  Single curve view:                                          │
│    - Interactive chart (zoom, pan, hover)                   │
│    - Metadata panel (stats, summary)                        │
│                                                              │
│  Compare mode:                                               │
│    - Side-by-side curves                                    │
│    - Load from: local files or GitHub releases              │
│    - Difference visualization                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Python Backend (`src/load_predictor/`)

#### `wap_connector.py`
- Connects to WAP (Iceberg) tables
- Queries meeting timeseries data filtered by env/region
- Returns pandas DataFrame with raw data
- Handles auth (VPN, service account, etc.)

#### `curve_builder.py`
- Aggregates raw timeseries into 1-minute slots per day-of-week
- Supports `mean` and `sum` aggregation strategies
- Calculates statistics (peak, average, std_dev, median)
- Returns nested dict: `{weekday: {slot: value}}`

#### `output_writer.py`
- Writes curves to JSON with enhanced metadata
- Computes file hashes for change detection
- Generates comparison metadata for PR reviews
- Produces standardized output format

#### `cli.py`
- Entry point: `python -m load_predictor generate-curves`
- Orchestrates: query → build → validate → write
- Validates curve structure before commit

### 2. React Visualization App (`viz/`)

#### Frontend Stack
- **React 18** - UI framework
- **Vite** - Build tool (fast dev server)
- **TypeScript** - Type safety
- **Custom SVG charts** - Plotly deferred for future

#### Components
- **App.tsx** - Main controller, mode switching (single/compare)
- **CurveChart.tsx** - Renders SVG chart with zoom capability
- **MetadataPanel.tsx** - Displays curve statistics and metadata
- **types.ts** - Shared TypeScript interfaces
- **utils.ts** - Parsing, scaling, GitHub API helpers

### 3. GitHub Actions Workflow

**Trigger**: Manual dispatch (`workflow_dispatch`)

**Steps**:
1. Setup Python environment
2. Install package
3. Query WAP and generate curves
4. Validate output
5. Create PR with visualization
6. (On merge) Create GitHub Release with curve artifact

**Secrets Required**:
- `WAP_ICEBERG_DATABASE`
- `WAP_ENDPOINT`
- `WAP_USERNAME`
- `WAP_PASSWORD`

---

## Data Flow

### Curve Generation

```
Developer triggers:
  python -m load_predictor generate-curves --env cprod --region AMER

    ↓

WAPConnector.query_meetings_data()
  • Query: SELECT * FROM wap.meetings WHERE env=cprod AND region=AMER
  • Returns: DataFrame[timestamp, count, ...]

    ↓

CurveBuilder.process_timeseries()
  • Extract: weekday, minute_of_day from timestamps
  • Group: BY (weekday, minute_of_day)
  • Aggregate: MEAN or SUM
  • Returns: {1: {0: 3.5, 1: 4.2, ...}, 2: {...}, ...}

    ↓

OutputWriter.write_curve()
  • Create: {meta: {...}, curves: {...}}
  • Write: data/curves/cprod_amer.json
  • Compute: SHA256 hash

    ↓

GitHub Actions:
  • Validates JSON structure
  • Creates PR with visualization
  • After merge: Creates Release tag
```

### Curve Visualization

```
User uploads/pastes JSON → Viz app parses → CurveChart renders → Interactive view

Local file compare:
  Load curve1.json + curve2.json → Side-by-side display

GitHub compare (future):
  Select release1 (v2026-07-23-cprod-amer) + release2 → Fetch via GitHub API → Compare
```

---

## JSON Format

### Input (from WAP)

```json
{
  "timestamp": "2026-07-23T10:15:00Z",
  "count": 5,
  "environment": "cprod",
  "region": "AMER"
}
```

### Output (Curve File)

```json
{
  "meta": {
    "generated_at": "2026-07-23T14:32:00Z",
    "env": "cprod",
    "region": "AMER",
    "data_range_start": "2026-06-01",
    "data_range_end": "2026-07-23",
    "total_samples": 1250000,
    "summary": {
      "peak": {"weekday": 5, "slot": 810, "value": 1250},
      "average": 450.5,
      "std_dev": 180.2,
      "min": 50.0,
      "max": 1250.0,
      "median": 425.0
    }
  },
  "curves": {
    "1": {"0": 3.5, "1": 4.2, ..., "1439": 2.1},
    "2": {...},
    ...
    "7": {...}
  }
}
```

**Notes**:
- `weekday`: 1=Monday, 7=Sunday (ISO 8601)
- `slot`: 0-1439 (minutes in a day)
- `curves[weekday][slot]`: Average (or sum) for that minute across all weeks

---

## Workflow: From Generation to Review

### Step 1: Generate (Manual Trigger)
Developer opens GitHub Actions → `generate-curves` workflow → Fills in env/region → Runs

### Step 2: Create PR
Workflow generates curves, commits to branch, opens PR with:
- Curve JSON
- Visualization linked (or embedded artifact)
- Summary stats

### Step 3: Review
Reviewer opens visualization → Inspects curve shape → Compares to previous (if available)

### Step 4: Merge
Approved → Merge to `main` → Workflow creates Release tag

### Step 5: Archive (Optional)
Keep `archive/YYYY-MM-DD/` directory with historical curves for long-term trends

---

## Local Development

### Python Backend

```bash
# Setup
pip install -e .

# Generate curves (locally with VPN)
python -m load_predictor generate-curves \
  --env cint \
  --region AMER \
  --weeks-back 4 \
  --output-dir data/curves

# Validate
python -m load_predictor validate-curves data/curves/*.json
```

### React Visualization

```bash
cd viz

# Install
npm install

# Dev server (hot reload)
npm run dev

# Build static HTML
npm run build

# Output: viz/dist/index.html (standalone)
```

### Manual Testing Flow

1. Generate test curve: `python -m load_predictor generate-curves ...`
2. Start viz dev server: `cd viz && npm run dev`
3. Upload `data/curves/cprod_amer.json`
4. Inspect chart interactively
5. Compare with previous curve

---

## Future Enhancements

- [ ] Plotly.js integration for better interactivity (zoom, pan, hover tooltips)
- [ ] GitHub API integration to fetch releases for historical comparison
- [ ] Diff visualization (show % change per slot)
- [ ] Anomaly detection (flag unusual slots)
- [ ] Export chart as PNG for reports
- [ ] Dark mode support
- [ ] Mobile responsive design
