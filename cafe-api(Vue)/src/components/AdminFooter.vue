<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <footer class="admin-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="footer-brand">پنل مدیریت کافی شاپ</span>
        <span class="footer-divider">|</span>
        <span class="footer-user">
          <i class="fa-solid fa-user"></i>
          {{ auth.user?.name || auth.user?.email || 'کاربر' }}
        </span>
      </div>
      <div class="footer-right">
        <span class="footer-copy">&copy; {{ new Date().getFullYear() }} کافی شاپ</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.admin-footer {
  position: fixed;
  bottom: 0;
  left: 64px;
  right: 0;
  z-index: 40;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 24px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.footer-brand {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.footer-divider {
  color: rgba(255, 255, 255, 0.15);
}

.footer-user {
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-user i {
  color: rgba(59, 130, 246, 0.6);
  font-size: 11px;
}

.footer-right {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
