<template>
  <div class="logo-cup">
    <i class="fas fa-mug-hot"></i>
    <div class="steam-wrap">
      <span class="steam-line s1"></span>
      <span class="steam-line s2"></span>
      <span class="steam-line s3"></span>
    </div>
  </div>
</template>

<style scoped>
.logo-cup {
  position: relative;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a0e0a;
  font-size: 1rem;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.25);
  transition: transform 0.3s;
  flex-shrink: 0;
}

.logo-cup:hover {
  transform: scale(1.05);
}

.steam-wrap {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  pointer-events: none;
}

.steam-line {
  width: 2.5px;
  border-radius: 999px;
  background: linear-gradient(to top, rgba(245, 158, 11, 0.5), transparent);
  animation: steamRise 2.2s ease-in-out infinite;
}

.steam-line.s1 { height: 14px; animation-delay: 0s; }
.steam-line.s2 { height: 10px; animation-delay: 0.7s; }
.steam-line.s3 { height: 12px; animation-delay: 1.4s; }

@keyframes steamRise {
  0% { transform: translateY(0) scaleX(1); opacity: 1; }
  60% { transform: translateY(-8px) scaleX(0.5); opacity: 0.4; }
  100% { transform: translateY(-14px) scaleX(0.2); opacity: 0; }
}
</style>
