import os
from pymongo import MongoClient
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableMap
from langchain_core.output_parsers import StrOutputParser

from .llm import llm
from .system_prompt import prompt
from ..db.qdrant import get_retriever

# Configuration from environment variables
MONGODB_HOST = os.getenv("MONGODB_HOST", "localhost")
MONGODB_PORT = os.getenv("MONGODB_PORT", "27020")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "internal_chatbot")

# Build MongoDB URI
MONGO_URI = f"mongodb://{MONGODB_HOST}:{MONGODB_PORT}"


def get_memory(session_id: str) -> ConversationBufferMemory:
    """
    Create conversation memory for a session using MongoDB.
    
    Args:
        session_id: Unique identifier for the conversation session
        
    Returns:
        ConversationBufferMemory instance with MongoDB backend
    """
    chat_history = MongoDBChatMessageHistory(
        connection_string=MONGO_URI,
        session_id=session_id,
        database_name=MONGODB_DATABASE,
        collection_name="chat_history",
    )
    return ConversationBufferMemory(
        chat_memory=chat_history,
        memory_key="chat_history",
        return_messages=True
    )


def create_rag_chain(session_id: str):
    """
    Create a RAG chain for a specific session.
    
    Args:
        session_id: Unique identifier for the conversation session
        
    Returns:
        Runnable RAG chain that can process questions
    """
    memory = get_memory(session_id)
    retriever = get_retriever(k=4)

    def get_chat_history(_):
        """Extract chat history from memory."""
        messages = memory.chat_memory.messages
        return "\n".join(
            [f"{m.type.capitalize()}: {m.content}" for m in messages]
        ) if messages else "No previous conversation."

    # Build the chain inputs
    chain_inputs = RunnableMap({
        "context": retriever | (lambda docs: "\n\n".join([d.page_content for d in docs])),
        "question": RunnablePassthrough(),
    })

    # Assemble the complete RAG chain
    rag_chain = chain_inputs | prompt | llm | StrOutputParser()
    return rag_chain
