import { ref } from 'vue'

export function useToast(duration = 3000) {
  const toast = ref({ show: false, message: '', type: 'success' })
  let timeout = null

  function showToast(message, type = 'success') {
    clearTimeout(timeout)
    toast.value = { show: true, message, type }
    timeout = setTimeout(() => { toast.value.show = false }, duration)
  }

  return { toast, showToast }
}
