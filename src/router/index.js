import { createRouter, createWebHistory } from 'vue-router'
import GerarCupom from '@/views/GerarCupom.vue'
import Procedimentos from '../views/Procedimentos.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'GerarCupom',
      component: GerarCupom,
    },
    {
      path: '/Procedimentos',
      name: 'procedimentos',
      component: Procedimentos,
    },
  ],
})

export default router
