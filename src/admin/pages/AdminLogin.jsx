import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService } from '../../services/index.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const VIDEO_URL = 'https://www.pexels.com/download/video/31757664/'

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
    <div className="min-h-screen bg-zinc-50 py-5">
      <div className="mx-auto grid min-h-[95vh] w-full grid-cols-1 gap-6 px-4 py-0 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:gap-10 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
        >
          <video className="absolute inset-0 h-full w-full object-cover" src={VIDEO_URL} autoPlay muted loop playsInline preload="metadata" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold tracking-wide text-white/95">OM ABHUSAN JWELLARY</div>
              <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur">Admin Panel</div>
            </div>

            <div className="max-w-md">
              <div className="text-4xl font-semibold leading-tight tracking-tight">Admin access</div>
              <div className="mt-3 text-sm leading-6 text-white/85">Enter admin credentials, then verify OTP.</div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Protected area</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Products', 'Orders', 'Rates', 'Users'].map((x) => (
                  <div
                    key={x}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur"
                  >
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex h-full flex-col justify-center rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
        >
          <div className="text-3xl font-semibold tracking-tight text-zinc-900">Admin login</div>
          <div className="mt-2 text-sm text-zinc-600">{isVerify ? 'Enter the OTP sent to admin email' : 'Please enter your details to continue'}</div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700">Email*</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
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
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
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
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
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
                  'w-full rounded-xl px-4 py-3 text-sm font-semibold transition',
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
                  'w-full rounded-xl px-4 py-3 text-sm font-semibold transition',
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
                    'flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50',
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
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Back
                </button>
              </div>
            ) : null}
          </div>
        </MotionDiv>
      </div>
    </div>
  )
}
