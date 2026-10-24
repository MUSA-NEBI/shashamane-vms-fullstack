/**
 * api.js
 * Axios instance configured for the SVMS backend.
 * All API calls go through this instance so auth headers/cookies are handled centrally.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',          // Vite proxy forwards /api → http://localhost:5000/api
  withCredentials: true,    // Send httpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Response interceptor — normalize errors into a consistent shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    // If 401 and not on the login page, clear local auth state
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Dispatch a custom event — AuthContext listens for this
      window.dispatchEvent(new CustomEvent('svms:unauthorized'));
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;
