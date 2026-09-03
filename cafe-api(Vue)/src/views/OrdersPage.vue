<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getOrders } from '@/services/orders'
import { useToast } from '@/composables/useToast'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

if (!auth.isAdmin) {
  router.push('/login')
}

const orders = ref([])
const loading = ref(true)
const { toast, showToast } = useToast()

const searchQuery = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

const statusConfig = {
  pending: { icon: 'fa-clock', text: 'در انتظار', color: '#fbbf24' },
  ready: { icon: 'fa-check-circle', text: 'آماده', color: '#34d399' },
  delivered: { icon: 'fa-flag-checkered', text: 'تحویل شده', color: '#60a5fa' },
}

async function loadOrders() {
  loading.value = true
  try {
    const result = await getOrders({ paginate: false, all_dates: true })
    let rawOrders = []
    if (result && result.data && Array.isArray(result.data)) {
      rawOrders = result.data
    } else if (Array.isArray(result)) {
      rawOrders = result
    }
    orders.value = rawOrders
  } catch (error) {
    console.error(error)
    showToast('خطا در بارگذاری سفارشات', 'error')
    orders.value = []
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  let result = [...orders.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      String(o.id).includes(q) ||
      (o.user?.name || '').toLowerCase().includes(q) ||
      (o.order_items || []).some(item => (item.menu_item?.name || '').toLowerCase().includes(q))
    )
  }

  if (statusFilter.value !== 'all') {
    result = result.filter(o => o.status === statusFilter.value)
  }

  if (typeFilter.value === 'in') {
    result = result.filter(o => !o.is_out)
  } else if (typeFilter.value === 'out') {
    result = result.filter(o => o.is_out)
  }

  if (dateFrom.value) {
    result = result.filter(o => o.created_at && o.created_at.slice(0, 10) >= dateFrom.value)
  }
  if (dateTo.value) {
    result = result.filter(o => o.created_at && o.created_at.slice(0, 10) <= dateTo.value)
  }

  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return result
})

const stats = computed(() => {
  const data = filteredOrders.value
  const totalSales = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const cashOrders = data.filter(o => o.is_cash).length
  const onlineOrders = data.filter(o => !o.is_cash).length
  return {
    total: data.length,
    totalSales,
    cashOrders,
    onlineOrders,
    pending: data.filter(o => o.status === 'pending').length,
    ready: data.filter(o => o.status === 'ready').length,
    delivered: data.filter(o => o.status === 'delivered').length,
  }
})

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  typeFilter.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

function formatPrice(p) {
  return Math.floor(Number(p || 0)).toLocaleString('fa-IR')
}

function formatTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(loadOrders)
</script>

<template>
  <div class="orders-page">
    <AdminSidebar v-model="sidebarOpen" />

    <header class="header" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="header-content">
        <h1 class="header-title">
          <i class="fa-solid fa-receipt header-icon"></i>
          <span>تاریخچه سفارشات</span>
        </h1>
        <button class="btn btn-primary" @click="loadOrders(); showToast('بروزرسانی شد')">
          <i class="fa-solid fa-rotate"></i>
          <span class="btn-text">بروزرسانی</span>
        </button>
      </div>
    </header>

    <main class="main-body" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="fade-in-up">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap gold"><i class="fa-solid fa-receipt"></i></div>
            <div class="stat-value">{{ stats.total.toLocaleString('fa-IR') }}</div>
            <div class="stat-label">کل سفارشات</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap green"><i class="fa-solid fa-coins"></i></div>
            <div class="stat-value">{{ formatPrice(stats.totalSales) }}</div>
            <div class="stat-label">کل فروش (تومان)</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap blue"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="stat-value">{{ stats.cashOrders.toLocaleString('fa-IR') }}</div>
            <div class="stat-label">نقدی</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap purple"><i class="fa-solid fa-credit-card"></i></div>
            <div class="stat-value">{{ stats.onlineOrders.toLocaleString('fa-IR') }}</div>
            <div class="stat-label">آنلاین</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="filter-row">
            <div class="relative search-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" class="filter-input search-input" placeholder="جستجو بر اساس نام، شماره سفارش یا آیتم..." v-model="searchQuery">
            </div>
          </div>
          <div class="filter-row">
            <select class="filter-input" v-model="statusFilter">
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="ready">آماده</option>
              <option value="delivered">تحویل شده</option>
            </select>
            <select class="filter-input" v-model="typeFilter">
              <option value="all">همه انواع</option>
              <option value="in">حضوری</option>
              <option value="out">بیرون‌بر</option>
            </select>
            <input type="date" class="filter-input" v-model="dateFrom" placeholder="از تاریخ">
            <input type="date" class="filter-input" v-model="dateTo" placeholder="تا تاریخ">
            <button class="btn btn-secondary btn-sm" @click="resetFilters">
              <i class="fa-solid fa-rotate-right"></i> بازنشانی
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="empty-state">
          <div class="loading-spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <i class="fa-solid fa-inbox empty-icon"></i>
          <p>سفارشی یافت نشد</p>
        </div>

        <!-- Orders Log -->
        <div v-else class="orders-log">
          <div v-for="order in filteredOrders" :key="order.id" class="log-row">
            <div class="log-main">
              <div class="log-header">
                <div class="log-title">
                  <span class="log-name">{{ order.user?.name || 'ناشناس' }}</span>
                  <span class="log-id">#{{ order.id }}</span>
                </div>
                <div class="log-badges">
                  <span class="type-badge" :class="order.is_out ? 'type-out' : 'type-in'">
                    <i class="fa-solid" :class="order.is_out ? 'fa-motorcycle' : 'fa-chair'"></i>
                    {{ order.is_out ? 'بیرون‌بر' : 'حضوری' }}
                  </span>
                  <span class="pay-badge" :class="order.is_cash ? 'pay-cash' : 'pay-online'">
                    <i class="fa-solid" :class="order.is_cash ? 'fa-money-bill' : 'fa-credit-card'"></i>
                    {{ order.is_cash ? 'نقدی' : 'آنلاین' }}
                  </span>
                  <span class="status-badge" :style="{ background: statusConfig[order.status]?.color + '20', color: statusConfig[order.status]?.color }">
                    <i class="fa-solid" :class="statusConfig[order.status]?.icon"></i>
                    {{ statusConfig[order.status]?.text }}
                  </span>
                </div>
              </div>

              <div class="log-items">
                <span v-for="(item, idx) in (order.order_items || [])" :key="item.id" class="log-item">
                  {{ item.menu_item?.name || 'آیتم' }} <span class="item-qty">×{{ item.quantity }}</span>
                  <span v-if="idx < (order.order_items || []).length - 1" class="item-sep">،</span>
                </span>
                <span v-if="!order.order_items?.length" class="log-no-items">بدون آیتم</span>
              </div>

              <div v-if="order.notes" class="log-notes">
                <i class="fa-solid fa-note-sticky"></i> {{ order.notes }}
              </div>

              <div class="log-meta">
                <span v-if="order.table_number"><i class="fa-solid fa-chair"></i> میز {{ order.table_number }}</span>
                <span><i class="fa-solid fa-clock"></i> {{ formatTime(order.created_at) }}</span>
                <span><i class="fa-solid fa-calendar"></i> {{ formatDate(order.created_at) }}</span>
              </div>
            </div>

            <div class="log-price">
              {{ formatPrice(order.total_amount) }}
              <span class="log-price-unit">تومان</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast -->
    <div class="toast" :class="[toast.show ? 'show' : '', `toast-${toast.type}`]">
      <i class="fa-solid" :class="toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  font-family: 'Vazirmatn', system-ui, sans-serif;
  background: #0F0F0F;
  min-height: 100vh;
}

.header {
  position: sticky; top: 0; z-index: 40;
  background: rgba(26,26,26,0.95); backdrop-filter: blur(20px);
  border-bottom: 1px solid #333333;
  transition: margin-right 0.3s ease;
}
.header-content {
  max-width: 1200px; margin: 0 auto; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
@media (min-width: 640px) { .header-content { padding: 14px 24px; } }
.header-title { font-size: 17px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
.header-icon { color: #f59e0b; font-size: 18px; }
@media (min-width: 640px) { .header-title { font-size: 20px; gap: 10px; } .header-icon { font-size: 20px; } }

.main-body {
  padding: 24px 16px 80px;
  transition: margin-right 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.main-body > .fade-in-up {
  width: 100%;
  max-width: 1100px;
}

.fade-in-up { animation: fadeInUp 0.5s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
  margin-bottom: 20px;
}
@media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; } }

.stat-card {
  background: rgba(30,30,30,0.6); border: 1px solid #333;
  border-radius: 14px; padding: 16px 12px; text-align: center;
}
.stat-icon-wrap {
  width: 40px; height: 40px; border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 16px; margin-bottom: 8px;
}
.stat-icon-wrap.gold { background: rgba(251,191,36,0.15); color: #fbbf24; }
.stat-icon-wrap.green { background: rgba(52,211,153,0.15); color: #34d399; }
.stat-icon-wrap.blue { background: rgba(96,165,250,0.15); color: #60a5fa; }
.stat-icon-wrap.purple { background: rgba(168,85,247,0.15); color: #a855f7; }
.stat-value { font-size: 20px; font-weight: 800; color: white; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }

/* Filters */
.filters-bar {
  background: rgba(30,30,30,0.6); border: 1px solid #333;
  border-radius: 14px; padding: 12px; margin-bottom: 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.search-wrap { flex: 1; min-width: 200px; position: relative; }
.search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 13px; }
.filter-input {
  flex: 1; min-width: 120px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 8px 12px; color: white; font-size: 13px;
  outline: none; transition: border-color 0.2s;
}
.filter-input:focus { border-color: #C69C6D; }
.filter-input option { background: #1A1A1A; }
.search-input { padding-right: 36px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: all 0.3s ease; border: none; white-space: nowrap;
}
@media (min-width: 640px) { .btn { padding: 11px 22px; font-size: 14px; border-radius: 12px; } }
.btn-primary { background: linear-gradient(135deg, #C69C6D, #B28C56); color: white; }
@media (hover: hover) { .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(198,156,109,0.4); } }
.btn-secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.1); }
.btn-secondary:hover { background: rgba(255,255,255,0.15); }
.btn-sm { padding: 6px 10px; font-size: 12px; }

/* Empty */
.empty-state { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); }
.empty-icon { font-size: 48px; margin-bottom: 12px; display: block; }
.loading-spinner {
  width: 32px; height: 32px; margin: 0 auto 12px;
  border: 3px solid rgba(198,156,109,0.2); border-top-color: #C69C6D;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Orders Log */
.orders-log { display: flex; flex-direction: column; gap: 8px; }

.log-row {
  background: rgba(30,30,30,0.6); border: 1px solid #333;
  border-radius: 14px; padding: 14px 16px;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
  transition: all 0.2s;
}
@media (hover: hover) { .log-row:hover { border-color: rgba(198,156,109,0.3); background: rgba(30,30,30,0.8); } }

.log-main { flex: 1; min-width: 0; }

.log-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.log-title { display: flex; align-items: baseline; gap: 8px; }
.log-name { font-size: 15px; font-weight: 700; color: white; }
.log-id { font-size: 11px; color: rgba(255,255,255,0.25); }

.log-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.type-badge, .pay-badge, .status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 600;
}
.type-in { background: rgba(96,165,250,0.12); color: #60a5fa; }
.type-out { background: rgba(251,191,36,0.12); color: #fbbf24; }
.pay-cash { background: rgba(52,211,153,0.12); color: #34d399; }
.pay-online { background: rgba(168,85,247,0.12); color: #a855f7; }

.log-items {
  display: flex; flex-wrap: wrap; gap: 2px;
  font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 6px;
}
.log-item { white-space: nowrap; }
.item-qty { color: rgba(255,255,255,0.35); font-weight: 600; font-size: 12px; }
.item-sep { color: rgba(255,255,255,0.15); margin: 0 2px; }
.log-no-items { color: rgba(255,255,255,0.2); font-style: italic; }

.log-notes {
  font-size: 12px; color: rgba(255,255,255,0.3);
  padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px;
  margin-bottom: 6px;
}
.log-notes i { color: #C69C6D; }

.log-meta {
  display: flex; gap: 12px; flex-wrap: wrap;
  font-size: 11px; color: rgba(255,255,255,0.3);
}
.log-meta i { color: #C69C6D; font-size: 10px; }

.log-price {
  text-align: left; white-space: nowrap;
  font-size: 16px; font-weight: 800; color: #fbbf24;
  padding-top: 2px;
}
.log-price-unit { display: block; font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); }

/* Toast */
.toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 10px; color: white;
  font-size: 13px; font-weight: 500; white-space: nowrap;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s;
  transform: translateX(-50%) translateY(20px);
}
.toast.show { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
</style>
