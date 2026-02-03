import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.endpoints._deps import get_db, require_admin
from app.core.config import UPLOAD_DIR, MAX_UPLOAD_MB
from app.models.gallery_post import GalleryPost
from app.schemas.gallery import GalleryOut

router = APIRouter()

def _uploads_abs_dir() -> str:
    # backend/app/ + UPLOAD_DIR
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))  # .../app
    return os.path.join(base, UPLOAD_DIR)

@router.get("/gallery", response_model=list[GalleryOut])
def list_gallery(db: Session = Depends(get_db)):
    items = db.query(GalleryPost).filter(GalleryPost.is_active == True).order_by(GalleryPost.id.desc()).all()
    # Convert stored image_path -> public image_url
    out = []
    for it in items:
        out.append(GalleryOut(
            id=it.id,
            image_url=f"/uploads/gallery/{os.path.basename(it.image_path)}",
            caption=it.caption,
            is_active=it.is_active
        ))
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

    rec = GalleryPost(image_path=path, caption=(caption.strip() or None), is_active=True)
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return GalleryOut(
        id=rec.id,
        image_url=f"/uploads/gallery/{fname}",
        caption=rec.caption,
        is_active=rec.is_active
    )

@router.delete("/admin/gallery/{post_id}")
def delete_gallery_image(
    post_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    post = db.query(GalleryPost).filter(GalleryPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Gallery post not found")

    # Delete file from disk
    if post.image_path and os.path.exists(post.image_path):
        try:
            os.remove(post.image_path)
        except OSError:
            pass # Log or ignore if file already missing

    db.delete(post)
    db.commit()
    return {"status": "success", "deleted_id": post_id}
