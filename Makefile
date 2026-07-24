.PHONY: help install dev test build viz-dev viz-build clean

help:
	@echo "Load Predictor V2 - Available commands:"
	@echo ""
	@echo "  make install      - Install Python package"
	@echo "  make dev          - Run Python CLI locally"
	@echo "  make test         - Run Python tests"
	@echo "  make build        - Build visualization"
	@echo "  make viz-dev      - Start visualization dev server"
	@echo "  make clean        - Clean build artifacts"
	@echo ""

install:
	pip install -e .

dev:
	python -m load_predictor --help

test:
	pytest src/tests -v

# Visualization targets
viz-dev:
	cd viz && npm install && npm run dev

viz-build:
	cd viz && npm install && npm run build

viz-clean:
	rm -rf viz/dist viz/node_modules

clean: viz-clean
	rm -rf build dist *.egg-info __pycache__ .pytest_cache
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
