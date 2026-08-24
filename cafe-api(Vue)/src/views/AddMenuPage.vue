<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getCategories } from '@/services/categories'
import { createMenuItem } from '@/services/menuItems'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(false)

if (!auth.isAdmin) {
  router.push('/login')
}

const productName = ref('')
const ingredients = ref('')
const mainCategory = ref('')
const productPrice = ref('')
const itemUnavailable = ref(false)
const categories = ref([])
const mainImageFile = ref(null)
const galleryImageFile = ref(null)
const mainImagePreview = ref(null)
const galleryImagePreview = ref(null)
const submitting = ref(false)

const toastMessage = ref('')
const toastType = ref('success')
const toastVisible = ref(false)
let toastTimeout = null

const previewName = computed(() => productName.value || 'نام محصول')
const previewDesc = computed(() => ingredients.value || 'مواد اولیه...')
const previewPrice = computed(() => {
  if (!productPrice.value) return '۱۵۰,۰۰۰'
  return parseInt(productPrice.value).toLocaleString('fa-IR')
})
const previewCategory = computed(() => {
  if (!mainCategory.value) return 'دسته‌بندی'
  const cat = categories.value.find(c => String(c.id) === String(mainCategory.value))
  return cat?.name || 'دسته‌بندی'
})
const previewImageSrc = computed(() => mainImagePreview.value)

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => { toastVisible.value = false }, 3000)
}

function previewMainImage(event) {
  const file = event.target.files[0]
  if (!file) return
  mainImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    mainImagePreview.value = e.target.result
  }
  reader.onerror = () => {
    showToast('خطا در خواندن فایل', 'error')
  }
  reader.readAsDataURL(file)
}

function previewGalleryImage(event) {
  const file = event.target.files[0]
  if (!file) return
  galleryImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    galleryImagePreview.value = e.target.result
  }
  reader.onerror = () => {
    showToast('خطا در خواندن فایل', 'error')
  }
  reader.readAsDataURL(file)
}

async function submitForm() {
  const name = productName.value.trim()
  const price = productPrice.value
  const category = mainCategory.value

  if (!name) {
    showToast('لطفاً نام محصول را وارد کنید', 'error')
    return
  }
  if (!price) {
    showToast('لطفاً قیمت محصول را وارد کنید', 'error')
    return
  }
  if (!category) {
    showToast('لطفاً دسته‌بندی را انتخاب کنید', 'error')
    return
  }

  submitting.value = true

  try {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('price', parseInt(price))
    formData.append('category_id', category)
    formData.append('description', ingredients.value.trim() || '')
    formData.append('is_available', !itemUnavailable.value ? 1 : 0)

    if (mainImageFile.value) {
      formData.append('image', mainImageFile.value)
    }
    if (galleryImageFile.value) {
      formData.append('gallery_image', galleryImageFile.value)
    }

    const result = await createMenuItem(formData)

    if (result.success || result.data) {
      showToast('محصول با موفقیت اضافه شد', 'success')

      productName.value = ''
      ingredients.value = ''
      productPrice.value = ''
      mainCategory.value = ''
      itemUnavailable.value = false
      mainImageFile.value = null
      galleryImageFile.value = null
      mainImagePreview.value = null
      galleryImagePreview.value = null

      setTimeout(() => {
        router.push('/menu-management')
      }, 1500)
    } else {
      const errorMsg = result.message || 'خطا در ذخیره محصول'
      showToast(errorMsg, 'error')
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      'خطا در ارتباط با سرور'
    showToast(typeof errorMessage === 'string' ? errorMessage : 'خطا در ذخیره محصول', 'error')
  } finally {
    submitting.value = false
  }
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    submitForm()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  try {
    const res = await getCategories()
    const data = Array.isArray(res) ? res : res?.data || []
    categories.value = data
  } catch (error) {
    console.error(error)
    showToast('خطا در بارگذاری دسته‌بندی‌ها', 'error')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <AdminSidebar v-model="sidebarOpen" />

  <div class="add-menu-page">
    <header class="header" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="header-content">
        <div class="flex items-center gap-3">
          <router-link to="/dashboard" class="text-white/60 hover:text-white transition-colors">
            <i class="fa-solid fa-arrow-right text-lg"></i>
          </router-link>
          <h1 class="header-title">
            <i class="fa-solid fa-mug-hot"></i>
            افزودن محصول جدید
          </h1>
        </div>
        <button class="btn btn-primary" @click="submitForm" :disabled="submitting">
          <i class="fa-solid fa-paper-plane"></i>
          انتشار محصول
        </button>
      </div>
    </header>

    <main class="main-content" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="form-grid">
        <div class="space-y-16 fade-in-up">
          <div class="form-glass">
            <h2 class="section-title">
              <i class="fa-solid fa-circle-info icon-blue"></i>
              اطلاعات پایه محصول
            </h2>

            <div class="space-y-3">
              <div>
                <label class="form-label" for="productName">
                  نام محصول <span class="required">*</span>
                </label>
                <input type="text" class="form-input" placeholder="مثال: لاته کاراملی" id="productName" v-model="productName">
              </div>

              <div>
                <label class="form-label" for="ingredients">مواد اولیه</label>
                <textarea class="form-textarea" rows="2" placeholder="مثال: اسپرسو, شیر, کارامل" id="ingredients" v-model="ingredients"></textarea>
              </div>

              <div class="form-row">
                <div>
                  <label class="form-label" for="mainCategory">
                    دسته‌بندی <span class="required">*</span>
                  </label>
                  <select class="form-select" id="mainCategory" v-model="mainCategory">
                    <option value="">انتخاب کنید...</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" for="productPrice">
                    قیمت (تومان) <span class="required">*</span>
                  </label>
                  <input type="number" class="form-input" placeholder="150000" id="productPrice" v-model="productPrice">
                </div>
              </div>

              <div class="form-check">
                <input type="checkbox" id="itemUnavailable" style="accent-color: #ef4444; width: 18px; height: 18px;" v-model="itemUnavailable">
                <label for="itemUnavailable" class="form-label" style="margin-bottom: 0;">
                  محصول ناموجود است
                </label>
              </div>
            </div>
          </div>

          <div class="form-glass">
            <h2 class="section-title">
              <i class="fa-solid fa-images icon-green"></i>
              گالری تصاویر
            </h2>

            <div class="form-row">
              <div>
                <label class="form-label" for="mainImage">تصویر اصلی</label>
                <div class="upload-area" @click="$refs.mainImageInput.click()">
                  <input type="file" ref="mainImageInput" class="hidden" accept="image/*" @change="previewMainImage">
                  <div v-if="!mainImagePreview">
                    <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
                    <p class="upload-text">کلیک برای آپلود</p>
                  </div>
                  <div v-else>
                    <img :src="mainImagePreview" class="preview-img" alt="Preview">
                  </div>
                </div>
              </div>
              <div>
                <label class="form-label" for="galleryImages">تصویر دوم (اختیاری)</label>
                <div class="upload-area" @click="$refs.galleryImageInput.click()">
                  <input type="file" ref="galleryImageInput" class="hidden" accept="image/*" @change="previewGalleryImage">
                  <div v-if="!galleryImagePreview">
                    <i class="fa-solid fa-images upload-icon"></i>
                    <p class="upload-text">کلیک برای آپلود</p>
                  </div>
                  <div v-else>
                    <img :src="galleryImagePreview" class="preview-img" alt="Gallery">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-16 fade-in-up">
          <div class="form-glass">
            <h2 class="section-title">
              <i class="fa-solid fa-eye icon-blue"></i>
              پیش‌نمایش
            </h2>
            <div class="preview-card">
              <div class="preview-image">
                <img v-if="previewImageSrc" :src="previewImageSrc" alt="Preview">
                <i v-else class="fa-solid fa-image text-2xl" style="color: rgba(255,255,255,0.15);"></i>
              </div>
              <h4 class="preview-name">{{ previewName }}</h4>
              <p class="preview-desc">{{ previewDesc }}</p>
              <div class="preview-footer">
                <span class="preview-price">{{ previewPrice }} تومان</span>
                <span class="preview-category">{{ previewCategory }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <div class="toast" :class="[toastVisible ? 'show' : '', `toast-${toastType}`]">
      <i :class="`fa-solid fa-${toastType === 'error' ? 'circle-xmark' : toastType === 'info' ? 'circle-info' : 'circle-check'}`"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
* { font-family: 'Vazirmatn', system-ui, sans-serif; }

.add-menu-page {
  background: linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #262626 100%);
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 20px; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up { animation: fadeInUp 0.5s ease-out; }

.form-glass {
  background: rgba(30,30,30,0.6);
  backdrop-filter: blur(20px);
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 20px;
}
@media (min-width: 640px) { .form-glass { padding: 24px; } }

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
.header-title {
  font-size: 17px; font-weight: 700; color: white;
  display: flex; align-items: center; gap: 8px;
}
@media (min-width: 640px) { .header-title { font-size: 20px; } }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: all 0.3s ease; border: none; white-space: nowrap;
}
@media (min-width: 640px) { .btn { padding: 11px 22px; font-size: 14px; border-radius: 12px; } }
.btn-primary { background: #C69C6D; color: white; }
.btn-primary:hover { background: #B28C56; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(198,156,109,0.3); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.main-content {
  max-width: 1200px; margin: 0 auto; padding: 16px; padding-bottom: 80px;
  transition: margin-right 0.3s ease;
}
@media (min-width: 640px) { .main-content { padding: 24px; padding-bottom: 80px; } }
@media (min-width: 1024px) { .main-content { padding: 32px 24px; padding-bottom: 80px; } }

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 768px) {
  .form-grid { grid-template-columns: 1fr 340px; gap: 20px; }
}
@media (min-width: 1024px) {
  .form-grid { grid-template-columns: 1fr 380px; gap: 24px; }
}

.form-label {
  display: block;
  color: rgba(255,255,255,0.85);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}
.form-label .required { color: #f87171; }
.form-input, .form-select, .form-textarea {
  background: rgba(30,30,30,0.6);
  border: 1px solid #333333;
  border-radius: 10px;
  padding: 10px 14px;
  width: 100%;
  color: white;
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
}
@media (min-width: 640px) {
  .form-input, .form-select, .form-textarea { padding: 11px 16px; font-size: 14px; border-radius: 12px; }
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #C69C6D;
  background: rgba(30,30,30,0.8);
  box-shadow: 0 0 0 3px rgba(198,156,109,0.1);
}
.form-input::placeholder { color: rgba(255,255,255,0.35); }
.form-select { appearance: none; cursor: pointer; }
.form-select option { background: #1A1A1A; color: white; }
.form-textarea { resize: vertical; min-height: 80px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 480px) {
  .form-row { grid-template-columns: 1fr 1fr; gap: 16px; }
}

.section-title {
  font-size: 16px; font-weight: 700; color: white;
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
@media (min-width: 640px) { .section-title { font-size: 18px; margin-bottom: 20px; } }
.icon-blue { color: #D4A373; }
.icon-green { color: #D4A373; }

.upload-area {
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.02);
}
.upload-area:hover {
  border-color: #C69C6D;
  background: rgba(198,156,109,0.05);
}
.upload-icon {
  font-size: 26px;
  color: rgba(255,255,255,0.25);
  margin-bottom: 8px;
  display: block;
}
.upload-text {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}
.preview-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.preview-card {
  background: rgba(255,255,255,0.04);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.06);
}
.preview-image {
  width: 100%;
  height: 100px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-name {
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}
.preview-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 10px;
}
.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.preview-price {
  font-size: 15px;
  font-weight: 700;
  color: #C69C6D;
}
.preview-category {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 14px;
  background: rgba(198,156,109,0.15);
  color: #D4A373;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.35s ease;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
@media (min-width: 640px) {
  .toast { right: auto; }
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
.toast-info { background: #C69C6D; }

.space-y-16 > * + * { margin-top: 16px; }
.space-y-3 > * + * { margin-top: 12px; }

.form-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(239,68,68,0.05);
  border: 1px solid rgba(239,68,68,0.15);
  border-radius: 10px;
  transition: all 0.2s ease;
}
.form-check:hover {
  background: rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.25);
}
.form-check input[type="checkbox"] {
  cursor: pointer;
}
</style>
