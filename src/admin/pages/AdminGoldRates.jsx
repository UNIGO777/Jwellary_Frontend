import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const toDateInputValue = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function AdminGoldRates() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const [editingId, setEditingId] = useState('')
  const [carat, setCarat] = useState(24)
  const [purity, setPurity] = useState('99.9')
  const [ratePer10Gram, setRatePer10Gram] = useState('')

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

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await api.get(`/api/admin/gold-rates?${params.toString()}`, withAdminAuth())
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
  }, [page, limit])

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
    setCarat(24)
    setPurity('99.9')
    setRatePer10Gram('')
  }

  const startEdit = (row) => {
    setEditingId(String(row?._id || row?.id || ''))
    setCarat(Number(row?.carat || 24))
    setPurity(row?.purity !== undefined ? String(row.purity) : '99.9')
    setRatePer10Gram(row?.ratePer10Gram !== undefined ? String(row.ratePer10Gram) : '')
  }

  const canSave = Boolean(ratePer10Gram) && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        carat: Number(carat),
        purity: Number(purity),
        ratePer10Gram: Number(ratePer10Gram)
      }
      if (editingId) await api.put(`/api/admin/gold-rates/${editingId}`, withAdminAuth({ body: payload }))
      else await api.post('/api/admin/gold-rates', withAdminAuth({ body: payload }))
      await load()
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this gold rate?')) return
    try {
      await api.del(`/api/admin/gold-rates/${id}`, withAdminAuth())
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
        <h1 className="text-3xl font-serif text-stone-900">Gold Price Management</h1>
        <p className="mt-1 text-stone-600">Add, edit, and delete gold rates (manual entry).</p>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={submit} className="mb-8 space-y-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Carat *</label>
            <select
              value={carat}
              onChange={(e) => setCarat(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
            >
              {[24, 22, 20, 18, 14].map((c) => (
                <option key={c} value={c}>
                  {c}K
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Purity (%) *</label>
            <input
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              inputMode="decimal"
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="99.9"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Rate / 10g (INR) *</label>
            <input
              value={ratePer10Gram}
              onChange={(e) => setRatePer10Gram(e.target.value)}
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="e.g. 62500"
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
            {saving ? 'Saving...' : editingId ? 'Update Rate' : 'Add Rate'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/50 px-4 py-3">
          <div className="text-sm font-semibold text-stone-800">Rates</div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Carat</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Purity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Rate / 10g</th>
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
                    No gold rates found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r?._id || r?.id
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm text-stone-700">{toDateInputValue(r?.date) || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">{r?.carat ? `${r.carat}K` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.purity ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.ratePer10Gram ?? '-'}</td>
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
