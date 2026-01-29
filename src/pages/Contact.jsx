import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ApiError, mailService } from '../services/index.js'

const MotionDiv = motion.div

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const res = await mailService.contact({ name, email, message })
      setSuccess(res?.id ? `Message sent (id: ${res.id})` : 'Message sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = name.trim().length >= 2 && email.trim().includes('@') && message.trim().length >= 5 && !busy

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="bg-transparent">
        <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Contact</div>
              <div className="mt-1 text-xs text-zinc-500">Send us a message and we’ll reply soon.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/products" className="grid h-10 place-items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                Products
              </Link>
              <Link to="/profile" className="grid h-10 place-items-center rounded-full bg-[#2b2118] px-4 text-sm font-semibold text-white hover:bg-[#1f1711]">
                Profile
              </Link>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          {success ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-7">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">Message</div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-600">Name</div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-600">Email</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                      placeholder="you@example.com"
                      inputMode="email"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-600">Message</div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                      placeholder="Hi..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!canSubmit}
                    className={cn(
                      'w-full rounded-2xl px-5 py-3 text-sm font-semibold transition',
                      canSubmit ? 'bg-[#2b2118] text-white hover:bg-[#1f1711]' : 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                    )}
                  >
                    {busy ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </div>
            </section>

            <aside className="lg:col-span-5">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-zinc-900">Quick links</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/orders" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                    Orders
                  </Link>
                  <Link to="/cart" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                    Cart
                  </Link>
                  <Link to="/about" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#fbf7f3]">
                    About
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}

