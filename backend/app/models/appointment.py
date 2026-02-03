from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.db.base import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    counseling_type = Column(String(100), nullable=False, default="General Counseling")

    name = Column(String(200), nullable=False)
    phone = Column(String(30), nullable=False, index=True)
    address = Column(String(300), nullable=True)
    message = Column(Text, nullable=True)

    status = Column(String(30), default="NEW", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
