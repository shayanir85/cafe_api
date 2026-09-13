import api from './api'

export async function getRoles() {
  const response = await api.get('/roles')
  return response.data
}

export async function getPermissions() {
  const response = await api.get('/permissions')
  return response.data
}

export async function createRole(name, permissions = []) {
  const response = await api.post('/roles', { name, permissions })
  return response.data
}

export async function deleteRole(id) {
  const response = await api.delete(`/roles/${id}`)
  return response.data
}

export async function syncPermissions(roleId, permissions) {
  const response = await api.put(`/roles/${roleId}/permissions`, { permissions })
  return response.data
}
