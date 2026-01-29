import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, adminAuthService, api, withAdminAuth } from '../../services/index.js'

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminPromocodeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [amount, setAmount] = useState(10)
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
    if (!isEdit) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setError('')
    api
      .get(`/api/promocodes/${id}`, withAdminAuth())
      .then((res) => {
        if (!alive) return
        const p = res?.data
        setCode(p?.code || '')
        setDescription(p?.description || '')
        setDiscountType(p?.discountType ? String(p.discountType) : 'percent')
        setAmount(Number(p?.amount || 0))
        setIsActive(p?.isActive !== undefined ? Boolean(p.isActive) : true)
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

  const canSave =
    (isEdit ? true : code.trim().length >= 2) &&
    (discountType === 'percent' || discountType === 'fixed') &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= 0 &&
    !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...(isEdit ? {} : { code: code.trim().toUpperCase() }),
        description: description.trim(),
        discountType,
        amount: Number(amount),
        isActive: Boolean(isActive)
      }
      if (isEdit) await api.put(`/api/promocodes/${id}`, withAdminAuth({ body: payload }))
      else await api.post('/api/promocodes', withAdminAuth({ body: payload }))
      navigate('/admin/promocodes')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">{isEdit ? 'Edit Promocode' : 'Create Promocode'}</h1>
          <p className="mt-1 text-stone-600">Keep codes short and clear.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/promocodes')}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Back
        </button>
      </header>

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={submit} className="space-y-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        {!isEdit ? (
          <div>
            <label className="block text-sm font-medium text-stone-700">Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="NEW10"
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Code</div>
            <div className="mt-1 text-sm font-semibold text-stone-900">{code || '-'}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="10% off"
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-700">Discount Type *</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            >
              <option value="percent">percent</option>
              <option value="fixed">fixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Amount *</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min={0}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/promocodes')}
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

