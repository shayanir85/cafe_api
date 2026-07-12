<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showSettingsModal = ref(false)
const modalAnimating = ref(false)

const fontSize = ref(localStorage.getItem('fontSize') || 'normal')
const isDark = ref(localStorage.getItem('darkMode') === 'true')

function setFontSize(size) {
  fontSize.value = size
  localStorage.setItem('fontSize', size)
  applyFontSize(size)
}

function applyFontSize(size) {
  if (size === 'small') document.body.style.fontSize = '13px'
  else if (size === 'large') document.body.style.fontSize = '18px'
  else document.body.style.fontSize = '16px'
}

function setDarkMode(dark) {
  isDark.value = dark
  localStorage.setItem('darkMode', dark ? 'true' : 'false')
  applyTheme(dark)
}

function applyTheme(dark) {
  if (dark) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

function openSettingsModal() {
  showSettingsModal.value = true
  modalAnimating.value = true
}

function closeSettingsModal() {
  modalAnimating.value = false
  setTimeout(() => {
    showSettingsModal.value = false
  }, 200)
}

function handleKeydown(e) {
  if (e.key === 'Escape' && showSettingsModal.value) {
    closeSettingsModal()
  }
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
  }
}

onMounted(() => {
  applyTheme(isDark.value)
  applyFontSize(fontSize.value)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <AdminSidebar @open-settings="openSettingsModal" />

  <main class="main-body mr-16 p-6 lg:p-8 transition-all duration-300">
    <!-- Dashboard cards -->
    <div class="cards-row">
      <router-link :to="{ name: 'add-menu-item' }" class="block card-modern h-full">
        <div class="dashboard-card">
          <div class="card-header">
            <div class="card-icon bg-amber-300">
              <svg class="text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="card-stats">
              <span class="card-badge bg-amber-500 pulse-new">جدید</span>
            </div>
          </div>
          <h3 class="card-title">اضافه کردن به منو</h3>
          <p class="card-description">افزودن آیتم‌های جدید به منوی رستوران یا فروشگاه</p>
          <div class="card-footer">
            <span class="card-badge bg-amber-500">افزودن آیتم</span>
            <svg class="card-arrow text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
        </div>
      </router-link>

      <router-link v-if="authStore.isSuperAdmin" :to="{ name: 'admins' }" class="block card-modern h-full">
        <div class="dashboard-card">
          <div class="card-header">
            <div class="card-icon bg-purple-300">
              <svg class="text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="card-stats">
              <div class="card-value">۸</div>
              <div class="card-label">ادمین فعال</div>
            </div>
          </div>
          <h3 class="card-title">مدیریت ادمین ها</h3>
          <p class="card-description">مدیریت دسترسی و سطح اختیارات کاربران ادمین</p>
          <div class="card-footer">
            <span class="card-badge bg-purple-500">۳ آنلاین</span>
            <svg class="card-arrow text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
          </div>
        </div>
      </router-link>
    </div>

    <!-- iframe preview -->
    <div class="iframe-wrapper">
      <h3 class="iframe-title">پیش نمایش</h3>
      <iframe src="/" title="پیش نمایش منو"></iframe>
    </div>
  </main>

  <!-- Settings modal -->
  <div v-if="showSettingsModal"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
    @click.self="closeSettingsModal">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all"
      :class="modalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">
      <div class="border-b border-gray-100 p-6 flex justify-between items-center">
        <h3 class="text-xl font-bold text-gray-900">تنظیمات ظاهری</h3>
        <button class="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          @click="closeSettingsModal">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-6">
        <div>
          <label class="block text-gray-700 font-medium mb-3 text-sm">اندازه فونت</label>
          <div class="flex gap-2">
            <button
              class="flex-1 px-3 py-2 rounded-xl transition-all text-sm font-medium border border-gray-200"
              :class="fontSize === 'small' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-700'"
              @click="setFontSize('small')">کوچک</button>
            <button
              class="flex-1 px-3 py-2 rounded-xl transition-all text-sm font-medium border border-gray-200"
              :class="fontSize === 'normal' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-700'"
              @click="setFontSize('normal')">متوسط</button>
            <button
              class="flex-1 px-3 py-2 rounded-xl transition-all text-sm font-medium border border-gray-200"
              :class="fontSize === 'large' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-700'"
              @click="setFontSize('large')">بزرگ</button>
          </div>
        </div>
        <div>
          <label class="block text-gray-700 font-medium mb-3 text-sm">حالت نمایش</label>
          <div class="flex gap-2">
            <button class="flex-1 px-3 py-2.5 rounded-xl transition-all text-sm font-medium border"
              :class="!isDark ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600'"
              @click="setDarkMode(false)">
              <i class="fa-solid fa-sun ml-2"></i> روشن
            </button>
            <button class="flex-1 px-3 py-2.5 rounded-xl transition-all text-sm font-medium border"
              :class="isDark ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-600'"
              @click="setDarkMode(true)">
              <i class="fa-solid fa-moon ml-2"></i> تاریک
            </button>
          </div>
        </div>
      </div>
      <div class="border-t border-gray-300 p-6 flex justify-center">
        <button class="px-8 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-all text-base font-medium cursor-pointer"
          @click="closeSettingsModal">بستن</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-body {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  min-height: 600px;
}

.cards-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.cards-row .card-modern {
  flex: 1 1 50%;
  max-width: 50%;
}

@media (max-width: 768px) {
  .cards-row {
    flex-direction: column;
  }
  .cards-row .card-modern {
    max-width: 100%;
    flex: 1 1 100%;
  }
}

.iframe-wrapper {
  flex: 1 1 auto;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.iframe-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  margin: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.iframe-title::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.iframe-wrapper iframe {
  flex: 1 1 auto;
  width: 100%;
  border: none;
  background: #fafbfc;
}

.card-modern {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-modern:hover {
  transform: translateY(-6px);
}

.dashboard-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.card-modern:hover .dashboard-card {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-stats {
  text-align: left;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.card-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.card-description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  flex-grow: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.card-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 500;
}

.card-arrow {
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.card-badge.bg-green-500 {
  background: #dcfce7;
  color: #166534;
}

.card-badge.bg-purple-500 {
  background: #f3e8ff;
  color: #6d28d9;
}

.card-badge.bg-amber-500 {
  background: #fef3c7;
  color: #b45309;
}

.pulse-new {
  animation: softPulse 2s infinite;
}

@keyframes softPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
