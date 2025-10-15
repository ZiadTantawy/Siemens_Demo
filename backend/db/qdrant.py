# backend/db/qdrant.py
"""
Qdrant Vector Database Client.
Handles collection management and document operations.
"""
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from langchain_core.documents import Document
from typing import List
import os

# Use relative import from parent package
from ..services.llm import embedding_model

# Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "pdf_docs")

qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def ensure_collection_exists():
    """Ensure the collection exists, create it if it doesn't."""
    try:
        if not qdrant_client.collection_exists(collection_name=COLLECTION_NAME):
            print(f"Creating Qdrant collection: {COLLECTION_NAME}")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            print(f"✅ Collection '{COLLECTION_NAME}' created successfully")
        return True
    except Exception as e:
        print(f"Error ensuring collection exists: {e}")
        return False

def reset_collection():
    """Delete and recreate the collection."""
    if qdrant_client.collection_exists(collection_name=COLLECTION_NAME):
        qdrant_client.delete_collection(collection_name=COLLECTION_NAME)
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )

def add_documents(docs: List[Document]):
    """Add documents to the vector store."""
    ensure_collection_exists()
    store = QdrantVectorStore(
        client=qdrant_client,
        collection_name=COLLECTION_NAME,
        embedding=embedding_model
    )
    store.add_documents(docs)
    return store

def get_retriever(k: int = 5):
    """Get a retriever for document search."""
    ensure_collection_exists()
    store = QdrantVectorStore(
        client=qdrant_client,
        collection_name=COLLECTION_NAME,
        embedding=embedding_model
    )
    return store.as_retriever(search_type="similarity", search_kwargs={"k": k})
