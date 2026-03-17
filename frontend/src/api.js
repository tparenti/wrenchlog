function normalizeBaseUrl(value) {
  if (!value) return ''
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function getRuntimeApiBase() {
  if (typeof window === 'undefined') return '/api'

  const runtimeOverride = window.__WRENCHLOG_CONFIG__?.apiBaseUrl
  if (runtimeOverride) return normalizeBaseUrl(runtimeOverride)

  const envOverride = import.meta.env.VITE_API_BASE_URL
  if (envOverride) return normalizeBaseUrl(envOverride)

  const { protocol, hostname, port } = window.location
  if (port === '5173') {
    return `${protocol}//${hostname}:5000/api`
  }

  return '/api'
}

const API_BASE = getRuntimeApiBase()

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalizedPath}`
}
