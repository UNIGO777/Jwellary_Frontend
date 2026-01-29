import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Heart, ShoppingBag, User } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function Navbar({ isHome }) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerSolid = !isHome || scrolled || mobileNavOpen

  useEffect(() => {
    if (!mobileNavOpen) return
    const id = window.setTimeout(() => setMobileNavOpen(false), 0)
    return () => window.clearTimeout(id)
  }, [location.pathname, mobileNavOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  const navLinkClass = ({ isActive }) =>
    cn(
      'inline-flex items-center px-3 py-2 text-sm font-semibold transition-colors',
      headerSolid
        ? isActive
          ? 'text-[#2b2118]'
          : 'text-zinc-700 hover:text-[#2b2118]'
        : isActive
          ? 'text-white'
          : 'text-white/85 hover:text-white'
    )

  const iconLinkClass = ({ isActive }) =>
    cn(
      'grid h-10 w-10 place-items-center rounded-full transition-colors',
      headerSolid
        ? isActive
          ? 'bg-[#fbf7f3] text-[#2b2118]'
          : 'text-zinc-700 hover:bg-[#fbf7f3] hover:text-[#2b2118]'
        : isActive
          ? 'bg-white/15 text-white'
          : 'text-white/90 hover:bg-white/15 hover:text-white'
    )

  const navLinkClassMobile = ({ isActive }) =>
    cn(
      'block px-3 py-2 text-sm font-semibold transition-colors',
      isActive ? 'bg-[#2b2118] text-white' : 'text-zinc-800 hover:bg-[#fbf7f3]'
    )

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300',
        headerSolid ? 'border-zinc-200 bg-white/85 text-zinc-900 backdrop-blur' : 'border-transparent bg-transparent text-white'
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-3 py-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          className={cn('text-sm font-semibold tracking-wide', headerSolid ? 'text-[#2b2118]' : 'text-white')}
          onClick={() => setMobileNavOpen(false)}
          end
        >
          EWITH JWELLARY
        </NavLink>

        <nav className="hidden items-center gap-2 sm:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <div className="ml-2 flex items-center gap-1">
            <NavLink to="/wishlist" className={iconLinkClass} aria-label="Wishlist">
              <Heart className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            </NavLink>
            <NavLink to="/cart" className={iconLinkClass} aria-label="Cart">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            </NavLink>
            <NavLink to="/auth" className={iconLinkClass} aria-label="Login">
              <User className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            </NavLink>
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className={cn(
            'grid h-10 w-10 place-items-center border text-zinc-700 transition-colors sm:hidden',
            headerSolid ? 'border-zinc-200 bg-white hover:bg-zinc-50' : 'border-white/25 bg-white/10 text-white hover:bg-white/15'
          )}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            {mobileNavOpen ? (
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileNavOpen ? (
        <div className="border-t border-zinc-200 bg-white sm:hidden">
          <div className="mx-auto max-w-screen-2xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="grid gap-2 text-sm">
              <NavLink to="/" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)} end>
                Home
              </NavLink>
              <NavLink to="/products" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                Products
              </NavLink>
              <NavLink to="/about" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                About
              </NavLink>
              <NavLink to="/wishlist" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                Wishlist
              </NavLink>
              <NavLink to="/cart" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                Cart
              </NavLink>
              <NavLink to="/auth" className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                Auth
              </NavLink>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
}
