<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as otpApi from '@/services/otp'
import LogoCup from '@/components/LogoCup.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const step = ref(1)

const nameInput = ref('')
const phoneInput = ref('')
const otpDigits = ref(['', '', '', ''])
const passwordInput = ref('')
const passwordConfirmInput = ref('')
const verificationToken = ref('')

const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const errorMessage = ref('')
const errorVisible = ref(false)
const loading = ref(false)
const cardShake = ref(false)

const countdown = ref(0)
let countdownTimer = null

function showError(message) {
  errorMessage.value = message
  errorVisible.value = true
  cardShake.value = true
  setTimeout(() => { cardShake.value = false }, 500)
}

function hideError() {
  errorVisible.value = false
}

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function handleSendOtp() {
  hideError()

  const name = nameInput.value.trim()
  const phone = phoneInput.value.trim()

  if (!name) {
    showError('لطفاً نام خود را وارد کنید')
    return
  }

  if (!phone) {
    showError('لطفاً شماره موبایل را وارد کنید')
    return
  }

  if (phone.length < 10 || phone.length > 11) {
    showError('شماره موبایل باید ۱۰ یا ۱۱ رقم باشد')
    return
  }

  loading.value = true

  try {
    await otpApi.sendOtp(phone)
    step.value = 2
    otpDigits.value = ['', '', '', '']
    startCountdown()
  } catch (error) {
    const msg = error.response?.data?.message || error.response?.data?.errors?.phone_number?.[0] || 'خطا در ارسال کد تأیید'
    showError(msg)
  } finally {
    loading.value = false
  }
}

function handleOtpInput(index, event) {
  const value = event.target.value
  if (!/^\d*$/.test(value)) {
    otpDigits.value[index] = ''
    return
  }

  otpDigits.value[index] = value.slice(-1)

  if (value && index < 3) {
    const next = event.target.parentElement.children[index + 1]
    if (next) next.focus()
  }
}

function handleOtpKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (otpDigits.value[index]) {
      otpDigits.value[index] = ''
    } else if (index > 0) {
      otpDigits.value[index - 1] = ''
      const prev = event.target.parentElement.children[index - 1]
      if (prev) prev.focus()
    }
    event.preventDefault()
  }
}

function handleOtpPaste(event) {
  event.preventDefault()
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
  for (let i = 0; i < 4; i++) {
    otpDigits.value[i] = pasted[i] || ''
  }
  const lastFilled = Math.min(pasted.length, 3)
  const inputs = event.target.parentElement.children
  if (inputs[lastFilled]) inputs[lastFilled].focus()
}

async function handleVerifyOtp() {
  hideError()

  const otp = otpDigits.value.join('')
  if (otp.length !== 4) {
    showError('لطفاً کد ۴ رقمی را کامل وارد کنید')
    return
  }

  loading.value = true

  try {
    const data = await otpApi.verifyOtp(phoneInput.value.trim(), otp)
    if (data.verification_token) {
      verificationToken.value = data.verification_token
    }
    step.value = 3
  } catch (error) {
    const msg = error.response?.data?.message || 'کد تأیید نادرست است'
    showError(msg)
  } finally {
    loading.value = false
  }
}

async function handleResendOtp() {
  hideError()

  if (countdown.value > 0) return

  loading.value = true

  try {
    await otpApi.resendOtp(phoneInput.value.trim())
    startCountdown()
  } catch (error) {
    const msg = error.response?.data?.message || 'خطا در ارسال مجدد کد'
    showError(msg)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  hideError()

  const password = passwordInput.value
  const passwordConfirm = passwordConfirmInput.value

  if (!password) {
    showError('لطفاً رمز عبور را وارد کنید')
    return
  }

  if (password.length < 8) {
    showError('رمز عبور باید حداقل ۸ کاراکتر باشد')
    return
  }

  if (password !== passwordConfirm) {
    showError('تأیید رمز عبور مطابقت ندارد')
    return
  }

  loading.value = true

  try {
    const data = await otpApi.register({
      name: nameInput.value.trim(),
      phone_number: phoneInput.value.trim(),
      password,
      password_confirmation: passwordConfirm,
      verification_token: verificationToken.value,
    })

    auth.saveCustomerAuth(data)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.errors?.password?.[0] ||
      error.response?.data?.errors?.phone_number?.[0] ||
      'خطا در ثبت‌نام'
    showError(msg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.isAdmin) {
    router.replace('/dashboard')
    return
  }
  if (auth.isCustomerLoggedIn) {
    router.replace(route.query.redirect || '/')
    return
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
            <i class="fas fa-user-plus"></i>
          </div>
          <h1 class="card-title">ثبت‌نام</h1>
          <p class="card-subtitle">حساب کاربری جدید بسازید</p>
          <div class="card-divider">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <!-- Step Indicator -->
          <div class="steps-indicator">
            <div class="step-dot" :class="{ active: step >= 1, done: step > 1 }">
              <i v-if="step > 1" class="fas fa-check"></i>
              <span v-else>۱</span>
            </div>
            <div class="step-line" :class="{ filled: step > 1 }"></div>
            <div class="step-dot" :class="{ active: step >= 2, done: step > 2 }">
              <i v-if="step > 2" class="fas fa-check"></i>
              <span v-else>۲</span>
            </div>
            <div class="step-line" :class="{ filled: step > 2 }"></div>
            <div class="step-dot" :class="{ active: step >= 3 }">
              <span>۳</span>
            </div>
          </div>
        </div>

        <!-- Step 1: Name & Phone -->
        <form v-if="step === 1" class="login-form" @submit.prevent="handleSendOtp">
          <div v-if="errorVisible" class="msg-box error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="form-group">
            <label for="name">
              <i class="fas fa-user"></i>
              نام
            </label>
            <div class="input-wrap">
              <input
                id="name"
                v-model="nameInput"
                type="text"
                placeholder="نام خود را وارد کنید"
                autocomplete="name"
                required />
              <i class="fas fa-id-card input-icon"></i>
            </div>
          </div>

          <div class="form-group">
            <label for="phone">
              <i class="fas fa-phone"></i>
              شماره موبایل
            </label>
            <div class="input-wrap">
              <input
                id="phone"
                v-model="phoneInput"
                type="tel"
                placeholder="09121234567"
                autocomplete="tel"
                maxlength="11"
                required />
              <i class="fas fa-mobile-screen input-icon"></i>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">ارسال کد تأیید</span>
            <i v-if="!loading" class="fas fa-paper-plane"></i>
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <!-- Step 2: OTP Verification -->
        <form v-else-if="step === 2" class="login-form" @submit.prevent="handleVerifyOtp">
          <div v-if="errorVisible" class="msg-box error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="otp-info">
            <i class="fas fa-comment-dots"></i>
            <span>کد تأیید به شماره <strong>{{ phoneInput }}</strong> ارسال شد</span>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-shield-halved"></i>
              کد تأیید
            </label>
            <div class="otp-inputs" @paste="handleOtpPaste">
              <input
                v-for="(digit, idx) in otpDigits"
                :key="idx"
                type="tel"
                maxlength="1"
                :value="digit"
                class="otp-input"
                inputmode="numeric"
                autocomplete="one-time-code"
                @input="handleOtpInput(idx, $event)"
                @keydown="handleOtpKeydown(idx, $event)" />
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">تأیید</span>
            <i v-if="!loading" class="fas fa-check"></i>
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>

          <div class="otp-actions">
            <button
              type="button"
              class="link-btn"
              :disabled="countdown > 0"
              @click="handleResendOtp">
              <i class="fas fa-rotate"></i>
              {{ countdown > 0 ? `ارسال مجدد (${countdown})` : 'ارسال مجدد کد' }}
            </button>
            <button type="button" class="link-btn" @click="step = 1; hideError()">
              <i class="fas fa-arrow-right"></i>
              تغییر شماره
            </button>
          </div>
        </form>

        <!-- Step 3: Set Password -->
        <form v-else-if="step === 3" class="login-form" @submit.prevent="handleRegister">
          <div v-if="errorVisible" class="msg-box error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="form-group">
            <label for="reg-password">
              <i class="fas fa-lock"></i>
              رمز عبور
            </label>
            <div class="input-wrap">
              <input
                id="reg-password"
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="حداقل ۸ کاراکتر"
                autocomplete="new-password"
                minlength="8"
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

          <div class="form-group">
            <label for="reg-password-confirm">
              <i class="fas fa-lock"></i>
              تأیید رمز عبور
            </label>
            <div class="input-wrap">
              <input
                id="reg-password-confirm"
                v-model="passwordConfirmInput"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="رمز عبور را مجدداً وارد کنید"
                autocomplete="new-password"
                minlength="8"
                required />
              <i class="fas fa-key input-icon"></i>
              <button
                type="button"
                class="toggle-password"
                @click="showPasswordConfirm = !showPasswordConfirm">
                <i :class="showPasswordConfirm ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">ثبت‌نام و ورود</span>
            <i v-if="!loading" class="fas fa-check-circle"></i>
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <div class="card-footer">
          <span class="footer-text">حساب دارید؟</span>
          <router-link :to="{ name: 'login', query: route.query }" class="footer-link">ورود</router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
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

/* Steps Indicator */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-top: 20px;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s;
}

.step-dot.active {
  color: #1a0e0a;
  background: #f59e0b;
  border-color: #f59e0b;
}

.step-dot.done {
  color: white;
  background: rgba(52, 211, 153, 0.2);
  border-color: rgba(52, 211, 153, 0.4);
}

.step-line {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 4px;
  transition: background 0.3s;
}

.step-line.filled {
  background: #f59e0b;
}

/* OTP Info */
.otp-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 12px;
  font-size: clamp(12px, 1.2vw, 13px);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.otp-info i {
  color: #f59e0b;
  font-size: 16px;
  flex-shrink: 0;
}

.otp-info strong {
  color: #fbbf24;
  direction: ltr;
}

/* OTP Inputs */
.otp-inputs {
  display: flex;
  gap: 8px;
  justify-content: center;
  direction: ltr;
}

.otp-input {
  width: 52px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s;
  caret-color: #f59e0b;
  direction: ltr;
  font-variant-numeric: tabular-nums;
}

.otp-input:focus {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
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
  transform: translateX(-4px);
}

/* OTP Actions */
.otp-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.link-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: clamp(12px, 1.1vw, 13px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
}

.link-btn:hover:not(:disabled) {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.link-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: clamp(13px, 1.2vw, 14px);
}

.footer-link {
  color: #f59e0b;
  font-size: clamp(13px, 1.2vw, 14px);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #fbbf24;
}

@media (max-width: 380px) {
  .login-card { padding: 18px; }
  .card-icon { width: 50px; height: 50px; font-size: 20px; }
  .input-wrap input { min-height: 44px; padding: 10px 32px 10px 10px; }
  .submit-btn { min-height: 46px; font-size: 14px; }
  .otp-input { width: 46px; height: 50px; font-size: 18px; }
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
  .otp-input { width: 42px; height: 44px; font-size: 16px; }
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-card {
    border-width: 0.5px;
  }
  .input-wrap input {
    border-width: 0.5px;
  }
}
</style>
