"""
API endpoints for managing proposals.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Dict, Any
import json

from app.services.templating.engine import template_engine
from app.services.pdf.generator import pdf_generator

router = APIRouter()

def prose2markdown(content: Dict[str, Any]) -> str:
    """
    Convert prosemirror/editor content to markdown.
    This is a simple implementation - could be enhanced based on actual editor format.
    """
    if isinstance(content, dict):
        # If it's a complex editor structure, try to extract text
        if 'content' in content:
            return str(content['content'])
        elif 'text' in content:
            return str(content['text'])
        else:
            # Return JSON as formatted text for now
            return json.dumps(content, indent=2)
    elif isinstance(content, str):
        return content
    else:
        return str(content)

class ProposalRequest(BaseModel):
    title: str
    client_name: str
    content: Dict[str, Any] # This will be the JSON from the editor

@router.post("/proposals", response_model=Dict[str, str])
async def create_proposal(proposal: ProposalRequest):
    """
    Create a new proposal and return the rendered markdown.
    """
    try:
        context = {
            "title": proposal.title,
            "client_name": proposal.client_name,
            "content": prose2markdown(proposal.content)
        }
        rendered_markdown = template_engine.render_template(
            "proposals/default.md",
            context
        )
        return {"markdown": rendered_markdown}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proposals/preview", response_class=Response)
async def preview_proposal(proposal: ProposalRequest):
    """
    Create a new proposal and return it as a PDF preview.
    """
    try:
        context = {
            "title": proposal.title,
            "client_name": proposal.client_name,
            "content": prose2markdown(proposal.content)
        }
        rendered_markdown = template_engine.render_template(
            "proposals/default.md",
            context
        )
        pdf_bytes = pdf_generator.from_markdown(rendered_markdown)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 