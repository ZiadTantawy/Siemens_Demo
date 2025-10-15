"""
API endpoints for user chat input and responses with intelligent agent orchestration.
Integrates RAG + Web Search fallback for optimal answer quality.
"""
from fastapi import APIRouter, HTTPException
from ...schemas.chat import UserMessage, BotResponse
from ...agents.orchestrator import build_orchestration_graph
from ...services.llm import llm
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize agent graph once at module level for efficiency
agent_graph = build_orchestration_graph()

@router.post("/send_message", response_model=BotResponse)
async def send_message(message: UserMessage):
    """
    Process user message using intelligent agent orchestration.
    
    This endpoint uses the full RAG + Web Search agent system:
    1. Attempts to answer from knowledge base (RAG)
    2. Evaluates confidence in the answer
    3. Falls back to web search if confidence is low
    4. Returns answer with proper citations and confidence score
    
    Args:
        message: UserMessage containing text and optional user_id
        
    Returns:
        BotResponse with AI-generated answer, sources, and confidence
        
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Use user_id from message, or default to "default_session"
        session_id = message.user_id or "default_session"
        
        logger.info(f"Processing message for session: {session_id}")
        logger.info(f"Query: {message.text}")
        
        # Invoke agent orchestration graph
        agent_state = {
            "query": message.text,
            "session_id": session_id,
            "llm": llm  # Provide LLM for web search if needed
        }
        
        result = agent_graph.invoke(agent_state)
        
        # Extract information from agent result
        final_answer = result.get("final_answer", "No answer generated")
        confidence = result.get("confidence", 0.0)
        used_web = result.get("use_web", False)
        
        # Extract sources based on which path was used
        sources = []
        if used_web:
            # Web search was used
            web_citations = result.get("citations", [])
            sources = [{"type": "web", "url": url} for url in web_citations]
            logger.info(f"Used web search, found {len(sources)} sources")
        else:
            # Knowledge base was used
            rag_sources = result.get("rag_sources", [])
            sources = [
                {
                    "type": "knowledge_base",
                    "filename": src.get("filename", "Unknown"),
                    "page": src.get("page", "N/A"),
                    "chunk_id": src.get("chunk_id", 0)
                }
                for src in rag_sources
            ]
            logger.info(f"Used knowledge base, found {len(sources)} sources")
        
        logger.info(f"Generated response for session: {session_id} (confidence: {confidence:.2f})")
        
        return BotResponse(
            message=final_answer,
            sources=sources if sources else None,
            confidence=confidence
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )
