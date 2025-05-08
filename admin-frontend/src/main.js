import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import './style.css'

// Import routes
import routes from './router'

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        }
      }
    }
  }
})

// Create Pinia instance
const pinia = createPinia()

// Create and mount app
const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(pinia)

// Setup auth store and navigation guards
import { useAuthStore } from './store/auth'

// Setup navigation guards after pinia is installed
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if the route requires auth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Check if user is authenticated
  const isAuthenticated = authStore.isAuthenticated
  
  // If route requires auth and user is not authenticated, redirect to login
  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } 
  // If user is authenticated and trying to access login page, redirect to dashboard
  else if (isAuthenticated && to.path === '/login') {
    next('/')
  } 
  // Otherwise continue to the requested route
  else {
    next()
  }
})

// Setup auth interceptors
const authStore = useAuthStore()
authStore.setupInterceptors()
authStore.checkAuth()

app.mount('#app')
