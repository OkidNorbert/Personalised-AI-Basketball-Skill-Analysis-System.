"""
Custom exceptions for the Basketball Analysis API.
"""
from typing import Optional, Dict, Any


class BasketballAPIException(Exception):
    """Base exception for all API errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(BasketballAPIException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(BasketballAPIException):
    """Raised when user lacks permission for an action."""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class NotFoundError(BasketballAPIException):
    """Raised when a resource is not found."""
    
    def __init__(self, resource: str = "Resource", resource_id: Optional[str] = None):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        super().__init__(message, status_code=404)


class ValidationError(BasketballAPIException):
    """Raised when request validation fails."""
    
    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, details=details)


class VideoProcessingError(BasketballAPIException):
    """Raised when video processing fails."""
    
    def __init__(self, message: str = "Video processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class StorageError(BasketballAPIException):
    """Raised when file storage operations fail."""
    
    def __init__(self, message: str = "Storage operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class SupabaseError(BasketballAPIException):
    """Raised when Supabase operations fail."""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class AnalysisError(BasketballAPIException):
    """Raised when video analysis fails."""
    
    def __init__(self, message: str = "Analysis failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)
