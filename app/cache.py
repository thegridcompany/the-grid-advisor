"""
Redis Cache
"""
import redis
import json
from typing import Optional, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RedisCache:
    """
    A simple Redis cache client.
    """

    def __init__(self, redis_url: str):
        self.redis_client = redis.from_url(redis_url)
        logger.info("RedisCache initialized.")

    def get(self, key: str) -> Optional[Any]:
        """
        Gets a value from the cache.
        """
        value = self.redis_client.get(key)
        if value:
            logger.info(f"Cache hit for key: {key}")
            return json.loads(value)
        logger.info(f"Cache miss for key: {key}")
        return None

    def set(self, key: str, value: Any, ex: int = 3600):
        """
        Sets a value in the cache.
        """
        self.redis_client.set(key, json.dumps(value), ex=ex)
        logger.info(f"Set cache for key: {key}")


# Singleton instance
redis_cache = RedisCache(settings.redis_url)


def get_redis_cache() -> RedisCache:
    """
    Dependency injector for the RedisCache.
    """
    return redis_cache 