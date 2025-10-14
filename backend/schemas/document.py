"""
Document-related Pydantic schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentInfo(BaseModel):
    filename: str
    filepath: str
    size: int
    pages: Optional[int] = None
    ingestion_time: Optional[datetime] = None

class DocumentList(BaseModel):
    documents: List[DocumentInfo]
    total_count: int
