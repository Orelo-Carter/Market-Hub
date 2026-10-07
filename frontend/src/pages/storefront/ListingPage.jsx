import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/admin/EmptyState'
import Breadcrumb from '../../components/storefront/Breadcrumb'
import FilterSidebar from '../../components/storefront/FilterSidebar'
import ProductGrid from '../../components/storefront/ProductGrid'
import { getStorefrontCategories, getStorefrontProducts } from '../../services/storefrontApi'
import { getCategoryHeroCopy, getCategoryHeroImage } from '../../utils/categoryHero'

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function vendorKey(vendor) {
  return vendor?.slug || vendor?._id || vendor?.id || vendor?.storeName
}

function vendorsFromProducts(products) {
  const vendors = new Map()

  products.forEach((product) => {
    const vendor = product.vendor
    if (!vendor || typeof vendor !== 'object') return

    const key = vendorKey(vendor)
    if (!key || vendors.has(key)) return

    vendors.set(key, {
      _id: vendor._id || vendor.id || key,
      slug: vendor.slug || vendor._id || vendor.id || key,
      storeName: vendor.storeName || vendor.name || 'Marketplace vendor',
    })
  })

  return Array.from(vendors.values()).sort((a, b) => a.storeName.localeCompare(b.storeName))
}

function ListingPage({ mode }) {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [vendors, setVendors] = useState([])
  const [filters, setFilters] = useState({ sort: 'newest', minPrice: '', maxPrice: '', vendor: '', rating: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const category = useMemo(() => categories.find((item) => item.slug === slug), [categories, slug])
  const categoryHero = useMemo(() => {
    if (!category) return null
    return {
      ...getCategoryHeroCopy(category),
      image: getCategoryHeroImage(category),
    }
  }, [category])

  useEffect(() => {
    getStorefrontCategories().then((result) => {
      setCategories(result.data)
      setIsMock((current) => current || result.isMock)
    })
  }, [])

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      const params = {
        sort: filters.sort,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        vendor: filters.vendor || undefined,
        category: mode === 'category' ? category?._id : undefined,
        search: mode === 'search' ? query : undefined,
      }
      const [result, vendorResult] = await Promise.all([
        getStorefrontProducts(params),
        getStorefrontProducts({ ...params, vendor: undefined }),
      ])
      let data = result.data
      if (filters.rating) data = data.filter((product) => Number(product.ratingAvg || 0) >= Number(filters.rating))
      setProducts(data)
      setVendors(vendorsFromProducts(vendorResult.data))
      setIsMock((current) => current || result.isMock)
      setIsLoading(false)
    }

    if (mode === 'category' && !category) return
    loadProducts()
  }, [category, filters, mode, query])

  const breadcrumbItems = mode === 'category' && category
    ? [
        ...(parentIdOf(category) ? [{ label: categories.find((item) => item._id === parentIdOf(category))?.name || 'Category' }] : []),
        { label: category.name },
      ]
    : [{ label: `Search` }]

  return (
    <div className="storefront-container">
      {isMock ? <div className="mock-banner">Mock products are being shown because the API could not be reached.</div> : null}
      <Breadcrumb items={breadcrumbItems} />
      {mode === 'category' && categoryHero ? (
        <section className="category-page-hero" style={{ backgroundImage: `url("${categoryHero.image}")` }}>
          <div className="category-hero-overlay" />
          <div className="category-page-hero-content">
            <span>Category</span>
            <h1>{categoryHero.headline}</h1>
            {categoryHero.subtext ? <p>{categoryHero.subtext}</p> : null}
          </div>
        </section>
      ) : null}
      <div className="listing-toolbar">
        <div>
          <h1 className="admin-page-title">
            {mode === 'search' ? `Results for "${query}"` : category?.name || 'Category'}
          </h1>
          <p className="muted-copy">{products.length} products</p>
        </div>
        <label className="filter-field">
          <span className="muted-copy">Sort</span>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price low-high</option>
            <option value="price_desc">Price high-low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
        <button className="storefront-button mobile-filter-button" type="button" onClick={() => setFiltersOpen((value) => !value)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>
      <div className="storefront-grid-layout">
        <div className={`filter-shell${filtersOpen ? ' is-open' : ''}`}>
          <FilterSidebar filters={filters} onChange={setFilters} vendors={vendors} />
        </div>
        <div>
          {products.length || isLoading ? (
            <ProductGrid products={products} isLoading={isLoading} />
          ) : (
            <EmptyState title="No products found">Try adjusting your filters.</EmptyState>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListingPage
