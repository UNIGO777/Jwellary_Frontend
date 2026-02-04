import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { formatInr, formatPercentOff } from './products.data.js'
import { ApiError, cartService, categoriesService, productsService, subcategoriesService, wishlistStore } from '../services/index.js'

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

const toCountMap = (items) => {
  const map = new Map()
  for (const it of items) map.set(it, (map.get(it) || 0) + 1)
  return map
}

const toggleValue = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

const FilterRow = ({ label, count, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm text-zinc-700">
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          'grid h-4 w-4 place-items-center rounded border transition',
          checked ? 'border-[#2b2118] bg-[#2b2118]' : 'border-zinc-300 bg-white'
        )}
      >
        {checked ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
            <path d="M5.5 12.2 10.3 17 18.5 7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="truncate">{label}</span>
    </span>
    <span className="text-xs font-medium text-zinc-500">{count}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
  </label>
)

const FilterSection = ({ title, children, footer }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
    <div className="text-sm font-semibold text-zinc-900">{title}</div>
    <div className="mt-3">{children}</div>
    {footer ? <div className="mt-3">{footer}</div> : null}
  </div>
)

export default function Products() {
  const location = useLocation()
  const { categorySlug, subCategorySlug } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Featured')
  const [topCategory, setTopCategory] = useState('All')
  const [onlyNew, setOnlyNew] = useState(false)
  const [onlySale, setOnlySale] = useState(false)
  const [storageVersion, setStorageVersion] = useState(0)

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasInitPrice, setHasInitPrice] = useState(false)

  const [categories, setCategories] = useState([])
  const [metals, setMetals] = useState([])
  const [stones, setStones] = useState([])
  const [purities, setPurities] = useState([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    let alive = true
    const sp = new URLSearchParams(location.search)
    const categoryIdFromSearch = (sp.get('categoryId') || '').trim()
    const subCategoryIdFromSearch = (sp.get('subCategoryId') || '').trim()

    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })

    const resolveFilters = async () => {
      let categoryId = categoryIdFromSearch
      let subCategoryId = subCategoryIdFromSearch

      const catSlug = categorySlug ? String(categorySlug).trim().toLowerCase() : ''
      const scSlug = subCategorySlug ? String(subCategorySlug).trim().toLowerCase() : ''

      if (!categoryId && catSlug) {
        const res = await categoriesService.list({ page: 1, limit: 200, isActive: true })
        const list = Array.isArray(res?.data) ? res.data : []
        const match = list.find((c) => String(c?.slug || '').toLowerCase() === catSlug)
        if (!match?._id) throw new Error('Category not found')
        categoryId = String(match._id)
      }

      if (!subCategoryId && scSlug) {
        let list = []
        if (categoryId) {
          const res = await subcategoriesService.list({ page: 1, limit: 500, isActive: true, categoryId })
          list = Array.isArray(res?.data) ? res.data : []
        }
        if (!list.length) {
          const res = await subcategoriesService.list({ page: 1, limit: 500, isActive: true })
          list = Array.isArray(res?.data) ? res.data : []
        }
        const match = list.find((s) => String(s?.slug || '').toLowerCase() === scSlug)
        if (!match?._id) throw new Error('Subcategory not found')
        subCategoryId = String(match._id)
        if (!categoryId && match?.category) categoryId = String(match.category)
      }

      return { categoryId, subCategoryId }
    }

    resolveFilters()
      .then(({ categoryId, subCategoryId }) =>
        productsService.list({
          page: 1,
          limit: 200,
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined
        })
      )
      .then((res) => {
        if (!alive) return
        setAllProducts(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load products'
        setError(message)
        setAllProducts([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [location.search, categorySlug, subCategorySlug])

  const priceRange = useMemo(() => {
    const values = allProducts.map((p) => Number(p.priceInr || 0)).filter((n) => Number.isFinite(n) && n > 0)
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 0
    return { min, max }
  }, [allProducts])

  const [minPrice, setMinPrice] = useState(() => priceRange.min)
  const [maxPrice, setMaxPrice] = useState(() => priceRange.max)

  useEffect(() => {
    if (hasInitPrice) return
    if (!priceRange.max) return
    queueMicrotask(() => {
      setMinPrice(priceRange.min)
      setMaxPrice(priceRange.max)
      setHasInitPrice(true)
    })
  }, [priceRange.min, priceRange.max, hasInitPrice])

  const categoryOptions = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.category).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [allProducts])

  const categoryCounts = useMemo(() => toCountMap(allProducts.map((p) => p.category).filter(Boolean)), [allProducts])
  const metalCounts = useMemo(() => toCountMap(allProducts.map((p) => p.metal).filter(Boolean)), [allProducts])
  const stoneCounts = useMemo(() => toCountMap(allProducts.map((p) => p.stone).filter(Boolean)), [allProducts])
  const purityCounts = useMemo(() => toCountMap(allProducts.map((p) => p.purity).filter(Boolean)), [allProducts])

  const metalOptions = useMemo(() => Array.from(new Set(allProducts.map((p) => p.metal))).filter(Boolean), [allProducts])
  const stoneOptions = useMemo(() => Array.from(new Set(allProducts.map((p) => p.stone))).filter(Boolean), [allProducts])
  const purityOptions = useMemo(() => Array.from(new Set(allProducts.map((p) => p.purity))).filter(Boolean), [allProducts])

  const clearAll = () => {
    setQuery('')
    setSort('Featured')
    setTopCategory('All')
    setOnlyNew(false)
    setOnlySale(false)
    setCategories([])
    setMetals([])
    setStones([])
    setPurities([])
    setInStockOnly(false)
    setMinRating(0)
    setMinPrice(priceRange.min)
    setMaxPrice(priceRange.max)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const minP = Math.max(0, Number(minPrice || 0))
    const maxP = Math.max(minP, Number(maxPrice || 0))

    return allProducts.filter((p) => {
      const matchesQuery = !q || `${p.name} ${p.category} ${p.metal} ${p.stone} ${p.purity}`.toLowerCase().includes(q)
      const matchesTopCategory = topCategory === 'All' || p.category === topCategory
      const matchesCategories = categories.length === 0 || categories.includes(p.category)
      const matchesMetals = metals.length === 0 || metals.includes(p.metal)
      const matchesStones = stones.length === 0 || stones.includes(p.stone)
      const matchesPurities = purities.length === 0 || purities.includes(p.purity)
      const matchesStock = !inStockOnly || Boolean(p.inStock)
      const matchesRating = !minRating || Number(p.rating || 0) >= minRating
      const matchesPrice = Number(p.priceInr || 0) >= minP && Number(p.priceInr || 0) <= maxP
      const isSale = Boolean(p.compareAtInr) && Number(p.compareAtInr) > Number(p.priceInr)
      const matchesSale = !onlySale || isSale
      const matchesNew = !onlyNew || p.badge === 'New'
      return (
        matchesQuery &&
        matchesTopCategory &&
        matchesCategories &&
        matchesMetals &&
        matchesStones &&
        matchesPurities &&
        matchesStock &&
        matchesRating &&
        matchesPrice &&
        matchesSale &&
        matchesNew
      )
    })
  }, [query, topCategory, categories, metals, stones, purities, inStockOnly, minRating, minPrice, maxPrice, onlySale, onlyNew, allProducts])

  const results = useMemo(() => {
    const base = filtered.slice()
    if (sort === 'New Arrivals') return base.sort((a, b) => (b.badge === 'New') - (a.badge === 'New'))
    if (sort === 'Best Seller') return base.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
    if (sort === 'Price: Low to High') return base.sort((a, b) => Number(a.priceInr || 0) - Number(b.priceInr || 0))
    if (sort === 'Price: High to Low') return base.sort((a, b) => Number(b.priceInr || 0) - Number(a.priceInr || 0))
    return base.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }, [filtered, sort])

  const wishlistIds = useMemo(() => {
    void storageVersion
    return new Set(wishlistStore.getIds())
  }, [storageVersion])

  const bannerImage = 'https://unsplash.com/photos/2zHQhfEpisc/download?force=true&w=2400'
  const bannerSideImage = 'https://unsplash.com/photos/Lqfqsij4EvQ/download?force=true&w=1800'

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
          ) : null}

          <div className="rounded-3xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <select
                      value={topCategory}
                      onChange={(e) => setTopCategory(e.target.value)}
                      className="h-10 appearance-none rounded-full border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-900 outline-none hover:bg-[#fbf7f3]"
                    >
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnlyNew((v) => !v)}
                    className={cn(
                      'h-10 rounded-full border px-4 text-sm font-semibold transition',
                      onlyNew
                        ? 'border-[#2b2118] bg-[#2b2118] text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                    )}
                  >
                    New Arrivals
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlySale((v) => !v)}
                    className={cn(
                      'h-10 rounded-full border px-4 text-sm font-semibold transition',
                      onlySale
                        ? 'border-[#2b2118] bg-[#2b2118] text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                    )}
                  >
                    Sale
                  </button>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                  <div className="relative w-full sm:w-[340px]">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.7" />
                        <path d="m21 21-4.4-4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products..."
                      className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
                    />
                  </div>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none hover:bg-[#fbf7f3] sm:w-auto"
                  >
                    {['Featured', 'New Arrivals', 'Best Seller', 'Price: Low to High', 'Price: High to Low'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={clearAll}
                    className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3] sm:w-auto"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="space-y-4">
                <FilterSection
                  title="Filters"
                  footer={
                    <button
                      type="button"
                      onClick={clearAll}
                      className="w-full rounded-xl bg-[#2b2118] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f1711]"
                    >
                      Reset all
                    </button>
                  }
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInStockOnly((v) => !v)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-semibold',
                        inStockOnly
                          ? 'border-[#2b2118] bg-[#2b2118] text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                      )}
                    >
                      In stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlySale((v) => !v)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-semibold',
                        onlySale
                          ? 'border-[#2b2118] bg-[#2b2118] text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                      )}
                    >
                      On sale
                    </button>
                  </div>
                </FilterSection>

                <FilterSection
                  title="Category"
                  footer={
                    categoryOptions.length > 7 ? (
                      <button
                        type="button"
                        onClick={() => setCategories(categoryOptions.filter((c) => c !== 'All'))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
                      >
                        Show more
                      </button>
                    ) : null
                  }
                >
                  {(categoryOptions.filter((c) => c !== 'All').slice(0, 7)).map((c) => (
                    <FilterRow
                      key={c}
                      label={c}
                      count={categoryCounts.get(c) || 0}
                      checked={categories.includes(c)}
                      onChange={() => setCategories((prev) => toggleValue(prev, c))}
                    />
                  ))}
                </FilterSection>

                <FilterSection title="Metal">
                  {metalOptions.slice(0, 6).map((m) => (
                    <FilterRow
                      key={m}
                      label={m}
                      count={metalCounts.get(m) || 0}
                      checked={metals.includes(m)}
                      onChange={() => setMetals((prev) => toggleValue(prev, m))}
                    />
                  ))}
                </FilterSection>

                <FilterSection title="Stone">
                  {stoneOptions.slice(0, 6).map((s) => (
                    <FilterRow
                      key={s}
                      label={s}
                      count={stoneCounts.get(s) || 0}
                      checked={stones.includes(s)}
                      onChange={() => setStones((prev) => toggleValue(prev, s))}
                    />
                  ))}
                </FilterSection>

                <FilterSection title="Purity">
                  {purityOptions.slice(0, 6).map((p) => (
                    <FilterRow
                      key={p}
                      label={p}
                      count={purityCounts.get(p) || 0}
                      checked={purities.includes(p)}
                      onChange={() => setPurities((prev) => toggleValue(prev, p))}
                    />
                  ))}
                </FilterSection>

                <FilterSection title="Price">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">Min</div>
                      <input
                        value={String(minPrice)}
                        onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ''))}
                        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-300"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">Max</div>
                      <input
                        value={String(maxPrice)}
                        onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
                        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-300"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </FilterSection>

                <FilterSection title="Rating">
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 4, 4.5, 4.8].map((r) => (
                      <button
                        key={String(r)}
                        type="button"
                        onClick={() => setMinRating(r)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-xs font-semibold',
                          minRating === r
                            ? 'border-[#2b2118] bg-[#2b2118] text-white'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                        )}
                      >
                        {r ? (
                          <span className="inline-flex items-center gap-2">
                            <StarRow value={r} />
                            <span>{r}+</span>
                          </span>
                        ) : (
                          'Any'
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </aside>

            <section className="lg:col-span-9">
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                  <div className="relative min-h-[240px] bg-zinc-100 lg:min-h-[320px]">
                    <img src={bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/65 to-white/25" />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Collections</div>
                    <div className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl">
                      Explore the various collection
                      <br />
                      of Ewith Jewellery
                    </div>
                    <div className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
                      Don&apos;t miss out on stunning designs—crafted for daily elegance and special moments.
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setOnlyNew(true)}
                        className="rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]"
                      >
                        New arrivals
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnlySale(true)}
                        className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-[#fbf7f3]"
                      >
                        Sale picks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Product List</div>
                  <div className="mt-1 text-xs text-zinc-500">{loading ? 'Loading...' : `${results.length} items`}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 sm:flex">
                    {topCategory === 'All' ? 'All products' : topCategory}
                  </div>
                  <div className="hidden h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 sm:flex">
                    {formatInr(minPrice)} - {formatInr(maxPrice)}
                  </div>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                  No products found. Try adjusting filters.
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                {results.map((p, idx) => {
                  const percentOff = formatPercentOff(p)
                  const isSale = Boolean(p.compareAtInr) && Number(p.compareAtInr) > Number(p.priceInr)
                  const isWishlisted = wishlistIds.has(p.id)
                  return (
                    <MotionDiv
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                      className="group"
                    >
                      <Link to={`/products/${p.id}`} className="block">
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

                            <div className="absolute left-2 top-2 flex flex-wrap items-center gap-2">
                              {!p.inStock ? (
                                <span className="bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-sm">
                                  Sold Out
                                </span>
                              ) : null}
                              {p.badge ? (
                                <span className="border border-zinc-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 backdrop-blur-sm">
                                  {p.badge}
                                </span>
                              ) : null}
                              {isSale && percentOff ? (
                                <span className="bg-[#2b2118] px-2.5 py-1 text-[11px] font-semibold text-white">{percentOff}</span>
                              ) : null}
                            </div>

                            <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                className={cn(
                                  'grid h-10 w-10 place-items-center rounded-full border bg-white/90 text-zinc-800 backdrop-blur hover:bg-white',
                                  isWishlisted ? 'border-rose-200 text-rose-600' : 'border-zinc-200'
                                )}
                                aria-label="Wishlist"
                                onClick={(e) => {
                                  e.preventDefault()
                                  wishlistStore.toggle(p.id)
                                  setStorageVersion((v) => v + 1)
                                }}
                              >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true">
                                  <path
                                    d="M12 20.5s-7.5-4.6-9.3-9.2C1.2 7.8 3.6 5 6.6 5c1.7 0 3.2.8 4.1 2 1-1.2 2.4-2 4.1-2 3 0 5.4 2.8 3.9 6.3C19.5 15.9 12 20.5 12 20.5Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                disabled={!p.inStock}
                                className={cn(
                                  'grid h-10 w-10 place-items-center rounded-full border bg-white/90 text-zinc-800 backdrop-blur',
                                  p.inStock ? 'border-zinc-200 hover:bg-white' : 'cursor-not-allowed border-zinc-200 text-zinc-300'
                                )}
                                aria-label="Quick add"
                                onClick={async (e) => {
                                  e.preventDefault()
                                  if (!p.inStock) return
                                  try {
                                    await cartService.add(p.id)
                                    setStorageVersion((v) => v + 1)
                                  } catch (err) {
                                    if (err instanceof ApiError && err.status === 401) {
                                      navigate('/auth')
                                      return
                                    }
                                  }
                                }}
                              >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                                  <path d="M8 8h13l-1.1 6.2a2 2 0 0 1-2 1.6H10.1a2 2 0 0 1-2-1.6L7.2 4.8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="1.5" />
                                  <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between gap-4 p-3">
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-semibold uppercase tracking-wide text-zinc-900 sm:text-sm">{p.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">{p.category}</div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="inline-flex items-center whitespace-nowrap border border-[#2b2118]/15 bg-[#fbf7f3] px-3 py-1 text-[13px] font-bold text-[#2b2118] sm:text-sm">
                                {formatInr(p.priceInr)}
                              </span>
                              {p.compareAtInr ? <div className="mt-1 text-xs text-zinc-500 line-through">{formatInr(p.compareAtInr)}</div> : null}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </MotionDiv>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              <div className="relative min-h-[200px] bg-zinc-100 lg:min-h-[260px]">
                <img src={bannerSideImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-white/20" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Need help choosing?</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Shop by category</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.filter((c) => c !== 'All').slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTopCategory(c)}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setTopCategory('All')}
                    className="rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
