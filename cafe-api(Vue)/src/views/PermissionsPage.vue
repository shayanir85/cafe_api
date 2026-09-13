<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import { getPermissions, createRole, deleteRole, syncPermissions } from '@/services/roles'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const auth = useAuthStore()
const rolesStore = useRolesStore()
const sidebarOpen = ref(localStorage.getItem('admin_sidebar') === '1')

if (!auth.isSuperAdmin) {
  router.push(auth.user ? '/dashboard' : '/login')
}

const allPermissions = ref([])
const loading = ref(true)
const saving = ref(false)
const activeRoleId = ref(null)

const toastMessage = ref('')
const toastVisible = ref(false)
const toastType = ref('success')

function showToast(msg, type = 'success') {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

const addModalOpen = ref(false)
const newName = ref('')
const newPerms = ref([])

const deleteTarget = ref(null)

const permLabels = {
  'manage-users': { text: 'مدیریت کاربران', icon: 'fa-users-gear', color: '#60a5fa' },
  'manage-roles': { text: 'مدیریت نقش‌ها و دسترسی‌ها', icon: 'fa-shield-halved', color: '#a855f7' },
  'manage-categories': { text: 'مدیریت دسته‌بندی‌ها', icon: 'fa-folder-tree', color: '#f59e0b' },
  'manage-menu-items': { text: 'مدیریت آیتم‌های منو', icon: 'fa-utensils', color: '#34d399' },
  'manage-orders': { text: 'مدیریت سفارشات', icon: 'fa-bell-concierge', color: '#f97316' },
  'view-dashboard': { text: 'مشاهده داشبورد', icon: 'fa-gauge-high', color: '#22d3ee' },
  'toggle-cafe': { text: 'باز/بسته کردن کافه', icon: 'fa-power-off', color: '#ef4444' },
}

const activeRole = computed(() => rolesStore.roles.find(r => r.id === activeRoleId.value))

function togglePerm(perm) {
  if (!activeRole.value) return
  const perms = activeRole.value.permissions.map(p => p.name || p)
  const idx = perms.indexOf(perm)
  if (idx >= 0) {
    perms.splice(idx, 1)
  } else {
    perms.push(perm)
  }
  activeRole.value.permissions = perms.map(p => ({ name: p }))
}

function hasPerm(perm) {
  if (!activeRole.value) return false
  return activeRole.value.permissions.some(p => (p.name || p) === perm)
}

async function savePermChanges() {
  if (!activeRole.value) return
  saving.value = true
  try {
    const perms = activeRole.value.permissions.map(p => p.name || p)
    await syncPermissions(activeRole.value.id, perms)
    showToast(`دسترسی‌های نقش "${activeRole.value.name}" بروزرسانی شد`)
  } catch {
    showToast('خطا در بروزرسانی دسترسی‌ها', 'error')
  } finally {
    saving.value = false
  }
}

async function handleAddRole() {
  if (!newName.value.trim()) {
    showToast('نام نقش را وارد کنید', 'error')
    return
  }
  saving.value = true
  try {
    const result = await createRole(newName.value.trim(), newPerms.value)
    rolesStore.roles.push(result.data)
    newName.value = ''
    newPerms.value = []
    addModalOpen.value = false
    showToast('نقش جدید ایجاد شد')
  } catch (e) {
    let msg = 'خطا در ایجاد نقش'
    const data = e.response?.data
    if (data?.message && typeof data.message === 'string') {
      msg = data.message
    } else if (data?.errors) {
      const errs = data.errors
      const firstKey = Object.keys(errs)[0]
      if (firstKey && Array.isArray(errs[firstKey])) {
        msg = errs[firstKey][0]
      }
    }
    showToast(msg, 'error')
  } finally {
    saving.value = false
  }
}

async function handleDeleteRole() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await deleteRole(deleteTarget.value.id)
    rolesStore.roles = rolesStore.roles.filter(r => r.id !== deleteTarget.value.id)
    if (activeRoleId.value === deleteTarget.value.id) {
      activeRoleId.value = rolesStore.roles[0]?.id || null
    }
    deleteTarget.value = null
    showToast('نقش حذف شد')
  } catch {
    showToast('خطا در حذف نقش', 'error')
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([rolesStore.load(), getPermissions().then(res => {
      allPermissions.value = res.data || []
    })])
    if (rolesStore.roles.length && !activeRoleId.value) {
      activeRoleId.value = rolesStore.roles[0].id
    }
  } catch {
    showToast('خطا در بارگذاری اطلاعات', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="perms-page">
    <AdminSidebar v-model="sidebarOpen" />

    <header class="header" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="header-content">
        <h1 class="header-title">
          <i class="fa-solid fa-shield-halved header-icon"></i>
          <span>مدیریت دسترسی‌ها</span>
        </h1>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="loadData(); showToast('بروزرسانی شد')">
            <i class="fa-solid fa-rotate"></i>
          </button>
          <button class="btn btn-primary" @click="addModalOpen = true">
            <i class="fa-solid fa-plus"></i>
            <span>نقش جدید</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-body" :style="{ marginRight: sidebarOpen ? '320px' : '64px' }">
      <div class="content-wrap fade-in-up">

        <div v-if="loading" class="empty-state">
          <div class="loading-spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>

        <template v-else>
          <div class="layout">
            <!-- Roles list -->
            <div class="roles-panel">
              <h2 class="panel-title">نقش‌ها</h2>
              <div class="roles-list">
                <button
                  v-for="role in rolesStore.roles"
                  :key="role.id"
                  class="role-item"
                  :class="{ active: activeRoleId === role.id }"
                  @click="activeRoleId = role.id">
                  <div class="role-info">
                    <i class="fa-solid fa-shield role-icon"></i>
                    <span class="role-name">{{ role.name }}</span>
                  </div>
                  <span class="role-count">{{ role.permissions?.length || 0 }}</span>
                </button>
              </div>
            </div>

            <!-- Permissions panel -->
            <div class="perms-panel">
              <template v-if="activeRole">
                <div class="perms-header">
                  <h2 class="panel-title">
                    دسترسی‌های {{ activeRole.name }}
                  </h2>
                  <button
                    class="btn btn-primary btn-sm"
                    :disabled="saving"
                    @click="savePermChanges">
                    <i class="fa-solid fa-check"></i>
                    {{ saving ? 'در حال ذخیره...' : 'ذخیره' }}
                  </button>
                </div>

                <div class="perms-grid">
                  <div
                    v-for="perm in allPermissions"
                    :key="perm.id"
                    class="perm-card"
                    :class="{ checked: hasPerm(perm.name) }"
                    @click="togglePerm(perm.name)">
                    <div class="perm-check">
                      <i class="fa-solid" :class="hasPerm(perm.name) ? 'fa-check-square' : 'fa-square'"></i>
                    </div>
                    <div class="perm-icon" :style="{ background: (permLabels[perm.name]?.color || '#666') + '20', color: permLabels[perm.name]?.color || '#666' }">
                      <i class="fa-solid" :class="permLabels[perm.name]?.icon || 'fa-key'"></i>
                    </div>
                    <div class="perm-details">
                      <span class="perm-name">{{ permLabels[perm.name]?.text || perm.name }}</span>
                      <span class="perm-slug">{{ perm.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="perms-footer">
                  <button class="btn btn-danger-ghost" @click="deleteTarget = activeRole">
                    <i class="fa-solid fa-trash"></i>
                    حذف نقش {{ activeRole.name }}
                  </button>
                </div>
              </template>

              <div v-else class="empty-state">
                <i class="fa-solid fa-shield-halved empty-icon"></i>
                <p>یک نقش را انتخاب کنید</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- Add role modal -->
    <div v-if="addModalOpen" class="modal-overlay" @click.self="addModalOpen = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid fa-plus" style="color: #34d399;"></i>
            ایجاد نقش جدید
          </h3>
          <button class="modal-close" @click="addModalOpen = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>نام نقش</label>
            <input
              v-model="newName"
              type="text"
              class="form-input"
              placeholder="مثال: cashier"
              @keyup.enter="handleAddRole">
          </div>

          <div class="form-group">
            <label>دسترسی‌ها</label>
            <div class="new-perms-grid">
              <label
                v-for="perm in allPermissions"
                :key="perm.id"
                class="new-perm-item"
                :class="{ checked: newPerms.includes(perm.name) }">
                <input
                  type="checkbox"
                  :value="perm.name"
                  v-model="newPerms"
                  class="hidden">
                <i class="fa-solid" :class="newPerms.includes(perm.name) ? 'fa-check-square' : 'fa-square'"></i>
                {{ permLabels[perm.name]?.text || perm.name }}
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="addModalOpen = false">انصراف</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleAddRole">
            {{ saving ? 'در حال ایجاد...' : 'ایجاد نقش' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
            حذف نقش
          </h3>
          <button class="modal-close" @click="deleteTarget = null">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-white/70">
            آیا مطمئن هستید که می‌خواهید نقش <strong class="text-white">{{ deleteTarget.name }}</strong> را حذف کنید؟
          </p>
          <p class="text-white/40 text-sm mt-2">کاربرانی که این نقش را دارند، دسترسی‌های آن را از دست خواهند داد.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="deleteTarget = null">انصراف</button>
          <button class="btn btn-danger" :disabled="saving" @click="handleDeleteRole">
            {{ saving ? 'در حال حذف...' : 'حذف' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" :class="[toastVisible ? 'show' : '', `toast-${toastType}`]">
      <i class="fa-solid" :class="toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.perms-page {
  font-family: 'Vazirmatn', system-ui, sans-serif;
  background: #0F0F0F;
  min-height: 100vh;
}

.header {
  position: sticky; top: 0; z-index: 40;
  background: rgba(26,26,26,0.95); backdrop-filter: blur(20px);
  border-bottom: 1px solid #333;
  transition: margin-right 0.3s ease;
}
.header-content {
  max-width: 1200px; margin: 0 auto; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.header-title { font-size: 17px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
.header-icon { color: #a855f7; font-size: 18px; }
.header-actions { display: flex; gap: 8px; }
@media (min-width: 640px) { .header-title { font-size: 20px; } .header-icon { font-size: 20px; } }

.main-body {
  padding: 24px 16px 80px;
  transition: margin-right 0.3s ease;
}
.content-wrap {
  max-width: 1100px;
  margin: 0 auto;
}

.fade-in-up { animation: fadeInUp 0.5s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.layout {
  display: grid; grid-template-columns: 1fr; gap: 20px;
}
@media (min-width: 768px) { .layout { grid-template-columns: 240px 1fr; } }

.panel-title {
  font-size: 15px; font-weight: 700; color: white; margin-bottom: 16px;
}

/* Roles panel */
.roles-panel {
  background: rgba(30,30,30,0.6); border: 1px solid #333; border-radius: 16px; padding: 16px;
}
.roles-list { display: flex; flex-direction: column; gap: 4px; }
.role-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 10px; border: 1px solid transparent;
  background: transparent; cursor: pointer; transition: all 0.2s;
  color: rgba(255,255,255,0.6); width: 100%; text-align: right;
}
.role-item:hover { background: rgba(255,255,255,0.05); color: white; }
.role-item.active { background: rgba(168,85,247,0.12); color: white; border-color: rgba(168,85,247,0.3); }
.role-info { display: flex; align-items: center; gap: 8px; }
.role-icon { font-size: 14px; color: #a855f7; }
.role-name { font-size: 14px; font-weight: 600; }
.role-count {
  background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 8px;
  font-size: 11px; font-weight: 600; min-width: 24px; text-align: center;
}

/* Permissions panel */
.perms-panel {
  background: rgba(30,30,30,0.6); border: 1px solid #333; border-radius: 16px; padding: 20px;
  min-height: 300px;
}
.perms-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.perms-header .panel-title { margin-bottom: 0; }

.perms-grid {
  display: grid; grid-template-columns: 1fr; gap: 8px;
}
@media (min-width: 640px) { .perms-grid { grid-template-columns: 1fr 1fr; } }

.perm-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  cursor: pointer; transition: all 0.2s;
}
@media (hover: hover) { .perm-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); } }
.perm-card.checked { border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.06); }

.perm-check {
  color: rgba(255,255,255,0.2); font-size: 18px; flex-shrink: 0;
}
.perm-card.checked .perm-check { color: #34d399; }

.perm-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.perm-details { display: flex; flex-direction: column; gap: 2px; }
.perm-name { font-size: 13px; font-weight: 600; color: white; }
.perm-slug { font-size: 11px; color: rgba(255,255,255,0.3); direction: ltr; text-align: left; }

.perms-footer {
  margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
}

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: all 0.3s ease; border: none; white-space: nowrap;
}
@media (min-width: 640px) { .btn { padding: 11px 22px; font-size: 14px; border-radius: 12px; } }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; }
@media (hover: hover) { .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(168,85,247,0.4); } }
.btn-secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.1); }
.btn-secondary:hover { background: rgba(255,255,255,0.15); }
.btn-sm { padding: 7px 14px; font-size: 12px; }
.btn-danger { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.btn-danger:hover { background: rgba(239,68,68,0.3); }
.btn-danger-ghost { background: transparent; color: rgba(239,68,68,0.7); border: 1px solid rgba(239,68,68,0.2); font-size: 12px; padding: 8px 14px; }
.btn-danger-ghost:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px;
}
.modal-content {
  background: #1A1A1A; border: 1px solid #333; border-radius: 16px;
  padding: 20px; width: 100%; max-width: 500px; max-height: 85vh; overflow-y: auto;
}
.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-size: 17px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; }
.modal-close { color: rgba(255,255,255,0.5); background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px; }
.modal-close:hover { color: white; }
.modal-body { margin-bottom: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.form-input {
  width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; outline: none;
}
.form-input:focus { border-color: #a855f7; }

.new-perms-grid { display: flex; flex-direction: column; gap: 6px; }
.new-perm-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
  cursor: pointer; transition: all 0.2s; color: rgba(255,255,255,0.5); font-size: 13px;
}
.new-perm-item:hover { background: rgba(255,255,255,0.05); color: white; }
.new-perm-item.checked { color: white; background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2); }
.hidden { position: absolute; opacity: 0; pointer-events: none; }

.error-text { color: #ef4444; font-size: 13px; margin-top: 8px; }

.empty-state { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.3); }
.empty-icon { font-size: 40px; margin-bottom: 10px; display: block; }
.loading-spinner {
  width: 32px; height: 32px; margin: 0 auto 12px;
  border: 3px solid rgba(168,85,247,0.2); border-top-color: #a855f7;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 10px; color: white;
  font-size: 13px; font-weight: 500; white-space: nowrap;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s;
  transform: translateX(-50%) translateY(20px);
}
.toast.show { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
</style>
