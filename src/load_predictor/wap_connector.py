"""
WAP (Iceberg) data connector via StarRocks.
Queries Iceberg tables directly for meeting data.
"""

from typing import Optional
from datetime import datetime, timedelta
import pandas as pd
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class WAPConfig(BaseModel):
    """Configuration for WAP/StarRocks connection"""
    host: str = "starrocks-prod.webex.com"
    port: int = 9030
    username: str
    password: str
    use_pure: bool = False
    ssl_disabled: bool = False
    ssl_verify_cert: bool = True
    ssl_verify_identity: bool = False
    ssl_ca: Optional[str] = "/etc/ssl/cert.pem"


class WAPConnector:
    """Query WAP (Iceberg) tables via StarRocks and return meeting data"""

    # Mapping of environments to stack names
    STACK_MAPPING = {
        "cprod": {
            "AMER": [
                "cprod-uscentral1-0",
                "cprod-uscentral1-1",
                "cprod-uscentral1-2",
                "cprod-useast1-0",
                "cprod-useast1-2",
                "cprod-useast1-4",
                "cprod-uswest1-0",
                "cprod-uswest1-1",
                "cprod-uswest1-2",
            ],
            "EMEAR": [
                "cprod-euwest1-0",
                "cprod-euwest1-2",
                "cprod-euwest4-0",
                "cprod-euwest4-2",
            ],
            "APAC": [
                "cprod-apnortheast1-0",
                "cprod-apsoutheast1-0",
            ],
        },
        "cstage": {
            "AMER": ["cstage-useast1-0", "cstage-uswest2-0"],
        },
        "cint": {
            "AMER": ["cint-uscentral1-0-0", "cint-uscentral1-1-0", "cint-rswearin-0-0"],
        },
    }

    def __init__(self, config: WAPConfig):
        self.config = config
        self.connection = None
        self._connect()

    def _connect(self):
        """Establish connection to StarRocks/WAP"""
        try:
            import mysql.connector

            connection_config = {
                "user": self.config.username,
                "password": self.config.password,
                "host": self.config.host,
                "port": self.config.port,
                "auth_plugin": "mysql_clear_password",
                "ssl_disabled": self.config.ssl_disabled,
                "ssl_verify_cert": self.config.ssl_verify_cert,
                "ssl_verify_identity": self.config.ssl_verify_identity,
                "use_pure": self.config.use_pure,
            }

            if self.config.ssl_ca:
                connection_config["ssl_ca"] = self.config.ssl_ca

            self.connection = mysql.connector.connect(**connection_config)
            logger.info(f"Connected to WAP at {self.config.host}:{self.config.port}")
        except Exception as e:
            logger.error(f"Failed to connect to WAP: {e}")
            raise

    def _get_stack_names(self, env: str, region: str) -> list:
        """Get stack names for the given environment and region"""
        if env not in self.STACK_MAPPING:
            raise ValueError(f"Unknown environment: {env}")

        if region not in self.STACK_MAPPING[env]:
            raise ValueError(f"Unknown region {region} for environment {env}")

        return self.STACK_MAPPING[env][region]

    def query_meetings_data(
        self,
        env: str,
        region: str,
        weeks_back: int,
        include_test: bool = False,
    ) -> pd.DataFrame:
        """
        Query WAP Iceberg table for meeting data.

        Args:
            env: Environment (cprod, cstage, cint)
            region: Region (AMER, EMEAR, APAC)
            weeks_back: Number of weeks of historical data
            include_test: Include test meetings

        Returns:
            DataFrame with columns: [timestamp, count]
        """
        if not self.connection:
            raise RuntimeError("Not connected to WAP")

        try:
            cursor = self.connection.cursor()
            cursor.execute("SET sql_dialect='trino'")

            stack_names = self._get_stack_names(env, region)
            stacks_str = ", ".join([f"'{s}'" for s in stack_names])

            start_date = datetime.utcnow() - timedelta(weeks=weeks_back)
            end_date = datetime.utcnow()

            is_test_clause = "" if include_test else "AND isTest = false"

            # Query Iceberg table for meeting timestamps
            query = f"""
            SELECT
              _timestamp AS timestamp,
              COUNT(*) AS count
            FROM iceberg.wap_udp_roma_prod_useast1.voicea_legacy_metrics
            WHERE _timestamp >= CAST('{start_date.strftime("%Y-%m-%d %H:%M:%S")}' AS DATETIME)
              AND _timestamp < CAST('{end_date.strftime("%Y-%m-%d %H:%M:%S")}' AS DATETIME)
              AND stackName IN ({stacks_str})
              AND source IN ('WebexAssistant')
              {is_test_clause}
              AND meetingId IS NOT NULL
            GROUP BY _timestamp
            ORDER BY _timestamp ASC
            """

            logger.info(f"Querying WAP for {env}/{region}, {weeks_back} weeks back")
            cursor.execute(query)

            results = cursor.fetchall()
            logger.info(f"Retrieved {len(results)} rows from WAP")

            # Convert to DataFrame
            df = pd.DataFrame(results, columns=["timestamp", "count"])
            df["timestamp"] = pd.to_datetime(df["timestamp"])

            cursor.close()
            return df

        except Exception as e:
            logger.error(f"Failed to query WAP: {e}")
            raise

    def query_aggregated_metrics(
        self,
        env: str,
        region: str,
    ) -> dict:
        """
        Return summary statistics about the data.

        Args:
            env: Environment
            region: Region

        Returns:
            Dict with keys: total_count, date_range, sample_count
        """
        if not self.connection:
            raise RuntimeError("Not connected to WAP")

        try:
            cursor = self.connection.cursor()
            cursor.execute("SET sql_dialect='trino'")

            stack_names = self._get_stack_names(env, region)
            stacks_str = ", ".join([f"'{s}'" for s in stack_names])

            # Get aggregated stats
            query = f"""
            SELECT
              COUNT(DISTINCT meetingId) AS total_meetings,
              COUNT(*) AS total_events,
              MIN(_timestamp) AS date_start,
              MAX(_timestamp) AS date_end
            FROM iceberg.wap_udp_roma_prod_useast1.voicea_legacy_metrics
            WHERE stackName IN ({stacks_str})
              AND source IN ('WebexAssistant')
              AND isTest = false
              AND meetingId IS NOT NULL
            """

            cursor.execute(query)
            result = cursor.fetchone()

            cursor.close()

            return {
                "total_meetings": result[0] if result[0] else 0,
                "total_events": result[1] if result[1] else 0,
                "date_start": result[2].isoformat() if result[2] else None,
                "date_end": result[3].isoformat() if result[3] else None,
            }

        except Exception as e:
            logger.error(f"Failed to query aggregated metrics: {e}")
            raise

    def close(self):
        """Close the connection"""
        if self.connection:
            self.connection.close()
            logger.info("WAP connection closed")

    def __del__(self):
        """Cleanup on object destruction"""
        self.close()
