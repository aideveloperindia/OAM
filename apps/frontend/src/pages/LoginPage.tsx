import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../hooks/useTenant'
import type { FormEvent } from 'react'

export const LoginPage = () => {
  const { tenantId } = useTenant()
  const { login, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const redirectTo =
    (location.state as { from?: Location })?.from?.pathname ??
    '/app/my-attendance'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await login({ email, tenantId })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign in right now.'
      )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600">Preparing secure access…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    navigate('/app/my-attendance', { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Sign in to CollegeAttend
        </h1>
        <p className="text-sm text-slate-500">
          Access the SCIT attendance environment with your campus email. No
          password required for the demo.
        </p>
      </header>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-danger">
            {error}. Offline users can continue capturing attendance; sync will
            resume after reconnection.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Sign In
        </button>
      </form>
      <p className="text-center text-xs text-slate-500">
        For access requests, contact the campus administrator listed in the
        quotation.
      </p>
    </div>
  )
}

