import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHeroSlider from '../../components/storefront/CategoryHeroSlider'
import HomeDealSections from '../../components/storefront/HomeDealSections'
import ProductGrid from '../../components/storefront/ProductGrid'
import { getStorefrontCategories, getStorefrontProducts } from '../../services/storefrontApi'

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const topCategories = useMemo(() => categories.filter((category) => !parentIdOf(category)).slice(0, 8), [categories])

  useEffect(() => {
    async function loadHome() {
      setIsLoading(true)
      const [categoryResult, productResult] = await Promise.all([
        getStorefrontCategories(),
        getStorefrontProducts({ sort: 'newest', limit: 8 }),
      ])
      setCategories(categoryResult.data)
      setProducts(productResult.data)
      setIsMock(categoryResult.isMock || productResult.isMock)
      setIsLoading(false)
    }

    loadHome()
  }, [])

  return (
    <div className="storefront-container">
      {isMock ? <div className="mock-banner">Mock storefront data is being shown because the API could not be reached.</div> : null}
      <CategoryHeroSlider />
      <HomeDealSections />

      {/* <section className="section-block">
        <div className="section-heading"><h2>Shop by category</h2></div>
        <div className="category-tile-grid">
          {topCategories.map((category) => (
            <Link className="category-tile" to={`/category/${category.slug}`} key={category._id}>
              <h3 className="admin-section-title">{category.name}</h3>
              <p className="muted-copy">Browse products</p>
            </Link>
          ))}
        </div>
      </section> */}

      {/* <section className="section-block">
        <div className="section-heading"><h2>Trending now</h2></div>
        <ProductGrid products={products.slice(0, 8)} isLoading={isLoading} />
      </section> */}
    </div>
  )
}

export default Home
