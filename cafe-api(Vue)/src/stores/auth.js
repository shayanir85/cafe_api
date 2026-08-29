import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/services/auth'
import * as otpApi from '@/services/otp'

export const useAuthStore = defineStore('auth', () => {
  const user = ref((() => {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null') }
    catch { return null }
  })())
  const token = ref(sessionStorage.getItem('access_token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
  const isCustomer = computed(() => isLoggedIn.value && !isAdmin.value)
  const isStaff = computed(() => ['super_admin', 'admin', 'chef', 'waiter'].includes(user.value?.role))

  function saveAuth(data) {
    const t = data.token || data.access_token
    if (!t) return false

    token.value = t
    sessionStorage.setItem('access_token', t)

    const roles = data.roles || []
    const role = data.role || roles[0] || 'user'

    user.value = {
      id: data.id || null,
      name: data.name || 'کاربر',
      email: data.email || null,
      role,
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

  async function login({ phone_number, password }) {
    const data = await authApi.login({ phone_number, password })
    const saved = saveAuth(data)
    if (!saved) throw new Error('خطا در ذخیره اطلاعات کاربر')
    return data
  }

  async function otpLogin({ phone_number, otp }) {
    const data = await otpApi.otpLogin(phone_number, otp)
    const saved = saveAuth(data)
    if (!saved) throw new Error('خطا در ذخیره اطلاعات کاربر')
    return data
  }

  async function registerByOtp({ name, phone_number, password, password_confirmation, verification_token }) {
    const data = await otpApi.register({
      name,
      phone_number,
      password,
      password_confirmation,
      verification_token,
    })
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
        user.value = { ...user.value, ...userData }
        sessionStorage.setItem('user', JSON.stringify(user.value))
      }
      return userData
    } catch {
      clearAuth()
      return null
    }
  }

  return { user, token, isLoggedIn, isAdmin, isSuperAdmin, isCustomer, isStaff, login, otpLogin, registerByOtp, logout, fetchUser, clearAuth, saveAuth }
})
