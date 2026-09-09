# AC: Patient Registration & Profile Management - Register patient with demographics, emergency contact, and medical history
def test_register_patient_success(client, receptionist_headers):
    payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "date_of_birth": "1979-10-14",
        "gender": "Male",
        "ssn_gov_id": "123-45-6789",
        "phone_number": "+1 (555) 234-5890",
        "email": "marcus.vance@example.com",
        "emergency_contact": {
            "name": "Sarah Vance",
            "relationship": "Spouse",
            "phone": "+1 (555) 901-2234",
        },
        "medical_history": "Cardiac Stent (2021), Penicillin Allergy",
    }
    response = client.post(
        "/api/v1/patients", json=payload, headers=receptionist_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Marcus"
    assert data["last_name"] == "Vance"
    assert data["ssn_gov_id"] == "123-45-6789"
    assert "id" in data


# AC: Business Rules - Duplicate SSN/Government ID check during patient registration
def test_register_duplicate_ssn_conflict(client, receptionist_headers):
    payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "date_of_birth": "1979-10-14",
        "gender": "Male",
        "ssn_gov_id": "123-45-6789",
        "phone_number": "+1 (555) 234-5890",
        "email": "marcus2@example.com",
    }
    # First creation
    client.post("/api/v1/patients", json=payload, headers=receptionist_headers)
    # Duplicate attempt
    response = client.post(
        "/api/v1/patients", json=payload, headers=receptionist_headers
    )
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


# AC: Patient Registration & Profile Management - Search, pagination, and list patients
def test_list_and_search_patients(client, receptionist_headers):
    p1 = {
        "first_name": "Alice",
        "last_name": "Smith",
        "date_of_birth": "1985-05-12",
        "gender": "Female",
        "ssn_gov_id": "999-11-2222",
        "phone_number": "+1 (555) 111-2222",
    }
    client.post("/api/v1/patients", json=p1, headers=receptionist_headers)

    response = client.get("/api/v1/patients?search=Alice", headers=receptionist_headers)
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert any(p["first_name"] == "Alice" for p in results)


# AC: Patient Registration & Profile Management - View and update patient profile
def test_get_and_update_patient(client, receptionist_headers):
    p = {
        "first_name": "Bob",
        "last_name": "Williams",
        "date_of_birth": "1990-01-01",
        "gender": "Male",
        "ssn_gov_id": "888-00-1111",
        "phone_number": "+1 (555) 333-4444",
    }
    res = client.post("/api/v1/patients", json=p, headers=receptionist_headers)
    patient_id = res.json()["id"]

    # Get single
    get_res = client.get(f"/api/v1/patients/{patient_id}", headers=receptionist_headers)
    assert get_res.status_code == 200
    assert get_res.json()["last_name"] == "Williams"

    # Update
    update_res = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"phone_number": "+1 (555) 999-8888", "medical_history": "Hypertension"},
        headers=receptionist_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["phone_number"] == "+1 (555) 999-8888"
    assert update_res.json()["medical_history"] == "Hypertension"
