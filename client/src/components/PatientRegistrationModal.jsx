import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { patientsApi } from "../services/api";

export default function PatientRegistrationModal({
  isOpen,
  onClose,
  onPatientRegistered,
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "Male",
    ssn_gov_id: "",
    phone_number: "",
    email: "",
    emergency_contact_name: "",
    emergency_contact_rel: "",
    emergency_contact_phone: "",
    medical_history: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        ssn_gov_id: formData.ssn_gov_id.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim() || undefined,
        emergency_contact: {
          name: formData.emergency_contact_name.trim() || "Not Provided",
          relationship: formData.emergency_contact_rel.trim() || "Unknown",
          phone: formData.emergency_contact_phone.trim() || "N/A",
        },
        medical_history:
          formData.medical_history.trim() || "No known pre-existing conditions",
      };

      const newPatient = await patientsApi.create(payload);
      setSuccessMessage(
        `Patient ${newPatient.first_name} ${newPatient.last_name} successfully registered!`,
      );
      if (onPatientRegistered) {
        onPatientRegistered(newPatient);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to register patient";
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Register New Patient
              </h2>
              <p className="text-xs text-slate-500">
                Demographics, emergency contact & unique SSN/ID verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section: Demographics */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-sky-700">
              1. Patient Demographics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Marcus"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Vance"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  SSN / Government ID{" "}
                  <span className="text-rose-500">* (Unique Check)</span>
                </label>
                <input
                  type="text"
                  name="ssn_gov_id"
                  required
                  value={formData.ssn_gov_id}
                  onChange={handleChange}
                  placeholder="e.g. 984-23-4821"
                  className="w-full p-2.5 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Contact Details */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-sky-700">
              2. Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 234-5890"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="marcus.vance@example.com"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-sky-700">
              3. Emergency Contact
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Sarah Vance"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergency_contact_rel"
                  value={formData.emergency_contact_rel}
                  onChange={handleChange}
                  placeholder="Spouse"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 901-2234"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section: Medical History */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-sky-700">
              4. Clinical & Medical History
            </h3>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleChange}
              rows={3}
              placeholder="Allergies, chronic conditions, prior surgeries (e.g. Penicillin allergy, Cardiac stent 2021)..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Validating & Registering..." : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

PatientRegistrationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPatientRegistered: PropTypes.func,
};

PatientRegistrationModal.defaultProps = {
  onPatientRegistered: null,
};
