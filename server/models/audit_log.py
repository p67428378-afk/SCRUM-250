import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from server.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_role = Column(String(50), nullable=False)
    action = Column(
        String(100), nullable=False
    )  # CREATE_PATIENT, UPDATE_PATIENT, CREATE_APPOINTMENT, etc.
    target_resource = Column(
        String(100), nullable=False
    )  # patients, appointments, encounters, etc.
    target_id = Column(String(36), nullable=False)
    ip_address = Column(String(45), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="audit_logs")
