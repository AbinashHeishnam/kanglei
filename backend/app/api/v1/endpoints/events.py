import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.endpoints._deps import get_db, require_admin
from app.core.config import UPLOAD_DIR, MAX_UPLOAD_MB
from app.models.event_poster import EventPoster
from app.schemas.events import EventResponse

router = APIRouter()

def _uploads_abs_dir() -> str:
    """Get absolute path to static_uploads directory."""
    # Navigate from backend/app/api/v1/endpoints/events.py to backend/app/
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    # Return backend/app/static_uploads (not static_uploads/gallery)
    return os.path.join(base, "static_uploads")

@router.get("/events", response_model=list[EventResponse])
def list_active_events(db: Session = Depends(get_db)):
    """List active events for public view (most recent first)."""
    # Auto-activate due events
    _activate_due_events(db)

    now = datetime.now()
    from sqlalchemy import or_, and_
    
    items = db.query(EventPoster).filter(
        and_(
            EventPoster.deleted_at.is_(None),  # Must not be deleted
            or_(
                EventPoster.is_active == True,
                and_(EventPoster.starts_at != None, EventPoster.starts_at <= now)
            )
        )
    ).order_by(EventPoster.created_at.desc()).all()
    
    out = []
    for it in items:
        fname = os.path.basename(it.image_path)
        out.append(EventResponse(
            id=it.id,
            title=it.title,
            image_url=f"/uploads/events/{fname}",
            is_active=it.is_active,
            starts_at=it.starts_at,
            ends_at=it.ends_at,
            created_at=it.created_at
        ))
    return out

@router.get("/admin/events", response_model=list[EventResponse])
def list_all_events(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """List all events for admin (excluding deleted)."""
    # Auto-activate due events
    _activate_due_events(db)

    items = db.query(EventPoster).filter(EventPoster.deleted_at.is_(None)).order_by(EventPoster.created_at.desc()).all()
    out = []
    for it in items:
        fname = os.path.basename(it.image_path)
        out.append(EventResponse(
            id=it.id,
            title=it.title,
            image_url=f"/uploads/events/{fname}",
            is_active=it.is_active,
            starts_at=it.starts_at,
            ends_at=it.ends_at,
            created_at=it.created_at
        ))
    return out

def _activate_due_events(db: Session):
    """Helper: Activate events that have passed their start time."""
    now = datetime.now()
    from sqlalchemy import and_
    
    # Find due events
    due_events = db.query(EventPoster).filter(
        and_(
            EventPoster.is_active == False,
            EventPoster.deleted_at.is_(None),
            EventPoster.starts_at != None,
            EventPoster.starts_at <= now
        )
    ).all()
    
    if due_events:
        for ev in due_events:
            print(f"Auto-activating event {ev.id} (Scheduled: {ev.starts_at})")
            ev.is_active = True
        db.commit()

@router.post("/admin/events", response_model=EventResponse)
def upload_event_poster(
    title: Optional[str] = Form(None),
    is_active: bool = Form(True),
    starts_at: Optional[datetime] = Form(None),
    ends_at: Optional[datetime] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads allowed")

    data = file.file.read()
    size_mb = len(data) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"File too large (> {MAX_UPLOAD_MB} MB)")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"

    # Ensure events dir exists
    out_dir = os.path.join(_uploads_abs_dir(), "events")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, fname)

    with open(path, "wb") as f:
        f.write(data)

    rec = EventPoster(
        title=title,
        image_path=path,
        is_active=is_active,
        starts_at=starts_at,
        ends_at=ends_at
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return EventResponse(
        id=rec.id,
        title=rec.title,
        image_url=f"/uploads/events/{fname}",
        is_active=rec.is_active,
        starts_at=rec.starts_at,
        ends_at=rec.ends_at,
        created_at=rec.created_at
    )

@router.delete("/admin/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    post = db.query(EventPoster).filter(EventPoster.id == event_id, EventPoster.deleted_at.is_(None)).first()
    if not post:
        if db.query(EventPoster).filter(EventPoster.id == event_id).first():
             raise HTTPException(status_code=404, detail="Event already in trash")
        raise HTTPException(status_code=404, detail="Event poster not found")

    post.deleted_at = datetime.now().astimezone()
    db.commit()
    return {"status": "success", "deleted_id": event_id}

@router.patch("/admin/events/{event_id}/status", response_model=EventResponse)
def update_event_status(
    event_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Toggle event active status."""
    post = db.query(EventPoster).filter(EventPoster.id == event_id, EventPoster.deleted_at.is_(None)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Event poster not found")
    
    post.is_active = is_active
    db.commit()
    db.refresh(post)
    
    fname = os.path.basename(post.image_path)
    return EventResponse(
        id=post.id,
        title=post.title,
        image_url=f"/uploads/events/{fname}",
        is_active=post.is_active,
        starts_at=post.starts_at,
        ends_at=post.ends_at,
        created_at=post.created_at
    )
@router.get("/admin/events/trash", response_model=list[EventResponse])
def list_trashed_events(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    items = db.query(EventPoster).filter(
        EventPoster.deleted_at.is_not(None)
    ).order_by(EventPoster.deleted_at.desc()).all()

    out = []
    for it in items:
        fname = os.path.basename(it.image_path)
        out.append(EventResponse(
            id=it.id,
            title=it.title,
            image_url=f"/uploads/events/{fname}",
            is_active=it.is_active,
            starts_at=it.starts_at,
            ends_at=it.ends_at,
            created_at=it.created_at
        ))
    return out


@router.post("/admin/events/{event_id}/restore")
def restore_event_from_trash(
    event_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    post = db.query(EventPoster).filter(EventPoster.id == event_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Event not found")

    post.deleted_at = None
    db.commit()
    return {"status": "success", "restored_id": event_id}


@router.delete("/admin/events/{event_id}/purge")
def purge_event_permanently(
    event_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    post = db.query(EventPoster).filter(EventPoster.id == event_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Event not found")

    # Optional: delete file too (safe)
    try:
        if post.image_path and os.path.exists(post.image_path):
            os.remove(post.image_path)
    except Exception:
        pass

    db.delete(post)
    db.commit()
    return {"status": "success", "purged_id": event_id}