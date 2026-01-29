import { api } from './api.js'

const STORAGE_ADMIN_TOKEN_KEY = 'admin_token'

export const adminTokenStore = {
  get() {
    return localStorage.getItem(STORAGE_ADMIN_TOKEN_KEY) || ''
  },
  set(token) {
    if (token) localStorage.setItem(STORAGE_ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(STORAGE_ADMIN_TOKEN_KEY)
  }
}

export const withAdminAuth = ({ headers, ...rest } = {}) => {
  const token = adminTokenStore.get()
  return {
    ...rest,
    headers: {
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
}

export const adminAuthService = {
  async loginInit({ email, password }) {
    return api.post('/api/admin/login/init', { body: { email, password } })
  },

  async loginVerify({ email, otp }) {
    const res = await api.post('/api/admin/login/verify', { body: { email, otp } })
    if (res?.token) adminTokenStore.set(res.token)
    return res
  },

  async me() {
    const token = adminTokenStore.get()
    return api.get('/api/admin/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  },

  logout() {
    adminTokenStore.set('')
    return { ok: true }
  }
}
