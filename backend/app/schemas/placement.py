from pydantic import BaseModel
from datetime import datetime


class PlacementOut(BaseModel):
    id: int
    image_path: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
