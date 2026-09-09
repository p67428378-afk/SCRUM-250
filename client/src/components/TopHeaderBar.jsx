import React, { useState } from "react";
import PropTypes from "prop-types";
import { Search, Bell, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TopHeaderBar({
  currentUser,
  searchTerm,
  onSearchChange,
  onEmergencyAlert,
}) {
  const [alertActive, setAlertActive] = useState(false);

  const handleEmergencyClick = () => {
    setAlertActive(true);
    if (onEmergencyAlert) {
      onEmergencyAlert();
    }
    setTimeout(() => setAlertActive(false), 4000);
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "MD";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient by MRN, SSN, or name (⌘K)..."
            value={searchTerm || ""}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* System Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Live sync badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>System Sync: Live</span>
        </div>

        {/* Emergency Alert Button */}
        <button
          onClick={handleEmergencyClick}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
            alertActive
              ? "bg-red-800 text-white animate-pulse"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          title="Broadcast Emergency Code Blue Alert"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{alertActive ? "CODE BLUE ACTIVE" : "Emergency Alert"}</span>
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            {initials}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser?.full_name || "Staff User"}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {currentUser?.role || "Receptionist / Admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

TopHeaderBar.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    full_name: PropTypes.string,
    role: PropTypes.string,
  }),
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  onEmergencyAlert: PropTypes.func,
};

TopHeaderBar.defaultProps = {
  currentUser: null,
  searchTerm: "",
  onSearchChange: null,
  onEmergencyAlert: null,
};
