from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Global configuration for load predictor"""

    # WAP/StarRocks Configuration
    wap_host: str = "starrocks-prod.webex.com"
    wap_port: int = 9030
    wap_username: Optional[str] = None
    wap_password: Optional[str] = None
    wap_use_pure: bool = False
    wap_ssl_disabled: bool = False
    wap_ssl_verify_cert: bool = True
    wap_ssl_verify_identity: bool = False
    wap_ssl_ca: Optional[str] = "/etc/ssl/cert.pem"

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
