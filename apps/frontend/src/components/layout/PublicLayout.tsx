import { Link, Outlet } from 'react-router-dom'
import { GlobalFooter } from './GlobalFooter'
import { TenantSelector } from '../ui/TenantSelector'

const PRIMARY_LOGO = '/assets/college-logo.png'

export const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={PRIMARY_LOGO}
              alt="Sree Chaitanya Institute of Technological Sciences crest"
              className="h-10 w-10 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-primary-dark uppercase tracking-wide">
                CollegeAttend
              </p>
              <p className="text-xs text-slate-500">
                Smart attendance for Sree Chaitanya Institute of Technological Sciences
              </p>
            </div>
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <TenantSelector />
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link to="/app/login" className="hover:text-primary transition">
                Sign In
              </Link>
              <Link
                to="/help"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Instructions
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <GlobalFooter />
    </div>
  )
}

