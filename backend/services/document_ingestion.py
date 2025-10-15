"""
Document ingestion service for user-uploaded files

This module provides a streamlined service for ingesting PDF documents
into the Qdrant vector database, designed for API integration.
"""

import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# LangChain document processing
from langchain_community.document_loaders import PyMuPDFLoader, UnstructuredPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# HuggingFace embeddings
from langchain_huggingface import HuggingFaceEmbeddings

# Qdrant vector database
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

# Configuration
from backend.core.config import (
    EMBEDDING_MODEL,
    QDRANT_URL,
    QDRANT_API_KEY,
    COLLECTION_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP
)


class DocumentIngestionService:
    """
    Service for ingesting documents into the RAG system.
    
    Provides methods for:
    - Ingesting single PDF files
    - Getting next available vector ID
    - Deleting documents by filename
    - Checking document existence
    """
    
    def __init__(self):
        """Initialize the ingestion service with embeddings and Qdrant client"""
        # Initialize embedding model (reuse across requests for efficiency)
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "normalize_embeddings": True,
                "batch_size": 32
            }
        )
        
        # Initialize Qdrant client
        self.client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None
        )
        
        # Text splitter configuration
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )
        
        # Ensure collection exists
        self._ensure_collection()
    
    def _ensure_collection(self) -> None:
        """Ensure the Qdrant collection exists with proper configuration"""
        try:
            collections = self.client.get_collections()
            existing_names = [col.name for col in collections.collections]
            
            if COLLECTION_NAME not in existing_names:
                # Get embedding dimension
                test_embedding = self.embeddings.embed_query("test")
                embedding_dim = len(test_embedding)
                
                # Create collection
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection '{COLLECTION_NAME}' with {embedding_dim} dimensions")
        except Exception as e:
            print(f"Error ensuring collection: {e}")
            raise
    
    def _get_next_id(self) -> int:
        """
        Get the next available ID for vectors in the collection.
        
        Returns:
            int: Next available ID (0 for empty collection)
        """
        try:
            # Get collection info to check point count
            collection_info = self.client.get_collection(COLLECTION_NAME)
            
            # If collection is empty, start at 0
            if collection_info.points_count == 0:
                return 0
            
            # Scroll through all points to find max ID
            max_id = -1
            offset = None
            
            while True:
                points, offset = self.client.scroll(
                    collection_name=COLLECTION_NAME,
                    limit=100,
                    offset=offset,
                    with_payload=False,
                    with_vectors=False
                )
                
                if not points:
                    break
                
                for point in points:
                    if isinstance(point.id, int) and point.id > max_id:
                        max_id = point.id
                
                if offset is None:
                    break
            
            return max_id + 1
            
        except Exception as e:
            print(f"Error getting next ID: {e}")
            return 0
    
    def _load_pdf(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """
        Load text content from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of document dictionaries with content and metadata
        """
        try:
            # Try PyMuPDFLoader first (fast and reliable)
            try:
                loader = PyMuPDFLoader(str(pdf_path))
                documents = loader.load()
            except Exception:
                # Fallback to UnstructuredPDFLoader
                loader = UnstructuredPDFLoader(str(pdf_path))
                documents = loader.load()
            
            # Enhance metadata
            for doc in documents:
                doc.metadata["filename"] = pdf_path.name
                doc.metadata["filepath"] = str(pdf_path)
                doc.metadata["ingestion_time"] = datetime.now().isoformat()
            
            # Convert to standardized format
            return [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in documents
            ]
        except Exception as e:
            raise Exception(f"Failed to load PDF: {e}")
    
    def ingest_document(self, pdf_path: Path, batch_size: int = 64) -> Dict[str, Any]:
        """
        Ingest a single PDF document into the vector database.
        
        Args:
            pdf_path: Path to the PDF file
            batch_size: Number of chunks to process per batch
            
        Returns:
            Dictionary with ingestion statistics:
                - pages: Number of pages processed
                - chunks: Number of text chunks created
                - vectors: Number of vectors stored
                - elapsed_time: Processing time in seconds
        """
        import time
        start_time = time.time()
        
        try:
            # Step 1: Load PDF
            documents = self._load_pdf(pdf_path)
            if not documents:
                raise Exception("No content extracted from PDF")
            
            # Step 2: Split into chunks
            all_chunks = []
            for doc_idx, doc in enumerate(documents):
                chunks = self.text_splitter.split_text(doc["content"])
                
                for chunk_idx, chunk in enumerate(chunks):
                    chunk_metadata = {
                        **doc["metadata"],
                        "chunk_id": chunk_idx,
                        "total_chunks": len(chunks),
                        "document_index": doc_idx,
                        "chunk_size": len(chunk),
                        "word_count": len(chunk.split())
                    }
                    
                    all_chunks.append({
                        "content": chunk,
                        "metadata": chunk_metadata
                    })
            
            if not all_chunks:
                raise Exception("No chunks created from document")
            
            # Step 3: Generate embeddings in batches
            points = []
            start_id = self._get_next_id()
            
            for batch_start in range(0, len(all_chunks), batch_size):
                batch_end = min(batch_start + batch_size, len(all_chunks))
                batch = all_chunks[batch_start:batch_end]
                batch_texts = [chunk["content"] for chunk in batch]
                
                # Generate embeddings
                batch_embeddings = self.embeddings.embed_documents(batch_texts)
                
                # Create points
                for j, (chunk, embedding) in enumerate(zip(batch, batch_embeddings)):
                    point_id = start_id + batch_start + j
                    
                    payload = {
                        "page_content": chunk["content"],
                        "metadata": {
                            "filename": pdf_path.name,
                            "filepath": str(pdf_path),
                            **chunk["metadata"]
                        }
                    }
                    
                    points.append(PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload=payload
                    ))
            
            # Step 4: Store in Qdrant
            if points:
                self.client.upsert(collection_name=COLLECTION_NAME, points=points)
            
            elapsed_time = time.time() - start_time
            
            return {
                "pages": len(documents),
                "chunks": len(all_chunks),
                "vectors": len(points),
                "elapsed_time": round(elapsed_time, 2)
            }
            
        except Exception as e:
            raise Exception(f"Ingestion failed: {e}")
    
    def delete_document(self, filename: str) -> int:
        """
        Delete all vectors associated with a document.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            Number of vectors deleted
        """
        try:
            # Get all points with matching filename
            points_to_delete = []
            offset = None
            
            while True:
                # Scroll through collection to find matching points
                points, offset = self.client.scroll(
                    collection_name=COLLECTION_NAME,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(
                                key="metadata.filename",
                                match=MatchValue(value=filename)
                            )
                        ]
                    ),
                    limit=100,
                    offset=offset,
                    with_payload=False,
                    with_vectors=False
                )
                
                if not points:
                    break
                
                points_to_delete.extend([point.id for point in points])
                
                if offset is None:
                    break
            
            # Delete all matching points
            if points_to_delete:
                self.client.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=points_to_delete
                )
            
            return len(points_to_delete)
            
        except Exception as e:
            raise Exception(f"Failed to delete document: {e}")
    
    def document_exists(self, filename: str) -> bool:
        """
        Check if a document already exists in the collection.
        
        Args:
            filename: Name of the file to check
            
        Returns:
            True if document exists, False otherwise
        """
        try:
            points, _ = self.client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="metadata.filename",
                            match=MatchValue(value=filename)
                        )
                    ]
                ),
                limit=1,
                with_payload=False,
                with_vectors=False
            )
            
            return len(points) > 0
            
        except Exception as e:
            print(f"Error checking document existence: {e}")
            return False
    
    def get_document_stats(self, filename: str) -> Optional[Dict[str, Any]]:
        """
        Get statistics for a specific document.
        
        Args:
            filename: Name of the file
            
        Returns:
            Dictionary with document statistics or None if not found
        """
        try:
            vector_count = 0
            metadata_sample = None
            offset = None
            
            while True:
                points, offset = self.client.scroll(
                    collection_name=COLLECTION_NAME,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(
                                key="metadata.filename",
                                match=MatchValue(value=filename)
                            )
                        ]
                    ),
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )
                
                if not points:
                    break
                
                vector_count += len(points)
                
                # Get metadata from first point
                if metadata_sample is None and points:
                    metadata_sample = points[0].payload.get("metadata", {})
                
                if offset is None:
                    break
            
            if vector_count > 0:
                return {
                    "filename": filename,
                    "vector_count": vector_count,
                    "ingestion_time": metadata_sample.get("ingestion_time") if metadata_sample else None
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting document stats: {e}")
            return None


# Singleton instance
_ingestion_service: Optional[DocumentIngestionService] = None

def get_ingestion_service() -> DocumentIngestionService:
    """
    Get or create the singleton ingestion service instance.
    
    Returns:
        DocumentIngestionService instance
    """
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = DocumentIngestionService()
    return _ingestion_service
