import { api } from './api.js'

export const subcategoriesService = {
  async list({ page = 1, limit = 50, q = '', isActive, categoryId } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (q) params.set('q', String(q))
    if (isActive !== undefined) params.set('isActive', String(Boolean(isActive)))
    if (categoryId) params.set('categoryId', String(categoryId))
    return api.get(`/api/subcategories?${params.toString()}`)
  },

  async getById(id) {
    return api.get(`/api/subcategories/${id}`)
  }
}

