# nodes.py
"""
Agent nodes for the orchestration graph.
Each node performs a specific task in the RAG + Web Search workflow.
"""
from typing import Dict, Any
from .web_agent import WebSearchAgent
from ..services.rag_chain import create_rag_chain
from ..db.qdrant import get_retriever


def evaluate_rag_answer(question: str, context: str, answer: str) -> float:
    """
    Evaluate RAG output using heuristic-based confidence scoring.
    
    Args:
        question: The user's question
        context: Retrieved context from documents
        answer: Generated answer from RAG
        
    Returns:
        Confidence score between 0 and 1
    """
    # Start with base confidence
    confidence = 0.5
    
    # Check answer length (very short answers are often uncertain)
    answer_length = len(answer.strip())
    if answer_length < 50:
        confidence = 0.3
    elif answer_length > 100:
        confidence = 0.7
    elif answer_length > 200:
        confidence = 0.8
    
    # Check for uncertainty phrases (strong indicator of low confidence)
    uncertain_phrases = [
        "not enough information",
        "cannot answer",
        "no information",
        "don't know",
        "insufficient",
        "unable to",
        "does not contain",
        "missing details",
        "not provided"
    ]
    
    if any(phrase in answer.lower() for phrase in uncertain_phrases):
        confidence = min(confidence, 0.4)
    else:
        # Boost confidence if answer seems complete
        confidence = min(confidence + 0.2, 0.9)
    
    # Check if context is relevant and substantial
    if context and len(context.strip()) > 100:
        # If answer is detailed and context is substantial, boost confidence
        if answer_length > 200:
            confidence = min(confidence + 0.1, 0.95)
    
    return confidence


def rag_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Retrieve from private KB using the configured RAG chain.
    
    Args:
        state: Current agent state containing query and optional session_id
        
    Returns:
        Updated state with rag_answer, context, confidence, and sources
    """
    query = state["query"]
    session_id = state.get("session_id", "agent_session")
    
    # Use the properly configured RAG chain from services
    rag_chain = create_rag_chain(session_id)
    
    try:
        # Get answer from RAG chain
        answer = rag_chain.invoke(query)
        
        # Also get the context for transparency and citations
        retriever = get_retriever(k=4)
        context_docs = retriever.invoke(query)
        context = "\n\n".join([d.page_content for d in context_docs])
        
        # Extract source citations from retrieved documents
        sources = []
        for i, doc in enumerate(context_docs):
            source_info = {
                "rank": i + 1,
                "filename": doc.metadata.get("filename", "Unknown"),
                "page": doc.metadata.get("page", doc.metadata.get("page_number", "N/A")),
                "chunk_id": doc.metadata.get("chunk_id", i),
            }
            sources.append(source_info)
        
        # Use heuristic evaluation to determine answer quality and confidence
        confidence = evaluate_rag_answer(query, context, answer)
        
        print(f"[RAG Evaluation] Confidence score: {confidence:.2f}")
        print(f"[RAG Sources] Retrieved from {len(sources)} document chunks")
        
        return {
            "rag_answer": answer,
            "context": context,
            "confidence": confidence,
            "rag_sources": sources
        }
    except Exception as e:
        # Fallback if RAG chain fails
        return {
            "rag_answer": f"Error in RAG: {str(e)}",
            "context": "",
            "confidence": 0.0,
            "rag_sources": []
        }


def decision_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decide whether RAG answer is sufficient or if web search is needed.
    Uses LangSmith evaluation or confidence score to make the decision.
    
    Args:
        state: Current agent state with rag_answer, context, and confidence
        
    Returns:
        Updated state with use_web decision
    """
    answer = state.get("rag_answer", "")
    context = state.get("context", "")
    confidence = state.get("confidence", 0.0)
    
    # Decision threshold: if confidence < 0.6, use web search
    use_web = confidence < 0.6
    
    print(f"[Decision] Confidence: {confidence:.2f}, Use web: {use_web}")
    
    # Additional check for explicit uncertainty phrases
    if not use_web and answer:
        uncertain_phrases = [
            "not enough information",
            "cannot answer",
            "no information",
            "don't know",
            "insufficient context"
        ]
        if any(phrase in answer.lower() for phrase in uncertain_phrases):
            use_web = True
            print(f"[Decision] Detected uncertainty phrase, forcing web search")
    
    return {"use_web": use_web}


def web_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call web search API if RAG answer was insufficient.
    
    Args:
        state: Current agent state with query and optional llm
        
    Returns:
        Updated state with web_answer and citations
    """
    if not state.get("use_web"):
        return {"web_answer": None, "citations": []}

    try:
        # Get LLM from state or use default from services
        llm = state.get("llm")
        if llm is None:
            from ..services.llm import llm as default_llm
            llm = default_llm
            
        agent = WebSearchAgent(llm)
        res = agent.search(state["query"])
        return {
            "web_answer": res["answer"],
            "citations": res["citations"]
        }
    except Exception as e:
        return {
            "web_answer": f"Web search unavailable: {str(e)}",
            "citations": []
        }


def response_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Combine answers and output final message with proper citations.
    
    Args:
        state: Current agent state with all answers
        
    Returns:
        Updated state with final_answer (with inline citations already embedded)
    """
    if state.get("use_web") and state.get("web_answer"):
        # Web search was used - include confidence explanation
        confidence = state.get("confidence", 0.0)
        answer = f"""⚠️ The knowledge base didn't have sufficient information (Confidence: {confidence:.1%}).

Searching the web for current information...

{state['web_answer']}"""
        
        return {"final_answer": answer}
    else:
        # RAG answer was sufficient - answer already contains inline citations
        # Just return the answer as-is, citations are embedded by the LLM
        return {"final_answer": state['rag_answer']}


