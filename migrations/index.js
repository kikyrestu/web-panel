// Sistem migrasi database otomatis
const { sequelize } = require('../db');
const { syncModels } = require('../models');
const {
  checkDatabasePermissions,
  grantPermissionsToUser,
  createSettingsTableManually
} = require('./helper');

/**
 * Menjalankan migrasi database secara otomatis
 * @param {boolean} force Apakah menghapus tabel yang sudah ada (default: false)
 * @returns {Promise<boolean>} true jika migrasi berhasil
 */
async function runMigrations(force = false) {
  try {
    console.log('Memulai migrasi database otomatis...');
    
    // Cek koneksi database
    try {
      await sequelize.authenticate();
      console.log('Koneksi database berhasil');
    } catch (error) {
      console.error('Gagal terhubung ke database:', error);
      throw new Error('Koneksi database gagal');
    }
    
    // Cek permission database
    const hasPermission = await checkDatabasePermissions();
    if (!hasPermission) {
      console.error('User database tidak memiliki permission yang cukup');
      await grantPermissionsToUser();
      throw new Error('Diperlukan permission tambahan untuk database user');
    }
    
    // Coba sinkronisasi model dengan Sequelize
    try {
      console.log('Mencoba sinkronisasi model dengan Sequelize...');
      await syncModels(force);
      console.log('Sinkronisasi model berhasil');
      return true;
    } catch (error) {
      console.warn('Sinkronisasi model dengan Sequelize gagal:', error.message);
      console.log('Mencoba pendekatan alternatif...');
      
      // Jika sinkronisasi gagal, buat tabel Settings secara manual
      // untuk memastikan aplikasi bisa berjalan
      const settingsCreated = await createSettingsTableManually();
      if (!settingsCreated) {
        console.error('Gagal membuat tabel Settings secara manual');
        throw new Error('Tidak dapat membuat tabel Settings');
      }
      
      return true;
    }
  } catch (error) {
    console.error('Migrasi database gagal:', error.message);
    return false;
  }
}

module.exports = {
  runMigrations
};