import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import StatusPill from '../../components/admin/StatusPill'
import { getMyOrders } from '../../services/orderApi'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/currency'

function formatDate(value) {
  if (!value) return 'Unknown date'
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function itemVariantText(variant) {
  if (!variant) return ''
  if (Array.isArray(variant)) {
    return variant.map((option) => `${option.name || option.group}: ${option.label}`).join(' / ')
  }
  if (typeof variant === 'object') {
    return Object.entries(variant)
      .map(([name, option]) => `${name}: ${option?.label || option}`)
      .join(' / ')
  }
  return String(variant)
}

const deliverySteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const deliveryStatusCopy = {
  pending: 'Waiting for payment or vendor confirmation.',
  confirmed: 'The vendor has received this order.',
  processing: 'The vendor is preparing and packing your item before shipment.',
  shipped: 'Your package is on the way.',
  delivered: 'This package has been delivered.',
  cancelled: 'This vendor order was cancelled.',
  returned: 'This vendor order was marked as returned.',
}

function DeliveryStatus({ status }) {
  const activeIndex = deliverySteps.indexOf(status)
  const isTerminalException = ['cancelled', 'returned'].includes(status)

  return (
    <div className="delivery-status">
      <div className="delivery-status-header">
        <span>Delivery status</span>
        <strong>{deliveryStatusCopy[status] || 'Status update received from the vendor.'}</strong>
      </div>
      {!isTerminalException ? (
        <div className="delivery-steps" aria-label="Delivery progress">
          {deliverySteps.map((step, index) => (
            <div
              className={`delivery-step${index <= activeIndex ? ' is-complete' : ''}${step === status ? ' is-current' : ''}`}
              key={step}
            >
              <span />
              <p>{step}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function OrderHistory() {
  const user = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      if (!user) return
      setIsLoading(true)
      setError('')

      try {
        const data = await getMyOrders()
        if (isMounted) setOrders(data)
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Could not load your orders.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => {
      isMounted = false
    }
  }, [user])

  if (!user) {
    return <Navigate to={`/signin?redirect=${encodeURIComponent('/orders')}`} replace />
  }

  return (
    <div className="storefront-container order-history-page">
      <section className="order-history-hero">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Order history</h1>
          <p>
            Track each vendor shipment separately. One checkout can contain multiple vendor sub-orders.
          </p>
        </div>
        <div className="order-history-summary">
          <span>Total orders</span>
          <strong>{isLoading ? '--' : orders.length}</strong>
        </div>
      </section>

      {searchParams.get('confirmed') ? (
        <div className="mock-banner">Payment confirmed. Your order is now saved here.</div>
      ) : null}

      {error ? (
        <div className="checkout-error-list">
          <strong>Orders unavailable</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="loading-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeleton-card" key={index} />
          ))}
        </div>
      ) : orders.length ? (
        <div className="order-history-list">
          {orders.map((order) => (
            <article className="detail-card order-history-card" key={order._id}>
              <div className="order-history-header">
                <div>
                  <p className="preview-meta mono">Order {order._id}</p>
                  <h2>{formatCurrency(order.total)}</h2>
                  <p>{formatDate(order.createdAt)} • Payment {order.paymentStatus}</p>
                </div>
                <StatusPill status={order.paymentStatus} />
              </div>

              {order.shippingAddressText ? (
                <p className="order-address">{order.shippingAddressText}</p>
              ) : null}

              <div className="checkout-vendor-groups">
                {order.subOrders.map((subOrder) => (
                  <section className="checkout-vendor-group" key={subOrder._id}>
                    <div className="order-suborder-heading">
                      <strong>{subOrder.vendorName}</strong>
                      <StatusPill status={subOrder.status} />
                    </div>
                    <DeliveryStatus status={subOrder.status} />
                    {subOrder.items.map((item, index) => (
                      <div className="checkout-summary-item" key={`${subOrder._id}-${item.product || index}`}>
                        <div>
                          <strong>{item.name}</strong>
                          <p className="muted-copy">
                            Qty {item.quantity}
                            {itemVariantText(item.variant) ? ` • ${itemVariantText(item.variant)}` : ''}
                          </p>
                        </div>
                        <span className="mono">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                      </div>
                    ))}
                    <div className="checkout-total">
                      <span>Vendor subtotal</span>
                      <strong>{formatCurrency(subOrder.subtotal)}</strong>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No orders yet">
          Completed purchases will appear here after payment is confirmed.
          <br />
          <Link className="storefront-button is-primary" to="/">Continue shopping</Link>
        </EmptyState>
      )}
    </div>
  )
}

export default OrderHistory
