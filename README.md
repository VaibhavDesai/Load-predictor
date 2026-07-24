# Load Predictor V2

A complete redesign of the load prediction system with:

- **WAP (Iceberg) datasource** instead of Postgres
- **GitHub as source of truth** for versioned curves
- **Interactive visualization** for curve inspection and comparison
- **Local-first architecture** (queryable via VPN)

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for visualization)
- VPN access to WAP

### Setup

```bash
# Clone and setup Python
git clone git@github.com:vaidesai_cisco/load-predictor.git
cd load-predictor
cp .env.example .env

# Edit .env with WAP credentials
nano .env

# Install Python package
pip install -e .
```

### Generate Curves

```bash
python -m load_predictor generate-curves \
  --env cprod \
  --region AMER \
  --weeks-back 52
```

### Visualize Locally

```bash
cd viz
npm install
npm run dev
```

Then upload or paste the generated JSON file.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [CLI Commands](docs/CLI.md) - Command reference
- [Visualization Guide](docs/VIZ.md) - UI features and usage

## Development

```bash
make install      # Install dependencies
make viz-dev      # Start viz dev server
make test         # Run tests
make clean        # Clean build artifacts
```

## Deployment

Curves are generated via GitHub Actions workflow:

1. Open Actions → `generate-curves`
2. Fill in env/region
3. Workflow creates PR with visualization
4. Approve and merge
5. Release is automatically created

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for complete system design.

## License

Internal use only
