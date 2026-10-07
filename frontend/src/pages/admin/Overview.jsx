import { Link } from 'react-router-dom'
import StatCard from '../../components/admin/StatCard'
import StatusPill from '../../components/admin/StatusPill'
import {
  getAllVendors,
  getPendingProducts,
  getPendingVendors,
} from '../../services/adminApi'
import { useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/currency'

function PreviewRow({ item, to, type }) {
  return (
    <Link to={to} className="preview-row">
      <div>
        <p className="preview-title">{item.storeName || item.name}</p>
        <p className="preview-meta">
          {type} • {item.owner?.name || item.vendor?.storeName || 'Marketplace review'}
        </p>
      </div>
      <StatusPill status={item.status} />
    </Link>
  )
}

function Overview() {
  const [data, setData] = useState({
    pendingVendors: [],
    pendingProducts: [],
    vendors: [],
    isMock: false,
  })

  useEffect(() => {
    let isMounted = true

    async function loadOverview() {
      const [pendingVendors, pendingProducts, vendors] = await Promise.all([
        getPendingVendors(),
        getPendingProducts(),
        getAllVendors(),
      ])

      if (!isMounted) return
      setData({
        pendingVendors: pendingVendors.data,
        pendingProducts: pendingProducts.data,
        vendors: vendors.data,
        isMock: pendingVendors.isMock || pendingProducts.isMock || vendors.isMock,
      })
    }

    loadOverview()
    return () => {
      isMounted = false
    }
  }, [])

  const activeVendors = data.vendors.filter((vendor) => vendor.status === 'approved').length
  const recentVendors = data.pendingVendors.slice(0, 2)
  const recentProducts = data.pendingProducts.slice(0, 3)

  return (
    <>
      {data.isMock ? (
        <div className="mock-banner">
          Showing local mock data because the admin API is unavailable or auth is not connected.
        </div>
      ) : null}

      <section className="admin-grid-stats">
        <StatCard label="Pending vendors" value={data.pendingVendors.length} caption="Awaiting account approval" />
        <StatCard label="Pending products" value={data.pendingProducts.length} caption="New items and staged edits" />
        <StatCard label="GMV 30d" value={formatCurrency(42800000)} caption="Mock metric until order analytics are wired" />
        <StatCard label="Active vendors" value={activeVendors} caption="Approved and selling" />
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Recent pending reviews</h2>
            <p className="admin-section-note">Jump into the queues that need Super Admin action.</p>
          </div>
        </div>

        <div className="admin-card stat-card">
          <div className="preview-list">
            {recentVendors.map((vendor) => (
              <PreviewRow
                key={vendor._id || vendor.id}
                item={vendor}
                type="Vendor"
                to="/admin/vendor-approvals"
              />
            ))}
            {recentProducts.map((product) => (
              <PreviewRow
                key={product._id || product.id}
                item={product}
                type="Product"
                to="/admin/product-approvals"
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Overview
