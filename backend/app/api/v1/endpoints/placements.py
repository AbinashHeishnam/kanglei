from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.placement import PlacementOut
from app.services.placement_service import (
    create_placement,
    get_active_placements,
    get_all_admin_placements,
    deactivate_placement,
    delete_placement,
    get_deleted_placements,
    restore_placement,
    hard_delete_placement,
)
from app.api.v1.endpoints._deps import require_admin

router = APIRouter(prefix="/placements", tags=["Placements"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[PlacementOut])
def list_active_placements(db: Session = Depends(get_db)):
    return get_active_placements(db)


@router.get("/admin")
def list_admin_placements(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return get_all_admin_placements(db)


@router.post("/", response_model=PlacementOut)
def upload_placement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return create_placement(db, file)


@router.patch("/{placement_id}", response_model=PlacementOut)
def toggle_active(
    placement_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return deactivate_placement(db, placement_id)


@router.delete("/{placement_id}", response_model=PlacementOut)
def soft_delete(
    placement_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return delete_placement(db, placement_id)


@router.get("/trash")
def list_deleted(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return get_deleted_placements(db)


@router.patch("/restore/{placement_id}", response_model=PlacementOut)
def restore(
    placement_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return restore_placement(db, placement_id)


@router.delete("/trash/{placement_id}")
def permanent_delete(
    placement_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return hard_delete_placement(db, placement_id)
