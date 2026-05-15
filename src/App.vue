<template>
  <div id="app-root" class="app-root">
    <router-view />
  </div>
</template>

<script setup>
// App.vue 是根组件，只负责路由出口
// 具体页面逻辑在 pages/ 目录下
</script>

<style>
/* 全局重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
</style>
