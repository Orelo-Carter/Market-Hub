import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { setInvitePassword, validateSetPasswordToken } from '../../services/authApi'

function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ password: '', confirmPassword: '' })

  useEffect(() => {
    let isMounted = true

    async function validateInvite() {
      if (!token) {
        setStatus('invalid')
        setError('This invite link is missing a token.')
        return
      }

      try {
        const result = await validateSetPasswordToken(token)
        if (!isMounted) return
        setInvite(result)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) return
        setError(
          requestError.response?.data?.message ||
            'This invite link has expired, ask the store owner to resend it.',
        )
        setStatus('invalid')
      }
    }

    validateInvite()
    return () => {
      isMounted = false
    }
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setStatus('submitting')
    try {
      await setInvitePassword({ token, password: form.password })
      setStatus('complete')
      toast.success('Password set successfully')
    } catch (requestError) {
      setStatus('ready')
      toast.error(requestError.response?.data?.message || 'Could not set password')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-brand">
          <span className="admin-brand-mark">M</span>
          <span className="admin-brand-name">Markethub</span>
        </Link>

        <section className="auth-card">
          <aside className="auth-panel">
            <p className="auth-panel-eyebrow">Manager invite</p>
            <h1 className="auth-panel-title">Set your password.</h1>
            <p className="auth-panel-copy">
              Create your password to access the vendor dashboard for {invite?.storeName || 'this store'}.
            </p>
          </aside>

          <div className="auth-form-wrap">
            {status === 'checking' ? (
              <div className="empty-state">
                <Loader2 />
                <p className="empty-state-title">Checking invite</p>
                <p className="empty-state-copy">We are making sure this invite link is still valid.</p>
              </div>
            ) : null}

            {status === 'invalid' ? (
              <div className="empty-state">
                <p className="empty-state-title">Invite link unavailable</p>
                <p className="empty-state-copy">{error}</p>
                <Link to="/signin" className="admin-button">Go to sign in</Link>
              </div>
            ) : null}

            {status === 'complete' ? (
              <div className="empty-state">
                <CheckCircle2 />
                <p className="empty-state-title">Password set</p>
                <p className="empty-state-copy">Your manager account is active. Sign in with your email and new password.</p>
                <Link to="/signin" className="admin-button is-primary">Go to sign in</Link>
              </div>
            ) : null}

            {status === 'ready' || status === 'submitting' ? (
              <>
                <h2 className="auth-heading">Create password</h2>
                <p className="auth-subheading">
                  Invited as {invite?.email}. Passwords must be at least 8 characters.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <label className="auth-field">
                    <span className="auth-label">New password</span>
                    <input
                      className="auth-input"
                      type="password"
                      minLength={8}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span className="auth-label">Confirm password</span>
                    <input
                      className="auth-input"
                      type="password"
                      minLength={8}
                      value={form.confirmPassword}
                      onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      required
                    />
                  </label>

                  <button className="auth-submit" type="submit" disabled={status === 'submitting'}>
                    {status === 'submitting' ? <Loader2 size={17} /> : <ArrowRight size={17} />}
                    Set password
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

export default SetPassword
