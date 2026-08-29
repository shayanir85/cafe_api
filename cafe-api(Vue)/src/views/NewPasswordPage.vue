<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resetPassword } from '@/services/auth'
import LogoCup from '@/components/LogoCup.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

const passwordInput = ref('')
const newPasswordInput = ref('')
const confirmPasswordInput = ref('')
const showPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const errorVisible = ref(false)
const successMessage = ref('')
const successVisible = ref(false)
const loading = ref(false)
const cardShake = ref(false)

function showError(message) {
  errorMessage.value = message
  errorVisible.value = true
  successVisible.value = false
  cardShake.value = true
  setTimeout(() => { cardShake.value = false }, 500)
}

function hideError() {
  errorVisible.value = false
}

function showSuccess() {
  successVisible.value = true
  hideError()
}

function hideLoading() {
  loading.value = false
}

async function handleSubmit() {
  hideError()

  const password = passwordInput.value.trim()
  const newPassword = newPasswordInput.value.trim()
  const newPassword_confirmation = confirmPasswordInput.value.trim()

  if (!password) {
    showError('لطفاً رمز عبور فعلی خود را وارد کنید')
    return
  }
  if (!newPassword) {
    showError('لطفاً رمز عبور جدید خود را وارد کنید')
    return
  }
  if (newPassword.length < 8) {
    showError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
    return
  }
  if (!newPassword_confirmation) {
    showError('لطفاً رمز عبور جدید را تایید کنید')
    return
  }
  if (newPassword !== newPassword_confirmation) {
    showError('رمز عبور جدید و تایید آن یکسان نیستند')
    return
  }

  loading.value = true

  try {
    await resetPassword({ password, newPassword, newPassword_confirmation })
    showSuccess()
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'رمز عبور فعلی اشتباه است'
    showError(errorMessage)
    hideLoading()
    passwordInput.value = ''
    newPasswordInput.value = ''
    confirmPasswordInput.value = ''
  }
}

onMounted(() => {
  if (!auth.isAdmin) {
    router.replace('/login')
  }
})
</script>

<template>
  <BackgroundBlobs />
  <AdminSidebar v-model="sidebarOpen" />

  <header class="header" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
    <div class="header-content">
      <router-link to="/" class="logo-link">
        <LogoCup />
        <span class="brand-text">کافی شاپ</span>
      </router-link>
      <router-link to="/dashboard" class="back-link">
        <i class="fas fa-arrow-right"></i>
        <span>بازگشت</span>
      </router-link>
    </div>
  </header>

  <main class="main-container" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
    <div class="reset-wrapper">
      <div class="reset-card" :class="{ 'animate-shake': cardShake }">
        <div class="card-header">
          <div class="card-icon">
            <i class="fas fa-key"></i>
          </div>
          <h1 class="card-title">تغییر رمز عبور</h1>
          <p class="card-subtitle">رمز عبور جدید خود را وارد کنید</p>
          <div class="card-divider">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <form class="reset-form" @submit.prevent="handleSubmit">
          <!-- Error message -->
          <div v-if="errorVisible" class="msg-box error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Success message -->
          <div v-if="successVisible" class="msg-box success">
            <i class="fas fa-check-circle"></i>
            <span>رمز عبور با موفقیت تغییر یافت. در حال انتقال...</span>
          </div>

          <!-- Current password -->
          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              رمز عبور فعلی
            </label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="رمز عبور فعلی خود را وارد کنید"
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

          <!-- New password -->
          <div class="form-group">
            <label for="newPassword">
              <i class="fas fa-lock"></i>
              رمز عبور جدید
            </label>
            <div class="input-wrap">
              <input
                id="newPassword"
                v-model="newPasswordInput"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="رمز عبور جدید خود را وارد کنید"
                autocomplete="new-password"
                required />
              <i class="fas fa-key input-icon"></i>
              <button
                type="button"
                class="toggle-password"
                @click="showNewPassword = !showNewPassword">
                <i :class="showNewPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
            </div>
          </div>

          <!-- Confirm password -->
          <div class="form-group">
            <label for="newPassword_confirmation">
              <i class="fas fa-check"></i>
              تایید رمز عبور جدید
            </label>
            <div class="input-wrap">
              <input
                id="newPassword_confirmation"
                v-model="confirmPasswordInput"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="رمز عبور جدید را مجدداً وارد کنید"
                autocomplete="new-password"
                required />
              <i class="fas fa-check-circle input-icon"></i>
              <button
                type="button"
                class="toggle-password"
                @click="showConfirmPassword = !showConfirmPassword">
                <i :class="showConfirmPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">تغییر رمز عبور</span>
            <i v-if="!loading" class="fas fa-save"></i>
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

.msg-box.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg-secondary);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-bottom: 1px solid var(--border-primary);
  flex-shrink: 0;
  transition: margin-right 0.3s ease;
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
  background: var(--bg-primary);
  transition: margin-right 0.3s ease;
}

.reset-wrapper {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 0;
}

.reset-card {
  background: var(--bg-card);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  padding: clamp(24px, 5vw, 40px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.reset-card:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow-lg);
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
  color: var(--text-primary);
  font-size: clamp(20px, 4vw, 26px);
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.card-subtitle {
  color: var(--text-muted);
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

.reset-form {
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
  color: var(--text-secondary);
  font-size: clamp(13px, 1.2vw, 14px);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group label i {
  color: var(--accent);
  font-size: 14px;
}

.input-wrap {
  position: relative;
  width: 100%;
}

.input-wrap input {
  width: 100%;
  padding: clamp(12px, 2vw, 14px) clamp(36px, 6vw, 44px) clamp(12px, 2vw, 14px) clamp(12px, 2vw, 14px);
  background: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: clamp(14px, 1.5vw, 16px);
  transition: all 0.3s;
  outline: none;
  width: 100%;
  min-height: 50px;
}

.input-wrap input::placeholder {
  color: var(--text-faint);
}

.input-wrap input:focus {
  border-color: var(--accent);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.input-wrap .input-icon {
  position: absolute;
  right: clamp(12px, 2vw, 14px);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-faint);
  font-size: clamp(14px, 1.2vw, 16px);
  pointer-events: none;
  transition: color 0.3s;
}

.input-wrap input:focus ~ .input-icon {
  color: var(--accent);
}

.toggle-password {
  position: absolute;
  left: clamp(12px, 2vw, 14px);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  font-size: clamp(14px, 1.2vw, 16px);
  padding: 4px;
  transition: color 0.3s;
}

.toggle-password:hover {
  color: var(--text-secondary);
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  caret-color: var(--text-primary);
}

.submit-btn {
  position: relative;
  width: 100%;
  padding: clamp(14px, 2vw, 16px);
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 800;
  font-size: clamp(15px, 1.5vw, 17px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 4px 20px var(--accent-bg);
  min-height: 54px;
  overflow: hidden;
  margin-top: 4px;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 12px;
}

.submit-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px var(--accent-bg);
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
  .reset-card { padding: 18px; }
  .card-icon { width: 50px; height: 50px; font-size: 20px; }
  .input-wrap input { min-height: 44px; padding: 10px 32px 10px 10px; }
  .submit-btn { min-height: 46px; font-size: 14px; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .reset-wrapper { max-width: 480px; }
  .reset-card { padding: 36px; }
}

@media (min-width: 1025px) {
  .reset-wrapper { max-width: 460px; }
  .reset-card { padding: 44px; border-radius: 24px; }
  .input-wrap input { min-height: 56px; }
  .submit-btn { min-height: 58px; }
}

@media (max-height: 600px) and (orientation: landscape) {
  .main-container { padding: 12px 16px; min-height: auto; }
  .reset-card { padding: 20px; }
  .card-header { margin-bottom: 16px; }
  .card-icon { width: 44px; height: 44px; font-size: 18px; margin-bottom: 8px; }
  .card-title { font-size: 18px; }
  .reset-form { gap: 10px; }
  .form-group { gap: 4px; }
  .input-wrap input { min-height: 40px; padding: 8px 32px 8px 10px; font-size: 13px; }
  .submit-btn { min-height: 42px; font-size: 14px; padding: 10px; }
}
</style>
