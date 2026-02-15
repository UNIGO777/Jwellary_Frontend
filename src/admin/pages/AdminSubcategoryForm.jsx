import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, categoriesService, withAdminAuth } from '../../services/index.js'
import AdminTopbar from '../components/AdminTopbar.jsx'

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminSubcategoryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [categories, setCategories] = useState([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isActive, setIsActive] = useState(true)

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
        const list = Array.isArray(res?.data) ? res.data : []
        setCategories(list)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setError('')
    api
      .get(`/api/subcategories/${id}`, withAdminAuth())
      .then((res) => {
        if (!alive) return
        const sc = res?.data
        setName(sc?.name || '')
        setDescription(sc?.description || '')
        setCategoryId(sc?.category || sc?.categoryId || '')
        setIsActive(sc?.isActive !== undefined ? Boolean(sc.isActive) : true)
      })
      .catch((err) => {
        if (!alive) return
        setError(getErrorMessage(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id, isEdit])

  const canSave = name.trim().length >= 2 && categoryId && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        isActive: Boolean(isActive)
      }
      if (isEdit) await api.put(`/api/subcategories/${id}`, withAdminAuth({ body: payload }))
      else await api.post('/api/subcategories', withAdminAuth({ body: payload }))
      navigate('/admin/subcategories')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions = useMemo(() => {
    return categories
      .map((c) => ({ id: String(c?._id || c?.id), name: c?.name || '-' }))
      .filter((c) => Boolean(c.id))
  }, [categories])

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto py-5">
      <AdminTopbar
        sectionLabel="Subcategories"
        title={isEdit ? 'Edit Subcategory' : 'Create Subcategory'}
        subtitle="Attach subcategories to a category."
        showSearch={false}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/subcategories')}
            className="inline-flex h-11 items-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-extrabold text-[#2b2118] hover:bg-[#fbf7f3]"
          >
            Back
          </button>
        }
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={submit} className="space-y-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-stone-700">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          >
            <option value="">Select category</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/subcategories')}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
