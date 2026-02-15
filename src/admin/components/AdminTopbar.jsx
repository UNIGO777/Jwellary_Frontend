import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, adminAuthService } from '../../services/index.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const getErrorMessage = (err) => {
  if (err instanceof ApiError) return err.message
  if (err?.message) return String(err.message)
  return 'Something went wrong'
}

const getInitials = (value) => {
  const s = String(value || '').trim()
  if (!s) return 'A'
  const name = s.split('@')[0]
  const parts = name.split(/[.\s_-]+/).filter(Boolean)
  const letters = (parts.length ? parts : [name])
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
  return letters.join('') || 'A'
}

export default function AdminTopbar({
  sectionLabel = 'Dashboard',
  title,
  subtitle,
  showSearch = true,
  searchPlaceholder = 'Search',
  searchValue,
  onSearchChange,
  actions,
  adminEmail: adminEmailProp
}) {
  const navigate = useNavigate()
  const [adminEmailState, setAdminEmailState] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (adminEmailProp !== undefined) return undefined
    let alive = true
    adminAuthService
      .me()
      .then((res) => {
        if (!alive) return
        setAdminEmailState(res?.data?.email || '')
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          adminAuthService.logout()
          navigate('/admin/login', { replace: true })
          return
        }
        setError(getErrorMessage(err))
      })
    return () => {
      alive = false
    }
  }, [adminEmailProp, navigate])

  const adminEmail = adminEmailProp !== undefined ? adminEmailProp : adminEmailState
  const displayName = useMemo(() => (adminEmail ? adminEmail.split('@')[0] : 'Admin'), [adminEmail])
  const initials = useMemo(() => getInitials(adminEmail), [adminEmail])
  const inputProps =
    searchValue === undefined
      ? { placeholder: searchPlaceholder }
      : { placeholder: searchPlaceholder, value: searchValue, onChange: onSearchChange }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{sectionLabel}</div>
          <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</div>
          {subtitle ? <div className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</div> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          

         

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

      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
    </div>
  )
}
