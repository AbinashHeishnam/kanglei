from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.db.base import Base

class GalleryPost(Base):
    __tablename__ = "gallery_posts"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String(500), nullable=False)
    caption = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
