import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, productsService } from '../services/index.js'
import { formatInr } from './products.data.js'

export default function BestSellers() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })
    productsService
      .list({ page: 1, limit: 200, bestSeller: true })
      .then((res) => {
        if (!alive) return
        setProducts(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load products'
        setError(message)
        setProducts([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Most loved</div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-zinc-900 md:text-5xl">Bestsellers</h1>
          <div className="mt-2 text-sm text-zinc-600">{loading ? 'Loading...' : `${products.length} products`}</div>
        </div>
        <Link
          to="/products"
          className="inline-flex h-11 items-center border border-zinc-200 bg-white px-5 text-xs font-semibold uppercase tracking-widest text-zinc-900 transition hover:bg-zinc-50"
        >
          Shop all
        </Link>
      </div>

      {error ? <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      {!loading && !error && products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">No bestsellers yet.</div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {(loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `skeleton-${i}` })) : products).map((product) => (
          <Link key={product.id} to={product.id ? `/products/${product.id}` : '#'} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-100" />
              )}
              {product.badge ? (
                <div className="absolute left-3 top-3 bg-zinc-900/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {product.badge}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-zinc-900 sm:whitespace-normal sm:overflow-visible">
                  {product.name || ' '}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{product.category || ' '}</p>
              </div>
              <div className="text-right text-sm font-medium text-zinc-900">{product.priceInr ? formatInr(product.priceInr) : ' '}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
