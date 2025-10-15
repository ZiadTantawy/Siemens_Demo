"""
API endpoints for user chat input and responses 
"""
from fastapi import APIRouter, HTTPException
from ...schemas.chat import UserMessage, BotResponse
from ...services.rag_chain import create_rag_chain
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/send_message", response_model=BotResponse)
async def send_message(message: UserMessage):
    """
    Process user message and generate AI response using RAG.
    
    Args:
        message: UserMessage containing text and optional user_id
        
    Returns:
        BotResponse with AI-generated answer
        
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Use user_id from message, or default to "default_session"
        session_id = message.user_id or "default_session"
        
        logger.info(f"Processing message for session: {session_id}")
        
        # Create RAG chain for this session
        rag_chain = create_rag_chain(session_id)
        
        # Get response from RAG chain
        response_text = rag_chain.invoke(message.text)
        
        logger.info(f"Generated response for session: {session_id}")
        
        return BotResponse(
            message=response_text,
            sources=None,  # TODO: Extract sources from retriever
            confidence=None  # TODO: Add confidence scoring
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )