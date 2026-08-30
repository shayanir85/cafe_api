import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'my-cafe-app-key-2024',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${API_BASE}/api/v1/broadcasting/auth`,
  auth: {
    headers: {
      get Authorization() {
        const token =
          sessionStorage.getItem('access_token') ||
          sessionStorage.getItem('customer_token')
        return token ? `Bearer ${token}` : ''
      },
      Accept: 'application/json',
    },
  },
})

export default echo
