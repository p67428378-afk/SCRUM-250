import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import SidebarNavigation from "../components/SidebarNavigation";
import TopHeaderBar from "../components/TopHeaderBar";
import PatientTable from "../components/PatientTable";
import PatientRegistrationModal from "../components/PatientRegistrationModal";
import DoctorScheduleGrid from "../components/DoctorScheduleGrid";
import AppointmentBookingMatrix from "../components/AppointmentBookingMatrix";
import EHREncounterEditor from "../components/EHREncounterEditor";
import DashboardPage from "../pages/DashboardPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import {
  authApi,
  patientsApi,
  doctorsApi,
  appointmentsApi,
  encountersApi,
  auditLogsApi,
} from "../services/api";

describe("Hospital Management System Frontend Component Suite", () => {
  const mockUser = {
    id: "44444444-4444-4444-4444-444444444444",
    email: "test@example.com",
    full_name: "Elena Rostova, MHA",
    role: "Receptionist",
  };

  const mockDoctorUser = {
    id: "22222222-2222-2222-2222-222222222222",
    email: "doctor@example.com",
    full_name: "Dr. Sarah Jenkins, MD",
    role: "Doctor",
  };

  const mockPatients = [
    {
      id: "89410000-0000-0000-0000-000000000000",
      first_name: "Marcus",
      last_name: "Vance",
      date_of_birth: "1979-10-14",
      gender: "Male",
      ssn_gov_id: "984-23-4821",
      phone_number: "+1 (555) 234-5890",
      emergency_contact: {
        name: "Sarah Vance",
        relationship: "Spouse",
        phone: "+1 (555) 901-2234",
      },
      medical_history: "Cardiac Stent (2021)",
    },
  ];

  const mockDoctors = [
    {
      id: "d1111111-1111-1111-1111-111111111111",
      user_id: "22222222-2222-2222-2222-222222222222",
      department: "Cardiology",
      specialization: "Cardiovascular Diseases",
      working_hours: {
        monday: { start: "08:00", end: "16:00" },
        tuesday: { start: "08:00", end: "16:00" },
      },
      slot_duration_mins: 30,
      user: {
        id: "22222222-2222-2222-2222-222222222222",
        full_name: "Dr. Sarah Jenkins, MD",
        role: "Doctor",
      },
    },
  ];

  it("verifies API service modules export expected contract methods", () => {
    expect(typeof authApi.login).toBe("function");
    expect(typeof authApi.getMe).toBe("function");
    expect(typeof patientsApi.list).toBe("function");
    expect(typeof patientsApi.create).toBe("function");
    expect(typeof doctorsApi.list).toBe("function");
    expect(typeof doctorsApi.getAvailability).toBe("function");
    expect(typeof appointmentsApi.book).toBe("function");
    expect(typeof encountersApi.create).toBe("function");
    expect(typeof auditLogsApi.list).toBe("function");
  });

  it("renders SidebarNavigation with navigation links and active wing", () => {
    render(
      <BrowserRouter>
        <SidebarNavigation
          currentUser={mockUser}
          onLogout={() => {}}
          appointmentCount={42}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("St. Jude Medical")).toBeInTheDocument();
    expect(screen.getByText("Clinical Operations")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
    expect(screen.getByText("Doctors")).toBeInTheDocument();
    expect(screen.getByText("Cardiology Wing Active")).toBeInTheDocument();
    expect(screen.getByText("Elena Rostova, MHA")).toBeInTheDocument();
  });

  it("renders TopHeaderBar with search bar, system sync status, and emergency alert button", () => {
    const handleEmergency = vi.fn();
    render(
      <TopHeaderBar
        currentUser={mockUser}
        searchTerm=""
        onSearchChange={() => {}}
        onEmergencyAlert={handleEmergency}
      />,
    );

    expect(
      screen.getByPlaceholderText(/Search patient by MRN/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/System Sync: Live/i)).toBeInTheDocument();
    const alertBtn = screen.getByText(/Emergency Alert/i);
    expect(alertBtn).toBeInTheDocument();

    fireEvent.click(alertBtn);
    expect(handleEmergency).toHaveBeenCalled();
  });

  it("renders PatientTable with masked SSN and verified badge", () => {
    render(
      <PatientTable
        patients={mockPatients}
        loading={false}
        onSelectPatient={() => {}}
      />,
    );

    expect(screen.getByText("Marcus Vance")).toBeInTheDocument();
    expect(screen.getByText(/XXX-XX-4821/)).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Cardiac Stent (2021)")).toBeInTheDocument();
  });

  it("renders PatientRegistrationModal with all required intake inputs", () => {
    render(
      <PatientRegistrationModal
        isOpen={true}
        onClose={() => {}}
        onPatientRegistered={() => {}}
      />,
    );

    expect(screen.getByText("Register New Patient")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Marcus")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Vance")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 984-23-4821")).toBeInTheDocument();
    expect(screen.getByText("Register Patient")).toBeInTheDocument();
  });

  it("renders DoctorScheduleGrid with weekly availability and shift window form", () => {
    render(
      <DoctorScheduleGrid doctors={mockDoctors} onScheduleUpdated={() => {}} />,
    );

    expect(
      screen.getByText("Weekly Doctor Availability Grid"),
    ).toBeInTheDocument();
    expect(screen.getByText("Shift & Slot Configuration")).toBeInTheDocument();
    expect(screen.getByText(/Active \(Mon-Fri\)/i)).toBeInTheDocument();
  });

  it("renders AppointmentBookingMatrix with pessimistic concurrency lock banner", () => {
    render(
      <AppointmentBookingMatrix
        patients={mockPatients}
        doctors={mockDoctors}
      />,
    );

    expect(
      screen.getByText("Pessimistic Concurrency Lock Active"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Guaranteed Atomic/i)).toBeInTheDocument();
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
  });

  it("renders EHREncounterEditor with vital signs, SOAP notes, and ICD-10 selector", () => {
    render(
      <EHREncounterEditor
        patient={mockPatients[0]}
        doctor={mockDoctors[0]}
        currentUser={mockDoctorUser}
      />,
    );

    expect(screen.getByText(/Marcus Vance/i)).toBeInTheDocument();
    expect(screen.getByText(/Allergy: Penicillin/i)).toBeInTheDocument();
    expect(screen.getByText(/124\/82/)).toBeInTheDocument();
    expect(screen.getByText("1. Clinical SOAP Notes")).toBeInTheDocument();
    expect(
      screen.getByText("2. Diagnostic Coding (ICD-10)"),
    ).toBeInTheDocument();
    expect(screen.getByText("3. Prescriptions & Orders")).toBeInTheDocument();
    expect(
      screen.getByText(/Finalize Encounter & Sign Record/i),
    ).toBeInTheDocument();
  });

  it("renders DashboardPage metrics and roster table", () => {
    render(
      <BrowserRouter>
        <DashboardPage currentUser={mockUser} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Total Registered Patients")).toBeInTheDocument();
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByText("Doctors On Duty")).toBeInTheDocument();
    expect(screen.getByText("Today's Appointment Roster")).toBeInTheDocument();
  });

  it("renders AuditLogsPage with HIPAA compliance banner", () => {
    render(<AuditLogsPage currentUser={mockUser} />);

    expect(
      screen.getByText("Security & Compliance Audit Trail"),
    ).toBeInTheDocument();
    expect(screen.getByText("HIPAA Compliant")).toBeInTheDocument();
  });
});
