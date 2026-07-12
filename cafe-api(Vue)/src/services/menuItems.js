import api from './api'

export async function getMenuItems() {
  const response = await api.get('/menu-items')
  return response.data
}

export async function getMenuItem(id) {
  const response = await api.get(`/menu-items/${id}`)
  return response.data
}

export async function createMenuItem(menuItemData) {
  const response = await api.post('/Dashboard/admin/menu-items', menuItemData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function updateMenuItem(id, menuItemData) {
  let response
  if (menuItemData instanceof FormData) {
    response = await api.post(`/Dashboard/admin/menu-items/${id}`, menuItemData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { _method: 'PUT' },
    })
  } else {
    response = await api.put(`/Dashboard/admin/menu-items/${id}`, menuItemData)
  }
  return response.data
}

export async function deleteMenuItem(id) {
  const response = await api.delete(`/Dashboard/menu-items/${id}`)
  return response.data
}

export async function getMenuStatus() {
  const response = await api.get('/Dashboard/admin/MenuStatus')
  return response.data
}

export async function toggleMenuItemAvailability(id) {
  const response = await api.put(`/Dashboard/admin/menu-items/${id}/toggle`)
  return response.data
}
