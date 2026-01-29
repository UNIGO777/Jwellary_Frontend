const safeParseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const readArray = (key) => {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(key)
  const arr = safeParseJson(raw, [])
  return Array.isArray(arr) ? arr : []
}

const writeArray = (key, arr) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(arr))
}

const readObject = (key) => {
  if (typeof localStorage === 'undefined') return {}
  const raw = localStorage.getItem(key)
  const obj = safeParseJson(raw, {})
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
}

const writeObject = (key, obj) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(obj))
}

const WISHLIST_KEY = 'shop:wishlist:v1'
const CART_KEY = 'shop:cart:v1'

export const wishlistStore = {
  getIds() {
    return readArray(WISHLIST_KEY)
  },
  has(id) {
    if (!id) return false
    return this.getIds().includes(id)
  },
  toggle(id) {
    if (!id) return this.getIds()
    const ids = this.getIds()
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    writeArray(WISHLIST_KEY, next)
    return next
  },
  remove(id) {
    if (!id) return this.getIds()
    const next = this.getIds().filter((x) => x !== id)
    writeArray(WISHLIST_KEY, next)
    return next
  },
  clear() {
    writeArray(WISHLIST_KEY, [])
    return []
  }
}

export const cartStore = {
  getMap() {
    return readObject(CART_KEY)
  },
  getItems() {
    const map = this.getMap()
    return Object.entries(map)
      .map(([productId, qty]) => ({ productId, qty: Number(qty || 0) }))
      .filter((it) => it.productId && Number.isFinite(it.qty) && it.qty > 0)
  },
  getCount() {
    return this.getItems().reduce((sum, it) => sum + it.qty, 0)
  },
  setQty(productId, qty) {
    if (!productId) return this.getMap()
    const safeQty = Math.max(0, Math.floor(Number(qty || 0)))
    const map = this.getMap()
    const next = { ...map }
    if (safeQty <= 0) delete next[productId]
    else next[productId] = safeQty
    writeObject(CART_KEY, next)
    return next
  },
  add(productId, qty = 1) {
    const map = this.getMap()
    const current = Number(map[productId] || 0)
    return this.setQty(productId, current + Number(qty || 1))
  },
  remove(productId) {
    return this.setQty(productId, 0)
  },
  clear() {
    writeObject(CART_KEY, {})
    return {}
  }
}

