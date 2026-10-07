import apiClient from './apiClient'

export const mockCategories = [
  { _id: 'cat_fashion', name: 'Fashion & Apparel', slug: 'fashion-apparel', parent: null, image: '' },
  { _id: 'cat_mens', name: "Men's Clothing", slug: 'mens-clothing', parent: { _id: 'cat_fashion' }, image: '' },
  { _id: 'cat_womens', name: "Women's Clothing", slug: 'womens-clothing', parent: { _id: 'cat_fashion' }, image: '' },
  { _id: 'cat_electronics', name: 'Electronics', slug: 'electronics', parent: null, image: '' },
  { _id: 'cat_audio', name: 'Audio', slug: 'audio', parent: { _id: 'cat_electronics' }, image: '' },
  { _id: 'cat_home_garden', name: 'Home & Garden', slug: 'home-garden', parent: null, image: '' },
  { _id: 'cat_health_beauty', name: 'Health & Beauty', slug: 'health-beauty', parent: null, image: '' },
  { _id: 'cat_sports_outdoors', name: 'Sports & Outdoors', slug: 'sports-outdoors', parent: null, image: '' },
  { _id: 'cat_baby_kids_toys', name: 'Baby, Kids & Toys', slug: 'baby-kids-toys', parent: null, image: '' },
  { _id: 'cat_handmade', name: 'Handmade & Craft Supplies', slug: 'handmade-craft-supplies', parent: null, image: '' },
  { _id: 'cat_pet_supplies', name: 'Pet Supplies', slug: 'pet-supplies', parent: null, image: '' },
]

async function withMockFallback(request, mockData) {
  try {
    const response = await request()
    return {
      data: response.data.categories || response.data.data || response.data,
      isMock: false,
    }
  } catch (error) {
    return { data: mockData, isMock: true, error }
  }
}

export function getCategories() {
  return withMockFallback(() => apiClient.get('/api/categories'), mockCategories)
}

export function getAdminCategories() {
  return withMockFallback(() => apiClient.get('/api/admin/categories'), mockCategories)
}

export function createCategory(payload) {
  return apiClient.post('/api/admin/categories', payload)
}

export function updateCategory(id, payload) {
  return apiClient.patch(`/api/admin/categories/${id}`, payload)
}

export function deleteCategory(id) {
  return apiClient.delete(`/api/admin/categories/${id}`)
}
