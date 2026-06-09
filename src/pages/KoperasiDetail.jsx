import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import {
  getKoperasi, getJenisKopi,
  getPengirimanKoperasi, createPengirimanKoperasi, deletePengirimanKoperasi,
  getPembayaran, createPembayaran
} from '../api/koperasi.api'

const KoperasiDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [koperasi, setKoperasi] = useState(null)
  const [pengiriman, setPengiriman] = useState([])
  const [pembayaran, setPembayaran] = useState([])
  const [jenisKopi, setJenisKopi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormPengiriman, setShowFormPengiriman] = useState(false)
  const [showFormBayar, setShowFormBayar] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pengiriman')

  const [formPengiriman, setFormPengiriman] = useState({ tanggalKirim: '', catatan: '', detail: [] })
  const [formBayar, setFormBayar] = useState({ jumlahBotol: '', tanggalBayar: '', keterangan: '' })

  const fetchData = async () => {
    try {
      const [kopRes, pengRes, bayarRes, jenisRes] = await Promise.all([
        getKoperasi(),
        getPengirimanKoperasi(id),
        getPembayaran(id),
        getJenisKopi(),
      ])
      const kop = kopRes.data.find((k) => k.id === id)
      setKoperasi(kop)
      setPengiriman(pengRes.data)
      setPembayaran(bayarRes.data)
      setJenisKopi(jenisRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const totalMasuk = pengiriman.reduce((sum, p) => sum + p.jumlahBotol, 0)
  const totalBayar = pembayaran.reduce((sum, p) => sum + p.jumlahBotol, 0)
  const sisaBelumBayar = totalMasuk - totalBayar

  const addDetailRow = () => {
    setFormPengiriman({
      ...formPengiriman,
      detail: [...formPengiriman.detail, { jenisKopiId: '', jumlahBotol: '', keterangan: '' }]
    })
  }

  const removeDetailRow = (i) => {
    const d = [...formPengiriman.detail]
    d.splice(i, 1)
    setFormPengiriman({ ...formPengiriman, detail: d })
  }

  const updateDetail = (i, field, value) => {
    const d = [...formPengiriman.detail]
    d[i][field] = value
    setFormPengiriman({ ...formPengiriman, detail: d })
  }

  const handleSubmitPengiriman = async (e) => {
    e.preventDefault()
    setError('')
    if (formPengiriman.detail.length === 0) return setError('Tambahkan minimal 1 jenis kopi')
    try {
      await createPengirimanKoperasi(id, formPengiriman)
      setSuccess('Pengiriman berhasil dicatat!')
      setFormPengiriman({ tanggalKirim: '', catatan: '', detail: [] })
      setShowFormPengiriman(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleSubmitBayar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createPembayaran(id, formBayar)
      setSuccess('Pembayaran berhasil dicatat!')
      setFormBayar({ jumlahBotol: '', tanggalBayar: '', keterangan: '' })
      setShowFormBayar(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleDeletePengiriman = async (pengirimanId) => {
    if (!confirm('Yakin hapus data pengiriman ini?')) return
    try {
      await deletePengirimanKoperasi(id, pengirimanId)
      setSuccess('Pengiriman berhasil dihapus')
      fetchData()
    } catch (err) {
      setError('Gagal menghapus')
    }
  }

  const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Detail Koperasi" />
        <main className="flex-1 p-6 text-center text-sm text-gray-400">Memuat data...</main>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title={koperasi?.name || 'Detail Koperasi'} />
        <main className="flex-1 p-6">

          {/* Back */}
          <button onClick={() => navigate('/koperasi')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
            ← Kembali ke daftar koperasi
          </button>

          {/* Info koperasi */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{koperasi?.name}</h2>
                {koperasi?.contactPerson && <p className="text-sm text-gray-500">Kontak: {koperasi.contactPerson} {koperasi.phone && `· ${koperasi.phone}`}</p>}
                {koperasi?.address && <p className="text-sm text-gray-400">{koperasi.address}</p>}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total botol masuk</div>
              <div className="text-2xl font-medium text-gray-900">{totalMasuk}</div>
              <div className="text-xs text-gray-400">dari {pengiriman.length} pengiriman</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total sudah dibayar</div>
              <div className="text-2xl font-medium text-green-600">{totalBayar}</div>
              <div className="text-xs text-gray-400">botol</div>
            </div>
            <div className={`border rounded-xl p-4 ${sisaBelumBayar > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <div className="text-xs text-gray-500 mb-1">Sisa belum dibayar</div>
              <div className={`text-2xl font-medium ${sisaBelumBayar > 0 ? 'text-red-600' : 'text-gray-900'}`}>{sisaBelumBayar}</div>
              <div className="text-xs text-gray-400">botol</div>
            </div>
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('pengiriman')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pengiriman' ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
              Riwayat Pengiriman
            </button>
            <button onClick={() => setActiveTab('pembayaran')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pembayaran' ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
              Riwayat Pembayaran
            </button>
          </div>

          {/* Tab Pengiriman */}
          {activeTab === 'pengiriman' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowFormPengiriman(!showFormPengiriman)} className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormPengiriman ? 'Batal' : '+ Catat Pengiriman'}
                </button>
              </div>

              {showFormPengiriman && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Catat pengiriman baru</h3>
                  <form onSubmit={handleSubmitPengiriman}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tanggal masuk *</label>
                        <input type="date" value={formPengiriman.tanggalKirim} onChange={(e) => setFormPengiriman({ ...formPengiriman, tanggalKirim: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Catatan</label>
                        <input type="text" value={formPengiriman.catatan} onChange={(e) => setFormPengiriman({ ...formPengiriman, catatan: e.target.value })} placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>

                    {/* Detail kopi */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Detail jenis kopi</label>
                        <button type="button" onClick={addDetailRow} className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg hover:bg-amber-100">+ Tambah baris</button>
                      </div>
                      {formPengiriman.detail.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Klik "+ Tambah baris" untuk menambahkan jenis kopi</div>
                      )}
                      {formPengiriman.detail.map((row, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                          <div className="col-span-5">
                            <select value={row.jenisKopiId} onChange={(e) => updateDetail(i, 'jenisKopiId', e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                              <option value="">Pilih jenis kopi...</option>
                              {jenisKopi.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <input type="number" value={row.jumlahBotol} onChange={(e) => updateDetail(i, 'jumlahBotol', e.target.value)} placeholder="Jumlah botol" required min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                          </div>
                          <div className="col-span-3">
                            <input type="text" value={row.keterangan} onChange={(e) => updateDetail(i, 'keterangan', e.target.value)} placeholder="Keterangan" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                          </div>
                          <div className="col-span-1">
                            <button type="button" onClick={() => removeDetailRow(i)} className="text-red-400 hover:text-red-600 text-lg font-medium w-full text-center">×</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormPengiriman(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabel pengiriman */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {pengiriman.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada data pengiriman</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Tanggal masuk</th>
                        <th className="text-left px-4 py-3 font-medium">Jenis kopi</th>
                        <th className="text-right px-4 py-3 font-medium">Jumlah</th>
                        <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                        <th className="text-right px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengiriman.map((p) => (
                        <>
                          {p.detail.map((d, i) => (
                            <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-600">{i === 0 ? formatTanggal(p.tanggalKirim) : ''}</td>
                              <td className="px-4 py-2 text-gray-900">{d.jenisKopi.nama}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{d.jumlahBotol}</td>
                              <td className="px-4 py-2 text-gray-400 text-xs">{d.keterangan || '-'}</td>
                              <td className="px-4 py-2 text-right">{i === 0 ? <span className="font-medium text-gray-900">{p.jumlahBotol}</span> : ''}</td>
                              <td className="px-4 py-2 text-right">{i === 0 ? <button onClick={() => handleDeletePengiriman(p.id)} className="text-xs text-red-400 hover:text-red-600">Hapus</button> : ''}</td>
                            </tr>
                          ))}
                        </>
                      ))}
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900" colSpan={4}>Total keseluruhan</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{totalMasuk}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab Pembayaran */}
          {activeTab === 'pembayaran' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowFormBayar(!showFormBayar)} className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormBayar ? 'Batal' : '+ Catat Pembayaran'}
                </button>
              </div>

              {showFormBayar && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Catat pembayaran</h3>
                  <form onSubmit={handleSubmitBayar}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jumlah botol dibayar *</label>
                        <input type="number" value={formBayar.jumlahBotol} onChange={(e) => setFormBayar({ ...formBayar, jumlahBotol: e.target.value })} required min="1" placeholder="cth: 50" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tanggal bayar *</label>
                        <input type="date" value={formBayar.tanggalBayar} onChange={(e) => setFormBayar({ ...formBayar, tanggalBayar: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                        <input type="text" value={formBayar.keterangan} onChange={(e) => setFormBayar({ ...formBayar, keterangan: e.target.value })} placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormBayar(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {pembayaran.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada data pembayaran</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Tanggal bayar</th>
                        <th className="text-right px-4 py-3 font-medium">Jumlah botol</th>
                        <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                        <th className="text-left px-4 py-3 font-medium">Dicatat oleh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pembayaran.map((p) => (
                        <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{formatTanggal(p.tanggalBayar)}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">{p.jumlahBotol}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{p.keterangan || '-'}</td>
                          <td className="px-4 py-3 text-gray-400">{p.dicatatOleh?.name}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">Total dibayar</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">{totalBayar}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default KoperasiDetail