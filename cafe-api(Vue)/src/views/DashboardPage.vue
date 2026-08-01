<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AdminSidebar from '@/components/AdminSidebar.vue'

const authStore = useAuthStore()
const sidebarOpen = ref(false)

const showSettingsModal = ref(false)
const modalAnimating = ref(false)
const activeSettingsTab = ref('appearance')

// Settings state
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
  if (dark) {
    document.documentElement.classList.remove('light-mode')
  } else {
    document.documentElement.classList.add('light-mode')
  }
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
  if (compact) {
    document.documentElement.classList.add('sidebar-compact')
  } else {
    document.documentElement.classList.remove('sidebar-compact')
  }
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
  // Apply saved accent color
  const savedAccent = localStorage.getItem('accentColor') || 'gold'
  if (savedAccent !== 'gold') {
    setAccentColor(savedAccent)
  }
  // Apply saved sidebar compact
  if (sidebarCompact.value) {
    document.documentElement.classList.add('sidebar-compact')
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <AdminSidebar v-model="sidebarOpen" @open-settings="openSettingsModal" />

  <main class="main-body p-6 lg:p-8 transition-all duration-300" :style="{ marginRight: sidebarOpen ? '320px' : '64px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }">
    <!-- Dashboard cards -->
    <div class="cards-row">
      <router-link :to="{ name: 'add-menu-item' }" class="block card-modern h-full">
        <div class="dashboard-card">
          <div class="card-header">
            <div class="card-icon" style="background: var(--accent-bg)">
              <svg style="color: var(--accent)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="card-stats">
              <span class="card-badge" style="background: var(--accent-bg); color: var(--accent-light)">جدید</span>
            </div>
          </div>
          <h3 class="card-title">اضافه کردن به منو</h3>
          <p class="card-description">افزودن آیتم‌های جدید به منوی رستوران یا فروشگاه</p>
          <div class="card-footer">
            <span class="card-badge" style="background: var(--accent-bg); color: var(--accent-light)">افزودن آیتم</span>
            <svg class="card-arrow" style="color: var(--text-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
        </div>
      </router-link>

      <router-link v-if="authStore.isSuperAdmin" :to="{ name: 'admins' }" class="block card-modern h-full">
        <div class="dashboard-card">
          <div class="card-header">
            <div class="card-icon" style="background: var(--accent-bg)">
              <svg style="color: var(--accent)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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
            <span class="card-badge" style="background: var(--accent-bg); color: var(--accent-light)">۳ آنلاین</span>
            <svg class="card-arrow" style="color: var(--text-faint)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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

  <!-- Settings Modal -->
  <div v-if="showSettingsModal"
    class="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300"
    style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px)"
    @click.self="closeSettingsModal">
    <div class="settings-modal"
      :class="modalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">

      <!-- Modal Header -->
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

      <!-- Tabs -->
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

      <!-- Tab Content -->
      <div class="settings-body">

        <!-- Appearance Tab -->
        <div v-if="activeSettingsTab === 'appearance'" class="settings-content">
          <!-- Theme Mode -->
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

          <!-- Accent Color -->
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

          <!-- Font Size -->
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

        <!-- Layout Tab -->
        <div v-if="activeSettingsTab === 'layout'" class="settings-content">
          <!-- Sidebar Compact -->
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

          <!-- Animations -->
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

        <!-- Accessibility Tab -->
        <div v-if="activeSettingsTab === 'accessibility'" class="settings-content">
          <!-- Welcome Tips -->
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

          <!-- Keyboard Shortcuts Info -->
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

      <!-- Footer -->
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
</template>

<style scoped>
.main-body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-right 0.3s ease, background 0.3s ease, color 0.3s ease;
}

/* ===== Dashboard Cards ===== */
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
  .cards-row { flex-direction: column; }
  .cards-row .card-modern { max-width: 100%; flex: 1 1 100%; }
}

.iframe-wrapper {
  flex: 1 1 auto;
  min-height: 400px;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid var(--border-primary);
}

.iframe-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-primary);
  margin: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.iframe-title::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
}

.iframe-wrapper iframe {
  flex: 1 1 auto;
  width: 100%;
  border: none;
  background: var(--bg-primary);
}

.card-modern {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
}

.card-modern:hover { transform: translateY(-6px); }

.dashboard-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-primary);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.card-modern:hover .dashboard-card {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}

.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.card-stats { text-align: left; }
.card-value { font-size: 28px; font-weight: 700; color: var(--accent); line-height: 1.2; }
.card-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.card-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.card-description { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; flex-grow: 1; }
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.card-badge { font-size: 12px; padding: 4px 12px; border-radius: 8px; font-weight: 500; }
.card-arrow { width: 20px; height: 20px; opacity: 0.6; }

.pulse-new { animation: softPulse 2s infinite; }
@keyframes softPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-bg); }
  50% { box-shadow: 0 0 0 8px transparent; }
}

/* ===== Settings Modal ===== */
.settings-modal {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
}

.settings-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 16px;
}

.settings-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.settings-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.settings-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}
.settings-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
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
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.settings-tab:hover { color: var(--text-secondary); background: var(--bg-hover); }
.settings-tab.active { color: var(--accent); background: var(--accent-bg); }
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
  color: var(--text-primary);
}
.setting-label i { color: var(--accent); font-size: 14px; width: 18px; text-align: center; }

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: -4px;
}

/* Theme Toggle */
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
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-btn:hover { border-color: var(--text-faint); color: var(--text-secondary); }
.theme-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

/* Color Swatches */
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
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  box-shadow: var(--shadow-sm);
}
.color-swatch:hover { transform: scale(1.1); }
.color-swatch.active { border-color: var(--text-primary); transform: scale(1.1); }

/* Size Options */
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
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.size-btn:hover { border-color: var(--text-faint); color: var(--text-secondary); }
.size-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }

/* Toggle Switch */
.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  align-self: flex-start;
}
.toggle-switch.active { background: var(--accent); border-color: var(--accent); }

.toggle-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  right: 2px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.toggle-switch.active .toggle-knob { right: 24px; }

/* Shortcuts */
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
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.shortcut-key {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-bg);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: monospace;
}

.shortcut-desc {
  font-size: 13px;
  color: var(--text-muted);
}

/* Footer */
.settings-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.settings-reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.settings-reset-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }

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
  background: var(--accent);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.settings-save-btn:hover { background: var(--accent-dark); }

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
