"""
LLM Configuration and Initialization.
Centralizes all LLM and embedding model setup.
"""
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

# Environment Variables
API_KEY = os.getenv("API_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama-3.3-70b-versatile")
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")

# Initialize LLM
llm = ChatGroq(
    groq_api_key=API_KEY,
    model_name=CHAT_MODEL,
    temperature=0.0
)

# Initialize Embedding Model
embedding_model = HuggingFaceEmbeddings(
    model_name=EMBED_MODEL,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
)
