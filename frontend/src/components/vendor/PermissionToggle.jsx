const labels = {
  canCreateProduct: 'Create products',
  canEditProduct: 'Edit products',
  canDeleteProduct: 'Delete products',
  canViewOrders: 'View orders',
}

function PermissionToggle({ name, checked, onChange, disabled = false }) {
  return (
    <label className="permission-toggle">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.checked)}
      />
      {labels[name] || name}
    </label>
  )
}

export default PermissionToggle
