from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.db.base import Base

class EventPoster(Base):
    __tablename__ = "event_posters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=True)
    image_path = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
