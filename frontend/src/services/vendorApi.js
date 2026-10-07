import apiClient from './apiClient'
import { useAuthStore } from '../stores/authStore'

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

export const mockVendorMe = {
  role: 'vendor_manager',
  user: { name: 'Vendor Owner', email: 'vendor@example.com' },
  vendor: {
    _id: 'vendor_1024',
    storeName: 'Atlas Apparel',
    description: 'Modern essentials from independent sellers.',
    logo: '',
    banner: '',
  },
  permissions: {
    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,
    canViewOrders: false,
  },
}

export const mockVendorProducts = [
  {
    _id: 'prod_live_101',
    title: 'Linen Utility Jacket',
    name: 'Linen Utility Jacket',
    category: 'Outerwear',
    price: 88,
    compareAtPrice: 120,
    stock: 34,
    sku: 'ATL-JKT-101',
    status: 'approved',
  },
  {
    _id: 'prod_pending_202',
    title: 'Canvas Weekend Bag',
    name: 'Canvas Weekend Bag',
    category: 'Bags',
    price: 64,
    stock: 20,
    sku: 'ATL-BAG-202',
    status: 'pending_approval',
  },
  {
    _id: 'prod_changes_303',
    title: 'Cotton Rib Tee',
    name: 'Cotton Rib Tee',
    category: 'Tops',
    price: 26,
    stock: 80,
    sku: 'ATL-TEE-303',
    status: 'changes_pending',
    pendingChanges: { price: 29, stock: 96 },
  },
  {
    _id: 'prod_rejected_404',
    title: 'Leather Crossbody',
    name: 'Leather Crossbody',
    category: 'Bags',
    price: 72,
    stock: 12,
    sku: 'ATL-BAG-404',
    status: 'rejected',
    rejectionReason: 'Please add clearer product images and material details.',
  },
]

export const mockVendorOrders = [
  {
    _id: 'ord_900183',
    orderId: 'MH-900183',
    customerName: 'Nia Brooks',
    itemsCount: 3,
    total: 146,
    status: 'pending',
    date: '2026-07-28T16:24:00.000Z',
    shippingAddress: '148 West Hill St, Austin, TX 78701',
    lineItems: [
      { name: 'Linen Utility Jacket', quantity: 1, price: 88, sku: 'ATL-JKT-101' },
      { name: 'Cotton Rib Tee', quantity: 2, price: 29, sku: 'ATL-TEE-303' },
    ],
  },
  {
    _id: 'ord_900184',
    orderId: 'MH-900184',
    customerName: 'Owen Chen',
    itemsCount: 1,
    total: 64,
    status: 'processing',
    date: '2026-07-27T10:12:00.000Z',
    shippingAddress: '72 Market Ln, Chicago, IL 60607',
    lineItems: [
      { name: 'Canvas Weekend Bag', quantity: 1, price: 64, sku: 'ATL-BAG-202' },
    ],
  },
]

export const mockManagers = [
  {
    _id: 'mgr_221',
    name: 'Lena Watts',
    email: 'lena@example.com',
    permissions: {
      canCreateProduct: true,
      canEditProduct: true,
      canDeleteProduct: false,
      canViewOrders: true,
    },
  },
]

async function withMockFallback(request, mockData) {
  try {
    const response = await request()
    const payload = response.data
    return {
      data: payload.data || payload.vendor || payload.products || payload.orders || payload.managers || payload,
      isMock: false,
    }
  } catch (error) {
    return { data: mockData, isMock: true, error }
  }
}

async function withVendorSessionFallback(request) {
  try {
    const response = await request()
    return { data: response.data, isMock: false }
  } catch (error) {
    const savedUser = useAuthStore.getState().user
    const role = savedUser?.role || mockVendorMe.role
    const permissions = role === 'vendor_admin'
      ? fullPermissions
      : { ...noManagerPermissions, ...(savedUser?.permissions || {}) }

    return {
      data: {
        ...mockVendorMe,
        role,
        user: savedUser || mockVendorMe.user,
        permissions,
      },
      isMock: true,
      error,
    }
  }
}

function normalizeVendorOrder(order) {
  const subOrder = order.subOrder || order.subOrders?.[0] || order
  const customer = order.customer || {}
  const items = subOrder.items || order.lineItems || []

  return {
    _id: order._id,
    subOrderId: subOrder._id,
    orderId: order.orderId || order._id,
    customerName: order.customerName || customer.name || customer.email || 'Customer',
    itemsCount: order.itemsCount || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    total: subOrder.subtotal ?? subOrder.total ?? order.totalAmount ?? order.total ?? 0,
    status: subOrder.status || order.status || 'pending',
    date: order.date || subOrder.createdAt || order.createdAt,
    shippingAddress: order.shippingAddress || order.shipping?.address || 'No shipping address',
    lineItems: items.map((item) => ({
      name: item.name || item.product?.name || item.product?.title || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      sku: item.sku || item.product?.sku || '',
    })),
  }
}

function normalizeStatus(status, pendingChanges) {
  if (status === 'pending_admin') return 'pending_approval'
  if (status === 'approved' && pendingChanges?.reviewStatus) return 'changes_pending'
  return status
}

function normalizeVendorProduct(product) {
  return {
    ...product,
    title: product.title || product.name,
    name: product.name || product.title,
    status: normalizeStatus(product.status, product.pendingChanges),
    category:
      product.category?.name
      || product.categories?.map((category) => category.name || category).join(', ')
      || product.category,
  }
}

export function getVendorMe() {
  return withVendorSessionFallback(() => apiClient.get('/api/vendor/me'))
}

export function updateVendorProfile(payload) {
  return apiClient.patch('/api/vendor/profile', payload)
}

export async function getVendorProducts() {
  const result = await withMockFallback(() => apiClient.get('/api/vendor/products'), mockVendorProducts)
  return {
    ...result,
    data: result.isMock ? result.data : result.data.map(normalizeVendorProduct),
  }
}

export function createVendorProduct(payload) {
  return apiClient.post('/api/vendor/products', payload)
}

export function updateVendorProduct(id, payload) {
  return apiClient.patch(`/api/vendor/products/${id}`, payload)
}

export function deleteVendorProduct(id) {
  return apiClient.delete(`/api/vendor/products/${id}`)
}

export async function getVendorOrders() {
  const result = await withMockFallback(() => apiClient.get('/api/vendor/orders'), mockVendorOrders)
  return {
    ...result,
    data: result.isMock ? result.data : result.data.map(normalizeVendorOrder),
  }
}

export function updateVendorOrderStatus(order, payload) {
  if (order.subOrderId) {
    return apiClient.patch(`/api/vendor/orders/${order._id}/sub-orders/${order.subOrderId}/status`, payload)
  }

  return apiClient.patch(`/api/vendor/orders/${order._id}/status`, payload)
}

export function getVendorManagers(vendorId) {
  return withMockFallback(() => apiClient.get(`/api/vendors/${vendorId}/managers`), mockManagers)
}

export function inviteVendorManager(vendorId, payload) {
  return apiClient.post(`/api/vendors/${vendorId}/managers`, payload)
}

export function updateVendorManagerPermissions(vendorId, userId, permissions) {
  return apiClient.patch(`/api/vendors/${vendorId}/managers/${userId}/permissions`, { permissions })
}

export function removeVendorManager(vendorId, userId) {
  return apiClient.delete(`/api/vendors/${vendorId}/managers/${userId}`)
}
