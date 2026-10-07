import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import { createCheckout } from '../../services/checkoutApi'
import { itemKey, useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/currency'

function groupByVendor(items) {
  return items.reduce((groups, item) => {
    const key = item.vendor?.storeName || 'Marketplace vendor'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {})
}

function cartItemPayload(item) {
  return {
    productId: item.productId,
    variantSelection: item.variantSelection || {},
    quantity: item.quantity,
  }
}

function Checkout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const items = useCartStore((state) => state.items)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [errors, setErrors] = useState([])
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'United States',
  })
  const groups = useMemo(() => groupByVendor(items), [items])
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!user) return <Navigate to="/signin?redirect=/checkout" replace />
  if (!items.length) return <Navigate to="/cart" replace />

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsPlacingOrder(true)
    setErrors([])

    try {
      const checkout = await createCheckout({
        shippingAddress: form,
        cartItems: items.map(cartItemPayload),
      })

      if (!checkout.authorization_url) {
        throw new Error('Payment authorization URL was not returned')
      }

      window.location.assign(checkout.authorization_url)
    } catch (error) {
      const failures = error.response?.data?.details?.failures || []
      setErrors(failures.length ? failures : [{ message: error.response?.data?.message || error.message || 'Checkout failed' }])
      toast.error('Checkout could not be completed')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="storefront-container">
      <div className="checkout-heading">
        <div>
          <h1 className="admin-page-title">Checkout</h1>
          <p className="muted-copy">Shipping details, vendor split, then secure Paystack payment.</p>
        </div>
        <Link className="storefront-button" to="/cart">Back to cart</Link>
      </div>

      {errors.length ? (
        <div className="checkout-error-list">
          <strong>Fix these before checkout:</strong>
          {errors.map((error, index) => (
            <p key={`${error.productId || 'checkout'}-${index}`}>{error.name ? `${error.name}: ` : ''}{error.message}</p>
          ))}
        </div>
      ) : null}

      <form className="checkout-layout section-block" onSubmit={handleSubmit}>
        <section className="detail-card checkout-form">
          <h2 className="admin-section-title">Shipping address</h2>
          <label className="auth-field">
            <span className="auth-label">Full name</span>
            <input className="auth-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Phone</span>
            <input className="auth-input" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Address line</span>
            <input className="auth-input" value={form.addressLine} onChange={(event) => updateField('addressLine', event.target.value)} required />
          </label>
          <div className="vendor-form-row">
            <label className="auth-field">
              <span className="auth-label">City</span>
              <input className="auth-input" value={form.city} onChange={(event) => updateField('city', event.target.value)} required />
            </label>
            <label className="auth-field">
              <span className="auth-label">State</span>
              <input className="auth-input" value={form.state} onChange={(event) => updateField('state', event.target.value)} required />
            </label>
          </div>
          <label className="auth-field">
            <span className="auth-label">Country</span>
            <input className="auth-input" value={form.country} onChange={(event) => updateField('country', event.target.value)} required />
          </label>
        </section>

        <aside className="detail-card checkout-summary">
          <h2 className="admin-section-title">Order summary</h2>
          <div className="checkout-vendor-groups">
            {Object.entries(groups).map(([vendorName, vendorItems]) => {
              const subtotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
              return (
                <section className="checkout-vendor-group" key={vendorName}>
                  <div className="vendor-toolbar">
                    <strong>{vendorName}</strong>
                    <span className="mono">{formatCurrency(subtotal)}</span>
                  </div>
                  {vendorItems.map((item) => (
                    <div className="checkout-summary-item" key={itemKey(item)}>
                      <span>{item.title} x {item.quantity}</span>
                      <span className="mono">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <button className="storefront-button is-primary checkout-submit" type="submit" disabled={isPlacingOrder}>
            {isPlacingOrder ? <Loader2 size={17} /> : null}
            Place Order
          </button>
        </aside>
      </form>
    </div>
  )
}

export default Checkout
