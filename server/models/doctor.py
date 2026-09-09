import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from server.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)
    working_hours = Column(JSON, nullable=False, default=dict)
    slot_duration_mins = Column(Integer, nullable=False, default=30)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship(
        "Appointment", back_populates="doctor", cascade="all, delete-orphan"
    )
    encounters = relationship(
        "Encounter", back_populates="doctor", cascade="all, delete-orphan"
    )
