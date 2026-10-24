import api from './api';

export const driverAPI = {
  getAll:  (params)    => api.get('/drivers', { params }),
  getOne:  (id)        => api.get(`/drivers/${id}`),
  create:  (data)      => api.post('/drivers', data),
  update:  (id, data)  => api.patch(`/drivers/${id}`, data),
  delete:  (id)        => api.delete(`/drivers/${id}`),
};
