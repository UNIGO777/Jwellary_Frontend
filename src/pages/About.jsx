import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function About() {
  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="bg-transparent">
        <section className="relative -mt-20 overflow-hidden bg-[#2b2118] pt-20 text-white">
          <div className="absolute inset-0 opacity-60">
            <img
              src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=2400&auto=format&fit=crop"
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>

          <div className="relative mx-auto  px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">OM ABHUSAN</div>
              <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">About Us</h1>
              <p className="mt-6 text-sm leading-relaxed text-white/80 sm:text-base">
                Handcrafted jewellery made with patience, precision, and a modern sensibility. We design pieces that feel timeless,
                personal, and effortless to wear.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto  px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-serif text-4xl leading-tight text-[#2b2118] sm:text-5xl">Our story</h2>
              <p className="mt-6 text-sm leading-relaxed text-zinc-700 sm:text-base">
                Om Abhusan Jwellary started with a simple idea: jewellery should carry meaning. Every piece is designed to complement your everyday
                style while feeling special enough for your best moments.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-700 sm:text-base">
                From sketch to final polish, we focus on proportion, finishing, and comfort so each piece looks beautiful and feels
                right on the skin.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Craft</div>
                  <div className="mt-3 text-lg font-semibold text-[#2b2118]">Hand-finished details</div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-700">
                    Clean lines, secure settings, and refined surfaces that elevate every design.
                  </div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Materials</div>
                  <div className="mt-3 text-lg font-semibold text-[#2b2118]">Chosen with care</div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-700">
                    Durable metals and stones selected to keep their beauty over time.
                  </div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Design</div>
                  <div className="mt-3 text-lg font-semibold text-[#2b2118]">Modern & timeless</div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-700">
                    Pieces that feel current now and still look right years later.
                  </div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Care</div>
                  <div className="mt-3 text-lg font-semibold text-[#2b2118]">Made to be worn</div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-700">
                    Comfortable silhouettes that fit naturally into daily life.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl border border-zinc-200 bg-white p-8 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold text-[#2b2118]">Explore the collection</div>
              <div className="mt-1 text-sm text-zinc-700">Browse bestsellers and new pieces designed for you.</div>
            </div>
            <Link
              to="/products"
              className="grid h-11 place-items-center rounded-full bg-[#2b2118] px-6 text-sm font-semibold text-white hover:bg-[#1f1711]"
            >
              Shop now
            </Link>
          </div>
        </section>
      </div>
    </MotionDiv>
  )
}
