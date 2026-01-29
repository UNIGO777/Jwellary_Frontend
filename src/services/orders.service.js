import { api } from './api.js'

export const ordersService = {
  async list({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    return api.get(`/api/orders?${params.toString()}`)
  },

  async getById(orderId) {
    return api.get(`/api/orders/${orderId}`)
  },

  async create(payload) {
    return api.post('/api/orders', { body: payload })
  }
}

