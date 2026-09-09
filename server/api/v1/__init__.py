from fastapi import APIRouter
from server.api.v1.auth import router as auth_router
from server.api.v1.patients import router as patients_router
from server.api.v1.doctors import router as doctors_router
from server.api.v1.appointments import router as appointments_router
from server.api.v1.encounters import router as encounters_router
from server.api.v1.audit_logs import router as audit_logs_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(doctors_router)
api_router.include_router(appointments_router)
api_router.include_router(encounters_router)
api_router.include_router(audit_logs_router)
