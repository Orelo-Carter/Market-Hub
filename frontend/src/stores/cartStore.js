import { create } from 'zustand'
import { readCart, writeCart } from '../services/cartStorage'

function itemKey(item) {
  return `${item.productId}:${JSON.stringify(item.variantSelection || {})}`
}

function save(items) {
  writeCart(items)
  return items
}

export const useCartStore = create((set) => ({
  items: readCart(),
  addItem: (item) => set((state) => {
    const key = itemKey(item)
    const existing = state.items.find((cartItem) => itemKey(cartItem) === key)
    const items = existing
      ? state.items.map((cartItem) =>
          itemKey(cartItem) === key
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + item.quantity, item.stock || 999) }
            : cartItem,
        )
      : [...state.items, item]
    return { items: save(items) }
  }),
  updateQuantity: (key, quantity) => set((state) => ({
    items: save(state.items.map((item) => itemKey(item) === key ? { ...item, quantity } : item)),
  })),
  removeItem: (key) => set((state) => ({
    items: save(state.items.filter((item) => itemKey(item) !== key)),
  })),
  clearCart: () => set({ items: save([]) }),
}))

export { itemKey }
