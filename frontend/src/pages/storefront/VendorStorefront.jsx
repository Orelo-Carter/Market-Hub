import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductGrid from '../../components/storefront/ProductGrid'
import StarRating from '../../components/storefront/StarRating'
import { getStorefrontProducts, getStorefrontVendor } from '../../services/storefrontApi'

function VendorStorefront() {
  const { slug } = useParams()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    async function loadVendor() {
      const [vendorResult, productResult] = await Promise.all([
        getStorefrontVendor(slug),
        getStorefrontProducts({ vendor: slug }),
      ])
      setVendor(vendorResult.data)
      setProducts(productResult.data)
      setIsMock(vendorResult.isMock || productResult.isMock)
    }
    loadVendor()
  }, [slug])

  if (!vendor) return <div className="storefront-container"><div className="skeleton-card" /></div>

  return (
    <div className="storefront-container">
      {isMock ? <div className="mock-banner">Mock vendor storefront data is being shown.</div> : null}
      <section className="hero-banner" style={{ minHeight: 260 }}>
        <div>
          <p className="auth-panel-eyebrow">Vendor store</p>
          <h1 className="hero-title">{vendor.storeName}</h1>
          <p className="hero-copy">{vendor.description}</p>
          <StarRating rating={vendor.ratingAvg} />
        </div>
        <div className="hero-art" />
      </section>
      <section className="section-block">
        <div className="section-heading"><h2>Products</h2></div>
        <ProductGrid products={products} />
      </section>
    </div>
  )
}

export default VendorStorefront
