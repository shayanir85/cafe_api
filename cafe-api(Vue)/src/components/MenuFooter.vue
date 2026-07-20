<script setup>
defineProps({
  categories: { type: Array, default: () => [] },
  categoryIconMap: { type: Map, default: () => new Map() },
})

const emit = defineEmits(['filter'])

function handleFilter(catId) {
  emit('filter', catId)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
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
          </ul>
        </div>
        <div>
          <h4 class="footer-title">دسته‌بندی‌ها</h4>
          <ul class="space-y-2">
            <li v-for="cat in categories" :key="cat.id">
              <a href="#" class="footer-link" @click.prevent="handleFilter(cat.id)">
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
</style>
