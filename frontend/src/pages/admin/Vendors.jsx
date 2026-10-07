import { useEffect, useState } from 'react'
import EmptyState from '../../components/admin/EmptyState'
import StatusPill from '../../components/admin/StatusPill'
import { getAllVendors, suspendVendor } from '../../services/adminApi'

function formatDate(value) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function Vendors() {
  const [vendors, setVendors] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [workingId, setWorkingId] = useState(null)

  useEffect(() => {
    async function loadVendors() {
      const result = await getAllVendors()
      setVendors(result.data)
      setIsMock(result.isMock)
    }

    loadVendors()
  }, [])

  const handleSuspend = async (vendor) => {
    const id = vendor._id || vendor.id
    setWorkingId(id)
    try {
      if (!isMock) await suspendVendor(id)
      setVendors((current) =>
        current.map((item) =>
          (item._id || item.id) === id ? { ...item, status: 'suspended' } : item,
        ),
      )
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock vendor table data is being shown.</div> : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">All vendors</h2>
          <p className="admin-section-note">Manage approved, pending, rejected, and suspended vendors.</p>
        </div>
      </div>

      {vendors.length ? (
        <div className="admin-card table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Products</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => {
                const id = vendor._id || vendor.id
                return (
                  <tr key={id}>
                    <td className="vendor-name">{vendor.storeName}</td>
                    <td>{vendor.owner?.name || 'Unknown owner'}</td>
                    <td><StatusPill status={vendor.status} /></td>
                    <td className="mono">{vendor.productsCount || 0}</td>
                    <td className="mono">{formatDate(vendor.joinedAt || vendor.createdAt)}</td>
                    <td>
                      {vendor.status === 'approved' ? (
                        <button
                          type="button"
                          className="admin-button is-danger"
                          disabled={workingId === id}
                          onClick={() => handleSuspend(vendor)}
                        >
                          Suspend
                        </button>
                      ) : (
                        <span className="admin-section-note">No action</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No vendors found">
          Vendors will appear here after owners submit or complete onboarding.
        </EmptyState>
      )}
    </section>
  )
}

export default Vendors
