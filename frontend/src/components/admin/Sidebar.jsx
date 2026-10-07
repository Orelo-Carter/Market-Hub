import {
  BarChart3,
  CheckSquare,
  FolderTree,
  PackageCheck,
  Settings,
  Store,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Overview', to: '/admin', icon: BarChart3, end: true },
  { label: 'Vendor Approvals', to: '/admin/vendor-approvals', icon: CheckSquare },
  { label: 'Product Approvals', to: '/admin/product-approvals', icon: PackageCheck },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
  { label: 'Vendors', to: '/admin/vendors', icon: Store },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-brand" aria-label="Markethub home">
        <span className="admin-brand-mark">M</span>
        <span className="admin-brand-text">
          <span className="admin-brand-name">Markethub</span>
          <span className="admin-brand-subtitle">Super Admin</span>
        </span>
      </Link>

      <nav className="admin-nav" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' is-active' : ''}`
              }
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

export default Sidebar
