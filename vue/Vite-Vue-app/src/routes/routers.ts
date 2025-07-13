import { createRouter, createWebHistory } from 'vue-router';
import MasterSection from '@/layouts/MasterSection.vue';
import Dashboard from '@/views/Dashboard.vue';
import Category from '@/views/Category.vue';
import Product from '@/views/Product.vue';
import Subject from "@/views/Subject.vue";
import Teacher from "@/views/Teacher.vue";
import User from "@/views/User.vue"


const routes = [
  {
    path: '/',
    component: MasterSection,
    children: [
      {path: '/', component: Dashboard },
      { path: '/dashboard', component: Dashboard },
      { path: '/category', component: Category },
      { path: '/product', component: Product },
      { path: '/subject', component: Subject },
      { path: '/teacher', component: Teacher },
      {path: '/user', component: User}

    ]
  }
]
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})