import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'

const LaporanLaba = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Produksi" />
        <main className="flex-1 p-6">
          <p className="text-gray-400 text-sm">Halaman laporan laba — segera hadir</p>
        </main>
      </div>
    </div>
  )
}

export default LaporanLaba