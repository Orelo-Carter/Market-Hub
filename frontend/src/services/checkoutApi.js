import apiClient from './apiClient'

export async function createCheckout(payload) {
  const response = await apiClient.post('/api/checkout', payload)
  return response.data
}

export async function verifyCheckout(reference) {
  const response = await apiClient.get(`/api/checkout/verify/${encodeURIComponent(reference)}`)
  return response.data
}
