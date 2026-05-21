import api from './axiosInstance'

export const getPengiriman = () => api.get('/pengiriman')
export const createPengiriman = (data) => api.post('/pengiriman', data)