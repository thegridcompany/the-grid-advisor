"""
API endpoints for the pricing engine.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.services.pricing.engine import pricing_engine
from app.repositories.rate_repository import rate_repository
from app.db.models import Rate, RateType
from app.core.database import DatabaseError


router = APIRouter()


class QuoteRequest(BaseModel):
    components: List[Dict[str, Any]]
    margin: Optional[float] = 0.2

class QuoteResponse(BaseModel):
    cost: float
    price: float
    margin: float
    profit: float

@router.post("/quote", response_model=QuoteResponse)
async def get_quote(request: QuoteRequest):
    """
    Calculate cost and generate a quote.
    """
    cost = await pricing_engine.calculate_cost(request.components)
    quote = pricing_engine.generate_quote(cost, request.margin)
    return quote


@router.post("/rates", response_model=Rate, status_code=201)
async def create_rate(rate: Rate):
    """
    Create a new rate.
    """
    try:
        return await rate_repository.create_rate(rate)
    except DatabaseError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rates", response_model=List[Rate])
async def get_all_rates(is_active: Optional[bool] = None):
    """
    Get all rates.
    """
    return await rate_repository.get_all_rates(is_active)


@router.get("/rates/{rate_id}", response_model=Rate)
async def get_rate(rate_id: UUID):
    """
    Get a specific rate by ID.
    """
    rate = await rate_repository.get_rate_by_id(rate_id)
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    return rate


@router.put("/rates/{rate_id}", response_model=Rate)
async def update_rate(rate_id: UUID, rate_update: Rate):
    """
    Update a rate.
    """
    updated_rate = await rate_repository.update_rate(rate_id, rate_update)
    if not updated_rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    return updated_rate


@router.delete("/rates/{rate_id}", status_code=204)
async def delete_rate(rate_id: UUID):
    """
    Delete a rate.
    """
    if not await rate_repository.delete_rate(rate_id):
        raise HTTPException(status_code=404, detail="Rate not found")
    return None 