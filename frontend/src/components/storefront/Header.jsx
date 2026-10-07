import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStorefrontCategories } from '../../services/storefrontApi'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import CartDrawer from './CartDrawer'

const dealMessages = [
  'FLASH SALE - Up to 50% off Electronics',
  'TOP DEALS this week',
  'Free shipping on orders over ₦50,000',
  'New vendors just joined - check them out',
]

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function buildCategoryTree(categories = []) {
  return categories
    .filter((category) => !parentIdOf(category))
    .map((parent) => ({
      ...parent,
      children: categories.filter((category) => parentIdOf(category) === parent._id),
    }))
}

function initials(name = 'Account') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function dashboardPathForRole(role) {
  if (role === 'super_admin') return '/admin'
  if (['vendor_admin', 'vendor_manager', 'manager'].includes(role)) return '/vendor'
  return null
}

function Header() {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const mobileSearchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({})
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const items = useCartStore((state) => state.items)
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const dashboardPath = dashboardPathForRole(user?.role)

  useEffect(() => {
    getStorefrontCategories().then((result) => setCategories(result.data))
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setCategoryMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setCategoryMenuOpen(false)
        setMobileMenuOpen(false)
        setMobileSearchOpen(false)
        setAccountOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus()
  }, [mobileSearchOpen])

  const submitSearch = (event) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setMobileSearchOpen(false)
    setMobileMenuOpen(false)
    navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  const closeMenus = () => {
    setCategoryMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setAccountOpen(false)
    navigate('/')
  }

  return (
    <header className="storefront-header">
      <div className="storefront-header-main">
        <div className="storefront-container storefront-header-row">
          <button
            className="storefront-icon-button storefront-mobile-menu-trigger"
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>

          <Link className="storefront-logo" to="/" onClick={closeMenus}>
            <span className="storefront-logo-mark">M</span>
            Markethub
          </Link>

          <div
            className="storefront-category-menu"
            ref={menuRef}
            onMouseEnter={() => setCategoryMenuOpen(true)}
          >
            <button
              className="storefront-category-button"
              type="button"
              aria-expanded={categoryMenuOpen}
              onClick={() => setCategoryMenuOpen((value) => !value)}
            >
              All Categories
              <ChevronDown size={16} />
            </button>

            {categoryMenuOpen ? (
              <div className="storefront-mega-menu">
                {categoryTree.map((category) => (
                  <div className="mega-menu-column" key={category._id}>
                    <Link className="mega-menu-parent" to={`/category/${category.slug}`} onClick={closeMenus}>
                      {category.name}
                    </Link>
                    <div className="mega-menu-children">
                      {category.children.map((child) => (
                        <Link key={child._id} to={`/category/${child.slug}`} onClick={closeMenus}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <form className="storefront-search" onSubmit={submitSearch}>
            <button type="submit" aria-label="Search">
              <Search size={18} />
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, vendors..."
            />
          </form>

          <div className="storefront-actions">
            {user ? (
              <div className="storefront-account">
                <button
                  className="storefront-button storefront-account-button"
                  type="button"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((value) => !value)}
                >
                  <span className="account-avatar">{initials(user.name)}</span>
                  <span className="account-label">{user.name}</span>
                  <ChevronDown size={14} />
                </button>
                {accountOpen ? (
                  <div className="account-menu">
                    {dashboardPath ? (
                      <Link to={dashboardPath} onClick={() => setAccountOpen(false)}>Dashboard</Link>
                    ) : null}
                    <Link to="/orders" onClick={() => setAccountOpen(false)}>My Orders</Link>
                    <Link to="/account" onClick={() => setAccountOpen(false)}>Account Settings</Link>
                    <button type="button" onClick={handleLogout}>
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link className="storefront-button storefront-login-button" to="/signin">
                <User size={17} />
                <span>Login</span>
              </Link>
            )}

            <button
              className="storefront-icon-button storefront-search-trigger"
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search size={19} />
            </button>

            <button
              className="storefront-icon-button"
              type="button"
              onClick={() => setCartOpen((value) => !value)}
              aria-label="Cart"
            >
              <ShoppingCart size={19} />
              {itemCount ? <span className="cart-badge">{itemCount}</span> : null}
            </button>
          </div>
        </div>
      </div>

      <div className="deals-marquee" aria-label="Current marketplace deals">
        <div className="deals-marquee-track">
          {[...dealMessages, ...dealMessages].map((message, index) => (
            <span className="deals-marquee-item" key={`${message}-${index}`}>
              {message}
            </span>
          ))}
        </div>
      </div>

      {mobileSearchOpen ? (
        <form className="mobile-search-overlay" onSubmit={submitSearch}>
          <Search size={19} />
          <input
            ref={mobileSearchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, vendors..."
          />
          <button type="button" aria-label="Close search" onClick={() => setMobileSearchOpen(false)}>
            <X size={20} />
          </button>
        </form>
      ) : null}

      {mobileMenuOpen ? (
        <div className="mobile-menu-backdrop" role="presentation" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-storefront-menu" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-header">
              <Link className="storefront-logo" to="/" onClick={closeMenus}>
                <span className="storefront-logo-mark">M</span>
                Markethub
              </Link>
              <button className="storefront-icon-button" type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                <X size={19} />
              </button>
            </div>

            {user ? (
              <>
                {dashboardPath ? (
                  <Link className="storefront-button" to={dashboardPath} onClick={closeMenus}>
                    Dashboard
                  </Link>
                ) : null}
                <button className="storefront-button" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <Link className="storefront-button" to="/signin" onClick={closeMenus}>
                <User size={16} />
                Login
              </Link>
            )}

            <nav className="mobile-category-accordion" aria-label="Categories">
              {categoryTree.map((category) => {
                const expanded = Boolean(expandedMobileCategories[category._id])
                return (
                  <div className="mobile-category-group" key={category._id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMobileCategories((current) => ({
                          ...current,
                          [category._id]: !current[category._id],
                        }))
                      }
                    >
                      {category.name}
                      <ChevronDown size={16} />
                    </button>
                    {expanded ? (
                      <div className="mobile-category-links">
                        <Link to={`/category/${category.slug}`} onClick={closeMenus}>All {category.name}</Link>
                        {category.children.map((child) => (
                          <Link key={child._id} to={`/category/${child.slug}`} onClick={closeMenus}>
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      {cartOpen ? <CartDrawer onClose={() => setCartOpen(false)} /> : null}
    </header>
  )
}

export default Header
