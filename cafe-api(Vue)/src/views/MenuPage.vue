<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { getMenuItems } from '@/services/menuItems'
import { getCategories } from '@/services/categories'
import { getImageUrl } from '@/services/api'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import LogoCup from '@/components/LogoCup.vue'

const router = useRouter()
const cart = useCartStore()

const products = ref([])
const categories = ref([])
const currentFilter = ref('all')
const searchQuery = ref('')
const loading = ref(true)
const error = ref(false)
const addedItemId = ref(null)

const CAT_ICONS = ['fa-mug-hot', 'fa-glass-martini-alt', 'fa-birthday-cake', 'fa-cookie', 'fa-ice-cream', 'fa-coffee', 'fa-candy-cane']

const categoryIconMap = computed(() => {
  const map = new Map()
  categories.value.forEach((cat, idx) => {
    map.set(cat.id, CAT_ICONS[idx % CAT_ICONS.length])
  })
  return map
})

const filteredProducts = computed(() => {
  let list = products.value
  if (currentFilter.value !== 'all') {
    list = list.filter((p) => String(p.catId) === String(currentFilter.value))
  }
  if (searchQuery.value) {
    const q = normalizePersian(searchQuery.value)
    list = list.filter(
      (p) =>
        normalizePersian(p.name).includes(q) ||
        normalizePersian(p.desc).includes(q),
    )
  }
  return list
})

function normalizePersian(str) {
  return str.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه')
}

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString('fa-IR')
}

function handleFilter(catId) {
  currentFilter.value = catId
  searchQuery.value = ''
}

function addToCart(product) {
  cart.addItem(product)
  addedItemId.value = product.id
  setTimeout(() => { addedItemId.value = null }, 1200)
}

onMounted(async () => {
  try {
    const [menuRes, catRes] = await Promise.all([getMenuItems(), getCategories()])

    const rawCategories = Array.isArray(catRes) ? catRes : catRes?.data || []
    const uniqueMap = new Map()
    rawCategories.forEach((cat) => {
      if (!uniqueMap.has(cat.name)) uniqueMap.set(cat.name, cat)
    })
    categories.value = Array.from(uniqueMap.values()).sort(
      (a, b) => (a.display_order ?? Infinity) - (b.display_order ?? Infinity),
    )

    const rawProducts = Array.isArray(menuRes) ? menuRes : menuRes?.data || []
    products.value = rawProducts
      .filter((item) => item.is_available)
      .map((item) => {
        const catId = String(item.category_id || item.categoryId || item.cat_id || '')
        const category = categories.value.find((c) => String(c.id) === catId)
        return {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          catId,
          catName: category?.name || 'بدون دسته',
          desc: item.description || 'بدون توضیحات',
          img: item.image_url || '',
        }
      })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <BackgroundBlobs />

  <header class="header">
    <div class="header-content">
      <div class="header-row-top">
        <div class="flex items-center gap-2">
          <a href="#" class="logo-link" @click.prevent>
            <LogoCup />
          </a>
          <span class="brand-text">کافی شاپ</span>
        </div>
        <div class="header-right">
          <button class="cart-btn-wrap" @click="router.push('/checkout')">
            <i class="fas fa-clipboard-list"></i>
            <span class="c-count" :class="{ show: cart.totalCount > 0 }">{{ cart.totalCount }}</span>
          </button>
        </div>
      </div>

      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-box"
          placeholder="جستجو در منو..."
          aria-label="جستجو در منو" />
      </div>
    </div>
  </header>

  <main class="main-container">
    <!-- Filter pills -->
    <div class="filter-pills">
      <button class="filter-pill" :class="{ active: currentFilter === 'all' }" @click="handleFilter('all')">
        <i class="fas fa-utensils"></i> همه <span class="pill-count">{{ products.length }}</span>
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="filter-pill"
        :class="{ active: currentFilter === String(cat.id) }"
        @click="handleFilter(String(cat.id))">
        <i class="fas" :class="categoryIconMap.get(cat.id) || 'fa-tag'"></i>
        {{ cat.name }}
        <span class="pill-count">{{ products.filter((p) => String(p.catId) === String(cat.id)).length }}</span>
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="menu-grid">
      <div v-for="i in 6" :key="i" class="menu-card">
        <div class="skeleton" style="aspect-ratio: 1/1"></div>
        <div class="menu-card-body">
          <div class="skeleton h-4 w-3/4 mb-2"></div>
          <div class="skeleton h-3 w-full mb-1"></div>
          <div class="skeleton h-3 w-2/3"></div>
        </div>
        <div class="menu-card-footer">
          <div class="skeleton h-5 w-20"></div>
          <div class="skeleton h-8 w-16"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="empty-state">
      <i class="fas fa-exclamation-triangle empty-state-icon"></i>
      <h3>خطا در ارتباط با سرور</h3>
      <p>لطفاً بعداً مجدد تلاش کنید</p>
    </div>

    <!-- No results -->
    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <i class="fas fa-search empty-state-icon"></i>
      <h3>محصولی پیدا نشد!</h3>
      <p>هیچ محصولی با این جستجو یا دسته‌بندی یافت نشد</p>
    </div>

    <!-- Product grid -->
    <div v-else class="menu-grid">
      <div
        v-for="(product, idx) in filteredProducts"
        :key="product.id"
        class="menu-card product-card visible"
        :style="{ transitionDelay: `${idx * 70}ms` }">
        <img
          :src="product.img || 'https://api.shayaniranpor.ir/images/menu-items/default.jpg'"
          :alt="product.name"
          class="menu-card-image"
          loading="lazy"
          @error="(e) => (e.target.style.display = 'none')" />
        <div class="menu-card-overlay">
          <span class="menu-card-category">
            <i class="fas" :class="categoryIconMap.get(product.catId) || 'fa-tag'"></i>
            {{ product.catName }}
          </span>
        </div>
        <div class="menu-card-body">
          <h3 class="menu-card-title">{{ product.name }}</h3>
          <p class="menu-card-desc">{{ product.desc }}</p>
        </div>
        <div class="menu-card-footer">
          <span class="menu-card-price">{{ formatPrice(product.price) }} تومان</span>
          <button
            class="btn-cart"
            :class="{ added: addedItemId === product.id }"
            @click="addToCart(product)">
            <i class="fas" :class="addedItemId === product.id ? 'fa-check' : 'fa-plus'"></i>
            {{ addedItemId === product.id ? 'اضافه شد' : 'افزودن' }}
          </button>
        </div>
      </div>
    </div>
  </main>

  <footer class="footer-glass">
    <div class="footer-content">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-stone-900 shadow-lg shadow-amber-500/20">
              <i class="fas fa-mug-hot"></i>
            </div>
            <span class="font-bold text-lg bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">کافی شاپ</span>
          </div>
          <p class="text-white/40 text-sm leading-relaxed">
            طعم لحظه‌های ناب را با ما تجربه کنید. تازه‌ترین نوشیدنی‌های گرم و
            سرد، دسرهای خانگی و فضایی دلنشین برای لحظات شما.
          </p>
          <div class="flex items-center gap-2 mt-5">
            <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-telegram-plane"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-whatsapp"></i></a>
            <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        <div>
          <h4 class="footer-title">دسترسی سریع</h4>
          <ul class="space-y-2">
            <li><a href="#" class="footer-link">صفحه اصلی</a></li>
            <li><router-link to="/" class="footer-link">منوی محصولات</router-link></li>
            <li><router-link to="/checkout" class="footer-link">سبد خرید</router-link></li>
            <!-- <li><a href="#" class="footer-link">تماس با ما</a></li> -->
          </ul>
        </div>
        <div>
          <h4 class="footer-title">دسته‌بندی‌ها</h4>
          <ul class="space-y-2">
            <li v-for="cat in categories" :key="cat.id">
              <a href="#" class="footer-link" @click.prevent="handleFilter(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' })">
                <i class="fas" :class="categoryIconMap.get(cat.id) || 'fa-tag'" style="color: rgba(255,255,255,0.2); margin-left: 8px"></i>
                {{ cat.name }}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="footer-title">اطلاعات تماس</h4>
          <ul class="space-y-3">
            <li class="flex items-start gap-3 text-white/50 text-sm">
              <i class="fas fa-map-marker-alt text-amber-400 mt-0.5"></i>
              <span>تهران، خیابان ولیعصر، جنب پارک ملت</span>
            </li>
            <li class="flex items-center gap-3 text-white/50 text-sm">
              <i class="fas fa-phone text-amber-400 mt-2"></i>
              <span dir="ltr">۰۲۱-۱۲۳۴۵۶۷۸</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="footer-divider"></div>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
        <p class="text-white/30 text-xs sm:text-sm">
          تمامی حقوق مادی و معنوی این سایت متعلق به
          <span class="text-amber-400/60">کافی شاپ</span> می‌باشد.
        </p>
      </div>
    </div>
  </footer>
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

.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px;
}

@media (min-width: 640px) { .main-container { padding: 16px 20px; } }
@media (min-width: 1024px) { .main-container { padding: 20px 24px; } }

.filter-pills {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding: 4px 0;
  margin-bottom: 20px;
}

.filter-pills::-webkit-scrollbar { display: none; }

.filter-pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  min-height: 44px;
}

.filter-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.filter-pill.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1a0e0a;
  border-color: transparent;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
}

.pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
}

.filter-pill.active .pill-count {
  background: rgba(26, 14, 10, 0.2);
  color: #1a0e0a;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

@media (min-width: 640px) { .menu-grid { gap: 12px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
@media (min-width: 768px) { .menu-grid { gap: 17px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
@media (min-width: 1024px) { .menu-grid { gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); } }

.menu-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(245, 158, 11, 0.2);
}

.product-card {
  opacity: 0;
  transform: translateY(40px) scale(0.95);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.menu-card-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

@media (min-width: 1024px) { .menu-card-image { aspect-ratio: 4 / 3; } }

.menu-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 60%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
}

.menu-card-category {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  align-self: flex-start;
  display: inline-block;
}

.menu-card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
}

.menu-card-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-card-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.menu-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.menu-card-price {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
  white-space: nowrap;
}

.btn-cart {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 6px 10px;
  color: white;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-cart:hover, .btn-cart.added {
  background: #f59e0b;
  color: #1a0e0a;
  border-color: #f59e0b;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
}

.empty-state-icon {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

.empty-state h3 { color: white; font-size: 17px; margin-bottom: 6px; }
.empty-state p { color: rgba(255, 255, 255, 0.4); font-size: 13px; margin-bottom: 16px; }

.skeleton {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.footer-glass {
  background: rgba(15, 10, 8, 0.6);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 32px;
}

@media (min-width: 640px) { .footer-glass { margin-top: 48px; } }

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 16px;
}

@media (min-width: 640px) { .footer-content { padding: 48px 20px; } }
@media (min-width: 1024px) { .footer-content { padding: 48px 24px; } }

.footer-link {
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
  font-size: 0.875rem;
  text-decoration: none;
}

.footer-link:hover { color: #f59e0b; }

.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  text-decoration: none;
}

.social-icon:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  transform: translateY(-2px);
}

.footer-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 24px 0;
}

.footer-title {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 12px;
}

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
