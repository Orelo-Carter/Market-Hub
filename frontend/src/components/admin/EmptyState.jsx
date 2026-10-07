function EmptyState({ title, children }) {
  return (
    <div className="admin-card empty-state">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-copy">{children}</p>
    </div>
  )
}

export default EmptyState
