import axios from 'axios';
import { toast } from '../utils/toastEmitter';

// Robust URL sanitization
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:10000';
  // 1. Force remove trailing slash if exists
  url = url.replace(/\/$/, '');
  // 2. Force remove trailing /api if exists (to avoid duplication)
  url = url.replace(/\/api$/, '');
  // 3. Append the single, correct /api
  return `${url}/api`;
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for token in localStorage (standardized to 'token')
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
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
        // Check if we are already on the login page to avoid loops
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden');
        toast.error('Access Denied', 'You do not have permission to perform this action');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found');
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', data.message || 'Internal server error');
        toast.error(
          'Server Error',
          'Something went wrong on our end. Please try again later.',
          5000,
          'server-error-toast'
        );
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response from server');
      toast.error(
        'Network Error',
        'Unable to reach the server. Please check your internet connection.',
        5000,
        'network-error-toast'
      );
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
