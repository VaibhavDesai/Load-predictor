# Load Predictor V2

A modern load prediction system with interactive visualization and curve generation.

**🎯 Key Features:**
- ✅ **Interactive React UI** - Visualize and compare meeting curves
- ✅ **Mock Data Mode** - Full functionality without credentials
- ✅ **Real Data Support** - Connect to WAP/Iceberg tables (optional)
- ✅ **GitHub Pages** - Deploy visualization automatically
- ✅ **GitHub Actions** - Automated curve generation workflow

---

## 🚀 Quick Start (Demo Mode - No Setup Needed!)

### View the Visualization Locally

```bash
# Clone
git clone https://github.com/VaibhavDesai/Load-predictor.git
cd Load-predictor

# Setup
pip install -e .
cd viz && npm install

# Run
npm run dev
```

Open http://localhost:5173 and upload a sample curve JSON file.

### Generate Mock Curves

```bash
# Generate curves (uses realistic mock data)
python -m load_predictor generate-curves --env cprod --region AMER

# Validate
python -m load_predictor validate-curves data/curves/cprod_amer.json

# Visualize
# Upload data/curves/cprod_amer.json to http://localhost:5173
```

---

## 🔐 Demo Features (Public - No Credentials)

✅ **Mock Data Generation**
- Realistic meeting patterns
- Different by environment/region
- Business hour patterns
- Weekend variations

✅ **Interactive UI**
- Single curve viewer
- Comparison mode (2 curves)
- Metadata display
- SVG charts with zoom/pan

✅ **GitHub Pages Deployment**
- Visualizations auto-deploy
- Always accessible online

---

## 🏭 Production Setup (Requires Access)

To use real data from WAP/Iceberg tables:

### Prerequisites

- Python 3.10+
- VPN access to WAP
- StarRocks credentials

### Configuration

```bash
# Copy config
cp .env.public .env

# Edit with your credentials
export LP_CONNECTOR_MODE=wap
export LP_WAP_USERNAME=your_username
export LP_WAP_PASSWORD=your_password
```

### Generate Real Curves

```bash
python -m load_predictor generate-curves \
  --env cprod \
  --region AMER \
  --weeks-back 52
```

---

## 📊 Visualization Modes

### Single Curve View
- Upload or paste JSON
- See interactive chart
- View statistics (peak, avg, std_dev, etc.)
- Export chart (coming soon)

### Compare Mode
- Load two curves
- Side-by-side comparison
- Highlight differences
- Statistical comparison

---

## 🔄 Workflow: Generate → Review → Deploy

```
1. Trigger GitHub Actions workflow
   ↓
2. Generate curves (mock or WAP data)
   ↓
3. Build React visualization
   ↓
4. Create PR with visualization artifact
   ↓
5. Review in interactive UI
   ↓
6. Approve and merge
   ↓
7. Auto-deploy to GitHub Pages
```

---

## 📚 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and data flow
- [LOCAL_TESTING.md](docs/LOCAL_TESTING.md) - Testing examples
- [WAP_SETUP.md](docs/WAP_SETUP.md) - Production setup (WAP connection)
- [IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Implementation details

---

## 🛠️ Development

```bash
# Install
pip install -e .

# Run tests
pytest

# Visualization dev server
cd viz && npm run dev

# Generate curves (mock)
export LP_CONNECTOR_MODE=mock
python -m load_predictor generate-curves --env cprod --region AMER

# Build for production
cd viz && npm run build
```

---

## 🌐 GitHub Pages

Your visualization is deployed at:
```
https://VaibhavDesai.github.io/Load-predictor/
```

Auto-updated when new curves are generated.

---

## 📝 Configuration

### Mock Mode (Demo - Default)
```env
LP_CONNECTOR_MODE=mock
LP_MOCK_SEED=42
LP_MOCK_WEEKS_BACK=52
```

### Production Mode (WAP)
```env
LP_CONNECTOR_MODE=wap
LP_WAP_HOST=starrocks-prod.webex.com
LP_WAP_PORT=9030
LP_WAP_USERNAME=your_username
LP_WAP_PASSWORD=your_password
```

---

## 🚀 Deploy Your Own

### 1. Fork this repo

### 2. Enable GitHub Pages
- Settings → Pages
- Source: Deploy from branch
- Branch: `main`
- Folder: `/docs`

### 3. Generate curves
```bash
python -m load_predictor generate-curves --env cprod --region AMER
git add data/curves/ docs/
git commit -m "chore: update curves"
git push
```

### 4. View visualization
```
https://YOUR_USERNAME.github.io/Load-predictor/
```

---

## 🤝 Contributing

PRs welcome! This is designed to be:
- **Easy to test** (mock mode)
- **Easy to extend** (modular design)
- **Easy to deploy** (GitHub Pages)

---

## 📄 License

MIT License - Free to use and modify

---

## 🆘 Troubleshooting

**React app shows blank screen?**
```bash
cd viz && npm install && npm run dev
```

**Mock data not generating?**
```bash
export LP_CONNECTOR_MODE=mock
python -m load_predictor generate-curves --env cint --region AMER
```

**Need help?**
Check [docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md) for examples and debugging.

---

**Ready to get started? Start with the Quick Start section above!** 🚀
