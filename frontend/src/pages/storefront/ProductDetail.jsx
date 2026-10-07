import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../../components/storefront/Breadcrumb'
import ProductGrid from '../../components/storefront/ProductGrid'
import QuantityStepper from '../../components/storefront/QuantityStepper'
import StarRating from '../../components/storefront/StarRating'
import VariantSelector from '../../components/storefront/VariantSelector'
import { getProductReviews, getStorefrontProduct, getStorefrontProducts } from '../../services/storefrontApi'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/currency'

function firstSelection(variants = []) {
  return variants.reduce((selection, variant) => {
    if (variant.options?.[0]) selection[variant.name] = variant.options[0]
    return selection
  }, {})
}

function selectionLabel(selection) {
  return Object.entries(selection).map(([name, option]) => `${name}: ${option.label}`).join(' / ')
}

function ProductDetail() {
  const { slug } = useParams()
  const addItem = useCartStore((state) => state.addItem)
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [moreProducts, setMoreProducts] = useState([])
  const [selection, setSelection] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      const result = await getStorefrontProduct(slug)
      const loadedProduct = result.data
      setProduct(loadedProduct)
      setSelection(firstSelection(loadedProduct.variants))
      setActiveImage(loadedProduct.images?.[0] || '')
      setIsMock(result.isMock)

      const [reviewResult, moreResult] = await Promise.all([
        getProductReviews(loadedProduct._id || loadedProduct.id),
        getStorefrontProducts({ vendor: loadedProduct.vendor?.slug, limit: 4 }),
      ])
      setReviews(reviewResult.data.reviews || [])
      setMoreProducts((moreResult.data || []).filter((item) => item._id !== loadedProduct._id).slice(0, 4))
      setIsMock((current) => current || reviewResult.isMock || moreResult.isMock)
    }

    loadProduct()
  }, [slug])

  const selectedOptions = Object.values(selection)
  const selectedModifier = selectedOptions.reduce((sum, option) => sum + Number(option.priceModifier || 0), 0)
  const currentPrice = Number(product?.price || 0) + selectedModifier
  const availableStock = product?.variants?.length
    ? Math.min(...selectedOptions.map((option) => Number(option.stock || 0)))
    : Number(product?.stock || 0)
  const canAdd = product && availableStock > 0 && (!product.variants?.length || selectedOptions.length === product.variants.length)

  if (!product) {
    return <div className="storefront-container"><div className="skeleton-card" /></div>
  }

  const handleAdd = () => {
    addItem({
      productId: product._id || product.id,
      variantSelection: selection,
      quantity,
      stock: availableStock,
      price: currentPrice,
      title: product.title || product.name,
      image: product.images?.[0],
      vendor: product.vendor,
    })
    toast.success('Added to cart')
  }

  return (
    <div className="storefront-container">
      {isMock ? <div className="mock-banner">Mock product details are being shown because the API could not be reached.</div> : null}
      <Breadcrumb items={[{ label: product.title || product.name }]} />
      <section className="product-detail-layout">
        <div>
          {activeImage ? <img className="gallery-main" src={activeImage} alt={product.title || product.name} /> : <div className="gallery-main" />}
          <div className="thumbnail-row">
            {(product.images || []).map((image) => (
              <button type="button" key={image} onClick={() => setActiveImage(image)}>
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-card">
          <p className="muted-copy"><Link to={`/store/${product.vendor?.slug}`}>{product.vendor?.storeName}</Link></p>
          <h1 className="product-detail-title">{product.title || product.name}</h1>
          <StarRating rating={product.ratingAvg} count={product.reviewCount} />
          <div className="price-row" style={{ marginTop: 18 }}>
            <span className="price">{formatCurrency(currentPrice)}</span>
            {product.compareAtPrice ? <span className="compare-price">{formatCurrency(product.compareAtPrice)}</span> : null}
          </div>
          <VariantSelector
            variants={product.variants}
            selection={selection}
            onChange={(variantName, option) => setSelection((current) => ({ ...current, [variantName]: option }))}
          />
          <p className="muted-copy" style={{ marginTop: 14 }}>{availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}</p>
          {selectionLabel(selection) ? <p className="muted-copy">{selectionLabel(selection)}</p> : null}
          <div className="vendor-inline-actions" style={{ marginTop: 18 }}>
            <QuantityStepper value={quantity} max={Math.max(1, availableStock)} onChange={setQuantity} />
            <button className="storefront-button is-primary" type="button" onClick={handleAdd} disabled={!canAdd}>Add to Cart</button>
          </div>
        </div>
      </section>

      <section className="section-block detail-card">
        <h2 className="admin-section-title">Description</h2>
        <p className="hero-copy">{product.description}</p>
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>Reviews</h2><button className="storefront-button" disabled>Write a review</button></div>
        <div className="admin-list">
          {reviews.map((review) => (
            <article className="detail-card" key={review._id}>
              <StarRating rating={review.rating} />
              <p>{review.comment}</p>
              <p className="muted-copy">{review.customer?.name} • {new Date(review.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>More from this vendor</h2></div>
        <ProductGrid products={moreProducts} />
      </section>
    </div>
  )
}

export default ProductDetail
