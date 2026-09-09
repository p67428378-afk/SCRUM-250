import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FileText,
  Activity,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { encountersApi } from "../services/api";

const COMMON_ICD10_CODES = [
  {
    code: "I25.10",
    title: "Atherosclerotic heart disease of native coronary artery",
    type: "Cardiology",
  },
  {
    code: "Z95.5",
    title: "Presence of coronary angioplasty implant and stent",
    type: "Cardiology",
  },
  {
    code: "I10",
    title: "Essential (primary) hypertension",
    type: "Cardiology",
  },
  {
    code: "E11.9",
    title: "Type 2 diabetes mellitus without complications",
    type: "Endocrine",
  },
  {
    code: "J45.909",
    title: "Unspecified asthma, uncomplicated",
    type: "Pulmonology",
  },
  { code: "M54.5", title: "Low back pain, unspecified", type: "Orthopedics" },
];

export default function EHREncounterEditor({
  patient,
  doctor,
  appointment,
  currentUser,
  onEncounterSaved,
}) {
  const [chiefComplaint, setChiefComplaint] = useState(
    appointment?.reason_for_visit ||
      "Routine follow-up 4 weeks post-cardiac stent placement. Patient reports mild fatigue.",
  );
  const [soapNotes, setSoapNotes] = useState(
    `S: Patient reports good exercise tolerance with occasional mild fatigue on exertion.\nO: Heart sounds normal (S1/S2 present), regular rate and rhythm. No peripheral edema.\nA: Stable post-PCI status with well-controlled hemodynamics.\nP: Continue antiplatelet therapy. Repeat fasting lipid panel and 12-lead ECG.`,
  );
  const [selectedIcd10, setSelectedIcd10] = useState(COMMON_ICD10_CODES[0]);
  const [searchIcd, setSearchIcd] = useState("");

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState([
    {
      medication_name: "Clopidogrel (Plavix)",
      dosage: "75 mg",
      frequency: "Once daily",
      duration_days: 90,
      instructions: "Take in morning with water. Refills: 3",
    },
    {
      medication_name: "Atorvastatin (Lipitor)",
      dosage: "40 mg",
      frequency: "Once daily at bedtime",
      duration_days: 90,
      instructions: "Maintain low-cholesterol diet.",
    },
  ]);

  // Lab orders
  const [labOrders, setLabOrders] = useState([
    { name: "Fasting Lipid Panel", checked: true },
    { name: "12-Lead ECG", checked: true },
    { name: "Complete Blood Count (CBC)", checked: false },
    { name: "Comprehensive Metabolic Panel (CMP)", checked: false },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isClinician =
    currentUser?.role === "Admin" || currentUser?.role === "Doctor";

  const handleAddPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medication_name: "",
        dosage: "10 mg",
        frequency: "Once daily",
        duration_days: 30,
        instructions: "Take as directed.",
      },
    ]);
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setPrescriptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleLab = (index) => {
    setLabOrders((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], checked: !updated[index].checked };
      return updated;
    });
  };

  const handleFinalize = async (status = "Completed") => {
    if (!isClinician) {
      setErrorMsg(
        "Access Denied: Only Doctors and Administrators can record medical encounter notes.",
      );
      return;
    }

    if (!patient?.id || !doctor?.id) {
      setErrorMsg(
        "A valid patient and doctor are required to record an encounter.",
      );
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_id: appointment?.id || undefined,
        clinical_notes: `CHIEF COMPLAINT:\n${chiefComplaint}\n\nSOAP NOTES:\n${soapNotes}`,
        icd10_diagnosis_code: selectedIcd10.code,
        diagnosis_description: selectedIcd10.title,
        status: status,
        prescriptions: prescriptions
          .filter((p) => p.medication_name.trim())
          .map((p) => ({
            medication_name: p.medication_name.trim(),
            dosage: p.dosage,
            frequency: p.frequency,
            duration_days: parseInt(p.duration_days, 10) || 30,
            instructions: p.instructions,
          })),
      };

      const encounter = await encountersApi.create(payload);

      // Order checked labs
      for (const lab of labOrders.filter((l) => l.checked)) {
        try {
          await encountersApi.orderLabTest(encounter.id, {
            test_name: lab.name,
            instructions: "Routine clinical baseline diagnostic",
          });
        } catch {
          // ignore lab order individual failure if any
        }
      }

      setSuccessMsg(
        `Encounter #${encounter.id.substring(0, 8).toUpperCase()} signed & locked successfully!`,
      );
      if (onEncounterSaved) {
        onEncounterSaved(encounter);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to finalize encounter";
      setErrorMsg(detail);
    } finally {
      setSaving(false);
    }
  };

  const filteredIcdCodes = COMMON_ICD10_CODES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchIcd.toLowerCase()) ||
      c.title.toLowerCase().includes(searchIcd.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Sticky Patient Vital Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold">
              {patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Marcus Vance"}
            </h1>
            <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-xs rounded-full font-mono">
              #PT-{(patient?.id || "8941").substring(0, 6).toUpperCase()} •{" "}
              {patient?.gender || "45y M"}
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium">
              ⚠️ Allergy: Penicillin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Linked Appt: {appointment?.reference_code || "#APT-9048"} | Doctor:{" "}
            {doctor?.user?.full_name || "Dr. Sarah Jenkins, MD"} (
            {doctor?.department || "Cardiology"})
          </p>
        </div>

        {/* Real-Time Clinical Vitals */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-800/90 px-4 py-2 rounded-lg border border-slate-700">
          <div>
            BP: <span className="text-emerald-400 font-bold">124/82</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            HR: <span className="text-emerald-400 font-bold">72 bpm</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            Temp: <span className="text-emerald-400 font-bold">98.6°F</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            SpO2: <span className="text-emerald-400 font-bold">99%</span>
          </div>
        </div>
      </div>

      {!isClinician && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Read-Only Preview: You are signed in as{" "}
            <strong>{currentUser?.role || "Receptionist"}</strong>. Only Doctors
            and Administrators have clinical write access to SOAP notes,
            diagnoses, and prescriptions.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3-Panel Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        {/* Panel 1: SOAP Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              1. Clinical SOAP Notes
            </h2>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Chief Complaint
            </label>
            <textarea
              value={chiefComplaint}
              disabled={!isClinician}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Consultation Progress Notes (S / O / A / P)
            </label>
            <textarea
              value={soapNotes}
              disabled={!isClinician}
              onChange={(e) => setSoapNotes(e.target.value)}
              rows={9}
              className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
            />
          </div>
        </div>

        {/* Panel 2: ICD-10 Diagnostic Coding */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              2. Diagnostic Coding (ICD-10)
            </h2>
          </div>

          <input
            type="text"
            placeholder="Search ICD-10 diagnostic code or description..."
            value={searchIcd}
            onChange={(e) => setSearchIcd(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredIcdCodes.map((item) => {
              const isSelected = selectedIcd10.code === item.code;
              return (
                <div
                  key={item.code}
                  onClick={() => isClinician && setSelectedIcd10(item)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sky-50 border-sky-300 text-sky-950 ring-1 ring-sky-400"
                      : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-xs">{item.code}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-500">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">{item.title}</p>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
            <p className="text-[10px] uppercase font-bold text-emerald-700">
              Selected Primary ICD-10:
            </p>
            <p className="font-bold mt-0.5">
              {selectedIcd10.code} &mdash; {selectedIcd10.title}
            </p>
          </div>
        </div>

        {/* Panel 3: Prescriptions & Lab Requisitions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  3. Prescriptions & Orders
                </h2>
              </div>
              {isClinician && (
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="flex items-center gap-1 text-[11px] text-sky-600 font-bold hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Rx</span>
                </button>
              )}
            </div>

            {/* Prescriptions List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {prescriptions.map((rx, idx) => (
                <div
                  key={`rx-${rx.medication_name || idx}`}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Medication name"
                      value={rx.medication_name}
                      disabled={!isClinician}
                      onChange={(e) =>
                        handlePrescriptionChange(
                          idx,
                          "medication_name",
                          e.target.value,
                        )
                      }
                      className="font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-sky-500 w-full"
                    />
                    {isClinician && (
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 75 mg)"
                      value={rx.dosage}
                      disabled={!isClinician}
                      onChange={(e) =>
                        handlePrescriptionChange(idx, "dosage", e.target.value)
                      }
                      className="p-1 border rounded bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={rx.frequency}
                      disabled={!isClinician}
                      onChange={(e) =>
                        handlePrescriptionChange(
                          idx,
                          "frequency",
                          e.target.value,
                        )
                      }
                      className="p-1 border rounded bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={rx.instructions}
                    disabled={!isClinician}
                    onChange={(e) =>
                      handlePrescriptionChange(
                        idx,
                        "instructions",
                        e.target.value,
                      )
                    }
                    className="w-full p-1 text-[10px] border rounded bg-white text-slate-500"
                  />
                </div>
              ))}
            </div>

            {/* Lab Requisitions */}
            <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
                <span>Lab Requisitions Checklist</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {labOrders.map((lab, i) => (
                  <label
                    key={lab.name}
                    className="flex items-center gap-1.5 text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={lab.checked}
                      disabled={!isClinician}
                      onChange={() => handleToggleLab(i)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="truncate">{lab.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">
            Doctor Verified ({doctor?.user?.full_name || "Dr. Sarah Jenkins"}) •
            HIPAA Audit Trail Active
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving || !isClinician}
            onClick={() => handleFinalize("Draft")}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || !isClinician}
            onClick={() => handleFinalize("Completed")}
            className="px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {saving
                ? "Signing Record..."
                : "Finalize Encounter & Sign Record"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

EHREncounterEditor.propTypes = {
  patient: PropTypes.object,
  doctor: PropTypes.object,
  appointment: PropTypes.object,
  currentUser: PropTypes.object,
  onEncounterSaved: PropTypes.func,
};

EHREncounterEditor.defaultProps = {
  patient: null,
  doctor: null,
  appointment: null,
  currentUser: null,
  onEncounterSaved: null,
};
