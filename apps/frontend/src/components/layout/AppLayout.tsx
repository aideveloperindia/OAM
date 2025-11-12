import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTenant } from '../../hooks/useTenant'
import { GlobalFooter } from './GlobalFooter'

const navItems = [
  { to: '/app/my-attendance', label: 'My Attendance' },
  { to: '/app/class-attendance', label: 'Class Attendance' },
  { to: '/app/student/dashboard', label: 'Student Dashboard' },
  { to: '/app/predicted-absentees', label: 'Predicted Absentees' },
  { to: '/app/upload-status', label: 'Upload Status' }
]

export const AppLayout = () => {
  const { user, logout } = useAuth()
  const { tenant } = useTenant()

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-dark">
              OAM
            </p>
            <p className="text-xs text-slate-500">
              Online Attendance Management for SCIT
            </p>
            {tenant.demoRoster.length ? (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                Demo dataset active
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-danger hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:self-auto"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pb-4 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-primary/10'
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <GlobalFooter />
    </div>
  )
}

