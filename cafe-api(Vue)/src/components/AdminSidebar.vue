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

        <div class="flex flex-col items-center gap-4">
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

      <div
        class="sidebar-expanded"
        :class="{ open: menuOpen }">
        <div class="sidebar-header">
          <h2 class="text-xl font-bold text-white tracking-tight">پنل مدیریت</h2>
          <p class="text-xs text-[#A3A3A3] mt-1.5">{{ roleText }}</p>
        </div>

        <nav class="py-6 flex-1 space-y-1">
          <div class="px-3">
            <button
              class="sidebar-item w-full flex items-center justify-between px-4 py-2.5 text-[#D4D4D4] hover:text-[#C69C6D] transition-all duration-200 group">
              <div class="flex items-center">
                <svg class="w-5 h-5 ml-3 text-[#A3A3A3] group-hover:text-[#C69C6D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span class="font-medium text-sm">داشبورد</span>
              </div>
            </button>
            <div class="mr-8 mt-1 space-y-0.5 border-r-2 border-[#333333] pr-3">
              <router-link to="/dashboard" class="dashboard-subitem flex items-center px-3 py-2 text-sm text-[#A3A3A3] hover:text-[#C69C6D] transition-all">مدیریت سفارشات</router-link>
              <router-link to="/admins" class="dashboard-subitem flex items-center px-3 py-2 text-sm text-[#C69C6D] font-semibold hover:text-[#D4A373] transition-all">مدیریت ادمین ها</router-link>
              <router-link to="/add-menu" class="dashboard-subitem flex items-center px-3 py-2 text-sm text-[#A3A3A3] hover:text-[#C69C6D] transition-all">اضافه کردن به منو</router-link>
            </div>
          </div>

          <div class="px-3 mt-1">
            <router-link
              to="/dashboard"
              class="sidebar-item w-full flex items-center px-4 py-2.5 text-[#D4D4D4] hover:text-[#C69C6D] transition-all duration-200 group">
              <svg class="w-5 h-5 ml-3 text-[#A3A3A3] group-hover:text-[#C69C6D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span class="font-medium text-sm">بازگشت به داشبورد</span>
            </router-link>
          </div>
        </nav>

        <button
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 mb-2 text-red-400 hover:text-red-500 hover:bg-red-900/20 transition-all duration-200 mt-4"
          @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span class="font-medium text-base">خروج از حساب کاربری</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-rail {
  background: linear-gradient(to bottom, #1A1A1A, #262626, #1A1A1A);
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.rail-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #A3A3A3;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  cursor: pointer;
  border: none;
  font-size: 18px;
  position: relative;
  z-index: 100;
}

@media (hover: hover) {
  .rail-icon:hover {
    background: linear-gradient(135deg, #C69C6D, #B28C56);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(198, 156, 109, 0.4);
  }
}

.rail-icon-logout {
  color: #EF4444;
}

@media (hover: hover) {
  .rail-icon-logout:hover {
    background: linear-gradient(135deg, #DC2626, #B91C1C);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
}

.rail-icon::before {
  content: attr(aria-label);
  position: fixed;
  left: auto;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: #262626;
  color: white;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 99999;
  border: 1px solid #333333;
}

@media (hover: hover) {
  .rail-icon:hover::before {
    opacity: 1;
    visibility: visible;
  }
}

.user-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, #D4A373, #C69C6D);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(198, 156, 109, 0.3);
}

.sidebar-expanded {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid #333333;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
  width: 0;
  opacity: 0;
  visibility: hidden;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-expanded.open {
  width: 256px;
  opacity: 1;
  visibility: visible;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #333333;
  position: sticky;
  top: 0;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 10;
}

.sidebar-item {
  transition: all 0.2s ease;
  border-radius: 12px;
  margin: 2px 8px;
  color: #D4D4D4;
}

@media (hover: hover) {
  .sidebar-item:hover {
    background: linear-gradient(135deg, rgba(198, 156, 109, 0.15), rgba(178, 140, 86, 0.15));
  }
}

.dashboard-subitem {
  position: relative;
  padding-right: 20px;
  color: #A3A3A3;
}

.dashboard-subitem::before {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: #525252;
  border-radius: 50%;
  transition: all 0.2s ease;
}

@media (hover: hover) {
  .dashboard-subitem:hover::before {
    background: #C69C6D;
    width: 6px;
    height: 6px;
  }
}

/* Menu icon lines */
.menu-icon {
  width: 20px;
  height: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.menu-icon-line {
  width: 20px;
  height: 2px;
  background-color: currentColor;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: absolute;
}

.menu-icon-line.top { top: 2px; }
.menu-icon-line.middle { top: 9px; opacity: 1; }
.menu-icon-line.bottom { bottom: 2px; }

.menu-icon.active .top { transform: rotate(45deg); top: 9px; }
.menu-icon.active .middle { opacity: 0; transform: scaleX(0); }
.menu-icon.active .bottom { transform: rotate(-45deg); bottom: 9px; }
</style>
