"""
API endpoints for RAG operations.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.rag.rag_service import get_rag_service, RAGService
from app.api.auth import get_current_active_user
from app.db.models import User

router = APIRouter()


class AddDocumentRequest(BaseModel):
    content: str
    metadata: Dict[str, Any]


class RetrieveContextRequest(BaseModel):
    query: str
    top_k: int = 3


class RetrieveContextResponse(BaseModel):
    context: str


@router.post("/documents", status_code=201)
async def add_document(
    request: AddDocumentRequest,
    rag_service: RAGService = Depends(get_rag_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint to add a document to the RAG system.
    """
    try:
        await rag_service.add_document(request.content, request.metadata)
        return {"message": "Document added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/context", response_model=RetrieveContextResponse)
async def retrieve_context(
    request: RetrieveContextRequest,
    rag_service: RAGService = Depends(get_rag_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint to retrieve context for a query from the RAG system.
    """
    try:
        context = await rag_service.retrieve_context(request.query, request.top_k)
        return {"context": context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 