import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApiError, productsService } from '../services/index.js'
import { formatInr } from './products.data.js'

const MotionDiv = motion.div

const MotionSection = ({ children, className, delay = 0 }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </MotionDiv>
)

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [bestsellers, setBestsellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setLoading(true)
      setError('')
    })
    Promise.all([
      productsService.list({ page: 1, limit: 4, featured: true }),
      productsService.list({ page: 1, limit: 8, bestSeller: true })
    ])
      .then(([featuredRes, bestRes]) => {
        if (!alive) return
        setFeaturedProducts(Array.isArray(featuredRes?.data) ? featuredRes.data : [])
        setBestsellers(Array.isArray(bestRes?.data) ? bestRes.data : [])
      })
      .catch((err) => {
        if (!alive) return
        const message = err instanceof ApiError ? err.message : err?.message ? String(err.message) : 'Failed to load products'
        setError(message)
        setFeaturedProducts([])
        setBestsellers([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden bg-[#2b2118]">
        <MotionDiv
          initial={{ scale: 1.1, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 h-full w-full"
        >
          <img
            src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop"
            alt="Hero Model"
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/10" />
        </MotionDiv>

        <div className="relative mx-auto flex min-h-screen max-w-screen-2xl flex-col justify-center px-4 py-24 text-white sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
              Handcrafted jewellery
              <span className="h-1 w-1 rounded-full bg-white/70" aria-hidden="true" />
              Est. 2024
            </div>
            <h1 className="mt-6 font-serif text-6xl font-medium leading-none tracking-tight drop-shadow-sm sm:text-8xl md:text-9xl">EWITH</h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/80 sm:text-lg">
              Everyday elegance, crafted to last. Explore curated designs for modern moments.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex h-11 w-full items-center justify-center bg-white px-6 text-sm font-semibold text-[#2b2118] transition hover:bg-white/90 sm:w-auto"
              >
                Shop collection
              </Link>
              <Link
                to="/about"
                className="inline-flex h-11 w-full items-center justify-center border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:w-auto"
              >
                Our story
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* Section 1: Creating, Crafting & Wearing */}
      <section className="border-t border-zinc-100 px-4 py-20 sm:px-6 lg:px-8">
        <MotionSection className="mx-auto max-w-screen-2xl">
          {error ? <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-md">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Featured</div>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-zinc-900 sm:text-4xl md:text-5xl">
                Creating, Crafting <br /> & Wearing.
              </h2>
            </div>
            <div className="max-w-sm text-sm leading-relaxed text-zinc-600">
              Unique jewellery that tells a story. Discover our latest collection of handcrafted pieces designed for the modern muse.
              <div className="mt-4">
                <Link to="/products" className="inline-flex h-11 items-center border border-zinc-200 bg-white px-5 text-xs font-semibold uppercase tracking-widest text-zinc-900 transition hover:bg-zinc-50">
                  Shop all
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-10 lg:grid-cols-4">
            {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `skeleton-${i}` })) : featuredProducts).map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group block">
                <div className="overflow-hidden border border-zinc-200 bg-white shadow-sm transition-all will-change-transform group-hover:-translate-y-0.5 group-hover:border-zinc-300 group-hover:shadow-md">
                  <div className="relative aspect-[1/1] overflow-hidden bg-zinc-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-100" />
                    )}
                    {product.id && product.id.startsWith('skeleton-') ? null : !product.inStock ? (
                      <div className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-sm">
                        Sold Out
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-between gap-4 p-3 sm:p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-semibold uppercase tracking-wide text-zinc-900 sm:text-sm sm:whitespace-normal sm:overflow-visible">
                        {product.name || ' '}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">{product.category || ' '}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center whitespace-nowrap border border-[#2b2118]/15 bg-[#fbf7f3] px-3 py-1 text-[13px] font-bold text-[#2b2118] sm:text-sm">
                        {product.priceInr ? formatInr(product.priceInr) : ' '}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </MotionSection>
      </section>

      {/* Section 2: Emotion embraces technique */}
      <section className="bg-[#2b2118] px-4 py-24 text-white sm:px-6 lg:px-8">
        <MotionSection className="mx-auto max-w-screen-2xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Design</div>
              <h2 className="font-serif text-4xl leading-tight md:text-5xl lg:text-6xl">
                Emotion <br /> embraces <br /> technique.
              </h2>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-white/75">
                Our pieces are more than just accessories; they are feelings captured in gold and silver. 
                We combine traditional craftsmanship with contemporary design to create heirlooms for the future.
              </p>
              <div className="mt-8">
                <Link to="/about" className="inline-flex h-11 items-center border border-white/20 bg-white/10 px-5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/15">
                  Read our story
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 lg:col-span-8 lg:grid-cols-3">
              <div className="col-span-1 space-y-4 pt-12">
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=800&auto=format&fit=crop" alt="Lifestyle 1" className="h-full w-full object-cover opacity-90" />
                </div>
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=800&auto=format&fit=crop" alt="Lifestyle 2" className="h-full w-full object-cover opacity-90" />
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop" alt="Lifestyle 3" className="h-full w-full object-cover opacity-90" />
                </div>
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop" alt="Lifestyle 4" className="h-full w-full object-cover opacity-90" />
                </div>
              </div>
              <div className="col-span-2 hidden space-y-4 pt-24 lg:col-span-1 lg:block">
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                   <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop" alt="Lifestyle 5" className="h-full w-full object-cover opacity-90" />
                </div>
              </div>
            </div>
          </div>
        </MotionSection>
      </section>

      {/* Section 3: Bestsellers */}
      <section className="py-24">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <MotionSection>
            <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Most loved</div>
                <h2 className="mt-3 font-serif text-4xl leading-tight text-zinc-900 md:text-5xl">Bestsellers</h2>
              </div>
              <div className="max-w-sm text-sm leading-relaxed text-zinc-600 hidden md:block">
                  Pieces loved by you. Discover the favorites that have found their way into collections around the world.
              </div>
            </div>
          </MotionSection>
        </div>

        <MotionSection delay={0.2}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {(loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `skeleton-${i}` })) : bestsellers).map((product) => (
              <Link 
                key={product.id} 
                to={product.id ? `/products/${product.id}` : '#'} 
                className="group block"
              >
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
                  {product.badge && (
                     <div className="absolute left-3 top-3 bg-zinc-900/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      {product.badge}
                    </div>
                  )}
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
        </MotionSection>
        
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="mt-10 text-center">
            <Link
              to="/bestsellers"
              className="inline-flex h-11 items-center border border-zinc-200 bg-white px-5 text-xs font-semibold uppercase tracking-widest text-zinc-900 transition hover:bg-zinc-50"
            >
              See more bestsellers
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: We believe in our process */}
      <section className="bg-[#fbf7f3] px-4 py-24 sm:px-6 lg:px-8">
        <MotionSection className="mx-auto max-w-screen-2xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
            <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-square">
               <img 
                src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop" 
                alt="Process" 
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="flex flex-col justify-center">
              <h2 className="font-serif text-4xl leading-tight text-zinc-900 md:text-5xl lg:text-6xl">
                We believe <br /> in our process
              </h2>
              <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
                <p>
                  Every piece is handcrafted in our studio with care and attention to detail. 
                  We believe in slow fashion and creating pieces that last a lifetime.
                </p>
                <p>
                  Our materials are ethically sourced, ensuring that beauty doesn't come at a cost to the planet.
                  From recycled gold to conflict-free stones, we are committed to responsible luxury.
                </p>
              </div>
              
              <div className="mt-12">
                 <img 
                  src="https://images.unsplash.com/photo-1603974372039-adc49044b6bd?q=80&w=800&auto=format&fit=crop" 
                  alt="Detail" 
                  className="h-48 w-full object-cover object-center sm:w-64"
                />
              </div>

              <div className="mt-8">
                <Link to="/about" className="group inline-flex items-center gap-2 border-b border-zinc-900 pb-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-900">
                  More About Us
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        </MotionSection>
      </section>
    </div>
  )
}
