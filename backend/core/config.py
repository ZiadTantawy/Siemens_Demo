"""
Configuration settings for Internal RAG Chatbot API
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_HOST: str = "localhost"
    MONGODB_PORT: int = 27020
    MONGODB_DATABASE: str = "internal_chatbot"
    MONGODB_CHAT_COLLECTION: str = "chat_history"
    
    # Qdrant Configuration
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "evaluation_docs"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Internal RAG Chatbot"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Internal RAG-based chatbot for document Q&A"
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = "*"
    
    # API Keys
    API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    
    # Model Configuration
    EMBED_MODEL: str = "BAAI/bge-base-en-v1.5"
    EMBEDDING_MODEL: str = "BAAI/bge-base-en-v1.5"
    CHAT_MODEL: str = "llama-3.3-70b-versatile"
    
    # RAG Ingestion Configuration
    COLLECTION_NAME: str = "pdf_docs"
    SOURCE_DIR: str = "./backend/pdfs"
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    BATCH_SIZE: int = 64
    
    @property
    def mongodb_url(self) -> str:
        return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}"
    
    @property
    def qdrant_url(self) -> str:
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from .env

settings = Settings()

# Export commonly used variables for easy import
MONGODB_URL = settings.mongodb_url
QDRANT_URL = settings.qdrant_url
QDRANT_API_KEY = settings.QDRANT_API_KEY
COLLECTION_NAME = settings.COLLECTION_NAME
EMBEDDING_MODEL = settings.EMBEDDING_MODEL
SOURCE_DIR = settings.SOURCE_DIR
CHUNK_SIZE = settings.CHUNK_SIZE
CHUNK_OVERLAP = settings.CHUNK_OVERLAP
