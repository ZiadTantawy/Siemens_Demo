"""
Configuration settings for Internal RAG Chatbot API
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_HOST: str = "localhost"
    MONGODB_PORT: int = 27020
    MONGODB_DATABASE: str = "internal_chatbot"
    
    # Qdrant Configuration
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "documents"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Internal RAG Chatbot"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Internal RAG-based chatbot for document Q&A"
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = "*"
    
    # OpenAI Configuration (for embeddings and chat)
    OPENAI_API_KEY: Optional[str] = None
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"
    
    @property
    def mongodb_url(self) -> str:
        return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}"
    
    @property
    def qdrant_url(self) -> str:
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    class Config:
        env_file = ".env"

settings = Settings()
