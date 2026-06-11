import api from './axiosInstance'

// Bahan HPP
export const getBahanHpp = () => api.get('/hpp2/bahan')
export const createBahanHpp = (data) => api.post('/hpp2/bahan', data)
export const updateBahanHpp = (id, data) => api.put(`/hpp2/bahan/${id}`, data)
export const deleteBahanHpp = (id) => api.delete(`/hpp2/bahan/${id}`)

// Resep HPP
export const getResepHpp = () => api.get('/hpp2/resep')
export const createResepHpp = (data) => api.post('/hpp2/resep', data)
export const aktivasiResep = (id) => api.patch(`/hpp2/resep/${id}/aktifkan`)
export const deleteResepHpp = (id) => api.delete(`/hpp2/resep/${id}`)