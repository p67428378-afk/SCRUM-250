import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import {
  FileText,
  Stethoscope,
  Clock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  encountersApi,
  patientsApi,
  doctorsApi,
  appointmentsApi,
} from "../services/api";
import EHREncounterEditor from "../components/EHREncounterEditor";

export default function EncountersPage({ currentUser }) {
  const location = useLocation();
  const preselectedPatient = location.state?.selectedPatient || null;

  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activePatient, setActivePatient] = useState(preselectedPatient);
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      encountersApi.list({ limit: 50 }),
      patientsApi.list({ limit: 50 }),
      doctorsApi.list({ limit: 50 }),
      appointmentsApi.list({ limit: 50 }),
    ]).then(([eRes, pRes, dRes, aRes]) => {
      if (eRes.status === "fulfilled") setEncounters(eRes.value || []);
      if (pRes.status === "fulfilled") {
        const pList = pRes.value || [];
        setPatients(pList);
        if (!activePatient && pList.length > 0) {
          setActivePatient(pList[0]);
        }
      }
      if (dRes.status === "fulfilled") {
        const dList = dRes.value || [];
        setDoctors(dList);
        if (!activeDoctor && dList.length > 0) {
          setActiveDoctor(dList[0]);
        }
      }
      if (aRes.status === "fulfilled") {
        const aList = aRes.value || [];
        setAppointments(aList);
        if (!activeAppointment && aList.length > 0) {
          setActiveAppointment(aList[0]);
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEncounterSaved = (newEncounter) => {
    setEncounters((prev) => [newEncounter, ...prev]);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header & Patient Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Medical Consultations & EHR Record Keeping
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinical SOAP documentation, ICD-10 diagnostic coding, and
            e-prescriptions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Patient:</span>
            <select
              value={activePatient?.id || ""}
              onChange={(e) => {
                const found = patients.find((p) => p.id === e.target.value);
                setActivePatient(found);
              }}
              className="p-1.5 border border-slate-300 rounded-lg bg-white font-medium"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* EHR Encounter Editor Component */}
      <EHREncounterEditor
        patient={activePatient}
        doctor={activeDoctor}
        appointment={activeAppointment}
        currentUser={currentUser}
        onEncounterSaved={handleEncounterSaved}
      />

      {/* Historical Encounters Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Patient EHR History & Signed Encounter Archive</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Encounter ID</th>
                <th className="p-3">Date / Time</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">ICD-10 Diagnosis</th>
                <th className="p-3">Prescriptions</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {encounters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No clinical encounter records signed yet.
                  </td>
                </tr>
              ) : (
                encounters.map((enc) => (
                  <tr
                    key={enc.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-sky-700">
                      #ENC-{(enc.id || "").substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {enc.created_at
                        ? new Date(enc.created_at).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {enc.doctor?.user?.full_name || "Dr. Sarah Jenkins"}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900">
                        {enc.icd10_diagnosis_code}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">
                        {enc.diagnosis_description}
                      </p>
                    </td>
                    <td className="p-3 text-slate-600">
                      {enc.prescriptions && enc.prescriptions.length > 0 ? (
                        <div className="space-y-0.5">
                          {enc.prescriptions.map((rx) => (
                            <span
                              key={rx.id || rx.medication_name}
                              className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] mr-1"
                            >
                              {rx.medication_name} ({rx.dosage})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold text-[11px]">
                        {enc.status || "Signed"}
                      </span>
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

EncountersPage.propTypes = {
  currentUser: PropTypes.object,
};

EncountersPage.defaultProps = {
  currentUser: null,
};
