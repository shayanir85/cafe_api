<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '@/services/orders'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import MenuHeader from '@/components/MenuHeader.vue'
import MenuFooter from '@/components/MenuFooter.vue'

const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref(false)

const statusConfig = {
  pending: { text: 'در انتظار', icon: 'fa-clock', color: '#fbbf24', bgColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.2)' },
  ready: { text: 'آماده', icon: 'fa-check-circle', color: '#34d399', bgColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' },
  delivered: { text: 'تحویل شده', icon: 'fa-flag-checkered', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.2)' },
}

const statusSteps = ['pending', 'ready', 'delivered']

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString('fa-IR')
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

async function loadOrder() {
  try {
    const result = await getOrder(route.params.id)
    order.value = result?.data || result
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadOrder()
})
</script>

<template>
  <BackgroundBlobs />
  <MenuHeader />

  <main class="main-container">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری سفارش...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <i class="fas fa-exclamation-triangle empty-state-icon"></i>
      <h3>سفارش یافت نشد</h3>
      <p>ممکن است سفارش حذف شده باشد یا شناسه نادرست باشد</p>
      <router-link to="/" class="back-link-home">
        <i class="fas fa-arrow-right"></i> بازگشت به منو
      </router-link>
    </div>

    <!-- Order Details -->
    <div v-else-if="order" class="order-page">
      <div class="order-header">
        <h1>
          <i class="fas fa-receipt"></i>
          سفارش شماره #{{ order.id }}
        </h1>
        <span class="order-date">{{ formatDate(order.created_at) }}</span>
      </div>

      <!-- Status Tracker -->
      <div class="status-tracker">
        <div
          v-for="(step, idx) in statusSteps"
          :key="step"
          class="status-step"
          :class="{
            active: statusSteps.indexOf(order.status) >= idx,
            current: order.status === step,
          }">
          <div class="step-dot" :style="{
            background: statusSteps.indexOf(order.status) >= idx ? statusConfig[step].color : 'rgba(255,255,255,0.1)',
            boxShadow: order.status === step ? `0 0 12px ${statusConfig[step].color}` : 'none',
          }">
            <i class="fas" :class="statusConfig[step].icon"></i>
          </div>
          <span class="step-label">{{ statusConfig[step].text }}</span>
          <div v-if="idx < statusSteps.length - 1" class="step-line" :class="{ filled: statusSteps.indexOf(order.status) > idx }"></div>
        </div>
      </div>

      <!-- Current Status Badge -->
      <div class="current-status" :style="{
        background: statusConfig[order.status]?.bgColor,
        borderColor: statusConfig[order.status]?.borderColor,
        color: statusConfig[order.status]?.color,
      }">
        <i class="fas" :class="statusConfig[order.status]?.icon"></i>
        {{ statusConfig[order.status]?.text || order.status }}
      </div>

      <!-- Order Info -->
      <div class="order-info-grid">
        <div class="info-card" v-if="order.table_number">
          <i class="fas fa-chair"></i>
          <span class="info-label">شماره میز</span>
          <span class="info-value">{{ order.table_number }}</span>
        </div>
        <div class="info-card" v-if="order.is_out">
          <i class="fas fa-location-dot"></i>
          <span class="info-label">تحویل بیرون</span>
          <span class="info-value">{{ order.address || '—' }}</span>
        </div>
        <div class="info-card">
          <i class="fas fa-money-bill-wave"></i>
          <span class="info-label">مبلغ کل</span>
          <span class="info-value price">{{ formatPrice(order.total_amount) }} تومان</span>
        </div>
      </div>

      <!-- Order Items -->
      <div class="items-section">
        <h3><i class="fas fa-list-ul"></i> اقلام سفارش</h3>
        <div class="order-items">
          <div v-for="item in order.order_items" :key="item.id" class="order-item">
            <div class="item-img">
              <img
                v-if="item.menu_item?.image_url"
                :src="item.menu_item.image_url"
                :alt="item.menu_item?.name"
                @error="(e) => (e.target.style.display = 'none')" />
              <i v-else class="fas fa-mug-hot"></i>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.menu_item?.name || 'آیتم حذف شده' }}</div>
              <div class="item-meta">
                {{ item.quantity }} × {{ formatPrice(item.unit_price) }} تومان
              </div>
            </div>
            <div class="item-total">{{ formatPrice(item.subtotal) }} تومان</div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="order.notes" class="order-notes">
        <h3><i class="fas fa-note-sticky"></i> یادداشت</h3>
        <p>{{ order.notes }}</p>
      </div>

      <div class="order-actions">
        <router-link to="/" class="btn-back">
          <i class="fas fa-arrow-right"></i> بازگشت به منو
        </router-link>
      </div>
    </div>
  </main>

  <MenuFooter :showCategories="false" />
</template>

<style scoped>
.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: calc(100vh - 120px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.empty-state h3 { color: white; font-size: 18px; margin-bottom: 8px; }
.empty-state p { color: rgba(255, 255, 255, 0.4); font-size: 14px; margin-bottom: 20px; }

.back-link-home {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #f59e0b;
  text-decoration: none;
  font-weight: 600;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 12px;
}

.order-header h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-header h1 i { color: #fbbf24; }

.order-date {
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

/* Status Tracker */
.status-tracker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
}

.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  flex: 1;
}

.step-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.5s ease;
}

.status-step.active .step-dot {
  color: white;
}

.step-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 600;
}

.status-step.active .step-label {
  color: rgba(255, 255, 255, 0.8);
}

.step-line {
  position: absolute;
  top: 24px;
  left: calc(50% + 28px);
  width: calc(100% - 56px);
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
}

.step-line.filled {
  background: #f59e0b;
}

.status-step:last-child .step-line {
  display: none;
}

.current-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 12px;
  border: 1px solid;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 24px;
}

/* Order Info */
.order-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.info-card i {
  color: #f59e0b;
  font-size: 18px;
}

.info-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.info-value.price {
  color: #fbbf24;
  font-size: 15px;
}

/* Items */
.items-section {
  margin-bottom: 24px;
}

.items-section h3 {
  color: white;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-section h3 i { color: #fbbf24; }

.order-items {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.order-item:last-child {
  border-bottom: none;
}

.item-img {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.15);
  font-size: 18px;
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.item-meta {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  margin-top: 2px;
}

.item-total {
  color: #fbbf24;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}

/* Notes */
.order-notes {
  margin-bottom: 24px;
}

.order-notes h3 {
  color: white;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-notes h3 i { color: #fbbf24; }

.order-notes p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px;
  line-height: 1.6;
}

.order-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
}

.btn-back:hover {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.15);
}

@media (max-width: 480px) {
  .step-dot { width: 40px; height: 40px; font-size: 14px; }
  .order-header h1 { font-size: 1.1rem; }
}
</style>
