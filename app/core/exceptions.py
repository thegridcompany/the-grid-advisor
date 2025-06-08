"""
Custom exceptions for the application.
"""

class NotFoundError(Exception):
    """Raised when a requested resource is not found."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class PermissionError(Exception):
    """Raised when a user does not have permission to perform an action."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class ValidationError(Exception):
    """Raised when data validation fails."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message) 