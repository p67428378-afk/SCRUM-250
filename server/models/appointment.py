import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from server.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    appointment_start = Column(DateTime, nullable=False, index=True)
    appointment_end = Column(DateTime, nullable=False)
    status = Column(
        String(30), nullable=False, default="Scheduled"
    )  # Scheduled, In-Progress, Completed, Cancelled
    reference_code = Column(String(30), unique=True, index=True, nullable=False)
    reason_for_visit = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    encounter = relationship(
        "Encounter",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan",
    )
