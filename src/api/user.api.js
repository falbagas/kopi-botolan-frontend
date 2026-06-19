import api from './axiosInstance'

export const getAllUser = () => api.get('/users')
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const toggleAktif = (id) => api.patch(`/users/${id}/toggle`)
export const resetPassword = (id, data) => api.patch(`/users/${id}/reset-password`, data)