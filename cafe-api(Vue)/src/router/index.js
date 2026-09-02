import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'menu',
    component: () => import('@/views/MenuPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrdersPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/menu-management',
    name: 'menu-management',
    component: () => import('@/views/MenuManagementPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/menu-management/add',
    name: 'add-menu-item',
    component: () => import('@/views/AddMenuPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admins',
    name: 'admins',
    component: () => import('@/views/AdminsPage.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/CheckoutPage.vue'),
  },
  {
    path: '/order/:id',
    name: 'order-tracking',
    component: () => import('@/views/OrderTrackingPage.vue'),
  },
  {
    path: '/orders-management',
    name: 'orders-management',
    component: () => import('@/views/WaiterOrdersPage.vue'),
    meta: { requiresAuth: true, requiresStaff: true },
  },
  {
    path: '/new-password',
    name: 'new-password',
    component: () => import('@/views/NewPasswordPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'login' }
  }

  if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresStaff && !auth.isStaff) {
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isLoggedIn) {
    if (auth.isAdmin) return { name: 'dashboard' }
    return { name: 'menu' }
  }
})

export default router
