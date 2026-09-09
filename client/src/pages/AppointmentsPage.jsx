import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { appointmentsApi, patientsApi, doctorsApi } from "../services/api";
import AppointmentBookingMatrix from "../components/AppointmentBookingMatrix";

export default function AppointmentsPage({ currentUser }) {
  const location = useLocation();
  const preselectedPatient = location.state?.selectedPatient || null;

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Reschedule Modal state
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      patientsApi.list({ limit: 100 }),
      doctorsApi.list({ limit: 50 }),
      appointmentsApi.list({ limit: 50 }),
    ]).then(([pRes, dRes, aRes]) => {
      if (pRes.status === "fulfilled") setPatients(pRes.value || []);
      if (dRes.status === "fulfilled") setDoctors(dRes.value || []);
      if (aRes.status === "fulfilled") setAppointments(aRes.value || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;
    setActionError("");
    setActionSuccess("");

    try {
      await appointmentsApi.cancel(appointmentId);
      setActionSuccess("Appointment successfully cancelled.");
      loadData();
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to cancel appointment",
      );
    }
  };

  const handleOpenReschedule = (appt) => {
    setReschedulingAppt(appt);
    setNewStart(appt.appointment_start?.slice(0, 16) || "");
    setNewEnd(appt.appointment_end?.slice(0, 16) || "");
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!reschedulingAppt) return;

    setRescheduleLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await appointmentsApi.reschedule(reschedulingAppt.id, {
        appointment_start: new Date(newStart).toISOString(),
        appointment_end: new Date(newEnd).toISOString(),
      });
      setActionSuccess(
        `Appointment #${reschedulingAppt.reference_code} rescheduled successfully!`,
      );
      setReschedulingAppt(null);
      loadData();
    } catch (err) {
      setActionError(
        err.response?.data?.detail || err.message || "Failed to reschedule",
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Appointment Booking & Real-Time Slot Reservation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate patient bookings with doctor shifts, slot duration, and
            concurrency locks
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Interactive Booking Matrix Component */}
      <AppointmentBookingMatrix
        patients={patients}
        doctors={doctors}
        preselectedPatient={preselectedPatient}
        onAppointmentBooked={() => loadData()}
      />

      {/* Appointment History / Manage Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          All Active & Past Appointments
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Ref Code</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Start Time</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No appointment records in system.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-sky-700">
                      {appt.reference_code || `#APT-${appt.id.substring(0, 4)}`}
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {appt.patient
                        ? `${appt.patient.first_name} ${appt.patient.last_name}`
                        : `Patient #${appt.patient_id?.substring(0, 6)}`}
                    </td>
                    <td className="p-3 text-slate-600">
                      {appt.doctor?.user?.full_name || "Dr. Sarah Jenkins"}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {formatDateTime(appt.appointment_start)}
                    </td>
                    <td className="p-3 text-slate-600">
                      {formatDateTime(appt.appointment_end)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          appt.status === "Scheduled"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : appt.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : appt.status === "Cancelled"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {appt.status === "Scheduled" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReschedule(appt)}
                            className="px-2.5 py-1 text-slate-700 border border-slate-300 rounded hover:bg-slate-50 text-[11px] font-medium"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="px-2.5 py-1 text-rose-600 border border-rose-200 rounded hover:bg-rose-50 text-[11px] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Reschedule Appointment ({reschedulingAppt.reference_code})
            </h3>
            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">
                  New Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">New End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="px-3 py-1.5 border rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="px-4 py-1.5 bg-sky-600 text-white font-bold rounded-md hover:bg-sky-700"
                >
                  {rescheduleLoading ? "Updating..." : "Save New Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

AppointmentsPage.propTypes = {
  currentUser: PropTypes.object,
};

AppointmentsPage.defaultProps = {
  currentUser: null,
};
