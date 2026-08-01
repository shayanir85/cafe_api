<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'

onMounted(() => {
  // Apply saved theme on mount
  const isDark = localStorage.getItem('darkMode') !== 'false'
  const fontSize = localStorage.getItem('fontSize') || 'normal'
  const sidebarCompact = localStorage.getItem('sidebarCompact') === 'true'

  if (isDark) {
    document.documentElement.classList.remove('light-mode')
  } else {
    document.documentElement.classList.add('light-mode')
  }

  document.documentElement.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge')
  document.documentElement.classList.add(`font-${fontSize}`)

  if (sidebarCompact) {
    document.documentElement.classList.add('sidebar-compact')
  }
})
</script>

<template>
  <RouterView />
</template>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap');

  html {
    background: var(--bg-primary, #0F0F0F);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
  }

  body {
    background: var(--bg-primary, #0F0F0F);
    color: var(--text-primary, #FFFFFF);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Vazirmatn', system-ui, sans-serif;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--accent, #C69C6D); border-radius: 20px; opacity: 0.4; }

  ::selection {
    background: var(--accent-bg, rgba(198, 156, 109, 0.3));
    color: var(--accent, #C69C6D);
  }

  .hidden { display: none !important; }
</style>
