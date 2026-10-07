import { useEffect, useState } from 'react'
import ApprovalCard from '../../components/admin/ApprovalCard'
import EmptyState from '../../components/admin/EmptyState'
import {
  approveProduct,
  getPendingProducts,
  rejectProduct,
} from '../../services/adminApi'

function ProductApprovals() {
  const [products, setProducts] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [workingId, setWorkingId] = useState(null)

  useEffect(() => {
    async function loadProducts() {
      const result = await getPendingProducts()
      setProducts(result.data)
      setIsMock(result.isMock)
    }

    loadProducts()
  }, [])

  const removeProduct = (product) => {
    const id = product._id || product.id
    setProducts((current) => current.filter((item) => (item._id || item.id) !== id))
  }

  const handleApprove = async (product) => {
    const id = product._id || product.id
    setWorkingId(id)
    try {
      if (!isMock) await approveProduct(id)
      removeProduct(product)
    } finally {
      setWorkingId(null)
    }
  }

  const handleReject = async (product, reason) => {
    const id = product._id || product.id
    setWorkingId(id)
    try {
      if (!isMock) await rejectProduct(id, reason)
      removeProduct(product)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock product approvals are being shown.</div> : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Product approval queue</h2>
          <p className="admin-section-note">
            Review new products and staged live-product edits before customers see them.
          </p>
        </div>
      </div>

      <div className="admin-list">
        {products.length ? (
          products.map((product) => {
            const id = product._id || product.id
            return (
              <ApprovalCard
                key={id}
                item={product}
                type="product"
                isWorking={workingId === id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )
          })
        ) : (
          <EmptyState title="No pending product approvals">
            Product submissions and staged edits will appear here for final Super Admin review.
          </EmptyState>
        )}
      </div>
    </section>
  )
}

export default ProductApprovals
