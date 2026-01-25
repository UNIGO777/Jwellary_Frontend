import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function NotFound() {
  const MotionDiv = motion.div

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="text-sm text-zinc-300">Page not found</div>
        <div className="mt-4">
          <Link to="/" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
            Back Home
          </Link>
        </div>
      </div>
    </MotionDiv>
  )
}
