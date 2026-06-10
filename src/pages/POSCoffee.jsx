import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getMenu, createMenu, updateMenu, deleteMenu, getTransaksiHarian, createTransaksi, deleteTransaksi, getRekap } from '../api/pos.api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatRp = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')
const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatJam = (val) => new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const POSCoffee = () => {
  const [activeTab, setActiveTab] = useState('pos')
  const [menuList, setMenuList] = useState([])
  const [transaksiList, setTransaksiList] = useState([])
  const [ringkasan, setRingkasan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  // Cart state
  const [cart, setCart] = useState([])
  const [metodeBayar, setMetodeBayar] = useState('CASH')
  const [namaPembeli, setNamaPembeli] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Menu management state
  const [showFormMenu, setShowFormMenu] = useState(false)
  const [editMenu, setEditMenu] = useState(null)
  const [formMenu, setFormMenu] = useState({ nama: '', harga: '', kategori: 'MINUMAN' })

  const fetchData = async () => {
    try {
      const [menuRes, transaksiRes] = await Promise.all([
        getMenu(),
        getTransaksiHarian(tanggal)
      ])
      setMenuList(menuRes.data)
      setTransaksiList(transaksiRes.data.transaksi)
      setRingkasan(transaksiRes.data.ringkasan)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tanggal])

  // Cart functions
  const addToCart = (menu) => {
    const exist = cart.find(c => c.menuId === menu.id)
    if (exist) {
      setCart(cart.map(c => c.menuId === menu.id ? { ...c, jumlah: c.jumlah + 1, subtotal: (c.jumlah + 1) * Number(menu.harga) } : c))
    } else {
      setCart([...cart, { menuId: menu.id, nama: menu.nama, harga: Number(menu.harga), jumlah: 1, subtotal: Number(menu.harga) }])
    }
  }

  const removeFromCart = (menuId) => setCart(cart.filter(c => c.menuId !== menuId))

  const updateJumlah = (menuId, jumlah) => {
    if (jumlah < 1) return removeFromCart(menuId)
    setCart(cart.map(c => c.menuId === menuId ? { ...c, jumlah, subtotal: jumlah * c.harga } : c))
  }

  const totalCart = cart.reduce((sum, c) => sum + c.subtotal, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return setError('Keranjang masih kosong!')
    setError('')
    setSubmitting(true)
    try {
      await createTransaksi({
        metodeBayar,
        namaPembeli,
        detail: cart.map(c => ({ menuId: c.menuId, jumlah: c.jumlah }))
      })
      setSuccess('Transaksi berhasil!')
      setCart([])
      setNamaPembeli('')
      setMetodeBayar('CASH')
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi')
    } finally {
      setSubmitting(false)
    }
  }

  // PDF Generator
  const generatePDF = async () => {
    try {
      const res = await getRekap(tanggal)
      const { rekapMenu, ringkasan: r, tanggal: tgl } = res.data

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Brew & Stirr Coffee', pageWidth / 2, 20, { align: 'center' })

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Laporan Penjualan Harian', pageWidth / 2, 28, { align: 'center' })
      doc.text(formatTanggal(tgl), pageWidth / 2, 35, { align: 'center' })

      doc.line(14, 40, pageWidth - 14, 40)

      // Rekap per menu
      const minuman = rekapMenu.filter(m => m.kategori === 'MINUMAN')
      const makanan = rekapMenu.filter(m => m.kategori === 'MAKANAN')

      let startY = 48

      if (minuman.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Minuman', 14, startY)
        startY += 4

        autoTable(doc, {
          startY,
          head: [['Menu', 'Qty', 'Total']],
          body: minuman.map(m => [m.nama, m.jumlah, formatRp(m.total)]),
          theme: 'striped',
          headStyles: { fillColor: [212, 168, 83], textColor: 255 },
          styles: { fontSize: 10 },
        })
        startY = doc.lastAutoTable.finalY + 8
      }

      if (makanan.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Makanan', 14, startY)
        startY += 4

        autoTable(doc, {
          startY,
          head: [['Menu', 'Qty', 'Total']],
          body: makanan.map(m => [m.nama, m.jumlah, formatRp(m.total)]),
          theme: 'striped',
          headStyles: { fillColor: [212, 168, 83], textColor: 255 },
          styles: { fontSize: 10 },
        })
        startY = doc.lastAutoTable.finalY + 8
      }

      // Ringkasan
      doc.line(14, startY, pageWidth - 14, startY)
      startY += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Transaksi: ${r.totalTransaksi} transaksi`, 14, startY)
      startY += 7
      doc.text(`Total Cash: ${formatRp(r.totalCash)}`, 14, startY)
      startY += 7
      doc.text(`Total QRIS: ${formatRp(r.totalQris)}`, 14, startY)
      startY += 7

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(`Grand Total: ${formatRp(r.grandTotal)}`, 14, startY)

      doc.save(`laporan-${tanggal}.pdf`)
    } catch (err) {
      setError('Gagal generate PDF')
    }
  }

  // Menu management
  const handleSubmitMenu = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editMenu) {
        await updateMenu(editMenu.id, formMenu)
        setSuccess('Menu berhasil diupdate!')
      } else {
        await createMenu(formMenu)
        setSuccess('Menu berhasil ditambahkan!')
      }
      setFormMenu({ nama: '', harga: '', kategori: 'MINUMAN' })
      setEditMenu(null)
      setShowFormMenu(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan menu')
    }
  }

  const handleEditMenu = (menu) => {
    setEditMenu(menu)
    setFormMenu({ nama: menu.nama, harga: Number(menu.harga), kategori: menu.kategori })
    setShowFormMenu(true)
    setActiveTab('menu')
  }

  const handleDeleteMenu = async (id) => {
    if (!confirm('Yakin hapus menu ini?')) return
    try {
      await deleteMenu(id)
      setSuccess('Menu berhasil dihapus')
      fetchData()
    } catch (err) {
      setError('Gagal menghapus menu')
    }
  }

  const minuman = menuList.filter(m => m.kategori === 'MINUMAN')
  const makanan = menuList.filter(m => m.kategori === 'MAKANAN')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="POS Coffee — Car Free Day" />
        <main className="flex-1 p-6">

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['pos', 'transaksi', 'menu'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {tab === 'pos' ? '🛒 Kasir' : tab === 'transaksi' ? '📋 Riwayat' : '🍽 Kelola Menu'}
              </button>
            ))}
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* TAB POS / KASIR */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-5 gap-6">

              {/* Menu grid */}
              <div className="col-span-3">
                {minuman.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Minuman</div>
                    <div className="grid grid-cols-3 gap-3">
                      {minuman.map(menu => (
                        <button key={menu.id} onClick={() => addToCart(menu)}
                          className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-amber-300 hover:shadow-sm transition-all active:scale-95">
                          <div className="text-sm font-medium text-gray-900 mb-1">{menu.nama}</div>
                          <div className="text-xs text-amber-600 font-medium">{formatRp(menu.harga)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {makanan.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Makanan</div>
                    <div className="grid grid-cols-3 gap-3">
                      {makanan.map(menu => (
                        <button key={menu.id} onClick={() => addToCart(menu)}
                          className="bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-amber-300 hover:shadow-sm transition-all active:scale-95">
                          <div className="text-sm font-medium text-gray-900 mb-1">{menu.nama}</div>
                          <div className="text-xs text-amber-600 font-medium">{formatRp(menu.harga)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {menuList.length === 0 && (
                  <div className="text-center py-12 text-sm text-gray-400">Belum ada menu — tambahkan di tab "Kelola Menu"</div>
                )}
              </div>

              {/* Cart */}
              <div className="col-span-2">
                <div className="bg-white border border-gray-100 rounded-xl p-5 sticky top-6">
                  <div className="text-sm font-medium text-gray-900 mb-4">🛒 Pesanan</div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">Klik menu untuk menambahkan</div>
                  ) : (
                    <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.menuId} className="flex items-center gap-3 py-2 border-b border-gray-50">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{item.nama}</div>
                            <div className="text-xs text-gray-400">{formatRp(item.harga)} / pcs</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateJumlah(item.menuId, item.jumlah - 1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 flex items-center justify-center">−</button>
                            <span className="text-sm font-medium w-4 text-center">{item.jumlah}</span>
                            <button onClick={() => updateJumlah(item.menuId, item.jumlah + 1)} className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm hover:bg-amber-200 flex items-center justify-center">+</button>
                          </div>
                          <div className="text-sm font-medium text-gray-900 w-20 text-right">{formatRp(item.subtotal)}</div>
                          <button onClick={() => removeFromCart(item.menuId)} className="text-red-300 hover:text-red-500 text-lg">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 pt-3 mb-4">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <span>Total</span>
                          <span className="text-amber-600">{formatRp(totalCart)}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Nama pembeli (opsional)</label>
                        <input type="text" value={namaPembeli} onChange={e => setNamaPembeli(e.target.value)} placeholder="cth: Budi" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>

                      <div className="mb-4">
                        <label className="text-xs text-gray-500 mb-1 block">Metode pembayaran</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['CASH', 'QRIS'].map(m => (
                            <button key={m} onClick={() => setMetodeBayar(m)}
                              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${metodeBayar === m ? 'bg-amber-400 border-amber-400 text-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>
                              {m === 'CASH' ? '💵 Cash' : '📱 QRIS'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleCheckout} disabled={submitting}
                        className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
                        {submitting ? 'Memproses...' : `Bayar ${formatRp(totalCart)}`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB RIWAYAT TRANSAKSI */}
          {activeTab === 'transaksi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  <span className="text-sm text-gray-500">{transaksiList.length} transaksi</span>
                </div>
                <button onClick={generatePDF}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300 flex items-center gap-2">
                  📄 Export PDF
                </button>
              </div>

              {/* Ringkasan */}
              {ringkasan && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Total transaksi</div>
                    <div className="text-2xl font-medium text-gray-900">{ringkasan.totalTransaksi}</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Total cash</div>
                    <div className="text-xl font-medium text-gray-900">{formatRp(ringkasan.totalCash)}</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Total QRIS</div>
                    <div className="text-xl font-medium text-gray-900">{formatRp(ringkasan.totalQris)}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-xs text-amber-700 mb-1">Grand total</div>
                    <div className="text-xl font-medium text-amber-800">{formatRp(ringkasan.grandTotal)}</div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {transaksiList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada transaksi hari ini</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Jam</th>
                        <th className="text-left px-4 py-3 font-medium">Pembeli</th>
                        <th className="text-left px-4 py-3 font-medium">Pesanan</th>
                        <th className="text-left px-4 py-3 font-medium">Bayar</th>
                        <th className="text-right px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaksiList.map(t => (
                        <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{formatJam(t.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-700">{t.namaPembeli || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {t.detail.map(d => `${d.menu.nama} x${d.jumlah}`).join(', ')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.metodeBayar === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {t.metodeBayar}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{formatRp(t.totalHarga)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={async () => { if (confirm('Hapus transaksi ini?')) { await deleteTransaksi(t.id); fetchData() } }}
                              className="text-xs text-red-400 hover:text-red-600">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB KELOLA MENU */}
          {activeTab === 'menu' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setShowFormMenu(!showFormMenu); setEditMenu(null); setFormMenu({ nama: '', harga: '', kategori: 'MINUMAN' }) }}
                  className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
                  {showFormMenu ? 'Batal' : '+ Tambah Menu'}
                </button>
              </div>

              {showFormMenu && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">{editMenu ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                  <form onSubmit={handleSubmitMenu}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nama menu *</label>
                        <input value={formMenu.nama} onChange={e => setFormMenu({ ...formMenu, nama: e.target.value })} required placeholder="cth: Kopi Susu" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Harga (Rp) *</label>
                        <input type="number" value={formMenu.harga} onChange={e => setFormMenu({ ...formMenu, harga: e.target.value })} required placeholder="cth: 15000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kategori *</label>
                        <select value={formMenu.kategori} onChange={e => setFormMenu({ ...formMenu, kategori: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                          <option value="MINUMAN">Minuman</option>
                          <option value="MAKANAN">Makanan</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFormMenu(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">Simpan</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {menuList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">Belum ada menu</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-4 py-3 font-medium">Nama menu</th>
                        <th className="text-left px-4 py-3 font-medium">Kategori</th>
                        <th className="text-right px-4 py-3 font-medium">Harga</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuList.map(menu => (
                        <tr key={menu.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{menu.nama}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${menu.kategori === 'MINUMAN' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {menu.kategori === 'MINUMAN' ? '☕ Minuman' : '🍱 Makanan'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatRp(menu.harga)}</td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <button onClick={() => handleEditMenu(menu)} className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Edit</button>
                            <button onClick={() => handleDeleteMenu(menu.id)} className="text-xs px-3 py-1 border border-red-100 rounded-lg text-red-400 hover:bg-red-50">Hapus</button>
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

export default POSCoffee