import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))
  const token = ref(sessionStorage.getItem('access_token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  function saveAuth(data) {
    const t = data.token || data.access_token
    if (!t) return false

    token.value = t
    sessionStorage.setItem('access_token', t)

    user.value = {
      id: data.id || null,
      name: data.name || 'کاربر',
      email: data.email || null,
      role: data.role || 'user',
      phone_number: data.phone_number || null,
    }
    sessionStorage.setItem('user', JSON.stringify(user.value))
    return true
  }

  function clearAuth() {
    token.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
  }

  async function login({ email, password }) {
    const data = await authApi.login({ email, password })
    const saved = saveAuth(data)
    if (!saved) throw new Error('خطا در ذخیره اطلاعات کاربر')
    return data
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
    }
  }

  async function fetchUser() {
    try {
      const data = await authApi.getUser()
      const userData = data?.user || data
      if (userData) {
        user.value = userData
        sessionStorage.setItem('user', JSON.stringify(userData))
      }
      return userData
    } catch {
      clearAuth()
      return null
    }
  }

  return { user, token, isLoggedIn, isAdmin, isSuperAdmin, login, logout, fetchUser, clearAuth, saveAuth }
})
