from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Global configuration for load predictor"""

    # WAP Configuration
    wap_iceberg_database: str = "default"
    wap_endpoint: Optional[str] = None
    wap_username: Optional[str] = None
    wap_password: Optional[str] = None

    # Output
    output_dir: str = "data/curves"

    # Environments and regions
    default_env: str = "cprod"
    default_region: str = "AMER"

    # Data processing
    weeks_back: int = 52  # 1 year of data
    include_test_meetings: bool = False

    class Config:
        env_file = ".env"
        env_prefix = "LP_"


settings = Settings()
