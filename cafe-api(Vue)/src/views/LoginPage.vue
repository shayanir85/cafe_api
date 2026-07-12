<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LogoCup from '@/components/LogoCup.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref(null)
const emailInput = ref('')
const passwordInput = ref('')
const rememberChecked = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const errorVisible = ref(false)
const loading = ref(false)
const cardShake = ref(false)

function showError(message) {
  errorMessage.value = message
  errorVisible.value = true
  cardShake.value = true
  setTimeout(() => { cardShake.value = false }, 500)
}

function hideError() {
  errorVisible.value = false
}

async function handleSubmit() {
  hideError()

  const email = emailInput.value.trim()
  const password = passwordInput.value
  const remember = rememberChecked.value

  if (!email) {
    showError('لطفاً آدرس ایمیل را وارد کنید')
    return
  }

  if (!password) {
    showError('لطفاً رمز عبور را وارد کنید')
    return
  }

  if (password.length < 8) {
    showError('رمز عبور باید حداقل ۸ کاراکتر باشد')
    return
  }

  loading.value = true

  try {
    const response = await auth.login({ email, password })

    if (response && response.token) {
      if (remember) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      if (auth.isAdmin) {
        router.push('/dashboard')
      } else {
        showError('شما دسترسی ادمین ندارید')
        auth.clearAuth()
        loading.value = false
      }
    } else {
      showError('خطا در دریافت اطلاعات کاربر')
      loading.value = false
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'ایمیل یا رمز عبور اشتباه است'
    showError(errorMessage)
    loading.value = false
    passwordInput.value = ''
  }
}

onMounted(() => {
  // If already admin, redirect to dashboard
  if (auth.isAdmin) {
    router.replace('/dashboard')
    return
  }

  // Load remembered email
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  if (rememberedEmail) {
    emailInput.value = rememberedEmail
    rememberChecked.value = true
  }
})
</script>

<template>
  <BackgroundBlobs />

  <header class="header">
    <div class="header-content">
      <router-link to="/" class="logo-link">
        <LogoCup />
        <span class="brand-text">کافی شاپ</span>
      </router-link>
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-right"></i>
        <span>بازگشت</span>
      </router-link>
    </div>
  </header>

  <main class="main-container">
    <div class="login-wrapper">
      <div class="login-card" :class="{ 'animate-shake': cardShake }">
        <div class="card-header">
          <div class="card-icon">
            <i class="fas fa-user-shield"></i>
          </div>
          <h1 class="card-title">ورود به پنل مدیریت</h1>
          <p class="card-subtitle">لطفاً اطلاعات خود را وارد کنید</p>
          <div class="card-divider">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <form ref="form" class="login-form" @submit.prevent="handleSubmit">
          <!-- Error message -->
          <div v-if="errorVisible" class="msg-box error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Loading message -->
          <div v-if="loading" class="msg-box loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>در حال ورود...</span>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">
              <i class="fas fa-envelope"></i>
              آدرس ایمیل
            </label>
            <div class="input-wrap">
              <input
                id="email"
                v-model="emailInput"
                type="email"
                placeholder="example@email.com"
                autocomplete="email"
                required />
              <i class="fas fa-user input-icon"></i>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              رمز عبور
            </label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required />
              <i class="fas fa-key input-icon"></i>
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <div class="form-options">
            <label class="checkbox-label">
              <input v-model="rememberChecked" type="checkbox" />
              <span class="checkmark"></span>
              <span class="checkbox-text">مرا به خاطر بسپار</span>
            </label>
          </div>

          <!-- Submit -->
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">ورود به پنل مدیریت</span>
            <i v-if="!loading" class="fas fa-mug-hot"></i>
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Messages */
.msg-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: clamp(13px, 1.2vw, 14px);
  width: 100%;
}

.msg-box.error {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.2);
  color: #fb7185;
}

.msg-box.loading {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(15, 10, 8, 0.55);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-text {
  font-weight: 800;
  font-size: clamp(0.9rem, 2vw, 1.05rem);
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  transition: all 0.3s;
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.back-link:hover {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.15);
}

@media (max-width: 480px) {
  .back-link span { display: none; }
  .back-link { padding: 6px 10px; }
  .brand-text { display: none; }
}

.main-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  min-height: calc(100vh - 70px);
  min-height: calc(100dvh - 70px);
}

.login-wrapper {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 0;
}

.login-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: clamp(24px, 5vw, 40px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.login-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(245, 158, 11, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(245, 158, 11, 0.05);
}

.card-header {
  text-align: center;
  margin-bottom: clamp(24px, 4vw, 32px);
}

.card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(60px, 12vw, 80px);
  height: clamp(60px, 12vw, 80px);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
  border-radius: 16px;
  border: 1px solid rgba(245, 158, 11, 0.15);
  margin-bottom: 16px;
  font-size: clamp(24px, 5vw, 32px);
  color: #fbbf24;
}

.card-title {
  color: #ffffff;
  font-size: clamp(20px, 4vw, 26px);
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.card-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: clamp(13px, 1.5vw, 15px);
}

.card-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.card-divider span {
  height: 2px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.2);
}

.card-divider span:first-child,
.card-divider span:last-child {
  width: clamp(30px, 8vw, 48px);
}

.card-divider span:nth-child(2) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(13px, 1.2vw, 14px);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group label i {
  color: #f59e0b;
  font-size: 14px;
}

.input-wrap {
  position: relative;
  width: 100%;
}

.input-wrap input {
  width: 100%;
  padding: clamp(12px, 2vw, 14px) clamp(36px, 6vw, 44px) clamp(12px, 2vw, 14px) clamp(12px, 2vw, 14px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #ffffff;
  font-size: clamp(14px, 1.5vw, 16px);
  transition: all 0.3s;
  outline: none;
  width: 100%;
  min-height: 50px;
}

.input-wrap input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.input-wrap input:focus {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.05);
}

.input-wrap .input-icon {
  position: absolute;
  right: clamp(12px, 2vw, 14px);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.2);
  font-size: clamp(14px, 1.2vw, 16px);
  pointer-events: none;
  transition: color 0.3s;
}

.input-wrap input:focus ~ .input-icon {
  color: #f59e0b;
}

.toggle-password {
  position: absolute;
  left: clamp(12px, 2vw, 14px);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: clamp(14px, 1.2vw, 16px);
  padding: 4px;
  transition: color 0.3s;
}

.toggle-password:hover {
  color: rgba(255, 255, 255, 0.5);
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px rgba(26, 14, 10, 0.95) inset !important;
  -webkit-text-fill-color: #ffffff !important;
  caret-color: #ffffff;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 2px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.checkmark::after {
  content: '\f00c';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
  font-size: 10px;
  color: white;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkmark {
  background: #f59e0b;
  border-color: #f59e0b;
}

.checkbox-label input:checked + .checkmark::after {
  opacity: 1;
  transform: scale(1);
}

.checkbox-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(13px, 1.2vw, 14px);
  transition: color 0.3s;
}

.checkbox-label:hover .checkbox-text {
  color: rgba(255, 255, 255, 0.7);
}

.submit-btn {
  position: relative;
  width: 100%;
  padding: clamp(14px, 2vw, 16px);
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #1a0e0a;
  font-weight: 800;
  font-size: clamp(15px, 1.5vw, 17px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25);
  min-height: 54px;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 12px;
}

.submit-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.35);
}

.submit-btn:hover::before {
  opacity: 1;
}

.submit-btn:active {
  transform: scale(0.97);
}

.submit-btn > * {
  position: relative;
  z-index: 1;
}

.submit-btn i {
  font-size: clamp(16px, 1.5vw, 18px);
  transition: transform 0.3s;
}

.submit-btn:hover i {
  transform: rotate(12deg);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@media (max-width: 380px) {
  .login-card { padding: 18px; }
  .card-icon { width: 50px; height: 50px; font-size: 20px; }
  .input-wrap input { min-height: 44px; padding: 10px 32px 10px 10px; }
  .submit-btn { min-height: 46px; font-size: 14px; }
  .form-options { flex-direction: column; align-items: flex-start; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .login-wrapper { max-width: 480px; }
  .login-card { padding: 36px; }
}

@media (min-width: 1025px) {
  .login-wrapper { max-width: 460px; }
  .login-card { padding: 44px; border-radius: 24px; }
  .input-wrap input { min-height: 56px; }
  .submit-btn { min-height: 58px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .main-container { padding: 12px 16px; min-height: auto; }
  .login-card { padding: 20px; }
  .card-header { margin-bottom: 16px; }
  .card-icon { width: 44px; height: 44px; font-size: 18px; margin-bottom: 8px; }
  .card-title { font-size: 18px; }
  .login-form { gap: 10px; }
  .form-group { gap: 4px; }
  .input-wrap input { min-height: 40px; padding: 8px 32px 8px 10px; font-size: 13px; }
  .submit-btn { min-height: 42px; font-size: 14px; padding: 10px; }
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-card {
    border-width: 0.5px;
  }
  .input-wrap input {
    border-width: 0.5px;
  }
}

@media (prefers-color-scheme: light) {
  .login-card {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(255, 255, 255, 0.3);
  }
  .login-card:hover {
    background: rgba(255, 255, 255, 0.8);
  }
  .card-title { color: #1a0e0a; }
  .card-subtitle { color: rgba(0, 0, 0, 0.5); }
  .input-wrap input {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.08);
    color: #1a0e0a;
  }
  .input-wrap input::placeholder { color: rgba(0, 0, 0, 0.2); }
  .input-wrap input:focus { border-color: #f59e0b; background: rgba(0, 0, 0, 0.05); }
  .form-group label { color: rgba(0, 0, 0, 0.7); }
  .checkbox-text { color: rgba(0, 0, 0, 0.5); }
  .input-wrap .input-icon { color: rgba(0, 0, 0, 0.2); }
  .toggle-password { color: rgba(0, 0, 0, 0.2); }
  .header { background: rgba(255, 255, 255, 0.7); border-color: rgba(0, 0, 0, 0.05); }
  .back-link { color: rgba(0, 0, 0, 0.4); border-color: rgba(0, 0, 0, 0.05); }
  .back-link:hover { color: #d97706; background: rgba(217, 119, 6, 0.08); }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.9) inset !important;
    -webkit-text-fill-color: #1a0e0a !important;
  }
}
</style>
