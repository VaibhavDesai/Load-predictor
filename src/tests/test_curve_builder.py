import pytest
import pandas as pd
from datetime import datetime, timedelta
from src.load_predictor.curve_builder import CurveBuilder


@pytest.fixture
def sample_data():
    """Generate sample timeseries data for testing"""
    data = []
    base_time = datetime(2026, 7, 1, 9, 0)  # 9 AM Wednesday

    for day in range(7):
        for hour in range(24):
            for minute in range(0, 60, 15):  # Every 15 minutes
                ts = base_time + timedelta(days=day, hours=hour, minutes=minute)
                # Simulate higher traffic during business hours
                count = 100 if 9 <= hour < 17 else 20
                data.append({"timestamp": ts, "count": count})

    return pd.DataFrame(data)


def test_curve_builder_initialization():
    builder = CurveBuilder()
    assert builder.curves_by_weekday == {}


def test_process_timeseries_mean(sample_data):
    builder = CurveBuilder()
    curves = builder.process_timeseries(sample_data, aggregate_by="mean")

    # Should have 7 weekdays
    assert len(curves) == 7

    # Each weekday should have slots (1-1440)
    for weekday, slots in curves.items():
        assert isinstance(weekday, int)
        assert 1 <= weekday <= 7
        assert len(slots) > 0
        assert all(isinstance(v, float) for v in slots.values())


def test_process_timeseries_sum(sample_data):
    builder = CurveBuilder()
    curves = builder.process_timeseries(sample_data, aggregate_by="sum")

    # Sum aggregation should produce higher values than mean
    curves_mean = builder.process_timeseries(sample_data, aggregate_by="mean")

    for weekday in curves:
        sum_val = curves[weekday].get(540, 0)  # Noon slot
        mean_val = curves_mean[weekday].get(540, 0)
        # Sum should be >= mean (accounting for multiple weeks)
        assert sum_val >= mean_val or (sum_val == 0 and mean_val == 0)


def test_get_statistics(sample_data):
    builder = CurveBuilder()
    curves = builder.process_timeseries(sample_data, aggregate_by="mean")
    stats = builder.get_statistics(curves)

    # Check structure
    assert "peak" in stats
    assert "average" in stats
    assert "std_dev" in stats
    assert "min" in stats
    assert "max" in stats
    assert "median" in stats

    # Check values make sense
    assert stats["peak"]["value"] >= stats["average"]
    assert stats["min"] <= stats["average"] <= stats["max"]
    assert stats["std_dev"] >= 0


def test_empty_dataframe():
    builder = CurveBuilder()
    empty_df = pd.DataFrame({"timestamp": [], "count": []})

    with pytest.raises(ValueError):
        builder.process_timeseries(empty_df)
