from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from server.schemas.patient import PatientResponse
from server.schemas.doctor import DoctorResponse


class PrescriptionBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionResponse(PrescriptionBase):
    id: str
    encounter_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class EncounterBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    clinical_notes: str
    icd10_diagnosis_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    status: Optional[str] = "Completed"


class EncounterCreate(EncounterBase):
    prescriptions: Optional[List[PrescriptionCreate]] = []


class EncounterUpdate(BaseModel):
    clinical_notes: Optional[str] = None
    icd10_diagnosis_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    status: Optional[str] = None


class EncounterResponse(EncounterBase):
    id: str
    created_at: datetime
    updated_at: datetime
    prescriptions: List[PrescriptionResponse] = []
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True
