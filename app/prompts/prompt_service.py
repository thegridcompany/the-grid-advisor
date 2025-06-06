"""
Service for assembling prompts.
"""
from typing import Dict, Any
from app.core.logging import get_logger
from app.prompts.roadmap_generator import ROADMAP_PROMPT_TEMPLATE
from app.prompts.tech_stack_generator import TECH_STACK_PROMPT_TEMPLATE
from app.prompts.hour_estimation_generator import HOUR_ESTIMATION_PROMPT_TEMPLATE
from app.rag.rag_service import get_rag_service, RAGService

logger = get_logger(__name__)


class PromptService:
    """
    Service for assembling prompts using templates and context.
    """

    def __init__(self, rag_service: RAGService):
        self.rag_service = rag_service
        logger.info("PromptService initialized.")

    async def assemble_roadmap_prompt(self, project_name: str, project_description: str) -> str:
        """
        Assembles the prompt for generating a project roadmap.
        """
        context = await self.rag_service.retrieve_context(query=project_description)
        
        prompt = ROADMAP_PROMPT_TEMPLATE.substitute(
            project_name=project_name,
            project_description=project_description,
            context=context
        )
        
        logger.info(f"Assembled roadmap prompt for project: {project_name}")
        return prompt

    async def assemble_tech_stack_prompt(self, project_name: str, project_description: str) -> str:
        """
        Assembles the prompt for generating a tech stack recommendation.
        """
        prompt = TECH_STACK_PROMPT_TEMPLATE.substitute(
            project_name=project_name,
            project_description=project_description,
        )
        
        logger.info(f"Assembled tech stack prompt for project: {project_name}")
        return prompt

    async def assemble_hour_estimation_prompt(self, project_name: str, project_description: str, project_roadmap: str) -> str:
        """
        Assembles the prompt for generating an hour estimation.
        """
        prompt = HOUR_ESTIMATION_PROMPT_TEMPLATE.substitute(
            project_name=project_name,
            project_description=project_description,
            project_roadmap=project_roadmap
        )
        
        logger.info(f"Assembled hour estimation prompt for project: {project_name}")
        return prompt


async def get_prompt_service() -> PromptService:
    """
    Dependency injector for the PromptService.
    """
    rag_service = await get_rag_service()
    return PromptService(rag_service) 