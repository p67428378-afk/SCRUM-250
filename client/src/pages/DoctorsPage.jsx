import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { UserCheck, Plus, RefreshCw, X, AlertCircle } from "lucide-react";
import { doctorsApi } from "../services/api";
import DoctorScheduleGrid from "../components/DoctorScheduleGrid";

export default function DoctorsPage({ currentUser }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    department: "Cardiology",
    specialization: "Cardiovascular Specialist",
    slot_duration_mins: 30,
  });
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const loadDoctors = () => {
    setLoading(true);
    doctorsApi
      .list({ limit: 50 })
      .then((data) => setDoctors(data || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      const payload = {
        user_id: formData.user_id || currentUser?.id,
        department: formData.department,
        specialization: formData.specialization,
        slot_duration_mins: parseInt(formData.slot_duration_mins, 10),
      };

      const newDoc = await doctorsApi.create(payload);
      setDoctors((prev) => [newDoc, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      setModalError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to create doctor profile",
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Physician Rostering & Shift Availability
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure doctor shifts, slot durations, clinic rooms, and holiday
            exceptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDoctors}
            className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Doctor Profile</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm font-medium">
          Loading physician schedules and roster...
        </div>
      ) : (
        <DoctorScheduleGrid doctors={doctors} onScheduleUpdated={loadDoctors} />
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Add New Doctor Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateDoctor}
              className="p-6 space-y-4 text-xs"
            >
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  User ID (UUID)
                </label>
                <input
                  type="text"
                  required
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  placeholder={currentUser?.id || "User UUID"}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Surgery">General Surgery</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  placeholder="e.g. Interventional Cardiologist"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Default Slot Duration (mins)
                </label>
                <select
                  value={formData.slot_duration_mins}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slot_duration_mins: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700"
                >
                  {modalLoading ? "Creating..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

DoctorsPage.propTypes = {
  currentUser: PropTypes.object,
};

DoctorsPage.defaultProps = {
  currentUser: null,
};
