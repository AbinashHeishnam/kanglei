from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

VALID_STATUSES = {"NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"}

class AppointmentCreate(BaseModel):
    counseling_type: str = Field(default="General Counseling", min_length=2, max_length=100)
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=6, max_length=30)
    address: Optional[str] = Field(default=None, max_length=300)
    message: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    counseling_type: str
    name: str
    phone: str
    address: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=30)
