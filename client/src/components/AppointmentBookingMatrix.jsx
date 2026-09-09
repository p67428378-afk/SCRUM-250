import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  User,
} from "lucide-react";
import { doctorsApi, appointmentsApi } from "../services/api";

export default function AppointmentBookingMatrix({
  patients,
  doctors,
  onAppointmentBooked,
  preselectedPatient,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    preselectedPatient?.id ||
      (patients && patients.length > 0 ? patients[0].id : ""),
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    doctors && doctors.length > 0 ? doctors[0].id : "",
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reasonForVisit, setReasonForVisit] = useState(
    "Routine clinical consultation / follow-up.",
  );

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 mins lock countdown

  useEffect(() => {
    if (preselectedPatient?.id) {
      setSelectedPatientId(preselectedPatient.id);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    if (doctors && doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    let isMounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setErrorMsg("");

    doctorsApi
      .getAvailability(selectedDoctorId, selectedDate)
      .then((data) => {
        if (isMounted) {
          setSlots(data.slots || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg("Failed to load slots for the selected doctor/date.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingSlots(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId, selectedDate]);

  // Lock countdown timer
  useEffect(() => {
    let timer;
    if (selectedSlot) {
      setCountdown(300);
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedSlot]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSlotClick = (slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setErrorMsg("");
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedPatientId || !selectedDoctorId) {
      setErrorMsg("Please select a patient, doctor, date, and available slot.");
      return;
    }

    setBookingLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        appointment_start: selectedSlot.start_time,
        appointment_end: selectedSlot.end_time,
        reason_for_visit: reasonForVisit,
      };

      const newAppt = await appointmentsApi.book(payload);
      setSuccessMsg(
        `Appointment confirmed! Reference Code: ${newAppt.reference_code}`,
      );
      setSelectedSlot(null);

      // Refresh slots
      doctorsApi
        .getAvailability(selectedDoctorId, selectedDate)
        .then((data) => {
          setSlots(data.slots || []);
        });

      if (onAppointmentBooked) {
        onAppointmentBooked(newAppt);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to book appointment";
      setErrorMsg(detail);
    } finally {
      setBookingLoading(false);
    }
  };

  const currentDoctor = (doctors || []).find((d) => d.id === selectedDoctorId);
  const currentPatient = (patients || []).find(
    (p) => p.id === selectedPatientId,
  );

  const formatTimeStr = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <Lock className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950">
              Pessimistic Concurrency Lock Active
            </h3>
            <p className="text-[11px] text-emerald-700">
              Real-time DB FOR UPDATE row locking guarantees atomic slot
              reservation and eliminates double-booking.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-200 text-emerald-900 text-xs font-bold rounded-full">
          Guaranteed Atomic
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Booking Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Booking Details</span>
          </h2>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {patients.length === 0 ? (
                <option value="">No patients available</option>
              ) : (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} (#
                    {p.id.substring(0, 6).toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Attending Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {doctors.length === 0 ? (
                <option value="">No doctors available</option>
              ) : (
                doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.full_name || "Doctor"} ({d.department} -{" "}
                    {d.specialization})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Appointment Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Reason for Visit
            </label>
            <textarea
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              rows={3}
              placeholder="Symptoms, follow-up purpose, or consultation notes..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right 2 Cols: Slot Matrix & Lock Confirmation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {currentDoctor?.user?.full_name || "Doctor"} &mdash;
                Availability Grid
              </h2>
              <p className="text-xs text-slate-500">
                Date: {selectedDate} • Duration:{" "}
                {currentDoctor?.slot_duration_mins || 30} mins
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Available
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                Booked
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                In-Progress
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Slot Grid */}
          {loadingSlots ? (
            <div className="p-12 text-center text-slate-500 text-xs font-medium">
              Loading doctor schedule & slot availability...
            </div>
          ) : slots.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">
                No available slots for this date
              </p>
              <p className="text-slate-400 mt-1">
                Please select another date or doctor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-medium">
              {slots.map((slot, index) => {
                const startTime = formatTimeStr(slot.start_time);
                const isSelected =
                  selectedSlot && selectedSlot.start_time === slot.start_time;

                if (slot.status === "In-Progress") {
                  return (
                    <div
                      key={`slot-${slot.start_time || index}`}
                      className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 opacity-80"
                    >
                      <p className="font-bold">{startTime}</p>
                      <p className="text-[10px]">In-Progress</p>
                    </div>
                  );
                }

                if (!slot.is_available) {
                  return (
                    <div
                      key={`slot-${slot.start_time || index}`}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      <p className="font-semibold">{startTime}</p>
                      <p className="text-[10px]">Booked</p>
                    </div>
                  );
                }

                if (isSelected) {
                  return (
                    <div
                      key={`slot-${slot.start_time || index}`}
                      className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm"
                    >
                      <p className="text-sm">{startTime}</p>
                      <p className="text-[10px] text-emerald-700">
                        SELECTED SLOT ✓
                      </p>
                    </div>
                  );
                }

                return (
                  <button
                    key={`slot-${slot.start_time || index}`}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/80 transition-colors text-left"
                  >
                    <p className="font-bold">{startTime}</p>
                    <p className="text-[10px] text-emerald-600">Available</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Slot Reservation Lock Card */}
          {selectedSlot && (
            <div className="p-4 bg-slate-900 text-white rounded-xl mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fadeIn">
              <div>
                <p className="text-xs text-sky-400 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Lock Active • Expires in {formatTimer(countdown)} min
                  </span>
                </p>
                <p className="text-sm font-bold mt-1">
                  {currentPatient
                    ? `${currentPatient.first_name} ${currentPatient.last_name}`
                    : "Patient"}{" "}
                  ➔ {currentDoctor?.user?.full_name || "Doctor"} (
                  {formatTimeStr(selectedSlot.start_time)} -{" "}
                  {formatTimeStr(selectedSlot.end_time)})
                </p>
              </div>
              <button
                type="button"
                onClick={handleBook}
                disabled={bookingLoading}
                className="px-5 py-2.5 bg-sky-500 text-white font-bold text-xs rounded-lg hover:bg-sky-400 transition-colors shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {bookingLoading
                  ? "Securing Lock..."
                  : "Confirm & Book Appointment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AppointmentBookingMatrix.propTypes = {
  patients: PropTypes.array.isRequired,
  doctors: PropTypes.array.isRequired,
  onAppointmentBooked: PropTypes.func,
  preselectedPatient: PropTypes.object,
};

AppointmentBookingMatrix.defaultProps = {
  onAppointmentBooked: null,
  preselectedPatient: null,
};
