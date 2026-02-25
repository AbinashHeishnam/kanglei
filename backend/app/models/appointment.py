from sqlalchemy import Column, Integer, String, Text, Date, TIMESTAMP, JSON, func
from app.db.base import Base  # <-- THIS IS CRUCIAL


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(30), nullable=False)
    address = Column(String(300))
    message = Column(Text)
    status = Column(String(30), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    counseling_type = Column(String(100), nullable=False, server_default="General Counseling")
    deleted_at = Column(TIMESTAMP(timezone=True))

    # --- NEW FIELDS ---
    date_of_birth = Column(Date, nullable=True)
    guardian_name = Column(String(255), nullable=True)
    guardian_contact = Column(String(30), nullable=True)
    appointment_type = Column(JSON, nullable=True)
