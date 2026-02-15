import { Link, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Heart, ShoppingBag, User } from 'lucide-react'
import { ApiError, cartService, categoriesService, subcategoriesService, tokenStore, wishlistStore } from '../services/index.js'
import Logo from '../assets/logo.png'

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function Navbar({ isHome }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => (typeof window !== 'undefined' ? window.scrollY > 24 : false))
  const headerSolid = !isHome || scrolled || mobileNavOpen
  const isAuthed = Boolean(tokenStore.get())
  const [wishlistCount, setWishlistCount] = useState(() => wishlistStore.getIds().length)
  const [cartCount, setCartCount] = useState(0)

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [categoryGroups, setCategoryGroups] = useState([])
  const [activeCategoryId, setActiveCategoryId] = useState('')
  const [catsError, setCatsError] = useState('')
  const categoryMenuRef = useRef(null)
  const categoryButtonRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let alive = true

    const refreshWishlist = () => {
      if (!alive) return
      setWishlistCount(wishlistStore.getIds().length)
    }

    const refreshCart = async () => {
      if (!alive) return
      if (!tokenStore.get()) {
        setCartCount(0)
        return
      }
      try {
        const res = await cartService.list()
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setCartCount(list.length)
      } catch (err) {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) setCartCount(0)
        else setCartCount(0)
      }
    }

    refreshWishlist()
    void refreshCart()

    const onWishlistChanged = () => refreshWishlist()
    const onCartChanged = () => void refreshCart()
    const onAuthChanged = () => void refreshCart()

    window.addEventListener('shop:wishlist:changed', onWishlistChanged)
    window.addEventListener('shop:cart:changed', onCartChanged)
    window.addEventListener('shop:auth:changed', onAuthChanged)

    return () => {
      alive = false
      window.removeEventListener('shop:wishlist:changed', onWishlistChanged)
      window.removeEventListener('shop:cart:changed', onCartChanged)
      window.removeEventListener('shop:auth:changed', onAuthChanged)
    }
  }, [])

  useEffect(() => {
    if (!categoryMenuOpen) return
    const onDocPointerDown = (e) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (categoryMenuRef.current && categoryMenuRef.current.contains(target)) return
      if (categoryButtonRef.current && categoryButtonRef.current.contains(target)) return
      setCategoryMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setCategoryMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [categoryMenuOpen])

  useEffect(() => {
    let alive = true
    Promise.all([
      categoriesService.list({ page: 1, limit: 200, isActive: true }),
      subcategoriesService.list({ page: 1, limit: 500, isActive: true })
    ])
      .then(([cRes, sRes]) => {
        if (!alive) return
        setCatsError('')
        const categories = Array.isArray(cRes?.data) ? cRes.data : []
        const subcategories = Array.isArray(sRes?.data) ? sRes.data : []

        const subByCategory = new Map()
        for (const sc of subcategories) {
          const key = sc?.category ? String(sc.category) : ''
          if (!key) continue
          const list = subByCategory.get(key) || []
          list.push(sc)
          subByCategory.set(key, list)
        }

        const groups = categories
          .map((c) => {
            const id = c?._id ? String(c._id) : ''
            if (!id) return null
            const subs = subByCategory.get(id) || []
            if (!subs.length) return null
            const nextSubs = subs
              .slice()
              .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
              .map((s) => ({
                _id: s?._id ? String(s._id) : '',
                name: s?.name ? String(s.name) : '',
                slug: s?.slug ? String(s.slug) : ''
              }))
              .filter((s) => s._id && s.name)
            if (!nextSubs.length) return null
            return {
              category: {
                _id: id,
                name: c?.name ? String(c.name) : '',
                slug: c?.slug ? String(c.slug) : ''
              },
              subcategories: nextSubs
            }
          })
          .filter(Boolean)
          .sort((a, b) => String(a.category?.name || '').localeCompare(String(b.category?.name || '')))

        setCategoryGroups(groups)
        const first = groups[0]?.category?._id || ''
        setActiveCategoryId((prev) => (prev && groups.some((g) => g.category?._id === prev) ? prev : first))
      })
      .catch((err) => {
        if (!alive) return
        const message = err?.message ? String(err.message) : 'Failed to load categories'
        setCatsError(message)
      })
    return () => {
      alive = false
    }
  }, [])

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
      'relative grid h-10 w-10 place-items-center rounded-full transition-colors',
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

  const activeGroup = categoryGroups.find((g) => g.category?._id === activeCategoryId) || categoryGroups[0]

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300',
        headerSolid ? 'border-zinc-200 bg-white text-zinc-900 backdrop-blur' : 'border-transparent bg-transparent text-white'
      )}
    >
      <div className="mx-auto flex items-center justify-between gap-4 px-3 py-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          className={cn('text-sm font-semibold tracking-wide', headerSolid ? 'text-[#2b2118]' : 'text-white')}
          onClick={() => setMobileNavOpen(false)}
          end
        >
          <div className='flex items-center gap-2'><img src={Logo} className='w-10 '/> Om Abhushan</div>
        </NavLink>

        <nav className="hidden items-center gap-2 sm:flex">
          <div
            className="relative"
          >
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((v) => !v)}
              ref={categoryButtonRef}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors',
                headerSolid
                  ? 'text-zinc-700 hover:text-[#2b2118]'
                  : 'text-white/85 hover:text-white'
              )}
              aria-expanded={categoryMenuOpen}
              aria-haspopup="menu"
            >
              <span>Shop by Category</span>
              <svg viewBox="0 0 24 24" className={cn('h-4 w-4 transition-transform', categoryMenuOpen ? 'rotate-180' : '')} fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {categoryMenuOpen ? (
              <div
                ref={categoryMenuRef}
                className="absolute left-1/2 top-full z-50 mt-4 w-[860px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
              >
                <div className="grid grid-cols-12">
                  <div className="col-span-4 border-r border-zinc-100 bg-zinc-50/70">
                    <div className="p-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Categories</div>
                    <div className="max-h-[360px] overflow-auto p-2 ">
                      {categoryGroups.length ? (
                        categoryGroups.map((g) => (
                          <button
                            key={g.category._id}
                            type="button"
                            onClick={() => setActiveCategoryId(g.category._id)}
                            onFocus={() => setActiveCategoryId(g.category._id)}
                            className={cn(
                              'flex w-full items-center mb-1 justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
                              activeCategoryId === g.category._id ? 'bg-black/10 text-[#2b2118] ' : 'text-zinc-700 hover:bg-black/10'
                            )}
                          >
                            <span className="truncate">{g.category.name}</span>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" aria-hidden="true">
                              <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-zinc-500">{catsError ? catsError : 'No categories yet.'}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-8">
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 p-4">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Shop</div>
                        <div className="mt-1 truncate text-lg font-semibold text-zinc-900">{activeGroup?.category?.name || 'Category'}</div>
                      </div>
                      {activeGroup?.category?._id ? (
                        <Link
                          to={
                            activeGroup?.category?.slug
                              ? `/products/category/${encodeURIComponent(activeGroup.category.slug)}`
                              : `/products?categoryId=${encodeURIComponent(activeGroup.category._id)}`
                          }
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          onClick={() => setCategoryMenuOpen(false)}
                        >
                          View all
                        </Link>
                      ) : null}
                    </div>

                    <div className="max-h-[360px] overflow-auto p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {(activeGroup?.subcategories || []).map((sc) => (
                          <Link
                            key={sc._id}
                            to={
                              activeGroup?.category?.slug && sc?.slug
                                ? `/products/category/${encodeURIComponent(activeGroup.category.slug)}/${encodeURIComponent(sc.slug)}`
                                : `/products?categoryId=${encodeURIComponent(activeGroup.category._id)}&subCategoryId=${encodeURIComponent(sc._id)}`
                            }
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-[#fbf7f3]"
                            onClick={() => setCategoryMenuOpen(false)}
                          >
                            {sc.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <NavLink to="/" className={navLinkClass} end onClick={() => setCategoryMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass} onClick={() => setCategoryMenuOpen(false)}>
            Products
          </NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={() => setCategoryMenuOpen(false)}>
            About
          </NavLink>
          <div className="ml-2 flex items-center gap-1">
            <NavLink to="/wishlist" className={iconLinkClass} aria-label="Wishlist" onClick={() => setCategoryMenuOpen(false)}>
              <Heart className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#2b2118] px-1 text-[11px] font-bold leading-none text-white">
                  {wishlistCount > 99 ? '99+' : String(wishlistCount)}
                </span>
              ) : null}
            </NavLink>
            <NavLink to="/cart" className={iconLinkClass} aria-label="Cart" onClick={() => setCategoryMenuOpen(false)}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#2b2118] px-1 text-[11px] font-bold leading-none text-white">
                  {cartCount > 99 ? '99+' : String(cartCount)}
                </span>
              ) : null}
            </NavLink>
            <NavLink
              to={isAuthed ? '/profile' : '/auth'}
              className={iconLinkClass}
              aria-label={isAuthed ? 'Profile' : 'Login'}
              onClick={() => setCategoryMenuOpen(false)}
            >
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
          <div className="mx-auto   px-4 py-3 sm:px-6 lg:px-8">
            <nav className="grid gap-2 text-sm">
              {categoryGroups.length ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Shop by category</div>
                  <div className="mt-3 grid gap-2">
                    {categoryGroups.map((g) => (
                      <details key={g.category._id} className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate">{g.category.name}</span>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" aria-hidden="true">
                              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </summary>
                        <div className="mt-2 grid gap-2 pb-1">
                          {g.subcategories.map((sc) => (
                            <Link
                              key={sc._id}
                              to={
                                g?.category?.slug && sc?.slug
                                  ? `/products/category/${encodeURIComponent(g.category.slug)}/${encodeURIComponent(sc.slug)}`
                                  : `/products?categoryId=${encodeURIComponent(g.category._id)}&subCategoryId=${encodeURIComponent(sc._id)}`
                              }
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                              onClick={() => setMobileNavOpen(false)}
                            >
                              {sc.name}
                            </Link>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ) : null}

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
              <NavLink to={isAuthed ? '/profile' : '/auth'} className={navLinkClassMobile} onClick={() => setMobileNavOpen(false)}>
                {isAuthed ? 'Profile' : 'Login / Signup'}
              </NavLink>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
}
