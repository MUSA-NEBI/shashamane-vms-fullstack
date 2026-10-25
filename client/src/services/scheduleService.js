import api from './api';

export const scheduleAPI = {
  getAll:               (params)    => api.get('/schedules', { params }),
  search:               (params)    => api.get('/schedules/search', { params }),
  getAvailableDates:    (params)    => api.get('/schedules/available-dates', { params }),
  getOne:               (id)        => api.get(`/schedules/${id}`),
  getSeatMap:           (id)        => api.get(`/schedules/${id}/seats`),
  create:               (data)      => api.post('/schedules', data),
  update:               (id, data)  => api.patch(`/schedules/${id}`, data),
  delete:               (id)        => api.delete(`/schedules/${id}`),
  generateFromTemplate: (data)      => api.post('/schedules/generate-from-template', data),
};
