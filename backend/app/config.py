from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_TITLE: str = "Pricing Workflow POC"
    API_VERSION: str = "1.0.0"
    
    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    # LLM Settings
    LLM_API_URL: str = "http://your-gpu-server:8080/generate"
    LLM_MODEL: str = "llama-3-70b"
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.7
    
    # Oracle Settings
    ORACLE_HOST: str = "oracle-db-server"
    ORACLE_PORT: int = 1521
    ORACLE_SERVICE: str = "PRICING"
    ORACLE_USER: str = "pricing_user"
    ORACLE_PASSWORD: str = "change_me"
    
    # Unix SSH Settings
    UNIX_SERVERS: dict = {
        "pricing_server_1": {
            "host": "unix-pricing-01.bofa.com",
            "port": 22,
            "user": "pricingadmin",
            "key_file": "/path/to/ssh/key"
        },
        "pricing_server_2": {
            "host": "unix-pricing-02.bofa.com",
            "port": 22,
            "user": "pricingadmin",
            "key_file": "/path/to/ssh/key"
        }
    }
    
    # Workflow Settings
    WORKFLOW_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_WORKFLOWS: int = 10
    
    # Skills Directory
    SKILLS_DIR: str = "./app/skills"
    
    # Cache TTL (seconds)
    CACHE_LLM_RESPONSE_TTL: int = 3600  # 1 hour
    CACHE_ORACLE_QUERY_TTL: int = 300   # 5 minutes
    CACHE_WORKFLOW_STATE_TTL: int = 7200  # 2 hours
    
    # Compression Settings
    ENABLE_COMPRESSION: bool = True
    MAX_CONTEXT_TOKENS: int = 2000
    COMPRESSION_TARGET_RATIO: float = 0.4  # Target 40% reduction
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
