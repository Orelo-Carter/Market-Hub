import {
  BarChart3,
  Banknote,
  Package,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

function canSeeOrders(session) {
  return session?.role === 'vendor_admin' || session?.permissions?.canViewOrders
}

function VendorSidebar({ session }) {
  const items = [
    { label: 'Overview', to: '/vendor', icon: BarChart3, end: true, visible: true },
    { label: 'Products', to: '/vendor/products', icon: Package, visible: true },
    { label: 'Orders', to: '/vendor/orders', icon: ReceiptText, visible: canSeeOrders(session) },
    { label: 'Managers', to: '/vendor/managers', icon: Users, visible: session?.role === 'vendor_admin' },
    { label: 'Store Settings', to: '/vendor/settings', icon: Settings, visible: session?.role === 'vendor_admin' },
    { label: 'Payouts', to: '/vendor/payouts', icon: Banknote, visible: session?.role === 'vendor_admin' },
  ].filter((item) => item.visible)

  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-brand" aria-label="Markethub home">
        <span className="admin-brand-mark">M</span>
        <span className="admin-brand-text">
          <span className="admin-brand-name">{session?.vendor?.storeName || 'Vendor Store'}</span>
          <span className="admin-brand-subtitle">Vendor Dashboard</span>
        </span>
      </Link>

      <nav className="admin-nav" aria-label="Vendor navigation">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default VendorSidebar
