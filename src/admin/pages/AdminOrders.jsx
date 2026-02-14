import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : '')

const STATUSES = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled']
const DELIVERY_STATUSES = ['pending', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled']

const clean = (value) => (value === undefined || value === null ? '' : String(value).trim())

const formatAddress = (addr) => {
  const a = addr && typeof addr === 'object' ? addr : null
  if (!a) return ''
  const parts = [clean(a.line1), clean(a.line2), clean(a.city), clean(a.state), clean(a.postalCode), clean(a.country)].filter(Boolean)
  return parts.join(', ')
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [busyKey, setBusyKey] = useState('')

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)

  useEffect(() => {
    let alive = true
    adminAuthService.me().catch((err) => {
      if (!alive) return
      if (err instanceof ApiError && err.status === 401) {
        adminAuthService.logout()
        navigate('/admin/login', { replace: true })
      }
    })
    return () => {
      alive = false
    }
  }, [navigate])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        const res = await api.get(`/api/orders/admin?${params.toString()}`, withAdminAuth())
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setRows(
          list.map((o) => ({
            ...o,
            _uiStatus: o?.status ? String(o.status) : 'pending',
            _uiDeliveryStatus: o?.delivery?.status ? String(o.delivery.status) : 'pending',
            _uiDeliveryProvider: o?.delivery?.provider ? String(o.delivery.provider) : '',
            _uiTrackingId: o?.delivery?.trackingId ? String(o.delivery.trackingId) : '',
            _uiTrackingUrl: o?.delivery?.trackingUrl ? String(o.delivery.trackingUrl) : ''
          }))
        )
        setTotal(Number(res?.total || 0))
      } catch (err) {
        if (!alive) return
        setError(getErrorMessage(err))
        setRows([])
        setTotal(0)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [limit, page])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [limit, total])

  const setParam = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSearchParams(next)
  }

  const setLocalStatus = (id, status) => {
    setRows((prev) => prev.map((r) => (String(r?._id || r?.id) === String(id) ? { ...r, _uiStatus: status } : r)))
  }

  const setLocalDelivery = (id, patch) => {
    setRows((prev) =>
      prev.map((r) => (String(r?._id || r?.id) === String(id) ? { ...r, ...(patch || {}) } : r))
    )
  }

  const saveStatus = async (id) => {
    const row = rows.find((r) => String(r?._id || r?.id) === String(id))
    if (!row) return
    const status = row?._uiStatus || row?.status || 'pending'
    setBusyKey(`${id}:status`)
    setError('')
    try {
      await api.patch(`/api/orders/${id}/status`, withAdminAuth({ body: { status } }))
      setRows((prev) => prev.map((r) => (String(r?._id || r?.id) === String(id) ? { ...r, status } : r)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyKey('')
    }
  }

  const saveDelivery = async (id) => {
    const row = rows.find((r) => String(r?._id || r?.id) === String(id))
    if (!row) return
    setBusyKey(`${id}:delivery`)
    setError('')
    try {
      const body = {
        status: row._uiDeliveryStatus || 'pending',
        provider: row._uiDeliveryProvider ? String(row._uiDeliveryProvider).trim() : '',
        trackingId: row._uiTrackingId ? String(row._uiTrackingId).trim() : '',
        trackingUrl: row._uiTrackingUrl ? String(row._uiTrackingUrl).trim() : ''
      }
      await api.patch(`/api/orders/${id}/delivery`, withAdminAuth({ body }))
      setRows((prev) =>
        prev.map((r) =>
          String(r?._id || r?.id) === String(id)
            ? {
                ...r,
                delivery: {
                  ...(r.delivery || {}),
                  status: body.status,
                  provider: body.provider || undefined,
                  trackingId: body.trackingId || undefined,
                  trackingUrl: body.trackingUrl || undefined
                }
              }
            : r
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-stone-900">Orders</h1>
        <p className="mt-1 text-stone-600">View and update order statuses</p>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Delivery</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-stone-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-stone-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                rows.map((o) => {
                  const id = o?._id || o?.id
                  const loginEmail = clean(o?.user?.email)
                  const deliveryEmail = clean(o?.customerEmail)
                  const phone = clean(o?.shippingAddress?.phone) || clean(o?.customerPhone)
                  const deliveryName = clean(o?.shippingAddress?.name)
                  const deliveryAddress = formatAddress(o?.shippingAddress)
                  const total = Number(o?.total || 0)
                  const current = o?._uiStatus || (o?.status ? String(o.status) : 'pending')
                  const dirtyStatus = current !== (o?.status ? String(o.status) : 'pending')
                  const uiDeliveryStatus = o?._uiDeliveryStatus || (o?.delivery?.status ? String(o.delivery.status) : 'pending')
                  const uiProvider = o?._uiDeliveryProvider ?? (o?.delivery?.provider ? String(o.delivery.provider) : '')
                  const uiTrackingId = o?._uiTrackingId ?? (o?.delivery?.trackingId ? String(o.delivery.trackingId) : '')
                  const uiTrackingUrl = o?._uiTrackingUrl ?? (o?.delivery?.trackingUrl ? String(o.delivery.trackingUrl) : '')
                  const dirtyDelivery =
                    uiDeliveryStatus !== (o?.delivery?.status ? String(o.delivery.status) : 'pending') ||
                    String(uiProvider || '') !== String(o?.delivery?.provider || '') ||
                    String(uiTrackingId || '') !== String(o?.delivery?.trackingId || '') ||
                    String(uiTrackingUrl || '') !== String(o?.delivery?.trackingUrl || '')
                  const busyStatus = busyKey === `${id}:status`
                  const busyDelivery = busyKey === `${id}:delivery`
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm font-semibold text-stone-900">#{shortId(id)}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">
                        <div className="min-w-[260px] space-y-1">
                          <div className="font-semibold text-stone-900">{deliveryName || '-'}</div>
                          {phone ? <div className="text-xs text-stone-600">{phone}</div> : null}
                          {deliveryAddress ? <div className="text-xs text-stone-600">{deliveryAddress}</div> : null}
                          <div className="pt-1 text-[11px] text-stone-500">
                            <div>Login: {loginEmail || '-'}</div>
                            <div>Delivery email: {deliveryEmail || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">{total}</td>
                      <td className="px-6 py-4">
                        <select
                          value={current}
                          onChange={(e) => setLocalStatus(id, e.target.value)}
                          className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={uiDeliveryStatus}
                            onChange={(e) => setLocalDelivery(id, { _uiDeliveryStatus: e.target.value })}
                            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
                          >
                            {DELIVERY_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <input
                            value={uiProvider}
                            onChange={(e) => setLocalDelivery(id, { _uiDeliveryProvider: e.target.value })}
                            placeholder="Courier"
                            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
                          />
                          <input
                            value={uiTrackingId}
                            onChange={(e) => setLocalDelivery(id, { _uiTrackingId: e.target.value })}
                            placeholder="Tracking id"
                            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
                          />
                          <input
                            value={uiTrackingUrl}
                            onChange={(e) => setLocalDelivery(id, { _uiTrackingUrl: e.target.value })}
                            placeholder="Tracking url"
                            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveStatus(id)}
                            disabled={!dirtyStatus || busyStatus}
                            className={cn(
                              'rounded-md px-4 py-2 text-sm font-semibold',
                              !dirtyStatus || busyStatus ? 'cursor-not-allowed bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'
                            )}
                          >
                            {busyStatus ? 'Saving...' : 'Save status'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveDelivery(id)}
                            disabled={!dirtyDelivery || busyDelivery}
                            className={cn(
                              'rounded-md px-4 py-2 text-sm font-semibold',
                              !dirtyDelivery || busyDelivery ? 'cursor-not-allowed bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'
                            )}
                          >
                            {busyDelivery ? 'Saving...' : 'Save delivery'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setParam({ page: Math.max(1, page - 1) })}
            disabled={page <= 1}
            className={cn(
              'rounded-md border px-4 py-2 text-sm font-semibold',
              page <= 1 ? 'cursor-not-allowed border-stone-200 bg-white text-stone-300' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            Prev
          </button>
          <div className="text-xs font-medium text-stone-500">
            Page {page} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setParam({ page: Math.min(totalPages, page + 1) })}
            disabled={page >= totalPages}
            className={cn(
              'rounded-md border px-4 py-2 text-sm font-semibold',
              page >= totalPages ? 'cursor-not-allowed border-stone-200 bg-white text-stone-300' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
