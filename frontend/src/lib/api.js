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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Classes API
export const classesAPI = {
  getAll: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
};

// Grades API
export const gradesAPI = {
  getAll: (params) => api.get('/grades', { params }),
  create: (data) => api.post('/grades', data),
};

// Homework API
export const homeworkAPI = {
  getAll: (params) => api.get('/homework', { params }),
  create: (data) => api.post('/homework', data),
  submit: (id, content) => api.post(`/homework/${id}/submit`, null, { params: { content } }),
};

// Timetable API
export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
};

// Messages API
export const messagesAPI = {
  getAll: () => api.get('/messages'),
  send: (data) => api.post('/messages', data),
  markRead: (id) => api.put(`/messages/${id}/read`),
};

// Resources API
export const resourcesAPI = {
  getAll: (params) => api.get('/resources', { params }),
  create: (data) => api.post('/resources', data),
};

// Quizzes API
export const quizzesAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  generate: (data) => api.post('/quizzes/generate', data),
  submit: (id, answers) => api.post(`/quizzes/${id}/submit`, answers),
};

// Forum API
export const forumAPI = {
  getAll: (params) => api.get('/forum', { params }),
  create: (title, content, classId, subjectId) => 
    api.post('/forum', null, { params: { title, content, class_id: classId, subject_id: subjectId } }),
  reply: (postId, content) => api.post(`/forum/${postId}/reply`, null, { params: { content } }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// AI API
export const aiAPI = {
  chat: (message, context) => api.post('/ai/chat', { message, context }),
  getChatHistory: (limit = 50) => api.get('/ai/chat/history', { params: { limit } }),
  tutoring: (subject, topic, question, classLevel) => 
    api.post('/ai/tutoring', null, { params: { subject, topic, question, class_level: classLevel } }),
};

// Curriculum API
export const curriculumAPI = {
  getAll: (classLevel) => api.get('/curriculum', { params: { class_level: classLevel } }),
  getTopics: (classLevel, subject) => api.get(`/curriculum/${classLevel}/${subject}`),
};

// Stats API
export const statsAPI = {
  getStudent: () => api.get('/stats/student'),
  getClass: (classId) => api.get(`/stats/class/${classId}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
};

// Seed data
export const seedAPI = {
  seed: () => api.post('/seed'),
};

export default api;
