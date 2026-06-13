// frontend/src/api.js
import axios from 'axios';

const DEBUG = false;

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'dlcf_token';
const USER_KEY  = 'dlcf_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  setUser:  (user)  => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser:  () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  },
};

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://10.90.250.159:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10s timeout — avoids hanging requests
});

// ── Request interceptor: attach Bearer token on every call ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and redirect to login
      auth.logout();
    }
    return Promise.reject(error);
  }
);

// ── Input sanitiser (strips HTML to prevent XSS via form data) ───────────────
const sanitize = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim() : v,
    ])
  );
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PARTICIPANTS = [
  { id: 1, full_name: 'John Doe',   category: 'Campus', phone_number: '08012345678', sex: 'M' },
  { id: 2, full_name: 'Jane Smith', category: 'Adult',  phone_number: '07087654321', sex: 'F' },
];

// ── API service ───────────────────────────────────────────────────────────────
const apiService = {

  // --- Participants ---
  getParticipants: async () => {
    if (DEBUG) return { data: MOCK_PARTICIPANTS };
    return await api.get('/participants/');
  },

  postParticipant: async (data) => {
    if (DEBUG) return { status: 201 };
    return await api.post('/participants/', sanitize(data));
  },

  // --- Retreat Programs ---
  getPrograms: async () => {
    return await api.get('/programs/');
  },

  postProgram: async (data) => {
    return await api.post('/programs/', sanitize(data));
  },

  // --- Sessions ---
  getSessions: async (programId) => {
    return await api.get(programId ? `/programs/${programId}/sessions/` : '/sessions/');
  },

  createSession: async (data) => {
    return await api.post('/sessions/', sanitize(data));
  },

  // --- Attendance ---
  getAttendance: async (sessionId) => {
    return await api.get(`/sessions/${sessionId}/attendance/`);
  },

  markAttendance: async (sessionId, participantId, present) => {
    return await api.post(`/sessions/${sessionId}/attendance/`, {
      participant: participantId,
      present,
    });
  },

  // --- Auth ---
  login: async (credentials) => {
    if (DEBUG) {
      const mockData = { token: 'mock-token', user: { full_name: 'John Doe', code: 'DLCF-1001' } };
      auth.setToken(mockData.token);
      auth.setUser(mockData.user);
      return { data: mockData };
    }
    const res = await api.post('/auth/login/', sanitize(credentials));
    if (res.data?.token) {
      auth.setToken(res.data.token);
      auth.setUser(res.data.user);
    }
    return res;
  },

  signup: async (data) => {
    if (DEBUG) {
      const mockData = { token: 'mock-token', user: { full_name: data.full_name, code: 'DLCF-1002' } };
      auth.setToken(mockData.token);
      auth.setUser(mockData.user);
      return { data: mockData };
    }
    const res = await api.post('/auth/signup/', sanitize(data));
    if (res.data?.token) {
      auth.setToken(res.data.token);
      auth.setUser(res.data.user);
    }
    return res;
  },

  logout: () => auth.logout(),

  // --- Check-in (PUBLIC — no token required) ---
  // Bypasses the interceptor's auth header requirement since check-in is open to all
  checkInByCode: async (code) => {
    if (DEBUG) {
      return { data: { full_name: 'John Doe', school: 'Lead City University', category: 'Campus', sex: 'M', code } };
    }
    // Sanitise the code before sending — strip anything that isn't alphanumeric or a dash
    const safeCode = code.replace(/[^a-zA-Z0-9-]/g, '');
    return await api.get(`/checkin/${safeCode}/`);
  },
};

export default apiService;