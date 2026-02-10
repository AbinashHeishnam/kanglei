from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class EventBase(BaseModel):
    title: Optional[str] = None
    is_active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class EventResponse(EventBase):
    id: int
    image_url: str
    created_at: datetime

    class Config:
        # Pydantic v2 compatible
        from_attributes = True