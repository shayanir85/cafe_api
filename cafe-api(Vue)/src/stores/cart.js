import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart') || '[]'))

  const totalCount = computed(() => items.value.reduce((sum, item) => sum + (item.qty || 1), 0))

  const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.price * (item.qty || 1), 0))

  function save() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  function addItem(product) {
    const existing = items.value.find((c) => c.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({ ...product, qty: 1 })
    }
    save()
  }

  function changeQty(id, delta) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    item.qty += delta
    if (item.qty <= 0) {
      items.value = items.value.filter((i) => i.id !== id)
    }
    save()
  }

  function removeItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
    save()
  }

  function clearAll() {
    items.value = []
    save()
  }

  return { items, totalCount, subtotal, addItem, changeQty, removeItem, clearAll }
})
