import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef } from 'react'
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
import Shipping from './pages/Shipping.jsx'
import Faq from './pages/Faq.jsx'
import Care from './pages/Care.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminRoutes from './admin/index.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import { tokenStore } from './services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

function App() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const lastLocationKeyRef = useRef('')
  const isAuth = location.pathname.startsWith('/auth') || location.pathname.startsWith('/admin')
  const isHome = location.pathname === '/'

  useEffect(() => {
    const lastKey = lastLocationKeyRef.current
    if (lastKey) {
      sessionStorage.setItem(`scroll:${lastKey}`, String(window.scrollY || 0))
    }
    lastLocationKeyRef.current = location.key
  }, [location.key])

  useLayoutEffect(() => {
    const y = sessionStorage.getItem(`scroll:${location.key}`)
    if (navigationType === 'POP' && y !== null) {
      const next = Number(y)
      window.scrollTo(0, Number.isFinite(next) ? next : 0)
      return
    }
    window.scrollTo(0, 0)
  }, [location.key, navigationType])

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf7f3] text-zinc-900">
      {!isAuth && <Navbar isHome={isHome} />}

      <main className={cn('flex-1', !isAuth ? (isHome ? '' : 'pt-20') : '')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:categorySlug" element={<Products />} />
          <Route path="/products/category/:categorySlug/:subCategorySlug" element={<Products />} />
          <Route path="/bestsellers" element={<BestSellers />} />
          <Route path="/products/:productId/:productName" element={<Product />} />
          <Route path="/products/:productSlug" element={<Product />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={tokenStore.get() ? <Profile /> : <Navigate to="/auth" replace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/care" element={<Care />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
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
