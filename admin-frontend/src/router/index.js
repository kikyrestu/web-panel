// Router configuration
import Dashboard from '../views/Dashboard.vue'
import MainLayout from '../layouts/MainLayout.vue'

// Lazy loaded components (akan dimuat hanya saat dibutuhkan)
const Login = () => import('../views/Login.vue')
const VpsManagement = () => import('../views/VpsManagement.vue')
const WebHostingManagement = () => import('../views/WebHostingManagement.vue')
const GameHostingManagement = () => import('../views/GameHostingManagement.vue')
const OrderManagement = () => import('../views/OrderManagement.vue')
const UserManagement = () => import('../views/UserManagement.vue')
const Settings = () => import('../views/Settings.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
      },
      {
        path: 'vps',
        name: 'VpsManagement',
        component: VpsManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'webhosting',
        name: 'WebHostingManagement', 
        component: WebHostingManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'gamehosting',
        name: 'GameHostingManagement',
        component: GameHostingManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'OrderManagement',
        component: OrderManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

export default routes
