"""
Configuration settings for the AI service
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # AI Providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Vector Database
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    # Database
    DATABASE_URL: str = "sqlite:///./crm.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CRM Service Integration
    CRM_SERVICE_URL: str = "http://localhost:3001"
    CRM_API_KEY: str = ""
    
    # Security
    WEBHOOK_SECRET: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()