<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AdminSidebar from '@/components/AdminSidebar.vue'

const authStore = useAuthStore()
const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

onMounted(() => {})
</script>

<template>
  <AdminSidebar v-model="sidebarOpen" />

  <main class="main-body transition-all duration-300" :style="{ marginRight: sidebarOpen ? '320px' : '64px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }">
    <header class="dash-header">
      <h1 class="dash-title">
        <i class="fa-solid fa-gauge-high"></i>
        داشبورد
      </h1>
    </header>

    <div class="dash-content">
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
    </div>
  </main>
</template>

<style scoped>
.main-body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-right 0.3s ease, background 0.3s ease, color 0.3s ease;
}

.dash-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(26,26,26,0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #2A2A2A;
  padding: 0;
  flex-shrink: 0;
}

.dash-title {
  font-size: 17px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 14px 20px;
}

.dash-title i {
  color: var(--accent);
  font-size: 16px;
}

.dash-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px;
  padding-bottom: 40px;
}

@media (min-width: 640px) {
  .dash-header { padding: 16px 24px; }
  .dash-content { padding: 24px 20px; padding-bottom: 40px; }
}

@media (min-width: 1024px) {
  .dash-content { padding: 28px 24px; padding-bottom: 40px; }
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
</style>
