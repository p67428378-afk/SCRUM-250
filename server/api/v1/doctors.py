from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.core.security import get_current_active_user
from server.models.user import User
from server.models.doctor import Doctor
from server.models.appointment import Appointment
from server.models.audit_log import AuditLog
from server.schemas.doctor import (
    DoctorCreate,
    DoctorScheduleUpdate,
    DoctorResponse,
    AvailabilitySlot,
    DoctorAvailabilityResponse,
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_in: DoctorCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = db.query(User).filter(User.id == doctor_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User account not found"
        )

    existing = db.query(Doctor).filter(Doctor.user_id == doctor_in.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Doctor profile already exists for this user.",
        )

    doctor = Doctor(
        user_id=doctor_in.user_id,
        department=doctor_in.department,
        specialization=doctor_in.specialization,
        working_hours=doctor_in.working_hours
        or {
            "monday": {"start": "08:00", "end": "16:00"},
            "tuesday": {"start": "08:00", "end": "16:00"},
            "wednesday": {"start": "08:00", "end": "16:00"},
            "thursday": {"start": "08:00", "end": "16:00"},
            "friday": {"start": "08:00", "end": "16:00"},
        },
        slot_duration_mins=doctor_in.slot_duration_mins or 30,
    )
    db.add(doctor)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="CREATE_DOCTOR",
        target_resource="doctors",
        target_id=doctor.id,
        ip_address=request.client.host if request.client else None,
        details={
            "department": doctor.department,
            "specialization": doctor.specialization,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    department: Optional[str] = None,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Doctor)
    if department:
        query = query.filter(Doctor.department.ilike(f"%{department}%"))
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    doctors = query.order_by(Doctor.created_at.desc()).offset(skip).limit(limit).all()
    return doctors


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )
    return doctor


@router.put("/{doctor_id}/schedules", response_model=DoctorResponse)
def update_doctor_schedule(
    doctor_id: str,
    schedule_in: DoctorScheduleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    doctor.working_hours = schedule_in.working_hours
    if schedule_in.slot_duration_mins:
        doctor.slot_duration_mins = schedule_in.slot_duration_mins

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="UPDATE_DOCTOR_SCHEDULE",
        target_resource="doctors",
        target_id=doctor.id,
        ip_address=request.client.host if request.client else None,
        details={"working_hours": doctor.working_hours},
    )
    db.add(audit)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get("/{doctor_id}/availability", response_model=DoctorAvailabilityResponse)
def get_doctor_availability(
    doctor_id: str,
    query_date: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    target_date_str = query_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        parsed_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD",
        )

    # Day of week in lowercase (e.g. monday, tuesday)
    day_name = parsed_date.strftime("%A").lower()
    wh = doctor.working_hours or {}
    day_hours = wh.get(day_name, {"start": "08:00", "end": "16:00"})

    if not day_hours or not isinstance(day_hours, dict):
        # Doctor does not work on this day
        return DoctorAvailabilityResponse(
            doctor_id=doctor.id, date=target_date_str, slots=[]
        )

    start_str = day_hours.get("start", "08:00")
    end_str = day_hours.get("end", "16:00")
    slot_mins = doctor.slot_duration_mins or 30

    start_h, start_m = map(int, start_str.split(":"))
    end_h, end_m = map(int, end_str.split(":"))

    current_slot_start = datetime(
        parsed_date.year,
        parsed_date.month,
        parsed_date.day,
        start_h,
        start_m,
        tzinfo=timezone.utc,
    )
    day_end = datetime(
        parsed_date.year,
        parsed_date.month,
        parsed_date.day,
        end_h,
        end_m,
        tzinfo=timezone.utc,
    )

    # Query appointments on this day for this doctor
    start_of_day = datetime(
        parsed_date.year,
        parsed_date.month,
        parsed_date.day,
        0,
        0,
        0,
        tzinfo=timezone.utc,
    )
    end_of_day = datetime(
        parsed_date.year,
        parsed_date.month,
        parsed_date.day,
        23,
        59,
        59,
        tzinfo=timezone.utc,
    )

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_start >= start_of_day,
            Appointment.appointment_start <= end_of_day,
            Appointment.status.in_(["Scheduled", "In-Progress"]),
        )
        .all()
    )

    slots: List[AvailabilitySlot] = []
    while current_slot_start + timedelta(minutes=slot_mins) <= day_end:
        slot_end = current_slot_start + timedelta(minutes=slot_mins)

        # Check overlapping appointment
        matched_appt = None
        for appt in appointments:
            appt_start = appt.appointment_start
            if appt_start.tzinfo is None:
                appt_start = appt_start.replace(tzinfo=timezone.utc)
            appt_end = appt.appointment_end
            if appt_end.tzinfo is None:
                appt_end = appt_end.replace(tzinfo=timezone.utc)

            if max(current_slot_start, appt_start) < min(slot_end, appt_end):
                matched_appt = appt
                break

        if matched_appt:
            slots.append(
                AvailabilitySlot(
                    start_time=current_slot_start.isoformat(),
                    end_time=slot_end.isoformat(),
                    is_available=False,
                    status=matched_appt.status,
                )
            )
        else:
            slots.append(
                AvailabilitySlot(
                    start_time=current_slot_start.isoformat(),
                    end_time=slot_end.isoformat(),
                    is_available=True,
                    status="Available",
                )
            )

        current_slot_start = slot_end

    return DoctorAvailabilityResponse(
        doctor_id=doctor.id, date=target_date_str, slots=slots
    )
