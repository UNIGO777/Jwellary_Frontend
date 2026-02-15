import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function Shipping() {
  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Shipping & Returns</div>
              <div className="mt-1 text-xs text-zinc-500">Everything you need to know before and after you buy.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/products"
                className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Products
              </Link>
              <Link
                to="/contact"
                className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-8">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">Shipping</div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">
                  <div>Orders are processed after payment confirmation.</div>
                  <div>Delivery timelines can vary based on your location and product availability.</div>
                  <div>Once shipped, you’ll receive tracking details if available.</div>
                </div>

                <div className="mt-8 text-sm font-semibold text-zinc-900">Returns</div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">
                  <div>If your order arrives damaged or incorrect, contact us as soon as possible.</div>
                  <div>Return/Exchange eligibility may depend on the product type and condition.</div>
                  <div>For any return request, please share your order id on the Contact page.</div>
                </div>
              </div>
            </section>

            <aside className="lg:col-span-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">Quick help</div>
                <div className="mt-4 space-y-3 text-sm text-zinc-700">
                  <Link to="/faq" className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 hover:bg-[#fbf7f3]">
                    FAQ
                  </Link>
                  <Link to="/care" className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 hover:bg-[#fbf7f3]">
                    Jewellery Care
                  </Link>
                  <Link to="/orders" className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 hover:bg-[#fbf7f3]">
                    Orders
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
