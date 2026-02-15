import axios from 'axios';
import { useAuthStore } from '../store/useStore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API - ENT Login
export const authAPI = {
  login: (provider, username, password, pronoteUrl = null, ent = 'none') => 
    api.post('/auth/login', { 
      provider, 
      username, 
      password,
      pronote_url: pronoteUrl,
      ent
    }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ENT List
export const entAPI = {
  getList: () => api.get('/ents'),
};

// Grades API
export const gradesAPI = {
  getAll: () => api.get('/grades'),
};

// Homework API
export const homeworkAPI = {
  getAll: () => api.get('/homework'),
};

// Timetable API
export const timetableAPI = {
  get: (date = null) => api.get('/timetable', { params: { date_str: date } }),
};

// Absences API
export const absencesAPI = {
  getAll: () => api.get('/absences'),
};

// User Info API
export const userInfoAPI = {
  get: () => api.get('/info'),
};

// AI API
export const aiAPI = {
  chat: (message, context) => api.post('/ai/chat', { message, context }),
  getChatHistory: (limit = 50) => api.get('/ai/chat/history', { params: { limit } }),
  generateQuiz: (data) => api.post('/ai/quiz/generate', data),
  tutoring: (subject, topic, question) => 
    api.post('/ai/tutoring', null, { params: { subject, topic, question } }),
};

// Settings API
export const settingsAPI = {
  getTheme: () => api.get('/settings/theme'),
  updateTheme: (settings) => api.put('/settings/theme', settings),
};

export default api;
