"""
Analytics API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pendulum

from .auth import get_current_user
from ..core.database import get_db_manager
from ..core.logging import get_logger
from ..ai.analyzer import AIAnalyzer

logger = get_logger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get dashboard metrics for current user."""
    db = get_db_manager()
    
    # Calculate date ranges
    now = pendulum.now()
    today_start = now.start_of("day")
    week_start = now.start_of("week")
    month_start = now.start_of("month")
    
    # Get interactions count
    all_interactions = await db.get_many(
        "interactions",
        filters={"team_member_id": current_user["id"]}
    )
    
    today_interactions = [i for i in all_interactions if pendulum.parse(i["created_at"]) >= today_start]
    week_interactions = [i for i in all_interactions if pendulum.parse(i["created_at"]) >= week_start]
    
    # Get unresponded count
    unresponded = await db.get_many(
        "interactions",
        filters={
            "team_member_id": current_user["id"],
            "requires_response": True,
            "responded_at": None
        }
    )
    
    # Get active clients
    active_clients = await db.get_many(
        "clients",
        filters={"status": "active"}
    )
    
    # Get pending alerts
    alerts = await db.get_many(
        "alerts",
        filters={
            "team_member_id": current_user["id"],
            "status": "pending"
        }
    )
    
    return {
        "interactions": {
            "today": len(today_interactions),
            "this_week": len(week_interactions),
            "total": len(all_interactions),
            "unresponded": len(unresponded)
        },
        "clients": {
            "active": len(active_clients),
            "total": len(await db.get_many("clients"))
        },
        "alerts": {
            "pending": len(alerts),
            "critical": len([a for a in alerts if a["severity"] == "critical"])
        },
        "last_updated": now.isoformat()
    }


@router.get("/daily-briefing")
async def get_daily_briefing(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get AI-generated daily briefing."""
    db = get_db_manager()
    ai_analyzer = AIAnalyzer()
    
    # Get yesterday's interactions
    yesterday = pendulum.yesterday()
    interactions = await db.get_many(
        "interactions",
        filters={"team_member_id": current_user["id"]}
    )
    
    yesterday_interactions = [
        i for i in interactions 
        if pendulum.parse(i["created_at"]).date() == yesterday.date()
    ]
    
    # Calculate metrics
    metrics = {
        "total_interactions": len(yesterday_interactions),
        "emails_received": len([i for i in yesterday_interactions if i["type"] == "email"]),
        "avg_response_time": 0,  # TODO: Calculate actual response time
        "avg_engagement_score": 75.0  # TODO: Calculate from clients
    }
    
    # Generate briefing
    briefing = await ai_analyzer.generate_daily_briefing(
        current_user["id"],
        yesterday_interactions,
        metrics
    )
    
    # Save briefing to database
    briefing_data = {
        "team_member_id": current_user["id"],
        "briefing_date": pendulum.today().isoformat(),
        **briefing
    }
    
    saved_briefing = await db.create("daily_briefings", briefing_data)
    
    return saved_briefing


@router.get("/patterns")
async def get_learned_patterns(
    current_user: Dict[str, Any] = Depends(get_current_user),
    pattern_type: Optional[str] = Query(None),
    limit: int = Query(20, le=50)
):
    """Get AI-learned patterns."""
    db = get_db_manager()
    
    filters = {"is_active": True}
    if pattern_type:
        filters["pattern_type"] = pattern_type
    
    patterns = await db.get_many(
        "learned_patterns",
        filters=filters,
        order_by="-confidence_score",
        limit=limit
    )
    
    return patterns


@router.get("/client-health")
async def get_clients_health_overview(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get health overview of all clients."""
    db = get_db_manager()
    
    # Get all clients
    clients = await db.get_many("clients", filters={"status": "active"})
    
    health_overview = []
    
    for client in clients:
        # Get latest health snapshot
        snapshots = await db.get_many(
            "client_health",
            filters={"client_id": client["id"]},
            order_by="-snapshot_date",
            limit=1
        )
        
        if snapshots:
            health_data = snapshots[0]
        else:
            # Calculate basic health metrics
            interactions = await db.get_many(
                "interactions",
                filters={"client_id": client["id"]},
                order_by="-created_at",
                limit=10
            )
            
            days_since_contact = 0
            if interactions:
                last_interaction = pendulum.parse(interactions[0]["created_at"])
                days_since_contact = (pendulum.now() - last_interaction).days
            
            health_data = {
                "client_id": client["id"],
                "engagement_score": client.get("engagement_score", 50.0),
                "days_since_contact": days_since_contact,
                "churn_risk": 0.3 if days_since_contact > 30 else 0.1
            }
        
        health_overview.append({
            "client": {
                "id": client["id"],
                "name": client["name"],
                "company": client.get("company")
            },
            "health": health_data
        })
    
    # Sort by churn risk
    health_overview.sort(key=lambda x: x["health"].get("churn_risk", 0), reverse=True)
    
    return health_overview 