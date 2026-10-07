function normalizeStatus(status = '') {
  return status.replace(/_/g, ' ')
}

function StatusPill({ status }) {
  return (
    <span className={`status-pill is-${status}`}>
      {normalizeStatus(status)}
    </span>
  )
}

export default StatusPill
