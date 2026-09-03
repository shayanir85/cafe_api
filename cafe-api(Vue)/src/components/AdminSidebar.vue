<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const auth = useAuthStore()

const menuOpen = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    localStorage.setItem('admin_sidebar', val ? '1' : '0')
  }
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleLogout() {
  if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
    auth.clearAuth()
    router.push('/login')
  }
}

const user = computed(() => auth.user)
const userInitials = computed(() => (user.value?.name || user.value?.email || '?').slice(0, 2).toUpperCase())
const roleText = computed(() => user.value?.role === 'super_admin' ? 'سوپر ادمین' : user.value?.role === 'admin' ? 'ادمین' : user.value?.role === 'chef' ? 'آشپز' : user.value?.role === 'waiter' ? 'گارسون' : 'کاربر')
const isStaff = computed(() => ['super_admin', 'admin', 'chef', 'waiter'].includes(user.value?.role))

// ============ Settings Modal ============
const showSettingsModal = ref(false)
const modalAnimating = ref(false)
const activeSettingsTab = ref('appearance')

const fontSize = ref(localStorage.getItem('fontSize') || 'normal')
const isDark = ref(localStorage.getItem('darkMode') !== 'false')
const accentColor = ref(localStorage.getItem('accentColor') || 'gold')
const sidebarCompact = ref(localStorage.getItem('sidebarCompact') === 'true')
const animationsEnabled = ref(localStorage.getItem('animations') !== 'false')
const showWelcomeTips = ref(localStorage.getItem('showWelcomeTips') !== 'false')

const accentColors = {
  gold: { name: 'طلایی', primary: '#C69C6D', light: '#D4A373', dark: '#B28C56' },
  amber: { name: 'کهربایی', primary: '#D97706', light: '#F59E0B', dark: '#B45309' },
  emerald: { name: 'زمردی', primary: '#059669', light: '#10B981', dark: '#047857' },
  blue: { name: 'آبی', primary: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
  rose: { name: 'صورتی', primary: '#E11D48', light: '#F43F5E', dark: '#BE123C' },
}

function setFontSize(size) {
  fontSize.value = size
  localStorage.setItem('fontSize', size)
  document.documentElement.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge')
  document.documentElement.classList.add(`font-${size}`)
}

function setDarkMode(dark) {
  isDark.value = dark
  localStorage.setItem('darkMode', dark ? 'true' : 'false')
  document.documentElement.classList[dark ? 'remove' : 'add']('light-mode')
}

function setAccentColor(color) {
  accentColor.value = color
  localStorage.setItem('accentColor', color)
  const c = accentColors[color]
  document.documentElement.style.setProperty('--accent', c.primary)
  document.documentElement.style.setProperty('--accent-light', c.light)
  document.documentElement.style.setProperty('--accent-dark', c.dark)
  document.documentElement.style.setProperty('--accent-bg', `${c.primary}22`)
  document.documentElement.style.setProperty('--accent-border', `${c.primary}44`)
}

function setSidebarCompact(compact) {
  sidebarCompact.value = compact
  localStorage.setItem('sidebarCompact', compact ? 'true' : 'false')
  document.documentElement.classList[compact ? 'add' : 'remove']('sidebar-compact')
}

function setAnimations(enabled) {
  animationsEnabled.value = enabled
  localStorage.setItem('animations', enabled ? 'true' : 'false')
  if (!enabled) {
    document.documentElement.style.setProperty('--animation-duration', '0s')
  } else {
    document.documentElement.style.removeProperty('--animation-duration')
  }
}

function resetSettings() {
  setFontSize('normal')
  setDarkMode(true)
  setAccentColor('gold')
  setSidebarCompact(false)
  setAnimations(true)
  showWelcomeTips.value = true
  localStorage.setItem('showWelcomeTips', 'true')
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
}

onMounted(() => {
  const savedAccent = localStorage.getItem('accentColor') || 'gold'
  if (savedAccent !== 'gold') setAccentColor(savedAccent)
  if (sidebarCompact.value) document.documentElement.classList.add('sidebar-compact')
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <aside class="fixed right-0 top-0 h-full z-50">
    <div class="h-full flex">
      <div class="sidebar-rail">
        <button class="rail-icon" @click="toggleMenu" aria-label="منو اصلی">
          <div class="menu-icon" :class="{ active: menuOpen }">
            <span class="menu-icon-line top"></span>
            <span class="menu-icon-line middle"></span>
            <span class="menu-icon-line bottom"></span>
          </div>
        </button>

        <button class="rail-icon" @click="openSettingsModal" aria-label="تنظیمات">
          <i class="fa-solid fa-gear"></i>
        </button>

        <div class="rail-divider"></div>

        <div class="flex flex-col items-center gap-3">
          <button class="rail-icon" @click="router.push('/dashboard')" aria-label="بازگشت به داشبورد">
            <i class="fa-solid fa-house"></i>
          </button>
          <button class="rail-icon" @click="router.push('/new-password')" aria-label="تغییر رمز عبور">
            <i class="fa-solid fa-key"></i>
          </button>
          <button class="rail-icon" @click="router.push('/admins')" aria-label="مدیریت ادمین ها">
            <i class="fa-solid fa-users-gear"></i>
          </button>
          <button class="rail-icon" @click="router.push('/menu-management')" aria-label="مدیریت منو">
            <i class="fa-solid fa-utensils"></i>
          </button>
          <button class="rail-icon" @click="router.push('/menu-management/add')" aria-label="اضافه کردن به منو">
            <i class="fa-solid fa-plus-circle"></i>
          </button>
          <button class="rail-icon" @click="router.push('/orders-management')" aria-label="پنل سفارشات">
            <i class="fa-solid fa-bell-concierge"></i>
          </button>
        </div>

        <div class="flex-1"></div>

        <div class="rail-divider"></div>

        <div class="rail-bottom">
          <button class="rail-icon rail-icon-logout" @click="handleLogout" aria-label="خروج از حساب کاربری">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>

          <div class="relative">
            <div class="user-avatar-circle">
              <span class="text-sm">{{ userInitials }}</span>
            </div>
            <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1A1A1A]"></span>
          </div>
        </div>
      </div>

      <div
        class="sidebar-expanded"
        :class="{ open: menuOpen }">
        <div class="sidebar-header">
          <div class="sidebar-header-content">
            <h2 class="text-lg font-bold text-white tracking-tight">پنل مدیریت</h2>
            <span class="sidebar-role-badge">{{ roleText }}</span>
          </div>
          <button class="sidebar-close-btn" @click="toggleMenu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <span class="sidebar-section-label">منوی اصلی</span>
            <router-link to="/dashboard" class="sidebar-link">
              <i class="fa-solid fa-gauge-high sidebar-link-icon"></i>
              <span>داشبورد</span>
            </router-link>
            <router-link to="/orders" class="sidebar-link">
              <i class="fa-solid fa-receipt sidebar-link-icon"></i>
              <span>تاریخچه سفارشات</span>
            </router-link>
            <router-link v-if="isStaff" to="/orders-management" class="sidebar-link">
              <i class="fa-solid fa-bell-concierge sidebar-link-icon"></i>
              <span>پنل سفارشات</span>
            </router-link>
          </div>

          <div class="sidebar-section">
            <span class="sidebar-section-label">مدیریت</span>
            <router-link to="/admins" class="sidebar-link">
              <i class="fa-solid fa-users-gear sidebar-link-icon"></i>
              <span>مدیریت ادمین ها</span>
            </router-link>
            <router-link to="/menu-management" class="sidebar-link">
              <i class="fa-solid fa-utensils sidebar-link-icon"></i>
              <span>مدیریت منو</span>
            </router-link>
            <router-link to="/menu-management/add" class="sidebar-link">
              <i class="fa-solid fa-circle-plus sidebar-link-icon"></i>
              <span>اضافه کردن به منو</span>
            </router-link>
          </div>

          <div class="sidebar-section">
            <span class="sidebar-section-label">حساب کاربری</span>
            <router-link to="/new-password" class="sidebar-link">
              <i class="fa-solid fa-key sidebar-link-icon"></i>
              <span>تغییر رمز عبور</span>
            </router-link>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button
            class="sidebar-logout-btn"
            @click="handleLogout">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </div>
    </div>
  </aside>

  <!-- Settings Modal -->
  <Teleport to="body">
    <div v-if="showSettingsModal"
      class="fixed inset-0 flex items-center justify-center z-[200] transition-all duration-300"
      style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px)"
      @click.self="closeSettingsModal">
      <div class="settings-modal"
        :class="modalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">

        <div class="settings-header">
          <div class="flex items-center gap-3">
            <div class="settings-header-icon">
              <i class="fa-solid fa-gear"></i>
            </div>
            <div>
              <h3 class="settings-title">تنظیمات</h3>
              <p class="settings-subtitle">سفارشی‌سازی محیط مدیریت</p>
            </div>
          </div>
          <button class="settings-close" @click="closeSettingsModal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="settings-tabs">
          <button
            v-for="tab in [
              { id: 'appearance', icon: 'fa-palette', label: 'ظاهر' },
              { id: 'layout', icon: 'fa-layer-group', label: 'چیدمان' },
              { id: 'accessibility', icon: 'fa-universal-access', label: 'دسترسی' },
            ]"
            :key="tab.id"
            class="settings-tab"
            :class="{ active: activeSettingsTab === tab.id }"
            @click="activeSettingsTab = tab.id">
            <i class="fa-solid" :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="settings-body">
          <div v-if="activeSettingsTab === 'appearance'" class="settings-content">
            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-circle-half-stroke"></i>
                <span>حالت نمایش</span>
              </div>
              <div class="theme-toggle">
                <button class="theme-btn" :class="{ active: !isDark }" @click="setDarkMode(false)">
                  <i class="fa-solid fa-sun"></i>
                  <span>روشن</span>
                </button>
                <button class="theme-btn" :class="{ active: isDark }" @click="setDarkMode(true)">
                  <i class="fa-solid fa-moon"></i>
                  <span>تاریک</span>
                </button>
              </div>
            </div>

            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-droplet"></i>
                <span>رنگ لهجه</span>
              </div>
              <div class="color-grid">
                <button
                  v-for="(color, key) in accentColors"
                  :key="key"
                  class="color-swatch"
                  :class="{ active: accentColor === key }"
                  :style="{ '--swatch-color': color.primary }"
                  :title="color.name"
                  @click="setAccentColor(key)">
                  <i v-if="accentColor === key" class="fa-solid fa-check"></i>
                </button>
              </div>
            </div>

            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-text-height"></i>
                <span>اندازه فونت</span>
              </div>
              <div class="size-options">
                <button
                  v-for="size in [
                    { id: 'small', label: 'کوچک', icon: 'fa-font' },
                    { id: 'normal', label: 'متوسط', icon: 'fa-font' },
                    { id: 'large', label: 'بزرگ', icon: 'fa-font' },
                    { id: 'xlarge', label: 'خیلی بزرگ', icon: 'fa-font' },
                  ]"
                  :key="size.id"
                  class="size-btn"
                  :class="{ active: fontSize === size.id }"
                  @click="setFontSize(size.id)">
                  <i class="fa-solid" :class="size.icon" :style="{ fontSize: size.id === 'small' ? '12px' : size.id === 'normal' ? '14px' : size.id === 'large' ? '16px' : '18px' }"></i>
                  <span>{{ size.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeSettingsTab === 'layout'" class="settings-content">
            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-bars"></i>
                <span>نوار کناری فشرده</span>
              </div>
              <p class="setting-desc">کوچک‌تر کردن آیکون‌های نوار کناری برای فضای بیشتر</p>
              <button class="toggle-switch" :class="{ active: sidebarCompact }" @click="setSidebarCompact(!sidebarCompact)">
                <span class="toggle-knob"></span>
              </button>
            </div>

            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span>انیمیشن‌ها</span>
              </div>
              <p class="setting-desc">فعال/غیرفعال کردن افکت‌های حرکتی</p>
              <button class="toggle-switch" :class="{ active: animationsEnabled }" @click="setAnimations(!animationsEnabled)">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <div v-if="activeSettingsTab === 'accessibility'" class="settings-content">
            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-lightbulb"></i>
                <span>راهنمای خوشامدگویی</span>
              </div>
              <p class="setting-desc">نمایش نکات راهنما هنگام ورود</p>
              <button class="toggle-switch" :class="{ active: showWelcomeTips }" @click="showWelcomeTips = !showWelcomeTips; localStorage.setItem('showWelcomeTips', showWelcomeTips ? 'true' : 'false')">
                <span class="toggle-knob"></span>
              </button>
            </div>

            <div class="setting-group">
              <div class="setting-label">
                <i class="fa-solid fa-keyboard"></i>
                <span>میانبرهای صفحه کلید</span>
              </div>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-key">Ctrl + K</span>
                  <span class="shortcut-desc">جستجو</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-key">Esc</span>
                  <span class="shortcut-desc">بستن پنجره</span>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-key">Ctrl + S</span>
                  <span class="shortcut-desc">ذخیره</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button class="settings-reset-btn" @click="resetSettings">
            <i class="fa-solid fa-rotate-left"></i>
            <span>بازنشانی</span>
          </button>
          <button class="settings-save-btn" @click="closeSettingsModal">
            <i class="fa-solid fa-check"></i>
            <span>ذخیره</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sidebar-rail {
  background: linear-gradient(to bottom, #1A1A1A, #202020, #1A1A1A);
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 24px;
  gap: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.rail-divider {
  width: 24px;
  height: 1px;
  background: #333333;
  margin: 4px 0;
}

.rail-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-bottom: 4px;
}

.rail-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #737373;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  border: none;
  font-size: 16px;
  position: relative;
  z-index: 100;
}

@media (hover: hover) {
  .rail-icon:hover {
    transform: scale(1.08);
  }
  .rail-icon:active {
    transform: scale(0.95);
  }
}

@media (hover: hover) {
  .rail-icon:hover {
    background: rgba(198, 156, 109, 0.15);
    color: #C69C6D;
  }
}

.rail-icon-logout {
  color: #6B7280;
}

@media (hover: hover) {
  .rail-icon-logout:hover {
    background: rgba(239, 68, 68, 0.12);
    color: #EF4444;
  }
}

.rail-icon::before {
  content: attr(aria-label);
  position: fixed;
  left: auto;
  right: 72px;
  top: 50%;
  transform: translateY(-50%);
  background: #2A2A2A;
  color: #E5E5E5;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
  pointer-events: none;
  z-index: 99999;
  border: 1px solid #3A3A3A;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media (hover: hover) {
  .rail-icon:hover::before {
    opacity: 1;
    visibility: visible;
  }
}

.user-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #D4A373, #C69C6D);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.sidebar-expanded {
  background: rgba(22, 22, 22, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid #2A2A2A;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
  width: 0;
  opacity: 0;
  visibility: hidden;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, visibility 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-expanded.open {
  width: 260px;
  opacity: 1;
  visibility: visible;
}

.sidebar-expanded.open .sidebar-header {
  animation: sidebarSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
}

.sidebar-expanded.open .sidebar-section:nth-child(1) {
  animation: sidebarSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.sidebar-expanded.open .sidebar-section:nth-child(2) {
  animation: sidebarSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

.sidebar-expanded.open .sidebar-section:nth-child(3) {
  animation: sidebarSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

.sidebar-expanded.open .sidebar-footer {
  animation: sidebarSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
}

@keyframes sidebarSlideIn {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #2A2A2A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sidebar-header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: #C69C6D;
  background: rgba(198, 156, 109, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
  width: fit-content;
}

.sidebar-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #737373;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-size: 14px;
  flex-shrink: 0;
}

@media (hover: hover) {
  .sidebar-close-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #A3A3A3;
    transform: rotate(90deg);
  }
  .sidebar-close-btn:active {
    transform: rotate(90deg) scale(0.9);
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-section {
  padding: 0 16px;
  margin-bottom: 8px;
}

.sidebar-section-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 6px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #A3A3A3;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin: 1px 0;
}

@media (hover: hover) {
  .sidebar-link:hover {
    transform: translateX(-2px);
  }
  .sidebar-link:active {
    transform: scale(0.98);
  }
}

.sidebar-link-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
  color: #525252;
  transition: color 0.15s ease;
}

@media (hover: hover) {
  .sidebar-link:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #E5E5E5;
  }
  .sidebar-link:hover .sidebar-link-icon {
    color: #C69C6D;
  }
}

.router-link-exact-active,
.router-link-active[href="/dashboard"] {
  background: rgba(198, 156, 109, 0.1);
  color: #C69C6D;
}

.router-link-exact-active .sidebar-link-icon,
.router-link-active[href="/dashboard"] .sidebar-link-icon {
  color: #C69C6D;
}

.sidebar-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #2A2A2A;
  flex-shrink: 0;
}

.sidebar-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #EF4444;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) {
  .sidebar-logout-btn:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }
  .sidebar-logout-btn:active {
    transform: scale(0.98);
  }
}

/* Menu icon lines */
.menu-icon {
  width: 18px;
  height: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.menu-icon-line {
  width: 18px;
  height: 1.5px;
  background-color: currentColor;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: absolute;
}

.menu-icon-line.top { top: 2px; }
.menu-icon-line.middle { top: 8px; opacity: 1; }
.menu-icon-line.bottom { bottom: 2px; }

.menu-icon.active .top { transform: rotate(45deg); top: 8px; }
.menu-icon.active .middle { opacity: 0; transform: scaleX(0); }
.menu-icon.active .bottom { transform: rotate(-45deg); bottom: 8px; }
</style>

<style>
/* Settings Modal — global (not scoped) so Teleport works */
.settings-modal {
  background: #1E1E1E;
  border: 1px solid #333333;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #2A2A2A;
}

.settings-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(198, 156, 109, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C69C6D;
  font-size: 16px;
}

.settings-title { font-size: 18px; font-weight: 700; color: #F5F5F5; }
.settings-subtitle { font-size: 12px; color: #737373; margin-top: 2px; }

.settings-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid #333333;
  color: #737373;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
}
.settings-close:hover { background: rgba(255,255,255,0.05); color: #A3A3A3; }

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid #2A2A2A;
  background: #1A1A1A;
}

.settings-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #737373;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.settings-tab:hover { color: #A3A3A3; background: rgba(255,255,255,0.04); }
.settings-tab.active { color: #C69C6D; background: rgba(198,156,109,0.12); }
.settings-tab i { font-size: 14px; }

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.settings-content { display: flex; flex-direction: column; gap: 24px; }

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #E5E5E5;
}
.setting-label i { color: #C69C6D; font-size: 14px; width: 18px; text-align: center; }

.setting-desc {
  font-size: 12px;
  color: #737373;
  margin-top: -4px;
}

.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #737373;
  background: #262626;
  border: 2px solid #333333;
  cursor: pointer;
  transition: all 0.15s;
}
.theme-btn:hover { border-color: #525252; color: #A3A3A3; }
.theme-btn.active {
  border-color: #C69C6D;
  color: #C69C6D;
  background: rgba(198,156,109,0.1);
}

.color-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--swatch-color);
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.color-swatch:hover { transform: scale(1.1); }
.color-swatch.active { border-color: #E5E5E5; transform: scale(1.1); }

.size-options {
  display: flex;
  gap: 8px;
}

.size-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #737373;
  background: #262626;
  border: 2px solid #333333;
  cursor: pointer;
  transition: all 0.15s;
}
.size-btn:hover { border-color: #525252; color: #A3A3A3; }
.size-btn.active { border-color: #C69C6D; color: #C69C6D; background: rgba(198,156,109,0.1); }

.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: #333333;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  align-self: flex-start;
}
.toggle-switch.active { background: #C69C6D; }

.toggle-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 4px;
  right: 4px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.toggle-switch.active .toggle-knob { right: 26px; }

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #262626;
  border-radius: 8px;
  border: 1px solid #333333;
}

.shortcut-key {
  font-size: 12px;
  font-weight: 600;
  color: #C69C6D;
  background: rgba(198,156,109,0.1);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
}

.shortcut-desc {
  font-size: 13px;
  color: #737373;
}

.settings-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #2A2A2A;
  background: #1A1A1A;
}

.settings-reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #737373;
  background: #262626;
  border: 1px solid #333333;
  cursor: pointer;
  transition: all 0.15s;
}
.settings-reset-btn:hover { background: #333333; color: #A3A3A3; }

.settings-save-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: #C69C6D;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.settings-save-btn:hover { background: #B28C56; }

@media (max-width: 480px) {
  .settings-modal { margin: 8px; border-radius: 16px; }
  .settings-header { padding: 16px 20px; }
  .settings-tabs { padding: 8px 16px; }
  .settings-body { padding: 16px 20px; }
  .settings-footer { padding: 12px 20px; }
  .size-options { flex-wrap: wrap; }
  .size-btn { min-width: calc(50% - 4px); }
}
</style>
