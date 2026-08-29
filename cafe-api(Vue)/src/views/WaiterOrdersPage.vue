<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrders, updateOrderStatus } from '@/services/orders'
import AdminSidebar from '@/components/AdminSidebar.vue'

const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

const orders = ref([])
const loading = ref(true)
const filterStatus = ref('all')
const toastMessage = ref('')
const toastVisible = ref(false)
const toastType = ref('success')

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

const statusConfig = {
  pending: { text: 'در انتظار', icon: 'fa-clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  ready: { text: 'آماده', icon: 'fa-check-circle', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  delivered: { text: 'تحویل شده', icon: 'fa-flag-checkered', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
}

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

const stats = computed(() => ({
  total: orders.value.length,
  pending: orders.value.filter(o => o.status === 'pending').length,
  ready: orders.value.filter(o => o.status === 'ready').length,
  delivered: orders.value.filter(o => o.status === 'delivered').length,
}))

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString('fa-IR')
}

function formatTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

async function loadOrders() {
  loading.value = true
  try {
    const result = await getOrders()
    orders.value = result?.data || []
  } catch {
    showToast('خطا در بارگذاری سفارشات', 'error')
  } finally {
    loading.value = false
  }
}

async function changeStatus(orderId, newStatus) {
  try {
    await updateOrderStatus(orderId, newStatus)
    const order = orders.value.find(o => o.id === orderId)
    if (order) order.status = newStatus
    const statusText = statusConfig[newStatus]?.text || newStatus
    showToast(`وضعیت سفارش #${orderId} به "${statusText}" تغییر کرد`)
  } catch {
    showToast('خطا در تغییر وضعیت', 'error')
  }
}

onMounted(async () => {
  await loadOrders()
})

</script>

<template>
  <div class="waiter-page">
    <AdminSidebar v-model="sidebarOpen" />

    <header class="header" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="header-content">
        <div class="flex items-center gap-3">
          <router-link to="/dashboard" class="text-white/70 hover:text-white transition-colors">
            <i class="fa-solid fa-arrow-right text-lg"></i>
          </router-link>
          <h1 class="header-title">
            <i class="fa-solid fa-bell-concierge"></i> مدیریت سفارشات
          </h1>
        </div>
        <div class="stats-wrapper">
          <div class="stats-bar fade-in-up">
            <div class="stat-item">
              <span class="stat-dot gold"></span>
              <span class="stat-count">{{ stats.pending }}</span>
              <span class="stat-text">در انتظار</span>
            </div>
            <span class="stat-divider"></span>
            <div class="stat-item">
              <span class="stat-dot green"></span>
              <span class="stat-count">{{ stats.ready }}</span>
              <span class="stat-text">آماده</span>
            </div>
            <span class="stat-divider"></span>
            <div class="stat-item">
              <span class="stat-dot blue"></span>
              <span class="stat-count">{{ stats.delivered }}</span>
              <span class="stat-text">تحویل شده</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-secondary" @click="loadOrders(); showToast('لیست به‌روزرسانی شد')">
            <i class="fa-solid fa-rotate"></i>
            <span class="btn-text">بروزرسانی</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-body" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <!-- Filter -->
      <div class="filters-bar fade-in-up">
        <button
          v-for="(cfg, key) in { all: { text: 'همه', color: '#fff' }, ...statusConfig }"
          :key="key"
          class="filter-chip"
          :class="{ active: filterStatus === key }"
          :style="filterStatus === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' } : {}"
          @click="filterStatus = key">
          <i class="fa-solid" :class="cfg.icon || 'fa-layer-group'"></i>
          {{ cfg.text }}
          <span class="chip-count">{{ key === 'all' ? stats.total : stats[key] || 0 }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-grid">
        <div v-for="i in 4" :key="i" class="order-card-skeleton">
          <div class="skeleton-line w-20"></div>
          <div class="skeleton-line w-full"></div>
          <div class="skeleton-line w-1/2"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <i class="fa-solid fa-inbox empty-state-icon"></i>
        <p>سفارشی یافت نشد</p>
      </div>

      <!-- Orders Grid -->
      <div v-else class="orders-grid fade-in-up">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          :style="{ borderColor: statusConfig[order.status]?.color + '30' }">
          <div class="order-card-header">
            <span class="order-id">#{{ order.id }}</span>
            <span class="order-badge" :style="{ background: statusConfig[order.status]?.bg, color: statusConfig[order.status]?.color }">
              <i class="fa-solid" :class="statusConfig[order.status]?.icon"></i>
              {{ statusConfig[order.status]?.text }}
            </span>
          </div>

          <div class="order-card-meta">
            <span v-if="order.table_number" class="meta-item">
              <i class="fa-solid fa-chair"></i> میز {{ order.table_number }}
            </span>
            <span v-if="order.is_out" class="meta-item">
              <i class="fa-solid fa-location-dot"></i> بیرون‌بر
            </span>
            <span class="meta-item">
              <i class="fa-solid fa-clock"></i> {{ formatTime(order.created_at) }}
            </span>
          </div>

          <div class="order-card-items">
            <div v-for="item in order.orderItems" :key="item.id" class="order-card-item">
              <span>{{ item.menuItem?.name || 'آیتم' }}</span>
              <span class="item-qty">×{{ item.quantity }}</span>
            </div>
          </div>

          <div v-if="order.notes" class="order-card-notes">
            <i class="fa-solid fa-note-sticky"></i> {{ order.notes }}
          </div>

          <div class="order-card-footer">
            <span class="order-total">{{ formatPrice(order.total_amount) }} تومان</span>
            <div class="order-actions">
              <button
                v-if="order.status === 'pending'"
                class="action-btn action-ready"
                @click="changeStatus(order.id, 'ready')">
                <i class="fa-solid fa-check"></i> آماده
              </button>
              <button
                v-if="order.status === 'ready'"
                class="action-btn action-deliver"
                @click="changeStatus(order.id, 'delivered')">
                <i class="fa-solid fa-flag-checkered"></i> تحویل
              </button>
              <button
                v-if="order.status !== 'delivered'"
                class="action-btn action-skip"
                @click="changeStatus(order.id, 'delivered')">
                <i class="fa-solid fa-forward"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast -->
    <div class="toast" :class="[toastVisible ? 'show' : '', `toast-${toastType}`]">
      <i class="fa-solid" :class="toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style>
:root {
  --bg-primary: #0F0F0F;
  --bg-card: rgba(30,30,30,0.6);
  --border-primary: #333333;
  --text-primary: #D4D4D4;
  --text-muted: #525252;
  --accent: #C69C6D;
  --accent-dark: #B28C56;
  --accent-bg: rgba(198,156,109,0.12);
  --blur-amount: 20px;
  --radius-default: 12px;
}

* { font-family: 'Vazirmatn', system-ui, sans-serif; }

.waiter-page {
  background: var(--bg-primary);
  min-height: 100vh;
  min-height: 100dvh;
}

.header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(26,26,26,0.95); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-primary);
  transition: margin-right 0.3s ease;
}
.header-content {
  max-width: 1400px; margin: 0 auto; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
@media (min-width: 768px) { .header-content { padding: 16px 24px; } }
@media (max-width: 767px) {
  .header-content { flex-direction: column; align-items: stretch; }
  .stats-wrapper { order: 1; margin: 8px 0; }
  .header-right { order: 2; justify-content: center; }
}
.header-title { font-size: 17px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
@media (min-width: 640px) { .header-title { font-size: 20px; gap: 10px; } }
.stats-wrapper { display: flex; align-items: center; justify-content: center; flex: 1; }
.stats-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 12px; background: rgba(255,255,255,0.03); border-radius: 48px; flex-wrap: wrap; }
@media (min-width: 640px) { .stats-bar { gap: 16px; padding: 6px 20px; } }
.stat-item { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.stat-dot.gold { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.5); }
.stat-dot.green { background: #34d399; box-shadow: 0 0 6px rgba(52,211,153,0.5); }
.stat-dot.blue { background: #60a5fa; box-shadow: 0 0 6px rgba(96,165,250,0.5); }
.stat-count { font-size: 14px; font-weight: 700; color: white; min-width: 20px; text-align: center; }
@media (min-width: 640px) { .stat-count { font-size: 16px; } }
.stat-text { font-size: 10px; color: rgba(255,255,255,0.6); }
@media (min-width: 640px) { .stat-text { font-size: 11px; } }
.stat-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }
.header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px; font-weight: 600; font-size: 12px;
  cursor: pointer; transition: all 0.3s ease; border: none; white-space: nowrap;
}
@media (min-width: 640px) { .btn { padding: 10px 20px; font-size: 14px; border-radius: 12px; gap: 8px; } }
.btn-secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.1); }
@media (hover: hover) { .btn-secondary:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); } }

.main-body {
  padding: 24px;
  transition: margin-right 0.3s ease;
}
@media (min-width: 1024px) { .main-body { padding: 32px; } }

.fade-in-up { animation: fadeInUp 0.5s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.filters-bar {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-bottom: 20px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 14px;
  backdrop-filter: blur(var(--blur-amount));
}

.filter-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
}
@media (hover: hover) { .filter-chip:hover { background: rgba(255,255,255,0.1); color: white; } }

.chip-count {
  background: rgba(255,255,255,0.1);
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 11px;
  min-width: 20px;
  text-align: center;
}

.loading-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
}

.order-card-skeleton {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.skeleton-line.w-20 { width: 80px; }
.skeleton-line.w-full { width: 100%; }
.skeleton-line.w-1\/2 { width: 50%; }

@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.empty-state {
  text-align: center; padding: 60px 20px;
}

.empty-state-icon {
  font-size: 48px; color: rgba(255,255,255,0.08); margin-bottom: 12px;
}
.empty-state p { color: rgba(255,255,255,0.35); font-size: 15px; }

.orders-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
}

.order-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
  transition: all 0.2s;
  backdrop-filter: blur(var(--blur-amount));
}
@media (hover: hover) { .order-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); } }

.order-card-header {
  display: flex; justify-content: space-between; align-items: center;
}

.order-id {
  font-size: 18px; font-weight: 800; color: white;
}

.order-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
}

.order-card-meta {
  display: flex; flex-wrap: wrap; gap: 10px;
}

.meta-item {
  display: flex; align-items: center; gap: 5px;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
}
.meta-item i { color: var(--accent); font-size: 11px; }

.order-card-items {
  display: flex; flex-direction: column; gap: 4px;
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.order-card-item {
  display: flex; justify-content: space-between; align-items: center;
  color: rgba(255,255,255,0.6);
  font-size: 13px;
}

.item-qty {
  color: rgba(255,255,255,0.3);
  font-weight: 600;
}

.order-card-notes {
  display: flex; align-items: center; gap: 6px;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}
.order-card-notes i { color: var(--accent); }

.order-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 4px;
}

.order-total {
  font-size: 15px; font-weight: 800; color: #fbbf24;
}

.order-actions {
  display: flex; gap: 6px;
}

.action-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; border: none;
}
@media (hover: hover) { .action-btn:hover { transform: translateY(-1px); } }

.action-ready {
  background: rgba(52,211,153,0.15); color: #34d399;
  border: 1px solid rgba(52,211,153,0.3);
}
.action-deliver {
  background: rgba(96,165,250,0.15); color: #60a5fa;
  border: 1px solid rgba(96,165,250,0.3);
}
.action-skip {
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 8px 10px;
}

.toast {
  position: fixed; bottom: 24px; left: 24px; z-index: 9999;
  padding: 14px 20px; border-radius: 14px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  animation: fadeInUp 0.3s ease; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease; transform: translateY(100px); opacity: 0;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-success { background: linear-gradient(135deg, #059669, #047857); color: white; }
.toast-error { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; }
</style>
