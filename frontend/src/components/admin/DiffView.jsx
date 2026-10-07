function formatDiffValue(value) {
  if (value === null || value === undefined || value === '') return 'Empty'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

function getChangedRows(product) {
  const pendingChanges = product.pendingChanges || {}
  const liveValues = product.liveValues || product

  return Object.entries(pendingChanges)
    .filter(([field]) => !['status', 'reviewStatus', 'submittedBy', 'submittedAt'].includes(field))
    .filter(([field, proposed]) => JSON.stringify(liveValues[field]) !== JSON.stringify(proposed))
    .map(([field, proposed]) => ({
      field,
      current: liveValues[field],
      proposed,
    }))
}

function DiffView({ product }) {
  const rows = getChangedRows(product)

  if (!rows.length) {
    return (
      <div className="empty-state admin-card">
        <p className="empty-state-title">No field changes detected</p>
        <p className="empty-state-copy">
          The staged update did not include changed product fields.
        </p>
      </div>
    )
  }

  return (
    <div className="diff-panel">
      <table className="diff-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Current live</th>
            <th>Proposed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field}>
              <td>{formatFieldName(row.field)}</td>
              <td>
                <span className="diff-current mono">{formatDiffValue(row.current)}</span>
              </td>
              <td>
                <span className="diff-proposed mono">{formatDiffValue(row.proposed)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DiffView
