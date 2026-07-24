"""
Command-line interface for load predictor.
"""

import click
from pathlib import Path
from typing import Optional

from .config import settings
from .wap_connector import WAPConnector, WAPConfig
from .curve_builder import CurveBuilder
from .output_writer import OutputWriter


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
    "--weeks-back",
    type=int,
    default=52,
    help="Number of weeks of historical data",
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
    weeks_back: int,
    include_test: bool,
    output_dir: str,
):
    """Generate meeting prediction curves from WAP data"""

    click.echo(f"Generating curves for {env}/{region}...")
    click.echo(f"  Weeks of data: {weeks_back}")
    click.echo(f"  Include test meetings: {include_test}")

    try:
        # Initialize WAP connector
        wap_config = WAPConfig(
            iceberg_database=settings.wap_iceberg_database,
            endpoint=settings.wap_endpoint,
            username=settings.wap_username,
            password=settings.wap_password,
        )
        connector = WAPConnector(wap_config)

        # Query data
        click.echo("Querying WAP data...")
        df = connector.query_meetings_data(
            env=env,
            region=region,
            weeks_back=weeks_back,
            include_test=include_test,
        )
        click.echo(f"  Retrieved {len(df)} records")

        # Build curves
        click.echo("Building curves...")
        builder = CurveBuilder()
        curves = builder.process_timeseries(df, aggregate_by="mean")
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
                "data_range_start": df["timestamp"].min().isoformat(),
                "data_range_end": df["timestamp"].max().isoformat(),
                "total_samples": len(df),
                "summary": stats,
            },
        )
        click.echo(f"✓ Curve written to {filepath}")

    except NotImplementedError as e:
        click.echo(f"❌ Error: {e}", err=True)
        click.echo("WAP connector not yet fully implemented", err=True)
        raise click.Abort()
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
