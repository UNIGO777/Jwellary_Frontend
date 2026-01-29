import { Outlet, Navigate } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { adminTokenStore } from '../../services/index.js'

export default function AdminLayout() {
  if (!adminTokenStore.get()) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen w-full bg-[#fbf7f3]">
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
