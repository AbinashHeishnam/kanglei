import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.v1.endpoints._deps import get_db, require_admin
from app.core.config import UPLOAD_DIR, MAX_UPLOAD_MB
from app.models.gallery_post import GalleryPost

# Prefer your real schema if it exists
try:
    from app.schemas.gallery import GalleryOut
except Exception:
    from pydantic import BaseModel

    class GalleryOut(BaseModel):
        id: int
        image_url: str
        caption: Optional[str] = None
        is_active: bool = True

        class Config:
            from_attributes = True


router = APIRouter()


def _uploads_abs_dir() -> str:
    """
    Absolute directory for gallery uploads.
    UPLOAD_DIR is usually: 'static_uploads/gallery'
    This resolves relative to backend/app/
    """
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    return os.path.join(base, UPLOAD_DIR)


def _public_gallery_url(image_path: str) -> str:
    """Convert stored image_path to public URL used by frontend."""
    fname = os.path.basename(image_path)
    return f"/uploads/gallery/{fname}"


def _has_deleted_at_column(db: Session) -> bool:
    """
    Detect if gallery_posts has deleted_at column.
    This prevents runtime SQL errors if DB isn't migrated yet.
    """
    try:
        db.execute(text("SELECT deleted_at FROM gallery_posts LIMIT 1"))
        return True
    except Exception:
        return False


@router.get("/gallery", response_model=List[GalleryOut])
def list_gallery(db: Session = Depends(get_db)):
    """
    Public gallery list: active + not deleted (if deleted_at exists)
    """
    q = db.query(GalleryPost).filter(GalleryPost.is_active == True)

    if _has_deleted_at_column(db):
        q = q.filter(text("deleted_at IS NULL"))

    items = q.order_by(GalleryPost.id.desc()).all()

    out: List[GalleryOut] = []
    for it in items:
        out.append(
            GalleryOut(
                id=it.id,
                image_url=_public_gallery_url(it.image_path),
                caption=getattr(it, "caption", None),
                is_active=it.is_active,
            )
        )
    return out


@router.post("/admin/gallery", response_model=GalleryOut)
def upload_gallery(
    caption: str = Form(default=""),
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

    out_dir = _uploads_abs_dir()
    os.makedirs(out_dir, exist_ok=True)

    path = os.path.join(out_dir, fname)
    with open(path, "wb") as f:
        f.write(data)

    rec = GalleryPost(
        image_path=path,
        caption=(caption.strip() or None),
        is_active=True,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return GalleryOut(
        id=rec.id,
        image_url=_public_gallery_url(rec.image_path),
        caption=getattr(rec, "caption", None),
        is_active=rec.is_active,
    )


@router.delete("/admin/gallery/{post_id}")
def delete_gallery_image(
    post_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    "Trash" behavior:
    - Always set is_active=False
    - If deleted_at column exists, set deleted_at timestamp too
    """
    post = db.query(GalleryPost).filter(GalleryPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")

    post.is_active = False

    if _has_deleted_at_column(db):
        # Use raw SQL to set deleted_at safely even if model doesn't define it
        db.execute(
            text("UPDATE gallery_posts SET deleted_at = :ts WHERE id = :id"),
            {"ts": datetime.now(timezone.utc), "id": post_id},
        )

    db.commit()
    return {"status": "success", "deleted_id": post_id}


@router.get("/admin/gallery/trash", response_model=List[GalleryOut])
def list_gallery_trash(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Trash list:
    - Requires deleted_at column, otherwise returns empty list
    """
    if not _has_deleted_at_column(db):
        return []

    rows = db.execute(
        text("SELECT id, image_path, caption, is_active FROM gallery_posts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")
    ).mappings().all()

    out: List[GalleryOut] = []
    for r in rows:
        out.append(
            GalleryOut(
                id=r["id"],
                image_url=_public_gallery_url(r["image_path"]),
                caption=r.get("caption"),
                is_active=bool(r.get("is_active", False)),
            )
        )
    return out


@router.post("/admin/gallery/{post_id}/restore")
def restore_gallery_item(
    post_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Restore from trash:
    - Requires deleted_at column
    """
    if not _has_deleted_at_column(db):
        raise HTTPException(status_code=400, detail="Trash is not enabled (deleted_at column missing).")

    post = db.query(GalleryPost).filter(GalleryPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")

    post.is_active = True
    db.execute(
        text("UPDATE gallery_posts SET deleted_at = NULL WHERE id = :id"),
        {"id": post_id},
    )
    db.commit()
    return {"status": "success", "restored_id": post_id}


@router.delete("/admin/gallery/{post_id}/purge")
def purge_gallery_item(
    post_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Permanently delete row + file (safe).
    Works even without deleted_at.
    """
    post = db.query(GalleryPost).filter(GalleryPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")

    # Delete file if exists
    try:
        if post.image_path and os.path.exists(post.image_path):
            os.remove(post.image_path)
    except Exception:
        pass

    db.delete(post)
    db.commit()
    return {"status": "success", "purged_id": post_id}