import { Star } from 'lucide-react'

function StarRating({ rating = 0, count }) {
  return (
    <span className="star-rating">
      <Star size={15} fill="currentColor" />
      {Number(rating || 0).toFixed(1)}
      {count !== undefined ? <span className="muted-copy">({count})</span> : null}
    </span>
  )
}

export default StarRating
