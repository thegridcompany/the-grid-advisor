"""
Celery worker configuration.
"""
from celery import Celery
from app.core.config import settings

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.llm.tasks"]  # Add the path to your tasks module
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,
)

if __name__ == "__main__":
    celery_app.start() 