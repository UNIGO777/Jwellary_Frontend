import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, authService } from '../services/index.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const TabButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      active ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'
    )}
  >
    {children}
  </button>
)

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signup')
  const [step, setStep] = useState('init')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const isSignup = mode === 'signup'
  const isVerify = step === 'verify'

  const subtitle = useMemo(() => (isSignup ? 'Create an account to shop and track orders' : 'Login to continue shopping'), [isSignup])

  const resetTransient = () => {
    setMessage('')
    setError('')
  }

  const switchMode = (next) => {
    if (next === mode) return
    setMode(next)
    setStep('init')
    setOtp('')
    setPassword('')
    resetTransient()
  }

  const sendOtp = async () => {
    setBusy(true)
    resetTransient()
    try {
      if (isSignup) {
        await authService.signupInit({ fullName, email, password })
      } else {
        await authService.loginInit({ email, password })
      }
      setMessage('OTP sent to your email')
      setStep('verify')
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
      if (isSignup) {
        await authService.signupVerify({ email, otp })
      } else {
        await authService.loginVerify({ email, otp })
      }
      setMessage('Logged in successfully')
      setStep('init')
      setOtp('')
      const returnTo = location.state?.returnTo ? String(location.state.returnTo) : '/'
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const primaryDisabled =
    busy || !email || (isVerify ? !otp : isSignup ? !fullName || !password : !password)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-white p-8 text-zinc-900 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-zinc-900">EWITH JEWELLERY</div>
            <div className="rounded-full bg-zinc-100 p-1">
              <TabButton active={isSignup} onClick={() => switchMode('signup')}>
                Sign up
              </TabButton>
              <TabButton active={!isSignup} onClick={() => switchMode('login')}>
                Login
              </TabButton>
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>

          <div className="mt-8 space-y-4">
            <div className={cn(!isVerify && isSignup ? '' : 'invisible')} aria-hidden={!(!isVerify && isSignup)}>
              <label className="text-xs font-semibold text-zinc-700">Name*</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!(!isVerify && isSignup)}
                className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">Email*</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                placeholder="Enter your email"
                type="email"
                autoComplete="email"
              />
            </div>

            {!isVerify && (
              <div>
                <label className="text-xs font-semibold text-zinc-700">Password*</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300"
                  placeholder="Enter your password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            )}

            {isVerify && (
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

          <label className={cn('mt-5 flex items-center gap-3 text-xs text-zinc-600', isSignup ? '' : 'invisible')} aria-hidden={!isSignup}>
            <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" defaultChecked disabled={!isSignup} />
            <span>
              I agree to the <span className="font-semibold text-zinc-900">Terms</span> and{' '}
              <span className="font-semibold text-zinc-900">Privacy Policy</span>
            </span>
          </label>

          {message && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>}
          {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>}

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
                {busy ? 'Sending...' : isSignup ? 'Send OTP' : 'Send OTP'}
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
                {busy ? 'Verifying...' : isSignup ? 'Sign Up' : 'Login'}
              </button>
            )}

            {isVerify && (
              <button
                type="button"
                onClick={() => {
                  setStep('init')
                  setOtp('')
                  resetTransient()
                }}
                className="mt-3 w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-zinc-600">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="font-semibold text-zinc-900">
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-zinc-900">
                  Sign up
                </button>
              </>
            )}
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="relative overflow-hidden"
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
                Discover Timeless
                <br />
                Jewellery for Every Moment
              </div>
              <div className="mt-3 text-sm leading-6 text-zinc-700">
                Explore curated gold, diamond, and silver collections crafted for celebrations and everyday elegance.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-800">
                Certified Jewellery
              </div>
              <div className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-800">
                Secure Payments
              </div>
              <Link to="/" className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-white">
                Browse Home
              </Link>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  )
}
