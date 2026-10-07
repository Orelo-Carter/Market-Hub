import { ImagePlus } from 'lucide-react'
import { useState } from 'react'

function StoreSettings({ session, onUpdateProfile, isMock }) {
  const vendor = session?.vendor || {}
  const [form, setForm] = useState({
    storeName: vendor.storeName || '',
    description: vendor.description || '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })
  const [banner, setBanner] = useState('')

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onUpdateProfile(form)
    setBanner('Store settings saved.')
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock store profile is being shown.</div> : null}
      {banner ? <div className="vendor-banner">{banner}</div> : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Store Settings</h2>
          <p className="admin-section-note">Update store profile assets and payout details.</p>
        </div>
      </div>

      <form className="vendor-settings-grid" onSubmit={handleSubmit}>
        <div className="admin-card stat-card vendor-form-grid">
          <h3 className="admin-section-title">Store profile</h3>
          <label className="auth-field">
            <span className="auth-label">Store name</span>
            <input className="auth-input" value={form.storeName} onChange={(event) => updateField('storeName', event.target.value)} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Description</span>
            <textarea className="auth-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </label>
          <div className="vendor-form-row">
            <div className="vendor-upload-box"><ImagePlus size={22} /><strong>Logo</strong><span>Upload placeholder</span></div>
            <div className="vendor-upload-box"><ImagePlus size={22} /><strong>Banner</strong><span>Upload placeholder</span></div>
          </div>
        </div>

        <div className="admin-card stat-card vendor-form-grid">
          <h3 className="admin-section-title">Payout details</h3>
          <label className="auth-field">
            <span className="auth-label">Bank name</span>
            <input className="auth-input" value={form.bankName} onChange={(event) => updateField('bankName', event.target.value)} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Account number</span>
            <input className="auth-input mono" value={form.accountNumber} onChange={(event) => updateField('accountNumber', event.target.value)} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Account name</span>
            <input className="auth-input" value={form.accountName} onChange={(event) => updateField('accountName', event.target.value)} />
          </label>
          <button className="admin-button is-primary" type="submit">Save settings</button>
        </div>
      </form>
    </section>
  )
}

export default StoreSettings
