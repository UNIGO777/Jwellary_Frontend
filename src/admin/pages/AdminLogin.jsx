import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService } from '../../services/index.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function AdminLogin() {
  const navigate = useNavigate()

  const [step, setStep] = useState('init')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const isVerify = step === 'verify'

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const resetTransient = () => {
    setMessage('')
    setError('')
  }

  const sendOtp = async () => {
    setBusy(true)
    resetTransient()
    try {
      await adminAuthService.loginInit({ email, password })
      setMessage('OTP sent to admin email')
      setStep('verify')
      setOtp('')
      setResendCooldown(30)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    setBusy(true)
    resetTransient()
    try {
      await adminAuthService.loginVerify({ email, otp })
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const primaryDisabled = busy || !email || (isVerify ? !otp : !password)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-white p-8 text-zinc-900 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-zinc-900">EWITH JEWELLERY</div>
            <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700">Admin Panel</div>
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Admin login</h1>
          <p className="mt-2 text-sm text-zinc-600">Enter admin credentials, then verify OTP.</p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700">Email*</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                placeholder="admin@email.com"
                type="email"
                autoComplete="email"
              />
            </div>

            {!isVerify ? (
              <div>
                <label className="text-xs font-semibold text-zinc-700">Password*</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                  placeholder="Enter admin password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-zinc-700">OTP*</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                  placeholder="123456"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          {message ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
          ) : null}

          <div className="mt-6">
            {!isVerify ? (
              <button
                type="button"
                disabled={primaryDisabled}
                onClick={sendOtp}
                className={cn(
                  'w-full rounded-full px-4 py-3 text-sm font-semibold transition',
                  primaryDisabled ? 'cursor-not-allowed bg-zinc-300 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-950'
                )}
              >
                {busy ? 'Sending...' : 'Send OTP'}
              </button>
            ) : (
              <button
                type="button"
                disabled={primaryDisabled}
                onClick={verifyOtp}
                className={cn(
                  'w-full rounded-full px-4 py-3 text-sm font-semibold transition',
                  primaryDisabled ? 'cursor-not-allowed bg-zinc-300 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-950'
                )}
              >
                {busy ? 'Verifying...' : 'Login'}
              </button>
            )}

            {isVerify ? (
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={busy || resendCooldown > 0 || !email || !password}
                  onClick={sendOtp}
                  className={cn(
                    'flex-1 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50',
                    busy || resendCooldown > 0 || !email || !password ? 'cursor-not-allowed opacity-60 hover:bg-white' : ''
                  )}
                >
                  {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('init')
                    setOtp('')
                    setResendCooldown(0)
                    resetTransient()
                  }}
                  className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Back
                </button>
              </div>
            ) : null}
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="relative overflow-hidden rounded-l-[70px]"
        >
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://unsplash.com/photos/PPizseKigaw/download?force=true&w=2400"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-white/40" />

          <div className="relative flex h-full min-h-[420px] flex-col justify-end p-8 lg:min-h-[560px]">
            <div className="max-w-md">
              <div className="text-3xl font-semibold leading-tight text-zinc-900">
                Manage products,
                <br />
                orders & promotions
              </div>
              <div className="mt-3 text-sm leading-6 text-zinc-700">Secure admin access using OTP verification.</div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  )
}
