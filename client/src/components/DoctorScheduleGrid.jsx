import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  UserCheck,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { doctorsApi } from "../services/api";

export default function DoctorScheduleGrid({
  doctors,
  onScheduleUpdated,
  onSelectDoctor,
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    doctors && doctors.length > 0 ? doctors[0].id : "",
  );
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeDoctor =
    doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  const handleDoctorClick = (doc) => {
    setSelectedDoctorId(doc.id);
    if (doc.working_hours?.monday) {
      setShiftStart(doc.working_hours.monday.start || "08:00");
      setShiftEnd(doc.working_hours.monday.end || "16:00");
    }
    if (doc.slot_duration_mins) {
      setSlotDuration(String(doc.slot_duration_mins));
    }
    if (onSelectDoctor) {
      onSelectDoctor(doc);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!activeDoctor) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const updatedSchedule = {
        working_hours: {
          monday: { start: shiftStart, end: shiftEnd },
          tuesday: { start: shiftStart, end: shiftEnd },
          wednesday: { start: shiftStart, end: shiftEnd },
          thursday: { start: shiftStart, end: shiftEnd },
          friday: { start: shiftStart, end: shiftEnd },
        },
        slot_duration_mins: parseInt(slotDuration, 10),
      };

      const updated = await doctorsApi.updateSchedule(
        activeDoctor.id,
        updatedSchedule,
      );
      setSuccessMsg(`Schedule updated for Doctor!`);
      if (onScheduleUpdated) {
        onScheduleUpdated(updated);
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update schedule",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = (doctors || []).filter((d) => {
    if (!departmentFilter) return true;
    return d.department?.toLowerCase().includes(departmentFilter.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Weekly Doctor Availability Grid */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Weekly Doctor Availability Grid
            </h2>
            <p className="text-xs text-slate-500">
              Physicians, clinical rooms, and scheduled shifts
            </p>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
          >
            <option value="">All Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No doctors found in this department</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDoctors.map((doc) => {
              const isSelected = activeDoctor?.id === doc.id;
              const mondayHours = doc.working_hours?.monday || {
                start: "08:00",
                end: "16:00",
              };

              return (
                <div
                  key={doc.id}
                  onClick={() => handleDoctorClick(doc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-500"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                      MD
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {doc.user?.full_name || "Physician"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.department} • {doc.specialization} •{" "}
                        {mondayHours.start} - {mondayHours.end}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active (Mon-Fri)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {doc.slot_duration_mins || 30}m slots
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Col: Shift & Slot Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Shift & Slot Configuration
        </h2>

        {activeDoctor ? (
          <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">
                {activeDoctor.user?.full_name || "Selected Doctor"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeDoctor.department} ({activeDoctor.specialization})
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Daily Shift Window (Mon - Fri)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Start Time</span>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">End Time</span>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Consultation Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes (Default)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Schedule Settings"}
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            Select a doctor to configure shifts.
          </p>
        )}
      </div>
    </div>
  );
}

DoctorScheduleGrid.propTypes = {
  doctors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      user_id: PropTypes.string,
      department: PropTypes.string,
      specialization: PropTypes.string,
      working_hours: PropTypes.object,
      slot_duration_mins: PropTypes.number,
      user: PropTypes.object,
    }),
  ).isRequired,
  onScheduleUpdated: PropTypes.func,
  onSelectDoctor: PropTypes.func,
};

DoctorScheduleGrid.defaultProps = {
  onScheduleUpdated: null,
  onSelectDoctor: null,
};
