"""
Build meeting prediction curves from timeseries data.
Aggregates meetings into 1-minute slots per day of week.
"""

from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd


class CurveBuilder:
    """Generate normalized meeting curves from raw data"""

    # 7 days × 24 hours × 60 minutes = 1440 slots per day
    # But we use aggregated slots, typically ~48 per hour for 1-minute buckets
    MINUTES_PER_SLOT = 1
    SLOTS_PER_DAY = 24 * 60

    def __init__(self):
        self.curves_by_weekday: Dict[int, Dict[int, float]] = {}

    def process_timeseries(
        self,
        df: pd.DataFrame,
        aggregate_by: str = "mean",
        interval_seconds: int = 1800,
    ) -> Dict[int, Dict[int, float]]:
        """
        Convert timeseries data into aggregated curve.

        Args:
            df: DataFrame with columns [timestamp, count]
            aggregate_by: 'mean' or 'sum' for aggregation across weeks
            interval_seconds: Time bucket size in seconds (default 1800 = 30min)

        Returns:
            Curve dict: {weekday: {slot: value, ...}, ...}
            Where slot is the interval bucket number (0-47 for 30min intervals)
        """
        if df.empty:
            raise ValueError("Input dataframe is empty")

        # Add helper columns
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["weekday"] = df["timestamp"].dt.isocalendar().day  # 1=Monday, 7=Sunday
        df["minute_of_day"] = df["timestamp"].dt.hour * 60 + df["timestamp"].dt.minute

        # Calculate which bucket each minute falls into based on interval
        interval_minutes = interval_seconds // 60
        df["slot"] = df["minute_of_day"] // interval_minutes

        # Group by weekday and interval slot
        grouped = df.groupby(["weekday", "slot"])["count"]

        if aggregate_by == "mean":
            slots_by_weekday = grouped.mean()
        elif aggregate_by == "sum":
            slots_by_weekday = grouped.sum()
        else:
            raise ValueError(f"Unknown aggregation: {aggregate_by}")

        # Convert to nested dict structure
        curves = {}
        for (weekday, slot), value in slots_by_weekday.items():
            if weekday not in curves:
                curves[weekday] = {}
            curves[weekday][int(slot)] = round(float(value), 2)

        return curves

    def get_statistics(self, curves: Dict[int, Dict[int, float]]) -> dict:
        """Calculate summary statistics for the curve"""
        all_values = []
        peak_value = 0
        peak_info = {}

        for weekday, slots in curves.items():
            for slot, value in slots.items():
                all_values.append(value)
                if value > peak_value:
                    peak_value = value
                    peak_info = {
                        "weekday": weekday,
                        "slot": slot,
                        "value": value,
                    }

        values_array = pd.Series(all_values)

        return {
            "peak": peak_info,
            "average": round(float(values_array.mean()), 2),
            "std_dev": round(float(values_array.std()), 2),
            "min": round(float(values_array.min()), 2),
            "max": round(float(values_array.max()), 2),
            "median": round(float(values_array.median()), 2),
        }
