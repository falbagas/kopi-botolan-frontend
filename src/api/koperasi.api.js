import api from './axiosInstance'

// Koperasi
export const getKoperasi = () => api.get('/koperasi')
export const createKoperasi = (data) => api.post('/koperasi', data)
export const updateKoperasi = (id, data) => api.put(`/koperasi/${id}`, data)
export const deleteKoperasi = (id) => api.delete(`/koperasi/${id}`)

// Jenis kopi
export const getJenisKopi = () => api.get('/koperasi/jenis-kopi')
export const createJenisKopi = (data) => api.post('/koperasi/jenis-kopi', data)
export const deleteJenisKopi = (id) => api.delete(`/koperasi/jenis-kopi/${id}`)

// Pengiriman per koperasi
export const getPengirimanKoperasi = (id) => api.get(`/koperasi/${id}/pengiriman`)
export const createPengirimanKoperasi = (id, data) => api.post(`/koperasi/${id}/pengiriman`, data)
export const deletePengirimanKoperasi = (id, pengirimanId) =>
  api.delete(`/koperasi/${id}/pengiriman/${pengirimanId}`)

// Pembayaran per koperasi
export const getPembayaran = (id) => api.get(`/koperasi/${id}/pembayaran`)
export const createPembayaran = (id, data) => api.post(`/koperasi/${id}/pembayaran`, data)