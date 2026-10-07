import { Link } from 'react-router-dom'
import StatusPill from '../admin/StatusPill'
import { formatCurrency } from '../../utils/currency'

function ProductRow({ product, permissions, onDelete }) {
  const title = product.title || product.name
  const canEdit = permissions.canEditProduct
  const canDelete = permissions.canDeleteProduct

  return (
    <tr>
      <td>
        <span className="vendor-name">{title}</span>
        {product.status === 'changes_pending' ? (
          <p className="vendor-row-note">Pending diff awaiting Super Admin approval</p>
        ) : null}
        {product.status === 'rejected' && product.rejectionReason ? (
          <p className="vendor-row-note vendor-danger-text">{product.rejectionReason}</p>
        ) : null}
      </td>
      <td>{product.category || 'Uncategorized'}</td>
      <td className="mono">{formatCurrency(product.price)}</td>
      <td className="mono">{product.stock || 0}</td>
      <td className="mono">{product.sku || 'No SKU'}</td>
      <td><StatusPill status={product.status === 'approved' ? 'approved' : product.status} /></td>
      <td>
        <div className="vendor-inline-actions">
          {canEdit ? (
            <Link className="admin-button" to={`/vendor/products/${product._id}/edit`}>
              {product.status === 'rejected' ? 'Revise & resubmit' : 'Edit'}
            </Link>
          ) : null}
          {canDelete ? (
            <button type="button" className="admin-button is-danger" onClick={() => onDelete(product)}>
              Delete
            </button>
          ) : null}
          {!canEdit && !canDelete ? <span className="admin-section-note">No actions</span> : null}
        </div>
      </td>
    </tr>
  )
}

export default ProductRow
