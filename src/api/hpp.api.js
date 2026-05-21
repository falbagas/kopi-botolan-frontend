import api from './axiosInstance'

export const getHppAktif = () => api.get('/hpp/aktif')
export const getAllHpp = () => api.get('/hpp')
export const createHpp = (data) => api.post('/hpp', data)