import { Link } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import ProductRow from '../../components/vendor/ProductRow'

function Products({ products, permissions, onDeleteProduct, isMock }) {
  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock products are being shown.</div> : null}

      <div className="vendor-toolbar">
        <div>
          <h2 className="admin-section-title">Products</h2>
          <p className="admin-section-note">All listings across draft, pending, live, staged, and rejected states.</p>
        </div>
        {permissions.canCreateProduct ? (
          <Link to="/vendor/products/new" className="admin-button is-primary">New Product</Link>
        ) : null}
      </div>

      {products.length ? (
        <div className="admin-card table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  permissions={permissions}
                  onDelete={onDeleteProduct}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No products yet">
          Create your first product to submit it for Super Admin approval.
        </EmptyState>
      )}
    </section>
  )
}

export default Products
