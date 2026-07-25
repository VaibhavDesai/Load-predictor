"""
Mock data connector for demo/testing purposes.
Generates realistic meeting data without accessing real infrastructure.
Perfect for testing UI and functionality without credentials.
"""

from typing import Optional
from datetime import datetime, timedelta
import pandas as pd
from pydantic import BaseModel
import logging
import random

logger = logging.getLogger(__name__)


class MockConfig(BaseModel):
    """Configuration for mock connector"""
    seed: int = 42
    weeks_back: int = 52
    base_load: int = 500
    peak_hour: int = 13


class MockConnector:
    """Generate realistic mock meeting data for testing"""

    # Realistic patterns for different environments
    ENV_PATTERNS = {
        "cprod": {
            "AMER": {"base": 600, "peak": 1200, "variation": 0.15},
            "EMEAR": {"base": 400, "peak": 800, "variation": 0.12},
            "APAC": {"base": 350, "peak": 700, "variation": 0.18},
        },
        "cstage": {
            "AMER": {"base": 100, "peak": 250, "variation": 0.2},
        },
        "cint": {
            "AMER": {"base": 50, "peak": 150, "variation": 0.25},
        },
    }

    def __init__(self, config: MockConfig):
        self.config = config
        random.seed(config.seed)

    def query_meetings_data(
        self,
        env: str,
        region: str,
        weeks_back: int,
        include_test: bool = False,
    ) -> pd.DataFrame:
        """
        Generate realistic mock meeting data.

        Args:
            env: Environment (cprod, cstage, cint)
            region: Region (AMER, EMEAR, APAC)
            weeks_back: Number of weeks of historical data
            include_test: Include test meetings (ignored in mock)

        Returns:
            DataFrame with columns: [timestamp, count]
        """
        if env not in self.ENV_PATTERNS:
            raise ValueError(f"Unknown environment: {env}")

        if region not in self.ENV_PATTERNS[env]:
            raise ValueError(f"Unknown region {region} for environment {env}")

        pattern = self.ENV_PATTERNS[env][region]

        # Generate timestamps
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(weeks=weeks_back)

        data = []

        # Generate realistic patterns
        current_date = start_date
        while current_date < end_date:
            weekday = current_date.weekday()  # 0=Monday, 6=Sunday
            hour = current_date.hour

            # Lower traffic on weekends
            weekend_factor = 0.5 if weekday >= 5 else 1.0

            # Peak during business hours (9 AM - 5 PM)
            if 9 <= hour < 17:
                # Gaussian distribution around peak hour
                distance_from_peak = abs(hour - self.config.peak_hour)
                hour_factor = max(0.3, 1.0 - (distance_from_peak / 10.0))
            else:
                # Lower traffic outside business hours
                hour_factor = 0.2

            # Calculate base count
            base_count = (
                pattern["base"] * hour_factor * weekend_factor
            )

            # Add variation
            variation = random.gauss(0, pattern["variation"] * base_count)
            count = max(1, int(base_count + variation))

            data.append({
                "timestamp": current_date,
                "count": count,
            })

            # Move to next minute
            current_date += timedelta(minutes=1)

        logger.info(
            f"Generated {len(data)} mock data points for "
            f"{env}/{region}, {weeks_back} weeks back"
        )

        return pd.DataFrame(data)

    def query_aggregated_metrics(
        self,
        env: str,
        region: str,
    ) -> dict:
        """
        Return summary statistics about the mock data.

        Args:
            env: Environment
            region: Region

        Returns:
            Dict with keys: total_meetings, total_events, date_range
        """
        if env not in self.ENV_PATTERNS:
            raise ValueError(f"Unknown environment: {env}")

        if region not in self.ENV_PATTERNS[env]:
            raise ValueError(f"Unknown region {region} for environment {env}")

        pattern = self.ENV_PATTERNS[env][region]

        # Estimate metrics based on pattern
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(weeks=52)

        # Rough estimate: pattern["base"] meetings per minute
        # × 1440 minutes per day × 365 days
        estimated_total = pattern["base"] * 1440 * 365

        return {
            "total_meetings": estimated_total,
            "total_events": estimated_total,
            "date_start": start_date.isoformat(),
            "date_end": end_date.isoformat(),
        }
