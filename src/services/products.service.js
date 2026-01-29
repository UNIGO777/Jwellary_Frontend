import { api, resolveAssetUrl } from './api.js'

const asNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const pickFirstVariant = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  return variants[0] || {}
}

const toImages = (variant) => {
  const out = []
  if (Array.isArray(variant?.images)) out.push(...variant.images)
  if (variant?.image) out.push(variant.image)
  return out.map(resolveAssetUrl).filter(Boolean)
}

const toHighlights = (product) => {
  const raw = product?.attributes?.highlights
  if (Array.isArray(raw) && raw.length) return raw.map((x) => String(x)).filter(Boolean)
  return ['Certified jewellery', 'Gift-ready packaging', 'Easy returns']
}

const toCategoryLabel = (product) => {
  const label = product?.attributes?.categoryName
  if (label) return String(label).trim() || 'Jewellery'
  return 'Jewellery'
}

export const normalizeProduct = (product) => {
  if (!product) return null
  const v = pickFirstVariant(product)
  const making = asNumber(v?.makingCost?.amount)
  const other = asNumber(v?.otherCharges?.amount)
  const priceInr = making + other
  const compareAtInr = asNumber(product?.attributes?.compareAtInr)

  const stock = asNumber(v?.stock)
  const inStock = stock > 0

  const category = toCategoryLabel(product)
  const metal = product?.attributes?.metal ? String(product.attributes.metal) : ''
  const stone = product?.attributes?.stone ? String(product.attributes.stone) : ''
  const purity = product?.attributes?.purity ? String(product.attributes.purity) : ''
  const weightGrams = asNumber(product?.attributes?.weightGrams)

  const badgeRaw = product?.attributes?.badge ? String(product.attributes.badge).trim() : ''
  const badge = badgeRaw || (compareAtInr > priceInr ? 'Sale' : '')

  const rating = asNumber(product?.attributes?.rating)
  const reviewsCount = asNumber(product?.attributes?.reviewsCount)

  const theme = product?.attributes?.theme ? String(product.attributes.theme) : 'from-[#fbf7f3] via-white to-zinc-50'

  return {
    id: product._id || product.id,
    name: product.name || 'Product',
    description: product.description || '',
    category,
    priceInr,
    compareAtInr: compareAtInr > 0 ? compareAtInr : 0,
    metal,
    stone,
    purity,
    weightGrams,
    inStock,
    badge,
    rating: rating > 0 ? rating : 4.6,
    reviewsCount: reviewsCount > 0 ? reviewsCount : 0,
    images: toImages(v),
    highlights: toHighlights(product),
    theme
  }
}

export const productsService = {
  async list({ page = 1, limit = 20, q = '' } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (q) params.set('q', String(q))
    const res = await api.get(`/api/products?${params.toString()}`)
    const list = Array.isArray(res?.data) ? res.data : []
    return {
      ok: Boolean(res?.ok),
      data: list.map(normalizeProduct).filter(Boolean),
      page: res?.page ?? page,
      limit: res?.limit ?? limit,
      total: res?.total ?? list.length
    }
  },

  async getById(id) {
    const res = await api.get(`/api/products/${id}`)
    return { ok: Boolean(res?.ok), data: normalizeProduct(res?.data) }
  }
}

