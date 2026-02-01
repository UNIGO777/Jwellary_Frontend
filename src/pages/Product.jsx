import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { formatInr, formatPercentOff } from './products.data.js'
import { ApiError, cartService, productsService, wishlistStore } from '../services/index.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const sizes = ['S', 'M', 'L', 'XL']

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
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('Description')
  const [imageIndex, setImageIndex] = useState(0)
  const [storageVersion, setStorageVersion] = useState(0)

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
        setProduct(pRes?.data || null)
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

  const isWishlisted = useMemo(() => {
    void storageVersion
    return productId ? wishlistStore.has(productId) : false
  }, [productId, storageVersion])

  if (loading) {
    return (
      <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-transparent">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <div className="text-sm text-zinc-700">Loading...</div>
            </div>
          </div>
        </div>
      </MotionDiv>
    )
  }

  if (!product) {
    return (
      <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-transparent">
          <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
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

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
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
              <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6">
                <div className={cn('relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br', product.theme)}>
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

                <div className="mt-4 grid grid-cols-4 gap-3">
                  {thumbs.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!src}
                      onClick={() => (src ? setImageIndex(i) : null)}
                      className={cn(
                        'overflow-hidden rounded-2xl border bg-gradient-to-br transition',
                        i === imageIndex ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300',
                        product.theme
                      )}
                      aria-label={`Thumbnail ${i + 1}`}
                    >
                      <div className="aspect-square">
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
              <div className="rounded-3xl border border-zinc-200 bg-white p-6">
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

                <p className="mt-4 text-sm leading-6 text-zinc-600">{product.description}</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-900">Size</div>
                    <div className="text-xs text-zinc-500">Selected: {selectedSize}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizes.map((s) => (
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

                <div className="mt-6 grid grid-cols-1 gap-3">
                  {[
                    { title: 'Worldwide shipping', desc: 'Fast, trackable delivery options available.' },
                    { title: 'Easy 30-day returns', desc: 'Hassle-free return & exchange support.' },
                    { title: 'Money-back guarantee', desc: 'Secure payments with buyer protection.' }
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="text-sm font-semibold text-zinc-900">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-zinc-600">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white">
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
                  <div className="lg:col-span-8">
                    <div className="text-sm font-semibold text-zinc-900">Product description</div>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{product.description}</p>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {product.highlights.map((h) => (
                        <div key={h} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <div className="rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-5">
                      <div className="text-sm font-semibold text-zinc-900">Pair it with</div>
                      <div className="mt-4 space-y-3">
                        {related.slice(0, 2).map((p) => (
                          <Link
                            key={p.id}
                            to={`/products/${p.id}`}
                            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50"
                          >
                            <div className={cn('relative h-14 w-14 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br', p.theme)}>
                              {p.images?.[0] ? (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="absolute inset-0 h-full w-full object-contain p-2"
                                  loading="lazy"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-zinc-900">{p.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">{formatInr(p.priceInr)}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === 'Details' ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { k: 'Category', v: product.category },
                    { k: 'Metal', v: product.metal },
                    { k: 'Stone', v: product.stone },
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
                <div className="max-w-3xl">
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
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Write a review
                    </button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      { name: 'Ayesha', text: 'Beautiful finish and feels premium. Perfect for daily wear.' },
                      { name: 'Rohit', text: 'Packaging was great and delivery was quick. Loved it.' },
                      { name: 'Neha', text: 'Looks exactly like the photos. Highly recommend.' }
                    ].map((r) => (
                      <div key={r.name} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-zinc-900">{r.name}</div>
                          <StarRow value={5} />
                        </div>
                        <div className="mt-2 text-sm leading-6 text-zinc-600">{r.text}</div>
                      </div>
                    ))}
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
                <Link key={p.id} to={`/products/${p.id}`} className="group block">
                  <div className="overflow-hidden border border-zinc-200 bg-white transition-colors group-hover:border-zinc-300">
                    <div className="relative aspect-[1/1] overflow-hidden bg-zinc-100">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="flex justify-between gap-4 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold uppercase tracking-wide text-zinc-900 sm:text-sm">{p.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">{p.category || ' '}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center whitespace-nowrap border border-[#2b2118]/15 bg-[#fbf7f3] px-3 py-1 text-[13px] font-bold text-[#2b2118] sm:text-sm">
                          {formatInr(p.priceInr)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
