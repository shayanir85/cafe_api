<script setup>
// ============ صفحه مدیریت منو ============
// بررسی دسترسی ادمین، بارگذاری آیتم‌ها و دسته‌بندی‌ها، تب دسته‌بندی، جستجو/فیلتر/مرتب‌سازی
// مودال ویرایش با آپلود تصویر، مودال حذف، مودال مدیریت دسته‌بندی، تغییر وضعیت موجودی

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getMenuItems, updateMenuItem, deleteMenuItem } from '@/services/menuItems'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories'
import { getImageUrl } from '@/services/api'
import { useToast } from '@/composables/useToast'
import AdminFooter from '@/components/AdminFooter.vue'

const router = useRouter()
const auth = useAuthStore()

if (!auth.isAdmin) {
  router.push('/login')
}

// ============ وضعیت‌ها ============
const menuItems = ref([])
const categories = ref([])
const currentCategory = ref('all')
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const sortBy = ref('newest')
let searchTimeout = null

// ============ مودال‌ها ============
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showCategoriesModal = ref(false)
const showCategoryFormModal = ref(false)

// ============ فرم ویرایش ============
const editForm = ref({
  id: null,
  name: '',
  price: '',
  category_id: '',
  description: '',
  is_available: true,
  image: null,
  image_url: ''
})
const imageFileToUpload = ref(null)
const isSaving = ref(false)

// ============ فرم حذف ============
const deleteTarget = ref({ id: null, name: '' })

// ============ فرم دسته‌بندی ============
const categoryForm = ref({
  id: null,
  name: '',
  display_order: 0,
  is_active: true
})
const categoryFormTitle = computed(() => categoryForm.value.id ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی')

// ============ نوتیفیکیشن ============
const { toast, showToast } = useToast()

// ============ بارگذاری دسته‌بندی‌ها ============
async function loadCategories() {
  try {
    const result = await getCategories()
    let rawCategories = Array.isArray(result) ? result : (result?.data || [])
    const uniqueMap = new Map()
    rawCategories.forEach(cat => {
      if (!uniqueMap.has(cat.name)) uniqueMap.set(cat.name, cat)
    })
    categories.value = Array.from(uniqueMap.values())
  } catch (error) {
    console.error('Error loading categories:', error)
    categories.value = []
  }
}

// ============ بارگذاری آیتم‌ها ============
async function loadMenuItems() {
  isLoading.value = true
  try {
    const result = await getMenuItems()
    if (result && result.data && Array.isArray(result.data)) {
      menuItems.value = result.data
    } else if (result && Array.isArray(result)) {
      menuItems.value = result
    } else {
      menuItems.value = []
    }
  } catch (error) {
    console.error(error)
    showToast('خطا در بارگذاری منو', 'error')
    menuItems.value = []
  } finally {
    isLoading.value = false
  }
}

// ============ آمار ============
const stats = computed(() => {
  const total = menuItems.value.length
  const available = menuItems.value.filter(i => i.is_available == 1 || i.is_available === true).length
  return {
    total,
    available,
    unavailable: total - available,
    categories: categories.value.length
  }
})

// ============ تب دسته‌بندی ============
const categoryTabs = computed(() => {
  const categoryMap = {}
  menuItems.value.forEach(item => {
    const catId = item.category_id
    categoryMap[catId] = (categoryMap[catId] || 0) + 1
  })

  const tabs = [{ id: 'all', name: 'همه', count: menuItems.value.length }]
  categories.value.forEach(cat => {
    tabs.push({ id: cat.id, name: cat.name, count: categoryMap[cat.id] || 0 })
  })
  return tabs
})

// ============ فیلتر و مرتب‌سازی ============
const filteredItems = computed(() => {
  let items = [...menuItems.value]

  if (currentCategory.value !== 'all') {
    items = items.filter(i => i.category_id == currentCategory.value)
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    items = items.filter(i =>
      (i.name || '').toLowerCase().includes(search) ||
      (i.description || '').toLowerCase().includes(search)
    )
  }

  if (statusFilter.value !== 'all') {
    const isAvailable = statusFilter.value === 'available'
    items = items.filter(i => (i.is_available == 1 || i.is_available === true) === isAvailable)
  }

  const sortFns = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    'price-asc': (a, b) => (a.price || 0) - (b.price || 0),
    'price-desc': (a, b) => (b.price || 0) - (a.price || 0),
    'name-asc': (a, b) => (a.name || '').localeCompare(b.name || '', 'fa')
  }
  items.sort(sortFns[sortBy.value] || sortFns.newest)

  return items
})

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString('fa-IR')
}

function getCategoryName(catId) {
  const cat = categories.value.find(c => c.id == catId)
  return cat?.name || 'دسته‌بندی نشده'
}

// ============ پاک کردن فیلترها ============
function clearAllFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  sortBy.value = 'newest'
  currentCategory.value = 'all'
  showToast('تمامی فیلترها پاک شد', 'info')
}

// ============ تغییر وضعیت موجودی ============
async function toggleStatus(id) {
  const item = menuItems.value.find(i => i.id == id)
  if (!item) return

  const newStatus = (item.is_available == 1 || item.is_available === true) ? 0 : 1

  try {
    const formData = new FormData()
    formData.append('is_available', newStatus)
    formData.append('_method', 'PUT')

    const result = await updateMenuItem(id, formData)

    if (result.success || result.data) {
      item.is_available = newStatus
      showToast(`وضعیت "${item.name}" تغییر کرد`, 'success')
    } else {
      showToast('خطا در تغییر وضعیت', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('خطا در ارتباط با سرور', 'error')
  }
}

// ============ مودال ویرایش ============
function openEditModal(id) {
  const item = menuItems.value.find(i => i.id == id)
  if (!item) return

  editForm.value = {
    id: item.id,
    name: item.name || '',
    price: item.price || '',
    category_id: item.category_id || '',
    description: item.description || '',
    is_available: item.is_available == 1 || item.is_available === true,
    image: null,
    image_url: item.image_url || item.image || ''
  }
  imageFileToUpload.value = null
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  imageFileToUpload.value = null
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    showToast('فرمت فایل باید JPG, PNG, WebP یا GIF باشد', 'error')
    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast('حجم فایل نباید بیشتر از 2 مگابایت باشد', 'error')
    return
  }

  imageFileToUpload.value = file

  const reader = new FileReader()
  reader.onload = e => {
    editForm.value.image_url = e.target.result
  }
  reader.readAsDataURL(file)
}

async function saveItem() {
  const { name, price, category_id } = editForm.value
  if (!name.trim() || !price || !category_id) {
    showToast('فیلدهای ضروری را پر کنید', 'error')
    return
  }

  isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('price', parseInt(price))
    formData.append('category_id', category_id)
    formData.append('description', editForm.value.description.trim() || '')
    formData.append('is_available', editForm.value.is_available ? 1 : 0)

    if (imageFileToUpload.value) {
      formData.append('image', imageFileToUpload.value)
    }

    const result = await updateMenuItem(editForm.value.id, formData)

    if (result.success || result.data) {
      imageFileToUpload.value = null
      showToast('آیتم با موفقیت ویرایش شد', 'success')
      closeEditModal()
      await loadMenuItems()
    } else {
      showToast(result.message || 'خطا در ویرایش آیتم', 'error')
    }
  } catch (error) {
    console.error(error)
    let errorMsg = 'خطا در ارتباط با سرور'
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    } else if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      errorMsg = Object.values(errors).flat().join(', ')
    }
    showToast(errorMsg, 'error')
  } finally {
    isSaving.value = false
  }
}

// ============ مودال حذف ============
function openDeleteModal(id, name) {
  deleteTarget.value = { id, name }
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteTarget.value = { id: null, name: '' }
}

async function confirmDelete() {
  if (!deleteTarget.value.id) return

  try {
    await deleteMenuItem(deleteTarget.value.id)
    menuItems.value = menuItems.value.filter(i => i.id != deleteTarget.value.id)
    showToast('آیتم با موفقیت حذف شد', 'success')
    closeDeleteModal()
  } catch (error) {
    console.error(error)
    showToast('خطا در حذف آیتم', 'error')
  }
}

// ============ مودال مدیریت دسته‌بندی ============
function openManageCategories() {
  showCategoriesModal.value = true
}

function closeManageCategories() {
  showCategoriesModal.value = false
}

function openAddCategoryForm() {
  categoryForm.value = { id: null, name: '', display_order: 0, is_active: true }
  showCategoriesModal.value = false
  showCategoryFormModal.value = true
}

function openEditCategoryForm(cat) {
  categoryForm.value = {
    id: cat.id,
    name: cat.name,
    display_order: cat.display_order || 0,
    is_active: cat.is_active == 1
  }
  showCategoriesModal.value = false
  showCategoryFormModal.value = true
}

function closeCategoryForm() {
  showCategoryFormModal.value = false
  categoryForm.value = { id: null, name: '', display_order: 0, is_active: true }
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) {
    showToast('نام دسته‌بندی الزامی است', 'error')
    return
  }

  try {
    const data = {
      name: categoryForm.value.name.trim(),
      display_order: parseInt(categoryForm.value.display_order) || 0,
      is_active: categoryForm.value.is_active ? 1 : 0
    }

    if (categoryForm.value.id) {
      await updateCategory(categoryForm.value.id, data)
      showToast('دسته‌بندی با موفقیت ویرایش شد', 'success')
    } else {
      await createCategory(data)
      showToast(`دسته‌بندی "${data.name}" با موفقیت اضافه شد`, 'success')
    }

    closeCategoryForm()
    await loadCategories()
    await loadMenuItems()
  } catch (error) {
    console.error(error)
    showToast('خطا در ذخیره دسته‌بندی', 'error')
  }
}

async function confirmDeleteCategory(id, name) {
  if (!confirm(`آیا از حذف دسته‌بندی "${name}" اطمینان دارید؟\nتوجه: آیتم‌های مربوط به این دسته‌بندی حذف نمی‌شوند.`)) {
    return
  }

  try {
    await deleteCategory(id)
    showToast(`دسته‌بندی "${name}" با موفقیت حذف شد`, 'success')
    await loadCategories()
    await loadMenuItems()
  } catch (error) {
    console.error(error)
    showToast('خطا در حذف دسته‌بندی', 'error')
  }
}

// ============ بستن مودال با Escape ============
function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (showEditModal.value) closeEditModal()
    if (showDeleteModal.value) closeDeleteModal()
    if (showCategoryFormModal.value) closeCategoryForm()
    if (showCategoriesModal.value) closeManageCategories()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    nextTick(() => {
      const searchEl = document.querySelector('.search-input')
      if (searchEl) searchEl.focus()
    })
  }
}

// ============ تعداد آیتم هر دسته‌بندی ============
function getCategoryItemCount(catId) {
  return menuItems.value.filter(i => i.category_id == catId).length
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  await Promise.all([loadCategories(), loadMenuItems()])
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="flex items-center gap-2">
        <h1 class="header-title">
          <i class="fa-solid fa-utensils"></i> مدیریت منو
        </h1>
      </div>
      <div class="stats-wrapper">
        <div class="stats-bar fade-in-up">
          <div class="stat-item">
            <span class="stat-dot blue"></span>
            <span class="stat-count">{{ stats.total }}</span>
            <span class="stat-text">کل</span>
          </div>
          <span class="stat-divider"></span>
          <div class="stat-item">
            <span class="stat-dot green"></span>
            <span class="stat-count">{{ stats.available }}</span>
            <span class="stat-text">موجود</span>
          </div>
          <span class="stat-divider"></span>
          <div class="stat-item">
            <span class="stat-dot red"></span>
            <span class="stat-count">{{ stats.unavailable }}</span>
            <span class="stat-text">ناموجود</span>
          </div>
          <span class="stat-divider"></span>
          <div class="stat-item">
            <span class="stat-dot purple"></span>
            <span class="stat-count">{{ stats.categories }}</span>
            <span class="stat-text">دسته</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <router-link to="/menu-management/add" class="btn btn-primary" style="text-decoration: none;">
          <i class="fa-solid fa-plus"></i>
          <span class="btn-text">آیتم جدید</span>
        </router-link>
        <router-link to="/dashboard" class="back-btn">
          بازگشت
          <i class="fa-solid fa-arrow-left"></i>
        </router-link>
      </div>
    </div>
  </header>

  <main class="main-container">
    <!-- ============ تب دسته‌بندی ============ -->
    <div class="category-header">
      <div class="category-tabs fade-in-up">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          class="category-tab"
          :class="{ active: currentCategory === tab.id }"
          @click="currentCategory = tab.id">
          {{ tab.name }} <span class="count-badge">{{ tab.count }}</span>
        </button>
      </div>
      <button class="btn btn-outline" @click="openManageCategories()" style="padding: 6px 14px; font-size: 12px;">
        <i class="fa-solid fa-folder-gear"></i> مدیریت دسته‌بندی
      </button>
    </div>

    <!-- ============ نوار ابزار ============ -->
    <div class="toolbar glass fade-in-up">
      <div class="search-wrapper">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          type="text"
          class="search-box search-input"
          placeholder="جستجو در منو..."
          v-model="searchQuery">
      </div>
      <select class="filter-select" v-model="statusFilter">
        <option value="all">همه وضعیت‌ها</option>
        <option value="available">موجود</option>
        <option value="unavailable">ناموجود</option>
      </select>
      <select class="filter-select" v-model="sortBy">
        <option value="newest">جدیدترین</option>
        <option value="oldest">قدیمی‌ترین</option>
        <option value="price-asc">قیمت: کم به زیاد</option>
        <option value="price-desc">قیمت: زیاد به کم</option>
        <option value="name-asc">نام: الف تا ی</option>
      </select>
      <button class="btn btn-outline" @click="clearAllFilters()" style="padding: 8px 12px;">
        <i class="fa-solid fa-eraser"></i>
        <span class="btn-text">پاک کردن</span>
      </button>
    </div>

    <!-- ============ لودینگ ============ -->
    <div v-if="isLoading" class="menu-grid fade-in-up">
      <div v-for="i in 6" :key="i" class="menu-card">
        <div class="skeleton" style="aspect-ratio: 1/1"></div>
        <div class="menu-card-body">
          <div class="skeleton h-4 w-3/4 mb-2"></div>
          <div class="skeleton h-3 w-full mb-1"></div>
          <div class="skeleton h-3 w-2/3"></div>
        </div>
        <div class="menu-card-footer">
          <div class="skeleton h-5 w-20"></div>
        </div>
      </div>
    </div>

    <!-- ============ حالت خالی ============ -->
    <div v-else-if="filteredItems.length === 0" class="empty-state fade-in-up">
      <i class="fa-solid fa-utensils empty-state-icon"></i>
      <h3>منو خالی است</h3>
      <p>هنوز هیچ آیتمی به منو اضافه نشده</p>
      <router-link to="/menu-management/add">
        <button class="btn btn-primary">
          <i class="fa-solid fa-plus"></i> افزودن اولین آیتم
        </button>
      </router-link>
    </div>

    <!-- ============ گرید منو ============ -->
    <div v-else class="menu-grid fade-in-up">
      <div v-for="item in filteredItems" :key="item.id" class="menu-card fade-in-up">
        <img
          :src="item.image_url || item.image || getImageUrl('images/menu-items/default.jpg')"
          :alt="item.name"
          class="menu-card-image"
          loading="lazy"
          @error="(e) => e.target.src = getImageUrl('images/menu-items/default.jpg')">
        <div class="menu-card-overlay">
          <div class="menu-card-badges">
            <span
              class="badge"
              :class="(item.is_available == 1 || item.is_available === true) ? 'badge-available' : 'badge-unavailable'">
              {{ (item.is_available == 1 || item.is_available === true) ? 'موجود' : 'ناموجود' }}
            </span>
          </div>
          <div class="menu-card-actions-overlay">
            <button class="btn-icon-overlay edit" @click.stop="openEditModal(item.id)" title="ویرایش">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon-overlay toggle-status" @click.stop="toggleStatus(item.id)" title="تغییر وضعیت موجودی">
              <i class="fa-solid" :class="(item.is_available == 1 || item.is_available === true) ? 'fa-ban' : 'fa-circle-check'"></i>
            </button>
            <button class="btn-icon-overlay delete" @click.stop="openDeleteModal(item.id, item.name)" title="حذف">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
        <div class="menu-card-body">
          <span class="menu-card-category">{{ getCategoryName(item.category_id) }}</span>
          <h3 class="menu-card-title">{{ item.name }}</h3>
          <p class="menu-card-desc">{{ item.description || '' }}</p>
        </div>
        <div class="menu-card-footer">
          <span class="menu-card-price">{{ formatPrice(item.price) }} تومان</span>
        </div>
      </div>
    </div>

    <AdminFooter />
  </main>

  <!-- ============ مودال ویرایش ============ -->
  <Transition name="modal">
    <div v-if="showEditModal" class="modal" @click.self="closeEditModal">
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid fa-pen-to-square"></i> ویرایش آیتم
          </h3>
          <button class="modal-close" @click="closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="saveItem()">
          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-tag"></i> نام آیتم <span class="required">*</span></label>
            <input type="text" class="form-input" v-model="editForm.name" placeholder="مثال: لاته کاراملی" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label"><i class="fa-solid fa-coins"></i> قیمت (تومان) <span class="required">*</span></label>
              <input type="number" class="form-input" v-model="editForm.price" placeholder="85000" required>
            </div>
            <div class="form-group">
              <label class="form-label"><i class="fa-solid fa-layer-group"></i> دسته‌بندی <span class="required">*</span></label>
              <select class="form-select" v-model="editForm.category_id" required>
                <option value="">انتخاب کنید...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-list-ul"></i> توضیحات</label>
            <textarea class="form-textarea" v-model="editForm.description" rows="3" placeholder="توضیحات محصول..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label"><i class="fa-solid fa-eye"></i> وضعیت</label>
              <select class="form-select" v-model="editForm.is_available">
                <option :value="true">موجود</option>
                <option :value="false">ناموجود</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa-solid fa-image"></i> تصویر محصول</label>
            <div class="upload-area" :class="{ 'has-image': editForm.image_url }" @click="$refs.imageInput.click()">
              <input type="file" ref="imageInput" class="hidden" accept="image/*" @change="handleImageUpload">
              <div v-if="editForm.image_url" class="upload-preview-container">
                <img :src="editForm.image_url" class="upload-preview-img" alt="Preview">
              </div>
              <div v-else>
                <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
                <p class="upload-text">کلیک برای آپلود تصویر جدید</p>
                <p class="upload-hint">JPG, PNG, WebP | حداکثر 2MB</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="closeEditModal()"><i class="fa-solid fa-times"></i> انصراف</button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              <i v-if="isSaving" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              {{ isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>

  <!-- ============ مودال حذف ============ -->
  <Transition name="modal">
    <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
      <div class="modal-dialog delete-modal-dialog">
        <div class="delete-modal-icon"><i class="fa-solid fa-trash-can"></i></div>
        <h3 class="delete-modal-title">حذف آیتم</h3>
        <p class="delete-modal-item">{{ deleteTarget.name }}</p>
        <div class="delete-modal-actions">
          <button class="btn-delete-cancel" @click="closeDeleteModal()">انصراف</button>
          <button class="btn-delete-confirm" @click="confirmDelete()">حذف</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ============ مودال مدیریت دسته‌بندی ============ -->
  <Transition name="modal">
    <div v-if="showCategoriesModal" class="modal" @click.self="closeManageCategories">
      <div class="modal-dialog" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid fa-folder-gear"></i> مدیریت دسته‌بندی‌ها
          </h3>
          <button class="modal-close" @click="closeManageCategories()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="margin-bottom: 20px;">
          <button class="btn btn-primary" @click="openAddCategoryForm()" style="width: 100%;">
            <i class="fa-solid fa-plus"></i> افزودن دسته‌بندی جدید
          </button>
        </div>

        <div class="categories-list" style="max-height: 400px; overflow-y: auto;">
          <div v-if="categories.length === 0" class="empty-state" style="padding: 40px;">
            <i class="fa-solid fa-folder-open empty-state-icon"></i>
            <p>هیچ دسته‌بندی یافت نشد</p>
          </div>
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-manage-item">
            <div class="category-info">
              <div class="category-name">
                {{ cat.name }}
                <span :class="getCategoryItemCount(cat.id) === 0 ? 'item-count-zero' : 'item-count-badge'">
                  {{ getCategoryItemCount(cat.id) === 0 ? 'بدون آیتم' : `${getCategoryItemCount(cat.id)} آیتم` }}
                </span>
              </div>
              <div class="category-meta">
                <span>ID: {{ cat.id }}</span>
                <span>ترتیب: {{ cat.display_order || 0 }}</span>
                <span class="category-badge" :class="cat.is_active == 1 ? '' : 'inactive'">
                  {{ cat.is_active == 1 ? 'فعال' : 'غیرفعال' }}
                </span>
              </div>
            </div>
            <div class="category-actions">
              <button class="edit-cat-btn" @click="openEditCategoryForm(cat)" title="ویرایش">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="delete-cat-btn" @click="confirmDeleteCategory(cat.id, cat.name)" title="حذف">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ============ مودال فرم دسته‌بندی ============ -->
  <Transition name="modal">
    <div v-if="showCategoryFormModal" class="modal" @click.self="closeCategoryForm">
      <div class="modal-dialog" style="max-width: 420px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid" :class="categoryForm.id ? 'fa-pen-to-square' : 'fa-folder-plus'"></i>
            {{ categoryFormTitle }}
          </h3>
          <button class="modal-close" @click="closeCategoryForm()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="saveCategory()">
          <div class="form-group">
            <label class="form-label">نام دسته‌بندی <span class="required">*</span></label>
            <input type="text" class="form-input" v-model="categoryForm.name" placeholder="مثال: نوشیدنی گرم" required>
          </div>
          <div class="form-group">
            <label class="form-label">ترتیب نمایش</label>
            <input type="number" class="form-input" v-model="categoryForm.display_order" placeholder="اختیاری">
          </div>
          <div class="form-group">
            <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" v-model="categoryForm.is_active"> فعال
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="closeCategoryForm()">انصراف</button>
            <button type="submit" class="btn btn-primary">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>

  <!-- ============ نوتیفیکیشن ============ -->
  <Transition name="toast">
    <div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
      <i class="fa-solid" :class="toast.type === 'error' ? 'fa-circle-xmark' : toast.type === 'info' ? 'fa-circle-info' : 'fa-circle-check'"></i>
      <span>{{ toast.message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
/* ============ انیمیشن‌ها ============ */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes spin { to { transform: rotate(360deg); } }
.fade-in-up { animation: fadeInUp 0.5s ease-out; }
.glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }

.skeleton {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
}

/* ============ هدر ============ */
.header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(15,23,42,0.95); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header-content {
  max-width: 1400px; margin: 0 auto; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
@media (min-width: 768px) { .header-content { padding: 16px 24px; } }
@media (max-width: 767px) {
  .header-content { flex-direction: column; align-items: stretch; }
  .stats-wrapper { order: 1; margin: 8px 0; }
  .header-right { order: 2; justify-content: center; }
}
.header-title { font-size: 17px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
@media (min-width: 640px) { .header-title { font-size: 20px; gap: 10px; } }
.stats-wrapper { display: flex; align-items: center; justify-content: center; flex: 1; }
.stats-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 6px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 48px;
  flex-wrap: wrap;
}
@media (min-width: 640px) { .stats-bar { gap: 16px; padding: 6px 20px; } }
.stat-item { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
@media (max-width: 480px) { .stat-item { gap: 4px; } }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.stat-dot.blue { background: #60a5fa; box-shadow: 0 0 6px rgba(96,165,250,0.5); }
.stat-dot.green { background: #34d399; box-shadow: 0 0 6px rgba(52,211,153,0.5); }
.stat-dot.red { background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,0.5); }
.stat-dot.purple { background: #a78bfa; box-shadow: 0 0 6px rgba(167,139,250,0.5); }
.stat-count { font-size: 14px; font-weight: 700; color: white; min-width: 28px; text-align: center; }
@media (min-width: 640px) { .stat-count { font-size: 16px; min-width: 32px; } }
.stat-text { font-size: 10px; color: rgba(255,255,255,0.6); }
@media (min-width: 640px) { .stat-text { font-size: 11px; } }
.stat-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }
@media (min-width: 640px) { .stat-divider { height: 20px; } }

/* ============ دکمه‌ها ============ */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px; font-weight: 600; font-size: 12px;
  cursor: pointer; transition: all 0.3s ease; border: none; white-space: nowrap;
}
@media (min-width: 640px) { .btn { padding: 10px 20px; font-size: 14px; border-radius: 12px; gap: 8px; } }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
.btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.25); }
.btn-outline:hover { background: rgba(255,255,255,0.1); }
.back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 8px;
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  cursor: pointer; transition: all 0.25s ease;
  white-space: nowrap; text-decoration: none;
}
.back-btn:hover {
  color: white; background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.25);
  transform: translateY(-1px);
}
.back-btn i { font-size: 10px; transition: transform 0.25s ease; }
.back-btn:hover i { transform: translateX(-2px); }
.header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* ============ کانتینر اصلی ============ */
.main-container { max-width: 1400px; margin: 0 auto; padding: 12px; padding-bottom: 80px; }
@media (min-width: 640px) { .main-container { padding: 16px 20px; padding-bottom: 80px; } }
@media (min-width: 1024px) { .main-container { padding: 20px 24px; padding-bottom: 80px; } }

/* ============ تب دسته‌بندی ============ */
.category-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px; margin-bottom: 16px;
}
.category-tabs {
  display: flex; gap: 8px; flex-wrap: wrap; flex: 1;
}
.category-tab {
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.08);
  display: inline-flex; align-items: center; gap: 6px;
}
.category-tab:hover { background: rgba(255,255,255,0.1); color: white; }
.category-tab.active { background: #3b82f6; color: white; border-color: #3b82f6; }
@media (min-width: 640px) { .category-tab { padding: 8px 18px; font-size: 13px; } }
.count-badge {
  background: rgba(255,255,255,0.15);
  padding: 2px 6px; border-radius: 20px; font-size: 10px;
}
.category-tab.active .count-badge { background: rgba(255,255,255,0.25); }

/* ============ نوار ابزار ============ */
.toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 12px; border-radius: 14px; margin-bottom: 20px;
}
@media (min-width: 640px) { .toolbar { padding: 20px; gap: 12px; } }
.search-wrapper { position: relative; flex: 1; min-width: 160px; }
.search-icon {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.4); font-size: 14px;
}
.search-box {
  width: 100%; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
  padding: 8px 35px 8px 12px; color: white; font-size: 12px; outline: none;
}
@media (min-width: 640px) { .search-box { padding: 10px 40px 10px 16px; font-size: 14px; } }
.search-box:focus { border-color: #3b82f6; background: rgba(255,255,255,0.1); }
.filter-select {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; padding: 8px 12px; color: white; font-size: 12px;
  outline: none; cursor: pointer; min-width: 110px;
}
@media (min-width: 640px) { .filter-select { padding: 10px 16px; font-size: 14px; min-width: 140px; } }
.filter-select option { background: #1e293b; color: white; }

/* ============ گرید منو ============ */
.menu-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;
}
@media (min-width: 640px) { .menu-grid { gap: 12px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
@media (min-width: 768px) { .menu-grid { gap: 17px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }
@media (min-width: 1024px) { .menu-grid { gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); } }
.menu-card {
  position: relative; background: rgba(255,255,255,0.03);
  backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; overflow: hidden; transition: all 0.3s ease;
  display: flex; flex-direction: column;
}
.menu-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.12); }
.menu-card-image { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
.menu-card-overlay {
  position: absolute; top: 0; left: 0; right: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 60%);
  display: flex; align-items: flex-start; justify-content: space-between; padding: 8px; gap: 8px;
}
.menu-card-badges { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }
.menu-card-actions-overlay { display: flex; gap: 4px; flex-shrink: 0; }
.menu-card-body { padding: 12px; display: flex; flex-direction: column; flex: 1; gap: 6px; }
.menu-card-category {
  font-size: 10px; padding: 3px 10px; border-radius: 14px;
  background: rgba(139,92,246,0.2); color: #c4b5fd; align-self: flex-start;
}
.menu-card-title { font-size: 14px; font-weight: 700; color: white; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.menu-card-desc { font-size: 11px; color: rgba(255,255,255,0.45); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
.menu-card-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 12px; border-top: 1px solid rgba(255,255,255,0.04); gap: 8px; flex-wrap: wrap; }
.menu-card-price { font-size: 14px; font-weight: 700; color: #10b981; white-space: nowrap; }
.badge { font-size: 8px; padding: 2px 6px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.badge-available { background: rgba(16,185,129,0.3); color: #6ee7b7; }
.badge-unavailable { background: rgba(239,68,68,0.3); color: #fca5a5; }

/* ============ دکمه‌های اورلی ============ */
.btn-icon-overlay {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease; border: none;
  font-size: 12px; color: white;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); flex-shrink: 0;
}
.btn-icon-overlay:hover { background: rgba(0,0,0,0.8); transform: scale(1.05); }
.btn-icon-overlay.edit:hover { color: #93c5fd; }
.btn-icon-overlay.delete:hover { color: #fca5a5; }
.btn-icon-overlay.toggle-status:hover { color: #6ee7b7; }

/* ============ آپلود تصویر ============ */
.upload-area {
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 10px; padding: 20px; text-align: center;
  cursor: pointer; transition: all 0.3s ease;
  background: rgba(255,255,255,0.02);
}
.upload-area:hover { border-color: #3b82f6; background: rgba(59,130,246,0.05); }
.upload-area.has-image { border-style: solid; border-color: rgba(16,185,129,0.3); padding: 8px; }
.upload-icon { font-size: 24px; color: rgba(255,255,255,0.2); margin-bottom: 6px; display: block; }
.upload-text { color: rgba(255,255,255,0.45); font-size: 11px; }
.upload-hint { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 4px; }
.upload-preview-img { width: 100%; height: 100px; object-fit: cover; border-radius: 8px; }
.upload-preview-container { text-align: center; }

/* ============ مودال ============ */
.modal {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  padding: 16px;
}
.modal-dialog {
  background: #1a2332; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; width: 100%; max-width: 600px; max-height: 85vh;
  overflow-y: auto; padding: 20px; animation: slideDown 0.3s ease-out;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
  position: sticky; top: 0; background: #1a2332; z-index: 1; padding-bottom: 12px;
}
.modal-title { font-size: 18px; font-weight: 700; color: white; }
.modal-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 20px; transition: color 0.2s; padding: 4px; }
.modal-close:hover { color: white; }
.modal-footer { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }

/* ============ فرم ============ */
.form-group { margin-bottom: 16px; }
.form-label { display: block; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500; margin-bottom: 6px; }
.form-label i { margin-left: 6px; color: #3b82f6; }
.required { color: #f87171; margin-right: 2px; }
.form-input, .form-textarea, .form-select {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
  color: white; font-size: 13px; outline: none; transition: all 0.3s;
}
.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: #3b82f6; background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.form-select option { background: #1e293b; color: white; }
.form-textarea { resize: vertical; min-height: 60px; }
.form-row { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 480px) { .form-row { grid-template-columns: 1fr 1fr; gap: 12px; } }

/* ============ مدیریت دسته‌بندی ============ */
.category-manage-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 12px 16px; margin-bottom: 10px;
  display: flex; align-items: center; justify-content: space-between;
  transition: all 0.2s ease;
}
.category-manage-item:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(59,130,246,0.3);
}
.category-info { flex: 1; }
.category-name { font-weight: 600; color: white; font-size: 15px; margin-bottom: 4px; }
.category-meta { font-size: 11px; color: rgba(255,255,255,0.5); display: flex; gap: 12px; flex-wrap: wrap; }
.category-badge {
  background: rgba(16,185,129,0.2); color: #6ee7b7;
  padding: 2px 8px; border-radius: 20px; font-size: 10px;
}
.category-badge.inactive { background: rgba(239,68,68,0.2); color: #fca5a5; }
.category-actions { display: flex; gap: 8px; }
.category-actions button {
  background: rgba(255,255,255,0.08); border: none; border-radius: 8px;
  padding: 6px 10px; cursor: pointer; transition: all 0.2s ease; color: white;
}
.category-actions button:hover { background: rgba(59,130,246,0.3); }
.category-actions .delete-cat-btn:hover { background: rgba(239,68,68,0.3); color: #fca5a5; }
.item-count-badge {
  background: rgba(59,130,246,0.2); color: #60a5fa;
  padding: 2px 8px; border-radius: 20px; font-size: 11px;
  margin-right: 10px; font-weight: normal;
}
.item-count-zero {
  background: rgba(107,114,128,0.2); color: #9ca3af;
  padding: 2px 8px; border-radius: 20px; font-size: 11px;
  margin-right: 10px; font-weight: normal;
}

/* ============ مودال حذف ============ */
.delete-modal-dialog { max-width: 400px; text-align: center; padding: 28px 20px; }
.delete-modal-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; color: #f87171; }
.delete-modal-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 8px; }
.delete-modal-item { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; margin: 12px 0; padding: 8px 12px; background: rgba(255,255,255,0.04); border-radius: 8px; display: inline-block; }
.delete-modal-actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
.btn-delete-cancel { padding: 8px 16px; border-radius: 8px; font-size: 13px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
.btn-delete-confirm { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; background: #ef4444; color: white; border: none; cursor: pointer; }
.btn-delete-confirm:hover { background: #dc2626; }

/* ============ حالت خالی ============ */
.empty-state { text-align: center; padding: 40px 16px; }
.empty-state-icon { font-size: 40px; color: rgba(255,255,255,0.1); margin-bottom: 12px; }
.empty-state h3 { color: white; font-size: 17px; margin-bottom: 6px; }
.empty-state p { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 16px; }

/* ============ نوتیفیکیشن ============ */
.toast-notification {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 10px; color: white; font-size: 13px;
  font-weight: 500; white-space: nowrap; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  pointer-events: none;
}
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
.toast-info { background: #3b82f6; }

/* ============ ترنزیشن‌ها ============ */
.modal-enter-active { transition: opacity 0.25s ease; }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.toast-enter-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.toast-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(-50%) translateY(20px); opacity: 0; }

@media (max-width: 479px) {
  .btn { padding: 6px 10px; font-size: 10px; }
  .header-right { gap: 5px; }
  .stat-text { font-size: 9px; }
  .stat-count { font-size: 12px; min-width: 24px; }
  .stat-divider { height: 12px; }
  .stats-bar { gap: 6px; padding: 4px 10px; }
  .stat-item { gap: 3px; }
}
</style>
