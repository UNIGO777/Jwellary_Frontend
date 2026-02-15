import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, cartService, wishlistStore } from '../services/index.js'
import { formatInr, formatPercentOff } from './products.data.js'
import PageLoader from '../components/PageLoader.jsx'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const productUrl = (product) => {
  const id = String(product?.id || '')
  const name = slugify(product?.name || '') || 'product'
  return id ? `/products/${name}_id?id=${encodeURIComponent(id)}` : '/products'
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

export default function Cart() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartRows, setCartRows] = useState([])

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })
    cartService
      .list()
      .then((res) => {
        if (!alive) return
        setCartRows(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/auth')
          return
        }
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load cart'
        setError(message)
        setCartRows([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [navigate, version])

  const lines = useMemo(() => {
    return cartRows.map((row) => ({ product: row.product, qty: 1 })).filter((l) => l.product?.id)
  }, [cartRows])

  const itemCount = lines.length

  const wishlistIds = useMemo(() => {
    void version
    return new Set(wishlistStore.getIds())
  }, [version])

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + Number(l.product.priceInr || 0), 0), [lines])

  const compareAtTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const compareAt = Number(l.product.compareAtInr || 0)
      const unit = compareAt > 0 ? compareAt : Number(l.product.priceInr || 0)
      return sum + unit
    }, 0)
  }, [lines])

  const savings = useMemo(() => {
    return lines.reduce((sum, l) => {
      const price = Number(l.product.priceInr || 0)
      const compareAt = Number(l.product.compareAtInr || 0)
      if (!compareAt || compareAt <= price) return sum
      return sum + (compareAt - price)
    }, 0)
  }, [lines])

  const gstEstimate = useMemo(() => Math.round(subtotal * 0.18), [subtotal])
  const totalEstimate = useMemo(() => subtotal + gstEstimate, [subtotal, gstEstimate])

  const outOfStockCount = useMemo(() => lines.filter((l) => !l.product.inStock).length, [lines])

  const remove = async (productId) => {
    try {
      await cartService.remove(productId)
      setVersion((v) => v + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/auth')
        return
      }
      setError(err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to remove item')
    }
  }

  const toggleWishlist = (productId) => {
    wishlistStore.toggle(productId)
    setVersion((v) => v + 1)
  }

  const clear = async () => {
    try {
      await Promise.all(lines.map((l) => cartService.remove(l.product.id)))
      setVersion((v) => v + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/auth')
        return
      }
      setError(err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to clear cart')
    }
  }

  const goCheckout = () => {
    if (lines.length === 0) return
    if (outOfStockCount > 0) return
    navigate('/checkout')
  }

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto   px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <Link to="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span className="text-zinc-300">/</span>
            <Link to="/products" className="hover:text-zinc-900">
              Products
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900">Cart</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">Cart</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{itemCount} items</span>
                {lines.length > 0 ? <span className="text-zinc-300">•</span> : null}
                {lines.length > 0 ? <span>Subtotal: {formatInr(subtotal)}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clear}
                disabled={lines.length === 0}
                className={cn(
                  'h-10 rounded-full border px-4 text-sm font-semibold transition',
                  lines.length === 0
                    ? 'cursor-not-allowed border-zinc-200 bg-white text-zinc-400'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                )}
              >
                Clear cart
              </button>
              <Link to="/products" className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]">
                Continue shopping
              </Link>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

          {loading ? (
            <div className="mt-6">
              <PageLoader />
            </div>
          ) : lines.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm font-semibold text-zinc-900">Your cart is empty</div>
              <div className="mt-2 text-sm text-zinc-600">Add some products to continue.</div>
              <div className="mt-5">
                <Link to="/products" className="inline-flex rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="lg:col-span-7">
                {outOfStockCount > 0 ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
                    <div className="text-sm font-semibold text-amber-900">Some items are out of stock</div>
                    <div className="mt-1 text-sm text-amber-800">Remove them to continue to checkout.</div>
                  </div>
                ) : null}

                <div className={cn('rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6', outOfStockCount > 0 ? 'mt-4' : '')}>
                  <div className="text-sm font-semibold text-zinc-900">Cart items</div>
                  <div className="mt-4 space-y-4">
                    {lines.map(({ product }) => {
                      const percentOff = formatPercentOff(product)
                      const isWishlisted = wishlistIds.has(product.id)
                      const price = Number(product.priceInr || 0)
                      const compareAt = Number(product.compareAtInr || 0)
                      const showCompare = Boolean(compareAt && compareAt > price)
                      const lineTotal = price

                      return (
                        <div key={product.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <Link
                              to={productUrl(product)}
                              className={cn('relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br', product.theme)}
                            >
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                              ) : null}
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Link to={productUrl(product)} className="truncate text-sm font-semibold text-zinc-900 hover:text-zinc-950">
                                      {product.name}
                                    </Link>
                                    {percentOff ? <span className="rounded-full bg-[#2b2118] px-2.5 py-1 text-[11px] font-semibold text-white">{percentOff}</span> : null}
                                    {!product.inStock ? (
                                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                                        Out of stock
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        In stock
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {product.category} · {product.metal} · {product.purity} · {product.weightGrams}g · {product.stone}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <StarRow value={product.rating} />
                                    <div className="text-xs font-semibold text-zinc-900">{product.rating?.toFixed?.(1) ?? product.rating}</div>
                                    <div className="text-xs text-zinc-500">({product.reviewsCount || 0} reviews)</div>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <div className="text-xs font-semibold text-zinc-500">Line total</div>
                                  <div className="mt-1 text-sm font-semibold text-zinc-900">{formatInr(lineTotal)}</div>
                                </div>
                              </div>

                              {product.highlights?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {product.highlights.slice(0, 3).map((h) => (
                                    <span key={h} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700">
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <div className="text-sm font-semibold text-zinc-900">{formatInr(price)}</div>
                                    {showCompare ? <div className="text-xs font-semibold text-zinc-400 line-through">{formatInr(compareAt)}</div> : null}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">Qty: 1</div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleWishlist(product.id)}
                                      className={cn(
                                        'rounded-xl border bg-white px-3 py-2 text-sm font-semibold transition',
                                        isWishlisted ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-zinc-200 text-zinc-700 hover:bg-[#fbf7f3]'
                                      )}
                                    >
                                      {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void remove(product.id)}
                                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              <aside className="lg:col-span-5">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Order summary</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Items</span>
                      <span className="font-semibold text-zinc-900">{itemCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>MRP total</span>
                      <span className="font-semibold text-zinc-900">{formatInr(compareAtTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Discount</span>
                      <span className={cn('font-semibold', savings > 0 ? 'text-emerald-700' : 'text-zinc-900')}>
                        {savings > 0 ? `- ${formatInr(savings)}` : formatInr(0)}
                      </span>
                    </div>
                    <div className="h-px bg-zinc-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Subtotal</span>
                      <span className="text-lg font-semibold text-zinc-900">{formatInr(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-zinc-900">{formatInr(gstEstimate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Estimated total</span>
                      <span className="text-lg font-semibold text-zinc-900">{formatInr(totalEstimate)}</span>
                    </div>
                    <div className="text-xs text-zinc-500">Final GST is calculated on checkout.</div>
                  </div>

                  <button
                    type="button"
                    onClick={goCheckout}
                    className={cn(
                      'mt-5 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition',
                      lines.length === 0 || outOfStockCount > 0
                        ? 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                        : 'bg-[#2b2118] text-white hover:bg-[#1f1711]'
                    )}
                    disabled={lines.length === 0 || outOfStockCount > 0}
                  >
                    Proceed to checkout
                  </button>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4">
                    <div className="text-xs font-semibold text-zinc-900">What you get</div>
                    <div className="mt-2 space-y-1 text-xs text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span>Free delivery</span>
                        <span className="font-semibold text-zinc-900">₹0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Gift-ready packaging</span>
                        <span className="font-semibold text-zinc-900">Included</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Secure payments</span>
                        <span className="font-semibold text-zinc-900">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Need help?</div>
                  <div className="mt-2 text-sm text-zinc-600">Double-check metal, purity and weight before checkout.</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/products" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                      Add more items
                    </Link>
                    <Link to="/wishlist" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                      View wishlist
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
