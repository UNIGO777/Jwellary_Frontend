import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

export default function OrderDetails() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const payment = order?.payment && typeof order.payment === 'object' ? order.payment : null
  const delivery = order?.delivery && typeof order.delivery === 'object' ? order.delivery : null

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })
    ordersService
      .getById(orderId)
      .then((res) => {
        if (!alive) return
        setOrder(res?.data || null)
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/auth')
          return
        }
        setError(getErrorMessage(err))
        setOrder(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [navigate, orderId])

  const items = Array.isArray(order?.items) ? order.items : []
  const status = order?.status ? String(order.status) : 'pending'
  const createdAt = order?.createdAt ? formatDate(order.createdAt) : ''

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Order #{shortId(orderId)}</div>
              <div className="mt-1 text-xs text-zinc-500">{createdAt}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/orders" className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                Back
              </Link>
              <Link to="/products" className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]">
                Shop
              </Link>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

          {loading ? (
            <div className="mt-6">
              <PageLoader />
            </div>
          ) : !order ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm font-semibold text-zinc-900">Order not found</div>
              <div className="mt-5">
                <Link to="/orders" className="inline-flex rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                  Back to orders
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="lg:col-span-7">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-zinc-900">Items</div>
                    <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700">{status}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {items.map((it, idx) => (
                      <div key={`${it.product}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">{it.name}</div>
                            <div className="mt-1 text-xs text-zinc-500">
                              Qty: {it.quantity} • Unit: {formatInr(it.price)}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-zinc-900">{formatInr(Number(it.price || 0) * Number(it.quantity || 0))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Shipping</div>
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4 text-sm text-zinc-700">
                    <div className="font-semibold text-zinc-900">{order?.shippingAddress?.name || '-'}</div>
                    <div className="mt-1 text-xs text-zinc-600">{order?.shippingAddress?.phone || order?.customerPhone || ''}</div>
                    <div className="mt-3 text-sm text-zinc-700">
                      {(order?.shippingAddress?.line1 || '').trim()}
                      {order?.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {(order?.shippingAddress?.city || '').trim()}
                      {order?.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}
                      {order?.shippingAddress?.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}
                    </div>
                    <div className="mt-4 h-px bg-zinc-200" />
                    <div className="mt-4 text-xs font-semibold text-zinc-600">Parcel delivery</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        {delivery?.status ? String(delivery.status) : 'pending'}
                      </span>
                      {delivery?.provider ? <span className="text-sm font-semibold text-zinc-900">{String(delivery.provider)}</span> : null}
                      {delivery?.trackingId ? <span className="text-sm text-zinc-700">Tracking: {String(delivery.trackingId)}</span> : null}
                      {delivery?.trackingUrl ? (
                        <a
                          href={String(delivery.trackingUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#2b2118] hover:underline"
                        >
                          Track parcel
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="lg:col-span-5">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Summary</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Subtotal</span>
                      <span className="font-semibold text-zinc-900">{formatInr(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Discount</span>
                      <span className={cn('font-semibold', Number(order.discount || 0) > 0 ? 'text-emerald-700' : 'text-zinc-900')}>
                        {Number(order.discount || 0) > 0 ? `- ${formatInr(order.discount)}` : formatInr(0)}
                      </span>
                    </div>
                    <div className="h-px bg-zinc-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Total</span>
                      <span className="text-lg font-semibold text-zinc-900">{formatInr(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Payment</div>
                  {!payment ? (
                    <div className="mt-2 text-sm text-zinc-600">No payment linked yet.</div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4 text-sm text-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-600">Method</span>
                        <span className="font-semibold text-zinc-900">{String(payment.method || '').toLowerCase() === 'cod' ? 'Cash on delivery' : payment.method}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-600">Amount</span>
                        <span className="font-semibold text-zinc-900">{formatInr(payment.amount)}</span>
                      </div>
                      {String(payment.method || '').toLowerCase() === 'cod' ? (
                        <div className="mt-3 text-xs text-zinc-600">Pay when your order arrives.</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
