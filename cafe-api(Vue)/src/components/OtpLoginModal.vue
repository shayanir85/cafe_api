<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import * as otpApi from '@/services/otp'

const emit = defineEmits(['close', 'success'])
const auth = useAuthStore()

const step = ref(1)
const phone = ref('')
const otpDigits = ref(['', '', '', ''])
const name = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const error = ref('')
const verificationToken = ref('')
const userExists = ref(false)

const countdown = ref(0)
let countdownInterval = null

const otpCode = computed(() => otpDigits.value.join(''))

function startCountdown() {
  countdown.value = 60
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      countdown.value = 0
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

function handleOtpInput(index, event) {
  const value = event.target.value.replace(/\D/g, '')
  otpDigits.value[index] = value.slice(-1)
  if (value && index < 3) {
    const next = event.target.parentElement.querySelector(`input[data-index="${index + 1}"]`)
    if (next) next.focus()
  }
}

function handleOtpKeydown(index, event) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const prev = event.target.parentElement.querySelector(`input[data-index="${index - 1}"]`)
    if (prev) prev.focus()
  }
}

function handlePaste(event) {
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
  for (let i = 0; i < 4; i++) {
    otpDigits.value[i] = pasted[i] || ''
  }
  const lastFilled = Math.min(pasted.length, 4) - 1
  if (lastFilled >= 0) {
    const target = event.target.parentElement.querySelector(`input[data-index="${lastFilled}"]`)
    if (target) target.focus()
  }
}

async function sendOtp() {
  error.value = ''
  if (!phone.value || phone.value.length < 10) {
    error.value = 'شماره موبایل را صحیح وارد کنید'
    return
  }
  loading.value = true
  try {
    await otpApi.sendOtp(phone.value)
    step.value = 2
    startCountdown()
  } catch (e) {
    error.value = e.response?.data?.message || 'خطا در ارسال کد تأیید'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  error.value = ''
  if (otpCode.value.length !== 4) {
    error.value = 'کد تأیید ۴ رقمی را وارد کنید'
    return
  }
  loading.value = true
  try {
    const result = await otpApi.verifyOtp(phone.value, otpCode.value)
    verificationToken.value = result.verification_token || ''
    userExists.value = result.user_exists || false

    if (userExists.value) {
      await auth.otpLogin({ phone_number: phone.value, otp: otpCode.value })
      emit('success')
      emit('close')
    } else {
      step.value = 3
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'کد تأیید نادرست است'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'نام خود را وارد کنید'
    return
  }
  if (!password.value || password.value.length < 8) {
    error.value = 'رمز عبور باید حداقل ۸ کاراکتر باشد'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'تأیید رمز عبور مطابقت ندارد'
    return
  }
  loading.value = true
  try {
    await auth.registerByOtp({
      name: name.value.trim(),
      phone_number: phone.value,
      password: password.value,
      password_confirmation: passwordConfirm.value,
      verification_token: verificationToken.value,
    })
    emit('success')
    emit('close')
  } catch (e) {
    error.value = e.response?.data?.message || e.response?.data?.errors?.message?.[0] || 'خطا در ثبت‌نام'
  } finally {
    loading.value = false
  }
}

async function resendOtp() {
  if (countdown.value > 0) return
  error.value = ''
  loading.value = true
  try {
    await otpApi.resendOtp(phone.value)
    startCountdown()
  } catch (e) {
    error.value = e.response?.data?.message || 'خطا در ارسال مجدد کد'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="otp-overlay" @click.self="emit('close')">
      <div class="otp-modal">
        <button class="otp-close" @click="emit('close')">
          <i class="fas fa-xmark"></i>
        </button>

        <!-- Step 1: Phone -->
        <div v-if="step === 1" class="otp-step">
          <div class="otp-icon">
            <i class="fas fa-mobile-screen"></i>
          </div>
          <h2 class="otp-title">ورود با شماره موبایل</h2>
          <p class="otp-subtitle">شماره موبایل خود را وارد کنید تا کد تأیید دریافت کنید</p>

          <div v-if="error" class="otp-error">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>

          <div class="otp-input-group">
            <label>شماره موبایل</label>
            <div class="otp-phone-wrap">
              <input
                v-model="phone"
                type="tel"
                maxlength="11"
                placeholder="09121234567"
                class="otp-phone-input"
                @keyup.enter="sendOtp" />
              <i class="fas fa-mobile-screen otp-phone-icon"></i>
            </div>
          </div>

          <button class="otp-btn-primary" @click="sendOtp" :disabled="loading">
            <span v-if="!loading">ارسال کد تأیید</span>
            <span v-else><i class="fas fa-spinner fa-spin"></i></span>
          </button>
        </div>

        <!-- Step 2: OTP -->
        <div v-if="step === 2" class="otp-step">
          <div class="otp-icon">
            <i class="fas fa-shield-halved"></i>
          </div>
          <h2 class="otp-title">کد تأیید</h2>
          <p class="otp-subtitle">کد ۴ رقمی ارسال شده به {{ phone }} را وارد کنید</p>

          <div v-if="error" class="otp-error">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>

          <div class="otp-code-inputs" @paste="handlePaste">
            <input
              v-for="(_, i) in 4"
              :key="i"
              :data-index="i"
              type="tel"
              maxlength="1"
              class="otp-code-input"
              :value="otpDigits[i]"
              @input="handleOtpInput(i, $event)"
              @keydown="handleOtpKeydown(i, $event)" />
          </div>

          <button class="otp-btn-primary" @click="verifyOtp" :disabled="loading || otpCode.length !== 4">
            <span v-if="!loading">تأیید</span>
            <span v-else><i class="fas fa-spinner fa-spin"></i></span>
          </button>

          <div class="otp-resend">
            <span v-if="countdown > 0" class="otp-countdown">{{ countdown }} ثانیه تا ارسال مجدد</span>
            <button v-else class="otp-resend-btn" @click="resendOtp" :disabled="loading">
              ارسال مجدد کد
            </button>
          </div>

          <button class="otp-back-btn" @click="step = 1; error = ''">
            <i class="fas fa-arrow-right"></i> تغییر شماره
          </button>
        </div>

        <!-- Step 3: Register -->
        <div v-if="step === 3" class="otp-step">
          <div class="otp-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <h2 class="otp-title">ثبت‌نام</h2>
          <p class="otp-subtitle">حساب کاربری جدیدی با این شماره بسازید</p>

          <div v-if="error" class="otp-error">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>

          <div class="otp-input-group">
            <label>نام کامل</label>
            <input v-model="name" type="text" placeholder="نام خود را وارد کنید" class="otp-text-input" />
          </div>

          <div class="otp-input-group">
            <label>رمز عبور</label>
            <input v-model="password" type="password" placeholder="حداقل ۸ کاراکتر" class="otp-text-input" />
          </div>

          <div class="otp-input-group">
            <label>تأیید رمز عبور</label>
            <input v-model="passwordConfirm" type="password" placeholder="رمز عبور را مجدداً وارد کنید" class="otp-text-input" />
          </div>

          <button class="otp-btn-primary" @click="handleRegister" :disabled="loading">
            <span v-if="!loading">ثبت‌نام و ورود</span>
            <span v-else><i class="fas fa-spinner fa-spin"></i></span>
          </button>

          <button class="otp-back-btn" @click="step = 2; error = ''">
            <i class="fas fa-arrow-right"></i> بازگشت
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.otp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.otp-modal {
  background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px 28px;
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: otpSlideIn 0.3s ease;
}

@keyframes otpSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.otp-close {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.otp-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.otp-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.otp-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
  border: 1px solid rgba(245, 158, 11, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fbbf24;
  margin-bottom: 4px;
}

.otp-title {
  color: white;
  font-size: 20px;
  font-weight: 800;
}

.otp-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  text-align: center;
  line-height: 1.5;
}

.otp-error {
  width: 100%;
  padding: 10px 14px;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: 10px;
  color: #fb7185;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.otp-input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.otp-input-group label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
}

.otp-phone-wrap {
  position: relative;
  width: 100%;
}

.otp-phone-input {
  width: 100%;
  padding: 12px 40px 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  direction: ltr;
  text-align: left;
}

.otp-phone-input:focus {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.otp-phone-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.2);
  font-size: 14px;
  pointer-events: none;
}

.otp-phone-input:focus ~ .otp-phone-icon {
  color: #f59e0b;
}

.otp-text-input {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.otp-text-input:focus {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.otp-code-inputs {
  display: flex;
  gap: 10px;
  direction: ltr;
}

.otp-code-input {
  width: 56px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: white;
  outline: none;
  transition: all 0.2s;
  caret-color: #f59e0b;
}

.otp-code-input:focus {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
}

.otp-btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #1a0e0a;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25);
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.otp-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
}

.otp-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.otp-resend {
  font-size: 13px;
}

.otp-countdown {
  color: rgba(255, 255, 255, 0.3);
}

.otp-resend-btn {
  background: none;
  border: none;
  color: #f59e0b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.otp-resend-btn:hover {
  text-decoration: underline;
}

.otp-back-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  transition: color 0.2s;
}

.otp-back-btn:hover {
  color: rgba(255, 255, 255, 0.7);
}
</style>
