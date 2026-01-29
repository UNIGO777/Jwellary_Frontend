import { api } from './api.js'
import { normalizeProduct } from './products.service.js'

const normalizeCartItem = (item) => {
  if (!item) return null
  const product = normalizeProduct(item.product)
  if (!product) return null
  return {
    id: item._id || item.id,
    product
  }
}

export const cartService = {
  async list() {
    const res = await api.get('/api/cart')
    const data = Array.isArray(res?.data) ? res.data : []
    return { ok: Boolean(res?.ok), data: data.map(normalizeCartItem).filter(Boolean) }
  },

  async add(productId) {
    const res = await api.post('/api/cart', { body: { productId } })
    return { ok: Boolean(res?.ok), data: normalizeCartItem(res?.data) }
  },

  async remove(productId) {
    return api.del(`/api/cart/${productId}`)
  }
}

