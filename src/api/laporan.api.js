import api from './axiosInstance'

export const getLaporanLaba = (params) => api.get('/laporan/laba', { params })
export const getRekapBulanan = (params) => api.get('/laporan/rekap', { params })