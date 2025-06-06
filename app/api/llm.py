"""
API endpoints for LLM operations.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.llm.tasks import generate_text_task
from app.api.auth import get_current_active_user
from app.db.models import User
from app.prompts.prompt_service import get_prompt_service, PromptService

router = APIRouter()


class LLMRequest(BaseModel):
    provider: str
    project_name: str
    project_description: str
    options: Optional[Dict[str, Any]] = None


class HourEstimationRequest(LLMRequest):
    project_roadmap: str


class LLMResponse(BaseModel):
    task_id: str
    status: str
    message: str


@router.post("/generate_roadmap", response_model=LLMResponse, status_code=202)
async def generate_roadmap(
    request: LLMRequest,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint to trigger roadmap generation via Celery task.
    """
    try:
        prompt = await prompt_service.assemble_roadmap_prompt(
            request.project_name, request.project_description
        )
        task = generate_text_task.delay(request.provider, prompt, request.options)
        return {
            "task_id": task.id,
            "status": "processing",
            "message": "Roadmap generation task has been submitted."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate_tech_stack", response_model=LLMResponse, status_code=202)
async def generate_tech_stack(
    request: LLMRequest,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint to trigger tech stack recommendation via Celery task.
    """
    try:
        prompt = await prompt_service.assemble_tech_stack_prompt(
            request.project_name, request.project_description
        )
        task = generate_text_task.delay(request.provider, prompt, request.options)
        return {
            "task_id": task.id,
            "status": "processing",
            "message": "Tech stack recommendation task has been submitted."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate_hour_estimation", response_model=LLMResponse, status_code=202)
async def generate_hour_estimation(
    request: HourEstimationRequest,
    prompt_service: PromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint to trigger hour estimation via Celery task.
    """
    try:
        prompt = await prompt_service.assemble_hour_estimation_prompt(
            request.project_name, request.project_description, request.project_roadmap
        )
        task = generate_text_task.delay(request.provider, prompt, request.options)
        return {
            "task_id": task.id,
            "status": "processing",
            "message": "Hour estimation task has been submitted."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 