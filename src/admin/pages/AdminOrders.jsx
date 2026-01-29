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

export default function AdminOrders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [busyId, setBusyId] = useState('')

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
            _uiStatus: o?.status ? String(o.status) : 'pending'
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

  const saveStatus = async (id) => {
    const row = rows.find((r) => String(r?._id || r?.id) === String(id))
    if (!row) return
    const status = row?._uiStatus || row?.status || 'pending'
    setBusyId(String(id))
    setError('')
    try {
      await api.patch(`/api/orders/${id}/status`, withAdminAuth({ body: { status } }))
      setRows((prev) => prev.map((r) => (String(r?._id || r?.id) === String(id) ? { ...r, status } : r)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId('')
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
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-stone-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-stone-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                rows.map((o) => {
                  const id = o?._id || o?.id
                  const customer = o?.user?.email || o?.customerEmail || '-'
                  const total = Number(o?.total || 0)
                  const current = o?._uiStatus || (o?.status ? String(o.status) : 'pending')
                  const dirty = current !== (o?.status ? String(o.status) : 'pending')
                  const busy = String(busyId) === String(id)
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm font-semibold text-stone-900">#{shortId(id)}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{customer}</td>
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
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => void saveStatus(id)}
                          disabled={!dirty || busy}
                          className={cn(
                            'rounded-md px-4 py-2 text-sm font-semibold',
                            !dirty || busy ? 'cursor-not-allowed bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'
                          )}
                        >
                          {busy ? 'Saving...' : 'Save'}
                        </button>
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

