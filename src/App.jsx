import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Produksi from './pages/Produksi'
import StokFreezer from './pages/StokFreezer'
import Koperasi from './pages/Koperasi'
import Pengiriman from './pages/Pengiriman'
import LaporanLaba from './pages/LaporanLaba'
import HPPHarga from './pages/HPPHarga'
import ManajemenUser from './pages/ManajemenUser'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/produksi" element={<ProtectedRoute><Produksi /></ProtectedRoute>} />
          <Route path="/stok-freezer" element={<ProtectedRoute><StokFreezer /></ProtectedRoute>} />
          <Route path="/koperasi" element={<ProtectedRoute><Koperasi /></ProtectedRoute>} />
          <Route path="/pengiriman" element={<ProtectedRoute><Pengiriman /></ProtectedRoute>} />
          <Route path="/laporan-laba" element={<ProtectedRoute><LaporanLaba /></ProtectedRoute>} />
          <Route path="/hpp-harga" element={<ProtectedRoute><HPPHarga /></ProtectedRoute>} />
          <Route path="/manajemen-user" element={<ProtectedRoute><ManajemenUser /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App