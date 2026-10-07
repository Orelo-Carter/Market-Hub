import { useEffect, useState } from 'react'
import StatusPill from '../admin/StatusPill'
import { formatCurrency } from '../../utils/currency'

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']

function OrderDetailPanel({ order, onUpdateStatus, isWorking }) {
  const [form, setForm] = useState({
    status: order?.status || 'pending',
    trackingNumber: '',
    carrier: '',
    note: '',
  })

  useEffect(() => {
    setForm((current) => ({
      ...current,
      status: order?.status || 'pending',
    }))
  }, [order?._id, order?.status])

  if (!order) return null

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <aside className="admin-card stat-card vendor-form-grid">
      <div>
        <h3 className="admin-section-title">Order {order.orderId || order._id}</h3>
        <p className="admin-section-note">{order.customerName} • <StatusPill status={order.status} /></p>
      </div>

      <div>
        <p className="stat-label">Line items</p>
        <div className="vendor-line-items">
          {(order.lineItems || []).map((item) => (
            <div className="vendor-line-item" key={`${item.sku}-${item.name}`}>
              <span>{item.name} × {item.quantity}</span>
              <span className="mono">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="stat-label">Shipping address</p>
        <p className="admin-section-note">{order.shippingAddress || 'No shipping address'}</p>
      </div>

      <form
        className="vendor-form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          onUpdateStatus(order, form)
        }}
      >
        <label className="auth-field">
          <span className="auth-label">Status</span>
          <select className="auth-select" value={form.status} onChange={(event) => updateField('status', event.target.value)}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="auth-field">
          <span className="auth-label">Tracking number</span>
          <input className="auth-input" value={form.trackingNumber} onChange={(event) => updateField('trackingNumber', event.target.value)} />
        </label>
        <label className="auth-field">
          <span className="auth-label">Carrier</span>
          <input className="auth-input" value={form.carrier} onChange={(event) => updateField('carrier', event.target.value)} />
        </label>
        <label className="auth-field">
          <span className="auth-label">Note</span>
          <textarea className="auth-textarea" value={form.note} onChange={(event) => updateField('note', event.target.value)} />
        </label>
        <button className="admin-button is-primary" type="submit" disabled={isWorking}>
          Update status
        </button>
      </form>
    </aside>
  )
}

export default OrderDetailPanel
