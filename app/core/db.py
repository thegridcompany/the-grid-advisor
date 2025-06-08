from fastapi import Request
from typing import Any

def with_workspace_filter(query: Any, request: Request, table_name: str = None) -> Any:
    """
    Applies a workspace_id filter to a database query object.

    This function checks if a workspace_id is present in the request state
    (set by the get_workspace_context dependency) and, if so, applies a
    filter to the query.

    Args:
        query: The database query object (e.g., a SQLAlchemy selectable).
        request: The FastAPI request object.
        table_name: The explicit name of the table to apply the filter on.

    Returns:
        The modified query object with the workspace filter applied, or the
        original query object if no workspace context is found.
    """
    workspace_id = getattr(request.state, "workspace_id", None)
    
    if not workspace_id:
        # If no workspace context, return original query
        return query

    # This is a placeholder for a more robust implementation that would inspect
    # the query object (e.g., a SQLAlchemy model or core selectable) and
    # correctly apply the where clause.
    print(f"Applying workspace filter for workspace_id: {workspace_id}")

    # The following is a conceptual example and would need to be adapted
    # to the actual ORM or query builder being used (e.g., SQLAlchemy).
    if hasattr(query, 'where'):
        # This assumes a SQLAlchemy-like query object
        target_column = f"{table_name}.workspace_id" if table_name else "workspace_id"
        return query.where(f"{target_column} = '{workspace_id}'")
        # In a real SQLAlchemy scenario, you'd do something like:
        # from sqlalchemy import text
        # return query.where(text(f"{target_column} = :ws_id")).params(ws_id=workspace_id)

    return query 