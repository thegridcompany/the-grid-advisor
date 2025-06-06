"""
Celery tasks for LLM operations.
"""
from app.celery_worker import celery_app
from app.llm.proxy import get_llm_proxy
from app.core.logging import get_logger
from typing import Dict, Any, Optional

logger = get_logger(__name__)


@celery_app.task(name="llm.generate_text")
def generate_text_task(provider: str, prompt: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Celery task to generate text using the LLM proxy.
    """
    logger.info(f"Received task to generate text with provider: {provider}")
    
    # In a real application, you would handle asyncio differently when calling from a sync Celery task.
    # For simplicity, we'll just run the async function directly here.
    # This is not ideal for production but serves for this example.
    import asyncio
    
    async def run_async():
        proxy = await get_llm_proxy()
        return await proxy.route_request(provider, prompt, options)

    # This is a blocking call. For real-world use, consider using async Celery workers
    # or a separate process to manage the asyncio event loop.
    result = asyncio.run(run_async())
    
    logger.info(f"Task completed. Result: {result}")
    return result 