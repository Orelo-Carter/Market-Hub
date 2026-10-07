import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import DiffView from './DiffView'
import StatusPill from './StatusPill'

function formatDate(value) {
  if (!value) return 'Unknown time'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function ApprovalCard({
  item,
  type,
  onApprove,
  onReject,
  isWorking = false,
}) {
  const [isExpanded, setIsExpanded] = useState(item.status === 'changes_pending')
  const [isRejecting, setIsRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const isProduct = type === 'product'
  const hasDiff = isProduct && item.status === 'changes_pending'
  const ownerName = item.owner?.name || item.ownerName || 'Unknown owner'
  const vendorName = item.vendor?.storeName || item.vendorName || item.storeName

  const handleReject = () => {
    if (!isRejecting) {
      setIsRejecting(true)
      return
    }
    onReject(item, reason)
    setReason('')
    setIsRejecting(false)
  }

  return (
    <article className={`admin-card approval-card is-${item.status}`}>
      <div className="approval-card-head">
        <div>
          <h3 className="approval-title">{item.storeName || item.name}</h3>
          <div className="approval-meta">
            <span>{isProduct ? `Vendor: ${vendorName}` : `Owner: ${ownerName}`}</span>
            <span>{isProduct ? item.category : item.category || 'General marketplace'}</span>
            <span className="mono">{formatDate(item.submittedAt || item.createdAt)}</span>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      {hasDiff ? (
        <div className="admin-list">
          <button
            type="button"
            className="admin-button is-ghost"
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isExpanded ? 'Hide staged diff' : 'Review staged diff'}
          </button>
          {isExpanded ? <DiffView product={item} /> : null}
        </div>
      ) : null}

      {isRejecting ? (
        <div className="reject-box">
          <input
            className="admin-input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for rejection"
            aria-label="Reason for rejection"
          />
        </div>
      ) : null}

      <div className="approval-actions">
        <button
          type="button"
          className="admin-button is-primary"
          onClick={() => onApprove(item)}
          disabled={isWorking}
        >
          <Check size={16} />
          Approve
        </button>
        <button
          type="button"
          className="admin-button is-danger"
          onClick={handleReject}
          disabled={isWorking}
        >
          <X size={16} />
          {isRejecting ? 'Submit rejection' : 'Reject'}
        </button>
        {isRejecting ? (
          <button
            type="button"
            className="admin-button"
            onClick={() => {
              setIsRejecting(false)
              setReason('')
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default ApprovalCard
