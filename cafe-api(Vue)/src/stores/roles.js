import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRoles as fetchRoles } from '@/services/roles'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    try {
      const data = await fetchRoles()
      roles.value = Array.isArray(data) ? data : data?.data || []
      loaded.value = true
    } catch {
      roles.value = []
    }
  }

  function $reset() {
    roles.value = []
    loaded.value = false
  }

  return { roles, loaded, load, $reset }
})
