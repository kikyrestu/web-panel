// Settings page

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Pengaturan Sistem</span>
            
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openAddSettingDialog"
            >
              Tambah Pengaturan
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-tabs v-model="activeTab" bg-color="primary">
              <v-tab v-for="category in categories" :key="category" :value="category">
                {{ formatCategoryName(category) }}
              </v-tab>
            </v-tabs>
            
            <v-window v-model="activeTab" class="mt-5">
              <v-window-item
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                <v-alert v-if="!getSettingsByCategory(category).length" type="info" class="mb-4">
                  Tidak ada pengaturan di kategori ini
                </v-alert>
                
                <template v-else>
                  <!-- Loading Indicator -->
                  <div v-if="loading" class="d-flex justify-center ma-4">
                    <v-progress-circular indeterminate color="primary" size="64" width="5"></v-progress-circular>
                  </div>

                  <!-- Settings List -->
                  <v-expansion-panels v-else>
                    <v-expansion-panel
                      v-for="setting in getSettingsByCategory(category)"
                      :key="setting.key"
                    >
                      <v-expansion-panel-title>
                        <div>
                          <strong>{{ setting.key }}</strong>
                          <div class="text-caption text-grey">{{ setting.description || 'Tidak ada deskripsi' }}</div>
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-form @submit.prevent="updateSetting(setting)">
                          <v-row>
                            <v-col cols="12" md="6">
                              <!-- Input berdasarkan tipe pengaturan -->
                              <div v-if="setting.type === 'boolean'">
                                <v-switch
                                  v-model="setting.value"
                                  :label="setting.value === 'true' ? 'Aktif' : 'Tidak Aktif'"
                                  color="primary"
                                  hide-details
                                  class="mb-3"
                                  @change="val => setting.value = String(val)"
                                ></v-switch>
                              </div>
                              
                              <div v-else-if="setting.type === 'number'">
                                <v-text-field
                                  v-model="setting.value"
                                  :label="setting.description || setting.key"
                                  type="number"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                ></v-text-field>
                              </div>
                              
                              <div v-else-if="setting.type === 'password'">
                                <v-text-field
                                  v-model="setting.value"
                                  :label="setting.description || setting.key"
                                  :type="showPassword[setting.key] ? 'text' : 'password'"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                  :append-inner-icon="showPassword[setting.key] ? 'mdi-eye-off' : 'mdi-eye'"
                                  @click:append-inner="showPassword[setting.key] = !showPassword[setting.key]"
                                ></v-text-field>
                              </div>
                              
                              <div v-else-if="setting.type === 'json'">
                                <v-textarea
                                  v-model="setting.value"
                                  :label="setting.description || setting.key"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                  rows="5"
                                  auto-grow
                                ></v-textarea>
                              </div>
                              
                              <div v-else>
                                <v-text-field
                                  v-model="setting.value"
                                  :label="setting.description || setting.key"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                ></v-text-field>
                              </div>
                            </v-col>
                            
                            <v-col cols="12" md="6">
                              <v-select
                                v-model="setting.type"
                                label="Tipe"
                                :items="settingTypes"
                                variant="outlined"
                                hide-details
                                class="mb-3"
                              ></v-select>
                              
                              <v-text-field
                                v-model="setting.category"
                                label="Kategori"
                                variant="outlined"
                                hide-details
                                class="mb-3"
                              ></v-text-field>
                              
                              <v-text-field
                                v-model="setting.description"
                                label="Deskripsi"
                                variant="outlined"
                                hide-details
                                class="mb-3"
                              ></v-text-field>
                              
                              <v-switch
                                v-model="setting.isPublic"
                                label="Publik"
                                color="primary"
                                hide-details
                                class="mb-3"
                              ></v-switch>
                            </v-col>
                          </v-row>
                          
                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                              color="error"
                              variant="text"
                              @click="confirmDeleteSetting(setting)"
                              prepend-icon="mdi-delete"
                            >
                              Hapus
                            </v-btn>
                            <v-btn
                              color="primary"
                              type="submit"
                              :loading="savingSettings[setting.key]"
                              prepend-icon="mdi-content-save"
                            >
                              Simpan
                            </v-btn>
                          </v-card-actions>
                        </v-form>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </template>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog untuk menambah pengaturan baru -->
    <v-dialog v-model="addSettingDialog" max-width="500px">
      <v-card>
        <v-card-title>Tambah Pengaturan Baru</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createSetting">
            <v-text-field
              v-model="newSetting.key"
              label="Key"
              variant="outlined"
              :rules="[v => !!v || 'Key wajib diisi']"
              required
              class="mb-3"
            ></v-text-field>
            
            <v-text-field
              v-model="newSetting.value"
              label="Nilai"
              variant="outlined"
              class="mb-3"
              :type="newSetting.type === 'password' ? (showPassword.new ? 'text' : 'password') : 'text'"
              :append-inner-icon="newSetting.type === 'password' ? (showPassword.new ? 'mdi-eye-off' : 'mdi-eye') : ''"
              @click:append-inner="showPassword.new = !showPassword.new"
            ></v-text-field>
            
            <v-select
              v-model="newSetting.type"
              label="Tipe"
              :items="settingTypes"
              variant="outlined"
              class="mb-3"
            ></v-select>
            
            <v-select
              v-model="newSetting.category"
              label="Kategori"
              :items="categories"
              variant="outlined"
              class="mb-3"
            ></v-select>
            
            <v-text-field
              v-model="newSetting.description"
              label="Deskripsi"
              variant="outlined"
              class="mb-3"
            ></v-text-field>
            
            <v-switch
              v-model="newSetting.isPublic"
              label="Publik"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="addSettingDialog = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="primary"
            @click="createSetting"
            :loading="creatingNewSetting"
          >
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialog konfirmasi hapus -->
    <v-dialog v-model="deleteDialog.show" max-width="400px">
      <v-card>
        <v-card-title>Konfirmasi Hapus</v-card-title>
        <v-card-text>
          Anda yakin ingin menghapus pengaturan "{{ deleteDialog.setting?.key }}"?
          <div class="text-caption mt-2">Tindakan ini tidak dapat dibatalkan.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog.show = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="error"
            @click="deleteSetting"
            :loading="deletingSettings[deleteDialog.setting?.key]"
          >
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar untuk notifikasi -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="snackbar.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Settings',
  
  data() {
    return {
      settings: [],
      categories: ['general', 'telegram', 'payment', 'system'],
      activeTab: 'telegram',
      loading: true,
      showPassword: {},
      savingSettings: {},
      deletingSettings: {},
      
      settingTypes: ['text', 'number', 'boolean', 'json', 'password'],
      
      snackbar: {
        show: false,
        text: '',
        color: 'success'
      },
      
      addSettingDialog: false,
      newSetting: {
        key: '',
        value: '',
        type: 'text',
        category: 'general',
        description: '',
        isPublic: false
      },
      creatingNewSetting: false,
      
      deleteDialog: {
        show: false,
        setting: null
      }
    };
  },
  
  async mounted() {
    await this.fetchSettings();
  },
  
  methods: {
    async fetchSettings() {
      try {
        this.loading = true;
        const response = await axios.get('/api/settings/api');
        
        if (response.data.success) {
          this.settings = response.data.settings;
          
          // Tambahkan kategori baru jika ada
          this.settings.forEach(setting => {
            if (!this.categories.includes(setting.category)) {
              this.categories.push(setting.category);
            }
            
            // Initialize showPassword flags
            this.$set(this.showPassword, setting.key, false);
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        this.showSnackbar('Terjadi kesalahan saat mengambil pengaturan', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    getSettingsByCategory(category) {
      return this.settings.filter(s => s.category === category);
    },
    
    formatCategoryName(category) {
      const words = category.split('_');
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    },
    
    async updateSetting(setting) {
      try {
        this.$set(this.savingSettings, setting.key, true);
        
        const response = await axios.post(`/api/settings/api/${setting.key}`, {
          value: setting.value,
          type: setting.type,
          category: setting.category,
          description: setting.description,
          isPublic: setting.isPublic
        });
        
        if (response.data.success) {
          this.showSnackbar(`Pengaturan "${setting.key}" berhasil diperbarui`, 'success');
          
          // Perbarui pengaturan dalam daftar
          const index = this.settings.findIndex(s => s.key === setting.key);
          if (index !== -1) {
            this.settings[index] = response.data.setting;
          }
          
          // Jika kategori berubah, tambahkan ke daftar kategori jika belum ada
          if (!this.categories.includes(setting.category)) {
            this.categories.push(setting.category);
          }
        }
      } catch (error) {
        console.error(`Error updating setting ${setting.key}:`, error);
        this.showSnackbar(`Gagal memperbarui pengaturan: ${error.response?.data?.message || error.message}`, 'error');
      } finally {
        this.$set(this.savingSettings, setting.key, false);
      }
    },
    
    openAddSettingDialog() {
      this.addSettingDialog = true;
      this.newSetting = {
        key: '',
        value: '',
        type: 'text',
        category: 'general',
        description: '',
        isPublic: false
      };
      this.$set(this.showPassword, 'new', false);
    },
    
    async createSetting() {
      if (!this.newSetting.key) {
        this.showSnackbar('Key pengaturan wajib diisi', 'error');
        return;
      }
      
      try {
        this.creatingNewSetting = true;
        
        const response = await axios.post('/api/settings/api', this.newSetting);
        
        if (response.data.success) {
          this.showSnackbar(`Pengaturan "${this.newSetting.key}" berhasil dibuat`, 'success');
          
          // Tambahkan pengaturan baru ke daftar
          this.settings.push(response.data.setting);
          
          // Jika kategori baru, tambahkan ke daftar kategori
          if (!this.categories.includes(this.newSetting.category)) {
            this.categories.push(this.newSetting.category);
          }
          
          // Reset form dan tutup dialog
          this.addSettingDialog = false;
        }
      } catch (error) {
        console.error('Error creating setting:', error);
        this.showSnackbar(`Gagal membuat pengaturan: ${error.response?.data?.message || error.message}`, 'error');
      } finally {
        this.creatingNewSetting = false;
      }
    },
    
    confirmDeleteSetting(setting) {
      this.deleteDialog = {
        show: true,
        setting: setting
      };
    },
    
    async deleteSetting() {
      const setting = this.deleteDialog.setting;
      
      try {
        this.$set(this.deletingSettings, setting.key, true);
        
        const response = await axios.delete(`/api/settings/api/${setting.key}`);
        
        if (response.data.success) {
          this.showSnackbar(`Pengaturan "${setting.key}" berhasil dihapus`, 'success');
          
          // Hapus pengaturan dari daftar
          const index = this.settings.findIndex(s => s.key === setting.key);
          if (index !== -1) {
            this.settings.splice(index, 1);
          }
          
          // Tutup dialog konfirmasi
          this.deleteDialog.show = false;
        }
      } catch (error) {
        console.error(`Error deleting setting ${setting.key}:`, error);
        this.showSnackbar(`Gagal menghapus pengaturan: ${error.response?.data?.message || error.message}`, 'error');
      } finally {
        this.$set(this.deletingSettings, setting.key, false);
      }
    },
    
    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color
      };
      
      // Auto-hide snackbar after 5 seconds
      setTimeout(() => {
        this.snackbar.show = false;
      }, 5000);
    }
  }
};
</script>
