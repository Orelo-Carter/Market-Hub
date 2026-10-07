import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../../components/admin/EmptyState'
import Topbar from '../../components/admin/Topbar'
import VendorSidebar from '../../components/vendor/VendorSidebar'
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorManagers,
  getVendorMe,
  getVendorOrders,
  getVendorProducts,
  inviteVendorManager,
  removeVendorManager,
  updateVendorManagerPermissions,
  updateVendorOrderStatus,
  updateVendorProduct,
  updateVendorProfile,
} from '../../services/vendorApi'
import Managers from './Managers'
import Orders from './Orders'
import Overview from './Overview'
import Payouts from './Payouts'
import ProductForm from './ProductForm'
import Products from './Products'
import StoreSettings from './StoreSettings'

const pageTitles = {
  '/vendor': {
    title: 'Vendor Overview',
    kicker: 'Store performance, approvals, and fulfillment at a glance.',
  },
  '/vendor/products': {
    title: 'Products',
    kicker: 'Manage listings without changing the live storefront until approval.',
  },
  '/vendor/products/new': {
    title: 'New Product',
    kicker: 'Create a product submission for Super Admin approval.',
  },
  '/vendor/orders': {
    title: 'Orders',
    kicker: 'Fulfill this store’s sub-orders only.',
  },
  '/vendor/managers': {
    title: 'Managers',
    kicker: 'Invite managers and scope their store permissions.',
  },
  '/vendor/settings': {
    title: 'Store Settings',
    kicker: 'Manage your store profile and payout information.',
  },
  '/vendor/payouts': {
    title: 'Payouts',
    kicker: 'Track payout activity and payment setup.',
  },
}

const fullPermissions = {
  canCreateProduct: true,
  canEditProduct: true,
  canDeleteProduct: true,
  canViewOrders: true,
}

const noManagerPermissions = {
  canCreateProduct: false,
  canEditProduct: false,
  canDeleteProduct: false,
  canViewOrders: false,
}

function normalizeSubmittedProduct(product, fallbackPayload) {
  const data = product || fallbackPayload
  const status = data.status === 'pending_admin'
    ? 'pending_approval'
    : data.status === 'approved' && data.pendingChanges?.reviewStatus
      ? 'changes_pending'
      : data.status

  return {
    ...data,
    ...fallbackPayload,
    _id: data._id || `local_${Date.now()}`,
    name: data.name || fallbackPayload.name || fallbackPayload.title,
    title: data.title || data.name || fallbackPayload.title || fallbackPayload.name,
    status: status || 'pending_approval',
  }
}

function getInitials(name = 'Vendor') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getRouteTitle(pathname) {
  if (pathname.includes('/vendor/products/') && pathname.endsWith('/edit')) {
    return {
      title: 'Edit Product',
      kicker: 'Stage changes for Super Admin approval.',
    }
  }

  if (pathname.includes('/vendor/orders/')) {
    return pageTitles['/vendor/orders']
  }

  return pageTitles[pathname] || pageTitles['/vendor']
}

function normalizeSession(payload) {
  const role = payload.role || payload.user?.role || 'vendor_manager'
  return {
    role,
    user: payload.user || { name: 'Vendor User' },
    vendor: payload.vendor || payload,
    permissions: role === 'vendor_admin' ? fullPermissions : payload.permissions || {},
  }
}

function RequireVendorAccess({ session, permissions, role, permission, children }) {
  const isVendorAdmin = session?.role === 'vendor_admin'
  const hasRole = !role || session?.role === role
  const hasPermission = !permission || isVendorAdmin || Boolean(permissions?.[permission])

  if (!hasRole || !hasPermission) {
    return <Navigate to="/vendor" replace />
  }

  return children
}

function VendorDashboard() {
  const location = useLocation()
  const currentPage = getRouteTitle(location.pathname)
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [managers, setManagers] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const permissions = useMemo(() => {
    if (!session) return noManagerPermissions
    if (session.role === 'vendor_admin') return fullPermissions
    return { ...noManagerPermissions, ...session.permissions }
  }, [session])

  useEffect(() => {
    let isMounted = true

    async function loadVendorDashboard() {
      setIsLoading(true)
      const meResult = await getVendorMe()

      if (!isMounted) return

      const normalized = normalizeSession(meResult.data)
      setSession(normalized)
      const normalizedPermissions = normalized.role === 'vendor_admin'
        ? fullPermissions
        : { ...noManagerPermissions, ...normalized.permissions }

      const productsResult = await getVendorProducts()
      if (!isMounted) return
      setProducts(Array.isArray(productsResult.data) ? productsResult.data : [])
      setIsMock(meResult.isMock || productsResult.isMock)

      if (normalized.role === 'vendor_admin' || normalizedPermissions.canViewOrders) {
        const ordersResult = await getVendorOrders()
        if (!isMounted) return
        setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : [])
        setIsMock((current) => current || ordersResult.isMock)
      } else {
        setOrders([])
      }

      if (normalized.role === 'vendor_admin') {
        const managersResult = await getVendorManagers(normalized.vendor?._id)
        if (!isMounted) return
        setManagers(Array.isArray(managersResult.data) ? managersResult.data : [])
        setIsMock((current) => current || managersResult.isMock)
      }

      setIsLoading(false)
    }

    loadVendorDashboard()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmitProduct = async (editingProduct, payload) => {
    if (editingProduct) {
      const response = !isMock ? await updateVendorProduct(editingProduct._id, payload) : null
      const submittedProduct = normalizeSubmittedProduct(response?.data?.product, payload)
      setProducts((current) =>
        current.map((product) =>
          product._id === editingProduct._id
            ? {
                ...product,
                ...submittedProduct,
                pendingChanges: submittedProduct.pendingChanges || payload,
                status: product.status === 'approved' ? 'changes_pending' : submittedProduct.status,
              }
            : product,
        ),
      )
      toast.success('Changes submitted for approval')
      return
    }

    const response = !isMock ? await createVendorProduct(payload) : null
    const submittedProduct = normalizeSubmittedProduct(response?.data?.product, payload)
    setProducts((current) => [
      submittedProduct,
      ...current,
    ])
    toast.success('Product submitted for approval')
  }

  const handleDeleteProduct = async (product) => {
    if (!isMock) await deleteVendorProduct(product._id)

    if (['draft', 'rejected'].includes(product.status)) {
      setProducts((current) => current.filter((item) => item._id !== product._id))
    } else {
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id ? { ...item, deleteRequested: true, status: 'changes_pending' } : item,
        ),
      )
    }

    toast.success('Delete request submitted')
  }

  const handleUpdateOrderStatus = async (order, payload) => {
    if (!isMock) await updateVendorOrderStatus(order, payload)
    setOrders((current) =>
      current.map((item) => (item._id === order._id ? { ...item, status: payload.status } : item)),
    )
    toast.success('Order status updated')
  }

  const handleInviteManager = async (payload) => {
    try {
      if (!isMock) {
        const response = await inviteVendorManager(session.vendor?._id, payload)
        setManagers((current) => [response.data.manager, ...current])
        toast.success(`Invite sent to ${payload.email}`)
        return
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send manager invite')
      throw error
    }

    setManagers((current) => [
      {
        _id: `local_mgr_${Date.now()}`,
        name: payload.email.split('@')[0],
        email: payload.email,
        permissions: payload.permissions,
      },
      ...current,
    ])
    toast.success(`Invite sent to ${payload.email}`)
  }

  const handleUpdateManager = async (manager, permissionsPayload) => {
    if (!isMock) await updateVendorManagerPermissions(session.vendor?._id, manager._id, permissionsPayload)
    setManagers((current) =>
      current.map((item) =>
        item._id === manager._id ? { ...item, permissions: permissionsPayload } : item,
      ),
    )
  }

  const handleRemoveManager = async (manager) => {
    if (!isMock) await removeVendorManager(session.vendor?._id, manager._id)
    setManagers((current) => current.filter((item) => item._id !== manager._id))
    toast.success('Manager removed')
  }

  const handleUpdateProfile = async (payload) => {
    if (!isMock) await updateVendorProfile(payload)
    setSession((current) => ({
      ...current,
      vendor: { ...current.vendor, ...payload },
    }))
    toast.success('Store settings saved')
  }

  if (isLoading || !session) {
    return (
      <div className="admin-shell">
        <EmptyState title="Loading vendor dashboard">
          Fetching your store profile, products, and orders.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <VendorSidebar session={session} />
        <div className="admin-main">
          <Topbar
            title={currentPage.title}
            kicker={currentPage.kicker}
            userName={session.user?.name || 'Vendor User'}
            userRole={session.role === 'vendor_admin' ? 'Vendor Admin' : 'Vendor Manager'}
            initials={getInitials(session.user?.name)}
          />
          <main className="admin-content">
            <Routes>
              <Route index element={<Overview products={products} orders={orders} isMock={isMock} />} />
              <Route
                path="products"
                element={
                  <Products
                    products={products}
                    permissions={permissions}
                    onDeleteProduct={handleDeleteProduct}
                    isMock={isMock}
                  />
                }
              />
              <Route
                path="products/new"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} permission="canCreateProduct">
                    <ProductForm products={products} permissions={permissions} onSubmitProduct={handleSubmitProduct} />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="products/:productId/edit"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} permission="canEditProduct">
                    <ProductForm products={products} permissions={permissions} onSubmitProduct={handleSubmitProduct} />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="orders"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} permission="canViewOrders">
                    <Orders orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} isMock={isMock} />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="orders/:orderId"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} permission="canViewOrders">
                    <Orders orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} isMock={isMock} />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="managers"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} role="vendor_admin">
                      <Managers
                        managers={managers}
                        onInviteManager={handleInviteManager}
                        onUpdateManager={handleUpdateManager}
                        onRemoveManager={handleRemoveManager}
                        isMock={isMock}
                      />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="settings"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} role="vendor_admin">
                    <StoreSettings session={session} onUpdateProfile={handleUpdateProfile} isMock={isMock} />
                  </RequireVendorAccess>
                }
              />
              <Route
                path="payouts"
                element={
                  <RequireVendorAccess session={session} permissions={permissions} role="vendor_admin">
                    <Payouts />
                  </RequireVendorAccess>
                }
              />
              <Route path="*" element={<Navigate to="/vendor" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default VendorDashboard
