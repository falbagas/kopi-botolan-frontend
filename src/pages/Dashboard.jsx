import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Dashboard" />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">Ringkasan operasional</h2>
            <p className="text-sm text-gray-500">Data hari ini</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total produksi" value="—" sub="botol bulan ini" />
            <StatCard label="Stok freezer" value="—" sub="botol tersisa" />
            <StatCard label="Total di koperasi" value="—" sub="7 koperasi aktif" />
            <StatCard label="Estimasi laba" value="—" sub="bulan ini" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-sm text-gray-400 text-center py-8">
              Data akan muncul setelah produksi dan pengiriman dicatat
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard