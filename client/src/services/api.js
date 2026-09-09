import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Patients API
export const patientsApi = {
  list: async (params = {}) => {
    const response = await api.get("/patients", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/patients", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },
};

// Doctors API
export const doctorsApi = {
  list: async (params = {}) => {
    const response = await api.get("/doctors", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/doctors", data);
    return response.data;
  },
  updateSchedule: async (id, data) => {
    const response = await api.put(`/doctors/${id}/schedules`, data);
    return response.data;
  },
  getAvailability: async (id, date) => {
    const response = await api.get(`/doctors/${id}/availability`, {
      params: { date },
    });
    return response.data;
  },
};

// Appointments API
export const appointmentsApi = {
  list: async (params = {}) => {
    const response = await api.get("/appointments", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  book: async (data) => {
    const response = await api.post("/appointments", data);
    return response.data;
  },
  reschedule: async (id, data) => {
    const response = await api.put(`/appointments/${id}/reschedule`, data);
    return response.data;
  },
  cancel: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },
};

// Encounters / EHR API
export const encountersApi = {
  list: async (params = {}) => {
    const response = await api.get("/encounters", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/encounters/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/encounters", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/encounters/${id}`, data);
    return response.data;
  },
  addPrescription: async (id, data) => {
    const response = await api.post(`/encounters/${id}/prescriptions`, data);
    return response.data;
  },
  orderLabTest: async (id, data) => {
    const response = await api.post(`/encounters/${id}/lab-orders`, data);
    return response.data;
  },
};

// Audit Logs API
export const auditLogsApi = {
  list: async (params = {}) => {
    const response = await api.get("/audit-logs", { params });
    return response.data;
  },
};

export default api;
