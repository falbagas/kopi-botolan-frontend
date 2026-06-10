import api from './axiosInstance'

// Menu
export const getMenu = () => api.get('/pos/menu')
export const createMenu = (data) => api.post('/pos/menu', data)
export const updateMenu = (id, data) => api.put(`/pos/menu/${id}`, data)
export const deleteMenu = (id) => api.delete(`/pos/menu/${id}`)

// Transaksi
export const getTransaksiHarian = (tanggal) =>
  api.get('/pos/transaksi', { params: { tanggal } })
export const createTransaksi = (data) => api.post('/pos/transaksi', data)
export const deleteTransaksi = (id) => api.delete(`/pos/transaksi/${id}`)

// Rekap PDF
export const getRekap = (tanggal) =>
  api.get('/pos/rekap', { params: { tanggal } })