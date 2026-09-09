# AC: Medical Consultations & EHR Record Keeping - Record clinical encounter and prescriptions
def test_create_encounter_by_doctor(client, doctor_headers):
    # Register patient
    p_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Grace",
            "last_name": "Hopper",
            "date_of_birth": "1960-12-09",
            "gender": "Female",
            "ssn_gov_id": "444-55-6666",
            "phone_number": "+1 (555) 888-9999",
        },
        headers=doctor_headers,
    )
    patient_id = p_res.json()["id"]

    # Get doctor
    doc_res = client.get("/api/v1/doctors", headers=doctor_headers)
    doctor_id = doc_res.json()[0]["id"]

    enc_payload = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "clinical_notes": "Patient presents with mild hypertension. Lungs clear.",
        "icd10_diagnosis_code": "I10",
        "diagnosis_description": "Essential (primary) hypertension",
        "status": "Completed",
        "prescriptions": [
            {
                "medication_name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "Once daily",
                "duration_days": 30,
                "instructions": "Take in the morning with water",
            }
        ],
    }

    response = client.post(
        "/api/v1/encounters", json=enc_payload, headers=doctor_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert (
        data["clinical_notes"]
        == "Patient presents with mild hypertension. Lungs clear."
    )
    assert data["icd10_diagnosis_code"] == "I10"
    assert len(data["prescriptions"]) == 1
    assert data["prescriptions"][0]["medication_name"] == "Lisinopril"


# AC: Business Rules & RBAC - Receptionist cannot create or edit encounter notes (403 Forbidden)
def test_receptionist_forbidden_from_encounters(client, receptionist_headers):
    enc_payload = {
        "patient_id": "any-id",
        "doctor_id": "any-doc-id",
        "clinical_notes": "Attempting note creation",
        "icd10_diagnosis_code": "I10",
    }
    # Create attempt by receptionist
    response = client.post(
        "/api/v1/encounters", json=enc_payload, headers=receptionist_headers
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


# AC: Medical Consultations & EHR Record Keeping - Add prescription and issue lab order
def test_add_prescription_and_lab_order(client, doctor_headers):
    # Patient
    p_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Henry",
            "last_name": "Ford",
            "date_of_birth": "1975-04-18",
            "gender": "Male",
            "ssn_gov_id": "333-22-1111",
            "phone_number": "+1 (555) 777-6666",
        },
        headers=doctor_headers,
    )
    patient_id = p_res.json()["id"]
    doc_res = client.get("/api/v1/doctors", headers=doctor_headers)
    doctor_id = doc_res.json()[0]["id"]

    enc_res = client.post(
        "/api/v1/encounters",
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "clinical_notes": "Cardiology consultation notes.",
            "icd10_diagnosis_code": "I25.10",
        },
        headers=doctor_headers,
    )
    encounter_id = enc_res.json()["id"]

    # Add extra prescription
    rx_res = client.post(
        f"/api/v1/encounters/{encounter_id}/prescriptions",
        json={
            "medication_name": "Atorvastatin",
            "dosage": "20mg",
            "frequency": "Once daily at bedtime",
            "duration_days": 90,
            "instructions": "Avoid grapefruit",
        },
        headers=doctor_headers,
    )
    assert rx_res.status_code == 201
    assert rx_res.json()["medication_name"] == "Atorvastatin"

    # Issue lab order
    lab_res = client.post(
        f"/api/v1/encounters/{encounter_id}/lab-orders",
        json={
            "test_name": "Fasting Lipid Panel",
            "instructions": "12 hours fasting required",
        },
        headers=doctor_headers,
    )
    assert lab_res.status_code == 201
    assert lab_res.json()["status"] == "Ordered"
