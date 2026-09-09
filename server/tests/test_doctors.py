# AC: Doctor Scheduling & Availability Management - List doctors and filter by department
def test_list_doctors(client, admin_headers):
    response = client.get("/api/v1/doctors", headers=admin_headers)
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 1
    assert doctors[0]["department"] == "Cardiology"


# AC: Doctor Scheduling & Availability Management - Get doctor availability 30-min slots
def test_get_doctor_availability_slots(client, admin_headers):
    docs_res = client.get("/api/v1/doctors", headers=admin_headers)
    doctor_id = docs_res.json()[0]["id"]

    response = client.get(
        f"/api/v1/doctors/{doctor_id}/availability?date=2026-10-26",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_id"] == doctor_id
    assert len(data["slots"]) > 0
    # First slot should be available
    assert data["slots"][0]["is_available"] is True
    assert data["slots"][0]["status"] == "Available"


# AC: Doctor Scheduling & Availability Management - Update doctor working hours
def test_update_doctor_schedule(client, admin_headers):
    docs_res = client.get("/api/v1/doctors", headers=admin_headers)
    doctor_id = docs_res.json()[0]["id"]

    new_schedule = {
        "working_hours": {
            "monday": {"start": "09:00", "end": "17:00"},
            "tuesday": {"start": "09:00", "end": "17:00"},
            "wednesday": {"start": "09:00", "end": "17:00"},
            "thursday": {"start": "09:00", "end": "17:00"},
            "friday": {"start": "09:00", "end": "17:00"},
        },
        "slot_duration_mins": 30,
    }
    response = client.put(
        f"/api/v1/doctors/{doctor_id}/schedules",
        json=new_schedule,
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["working_hours"]["monday"]["start"] == "09:00"
