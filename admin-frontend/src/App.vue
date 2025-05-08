<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Roboto', sans-serif;
}

#app {
  height: 100vh;
}

.pointer {
  cursor: pointer;
}

.float-right {
  float: right;
}
</style>
