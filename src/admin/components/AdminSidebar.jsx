import { NavLink } from 'react-router-dom'
import { useMemo } from 'react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const SidebarLink = ({ to, label, end, icon }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
        isActive
          ? 'border-l-4 border-[#2b2118] bg-[#fbf7f3] pl-2 text-[#2b2118]'
          : 'border-l-4 border-transparent text-zinc-700 hover:bg-[#fbf7f3] hover:text-zinc-900'
      )
    }
  >
    <span className={cn('grid h-9 w-9 place-items-center rounded-xl text-zinc-500 transition', 'group-hover:text-zinc-800')}>
      {icon}
    </span>
    <span className="min-w-0 truncate">{label}</span>
  </NavLink>
)

export default function AdminSidebar({
  title = 'Hireism',
  links,
  activePath,
  onLogout
}) {
  const items = useMemo(() => {
    if (Array.isArray(links) && links.length) return links
    return [
      {
        to: '/admin',
        label: 'Dashboard',
        end: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M4 13.2V6.8A2.8 2.8 0 0 1 6.8 4h3.4A2.8 2.8 0 0 1 13 6.8v3.4A2.8 2.8 0 0 1 10.2 13H6.8A2.8 2.8 0 0 1 4 10.2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M11 17.2v-3.4A2.8 2.8 0 0 1 13.8 11h3.4A2.8 2.8 0 0 1 20 13.8v3.4A2.8 2.8 0 0 1 17.2 20h-3.4A2.8 2.8 0 0 1 11 17.2Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        )
      },
      {
        to: '/admin/orders',
        label: 'Orders',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        )
      },
      {
        to: '/admin/products',
        label: 'Inventory',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M12 21V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M4.6 7.2 12 11l7.4-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        )
      },
      {
        to: '/admin/categories',
        label: 'Categories',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M4 6h7v7H4V6Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13 6h7v7h-7V6Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4 15h7v5H4v-5Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13 15h7v5h-7v-5Z" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        )
      },
      {
        to: '/admin/subcategories',
        label: 'Subcategories',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M5 7h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5 17h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )
      },
      {
        to: '/admin/promocodes',
        label: 'Promocodes',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M4 12a3 3 0 0 0 3 3h1l3 3 9-9-3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M14 9h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )
      }
    ]
  }, [links])

  return (
    <aside className="w-[260px] shrink-0 border-r border-zinc-200 bg-white">
      <div className="flex h-full flex-col px-5 py-0">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#2b2118] text-sm font-extrabold text-white">E</div>
          <div className="text-base font-extrabold tracking-tight text-zinc-900">{title}</div>
        </div>

        <div className="mt-7">
          <div className="grid gap-1">
            {items.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                end={item.end}
                icon={item.icon}
                activePath={activePath}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto pt-0">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              onLogout ? 'text-zinc-700 hover:bg-[#fbf7f3] hover:text-zinc-900' : 'cursor-default text-zinc-400'
            )}
            disabled={!onLogout}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M10 7H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M15 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M13 10l2 2-2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

