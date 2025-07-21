"""
Configuration settings for the AI service
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Local AI Configuration
    OLLAMA_HOST: str = "localhost"
    OLLAMA_PORT: int = 11434
    OLLAMA_MODEL: str = "llama3.1:8b"  # Default model
    OLLAMA_TIMEOUT: int = 60
    OLLAMA_ENABLED: bool = True
    
    # Cloud AI Providers (Fallback)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"
    
    # AI Provider Priority (local first, then cloud)
    AI_PROVIDER_PRIORITY: List[str] = ["ollama", "anthropic", "openai"]
    
    # Vector Database Configuration
    # Chroma (Local Vector DB)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_NAME: str = "crm_embeddings"
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    CHROMA_ENABLED: bool = True
    
    # Pinecone (Cloud Vector DB - Fallback)
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "crm-embeddings"
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # RAG Configuration
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.7
    RAG_MAX_CONTEXT_LENGTH: int = 4000
    
    # Database
    DATABASE_URL: str = "sqlite:///./crm.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CRM Service Integration
    CRM_SERVICE_URL: str = "http://localhost:3001"
    CRM_API_KEY: str = ""
    
    # Performance & Caching
    CACHE_TTL: int = 3600  # 1 hour
    MAX_CONCURRENT_REQUESTS: int = 10
    
    # Security
    WEBHOOK_SECRET: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()