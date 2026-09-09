from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    user_id: Optional[str] = None
    user_role: str
    action: str
    target_resource: str
    target_id: str
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
