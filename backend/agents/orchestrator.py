# orchestrator.py
"""
Agent orchestrator using LangGraph to coordinate RAG and web search.
"""
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END  # type: ignore[import]
from .nodes import rag_node, decision_node, web_node, response_node


class AgentState(TypedDict):
    """State schema for the agent graph."""
    query: str
    session_id: str
    rag_answer: str
    context: str
    confidence: float
    rag_sources: list  # Citations from knowledge base
    use_web: bool
    web_answer: str
    citations: list  # Citations from web search
    final_answer: str
    llm: object  # Optional: for web search agent


def should_use_web(state: AgentState) -> str:
    """Conditional edge: decide whether to use web search or respond directly."""
    return "web_search" if state.get("use_web", False) else "respond"


def build_orchestration_graph():
    """
    Build and compile the agent orchestration graph.
    
    Returns:
        Compiled StateGraph that can process queries
    """
    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("rag", rag_node)
    workflow.add_node("decision", decision_node)
    workflow.add_node("web_search", web_node)
    workflow.add_node("respond", response_node)

    # Set entry point
    workflow.set_entry_point("rag")

    # Add edges
    workflow.add_edge("rag", "decision")
    workflow.add_conditional_edges(
        "decision",
        should_use_web,
        {
            "web_search": "web_search",
            "respond": "respond"
        }
    )
    workflow.add_edge("web_search", "respond")
    workflow.add_edge("respond", END)

    # Compile and return
    return workflow.compile()


if __name__ == "__main__":
    # Example run
    from ..services.llm import llm
    
    graph = build_orchestration_graph()
    inputs = {
        "query": "What is the clean code principle?",
        "session_id": "test_session",
        "llm": llm,  # Only needed for web search
    }
    result = graph.invoke(inputs)
    print(result.get("final_answer", "No answer"))
