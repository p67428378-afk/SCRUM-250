import React from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  FileText,
  ShieldAlert,
  LogOut,
  Activity,
} from "lucide-react";

export default function SidebarNavigation({
  currentUser,
  onLogout,
  appointmentCount,
}) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Patients", path: "/patients", icon: Users },
    { name: "Doctors", path: "/doctors", icon: UserCheck },
    {
      name: "Appointments",
      path: "/appointments",
      icon: Calendar,
      badge: appointmentCount > 0 ? appointmentCount : null,
    },
    { name: "EHR / Encounters", path: "/encounters", icon: FileText },
    { name: "Audit Logs", path: "/audit-logs", icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 flex-shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            SJ
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">
              St. Jude Medical
            </h1>
            <p className="text-xs text-slate-400">Clinical Operations</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sky-600/20 text-sky-400 border-l-4 border-sky-500 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="bg-sky-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & User Role */}
      <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cardiology Wing Active</span>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
          <p className="text-slate-300 font-semibold truncate">
            {currentUser?.full_name || "Medical Staff"}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="px-2 py-0.5 bg-sky-950 text-sky-300 rounded text-[11px] font-medium border border-sky-800">
              {currentUser?.role || "User"}
            </span>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

SidebarNavigation.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    full_name: PropTypes.string,
    role: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
  appointmentCount: PropTypes.number,
};

SidebarNavigation.defaultProps = {
  currentUser: null,
  appointmentCount: 0,
};
