import api from './api'

export async function sendOtp(phone_number) {
  const response = await api.post('/auth/send-otp', { phone_number })
  return response.data
}

export async function verifyOtp(phone_number, otp) {
  const response = await api.post('/auth/verify-otp', { phone_number, otp })
  return response.data
}

export async function resendOtp(phone_number) {
  const response = await api.post('/auth/resend-otp', { phone_number })
  return response.data
}

export async function otpLogin(phone_number, otp) {
  const response = await api.post('/auth/otp-login', { phone_number, otp })
  return response.data
}

export async function register(data) {
  const response = await api.post('/register', data)
  return response.data
}
