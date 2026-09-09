import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.core.security import get_current_active_user
from server.models.user import User
from server.models.patient import Patient
from server.models.doctor import Doctor
from server.models.appointment import Appointment
from server.models.audit_log import AuditLog
from server.schemas.appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentResponse,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def generate_reference_code(db: Session) -> str:
    while True:
        code = f"APT-{random.randint(1000, 9999)}"
        existing = (
            db.query(Appointment).filter(Appointment.reference_code == code).first()
        )
        if not existing:
            return code


@router.post(
    "", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED
)
def book_appointment(
    appt_in: AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    start_time = appt_in.appointment_start
    end_time = appt_in.appointment_end

    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment start time must be before end time.",
        )

    # Concurrency check / double-booking conflict prevention
    # In SQLite / PostgreSQL, we query for overlapping active appointments
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status.in_(["Scheduled", "In-Progress"]),
            Appointment.appointment_start < end_time,
            Appointment.appointment_end > start_time,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The doctor is already booked for this requested time slot.",
        )

    ref_code = generate_reference_code(db)
    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_start=start_time,
        appointment_end=end_time,
        status="Scheduled",
        reference_code=ref_code,
        reason_for_visit=appt_in.reason_for_visit,
    )
    db.add(appointment)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="CREATE_APPOINTMENT",
        target_resource="appointments",
        target_id=appointment.id,
        ip_address=request.client.host if request.client else None,
        details={
            "reference_code": ref_code,
            "patient_id": patient.id,
            "doctor_id": doctor.id,
            "start": start_time.isoformat(),
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Appointment)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status_filter:
        query = query.filter(Appointment.status.ilike(status_filter))
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            query = query.filter(Appointment.appointment_start >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
            query = query.filter(Appointment.appointment_end <= ed)
        except ValueError:
            pass

    appointments = (
        query.order_by(Appointment.appointment_start.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )
    return appointment


@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: str,
    reschedule_in: AppointmentReschedule,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    start_time = reschedule_in.appointment_start
    end_time = reschedule_in.appointment_end

    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment start time must be before end time.",
        )

    # Check conflict with other appointments
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.id != appointment.id,
            Appointment.status.in_(["Scheduled", "In-Progress"]),
            Appointment.appointment_start < end_time,
            Appointment.appointment_end > start_time,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The doctor is already booked for this requested rescheduled time slot.",
        )

    appointment.appointment_start = start_time
    appointment.appointment_end = end_time
    appointment.status = "Scheduled"

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="RESCHEDULE_APPOINTMENT",
        target_resource="appointments",
        target_id=appointment.id,
        ip_address=request.client.host if request.client else None,
        details={"start": start_time.isoformat(), "end": end_time.isoformat()},
    )
    db.add(audit)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )

    appointment.status = "Cancelled"

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="CANCEL_APPOINTMENT",
        target_resource="appointments",
        target_id=appointment.id,
        ip_address=request.client.host if request.client else None,
        details={"status": "Cancelled"},
    )
    db.add(audit)
    db.commit()
    db.refresh(appointment)
    return appointment
