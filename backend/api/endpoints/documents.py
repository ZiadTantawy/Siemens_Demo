"""
API endpoints for user document upload and retrieval
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pathlib import Path
from typing import List, Optional
import os
import shutil
from datetime import datetime

from backend.schemas.document import (
    DocumentInfo, 
    DocumentList, 
    UploadResponse,
    DeleteResponse
)
from backend.services.document_ingestion import get_ingestion_service
from backend.core.config import SOURCE_DIR

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = Path(SOURCE_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def ingest_in_background(filepath: Path, filename: str):
    """Background task to ingest uploaded document"""
    try:
        service = get_ingestion_service()
        result = service.ingest_document(filepath)
        print(f"✅ Successfully ingested {filename}: {result}")
    except Exception as e:
        print(f"❌ Failed to ingest {filename}: {e}")


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    ingest_now: bool = True
):
    """
    Upload a PDF document and optionally ingest it into the vector database.
    
    Args:
        file: PDF file to upload
        ingest_now: Whether to ingest immediately (default: True)
        
    Returns:
        UploadResponse with upload status and document info
        
    Raises:
        HTTPException: If file is not a PDF or upload fails
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        
        # Check if file already exists
        service = get_ingestion_service()
        if service.document_exists(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Document '{file.filename}' already exists. Delete it first or rename your file."
            )
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = file_path.stat().st_size
        upload_time = datetime.now()
        
        # Create document info
        doc_info = DocumentInfo(
            filename=file.filename,
            filepath=str(file_path),
            size=file_size,
            upload_time=upload_time,
            status="uploaded" if not ingest_now else "processing"
        )
        
        # Optionally ingest in background
        if ingest_now:
            # Ingest immediately (synchronous)
            try:
                result = service.ingest_document(file_path)
                doc_info.pages = result.get("pages")
                doc_info.chunks = result.get("chunks")
                doc_info.vectors = result.get("vectors")
                doc_info.ingestion_time = datetime.now()
                doc_info.status = "completed"
                
                return UploadResponse(
                    success=True,
                    message=f"Document '{file.filename}' uploaded and ingested successfully. Created {result['vectors']} vectors from {result['chunks']} chunks.",
                    document=doc_info
                )
            except Exception as e:
                doc_info.status = "failed"
                doc_info.error = str(e)
                return UploadResponse(
                    success=False,
                    message=f"Document uploaded but ingestion failed: {e}",
                    document=doc_info
                )
        else:
            # Schedule background ingestion
            background_tasks.add_task(ingest_in_background, file_path, file.filename)
            
            return UploadResponse(
                success=True,
                message=f"Document '{file.filename}' uploaded successfully. Ingestion scheduled in background.",
                document=doc_info
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/list", response_model=DocumentList)
async def list_documents():
    """
    List all uploaded PDF documents with their metadata.
    
    Returns:
        DocumentList with all documents in the upload directory
    """
    try:
        documents = []
        service = get_ingestion_service()
        
        # Scan upload directory for PDF files
        for pdf_file in UPLOAD_DIR.glob("*.pdf"):
            file_size = pdf_file.stat().st_size
            
            # Get ingestion stats from Qdrant
            stats = service.get_document_stats(pdf_file.name)
            
            doc_info = DocumentInfo(
                filename=pdf_file.name,
                filepath=str(pdf_file),
                size=file_size,
                vectors=stats.get("vector_count") if stats else 0,
                status="completed" if stats else "uploaded",
                upload_time=datetime.fromtimestamp(pdf_file.stat().st_mtime),
                ingestion_time=datetime.fromisoformat(stats["ingestion_time"]) if stats and stats.get("ingestion_time") else None
            )
            documents.append(doc_info)
        
        # Sort by upload time (most recent first)
        documents.sort(key=lambda x: x.upload_time, reverse=True)
        
        return DocumentList(
            documents=documents,
            total_count=len(documents)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete("/delete/{filename}", response_model=DeleteResponse)
async def delete_document(filename: str):
    """
    Delete a document from both disk and vector database.
    
    Args:
        filename: Name of the file to delete
        
    Returns:
        DeleteResponse with deletion status
        
    Raises:
        HTTPException: If file not found or deletion fails
    """
    try:
        file_path = UPLOAD_DIR / filename
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Document '{filename}' not found"
            )
        
        # Delete from vector database
        service = get_ingestion_service()
        vectors_deleted = service.delete_document(filename)
        
        # Delete from disk
        file_path.unlink()
        
        return DeleteResponse(
            success=True,
            message=f"Document '{filename}' deleted successfully. Removed {vectors_deleted} vectors.",
            deleted_filename=filename,
            vectors_deleted=vectors_deleted
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.get("/{filename}", response_model=DocumentInfo)
async def get_document_info(filename: str):
    """
    Get detailed information about a specific document.
    
    Args:
        filename: Name of the file
        
    Returns:
        DocumentInfo with full metadata
        
    Raises:
        HTTPException: If document not found
    """
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Document '{filename}' not found"
            )
        
        service = get_ingestion_service()
        stats = service.get_document_stats(filename)
        file_size = file_path.stat().st_size
        
        return DocumentInfo(
            filename=filename,
            filepath=str(file_path),
            size=file_size,
            vectors=stats.get("vector_count") if stats else 0,
            status="completed" if stats else "uploaded",
            upload_time=datetime.fromtimestamp(file_path.stat().st_mtime),
            ingestion_time=datetime.fromisoformat(stats["ingestion_time"]) if stats and stats.get("ingestion_time") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document info: {str(e)}"
        )

