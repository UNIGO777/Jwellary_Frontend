import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Home() {
  const MotionDiv = motion.div

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">Frontend Ready</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Vite + React + Tailwind + Router + Motion</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
          This project is set up with Tailwind CSS, React Router, and Framer Motion. Use Login/Signup pages to integrate OTP
          flow with your backend.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/auth" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
            Go to Auth
          </Link>
        </div>
      </div>
    </MotionDiv>
  )
}
