import api from './api';

export const dashboardAPI = {
  getAdmin:      ()       => api.get('/dashboard/admin'),
  getDispatcher: ()       => api.get('/dashboard/dispatcher'),
  getDriver:     ()       => api.get('/dashboard/driver'),
  getPassenger:  ()       => api.get('/dashboard/passenger'),
  getUsers:      (params) => api.get('/dashboard/admin/users', { params }),
  createUser:    (data)   => api.post('/dashboard/admin/users', data),
  toggleUserStatus: (id)  => api.patch(`/dashboard/admin/users/${id}/toggle-status`),
};

export const notificationAPI = {
  getAll:      (params) => api.get('/notifications', { params }),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()       => api.patch('/notifications/read-all'),
};
