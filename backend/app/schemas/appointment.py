from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List

VALID_STATUSES = {"NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"}

class AppointmentCreate(BaseModel):
    counseling_type: str = Field(default="General Counseling", min_length=2, max_length=100)
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=6, max_length=30)
    address: Optional[str] = Field(default=None, max_length=300)
    message: Optional[str] = None
    
    # New Fields
    date_of_birth: Optional[date] = None
    guardian_name: Optional[str] = Field(default=None, max_length=255)
    guardian_contact: Optional[str] = Field(default=None, max_length=30)
    appointment_type: Optional[List[str]] = Field(default=None)

class AppointmentOut(BaseModel):
    id: int
    counseling_type: str
    name: str
    phone: str
    address: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime
    
    # New Fields
    date_of_birth: Optional[date]
    guardian_name: Optional[str]
    guardian_contact: Optional[str]
    appointment_type: Optional[List[str]]

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=30)
