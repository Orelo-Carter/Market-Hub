import { Link } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import QuantityStepper from '../../components/storefront/QuantityStepper'
import { itemKey, useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/currency'

function groupByVendor(items) {
  return items.reduce((groups, item) => {
    const key = item.vendor?.storeName || 'Marketplace vendor'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {})
}

function Cart() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const groups = groupByVendor(items)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!items.length) {
    return (
      <div className="storefront-container">
        <EmptyState title="Your cart is empty">
          <Link className="storefront-button is-primary" to="/">Continue shopping</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="storefront-container">
      <h1 className="admin-page-title">Cart</h1>
      <div className="cart-page-layout section-block">
        <div className="admin-list">
          {Object.entries(groups).map(([vendorName, vendorItems]) => {
            const subtotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
            return (
              <section className="detail-card" key={vendorName}>
                <div className="vendor-toolbar"><h2 className="admin-section-title">{vendorName}</h2><strong>{formatCurrency(subtotal)}</strong></div>
                {vendorItems.map((item) => {
                  const key = itemKey(item)
                  return (
                    <div className="cart-item" key={key}>
                      <img src={item.image} alt={item.title} />
                      <div>
                        <p className="preview-title">{item.title}</p>
                        <p className="preview-meta">{Object.values(item.variantSelection || {}).map((option) => option.label).join(' / ')}</p>
                        <div className="vendor-toolbar">
                          <span className="price">{formatCurrency(item.price)}</span>
                          <QuantityStepper value={item.quantity} max={item.stock || 99} onChange={(quantity) => updateQuantity(key, quantity)} />
                          <button className="admin-button is-danger" type="button" onClick={() => removeItem(key)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>
        <aside className="detail-card">
          <h2 className="admin-section-title">Summary</h2>
          <div className="vendor-toolbar"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          <Link className="storefront-button is-primary" to="/checkout">Proceed to Checkout</Link>
        </aside>
      </div>
    </div>
  )
}

export default Cart
