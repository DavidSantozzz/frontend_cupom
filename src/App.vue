<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <div class="logo">
        <router-link to="/">
          <img src="./assets/images/Logo.svg" alt="" />
        </router-link>
      </div>
      <div class="menu">
        <ul>
          <li><RouterLink to="/Procedimentos">Procedimentos</RouterLink></li>
        </ul>
        <RouterLink to="/"><button>Gerar Cupom</button></RouterLink>
      </div>
    </nav>
  </header>
  <RouterView />
</template>

<style scoped>
header {
  width: 100%;
  height: 13vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7f7f7f7;
  border-bottom: 5px solid #3791bb;
}
nav {
  width: 90%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo img {
  width: 250px;
}
.menu {
  width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.menu ul {
  width: 250px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  list-style: none;
}
.menu ul li {
  cursor: pointer;
  font-size: 16px;
  text-transform: uppercase;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  font-weight: 500;
  border-radius: 3px;
  transition: 0.5s ease;
}
.menu ul li:hover {
  background-color: #ebebeb;
}
.menu ul li a {
  text-decoration: none;
  color: #000000;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.menu button {
  width: 200px;
  height: 60px;
  background-color: #c19544;
  border: none;
  border-radius: 5px;
  color: #ffffff;
  font-size: 16px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
}
</style>
