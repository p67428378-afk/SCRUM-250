import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  ShieldAlert,
  RefreshCw,
  Filter,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { auditLogsApi } from "../services/api";

export default function AuditLogsPage({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = () => {
    setLoading(true);
    auditLogsApi
      .list({
        limit: 100,
        target_resource: resourceFilter || undefined,
        action: actionFilter || undefined,
      })
      .then((data) => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, [resourceFilter, actionFilter]);

  const formatTimestamp = (iso) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return iso;
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes("CREATE"))
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (action.includes("UPDATE") || action.includes("RESCHEDULE"))
      return "bg-amber-50 text-amber-800 border-amber-200";
    if (action.includes("CANCEL") || action.includes("DELETE"))
      return "bg-rose-50 text-rose-800 border-rose-200";
    return "bg-sky-50 text-sky-800 border-sky-200";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Security & Compliance Audit Trail
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              HIPAA Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only tamper-evident logs for all patient data access,
            appointment modifications, and EHR signatures
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Bar & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Filter By:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Resources</option>
              <option value="patients">Patients</option>
              <option value="appointments">Appointments</option>
              <option value="encounters">Encounters</option>
              <option value="doctors">Doctors</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Actions</option>
              <option value="CREATE_PATIENT">CREATE_PATIENT</option>
              <option value="UPDATE_PATIENT">UPDATE_PATIENT</option>
              <option value="CREATE_APPOINTMENT">CREATE_APPOINTMENT</option>
              <option value="RESCHEDULE_APPOINTMENT">
                RESCHEDULE_APPOINTMENT
              </option>
              <option value="CANCEL_APPOINTMENT">CANCEL_APPOINTMENT</option>
              <option value="CREATE_ENCOUNTER">CREATE_ENCOUNTER</option>
              <option value="ADD_PRESCRIPTION">ADD_PRESCRIPTION</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Operator Role</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Target ID</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500 font-sans"
                  >
                    Loading audit events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500 font-sans"
                  >
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      No audit records found
                    </p>
                    <p className="text-slate-400 mt-1">
                      Actions performed in the system will automatically log
                      here.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getActionBadgeColor(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold font-sans">
                        {log.user_role || "Staff"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-bold whitespace-nowrap font-sans">
                      {log.target_resource}
                    </td>
                    <td className="p-3 text-sky-700 font-semibold whitespace-nowrap">
                      #{(log.target_id || "").substring(0, 8)}
                    </td>
                    <td
                      className="p-3 max-w-md text-slate-600 text-[11px] truncate font-sans"
                      title={JSON.stringify(log.details)}
                    >
                      {log.details ? JSON.stringify(log.details) : "—"}
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

AuditLogsPage.propTypes = {
  currentUser: PropTypes.object,
};

AuditLogsPage.defaultProps = {
  currentUser: null,
};
