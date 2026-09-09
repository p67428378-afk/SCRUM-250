from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.core.database import get_db
from server.core.security import get_current_active_user
from server.models.user import User
from server.models.patient import Patient
from server.models.audit_log import AuditLog
from server.schemas.patient import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Check duplicate SSN/Government ID
    existing = (
        db.query(Patient).filter(Patient.ssn_gov_id == patient_in.ssn_gov_id).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A patient with this SSN / Government ID is already registered.",
        )

    patient = Patient(
        first_name=patient_in.first_name,
        last_name=patient_in.last_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        ssn_gov_id=patient_in.ssn_gov_id,
        phone_number=patient_in.phone_number,
        email=patient_in.email,
        emergency_contact=patient_in.emergency_contact,
        medical_history=patient_in.medical_history,
    )
    db.add(patient)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="CREATE_PATIENT",
        target_resource="patients",
        target_id=patient.id,
        ip_address=request.client.host if request.client else None,
        details={
            "name": f"{patient.first_name} {patient.last_name}",
            "ssn": patient.ssn_gov_id,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=List[PatientResponse])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    gender: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Patient)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(search_pattern),
                Patient.last_name.ilike(search_pattern),
                Patient.ssn_gov_id.ilike(search_pattern),
                Patient.phone_number.ilike(search_pattern),
            )
        )
    if gender:
        query = query.filter(Patient.gender.ilike(gender))

    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    if patient_update.ssn_gov_id and patient_update.ssn_gov_id != patient.ssn_gov_id:
        duplicate = (
            db.query(Patient)
            .filter(
                Patient.ssn_gov_id == patient_update.ssn_gov_id,
                Patient.id != patient_id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this SSN / Government ID is already registered.",
            )

    update_data = patient_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="UPDATE_PATIENT",
        target_resource="patients",
        target_id=patient.id,
        ip_address=request.client.host if request.client else None,
        details=update_data,
    )
    db.add(audit)
    db.commit()
    db.refresh(patient)
    return patient
