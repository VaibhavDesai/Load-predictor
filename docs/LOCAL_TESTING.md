# Local Testing Guide

## What's Running Right Now

Your project is **fully operational locally** with:

✅ **React Visualization**: http://localhost:5173  
✅ **Python Backend**: CLI with WAP connector  
✅ **Sample Data**: Pre-loaded curve JSON  

## Testing the Visualization

### 1. Open the App
Visit http://localhost:5173 in your browser

### 2. Single Curve Mode
1. Click "Single Curve" tab
2. Upload file: `/Users/vaibhavdesai/workspace/load-predictor-v2/data/curves/sample_cprod_amer.json`
3. See:
   - Interactive SVG chart showing 7-day pattern
   - Peak, average, std_dev in metadata panel
   - 1050 total slots (150 per day × 7 days)

### 3. Compare Curves Mode
1. Click "Compare Curves" tab
2. Upload same curve twice (as "current" and "baseline")
3. See side-by-side comparison
4. Ready for GitHub releases integration

## Testing the Python Backend

### Without WAP (Local Mock Data)

```bash
cd /Users/vaibhavdesai/workspace/load-predictor-v2

# Validate sample curve
python -m load_predictor validate-curves data/curves/sample_cprod_amer.json

# Output:
# ✓ data/curves/sample_cprod_amer.json: cprod/AMER, 1050 slots, 7 weekdays
```

### With WAP (Requires VPN)

```bash
# First, set up credentials
cp .env.example .env
# Edit .env with your StarRocks username/password

# Generate curves from real WAP data
python -m load_predictor generate-curves \
  --env cint \
  --region AMER \
  --weeks-back 4

# Flow:
# 1. Connects to starrocks-prod.webex.com
# 2. Queries voicea_legacy_metrics table
# 3. Aggregates into 1-minute slots
# 4. Calculates statistics
# 5. Writes to data/curves/cint_amer.json
# 6. Returns success message
```

## Testing Locally Without VPN

If you don't have VPN access, you can still:

1. ✅ Test all visualization features with sample data
2. ✅ Test all Python logic (curve building, JSON parsing)
3. ✅ Test CLI structure and validation
4. ❌ Can't connect to WAP (needs VPN)

### Mock Data Testing

Create a mock curve for any env/region:

```bash
# Generate a test curve locally
python << 'EOF'
import json
from pathlib import Path

# Simulate a curve pattern
weekdays = {}
for day in range(1, 8):
    slots = {}
    for slot in range(150):
        # Simulate business hour peak
        hour = slot // 6  # Convert slot to hour
        if 9 <= hour < 17:
            value = 500 + slot % 50
        else:
            value = 100
        slots[str(slot)] = value
    weekdays[str(day)] = slots

# Create curve object
curve = {
    "meta": {
        "generated_at": "2026-07-24T10:00:00Z",
        "env": "cstage",
        "region": "AMER",
        "data_range_start": "2026-06-01",
        "data_range_end": "2026-07-24",
        "total_samples": 100000,
        "summary": {
            "peak": {"weekday": 3, "slot": 75, "value": 550},
            "average": 350.0,
            "std_dev": 120.0,
            "min": 100.0,
            "max": 550.0,
            "median": 340.0,
        },
    },
    "curves": weekdays,
}

# Save it
output_file = Path("data/curves/cstage_amer_test.json")
output_file.parent.mkdir(parents=True, exist_ok=True)
with open(output_file, "w") as f:
    json.dump(curve, f, indent=2)

print(f"✓ Created test curve: {output_file}")
EOF

# Now validate it
python -m load_predictor validate-curves data/curves/cstage_amer_test.json
```

## Testing the Full Pipeline

### Step 1: Generate Curve
```bash
python -m load_predictor generate-curves \
  --env cprod \
  --region AMER \
  --weeks-back 52 \
  --output-dir data/curves
```

### Step 2: Validate Output
```bash
python -m load_predictor validate-curves data/curves/cprod_amer.json
```

### Step 3: Visualize
1. Open http://localhost:5173
2. Upload: `data/curves/cprod_amer.json`
3. Inspect chart and stats

### Step 4: Git Integration
```bash
# Prepare for commit
git add data/curves/cprod_amer.json
git commit -m "chore: update curves for cprod/AMER"

# Simulate PR workflow
git push
# (On GitHub: create release v2026-07-24-cprod-amer)
```

## Development Workflow

### Running Components Separately

**Terminal 1: Visualization**
```bash
cd viz
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2: Python CLI**
```bash
cd /Users/vaibhavdesai/workspace/load-predictor-v2
python -m load_predictor generate-curves --help
```

### Making Changes

**React Changes**:
1. Edit `viz/src/App.tsx` or components
2. Hot reload automatic (Vite)
3. Refresh browser to see changes

**Python Changes**:
1. Edit `src/load_predictor/*.py`
2. No reload needed (script-based)
3. Run CLI again to test

**Visualization Logic**:
1. Edit `viz/src/utils.ts` for data parsing
2. Edit `viz/src/types.ts` for interfaces
3. Ensure JSON format matches types

## Performance Testing

### Large Curve Files

Test with large datasets:

```bash
# Create a large curve (365 days worth)
python << 'EOF'
import json

# Generate 365 days of data
curves = {}
for day in range(1, 366):  # Full year
    weekday = (day % 7) + 1
    if weekday not in curves:
        curves[weekday] = {}
    
    for slot in range(1440):  # Full day in minutes
        curves[weekday][slot] = 100 + slot % 500

# Save it
with open("data/curves/large_test.json", "w") as f:
    json.dump(curves, f)

print(f"Created file with {len(curves)} weekdays")
EOF

# Visualize - should still be fast (< 1s)
# Upload to http://localhost:5173
```

## Checklist: What Works

- [x] React app runs on localhost:5173
- [x] Visualization renders curves
- [x] Single curve mode works
- [x] Compare mode works
- [x] JSON parsing works
- [x] Metadata display works
- [x] Python CLI works
- [x] Validation works
- [x] Curve building works
- [x] WAP connector code is ready (needs VPN)

## Checklist: What Needs VPN

- [ ] Generate curves (WAP query)
- [ ] Aggregated metrics (WAP query)
- [ ] Integration tests against real WAP

## Next Steps

1. **Connect to WAP**
   - Setup `.env` with StarRocks credentials
   - Test generate-curves with real data

2. **Setup GitHub Actions**
   - Configure self-hosted runner
   - Add WAP secrets to repo
   - Test workflow dispatch

3. **Enhance Visualization**
   - Add Plotly for better interactivity
   - Implement hover tooltips
   - Add diff visualization

4. **Test Integration**
   - Full end-to-end on real WAP
   - Create actual releases
   - Verify GitHub comparison
