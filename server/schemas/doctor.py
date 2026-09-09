from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from server.schemas.user import UserResponse


class DoctorBase(BaseModel):
    department: str
    specialization: str
    working_hours: Dict[str, Any] = {}
    slot_duration_mins: int = 30


class DoctorCreate(DoctorBase):
    user_id: str


class DoctorUpdate(BaseModel):
    department: Optional[str] = None
    specialization: Optional[str] = None
    working_hours: Optional[Dict[str, Any]] = None
    slot_duration_mins: Optional[int] = None


class DoctorScheduleUpdate(BaseModel):
    working_hours: Dict[str, Any]
    slot_duration_mins: Optional[int] = None


class DoctorResponse(DoctorBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class AvailabilitySlot(BaseModel):
    start_time: str  # ISO format UTC
    end_time: str  # ISO format UTC
    is_available: bool
    status: str  # Available, Booked, In-Progress


class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    date: str
    slots: List[AvailabilitySlot]
