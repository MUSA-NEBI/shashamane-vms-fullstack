import api from './api';

export const ticketAPI = {
  getAll:    (params)  => api.get('/tickets', { params }),
  getOne:    (id)      => api.get(`/tickets/${id}`),
  validate:  (data)    => api.post('/tickets/validate', data),
};
