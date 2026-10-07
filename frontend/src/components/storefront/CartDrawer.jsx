import { Link } from 'react-router-dom'
import { itemKey, useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/currency'

function CartDrawer({ onClose }) {
  const items = useCartStore((state) => state.items)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="cart-drawer">
      <div className="vendor-toolbar">
        <h3 className="admin-section-title">Cart</h3>
        <button type="button" className="admin-button" onClick={onClose}>Close</button>
      </div>
      {items.length ? (
        <>
          {items.slice(0, 4).map((item) => (
            <div className="cart-item" key={itemKey(item)}>
              <img src={item.image} alt={item.title} />
              <div>
                <p className="preview-title">{item.title}</p>
                <p className="preview-meta">{item.vendor?.storeName} • Qty {item.quantity}</p>
                <p className="price">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
          <div className="vendor-toolbar">
            <strong>Total</strong>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <Link className="storefront-button is-primary" to="/cart" onClick={onClose}>View cart</Link>
        </>
      ) : (
        <p className="muted-copy">Your cart is empty.</p>
      )}
    </div>
  )
}

export default CartDrawer
