# backend/db/qdrant.py

from langchain_qdrant import QdrantVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from langchain_core.documents import Document
from typing import List

embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-en-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
)

qdrant_client = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "evaluation_docs"

def reset_collection():
    if qdrant_client.collection_exists(collection_name=COLLECTION_NAME):
        qdrant_client.delete_collection(collection_name=COLLECTION_NAME)
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )

def add_documents(docs: List[Document]):
    store = QdrantVectorStore(
        client=qdrant_client,
        collection_name=COLLECTION_NAME,
        embedding=embedding_model
    )
    store.add_documents(docs)
    return store

def get_retriever(k: int = 5):
    store = QdrantVectorStore(
        client=qdrant_client,
        collection_name=COLLECTION_NAME,
        embedding=embedding_model
    )
    return store.as_retriever(search_type="similarity", search_kwargs={"k": k})
