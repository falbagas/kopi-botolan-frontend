import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getAllHpp, createHpp, getHppAktif } from '../api/hpp.api'

const HPPHarga = () => {
  const [hppList, setHppList] = useState([])
  const [hppAktif, setHppAktif] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    biayaBahan: '',
    biayaProduksi: '',
    biayaLain: '',
    berlakuDari: '',
    keterangan: '',
  })

  const fetchData = async () => {
    try {
      const [aktifRes, allRes] = await Promise.all([
        getHppAktif().catch(() => ({ data: null })),
        getAllHpp(),
      ])
      setHppAktif(aktifRes.data)
      setHppList(allRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const totalPreview =
    (Number(form.biayaBahan) || 0) +
    (Number(form.biayaProduksi) || 0) +
    (Number(form.biayaLain) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await createHpp(form)
      setSuccess('HPP berhasil disimpan!')
      setForm({ biayaBahan: '', biayaProduksi: '', biayaLain: '', berlakuDari: '', keterangan: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan HPP')
    } finally {
      setSubmitting(false)
    }
  }

  const formatRp = (val) =>
    'Rp ' + Number(val).toLocaleString('id-ID')

  const formatTanggal = (val) =>
    new Date(val).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="HPP & Harga" />
        <main className="flex-1 p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">HPP & Harga Jual</h2>
              <p className="text-sm text-gray-500">
                Perubahan HPP hanya berlaku ke depan, data historis tetap aman
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors"
            >
              {showForm ? 'Batal' : '+ Update HPP'}
            </button>
          </div>

          {/* Notifikasi */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* HPP Aktif */}
          {hppAktif && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-800">HPP aktif sekarang</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Berlaku sejak {formatTanggal(hppAktif.berlakuDari)}
                </span>
              </div>
              <div className="text-3xl font-medium text-green-900 mb-3">
                {formatRp(hppAktif.totalHpp)} <span className="text-base font-normal text-green-700">/ botol</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs text-gray-500 mb-1">Biaya bahan baku</div>
                  <div className="text-sm font-medium text-gray-900">{formatRp(hppAktif.biayaBahan)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs text-gray-500 mb-1">Biaya produksi</div>
                  <div className="text-sm font-medium text-gray-900">{formatRp(hppAktif.biayaProduksi)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs text-gray-500 mb-1">Biaya lain-lain</div>
                  <div className="text-sm font-medium text-gray-900">{formatRp(hppAktif.biayaLain)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Update HPP */}
          {showForm && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Input HPP baru</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Biaya bahan baku (Rp)</label>
                    <input
                      type="number"
                      name="biayaBahan"
                      value={form.biayaBahan}
                      onChange={handleChange}
                      placeholder="cth: 5500"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Biaya produksi (Rp)</label>
                    <input
                      type="number"
                      name="biayaProduksi"
                      value={form.biayaProduksi}
                      onChange={handleChange}
                      placeholder="cth: 2000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Biaya lain-lain (Rp)</label>
                    <input
                      type="number"
                      name="biayaLain"
                      value={form.biayaLain}
                      onChange={handleChange}
                      placeholder="cth: 1000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Berlaku dari tanggal</label>
                    <input
                      type="date"
                      name="berlakuDari"
                      value={form.berlakuDari}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Keterangan (opsional)</label>
                  <input
                    type="text"
                    name="keterangan"
                    value={form.keterangan}
                    onChange={handleChange}
                    placeholder="cth: Kenaikan harga bahan baku Mei 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Preview total */}
                {totalPreview > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                    <span className="text-sm text-amber-800">Total HPP per botol</span>
                    <span className="text-lg font-medium text-amber-900">{formatRp(totalPreview)}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300 disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan HPP'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Riwayat HPP */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Riwayat perubahan HPP</h3>
            </div>
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400">Memuat data...</div>
            ) : hppList.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                Belum ada data HPP — klik "Update HPP" untuk mulai
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-6 py-3 font-medium">Berlaku dari</th>
                    <th className="text-right px-4 py-3 font-medium">Bahan baku</th>
                    <th className="text-right px-4 py-3 font-medium">Produksi</th>
                    <th className="text-right px-4 py-3 font-medium">Lain-lain</th>
                    <th className="text-right px-4 py-3 font-medium">Total HPP</th>
                    <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                    <th className="text-left px-4 py-3 font-medium">Diubah oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {hppList.map((hpp, i) => (
                    <tr key={hpp.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-900">
                        {formatTanggal(hpp.berlakuDari)}
                        {i === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            aktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRp(hpp.biayaBahan)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRp(hpp.biayaProduksi)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRp(hpp.biayaLain)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatRp(hpp.totalHpp)}</td>
                      <td className="px-4 py-3 text-gray-500">{hpp.keterangan || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{hpp.createdBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}

export default HPPHarga