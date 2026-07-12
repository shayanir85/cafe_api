import api from './api'

export async function requestPayment(data) {
  const response = await api.post('/cafe/payments/request', data)
  return response.data
}

export async function verifyPayment(params) {
  const response = await api.get('/cafe/payments/verify', { params })
  return response.data
}
