"""
Pydantic schemas for user chat input and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum

class UserMessage(BaseModel):
    user_id: str
    message: str
    timestamp: date

class BotResponse(BaseModel):
    response: str
    timestamp: date