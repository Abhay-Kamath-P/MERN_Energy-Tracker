import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('energy_tracker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and let state handle redirect if expired
      localStorage.removeItem('energy_tracker_token');
      localStorage.removeItem('energy_tracker_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const machineAPI = {
  getAll: (params) => api.get('/machines', { params }),
  getById: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
};

export const logAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getById: (id) => api.get(`/logs/${id}`),
  create: (data) => api.post('/logs', data),
  update: (id, data) => api.put(`/logs/${id}`, data),
  delete: (id) => api.delete(`/logs/${id}`),
  getExportCsvUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/logs/export/csv${query ? '?' + query : ''}`;
  },
};

export const analyticsAPI = {
  getKPIs: (params) => api.get('/analytics/kpis', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getByMachine: (params) => api.get('/analytics/by-machine', { params }),
  getByDepartment: (params) => api.get('/analytics/by-department', { params }),
  getByShift: (params) => api.get('/analytics/by-shift', { params }),
};

export default api;
