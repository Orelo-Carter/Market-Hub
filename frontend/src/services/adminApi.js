import apiClient from './apiClient'

export const mockPendingVendors = [
  {
    id: 'ven_1842',
    _id: 'ven_1842',
    storeName: 'Northline Goods',
    owner: { name: 'Amara Cole', email: 'amara@example.com' },
    category: 'Home and living',
    status: 'pending',
    submittedAt: '2026-07-28T14:35:00.000Z',
    productsCount: 0,
    joinedAt: '2026-07-28T14:35:00.000Z',
  },
  {
    id: 'ven_1843',
    _id: 'ven_1843',
    storeName: 'Pixel Pantry',
    owner: { name: 'Jon Bell', email: 'jon@example.com' },
    category: 'Electronics',
    status: 'pending',
    submittedAt: '2026-07-28T11:10:00.000Z',
    productsCount: 0,
    joinedAt: '2026-07-28T11:10:00.000Z',
  },
]

export const mockProducts = [
  {
    id: 'prd_7001',
    _id: 'prd_7001',
    name: 'Everyday Canvas Tote',
    vendor: { storeName: 'Northline Goods' },
    status: 'pending_approval',
    price: 28,
    stock: 120,
    category: 'Accessories',
    submittedAt: '2026-07-28T17:42:00.000Z',
  },
  {
    id: 'prd_7002',
    _id: 'prd_7002',
    name: 'Smart Desk Lamp',
    vendor: { storeName: 'Pixel Pantry' },
    status: 'changes_pending',
    price: 64,
    stock: 48,
    category: 'Electronics',
    submittedAt: '2026-07-28T15:12:00.000Z',
    liveValues: {
      name: 'Smart LED Desk Lamp',
      price: 58,
      stock: 35,
      description: 'Adjustable LED lamp with warm and cool light modes.',
    },
    pendingChanges: {
      name: 'Smart Desk Lamp',
      price: 64,
      stock: 48,
      description: 'Adjustable LED desk lamp with app controls and warm/cool modes.',
    },
  },
]

export const mockVendors = [
  ...mockPendingVendors,
  {
    id: 'ven_1102',
    _id: 'ven_1102',
    storeName: 'Atlas Apparel',
    owner: { name: 'Mia Rhodes', email: 'mia@example.com' },
    category: 'Fashion',
    status: 'approved',
    productsCount: 42,
    joinedAt: '2026-04-18T09:20:00.000Z',
  },
  {
    id: 'ven_1103',
    _id: 'ven_1103',
    storeName: 'Metro Market',
    owner: { name: 'Theo Mason', email: 'theo@example.com' },
    category: 'Groceries',
    status: 'suspended',
    productsCount: 18,
    joinedAt: '2026-05-06T12:00:00.000Z',
  },
]

async function withMockFallback(request, mockData) {
  try {
    const response = await request()
    const payload = response.data
    return {
      data: payload.data || payload.vendors || payload.products || payload.orders || payload,
      isMock: false,
    }
  } catch (error) {
    return { data: mockData, isMock: true, error }
  }
}

export function getPendingVendors() {
  return withMockFallback(() => apiClient.get('/api/admin/vendors/pending'), mockPendingVendors)
}

export function getPendingProducts() {
  return withMockFallback(() => apiClient.get('/api/admin/products/pending'), mockProducts)
}

export function getAllVendors() {
  return withMockFallback(() => apiClient.get('/api/admin/vendors'), mockVendors)
}

export function approveVendor(id) {
  return apiClient.patch(`/api/admin/vendors/${id}/approve`)
}

export function rejectVendor(id, reason) {
  return apiClient.patch(`/api/admin/vendors/${id}/reject`, { reason })
}

export function suspendVendor(id) {
  return apiClient.patch(`/api/admin/vendors/${id}/suspend`)
}

export function approveProduct(id) {
  return apiClient.patch(`/api/admin/products/${id}/approve`)
}

export function rejectProduct(id, reason) {
  return apiClient.patch(`/api/admin/products/${id}/reject`, { reason })
}
