import api from './axiosInstance'

export const getKoperasi = () => api.get('/koperasi')
export const createKoperasi = (data) => api.post('/koperasi', data)