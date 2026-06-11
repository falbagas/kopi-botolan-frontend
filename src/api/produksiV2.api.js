import api from './axiosInstance'

// Rasa kopi
export const getRasa = () => api.get('/produksi-v2/rasa')
export const createRasa = (data) => api.post('/produksi-v2/rasa', data)
export const deleteRasa = (id) => api.delete(`/produksi-v2/rasa/${id}`)

// Bahan baku
export const getBahan = () => api.get('/produksi-v2/bahan')
export const createBahan = (data) => api.post('/produksi-v2/bahan', data)
export const updateBahan = (id, data) => api.put(`/produksi-v2/bahan/${id}`, data)
export const deleteBahan = (id) => api.delete(`/produksi-v2/bahan/${id}`)

// Produksi
export const getProduksi = () => api.get('/produksi-v2')
export const createProduksi = (data) => api.post('/produksi-v2', data)
export const deleteProduksi = (id) => api.delete(`/produksi-v2/${id}`)