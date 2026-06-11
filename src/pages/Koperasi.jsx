import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getKoperasi, createKoperasi, updateKoperasi, deleteKoperasi } from '../api/koperasi.api'

const Koperasi = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
  name: '', address: '', contactPerson: '', phone: '',
  minStockAlert: 20, hargaJualBotol: 0, potonganPersen: 10
})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const res = await getKoperasi()
      setList(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleEdit = (kop) => {
  setEditData(kop)
  setForm({
    name: kop.name,
    address: kop.address || '',
    contactPerson: kop.contactPerson || '',
    phone: kop.phone || '',
    minStockAlert: kop.minStockAlert,
    hargaJualBotol: Number(kop.hargaJualBotol),
    potonganPersen: Number(kop.potonganPersen),
  })
  setShowForm(true)
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editData) {
        await updateKoperasi(editData.id, form)
        setSuccess('Koperasi berhasil diupdate!')
      } else {
        await createKoperasi(form)
        setSuccess('Koperasi berhasil ditambahkan!')
      }
      setForm({ name: '', address: '', contactPerson: '', phone: '', minStockAlert: 20 })
      setEditData(null)
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus koperasi ini?')) return
    try {
      await deleteKoperasi(id)
      setSuccess('Koperasi berhasil dihapus')
      fetchData()
    } catch (err) {
      setError('Gagal menghapus')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Koperasi" />
        <main className="flex-1 p-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Manajemen Koperasi</h2>
              <p className="text-sm text-gray-500">Kelola data koperasi dan laporan pengiriman</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setEditData(null); setForm({ name: '', address: '', contactPerson: '', phone: '', minStockAlert: 20 }) }}
              className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors"
            >
              {showForm ? 'Batal' : '+ Tambah Koperasi'}
            </button>
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {showForm && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">{editData ? 'Edit Koperasi' : 'Tambah Koperasi Baru'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nama koperasi *</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="cth: Koperasi Sejahtera" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nama kontak</label>
                    <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Nama penanggung jawab" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Alamat</label>
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Alamat koperasi" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">No. telepon</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="cth: 08123456789" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Harga jual per botol (Rp)</label>
                    <input
                      type="number"
                      name="hargaJualBotol"
                      value={form.hargaJualBotol}
                      onChange={handleChange}
                      placeholder="cth: 12500"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Potongan koperasi (%)</label>
                    <input
                      type="number"
                      name="potonganPersen"
                      value={form.potonganPersen}
                      onChange={handleChange}
                      placeholder="cth: 10"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center text-sm text-gray-400 py-12">Memuat data...</div>
          ) : list.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-12">Belum ada koperasi — klik "+ Tambah Koperasi"</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((kop) => (
                <div key={kop.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{kop.name}</div>
                      {kop.contactPerson && <div className="text-xs text-gray-500 mt-0.5">{kop.contactPerson}</div>}
                      {kop.phone && <div className="text-xs text-gray-400">{kop.phone}</div>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(kop)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(kop.id)} className="text-xs px-2 py-1 border border-red-100 rounded-lg text-red-400 hover:bg-red-50">Hapus</button>
                    </div>
                  </div>
                  {kop.address && <div className="text-xs text-gray-400 mb-3">{kop.address}</div>}
                  <button
                    onClick={() => navigate(`/koperasi/${kop.id}`)}
                    className="w-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg py-2 hover:bg-amber-100 transition-colors"
                  >
                    Lihat laporan pengiriman →
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Koperasi