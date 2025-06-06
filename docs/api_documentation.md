# API Documentation

Our backend is built using FastAPI, which provides automatic, interactive API documentation using Swagger UI and ReDoc.

## Accessing the Documentation

Once the backend server is running, you can access the documentation at the following endpoints:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Overview

The documentation provides detailed information about all available API endpoints, including:

- **Paths**: The URL for each endpoint (e.g., `/api/kanban/tasks`).
- **Methods**: The HTTP method for each endpoint (e.g., `GET`, `POST`, `PUT`, `DELETE`).
- **Parameters**: Required and optional parameters for each endpoint.
- **Request Body**: The structure of the request body for `POST` and `PUT` endpoints.
- **Responses**: The structure of the response body for each endpoint, including status codes.
- **Schemas**: The data models used in the API.

You can also use the Swagger UI to interactively test the API endpoints directly from your browser.
