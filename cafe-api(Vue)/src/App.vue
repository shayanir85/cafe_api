<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap');

html, body {
  background: #0f0a08;
  min-height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Vazirmatn', system-ui, sans-serif;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.25); border-radius: 20px; }

::selection {
  background: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.hidden { display: none !important; }
</style>
