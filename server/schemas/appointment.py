from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from server.schemas.patient import PatientResponse
from server.schemas.doctor import DoctorResponse


class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_start: datetime
    appointment_end: datetime
    reason_for_visit: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentReschedule(BaseModel):
    appointment_start: datetime
    appointment_end: datetime


class AppointmentResponse(AppointmentBase):
    id: str
    status: str
    reference_code: str
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True
