<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import LogoCup from '@/components/LogoCup.vue'
import OtpLoginModal from '@/components/OtpLoginModal.vue'

defineProps({
  showSearch: { type: Boolean, default: false },
  searchValue: { type: String, default: '' },
})

const emit = defineEmits(['update:searchValue'])

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const showOtpModal = ref(false)
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="header-row-top">
        <div class="flex items-center gap-2">
          <a href="#" class="logo-link" @click.prevent="router.push('/')">
            <LogoCup />
          </a>
          <span class="brand-text">کافی شاپ</span>
        </div>
        <div class="header-right">
          <button v-if="!auth.isLoggedIn" class="login-btn" @click="showOtpModal = true">
            <i class="fas fa-right-to-bracket"></i>
            <span class="login-text">ورود</span>
          </button>
          <button class="cart-btn-wrap" @click="router.push('/checkout')">
            <i class="fas fa-clipboard-list"></i>
            <span class="c-count" :class="{ show: cart.totalCount > 0 }">{{ cart.totalCount }}</span>
          </button>
        </div>
      </div>

      <div v-if="showSearch" class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          :value="searchValue"
          @input="emit('update:searchValue', $event.target.value)"
          type="text"
          class="search-box"
          placeholder="جستجو در منو..."
          aria-label="جستجو در منو" />
      </div>
    </div>
  </header>

  <OtpLoginModal v-if="showOtpModal" @close="showOtpModal = false" @success="showOtpModal = false" />
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(15, 10, 8, 0.55);
  backdrop-filter: blur(28px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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

.header-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.brand-text {
  font-weight: 800;
  font-size: 1.05rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

@media (max-width: 639px) {
  .brand-text { display: none; }
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 160px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  pointer-events: none;
}

.search-box {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 8px 35px 8px 12px;
  color: white;
  font-size: 12px;
  outline: none;
}

@media (min-width: 640px) {
  .search-box { padding: 10px 40px 10px 16px; font-size: 14px; }
}

.search-box:focus {
  border-color: #f59e0b;
  background: rgba(255, 255, 255, 0.1);
}

.cart-btn-wrap {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 11px;
  color: rgba(245, 158, 11, 0.75);
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  font-size: 0.95rem;
}

@media (min-width: 640px) {
  .cart-btn-wrap { width: 42px; height: 42px; border-radius: 12px; font-size: 1.05rem; }
}

.cart-btn-wrap:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(245, 158, 11, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
}

.login-text {
  display: none;
}

@media (min-width: 400px) {
  .login-text { display: inline; }
}

.c-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, #ef4444, #e11d48);
  color: white;
  font-size: 0.625rem;
  font-weight: 800;
  border-radius: 999px;
  display: none;
  align-items: center;
  justify-content: center;
}

@media (min-width: 640px) {
  .c-count { min-width: 20px; height: 20px; font-size: 0.6875rem; }
}

.c-count.show { display: flex; }

@media (max-width: 767px) {
  .header-content { flex-direction: column; align-items: stretch; }
  .header-row-top { width: 100%; }
  .search-wrapper { width: 100%; }
}

@media (min-width: 768px) {
  .header-content { flex-direction: row; align-items: center; }
  .header-row-top { width: auto; flex-shrink: 0; }
  .search-wrapper { width: auto; flex: 1; }
}
</style>
