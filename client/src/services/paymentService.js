import api from './api';

export const paymentAPI = {
  getAll:   (params)  => api.get('/payments', { params }),
  initiate: (data)    => api.post('/payments/initiate', data),
  confirm:  (id, data) => api.post(`/payments/${id}/confirm`, data),
  refund:   (id, data) => api.post(`/payments/${id}/refund`, data),
};
