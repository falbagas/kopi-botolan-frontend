import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import {
  getRasa, createRasa, deleteRasa,
  getBahan, createBahan, updateBahan, deleteBahan,
  getProduksi, createProduksi, deleteProduksi
} from '../api/produksiV2.api'

const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const formatJam = (val) => new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const Produksi = () => {
  const [activeTab, setActiveTab] = useState('produksi')
  const [produksiList, setProduksiList] = useState([])
  const [rasaList, setRasaList] = useState([])
  const [bahanList, setBahanList] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form produksi
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    tanggalProduksi: new Date().toISOString().split('T')[0],
    jamMulai: '',
    jamSelesai: '',
    durasiJam: 0,
    durasiMenit: 0,
    catatan: '',
    botolan: [],
    bahanTerpakai: []
  })

  // Form rasa
  const [showFormRasa, setShowFormRasa] = useState(false)
  const [formRasa, setFormRasa] = useState({ nama: '' })

  // Form bahan
  const [showFormBahan, setShowFormBahan] = useState(false)
  const [editBahan, setEditBahan] = useState(null)
  const [formBahan, setFormBahan] = useState({ nama: '', satuan: '', stokAwal: '' })

  const fetchData = async () => {
    try {
      const [prodRes, rasaRes, bahanRes] = await Promise.all([
        getProduksi(), getRasa(), getBahan()
      ])
      setProduksiList(prodRes.data)
      setRasaList(rasaRes.data)
      setBahanList(bahanRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Auto hitung durasi dari jam mulai & selesai
  useEffect(() => {
    if (form.jamMulai && form.jamSelesai) {
      const mulai = new Date(`2000-01-01T${form.jamMulai}`)
      const selesai = new Date(`2000-01-01T${form.jamSelesai}`)
      let diff = (selesai - mulai) / 60000
      if (diff < 0) diff += 1440
      const jam = Math.floor(diff / 60)
      const menit = Math.floor(diff % 60)
      setForm(f => ({ ...f, durasiJam: jam, durasiMenit: menit }))
    }
  }, [form.jamMulai, form.jamSelesai])

  // Botolan helpers
  const addBotolan = () => setForm(f => ({ ...f, botolan: [...f.botolan, { rasaKopiId: '', jumlahBotol: '' }] }))
  const removeBotolan = (i) => setForm(f => ({ ...f, botolan: f.botolan.filter((_, idx) => idx !== i) }))
  const updateBotolan = (i, field, val) => {
    const b = [...form.botolan]
    b[i][field] = val
    setForm(f => ({ ...f, botolan: b }))
  }

  // Bahan helpers
  const addBahanRow = () => setForm(f => ({ ...f, bahanTerpakai: [...f.bahanTerpakai, { bahanBakuId: '', jumlahPakai: '' }] }))
  const removeBahanRow = (i) => setForm(f => ({ ...f, bahanTerpakai: f.bahanTerpakai.filter((_, idx) => idx !== i) }))
  const updateBahanRow = (i, field, val) => {
    const b = [...form.bahanTerpakai]
    b[i][field] = val
    setForm(f => ({ ...f, bahanTerpakai: b }))
  }

  const totalBotol = form.botolan.reduce((s, b) => s + (Number(b.jumlahBotol) || 0), 0)

  const handleSubmitProduksi = async (e) => {
    e.preventDefault()
    setError('')
    if (form.botolan.length === 0) return setError('Tambahkan minimal 1 rasa kopi')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        jamMulai: `${form.tanggalProduksi}T${form.jamMulai}:00`,
        jamSelesai: `${form.tanggalProduksi}T${form.jamSelesai}:00`,
      }
      await createProduksi(payload)
      setSuccess('Produksi berhasil dicatat!')
      setForm({
        tanggalProduksi: new Date().toISOString().split('T')[0],
        jamMulai: '', jamSelesai: '', durasiJam: 0, durasiMenit: 0,
        catatan: '', botolan: [], bahanTerpakai: []
      })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan produksi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduksi = async (id) => {
    if (!confirm('Hapus produksi ini? Stok bahan baku akan dikembalikan.')) return
    try {
      await deleteProduksi(id)
      setSuccess('Produksi dihapus dan stok dikembalikan')
      fetchData()
    } catch (err) {
      setError('Gagal menghapus')
    }
  }

  const handleSubmitRasa = async (e) => {
    e.preventDefault()
    try {
      await createRasa(formRasa)
      setSuccess('Rasa berhasil ditambahkan!')
      setFormRasa({ nama: '' })
      setShowFormRasa(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleSubmitBahan = async (e) => {
    e.preventDefault()
    try {
      if (editBahan) {
        await updateBahan(editBahan.id, { nama: formBahan.nama, satuan: formBahan.satuan, stokSaat: formBahan.stokAwal })
        setSuccess('Bahan baku diupdate!')
      } else {
        await createBahan(formBahan)
        setSuccess('Bahan baku ditambahkan!')
      }
      setFormBahan({ nama: '', satuan: '', stokAwal: '' })
      setEditBahan(null)
      setShowFormBahan(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Produksi Kopi Botolan" />
        <main className="flex-1 p-6">

          <div className="flex gap-2 mb-6">
            {['produksi', 'rasa', 'bahan'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {tab === 'produksi' ? '🏭 Riwayat Produksi' : tab === 'rasa' ? '☕ Kelola Rasa' : '🧂 Bahan Baku'}
              </button>
            ))}
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* TAB PRODUKSI */}
          {activeTab === 'produksi' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowForm(!showForm)}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showForm ? 'Batal' : '+ Catat Produksi'}
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Input produksi baru</h3>
                  <form onSubmit={handleSubmitProduksi}>

                    {/* Info dasar */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tanggal produksi *</label>
                        <input type="date" value={form.tanggalProduksi} onChange={e => setForm(f => ({ ...f, tanggalProduksi: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jam mulai *</label>
                        <input type="time" value={form.jamMulai} onChange={e => setForm(f => ({ ...f, jamMulai: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jam selesai *</label>
                        <input type="time" value={form.jamSelesai} onChange={e => setForm(f => ({ ...f, jamSelesai: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Durasi (otomatis)</label>
                        <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                          {form.durasiJam > 0 || form.durasiMenit > 0 ? `${form.durasiJam} jam ${form.durasiMenit} menit` : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Botolan per rasa */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Botolan per rasa *</label>
                        <button type="button" onClick={addBotolan} className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg hover:bg-amber-100">+ Tambah rasa</button>
                      </div>
                      {form.botolan.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Klik "+ Tambah rasa" untuk menambahkan</div>
                      )}
                      {form.botolan.map((b, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                          <div className="col-span-7">
                            <select value={b.rasaKopiId} onChange={e => updateBotolan(i, 'rasaKopiId', e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                              <option value="">Pilih rasa...</option>
                              {rasaList.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input type="number" value={b.jumlahBotol} onChange={e => updateBotolan(i, 'jumlahBotol', e.target.value)} placeholder="Jumlah botol" required min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                          </div>
                          <button type="button" onClick={() => removeBotolan(i)} className="col-span-1 text-red-400 hover:text-red-600 text-xl text-center">×</button>
                        </div>
                      ))}
                      {totalBotol > 0 && (
                        <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-1">
                          Total produksi: <strong>{totalBotol} botol</strong>
                        </div>
                      )}
                    </div>

                    {/* Bahan baku terpakai */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Bahan baku terpakai</label>
                        <button type="button" onClick={addBahanRow} className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg hover:bg-amber-100">+ Tambah bahan</button>
                      </div>
                      {form.bahanTerpakai.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Opsional — klik "+ Tambah bahan" untuk mencatat pemakaian</div>
                      )}
                      {form.bahanTerpakai.map((b, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                          <div className="col-span-7">
                            <select value={b.bahanBakuId} onChange={e => updateBahanRow(i, 'bahanBakuId', e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                              <option value="">Pilih bahan...</option>
                              {bahanList.map(bh => <option key={bh.id} value={bh.id}>{bh.nama} (stok: {Number(bh.stokSaat)} {bh.satuan})</option>)}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input type="number" step="0.01" value={b.jumlahPakai} onChange={e => updateBahanRow(i, 'jumlahPakai', e.target.value)} placeholder="Jumlah pakai" required min="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                          </div>
                          <button type="button" onClick={() => removeBahanRow(i)} className="col-span-1 text-red-400 hover:text-red-600 text-xl text-center">×</button>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="text-xs text-gray-500 mb-1 block">Catatan</label>
                      <input type="text" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300 disabled:opacity-50">
                        {submitting ? 'Menyimpan...' : 'Simpan Produksi'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List produksi */}
              {loading ? (
                <div className="text-center text-sm text-gray-400 py-12">Memuat data...</div>
              ) : produksiList.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-12">Belum ada data produksi</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {produksiList.map(p => {
                    const totalBotolProduksi = p.botolan.reduce((s, b) => s + b.jumlahBotol, 0)
                    return (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="font-medium text-gray-900">{formatTanggal(p.tanggalProduksi)}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatJam(p.jamMulai)} – {formatJam(p.jamSelesai)} · {p.durasiJam > 0 ? `${p.durasiJam} jam ` : ''}{p.durasiMenit > 0 ? `${p.durasiMenit} menit` : ''} · oleh {p.createdBy.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xl font-medium text-gray-900">{totalBotolProduksi}</div>
                              <div className="text-xs text-gray-400">total botol</div>
                            </div>
                            <button onClick={() => handleDeleteProduksi(p.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-3 py-1 rounded-lg">Hapus</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Botolan per rasa */}
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Botolan per rasa</div>
                            <div className="flex flex-wrap gap-2">
                              {p.botolan.map(b => (
                                <span key={b.id} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-lg">
                                  {b.rasaKopi.nama} · {b.jumlahBotol} btl
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Bahan terpakai */}
                          {p.bahanTerpakai.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-2">Bahan baku terpakai</div>
                              <div className="flex flex-wrap gap-2">
                                {p.bahanTerpakai.map(b => (
                                  <span key={b.id} className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-1 rounded-lg">
                                    {b.bahanBaku.nama} · {Number(b.jumlahPakai)} {b.bahanBaku.satuan}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {p.catatan && <div className="mt-3 text-xs text-gray-400 italic">"{p.catatan}"</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB RASA KOPI */}
          {activeTab === 'rasa' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowFormRasa(!showFormRasa)} className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormRasa ? 'Batal' : '+ Tambah Rasa'}
                </button>
              </div>

              {showFormRasa && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <form onSubmit={handleSubmitRasa} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Nama rasa *</label>
                      <input value={formRasa.nama} onChange={e => setFormRasa({ nama: e.target.value })} required placeholder="cth: Gula Aren, Hazelnut, Vanila..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                    </div>
                    <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {rasaList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada rasa kopi</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-xs text-gray-500"><th className="text-left px-4 py-3 font-medium">Nama rasa</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody>
                      {rasaList.map(r => (
                        <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">☕ {r.nama}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={async () => { if (confirm('Hapus rasa ini?')) { await deleteRasa(r.id); fetchData() } }} className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-3 py-1 rounded-lg">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB BAHAN BAKU */}
          {activeTab === 'bahan' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowFormBahan(!showFormBahan); setEditBahan(null); setFormBahan({ nama: '', satuan: '', stokAwal: '' }) }}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormBahan ? 'Batal' : '+ Tambah Bahan'}
                </button>
              </div>

              {showFormBahan && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{editBahan ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h3>
                  <form onSubmit={handleSubmitBahan}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nama bahan *</label>
                        <input value={formBahan.nama} onChange={e => setFormBahan(f => ({ ...f, nama: e.target.value }))} required placeholder="cth: Krimer, SKM, Sirup Aren" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Satuan *</label>
                        <input value={formBahan.satuan} onChange={e => setFormBahan(f => ({ ...f, satuan: e.target.value }))} required placeholder="cth: kg, ml, liter, gram" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{editBahan ? 'Stok saat ini' : 'Stok awal'}</label>
                        <input type="number" step="0.01" value={formBahan.stokAwal} onChange={e => setFormBahan(f => ({ ...f, stokAwal: e.target.value }))} placeholder="cth: 10" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormBahan(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {bahanList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada bahan baku</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Nama bahan</th>
                        <th className="text-left px-4 py-3 font-medium">Satuan</th>
                        <th className="text-right px-4 py-3 font-medium">Stok awal</th>
                        <th className="text-right px-4 py-3 font-medium">Stok saat ini</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bahanList.map(b => (
                        <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">🧂 {b.nama}</td>
                          <td className="px-4 py-3 text-gray-500">{b.satuan}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{Number(b.stokAwal)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-medium ${Number(b.stokSaat) <= 0 ? 'text-red-500' : Number(b.stokSaat) < Number(b.stokAwal) * 0.2 ? 'text-amber-500' : 'text-green-600'}`}>
                              {Number(b.stokSaat)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <button onClick={() => { setEditBahan(b); setFormBahan({ nama: b.nama, satuan: b.satuan, stokAwal: Number(b.stokSaat) }); setShowFormBahan(true) }}
                              className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Edit</button>
                            <button onClick={async () => { if (confirm('Hapus bahan ini?')) { await deleteBahan(b.id); fetchData() } }}
                              className="text-xs px-3 py-1 border border-red-100 rounded-lg text-red-400 hover:bg-red-50">Hapus</button>
                          </td>
                        </tr>
                      ))}
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

export default Produksi