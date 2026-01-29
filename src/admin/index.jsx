import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminHome from './pages/AdminHome.jsx'
import AdminProducts from './pages/AdminProducts.jsx'
import AdminProductForm from './pages/AdminProductForm.jsx'
import AdminCategories from './pages/AdminCategories.jsx'
import AdminCategoryForm from './pages/AdminCategoryForm.jsx'
import AdminSubcategories from './pages/AdminSubcategories.jsx'
import AdminSubcategoryForm from './pages/AdminSubcategoryForm.jsx'
import AdminPromocodes from './pages/AdminPromocodes.jsx'
import AdminPromocodeForm from './pages/AdminPromocodeForm.jsx'
import AdminOrders from './pages/AdminOrders.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import { adminTokenStore } from '../services/index.js'

const RequireAdmin = ({ children }) => {
  const token = adminTokenStore.get()
  if (!token) return <Navigate to="login" replace />
  return children
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="categories/new" element={<AdminCategoryForm />} />
        <Route path="categories/:id" element={<AdminCategoryForm />} />
        <Route path="subcategories" element={<AdminSubcategories />} />
        <Route path="subcategories/new" element={<AdminSubcategoryForm />} />
        <Route path="subcategories/:id" element={<AdminSubcategoryForm />} />
        <Route path="promocodes" element={<AdminPromocodes />} />
        <Route path="promocodes/new" element={<AdminPromocodeForm />} />
        <Route path="promocodes/:id" element={<AdminPromocodeForm />} />
      </Route>

      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  )
}
