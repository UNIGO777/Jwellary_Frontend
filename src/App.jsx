import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Products from './pages/Products.jsx'
import Product from './pages/Product.jsx'
import BestSellers from './pages/BestSellers.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import About from './pages/About.jsx'
import Profile from './pages/Profile.jsx'
import Orders from './pages/Orders.jsx'
import OrderDetails from './pages/OrderDetails.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminRoutes from './admin/index.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import { tokenStore } from './services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

function App() {
  const location = useLocation()
  const isAuth = location.pathname.startsWith('/auth') || location.pathname.startsWith('/admin')
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#fbf7f3] text-zinc-900">
      {!isAuth && <Navbar key={location.pathname} isHome={isHome} />}

      <main className={cn(!isAuth ? (isHome ? '' : 'pt-20') : '')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:categorySlug" element={<Products />} />
          <Route path="/products/category/:categorySlug/:subCategorySlug" element={<Products />} />
          <Route path="/bestsellers" element={<BestSellers />} />
          <Route path="/products/:productId" element={<Product />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={tokenStore.get() ? <Profile /> : <Navigate to="/auth" replace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAuth && <Footer />}
    </div>
  )
}

export default App
