import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, categoriesService, withAdminAuth } from '../../services/index.js'
import AdminTopbar from '../components/AdminTopbar.jsx'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminSubcategories() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const [categories, setCategories] = useState([])

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const q = searchParams.get('q') || ''
  const isActiveParam = searchParams.get('isActive') || ''
  const categoryId = searchParams.get('categoryId') || ''

  const isActive =
    isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined

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
    categoriesService
      .list({ page: 1, limit: 200 })
      .then((res) => {
        if (!alive) return
        setCategories(Array.isArray(res?.data) ? res.data : [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

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
        if (isActive !== undefined) params.set('isActive', String(isActive))
        if (categoryId) params.set('categoryId', categoryId)
        const res = await api.get(`/api/subcategories?${params.toString()}`, withAdminAuth())
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
  }, [categoryId, isActive, limit, page, q])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [limit, total])

  const remove = async (id) => {
    if (!window.confirm('Delete this subcategory?')) return
    try {
      await api.del(`/api/subcategories/${id}`, withAdminAuth())
      setRows((prev) => prev.filter((r) => String(r?._id || r?.id) !== String(id)))
      setTotal((t) => Math.max(0, Number(t || 0) - 1))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const setParam = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSearchParams(next)
  }

  const categoryNameById = useMemo(() => {
    const map = new Map()
    for (const c of categories) map.set(String(c?._id || c?.id), c?.name || '')
    return map
  }, [categories])

  return (
    <div>
      <AdminTopbar
        sectionLabel="Subcategories"
        title="Subcategories"
        subtitle="Manage subcategories"
        showSearch={false}
        actions={
          <Link
            to="/admin/subcategories/new"
            className="inline-flex h-11 items-center rounded-full bg-[#2b2118] px-5 text-sm font-extrabold text-white hover:bg-[#1f1711]"
          >
            Add Subcategory
          </Link>
        }
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-stone-200 bg-stone-50/50 p-4 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setParam({ page: 1, q: e.target.value })}
            placeholder="Search subcategories..."
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          />
          <select
            value={categoryId}
            onChange={(e) => setParam({ page: 1, categoryId: e.target.value })}
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => {
              const id = c?._id || c?.id
              return (
                <option key={String(id)} value={String(id)}>
                  {c?.name || '-'}
                </option>
              )
            })}
          </select>
          <select
            value={isActiveParam}
            onChange={(e) => setParam({ page: 1, isActive: e.target.value })}
            className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">Category</th>
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
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                rows.map((sc) => {
                  const id = sc?._id || sc?.id
                  const active = sc?.isActive !== undefined ? Boolean(sc.isActive) : true
                  const catId = sc?.category || sc?.categoryId || ''
                  return (
                    <tr key={String(id)} className="hover:bg-stone-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-stone-900">{sc?.name || '-'}</div>
                        <div className="mt-1 text-xs text-stone-500">{sc?.description || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">{categoryNameById.get(String(catId)) || '-'}</td>
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
                        <Link to={`/admin/subcategories/${id}`} className="mr-4 text-stone-600 hover:text-stone-900">
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
