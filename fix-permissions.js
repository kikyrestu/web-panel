// Script untuk menampilkan instruksi perbaikan permission database
require('dotenv').config();

// Ambil konfigurasi database dari environment variables
const DB_NAME = process.env.DB_NAME || 'hosting_bot';
const DB_USER = process.env.DB_USER || 'postgres';

console.log('======================================================');
console.log('PERBAIKAN PERMISSION DATABASE POSTGRESQL');
console.log('======================================================');
console.log('\nMasalah: User database tidak memiliki permission yang cukup pada schema public');
console.log('\nUntuk memperbaiki masalah ini, jalankan perintah berikut di PostgreSQL sebagai superuser:');
console.log('\n1. Masuk ke PostgreSQL dengan user postgres:');
console.log('   sudo -u postgres psql');
console.log('\n2. Jalankan perintah-perintah SQL berikut:');
console.log(`   GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`);
console.log(`   GRANT ALL ON SCHEMA public TO ${DB_USER};`);
console.log(`   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};`);
console.log('\n3. Keluar dari PostgreSQL:');
console.log('   \\q');
console.log('\n4. Jalankan bot kembali:');
console.log('   npm start');
console.log('\nAtau alternatif lain, jalankan perintah-perintah berikut langsung dari terminal:');
console.log(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"`);
console.log('\nSetelah itu, jalankan bot kembali dengan: npm start');
console.log('======================================================');

// Tambahkan opsi untuk mencoba mengatasi masalah secara otomatis
console.log('\nJika kamu memiliki hak akses SUPERUSER pada PostgreSQL, kamu bisa mencoba menjalankan:');
console.log('node fix-permissions.js --fix\n');

// Jika argumen --fix diberikan, coba perbaiki permission secara otomatis
if (process.argv.includes('--fix')) {
  const { exec } = require('child_process');
  
  console.log('Mencoba memperbaiki permission secara otomatis...');
  
  // Command untuk memberikan permission
  const commands = [
    `GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`,
    `GRANT ALL ON SCHEMA public TO ${DB_USER};`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};`
  ];
  
  // Jalankan command sebagai postgres
  exec(`sudo -u postgres psql -c "${commands.join('; ')}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Gagal memperbaiki permission:', error.message);
      console.error('Silakan jalankan perintah secara manual seperti instruksi di atas.');
      return;
    }
    
    if (stderr) {
      console.error('Error:', stderr);
      return;
    }
    
    console.log('Output PostgreSQL:', stdout);
    console.log('\nPermission berhasil diperbaiki! Coba jalankan bot kembali dengan: npm start');
  });
}