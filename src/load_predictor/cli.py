"""
Command-line interface for load predictor.
Supports both real WAP data and mock data for testing.
"""

import click
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from .config import settings
from .curve_builder import CurveBuilder
from .output_writer import OutputWriter
from .mock_connector import MockConnector, MockConfig


@click.group()
def cli():
    """Load predictor - generate and manage meeting curves"""
    pass


@cli.command()
@click.option(
    "--env",
    type=click.Choice(["cprod", "cstage", "cint"]),
    default="cprod",
    help="Environment",
)
@click.option(
    "--region",
    type=click.Choice(["AMER", "EMEAR", "APAC"]),
    default="AMER",
    help="Region",
)
@click.option(
    "--start-date",
    type=str,
    default=None,
    help="Start date (ISO format: YYYY-MM-DD). Defaults to 52 weeks ago.",
)
@click.option(
    "--end-date",
    type=str,
    default=None,
    help="End date (ISO format: YYYY-MM-DD). Defaults to today.",
)
@click.option(
    "--interval",
    type=int,
    default=1800,
    help="Aggregation interval in seconds (default 1800 = 30min)",
)
@click.option(
    "--aggregation",
    type=click.Choice(["mean", "sum"]),
    default="mean",
    help="Aggregation method",
)
@click.option(
    "--include-test",
    is_flag=True,
    help="Include test meetings",
)
@click.option(
    "--output-dir",
    type=click.Path(),
    default="data/curves",
    help="Output directory for curve JSON",
)
def generate_curves(
    env: str,
    region: str,
    start_date: Optional[str],
    end_date: Optional[str],
    interval: int,
    aggregation: str,
    include_test: bool,
    output_dir: str,
):
    """Generate meeting prediction curves (mock or WAP data)"""

    # Calculate date range if not provided
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
    if not start_date:
        start_dt = datetime.utcnow() - timedelta(weeks=52)
        start_date = start_dt.strftime("%Y-%m-%d")

    mode = settings.connector_mode
    click.echo(f"Generating curves for {env}/{region}...")
    click.echo(f"  Mode: {mode.upper()}")
    click.echo(f"  Date range: {start_date} to {end_date}")
    click.echo(f"  Interval: {interval}s")
    click.echo(f"  Aggregation: {aggregation}")

    try:
        # Initialize connector (mock or WAP)
        if mode == "mock":
            click.echo("Using mock data (demo mode)")
            mock_config = MockConfig(
                start_date=start_date,
                end_date=end_date,
                interval=interval,
            )
            connector = MockConnector(mock_config)
        else:
            click.echo("Querying WAP data...")
            # Try to import WAP connector (will fail if not in repo)
            try:
                from .wap_connector import WAPConnector, WAPConfig
                wap_config = WAPConfig(
                    host=settings.wap_host,
                    port=settings.wap_port,
                    username=settings.wap_username or "",
                    password=settings.wap_password or "",
                )
                connector = WAPConnector(wap_config)
            except ImportError:
                click.echo("❌ WAP connector not available (gitignored for public repo)", err=True)
                click.echo("Use mode='mock' or provide wap_connector.py", err=True)
                raise click.Abort()

        # Query data
        df = connector.query_meetings_data(
            env=env,
            region=region,
            start_date=start_date,
            end_date=end_date,
            include_test=include_test,
        )
        click.echo(f"✓ Retrieved {len(df)} records")

        if df.empty:
            click.echo("⚠️  No data returned", err=True)
            raise click.Abort()

        # Build curves
        click.echo("Building curves...")
        builder = CurveBuilder()
        curves = builder.process_timeseries(df, aggregate_by=aggregation)
        stats = builder.get_statistics(curves)
        click.echo(f"  Peak: {stats['peak']['value']} at weekday {stats['peak']['weekday']}")

        # Write output
        click.echo(f"Writing output to {output_dir}...")
        writer = OutputWriter(output_dir)
        filepath = writer.write_curve(
            curve=curves,
            env=env,
            region=region,
            metadata={
                "data_range_start": start_date,
                "data_range_end": end_date,
                "total_samples": len(df),
                "aggregation_interval": interval,
                "aggregation_method": aggregation,
                "summary": stats,
            },
        )
        click.echo(f"✓ Curve written to {filepath}")

    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)
        raise click.Abort()


@cli.command()
@click.argument("curve_files", nargs=-1, required=True, type=click.Path(exists=True))
def validate_curves(curve_files):
    """Validate curve JSON files"""
    click.echo(f"Validating {len(curve_files)} curve file(s)...")

    for filepath in curve_files:
        try:
            with open(filepath, "r") as f:
                import json

                data = json.load(f)

            # Check structure
            assert "meta" in data, "Missing 'meta' section"
            assert "curves" in data, "Missing 'curves' section"

            meta = data["meta"]
            assert "env" in meta, "Missing 'env' in meta"
            assert "region" in meta, "Missing 'region' in meta"
            assert "generated_at" in meta, "Missing 'generated_at' in meta"

            curves = data["curves"]
            total_slots = sum(len(slots) for slots in curves.values())

            click.echo(
                f"✓ {filepath}: {meta['env']}/{meta['region']}, "
                f"{total_slots} slots, {len(curves)} weekdays"
            )

        except Exception as e:
            click.echo(f"❌ {filepath}: {e}", err=True)


if __name__ == "__main__":
    cli()
