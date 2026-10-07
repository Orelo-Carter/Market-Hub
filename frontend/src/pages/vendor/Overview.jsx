import { Link } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import StatCard from '../../components/admin/StatCard'
import StatusPill from '../../components/admin/StatusPill'
import { formatCurrency } from '../../utils/currency'

function Overview({ products, orders, isMock }) {
  const liveProducts = products.filter((product) => product.status === 'approved').length
  const pendingProducts = products.filter((product) =>
    ['pending_approval', 'pending_vendor'].includes(product.status),
  ).length
  const changesPending = products.filter((product) => product.status === 'changes_pending').length
  const ordersThisWeek = orders.length
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const rejectedProducts = products.filter((product) => product.status === 'rejected')
  const fulfillmentOrders = orders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status))

  return (
    <>
      {isMock ? <div className="mock-banner">Mock vendor data is being shown because the vendor API is unavailable or auth is not connected.</div> : null}

      <section className="admin-grid-stats">
        <StatCard label="Live products" value={liveProducts} caption="Approved and visible" />
        <StatCard label="Pending approval" value={pendingProducts} caption="New submissions" />
        <StatCard label="Changes pending" value={changesPending} caption="Live edits staged" />
        <StatCard label="Orders this week" value={ordersThisWeek} caption="Vendor sub-orders" />
        <StatCard label="Revenue this month" value={formatCurrency(revenue)} caption="Current vendor slice" />
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Needs attention</h2>
            <p className="admin-section-note">Rejected submissions and orders waiting for movement.</p>
          </div>
        </div>

        {rejectedProducts.length || fulfillmentOrders.length ? (
          <div className="vendor-attention-list">
            {rejectedProducts.map((product) => (
              <Link key={product._id} to={`/vendor/products/${product._id}/edit`} className="admin-card vendor-attention-row is-danger">
                <div>
                  <p className="preview-title">{product.title || product.name}</p>
                  <p className="preview-meta">{product.rejectionReason || 'Rejected by admin'}</p>
                </div>
                <StatusPill status="rejected" />
              </Link>
            ))}
            {fulfillmentOrders.map((order) => (
              <Link key={order._id} to={`/vendor/orders/${order._id}`} className="admin-card vendor-attention-row">
                <div>
                  <p className="preview-title">{order.orderId || order._id}</p>
                  <p className="preview-meta">{order.customerName} • {order.itemsCount} items</p>
                </div>
                <StatusPill status={order.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing needs attention">
            Rejected products and orders awaiting fulfillment will appear here.
          </EmptyState>
        )}
      </section>
    </>
  )
}

export default Overview
