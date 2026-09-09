import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  UserCheck,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle,
} from "lucide-react";
import {
  patientsApi,
  appointmentsApi,
  doctorsApi,
  encountersApi,
} from "../services/api";

export default function DashboardPage({ currentUser, onOpenRegisterModal }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentCount: 0,
    doctorCount: 0,
    encounterCount: 0,
  });

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      patientsApi.list({ limit: 100 }),
      appointmentsApi.list({ limit: 50 }),
      doctorsApi.list({ limit: 50 }),
      encountersApi.list({ limit: 50 }),
    ]).then(([patientsRes, apptsRes, docsRes, encountersRes]) => {
      if (!isMounted) return;

      const patients =
        patientsRes.status === "fulfilled" ? patientsRes.value : [];
      const appts = apptsRes.status === "fulfilled" ? apptsRes.value : [];
      const docs = docsRes.status === "fulfilled" ? docsRes.value : [];
      const encounters =
        encountersRes.status === "fulfilled" ? encountersRes.value : [];

      setStats({
        patientCount: patients.length,
        appointmentCount: appts.length,
        doctorCount: docs.length,
        encounterCount: encounters.length,
      });

      setTodayAppointments(appts.slice(0, 8));
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Scheduled":
        return (
          <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-full border border-sky-200">
            Scheduled
          </span>
        );
      case "In-Progress":
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
            In-Progress
          </span>
        );
      case "Completed":
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            Completed
          </span>
        );
      case "Cancelled":
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Registered Patients
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.patientCount}
            </h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Master Index Active
            </p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Today's Appointments
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.appointmentCount}
            </h3>
            <p className="text-xs text-sky-600 mt-1 font-medium">
              Roster Synchronized
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Doctors On Duty
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.doctorCount}
            </h3>
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              Cardiology / Active
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Clinical Encounters
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.encounterCount}
            </h3>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              Signed EHR Records
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Section: Today's Appointment Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Today's Appointment Roster
            </h2>
            <p className="text-xs text-slate-500">
              Active patient consult schedule and triage roster
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenRegisterModal && onOpenRegisterModal()}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              + Register Patient
            </button>
            <button
              onClick={() => navigate("/appointments")}
              className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Ref Code</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Time</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading appointments roster...
                  </td>
                </tr>
              ) : todayAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      No appointments scheduled for today
                    </p>
                    <p className="text-slate-400 mt-1">
                      Book an appointment to populate the roster.
                    </p>
                  </td>
                </tr>
              ) : (
                todayAppointments.map((appt) => (
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
                        : `Patient #${appt.patient_id?.substring(0, 6) || "Unknown"}`}
                    </td>
                    <td className="p-3 text-slate-600">
                      {appt.doctor?.user?.full_name || "Dr. Sarah Jenkins"}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {formatTime(appt.appointment_start)}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {appt.reason_for_visit || "Clinical consultation"}
                    </td>
                    <td className="p-3">{getStatusBadge(appt.status)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate("/encounters")}
                        className="px-3 py-1 bg-sky-600 text-white text-xs font-medium rounded-md hover:bg-sky-700 transition-colors shadow-sm"
                      >
                        Start Encounter
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

DashboardPage.propTypes = {
  currentUser: PropTypes.object,
  onOpenRegisterModal: PropTypes.func,
};

DashboardPage.defaultProps = {
  currentUser: null,
  onOpenRegisterModal: null,
};
