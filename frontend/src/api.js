// frontend/src/api.js
import axios from 'axios';
// ipconfig "https://10.90.250.133:5173",
// Toggle this to false when your Django backend is ready
const DEBUG = false; 

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Mock data for debugging
const MOCK_PARTICIPANTS = [
  { id: 1, full_name: 'John Doe', category: 'Campus', phone_number: '08012345678' },
  { id: 2, full_name: 'Jane Smith', category: 'Adult', phone_number: '07087654321' },
];

const apiService = {
  getParticipants: async () => {
    if (DEBUG) {
      console.warn("DEBUG MODE: Returning hardcoded data");
      return { data: MOCK_PARTICIPANTS };
    }
    return await api.get('/participants/');
  },
  
  postParticipant: async (data) => {
    if (DEBUG) {
      console.log("DEBUG MODE: Mocking POST request", data);
      return { status: 201 };
    }
    return await api.post('/participants/', data);
  },

  getPrograms: async () => {
    return await api.get('/programs/');
  },

  postProgram: async (data) => {
    return await api.post('/programs/', data);
  },

  // --- Auth ---
  login: async (credentials) => {
    if (DEBUG) {
      console.log("DEBUG MODE: Mocking login", credentials);
      return { data: { token: 'mock-token', user: { full_name: 'John Doe', code: 'DLCF-1001' } } };
    }
    return await api.post('/auth/login/', credentials);
  },

  signup: async (data) => {
    if (DEBUG) {
      console.log("DEBUG MODE: Mocking signup", data);
      return { data: { token: 'mock-token', user: { full_name: data.full_name, code: 'DLCF-1002' } } };
    }
    return await api.post('/auth/signup/', data);
  },

  // --- Check-in by QR / code ---
  checkInByCode: async (code) => {
    if (DEBUG) {
      console.log("DEBUG MODE: Mocking check-in lookup", code);
      return { data: { full_name: 'John Doe', school: 'Lead City University', category: 'Campus', sex: 'M', code } };
    }
    return await api.get(`/checkin/${code}/`);
  },
};

export default apiService;