import api from './api'

export async function toggleCafeStatus() {
  const response = await api.post('/Dashboard/cafe/toggle')
  return response.data
}
