import { createRouter, createWebHistory } from 'vue-router'
import MasterSection from '@/layouts/MasterSection.vue'
import Dashboard from '@/views/Dashboard.vue'
import Category from '@/views/Category.vue'
import Product from '@/views/Product.vue'


const routes = [
  {
    path: '/',
    component: MasterSection,
    children: [
      { path: '/dashboard', component: Dashboard },
      { path: '/category', component: Category },
      { path: '/product', component: Product },
    ]
  }
]
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})