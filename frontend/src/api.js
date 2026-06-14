// frontend/src/api.js
import axios from 'axios';

const DEBUG = false;
const BASE_URL = 'http://10.90.250.82:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'dlcf_token';
const REFRESH_KEY = 'dlcf_refresh';
const USER_KEY = 'dlcf_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (t) => localStorage.setItem(REFRESH_KEY, t),
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
  logout: () => {
    [TOKEN_KEY, REFRESH_KEY, USER_KEY].forEach(k => localStorage.removeItem(k));
    window.location.href = '/login';
  },
};

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) auth.logout();
    return Promise.reject(err);
  }
);

// ── Sanitiser ────────────────────────────────────────────────────────────────
const sanitize = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k, typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim() : v,
    ])
  );
};

// ── API service ──────────────────────────────────────────────────────────────
const apiService = {
  // --- Auth ---
  login: async (credentials) => {
    const res = await api.post('/auth/login/', sanitize(credentials));
    if (res.data?.access) {
      auth.setToken(res.data.access);
      auth.setRefreshToken(res.data.refresh);
      if (res.data.user) auth.setUser(res.data.user);
    }
    return res;
  },

  signup: async (data) => {
    const res = await api.post('/auth/signup/', sanitize(data));
    if (res.data?.access) {
      auth.setToken(res.data.access);
      auth.setRefreshToken(res.data.refresh);
      if (res.data.user) auth.setUser(res.data.user);
    }
    return res;
  },

  logout: () => auth.logout(),

  // --- Participants ---
  getParticipants: () => api.get('/participants/'),
  postParticipant: (data) => api.post('/participants/', sanitize(data)),

  // --- Programs & Reports ---
  getPrograms: () => api.get('/programs/'),
  getProgram: (id) => api.get(`/programs/${id}/`),
  postProgram: (data) => api.post('/programs/', sanitize(data)),
  getProgramReport: (id) => api.get(`/programs/${id}/report/`),

  // --- Retreat Days & Sessions ---
  getDays: (programId) => api.get(`/programs/${programId}/days/`),
  createDay: (programId, data) => api.post(`/programs/${programId}/days/`, sanitize(data)),
  getDayReport: (programId, dayId) => api.get(`/programs/${programId}/days/${dayId}/report/`),
  
  getSessions: (programId, dayId) => api.get(`/programs/${programId}/days/${dayId}/sessions/`),
  createSession: (programId, dayId, data) => api.post(`/programs/${programId}/days/${dayId}/sessions/`, sanitize(data)),

  // --- Attendance ---
  getAttendance: (programId, dayId, sessionId) =>
    api.get(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/attendance/`),
  
  markAttendance: (programId, dayId, sessionId, participantId, present) =>
    api.post(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/mark/`, {
      participant: participantId,
      present,
    }),

  // --- Registrations ---
  getRegistrations: (programId) => api.get(`/registrations/?program=${programId}`),
  postRegistration: (data) => api.post('/registrations/', sanitize(data)),

  // --- Check-in ---
  checkInByCode: (code) => {
    const safeCode = code.replace(/[^a-zA-Z0-9-]/g, '');
    return api.get(`/checkin/${safeCode}/`);
  },
};

export default apiService;