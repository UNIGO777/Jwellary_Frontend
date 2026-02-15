import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, ordersService } from '../services/index.js'
import { formatInr } from './products.data.js'
import PageLoader from '../components/PageLoader.jsx'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const formatDate = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : '')

export default function Orders() {
  const navigate = useNavigate()
  const location = useLocation()
  const justPlaced = location.state?.justPlaced ? String(location.state.justPlaced) : ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })
    ordersService
      .list({ page, limit: 20 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setOrders(list)
        const missingJustPlaced = Boolean(justPlaced) && !list.some((o) => String(o?._id || o?.id) === String(justPlaced))
        if (missingJustPlaced) {
          ordersService
            .getById(justPlaced)
            .then((one) => {
              if (!alive) return
              const order = one?.data
              const id = order?._id || order?.id
              if (!id) return
              setOrders((prev) => {
                const has = prev.some((o) => String(o?._id || o?.id) === String(id))
                return has ? prev : [order, ...prev]
              })
            })
            .catch(() => {})
        }
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/auth')
          return
        }
        setError(getErrorMessage(err))
        setOrders([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [navigate, page, justPlaced])

  const empty = !loading && orders.length === 0

  const hasJustPlaced = useMemo(() => Boolean(justPlaced && orders.some((o) => String(o?._id || o?.id) === justPlaced)), [justPlaced, orders])

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto  px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Orders</div>
              <div className="mt-1 text-xs text-zinc-500">Track your recent purchases</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/profile" className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                Profile
              </Link>
              <Link to="/products" className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]">
                Shop
              </Link>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          {hasJustPlaced ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Order placed successfully
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6">
              <PageLoader />
            </div>
          ) : empty ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm font-semibold text-zinc-900">No orders yet</div>
              <div className="mt-2 text-sm text-zinc-600">Once you place an order, it will show up here.</div>
              <div className="mt-5">
                <Link to="/products" className="inline-flex rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((o) => {
                const id = o?._id || o?.id
                const status = o?.status ? String(o.status) : 'pending'
                const total = Number(o?.total || 0)
                const createdAt = o?.createdAt || ''
                const items = Array.isArray(o?.items) ? o.items : []
                const isNew = justPlaced && String(id) === justPlaced

                return (
                  <Link
                    key={String(id)}
                    to={`/orders/${id}`}
                    className={cn(
                      'block rounded-3xl border bg-white p-5 transition hover:bg-[#fbf7f3] sm:p-6',
                      isNew ? 'border-emerald-200' : 'border-zinc-200'
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-zinc-900">Order #{shortId(id)}</div>
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                            {status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{createdAt ? formatDate(createdAt) : ''}</div>
                        <div className="mt-3 text-sm text-zinc-700">
                          {items.length} items • <span className="font-semibold text-zinc-900">{formatInr(total)}</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#2b2118]">View</div>
                    </div>
                  </Link>
                )
              })}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                    page <= 1 ? 'cursor-not-allowed border-zinc-200 bg-white text-zinc-300' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                  )}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <div className="text-xs font-medium text-zinc-500">Page {page}</div>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
