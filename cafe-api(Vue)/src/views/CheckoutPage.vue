<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import LogoCup from '@/components/LogoCup.vue'

const router = useRouter()
const cart = useCartStore()

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
    showToast(`تعداد: ${item.qty}`)
  }
}

function removeItem(id) {
  const item = cart.items.find((i) => i.id === id)
  cart.removeItem(id)
  showToast(`${item?.name || 'محصول'} حذف شد`, false)
}

function clearCart() {
  if (cart.items.length === 0) {
    showToast('هیچ اقلامی یافت نشد', false)
    return
  }
  cart.clearAll()
  showToast('همه اقلام حذف شدند', false)
}
</script>

<template>
  <BackgroundBlobs />

  <header class="header">
    <div class="header-content">
      <div class="cursor-pointer flex items-center" @click="router.push('/')">
        <LogoCup />
        <span class="brand-text">کافی شاپ</span>
      </div>
      <div class="cart-badge">
        <i class="fas fa-clipboard-list"></i>
        <span class="count" :class="{ show: cart.totalCount > 0 }">{{ cart.totalCount }}</span>
      </div>
    </div>
  </header>

  <main class="main-container">
    <div class="page-title">
      <!-- <h1><i class="fas fa-basket-shopping"></i>سبد خرید شما</h1> -->
      <h1><i class="fas fa-clipboard-list"></i>سفارشات شما</h1>
      <p>محصولات انتخاب شده را مرور کرده و سفارش خود را نهایی کنید</p>
    </div>

    <div class="cart-grid">
      <div class="cart-section">
        <div class="cart-header">
          <h3><i class="fas fa-list-ul"></i>اقلام سفارش ({{ cart.totalCount }})</h3>
          <button class="clear-cart" @click="clearCart"><i class="fas fa-trash-alt"></i> حذف همه</button>
        </div>
        <div class="items-list">
          <!-- Empty state -->
          <div v-if="cart.items.length === 0" class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <h3>هیچ اقلامی یافت نشد</h3>
            <p>هنوز محصولی اضافه نکرده‌اید</p>
            <router-link to="/">مشاهده منو</router-link>
          </div>

          <!-- Cart items -->
          <div
            v-for="(item, idx) in cart.items"
            :key="item.id"
            class="cart-item"
            :style="{ animationDelay: `${idx * 0.05}s` }">
            <div class="cart-item-img">
              <img
                v-if="item.img"
                :src="item.img"
                loading="lazy"
                @error="(e) => (e.target.style.display = 'none')" />
              <i v-else class="fas fa-mug-hot" style="font-size: 24px; color: rgba(255,255,255,0.15)"></i>
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ item.name }}</div>
              <div class="cart-item-price">{{ item.price.toLocaleString('fa-IR') }} تومان</div>
              <div class="cart-item-actions">
                <button class="qty-btn minus" @click="changeQty(item.id, -1)">−</button>
                <span class="qty-value">{{ item.qty }}</span>
                <button class="qty-btn plus" @click="changeQty(item.id, 1)">+</button>
                <button class="remove-item" @click="removeItem(item.id)"><i class="fas fa-trash-alt"></i></button>
              </div>
            </div>
            <div class="cart-item-total">
              <span>{{ (item.price * item.qty).toLocaleString('fa-IR') }} تومان</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-title">
          <i class="fas fa-receipt"></i>
          خلاصه سفارش
        </div>
        <div class="summary-row">
          <span>جمع اقلام</span>
          <span>{{ cart.subtotal.toLocaleString('fa-IR') }} تومان</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-total">
          <span>مبلغ قابل پرداخت</span>
          <span>{{ cart.subtotal.toLocaleString('fa-IR') }} تومان</span>
        </div>
        <!-- <button class="btn-submit" @click="submitOrder">
          <i class="fas fa-check-circle"></i>
          ثبت نهایی سفارش
        </button> -->
        <router-link to="/" class="continue-link">
          <i class="fas fa-arrow-right"></i> ادامه خرید
        </router-link>
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-grid">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <div class="flex items-center justify-center bg-amber-500 w-11 h-11 rounded-2xl">
              <i class="fas fa-mug-hot text-xl text-dark"></i>
            </div>
            <span class="text-xl text-gray-100">کافی شاپ</span>
          </div>
          <p class="text-xm text-white/35">طعم لحظه‌های ناب را با ما تجربه کنید.</p>
          <div class="social-icons">
            <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-telegram"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>
        <div>
          <h4 class="footer-title">دسترسی سریع</h4>
          <router-link to="/" class="footer-link">منوی محصولات</router-link>
          <router-link to="/checkout" class="footer-link">سبد خرید</router-link>
          <a href="#" class="footer-link">تماس با ما</a>
        </div>
        <div>
          <h4 class="footer-title">دسته‌بندی‌ها</h4>
          <router-link to="/" class="footer-link">نوشیدنی گرم</router-link>
          <router-link to="/" class="footer-link">نوشیدنی سرد</router-link>
          <router-link to="/" class="footer-link">دسر و کیک</router-link>
        </div>
        <div>
          <h4 class="footer-title">اطلاعات تماس</h4>
          <p class="text-white/40 text-sm"><i class="fas fa-map-marker-alt ml-2 text-amber-500"></i> تهران، خیابان ولیعصر</p>
          <p class="text-white/40 text-sm mt-3"><i class="fas fa-phone ml-2 text-amber-500"></i> ۰۲۱-۱۲۳۴۵۶۷۸</p>
        </div>
      </div>
      <div class="footer-bottom">
        تمامی حقوق مادی و معنوی این سایت متعلق به کافی شاپ می‌باشد.
      </div>
    </div>
  </footer>

  <!-- Toast -->
  <div class="toast" :class="{ show: toastVisible }">
    <i class="fas" :class="toastSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'" :style="{ marginLeft: '6px', color: toastSuccess ? '#4ade80' : '#f87171' }"></i>
    {{ toastMessage }}
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 7, 5, 0.75);
  backdrop-filter: blur(32px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-text {
  font-weight: 800;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-right: 10px;
}

.cart-badge {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #fbbf24;
  cursor: pointer;
  font-size: 1.1rem;
}

.cart-badge .count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  border-radius: 20px;
  display: none;
  align-items: center;
  justify-content: center;
}

.cart-badge .count.show { display: flex; }

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.page-title { margin-bottom: 28px; }
.page-title h1 { font-size: 1.6rem; font-weight: 800; color: white; }
.page-title h1 i { color: #fbbf24; margin-left: 10px; }
.page-title p { color: rgba(255, 255, 255, 0.4); font-size: 0.85rem; margin-top: 6px; }

.cart-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 992px) {
  .cart-grid { display: grid; grid-template-columns: 1fr 360px; gap: 28px; }
}

.cart-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  overflow: hidden;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cart-header h3 { color: white; font-weight: 700; font-size: 1rem; }
.cart-header h3 i { color: #fbbf24; margin-left: 8px; }

.clear-cart {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.2s;
}

.clear-cart:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.items-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 12px;
}

.items-list::-webkit-scrollbar { width: 4px; }
.items-list::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
.items-list::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 10px; }

.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  transition: all 0.3s;
  animation: itemSlideIn 0.3s ease forwards;
}

.cart-item:last-child { margin-bottom: 0; }

.cart-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(245, 158, 11, 0.2);
  transform: translateX(-3px);
}

.cart-item-img {
  width: 70px;
  height: 70px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
.cart-item-info { flex: 1; }
.cart-item-name { font-weight: 700; color: white; font-size: 0.95rem; }
.cart-item-price { color: #fbbf24; font-weight: 600; font-size: 0.75rem; margin-top: 4px; }

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.qty-btn:hover { background: rgba(255, 255, 255, 0.1); }
.qty-btn.minus:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.qty-btn.plus:hover { background: rgba(34, 197, 94, 0.2); color: #4ade80; }

.qty-value {
  color: white;
  font-weight: 700;
  min-width: 28px;
  text-align: center;
  font-size: 0.9rem;
}

.cart-item-total {
  text-align: left;
  flex-shrink: 0;
  min-width: 90px;
}

.cart-item-total span { color: white; font-weight: 800; font-size: 0.9rem; }

.remove-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 6px;
  transition: color 0.2s;
}

.remove-item:hover { color: #ef4444; }

.summary-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 24px;
  position: sticky;
  top: 90px;
}

.summary-title {
  font-size: 1rem;
  font-weight: 800;
  color: white;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-title i { color: #fbbf24; }

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.summary-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 12px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 14px 0 8px;
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
}

.summary-total span:last-child { color: #fbbf24; font-size: 1.2rem; }

.continue-link {
  display: block;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  margin-top: 16px;
  text-decoration: none;
  transition: color 0.2s;
}

.continue-link:hover { color: #f59e0b; }

.empty-state { text-align: center; padding: 50px 20px; }

.empty-state-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.1);
}

.empty-state h3 { color: white; font-size: 1.1rem; margin-bottom: 6px; }
.empty-state p { color: rgba(255, 255, 255, 0.4); font-size: 0.8rem; }
.empty-state a { display: inline-block; margin-top: 18px; color: #f59e0b; text-decoration: none; }

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(16px);
  padding: 10px 20px;
  border-radius: 40px;
  color: white;
  font-size: 0.8rem;
  z-index: 200;
  transition: transform 0.3s;
  border: 1px solid rgba(245, 158, 11, 0.3);
  white-space: nowrap;
}

.toast.show { transform: translateX(-50%) translateY(0); }

.footer {
  background: rgba(10, 7, 5, 0.6);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 48px;
  padding: 40px 20px 28px;
}

.footer-content { max-width: 1200px; margin: 0 auto; }

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  margin-bottom: 32px;
}

.footer-title { color: rgba(255, 255, 255, 0.8); font-weight: 700; margin-bottom: 16px; font-size: 0.9rem; }

.footer-link {
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  font-size: 0.8rem;
  display: block;
  margin-bottom: 10px;
  transition: color 0.2s;
}

.footer-link:hover { color: #f59e0b; }

.social-icons { display: flex; gap: 10px; margin-top: 16px; }

.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: all 0.2s;
}

.social-icon:hover { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.footer-bottom {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.7rem;
}

@keyframes itemSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 768px) {
  .header-content { padding: 10px 16px; }
  .main-container { padding: 16px; }
  .cart-item { flex-wrap: wrap; gap: 12px; }
  .cart-item-img { width: 55px; height: 55px; }
  .cart-item-total { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
  .remove-item { margin-top: 0; }
  .items-list { max-height: 400px; }
  .toast { white-space: normal; text-align: center; max-width: 90%; font-size: 0.7rem; }
}
</style>
