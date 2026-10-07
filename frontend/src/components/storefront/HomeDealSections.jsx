import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFlashSaleProducts,
  getStorefrontCategories,
  getStorefrontProducts,
  getTopSellerProducts,
} from '../../services/storefrontApi'
import ProductCard from './ProductCard'
import ProductGrid from './ProductGrid'

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function discountPercent(product) {
  const price = Number(product.price || 0)
  const compareAtPrice = Number(product.compareAtPrice || 0)
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

function withDiscountLabel(product) {
  const discount = discountPercent(product)
  return {
    ...product,
    discountLabel: discount > 0 ? `-${discount}%` : null,
  }
}

function productBelongsToCategory(product, category) {
  const categoryValues = [
    product.category,
    ...(Array.isArray(product.categories) ? product.categories : []),
  ].map((value) => {
    if (!value) return ''
    if (typeof value === 'object') return value.slug || value._id || value.name || ''
    return value
  })

  return categoryValues.includes(category.slug) || categoryValues.includes(category._id)
}

function timeRemaining(target) {
  const ms = Math.max(new Date(target).getTime() - Date.now(), 0)
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

function SectionSkeleton({ horizontal = false }) {
  return (
    <div className={horizontal ? 'product-scroll-row' : 'loading-grid'}>
      {Array.from({ length: horizontal ? 5 : 8 }).map((_, index) => (
        <div className="skeleton-card" key={index} />
      ))}
    </div>
  )
}

function ProductScroller({ products, showDiscountBadges = false, showRanks = false }) {
  const rowRef = useRef(null)

  const scroll = (direction) => {
    rowRef.current?.scrollBy({
      left: direction * 340,
      behavior: 'smooth',
    })
  }

  return (
    <div className="product-scroll-wrap">
      <button className="product-scroll-button is-left" type="button" aria-label="Scroll left" onClick={() => scroll(-1)}>
        <ChevronLeft size={18} />
      </button>
      <div className="product-scroll-row" ref={rowRef}>
        {products.map((product, index) => (
          <ProductCard
            key={product._id || product.id}
            product={product}
            discountBadge={showDiscountBadges ? product.discountLabel : null}
            rankBadge={showRanks && index < 3 ? `#${index + 1}` : null}
          />
        ))}
      </div>
      <button className="product-scroll-button is-right" type="button" aria-label="Scroll right" onClick={() => scroll(1)}>
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function FlashSalesSection() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    async function loadFlashSales() {
      setIsLoading(true)
      const result = await getFlashSaleProducts()
      setProducts((result.data || []).map(withDiscountLabel))
      setIsLoading(false)
    }

    loadFlashSales()
  }, [])

  useEffect(() => {
    if (!products.length) return undefined
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [products.length])

  const earliestEndsAt = useMemo(() => {
    const dates = products
      .map((product) => product.flashSale?.endsAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    return dates[0]
  }, [products])

  if (isLoading) {
    return (
      <section className="section-block">
        <div className="section-heading"><h2>Flash Sales</h2></div>
        <SectionSkeleton horizontal />
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <h2>Flash Sales</h2>
          {earliestEndsAt ? <p className="deal-countdown">Ends in {timeRemaining(earliestEndsAt)} {nowTick ? '' : ''}</p> : null}
        </div>
        {products.length > 8 ? <Link className="section-link" to="/search">View all</Link> : null}
      </div>
      <ProductScroller products={products.slice(0, 8)} showDiscountBadges />
    </section>
  )
}

function TopSellersSection() {
  const [products, setProducts] = useState([])
  const [isFallback, setIsFallback] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTopSellers() {
      setIsLoading(true)
      const result = await getTopSellerProducts(12)
      setProducts(result.data || [])
      setIsFallback(Boolean(result.isFallback))
      setIsLoading(false)
    }

    loadTopSellers()
  }, [])

  if (isLoading) {
    return (
      <section className="section-block">
        <div className="section-heading"><h2>Top Sellers</h2></div>
        <SectionSkeleton horizontal />
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <h2>{isFallback ? 'Trending Now' : 'Top Sellers'}</h2>
          {isFallback ? <p className="muted-copy">Fresh arrivals while sales history builds up.</p> : null}
        </div>
      </div>
      <ProductScroller products={products.slice(0, 10)} showRanks={!isFallback} />
    </section>
  )
}

function DealsByCategorySection() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCategoryDeals() {
      setIsLoading(true)
      const categoryResult = await getStorefrontCategories()
      const topCategories = (categoryResult.data || [])
        .filter((category) => !parentIdOf(category))
        .slice(0, 8)

      const dealResults = await Promise.all(
        topCategories.map(async (category) => {
          const result = await getStorefrontProducts({
            category: category.slug,
            minDiscountPercent: 1,
            sort: 'discount_desc',
            limit: 10,
          })
          const sourceProducts = result.isMock
            ? (result.data || []).filter((product) => productBelongsToCategory(product, category))
            : (result.data || [])
          const discountedProducts = sourceProducts
            .map(withDiscountLabel)
            .filter((product) => product.discountLabel)
          return { category, products: discountedProducts }
        }),
      )

      setRows(dealResults.filter((row) => row.products.length))
      setIsLoading(false)
    }

    loadCategoryDeals()
  }, [])

  if (isLoading) {
    return (
      <section className="section-block">
        <div className="section-heading"><h2>Deals by Category</h2></div>
        <SectionSkeleton horizontal />
      </section>
    )
  }

  if (!rows.length) return null

  return (
    <section className="section-block category-deal-section">
      <div className="section-heading"><h2>Deals by Category</h2></div>
      <div className="category-deal-list">
        {rows.map((row) => (
          <div className="category-deal-row" key={row.category._id}>
            <Link className="category-deal-title" to={`/category/${row.category.slug}`}>
              {row.category.name}
            </Link>
            <ProductScroller products={row.products} showDiscountBadges />
          </div>
        ))}
      </div>
    </section>
  )
}

function FiftyOffSection() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFiftyOff() {
      setIsLoading(true)
      const result = await getStorefrontProducts({
        minDiscountPercent: 50,
        sort: 'discount_desc',
        limit: 12,
      })
      setProducts((result.data || []).map(withDiscountLabel).filter((product) => discountPercent(product) >= 50))
      setIsLoading(false)
    }

    loadFiftyOff()
  }, [])

  if (isLoading) {
    return (
      <section className="section-block deals-spotlight">
        <div className="section-heading">
          <div>
            <h2>50% Off & Under</h2>
            <p className="muted-copy">Deep discounts across every category.</p>
          </div>
        </div>
        <SectionSkeleton />
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="section-block deals-spotlight">
      <div className="section-heading">
        <div>
          <h2>50% Off & Under</h2>
          <p className="muted-copy">Deep discounts across every category.</p>
        </div>
      </div>
      <ProductGrid products={products.slice(0, 12)} showDiscountBadges />
    </section>
  )
}

function HomeDealSections() {
  return (
    <>
      <FlashSalesSection />
      <TopSellersSection />
      <DealsByCategorySection />
      <FiftyOffSection />
    </>
  )
}

export default HomeDealSections
