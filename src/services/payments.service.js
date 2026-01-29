import { api } from './api.js'

export const paymentsService = {
  async create(payload) {
    return api.post('/api/payments', { body: payload })
  },

  async getById(paymentId) {
    return api.get(`/api/payments/${paymentId}`)
  },

  async setStatus(paymentId, payload) {
    return api.patch(`/api/payments/${paymentId}/status`, { body: payload })
  }
}
