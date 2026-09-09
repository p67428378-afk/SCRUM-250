from datetime import datetime, timezone


# AC: Appointment Booking & Calendar Management - Book an appointment
def test_book_appointment_success(client, receptionist_headers):
    # Register patient first
    p_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "David",
            "last_name": "Miller",
            "date_of_birth": "1988-03-20",
            "gender": "Male",
            "ssn_gov_id": "777-11-2222",
            "phone_number": "+1 (555) 555-1234",
        },
        headers=receptionist_headers,
    )
    patient_id = p_res.json()["id"]

    # Get doctor
    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    start = datetime(2026, 10, 26, 10, 0, tzinfo=timezone.utc).isoformat()
    end = datetime(2026, 10, 26, 10, 30, tzinfo=timezone.utc).isoformat()

    appt_res = client.post(
        "/api/v1/appointments",
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_start": start,
            "appointment_end": end,
            "reason_for_visit": "Annual Cardiac Checkup",
        },
        headers=receptionist_headers,
    )
    assert appt_res.status_code == 201
    data = appt_res.json()
    assert data["status"] == "Scheduled"
    assert data["reference_code"].startswith("APT-")
    assert data["patient_id"] == patient_id


# AC: Business Rules - Database transaction lock / double-booking conflict prevention
def test_double_booking_conflict(client, receptionist_headers):
    # Register another patient
    p_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Eva",
            "last_name": "Green",
            "date_of_birth": "1992-07-15",
            "gender": "Female",
            "ssn_gov_id": "666-22-3333",
            "phone_number": "+1 (555) 777-8888",
        },
        headers=receptionist_headers,
    )
    patient_id = p_res.json()["id"]

    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    start = datetime(2026, 10, 26, 14, 0, tzinfo=timezone.utc).isoformat()
    end = datetime(2026, 10, 26, 14, 30, tzinfo=timezone.utc).isoformat()

    # First booking
    res1 = client.post(
        "/api/v1/appointments",
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_start": start,
            "appointment_end": end,
            "reason_for_visit": "First visit",
        },
        headers=receptionist_headers,
    )
    assert res1.status_code == 201

    # Overlapping second booking attempt
    res2 = client.post(
        "/api/v1/appointments",
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_start": start,
            "appointment_end": end,
            "reason_for_visit": "Colliding booking",
        },
        headers=receptionist_headers,
    )
    assert res2.status_code == 409
    assert "already booked" in res2.json()["detail"]


# AC: Appointment Booking & Calendar Management - Reschedule and Cancel appointment
def test_reschedule_and_cancel_appointment(client, receptionist_headers):
    # Patient
    p_res = client.post(
        "/api/v1/patients",
        json={
            "first_name": "Frank",
            "last_name": "Castle",
            "date_of_birth": "1980-11-10",
            "gender": "Male",
            "ssn_gov_id": "555-33-4444",
            "phone_number": "+1 (555) 444-3333",
        },
        headers=receptionist_headers,
    )
    patient_id = p_res.json()["id"]

    doc_res = client.get("/api/v1/doctors", headers=receptionist_headers)
    doctor_id = doc_res.json()[0]["id"]

    start = datetime(2026, 10, 27, 9, 0, tzinfo=timezone.utc).isoformat()
    end = datetime(2026, 10, 27, 9, 30, tzinfo=timezone.utc).isoformat()

    appt_res = client.post(
        "/api/v1/appointments",
        json={
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_start": start,
            "appointment_end": end,
        },
        headers=receptionist_headers,
    )
    appt_id = appt_res.json()["id"]

    # Reschedule
    new_start = datetime(2026, 10, 27, 11, 0, tzinfo=timezone.utc).isoformat()
    new_end = datetime(2026, 10, 27, 11, 30, tzinfo=timezone.utc).isoformat()

    resched_res = client.put(
        f"/api/v1/appointments/{appt_id}/reschedule",
        json={"appointment_start": new_start, "appointment_end": new_end},
        headers=receptionist_headers,
    )
    assert resched_res.status_code == 200
    assert resched_res.json()["status"] == "Scheduled"

    # Cancel
    cancel_res = client.put(
        f"/api/v1/appointments/{appt_id}/cancel",
        headers=receptionist_headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "Cancelled"
