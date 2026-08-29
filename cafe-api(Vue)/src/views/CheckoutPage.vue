<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { createOrder } from '@/services/orders'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import MenuHeader from '@/components/MenuHeader.vue'
import MenuFooter from '@/components/MenuFooter.vue'
import OtpLoginModal from '@/components/OtpLoginModal.vue'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const showOtpModal = ref(false)
const isDineIn = ref(true)
const tableNumber = ref('')
const address = ref('')
const notes = ref('')
const paymentMethod = ref('cash')
const submitting = ref(false)

const toastMessage = ref('')
const toastVisible = ref(false)
const toastSuccess = ref(true)

function showToast(msg, success = true) {
  toastMessage.value = msg
  toastSuccess.value = success
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 2500)
}

function changeQty(id, delta) {
  const item = cart.items.find((i) => i.id === id)
  if (!item) return
  if (item.qty + delta <= 0) {
    cart.removeItem(id)
    showToast('محصول حذف شد', false)
  } else {
    cart.changeQty(id, delta)
  }
}

function removeItem(id) {
  const item = cart.items.find((i) => i.id === id)
  cart.removeItem(id)
  showToast(`${item?.name || 'محصول'} حذف شد`, false)
}

function clearCart() {
  if (cart.items.length === 0) return
  cart.clearAll()
  showToast('همه اقلام حذف شدند', false)
}

async function handlePurchase() {
  if (!auth.isLoggedIn) {
    showOtpModal.value = true
    return
  }

  if (cart.items.length === 0) {
    showToast('سبد خرید خالی است', false)
    return
  }

  if (!isDineIn.value && !address.value.trim()) {
    showToast('آدرس تحویل را وارد کنید', false)
    return
  }

  if (isDineIn.value && !tableNumber.value.trim()) {
    showToast('شماره میز را وارد کنید', false)
    return
  }

  submitting.value = true
  try {
    const orderData = {
      is_out: !isDineIn.value,
      table_number: isDineIn.value ? tableNumber.value.trim() : null,
      address: !isDineIn.value ? address.value.trim() : null,
      notes: notes.value.trim() || null,
      payment_method: paymentMethod.value,
      items: cart.items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.qty || 1,
      })),
    }

    await createOrder(orderData)

    cart.clearAll()
    showToast('سفارش با موفقیت ثبت شد!')
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.errors?.items?.[0] || 'خطا در ثبت سفارش'
    showToast(msg, false)
  } finally {
    submitting.value = false
  }
}

function handleOtpSuccess() {
  showOtpModal.value = false
  showToast('ورود موفقیت‌آمیز بود! سفارش خود را ثبت کنید.')
}
</script>

<template>
  <BackgroundBlobs />
  <MenuHeader />

  <main class="main-container">
    <div class="page-title">
      <h1><i class="fas fa-clipboard-list"></i> نهایی کردن سفارش</h1>
      <p>اقلام خود را مرور کرده و سفارش را ثبت کنید</p>
    </div>

    <div v-if="cart.items.length === 0" class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-shopping-cart"></i></div>
      <h3>سبد خرید شما خالی است</h3>
      <p>محصولی اضافه نکرده‌اید</p>
      <router-link to="/" class="link-gold">مشاهده منو</router-link>
    </div>

    <div v-else class="checkout-grid">
      <!-- Items Section -->
      <div class="cart-section">
        <div class="section-header">
          <h3><i class="fas fa-list-ul"></i> اقلام سفارش ({{ cart.totalCount }})</h3>
          <button class="clear-btn" @click="clearCart"><i class="fas fa-trash-alt"></i> حذف همه</button>
        </div>

        <div class="items-list">
          <div
            v-for="(item, idx) in cart.items"
            :key="item.id"
            class="cart-item"
            :style="{ animationDelay: `${idx * 0.05}s` }">
            <div class="cart-item-img">
              <img v-if="item.img" :src="item.img" loading="lazy" @error="(e) => (e.target.style.display = 'none')" />
              <i v-else class="fas fa-mug-hot"></i>
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.name }}</div>
              <div class="cart-item-price">{{ item.price.toLocaleString('fa-IR') }} تومان</div>
              <div class="cart-item-actions">
                <button class="qty-btn minus" @click="changeQty(item.id, -1)">−</button>
                <span class="qty-value">{{ item.qty }}</span>
                <button class="qty-btn plus" @click="changeQty(item.id, 1)">+</button>
                <button class="remove-btn" @click="removeItem(item.id)"><i class="fas fa-trash-alt"></i></button>
              </div>
            </div>
            <div class="cart-item-total">
              <span>{{ (item.price * item.qty).toLocaleString('fa-IR') }} تومان</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Details Section -->
      <div class="details-column">
        <!-- Order Type -->
        <div class="detail-card">
          <h3 class="detail-title"><i class="fas fa-store"></i> نوع سفارش</h3>
          <div class="type-toggle">
            <button class="type-btn" :class="{ active: isDineIn }" @click="isDineIn = true">
              <i class="fas fa-chair"></i>
              <span>میز</span>
            </button>
            <button class="type-btn" :class="{ active: !isDineIn }" @click="isDineIn = false">
              <i class="fas fa-motorcycle"></i>
              <span>بیرون‌بر</span>
            </button>
          </div>

          <div v-if="isDineIn" class="form-group">
            <label>شماره میز</label>
            <input v-model="tableNumber" type="text" placeholder="مثال: ۳" class="form-input" />
          </div>

          <div v-else class="form-group">
            <label>آدرس تحویل</label>
            <textarea v-model="address" placeholder="آدرس کامل..." class="form-textarea" rows="2"></textarea>
          </div>

          <div class="form-group">
            <label>یادداشت (اختیاری)</label>
            <input v-model="notes" type="text" placeholder="مثلاً: بدون پیاز، اضافه سس..." class="form-input" />
          </div>
        </div>

        <!-- Payment Method -->
        <div class="detail-card">
          <h3 class="detail-title"><i class="fas fa-wallet"></i> روش پرداخت</h3>
          <div class="payment-options">
            <label class="payment-option" :class="{ active: paymentMethod === 'cash' }">
              <input type="radio" v-model="paymentMethod" value="cash" />
              <div class="payment-icon"><i class="fas fa-money-bill-wave"></i></div>
              <div class="payment-info">
                <span class="payment-name">نقدی</span>
                <span class="payment-desc">پرداخت در محل</span>
              </div>
            </label>
            <label class="payment-option" :class="{ active: paymentMethod === 'online' }">
              <input type="radio" v-model="paymentMethod" value="online" />
              <div class="payment-icon"><i class="fas fa-credit-card"></i></div>
              <div class="payment-info">
                <span class="payment-name">آنلاین</span>
                <span class="payment-desc">درگاه زرین‌پال</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-card">
          <div class="summary-row">
            <span>جمع اقلام</span>
            <span>{{ cart.subtotal.toLocaleString('fa-IR') }} تومان</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-total">
            <span>مبلغ قابل پرداخت</span>
            <span class="total-price">{{ cart.subtotal.toLocaleString('fa-IR') }} تومان</span>
          </div>

          <button
            class="purchase-btn"
            :disabled="submitting"
            @click="handlePurchase">
            <span v-if="!submitting">
              <i class="fas" :class="!auth.isLoggedIn ? 'fa-right-to-bracket' : 'fa-check'"></i>
              {{ !auth.isLoggedIn ? 'ورود و ثبت سفارش' : 'ثبت سفارش' }}
            </span>
            <span v-else><i class="fas fa-spinner fa-spin"></i> در حال ثبت...</span>
          </button>

          <router-link to="/" class="continue-link">
            <i class="fas fa-arrow-right"></i> ادامه خرید
          </router-link>
        </div>
      </div>
    </div>
  </main>

  <MenuFooter :showCategories="false" />

  <!-- OTP Login Modal -->
  <OtpLoginModal v-if="showOtpModal" @close="showOtpModal = false" @success="handleOtpSuccess" />

  <!-- Toast -->
  <div class="toast" :class="{ show: toastVisible }">
    <i class="fas" :class="toastSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'" :style="{ color: toastSuccess ? '#4ade80' : '#f87171' }"></i>
    {{ toastMessage }}
  </div>
</template>

<style scoped>
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.page-title { margin-bottom: 28px; }
.page-title h1 { font-size: 1.6rem; font-weight: 800; color: white; }
.page-title h1 i { color: #fbbf24; margin-left: 10px; }
.page-title p { color: rgba(255, 255, 255, 0.4); font-size: 0.85rem; margin-top: 6px; }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-state-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.04); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 2rem; color: rgba(255,255,255,0.1); }
.empty-state h3 { color: white; font-size: 1.1rem; margin-bottom: 6px; }
.empty-state p { color: rgba(255,255,255,0.4); font-size: 0.8rem; }
.link-gold { display: inline-block; margin-top: 18px; color: #f59e0b; text-decoration: none; font-weight: 600; }

.checkout-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 992px) {
  .checkout-grid { display: grid; grid-template-columns: 1fr 400px; gap: 28px; }
}

.cart-section {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  overflow: hidden;
}

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.section-header h3 { color: white; font-weight: 700; font-size: 1rem; }
.section-header h3 i { color: #fbbf24; margin-left: 8px; }

.clear-btn {
  background: none; border: none; color: rgba(255,255,255,0.35);
  font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px; transition: all 0.2s;
}
.clear-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

.items-list { max-height: 500px; overflow-y: auto; padding: 12px; }
.items-list::-webkit-scrollbar { width: 4px; }
.items-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
.items-list::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 10px; }

.cart-item {
  display: flex; align-items: center; gap: 16px; padding: 14px;
  margin-bottom: 10px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
  transition: all 0.3s; animation: itemSlideIn 0.3s ease forwards;
}
.cart-item:last-child { margin-bottom: 0; }
@media (hover: hover) { .cart-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(245,158,11,0.2); } }

.cart-item-img { width: 60px; height: 60px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; color: rgba(255,255,255,0.15); font-size: 20px; }
.cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
.cart-item-info { flex: 1; }
.cart-item-name { font-weight: 700; color: white; font-size: 0.9rem; }
.cart-item-price { color: #fbbf24; font-weight: 600; font-size: 0.72rem; margin-top: 3px; }

.cart-item-actions { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.qty-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
.qty-btn:hover { background: rgba(255,255,255,0.1); }
.qty-btn.minus:hover { background: rgba(239,68,68,0.2); color: #f87171; }
.qty-btn.plus:hover { background: rgba(34,197,94,0.2); color: #4ade80; }
.qty-value { color: white; font-weight: 700; min-width: 24px; text-align: center; font-size: 0.85rem; }
.remove-btn { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 0.8rem; transition: color 0.2s; }
.remove-btn:hover { color: #ef4444; }

.cart-item-total { text-align: left; flex-shrink: 0; }
.cart-item-total span { color: white; font-weight: 800; font-size: 0.85rem; }

.details-column {
  display: flex; flex-direction: column; gap: 16px;
}

.detail-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 20px;
}

.detail-title {
  color: white; font-size: 0.95rem; font-weight: 700; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.detail-title i { color: #fbbf24; }

.type-toggle {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;
}

.type-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border-radius: 12px;
  background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
  font-size: 0.85rem; font-weight: 600;
}
.type-btn i { font-size: 1.1rem; }
.type-btn:hover { background: rgba(255,255,255,0.08); color: white; }
.type-btn.active {
  background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4);
  color: #fbbf24;
}

.form-group { margin-bottom: 0; }
.form-group label { display: block; color: rgba(255,255,255,0.6); font-size: 0.8rem; font-weight: 500; margin-bottom: 6px; }
.form-input, .form-textarea {
  width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
  color: white; font-size: 0.85rem; outline: none; transition: all 0.2s;
  font-family: inherit; resize: none;
}
.form-input:focus, .form-textarea:focus { border-color: rgba(245,158,11,0.4); background: rgba(255,255,255,0.08); }
.form-input::placeholder, .form-textarea::placeholder { color: rgba(255,255,255,0.2); }

.payment-options {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.payment-option {
  display: flex; align-items: center; gap: 10px;
  padding: 14px; border-radius: 12px;
  background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.08);
  cursor: pointer; transition: all 0.2s;
}
.payment-option input { display: none; }
.payment-option:hover { background: rgba(255,255,255,0.08); }
.payment-option.active {
  background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4);
}

.payment-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 16px; flex-shrink: 0; }
.payment-option.active .payment-icon { background: rgba(245,158,11,0.15); color: #fbbf24; }

.payment-name { display: block; color: white; font-weight: 600; font-size: 0.85rem; }
.payment-desc { display: block; color: rgba(255,255,255,0.3); font-size: 0.7rem; }

.summary-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 20px;
}

.summary-row { display: flex; justify-content: space-between; padding: 8px 0; color: rgba(255,255,255,0.5); font-size: 0.85rem; }
.summary-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 10px 0; }
.summary-total { display: flex; justify-content: space-between; padding: 10px 0 6px; color: white; font-weight: 800; font-size: 1.05rem; }
.total-price { color: #fbbf24; font-size: 1.15rem; }

.purchase-btn {
  width: 100%; margin-top: 16px; padding: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none; border-radius: 12px; color: #1a0e0a;
  font-weight: 800; font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s; box-shadow: 0 4px 20px rgba(245,158,11,0.25);
  min-height: 50px;
}
.purchase-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(245,158,11,0.35); }
.purchase-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.continue-link {
  display: block; text-align: center; color: rgba(255,255,255,0.35);
  font-size: 0.75rem; margin-top: 14px; text-decoration: none; transition: color 0.2s;
}
.continue-link:hover { color: #f59e0b; }

.toast {
  position: fixed; bottom: 30px; left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(0,0,0,0.9); backdrop-filter: blur(16px);
  padding: 10px 20px; border-radius: 40px; color: white;
  font-size: 0.8rem; z-index: 200; transition: transform 0.3s;
  border: 1px solid rgba(245,158,11,0.3); white-space: nowrap;
  display: flex; align-items: center; gap: 8px;
}
.toast.show { transform: translateX(-50%) translateY(0); }

@keyframes itemSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 768px) {
  .cart-item { flex-wrap: wrap; gap: 12px; }
  .cart-item-img { width: 50px; height: 50px; }
  .cart-item-total { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); }
}
</style>
