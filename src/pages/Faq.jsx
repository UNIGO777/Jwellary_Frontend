import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function Faq() {
  const faqs = [
    { q: 'How do I place an order?', a: 'Add products to cart, proceed to checkout, and complete payment to place your order.' },
    { q: 'Where can I see my orders?', a: 'Go to Profile → Orders, or open the Orders page directly from the menu.' },
    { q: 'How do I track my order?', a: 'If tracking is available, you will receive tracking details once your order is shipped.' },
    { q: 'Can I change or cancel my order?', a: 'Contact us quickly with your order id. Changes are possible only before processing/shipping.' },
    { q: 'What if my item arrives damaged?', a: 'Please contact us with photos and your order id so we can help immediately.' }
  ]

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">FAQ</div>
              <div className="mt-1 text-xs text-zinc-500">Quick answers to common questions.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/shipping"
                className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Shipping
              </Link>
              <Link
                to="/contact"
                className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">{item.q}</div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-700">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
