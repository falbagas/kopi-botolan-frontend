import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getRasa } from '../api/produksiV2.api'
import {
  getBahanHpp, createBahanHpp, updateBahanHpp, deleteBahanHpp,
  getResepHpp, createResepHpp, aktivasiResep, deleteResepHpp
} from '../api/hpp2.api'

const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')

const HPPHarga = () => {
  const [activeTab, setActiveTab] = useState('resep')
  const [resepList, setResepList] = useState([])
  const [bahanList, setBahanList] = useState([])
  const [rasaList, setRasaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form bahan
  const [showFormBahan, setShowFormBahan] = useState(false)
  const [editBahan, setEditBahan] = useState(null)
  const [formBahan, setFormBahan] = useState({ nama: '', satuan: '', hargaPerUnit: '', beratPerUnit: '' })

  // Form resep
  const [showFormResep, setShowFormResep] = useState(false)
  const [formResep, setFormResep] = useState({ rasaKopiId: '', catatan: '', detail: [] })

  const fetchData = async () => {
    try {
      const [resepRes, bahanRes, rasaRes] = await Promise.all([
        getResepHpp(), getBahanHpp(), getRasa()
      ])
      setResepList(resepRes.data)
      setBahanList(bahanRes.data)
      setRasaList(rasaRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Preview harga per gram
  const hargaPerGramPreview =
    formBahan.hargaPerUnit && formBahan.beratPerUnit
      ? Number(formBahan.hargaPerUnit) / Number(formBahan.beratPerUnit)
      : 0

  // Resep detail helpers
  const addDetailRow = () =>
    setFormResep(f => ({ ...f, detail: [...f.detail, { bahanHppId: '', jumlahPakai: '' }] }))

  const removeDetailRow = (i) =>
    setFormResep(f => ({ ...f, detail: f.detail.filter((_, idx) => idx !== i) }))

  const updateDetailRow = (i, field, val) => {
    const d = [...formResep.detail]
    d[i][field] = val
    setFormResep(f => ({ ...f, detail: d }))
  }

  // Preview total HPP dari resep yang sedang diinput
  const previewHpp = formResep.detail.reduce((sum, d) => {
    const bahan = bahanList.find(b => b.id === d.bahanHppId)
    if (!bahan || !d.jumlahPakai) return sum
    return sum + (Number(bahan.hargaPerGram) * Number(d.jumlahPakai))
  }, 0)

  const handleSubmitBahan = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editBahan) {
        await updateBahanHpp(editBahan.id, formBahan)
        setSuccess('Bahan berhasil diupdate!')
      } else {
        await createBahanHpp(formBahan)
        setSuccess('Bahan berhasil ditambahkan!')
      }
      setFormBahan({ nama: '', satuan: '', hargaPerUnit: '', beratPerUnit: '' })
      setEditBahan(null)
      setShowFormBahan(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleSubmitResep = async (e) => {
    e.preventDefault()
    setError('')
    if (!formResep.rasaKopiId) return setError('Pilih rasa kopi dulu')
    if (formResep.detail.length === 0) return setError('Tambahkan minimal 1 bahan')
    try {
      await createResepHpp(formResep)
      setSuccess('Resep HPP berhasil disimpan!')
      setFormResep({ rasaKopiId: '', catatan: '', detail: [] })
      setShowFormResep(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const handleAktifkan = async (id) => {
    try {
      await aktivasiResep(id)
      setSuccess('Resep berhasil diaktifkan!')
      fetchData()
    } catch (err) {
      setError('Gagal mengaktifkan resep')
    }
  }

  const handleDeleteResep = async (id) => {
    if (!confirm('Hapus resep ini?')) return
    try {
      await deleteResepHpp(id)
      setSuccess('Resep berhasil dihapus')
      fetchData()
    } catch (err) {
      setError('Gagal menghapus')
    }
  }

  // Group resep by rasa
  const resepByRasa = resepList.reduce((acc, r) => {
    const key = r.rasaKopi.nama
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="HPP & Resep" />
        <main className="flex-1 p-6">

          <div className="flex gap-2 mb-6">
            {['resep', 'bahan'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
                {tab === 'resep' ? '📋 Resep HPP per Rasa' : '🧂 Bahan & Harga'}
              </button>
            ))}
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* TAB RESEP */}
          {activeTab === 'resep' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowFormResep(!showFormResep)}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormResep ? 'Batal' : '+ Buat Resep HPP'}
                </button>
              </div>

              {showFormResep && (
                <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Buat resep HPP baru</h3>
                  <form onSubmit={handleSubmitResep}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Rasa kopi *</label>
                        <select value={formResep.rasaKopiId}
                          onChange={e => setFormResep(f => ({ ...f, rasaKopiId: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                          <option value="">Pilih rasa...</option>
                          {rasaList.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Catatan</label>
                        <input type="text" value={formResep.catatan}
                          onChange={e => setFormResep(f => ({ ...f, catatan: e.target.value }))}
                          placeholder="Opsional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                    </div>

                    {/* Detail bahan */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Bahan dalam 1 botol *</label>
                        <button type="button" onClick={addDetailRow}
                          className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg hover:bg-amber-100">
                          + Tambah bahan
                        </button>
                      </div>

                      {/* Header kolom */}
                      {formResep.detail.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                          <div className="col-span-5 text-xs text-gray-400">Bahan</div>
                          <div className="col-span-2 text-xs text-gray-400">Jumlah pakai</div>
                          <div className="col-span-2 text-xs text-gray-400">Harga/satuan</div>
                          <div className="col-span-2 text-xs text-gray-400">Subtotal</div>
                        </div>
                      )}

                      {formResep.detail.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                          Klik "+ Tambah bahan" untuk mulai menyusun resep
                        </div>
                      )}

                      {formResep.detail.map((row, i) => {
                        const bahan = bahanList.find(b => b.id === row.bahanHppId)
                        const subtotal = bahan && row.jumlahPakai
                          ? Number(bahan.hargaPerGram) * Number(row.jumlahPakai)
                          : 0
                        return (
                          <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <div className="col-span-5">
                              <select value={row.bahanHppId}
                                onChange={e => updateDetailRow(i, 'bahanHppId', e.target.value)}
                                required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                                <option value="">Pilih bahan...</option>
                                {bahanList.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.nama} ({b.satuan} · {formatRp(Number(b.hargaPerGram))}/{b.satuan})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" step="0.01" value={row.jumlahPakai}
                                onChange={e => updateDetailRow(i, 'jumlahPakai', e.target.value)}
                                placeholder={bahan ? bahan.satuan : 'Jumlah'}
                                required min="0.01"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                            </div>
                            <div className="col-span-2 text-xs text-gray-500 text-center">
                              {bahan ? formatRp(Number(bahan.hargaPerGram)) : '-'}
                            </div>
                            <div className="col-span-2 text-xs font-medium text-amber-700">
                              {subtotal > 0 ? formatRp(subtotal) : '-'}
                            </div>
                            <button type="button" onClick={() => removeDetailRow(i)}
                              className="col-span-1 text-red-400 hover:text-red-600 text-xl text-center">×</button>
                          </div>
                        )
                      })}

                      {previewHpp > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
                          <span className="text-sm text-amber-800">Total HPP per botol</span>
                          <span className="text-lg font-medium text-amber-900">{formatRp(previewHpp)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormResep(false)}
                        className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit"
                        className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">
                        Simpan Resep
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List resep per rasa */}
              {loading ? (
                <div className="text-center text-sm text-gray-400 py-12">Memuat data...</div>
              ) : Object.keys(resepByRasa).length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-12">
                  Belum ada resep HPP — klik "+ Buat Resep HPP" untuk mulai
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Object.entries(resepByRasa).map(([rasa, reseps]) => (
                    <div key={rasa}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-900">☕ {rasa}</span>
                        <span className="text-xs text-gray-400">{reseps.length} versi resep</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {reseps.map(resep => (
                          <div key={resep.id}
                            className={`bg-white border rounded-xl p-5 ${resep.isAktif ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-100'}`}>
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-medium text-gray-900">{formatRp(resep.totalHpp)}</span>
                                  <span className="text-xs text-gray-400">/ botol</span>
                                  {resep.isAktif && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                      ✓ Aktif
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Dibuat {new Date(resep.createdAt).toLocaleDateString('id-ID')} oleh {resep.createdBy.name}
                                </div>
                                {resep.catatan && <div className="text-xs text-gray-400 italic mt-0.5">"{resep.catatan}"</div>}
                              </div>
                              <div className="flex gap-2">
                                {!resep.isAktif && (
                                  <button onClick={() => handleAktifkan(resep.id)}
                                    className="text-xs px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                                    Aktifkan
                                  </button>
                                )}
                                <button onClick={() => handleDeleteResep(resep.id)}
                                  className="text-xs px-3 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50">
                                  Hapus
                                </button>
                              </div>
                            </div>

                            {/* Detail bahan */}
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                  <th className="text-left px-3 py-2 font-medium rounded-l-lg">Bahan</th>
                                  <th className="text-right px-3 py-2 font-medium">Jumlah</th>
                                  <th className="text-right px-3 py-2 font-medium">Harga/satuan</th>
                                  <th className="text-right px-3 py-2 font-medium rounded-r-lg">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {resep.detail.map(d => (
                                  <tr key={d.id} className="border-t border-gray-50">
                                    <td className="px-3 py-2 text-gray-700">{d.bahanHpp.nama}</td>
                                    <td className="px-3 py-2 text-right text-gray-600">
                                      {Number(d.jumlahPakai)} {d.bahanHpp.satuan}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-500">
                                      {formatRp(Number(d.bahanHpp.hargaPerGram))}/{d.bahanHpp.satuan}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-amber-700">
                                      {formatRp(Number(d.subtotal))}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="border-t border-gray-200">
                                  <td colSpan={3} className="px-3 py-2 font-medium text-gray-900">Total HPP</td>
                                  <td className="px-3 py-2 text-right font-medium text-amber-800">
                                    {formatRp(resep.totalHpp)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB BAHAN & HARGA */}
          {activeTab === 'bahan' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowFormBahan(!showFormBahan); setEditBahan(null); setFormBahan({ nama: '', satuan: '', hargaPerUnit: '', beratPerUnit: '' }) }}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormBahan ? 'Batal' : '+ Tambah Bahan'}
                </button>
              </div>

              {showFormBahan && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{editBahan ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h3>
                  <form onSubmit={handleSubmitBahan}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nama bahan *</label>
                        <input value={formBahan.nama} onChange={e => setFormBahan(f => ({ ...f, nama: e.target.value }))}
                          required placeholder="cth: Krimer, SKM, Sirup Aren"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Satuan *</label>
                        <input value={formBahan.satuan} onChange={e => setFormBahan(f => ({ ...f, satuan: e.target.value }))}
                          required placeholder="cth: gr, ml"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Harga per kemasan (Rp) *</label>
                        <input type="number" value={formBahan.hargaPerUnit}
                          onChange={e => setFormBahan(f => ({ ...f, hargaPerUnit: e.target.value }))}
                          required placeholder="cth: 50000"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                        <div className="text-xs text-gray-400 mt-1">Harga beli 1 kemasan di pasar</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Berat/volume per kemasan *</label>
                        <input type="number" step="0.01" value={formBahan.beratPerUnit}
                          onChange={e => setFormBahan(f => ({ ...f, beratPerUnit: e.target.value }))}
                          required placeholder="cth: 1000 (untuk 1kg)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                        <div className="text-xs text-gray-400 mt-1">Dalam satuan yang sama ({formBahan.satuan || 'satuan'})</div>
                      </div>
                    </div>

                    {hargaPerGramPreview > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                        <span className="text-sm text-amber-800">Harga per {formBahan.satuan || 'satuan'}</span>
                        <span className="text-base font-medium text-amber-900">
                          {formatRp(hargaPerGramPreview)} / {formBahan.satuan || 'satuan'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormBahan(false)}
                        className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit"
                        className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {bahanList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Belum ada bahan — tambahkan dulu sebelum membuat resep HPP
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Nama bahan</th>
                        <th className="text-left px-4 py-3 font-medium">Satuan</th>
                        <th className="text-right px-4 py-3 font-medium">Harga/kemasan</th>
                        <th className="text-right px-4 py-3 font-medium">Berat/kemasan</th>
                        <th className="text-right px-4 py-3 font-medium">Harga/satuan</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bahanList.map(b => (
                        <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{b.nama}</td>
                          <td className="px-4 py-3 text-gray-500">{b.satuan}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatRp(Number(b.hargaPerUnit))}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{Number(b.beratPerUnit)} {b.satuan}</td>
                          <td className="px-4 py-3 text-right font-medium text-amber-700">
                            {formatRp(Number(b.hargaPerGram))}/{b.satuan}
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <button onClick={() => { setEditBahan(b); setFormBahan({ nama: b.nama, satuan: b.satuan, hargaPerUnit: Number(b.hargaPerUnit), beratPerUnit: Number(b.beratPerUnit) }); setShowFormBahan(true) }}
                              className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Edit</button>
                            <button onClick={async () => { if (confirm('Hapus bahan ini?')) { await deleteBahanHpp(b.id); fetchData() } }}
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

export default HPPHarga