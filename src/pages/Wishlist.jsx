import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, cartService, productsService, wishlistStore } from '../services/index.js'
import { formatInr } from './products.data.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function Wishlist() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const ids = useMemo(() => {
    void version
    return wishlistStore.getIds()
  }, [version])

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })

    Promise.all(ids.map((id) => productsService.getById(id).then((res) => res?.data).catch(() => null)))
      .then((list) => {
        if (!alive) return
        setItems(list.filter((p) => p?.id))
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load wishlist'
        setError(message)
        setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [ids])

  const remove = (id) => {
    wishlistStore.remove(id)
    setVersion((v) => v + 1)
  }

  const addToCart = async (id) => {
    try {
      await cartService.add(id)
      navigate('/cart')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/auth')
        return
      }
      setError(err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to add to cart')
    }
  }

  const clear = () => {
    wishlistStore.clear()
    setVersion((v) => v + 1)
  }

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Wishlist</div>
              <div className="mt-1 text-xs text-zinc-500">{items.length} items</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clear}
                disabled={items.length === 0}
                className={cn(
                  'h-10 rounded-full border px-4 text-sm font-semibold transition',
                  items.length === 0
                    ? 'cursor-not-allowed border-zinc-200 bg-white text-zinc-400'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                )}
              >
                Clear
              </button>
              <Link
                to="/products"
                className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Browse products
              </Link>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm text-zinc-700">Loading...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm font-semibold text-zinc-900">Your wishlist is empty</div>
              <div className="mt-2 text-sm text-zinc-600">Save products you love and come back anytime.</div>
              <div className="mt-5">
                <Link
                  to="/products"
                  className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Explore products
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <div key={p.id} className="overflow-hidden border border-zinc-200 bg-white transition-colors hover:border-zinc-300">
                  <Link to={`/products/${p.id}`} className="group block">
                    <div className="relative aspect-[1/1] overflow-hidden bg-zinc-100">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : null}
                      {!p.inStock ? (
                        <div className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-sm">
                          Sold Out
                        </div>
                      ) : null}
                    </div>
                  </Link>
                  <div className="flex justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold uppercase tracking-wide text-zinc-900 sm:text-sm">{p.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">{p.category}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center whitespace-nowrap border border-[#2b2118]/15 bg-[#fbf7f3] px-3 py-1 text-[13px] font-bold text-[#2b2118] sm:text-sm">
                        {formatInr(p.priceInr)}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void addToCart(p.id)}
                        disabled={!p.inStock}
                        className={cn(
                          'flex-1 px-4 py-2.5 text-sm font-semibold transition',
                          p.inStock ? 'bg-zinc-900 text-white hover:bg-zinc-950' : 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                        )}
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
