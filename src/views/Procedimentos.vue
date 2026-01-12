<template>
  <div class="container">
    <h1>Procedimentos</h1>
    <TableProcedimentos />
  </div>
</template>

<script setup>
import TableProcedimentos from "../components/TableProcedimentos.vue"
</script>

<style scoped>
.container {
  width: 80%;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
h1 {
  width: 100%;
  margin-bottom: 20px;
}
</style>
