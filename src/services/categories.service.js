import { api } from './api.js'

export const categoriesService = {
  async list({ page = 1, limit = 50, q = '', isActive } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (q) params.set('q', String(q))
    if (isActive !== undefined) params.set('isActive', String(Boolean(isActive)))
    return api.get(`/api/categories?${params.toString()}`)
  },

  async getById(id) {
    return api.get(`/api/categories/${id}`)
  }
}

