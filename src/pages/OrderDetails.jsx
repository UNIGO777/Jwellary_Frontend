import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, ordersService, paymentsService } from '../services/index.js'
import { formatInr } from './products.data.js'

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

  const [paymentStatus, setPaymentStatus] = useState('succeeded')
  const [transactionId, setTransactionId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const payment = order?.payment && typeof order.payment === 'object' ? order.payment : null
  const paymentId = payment?._id || payment?.id || ''

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
      setMessage('')
    })
    ordersService
      .getById(orderId)
      .then((res) => {
        if (!alive) return
        setOrder(res?.data || null)
        const p = res?.data?.payment
        if (p && typeof p === 'object') {
          if (p.status) setPaymentStatus(String(p.status))
          if (p.transactionId) setTransactionId(String(p.transactionId))
        }
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

  const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order?.items])
  const status = order?.status ? String(order.status) : 'pending'
  const createdAt = order?.createdAt ? formatDate(order.createdAt) : ''

  const updatePayment = async () => {
    if (!paymentId) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await paymentsService.setStatus(paymentId, { status: paymentStatus, transactionId: transactionId.trim(), meta: {} })
      setMessage('Payment updated')
      const refreshed = await ordersService.getById(orderId)
      setOrder(refreshed?.data || null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/auth')
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

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
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm text-zinc-700">Loading...</div>
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
                    <>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between text-zinc-700">
                          <span>Provider</span>
                          <span className="font-semibold text-zinc-900">{payment.provider}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-700">
                          <span>Method</span>
                          <span className="font-semibold text-zinc-900">{payment.method}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-700">
                          <span>Status</span>
                          <span className="font-semibold text-zinc-900">{payment.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-700">
                          <span>Amount</span>
                          <span className="font-semibold text-zinc-900">{formatInr(payment.amount)}</span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4">
                        <div className="text-xs font-semibold text-zinc-900">Update payment status</div>
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-zinc-600">Status</div>
                            <select
                              value={paymentStatus}
                              onChange={(e) => setPaymentStatus(e.target.value)}
                              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none hover:bg-white"
                            >
                              {['created', 'authorized', 'captured', 'failed', 'refunded', 'succeeded'].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-600">Transaction id (optional)</div>
                            <input
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                              placeholder="TXN123"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void updatePayment()}
                            disabled={busy}
                            className={cn(
                              'w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                              busy ? 'cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-[#2b2118] text-white hover:bg-[#1f1711]'
                            )}
                          >
                            {busy ? 'Updating...' : 'Update payment'}
                          </button>
                        </div>
                      </div>
                    </>
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
