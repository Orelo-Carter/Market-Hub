import { useState } from 'react'
import EmptyState from '../../components/admin/EmptyState'
import StatusPill from '../../components/admin/StatusPill'
import InviteManagerForm from '../../components/vendor/InviteManagerForm'
import PermissionToggle from '../../components/vendor/PermissionToggle'

const permissionNames = ['canCreateProduct', 'canEditProduct', 'canDeleteProduct', 'canViewOrders']

function Managers({ managers, onInviteManager, onUpdateManager, onRemoveManager, isMock }) {
  const [workingId, setWorkingId] = useState(null)

  const handlePermissionChange = async (manager, name, value) => {
    const nextPermissions = { ...manager.permissions, [name]: value }
    setWorkingId(manager._id)
    try {
      await onUpdateManager(manager, nextPermissions)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock managers are being shown.</div> : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Managers</h2>
          <p className="admin-section-note">Invite managers and scope what they can do in this store.</p>
        </div>
      </div>

      <div className="vendor-detail-layout">
        <div>
          {managers.length ? (
            <div className="admin-card table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Permissions</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((manager) => (
                    <tr key={manager._id}>
                      <td>
                        <span className="vendor-name">{manager.name || manager.user?.name}</span>
                        <p className="vendor-row-note">{manager.email || manager.user?.email}</p>
                      </td>
                      <td>
                        <StatusPill status={manager.isActive || manager.status === 'active' ? 'active' : 'invited'} />
                      </td>
                      <td>
                        <div className="permission-grid">
                          {permissionNames.map((name) => (
                            <PermissionToggle
                              key={name}
                              name={name}
                              checked={manager.permissions?.[name]}
                              disabled={workingId === manager._id}
                              onChange={(permissionName, value) => handlePermissionChange(manager, permissionName, value)}
                            />
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-button is-danger"
                          disabled={workingId === manager._id}
                          onClick={() => onRemoveManager(manager)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No managers yet">
              Invite a manager to help operate this vendor store.
            </EmptyState>
          )}
        </div>

        <InviteManagerForm onInvite={onInviteManager} isWorking={workingId === 'invite'} />
      </div>
    </section>
  )
}

export default Managers
