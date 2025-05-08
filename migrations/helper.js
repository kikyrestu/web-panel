// Helper functions untuk migrasi database
const { sequelize } = require('../db');

/**
 * Mengecek apakah user database memiliki permission pada schema public
 * @returns {Promise<boolean>} true jika user memiliki permission, false jika tidak
 */
async function checkDatabasePermissions() {
  try {
    await sequelize.query('CREATE TABLE IF NOT EXISTS permission_check (id INTEGER);');
    await sequelize.query('DROP TABLE permission_check;');
    return true;
  } catch (error) {
    console.error('Error checking database permissions:', error.message);
    return false;
  }
}

/**
 * Memberikan permission pada schema public kepada user database
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function grantPermissionsToUser() {
  try {
    // Mengambil nama user dari connection string
    const dbConfig = sequelize.config;
    const dbUser = dbConfig.username;
    
    // Mencoba memberikan permission menggunakan superuser
    // Note: Ini mungkin perlu dijalankan secara manual di database sebagai superuser
    console.log(`PENTING: Jalankan query berikut di PostgreSQL sebagai superuser (postgres):
    
    GRANT ALL ON SCHEMA public TO ${dbUser};
    GRANT ALL ON ALL TABLES IN SCHEMA public TO ${dbUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${dbUser};
    
    `);
    
    return false; // Return false karena user biasanya tidak dapat memberikan permission ini sendiri
  } catch (error) {
    console.error('Error granting permissions:', error.message);
    return false;
  }
}

/**
 * Mengecek apakah tabel tertentu sudah ada di database
 * @param {string} tableName Nama tabel yang akan dicek
 * @returns {Promise<boolean>} true jika tabel sudah ada, false jika belum
 */
async function checkIfTableExists(tableName) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      );
    `;
    
    const [result] = await sequelize.query(query, {
      replacements: { tableName: tableName.toLowerCase() },
      type: sequelize.QueryTypes.SELECT
    });
    
    return result.exists;
  } catch (error) {
    console.error(`Error checking if table '${tableName}' exists:`, error.message);
    return false;
  }
}

/**
 * Membuat tabel Settings secara manual jika Sequelize sync gagal
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function createSettingsTableManually() {
  try {
    const tableExists = await checkIfTableExists('Settings');
    
    if (!tableExists) {
      const query = `
        CREATE TABLE IF NOT EXISTS "Settings" (
          "key" VARCHAR(255) PRIMARY KEY,
          "value" TEXT,
          "type" VARCHAR(255) DEFAULT 'text',
          "category" VARCHAR(255) DEFAULT 'general',
          "description" TEXT,
          "isPublic" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `;
      
      await sequelize.query(query);
      console.log('Tabel Settings berhasil dibuat secara manual');
      return true;
    } else {
      console.log('Tabel Settings sudah ada, tidak perlu dibuat lagi');
      return true;
    }
  } catch (error) {
    console.error('Error creating Settings table manually:', error.message);
    return false;
  }
}

module.exports = {
  checkDatabasePermissions,
  grantPermissionsToUser,
  checkIfTableExists,
  createSettingsTableManually
};