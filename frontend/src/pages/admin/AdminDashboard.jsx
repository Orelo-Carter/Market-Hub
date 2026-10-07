import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from '../../components/admin/Sidebar'
import Topbar from '../../components/admin/Topbar'
import Categories from './Categories'
import Overview from './Overview'
import ProductApprovals from './ProductApprovals'
import Settings from './Settings'
import VendorApprovals from './VendorApprovals'
import Vendors from './Vendors'

const pageTitles = {
  '/admin': {
    title: 'Overview',
    kicker: 'Pending marketplace activity and approval workload.',
  },
  '/admin/vendor-approvals': {
    title: 'Vendor Approvals',
    kicker: 'Review new store applications before they can operate.',
  },
  '/admin/product-approvals': {
    title: 'Product Approvals',
    kicker: 'Approve new products and staged edits before customers see them.',
  },
  '/admin/vendors': {
    title: 'Vendors',
    kicker: 'Manage all stores across Markethub.',
  },
  '/admin/categories': {
    title: 'Categories',
    kicker: 'Create and organize platform-controlled product taxonomy.',
  },
  '/admin/settings': {
    title: 'Settings',
    kicker: 'Platform governance configuration.',
  },
}

function AdminDashboard() {
  const location = useLocation()
  const currentPage = pageTitles[location.pathname] || pageTitles['/admin']

  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Topbar title={currentPage.title} kicker={currentPage.kicker} />
          <main className="admin-content">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="vendor-approvals" element={<VendorApprovals />} />
              <Route path="product-approvals" element={<ProductApprovals />} />
              <Route path="categories" element={<Categories />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
