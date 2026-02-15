import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function NotFound() {
  const MotionDiv = motion.div

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-zinc-50">
        <div className="mx-auto   px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <div className="text-sm text-zinc-700">Page not found</div>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
