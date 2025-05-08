// Login Page

<template>
  <v-container fluid class="fill-height bg-login">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 rounded-lg">
          <v-card-title class="text-center pa-6 bg-primary">
            <h2 class="text-h4 text-white font-weight-medium">HostingBot Admin</h2>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <h3 class="text-h6 text-center mb-4">Login ke Dashboard Admin</h3>
            
            <!-- Alert untuk error -->
            <v-alert
              v-if="authStore.error"
              type="error"
              class="mb-4"
              closable
              @click:close="authStore.error = null"
            >
              {{ authStore.error }}
            </v-alert>
            
            <v-form @submit.prevent="login" ref="form">
              <v-text-field
                v-model="username"
                label="Username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :rules="[rules.required]"
                autofocus
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                :rules="[rules.required]"
              ></v-text-field>
              
              <div class="d-flex align-center justify-space-between mb-4">
                <v-checkbox
                  v-model="rememberMe"
                  label="Ingat saya"
                  color="primary"
                  hide-details
                ></v-checkbox>
                
                <a href="#" class="text-decoration-none text-primary">Lupa password?</a>
              </div>
              
              <v-btn
                block
                color="primary"
                size="large"
                type="submit"
                :loading="authStore.loading"
                class="mb-4"
              >
                Login
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="justify-center pb-6">
            <p class="text-caption text-center text-medium-emphasis">
              &copy; {{ new Date().getFullYear() }} HostingBot Admin Panel
            </p>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

export default {
  name: 'Login',
  
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const form = ref(null);
    const username = ref('');
    const password = ref('');
    const showPassword = ref(false);
    const rememberMe = ref(false);
    
    const rules = {
      required: value => !!value || 'Kolom ini wajib diisi',
    };
    
    // Cek apakah sudah login
    onMounted(() => {
      if (authStore.isAuthenticated) {
        router.push('/');
      }
    });
    
    const login = async () => {
      // Validasi form
      const { valid } = await form.value.validate();
      
      if (valid) {
        const success = await authStore.login(
          username.value,
          password.value,
          rememberMe.value
        );
        
        if (success) {
          router.push('/');
        }
      }
    };
    
    return {
      form,
      username,
      password,
      showPassword,
      rememberMe,
      authStore,
      rules,
      login
    };
  }
};
</script>

<style scoped>
.bg-login {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
}
</style>
