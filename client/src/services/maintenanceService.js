import api from './api';

export const maintenanceAPI = {
  getAll:   (params)    => api.get('/maintenance', { params }),
  getOne:   (id)        => api.get(`/maintenance/${id}`),
  create:   (data)      => api.post('/maintenance', data),
  update:   (id, data)  => api.patch(`/maintenance/${id}`, data),
  delete:   (id)        => api.delete(`/maintenance/${id}`),
};
