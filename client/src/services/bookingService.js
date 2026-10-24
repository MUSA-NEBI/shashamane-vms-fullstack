import api from './api';

export const bookingAPI = {
  getAll:   (params)    => api.get('/bookings', { params }),
  getOne:   (id)        => api.get(`/bookings/${id}`),
  create:   (data)      => api.post('/bookings', data),
  cancel:   (id, data)  => api.post(`/bookings/${id}/cancel`, data),
};
