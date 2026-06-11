import api from './axiosInstance'

export const getLaporanMingguan = (minggu) =>
  api.get('/laporan/mingguan', { params: { minggu } })