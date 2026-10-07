import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loginUser } from '../../services/authApi'
import { useAuthStore } from '../../stores/authStore'

function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const session = await loginUser(form)
      setSession(session)
      toast.success('Signed in successfully')
      navigate(searchParams.get('redirect') || '/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not sign in')
    } finally {
      setIsLoading(false)
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
            <p className="auth-panel-eyebrow">Marketplace access</p>
            <h1 className="auth-panel-title">Welcome back to your commerce hub.</h1>
            <p className="auth-panel-copy">
              Pick up where you left off with orders, store activity, approvals, and account tools in one place.
            </p>
          </aside>

          <div className="auth-form-wrap">
            <h2 className="auth-heading">Sign in</h2>
            <p className="auth-subheading">
              Enter the email and password attached to your Markethub account.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  className="auth-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Password</span>
                <input
                  className="auth-input"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                />
              </label>

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 size={17} /> : <ArrowRight size={17} />}
                Sign in
              </button>
            </form>

            <p className="auth-switch">
              New to Markethub? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SignIn
