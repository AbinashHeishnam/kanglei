import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import UploadFile
from app.models.placement_post import PlacementPost

# Upload directory (relative to backend/app/)
UPLOAD_FOLDER = "app/static_uploads/placements"


# ==============================
# Save Image
# ==============================
def save_placement_image(file: UploadFile) -> str:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Path returned must match static serving path
    return f"static_uploads/placements/{filename}"


# ==============================
# Create Placement
# ==============================
def create_placement(db: Session, file: UploadFile):
    image_path = save_placement_image(file)

    placement = PlacementPost(
        image_path=image_path,
        is_active=True,
    )

    db.add(placement)
    db.commit()
    db.refresh(placement)

    return placement


# ==============================
# Get Active Placements
# (For User Home Page)
# ==============================
def get_active_placements(db: Session):
    return (
        db.query(PlacementPost)
        .filter(
            PlacementPost.deleted_at.is_(None),
            PlacementPost.is_active == True
        )
        .order_by(PlacementPost.created_at.desc())
        .all()
    )


# ==============================
# Get All Placements (Admin)
# ==============================
def get_all_admin_placements(db: Session):
    return (
        db.query(PlacementPost)
        .filter(PlacementPost.deleted_at.is_(None))
        .order_by(PlacementPost.created_at.desc())
        .all()
    )


# ==============================
# Deactivate / Activate Toggle
# ==============================
def deactivate_placement(db: Session, placement_id: int):
    placement = db.query(PlacementPost).filter(
        PlacementPost.id == placement_id,
        PlacementPost.deleted_at.is_(None)
    ).first()

    if not placement:
        return None

    # TOGGLE instead of forcing false
    placement.is_active = not placement.is_active
    db.commit()
    db.refresh(placement)

    return placement


# ==============================
# Soft Delete (Send to Trash)
# ==============================
def delete_placement(db: Session, placement_id: int):
    placement = db.query(PlacementPost).filter(
        PlacementPost.id == placement_id,
        PlacementPost.deleted_at.is_(None)
    ).first()

    if not placement:
        return None

    placement.deleted_at = func.now()
    db.commit()
    db.refresh(placement)

    return placement


# ==============================
# Trash Fetch Function
# ==============================
def get_deleted_placements(db: Session):
    return (
        db.query(PlacementPost)
        .filter(PlacementPost.deleted_at.isnot(None))
        .order_by(PlacementPost.created_at.desc())
        .all()
    )


# ==============================
# Restore Function
# ==============================
def restore_placement(db: Session, placement_id: int):
    placement = db.query(PlacementPost).filter(
        PlacementPost.id == placement_id,
        PlacementPost.deleted_at.isnot(None) # Use isnot since is_not doesn't exist uniformly in sqlalchemy vs isnot() method. Or isnot(None) or is_(not None).
    ).first()

    if not placement:
        return None

    placement.deleted_at = None
    placement.is_active = True
    db.commit()
    db.refresh(placement)

    return placement


# ==============================
# Hard Delete (Permanently remove)
# ==============================
def hard_delete_placement(db: Session, placement_id: int):
    placement = db.query(PlacementPost).filter(
        PlacementPost.id == placement_id,
        PlacementPost.deleted_at.isnot(None)
    ).first()

    if not placement:
        return None

    db.delete(placement)
    db.commit()

    return {"status": "permanently_deleted"}
