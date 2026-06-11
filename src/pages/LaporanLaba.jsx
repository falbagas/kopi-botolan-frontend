import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getLaporanMingguan } from '../api/laporan.api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'

const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')
const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const getMingguList = () => {
  const list = []
  const now = new Date()
  for (let i = 0; i < 8; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - (i * 7))
    const dayOfWeek = d.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    d.setDate(d.getDate() + diffToMonday)
    list.push(d.toISOString().split('T')[0])
  }
  return list
}

const LaporanLaba = () => {
  const mingguList = getMingguList()
  const [selectedMinggu, setSelectedMinggu] = useState(mingguList[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ringkasan')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getLaporanMingguan(selectedMinggu)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [selectedMinggu])

  const chartDataKoperasi = data?.koperasi?.map(k => ({
    nama: k.nama.replace('Koperasi ', '').replace('Kop. ', ''),
    'Pendapatan': k.pendapatanBersih,
    'HPP': k.totalHpp,
    'Laba': k.laba,
  })) || []

  const chartDataPos = data ? [
    { nama: 'POS Coffee', 'Pendapatan': data.pos.totalPendapatan, 'HPP': data.pos.totalHpp, 'Laba': data.pos.laba }
  ] : []

  const getMingguLabel = (tgl) => {
    const d = new Date(tgl)
    const akhir = new Date(d)
    akhir.setDate(d.getDate() + 6)
    return `${formatTanggal(d)} – ${formatTanggal(akhir)}`
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Laporan Laba" />
        <main className="flex-1 p-6">

          {/* Filter minggu */}
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-gray-500">Periode:</label>
            <select
              value={selectedMinggu}
              onChange={e => setSelectedMinggu(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              {mingguList.map(m => (
                <option key={m} value={m}>{getMingguLabel(m)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-sm text-gray-400 py-12">Memuat laporan...</div>
          ) : !data ? (
            <div className="text-center text-sm text-gray-400 py-12">Gagal memuat data</div>
          ) : (
            <>
              {/* Grand total cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Laba koperasi</div>
                  <div className={`text-2xl font-medium ${data.grandTotal.totalLabaKoperasi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatRp(data.grandTotal.totalLabaKoperasi)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">dari {data.koperasi.length} koperasi</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Laba POS Coffee</div>
                  <div className={`text-2xl font-medium ${data.grandTotal.labaPos >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatRp(data.grandTotal.labaPos)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{data.pos.totalTransaksi} transaksi</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="text-xs text-amber-700 mb-1">Total laba minggu ini</div>
                  <div className={`text-2xl font-medium ${data.grandTotal.totalLaba >= 0 ? 'text-amber-800' : 'text-red-600'}`}>
                    {formatRp(data.grandTotal.totalLaba)}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">HPP: {formatRp(data.grandTotal.hppPerBotol)}/botol</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {['ringkasan', 'koperasi', 'pos'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'}`}>
                    {tab === 'ringkasan' ? '📊 Grafik' : tab === 'koperasi' ? '🏪 Koperasi' : '☕ POS Coffee'}
                  </button>
                ))}
              </div>

              {/* TAB GRAFIK */}
              {activeTab === 'ringkasan' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="text-sm font-medium text-gray-900 mb-4">Pendapatan vs HPP vs Laba — per koperasi</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartDataKoperasi} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="nama" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => 'Rp' + (v / 1000) + 'k'} />
                        <Tooltip formatter={(val) => formatRp(val)} />
                        <Legend />
                        <Bar dataKey="Pendapatan" fill="#d4a853" radius={[4,4,0,0]} />
                        <Bar dataKey="HPP" fill="#e5e7eb" radius={[4,4,0,0]} />
                        <Bar dataKey="Laba" fill="#4ade80" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="text-sm font-medium text-gray-900 mb-4">Rekap menu terlaris — POS Coffee</div>
                    {data.pos.rekapMenu.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-8">Belum ada transaksi POS minggu ini</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.pos.rekapMenu} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="nama" type="category" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(val, name) => name === 'total' ? formatRp(val) : val} />
                          <Bar dataKey="jumlah" fill="#d4a853" radius={[0,4,4,0]} name="Qty terjual" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* TAB KOPERASI */}
              {activeTab === 'koperasi' && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Koperasi</th>
                        <th className="text-right px-4 py-3 font-medium">Harga/botol</th>
                        <th className="text-right px-4 py-3 font-medium">Potongan</th>
                        <th className="text-right px-4 py-3 font-medium">Botol dibayar</th>
                        <th className="text-right px-4 py-3 font-medium">Pendapatan kotor</th>
                        <th className="text-right px-4 py-3 font-medium">Potongan (Rp)</th>
                        <th className="text-right px-4 py-3 font-medium">HPP</th>
                        <th className="text-right px-4 py-3 font-medium">Laba bersih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.koperasi.map(k => (
                        <tr key={k.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{k.nama}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatRp(k.hargaJualBotol)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{k.potonganPersen}%</td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">{k.totalBotolBayar}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatRp(k.pendapatanKotor)}</td>
                          <td className="px-4 py-3 text-right text-red-400">-{formatRp(k.potonganNominal)}</td>
                          <td className="px-4 py-3 text-right text-red-400">-{formatRp(k.totalHpp)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            <span className={k.laba >= 0 ? 'text-green-600' : 'text-red-500'}>{formatRp(k.laba)}</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900" colSpan={7}>Total laba koperasi</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{formatRp(data.grandTotal.totalLabaKoperasi)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB POS */}
              {activeTab === 'pos' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Total transaksi</div>
                      <div className="text-xl font-medium text-gray-900">{data.pos.totalTransaksi}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Total pendapatan</div>
                      <div className="text-xl font-medium text-gray-900">{formatRp(data.pos.totalPendapatan)}</div>
                      <div className="text-xs text-gray-400 mt-1">Cash: {formatRp(data.pos.totalCash)} · QRIS: {formatRp(data.pos.totalQris)}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">Total HPP</div>
                      <div className="text-xl font-medium text-red-400">-{formatRp(data.pos.totalHpp)}</div>
                      <div className="text-xs text-gray-400 mt-1">{data.pos.totalBotol} botol × {formatRp(data.grandTotal.hppPerBotol)}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="text-xs text-green-700 mb-1">Laba POS</div>
                      <div className={`text-xl font-medium ${data.pos.laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatRp(data.pos.laba)}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-900">Rekap per menu</div>
                    {data.pos.rekapMenu.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">Belum ada transaksi minggu ini</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="text-left px-4 py-3 font-medium">Menu</th>
                            <th className="text-right px-4 py-3 font-medium">Qty terjual</th>
                            <th className="text-right px-4 py-3 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.pos.rekapMenu.sort((a,b) => b.jumlah - a.jumlah).map((m, i) => (
                            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-900">{m.nama}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">{m.jumlah}</td>
                              <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatRp(m.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default LaporanLaba