"""
Video management API endpoints.
"""
import os
import shutil
from uuid import uuid4
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse

from app.config import get_settings
from app.dependencies import get_current_user, get_supabase
from app.models.video import (
    VideoUpload,
    Video,
    VideoStatus,
    AnalysisMode,
    VideoStatusResponse,
    VideoListResponse,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


def get_video_info(file_path: str) -> dict:
    """Extract video metadata using OpenCV."""
    try:
        import cv2
        cap = cv2.VideoCapture(file_path)
        
        if not cap.isOpened():
            return {}
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        duration = frame_count / fps if fps > 0 else 0
        
        cap.release()
        
        return {
            "fps": fps,
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration_seconds": duration,
        }
    except Exception:
        return {}


@router.post("/upload", response_model=Video, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    analysis_mode: AnalysisMode = Form(...),
    organization_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Upload a video for analysis.
    
    - **file**: Video file (mp4, avi, mov, mkv)
    - **analysis_mode**: 'team' or 'personal'
    - **organization_id**: Required for TEAM analysis
    """
    settings = get_settings()
    
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.allowed_video_extensions}"
        )
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum: {settings.max_upload_size_mb}MB"
        )
    
    # Validate team analysis requirements
    if analysis_mode == AnalysisMode.TEAM:
        if current_user.get("account_type") != "team":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Team analysis requires a TEAM account"
            )
    
    # Generate unique filename and save
    video_id = str(uuid4())
    filename = f"{video_id}.{ext}"
    storage_path = os.path.join(settings.upload_dir, current_user["id"], filename)
    
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    
    with open(storage_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get video metadata
    video_info = get_video_info(storage_path)
    
    # Create database record
    video_record = {
        "id": video_id,
        "uploader_id": current_user["id"],
        "title": title or file.filename,
        "description": description,
        "analysis_mode": analysis_mode.value,
        "status": VideoStatus.PENDING.value,
        "storage_path": storage_path,
        "file_size_bytes": file_size,
        "organization_id": organization_id,
        **video_info,
    }
    
    await supabase.insert("videos", video_record)
    
    return Video(**video_record, created_at=datetime.utcnow())


@router.get("", response_model=VideoListResponse)
async def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[VideoStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    List videos uploaded by the current user.
    """
    filters = {"uploader_id": current_user["id"]}
    if status_filter:
        filters["status"] = status_filter.value
    
    videos = await supabase.select(
        "videos",
        filters=filters,
        order_by="created_at",
        ascending=False,
    )
    
    # Paginate
    total = len(videos)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = videos[start:end]
    
    return VideoListResponse(
        videos=[Video(**v) for v in paginated],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{video_id}", response_model=Video)
async def get_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get video details by ID.
    """
    video = await supabase.select_one("videos", video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check ownership
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this video"
        )
    
    return Video(**video)


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get video processing status.
    """
    video = await supabase.select_one("videos", video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this video"
        )
    
    return VideoStatusResponse(
        id=video["id"],
        status=VideoStatus(video["status"]),
        progress_percent=video.get("progress_percent"),
        current_step=video.get("current_step"),
        error_message=video.get("error_message"),
    )


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Delete a video and associated data.
    """
    video = await supabase.select_one("videos", video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if video["uploader_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this video"
        )
    
    # Delete file
    if os.path.exists(video["storage_path"]):
        os.remove(video["storage_path"])
    
    # Delete database record
    await supabase.delete("videos", video_id)
    
    return None
