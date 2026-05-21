import useAuth from '../hooks/useAuth'

const Topbar = ({ title }) => {
  const { user } = useAuth()

  return (
    <div className="h-12 bg-[#1a1a2e] flex items-center justify-between px-6 shrink-0">
      <span className="text-sm font-medium text-white">{title}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{user?.name}</span>
        <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs font-medium text-[#1a1a2e]">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

export default Topbar