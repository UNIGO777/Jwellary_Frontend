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

const describeType = (t) => {
  if (!t) return '-'
  const parts = [t.origin, t.shape, t.cut, t.color, t.clarity].map((v) => String(v || '').trim()).filter(Boolean)
  return parts.join(' • ') || '-'
}

export default function AdminDiamondPrices() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const [types, setTypes] = useState([])
  const [typesLoading, setTypesLoading] = useState(true)

  const [editingId, setEditingId] = useState('')
  const [diamondTypeId, setDiamondTypeId] = useState('')
  const [pricePerCarat, setPricePerCarat] = useState('')

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const filterTypeId = searchParams.get('diamondTypeId') || ''

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
    const loadTypes = async () => {
      setTypesLoading(true)
      try {
        const res = await api.get('/api/admin/diamond-types?page=1&limit=200', withAdminAuth())
        if (!alive) return
        setTypes(Array.isArray(res?.data) ? res.data : [])
      } catch {
        if (!alive) return
        setTypes([])
      } finally {
        if (alive) setTypesLoading(false)
      }
    }
    void loadTypes()
    return () => {
      alive = false
    }
  }, [])

  const typeOptions = useMemo(() => {
    return (Array.isArray(types) ? types : [])
      .map((t) => ({
        id: String(t?._id || t?.id || ''),
        label: describeType(t)
      }))
      .filter((t) => Boolean(t.id))
  }, [types])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (filterTypeId) params.set('diamondTypeId', filterTypeId)
      const res = await api.get(`/api/admin/diamond-prices?${params.toString()}`, withAdminAuth())
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
  }, [page, limit, filterTypeId])

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
    setDiamondTypeId('')
    setPricePerCarat('')
  }

  const startEdit = (row) => {
    setEditingId(String(row?._id || row?.id || ''))
    const typeId = row?.diamondType?._id || row?.diamondType?.id || row?.diamondType
    setDiamondTypeId(typeId ? String(typeId) : '')
    setPricePerCarat(row?.pricePerCarat !== undefined ? String(row.pricePerCarat) : '')
  }

  const canSave = Boolean(diamondTypeId) && Boolean(pricePerCarat) && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        diamondTypeId,
        pricePerCarat: Number(pricePerCarat)
      }
      if (editingId) await api.put(`/api/admin/diamond-prices/${editingId}`, withAdminAuth({ body: payload }))
      else await api.post('/api/admin/diamond-prices', withAdminAuth({ body: payload }))
      await load()
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this diamond price?')) return
    try {
      await api.del(`/api/admin/diamond-prices/${id}`, withAdminAuth())
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
        <h1 className="text-3xl font-serif text-stone-900">Diamond Price Management</h1>
        <p className="mt-1 text-stone-600">Assign manual prices per carat for diamond types.</p>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={submit} className="mb-8 space-y-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-stone-700">Diamond Type *</label>
            <select
              value={diamondTypeId}
              onChange={(e) => setDiamondTypeId(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none disabled:bg-stone-50"
              disabled={typesLoading}
              required
            >
              <option value="">{typesLoading ? 'Loading types...' : 'Select diamond type'}</option>
              {typeOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Price / Carat (INR) *</label>
            <input
              value={pricePerCarat}
              onChange={(e) => setPricePerCarat(e.target.value)}
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none"
              placeholder="e.g. 65000"
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
            {saving ? 'Saving...' : editingId ? 'Update Price' : 'Add Price'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={filterTypeId}
            onChange={(e) => setParam({ page: 1, diamondTypeId: e.target.value })}
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none sm:max-w-xl"
            disabled={typesLoading}
          >
            <option value="">All diamond types</option>
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Diamond Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Price / Carat</th>
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
                    No diamond prices found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r?._id || r?.id
                  const type = r?.diamondType && typeof r.diamondType === 'object' ? r.diamondType : null
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4 text-sm text-stone-700">{toDateInputValue(r?.date) || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">{describeType(type)}</td>
                      <td className="px-6 py-4 text-sm text-stone-700">{r?.pricePerCarat ?? '-'}</td>
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
