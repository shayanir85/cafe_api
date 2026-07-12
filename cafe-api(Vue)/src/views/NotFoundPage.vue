<script setup>
import { useRouter } from 'vue-router'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'

const router = useRouter()
</script>

<template>
  <BackgroundBlobs />

  <div class="error-container page-enter">
    <div class="coffee-icon">
      <i class="fas fa-mug-hot"></i>
    </div>
    <div class="steam">
      <span class="steam-line s1"></span>
      <span class="steam-line s2"></span>
      <span class="steam-line s3"></span>
      <span class="steam-line s4"></span>
    </div>

    <div class="error-code">404</div>

    <h1 class="error-title">اوه! صفحه‌ای که دنبالش هستی پیدا نشد!</h1>

    <p class="error-description">
      متأسفیم، صفحه‌ای که به دنبال آن هستید ممکن است حذف شده باشد، نام آن تغییر کرده باشد<br>
      یا به طور موقت در دسترس نباشد.
    </p>

    <div class="btn-group">
      <router-link to="/" class="btn-primary">
        <i class="fas fa-home"></i>
        بازگشت به صفحه منو
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.error-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 10;
  text-align: center;
}

.error-code {
  font-size: 140px;
  font-weight: 900;
  background: linear-gradient(135deg, #f59e0b, #d97706, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 60px rgba(245, 158, 11, 0.3);
  line-height: 1;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { text-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
  50% { text-shadow: 0 0 50px rgba(245, 158, 11, 0.6); }
}

@media (min-width: 640px) {
  .error-code {
    font-size: 200px;
  }
}

.coffee-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.coffee-icon i {
  font-size: 40px;
  color: #1a0e0a;
}

.steam {
  position: relative;
  margin-top: -30px;
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.steam-line {
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(to top, rgba(245, 158, 11, 0.5), transparent);
  animation: steamRise 2.2s ease-in-out infinite;
}

.steam-line.s1 { height: 20px; animation-delay: 0s; }
.steam-line.s2 { height: 15px; animation-delay: 0.7s; }
.steam-line.s3 { height: 18px; animation-delay: 1.4s; }
.steam-line.s4 { height: 12px; animation-delay: 1s; }

@keyframes steamRise {
  0% { transform: translateY(0) scaleX(1); opacity: 0.6; }
  60% { transform: translateY(-15px) scaleX(0.5); opacity: 0.3; }
  100% { transform: translateY(-25px) scaleX(0.2); opacity: 0; }
}

.error-title {
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
}

@media (min-width: 640px) {
  .error-title {
    font-size: 36px;
  }
}

.error-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 30px;
}

@media (min-width: 640px) {
  .error-description {
    font-size: 18px;
  }
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #1a0e0a;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.page-enter {
  animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
