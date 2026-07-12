import api from './api'

export async function getUsers() {
  const response = await api.get('/Dashboard/users')
  return response.data
}

export async function createUser(userData) {
  const response = await api.post('/Dashboard/users', userData)
  return response.data
}

export async function updateUser(id, userData) {
  const response = await api.put(`/Dashboard/users/${id}`, userData)
  return response.data
}

export async function deleteUser(id) {
  const response = await api.delete(`/Dashboard/users/${id}`)
  return response.data
}

export async function getUserLoginStatus() {
  const response = await api.get('/Dashboard/userLoginStatus')
  return response.data
}
