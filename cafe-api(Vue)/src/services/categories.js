import api from './api'

export async function getCategories() {
  const response = await api.get('/category')
  return response.data
}

export async function getCategory(id) {
  const response = await api.get(`/Dashboard/admin/category/${id}`)
  return response.data
}

export async function createCategory(categoryData) {
  const response = await api.post('/Dashboard/admin/category', categoryData)
  return response.data
}

export async function updateCategory(id, categoryData) {
  const response = await api.put(`/Dashboard/admin/category/${id}`, categoryData)
  return response.data
}

export async function deleteCategory(id) {
  const response = await api.delete(`/Dashboard/admin/category/${id}`)
  return response.data
}

export async function getCategoryStatus() {
  const response = await api.get('/Dashboard/admin/CategoryStatus')
  return response.data
}
