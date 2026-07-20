<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { getMenuItems } from '@/services/menuItems'
import { getCategories } from '@/services/categories'
import { getImageUrl } from '@/services/api'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import MenuHeader from '@/components/MenuHeader.vue'
import MenuFooter from '@/components/MenuFooter.vue'

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

  <MenuHeader v-model:searchValue="searchQuery" :showSearch="true" />

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
          :src="product.img || getImageUrl('images/menu-items/default.jpg')"
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

  <MenuFooter
    :categories="categories"
    :categoryIconMap="categoryIconMap"
    @filter="handleFilter" />
</template>

<style scoped>
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

</style>
