<script setup>
// ============ صفحه مدیریت سفارشات ============
// بررسی دسترسی ادمین، بارگذاری سفارشات، فیلتر/جستجو/مرتب‌سازی، تغییر وضعیت

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getOrders, updateOrderStatus } from '@/services/orders'
import { useToast } from '@/composables/useToast'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

if (!auth.isAdmin) {
  router.push('/login')
}

// ============ وضعیت‌ها و تنظیمات ============
const orders = ref([])
const loading = ref(true)
const currentStatusId = ref(null)

const statusConfig = {
  pending: { icon: 'fa-clock', badge: 'badge-pending', text: 'در انتظار' },
  preparing: { icon: 'fa-fire', badge: 'badge-preparing', text: 'در حال تهیه' },
  delivered: { icon: 'fa-circle-check', badge: 'badge-delivered', text: 'تحویل شده' },
  cancelled: { icon: 'fa-ban', badge: 'badge-cancelled', text: 'لغو شده' }
}

// ============ فیلترها ============
const searchQuery = ref('')
const statusFilter = ref('all')
const tableFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const sortBy = ref('newest')

// ============ مودال‌ها ============
const showStatusModal = ref(false)

// ============ نوتیفیکیشن ============
const { toast, showToast } = useToast()

// ============ بارگذاری سفارشات ============
async function loadOrders() {
  loading.value = true
  try {
    const result = await getOrders()
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

// ============ فیلتر و مرتب‌سازی ============
const filteredOrders = computed(() => {
  let result = [...orders.value]

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      String(o.id).includes(search) ||
      (o.items || []).some(item => (item.name || '').toLowerCase().includes(search))
    )
  }

  if (statusFilter.value !== 'all') {
    result = result.filter(o => o.status === statusFilter.value)
  }

  if (tableFilter.value !== 'all') {
    result = result.filter(o => String(o.table_number) === tableFilter.value)
  }

  if (dateFrom.value) {
    result = result.filter(o => o.created_at && o.created_at >= dateFrom.value)
  }

  if (dateTo.value) {
    result = result.filter(o => o.created_at && o.created_at <= dateTo.value)
  }

  const sortFns = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    'price-asc': (a, b) => (a.total_price || 0) - (b.total_price || 0),
    'price-desc': (a, b) => (b.total_price || 0) - (a.total_price || 0),
    id: (a, b) => (a.id || 0) - (b.id || 0)
  }
  result.sort(sortFns[sortBy.value] || sortFns.newest)

  return result
})

// ============ آمار ============
const stats = computed(() => {
  const data = filteredOrders.value
  return {
    total: data.length,
    pending: data.filter(o => o.status === 'pending').length,
    delivered: data.filter(o => o.status === 'delivered').length,
    tables: new Set(data.map(o => o.table_number)).size
  }
})

// ============ بازنشانی فیلترها ============
function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  tableFilter.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  sortBy.value = 'newest'
}

// ============ مودال تغییر وضعیت ============
function openStatusModal(id) {
  currentStatusId.value = id
  showStatusModal.value = true
}

function closeStatusModal() {
  showStatusModal.value = false
  currentStatusId.value = null
}

async function changeStatusFromModal(newStatus) {
  if (!currentStatusId.value) return
  const o = orders.value.find(o => o.id === currentStatusId.value)
  if (!o) return

  try {
    await updateOrderStatus(currentStatusId.value, newStatus)
    o.status = newStatus
    showToast(`وضعیت سفارش #${o.id} به "${statusConfig[newStatus]?.text || newStatus}" تغییر کرد`)
    closeStatusModal()
  } catch (error) {
    console.error(error)
    showToast('خطا در تغییر وضعیت', 'error')
  }
}

// ============ بستن مودال با Escape ============
function handleKeydown(e) {
  if (e.key === 'Escape' && showStatusModal.value) {
    closeStatusModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadOrders()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="admin-layout" :style="{ paddingRight: sidebarOpen ? '320px' : '64px' }">
    <AdminSidebar v-model="sidebarOpen" />

    <header class="header">
      <div class="header-content">
        <div class="flex items-center gap-3">
          <h1 class="header-title">
            <i class="fa-solid fa-receipt header-icon"></i>
            <span>مدیریت سفارشات</span>
          </h1>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-secondary" @click="loadOrders(); showToast('لیست به‌روزرسانی شد')">
            <i class="fa-solid fa-rotate"></i>
            <span class="btn-text">بروزرسانی</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-body">
    <!-- ============ آمار ============ -->
    <div class="stats-grid fade-in-up">
      <div class="stats-card">
        <i class="fa-solid fa-mug-saucer stats-icon text-blue-400 block"></i>
        <div class="stats-number text-blue-400">{{ stats.total.toLocaleString('fa-IR') }}</div>
        <div class="text-white/60 stats-label">کل محصولات</div>
      </div>
      <div class="stats-card">
        <i class="fa-solid fa-clock stats-icon text-yellow-400 block pulse-animation"></i>
        <div class="stats-number text-yellow-400">{{ stats.pending.toLocaleString('fa-IR') }}</div>
        <div class="text-white/60 stats-label">در انتظار</div>
      </div>
      <div class="stats-card">
        <i class="fa-solid fa-circle-check stats-icon text-green-400 block"></i>
        <div class="stats-number text-green-400">{{ stats.delivered.toLocaleString('fa-IR') }}</div>
        <div class="text-white/60 stats-label">تحویل شده</div>
      </div>
      <div class="stats-card">
        <i class="fa-solid fa-chair stats-icon text-purple-400 block"></i>
        <div class="stats-number text-purple-400">{{ stats.tables.toLocaleString('fa-IR') }}</div>
        <div class="text-white/60 stats-label">میزهای فعال</div>
      </div>
    </div>

    <!-- ============ فیلترها ============ -->
    <div class="glass-effect filter-container mb-6 md:mb-8 fade-in-up">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm"></i>
          <input type="text" class="search-box pr-8" placeholder="جستجو..." v-model="searchQuery">
        </div>
        <select class="filter-select" v-model="statusFilter">
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="preparing">در حال تهیه</option>
          <option value="delivered">تحویل شده</option>
          <option value="cancelled">لغو شده</option>
        </select>
        <select class="filter-select" v-model="tableFilter">
          <option value="all">همه میزها</option>
          <option value="1">میز شماره ۱</option>
          <option value="2">میز شماره ۲</option>
          <option value="3">میز شماره ۳</option>
          <option value="4">میز شماره ۴</option>
          <option value="5">میز شماره ۵</option>
          <option value="6">میز شماره ۶</option>
          <option value="7">میز شماره ۷</option>
          <option value="8">میز شماره ۸</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label class="text-white/60 filter-label block">از تاریخ:</label>
          <input type="date" class="filter-date" v-model="dateFrom">
        </div>
        <div>
          <label class="text-white/60 filter-label block">تا تاریخ:</label>
          <input type="date" class="filter-date" v-model="dateTo">
        </div>
        <div>
          <label class="text-white/60 filter-label block">مرتب‌سازی:</label>
          <select class="filter-select" v-model="sortBy">
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="price-asc">قیمت: کم به زیاد</option>
            <option value="price-desc">قیمت: زیاد به کم</option>
            <option value="id">شماره سفارش</option>
            <option value="table">شماره میز</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button class="btn btn-secondary text-sm" @click="resetFilters()">
          <i class="fa-solid fa-rotate-right"></i><span class="hidden sm:inline">بازنشانی</span>
        </button>
        <!-- دکمه اعمال فیلتر (فقط ظاهری، فیلترها خودکار اعمال می‌شوند) -->
        <button class="btn btn-primary text-sm">
          <i class="fa-solid fa-filter"></i><span class="hidden sm:inline">اعمال فیلتر</span>
        </button>
      </div>
    </div>

    <!-- ============ لودینگ ============ -->
    <div v-if="loading" class="text-center py-12 md:py-20">
      <div class="loading-spinner mx-auto mb-4"></div>
      <p class="text-white/50 text-sm">در حال بارگذاری...</p>
    </div>

    <!-- ============ حالت خالی ============ -->
    <div v-else-if="filteredOrders.length === 0" class="text-center py-12 md:py-20 fade-in-up">
      <i class="fa-solid fa-box-open text-4xl md:text-6xl text-white/20 mb-3 md:mb-4"></i>
      <h3 class="text-white text-lg md:text-xl font-bold mb-2">محصولی یافت نشد</h3>
      <p class="text-white/50 text-sm mb-4 md:mb-6">هیچ محصولی با این فیلترها پیدا نشد</p>
      <button class="btn btn-primary" @click="resetFilters()">
        <i class="fa-solid fa-rotate-right"></i>بازنشانی فیلترها
      </button>
    </div>

    <!-- ============ لیست سفارشات ============ -->
    <div v-else class="products-grid fade-in-up">
      <div v-for="o in filteredOrders" :key="o.id" class="card-glass fade-in-up">
        <div class="relative p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="badge" :class="statusConfig[o.status]?.badge || statusConfig.pending.badge">
              <i class="fa-solid ml-1" :class="statusConfig[o.status]?.icon || statusConfig.pending.icon"></i>
              {{ statusConfig[o.status]?.text || 'نامشخص' }}
            </span>
            <span class="text-white/40 text-xs"><i class="fa-solid fa-chair ml-1"></i>میز {{ o.table_number || '-' }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-white font-bold mb-1 product-name">سفارش #{{ o.id }}</h3>
            <p class="text-white/50 text-xs mb-2 line-clamp-2">
              {{ (o.items || []).map(item => `${item.name || 'نامشخص'} x${item.quantity || 1}`).join(', ') || 'بدون آیتم' }}
            </p>
            <div class="flex items-center justify-between">
              <span class="text-white font-bold product-price">{{ (o.total_price || 0).toLocaleString('fa-IR') }} تومان</span>
              <span class="text-white/30 text-xs">{{ o.created_at ? new Date(o.created_at).toLocaleDateString('fa-IR') : '-' }}</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn action-status" @click="openStatusModal(o.id)">
            <i class="fa-solid fa-arrows-rotate"></i><span class="hidden sm:inline">وضعیت</span>
          </button>
        </div>
      </div>
    </div>

  </main>

  <!-- ============ مودال تغییر وضعیت ============ -->
  <Transition name="modal">
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fa-solid fa-arrows-rotate ml-2 text-yellow-400"></i>تغییر وضعیت</h3>
          <button class="modal-close" @click="closeStatusModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="space-y-3 md:space-y-4 mb-4 md:mb-6">
          <p class="text-white/70 text-base md:text-lg font-bold">
            سفارش #{{ orders.find(o => o.id === currentStatusId)?.id }}
          </p>
          <p class="text-white/50 text-xs md:text-sm">
            میز {{ orders.find(o => o.id === currentStatusId)?.table_number || '-' }}
            | {{ (orders.find(o => o.id === currentStatusId)?.total_price || 0).toLocaleString('fa-IR') }} تومان
          </p>
          <div class="status-grid">
            <button
              class="status-card-btn"
              :class="{ selected: orders.find(o => o.id === currentStatusId)?.status === 'pending' }"
              @click="changeStatusFromModal('pending')">
              <i class="fa-solid fa-clock status-icon text-yellow-400 block"></i>
              <span class="text-white text-sm font-bold">در انتظار</span>
              <span class="text-white/40 text-xs mt-1 block">سفارش ثبت شده</span>
            </button>
            <button
              class="status-card-btn"
              :class="{ selected: orders.find(o => o.id === currentStatusId)?.status === 'delivered' }"
              @click="changeStatusFromModal('delivered')">
              <i class="fa-solid fa-circle-check status-icon text-green-400 block"></i>
              <span class="text-white text-sm font-bold">تحویل شده</span>
              <span class="text-white/40 text-xs mt-1 block">تحویل به مشتری</span>
            </button>
          </div>
        </div>
        <div class="flex justify-end">
          <button class="btn btn-secondary" @click="closeStatusModal()">انصراف</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ============ نوتیفیکیشن ============ -->
  <Transition name="toast">
    <div v-if="toast.show" class="toast-notification" :class="{ 'toast-error': toast.type === 'error', 'toast-success': toast.type === 'success' }">
      <i class="fa-solid text-lg" :class="toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'"></i>
      <span class="text-sm">{{ toast.message }}</span>
    </div>
  </Transition>
  </div>
</template>

<style scoped>
/* ============ انیمیشن‌ها ============ */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.pulse-animation { animation: pulse 2s infinite; }

/* ============ افکت شیشه‌ای ============ */
.glass-effect {
  background: rgba(30,30,30,0.6);
  backdrop-filter: blur(20px);
  border: 1px solid #333333;
}
.card-glass {
  background: rgba(30,30,30,0.6);
  backdrop-filter: blur(20px);
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}
.card-glass:hover {
  background: rgba(30,30,30,0.8);
  border-color: #C69C6D;
  transform: translateY(-4px);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
}
@media (min-width: 640px) {
  .card-glass { padding: 20px; }
}

/* ============ دکمه‌ها ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
  text-decoration: none;
}
@media (min-width: 640px) {
  .btn { padding: 10px 20px; font-size: 14px; border-radius: 12px; gap: 6px; }
}
.btn-primary { background: linear-gradient(135deg, #C69C6D, #B28C56); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(198,156,109,0.4); }
.btn-secondary { background: rgba(30,30,30,0.8); color: #D4D4D4; border: 1px solid #333333; }
.btn-secondary:hover { background: rgba(30,30,30,1); }

/* ============ دکمه‌های عملیات کارت ============ */
.card-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #333333;
}
@media (min-width: 400px) {
  .card-actions { grid-template-columns: repeat(3, 1fr); gap: 6px; }
}
@media (min-width: 640px) {
  .card-actions { gap: 8px; padding-top: 12px; }
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  color: white;
}
@media (min-width: 400px) {
  .action-btn { padding: 10px 8px; font-size: 13px; border-radius: 10px; gap: 6px; }
}
.action-status { background: rgba(250,204,21,0.15); color: #fde047; }
.action-status:hover { background: rgba(250,204,21,0.3); }

/* ============ هدر ============ */
.header {
  background: rgba(26,26,26,0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #333333;
  position: sticky;
  top: 0;
  z-index: 40;
  transition: margin-right 0.3s ease;
}
.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
@media (min-width: 640px) {
  .header-content { padding: 16px 24px; }
}
.header-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  color: #f59e0b;
  font-size: 18px;
}
@media (min-width: 640px) {
  .header-title { font-size: 20px; }
  .header-icon { font-size: 20px; }
}

/* ============ فیلترها ============ */
.search-box, .filter-select, .filter-date {
  background: rgba(30,30,30,0.8);
  border: 1px solid #333333;
  border-radius: 10px;
  padding: 8px 12px;
  color: white;
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
  width: 100%;
}
@media (min-width: 640px) {
  .search-box, .filter-select, .filter-date { padding: 10px 16px; font-size: 14px; border-radius: 12px; }
}
.search-box:focus, .filter-select:focus, .filter-date:focus {
  border-color: #C69C6D;
  background: rgba(30,30,30,1);
  box-shadow: 0 0 0 3px rgba(198,156,109,0.15);
}
.search-box::placeholder { color: rgba(255,255,255,0.4); }
.filter-select { cursor: pointer; appearance: none; }
.filter-select option { background: #1A1A1A; color: white; }
.filter-date::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }

.filter-container {
  padding: 16px;
  border-radius: 16px;
}
@media (min-width: 640px) {
  .filter-container { padding: 24px; border-radius: 20px; }
}
.filter-label {
  font-size: 11px;
  margin-bottom: 4px;
}
@media (min-width: 640px) {
  .filter-label { font-size: 12px; margin-bottom: 4px; }
}

/* ============ گرید محصولات ============ */
.main-body {
  padding: 16px 12px;
  padding-bottom: 80px;
  transition: margin-right 0.3s ease;
}
@media (min-width: 640px) {
  .main-body { padding: 24px 16px; padding-bottom: 80px; }
}
@media (min-width: 1024px) {
  .main-body { padding: 32px 24px; padding-bottom: 80px; }
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 480px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}
@media (min-width: 768px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (min-width: 1024px) {
  .products-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}
@media (min-width: 1280px) {
  .products-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; }
}

/* ============ بج وضعیت ============ */
.badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 16px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
@media (min-width: 640px) {
  .badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; gap: 4px; }
}
.badge-pending { background: rgba(250,204,21,0.2); color: #fde047; }
.badge-delivered { background: rgba(34,197,94,0.2); color: #86efac; }
.badge-preparing { background: rgba(251,146,60,0.2); color: #fdba74; }
.badge-cancelled { background: rgba(239,68,68,0.2); color: #fca5a5; }

.product-name { font-size: 15px; }
@media (min-width: 640px) {
  .product-name { font-size: 18px; }
}
.product-price { font-size: 13px; }
@media (min-width: 640px) {
  .product-price { font-size: 16px; }
}

/* ============ آمار ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
@media (min-width: 640px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
}
@media (min-width: 1024px) {
  .stats-grid { gap: 16px; margin-bottom: 32px; }
}
.stats-card {
  background: rgba(30,30,30,0.6);
  backdrop-filter: blur(20px);
  border: 1px solid #333333;
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  transition: all 0.3s ease;
}
@media (min-width: 640px) {
  .stats-card { padding: 16px; border-radius: 16px; }
}
@media (min-width: 1024px) {
  .stats-card { padding: 20px; }
}
.stats-card:hover { background: rgba(30,30,30,0.8); transform: translateY(-2px); }
.stats-icon { font-size: 18px; margin-bottom: 6px; }
@media (min-width: 640px) {
  .stats-icon { font-size: 22px; margin-bottom: 8px; }
}
@media (min-width: 1024px) {
  .stats-icon { font-size: 24px; }
}
.stats-number { font-size: 22px; font-weight: 800; }
@media (min-width: 640px) {
  .stats-number { font-size: 28px; }
}
@media (min-width: 1024px) {
  .stats-number { font-size: 32px; }
}
.stats-label { font-size: 11px; }
@media (min-width: 640px) {
  .stats-label { font-size: 13px; }
}
@media (min-width: 1024px) {
  .stats-label { font-size: 14px; }
}

/* ============ مودال ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.modal-content {
  background: #1A1A1A;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  transform: scale(1);
  transition: all 0.3s ease;
}
@media (min-width: 640px) {
  .modal-content { padding: 32px; border-radius: 20px; }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
@media (min-width: 640px) {
  .modal-header { margin-bottom: 24px; }
}
.modal-title { font-size: 17px; font-weight: bold; color: white; }
@media (min-width: 640px) {
  .modal-title { font-size: 20px; }
}
.modal-close {
  color: rgba(255,255,255,0.5);
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
}
@media (min-width: 640px) {
  .modal-close { font-size: 20px; }
}
.modal-close:hover { color: white; }

.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 400px) {
  .status-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
}
.status-card-btn {
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #333333;
  background: rgba(30,30,30,0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}
@media (min-width: 640px) {
  .status-card-btn { padding: 20px 16px; border-radius: 14px; }
}
.status-card-btn:hover {
  transform: translateY(-3px);
  border-color: rgba(198,156,109,0.3);
  background: rgba(30,30,30,0.8);
}
.status-card-btn.selected {
  border-color: #C69C6D;
  background: rgba(198,156,109,0.1);
  box-shadow: 0 0 20px rgba(198,156,109,0.15);
}
.status-icon { font-size: 24px; margin-bottom: 6px; }
@media (min-width: 640px) {
  .status-icon { font-size: 28px; margin-bottom: 8px; }
}

/* ============ لودینگ اسپینر ============ */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(198,156,109,0.3);
  border-top-color: #C69C6D;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ نوتیفیکیشن ============ */
.toast-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  pointer-events: none;
}
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }

/* ============ ترنزیشن‌ها ============ */
.modal-enter-active { transition: opacity 0.25s ease; }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.toast-enter-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.toast-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(-50%) translateY(20px); opacity: 0; }
</style>
