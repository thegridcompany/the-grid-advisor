"""
Vector Database Client
"""
import numpy as np
from typing import List, Dict, Any, Optional
from app.core.logging import get_logger

logger = get_logger(__name__)


class VectorDBClient:
    """
    A mock client for a vector database.
    In a real application, this would interface with a service like FAISS, Chroma, or Pinecone.
    """

    def __init__(self):
        self._vectors: Dict[str, np.ndarray] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        logger.info("VectorDBClient initialized (mock).")

    async def upsert(self, vectors: List[np.ndarray], ids: List[str], metadata: List[Dict[str, Any]]):
        """
        Upserts vectors into the mock database.
        """
        for i, vector_id in enumerate(ids):
            self._vectors[vector_id] = vectors[i]
            self._metadata[vector_id] = metadata[i]
        logger.info(f"Upserted {len(ids)} vectors.")

    async def search(self, query_vector: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches for similar vectors in the mock database.
        """
        if not self._vectors:
            return []

        # Calculate cosine similarity
        all_vectors = np.array(list(self._vectors.values()))
        similarities = np.dot(all_vectors, query_vector) / (np.linalg.norm(all_vectors, axis=1) * np.linalg.norm(query_vector))

        # Get top_k results
        sorted_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        vector_ids = list(self._vectors.keys())
        for i in sorted_indices:
            vector_id = vector_ids[i]
            results.append({
                "id": vector_id,
                "score": similarities[i],
                "metadata": self._metadata.get(vector_id, {})
            })
            
        logger.info(f"Found {len(results)} similar vectors for query.")
        return results


# Singleton instance
vector_db_client = VectorDBClient()


async def get_vector_db() -> VectorDBClient:
    """
    Dependency injector for the VectorDBClient.
    """
    return vector_db_client 