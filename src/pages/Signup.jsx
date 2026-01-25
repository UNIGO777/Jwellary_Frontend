import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const MotionDiv = motion.div

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Signup</h1>
        <p className="mt-2 text-sm text-zinc-300">OTP flow: init → verify → receive token</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              placeholder="Your Name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              placeholder="123456"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
              Send OTP
            </button>
            <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white">
              Verify OTP
            </button>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
