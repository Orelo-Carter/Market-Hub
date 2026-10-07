import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import { verifyCheckout } from '../../services/checkoutApi'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/currency'

function CheckoutVerify() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')
  const clearCart = useCartStore((state) => state.clearCart)
  const [state, setState] = useState({
    isLoading: true,
    order: null,
    error: '',
  })

  useEffect(() => {
    let isMounted = true

    async function verifyPayment() {
      if (!reference) {
        setState({ isLoading: false, order: null, error: 'Missing payment reference.' })
        return
      }

      try {
        const result = await verifyCheckout(reference)
        if (!isMounted) return
        if (result.paymentStatus === 'paid') clearCart()
        setState({ isLoading: false, order: result.order, error: result.paymentStatus === 'paid' ? '' : 'Payment is not confirmed yet.' })
      } catch (error) {
        if (!isMounted) return
        setState({
          isLoading: false,
          order: null,
          error: error.response?.data?.message || 'Payment verification failed.',
        })
      }
    }

    verifyPayment()
    return () => {
      isMounted = false
    }
  }, [clearCart, reference])

  if (state.isLoading) {
    return (
      <div className="storefront-container">
        <EmptyState title="Verifying payment">
          Confirming your Paystack payment. This usually takes a moment.
        </EmptyState>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="storefront-container">
        <EmptyState title="Payment not confirmed">
          <p>{state.error}</p>
          <Link className="storefront-button is-primary" to="/cart">Return to cart</Link>
        </EmptyState>
      </div>
    )
  }

  const subOrders = state.order?.subOrders || []
  const total = Number(state.order?.totalAmount || state.order?.total || 0)

  return (
    <div className="storefront-container">
      <section className="detail-card checkout-confirmation">
        <p className="auth-panel-eyebrow">Payment confirmed</p>
        <h1 className="admin-page-title">Order confirmed</h1>
        <p className="muted-copy">Your order has been split by vendor for fulfillment.</p>
        <div className="checkout-vendor-groups">
          {subOrders.map((subOrder) => (
            <section className="checkout-vendor-group" key={subOrder._id}>
              <div className="vendor-toolbar">
                <strong>{subOrder.vendor?.storeName || 'Marketplace vendor'}</strong>
                <span className="mono">{formatCurrency(subOrder.subtotal)}</span>
              </div>
              {(subOrder.items || []).map((item) => (
                <div className="checkout-summary-item" key={`${subOrder._id}-${item.product}`}>
                  <span>{item.name} x {item.quantity}</span>
                  <span className="mono">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="checkout-total">
          <span>Total paid</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="vendor-inline-actions">
          <Link className="storefront-button is-primary" to="/">Continue shopping</Link>
          <Link className="storefront-button" to="/orders?confirmed=1">View order history</Link>
        </div>
      </section>
    </div>
  )
}

export default CheckoutVerify
