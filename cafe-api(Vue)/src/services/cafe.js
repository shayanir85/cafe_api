import api from './api'

export async function getCafeStatus() {
  const response = await api.get('/Dashboard/cafe/status')
  return response.data
}

export async function toggleCafeStatus() {
  const response = await api.post('/Dashboard/cafe/toggle')
  return response.data
}
