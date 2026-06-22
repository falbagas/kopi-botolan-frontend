import api from './axiosInstance'

export const getAllPemilik = () => api.get('/laba/pemilik')
export const updatePemilik = (id, data) => api.put(`/laba/pemilik/${id}`, data)

export const getPembagianLaba = () => api.get('/laba/pembagian')
export const bagikanLaba = (data) => api.post('/laba/pembagian', data)
export const previewLaba = (params) => api.get('/laba/preview', { params })

export const tambahMutasi = (data) => api.post('/laba/mutasi', data)