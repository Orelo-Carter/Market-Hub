function StatCard({ label, value, caption }) {
  return (
    <article className="admin-card stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-caption">{caption}</p>
    </article>
  )
}

export default StatCard
