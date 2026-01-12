<template>
  <div class="container">
    <h1>Gerar Cupom</h1>
    <FormularioCupom />
  </div>
</template>

<script setup>
import FormularioCupom from '../components/FormularioCupom.vue';
</script>

<style scoped>
.container {
  width: 80%;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
h1 {
  width: 100%;
  margin-bottom: 20px;
}
</style>
