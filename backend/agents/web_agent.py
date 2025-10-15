# web_agent.py
"""
Web search agent for fallback when RAG doesn't have sufficient information.
"""
import os
from typing import Dict, List
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_groq import ChatGroq

class WebSearchAgent:
    """Agent that performs web searches and summarizes results."""
    
    def __init__(self, llm=None):
        """
        Initialize the web search agent.
        
        Args:
            llm: Optional language model to use for summarization.
                 If not provided, will use ChatGroq.
        """
        # Check if SERPER_API_KEY is available
        serper_key = os.getenv("SERPER_API_KEY")
        if not serper_key:
            raise ValueError(
                "SERPER_API_KEY environment variable not set. "
                "Get a free API key at https://serper.dev"
            )
        
        self.search_tool = GoogleSerperAPIWrapper(serper_api_key=serper_key)
        
        # Use provided LLM or create a default one
        if llm is None:
            api_key = os.getenv("API_KEY", "")
            model = os.getenv("CHAT_MODEL", "llama-3.3-70b-versatile")
            self.llm = ChatGroq(groq_api_key=api_key, model_name=model, temperature=0)
        else:
            self.llm = llm

    def search(self, query: str) -> Dict[str, any]:
        """
        Search the web for the query and return summarized, cited results.
        
        Args:
            query: The search query string
            
        Returns:
            Dictionary with 'answer' (summarized text) and 'citations' (list of URLs)
        """
        try:
            results = self.search_tool.results(query)
            if not results or "organic" not in results:
                return {"answer": "No relevant results found.", "citations": []}

            snippets = [r.get("snippet", "") for r in results["organic"][:3]]
            links = [r.get("link", "") for r in results["organic"][:3]]

            summary_prompt = f"""
You are a research assistant. Summarize the following snippets into a concise,
factually correct paragraph. Include inline citations with [1], [2], etc.

Snippets:
{snippets}

URLs:
{links}
"""
            response = self.llm.invoke(summary_prompt)
            return {"answer": response.content, "citations": links}
            
        except Exception as e:
            return {
                "answer": f"Error performing web search: {str(e)}",
                "citations": []
            }
