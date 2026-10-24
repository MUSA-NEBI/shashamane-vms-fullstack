import api from './api';

export const routeAPI = {
  getAll:      (params)    => api.get('/routes', { params }),
  getOne:      (id)        => api.get(`/routes/${id}`),
  getOrigins:  ()          => api.get('/routes/origins'),
  create:      (data)      => api.post('/routes', data),
  update:      (id, data)  => api.patch(`/routes/${id}`, data),
  delete:      (id)        => api.delete(`/routes/${id}`),
};
