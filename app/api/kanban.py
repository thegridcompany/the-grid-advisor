"""
Kanban Board API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db_manager, DatabaseManager
from ..core.logging import get_logger
from ..db.models import KanbanColumn, KanbanTask, KanbanStatus, KanbanPriority

logger = get_logger(__name__)
router = APIRouter()


# Column endpoints
@router.post("/columns", response_model=KanbanColumn)
async def create_kanban_column(
    column: KanbanColumn,
    db: DatabaseManager = Depends(get_db_manager)
) -> KanbanColumn:
    """Create a new Kanban column."""
    try:
        column_data = column.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        created_column = await db.create("kanban_columns", column_data)
        return KanbanColumn(**created_column)
    except Exception as e:
        logger.error("Failed to create Kanban column", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create Kanban column")

@router.get("/columns", response_model=List[KanbanColumn])
async def get_kanban_columns(
    project_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[KanbanColumn]:
    """Get all Kanban columns for a project."""
    try:
        columns = await db.get_many(
            "kanban_columns",
            filters={"project_id": str(project_id)},
            order_by="position"
        )
        return [KanbanColumn(**c) for c in columns]
    except Exception as e:
        logger.error("Failed to get Kanban columns", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve Kanban columns")

@router.put("/columns/{column_id}", response_model=KanbanColumn)
async def update_kanban_column(
    column_id: UUID,
    column: KanbanColumn,
    db: DatabaseManager = Depends(get_db_manager)
) -> KanbanColumn:
    """Update a Kanban column."""
    try:
        column_data = column.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        updated_column = await db.update("kanban_columns", str(column_id), column_data)
        if not updated_column:
            raise HTTPException(status_code=404, detail="Kanban column not found")
        return KanbanColumn(**updated_column)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update Kanban column", column_id=str(column_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update Kanban column")

@router.delete("/columns/{column_id}")
async def delete_kanban_column(
    column_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Delete a Kanban column."""
    try:
        # Before deleting a column, you might want to handle tasks within it
        # (e.g., move them, delete them, or prevent deletion if the column is not empty).
        # For simplicity, we'll just delete it here.
        success = await db.delete("kanban_columns", str(column_id))
        if not success:
            raise HTTPException(status_code=404, detail="Kanban column not found")
        return {"message": "Kanban column deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete Kanban column", column_id=str(column_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete Kanban column")

# Task endpoints
@router.post("/tasks", response_model=KanbanTask)
async def create_kanban_task(
    task: KanbanTask,
    db: DatabaseManager = Depends(get_db_manager)
) -> KanbanTask:
    """Create a new Kanban task."""
    try:
        task_data = task.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        created_task = await db.create("kanban_tasks", task_data)
        return KanbanTask(**created_task)
    except Exception as e:
        logger.error("Failed to create Kanban task", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create Kanban task")

@router.get("/tasks", response_model=List[KanbanTask])
async def get_kanban_tasks_for_column(
    column_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[KanbanTask]:
    """Get all Kanban tasks for a specific column."""
    try:
        tasks = await db.get_many(
            "kanban_tasks",
            filters={"column_id": str(column_id)},
            order_by="position"
        )
        return [KanbanTask(**t) for t in tasks]
    except Exception as e:
        logger.error("Failed to get Kanban tasks", column_id=str(column_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve Kanban tasks")

@router.get("/tasks/project/{project_id}", response_model=List[KanbanTask])
async def get_kanban_tasks_for_project(
    project_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> List[KanbanTask]:
    """Get all Kanban tasks for a specific project."""
    try:
        # First get all columns for this project
        columns = await db.get_many(
            "kanban_columns",
            filters={"project_id": str(project_id)}
        )
        column_ids = [col["id"] for col in columns]
        
        if not column_ids:
            return []  # No columns means no tasks
        
        # Then get all tasks for these columns
        # Since get_many doesn't support IN queries, we'll need to get tasks for each column
        all_tasks = []
        for column_id in column_ids:
            tasks = await db.get_many(
                "kanban_tasks",
                filters={"column_id": column_id},
                order_by="position"
            )
            all_tasks.extend(tasks)
        
        return [KanbanTask(**t) for t in all_tasks]
    except Exception as e:
        logger.error("Failed to get Kanban tasks for project", project_id=str(project_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve Kanban tasks for project")

@router.get("/tasks/{task_id}", response_model=KanbanTask)
async def get_kanban_task(
    task_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> KanbanTask:
    """Get a specific Kanban task."""
    try:
        task = await db.get_by_id("kanban_tasks", str(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Kanban task not found")
        return KanbanTask(**task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get Kanban task", task_id=str(task_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve Kanban task")

@router.put("/tasks/{task_id}", response_model=KanbanTask)
async def update_kanban_task(
    task_id: UUID,
    task: KanbanTask,
    db: DatabaseManager = Depends(get_db_manager)
) -> KanbanTask:
    """Update a Kanban task."""
    try:
        task_data = task.dict(exclude_unset=True, exclude={"id", "created_at", "updated_at"})
        updated_task = await db.update("kanban_tasks", str(task_id), task_data)
        if not updated_task:
            raise HTTPException(status_code=404, detail="Kanban task not found")
        return KanbanTask(**updated_task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update Kanban task", task_id=str(task_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update Kanban task")

@router.delete("/tasks/{task_id}")
async def delete_kanban_task(
    task_id: UUID,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Delete a Kanban task."""
    try:
        success = await db.delete("kanban_tasks", str(task_id))
        if not success:
            raise HTTPException(status_code=404, detail="Kanban task not found")
        return {"message": "Kanban task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete Kanban task", task_id=str(task_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete Kanban task")

from pydantic import BaseModel

class MoveTaskRequest(BaseModel):
    new_column_id: UUID
    new_position: int

@router.put("/tasks/{task_id}/move")
async def move_kanban_task(
    task_id: UUID,
    move_data: MoveTaskRequest,
    db: DatabaseManager = Depends(get_db_manager)
) -> dict:
    """Move a Kanban task to a new column and/or position."""
    try:
        # This is a simplified move. A real implementation would need to handle
        # reordering other tasks in both the old and new columns.
        task = await db.get_by_id("kanban_tasks", str(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Kanban task not found")

        update_data = {
            "column_id": str(move_data.new_column_id),
            "position": move_data.new_position
        }
        updated_task = await db.update("kanban_tasks", str(task_id), update_data)
        if not updated_task:
             raise HTTPException(status_code=500, detail="Failed to move Kanban task")

        return {"message": "Kanban task moved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to move Kanban task", task_id=str(task_id), error=str(e))
        raise HTTPException(status_code=500, detail="Failed to move Kanban task") 