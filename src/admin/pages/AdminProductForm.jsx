import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService, adminTokenStore, api, API_BASE_URL, categoriesService, resolveAssetUrl, subcategoriesService, withAdminAuth } from '../../services/index.js'

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')

  const [material, setMaterial] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [materialTypes, setMaterialTypes] = useState({ gold: [], silver: [], diamond: [] })

  const [purity, setPurity] = useState('')
  const [weightGrams, setWeightGrams] = useState('')

  const [sku, setSku] = useState('')
  const [stock, setStock] = useState(0)
  const [makingCostAmount, setMakingCostAmount] = useState(0)
  const [otherChargesAmount, setOtherChargesAmount] = useState(0)

  const [images, setImages] = useState([])
  const [manualImage, setManualImage] = useState('')
  const [video, setVideo] = useState('')

  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    let alive = true
    adminAuthService
      .me()
      .catch((err) => {
        if (!alive) return
        if (err.status === 401) {
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
    api
      .get('/api/products/meta/material-types', withAdminAuth())
      .then((res) => {
        if (!alive) return
        const data = res?.data && typeof res.data === 'object' ? res.data : {}
        setMaterialTypes({
          gold: Array.isArray(data.gold) ? data.gold : [],
          silver: Array.isArray(data.silver) ? data.silver : [],
          diamond: Array.isArray(data.diamond) ? data.diamond : []
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    if (!categoryId) {
      setSubcategories([])
      setSubCategoryId('')
      return () => {
        alive = false
      }
    }
    subcategoriesService
      .list({ page: 1, limit: 200, categoryId })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setSubcategories(list)
        const exists = list.some((s) => String(s?._id || s?.id) === String(subCategoryId))
        if (!exists) setSubCategoryId('')
      })
      .catch(() => {
        if (!alive) return
        setSubcategories([])
      })
    return () => {
      alive = false
    }
  }, [categoryId, subCategoryId])

  useEffect(() => {
    if (isEdit) {
      let alive = true
      setLoading(true)
      api
        .get(`/api/products/${id}`, withAdminAuth())
        .then((res) => {
          if (!alive) return
          const p = res?.data
          const imagesValue = Array.isArray(p?.images) ? p.images : []

          setName(p?.name || '')
          setDescription(p?.description || '')
          setIsActive(p?.isActive !== undefined ? Boolean(p.isActive) : true)
          setIsFeatured(p?.isFeatured !== undefined ? Boolean(p.isFeatured) : false)
          setIsBestSeller(p?.isBestSeller !== undefined ? Boolean(p.isBestSeller) : false)
          setCategoryId(p?.category || '')
          setSubCategoryId(p?.subCategory || '')

          setMaterial(p?.material ? String(p.material) : '')
          setMaterialType(p?.materialType !== undefined && p?.materialType !== null ? String(p.materialType) : '')

          setPurity(p?.attributes?.purity || '')
          setWeightGrams(p?.attributes?.weightGrams || '')

          setSku(p?.sku || '')
          setStock(Number(p?.stock || 0))
          setMakingCostAmount(Number(p?.makingCost?.amount || 0))
          setOtherChargesAmount(Number(p?.otherCharges?.amount || 0))

          setImages(imagesValue.map((x) => String(x)).filter(Boolean))
          setVideo(p?.video ? String(p.video) : '')
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
    }
    setLoading(false)
  }, [id, isEdit])

  const categoryOptions = useMemo(() => {
    return categories
      .map((c) => ({ id: String(c?._id || c?.id), name: c?.name || '-' }))
      .filter((c) => Boolean(c.id))
  }, [categories])

  const subcategoryOptions = useMemo(() => {
    return subcategories
      .map((c) => ({ id: String(c?._id || c?.id), name: c?.name || '-' }))
      .filter((c) => Boolean(c.id))
  }, [subcategories])

  const materialTypeOptions = useMemo(() => {
    if (material === 'gold') return materialTypes.gold.map((t) => ({ value: String(t?.value ?? ''), label: String(t?.label ?? '') })).filter((t) => Boolean(t.value))
    if (material === 'silver') return materialTypes.silver.map((t) => ({ value: String(t?.value ?? ''), label: String(t?.label ?? '') })).filter((t) => Boolean(t.value))
    if (material === 'diamond') return materialTypes.diamond.map((t) => ({ value: String(t?.value ?? ''), label: String(t?.label ?? '') })).filter((t) => Boolean(t.value))
    return []
  }, [material, materialTypes.diamond, materialTypes.gold, materialTypes.silver])

  useEffect(() => {
    if (!material) return
    if (!materialType) {
      if (material === 'diamond') setPurity('')
      return
    }
    if (material === 'gold') {
      const selected = materialTypes.gold.find((t) => String(t?.value) === String(materialType))
      setPurity(selected?.purity !== undefined && selected?.purity !== null ? String(selected.purity) : '')
    } else if (material === 'silver') {
      const selected = materialTypes.silver.find((t) => String(t?.value) === String(materialType))
      setPurity(selected?.purity !== undefined && selected?.purity !== null ? String(selected.purity) : '')
    } else if (material === 'diamond') {
      setPurity('')
    }
  }, [material, materialType, materialTypes.gold, materialTypes.silver])

  const uploadMultipleImages = async (files) => {
    const fd = new FormData()
    for (const f of Array.from(files || [])) fd.append('images', f)
    const token = adminTokenStore.get()
    const res = await fetch(`${API_BASE_URL}/api/files/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const message = (data && typeof data === 'object' && data.message && String(data.message)) || `Upload failed (${res.status})`
      throw new Error(message)
    }
    const paths = Array.isArray(data?.paths) ? data.paths : []
    return paths.map((p) => String(p)).filter(Boolean)
  }

  const uploadSingleImage = async (file) => {
    const fd = new FormData()
    fd.append('image', file)
    const token = adminTokenStore.get()
    const res = await fetch(`${API_BASE_URL}/api/files/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const message = (data && typeof data === 'object' && data.message && String(data.message)) || `Upload failed (${res.status})`
      throw new Error(message)
    }
    return data?.path ? String(data.path) : ''
  }

  const uploadSingleVideo = async (file) => {
    const fd = new FormData()
    fd.append('video', file)
    const token = adminTokenStore.get()
    const res = await fetch(`${API_BASE_URL}/api/files/video`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const message = (data && typeof data === 'object' && data.message && String(data.message)) || `Upload failed (${res.status})`
      throw new Error(message)
    }
    return data?.path ? String(data.path) : ''
  }

  const addManualImage = () => {
    const value = manualImage.trim()
    if (!value) return
    setImages((prev) => Array.from(new Set([...prev, value])))
    setManualImage('')
  }

  const removeImage = (value) => {
    setImages((prev) => prev.filter((x) => x !== value))
  }

  const onPickImages = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImages(true)
    setError('')
    try {
      const paths = await uploadMultipleImages(files)
      setImages((prev) => Array.from(new Set([...prev, ...paths])))
    } catch (err) {
      setError(err?.message ? String(err.message) : 'Failed to upload images')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const onPickSingleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImages(true)
    setError('')
    try {
      const path = await uploadSingleImage(file)
      if (path) setImages((prev) => Array.from(new Set([...prev, path])))
    } catch (err) {
      setError(err?.message ? String(err.message) : 'Failed to upload image')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    setError('')
    try {
      const path = await uploadSingleVideo(file)
      if (path) setVideo(path)
    } catch (err) {
      setError(err?.message ? String(err.message) : 'Failed to upload video')
    } finally {
      setUploadingVideo(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        isActive: Boolean(isActive),
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        material: material || undefined,
        materialType: materialType || undefined,
        sku: sku.trim() || undefined,
        stock: Number(stock || 0),
        makingCost: { amount: Number(makingCostAmount || 0) },
        otherCharges: { amount: Number(otherChargesAmount || 0) },
        images: images.length ? images : undefined,
        video: video.trim() || undefined,
        attributes: {
          purity: purity.trim(),
          weightGrams: weightGrams === '' ? undefined : Number(weightGrams)
        }
      }

      if (isEdit) await api.put(`/api/products/${id}`, withAdminAuth({ body: payload }))
      else await api.post('/api/products', withAdminAuth({ body: payload }))
      navigate('/admin/products')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
          <p className="mt-1 text-stone-600">Keep details clean and consistent for better storefront results.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Back
        </button>
      </header>
      
      {error ? <div className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-6 border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-stone-700">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-stone-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Making Cost (INR) *</label>
            <input
              type="number"
              required
              value={makingCostAmount}
              onChange={(e) => setMakingCostAmount(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Other Charges (INR)</label>
            <input
              type="number"
              value={otherChargesAmount}
              onChange={(e) => setOtherChargesAmount(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Stock *</label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
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
            <label className="block text-sm font-medium text-stone-700">Subcategory</label>
            <select
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              disabled={!categoryId}
              className="mt-1 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none disabled:cursor-not-allowed disabled:bg-stone-50"
            >
              <option value="">Select subcategory</option>
              {subcategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Material</label>
            <select
              value={material}
              onChange={(e) => {
                setMaterial(e.target.value)
                setMaterialType('')
                setPurity('')
              }}
              className="mt-1 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            >
              <option value="">Select material</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Material Type</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              disabled={!material}
              className="mt-1 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none disabled:cursor-not-allowed disabled:bg-stone-50"
            >
              <option value="">{material ? 'Select type' : 'Select material first'}</option>
              {materialTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Purity</label>
            <input
              type="text"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              disabled={material === 'gold' || material === 'silver'}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Weight (g)</label>
            <input
              type="number"
              step="0.01"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="col-span-2 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Product active
            </label>
          </div>

          <div className="col-span-2 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured product
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
              Best seller
            </label>
          </div>

          <div className="col-span-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-sm font-medium text-stone-700">Add image URL</label>
                <input
                  type="text"
                  value={manualImage}
                  onChange={(e) => setManualImage(e.target.value)}
                  placeholder="/uploads/img1.jpg or https://..."
                  className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
              <button
                type="button"
                onClick={addManualImage}
                className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Add
              </button>
              <label className="h-10 cursor-pointer rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 inline-flex items-center">
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onPickImages(e)} />
                {uploadingImages ? 'Uploading...' : 'Upload images'}
              </label>
              <label className="h-10 cursor-pointer rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 inline-flex items-center">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickSingleImage(e)} />
                {uploadingImages ? 'Uploading...' : 'Upload image'}
              </label>
            </div>

            {images.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((src) => (
                  <div key={src} className="relative overflow-hidden rounded-md border border-stone-200 bg-white">
                    <img src={resolveAssetUrl(src) || src} alt="" className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(src)}
                      className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-stone-500">No images yet.</div>
            )}
          </div>

          <div className="col-span-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-sm font-medium text-stone-700">Video</label>
                <input
                  type="text"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  placeholder="/uploads/video.mp4"
                  className="mt-1 block w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
              <label className="h-10 cursor-pointer rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 inline-flex items-center">
                <input type="file" accept="video/*" className="hidden" onChange={(e) => void onPickVideo(e)} />
                {uploadingVideo ? 'Uploading...' : 'Upload video'}
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/products')} className="border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploadingImages || uploadingVideo || !name.trim()}
            className="inline-flex justify-center border border-transparent bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
