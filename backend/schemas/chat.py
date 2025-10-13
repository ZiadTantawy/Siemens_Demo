"""
Chat-related Pydantic schemas
"""

from pydantic import BaseModel
from typing import Optional, List

class UserMessage(BaseModel):
    text: str
    user_id: Optional[str] = None

class BotResponse(BaseModel):
    message: str
    sources: Optional[List[str]] = None
    confidence: Optional[float] = None
