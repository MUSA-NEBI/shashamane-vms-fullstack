import api from './api';

export const vehicleAPI = {
  getAll:       (params) => api.get('/vehicles', { params }),
  getOne:       (id)     => api.get(`/vehicles/${id}`),
  create:       (data)   => api.post('/vehicles', data),
  update:       (id, data) => api.patch(`/vehicles/${id}`, data),
  delete:       (id)     => api.delete(`/vehicles/${id}`),
  getMaintenance: (id, params) => api.get(`/vehicles/${id}/maintenance`, { params }),
};
