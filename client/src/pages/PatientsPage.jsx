import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { UserPlus, HeartPulse, RefreshCw, X } from "lucide-react";
import { patientsApi } from "../services/api";
import PatientTable from "../components/PatientTable";
import PatientRegistrationModal from "../components/PatientRegistrationModal";

export default function PatientsPage({ currentUser }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const loadPatients = () => {
    setLoading(true);
    patientsApi
      .list({ limit: 100 })
      .then((data) => setPatients(data || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handlePatientRegistered = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
  };

  const handleBookAppointment = (patient) => {
    navigate("/appointments", { state: { selectedPatient: patient } });
  };

  const handleStartEncounter = (patient) => {
    navigate("/encounters", { state: { selectedPatient: patient } });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Title & Registration Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Patient Directory & Master Index
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demographics, contact info, emergency contacts, medical history &
            SSN validation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPatients}
            className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Table Component */}
      <PatientTable
        patients={patients}
        loading={loading}
        onSelectPatient={(p) => setSelectedProfile(p)}
        onBookAppointment={handleBookAppointment}
        onStartEncounter={handleStartEncounter}
      />

      {/* Slide-Over Patient Registration Drawer */}
      <PatientRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientRegistered={handlePatientRegistered}
      />

      {/* Profile Detail View Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {selectedProfile.first_name} {selectedProfile.last_name}
                </h3>
                <p className="text-xs text-sky-400 font-mono">
                  #PT-{(selectedProfile.id || "").substring(0, 8).toUpperCase()}{" "}
                  • {selectedProfile.gender}
                </p>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">
                    Date of Birth
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProfile.date_of_birth}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    SSN / Gov ID
                  </span>
                  <p className="font-mono font-semibold text-slate-800">
                    {selectedProfile.ssn_gov_id}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    Phone
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProfile.phone_number}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    Email
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProfile.email || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  Emergency Contact
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                  {selectedProfile.emergency_contact?.name ? (
                    <p>
                      <strong>{selectedProfile.emergency_contact.name}</strong>{" "}
                      ({selectedProfile.emergency_contact.relationship}) •{" "}
                      {selectedProfile.emergency_contact.phone}
                    </p>
                  ) : (
                    <p className="text-slate-400">
                      No emergency contact registered
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  Medical & Clinical History
                </h4>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                  <p>
                    {selectedProfile.medical_history ||
                      "No recorded chronic conditions"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const p = selectedProfile;
                    setSelectedProfile(null);
                    handleBookAppointment(p);
                  }}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PatientsPage.propTypes = {
  currentUser: PropTypes.object,
};

PatientsPage.defaultProps = {
  currentUser: null,
};
