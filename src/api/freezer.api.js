import api from './axiosInstance'

export const getAllFreezer = () => api.get('/freezer')
export const createFreezer = (data) => api.post('/freezer', data)
export const updateFreezer = (id, data) => api.put(`/freezer/${id}`, data)
export const deleteFreezer = (id) => api.delete(`/freezer/${id}`)

export const masukkanKeFreezer = (data) => api.post('/freezer/masuk', data)
export const keluarKeFreezer = (data) => api.post('/freezer/keluar', data)
export const pindahFreezer = (data) => api.post('/freezer/pindah', data)
export const getMutasi = (freezerId) => api.get('/freezer/mutasi', { params: { freezerId } })