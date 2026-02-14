import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const clean = (value) => (value === undefined || value === null ? '' : String(value).trim())

const formatDate = (value) => {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [busyKey, setBusyKey] = useState('')

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
        if (q) params.set('q', q)
        const res = await api.get(`/api/admin/users?${params.toString()}`, withAdminAuth())
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setRows(list)
        setTotal(Number(res?.total || 0))
      } catch (err) {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          setError('Users API not found. Restart backend / redeploy backend, and check VITE_API_URL.')
        } else {
          setError(getErrorMessage(err))
        }
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

  const toggleBlocked = async (id) => {
    const row = rows.find((r) => String(r?._id || r?.id) === String(id))
    if (!row) return
    const nextBlocked = !Boolean(row.isBlocked)
    setBusyKey(String(id))
    setError('')
    try {
      const res = await api.patch(`/api/admin/users/${id}/block`, withAdminAuth({ body: { isBlocked: nextBlocked } }))
      const updated = res?.data
      setRows((prev) => prev.map((r) => (String(r?._id || r?.id) === String(id) ? { ...r, ...(updated || {}), isBlocked: nextBlocked } : r)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyKey('')
    }
  }

  const deleteUser = async (id) => {
    const row = rows.find((r) => String(r?._id || r?.id) === String(id))
    if (!row) return
    const ok = window.confirm(`Delete user "${clean(row.fullName) || clean(row.email) || 'user'}"? This cannot be undone.`)
    if (!ok) return
    setBusyKey(String(id))
    setError('')
    try {
      await api.del(`/api/admin/users/${id}`, withAdminAuth())
      setRows((prev) => prev.filter((r) => String(r?._id || r?.id) !== String(id)))
      setTotal((t) => Math.max(0, Number(t || 0) - 1))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminAuthService.logout()
        navigate('/admin/login', { replace: true })
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-stone-900">Users</h1>
        <p className="mt-1 text-stone-600">Block or unblock users</p>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <input
            value={q}
            onChange={(e) => setParam({ page: 1, q: e.target.value })}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none focus:border-stone-400"
          />
        </div>
        <div className="text-xs font-medium text-stone-500">
          {total ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}` : '0 users'}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">Action</th>
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
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const id = u?._id || u?.id
                  const name = clean(u?.fullName) || '-'
                  const email = clean(u?.email) || '-'
                  const isBlocked = Boolean(u?.isBlocked)
                  const busy = busyKey === String(id)
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm text-stone-700">
                        <div className="space-y-1">
                          <div className="font-semibold text-stone-900">{name}</div>
                          <div className="text-xs text-stone-600">{email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">{formatDate(u?.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                            isBlocked ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          )}
                        >
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void toggleBlocked(id)}
                            disabled={busy}
                            className={cn(
                              'rounded-md px-4 py-2 text-sm font-semibold',
                              busy
                                ? 'cursor-not-allowed bg-stone-200 text-stone-500'
                                : isBlocked
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-rose-600 text-white hover:bg-rose-700'
                            )}
                          >
                            {busy ? 'Saving...' : isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteUser(id)}
                            disabled={busy}
                            className={cn(
                              'rounded-md px-4 py-2 text-sm font-semibold',
                              busy ? 'cursor-not-allowed bg-stone-200 text-stone-500' : 'bg-stone-900 text-white hover:bg-stone-800'
                            )}
                          >
                            {busy ? 'Saving...' : 'Delete'}
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
