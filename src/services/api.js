const joinUrl = (baseUrl, path) => {
  const base = String(baseUrl || '').replace(/\/+$/, '')
  const p = String(path || '')
  if (!p) return base
  if (!p.startsWith('/')) return `${base}/${p}`
  return `${base}${p}`
}

const readJson = async (res) => {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const STORAGE_TOKEN_KEY = 'auth_token'

export const tokenStore = {
  get() {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || ''
  },
  set(token) {
    if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token)
    else localStorage.removeItem(STORAGE_TOKEN_KEY)
  }
}

export const createApiClient = ({ baseUrl } = {}) => {
  const resolvedBaseUrl = baseUrl ?? import.meta.env.VITE_API_URL ?? ''

  const request = async (method, path, { body, headers } = {}) => {
    const url = joinUrl(resolvedBaseUrl, path)
    const token = tokenStore.get()

    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {})
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await readJson(res)
    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && data.message && String(data.message)) || `Request failed (${res.status})`
      throw new ApiError(message, { status: res.status, data })
    }
    return data
  }

  return {
    get: (path, opts) => request('GET', path, opts),
    post: (path, opts) => request('POST', path, opts),
    put: (path, opts) => request('PUT', path, opts),
    patch: (path, opts) => request('PATCH', path, opts),
    del: (path, opts) => request('DELETE', path, opts)
  }
}

export const api = createApiClient()
