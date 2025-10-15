"""
Chat-related Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserMessage(BaseModel):
    """User message input schema."""
    text: str = Field(..., description="The user's question or message")
    user_id: Optional[str] = Field(None, description="Optional user/session identifier")

class Source(BaseModel):
    """Source citation schema."""
    type: str = Field(..., description="Source type: 'knowledge_base' or 'web'")
    filename: Optional[str] = Field(None, description="Filename (for KB sources)")
    page: Optional[Any] = Field(None, description="Page number (for KB sources)")
    chunk_id: Optional[int] = Field(None, description="Chunk ID (for KB sources)")
    url: Optional[str] = Field(None, description="URL (for web sources)")

class BotResponse(BaseModel):
    """Bot response output schema with citations and confidence."""
    message: str = Field(..., description="The generated answer")
    sources: Optional[List[Dict[str, Any]]] = Field(
        None, 
        description="List of source citations (KB documents or web URLs)"
    )
    confidence: Optional[float] = Field(
        None, 
        description="Confidence score (0-1) in the answer quality",
        ge=0.0,
        le=1.0
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "[KNOWLEDGE BASE] The Transformer is a sequence-to-sequence model...",
                "sources": [
                    {
                        "type": "knowledge_base",
                        "filename": "attention.pdf",
                        "page": 3,
                        "chunk_id": 11
                    }
                ],
                "confidence": 0.95
            }
        }
