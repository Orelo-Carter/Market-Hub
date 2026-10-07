import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/currency'
import StarRating from './StarRating'

function ProductCard({ product, discountBadge, rankBadge }) {
  const title = product.title || product.name
  const image = product.images?.[0]

  return (
    <Link className="product-card" to={`/product/${product.slug || product._id}`}>
      {discountBadge ? <span className="product-card-badge is-sale">{discountBadge}</span> : null}
      {rankBadge ? <span className="product-card-badge is-rank">{rankBadge}</span> : null}
      {image ? (
        <img className="product-card-image" src={image} alt={title} />
      ) : (
        <div className="product-card-image" />
      )}
      <div className="product-card-body">
        <p className="product-card-vendor">{product.vendor?.storeName || 'Marketplace vendor'}</p>
        <h3 className="product-card-title">{title}</h3>
        <StarRating rating={product.ratingAvg} count={product.reviewCount} />
        <div className="price-row">
          <span className="price">{formatCurrency(product.price)}</span>
          {product.compareAtPrice ? (
            <span className="compare-price">{formatCurrency(product.compareAtPrice)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
