import { useEffect, useState } from 'react'
import ApprovalCard from '../../components/admin/ApprovalCard'
import EmptyState from '../../components/admin/EmptyState'
import {
  approveVendor,
  getPendingVendors,
  rejectVendor,
} from '../../services/adminApi'

function VendorApprovals() {
  const [vendors, setVendors] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [apiErrorStatus, setApiErrorStatus] = useState(null)
  const [workingId, setWorkingId] = useState(null)

  useEffect(() => {
    async function loadVendors() {
      const result = await getPendingVendors()
      setVendors(result.data)
      setIsMock(result.isMock)
      setApiErrorStatus(result.error?.response?.status || null)
    }

    loadVendors()
  }, [])

  const removeVendor = (vendor) => {
    const id = vendor._id || vendor.id
    setVendors((current) => current.filter((item) => (item._id || item.id) !== id))
  }

  const handleApprove = async (vendor) => {
    const id = vendor._id || vendor.id
    setWorkingId(id)
    try {
      if (!isMock) await approveVendor(id)
      removeVendor(vendor)
    } finally {
      setWorkingId(null)
    }
  }

  const handleReject = async (vendor, reason) => {
    const id = vendor._id || vendor.id
    setWorkingId(id)
    try {
      if (!isMock) await rejectVendor(id, reason)
      removeVendor(vendor)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="admin-section">
      {isMock ? (
        <div className="mock-banner">
          {apiErrorStatus === 401 || apiErrorStatus === 403
            ? 'Sign in as a Super Admin to view real vendor applications. Mock vendor applications are being shown for now.'
            : 'Mock vendor applications are being shown because the admin API could not be reached.'}
        </div>
      ) : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Vendor applications</h2>
          <p className="admin-section-note">Approve trusted stores or reject with a clear reason.</p>
        </div>
      </div>

      <div className="admin-list">
        {vendors.length ? (
          vendors.map((vendor) => {
            const id = vendor._id || vendor.id
            return (
              <ApprovalCard
                key={id}
                item={vendor}
                type="vendor"
                isWorking={workingId === id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )
          })
        ) : (
          <EmptyState title="No pending vendor approvals">
            New vendor applications will appear here when store owners register.
          </EmptyState>
        )}
      </div>
    </section>
  )
}

export default VendorApprovals
