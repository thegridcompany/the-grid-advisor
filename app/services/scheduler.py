"""
Background task scheduler for Grid Brain.
"""
from celery import Celery
from celery.schedules import crontab
import asyncio
from typing import Dict, Any
import pendulum

from ..core.config import settings
from ..core.logging import get_logger
from ..email.service import EmailService
from ..ai.analyzer import AIAnalyzer
from ..core.database import get_db_manager

logger = get_logger(__name__)

# Create Celery app
celery_app = Celery(
    "grid_brain",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "sync-all-emails": {
            "task": "app.services.scheduler.sync_all_emails_task",
            "schedule": settings.email_polling_interval,  # Every 5 minutes
        },
        "generate-daily-briefings": {
            "task": "app.services.scheduler.generate_daily_briefings_task",
            "schedule": crontab(hour=8, minute=0),  # Every day at 8 AM
        },
        "check-client-health": {
            "task": "app.services.scheduler.check_client_health_task",
            "schedule": crontab(hour=9, minute=0),  # Every day at 9 AM
        },
        "detect-patterns": {
            "task": "app.services.scheduler.detect_patterns_task",
            "schedule": crontab(hour=2, minute=0),  # Every day at 2 AM
        },
    }
)


@celery_app.task
def sync_all_emails_task():
    """Sync emails for all team members."""
    logger.info("Starting email sync task")
    
    async def run_sync():
        email_service = EmailService()
        result = await email_service.sync_all_team_emails()
        logger.info(f"Email sync completed: {result}")
        return result
    
    # Run async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(run_sync())
    loop.close()
    
    return result


@celery_app.task
def generate_daily_briefings_task():
    """Generate daily briefings for all team members."""
    logger.info("Starting daily briefing generation")
    
    async def generate_briefings():
        db = get_db_manager()
        ai_analyzer = AIAnalyzer()
        
        # Get all active team members
        team_members = await db.get_many(
            "team_members",
            filters={"is_active": True}
        )
        
        results = []
        
        for member in team_members:
            try:
                # Get yesterday's interactions
                interactions = await db.get_many(
                    "interactions",
                    filters={"team_member_id": member["id"]},
                    order_by="-created_at",
                    limit=100
                )
                
                # Calculate metrics
                metrics = {
                    "total_interactions": len(interactions),
                    "emails_received": len([i for i in interactions if i["type"] == "email"]),
                    "avg_response_time": 0,  # TODO: Calculate
                    "avg_engagement_score": 75.0  # TODO: Calculate
                }
                
                # Generate briefing
                briefing = await ai_analyzer.generate_daily_briefing(
                    member["id"],
                    interactions,
                    metrics
                )
                
                # Save to database
                await db.create("daily_briefings", briefing)
                
                # TODO: Send briefing email
                
                results.append({
                    "team_member": member["name"],
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"Failed to generate briefing for {member['name']}", error=str(e))
                results.append({
                    "team_member": member["name"],
                    "status": "error",
                    "error": str(e)
                })
        
        return results
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(generate_briefings())
    loop.close()
    
    return result


@celery_app.task
def check_client_health_task():
    """Check health of all clients and create alerts."""
    logger.info("Starting client health check")
    
    async def check_health():
        db = get_db_manager()
        
        # Get all active clients
        clients = await db.get_many(
            "clients",
            filters={"status": "active"}
        )
        
        alerts_created = 0
        
        for client in clients:
            # Get recent interactions
            interactions = await db.get_many(
                "interactions",
                filters={"client_id": client["id"]},
                order_by="-created_at",
                limit=20
            )
            
            # Calculate health metrics
            if interactions:
                last_interaction = interactions[0]
                days_since_contact = (pendulum.now() - pendulum.parse(last_interaction["created_at"])).days
                
                # Create alert if client is silent
                if days_since_contact > settings.client_silence_alert_days:
                    alert_data = {
                        "alert_type": "client_silent",
                        "severity": "medium" if days_since_contact < 30 else "high",
                        "title": f"Client {client['name']} has been silent",
                        "message": f"No interaction with {client['name']} for {days_since_contact} days",
                        "team_member_id": client.get("assigned_to"),
                        "client_id": client["id"],
                        "suggested_actions": [
                            "Send follow-up email",
                            "Schedule a check-in call",
                            "Review recent interactions"
                        ]
                    }
                    
                    await db.create("alerts", alert_data)
                    alerts_created += 1
            
            # Update client health snapshot
            health_data = {
                "client_id": client["id"],
                "snapshot_date": pendulum.now().isoformat(),
                "engagement_score": client.get("engagement_score", 50.0),
                "days_since_contact": days_since_contact if interactions else 999,
                "churn_risk": 0.8 if days_since_contact > 60 else 0.3,
                "recommended_actions": []
            }
            
            await db.create("client_health", health_data)
        
        return {
            "clients_checked": len(clients),
            "alerts_created": alerts_created
        }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(check_health())
    loop.close()
    
    return result


@celery_app.task
def detect_patterns_task():
    """Detect patterns in interactions."""
    logger.info("Starting pattern detection")
    
    async def detect_patterns():
        db = get_db_manager()
        ai_analyzer = AIAnalyzer()
        
        # Get recent interactions
        interactions = await db.get_many(
            "interactions",
            order_by="-created_at",
            limit=500
        )
        
        # Analyze patterns
        patterns = await ai_analyzer.analyze_patterns(interactions)
        
        # Save patterns to database
        # TODO: Parse and save individual patterns
        
        return patterns
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(detect_patterns())
    loop.close()
    
    return result 