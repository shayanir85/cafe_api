import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const publicRoutes = ['/', '/login', '/checkout']
      const isPublic = publicRoutes.some((r) => window.location.pathname === r)
      if (!isPublic) {
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return `${API_BASE}${path}`
  return `${API_BASE}/${path}`
}

export default api
