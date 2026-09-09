import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Search,
  ShieldCheck,
  HeartPulse,
  Phone,
  AlertCircle,
  Eye,
  CalendarPlus,
} from "lucide-react";

export default function PatientTable({
  patients,
  loading,
  onSelectPatient,
  onBookAppointment,
  onStartEncounter,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    try {
      const birth = new Date(dobString);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return `${age}y`;
    } catch {
      return "";
    }
  };

  const maskSSN = (ssn) => {
    if (!ssn) return "N/A";
    if (ssn.length <= 4) return ssn;
    return `XXX-XX-${ssn.slice(-4)}`;
  };

  const filteredPatients = (patients || []).filter((p) => {
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
    const ssn = (p.ssn_gov_id || "").toLowerCase();
    const phone = (p.phone_number || "").toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(term) || ssn.includes(term) || phone.includes(term);
    const matchesGender = !genderFilter || p.gender === genderFilter;

    return matchesSearch && matchesGender;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Filters Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by SSN, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Patient ID</th>
              <th className="p-3.5">Full Name</th>
              <th className="p-3.5">DOB / Gender</th>
              <th className="p-3.5">SSN / Gov ID</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Emergency Contact</th>
              <th className="p-3.5">Medical History</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-slate-500 font-medium"
                >
                  Loading patient master index...
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    No patient records found
                  </p>
                  <p className="text-slate-400 mt-1">
                    Try refining your search or register a new patient.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const age = calculateAge(patient.date_of_birth);
                const emergency = patient.emergency_contact || {};
                const shortId = (patient.id || "").substring(0, 8);

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Patient ID */}
                    <td className="p-3.5 font-mono font-semibold text-sky-700 whitespace-nowrap">
                      #PT-{shortId.toUpperCase()}
                    </td>

                    {/* Name */}
                    <td className="p-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {patient.first_name} {patient.last_name}
                    </td>

                    {/* DOB / Gender */}
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      <span>{patient.date_of_birth}</span>
                      {age && (
                        <span className="ml-1 text-slate-400 font-medium">
                          ({age} {patient.gender?.[0]})
                        </span>
                      )}
                    </td>

                    {/* SSN */}
                    <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                      <span>{maskSSN(patient.ssn_gov_id)}</span>
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{patient.phone_number || "N/A"}</span>
                      </div>
                    </td>

                    {/* Emergency Contact */}
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {emergency.name ? (
                        <span>
                          {emergency.name}{" "}
                          {emergency.relationship
                            ? `(${emergency.relationship})`
                            : ""}{" "}
                          • {emergency.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">None on file</span>
                      )}
                    </td>

                    {/* Medical History */}
                    <td className="p-3.5 max-w-xs">
                      {patient.medical_history ? (
                        <span
                          className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] truncate max-w-[200px]"
                          title={patient.medical_history}
                        >
                          {patient.medical_history}
                        </span>
                      ) : (
                        <span className="text-slate-400">Clear</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onBookAppointment && (
                          <button
                            onClick={() => onBookAppointment(patient)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                            title="Book Appointment"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                        )}
                        {onStartEncounter && (
                          <button
                            onClick={() => onStartEncounter(patient)}
                            className="px-2 py-1 bg-sky-600 text-white rounded text-[11px] font-semibold hover:bg-sky-700 transition-colors"
                          >
                            Encounter
                          </button>
                        )}
                        {onSelectPatient && (
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PatientTable.propTypes = {
  patients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      first_name: PropTypes.string,
      last_name: PropTypes.string,
      date_of_birth: PropTypes.string,
      gender: PropTypes.string,
      ssn_gov_id: PropTypes.string,
      phone_number: PropTypes.string,
      email: PropTypes.string,
      emergency_contact: PropTypes.object,
      medical_history: PropTypes.string,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  onSelectPatient: PropTypes.func,
  onBookAppointment: PropTypes.func,
  onStartEncounter: PropTypes.func,
};

PatientTable.defaultProps = {
  loading: false,
  onSelectPatient: null,
  onBookAppointment: null,
  onStartEncounter: null,
};
