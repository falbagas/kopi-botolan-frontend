import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getAllPemilik, updatePemilik, getPembagianLaba, bagikanLaba, previewLaba, tambahMutasi } from '../api/laba.api'

const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')
const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const formatWaktu = (val) => new Date(val).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const jenisBadge = {
  LABA_MASUK: { label: 'Laba Masuk', color: 'bg-green-100 text-green-700' },
  PENARIKAN: { label: 'Penarikan', color: 'bg-red-100 text-red-700' },
  KOREKSI: { label: 'Koreksi', color: 'bg-blue-100 text-blue-700' },
}

const PembagianLaba = () => {
  const [activeTab, setActiveTab] = useState('saldo')
  const [pemilikList, setPemilikList] = useState([])
  const [riwayatList, setRiwayatList] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form bagikan laba
  const [showFormBagi, setShowFormBagi] = useState(false)
  const [formBagi, setFormBagi] = useState({
    periodeAwal: '', periodeAkhir: '', keterangan: ''
  })
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form mutasi manual
  const [showFormMutasi, setShowFormMutasi] = useState(null)
  const [formMutasi, setFormMutasi] = useState({ jenis: 'PENARIKAN', jumlah: '', keterangan: '' })

  // Edit pemilik
  const [editPemilik, setEditPemilik] = useState(null)
  const [formEdit, setFormEdit] = useState({ nama: '', persentaseKoperasi: '', persentasePos: '' })

  const fetchData = async () => {
    try {
      const [pemilikRes, riwayatRes] = await Promise.all([
        getAllPemilik(), getPembagianLaba()
      ])
      setPemilikList(pemilikRes.data)
      setRiwayatList(riwayatRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setSuccess(''); setError('') }, 4000)
  }

  const handlePreview = async () => {
    if (!formBagi.periodeAwal || !formBagi.periodeAkhir) {
      return showMsg('Pilih periode dulu', true)
    }
    setLoadingPreview(true)
    try {
      const res = await previewLaba({ periodeAwal: formBagi.periodeAwal, periodeAkhir: formBagi.periodeAkhir })
      setPreview(res.data)
    } catch (err) {
      showMsg(err.response?.data?.message || 'Gagal load preview', true)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleBagikan = async () => {
    if (!preview) return showMsg('Preview dulu sebelum bagikan', true)
    if (!confirm(`Bagikan laba ${formatRp(preview.totalLaba)} ke ${pemilikList.length} pemilik?`)) return
    setSubmitting(true)
    try {
      await bagikanLaba(formBagi)
      showMsg('Laba berhasil dibagikan!')
      setFormBagi({ periodeAwal: '', periodeAkhir: '', keterangan: '' })
      setPreview(null)
      setShowFormBagi(false)
      fetchData()
    } catch (err) {
      showMsg(err.response?.data?.message || 'Gagal membagikan laba', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMutasi = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await tambahMutasi({ pemilikId: showFormMutasi.id, ...formMutasi })
      showMsg('Mutasi berhasil dicatat!')
      setShowFormMutasi(null)
      setFormMutasi({ jenis: 'PENARIKAN', jumlah: '', keterangan: '' })
      fetchData()
    } catch (err) {
      showMsg(err.response?.data?.message || 'Gagal menyimpan', true)
    }
  }

  const handleUpdatePemilik = async (e) => {
    e.preventDefault()
    try {
      await updatePemilik(editPemilik.id, formEdit)
      showMsg('Data pemilik berhasil diupdate!')
      setEditPemilik(null)
      fetchData()
    } catch (err) {
      showMsg('Gagal update pemilik', true)
    }
  }

  const totalPersen = pemilikList.reduce((s, p) => s + Number(p.persentase), 0)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Pembagian Laba" />
        <main className="flex-1 p-6">

          <div className="flex gap-2 mb-6">
            {['saldo', 'bagikan', 'riwayat', 'pengaturan'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
                {tab === 'saldo' ? '💰 Saldo Pemilik' : tab === 'bagikan' ? '➗ Bagikan Laba' : tab === 'riwayat' ? '📋 Riwayat' : '⚙️ Pengaturan'}
              </button>
            ))}
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* TAB SALDO */}
          {activeTab === 'saldo' && (
            <div>
              {loading ? (
                <div className="text-center text-sm text-gray-400 py-12">Memuat data...</div>
              ) : (
                <>
                  {/* Kartu saldo per pemilik */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {pemilikList.map(p => (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">{p.nama}</div>
                            <div className="text-xs text-amber-600 font-medium mt-0.5">
                              Koperasi {Number(p.persentaseKoperasi)}% · POS {Number(p.persentasePos)}%
                            </div>
                          </div>
                          <button onClick={() => { setShowFormMutasi(p); setFormMutasi({ jenis: 'PENARIKAN', jumlah: '', keterangan: '' }) }}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                            + Mutasi
                          </button>
                        </div>
                        <div className="text-2xl font-medium text-gray-900 mb-1">{formatRp(p.saldo)}</div>
                        <div className="text-xs text-gray-400">Saldo saat ini</div>

                        {/* Riwayat singkat */}
                        {p.mutasi.length > 0 && (
                          <div className="mt-3 border-t border-gray-50 pt-3">
                            <div className="text-xs text-gray-400 mb-2">Mutasi terakhir</div>
                            <div className="flex flex-col gap-1.5">
                              {p.mutasi.slice(0, 3).map(m => (
                                <div key={m.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 truncate max-w-24">{m.keterangan || m.jenis}</span>
                                  <span className={m.jenis === 'LABA_MASUK' || m.jenis === 'KOREKSI' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                                    {m.jenis === 'PENARIKAN' ? '-' : '+'}{formatRp(m.jumlah)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tabel mutasi lengkap */}
                  {pemilikList.map(p => (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">Rekening — {p.nama}</div>
                        <div className="text-sm font-medium text-amber-700">{formatRp(p.saldo)}</div>
                      </div>
                      {p.mutasi.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">Belum ada mutasi</div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500">
                              <th className="text-left px-4 py-2 font-medium">Waktu</th>
                              <th className="text-left px-4 py-2 font-medium">Jenis</th>
                              <th className="text-left px-4 py-2 font-medium">Keterangan</th>
                              <th className="text-right px-4 py-2 font-medium">Jumlah</th>
                              <th className="text-right px-4 py-2 font-medium">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.mutasi.map(m => (
                              <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-400 text-xs">{formatWaktu(m.createdAt)}</td>
                                <td className="px-4 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${jenisBadge[m.jenis]?.color}`}>
                                    {jenisBadge[m.jenis]?.label}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-500 text-xs">{m.keterangan || '-'}</td>
                                <td className="px-4 py-2 text-right font-medium">
                                  <span className={m.jenis === 'PENARIKAN' ? 'text-red-500' : 'text-green-600'}>
                                    {m.jenis === 'PENARIKAN' ? '-' : '+'}{formatRp(m.jumlah)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700 font-medium">{formatRp(m.saldoSesudah)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB BAGIKAN LABA */}
          {activeTab === 'bagikan' && (
            <div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Bagikan laba ke pemilik</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Periode dari *</label>
                    <input type="date" value={formBagi.periodeAwal}
                      onChange={e => { setFormBagi(f => ({ ...f, periodeAwal: e.target.value })); setPreview(null) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Periode sampai *</label>
                    <input type="date" value={formBagi.periodeAkhir}
                      onChange={e => { setFormBagi(f => ({ ...f, periodeAkhir: e.target.value })); setPreview(null) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Keterangan</label>
                    <input type="text" value={formBagi.keterangan}
                      onChange={e => setFormBagi(f => ({ ...f, keterangan: e.target.value }))}
                      placeholder="cth: Pembagian laba minggu ke-3 Mei"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                </div>

                <button onClick={handlePreview} disabled={loadingPreview}
                  className="px-4 py-2 text-sm border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 mb-4">
                  {loadingPreview ? 'Menghitung...' : '🔍 Hitung Preview Laba'}
                </button>

                {/* Preview */}
                {preview && (
                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-5 mb-4">
                    <div className="text-sm font-medium text-amber-900 mb-3">Preview pembagian laba</div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500">Laba koperasi</div>
                        <div className="text-base font-medium text-gray-900">{formatRp(preview.labaKoperasi)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500">Laba POS</div>
                        <div className="text-base font-medium text-gray-900">{formatRp(preview.labaPos)}</div>
                      </div>
                      <div className="bg-amber-100 rounded-lg p-3">
                        <div className="text-xs text-amber-700">Total laba</div>
                        <div className="text-base font-medium text-amber-900">{formatRp(preview.totalLaba)}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      {preview.pembagian.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{p.nama}</div>
                            <div className="text-xs text-gray-400">
                              Koperasi {p.persentaseKoperasi}% (+{formatRp(p.bagianKoperasi)}) · 
                              POS {p.persentasePos}% (+{formatRp(p.bagianPos)})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">+{formatRp(p.bagian)}</div>
                            <div className="text-xs text-gray-400">→ {formatRp(p.saldoSaatIni + p.bagian)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleBagikan} disabled={submitting}
                      className="w-full bg-amber-400 text-gray-900 font-medium py-2.5 rounded-lg text-sm hover:bg-amber-300 disabled:opacity-50">
                      {submitting ? 'Memproses...' : `✓ Bagikan ${formatRp(preview.totalLaba)} ke ${preview.pembagian.length} pemilik`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB RIWAYAT PEMBAGIAN */}
          {activeTab === 'riwayat' && (
            <div className="flex flex-col gap-4">
              {riwayatList.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-sm text-gray-400">
                  Belum ada riwayat pembagian laba
                </div>
              ) : (
                riwayatList.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatTanggal(r.periodeAwal)} — {formatTanggal(r.periodeAkhir)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Dibuat {formatWaktu(r.createdAt)} oleh {r.createdBy.name}
                        </div>
                        {r.keterangan && <div className="text-xs text-gray-400 italic mt-0.5">"{r.keterangan}"</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-amber-700">{formatRp(r.totalLaba)}</div>
                        <div className="text-xs text-gray-400">total laba dibagi</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.mutasi.map(m => (
                        <div key={m.id} className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs">
                          <div className="font-medium text-gray-700">{m.pemilik.nama}</div>
                          <div className="text-green-600 font-medium">+{formatRp(m.jumlah)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB PENGATURAN */}
          {activeTab === 'pengaturan' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Data pemilik & persentase</div>
                <div className={`text-xs px-3 py-1 rounded-full font-medium ${totalPersen === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Total: {totalPersen}% {totalPersen === 100 ? '✓' : '⚠ harus 100%'}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Nama pemilik</th>
                    <th className="text-right px-4 py-3 font-medium">Persentase</th>
                    <th className="text-right px-4 py-3 font-medium">Saldo saat ini</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pemilikList.map(p => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        {editPemilik?.id === p.id ? (
                          <form onSubmit={handleUpdatePemilik} className="flex gap-2 items-center flex-wrap">
                            <input value={formEdit.nama} onChange={e => setFormEdit(f => ({ ...f, nama: e.target.value }))}
                              placeholder="Nama" className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-32 focus:outline-none focus:border-amber-400" />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">Koperasi</span>
                              <input type="number" value={formEdit.persentaseKoperasi} onChange={e => setFormEdit(f => ({ ...f, persentaseKoperasi: e.target.value }))}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-14 focus:outline-none focus:border-amber-400" />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">POS</span>
                              <input type="number" value={formEdit.persentasePos} onChange={e => setFormEdit(f => ({ ...f, persentasePos: e.target.value }))}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-14 focus:outline-none focus:border-amber-400" />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                            <button type="submit" className="text-xs px-2 py-1 bg-amber-400 text-gray-900 rounded-lg">Simpan</button>
                            <button type="button" onClick={() => setEditPemilik(null)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500">Batal</button>
                          </form>
                        ) : (
                          <span className="font-medium text-gray-900">{p.nama}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-amber-600 font-medium">{Number(p.persentase)}%</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatRp(p.saldo)}</td>
                      <td className="px-4 py-3 text-right">
                        {editPemilik?.id !== p.id && (
                          <button onClick={() => { setEditPemilik(p); setFormEdit({ nama: p.nama, persentaseKoperasi: Number(p.persentaseKoperasi), persentasePos: Number(p.persentasePos) }) }}
                            className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {/* Modal mutasi manual */}
      {showFormMutasi && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Tambah Mutasi</h3>
            <p className="text-xs text-gray-500 mb-4">untuk <strong>{showFormMutasi.nama}</strong> · saldo {formatRp(showFormMutasi.saldo)}</p>
            <form onSubmit={handleMutasi}>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Jenis mutasi *</label>
                <select value={formMutasi.jenis} onChange={e => setFormMutasi(f => ({ ...f, jenis: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                  <option value="PENARIKAN">Penarikan (saldo berkurang)</option>
                  <option value="KOREKSI">Koreksi (saldo bertambah)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Jumlah (Rp) *</label>
                <input type="number" value={formMutasi.jumlah} onChange={e => setFormMutasi(f => ({ ...f, jumlah: e.target.value }))}
                  required placeholder="cth: 500000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Keterangan *</label>
                <input type="text" value={formMutasi.keterangan} onChange={e => setFormMutasi(f => ({ ...f, keterangan: e.target.value }))}
                  required placeholder="cth: Ambil untuk belanja bahan baku"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowFormMutasi(null)}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default PembagianLaba