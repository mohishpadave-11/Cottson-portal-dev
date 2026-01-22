import axios from 'axios';

// API Base URL - change this based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { toast } from '../utils/toastEmitter';

// ... (existing code)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden');
        toast.error('Access Denied', 'You do not have permission to perform this action');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found');
      } else if (status >= 500) {
        // Server error - SINGLETON PATTERN
        console.error('Server error:', data.message || 'Internal server error');
        toast.error(
          'Server Error',
          'Something went wrong on our end. Please try again later.',
          5000,
          'server-error-toast' // Fixed ID for deduplication
        );
      }
    } else if (error.request) {
      // Request made but no response - SINGLETON PATTERN
      console.error('Network error - no response from server');
      toast.error(
        'Network Error',
        'Unable to reach the server. Please check your internet connection.',
        5000,
        'network-error-toast' // Fixed ID for deduplication
      );
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Companies
  companies: {
    getAll: () => api.get('/api/companies'),
    getById: (id) => api.get(`/api/companies/${id}`),
    create: (data) => api.post('/api/companies', data),
    update: (id, data) => api.put(`/api/companies/${id}`, data),
    delete: (id) => api.delete(`/api/companies/${id}`),
  },

  // Clients
  clients: {
    getAll: () => api.get('/api/clients'),
    getById: (id) => api.get(`/api/clients/${id}`),
    create: (data) => api.post('/api/clients', data),
    update: (id, data) => api.put(`/api/clients/${id}`, data),
    delete: (id) => api.delete(`/api/clients/${id}`),
  },

  // Products
  products: {
    getAll: () => api.get('/api/products'),
    getById: (id) => api.get(`/api/products/${id}`),
    create: (data) => api.post('/api/products', data),
    update: (id, data) => api.put(`/api/products/${id}`, data),
    delete: (id) => api.delete(`/api/products/${id}`),
  },

  // Orders
  orders: {
    getAll: () => api.get('/api/orders'),
    getById: (id) => api.get(`/api/orders/${id}`),
    create: (data) => api.post('/api/orders', data),
    update: (id, data) => api.put(`/api/orders/${id}`, data),
    patch: (id, data) => api.patch(`/api/orders/${id}`, data),
    delete: (id) => api.delete(`/api/orders/${id}`),
    uploadDocument: (id, formData) => api.post(`/api/orders/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // Complaints
  complaints: {
    getAll: () => api.get('/api/complaints'),
    getById: (id) => api.get(`/api/complaints/${id}`),
    create: (data) => api.post('/api/complaints', data),
    update: (id, data) => api.put(`/api/complaints/${id}`, data),
    delete: (id) => api.delete(`/api/complaints/${id}`),
  },

  // Stats
  stats: {
    get: () => api.get('/api/stats'),
    getActiveCompanyStats: () => api.get('/api/stats/companies/active-stats'),
    getNewCompanyStats: () => api.get('/api/stats/companies/new-stats'),
    getTotalCompanyStats: () => api.get('/api/stats/companies/total-stats'),
  },
};
