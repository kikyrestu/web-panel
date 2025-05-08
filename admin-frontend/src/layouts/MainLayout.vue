<template>
  <v-app>
    <!-- App Bar (Header) -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>HostingBot Admin</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Notifications -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-badge dot color="error">
              <v-icon>mdi-bell-outline</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-list>
          <v-list-subheader>Notifikasi</v-list-subheader>
          <v-list-item
            v-for="(notification, index) in notifications"
            :key="index"
            :title="notification.title"
            :subtitle="notification.text"
            lines="two"
          >
            <template v-slot:prepend>
              <v-avatar :color="notification.color">
                <v-icon dark>{{ notification.icon }}</v-icon>
              </v-avatar>
            </template>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item to="/notifications">
            <v-list-item-title class="text-center">Lihat Semua Notifikasi</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <!-- User menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="36">
              <v-icon>mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/profile">
            <v-list-item-title>
              <v-icon left>mdi-account</v-icon>
              Profil
            </v-list-item-title>
          </v-list-item>
          <v-list-item to="/settings">
            <v-list-item-title>
              <v-icon left>mdi-cog</v-icon>
              Pengaturan
            </v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon left>mdi-logout</v-icon>
              Logout
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <!-- Theme toggle -->
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item class="px-2">
          <v-list-item-avatar>
            <v-img src="/logo.png" alt="HostingBot"></v-img>
          </v-list-item-avatar>
          <v-list-item-title class="text-h6">
            HostingBot
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <!-- Navigation Menu -->
      <v-list nav>
        <v-list-item
          v-for="(item, i) in menuItems"
          :key="i"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.title"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app class="pa-4">
      <div>
        &copy; {{ new Date().getFullYear() }} — <strong>HostingBot Admin</strong>
      </div>
      <v-spacer></v-spacer>
      <div>Versi 1.0.0</div>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'MainLayout',
  
  data() {
    return {
      drawer: true,
      isDarkTheme: false,
      notifications: [
        {
          title: 'Order Baru',
          text: 'Ada pesanan VPS baru dari user @johndoe',
          icon: 'mdi-cart',
          color: 'success'
        },
        {
          title: 'Pembayaran Masuk',
          text: 'Pembayaran untuk order #1234 telah diterima',
          icon: 'mdi-currency-usd',
          color: 'primary' 
        },
        {
          title: 'Server Down',
          text: 'Server VPS-01 tidak dapat dijangkau',
          icon: 'mdi-alert-circle',
          color: 'error'
        }
      ],
      menuItems: [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
        { title: 'VPS Hosting', icon: 'mdi-server', to: '/vps' },
        { title: 'Web Hosting', icon: 'mdi-web', to: '/webhosting' },
        { title: 'Game Hosting', icon: 'mdi-gamepad-variant', to: '/gamehosting' },
        { title: 'Pesanan', icon: 'mdi-cart', to: '/orders' },
        { title: 'Pengguna', icon: 'mdi-account-group', to: '/users' },
        { title: 'Pengaturan', icon: 'mdi-cog', to: '/settings' }
      ]
    }
  },
  
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
      this.$vuetify.theme.global.name = this.isDarkTheme ? 'dark' : 'light'
    },
    
    logout() {
      // Implementasi logout di sini
      console.log('Logout')
      // Redirect ke halaman login
      this.$router.push('/login')
    }
  }
}
</script>
