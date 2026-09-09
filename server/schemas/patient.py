from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    ssn_gov_id: str
    phone_number: str
    email: Optional[EmailStr] = None
    emergency_contact: Dict[str, Any] = {}
    medical_history: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    ssn_gov_id: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    medical_history: Optional[str] = None


class PatientResponse(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
