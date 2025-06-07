# Grid Brain Backend Tests

This directory contains the test suite for the Grid Brain backend application.

## Running Tests

### Running Tests in Docker (Recommended)

The recommended way to run tests is inside Docker to ensure consistency across environments:

```bash
# Run all tests in Docker
./scripts/run-tests-docker.sh

# Or using docker-compose directly
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Running Tests Locally

If you prefer to run tests locally:

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/api/test_auth.py

# Run with verbose output
pytest -v

# Run tests matching a pattern
pytest -k "test_login"
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py           # Shared fixtures and test configuration
├── api/                  # API endpoint tests
│   ├── __init__.py
│   ├── test_auth.py      # Authentication tests
│   └── test_kanban.py    # Kanban board tests
├── core/                 # Core module tests
│   ├── __init__.py
│   └── test_config.py    # Configuration tests
├── services/             # Service layer tests (to be added)
├── utils/                # Utility tests (to be added)
└── README.md            # This file
```

## Writing Tests

### Test Naming Convention

- Test files should be named `test_<module>.py`
- Test functions should start with `test_`
- Test classes should start with `Test`

### Using Fixtures

Common fixtures are defined in `conftest.py`:

```python
# Use the test client
def test_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200

# Use mock database manager
def test_with_db(mock_db_manager):
    mock_db_manager.create.return_value = {"id": "123"}
    # Your test code

# Use authentication headers
def test_authenticated_endpoint(client, auth_headers):
    response = client.get("/api/me", headers=auth_headers)
    assert response.status_code == 200
```

### Testing Async Code

Use `pytest.mark.asyncio` for async tests:

```python
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_function()
    assert result is not None
```

### Mocking External Services

All external services are automatically mocked in tests via the `disable_external_calls` fixture in `conftest.py`. This includes:

- Supabase database
- AI services (Anthropic, OpenAI)
- Email services
- Redis cache

## Test Coverage

The project aims for a minimum of **85% code coverage**. Coverage reports are generated in multiple formats:

- Terminal output: Shows immediately after running tests
- HTML report: Available at `htmlcov/index.html`
- JSON report: Available at `coverage.json`

To view the HTML coverage report:

```bash
pytest --cov=app tests/
open htmlcov/index.html  # On macOS
# or
xdg-open htmlcov/index.html  # On Linux
```

## Environment Variables

Tests use a separate `.env.test` file which is automatically created from `.env.example` when running tests in Docker. This ensures tests don't use production credentials.

Key test environment variables:
- `ENVIRONMENT=test`
- `TESTING=true`
- All API keys are set to test values

## Troubleshooting

### Import Errors

If you encounter import errors:
1. Ensure `PYTHONPATH` includes the project root
2. Run tests from the project root directory
3. Check that all dependencies are installed

### Mock Issues

If mocks aren't working:
1. Check that fixtures are properly imported
2. Ensure dependency overrides are set before test execution
3. Verify AsyncMock is used for async functions

### Docker Test Failures

If tests fail in Docker but pass locally:
1. Check that all required files are copied in `Dockerfile.test`
2. Ensure environment variables are properly set
3. Verify service dependencies (Redis) are running

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies to ensure tests are fast and reliable
3. **Fixtures**: Use fixtures for common setup to keep tests DRY
4. **Assertions**: Use clear, specific assertions with helpful error messages
5. **Coverage**: Aim for high coverage but focus on meaningful tests
6. **Documentation**: Add docstrings to complex tests explaining what they verify

## Adding New Tests

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure tests cover both success and error cases
3. Add appropriate fixtures if needed
4. Update this README if adding new test categories