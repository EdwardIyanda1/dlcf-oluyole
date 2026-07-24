// frontend/src/api.js
import axios from 'axios';

const DEBUG = false;
const BASE_URL = 'http://127.0.0.1:8000/api';

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
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
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

// ── File download helper ──────────────────────────────────────────────────────
// Use with any export/* endpoint (which are requested with responseType: 'blob').
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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

  // credential = the JWT handed back by Google Identity Services'
  // `google.accounts.id` callback (response.credential) — works for both
  // participants and admins; admin status is decided server-side by is_staff.
  googleLogin: async (credential) => {
    const res = await api.post('/auth/google/', { credential });
    if (res.data?.access) {
      auth.setToken(res.data.access);
      auth.setRefreshToken(res.data.refresh);
      if (res.data.user) auth.setUser(res.data.user);
    }
    return res;
  },

  logout: () => auth.logout(),

  // --- Participants ---
  getParticipants: (params = {}, config = {}) => api.get('/participants/', { params, ...config }),
  getParticipantStats: (config = {}) => api.get('/participants/stats/', config),
  postParticipant: (data) => api.post('/participants/', sanitize(data)),
  getTodaySessions: (config = {}) => api.get('/sessions/today/', config),

  // --- Programs & Reports ---
  getPrograms: (config = {}) => api.get('/programs/', config),
  getProgram: (id, config = {}) => api.get(`/programs/${id}/`, config),
  postProgram: (data) => api.post('/programs/', sanitize(data)),
  getProgramReport: (id, config = {}) => api.get(`/programs/${id}/report/`, config),

  // --- Retreat Days & Sessions ---
  getDays: (programId, config = {}) => api.get(`/programs/${programId}/days/`, config),
  createDay: (programId, data) => api.post(`/programs/${programId}/days/`, sanitize(data)),
  getDayReport: (programId, dayId, config = {}) => api.get(`/programs/${programId}/days/${dayId}/report/`, config),

  getSessions: (programId, dayId, config = {}) => api.get(`/programs/${programId}/days/${dayId}/sessions/`, config),
  createSession: (programId, dayId, data) => api.post(`/programs/${programId}/days/${dayId}/sessions/`, sanitize(data)),

  // --- Attendance ---
  getAttendance: (programId, dayId, sessionId, config = {}) =>
    api.get(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/attendance/`, config),

  markAttendance: (programId, dayId, sessionId, participantId, present) =>
    api.post(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/mark/`, {
      participant: participantId,
      present,
    }),

  // --- Registrations ---
  getRegistrations: (programId, params = {}, config = {}) =>
    api.get('/registrations/', { params: { program: programId, ...params }, ...config }),
  postRegistration: (data) => api.post('/registrations/', sanitize(data)),

  // --- Check-in ---
  checkInByCode: (code) => {
    const safeCode = code.replace(/[^a-zA-Z0-9-]/g, '');
    return api.get(`/checkin/${safeCode}/`);
  },

  // --- Bulk messaging (SMS + email) ---
  // payload: { channel: 'sms'|'email'|'both', subject, body, category?, program?, search?, participant_ids? }
  sendBulkMessage: (payload) => api.post('/messages/send/', sanitize(payload)),

  // --- Exports (Excel / PDF) — all return a blob; use downloadBlob() with the result ---
  exportParticipantsExcel: (params = {}) =>
    api.get('/participants/export/excel/', { params, responseType: 'blob' }),
  exportParticipantsPdf: (params = {}) =>
    api.get('/participants/export/pdf/', { params, responseType: 'blob' }),

  exportProgramReportExcel: (programId) =>
    api.get(`/programs/${programId}/report/export/excel/`, { responseType: 'blob' }),
  exportProgramReportPdf: (programId) =>
    api.get(`/programs/${programId}/report/export/pdf/`, { responseType: 'blob' }),

  exportAttendanceExcel: (programId, dayId, sessionId, params = {}) =>
    api.get(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/export/excel/`, { params, responseType: 'blob' }),
  exportAttendancePdf: (programId, dayId, sessionId, params = {}) =>
    api.get(`/programs/${programId}/days/${dayId}/sessions/${sessionId}/export/pdf/`, { params, responseType: 'blob' }),
};

// Use in .catch() blocks to skip errors caused by AbortController cleanup
// (component unmounted / dependency changed before the request finished).
export const isCanceled = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';

export default apiService;