import api from './api'

export async function getOrders(filters = {}) {
  let url = '/Dashboard/admin/orders'
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.table_number) params.append('table_number', filters.table_number)
  if (filters.paginate === false) params.append('paginate', '0')
  if (filters.all_dates) params.append('all_dates', '1')
  if (params.toString()) url += `?${params.toString()}`

  const response = await api.get(url)
  return response.data
}

export async function getOrder(id) {
  const response = await api.get(`/cafe/orders/${id}`)
  return response.data
}

export async function createOrder(orderData) {
  const response = await api.post('/cafe/orders', orderData)
  return response.data
}

export async function updateOrderStatus(id, status) {
  const response = await api.patch(`/Dashboard/admin/orders/${id}/status`, { status })
  return response.data
}
