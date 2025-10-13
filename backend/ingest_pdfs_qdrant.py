#!/usr/bin/env python3
"""
Production-grade RAG ingestion script for PDF documents.
Loads PDFs, extracts text, chunks content, embeds with OpenAI, and stores in Qdrant.

Usage:
    # Set required environment variable
    set OPENAI_API_KEY=your_openai_api_key_here
    
    # Optional: Set other environment variables
    set QDRANT_URL=http://localhost:6333
    set COLLECTION_NAME=pdf_docs
    set SOURCE_DIR=./pdfs
    set CHUNK_SIZE=800
    set CHUNK_OVERLAP=150
    set BATCH_SIZE=64
    
    # Run the script
    python ingest_pdfs_qdrant.py

Requirements:
    - Place PDF files in the ./pdfs directory (or configure SOURCE_DIR)
    - OpenAI API key must be set
    - Qdrant server should be running (default: localhost:6333)
"""

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from langchain_community.document_loaders import UnstructuredPDFLoader, PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from tqdm import tqdm


def get_config() -> Dict[str, Any]:
    """Load configuration from environment variables with sensible defaults."""
    return {
        "openai_api_key": os.getenv("OPENAI_API_KEY"),
        "qdrant_url": os.getenv("QDRANT_URL", "http://localhost:6333"),
        "qdrant_api_key": os.getenv("QDRANT_API_KEY"),
        "collection_name": os.getenv("COLLECTION_NAME", "pdf_docs"),
        "source_dir": os.getenv("SOURCE_DIR", "./pdfs"),
        "chunk_size": int(os.getenv("CHUNK_SIZE", "800")),
        "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", "150")),
        "batch_size": int(os.getenv("BATCH_SIZE", "64")),
    }


def ensure_collection(client: QdrantClient, collection_name: str, embedding_dim: int) -> None:
    """Create Qdrant collection if it doesn't exist."""
    try:
        collections = client.get_collections()
        existing_names = [col.name for col in collections.collections]
        
        if collection_name not in existing_names:
            print(f"Creating collection '{collection_name}' with {embedding_dim} dimensions...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=embedding_dim, distance=Distance.COSINE)
            )
        else:
            print(f"Collection '{collection_name}' already exists.")
    except Exception as e:
        print(f"Error ensuring collection: {e}")
        raise


def load_pdf_documents(pdf_path: Path) -> List[Dict[str, Any]]:
    """Load and extract text from a single PDF file."""
    try:
        # Try UnstructuredPDFLoader first (preferred)
        try:
            loader = UnstructuredPDFLoader(str(pdf_path))
            documents = loader.load()
        except Exception:
            # Fallback to PyMuPDFLoader
            loader = PyMuPDFLoader(str(pdf_path))
            documents = loader.load()
        
        # Add filename to metadata
        for doc in documents:
            doc.metadata["filename"] = pdf_path.name
            doc.metadata["filepath"] = str(pdf_path)
            doc.metadata["ingestion_time"] = datetime.now().isoformat()
        
        return [{"content": doc.page_content, "metadata": doc.metadata} for doc in documents]
    
    except Exception as e:
        print(f"Error loading PDF {pdf_path}: {e}")
        return []


def ingest_pdf(pdf_path: Path, text_splitter: RecursiveCharacterTextSplitter, 
               embeddings: OpenAIEmbeddings, client: QdrantClient, 
               collection_name: str, batch_size: int) -> Dict[str, int]:
    """Process a single PDF file and upsert to Qdrant."""
    # Load and split documents
    documents = load_pdf_documents(pdf_path)
    if not documents:
        return {"chunks": 0, "vectors": 0}
    
    # Split into chunks
    all_chunks = []
    for doc in documents:
        chunks = text_splitter.split_text(doc["content"])
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "content": chunk,
                "metadata": {
                    **doc["metadata"],
                    "chunk_id": i,
                    "total_chunks": len(chunks)
                }
            })
    
    if not all_chunks:
        return {"chunks": 0, "vectors": 0}
    
    # Embed in batches
    points = []
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        batch_texts = [chunk["content"] for chunk in batch]
        
        try:
            batch_embeddings = embeddings.embed_documents(batch_texts)
            
            for j, (chunk, embedding) in enumerate(zip(batch, batch_embeddings)):
                point_id = f"{pdf_path.stem}_{i + j}"
                points.append(PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "content": chunk["content"],
                        **chunk["metadata"]
                    }
                ))
        except Exception as e:
            print(f"Error embedding batch for {pdf_path}: {e}")
            continue
    
    # Upsert to Qdrant
    if points:
        try:
            client.upsert(collection_name=collection_name, points=points)
        except Exception as e:
            print(f"Error upserting to Qdrant for {pdf_path}: {e}")
            return {"chunks": 0, "vectors": 0}
    
    return {"chunks": len(all_chunks), "vectors": len(points)}


def main():
    """Main ingestion pipeline."""
    start_time = time.time()
    
    # Load configuration
    config = get_config()
    
    # Validate required configuration
    if not config["openai_api_key"]:
        print("ERROR: OPENAI_API_KEY environment variable is required")
        return
    
    # Initialize components
    print("Initializing RAG ingestion pipeline...")
    
    # Setup embeddings
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=config["openai_api_key"]
    )
    
    # Get embedding dimension
    try:
        test_embedding = embeddings.embed_query("test")
        embedding_dim = len(test_embedding)
    except Exception as e:
        print(f"ERROR: Error getting embedding dimension: {e}")
        return
    
    # Setup Qdrant client
    try:
        client = QdrantClient(
            url=config["qdrant_url"],
            api_key=config["qdrant_api_key"] if config["qdrant_api_key"] else None
        )
    except Exception as e:
        print(f"ERROR: Error connecting to Qdrant: {e}")
        return
    
    # Ensure collection exists
    ensure_collection(client, config["collection_name"], embedding_dim)
    
    # Setup text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config["chunk_size"],
        chunk_overlap=config["chunk_overlap"],
        length_function=len,
    )
    
    # Find PDF files
    source_path = Path(config["source_dir"])
    if not source_path.exists():
        print(f"ERROR: Source directory '{source_path}' does not exist")
        return
    
    pdf_files = list(source_path.glob("*.pdf"))
    if not pdf_files:
        print(f"ERROR: No PDF files found in '{source_path}'")
        return
    
    print(f"Found {len(pdf_files)} PDF files in '{source_path}'")
    
    # Process PDFs
    total_chunks = 0
    total_vectors = 0
    processed_files = 0
    
    for pdf_file in tqdm(pdf_files, desc="Processing PDFs"):
        result = ingest_pdf(
            pdf_file, text_splitter, embeddings, client,
            config["collection_name"], config["batch_size"]
        )
        total_chunks += result["chunks"]
        total_vectors += result["vectors"]
        processed_files += 1
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    # Output summary
    summary = {
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "elapsed_time_seconds": round(elapsed_time, 2),
        "total_files": len(pdf_files),
        "processed_files": processed_files,
        "total_chunks": total_chunks,
        "total_vectors": total_vectors,
        "collection_name": config["collection_name"],
        "qdrant_url": config["qdrant_url"],
        "embedding_model": "text-embedding-3-small",
        "chunk_size": config["chunk_size"],
        "chunk_overlap": config["chunk_overlap"],
        "batch_size": config["batch_size"]
    }
    
    print("\n" + "="*50)
    print("INGESTION SUMMARY")
    print("="*50)
    print(json.dumps(summary, indent=2))
    print("="*50)
    
    if total_vectors > 0:
        print(f"SUCCESS: Successfully ingested {total_vectors} vectors from {processed_files} files")
    else:
        print("WARNING: No vectors were ingested. Check your PDF files and configuration.")


if __name__ == "__main__":
    main()
