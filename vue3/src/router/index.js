import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Read from '../views/Read.vue'
import Write from '../views/Write.vue'
import PassGen from '../views/PassGen.vue'
const routes = [
  { path: "/", component: Home },
  { path: "/passgen", component: PassGen },
  { path: "/write", component: Write },
  { path: "/read", component: Read }]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
