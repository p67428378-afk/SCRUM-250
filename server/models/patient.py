import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from server.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(
        String(50), nullable=False
    )  # ISO date string e.g. YYYY-MM-DD
    gender = Column(String(20), nullable=False)
    ssn_gov_id = Column(String(50), unique=True, index=True, nullable=False)
    phone_number = Column(String(30), nullable=False)
    email = Column(String(255), nullable=True)
    emergency_contact = Column(JSON, nullable=False, default=dict)
    medical_history = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    encounters = relationship(
        "Encounter", back_populates="patient", cascade="all, delete-orphan"
    )
