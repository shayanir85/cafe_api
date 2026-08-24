<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'open-settings'])

const router = useRouter()
const auth = useAuthStore()

const menuOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
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
const roleText = computed(() => user.value?.role === 'super_admin' ? 'سوپر ادمین' : user.value?.role === 'admin' ? 'ادمین' : 'کاربر')
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

        <button class="rail-icon" @click="emit('open-settings')" aria-label="تنظیمات">
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
          <button class="rail-icon" @click="router.push('/add-menu')" aria-label="اضافه کردن به منو">
            <i class="fa-solid fa-plus-circle"></i>
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
            <router-link to="/dashboard" class="sidebar-link">
              <i class="fa-solid fa-receipt sidebar-link-icon"></i>
              <span>مدیریت سفارشات</span>
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
            <router-link to="/add-menu" class="sidebar-link">
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
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-size: 16px;
  position: relative;
  z-index: 100;
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-expanded.open {
  width: 260px;
  opacity: 1;
  visibility: visible;
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
  transition: all 0.15s ease;
  font-size: 14px;
  flex-shrink: 0;
}

@media (hover: hover) {
  .sidebar-close-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #A3A3A3;
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
  transition: all 0.15s ease;
  margin: 1px 0;
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
  transition: all 0.15s ease;
}

@media (hover: hover) {
  .sidebar-logout-btn:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.2);
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
  transition: all 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: absolute;
}

.menu-icon-line.top { top: 2px; }
.menu-icon-line.middle { top: 8px; opacity: 1; }
.menu-icon-line.bottom { bottom: 2px; }

.menu-icon.active .top { transform: rotate(45deg); top: 8px; }
.menu-icon.active .middle { opacity: 0; transform: scaleX(0); }
.menu-icon.active .bottom { transform: rotate(-45deg); bottom: 8px; }
</style>
