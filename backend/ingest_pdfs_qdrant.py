#!/usr/bin/env python3
"""
================================================================================
PRODUCTION-GRADE RAG INGESTION PIPELINE FOR PDF DOCUMENTS
================================================================================

This script implements a complete RAG (Retrieval-Augmented Generation) ingestion
pipeline that processes PDF documents and stores them as searchable vectors in
Qdrant vector database.

WORKFLOW OVERVIEW:
1. PDF Loading: Extracts text from PDF files using PyMuPDFLoader
2. Text Chunking: Splits documents into semantically meaningful chunks
3. Embedding Generation: Creates vector embeddings using HuggingFace models
4. Vector Storage: Stores embeddings and metadata in Qdrant collection
5. Progress Tracking: Provides real-time progress and comprehensive reporting

TECHNICAL STACK:
- LangChain: Document loading and text processing
- HuggingFace: Local embedding generation (no API costs)
- Qdrant: High-performance vector database
- PyMuPDF: Robust PDF text extraction
- tqdm: Progress tracking and user feedback

USAGE:
    # Set environment variables (see .env file for configuration)
    python ingest_pdfs_qdrant.py

CONFIGURATION:
    All settings are loaded from .env file or environment variables:
    - EMBEDDING_MODEL: HuggingFace model for embeddings (default: BAAI/bge-base-en-v1.5)
    - QDRANT_URL: Qdrant server URL (default: http://localhost:6333)
    - COLLECTION_NAME: Target collection name (default: pdf_docs)
    - SOURCE_DIR: PDF source directory (default: ./pdfs)
    - CHUNK_SIZE: Text chunk size in characters (default: 800)
    - CHUNK_OVERLAP: Overlap between chunks (default: 150)
    - BATCH_SIZE: Embedding batch size (default: 64)

REQUIREMENTS:
    - PDF files placed in ./pdfs directory
    - Qdrant server running (Docker: docker-compose up -d)
    - Internet connection for initial HuggingFace model download
    - Sufficient disk space for model cache and vector storage

OUTPUT:
    - JSON summary with processing statistics
    - Vectors stored in Qdrant collection
    - Metadata including filename, chunk info, and timestamps
    - Error handling and graceful failure recovery

AUTHOR: Production RAG System
VERSION: 1.0.0
================================================================================
"""

# ============================================================================
# IMPORTS AND DEPENDENCIES
# ============================================================================

# Standard library imports
import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# Environment configuration
from dotenv import load_dotenv

# Load environment variables from .env file
# This allows configuration without hardcoding sensitive information
load_dotenv()

# LangChain imports for document processing
from langchain_community.document_loaders import UnstructuredPDFLoader, PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# HuggingFace for local embedding generation (no API costs)
from langchain_huggingface import HuggingFaceEmbeddings

# Qdrant vector database client and models
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Progress tracking for user feedback
from tqdm import tqdm


# ============================================================================
# CONFIGURATION MANAGEMENT
# ============================================================================

def get_config() -> Dict[str, Any]:
    """
    Load and validate configuration from environment variables.
    
    This function centralizes all configuration management, providing sensible
    defaults for all parameters while allowing customization via environment
    variables or .env file.
    
    Returns:
        Dict[str, Any]: Configuration dictionary with all necessary parameters
        
    Configuration Parameters:
        - embedding_model: HuggingFace model for generating embeddings
        - qdrant_url: Qdrant server connection URL
        - qdrant_api_key: Optional API key for Qdrant authentication
        - collection_name: Target collection name in Qdrant
        - source_dir: Directory containing PDF files to process
        - chunk_size: Maximum size of text chunks in characters
        - chunk_overlap: Number of characters to overlap between chunks
        - batch_size: Number of chunks to process in each embedding batch
    """
    return {
        # HuggingFace embedding model (local, no API costs)
        "embedding_model": os.getenv("EMBEDDING_MODEL", "BAAI/bge-base-en-v1.5"),
        
        # Qdrant vector database configuration
        "qdrant_url": os.getenv("QDRANT_URL", "http://localhost:6333"),
        "qdrant_api_key": os.getenv("QDRANT_API_KEY"),  # Optional for local setup
        "collection_name": os.getenv("COLLECTION_NAME", "pdf_docs"),
        
        # File processing configuration
        "source_dir": os.getenv("SOURCE_DIR", "./pdfs"),
        
        # Text chunking parameters
        "chunk_size": int(os.getenv("CHUNK_SIZE", "800")),      # Optimal for most use cases
        "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", "150")), # Maintains context between chunks
        "batch_size": int(os.getenv("BATCH_SIZE", "64")),       # Balance between speed and memory
    }


# ============================================================================
# QDRANT COLLECTION MANAGEMENT
# ============================================================================

def ensure_collection(client: QdrantClient, collection_name: str, embedding_dim: int) -> None:
    """
    Ensure Qdrant collection exists with proper configuration.
    
    This function checks if the target collection exists and creates it if necessary.
    It configures the collection with the correct vector dimensions and distance
    metric for optimal similarity search performance.
    
    Args:
        client (QdrantClient): Connected Qdrant client instance
        collection_name (str): Name of the collection to create/verify
        embedding_dim (int): Dimension of the embedding vectors
        
    Raises:
        Exception: If collection creation fails or client connection issues
        
    Collection Configuration:
        - Vector size: Matches embedding model output dimension
        - Distance metric: COSINE (optimal for semantic similarity)
        - Indexing: Automatic for fast similarity search
    """
    try:
        # Get list of existing collections
        collections = client.get_collections()
        existing_names = [col.name for col in collections.collections]
        
        if collection_name not in existing_names:
            print(f"Creating collection '{collection_name}' with {embedding_dim} dimensions...")
            
            # Create collection with optimized settings
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=embedding_dim,           # Match embedding model output
                    distance=Distance.COSINE      # Best for semantic similarity
                )
            )
            print(f"Collection '{collection_name}' created successfully.")
        else:
            print(f"Collection '{collection_name}' already exists.")
            
    except Exception as e:
        print(f"Error ensuring collection: {e}")
        raise


# ============================================================================
# PDF DOCUMENT PROCESSING
# ============================================================================

def load_pdf_documents(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Load and extract text content from a single PDF file.
    
    This function handles PDF text extraction with robust error handling and
    fallback mechanisms. It tries multiple PDF loaders to ensure maximum
    compatibility with different PDF formats and structures.
    
    Args:
        pdf_path (Path): Path to the PDF file to process
        
    Returns:
        List[Dict[str, Any]]: List of document dictionaries with content and metadata
        Each dictionary contains:
            - content: Extracted text content
            - metadata: File information and processing timestamps
            
    Processing Strategy:
        1. Try UnstructuredPDFLoader (handles complex layouts)
        2. Fallback to PyMuPDFLoader (fast and reliable)
        3. Add comprehensive metadata for tracking
        4. Return empty list on complete failure
        
    Metadata Added:
        - filename: Original PDF filename
        - filepath: Full path to the source file
        - ingestion_time: ISO timestamp of processing
        - Original PDF metadata (if available)
    """
    try:
        # Strategy 1: Try UnstructuredPDFLoader (handles complex layouts)
        try:
            loader = UnstructuredPDFLoader(str(pdf_path))
            documents = loader.load()
            print(f"  ✓ Loaded with UnstructuredPDFLoader")
        except Exception as e:
            # Strategy 2: Fallback to PyMuPDFLoader (fast and reliable)
            print(f"  ⚠ UnstructuredPDFLoader failed, trying PyMuPDFLoader: {e}")
            try:
                loader = PyMuPDFLoader(str(pdf_path))
                documents = loader.load()
                print(f"  ✓ Loaded with PyMuPDFLoader")
            except Exception as e2:
                print(f"  ✗ Both loaders failed: {e2}")
                return []
        
        # Enhance metadata with processing information
        for doc in documents:
            # Add file tracking metadata
            doc.metadata["filename"] = pdf_path.name
            doc.metadata["filepath"] = str(pdf_path)
            doc.metadata["ingestion_time"] = datetime.now().isoformat()
            
            # Add processing statistics
            doc.metadata["content_length"] = len(doc.page_content)
            doc.metadata["word_count"] = len(doc.page_content.split())
        
        # Convert to standardized format
        processed_docs = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            } 
            for doc in documents
        ]
        
        print(f"  ✓ Extracted {len(processed_docs)} pages, {sum(len(doc['content']) for doc in processed_docs)} total characters")
        return processed_docs
    
    except Exception as e:
        print(f"Error loading PDF {pdf_path}: {e}")
        return []


# ============================================================================
# MAIN PDF INGESTION FUNCTION
# ============================================================================

def ingest_pdf(pdf_path: Path, text_splitter: RecursiveCharacterTextSplitter, 
               embeddings: HuggingFaceEmbeddings, client: QdrantClient, 
               collection_name: str, batch_size: int) -> Dict[str, int]:
    """
    Process a single PDF file through the complete RAG ingestion pipeline.
    
    This is the core function that orchestrates the entire ingestion process
    for a single PDF file, from text extraction to vector storage.
    
    Args:
        pdf_path (Path): Path to the PDF file to process
        text_splitter (RecursiveCharacterTextSplitter): Configured text splitter
        embeddings (HuggingFaceEmbeddings): Embedding model instance
        client (QdrantClient): Connected Qdrant client
        collection_name (str): Target collection name
        batch_size (int): Number of chunks to process per batch
        
    Returns:
        Dict[str, int]: Processing statistics with chunk and vector counts
        
    Processing Pipeline:
        1. PDF Text Extraction: Load and extract text from PDF
        2. Text Chunking: Split content into semantic chunks
        3. Batch Embedding: Generate vector embeddings in batches
        4. Vector Storage: Store embeddings and metadata in Qdrant
        5. Error Handling: Graceful failure with detailed logging
        
    Performance Optimizations:
        - Batch processing for efficient embedding generation
        - Memory-efficient chunking to handle large documents
        - Atomic upserts to ensure data consistency
        - Comprehensive error handling and recovery
    """
    print(f"\n📄 Processing: {pdf_path.name}")
    
    # ========================================================================
    # STEP 1: PDF TEXT EXTRACTION
    # ========================================================================
    documents = load_pdf_documents(pdf_path)
    if not documents:
        print(f"  ✗ No content extracted from {pdf_path.name}")
        return {"chunks": 0, "vectors": 0}
    
    # ========================================================================
    # STEP 2: TEXT CHUNKING
    # ========================================================================
    print(f"  🔄 Splitting text into semantic chunks...")
    all_chunks = []
    
    for doc_idx, doc in enumerate(documents):
        # Split document content into chunks
        chunks = text_splitter.split_text(doc["content"])
        
        # Enhance each chunk with metadata
        for chunk_idx, chunk in enumerate(chunks):
            chunk_metadata = {
                **doc["metadata"],                    # Inherit document metadata
                "chunk_id": chunk_idx,                # Chunk index within document
                "total_chunks": len(chunks),          # Total chunks in document
                "document_index": doc_idx,            # Document index in PDF
                "chunk_size": len(chunk),             # Character count
                "word_count": len(chunk.split())      # Word count
            }
            
            all_chunks.append({
                "content": chunk,
                "metadata": chunk_metadata
            })
    
    if not all_chunks:
        print(f"  ✗ No chunks created from {pdf_path.name}")
        return {"chunks": 0, "vectors": 0}
    
    print(f"  ✓ Created {len(all_chunks)} chunks from {len(documents)} pages")
    
    # ========================================================================
    # STEP 3: BATCH EMBEDDING GENERATION
    # ========================================================================
    print(f"  🧠 Generating embeddings in batches of {batch_size}...")
    points = []
    
    for batch_start in range(0, len(all_chunks), batch_size):
        batch_end = min(batch_start + batch_size, len(all_chunks))
        batch = all_chunks[batch_start:batch_end]
        batch_texts = [chunk["content"] for chunk in batch]
        
        try:
            # Generate embeddings for the batch
            batch_embeddings = embeddings.embed_documents(batch_texts)
            
            # Create Qdrant points for each chunk
            for j, (chunk, embedding) in enumerate(zip(batch, batch_embeddings)):
                # Use sequential numeric IDs for optimal performance
                point_id = batch_start + j
                
                # Create comprehensive payload with all metadata
                payload = {
                    "content": chunk["content"],           # Original text content
                    "filename": pdf_path.name,             # Source filename
                    "filepath": str(pdf_path),             # Full file path
                    **chunk["metadata"]                     # All chunk metadata
                }
                
                points.append(PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                ))
                
        except Exception as e:
            print(f"  ⚠ Error embedding batch {batch_start//batch_size + 1}: {e}")
            continue
    
    if not points:
        print(f"  ✗ No embeddings generated for {pdf_path.name}")
        return {"chunks": len(all_chunks), "vectors": 0}
    
    print(f"  ✓ Generated {len(points)} embeddings")
    
    # ========================================================================
    # STEP 4: VECTOR STORAGE IN QDRANT
    # ========================================================================
    print(f"  💾 Storing vectors in Qdrant collection '{collection_name}'...")
    
    try:
        # Atomic upsert operation for data consistency
        client.upsert(collection_name=collection_name, points=points)
        print(f"  ✓ Successfully stored {len(points)} vectors")
        
    except Exception as e:
        print(f"  ✗ Error storing vectors: {e}")
        return {"chunks": len(all_chunks), "vectors": 0}
    
    # ========================================================================
    # STEP 5: RETURN PROCESSING STATISTICS
    # ========================================================================
    return {
        "chunks": len(all_chunks),
        "vectors": len(points)
    }


# ============================================================================
# MAIN INGESTION PIPELINE ORCHESTRATOR
# ============================================================================

def main():
    """
    Main ingestion pipeline orchestrator.
    
    This function coordinates the entire RAG ingestion process, from initialization
    to completion. It handles configuration loading, component setup, file discovery,
    batch processing, and comprehensive reporting.
    
    Pipeline Flow:
        1. Configuration Loading: Load settings from environment
        2. Component Initialization: Setup embeddings, Qdrant client, text splitter
        3. Collection Management: Ensure target collection exists
        4. File Discovery: Find and validate PDF files
        5. Batch Processing: Process each PDF through the ingestion pipeline
        6. Progress Tracking: Real-time progress with tqdm
        7. Comprehensive Reporting: Detailed JSON summary and statistics
        
    Error Handling:
        - Graceful failure at each step
        - Detailed error messages for troubleshooting
        - Partial success reporting (some files may fail)
        - Configuration validation before processing
        
    Performance Features:
        - Batch processing for memory efficiency
        - Progress tracking for user feedback
        - Timing measurements for performance analysis
        - Comprehensive statistics for monitoring
    """
    # ========================================================================
    # INITIALIZATION AND TIMING
    # ========================================================================
    start_time = time.time()
    print("🚀 Starting RAG Ingestion Pipeline")
    print("=" * 60)
    
    # ========================================================================
    # STEP 1: CONFIGURATION LOADING
    # ========================================================================
    print("📋 Loading configuration...")
    config = get_config()
    print(f"  ✓ Configuration loaded successfully")
    print(f"  ✓ Embedding model: {config['embedding_model']}")
    print(f"  ✓ Qdrant URL: {config['qdrant_url']}")
    print(f"  ✓ Collection: {config['collection_name']}")
    print(f"  ✓ Source directory: {config['source_dir']}")
    print(f"  ✓ Chunk size: {config['chunk_size']} chars")
    print(f"  ✓ Chunk overlap: {config['chunk_overlap']} chars")
    print(f"  ✓ Batch size: {config['batch_size']}")
    
    # ========================================================================
    # STEP 2: EMBEDDING MODEL INITIALIZATION
    # ========================================================================
    print("\n🧠 Initializing embedding model...")
    try:
        # Initialize HuggingFace embeddings with optimized settings
        embeddings = HuggingFaceEmbeddings(
            model_name=config["embedding_model"],
            model_kwargs={"device": "cpu"},                    # Use CPU for compatibility
            encode_kwargs={
                "normalize_embeddings": True,                  # Normalize for cosine similarity
                "batch_size": 32                              # Optimize for memory usage
            }
        )
        print(f"  ✓ Embedding model '{config['embedding_model']}' initialized")
        
        # Test embedding generation and get dimension
        test_embedding = embeddings.embed_query("test")
        embedding_dim = len(test_embedding)
        print(f"  ✓ Embedding dimension: {embedding_dim}")
        
    except Exception as e:
        print(f"  ✗ ERROR: Failed to initialize embedding model: {e}")
        return
    
    # ========================================================================
    # STEP 3: QDRANT CLIENT SETUP
    # ========================================================================
    print("\n🗄️  Connecting to Qdrant vector database...")
    try:
        client = QdrantClient(
            url=config["qdrant_url"],
            api_key=config["qdrant_api_key"] if config["qdrant_api_key"] else None
        )
        print(f"  ✓ Connected to Qdrant at {config['qdrant_url']}")
        
        # Ensure target collection exists with proper configuration
        ensure_collection(client, config["collection_name"], embedding_dim)
        
    except Exception as e:
        print(f"  ✗ ERROR: Failed to connect to Qdrant: {e}")
        return
    
    # ========================================================================
    # STEP 4: TEXT SPLITTER CONFIGURATION
    # ========================================================================
    print("\n✂️  Configuring text splitter...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config["chunk_size"],                      # Optimal chunk size
        chunk_overlap=config["chunk_overlap"],                # Maintain context
        length_function=len,                                  # Character-based splitting
    )
    print(f"  ✓ Text splitter configured (chunk_size={config['chunk_size']}, overlap={config['chunk_overlap']})")
    
    # ========================================================================
    # STEP 5: PDF FILE DISCOVERY
    # ========================================================================
    print(f"\n📁 Discovering PDF files in '{config['source_dir']}'...")
    source_path = Path(config["source_dir"])
    
    if not source_path.exists():
        print(f"  ✗ ERROR: Source directory '{source_path}' does not exist")
        return
    
    pdf_files = list(source_path.glob("*.pdf"))
    if not pdf_files:
        print(f"  ✗ ERROR: No PDF files found in '{source_path}'")
        return
    
    print(f"  ✓ Found {len(pdf_files)} PDF files:")
    for pdf_file in pdf_files:
        file_size = pdf_file.stat().st_size
        print(f"    - {pdf_file.name} ({file_size:,} bytes)")
    
    # ========================================================================
    # STEP 6: BATCH PDF PROCESSING
    # ========================================================================
    print(f"\n🔄 Starting batch processing of {len(pdf_files)} PDF files...")
    print("=" * 60)
    
    # Initialize processing statistics
    total_chunks = 0
    total_vectors = 0
    processed_files = 0
    failed_files = 0
    
    # Process each PDF file with progress tracking
    for pdf_file in tqdm(pdf_files, desc="Processing PDFs", unit="file"):
        try:
            # Process individual PDF through complete pipeline
            result = ingest_pdf(
                pdf_file, text_splitter, embeddings, client,
                config["collection_name"], config["batch_size"]
            )
            
            # Update statistics
            total_chunks += result["chunks"]
            total_vectors += result["vectors"]
            processed_files += 1
            
            if result["vectors"] == 0:
                failed_files += 1
                
        except Exception as e:
            print(f"\n  ✗ ERROR processing {pdf_file.name}: {e}")
            failed_files += 1
            continue
    
    # ========================================================================
    # STEP 7: COMPREHENSIVE REPORTING
    # ========================================================================
    elapsed_time = time.time() - start_time
    
    # Generate detailed summary
    summary = {
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "elapsed_time_seconds": round(elapsed_time, 2),
        "processing_rate_files_per_second": round(processed_files / elapsed_time, 2),
        "processing_rate_vectors_per_second": round(total_vectors / elapsed_time, 2),
        "total_files": len(pdf_files),
        "processed_files": processed_files,
        "failed_files": failed_files,
        "success_rate_percent": round((processed_files / len(pdf_files)) * 100, 1),
        "total_chunks": total_chunks,
        "total_vectors": total_vectors,
        "average_chunks_per_file": round(total_chunks / processed_files, 1) if processed_files > 0 else 0,
        "average_vectors_per_file": round(total_vectors / processed_files, 1) if processed_files > 0 else 0,
        "collection_name": config["collection_name"],
        "qdrant_url": config["qdrant_url"],
        "embedding_model": config["embedding_model"],
        "embedding_dimension": embedding_dim,
        "chunk_size": config["chunk_size"],
        "chunk_overlap": config["chunk_overlap"],
        "batch_size": config["batch_size"]
    }
    
    # Display comprehensive summary
    print("\n" + "=" * 60)
    print("📊 INGESTION PIPELINE SUMMARY")
    print("=" * 60)
    print(json.dumps(summary, indent=2))
    print("=" * 60)
    
    # Final status message
    if total_vectors > 0:
        print(f"✅ SUCCESS: Ingested {total_vectors} vectors from {processed_files} files")
        print(f"⚡ Performance: {summary['processing_rate_vectors_per_second']} vectors/second")
        print(f"📈 Success rate: {summary['success_rate_percent']}%")
        print(f"🎯 Ready for RAG queries in collection '{config['collection_name']}'")
    else:
        print("⚠️  WARNING: No vectors were ingested")
        print("🔍 Check your PDF files, configuration, and Qdrant connection")
    
    print("=" * 60)


# ============================================================================
# MAIN EXECUTION BLOCK
# ============================================================================

if __name__ == "__main__":
    """
    Main execution block for the RAG ingestion pipeline.
    
    This block ensures the script can be run directly from the command line
    and provides a clean entry point for the ingestion process.
    
    Usage:
        python ingest_pdfs_qdrant.py
        
    Prerequisites:
        - Docker services running (docker-compose up -d)
        - PDF files in ./pdfs directory
        - .env file configured with necessary settings
        - Required Python packages installed
        
    Exit Codes:
        - 0: Successful completion
        - 1: Error during processing (handled gracefully)
    """
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        print("🔄 Partial results may be available in Qdrant")
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        print("🔍 Check logs and configuration for troubleshooting")
        exit(1)
