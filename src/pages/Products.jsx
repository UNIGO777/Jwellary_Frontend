import { motion } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatInr } from './products.data.js'
import { ApiError, cartService, categoriesService, productsService, subcategoriesService, wishlistStore } from '../services/index.js'
import ProductCard from '../components/ProductCard.jsx'

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
  const pageSize = 30
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Featured')
  const [storageVersion, setStorageVersion] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const loadMoreRef = useRef(null)
  const pageRef = useRef(1)
  const requestKeyRef = useRef(0)
  const serverFiltersRef = useRef({ categoryId: '', subCategoryId: '' })

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('')
  const [categoryGroups, setCategoryGroups] = useState([])
  const [catsError, setCatsError] = useState('')

  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [selectedMaterialType, setSelectedMaterialType] = useState('')
  const [materialTypes, setMaterialTypes] = useState({ gold: [], silver: [], diamond: [] })
  const [materialTypesError, setMaterialTypesError] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const key = ['q', 'search', 'term', 'category'].find((k) => sp.has(k))
    const next = key ? (sp.get(key) || '').trim() : ''
    queueMicrotask(() => setQuery(next))
  }, [location.search])

  const buildProductsUrl = ({ categoryId, subCategoryId } = {}) => {
    const sp = new URLSearchParams()
    if (categoryId) sp.set('categoryId', String(categoryId))
    if (subCategoryId) sp.set('subCategoryId', String(subCategoryId))
    const qs = sp.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }

  useEffect(() => {
    let alive = true
    const requestKey = requestKeyRef.current + 1
    requestKeyRef.current = requestKey
    const sp = new URLSearchParams(location.search)
    const categoryIdFromSearch = (sp.get('categoryId') || '').trim()
    const subCategoryIdFromSearch = (sp.get('subCategoryId') || '').trim()

    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setLoadingMore(false)
      setError('')
      setHasMore(true)
      setTotal(0)
      pageRef.current = 1
      setAllProducts([])
      setMinPrice(null)
      setMaxPrice(null)
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
      .then(({ categoryId, subCategoryId }) => {
        if (!alive) return null
        setSelectedCategoryId(categoryId || '')
        setSelectedSubCategoryId(subCategoryId || '')
        serverFiltersRef.current = { categoryId: categoryId || '', subCategoryId: subCategoryId || '' }
        return productsService.list({
          page: 1,
          limit: pageSize,
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined
        })
      })
      .then((res) => {
        if (!alive || !res) return
        if (requestKeyRef.current !== requestKey) return
        const list = Array.isArray(res?.data) ? res.data : []
        const nextTotal = Number(res?.total || 0)
        setTotal(nextTotal)
        setAllProducts(list)
        setHasMore(nextTotal ? list.length < nextTotal : list.length >= pageSize)
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load products'
        setError(message)
        setAllProducts([])
        setHasMore(false)
        setTotal(0)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [location.search, categorySlug, subCategorySlug, pageSize])

  useEffect(() => {
    if (loading) return
    if (!hasMore) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        if (loadingMore) return
        if (!hasMore) return
        setLoadingMore(true)
        const requestKey = requestKeyRef.current
        const nextPage = pageRef.current + 1
        const { categoryId, subCategoryId } = serverFiltersRef.current || {}
        productsService
          .list({
            page: nextPage,
            limit: pageSize,
            categoryId: categoryId || undefined,
            subCategoryId: subCategoryId || undefined
          })
          .then((res) => {
            if (requestKeyRef.current !== requestKey) return
            const list = Array.isArray(res?.data) ? res.data : []
            const nextTotal = Number(res?.total || 0)
            setTotal(nextTotal)
            setAllProducts((prev) => {
              const merged = prev.concat(list)
              setHasMore(nextTotal ? merged.length < nextTotal : list.length >= pageSize)
              return merged
            })
            pageRef.current = nextPage
          })
          .catch(() => {})
          .finally(() => {
            if (requestKeyRef.current === requestKey) setLoadingMore(false)
          })
      },
      { root: null, rootMargin: '400px 0px', threshold: 0.01 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, pageSize])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileFiltersOpen])

  useEffect(() => {
    let alive = true
    Promise.all([
      categoriesService.list({ page: 1, limit: 200, isActive: true }),
      subcategoriesService.list({ page: 1, limit: 500, isActive: true })
    ])
      .then(([cRes, sRes]) => {
        if (!alive) return
        setCatsError('')
        const categories = Array.isArray(cRes?.data) ? cRes.data : []
        const subcategories = Array.isArray(sRes?.data) ? sRes.data : []

        const subByCategory = new Map()
        for (const sc of subcategories) {
          const key = sc?.category ? String(sc.category) : ''
          if (!key) continue
          const list = subByCategory.get(key) || []
          list.push(sc)
          subByCategory.set(key, list)
        }

        const groups = categories
          .map((c) => {
            const id = c?._id ? String(c._id) : ''
            if (!id) return null
            const subs = subByCategory.get(id) || []
            if (!subs.length) return null
            const nextSubs = subs
              .slice()
              .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
              .map((s) => ({
                _id: s?._id ? String(s._id) : '',
                name: s?.name ? String(s.name) : '',
                slug: s?.slug ? String(s.slug) : ''
              }))
              .filter((s) => s._id && s.name)
            if (!nextSubs.length) return null
            return {
              category: {
                _id: id,
                name: c?.name ? String(c.name) : '',
                slug: c?.slug ? String(c.slug) : ''
              },
              subcategories: nextSubs
            }
          })
          .filter(Boolean)
          .sort((a, b) => String(a.category?.name || '').localeCompare(String(b.category?.name || '')))

        setCategoryGroups(groups)
      })
      .catch((err) => {
        if (!alive) return
        const message = err?.message ? String(err.message) : 'Failed to load categories'
        setCatsError(message)
        setCategoryGroups([])
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    productsService
      .materialTypes()
      .then((res) => {
        if (!alive) return
        setMaterialTypesError('')
        setMaterialTypes(res?.data || { gold: [], silver: [], diamond: [] })
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load material types'
        setMaterialTypesError(message)
        setMaterialTypes({ gold: [], silver: [], diamond: [] })
      })
    return () => {
      alive = false
    }
  }, [])

  const priceRange = useMemo(() => {
    const values = allProducts.map((p) => Number(p.priceInr || 0)).filter((n) => Number.isFinite(n) && n > 0)
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 0
    return { min, max }
  }, [allProducts])

  const effectiveMinPrice = minPrice === null ? priceRange.min : minPrice
  const effectiveMaxPrice = maxPrice === null ? priceRange.max : maxPrice

  const materialTypeOptions = useMemo(() => {
    if (!selectedMaterial) return []
    const list = materialTypes?.[selectedMaterial]
    return Array.isArray(list) ? list : []
  }, [materialTypes, selectedMaterial])

  const clearAll = () => {
    navigate('/products')
    setQuery('')
    setSort('Featured')
    setSelectedMaterial('')
    setSelectedMaterialType('')
    setInStockOnly(false)
    setMinRating(0)
    setMinPrice(null)
    setMaxPrice(null)
    setMobileFiltersOpen(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const minP = Math.max(0, Number(effectiveMinPrice || 0))
    const maxP = Math.max(minP, Number(effectiveMaxPrice || 0))

    return allProducts.filter((p) => {
      const matchesQuery = !q || `${p.name} ${p.category} ${p.metal} ${p.purity} ${p.material}`.toLowerCase().includes(q)
      const matchesMaterial = !selectedMaterial || p.material === selectedMaterial
      const matchesMaterialType = !selectedMaterialType || String(p.materialType || '') === String(selectedMaterialType)
      const matchesStock = !inStockOnly || Boolean(p.inStock)
      const matchesRating = !minRating || Number(p.rating || 0) >= minRating
      const matchesPrice = Number(p.priceInr || 0) >= minP && Number(p.priceInr || 0) <= maxP
      return (
        matchesQuery &&
        matchesMaterial &&
        matchesMaterialType &&
        matchesStock &&
        matchesRating &&
        matchesPrice
      )
    })
  }, [query, selectedMaterial, selectedMaterialType, inStockOnly, minRating, effectiveMinPrice, effectiveMaxPrice, allProducts])

  const pricePct = useMemo(() => {
    const min = Math.max(0, Number(priceRange.min || 0))
    const max = Math.max(min, Number(priceRange.max || 0))
    const denom = Math.max(1, max - min)
    const lo = Math.min(Math.max(Number(effectiveMinPrice || min), min), max)
    const hi = Math.min(Math.max(Number(effectiveMaxPrice || max), min), max)
    const left = ((lo - min) / denom) * 100
    const right = ((hi - min) / denom) * 100
    return { min, max, lo, hi, left, right }
  }, [priceRange.min, priceRange.max, effectiveMinPrice, effectiveMaxPrice])

  const selectedSubcategories = useMemo(() => {
    if (!selectedCategoryId) return []
    return categoryGroups.find((g) => g.category._id === selectedCategoryId)?.subcategories || []
  }, [categoryGroups, selectedCategoryId])

  const shopByCategoryGroup = useMemo(() => {
    if (!categoryGroups.length) return null
    if (selectedCategoryId) return categoryGroups.find((g) => g.category._id === selectedCategoryId) || categoryGroups[0]
    return categoryGroups[0]
  }, [categoryGroups, selectedCategoryId])

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) return 'All products'
    return categoryGroups.find((g) => g.category._id === selectedCategoryId)?.category?.name || 'Category'
  }, [selectedCategoryId, categoryGroups])

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

  const bannerSideImage = 'https://images.unsplash.com/photo-1613945407943-59cd755fd69e?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  const filtersPanel = (
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
              inStockOnly ? 'border-[#2b2118] bg-[#2b2118] text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
            )}
          >
            In stock
          </button>
        </div>
      </FilterSection>

      {selectedCategoryId ? (
        <FilterSection
          title="Subcategory"
          footer={
            selectedSubCategoryId ? (
              <button
                type="button"
                onClick={() => navigate(buildProductsUrl({ categoryId: selectedCategoryId }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Clear subcategory
              </button>
            ) : null
          }
        >
          {selectedSubcategories.length ? (
            selectedSubcategories.slice(0, 10).map((sc) => (
              <label key={sc._id} className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm text-zinc-700">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'grid h-4 w-4 place-items-center rounded border transition',
                      selectedSubCategoryId === sc._id ? 'border-[#2b2118] bg-[#2b2118]' : 'border-zinc-300 bg-white'
                    )}
                  >
                    {selectedSubCategoryId === sc._id ? (
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
                        <path
                          d="M5.5 12.2 10.3 17 18.5 7.8"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="truncate">{sc.name}</span>
                </span>
                <input
                  type="radio"
                  name="subcategory"
                  checked={selectedSubCategoryId === sc._id}
                  onChange={() => navigate(buildProductsUrl({ categoryId: selectedCategoryId, subCategoryId: sc._id }))}
                  className="sr-only"
                />
              </label>
            ))
          ) : (
            <div className="text-sm text-zinc-600">No subcategories found.</div>
          )}
        </FilterSection>
      ) : (
        <FilterSection title="Subcategory">
          <div className="text-sm text-zinc-600">{catsError ? catsError : 'Select a category to see subcategories.'}</div>
        </FilterSection>
      )}

      <FilterSection title="Metal">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'gold', label: 'Gold' },
            { k: 'silver', label: 'Silver' },
            { k: 'diamond', label: 'Diamond' }
          ].map((m) => (
            <button
              key={m.k}
              type="button"
              onClick={() => {
                setSelectedMaterial((prev) => (prev === m.k ? '' : m.k))
                setSelectedMaterialType('')
              }}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                selectedMaterial === m.k ? 'border-[#2b2118] bg-[#2b2118] text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {selectedMaterial ? (
        <FilterSection
          title={selectedMaterial === 'gold' ? 'Gold Type' : selectedMaterial === 'silver' ? 'Silver Type' : 'Diamond Type'}
          footer={
            selectedMaterialType ? (
              <button
                type="button"
                onClick={() => setSelectedMaterialType('')}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Clear type
              </button>
            ) : null
          }
        >
          {materialTypesError ? (
            <div className="text-sm text-zinc-600">{materialTypesError}</div>
          ) : materialTypeOptions.length ? (
            <div className="grid gap-2">
              {materialTypeOptions.slice(0, 10).map((t) => {
                const val = String(t?.value ?? '')
                const label = String(t?.label ?? '')
                if (!val || !label) return null
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedMaterialType(val)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                      selectedMaterialType === val
                        ? 'border-[#2b2118] bg-[#2b2118] text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-zinc-600">No types found.</div>
          )}
        </FilterSection>
      ) : null}

      <FilterSection title="Price">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-700">
          <div className="rounded-full border border-zinc-200 bg-white px-3 py-1">{formatInr(Number(effectiveMinPrice || 0))}</div>
          <div className="text-zinc-400">—</div>
          <div className="rounded-full border border-zinc-200 bg-white px-3 py-1">{formatInr(Number(effectiveMaxPrice || 0))}</div>
        </div>

        <div className="relative mt-4 h-10">
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200" />
          <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#2b2118]" style={{ left: `${pricePct.left}%`, right: `${100 - pricePct.right}%` }} />
          <input
            type="range"
            min={pricePct.min}
            max={pricePct.max}
            step={100}
            value={pricePct.lo}
            onChange={(e) => {
              const next = Math.min(Number(e.target.value), Number(effectiveMaxPrice || 0))
              setMinPrice(next)
            }}
            className="price-range absolute inset-0 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min={pricePct.min}
            max={pricePct.max}
            step={100}
            value={pricePct.hi}
            onChange={(e) => {
              const next = Math.max(Number(e.target.value), Number(effectiveMinPrice || 0))
              setMaxPrice(next)
            }}
            className="price-range absolute inset-0 w-full appearance-none bg-transparent"
          />
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
                minRating === r ? 'border-[#2b2118] bg-[#2b2118] text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
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
  )

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto  px-4 py-8 sm:px-6 lg:px-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
          ) : null}

          <div className="rounded-3xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => navigate('/products')}
                      className={cn(
                        'h-10 rounded-full border px-4 text-sm font-semibold transition',
                        !selectedCategoryId
                          ? 'border-[#2b2118] bg-[#2b2118] text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                      )}
                    >
                      All
                    </button>
                    {categoryGroups.slice(0, 8).map((g) => (
                      <button
                        key={g.category._id}
                        type="button"
                        onClick={() => navigate(buildProductsUrl({ categoryId: g.category._id }))}
                        className={cn(
                          'h-10 rounded-full border px-4 text-sm font-semibold transition',
                          selectedCategoryId === g.category._id
                            ? 'border-[#2b2118] bg-[#2b2118] text-white'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                        )}
                      >
                        {g.category.name}
                      </button>
                    ))}
                  </div>
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
                    onClick={() => setMobileFiltersOpen(true)}
                    className="h-10 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3] lg:hidden"
                  >
                    Filters
                  </button>

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

          {mobileFiltersOpen ? (
            <div className="fixed inset-0 z-50 bg-white">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                  <div className="text-base font-semibold text-zinc-900">Filters</div>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">{filtersPanel}</div>
                <div className="border-t border-zinc-200 p-4">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full rounded-xl bg-[#2b2118] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]"
                  >
                    View products
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
              <div className="lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">{filtersPanel}</div>
            </aside>

            <section className="lg:col-span-9">
              

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Product List</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {loading ? 'Loading...' : `${results.length} shown • ${allProducts.length}${total ? ` of ${total}` : ''}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 sm:flex">
                    {selectedCategoryLabel}
                  </div>
                  <div className="hidden h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 sm:flex">
                    {formatInr(effectiveMinPrice)} - {formatInr(effectiveMaxPrice)}
                  </div>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                  No products found. Try adjusting filters.
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                {results.map((p, idx) => (
                  <MotionDiv
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                    className="group"
                  >
                    <ProductCard
                      product={p}
                      showPercentOff
                      showCompareAt
                      showSizes
                      isWishlisted={wishlistIds.has(p.id)}
                      onToggleWishlist={() => {
                        wishlistStore.toggle(p.id)
                        setStorageVersion((v) => v + 1)
                      }}
                      onQuickAdd={async () => {
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
                    />
                  </MotionDiv>
                ))}
                <div ref={loadMoreRef} className="col-span-full h-px" />
                {loadingMore ? (
                  <div className="col-span-full flex items-center justify-center py-4 text-sm font-semibold text-zinc-700">
                    Loading more...
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl hidden md:block border border-zinc-200 bg-white">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              <div className="relative min-h-[200px] bg-zinc-100 lg:min-h-[260px]">
                <img src={bannerSideImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                
              </div>
              <div className="p-6 sm:p-8">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Need help choosing?</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Shop by category</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryGroups.length ? (
                    categoryGroups.slice(0, 6).map((g) => (
                      <button
                        key={g.category._id}
                        type="button"
                        onClick={() => navigate(buildProductsUrl({ categoryId: g.category._id }))}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm font-semibold transition',
                          (shopByCategoryGroup?.category?._id || '') === g.category._id
                            ? 'border-[#2b2118] bg-[#2b2118] text-white'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#fbf7f3]'
                        )}
                      >
                        {g.category.name}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-600">{catsError ? catsError : 'No categories yet.'}</div>
                  )}
                </div>

                {shopByCategoryGroup?.subcategories?.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Sub categories</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {shopByCategoryGroup.subcategories.slice(0, 10).map((sc) => (
                        <button
                          key={sc._id}
                          type="button"
                          onClick={() =>
                            navigate(
                              buildProductsUrl({
                                categoryId: shopByCategoryGroup.category._id,
                                subCategoryId: sc._id
                              })
                            )
                          }
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
                        >
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
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
