"""
Structured logging configuration for Grid Brain.
"""
import structlog
import logging
import sys
from typing import Any, Dict
from .config import settings


def setup_logging() -> None:
    """Configure structured logging for the application."""
    
    # Set log level from settings
    log_level = getattr(logging, settings.log_level.upper())
    
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.CallsiteParameterAdder(
                parameters=[
                    structlog.processors.CallsiteParameter.FILENAME,
                    structlog.processors.CallsiteParameter.FUNC_NAME,
                    structlog.processors.CallsiteParameter.LINENO,
                ]
            ),
            structlog.processors.dict_tracebacks,
            structlog.dev.ConsoleRenderer() if settings.is_development else structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin to add logging capabilities to classes."""
    
    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        """Get logger instance for the class."""
        if not hasattr(self, "_logger"):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger
    
    def log_event(self, event: str, **kwargs: Any) -> None:
        """Log an event with context."""
        self.logger.info(event, **kwargs)
    
    def log_error(self, error: str, exception: Exception = None, **kwargs: Any) -> None:
        """Log an error with context."""
        if exception:
            self.logger.error(error, exc_info=exception, **kwargs)
        else:
            self.logger.error(error, **kwargs)
    
    def log_warning(self, warning: str, **kwargs: Any) -> None:
        """Log a warning with context."""
        self.logger.warning(warning, **kwargs)
    
    def log_metric(self, metric_name: str, value: Any, **kwargs: Any) -> None:
        """Log a metric."""
        self.logger.info(
            "metric_recorded",
            metric_name=metric_name,
            metric_value=value,
            **kwargs
        ) 