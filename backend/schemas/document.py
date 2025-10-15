"""
Document-related Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DocumentInfo(BaseModel):
    """Information about an uploaded document"""
    filename: str = Field(..., description="Original filename")
    filepath: str = Field(..., description="Full path to the file")
    size: int = Field(..., description="File size in bytes")
    pages: Optional[int] = Field(None, description="Number of pages (for PDFs)")
    chunks: Optional[int] = Field(None, description="Number of text chunks created")
    vectors: Optional[int] = Field(None, description="Number of vectors stored")
    upload_time: datetime = Field(default_factory=datetime.now, description="Upload timestamp")
    ingestion_time: Optional[datetime] = Field(None, description="Ingestion completion time")
    status: str = Field(default="uploaded", description="Status: uploaded, processing, completed, failed")
    error: Optional[str] = Field(None, description="Error message if ingestion failed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "transformer_paper.pdf",
                "filepath": "/path/to/pdfs/transformer_paper.pdf",
                "size": 1024000,
                "pages": 15,
                "chunks": 42,
                "vectors": 42,
                "upload_time": "2025-10-15T10:30:00",
                "ingestion_time": "2025-10-15T10:30:15",
                "status": "completed",
                "error": None
            }
        }

class DocumentList(BaseModel):
    """List of documents with metadata"""
    documents: List[DocumentInfo]
    total_count: int

class UploadResponse(BaseModel):
    """Response after document upload"""
    success: bool
    message: str
    document: Optional[DocumentInfo] = None
    
class DeleteResponse(BaseModel):
    """Response after document deletion"""
    success: bool
    message: str
    deleted_filename: str
    vectors_deleted: int = 0
