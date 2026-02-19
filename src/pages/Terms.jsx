import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function Terms() {
  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Terms of Service</div>
              <div className="mt-1 text-xs text-zinc-500">Rules and conditions for using our website.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/shipping"
                className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Shipping
              </Link>
              <Link
                to="/products"
                className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]"
              >
                Products
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="space-y-4 text-sm leading-relaxed text-zinc-700">
              <div>By accessing or using this website, you agree to these Terms of Service.</div>
              <div>
                Product images are for reference. Minor variations may occur due to photography, lighting, and handcrafted manufacturing.
              </div>
              <div>
                Prices, availability, and offers may change without prior notice. Orders may be cancelled or refunded in case of stock or pricing errors.
              </div>
              <div>
                You are responsible for providing accurate shipping, contact, and payment information. We are not responsible for delays caused by incorrect details.
              </div>
              <div>For questions, please contact us via the Contact page.</div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
