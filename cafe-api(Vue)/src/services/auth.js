import api from './api'

export async function login({ phone_number, password }) {
  const response = await api.post('/login', { phone_number, password })
  return response.data?.original || response.data
}

export async function logout() {
  const response = await api.post('/auth/logout')
  return response.data
}

export async function getUser() {
  const response = await api.post('/auth/sanctum/user')
  return response.data
}

export async function resetPassword(data) {
  const response = await api.post('/auth/resetPassword', data)
  return response.data
}
