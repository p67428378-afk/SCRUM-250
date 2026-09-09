import React, { useState, useEffect, createContext, useContext } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./index.css";
import { authApi } from "./services/api";

import SidebarNavigation from "./components/SidebarNavigation";
import TopHeaderBar from "./components/TopHeaderBar";
import PatientRegistrationModal from "./components/PatientRegistrationModal";

import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import DoctorsPage from "./pages/DoctorsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import EncountersPage from "./pages/EncountersPage";
import AuditLogsPage from "./pages/AuditLogsPage";

// Auth Context
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Mandatory Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Structured error logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-rose-200">
            <h2 className="text-xl font-bold text-rose-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              An unexpected application error occurred.
            </p>
            <pre className="p-3 bg-slate-50 border rounded text-xs text-slate-800 overflow-x-auto mb-4 font-mono">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 text-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Login Screen with Pre-filled Credentials
function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("token", data.access_token);
      onLoginSuccess(data.user);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Login failed";
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            SJ
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            St. Jude Medical
          </h1>
          <p className="text-xs text-slate-500">
            Hospital Management & EHR Core System
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            {loading ? "Authenticating..." : "Sign In to Clinical Workspace"}
          </button>
        </form>

        {/* Quick Test Accounts Switcher */}
        <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
          <p className="font-semibold text-slate-700 text-center">
            Demo Credentials (Click to load):
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() =>
                handleQuickLogin("admin@example.com", "adminpassword")
              }
              className="p-2 border rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-800 text-left"
            >
              <span className="font-bold block text-sky-700">Admin</span>
              <span>admin@example.com</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickLogin("doctor@example.com", "doctorpassword")
              }
              className="p-2 border rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-800 text-left"
            >
              <span className="font-bold block text-emerald-700">Doctor</span>
              <span>doctor@example.com</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickLogin("nurse@example.com", "nursepassword")
              }
              className="p-2 border rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-800 text-left"
            >
              <span className="font-bold block text-indigo-700">Nurse</span>
              <span>nurse@example.com</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickLogin("test@example.com", "testpassword")
              }
              className="p-2 border rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-800 text-left"
            >
              <span className="font-bold block text-amber-700">
                Receptionist
              </span>
              <span>test@example.com</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Test account: test@example.com / testpassword
          </p>
        </div>
      </div>
    </div>
  );
}

// App Layout Shell
function AppLayout({ currentUser, onLogout }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <SidebarNavigation
        currentUser={currentUser}
        onLogout={onLogout}
        appointmentCount={42}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <TopHeaderBar
          currentUser={currentUser}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <main className="flex-1 min-w-0">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  currentUser={currentUser}
                  onOpenRegisterModal={() => setIsRegisterOpen(true)}
                />
              }
            />
            <Route
              path="/patients"
              element={<PatientsPage currentUser={currentUser} />}
            />
            <Route
              path="/doctors"
              element={<DoctorsPage currentUser={currentUser} />}
            />
            <Route
              path="/appointments"
              element={<AppointmentsPage currentUser={currentUser} />}
            />
            <Route
              path="/encounters"
              element={<EncountersPage currentUser={currentUser} />}
            />
            <Route
              path="/audit-logs"
              element={<AuditLogsPage currentUser={currentUser} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Registration Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem("token");
    return token
      ? {
          id: "44444444-4444-4444-4444-444444444444",
          email: "test@example.com",
          full_name: "Elena Rostova, MHA",
          role: "Receptionist",
        }
      : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !currentUser) {
      authApi
        .getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem("token");
          setCurrentUser(null);
        });
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login: handleLoginSuccess, logout: handleLogout }}
    >
      <BrowserRouter>
        {currentUser ? (
          <AppLayout currentUser={currentUser} onLogout={handleLogout} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

export default App;
