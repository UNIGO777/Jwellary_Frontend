import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, authService, tokenStore } from '../services/index.js'
import PageLoader from '../components/PageLoader.jsx'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function Profile() {
  const navigate = useNavigate()
  const isAuthed = useMemo(() => Boolean(tokenStore.get()), [])

  const [loading, setLoading] = useState(Boolean(isAuthed))
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!tokenStore.get()) return
    let alive = true
    setLoading(true)
    setError('')
    authService
      .me()
      .then((res) => {
        if (!alive) return
        setUser(res?.data || null)
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.set('')
          setUser(null)
          return
        }
        setError(getErrorMessage(err))
        setUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const logout = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await authService.logout()
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const updatePassword = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await authService.updatePassword({ oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      setMessage('Password updated')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!tokenStore.get()) {
    return (
      <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="bg-transparent">
          <div className="mx-auto  px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8">
              <div className="text-sm font-semibold text-zinc-900">You are not logged in</div>
              <div className="mt-2 text-sm text-zinc-600">Login to view your profile, orders, and cart.</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/auth" className="inline-flex rounded-xl bg-[#2b2118] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1f1711]">
                  Login / Sign up
                </Link>
                <Link to="/products" className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                  Browse products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
    )
  }

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto  px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Profile</div>
              <div className="mt-1 text-xs text-zinc-500">Manage account and security</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/orders" className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                Orders
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={busy}
                className={cn(
                  'grid h-10 place-items-center rounded-full px-4 text-sm font-semibold transition',
                  busy ? 'cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-[#2b2118] text-white hover:bg-[#1f1711]'
                )}
              >
                Logout
              </button>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}

          {loading ? (
            <div className="mt-6">
              <PageLoader />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="lg:col-span-7">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Account</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4">
                      <div className="text-xs font-semibold text-zinc-600">Name</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">{user?.fullName || '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-4">
                      <div className="text-xs font-semibold text-zinc-600">Email</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">{user?.email || '-'}</div>
                    </div>
                  </div>
                 
                </div>
              </section>

              <aside className="lg:col-span-5">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Update password</div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">Old password</div>
                      <input
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-600">New password</div>
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                        type="password"
                        autoComplete="new-password"
                      />
                      <div className="mt-2 text-xs text-zinc-500">Minimum 6 characters</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void updatePassword()}
                      disabled={busy || !oldPassword || !newPassword}
                      className={cn(
                        'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition',
                        busy || !oldPassword || !newPassword
                          ? 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                          : 'bg-[#2b2118] text-white hover:bg-[#1f1711]'
                      )}
                    >
                      {busy ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="text-sm font-semibold text-zinc-900">Support</div>
                  <div className="mt-2 text-sm text-zinc-600">Need help? Send us a message.</div>
                  <div className="mt-4">
                    <Link to="/contact" className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                      Contact
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  )
}
