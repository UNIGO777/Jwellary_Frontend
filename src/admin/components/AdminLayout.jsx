import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { adminAuthService, adminTokenStore } from '../../services/index.js'

export default function AdminLayout() {
  const navigate = useNavigate()

  if (!adminTokenStore.get()) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen w-full bg-[#fbf7f3]">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <AdminSidebar
          onLogout={() => {
            adminAuthService.logout()
            navigate('/admin/login', { replace: true })
          }}
        />
        <main className="min-w-0 flex-1 px-4 py-3 sm:px-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
