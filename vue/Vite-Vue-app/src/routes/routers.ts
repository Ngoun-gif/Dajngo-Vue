import { createRouter, createWebHistory } from 'vue-router';
import MasterSection from '@/layouts/MasterSection.vue';
import Dashboard from '@/views/Dashboard.vue';
import Category from '@/views/Category.vue';
import Product from '@/views/Product.vue';
import Subject from "@/views/Subject.vue";
import Teacher from "@/views/Teacher.vue";
import User from "@/views/User.vue";
import Login from '@/views/auth/Login.vue';

const routes = [
  {
    path: '/login',
    component: Login
  },
  {
    path: '/',
    component: MasterSection,
    children: [
      { path: '/', component: Dashboard, meta: { requiresAuth: true } },
      { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
      { path: '/category', component: Category, meta: { requiresAuth: true } },
      { path: '/product', component: Product, meta: { requiresAuth: true } },
      { path: '/subject', component: Subject, meta: { requiresAuth: true } },
      { path: '/teacher', component: Teacher, meta: { requiresAuth: true } },
      { path: '/user', component: User, meta: { requiresAuth: true } }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guard
router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('access_token');

  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !token) {
    next('/login');
  }
  // If already logged in and trying to access login
  else if (to.path === '/login' && token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
