import apiClient from './apiClient'
import { mockCategories } from './categoryApi'

const mockVendors = [
  {
    _id: 'vendor_atlas',
    storeName: 'Atlas Apparel',
    slug: 'atlas-apparel',
    description: 'Modern wardrobe essentials from independent makers.',
    logoUrl: '',
    ratingAvg: 4.8,
  },
  {
    _id: 'vendor_pixel',
    storeName: 'Pixel Pantry',
    slug: 'pixel-pantry',
    description: 'Useful tech, audio, and desk gear.',
    logoUrl: '',
    ratingAvg: 4.6,
  },
]

export const mockProducts = [
  {
    _id: 'prod_hoodie',
    id: 'prod_hoodie',
    slug: 'heavyweight-fleece-hoodie',
    title: 'Heavyweight Fleece Hoodie',
    name: 'Heavyweight Fleece Hoodie',
    description: 'A structured fleece hoodie with a soft brushed interior and everyday fit.',
    price: 68,
    compareAtPrice: 88,
    flashSale: { active: true, endsAt: '2026-12-31T23:59:59.000Z' },
    salesCount: 180,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'],
    vendor: mockVendors[0],
    categories: ['cat_fashion', 'cat_mens'],
    ratingAvg: 4.8,
    reviewCount: 126,
    stock: 0,
    variants: [
      {
        name: 'Size',
        options: [
          { label: 'S', priceModifier: 0, stock: 12, sku: 'HOOD-BLK-S' },
          { label: 'M', priceModifier: 0, stock: 20, sku: 'HOOD-BLK-M' },
          { label: 'L', priceModifier: 0, stock: 18, sku: 'HOOD-BLK-L' },
          { label: 'XL', priceModifier: 3, stock: 7, sku: 'HOOD-BLK-XL' },
        ],
      },
      {
        name: 'Color',
        options: [
          { label: 'Black', priceModifier: 0, stock: 20, sku: 'HOOD-BLK' },
          { label: 'Forest', priceModifier: 2, stock: 12, sku: 'HOOD-FOR' },
        ],
      },
    ],
  },
  {
    _id: 'prod_lamp',
    id: 'prod_lamp',
    slug: 'smart-desk-lamp',
    title: 'Smart Desk Lamp',
    name: 'Smart Desk Lamp',
    description: 'Adjustable LED desk lamp with warm/cool modes and a clean aluminum body.',
    price: 64,
    compareAtPrice: 79,
    salesCount: 126,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'],
    vendor: mockVendors[1],
    categories: ['cat_electronics', 'cat_audio'],
    ratingAvg: 4.6,
    reviewCount: 88,
    stock: 22,
    variants: [],
  },
  {
    _id: 'prod_bag',
    id: 'prod_bag',
    slug: 'canvas-weekend-bag',
    title: 'Canvas Weekend Bag',
    name: 'Canvas Weekend Bag',
    description: 'Durable canvas bag with leather trim and a roomy interior.',
    price: 72,
    compareAtPrice: 150,
    flashSale: { active: true, endsAt: '2026-12-25T23:59:59.000Z' },
    salesCount: 92,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'],
    vendor: mockVendors[0],
    categories: ['cat_fashion'],
    ratingAvg: 4.4,
    reviewCount: 54,
    stock: 14,
    variants: [],
  },
  {
    _id: 'prod_audio',
    id: 'prod_audio',
    slug: 'portable-audio-speaker',
    title: 'Portable Audio Speaker',
    name: 'Portable Audio Speaker',
    description: 'Compact wireless speaker with crisp sound and all-day battery life.',
    price: 45,
    compareAtPrice: 59,
    salesCount: 220,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80'],
    vendor: mockVendors[1],
    categories: ['cat_electronics', 'cat_audio'],
    ratingAvg: 4.7,
    reviewCount: 101,
    stock: 31,
    variants: [],
  },
]

export const mockReviews = [
  { _id: 'rev_1', rating: 5, comment: 'Excellent quality and fast shipping.', customer: { name: 'Nia Brooks' }, createdAt: '2026-07-24T12:00:00.000Z' },
  { _id: 'rev_2', rating: 4, comment: 'Looks exactly like the photos.', customer: { name: 'Owen Chen' }, createdAt: '2026-07-18T12:00:00.000Z' },
]

async function withMockFallback(request, mockData) {
  try {
    const response = await request()
    return {
      data: response.data.data || response.data.products || response.data.product || response.data.vendor || response.data.categories || response.data,
      pagination: response.data.pagination,
      isMock: false,
    }
  } catch (error) {
    return { data: mockData, isMock: true, error }
  }
}

export function getStorefrontCategories() {
  return withMockFallback(() => apiClient.get('/api/categories'), mockCategories)
}

export function getStorefrontProducts(params = {}) {
  return withMockFallback(() => apiClient.get('/api/products', { params }), mockProducts)
}

export function getFlashSaleProducts() {
  const now = Date.now()
  const fallback = mockProducts.filter((product) =>
    product.flashSale?.active && new Date(product.flashSale.endsAt).getTime() > now,
  )
  return withMockFallback(() => apiClient.get('/api/products/flash-sales'), fallback)
}

export async function getTopSellerProducts(limit = 12) {
  const hasSales = mockProducts.some((product) => Number(product.salesCount || 0) > 0)
  const fallback = [...mockProducts]
    .sort((a, b) => hasSales ? Number(b.salesCount || 0) - Number(a.salesCount || 0) : 0)
    .slice(0, limit)

  try {
    const response = await apiClient.get('/api/products/top-sellers', { params: { limit } })
    return {
      data: response.data.data || [],
      isFallback: Boolean(response.data.isFallback),
      isMock: false,
    }
  } catch (error) {
    return {
      data: fallback,
      isFallback: !hasSales,
      isMock: true,
      error,
    }
  }
}

export function getStorefrontProduct(slug) {
  const fallback = mockProducts.find((product) => product.slug === slug) || mockProducts[0]
  return withMockFallback(() => apiClient.get(`/api/products/${slug}`), fallback)
}

export function getStorefrontVendor(slug) {
  const fallback = mockVendors.find((vendor) => vendor.slug === slug) || mockVendors[0]
  return withMockFallback(() => apiClient.get(`/api/vendors/public/${slug}`), fallback)
}

export function getProductReviews(productId) {
  return withMockFallback(() => apiClient.get(`/api/products/${productId}/reviews`), {
    reviews: mockReviews,
    averageRating: 4.7,
    count: mockReviews.length,
  })
}

export { mockVendors }
