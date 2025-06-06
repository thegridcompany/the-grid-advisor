"""
RAG Service
"""
from typing import List, Dict, Any
from app.core.logging import get_logger
from app.rag.vector_db import get_vector_db, VectorDBClient
from app.rag.embedding_service import get_embedding_service, EmbeddingService
import uuid

logger = get_logger(__name__)


class RAGService:
    """
    Service for Retrieval-Augmented Generation.
    """

    def __init__(self, vector_db: VectorDBClient, embedding_service: EmbeddingService):
        self.vector_db = vector_db
        self.embedding_service = embedding_service
        logger.info("RAGService initialized.")

    async def add_document(self, content: str, metadata: Dict[str, Any]):
        """
        Adds a document to the RAG system.
        This involves chunking the document, creating embeddings, and upserting to the vector DB.
        """
        # Simple chunking strategy (split by newline)
        chunks = content.split('\\n')
        
        if not chunks:
            logger.warning("Document content is empty or has no chunks.")
            return

        embeddings = await self.embedding_service.create_embeddings(chunks)
        ids = [str(uuid.uuid4()) for _ in chunks]
        
        chunk_metadata = [{**metadata, "chunk_text": chunk} for chunk in chunks]

        await self.vector_db.upsert(vectors=embeddings, ids=ids, metadata=chunk_metadata)
        logger.info(f"Added document with {len(chunks)} chunks.")

    async def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """
        Retrieves relevant context for a given query.
        """
        query_embedding = (await self.embedding_service.create_embeddings([query]))[0]
        search_results = await self.vector_db.search(query_embedding, top_k=top_k)

        context = "\\n".join([result['metadata'].get('chunk_text', '') for result in search_results])
        logger.info(f"Retrieved context for query: '{query}'")
        return context


async def get_rag_service() -> RAGService:
    """
    Dependency injector for the RAGService.
    """
    vector_db = await get_vector_db()
    embedding_service = await get_embedding_service()
    return RAGService(vector_db, embedding_service) 