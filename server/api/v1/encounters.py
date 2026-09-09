from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from server.core.database import get_db
from server.core.security import get_current_active_user
from server.models.user import User
from server.models.patient import Patient
from server.models.doctor import Doctor
from server.models.appointment import Appointment
from server.models.encounter import Encounter
from server.models.prescription import Prescription
from server.models.audit_log import AuditLog
from server.schemas.encounter import (
    EncounterCreate,
    EncounterUpdate,
    EncounterResponse,
    PrescriptionCreate,
    PrescriptionResponse,
)

router = APIRouter(prefix="/encounters", tags=["encounters"])


@router.post("", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
def create_encounter(
    encounter_in: EncounterCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # RBAC Enforcement: Receptionists cannot record or edit consultation notes
    if current_user.role not in ["Admin", "Doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Doctors and Administrators can record medical encounter notes.",
        )

    patient = db.query(Patient).filter(Patient.id == encounter_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    doctor = db.query(Doctor).filter(Doctor.id == encounter_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    if encounter_in.appointment_id:
        appt = (
            db.query(Appointment)
            .filter(Appointment.id == encounter_in.appointment_id)
            .first()
        )
        if not appt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
            )
        # Update appointment status to completed if appropriate
        appt.status = "Completed"

    encounter = Encounter(
        patient_id=encounter_in.patient_id,
        doctor_id=encounter_in.doctor_id,
        appointment_id=encounter_in.appointment_id,
        clinical_notes=encounter_in.clinical_notes,
        icd10_diagnosis_code=encounter_in.icd10_diagnosis_code,
        diagnosis_description=encounter_in.diagnosis_description,
        status=encounter_in.status or "Completed",
    )
    db.add(encounter)
    db.flush()

    if encounter_in.prescriptions:
        for rx_in in encounter_in.prescriptions:
            rx = Prescription(
                encounter_id=encounter.id,
                medication_name=rx_in.medication_name,
                dosage=rx_in.dosage,
                frequency=rx_in.frequency,
                duration_days=rx_in.duration_days,
                instructions=rx_in.instructions,
            )
            db.add(rx)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="CREATE_ENCOUNTER",
        target_resource="encounters",
        target_id=encounter.id,
        ip_address=request.client.host if request.client else None,
        details={
            "patient_id": encounter.patient_id,
            "doctor_id": encounter.doctor_id,
            "icd10": encounter.icd10_diagnosis_code,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(encounter)
    return encounter


@router.get("", response_model=List[EncounterResponse])
def list_encounters(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    appointment_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Encounter).options(joinedload(Encounter.prescriptions))
    if patient_id:
        query = query.filter(Encounter.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Encounter.doctor_id == doctor_id)
    if appointment_id:
        query = query.filter(Encounter.appointment_id == appointment_id)

    encounters = (
        query.order_by(Encounter.created_at.desc()).offset(skip).limit(limit).all()
    )
    return encounters


@router.get("/{encounter_id}", response_model=EncounterResponse)
def get_encounter(
    encounter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    encounter = (
        db.query(Encounter)
        .options(joinedload(Encounter.prescriptions))
        .filter(Encounter.id == encounter_id)
        .first()
    )
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Encounter not found"
        )
    return encounter


@router.put("/{encounter_id}", response_model=EncounterResponse)
def update_encounter(
    encounter_id: str,
    encounter_update: EncounterUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # RBAC Enforcement: Receptionists cannot edit consultation notes
    if current_user.role not in ["Admin", "Doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Doctors and Administrators can modify medical encounter notes.",
        )

    encounter = (
        db.query(Encounter)
        .options(joinedload(Encounter.prescriptions))
        .filter(Encounter.id == encounter_id)
        .first()
    )
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Encounter not found"
        )

    update_data = encounter_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(encounter, field, value)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="UPDATE_ENCOUNTER",
        target_resource="encounters",
        target_id=encounter.id,
        ip_address=request.client.host if request.client else None,
        details=update_data,
    )
    db.add(audit)
    db.commit()
    db.refresh(encounter)
    return encounter


@router.post(
    "/{encounter_id}/prescriptions",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_prescription(
    encounter_id: str,
    rx_in: PrescriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["Admin", "Doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Doctors and Administrators can issue prescriptions.",
        )

    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Encounter not found"
        )

    rx = Prescription(
        encounter_id=encounter.id,
        medication_name=rx_in.medication_name,
        dosage=rx_in.dosage,
        frequency=rx_in.frequency,
        duration_days=rx_in.duration_days,
        instructions=rx_in.instructions,
    )
    db.add(rx)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="ADD_PRESCRIPTION",
        target_resource="prescriptions",
        target_id=rx.id,
        ip_address=request.client.host if request.client else None,
        details={"medication": rx.medication_name, "dosage": rx.dosage},
    )
    db.add(audit)
    db.commit()
    db.refresh(rx)
    return rx


@router.post(
    "/{encounter_id}/lab-orders",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def issue_lab_order(
    encounter_id: str,
    lab_order: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["Admin", "Doctor", "Nurse"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Clinical staff can order lab tests.",
        )

    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Encounter not found"
        )

    test_name = lab_order.get("test_name", "General Lab Requisition")
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="ORDER_LAB_TEST",
        target_resource="encounters",
        target_id=encounter.id,
        ip_address=request.client.host if request.client else None,
        details={"test_name": test_name, "instructions": lab_order.get("instructions")},
    )
    db.add(audit)
    db.commit()

    return {
        "status": "Ordered",
        "encounter_id": encounter.id,
        "test_name": test_name,
        "ordered_by": current_user.full_name,
        "message": f"Lab order '{test_name}' successfully submitted.",
    }
