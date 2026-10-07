import apiClient from './apiClient'

function formatAddress(address = {}) {
  return [
    address.name,
    address.phone,
    address.addressLine,
    address.city,
    address.state,
    address.country,
  ].filter(Boolean).join(', ')
}

function normalizeOrder(order) {
  return {
    ...order,
    total: order.totalAmount ?? order.total ?? 0,
    shippingAddressText: formatAddress(order.shippingAddress),
    subOrders: (order.subOrders || []).map((subOrder) => ({
      ...subOrder,
      vendorName: subOrder.vendor?.storeName || 'Marketplace vendor',
      subtotal: subOrder.subtotal ?? 0,
      items: subOrder.items || [],
    })),
  }
}

export async function getMyOrders() {
  const response = await apiClient.get('/api/orders')
  const data = response.data.data || response.data.orders || response.data || []
  return Array.isArray(data) ? data.map(normalizeOrder) : []
}

export async function getMyOrder(orderId) {
  const response = await apiClient.get(`/api/orders/${orderId}`)
  return normalizeOrder(response.data.order || response.data)
}
