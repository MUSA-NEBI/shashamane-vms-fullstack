import api from './api';

export const authAPI = {
  register:        (data)          => api.post('/auth/register', data),
  login:           (data)          => api.post('/auth/login', data),
  logout:          ()              => api.post('/auth/logout'),
  getMe:           ()              => api.get('/auth/me'),
  updateMe:        (data)          => api.patch('/auth/me', data),
  changePassword:  (data)          => api.patch('/auth/change-password', data),
  forgotPassword:  (email)         => api.post('/auth/forgot-password', { email }),
  resetPassword:   (data)          => api.post('/auth/reset-password', data),
};
