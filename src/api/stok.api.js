import api from './axiosInstance'

export const getStokFreezer = () => api.get('/stok/freezer')
export const getStokKoperasi = () => api.get('/stok/koperasi')