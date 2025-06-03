# tests/conftest.py
# This file is used by pytest to share fixtures across multiple test files.
# You can define fixtures here that can be used by any test in this directory or subdirectories.

# Example of a simple fixture:
# import pytest
#
# @pytest.fixture
# def example_fixture():
#     return "Hello from example_fixture!"

# Example of a fixture with setup and teardown:
# @pytest.fixture
# def db_connection():
#     conn = connect_to_database()
#     yield conn  # Provides the connection to the test
#     conn.close() # Teardown: close the connection after the test 