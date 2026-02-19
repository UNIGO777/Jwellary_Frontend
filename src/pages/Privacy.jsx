import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

export default function Privacy() {
  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Privacy Policy</div>
              <div className="mt-1 text-xs text-zinc-500">How we collect, use, and protect your information.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/contact"
                className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]"
              >
                Contact
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
              <div>
                We value your privacy. This Privacy Policy explains what information we collect when you use our website and how we use it.
              </div>
              <div>
                We may collect information such as your name, email, phone number, shipping address, and order details when you place an order or contact us.
              </div>
              <div>
                We use this information to process orders, provide support, communicate order updates, improve our services, and maintain security.
              </div>
              <div>
                We do not sell your personal information. We may share limited information with service providers only as needed to complete services like payments,
                shipping, and email delivery.
              </div>
              <div>If you have any privacy questions or requests, please reach out via the Contact page.</div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
