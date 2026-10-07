import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { registerCustomer, registerVendor } from '../../services/authApi'
import { useAuthStore } from '../../stores/authStore'

function SignUp() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [mode, setMode] = useState('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    description: '',
  })

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      }

      const session = mode === 'vendor'
        ? await registerVendor({
            ...payload,
            storeName: form.storeName,
            description: form.description,
          })
        : await registerCustomer(payload)

      setSession(session)
      toast.success(mode === 'vendor' ? 'Vendor application submitted' : 'Account created')
      navigate(mode === 'vendor' ? '/' : '/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create account')
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
            <p className="auth-panel-eyebrow">Create account</p>
            <h1 className="auth-panel-title">Start shopping or apply to sell.</h1>
            <p className="auth-panel-copy">
              Join Markethub as a shopper or create a store profile for your business.
            </p>
          </aside>

          <div className="auth-form-wrap">
            <h2 className="auth-heading">Sign up</h2>
            <p className="auth-subheading">
              Choose a customer account or submit a vendor store application.
            </p>

            <div className="auth-mode" role="tablist" aria-label="Account type">
              <button
                type="button"
                className={`auth-mode-button${mode === 'customer' ? ' is-active' : ''}`}
                onClick={() => setMode('customer')}
              >
                Customer
              </button>
              <button
                type="button"
                className={`auth-mode-button${mode === 'vendor' ? ' is-active' : ''}`}
                onClick={() => setMode('vendor')}
              >
                Vendor
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-label">Full name</span>
                <input
                  className="auth-input"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                />
              </label>

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
                  minLength={8}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                />
              </label>

              {mode === 'vendor' ? (
                <>
                  <label className="auth-field">
                    <span className="auth-label">Store name</span>
                    <input
                      className="auth-input"
                      value={form.storeName}
                      onChange={(event) => updateField('storeName', event.target.value)}
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span className="auth-label">Store description</span>
                    <textarea
                      className="auth-textarea"
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                    />
                  </label>
                </>
              ) : null}

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 size={17} /> : <ArrowRight size={17} />}
                {mode === 'vendor' ? 'Submit vendor application' : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/signin">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SignUp
