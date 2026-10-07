import ProductCard from './ProductCard'

function ProductGrid({ products, isLoading, showDiscountBadges = false }) {
  if (isLoading) {
    return (
      <div className="loading-grid">
        {Array.from({ length: 8 }).map((_, index) => <div className="skeleton-card" key={index} />)}
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product._id || product.id}
          product={product}
          discountBadge={showDiscountBadges ? product.discountLabel : null}
        />
      ))}
    </div>
  )
}

export default ProductGrid
