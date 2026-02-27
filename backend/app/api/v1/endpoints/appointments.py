from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.v1.endpoints._deps import get_db, require_admin
from app.schemas.appointment import AppointmentCreate, AppointmentOut, StatusUpdate, VALID_STATUSES
from app.models.appointment import Appointment
from app.core.ratelimit import rate_limit

router = APIRouter()


# ============================================================
# PUBLIC: Create Appointment
# ============================================================
@router.post("/appointments", response_model=AppointmentOut)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    _rl=Depends(rate_limit(max_requests=100, window_seconds=600)),
):
    ctype = payload.counseling_type.strip()
    phone = payload.phone.strip()

    # Duplicate protection (same phone + type within 10 mins)
    ten_min_ago = datetime.now().astimezone() - timedelta(minutes=10)

    dup = (
        db.query(Appointment)
        .filter(
            Appointment.phone == phone,
            Appointment.counseling_type == ctype,
            Appointment.created_at >= ten_min_ago,
        )
        .first()
    )

    if dup:
        raise HTTPException(
            status_code=409,
            detail="Duplicate request detected. Please wait a few minutes before submitting again."
        )

    appt = Appointment(
        counseling_type=ctype,
        name=payload.name.strip(),
        phone=phone,
        address=(payload.address.strip() if payload.address else None),
        message=(payload.message.strip() if payload.message else None),
        status="NEW",

        # ✅ LOCATION (Required)
        location=payload.location.strip(),

        # Extra Fields
        date_of_birth=payload.date_of_birth,
        guardian_name=(payload.guardian_name.strip() if payload.guardian_name else None),
        guardian_contact=(payload.guardian_contact.strip() if payload.guardian_contact else None),
        appointment_type=payload.appointment_type,
    )

    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


# ============================================================
# ADMIN: List Appointments (With Location Filter)
# ============================================================
@router.get("/admin/appointments", response_model=list[AppointmentOut])
def list_appointments(
    q: str | None = Query(default=None, description="Search name/phone"),
    status: str | None = Query(default=None),
    counseling_type: str | None = Query(default=None),
    location: str | None = Query(default=None),  # ✅ FIXED
    date_from: str | None = Query(default=None, description="YYYY-MM-DD"),
    date_to: str | None = Query(default=None, description="YYYY-MM-DD"),
    limit: int = Query(default=200, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    qry = db.query(Appointment).filter(Appointment.deleted_at.is_(None))

    # Search
    if q:
        qs = f"%{q.strip()}%"
        qry = qry.filter(or_(
            Appointment.name.ilike(qs),
            Appointment.phone.ilike(qs)
        ))

    # Status filter
    if status:
        qry = qry.filter(Appointment.status == status.strip().upper())

    # Counseling filter
    if counseling_type:
        qry = qry.filter(Appointment.counseling_type == counseling_type.strip())

    # ✅ Location filter
    if location:
        qry = qry.filter(Appointment.location == location.strip())

    # Date filtering
    if date_from:
        try:
            dtf = datetime.fromisoformat(date_from.strip()).date()
            qry = qry.filter(
                Appointment.created_at >= datetime.combine(
                    dtf, datetime.min.time()
                ).astimezone()
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date_from. Use YYYY-MM-DD.")

    if date_to:
        try:
            dtt = datetime.fromisoformat(date_to.strip()).date()
            end_dt = datetime.combine(
                dtt, datetime.max.time()
            ).astimezone()
            qry = qry.filter(Appointment.created_at <= end_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date_to. Use YYYY-MM-DD.")

    return (
        qry.order_by(Appointment.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# ============================================================
# ADMIN: Update Status
# ============================================================
@router.patch("/admin/appointments/{appointment_id}/status", response_model=AppointmentOut)
def update_status(
    appointment_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    new_status = payload.status.strip().upper()

    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {sorted(VALID_STATUSES)}"
        )

    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.deleted_at.is_(None)
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = new_status
    db.commit()
    db.refresh(appt)
    return appt


# ============================================================
# ADMIN: Soft Delete
# ============================================================
@router.delete("/admin/appointments/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.deleted_at.is_(None)
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.deleted_at = datetime.now().astimezone()
    db.commit()

    return {"detail": "Moved to trash"}