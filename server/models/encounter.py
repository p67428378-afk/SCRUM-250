import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.core.database import Base


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(
        String(36), ForeignKey("appointments.id"), unique=True, nullable=True
    )
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    clinical_notes = Column(Text, nullable=False)
    icd10_diagnosis_code = Column(String(50), nullable=True)
    diagnosis_description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Completed")
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    appointment = relationship("Appointment", back_populates="encounter")
    patient = relationship("Patient", back_populates="encounters")
    doctor = relationship("Doctor", back_populates="encounters")
    prescriptions = relationship(
        "Prescription", back_populates="encounter", cascade="all, delete-orphan"
    )
