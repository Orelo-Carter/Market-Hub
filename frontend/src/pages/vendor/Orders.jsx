import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import StatusPill from '../../components/admin/StatusPill'
import OrderDetailPanel from '../../components/vendor/OrderDetailPanel'
import { formatCurrency } from '../../utils/currency'

function formatDate(value) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function Orders({ orders, onUpdateOrderStatus, isMock }) {
  const { orderId } = useParams()
  const [workingId, setWorkingId] = useState(null)
  const selectedOrder = orders.find((order) => order._id === orderId) || orders[0]

  const handleUpdate = async (order, payload) => {
    setWorkingId(order._id)
    try {
      await onUpdateOrderStatus(order, payload)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock vendor orders are being shown.</div> : null}

      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Orders</h2>
          <p className="admin-section-note">Only this vendor’s sub-orders are visible here.</p>
        </div>
      </div>

      {orders.length ? (
        <div className="vendor-detail-layout">
          <div className="admin-card table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td><Link className="mono" to={`/vendor/orders/${order._id}`}>{order.orderId || order._id}</Link></td>
                    <td>{order.customerName}</td>
                    <td className="mono">{order.itemsCount}</td>
                    <td className="mono">{formatCurrency(order.total)}</td>
                    <td><StatusPill status={order.status} /></td>
                    <td className="mono">{formatDate(order.date || order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <OrderDetailPanel
            order={selectedOrder}
            onUpdateStatus={handleUpdate}
            isWorking={workingId === selectedOrder?._id}
          />
        </div>
      ) : (
        <EmptyState title="No orders yet">
          Vendor sub-orders will appear here when customers buy your products.
        </EmptyState>
      )}
    </section>
  )
}

export default Orders
