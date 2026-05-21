import api from './axiosInstance'

export const getProduksi = () => api.get('/produksi')
export const createProduksi = (data) => api.post('/produksi', data)