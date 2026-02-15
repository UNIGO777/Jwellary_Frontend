import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function Care() {
  const tips = [
    { t: 'Store safely', d: 'Keep pieces in a soft pouch or box to avoid scratches.' },
    { t: 'Avoid chemicals', d: 'Remove jewellery before using perfume, lotions, or cleaning products.' },
    { t: 'Keep dry', d: 'Avoid water exposure, especially for items with stones or intricate work.' },
    { t: 'Clean gently', d: 'Use a soft cloth for polishing. For deeper cleaning, contact us for guidance.' }
  ]

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Jewellery Care</div>
              <div className="mt-1 text-xs text-zinc-500">Simple care tips to keep your pieces beautiful.</div>
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

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {tips.map((x) => (
              <div key={x.t} className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">{x.t}</div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-700">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="text-sm font-semibold text-zinc-900">Need help?</div>
            <div className="mt-2 text-sm leading-relaxed text-zinc-700">
              For cleaning advice, repairs, or product care questions, send us a message with your order id (if available).
            </div>
            <div className="mt-5">
              <Link to="/contact" className="inline-flex rounded-full bg-[#2b2118] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
