"""
Embeddings Generation Service
"""
import numpy as np
from typing import List
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    """
    A mock service for generating text embeddings.
    In a real application, this would use a model like Sentence-BERT or an API from OpenAI/Cohere.
    """

    def __init__(self, model_name: str = "mock-model", embedding_dim: int = 768):
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        logger.info(f"EmbeddingService initialized with model: {self.model_name} (mock).")

    async def create_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generates mock embeddings for a list of texts.
        """
        embeddings = [np.random.rand(self.embedding_dim).astype(np.float32) for _ in texts]
        logger.info(f"Generated {len(embeddings)} mock embeddings.")
        return embeddings


# Singleton instance
embedding_service = EmbeddingService()


async def get_embedding_service() -> EmbeddingService:
    """
    Dependency injector for the EmbeddingService.
    """
    return embedding_service 