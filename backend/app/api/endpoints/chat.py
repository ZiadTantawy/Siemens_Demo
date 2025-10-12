"""
API endpoints for user chat input and responses 
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.schemas.chat import UserMessage, BotResponse
    
router = APIRouter()

@router.post("/send_message")
async def send_message(message: UserMessage):
    # Process the user message and generate a bot response
    bot_response = BotResponse(message=message.text)
    return bot_response