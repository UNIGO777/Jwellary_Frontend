import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService, adminTokenStore, api } from '../../services/index.js'

const MotionDiv = motion.div

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getInitials = (value) => {
  const s = String(value || '').trim()
  if (!s) return 'A'
  const name = s.split('@')[0]
  const parts = name.split(/[.\s_-]+/).filter(Boolean)
  const letters = (parts.length ? parts : [name]).slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean)
  return letters.join('') || 'A'
}

const formatTodayLabel = () => {
  const d = new Date()
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

const buildMonthGrid = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i += 1) cells.push({ key: `e-${i}`, day: null })
  for (let d = 1; d <= daysInMonth; d += 1) cells.push({ key: `d-${d}`, day: d })
  while (cells.length % 7 !== 0) cells.push({ key: `t-${cells.length}`, day: null })
  return { label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), cells }
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [analyticsError, setAnalyticsError] = useState('')
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [data, setData] = useState(null)
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    let alive = true
    adminAuthService
      .me()
      .then((res) => {
        if (!alive) return
        setAdminEmail(res?.data?.email || '')
      })
      .catch((err) => {
        if (!alive) return
        if (err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setError(getErrorMessage(err))
      })
    return () => {
      alive = false
    }
  }, [navigate])

  useEffect(() => {
    let alive = true
    const token = adminTokenStore.get()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const load = async () => {
      setLoadingAnalytics(true)
      setAnalyticsError('')
      try {
        const res = await api.get('/api/admin/analytics', { headers })
        if (!alive) return
        setData(res?.data || null)
      } catch (err) {
        if (!alive) return
        if (err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setAnalyticsError(getErrorMessage(err))
      } finally {
        if (alive) setLoadingAnalytics(false)
      }
    }

    load().catch((err) => {
      if (!alive) return
      setAnalyticsError(getErrorMessage(err))
      setLoadingAnalytics(false)
    })

    return () => {
      alive = false
    }
  }, [navigate])

  const displayName = adminEmail ? adminEmail.split('@')[0] : 'Admin'
  const initials = getInitials(adminEmail)
  const totals = data?.totals || {}
  const applicantsTotal = Number(totals?.users ?? NaN)
  const applicants = Number.isFinite(applicantsTotal) ? applicantsTotal : 1240
  const interviews = Number.isFinite(Number(totals?.orders ?? NaN)) ? Number(totals.orders) : 32
  const hired = Number.isFinite(Number(totals?.products ?? NaN)) ? Number(totals.products) : 12
  const openRoles = Number.isFinite(Number(totals?.categories ?? NaN)) ? Number(totals.categories) : 8

  const candidates = Array.isArray(data?.topProducts) && data.topProducts.length
    ? data.topProducts.slice(0, 5).map((p, idx) => ({
        id: `${p?._id || idx}`,
        name: p?.name || `Candidate ${idx + 1}`,
        role: p?.category || 'Product Designer',
        date: new Date(Date.now() + idx * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        stage: ['Screening', 'Interview', 'Offer', 'Hired'][idx % 4],
        progress: [35, 55, 75, 100][idx % 4]
      }))
    : [
        { id: 'c1', name: 'Darlene Robertson', role: 'Product Designer', date: 'Jan 30', stage: 'Interview', progress: 55 },
        { id: 'c2', name: 'Albert Flores', role: 'Frontend Developer', date: 'Jan 31', stage: 'Screening', progress: 35 },
        { id: 'c3', name: 'Jenny Wilson', role: 'UX Researcher', date: 'Feb 1', stage: 'Offer', progress: 75 },
        { id: 'c4', name: 'Floyd Miles', role: 'Backend Engineer', date: 'Feb 2', stage: 'Interview', progress: 55 },
        { id: 'c5', name: 'Kristin Watson', role: 'QA Engineer', date: 'Feb 3', stage: 'Hired', progress: 100 }
      ]

  const newApplicants = [
    { id: 'a1', name: 'Courtney Henry', role: 'UI Designer', time: '10:15 AM', badge: 'New' },
    { id: 'a2', name: 'Ralph Edwards', role: 'React Developer', time: '11:20 AM', badge: 'Review' },
    { id: 'a3', name: 'Savannah Nguyen', role: 'Product Manager', time: '12:40 PM', badge: 'New' },
    { id: 'a4', name: 'Wade Warren', role: 'Data Analyst', time: '2:05 PM', badge: 'Review' }
  ]

  const schedule = [
    { id: 's1', title: 'Interview: Product Designer', time: '09:30 - 10:00', meta: 'Zoom' },
    { id: 's2', title: 'Screening Call: Frontend Dev', time: '11:00 - 11:30', meta: 'Google Meet' },
    { id: 's3', title: 'Hiring Sync', time: '02:00 - 02:30', meta: 'Room 3A' }
  ]

  const month = buildMonthGrid(new Date())
  const today = new Date().getDate()

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="rounded-none border-0 bg-transparent px-0 py-0 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dashboard</div>
            <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Good morning, {displayName}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{formatTodayLabel()}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-full max-w-[420px] items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-zinc-800 lg:w-[420px]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" aria-hidden="true">
                <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search" />
            </div>

            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white" aria-label="Messages">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-700" fill="none" aria-hidden="true">
                <path
                  d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16H9l-3.8 3.2a.8.8 0 0 1-1.3-.6V16H7A2.5 2.5 0 0 1 4.5 13.5v-7Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M8 8.5h8M8 11.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-700" fill="none" aria-hidden="true">
                <path
                  d="M12 3a6 6 0 0 0-6 6v3.6l-1.4 2.8h14.8L18 12.6V9a6 6 0 0 0-6-6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#2b2118] text-xs font-extrabold text-white">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-extrabold text-zinc-900">{displayName}</div>
                <div className="truncate text-[11px] font-semibold text-zinc-500">Administrator</div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
        ) : null}

        {analyticsError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{analyticsError}</div>
        ) : null}

        <div className="mt-6 flex min-w-0 flex-col gap-5 lg:flex-row">
          <div className="grid min-w-0 flex-1 gap-5 overflow-x-hidden">
            <div className="relative isolate min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b2118] via-[#3a2a1f] to-[#6b4b3a] px-6 py-6 text-white sm:px-7">
              <div className="relative z-10 max-w-[420px]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Welcome back</div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Manage your recruitment in one place</div>
                <div className="mt-2 text-sm font-semibold text-white/80">
                  {loadingAnalytics ? 'Loading insights…' : 'Track applicants, interviews, and hiring progress.'}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="h-11 rounded-full bg-white px-5 text-sm font-extrabold text-[#2b2118] hover:bg-white/90">
                    View applicants
                  </button>
                  <button
                    type="button"
                    className="h-11 rounded-full border border-white/35 bg-white/10 px-5 text-sm font-extrabold text-white hover:bg-white/15"
                  >
                    Create new role
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-8 bottom-0 z-0 hidden h-[210px] w-[260px] sm:block">
                <svg viewBox="0 0 260 210" className="h-full w-full" fill="none" aria-hidden="true">
                  <path d="M184 178c-12 16-40 28-66 22-30-6-44-34-38-60 6-28 34-50 64-46 30 4 56 36 40 84Z" fill="rgba(255,255,255,0.22)" />
                  <path d="M208 58c-12 14-34 20-52 16-18-4-28-20-24-38 4-18 22-32 42-30 20 2 44 18 34 52Z" fill="rgba(255,255,255,0.18)" />
                  <path d="M58 74c-14 18-34 26-46 24-10-2-16-12-14-24 2-14 14-30 30-34 18-4 44 8 30 34Z" fill="rgba(255,255,255,0.14)" />
                  <path
                    d="M155 166c-8 10-22 18-37 16-16-2-25-18-21-34 4-18 18-30 36-28 18 2 34 18 22 46Z"
                    fill="rgba(255,255,255,0.28)"
                  />
                  <path d="M122 104c12 0 22-10 22-22s-10-22-22-22-22 10-22 22 10 22 22 22Z" fill="rgba(255,255,255,0.23)" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Applicants', value: loadingAnalytics ? '...' : String(applicants), tone: 'bg-white border-zinc-200' },
                { label: 'Interviews', value: loadingAnalytics ? '...' : String(interviews), tone: 'bg-white border-zinc-200' },
                { label: 'Hired', value: loadingAnalytics ? '...' : String(hired), tone: 'bg-white border-zinc-200' },
                { label: 'Open Roles', value: loadingAnalytics ? '...' : String(openRoles), tone: 'bg-white border-zinc-200' }
              ].map((card) => (
                <div key={card.label} className={cn('rounded-3xl border p-5', card.tone)}>
                  <div className="text-xs font-semibold text-slate-500">{card.label}</div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-[#fbf7f3]">
                    <div className="h-1.5 rounded-full bg-[#2b2118]" style={{ width: `${Math.max(18, (Number(card.value) % 100) || 65)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Recruitment Progress</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Recent candidates</div>
                </div>
                <button type="button" className="h-9 rounded-full bg-[#fbf7f3] px-4 text-xs font-extrabold text-[#2b2118] hover:bg-[#f3ece6]">
                  View all
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] gap-3 bg-[#fbf7f3] px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <div>Name</div>
                      <div>Role</div>
                      <div>Date</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {candidates.map((c) => (
                        <div key={c.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] items-center gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-slate-900">{c.name}</div>
                            <div className="truncate text-xs font-semibold text-slate-500">#{String(c.id).slice(0, 6)}</div>
                          </div>
                          <div className="min-w-0 truncate text-sm font-semibold text-slate-700">{c.role}</div>
                          <div className="text-sm font-semibold text-slate-700">{c.date}</div>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'inline-flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold',
                                c.stage === 'Hired'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : c.stage === 'Offer'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-[#fbf7f3] text-[#2b2118]'
                              )}
                            >
                              {c.stage}
                            </span>
                            <div className="hidden flex-1 sm:block">
                              <div className="h-2 w-full rounded-full bg-[#fbf7f3]">
                                <div
                                  className="h-2 rounded-full bg-[#2b2118]"
                                  style={{ width: `${Math.max(8, Math.min(100, Number(c.progress) || 0))}%` }}
                                />
                              </div>
                            </div>
                            <div className="hidden w-10 text-right text-xs font-extrabold text-slate-500 sm:block">{c.progress}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 w-full shrink-0 gap-5 lg:w-[420px]">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Schedule</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Today</div>
                </div>
                <button type="button" className="h-9 rounded-full bg-[#2b2118] px-4 text-xs font-extrabold text-white hover:bg-[#1f1711]">
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {schedule.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                    <div className="text-sm font-extrabold text-slate-900">{item.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span>{item.time}</span>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-100 bg-[#fbf7f3] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-slate-900">{month.label}</div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Mon–Sun</div>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-slate-500">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2 text-center">
                  {month.cells.map((cell) => (
                    <div
                      key={cell.key}
                      className={cn(
                        'grid h-9 place-items-center rounded-xl text-xs font-extrabold',
                        cell.day ? 'text-slate-700 hover:bg-white' : 'text-slate-300',
                        cell.day === today ? 'bg-[#2b2118] text-white hover:bg-[#2b2118]' : ''
                      )}
                    >
                      {cell.day || ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">New Applicants</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Today</div>
                </div>
                <button type="button" className="h-9 rounded-full bg-[#fbf7f3] px-4 text-xs font-extrabold text-[#2b2118] hover:bg-[#f3ece6]">
                  Filter
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {newApplicants.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fbf7f3] text-xs font-extrabold text-[#2b2118]">
                      {a.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-slate-900">{a.name}</div>
                      <div className="truncate text-xs font-semibold text-slate-500">{a.role}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          'inline-flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold',
                          a.badge === 'New' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {a.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
