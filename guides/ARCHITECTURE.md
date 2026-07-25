# System Architecture

For full architecture documentation, see the repository README and source code.

## Overview

Load Predictor V2 is a modern load prediction system with:

- **Python Backend**: Curve generation and aggregation
- **React Frontend**: Interactive visualization
- **Mock Data**: Realistic demo patterns (default)
- **WAP Integration**: Optional production data source

## Components

- `src/load_predictor/` - Python backend
- `viz/` - React visualization app
- `docs/` - Built app (GitHub Pages)
- `data/curves/` - Generated curves

## Quick Start

```bash
# Install
pip install -e .
cd viz && npm install

# Run
npm run dev

# Generate curves
python -m load_predictor generate-curves --env cprod --region AMER
```

For more details, see README.md
