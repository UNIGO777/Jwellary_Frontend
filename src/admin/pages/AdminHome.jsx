import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService, adminTokenStore, api } from '../../services/index.js'
import AdminTopbar from '../components/AdminTopbar.jsx'

const MotionDiv = motion.div

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const cn = (...parts) => parts.filter(Boolean).join(' ')

const formatTodayLabel = () => {
  const d = new Date()
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : '')

const formatInr = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0)
}

const formatDateTime = (value) => {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [analyticsError, setAnalyticsError] = useState('')
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [data, setData] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    let alive = true
    adminAuthService
      .me()
      .then((res) => {
        if (!alive) return
        setAdminEmail(res?.data?.email || '')
      })
      .catch((err) => {
        if (!alive) return
        if (err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setError(getErrorMessage(err))
      })
    return () => {
      alive = false
    }
  }, [navigate])

  useEffect(() => {
    let alive = true
    const token = adminTokenStore.get()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const load = async () => {
      setLoadingAnalytics(true)
      setAnalyticsError('')
      try {
        const res = await api.get('/api/admin/analytics', { headers })
        if (!alive) return
        setData(res?.data || null)
      } catch (err) {
        if (!alive) return
        if (err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setAnalyticsError(getErrorMessage(err))
      } finally {
        if (alive) setLoadingAnalytics(false)
      }
    }

    load().catch((err) => {
      if (!alive) return
      setAnalyticsError(getErrorMessage(err))
      setLoadingAnalytics(false)
    })

    return () => {
      alive = false
    }
  }, [navigate])

  const displayName = adminEmail ? adminEmail.split('@')[0] : 'Admin'
  const totals = data?.totals || {}
  const usersTotal = Number.isFinite(Number(totals?.users)) ? Number(totals.users) : 0
  const ordersTotal = Number.isFinite(Number(totals?.orders)) ? Number(totals.orders) : 0
  const productsTotal = Number.isFinite(Number(totals?.products)) ? Number(totals.products) : 0
  const categoriesTotal = Number.isFinite(Number(totals?.categories)) ? Number(totals.categories) : 0

  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : []
  const recentOrders = Array.isArray(data?.recentOrders) ? data.recentOrders : []
  const lowStock = Array.isArray(data?.lowStock) ? data.lowStock : []

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="rounded-none border-0 bg-transparent px-0 py-0 shadow-none">
        <AdminTopbar
          sectionLabel="Dashboard"
          title={`Good morning, ${displayName}`}
          subtitle={formatTodayLabel()}
          searchPlaceholder="Search"
          adminEmail={adminEmail}
        />

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
        ) : null}

        {analyticsError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{analyticsError}</div>
        ) : null}

        <div className="mt-6 flex min-w-0 flex-col gap-5 xl:flex-row">
          <div className="grid min-w-0 flex-1 gap-5 overflow-x-hidden">
            <div className="relative isolate min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b2118] via-[#3a2a1f] to-[#6b4b3a] px-6 py-6 text-white sm:px-7">
              <div className="relative z-10 max-w-[420px]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Welcome back</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Manage your store in one place</div>
                <div className="mt-2 text-sm font-semibold text-white/80">
                {loadingAnalytics ? 'Loading insights…' : 'Track orders, customers, products, and inventory health.'}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className="h-11 rounded-full bg-white px-5 text-sm font-extrabold text-[#2b2118] hover:bg-white/90"
                >
                  View orders
                  </button>
                  <button
                    type="button"
                  onClick={() => navigate('/admin/products')}
                  className="h-11 rounded-full border border-white/35 bg-white/10 px-5 text-sm font-extrabold text-white hover:bg-white/15"
                  >
                  View products
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-8 bottom-0 z-0 hidden h-[210px] w-[260px] sm:block">
                <svg viewBox="0 0 260 210" className="h-full w-full" fill="none" aria-hidden="true">
                  <path d="M184 178c-12 16-40 28-66 22-30-6-44-34-38-60 6-28 34-50 64-46 30 4 56 36 40 84Z" fill="rgba(255,255,255,0.22)" />
                  <path d="M208 58c-12 14-34 20-52 16-18-4-28-20-24-38 4-18 22-32 42-30 20 2 44 18 34 52Z" fill="rgba(255,255,255,0.18)" />
                  <path d="M58 74c-14 18-34 26-46 24-10-2-16-12-14-24 2-14 14-30 30-34 18-4 44 8 30 34Z" fill="rgba(255,255,255,0.14)" />
                  <path
                    d="M155 166c-8 10-22 18-37 16-16-2-25-18-21-34 4-18 18-30 36-28 18 2 34 18 22 46Z"
                    fill="rgba(255,255,255,0.28)"
                  />
                  <path d="M122 104c12 0 22-10 22-22s-10-22-22-22-22 10-22 22 10 22 22 22Z" fill="rgba(255,255,255,0.23)" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Users', value: loadingAnalytics ? '...' : String(usersTotal), tone: 'bg-white border-zinc-200' },
                { label: 'Orders', value: loadingAnalytics ? '...' : String(ordersTotal), tone: 'bg-white border-zinc-200' },
                { label: 'Products', value: loadingAnalytics ? '...' : String(productsTotal), tone: 'bg-white border-zinc-200' },
                { label: 'Categories', value: loadingAnalytics ? '...' : String(categoriesTotal), tone: 'bg-white border-zinc-200' }
              ].map((card) => (
                <div key={card.label} className={cn('rounded-3xl border p-5', card.tone)}>
                  <div className="text-xs font-semibold text-slate-500">{card.label}</div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Top Products</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">By quantity sold</div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[1.4fr_0.6fr_0.8fr] gap-3 bg-[#fbf7f3] px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <div>Product</div>
                      <div>Qty</div>
                      <div>Revenue</div>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {loadingAnalytics ? (
                        <div className="px-4 py-4 text-sm font-semibold text-slate-500">Loading...</div>
                      ) : topProducts.length === 0 ? (
                        <div className="px-4 py-4 text-sm font-semibold text-slate-500">No sales data yet.</div>
                      ) : (
                        topProducts.slice(0, 8).map((p, idx) => (
                          <div key={String(p?._id || idx)} className="grid grid-cols-[1.4fr_0.6fr_0.8fr] items-center gap-3 px-4 py-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-extrabold text-slate-900">{p?.name || '-'}</div>
                              <div className="truncate text-xs font-semibold text-slate-500">#{String(p?._id || '').slice(-6)}</div>
                            </div>
                            <div className="text-sm font-semibold text-slate-700">{Number(p?.qty || 0)}</div>
                            <div className="text-sm font-semibold text-slate-700">{formatInr(p?.revenue || 0)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 w-full shrink-0 gap-5 xl:w-[420px]">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Recent Orders</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Latest activity</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className="h-9 rounded-full bg-[#2b2118] px-4 text-xs font-extrabold text-white hover:bg-[#1f1711]"
                >
                  View
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {loadingAnalytics ? (
                  <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500">Loading...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500">No orders yet.</div>
                ) : (
                  recentOrders.slice(0, 6).map((o) => (
                    <div key={String(o?._id)} className="rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-slate-900">#{shortId(o?._id)}</div>
                          <div className="truncate text-xs font-semibold text-slate-500">
                            {o?.customerName || o?.customerEmail || '-'} • {formatDateTime(o?.createdAt)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-extrabold text-slate-900">{formatInr(o?.total || 0)}</div>
                          <div className="text-[11px] font-semibold text-slate-500">{String(o?.status || 'pending')}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Low Stock</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Products with stock ≤ 3</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="h-9 rounded-full bg-[#fbf7f3] px-4 text-xs font-extrabold text-[#2b2118] hover:bg-[#f3ece6]"
                >
                  Inventory
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {loadingAnalytics ? (
                  <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500">Loading...</div>
                ) : lowStock.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500">No low-stock products.</div>
                ) : (
                  lowStock.slice(0, 8).map((p, idx) => (
                    <div key={String(p?._id || idx)} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-slate-900">{p?.name || '-'}</div>
                        <div className="truncate text-xs font-semibold text-slate-500">#{String(p?._id || '').slice(-6)}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-extrabold text-slate-900">{Number(p?.minStock || 0)}</div>
                        <div className="text-[11px] font-semibold text-slate-500">in stock</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
