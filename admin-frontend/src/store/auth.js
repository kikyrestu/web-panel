// Auth Store
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('adminToken') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
    getError: (state) => state.error
  },
  
  actions: {
    async login(username, password, rememberMe = false) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/login', {
          username,
          password,
          rememberMe
        });
        
        this.token = response.data.token;
        localStorage.setItem('adminToken', this.token);
        
        // Set default auth header for axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        // Get user info
        await this.fetchUserInfo();
        
        return true;
      } catch (error) {
        this.error = error.response?.data?.message || 'Login gagal. Silakan coba lagi.';
        console.error('Login error:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchUserInfo() {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        this.user = response.data;
        return this.user;
      } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
      }
    },
    
    async logout() {
      try {
        if (this.token) {
          await axios.post('/api/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Reset state and remove token
        this.user = null;
        this.token = null;
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
      }
    },
    
    checkAuth() {
      if (this.token && !this.user) {
        this.fetchUserInfo();
      }
    },
    
    setupInterceptors() {
      // Add a response interceptor to handle 401 errors
      axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401) {
            // Token expired or invalid
            this.logout();
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
      
      // If we have a token, set it as default
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }
});
