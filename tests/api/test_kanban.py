import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
import uuid

from app.main import app 
from app.core.database import get_db_manager, DatabaseManager

# Fixture for the test client
@pytest.fixture(scope="module")
def client():
    yield TestClient(app)

# Fixture for a mock DB Manager
@pytest.fixture
def db_manager_mock(mocker):
    """Mock the DatabaseManager for testing."""
    mock = mocker.Mock(spec=DatabaseManager)
    
    # Convert methods to AsyncMock since they're async
    mock.create = AsyncMock()
    mock.update = AsyncMock()
    mock.delete = AsyncMock()
    mock.fetch_all = AsyncMock()
    mock.get_by_id = AsyncMock()
    mock.get_many = AsyncMock()
    
    # Override the dependency
    app.dependency_overrides[get_db_manager] = lambda: mock
    yield mock
    # Clean up
    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_create_kanban_column(client, db_manager_mock):
    """Test creating a new Kanban column."""
    project_id = uuid.uuid4()
    column_data = {"name": "Test Column", "project_id": str(project_id), "position": 0}

    # Mock the db response
    db_manager_mock.create.return_value = {
        **column_data, 
        "id": str(uuid.uuid4()), 
        "created_at": "2024-01-01T00:00:00", 
        "updated_at": "2024-01-01T00:00:00"
    }

    response = client.post("/api/kanban/columns", json=column_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["name"] == column_data["name"]
    assert response_data["project_id"] == str(project_id)
    assert "id" in response_data
    
    # Verify the mock was called
    db_manager_mock.create.assert_called_once_with("kanban_columns", column_data)


@pytest.mark.asyncio
async def test_create_kanban_task(client, db_manager_mock):
    """Test creating a new Kanban task."""
    column_id = uuid.uuid4()
    task_data = {
        "title": "Test Task",
        "description": "A task for testing.",
        "status": "todo",
        "priority": "medium",
        "column_id": str(column_id),
        "position": 0,
        "tags": ["test", "api"]
    }

    # Mock the db response
    db_manager_mock.create.return_value = {
        **task_data, 
        "id": str(uuid.uuid4()), 
        "created_at": "2024-01-01T00:00:00", 
        "updated_at": "2024-01-01T00:00:00"
    }

    response = client.post("/api/kanban/tasks", json=task_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["title"] == task_data["title"]
    assert response_data["column_id"] == str(column_id)
    assert "id" in response_data


@pytest.mark.asyncio
async def test_get_kanban_columns(client, db_manager_mock):
    """Test fetching Kanban columns for a project."""
    project_id = uuid.uuid4()

    # Mock the db response
    db_manager_mock.get_many.return_value = [
        {
            "id": str(uuid.uuid4()), 
            "name": "Col 1", 
            "project_id": str(project_id), 
            "position": 0
        }
    ]

    response = client.get(f"/api/kanban/columns?project_id={project_id}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Verify the mock was called with correct params
    db_manager_mock.get_many.assert_called_once()


@pytest.mark.asyncio
async def test_update_kanban_column(client, db_manager_mock):
    """Test updating a Kanban column."""
    column_id = uuid.uuid4()
    update_data = {"name": "Updated Name"}

    # Mock the db response
    db_manager_mock.update.return_value = {
        **update_data, 
        "id": str(column_id), 
        "project_id": str(uuid.uuid4()), 
        "position": 0
    }

    response = client.put(f"/api/kanban/columns/{column_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"
    
    # Verify the mock was called
    db_manager_mock.update.assert_called_once_with(
        "kanban_columns", 
        str(column_id), 
        update_data
    )


@pytest.mark.asyncio
async def test_delete_kanban_column(client, db_manager_mock):
    """Test deleting a Kanban column."""
    column_id = uuid.uuid4()

    # Mock the db response
    db_manager_mock.delete.return_value = True

    response = client.delete(f"/api/kanban/columns/{column_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Kanban column deleted successfully"}
    
    # Verify the mock was called
    db_manager_mock.delete.assert_called_once_with("kanban_columns", str(column_id))


@pytest.mark.asyncio
async def test_get_kanban_tasks_for_project(client, db_manager_mock):
    """Test fetching all tasks for a project."""
    project_id = uuid.uuid4()
    
    # Mock the db response
    db_manager_mock.get_many.return_value = [
        {
            "id": str(uuid.uuid4()), 
            "title": "Task 1", 
            "column_id": str(uuid.uuid4())
        }
    ]

    response = client.get(f"/api/kanban/tasks/project/{project_id}")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_update_kanban_task(client, db_manager_mock):
    """Test updating a Kanban task."""
    task_id = uuid.uuid4()
    update_data = {"title": "Updated Task Title"}

    # Mock the db response
    db_manager_mock.update.return_value = {
        **update_data, 
        "id": str(task_id), 
        "column_id": str(uuid.uuid4())
    }

    response = client.put(f"/api/kanban/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task Title"


@pytest.mark.asyncio
async def test_delete_kanban_task(client, db_manager_mock):
    """Test deleting a Kanban task."""
    task_id = uuid.uuid4()
    
    # Mock the db response
    db_manager_mock.delete.return_value = True

    response = client.delete(f"/api/kanban/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Kanban task deleted successfully"}


@pytest.mark.asyncio
async def test_move_kanban_task(client, db_manager_mock):
    """Test moving a Kanban task."""
    task_id = uuid.uuid4()
    move_data = {"new_column_id": str(uuid.uuid4()), "new_position": 1}

    # Mock the db response
    db_manager_mock.update.return_value = {
        "id": str(task_id), 
        "title": "Moved Task", 
        **move_data
    }
    
    response = client.put(f"/api/kanban/tasks/{task_id}/move", json=move_data)
    assert response.status_code == 200
    assert response.json()["new_position"] == 1


def test_kanban_board_setup(client):
    """A simple test to ensure the test setup is working."""
    assert client is not None 