import api from './axiosInstance'

export const getDashboard = (params) => api.get('/dashboard', { params })