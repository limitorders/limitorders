import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Markets from '../views/Markets.vue'
import Taker from '../views/Taker.vue'
import Maker from '../views/Maker.vue'
const routes = [
  { path: "/", component: Home },
  { path: "/markets", component: Markets },
  { path: "/taker", component: Taker },
  { path: "/maker", component: Maker }]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
