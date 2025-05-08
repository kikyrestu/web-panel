const { Sequelize } = require('sequelize');
require('dotenv').config();

// Konfigurasi koneksi PostgreSQL dari environment variables
const DB_NAME = process.env.DB_NAME || 'telebot_hostsel';
const DB_USER = process.env.DB_USER || 'adminhostselbot';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Kikyrestu089$_!';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';

// Buat instance Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Tambahkan opsi ini untuk mengatasi masalah permission
  dialectOptions: {
    // Menentukan owner schema untuk mengatasi masalah permission
    // pada database yang dibuat oleh superuser
    application_name: "hosting_bot"
  },
  // Tentukan schema path untuk PostgreSQL
  schema: 'public',
  // Jangan ubah nama tabel menjadi bentuk jamak
  define: {
    freezeTableName: true,
    // Gunakan underscore (snake_case) untuk nama kolom
    underscored: false
  }
});

// Fungsi untuk menguji koneksi
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Berhasil terhubung ke PostgreSQL');
    
    // Coba buat tabel pengujian untuk memeriksa permission
    try {
      await sequelize.query('CREATE TABLE IF NOT EXISTS permission_check (id SERIAL PRIMARY KEY);');
      console.log('Berhasil membuat tabel pengujian, permission database OK');
    } catch (permErr) {
      console.error('WARNING: User tidak memiliki permission untuk membuat tabel');
      console.error('Jalankan perintah berikut sebagai superuser PostgreSQL:');
      console.error(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`);
      console.error(`GRANT ALL ON SCHEMA public TO ${DB_USER};`);
      console.error(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};`);
    }
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