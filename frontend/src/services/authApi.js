import apiClient from './apiClient'

export async function loginUser(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials)
  return response.data
}

export async function registerCustomer(payload) {
  const response = await apiClient.post('/api/auth/register', payload)
  return response.data
}

export async function registerVendor(payload) {
  const response = await apiClient.post('/api/vendors/register', payload)
  return response.data
}

export async function validateSetPasswordToken(token) {
  const response = await apiClient.get(`/api/auth/set-password/${encodeURIComponent(token)}/validate`)
  return response.data
}

export async function setInvitePassword(payload) {
  const response = await apiClient.post('/api/auth/set-password', payload)
  return response.data
}
