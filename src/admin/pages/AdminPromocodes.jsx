import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'
import AdminTopbar from '../components/AdminTopbar.jsx'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminPromocodes() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const q = searchParams.get('q') || ''

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
        params.set('q', q)
        const res = await api.get(`/api/promocodes?${params.toString()}`, withAdminAuth())
        if (!alive) return
        setRows(Array.isArray(res?.data) ? res.data : [])
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
  }, [limit, page, q])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [limit, total])

  const setParam = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSearchParams(next)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this promocode?')) return
    try {
      await api.del(`/api/promocodes/${id}`, withAdminAuth())
      setRows((prev) => prev.filter((r) => String(r?._id || r?.id) !== String(id)))
      setTotal((t) => Math.max(0, Number(t || 0) - 1))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <AdminTopbar
        sectionLabel="Promocodes"
        title="Promocodes"
        subtitle="Manage discount codes"
        showSearch={false}
        actions={
          <Link
            to="/admin/promocodes/new"
            className="inline-flex h-11 items-center rounded-full bg-[#2b2118] px-5 text-sm font-extrabold text-white hover:bg-[#1f1711]"
          >
            Add Promocode
          </Link>
        }
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setParam({ page: 1, q: e.target.value })}
            placeholder="Search codes..."
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 sm:max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-stone-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-stone-500">
                    No promocodes found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const id = p?._id || p?.id
                  const active = p?.isActive !== undefined ? Boolean(p.isActive) : true
                  const type = p?.discountType ? String(p.discountType) : ''
                  const amount = Number(p?.amount || 0)
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-stone-900">{p?.code || '-'}</div>
                        <div className="mt-1 text-xs text-stone-500">{p?.description || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">{type === 'percent' ? `${amount}%` : type === 'fixed' ? amount : '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                            active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          )}
                        >
                          {active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link to={`/admin/promocodes/${id}`} className="mr-4 text-stone-600 hover:text-stone-900">
                          Edit
                        </Link>
                        <button type="button" onClick={() => void remove(id)} className="text-red-600 hover:text-red-900">
                          Delete
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
