import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminDiamondTypes() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const [editingId, setEditingId] = useState('')
  const [origin, setOrigin] = useState('Natural')
  const [shape, setShape] = useState('')
  const [cut, setCut] = useState('Excellent')
  const [color, setColor] = useState('')
  const [clarity, setClarity] = useState('')

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 30)
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

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (q) params.set('q', q)
      const res = await api.get(`/api/admin/diamond-types?${params.toString()}`, withAdminAuth())
      setRows(Array.isArray(res?.data) ? res.data : [])
      setTotal(Number(res?.total || 0))
    } catch (err) {
      setError(getErrorMessage(err))
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [limit, total])

  const setParam = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSearchParams(next)
  }

  const resetForm = () => {
    setEditingId('')
    setOrigin('Natural')
    setShape('')
    setCut('Excellent')
    setColor('')
    setClarity('')
  }

  const startEdit = (row) => {
    setEditingId(String(row?._id || row?.id || ''))
    setOrigin(row?.origin ? String(row.origin) : 'Natural')
    setShape(row?.shape ? String(row.shape) : '')
    setCut(row?.cut ? String(row.cut) : 'Excellent')
    setColor(row?.color ? String(row.color) : '')
    setClarity(row?.clarity ? String(row.clarity) : '')
  }

  const canSave =
    origin && shape.trim() && cut && color.trim() && clarity.trim() && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        origin: String(origin).trim(),
        shape: shape.trim(),
        cut: String(cut).trim(),
        color: color.trim(),
        clarity: clarity.trim()
      }
      if (editingId) await api.put(`/api/admin/diamond-types/${editingId}`, withAdminAuth({ body: payload }))
      else await api.post('/api/admin/diamond-types', withAdminAuth({ body: payload }))
      await load()
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this diamond type?')) return
    try {
      await api.del(`/api/admin/diamond-types/${id}`, withAdminAuth())
      setRows((prev) => prev.filter((r) => String(r?._id || r?.id) !== String(id)))
      setTotal((t) => Math.max(0, Number(t || 0) - 1))
      if (String(editingId) === String(id)) resetForm()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-stone-900">Diamond Type Management</h1>
        <p className="mt-1 text-stone-600">Create and manage diamond types used for pricing.</p>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={submit} className="mb-8 space-y-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Origin *</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
            >
              <option value="Natural">Natural</option>
              <option value="Lab-Grown">Lab-Grown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Shape *</label>
            <input
              value={shape}
              onChange={(e) => setShape(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="Round"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Cut *</label>
            <select
              value={cut}
              onChange={(e) => setCut(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
            >
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Color (D–Z) *</label>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="D"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Clarity *</label>
            <input
              value={clarity}
              onChange={(e) => setClarity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="VVS1"
              required
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel Edit
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Type' : 'Add Type'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setParam({ page: 1, q: e.target.value })}
            placeholder="Search diamond types..."
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 sm:max-w-md"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 sm:w-auto"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Origin</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Shape</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Cut</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Clarity</th>
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
                    No diamond types found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r?._id || r?.id
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.origin || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">{r?.shape || '-'}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.cut || '-'}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.color || '-'}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.clarity || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className={cn(
                            'mr-4',
                            String(editingId) === String(id) ? 'text-stone-400' : 'text-stone-600 hover:text-stone-900'
                          )}
                          disabled={String(editingId) === String(id)}
                        >
                          Edit
                        </button>
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
