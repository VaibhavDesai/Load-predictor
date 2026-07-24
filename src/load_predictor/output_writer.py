"""
Write curve JSON files and metadata for version control and visualization.
"""

import json
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
import hashlib


class OutputWriter:
    """Write curves and metadata to disk in standardized format"""

    def __init__(self, output_dir: str = "data/curves"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def write_curve(
        self,
        curve: Dict[int, Dict[int, float]],
        env: str,
        region: str,
        metadata: Optional[Dict] = None,
    ) -> Path:
        """
        Write curve to JSON file with enhanced metadata.

        Args:
            curve: Curve dict {weekday: {slot: value}}
            env: Environment (cprod, cstage, etc)
            region: Region (AMER, EMEAR, APAC)
            metadata: Additional metadata

        Returns:
            Path to written file
        """
        if metadata is None:
            metadata = {}

        filename = f"{env}_{region.lower()}.json"
        filepath = self.output_dir / filename

        # Build output with metadata
        output = {
            "meta": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "env": env,
                "region": region,
                "data_range_start": metadata.get("data_range_start"),
                "data_range_end": metadata.get("data_range_end"),
                "total_samples": metadata.get("total_samples", 0),
                "summary": metadata.get("summary", {}),
            },
            "curves": curve,
        }

        # Write JSON
        with open(filepath, "w") as f:
            json.dump(output, f, indent=2)

        return filepath

    def compute_file_hash(self, filepath: Path) -> str:
        """Compute SHA256 hash of file for change detection"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def write_comparison_metadata(
        self,
        current_file: Path,
        previous_file: Optional[Path],
        output_path: Optional[Path] = None,
    ) -> dict:
        """
        Generate comparison metadata between curves.

        Useful for PR review to show what changed.
        """
        if output_path is None:
            output_path = self.output_dir / "comparison.json"

        current_hash = self.compute_file_hash(current_file)
        previous_hash = None

        if previous_file and previous_file.exists():
            previous_hash = self.compute_file_hash(previous_file)

        comparison = {
            "current_file": str(current_file),
            "current_hash": current_hash,
            "previous_file": str(previous_file) if previous_file else None,
            "previous_hash": previous_hash,
            "changed": current_hash != previous_hash if previous_hash else True,
            "comparison_timestamp": datetime.utcnow().isoformat() + "Z",
        }

        with open(output_path, "w") as f:
            json.dump(comparison, f, indent=2)

        return comparison
