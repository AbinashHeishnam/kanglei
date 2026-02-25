from pydantic import BaseModel
from typing import Optional


class GalleryOut(BaseModel):
    id: int
    image_url: str
    caption: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
