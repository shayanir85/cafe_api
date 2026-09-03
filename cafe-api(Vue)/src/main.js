import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
// import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/main.css'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore()
if (auth.isLoggedIn) {
  auth.fetchUser().catch(() => {})
}

app.mount('#app')
