import { api } from './api.js'

export const promocodesService = {
  async validate({ code, orderTotal }) {
    return api.post('/api/promocodes/validate', { body: { code, orderTotal } })
  }
}

