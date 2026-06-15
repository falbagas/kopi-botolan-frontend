import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getDashboard } from '../api/dashboard.api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'

const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')

const StatCard = ({ label, value, sub, color = 'white', textColor = 'gray-900' }) => (
  <div className={`bg-${color} border border-gray-100 rounded-xl p-5`}>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className={`text-2xl font-medium text-${textColor}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
)

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('minggu')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDashboard({ periode, tanggal })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [periode, tanggal])

  const periodeLabel = {
    hari: 'Hari ini',
    minggu: 'Minggu ini',
    bulan: 'Bulan ini'
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Dashboard" />
        <main className="flex-1 p-6">

          {/* Filter periode */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {['hari', 'minggu', 'bulan'].map(p => (
                <button key={p} onClick={() => setPeriode(p)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${periode === p ? 'bg-amber-400 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {periodeLabel[p]}
                </button>
              ))}
            </div>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 bg-white" />
          </div>

          {loading ? (
            <div className="text-center text-sm text-gray-400 py-20">Memuat dashboard...</div>
          ) : !data ? (
            <div className="text-center text-sm text-gray-400 py-20">Gagal memuat data</div>
          ) : (
            <>
              {/* Stat cards row 1 — Produksi & Koperasi */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Total produksi</div>
                  <div className="text-2xl font-medium text-gray-900">{data.produksi.totalBotol}</div>
                  <div className="text-xs text-gray-400 mt-1">{data.produksi.jumlahSesi} sesi produksi</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.produksi.rekapRasa.map(r => (
                      <span key={r.nama} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {r.nama} {r.jumlah}btl
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Botol ke koperasi</div>
                  <div className="text-2xl font-medium text-gray-900">{data.koperasi.totalBotolMasuk}</div>
                  <div className="text-xs text-gray-400 mt-1">Sudah dibayar: {data.koperasi.totalBotolBayar} botol</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Transaksi POS</div>
                  <div className="text-2xl font-medium text-gray-900">{data.pos.totalTransaksi}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Cash {formatRp(data.pos.totalCash)} · QRIS {formatRp(data.pos.totalQris)}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="text-xs text-amber-700 mb-1">Total laba</div>
                  <div className={`text-2xl font-medium ${data.laba.totalLaba >= 0 ? 'text-amber-800' : 'text-red-600'}`}>
                    {formatRp(data.laba.totalLaba)}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">HPP {formatRp(data.hppPerBotol)}/botol</div>
                </div>
              </div>

              {/* Stat cards row 2 — Laba detail */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Laba koperasi</div>
                  <div className={`text-xl font-medium ${data.laba.labaKoperasi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatRp(data.laba.labaKoperasi)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Setelah potongan koperasi & HPP</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Laba POS Coffee</div>
                  <div className={`text-xl font-medium ${data.laba.labaPos >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatRp(data.laba.labaPos)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Pendapatan {formatRp(data.pos.totalPendapatan)} - HPP</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-1">Pembayaran masuk koperasi</div>
                  <div className="text-xl font-medium text-gray-900">{formatRp(data.koperasi.totalPembayaranMasuk)}</div>
                  <div className="text-xs text-gray-400 mt-1">Sudah dipotong komisi koperasi</div>
                </div>
              </div>

              {/* Grafik */}
              {data.grafik.length > 1 && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
                  <div className="text-sm font-medium text-gray-900 mb-4">Tren produksi & pendapatan</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.grafik} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => v + ' btl'} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => 'Rp' + (v/1000) + 'k'} />
                      <Tooltip formatter={(val, name) => name === 'produksi' ? val + ' botol' : formatRp(val)} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="produksi" name="Produksi (btl)" fill="#d4a853" radius={[4,4,0,0]} />
                      <Bar yAxisId="right" dataKey="pendapatanPos" name="Pendapatan POS" fill="#60a5fa" radius={[4,4,0,0]} />
                      <Bar yAxisId="right" dataKey="pendapatanKoperasi" name="Pembayaran Koperasi" fill="#4ade80" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Stok per koperasi */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">Status per koperasi</div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="text-left px-4 py-3 font-medium">Koperasi</th>
                      <th className="text-right px-4 py-3 font-medium">Botol masuk</th>
                      <th className="text-right px-4 py-3 font-medium">Sudah dibayar</th>
                      <th className="text-right px-4 py-3 font-medium">Belum dibayar</th>
                      <th className="text-right px-4 py-3 font-medium">Harga/botol</th>
                      <th className="text-right px-4 py-3 font-medium">Potongan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.koperasi.list.map(k => (
                      <tr key={k.id} className={`border-t border-gray-100 hover:bg-gray-50 ${k.isRendah ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {k.nama}
                          {k.isRendah && <span className="ml-2 text-xs text-red-500">⚠ stok rendah</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{k.botolMasuk}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{k.botolBayar}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={k.sisaBelumBayar > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                            {k.sisaBelumBayar}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatRp(k.hargaJual)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{k.potongan}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard