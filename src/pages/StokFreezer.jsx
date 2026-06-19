import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getAllFreezer, createFreezer, updateFreezer, deleteFreezer, masukkanKeFreezer, keluarKeFreezer, pindahFreezer, getMutasi } from '../api/freezer.api'
import { getRasa } from '../api/produksiV2.api'

const formatTanggal = (val) => new Date(val).toLocaleString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
})

const jenisBadge = {
  MASUK_PRODUKSI: { label: 'Masuk Produksi', color: 'bg-green-100 text-green-700' },
  KELUAR_KOPERASI: { label: 'Keluar ke Koperasi', color: 'bg-red-100 text-red-700' },
  PINDAH_KELUAR: { label: 'Pindah Keluar', color: 'bg-orange-100 text-orange-700' },
  PINDAH_MASUK: { label: 'Pindah Masuk', color: 'bg-blue-100 text-blue-700' },
}

const StokFreezer = () => {
  const [activeTab, setActiveTab] = useState('stok')
  const [freezerList, setFreezerList] = useState([])
  const [rasaList, setRasaList] = useState([])
  const [mutasiList, setMutasiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form freezer
  const [showFormFreezer, setShowFormFreezer] = useState(false)
  const [editFreezer, setEditFreezer] = useState(null)
  const [formFreezer, setFormFreezer] = useState({ nama: '', lokasi: '' })

  // Form masuk
  const [showFormMasuk, setShowFormMasuk] = useState(false)
  const [formMasuk, setFormMasuk] = useState({ freezerId: '', rasaKopiId: '', jumlah: '', keterangan: '' })

  // Form keluar
  const [showFormKeluar, setShowFormKeluar] = useState(false)
  const [formKeluar, setFormKeluar] = useState({ freezerId: '', rasaKopiId: '', jumlah: '', keterangan: '' })

  // Form pindah
  const [showFormPindah, setShowFormPindah] = useState(false)
  const [formPindah, setFormPindah] = useState({ freezerDariId: '', freezerTujuanId: '', rasaKopiId: '', jumlah: '', keterangan: '' })

  const fetchData = async () => {
    try {
      const [freezerRes, rasaRes, mutasiRes] = await Promise.all([
        getAllFreezer(), getRasa(), getMutasi()
      ])
      setFreezerList(freezerRes.data)
      setRasaList(rasaRes.data)
      setMutasiList(mutasiRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleSubmitFreezer = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editFreezer) {
        await updateFreezer(editFreezer.id, formFreezer)
        showSuccess('Freezer berhasil diupdate!')
      } else {
        await createFreezer(formFreezer)
        showSuccess('Freezer berhasil ditambahkan!')
      }
      setFormFreezer({ nama: '', lokasi: '' })
      setEditFreezer(null)
      setShowFormFreezer(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleMasuk = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await masukkanKeFreezer(formMasuk)
      showSuccess('Botol berhasil dimasukkan ke freezer!')
      setFormMasuk({ freezerId: '', rasaKopiId: '', jumlah: '', keterangan: '' })
      setShowFormMasuk(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleKeluar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await keluarKeFreezer(formKeluar)
      showSuccess('Botol berhasil dikeluarkan!')
      setFormKeluar({ freezerId: '', rasaKopiId: '', jumlah: '', keterangan: '' })
      setShowFormKeluar(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handlePindah = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await pindahFreezer(formPindah)
      showSuccess('Botol berhasil dipindahkan!')
      setFormPindah({ freezerDariId: '', freezerTujuanId: '', rasaKopiId: '', jumlah: '', keterangan: '' })
      setShowFormPindah(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const totalSemuaFreezer = freezerList.reduce((s, f) =>
    s + f.stokFreezer.reduce((sf, st) => sf + st.jumlah, 0), 0)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Stok Freezer" />
        <main className="flex-1 p-6">

          <div className="flex gap-2 mb-6">
            {['stok', 'mutasi', 'kelola'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
                {tab === 'stok' ? '❄️ Stok Freezer' : tab === 'mutasi' ? '📋 Riwayat Mutasi' : '⚙️ Kelola Freezer'}
              </button>
            ))}
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* TAB STOK */}
          {activeTab === 'stok' && (
            <div>
              {/* Summary total */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-700">Total semua freezer</div>
                  <div className="text-3xl font-medium text-amber-900">{totalSemuaFreezer} <span className="text-base font-normal">botol</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowFormMasuk(!showFormMasuk)}
                    className="text-sm font-medium px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    + Masuk Freezer
                  </button>
                  <button onClick={() => setShowFormKeluar(!showFormKeluar)}
                    className="text-sm font-medium px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    − Keluar Koperasi
                  </button>
                  <button onClick={() => setShowFormPindah(!showFormPindah)}
                    className="text-sm font-medium px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    ⇄ Pindah Freezer
                  </button>
                </div>
              </div>

              {/* Form Masuk */}
              {showFormMasuk && (
                <div className="bg-white border border-green-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Masukkan botol ke freezer</h3>
                  <form onSubmit={handleMasuk}>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Freezer *</label>
                        <select value={formMasuk.freezerId} onChange={e => setFormMasuk(f => ({ ...f, freezerId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400">
                          <option value="">Pilih freezer...</option>
                          {freezerList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Rasa *</label>
                        <select value={formMasuk.rasaKopiId} onChange={e => setFormMasuk(f => ({ ...f, rasaKopiId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400">
                          <option value="">Pilih rasa...</option>
                          {rasaList.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jumlah botol *</label>
                        <input type="number" min="1" value={formMasuk.jumlah} onChange={e => setFormMasuk(f => ({ ...f, jumlah: e.target.value }))} required placeholder="cth: 50" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                        <input type="text" value={formMasuk.keterangan} onChange={e => setFormMasuk(f => ({ ...f, keterangan: e.target.value }))} placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowFormMasuk(false)} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-3 py-1.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Keluar */}
              {showFormKeluar && (
                <div className="bg-white border border-red-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Keluarkan botol ke koperasi</h3>
                  <form onSubmit={handleKeluar}>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Dari freezer *</label>
                        <select value={formKeluar.freezerId} onChange={e => setFormKeluar(f => ({ ...f, freezerId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                          <option value="">Pilih freezer...</option>
                          {freezerList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Rasa *</label>
                        <select value={formKeluar.rasaKopiId} onChange={e => setFormKeluar(f => ({ ...f, rasaKopiId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                          <option value="">Pilih rasa...</option>
                          {rasaList.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jumlah botol *</label>
                        <input type="number" min="1" value={formKeluar.jumlah} onChange={e => setFormKeluar(f => ({ ...f, jumlah: e.target.value }))} required placeholder="cth: 30" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                        <input type="text" value={formKeluar.keterangan} onChange={e => setFormKeluar(f => ({ ...f, keterangan: e.target.value }))} placeholder="cth: ke Kop. Sejahtera" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowFormKeluar(false)} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Pindah */}
              {showFormPindah && (
                <div className="bg-white border border-blue-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Pindah botol antar freezer</h3>
                  <form onSubmit={handlePindah}>
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Dari freezer *</label>
                        <select value={formPindah.freezerDariId} onChange={e => setFormPindah(f => ({ ...f, freezerDariId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                          <option value="">Pilih...</option>
                          {freezerList.map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Ke freezer *</label>
                        <select value={formPindah.freezerTujuanId} onChange={e => setFormPindah(f => ({ ...f, freezerTujuanId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                          <option value="">Pilih...</option>
                          {freezerList.filter(f => f.id !== formPindah.freezerDariId).map(f => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Rasa *</label>
                        <select value={formPindah.rasaKopiId} onChange={e => setFormPindah(f => ({ ...f, rasaKopiId: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                          <option value="">Pilih rasa...</option>
                          {rasaList.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jumlah *</label>
                        <input type="number" min="1" value={formPindah.jumlah} onChange={e => setFormPindah(f => ({ ...f, jumlah: e.target.value }))} required placeholder="cth: 20" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                        <input type="text" value={formPindah.keterangan} onChange={e => setFormPindah(f => ({ ...f, keterangan: e.target.value }))} placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowFormPindah(false)} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600">Pindahkan</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Kartu per freezer */}
              {loading ? (
                <div className="text-center text-sm text-gray-400 py-12">Memuat data...</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {freezerList.map(freezer => {
                    const totalFreezer = freezer.stokFreezer.reduce((s, st) => s + st.jumlah, 0)
                    return (
                      <div key={freezer.id} className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">❄️ {freezer.nama}</div>
                            {freezer.lokasi && <div className="text-xs text-gray-400 mt-0.5">{freezer.lokasi}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-medium text-gray-900">{totalFreezer}</div>
                            <div className="text-xs text-gray-400">botol</div>
                          </div>
                        </div>

                        {freezer.stokFreezer.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Kosong</div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {freezer.stokFreezer
                              .filter(st => st.jumlah > 0)
                              .map(st => (
                                <div key={st.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">☕ {st.rasaKopi.nama}</span>
                                  <span className="font-medium text-gray-900 bg-amber-50 px-2 py-0.5 rounded-full">{st.jumlah} btl</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB RIWAYAT MUTASI */}
          {activeTab === 'mutasi' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {mutasiList.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">Belum ada riwayat mutasi</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left px-4 py-3 font-medium">Waktu</th>
                      <th className="text-left px-4 py-3 font-medium">Jenis</th>
                      <th className="text-left px-4 py-3 font-medium">Freezer</th>
                      <th className="text-left px-4 py-3 font-medium">Rasa</th>
                      <th className="text-right px-4 py-3 font-medium">Jumlah</th>
                      <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                      <th className="text-left px-4 py-3 font-medium">Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutasiList.map(m => (
                      <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatTanggal(m.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${jenisBadge[m.jenis]?.color}`}>
                            {jenisBadge[m.jenis]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {m.freezer.nama}
                          {m.freezerTujuan && ` → ${m.freezerTujuan.nama}`}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.rasaKopi.nama}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          <span className={m.jenis === 'MASUK_PRODUKSI' || m.jenis === 'PINDAH_MASUK' ? 'text-green-600' : 'text-red-500'}>
                            {m.jenis === 'MASUK_PRODUKSI' || m.jenis === 'PINDAH_MASUK' ? '+' : '-'}{m.jumlah}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{m.keterangan || '-'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{m.createdBy.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB KELOLA FREEZER */}
          {activeTab === 'kelola' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowFormFreezer(!showFormFreezer); setEditFreezer(null); setFormFreezer({ nama: '', lokasi: '' }) }}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormFreezer ? 'Batal' : '+ Tambah Freezer'}
                </button>
              </div>

              {showFormFreezer && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{editFreezer ? 'Edit Freezer' : 'Tambah Freezer Baru'}</h3>
                  <form onSubmit={handleSubmitFreezer}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nama freezer *</label>
                        <input value={formFreezer.nama} onChange={e => setFormFreezer(f => ({ ...f, nama: e.target.value }))} required placeholder="cth: Freezer 4" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Lokasi</label>
                        <input value={formFreezer.lokasi} onChange={e => setFormFreezer(f => ({ ...f, lokasi: e.target.value }))} placeholder="cth: Gudang belakang" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormFreezer(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left px-4 py-3 font-medium">Nama</th>
                      <th className="text-left px-4 py-3 font-medium">Lokasi</th>
                      <th className="text-right px-4 py-3 font-medium">Total stok</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {freezerList.map(f => (
                      <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">❄️ {f.nama}</td>
                        <td className="px-4 py-3 text-gray-500">{f.lokasi || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {f.stokFreezer.reduce((s, st) => s + st.jumlah, 0)} botol
                        </td>
                        <td className="px-4 py-3 text-right flex gap-2 justify-end">
                          <button onClick={() => { setEditFreezer(f); setFormFreezer({ nama: f.nama, lokasi: f.lokasi || '' }); setShowFormFreezer(true) }}
                            className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Edit</button>
                          <button onClick={async () => { if (confirm('Hapus freezer ini?')) { await deleteFreezer(f.id); fetchData() } }}
                            className="text-xs px-3 py-1 border border-red-100 rounded-lg text-red-400 hover:bg-red-50">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default StokFreezer