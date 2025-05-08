const { Sequelize } = require('sequelize');
require('dotenv').config();

// Konfigurasi koneksi PostgreSQL dari environment variables
const DB_NAME = process.env.DB_NAME || 'hosting_bot';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// Buat instance Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Fungsi untuk menguji koneksi
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Berhasil terhubung ke PostgreSQL');
  } catch (error) {
    console.error('Kesalahan koneksi PostgreSQL:', error.message);
  }
};

// Panggil fungsi koneksi
testConnection();

// Event handlers untuk proses
process.on('SIGINT', async () => {
  console.log('Menutup koneksi PostgreSQL');
  await sequelize.close();
  process.exit(0);
});

// Export Sequelize instance
module.exports = {
  sequelize,
  Sequelize
};