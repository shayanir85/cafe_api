<script setup>
import { nextTick } from 'vue'

defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  categoryIconMap: {
    type: Map,
    default: () => new Map()
  },
  showCategories: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['filter'])

function handleFilter(catId) {
  emit('filter', catId)
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}
</script>

<template>
  <footer class="footer">
    <div class="container">
      <!-- ستون‌های فوتر با چیدمان ساده -->
      <div class="footer-grid">
        
        <!-- ستون 1: درباره ما -->
        <div class="footer-col">
          <div class="brand">
            <div class="brand-icon">
              <i class="fas fa-mug-hot"></i>
            </div>
            <span class="brand-name">کافی شاپ</span>
          </div>
          <p class="description">
            طعم لحظه‌های ناب را با ما تجربه کنید. تازه‌ترین نوشیدنی‌های گرم و سرد، دسرهای خانگی و فضایی دلنشین برای لحظات شما.
          </p>
          <div class="social-links">
            <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-link"><i class="fab fa-telegram-plane"></i></a>
            <a href="#" class="social-link"><i class="fab fa-whatsapp"></i></a>
            <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
          </div>
        </div>

        <!-- ستون 2: دسترسی سریع -->
        <div class="footer-col">
          <h4 class="footer-title">دسترسی سریع</h4>
          <ul class="footer-links">
            <li><router-link to="/" class="footer-link">منوی محصولات</router-link></li>
            <li><router-link to="/checkout" class="footer-link">سبد خرید</router-link></li>
          </ul>
        </div>

        <!-- ستون 3: دسته‌بندی‌ها -->
        <div v-if="showCategories && categories.length > 0" class="footer-col">
          <h4 class="footer-title">دسته‌بندی‌ها</h4>
          <ul class="footer-links">
            <li v-for="cat in categories" :key="cat.id">
              <a href="#" class="footer-link" @click.prevent="handleFilter(cat.id)">
                <i class="fas" :class="categoryIconMap.get(cat.id) || 'fa-tag'"></i>
                {{ cat.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- ستون 4: اطلاعات تماس -->
        <div class="footer-col">
          <h4 class="footer-title">اطلاعات تماس</h4>
          <ul class="contact-info">
            <li>
              <i class="fas fa-map-marker-alt"></i>
              <span>تهران، خیابان ولیعصر، جنب پارک ملت</span>
            </li>
            <li>
              <i class="fas fa-phone-alt"></i>
              <span dir="ltr">۰۲۱-۱۲۳۴۵۶۷۸</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- خط جداکننده -->
      <div class="divider"></div>

      <!-- کپی‌رایت -->
      <div class="copyright">
        <p>
          تمامی حقوق مادی و معنوی این سایت متعلق به
          <span class="highlight">کافی شاپ</span> می‌باشد.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* استایل اصلی فوتر */
.footer {
  background: rgba(15, 10, 8, 0.6);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 32px;
  padding: 32px 0;
  width: 100%;
}

@media (min-width: 640px) {
  .footer {
    margin-top: 48px;
    padding: 48px 0;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* گرید فوتر - ساده و بدون مشکل */
.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.footer-col {
  display: flex;
  flex-direction: column;
}

/* برند */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom right, #f59e0b, #d97706);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1c1917;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.brand-name {
  font-weight: bold;
  font-size: 1.125rem;
  background: linear-gradient(to right, #fcd34d, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* توضیحات */
.description {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
  line-height: 1.7;
  margin-bottom: 1.25rem;
}

/* شبکه اجتماعی */
.social-links {
  display: flex;
  gap: 0.5rem;
}

.social-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  text-decoration: none;
}

.social-link:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  transform: translateY(-2px);
}

/* عناوین */
.footer-title {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

/* لیست لینک‌ها */
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-links li {
  margin: 0;
}

.footer-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-link:hover {
  color: #f59e0b;
}

.footer-link i {
  color: rgba(255, 255, 255, 0.2);
  width: 16px;
}

/* اطلاعات تماس */
.contact-info {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-info li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.contact-info li i {
  color: #f59e0b;
  margin-top: 0.125rem;
  width: 16px;
}

/* خط جداکننده */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 1.5rem 0;
}

/* کپی‌رایت */
.copyright {
  text-align: center;
}

.copyright p {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.75rem;
  margin: 0;
}

@media (min-width: 640px) {
  .copyright p {
    font-size: 0.875rem;
  }
}

.highlight {
  color: rgba(245, 158, 11, 0.6);
}
</style>