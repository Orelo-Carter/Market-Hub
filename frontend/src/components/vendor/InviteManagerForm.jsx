import { useState } from 'react'
import PermissionToggle from './PermissionToggle'

const defaultPermissions = {
  canCreateProduct: false,
  canEditProduct: false,
  canDeleteProduct: false,
  canViewOrders: false,
}

function InviteManagerForm({ onInvite, isWorking }) {
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState(defaultPermissions)

  const updatePermission = (name, value) => {
    setPermissions((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onInvite({ email, permissions })
    setEmail('')
    setPermissions(defaultPermissions)
  }

  return (
    <form className="admin-card stat-card vendor-form-grid" onSubmit={handleSubmit}>
      <div>
        <h3 className="admin-section-title">Invite Manager</h3>
        <p className="admin-section-note">Managers get scoped access to this store only.</p>
      </div>
      <label className="auth-field">
        <span className="auth-label">Email</span>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <div className="permission-grid">
        {Object.keys(defaultPermissions).map((name) => (
          <PermissionToggle
            key={name}
            name={name}
            checked={permissions[name]}
            onChange={updatePermission}
          />
        ))}
      </div>
      <button className="admin-button is-primary" type="submit" disabled={isWorking}>
        Send invite
      </button>
    </form>
  )
}

export default InviteManagerForm
