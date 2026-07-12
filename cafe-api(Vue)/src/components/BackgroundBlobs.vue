<template>
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>
  <div class="bg-blob"></div>
</template>

<style scoped>
.bg-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
  animation: blobFloat 20s ease-in-out infinite;
}

.bg-blob:nth-child(1) {
  width: 500px;
  height: 500px;
  background: #f59e0b;
  top: -10%;
  left: -10%;
  animation-delay: 0s;
  animation-duration: 25s;
}

.bg-blob:nth-child(2) {
  width: 400px;
  height: 400px;
  background: #d97706;
  bottom: -5%;
  right: -5%;
  animation-delay: -7s;
  animation-duration: 20s;
}

.bg-blob:nth-child(3) {
  width: 300px;
  height: 300px;
  background: #b45309;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
  animation-duration: 30s;
}

.bg-blob:nth-child(4) {
  width: 200px;
  height: 200px;
  background: #fbbf24;
  top: 20%;
  right: 15%;
  animation-delay: -3s;
  animation-duration: 18s;
}

.bg-blob:nth-child(5) {
  width: 350px;
  height: 350px;
  background: #78350f;
  bottom: 10%;
  left: 5%;
  animation-delay: -10s;
  animation-duration: 22s;
}

@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(30px, -40px) scale(1.05) rotate(5deg); }
  50% { transform: translate(-20px, 20px) scale(0.95) rotate(-3deg); }
  75% { transform: translate(40px, 30px) scale(1.02) rotate(4deg); }
}
</style>
