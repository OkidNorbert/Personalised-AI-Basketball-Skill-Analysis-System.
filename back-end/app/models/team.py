"""
Pydantic models for team and organization schemas.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    """Request schema for creating an organization."""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None


class OrganizationUpdate(BaseModel):
    """Request schema for updating an organization."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None


class Organization(BaseModel):
    """Complete organization model returned from API."""
    id: UUID
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    owner_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OrganizationWithStats(Organization):
    """Organization with aggregated statistics."""
    player_count: int = 0
    video_count: int = 0
    total_analysis_count: int = 0


class OrganizationListResponse(BaseModel):
    """Response schema for listing organizations."""
    organizations: List[Organization]
    total: int
