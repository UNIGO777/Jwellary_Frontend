import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, cartService, ordersService, paymentsService, productsService, promocodesService } from '../services/index.js'
import { formatInr, formatPercentOff } from './products.data.js'
import PageLoader from '../components/PageLoader.jsx'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

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

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const buyNow = location.state?.buyNow

  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lines, setLines] = useState([])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')

    const load = async () => {
      if (buyNow?.productId) {
        const res = await productsService.getById(buyNow.productId)
        const qty = Math.max(1, Math.min(5, Math.floor(Number(buyNow.qty || 1))))
        const product = res?.data
        if (!product?.id) return []
        return [{ product, qty }]
      }
      const res = await cartService.list()
      const rows = Array.isArray(res?.data) ? res.data : []
      return rows.map((row) => ({ product: row.product, qty: 1 })).filter((l) => l.product?.id)
    }

    load()
      .then((next) => {
        if (!alive) return
        setLines(next)
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/auth')
          return
        }
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load checkout'
        setError(message)
        setLines([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [buyNow?.productId, buyNow?.qty, navigate, version])

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + Number(l.qty || 0), 0), [lines])

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.product.priceInr || 0) * Number(l.qty || 0), 0)
  }, [lines])

  const compareAtTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const compareAt = Number(l.product.compareAtInr || 0)
      const unit = compareAt > 0 ? compareAt : Number(l.product.priceInr || 0)
      return sum + unit * Number(l.qty || 0)
    }, 0)
  }, [lines])

  const savings = useMemo(() => {
    return lines.reduce((sum, l) => {
      const price = Number(l.product.priceInr || 0)
      const compareAt = Number(l.product.compareAtInr || 0)
      if (!compareAt || compareAt <= price) return sum
      return sum + (compareAt - price) * Number(l.qty || 0)
    }, 0)
  }, [lines])

  const [promoCode, setPromoCode] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoData, setPromoData] = useState(null)

  const promoDiscount = useMemo(() => Number(promoData?.discount || 0), [promoData])
  const discountedSubtotal = useMemo(() => Math.max(0, subtotal - promoDiscount), [subtotal, promoDiscount])

  const gst = useMemo(() => Math.round(discountedSubtotal * 0.18), [discountedSubtotal])
  const total = useMemo(() => discountedSubtotal + gst, [discountedSubtotal, gst])

  const outOfStockCount = useMemo(() => lines.filter((l) => !l.product.inStock).length, [lines])

  const remove = async (productId) => {
    if (buyNow?.productId) {
      navigate('/products')
      return
    }
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

  const clear = async () => {
    if (buyNow?.productId) {
      navigate('/products')
      return
    }
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

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [address, setAddress] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const phoneDigits = useMemo(() => String(phone || '').replace(/\D/g, ''), [phone])
  const pincodeDigits = useMemo(() => String(pincode || '').replace(/\D/g, ''), [pincode])

  const isValidFullName = fullName.trim().length >= 2
  const isValidPhone = phoneDigits.length >= 10
  const isValidAddress = address.trim().length >= 8
  const isValidPincode = pincodeDigits.length === 6
  const isValidCity = city.trim().length >= 2
  const isValidState = stateName.trim().length >= 2
  const isValidEmail = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const canPlaceOrder =
    lines.length > 0 &&
    outOfStockCount === 0 &&
    isValidFullName &&
    isValidPhone &&
    isValidAddress &&
    isValidPincode &&
    isValidCity &&
    isValidState &&
    isValidEmail &&
    !loading

  const [placingOrder, setPlacingOrder] = useState(false)

  const applyPromo = async () => {
    const code = promoCode.trim()
    if (!code) return
    setPromoBusy(true)
    setPromoError('')
    try {
      const res = await promocodesService.validate({ code, orderTotal: subtotal })
      const data = res?.data
      const promo = data?.promo
      const discount = Number(data?.discount || 0)
      setPromoData(promo?._id ? { promo, discount } : null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to apply promo code'
      setPromoError(message)
      setPromoData(null)
    } finally {
      setPromoBusy(false)
    }
  }

  const placeOrder = async () => {
    if (lines.length === 0) return
    setSubmitted(true)
    if (!canPlaceOrder || placingOrder) return
    setPlacingOrder(true)
    setError('')
    try {
      const items = lines.map((l) => ({
        product: l.product.id,
        quantity: Math.max(1, Math.min(5, Math.floor(Number(l.qty || 1)))),
        price: Number(l.product.priceInr || 0),
        name: l.product.name,
        image: l.product.images?.[0] || ''
      }))

      const orderRes = await ordersService.create({
        items,
        subtotal,
        discount: promoDiscount,
        total,
        promocodeId: promoData?.promo?._id || '',
        customerEmail: email.trim() || undefined,
        customerPhone: phoneDigits,
        shippingAddress: {
          name: fullName.trim(),
          phone: phoneDigits,
          line1: address.trim(),
          line2: '',
          city: city.trim(),
          state: stateName.trim(),
          postalCode: pincodeDigits,
          country: 'IN'
        },
        notes: ''
      })

      const orderId = orderRes?.data?._id || orderRes?.data?.id
      if (!orderId) throw new Error('Failed to create order')

      await paymentsService.create({
        orderId,
        provider: 'manual',
        method: 'cod',
        amount: total,
        currency: 'INR',
        transactionId: '',
        meta: {}
      })

      if (!buyNow?.productId) {
        await Promise.all(lines.map((l) => cartService.remove(l.product.id)))
        setVersion((v) => v + 1)
      }

      navigate('/orders', { state: { justPlaced: orderId } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/auth')
        return
      }
      const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to place order'
      setError(message)
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <Link to="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span className="text-zinc-300">/</span>
            <Link to="/cart" className="hover:text-zinc-900">
              Cart
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900">Checkout</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">Checkout</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{itemCount} items</span>
                <span className="text-zinc-300">•</span>
                <span>Total: {formatInr(total)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/cart" className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                Back to cart
              </Link>
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
              <Link
                to="/products"
                className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]"
              >
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
              <div className="mt-2 text-sm text-zinc-600">Add some products before checkout.</div>
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
                    <div className="mt-1 text-sm text-amber-800">Remove them to continue placing your order.</div>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Order items</div>
                  <div className="mt-4 space-y-4">
                    {lines.map(({ product, qty }) => {
                      const percentOff = formatPercentOff(product)
                      const price = Number(product.priceInr || 0)
                      const compareAt = Number(product.compareAtInr || 0)
                      const showCompare = Boolean(compareAt && compareAt > price)
                      const lineTotal = price * Number(qty || 0)

                      return (
                        <div key={product.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <Link to={`/products/${product.id}`} className={cn('relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br', product.theme)}>
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                              ) : null}
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Link to={`/products/${product.id}`} className="truncate text-sm font-semibold text-zinc-900 hover:text-zinc-950">
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

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <div className="text-sm font-semibold text-zinc-900">{formatInr(price)}</div>
                                    {showCompare ? <div className="text-xs font-semibold text-zinc-400 line-through">{formatInr(compareAt)}</div> : null}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">Qty: {qty}</div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                  <button
                                    type="button"
                                    onClick={() => void remove(product.id)}
                                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Delivery details</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold text-zinc-600">Full name</div>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidFullName ? 'border-rose-300' : 'border-zinc-200'
                        )}
                      />
                      {submitted && !isValidFullName ? <div className="mt-2 text-xs font-medium text-rose-600">Enter your full name.</div> : null}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold text-zinc-600">Phone</div>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidPhone ? 'border-rose-300' : 'border-zinc-200'
                        )}
                        inputMode="tel"
                      />
                      {submitted && !isValidPhone ? <div className="mt-2 text-xs font-medium text-rose-600">Enter a valid phone number.</div> : null}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold text-zinc-600">Email (optional)</div>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidEmail ? 'border-rose-300' : 'border-zinc-200'
                        )}
                        inputMode="email"
                      />
                      {submitted && !isValidEmail ? <div className="mt-2 text-xs font-medium text-rose-600">Enter a valid email.</div> : null}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">Pincode</div>
                      <input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidPincode ? 'border-rose-300' : 'border-zinc-200'
                        )}
                        inputMode="numeric"
                      />
                      {submitted && !isValidPincode ? <div className="mt-2 text-xs font-medium text-rose-600">Enter a 6-digit pincode.</div> : null}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">City</div>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidCity ? 'border-rose-300' : 'border-zinc-200'
                        )}
                      />
                      {submitted && !isValidCity ? <div className="mt-2 text-xs font-medium text-rose-600">Enter your city.</div> : null}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold text-zinc-600">State</div>
                      <input
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidState ? 'border-rose-300' : 'border-zinc-200'
                        )}
                      />
                      {submitted && !isValidState ? <div className="mt-2 text-xs font-medium text-rose-600">Enter your state.</div> : null}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold text-zinc-600">Address</div>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className={cn(
                          'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300',
                          submitted && !isValidAddress ? 'border-rose-300' : 'border-zinc-200'
                        )}
                      />
                      {submitted && !isValidAddress ? <div className="mt-2 text-xs font-medium text-rose-600">Enter a complete address.</div> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Payment</div>
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                    <div className="text-sm font-semibold text-zinc-900">Cash on delivery</div>
                    <div className="mt-1 text-xs text-zinc-500">Pay when your order arrives.</div>
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
                    {promoDiscount > 0 ? (
                      <div className="flex items-center justify-between text-zinc-700">
                        <span>Promo discount</span>
                        <span className="font-semibold text-emerald-700">- {formatInr(promoDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Subtotal</span>
                      <span className="font-semibold text-zinc-900">{formatInr(discountedSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Delivery</span>
                      <span className="font-semibold text-zinc-900">{formatInr(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-zinc-900">{formatInr(gst)}</span>
                    </div>
                    <div className="h-px bg-zinc-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Total</span>
                      <span className="text-lg font-semibold text-zinc-900">{formatInr(total)}</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4">
                    <div className="text-xs font-semibold text-zinc-900">Promo code</div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                        placeholder="NEW10"
                      />
                      <button
                        type="button"
                        onClick={() => void applyPromo()}
                        disabled={promoBusy || !promoCode.trim() || subtotal <= 0}
                        className={cn(
                          'h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition',
                          promoBusy || !promoCode.trim() || subtotal <= 0
                            ? 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                            : 'bg-[#2b2118] text-white hover:bg-[#1f1711]'
                        )}
                      >
                        {promoBusy ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {promoError ? <div className="mt-2 text-xs font-medium text-rose-700">{promoError}</div> : null}
                    {promoData?.promo?._id ? (
                      <div className="mt-2 text-xs font-medium text-emerald-700">Applied: {promoData.promo.code}</div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={placeOrder}
                    className={cn(
                      'mt-5 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition',
                      canPlaceOrder && !placingOrder ? 'bg-zinc-900 text-white hover:bg-zinc-950' : 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                    )}
                    disabled={!canPlaceOrder || placingOrder}
                  >
                    {placingOrder ? 'Processing...' : 'Place order'}
                  </button>

                  <div className="mt-4 text-xs text-zinc-500">
                    GST is added at 18% on the subtotal. Delivery is free.
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Delivery estimate</div>
                  <div className="mt-2 text-sm text-zinc-600">Usually delivered in 3–5 business days.</div>
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-zinc-900">Included</div>
                    <div className="mt-2 space-y-1 text-xs text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span>Hallmarked & quality checked</span>
                        <span className="font-semibold text-zinc-900">Yes</span>
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
              </aside>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
