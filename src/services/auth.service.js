import { api, tokenStore } from './api.js'

export const authService = {
  async signupInit({ fullName, email, password }) {
    return api.post('/api/users/signup/init', { body: { fullName, email, password } })
  },

  async signupVerify({ email, otp }) {
    const res = await api.post('/api/users/signup/verify', { body: { email, otp } })
    if (res?.token) tokenStore.set(res.token)
    return res
  },

  async loginInit({ email, password }) {
    return api.post('/api/users/login/init', { body: { email, password } })
  },

  async loginVerify({ email, otp }) {
    const res = await api.post('/api/users/login/verify', { body: { email, otp } })
    if (res?.token) tokenStore.set(res.token)
    return res
  },

  async me() {
    return api.get('/api/users/me')
  },

  async logout() {
    tokenStore.set('')
    try {
      return await api.post('/api/users/logout')
    } catch {
      return { ok: true }
    }
  }
}
