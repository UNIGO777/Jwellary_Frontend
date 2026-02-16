import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { formatInr, formatPercentOff } from './products.data.js'
import { ApiError, cartService, productsService, tokenStore, wishlistStore } from '../services/index.js'
import PageLoader from '../components/PageLoader.jsx'
import ProductCard from '../components/ProductCard.jsx'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''))

const extractMongoId = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (isMongoId(raw)) return raw
  const m = raw.match(/([a-f\d]{24})$/i)
  return m ? m[1] : ''
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildProductUrl = (product) => {
  const id = String(product?.id || product?._id || '')
  const name = slugify(product?.name || '') || 'product'
  if (!id) return '/products'
  return `/products/${name}_id?id=${encodeURIComponent(id)}`
}

const toPlainText = (value) => {
  const html = String(value || '')
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = html
  return String(el.textContent || '').replace(/\s+/g, ' ').trim()
}

const truncate = (value, maxLen) => {
  const s = String(value || '').trim()
  if (!s) return ''
  const n = Number(maxLen || 0)
  if (!Number.isFinite(n) || n <= 0) return s
  if (s.length <= n) return s
  return `${s.slice(0, Math.max(0, n - 1)).trimEnd()}…`
}

const upsertHeadTag = ({ selector, create, update }) => {
  const existing = document.head.querySelector(selector)
  if (existing) {
    if (existing.dataset.productSeo !== '1') {
      if (existing.getAttribute('content') !== null && existing.dataset.prevContent === undefined) {
        existing.dataset.prevContent = String(existing.getAttribute('content') || '')
      }
      if (existing.getAttribute('href') !== null && existing.dataset.prevHref === undefined) {
        existing.dataset.prevHref = String(existing.getAttribute('href') || '')
      }
    }
    existing.dataset.productSeo = '1'
    update(existing)
    return existing
  }
  const el = create()
  el.dataset.productSeo = '1'
  document.head.appendChild(el)
  return el
}

const StarRow = ({ value = 0 }) => {
  const rounded = Math.round(Number(value || 0) * 10) / 10
  const full = Math.max(0, Math.min(5, Math.floor(rounded)))
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill={i < full ? 'currentColor' : 'none'} aria-hidden="true">
          <path
            d="M12 17.3 6.6 20l1-6-4.6-4.1 6.1-.9 2.9-5.5 2.9 5.5 6.1.9-4.6 4.1 1 6L12 17.3Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </div>
  )
}

const QtyButton = ({ children, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition',
      disabled ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
    )}
  >
    {children}
  </button>
)

export default function Product() {
  const { productId: productIdParam, productName: productNameParam, productSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const searchId = useMemo(() => {
    const sp = new URLSearchParams(location.search)
    const raw = (sp.get('id') || sp.get('productId') || '').trim()
    return extractMongoId(raw)
  }, [location.search])

  const key = productSlug || productIdParam
  const productId = extractMongoId(key) || searchId
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('Description')
  const [imageIndex, setImageIndex] = useState(0)
  const [storageVersion, setStorageVersion] = useState(0)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewNeedsLogin, setReviewNeedsLogin] = useState(false)

  useEffect(() => {
    if (!product) return undefined
    const canonicalPath = buildProductUrl(product)
    const canonicalUrl = `${window.location.origin}${canonicalPath}`
    const title = `${product?.name || 'Product'} | OM ABHUSAN JWELLARY`
    const rawDescription = product?.description ? toPlainText(product.description) : ''
    const fallbackDescription = Array.isArray(product?.highlights) ? product.highlights.join(' · ') : ''
    const description = truncate(rawDescription || fallbackDescription || `${product?.name || 'Product'} by OM ABHUSAN JWELLARY.`, 160)
    const image = Array.isArray(product?.images) && product.images.length ? String(product.images[0] || '') : ''

    const prevTitle = document.title
    document.title = title

    upsertHeadTag({
      selector: 'meta[name="description"]',
      create: () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'description')
        return m
      },
      update: (m) => m.setAttribute('content', description)
    })

    upsertHeadTag({
      selector: 'meta[name="robots"]',
      create: () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'robots')
        return m
      },
      update: (m) => m.setAttribute('content', 'index,follow')
    })

    upsertHeadTag({
      selector: 'link[rel="canonical"]',
      create: () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'canonical')
        return l
      },
      update: (l) => l.setAttribute('href', canonicalUrl)
    })

    const setOg = (property, content) =>
      upsertHeadTag({
        selector: `meta[property="${property}"]`,
        create: () => {
          const m = document.createElement('meta')
          m.setAttribute('property', property)
          return m
        },
        update: (m) => m.setAttribute('content', String(content || ''))
      })

    setOg('og:title', title)
    setOg('og:description', description)
    setOg('og:type', 'product')
    setOg('og:url', canonicalUrl)
    setOg('og:site_name', 'OM ABHUSAN JWELLARY')
    if (image) setOg('og:image', image)

    const setTwitter = (name, content) =>
      upsertHeadTag({
        selector: `meta[name="${name}"]`,
        create: () => {
          const m = document.createElement('meta')
          m.setAttribute('name', name)
          return m
        },
        update: (m) => m.setAttribute('content', String(content || ''))
      })

    setTwitter('twitter:card', image ? 'summary_large_image' : 'summary')
    setTwitter('twitter:title', title)
    setTwitter('twitter:description', description)
    if (image) setTwitter('twitter:image', image)

    return () => {
      document.title = prevTitle
      const nodes = Array.from(document.head.querySelectorAll('[data-product-seo="1"]'))
      nodes.forEach((el) => {
        const prevContent = el.dataset.prevContent
        const prevHref = el.dataset.prevHref
        if (prevContent !== undefined && el.getAttribute('content') !== null) {
          el.setAttribute('content', prevContent)
          delete el.dataset.prevContent
          delete el.dataset.productSeo
          return
        }
        if (prevHref !== undefined && el.getAttribute('href') !== null) {
          el.setAttribute('href', prevHref)
          delete el.dataset.prevHref
          delete el.dataset.productSeo
          return
        }
        el.remove()
      })
    }
  }, [product])

  useEffect(() => {
    let alive = true
    const id = productId
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
      setImageIndex(0)
      if (!id) {
        setProduct(null)
        setRelated([])
        setLoading(false)
      }
    })
    if (!productId) {
      return () => {
        alive = false
      }
    }

    Promise.all([productsService.getById(productId), productsService.list({ page: 1, limit: 8 })])
      .then(([pRes, listRes]) => {
        if (!alive) return
        const p = pRes?.data || null
        setProduct(p)
        const list = Array.isArray(listRes?.data) ? listRes.data : []
        const nextRelated = list.filter((p) => p?.id && p.id !== productId).slice(0, 3)
        setRelated(nextRelated)
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load product'
        setError(message)
        setProduct(null)
        setRelated([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [productId])

  useEffect(() => {
    if (!product) return
    if (!productId) return
    const next = buildProductUrl(product)
    const desiredName = slugify(product?.name || '') || 'product'
    const hasBadId = !searchId || searchId !== productId
    const hasBadName = key && String(key || '') !== `${desiredName}_id`
    const hasExtraSegment = productNameParam !== undefined
    if (hasBadId || hasBadName || hasExtraSegment) {
      navigate(next, { replace: true })
    }
  }, [navigate, product, productId, key, productNameParam, searchId])

  useEffect(() => {
    const list = product?.hasSizes && Array.isArray(product?.sizes) ? product.sizes : []
    const next = list.length ? String(list[0]) : ''
    setSelectedSize(next)
  }, [product?.hasSizes, product?.sizes])

  useEffect(() => {
    if (tab !== 'Reviews') return
    if (!productId) return
    let alive = true
    setReviewsLoading(true)
    setReviewsError('')
    productsService
      .listReviews(productId)
      .then((res) => {
        if (!alive) return
        setReviews(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load reviews'
        setReviewsError(message)
        setReviews([])
      })
      .finally(() => {
        if (alive) setReviewsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [productId, tab])

  const isWishlisted = useMemo(() => {
    void storageVersion
    return productId ? wishlistStore.has(productId) : false
  }, [productId, storageVersion])

  const isAuthed = Boolean(tokenStore.get())

  useEffect(() => {
    if (!product) return undefined
    const canonicalPath = buildProductUrl(product)
    const canonicalUrl = `${window.location.origin}${canonicalPath}`
    const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : []

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product?.name || 'Product',
      description: truncate(toPlainText(product?.description || ''), 500) || undefined,
      image: images.length ? images : undefined,
      sku: product?.sku ? String(product.sku) : undefined,
      brand: { '@type': 'Brand', name: 'OM ABHUSAN JWELLARY' },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: Number(product?.priceInr || 0) || undefined,
        availability: product?.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    }

    const rating = Number(product?.rating)
    const reviewsCount = Number(product?.reviewsCount)
    if (Number.isFinite(rating) && rating > 0 && Number.isFinite(reviewsCount) && reviewsCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewsCount
      }
    }

    Object.keys(schema).forEach((k) => {
      if (schema[k] === undefined) delete schema[k]
    })
    if (schema.offers) {
      Object.keys(schema.offers).forEach((k) => {
        if (schema.offers[k] === undefined) delete schema.offers[k]
      })
    }

    const script = upsertHeadTag({
      selector: 'script[type="application/ld+json"][data-schema="product"]',
      create: () => {
        const s = document.createElement('script')
        s.setAttribute('type', 'application/ld+json')
        s.dataset.schema = 'product'
        return s
      },
      update: (s) => {
        s.textContent = JSON.stringify(schema)
      }
    })

    return () => {
      script.remove()
    }
  }, [product])

  if (loading) {
    return (
      <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-transparent">
          <div className="mx-auto   px-4 py-10 sm:px-6 lg:px-8">
            <PageLoader />
          </div>
        </div>
      </MotionDiv>
    )
  }

  if (!product) {
    return (
      <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-transparent">
          <div className="mx-auto   px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
              <div className="text-sm text-zinc-700">Product not found</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Back to Products
                </Link>
                <Link to="/" className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    )
  }

  const percentOff = formatPercentOff(product)
  const disableBuy = !product.inStock
  const images = product.images?.length ? product.images : []
  const thumbs = images.length ? images.slice(0, 4) : Array.from({ length: 4 }).map(() => '')
  const selectedImage = images[imageIndex] || images[0] || ''
  const sizeOptions = product?.hasSizes && Array.isArray(product?.sizes) ? product.sizes.map((s) => String(s)).filter(Boolean) : []

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <Link to="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span className="text-zinc-300">/</span>
            <Link to="/products" className="hover:text-zinc-900">
              Products
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900">{product.name}</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className=" border border-zinc-200 bg-white p-2">
                <div className={cn('relative overflow-hidden max-h-[50vh] border border-zinc-200 bg-gradient-to-br', product.theme)}>
                  <div className="aspect-square w-full">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                    {product.badge ? (
                      <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-900">
                        {product.badge}
                      </span>
                    ) : null}
                    {percentOff ? (
                      <span className="rounded-full bg-[#2b2118] px-3 py-1 text-[11px] font-semibold text-white">{percentOff}</span>
                    ) : null}
                    {!product.inStock ? (
                      <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-700">
                        Out of stock
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {thumbs.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!src}
                      onClick={() => (src ? setImageIndex(i) : null)}
                      className={cn(
                        'overflow-hidden border bg-gradient-to-br h-20 w-20 transition',
                        i === imageIndex ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300',
                        product.theme
                      )}
                      aria-label={`Thumbnail ${i + 1}`}
                    >
                      <div className="h-20 w-20">
                        {src ? (
                          <img
                            src={src}
                            alt={`${product.name} thumbnail ${i + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className=" border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{product.category}</div>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{product.name}</h1>
                    <div className="mt-2 text-sm text-zinc-600">
                      {product.metal} · {product.stone}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      wishlistStore.toggle(product.id)
                      setStorageVersion((v) => v + 1)
                    }}
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white hover:bg-zinc-50',
                      isWishlisted ? 'border-rose-200 text-rose-600' : 'border-zinc-200 text-zinc-700'
                    )}
                    aria-label="Add to wishlist"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true">
                      <path
                        d="M12 20.5s-7.5-4.6-9.3-9.2C1.2 7.8 3.6 5 6.6 5c1.7 0 3.2.8 4.1 2 1-1.2 2.4-2 4.1-2 3 0 5.4 2.8 3.9 6.3C19.5 15.9 12 20.5 12 20.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StarRow value={product.rating} />
                    <div className="text-xs font-semibold text-zinc-900">{product.rating?.toFixed?.(1) ?? product.rating}</div>
                    <div className="text-xs text-zinc-500">({product.reviewsCount || 0} reviews)</div>
                  </div>
                  <div className={cn('text-xs font-semibold', product.inStock ? 'text-emerald-700' : 'text-zinc-500')}>
                    {product.inStock ? 'In stock' : 'Out of stock'}
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-semibold text-zinc-900">{formatInr(product.priceInr)}</div>
                    {product.compareAtInr ? (
                      <div className="mt-1 text-sm text-zinc-500 line-through">{formatInr(product.compareAtInr)}</div>
                    ) : null}
                  </div>
                  <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">{product.purity}</div>
                </div>

                <div
                  className="mt-4 text-sm leading-6 text-zinc-600"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />

                {sizeOptions.length ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-900">Sizes</div>
                      <div className="text-xs text-zinc-500">{selectedSize ? `Selected: ${selectedSize}` : null}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizeOptions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-semibold transition',
                            selectedSize === s
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-900">Quantity</div>
                    <div className="text-xs text-zinc-500">Max 5 per order</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <QtyButton disabled={disableBuy || qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                      −
                    </QtyButton>
                    <div className="flex h-10 min-w-[72px] items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900">
                      {qty}
                    </div>
                    <QtyButton disabled={disableBuy || qty >= 5} onClick={() => setQty((q) => Math.min(5, q + 1))}>
                      +
                    </QtyButton>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={disableBuy}
                    onClick={async () => {
                      if (disableBuy) return
                      try {
                        await cartService.add(product.id)
                      } catch (err) {
                        if (err instanceof ApiError && err.status === 401) {
                          navigate('/auth')
                          return
                        }
                      }
                    }}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      disableBuy ? 'cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white hover:bg-zinc-950'
                    )}
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    disabled={disableBuy}
                    onClick={() => {
                      if (disableBuy) return
                      navigate('/checkout', { state: { buyNow: { productId: product.id, qty } } })
                    }}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                      disableBuy
                        ? 'cursor-not-allowed border-zinc-200 bg-white text-zinc-400'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                    )}
                  >
                    Buy now
                  </button>
                </div>

                
              </div>
            </div>
          </div>

          <div className="mt-10  border border-zinc-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="inline-flex w-full rounded-full border border-zinc-200 bg-white p-1 sm:w-auto">
                {['Description', 'Details', 'Shipping', 'Reviews'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'rounded-full px-4 py-2 text-xs font-semibold transition',
                      tab === t ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="text-xs text-zinc-500">
                Metal: <span className="font-semibold text-zinc-900">{product.metal}</span> · Weight:{' '}
                <span className="font-semibold text-zinc-900">{product.weightGrams} g</span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {tab === 'Description' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-12">
                    <div className="text-sm font-semibold text-zinc-900">Product description</div>
                    <div
                      className="mt-3 text-sm leading-6 text-zinc-600"
                      dangerouslySetInnerHTML={{ __html: product.description || '' }}
                    />
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {product.highlights.map((h) => (
                        <div key={h} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === 'Details' ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { k: 'Category', v: product.category },
                   
                   
                    { k: 'Purity', v: product.purity },
                    { k: 'Weight', v: `${product.weightGrams} g` },
                    { k: 'Availability', v: product.inStock ? 'In stock' : 'Out of stock' },
                    { k: 'Reviews', v: `${product.reviewsCount || 0}` },
                    { k: 'Rating', v: `${product.rating ?? ''}` }
                  ].map((row) => (
                    <div key={row.k} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <dt className="text-xs font-semibold text-zinc-500">{row.k}</dt>
                      <dd className="mt-2 text-sm font-semibold text-zinc-900">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {tab === 'Shipping' ? (
                <div className="max-w-3xl text-sm leading-6 text-zinc-600">
                  Orders are processed within 24–48 hours. Delivery time depends on your location and the selected shipping method.
                  You will receive tracking details once your order is dispatched.
                </div>
              ) : null}

              {tab === 'Reviews' ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">Customer reviews</div>
                      <div className="mt-2 flex items-center gap-2">
                        <StarRow value={product.rating} />
                        <div className="text-sm font-semibold text-zinc-900">{product.rating?.toFixed?.(1) ?? product.rating}</div>
                        <div className="text-sm text-zinc-500">({product.reviewsCount || 0})</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewMessage('')
                        setReviewNeedsLogin(!isAuthed)
                      }}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Write a review
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      {reviewNeedsLogin && !isAuthed ? (
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                          <div className="text-sm font-semibold text-zinc-900">Please login first</div>
                          <div className="mt-2 text-sm text-zinc-600">Login to write a review for this product.</div>
                          <div className="mt-4">
                            <Link to="/auth" className="inline-flex rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                              Login
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {isAuthed ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="text-sm font-semibold text-zinc-900">Write a review</div>
                          {reviewMessage ? <div className="mt-3 text-sm font-medium text-emerald-700">{reviewMessage}</div> : null}
                          <div className="mt-4">
                            <div className="text-xs font-semibold text-zinc-600">Your rating</div>
                            <div className="mt-2 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const value = i + 1
                                const active = value <= reviewRating
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setReviewRating(value)}
                                    className={cn('h-9 w-9 rounded-xl border transition', active ? 'border-amber-300 bg-amber-50' : 'border-zinc-200 bg-white hover:bg-zinc-50')}
                                    aria-label={`Rate ${value} stars`}
                                  >
                                    <svg viewBox="0 0 24 24" className={cn('mx-auto h-4 w-4', active ? 'text-amber-500' : 'text-zinc-400')} fill={active ? 'currentColor' : 'none'} aria-hidden="true">
                                      <path
                                        d="M12 17.3 6.6 20l1-6-4.6-4.1 6.1-.9 2.9-5.5 2.9 5.5 6.1.9-4.6 4.1 1 6L12 17.3Z"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                      />
                                    </svg>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="text-xs font-semibold text-zinc-600">Your review</div>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={4}
                              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                              placeholder="Write your experience..."
                            />
                          </div>
                          <div className="mt-4">
                            <button
                              type="button"
                              disabled={reviewBusy}
                              onClick={async () => {
                                if (!productId) return
                                setReviewBusy(true)
                                setReviewsError('')
                                setReviewMessage('')
                                try {
                                  const res = await productsService.upsertReview(productId, { rating: reviewRating, comment: reviewComment })
                                  const nextRating = Number(res?.data?.rating)
                                  const nextCount = Number(res?.data?.reviewsCount)
                                  if (Number.isFinite(nextRating) && Number.isFinite(nextCount)) {
                                    setProduct((prev) => (prev ? { ...prev, rating: nextRating, reviewsCount: nextCount } : prev))
                                  }
                                  const listRes = await productsService.listReviews(productId)
                                  setReviews(Array.isArray(listRes?.data) ? listRes.data : [])
                                  setReviewMessage('Review submitted')
                                  setReviewNeedsLogin(false)
                                } catch (err) {
                                  const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to submit review'
                                  setReviewsError(message)
                                } finally {
                                  setReviewBusy(false)
                                }
                              }}
                              className={cn(
                                'rounded-2xl px-4 py-3 text-sm font-semibold transition',
                                reviewBusy ? 'cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white hover:bg-zinc-950'
                              )}
                            >
                              {reviewBusy ? 'Submitting...' : 'Submit review'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="lg:col-span-7">
                      {reviewsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{reviewsError}</div> : null}

                      <div className={cn('space-y-4', reviewsError ? 'mt-4' : '')}>
                        {reviewsLoading ? (
                          <div className="text-sm text-zinc-600">Loading reviews...</div>
                        ) : reviews.length ? (
                          reviews.map((r) => (
                            <div key={String(r?.id)} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-zinc-900">{r?.name || 'User'}</div>
                                  {r?.createdAt ? <div className="mt-1 text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</div> : null}
                                </div>
                                <StarRow value={Number(r?.rating) || 0} />
                              </div>
                              {r?.comment ? <div className="mt-2 text-sm leading-6 text-zinc-600">{r.comment}</div> : null}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-zinc-600">No reviews yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">You may also like</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Related products</div>
              </div>
              <Link to="/products" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
                View all
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
