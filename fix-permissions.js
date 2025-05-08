// Script untuk menampilkan instruksi perbaikan permission database
require('dotenv').config();

// Ambil konfigurasi database dari environment variables
const DB_NAME = process.env.DB_NAME || 'hosting_bot';
const DB_USER = process.env.DB_USER || 'postgres';

console.log('======================================================');
console.log('PERBAIKAN PERMISSION DATABASE POSTGRESQL');
console.log('======================================================');
console.log('\nMasalah: User database tidak memiliki permission yang cukup pada schema public');
console.log('\nSolusi lengkap untuk PostgreSQL (jalankan sebagai superuser):');

console.log('\nMetode 1: Jalankan perintah ini satu persatu di terminal:');
console.log(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};"`);
console.log(`sudo -u postgres psql -d ${DB_NAME} -c "ALTER USER ${DB_USER} CREATEDB;"`);

console.log('\nMetode 2: Masuk ke PostgreSQL dan jalankan perintah secara interaktif:');
console.log('1. Masuk ke PostgreSQL:');
console.log('   sudo -u postgres psql');
console.log('\n2. Sambungkan ke database spesifik:');
console.log(`   \\c ${DB_NAME}`);
console.log('\n3. Jalankan perintah-perintah SQL berikut:');
console.log(`   GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`);
console.log(`   GRANT ALL ON SCHEMA public TO ${DB_USER};`);
console.log(`   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};`);
console.log(`   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};`);
console.log(`   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};`);
console.log(`   ALTER USER ${DB_USER} CREATEDB;`);
console.log('\n4. Keluar dari PostgreSQL:');
console.log('   \\q');
console.log('\n5. Setelah itu, buka shell PostgreSQL sebagai user database untuk mengecek permission:');
console.log(`   sudo -u postgres psql -d ${DB_NAME} -U ${DB_USER}`);

console.log('\nMetode 3: Coba buat tabel secara manual untuk memastikan permission:');
console.log('   sudo -u postgres psql');
console.log(`   \\c ${DB_NAME}`);
console.log('   CREATE TABLE IF NOT EXISTS "Settings" (');
console.log('     "key" VARCHAR(255) PRIMARY KEY,');
console.log('     "value" TEXT,');
console.log('     "type" VARCHAR(255) DEFAULT \'text\',');
console.log('     "category" VARCHAR(255) DEFAULT \'general\',');
console.log('     "description" TEXT,');
console.log('     "isPublic" BOOLEAN DEFAULT false,');
console.log('     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,');
console.log('     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL');
console.log('   );');
console.log(`   ALTER TABLE "Settings" OWNER TO ${DB_USER};`);

console.log('\n======================================================');
console.log('\nAlternatif terakhir: Gunakan superuser PostgreSQL untuk koneksi database');
console.log('\nJika semua cara di atas tidak berhasil, ubah file .env untuk menggunakan user postgres (superuser):');
console.log('   DB_USER=postgres');
console.log('   DB_PASSWORD=<password_postgres>');
console.log('\nPeringatan: Ini tidak disarankan untuk produksi, tapi bisa membantu untuk debugging\n');

console.log('\nJalankan script perbaikan otomatis dengan:');
console.log('node fix-permissions.js --fix\n');

// Jika argumen --fix diberikan, coba perbaiki permission secara otomatis
if (process.argv.includes('--fix')) {
  const { execSync } = require('child_process');
  
  console.log('Mencoba memperbaiki permission secara otomatis...\n');
  
  try {
    console.log('1. Memberikan hak akses database...');
    execSync(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"`, {stdio: 'inherit'});
    
    console.log('\n2. Memberikan hak akses schema public...');
    execSync(`sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"`, {stdio: 'inherit'});
    
    console.log('\n3. Memberikan hak akses pada semua tabel...');
    execSync(`sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};"`, {stdio: 'inherit'});
    
    console.log('\n4. Mengatur default privileges untuk tabel baru...');
    execSync(`sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"`, {stdio: 'inherit'});
    
    console.log('\n5. Memberikan hak akses pada semua sequences...');
    execSync(`sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};"`, {stdio: 'inherit'});
    
    console.log('\n6. Memberikan hak createdb...');
    execSync(`sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;"`, {stdio: 'inherit'});
    
    console.log('\n7. Membuat tabel Settings secara manual untuk memastikan permission...');
    const createTableCmd = `
    CREATE TABLE IF NOT EXISTS "Settings" (
      "key" VARCHAR(255) PRIMARY KEY,
      "value" TEXT,
      "type" VARCHAR(255) DEFAULT 'text',
      "category" VARCHAR(255) DEFAULT 'general',
      "description" TEXT,
      "isPublic" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE "Settings" OWNER TO ${DB_USER};
    `;
    execSync(`sudo -u postgres psql -d ${DB_NAME} -c "${createTableCmd}"`, {stdio: 'inherit'});
    
    console.log('\nPerbaikan permission selesai! Coba jalankan bot kembali dengan: npm start');
  } catch (error) {
    console.error('\nGagal memperbaiki permission:', error.message);
    console.error('Silakan jalankan perintah secara manual seperti instruksi di atas.');
  }
}