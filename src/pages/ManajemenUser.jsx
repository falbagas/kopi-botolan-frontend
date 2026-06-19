import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { getAllUser, createUser, updateUser, toggleAktif, resetPassword } from '../api/user.api'
import { getKoperasi } from '../api/koperasi.api'

const roleColor = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAJER: 'bg-blue-100 text-blue-700',
  KOPERASI: 'bg-amber-100 text-amber-700',
}

const roleLabel = {
  ADMIN: 'Admin',
  MANAJER: 'Manajer',
  KOPERASI: 'Koperasi',
}

const ManajemenUser = () => {
  const [userList, setUserList] = useState([])
  const [koperasiList, setKoperasiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showResetModal, setShowResetModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'MANAJER', koperasiId: ''
  })

  const fetchData = async () => {
    try {
      const [userRes, kopRes] = await Promise.all([getAllUser(), getKoperasi()])
      setUserList(userRes.data)
      setKoperasiList(kopRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleEdit = (user) => {
    setEditUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      koperasiId: user.koperasiId || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (editUser) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await updateUser(editUser.id, payload)
        setSuccess('User berhasil diupdate!')
      } else {
        await createUser(form)
        setSuccess('User berhasil dibuat!')
      }
      setForm({ name: '', email: '', password: '', role: 'MANAJER', koperasiId: '' })
      setEditUser(null)
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id, nama, isActive) => {
    if (!confirm(`${isActive ? 'Nonaktifkan' : 'Aktifkan'} user ${nama}?`)) return
    try {
      await toggleAktif(id)
      setSuccess(`User berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchData()
    } catch (err) {
      setError('Gagal mengubah status user')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword) return setError('Password baru wajib diisi')
    try {
      await resetPassword(showResetModal.id, { password: newPassword })
      setSuccess(`Password ${showResetModal.name} berhasil direset!`)
      setShowResetModal(null)
      setNewPassword('')
    } catch (err) {
      setError('Gagal reset password')
    }
  }

  const formatTanggal = (val) => new Date(val).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar title="Manajemen User" />
        <main className="flex-1 p-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Manajemen User</h2>
              <p className="text-sm text-gray-500">Kelola akun dan hak akses pengguna</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'MANAJER', koperasiId: '' }) }}
              className="bg-amber-400 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-300">
              {showForm ? 'Batal' : '+ Tambah User'}
            </button>
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* Form tambah/edit user */}
          {showForm && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editUser ? `Edit User — ${editUser.name}` : 'Tambah User Baru'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nama lengkap *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required placeholder="cth: Budi Santoso"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required placeholder="cth: budi@email.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Password {editUser ? '(kosongkan jika tidak diubah)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required={!editUser}
                      placeholder={editUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role *</label>
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value, koperasiId: '' }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                      <option value="ADMIN">Admin — akses penuh</option>
                      <option value="MANAJER">Manajer — lihat semua laporan</option>
                      <option value="KOPERASI">Koperasi — hanya data koperasi sendiri</option>
                    </select>
                  </div>
                  {form.role === 'KOPERASI' && (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Koperasi yang ditugaskan *</label>
                      <select
                        value={form.koperasiId}
                        onChange={e => setForm(f => ({ ...f, koperasiId: e.target.value }))}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                        <option value="">Pilih koperasi...</option>
                        {koperasiList.map(k => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Info role */}
                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-xs text-gray-500">
                  {form.role === 'ADMIN' && '👑 Admin dapat mengakses dan mengubah semua data di seluruh sistem.'}
                  {form.role === 'MANAJER' && '📊 Manajer dapat melihat semua laporan dan data, tapi tidak bisa menghapus.'}
                  {form.role === 'KOPERASI' && '🏪 User Koperasi hanya bisa melihat dan input data koperasi yang ditugaskan.'}
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300 disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : editUser ? 'Update User' : 'Buat User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabel user */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400">Memuat data...</div>
            ) : userList.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Belum ada user</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Nama</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Koperasi</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map(user => (
                    <tr key={user.id} className={`border-t border-gray-100 hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[user.role]}`}>
                          {roleLabel[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {user.koperasi?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatTanggal(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleEdit(user)}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                            Edit
                          </button>
                          <button onClick={() => setShowResetModal(user)}
                            className="text-xs px-2 py-1 border border-blue-100 rounded-lg text-blue-500 hover:bg-blue-50">
                            Reset PW
                          </button>
                          <button onClick={() => handleToggle(user.id, user.name, user.isActive)}
                            className={`text-xs px-2 py-1 border rounded-lg ${user.isActive ? 'border-red-100 text-red-400 hover:bg-red-50' : 'border-green-100 text-green-500 hover:bg-green-50'}`}>
                            {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </main>
      </div>

      {/* Modal reset password */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 mb-4">Reset password untuk <strong>{showResetModal.name}</strong></p>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Password baru *</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowResetModal(null); setNewPassword('') }}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">Batal</button>
              <button onClick={handleResetPassword}
                className="px-4 py-2 text-sm font-medium bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-300">
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ManajemenUser