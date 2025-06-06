"""
LLM Proxy Service
"""
import asyncio
from typing import Dict, Any, Optional
import hashlib

from app.core.logging import get_logger
from app.cache import get_redis_cache, RedisCache

logger = get_logger(__name__)


class LLMProxyService:
    """
    A proxy service to route requests to different LLM providers.
    """

    def __init__(self, cache: RedisCache):
        # In a real application, you would initialize clients for different LLM providers here.
        # For example:
        # from app.llm.providers.anthropic_client import AnthropicClient
        # from app.llm.providers.mistral_client import MistralClient
        # self.anthropic_client = AnthropicClient()
        # self.mistral_client = MistralClient()
        self.cache = cache
        logger.info("LLMProxyService initialized.")

    async def route_request(self, provider: str, prompt: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Routes a request to the specified LLM provider, with caching.
        """
        if options is None:
            options = {}

        # Create a unique key for the request
        request_key = hashlib.md5(f"{provider}:{prompt}:{str(options)}".encode()).hexdigest()
        
        # Check cache first
        cached_response = self.cache.get(request_key)
        if cached_response:
            return cached_response

        logger.info(f"Routing request to provider: {provider}")

        if provider == "anthropic":
            # Replace with actual call to Anthropic client
            # response = await self.anthropic_client.generate(prompt, **options)
            response = {"provider": "anthropic", "response": f"Mock Anthropic response for: {prompt}"}
        elif provider == "mistral":
            # Replace with actual call to Mistral client
            # response = await self.mistral_client.generate(prompt, **options)
            response = {"provider": "mistral", "response": f"Mock Mistral response for: {prompt}"}
        else:
            logger.error(f"Unknown provider: {provider}")
            raise ValueError(f"Unknown LLM provider: {provider}")

        # Cache the response
        self.cache.set(request_key, response)

        return response


# Singleton instance
async def get_llm_proxy() -> LLMProxyService:
    """
    Dependency injector for the LLMProxyService.
    """
    cache = get_redis_cache()
    return LLMProxyService(cache)

if __name__ == '__main__':
    async def main():
        proxy = await get_llm_proxy()
        
        # Example usage
        anthropic_response = await proxy.route_request("anthropic", "Hello, world!")
        print(anthropic_response)
        
        mistral_response = await proxy.route_request("mistral", "Tell me a joke.")
        print(mistral_response)

    asyncio.run(main()) 