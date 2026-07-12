<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUsers, updateUser, deleteUser, createUser } from '@/services/users'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()

if (!auth.isSuperAdmin) {
  router.push(auth.user ? '/dashboard' : '/login')
}

const allUsers = ref([])
const filteredUsers = ref([])
const currentPage = ref(1)
const PAGE_SIZE = 10
const searchQuery = ref('')
const roleFilter = ref('')
const loginFilter = ref('')
const loading = ref(true)
const deleteTargetId = ref(null)
const deleteTargetName = ref('')

// Edit modal
const editModalOpen = ref(false)
const editUserId = ref(null)
const editName = ref('')
const editEmail = ref('')
const editPhone = ref('')
const editRole = ref('user')
const editError = ref('')
const editSaving = ref(false)

// Add admin modal
const addModalOpen = ref(false)
const addName = ref('')
const addEmail = ref('')
const addPhone = ref('')
const addPassword = ref('')
const addPasswordConfirm = ref('')
const addError = ref('')
const addSaving = ref(false)

// Delete confirm
const deleteModalOpen = ref(false)

// Toast
const toastMessage = ref('')
const toastType = ref('success')
const toastVisible = ref(false)
let toastTimeout = null

const AVATAR_COLORS = [
  ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#10b981', '#047857'],
  ['#f59e0b', '#b45309'], ['#ef4444', '#b91c1c'], ['#06b6d4', '#0e7490']
]

const stats = computed(() => {
  const total = allUsers.value.length
  const admins = allUsers.value.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  const yesterday = new Date(Date.now() - 86400000)
  const active = allUsers.value.filter(u => u.last_login && new Date(u.last_login) > yesterday).length
  return { total, admins, active }
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / PAGE_SIZE))

const paginationInfo = computed(() => {
  const total = filteredUsers.value.length
  if (total === 0) return ''
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, total)
  return `نمایش ${start}–${end} از ${total} کاربر`
})

const paginationPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
      pages.push(i)
    }
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'همین الان'
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
    if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ` ساعت ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
  } catch { return '—' }
}

function formatJoinDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '—' }
}

function roleLabel(role) {
  if (role === 'super_admin') return { text: 'سوپر ادمین', cls: 'role-super_admin' }
  if (role === 'admin') return { text: 'ادمین', cls: 'role-admin' }
  return { text: 'کاربر', cls: 'role-user' }
}

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => { toastVisible.value = false }, 3000)
}

function applyFilters() {
  const search = searchQuery.value.trim().toLowerCase()
  const role = roleFilter.value
  const login = loginFilter.value
  const now = new Date()

  filteredUsers.value = allUsers.value.filter(u => {
    if (search) {
      const name = (u.name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      if (!name.includes(search) && !email.includes(search)) return false
    }
    if (role && u.role !== role) return false
    if (login) {
      const last = u.last_login ? new Date(u.last_login) : null
      if (login === 'never' && last) return false
      if (login === 'today') {
        if (!last) return false
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)
        if (last < today) return false
      }
      if (login === 'week') {
        if (!last) return false
        const weekAgo = new Date(now - 7 * 86400000)
        if (last < weekAgo) return false
      }
      if (login === 'month') {
        if (!last) return false
        const monthAgo = new Date(now - 30 * 86400000)
        if (last < monthAgo) return false
      }
    }
    return true
  })

  currentPage.value = 1
}

async function loadUsers() {
  loading.value = true
  try {
    const data = await getUsers()
    allUsers.value = Array.isArray(data) ? data : (data?.data || data?.users || [])
    applyFilters()
  } catch (err) {
    console.error(err)
    showToast('خطا در بارگذاری کاربران', 'error')
  } finally {
    loading.value = false
  }
}

// Edit modal
function openEditModal(userId) {
  const u = allUsers.value.find(u => u.id === userId)
  if (!u) return
  editUserId.value = u.id
  editName.value = u.name || ''
  editEmail.value = u.email || ''
  editPhone.value = u.phone_number || ''
  editRole.value = u.role || 'user'
  editError.value = ''
  editModalOpen.value = true
}

function closeEditModal() {
  editModalOpen.value = false
}

async function saveEdit() {
  const name = editName.value.trim()
  const email = editEmail.value.trim()
  const phone = editPhone.value.trim()
  const role = editRole.value
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!name || !email) {
    editError.value = 'نام و ایمیل الزامی هستند'
    return
  }
  if (!emailRegex.test(email)) {
    editError.value = 'فرمت ایمیل معتبر نیست'
    return
  }

  editSaving.value = true
  try {
    await updateUser(editUserId.value, { name, email, phone_number: phone, role })
    const idx = allUsers.value.findIndex(u => u.id === editUserId.value)
    if (idx !== -1) {
      allUsers.value[idx] = { ...allUsers.value[idx], name, email, phone_number: phone, role }
    }
    applyFilters()
    closeEditModal()
    showToast('کاربر با موفقیت ویرایش شد')
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'خطا در ذخیره اطلاعات'
    editError.value = msg
    showToast(msg, 'error')
  } finally {
    editSaving.value = false
  }
}

// Add admin modal
function openAddModal() {
  addName.value = ''
  addEmail.value = ''
  addPhone.value = ''
  addPassword.value = ''
  addPasswordConfirm.value = ''
  addError.value = ''
  addModalOpen.value = true
}

function closeAddModal() {
  addModalOpen.value = false
}

async function saveAdd() {
  const name = addName.value.trim()
  const email = addEmail.value.trim()
  const phone = addPhone.value.trim()
  const password = addPassword.value
  const confirm = addPasswordConfirm.value

  if (!name || !email || !password) {
    addError.value = 'نام، ایمیل و رمز عبور الزامی هستند'
    return
  }
  if (password !== confirm) {
    addError.value = 'رمز عبور و تأیید آن یکسان نیستند'
    return
  }
  if (password.length < 8) {
    addError.value = 'رمز عبور باید حداقل ۸ کاراکتر باشد'
    return
  }

  addSaving.value = true
  try {
    await createUser({ name, email, phone_number: phone, password, password_confirmation: confirm, role: 'admin' })
    await loadUsers()
    closeAddModal()
    showToast('ادمین با موفقیت ایجاد شد')
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'خطا در ایجاد ادمین'
    addError.value = msg
    showToast(msg, 'error')
  } finally {
    addSaving.value = false
  }
}

// Delete
function openDeleteConfirm(userId, userName) {
  deleteTargetId.value = userId
  deleteTargetName.value = userName || 'کاربر ناشناس'
  deleteModalOpen.value = true
}

function closeDeleteConfirm() {
  deleteModalOpen.value = false
  deleteTargetId.value = null
}

async function confirmDelete() {
  if (!deleteTargetId.value) return
  try {
    await deleteUser(deleteTargetId.value)
    allUsers.value = allUsers.value.filter(u => u.id !== deleteTargetId.value)
    applyFilters()
    closeDeleteConfirm()
    showToast('کاربر با موفقیت حذف شد')
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'خطا در حذف کاربر'
    showToast(msg, 'error')
    closeDeleteConfirm()
  }
}

let searchDebounce
function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(applyFilters, 300)
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeEditModal()
    closeDeleteConfirm()
    closeAddModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadUsers()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

watch([roleFilter, loginFilter], () => {
  applyFilters()
})
</script>

<template>
  <div class="admins-page">
    <AdminSidebar />

    <main class="main-body">
      <div class="glass-effect rounded-3xl shadow-2xl p-6 lg:p-8 fade-in-up border border-white/10">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-white">مدیریت ادمین‌ها</h1>
            </div>
            <p class="text-blue-200 text-sm mr-13">مشاهده، ویرایش و حذف کاربران سیستم</p>
          </div>
          <div class="flex gap-3">
            <div class="glass-effect rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div class="text-xl font-bold text-white">{{ stats.total }}</div>
              <div class="text-xs text-blue-300 mt-0.5">کل کاربران</div>
            </div>
            <div class="glass-effect rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div class="text-xl font-bold text-purple-300">{{ stats.admins }}</div>
              <div class="text-xs text-blue-300 mt-0.5">ادمین‌ها</div>
            </div>
            <div class="glass-effect rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div class="text-xl font-bold text-green-300">{{ stats.active }}</div>
              <div class="text-xs text-blue-300 mt-0.5">فعال امروز</div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3 mb-6">
          <div class="relative flex-1 min-w-[200px]">
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="جستجو بر اساس نام یا ایمیل..." class="filter-input w-full pr-10" v-model="searchQuery" @input="onSearchInput" />
          </div>
          <select class="filter-input min-w-[150px]" v-model="roleFilter">
            <option value="">همه نقش‌ها</option>
            <option value="super_admin">سوپر ادمین</option>
            <option value="admin">ادمین</option>
            <option value="user">کاربر</option>
          </select>
          <select class="filter-input min-w-[160px]" v-model="loginFilter">
            <option value="">فیلتر آخرین ورود</option>
            <option value="today">امروز</option>
            <option value="week">این هفته</option>
            <option value="month">این ماه</option>
            <option value="never">هرگز وارد نشده</option>
          </select>
          <button class="btn-action btn-edit px-4" @click="loadUsers" :disabled="loading">
            <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            بارگذاری مجدد
          </button>
          <button class="btn-action px-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg" @click="openAddModal">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            افزودن ادمین
          </button>
        </div>

        <!-- Table wrapper -->
        <div class="rounded-2xl overflow-hidden border border-white/10">
          <!-- Desktop header -->
          <div class="hidden md:grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-blue-300 uppercase tracking-wider bg-white/5 border-b border-white/10">
            <div class="col-span-4">کاربر</div>
            <div class="col-span-2">نقش</div>
            <div class="col-span-3">آخرین ورود</div>
            <div class="col-span-2">تاریخ عضویت</div>
            <div class="col-span-1 text-left">عملیات</div>
          </div>

          <!-- Skeleton loader -->
          <div v-if="loading">
            <!-- Mobile skeleton -->
            <div class="md:hidden space-y-3 p-3">
              <div v-for="i in 3" :key="i" class="skeleton-card">
                <div class="flex items-center gap-3 mb-3">
                  <div class="skeleton w-12 h-12 rounded-xl flex-shrink-0"></div>
                  <div class="flex-1">
                    <div class="skeleton h-4 w-32 rounded mb-2"></div>
                    <div class="skeleton h-3 w-40 rounded"></div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div><span class="text-blue-300 text-xs">نقش:</span> <div class="skeleton h-5 w-16 rounded-full inline-block"></div></div>
                  <div><span class="text-blue-300 text-xs">آخرین ورود:</span> <div class="skeleton h-4 w-20 inline-block rounded"></div></div>
                  <div class="col-span-2"><span class="text-blue-300 text-xs">تاریخ عضویت:</span> <div class="skeleton h-4 w-24 inline-block rounded"></div></div>
                </div>
                <div class="flex gap-2 mt-3 justify-end">
                  <div class="skeleton h-9 w-16 rounded-lg"></div>
                  <div class="skeleton h-9 w-16 rounded-lg"></div>
                </div>
              </div>
            </div>
            <!-- Desktop skeleton -->
            <div class="hidden md:block">
              <div v-for="i in 3" :key="i" class="user-row px-5 py-4">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-4 flex items-center gap-3">
                    <div class="skeleton w-10 h-10 rounded-xl flex-shrink-0"></div>
                    <div class="flex flex-col gap-2 flex-1">
                      <div class="skeleton h-3.5 w-28 rounded"></div>
                      <div class="skeleton h-3 w-36 rounded"></div>
                    </div>
                  </div>
                  <div class="col-span-2"><div class="skeleton h-6 w-20 rounded-full"></div></div>
                  <div class="col-span-3"><div class="skeleton h-3.5 w-32 rounded"></div></div>
                  <div class="col-span-2"><div class="skeleton h-3.5 w-24 rounded"></div></div>
                  <div class="col-span-1 flex gap-1 justify-end">
                    <div class="skeleton h-8 w-8 rounded-lg"></div>
                    <div class="skeleton h-8 w-8 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p class="text-sm">هیچ کاربری یافت نشد</p>
          </div>

          <!-- User rows -->
          <div v-else>
            <template v-for="u in paginatedUsers" :key="u.id">
              <!-- Mobile card -->
              <div class="md:hidden user-card">
                <div class="flex items-center gap-3">
                  <div class="user-card-avatar" :style="{ background: `linear-gradient(135deg, ${avatarColor(u.id)[0]}, ${avatarColor(u.id)[1]})` }">
                    {{ (u.name || u.email || '?').slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="user-card-info">
                    <div class="user-card-name flex items-center gap-1.5">
                      {{ u.name || '—' }}
                      <span v-if="u.id === auth.user?.id" class="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">شما</span>
                    </div>
                    <div class="user-card-email">{{ u.email || '—' }}</div>
                    <div v-if="u.phone" class="user-card-phone">{{ u.phone }}</div>
                  </div>
                </div>
                <div class="user-card-details">
                  <div>
                    <div class="user-card-detail-label">نقش</div>
                    <span class="role-badge text-xs" :class="roleLabel(u.role).cls">{{ roleLabel(u.role).text }}</span>
                  </div>
                  <div>
                    <div class="user-card-detail-label">آخرین ورود</div>
                    <div class="user-card-detail-value">{{ formatDate(u.last_login) }}</div>
                  </div>
                  <div class="col-span-2">
                    <div class="user-card-detail-label">تاریخ عضویت</div>
                    <div class="user-card-detail-value">{{ formatJoinDate(u.created_at) }}</div>
                  </div>
                </div>
                <div class="user-card-actions">
                  <button class="btn-action btn-edit" @click="openEditModal(u.id)">
                    <i class="fa-regular fa-pen-to-square"></i> ویرایش
                  </button>
                  <button
                    class="btn-action btn-delete"
                    :class="{ 'opacity-30 cursor-not-allowed': u.id === auth.user?.id }"
                    :disabled="u.id === auth.user?.id"
                    @click="openDeleteConfirm(u.id, u.name || u.email)">
                    <i class="fa-regular fa-trash-can"></i> حذف
                  </button>
                </div>
              </div>

              <!-- Desktop row -->
              <div class="hidden md:grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                <div class="col-span-4 flex items-center gap-3 min-w-0">
                  <div class="user-avatar flex-shrink-0" :style="{ background: `linear-gradient(135deg, ${avatarColor(u.id)[0]}, ${avatarColor(u.id)[1]})` }">
                    {{ (u.name || u.email || '?').slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-white font-medium text-sm truncate flex items-center gap-1.5">
                      {{ u.name || '—' }}
                      <span v-if="u.id === auth.user?.id" class="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">شما</span>
                    </div>
                    <div class="text-white/40 text-xs truncate mt-0.5">{{ u.email || '—' }}</div>
                    <div v-if="u.phone" class="text-white/30 text-xs truncate">{{ u.phone }}</div>
                  </div>
                </div>
                <div class="col-span-2">
                  <span class="role-badge" :class="roleLabel(u.role).cls">{{ roleLabel(u.role).text }}</span>
                </div>
                <div class="col-span-3 text-white/70 text-sm">{{ formatDate(u.last_login) }}</div>
                <div class="col-span-2 text-white/50 text-sm">{{ formatJoinDate(u.created_at) }}</div>
                <div class="col-span-1 flex gap-1 justify-end">
                  <button class="btn-action btn-edit p-2" @click="openEditModal(u.id)" title="ویرایش">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    class="btn-action btn-delete p-2"
                    :class="{ 'opacity-30 cursor-not-allowed': u.id === auth.user?.id }"
                    :disabled="u.id === auth.user?.id"
                    @click="openDeleteConfirm(u.id, u.name || u.email)"
                    :title="u.id === auth.user?.id ? 'نمی‌توانید خودتان را حذف کنید' : 'حذف'">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="filteredUsers.length > 0" class="flex items-center justify-between mt-5">
          <div class="text-sm text-white/50">{{ paginationInfo }}</div>
          <div class="flex gap-2">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <template v-for="(p, idx) in paginationPages" :key="idx">
              <span v-if="p === '...'" class="page-btn cursor-default opacity-40">…</span>
              <button v-else class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
            </template>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModalOpen" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-box">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              ویرایش کاربر
            </h3>
            <button class="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg" @click="closeEditModal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveEdit" novalidate>
            <div class="mb-4">
              <label class="modal-label block mb-1">نام کاربر</label>
              <input type="text" placeholder="نام کاربر را وارد کنید" class="modal-input" v-model="editName" />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">ایمیل</label>
              <input type="email" placeholder="ایمیل را وارد کنید" class="modal-input" v-model="editEmail" />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">شماره تلفن</label>
              <input type="text" placeholder="شماره تلفن را وارد کنید" class="modal-input" v-model="editPhone" />
            </div>
            <div class="mb-6">
              <label class="modal-label block mb-1">نقش کاربر</label>
              <select class="modal-input" v-model="editRole">
                <option value="user">کاربر عادی</option>
                <option value="admin">ادمین</option>
                <option value="super_admin">سوپر ادمین</option>
              </select>
            </div>

            <div v-if="editError" class="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ editError }}</span>
            </div>

            <div class="flex gap-3">
              <button type="button" class="flex-1 px-4 py-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-medium" @click="closeEditModal">
                انصراف
              </button>
              <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2" :disabled="editSaving">
                <span>{{ editSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}</span>
                <svg v-if="editSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Add Admin Modal -->
    <Teleport to="body">
      <div v-if="addModalOpen" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-box">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              افزودن ادمین جدید
            </h3>
            <button class="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg" @click="closeAddModal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveAdd" novalidate>
            <div class="mb-4">
              <label class="modal-label block mb-1">نام کامل <span class="text-red-400">*</span></label>
              <input type="text" placeholder="نام ادمین را وارد کنید" class="modal-input" v-model="addName" required />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">ایمیل <span class="text-red-400">*</span></label>
              <input type="email" placeholder="ایمیل را وارد کنید" class="modal-input" v-model="addEmail" required />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">شماره تلفن</label>
              <input type="text" placeholder="شماره تلفن را وارد کنید" class="modal-input" v-model="addPhone" />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">رمز عبور <span class="text-red-400">*</span></label>
              <input type="password" placeholder="رمز عبور را وارد کنید (حداقل ۸ کاراکتر)" class="modal-input" v-model="addPassword" required minlength="8" />
            </div>
            <div class="mb-4">
              <label class="modal-label block mb-1">تأیید رمز عبور <span class="text-red-400">*</span></label>
              <input type="password" placeholder="رمز عبور را مجدداً وارد کنید" class="modal-input" v-model="addPasswordConfirm" required />
            </div>

            <div v-if="addError" class="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ addError }}</span>
            </div>

            <div class="flex gap-3">
              <button type="button" class="flex-1 px-4 py-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-medium" @click="closeAddModal">
                انصراف
              </button>
              <button type="submit" class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2" :disabled="addSaving">
                <span>{{ addSaving ? 'در حال ایجاد...' : 'ایجاد ادمین' }}</span>
                <svg v-if="addSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="deleteModalOpen" class="confirm-overlay" @click.self="closeDeleteConfirm">
        <div class="confirm-box">
          <div class="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-white text-lg font-bold mb-2">حذف کاربر</h3>
          <p class="text-white/50 text-sm mb-2">آیا مطمئن هستید؟</p>
          <p class="text-red-300 text-sm font-medium mb-6">«{{ deleteTargetName }}» حذف خواهد شد و این عملیات قابل بازگشت نیست.</p>
          <div class="flex gap-3">
            <button class="flex-1 px-4 py-2.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-medium" @click="closeDeleteConfirm">
              انصراف
            </button>
            <button class="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl transition-all text-sm font-semibold flex items-center justify-center gap-2" @click="confirmDelete">
              بله، حذف شود
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <div class="toast" :class="[toastVisible ? 'show' : '', `toast-${toastType}`]">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path v-if="toastType === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        <path v-else stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
/* ===== CSS VARIABLES ===== */
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e3a5f;
  --bg-tertiary: #0c4a6e;
  --text-primary: #cbd5e1;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-red: #ef4444;
  --z-modal: 200;
  --z-confirm: 300;
  --z-tooltip: 99999;
  --z-toast: 9999;
  --blur-amount: 20px;
  --radius-default: 12px;
}

* { font-family: 'Vazirmatn', system-ui, sans-serif; }

.admins-page {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%);
  min-height: 100vh;
  min-height: 100dvh;
}

html { overflow-y: auto; height: auto; scroll-behavior: smooth; }

.main-body {
  margin-right: 64px;
  padding: 24px;
  transition: all 0.3s ease;
}

@media (min-width: 1024px) { .main-body { padding: 32px; } }

/* ===== KEYFRAMES ===== */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

/* ===== GLASS EFFECTS ===== */
.glass-effect {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform;
}

/* ===== USER CARDS (MOBILE) ===== */
.user-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}
.user-card:last-child { margin-bottom: 0; }
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.user-card-avatar {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px; color: white; flex-shrink: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.user-card-info { flex: 1; min-width: 0; }
.user-card-name {
  color: #ffffff; font-weight: 600; font-size: 15px;
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
}
.user-card-email {
  color: rgba(147, 197, 253, 0.7); font-size: 13px;
  word-break: break-all; direction: ltr; text-align: left;
}
.user-card-phone { color: rgba(255, 255, 255, 0.3); font-size: 12px; direction: ltr; text-align: left; }

.user-card-details {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.user-card-detail-label {
  color: rgba(147, 197, 253, 0.5); font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.user-card-detail-value { color: rgba(255, 255, 255, 0.8); font-size: 14px; font-weight: 400; }

.user-card-actions {
  display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end;
  padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.user-card-actions .btn-action { padding: 8px 16px; font-size: 13px; }

/* ===== ROLE BADGES ===== */
.role-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 20px; font-size: 11px;
  font-weight: 600; white-space: nowrap;
}
.role-super_admin { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.role-admin { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.role-user { background: rgba(100, 116, 139, 0.2); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3); }

/* ===== SKELETON ===== */
.skeleton {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 1000px 100%; animation: shimmer 1.5s infinite; border-radius: 8px;
}
.skeleton-card {
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px; padding: 16px; margin-bottom: 12px;
}
.skeleton-card:last-child { margin-bottom: 0; }
.skeleton.w-10 { width: 40px; } .skeleton.w-12 { width: 48px; } .skeleton.w-16 { width: 64px; }
.skeleton.w-14 { width: 56px; } .skeleton.w-18 { width: 72px; } .skeleton.w-20 { width: 80px; }
.skeleton.w-22 { width: 88px; } .skeleton.w-24 { width: 96px; } .skeleton.w-26 { width: 104px; }
.skeleton.w-28 { width: 112px; } .skeleton.w-32 { width: 128px; } .skeleton.w-36 { width: 144px; }
.skeleton.h-3 { height: 12px; } .skeleton.h-3\.5 { height: 14px; } .skeleton.h-4 { height: 16px; }
.skeleton.h-5 { height: 20px; } .skeleton.h-6 { height: 24px; } .skeleton.h-8 { height: 32px; }
.skeleton.h-9 { height: 36px; }
.skeleton.rounded { border-radius: 8px; } .skeleton.rounded-full { border-radius: 9999px; }
.skeleton.rounded-lg { border-radius: 12px; } .skeleton.rounded-xl { border-radius: 16px; }

/* ===== FILTERS ===== */
.filter-input {
  background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-default); padding: 10px 16px; color: white;
  font-size: 14px; outline: none; transition: all 0.2s ease; width: 100%;
}
.filter-input::placeholder { color: rgba(255, 255, 255, 0.4); }
.filter-input:focus { border-color: rgba(59, 130, 246, 0.6); background: rgba(255, 255, 255, 0.12); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
.filter-input option { background: #1e293b; color: white; }

/* ===== BUTTONS ===== */
.btn-action {
  padding: 6px 14px; border-radius: 10px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s ease; border: none;
  display: inline-flex; align-items: center; gap: 5px;
}
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-edit { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
@media (hover: hover) { .btn-edit:hover:not(:disabled) { background: rgba(59, 130, 246, 0.35); transform: translateY(-1px); } }
.btn-delete { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
@media (hover: hover) { .btn-delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.35); transform: translateY(-1px); } }

/* ===== MODAL ===== */
.modal-overlay {
  display: flex; position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px); z-index: var(--z-modal);
  align-items: center; justify-content: center;
}
.modal-box {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px; padding: 32px; width: 90%; max-width: 480px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-input {
  width: 100%; background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-default); padding: 11px 14px; color: white;
  font-size: 14px; outline: none; transition: all 0.2s ease; margin-top: 6px;
}
.modal-input::placeholder { color: rgba(255, 255, 255, 0.3); }
.modal-input:focus { border-color: rgba(59, 130, 246, 0.6); background: rgba(255, 255, 255, 0.12); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
.modal-input option { background: #1e293b; color: white; }
.modal-label { color: rgba(255, 255, 255, 0.7); font-size: 13px; font-weight: 500; }

/* ===== CONFIRM ===== */
.confirm-overlay {
  display: flex; position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px); z-index: var(--z-confirm);
  align-items: center; justify-content: center;
}
.confirm-box {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 20px; padding: 28px; width: 90%; max-width: 380px;
  text-align: center; animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== TOAST ===== */
.toast {
  position: fixed; bottom: 24px; left: 24px; z-index: var(--z-toast);
  padding: 14px 20px; border-radius: 14px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  animation: fadeInUp 0.3s ease; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease; transform: translateY(100px); opacity: 0;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-success { background: linear-gradient(135deg, #059669, #047857); color: white; }
.toast-error { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; }

/* ===== USER AVATAR (desktop) ===== */
.user-avatar {
  width: 38px; height: 38px; border-radius: var(--radius-default);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0; color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.empty-state { text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.4); }

/* ===== PAGINATION ===== */
.page-btn {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; cursor: pointer; transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
}
@media (hover: hover) {
  .page-btn:hover:not(:disabled):not(.cursor-default) {
    background: rgba(59, 130, 246, 0.2); color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.3);
  }
}
.page-btn.active {
  background: linear-gradient(135deg, var(--accent-blue), #2563eb);
  color: white; border-color: transparent;
}
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ===== DESKTOP ===== */
@media (min-width: 769px) {
  .md\:hidden { display: none !important; }
  .hidden.md\:grid { display: grid !important; }
  .hidden.md\:block { display: block !important; }
}

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .md\:hidden { display: block !important; }
  .hidden.md\:grid { display: none !important; }
  .hidden.md\:block { display: none !important; }
  .flex-col.sm\:flex-row { flex-direction: column !important; gap: 10px !important; }
  .flex-col.sm\:flex-row .flex.gap-3 { flex-wrap: wrap !important; gap: 6px !important; }
  .flex-col.sm\:flex-row .glass-effect { min-width: 60px !important; padding: 8px 12px !important; }
  .flex-col.sm\:flex-row .glass-effect .text-xl { font-size: 18px !important; }
  .modal-box { padding: 24px 20px; max-width: 95%; margin: 16px; }
}

@media (max-width: 480px) {
  .user-card-details { grid-template-columns: 1fr; gap: 4px; }
  .user-card-detail-label { display: inline-block; width: 80px; }
}
</style>
