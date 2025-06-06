import pytest
from fastapi.testclient import TestClient
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
    mock = mocker.Mock(spec=DatabaseManager)
    
    # You can pre-program mock responses here if needed
    # For example:
    # async def create(table, data):
    #     return {**data, "id": uuid.uuid4(), "created_at": "...", "updated_at": "..."}
    # mock.create = create

    app.dependency_overrides[get_db_manager] = lambda: mock
    yield mock
    app.dependency_overrides = {}


def test_create_kanban_column(client, db_manager_mock):
    """Test creating a new Kanban column."""
    project_id = uuid.uuid4()
    column_data = {"name": "Test Column", "project_id": str(project_id), "position": 0}

    # Mock the db response
    async def mock_create(table, data):
        assert table == "kanban_columns"
        return {**data, "id": uuid.uuid4(), "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"}
    db_manager_mock.create.side_effect = mock_create

    response = client.post("/api/kanban/columns", json=column_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["name"] == column_data["name"]
    assert response_data["project_id"] == str(project_id)
    assert "id" in response_data

def test_create_kanban_task(client, db_manager_mock):
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
    async def mock_create(table, data):
        assert table == "kanban_tasks"
        return {**data, "id": uuid.uuid4(), "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"}
    db_manager_mock.create.side_effect = mock_create

    response = client.post("/api/kanban/tasks", json=task_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["title"] == task_data["title"]
    assert response_data["column_id"] == str(column_id)
    assert "id" in response_data

def test_get_kanban_columns(client, db_manager_mock):
    """Test fetching Kanban columns for a project."""
    project_id = uuid.uuid4()

    async def mock_fetch(query, params):
        return [{"id": uuid.uuid4(), "name": "Col 1", "project_id": str(project_id), "position": 0}]
    db_manager_mock.fetch_all.side_effect = mock_fetch

    response = client.get(f"/api/kanban/columns?project_id={project_id}")
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_update_kanban_column(client, db_manager_mock):
    """Test updating a Kanban column."""
    column_id = uuid.uuid4()
    update_data = {"name": "Updated Name"}

    async def mock_update(table, data, record_id):
        return {**data, "id": record_id, "project_id": uuid.uuid4(), "position": 0}
    db_manager_mock.update.side_effect = mock_update

    response = client.put(f"/api/kanban/columns/{column_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"

def test_delete_kanban_column(client, db_manager_mock):
    """Test deleting a Kanban column."""
    column_id = uuid.uuid4()

    async def mock_delete(table, record_id):
        return True
    db_manager_mock.delete.side_effect = mock_delete

    response = client.delete(f"/api/kanban/columns/{column_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Kanban column deleted successfully"}

def test_get_kanban_tasks_for_project(client, db_manager_mock):
    """Test fetching all tasks for a project."""
    project_id = uuid.uuid4()
    
    async def mock_fetch(query, params):
        return [{"id": uuid.uuid4(), "title": "Task 1", "column_id": uuid.uuid4()}]
    db_manager_mock.fetch_all.side_effect = mock_fetch

    response = client.get(f"/api/kanban/tasks/project/{project_id}")
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_update_kanban_task(client, db_manager_mock):
    """Test updating a Kanban task."""
    task_id = uuid.uuid4()
    update_data = {"title": "Updated Task Title"}

    async def mock_update(table, data, record_id):
        return {**data, "id": record_id, "column_id": uuid.uuid4()}
    db_manager_mock.update.side_effect = mock_update

    response = client.put(f"/api/kanban/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task Title"

def test_delete_kanban_task(client, db_manager_mock):
    """Test deleting a Kanban task."""
    task_id = uuid.uuid4()
    
    async def mock_delete(table, record_id):
        return True
    db_manager_mock.delete.side_effect = mock_delete

    response = client.delete(f"/api/kanban/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Kanban task deleted successfully"}

def test_move_kanban_task(client, db_manager_mock):
    """Test moving a Kanban task."""
    task_id = uuid.uuid4()
    move_data = {"new_column_id": str(uuid.uuid4()), "new_position": 1}

    async def mock_update(table, data, record_id):
        return {"id": record_id, "title": "Moved Task", **data}
    db_manager_mock.update.side_effect = mock_update
    
    response = client.put(f"/api/kanban/tasks/{task_id}/move", json=move_data)
    assert response.status_code == 200
    assert response.json()["position"] == 1

def test_kanban_board_setup(client):
    """A simple test to ensure the test setup is working."""
    assert client is not None 