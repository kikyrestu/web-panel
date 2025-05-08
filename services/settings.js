// Settings service
const { Setting } = require('../models');

/**
 * Cache untuk menyimpan pengaturan yang sering diakses
 * agar tidak perlu mengakses database setiap kali
 */
const settingsCache = {
  values: {},
  expires: {}
};

/**
 * Mendapatkan nilai pengaturan dari database
 * @param {string} key - Kunci pengaturan
 * @param {any} defaultValue - Nilai default jika pengaturan tidak ditemukan
 * @param {boolean} useCache - Menggunakan cache jika tersedia
 * @param {number} cacheTTL - Waktu cache dalam milidetik (default: 5 menit)
 */
async function getSetting(key, defaultValue = null, useCache = true, cacheTTL = 5 * 60 * 1000) {
  try {
    // Cek cache jika useCache = true
    if (useCache && 
        settingsCache.values.hasOwnProperty(key) && 
        settingsCache.expires[key] > Date.now()) {
      return settingsCache.values[key];
    }
    
    // Ambil dari database jika tidak ada di cache atau cache kadaluwarsa
    const value = await Setting.getSetting(key, defaultValue);
    
    // Simpan ke cache dengan TTL
    if (useCache) {
      settingsCache.values[key] = value;
      settingsCache.expires[key] = Date.now() + cacheTTL;
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Memperbarui nilai pengaturan di database
 * @param {string} key - Kunci pengaturan
 * @param {any} value - Nilai baru
 * @param {object} options - Opsi tambahan (type, category, dll)
 */
async function updateSetting(key, value, options = {}) {
  try {
    const result = await Setting.updateSetting(key, value, options);
    
    // Perbarui cache jika pengaturan ada di cache
    if (settingsCache.values.hasOwnProperty(key)) {
      // Parse nilai berdasarkan tipe
      let parsedValue = value;
      if (options.type === 'number') {
        parsedValue = parseFloat(value);
      } else if (options.type === 'boolean') {
        parsedValue = value === 'true' || value === true;
      } else if (options.type === 'json') {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      }
      
      settingsCache.values[key] = parsedValue;
      settingsCache.expires[key] = Date.now() + 5 * 60 * 1000; // Refresh TTL
    }
    
    return result;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

/**
 * Mendapatkan semua pengaturan berdasarkan kategori
 * @param {string} category - Kategori pengaturan (opsional)
 */
async function getSettingsByCategory(category = null) {
  try {
    return await Setting.getSettingsByCategory(category);
  } catch (error) {
    console.error('Error getting settings by category:', error);
    return [];
  }
}

/**
 * Membersihkan cache pengaturan
 * @param {string} key - Kunci pengaturan (jika tidak ada, semua cache akan dibersihkan)
 */
function clearCache(key = null) {
  if (key) {
    delete settingsCache.values[key];
    delete settingsCache.expires[key];
  } else {
    settingsCache.values = {};
    settingsCache.expires = {};
  }
}

/**
 * Inisialisasi pengaturan dari env jika belum ada di database
 */
async function initSettings() {
  try {
    await Setting.initDefaults();
    console.log('Settings initialized');
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

module.exports = {
  getSetting,
  updateSetting,
  getSettingsByCategory,
  clearCache,
  initSettings
};
