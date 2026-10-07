let memoryCart = []

export function readCart() {
  return memoryCart
}

export function writeCart(items) {
  memoryCart = items
}
