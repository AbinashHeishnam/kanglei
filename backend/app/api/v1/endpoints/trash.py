import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.v1.endpoints._deps import get_db, require_admin
from app.models.appointment import Appointment
from app.models.gallery_post import GalleryPost
from app.models.event_poster import EventPoster
from app.schemas.appointment import AppointmentOut
from app.schemas.gallery import GalleryOut
from app.schemas.events import EventResponse

router = APIRouter()

# --- Helper: Lazy Cleanup (30 days) ---
def cleanup_expired_items(db: Session):
    cutoff = datetime.now() - timedelta(days=30)
    
    # 1. Appointments
    db.query(Appointment).filter(Appointment.deleted_at < cutoff).delete(synchronize_session=False)
    
    # 2. Gallery (Delete files)
    old_gallery = db.query(GalleryPost).filter(GalleryPost.deleted_at < cutoff).all()
    for it in old_gallery:
        if it.image_path and os.path.exists(it.image_path):
            try:
                os.remove(it.image_path)
            except: pass
        db.delete(it)
        
    # 3. Events (Delete files)
    old_events = db.query(EventPoster).filter(EventPoster.deleted_at < cutoff).all()
    for it in old_events:
        if it.image_path and os.path.exists(it.image_path):
            try:
                os.remove(it.image_path)
            except: pass
        db.delete(it)
        
    db.commit()

# --- Listing Deleted Items ---

@router.get("/admin/trash/appointments", response_model=list[AppointmentOut])
def list_trashed_appointments(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    # Trigger cleanup
    cleanup_expired_items(db)
    return db.query(Appointment).filter(Appointment.deleted_at.is_not(None)).order_by(Appointment.deleted_at.desc()).all()

@router.get("/admin/trash/gallery", response_model=list[GalleryOut])
def list_trashed_gallery(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    # Trigger cleanup (optimization: maybe only call on one tab or all?)
    # Calling on all ensures specific items are cleaned if only that tab is visited.
    cleanup_expired_items(db)
    items = db.query(GalleryPost).filter(GalleryPost.deleted_at.is_not(None)).order_by(GalleryPost.deleted_at.desc()).all()
    # Serialize manually or reuse schema logic
    out = []
    for it in items:
        # Note: image_path is absolute. Convert to url.
        fname = os.path.basename(it.image_path)
        out.append(GalleryOut(
            id=it.id,
             image_url=f"/uploads/gallery/{fname}",
             caption=it.caption,
             is_active=it.is_active
         ))
    return out

@router.get("/admin/trash/events", response_model=list[EventResponse])
def list_trashed_events(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    cleanup_expired_items(db)
    items = db.query(EventPoster).filter(EventPoster.deleted_at.is_not(None)).order_by(EventPoster.deleted_at.desc()).all()
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

# --- Restore ---

@router.post("/admin/trash/{item_type}/{item_id}/restore")
def restore_item(item_type: str, item_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    item_type = item_type.lower()
    
    if item_type == "appointment":
        model = Appointment
    elif item_type == "gallery":
        model = GalleryPost
    elif item_type == "event":
        model = EventPoster
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
        
    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if not item.deleted_at:
        return {"detail": "Item is not in trash"}
        
    item.deleted_at = None
    db.commit()
    return {"detail": "Restored successfully"}

# --- Permanent Delete ---

@router.delete("/admin/trash/{item_type}/{item_id}")
def permanent_delete_item(item_type: str, item_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    item_type = item_type.lower()
    
    if item_type == "appointment":
        item = db.query(Appointment).filter(Appointment.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        db.delete(item)
        
    elif item_type == "gallery":
        item = db.query(GalleryPost).filter(GalleryPost.id == item_id).first()
        if not item:
             raise HTTPException(status_code=404, detail="Item not found")
        
        # Delete file
        if item.image_path and os.path.exists(item.image_path):
            try:
                os.remove(item.image_path)
            except OSError:
                pass
        db.delete(item)
        
    elif item_type == "event":
        item = db.query(EventPoster).filter(EventPoster.id == item_id).first()
        if not item:
             raise HTTPException(status_code=404, detail="Item not found")
        
        # Delete file
        if item.image_path and os.path.exists(item.image_path):
            try:
                os.remove(item.image_path)
            except OSError:
                pass
        db.delete(item)
        
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
        
    db.commit()
    return {"detail": "Permanently deleted"}
    
# --- Batch Empty ---
@router.delete("/admin/trash/empty")
def empty_trash(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    # Delete all items where deleted_at IS NOT NULL
    # But for gallery and events we must delete files too.
    
    # 1. Gallery
    gallery_items = db.query(GalleryPost).filter(GalleryPost.deleted_at.is_not(None)).all()
    count_g = 0
    for it in gallery_items:
        if it.image_path and os.path.exists(it.image_path):
            try:
                os.remove(it.image_path)
            except: pass
        db.delete(it)
        count_g += 1
        
    # 2. Events
    event_items = db.query(EventPoster).filter(EventPoster.deleted_at.is_not(None)).all()
    count_e = 0
    for it in event_items:
        if it.image_path and os.path.exists(it.image_path):
            try:
                os.remove(it.image_path)
            except: pass
        db.delete(it)
        count_e += 1
        
    # 3. Appointments
    res = db.query(Appointment).filter(Appointment.deleted_at.is_not(None)).delete(synchronize_session=False)
    
    db.commit()
    
    return {"detail": f"Trash empty. Deleted: {res} appointments, {count_g} gallery images, {count_e} events."}
